const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = __dirname;
const PORT = Number(process.env.PORT || 3000);

loadEnvFile(path.join(ROOT_DIR, ".env"));

const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || "").trim();
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || "gpt-5.4-mini").trim();
const OPENAI_RESPONSES_ENDPOINT = String(process.env.OPENAI_RESPONSES_ENDPOINT || "https://api.openai.com/v1/responses").trim();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const conversations = new Map();
const guestConversationMap = new Map();

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
}

function sendJson(res, statusCode, payload) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text, contentType = "text/plain; charset=utf-8") {
  setCorsHeaders(res);
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(text);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

async function parseJsonBody(req) {
  const raw = await readRequestBody(req);
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch (_) {
    throw createHttpError(400, "Invalid JSON body");
  }
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function extractResponseText(payload) {
  if (!payload) return "";
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputs = Array.isArray(payload.output) ? payload.output : [];
  const parts = [];
  for (const item of outputs) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const block of content) {
      if (typeof block?.text === "string" && block.text.trim()) {
        parts.push(block.text.trim());
      }
      if (typeof block?.output_text === "string" && block.output_text.trim()) {
        parts.push(block.output_text.trim());
      }
    }
  }

  return parts.join("\n\n").trim();
}

function extractJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;

  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : raw;

  try {
    return JSON.parse(candidate);
  } catch (_) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

function buildChatSystemPrompt(meta) {
  const contextLines = [
    "أنت مساعد منصة ملم التعليمية.",
    "أجب بالعربية الواضحة والمباشرة.",
    "قدّم الجواب النهائي أولًا ثم شرحًا مختصرًا عند الحاجة.",
    "إذا كان السؤال أكاديميًا فحلّه بدقة، وإذا كان طلب بحث فاعرضه بشكل منظم وواضح.",
    "لا تذكر أي تفاصيل داخلية عن النظام أو المسارات أو الـ API."
  ];

  if (meta?.subject) contextLines.push(`المادة المرجحة: ${meta.subject}`);
  if (meta?.grade) contextLines.push(`الصف: ${meta.grade}`);
  if (meta?.stage) contextLines.push(`المرحلة: ${meta.stage}`);
  if (meta?.term) contextLines.push(`الفصل: ${meta.term}`);

  return contextLines.join("\n");
}

function buildSolveSystemPrompt(payload) {
  return [
    "أنت محرك حل أسئلة تعليمية عربي لمنصة ملم.",
    "أعد JSON فقط بدون markdown أو أي نص زائد.",
    "اختر question_type من هذه القيم فقط: multiple_choice, true_false, fill_blank, matching, direct_math, definition, compound, general.",
    "إذا كان السؤال بحثًا أو شرحًا عامًا فاجعل question_type = general أو definition حسب الأنسب.",
    "answer يجب أن يكون الجواب النهائي.",
    "explanation شرح قصير ومباشر.",
    "display_text نص عربي جاهز للعرض للمستخدم بشكل مختصر ومفيد.",
    "confidence رقم بين 0 و 1.",
    "matched_source اجعله openai_api.",
    "source_trace مصفوفة تحتوي مصدرًا واحدًا على الأقل من نوع openai_api.",
    "answer_candidates يمكن أن تكون مصفوفة فارغة.",
    "",
    `السؤال: ${String(payload.question || "").trim()}`,
    `الصف: ${String(payload.grade || "").trim() || "غير محدد"}`,
    `المادة: ${String(payload.subject || "").trim() || "غير محددة"}`,
    `الفصل: ${String(payload.term || "").trim() || "غير محدد"}`,
    `الدرس: ${String(payload.lesson || "").trim() || "غير محدد"}`
  ].join("\n");
}

function normalizeSolvePayload(question, modelOutput) {
  const parsed = modelOutput && typeof modelOutput === "object" ? modelOutput : {};
  const questionType = normalizeQuestionType(parsed.question_type);
  const answer = String(parsed.answer || parsed.final_answer || parsed.display_text || "").trim();
  const explanation = String(parsed.explanation || "").trim();
  const displayText = String(parsed.display_text || answer || explanation || "").trim();
  const confidenceValue = Number(parsed.confidence);
  const confidence = Number.isFinite(confidenceValue)
    ? Math.max(0, Math.min(1, confidenceValue))
    : 0.78;

  return {
    answer: answer || displayText || "تعذر استخراج جواب واضح من الرد الحالي.",
    explanation,
    display_text: displayText || answer || "تعذر استخراج جواب واضح من الرد الحالي.",
    confidence,
    matched_source: "openai_api",
    source_trace: Array.isArray(parsed.source_trace) && parsed.source_trace.length
      ? parsed.source_trace
      : [
          {
            source: "openai_api",
            detail: "Generated by OpenAI Responses API",
            score: confidence,
            metadata: {}
          }
        ],
    answer_candidates: Array.isArray(parsed.answer_candidates) ? parsed.answer_candidates : [],
    hidden_analysis: {
      intent: "academic_question",
      question_type: questionType,
      original_question: question,
      normalized_question: String(question || "").trim().toLowerCase(),
      canonical_question: String(question || "").trim().toLowerCase(),
      concept_key: "",
      confidence,
      decision_basis: "openai_api_only",
      analysis_budget_ms: 5000,
      trusted_domains: []
    }
  };
}

