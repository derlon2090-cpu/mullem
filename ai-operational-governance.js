"use strict";

const crypto = require("crypto");

function readBool(env, keys, fallback = false) {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    if (!Object.prototype.hasOwnProperty.call(env, key)) continue;
    const value = String(env[key] || "").trim().toLowerCase();
    if (["1", "true", "yes", "on", "enabled"].includes(value)) return true;
    if (["0", "false", "no", "off", "disabled"].includes(value)) return false;
  }
  return Boolean(fallback);
}

function readNumber(env, keys, fallback) {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    if (!Object.prototype.hasOwnProperty.call(env, key)) continue;
    const value = Number(env[key]);
    if (Number.isFinite(value)) return value;
  }
  return Number(fallback);
}

function readString(env, keys, fallback = "") {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    const value = String(env[key] || "").trim();
    if (value) return value;
  }
  return String(fallback || "").trim();
}

function normalizeChannel(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (["development", "staging", "production"].includes(raw)) return raw;
  if (["prod", "live"].includes(raw)) return "production";
  if (["stage", "preview"].includes(raw)) return "staging";
  return "development";
}

function buildAiVersionManifest(env = process.env) {
  const releaseChannel = normalizeChannel(readString(env, ["RELEASE_CHANNEL", "NODE_ENV"], "development"));
  return {
    release_channel: releaseChannel,
    app_version: readString(env, "APP_VERSION", "1.0.0"),
    ai_platform_version: readString(env, "AI_PLATFORM_VERSION", "2026.05-real-scale"),
    prompts_version: readString(env, "AI_PROMPTS_VERSION", "prompts-v1"),
    routing_version: readString(env, "AI_ROUTING_VERSION", "router-v2"),
    rag_version: readString(env, "AI_RAG_VERSION", "rag-v1"),
    scoring_version: readString(env, "AI_SCORING_VERSION", "quality-v1"),
    limits_version: readString(env, "AI_LIMITS_VERSION", "limits-v2"),
    cost_policy_version: readString(env, "AI_COST_POLICY_VERSION", "cost-guardrails-v1"),
    feature_flags_version: readString(env, "AI_FEATURE_FLAGS_VERSION", "flags-v1"),
    fine_tuning_enabled: false
  };
}

function buildReleaseDiscipline(env = process.env) {
  const channel = normalizeChannel(readString(env, ["RELEASE_CHANNEL", "NODE_ENV"], "development"));
  return {
    current_channel: channel,
    channels: {
      development: {
        branch: readString(env, "DEV_BRANCH", "codex/*"),
        auto_deploy: false,
        purpose: "Local and branch validation before staging."
      },
      staging: {
        branch: readString(env, "STAGING_BRANCH", "staging"),
        auto_deploy: true,
        purpose: "Production-like verification with separate database, Redis, API keys, and Sentry environment."
      },
      production: {
        branch: readString(env, "PRODUCTION_BRANCH", "main"),
        auto_deploy: false,
        purpose: "Manual promotion after staging smoke tests pass."
      }
    },
    gates: [
      "render-build-check",
      "ai:quality",
      "ai:real-scale-check",
      "ai:load-test",
      "ai:production-activation-check"
    ],
    hotfix: {
      branch_pattern: "hotfix/*",
      required_checks: ["render-build-check", "ai:real-scale-check"],
      rollback_command: "revert release commit and redeploy previous green Render deploy"
    },
    rule: "main should represent production-ready code, but production promotion must happen only after staging smoke tests pass."
  };
}

const FEATURE_FLAG_DEFINITIONS = Object.freeze({
  embeddings: {
    env: ["FEATURE_EMBEDDINGS", "AI_FEATURE_EMBEDDINGS", "ORLIXOR_ENABLE_EMBEDDINGS"],
    defaultValue: false,
    description: "Enable production embeddings after pgvector or Qdrant is validated."
  },
  streaming: {
    env: ["FEATURE_STREAMING", "AI_FEATURE_STREAMING"],
    defaultValue: true,
    description: "Enable SSE streaming for chat responses."
  },
  advanced_rag: {
    env: ["FEATURE_ADVANCED_RAG", "AI_FEATURE_ADVANCED_RAG"],
    defaultValue: false,
    description: "Enable advanced semantic retrieval and ranking."
  },
  provider_fallback: {
    env: ["FEATURE_PROVIDER_FALLBACK", "AI_FEATURE_PROVIDER_FALLBACK"],
    defaultValue: true,
    description: "Allow fallback from one provider to another during outages."
  },
  smart_routing: {
    env: ["FEATURE_SMART_ROUTING", "AI_FEATURE_SMART_ROUTING"],
    defaultValue: true,
    description: "Enable cost-aware model routing."
  },
  beta_features: {
    env: ["FEATURE_BETA_FEATURES", "AI_FEATURE_BETA_FEATURES"],
    defaultValue: false,
    description: "Expose beta AI platform features to allowed users."
  }
});

function buildFeatureFlags(env = process.env, overrides = {}) {
  return Object.fromEntries(Object.entries(FEATURE_FLAG_DEFINITIONS).map(([key, definition]) => {
    const hasOverride = Object.prototype.hasOwnProperty.call(overrides || {}, key);
    const enabled = hasOverride
      ? Boolean(overrides[key])
      : readBool(env, definition.env, definition.defaultValue);
    return [key, {
      key,
      enabled,
      source: hasOverride ? "admin_override" : "environment_or_default",
      description: definition.description
    }];
  }));
}

