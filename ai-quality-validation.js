"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const aiIntelligence = require("./ai-intelligence-layer");
const { AI_QUALITY_TEST_SET, seedAiKnowledgeBase } = require("./ai-knowledge-seed");
const { requestJson } = require("./request-lite");

const BASE_URL = String(process.env.MULLEM_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "super.admin.orlixor.2026@orlixor.ai").trim();
const ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Orlixor#Admin!2026$Secure-9Qv").trim();
const REPORT_PATH = path.join(__dirname, ".tmp", "ai-quality-validation-report.json");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function keywordScore(answer, idealAnswer) {
  const terms = String(idealAnswer || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 3);
  const unique = [...new Set(terms)];
  if (!unique.length) return 0;
  const haystack = String(answer || "").toLowerCase();
  const matches = unique.filter((term) => haystack.includes(term)).length;
  return Math.round((matches * 100) / unique.length);
}

async function startLocalServer() {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });

  for (let index = 0; index < 40; index += 1) {
    try {
      const response = await requestJson(`${BASE_URL}/api/health`, { headers: { Accept: "application/json" } });
      if (response.ok) return { child, getLogs: () => ({ stdout, stderr }) };
    } catch (_) {
      // Wait for the server to bind.
    }
    await wait(500);
  }

  child.kill();
  throw new Error(`Local server did not become ready. stdout=${stdout} stderr=${stderr}`);
}

async function api(pathname, options = {}) {
  const response = await requestJson(`${BASE_URL}${pathname}`, {
    method: options.method || "GET",
    headers: { Accept: "application/json" },
    body: options.body,
    token: options.token
  });
  return { status: response.status, ok: response.ok, payload: response.payload };
}

async function loginAdmin() {
  const result = await api("/api/auth/login", {
    method: "POST",
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      device_name: "ai-quality-validation"
    }
  });
  const token = result.payload?.data?.token || result.payload?.token || "";
  if (!result.ok || !token) {
    throw new Error(`Admin login failed: ${result.status} ${JSON.stringify(result.payload).slice(0, 400)}`);
  }
  return token;
}

async function runRagDebugChecks(token) {
  const questions = [
    "كم سعر باقة طويق؟",
    "كم XP يوميًا في Spark؟",
    "لماذا لا أستطيع تسجيل الدخول؟",
    "ما الفرق بين النماذج؟",
    "هل يتم حفظ محادثاتي؟",
    "كيف أرفع باقتي؟"
  ];
  const results = [];
  for (const question of questions) {
    const startedAt = Date.now();
    const result = await api("/api/admin/ai-rag-debug", {
      method: "POST",
      token,
      body: { question, dry_run: true }
    });
    const data = result.payload?.data || {};
    results.push({
      question,
      status: result.status,
      ok: result.ok,
      model: data.model?.key || "",
      used_rag: Array.isArray(data.sources) && data.sources.length > 0,
      sources: (data.sources || []).map((source) => ({
        title: source.title,
        rank_score: source.rank_score,
        similarity: source.similarity
      })),
      latency_ms: Date.now() - startedAt,
      answer: data.answer || ""
    });
  }
  return results;
}

async function runQualitySet(token) {
  const rows = [];
  for (const item of AI_QUALITY_TEST_SET) {
    const startedAt = Date.now();
    const analysis = aiIntelligence.analyzeRequest({ message: item.question, requestedModel: "pro" });
    const result = await api("/api/admin/ai-rag-debug", {
      method: "POST",
      token,
      body: { question: item.question, dry_run: true }
    });
    const data = result.payload?.data || {};
    const sources = Array.isArray(data.sources) ? data.sources : [];
    const sourceHit = sources.some((source) => String(source.source_key || "").includes(item.expectedSourceKey)) ||
      sources.some((source) => String(source.id || source.title || "").includes(item.expectedSourceKey)) ||
      sources.some((source) => String(source.title || "").toLowerCase().includes(String(item.expectedSourceKey || "").replace(/^kb-/, "").split("-")[0]));
    const answerQuality = keywordScore(`${data.answer || ""}\n${sources.map((source) => source.content || source.title || "").join("\n")}`, item.idealAnswer);
    rows.push({
      id: item.id,
      question: item.question,
      ideal_answer: item.idealAnswer,
      expected_source_key: item.expectedSourceKey,
      status: result.status,
      model: data.model?.key || (analysis.needsReasoning ? "pro" : "orlixor"),
      task_type: analysis.taskType,
      used_rag: sources.length > 0,
      retrieved_sources: sources.map((source) => source.title || ""),
      source_hit: sourceHit,
      quality_score: answerQuality,
      estimated_input_tokens: Number(data.usage?.input_tokens || aiIntelligence.estimateTokens(item.question)),
      estimated_output_tokens: Number(data.usage?.output_tokens || aiIntelligence.estimateTokens(item.idealAnswer)),
      estimated_cost_tokens: Number(data.usage?.input_tokens || 0) + Number(data.usage?.output_tokens || 0),
      latency_ms: Date.now() - startedAt
    });
  }
  return rows;
}

