"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { requestJson } = require("./request-lite");

const BASE_URL = String(process.env.MULLEM_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "super.admin.orlixor.2026@orlixor.ai").trim();
const ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Orlixor#Admin!2026$Secure-9Qv").trim();
const CONCURRENCY = Math.max(1, Math.min(Number(process.env.ORLIXOR_AI_LOAD_CONCURRENCY || 50), 200));
const REPORT_PATH = path.join(__dirname, ".tmp", "ai-load-test-report.json");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(pathname, options = {}) {
  const startedAt = Date.now();
  const response = await requestJson(`${BASE_URL}${pathname}`, {
    method: options.method || "GET",
    headers: { Accept: "application/json" },
    body: options.body,
    token: options.token
  });
  return {
    status: response.status,
    ok: response.ok,
    latency_ms: Date.now() - startedAt,
    payload: response.payload
  };
}

async function isServerReady() {
  try {
    const result = await request("/api/health");
    return result.ok;
  } catch (_) {
    return false;
  }
}

async function startServerIfNeeded() {
  if (await isServerReady()) return { owned: false, child: null };
  const child = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += String(chunk); });
  child.stderr.on("data", (chunk) => { stderr += String(chunk); });
  for (let index = 0; index < 50; index += 1) {
    if (await isServerReady()) return { owned: true, child, getLogs: () => ({ stdout, stderr }) };
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
      device_name: "ai-load-test"
    }
  });
  const token = result.payload?.data?.token || result.payload?.token || "";
  if (!result.ok || !token) {
    throw new Error(`Admin login failed: ${result.status} ${JSON.stringify(result.payload).slice(0, 400)}`);
  }
  return token;
}

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index];
}

async function runLoad(token) {
  const questions = [
    "كم سعر باقة طويق؟",
    "كم XP يوميًا في Spark؟",
    "لماذا لا أستطيع تسجيل الدخول؟",
    "ما الفرق بين النماذج؟",
    "هل يتم حفظ محادثاتي؟",
    "كيف أرفع باقتي؟"
  ];
  const tasks = Array.from({ length: CONCURRENCY }, (_, index) => request("/api/admin/ai-rag-debug", {
    method: "POST",
    token,
    body: {
      question: `${questions[index % questions.length]} #${index + 1}`,
      dry_run: true
    }
  }).catch((error) => ({
    status: 0,
    ok: false,
    latency_ms: 0,
    payload: { error: error?.message || String(error) }
  })));
  return Promise.all(tasks);
}

async function main() {
  const server = await startServerIfNeeded();
  try {
    const token = await loginAdmin();
    const startedAt = Date.now();
    const results = await runLoad(token);
    const health = await request("/api/admin/ai-health", { token });
    const simulatedSafeMode = await request("/api/admin/ai-health?simulate_safe_mode=1", { token });
    const latencies = results.map((item) => Number(item.latency_ms || 0)).filter(Boolean);
    const failures = results.filter((item) => !item.ok);
    const report = {
      generated_at: new Date().toISOString(),
      base_url: BASE_URL,
      concurrency: CONCURRENCY,
      duration_ms: Date.now() - startedAt,
      requests: results.length,
      failed: failures.length,
      failure_rate_percent: Math.round((failures.length * 10000) / Math.max(1, results.length)) / 100,
      avg_latency_ms: latencies.length ? Math.round(latencies.reduce((total, value) => total + value, 0) / latencies.length) : 0,
      p95_latency_ms: percentile(latencies, 0.95),
      status_codes: results.reduce((acc, item) => {
        const key = String(item.status || 0);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      guardrails: health.payload?.data?.cost_guardrails || null,
      safe_mode: {
        current: health.payload?.data?.safe_mode || null,
        simulation: simulatedSafeMode.payload?.data?.safe_mode || null,
        simulation_active: Boolean(simulatedSafeMode.payload?.data?.safe_mode?.active)
      },
      limits_working: Boolean(health.payload?.data?.cost_guardrails?.budgets),
      safe_mode_working: Boolean(simulatedSafeMode.payload?.data?.safe_mode?.active),
      external_ai_cost: "none; RAG debug dry_run avoids provider calls"
    };
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify({
      report_path: REPORT_PATH,
      requests: report.requests,
      failed: report.failed,
      failure_rate_percent: report.failure_rate_percent,
      avg_latency_ms: report.avg_latency_ms,
      p95_latency_ms: report.p95_latency_ms,
      limits_working: report.limits_working,
      safe_mode_working: report.safe_mode_working
    }, null, 2));
  } finally {
    if (server.owned && server.child) server.child.kill();
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
