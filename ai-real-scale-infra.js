"use strict";

const crypto = require("crypto");

function optionalRequire(name) {
  try {
    return require(name);
  } catch (_) {
    return null;
  }
}

const IORedis = optionalRequire("ioredis");
const bullmq = optionalRequire("bullmq") || {};
const promClient = optionalRequire("prom-client");
const Sentry = optionalRequire("@sentry/node");

const { Queue, Worker, QueueEvents } = bullmq;

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
    const value = Number(process.env[key]);
    if (Number.isFinite(value)) return value;
  }
  return Number(fallback);
}

function nowIso() {
  return new Date().toISOString();
}

function hashPayload(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value || {})).digest("hex");
}

function normalizePromptForCache(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[0-9a-f]{16,}/gi, "[hash]")
    .trim()
    .slice(0, 8000);
}

function ttlSeconds(ms) {
  return Math.max(1, Math.ceil(Number(ms || 0) / 1000));
}

function createInMemoryStore() {
  const store = new Map();

  function cleanup(key) {
    const item = store.get(key);
    if (item && item.expiresAt && item.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }
    return item || null;
  }

  return {
    get(key) {
      return cleanup(key)?.value ?? null;
    },
    set(key, value, ttlMs = 0) {
      store.set(key, {
        value,
        expiresAt: ttlMs ? Date.now() + Number(ttlMs) : 0
      });
    },
    delete(key) {
      store.delete(key);
    },
    increment(key, ttlMs = 0) {
      const current = Number(cleanup(key)?.value || 0) + 1;
      store.set(key, {
        value: current,
        expiresAt: ttlMs ? Date.now() + Number(ttlMs) : 0
      });
      return current;
    },
    ttlMs(key) {
      const item = cleanup(key);
      if (!item?.expiresAt) return -1;
      return Math.max(0, item.expiresAt - Date.now());
    },
    size() {
      return store.size;
    },
    keys(prefix = "") {
      return [...store.keys()].filter((key) => String(key).startsWith(prefix));
    }
  };
}

function buildCircuitSnapshot(map) {
  return [...map.entries()].map(([provider, state]) => ({
    provider,
    status: state.openedAt ? "open" : "closed",
    failures: Number(state.failures || 0),
    opened_at: state.openedAt ? new Date(state.openedAt).toISOString() : null,
    last_success_at: state.lastSuccessAt || null,
    last_error_at: state.lastErrorAt || null,
    last_error: state.lastError || null
  }));
}

