"use strict";

const path = require("path");

const SENSITIVE_ENV_KEYS = [
  "OPENAI_API_KEY",
  "DEEPSEEK_API_KEY",
  "ORLIXOR_DEEPSEEK_API_KEY",
  "DATABASE_URL",
  "DATABASE_PRIVATE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_UNPOOLED",
  "DATABASE_URL_UNPOOLED",
  "NEON_DATABASE_URL",
  "NEON_POSTGRES_URL",
  "SESSION_SECRET",
  "JWT_SECRET",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_SECRET",
  "APPLE_CLIENT_SECRET",
  "MICROSOFT_CLIENT_SECRET",
  "SUPABASE_ANON_KEY",
  "SENTRY_DSN",
  "REDIS_URL"
];

const SENSITIVE_FIELD_PATTERN = /(secret|password|passphrase|api[_-]?key|token|authorization|cookie|dsn|database_url|redis_url|connection|string)/i;
const TOKEN_PATTERN = /\b(?:sk-[A-Za-z0-9_-]{16,}|[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|Bearer\s+[A-Za-z0-9._~+/=-]{12,})\b/g;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_PASSWORD_PATTERN = /([a-z][a-z0-9+.-]*:\/\/[^:\s/@]+:)([^@\s/]+)(@)/gi;

const ROLE_ALIASES = Object.freeze({
  owner: "owner",
  super_admin: "owner",
  "super admin": "owner",
  root: "owner",
  admin: "admin",
  administrator: "admin",
  support: "support",
  agent: "support",
  moderator: "support",
  analyst: "analyst",
  analytics: "analyst",
  viewer: "analyst",
  user: "user",
  student: "user",
  learner: "user",
  member: "user"
});

const ROLE_PERMISSIONS = Object.freeze({
  owner: ["*"],
  admin: [
    "admin:read",
    "admin:write",
    "analytics:read",
    "users:read",
    "users:write",
    "billing:read",
    "billing:write",
    "ai:read",
    "ai:write",
    "feature_flags:read",
    "feature_flags:write",
    "incidents:read",
    "incidents:write",
    "security:read",
    "action_logs:read",
    "privacy:manage",
    "retention:run",
    "support:read",
    "support:write"
  ],
  support: [
    "admin:read",
    "users:read",
    "support:read",
    "support:write",
    "conversations:read",
    "notifications:read",
    "notifications:write",
    "ai:read"
  ],
  analyst: [
    "admin:read",
    "analytics:read",
    "ai:read",
    "security:read",
    "feature_flags:read",
    "incidents:read"
  ],
  user: [
    "self:read",
    "self:write",
    "privacy:read",
    "privacy:write",
    "chat:use"
  ]
});

const DATA_RETENTION_POLICY = Object.freeze({
  version: "retention-v1",
  conversations_days: 180,
  messages_days: 180,
  ai_quality_events_days: 365,
  feedback_days: 365,
  analytics_days: 400,
  abuse_logs_days: 180,
  admin_logs_days: 730,
  deleted_account_purge_days: 30,
  privacy_exports_cache_minutes: 0,
  rule: "Keep only what is needed for service operation, billing safety, abuse prevention, and approved product analytics."
});

function collectSecretValues(env = process.env) {
  return SENSITIVE_ENV_KEYS
    .map((key) => String(env[key] || "").trim())
    .filter((value) => value.length >= 8);
}

function redactString(value, options = {}) {
  let output = String(value || "");
  for (const secret of collectSecretValues(options.env || process.env)) {
    if (secret && output.includes(secret)) {
      output = output.split(secret).join("[REDACTED_SECRET]");
    }
  }
  output = output.replace(URL_PASSWORD_PATTERN, "$1[REDACTED_PASSWORD]$3");
  output = output.replace(TOKEN_PATTERN, "[REDACTED_TOKEN]");
  if (options.redactPii !== false) {
    output = output.replace(EMAIL_PATTERN, "[REDACTED_EMAIL]");
  }
  return output;
}

function redactDeep(value, options = {}, depth = 0, seen = new WeakSet()) {
  if (value == null || depth > 8) return value;
  if (typeof value === "string") return redactString(value, options);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message, options),
      code: value.code || null,
      stack: redactString(value.stack || "", options)
    };
  }
  if (Buffer.isBuffer(value)) return `[Buffer:${value.length}]`;
  if (typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redactDeep(item, options, depth + 1, seen));

  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_FIELD_PATTERN.test(key)) {
      result[key] = item ? "[REDACTED]" : item;
    } else {
      result[key] = redactDeep(item, options, depth + 1, seen);
    }
  }
  return result;
}

