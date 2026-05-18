"use strict";

const fs = require("fs");
const path = require("path");
const security = require("./security-compliance");

const cwd = __dirname;

function exists(relativePath) {
  return fs.existsSync(path.join(cwd, relativePath));
}

function main() {
  const report = security.buildSecurityAuditSnapshot({
    env: process.env,
    databaseConnected: Boolean(process.env.DATABASE_URL),
    corsAllowAll: String(process.env.CORS_ALLOWED_ORIGINS || "*").trim() === "*",
    isCloudRuntime: Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL),
    securityHeadersEnabled: true,
    csrfProtectionEnabled: true,
    adminActionLogsEnabled: true,
    privacyControlsEnabled: true,
    retentionJobEnabled: true,
    fileUploadSafetyEnabled: true,
    promptInjectionProtectionEnabled: true,
    rbacEnabled: true,
    rateLimitsEnabled: true
  });

  const docs = [
    "docs/privacy-policy.md",
    "docs/terms-of-service.md",
    "docs/data-processing-overview.md",
    "docs/security-overview.md"
  ];

  const payload = {
    ok: true,
    generated_at: new Date().toISOString(),
    report,
    docs: Object.fromEntries(docs.map((file) => [file, exists(file)]))
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  if (report.status === "needs_attention") process.exitCode = 1;
}

main();
