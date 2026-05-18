"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { requestJson } = require("./request-lite");

const BASE_URL = String(process.env.MULLEM_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "super.admin.orlixor.2026@orlixor.ai").trim();
const ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Orlixor#Admin!2026$Secure-9Qv").trim();
const RUN_LIVE = String(process.env.AI_ALPHA_CHECK_LIVE || "").trim() === "1";
const REPORT_PATH = path.join(__dirname, ".tmp", "ai-alpha-check-report.json");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(pathname, options = {}) {
  return requestJson(`${BASE_URL}${pathname}`, {
    method: options.method || "GET",
    headers: { Accept: "application/json" },
    body: options.body,
    token: options.token
  });
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
  for (let index = 0; index < 70; index += 1) {
    if (await serverReady()) return { owned: true, child };
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
      device_name: "ai-alpha-check"
    }
  });
  const token = result.payload?.data?.token || result.payload?.token || "";
  if (!result.ok || !token) {
    throw new Error(`Admin login failed: ${result.status} ${JSON.stringify(result.payload).slice(0, 400)}`);
  }
  return token;
}

function pass(value) {
  return Boolean(value) ? "pass" : "fail";
}

async function runAlphaCase(token, item) {
  const startedAt = Date.now();
  const result = await request("/api/admin/orlixor-alpha-chat", {
    method: "POST",
    token,
    body: {
      message: item.message,
      model: item.model,
      force_rag: item.forceRag,
      dry_run: !RUN_LIVE
    }
  });
  const data = result.payload?.data || {};
  return {
    name: item.name,
    status: result.status,
    ok: result.ok,
    latency_ms: Date.now() - startedAt,
    model_key: data.model?.key || "",
    provider: data.model?.provider || "",
    rag_attempted: Boolean(data.rag?.attempted),
    rag_used: Boolean(data.rag?.used),
    sources_count: Number(data.rag?.sources_count || 0),
    input_tokens: Number(data.usage?.input_tokens || 0),
    output_tokens: Number(data.usage?.output_tokens || 0),
    cost_estimate_usd: Number(data.cost_estimate_usd || 0),
    route_reason: data.route_reason || "",
    safe_mode_active: Boolean(data.safe_mode?.active),
    has_safe_mode_metadata: Boolean(data.safe_mode && typeof data.safe_mode === "object"),
    has_knowledge_candidate: Boolean(data.knowledge_candidate?.content && data.knowledge_candidate?.status === "draft"),
    has_answer: Boolean(data.answer),
    no_user_conversation_id: !data.conversation_id
  };
}

async function main() {
  const server = await startServerIfNeeded();
  try {
    const token = await loginAdmin();
    const unauth = await request("/api/admin/orlixor-alpha-chat", {
      method: "POST",
      body: { message: "unauth check", dry_run: true }
    });
    const cases = [
      {
        name: "normal",
        model: "alpha",
        message: "Give a concise Orlixor AI Alpha status summary for admins.",
        forceRag: false
      },
      {
        name: "rag",
        model: "alpha",
        message: "How much is the Tuwaiq plan and how much daily XP does Spark include?",
        forceRag: true
      },
      {
        name: "coding",
        model: "pro",
        message: "Suggest a safe implementation pattern for an admin-only AI test endpoint.",
        forceRag: false
      }
    ];
    const results = [];
    for (const item of cases) {
      results.push(await runAlphaCase(token, item));
    }
    const checks = {
      admin_auth_required: [401, 403].includes(unauth.status),
      all_cases_ok: results.every((item) => item.ok),
      answers_returned: results.every((item) => item.has_answer),
      no_user_conversations: results.every((item) => item.no_user_conversation_id),
      model_metadata: results.every((item) => item.model_key && item.provider),
      token_metrics: results.every((item) => item.input_tokens >= 0 && item.output_tokens >= 0),
      route_reason: results.every((item) => item.route_reason.includes("admin_alpha_test")),
      safe_mode_metadata: results.every((item) => item.has_safe_mode_metadata),
      knowledge_candidates: results.every((item) => item.has_knowledge_candidate),
      rag_debug_visible: results.some((item) => item.name === "rag" && item.rag_attempted && item.sources_count > 0)
    };
    const report = {
      generated_at: new Date().toISOString(),
      base_url: BASE_URL,
      live_provider_call: RUN_LIVE,
      checks: Object.fromEntries(Object.entries(checks).map(([key, value]) => [key, pass(value)])),
      failed: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key),
      statuses: {
        unauth: unauth.status,
        cases: Object.fromEntries(results.map((item) => [item.name, item.status]))
      },
      results
    };
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify({
      ok: report.failed.length === 0,
      report_path: REPORT_PATH,
      live_provider_call: RUN_LIVE,
      failed: report.failed,
      checks: report.checks,
      statuses: report.statuses
    }, null, 2));
    if (report.failed.length) process.exitCode = 1;
  } finally {
    if (server.owned && server.child) server.child.kill();
  }
}

main().catch((error) => {
  console.error("AI_ALPHA_CHECK_FAILED", error?.stack || error?.message || error);
  process.exit(1);
});