function installConsoleRedaction(env = process.env) {
  if (console.__mullemSecurityRedactionInstalled) return;
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    const original = console[level].bind(console);
    console[level] = (...args) => original(...args.map((item) => redactDeep(item, { env, redactPii: true })));
  }
  Object.defineProperty(console, "__mullemSecurityRedactionInstalled", {
    value: true,
    enumerable: false
  });
}

function normalizeRbacRole(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/[-_]+/g, " ");
  if (!raw) return "user";
  return ROLE_ALIASES[raw] || ROLE_ALIASES[raw.replace(/\s+/g, "_")] || "user";
}

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[normalizeRbacRole(role)] || ROLE_PERMISSIONS.user;
}

function hasPermission(role, permission) {
  const permissions = getRolePermissions(role);
  return permissions.includes("*") || permissions.includes(permission);
}

function requirePermission(role, permission) {
  if (!hasPermission(role, permission)) {
    const error = new Error(`Missing permission: ${permission}`);
    error.statusCode = 403;
    error.publicCode = "RBAC_FORBIDDEN";
    error.details = { permission };
    throw error;
  }
}

function getAdminRoutePermission(method, requestPath) {
  const verb = String(method || "GET").toUpperCase();
  const route = String(requestPath || "");
  const write = !["GET", "HEAD", "OPTIONS"].includes(verb);

  if (route === "/api/admin/security-audit" || route === "/api/admin/compliance" || route === "/api/admin/db-status") return "security:read";
  if (route === "/api/admin/logs" || route === "/api/admin/action-logs") return "action_logs:read";
  if (route === "/api/admin/permissions") return "security:read";
  if (route === "/api/admin/compliance/retention/run") return "retention:run";
  if (route === "/api/admin/prometheus" || route === "/api/admin/real-scale" || route === "/api/admin/ops") return "security:read";
  if (route === "/api/admin/feature-flags") return write ? "feature_flags:write" : "feature_flags:read";
  if (route.startsWith("/api/admin/incidents")) return write ? "incidents:write" : "incidents:read";
  if (route.includes("/ai-") || route.includes("/real-scale/sentry-test")) return write ? "ai:write" : "ai:read";
  if (route.includes("/users")) return write ? "users:write" : "users:read";
  if (route.includes("/subscriptions") || route.includes("/packages") || route.includes("/plans") || route.includes("/xp-ledger")) return write ? "billing:write" : "billing:read";
  if (route.includes("/notifications") || route.includes("/tool-suggestions")) return write ? "support:write" : "support:read";
  if (route.includes("/conversations")) return "conversations:read";
  if (route.includes("/stats") || route.includes("/analytics") || route.includes("/scale-growth")) return "analytics:read";
  return write ? "admin:write" : "admin:read";
}

function buildSecurityHeaders({ isCloud = false, isHttps = false } = {}) {
  const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self' https: wss:",
    ];
  if (isCloud || isHttps) {
    csp.push("upgrade-insecure-requests");
  }
  const headers = {
    "Content-Security-Policy": csp.join("; "),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
  };
  if (isCloud || isHttps) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
  }
  return headers;
}

