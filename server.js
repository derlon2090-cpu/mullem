const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const ROOT_DIR = __dirname;
loadEnvFile(path.join(ROOT_DIR, ".env"));
const PORT = Number(process.env.PORT || 3000);
const IS_CLOUD_RUNTIME = Boolean(
  process.env.RENDER ||
  process.env.RENDER_EXTERNAL_URL ||
  process.env.RENDER_SERVICE_ID ||
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.RAILWAY_PROJECT_ID ||
  process.env.VERCEL
);

function readEnvValue(keys, fallback = "") {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    let value = String(process.env[key] || "").trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).trim();
    }
    if (/^[A-Z0-9_]+\s*=\s*/i.test(value)) {
      value = value.replace(/^[A-Z0-9_]+\s*=\s*/i, "").trim();
    }
    if (value) return value;
  }
  return String(fallback || "").trim();
}

function readEnvNumber(keys, fallback) {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    const raw = String(process.env[key] || "").trim();
    if (!raw) continue;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number(fallback);
}

const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || "").trim();
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
const OPENAI_MODEL_DEFAULT = String(process.env.ORLIXOR_DEFAULT_MODEL || process.env.OPENAI_MODEL_DEFAULT || process.env.OPENAI_MODEL_ORLIXOR || "gpt-4.1-mini").trim();
const OPENAI_MODEL_TURBO = String(process.env.ORLIXOR_TURBO_MODEL || process.env.OPENAI_MODEL_TURBO || "gpt-4.1-nano").trim();
const OPENAI_MODEL_PRO = String(process.env.ORLIXOR_PRO_MODEL || process.env.OPENAI_MODEL_PRO || "gpt-4.1").trim();
const OPENAI_MODEL_CREATIVE = String(process.env.ORLIXOR_CREATIVE_MODEL || process.env.OPENAI_MODEL_CREATIVE || "gpt-4.1-mini").trim();
const OPENAI_MODEL_SEARCH = String(process.env.ORLIXOR_SEARCH_MODEL || process.env.OPENAI_MODEL_SEARCH || OPENAI_MODEL_DEFAULT || "gpt-4.1-mini").trim();
const OPENAI_MODEL_WRITING = String(process.env.ORLIXOR_WRITING_MODEL || process.env.OPENAI_MODEL_WRITING || OPENAI_MODEL_CREATIVE || OPENAI_MODEL_DEFAULT || "gpt-4.1-mini").trim();
const OPENAI_MODEL_TONE = String(process.env.ORLIXOR_TONE_MODEL || process.env.OPENAI_MODEL_TONE || OPENAI_MODEL_WRITING || "gpt-4.1-mini").trim();
const OPENAI_MODEL_EXPAND = String(process.env.ORLIXOR_EXPAND_MODEL || process.env.OPENAI_MODEL_EXPAND || OPENAI_MODEL_WRITING || "gpt-4.1-mini").trim();
const OPENAI_MODEL_SUMMARY = String(process.env.ORLIXOR_SUMMARY_MODEL || process.env.OPENAI_MODEL_SUMMARY || OPENAI_MODEL_WRITING || "gpt-4.1-mini").trim();
const OPENAI_MODEL_CORRECTION = String(process.env.ORLIXOR_CORRECTION_MODEL || process.env.OPENAI_MODEL_CORRECTION || OPENAI_MODEL_WRITING || "gpt-4.1-mini").trim();
const OPENAI_IMAGE_MODEL = String(process.env.OPENAI_IMAGE_MODEL || "dall-e-3").trim();
const OPENAI_RESPONSES_ENDPOINT = String(process.env.OPENAI_RESPONSES_ENDPOINT || "https://api.openai.com/v1/responses").trim();
const OPENAI_EMBEDDINGS_ENDPOINT = String(process.env.OPENAI_EMBEDDINGS_ENDPOINT || "https://api.openai.com/v1/embeddings").trim();
const OPENAI_EMBEDDING_MODEL = String(process.env.ORLIXOR_EMBEDDING_MODEL || process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small").trim();
const ORLIXOR_ENABLE_EMBEDDINGS = /^(1|true|yes|on)$/i.test(String(process.env.ORLIXOR_ENABLE_EMBEDDINGS || "").trim());
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 25000);
const OPENAI_MAX_OUTPUT_TOKENS = Math.max(120, Math.min(Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 900), 2000));
const DB_INIT_TIMEOUT_MS = Math.max(1000, Number(process.env.DB_INIT_TIMEOUT_MS || 8000));
const MAX_BODY_BYTES = Math.max(10_000, Number(process.env.MAX_BODY_BYTES || 1_000_000));
const MAX_MESSAGE_LENGTH = Math.max(200, Number(process.env.MAX_MESSAGE_LENGTH || 4000));
const MAX_QUESTION_LENGTH = Math.max(200, Number(process.env.MAX_QUESTION_LENGTH || 4000));
const MAX_METADATA_LENGTH = Math.max(40, Number(process.env.MAX_METADATA_LENGTH || 120));
const MAX_HISTORY_MESSAGES = Math.max(1, Math.min(Number(process.env.MAX_HISTORY_MESSAGES || 5), 30));
const RATE_LIMIT_WINDOW_MS = Math.max(1000, Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000));
const RATE_LIMIT_CHAT_MAX = Math.max(1, Number(process.env.RATE_LIMIT_CHAT_MAX || 20));
const RATE_LIMIT_SOLVE_MAX = Math.max(1, Number(process.env.RATE_LIMIT_SOLVE_MAX || 20));
const RATE_LIMIT_GENERAL_MAX = Math.max(1, Number(process.env.RATE_LIMIT_GENERAL_MAX || 60));
const SEARCH_XP_COST = Math.max(1, Number(process.env.SEARCH_XP_COST || 10));
const SEARCH_DEEP_XP_COST = Math.max(SEARCH_XP_COST, Number(process.env.SEARCH_DEEP_XP_COST || 15));
const TONE_XP_COST = Math.max(1, Number(process.env.TONE_XP_COST || 5));
const EXPAND_XP_COST = Math.max(1, Number(process.env.EXPAND_XP_COST || process.env.WRITING_EXPAND_XP_COST || 8));
const EXPAND_LONG_XP_COST = Math.max(EXPAND_XP_COST, Number(process.env.EXPAND_LONG_XP_COST || 12));
const SUMMARY_XP_COST = Math.max(1, Number(process.env.SUMMARY_XP_COST || process.env.WRITING_SUMMARIZE_XP_COST || 6));
const SUMMARY_LONG_XP_COST = Math.max(SUMMARY_XP_COST, Number(process.env.SUMMARY_LONG_XP_COST || 10));
const CORRECTION_XP_COST = Math.max(1, Number(process.env.CORRECTION_XP_COST || process.env.WRITING_CORRECTION_XP_COST || 5));
const CORRECTION_STRONG_COST = Math.max(CORRECTION_XP_COST, Number(process.env.CORRECTION_STRONG_COST || 7));
const WRITING_XP_COSTS = Object.freeze({
  rewrite: Math.max(1, Number(process.env.WRITING_REWRITE_XP_COST || 5)),
  tone: Math.max(1, Number(process.env.WRITING_TONE_XP_COST || 5)),
  summarize: Math.max(1, Number(process.env.WRITING_SUMMARIZE_XP_COST || 6)),
  expand: Math.max(1, Number(process.env.WRITING_EXPAND_XP_COST || 8)),
  generate: Math.max(1, Number(process.env.WRITING_GENERATE_XP_COST || 10)),
  longGenerate: Math.max(1, Number(process.env.WRITING_LONG_GENERATE_XP_COST || 15))
});
const CORS_ALLOWED_ORIGINS = String(process.env.CORS_ALLOWED_ORIGINS || "*").trim();
const DEFAULT_ALLOWED_FRONTEND_ORIGINS = [
  "https://orlixor.com",
  "https://www.orlixor.com",
  "https://chatmullem.com",
  "https://www.chatmullem.com",
  "https://mullem.onrender.com",
  "https://mullem-spdu.onrender.com"
];
const DATABASE_URL = readEnvValue(
  [
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
    "POSTGRES_URL_UNPOOLED",
    "DATABASE_URL_UNPOOLED",
    "NEON_DATABASE_URL",
    "NEON_POSTGRES_URL",
    "DATABASE_PRIVATE_URL"
  ],
  ""
);
const DB_HOST = readEnvValue(
  ["PGHOST", "POSTGRES_HOST", "DATABASE_HOST"],
  ""
);
const DB_PORT = readEnvNumber(
  ["PGPORT", "POSTGRES_PORT", "DATABASE_PORT"],
  5432
);
const DB_DATABASE = readEnvValue(
  ["PGDATABASE", "POSTGRES_DATABASE", "DATABASE_NAME"],
  ""
);
const DB_USERNAME = readEnvValue(
  ["PGUSER", "POSTGRES_USER", "DATABASE_USER"],
  ""
);
const DB_PASSWORD = readEnvValue(
  ["PGPASSWORD", "POSTGRES_PASSWORD", "DATABASE_PASSWORD"],
  ""
);
const MAX_NAME_LENGTH = Math.max(20, Number(process.env.MAX_NAME_LENGTH || 160));
const MIN_PASSWORD_LENGTH = Math.max(6, Number(process.env.MIN_PASSWORD_LENGTH || 6));
const PASSWORD_HASH_ITERATIONS = Math.max(60000, Number(process.env.PASSWORD_HASH_ITERATIONS || 120000));
const DEFAULT_ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "admin@mullem.sa").trim().toLowerCase();
const DEFAULT_ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Mullem@2026").trim();
const DEFAULT_ADMIN_NAME = String(process.env.DEFAULT_ADMIN_NAME || "مدير المنصة").trim();
const DEFAULT_STUDENT_EMAIL = String(process.env.DEFAULT_STUDENT_EMAIL || "student@mullem.sa").trim().toLowerCase();
const DEFAULT_STUDENT_PASSWORD = String(process.env.DEFAULT_STUDENT_PASSWORD || "Student@2026").trim();
const DEFAULT_STUDENT_NAME = String(process.env.DEFAULT_STUDENT_NAME || "طالب").trim();
const TEXT_MESSAGE_XP_COST = Math.max(1, Number(process.env.TEXT_MESSAGE_XP_COST || process.env.TEXT_MESSAGE_XP_REWARD || 10));
const IMAGE_GENERATION_XP_COST = Math.max(1, Number(process.env.IMAGE_GENERATION_XP_COST || process.env.IMAGE_MESSAGE_XP_COST || process.env.IMAGE_MESSAGE_XP_REWARD || 15));
const ATTACHMENT_ANALYSIS_XP_COST = Math.max(1, Number(process.env.ATTACHMENT_ANALYSIS_XP_COST || process.env.ATTACHMENT_XP_COST || 15));
const DAILY_LOGIN_XP_REWARD = Math.max(0, Number(process.env.DAILY_LOGIN_XP_REWARD || 5));
const FIRST_SIGNUP_XP = Math.max(0, Number(process.env.FIRST_SIGNUP_XP || 50));
const FREE_MAX_OUTPUT_TOKENS = Math.max(120, Math.min(Number(process.env.FREE_MAX_OUTPUT_TOKENS || 500), 1200));
const FREE_MAX_CONTEXT_TOKENS = Math.max(500, Math.min(Number(process.env.FREE_MAX_CONTEXT_TOKENS || 1500), 6000));
const DAILY_MOTIVATION_BONUS = Math.max(1, Number(process.env.DAILY_MOTIVATION_BONUS || 5));
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_MEMORY_LIMIT = Math.max(1, Math.min(Number(process.env.ACCOUNT_MEMORY_LIMIT || 5), 8));
const ACCOUNT_MEMORY_CANDIDATES = Math.max(ACCOUNT_MEMORY_LIMIT, Math.min(Number(process.env.ACCOUNT_MEMORY_CANDIDATES || 28), 60));
const modelProfiles = {
  orlixor: {
    key: "orlixor",
    name: "Orlixor AI",
    openaiModel: OPENAI_MODEL_DEFAULT || OPENAI_MODEL,
    temperature: 0.5,
    minXpCost: 8,
    maxXpCost: 15,
    maxOutputTokens: Math.min(900, OPENAI_MAX_OUTPUT_TOKENS),
    maxContextTokens: Math.max(FREE_MAX_CONTEXT_TOKENS, 2800),
    systemPrompt: [
      "أنت Orlixor AI، مساعد ذكي متوازن.",
      "أجب بالعربية بوضوح وتنظيم.",
      "استخدم أسلوبًا عمليًا ومختصرًا عند الحاجة.",
      "مناسب للشرح، التلخيص، الكتابة، والأسئلة العامة."
    ].join("\n")
  },
  turbo: {
    key: "turbo",
    name: "Orlixor AI Turbo",
    openaiModel: OPENAI_MODEL_TURBO || OPENAI_MODEL,
    temperature: 0.3,
    minXpCost: 5,
    maxXpCost: 10,
    maxOutputTokens: Math.min(500, OPENAI_MAX_OUTPUT_TOKENS),
    maxContextTokens: Math.min(FREE_MAX_CONTEXT_TOKENS, 1200),
    systemPrompt: [
      "أنت Orlixor AI Turbo.",
      "أجب بسرعة وباختصار.",
      "لا تطل إلا إذا طلب المستخدم التفاصيل.",
      "مناسب للمهام السريعة، التلخيص القصير، وإعادة الصياغة."
    ].join("\n")
  },
  pro: {
    key: "pro",
    name: "Orlixor AI Pro",
    openaiModel: OPENAI_MODEL_PRO || OPENAI_MODEL,
    temperature: 0.4,
    minXpCost: 10,
    maxXpCost: 15,
    maxOutputTokens: Math.min(1400, OPENAI_MAX_OUTPUT_TOKENS),
    maxContextTokens: Math.max(FREE_MAX_CONTEXT_TOKENS, 5000),
    systemPrompt: [
      "أنت Orlixor AI Pro.",
      "قدّم إجابات دقيقة ومنظمة وعميقة.",
      "مناسب للتحليل، البرمجة، الملفات، المقارنات، والخطط.",
      "رتّب الإجابة بعناوين واضحة عند الحاجة."
    ].join("\n")
  },
  creative: {
    key: "creative",
    name: "Orlixor AI Creative",
    openaiModel: OPENAI_MODEL_CREATIVE || OPENAI_MODEL,
    temperature: 0.85,
    minXpCost: 10,
    maxXpCost: 15,
    maxOutputTokens: Math.min(1200, OPENAI_MAX_OUTPUT_TOKENS),
    maxContextTokens: Math.max(FREE_MAX_CONTEXT_TOKENS, 3000),
    systemPrompt: [
      "أنت Orlixor AI Creative.",
      "مهمتك إنتاج محتوى إبداعي وتسويقي عالي الجودة.",
      "اكتب بأسلوب جذاب، واضح، ومناسب للجمهور.",
      "مناسب للمقالات، الإعلانات، العناوين، السكربتات، والأفكار."
    ].join("\n")
  }
};
const MEMORY_STOP_WORDS = new Set([
  "هذا", "هذه", "ذلك", "تلك", "هناك", "هنا", "الذي", "التي", "الى", "إلى", "على", "من", "عن", "في", "مع",
  "ثم", "او", "أو", "كما", "بعد", "قبل", "لقد", "كان", "كانت", "يكون", "يمكن", "عندي", "عندك", "عنده",
  "لدي", "عندي", "انا", "أنا", "انت", "أنت", "هو", "هي", "هم", "نحن", "لك", "له", "لها", "ما", "ماذا",
  "كيف", "متى", "أين", "ليش", "لماذا", "هل", "تم", "إذا", "اذا", "the", "and", "for", "from", "with",
  "that", "this", "what", "when", "where", "your", "have", "about"
]);

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
const rateLimitStore = new Map();
let databaseClient = null;
let databaseState = {
  configured: Boolean(DATABASE_URL || (DB_HOST && DB_DATABASE && DB_USERNAME)),
  connected: false,
  driver: "postgres",
  host: DB_HOST,
  port: DB_PORT,
  database: DB_DATABASE,
  message: "PostgreSQL/Neon has not been initialized yet."
};

function buildDatabaseEnvDiagnostics() {
  const connectionEnvNames = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
    "POSTGRES_URL_UNPOOLED",
    "DATABASE_URL_UNPOOLED",
    "NEON_DATABASE_URL",
    "NEON_POSTGRES_URL",
    "DATABASE_PRIVATE_URL"
  ];
  const discreteEnvNames = ["PGHOST", "PGDATABASE", "PGUSER", "POSTGRES_HOST", "POSTGRES_DATABASE", "POSTGRES_USER"];
  const detectedConnectionEnv = connectionEnvNames.find((name) => readEnvValue(name, ""));
  const detectedDiscreteEnv = discreteEnvNames.filter((name) => readEnvValue(name, ""));

  return {
    connection_env_present: Boolean(detectedConnectionEnv),
    connection_env_name: detectedConnectionEnv || null,
    discrete_env_present: detectedDiscreteEnv.length > 0,
    discrete_env_names: detectedDiscreteEnv,
    configured: Boolean(DATABASE_URL || (DB_HOST && DB_DATABASE && DB_USERNAME)),
    host_present: Boolean(DB_HOST),
    database_present: Boolean(DB_DATABASE),
    user_present: Boolean(DB_USERNAME),
    password_present: Boolean(DB_PASSWORD)
  };
}

function ensureDatabaseRuntimeDependency() {
  try {
    require.resolve("pg");
    return true;
  } catch (_) {
    // Continue to installation attempt below.
  }

  try {
    console.warn("[mullem] pg is missing. Attempting runtime install...");
    execSync("npm install pg --no-save", {
      stdio: "inherit",
      env: process.env
    });
    require.resolve("pg");
    console.warn("[mullem] pg installed successfully at runtime.");
    return true;
  } catch (error) {
    console.error("[mullem] pg runtime installation failed.");
    console.error(String(error?.message || error));
    return false;
  }
}

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

function normalizeIp(value) {
  const raw = String(value || "").split(",")[0].trim();
  if (!raw) return "unknown";
  return raw.replace(/^::ffff:/i, "");
}

