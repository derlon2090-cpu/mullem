"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { requestJson } = require("./request-lite");

const BASE_URL = String(process.env.MULLEM_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "super.admin.orlixor.2026@orlixor.ai").trim();
const ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Orlixor#Admin!2026$Secure-9Qv").trim();
const REPORT_PATH = path.join(__dirname, ".tmp", "ai-launch-readiness-report.json");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(pathname, options = {}) {
  const response = await requestJson(`${BASE_URL}${pathname}`, {
    method: options.method || "GET",
    headers: { Accept: "application/json" },
    body: options.body,
    token: options.token
  });
  return { status: response.status, ok: response.ok, payload: response.payload };
}

async function serverReady() {
  try {
    return (await request("/api/health")).ok;
  } catch (_) {
    return false;
  }
}

async function startServerIfNeeded() {
  if (await serverReady()) return { owned: false, child: null };
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
  for (let index = 0; index < 50; index += 1) {
    if (await serverReady()) return { owned: true, child, getLogs: () => ({ stdout, stderr }) };
    await wait(400);
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
      device_name: "ai-launch-readiness"
    }
  });
  const token = result.payload?.data?.token || result.payload?.token || "";
  if (!result.ok || !token) {
    throw new Error(`Admin login failed: ${result.status} ${JSON.stringify(result.payload).slice(0, 400)}`);
  }
  return token;
}

async function main() {
  const server = await startServerIfNeeded();
  try {
    const token = await loginAdmin();
    const before = await request("/api/admin/ai-launch-monitor", { token });
    const enable = await request("/api/admin/ai-safe-mode", {
      method: "POST",
      token,
      body: { enabled: true }
    });
    const afterEnable = await request("/api/admin/ai-launch-monitor", { token });
    const disable = await request("/api/admin/ai-safe-mode", {
      method: "POST",
      token,
      body: { enabled: false }
    });
    const reset = await request("/api/admin/ai-safe-mode", {
      method: "POST",
      token,
      body: { enabled: null }
    });
    const afterReset = await request("/api/admin/ai-launch-monitor", { token });
    const unauth = await request("/api/admin/ai-launch-monitor");

    const launch = afterReset.payload?.data || before.payload?.data || {};
    const report = {
      generated_at: new Date().toISOString(),
      base_url: BASE_URL,
      monitor_status: before.status,
      unauth_status: unauth.status,
      safe_mode_toggle: {
        enable_status: enable.status,
        active_after_enable: Boolean(afterEnable.payload?.data?.safe_mode?.active),
        disable_status: disable.status,
        reset_status: reset.status,
        active_after_reset: Boolean(afterReset.payload?.data?.safe_mode?.active)
      },
      readiness: launch.readiness || null,
      env: launch.env || null,
      alerts: launch.alerts || [],
      fine_tuning_enabled: Boolean(launch.fine_tuning_enabled),
      production_matrix: {
        free: "requires live Free user smoke test after deploy",
        spark: "requires live Spark user smoke test after deploy",
        tuwaiq: "requires live Tuwaiq user smoke test after deploy",
        pioneer: "requires live Pioneer user smoke test after deploy",
        normal_question: "covered by RAG dry-run; verify live provider after deploy",
        coding_question: "covered by router/quality tests; verify live provider after deploy",
        rag_question: "covered by RAG quality set",
        daily_limit: "covered by guardrail logic; verify with low test limit in staging",
        safe_mode: "covered by manual toggle"
      }
    };
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify({
      report_path: REPORT_PATH,
      readiness: report.readiness?.status || "unknown",
      can_open_to_users: Boolean(report.readiness?.can_open_to_users),
      critical_issues: report.readiness?.critical_issues || [],
      non_critical_issues: report.readiness?.non_critical_issues || [],
      safe_mode_toggle: report.safe_mode_toggle,
      unauth_status: report.unauth_status
    }, null, 2));
  } finally {
    if (server.owned && server.child) server.child.kill();
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
