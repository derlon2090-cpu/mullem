"use strict";

const fs = require("fs");
const path = require("path");
const { requestJson } = require("./request-lite");

const BASE_URL = String(process.env.MULLEM_TEST_BASE_URL || "https://mullem-spdu.onrender.com").replace(/\/+$/, "");
const ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "super.admin.orlixor.2026@orlixor.ai").trim();
const ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Orlixor#Admin!2026$Secure-9Qv").trim();
const REPORT_PATH = path.join(__dirname, ".tmp", "ai-beta-weekly-report.json");

async function request(pathname, options = {}) {
  const response = await requestJson(`${BASE_URL}${pathname}`, {
    method: options.method || "GET",
    headers: { Accept: "application/json" },
    body: options.body,
    token: options.token
  });
  return { status: response.status, ok: response.ok, payload: response.payload };
}

async function loginAdmin() {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      device_name: "ai-beta-weekly-report"
    }
  });
  const token = result.payload?.data?.token || result.payload?.token || "";
  if (!result.ok || !token) {
    throw new Error(`Admin login failed: ${result.status}`);
  }
  return token;
}

function pickMostCostlyModel(beta) {
  return (beta.cost?.daily_by_model || [])
    .slice()
    .sort((a, b) => Number(b.cost_usd || 0) - Number(a.cost_usd || 0))[0] || null;
}

async function main() {
  const token = await loginAdmin();
  const result = await request("/api/admin/beta-analytics?days=7", { token });
  if (!result.ok) {
    throw new Error(`Beta analytics failed: ${result.status}`);
  }
  const beta = result.payload?.data || {};
  const summary = {
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    ready_for_beta_review: true,
    true_operating_cost_usd: (beta.cost?.by_plan || []).reduce((sum, row) => sum + Number(row.cost_usd || 0), 0),
    most_profitable_plan_candidate: beta.conversion?.most_purchased_plan || null,
    most_expensive_model: pickMostCostlyModel(beta),
    conversion_rate_percent: beta.conversion?.conversion_rate_percent || 0,
    avg_quality: (beta.quality_trends?.daily || [])[0]?.avg_quality || 0,
    users_satisfied_signal: (beta.quality_trends?.model_dissatisfaction || []).length === 0 ? "no_dissatisfaction_recorded" : "review_dissatisfaction_reasons",
    safe_mode_active: Boolean(beta.safe_mode?.active),
    abuse_detected: Number(beta.abuse?.total_events || 0) > 0,
    recommendations: beta.recommendations || []
  };
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify({ summary, beta }, null, 2), "utf8");
  console.log(JSON.stringify({
    report_path: REPORT_PATH,
    conversion_rate_percent: summary.conversion_rate_percent,
    true_operating_cost_usd: summary.true_operating_cost_usd,
    safe_mode_active: summary.safe_mode_active,
    abuse_detected: summary.abuse_detected,
    recommendations: summary.recommendations.slice(0, 5)
  }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