function getClientIp(req) {
  return normalizeIp(
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    ""
  );
}

function parseAllowedOrigins() {
  if (!CORS_ALLOWED_ORIGINS || CORS_ALLOWED_ORIGINS === "*") {
    return { allowAll: true, values: [] };
  }

  const values = CORS_ALLOWED_ORIGINS
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    allowAll: false,
    values: Array.from(new Set([...values, ...DEFAULT_ALLOWED_FRONTEND_ORIGINS]))
  };
}

function isOriginAllowed(origin) {
  const policy = parseAllowedOrigins();
  if (policy.allowAll) return true;
  const normalizedOrigin = String(origin || "").trim().replace(/\/+$/, "");
  return policy.values.some((value) => value.replace(/\/+$/, "") === normalizedOrigin);
}

function setCorsHeaders(req, res) {
  const origin = String(req.headers.origin || "").trim();
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  } else if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
}

function sendJson(req, res, statusCode, payload, extraHeaders = {}) {
  setCorsHeaders(req, res);
  for (const [key, value] of Object.entries(extraHeaders)) {
    if (value != null) {
      res.setHeader(key, value);
    }
  }
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(req, res, statusCode, text, contentType = "text/plain; charset=utf-8", extraHeaders = {}) {
  setCorsHeaders(req, res);
  for (const [key, value] of Object.entries(extraHeaders)) {
    if (value != null) {
      res.setHeader(key, value);
    }
  }
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(text);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > MAX_BODY_BYTES) {
        reject(createHttpError(413, "Payload too large"));
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

function getPublicDatabaseMessage(featureLabel = "هذه الميزة") {
  return `${String(featureLabel || "هذه الميزة").trim()} غير متاح مؤقتًا. حاول مرة أخرى بعد قليل.`;
}

function buildPublicDatabaseState() {
  return {
    configured: Boolean(databaseState?.configured),
    connected: Boolean(databaseState?.connected),
    driver: databaseState?.driver || "postgres",
    host: databaseState?.host || DB_HOST,
    port: databaseState?.port || DB_PORT,
    database: databaseState?.database || DB_DATABASE,
    env: buildDatabaseEnvDiagnostics(),
    message: databaseState?.connected
      ? String(databaseState?.message || "PostgreSQL/Neon connected successfully.")
      : getPublicDatabaseMessage("حفظ البيانات")
  };
}

function ensureDatabaseFeatureAvailable(featureLabel) {
  if (!isDatabaseReady()) {
    throw createHttpError(503, getPublicDatabaseMessage(featureLabel));
  }
}

function sanitizeOptionalText(value, maxLength = MAX_METADATA_LENGTH) {
  return String(value || "").trim().slice(0, maxLength);
}

function sanitizeAttachmentNames(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeOptionalText(item, 160))
    .filter(Boolean)
    .slice(0, 8);
}

function sanitizeAttachmentPreviews(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const name = sanitizeOptionalText(item?.name, 160);
      const type = sanitizeOptionalText(item?.type, 80);
      const content = sanitizeOptionalText(item?.content, 4000);
      if (!name || !content) return null;
      return { name, type, content };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function buildAttachmentContext(payload) {
  const names = sanitizeAttachmentNames(payload?.attachment_names || payload?.attachmentNames);
  const previews = sanitizeAttachmentPreviews(payload?.attachment_previews || payload?.attachmentPreviews);
  const attachmentCount = Math.max(
    names.length,
    Number(payload?.attachment_count || payload?.attachmentCount || 0) || 0
  );

  if (!attachmentCount) return "";

  const listedNames = names.length ? ` أسماء المرفقات: ${names.join("، ")}.` : "";
  const previewContext = previews.length
    ? `\nمقتطفات نصية من المرفقات:\n${previews.map((item, index) => `${index + 1}. ${item.name}${item.type ? ` (${item.type})` : ""}: ${item.content}`).join("\n")}`
    : "";
  return `\n\nملاحظة عن المرفقات: أرسل المستخدم ${attachmentCount} مرفقًا مع هذه الرسالة.${listedNames}${previewContext} إذا لم تظهر لك محتويات الصورة أو الملف بوضوح فاطلب من المستخدم وصفها أو نسخ النص المطلوب.`;
}

function sanitizeModelDisplayText(value) {
  return coerceModelText(value)
    .replace(/\r\n?/g, "\n")
    .replace(/\[object Object\]/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/:\s*[-•]\s+/g, ":\n- ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\*{2,}/g, "")
    .trim();
}

function coerceModelText(value, depth = 0, seen = new WeakSet()) {
  if (value == null || depth > 8) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => coerceModelText(item, depth + 1, seen))
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  if (typeof value !== "object") return "";
  if (seen.has(value)) return "";
  seen.add(value);

  const preferredKeys = [
    "output_text",
    "text",
    "value",
    "content",
    "body",
    "message",
    "display_text",
    "final_answer",
    "answer",
    "summary"
  ];

  for (const key of preferredKeys) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    const text = coerceModelText(value[key], depth + 1, seen);
    if (text && text !== "[object Object]") return text;
  }

  return Object.entries(value)
    .filter(([key]) => ![
      "id",
      "type",
      "role",
      "status",
      "model",
      "created_at",
      "usage",
      "metadata",
      "annotations",
      "logprobs"
    ].includes(key))
    .map(([, item]) => coerceModelText(item, depth + 1, seen))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function requireTextField(value, fieldName, maxLength) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw createHttpError(422, `The ${fieldName} field is required.`);
  }
  if (normalized.length > maxLength) {
    throw createHttpError(422, `The ${fieldName} field exceeds the allowed length.`);
  }
  return normalized;
}

function buildRequestId() {
  return crypto.randomBytes(8).toString("hex");
}

function getRateLimitConfig(requestPath) {
  if (requestPath === "/api/chat/send" || requestPath === "/api/chat/stream") {
    return { limit: RATE_LIMIT_CHAT_MAX, windowMs: RATE_LIMIT_WINDOW_MS, bucket: "chat" };
  }
  if (requestPath === "/api/solve-question") {
    return { limit: RATE_LIMIT_SOLVE_MAX, windowMs: RATE_LIMIT_WINDOW_MS, bucket: "solve" };
  }
  if (requestPath.startsWith("/api/")) {
    return { limit: RATE_LIMIT_GENERAL_MAX, windowMs: RATE_LIMIT_WINDOW_MS, bucket: "api" };
  }
  return null;
}

function applyRateLimit(req, res, requestPath) {
  const config = getRateLimitConfig(requestPath);
  if (!config) return false;

  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${config.bucket}:${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || current.expiresAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      expiresAt: now + config.windowMs
    });
    return false;
  }

  current.count += 1;
  rateLimitStore.set(key, current);

  if (current.count <= config.limit) {
    return false;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
  sendJson(req, res, 429, {
    success: false,
    code: "rate_limited",
    message: "Too many requests. Please try again shortly."
  }, {
    "Retry-After": retryAfterSeconds
  });
  return true;
}

