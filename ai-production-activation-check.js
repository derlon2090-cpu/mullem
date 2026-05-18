"use strict";

const fs = require("fs");
const path = require("path");

const BASE_URL = String(process.env.MULLEM_TEST_BASE_URL || "https://mullem-spdu.onrender.com").replace(/\/+$/, "");
const ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "super.admin.orlixor.2026@orlixor.ai").trim();
const ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Orlixor#Admin!2026$Secure-9Qv").trim();
const SEND_SENTRY_TEST = String(process.env.AI_SEND_SENTRY_TEST || "").trim() === "1";
const REPORT_PATH = path.join(__dirname, ".tmp", "ai-production-activation-report.json");

async function request(pathname, options = {}) {
  const startedAt = Date.now();
  const response = await fetch(`${BASE_URL}${pathname}`, {
    method: options.method || "GET",
    headers: {
      Accept: options.accept || "application/json",
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (_) {
    payload = { raw: text };
  }
  return {
    status: response.status,
    ok: response.ok && payload?.success !== false && payload?.ok !== false,
    latency_ms: Date.now() - startedAt,
    payload,
    text
  };
}

async function loginAdmin() {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      device_name: "ai-production-activation-check"
    }
  });
  const token = result.payload?.data?.token || result.payload?.token || "";
  if (!result.ok || !token) {
    throw new Error(`Admin login failed: ${result.status} ${JSON.stringify(result.payload).slice(0, 400)}`);
  }
  return token;
}

function status(value) {
  return value ? "ok" : "failed";
}

async function main() {
  const health = await request("/api/health");
  if (!health.ok) {
    throw new Error(`Health check failed: ${health.status} ${JSON.stringify(health.payload).slice(0, 300)}`);
  }
  const token = await loginAdmin();
  const realScale = await request("/api/admin/real-scale", { token });
  const prometheus = await request("/api/admin/prometheus", { token, accept: "text/plain" });
  const launch = await request("/api/admin/ai-launch-monitor", { token });
  const streamUnauth = await request("/api/chat/stream", {
    method: "POST",
    body: { message: "activation streaming auth check" }
  });
  let sentryTest = null;
  if (SEND_SENTRY_TEST) {
    sentryTest = await request("/api/admin/real-scale/sentry-test", {
      method: "POST",
      token,
      body: { confirm: "send_test_error" }
    });
  }

  const data = realScale.payload?.data || {};
  const readiness = data.readiness || {};
  const checks = {
    health: health.ok,
    admin_real_scale: realScale.ok,
    redis_connected: Boolean(readiness.redis_ready),
    worker_running: Boolean(readiness.worker_ready),
    ai_service_running: Boolean(readiness.ai_service_ready),
    streaming_enabled: Boolean(readiness.streaming_ready) && [401, 403].includes(streamUnauth.status),
    prometheus_enabled: prometheus.status === 200 && /mullem_/i.test(prometheus.text),
    sentry_configured: Boolean(readiness.sentry_ready),
    sentry_test_sent: SEND_SENTRY_TEST ? Boolean(sentryTest?.ok && sentryTest?.payload?.data?.sent) : null,
    embeddings_disabled: data.real_scale?.embeddings?.production_ready === false,
    circuit_breakers_enabled: Boolean(data.disaster_protection?.circuit_breakers_enabled),
    fallback_ready: Boolean(readiness.fallback_safe),
    launch_monitor: launch.ok
  };

  const critical = Object.entries(checks)
    .filter(([key, value]) => value === false && !["sentry_test_sent"].includes(key))
    .map(([key]) => key);

  const report = {
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    ready: critical.length === 0,
    critical,
    checks: Object.fromEntries(Object.entries(checks).map(([key, value]) => [key, value === null ? "not_run" : status(value)])),
    latency: {
      health_ms: health.latency_ms,
      real_scale_ms: realScale.latency_ms,
      prometheus_ms: prometheus.latency_ms,
      launch_ms: launch.latency_ms
    },
    real_scale: {
      redis: data.real_scale?.redis || null,
      worker: data.worker || null,
      ai_service: data.ai_service || null,
      queue: data.real_scale?.queue || null,
      streaming: data.real_scale?.streaming || null,
      monitoring: data.real_scale?.monitoring || null,
      embeddings: data.real_scale?.embeddings || null,
      circuit_breakers: data.real_scale?.circuit_breakers || [],
      disaster_protection: data.disaster_protection || null,
      recommendations: data.recommendations || []
    },
    production_errors: launch.payload?.data?.last_ai_errors || [],
    safe_mode: data.safe_mode || null
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({
    ok: report.ready,
    report_path: REPORT_PATH,
    critical: report.critical,
    checks: report.checks,
    latency: report.latency,
    redis: report.real_scale.redis,
    worker: report.real_scale.worker,
    ai_service: report.real_scale.ai_service
  }, null, 2));

  if (!report.ready) process.exitCode = 1;
}

main().catch((error) => {
  console.error("AI_PRODUCTION_ACTIVATION_CHECK_FAILED", error?.stack || error?.message || error);
  process.exit(1);
});