function createRealScaleInfra(options = {}) {
  const redisUrl = String(options.redisUrl || readEnvValue(["REDIS_URL", "ORLIXOR_REDIS_URL", "UPSTASH_REDIS_URL"], "")).trim();
  const queueName = String(options.queueName || readEnvValue("AI_QUEUE_NAME", "mullem-ai-jobs")).trim();
  const cachePrefix = String(options.cachePrefix || readEnvValue("AI_CACHE_PREFIX", "mullem:ai")).trim();
  const serviceName = String(options.serviceName || readEnvValue("AI_SERVICE_NAME", "mullem-main")).trim();
  const circuitFailureThreshold = readEnvNumber("AI_CIRCUIT_FAILURE_THRESHOLD", 5);
  const circuitCooldownMs = readEnvNumber("AI_CIRCUIT_COOLDOWN_MS", 60_000);
  const providerTimeoutMs = readEnvNumber("AI_PROVIDER_TIMEOUT_MS", 30_000);
  const retryBudget = readEnvNumber("AI_RETRY_BUDGET", 2);
  const queueOverflowLimit = readEnvNumber("AI_QUEUE_OVERFLOW_LIMIT", 5000);
  const semanticCacheTtlMs = readEnvNumber("AI_SEMANTIC_CACHE_TTL_MS", 30 * 60_000);
  const hotCacheTtlMs = readEnvNumber("AI_HOT_CACHE_TTL_MS", 10 * 60_000);
  const memory = createInMemoryStore();
  const circuitBreakers = new Map();
  const memoryQueue = [];
  const workers = [];
  const timers = [];
  let redis = null;
  let bullConnection = null;
  let queue = null;
  let queueEvents = null;
  let sentryInitialized = false;

  const state = {
    serviceName,
    initialized: false,
    initialized_at: null,
    last_error: null,
    redis: {
      configured: Boolean(redisUrl),
      connected: false,
      mode: "memory",
      last_success_at: null,
      last_error_at: null,
      last_error: null
    },
    queue: {
      mode: "memory",
      configured: Boolean(redisUrl && Queue && Worker),
      name: queueName,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      overflow_limit: queueOverflowLimit
    },
    cache: {
      hits: 0,
      misses: 0,
      writes: 0,
      semantic_hits: 0,
      prompt_hits: 0,
      faq_hits: 0,
      hot_hits: 0
    },
    monitoring: {
      prometheus_enabled: Boolean(promClient),
      sentry_configured: Boolean(process.env.SENTRY_DSN),
      sentry_enabled: false
    },
    disaster_protection: {
      circuit_breakers_enabled: true,
      provider_timeout_ms: providerTimeoutMs,
      retry_budget: retryBudget,
      queue_overflow_limit: queueOverflowLimit,
      memory_pressure_protection: true
    },
    embeddings: {
      mode: String(process.env.ORLIXOR_VECTOR_STORE || process.env.VECTOR_STORE || "pgvector_or_fallback").toLowerCase(),
      production_ready: Boolean(process.env.ORLIXOR_ENABLE_EMBEDDINGS === "true" && (process.env.DATABASE_URL || process.env.QDRANT_URL)),
      async_indexing: true
    },
    streaming: {
      sse_enabled: true,
      websocket_enabled: false
    },
    providers: {
      openai: { configured: Boolean(process.env.OPENAI_API_KEY) },
      deepseek: { configured: Boolean(process.env.DEEPSEEK_API_KEY || process.env.ORLIXOR_DEEPSEEK_API_KEY) },
      gemini: { configured: Boolean(process.env.GEMINI_API_KEY), future_provider: true },
      claude: { configured: Boolean(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY), future_provider: true }
    }
  };

  let registry = null;
  let metrics = {};

  function setupPrometheus() {
    if (!promClient || registry) return;
    registry = new promClient.Registry();
    registry.setDefaultLabels({ app: "mullem", service: serviceName });
    promClient.collectDefaultMetrics({ register: registry, prefix: "mullem_" });
    metrics.aiRequests = new promClient.Counter({
      name: "mullem_ai_requests_total",
      help: "Total AI requests by provider, model, plan, and route.",
      labelNames: ["provider", "model", "plan", "route_reason", "rag_used", "cached"],
      registers: [registry]
    });
    metrics.aiLatency = new promClient.Histogram({
      name: "mullem_ai_latency_ms",
      help: "AI request latency in milliseconds.",
      labelNames: ["provider", "model", "plan"],
      buckets: [100, 250, 500, 1000, 2500, 5000, 10000, 20000, 45000],
      registers: [registry]
    });
    metrics.aiCost = new promClient.Counter({
      name: "mullem_ai_cost_estimate_usd_total",
      help: "Estimated AI provider cost in USD.",
      labelNames: ["provider", "model", "plan"],
      registers: [registry]
    });
    metrics.cacheEvents = new promClient.Counter({
      name: "mullem_ai_cache_events_total",
      help: "AI cache events by layer and result.",
      labelNames: ["layer", "result"],
      registers: [registry]
    });
    metrics.queueWaiting = new promClient.Gauge({
      name: "mullem_ai_queue_waiting",
      help: "Current AI queue waiting jobs.",
      labelNames: ["mode"],
      registers: [registry]
    });
    metrics.circuitOpen = new promClient.Gauge({
      name: "mullem_ai_circuit_open",
      help: "Provider circuit breaker open state.",
      labelNames: ["provider"],
      registers: [registry]
    });
  }

  function setupSentry() {
    if (!Sentry || !process.env.SENTRY_DSN || sentryInitialized) return;
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || process.env.RENDER_SERVICE_NAME || "development",
      tracesSampleRate: Math.max(0, Math.min(1, Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05)))
    });
    sentryInitialized = true;
    state.monitoring.sentry_enabled = true;
  }

  function captureError(error, context = {}) {
    if (Sentry && sentryInitialized) {
      Sentry.captureException(error, { extra: context });
    }
  }

  async function initialize() {
    setupPrometheus();
    setupSentry();
    if (state.initialized) return getStatus();
    state.initialized = true;
    state.initialized_at = nowIso();
    if (redisUrl && IORedis) {
      try {
        redis = new IORedis(redisUrl, {
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          connectTimeout: readEnvNumber("REDIS_CONNECT_TIMEOUT_MS", 5000)
        });
        redis.on("error", (error) => {
          state.redis.last_error_at = nowIso();
          state.redis.last_error = String(error?.message || error).slice(0, 500);
        });
        await redis.connect();
        await redis.ping();
        state.redis.connected = true;
        state.redis.mode = "redis";
        state.redis.last_success_at = nowIso();
      } catch (error) {
        state.redis.connected = false;
        state.redis.mode = "memory";
        state.redis.last_error_at = nowIso();
        state.redis.last_error = String(error?.message || error).slice(0, 500);
        state.last_error = state.redis.last_error;
        captureError(error, { subsystem: "redis_init" });
        if (redis) {
          try { redis.disconnect(); } catch (_) {}
        }
        redis = null;
      }
    }
    if (redisUrl && state.redis.connected && Queue && Worker) {
      try {
        bullConnection = new IORedis(redisUrl, {
          maxRetriesPerRequest: null,
          enableOfflineQueue: true
        });
        queue = new Queue(queueName, {
          connection: bullConnection,
          defaultJobOptions: {
            attempts: retryBudget,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: 1000,
            removeOnFail: 1000
          }
        });
        queueEvents = QueueEvents ? new QueueEvents(queueName, { connection: bullConnection.duplicate() }) : null;
        if (queueEvents) {
          queueEvents.on("completed", () => { state.queue.completed += 1; });
          queueEvents.on("failed", () => { state.queue.failed += 1; });
        }
        state.queue.mode = "bullmq";
      } catch (error) {
        state.queue.mode = "memory";
        state.queue.configured = false;
        state.last_error = String(error?.message || error).slice(0, 500);
        captureError(error, { subsystem: "bullmq_init" });
      }
    }
    return getStatus();
  }

  async function close() {
    for (const timer of timers.splice(0)) clearInterval(timer);
    for (const worker of workers.splice(0)) {
      try { await worker.close(); } catch (_) {}
    }
    if (queueEvents) {
      try { await queueEvents.close(); } catch (_) {}
      queueEvents = null;
    }
    if (queue) {
      try { await queue.close(); } catch (_) {}
      queue = null;
    }
    if (bullConnection) {
      try { bullConnection.disconnect(); } catch (_) {}
      bullConnection = null;
    }
    if (redis) {
      try { redis.disconnect(); } catch (_) {}
      redis = null;
    }
    state.redis.connected = false;
  }

  async function getJson(key) {
    const fullKey = `${cachePrefix}:${key}`;
    if (redis && state.redis.connected) {
      try {
        const raw = await redis.get(fullKey);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        captureError(error, { subsystem: "redis_get", key });
      }
    }
    return memory.get(fullKey);
  }

  async function setJson(key, value, ttlMs = hotCacheTtlMs) {
    const fullKey = `${cachePrefix}:${key}`;
    if (redis && state.redis.connected) {
      try {
        await redis.set(fullKey, JSON.stringify(value), "EX", ttlSeconds(ttlMs));
        return true;
      } catch (error) {
        captureError(error, { subsystem: "redis_set", key });
      }
    }
    memory.set(fullKey, value, ttlMs);
    return true;
  }

  async function del(key) {
    const fullKey = `${cachePrefix}:${key}`;
    if (redis && state.redis.connected) {
      try {
        await redis.del(fullKey);
        return true;
      } catch (error) {
        captureError(error, { subsystem: "redis_del", key });
      }
    }
    memory.delete(fullKey);
    return true;
  }

  async function consumeRateLimit(key, limit, windowMs) {
    const safeLimit = Math.max(1, Number(limit || 1));
    const safeWindowMs = Math.max(1000, Number(windowMs || 1000));
    const fullKey = `${cachePrefix}:rate:${key}`;
    let count = 0;
    let retryAfterMs = safeWindowMs;
    if (redis && state.redis.connected) {
      try {
        count = await redis.incr(fullKey);
        if (count === 1) await redis.pexpire(fullKey, safeWindowMs);
        const ttl = await redis.pttl(fullKey);
        retryAfterMs = ttl > 0 ? ttl : safeWindowMs;
      } catch (error) {
        captureError(error, { subsystem: "redis_rate_limit", key });
      }
    }
    if (!count) {
      count = memory.increment(fullKey, safeWindowMs);
      retryAfterMs = memory.ttlMs(fullKey);
    }
    return {
      allowed: count <= safeLimit,
      count,
      limit: safeLimit,
      retry_after_ms: Math.max(0, retryAfterMs)
    };
  }

  async function trackAbuseSignal(key, signal, windowMs = 15 * 60_000) {
    const fullKey = `${cachePrefix}:abuse:${key}`;
    const event = {
      signal: String(signal || "unknown").slice(0, 80),
      at: Date.now()
    };
    if (redis && state.redis.connected) {
      try {
        await redis.zadd(fullKey, event.at, JSON.stringify(event));
        await redis.zremrangebyscore(fullKey, 0, Date.now() - Number(windowMs));
        await redis.pexpire(fullKey, Number(windowMs));
        const count = await redis.zcard(fullKey);
        return { count, window_ms: Number(windowMs) };
      } catch (error) {
        captureError(error, { subsystem: "redis_abuse", key });
      }
    }
    const events = memory.get(fullKey) || [];
    const next = [...events, event].filter((item) => Date.now() - Number(item.at || 0) <= Number(windowMs));
    memory.set(fullKey, next, Number(windowMs));
    return { count: next.length, window_ms: Number(windowMs) };
  }

  function buildAiCacheKey(kind, payload = {}) {
    const normalized = {
      kind,
      model: payload.model || payload.modelKey || "",
      plan: payload.plan || payload.planKey || "",
      prompt: normalizePromptForCache(payload.prompt || payload.message || payload.input || ""),
      context: normalizePromptForCache(payload.context || ""),
      attachments: Number(payload.attachmentCount || 0)
    };
    return `cache:${kind}:${hashPayload(normalized)}`;
  }

  async function getAiCache(kind, payload = {}) {
    const key = buildAiCacheKey(kind, payload);
    const value = await getJson(key);
    const layer = String(kind || "prompt");
    if (value) {
      state.cache.hits += 1;
      if (layer === "semantic") state.cache.semantic_hits += 1;
      if (layer === "prompt") state.cache.prompt_hits += 1;
      if (layer === "faq") state.cache.faq_hits += 1;
      if (layer === "hot") state.cache.hot_hits += 1;
      recordCacheEvent(layer, "hit");
      return { hit: true, key, value, layer };
    }
    state.cache.misses += 1;
    recordCacheEvent(layer, "miss");
    return { hit: false, key, value: null, layer };
  }

  async function setAiCache(kind, payload = {}, value, ttlMs) {
    if (!value) return { written: false };
    const key = buildAiCacheKey(kind, payload);
    const layer = String(kind || "prompt");
    const effectiveTtl = Number(ttlMs || (layer === "semantic" ? semanticCacheTtlMs : hotCacheTtlMs));
    await setJson(key, {
      value,
      cached_at: nowIso(),
      layer,
      model: payload.model || payload.modelKey || null
    }, effectiveTtl);
    state.cache.writes += 1;
    recordCacheEvent(layer, "write");
    return { written: true, key, layer };
  }

  async function enqueueJob(type, payload = {}, opts = {}) {
    const name = String(type || "default").trim() || "default";
    if (queue && state.queue.mode === "bullmq") {
      const counts = await queue.getJobCounts("waiting", "delayed", "active").catch(() => ({}));
      const waiting = Number(counts.waiting || 0) + Number(counts.delayed || 0);
      state.queue.waiting = waiting;
      state.queue.active = Number(counts.active || 0);
      if (waiting >= queueOverflowLimit) {
        return { queued: false, overflow: true, mode: "bullmq", waiting };
      }
      const job = await queue.add(name, payload, opts);
      state.queue.waiting = waiting + 1;
      updateQueueMetric();
      return { queued: true, mode: "bullmq", id: job.id, name };
    }
    if (memoryQueue.length >= queueOverflowLimit) {
      return { queued: false, overflow: true, mode: "memory", waiting: memoryQueue.length };
    }
    const id = crypto.randomBytes(8).toString("hex");
    memoryQueue.push({ id, name, payload, opts, createdAt: Date.now() });
    state.queue.waiting = memoryQueue.length;
    updateQueueMetric();
    return { queued: true, mode: "memory", id, name };
  }

  function startWorkers(handlers = {}) {
    if (queue && state.queue.mode === "bullmq" && Worker) {
      const worker = new Worker(queueName, async (job) => {
        state.queue.active += 1;
        try {
          const handler = handlers[job.name] || handlers.default;
          if (!handler) return { skipped: true, reason: "NO_HANDLER" };
          return await handler(job.data, job);
        } finally {
          state.queue.active = Math.max(0, Number(state.queue.active || 0) - 1);
          updateQueueMetric();
        }
      }, {
        connection: bullConnection || new IORedis(redisUrl, { maxRetriesPerRequest: null }),
        concurrency: Math.max(1, readEnvNumber("AI_WORKER_CONCURRENCY", 3))
      });
      worker.on("completed", () => { state.queue.completed += 1; });
      worker.on("failed", (job, error) => {
        state.queue.failed += 1;
        captureError(error, { subsystem: "ai_worker", job: job?.name });
      });
      workers.push(worker);
      return { mode: "bullmq", workers: workers.length };
    }
    const timer = setInterval(async () => {
      if (!memoryQueue.length) return;
      const job = memoryQueue.shift();
      state.queue.waiting = memoryQueue.length;
      state.queue.active += 1;
      updateQueueMetric();
      try {
        const handler = handlers[job.name] || handlers.default;
        if (handler) await handler(job.payload, job);
        state.queue.completed += 1;
      } catch (error) {
        state.queue.failed += 1;
        captureError(error, { subsystem: "memory_worker", job: job.name });
      } finally {
        state.queue.active = Math.max(0, Number(state.queue.active || 0) - 1);
        updateQueueMetric();
      }
    }, Math.max(100, readEnvNumber("AI_MEMORY_WORKER_INTERVAL_MS", 500)));
    timer.unref?.();
    timers.push(timer);
    return { mode: "memory", workers: timers.length };
  }

  function canCallProvider(provider) {
    const key = String(provider || "unknown").toLowerCase();
    const stateForProvider = circuitBreakers.get(key) || {};
    if (!stateForProvider.openedAt) {
      return { allowed: true, provider: key, state: "closed" };
    }
    const elapsed = Date.now() - Number(stateForProvider.openedAt || 0);
    if (elapsed >= circuitCooldownMs) {
      return { allowed: true, provider: key, state: "half_open" };
    }
    return {
      allowed: false,
      provider: key,
      state: "open",
      retry_after_ms: Math.max(0, circuitCooldownMs - elapsed),
      last_error: stateForProvider.lastError || null
    };
  }

  function recordProviderSuccess(provider, latencyMs = 0) {
    const key = String(provider || "unknown").toLowerCase();
    circuitBreakers.set(key, {
      failures: 0,
      openedAt: 0,
      lastSuccessAt: nowIso(),
      latencyMs: Math.max(0, Number(latencyMs || 0))
    });
    if (metrics.circuitOpen) metrics.circuitOpen.set({ provider: key }, 0);
  }

  function recordProviderFailure(provider, error) {
    const key = String(provider || "unknown").toLowerCase();
    const current = circuitBreakers.get(key) || {};
    const failures = Number(current.failures || 0) + 1;
    const openedAt = failures >= circuitFailureThreshold ? Date.now() : Number(current.openedAt || 0);
    circuitBreakers.set(key, {
      ...current,
      failures,
      openedAt,
      lastErrorAt: nowIso(),
      lastError: String(error?.message || error || "provider_failed").slice(0, 500)
    });
    if (metrics.circuitOpen) metrics.circuitOpen.set({ provider: key }, openedAt ? 1 : 0);
    captureError(error instanceof Error ? error : new Error(String(error || "provider_failed")), {
      subsystem: "provider_circuit",
      provider: key
    });
  }

  function providerTimeoutSignal(timeoutMs = providerTimeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs || providerTimeoutMs)));
    return {
      signal: controller.signal,
      clear: () => clearTimeout(timeout)
    };
  }

  function recordAiRequest(input = {}) {
    const labels = {
      provider: String(input.provider || "unknown"),
      model: String(input.model || "unknown"),
      plan: String(input.plan || "unknown"),
      route_reason: String(input.routeReason || input.route_reason || "unknown").slice(0, 80),
      rag_used: input.ragUsed || input.rag_used ? "true" : "false",
      cached: input.cached ? "true" : "false"
    };
    if (metrics.aiRequests) metrics.aiRequests.inc(labels, 1);
    if (metrics.aiLatency && Number.isFinite(Number(input.latencyMs))) {
      metrics.aiLatency.observe({
        provider: labels.provider,
        model: labels.model,
        plan: labels.plan
      }, Number(input.latencyMs));
    }
    if (metrics.aiCost && Number(input.costUsd || input.cost_usd || 0) > 0) {
      metrics.aiCost.inc({
        provider: labels.provider,
        model: labels.model,
        plan: labels.plan
      }, Number(input.costUsd || input.cost_usd || 0));
    }
  }

  function recordCacheEvent(layer, result) {
    if (metrics.cacheEvents) metrics.cacheEvents.inc({ layer: String(layer || "unknown"), result: String(result || "unknown") }, 1);
  }

  function updateQueueMetric() {
    if (metrics.queueWaiting) metrics.queueWaiting.set({ mode: state.queue.mode }, Number(state.queue.waiting || 0));
  }

  function getMemoryPressure() {
    const usage = process.memoryUsage ? process.memoryUsage() : {};
    const heapUsed = Number(usage.heapUsed || 0);
    const heapTotal = Number(usage.heapTotal || 1);
    const ratio = heapTotal ? heapUsed / heapTotal : 0;
    return {
      rss_mb: Math.round(Number(usage.rss || 0) / 1024 / 1024),
      heap_used_mb: Math.round(heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(heapTotal / 1024 / 1024),
      heap_pressure_percent: Math.round(ratio * 100),
      status: ratio >= 0.9 ? "critical" : ratio >= 0.75 ? "warning" : "ok"
    };
  }

  function getStatus() {
    const cacheTotal = Number(state.cache.hits || 0) + Number(state.cache.misses || 0);
    state.queue.waiting = state.queue.mode === "memory" ? memoryQueue.length : state.queue.waiting;
    updateQueueMetric();
    return {
      generated_at: nowIso(),
      service: serviceName,
      initialized: state.initialized,
      initialized_at: state.initialized_at,
      redis: { ...state.redis },
      queue: { ...state.queue },
      workers: {
        active_workers: workers.length + timers.length,
        mode: state.queue.mode
      },
      cache: {
        ...state.cache,
        memory_keys: memory.size(),
        hit_rate_percent: cacheTotal ? Math.round((Number(state.cache.hits || 0) / cacheTotal) * 100) : 0,
        layers: {
          semantic_cache: true,
          repeated_prompt_cache: true,
          faq_cache: true,
          hot_query_cache: true
        }
      },
      providers: { ...state.providers },
      circuit_breakers: buildCircuitSnapshot(circuitBreakers),
      disaster_protection: { ...state.disaster_protection },
      embeddings: { ...state.embeddings },
      streaming: { ...state.streaming },
      monitoring: { ...state.monitoring },
      memory_pressure: getMemoryPressure(),
      separate_ai_service: {
        enabled: Boolean(process.env.AI_SERVICE_URL || process.env.AI_SERVICE_PORT),
        url_configured: Boolean(process.env.AI_SERVICE_URL),
        port: Number(process.env.AI_SERVICE_PORT || 3020)
      },
      last_error: state.last_error
    };
  }

  async function getPrometheusMetrics() {
    setupPrometheus();
    if (!registry) {
      return "# Prometheus client is not installed.\n";
    }
    return registry.metrics();
  }

  return {
    initialize,
    close,
    getStatus,
    getPrometheusMetrics,
    getJson,
    setJson,
    del,
    consumeRateLimit,
    trackAbuseSignal,
    getAiCache,
    setAiCache,
    buildAiCacheKey,
    enqueueJob,
    startWorkers,
    canCallProvider,
    recordProviderSuccess,
    recordProviderFailure,
    providerTimeoutSignal,
    recordAiRequest,
    captureError,
    normalizePromptForCache
  };
}

module.exports = {
  createRealScaleInfra,
  normalizePromptForCache
};