function buildConversationSummary(item) {
  if (!item) return null;
  return {
    id: item.id,
    guest_session_id: item.guest_session_id || item.guestSessionId || null,
    user_id: item.user_id != null ? String(item.user_id) : null,
    project_id: item.project_id != null ? String(item.project_id) : null,
    title: item.title || null,
    subject: item.subject || null,
    stage: item.stage || null,
    grade: item.grade || null,
    term: item.term || null,
    status: item.status || "active",
    last_message_at: item.last_message_at || item.updated_at || null,
    created_at: item.created_at || null,
    updated_at: item.updated_at || null
  };
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function requireEmail(value, fieldName = "email") {
  const normalized = normalizeEmail(value);
  if (!normalized) {
    throw createHttpError(422, `The ${fieldName} field is required.`);
  }
  if (!EMAIL_PATTERN.test(normalized)) {
    throw createHttpError(422, `The ${fieldName} field must be a valid email address.`);
  }
  return normalized;
}

function requirePassword(value, fieldName = "password") {
  const password = String(value || "");
  if (!password.trim()) {
    throw createHttpError(422, `The ${fieldName} field is required.`);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createHttpError(422, `The ${fieldName} field must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  return password;
}

function requireDatabaseConnection() {
  if (!isDatabaseReady()) {
    throw createHttpError(503, databaseState.message || "PostgreSQL/Neon is not connected.");
  }
}

function normalizeUserRole(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "student";
  return normalized.includes("admin") ? "admin" : "student";
}

function normalizeUserStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "active";
  if (normalized.includes("محظور") || normalized.includes("banned") || normalized === "ban") return "banned";
  if (normalized.includes("موقوف") || normalized.includes("suspend")) return "suspended";
  return "active";
}

function formatUserRole(role) {
  return normalizeUserRole(role) === "admin" ? "Admin" : "Student";
}

function formatUserStatus(status) {
  const normalized = normalizeUserStatus(status);
  if (normalized === "banned") return "محظور";
  if (normalized === "suspended") return "موقوف";
  return "نشط";
}

function inferStageFromGrade(grade) {
  const value = String(grade || "").trim();
  if (!value) return "";
  if (value.includes("ابتدائي")) return "ابتدائي";
  if (value.includes("متوسط")) return "متوسط";
  if (value.includes("ثانوي")) return "ثانوي";
  return "";
}

function getTodayStamp() {
  return getMakkahDateKey();
}

function getMakkahDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function limitPromptContext(input, maxTokens = FREE_MAX_CONTEXT_TOKENS) {
  const text = String(input || "").trim();
  const safeMaxTokens = Math.max(500, Number(maxTokens) || FREE_MAX_CONTEXT_TOKENS);
  const maxChars = Math.max(1000, Math.round(safeMaxTokens * 4));
  if (text.length <= maxChars) {
    return text;
  }

  return [
    "System note: The earlier context was shortened to control XP usage. Answer the latest user request clearly and concisely.",
    text.slice(-maxChars)
  ].join("\n\n");
}

function diffDays(fromStamp, toStamp) {
  if (!fromStamp || !toStamp) return 0;
  const from = new Date(`${fromStamp}T00:00:00Z`);
  const to = new Date(`${toStamp}T00:00:00Z`);
  return Math.round((to - from) / 86400000);
}

function addDays(date, days) {
  return new Date(date.getTime() + (Math.max(0, Number(days) || 0) * 86400000));
}

function calculateRemainingDays(expiresAt) {
  if (!expiresAt) return null;
  const expireDate = new Date(expiresAt);
  if (Number.isNaN(expireDate.getTime())) return null;
  return Math.max(0, Math.ceil((expireDate.getTime() - Date.now()) / 86400000));
}

function buildPackagePeriodWindow(selectedPackage) {
  const durationDays = Math.max(0, Number(selectedPackage?.duration_days || 0));
  if (!durationDays) {
    return {
      package_started_at: null,
      package_expires_at: null
    };
  }

  const startDate = new Date();
  return {
    package_started_at: startDate,
    package_expires_at: addDays(startDate, durationDays)
  };
}

async function ensureUserPackageLifecycle(user) {
  if (!user || !isDatabaseReady()) {
    return user;
  }

  const durationDays = Math.max(0, Number(user.package_duration_days || 0));
  const expiresAt = user.package_expires_at ? new Date(user.package_expires_at) : null;
  if (!durationDays || !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() > Date.now()) {
    return user;
  }

  const defaultPackage = await databaseClient.findDefaultPackage();
  if (!defaultPackage) {
    return user;
  }

  return databaseClient.updateUser(user.id, {
    package_id: defaultPackage.id,
    package_name: defaultPackage.display_name,
    plan_type: defaultPackage.package_key || "starter",
    package_started_at: null,
    package_expires_at: null,
    activity: `انتهت مدة باقة ${String(user.package_name || user.package || "الحالية").trim()} وعاد الحساب إلى ${defaultPackage.display_name}`
  });
}

async function syncUserDailyProgress(user, activityText = "") {
  if (!user || !isDatabaseReady()) {
    return user;
  }

  const effectiveUser = await ensureUserPackageLifecycle(user) || user;

  const today = getTodayStamp();
  const lastActiveDate = String(effectiveUser.last_active_date || "");
  const lastDailyClaimDate = String(effectiveUser.last_daily_xp_claimed_date || effectiveUser.last_reset || "");
  const signupBonusClaimed = effectiveUser.signup_bonus_claimed !== false;
  if (lastDailyClaimDate === today && signupBonusClaimed) {
    if (activityText) {
      return databaseClient.updateUser(effectiveUser.id, {
        last_active_date: today,
        activity: activityText
      });
    }
    return effectiveUser;
  }

  let streakDays = Number(effectiveUser.streak_days || 0);
  if (!lastActiveDate) {
    streakDays = 1;
  } else {
    const gap = diffDays(lastActiveDate, today);
    if (gap === 1) streakDays += 1;
    else if (gap > 1) streakDays = 1;
    else if (gap < 0) streakDays = Math.max(1, streakDays);
  }

  const achievements = Array.isArray(effectiveUser.achievements) ? [...effectiveUser.achievements] : [];
  if (streakDays >= 5 && !achievements.includes("5_days_streak")) achievements.push("5_days_streak");
  if (streakDays >= 30 && !achievements.includes("30_days_streak")) achievements.push("30_days_streak");

  const packageDailyXp = Math.max(0, Number(effectiveUser.package_daily_xp || 0));
  const isPaidPackage = packageDailyXp > 0;
  const shouldGrantDailyXp = lastDailyClaimDate !== today;
  const dailyXpAward = shouldGrantDailyXp ? (isPaidPackage ? packageDailyXp : DAILY_LOGIN_XP_REWARD) : 0;
  const currentXp = Number(effectiveUser.xp || 0);
  const baseXp = signupBonusClaimed ? currentXp : currentXp + FIRST_SIGNUP_XP;
  const nextXp = isPaidPackage && shouldGrantDailyXp ? packageDailyXp : baseXp + dailyXpAward;
  const packageLabel = String(effectiveUser.package_name || effectiveUser.package || "التمهيدية").trim() || "التمهيدية";

  return databaseClient.updateUser(effectiveUser.id, {
    last_active_date: today,
    last_reset: today,
    last_daily_xp_claimed_date: today,
    signup_bonus_claimed: true,
    streak_days: streakDays,
    motivation_score: Number(effectiveUser.motivation_score || 0) + DAILY_MOTIVATION_BONUS,
    xp: nextXp,
    total_xp: nextXp,
    plan_type: String(effectiveUser.package_key || effectiveUser.plan_type || effectiveUser.package_name || "starter").trim() || "starter",
    achievements,
    activity: activityText || `تجددت باقته اليومية (${packageLabel}) وحصل على ${dailyXpAward} XP`
  });
}

function isImageAttachmentName(value) {
  return /\.(png|jpe?g|webp|gif|bmp|heic|heif|svg)$/i.test(String(value || "").trim());
}

function normalizeSelectedModel(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw || raw === "default" || raw === "general" || raw === "orlixor ai") return "orlixor";
  if (raw.includes("turbo")) return "turbo";
  if (raw.includes("creative")) return "creative";
  if (raw.includes("pro")) return "pro";
  return modelProfiles[raw] ? raw : "orlixor";
}

function getModelProfile(value) {
  return modelProfiles[normalizeSelectedModel(value)] || modelProfiles.orlixor;
}

function isFreeUser(user) {
  if (!user) return true;
  const dailyXp = Number(user.package_daily_xp || 0);
  const planType = String(user.plan_type || user.package_key || user.package_name || "").trim().toLowerCase();
  return dailyXp <= 0 || planType === "starter" || planType === "free";
}

function applyUserModelLimits(profile, user) {
  const safeProfile = { ...(profile || modelProfiles.orlixor) };
  if (!isFreeUser(user)) return safeProfile;
  return {
    ...safeProfile,
    maxOutputTokens: Math.min(Number(safeProfile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), FREE_MAX_OUTPUT_TOKENS),
    maxContextTokens: Math.min(Number(safeProfile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS), FREE_MAX_CONTEXT_TOKENS)
  };
}

function detectAdvancedTask({ message = "", attachmentCount = 0, attachmentNames = [] } = {}) {
  const names = Array.isArray(attachmentNames) ? attachmentNames.filter(Boolean) : [];
  const hasImage = names.some(isImageAttachmentName);
  const hasFile = Number(attachmentCount || 0) > 0 || names.length > 0;
  if (hasFile || hasImage) return true;

  const text = String(message || "").toLowerCase();
  return [
    "حلل", "تحليل", "ملف", "pdf", "صورة", "صور", "بيانات", "اكسل", "excel",
    "كود", "برمج", "برمجة", "خطة", "مقارنة", "قارن", "استراتيجية", "دراسة"
  ].some((term) => text.includes(term));
}

function resolveEffectiveModelKey(selectedModel, options = {}) {
  const normalized = normalizeSelectedModel(selectedModel);
  return detectAdvancedTask(options) ? "pro" : normalized;
}

function buildModelRoutingNotice(selectedModel, effectiveModel, options = {}) {
  if (normalizeSelectedModel(selectedModel) === effectiveModel) return "";
  if (effectiveModel === "pro" && detectAdvancedTask(options)) {
    return "تم استخدام نموذج Pro لتحليل الطلب لضمان أفضل نتيجة.";
  }
  return "";
}

function getMessageXpCost(attachmentCount = 0, attachmentNames = []) {
  const normalizedAttachmentCount = Math.max(0, Math.round(Number(attachmentCount) || 0));
  if (!normalizedAttachmentCount) {
    return TEXT_MESSAGE_XP_COST;
  }

  const names = Array.isArray(attachmentNames) ? attachmentNames.filter(Boolean) : [];
  const hasOnlyImages = names.length > 0 && names.every(isImageAttachmentName);
  return hasOnlyImages ? IMAGE_GENERATION_XP_COST : ATTACHMENT_ANALYSIS_XP_COST;
}

function getPreflightXpCost(profile, attachmentCount = 0, attachmentNames = []) {
  const attachmentCost = getMessageXpCost(attachmentCount, attachmentNames);
  if (Math.max(0, Number(attachmentCount) || 0) > 0) {
    return Math.max(attachmentCost, Number(profile.minXpCost || attachmentCost));
  }
  if (String(profile?.key || "") === "turbo") {
    return Math.max(1, Math.min(Number(profile.maxXpCost || 10), 10));
  }
  return Math.max(1, Math.min(Number(profile.maxXpCost || TEXT_MESSAGE_XP_COST), TEXT_MESSAGE_XP_COST));
}

function calculateFinalXpCost(profile, assistantText = "", attachmentCount = 0, attachmentNames = [], usage = {}) {
  const normalizedAttachmentCount = Math.max(0, Math.round(Number(attachmentCount) || 0));
  const profileKey = String(profile?.key || "orlixor");
  const minCost = profileKey === "turbo"
    ? Math.max(1, Number(profile.minXpCost || 5))
    : Math.max(1, Number(profile.minXpCost || 8));
  const maxCost = Math.max(minCost, Number(profile.maxXpCost || 15));
  const inputTokens = Number(usage.input_tokens || usage.prompt_tokens || usage.inputTokens || 0);
  const outputTokens = Number(usage.output_tokens || usage.completion_tokens || usage.outputTokens || 0);
  const textLength = String(assistantText || "").trim().length;
  let cost = minCost;

  if (outputTokens > 600 || (!outputTokens && textLength > 2200)) cost += 3;
  if (inputTokens > 1200) cost += 2;

  if (normalizedAttachmentCount > 0) {
    cost = Math.max(cost, getMessageXpCost(attachmentCount, attachmentNames));
    cost += Math.min(3, normalizedAttachmentCount);
  }

  const cap = maxCost + (normalizedAttachmentCount > 0 ? 3 : 0);
  return Math.max(1, Math.min(Math.round(cost), cap));
}

async function chargeUserForMessage(user, cost, activityText) {
  if (!user || !isDatabaseReady() || !cost) {
    return user;
  }

  const xpCost = Math.max(0, Math.round(Number(cost) || 0));
  const nextXp = Math.max(0, Math.max(0, Number(user.xp || 0)) - xpCost);
  return databaseClient.updateUser(user.id, {
    xp: nextXp,
    total_xp: nextXp,
    activity: activityText || `تم خصم ${xpCost} XP مقابل استخدام الشات`
  });
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = crypto.pbkdf2Sync(password, salt, PASSWORD_HASH_ITERATIONS, 64, "sha512").toString("hex");
  return `pbkdf2$${PASSWORD_HASH_ITERATIONS}$${salt}$${derived}`;
}

function verifyPassword(password, storedHash) {
  const raw = String(storedHash || "").trim();
  if (!raw) return false;

  const parts = raw.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") {
    return false;
  }

  const iterations = Number(parts[1]);
  const salt = parts[2];
  const expectedHex = parts[3];
  if (!Number.isFinite(iterations) || !salt || !expectedHex) {
    return false;
  }

  const actualHex = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  const expectedBuffer = Buffer.from(expectedHex, "hex");
  const actualBuffer = Buffer.from(actualHex, "hex");
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function hashApiToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function generateApiToken() {
  return crypto.randomBytes(32).toString("hex");
}

function buildApiUser(user) {
  if (!user) return null;
  return {
    id: String(user.id),
    name: String(user.name || "").trim(),
    email: normalizeEmail(user.email),
    role: formatUserRole(user.role),
    stage: String(user.stage || "").trim(),
    grade: String(user.grade || "").trim(),
    subject: String(user.subject || "").trim(),
    packageId: user.package_id != null ? Number(user.package_id) : null,
    packageKey: String(user.package_key || "").trim(),
    packageDailyXp: Number(user.package_daily_xp || 0),
    packagePriceSar: Number(user.package_price_sar || 0),
    packageDurationDays: Number(user.package_duration_days || 0),
    packageSummary: String(user.package_summary || "").trim(),
    packageBenefits: Array.isArray(user.package_benefits) ? user.package_benefits : [],
    packageStartedAt: user.package_started_at || null,
    packageExpiresAt: user.package_expires_at || null,
    packageDaysRemaining: calculateRemainingDays(user.package_expires_at),
    package: String(user.package_name || user.package || "مجاني محدود").trim() || "مجاني محدود",
    xp: Number.isFinite(Number(user.xp)) ? Number(user.xp) : 0,
    total_xp: Number.isFinite(Number(user.total_xp ?? user.xp)) ? Number(user.total_xp ?? user.xp) : 0,
    totalXp: Number.isFinite(Number(user.total_xp ?? user.xp)) ? Number(user.total_xp ?? user.xp) : 0,
    plan_type: String(user.plan_type || user.package_key || user.package_name || user.package || "starter").trim() || "starter",
    planType: String(user.plan_type || user.package_key || user.package_name || user.package || "starter").trim() || "starter",
    streakDays: Number.isFinite(Number(user.streak_days)) ? Number(user.streak_days) : 0,
    motivationScore: Number.isFinite(Number(user.motivation_score)) ? Number(user.motivation_score) : 0,
    lastActiveDate: user.last_active_date || null,
    last_reset: user.last_reset || user.last_active_date || null,
    lastReset: user.last_reset || user.last_active_date || null,
    last_daily_xp_claimed_date: user.last_daily_xp_claimed_date || user.last_reset || user.last_active_date || null,
    lastDailyXpClaimedDate: user.last_daily_xp_claimed_date || user.last_reset || user.last_active_date || null,
    signup_bonus_claimed: user.signup_bonus_claimed !== false,
    signupBonusClaimed: user.signup_bonus_claimed !== false,
    achievements: Array.isArray(user.achievements) ? user.achievements : [],
    status: formatUserStatus(user.status),
    activity: String(user.activity || "").trim(),
    createdAt: user.created_at || null,
    updatedAt: user.updated_at || null
  };
}

async function issueAuthToken(user, deviceName = "mullem-web") {
  requireDatabaseConnection();
  const rawToken = generateApiToken();
  await databaseClient.createApiToken({
    user_id: user.id,
    name: sanitizeOptionalText(deviceName, MAX_METADATA_LENGTH) || "mullem-web",
    token_hash: hashApiToken(rawToken)
  });
  return rawToken;
}

async function ensureDefaultUsers() {
  if (!isDatabaseReady()) return;

  await databaseClient.ensureUserByEmail({
    name: DEFAULT_ADMIN_NAME,
    email: DEFAULT_ADMIN_EMAIL,
    password_hash: hashPassword(DEFAULT_ADMIN_PASSWORD),
    role: "admin",
    package_name: "إدارة المنصة",
    xp: 0,
    status: "active",
    activity: "حساب إدارة افتراضي"
  });

  await databaseClient.ensureUserByEmail({
    name: DEFAULT_STUDENT_NAME,
    email: DEFAULT_STUDENT_EMAIL,
    password_hash: hashPassword(DEFAULT_STUDENT_PASSWORD),
    role: "student",
    package_key: "starter",
    stage: "ثانوي",
    grade: "الثاني الثانوي",
    subject: "الرياضيات",
    package_name: "مجاني محدود",
    xp: FIRST_SIGNUP_XP,
    total_xp: FIRST_SIGNUP_XP,
    last_active_date: getTodayStamp(),
    last_reset: getTodayStamp(),
    last_daily_xp_claimed_date: getTodayStamp(),
    signup_bonus_claimed: true,
    motivation_score: 0,
    status: "active",
    activity: "حساب طالب جديد"
  });
}

async function getAuthContext(req) {
  if (req.__mullemAuthContext) {
    return req.__mullemAuthContext;
  }

  const authorization = String(req.headers.authorization || "").trim();
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    req.__mullemAuthContext = null;
    return null;
  }

  if (!isDatabaseReady()) {
    req.__mullemAuthContext = null;
    return null;
  }

  const rawToken = String(match[1] || "").trim();
  if (!rawToken) {
    req.__mullemAuthContext = null;
    return null;
  }

  const tokenHash = hashApiToken(rawToken);
  const user = await databaseClient.findUserByTokenHash(tokenHash);
  if (!user) {
    req.__mullemAuthContext = null;
    return null;
  }

  await databaseClient.touchApiToken(tokenHash);
  req.__mullemAuthContext = { token: rawToken, tokenHash, user };
  return req.__mullemAuthContext;
}

async function requireAuthenticatedUser(req) {
  requireDatabaseConnection();
  const auth = await getAuthContext(req);
  if (!auth?.user) {
    throw createHttpError(401, "Authentication is required.");
  }
  return auth;
}

async function requireAdminUser(req) {
  const auth = await requireAuthenticatedUser(req);
  if (normalizeUserRole(auth.user.role) !== "admin") {
    throw createHttpError(403, "Admin access is required.");
  }
  return auth;
}

async function initializeDatabaseLayer() {
  try {
    if (!ensureDatabaseRuntimeDependency()) {
      throw new Error("PostgreSQL runtime dependency is unavailable.");
    }
    const { createPostgresDatabaseClient } = require("./postgres-db");
    databaseClient = createPostgresDatabaseClient({
      connectionString: DATABASE_URL,
      host: DB_HOST,
      port: DB_PORT,
      database: DB_DATABASE,
      username: DB_USERNAME,
      password: DB_PASSWORD
    });
    await databaseClient.initialize();
    if (!databaseClient.isReady()) {
      const postgresState = typeof databaseClient.getState === "function" ? databaseClient.getState() : null;
      throw new Error(
        postgresState?.message ||
        "Neon/PostgreSQL connection is not ready. Set DATABASE_URL or one of the supported Neon/Postgres environment variables."
      );
    }
    await ensureDefaultUsers();
    databaseState = databaseClient.getState();
  } catch (error) {
    console.error(`[mullem] primary database init warning: ${String(error?.message || error)}`);
    if (IS_CLOUD_RUNTIME) {
      databaseClient = null;
      databaseState = {
        configured: Boolean(DATABASE_URL || (DB_HOST && DB_DATABASE && DB_USERNAME)),
        connected: false,
        driver: "postgres",
        host: DB_HOST,
        port: DB_PORT,
        database: DB_DATABASE,
        message: String(error?.message || "Failed to initialize PostgreSQL/Neon.")
      };
      return;
    }
    const { createFallbackDatabaseClient } = require("./fallback-db");
    databaseClient = createFallbackDatabaseClient();
    await databaseClient.initialize();
    await ensureDefaultUsers();
    databaseState = {
      ...databaseClient.getState(),
      driver: "fallback-file",
      host: DB_HOST || "fallback",
      port: DB_PORT || 0,
      database: DB_DATABASE || "fallback"
    };
  }
}

function isDatabaseReady() {
  return Boolean(databaseClient && typeof databaseClient.isReady === "function" && databaseClient.isReady());
}

function extractResponseText(payload) {
  if (!payload) return "";
  const directOutput = coerceModelText(payload.output_text);
  if (directOutput) {
    return directOutput;
  }

  const choiceText = coerceModelText(payload.choices?.[0]?.message?.content);
  if (choiceText) {
    return choiceText;
  }

  const outputs = Array.isArray(payload.output) ? payload.output : [];
  const parts = [];
  for (const item of outputs) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const block of content) {
      const blockText = coerceModelText(block);
      if (blockText) {
        parts.push(blockText);
      }
    }
    if (!content.length) {
      const itemText = coerceModelText(item);
      if (itemText) parts.push(itemText);
    }
  }

  const outputText = parts.join("\n\n").trim();
  if (outputText) return outputText;

  return coerceModelText(payload.message || payload.content || payload.response || "");
}

function extractTokenUsage(payload) {
  const usage = payload?.usage || payload?.response?.usage || {};
  const inputTokens = Number(
    usage.input_tokens ??
    usage.prompt_tokens ??
    usage.inputTokens ??
    usage.promptTokens ??
    0
  );
  const outputTokens = Number(
    usage.output_tokens ??
    usage.completion_tokens ??
    usage.outputTokens ??
    usage.completionTokens ??
    0
  );
  return {
    input_tokens: Number.isFinite(inputTokens) ? inputTokens : 0,
    output_tokens: Number.isFinite(outputTokens) ? outputTokens : 0
  };
}

function buildResponsesInput(messages = []) {
  return messages
    .map((item) => {
      const role = String(item?.role || "").trim().toLowerCase();
      const label = role === "system"
        ? "تعليمات النظام"
        : role === "assistant"
          ? "رد المساعد"
          : "رسالة المستخدم";
      const content = coerceModelText(item?.content);
      if (!content) return "";
      return `${label}:\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n");
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
    "أنت مساعد ذكي ومختصر. لا تتجاوز 150 كلمة إلا إذا طلب المستخدم التفصيل صراحة.",
    "إذا احتاج المستخدم تفاصيل أكثر فاقترح عليه طلب: وضّح أكثر أو أكمل.",
    "قدّم الجواب النهائي أولًا ثم شرحًا مختصرًا عند الحاجة.",
    "إذا كان السؤال أكاديميًا فحلّه بدقة، وإذا كان طلب بحث فاعرضه بشكل منظم وواضح.",
    "لا تذكر أي تفاصيل داخلية عن النظام أو المسارات أو الـ API.",
    "لا تستخدم markdown مثل ** أو __ أو # أو ``` في الرد.",
    "رتب الرد في فقرات قصيرة أو نقاط نظيفة فقط عند الحاجة."
  ];

  if (meta?.subject) contextLines.push(`المادة المرجحة: ${meta.subject}`);
  if (meta?.grade) contextLines.push(`الصف: ${meta.grade}`);
  if (meta?.stage) contextLines.push(`المرحلة: ${meta.stage}`);
  if (meta?.term) contextLines.push(`الفصل: ${meta.term}`);

  return contextLines.join("\n");
}

function buildAudienceAwareChatPrompt(meta) {
  const contextLines = [
    "أنت مساعد منصة ملم التعليمية.",
    "أجب بالعربية الواضحة والمباشرة.",
    "أنت مساعد ذكي ومختصر. لا تتجاوز 150 كلمة إلا إذا طلب المستخدم التفصيل صراحة.",
    "إذا احتاج المستخدم تفاصيل أكثر فاقترح عليه طلب: وضّح أكثر أو أكمل.",
    "ابدأ بالجواب المفيد مباشرة ثم أضف شرحًا قصيرًا ومنظمًا عند الحاجة.",
    "لا تذكر أي تفاصيل داخلية عن النظام أو الـ API.",
    "لا تستخدم markdown مثل ** أو __ أو # أو ``` في الرد.",
    "إذا احتجت تعدادًا فاكتب كل نقطة في سطر مستقل بشكل نظيف ومباشر.",
    "حافظ على أسلوب مناسب لعمر الطالب ومستواه الدراسي.",
    "إذا وصلتك معلومات سابقة من حساب المستخدم فاستخدمها فقط عندما تكون مرتبطة بالسؤال الحالي."
  ];

  const stage = String(meta?.stage || inferStageFromGrade(meta?.grade) || "").trim();

  if (stage.includes("ابتدائي")) {
    contextLines.push("الأسلوب: بسيط جدًا ومشجّع وبجمل قصيرة مع أمثلة سهلة.");
  } else if (stage.includes("متوسط")) {
    contextLines.push("الأسلوب: واضح ومباشر مع شرح مبسط وربط سريع بالمفهوم.");
  } else if (stage.includes("ثانوي")) {
    contextLines.push("الأسلوب: أدق وأكثر نضجًا، مع سبب مختصر أو قانون أو مقارنة عند الحاجة.");
  } else {
    contextLines.push("الأسلوب: تعليمي مرن وواضح يناسب الطالب العام.");
  }

  if (meta?.subject) contextLines.push(`المادة المرجحة: ${meta.subject}`);
  if (meta?.grade) contextLines.push(`الصف: ${meta.grade}`);
  if (stage) contextLines.push(`المرحلة: ${stage}`);
  if (meta?.term) contextLines.push(`الفصل: ${meta.term}`);
  if (meta?.projectTitle) contextLines.push(`المشروع الحالي: ${meta.projectTitle}`);
  if (meta?.lesson) contextLines.push(`الدرس أو التركيز الحالي: ${meta.lesson}`);

  return contextLines.join("\n");
}

function normalizeMemoryText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .toLowerCase();
}

function extractMemoryTerms(value) {
  const normalized = normalizeMemoryText(value);
  if (!normalized) return [];
  const unique = [];
  for (const part of normalized.split(" ")) {
    const token = part.trim();
    if (!token || token.length < 3 || MEMORY_STOP_WORDS.has(token)) continue;
    if (!unique.includes(token)) unique.push(token);
    if (unique.length >= 8) break;
  }
  return unique;
}

function shortenMemorySnippet(value, maxLength = 180) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trim()}…` : normalized;
}

function scoreMemoryCandidate(candidate, terms = [], query = "", index = 0, currentProjectId = null) {
  const sourceText = [
    candidate?.text,
    candidate?.title,
    candidate?.subject,
    candidate?.grade,
    candidate?.term
  ]
    .filter(Boolean)
    .join(" ");
  const haystack = normalizeMemoryText(sourceText);
  const recallIntent = /سابق|قبل|تذكر|ذك[ّ]?ر|قلت|ذكرنا|رجع|استرجع|المرة الماضية|المحادثة السابقة|مشروعي|مشروع/i.test(String(query || ""));
  let score = Math.max(0, 12 - index);

  if (candidate?.role === "user") score += 3;
  if (currentProjectId && Number(candidate?.project_id || 0) === Number(currentProjectId)) score += 5;

  for (const term of terms) {
    if (haystack.includes(term)) score += 4;
  }

  if (recallIntent) score += 2;
  if (!terms.length && !recallIntent) score = 0;

  return score;
}

function buildAccountMemoryNote(snippets = []) {
  if (!Array.isArray(snippets) || !snippets.length) return "";
  const lines = snippets.map((item, index) => {
    const label = item.role === "assistant" ? "من رد سابق للمساعد" : "من كلام المستخدم سابقًا";
    const meta = [item.subject, item.grade, item.term].filter(Boolean).join(" • ");
    const snippet = shortenMemorySnippet(item.text, 170);
    return `${index + 1}. ${label}${meta ? ` [${meta}]` : ""}: ${snippet}`;
  });

  return [
    "هذه ملاحظات مختصرة من سجل الحساب. استخدمها فقط إذا كانت مرتبطة بالسؤال الحالي، ولا تذكرها إذا لم تكن مفيدة:",
    ...lines
  ].join("\n");
}

async function getAccountMemoryMessages(payload = {}) {
  if (!isDatabaseReady() || !payload.user_id || !databaseClient?.listUserMemoryCandidates) {
    return [];
  }

  const candidates = await databaseClient.listUserMemoryCandidates(payload.user_id, {
    exclude_conversation_id: payload.conversation_id || null,
    limit: ACCOUNT_MEMORY_CANDIDATES
  });

  if (!Array.isArray(candidates) || !candidates.length) {
    return [];
  }

  const terms = extractMemoryTerms(payload.message || "");
  const ranked = candidates
    .map((item, index) => ({
      item,
      score: scoreMemoryCandidate(item, terms, payload.message || "", index, payload.project_id || null)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, ACCOUNT_MEMORY_LIMIT)
    .map((entry) => entry.item);

  const memoryNote = buildAccountMemoryNote(ranked);
  if (!memoryNote) return [];

  return [
    {
      role: "system",
      content: memoryNote
    }
  ];
}

function buildSolveSystemPrompt(payload) {
  const modelProfile = payload.modelProfile || getModelProfile(payload.selected_model || payload.selectedModel || payload.model);
  return [
    modelProfile.systemPrompt,
    `النموذج المختار: ${modelProfile.name}.`,
    "أنت محرك حل أسئلة وتعليم عربي لمنصة Orlixor.",
    "أعد JSON فقط بدون markdown أو أي نص زائد.",
    "لا تستخدم markdown داخل answer أو explanation أو display_text.",
    "ممنوع استخدام ** أو __ أو # أو ``` أو القوائم العشوائية داخل display_text.",
    "اكتب display_text كنص عربي مرتب ونظيف يصلح للعرض مباشرة للمستخدم.",
    "اجعل display_text مختصرًا ولا يتجاوز 150 كلمة إلا إذا كان السؤال يطلب شرحًا مفصلًا صراحة.",
    "إذا احتاج المستخدم تفاصيل أكثر فاختم بجملة قصيرة تقترح عليه طلب: وضّح أكثر أو أكمل.",
    "اختر question_type من هذه القيم فقط: multiple_choice, true_false, fill_blank, matching, direct_math, definition, compound, general.",
    "إذا كان السؤال بحثًا أو شرحًا عامًا فاجعل question_type = general أو definition حسب الأنسب.",
    "answer يجب أن يكون الجواب النهائي.",
    "explanation شرح قصير ومباشر.",
    "display_text نص عربي جاهز للعرض للمستخدم بشكل مختصر ومفيد.",
    "confidence رقم بين 0 و 1.",
    "matched_source اجعله orlixor_ai.",
    "source_trace مصفوفة تحتوي مصدرًا واحدًا على الأقل من نوع orlixor_ai.",
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
  const answer = sanitizeModelDisplayText(parsed.answer || parsed.final_answer || parsed.display_text || "");
  const explanation = sanitizeModelDisplayText(parsed.explanation || "");
  const displayText = sanitizeModelDisplayText(parsed.display_text || answer || explanation || "");
  const confidenceValue = Number(parsed.confidence);
  const confidence = Number.isFinite(confidenceValue)
    ? Math.max(0, Math.min(1, confidenceValue))
    : 0.78;

  return {
    answer: answer || displayText || "تعذر استخراج جواب واضح من الرد الحالي.",
    explanation,
    display_text: displayText || answer || "تعذر استخراج جواب واضح من الرد الحالي.",
    confidence,
    matched_source: "orlixor_ai",
    source_trace: Array.isArray(parsed.source_trace) && parsed.source_trace.length
      ? parsed.source_trace
      : [
          {
            source: "orlixor_ai",
            detail: "Generated by Orlixor AI",
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
      decision_basis: "orlixor_ai",
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

async function callOpenAI({ input, modelProfile }) {
  if (!OPENAI_API_KEY) {
    throw createHttpError(503, "OPENAI_API_KEY is not configured on the server.");
  }

  const profile = modelProfile || modelProfiles.orlixor;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: profile.openaiModel || OPENAI_MODEL,
        input: limitPromptContext(input, profile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS),
        temperature: Number(profile.temperature ?? 0.5),
        max_output_tokens: Math.max(120, Math.min(Number(profile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 1600))
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createHttpError(504, "Orlixor AI request timed out on the server.");
    }
    throw createHttpError(503, "Failed to reach Orlixor AI from the server.");
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    let message =
      payload?.error?.message ||
      payload?.message ||
      `Orlixor AI request failed with status ${response.status}`;
    message = String(message)
      .replace(/OpenAI/gi, "Orlixor AI")
      .replace(/gpt-[a-z0-9.\-]+/gi, "Orlixor AI");
    if (message.includes("Invalid value: 'input_text'")) {
      message = "Orlixor AI request format mismatch on the server.";
    }
    throw createHttpError(response.status, message);
  }

  const text = extractResponseText(payload);
  if (!text) {
    throw createHttpError(502, "Orlixor AI returned an empty response.");
  }

  return { text, raw: payload, usage: extractTokenUsage(payload) };
}

function normalizeWritingTask(value) {
  const key = String(value || "generate").trim().toLowerCase();
  if (key === "style" || key === "proofread" || key === "correct") return "rewrite";
  if (key === "long" || key === "longgenerate" || key === "long_generate") return "longGenerate";
  if (["generate", "tone", "expand", "summarize", "rewrite", "longGenerate"].includes(key)) return key;
  return "generate";
}

function getWritingProfile(taskType, user) {
  const task = normalizeWritingTask(taskType);
  const base = {
    key: `writing-${task}`,
    name: "Orlixor Writing Assistant",
    openaiModel: task === "longGenerate" ? (OPENAI_MODEL_PRO || OPENAI_MODEL_WRITING) : (OPENAI_MODEL_WRITING || OPENAI_MODEL_CREATIVE || OPENAI_MODEL_DEFAULT),
    temperature: 0.55,
    maxOutputTokens: 700,
    maxContextTokens: 2200,
    minXpCost: WRITING_XP_COSTS[task] || WRITING_XP_COSTS.generate,
    maxXpCost: WRITING_XP_COSTS[task] || WRITING_XP_COSTS.generate,
    systemPrompt: [
      "أنت مساعد كتابة احترافي في Orlixor.",
      "اكتب نصًا عربيًا واضحًا وجذابًا ومنظمًا.",
      "لا تذكر أسماء مزودي الخدمة أو النماذج التقنية.",
      "نفذ مهمة الكتابة المطلوبة مباشرة بدون شرح جانبي طويل."
    ].join("\n")
  };

  if (task === "generate" || task === "longGenerate") {
    base.temperature = 0.75;
    base.maxOutputTokens = task === "longGenerate" ? 1200 : 900;
    base.systemPrompt = [
      "أنت مساعد كتابة احترافي في Orlixor.",
      "أنشئ محتوى جديدًا واضحًا وجذابًا ومنظمًا من فكرة المستخدم.",
      "اكتب بأسلوب عربي طبيعي ومناسب للغرض والنبرة المطلوبة.",
      "لا تذكر أسماء مزودي الخدمة أو النماذج التقنية."
    ].join("\n");
  } else if (task === "tone") {
    base.temperature = 0.55;
    base.maxOutputTokens = 700;
    base.systemPrompt = [
      "أنت أداة تغيير نبرة النص في Orlixor.",
      "حوّل النص للنبرة المطلوبة مع الحفاظ على المعنى.",
      "أعد النص المحسن فقط بدون شرح طويل."
    ].join("\n");
  } else if (task === "expand") {
    base.temperature = 0.65;
    base.maxOutputTokens = 1000;
    base.systemPrompt = [
      "أنت أداة توسيع النص في Orlixor.",
      "وسّع النص بإضافة تفاصيل وأمثلة واضحة مع الحفاظ على الفكرة الأصلية.",
      "اجعل النتيجة منظمة وقابلة للاستخدام مباشرة."
    ].join("\n");
  } else if (task === "summarize") {
    base.temperature = 0.3;
    base.maxOutputTokens = 500;
    base.systemPrompt = [
      "أنت أداة تلخيص في Orlixor.",
      "اختصر النص إلى نقاط واضحة ومباشرة.",
      "احذف الحشو وحافظ على المعنى الأساسي."
    ].join("\n");
  } else if (task === "rewrite") {
    base.temperature = 0.45;
    base.maxOutputTokens = 700;
    base.systemPrompt = [
      "أنت أداة تحسين وصياغة في Orlixor.",
      "صحح النص وحسّن أسلوبه مع الحفاظ على المعنى.",
      "أعد النص النهائي فقط إلا إذا احتاج المستخدم ملاحظات قصيرة."
    ].join("\n");
  }

  if (isFreeUser(user)) {
    base.maxOutputTokens = Math.min(base.maxOutputTokens, 600);
    base.maxContextTokens = Math.min(base.maxContextTokens, FREE_MAX_CONTEXT_TOKENS);
  }

  return base;
}

function calculateWritingXpCost(taskType, inputText = "", details = "") {
  const task = normalizeWritingTask(taskType);
  const totalLength = String(inputText || "").length + String(details || "").length;
  let cost = WRITING_XP_COSTS[task] || WRITING_XP_COSTS.generate;
  if ((task === "generate" || task === "expand") && totalLength > 1800) {
    cost = Math.max(cost, WRITING_XP_COSTS.longGenerate);
  }
  return Math.max(1, Math.round(cost));
}

function buildWritingPrompt({ taskType, inputText, details, options }) {
  const safeOptions = options && typeof options === "object" ? options : {};
  return [
    { role: "system", content: getWritingProfile(taskType).systemPrompt },
    {
      role: "user",
      content: [
        `نوع المهمة: ${normalizeWritingTask(taskType)}`,
        `النص أو الفكرة:\n${String(inputText || "").trim()}`,
        details ? `تفاصيل إضافية:\n${String(details || "").trim()}` : "",
        "الخيارات:",
        `- نوع المحتوى: ${sanitizeOptionalText(safeOptions.content_type || safeOptions.contentType, 80) || "مقال"}`,
        `- الغرض: ${sanitizeOptionalText(safeOptions.purpose, 80) || "إقناع"}`,
        `- النبرة: ${sanitizeOptionalText(safeOptions.tone, 80) || "احترافية"}`,
        `- اللغة: ${sanitizeOptionalText(safeOptions.language, 80) || "العربية"}`,
        `- الطول التقريبي: ${sanitizeOptionalText(safeOptions.length, 120) || "متوسط"}`
      ].filter(Boolean).join("\n\n")
    }
  ];
}

const TONE_OPTIONS = Object.freeze({
  formal: {
    label: "رسمي",
    hint: "مناسب للمراسلات والتقارير",
    prompt: "حوّل النص إلى نبرة رسمية مناسبة للأعمال والمراسلات."
  },
  friendly: {
    label: "ودود",
    hint: "واضح وبسيط وقريب من القارئ",
    prompt: "حوّل النص إلى نبرة ودودة وقريبة من القارئ."
  },
  marketing: {
    label: "تسويقي",
    hint: "جذاب ومؤثر لزيادة التفاعل",
    prompt: "حوّل النص إلى نبرة تسويقية جذابة ومقنعة."
  },
  academic: {
    label: "أكاديمي",
    hint: "علمي وموثوق ومناسب للبحوث",
    prompt: "حوّل النص إلى نبرة أكاديمية واضحة وموثوقة."
  },
  concise: {
    label: "مختصر",
    hint: "موجز ومباشر في الطرح",
    prompt: "اجعل النص مختصرًا ومباشرًا مع الحفاظ على المعنى."
  },
  inspiring: {
    label: "ملهم",
    hint: "محفز وملهم للقارئ",
    prompt: "حوّل النص إلى نبرة ملهمة ومحفزة."
  }
});

const TONE_LEVELS = Object.freeze({
  light: "عدّل النص بشكل خفيف جدًا.",
  balanced: "عدّل النص بشكل متوازن مع الحفاظ على روح النص.",
  strong: "أعد صياغة النص بوضوح أكبر مع تحسين الأسلوب بشكل ملحوظ."
});

function normalizeToneKey(value) {
  const key = String(value || "formal").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(TONE_OPTIONS, key) ? key : "formal";
}

function normalizeToneLevel(value) {
  const key = String(value || "balanced").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(TONE_LEVELS, key) ? key : "balanced";
}

function getToneProfile(user) {
  return {
    key: "writing-tone",
    name: "Orlixor Tone",
    openaiModel: OPENAI_MODEL_TONE || OPENAI_MODEL_WRITING || OPENAI_MODEL_DEFAULT,
    temperature: 0.55,
    maxOutputTokens: isFreeUser(user) ? 500 : 700,
    maxContextTokens: isFreeUser(user) ? FREE_MAX_CONTEXT_TOKENS : 2200,
    minXpCost: TONE_XP_COST,
    maxXpCost: TONE_XP_COST,
    systemPrompt: [
      "أنت أداة تغيير النبرة في Orlixor.",
      "مهمتك تغيير نبرة النص فقط بدون تغيير المعنى.",
      "أعد النص النهائي فقط.",
      "لا تضف شرحًا.",
      "لا تذكر أسماء مزودي الخدمة أو النماذج التقنية."
    ].join("\n")
  };
}

function buildTonePrompt({ text, tone, level }) {
  const toneKey = normalizeToneKey(tone);
  const levelKey = normalizeToneLevel(level);
  return [
    { role: "system", content: getToneProfile().systemPrompt },
    {
      role: "user",
      content: [
        `النبرة المطلوبة: ${TONE_OPTIONS[toneKey].prompt}`,
        `مستوى التعديل: ${TONE_LEVELS[levelKey]}`,
        "النص:",
        String(text || "").trim()
      ].join("\n\n")
    }
  ];
}

const CORRECTION_TYPES = Object.freeze({
  spelling: {
    label: "إملائي فقط",
    hint: "تصحيح الكلمات وعلامات الترقيم",
    prompt: "صحّح الأخطاء الإملائية فقط."
  },
  grammar: {
    label: "نحوي فقط",
    hint: "تدقيق التراكيب والجمل",
    prompt: "صحّح الأخطاء النحوية فقط."
  },
  full: {
    label: "النحوي والإملائي",
    hint: "تصحيح شامل وواضح",
    prompt: "صحّح الأخطاء الإملائية والنحوية وعلامات الترقيم."
  }
});

const CORRECTION_LEVELS = Object.freeze({
  light: {
    label: "بسيط",
    prompt: "قم بتصحيح بسيط فقط بدون تغيير الأسلوب."
  },
  balanced: {
    label: "متوسط (موصى به)",
    prompt: "صحّح النص مع تحسين بسيط في الأسلوب."
  },
  strong: {
    label: "قوي",
    prompt: "أعد صياغة النص بشكل احترافي مع تصحيح كامل."
  }
});

function normalizeCorrectionType(value) {
  const key = String(value || "full").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(CORRECTION_TYPES, key) ? key : "full";
}

function normalizeCorrectionLevel(value) {
  const key = String(value || "balanced").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(CORRECTION_LEVELS, key) ? key : "balanced";
}

function getCorrectionProfile(user, level = "balanced") {
  const normalizedLevel = normalizeCorrectionLevel(level);
  return {
    key: "writing-correction",
    name: "Orlixor Correction",
    openaiModel: OPENAI_MODEL_CORRECTION || OPENAI_MODEL_WRITING || OPENAI_MODEL_DEFAULT,
    temperature: normalizedLevel === "strong" ? 0.36 : 0.3,
    maxOutputTokens: isFreeUser(user) ? 400 : 700,
    maxContextTokens: isFreeUser(user) ? FREE_MAX_CONTEXT_TOKENS : 2500,
    minXpCost: normalizedLevel === "strong" ? CORRECTION_STRONG_COST : CORRECTION_XP_COST,
    maxXpCost: normalizedLevel === "strong" ? CORRECTION_STRONG_COST : CORRECTION_XP_COST,
    systemPrompt: [
      "أنت أداة تصحيح لغوي في Orlixor.",
      "مهمتك تصحيح النص فقط.",
      "لا تغيّر المعنى الأساسي.",
      "لا تضف شرحًا خارج النص المصحح.",
      "إذا كان النص صحيحًا لغويًا ولا يحتاج تعديلًا، أعد العبارة التالية فقط: النص صحيح لغويًا ✅",
      "لا تذكر أسماء مزودي الخدمة أو النماذج التقنية."
    ].join("\n")
  };
}

function buildCorrectionPrompt({ text, type, level, keepStyle }) {
  const typeKey = normalizeCorrectionType(type);
  const levelKey = normalizeCorrectionLevel(level);
  return [
    { role: "system", content: getCorrectionProfile(null, levelKey).systemPrompt },
    {
      role: "user",
      content: [
        `نوع التصحيح: ${CORRECTION_TYPES[typeKey].prompt}`,
        `مستوى التصحيح: ${CORRECTION_LEVELS[levelKey].prompt}`,
        keepStyle ? "حافظ على أسلوب الكاتب وترتيب الفقرات قدر الإمكان." : "يمكنك تحسين الأسلوب بوضوح مع الحفاظ على المعنى.",
        "النص:",
        String(text || "").trim()
      ].join("\n\n")
    }
  ];
}

const EXPAND_LEVELS = Object.freeze({
  light: {
    label: "توسيع خفيف",
    prompt: "وسّع النص بشكل خفيف مع إضافة جملة أو جملتين فقط."
  },
  medium: {
    label: "توسيع متوسط",
    prompt: "وسّع النص بشكل متوسط مع إضافة تفاصيل مهمة وأمثلة بسيطة."
  },
  deep: {
    label: "توسيع مفصل",
    prompt: "وسّع النص بشكل مفصل ومنظم مع أمثلة وسياق واضح."
  }
});

const EXPAND_FOCUS_OPTIONS = Object.freeze({
  details: {
    label: "تفاصيل وأمثلة",
    prompt: "ركز على إضافة تفاصيل وأمثلة مفيدة."
  },
  explanation: {
    label: "شرح أعمق",
    prompt: "ركز على شرح الفكرة بشكل أعمق."
  },
  examples: {
    label: "أمثلة واقعية",
    prompt: "ركز على إضافة أمثلة واقعية."
  },
  context: {
    label: "سياق وخلفية",
    prompt: "ركز على إضافة سياق وخلفية للفكرة."
  }
});

function normalizeExpandLevel(value) {
  const key = String(value || "medium").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(EXPAND_LEVELS, key) ? key : "medium";
}

function normalizeExpandFocus(value) {
  const key = String(value || "details").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(EXPAND_FOCUS_OPTIONS, key) ? key : "details";
}

function getExpandProfile(user, level = "medium") {
  const normalizedLevel = normalizeExpandLevel(level);
  const isDeep = normalizedLevel === "deep";
  return {
    key: "writing-expand",
    name: "Orlixor Expand",
    openaiModel: OPENAI_MODEL_EXPAND || OPENAI_MODEL_WRITING || OPENAI_MODEL_DEFAULT,
    temperature: 0.65,
    maxOutputTokens: isFreeUser(user) ? (isDeep ? 650 : 550) : (isDeep ? 1000 : 750),
    maxContextTokens: isFreeUser(user) ? FREE_MAX_CONTEXT_TOKENS : 2600,
    minXpCost: isDeep ? EXPAND_LONG_XP_COST : EXPAND_XP_COST,
    maxXpCost: isDeep ? EXPAND_LONG_XP_COST : EXPAND_XP_COST,
    systemPrompt: [
      "أنت أداة توسيع النص في Orlixor.",
      "مهمتك توسيع النص مع الحفاظ على المعنى الأصلي.",
      "لا تغيّر الفكرة الأساسية.",
      "لا تضف معلومات حساسة أو ادعاءات غير مؤكدة.",
      "اكتب بالعربية بوضوح وتنظيم.",
      "أعد النص النهائي فقط بدون شرح إضافي.",
      "لا تذكر أسماء مزودي الخدمة أو النماذج التقنية."
    ].join("\n")
  };
}

function buildExpandPrompt({ text, level, focus, audience }) {
  const levelKey = normalizeExpandLevel(level);
  const focusKey = normalizeExpandFocus(focus);
  const safeAudience = sanitizeOptionalText(audience, 80) || "عام";
  return [
    { role: "system", content: getExpandProfile(null, levelKey).systemPrompt },
    {
      role: "user",
      content: [
        `مستوى التوسيع: ${EXPAND_LEVELS[levelKey].prompt}`,
        `نوع التركيز: ${EXPAND_FOCUS_OPTIONS[focusKey].prompt}`,
        `الجمهور المستهدف: ${safeAudience}`,
        "النص:",
        String(text || "").trim()
      ].join("\n\n")
    }
  ];
}

const SUMMARY_TYPES = Object.freeze({
  bullets: {
    label: "نقاط رئيسية",
    prompt: "لخّص النص في نقاط رئيسية واضحة."
  },
  paragraph: {
    label: "ملخص فقرة",
    prompt: "لخّص النص في فقرة واحدة مختصرة ومترابطة."
  },
  executive: {
    label: "ملخص تنفيذي",
    prompt: "اكتب ملخصًا تنفيذيًا احترافيًا يبرز أهم القرارات والأفكار."
  }
});

const SUMMARY_LENGTHS = Object.freeze({
  short: {
    label: "قصير",
    prompt: "اجعل الملخص قصيرًا جدًا."
  },
  medium: {
    label: "متوسط",
    prompt: "اجعل الملخص متوسط الطول."
  },
  detailed: {
    label: "مفصل",
    prompt: "اجعل الملخص مفصلًا ومنظمًا."
  }
});

function normalizeSummaryType(value) {
  const key = String(value || "bullets").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(SUMMARY_TYPES, key) ? key : "bullets";
}

function normalizeSummaryLength(value) {
  const key = String(value || "medium").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(SUMMARY_LENGTHS, key) ? key : "medium";
}

function normalizePointsCount(value) {
  const numeric = Number(value || 5);
  if (!Number.isFinite(numeric)) return 5;
  return Math.max(3, Math.min(Math.round(numeric), 10));
}

function getSummaryProfile(user, summaryLength = "medium") {
  const normalizedLength = normalizeSummaryLength(summaryLength);
  const isDetailed = normalizedLength === "detailed";
  return {
    key: "writing-summary",
    name: "Orlixor Summary",
    openaiModel: OPENAI_MODEL_SUMMARY || OPENAI_MODEL_WRITING || OPENAI_MODEL_DEFAULT,
    temperature: 0.3,
    maxOutputTokens: isFreeUser(user) ? (isDetailed ? 500 : 420) : (isDetailed ? 900 : 500),
    maxContextTokens: isFreeUser(user) ? FREE_MAX_CONTEXT_TOKENS : 5000,
    minXpCost: isDetailed ? SUMMARY_LONG_XP_COST : SUMMARY_XP_COST,
    maxXpCost: isDetailed ? SUMMARY_LONG_XP_COST : SUMMARY_XP_COST,
    systemPrompt: [
      "أنت أداة تلخيص النص في Orlixor.",
      "لخّص النص بدقة ووضوح.",
      "لا تضف معلومات من خارج النص.",
      "لا تغيّر المعنى.",
      "لا تذكر أسماء مزودي الخدمة أو النماذج التقنية.",
      "أعد الناتج فقط بدون شرح إضافي."
    ].join("\n")
  };
}

function buildSummaryPrompt({ text, summaryType, summaryLength, pointsCount, audience }) {
  const typeKey = normalizeSummaryType(summaryType);
  const lengthKey = normalizeSummaryLength(summaryLength);
  const safeAudience = sanitizeOptionalText(audience, 80) || "عام";
  const safePointsCount = normalizePointsCount(pointsCount);
  return [
    { role: "system", content: getSummaryProfile(null, lengthKey).systemPrompt },
    {
      role: "user",
      content: [
        `نوع الملخص: ${SUMMARY_TYPES[typeKey].prompt}`,
        `طول الملخص: ${SUMMARY_LENGTHS[lengthKey].prompt}`,
        `عدد النقاط إن وجدت: ${safePointsCount}`,
        `الجمهور المستهدف: ${safeAudience}`,
        "النص:",
        String(text || "").trim()
      ].join("\n\n")
    }
  ];
}

function getSmartSearchSourceInstruction(sourceType) {
  const key = String(sourceType || "all").trim().toLowerCase();
  if (key === "news") return "ركز على الأخبار والمصادر الحديثة، وتجنب النتائج القديمة إذا لم تكن مهمة.";
  if (key === "academic") return "ركز على المصادر الأكاديمية والتعليمية والموثوقة قدر الإمكان.";
  if (key === "tech") return "ركز على المصادر التقنية والرسمية والوثائق الحديثة قدر الإمكان.";
  return "استخدم أفضل المصادر الموثوقة والمتنوعة المتاحة.";
}

function shouldUseDeepSmartSearch(query, sourceType) {
  const text = String(query || "").toLowerCase();
  return sourceType === "academic"
    || /تحليل|قارن|مقارنة|تقرير|خطة|دراسة|مصادر كثيرة|بالتفصيل|deep|analysis|report/i.test(text);
}

function extractResponseSources(payload) {
  const sources = [];
  const seen = new Set();

  function addSource(url, title) {
    const cleanUrl = String(url || "").trim();
    if (!/^https?:\/\//i.test(cleanUrl) || seen.has(cleanUrl)) return;
    seen.add(cleanUrl);
    sources.push({
      title: String(title || cleanUrl).trim(),
      url: cleanUrl
    });
  }

  function visit(node) {
    if (!node || sources.length >= 8) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== "object") return;

    if (node.url || node.uri) {
      addSource(node.url || node.uri, node.title || node.name || node.text);
    }

    Object.values(node).forEach(visit);
  }

  visit(payload);
  return sources.slice(0, 6);
}

async function callOpenAIWebSearch({ query, language, sourceType, deep }) {
  if (!OPENAI_API_KEY) {
    throw createHttpError(503, "OPENAI_API_KEY is not configured on the server.");
  }

  const systemPrompt = [
    "أنت أداة البحث الذكي في Orlixor.",
    "ابحث عن معلومات حديثة وموثوقة.",
    "أجب بالعربية باختصار وتنظيم إلا إذا طلب المستخدم غير ذلك.",
    "اذكر المصادر عند توفرها، ولا تخترع معلومات.",
    "لا تذكر أسماء النماذج أو مزود الخدمة للمستخدم.",
    getSmartSearchSourceInstruction(sourceType),
    `لغة الإجابة المطلوبة: ${String(language || "العربية").trim()}.`
  ].join("\n");
  const bodyBase = {
    model: OPENAI_MODEL_SEARCH || OPENAI_MODEL_DEFAULT,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: String(query || "").trim() }
    ],
    tool_choice: "required",
    max_output_tokens: deep ? 900 : 650
  };

  async function requestWithTool(toolType) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
    try {
      const response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...bodyBase,
          tools: [{ type: toolType }]
        }),
        signal: controller.signal
      });
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };
      return { response, payload };
    } catch (error) {
      if (error?.name === "AbortError") {
        throw createHttpError(504, "Smart search request timed out on the server.");
      }
      throw createHttpError(503, "Failed to reach smart search from the server.");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  let { response, payload } = await requestWithTool("web_search");
  if (!response.ok) {
    const message = String(payload?.error?.message || payload?.message || "");
    if (/web_search/i.test(message) && /invalid|unsupported|unknown/i.test(message)) {
      ({ response, payload } = await requestWithTool("web_search_preview"));
    }
  }

  if (!response.ok) {
    let message =
      payload?.error?.message ||
      payload?.message ||
      `Smart search failed with status ${response.status}`;
    message = String(message)
      .replace(/OpenAI/gi, "Orlixor")
      .replace(/gpt-[a-z0-9.\-]+/gi, "Orlixor AI");
    throw createHttpError(response.status, message);
  }

  const text = sanitizeModelDisplayText(extractResponseText(payload));
  if (!text) {
    throw createHttpError(502, "Smart search returned an empty response.");
  }

  return {
    text,
    sources: extractResponseSources(payload),
    usage: extractTokenUsage(payload)
  };
}

