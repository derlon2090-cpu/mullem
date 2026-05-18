"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const BASE_URL = String(process.env.MULLEM_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "super.admin.orlixor.2026@orlixor.ai").trim();
const ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Orlixor#Admin!2026$Secure-9Qv").trim();
const REPORT_PATH = path.join(__dirname, ".tmp", "ai-scale-growth-check.json");

async function request(pathname, options = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
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
    payload
  };
}

async function loginAdmin() {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      device_name: "ai-scale-growth-check"
    }
  });
  const token = result.payload?.data?.token || "";
  if (!result.ok || !token) {
    throw new Error(`Admin login failed: ${result.status} ${JSON.stringify(result.payload).slice(0, 300)}`);
  }
  return token;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  for (let index = 0; index < 60; index += 1) {
    if (await serverReady()) return { owned: true, child, getLogs: () => ({ stdout, stderr }) };
    await wait(500);
  }
  child.kill();
  throw new Error(`Server did not start. stdout=${stdout.slice(-1000)} stderr=${stderr.slice(-1000)}`);
}

function assertShape(name, condition) {
  if (!condition) throw new Error(`Missing or invalid ${name}`);
}

async function main() {
  const server = await startServerIfNeeded();
  try {
    const health = await request("/api/health");
    assertShape("health", health.ok);

    const unauth = await request("/api/admin/scale-growth");
    const referralUnauth = await request("/api/referrals/me");
    const token = await loginAdmin();
    const scale = await request("/api/admin/scale-growth?days=30", { token });
    assertShape("scale growth response", scale.ok);

    const data = scale.payload?.data || {};
    assertShape("referrals", data.referrals && typeof data.referrals === "object");
    assertShape("scaling", data.scaling && typeof data.scaling === "object");
    assertShape("knowledge expansion", data.knowledge_expansion && typeof data.knowledge_expansion === "object");
    assertShape("reputation", data.reputation && typeof data.reputation === "object");
    assertShape("recommendations", Array.isArray(data.recommendations));

    const report = {
      generated_at: new Date().toISOString(),
      base_url: BASE_URL,
      unauth_status: unauth.status,
      referral_unauth_status: referralUnauth.status,
      scale_status: scale.status,
      ready: [401, 403].includes(unauth.status) &&
        [401, 403].includes(referralUnauth.status) &&
        scale.ok,
      summary: {
        referrals: data.referrals,
        queue: {
          concurrent_requests: data.scaling.concurrent_requests,
          queue_size: data.scaling.queue_size,
          avg_generation_ms: data.scaling.avg_generation_ms,
          fallback_recoveries_since_start: data.scaling.fallback_recoveries_since_start
        },
        reputation: data.reputation,
        recommendations: data.recommendations
      }
    };

    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      ok: report.ready,
      report_path: REPORT_PATH,
      unauth_status: report.unauth_status,
      referral_unauth_status: report.referral_unauth_status,
      scale_status: report.scale_status,
      queue_size: report.summary.queue.queue_size,
      recommendations: report.summary.recommendations
    }, null, 2));
    if (!report.ready) process.exitCode = 1;
  } finally {
    if (server.owned && server.child) server.child.kill();
  }
}

main().catch((error) => {
  console.error("AI_SCALE_GROWTH_CHECK_FAILED", error?.message || error);
  process.exit(1);
});
