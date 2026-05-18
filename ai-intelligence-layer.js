"use strict";

const crypto = require("crypto");

const SENSITIVE_PATTERNS = [
  { type: "email", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replacement: "[redacted_email]" },
  { type: "api_key", pattern: /\b(?:sk|pk|rk|ghp|gho|github_pat|AIza|xoxb|xoxp)[A-Za-z0-9_\-]{16,}\b/g, replacement: "[redacted_api_key]" },
  { type: "bearer_token", pattern: /\bBearer\s+[A-Za-z0-9._\-+/=]{16,}\b/gi, replacement: "Bearer [redacted_token]" },
  { type: "jwt", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, replacement: "[redacted_token]" },
  { type: "phone", pattern: /(?:\+?\d[\s.-]?){8,16}/g, replacement: "[redacted_phone]" },
  { type: "url", pattern: /\bhttps?:\/\/[^\s<>"')]+/gi, replacement: "[redacted_url]" },
  { type: "address_hint", pattern: /\b(?:street|st\.|road|rd\.|district|building|apartment|address|العنوان|الشارع|الحي)\s*[:：]?\s*[^\n،,.;]{8,120}/gi, replacement: "[redacted_address]" }
];

const FEEDBACK_TYPES = Object.freeze({
  like: { rating: "like", qualityDelta: 8, tags: ["positive"] },
  dislike: { rating: "dislike", qualityDelta: -18, tags: ["negative"] },
  inaccurate: { rating: "dislike", qualityDelta: -35, tags: ["accuracy"] },
  too_long: { rating: "dislike", qualityDelta: -12, tags: ["length", "too_long"] },
  too_short: { rating: "dislike", qualityDelta: -10, tags: ["length", "too_short"] },
  excellent: { rating: "like", qualityDelta: 25, tags: ["excellent", "positive"] },
  save_worthy: { rating: "like", qualityDelta: 22, tags: ["knowledge_candidate", "positive"] },
  code_error: { rating: "dislike", qualityDelta: -32, tags: ["coding", "bug"] },
  solved: { rating: "like", qualityDelta: 18, tags: ["resolved", "positive"] },
  not_solved: { rating: "dislike", qualityDelta: -28, tags: ["unresolved", "negative"] }
});

function normalizeArabic(value) {
  return String(value || "")
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function estimateTokens(value) {
  return Math.max(1, Math.ceil(String(value || "").length / 4));
}

function hashText(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function sanitizeSensitiveText(value) {
  let output = String(value || "");
  const findings = [];
  for (const item of SENSITIVE_PATTERNS) {
    let matched = false;
    output = output.replace(item.pattern, () => {
      matched = true;
      return item.replacement;
    });
    if (matched) findings.push(item.type);
  }
  return {
    text: output.trim(),
    findings: [...new Set(findings)],
    changed: output !== String(value || "")
  };
}

function detectLanguage(message) {
  const text = String(message || "");
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return arabic >= latin ? "ar" : "en";
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function classifyQuestionType(message) {
  const text = normalizeArabic(message);
  if (/[?؟]/.test(text) || /^(ما|ماذا|كيف|لماذا|هل|اين|متي|مين|من)\b/.test(text)) return "question";
  if (includesAny(text, [
    "اعمل لي صورة",
    "اصنع صورة",
    "صمم صورة",
    "ولد صورة",
    "انشئ صورة",
    "أنشئ صورة",
    "ارسم",
    "generate image",
    "create image",
    "create an image",
    "make an image",
    "make me an image",
    "draw me",
    "image generation"
  ])) return "image";
  if (includesAny(text, ["اكتب", "صغ", "انشئ", "سوي", "اكتب لي", "generate", "write"])) return "generation";
  if (includesAny(text, ["حلل", "تحليل", "قارن", "استنتج", "اشرح السبب", "reason", "analyze"])) return "analysis";
  if (includesAny(text, ["لخص", "تلخيص", "اختصر", "summary", "summarize"])) return "summary";
  if (includesAny(text, ["صحح", "راجع", "حسن", "rewrite", "correct"])) return "revision";
  if (includesAny(text, ["كود", "برمج", "خطا", "bug", "code", "function", "api", "server", "frontend"])) return "coding";
  return "general";
}

function analyzeRequest(input = {}) {
  const message = String(input.message || "");
  const text = normalizeArabic(message);
  const tokenEstimate = estimateTokens(message);
  const attachmentCount = Math.max(0, Number(input.attachmentCount || 0));
  const requestedModel = String(input.requestedModel || "").trim().toLowerCase();
  const questionType = classifyQuestionType(message);
  const needsCoding = questionType === "coding" || includesAny(text, [
    "javascript", "node", "react", "css", "html", "sql", "database", "render", "github", "باكند", "فرونت", "كود", "برمج"
  ]);
  const needsReasoning = attachmentCount > 0 || tokenEstimate > 1200 || questionType === "analysis" || includesAny(text, [
    "حلل", "استنتج", "منطقي", "reasoning", "خطة", "مشكله", "سبب", "قارن"
  ]);
  const needsCreativity = questionType === "generation" || includesAny(text, [
    "ابداعي", "اعلان", "تسويق", "سيناريو", "مقال", "creative", "brand", "copy"
  ]);
  const needsSpeed = requestedModel === "turbo" || tokenEstimate < 180 || includesAny(text, [
    "سريع", "باختصار", "مختصر", "quick", "short"
  ]);
  const taskType = needsCoding
    ? "coding"
    : needsCreativity
      ? "creative"
      : needsReasoning
        ? "reasoning"
        : questionType;

  return {
    taskType,
    questionType,
    language: detectLanguage(message),
    tokenEstimate,
    size: tokenEstimate > 2500 ? "large" : tokenEstimate > 900 ? "medium" : "small",
    needsReasoning,
    needsCoding,
    needsCreativity,
    needsSpeed,
    needsRetrieval: tokenEstimate > 80 || needsReasoning || needsCoding || questionType !== "general",
    promptKey: `ai:${taskType}:${detectLanguage(message)}:v1`
  };
}

function normalizeFeedbackType(value) {
  const raw = normalizeArabic(value).replace(/[\s-]+/g, "_");
  const aliases = {
    accurate: "like",
    helpful: "like",
    not_helpful: "dislike",
    incorrect: "inaccurate",
    "غير_دقيق": "inaccurate",
    "طويل": "too_long",
    "طويل_جدا": "too_long",
    "قصير": "too_short",
    "قصير_جدا": "too_short",
    "ممتاز": "excellent",
    "مفيد_للحفظ": "save_worthy",
    "خطا_برمجي": "code_error",
    "تم_الحل": "solved",
    "لم_يتم_الحل": "not_solved"
  };
  const key = aliases[raw] || raw;
  return FEEDBACK_TYPES[key] ? key : "";
}

function normalizeFeedback(value) {
  const type = normalizeFeedbackType(value);
  if (!type) return null;
  return {
    type,
    ...FEEDBACK_TYPES[type]
  };
}

function scoreResponse(input = {}) {
  const usage = input.usage || {};
  const feedback = input.feedback ? normalizeFeedback(input.feedback) : null;
  const latencyMs = Math.max(0, Number(input.latencyMs || 0));
  const inputTokens = Math.max(0, Number(usage.input_tokens || usage.prompt_tokens || 0));
  const outputTokens = Math.max(0, Number(usage.output_tokens || usage.completion_tokens || 0));
  const answerLength = String(input.answer || "").trim().length;
  const costTokens = inputTokens + outputTokens;

  let accuracyScore = feedback?.tags?.includes("accuracy") ? 45 : 78;
  let lengthScore = 82;
  if (feedback?.tags?.includes("too_long")) lengthScore = 45;
  if (feedback?.tags?.includes("too_short")) lengthScore = 50;
  if (!answerLength) lengthScore = 0;
  if (answerLength > 4500) lengthScore = Math.min(lengthScore, 55);

  const speedScore = latencyMs
    ? Math.max(25, Math.min(100, 100 - Math.round(latencyMs / 350)))
    : 75;
  const costScore = Math.max(20, Math.min(100, 100 - Math.round(costTokens / 300)));
  const satisfactionScore = Math.max(0, Math.min(100, 72 + Number(feedback?.qualityDelta || 0)));
  const baseScore = Math.round(
    accuracyScore * 0.32 +
    lengthScore * 0.18 +
    speedScore * 0.14 +
    satisfactionScore * 0.26 +
    costScore * 0.10
  );

  return {
    qualityScore: Math.max(0, Math.min(100, baseScore)),
    accuracyScore,
    lengthScore,
    speedScore,
    satisfactionScore,
    costScore,
    tokenCost: costTokens
  };
}

function buildDynamicSystemPrompt(input = {}) {
  const analysis = input.analysis || {};
  const sections = [
    input.basePrompt,
    input.audiencePrompt,
    `Prompt key: ${analysis.promptKey || "ai:general:ar:v1"}.`,
    `Task type: ${analysis.taskType || "general"}.`,
    "Always answer the latest user message in the conversation. Treat older messages as context only, and never repeat an answer to an earlier prompt unless the latest user message explicitly asks for it.",
    "Use only relevant memory and retrieved context. Never reveal internal routing, costs, keys, or provider names.",
    "If retrieved context is insufficient, answer from general reasoning and say when information may need verification."
  ];

  if (analysis.needsCoding) {
    sections.push("For coding tasks: give the fix first, include concise code when useful, and mention assumptions clearly.");
  }
  if (analysis.needsReasoning) {
    sections.push("For reasoning tasks: structure the answer, state the conclusion, then provide concise supporting steps.");
  }
  if (analysis.needsCreativity) {
    sections.push("For creative tasks: keep the tone polished, vivid, and suitable for the user's audience.");
  }
  if (analysis.needsSpeed) {
    sections.push("Prefer a short direct answer unless the user asks for detail.");
  }
  if (input.ragContext) {
    sections.push(`Retrieved knowledge context:\n${input.ragContext}`);
  }
  return sections.filter(Boolean).join("\n\n");
}

function rankKnowledgeSources(sources = [], analysis = {}) {
  const now = Date.now();
  return (Array.isArray(sources) ? sources : [])
    .map((source) => {
      const quality = Number(source.quality_score || source.qualityScore || 50);
      const feedback = Number(source.feedback_score || source.feedbackScore || 0);
      const similarity = Number(source.similarity || source.keyword_score || source.keywordScore || 0);
      const createdAt = new Date(source.updated_at || source.created_at || 0).getTime();
      const ageDays = Number.isFinite(createdAt) && createdAt > 0 ? Math.max(0, (now - createdAt) / 86400000) : 999;
      const recency = Math.max(0, 20 - Math.min(20, ageDays / 7));
      const taskBoost = source.task_type && source.task_type === analysis.taskType ? 8 : 0;
      const score = similarity * 0.45 + quality * 0.30 + feedback * 0.10 + recency + taskBoost;
      return { ...source, rank_score: Number(score.toFixed(4)) };
    })
    .sort((a, b) => Number(b.rank_score || 0) - Number(a.rank_score || 0));
}

function formatKnowledgeContext(sources = [], limit = 5) {
  return (Array.isArray(sources) ? sources : [])
    .slice(0, limit)
    .map((source, index) => {
      const title = String(source.title || source.source_title || `Source ${index + 1}`).trim();
      const content = String(source.content || source.chunk_text || source.text || "").replace(/\s+/g, " ").trim();
      if (!content) return "";
      return `${index + 1}. ${title}: ${content.slice(0, 900)}`;
    })
    .filter(Boolean)
    .join("\n");
}

function buildTrainingCandidate(input = {}) {
  const sanitizedInput = sanitizeSensitiveText(input.inputText || "");
  const sanitizedOutput = sanitizeSensitiveText(input.outputText || "");
  if (!sanitizedInput.text || !sanitizedOutput.text) return null;
  return {
    input_text: sanitizedInput.text,
    ideal_output: sanitizedOutput.text,
    task_type: input.taskType || "general",
    model_key: input.modelKey || "",
    quality_score: Math.max(0, Math.min(100, Number(input.qualityScore || 0))),
    approved_by_admin: false,
    privacy_findings: [...new Set([...sanitizedInput.findings, ...sanitizedOutput.findings])],
    fingerprint: hashText(`${sanitizedInput.text}\n---\n${sanitizedOutput.text}`)
  };
}

module.exports = {
  FEEDBACK_TYPES,
  analyzeRequest,
  buildDynamicSystemPrompt,
  buildTrainingCandidate,
  estimateTokens,
  formatKnowledgeContext,
  hashText,
  normalizeFeedback,
  normalizeFeedbackType,
  rankKnowledgeSources,
  sanitizeSensitiveText,
  scoreResponse
};