async function createEmbedding(content) {
  const text = String(content || "").trim();
  if (!ORLIXOR_ENABLE_EMBEDDINGS || !OPENAI_API_KEY || !text) return null;

  try {
    const response = await fetch(OPENAI_EMBEDDINGS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_EMBEDDING_MODEL,
        input: text.slice(0, 6000)
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    const embedding = payload?.data?.[0]?.embedding;
    return Array.isArray(embedding) ? embedding : null;
  } catch (_) {
    return null;
  }
}

function inferMemoryEntries(userMessage, assistantText) {
  const text = `${String(userMessage || "")}\n${String(assistantText || "")}`.trim();
  if (!text) return [];

  const entries = [];
  const lower = text.toLowerCase();
  const addEntry = (memory_type, content, importance = 3) => {
    const cleanContent = sanitizeModelDisplayText(content).slice(0, 500);
    if (!cleanContent || entries.some((entry) => entry.content === cleanContent)) return;
    entries.push({ memory_type, content: cleanContent, importance });
  };

  if (/(اختصر|مختصر|مختصرة|بدون إطالة|بدون اطالة)/.test(lower)) {
    addEntry("preference", "المستخدم يفضل إجابات مختصرة ومنظمة.", 4);
  }
  if (/(رسمي|احترافي|صياغة رسمية)/.test(lower)) {
    addEntry("style", "المستخدم يفضل أسلوبًا رسميًا واحترافيًا عند الحاجة.", 3);
  }
  if (/(مشروعي|مشروع|متجر|شركة|شركتي|منصتي)/.test(lower)) {
    addEntry("project", `سياق مشروع محتمل للمستخدم: ${String(userMessage || "").trim().slice(0, 220)}`, 3);
  }
  if (/(تعليمي|طلاب|دراسة|مذاكرة|منهج)/.test(lower)) {
    addEntry("fact", "المستخدم يستخدم المنصة غالبًا في سياق تعليمي أو مذاكرة.", 2);
  }

  return entries;
}

function buildConversationSummaryFromMessages(messages = []) {
  const compact = messages
    .slice(-10)
    .map((item) => `${item.role === "assistant" ? "المساعد" : "المستخدم"}: ${String(item.text || item.body || "").replace(/\s+/g, " ").trim()}`)
    .filter((line) => line.length > 12)
    .join(" | ");
  return compact.slice(0, 800);
}

async function maybeUpdateConversationSummary(conversationId) {
  if (!isDatabaseReady() || !conversationId || typeof databaseClient.countConversationMessages !== "function") return;
  try {
    const count = await databaseClient.countConversationMessages(conversationId);
    if (!count || count % 10 !== 0) return;
    const messages = await databaseClient.listMessages(conversationId, 14);
    const summary = buildConversationSummaryFromMessages(messages);
    if (summary && typeof databaseClient.updateConversationSummary === "function") {
      await databaseClient.updateConversationSummary(conversationId, summary);
    }
  } catch (_) {
    // Memory and summary updates are best-effort and should never block chat.
  }
}

async function storeConversationIntelligence(payload = {}) {
  if (!isDatabaseReady() || !payload.user?.id || !payload.conversation?.id) return;

  try {
    if (typeof databaseClient.saveUserMemory === "function") {
      for (const entry of inferMemoryEntries(payload.userMessage, payload.assistantText)) {
        await databaseClient.saveUserMemory({
          user_id: payload.user.id,
          memory_type: entry.memory_type,
          content: entry.content,
          importance: entry.importance
        });
      }
    }

    if (typeof databaseClient.saveMessageEmbedding === "function") {
      const sourceText = `${String(payload.userMessage || "")}\n${String(payload.assistantText || "")}`.trim();
      const embedding = await createEmbedding(sourceText);
      if (embedding) {
        await databaseClient.saveMessageEmbedding({
          user_id: payload.user.id,
          conversation_id: payload.conversation.id,
          message_id: payload.assistantMessage?.id || null,
          embedding,
          content_preview: sourceText.slice(0, 500)
        });
      }
    }

    await maybeUpdateConversationSummary(payload.conversation.id);
  } catch (_) {
    // Keep the user-facing response fast even if memory enrichment fails.
  }
}

async function getOrCreateConversation(payload) {
  if (isDatabaseReady()) {
    return databaseClient.getOrCreateConversation({
      id: String(payload.conversation_id || "").trim() || crypto.randomUUID(),
      conversation_id: String(payload.conversation_id || "").trim() || undefined,
      guest_session_id: String(payload.guest_session_id || "").trim() || undefined,
      user_id: payload.user_id ? Number(payload.user_id) : undefined,
      project_id: payload.project_id ? Number(payload.project_id) : undefined,
      subject: String(payload.subject || "").trim() || null,
      stage: String(payload.stage || "").trim() || null,
      grade: String(payload.grade || "").trim() || null,
      term: String(payload.term || "").trim() || null,
      selected_model_key: normalizeSelectedModel(payload.selected_model || payload.selectedModel || payload.model || "orlixor"),
      title: String(payload.message || payload.question || "").trim().slice(0, 180) || null
    });
  }

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
    user_id: payload.user_id ? String(payload.user_id) : null,
    project_id: payload.project_id ? String(payload.project_id) : null,
    title: String(payload.message || payload.question || "").trim().slice(0, 180) || null,
    subject: String(payload.subject || "").trim() || null,
    stage: String(payload.stage || "").trim() || null,
    grade: String(payload.grade || "").trim() || null,
    term: String(payload.term || "").trim() || null,
    selected_model_key: normalizeSelectedModel(payload.selected_model || payload.selectedModel || payload.model || "orlixor"),
    summary: null,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    messages: []
  };

  conversations.set(conversation.id, conversation);
  if (guestSessionId) {
    guestConversationMap.set(guestSessionId, conversation.id);
  }

  return conversation;
}