function buildErrorBudgetPolicy(env = process.env) {
  return {
    version: readString(env, "AI_ERROR_BUDGET_VERSION", "error-budget-v1"),
    targets: {
      p95_latency_ms: readNumber(env, "AI_ERROR_BUDGET_P95_LATENCY_MS", 12_000),
      failure_rate_percent: readNumber(env, "AI_ERROR_BUDGET_FAILURE_RATE_PERCENT", 2),
      uptime_percent: readNumber(env, "AI_ERROR_BUDGET_UPTIME_PERCENT", 99.5),
      daily_cost_ratio: readNumber(env, "AI_ERROR_BUDGET_DAILY_COST_RATIO", 0.8),
      token_cost_ratio: readNumber(env, "AI_ERROR_BUDGET_TOKEN_COST_RATIO", 0.8)
    },
    actions: {
      warning: ["notify_admin", "watch_cost_and_latency"],
      breach: ["enable_safe_mode", "reduce_limits", "disable_heavy_features"],
      severe: ["disable_images", "force_low_cost_models", "open_incident"]
    }
  };
}

function evaluateErrorBudget(input = {}) {
  const policy = input.policy || buildErrorBudgetPolicy();
  const health = input.health || {};
  const realScale = input.realScale || {};
  const siteCost = health.cost_guardrails?.site || {};
  const scaling = health.scaling || {};
  const providers = health.providers || {};
  const latencyMs = Number(input.p95LatencyMs || scaling.avg_generation_ms || 0);
  const failureSignals = [
    providers.deepseek?.status === "degraded",
    providers.openai?.status === "degraded",
    realScale.redis?.configured && !realScale.redis?.connected,
    realScale.queue?.mode === "memory" && realScale.redis?.configured
  ].filter(Boolean).length;
  const failureRatePercent = Number(input.failureRatePercent || failureSignals * 1.5);
  const costRatio = Number(siteCost.ratio || 0);
  const violations = [];

  if (latencyMs > policy.targets.p95_latency_ms) {
    violations.push({ key: "latency", observed: latencyMs, target: policy.targets.p95_latency_ms });
  }
  if (failureRatePercent > policy.targets.failure_rate_percent) {
    violations.push({ key: "failure_rate", observed: failureRatePercent, target: policy.targets.failure_rate_percent });
  }
  if (costRatio >= policy.targets.daily_cost_ratio) {
    violations.push({ key: "daily_cost", observed: costRatio, target: policy.targets.daily_cost_ratio });
  }

  const severity = violations.some((item) => item.key === "daily_cost" && item.observed >= 1)
    ? "severe"
    : violations.length >= 2
      ? "breach"
      : violations.length
        ? "warning"
        : "ok";

  return {
    status: severity,
    violations,
    actions: severity === "ok" ? [] : policy.actions[severity] || policy.actions.breach,
    recommended_safe_mode: ["breach", "severe"].includes(severity),
    recommended_limit_reduction: violations.some((item) => ["daily_cost", "failure_rate"].includes(item.key)),
    recommended_heavy_feature_disable: violations.some((item) => ["latency", "daily_cost"].includes(item.key))
  };
}

function normalizeIncidentSeverity(value) {
  const raw = String(value || "").trim().toLowerCase();
  return ["sev1", "sev2", "sev3", "sev4"].includes(raw) ? raw : "sev3";
}

function buildIncident(input = {}) {
  const now = new Date().toISOString();
  return {
    id: input.id || `inc_${now.replace(/[-:.TZ]/g, "")}_${crypto.randomBytes(3).toString("hex")}`,
    title: String(input.title || "Untitled incident").trim().slice(0, 160),
    severity: normalizeIncidentSeverity(input.severity),
    status: String(input.status || "open").trim().toLowerCase(),
    owner: String(input.owner || "unassigned").trim().slice(0, 120),
    summary: String(input.summary || "").trim().slice(0, 2000),
    affected_systems: Array.isArray(input.affected_systems) ? input.affected_systems.slice(0, 20) : [],
    started_at: input.started_at || now,
    resolved_at: input.resolved_at || null,
    created_at: now,
    updated_at: now,
    timeline: [
      {
        at: now,
        type: "created",
        message: String(input.initial_event || "Incident opened.").slice(0, 1000)
      }
    ],
    postmortem_required: ["sev1", "sev2"].includes(normalizeIncidentSeverity(input.severity))
  };
}

function appendIncidentEvent(incident, event = {}) {
  const now = new Date().toISOString();
  const next = {
    ...(incident || {}),
    updated_at: now,
    timeline: Array.isArray(incident?.timeline) ? [...incident.timeline] : []
  };
  next.timeline.push({
    at: event.at || now,
    type: String(event.type || "update").trim().toLowerCase().slice(0, 80),
    message: String(event.message || "").trim().slice(0, 1000)
  });
  if (event.status) next.status = String(event.status).trim().toLowerCase();
  if (next.status === "resolved" && !next.resolved_at) next.resolved_at = now;
  return next;
}

function buildPostmortemTemplate() {
  return {
    title: "Postmortem: <incident title>",
    sections: [
      "Summary",
      "Impact",
      "Customer experience",
      "Timeline",
      "Root cause",
      "Detection",
      "Resolution",
      "What went well",
      "What went wrong",
      "Action items",
      "Prevention plan"
    ],
    rule: "Required for SEV1 and SEV2. Do not include raw user data, secrets, prompts, or private conversation content."
  };
}

module.exports = {
  buildAiVersionManifest,
  buildErrorBudgetPolicy,
  buildFeatureFlags,
  buildIncident,
  buildPostmortemTemplate,
  buildReleaseDiscipline,
  evaluateErrorBudget,
  appendIncidentEvent,
  normalizeChannel,
  normalizeIncidentSeverity
};
