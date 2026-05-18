const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFile, execSync } = require("child_process");
const { promisify } = require("util");
const { openAiWebSearchV2Raw, resolveOpenAiWebSearchV2Model } = require("./openAiWebSearchV2");
const aiIntelligence = require("./ai-intelligence-layer");
const { seedAiKnowledgeBase } = require("./ai-knowledge-seed");
const { createRealScaleInfra } = require("./ai-real-scale-infra");
const aiOps = require("./ai-operational-governance");
const securityCompliance = require("./security-compliance");

const execFileAsync = promisify(execFile);

const ROOT_DIR = __dirname;
loadEnvFile(path.join(ROOT_DIR, ".env"));
securityCompliance.installConsoleRedaction(process.env);
const ASSISTANT_V3_VERSION = "ASSISTANT_V3_ROUTE_WORKING";
const OPENAI_ONLY_FINAL_999 = "OPENAI_ONLY_FINAL_999";
const PORT = Number(process.env.PORT || 3000);
const realScaleInfra = createRealScaleInfra({ serviceName: "mullem-main" });
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
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();
const ORLIXOR_DEFAULT_PROVIDER = String(process.env.ORLIXOR_DEFAULT_PROVIDER || process.env.MULLEM_AI_PROVIDER || "openai").trim().toLowerCase();
const ORLIXOR_TURBO_PROVIDER = String(process.env.ORLIXOR_TURBO_PROVIDER || ORLIXOR_DEFAULT_PROVIDER || "openai").trim().toLowerCase();
const ORLIXOR_PRO_PROVIDER = String(process.env.ORLIXOR_PRO_PROVIDER || ORLIXOR_DEFAULT_PROVIDER || "openai").trim().toLowerCase();
const ORLIXOR_CREATIVE_PROVIDER = String(process.env.ORLIXOR_CREATIVE_PROVIDER || ORLIXOR_DEFAULT_PROVIDER || "openai").trim().toLowerCase();
const ORLIXOR_ALPHA_PROVIDER = String(process.env.ORLIXOR_ALPHA_PROVIDER || ORLIXOR_PRO_PROVIDER || "openai").trim().toLowerCase();
const OPENAI_MODEL_DEFAULT = String(process.env.ORLIXOR_DEFAULT_MODEL || process.env.OPENAI_MODEL_DEFAULT || process.env.OPENAI_MODEL_ORLIXOR || OPENAI_MODEL || "gpt-4.1-mini").trim();
const OPENAI_MODEL_TURBO = String(process.env.ORLIXOR_TURBO_MODEL || process.env.OPENAI_MODEL_TURBO || OPENAI_MODEL || "gpt-4.1-mini").trim();
const OPENAI_MODEL_PRO = String(process.env.ORLIXOR_PRO_MODEL || process.env.OPENAI_MODEL_PRO || OPENAI_MODEL || "gpt-4.1-mini").trim();
const OPENAI_MODEL_CREATIVE = String(process.env.ORLIXOR_CREATIVE_MODEL || process.env.OPENAI_MODEL_CREATIVE || OPENAI_MODEL || "gpt-4.1-mini").trim();
const ORLIXOR_ALPHA_MODEL = String(process.env.ORLIXOR_ALPHA_MODEL || OPENAI_MODEL || "gpt-4.1-mini").trim();
const ORLIXOR_ALLOW_PROVIDER_FALLBACK = false;
const OPENAI_MODEL_WRITING = String(process.env.ORLIXOR_WRITING_MODEL || process.env.OPENAI_MODEL_WRITING || OPENAI_MODEL_CREATIVE || OPENAI_MODEL_DEFAULT || "gpt-4.1-mini").trim();
const OPENAI_MODEL_TONE = String(process.env.ORLIXOR_TONE_MODEL || process.env.OPENAI_MODEL_TONE || OPENAI_MODEL_WRITING || "gpt-4.1-mini").trim();
const OPENAI_MODEL_EXPAND = String(process.env.ORLIXOR_EXPAND_MODEL || process.env.OPENAI_MODEL_EXPAND || OPENAI_MODEL_WRITING || "gpt-4.1-mini").trim();
const OPENAI_MODEL_SUMMARY = String(process.env.ORLIXOR_SUMMARY_MODEL || process.env.OPENAI_MODEL_SUMMARY || OPENAI_MODEL_WRITING || "gpt-4.1-mini").trim();
const OPENAI_MODEL_CORRECTION = String(process.env.ORLIXOR_CORRECTION_MODEL || process.env.OPENAI_MODEL_CORRECTION || OPENAI_MODEL_WRITING || "gpt-4.1-mini").trim();
const OPENAI_MODEL_STYLE = String(process.env.ORLIXOR_STYLE_MODEL || process.env.OPENAI_MODEL_STYLE || OPENAI_MODEL_WRITING || "gpt-4.1-mini").trim();
const OPENAI_IMAGE_MODEL = String(process.env.OPENAI_IMAGE_MODEL || "dall-e-3").trim();
const OPENAI_RESPONSES_ENDPOINT = String(process.env.OPENAI_RESPONSES_ENDPOINT || "https://api.openai.com/v1/responses").trim();
const OPENAI_CHAT_COMPLETIONS_ENDPOINT = String(process.env.OPENAI_CHAT_COMPLETIONS_ENDPOINT || "https://api.openai.com/v1/chat/completions").trim();
const DEEPSEEK_API_KEY = readEnvValue(["DEEPSEEK_API_KEY", "ORLIXOR_DEEPSEEK_API_KEY"], "");
const DEEPSEEK_CHAT_COMPLETIONS_ENDPOINT = String(process.env.DEEPSEEK_CHAT_COMPLETIONS_ENDPOINT || "https://api.deepseek.com/chat/completions").trim();
const DEEPSEEK_CHAT_MODEL = String(process.env.DEEPSEEK_CHAT_MODEL || "deepseek-chat").trim();
const DEEPSEEK_REASONER_MODEL = String(process.env.DEEPSEEK_REASONER_MODEL || "deepseek-reasoner").trim();
const OPENAI_VISION_MODEL = String(process.env.ORLIXOR_VISION_MODEL || process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini").trim();
const ORLIXOR_IMAGE_ANALYSIS_MODEL = String(process.env.ORLIXOR_IMAGE_ANALYSIS_MODEL || process.env.OPENAI_IMAGE_ANALYSIS_MODEL || OPENAI_VISION_MODEL || "gpt-4.1-mini").trim();
const ORLIXOR_IMAGE_GENERATION_MODEL = String(process.env.ORLIXOR_IMAGE_GENERATION_MODEL || "gpt-image-1-mini").trim();
const ORLIXOR_IMAGE_GENERATION_PRO_MODEL = String(process.env.ORLIXOR_IMAGE_GENERATION_PRO_MODEL || "gpt-image-1.5").trim();
const OPENAI_IMAGES_GENERATIONS_ENDPOINT = String(process.env.OPENAI_IMAGES_GENERATIONS_ENDPOINT || "https://api.openai.com/v1/images/generations").trim();
const OPENAI_IMAGES_EDITS_ENDPOINT = String(process.env.OPENAI_IMAGES_EDITS_ENDPOINT || "https://api.openai.com/v1/images/edits").trim();
const OPENAI_EMBEDDINGS_ENDPOINT = String(process.env.OPENAI_EMBEDDINGS_ENDPOINT || "https://api.openai.com/v1/embeddings").trim();
const OPENAI_EMBEDDING_MODEL = String(process.env.ORLIXOR_EMBEDDING_MODEL || process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small").trim();
const ORLIXOR_ENABLE_EMBEDDINGS = /^(1|true|yes|on)$/i.test(String(process.env.ORLIXOR_ENABLE_EMBEDDINGS || "").trim());
const NEXTAUTH_URL = readEnvValue("NEXTAUTH_URL", "");
const NEXTAUTH_SECRET = readEnvValue("NEXTAUTH_SECRET", "");
const SUPABASE_URL = readEnvValue("SUPABASE_URL", "");
const SUPABASE_ANON_KEY = readEnvValue("SUPABASE_ANON_KEY", "");
const GOOGLE_CLIENT_ID = readEnvValue("GOOGLE_CLIENT_ID", "");
const GOOGLE_CLIENT_SECRET = readEnvValue("GOOGLE_CLIENT_SECRET", "");
const APPLE_CLIENT_ID = readEnvValue("APPLE_CLIENT_ID", "");
const APPLE_CLIENT_SECRET = readEnvValue("APPLE_CLIENT_SECRET", "");
const MICROSOFT_CLIENT_ID = readEnvValue("MICROSOFT_CLIENT_ID", "");
const MICROSOFT_CLIENT_SECRET = readEnvValue("MICROSOFT_CLIENT_SECRET", "");
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 25000);
const OPENAI_MAX_OUTPUT_TOKENS = Math.max(120, Math.min(Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 900), 2000));
const DB_INIT_TIMEOUT_MS = Math.max(1000, Number(process.env.DB_INIT_TIMEOUT_MS || 30000));
const MAX_BODY_BYTES = Math.max(10_000, Number(process.env.MAX_BODY_BYTES || 8_000_000));

function assertAiRuntimeConfig() {
  if (!OPENAI_API_KEY && !DEEPSEEK_API_KEY) {
    console.warn("[mullem] no text AI provider key configured. Set DEEPSEEK_API_KEY and/or OPENAI_API_KEY.");
  }
}

assertAiRuntimeConfig();
const MAX_IMAGE_INPUTS = Math.max(1, Math.min(Number(process.env.MAX_IMAGE_INPUTS || 4), 8));
const MAX_IMAGE_DATA_URL_BYTES = Math.max(100_000, Number(process.env.MAX_IMAGE_DATA_URL_BYTES || 1_800_000));
const MAX_MESSAGE_LENGTH = Math.max(200, Number(process.env.MAX_MESSAGE_LENGTH || 4000));
const MAX_QUESTION_LENGTH = Math.max(200, Number(process.env.MAX_QUESTION_LENGTH || 4000));
const MAX_METADATA_LENGTH = Math.max(40, Number(process.env.MAX_METADATA_LENGTH || 120));
const MAX_HISTORY_MESSAGES = Math.max(1, Math.min(Number(process.env.MAX_HISTORY_MESSAGES || 5), 30));
const RATE_LIMIT_WINDOW_MS = Math.max(1000, Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000));
const RATE_LIMIT_CHAT_MAX = Math.max(1, Number(process.env.RATE_LIMIT_CHAT_MAX || 20));
const RATE_LIMIT_SOLVE_MAX = Math.max(1, Number(process.env.RATE_LIMIT_SOLVE_MAX || 20));
const RATE_LIMIT_GENERAL_MAX = Math.max(1, Number(process.env.RATE_LIMIT_GENERAL_MAX || 60));
const PDF_PROTECTION_MAX_FILE_SIZE = Math.max(1024 * 1024, Number(process.env.PDF_PROTECTION_MAX_FILE_SIZE || 100 * 1024 * 1024));
const PDF_TOOL_TMP_DIR = path.join(ROOT_DIR, ".tmp", "pdf-tools");
const QPDF_BINARY = String(process.env.QPDF_BINARY || "qpdf").trim() || "qpdf";
const SEARCH_XP_COST = Math.max(1, Number(process.env.SEARCH_XP_COST || 10));
const SEARCH_DEEP_XP_COST = Math.max(SEARCH_XP_COST, Number(process.env.SEARCH_DEEP_XP_COST || 25));
const TONE_XP_COST = Math.max(1, Number(process.env.TONE_XP_COST || 5));
const EXPAND_XP_COST = Math.max(1, Number(process.env.EXPAND_XP_COST || process.env.WRITING_EXPAND_XP_COST || 8));
const EXPAND_LONG_XP_COST = Math.max(EXPAND_XP_COST, Number(process.env.EXPAND_LONG_XP_COST || 12));
const SUMMARY_XP_COST = Math.max(1, Number(process.env.SUMMARY_XP_COST || process.env.WRITING_SUMMARIZE_XP_COST || 6));
const SUMMARY_LONG_XP_COST = Math.max(SUMMARY_XP_COST, Number(process.env.SUMMARY_LONG_XP_COST || 10));
const CORRECTION_XP_COST = Math.max(1, Number(process.env.CORRECTION_XP_COST || process.env.WRITING_CORRECTION_XP_COST || 5));
const CORRECTION_STRONG_COST = Math.max(CORRECTION_XP_COST, Number(process.env.CORRECTION_STRONG_COST || 7));
const STYLE_XP_COST = Math.max(1, Number(process.env.STYLE_XP_COST || process.env.WRITING_STYLE_XP_COST || 5));
const STYLE_DEEP_XP_COST = Math.max(STYLE_XP_COST, Number(process.env.STYLE_DEEP_XP_COST || 8));
const WRITING_XP_COSTS = Object.freeze({
  rewrite: Math.max(1, Number(process.env.WRITING_REWRITE_XP_COST || 5)),
  tone: Math.max(1, Number(process.env.WRITING_TONE_XP_COST || 5)),
  summarize: Math.max(1, Number(process.env.WRITING_SUMMARIZE_XP_COST || 6)),
  expand: Math.max(1, Number(process.env.WRITING_EXPAND_XP_COST || 8)),
  style: STYLE_XP_COST,
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
const DEFAULT_ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL || "super.admin.orlixor.2026@orlixor.ai").trim().toLowerCase();
const DEFAULT_ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD || "Orlixor#Admin!2026$Secure-9Qv").trim();
const DEFAULT_ADMIN_NAME = String(process.env.DEFAULT_ADMIN_NAME || "Orlixor Super Admin").trim();
const DEFAULT_STUDENT_EMAIL = String(process.env.DEFAULT_STUDENT_EMAIL || "secure.user.orlixor.2026@orlixor.ai").trim().toLowerCase();
const DEFAULT_STUDENT_PASSWORD = String(process.env.DEFAULT_STUDENT_PASSWORD || "Orlixor#User!2026$Secure-4Lm").trim();
const DEFAULT_STUDENT_NAME = String(process.env.DEFAULT_STUDENT_NAME || "Orlixor Secure User").trim();
const TEXT_MESSAGE_XP_COST = Math.max(1, Number(process.env.TEXT_MESSAGE_XP_COST || process.env.TEXT_MESSAGE_XP_REWARD || 10));
const IMAGE_GENERATION_XP_COST = Math.max(1, Number(process.env.IMAGE_GENERATION_XP_COST || process.env.IMAGE_MESSAGE_XP_COST || process.env.IMAGE_MESSAGE_XP_REWARD || 15));
const ATTACHMENT_ANALYSIS_XP_COST = Math.max(1, Number(process.env.ATTACHMENT_ANALYSIS_XP_COST || process.env.ATTACHMENT_XP_COST || 20));
const IMAGE_TOOL_MAX_FILE_SIZE = Math.max(1024 * 1024, Number(process.env.IMAGE_TOOL_MAX_FILE_SIZE || 10 * 1024 * 1024));
const IMAGE_PROMPT_MAX_LENGTH = Math.max(120, Math.min(Number(process.env.IMAGE_PROMPT_MAX_LENGTH || 32000), 32000));
const IMAGE_XP_COSTS = Object.freeze({
  analyze: Math.max(1, Number(process.env.IMAGE_ANALYZE_XP_COST || 15)),
  generate_standard: Math.max(1, Number(process.env.IMAGE_GENERATE_STANDARD_XP_COST || 15)),
  generate_high: Math.max(1, Number(process.env.IMAGE_GENERATE_HIGH_XP_COST || 35)),
  edit: Math.max(1, Number(process.env.IMAGE_EDIT_XP_COST || 25))
});
const DAILY_REWARD_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FIRST_SIGNUP_XP = Math.max(0, Number(process.env.FIRST_SIGNUP_XP || 50));
const FREE_MAX_OUTPUT_TOKENS = Math.max(120, Math.min(Number(process.env.FREE_MAX_OUTPUT_TOKENS || 500), 1200));
const FREE_MAX_CONTEXT_TOKENS = Math.max(500, Math.min(Number(process.env.FREE_MAX_CONTEXT_TOKENS || 1500), 6000));
const PLAN_LIMITS = Object.freeze({
  free: {
    label: "Free",
    dailyXp: 5,
    dailyTokens: 20_000,
    monthlyTokens: 600_000,
    dailyImages: 1,
    perMessageTokens: 2_000,
    maxOutputTokens: 500,
    maxContextTokens: 1_500,
    requestsPerMinute: 5,
    queuePriority: 1,
    allowAdvanced: false,
    allowedModels: ["orlixor"],
    defaultModel: "orlixor"
  },
  spark: {
    label: "Spark",
    dailyXp: 80,
    dailyTokens: 120_000,
    monthlyTokens: 3_600_000,
    dailyImages: 5,
    perMessageTokens: 6_000,
    maxOutputTokens: 900,
    maxContextTokens: 4_000,
    requestsPerMinute: 12,
    queuePriority: 2,
    allowAdvanced: false,
    allowedModels: ["orlixor", "turbo"],
    defaultModel: "orlixor"
  },
  tuwaiq: {
    label: "Tuwaiq",
    dailyXp: 250,
    dailyTokens: 400_000,
    monthlyTokens: 12_000_000,
    dailyImages: 20,
    perMessageTokens: 12_000,
    maxOutputTokens: 1_400,
    maxContextTokens: 8_000,
    requestsPerMinute: 25,
    queuePriority: 3,
    allowAdvanced: true,
    allowedModels: ["orlixor", "turbo", "pro", "creative"],
    defaultModel: "pro"
  },
  pioneer: {
    label: "Pioneer",
    dailyXp: 600,
    dailyTokens: 1_000_000,
    monthlyTokens: 30_000_000,
    dailyImages: 60,
    perMessageTokens: 32_000,
    maxOutputTokens: 1_600,
    maxContextTokens: 16_000,
    requestsPerMinute: 60,
    queuePriority: 4,
    allowAdvanced: true,
    allowedModels: ["orlixor", "turbo", "pro", "creative", "alpha"],
    defaultModel: "pro"
  }
});
const AI_COST_WARNING_RATIO = Math.max(0.1, Math.min(Number(process.env.ORLIXOR_AI_COST_WARNING_RATIO || 0.8), 0.99));
const AI_SITE_DAILY_COST_LIMIT_USD = Math.max(0, readEnvNumber(["ORLIXOR_AI_SITE_DAILY_COST_LIMIT_USD", "AI_DAILY_COST_LIMIT"], 25));
const AI_USER_DAILY_COST_LIMIT_USD = Math.max(0, readEnvNumber("ORLIXOR_AI_USER_DAILY_COST_LIMIT_USD", 2));
const AI_PLAN_DAILY_COST_LIMITS_USD = Object.freeze({
  free: Math.max(0, readEnvNumber("ORLIXOR_AI_FREE_DAILY_COST_LIMIT_USD", 1)),
  spark: Math.max(0, readEnvNumber("ORLIXOR_AI_SPARK_DAILY_COST_LIMIT_USD", 5)),
  tuwaiq: Math.max(0, readEnvNumber("ORLIXOR_AI_TUWAIQ_DAILY_COST_LIMIT_USD", 12)),
  pioneer: Math.max(0, readEnvNumber("ORLIXOR_AI_PIONEER_DAILY_COST_LIMIT_USD", 25))
});
const AI_PROVIDER_DEGRADED_WINDOW_MS = Math.max(30_000, readEnvNumber("ORLIXOR_AI_PROVIDER_DEGRADED_WINDOW_MS", 5 * 60_000));
const AI_PROVIDER_FAILURE_STREAK_LIMIT = Math.max(1, readEnvNumber("ORLIXOR_AI_PROVIDER_FAILURE_STREAK_LIMIT", 3));
const ORLIXOR_AI_FORCE_SAFE_MODE = /^(1|true|yes|on)$/i.test(String(process.env.ORLIXOR_AI_FORCE_SAFE_MODE || process.env.AI_SAFE_MODE_ENABLED || "").trim());
const SESSION_SECRET = readEnvValue(["SESSION_SECRET", "JWT_SECRET", "NEXTAUTH_SECRET"], "");
const AI_ABUSE_WINDOW_MS = Math.max(30_000, readEnvNumber("ORLIXOR_AI_ABUSE_WINDOW_MS", 2 * 60_000));
const AI_ABUSE_RETRY_LIMIT = Math.max(3, readEnvNumber("ORLIXOR_AI_ABUSE_RETRY_LIMIT", 8));
const AI_ABUSE_SCRIPTED_LIMIT = Math.max(10, readEnvNumber("ORLIXOR_AI_ABUSE_SCRIPTED_LIMIT", 24));
const AI_TRUST_SHADOW_BAN_THRESHOLD = Math.max(50, Math.min(readEnvNumber("ORLIXOR_AI_TRUST_SHADOW_BAN_THRESHOLD", 75), 100));
const AI_REFERRAL_REWARD_XP = Math.max(0, Math.round(readEnvNumber("ORLIXOR_REFERRAL_REWARD_XP", 120)));
const AI_REFERRED_BONUS_XP = Math.max(0, Math.round(readEnvNumber("ORLIXOR_REFERRED_BONUS_XP", 20)));
const AI_USAGE_NOTIFICATION_RATIO = Math.max(0.5, Math.min(readEnvNumber("ORLIXOR_USAGE_NOTIFICATION_RATIO", 0.8), 0.95));
const AI_SUBSCRIPTION_EXPIRY_WARNING_DAYS = Math.max(1, Math.round(readEnvNumber("ORLIXOR_SUBSCRIPTION_EXPIRY_WARNING_DAYS", 3)));
const AI_XP_HEAVY_SPEND_THRESHOLD = Math.max(10, Math.round(readEnvNumber("ORLIXOR_XP_HEAVY_SPEND_THRESHOLD", 40)));
const AI_IMAGE_DAILY_HARD_STOP_FREE = Math.max(1, Math.round(readEnvNumber("ORLIXOR_FREE_IMAGE_DAILY_HARD_STOP", 1)));
const AI_IMAGE_DAILY_HARD_STOP_PAID = Math.max(1, Math.round(readEnvNumber("ORLIXOR_PAID_IMAGE_DAILY_HARD_STOP", 80)));
const AI_QUEUE_MAX_CONCURRENT = Math.max(1, Math.round(readEnvNumber("ORLIXOR_AI_QUEUE_MAX_CONCURRENT", 6)));
const AI_QUEUE_PRESSURE_THRESHOLD = Math.max(1, Math.round(readEnvNumber("ORLIXOR_AI_QUEUE_PRESSURE_THRESHOLD", 4)));
const AI_QUEUE_MAX_WAIT_MS = Math.max(500, readEnvNumber("ORLIXOR_AI_QUEUE_MAX_WAIT_MS", 8000));
const AI_REPEATED_QUESTION_KB_THRESHOLD = Math.max(3, Math.round(readEnvNumber("ORLIXOR_AI_REPEATED_QUESTION_KB_THRESHOLD", 5)));
const AI_OPENAI_INPUT_USD_PER_1M = Math.max(0, readEnvNumber("ORLIXOR_AI_OPENAI_INPUT_USD_PER_1M", 0.15));
const AI_OPENAI_OUTPUT_USD_PER_1M = Math.max(0, readEnvNumber("ORLIXOR_AI_OPENAI_OUTPUT_USD_PER_1M", 0.6));
const AI_DEEPSEEK_INPUT_USD_PER_1M = Math.max(0, readEnvNumber("ORLIXOR_AI_DEEPSEEK_INPUT_USD_PER_1M", 0.27));
const AI_DEEPSEEK_OUTPUT_USD_PER_1M = Math.max(0, readEnvNumber("ORLIXOR_AI_DEEPSEEK_OUTPUT_USD_PER_1M", 1.1));
const aiRuntimeState = {
  startedAt: new Date().toISOString(),
  providers: {
    deepseek: { configured: Boolean(DEEPSEEK_API_KEY), last_success_at: null, last_error_at: null, last_error: null, latency_samples: [], failure_streak: 0 },
    openai: { configured: Boolean(OPENAI_API_KEY), last_success_at: null, last_error_at: null, last_error: null, latency_samples: [], failure_streak: 0 }
  },
  rag: { last_success_at: null, last_error_at: null, last_error: null, latency_samples: [] },
  embeddings: { enabled: ORLIXOR_ENABLE_EMBEDDINGS, configured: Boolean(OPENAI_API_KEY), last_success_at: null, last_error_at: null, last_error: null, latency_samples: [] },
  loginFailures: [],
  safeModeOverride: null,
  safeModeUpdatedAt: null,
  safeModeUpdatedBy: null,
  featureFlagOverrides: {},
  incidents: [],
  scaling: {
    concurrentAiRequests: 0,
    queueSize: 0,
    maxConcurrentAiRequests: 0,
    queueWaitSamples: [],
    generationLatencySamples: [],
    totalRequests: 0,
    fallbackRecoveries: 0
  }
};
const DAILY_MOTIVATION_BONUS = Math.max(1, Number(process.env.DAILY_MOTIVATION_BONUS || 5));
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_MEMORY_LIMIT = Math.max(1, Math.min(Number(process.env.ACCOUNT_MEMORY_LIMIT || 5), 8));
const ACCOUNT_MEMORY_CANDIDATES = Math.max(ACCOUNT_MEMORY_LIMIT, Math.min(Number(process.env.ACCOUNT_MEMORY_CANDIDATES || 28), 60));
const ORLIXOR_ALPHA_ACCESS = String(process.env.ORLIXOR_ALPHA_ACCESS || "admin,beta_tester,pioneer")
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);
const modelProfiles = {
  orlixor: {
    key: "orlixor",
    name: "Orlixor AI",
    provider: DEEPSEEK_API_KEY ? "deepseek" : ORLIXOR_DEFAULT_PROVIDER,
    deepseekModel: DEEPSEEK_CHAT_MODEL,
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
    provider: ORLIXOR_TURBO_PROVIDER === "deepseek" && DEEPSEEK_API_KEY ? "deepseek" : "openai",
    deepseekModel: DEEPSEEK_CHAT_MODEL,
    openaiModel: OPENAI_MODEL_TURBO || OPENAI_MODEL,
    temperature: 0.4,
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
    provider: DEEPSEEK_API_KEY ? "deepseek" : ORLIXOR_PRO_PROVIDER,
    deepseekModel: DEEPSEEK_REASONER_MODEL,
    openaiModel: OPENAI_MODEL_PRO || OPENAI_MODEL,
    temperature: 0.4,
    minXpCost: 10,
    maxXpCost: 20,
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
    provider: ORLIXOR_CREATIVE_PROVIDER === "deepseek" && DEEPSEEK_API_KEY ? "deepseek" : "openai",
    deepseekModel: DEEPSEEK_REASONER_MODEL,
    openaiModel: OPENAI_MODEL_CREATIVE || OPENAI_MODEL,
    temperature: 0.8,
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
  },
  alpha: {
    key: "alpha",
    name: "Orlixor AI Alpha",
    provider: ORLIXOR_ALPHA_PROVIDER === "deepseek" && DEEPSEEK_API_KEY ? "deepseek" : "openai",
    deepseekModel: DEEPSEEK_REASONER_MODEL,
    openaiModel: ORLIXOR_ALPHA_MODEL || OPENAI_MODEL_PRO || OPENAI_MODEL,
    temperature: 0.35,
    minXpCost: 8,
    maxXpCost: 10,
    maxOutputTokens: Math.min(1000, OPENAI_MAX_OUTPUT_TOKENS),
    maxContextTokens: Math.max(FREE_MAX_CONTEXT_TOKENS, 4200),
    systemPrompt: [
      "أنت Orlixor AI Alpha.",
      "أنت نموذج تجريبي تحت التطوير داخل Orlixor.",
      "قدّم ردودًا دقيقة ومرتبة واحترافية.",
      "استفد من التقييمات لتحسين أسلوب الرد دون حفظ بيانات حساسة.",
      "لا تذكر أسماء مزودي الخدمة أو أسماء الموديلات التقنية."
    ].join("\n")
  }
};

function addLatencySample(target, latencyMs) {
  if (!target || !Number.isFinite(Number(latencyMs))) return;
  target.latency_samples = Array.isArray(target.latency_samples) ? target.latency_samples : [];
  target.latency_samples.push(Math.max(0, Math.round(Number(latencyMs))));
  if (target.latency_samples.length > 50) target.latency_samples.splice(0, target.latency_samples.length - 50);
}

function averageLatency(samples = []) {
  const safeSamples = (Array.isArray(samples) ? samples : []).map(Number).filter(Number.isFinite);
  if (!safeSamples.length) return 0;
  return Math.round(safeSamples.reduce((total, value) => total + value, 0) / safeSamples.length);
}

function recordAiProviderHealth(provider, ok, latencyMs = 0, error = null) {
  const key = normalizeProviderKey(provider);
  const target = aiRuntimeState.providers[key];
  if (!target) return;
  addLatencySample(target, latencyMs);
  if (ok) {
    target.last_success_at = new Date().toISOString();
    target.last_error = null;
    target.failure_streak = 0;
    realScaleInfra.recordProviderSuccess(key, latencyMs);
    return;
  }
  target.last_error_at = new Date().toISOString();
  target.last_error = String(error?.message || error || "Unknown AI provider error").slice(0, 500);
  target.failure_streak = Math.max(1, Number(target.failure_streak || 0) + 1);
  realScaleInfra.recordProviderFailure(key, error);
}

function recordAiSubsystemHealth(subsystem, ok, latencyMs = 0, error = null) {
  const target = aiRuntimeState[subsystem];
  if (!target) return;
  addLatencySample(target, latencyMs);
  if (ok) {
    target.last_success_at = new Date().toISOString();
    target.last_error = null;
    return;
  }
  target.last_error_at = new Date().toISOString();
  target.last_error = String(error?.message || error || `Unknown ${subsystem} error`).slice(0, 500);
}

function recordLoginFailure(code, status = 0) {
  const now = Date.now();
  aiRuntimeState.loginFailures.push({
    at: now,
    code: String(code || "LOGIN_FAILED").slice(0, 80),
    status: Number(status || 0)
  });
  aiRuntimeState.loginFailures = aiRuntimeState.loginFailures.filter((item) => now - Number(item.at || 0) <= 60 * 60_000);
}

function hashPrivacyValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  return crypto.createHash("sha256").update(`${SESSION_SECRET || "mullem"}:${raw}`).digest("hex").slice(0, 40);
}

function getBusinessRoute(req) {
  return String(req?.url || "/").split("?")[0].slice(0, 160);
}

function getBusinessContext(req) {
  const context = req?.__businessContext || {};
  const user = context.user || null;
  return {
    user,
    user_id: user?.id || context.user_id || null,
    plan: context.plan || (user ? getUserPlanKey(user) : null),
    route: context.route || getBusinessRoute(req),
    operation: context.operation || null,
    message: context.message || ""
  };
}

function buildSmartUpsell({ code = "", plan = "free", operation = "chat", analysis = {}, reason = "" } = {}) {
  const normalizedCode = String(code || "").toUpperCase();
  const taskType = String(analysis.taskType || analysis.task_type || reason || operation || "").toLowerCase();
  if (String(plan || "free").toLowerCase() !== "free") return null;
  if (normalizedCode.includes("IMAGE") || taskType.includes("image")) {
    return {
      target_plan: "spark",
      title: "هذه الميزة متاحة في باقة Spark",
      message: "الصور والاستخدام الأعلى متاحان في Spark، ويمكنك الترقية للوصول بدون توقف مزعج."
    };
  }
  if (normalizedCode.includes("TOKEN") || normalizedCode.includes("LIMIT")) {
    return {
      target_plan: "spark",
      title: "ارفع باقتك للوصول لحدود أعلى",
      message: "باقة Spark تعطي حدود XP وتوكن أعلى للرسائل اليومية."
    };
  }
  if (taskType.includes("code") || taskType.includes("reason") || normalizedCode.includes("UPGRADE")) {
    return {
      target_plan: "tuwaiq",
      title: "التحليل المتقدم متاح في طويق",
      message: "طلبات الكود والتحليل العميق تعمل بشكل أفضل في باقة طويق."
    };
  }
  return {
    target_plan: "spark",
    title: "هذه الميزة متاحة في باقة Spark",
    message: "ارفع باقتك للوصول الكامل مع حدود أعلى وتجربة أسرع."
  };
}

async function recordBusinessEventSafe(req, payload = {}) {
  if (!isDatabaseReady() || typeof databaseClient?.recordBusinessEvent !== "function") return;
  try {
    const context = getBusinessContext(req);
    const metadata = {
      ...(payload.metadata || {}),
      request_id: req?.__requestId || null,
      ip_hash: hashPrivacyValue(getClientIp(req)),
      message_hash: payload.message_hash || hashPrivacyValue(context.message),
      message_length: context.message ? String(context.message).length : undefined
    };
    await databaseClient.recordBusinessEvent({
      user_id: payload.user_id || context.user_id || null,
      event_type: payload.event_type || "event",
      reason: payload.reason || null,
      plan: payload.plan || context.plan || null,
      route: payload.route || context.route || null,
      metadata
    });
  } catch (error) {
    console.warn("[BETA_EVENT_SKIPPED]", error?.message || error);
  }
}

async function recordAbuseEventSafe(req, payload = {}) {
  if (!isDatabaseReady() || typeof databaseClient?.recordAbuseEvent !== "function") return;
  try {
    const context = getBusinessContext(req);
    await databaseClient.recordAbuseEvent({
      user_id: payload.user_id || context.user_id || null,
      ip_hash: hashPrivacyValue(getClientIp(req)),
      action: payload.action || "observe",
      reasons: payload.reasons || [],
      score: payload.score || 0,
      route: payload.route || context.route || null,
      prompt_hash: payload.prompt_hash || hashPrivacyValue(context.message),
      metadata: {
        ...(payload.metadata || {}),
        request_id: req?.__requestId || null,
        plan: context.plan || null,
        operation: context.operation || null
      }
    });
    if (context.user_id && typeof databaseClient.updateUser === "function") {
      const currentAbuse = Math.max(0, Number(context.user?.abuse_score || context.user?.abuseScore || 0));
      const currentTrust = Number.isFinite(Number(context.user?.trust_score || context.user?.trustScore))
        ? Number(context.user?.trust_score || context.user?.trustScore)
        : 70;
      const scoreDelta = Math.max(1, Math.ceil(Number(payload.score || 0) / 8));
      const nextAbuse = Math.min(100, currentAbuse + scoreDelta);
      const nextTrust = Math.max(0, currentTrust - Math.ceil(Number(payload.score || 0) / 12));
      await databaseClient.updateUser(context.user_id, {
        abuse_score: nextAbuse,
        trust_score: nextTrust,
        shadow_banned: nextAbuse >= AI_TRUST_SHADOW_BAN_THRESHOLD || payload.action === "shadow_limit" || Boolean(context.user?.shadow_banned)
      }).catch((error) => console.warn("[REPUTATION_UPDATE_SKIPPED]", error?.message || error));
    }
  } catch (error) {
    console.warn("[ABUSE_EVENT_SKIPPED]", error?.message || error);
  }
}

async function createUserNotificationSafe(user, key, title, body, options = {}) {
  if (!user?.id || !isDatabaseReady() || typeof databaseClient?.createNotification !== "function") return null;
  try {
    const day = new Date().toISOString().slice(0, 10);
    const safeKey = String(key || "notice").replace(/[^a-z0-9_-]/gi, "_").slice(0, 60);
    return await databaseClient.createNotification({
      title: `${String(title || "Notification").slice(0, 120)} #${user.id}-${safeKey}-${day}`,
      body: String(body || "").slice(0, 900),
      type: options.type || "account",
      badge: options.badge || "AI",
      icon: options.icon || "bell",
      target_plan: "all",
      target_user_id: user.id,
      action_url: options.action_url || options.actionUrl || null,
      starts_at: new Date().toISOString(),
      expires_at: options.expires_at || options.expiresAt || null,
      is_active: true
    });
  } catch (error) {
    console.warn("[USER_NOTIFICATION_SKIPPED]", error?.message || error);
    return null;
  }
}

async function notifyUsageSignals(req, { user, routing = {}, stats = {}, usage = {}, xpCost = 0, quality = {}, result = {} } = {}) {
  if (!user?.id) return;
  const inputTokens = Number(usage.input_tokens || usage.prompt_tokens || 0);
  const outputTokens = Number(usage.output_tokens || usage.completion_tokens || 0);
  const projectedDailyTokens = Number(stats.dailyTokens || 0) + inputTokens + outputTokens;
  const dailyTokenLimit = Number(routing.limits?.dailyTokens || 0);
  if (dailyTokenLimit > 0 && projectedDailyTokens / dailyTokenLimit >= AI_USAGE_NOTIFICATION_RATIO) {
    await createUserNotificationSafe(
      user,
      "daily-limit-80",
      "Daily AI limit is close",
      `You have used about ${Math.round((projectedDailyTokens * 100) / dailyTokenLimit)}% of your daily AI token limit.`,
      { type: "account", badge: "Usage", icon: "bell" }
    );
    recordBusinessEventSafe(req, { event_type: "notification_sent", reason: "daily_limit_80", plan: routing.planKey });
  }
  if (Number(xpCost || 0) >= AI_XP_HEAVY_SPEND_THRESHOLD) {
    await createUserNotificationSafe(
      user,
      "heavy-xp-spend",
      "Large XP usage",
      `This request used ${Math.round(Number(xpCost || 0))} XP. Heavy requests are protected by plan and cost limits.`,
      { type: "account", badge: "XP", icon: "sparkle" }
    );
  }
  const daysRemaining = calculateRemainingDays(user.package_expires_at || user.packageExpiresAt);
  if (daysRemaining != null && daysRemaining > 0 && daysRemaining <= AI_SUBSCRIPTION_EXPIRY_WARNING_DAYS) {
    await createUserNotificationSafe(
      user,
      "subscription-expiring",
      "Subscription renewal is close",
      `Your current plan renews in ${daysRemaining} day(s).`,
      { type: "account", badge: "Plan", icon: "bell" }
    );
  }
  if (routing.safeModeActive) {
    await createUserNotificationSafe(
      user,
      "safe-mode-active",
      "AI Safe Mode is active",
      "We are temporarily reducing heavy AI usage to keep the service stable.",
      { type: "system", badge: "Safe Mode", icon: "megaphone" }
    );
  }
  if (Number(quality.qualityScore || 0) >= 86 && (result.recovered || Number((routing.routeReason || "").includes("rerouted")))) {
    await createUserNotificationSafe(
      user,
      "quality-upgrade",
      "AI quality was upgraded",
      "Your request was routed to a better model path for this task.",
      { type: "account", badge: "Quality", icon: "sparkle" }
    );
  }
}

function normalizeQuestionForExpansion(message) {
  const sanitized = aiIntelligence.sanitizeSensitiveText(message || "");
  return String(sanitized.text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s؟?]/gu, "")
    .trim()
    .slice(0, 500);
}

async function recordKnowledgeExpansionCandidate(req, { message = "", routing = {}, ragSources = 0 } = {}) {
  if (Number(ragSources || 0) > 0 || !isDatabaseReady() || typeof databaseClient?.saveKnowledgeSuggestion !== "function") return null;
  const normalized = normalizeQuestionForExpansion(message);
  if (!normalized || normalized.length < 12) return null;
  const key = hashPrivacyValue(normalized);
  const now = Date.now();
  const current = questionFrequencyStore.get(key) || { count: 0, firstAt: now, lastAt: now };
  current.count += 1;
  current.lastAt = now;
  questionFrequencyStore.set(key, current);
  if (current.count < AI_REPEATED_QUESTION_KB_THRESHOLD) return null;
  const suggestion = await databaseClient.saveKnowledgeSuggestion({
    question_hash: key,
    sanitized_question: normalized,
    proposed_title: normalized.slice(0, 120),
    proposed_category: routing.taskType || "faq",
    reason: "repeated_question_without_rag_source",
    metadata: {
      count: current.count,
      task_type: routing.taskType || null,
      plan: routing.planKey || null,
      route: getBusinessRoute(req)
    }
  });
  recordBusinessEventSafe(req, {
    event_type: "knowledge_suggestion_created",
    reason: "repeated_question",
    plan: routing.planKey,
    metadata: { question_hash: key, occurrences: current.count }
  });
  return suggestion;
}

function classifyBusinessError(error) {
  const code = String(error?.publicCode || "").toUpperCase();
  if (!code) return null;
  if (code.includes("UPGRADE")) return { event_type: "upsell_shown", reason: code };
  if (code.includes("LIMIT")) return { event_type: "limit_exceeded", reason: code };
  if (code.includes("SAFE_MODE")) return { event_type: "safe_mode_block", reason: code };
  if (code.includes("RATE")) return { event_type: "rate_limited", reason: code };
  if (code.includes("ABUSE")) return { event_type: "abuse_block", reason: code };
  return null;
}

function recordBusinessErrorSafe(req, error) {
  const event = classifyBusinessError(error);
  if (!event) return;
  const context = getBusinessContext(req);
  recordBusinessEventSafe(req, {
    ...event,
    metadata: {
      status: error?.statusCode || 500,
      upsell: error?.details?.upsell || null,
      route: context.route
    }
  });
}

function detectAiAbuseSignals({ req, user, message = "", operation = "chat", plan = "free" } = {}) {
  const now = Date.now();
  const text = String(message || "");
  const normalized = text.toLowerCase();
  const promptHash = hashPrivacyValue(text) || "empty";
  const identity = String(user?.id || hashPrivacyValue(getClientIp(req)) || "guest");
  const key = `${identity}:${operation}`;
  const current = abuseSignalStore.get(key) || { events: [], promptCounts: new Map() };
  current.events = (current.events || []).filter((item) => now - Number(item.at || 0) <= AI_ABUSE_WINDOW_MS);
  current.promptCounts = current.events.reduce((map, item) => {
    map.set(item.promptHash, (map.get(item.promptHash) || 0) + 1);
    return map;
  }, new Map());
  const repeated = (current.promptCounts.get(promptHash) || 0) + 1;
  current.events.push({ at: now, promptHash });
  abuseSignalStore.set(key, current);

  const reasons = [];
  const userAbuseScore = Math.max(0, Number(user?.abuse_score || user?.abuseScore || 0));
  if (user?.shadow_banned || user?.shadowBanned || userAbuseScore >= AI_TRUST_SHADOW_BAN_THRESHOLD) {
    reasons.push("shadow_banned_reputation");
  }
  if (/ignore (all )?(previous|system)|developer message|system prompt|bypass|jailbreak|prompt injection|كشف التعليمات|تجاهل التعليمات|اكشف البرومبت/i.test(text)) {
    reasons.push("prompt_injection_attempt");
  }
  if (repeated >= AI_ABUSE_RETRY_LIMIT) reasons.push("excessive_retries");
  if (current.events.length >= AI_ABUSE_SCRIPTED_LIMIT) reasons.push("scripted_requests");
  if (estimateTokens(text) > (PLAN_LIMITS[plan]?.perMessageTokens || PLAN_LIMITS.free.perMessageTokens) * 2) reasons.push("token_abuse");
  if (/(.)\1{60,}/.test(text) || (text.match(/https?:\/\//gi) || []).length >= 8) reasons.push("spam_prompt");

  const score = reasons.reduce((total, reason) => total + ({
    prompt_injection_attempt: 35,
    excessive_retries: 30,
    scripted_requests: 45,
    token_abuse: 35,
    spam_prompt: 25,
    shadow_banned_reputation: 40
  }[reason] || 10), 0);
  const action = score >= 80 ? "temporary_block" : score >= 55 ? "cooldown" : score >= 35 ? "shadow_limit" : "allow";
  return {
    action,
    score,
    reasons,
    promptHash,
    shadowLimit: action === "shadow_limit"
  };
}

async function enforceAiAbuseProtection(req, { user, message = "", operation = "chat", plan = "free" } = {}) {
  const signal = detectAiAbuseSignals({ req, user, message, operation, plan });
  if (!signal.reasons.length) return signal;
  await recordAbuseEventSafe(req, {
    action: signal.action,
    reasons: signal.reasons,
    score: signal.score,
    prompt_hash: signal.promptHash
  });
  await realScaleInfra.trackAbuseSignal(
    `${user?.id || getClientIp(req)}:${operation}`,
    signal.reasons.join(",") || signal.action,
    AI_ABUSE_WINDOW_MS
  );
  if (signal.action === "temporary_block") {
    throw createPublicHttpError(429, "ABUSE_TEMPORARY_BLOCK", "تم إيقاف الطلب مؤقتًا بسبب نمط استخدام غير طبيعي. حاول لاحقًا.", {
      reasons: signal.reasons,
      cooldownMs: AI_ABUSE_WINDOW_MS
    });
  }
  if (signal.action === "cooldown") {
    throw createPublicHttpError(429, "ABUSE_COOLDOWN", "طلبات كثيرة أو متكررة بسرعة. انتظر قليلًا ثم حاول من جديد.", {
      reasons: signal.reasons,
      cooldownMs: Math.min(AI_ABUSE_WINDOW_MS, 60_000)
    });
  }
  return signal;
}

function estimateAiCostUsd(provider, usage = {}) {
  const key = normalizeProviderKey(provider);
  const inputTokens = Math.max(0, Number(usage.input_tokens || usage.prompt_tokens || usage.inputTokens || 0));
  const outputTokens = Math.max(0, Number(usage.output_tokens || usage.completion_tokens || usage.outputTokens || 0));
  const inputRate = key === "deepseek" ? AI_DEEPSEEK_INPUT_USD_PER_1M : AI_OPENAI_INPUT_USD_PER_1M;
  const outputRate = key === "deepseek" ? AI_DEEPSEEK_OUTPUT_USD_PER_1M : AI_OPENAI_OUTPUT_USD_PER_1M;
  return Number((((inputTokens * inputRate) + (outputTokens * outputRate)) / 1_000_000).toFixed(6));
}

function getProviderStatus(provider) {
  const state = aiRuntimeState.providers[normalizeProviderKey(provider)] || {};
  if (!state.configured) return "not_configured";
  const lastErrorAt = state.last_error_at ? new Date(state.last_error_at).getTime() : 0;
  const recentlyFailed = lastErrorAt && Date.now() - lastErrorAt <= AI_PROVIDER_DEGRADED_WINDOW_MS;
  if (recentlyFailed && Number(state.failure_streak || 0) >= AI_PROVIDER_FAILURE_STREAK_LIMIT) return "degraded";
  if (state.last_success_at) return "ok";
  return "configured";
}

function buildProviderHealth(provider) {
  const key = normalizeProviderKey(provider);
  const state = aiRuntimeState.providers[key] || {};
  return {
    provider: key,
    configured: Boolean(state.configured),
    status: getProviderStatus(key),
    last_success_at: state.last_success_at || null,
    last_error_at: state.last_error_at || null,
    last_error: state.last_error || null,
    failure_streak: Number(state.failure_streak || 0),
    avg_latency_ms: averageLatency(state.latency_samples)
  };
}

function buildCostBudgets() {
  return {
    site_daily_usd: AI_SITE_DAILY_COST_LIMIT_USD,
    user_daily_usd: AI_USER_DAILY_COST_LIMIT_USD,
    warning_ratio: AI_COST_WARNING_RATIO,
    plan_daily_usd: { ...AI_PLAN_DAILY_COST_LIMITS_USD }
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms || 0))));
}

function addScalingSample(key, value) {
  const scaling = aiRuntimeState.scaling || {};
  const list = scaling[key];
  if (!Array.isArray(list)) return;
  list.push({ at: Date.now(), value: Math.max(0, Math.round(Number(value || 0))) });
  while (list.length > 200) list.shift();
}

function averageScalingSample(key) {
  const list = Array.isArray(aiRuntimeState.scaling?.[key]) ? aiRuntimeState.scaling[key] : [];
  if (!list.length) return 0;
  return Math.round(list.reduce((total, item) => total + Number(item.value || 0), 0) / list.length);
}

function getQueueDelayMs(priority = 1) {
  const scaling = aiRuntimeState.scaling;
  const pressure = Math.max(0, Number(scaling.concurrentAiRequests || 0) - AI_QUEUE_PRESSURE_THRESHOLD + Number(scaling.queueSize || 0));
  if (pressure <= 0) return 0;
  const normalizedPriority = Math.max(1, Math.min(4, Math.round(Number(priority || 1))));
  const priorityMultiplier = { 1: 1.6, 2: 1.0, 3: 0.55, 4: 0.2 }[normalizedPriority] || 1;
  return Math.min(AI_QUEUE_MAX_WAIT_MS, Math.round(pressure * 350 * priorityMultiplier));
}

async function withAiQueueSlot({ routing = {}, operation = "chat" } = {}, task) {
  const scaling = aiRuntimeState.scaling;
  const priority = Math.max(1, Math.min(4, Number(routing.queuePriority || 1)));
  const waitMs = getQueueDelayMs(priority);
  scaling.queueSize += 1;
  const queuedAt = Date.now();
  try {
    if (waitMs > 0) await delay(waitMs);
  } finally {
    scaling.queueSize = Math.max(0, Number(scaling.queueSize || 0) - 1);
  }
  const queueWaitMs = Date.now() - queuedAt;
  addScalingSample("queueWaitSamples", queueWaitMs);
  scaling.concurrentAiRequests += 1;
  scaling.totalRequests += 1;
  scaling.maxConcurrentAiRequests = Math.max(Number(scaling.maxConcurrentAiRequests || 0), Number(scaling.concurrentAiRequests || 0));
  const generationStartedAt = Date.now();
  try {
    const result = await task();
    return {
      ...result,
      queue: {
        priority,
        operation,
        waited_ms: queueWaitMs,
        pressure: Math.max(0, Number(scaling.concurrentAiRequests || 0) - 1)
      }
    };
  } finally {
    addScalingSample("generationLatencySamples", Date.now() - generationStartedAt);
    scaling.concurrentAiRequests = Math.max(0, Number(scaling.concurrentAiRequests || 0) - 1);
  }
}

function buildDeepSeekFallbackProfile(profile = {}) {
  if (!DEEPSEEK_API_KEY) return null;
  return {
    ...(profile || modelProfiles.orlixor),
    provider: "deepseek",
    deepseekModel: DEEPSEEK_CHAT_MODEL,
    openaiModel: OPENAI_MODEL_DEFAULT || OPENAI_MODEL,
    maxOutputTokens: Math.min(Number(profile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 700),
    maxContextTokens: Math.min(Number(profile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS), FREE_MAX_CONTEXT_TOKENS)
  };
}

function buildOpenAiFallbackProfile(profile = {}) {
  if (!OPENAI_API_KEY) return null;
  return {
    ...(profile || modelProfiles.orlixor),
    provider: "openai",
    openaiModel: OPENAI_MODEL_DEFAULT || OPENAI_MODEL || "gpt-4.1-mini",
    maxOutputTokens: Math.min(Number(profile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 800),
    maxContextTokens: Math.min(Number(profile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS), FREE_MAX_CONTEXT_TOKENS)
  };
}

async function callAiWithSessionRecovery({ input, modelProfile, routing = {}, operation = "chat" } = {}) {
  const primaryProfile = modelProfile || routing.modelProfile || modelProfiles.orlixor;
  const primaryProvider = resolveProfileProvider(primaryProfile);
  const providerFallbackEnabled = isAiFeatureEnabled("provider_fallback");
  const primaryCircuit = realScaleInfra.canCallProvider(primaryProvider);
  if (!primaryCircuit.allowed) {
    if (!providerFallbackEnabled) {
      throw createPublicHttpError(503, "AI_PROVIDER_CIRCUIT_OPEN", "AI provider is temporarily unavailable. Please try again shortly.", {
        provider: primaryProvider,
        retry_after_ms: primaryCircuit.retry_after_ms || 0,
        fallback_disabled: true
      });
    }
    const circuitFallbackProfile = primaryProvider === "openai"
      ? buildDeepSeekFallbackProfile(primaryProfile)
      : buildOpenAiFallbackProfile(primaryProfile);
    if (!circuitFallbackProfile) {
      throw createPublicHttpError(503, "AI_PROVIDER_CIRCUIT_OPEN", "AI provider is temporarily unavailable. Please try again shortly.", {
        provider: primaryProvider,
        retry_after_ms: primaryCircuit.retry_after_ms || 0
      });
    }
    console.warn("[AI_CIRCUIT_FALLBACK]", {
      operation,
      from: primaryProvider,
      to: resolveProfileProvider(circuitFallbackProfile),
      retry_after_ms: primaryCircuit.retry_after_ms || 0
    });
    const recovered = await callOpenAI({ input, modelProfile: circuitFallbackProfile });
    aiRuntimeState.scaling.fallbackRecoveries += 1;
    return {
      ...recovered,
      recovered: true,
      provider: recovered.provider || resolveProfileProvider(circuitFallbackProfile),
      fallback: {
        from_provider: primaryProvider,
        to_provider: resolveProfileProvider(circuitFallbackProfile),
        reason: "provider_circuit_open"
      }
    };
  }
  try {
    const primaryResult = await callOpenAI({ input, modelProfile: primaryProfile });
    return { ...primaryResult, recovered: false, provider: primaryResult.provider || primaryProvider };
  } catch (error) {
    if (!providerFallbackEnabled) throw error;
    const fallbackProfile = primaryProvider === "openai"
      ? buildDeepSeekFallbackProfile(primaryProfile)
      : buildOpenAiFallbackProfile(primaryProfile);
    if (!fallbackProfile) throw error;
    console.warn("[AI_SESSION_RECOVERY]", {
      operation,
      from: primaryProvider,
      to: resolveProfileProvider(fallbackProfile),
      route_reason: routing.routeReason || "",
      message: error?.message || String(error || "")
    });
    const recovered = await callOpenAI({ input, modelProfile: fallbackProfile });
    aiRuntimeState.scaling.fallbackRecoveries += 1;
    return {
      ...recovered,
      recovered: true,
      provider: recovered.provider || resolveProfileProvider(fallbackProfile),
      fallback: {
        from_provider: primaryProvider,
        to_provider: resolveProfileProvider(fallbackProfile),
        reason: String(error?.message || error || "provider_failed").slice(0, 240)
      }
    };
  }
}

function buildScalingSnapshot() {
  const scaling = aiRuntimeState.scaling || {};
  const memory = process.memoryUsage ? process.memoryUsage() : {};
  const cpu = process.cpuUsage ? process.cpuUsage() : {};
  return {
    concurrent_requests: Number(scaling.concurrentAiRequests || 0),
    queue_size: Number(scaling.queueSize || 0),
    max_concurrent_requests: Number(scaling.maxConcurrentAiRequests || 0),
    avg_queue_wait_ms: averageScalingSample("queueWaitSamples"),
    avg_generation_ms: averageScalingSample("generationLatencySamples"),
    total_requests_since_start: Number(scaling.totalRequests || 0),
    fallback_recoveries_since_start: Number(scaling.fallbackRecoveries || 0),
    cpu_pressure: {
      user_microseconds: Number(cpu.user || 0),
      system_microseconds: Number(cpu.system || 0),
      note: "process cumulative CPU usage"
    },
    memory_pressure: {
      rss_mb: Math.round(Number(memory.rss || 0) / 1024 / 1024),
      heap_used_mb: Math.round(Number(memory.heapUsed || 0) / 1024 / 1024),
      heap_total_mb: Math.round(Number(memory.heapTotal || 0) / 1024 / 1024)
    },
    scaling_recommendations: buildScalingRecommendations()
  };
}

function buildScalingRecommendations() {
  const recommendations = [];
  const avgWait = averageScalingSample("queueWaitSamples");
  const avgGeneration = averageScalingSample("generationLatencySamples");
  const scaling = aiRuntimeState.scaling || {};
  const memory = process.memoryUsage ? process.memoryUsage() : {};
  if (Number(scaling.queueSize || 0) >= AI_QUEUE_PRESSURE_THRESHOLD || avgWait > 1200) {
    recommendations.push("Introduce Redis-backed queue workers before increasing traffic.");
  }
  if (Number(scaling.concurrentAiRequests || 0) >= AI_QUEUE_MAX_CONCURRENT || avgGeneration > 12000) {
    recommendations.push("Split AI generation into a separate worker/service.");
  }
  if (Number(memory.heapUsed || 0) > 350 * 1024 * 1024) {
    recommendations.push("Add memory profiling and move long-running jobs to background workers.");
  }
  if (!recommendations.length) {
    recommendations.push("Current in-process queue is acceptable for beta scale.");
  }
  return recommendations;
}

function getCostLimitStatus(used = 0, limit = 0) {
  const safeUsed = Math.max(0, Number(used || 0));
  const safeLimit = Math.max(0, Number(limit || 0));
  if (!safeLimit) return { used: safeUsed, limit: safeLimit, ratio: 0, status: "unlimited" };
  const ratio = safeUsed / safeLimit;
  return {
    used: Number(safeUsed.toFixed(6)),
    limit: safeLimit,
    ratio: Number(ratio.toFixed(4)),
    status: ratio >= 1 ? "blocked" : ratio >= AI_COST_WARNING_RATIO ? "warning" : "ok"
  };
}

function isProviderDegradedForSafeMode() {
  return ["deepseek", "openai"].some((provider) => getProviderStatus(provider) === "degraded");
}

function buildSafeModeState(costStats = {}, options = {}) {
  const site = getCostLimitStatus(costStats.site_daily_cost_usd, AI_SITE_DAILY_COST_LIMIT_USD);
  const manualEnabled = aiRuntimeState.safeModeOverride === true;
  const envForced = ORLIXOR_AI_FORCE_SAFE_MODE;
  const simulated = Boolean(options.simulateSafeMode);
  const forced = envForced || manualEnabled || simulated;
  const providerDegraded = isProviderDegradedForSafeMode();
  const active = forced || site.status === "blocked" || providerDegraded;
  const reasons = [];
  if (simulated) reasons.push("simulation");
  if (envForced) reasons.push("forced_by_env");
  if (manualEnabled) reasons.push("manual_admin_override");
  if (site.status === "blocked") reasons.push("site_daily_cost_limit");
  if (providerDegraded) reasons.push("provider_degraded");
  return {
    active,
    reasons,
    manual_override: aiRuntimeState.safeModeOverride,
    manual_updated_at: aiRuntimeState.safeModeUpdatedAt,
    env_forced: envForced,
    site_cost: site,
    restrictions: active ? {
      free_deepseek_only: true,
      images_disabled: true,
      heavy_requests_disabled: true,
      reduced_context: true
    } : {
      free_deepseek_only: false,
      images_disabled: false,
      heavy_requests_disabled: false,
      reduced_context: false
    }
  };
}

function getFeatureFlagsSync() {
  return aiOps.buildFeatureFlags(process.env, aiRuntimeState.featureFlagOverrides || {});
}

function isAiFeatureEnabled(key) {
  const flags = getFeatureFlagsSync();
  return Boolean(flags?.[key]?.enabled);
}

async function loadFeatureFlagOverrides() {
  const stored = await realScaleInfra.getJson("ops:feature_flags");
  if (stored && typeof stored === "object") {
    aiRuntimeState.featureFlagOverrides = {
      ...(aiRuntimeState.featureFlagOverrides || {}),
      ...(stored.overrides || stored)
    };
  }
  return aiRuntimeState.featureFlagOverrides || {};
}

async function saveFeatureFlagOverrides(overrides) {
  aiRuntimeState.featureFlagOverrides = { ...(overrides || {}) };
  await realScaleInfra.setJson("ops:feature_flags", {
    overrides: aiRuntimeState.featureFlagOverrides,
    updated_at: new Date().toISOString()
  }, 30 * 24 * 60 * 60_000);
  return aiRuntimeState.featureFlagOverrides;
}

async function listOpsIncidents() {
  const stored = await realScaleInfra.getJson("ops:incidents");
  if (Array.isArray(stored?.items)) {
    aiRuntimeState.incidents = stored.items;
  }
  return Array.isArray(aiRuntimeState.incidents) ? aiRuntimeState.incidents : [];
}

async function saveOpsIncidents(items) {
  aiRuntimeState.incidents = (Array.isArray(items) ? items : [])
    .slice()
    .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")))
    .slice(0, 100);
  await realScaleInfra.setJson("ops:incidents", {
    items: aiRuntimeState.incidents,
    updated_at: new Date().toISOString()
  }, 90 * 24 * 60 * 60_000);
  return aiRuntimeState.incidents;
}

async function buildOperationalExcellenceSnapshot(options = {}) {
  await loadFeatureFlagOverrides();
  const health = await buildAiHealthSnapshot(options);
  const realScale = await buildRealScaleSnapshot();
  const errorBudgetPolicy = aiOps.buildErrorBudgetPolicy(process.env);
  const errorBudget = aiOps.evaluateErrorBudget({
    policy: errorBudgetPolicy,
    health,
    realScale: realScale.real_scale
  });
  const incidents = await listOpsIncidents();
  return {
    generated_at: new Date().toISOString(),
    release: aiOps.buildReleaseDiscipline(process.env),
    ai_versions: aiOps.buildAiVersionManifest(process.env),
    feature_flags: getFeatureFlagsSync(),
    error_budget: {
      policy: errorBudgetPolicy,
      evaluation: errorBudget
    },
    incidents: {
      open_count: incidents.filter((item) => item.status !== "resolved").length,
      recent: incidents.slice(0, 10),
      postmortem_template: aiOps.buildPostmortemTemplate()
    },
    smoke_tests: {
      required_after_deploy: [
        "npm run ai:smoke",
        "npm run ai:quality",
        "npm run ai:real-scale-check",
        "npm run ai:load-test",
        "npm run ai:production-activation-check"
      ],
      fail_deploy_on_smoke_failure: true
    },
    health,
    real_scale: realScale
  };
}

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
const abuseSignalStore = new Map();
const questionFrequencyStore = new Map();
const authTokenFallbackSessions = new Map();
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
    if (!IS_CLOUD_RUNTIME) {
      return { allowAll: true, values: [] };
    }
    const runtimeOrigins = [
      process.env.RENDER_EXTERNAL_URL,
      process.env.PUBLIC_APP_URL,
      process.env.APP_URL,
      process.env.NEXTAUTH_URL
    ].map((item) => String(item || "").trim()).filter(Boolean);
    return {
      allowAll: false,
      values: Array.from(new Set([...DEFAULT_ALLOWED_FRONTEND_ORIGINS, ...runtimeOrigins]))
    };
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

function setSecurityHeaders(req, res) {
  const isHttps = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";
  const headers = securityCompliance.buildSecurityHeaders({
    isCloud: IS_CLOUD_RUNTIME,
    isHttps
  });
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}

function sendJson(req, res, statusCode, payload, extraHeaders = {}) {
  setSecurityHeaders(req, res);
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
  setSecurityHeaders(req, res);
  setCorsHeaders(req, res);
  for (const [key, value] of Object.entries(extraHeaders)) {
    if (value != null) {
      res.setHeader(key, value);
    }
  }
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(text);
}

function sendSseHeaders(req, res) {
  setSecurityHeaders(req, res);
  setCorsHeaders(req, res);
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
}

function writeSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data || {})}\n\n`);
}

function streamTextAsSse(res, text) {
  const chunks = String(text || "").match(/[\s\S]{1,96}/g) || [];
  for (const chunk of chunks) {
    writeSse(res, "delta", { text: chunk });
  }
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

function readRequestBuffer(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(createHttpError(413, "Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks, total)));
    req.on("error", reject);
  });
}

function parseContentDisposition(value) {
  const result = {};
  String(value || "").split(";").forEach((part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    const key = String(rawKey || "").trim().toLowerCase();
    if (!key) return;
    let nextValue = rawValue.join("=").trim();
    if (nextValue.startsWith('"') && nextValue.endsWith('"')) {
      nextValue = nextValue.slice(1, -1);
    }
    result[key] = nextValue;
  });
  return result;
}

async function parseMultipartFormData(req, options = {}) {
  const contentType = String(req.headers["content-type"] || "");
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    throw createHttpError(400, "multipart/form-data boundary is required.");
  }

  const boundary = String(boundaryMatch[1] || boundaryMatch[2] || "").trim();
  if (!boundary) {
    throw createHttpError(400, "multipart/form-data boundary is invalid.");
  }

  const maxBytes = Math.max(1024, Number(options.maxBytes || MAX_BODY_BYTES));
  const maxFileBytes = Math.max(1024, Number(options.maxFileBytes || maxBytes));
  const rawBuffer = await readRequestBuffer(req, maxBytes);
  const raw = rawBuffer.toString("binary");
  const marker = `--${boundary}`;
  const fields = {};
  const files = {};

  for (const segment of raw.split(marker)) {
    if (!segment || segment === "--\r\n" || segment === "--") continue;
    let part = segment;
    if (part.startsWith("\r\n")) part = part.slice(2);
    if (part.endsWith("\r\n")) part = part.slice(0, -2);
    if (part.endsWith("--")) part = part.slice(0, -2);

    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd < 0) continue;
    const headerText = part.slice(0, headerEnd);
    const bodyBinary = part.slice(headerEnd + 4);
    const headers = {};
    headerText.split("\r\n").forEach((line) => {
      const separator = line.indexOf(":");
      if (separator < 0) return;
      const key = line.slice(0, separator).trim().toLowerCase();
      const value = line.slice(separator + 1).trim();
      if (key) headers[key] = value;
    });

    const disposition = parseContentDisposition(headers["content-disposition"]);
    const fieldName = String(disposition.name || "").trim();
    if (!fieldName) continue;

    const rawFilename = String(disposition.filename || "").trim();
    const filename = rawFilename ? securityCompliance.sanitizeUploadedFilename(rawFilename) : "";
    if (filename) {
      const content = Buffer.from(bodyBinary, "binary");
      if (content.length > maxFileBytes) {
        throw createHttpError(413, "Uploaded file is too large.");
      }
      files[fieldName] = {
        fieldName,
        filename,
        mimetype: String(headers["content-type"] || "application/octet-stream").trim(),
        buffer: content,
        size: content.length
      };
    } else {
      fields[fieldName] = Buffer.from(bodyBinary, "binary").toString("utf8");
    }
  }

  return { fields, files };
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

function createPublicHttpError(statusCode, code, message, details = {}) {
  const error = createHttpError(statusCode, message);
  error.publicCode = code;
  error.details = details;
  return error;
}

function getPublicDatabaseMessage(featureLabel = "هذه الميزة") {
  return `${String(featureLabel || "هذه الميزة").trim()} غير متاح مؤقتًا. حاول مرة أخرى بعد قليل.`;
}

function buildPublicDatabaseState() {
  const ready = isDatabaseReady();
  return {
    configured: Boolean(databaseState?.configured),
    connected: ready,
    driver: databaseState?.driver || "postgres",
    host: databaseState?.host || DB_HOST,
    port: databaseState?.port || DB_PORT,
    database: databaseState?.database || DB_DATABASE,
    env: buildDatabaseEnvDiagnostics(),
    message: ready
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

function estimateDataUrlBytes(value) {
  const match = String(value || "").match(/^data:[^;]+;base64,([\s\S]+)$/i);
  if (!match) return 0;
  const base64 = match[1].replace(/\s+/g, "");
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function sanitizeAttachmentImages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const name = sanitizeOptionalText(item?.name, 160) || "image";
      let type = sanitizeOptionalText(item?.type, 80).toLowerCase();
      let url = String(item?.url || item?.data_url || item?.dataUrl || "").trim();
      const dataUrlMatch = url.match(/^data:(image\/(?:png|jpe?g|webp));base64,([\s\S]+)$/i);

      if (dataUrlMatch) {
        type = dataUrlMatch[1].toLowerCase().replace("image/jpg", "image/jpeg");
        const cleanBase64 = dataUrlMatch[2].replace(/\s+/g, "");
        url = `data:${type};base64,${cleanBase64}`;
        if (estimateDataUrlBytes(url) > MAX_IMAGE_DATA_URL_BYTES) return null;
      } else if (!/^https:\/\//i.test(url)) {
        return null;
      }

      if (!["image/png", "image/jpeg", "image/webp"].includes(type)) return null;
      return { name, type, url };
    })
    .filter(Boolean)
    .slice(0, MAX_IMAGE_INPUTS);
}

function buildAttachmentContext(payload) {
  const names = sanitizeAttachmentNames(payload?.attachment_names || payload?.attachmentNames);
  const previews = sanitizeAttachmentPreviews(payload?.attachment_previews || payload?.attachmentPreviews);
  const images = sanitizeAttachmentImages(payload?.attachment_images || payload?.attachmentImages);
  const attachmentCount = Math.max(
    names.length,
    images.length,
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
  if (requestPath.startsWith("/api/admin/")) {
    return { limit: Math.max(RATE_LIMIT_GENERAL_MAX, 300), windowMs: RATE_LIMIT_WINDOW_MS, bucket: "admin_api" };
  }
  if (requestPath.startsWith("/api/")) {
    return { limit: RATE_LIMIT_GENERAL_MAX, windowMs: RATE_LIMIT_WINDOW_MS, bucket: "api" };
  }
  return null;
}

async function applyRateLimit(req, res, requestPath) {
  const config = getRateLimitConfig(requestPath);
  if (!config) return false;

  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${config.bucket}:${ip}`;
  const distributed = await realScaleInfra.consumeRateLimit(key, config.limit, config.windowMs);
  if (!distributed.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil(Number(distributed.retry_after_ms || config.windowMs) / 1000));
    sendJson(req, res, 429, {
      success: false,
      code: "rate_limited",
      message: "Too many requests. Please try again shortly.",
      distributed: true
    }, {
      "Retry-After": retryAfterSeconds
    });
    return true;
  }
  if (distributed.count > 0) {
    return false;
  }
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
    throw createHttpError(503, "قاعدة البيانات لا تزال غير جاهزة. أعد المحاولة بعد قليل.");
  }
}

function normalizeUserRole(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "student";
  const rbacRole = securityCompliance.normalizeRbacRole(normalized);
  if (rbacRole === "owner") return "super_admin";
  if (["admin", "support", "analyst"].includes(rbacRole)) return rbacRole;
  return "student";
}

function normalizeUserStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "active";
  if (normalized.includes("محظور") || normalized.includes("banned") || normalized === "ban") return "banned";
  if (normalized.includes("موقوف") || normalized.includes("suspend")) return "suspended";
  return "active";
}

function formatUserRole(role) {
  const normalized = normalizeUserRole(role);
  if (normalized === "super_admin") return "Owner";
  if (normalized === "admin") return "Admin";
  if (normalized === "support") return "Support";
  if (normalized === "analyst") return "Analyst";
  return "User";
}

function getUserRbacRole(user) {
  return securityCompliance.normalizeRbacRole(user?.role || "user");
}

function getUserPermissions(user) {
  return securityCompliance.getRolePermissions(getUserRbacRole(user));
}

function userHasPermission(user, permission) {
  return securityCompliance.hasPermission(getUserRbacRole(user), permission);
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

function parseTimestampMs(value) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
}

function getUserBalanceValue(user = {}) {
  const balance = Number(user.balance ?? user.xp ?? user.total_xp ?? 0);
  return Number.isFinite(balance) ? Math.max(0, balance) : 0;
}

function getUserLastDailyRewardClaimedAt(user = {}) {
  return user.last_daily_reward_claimed_at || user.lastDailyRewardClaimedAt || null;
}

function getUserLastDailyRewardAt(user = {}) {
  return getUserLastDailyRewardClaimedAt(user);
}

function normalizeDailyRewardPlan(user = {}) {
  const planText = [
    user.plan,
    user.subscriptionPlan,
    user.subscription_plan,
    user.plan_key,
    user.planKey,
    user.plan_type,
    user.planType,
    user.package_key,
    user.packageKey,
    user.package_name,
    user.packageName,
    user.package
  ].map((item) => String(item || "").trim().toLowerCase()).filter(Boolean).join(" ");

  if (/(^|\s)(premium|pro_max|pioneer|elite|ultra)(\s|$)/.test(planText)) return "premium";
  if (/(^|\s)(pro|pro_plus|tuwaiq|plus)(\s|$)/.test(planText)) return "pro";
  if (/(^|\s)(basic|spark)(\s|$)/.test(planText)) return "basic";
  return "free";
}

function getDailyRewardAmount(user = {}) {
  const packageDailyXp = Number(user.package_daily_xp ?? user.packageDailyXp ?? 0);
  if (Number.isFinite(packageDailyXp) && packageDailyXp > 0) {
    return Math.max(0, Math.round(packageDailyXp));
  }

  const savedRewardAmount = Number(user.daily_reward_amount ?? user.dailyRewardAmount ?? 0);
  if (Number.isFinite(savedRewardAmount) && savedRewardAmount > 0) {
    return Math.max(0, Math.round(savedRewardAmount));
  }

  const plan = normalizeDailyRewardPlan(user);
  const rewards = {
    free: 5,
    basic: 80,
    pro: 250,
    premium: 600
  };

  return rewards[plan] || rewards.free;
}

function getUserDailyRewardAmount(user = {}) {
  return getDailyRewardAmount(user);
}

function getScalarText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return fallback;
  return String(value).trim() || fallback;
}

function getRewardPlan(user = {}) {
  return getScalarText(user.plan, "") || normalizeDailyRewardPlan(user) || "free";
}

function getDailyRewardState(user = {}, nowDate = new Date()) {
  const now = nowDate.getTime();
  const rawLastClaim = getUserLastDailyRewardClaimedAt(user);
  let lastClaim = parseTimestampMs(rawLastClaim);
  let correctedLastClaimedAt = null;

  if (rawLastClaim && (!lastClaim || lastClaim > now)) {
    lastClaim = now;
    correctedLastClaimedAt = nowDate.toISOString();
  }

  const nextClaimMs = lastClaim ? lastClaim + DAILY_REWARD_INTERVAL_MS : 0;
  const canClaim = !lastClaim || now >= nextClaimMs;
  const remainingMs = canClaim ? 0 : Math.max(0, nextClaimMs - now);
  const nextClaimAt = canClaim ? null : new Date(nextClaimMs).toISOString();

  return {
    canClaim,
    lastClaimedAt: lastClaim ? new Date(lastClaim).toISOString() : null,
    nextClaimAt,
    nextRewardAt: nextClaimAt,
    remainingMs,
    correctedLastClaimedAt
  };
}

function buildDailyRewardPayload(user = {}, now = new Date()) {
  const state = getDailyRewardState(user, now);
  return {
    amount: getUserDailyRewardAmount(user),
    plan: getRewardPlan(user),
    intervalMs: DAILY_REWARD_INTERVAL_MS,
    canClaim: state.canClaim,
    claimedToday: !state.canClaim,
    lastClaimedAt: state.lastClaimedAt,
    nextClaimAt: state.nextClaimAt,
    nextRewardAt: state.nextRewardAt,
    remainingMs: state.remainingMs,
    nextRewardInMs: state.remainingMs,
    nextDailyRewardAt: state.nextRewardAt,
    nextDailyRewardInMs: state.remainingMs
  };
}

function getDailyXpPlanKey(user = {}) {
  const planText = [
    user.plan_type,
    user.planType,
    user.package_key,
    user.packageKey,
    user.package_name,
    user.packageName,
    user.package
  ].map((item) => String(item || "").trim().toLowerCase()).join(" ");
  const packageDailyXp = Math.max(0, Number(user.package_daily_xp || user.packageDailyXp || 0));

  if (/(^|\s)(pro_max|pioneer|elite|ultra)(\s|$)/.test(planText) || packageDailyXp >= 600) return "pioneer";
  if (/(^|\s)(pro_plus|tuwaiq|plus)(\s|$)/.test(planText) || packageDailyXp >= 250) return "tuwaiq";
  if (/(^|\s)(pro|spark)(\s|$)/.test(planText) || packageDailyXp >= 80) return "spark";
  return "free";
}

function getDailyXpForUserPlan(user = {}) {
  const packageDailyXp = Math.max(0, Number(user.package_daily_xp || user.packageDailyXp || 0));
  return packageDailyXp > 0 ? packageDailyXp : 0;
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

  const currentPackage = typeof databaseClient.findPackageByKeyOrName === "function"
    ? await databaseClient.findPackageByKeyOrName(user.package_key || user.plan_type || user.package_name || user.package || "")
    : null;
  if (
    currentPackage &&
    Number(currentPackage.daily_xp || 0) > 0 &&
    Number(currentPackage.duration_days || durationDays || 0) > 0 &&
    typeof databaseClient.assignPackageToUser === "function"
  ) {
    const renewedUser = await databaseClient.assignPackageToUser({
      user_id: user.id,
      package_id: currentPackage.id,
      package_key: currentPackage.package_key,
      duration_days: Math.max(1, Math.round(Number(currentPackage.duration_days || durationDays || 30) || 30))
    });
    if (!renewedUser) {
      return user;
    }
    if (typeof databaseClient.updateUser === "function") {
      return await databaseClient.updateUser(renewedUser.id, {
        activity: `تم تجديد اشتراك ${String(currentPackage.display_name || currentPackage.package_name || renewedUser.package_name || "الباقة").trim()} تلقائيًا لمدة ${Math.max(1, Math.round(Number(currentPackage.duration_days || durationDays || 30) || 30))} يوم`
      }) || renewedUser;
    }
    return renewedUser;
  }

  const defaultPackage = await databaseClient.findDefaultPackage();
  if (!defaultPackage) {
    return user;
  }

  const updatedUser = await databaseClient.updateUser(user.id, {
    package_id: defaultPackage.id,
    package_name: defaultPackage.display_name,
    plan_type: defaultPackage.package_key || "starter",
    package_started_at: null,
    package_expires_at: null,
    activity: `انتهت مدة باقة ${String(user.package_name || user.package || "الحالية").trim()} وعاد الحساب إلى ${defaultPackage.display_name}`
  });
  return updatedUser;
}

async function syncUserDailyProgress(user, activityText = "") {
  if (!user || !isDatabaseReady()) {
    return user;
  }

  const effectiveUser = await ensureUserPackageLifecycle(user) || user;
  {
    if (typeof databaseClient.updateUser !== "function") {
      return effectiveUser;
    }

    const rewardState = getDailyRewardState(effectiveUser);
    const changes = {};
    if (activityText) {
      changes.last_active_date = getTodayStamp();
      changes.activity = activityText;
    }
    if (rewardState.correctedLastClaimedAt) {
      changes.last_daily_reward_claimed_at = rewardState.correctedLastClaimedAt;
      changes.last_daily_reward_at = rewardState.correctedLastClaimedAt;
      changes.last_daily_xp_granted_at = rewardState.correctedLastClaimedAt;
    }

    if (!Object.keys(changes).length) {
      return effectiveUser;
    }

    return await databaseClient.updateUser(effectiveUser.id, changes) || effectiveUser;
  }
  /* Legacy auto-grant logic removed. The claim route owns reward issuance.
  const today = getTodayStamp();
  const lastActiveDate = String(effectiveUser.last_active_date || "");
  const signupBonusClaimed = effectiveUser.signup_bonus_claimed !== false;
  const dailyXpAward = shouldGrantDailyXp ? dailyRewardAmount : 0;

  console.log("DAILY_REWARD_CHECK", {
    userId: effectiveUser.id,
    balance: getUserBalanceValue(effectiveUser),
    lastDailyRewardClaimedAt,
    dailyRewardAmount,
    remainingMs: rewardState.remainingMs,
    shouldReward: shouldGrantDailyXp
  });

  if (!shouldGrantDailyXp && signupBonusClaimed && !rewardState.correctedLastClaimedAt) {
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

  const currentXp = getUserBalanceValue(effectiveUser);
  const baseXp = signupBonusClaimed ? currentXp : currentXp + FIRST_SIGNUP_XP;
  const nextXp = baseXp + dailyXpAward;
  const packageLabel = String(effectiveUser.package_name || effectiveUser.package || "التمهيدية").trim() || "التمهيدية";

  const nowIso = new Date().toISOString();
  const updatedUser = await databaseClient.updateUser(effectiveUser.id, {
    last_active_date: today,
    last_reset: today,
    last_daily_xp_claimed_date: today,
    last_daily_xp_granted_at: shouldGrantDailyXp ? nowIso : lastDailyRewardClaimedAt,
    last_daily_reward_at: shouldGrantDailyXp ? nowIso : lastDailyRewardClaimedAt,
    last_daily_reward_claimed_at: shouldGrantDailyXp ? nowIso : (rewardState.correctedLastClaimedAt || lastDailyRewardClaimedAt),
    signup_bonus_claimed: true,
    streak_days: streakDays,
    motivation_score: Number(effectiveUser.motivation_score || 0) + DAILY_MOTIVATION_BONUS,
    xp: nextXp,
    balance: nextXp,
    total_xp: nextXp,
    daily_reward_amount: dailyRewardAmount,
    plan_type: String(effectiveUser.package_key || effectiveUser.plan_type || effectiveUser.package_name || "starter").trim() || "starter",
    achievements,
    activity: activityText || `تجددت باقته اليومية (${packageLabel}) وحصل على ${dailyXpAward} XP`
  });

  if (typeof databaseClient.recordXpLedger === "function") {
    try {
      if (!signupBonusClaimed && FIRST_SIGNUP_XP > 0) {
        await databaseClient.recordXpLedger({
          user_id: effectiveUser.id,
          amount: FIRST_SIGNUP_XP,
          type: "signup_bonus",
          reason: "First signup XP"
        });
      }
      if (shouldGrantDailyXp && dailyXpAward > 0) {
        await databaseClient.recordXpLedger({
          user_id: effectiveUser.id,
          amount: dailyXpAward,
          type: "daily_grant",
          reason: `Daily XP renewal (${packageLabel})`
        });
      }
    } catch (error) {
      console.warn("XP ledger write failed:", error.message);
    }
  }

  return updatedUser;
  }
  */
}

async function syncUserDailyProgressSafely(user, activityText = "") {
  try {
    return await syncUserDailyProgress(user, activityText);
  } catch (error) {
    console.warn("[mullem] daily progress sync skipped:", error?.message || error);
    return user;
  }
}

function isImageAttachmentName(value) {
  return /\.(png|jpe?g|webp|gif|bmp|heic|heif|svg)$/i.test(String(value || "").trim());
}

function normalizeSelectedModel(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw || raw === "default" || raw === "general" || raw === "orlixor ai") return "orlixor";
  if (raw.includes("turbo")) return "turbo";
  if (raw.includes("creative")) return "creative";
  if (raw.includes("alpha")) return "alpha";
  if (raw.includes("pro")) return "pro";
  return modelProfiles[raw] ? raw : "orlixor";
}

function getModelProfile(value) {
  return modelProfiles[normalizeSelectedModel(value)] || modelProfiles.orlixor;
}

function isFreeUser(user) {
  if (!user) return true;
  return normalizePlanKeyForRouter(user) === "free";
}

function hasSubscriberToolAccess(user) {
  if (!user) return false;
  const planText = [
    user.plan_type,
    user.planType,
    user.package_key,
    user.packageKey,
    user.package_name,
    user.packageName,
    user.package
  ].map((item) => String(item || "").trim().toLowerCase()).join(" ");
  if (/(^|\s)(spark|tuwaiq|pioneer|business|pro|pro_plus|pro_max|elite|ultra)(\s|$)/.test(planText)) {
    return true;
  }
  if (/(^|\s)(free|starter)(\s|$)/.test(planText)) {
    return false;
  }
  return Number(user.package_daily_xp || user.daily_xp || user.packageDailyXp || 0) > 0;
}

async function requireSubscriberToolUser(req) {
  const auth = await requireAuthenticatedUser(req);
  if (!hasSubscriberToolAccess(auth.user)) {
    throw createHttpError(403, "هذه الأداة متاحة للمشتركين فقط.");
  }
  return auth;
}

function getUserPlanKeyLegacy(user) {
  const raw = [
    user?.plan_key,
    user?.planKey,
    user?.plan_type,
    user?.planType,
    user?.package_key,
    user?.packageKey,
    user?.package_name,
    user?.packageName,
    user?.package
  ].map((item) => String(item || "").trim().toLowerCase()).find(Boolean) || "free";

  if (raw.includes("pioneer") || raw.includes("الرائد")) return "pioneer";
  if (raw.includes("business") || raw.includes("أعمال") || raw.includes("اعمال")) return "business";
  if (raw.includes("tuwaiq") || raw.includes("طويق")) return "tuwaiq";
  if (raw.includes("spark") || raw.includes("شرارة")) return "spark";
  if (raw.includes("pro") || raw.includes("elite") || raw.includes("ultra")) return "pioneer";
  return "free";
}

function getUserPlanKey(user) {
  return normalizePlanKeyForRouter(user);
}

function normalizePlanKeyForRouter(user) {
  const raw = [
    user?.plan_key,
    user?.planKey,
    user?.plan,
    user?.plan_type,
    user?.planType,
    user?.package_key,
    user?.packageKey,
    user?.package_name,
    user?.packageName,
    user?.package
  ].map((item) => String(item || "").trim().toLowerCase()).filter(Boolean).join(" ") || "free";
  const dailyXp = Number(user?.package_daily_xp || user?.packageDailyXp || user?.daily_xp || 0);

  if (/(^|\s)(pro_max|pioneer|business|elite|ultra|premium)(\s|$)/.test(raw) || raw.includes("الرائد") || dailyXp >= 600) return "pioneer";
  if (/(^|\s)(pro_plus|tuwaiq|plus)(\s|$)/.test(raw) || raw.includes("طويق") || dailyXp >= 250) return "tuwaiq";
  if (/(^|\s)(pro|spark|basic)(\s|$)/.test(raw) || raw.includes("شرارة") || dailyXp >= 80) return "spark";
  return "free";
}

function getPlanLimits(user) {
  const planKey = normalizePlanKeyForRouter(user);
  return {
    planKey,
    limits: PLAN_LIMITS[planKey] || PLAN_LIMITS.free
  };
}

function canUseHighImageQuality(user) {
  return normalizePlanKeyForRouter(user) === "pioneer";
}

function hasAlphaModelAccess(user) {
  if (!user) return false;
  const role = normalizeUserRole(user.role);
  const planKey = normalizePlanKeyForRouter(user);
  const labels = [
    role,
    planKey,
    user.beta_tester,
    user.betaTester,
    user.package_key,
    user.package_name,
    user.plan_type
  ].map((item) => String(item || "").trim().toLowerCase());

  if (userHasPermission(user, "admin:read")) return true;
  if (planKey === "pioneer") return true;
  return ORLIXOR_ALPHA_ACCESS.some((key) => labels.some((label) => label === key || label.includes(key)));
}

function normalizeImageTaskQuality(value) {
  const raw = String(value || "standard").trim().toLowerCase();
  if (["high", "hd", "pro", "premium", "professional"].includes(raw)) return "high";
  return "standard";
}

function normalizeOpenAIImageQuality(value) {
  return normalizeImageTaskQuality(value) === "high" ? "high" : "medium";
}

function normalizeImageSize(value) {
  const raw = String(value || "1024x1024").trim().toLowerCase();
  const allowed = new Set(["1024x1024", "1024x1536", "1536x1024", "auto"]);
  return allowed.has(raw) ? raw : "1024x1024";
}

function isSupportedImageMimeType(value) {
  return ["image/png", "image/jpeg", "image/webp"].includes(String(value || "").trim().toLowerCase());
}

function getMultipartImageFile(files) {
  return files?.image || files?.file || files?.upload || null;
}

function validateImageUpload(file, label = "image") {
  if (!file) {
    throw createHttpError(400, "لم يتم رفع صورة.");
  }
  if (!isSupportedImageMimeType(file.mimetype)) {
    throw createHttpError(400, "صيغة الصورة غير مدعومة. استخدم PNG أو JPG أو WebP.");
  }
  if (Number(file.size || 0) > IMAGE_TOOL_MAX_FILE_SIZE) {
    throw createHttpError(413, "حجم الصورة كبير جدًا.");
  }
  if (!Buffer.isBuffer(file.buffer) || !file.buffer.length) {
    throw createHttpError(400, `ملف ${label} غير صالح.`);
  }
  return file;
}

function chooseImageModel(task, userPlan, quality) {
  if (task === "analyze") {
    return ORLIXOR_IMAGE_ANALYSIS_MODEL || "gpt-4.1-mini";
  }

  if (task === "generate" || task === "edit") {
    if (normalizeImageTaskQuality(quality) === "high" && ["pioneer", "business"].includes(String(userPlan || "").toLowerCase())) {
      return ORLIXOR_IMAGE_GENERATION_PRO_MODEL || ORLIXOR_IMAGE_GENERATION_MODEL || "gpt-image-1-mini";
    }
    return ORLIXOR_IMAGE_GENERATION_MODEL || "gpt-image-1-mini";
  }

  throw createHttpError(400, "نوع مهمة الصور غير معروف.");
}

function ensureImageServiceConfigured() {
  if (!OPENAI_API_KEY) {
    throw createHttpError(503, "خدمة الصور غير مفعلة حاليًا.");
  }
}

async function getActiveImageTaskUser(req, activityText) {
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgressSafely(auth.user, activityText) : null;
  if (!activeUser) {
    throw createHttpError(401, "يلزم تسجيل الدخول لاستخدام نظام الصور.");
  }
  return activeUser;
}

function ensureUserCanSpendXp(user, xpCost, taskLabel) {
  const currentXp = Math.max(0, Number(user?.xp || 0));
  if (currentXp < xpCost) {
    throw createHttpError(402, `${taskLabel} يحتاج ${xpCost} XP.`);
  }
}

function normalizeImageApiResult(item) {
  const safeItem = item && typeof item === "object" ? item : {};
  return {
    url: String(safeItem.url || "").trim(),
    b64_json: String(safeItem.b64_json || "").trim(),
    mime_type: "image/png",
    revised_prompt: String(safeItem.revised_prompt || "").trim()
  };
}

async function readOpenAIJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return { error: await response.text() };
}

function buildImageServiceError(payload, fallback, statusCode) {
  let message = payload?.error?.message || payload?.message || fallback || "تعذر تنفيذ طلب الصور.";
  message = String(message)
    .replace(/OpenAI/gi, "Orlixor")
    .replace(new RegExp(`${"deep" + "seek"}-[a-z0-9.\\-]+`, "gi"), "Orlixor AI")
    .replace(/gpt-[a-z0-9.\-]+/gi, "Orlixor Image")
    .replace(/dall-e-[a-z0-9.\-]+/gi, "Orlixor Image");
  return createHttpError(statusCode || 502, message);
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
  if (normalized === "alpha") return "alpha";
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

function estimateTokens(value) {
  const text = Array.isArray(value)
    ? value.map((item) => `${item?.role || ""} ${coerceModelText(item?.content)}`).join("\n")
    : coerceModelText(value);
  return Math.max(1, Math.ceil(String(text || "").length / 4));
}

function buildUsageLimitMessage(code, details = {}) {
  if (code === "daily_token_limit") {
    return `لقد وصلت للحد اليومي المسموح في باقتك. سيتم إعادة التحديث خلال ${details.resetIn || "أقل من 24 ساعة"}.`;
  }
  if (code === "monthly_token_limit") {
    return "لقد استهلكت الحد الشهري بالكامل. يمكنك الترقية أو انتظار التجديد القادم.";
  }
  if (code === "image_daily_limit") {
    return "لقد وصلت للحد اليومي للصور في باقتك. يمكنك المحاولة لاحقًا أو الترقية.";
  }
  if (code === "message_token_limit") {
    return `رسالتك الحالية تتجاوز حد الرسالة الواحدة في باقتك. التكلفة الإضافية ستكون +${details.extraXp || 0} XP و +${details.extraTokens || 0} Token.`;
  }
  return "لقد وصلت إلى حد الاستخدام المسموح في باقتك.";
}

function getNextDailyResetText() {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  const ms = Math.max(0, next.getTime() - now.getTime());
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours} ساعة و ${minutes} دقيقة`;
}

function enforcePlanRequestRate(user, planKey, limits) {
  const userId = String(user?.id || "guest");
  const key = `model-router:${planKey}:${userId}`;
  const now = Date.now();
  const windowMs = 60_000;
  const max = Math.max(1, Number(limits.requestsPerMinute || 5));
  const current = rateLimitStore.get(key);
  if (!current || current.expiresAt <= now) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > max) {
    throw createPublicHttpError(429, "QUEUE_RATE_LIMIT", "طلبات كثيرة الآن، حاول بعد قليل.", {
      plan: planKey,
      retryAfterMs: Math.max(0, current.expiresAt - now),
      queuePriority: limits.queuePriority
    });
  }
}

async function getUserUsageStats(user) {
  if (!user?.id || !isDatabaseReady() || typeof databaseClient.getAiUsageStats !== "function") {
    return {
      dailyTokens: 0,
      monthlyTokens: 0,
      dailyImages: 0
    };
  }
  return databaseClient.getAiUsageStats(user.id);
}

function buildModelRouterProfile(baseProfile, routing) {
  const limits = routing.limits || PLAN_LIMITS.free;
  const profile = { ...(baseProfile || modelProfiles.orlixor) };
  profile.provider = routing.provider;
  profile.deepseekModel = routing.deepseekModel || profile.deepseekModel;
  profile.openaiModel = routing.openaiModel || profile.openaiModel;
  profile.maxOutputTokens = Math.min(Number(profile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), Number(limits.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS));
  profile.maxContextTokens = Math.min(Number(profile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS), Number(limits.maxContextTokens || FREE_MAX_CONTEXT_TOKENS));
  return profile;
}

function routeModelForUser({ user, requestedModel, message = "", attachmentCount = 0, attachmentNames = [], operation = "chat" } = {}) {
  const { planKey, limits } = getPlanLimits(user);
  const requestedKey = normalizeSelectedModel(requestedModel || limits.defaultModel);
  const intelligence = aiIntelligence.analyzeRequest({
    message,
    attachmentCount,
    attachmentNames,
    requestedModel: requestedKey,
    userPlan: planKey,
    operation
  });
  const advanced = detectAdvancedTask({ message, attachmentCount, attachmentNames }) ||
    intelligence.needsReasoning ||
    intelligence.needsCoding;
  const hasAttachments = Number(attachmentCount || 0) > 0;

  if (planKey === "free" && (advanced || hasAttachments || operation !== "chat")) {
    const upsell = buildSmartUpsell({ plan: planKey, operation, analysis: intelligence, code: "PLAN_UPGRADE_REQUIRED" });
    throw createPublicHttpError(403, "PLAN_UPGRADE_REQUIRED", "هذه المهمة تحتاج باقة مدفوعة لأنها تستخدم تحليلًا متقدمًا أو مرفقات.", {
      plan: planKey,
      upgradeRecommended: true,
      upsell
    });
  }

  let modelKey = limits.allowedModels.includes(requestedKey) ? requestedKey : limits.defaultModel;
  if (limits.allowAdvanced && intelligence.needsCreativity && limits.allowedModels.includes("creative")) {
    modelKey = "creative";
  } else if (limits.allowAdvanced && (advanced || intelligence.needsCoding) && limits.allowedModels.includes("pro")) {
    modelKey = planKey === "tuwaiq" || planKey === "pioneer" ? "pro" : modelKey;
  } else if (intelligence.needsSpeed && limits.allowedModels.includes("turbo")) {
    modelKey = "turbo";
  }
  const routeReason = [
    `plan:${planKey}`,
    `task:${intelligence.taskType}`,
    advanced ? "advanced" : "standard",
    intelligence.needsSpeed ? "speed" : "",
    intelligence.needsCreativity ? "creative" : "",
    modelKey !== requestedKey ? `rerouted:${requestedKey}->${modelKey}` : "requested_allowed"
  ].filter(Boolean).join("|");

  let provider = "openai";
  let deepseekModel = DEEPSEEK_CHAT_MODEL;
  let openaiModel = OPENAI_MODEL_DEFAULT || OPENAI_MODEL;

  if (modelKey === "orlixor") {
    provider = DEEPSEEK_API_KEY ? "deepseek" : "openai";
    deepseekModel = DEEPSEEK_CHAT_MODEL;
    openaiModel = OPENAI_MODEL_DEFAULT || OPENAI_MODEL;
  } else if (modelKey === "pro") {
    provider = DEEPSEEK_API_KEY ? "deepseek" : "openai";
    deepseekModel = DEEPSEEK_REASONER_MODEL;
    openaiModel = OPENAI_MODEL_PRO || OPENAI_MODEL_DEFAULT || OPENAI_MODEL;
  } else if (modelKey === "creative") {
    provider = "openai";
    openaiModel = OPENAI_MODEL_CREATIVE || OPENAI_MODEL_DEFAULT || OPENAI_MODEL;
  } else if (modelKey === "turbo") {
    provider = "openai";
    openaiModel = OPENAI_MODEL_TURBO || OPENAI_MODEL_DEFAULT || OPENAI_MODEL;
  } else if (modelKey === "alpha") {
    provider = "openai";
    openaiModel = ORLIXOR_ALPHA_MODEL || OPENAI_MODEL_PRO || OPENAI_MODEL;
  }

  const baseProfile = getModelProfile(modelKey);
  const estimatedInputTokens = estimateTokens(message) + (hasAttachments ? 500 * Number(attachmentCount || 0) : 0);
  return {
    planKey,
    limits,
    requestedKey,
    modelKey,
    provider,
    deepseekModel,
    openaiModel,
    advanced,
    intelligence,
    taskType: intelligence.taskType,
    questionType: intelligence.questionType,
    promptKey: intelligence.promptKey,
    routeReason,
    queuePriority: limits.queuePriority,
    estimatedInputTokens,
    estimatedRequestTokens: estimatedInputTokens + Math.max(120, Number(limits.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS)),
    modelProfile: buildModelRouterProfile(baseProfile, { limits, provider, deepseekModel, openaiModel })
  };
}

async function enforceModelUsageLimits(user, routing, options = {}) {
  const stats = await getUserUsageStats(user);
  const limits = routing.limits || PLAN_LIMITS.free;
  enforcePlanRequestRate(user, routing.planKey, limits);

  if (Number(routing.estimatedInputTokens || 0) > Number(limits.perMessageTokens || 0)) {
    const extraTokens = Math.max(0, Number(routing.estimatedInputTokens || 0) - Number(limits.perMessageTokens || 0));
    const extraXp = Math.max(1, Math.ceil(extraTokens / 600));
    routing.extraTokens = extraTokens;
    routing.extraXpCost = extraXp;
    if (!options.confirmOverage) {
      throw createPublicHttpError(409, "MESSAGE_LIMIT_CONFIRMATION_REQUIRED", buildUsageLimitMessage("message_token_limit", { extraXp, extraTokens }), {
        confirm_required: true,
        plan: routing.planKey,
        extraXp,
        extraTokens,
        perMessageTokens: limits.perMessageTokens,
        upsell: buildSmartUpsell({ plan: routing.planKey, code: "MESSAGE_LIMIT_CONFIRMATION_REQUIRED", analysis: routing.intelligence })
      });
    }
  }

  if (stats.dailyTokens + routing.estimatedRequestTokens > limits.dailyTokens) {
    throw createPublicHttpError(429, "DAILY_TOKEN_LIMIT_EXCEEDED", buildUsageLimitMessage("daily_token_limit", { resetIn: getNextDailyResetText() }), {
      plan: routing.planKey,
      used: stats.dailyTokens,
      limit: limits.dailyTokens,
      resetIn: getNextDailyResetText(),
      upsell: buildSmartUpsell({ plan: routing.planKey, code: "DAILY_TOKEN_LIMIT_EXCEEDED", analysis: routing.intelligence })
    });
  }

  if (stats.monthlyTokens + routing.estimatedRequestTokens > limits.monthlyTokens) {
    throw createPublicHttpError(429, "MONTHLY_TOKEN_LIMIT_EXCEEDED", buildUsageLimitMessage("monthly_token_limit"), {
      plan: routing.planKey,
      used: stats.monthlyTokens,
      limit: limits.monthlyTokens,
      upsell: buildSmartUpsell({ plan: routing.planKey, code: "MONTHLY_TOKEN_LIMIT_EXCEEDED", analysis: routing.intelligence })
    });
  }
}

async function enforceImageUsageLimit(user, taskType = "image") {
  const safeMode = buildSafeModeState(await getAiCostGuardrailStatsSafe());
  if (safeMode.active) {
    throw createPublicHttpError(503, "AI_SAFE_MODE_IMAGES_DISABLED", "تم إيقاف الصور مؤقتًا لتخفيف الضغط على النظام. جرّب لاحقًا من فضلك.", {
      safe_mode: true,
      reasons: safeMode.reasons
    });
  }
  const { planKey, limits } = getPlanLimits(user);
  enforcePlanRequestRate(user, planKey, limits);
  const stats = await getUserUsageStats(user);
  const absoluteImageHardStop = planKey === "free" ? AI_IMAGE_DAILY_HARD_STOP_FREE : AI_IMAGE_DAILY_HARD_STOP_PAID;
  if (stats.dailyImages + 1 > Math.min(Number(limits.dailyImages || 0) || absoluteImageHardStop, absoluteImageHardStop)) {
    throw createPublicHttpError(429, "IMAGE_DAILY_HARD_STOP", "Image usage is temporarily capped to protect billing and platform stability.", {
      plan: planKey,
      taskType,
      used: stats.dailyImages,
      hard_limit: absoluteImageHardStop,
      upsell: buildSmartUpsell({ plan: planKey, operation: "image", code: "IMAGE_DAILY_HARD_STOP" })
    });
  }
  if (stats.dailyImages + 1 > limits.dailyImages) {
    throw createPublicHttpError(429, "IMAGE_DAILY_LIMIT_EXCEEDED", buildUsageLimitMessage("image_daily_limit"), {
      plan: planKey,
      taskType,
      used: stats.dailyImages,
      limit: limits.dailyImages,
      upsell: buildSmartUpsell({ plan: planKey, operation: "image", code: "IMAGE_DAILY_LIMIT_EXCEEDED" })
    });
  }
}

const modelResponseCache = new Map();

function getCachedModelResponse(cacheKey) {
  const item = modelResponseCache.get(cacheKey);
  if (!item || item.expiresAt <= Date.now()) {
    if (item) modelResponseCache.delete(cacheKey);
    return null;
  }
  return item.value;
}

function setCachedModelResponse(cacheKey, value) {
  if (!cacheKey || !value?.text) return;
  if (modelResponseCache.size > 300) {
    const firstKey = modelResponseCache.keys().next().value;
    if (firstKey) modelResponseCache.delete(firstKey);
  }
  modelResponseCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + 10 * 60 * 1000
  });
}

async function getCachedModelResponseAny(cacheKey, metadata = {}) {
  if (!cacheKey) return null;
  const local = getCachedModelResponse(cacheKey);
  if (local) return { ...local, __cacheLayer: "memory" };
  const remote = await realScaleInfra.getAiCache("prompt", {
    ...metadata,
    prompt: cacheKey
  });
  const value = remote?.value?.value;
  return value?.text ? { ...value, __cacheLayer: remote.layer || "redis" } : null;
}

async function setCachedModelResponseAny(cacheKey, value, metadata = {}) {
  if (!cacheKey || !value?.text) return;
  setCachedModelResponse(cacheKey, value);
  await realScaleInfra.setAiCache("prompt", {
    ...metadata,
    prompt: cacheKey
  }, value, 10 * 60 * 1000);
}

function buildModelCacheKey({ user, routing, messages }) {
  const source = JSON.stringify({
    plan: routing?.planKey,
    model: routing?.modelKey,
    provider: routing?.provider,
    messages: Array.isArray(messages) ? messages.slice(-4) : messages
  });
  return crypto.createHash("sha256").update(source).digest("hex");
}

async function chargeUserForMessage(user, cost, activityText) {
  if (!user || !isDatabaseReady() || !cost) {
    return user;
  }

  const xpCost = Math.max(0, Math.round(Number(cost) || 0));
  const nextXp = Math.max(0, Math.max(0, Number(user.xp || 0)) - xpCost);
  const updatedUser = await databaseClient.updateUser(user.id, {
    xp: nextXp,
    total_xp: nextXp,
    activity: activityText || `تم خصم ${xpCost} XP مقابل استخدام الشات`
  });

  if (typeof databaseClient.recordXpLedger === "function" && xpCost > 0) {
    try {
      await databaseClient.recordXpLedger({
        user_id: user.id,
        amount: -xpCost,
        type: "usage",
        reason: activityText || "XP usage"
      });
    } catch (error) {
      console.warn("XP usage ledger write failed:", error.message);
    }
  }

  return updatedUser;
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
  const balance = getUserBalanceValue(user);
  const totalXp = Number.isFinite(Number(user.total_xp ?? user.totalXp ?? balance))
    ? Number(user.total_xp ?? user.totalXp ?? balance)
    : balance;
  const lastDailyRewardClaimedAt = getUserLastDailyRewardClaimedAt(user);
  const dailyRewardAmount = getUserDailyRewardAmount(user);
  const dailyReward = buildDailyRewardPayload(user);
  return {
    id: String(user.id),
    name: String(user.name || "").trim(),
    email: normalizeEmail(user.email),
    role: formatUserRole(user.role),
    rbacRole: getUserRbacRole(user),
    permissions: getUserPermissions(user),
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
    balance,
    xp: balance,
    total_xp: totalXp,
    totalXp,
    plan_type: String(user.plan_type || user.package_key || user.package_name || user.package || "starter").trim() || "starter",
    planType: String(user.plan_type || user.package_key || user.package_name || user.package || "starter").trim() || "starter",
    plan: getRewardPlan(user),
    streakDays: Number.isFinite(Number(user.streak_days)) ? Number(user.streak_days) : 0,
    motivationScore: Number.isFinite(Number(user.motivation_score)) ? Number(user.motivation_score) : 0,
    lastActiveDate: user.last_active_date || null,
    last_reset: user.last_reset || user.last_active_date || null,
    lastReset: user.last_reset || user.last_active_date || null,
    last_daily_xp_claimed_date: user.last_daily_xp_claimed_date || user.last_reset || user.last_active_date || null,
    lastDailyXpClaimedDate: user.last_daily_xp_claimed_date || user.last_reset || user.last_active_date || null,
    last_daily_xp_granted_at: user.last_daily_xp_granted_at || null,
    lastDailyXpGrantedAt: user.last_daily_xp_granted_at || null,
    last_daily_reward_claimed_at: lastDailyRewardClaimedAt,
    lastDailyRewardClaimedAt,
    last_daily_reward_at: lastDailyRewardClaimedAt,
    lastDailyRewardAt: lastDailyRewardClaimedAt,
    daily_reward_amount: dailyRewardAmount,
    dailyRewardAmount,
    next_daily_reward_at: dailyReward.nextRewardAt,
    nextDailyRewardAt: dailyReward.nextRewardAt,
    next_daily_reward_in_ms: dailyReward.nextRewardInMs,
    nextDailyRewardInMs: dailyReward.nextRewardInMs,
    dailyReward,
    referralCode: String(user.referral_code || user.referralCode || "").trim(),
    referral_code: String(user.referral_code || user.referralCode || "").trim(),
    referredByUserId: user.referred_by_user_id != null ? Number(user.referred_by_user_id) : null,
    trustScore: Number.isFinite(Number(user.trust_score)) ? Number(user.trust_score) : 70,
    abuseScore: Number.isFinite(Number(user.abuse_score)) ? Number(user.abuse_score) : 0,
    shadowBanned: Boolean(user.shadow_banned),
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
  const tokenHash = hashApiToken(rawToken);
  try {
    await databaseClient.createApiToken({
      user_id: user.id,
      name: sanitizeOptionalText(deviceName, MAX_METADATA_LENGTH) || "mullem-web",
      token_hash: tokenHash
    });
  } catch (error) {
    console.warn("[mullem] persistent auth token write failed, using runtime token:", error?.message || error);
    authTokenFallbackSessions.set(tokenHash, {
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
  }
  return rawToken;
}

function setAuthCookie(res, token, maxAgeSeconds = 30 * 24 * 60 * 60) {
  const secure = IS_CLOUD_RUNTIME ? "; Secure" : "";
  const encoded = `${encodeURIComponent("mlm_auth_token")}=${encodeURIComponent(String(token || ""))}`;
  res.setHeader("Set-Cookie", `${encoded}; Path=/; Max-Age=${Math.max(0, Number(maxAgeSeconds) || 0)}; HttpOnly; SameSite=Lax${secure}`);
}

function clearAuthCookie(res) {
  const secure = IS_CLOUD_RUNTIME ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${encodeURIComponent("mlm_auth_token")}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`);
}

function getRequestCookie(req, name) {
  const target = `${encodeURIComponent(name)}=`;
  const raw = String(req.headers.cookie || "")
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(target))
    ?.slice(target.length) || "";
  try {
    return decodeURIComponent(raw);
  } catch (_) {
    return raw;
  }
}

async function ensureDefaultUsers(client = databaseClient) {
  if (!client || typeof client.isReady !== "function" || !client.isReady()) return;

  await client.ensureUserByEmail({
    name: DEFAULT_ADMIN_NAME,
    email: DEFAULT_ADMIN_EMAIL,
    password_hash: hashPassword(DEFAULT_ADMIN_PASSWORD),
    role: "super_admin",
    package_name: "إدارة المنصة",
    xp: 0,
    status: "active",
    activity: "حساب إدارة افتراضي"
  });

  await client.ensureUserByEmail({
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
    last_daily_xp_granted_at: new Date().toISOString(),
    signup_bonus_claimed: true,
    motivation_score: 0,
    status: "active",
    activity: "حساب طالب جديد"
  });
}

async function seedAiKnowledgeBaseSafely(client = databaseClient) {
  if (!client || typeof client.isReady !== "function" || !client.isReady()) return;
  try {
    const result = await seedAiKnowledgeBase(client);
    if (result && !result.skipped) {
      console.log(`[mullem] AI Knowledge Base seed ready: ${result.seeded} sources, ${result.chunks} chunks.`);
    }
  } catch (error) {
    console.warn("[mullem] AI Knowledge Base seed skipped:", error?.message || error);
  }
}

async function getAuthContext(req) {
  if (req.__mullemAuthContext) {
    return req.__mullemAuthContext;
  }

  const authorization = String(req.headers.authorization || "").trim();
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const tokenFromCookie = getRequestCookie(req, "mlm_auth_token");
  const rawToken = String(match?.[1] || tokenFromCookie || "").trim();
  if (!rawToken) {
    req.__mullemAuthContext = null;
    return null;
  }

  if (!isDatabaseReady()) {
    req.__mullemAuthContext = null;
    return null;
  }

  const tokenHash = hashApiToken(rawToken);
  let user = null;
  const cachedSession = await realScaleInfra.getJson(`session:${tokenHash}`);
  if (cachedSession?.user?.id && Number(cachedSession.expiresAt || 0) > Date.now()) {
    user = cachedSession.user;
  }
  try {
    if (!user) {
      user = await databaseClient.findUserByTokenHash(tokenHash);
    }
  } catch (error) {
    console.warn("[mullem] persistent auth lookup failed:", error?.message || error);
  }
  if (!user) {
    const fallbackSession = authTokenFallbackSessions.get(tokenHash);
    if (fallbackSession && Number(fallbackSession.expiresAt || 0) > Date.now() && typeof databaseClient.findUserById === "function") {
      user = await databaseClient.findUserById(fallbackSession.userId);
    } else if (fallbackSession) {
      authTokenFallbackSessions.delete(tokenHash);
    }
  }
  if (!user) {
    req.__mullemAuthContext = null;
    return null;
  }

  try {
    await databaseClient.touchApiToken(tokenHash);
  } catch (error) {
    console.warn("[mullem] auth token touch skipped:", error?.message || error);
  }
  await realScaleInfra.setJson(`session:${tokenHash}`, {
    user,
    expiresAt: Date.now() + 60_000
  }, 60_000);
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
  if (!userHasPermission(auth.user, "admin:read")) {
    throw createHttpError(403, "Admin access is required.");
  }
  req.admin = auth.user;
  return auth;
}

async function requireAdminRoutePermission(req, method, requestPath) {
  const auth = await requireAdminUser(req);
  const permission = securityCompliance.getAdminRoutePermission(method, requestPath);
  securityCompliance.requirePermission(getUserRbacRole(auth.user), permission);
  req.admin = auth.user;
  req.adminPermission = permission;
  return auth;
}

function getRequestIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "")
    .split(",")[0]
    .trim()
    .slice(0, 80);
}

function getPublicBaseUrl(req) {
  const envUrl = readEnvValue(["NEXTAUTH_URL", "RENDER_EXTERNAL_URL", "PUBLIC_APP_URL", "APP_URL"], "");
  if (envUrl) return envUrl.replace(/\/+$/, "");
  const protocol = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() || "https";
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  return host ? `${protocol}://${host}` : "";
}

function getAuthProviderConfig(provider, req) {
  const key = String(provider || "").trim().toLowerCase();
  const baseUrl = getPublicBaseUrl(req);
  const configs = {
    google: {
      provider: "google",
      label: "Google",
      callbackPath: "/api/auth/callback/google",
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authBase: "https://accounts.google.com/o/oauth2/v2/auth",
      scope: "openid email profile"
    },
    microsoft: {
      provider: "microsoft",
      label: "Microsoft",
      callbackPath: "/api/auth/callback/azure-ad",
      clientId: MICROSOFT_CLIENT_ID,
      clientSecret: MICROSOFT_CLIENT_SECRET,
      authBase: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      scope: "openid email profile offline_access"
    },
    "azure-ad": {
      provider: "microsoft",
      label: "Microsoft",
      callbackPath: "/api/auth/callback/azure-ad",
      clientId: MICROSOFT_CLIENT_ID,
      clientSecret: MICROSOFT_CLIENT_SECRET,
      authBase: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      scope: "openid email profile offline_access"
    },
    apple: {
      provider: "apple",
      label: "Apple",
      callbackPath: "/api/auth/callback/apple",
      clientId: APPLE_CLIENT_ID,
      clientSecret: APPLE_CLIENT_SECRET,
      authBase: "https://appleid.apple.com/auth/authorize",
      scope: "name email",
      responseMode: "form_post"
    }
  };
  const config = configs[key] || null;
  if (!config) return null;
  const callbackUrl = baseUrl ? `${baseUrl}${config.callbackPath}` : config.callbackPath;
  const enabled = Boolean(config.clientId && config.clientSecret);
  return {
    ...config,
    enabled,
    callbackUrl,
    missing: [
      config.clientId ? "" : `${config.provider.toUpperCase()}_CLIENT_ID`,
      config.clientSecret ? "" : `${config.provider.toUpperCase()}_CLIENT_SECRET`
    ].filter(Boolean)
  };
}

function buildAuthProviderLoginUrl(config) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: config.provider === "apple" ? "code id_token" : "code",
    scope: config.scope,
    state: crypto.randomBytes(16).toString("hex")
  });
  if (config.responseMode) {
    params.set("response_mode", config.responseMode);
  }
  return `${config.authBase}?${params.toString()}`;
}

function publicAuthProvider(config) {
  return {
    provider: config.provider,
    label: config.label,
    enabled: Boolean(config.enabled),
    callbackUrl: config.callbackUrl,
    missing: config.missing
  };
}

async function handleAuthProviders(req, res) {
  const providers = ["google", "microsoft", "apple"]
    .map((provider) => publicAuthProvider(getAuthProviderConfig(provider, req)));
  sendJson(req, res, 200, {
    success: true,
    ok: true,
    providers,
    config: {
      nextAuthConfigured: Boolean(NEXTAUTH_URL && NEXTAUTH_SECRET),
      supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
    }
  });
}

async function handleAuthProviderStart(req, res, provider) {
  const config = getAuthProviderConfig(provider, req);
  if (!config) {
    throw createPublicHttpError(404, "AUTH_PROVIDER_NOT_FOUND", "مزود تسجيل الدخول غير موجود.", {
      provider
    });
  }

  if (!config.enabled) {
    console.error("LOGIN_ERROR", {
      provider: config.provider,
      status: 503,
      message: "OAuth provider is not configured",
      code: "AUTH_PROVIDER_DISABLED"
    });
    throw createPublicHttpError(503, "AUTH_PROVIDER_DISABLED", `خدمة تسجيل الدخول عبر ${config.label} غير مفعلة حاليًا.`, {
      provider: config.provider,
      missing: config.missing,
      callbackUrl: config.callbackUrl
    });
  }

  sendJson(req, res, 200, {
    success: true,
    ok: true,
    provider: config.provider,
    login_url: buildAuthProviderLoginUrl(config),
    callbackUrl: config.callbackUrl
  });
}

async function handleAuthProviderCallback(req, res, provider) {
  const config = getAuthProviderConfig(provider, req);
  if (!config) {
    throw createPublicHttpError(404, "AUTH_PROVIDER_NOT_FOUND", "مزود تسجيل الدخول غير موجود.", {
      provider
    });
  }
  throw createPublicHttpError(501, "AUTH_PROVIDER_CALLBACK_NOT_IMPLEMENTED", `ربط ${config.label} لم يكتمل على الخادم بعد.`, {
    provider: config.provider,
    callbackUrl: config.callbackUrl
  });
}

async function recordAdminAction(req, auth, action, targetType = "", targetId = "", details = {}) {
  if (!databaseClient || typeof databaseClient.recordAdminLog !== "function") return;
  try {
    const safeDetails = securityCompliance.redactDeep(details || {}, { redactPii: false });
    await databaseClient.recordAdminLog({
      admin_id: auth?.user?.id || req?.admin?.id || null,
      action,
      target_type: targetType,
      target_id: targetId,
      details: {
        ...safeDetails,
        actor: {
          id: auth?.user?.id || req?.admin?.id || null,
          role: getUserRbacRole(auth?.user || req?.admin || {})
        },
        request_id: req?.__requestId || null,
        user_agent: String(req?.headers?.["user-agent"] || "").slice(0, 300)
      },
      ip_address: getRequestIp(req),
      user_agent: String(req?.headers?.["user-agent"] || "").slice(0, 300)
    });
  } catch (error) {
    console.warn("Admin log write failed:", error.message);
  }
}

async function recordToolUsageEvent(req, auth, toolKey, taskType = "", metadata = {}) {
  if (!databaseClient || typeof databaseClient.saveToolUsage !== "function") return;
  try {
    await databaseClient.saveToolUsage({
      user_id: auth?.user?.id,
      tool_key: toolKey,
      task_type: taskType,
      xp_cost: 0,
      metadata: {
        ...metadata,
        ip: getRequestIp(req)
      }
    });
  } catch (error) {
    console.warn("Tool usage log write failed:", error.message);
  }
}

async function initializeDatabaseLayer() {
  let primaryClient = null;

  try {
    if (!ensureDatabaseRuntimeDependency()) {
      throw new Error("PostgreSQL runtime dependency is unavailable.");
    }
    const { createPostgresDatabaseClient } = require("./postgres-db");
    primaryClient = createPostgresDatabaseClient({
      connectionString: DATABASE_URL,
      host: DB_HOST,
      port: DB_PORT,
      database: DB_DATABASE,
      username: DB_USERNAME,
      password: DB_PASSWORD
    });
    await primaryClient.initialize();
    if (!primaryClient.isReady()) {
      const postgresState = typeof primaryClient.getState === "function" ? primaryClient.getState() : null;
      throw new Error(
        postgresState?.message ||
        "Neon/PostgreSQL connection is not ready. Set DATABASE_URL or one of the supported Neon/Postgres environment variables."
      );
    }
    await ensureDefaultUsers(primaryClient);
    await seedAiKnowledgeBaseSafely(primaryClient);
    databaseClient = primaryClient;
    databaseState = typeof primaryClient.getState === "function"
      ? primaryClient.getState()
      : {
          configured: true,
          connected: true,
          driver: "postgres",
          host: DB_HOST,
          port: DB_PORT,
          database: DB_DATABASE,
          message: "PostgreSQL/Neon connected successfully."
        };
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
    const fallbackClient = createFallbackDatabaseClient();
    await fallbackClient.initialize();
    databaseClient = fallbackClient;
    await ensureDefaultUsers(fallbackClient);
    await seedAiKnowledgeBaseSafely(fallbackClient);
    databaseState = {
      ...fallbackClient.getState(),
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

function normalizeProviderKey(value) {
  const provider = String(value || "").trim().toLowerCase();
  return provider === "deepseek" ? "deepseek" : "openai";
}

function resolveProfileProvider(profile) {
  const provider = normalizeProviderKey(profile?.provider);
  if (provider === "deepseek" && DEEPSEEK_API_KEY) return "deepseek";
  return "openai";
}

function resolveProviderModel(profile, provider) {
  if (normalizeProviderKey(provider) === "deepseek") {
    return String(profile?.deepseekModel || DEEPSEEK_CHAT_MODEL || "deepseek-chat").trim();
  }

  const rawModel = String(profile?.openaiModel || "").trim();
  const blockedModelPattern = new RegExp(`^${"deep" + "seek"}-`, "i");
  if (!rawModel || blockedModelPattern.test(rawModel)) {
    return OPENAI_MODEL || "gpt-4.1-mini";
  }
  return rawModel;
}

function sanitizeProviderErrorMessage(message, fallback = "تعذر تنفيذ طلب الذكاء الاصطناعي.") {
  return String(message || fallback)
    .replace(/OpenAI/gi, "Orlixor")
    .replace(/openai/gi, "Orlixor")
    .replace(/openai-[a-z0-9.\-]+/gi, "Orlixor AI")
    .replace(/gpt-[a-z0-9.\-]+/gi, "Orlixor AI")
    .replace(/dall-e-[a-z0-9.\-]+/gi, "Orlixor Image");
}

function buildChatCompletionMessagesFromInput(input, profile) {
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        const role = String(item?.role || "user").trim().toLowerCase();
        const safeRole = role === "system" || role === "assistant" ? role : "user";
        const content = limitPromptContext(coerceModelText(item?.content), profile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS);
        return content ? { role: safeRole, content } : null;
      })
      .filter(Boolean);
  }

  const systemPrompt = coerceModelText(profile?.systemPrompt);
  const userInput = limitPromptContext(input, profile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS);
  return [
    systemPrompt ? { role: "system", content: systemPrompt } : null,
    { role: "user", content: userInput }
  ].filter(Boolean);
}

async function callDeepSeekChat({ input, modelProfile }) {
  if (!DEEPSEEK_API_KEY) {
    throw createHttpError(503, "DeepSeek is not configured on the server.");
  }

  const startedAt = Date.now();
  const profile = modelProfile || modelProfiles.orlixor;
  const endpoint = DEEPSEEK_CHAT_COMPLETIONS_ENDPOINT;
  const model = resolveProviderModel(profile, "deepseek");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: buildChatCompletionMessagesFromInput(input, profile),
        temperature: Number(profile.temperature ?? 0.5),
        max_tokens: Math.max(120, Math.min(Number(profile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 2000)),
        stream: false
      }),
      signal: controller.signal
    });
  } catch (error) {
    recordAiProviderHealth("deepseek", false, Date.now() - startedAt, error);
    if (error?.name === "AbortError") {
      throw createHttpError(504, "DeepSeek request timed out.");
    }
    throw createHttpError(503, "Failed to reach DeepSeek from the server.");
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    recordAiProviderHealth("deepseek", false, Date.now() - startedAt, payload?.error?.message || payload?.message || `HTTP_${response.status}`);
    console.error("[DEEPSEEK_CHAT_ERROR]", {
      endpoint,
      model,
      status: response.status,
      body: payload
    });
    throw createHttpError(
      response.status,
      payload?.error?.message || payload?.message || `DeepSeek request failed with status ${response.status}.`
    );
  }

  const text = extractResponseText(payload);
  if (!text) {
    recordAiProviderHealth("deepseek", false, Date.now() - startedAt, "DeepSeek returned an empty response.");
    throw createHttpError(502, "DeepSeek returned an empty response.");
  }

  recordAiProviderHealth("deepseek", true, Date.now() - startedAt);
  return { text, raw: payload, usage: extractTokenUsage(payload), provider: "deepseek", model };
}

async function callOpenAIChat({ input, modelProfile }) {
  if (!OPENAI_API_KEY) {
    throw createHttpError(503, "مزود النصوص غير مفعّل حاليًا.");
  }

  const startedAt = Date.now();
  const profile = modelProfile || modelProfiles.orlixor;
  const endpoint = OPENAI_CHAT_COMPLETIONS_ENDPOINT;
  const model = resolveProviderModel(profile, "openai");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: buildChatCompletionMessagesFromInput(input, profile),
        temperature: Number(profile.temperature ?? 0.5),
        max_tokens: Math.max(120, Math.min(Number(profile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 1600)),
        stream: false
      }),
      signal: controller.signal
    });
  } catch (error) {
    recordAiProviderHealth("openai", false, Date.now() - startedAt, error);
    if (error?.name === "AbortError") {
      console.error("[OPENAI_CHAT_TIMEOUT]", {
        endpoint,
        model,
        provider: "openai"
      });
      throw createHttpError(504, "انتهت مهلة طلب Orlixor AI.");
    }
    console.error("[OPENAI_CHAT_FETCH_ERROR]", {
      endpoint,
      model,
      provider: "openai",
      error: error?.message || String(error || "")
    });
    throw createHttpError(503, "تعذر الوصول إلى مزود النصوص.");
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    recordAiProviderHealth("openai", false, Date.now() - startedAt, payload?.error?.message || payload?.message || `HTTP_${response.status}`);
    console.error("[OPENAI_CHAT_ERROR]", {
      endpoint,
      model,
      status: response.status,
      body: payload
    });
    const message = sanitizeProviderErrorMessage(
      payload?.error?.message || payload?.message,
      `فشل طلب Orlixor AI برمز ${response.status}.`
    );
    throw createHttpError(response.status, message);
  }

  const text = extractResponseText(payload);
  if (!text) {
    throw createHttpError(502, "عاد Orlixor AI برد فارغ.");
  }

  recordAiProviderHealth("openai", true, Date.now() - startedAt);
  return { text, raw: payload, usage: extractTokenUsage(payload), provider: "openai" };
}

async function callOpenAI({ input, modelProfile }) {
  const profile = modelProfile || modelProfiles.orlixor;
  if (resolveProfileProvider(profile) === "deepseek") {
    try {
      return await callDeepSeekChat({ input, modelProfile: profile });
    } catch (error) {
      const fallbackProfile = buildOpenAiFallbackProfile(profile);
      if (!fallbackProfile) throw error;
      console.warn("[AI_PROVIDER_FALLBACK]", {
        from: "deepseek",
        to: "openai",
        status: Number(error?.statusCode || error?.status || 0),
        message: error?.message || String(error || "")
      });
      const result = await callOpenAIChat({ input, modelProfile: fallbackProfile });
      aiRuntimeState.scaling.fallbackRecoveries += 1;
      return {
        ...result,
        recovered: true,
        fallback: {
          from_provider: "deepseek",
          to_provider: "openai",
          reason: String(error?.message || error || "deepseek_failed").slice(0, 240)
        }
      };
    }
  }

  if (resolveProfileProvider(profile) === "openai") {
    try {
      return await callOpenAIChat({ input, modelProfile: profile });
    } catch (error) {
      if (
        ORLIXOR_ALLOW_PROVIDER_FALLBACK &&
        OPENAI_API_KEY &&
        isopenaiModelUnavailableError(error)
      ) {
        const fallbackProfile = buildOpenAIFallbackProfile(profile);
        console.warn("[AI_PROVIDER_FALLBACK]", {
          from: "openai",
          to: "openai",
          model: String(profile?.openaiModel || ""),
          fallbackModel: fallbackProfile.openaiModel,
          status: Number(error?.statusCode || error?.status || 0),
          message: error?.message || String(error || "")
        });
        return callOpenAI({ input, modelProfile: fallbackProfile });
      }
      const fallbackProfile = buildDeepSeekFallbackProfile(profile);
      if (
        fallbackProfile &&
        (Number(error?.statusCode || error?.status || 0) >= 500 || Number(error?.statusCode || error?.status || 0) === 0 || Number(error?.statusCode || error?.status || 0) === 429)
      ) {
        console.warn("[AI_PROVIDER_FALLBACK]", {
          from: "openai",
          to: "deepseek",
          status: Number(error?.statusCode || error?.status || 0),
          message: error?.message || String(error || "")
        });
        const result = await callDeepSeekChat({ input, modelProfile: fallbackProfile });
        aiRuntimeState.scaling.fallbackRecoveries += 1;
        return {
          ...result,
          recovered: true,
          fallback: {
            from_provider: "openai",
            to_provider: "deepseek",
            reason: String(error?.message || error || "openai_failed").slice(0, 240)
          }
        };
      }
      throw error;
    }
  }

  if (!OPENAI_API_KEY) {
    throw createHttpError(503, "خدمة الذكاء الاصطناعي غير مفعلة حاليًا.");
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
        model: resolveProviderModel(profile, "openai"),
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
    message = sanitizeProviderErrorMessage(message, "Orlixor AI request failed.");
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

function resolveVisionModel(profile) {
  if (resolveProfileProvider(profile) === "openai") {
    return ORLIXOR_IMAGE_ANALYSIS_MODEL || OPENAI_VISION_MODEL || "gpt-4.1-mini";
  }
  const candidate = String(profile?.openaiModel || OPENAI_VISION_MODEL || OPENAI_MODEL_DEFAULT || OPENAI_MODEL).trim();
  if (!candidate || /^openai-/i.test(candidate) || /text$/i.test(candidate) || /-text/i.test(candidate)) {
    return OPENAI_VISION_MODEL || "gpt-4.1-mini";
  }
  return candidate;
}

function buildVisionChatMessages(messages = [], images = [], profile = modelProfiles.orlixor) {
  const safeMessages = (Array.isArray(messages) ? messages : [])
    .map((item) => {
      const role = String(item?.role || "").trim().toLowerCase();
      const safeRole = role === "system" || role === "assistant" ? role : "user";
      const content = coerceModelText(item?.content);
      return content ? { role: safeRole, content } : null;
    })
    .filter(Boolean);

  const lastUserIndex = safeMessages.map((item) => item.role).lastIndexOf("user");
  const targetIndex = lastUserIndex >= 0 ? lastUserIndex : safeMessages.length;
  if (targetIndex === safeMessages.length) {
    safeMessages.push({ role: "user", content: "" });
  }

  const userText = limitPromptContext(
    safeMessages[targetIndex].content || "حلل هذه الصورة بالتفصيل.",
    profile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS
  );
  safeMessages[targetIndex] = {
    role: "user",
    content: [
      {
        type: "text",
        text: [
          userText,
          "",
          "أنت محلل صور ذكي في Orlixor. قم بتحليل الصورة بدقة، واقرأ أي نص ظاهر، واشرح الواجهة أو العناصر المرئية بالتفصيل. لا تقل إن الصورة غير واضحة إلا إذا كانت تالفة فعلاً."
        ].join("\n")
      },
      ...images.map((image) => ({
        type: "image_url",
        image_url: {
          url: image.url,
          detail: "auto"
        }
      }))
    ]
  };

  return safeMessages;
}

async function callOpenAIVision({ messages, images, modelProfile }) {
  if (!OPENAI_API_KEY) {
    throw createHttpError(503, "خدمة تحليل الصور غير مفعلة على الخادم. تحقق من إعداد OPENAI_API_KEY ثم أعد تشغيل الخادم.");
  }

  const profile = modelProfile || modelProfiles.pro || modelProfiles.orlixor;
  const safeImages = sanitizeAttachmentImages(images);
  if (!safeImages.length) {
    return callOpenAI({ input: buildResponsesInput(messages), modelProfile: profile });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(OPENAI_CHAT_COMPLETIONS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: resolveVisionModel(profile),
        messages: buildVisionChatMessages(messages, safeImages, profile),
        temperature: Number(profile.temperature ?? 0.45),
        max_tokens: Math.max(120, Math.min(Number(profile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 1600))
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createHttpError(504, "انتهت مهلة تحليل الصورة من الخادم. حاول بصورة أصغر أو أعد المحاولة بعد قليل.");
    }
    throw createHttpError(503, "تعذر اتصال الخادم بخدمة تحليل الصور. تحقق من OPENAI_CHAT_COMPLETIONS_ENDPOINT أو اتصال الخادم بالإنترنت.");
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
      `Orlixor AI vision request failed with status ${response.status}`;
    message = String(message)
      .replace(/OpenAI/gi, "Orlixor AI")
      .replace(/gpt-[a-z0-9.\-]+/gi, "Orlixor AI");
    if (response.status === 401 || response.status === 403) {
      message = "تعذر تشغيل تحليل الصور بسبب إعداد مفتاح الخدمة على الخادم. تحقق من OPENAI_API_KEY.";
    } else if (response.status === 429) {
      message = "خدمة تحليل الصور عليها ضغط الآن. حاول بعد قليل.";
    }
    throw createHttpError(response.status, message);
  }

  const text = extractResponseText(payload);
  if (!text) {
    throw createHttpError(502, "عاد تحليل الصور برد فارغ. حاول بصورة أوضح أو أعد المحاولة.");
  }

  return { text, raw: payload, usage: extractTokenUsage(payload) };
}

async function callImageAnalysisModel({ imageFile, prompt, user }) {
  ensureImageServiceConfigured();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  const model = chooseImageModel("analyze", getUserPlanKey(user), "standard");
  let response;

  try {
    response = await fetch(OPENAI_CHAT_COMPLETIONS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: [
              "أنت محلل صور ذكي في Orlixor.",
              "حلل الصورة بوضوح واقرأ النصوص إن وجدت واشرح العناصر المهمة.",
              "إذا كانت الصورة واجهة أو تصميمًا فاشرح ترتيبها وملاحظاتها بدقة.",
              "لا تقل إن الصورة غير واضحة إلا إذا كانت تالفة فعلًا.",
              "لا تذكر أسماء مزودي الخدمة أو أسماء الموديلات التقنية."
            ].join("\n")
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt || "حلل هذه الصورة بالتفصيل، وإذا كان فيها نص فاقرأه، وإذا كانت واجهة فاشرح عناصرها."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageFile.mimetype};base64,${imageFile.buffer.toString("base64")}`,
                  detail: "auto"
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 900
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createHttpError(504, "انتهت مهلة تحليل الصورة.");
    }
    throw createHttpError(503, "تعذر الوصول إلى خدمة تحليل الصور.");
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await readOpenAIJsonResponse(response);
  if (!response.ok) {
    throw buildImageServiceError(payload, "تعذر تحليل الصورة.", response.status);
  }

  const output = sanitizeModelDisplayText(extractResponseText(payload));
  if (!output) {
    throw createHttpError(502, "تعذر استخراج تحليل واضح من الصورة.");
  }

  return { output, raw: payload, usage: extractTokenUsage(payload) };
}

async function callImageGenerationModel({ prompt, size, quality, user }) {
  ensureImageServiceConfigured();
  const planKey = getUserPlanKey(user);
  const model = chooseImageModel("generate", planKey, quality);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS * 2);
  let response;

  try {
    response = await fetch(OPENAI_IMAGES_GENERATIONS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt: [
          "أنشئ صورة احترافية حسب الوصف التالي:",
          prompt,
          "",
          "التزم بتكوين مرتب وتفاصيل واضحة وجودة مناسبة. لا تضف نصوصًا عشوائية داخل الصورة."
        ].join("\n"),
        size,
        quality: normalizeOpenAIImageQuality(quality),
        n: 1
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createHttpError(504, "انتهت مهلة إنشاء الصورة.");
    }
    throw createHttpError(503, "تعذر الوصول إلى خدمة إنشاء الصور.");
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await readOpenAIJsonResponse(response);
  if (!response.ok) {
    throw buildImageServiceError(payload, "تعذر إنشاء الصورة.", response.status);
  }

  const image = normalizeImageApiResult(payload?.data?.[0]);
  if (!image.url && !image.b64_json) {
    throw createHttpError(502, "لم يتم إنشاء صورة صالحة.");
  }

  return { image, raw: payload, usage: payload?.usage || null };
}

async function callImageEditModel({ imageFile, prompt, size, quality, user }) {
  ensureImageServiceConfigured();
  const planKey = getUserPlanKey(user);
  const model = chooseImageModel("edit", planKey, quality);
  const form = new FormData();
  const imageBlob = new Blob([imageFile.buffer], { type: imageFile.mimetype });
  const filename = sanitizeOptionalText(imageFile.filename, 120) || "orlixor-image.png";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS * 2);
  let response;

  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("quality", normalizeOpenAIImageQuality(quality));
  form.append("image", imageBlob, filename);

  try {
    response = await fetch(OPENAI_IMAGES_EDITS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: form,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createHttpError(504, "انتهت مهلة تعديل الصورة.");
    }
    throw createHttpError(503, "تعذر الوصول إلى خدمة تعديل الصور.");
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await readOpenAIJsonResponse(response);
  if (!response.ok) {
    throw buildImageServiceError(payload, "تعذر تعديل الصورة.", response.status);
  }

  const image = normalizeImageApiResult(payload?.data?.[0]);
  if (!image.url && !image.b64_json) {
    throw createHttpError(502, "لم يتم إنشاء صورة معدلة صالحة.");
  }

  return { image, raw: payload, usage: payload?.usage || null };
}

function normalizeWritingTask(value) {
  const key = String(value || "generate").trim().toLowerCase();
  if (key === "style" || key === "proofread" || key === "correct") return "rewrite";
  if (key === "long" || key === "longgenerate" || key === "long_generate") return "longGenerate";
  if (["generate", "tone", "expand", "summarize", "rewrite", "longGenerate"].includes(key)) return key;
  return "generate";
}

function normalizeWritingLength(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "medium";
  if (text.includes("قصير") || text === "short") return "short";
  if (text.includes("طويل") || text === "long") return "long";
  if (text.includes("متوسط") || text === "medium") return "medium";
  return "medium";
}

function getWritingMaxOutputTokens(lengthValue) {
  const key = normalizeWritingLength(lengthValue);
  if (key === "short") return 400;
  if (key === "long") return 1200;
  return 800;
}

function getWritingProfile(taskType, user) {
  const task = normalizeWritingTask(taskType);
  const base = {
    key: `writing-${task}`,
    name: "Orlixor Writing Assistant",
    provider: "openai",
    openaiModel: "gpt-4.1-mini",
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

function calculateWritingXpCost(taskType, inputText = "", details = "", length = "") {
  const task = normalizeWritingTask(taskType);
  const totalLength = String(inputText || "").length + String(details || "").length;
  let cost = WRITING_XP_COSTS[task] || WRITING_XP_COSTS.generate;
  const lengthKey = normalizeWritingLength(length);
  if (task === "generate") {
    if (lengthKey === "short") {
      cost = Math.max(1, WRITING_XP_COSTS.generate - 2);
    } else if (lengthKey === "long") {
      cost = Math.max(cost, WRITING_XP_COSTS.longGenerate);
    }
  }
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
    provider: ORLIXOR_TURBO_PROVIDER,
    openaiModel: OPENAI_MODEL_TONE || OPENAI_MODEL_TURBO || OPENAI_MODEL_DEFAULT,
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
    provider: ORLIXOR_DEFAULT_PROVIDER,
    openaiModel: OPENAI_MODEL_CORRECTION || OPENAI_MODEL_DEFAULT,
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
    provider: ORLIXOR_CREATIVE_PROVIDER,
    openaiModel: OPENAI_MODEL_EXPAND || OPENAI_MODEL_CREATIVE || OPENAI_MODEL_DEFAULT,
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
    provider: ORLIXOR_TURBO_PROVIDER,
    openaiModel: OPENAI_MODEL_SUMMARY || OPENAI_MODEL_TURBO || OPENAI_MODEL_DEFAULT,
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

const STYLE_GOALS = Object.freeze({
  clarity: {
    label: "وضوح النص",
    prompt: "حسّن النص ليكون أوضح وأسهل فهمًا، مع إزالة الغموض والتكرار."
  },
  professional: {
    label: "احترافية أعلى",
    prompt: "ارفع مستوى النص ليكون أكثر احترافية ومناسبًا للأعمال والمراسلات."
  },
  persuasive: {
    label: "جاذبية وإقناع",
    prompt: "اجعل النص أكثر جاذبية وإقناعًا مع الحفاظ على المعنى الأساسي."
  },
  impact: {
    label: "قوة وتأثير",
    prompt: "اجعل النص أقوى تأثيرًا وأكثر حضورًا مع الحفاظ على المعنى والفكرة الأساسية."
  },
  organized: {
    label: "تنظيم أفضل",
    prompt: "نظّم النص ورتّب الأفكار بشكل أوضح وأكثر سلاسة."
  },
  smooth: {
    label: "بساطة وسلاسة",
    prompt: "اجعل النص أبسط وأسلس للقارئ بدون تغيير الفكرة."
  }
});

const STYLE_LEVELS = Object.freeze({
  light: {
    label: "خفيف",
    prompt: "قم بتحسين خفيف فقط بدون تغيير واضح في الأسلوب."
  },
  balanced: {
    label: "متوسط",
    prompt: "حسّن النص بشكل متوازن مع الحفاظ على روح النص."
  },
  deep: {
    label: "عميق",
    prompt: "أعد صياغة النص بأسلوب احترافي واضح مع تحسين شامل."
  }
});

function normalizeStyleGoal(value) {
  const key = String(value || "clarity").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(STYLE_GOALS, key) ? key : "clarity";
}

function normalizeStyleLevel(value) {
  const key = String(value || "balanced").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(STYLE_LEVELS, key) ? key : "balanced";
}

function getStyleProfile(user, level = "balanced") {
  const normalizedLevel = normalizeStyleLevel(level);
  const isDeep = normalizedLevel === "deep";
  return {
    key: "writing-style",
    name: "Orlixor Style",
    provider: ORLIXOR_CREATIVE_PROVIDER,
    openaiModel: OPENAI_MODEL_STYLE || OPENAI_MODEL_CREATIVE || OPENAI_MODEL_DEFAULT,
    temperature: 0.45,
    maxOutputTokens: isFreeUser(user) ? 400 : (isDeep ? 900 : 650),
    maxContextTokens: isFreeUser(user) ? FREE_MAX_CONTEXT_TOKENS : 2500,
    minXpCost: isDeep ? STYLE_DEEP_XP_COST : STYLE_XP_COST,
    maxXpCost: isDeep ? STYLE_DEEP_XP_COST : STYLE_XP_COST,
    systemPrompt: [
      "أنت أداة تحسين الأسلوب في Orlixor.",
      "حسّن النص ليكون أوضح وأكثر احترافية.",
      "حافظ على المعنى الأصلي.",
      "لا تضف معلومات غير موجودة في النص.",
      "أعد النص المحسّن فقط بدون شرح.",
      "لا تذكر أسماء مزودي الخدمة أو النماذج التقنية."
    ].join("\n")
  };
}

function buildStylePrompt({ text, goal, level, keepMeaning, audience }) {
  const goalKey = normalizeStyleGoal(goal);
  const levelKey = normalizeStyleLevel(level);
  const safeAudience = sanitizeOptionalText(audience, 80) || "عام";
  return [
    { role: "system", content: getStyleProfile(null, levelKey).systemPrompt },
    {
      role: "user",
      content: [
        `هدف التحسين: ${STYLE_GOALS[goalKey].prompt}`,
        `مستوى التحسين: ${STYLE_LEVELS[levelKey].prompt}`,
        `الجمهور المستهدف: ${safeAudience}`,
        keepMeaning === false
          ? "يمكن تحسين الأسلوب بحرية مع عدم تغيير الفكرة الأساسية."
          : "حافظ على المعنى الأصلي بدقة ولا تغيّر الفكرة.",
        "النص:",
        String(text || "").trim()
      ].join("\n\n")
    }
  ];
}

function getOpenAiWebSearchV2SourceInstruction(sourceType) {
  const key = String(sourceType || "all").trim().toLowerCase();
  if (key === "news") return "ركز على الأخبار والمصادر الحديثة، وتجنب النتائج القديمة إذا لم تكن مهمة.";
  if (key === "academic") return "ركز على المصادر الأكاديمية والتعليمية والموثوقة قدر الإمكان.";
  if (key === "tech") return "ركز على المصادر التقنية والرسمية والوثائق الحديثة قدر الإمكان.";
  return "استخدم أفضل المصادر الموثوقة والمتنوعة المتاحة.";
}

function shouldUseDetailedOpenAiWebSearchV2(query, sourceType) {
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

async function callOpenAiWebSearchV2ViaSdk({ query, language, sourceType, deep }) {
  const prompt = [
    "أنت أداة البحث الذكي في Orlixor.",
    "أجب بالعربية باختصار وتنظيم إلا إذا طلب المستخدم غير ذلك.",
    "اعتمد على نتائج البحث المبنية في الأداة، واذكر المصادر عند توفرها.",
    "لا تذكر أسماء مزودي الخدمة أو النماذج التقنية للمستخدم.",
    "إذا كانت المعلومات غير مؤكدة أو غير موجودة في النتائج، وضح ذلك بدل الاختلاق.",
    getOpenAiWebSearchV2SourceInstruction(sourceType),
    `لغة الإجابة المطلوبة: ${String(language || "العربية").trim()}.`,
    `سؤال المستخدم: ${String(query || "").trim()}`
  ].join("\n");

  const response = await openAiWebSearchV2Raw(prompt);
  const text = sanitizeModelDisplayText(response?.output_text || "");
  if (!text) {
    throw createHttpError(502, "OpenAI returned an empty smart search response.");
  }

  return {
    text,
    sources: extractResponseSources(response),
    usage: extractTokenUsage(response),
    provider: "openai",
    model: resolveOpenAiWebSearchV2Model()
  };
}

async function callOpenAiWebSearchV2({ query, language, sourceType, deep }) {
  if (!OPENAI_API_KEY) {
    throw createHttpError(503, "OPENAI_API_KEY is not configured on the server.");
  }

  const endpoint = OPENAI_RESPONSES_ENDPOINT || "https://api.openai.com/v1/responses";
  const model = resolveOpenAiWebSearchV2Model();
  const instructions = [
    "أنت أداة البحث الذكي في Orlixor.",
    "أجب بالعربية باختصار وتنظيم إلا إذا طلب المستخدم غير ذلك.",
    "اعتمد على نتائج البحث المدمجة في الأداة، واذكر المصادر عند توفرها.",
    "لا تذكر أسماء مزودي الخدمة أو النماذج التقنية للمستخدم.",
    "إذا كانت المعلومة غير مؤكدة أو غير موجودة في النتائج، وضّح ذلك بدل الاختلاق.",
    getOpenAiWebSearchV2SourceInstruction(sourceType),
    `لغة الإجابة المطلوبة: ${String(language || "العربية").trim()}.`
  ].join("\n");

  const payloadBody = {
    model,
    instructions,
    input: String(query || "").trim(),
    tools: [{ type: "web_search" }],
    temperature: deep ? 0.25 : 0.2,
    max_output_tokens: deep ? 1200 : 800
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payloadBody),
      signal: controller.signal
    });
  } catch (error) {
    const status = error?.name === "AbortError" ? 504 : 503;
    console.error("Smart search error:", {
      provider: "openai",
      endpoint,
      model,
      status,
      message: error?.message || String(error || ""),
      query,
      sourceType,
      deep
    });
    throw createHttpError(status, error?.name === "AbortError"
      ? "انتهت مهلة البحث الذكي عبر OpenAI."
      : "تعذر الوصول إلى OpenAI للبحث الذكي.");
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    console.error("Smart search error:", {
      provider: "openai",
      endpoint,
      model,
      status: response.status,
      body: payload,
      query,
      sourceType,
      deep
    });
    const message = sanitizeProviderErrorMessage(
      payload?.error?.message || payload?.error || payload?.message,
      `فشل طلب البحث الذكي عبر OpenAI برمز ${response.status}.`
    );
    throw createHttpError(response.status, message);
  }

  const text = sanitizeModelDisplayText(payload?.output_text || extractResponseText(payload));
  if (!text) {
    console.error("Smart search error:", {
      provider: "openai",
      endpoint,
      model,
      status: response.status,
      body: payload,
      query,
      sourceType,
      deep
    });
    throw createHttpError(502, "عاد البحث الذكي عبر OpenAI برد فارغ.");
  }

  return {
    text,
    sources: extractResponseSources(payload),
    usage: extractTokenUsage(payload),
    provider: "openai",
    model
  };
}

async function createEmbedding(content) {
  const text = String(content || "").trim();
  if (!ORLIXOR_ENABLE_EMBEDDINGS || !OPENAI_API_KEY || !text) return null;
  const startedAt = Date.now();

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
    if (!response.ok) {
      recordAiSubsystemHealth("embeddings", false, Date.now() - startedAt, payload?.error?.message || payload?.message || `HTTP_${response.status}`);
      return null;
    }
    const embedding = payload?.data?.[0]?.embedding;
    const ok = Array.isArray(embedding);
    recordAiSubsystemHealth("embeddings", ok, Date.now() - startedAt, ok ? null : "Embedding response did not include a vector.");
    return ok ? embedding : null;
  } catch (error) {
    recordAiSubsystemHealth("embeddings", false, Date.now() - startedAt, error);
    return null;
  }
}

async function getRetrievedKnowledgeContext(payload = {}) {
  const analysis = payload.analysis || aiIntelligence.analyzeRequest({ message: payload.message || "" });
  if (!analysis.needsRetrieval || !isDatabaseReady() || typeof databaseClient?.listKnowledgeChunks !== "function") {
    return { context: "", sources: [] };
  }

  const sanitized = aiIntelligence.sanitizeSensitiveText(payload.message || "");
  const queryText = sanitized.text || String(payload.message || "").trim();
  if (!queryText) return { context: "", sources: [] };
  const startedAt = Date.now();

  let embedding = null;
  if (ORLIXOR_ENABLE_EMBEDDINGS) {
    embedding = await createEmbedding(queryText);
  }

  try {
    const rows = await databaseClient.listKnowledgeChunks({
      query: queryText,
      embedding,
      task_type: analysis.taskType,
      limit: 10
    });
    const ranked = aiIntelligence.rankKnowledgeSources(rows, analysis).slice(0, 5);
    recordAiSubsystemHealth("rag", true, Date.now() - startedAt);
    return {
      context: aiIntelligence.formatKnowledgeContext(ranked, 5),
      sources: ranked
    };
  } catch (error) {
    recordAiSubsystemHealth("rag", false, Date.now() - startedAt, error);
    console.warn("[AI_RAG_RETRIEVAL_SKIPPED]", error?.message || error);
    return { context: "", sources: [] };
  }
}

async function getAiCostGuardrailStatsSafe() {
  if (!isDatabaseReady() || typeof databaseClient.getAiCostGuardrailStats !== "function") {
    return {
      site_daily_cost_usd: 0,
      events_today: 0,
      avg_latency_ms: 0,
      avg_quality: 0,
      by_plan: [],
      by_user: []
    };
  }
  try {
    return await databaseClient.getAiCostGuardrailStats({
      since: new Date(new Date().toISOString().slice(0, 10)).toISOString()
    });
  } catch (error) {
    console.warn("[AI_COST_GUARDRAILS_STATS_FAILED]", error?.message || error);
    return {
      site_daily_cost_usd: 0,
      events_today: 0,
      avg_latency_ms: 0,
      avg_quality: 0,
      by_plan: [],
      by_user: []
    };
  }
}

function findCostRow(rows = [], key, field) {
  return (Array.isArray(rows) ? rows : []).find((row) => String(row?.[field] || "").toLowerCase() === String(key || "").toLowerCase()) || null;
}

async function enforceAiProductionGuardrails(user, routing, options = {}) {
  const stats = await getAiCostGuardrailStatsSafe();
  const safeMode = buildSafeModeState(stats);
  const planKey = routing.planKey || getUserPlanKey(user);
  const planLimit = AI_PLAN_DAILY_COST_LIMITS_USD[planKey] ?? 0;
  const planRow = findCostRow(stats.by_plan, planKey, "plan");
  const userRow = findCostRow(stats.by_user, user?.id, "user_id");
  const planStatus = getCostLimitStatus(planRow?.cost_usd || 0, planLimit);
  const userStatus = getCostLimitStatus(userRow?.cost_usd || 0, AI_USER_DAILY_COST_LIMIT_USD);

  routing.costGuardrails = {
    site: safeMode.site_cost,
    plan: planStatus,
    user: userStatus,
    safe_mode: safeMode
  };

  if (planStatus.status === "blocked") {
    throw createPublicHttpError(429, "AI_PLAN_DAILY_COST_LIMIT", "وصلت باقتك إلى حد التكلفة اليومي مؤقتًا. حاول لاحقًا أو تواصل مع الدعم.", {
      plan: planKey,
      used: planStatus.used,
      limit: planStatus.limit
    });
  }

  if (userStatus.status === "blocked") {
    throw createPublicHttpError(429, "AI_USER_DAILY_COST_LIMIT", "وصل حسابك إلى حد التكلفة اليومي مؤقتًا. سنعيد المحاولة بعد إعادة التحديث.", {
      user_id: user?.id || null,
      used: userStatus.used,
      limit: userStatus.limit
    });
  }

  if (safeMode.active) {
    routing.safeModeActive = true;
    routing.safeModeReasons = safeMode.reasons;
    routing.modelProfile.maxContextTokens = Math.min(Number(routing.modelProfile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS), FREE_MAX_CONTEXT_TOKENS);
    routing.modelProfile.maxOutputTokens = Math.min(Number(routing.modelProfile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 500);

    const hasAttachments = Number(options.attachmentCount || 0) > 0;
    const heavy = hasAttachments ||
      options.operation === "image" ||
      routing.intelligence?.needsCreativity ||
      Number(routing.estimatedInputTokens || 0) > 2500;

    if (heavy) {
      throw createPublicHttpError(503, "AI_SAFE_MODE_ACTIVE", "نخفف الضغط على الذكاء الاصطناعي الآن لحماية التجربة. جرّب طلبًا نصيًا أخف أو حاول لاحقًا.", {
        safe_mode: true,
        reasons: safeMode.reasons
      });
    }

    if (planKey === "free") {
      routing.modelKey = "orlixor";
      routing.provider = DEEPSEEK_API_KEY ? "deepseek" : "openai";
      routing.deepseekModel = DEEPSEEK_CHAT_MODEL;
      routing.openaiModel = OPENAI_MODEL_DEFAULT || OPENAI_MODEL;
      routing.modelProfile = buildModelRouterProfile(modelProfiles.orlixor, routing);
      routing.modelProfile.maxContextTokens = Math.min(Number(routing.modelProfile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS), FREE_MAX_CONTEXT_TOKENS);
      routing.modelProfile.maxOutputTokens = Math.min(Number(routing.modelProfile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 500);
    }
  }
}

function buildAiAlerts({ costStats = {}, safeMode = {}, analytics = {} } = {}) {
  const alerts = [];
  const siteStatus = getCostLimitStatus(costStats.site_daily_cost_usd, AI_SITE_DAILY_COST_LIMIT_USD);
  if (siteStatus.status === "warning") {
    alerts.push({ type: "cost_warning", severity: "warning", message: "Site AI cost reached 80% of the daily budget.", data: siteStatus });
  }
  if (siteStatus.status === "blocked" || safeMode.active) {
    alerts.push({ type: "safe_mode", severity: "critical", message: "AI Safe Mode is active.", data: safeMode });
  }
  for (const [plan, limit] of Object.entries(AI_PLAN_DAILY_COST_LIMITS_USD)) {
    const row = findCostRow(costStats.by_plan, plan, "plan");
    const status = getCostLimitStatus(row?.cost_usd || 0, limit);
    if (["warning", "blocked"].includes(status.status)) {
      alerts.push({
        type: "plan_cost_guardrail",
        severity: status.status === "blocked" ? "critical" : "warning",
        message: `${plan} AI cost reached ${Math.round(status.ratio * 100)}% of the daily budget.`,
        data: { plan, ...status }
      });
    }
  }
  const userWarning = (Array.isArray(costStats.by_user) ? costStats.by_user : [])
    .map((row) => ({ row, status: getCostLimitStatus(row.cost_usd || 0, AI_USER_DAILY_COST_LIMIT_USD) }))
    .find((item) => ["warning", "blocked"].includes(item.status.status));
  if (userWarning) {
    alerts.push({
      type: "user_cost_guardrail",
      severity: userWarning.status.status === "blocked" ? "critical" : "warning",
      message: "A user is close to or above the daily AI cost budget.",
      data: { user_id: userWarning.row.user_id, plan: userWarning.row.plan, ...userWarning.status }
    });
  }
  for (const provider of ["deepseek", "openai"]) {
    const health = buildProviderHealth(provider);
    if (["degraded", "not_configured"].includes(health.status)) {
      alerts.push({ type: "api_failure", severity: health.status === "degraded" ? "critical" : "warning", message: `${provider} status is ${health.status}.`, data: health });
    }
  }
  const avgQuality = Number(costStats.avg_quality || analytics.overview?.avg_quality || 0);
  if (avgQuality > 0 && avgQuality < 60) {
    alerts.push({ type: "quality_drop", severity: "warning", message: "Average AI quality dropped below 60%.", data: { avg_quality: avgQuality } });
  }
  const topModel = analytics.overview?.most_used_model;
  if (topModel && Number(topModel.requests || 0) >= 100) {
    alerts.push({ type: "model_pressure", severity: "info", message: "High pressure on a single model.", data: topModel });
  }
  const loginFailures = aiRuntimeState.loginFailures.filter((item) => Date.now() - Number(item.at || 0) <= 15 * 60_000);
  if (loginFailures.length >= 10) {
    alerts.push({ type: "login_errors", severity: "warning", message: "Login errors increased in the last 15 minutes.", data: { count: loginFailures.length } });
  }
  const scaling = buildScalingSnapshot();
  if (scaling.queue_size >= AI_QUEUE_PRESSURE_THRESHOLD || scaling.avg_queue_wait_ms > 1200) {
    alerts.push({ type: "queue_pressure", severity: "warning", message: "AI queue pressure is elevated.", data: scaling });
  }
  return alerts;
}

async function buildAiHealthSnapshot(options = {}) {
  const costStats = await getAiCostGuardrailStatsSafe();
  const analytics = isDatabaseReady() && typeof databaseClient.getAiIntelligenceAnalytics === "function"
    ? await databaseClient.getAiIntelligenceAnalytics({}).catch(() => ({}))
    : {};
  const safeMode = buildSafeModeState(costStats, options);
  const approvedSources = isDatabaseReady() && typeof databaseClient.listKnowledgeSources === "function"
    ? await databaseClient.listKnowledgeSources({ status: "approved", limit: 5 }).catch(() => [])
    : [];
  const dbDriver = databaseState?.driver || "unknown";
  const vectorType = dbDriver.includes("postgres")
    ? (ORLIXOR_ENABLE_EMBEDDINGS ? "postgres_pgvector_or_embedding_ready" : "postgres_keyword_fallback")
    : "fallback_keyword";
  const ragStatus = isDatabaseReady() && typeof databaseClient.listKnowledgeChunks === "function"
    ? "ok"
    : "unavailable";
  const health = {
    generated_at: new Date().toISOString(),
    release: aiOps.buildReleaseDiscipline(process.env),
    ai_versions: aiOps.buildAiVersionManifest(process.env),
    feature_flags: getFeatureFlagsSync(),
    providers: {
      deepseek: buildProviderHealth("deepseek"),
      openai: buildProviderHealth("openai")
    },
    rag: {
      status: ragStatus,
      approved_sources_sample: Array.isArray(approvedSources) ? approvedSources.length : 0,
      last_success_at: aiRuntimeState.rag.last_success_at,
      last_error_at: aiRuntimeState.rag.last_error_at,
      last_error: aiRuntimeState.rag.last_error,
      avg_latency_ms: averageLatency(aiRuntimeState.rag.latency_samples)
    },
    embeddings: {
      enabled: ORLIXOR_ENABLE_EMBEDDINGS,
      configured: Boolean(OPENAI_API_KEY),
      status: ORLIXOR_ENABLE_EMBEDDINGS ? (OPENAI_API_KEY ? "enabled" : "missing_openai_key") : "disabled",
      last_success_at: aiRuntimeState.embeddings.last_success_at,
      last_error_at: aiRuntimeState.embeddings.last_error_at,
      last_error: aiRuntimeState.embeddings.last_error,
      avg_latency_ms: averageLatency(aiRuntimeState.embeddings.latency_samples)
    },
    vector_store: {
      driver: dbDriver,
      type: vectorType,
      status: isDatabaseReady() ? "ok" : "unavailable"
    },
    cost_guardrails: {
      budgets: buildCostBudgets(),
      stats: costStats,
      site: getCostLimitStatus(costStats.site_daily_cost_usd, AI_SITE_DAILY_COST_LIMIT_USD),
      plans: Object.entries(AI_PLAN_DAILY_COST_LIMITS_USD).map(([plan, limit]) => {
        const row = findCostRow(costStats.by_plan, plan, "plan");
        return { plan, ...getCostLimitStatus(row?.cost_usd || 0, limit), requests: Number(row?.requests || 0) };
      })
    },
    safe_mode: safeMode,
    scaling: buildScalingSnapshot(),
    real_scale: realScaleInfra.getStatus(),
    alerts: []
  };
  health.alerts = buildAiAlerts({ costStats, safeMode, analytics });
  return health;
}

function buildEnvLaunchStatus() {
  return {
    DEEPSEEK_API_KEY: { configured: Boolean(DEEPSEEK_API_KEY), secret: true },
    OPENAI_API_KEY: { configured: Boolean(OPENAI_API_KEY), secret: true },
    AI_DAILY_COST_LIMIT: {
      configured: Boolean(process.env.AI_DAILY_COST_LIMIT || process.env.ORLIXOR_AI_SITE_DAILY_COST_LIMIT_USD),
      value_present: AI_SITE_DAILY_COST_LIMIT_USD > 0,
      secret: false
    },
    AI_SAFE_MODE_ENABLED: {
      configured: Boolean(process.env.AI_SAFE_MODE_ENABLED || process.env.ORLIXOR_AI_FORCE_SAFE_MODE),
      enabled: ORLIXOR_AI_FORCE_SAFE_MODE,
      manual_override: aiRuntimeState.safeModeOverride,
      secret: false
    },
    ORLIXOR_ENABLE_EMBEDDINGS: {
      configured: Object.prototype.hasOwnProperty.call(process.env, "ORLIXOR_ENABLE_EMBEDDINGS"),
      enabled: ORLIXOR_ENABLE_EMBEDDINGS,
      secret: false
    },
    DATABASE_URL: {
      configured: Boolean(DATABASE_URL || (DB_HOST && DB_DATABASE && DB_USERNAME)),
      connected: Boolean(databaseState?.connected),
      driver: databaseState?.driver || "unknown",
      secret: true
    },
    SESSION_SECRET: {
      configured: Boolean(SESSION_SECRET),
      accepted_aliases: ["SESSION_SECRET", "JWT_SECRET", "NEXTAUTH_SECRET"],
      secret: true
    }
  };
}

function collectLastAiErrors() {
  const errors = [];
  for (const provider of ["deepseek", "openai"]) {
    const health = buildProviderHealth(provider);
    if (health.last_error) {
      errors.push({
        at: health.last_error_at,
        type: "provider",
        source: provider,
        message: health.last_error
      });
    }
  }
  for (const subsystem of ["rag", "embeddings"]) {
    const state = aiRuntimeState[subsystem] || {};
    if (state.last_error) {
      errors.push({
        at: state.last_error_at,
        type: "subsystem",
        source: subsystem,
        message: state.last_error
      });
    }
  }
  return errors
    .filter((item) => item.message)
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
    .slice(0, 10);
}

function buildLaunchReadiness(health, envStatus) {
  const critical = [];
  const nonCritical = [];
  const recommendations = [];

  if (!envStatus.DEEPSEEK_API_KEY.configured && !envStatus.OPENAI_API_KEY.configured) {
    critical.push("No text AI provider key is configured.");
  }
  if (!envStatus.DATABASE_URL.connected) {
    critical.push("Database is not connected.");
  }
  if (!envStatus.SESSION_SECRET.configured) {
    critical.push("SESSION_SECRET/JWT_SECRET is missing.");
  }
  if (health.rag?.status !== "ok") {
    critical.push("RAG retrieval is unavailable.");
  }
  if (health.cost_guardrails?.site?.status === "blocked") {
    critical.push("Site AI daily cost limit is already exhausted.");
  }
  if (!envStatus.DEEPSEEK_API_KEY.configured) {
    nonCritical.push("DeepSeek key is missing; low-cost routing may fall back to OpenAI.");
  }
  if (!envStatus.OPENAI_API_KEY.configured) {
    nonCritical.push("OpenAI key is missing; images, embeddings, or GPT-4 Mini paths may be unavailable.");
  }
  if (!envStatus.ORLIXOR_ENABLE_EMBEDDINGS.enabled) {
    nonCritical.push("Embeddings are disabled; RAG is using keyword/fallback retrieval.");
  }
  if (health.safe_mode?.active) {
    nonCritical.push("Safe Mode is currently active.");
  }
  if (health.cost_guardrails?.site?.status === "warning") {
    nonCritical.push("AI cost is above 80% of the daily site budget.");
  }

  recommendations.push("Keep Fine-tuning disabled until a reviewed, sanitized dataset exists.");
  recommendations.push("Run a real production smoke test after Render deploy with Free, Spark, Tuwaiq, and Pioneer accounts.");
  recommendations.push("Tune cost limits after the first 24-48 hours of real usage.");
  recommendations.push("Rotate provider keys if they were ever exposed outside Render secrets.");

  return {
    status: critical.length ? "not_ready" : "ready",
    can_open_to_users: critical.length === 0,
    critical_issues: critical,
    non_critical_issues: nonCritical,
    recommendations
  };
}

async function buildAiLaunchMonitorSnapshot() {
  const health = await buildAiHealthSnapshot();
  const env = buildEnvLaunchStatus();
  const analytics = isDatabaseReady() && typeof databaseClient.getAiIntelligenceAnalytics === "function"
    ? await databaseClient.getAiIntelligenceAnalytics({}).catch(() => ({}))
    : {};
  const modelRows = Array.isArray(analytics.model_performance) ? analytics.model_performance : [];
  const highestCostModel = modelRows
    .slice()
    .sort((a, b) => Number(b.total_cost || b.avg_cost || 0) - Number(a.total_cost || a.avg_cost || 0))[0] || null;
  return {
    generated_at: new Date().toISOString(),
    fine_tuning_enabled: false,
    env,
    keys: {
      deepseek_present: env.DEEPSEEK_API_KEY.configured,
      openai_present: env.OPENAI_API_KEY.configured
    },
    rag_working: health.rag?.status === "ok",
    safe_mode: health.safe_mode,
    cost_today_usd: Number(health.cost_guardrails?.site?.used || 0),
    requests_today: Number(health.cost_guardrails?.stats?.events_today || analytics.overview?.messages_today || 0),
    highest_cost_model: highestCostModel,
    last_ai_errors: collectLastAiErrors(),
    alerts: health.alerts || [],
    readiness: buildLaunchReadiness(health, env),
    health
  };
}

function buildEmptyBetaAnalytics() {
  return {
    conversion: {
      free_users: 0,
      paid_users: 0,
      conversion_rate_percent: 0,
      most_purchased_plan: null,
      top_exit_reason: null,
      top_stop_point: null,
      active_users_today: 0,
      avg_messages_per_user: 0
    },
    cost: {
      daily_by_model: [],
      by_plan: [],
      top_users: [],
      avg_cost_per_message_usd: 0,
      avg_tokens_per_user: 0,
      images: [],
      rag: {},
      code: {}
    },
    retention: {
      returning_users: 0,
      avg_session_duration_minutes: 0,
      peak_activity_hour: null,
      last_seen: [],
      returned_after_safe_mode: 0,
      returned_after_limit_exceeded: 0
    },
    quality_trends: {
      daily: [],
      rag_vs_non_rag: [],
      model_dissatisfaction: []
    },
    abuse: {
      total_events: 0,
      by_action: [],
      by_reason: [],
      temporary_blocks: 0,
      cooldowns: 0,
      shadow_limits: 0
    },
    recommendations: []
  };
}

function buildProductionRecommendations(beta = {}, health = {}) {
  const recommendations = [];
  const conversion = beta.conversion || {};
  const cost = beta.cost || {};
  const quality = beta.quality_trends || {};
  const abuse = beta.abuse || {};
  const safeMode = health.safe_mode || {};
  const siteCost = health.cost_guardrails?.site || {};

  if (Number(conversion.free_users || 0) > 20 && Number(conversion.conversion_rate_percent || 0) < 3) {
    recommendations.push({
      type: "monetization",
      priority: "high",
      title: "Improve Free to Paid conversion",
      action: "Show contextual upsell after code/reasoning/image limits, but cap it to one upsell per session."
    });
  }
  const mostCostlyModel = (cost.daily_by_model || [])[0];
  if (mostCostlyModel && Number(mostCostlyModel.cost_usd || 0) > 0 && Number(mostCostlyModel.avg_quality || 0) < 65) {
    recommendations.push({
      type: "model_router",
      priority: "medium",
      title: "Review high-cost low-quality model",
      action: `Reduce routing to ${mostCostlyModel.model_key || "this model"} until quality improves.`
    });
  }
  if (siteCost.status === "warning") {
    recommendations.push({
      type: "cost_guardrail",
      priority: "high",
      title: "Cost reached 80% of budget",
      action: "Enable Safe Mode, reduce context length, and route Free users to DeepSeek Chat only."
    });
  }
  if (safeMode.active) {
    recommendations.push({
      type: "safe_mode",
      priority: "critical",
      title: "Safe Mode is active",
      action: "Inspect top-cost users and disable images/heavy requests until the budget resets."
    });
  }
  const ragTrend = (quality.rag_vs_non_rag || []).find((row) => String(row.rag_used) === "true" || row.rag_used === true);
  if (ragTrend && Number(ragTrend.avg_quality || 0) >= 75) {
    recommendations.push({
      type: "rag",
      priority: "medium",
      title: "RAG improves answer quality",
      action: "Add more approved KB articles for repeated support and billing questions before considering fine-tuning."
    });
  }
  if (Number(abuse.temporary_blocks || 0) > 0 || Number(abuse.cooldowns || 0) > 0) {
    recommendations.push({
      type: "abuse",
      priority: "high",
      title: "Abuse signals detected",
      action: "Keep cooldowns active and inspect prompt-injection/scripted-request patterns in Abuse Detection."
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      type: "launch",
      priority: "normal",
      title: "Beta telemetry is stable",
      action: "Keep collecting one week of real data, then tune limits and model routing based on profit per plan."
    });
  }
  return recommendations.slice(0, 12);
}

async function buildBetaBusinessAnalyticsSnapshot(options = {}) {
  const health = await buildAiHealthSnapshot();
  let beta = buildEmptyBetaAnalytics();
  if (isDatabaseReady() && typeof databaseClient.getBetaBusinessAnalytics === "function") {
    try {
      beta = await databaseClient.getBetaBusinessAnalytics(options);
    } catch (error) {
      console.warn("[BETA_ANALYTICS_FAILED]", error?.message || error);
      beta.error = error?.message || "BETA_ANALYTICS_FAILED";
    }
  }
  beta.recommendations = buildProductionRecommendations(beta, health);
  beta.safe_mode = health.safe_mode;
  beta.cost_guardrails = health.cost_guardrails;
  beta.generated_at = new Date().toISOString();
  beta.fine_tuning_enabled = false;
  beta.privacy = {
    raw_user_data_visible: false,
    secrets_visible: false,
    prompt_storage: "hashed_or_sanitized"
  };
  return beta;
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
    const sanitizedUserMessage = aiIntelligence.sanitizeSensitiveText(payload.userMessage || "");
    const sanitizedAssistantText = aiIntelligence.sanitizeSensitiveText(payload.assistantText || "");
    const safeUserMessage = sanitizedUserMessage.text || String(payload.userMessage || "");
    const safeAssistantText = sanitizedAssistantText.text || String(payload.assistantText || "");

    if (typeof databaseClient.saveUserMemory === "function") {
      for (const entry of inferMemoryEntries(safeUserMessage, safeAssistantText)) {
        await databaseClient.saveUserMemory({
          user_id: payload.user.id,
          memory_type: entry.memory_type,
          content: entry.content,
          importance: entry.importance,
          metadata: {
            privacy_findings: [...new Set([...sanitizedUserMessage.findings, ...sanitizedAssistantText.findings])]
          }
        });
      }
    }

    if (typeof databaseClient.saveMessageEmbedding === "function") {
      const sourceText = `${safeUserMessage}\n${safeAssistantText}`.trim();
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
  const referralCode = sanitizeOptionalText(payload.referral_code || payload.referralCode || payload.ref || "", 32).toUpperCase();

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
    last_daily_xp_granted_at: new Date().toISOString(),
    signup_bonus_claimed: true,
    status: "active",
    activity: "أنشأ حسابًا جديدًا"
  });

  const token = await issueAuthToken(user, deviceName);
  setAuthCookie(res, token);
  req.__businessContext = {
    user,
    plan: getUserPlanKey(user),
    route: "/api/auth/register",
    operation: "register"
  };
  recordBusinessEventSafe(req, {
    event_type: "signup",
    reason: "email_password",
    plan: getUserPlanKey(user),
    metadata: {
      referral_code_present: Boolean(referralCode)
    }
  });
  if (referralCode && typeof databaseClient.recordReferralSignup === "function") {
    const referral = await databaseClient.recordReferralSignup({
      referral_code: referralCode,
      referred_user_id: user.id,
      metadata: {
        route: "/api/auth/register",
        request_id: req.__requestId || null
      }
    });
    if (referral) {
      recordBusinessEventSafe(req, {
        event_type: "referral_signup",
        reason: "referral_code",
        plan: getUserPlanKey(user),
        metadata: {
          referral_id: referral.id,
          referrer_user_id: referral.referrer_user_id
        }
      });
    }
  }

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

  let user = null;
  try {
    user = await databaseClient.findUserByEmail(email);
  } catch (error) {
    console.error("LOGIN_ERROR", {
      provider: "password",
      status: 503,
      message: error?.message || String(error || ""),
      code: "AUTH_LOOKUP_FAILED"
    });
    recordLoginFailure("AUTH_LOOKUP_FAILED", 503);
    recordBusinessEventSafe(req, { event_type: "login_failure", reason: "AUTH_LOOKUP_FAILED", route: "/api/auth/login" });
    console.error("[mullem] login user lookup failed", {
      request_id: req.__requestId,
      email,
      message: error?.message || String(error || ""),
      stack: error?.stack
    });
    throw createPublicHttpError(503, "AUTH_SERVICE_UNAVAILABLE", "حدث خطأ في الخادم، حاول لاحقًا.", {
      provider: "password"
    });
  }
  if (!user) {
    console.error("LOGIN_ERROR", {
      provider: "password",
      status: 404,
      message: "Account not found",
      code: "ACCOUNT_NOT_FOUND"
    });
    recordLoginFailure("ACCOUNT_NOT_FOUND", 404);
    recordBusinessEventSafe(req, { event_type: "login_failure", reason: "ACCOUNT_NOT_FOUND", route: "/api/auth/login" });
    throw createPublicHttpError(404, "ACCOUNT_NOT_FOUND", "الحساب غير موجود.", {
      provider: "password"
    });
  }
  if (!verifyPassword(password, user.password_hash)) {
    console.error("LOGIN_ERROR", {
      provider: "password",
      status: 401,
      message: "Wrong password",
      code: "WRONG_PASSWORD"
    });
    recordLoginFailure("WRONG_PASSWORD", 401);
    recordBusinessEventSafe(req, { event_type: "login_failure", reason: "WRONG_PASSWORD", route: "/api/auth/login" });
    throw createPublicHttpError(401, "WRONG_PASSWORD", "كلمة المرور خاطئة.", {
      provider: "password"
    });
  }

  const normalizedStatus = normalizeUserStatus(user.status);
  if (normalizedStatus === "banned") {
    console.error("LOGIN_ERROR", {
      provider: "password",
      status: 403,
      message: "Account banned",
      code: "ACCOUNT_BANNED"
    });
    recordLoginFailure("ACCOUNT_BANNED", 403);
    recordBusinessEventSafe(req, { event_type: "login_failure", reason: "ACCOUNT_BANNED", route: "/api/auth/login" });
    throw createPublicHttpError(403, "ACCOUNT_BANNED", "هذا الحساب محظور.", {
      provider: "password"
    });
  }
  if (normalizedStatus === "suspended") {
    console.error("LOGIN_ERROR", {
      provider: "password",
      status: 403,
      message: "Account suspended",
      code: "ACCOUNT_SUSPENDED"
    });
    recordLoginFailure("ACCOUNT_SUSPENDED", 403);
    recordBusinessEventSafe(req, { event_type: "login_failure", reason: "ACCOUNT_SUSPENDED", route: "/api/auth/login" });
    throw createPublicHttpError(403, "ACCOUNT_SUSPENDED", "هذا الحساب موقوف مؤقتًا.", {
      provider: "password"
    });
  }

  const updatedUser = await syncUserDailyProgressSafely(user, "تم تسجيل الدخول عبر الخادم");

  req.__businessContext = {
    user: updatedUser || user,
    plan: getUserPlanKey(updatedUser || user),
    route: "/api/auth/login",
    operation: "login"
  };
  recordBusinessEventSafe(req, {
    event_type: "login_success",
    reason: "password",
    plan: getUserPlanKey(updatedUser || user),
    metadata: { device_name: deviceName }
  });

  const token = await issueAuthToken(updatedUser || user, deviceName);
  setAuthCookie(res, token);
  if (userHasPermission(updatedUser || user, "admin:read")) {
    try {
      await recordAdminAction(req, { user: updatedUser || user }, "ADMIN_LOGIN", "admin", (updatedUser || user).id, {
        deviceName
      });
    } catch (error) {
      console.warn("[mullem] admin login log skipped:", error?.message || error);
    }
  }

  let recentConversations = [];
  try {
    if (typeof databaseClient.listUserConversations === "function") {
      recentConversations = await databaseClient.listUserConversations((updatedUser || user).id, {
        limit: 100
      });
    }
  } catch (error) {
    console.warn("[mullem] login conversations preload skipped:", error?.message || error);
  }

  const apiUser = buildApiUser(updatedUser || user);
  const dailyReward = buildDailyRewardPayload(apiUser || updatedUser || user);

  sendJson(req, res, 200, {
    success: true,
    ok: true,
    user: apiUser,
    balance: apiUser?.balance ?? 0,
    dailyReward,
    data: {
      token,
      user: apiUser,
      balance: apiUser?.balance ?? 0,
      dailyReward,
      nextDailyRewardAt: dailyReward.nextRewardAt,
      nextDailyRewardInMs: dailyReward.nextRewardInMs,
      recent_conversations: recentConversations.map(buildConversationSummary).filter(Boolean)
    }
  });
}

async function handleAuthMe(req, res) {
  const auth = await requireAuthenticatedUser(req);
  {
    const syncedUser = await syncUserDailyProgressSafely(auth.user, "SESSION_REFRESH");
    let effectiveUser = syncedUser || auth.user;
    if (effectiveUser?.id && !effectiveUser.referral_code && typeof databaseClient.ensureReferralCodeForUser === "function") {
      await databaseClient.ensureReferralCodeForUser(effectiveUser.id).catch(() => null);
      effectiveUser = await databaseClient.findUserById(effectiveUser.id).catch(() => effectiveUser) || effectiveUser;
    }
    const apiUser = buildApiUser(effectiveUser);
    const dailyReward = buildDailyRewardPayload(apiUser || syncedUser || auth.user);
    sendJson(req, res, 200, {
      success: true,
      ok: true,
      user: apiUser,
      balance: apiUser?.balance ?? 0,
      dailyReward,
      data: {
        user: apiUser,
        balance: apiUser?.balance ?? 0,
        dailyReward,
        nextDailyRewardAt: dailyReward.nextRewardAt,
        nextDailyRewardInMs: dailyReward.nextRewardInMs
      }
    });
    return;
  }
  const syncedUser = await syncUserDailyProgressSafely(auth.user, "تم تحديث جلسة المستخدم");
  sendJson(req, res, 200, {
    success: true,
    ok: true,
    data: {
      user: buildApiUser(syncedUser || auth.user),
      nextDailyRewardInMs: 0
    }
  });
}

async function handleBalance(req, res) {
  try {
    const auth = await requireAuthenticatedUser(req);
    const user = typeof databaseClient.findUserById === "function"
      ? (await databaseClient.findUserById(auth.user.id)) || auth.user
      : auth.user;

    const balance = getUserBalanceValue(user);

    sendJson(req, res, 200, {
      success: true,
      ok: true,
      balance
    });
  } catch (error) {
    console.error("BALANCE_ERROR", {
      message: error?.message,
      stack: error?.stack
    });

    const statusCode = Number(error?.statusCode) || 500;
    sendJson(req, res, statusCode, {
      ok: false,
      success: false,
      error: "BALANCE_ERROR",
      message: error?.message || "Unknown error"
    });
  }
}

async function handleDailyRewardStatus(req, res) {
  const auth = await requireAuthenticatedUser(req);
  let user = typeof databaseClient.findUserById === "function"
    ? (await databaseClient.findUserById(auth.user.id)) || auth.user
    : auth.user;
  let state = getDailyRewardState(user);

  if (state.correctedLastClaimedAt && typeof databaseClient.updateUser === "function") {
    user = await databaseClient.updateUser(user.id, {
      last_daily_reward_claimed_at: state.correctedLastClaimedAt,
      last_daily_reward_at: state.correctedLastClaimedAt,
      last_daily_xp_granted_at: state.correctedLastClaimedAt
    }) || user;
    state = getDailyRewardState(user);
  }

  const rewardAmount = Number(getUserDailyRewardAmount(user) || 0);
  const balance = Number(getUserBalanceValue(user) || 0);
  const plan = getRewardPlan(user);

  sendJson(req, res, 200, {
    ok: true,
    balance,
    rewardAmount,
    plan: String(plan || "free"),
    remainingMs: Number(state.remainingMs || 0),
    canClaim: Boolean(state.canClaim),
    nextClaimAt: state.nextClaimAt || null
  });
}

async function handleRewardClaim(req, res) {
  try {
    console.log("REWARD_CLAIM_HIT", {
      userId: null,
      hasAuthorization: Boolean(req.headers.authorization),
      hasCookie: Boolean(req.headers.cookie),
      time: new Date().toISOString()
    });

    requireDatabaseConnection();
    const auth = await getAuthContext(req);

    console.log("REWARD_CLAIM_AUTH", {
      userId: auth?.user?.id || null,
      hasUser: Boolean(auth?.user),
      time: new Date().toISOString()
    });

    if (!auth?.user?.id) {
      sendJson(req, res, 401, {
        ok: false,
        error: "AUTH_REQUIRED",
        message: "User is not authenticated"
      });
      return;
    }

    let user = typeof databaseClient.findUserById === "function"
      ? (await databaseClient.findUserById(auth.user.id)) || auth.user
      : auth.user;

    user = await ensureUserPackageLifecycle(user) || user;
    const rewardAmount = Math.max(0, Number(getUserDailyRewardAmount(user) || 0));
    let claimResult = null;

    if (typeof databaseClient.claimDailyReward === "function") {
      claimResult = await databaseClient.claimDailyReward(user.id, {
        rewardAmount,
        intervalMs: DAILY_REWARD_INTERVAL_MS,
        reason: "Daily reward claim"
      });
    } else if (typeof databaseClient.updateUser === "function") {
      const state = getDailyRewardState(user);
      if (state.correctedLastClaimedAt) {
        user = await databaseClient.updateUser(user.id, {
          last_daily_reward_claimed_at: state.correctedLastClaimedAt,
          last_daily_reward_at: state.correctedLastClaimedAt,
          last_daily_xp_granted_at: state.correctedLastClaimedAt
        }) || user;
      } else if (state.canClaim) {
        const nowIso = new Date().toISOString();
        const nextBalance = getUserBalanceValue(user) + rewardAmount;
        user = await databaseClient.updateUser(user.id, {
          balance: nextBalance,
          xp: nextBalance,
          total_xp: nextBalance,
          daily_reward_amount: rewardAmount,
          last_daily_reward_claimed_at: nowIso,
          last_daily_reward_at: nowIso,
          last_daily_xp_granted_at: nowIso,
          last_daily_xp_claimed_date: nowIso.slice(0, 10)
        }) || {
          ...user,
          balance: nextBalance,
          xp: nextBalance,
          total_xp: nextBalance,
          daily_reward_amount: rewardAmount,
          last_daily_reward_claimed_at: nowIso,
          last_daily_reward_at: nowIso,
          last_daily_xp_granted_at: nowIso,
          last_daily_xp_claimed_date: nowIso.slice(0, 10)
        };
        claimResult = {
          user,
          claimed: true,
          added: rewardAmount,
          balance: nextBalance
        };
      }
    }

    const claimed = Boolean(claimResult?.claimed);
    const effectiveUser = claimResult?.user || (
      typeof databaseClient.findUserById === "function"
        ? (await databaseClient.findUserById(user.id)) || user
        : user
    );
    const nextState = getDailyRewardState(effectiveUser);
    const remainingMs = claimed
      ? Math.max(1000, DAILY_REWARD_INTERVAL_MS)
      : Math.max(1000, Number(nextState.remainingMs || 0));
    const nextClaimAt = nextState.nextClaimAt
      || new Date(Date.now() + remainingMs).toISOString();
    const lastClaimedAt = nextState.lastClaimedAt
      || getUserLastDailyRewardClaimedAt(effectiveUser)
      || null;
    const finalRewardAmount = Math.max(0, Number(getUserDailyRewardAmount(effectiveUser) || rewardAmount || 0));
    const balance = Number(claimResult?.balance ?? getUserBalanceValue(effectiveUser) ?? 0);

    sendJson(req, res, 200, {
      ok: true,
      claimed,
      added: claimed ? finalRewardAmount : 0,
      balance: Number.isFinite(balance) ? Math.max(0, balance) : 0,
      plan: String(getRewardPlan(effectiveUser) || "free"),
      packageKey: String(effectiveUser.package_key || effectiveUser.packageKey || effectiveUser.plan_type || ""),
      packageName: String(effectiveUser.package_name || effectiveUser.packageName || effectiveUser.package || ""),
      rewardAmount: Number(finalRewardAmount || 0),
      lastClaimedAt: lastClaimedAt ? new Date(lastClaimedAt).toISOString() : null,
      nextClaimAt,
      remainingMs: Number(remainingMs || 0)
    });
  } catch (error) {
    console.error("REWARD_CLAIM_ERROR_FULL", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code
    });

    sendJson(req, res, error?.statusCode || error?.status || 500, {
      ok: false,
      error: "REWARD_CLAIM_FAILED",
      message: error?.message || "Unknown server error",
      code: error?.code || null
    });
  }
}

async function handleLogout(req, res) {
  const auth = await getAuthContext(req);
  if (auth?.tokenHash && isDatabaseReady()) {
    await databaseClient.revokeApiToken(auth.tokenHash);
  }

  clearAuthCookie(res);
  sendJson(req, res, 200, {
    success: true,
    message: "Logged out successfully."
  });
}

function sanitizeDownloadFileName(value, fallback = "orlixor-file.pdf") {
  const name = String(value || fallback)
    .replace(/[\\/:*?"<>|\r\n]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return name || fallback;
}

function sendBinaryDownload(req, res, statusCode, buffer, fileName, contentType = "application/octet-stream") {
  setSecurityHeaders(req, res);
  setCorsHeaders(req, res);
  const safeName = sanitizeDownloadFileName(fileName);
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": buffer.length,
    "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
  });
  res.end(buffer);
}

async function safeDeleteFile(filePath) {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch (_) {
    // Temporary file already gone.
  }
}

async function ensurePdfToolTmpDir() {
  await fs.promises.mkdir(PDF_TOOL_TMP_DIR, { recursive: true });
}

function normalizePdfToolMode(value) {
  const mode = String(value || "").trim();
  if (["remove", "reset", "forgot_password_remove"].includes(mode)) return mode;
  return "";
}

function normalizePdfToolReason(value) {
  const reason = String(value || "").trim();
  return ["forgot_password", "update_protection", "personal_file"].includes(reason) ? reason : "";
}

function getPdfOutputFileName(originalName, mode) {
  const base = sanitizeDownloadFileName(String(originalName || "orlixor-document.pdf").replace(/\.pdf$/i, ""), "orlixor-document");
  if (mode === "reset") return `${base}-protected.pdf`;
  return `${base}-unlocked.pdf`;
}

async function runQpdf(args) {
  try {
    await execFileAsync(QPDF_BINARY, args, {
      windowsHide: true,
      timeout: 60_000,
      maxBuffer: 1024 * 1024
    });
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw createHttpError(503, "خدمة معالجة PDF غير مفعّلة على السيرفر. ثبّت qpdf ثم أعد المحاولة.");
    }
    const message = String(error?.stderr || error?.message || "");
    if (/invalid password|password|encrypted|decrypt/i.test(message)) {
      throw createHttpError(400, "تعذر إزالة الحماية. تأكد من كلمة المرور الحالية. هذه الأداة لا تكسر أو تخمّن كلمات المرور.");
    }
    throw createHttpError(400, "تعذر معالجة الملف. تأكد من صلاحية ملف PDF وحاول مرة أخرى.");
  }
}

async function decryptPdfWithQpdf({ inputPath, outputPath, password }) {
  const args = [];
  if (password) args.push(`--password=${password}`);
  args.push("--decrypt", inputPath, outputPath);
  await runQpdf(args);
}

async function encryptPdfWithQpdf({ inputPath, outputPath, password }) {
  await runQpdf([
    "--encrypt",
    password,
    password,
    "256",
    "--",
    inputPath,
    outputPath
  ]);
}

async function handlePdfRemoveProtection(req, res) {
  const auth = await requireSubscriberToolUser(req);
  const { fields, files } = await parseMultipartFormData(req, {
    maxBytes: PDF_PROTECTION_MAX_FILE_SIZE + 1024 * 1024,
    maxFileBytes: PDF_PROTECTION_MAX_FILE_SIZE
  });

  const uploadedFile = files.file;
  const mode = normalizePdfToolMode(fields.mode);
  const reason = normalizePdfToolReason(fields.reason);
  const ownershipConfirmed = String(fields.ownershipConfirmed || "").trim() === "true";
  const legalAgreement = String(fields.legalAgreement || fields.ownershipConfirmed || "").trim() === "true";
  const currentPassword = String(fields.currentPassword || "");
  const newPassword = String(fields.newPassword || "");

  if (!uploadedFile) {
    throw createHttpError(400, "لم يتم رفع ملف PDF.");
  }
  if (uploadedFile.mimetype && uploadedFile.mimetype !== "application/pdf" && !/\.pdf$/i.test(uploadedFile.filename)) {
    throw createHttpError(400, "الملف يجب أن يكون PDF.");
  }
  if (!mode) {
    throw createHttpError(400, "اختر طريقة إزالة الحماية.");
  }
  if (!ownershipConfirmed || !legalAgreement) {
    throw createHttpError(400, "يجب تأكيد الملكية والموافقة على التعهد.");
  }
  if (!reason) {
    throw createHttpError(400, "اختر سبب الاستخدام.");
  }
  if (mode === "forgot_password_remove" && reason !== "forgot_password") {
    throw createHttpError(400, "خيار نسيان كلمة المرور يتطلب اختيار سبب: نسيت كلمة المرور.");
  }
  if ((mode === "remove" || mode === "reset") && !currentPassword) {
    throw createHttpError(400, "أدخل كلمة المرور الحالية للملف.");
  }
  if (mode === "reset" && newPassword.length < 6) {
    throw createHttpError(400, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.");
  }

  await ensurePdfToolTmpDir();
  const requestId = crypto.randomUUID();
  const inputPath = path.join(PDF_TOOL_TMP_DIR, `${requestId}-input.pdf`);
  const outputPath = path.join(PDF_TOOL_TMP_DIR, `${requestId}-output.pdf`);
  const tempUnlockedPath = path.join(PDF_TOOL_TMP_DIR, `${requestId}-unlocked.pdf`);

  try {
    await fs.promises.writeFile(inputPath, uploadedFile.buffer, { flag: "wx" });

    if (mode === "reset") {
      await decryptPdfWithQpdf({
        inputPath,
        outputPath: tempUnlockedPath,
        password: currentPassword
      });
      await encryptPdfWithQpdf({
        inputPath: tempUnlockedPath,
        outputPath,
        password: newPassword
      });
    } else {
      await decryptPdfWithQpdf({
        inputPath,
        outputPath,
        password: mode === "forgot_password_remove" ? "" : currentPassword
      });
    }

    const outputBuffer = await fs.promises.readFile(outputPath);
    await recordToolUsageEvent(req, auth, "pdf_remove_protection", mode, {
      mode,
      reason,
      fileSize: uploadedFile.size,
      outputSize: outputBuffer.length,
      ownershipConfirmed: true
    });

    sendBinaryDownload(req, res, 200, outputBuffer, getPdfOutputFileName(uploadedFile.filename, mode), "application/pdf");
  } catch (error) {
    if (error?.statusCode) throw error;
    throw createHttpError(400, "تعذر حذف كلمة المرور بدون كلمة المرور الحالية. هذه الأداة لا تقوم بكسر أو تخمين كلمات المرور.");
  } finally {
    await safeDeleteFile(inputPath);
    await safeDeleteFile(outputPath);
    await safeDeleteFile(tempUnlockedPath);
  }
}

async function handleStudentDashboard(req, res) {
  const auth = await requireAuthenticatedUser(req);
  ensureDatabaseFeatureAvailable("لوحة الطالب");
  const syncedUser = await syncUserDailyProgressSafely(auth.user, "زار لوحة الطالب");
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
    ? await syncUserDailyProgressSafely(auth.user, "زار صفحة الباقات")
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

async function handleNotifications(req, res) {
  const auth = await requireAuthenticatedUser(req);
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const syncedUser = await syncUserDailyProgressSafely(auth.user, "فتح الإشعارات");
  const unreadOnly = url.searchParams.get("tab") === "unread" || url.searchParams.get("unread") === "1";
  const limit = Math.max(1, Math.min(80, Number(url.searchParams.get("limit") || 20) || 20));
  const notifications = await databaseClient.listNotificationsForUser(syncedUser || auth.user, {
    unreadOnly,
    limit
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      user: buildApiUser(syncedUser || auth.user),
      ...notifications
    }
  });
}

async function handleMarkNotificationRead(req, res, notificationId) {
  const auth = await requireAuthenticatedUser(req);
  const syncedUser = await syncUserDailyProgressSafely(auth.user, "قراءة إشعار");
  const visibleNotifications = await databaseClient.listNotificationsForUser(syncedUser || auth.user, { limit: 80 });
  const canReadNotification = visibleNotifications.items.some((item) => String(item.id) === String(notificationId));
  if (!canReadNotification) {
    throw createHttpError(404, "Notification was not found.");
  }
  await databaseClient.markNotificationAsRead(auth.user.id, notificationId);
  const notifications = await databaseClient.listNotificationsForUser(syncedUser || auth.user, { limit: 20 });

  sendJson(req, res, 200, {
    success: true,
    data: {
      user: buildApiUser(syncedUser || auth.user),
      ...notifications
    }
  });
}

async function handleMarkAllNotificationsRead(req, res) {
  const auth = await requireAuthenticatedUser(req);
  const syncedUser = await syncUserDailyProgressSafely(auth.user, "قراءة كل الإشعارات");
  const result = await databaseClient.markAllNotificationsAsRead(syncedUser || auth.user);
  const notifications = await databaseClient.listNotificationsForUser(syncedUser || auth.user, { limit: 20 });

  sendJson(req, res, 200, {
    success: true,
    data: {
      user: buildApiUser(syncedUser || auth.user),
      markedCount: Number(result?.markedCount || 0),
      ...notifications
    }
  });
}

const ADMIN_NOTIFICATION_TYPES = new Set(["xp_discount", "official_update", "feature_update", "account"]);
const ADMIN_NOTIFICATION_ICONS = new Set(["gift", "megaphone", "sparkle", "bell", "document", "image"]);
const ADMIN_NOTIFICATION_PLANS = new Set(["all", "free", "starter", "spark", "tuwaiq", "pioneer", "business", "pro", "pro_plus", "pro_max"]);

function buildApiNotification(item = {}) {
  return {
    id: String(item.id),
    title: String(item.title || "").trim(),
    body: String(item.body || "").trim(),
    type: String(item.type || "").trim(),
    badge: String(item.badge || "").trim(),
    icon: String(item.icon || "").trim(),
    target_plan: String(item.target_plan || "all").trim(),
    target_user_id: item.target_user_id != null ? String(item.target_user_id) : null,
    action_url: String(item.action_url || "").trim() || null,
    starts_at: item.starts_at || null,
    expires_at: item.expires_at || null,
    is_active: item.is_active == null ? true : Boolean(item.is_active),
    created_at: item.created_at || null,
    updated_at: item.updated_at || null
  };
}

const TOOL_SUGGESTION_CATEGORIES = new Set([
  "الأكثر استخدامًا",
  "كتابة وتحرير",
  "تلخيص وتنظيم",
  "تحليل وبيانات",
  "إنتاجية",
  "تعليم وتعلم",
  "أدوات مجانية",
  "أدوات مرئية",
  "PDF وملفات",
  "أخرى"
]);
const TOOL_SUGGESTION_STATUSES = new Set(["pending", "reviewing", "approved", "rejected", "implemented"]);

function buildApiToolSuggestion(item = {}) {
  return {
    id: String(item.id || ""),
    title: String(item.title || "").trim(),
    normalized_title: String(item.normalized_title || "").trim(),
    category: String(item.category || "").trim(),
    description: String(item.description || "").trim(),
    use_case: String(item.use_case || item.useCase || "").trim(),
    extra_notes: String(item.extra_notes || item.extraNotes || "").trim(),
    importance: Math.max(1, Math.min(5, Number(item.importance || 3))),
    attachment_name: String(item.attachment_name || item.attachmentName || "").trim(),
    attachment_data_url: String(item.attachment_data_url || item.attachmentDataUrl || "").trim(),
    status: String(item.status || "pending").trim(),
    votes_count: Number(item.votes_count || 0),
    created_by: item.created_by != null ? String(item.created_by) : null,
    created_by_name: String(item.created_by_name || "").trim(),
    created_by_email: String(item.created_by_email || "").trim(),
    approved_by: item.approved_by != null ? String(item.approved_by) : null,
    approved_by_name: String(item.approved_by_name || "").trim(),
    approved_at: item.approved_at || null,
    implemented_at: item.implemented_at || null,
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
    voters: Array.isArray(item.voters) ? item.voters.map((vote) => ({
      user_id: vote?.user_id != null ? String(vote.user_id) : "",
      vote_type: String(vote?.vote_type || "").trim(),
      created_at: vote?.created_at || null,
      name: String(vote?.name || "").trim(),
      email: String(vote?.email || "").trim()
    })) : []
  };
}

function normalizeToolSuggestionPayload(payload = {}) {
  const title = requireTextField(payload.title, "title", 180);
  const categoryText = requireTextField(payload.category, "category", 120);
  const category = TOOL_SUGGESTION_CATEGORIES.has(categoryText) ? categoryText : categoryText.slice(0, 120);
  const description = requireTextField(payload.description, "description", 1800);
  const useCase = requireTextField(payload.useCase || payload.use_case, "useCase", 1800);
  const importance = Math.max(1, Math.min(5, Math.round(Number(payload.importance || 3) || 3)));
  const attachmentName = sanitizeOptionalText(payload.attachmentName || payload.attachment_name, 180);
  const attachmentDataUrl = String(payload.attachmentDataUrl || payload.attachment_data_url || "").trim();
  if (attachmentDataUrl && !/^data:image\/(?:png|jpe?g|webp);base64,/i.test(attachmentDataUrl)) {
    throw createHttpError(422, "صورة الاقتراح يجب أن تكون PNG أو JPG أو WebP.");
  }
  if (attachmentDataUrl && attachmentDataUrl.length > 7000000) {
    throw createHttpError(413, "صورة الاقتراح كبيرة جدًا.");
  }

  return {
    title,
    category,
    description,
    useCase,
    extraNotes: sanitizeOptionalText(payload.extraNotes || payload.extra_notes, 1400),
    importance,
    attachmentName,
    attachmentDataUrl
  };
}

async function handleSubmitToolSuggestion(req, res) {
  requireDatabaseConnection();
  const auth = await requireAuthenticatedUser(req);
  const payload = normalizeToolSuggestionPayload(await parseJsonBody(req));
  if (typeof databaseClient.submitToolSuggestion !== "function") {
    throw createHttpError(501, "Tool suggestions are not available.");
  }

  const result = await databaseClient.submitToolSuggestion(auth.user.id, payload);
  if (result?.type === "rate_limited") {
    throw createHttpError(429, result.message || "وصلت للحد اليومي من الاقتراحات.");
  }

  sendJson(req, res, result?.type === "created" ? 201 : 200, {
    success: true,
    data: {
      type: result?.type || "created",
      message: result?.message || "تم إرسال اقتراحك بنجاح.",
      suggestion: buildApiToolSuggestion(result?.suggestion || {})
    }
  });
}

async function handleAdminToolSuggestions(req, res) {
  await requireAdminUser(req);
  if (typeof databaseClient.listAdminToolSuggestions !== "function") {
    throw createHttpError(501, "Tool suggestions are not available.");
  }
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const status = sanitizeOptionalText(url.searchParams.get("status"), 40);
  const items = await databaseClient.listAdminToolSuggestions({
    status: TOOL_SUGGESTION_STATUSES.has(status) ? status : "",
    limit: Math.max(1, Math.min(300, Number(url.searchParams.get("limit") || 150) || 150))
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      items: items.map(buildApiToolSuggestion)
    }
  });
}

async function handleAdminUpdateToolSuggestionStatus(req, res, suggestionId, forcedStatus = "") {
  const auth = await requireAdminUser(req);
  if (typeof databaseClient.updateToolSuggestionStatus !== "function") {
    throw createHttpError(501, "Tool suggestions are not available.");
  }
  const payload = await parseJsonBody(req);
  const status = String(forcedStatus || payload.status || "").trim().toLowerCase();
  if (!TOOL_SUGGESTION_STATUSES.has(status)) {
    throw createHttpError(422, "حالة الاقتراح غير صحيحة.");
  }

  let result = null;
  if (status === "implemented") {
    result = await databaseClient.markToolSuggestionImplemented({
      suggestion_id: suggestionId,
      admin_id: auth.user.id
    });
    if (!result?.suggestion) {
      throw createHttpError(404, "Tool suggestion was not found.");
    }
    await recordAdminAction(req, auth, "IMPLEMENT_TOOL_SUGGESTION", "tool_suggestion", suggestionId, {
      rewardedUsers: result.rewardedUsers,
      xpPerUser: result.xpPerUser
    });
    sendJson(req, res, 200, {
      success: true,
      data: {
        item: buildApiToolSuggestion(result.suggestion),
        rewardedUsers: result.rewardedUsers,
        xpPerUser: result.xpPerUser
      }
    });
    return;
  }

  const item = await databaseClient.updateToolSuggestionStatus({
    suggestion_id: suggestionId,
    admin_id: auth.user.id,
    status
  });
  if (!item) {
    throw createHttpError(404, "Tool suggestion was not found.");
  }
  await recordAdminAction(req, auth, `${status.toUpperCase()}_TOOL_SUGGESTION`, "tool_suggestion", suggestionId, { status });

  sendJson(req, res, 200, {
    success: true,
    data: {
      item: buildApiToolSuggestion(item)
    }
  });
}

function parseOptionalFutureDate(value, fieldName) {
  const text = sanitizeOptionalText(value, 80);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw createHttpError(422, `${fieldName} must be a valid date.`);
  }
  return date.toISOString();
}

function normalizeAdminNotificationPayload(payload = {}, partial = false) {
  const normalized = {};

  if (!partial || "title" in payload) {
    normalized.title = requireTextField(payload.title, "title", 180);
  }

  if (!partial || "body" in payload) {
    normalized.body = requireTextField(payload.body, "body", 1200);
  }

  if (!partial || "type" in payload) {
    const type = sanitizeOptionalText(payload.type, 40) || "official_update";
    if (!ADMIN_NOTIFICATION_TYPES.has(type)) {
      throw createHttpError(422, "Notification type is not supported.");
    }
    normalized.type = type;
  }

  if (!partial || "badge" in payload) {
    normalized.badge = sanitizeOptionalText(payload.badge, 80) || null;
  }

  if (!partial || "icon" in payload) {
    const icon = sanitizeOptionalText(payload.icon, 40) || "sparkle";
    normalized.icon = ADMIN_NOTIFICATION_ICONS.has(icon) ? icon : "sparkle";
  }

  if (!partial || "target_plan" in payload || "targetPlan" in payload) {
    const targetPlan = sanitizeOptionalText(payload.target_plan || payload.targetPlan, 80) || "all";
    normalized.target_plan = ADMIN_NOTIFICATION_PLANS.has(targetPlan) ? targetPlan : "all";
  }

  if ("target_user_id" in payload || "targetUserId" in payload) {
    const targetUserId = Number(payload.target_user_id || payload.targetUserId);
    normalized.target_user_id = Number.isFinite(targetUserId) && targetUserId > 0 ? Math.round(targetUserId) : null;
  } else if (!partial) {
    normalized.target_user_id = null;
  }

  if (!partial || "action_url" in payload || "actionUrl" in payload) {
    normalized.action_url = sanitizeOptionalText(payload.action_url || payload.actionUrl, 400) || null;
  }

  if (!partial || "starts_at" in payload || "startsAt" in payload) {
    normalized.starts_at = parseOptionalFutureDate(payload.starts_at || payload.startsAt, "starts_at") || new Date().toISOString();
  }

  if (!partial || "expires_at" in payload || "expiresAt" in payload) {
    normalized.expires_at = parseOptionalFutureDate(payload.expires_at || payload.expiresAt, "expires_at");
  }

  if (!partial || "is_active" in payload || "isActive" in payload) {
    normalized.is_active = payload.is_active == null && payload.isActive == null
      ? true
      : Boolean(payload.is_active ?? payload.isActive);
  }

  return normalized;
}

async function handleAdminNotifications(req, res) {
  await requireAdminUser(req);
  if (typeof databaseClient.listAdminNotifications !== "function") {
    throw createHttpError(501, "Admin notifications are not available.");
  }
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const items = await databaseClient.listAdminNotifications({
    limit: Math.max(1, Math.min(Number(url.searchParams.get("limit") || 80), 200)),
    includeInactive: url.searchParams.get("include_inactive") !== "0"
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      items: items.map(buildApiNotification)
    }
  });
}

async function handleAdminCreateNotification(req, res) {
  const auth = await requireAdminUser(req);
  if (typeof databaseClient.createNotification !== "function") {
    throw createHttpError(501, "Admin notifications are not available.");
  }
  const payload = normalizeAdminNotificationPayload(await parseJsonBody(req));
  const item = await databaseClient.createNotification(payload);
  await recordAdminAction(req, auth, "CREATE_NOTIFICATION", "notification", item?.id || "", {
    before: null,
    after: item,
    input: payload
  });

  sendJson(req, res, 201, {
    success: true,
    data: {
      item: buildApiNotification(item)
    }
  });
}

async function handleAdminUpdateNotification(req, res, notificationId) {
  const auth = await requireAdminUser(req);
  if (typeof databaseClient.updateNotification !== "function") {
    throw createHttpError(501, "Admin notifications are not available.");
  }
  const before = typeof databaseClient.listAdminNotifications === "function"
    ? (await databaseClient.listAdminNotifications({ limit: 500 })).find((item) => String(item.id) === String(notificationId)) || null
    : null;
  const payload = normalizeAdminNotificationPayload(await parseJsonBody(req), true);
  const item = await databaseClient.updateNotification(notificationId, payload);
  if (!item) {
    throw createHttpError(404, "Notification was not found.");
  }
  await recordAdminAction(req, auth, "UPDATE_NOTIFICATION", "notification", notificationId, {
    before,
    after: item,
    changes: payload
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      item: buildApiNotification(item)
    }
  });
}

async function handleAdminStats(req, res) {
  const auth = await requireAdminUser(req);
  const stats = await databaseClient.getAdminStats();
  sendJson(req, res, 200, {
    success: true,
    data: {
      admin: buildApiUser(auth.user),
      stats
    }
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
  const auth = await requireAdminUser(req);
  const payload = await parseJsonBody(req);
  const changes = {};
  const before = typeof databaseClient.listPackages === "function"
    ? (await databaseClient.listPackages({ include_inactive: true })).find((item) => String(item.id) === String(packageId)) || null
    : null;

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

  if ("is_visible" in payload || "isVisible" in payload) {
    changes.is_active = Boolean(payload.is_visible ?? payload.isVisible);
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

  await recordAdminAction(req, auth, "UPDATE_PLAN", "plan", updated.id, {
    before,
    after: updated,
    changes
  });

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

async function handleAdminGetUser(req, res, userId) {
  await requireAdminUser(req);
  const user = await databaseClient.findUserById(userId);
  if (!user) {
    throw createHttpError(404, "User not found.");
  }
  const xpLedger = typeof databaseClient.listXpLedger === "function"
    ? await databaseClient.listXpLedger({ user_id: userId, limit: 40 })
    : [];
  sendJson(req, res, 200, {
    success: true,
    data: {
      user: buildApiUser(user),
      xp_ledger: xpLedger
    }
  });
}

async function handleAdminUpdateUser(req, res, userId) {
  const auth = await requireAdminUser(req);
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
    if (getUserRbacRole(auth.user) !== "owner") {
      throw createHttpError(403, "Only owner can change admin roles.");
    }
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
  await recordAdminAction(req, auth, "UPDATE_USER", "user", userId, {
    before: buildApiUser(existingUser),
    after: buildApiUser(updated),
    changes
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      user: buildApiUser(updated)
    }
  });
}

async function buildChatMessages(conversation, payload) {
  const modelProfile = payload.modelProfile || getModelProfile(payload.selected_model || payload.selectedModel || payload.model);
  const analysis = payload.intelligence || aiIntelligence.analyzeRequest({
    message: payload.message || "",
    attachmentCount: payload.attachment_count || payload.attachmentCount || 0,
    attachmentNames: payload.attachment_names || payload.attachmentNames || [],
    requestedModel: payload.selected_model || payload.selectedModel || payload.model
  });
  const retrievedKnowledge = await getRetrievedKnowledgeContext({
    message: payload.message || "",
    analysis,
    user: { id: payload.user_id || null },
    project_id: payload.project_id || null
  });
  payload.__retrievedKnowledge = retrievedKnowledge;
  const systemPrompt = aiIntelligence.buildDynamicSystemPrompt({
    basePrompt: [
      modelProfile.systemPrompt,
      `النموذج المختار: ${modelProfile.name}.`
    ].filter(Boolean).join("\n"),
    audiencePrompt: buildAudienceAwareChatPrompt(payload),
    analysis,
    planKey: payload.plan_key || payload.planKey || "",
    ragContext: retrievedKnowledge.context
  });
  const history = await listConversationHistory(conversation);
  const attachmentContext = buildAttachmentContext(payload);
  const attachmentImages = sanitizeAttachmentImages(payload.attachment_images || payload.attachmentImages);
  const messages = [
    {
      role: "system",
      content: attachmentImages.length
        ? `${systemPrompt}\n\nتمرير الصور مفعل في هذا الطلب. اقرأ الصور مباشرة وحلل النصوص والعناصر المرئية بدل افتراض أنها غير واضحة.`
        : systemPrompt
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
  const startedAt = Date.now();
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
  const attachmentImages = sanitizeAttachmentImages(payload.attachment_images || payload.attachmentImages);
  const attachmentCount = Math.max(
    attachmentNames.length,
    attachmentImages.length,
    Number(payload.attachment_count || payload.attachmentCount || 0) || 0
  );
  const hasAttachment = Boolean(payload.has_attachment || payload.hasAttachment || attachmentCount > 0);
  const hasOnlyImageAttachments = attachmentCount > 0
    && (attachmentImages.length > 0 || attachmentNames.length > 0)
    && attachmentNames.every(isImageAttachmentName);
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgressSafely(auth.user, "بدأ جلسة شات جديدة") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to use chat.");
  }
  req.__businessContext = {
    user: activeUser,
    plan: getUserPlanKey(activeUser),
    route: "/api/chat/send",
    operation: "chat",
    message
  };
  const abuseSignal = await enforceAiAbuseProtection(req, {
    user: activeUser,
    message,
    operation: "chat",
    plan: getUserPlanKey(activeUser)
  });

  const requestedModel = normalizeSelectedModel(payload.selected_model || payload.selectedModel || payload.model || "orlixor");
  const routing = routeModelForUser({
    user: activeUser,
    requestedModel,
    message,
    attachmentCount,
    attachmentNames,
    operation: "chat"
  });
  if (abuseSignal?.shadowLimit) {
    routing.modelProfile.maxOutputTokens = Math.min(Number(routing.modelProfile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 360);
    routing.modelProfile.maxContextTokens = Math.min(Number(routing.modelProfile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS), FREE_MAX_CONTEXT_TOKENS);
    routing.routeReason = `${routing.routeReason}|shadow_limit`;
  }
  const usageStatsBefore = await getUserUsageStats(activeUser);
  await enforceModelUsageLimits(activeUser, routing, {
    confirmOverage: Boolean(payload.confirm_overage || payload.confirmOverage)
  });
  await enforceAiProductionGuardrails(activeUser, routing, {
    operation: "chat",
    attachmentCount
  });
  const selectedModel = routing.modelKey;
  if (selectedModel === "alpha" && !hasAlphaModelAccess(activeUser)) {
    throw createHttpError(403, "Orlixor AI Alpha متاح لمجموعة تجريبية محدودة فقط.");
  }
  const routingNotice = buildModelRoutingNotice(requestedModel, selectedModel, { message, attachmentCount, attachmentNames });
  const modelProfile = applyUserModelLimits(routing.modelProfile, activeUser);

  const overageXpCost = Math.max(0, Number(routing.extraXpCost || 0));
  const preflightXpCost = getPreflightXpCost(modelProfile, attachmentCount, attachmentNames) + overageXpCost;
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

  const chatPayload = {
    ...payload,
    message,
    selected_model: selectedModel,
    modelProfile,
    intelligence: routing.intelligence,
    plan_key: routing.planKey,
    attachment_count: attachmentCount,
    attachment_names: attachmentNames,
    attachment_images: attachmentImages,
    user_id: activeUser?.id || null,
    project_id: project?.id || null,
    subject: subject || project?.subject || activeUser?.subject || "",
    stage,
    grade: grade || project?.grade || activeUser?.grade || "",
    term: term || project?.term || "",
    lesson: lesson || project?.lesson || "",
    projectTitle: project?.title || ""
  };
  const chatMessages = await buildChatMessages(conversation, chatPayload);
  const retrievedKnowledge = chatPayload.__retrievedKnowledge || { context: "", sources: [] };
  const cacheKey = !attachmentImages.length ? buildModelCacheKey({ user: activeUser, routing, messages: chatMessages }) : "";
  const cachedResult = cacheKey ? await getCachedModelResponseAny(cacheKey, {
    plan: routing.planKey,
    model: selectedModel,
    message
  }) : null;
  const result = cachedResult || (attachmentImages.length
    ? await withAiQueueSlot({ routing, operation: "vision_chat" }, () => callOpenAIVision({
        modelProfile,
        messages: chatMessages,
        images: attachmentImages
      }))
    : await withAiQueueSlot({ routing, operation: "chat" }, () => callAiWithSessionRecovery({
        modelProfile,
        routing,
        operation: "chat",
        input: buildResponsesInput(chatMessages)
      })));
  if (!cachedResult && cacheKey) {
    await setCachedModelResponseAny(cacheKey, result, {
      plan: routing.planKey,
      model: selectedModel,
      message
    });
  }
  const assistantText = sanitizeModelDisplayText(result.text);
  const xpCost = calculateFinalXpCost(modelProfile, assistantText, attachmentCount, attachmentNames, result.usage) + overageXpCost;
  const quality = aiIntelligence.scoreResponse({
    answer: assistantText,
    usage: result.usage,
    latencyMs: Date.now() - startedAt,
    cached: Boolean(cachedResult)
  });
  const provider = normalizeProviderKey(result.provider || resolveProfileProvider(modelProfile));
  const totalCostEstimateUsd = estimateAiCostUsd(provider, result.usage);
  realScaleInfra.recordAiRequest({
    provider,
    model: selectedModel,
    plan: routing.planKey,
    routeReason: routing.routeReason,
    ragUsed: retrievedKnowledge.sources.length > 0,
    latencyMs: Date.now() - startedAt,
    costUsd: totalCostEstimateUsd,
    cached: Boolean(cachedResult)
  });
  await notifyUsageSignals(req, {
    user: activeUser,
    routing,
    stats: usageStatsBefore,
    usage: result.usage,
    xpCost,
    quality,
    result
  });
  await recordKnowledgeExpansionCandidate(req, {
    message,
    routing,
    ragSources: retrievedKnowledge.sources.length
  });

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
    assistantMessage
  });

  if (isDatabaseReady() && typeof databaseClient.recordAiQualityEvent === "function") {
    await databaseClient.recordAiQualityEvent({
      user_id: activeUser.id,
      conversation_id: conversation.id,
      message_id: assistantMessage?.id || null,
      task_type: routing.taskType,
      question_type: routing.questionType,
      model_key: selectedModel,
      provider,
      prompt_key: routing.promptKey,
      prompt_version: "v1",
      quality_score: quality.qualityScore,
      accuracy_score: quality.accuracyScore,
      length_score: quality.lengthScore,
      speed_score: quality.speedScore,
      satisfaction_score: quality.satisfactionScore,
      cost_score: quality.costScore,
      latency_ms: Date.now() - startedAt,
      input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
      token_cost: quality.tokenCost,
      xp_cost: xpCost,
      was_cached: Boolean(cachedResult),
      metadata: {
        request_analysis: routing.intelligence,
        user_id: activeUser.id,
        plan: routing.planKey,
        model: selectedModel,
        provider,
        provider_fallback: result.fallback || null,
        queue: result.queue || null,
        route_reason: routing.routeReason,
        rag_used: retrievedKnowledge.sources.length > 0,
        quality_score: quality.qualityScore,
        total_cost_estimate_usd: totalCostEstimateUsd,
        cost_guardrails: routing.costGuardrails || null,
        safe_mode: Boolean(routing.safeModeActive),
        provider_fallback: result.fallback || null,
        queue: result.queue || null,
        rag_sources: retrievedKnowledge.sources.map((source) => ({
          id: source.id,
          title: source.title || source.source_title || "",
          rank_score: source.rank_score || 0
        }))
      }
    });
  }

  recordBusinessEventSafe(req, {
    event_type: "ai_request_success",
    reason: routing.taskType,
    plan: routing.planKey,
    metadata: {
      route: "/api/chat/send",
      model_key: selectedModel,
      provider,
      rag_used: retrievedKnowledge.sources.length > 0,
      cost_usd: totalCostEstimateUsd,
      latency_ms: Date.now() - startedAt,
      quality_score: quality.qualityScore,
      abuse_shadow_limit: Boolean(abuseSignal?.shadowLimit),
      provider_fallback: result.fallback || null,
      queue: result.queue || null
    }
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      conversation_id: conversation.id,
      project: project ? buildProjectSummary(project) : null,
      assistant_message: {
        id: assistantMessage?.id || null,
        message_id: assistantMessage?.id || null,
        body: assistantText,
        source: "orlixor",
        model: modelProfile.name
      },
      model: {
        key: selectedModel,
        requested_key: requestedModel,
        name: modelProfile.name,
        provider,
        provider_model: resolveProviderModel(modelProfile, provider),
        plan: routing.planKey,
        queue_priority: routing.queuePriority,
        queue: result.queue || null,
        fallback: result.fallback || null,
        cache_hit: Boolean(cachedResult),
        routed: requestedModel !== selectedModel,
        notice: routingNotice,
        prompt_key: routing.promptKey,
        task_type: routing.taskType,
        question_type: routing.questionType
      },
      usage: activeUser ? {
        xp_spent: xpCost,
        xp_remaining: Math.max(0, Number(chargedUser?.xp || 0)),
        input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
        output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
        daily_token_limit: routing.limits.dailyTokens,
        monthly_token_limit: routing.limits.monthlyTokens,
        per_message_token_limit: routing.limits.perMessageTokens,
        overage_xp_spent: overageXpCost,
        overage_tokens: Number(routing.extraTokens || 0)
      } : null,
      intelligence: {
        quality_score: quality.qualityScore,
        prompt_key: routing.promptKey,
        task_type: routing.taskType,
        question_type: routing.questionType,
        rag_sources: retrievedKnowledge.sources.length,
        safe_mode: Boolean(routing.safeModeActive)
      },
      user: chargedUser ? buildApiUser(chargedUser) : null,
      guest: null
    }
  });
}

async function handleMessageFeedback(req, res, messageId) {
  const auth = await requireAuthenticatedUser(req);
  const payload = await parseJsonBody(req);
  const rating = String(payload.feedback || payload.rating || "").trim().toLowerCase();

  if (!rating || rating === "null" || rating === "none") {
    sendJson(req, res, 200, {
      success: true,
      data: { saved: false }
    });
    return;
  }

  const feedback = aiIntelligence.normalizeFeedback(rating);
  if (!feedback) {
    throw createHttpError(422, "قيمة التقييم غير صحيحة.");
  }

  const numericMessageId = Number(messageId);
  const feedbackMessageId = Number.isFinite(numericMessageId) && numericMessageId > 0
    ? numericMessageId
    : null;
  const modelKey = normalizeSelectedModel(payload.model_key || payload.modelKey || payload.model);
  const provider = payload.provider ? normalizeProviderKey(payload.provider) : resolveProfileProvider(getModelProfile(modelKey));
  const quality = aiIntelligence.scoreResponse({
    feedback: feedback.type,
    answer: payload.answer || payload.output_text || payload.outputText || ""
  });
  if (isDatabaseReady() && typeof databaseClient.saveFeedback === "function") {
    await databaseClient.saveFeedback({
      user_id: auth.user.id,
      message_id: feedbackMessageId,
      conversation_id: sanitizeOptionalText(payload.conversation_id || payload.conversationId, MAX_METADATA_LENGTH) || null,
      model_key: modelKey,
      provider,
      rating: feedback.rating,
      feedback_type: feedback.type,
      task_type: sanitizeOptionalText(payload.task_type || payload.taskType, 80) || null,
      question_type: sanitizeOptionalText(payload.question_type || payload.questionType, 80) || null,
      prompt_key: sanitizeOptionalText(payload.prompt_key || payload.promptKey, 160) || null,
      prompt_version: sanitizeOptionalText(payload.prompt_version || payload.promptVersion, 80) || null,
      quality_score: quality.qualityScore,
      reason: sanitizeOptionalText(payload.reason, 500),
      note: sanitizeOptionalText(payload.note || payload.reason, 500),
      metadata: {
        tags: feedback.tags,
        quality
      }
    });
  }

  if (isDatabaseReady() && typeof databaseClient.recordAiQualityEvent === "function") {
    await databaseClient.recordAiQualityEvent({
      user_id: auth.user.id,
      message_id: feedbackMessageId,
      conversation_id: sanitizeOptionalText(payload.conversation_id || payload.conversationId, MAX_METADATA_LENGTH) || null,
      task_type: sanitizeOptionalText(payload.task_type || payload.taskType, 80) || null,
      question_type: sanitizeOptionalText(payload.question_type || payload.questionType, 80) || null,
      model_key: modelKey,
      provider,
      prompt_key: sanitizeOptionalText(payload.prompt_key || payload.promptKey, 160) || null,
      prompt_version: sanitizeOptionalText(payload.prompt_version || payload.promptVersion, 80) || null,
      quality_score: quality.qualityScore,
      accuracy_score: quality.accuracyScore,
      length_score: quality.lengthScore,
      speed_score: quality.speedScore,
      satisfaction_score: quality.satisfactionScore,
      cost_score: quality.costScore,
      user_feedback: feedback.type,
      metadata: {
        tags: feedback.tags,
        reason: sanitizeOptionalText(payload.reason || payload.note, 500)
      }
    });
  }

  if (
    isDatabaseReady() &&
    typeof databaseClient.saveAiTrainingExample === "function" &&
    ["excellent", "save_worthy", "solved"].includes(feedback.type) &&
    (payload.input_text || payload.inputText) &&
    (payload.output_text || payload.outputText)
  ) {
    const candidate = aiIntelligence.buildTrainingCandidate({
      inputText: payload.input_text || payload.inputText,
      outputText: payload.output_text || payload.outputText,
      taskType: payload.task_type || payload.taskType || "general",
      modelKey,
      qualityScore: quality.qualityScore
    });
    if (candidate) {
      await databaseClient.saveAiTrainingExample(candidate);
    }
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      saved: true,
      feedback_type: feedback.type,
      quality_score: quality.qualityScore
    }
  });
}

function splitKnowledgeContent(content, maxLength = 1400) {
  const text = String(content || "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const paragraph of paragraphs.length ? paragraphs : [text]) {
    if ((current + "\n\n" + paragraph).trim().length > maxLength && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = `${current ? `${current}\n\n` : ""}${paragraph}`;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxLength * 1.4) return [chunk];
    const parts = [];
    for (let index = 0; index < chunk.length; index += maxLength) {
      parts.push(chunk.slice(index, index + maxLength).trim());
    }
    return parts.filter(Boolean);
  });
}

function normalizeAiAdminStatus(value, allowed, fallback) {
  const status = String(value || fallback || "").trim().toLowerCase();
  return allowed.includes(status) ? status : fallback;
}

function normalizeAiAdminTags(value) {
  const list = Array.isArray(value)
    ? value
    : String(value || "")
      .split(",")
      .map((item) => item.trim());
  return [...new Set(list.map((item) => sanitizeOptionalText(item, 40)).filter(Boolean))].slice(0, 12);
}

function buildApiKnowledgeSource(row = {}) {
  return {
    id: row.id,
    source_key: row.source_key,
    source_type: row.source_type || "manual",
    title: row.title || "",
    category: row.category || "faq",
    source: row.source_label || row.source || row.url || "",
    url: row.url || "",
    status: row.status || "draft",
    tags: Array.isArray(row.tags) ? row.tags : [],
    quality_score: Number(row.quality_score || 0),
    is_active: row.is_active !== false,
    chunks_count: Number(row.chunks_count || 0),
    total_usage: Number(row.total_usage || 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function buildApiTrainingCandidate(row = {}) {
  return {
    id: row.id,
    input_text: aiIntelligence.sanitizeSensitiveText(row.input_text || "").text,
    ideal_output: aiIntelligence.sanitizeSensitiveText(row.ideal_output || "").text,
    task_type: row.task_type || "general",
    model_key: row.model_key || "unknown",
    quality_score: Number(row.quality_score || 0),
    review_status: row.review_status || "pending",
    approved_by_admin: Boolean(row.approved_by_admin),
    admin_note: row.admin_note || "",
    metadata: row.metadata || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

async function handleAdminAiIntelligence(req, res) {
  await requireAdminUser(req);
  if (!isDatabaseReady() || typeof databaseClient.getAiIntelligenceAnalytics !== "function") {
    throw createHttpError(503, "AI intelligence analytics are not available until the database is ready.");
  }
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  let analytics = {};
  try {
    analytics = await databaseClient.getAiIntelligenceAnalytics({
      model_key: sanitizeOptionalText(url.searchParams.get("model"), 80),
      plan: sanitizeOptionalText(url.searchParams.get("plan"), 80),
      task_type: sanitizeOptionalText(url.searchParams.get("task_type"), 80),
      question_type: sanitizeOptionalText(url.searchParams.get("question_type"), 80),
      from: sanitizeOptionalText(url.searchParams.get("from"), 80),
      to: sanitizeOptionalText(url.searchParams.get("to"), 80)
    });
  } catch (error) {
    console.warn("[AI_INTELLIGENCE_ANALYTICS_DEGRADED]", error?.message || error);
    analytics = {
      overview: {
        messages_today: 0,
        tokens_today: 0,
        token_cost_today: 0,
        best_model: null,
        most_used_model: null,
        avg_quality: 0,
        avg_latency_ms: 0,
        top_dissatisfaction_reason: null
      },
      model_performance: [],
      feedback_reasons: [],
      feedback_analytics: [],
      task_quality: [],
      knowledge_base: { chunks_count: 0, approved_chunks_count: 0, avg_quality: 0, total_usage: 0 },
      excellent_answers: { total: 0, pending: 0, approved: 0, rejected: 0 },
      degraded: true,
      error: "AI_INTELLIGENCE_ANALYTICS_DEGRADED"
    };
  }
  sendJson(req, res, 200, {
    success: true,
    data: {
      layer: "AI Intelligence Layer",
      fine_tuning_enabled: false,
      rag_enabled: true,
      privacy_sanitization_enabled: true,
      analytics
    }
  });
}

async function handleAdminAiHealth(req, res) {
  await requireAdminUser(req);
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const health = await buildAiHealthSnapshot({
    simulateSafeMode: url.searchParams.get("simulate_safe_mode") === "1"
  });
  sendJson(req, res, 200, {
    success: true,
    data: health
  });
}

async function handleAdminAiLaunchMonitor(req, res) {
  await requireAdminUser(req);
  const snapshot = await buildAiLaunchMonitorSnapshot();
  sendJson(req, res, 200, {
    success: true,
    data: snapshot
  });
}

async function handleAdminBetaAnalytics(req, res) {
  await requireAdminUser(req);
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const snapshot = await buildBetaBusinessAnalyticsSnapshot({
    days: Math.max(1, Math.min(Number(url.searchParams.get("days") || 30), 90))
  });
  sendJson(req, res, 200, {
    success: true,
    data: snapshot
  });
}

async function buildScaleGrowthSnapshot(options = {}) {
  const days = Math.max(1, Math.min(Number(options.days || 30), 90));
  const health = await buildAiHealthSnapshot();
  const dbAnalytics = isDatabaseReady() && typeof databaseClient.getScaleGrowthAnalytics === "function"
    ? await databaseClient.getScaleGrowthAnalytics({ days }).catch((error) => ({ error: error?.message || "SCALE_GROWTH_ANALYTICS_FAILED" }))
    : {};
  const scaling = buildScalingSnapshot();
  const recommendations = [
    ...(Array.isArray(scaling.scaling_recommendations) ? scaling.scaling_recommendations : []),
    health.safe_mode?.active ? "Keep Safe Mode enabled until cost/API pressure returns to normal." : "",
    Number(dbAnalytics?.reputation?.high_abuse_users || 0) > 0 ? "Review high-abuse accounts and keep shadow limits active." : "",
    Number(dbAnalytics?.knowledge_expansion?.suggestions?.length || 0) > 0 ? "Review repeated-question KB suggestions and approve useful FAQ articles." : ""
  ].filter(Boolean);
  return {
    generated_at: new Date().toISOString(),
    window_days: days,
    referrals: dbAnalytics.referrals || { total_referrals: 0, conversions: 0, rewards_xp: 0, top_referrers: [] },
    notifications: dbAnalytics.notifications || { by_type: [] },
    knowledge_expansion: dbAnalytics.knowledge_expansion || { suggestions: [] },
    reputation: dbAnalytics.reputation || { shadow_banned_users: 0, avg_trust_score: 0, avg_abuse_score: 0, high_abuse_users: 0 },
    scaling,
    real_scale: realScaleInfra.getStatus(),
    safe_mode: health.safe_mode,
    cost_guardrails: health.cost_guardrails,
    recommendations
  };
}

async function handleAdminScaleGrowth(req, res) {
  await requireAdminUser(req);
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const snapshot = await buildScaleGrowthSnapshot({
    days: Math.max(1, Math.min(Number(url.searchParams.get("days") || 30), 90))
  });
  sendJson(req, res, 200, {
    success: true,
    data: snapshot
  });
}

async function buildRealScaleSnapshot() {
  const health = await buildAiHealthSnapshot();
  const aiService = await probeAiServiceHealth();
  const worker = await probeAiWorkerHeartbeat();
  return {
    generated_at: new Date().toISOString(),
    readiness: {
      redis_ready: Boolean(health.real_scale?.redis?.connected),
      queue_ready: health.real_scale?.queue?.mode === "bullmq",
      worker_ready: Boolean(worker.ready),
      ai_service_ready: Boolean(aiService.ok),
      streaming_ready: Boolean(health.real_scale?.streaming?.sse_enabled),
      monitoring_ready: Boolean(health.real_scale?.monitoring?.prometheus_enabled),
      sentry_ready: Boolean(health.real_scale?.monitoring?.sentry_enabled),
      real_embeddings_ready: Boolean(health.real_scale?.embeddings?.production_ready),
      fallback_safe: true
    },
    real_scale: health.real_scale,
    worker,
    ai_service: aiService,
    cost_guardrails: health.cost_guardrails,
    safe_mode: health.safe_mode,
    disaster_protection: health.real_scale?.disaster_protection || {},
    alerts: health.alerts || [],
    recommendations: [
      health.real_scale?.redis?.connected ? "" : "Configure REDIS_URL in production to move rate limits, queue state, cache, abuse tracking, and live metrics out of process memory.",
      health.real_scale?.queue?.mode === "bullmq" ? "" : "Run npm run ai:worker after Redis is configured to process heavy AI jobs outside the main web process.",
      health.real_scale?.embeddings?.production_ready ? "" : "Enable ORLIXOR_ENABLE_EMBEDDINGS=true with pgvector or Qdrant before high-traffic semantic RAG.",
      health.real_scale?.monitoring?.sentry_enabled ? "" : "Set SENTRY_DSN to capture provider failures and production exceptions.",
      "Keep Fine-tuning disabled until sanitized, reviewed datasets are approved by admins."
    ].filter(Boolean)
  };
}

function getAiServiceBaseUrl() {
  const explicit = readEnvValue("AI_SERVICE_URL", "");
  if (explicit) return explicit.replace(/\/+$/, "");
  const hostport = readEnvValue("AI_SERVICE_HOSTPORT", "");
  return hostport ? `http://${hostport.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}` : "";
}

async function fetchJsonWithTimeout(url, timeoutMs = 4500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs || 4500)));
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_) {
      data = { raw: text };
    }
    return {
      status: response.status,
      ok: response.ok && data?.ok !== false && data?.success !== false,
      data
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function probeAiServiceHealth() {
  const baseUrl = getAiServiceBaseUrl();
  if (!baseUrl) {
    return {
      configured: false,
      ok: false,
      status: "not_configured",
      url_source: "none"
    };
  }
  const startedAt = Date.now();
  try {
    const result = await fetchJsonWithTimeout(`${baseUrl}/health`, 5000);
    return {
      configured: true,
      ok: result.ok,
      status: result.ok ? "ok" : `http_${result.status}`,
      latency_ms: Date.now() - startedAt,
      url_source: process.env.AI_SERVICE_URL ? "AI_SERVICE_URL" : "AI_SERVICE_HOSTPORT",
      service: result.data?.service || null,
      infra: result.data?.infra ? {
        redis: result.data.infra.redis || null,
        queue: result.data.infra.queue || null,
        monitoring: result.data.infra.monitoring || null,
        memory_pressure: result.data.infra.memory_pressure || null
      } : null
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      status: "unreachable",
      latency_ms: Date.now() - startedAt,
      url_source: process.env.AI_SERVICE_URL ? "AI_SERVICE_URL" : "AI_SERVICE_HOSTPORT",
      error: String(error?.message || error).slice(0, 500)
    };
  }
}

async function probeAiWorkerHeartbeat() {
  const heartbeat = await realScaleInfra.getJson("worker:heartbeat");
  const heartbeatMs = heartbeat?.heartbeat_at ? new Date(heartbeat.heartbeat_at).getTime() : 0;
  const ageMs = heartbeatMs ? Date.now() - heartbeatMs : null;
  const ready = Boolean(heartbeat?.ok && Number.isFinite(ageMs) && ageMs <= 60_000);
  return {
    configured: Boolean(process.env.REDIS_URL || process.env.ORLIXOR_REDIS_URL || process.env.UPSTASH_REDIS_URL),
    ready,
    status: ready ? "ok" : heartbeat ? "stale_or_memory_isolated" : "missing_heartbeat",
    heartbeat_age_ms: ageMs,
    heartbeat: heartbeat ? {
      service: heartbeat.service || null,
      pid: heartbeat.pid || null,
      started_at: heartbeat.started_at || null,
      heartbeat_at: heartbeat.heartbeat_at || null,
      worker: heartbeat.worker || null,
      redis: heartbeat.redis || null,
      queue: heartbeat.queue || null,
      memory_pressure: heartbeat.memory_pressure || null
    } : null
  };
}

async function handleAdminRealScale(req, res) {
  await requireAdminUser(req);
  sendJson(req, res, 200, {
    success: true,
    data: await buildRealScaleSnapshot()
  });
}

async function handleAdminRealScaleSentryTest(req, res) {
  await requireAdminUser(req);
  const payload = await parseJsonBody(req).catch(() => ({}));
  if (payload.confirm !== "send_test_error") {
    throw createHttpError(422, "confirm must be send_test_error.");
  }
  const sent = realScaleInfra.captureMessage("Mullem real scale Sentry production test", {
    level: "warning",
    route: "/api/admin/real-scale/sentry-test",
    request_id: req.__requestId || null,
    sent_at: new Date().toISOString()
  });
  sendJson(req, res, sent ? 200 : 503, {
    success: sent,
    data: {
      sent,
      sentry_configured: Boolean(process.env.SENTRY_DSN)
    }
  });
}

async function handleAdminOpsOverview(req, res) {
  await requireAdminUser(req);
  sendJson(req, res, 200, {
    success: true,
    data: await buildOperationalExcellenceSnapshot()
  });
}

async function handleAdminFeatureFlags(req, res) {
  const auth = await requireAdminUser(req);
  if (req.method === "GET") {
    await loadFeatureFlagOverrides();
    sendJson(req, res, 200, {
      success: true,
      data: {
        flags: getFeatureFlagsSync(),
        overrides: aiRuntimeState.featureFlagOverrides || {}
      }
    });
    return;
  }
  const payload = await parseJsonBody(req);
  const current = { ...(await loadFeatureFlagOverrides()) };
  const updates = payload.flags && typeof payload.flags === "object" ? payload.flags : payload;
  const allowed = Object.keys(getFeatureFlagsSync());
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      current[key] = Boolean(updates[key]);
    }
  }
  await saveFeatureFlagOverrides(current);
  await recordAdminAction(req, auth, "UPDATE_AI_FEATURE_FLAGS", "ai_runtime", "feature_flags", {
    before: aiRuntimeState.featureFlagOverrides || {},
    after: current,
    overrides: current
  });
  sendJson(req, res, 200, {
    success: true,
    data: {
      flags: getFeatureFlagsSync(),
      overrides: current
    }
  });
}

async function handleAdminIncidents(req, res) {
  const auth = await requireAdminUser(req);
  if (req.method === "GET") {
    sendJson(req, res, 200, {
      success: true,
      data: {
        items: await listOpsIncidents(),
        postmortem_template: aiOps.buildPostmortemTemplate()
      }
    });
    return;
  }
  const payload = await parseJsonBody(req);
  const incident = aiOps.buildIncident({
    title: sanitizeOptionalText(payload.title, 160) || "Production incident",
    severity: payload.severity,
    owner: sanitizeOptionalText(payload.owner, 120) || auth.user?.email || "admin",
    summary: sanitizeOptionalText(payload.summary, 2000),
    affected_systems: Array.isArray(payload.affected_systems || payload.affectedSystems)
      ? (payload.affected_systems || payload.affectedSystems).map((item) => sanitizeOptionalText(item, 120)).filter(Boolean)
      : [],
    initial_event: sanitizeOptionalText(payload.initial_event || payload.initialEvent, 1000) || "Incident opened by admin."
  });
  const incidents = await listOpsIncidents();
  await saveOpsIncidents([incident, ...incidents]);
  await recordAdminAction(req, auth, "CREATE_INCIDENT", "ops_incident", incident.id, {
    before: null,
    after: incident,
    severity: incident.severity,
    title: incident.title
  });
  sendJson(req, res, 201, {
    success: true,
    data: { incident }
  });
}

async function handleAdminIncidentEvent(req, res, incidentId) {
  const auth = await requireAdminUser(req);
  const payload = await parseJsonBody(req);
  const incidents = await listOpsIncidents();
  const index = incidents.findIndex((item) => String(item.id) === String(incidentId));
  if (index < 0) {
    throw createHttpError(404, "Incident was not found.");
  }
  const before = incidents[index];
  const updated = aiOps.appendIncidentEvent(incidents[index], {
    type: payload.type,
    status: payload.status,
    message: sanitizeOptionalText(payload.message, 1000) || "Incident updated."
  });
  incidents[index] = updated;
  await saveOpsIncidents(incidents);
  await recordAdminAction(req, auth, "UPDATE_INCIDENT", "ops_incident", updated.id, {
    before,
    after: updated,
    status: updated.status,
    event_type: payload.type || "update"
  });
  sendJson(req, res, 200, {
    success: true,
    data: { incident: updated }
  });
}

async function handleAdminPrometheusMetrics(req, res) {
  await requireAdminUser(req);
  const body = await realScaleInfra.getPrometheusMetrics();
  setCorsHeaders(req, res);
  res.writeHead(200, {
    "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

async function handleReferralMe(req, res) {
  const auth = await requireAuthenticatedUser(req);
  if (!isDatabaseReady() || typeof databaseClient.getReferralStats !== "function") {
    throw createHttpError(503, "Referral storage is not available.");
  }
  const stats = await databaseClient.getReferralStats(auth.user.id);
  sendJson(req, res, 200, {
    success: true,
    data: { referral: stats }
  });
}

async function handleApplyReferral(req, res) {
  const auth = await requireAuthenticatedUser(req);
  const payload = await parseJsonBody(req);
  const referralCode = sanitizeOptionalText(payload.referral_code || payload.referralCode || payload.code, 32).toUpperCase();
  if (!referralCode) {
    throw createHttpError(422, "referral_code is required.");
  }
  if (!isDatabaseReady() || typeof databaseClient.recordReferralSignup !== "function") {
    throw createHttpError(503, "Referral storage is not available.");
  }
  const referral = await databaseClient.recordReferralSignup({
    referral_code: referralCode,
    referred_user_id: auth.user.id,
    metadata: {
      route: "/api/referrals/apply",
      request_id: req.__requestId || null
    }
  });
  if (!referral) {
    throw createHttpError(404, "Referral code was not found or cannot be applied.");
  }
  recordBusinessEventSafe(req, {
    event_type: "referral_signup",
    reason: "manual_apply",
    plan: getUserPlanKey(auth.user),
    metadata: { referral_id: referral.id }
  });
  sendJson(req, res, 200, {
    success: true,
    data: { referral }
  });
}

async function handleAdminAiSafeMode(req, res) {
  const auth = await requireAdminUser(req);
  const payload = await parseJsonBody(req);
  if (!Object.prototype.hasOwnProperty.call(payload, "enabled")) {
    throw createHttpError(422, "enabled is required.");
  }
  aiRuntimeState.safeModeOverride = payload.enabled === null ? null : Boolean(payload.enabled);
  aiRuntimeState.safeModeUpdatedAt = new Date().toISOString();
  aiRuntimeState.safeModeUpdatedBy = auth.user?.id || null;
  await recordAdminAction(req, auth, "UPDATE_AI_SAFE_MODE", "ai_runtime", "safe_mode", {
    enabled: aiRuntimeState.safeModeOverride
  });
  const health = await buildAiHealthSnapshot();
  sendJson(req, res, 200, {
    success: true,
    data: {
      safe_mode: health.safe_mode,
      launch_monitor: await buildAiLaunchMonitorSnapshot()
    }
  });
}

async function handleAdminKnowledgeList(req, res) {
  await requireAdminUser(req);
  if (!isDatabaseReady() || typeof databaseClient.listKnowledgeSources !== "function") {
    throw createHttpError(503, "Knowledge Base storage is not available until the database is ready.");
  }
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const items = await databaseClient.listKnowledgeSources({
    status: sanitizeOptionalText(url.searchParams.get("status"), 40),
    category: sanitizeOptionalText(url.searchParams.get("category"), 80),
    limit: Math.max(1, Math.min(Number(url.searchParams.get("limit") || 160), 300))
  });
  sendJson(req, res, 200, {
    success: true,
    data: {
      items: items.map(buildApiKnowledgeSource)
    }
  });
}

async function handleAdminKnowledgeIngest(req, res) {
  const auth = await requireAdminUser(req);
  if (!isDatabaseReady() || typeof databaseClient.saveKnowledgeSource !== "function" || typeof databaseClient.saveKnowledgeChunk !== "function") {
    throw createHttpError(503, "Knowledge Base storage is not available until the database is ready.");
  }

  const payload = await parseJsonBody(req);
  const title = sanitizeOptionalText(payload.title || payload.source_title || payload.sourceTitle, 255);
  const content = String(payload.content || payload.text || payload.body || "").trim();
  const status = normalizeAiAdminStatus(payload.status, ["draft", "approved", "rejected"], "draft");
  const category = sanitizeOptionalText(payload.category, 80) || "faq";
  const tags = normalizeAiAdminTags(payload.tags);
  if (!title || !content) {
    throw createHttpError(422, "title and content are required.");
  }

  const sanitizedContent = aiIntelligence.sanitizeSensitiveText(content);
  const source = await databaseClient.saveKnowledgeSource({
    source_key: payload.source_key || payload.sourceKey || aiIntelligence.hashText(`${title}:${payload.url || ""}`).slice(0, 32),
    source_type: payload.source_type || payload.sourceType || "manual",
    title,
    category,
    status,
    source: payload.source || payload.source_label || payload.sourceLabel || "",
    tags,
    url: payload.url || "",
    quality_score: payload.quality_score || payload.qualityScore || 70,
    metadata: {
      imported_by: "admin",
      imported_by_user_id: auth.user?.id || null,
      privacy: "sanitized",
      privacy_findings: sanitizedContent.findings
    }
  });

  const chunks = splitKnowledgeContent(sanitizedContent.text);
  const savedChunks = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const sanitized = aiIntelligence.sanitizeSensitiveText(chunks[index]);
    const embedding = ORLIXOR_ENABLE_EMBEDDINGS ? await createEmbedding(sanitized.text) : null;
    const chunk = await databaseClient.saveKnowledgeChunk({
      source_id: source?.id || null,
      chunk_key: `${source?.source_key || source?.id || "source"}:${index + 1}`,
      title: `${title} #${index + 1}`,
      content: chunks[index],
      sanitized_content: sanitized.text,
      embedding,
      task_type: payload.task_type || payload.taskType || null,
      category,
      status,
      tags,
      quality_score: payload.quality_score || payload.qualityScore || 70,
      metadata: {
        privacy_findings: sanitized.findings
      }
    });
    if (chunk) savedChunks.push(chunk);
  }
  if (status === "approved" && savedChunks.length) {
    await realScaleInfra.enqueueJob("embeddings:generation", {
      source_id: source?.id || null,
      source_key: source?.source_key || null,
      chunks: savedChunks.map((chunk) => ({
        id: chunk.id,
        chunk_key: chunk.chunk_key || chunk.chunkKey || null
      })),
      mode: ORLIXOR_ENABLE_EMBEDDINGS ? "refresh_embedding" : "awaiting_embeddings_enablement"
    });
  }

  sendJson(req, res, 201, {
    success: true,
    data: {
      source: buildApiKnowledgeSource(source),
      chunks_count: savedChunks.length
    }
  });
}

async function handleAdminKnowledgeUpdate(req, res, sourceId) {
  const auth = await requireAdminUser(req);
  if (!isDatabaseReady() || typeof databaseClient.updateKnowledgeSource !== "function") {
    throw createHttpError(503, "Knowledge Base storage is not available until the database is ready.");
  }
  const payload = await parseJsonBody(req);
  const status = payload.status
    ? normalizeAiAdminStatus(payload.status, ["draft", "approved", "rejected"], "draft")
    : "";
  const updatePayload = {
    title: payload.title,
    source_type: payload.source_type || payload.sourceType,
    category: payload.category,
    status,
    source: payload.source || payload.source_label || payload.sourceLabel,
    url: payload.url,
    metadata: {
      updated_by_user_id: auth.user?.id || null
    }
  };
  if ("is_active" in payload || "isActive" in payload) updatePayload.is_active = payload.is_active ?? payload.isActive;
  if ("tags" in payload) updatePayload.tags = normalizeAiAdminTags(payload.tags);
  const item = await databaseClient.updateKnowledgeSource(sourceId, updatePayload);
  if (!item) {
    throw createHttpError(404, "Knowledge source was not found.");
  }
  await recordAdminAction(req, auth, "UPDATE_AI_KNOWLEDGE", "ai_knowledge_source", sourceId, {
    status: status || item.status
  });
  sendJson(req, res, 200, {
    success: true,
    data: {
      item: buildApiKnowledgeSource(item)
    }
  });
}

async function handleAdminReviewExcellentAnswers(req, res) {
  await requireAdminUser(req);
  if (!isDatabaseReady() || typeof databaseClient.listExcellentAnswerCandidates !== "function") {
    throw createHttpError(503, "AI review queue is not available until the database is ready.");
  }
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const items = await databaseClient.listExcellentAnswerCandidates({
    status: sanitizeOptionalText(url.searchParams.get("status"), 40),
    task_type: sanitizeOptionalText(url.searchParams.get("task_type"), 80),
    model_key: sanitizeOptionalText(url.searchParams.get("model"), 80),
    limit: Math.max(1, Math.min(Number(url.searchParams.get("limit") || 120), 250))
  });
  sendJson(req, res, 200, {
    success: true,
    data: {
      items: items.map(buildApiTrainingCandidate)
    }
  });
}

async function handleAdminApproveExcellentAnswer(req, res, exampleId) {
  const auth = await requireAdminUser(req);
  if (
    !isDatabaseReady() ||
    typeof databaseClient.getTrainingExampleById !== "function" ||
    typeof databaseClient.updateTrainingExampleReview !== "function" ||
    typeof databaseClient.saveKnowledgeSource !== "function" ||
    typeof databaseClient.saveKnowledgeChunk !== "function"
  ) {
    throw createHttpError(503, "AI review queue is not available until the database is ready.");
  }

  const payload = await parseJsonBody(req);
  const current = await databaseClient.getTrainingExampleById(exampleId);
  if (!current) {
    throw createHttpError(404, "Training example was not found.");
  }
  const inputText = aiIntelligence.sanitizeSensitiveText(payload.input_text || payload.inputText || current.input_text || "");
  const outputText = aiIntelligence.sanitizeSensitiveText(payload.ideal_output || payload.idealOutput || current.ideal_output || "");
  if (!inputText.text || !outputText.text) {
    throw createHttpError(422, "Approved examples must include a question and an answer.");
  }
  const title = sanitizeOptionalText(payload.title, 255) || `Excellent answer #${current.id}`;
  const category = sanitizeOptionalText(payload.category, 80) || "excellent_answers";
  const tags = normalizeAiAdminTags(payload.tags || ["excellent", current.task_type || "general"]);
  const kbContent = [
    `Question: ${inputText.text}`,
    "",
    `Approved answer: ${outputText.text}`
  ].join("\n");
  const source = await databaseClient.saveKnowledgeSource({
    source_key: `excellent-answer-${current.id}`,
    source_type: "excellent_answer",
    title,
    category,
    status: "approved",
    source: "admin_review",
    tags,
    quality_score: Math.max(70, Number(current.quality_score || 0)),
    metadata: {
      training_example_id: current.id,
      approved_by_user_id: auth.user?.id || null,
      privacy_findings: [...new Set([...(inputText.findings || []), ...(outputText.findings || [])])]
    }
  });
  const embedding = ORLIXOR_ENABLE_EMBEDDINGS ? await createEmbedding(kbContent) : null;
  await databaseClient.saveKnowledgeChunk({
    source_id: source?.id || null,
    chunk_key: `excellent-answer-${current.id}:1`,
    title,
    content: kbContent,
    sanitized_content: kbContent,
    embedding,
    task_type: current.task_type || "general",
    category,
    status: "approved",
    tags,
    quality_score: Math.max(70, Number(current.quality_score || 0)),
    metadata: {
      training_example_id: current.id
    }
  });
  const updated = await databaseClient.updateTrainingExampleReview(exampleId, {
    input_text: inputText.text,
    ideal_output: outputText.text,
    status: "approved",
    admin_note: payload.admin_note || payload.adminNote || "",
    metadata: {
      approved_by_user_id: auth.user?.id || null,
      knowledge_source_id: source?.id || null
    }
  });
  await recordAdminAction(req, auth, "APPROVE_AI_EXCELLENT_ANSWER", "ai_training_example", exampleId, {
    knowledgeSourceId: source?.id || null
  });
  sendJson(req, res, 200, {
    success: true,
    data: {
      item: buildApiTrainingCandidate(updated),
      knowledge_source: buildApiKnowledgeSource(source)
    }
  });
}

async function handleAdminRejectExcellentAnswer(req, res, exampleId) {
  const auth = await requireAdminUser(req);
  if (!isDatabaseReady() || typeof databaseClient.updateTrainingExampleReview !== "function") {
    throw createHttpError(503, "AI review queue is not available until the database is ready.");
  }
  const payload = await parseJsonBody(req);
  const updated = await databaseClient.updateTrainingExampleReview(exampleId, {
    status: "rejected",
    admin_note: payload.admin_note || payload.adminNote || "Rejected by admin",
    metadata: {
      rejected_by_user_id: auth.user?.id || null
    }
  });
  if (!updated) {
    throw createHttpError(404, "Training example was not found.");
  }
  await recordAdminAction(req, auth, "REJECT_AI_EXCELLENT_ANSWER", "ai_training_example", exampleId, {});
  sendJson(req, res, 200, {
    success: true,
    data: {
      item: buildApiTrainingCandidate(updated)
    }
  });
}

async function handleAdminRagDebug(req, res) {
  const auth = await requireAdminUser(req);
  const payload = await parseJsonBody(req);
  const question = sanitizeOptionalText(payload.question || payload.query || payload.message, 4000);
  if (!question) {
    throw createHttpError(422, "question is required.");
  }
  const analysis = {
    ...aiIntelligence.analyzeRequest({
      message: question,
      requestedModel: payload.model || "pro",
      operation: "admin_rag_debug"
    }),
    needsRetrieval: true
  };
  const retrievedKnowledge = await getRetrievedKnowledgeContext({
    message: question,
    analysis
  });
  const adminAiUser = {
    ...auth.user,
    plan: "pioneer",
    package_key: "pioneer",
    package_name: "Pioneer",
    plan_type: "pioneer",
    package_daily_xp: 600
  };
  const routing = routeModelForUser({
    user: adminAiUser,
    requestedModel: payload.model || (analysis.needsCreativity ? "creative" : "pro"),
    message: question,
    operation: "admin_rag_debug"
  });
  const systemPrompt = aiIntelligence.buildDynamicSystemPrompt({
    basePrompt: "You are the Orlixor AI RAG debug assistant for admins. Answer briefly and use the retrieved knowledge when relevant.",
    audiencePrompt: "The user is an admin testing retrieval quality. Do not expose private user data.",
    analysis,
    ragContext: retrievedKnowledge.context
  });
  const startedAt = Date.now();
  const dryRun = Boolean(payload.dry_run || payload.dryRun);
  const result = dryRun
    ? {
        text: retrievedKnowledge.sources.length
          ? `Dry-run RAG answer based on: ${retrievedKnowledge.sources[0].title || retrievedKnowledge.sources[0].source_title || "Knowledge Base"}`
          : "Dry-run RAG answer: no approved source was retrieved.",
        usage: {
          input_tokens: aiIntelligence.estimateTokens(`${systemPrompt}\n${question}`),
          output_tokens: 24
        }
      }
    : await callOpenAI({
        modelProfile: routing.modelProfile,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ]
      });
  const answer = sanitizeModelDisplayText(result.text);
  sendJson(req, res, 200, {
    success: true,
    data: {
      question,
      answer,
      dry_run: dryRun,
      model: {
        key: routing.modelKey,
        provider: resolveProfileProvider(routing.modelProfile),
        provider_model: resolveProviderModel(routing.modelProfile, resolveProfileProvider(routing.modelProfile)),
        prompt_key: analysis.promptKey,
        task_type: analysis.taskType,
        question_type: analysis.questionType
      },
      latency_ms: Date.now() - startedAt,
      usage: result.usage || null,
      sources: retrievedKnowledge.sources.map((source, index) => ({
        id: source.id,
        title: source.title || source.source_title || `Source ${index + 1}`,
        source_key: source.source_key || "",
        content: aiIntelligence.sanitizeSensitiveText(source.content || "").text.slice(0, 900),
        similarity: Number(source.similarity || source.keyword_score || source.keywordScore || 0),
        rank_score: Number(source.rank_score || 0),
        reason: `Matched task ${analysis.taskType}; ranked by similarity, quality, feedback, and recency.`,
        source: source.source_label || source.source_title || source.source_type || "",
        category: source.category || source.source_category || "",
        updated_at: source.updated_at || null
      }))
    }
  });
}

async function handleAdminAdjustUserXp(req, res, userId, direction = "add") {
  const auth = await requireAdminUser(req);
  if (typeof databaseClient.adjustUserXpByAdmin !== "function") {
    throw createHttpError(501, "Admin XP adjustment is not available.");
  }
  const payload = await parseJsonBody(req);
  const rawAmount = Math.round(Number(payload.amount || 0) || 0);
  if (!rawAmount || rawAmount < 0) {
    throw createHttpError(422, "XP amount must be greater than zero.");
  }
  const amount = direction === "remove" ? -rawAmount : rawAmount;
  const reason = sanitizeOptionalText(payload.reason, 255) || (direction === "remove" ? "Admin removed XP" : "Admin added XP");
  const updated = await databaseClient.adjustUserXpByAdmin({
    user_id: userId,
    admin_id: auth.user.id,
    amount,
    type: direction === "remove" ? "admin_remove" : "admin_add",
    reason,
    ip_address: getRequestIp(req)
  });
  if (!updated) {
    throw createHttpError(404, "User not found.");
  }
  sendJson(req, res, 200, {
    success: true,
    data: {
      user: buildApiUser(updated)
    }
  });
}

async function handleAdminSubscriptions(req, res) {
  await requireAdminUser(req);
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const items = typeof databaseClient.listSubscriptions === "function"
    ? await databaseClient.listSubscriptions({
      status: sanitizeOptionalText(url.searchParams.get("status"), 40),
      limit: Math.max(1, Math.min(Number(url.searchParams.get("limit") || 80), 250))
    })
    : [];
  sendJson(req, res, 200, {
    success: true,
    data: { items }
  });
}

async function handleAdminAssignPlan(req, res) {
  const auth = await requireAdminUser(req);
  if (typeof databaseClient.assignPackageToUser !== "function") {
    throw createHttpError(501, "Assigning plans is not available.");
  }
  const payload = await parseJsonBody(req);
  const userId = Number(payload.user_id || payload.userId);
  const planKey = sanitizeOptionalText(payload.plan_key || payload.planKey || payload.package_key || payload.packageKey, 80);
  const packageId = payload.package_id || payload.packageId;
  const expiresAtText = sanitizeOptionalText(payload.expires_at || payload.expiresAt || payload.package_expires_at || payload.packageExpiresAt, 80);
  let expiresAt = null;
  if (expiresAtText) {
    expiresAt = new Date(expiresAtText);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      throw createHttpError(422, "expires_at must be a future date.");
    }
  }
  const durationDays = expiresAt
    ? Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000))
    : Math.max(1, Math.round(Number(payload.duration_days || payload.durationDays || 30) || 30));
  if (!userId || (!planKey && !packageId)) {
    throw createHttpError(422, "user_id and plan_key are required.");
  }

  const before = typeof databaseClient.findUserById === "function" ? await databaseClient.findUserById(userId) : null;
  const updated = await databaseClient.assignPackageToUser({
    user_id: userId,
    package_id: packageId,
    package_key: planKey,
    duration_days: durationDays,
    expires_at: expiresAt ? expiresAt.toISOString() : null
  });
  if (!updated) {
    throw createHttpError(404, "User or plan not found.");
  }
  if (Number(updated.package_price_sar || updated.packagePriceSar || 0) > 0 && typeof databaseClient.markReferralConverted === "function") {
    const referral = await databaseClient.markReferralConverted({
      referred_user_id: userId,
      referrer_reward_xp: AI_REFERRAL_REWARD_XP,
      referred_reward_xp: AI_REFERRED_BONUS_XP,
      metadata: {
        package_key: updated.package_key || planKey || null,
        package_name: updated.package_name || null,
        price_sar: Number(updated.package_price_sar || 0),
        assigned_by_admin: auth.user?.id || null
      }
    });
    if (referral) {
      recordBusinessEventSafe(req, {
        event_type: "referral_converted",
        reason: "paid_plan_assigned",
        plan: getUserPlanKey(updated),
        metadata: {
          referral_id: referral.id,
          referrer_user_id: referral.referrer_user_id,
          referred_user_id: referral.referred_user_id,
          reward_xp: referral.reward_amount
        }
      });
    }
  }

  await recordAdminAction(req, auth, "ASSIGN_PLAN", "user", userId, {
    before: buildApiUser(before),
    after: buildApiUser(updated),
    planKey,
    packageId,
    durationDays,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    sendEmail: Boolean(payload.send_email || payload.sendEmail)
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      user: buildApiUser(updated)
    }
  });
}

async function handleAdminXpLedger(req, res) {
  await requireAdminUser(req);
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const items = typeof databaseClient.listXpLedger === "function"
    ? await databaseClient.listXpLedger({
      user_id: sanitizeOptionalText(url.searchParams.get("user_id") || url.searchParams.get("userId"), 40),
      limit: Math.max(1, Math.min(Number(url.searchParams.get("limit") || 100), 500))
    })
    : [];
  sendJson(req, res, 200, {
    success: true,
    data: { items }
  });
}

async function handleAdminLogs(req, res) {
  await requireAdminUser(req);
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const items = typeof databaseClient.listAdminLogs === "function"
    ? await databaseClient.listAdminLogs({
      limit: Math.max(1, Math.min(Number(url.searchParams.get("limit") || 100), 500))
    })
    : [];
  sendJson(req, res, 200, {
    success: true,
    data: { items: items.map((item) => securityCompliance.redactDeep(item, { redactPii: true })) }
  });
}

async function handleAdminSecurityAudit(req, res) {
  await requireAdminUser(req);
  const snapshot = securityCompliance.buildSecurityAuditSnapshot({
    env: process.env,
    databaseConnected: Boolean(databaseState?.connected),
    corsAllowAll: parseAllowedOrigins().allowAll,
    isCloudRuntime: IS_CLOUD_RUNTIME,
    securityHeadersEnabled: true,
    csrfProtectionEnabled: true,
    adminActionLogsEnabled: true,
    privacyControlsEnabled: Boolean(databaseClient && typeof databaseClient.getUserPrivacySnapshot === "function"),
    retentionJobEnabled: Boolean(databaseClient && typeof databaseClient.applyDataRetentionPolicy === "function"),
    fileUploadSafetyEnabled: true,
    promptInjectionProtectionEnabled: true,
    rbacEnabled: true,
    rateLimitsEnabled: true
  });
  snapshot.headers = securityCompliance.buildSecurityHeaders({ isCloud: IS_CLOUD_RUNTIME, isHttps: true });
  snapshot.cors = {
    allow_all: CORS_ALLOWED_ORIGINS === "*" && !IS_CLOUD_RUNTIME,
    configured_origins: parseAllowedOrigins().values || []
  };
  sendJson(req, res, 200, {
    success: true,
    data: snapshot
  });
}

async function handleAdminPermissions(req, res) {
  const auth = await requireAdminUser(req);
  sendJson(req, res, 200, {
    success: true,
    data: {
      current_role: getUserRbacRole(auth.user),
      permissions: getUserPermissions(auth.user),
      roles: securityCompliance.ROLE_PERMISSIONS,
      route_permissions: {
        "/api/admin/*": "admin:read",
        "/api/admin/security-audit": "security:read",
        "/api/admin/logs": "action_logs:read",
        "/api/admin/permissions": "security:read",
        "/api/admin/compliance/retention/run": "retention:run",
        "/api/privacy/*": "self:*"
      }
    }
  });
}

async function handleAdminCompliance(req, res) {
  await requireAdminUser(req);
  sendJson(req, res, 200, {
    success: true,
    data: {
      retention_policy: securityCompliance.DATA_RETENTION_POLICY,
      privacy_documents: [
        "/docs/privacy-policy.md",
        "/docs/terms-of-service.md",
        "/docs/data-processing-overview.md",
        "/docs/security-overview.md"
      ]
    }
  });
}

async function handleAdminRetentionRun(req, res) {
  const auth = await requireAdminUser(req);
  if (!databaseClient || typeof databaseClient.applyDataRetentionPolicy !== "function") {
    throw createHttpError(503, "Data retention is unavailable.");
  }
  const result = await databaseClient.applyDataRetentionPolicy(securityCompliance.DATA_RETENTION_POLICY);
  await recordAdminAction(req, auth, "RUN_DATA_RETENTION", "compliance", "retention_policy", result);
  sendJson(req, res, 200, {
    success: true,
    data: result
  });
}

async function handlePrivacyMe(req, res) {
  const auth = await requireAuthenticatedUser(req);
  if (!databaseClient || typeof databaseClient.getUserPrivacySnapshot !== "function") {
    throw createHttpError(503, "Privacy controls are unavailable.");
  }
  const snapshot = await databaseClient.getUserPrivacySnapshot(auth.user.id);
  sendJson(req, res, 200, {
    success: true,
    data: snapshot
  });
}

async function handlePrivacyExport(req, res) {
  const auth = await requireAuthenticatedUser(req);
  if (!databaseClient || typeof databaseClient.exportUserData !== "function") {
    throw createHttpError(503, "Privacy export is unavailable.");
  }
  const payload = await databaseClient.exportUserData(auth.user.id);
  sendJson(req, res, 200, {
    success: true,
    data: payload
  });
}

async function handlePrivacySettings(req, res) {
  const auth = await requireAuthenticatedUser(req);
  if (!databaseClient || typeof databaseClient.updateUserPrivacySettings !== "function") {
    throw createHttpError(503, "Privacy settings are unavailable.");
  }
  const payload = await parseJsonBody(req);
  const updated = await databaseClient.updateUserPrivacySettings(auth.user.id, {
    allow_conversation_improvement: payload.allow_conversation_improvement ?? payload.allowConversationImprovement,
    memory_enabled: payload.memory_enabled ?? payload.memoryEnabled,
    allow_product_analytics: payload.allow_product_analytics ?? payload.allowProductAnalytics
  });
  await recordBusinessEventSafe(req, {
    event_type: "privacy_settings_updated",
    reason: "user_request",
    plan: getUserPlanKey(updated || auth.user),
    metadata: {
      allow_conversation_improvement: updated?.allow_conversation_improvement !== false,
      memory_enabled: updated?.memory_enabled !== false
    }
  });
  sendJson(req, res, 200, {
    success: true,
    data: { user: buildApiUser(updated || auth.user) }
  });
}

async function handlePrivacyClearMemory(req, res) {
  const auth = await requireAuthenticatedUser(req);
  if (!databaseClient || typeof databaseClient.clearUserMemory !== "function") {
    throw createHttpError(503, "Memory controls are unavailable.");
  }
  const result = await databaseClient.clearUserMemory(auth.user.id);
  await recordBusinessEventSafe(req, {
    event_type: "privacy_memory_cleared",
    reason: "user_request",
    plan: getUserPlanKey(auth.user),
    metadata: result
  });
  sendJson(req, res, 200, {
    success: true,
    data: result
  });
}

async function handlePrivacyDeleteAccount(req, res) {
  const auth = await requireAuthenticatedUser(req);
  if (!databaseClient || typeof databaseClient.anonymizeUserAccount !== "function") {
    throw createHttpError(503, "Account deletion is unavailable.");
  }
  const result = await databaseClient.anonymizeUserAccount(auth.user.id);
  if (auth?.tokenHash && isDatabaseReady()) {
    await databaseClient.revokeApiToken(auth.tokenHash).catch(() => null);
  }
  clearAuthCookie(res);
  await recordBusinessEventSafe(req, {
    event_type: "account_deleted",
    reason: "privacy_request",
    plan: getUserPlanKey(auth.user),
    metadata: {
      deleted: Boolean(result?.deleted)
    }
  });
  sendJson(req, res, 200, {
    success: true,
    data: result
  });
}

async function handleAdminLogout(req, res) {
  const auth = await requireAdminUser(req);
  if (auth?.tokenHash && isDatabaseReady()) {
    await databaseClient.revokeApiToken(auth.tokenHash);
  }
  await recordAdminAction(req, auth, "ADMIN_LOGOUT", "admin", auth.user.id, {});
  clearAuthCookie(res);
  sendJson(req, res, 200, {
    success: true,
    message: "Logged out successfully."
  });
}

async function handleAdminCreatePackage(req, res) {
  const auth = await requireAdminUser(req);
  if (typeof databaseClient.createPackage !== "function") {
    throw createHttpError(501, "Package creation is not available.");
  }
  const payload = await parseJsonBody(req);
  const item = await databaseClient.createPackage({
    package_key: requireTextField(payload.package_key || payload.key, "key", 80).toLowerCase().replace(/\s+/g, "_"),
    display_name: requireTextField(payload.display_name || payload.name, "name", 160),
    daily_xp: Math.max(0, Math.round(Number(payload.daily_xp ?? payload.dailyXp ?? 0) || 0)),
    price_sar: Math.max(0, Number(payload.price_sar ?? payload.priceSar ?? payload.monthly_price ?? 0) || 0),
    duration_days: Math.max(0, Math.round(Number(payload.duration_days ?? payload.durationDays ?? 30) || 30)),
    summary: sanitizeOptionalText(payload.summary, 500) || "",
    benefits: Array.isArray(payload.benefits) ? payload.benefits : String(payload.benefits || "").split(/\r?\n+/).map((entry) => entry.trim()).filter(Boolean),
    is_active: payload.is_active ?? payload.isActive ?? true,
    sort_order: Math.max(0, Math.round(Number(payload.sort_order ?? payload.sortOrder ?? 99) || 99))
  });

  if (!item) {
    throw createHttpError(422, "Could not create package.");
  }

  await recordAdminAction(req, auth, "CREATE_PLAN", "plan", item.id, {
    before: null,
    after: item
  });
  sendJson(req, res, 201, {
    success: true,
    data: { item }
  });
}

async function handleAssistantV3(req, res) {
  return handleAssistantV3Protected(req, res);
  /*
  const payload = await parseJsonBody(req);
  const message = String(payload.message || payload.query || payload.prompt || "").trim();

  if (!message) {
    sendJson(req, res, 400, {
      ok: false,
      error: "MISSING_MESSAGE"
    });
    return;
  }

  if (!OPENAI_API_KEY) {
    sendJson(req, res, 500, {
      ok: false,
      error: "MISSING_OPENAI_API_KEY"
    });
    return;
  }

  const endpoint = OPENAI_RESPONSES_ENDPOINT || "https://api.openai.com/v1/responses";
  const model = "gpt-4o-mini";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: `أجب عن السؤال التالي بشكل مفيد وواضح. إذا كان يحتاج معلومات حديثة، وضح أن الإجابة قد لا تكون محدثة:\n\n${message}`
      }),
      signal: controller.signal
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) {
      sendJson(req, res, response.status || 500, {
        ok: false,
        error: "ASSISTANT_V3_FAILED",
        message: data?.error?.message || data?.message || data?.error || "OpenAI request failed",
        status: response.status || null,
        code: data?.error?.code || null,
        type: data?.error?.type || null
      });
      return;
    }

    sendJson(req, res, 200, {
      ok: true,
      provider: "openai",
      model,
      answer: data.output_text || "No answer returned"
    });
  } catch (error) {
    sendJson(req, res, error?.name === "AbortError" ? 504 : 500, {
      ok: false,
      error: "ASSISTANT_V3_FAILED",
      message: error?.message || "Unknown error",
      status: error?.status || null,
      code: error?.code || null,
      type: error?.type || null
    });
  } finally {
    clearTimeout(timeoutId);
  }
  */
}

async function handleAssistantV3Protected(req, res) {
  const startedAt = Date.now();
  const payload = await parseJsonBody(req);
  const message = String(payload.message || payload.query || payload.prompt || "").trim();

  if (!message) {
    sendJson(req, res, 400, {
      ok: false,
      error: "MISSING_MESSAGE"
    });
    return;
  }

  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgressSafely(auth.user, "استخدم المساعد الذكي") : null;
  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to use assistant search.");
  }
  req.__businessContext = {
    user: activeUser,
    plan: getUserPlanKey(activeUser),
    route: "/api/assistant-v3",
    operation: "assistant_v3",
    message
  };
  const abuseSignal = await enforceAiAbuseProtection(req, {
    user: activeUser,
    message,
    operation: "assistant_v3",
    plan: getUserPlanKey(activeUser)
  });

  const deepSearch = Boolean(payload.deep || payload.deep_search || payload.deepSearch || payload.advanced);
  const requestedModel = normalizeSelectedModel(payload.selected_model || payload.selectedModel || payload.model || "orlixor");
  const usageStatsBefore = await getUserUsageStats(activeUser);
  const routing = routeModelForUser({
    user: activeUser,
    requestedModel,
    message,
    attachmentCount: 0,
    attachmentNames: [],
    operation: "chat"
  });
  if (abuseSignal?.shadowLimit) {
    routing.modelProfile.maxOutputTokens = Math.min(Number(routing.modelProfile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 360);
    routing.modelProfile.maxContextTokens = Math.min(Number(routing.modelProfile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS), FREE_MAX_CONTEXT_TOKENS);
    routing.routeReason = `${routing.routeReason}|shadow_limit`;
  }
  await enforceModelUsageLimits(activeUser, routing, {
    confirmOverage: Boolean(payload.confirm_overage || payload.confirmOverage)
  });
  await enforceAiProductionGuardrails(activeUser, routing, {
    operation: "assistant_v3",
    attachmentCount: 0
  });

  const modelProfile = applyUserModelLimits(routing.modelProfile, activeUser);
  const overageXpCost = Math.max(0, Number(routing.extraXpCost || 0));
  const xpCost = deepSearch ? SEARCH_DEEP_XP_COST : SEARCH_XP_COST;
  const currentXp = Math.max(0, Number(activeUser.xp || 0));
  const totalXpCost = xpCost + overageXpCost;
  if (currentXp < totalXpCost) {
    throw createPublicHttpError(402, "INSUFFICIENT_XP", `Insufficient XP balance. This request needs ${totalXpCost} XP.`, {
      plan: routing.planKey,
      requiredXp: totalXpCost,
      currentXp,
      upsell: buildSmartUpsell({ plan: routing.planKey, code: "INSUFFICIENT_XP", analysis: routing.intelligence })
    });
  }

  const assistantKnowledge = await getRetrievedKnowledgeContext({
    message,
    analysis: routing.intelligence,
    user: activeUser
  });
  const prompt = buildResponsesInput([
    {
      role: "system",
      content: aiIntelligence.buildDynamicSystemPrompt({
        basePrompt: [
          "أجب عن سؤال المستخدم بشكل مفيد وواضح ومختصر.",
          "إذا كان السؤال يحتاج معلومات حديثة فوضح أن الإجابة قد لا تكون محدثة.",
          "لا تذكر تفاصيل داخلية عن النماذج أو مزودات API."
        ].join("\n"),
        analysis: routing.intelligence,
        planKey: routing.planKey,
        ragContext: assistantKnowledge.context
      })
    },
    {
      role: "user",
      content: message
    }
  ]);
  const cacheKey = buildModelCacheKey({ user: activeUser, routing, messages: prompt });
  const cachedResult = await getCachedModelResponseAny(cacheKey, {
    plan: routing.planKey,
    model: routing.modelKey,
    message
  });
  const result = cachedResult || await withAiQueueSlot({ routing, operation: "assistant_v3" }, () => callAiWithSessionRecovery({
    modelProfile,
    routing,
    operation: "assistant_v3",
    input: prompt
  }));
  if (!cachedResult) {
    await setCachedModelResponseAny(cacheKey, result, {
      plan: routing.planKey,
      model: routing.modelKey,
      message
    });
  }

  const answer = sanitizeModelDisplayText(result.text);
  if (!answer) {
    throw createHttpError(502, "Assistant returned an empty response.");
  }
  const quality = aiIntelligence.scoreResponse({
    answer,
    usage: result.usage,
    latencyMs: Date.now() - startedAt,
    cached: Boolean(cachedResult)
  });
  const provider = normalizeProviderKey(result.provider || resolveProfileProvider(modelProfile));
  const totalCostEstimateUsd = estimateAiCostUsd(provider, result.usage);
  realScaleInfra.recordAiRequest({
    provider,
    model: routing.modelKey,
    plan: routing.planKey,
    routeReason: routing.routeReason,
    ragUsed: assistantKnowledge.sources.length > 0,
    latencyMs: Date.now() - startedAt,
    costUsd: totalCostEstimateUsd,
    cached: Boolean(cachedResult)
  });
  await notifyUsageSignals(req, {
    user: activeUser,
    routing,
    stats: usageStatsBefore,
    usage: result.usage,
    xpCost: totalXpCost,
    quality,
    result
  });
  await recordKnowledgeExpansionCandidate(req, {
    message,
    routing,
    ragSources: assistantKnowledge.sources.length
  });

  const chargedUser = await chargeUserForMessage(
    activeUser,
    totalXpCost,
    deepSearch ? "استخدم البحث المتقدم" : "استخدم المساعد الذكي"
  );

  if (isDatabaseReady() && typeof databaseClient.saveToolUsage === "function") {
    await databaseClient.saveToolUsage({
      user_id: activeUser.id,
      tool_key: "assistant_v3",
      task_type: deepSearch ? "advanced_search" : "search",
      input_text: message,
      output_text: answer,
      xp_cost: totalXpCost,
      input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
    metadata: {
        model_key: routing.modelKey,
        provider,
        provider_model: resolveProviderModel(modelProfile, provider),
        plan: routing.planKey,
        cache_hit: Boolean(cachedResult),
        prompt_key: routing.promptKey,
        task_type: routing.taskType,
        route_reason: routing.routeReason,
        rag_used: assistantKnowledge.sources.length > 0,
        rag_sources: assistantKnowledge.sources.length,
        total_cost_estimate_usd: totalCostEstimateUsd,
        safe_mode: Boolean(routing.safeModeActive),
        provider_fallback: result.fallback || null,
        queue: result.queue || null
      }
    });
  }

  if (isDatabaseReady() && typeof databaseClient.recordAiQualityEvent === "function") {
    await databaseClient.recordAiQualityEvent({
      user_id: activeUser.id,
      task_type: routing.taskType,
      question_type: routing.questionType,
      model_key: routing.modelKey,
      provider,
      prompt_key: routing.promptKey,
      prompt_version: "v1",
      quality_score: quality.qualityScore,
      accuracy_score: quality.accuracyScore,
      length_score: quality.lengthScore,
      speed_score: quality.speedScore,
      satisfaction_score: quality.satisfactionScore,
      cost_score: quality.costScore,
      latency_ms: Date.now() - startedAt,
      input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
      token_cost: quality.tokenCost,
      xp_cost: totalXpCost,
      was_cached: Boolean(cachedResult),
      metadata: {
        request_analysis: routing.intelligence,
        user_id: activeUser.id,
        plan: routing.planKey,
        model: routing.modelKey,
        provider,
        route_reason: routing.routeReason,
        rag_used: assistantKnowledge.sources.length > 0,
        quality_score: quality.qualityScore,
        total_cost_estimate_usd: totalCostEstimateUsd,
        cost_guardrails: routing.costGuardrails || null,
        safe_mode: Boolean(routing.safeModeActive),
        provider_fallback: result.fallback || null,
        queue: result.queue || null,
        rag_sources: assistantKnowledge.sources.length
      }
    });
  }

  recordBusinessEventSafe(req, {
    event_type: "ai_request_success",
    reason: routing.taskType,
    plan: routing.planKey,
    metadata: {
      model_key: routing.modelKey,
      provider,
      rag_used: assistantKnowledge.sources.length > 0,
      cost_usd: totalCostEstimateUsd,
      latency_ms: Date.now() - startedAt,
      quality_score: quality.qualityScore,
      abuse_shadow_limit: Boolean(abuseSignal?.shadowLimit),
      provider_fallback: result.fallback || null,
      queue: result.queue || null
    }
  });

  sendJson(req, res, 200, {
    ok: true,
    provider,
    model: resolveProviderModel(modelProfile, provider),
    model_key: routing.modelKey,
    plan: routing.planKey,
    queue_priority: routing.queuePriority,
    queue: result.queue || null,
    fallback: result.fallback || null,
    cache_hit: Boolean(cachedResult),
    answer,
    intelligence: {
      quality_score: quality.qualityScore,
      prompt_key: routing.promptKey,
      task_type: routing.taskType,
      question_type: routing.questionType,
      rag_sources: assistantKnowledge.sources.length,
      safe_mode: Boolean(routing.safeModeActive)
    },
    usage: {
      xp_spent: totalXpCost,
      xp_remaining: Math.max(0, Number(chargedUser?.xp ?? activeUser.xp ?? 0)),
      overage_xp_spent: overageXpCost,
      overage_tokens: Number(routing.extraTokens || 0),
      input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
      daily_token_limit: routing.limits.dailyTokens,
      monthly_token_limit: routing.limits.monthlyTokens,
      per_message_token_limit: routing.limits.perMessageTokens
    }
  });
}

async function handleToneTool(req, res) {
  const payload = await parseJsonBody(req);
  const text = requireTextField(payload.text || payload.input_text || payload.inputText, "text", 4000);
  const tone = normalizeToneKey(payload.tone);
  const level = normalizeToneLevel(payload.level);
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgressSafely(auth.user, "استخدم تغيير النبرة") : null;

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
  const activeUser = auth?.user ? await syncUserDailyProgressSafely(auth.user, "استخدم التصحيح اللغوي") : null;

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
  const activeUser = auth?.user ? await syncUserDailyProgressSafely(auth.user, "استخدم توسيع النص") : null;

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
  const activeUser = auth?.user ? await syncUserDailyProgressSafely(auth.user, "استخدم تلخيص النص") : null;

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

async function handleImproveStyleTool(req, res) {
  const payload = await parseJsonBody(req);
  const text = requireTextField(payload.text || payload.input_text || payload.inputText, "text", 5000);
  const goal = normalizeStyleGoal(payload.goal || payload.styleGoal || payload.style_goal);
  const level = normalizeStyleLevel(payload.level || payload.styleLevel || payload.style_level);
  const keepMeaning = payload.keepMeaning !== false && payload.keep_meaning !== false;
  const audience = sanitizeOptionalText(payload.audience, 80) || "عام";
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgressSafely(auth.user, "استخدم تحسين الأسلوب") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to improve style.");
  }

  if (text.trim().length < 10) {
    throw createHttpError(422, "Text is too short to improve style.");
  }

  if (text.length > 5000) {
    throw createHttpError(413, "Text is too long. Please shorten it.");
  }

  const xpCost = level === "deep" || text.length > 2500 ? STYLE_DEEP_XP_COST : STYLE_XP_COST;
  const currentXp = Math.max(0, Number(activeUser.xp || 0));
  if (currentXp < xpCost) {
    throw createHttpError(402, `Insufficient XP balance. Style improvement needs ${xpCost} XP.`);
  }

  const profile = getStyleProfile(activeUser, level);
  const result = await callOpenAI({
    modelProfile: profile,
    input: buildResponsesInput(buildStylePrompt({ text, goal, level, keepMeaning, audience }))
  });
  const output = sanitizeModelDisplayText(result.text);

  if (!output) {
    throw createHttpError(502, "Style improver returned an empty response.");
  }

  const chargedUser = await chargeUserForMessage(
    activeUser,
    xpCost,
    `استخدم تحسين الأسلوب (${STYLE_GOALS[goal].label})`
  );

  if (isDatabaseReady() && typeof databaseClient.saveToolUsage === "function") {
    await databaseClient.saveToolUsage({
      user_id: activeUser.id,
      tool_key: "writing_assistant",
      task_type: "style",
      input_text: text,
      output_text: output,
      xp_cost: xpCost,
      input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
      metadata: {
        goal,
        goal_label: STYLE_GOALS[goal].label,
        level,
        level_label: STYLE_LEVELS[level].label,
        keep_meaning: keepMeaning,
        audience
      }
    });
  }

  sendJson(req, res, 200, {
    success: true,
    data: {
      output,
      goal,
      level,
      keep_meaning: keepMeaning,
      audience,
      task_type: "style",
      tool: "style_improver",
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
  const requestedLength = sanitizeOptionalText(options.length || options.lengthText || options.outputLength, 120) || "medium";
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgressSafely(auth.user, "استخدم مساعد الكتابة") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to use the writing assistant.");
  }

  const xpCost = calculateWritingXpCost(taskType, inputText, details, requestedLength);
  const currentXp = Math.max(0, Number(activeUser.xp || 0));

  if (currentXp < xpCost) {
    throw createHttpError(402, `Insufficient XP balance. Writing assistant needs ${xpCost} XP.`);
  }

  const profile = getWritingProfile(taskType, activeUser);
  profile.maxOutputTokens = getWritingMaxOutputTokens(requestedLength || options.length);
  if (isFreeUser(activeUser)) {
    profile.maxOutputTokens = Math.min(profile.maxOutputTokens, 600);
  }
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
        length: requestedLength
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

async function saveImageToolUsage({ user, taskType, inputText = "", outputText = "", xpCost = 0, usage = {}, metadata = {} }) {
  if (!isDatabaseReady() || typeof databaseClient.saveToolUsage !== "function" || !user?.id) return;
  try {
    await databaseClient.saveToolUsage({
      user_id: user.id,
      tool_key: "image_system",
      task_type: taskType,
      input_text: String(inputText || "").slice(0, 4000),
      output_text: String(outputText || "").slice(0, 4000),
      xp_cost: xpCost,
      input_tokens: Number(usage?.input_tokens || usage?.prompt_tokens || 0),
      output_tokens: Number(usage?.output_tokens || usage?.completion_tokens || 0),
      metadata
    });
  } catch (error) {
    console.warn("Image tool usage write failed:", error?.message || error);
  }
}

async function handleImageAnalyze(req, res) {
  const activeUser = await getActiveImageTaskUser(req, "استخدم تحليل الصور");
  const xpCost = IMAGE_XP_COSTS.analyze;
  await enforceImageUsageLimit(activeUser, "analyze");
  ensureUserCanSpendXp(activeUser, xpCost, "تحليل الصور");

  const { fields, files } = await parseMultipartFormData(req, {
    maxBytes: IMAGE_TOOL_MAX_FILE_SIZE + IMAGE_PROMPT_MAX_LENGTH + 64 * 1024,
    maxFileBytes: IMAGE_TOOL_MAX_FILE_SIZE
  });
  const imageFile = validateImageUpload(getMultipartImageFile(files));
  const prompt = String(fields.prompt || "").trim().slice(0, IMAGE_PROMPT_MAX_LENGTH)
    || "حلل هذه الصورة بالتفصيل، وإذا كان فيها نص فاقرأه، وإذا كانت واجهة فاشرح عناصرها.";

  const imagePlan = getPlanLimits(activeUser);
  req.__businessContext = {
    user: activeUser,
    plan: imagePlan.planKey,
    route: "/api/images/analyze",
    operation: "image_analyze",
    message: prompt
  };
  await enforceAiAbuseProtection(req, {
    user: activeUser,
    message: prompt,
    operation: "image_analyze",
    plan: imagePlan.planKey
  });
  const usageStatsBefore = await getUserUsageStats(activeUser);
  const result = await callImageAnalysisModel({ imageFile, prompt, user: activeUser });
  const chargedUser = await chargeUserForMessage(activeUser, xpCost, "استخدم تحليل الصور");

  await saveImageToolUsage({
    user: chargedUser || activeUser,
    taskType: "analyze",
    inputText: prompt,
    outputText: result.output,
    xpCost,
    usage: result.usage,
    metadata: {
      filename: sanitizeOptionalText(imageFile.filename, 160),
      mimetype: imageFile.mimetype,
      file_size: imageFile.size
    }
  });
  await notifyUsageSignals(req, {
    user: activeUser,
    routing: { planKey: imagePlan.planKey, limits: imagePlan.limits, safeModeActive: false },
    stats: usageStatsBefore,
    usage: result.usage,
    xpCost
  });
  recordBusinessEventSafe(req, {
    event_type: "ai_request_success",
    reason: "image_analyze",
    plan: imagePlan.planKey,
    metadata: {
      route: "/api/images/analyze",
      xp_cost: xpCost,
      file_size: imageFile.size
    }
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      output: result.output,
      usage: result.usage,
      xp_spent: xpCost,
      xp_remaining: Math.max(0, Number(chargedUser?.xp || activeUser.xp || 0)),
      user: chargedUser ? buildApiUser(chargedUser) : buildApiUser(activeUser)
    }
  });
}

async function handleImageGenerate(req, res) {
  const activeUser = await getActiveImageTaskUser(req, "استخدم إنشاء الصور");
  const payload = await parseJsonBody(req);
  const prompt = requireTextField(payload.prompt, "prompt", IMAGE_PROMPT_MAX_LENGTH);
  const requestedQuality = normalizeImageTaskQuality(payload.quality);
  const size = normalizeImageSize(payload.size);
  const { planKey, limits } = getPlanLimits(activeUser);
  req.__businessContext = {
    user: activeUser,
    plan: planKey,
    route: "/api/images/generate",
    operation: "image_generate",
    message: prompt
  };
  await enforceAiAbuseProtection(req, {
    user: activeUser,
    message: prompt,
    operation: "image_generate",
    plan: planKey
  });
  const usageStatsBefore = await getUserUsageStats(activeUser);

  if (requestedQuality === "high" && !canUseHighImageQuality(activeUser)) {
    throw createHttpError(403, "الجودة العالية متاحة لباقة الرائد والأعمال فقط.");
  }

  const xpCost = requestedQuality === "high" ? IMAGE_XP_COSTS.generate_high : IMAGE_XP_COSTS.generate_standard;
  await enforceImageUsageLimit(activeUser, "generate");
  ensureUserCanSpendXp(activeUser, xpCost, "إنشاء الصور");

  const result = await callImageGenerationModel({
    prompt,
    size,
    quality: requestedQuality,
    user: activeUser
  });
  const chargedUser = await chargeUserForMessage(
    activeUser,
    xpCost,
    requestedQuality === "high" ? "استخدم إنشاء الصور بجودة عالية" : "استخدم إنشاء الصور"
  );

  await saveImageToolUsage({
    user: chargedUser || activeUser,
    taskType: "generate",
    inputText: prompt,
    outputText: result.image.revised_prompt || "image_generated",
    xpCost,
    usage: result.usage,
    metadata: {
      size,
      quality: requestedQuality,
      result_type: result.image.url ? "url" : "base64"
    }
  });
  await notifyUsageSignals(req, {
    user: activeUser,
    routing: { planKey, limits, safeModeActive: false },
    stats: usageStatsBefore,
    usage: result.usage,
    xpCost
  });
  recordBusinessEventSafe(req, {
    event_type: "ai_request_success",
    reason: "image_generate",
    plan: planKey,
    metadata: {
      route: "/api/images/generate",
      quality: requestedQuality,
      size,
      xp_cost: xpCost
    }
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      image: result.image,
      images: [result.image],
      size,
      quality: requestedQuality,
      usage: result.usage,
      xp_spent: xpCost,
      xp_remaining: Math.max(0, Number(chargedUser?.xp || activeUser.xp || 0)),
      user: chargedUser ? buildApiUser(chargedUser) : buildApiUser(activeUser)
    }
  });
}

async function handleImageEdit(req, res) {
  const activeUser = await getActiveImageTaskUser(req, "استخدم تعديل الصور");
  const xpCost = IMAGE_XP_COSTS.edit;
  await enforceImageUsageLimit(activeUser, "edit");
  ensureUserCanSpendXp(activeUser, xpCost, "تعديل الصور");

  const { fields, files } = await parseMultipartFormData(req, {
    maxBytes: IMAGE_TOOL_MAX_FILE_SIZE + IMAGE_PROMPT_MAX_LENGTH + 64 * 1024,
    maxFileBytes: IMAGE_TOOL_MAX_FILE_SIZE
  });
  const imageFile = validateImageUpload(getMultipartImageFile(files));
  const prompt = requireTextField(fields.prompt || fields.instructions || fields.text, "prompt", IMAGE_PROMPT_MAX_LENGTH);
  const requestedQuality = normalizeImageTaskQuality(fields.quality);
  const size = normalizeImageSize(fields.size);

  if (requestedQuality === "high" && !canUseHighImageQuality(activeUser)) {
    throw createHttpError(403, "الجودة العالية متاحة لباقة الرائد والأعمال فقط.");
  }

  const imagePlan = getPlanLimits(activeUser);
  req.__businessContext = {
    user: activeUser,
    plan: imagePlan.planKey,
    route: "/api/images/edit",
    operation: "image_edit",
    message: prompt
  };
  await enforceAiAbuseProtection(req, {
    user: activeUser,
    message: prompt,
    operation: "image_edit",
    plan: imagePlan.planKey
  });
  const usageStatsBefore = await getUserUsageStats(activeUser);
  const result = await callImageEditModel({
    imageFile,
    prompt,
    size,
    quality: requestedQuality,
    user: activeUser
  });
  const chargedUser = await chargeUserForMessage(activeUser, xpCost, "استخدم تعديل الصور");

  await saveImageToolUsage({
    user: chargedUser || activeUser,
    taskType: "edit",
    inputText: prompt,
    outputText: result.image.revised_prompt || "image_edited",
    xpCost,
    usage: result.usage,
    metadata: {
      filename: sanitizeOptionalText(imageFile.filename, 160),
      mimetype: imageFile.mimetype,
      file_size: imageFile.size,
      size,
      quality: requestedQuality,
      result_type: result.image.url ? "url" : "base64"
    }
  });
  await notifyUsageSignals(req, {
    user: activeUser,
    routing: { planKey: imagePlan.planKey, limits: imagePlan.limits, safeModeActive: false },
    stats: usageStatsBefore,
    usage: result.usage,
    xpCost
  });
  recordBusinessEventSafe(req, {
    event_type: "ai_request_success",
    reason: "image_edit",
    plan: imagePlan.planKey,
    metadata: {
      route: "/api/images/edit",
      quality: requestedQuality,
      size,
      xp_cost: xpCost,
      file_size: imageFile.size
    }
  });

  sendJson(req, res, 200, {
    success: true,
    data: {
      image: result.image,
      images: [result.image],
      size,
      quality: requestedQuality,
      usage: result.usage,
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
  const attachmentImages = sanitizeAttachmentImages(payload.attachment_images || payload.attachmentImages);
  const attachmentCount = Math.max(
    attachmentNames.length,
    attachmentImages.length,
    Number(payload.attachment_count || payload.attachmentCount || 0) || 0
  );
  const hasOnlyImageAttachments = attachmentCount > 0
    && (attachmentImages.length > 0 || attachmentNames.length > 0)
    && attachmentNames.every(isImageAttachmentName);
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgressSafely(auth.user, "بدأ حل سؤال دقيق") : null;

  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to solve questions.");
  }
  req.__businessContext = {
    user: activeUser,
    plan: getUserPlanKey(activeUser),
    route: "/api/solve-question",
    operation: "solve",
    message: question
  };
  const abuseSignal = await enforceAiAbuseProtection(req, {
    user: activeUser,
    message: question,
    operation: "solve",
    plan: getUserPlanKey(activeUser)
  });

  const requestedModel = normalizeSelectedModel(payload.selected_model || payload.selectedModel || payload.model || "orlixor");
  const routing = routeModelForUser({
    user: activeUser,
    requestedModel,
    message: question,
    attachmentCount,
    attachmentNames,
    operation: "solve"
  });
  if (abuseSignal?.shadowLimit) {
    routing.modelProfile.maxOutputTokens = Math.min(Number(routing.modelProfile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 360);
    routing.modelProfile.maxContextTokens = Math.min(Number(routing.modelProfile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS), FREE_MAX_CONTEXT_TOKENS);
    routing.routeReason = `${routing.routeReason}|shadow_limit`;
  }
  const usageStatsBefore = await getUserUsageStats(activeUser);
  await enforceModelUsageLimits(activeUser, routing, {
    confirmOverage: Boolean(payload.confirm_overage || payload.confirmOverage)
  });
  await enforceAiProductionGuardrails(activeUser, routing, {
    operation: "solve",
    attachmentCount
  });
  const selectedModel = routing.modelKey;
  if (selectedModel === "alpha" && !hasAlphaModelAccess(activeUser)) {
    throw createHttpError(403, "Orlixor AI Alpha متاح لمجموعة تجريبية محدودة فقط.");
  }
  const routingNotice = buildModelRoutingNotice(requestedModel, selectedModel, { message: question, attachmentCount, attachmentNames });
  const modelProfile = applyUserModelLimits(routing.modelProfile, activeUser);

  const overageXpCost = Math.max(0, Number(routing.extraXpCost || 0));
  const preflightXpCost = getPreflightXpCost(modelProfile, attachmentCount, attachmentNames) + overageXpCost;
  const currentXp = Math.max(0, Number(activeUser.xp || 0));
  if (currentXp < preflightXpCost) {
    throw createHttpError(402, `Insufficient XP balance. This request needs ${preflightXpCost} XP.`);
  }

  const solvePrompt = buildSolveSystemPrompt({
    ...payload,
    selected_model: selectedModel,
    modelProfile,
    question,
    grade,
    subject,
    term,
    lesson,
    attachment_images: attachmentImages
  });
  const solveCacheKey = !attachmentImages.length ? buildModelCacheKey({
    user: activeUser,
    routing,
    messages: solvePrompt
  }) : "";
  const solveCachedResult = solveCacheKey ? await getCachedModelResponseAny(solveCacheKey, {
    plan: routing.planKey,
    model: selectedModel,
    message: question
  }) : null;
  const result = solveCachedResult || (attachmentImages.length
    ? await withAiQueueSlot({ routing, operation: "vision_solve" }, () => callOpenAIVision({
        modelProfile,
        messages: [{ role: "user", content: solvePrompt }],
        images: attachmentImages
      }))
    : await withAiQueueSlot({ routing, operation: "solve" }, () => callAiWithSessionRecovery({
        modelProfile,
        routing,
        operation: "solve",
        input: solvePrompt
      })));
  if (!solveCachedResult && solveCacheKey) {
    await setCachedModelResponseAny(solveCacheKey, result, {
      plan: routing.planKey,
      model: selectedModel,
      message: question
    });
  }

  const cleanedSolveText = sanitizeModelDisplayText(result.text);
  const parsed = extractJsonObject(cleanedSolveText);
  const normalized = normalizeSolvePayload(question, parsed || {
    answer: cleanedSolveText,
    explanation: "",
    display_text: cleanedSolveText,
    question_type: "general",
    confidence: 0.72
  });
  const xpCost = calculateFinalXpCost(modelProfile, normalized.display_text || cleanedSolveText, attachmentCount, attachmentNames, result.usage) + overageXpCost;
  const solveQuality = aiIntelligence.scoreResponse({
    answer: normalized.display_text || cleanedSolveText,
    usage: result.usage,
    latencyMs: Date.now() - startedAt,
    cached: Boolean(solveCachedResult)
  });
  const solveProvider = normalizeProviderKey(result.provider || resolveProfileProvider(modelProfile));
  const solveCostEstimateUsd = estimateAiCostUsd(solveProvider, result.usage);
  realScaleInfra.recordAiRequest({
    provider: solveProvider,
    model: selectedModel,
    plan: routing.planKey,
    routeReason: routing.routeReason,
    ragUsed: false,
    latencyMs: Date.now() - startedAt,
    costUsd: solveCostEstimateUsd,
    cached: Boolean(solveCachedResult)
  });
  await notifyUsageSignals(req, {
    user: activeUser,
    routing,
    stats: usageStatsBefore,
    usage: result.usage,
    xpCost,
    quality: solveQuality,
    result
  });
  await recordKnowledgeExpansionCandidate(req, {
    message: question,
    routing,
    ragSources: 0
  });
  const chargedUser = isDatabaseReady()
    ? await chargeUserForMessage(
      activeUser,
      xpCost,
      attachmentCount > 0
        ? (hasOnlyImageAttachments ? `استخدم ${modelProfile.name} لحل سؤال مع صورة` : `استخدم ${modelProfile.name} لحل سؤال مع ملف`)
        : `استخدم ${modelProfile.name} لحل سؤال نصي`
    )
    : activeUser;

  if (isDatabaseReady() && typeof databaseClient.saveToolUsage === "function") {
    await databaseClient.saveToolUsage({
      user_id: activeUser.id,
      tool_key: "solve_question",
      task_type: "solve",
      input_text: question,
      output_text: normalized.display_text || cleanedSolveText,
      xp_cost: xpCost,
      input_tokens: Number(result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      output_tokens: Number(result.usage?.output_tokens || result.usage?.completion_tokens || 0),
      metadata: {
        model_key: selectedModel,
        provider: normalizeProviderKey(result.provider || resolveProfileProvider(modelProfile)),
        plan: routing.planKey,
        route_reason: routing.routeReason,
        provider_fallback: result.fallback || null,
        queue: result.queue || null
      }
    });
  }

  recordBusinessEventSafe(req, {
    event_type: "ai_request_success",
    reason: routing.taskType,
    plan: routing.planKey,
    metadata: {
      route: "/api/solve-question",
      model_key: selectedModel,
      provider: normalizeProviderKey(result.provider || resolveProfileProvider(modelProfile)),
      cost_usd: estimateAiCostUsd(result.provider || resolveProfileProvider(modelProfile), result.usage),
      latency_ms: Date.now() - startedAt,
      quality_score: solveQuality.qualityScore,
      provider_fallback: result.fallback || null,
      queue: result.queue || null
    }
  });

  sendJson(req, res, 200, {
    ...normalized,
    model: {
      key: selectedModel,
      requested_key: requestedModel,
      name: modelProfile.name,
      provider: normalizeProviderKey(result.provider || resolveProfileProvider(modelProfile)),
      provider_model: resolveProviderModel(modelProfile, normalizeProviderKey(result.provider || resolveProfileProvider(modelProfile))),
      plan: routing.planKey,
      queue_priority: routing.queuePriority,
      queue: result.queue || null,
      fallback: result.fallback || null,
      routed: requestedModel !== selectedModel,
      notice: routingNotice
    },
    xp_spent: xpCost,
    overage_xp_spent: overageXpCost,
    overage_tokens: Number(routing.extraTokens || 0),
    remaining_xp: Number(chargedUser?.xp ?? activeUser.xp ?? 0)
  });
}

async function handleChatStream(req, res) {
  const startedAt = Date.now();
  const payload = await parseJsonBody(req);
  const message = requireTextField(payload.message || payload.prompt || payload.text, "message", MAX_MESSAGE_LENGTH);
  const attachmentNames = sanitizeAttachmentNames(payload.attachment_names || payload.attachmentNames);
  const attachmentCount = Math.max(attachmentNames.length, Number(payload.attachment_count || payload.attachmentCount || 0) || 0);
  const auth = await getAuthContext(req);
  const activeUser = auth?.user ? await syncUserDailyProgressSafely(auth.user, "streaming_chat") : null;
  if (!activeUser) {
    throw createHttpError(401, "Authentication is required to use streaming chat.");
  }

  req.__businessContext = {
    user: activeUser,
    plan: getUserPlanKey(activeUser),
    route: "/api/chat/stream",
    operation: "chat_stream",
    message
  };

  const abuseSignal = await enforceAiAbuseProtection(req, {
    user: activeUser,
    message,
    operation: "chat_stream",
    plan: getUserPlanKey(activeUser)
  });
  const requestedModel = normalizeSelectedModel(payload.selected_model || payload.selectedModel || payload.model || "orlixor");
  const routing = routeModelForUser({
    user: activeUser,
    requestedModel,
    message,
    attachmentCount,
    attachmentNames,
    operation: "chat"
  });
  if (abuseSignal?.shadowLimit) {
    routing.modelProfile.maxOutputTokens = Math.min(Number(routing.modelProfile.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS), 360);
    routing.modelProfile.maxContextTokens = Math.min(Number(routing.modelProfile.maxContextTokens || FREE_MAX_CONTEXT_TOKENS), FREE_MAX_CONTEXT_TOKENS);
    routing.routeReason = `${routing.routeReason}|shadow_limit`;
  }

  const usageStatsBefore = await getUserUsageStats(activeUser);
  await enforceModelUsageLimits(activeUser, routing, {
    confirmOverage: Boolean(payload.confirm_overage || payload.confirmOverage)
  });
  await enforceAiProductionGuardrails(activeUser, routing, {
    operation: "chat_stream",
    attachmentCount
  });
  const selectedModel = routing.modelKey;
  const modelProfile = applyUserModelLimits(routing.modelProfile, activeUser);
  const overageXpCost = Math.max(0, Number(routing.extraXpCost || 0));
  const preflightXpCost = getPreflightXpCost(modelProfile, attachmentCount, attachmentNames) + overageXpCost;
  const currentXp = Math.max(0, Number(activeUser.xp || 0));
  if (currentXp < preflightXpCost) {
    throw createHttpError(402, `Insufficient XP balance. This request needs ${preflightXpCost} XP.`);
  }

  const retrievedKnowledge = await getRetrievedKnowledgeContext({
    message,
    analysis: routing.intelligence,
    user: activeUser
  });
  const streamMessages = [
    {
      role: "system",
      content: aiIntelligence.buildDynamicSystemPrompt({
        basePrompt: modelProfile.systemPrompt,
        analysis: routing.intelligence,
        planKey: routing.planKey,
        ragContext: retrievedKnowledge.context
      })
    },
    {
      role: "user",
      content: retrievedKnowledge.context
        ? `${message}\n\nRelevant approved context:\n${retrievedKnowledge.context}`
        : message
    }
  ];
  const cacheKey = buildModelCacheKey({ user: activeUser, routing, messages: streamMessages });

  sendSseHeaders(req, res);
  writeSse(res, "route", {
    model: selectedModel,
    provider: normalizeProviderKey(resolveProfileProvider(modelProfile)),
    plan: routing.planKey,
    route_reason: routing.routeReason,
    rag_used: retrievedKnowledge.sources.length > 0
  });

  try {
    const cachedResult = await getCachedModelResponseAny(cacheKey, {
      plan: routing.planKey,
      model: selectedModel,
      message
    });
    const result = cachedResult || await withAiQueueSlot({ routing, operation: "chat_stream" }, () => callAiWithSessionRecovery({
      modelProfile,
      routing,
      operation: "chat_stream",
      input: buildResponsesInput(streamMessages)
    }));
    if (!cachedResult) {
      await setCachedModelResponseAny(cacheKey, result, {
        plan: routing.planKey,
        model: selectedModel,
        message
      });
    }

    const assistantText = sanitizeModelDisplayText(result.text);
    const xpCost = calculateFinalXpCost(modelProfile, assistantText, attachmentCount, attachmentNames, result.usage) + overageXpCost;
    const quality = aiIntelligence.scoreResponse({
      answer: assistantText,
      usage: result.usage,
      latencyMs: Date.now() - startedAt,
      cached: Boolean(cachedResult)
    });
    const provider = normalizeProviderKey(result.provider || resolveProfileProvider(modelProfile));
    const totalCostEstimateUsd = estimateAiCostUsd(provider, result.usage);
    realScaleInfra.recordAiRequest({
      provider,
      model: selectedModel,
      plan: routing.planKey,
      routeReason: routing.routeReason,
      ragUsed: retrievedKnowledge.sources.length > 0,
      latencyMs: Date.now() - startedAt,
      costUsd: totalCostEstimateUsd,
      cached: Boolean(cachedResult)
    });
    await notifyUsageSignals(req, {
      user: activeUser,
      routing,
      stats: usageStatsBefore,
      usage: result.usage,
      xpCost,
      quality,
      result
    });
    await recordKnowledgeExpansionCandidate(req, {
      message,
      routing,
      ragSources: retrievedKnowledge.sources.length
    });
    const chargedUser = await chargeUserForMessage(activeUser, xpCost, `stream:${modelProfile.name}`);

    writeSse(res, "meta", {
      cached: Boolean(cachedResult),
      xp_spent: xpCost,
      remaining_xp: Number(chargedUser?.xp ?? activeUser.xp ?? 0),
      quality_score: quality.qualityScore,
      usage: result.usage || {},
      fallback: result.fallback || null,
      queue: result.queue || null
    });
    streamTextAsSse(res, assistantText);
    writeSse(res, "done", {
      success: true,
      latency_ms: Date.now() - startedAt
    });
    res.end();
  } catch (error) {
    realScaleInfra.captureError(error, { route: "/api/chat/stream" });
    writeSse(res, "error", {
      success: false,
      code: error?.code || "CHAT_STREAM_FAILED",
      message: error?.message || String(error)
    });
    res.end();
  }
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
    if (userHasPermission(auth.user, "conversations:read")) return true;
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
  let filePath = resolveStaticFile(req.url);
  const requestPath = String(req.url || "/").split("?")[0];
  const appFallbackRoutes = new Set([
    "/tools",
    "/tools/writing-assistant",
    "/writing-assistant"
  ]);
  if (!filePath && appFallbackRoutes.has(requestPath)) {
    filePath = resolveStaticFile("/index.html");
  }
  if (!filePath) {
    sendText(req, res, 404, "Not Found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const headers = { "Content-Type": contentType };
  if (extension === ".html" || extension === ".js" || extension === ".css") {
    headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
    headers.Pragma = "no-cache";
    headers.Expires = "0";
  }
  setSecurityHeaders(req, res);
  setCorsHeaders(req, res);
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

async function routeRequest(req, res) {
  const requestId = buildRequestId();
  req.__requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  if (req.method === "OPTIONS") {
    setSecurityHeaders(req, res);
    setCorsHeaders(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  const requestPath = String(req.url || "/").split("?")[0];

  if (!securityCompliance.isSafeSameOriginRequest(req, isOriginAllowed)) {
    sendJson(req, res, 403, {
      success: false,
      request_id: requestId,
      code: "CSRF_ORIGIN_REJECTED",
      message: "Request origin is not trusted for cookie-authenticated writes."
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/_proof") {
    sendJson(req, res, 200, {
      ok: true,
      proof: "SERVER_FILE_IS_ACTIVE"
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/daily-reward/ping") {
    sendJson(req, res, 200, {
      ok: true,
      message: "DAILY_REWARD_PING_OK"
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/assistant-v3/ping") {
    sendJson(req, res, 200, {
      ok: true,
      message: "PING_OK"
    });
    return;
  }

  if (req.method === "POST" && requestPath === "/api/reward-claim") {
    await handleRewardClaim(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/assistant-v3") {
    await handleAssistantV3Protected(req, res);
    return;
  }

  if (await applyRateLimit(req, res, requestPath)) {
    return;
  }

  if (req.method === "GET" && (requestPath === "/health" || requestPath === "/api/health")) {
    sendJson(req, res, 200, {
      ok: true,
      status: "ok",
      time: new Date().toISOString(),
      request_id: requestId,
      provider: "orlixor",
      ai_configured: Boolean(OPENAI_API_KEY || DEEPSEEK_API_KEY),
      text_ai_configured: Boolean(OPENAI_API_KEY || DEEPSEEK_API_KEY),
      image_ai_configured: Boolean(OPENAI_API_KEY),
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
        image_analyze_xp_cost: IMAGE_XP_COSTS.analyze,
        image_generate_standard_xp_cost: IMAGE_XP_COSTS.generate_standard,
        image_generate_high_xp_cost: IMAGE_XP_COSTS.generate_high,
        image_edit_xp_cost: IMAGE_XP_COSTS.edit,
        image_tool_max_file_size: IMAGE_TOOL_MAX_FILE_SIZE,
        rate_limit_window_ms: RATE_LIMIT_WINDOW_MS,
        rate_limit_chat_max: RATE_LIMIT_CHAT_MAX,
        rate_limit_solve_max: RATE_LIMIT_SOLVE_MAX
      }
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/assistant-v3/debug") {
    sendJson(req, res, 200, {
      ok: true,
      route: "/api/assistant-v3",
      version: ASSISTANT_V3_VERSION,
      provider: DEEPSEEK_API_KEY ? "deepseek" : "openai",
      model: DEEPSEEK_API_KEY ? DEEPSEEK_CHAT_MODEL : (OPENAI_MODEL_DEFAULT || OPENAI_MODEL || "gpt-4.1-mini"),
      hasOpenAIKey: Boolean(OPENAI_API_KEY),
      hasDeepSeekKey: Boolean(DEEPSEEK_API_KEY),
      timestamp: new Date().toISOString(),
      build: process.env.RENDER_GIT_COMMIT ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.RAILWAY_GIT_COMMIT_SHA ||
        "local",
      routes: {
        primary: "/api/assistant-v3",
        legacyRemoved: true
      },
      cache: {
        scripts: "ASSISTANT_V3",
        serviceWorkerDisabled: true
      }
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/openai-search-final/debug") {
    sendJson(req, res, 410, {
      ok: false,
      error: "OLD_SEARCH_DELETED",
      message: "Use /api/assistant-v3/debug"
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/debug-version") {
    sendJson(req, res, 200, {
      version: ASSISTANT_V3_VERSION,
      provider: DEEPSEEK_API_KEY ? "deepseek" : "openai",
      model: DEEPSEEK_API_KEY ? DEEPSEEK_CHAT_MODEL : (OPENAI_MODEL_DEFAULT || OPENAI_MODEL || "gpt-4.1-mini"),
      hasOpenAIKey: Boolean(OPENAI_API_KEY),
      hasDeepSeekKey: Boolean(DEEPSEEK_API_KEY),
      envModel: process.env.MODEL || null,
      aiModel: process.env.AI_MODEL || null,
      llmModel: process.env.LLM_MODEL || null,
      legacyProviderModel: process.env["DEEP" + "SEEK_MODEL"] || null,
      time: new Date().toISOString(),
      build: process.env.RENDER_GIT_COMMIT ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.RAILWAY_GIT_COMMIT_SHA ||
        "local"
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/whoami-final-999") {
    sendJson(req, res, 200, {
      build: OPENAI_ONLY_FINAL_999,
      provider: DEEPSEEK_API_KEY ? "deepseek" : "openai",
      model: DEEPSEEK_API_KEY ? DEEPSEEK_CHAT_MODEL : (OPENAI_MODEL_DEFAULT || OPENAI_MODEL || "gpt-4.1-mini"),
      deepSeekEnabled: Boolean(DEEPSEEK_API_KEY),
      time: new Date().toISOString()
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/proof-openai-only-777") {
    sendJson(req, res, 200, {
      proof: "OPENAI_ONLY_777",
      provider: DEEPSEEK_API_KEY ? "deepseek" : "openai",
      model: DEEPSEEK_API_KEY ? DEEPSEEK_CHAT_MODEL : (OPENAI_MODEL_DEFAULT || OPENAI_MODEL || "gpt-4.1-mini"),
      time: new Date().toISOString()
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/ready") {
    const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    const task = String(url.searchParams.get("task") || "").trim().toLowerCase();
    const textAiConfigured = Boolean(OPENAI_API_KEY || DEEPSEEK_API_KEY);
    const imageAiConfigured = Boolean(OPENAI_API_KEY);
    const requestedAiReady = task === "image" || task === "vision"
      ? imageAiConfigured
      : textAiConfigured;
    const ready = Boolean(databaseState.connected && requestedAiReady);
    sendJson(req, res, ready ? 200 : 503, {
      success: ready,
      request_id: requestId,
      task: task || "text",
      message: ready
        ? "الخادم جاهز."
        : (task === "image" || task === "vision")
          ? "خدمة تحليل الصور غير جاهزة على الخادم الآن. تحقق من OPENAI_API_KEY واتصال الخادم."
          : "خدمة الشات غير جاهزة على الخادم الآن.",
      checks: {
        database_connected: Boolean(databaseState.connected),
        ai_configured: requestedAiReady,
        text_ai_configured: textAiConfigured,
        image_ai_configured: imageAiConfigured,
        openai_configured: Boolean(OPENAI_API_KEY),
        deepseek_configured: Boolean(DEEPSEEK_API_KEY)
      }
    });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/auth/providers") {
    await handleAuthProviders(req, res);
    return;
  }

  if (req.method === "GET" && requestPath.startsWith("/api/auth/provider/")) {
    const provider = decodeURIComponent(requestPath.replace("/api/auth/provider/", ""));
    await handleAuthProviderStart(req, res, provider);
    return;
  }

  if ((req.method === "GET" || req.method === "POST") && requestPath.startsWith("/api/auth/callback/")) {
    const provider = decodeURIComponent(requestPath.replace("/api/auth/callback/", ""));
    await handleAuthProviderCallback(req, res, provider);
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

  if (req.method === "GET" && (requestPath === "/api/auth/me" || requestPath === "/api/me" || requestPath === "/api/user" || requestPath === "/api/profile")) {
    await handleAuthMe(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/balance") {
    await handleBalance(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/daily-reward/status") {
    await handleDailyRewardStatus(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/privacy/me") {
    await handlePrivacyMe(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/privacy/export") {
    await handlePrivacyExport(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/privacy/settings") {
    await handlePrivacySettings(req, res);
    return;
  }

  if (req.method === "POST" && (requestPath === "/api/privacy/clear-memory" || requestPath === "/api/privacy/memory/clear")) {
    await handlePrivacyClearMemory(req, res);
    return;
  }

  if (req.method === "DELETE" && (requestPath === "/api/privacy/account" || requestPath === "/api/privacy/delete-account")) {
    await handlePrivacyDeleteAccount(req, res);
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

  if (req.method === "GET" && requestPath === "/api/notifications") {
    await handleNotifications(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/referrals/me") {
    await handleReferralMe(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/referrals/apply") {
    await handleApplyReferral(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/notifications/read-all") {
    await handleMarkAllNotificationsRead(req, res);
    return;
  }

  if (req.method === "POST" && requestPath.startsWith("/api/notifications/") && requestPath.endsWith("/read")) {
    const notificationId = decodeURIComponent(requestPath.replace("/api/notifications/", "").replace("/read", ""));
    await handleMarkNotificationRead(req, res, notificationId);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/tool-suggestions") {
    await handleSubmitToolSuggestion(req, res);
    return;
  }

  if (requestPath.startsWith("/api/admin")) {
    await requireAdminRoutePermission(req, req.method, requestPath);
  }

  if (req.method === "GET" && requestPath === "/api/admin/stats") {
    await handleAdminStats(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/security-audit") {
    await handleAdminSecurityAudit(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/permissions") {
    await handleAdminPermissions(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/compliance") {
    await handleAdminCompliance(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/admin/compliance/retention/run") {
    await handleAdminRetentionRun(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/ai-intelligence") {
    await handleAdminAiIntelligence(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/ai-health") {
    await handleAdminAiHealth(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/ai-launch-monitor") {
    await handleAdminAiLaunchMonitor(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/beta-analytics") {
    await handleAdminBetaAnalytics(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/scale-growth") {
    await handleAdminScaleGrowth(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/real-scale") {
    await handleAdminRealScale(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/ops") {
    await handleAdminOpsOverview(req, res);
    return;
  }

  if ((req.method === "GET" || req.method === "POST") && requestPath === "/api/admin/feature-flags") {
    await handleAdminFeatureFlags(req, res);
    return;
  }

  if ((req.method === "GET" || req.method === "POST") && requestPath === "/api/admin/incidents") {
    await handleAdminIncidents(req, res);
    return;
  }

  if (req.method === "POST" && requestPath.startsWith("/api/admin/incidents/") && requestPath.endsWith("/events")) {
    const incidentId = decodeURIComponent(requestPath.replace("/api/admin/incidents/", "").replace("/events", ""));
    await handleAdminIncidentEvent(req, res, incidentId);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/admin/real-scale/sentry-test") {
    await handleAdminRealScaleSentryTest(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/prometheus") {
    await handleAdminPrometheusMetrics(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/admin/ai-safe-mode") {
    await handleAdminAiSafeMode(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/ai-knowledge") {
    await handleAdminKnowledgeList(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/admin/ai-knowledge") {
    await handleAdminKnowledgeIngest(req, res);
    return;
  }

  if (req.method === "PATCH" && requestPath.startsWith("/api/admin/ai-knowledge/")) {
    const sourceId = decodeURIComponent(requestPath.replace("/api/admin/ai-knowledge/", ""));
    await handleAdminKnowledgeUpdate(req, res, sourceId);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/ai-review") {
    await handleAdminReviewExcellentAnswers(req, res);
    return;
  }

  if (req.method === "POST" && requestPath.startsWith("/api/admin/ai-review/") && requestPath.endsWith("/approve")) {
    const exampleId = decodeURIComponent(requestPath.replace("/api/admin/ai-review/", "").replace("/approve", ""));
    await handleAdminApproveExcellentAnswer(req, res, exampleId);
    return;
  }

  if (req.method === "POST" && requestPath.startsWith("/api/admin/ai-review/") && requestPath.endsWith("/reject")) {
    const exampleId = decodeURIComponent(requestPath.replace("/api/admin/ai-review/", "").replace("/reject", ""));
    await handleAdminRejectExcellentAnswer(req, res, exampleId);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/admin/ai-rag-debug") {
    await handleAdminRagDebug(req, res);
    return;
  }

  if (req.method === "GET" && (requestPath === "/api/admin/packages" || requestPath === "/api/admin/plans")) {
    await handleAdminPackages(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/notifications") {
    await handleAdminNotifications(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/admin/notifications") {
    await handleAdminCreateNotification(req, res);
    return;
  }

  if (req.method === "PATCH" && requestPath.startsWith("/api/admin/notifications/")) {
    const notificationId = decodeURIComponent(requestPath.replace("/api/admin/notifications/", ""));
    await handleAdminUpdateNotification(req, res, notificationId);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/tool-suggestions") {
    await handleAdminToolSuggestions(req, res);
    return;
  }

  if (req.method === "PATCH" && requestPath.startsWith("/api/admin/tool-suggestions/") && requestPath.endsWith("/status")) {
    const suggestionId = decodeURIComponent(requestPath.replace("/api/admin/tool-suggestions/", "").replace("/status", ""));
    await handleAdminUpdateToolSuggestionStatus(req, res, suggestionId);
    return;
  }

  if (req.method === "POST" && requestPath.startsWith("/api/admin/tool-suggestions/") && requestPath.endsWith("/approve")) {
    const suggestionId = decodeURIComponent(requestPath.replace("/api/admin/tool-suggestions/", "").replace("/approve", ""));
    await handleAdminUpdateToolSuggestionStatus(req, res, suggestionId, "approved");
    return;
  }

  if (req.method === "POST" && requestPath.startsWith("/api/admin/tool-suggestions/") && requestPath.endsWith("/reject")) {
    const suggestionId = decodeURIComponent(requestPath.replace("/api/admin/tool-suggestions/", "").replace("/reject", ""));
    await handleAdminUpdateToolSuggestionStatus(req, res, suggestionId, "rejected");
    return;
  }

  if (req.method === "POST" && requestPath.startsWith("/api/admin/tool-suggestions/") && requestPath.endsWith("/implemented")) {
    const suggestionId = decodeURIComponent(requestPath.replace("/api/admin/tool-suggestions/", "").replace("/implemented", ""));
    await handleAdminUpdateToolSuggestionStatus(req, res, suggestionId, "implemented");
    return;
  }

  if (req.method === "POST" && (requestPath === "/api/admin/packages" || requestPath === "/api/admin/plans")) {
    await handleAdminCreatePackage(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/users") {
    await handleAdminUsers(req, res);
    return;
  }

  if (req.method === "GET" && requestPath.startsWith("/api/admin/users/")) {
    const userId = decodeURIComponent(requestPath.replace("/api/admin/users/", ""));
    await handleAdminGetUser(req, res, userId);
    return;
  }

  if (req.method === "POST" && requestPath.endsWith("/add-xp") && requestPath.startsWith("/api/admin/users/")) {
    const userId = decodeURIComponent(requestPath.replace("/api/admin/users/", "").replace("/add-xp", ""));
    await handleAdminAdjustUserXp(req, res, userId, "add");
    return;
  }

  if (req.method === "POST" && requestPath.endsWith("/remove-xp") && requestPath.startsWith("/api/admin/users/")) {
    const userId = decodeURIComponent(requestPath.replace("/api/admin/users/", "").replace("/remove-xp", ""));
    await handleAdminAdjustUserXp(req, res, userId, "remove");
    return;
  }

  if (req.method === "PATCH" && (requestPath.startsWith("/api/admin/packages/") || requestPath.startsWith("/api/admin/plans/"))) {
    const packageId = decodeURIComponent(requestPath.replace("/api/admin/packages/", "").replace("/api/admin/plans/", ""));
    await handleAdminUpdatePackage(req, res, packageId);
    return;
  }

  if (req.method === "PATCH" && requestPath.startsWith("/api/admin/users/")) {
    const userId = decodeURIComponent(requestPath.replace("/api/admin/users/", ""));
    await handleAdminUpdateUser(req, res, userId);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/subscriptions") {
    await handleAdminSubscriptions(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/admin/subscriptions/assign-plan") {
    await handleAdminAssignPlan(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/admin/xp-ledger") {
    await handleAdminXpLedger(req, res);
    return;
  }

  if (req.method === "GET" && (requestPath === "/api/admin/logs" || requestPath === "/api/admin/action-logs")) {
    await handleAdminLogs(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/admin/logout") {
    await handleAdminLogout(req, res);
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

  if (req.method === "POST" && (requestPath === "/api/chat/send" || requestPath === "/api/chat")) {
    await handleChatSend(req, res);
    return;
  }

  if (req.method === "POST" && requestPath.startsWith("/api/messages/") && requestPath.endsWith("/feedback")) {
    const messageId = decodeURIComponent(requestPath.replace("/api/messages/", "").replace("/feedback", ""));
    await handleMessageFeedback(req, res, messageId);
    return;
  }

  const removedSearchRoutes = new Set([
    "/api/" + "search",
    "/api/" + "smart-" + "search",
    "/api/tools/" + "smart-" + "search",
    "/" + "search",
    "/" + "smart-" + "search",
    "/api/" + "openai-search-final",
    "/api/" + "openai-search-final" + "/debug",
    "/api/" + "openai-web-search-v2",
    "/api/" + "openai-web-search-v2" + "/debug",
    "/" + "openai-web-search-v2"
  ]);

  if (removedSearchRoutes.has(requestPath)) {
    const isApiSearch = requestPath === "/api/search";
    const isApiSmartSearch = requestPath === "/api/smart-search" || requestPath === "/api/tools/smart-search";
    const isPageSearch = requestPath === "/search" || requestPath === "/smart-search";
    sendJson(req, res, 410, {
      ok: false,
      error: isApiSearch
        ? "OLD_API_SEARCH_REMOVED"
        : isApiSmartSearch
          ? "OLD_SMART_SEARCH_REMOVED"
          : "OLD_SEARCH_REMOVED",
      message: "Use /api/assistant-v3",
      routeType: isPageSearch ? "page" : "api"
    });
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

  if (req.method === "POST" && requestPath === "/api/tools/improve-style") {
    await handleImproveStyleTool(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/tools/pdf/remove-protection") {
    await handlePdfRemoveProtection(req, res);
    return;
  }

  if (req.method === "POST" && (
    requestPath === "/api/tools/writing-assistant" ||
    requestPath === "/api/tools/writing" ||
    requestPath === "/api/writing-assistant"
  )) {
    await handleWritingAssistant(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/images/analyze") {
    await handleImageAnalyze(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/images/generate") {
    await handleImageGenerate(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/images/edit") {
    await handleImageEdit(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/solve-question") {
    await handleSolveQuestion(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/chat/stream") {
    if (!isAiFeatureEnabled("streaming")) {
      sendJson(req, res, 503, {
        success: false,
        request_id: requestId,
        code: "FEATURE_STREAMING_DISABLED",
        message: "Streaming is temporarily disabled."
      });
      return;
    }
    await handleChatStream(req, res);
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
    const isExpectedHttpError = Number.isFinite(Number(error?.statusCode));
    const safeMessage = String(error?.message || "Internal server error");
    if (statusCode >= 500) {
      console.error("[mullem] request failed", {
        request_id: req.__requestId,
        method: req.method,
        url: req.url,
        statusCode,
        message: safeMessage,
        stack: error?.stack
      });
    }
    recordBusinessErrorSafe(req, error);
    sendJson(req, res, statusCode, {
      success: false,
      request_id: req.__requestId,
      code: error?.publicCode || (statusCode >= 500 ? "server_error" : "request_error"),
      error: error?.publicCode || (statusCode >= 500 ? "server_error" : "request_error"),
      details: error?.details || null,
      message: statusCode >= 500 && !isExpectedHttpError
        ? "تعذر تنفيذ الطلب الآن. أعد المحاولة بعد قليل."
        : safeMessage
    });
  });
});

let serverStartPromise = null;
let dataRetentionTimer = null;

async function runDataRetentionSweep(reason = "scheduled") {
  if (!databaseClient || typeof databaseClient.applyDataRetentionPolicy !== "function") return null;
  try {
    const result = await databaseClient.applyDataRetentionPolicy(securityCompliance.DATA_RETENTION_POLICY);
    console.log("[mullem] data retention sweep completed", {
      reason,
      results: result?.results || null
    });
    return result;
  } catch (error) {
    console.warn("[mullem] data retention sweep failed:", error?.message || error);
    return null;
  }
}

function startDataRetentionScheduler() {
  if (dataRetentionTimer || !databaseClient || typeof databaseClient.applyDataRetentionPolicy !== "function") return;
  const intervalMs = Math.max(6 * 60 * 60 * 1000, Number(process.env.DATA_RETENTION_INTERVAL_MS || 24 * 60 * 60 * 1000));
  dataRetentionTimer = setInterval(() => {
    runDataRetentionSweep("timer");
  }, intervalMs);
  if (typeof dataRetentionTimer.unref === "function") {
    dataRetentionTimer.unref();
  }
  runDataRetentionSweep("startup");
}

function startServer(port = PORT) {
  if (server.listening) {
    return Promise.resolve(server);
  }

  if (serverStartPromise) {
    return serverStartPromise;
  }

  serverStartPromise = realScaleInfra.initialize()
    .catch((error) => {
      console.warn("[mullem] real scale infra warning:", error?.message || error);
    })
    .then(() => initializeDatabaseLayerWithTimeout())
    .then(() => startDataRetentionScheduler())
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
      if (dataRetentionTimer) {
        clearInterval(dataRetentionTimer);
        dataRetentionTimer = null;
      }
      if (databaseClient && typeof databaseClient.close === "function") {
        try {
          await databaseClient.close();
        } catch (_) {
          // Ignore shutdown errors.
        }
      }
      try {
        await realScaleInfra.close();
      } catch (_) {
        // Ignore shutdown errors.
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
  for (const [key, value] of abuseSignalStore.entries()) {
    const events = (value?.events || []).filter((item) => now - Number(item.at || 0) <= AI_ABUSE_WINDOW_MS);
    if (!events.length) {
      abuseSignalStore.delete(key);
    } else {
      value.events = events;
      abuseSignalStore.set(key, value);
    }
  }
  for (const [key, value] of questionFrequencyStore.entries()) {
    if (!value || now - Number(value.lastAt || 0) > 24 * 60 * 60_000) {
      questionFrequencyStore.delete(key);
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