async function listConversationHistory(conversation) {
  if (isDatabaseReady()) {
    return databaseClient.listMessages(conversation.id, MAX_HISTORY_MESSAGES);
  }
  return Array.isArray(conversation?.messages) ? conversation.messages.slice(-MAX_HISTORY_MESSAGES) : [];
}

async function persistConversationMessage(conversation, role, text, source = "web", metadata = {}) {
  if (isDatabaseReady()) {
    return databaseClient.saveMessage(conversation.id, role, text, source, metadata);
  }

  conversation.updated_at = new Date().toISOString();
  conversation.last_message_at = conversation.updated_at;
  const message = {
    id: crypto.randomUUID(),
    role,
    text,
    source,
    ...metadata,
    created_at: conversation.updated_at
  };
  conversation.messages.push(message);
  return message;
}

function parseListUsersQuery(req) {
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const perPage = Math.max(1, Math.min(Number(url.searchParams.get("per_page") || url.searchParams.get("limit") || 20), 200));
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const rawRole = sanitizeOptionalText(url.searchParams.get("role"), MAX_METADATA_LENGTH);
  const rawStatus = sanitizeOptionalText(url.searchParams.get("status"), MAX_METADATA_LENGTH);
  return {
    limit: perPage,
    offset: (page - 1) * perPage,
    page,
    perPage,
    search: sanitizeOptionalText(url.searchParams.get("q") || url.searchParams.get("search"), 120),
    role: rawRole ? normalizeUserRole(rawRole) : "",
    status: rawStatus ? normalizeUserStatus(rawStatus) : ""
  };
}