async function runAdminReviewFlow(token) {
  const feedback = await api("/api/messages/0/feedback", {
    method: "POST",
    token,
    body: {
      feedback: "excellent",
      model_key: "pro",
      provider: "deepseek",
      task_type: "support",
      question_type: "question",
      input_text: "كيف أختار باقة مناسبة؟",
      output_text: "اختر Spark للاستخدام الخفيف، Tuwaiq للاستخدام المتوسط، وPioneer للاستخدام العالي."
    }
  });
  const review = await api("/api/admin/ai-review?status=pending", { token });
  const first = (review.payload?.data?.items || [])[0] || null;
  let approve = null;
  let reject = null;
  if (first?.id) {
    approve = await api(`/api/admin/ai-review/${encodeURIComponent(String(first.id))}/approve`, {
      method: "POST",
      token,
      body: {
        input_text: first.input_text,
        ideal_output: `${first.ideal_output}\nتمت مراجعته واعتماده من اختبار الجودة.`,
        title: "اختيار الباقة المناسبة",
        tags: ["plans", "excellent_answer", "validation"]
      }
    });
  }
  const rejectedCandidate = await api("/api/messages/0/feedback", {
    method: "POST",
    token,
    body: {
      feedback: "save_worthy",
      model_key: "orlixor",
      provider: "deepseek",
      task_type: "general",
      question_type: "question",
      input_text: "مثال يجب رفضه",
      output_text: "هذه إجابة اختبارية للرفض."
    }
  });
  const reviewAfter = await api("/api/admin/ai-review?status=pending", { token });
  const rejectTarget = (reviewAfter.payload?.data?.items || []).find((item) => String(item.input_text || "").includes("مثال يجب رفضه")) || null;
  if (rejectTarget?.id) {
    reject = await api(`/api/admin/ai-review/${encodeURIComponent(String(rejectTarget.id))}/reject`, {
      method: "POST",
      token,
      body: { admin_note: "Rejected by validation test" }
    });
  }
  return {
    feedback_status: feedback.status,
    candidate_found: Boolean(first?.id),
    approve_status: approve?.status || null,
    rejected_feedback_status: rejectedCandidate.status,
    reject_status: reject?.status || null
  };
}

async function runSafetyChecks(token) {
  const noAuth = await api("/api/admin/ai-intelligence");
  const analytics = await api("/api/admin/ai-intelligence", { token });
  const draft = await api("/api/admin/ai-knowledge", {
    method: "POST",
    token,
    body: {
      title: "Draft private validation source",
      category: "validation",
      status: "draft",
      source: "validation",
      tags: ["draft_secret"],
      content: "DRAFT_ONLY_SECRET should never appear in RAG."
    }
  });
  const rejected = await api("/api/admin/ai-knowledge", {
    method: "POST",
    token,
    body: {
      title: "Rejected private validation source",
      category: "validation",
      status: "rejected",
      source: "validation",
      tags: ["rejected_secret"],
      content: "REJECTED_ONLY_SECRET should never appear in RAG."
    }
  });
  const rag = await api("/api/admin/ai-rag-debug", {
    method: "POST",
    token,
    body: { question: "DRAFT_ONLY_SECRET REJECTED_ONLY_SECRET", dry_run: true }
  });
  const ragData = rag.payload?.data || {};
  const ragVisibleContent = JSON.stringify({
    answer: ragData.answer || "",
    sources: ragData.sources || []
  });
  const sanitization = aiIntelligence.sanitizeSensitiveText("email test@example.com key sk-testsecret1234567890 phone +966500000000");
  return {
    no_auth_status: noAuth.status,
    fine_tuning_enabled: Boolean(analytics.payload?.data?.fine_tuning_enabled),
    privacy_sanitization_enabled: Boolean(analytics.payload?.data?.privacy_sanitization_enabled),
    draft_create_status: draft.status,
    rejected_create_status: rejected.status,
    draft_or_rejected_leaked: /DRAFT_ONLY_SECRET|REJECTED_ONLY_SECRET/.test(ragVisibleContent),
    sanitization_changed: sanitization.changed,
    sanitization_findings: sanitization.findings
  };
}

function summarizeReport(report) {
  const total = report.quality_set.length || 1;
  const ragHits = report.quality_set.filter((item) => item.used_rag).length;
  const sourceHits = report.quality_set.filter((item) => item.source_hit).length;
  const avgQuality = Math.round(report.quality_set.reduce((totalScore, item) => totalScore + Number(item.quality_score || 0), 0) / total);
  return {
    rag_working: ragHits > 0,
    retrieval_accuracy_percent: Math.round((sourceHits * 100) / total),
    rag_usage_percent: Math.round((ragHits * 100) / total),
    avg_quality_score: avgQuality,
    knowledge_visible_in_answer: report.rag_debug.every((item) => item.used_rag),
    bugs: []
  };
}

async function main() {
  const { child, getLogs } = await startLocalServer();
  try {
    const token = await loginAdmin();
    const seedStatus = await api("/api/admin/ai-knowledge?status=approved", { token });
    const ragDebug = await runRagDebugChecks(token);
    const qualitySet = await runQualitySet(token);
    const reviewFlow = await runAdminReviewFlow(token);
    const safety = await runSafetyChecks(token);
    const report = {
      generated_at: new Date().toISOString(),
      base_url: BASE_URL,
      seed_sources_count: (seedStatus.payload?.data?.items || []).length,
      rag_debug: ragDebug,
      quality_set: qualitySet,
      admin_review_flow: reviewFlow,
      safety,
      summary: null,
      server_logs: getLogs()
    };
    report.summary = summarizeReport(report);
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify({
      report_path: REPORT_PATH,
      summary: report.summary,
      admin_review_flow: reviewFlow,
      safety
    }, null, 2));
  } finally {
    child.kill();
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