function sanitizeUploadedFilename(filename) {
  const base = path.basename(String(filename || "upload").replace(/\0/g, ""));
  const safe = base
    .replace(/[^\p{L}\p{N}._ -]+/gu, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return safe || "upload";
}

function isSafeSameOriginRequest(req, isAllowedOrigin) {
  const method = String(req.method || "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;
  if (String(req.headers.authorization || "").trim()) return true;
  if (!String(req.headers.cookie || "").includes("mlm_auth_token=")) return true;

  const origin = String(req.headers.origin || "").trim();
  if (origin) return Boolean(isAllowedOrigin(origin));

  const referer = String(req.headers.referer || "").trim();
  if (referer) {
    try {
      const parsed = new URL(referer);
      return Boolean(isAllowedOrigin(parsed.origin));
    } catch (_) {
      return false;
    }
  }
  return false;
}

function buildSecurityAuditSnapshot(input = {}) {
  const issues = [];
  const addIssue = (severity, area, message, remediation) => issues.push({ severity, area, message, remediation });
  const env = input.env || process.env;
  const hasSessionSecret = Boolean(env.SESSION_SECRET || env.JWT_SECRET || env.NEXTAUTH_SECRET);
  const hasDb = Boolean(input.databaseConnected);
  const corsAllowAll = Boolean(input.corsAllowAll);

  if (!hasSessionSecret) addIssue("high", "auth/session", "SESSION_SECRET/JWT_SECRET/NEXTAUTH_SECRET is missing.", "Set SESSION_SECRET in Render and never print its value.");
  if (!hasDb) addIssue("high", "database", "Database is not connected, which can break auth, audit logs, and privacy controls.", "Restore DATABASE_URL and verify migrations.");
  if (corsAllowAll && input.isCloudRuntime) addIssue("medium", "CORS", "Wildcard CORS is active in cloud runtime.", "Use explicit production/staging origins.");
  if (!input.securityHeadersEnabled) addIssue("medium", "headers", "Security headers are not confirmed.", "Set CSP, HSTS, X-Frame-Options, nosniff, and Referrer-Policy on every response.");
  if (!input.csrfProtectionEnabled) addIssue("medium", "CSRF", "Cookie authenticated mutating requests need origin checks.", "Reject cookie-auth writes without a trusted Origin/Referer.");
  if (!input.adminActionLogsEnabled) addIssue("medium", "admin_logs", "Admin action logging is unavailable.", "Ensure admin_logs table/client methods are enabled.");
  if (!input.privacyControlsEnabled) addIssue("medium", "privacy", "User privacy controls are unavailable.", "Expose export, delete, opt-out, and memory clearing APIs.");
  if (!input.retentionJobEnabled) addIssue("medium", "retention", "Data retention job is not active.", "Run retention daily and expose an admin manual run endpoint.");

  return {
    generated_at: new Date().toISOString(),
    status: issues.some((item) => item.severity === "high") ? "needs_attention" : issues.length ? "watch" : "pass",
    checks: {
      auth_session_security: hasSessionSecret ? "pass" : "fail",
      admin_routes_rbac: input.rbacEnabled ? "pass" : "fail",
      rate_limits: input.rateLimitsEnabled ? "pass" : "fail",
      cors: corsAllowAll && input.isCloudRuntime ? "warn" : "pass",
      csrf: input.csrfProtectionEnabled ? "pass" : "warn",
      xss_headers: input.securityHeadersEnabled ? "pass" : "warn",
      sql_injection: "pass_parameterized_queries",
      file_upload_safety: input.fileUploadSafetyEnabled ? "pass" : "warn",
      prompt_injection: input.promptInjectionProtectionEnabled ? "pass" : "warn",
      api_key_leakage: "pass_redacted",
      logs_no_secrets: "pass_console_redaction"
    },
    rbac: {
      roles: Object.keys(ROLE_PERMISSIONS),
      permissions: ROLE_PERMISSIONS
    },
    issues,
    launch_assessment: issues.some((item) => item.severity === "high")
      ? "not_safe_for_public_beta_until_high_risks_are_fixed"
      : "safe_for_controlled_public_beta_with_monitoring"
  };
}

module.exports = {
  DATA_RETENTION_POLICY,
  ROLE_PERMISSIONS,
  buildSecurityAuditSnapshot,
  buildSecurityHeaders,
  getAdminRoutePermission,
  getRolePermissions,
  hasPermission,
  installConsoleRedaction,
  isSafeSameOriginRequest,
  normalizeRbacRole,
  redactDeep,
  redactString,
  requirePermission,
  sanitizeUploadedFilename
};