async function handleRegister(req, res) {
  requireDatabaseConnection();
  const payload = await parseJsonBody(req);
  const name = requireTextField(payload.name, "name", MAX_NAME_LENGTH);
  const email = requireEmail(payload.email);
  const password = requirePassword(payload.password);
  const passwordConfirmation = String(payload.password_confirmation || payload.passwordConfirmation || "");
  const grade = sanitizeOptionalText(payload.grade, MAX_METADATA_LENGTH);
  const stage = sanitizeOptionalText(payload.stage, MAX_METADATA_LENGTH) || inferStageFromGrade(grade);
  const deviceName = sanitizeOptionalText(payload.device_name || payload.deviceName, MAX_METADATA_LENGTH) || "mullem-web";

  if (passwordConfirmation && passwordConfirmation !== password) {
    throw createHttpError(422, "Password confirmation does not match.");
  }

  const existing = await databaseClient.findUserByEmail(email);
  if (existing) {
    throw createHttpError(422, "الحساب موجود من قبل، يلزم تسجيل الدخول لدخول الحساب.");
  }

  const user = await databaseClient.createUser({
    name,
    email,
    password_hash: hashPassword(password),
    role: "student",
    package_key: "starter",
    stage,
    grade,
    package_name: "مجاني محدود",
    xp: FIRST_SIGNUP_XP,
    total_xp: FIRST_SIGNUP_XP,
    streak_days: 1,
    last_active_date: getTodayStamp(),
    last_reset: getTodayStamp(),
    last_daily_xp_claimed_date: getTodayStamp(),
    signup_bonus_claimed: true,
    status: "active",
    activity: "أنشأ حسابًا جديدًا"
  });

  const token = await issueAuthToken(user, deviceName);

  sendJson(req, res, 201, {
    success: true,
    data: {
      token,
      user: buildApiUser(user)
    }
  });
}

async function handleLogin(req, res) {
  requireDatabaseConnection();
  const payload = await parseJsonBody(req);
  const email = requireEmail(payload.email);
  const password = requirePassword(payload.password);
  const deviceName = sanitizeOptionalText(payload.device_name || payload.deviceName, MAX_METADATA_LENGTH) || "mullem-web";

  const user = await databaseClient.findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw createHttpError(401, "Invalid email or password.");
  }

  const normalizedStatus = normalizeUserStatus(user.status);
  if (normalizedStatus === "banned") {
    throw createHttpError(403, "This account is banned.");
  }
  if (normalizedStatus === "suspended") {
    throw createHttpError(403, "This account is suspended.");
  }

  const updatedUser = await syncUserDailyProgress(user, "تم تسجيل الدخول عبر الخادم");

  const token = await issueAuthToken(updatedUser || user, deviceName);

  sendJson(req, res, 200, {
    success: true,
    data: {
      token,
      user: buildApiUser(updatedUser || user)
    }
  });
}

async function handleAuthMe(req, res) {
  const auth = await requireAuthenticatedUser(req);
  const syncedUser = await syncUserDailyProgress(auth.user, "تم تحديث جلسة المستخدم");
  sendJson(req, res, 200, {
    success: true,
    data: {
      user: buildApiUser(syncedUser || auth.user)
    }
  });
}

async function handleLogout(req, res) {
  const auth = await getAuthContext(req);
  if (auth?.tokenHash && isDatabaseReady()) {
    await databaseClient.revokeApiToken(auth.tokenHash);
  }

  sendJson(req, res, 200, {
    success: true,
    message: "Logged out successfully."
  });
}

async function handleStudentDashboard(req, res) {
  const auth = await requireAuthenticatedUser(req);
  ensureDatabaseFeatureAvailable("لوحة الطالب");
  const syncedUser = await syncUserDailyProgress(auth.user, "زار لوحة الطالب");
  const dashboard = await databaseClient.getStudentDashboard((syncedUser || auth.user).id);
  if (!dashboard) {
    throw createHttpError(404, "User not found.");
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      user: buildApiUser(dashboard.user),
      stats: dashboard.stats,
      projects: Array.isArray(dashboard.projects) ? dashboard.projects : [],
      recent_conversations: Array.isArray(dashboard.recent_conversations)
        ? dashboard.recent_conversations.map(buildConversationSummary)
        : []
    }
  });
}

function buildProjectSummary(project) {
  if (!project) return null;
  return {
    id: String(project.id),
    title: String(project.title || "").trim(),
    subject: String(project.subject || "").trim(),
    stage: String(project.stage || "").trim(),
    grade: String(project.grade || "").trim(),
    term: String(project.term || "").trim(),
    lesson: String(project.lesson || "").trim(),
    description: String(project.description || "").trim(),
    isArchived: Boolean(project.is_archived),
    conversationsCount: Number(project.conversations_count || 0),
    lastActivityAt: project.last_activity_at || null,
    createdAt: project.created_at || null,
    updatedAt: project.updated_at || null
  };
}

async function handleGuestStatus(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const guestSessionId = sanitizeOptionalText(url.searchParams.get("guest_session_id"), MAX_METADATA_LENGTH);
  if (!guestSessionId) {
    throw createHttpError(422, "guest_session_id is required.");
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      guest_session_id: guestSessionId,
      limit: 0,
      used_messages: 0,
      remaining_messages: 0,
      locked: true,
      message: "Authentication is required to use chat."
    }
  });
}

async function handleStudentProjects(req, res) {
  const auth = await requireAuthenticatedUser(req);
  ensureDatabaseFeatureAvailable("حفظ المشروعات");
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const includeArchived = url.searchParams.get("include_archived") === "1";
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 50), 200));
  const items = await databaseClient.listProjects(auth.user.id, {
    include_archived: includeArchived,
    limit
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      items: items.map(buildProjectSummary)
    }
  });
}

async function handleCreateStudentProject(req, res) {
  const auth = await requireAuthenticatedUser(req);
  ensureDatabaseFeatureAvailable("إنشاء المشروعات");
  const payload = await parseJsonBody(req);
  const grade = sanitizeOptionalText(payload.grade || auth.user.grade, MAX_METADATA_LENGTH);
  const stage = sanitizeOptionalText(payload.stage || auth.user.stage || inferStageFromGrade(grade), MAX_METADATA_LENGTH);

  const project = await databaseClient.createProject({
    user_id: auth.user.id,
    title: requireTextField(payload.title, "title", 180),
    subject: sanitizeOptionalText(payload.subject, MAX_METADATA_LENGTH) || null,
    stage: stage || null,
    grade: grade || null,
    term: sanitizeOptionalText(payload.term, MAX_METADATA_LENGTH) || null,
    lesson: sanitizeOptionalText(payload.lesson, 180) || null,
    description: String(payload.description || "").trim().slice(0, 2000) || null
  });

  sendJson(req, res, 201, {
    success: true,
    data: {
      project: buildProjectSummary(project)
    }
  });
}

async function handleUpdateStudentProject(req, res, projectId) {
  const auth = await requireAuthenticatedUser(req);
  ensureDatabaseFeatureAvailable("تعديل المشروعات");
  const payload = await parseJsonBody(req);
  const changes = {};

  if ("title" in payload) changes.title = requireTextField(payload.title, "title", 180);
  if ("subject" in payload) changes.subject = sanitizeOptionalText(payload.subject, MAX_METADATA_LENGTH) || null;
  if ("stage" in payload) changes.stage = sanitizeOptionalText(payload.stage, MAX_METADATA_LENGTH) || null;
  if ("grade" in payload) changes.grade = sanitizeOptionalText(payload.grade, MAX_METADATA_LENGTH) || null;
  if ("term" in payload) changes.term = sanitizeOptionalText(payload.term, MAX_METADATA_LENGTH) || null;
  if ("lesson" in payload) changes.lesson = sanitizeOptionalText(payload.lesson, 180) || null;
  if ("description" in payload) changes.description = String(payload.description || "").trim().slice(0, 2000) || null;
  if ("isArchived" in payload || "is_archived" in payload) {
    changes.is_archived = Boolean(payload.isArchived ?? payload.is_archived);
  }

  const project = await databaseClient.updateProject(projectId, auth.user.id, changes);
  if (!project) {
    throw createHttpError(404, "Project not found.");
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      project: buildProjectSummary(project)
    }
  });
}

async function handleStudentConversations(req, res) {
  const auth = await requireAuthenticatedUser(req);
  ensureDatabaseFeatureAvailable("دردشات المشروعات");
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 20), 100));
  const projectId = sanitizeOptionalText(url.searchParams.get("project_id"), MAX_METADATA_LENGTH);
  const items = await databaseClient.listUserConversations(auth.user.id, {
    limit,
    project_id: projectId || null
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      items: items.map(buildConversationSummary)
    }
  });
}

async function handleCreateStudentConversation(req, res) {
  const auth = await requireAuthenticatedUser(req);
  ensureDatabaseFeatureAvailable("إنشاء دردشة داخل المشروع");
  const payload = await parseJsonBody(req);
  const requestedProjectId = sanitizeOptionalText(payload.project_id, MAX_METADATA_LENGTH);

  let project = null;
  if (requestedProjectId && isDatabaseReady() && typeof databaseClient?.findProjectById === "function") {
    project = await databaseClient.findProjectById(requestedProjectId, auth.user.id);
    if (!project) {
      throw createHttpError(404, "Project not found.");
    }
  }

  const grade = sanitizeOptionalText(payload.grade || project?.grade || auth.user.grade, MAX_METADATA_LENGTH);
  const stage = sanitizeOptionalText(
    payload.stage || project?.stage || auth.user.stage || inferStageFromGrade(grade),
    MAX_METADATA_LENGTH
  );
  const subject = sanitizeOptionalText(payload.subject || project?.subject || auth.user.subject, MAX_METADATA_LENGTH);
  const term = sanitizeOptionalText(payload.term || project?.term, MAX_METADATA_LENGTH);
  const title = sanitizeOptionalText(payload.title, 180)
    || sanitizeOptionalText(project?.title, 180)
    || "محادثة جديدة";

  const conversation = await getOrCreateConversation({
    conversation_id: crypto.randomUUID(),
    user_id: auth.user.id,
    project_id: project?.id || (requestedProjectId || null),
    subject,
    stage,
    grade,
    term,
    message: title
  });

  sendJson(req, res, 201, {
    success: true,
    data: {
      conversation: buildConversationSummary(conversation),
      project: project ? buildProjectSummary(project) : null
    }
  });
}

async function handlePackages(req, res) {
  requireDatabaseConnection();
  const auth = await getAuthContext(req);
  const syncedUser = auth?.user
    ? await syncUserDailyProgress(auth.user, "زار صفحة الباقات")
    : null;
  const items = await databaseClient.listPackages({ include_inactive: false });

  sendJson(req, res, 200, {
    success: true,
    data: {
      user: auth?.user ? buildApiUser(syncedUser || auth.user) : null,
      items: items.map((item) => ({
        id: item.id,
        key: String(item.package_key || "").trim(),
        name: String(item.display_name || "").trim(),
        daily_xp: Number(item.daily_xp || 0),
        price_sar: Number(item.price_sar || 0),
        duration_days: Number(item.duration_days || 0),
        summary: String(item.summary || "").trim(),
        benefits: Array.isArray(item.benefits) ? item.benefits : [],
        is_active: Boolean(item.is_active),
        is_default: Boolean(item.is_default),
        sort_order: Number(item.sort_order || 0)
      }))
    }
  });
}

async function handleAdminStats(req, res) {
  await requireAdminUser(req);
  const stats = await databaseClient.getAdminStats();
  sendJson(req, res, 200, {
    success: true,
    data: { stats }
  });
}

async function handleAdminPackages(req, res) {
  await requireAdminUser(req);
  const items = await databaseClient.listPackages({ include_inactive: true });
  sendJson(req, res, 200, {
    success: true,
    data: {
      items: items.map((item) => ({
        id: item.id,
        key: String(item.package_key || "").trim(),
        name: String(item.display_name || "").trim(),
        daily_xp: Number(item.daily_xp || 0),
        price_sar: Number(item.price_sar || 0),
        duration_days: Number(item.duration_days || 0),
        summary: String(item.summary || "").trim(),
        benefits: Array.isArray(item.benefits) ? item.benefits : [],
        is_active: Boolean(item.is_active),
        is_default: Boolean(item.is_default),
        sort_order: Number(item.sort_order || 0)
      }))
    }
  });
}

async function handleAdminUpdatePackage(req, res, packageId) {
  await requireAdminUser(req);
  const payload = await parseJsonBody(req);
  const changes = {};

  if ("name" in payload || "display_name" in payload) {
    changes.display_name = requireTextField(payload.display_name || payload.name, "name", 160);
  }

  if ("key" in payload || "package_key" in payload) {
    changes.package_key = requireTextField(payload.package_key || payload.key, "key", 80)
      .toLowerCase()
      .replace(/\s+/g, "_");
  }

  if ("daily_xp" in payload || "dailyXp" in payload) {
    const dailyXp = Number(payload.daily_xp ?? payload.dailyXp);
    if (!Number.isFinite(dailyXp) || dailyXp < 0) {
      throw createHttpError(422, "daily_xp must be a non-negative number.");
    }
    changes.daily_xp = Math.round(dailyXp);
  }

  if ("price_sar" in payload || "priceSar" in payload) {
    const priceSar = Number(payload.price_sar ?? payload.priceSar);
    if (!Number.isFinite(priceSar) || priceSar < 0) {
      throw createHttpError(422, "price_sar must be a non-negative number.");
    }
    changes.price_sar = Number(priceSar.toFixed(2));
  }

  if ("duration_days" in payload || "durationDays" in payload) {
    const durationDays = Number(payload.duration_days ?? payload.durationDays);
    if (!Number.isFinite(durationDays) || durationDays < 0) {
      throw createHttpError(422, "duration_days must be a non-negative number.");
    }
    changes.duration_days = Math.round(durationDays);
  }

  if ("summary" in payload) {
    changes.summary = sanitizeOptionalText(payload.summary, 500) || "";
  }

  if ("benefits" in payload) {
    changes.benefits = Array.isArray(payload.benefits)
      ? payload.benefits
      : String(payload.benefits || "")
        .split(/\r?\n+/)
        .map((item) => item.trim())
        .filter(Boolean);
  }

  if ("is_active" in payload || "isActive" in payload) {
    changes.is_active = Boolean(payload.is_active ?? payload.isActive);
  }

  if ("is_default" in payload || "isDefault" in payload) {
    changes.is_default = Boolean(payload.is_default ?? payload.isDefault);
  }

  if ("sort_order" in payload || "sortOrder" in payload) {
    const sortOrder = Number(payload.sort_order ?? payload.sortOrder);
    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      throw createHttpError(422, "sort_order must be a non-negative number.");
    }
    changes.sort_order = Math.round(sortOrder);
  }

  const updated = await databaseClient.updatePackage(packageId, changes);
  if (!updated) {
    throw createHttpError(404, "Package not found.");
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      item: {
        id: updated.id,
        key: String(updated.package_key || "").trim(),
        name: String(updated.display_name || "").trim(),
        daily_xp: Number(updated.daily_xp || 0),
        price_sar: Number(updated.price_sar || 0),
        duration_days: Number(updated.duration_days || 0),
        summary: String(updated.summary || "").trim(),
        benefits: Array.isArray(updated.benefits) ? updated.benefits : [],
        is_active: Boolean(updated.is_active),
        is_default: Boolean(updated.is_default),
        sort_order: Number(updated.sort_order || 0)
      }
    }
  });
}

async function handleAdminUsers(req, res) {
  await requireAdminUser(req);
  const query = parseListUsersQuery(req);
  const result = await databaseClient.listUsers(query);

  sendJson(req, res, 200, {
    success: true,
    data: {
      items: result.items.map(buildApiUser),
      total: result.total,
      page: query.page,
      per_page: query.perPage
    }
  });
}

async function handleAdminUpdateUser(req, res, userId) {
  await requireAdminUser(req);
  const payload = await parseJsonBody(req);
  const changes = {};
  const existingUser = await databaseClient.findUserById(userId);
  if (!existingUser) {
    throw createHttpError(404, "User not found.");
  }

  if ("name" in payload) {
    changes.name = requireTextField(payload.name, "name", MAX_NAME_LENGTH);
  }

  if ("email" in payload) {
    const nextEmail = requireEmail(payload.email);
    const emailOwner = await databaseClient.findUserByEmail(nextEmail);
    if (emailOwner && String(emailOwner.id) !== String(existingUser.id)) {
      throw createHttpError(422, "This email is already assigned to another user.");
    }
    changes.email = nextEmail;
  }

  if ("role" in payload) {
    changes.role = normalizeUserRole(payload.role);
  }

  if ("stage" in payload) {
    changes.stage = sanitizeOptionalText(payload.stage, MAX_METADATA_LENGTH) || null;
  }

  if ("grade" in payload) {
    changes.grade = sanitizeOptionalText(payload.grade, MAX_METADATA_LENGTH) || null;
  }

  if ("subject" in payload) {
    changes.subject = sanitizeOptionalText(payload.subject, MAX_METADATA_LENGTH) || null;
  }

  if ("package_id" in payload || "package" in payload || "package_name" in payload) {
    const selectedPackage =
      ("package_id" in payload && String(payload.package_id || "").trim())
        ? await databaseClient.findPackageById(payload.package_id)
        : await databaseClient.findPackageByKeyOrName(payload.package_name || payload.package || "");

    if (selectedPackage) {
      changes.package_id = selectedPackage.id;
      changes.package_name = selectedPackage.display_name;
      changes.plan_type = selectedPackage.package_key;
      Object.assign(changes, buildPackagePeriodWindow(selectedPackage));
    } else {
      changes.package_id = null;
      changes.plan_type = "starter";
      changes.package_started_at = null;
      changes.package_expires_at = null;
      changes.package_name = sanitizeOptionalText(payload.package_name || payload.package, 150) || "التمهيدية";
    }
  }

  if ("xp" in payload) {
    const xp = Number(payload.xp);
    if (!Number.isFinite(xp) || xp < 0) {
      throw createHttpError(422, "XP must be a non-negative number.");
    }
    changes.xp = Math.round(xp);
  }

  if ("streak_days" in payload) {
    const streakDays = Number(payload.streak_days);
    if (!Number.isFinite(streakDays) || streakDays < 0) {
      throw createHttpError(422, "streak_days must be a non-negative number.");
    }
    changes.streak_days = Math.round(streakDays);
  }

  if ("motivation_score" in payload) {
    const motivationScore = Number(payload.motivation_score);
    if (!Number.isFinite(motivationScore) || motivationScore < 0) {
      throw createHttpError(422, "motivation_score must be a non-negative number.");
    }
    changes.motivation_score = Math.round(motivationScore);
  }

  if ("last_active_date" in payload) {
    const lastActiveDate = sanitizeOptionalText(payload.last_active_date, 32) || null;
    changes.last_active_date = lastActiveDate;
  }

  if ("achievements" in payload) {
    changes.achievements = Array.isArray(payload.achievements) ? payload.achievements : [];
  }

  if ("status" in payload) {
    changes.status = normalizeUserStatus(payload.status);
  }

  if ("activity" in payload) {
    changes.activity = sanitizeOptionalText(payload.activity, 255) || null;
  }

  const updated = await databaseClient.updateUser(userId, changes);

  sendJson(req, res, 200, {
    success: true,
    data: {
      user: buildApiUser(updated)
    }
  });
}

