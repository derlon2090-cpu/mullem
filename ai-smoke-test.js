"use strict";

const fs = require("fs");
const path = require("path");
const { requestJson } = require("./request-lite");

const BASE_URL = String(process.env.MULLEM_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "super.admin.orlixor.2026@orlixor.ai").trim();
const ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Orlixor#Admin!2026$Secure-9Qv").trim();
const RUN_PROVIDER_CHAT = String(process.env.AI_SMOKE_RUN_PROVIDER_CHAT || "").trim() === "1";
const REQUIRE_REAL_SCALE = String(process.env.AI_SMOKE_REQUIRE_REAL_SCALE || "").trim() === "1" ||
  !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(BASE_URL);
const WAIT_SECONDS = Math.max(0, Math.min(Number(process.env.AI_SMOKE_WAIT_SECONDS || 0), 600));
const REPORT_PATH = path.join(__dirname, ".tmp", "ai-smoke-test-report.json");

async function request(pathname, options = {}) {
  return requestJson(`${BASE_URL}${pathname}`, {
    method: options.method || "GET",
    headers: { Accept: options.accept || "application/json" },
    body: options.body,
    token: options.token
  });
}

async function loginAdmin() {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      device_name: "ai-smoke-test"
    }
  });
  const token = result.payload?.data?.token || result.payload?.token || "";
  if (!result.ok || !token) {
    throw new Error(`Admin login failed: ${result.status} ${JSON.stringify(result.payload).slice(0, 400)}`);
  }
  return token;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  const deadline = Date.now() + WAIT_SECONDS * 1000;
  let last = null;
  do {
    try {
      last = await request("/api/health");
      if (last.ok) return last;
    } catch (error) {
      last = { status: 0, ok: false, payload: { error: error?.message || String(error) } };
    }
    if (Date.now() < deadline) await wait(5000);
  } while (Date.now() < deadline);
  return last || { status: 0, ok: false, payload: { error: "HEALTH_NOT_CHECKED" } };
}

function pass(condition) {
  return Boolean(condition) ? "pass" : "fail";
}

async function main() {
  const health = await waitForHealth();
  if (!health.ok) {
    throw new Error(`Health check failed after wait: ${health.status} ${JSON.stringify(health.payload).slice(0, 300)}`);
  }
  const token = await loginAdmin();
  const adminUnauth = await request("/api/admin/ops");
  const ops = await request("/api/admin/ops", { token });
  const realScale = await request("/api/admin/real-scale", { token });
  const rag = await request("/api/admin/ai-rag-debug", {
    method: "POST",
    token,
    body: {
      question: "كم سعر باقة طويق؟",
      dry_run: true
    }
  });
  const safeMode = await request("/api/admin/ai-health?simulate_safe_mode=1", { token });
  const streamAuth = await request("/api/chat/stream", {
    method: "POST",
    body: { message: "streaming auth smoke" }
  });
  const chat = RUN_PROVIDER_CHAT
    ? await request("/api/chat/send", {
        method: "POST",
        token,
        body: { message: "اختبار دخان قصير. أجب بجملة واحدة.", selected_model: "orlixor" }
      })
    : { status: 0, ok: true, payload: { skipped: true, reason: "Set AI_SMOKE_RUN_PROVIDER_CHAT=1 to test live provider chat." } };

  const real = realScale.payload?.data || {};
  const checks = {
    login: true,
    health: health.ok,
    admin_auth: [401, 403].includes(adminUnauth.status) && ops.ok,
    rag: rag.ok && Array.isArray(rag.payload?.data?.sources),
    chat: chat.ok,
    streaming: [401, 403].includes(streamAuth.status),
    safe_mode: Boolean(safeMode.payload?.data?.safe_mode?.active),
    redis: REQUIRE_REAL_SCALE ? Boolean(real.readiness?.redis_ready) : true,
    worker_heartbeat: REQUIRE_REAL_SCALE ? Boolean(real.readiness?.worker_ready) : true,
    ai_service: REQUIRE_REAL_SCALE ? Boolean(real.readiness?.ai_service_ready) : true,
    feature_flags: Boolean(ops.payload?.data?.feature_flags),
    error_budget: Boolean(ops.payload?.data?.error_budget?.policy)
  };

  const report = {
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    provider_chat_ran: RUN_PROVIDER_CHAT,
    require_real_scale: REQUIRE_REAL_SCALE,
    wait_seconds: WAIT_SECONDS,
    checks: Object.fromEntries(Object.entries(checks).map(([key, value]) => [key, pass(value)])),
    failed: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key),
    statuses: {
      health: health.status,
      admin_unauth: adminUnauth.status,
      ops: ops.status,
      real_scale: realScale.status,
      rag: rag.status,
      safe_mode: safeMode.status,
      stream_auth: streamAuth.status,
      chat: chat.status
    },
    real_scale: {
      redis: real.real_scale?.redis || null,
      worker: real.worker || null,
      ai_service: real.ai_service || null
    }
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({
    ok: report.failed.length === 0,
    report_path: REPORT_PATH,
    failed: report.failed,
    checks: report.checks,
    statuses: report.statuses
  }, null, 2));

  if (report.failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error("AI_SMOKE_TEST_FAILED", error?.stack || error?.message || error);
  process.exit(1);
});
