"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const BASE_URL = String(process.env.MULLEM_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "super.admin.orlixor.2026@orlixor.ai").trim();
const ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Orlixor#Admin!2026$Secure-9Qv").trim();
const REPORT_PATH = path.join(__dirname, ".tmp", "ai-real-scale-check.json");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(pathname, options = {}) {
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
    payload,
    text
  };
}

async function serverReady() {
  try {
    return (await request("/api/health")).ok;
  } catch (_) {
    return false;
  }
}

async function startServerIfNeeded() {
  if (await serverReady()) return { owned: false, child: null, getLogs: () => ({ stdout: "", stderr: "" }) };
  if (process.env.MULLEM_TEST_BASE_URL) {
    throw new Error(`Production target is not reachable: ${BASE_URL}`);
  }
  const child = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += String(chunk); });
  child.stderr.on("data", (chunk) => { stderr += String(chunk); });
  for (let index = 0; index < 70; index += 1) {
    if (await serverReady()) return { owned: true, child, getLogs: () => ({ stdout, stderr }) };
    await wait(500);
  }
  child.kill();
  throw new Error(`Server did not start. stdout=${stdout.slice(-1000)} stderr=${stderr.slice(-1000)}`);
}

async function loginAdmin() {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      device_name: "ai-real-scale-check"
    }
  });
  const token = result.payload?.data?.token || result.payload?.token || "";
  if (!result.ok || !token) {
    throw new Error(`Admin login failed: ${result.status} ${JSON.stringify(result.payload).slice(0, 400)}`);
  }
  return token;
}

function assertShape(name, condition) {
  if (!condition) throw new Error(`Missing or invalid ${name}`);
}

async function main() {
  const server = await startServerIfNeeded();
  try {
    const health = await request("/api/health");
    assertShape("health", health.ok);

    const unauth = await request("/api/admin/real-scale");
    const streamUnauth = await request("/api/chat/stream", {
      method: "POST",
      body: { message: "hello" }
    });
    const token = await loginAdmin();
    const realScale = await request("/api/admin/real-scale", { token });
    const prometheus = await request("/api/admin/prometheus", {
      token,
      accept: "text/plain"
    });
    const launch = await request("/api/admin/ai-launch-monitor", { token });

    const data = realScale.payload?.data || {};
    assertShape("real scale response", realScale.ok);
    assertShape("real scale redis", data.real_scale?.redis && typeof data.real_scale.redis === "object");
    assertShape("real scale queue", data.real_scale?.queue && typeof data.real_scale.queue === "object");
    assertShape("real scale cache", data.real_scale?.cache && typeof data.real_scale.cache === "object");
    assertShape("real scale providers", data.real_scale?.providers && typeof data.real_scale.providers === "object");
    assertShape("disaster protection", data.disaster_protection && typeof data.disaster_protection === "object");
    assertShape("prometheus metrics", prometheus.status === 200 && /mullem_/i.test(prometheus.text));

    const report = {
      generated_at: new Date().toISOString(),
      base_url: BASE_URL,
      ready: [401, 403].includes(unauth.status) &&
        [401, 403].includes(streamUnauth.status) &&
        realScale.ok &&
        prometheus.status === 200 &&
        launch.ok,
      statuses: {
        health: health.status,
        unauth_real_scale: unauth.status,
        unauth_stream: streamUnauth.status,
        real_scale: realScale.status,
        prometheus: prometheus.status,
        launch: launch.status
      },
      real_scale: {
        redis: data.real_scale.redis,
        queue: data.real_scale.queue,
        cache: data.real_scale.cache,
        providers: data.real_scale.providers,
        streaming: data.real_scale.streaming,
        monitoring: data.real_scale.monitoring,
        embeddings: data.real_scale.embeddings,
        disaster_protection: data.disaster_protection,
        recommendations: data.recommendations || []
      }
    };

    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify({
      ok: report.ready,
      report_path: REPORT_PATH,
      statuses: report.statuses,
      redis_mode: report.real_scale.redis.mode,
      queue_mode: report.real_scale.queue.mode,
      streaming: report.real_scale.streaming,
      monitoring: report.real_scale.monitoring,
      recommendations: report.real_scale.recommendations
    }, null, 2));
    if (!report.ready) process.exitCode = 1;
  } finally {
    if (server.owned && server.child) server.child.kill();
  }
}

main().catch((error) => {
  console.error("AI_REAL_SCALE_CHECK_FAILED", error?.stack || error?.message || error);
  process.exit(1);
});