async function buildChatMessages(conversation, payload) {
  const modelProfile = payload.modelProfile || getModelProfile(payload.selected_model || payload.selectedModel || payload.model);
  const systemPrompt = [
    modelProfile.systemPrompt,
    `النموذج المختار: ${modelProfile.name}.`,
    buildAudienceAwareChatPrompt(payload)
  ].filter(Boolean).join("\n");
  const history = await listConversationHistory(conversation);
  const attachmentContext = buildAttachmentContext(payload);
  const messages = [
    {
      role: "system",
      content: systemPrompt
    }
  ];
  const accountMemoryMessages = await getAccountMemoryMessages({
    user_id: payload.user_id,
    conversation_id: conversation?.id || payload.conversation_id || null,
    project_id: payload.project_id || null,
    message: payload.message || ""
  });

  for (const memoryMessage of accountMemoryMessages) {
    if (!memoryMessage?.content) continue;
    messages.push(memoryMessage);
  }

  for (const item of history) {
    if (!item?.role || !item?.text) continue;
    messages.push({
      role: item.role,
      content: item.text
    });
  }

  messages.push({
    role: "user",
    content: `${String(payload.message || "").trim()}${attachmentContext}`
  });

  return messages;
}

async function handleChatSend(req, res) {
  const payload = await parseJsonBody(req);
  const message = requireTextField(payload.message, "message", MAX_MESSAGE_LENGTH);
  const guestSessionId = sanitizeOptionalText(payload.guest_session_id, MAX_METADATA_LENGTH);
  const conversationId = sanitizeOptionalText(payload.conversation_id, MAX_METADATA_LENGTH);
  const subject = sanitizeOptionalText(payload.subject, MAX_METADATA_LENGTH);
  const lesson = sanitizeOptionalText(payload.lesson, 180);
  const grade = sanitizeOptionalText(payload.grade, MAX_METADATA_LENGTH);
  const stage = sanitizeOptionalText(payload.stage, MAX_METADATA_LENGTH) || inferStageFromGrade(grade);
  const term = sanitizeOptionalText(payload.term, MAX_METADATA_LENGTH);
  const projectId = sanitizeOptionalText(payload.project_id, MAX_METADATA_LENGTH);
  const attachmentNames = sanitizeAttachmentNames(payload.attachment_names || payload.attachmentNames);
  const attachmentCount = Math.max(
    attachmentNames.length,
    Number(payload.attachment_count || payload.attachmentCount || 0) || 0
  );
  const hasAttachment = Boolean(payload.has_attachment || payload.hasAttachment || attachmentCount > 0);
  const hasOnlyImageAttachments = attachmentNames.length > 0 && attachmentNames.every(isImageAttachmentName);
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgress(auth.user, "بدأ جلسة شات جديدة") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to use chat.");
  }

  const requestedModel = normalizeSelectedModel(payload.selected_model || payload.selectedModel || payload.model || "orlixor");
  const selectedModel = resolveEffectiveModelKey(requestedModel, { message, attachmentCount, attachmentNames });
  const routingNotice = buildModelRoutingNotice(requestedModel, selectedModel, { message, attachmentCount, attachmentNames });
  const modelProfile = applyUserModelLimits(getModelProfile(selectedModel), activeUser);

  const preflightXpCost = getPreflightXpCost(modelProfile, attachmentCount, attachmentNames);
  const currentXp = Math.max(0, Number(activeUser.xp || 0));
  if (currentXp < preflightXpCost) {
    throw createHttpError(402, `Insufficient XP balance. This request needs ${preflightXpCost} XP.`);
  }

  let project = null;
  if (activeUser && projectId && isDatabaseReady()) {
    project = await databaseClient.findProjectById(projectId, activeUser.id);
    if (!project) {
      throw createHttpError(404, "Project not found.");
    }
  }

  const conversation = await getOrCreateConversation({
    ...payload,
    message,
    guest_session_id: guestSessionId,
    conversation_id: conversationId,
    user_id: activeUser?.id || null,
    project_id: project?.id || null,
    subject,
    stage,
    grade,
    term,
    selected_model: selectedModel
  });

  let chargedUser = activeUser || null;

  const result = await callOpenAI({
    modelProfile,
    input: buildResponsesInput(await buildChatMessages(conversation, {
      ...payload,
      message,
      selected_model: selectedModel,
      modelProfile,
      attachment_count: attachmentCount,
      attachment_names: attachmentNames,
      user_id: activeUser?.id || null,
      project_id: project?.id || null,
      subject: subject || project?.subject || activeUser?.subject || "",
      stage,
      grade: grade || project?.grade || activeUser?.grade || "",
      term: term || project?.term || "",
      lesson: lesson || project?.lesson || "",
      projectTitle: project?.title || ""
    }))
  });
  const assistantText = sanitizeModelDisplayText(result.text);
  const xpCost = calculateFinalXpCost(modelProfile, assistantText, attachmentCount, attachmentNames, result.usage);

  if (activeUser && isDatabaseReady()) {
    chargedUser = await chargeUserForMessage(
      activeUser,
      xpCost,
      hasAttachment
        ? (hasOnlyImageAttachments ? `استخدم ${modelProfile.name} مع صورة` : `استخدم ${modelProfile.name} مع ملف`)
        : `استخدم ${modelProfile.name}`
    );
  }

  const userMessage = await persistConversationMessage(conversation, "user", message, "web", {
    user_id: activeUser.id,
    model_key: selectedModel
  });
  const assistantMessage = await persistConversationMessage(conversation, "assistant", assistantText, "orlixor", {
    user_id: activeUser.id,
    model_key: selectedModel,
    input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
    output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
    xp_cost: xpCost
  });

  await storeConversationIntelligence({
    user: chargedUser || activeUser,
    conversation,
    userMessage: message,
    assistantText,
    modelKey: selectedModel,
    usage: result.usage,
    userMessage,
    assistantMessage
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      conversation_id: conversation.id,
      project: project ? buildProjectSummary(project) : null,
      assistant_message: {
        body: assistantText,
        source: "orlixor",
        model: modelProfile.name
      },
      model: {
        key: selectedModel,
        requested_key: requestedModel,
        name: modelProfile.name,
        routed: requestedModel !== selectedModel,
        notice: routingNotice
      },
      usage: activeUser ? {
        xp_spent: xpCost,
        xp_remaining: Math.max(0, Number(chargedUser?.xp || 0))
      } : null,
      user: chargedUser ? buildApiUser(chargedUser) : null,
      guest: null
    }
  });
}

async function handleSmartSearch(req, res) {
  const payload = await parseJsonBody(req);
  const query = requireTextField(payload.query || payload.message, "query", Math.min(MAX_MESSAGE_LENGTH, 900));
  const language = sanitizeOptionalText(payload.language, 40) || "العربية";
  const sourceType = sanitizeOptionalText(payload.source_type || payload.sourceType, 40) || "all";
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgress(auth.user, "استخدم البحث الذكي") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to use smart search.");
  }

  const deep = shouldUseDeepSmartSearch(query, sourceType);
  const xpCost = deep ? SEARCH_DEEP_XP_COST : SEARCH_XP_COST;
  const currentXp = Math.max(0, Number(activeUser.xp || 0));

  if (currentXp < xpCost) {
    throw createHttpError(402, `Insufficient XP balance. Smart search needs ${xpCost} XP.`);
  }

  const result = await callOpenAIWebSearch({
    query,
    language,
    sourceType,
    deep
  });

  const chargedUser = await chargeUserForMessage(
    activeUser,
    xpCost,
    deep ? "استخدم البحث الذكي المتقدم" : "استخدم البحث الذكي"
  );

  sendJson(req, res, 200, {
    success: true,
    data: {
      answer: result.text,
      sources: result.sources,
      search_type: deep ? "deep" : "standard",
      usage: {
        xp_spent: xpCost,
        xp_remaining: Math.max(0, Number(chargedUser?.xp || activeUser.xp || 0))
      },
      xp_spent: xpCost,
      xp_remaining: Math.max(0, Number(chargedUser?.xp || activeUser.xp || 0)),
      user: chargedUser ? buildApiUser(chargedUser) : buildApiUser(activeUser)
    }
  });
}

async function handleToneTool(req, res) {
  const payload = await parseJsonBody(req);
  const text = requireTextField(payload.text || payload.input_text || payload.inputText, "text", 4000);
  const tone = normalizeToneKey(payload.tone);
  const level = normalizeToneLevel(payload.level);
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgress(auth.user, "استخدم تغيير النبرة") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to use tone changer.");
  }

  if (text.trim().length < 5) {
    throw createHttpError(422, "Text is too short.");
  }

  if (text.length > 4000) {
    throw createHttpError(413, "Text is too long. Please shorten it or upgrade.");
  }

  const currentXp = Math.max(0, Number(activeUser.xp || 0));
  if (currentXp < TONE_XP_COST) {
    throw createHttpError(402, `Insufficient XP balance. Tone changer needs ${TONE_XP_COST} XP.`);
  }

  const profile = getToneProfile(activeUser);
  const result = await callOpenAI({
    modelProfile: profile,
    input: buildResponsesInput(buildTonePrompt({ text, tone, level }))
  });
  const output = sanitizeModelDisplayText(result.text);

  if (!output) {
    throw createHttpError(502, "Tone changer returned an empty response.");
  }

  const chargedUser = await chargeUserForMessage(
    activeUser,
    TONE_XP_COST,
    `استخدم تغيير النبرة (${TONE_OPTIONS[tone].label})`
  );

  if (isDatabaseReady() && typeof databaseClient.saveToolUsage === "function") {
    await databaseClient.saveToolUsage({
      user_id: activeUser.id,
      tool_key: "writing_assistant",
      task_type: "tone",
      input_text: text,
      output_text: output,
      xp_cost: TONE_XP_COST,
      input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
      metadata: {
        tone,
        tone_label: TONE_OPTIONS[tone].label,
        level
      }
    });
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      output,
      tone,
      level,
      task_type: "tone",
      tool: "tone_changer",
      xp_spent: TONE_XP_COST,
      xp_remaining: Math.max(0, Number(chargedUser?.xp || activeUser.xp || 0)),
      user: chargedUser ? buildApiUser(chargedUser) : buildApiUser(activeUser)
    }
  });
}

async function handleCorrectTextTool(req, res) {
  const payload = await parseJsonBody(req);
  const text = requireTextField(payload.text || payload.input_text || payload.inputText, "text", 5000);
  const type = normalizeCorrectionType(payload.type || payload.correctionType || payload.correction_type);
  const level = normalizeCorrectionLevel(payload.level || payload.correctionLevel || payload.correction_level);
  const keepStyle = payload.keepStyle !== false && payload.keep_style !== false;
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgress(auth.user, "استخدم التصحيح اللغوي") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to correct text.");
  }

  if (text.trim().length < 5) {
    throw createHttpError(422, "Text is too short.");
  }

  if (text.length > 5000) {
    throw createHttpError(413, "Text is too long. Please shorten it.");
  }

  const xpCost = level === "strong" ? CORRECTION_STRONG_COST : CORRECTION_XP_COST;
  const currentXp = Math.max(0, Number(activeUser.xp || 0));
  if (currentXp < xpCost) {
    throw createHttpError(402, `Insufficient XP balance. Text correction needs ${xpCost} XP.`);
  }

  const profile = getCorrectionProfile(activeUser, level);
  const result = await callOpenAI({
    modelProfile: profile,
    input: buildResponsesInput(buildCorrectionPrompt({ text, type, level, keepStyle }))
  });
  const output = sanitizeModelDisplayText(result.text);

  if (!output) {
    throw createHttpError(502, "Text correction returned an empty response.");
  }

  const chargedUser = await chargeUserForMessage(
    activeUser,
    xpCost,
    `استخدم التصحيح اللغوي (${CORRECTION_TYPES[type].label})`
  );

  if (isDatabaseReady() && typeof databaseClient.saveToolUsage === "function") {
    await databaseClient.saveToolUsage({
      user_id: activeUser.id,
      tool_key: "writing_assistant",
      task_type: "correction",
      input_text: text,
      output_text: output,
      xp_cost: xpCost,
      input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
      metadata: {
        type,
        type_label: CORRECTION_TYPES[type].label,
        level,
        level_label: CORRECTION_LEVELS[level].label,
        keep_style: keepStyle
      }
    });
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      output,
      type,
      level,
      keep_style: keepStyle,
      task_type: "correction",
      tool: "text_corrector",
      xp_spent: xpCost,
      xp_remaining: Math.max(0, Number(chargedUser?.xp || activeUser.xp || 0)),
      user: chargedUser ? buildApiUser(chargedUser) : buildApiUser(activeUser)
    }
  });
}

async function handleExpandTextTool(req, res) {
  const payload = await parseJsonBody(req);
  const text = requireTextField(payload.text || payload.input_text || payload.inputText, "text", 3500);
  const level = normalizeExpandLevel(payload.level);
  const focus = normalizeExpandFocus(payload.focus);
  const audience = sanitizeOptionalText(payload.audience, 80) || "عام";
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgress(auth.user, "استخدم توسيع النص") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to use text expansion.");
  }

  if (text.trim().length < 10) {
    throw createHttpError(422, "Text is too short. Write a clear sentence or idea.");
  }

  if (text.length > 3500) {
    throw createHttpError(413, "Text is too long. Please summarize it or split it.");
  }

  const xpCost = level === "deep" ? EXPAND_LONG_XP_COST : EXPAND_XP_COST;
  const currentXp = Math.max(0, Number(activeUser.xp || 0));
  if (currentXp < xpCost) {
    throw createHttpError(402, `Insufficient XP balance. Text expansion needs ${xpCost} XP.`);
  }

  const profile = getExpandProfile(activeUser, level);
  const result = await callOpenAI({
    modelProfile: profile,
    input: buildResponsesInput(buildExpandPrompt({ text, level, focus, audience }))
  });
  const output = sanitizeModelDisplayText(result.text);

  if (!output) {
    throw createHttpError(502, "Text expansion returned an empty response.");
  }

  const chargedUser = await chargeUserForMessage(
    activeUser,
    xpCost,
    `استخدم توسيع النص (${EXPAND_LEVELS[level].label})`
  );

  if (isDatabaseReady() && typeof databaseClient.saveToolUsage === "function") {
    await databaseClient.saveToolUsage({
      user_id: activeUser.id,
      tool_key: "writing_assistant",
      task_type: "expand",
      input_text: text,
      output_text: output,
      xp_cost: xpCost,
      input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
      metadata: {
        level,
        level_label: EXPAND_LEVELS[level].label,
        focus,
        focus_label: EXPAND_FOCUS_OPTIONS[focus].label,
        audience
      }
    });
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      output,
      level,
      focus,
      audience,
      task_type: "expand",
      tool: "text_expander",
      xp_spent: xpCost,
      xp_remaining: Math.max(0, Number(chargedUser?.xp || activeUser.xp || 0)),
      user: chargedUser ? buildApiUser(chargedUser) : buildApiUser(activeUser)
    }
  });
}

async function handleSummarizeTextTool(req, res) {
  const payload = await parseJsonBody(req);
  const text = requireTextField(payload.text || payload.input_text || payload.inputText, "text", 12000);
  const summaryType = normalizeSummaryType(payload.summaryType || payload.summary_type);
  const summaryLength = normalizeSummaryLength(payload.summaryLength || payload.summary_length);
  const pointsCount = normalizePointsCount(payload.pointsCount || payload.points_count);
  const audience = sanitizeOptionalText(payload.audience, 80) || "عام";
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgress(auth.user, "استخدم تلخيص النص") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to summarize text.");
  }

  if (text.trim().length < 30) {
    throw createHttpError(422, "Text is too short to summarize.");
  }

  if (text.length > 12000) {
    throw createHttpError(413, "Text is too long. Please split it or upgrade.");
  }

  const xpCost = text.length > 6000 || summaryLength === "detailed"
    ? SUMMARY_LONG_XP_COST
    : SUMMARY_XP_COST;
  const currentXp = Math.max(0, Number(activeUser.xp || 0));
  if (currentXp < xpCost) {
    throw createHttpError(402, `Insufficient XP balance. Text summary needs ${xpCost} XP.`);
  }

  const profile = getSummaryProfile(activeUser, summaryLength);
  const result = await callOpenAI({
    modelProfile: profile,
    input: buildResponsesInput(buildSummaryPrompt({ text, summaryType, summaryLength, pointsCount, audience }))
  });
  const output = sanitizeModelDisplayText(result.text);

  if (!output) {
    throw createHttpError(502, "Text summary returned an empty response.");
  }

  const chargedUser = await chargeUserForMessage(
    activeUser,
    xpCost,
    `استخدم تلخيص النص (${SUMMARY_TYPES[summaryType].label})`
  );

  if (isDatabaseReady() && typeof databaseClient.saveToolUsage === "function") {
    await databaseClient.saveToolUsage({
      user_id: activeUser.id,
      tool_key: "writing_assistant",
      task_type: "summarize",
      input_text: text,
      output_text: output,
      xp_cost: xpCost,
      input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
      metadata: {
        summary_type: summaryType,
        summary_type_label: SUMMARY_TYPES[summaryType].label,
        summary_length: summaryLength,
        summary_length_label: SUMMARY_LENGTHS[summaryLength].label,
        points_count: pointsCount,
        audience
      }
    });
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      output,
      summary_type: summaryType,
      summary_length: summaryLength,
      points_count: pointsCount,
      audience,
      task_type: "summarize",
      tool: "text_summarizer",
      xp_spent: xpCost,
      xp_remaining: Math.max(0, Number(chargedUser?.xp || activeUser.xp || 0)),
      user: chargedUser ? buildApiUser(chargedUser) : buildApiUser(activeUser)
    }
  });
}

