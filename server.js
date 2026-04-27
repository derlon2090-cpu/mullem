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
    const value = String(process.env[key] || "").trim();
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
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || "gpt-5.4-mini").trim();
const OPENAI_RESPONSES_ENDPOINT = String(process.env.OPENAI_RESPONSES_ENDPOINT || "https://api.openai.com/v1/responses").trim();
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 25000);
const DB_INIT_TIMEOUT_MS = Math.max(1000, Number(process.env.DB_INIT_TIMEOUT_MS || 8000));
const MAX_BODY_BYTES = Math.max(10_000, Number(process.env.MAX_BODY_BYTES || 1_000_000));
const MAX_MESSAGE_LENGTH = Math.max(200, Number(process.env.MAX_MESSAGE_LENGTH || 4000));
const MAX_QUESTION_LENGTH = Math.max(200, Number(process.env.MAX_QUESTION_LENGTH || 4000));
const MAX_METADATA_LENGTH = Math.max(40, Number(process.env.MAX_METADATA_LENGTH || 120));
const MAX_HISTORY_MESSAGES = Math.max(1, Math.min(Number(process.env.MAX_HISTORY_MESSAGES || 10), 30));
const RATE_LIMIT_WINDOW_MS = Math.max(1000, Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000));
const RATE_LIMIT_CHAT_MAX = Math.max(1, Number(process.env.RATE_LIMIT_CHAT_MAX || 20));
const RATE_LIMIT_SOLVE_MAX = Math.max(1, Number(process.env.RATE_LIMIT_SOLVE_MAX || 20));
const RATE_LIMIT_GENERAL_MAX = Math.max(1, Number(process.env.RATE_LIMIT_GENERAL_MAX || 60));
const CORS_ALLOWED_ORIGINS = String(process.env.CORS_ALLOWED_ORIGINS || "*").trim();
const DB_HOST = readEnvValue(
  ["DB_HOST", "MYSQLHOST", "MY_SQL_HOST", "DATABASE_HOST"],
  IS_CLOUD_RUNTIME ? "" : "127.0.0.1"
);
const DB_PORT = readEnvNumber(["DB_PORT", "MYSQLPORT", "DATABASE_PORT"], 3306);
const DB_DATABASE = readEnvValue(
  ["DB_DATABASE", "MYSQLDATABASE", "DATABASE_NAME"],
  IS_CLOUD_RUNTIME ? "" : "mullem"
);
const DB_USERNAME = readEnvValue(
  ["DB_USERNAME", "DB_USER", "MYSQLUSER", "DATABASE_USER"],
  IS_CLOUD_RUNTIME ? "" : "root"
);
const DB_PASSWORD = readEnvValue(["DB_PASSWORD", "MYSQLPASSWORD", "DATABASE_PASSWORD"], "");
const MAX_NAME_LENGTH = Math.max(20, Number(process.env.MAX_NAME_LENGTH || 160));
const MIN_PASSWORD_LENGTH = Math.max(6, Number(process.env.MIN_PASSWORD_LENGTH || 6));
const PASSWORD_HASH_ITERATIONS = Math.max(60000, Number(process.env.PASSWORD_HASH_ITERATIONS || 120000));
const DEFAULT_ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "admin@mullem.sa").trim().toLowerCase();
const DEFAULT_ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Mullem@2026").trim();
const DEFAULT_ADMIN_NAME = String(process.env.DEFAULT_ADMIN_NAME || "مدير المنصة").trim();
const DEFAULT_STUDENT_EMAIL = String(process.env.DEFAULT_STUDENT_EMAIL || "student@mullem.sa").trim().toLowerCase();
const DEFAULT_STUDENT_PASSWORD = String(process.env.DEFAULT_STUDENT_PASSWORD || "Student@2026").trim();
const DEFAULT_STUDENT_NAME = String(process.env.DEFAULT_STUDENT_NAME || "طالب").trim();
const TEXT_MESSAGE_XP_REWARD = Math.max(1, Number(process.env.TEXT_MESSAGE_XP_REWARD || 10));
const IMAGE_MESSAGE_XP_REWARD = Math.max(TEXT_MESSAGE_XP_REWARD, Number(process.env.IMAGE_MESSAGE_XP_REWARD || 15));
const DAILY_LOGIN_XP_REWARD = Math.max(0, Number(process.env.DAILY_LOGIN_XP_REWARD || 5));
const DAILY_MOTIVATION_BONUS = Math.max(1, Number(process.env.DAILY_MOTIVATION_BONUS || 5));
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_MEMORY_LIMIT = Math.max(1, Math.min(Number(process.env.ACCOUNT_MEMORY_LIMIT || 5), 8));
const ACCOUNT_MEMORY_CANDIDATES = Math.max(ACCOUNT_MEMORY_LIMIT, Math.min(Number(process.env.ACCOUNT_MEMORY_CANDIDATES || 28), 60));
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
  configured: Boolean(DB_HOST && DB_DATABASE && DB_USERNAME),
  connected: false,
  host: DB_HOST,
  port: DB_PORT,
  database: DB_DATABASE,
  message: "MySQL has not been initialized yet."
};