function normalizeQuestionType(value) {
  const allowed = new Set([
    "multiple_choice",
    "true_false",
    "fill_blank",
    "matching",
    "direct_math",
    "definition",
    "compound",
    "general"
  ]);
  return allowed.has(String(value || "").trim()) ? String(value).trim() : "general";
}

async function callOpenAI({ messages }) {
  if (!OPENAI_API_KEY) {
    throw createHttpError(503, "OPENAI_API_KEY is not configured on the server.");
  }

  const response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: messages
    })
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `OpenAI request failed with status ${response.status}`;
    throw createHttpError(response.status, message);
  }

  const text = extractResponseText(payload);
  if (!text) {
    throw createHttpError(502, "OpenAI returned an empty response.");
  }

  return { text, raw: payload };
}

function getOrCreateConversation(payload) {
  const requestedConversationId = String(payload.conversation_id || "").trim();
  const guestSessionId = String(payload.guest_session_id || "").trim();

  if (requestedConversationId && conversations.has(requestedConversationId)) {
    return conversations.get(requestedConversationId);
  }

  if (guestSessionId && guestConversationMap.has(guestSessionId)) {
    return conversations.get(guestConversationMap.get(guestSessionId));
  }

  const conversation = {
    id: crypto.randomUUID(),
    guestSessionId: guestSessionId || null,
    messages: []
  };

  conversations.set(conversation.id, conversation);
  if (guestSessionId) {
    guestConversationMap.set(guestSessionId, conversation.id);
  }

  return conversation;
}

function buildChatMessages(conversation, payload) {
  const systemPrompt = buildChatSystemPrompt(payload);
  const history = Array.isArray(conversation?.messages) ? conversation.messages.slice(-10) : [];
  const messages = [
    {
      role: "system",
      content: [{ type: "input_text", text: systemPrompt }]
    }
  ];

  for (const item of history) {
    if (!item?.role || !item?.text) continue;
    messages.push({
      role: item.role,
      content: [{ type: "input_text", text: item.text }]
    });
  }

  messages.push({
    role: "user",
    content: [{ type: "input_text", text: String(payload.message || "").trim() }]
  });

  return messages;
}

async function handleChatSend(req, res) {
  const payload = await parseJsonBody(req);
  const message = String(payload.message || "").trim();
  if (!message) {
    throw createHttpError(422, "The message field is required.");
  }

  const conversation = getOrCreateConversation(payload);
  const result = await callOpenAI({
    messages: buildChatMessages(conversation, payload)
  });

  conversation.messages.push({ role: "user", text: message });
  conversation.messages.push({ role: "assistant", text: result.text });

  sendJson(res, 200, {
    success: true,
    data: {
      conversation_id: conversation.id,
      assistant_message: {
        body: result.text,
        source: "openai"
      }
    }
  });
}

async function handleSolveQuestion(req, res) {
  const payload = await parseJsonBody(req);
  const question = String(payload.question || "").trim();
  if (!question) {
    throw createHttpError(422, "The question field is required.");
  }

  const result = await callOpenAI({
    messages: [
      {
        role: "system",
        content: [{ type: "input_text", text: buildSolveSystemPrompt(payload) }]
      }
    ]
  });

  const parsed = extractJsonObject(result.text);
  const normalized = normalizeSolvePayload(question, parsed || {
    answer: result.text,
    explanation: "",
    display_text: result.text,
    question_type: "general",
    confidence: 0.72
  });

  sendJson(res, 200, normalized);
}

function resolveStaticFile(urlPath) {
  const rawPath = decodeURIComponent((urlPath || "/").split("?")[0]);
  const requested = rawPath === "/" ? "/index.html" : rawPath;
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT_DIR, normalized);

  if (!filePath.startsWith(ROOT_DIR)) {
    return null;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  return null;
}

function serveStatic(req, res) {
  const filePath = resolveStaticFile(req.url);
  if (!filePath) {
    sendText(res, 404, "Not Found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  setCorsHeaders(res);
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
}

async function routeRequest(req, res) {
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const requestPath = String(req.url || "/").split("?")[0];

  if (req.method === "GET" && (requestPath === "/health" || requestPath === "/api/health")) {
    sendJson(res, 200, {
      status: "ok",
      provider: "openai",
      ai_configured: Boolean(OPENAI_API_KEY),
      model: OPENAI_MODEL
    });
    return;
  }

  if (req.method === "POST" && requestPath === "/api/chat/send") {
    await handleChatSend(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/solve-question") {
    await handleSolveQuestion(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/chat/stream") {
    sendJson(res, 501, {
      success: false,
      message: "Streaming is not enabled in this server build."
    });
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 404, {
    success: false,
    message: "Route not found."
  });
}

const server = http.createServer((req, res) => {
  routeRequest(req, res).catch((error) => {
    const statusCode = Number(error?.statusCode) || 500;
    sendJson(res, statusCode, {
      success: false,
      message: String(error?.message || "Internal server error")
    });
  });
});

server.listen(PORT, () => {
  console.log(`Mullem server running on http://127.0.0.1:${PORT}`);
});