async function handleWritingAssistant(req, res) {
  const payload = await parseJsonBody(req);
  const taskType = normalizeWritingTask(payload.task_type || payload.taskType || "generate");
  const inputText = requireTextField(payload.input_text || payload.inputText || payload.topic || payload.message || payload.text, "input_text", Math.min(MAX_MESSAGE_LENGTH, 4000));
  const details = sanitizeOptionalText(payload.details || payload.extra_details || payload.extraDetails, 3000);
  const options = payload.options && typeof payload.options === "object" ? payload.options : {};
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgress(auth.user, "استخدم مساعد الكتابة") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to use the writing assistant.");
  }

  const xpCost = calculateWritingXpCost(taskType, inputText, details);
  const currentXp = Math.max(0, Number(activeUser.xp || 0));

  if (currentXp < xpCost) {
    throw createHttpError(402, `Insufficient XP balance. Writing assistant needs ${xpCost} XP.`);
  }

  const profile = getWritingProfile(taskType, activeUser);
  const result = await callOpenAI({
    modelProfile: profile,
    input: buildResponsesInput(buildWritingPrompt({ taskType, inputText, details, options }))
  });
  const output = sanitizeModelDisplayText(result.text);

  if (!output) {
    throw createHttpError(502, "Writing assistant returned an empty response.");
  }

  const chargedUser = await chargeUserForMessage(
    activeUser,
    xpCost,
    `استخدم مساعد الكتابة (${taskType})`
  );

  if (isDatabaseReady() && typeof databaseClient.saveToolUsage === "function") {
    await databaseClient.saveToolUsage({
      user_id: activeUser.id,
      tool_key: "writing_assistant",
      task_type: taskType,
      input_text: inputText,
      output_text: output,
      xp_cost: xpCost,
      input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
      metadata: {
        content_type: sanitizeOptionalText(options.content_type || options.contentType, 80),
        purpose: sanitizeOptionalText(options.purpose, 80),
        tone: sanitizeOptionalText(options.tone, 80),
        language: sanitizeOptionalText(options.language, 80),
        length: sanitizeOptionalText(options.length, 120)
      }
    });
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      output,
      task_type: taskType,
      tool: "writing_assistant",
      usage: {
        xp_spent: xpCost,
        xp_remaining: Math.max(0, Number(chargedUser?.xp || activeUser.xp || 0))
      },
      xp_spent: xpCost,
      xp_remaining: Math.max(0, Number(chargedUser?.xp || activeUser.xp || 0)),
      user: chargedUser ? buildApiUser(chargedUser) : buildApiUser(activeUser)
    }
  });
}

async function handleSolveQuestion(req, res) {
  const payload = await parseJsonBody(req);
  const question = requireTextField(payload.question, "question", MAX_QUESTION_LENGTH);
  const grade = sanitizeOptionalText(payload.grade, MAX_METADATA_LENGTH);
  const subject = sanitizeOptionalText(payload.subject, MAX_METADATA_LENGTH);
  const term = sanitizeOptionalText(payload.term, MAX_METADATA_LENGTH);
  const lesson = sanitizeOptionalText(payload.lesson, 180);
  const attachmentNames = sanitizeAttachmentNames(payload.attachment_names || payload.attachmentNames);
  const attachmentCount = Math.max(
    attachmentNames.length,
    Number(payload.attachment_count || payload.attachmentCount || 0) || 0
  );
  const hasOnlyImageAttachments = attachmentNames.length > 0 && attachmentNames.every(isImageAttachmentName);
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgress(auth.user, "بدأ حل سؤال دقيق") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to solve questions.");
  }

  const requestedModel = normalizeSelectedModel(payload.selected_model || payload.selectedModel || payload.model || "orlixor");
  const selectedModel = resolveEffectiveModelKey(requestedModel, { message: question, attachmentCount, attachmentNames });
  const routingNotice = buildModelRoutingNotice(requestedModel, selectedModel, { message: question, attachmentCount, attachmentNames });
  const modelProfile = applyUserModelLimits(getModelProfile(selectedModel), activeUser);

  const preflightXpCost = getPreflightXpCost(modelProfile, attachmentCount, attachmentNames);
  const currentXp = Math.max(0, Number(activeUser.xp || 0));
  if (currentXp < preflightXpCost) {
    throw createHttpError(402, `Insufficient XP balance. This request needs ${preflightXpCost} XP.`);
  }

  const result = await callOpenAI({
    modelProfile,
    input: buildSolveSystemPrompt({
      ...payload,
      selected_model: selectedModel,
      modelProfile,
      question,
      grade,
      subject,
      term,
      lesson
    })
  });

  const cleanedSolveText = sanitizeModelDisplayText(result.text);
  const parsed = extractJsonObject(cleanedSolveText);
  const normalized = normalizeSolvePayload(question, parsed || {
    answer: cleanedSolveText,
    explanation: "",
    display_text: cleanedSolveText,
    question_type: "general",
    confidence: 0.72
  });
  const xpCost = calculateFinalXpCost(modelProfile, normalized.display_text || cleanedSolveText, attachmentCount, attachmentNames, result.usage);
  const chargedUser = isDatabaseReady()
    ? await chargeUserForMessage(
      activeUser,
      xpCost,
      attachmentCount > 0
        ? (hasOnlyImageAttachments ? `استخدم ${modelProfile.name} لحل سؤال مع صورة` : `استخدم ${modelProfile.name} لحل سؤال مع ملف`)
        : `استخدم ${modelProfile.name} لحل سؤال نصي`
    )
    : activeUser;

  sendJson(req, res, 200, {
    ...normalized,
    model: {
      key: selectedModel,
      requested_key: requestedModel,
      name: modelProfile.name,
      routed: requestedModel !== selectedModel,
      notice: routingNotice
    },
    xp_spent: xpCost,
    remaining_xp: Number(chargedUser?.xp ?? activeUser.xp ?? 0)
  });
}

async function handleListChatSessions(req, res) {
  const auth = await requireAuthenticatedUser(req);
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const limit = Number(url.searchParams.get("limit") || 20);
  const projectId = sanitizeOptionalText(url.searchParams.get("project_id"), MAX_METADATA_LENGTH);

  if (isDatabaseReady()) {
    const items = await databaseClient.listUserConversations(auth.user.id, {
      limit,
      project_id: projectId || null
    });
    sendJson(req, res, 200, {
      success: true,
      data: {
        items: items.map(buildConversationSummary)
      }
    });
    return;
  }

  const items = Array.from(conversations.values())
    .filter((item) => String(item.user_id || "") === String(auth.user.id))
    .slice(-Math.max(1, Math.min(limit || 20, 100)))
    .reverse()
    .map(buildConversationSummary);

  sendJson(req, res, 200, {
    success: true,
    data: { items }
  });
}

async function handleGetChatSession(req, res, conversationId) {
  const auth = await requireAuthenticatedUser(req);
  const safeConversationId = sanitizeOptionalText(conversationId, MAX_METADATA_LENGTH);
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const messagesLimit = Math.max(1, Math.min(Number(url.searchParams.get("messages_limit") || 50), 100));
  const canAccessConversation = (conversation) => {
    if (!conversation) return false;
    if (normalizeUserRole(auth.user.role) === "admin") return true;
    return Boolean(conversation.user_id && String(conversation.user_id) === String(auth.user.id));
  };

  if (!safeConversationId) {
    throw createHttpError(404, "Conversation not found.");
  }

  if (isDatabaseReady()) {
    const conversation =
      await databaseClient.getConversationById(safeConversationId) ||
      await databaseClient.getConversationByGuestSessionId(safeConversationId);

    if (!conversation) {
      throw createHttpError(404, "Conversation not found.");
    }
    if (!canAccessConversation(conversation)) {
      throw createHttpError(404, "Conversation not found.");
    }
    const messages = await databaseClient.listMessages(conversation.id, messagesLimit);
    sendJson(req, res, 200, {
      success: true,
      data: {
        conversation: buildConversationSummary(conversation),
        messages
      }
    });
    return;
  }

  const conversation =
    conversations.get(safeConversationId) ||
    conversations.get(guestConversationMap.get(safeConversationId));

  if (!conversation) {
    throw createHttpError(404, "Conversation not found.");
  }
  if (!canAccessConversation(conversation)) {
    throw createHttpError(404, "Conversation not found.");
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      conversation: buildConversationSummary(conversation),
      messages: Array.isArray(conversation.messages) ? conversation.messages.slice(-messagesLimit) : []
    }
  });
}

async function handleDeleteChatSession(req, res, conversationId) {
  const auth = await requireAuthenticatedUser(req);
  const safeConversationId = sanitizeOptionalText(conversationId, MAX_METADATA_LENGTH);

  if (!safeConversationId) {
    throw createHttpError(404, "Conversation not found.");
  }

  if (isDatabaseReady()) {
    const deleted = await databaseClient.deleteConversation(safeConversationId, auth.user.id);
    if (!deleted) {
      throw createHttpError(404, "Conversation not found.");
    }
  } else {
    const conversation =
      conversations.get(safeConversationId) ||
      conversations.get(guestConversationMap.get(safeConversationId));

    if (!conversation || String(conversation.user_id || "") !== String(auth.user.id)) {
      throw createHttpError(404, "Conversation not found.");
    }

    conversations.delete(conversation.id);
    if (conversation.guest_session_id) {
      guestConversationMap.delete(conversation.guest_session_id);
    }
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      deleted: true,
      conversation_id: safeConversationId
    }
  });
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
    sendText(req, res, 404, "Not Found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  setCorsHeaders(req, res);
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
}

async function routeRequest(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method === "OPTIONS") {
    setCorsHeaders(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  const requestPath = String(req.url || "/").split("?")[0];

  if (applyRateLimit(req, res, requestPath)) {
    return;
  }

  if (req.method === "GET" && (requestPath === "/health" || requestPath === "/api/health")) {
    sendJson(req, res, 200, {
      status: "ok",
      request_id: requestId,
      provider: "orlixor",
      ai_configured: Boolean(OPENAI_API_KEY),
      model: "Orlixor AI",
      image_model: "Orlixor Image",
      db: buildPublicDatabaseState(),
      limits: {
        max_body_bytes: MAX_BODY_BYTES,
        max_message_length: MAX_MESSAGE_LENGTH,
        max_question_length: MAX_QUESTION_LENGTH,
        max_history_messages: MAX_HISTORY_MESSAGES,
        max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
        text_message_xp_cost: TEXT_MESSAGE_XP_COST,
        image_generation_xp_cost: IMAGE_GENERATION_XP_COST,
        attachment_analysis_xp_cost: ATTACHMENT_ANALYSIS_XP_COST,
        rate_limit_window_ms: RATE_LIMIT_WINDOW_MS,
        rate_limit_chat_max: RATE_LIMIT_CHAT_MAX,
        rate_limit_solve_max: RATE_LIMIT_SOLVE_MAX
      }
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/ready") {
    const ready = Boolean(databaseState.connected && OPENAI_API_KEY);
    sendJson(req, res, ready ? 200 : 503, {
      success: ready,
      request_id: requestId,
      checks: {
        database_connected: Boolean(databaseState.connected),
        ai_configured: Boolean(OPENAI_API_KEY)
      }
    });
    return;
  }

  if (req.method === "POST" && requestPath === "/api/auth/register") {
    await handleRegister(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/auth/login") {
    await handleLogin(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/auth/me") {
    await handleAuthMe(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/auth/logout") {
    await handleLogout(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/student/dashboard") {
    await handleStudentDashboard(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/guest/status") {
    await handleGuestStatus(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/student/projects") {
    await handleStudentProjects(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/student/projects") {
    await handleCreateStudentProject(req, res);
    return;
  }

  if (req.method === "PATCH" && requestPath.startsWith("/api/student/projects/")) {
    const projectId = decodeURIComponent(requestPath.replace("/api/student/projects/", ""));
    await handleUpdateStudentProject(req, res, projectId);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/student/conversations") {
    await handleStudentConversations(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/student/conversations") {
    await handleCreateStudentConversation(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/packages") {
    await handlePackages(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/stats") {
    await handleAdminStats(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/packages") {
    await handleAdminPackages(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/users") {
    await handleAdminUsers(req, res);
    return;
  }

  if (req.method === "PATCH" && requestPath.startsWith("/api/admin/packages/")) {
    const packageId = decodeURIComponent(requestPath.replace("/api/admin/packages/", ""));
    await handleAdminUpdatePackage(req, res, packageId);
    return;
  }

  if (req.method === "PATCH" && requestPath.startsWith("/api/admin/users/")) {
    const userId = decodeURIComponent(requestPath.replace("/api/admin/users/", ""));
    await handleAdminUpdateUser(req, res, userId);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/db-status") {
    sendJson(req, res, 200, {
      success: true,
      request_id: requestId,
      data: databaseState
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/conversations") {
    if (!isDatabaseReady()) {
      sendJson(req, res, 503, {
        success: false,
        request_id: requestId,
        message: databaseState.message || "PostgreSQL/Neon is not connected."
      });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    const limit = Number(url.searchParams.get("limit") || 20);
    const items = await databaseClient.listRecentConversations(limit);
    sendJson(req, res, 200, {
      success: true,
      request_id: requestId,
      data: {
        items: items.map(buildConversationSummary)
      }
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/chat/sessions") {
    await handleListChatSessions(req, res);
    return;
  }

  if (req.method === "GET" && requestPath.startsWith("/api/chat/sessions/")) {
    const conversationId = decodeURIComponent(requestPath.replace("/api/chat/sessions/", ""));
    await handleGetChatSession(req, res, conversationId);
    return;
  }

  if (req.method === "DELETE" && requestPath.startsWith("/api/chat/sessions/")) {
    const conversationId = decodeURIComponent(requestPath.replace("/api/chat/sessions/", ""));
    await handleDeleteChatSession(req, res, conversationId);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/chat/send") {
    await handleChatSend(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/tools/smart-search") {
    await handleSmartSearch(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/tools/tone") {
    await handleToneTool(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/tools/correct-text") {
    await handleCorrectTextTool(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/tools/expand-text") {
    await handleExpandTextTool(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/tools/summarize-text") {
    await handleSummarizeTextTool(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/tools/writing-assistant") {
    await handleWritingAssistant(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/solve-question") {
    await handleSolveQuestion(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/chat/stream") {
    sendJson(req, res, 501, {
      success: false,
      request_id: requestId,
      message: "Streaming is not enabled in this server build."
    });
    return;
  }

  if (requestPath.startsWith("/api/")) {
    sendJson(req, res, 404, {
      success: false,
      request_id: requestId,
      message: "Route not found."
    });
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  sendJson(req, res, 404, {
    success: false,
    request_id: requestId,
    message: "Route not found."
  });
}

const server = http.createServer((req, res) => {
  routeRequest(req, res).catch((error) => {
    const statusCode = Number(error?.statusCode) || 500;
    sendJson(req, res, statusCode, {
      success: false,
      code: statusCode >= 500 ? "server_error" : "request_error",
      message: String(error?.message || "Internal server error")
    });
  });
});

let serverStartPromise = null;

function startServer(port = PORT) {
  if (server.listening) {
    return Promise.resolve(server);
  }

  if (serverStartPromise) {
    return serverStartPromise;
  }

  serverStartPromise = initializeDatabaseLayerWithTimeout()
    .then(() => new Promise((resolve, reject) => {
      const handleError = (error) => {
        server.off("listening", handleListening);
        serverStartPromise = null;
        reject(error);
      };

      const handleListening = () => {
        server.off("error", handleError);
        console.log(`Mullem server running on http://127.0.0.1:${port}`);
        console.log(`Database status (${databaseState.driver || "postgres"}): ${databaseState.connected ? "connected" : databaseState.message}`);
        resolve(server);
      };

      server.once("error", handleError);
      server.once("listening", handleListening);
      server.listen(port);
    }));

  return serverStartPromise;
}

function stopServer() {
  return new Promise((resolve) => {
    const finalize = async () => {
      if (databaseClient && typeof databaseClient.close === "function") {
        try {
          await databaseClient.close();
        } catch (_) {
          // Ignore shutdown errors.
        }
      }
      serverStartPromise = null;
      resolve();
    };

    if (!server.listening) {
      finalize();
      return;
    }

    server.close(() => {
      finalize();
    });
  });
}

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (!value || value.expiresAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

async function initializeDatabaseLayerWithTimeout() {
  let timeoutId = null;

  try {
    await Promise.race([
      initializeDatabaseLayer(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`PostgreSQL/Neon initialization timed out after ${DB_INIT_TIMEOUT_MS}ms.`));
        }, DB_INIT_TIMEOUT_MS);
      })
    ]);
  } catch (error) {
    databaseClient = null;
    databaseState = {
      configured: Boolean(DATABASE_URL || (DB_HOST && DB_DATABASE && DB_USERNAME)),
      connected: false,
      driver: "postgres",
      host: DB_HOST,
      port: DB_PORT,
      database: DB_DATABASE,
      message: String(error?.message || "Failed to initialize PostgreSQL/Neon.")
    };
    console.error(`[mullem] database init warning: ${databaseState.message}`);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

setInterval(cleanupRateLimitStore, RATE_LIMIT_WINDOW_MS).unref?.();

if (require.main === module) {
  process.on("unhandledRejection", (error) => {
    console.error("[mullem] unhandledRejection", error);
  });

  process.on("uncaughtException", (error) => {
    console.error("[mullem] uncaughtException", error);
  });

  startServer().catch((error) => {
    console.error(String(error?.message || error));
    process.exit(1);
  });
}

module.exports = {
  startServer,
  stopServer,
  routeRequest,
  getDatabaseState: () => ({ ...databaseState })
};