function ensureMysql2RuntimeDependency() {
  try {
    require.resolve("mysql2/promise");
    return true;
  } catch (_) {
    // Continue to installation attempt below.
  }

  try {
    console.warn("[mullem] mysql2 is missing. Attempting runtime install...");
    execSync("npm install mysql2 --no-save", {
      stdio: "inherit",
      env: process.env
    });
    require.resolve("mysql2/promise");
    console.warn("[mullem] mysql2 installed successfully at runtime.");
    return true;
  } catch (error) {
    console.error("[mullem] mysql2 runtime installation failed.");
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
    values
  };
}

function isOriginAllowed(origin) {
  const policy = parseAllowedOrigins();
  if (policy.allowAll) return true;
  return policy.values.includes(String(origin || "").trim());
}

function setCorsHeaders(req, res) {
  const origin = String(req.headers.origin || "").trim();
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS");
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
    host: databaseState?.host || DB_HOST,
    port: databaseState?.port || DB_PORT,
    database: databaseState?.database || DB_DATABASE,
    message: databaseState?.connected
      ? String(databaseState?.message || "MySQL connected successfully.")
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

function buildAttachmentContext(payload) {
  const names = sanitizeAttachmentNames(payload?.attachment_names || payload?.attachmentNames);
  const attachmentCount = Math.max(
    names.length,
    Number(payload?.attachment_count || payload?.attachmentCount || 0) || 0
  );

  if (!attachmentCount) return "";

  const listedNames = names.length ? ` أسماء المرفقات: ${names.join("، ")}.` : "";
  return `\n\nملاحظة عن المرفقات: أرسل المستخدم ${attachmentCount} مرفقًا مع هذه الرسالة.${listedNames} إذا احتجت محتوى الملف نفسه فاطلب من المستخدم كتابة النص أو وصف الصورة بشكل أوضح.`;
}

function sanitizeModelDisplayText(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
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
    throw createHttpError(503, databaseState.message || "MySQL is not connected.");
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
  if (value.includes("ط§ط¨طھط¯ط§ط¦ظٹ")) return "ط§ط¨طھط¯ط§ط¦ظٹ";
  if (value.includes("ظ…طھظˆط³ط·")) return "ظ…طھظˆط³ط·";
  if (value.includes("ط«ط§ظ†ظˆظٹ")) return "ط«ط§ظ†ظˆظٹ";
  return "";
}

function getTodayStamp() {
  return new Date().toISOString().slice(0, 10);
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
  if (lastActiveDate === today) {
    if (activityText) {
      return databaseClient.updateUser(effectiveUser.id, {
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
  const dailyXpAward = packageDailyXp + DAILY_LOGIN_XP_REWARD;
  const packageLabel = String(effectiveUser.package_name || effectiveUser.package || "التمهيدية").trim() || "التمهيدية";

  return databaseClient.updateUser(effectiveUser.id, {
    last_active_date: today,
    streak_days: streakDays,
    motivation_score: Number(effectiveUser.motivation_score || 0) + DAILY_MOTIVATION_BONUS,
    xp: Number(effectiveUser.xp || 0) + dailyXpAward,
    achievements,
    activity: activityText || `تجددت باقته اليومية (${packageLabel}) وحصل على ${dailyXpAward} XP`
  });
}

async function rewardUserForMessage(user, amount, activityText) {
  if (!user || !isDatabaseReady() || !amount) {
    return user;
  }

  return databaseClient.updateUser(user.id, {
    xp: Number(user.xp || 0) + Math.max(0, Number(amount) || 0),
    activity: activityText || "تمت إضافة نقاط على الرسالة"
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
    streakDays: Number.isFinite(Number(user.streak_days)) ? Number(user.streak_days) : 0,
    motivationScore: Number.isFinite(Number(user.motivation_score)) ? Number(user.motivation_score) : 0,
    lastActiveDate: user.last_active_date || null,
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
    xp: 50,
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
    if (!ensureMysql2RuntimeDependency()) {
      throw new Error("MySQL runtime dependency is unavailable.");
    }
    const { createDatabaseClient } = require("./db");
    databaseClient = createDatabaseClient({
      host: DB_HOST,
      port: DB_PORT,
      database: DB_DATABASE,
      username: DB_USERNAME,
      password: DB_PASSWORD
    });
    await databaseClient.initialize();
    await ensureDefaultUsers();
    databaseState = databaseClient.getState();
  } catch (error) {
    console.error(`[mullem] primary database init warning: ${String(error?.message || error)}`);
    const { createFallbackDatabaseClient } = require("./fallback-db");
    databaseClient = createFallbackDatabaseClient();
    await databaseClient.initialize();
    await ensureDefaultUsers();
    databaseState = {
      ...databaseClient.getState(),
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

function buildResponsesInput(messages = []) {
  return messages
    .map((item) => {
      const role = String(item?.role || "").trim().toLowerCase();
      const label = role === "system"
        ? "تعليمات النظام"
        : role === "assistant"
          ? "رد المساعد"
          : "رسالة المستخدم";
      const content = String(item?.content || "").trim();
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
  return [
    "أنت محرك حل أسئلة تعليمية عربي لمنصة ملم.",
    "أعد JSON فقط بدون markdown أو أي نص زائد.",
    "لا تستخدم markdown داخل answer أو explanation أو display_text.",
    "ممنوع استخدام ** أو __ أو # أو ``` أو القوائم العشوائية داخل display_text.",
    "اكتب display_text كنص عربي مرتب ونظيف يصلح للعرض مباشرة للمستخدم.",
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

async function callOpenAI({ input }) {
  if (!OPENAI_API_KEY) {
    throw createHttpError(503, "OPENAI_API_KEY is not configured on the server.");
  }

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
        model: OPENAI_MODEL,
        input: String(input || "").trim()
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createHttpError(504, "OpenAI request timed out on the server.");
    }
    throw createHttpError(503, "Failed to reach OpenAI API from the server.");
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
      `OpenAI request failed with status ${response.status}`;
    if (message.includes("Invalid value: 'input_text'")) {
      message = "OpenAI request format mismatch on the server.";
    }
    throw createHttpError(response.status, message);
  }

  const text = extractResponseText(payload);
  if (!text) {
    throw createHttpError(502, "OpenAI returned an empty response.");
  }

  return { text, raw: payload };
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

async function persistConversationMessage(conversation, role, text, source = "web") {
  if (isDatabaseReady()) {
    await databaseClient.saveMessage(conversation.id, role, text, source);
    return;
  }

  conversation.updated_at = new Date().toISOString();
  conversation.last_message_at = conversation.updated_at;
  conversation.messages.push({ role, text, source });
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
    throw createHttpError(422, "This email is already registered.");
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
    xp: 50,
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
      Object.assign(changes, buildPackagePeriodWindow(selectedPackage));
    } else {
      changes.package_id = null;
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
  const systemPrompt = buildAudienceAwareChatPrompt(payload);
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
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgress(auth.user, "بدأ جلسة شات جديدة") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to use chat.");
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
    term
  });
  const result = await callOpenAI({
    input: buildResponsesInput(await buildChatMessages(conversation, {
      ...payload,
      message,
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

  await persistConversationMessage(conversation, "user", message, "web");
  await persistConversationMessage(conversation, "assistant", assistantText, "openai");

  let rewardedUser = activeUser || null;
  if (activeUser && isDatabaseReady()) {
    const rewardAmount = hasAttachment ? IMAGE_MESSAGE_XP_REWARD : TEXT_MESSAGE_XP_REWARD;
    rewardedUser = await rewardUserForMessage(
      activeUser,
      rewardAmount,
      hasAttachment ? "أرسل رسالة مع صورة/ملف" : "أرسل رسالة نصية"
    );
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      conversation_id: conversation.id,
      project: project ? buildProjectSummary(project) : null,
      assistant_message: {
        body: assistantText,
        source: "openai"
      },
      rewards: activeUser ? {
        xp_earned: hasAttachment ? IMAGE_MESSAGE_XP_REWARD : TEXT_MESSAGE_XP_REWARD
      } : null,
      user: rewardedUser ? buildApiUser(rewardedUser) : null,
      guest: null
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

  const result = await callOpenAI({
    input: buildSolveSystemPrompt({
      ...payload,
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

  sendJson(req, res, 200, normalized);
}

async function handleListChatSessions(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const limit = Number(url.searchParams.get("limit") || 20);

  if (isDatabaseReady()) {
    const items = await databaseClient.listRecentConversations(limit);
    sendJson(req, res, 200, {
      success: true,
      data: {
        items: items.map(buildConversationSummary)
      }
    });
    return;
  }

  const items = Array.from(conversations.values())
    .slice(-Math.max(1, Math.min(limit || 20, 100)))
    .reverse()
    .map(buildConversationSummary);

  sendJson(req, res, 200, {
    success: true,
    data: { items }
  });
}

async function handleGetChatSession(req, res, conversationId) {
  const safeConversationId = sanitizeOptionalText(conversationId, MAX_METADATA_LENGTH);
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const messagesLimit = Math.max(1, Math.min(Number(url.searchParams.get("messages_limit") || 50), 100));

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

  sendJson(req, res, 200, {
    success: true,
    data: {
      conversation: buildConversationSummary(conversation),
      messages: Array.isArray(conversation.messages) ? conversation.messages.slice(-messagesLimit) : []
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
      provider: "openai",
      ai_configured: Boolean(OPENAI_API_KEY),
      model: OPENAI_MODEL,
      db: buildPublicDatabaseState(),
      limits: {
        max_body_bytes: MAX_BODY_BYTES,
        max_message_length: MAX_MESSAGE_LENGTH,
        max_question_length: MAX_QUESTION_LENGTH,
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
        openai_configured: Boolean(OPENAI_API_KEY)
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
        message: databaseState.message || "MySQL is not connected."
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

  if (req.method === "POST" && requestPath === "/api/chat/send") {
    await handleChatSend(req, res);
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
        console.log(`MySQL status: ${databaseState.connected ? "connected" : databaseState.message}`);
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
          reject(new Error(`MySQL initialization timed out after ${DB_INIT_TIMEOUT_MS}ms.`));
        }, DB_INIT_TIMEOUT_MS);
      })
    ]);
  } catch (error) {
    databaseClient = null;
    databaseState = {
      configured: Boolean(DB_HOST && DB_DATABASE && DB_USERNAME),
      connected: false,
      host: DB_HOST,
      port: DB_PORT,
      database: DB_DATABASE,
      message: String(error?.message || "Failed to initialize MySQL.")
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
