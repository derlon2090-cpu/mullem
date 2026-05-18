"use strict";

const http = require("http");
const { createRealScaleInfra } = require("./ai-real-scale-infra");
const aiIntelligence = require("./ai-intelligence-layer");

const PORT = Number(process.env.AI_SERVICE_PORT || process.env.PORT || 3020);
const infra = createRealScaleInfra({ serviceName: "mullem-ai-service" });

function sendJson(res, statusCode, payload, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(JSON.stringify(payload));
}

function sendSseHeaders(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
}

function sse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function parseJsonBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 2 * 1024 * 1024) {
      throw new Error("REQUEST_TOO_LARGE");
    }
  }
  if (!body.trim()) return {};
  return JSON.parse(body);
}

function readEnvValue(keys, fallback = "") {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    const value = String(process.env[key] || "").trim();
    if (value) return value;
  }
  return String(fallback || "").trim();
}

function selectProviderAndModel(input = {}) {
  const plan = String(input.plan || "free").toLowerCase();
  const message = String(input.message || input.prompt || "");
  const analysis = aiIntelligence.analyzeRequest({
    message,
    requestedModel: input.model || input.requestedModel,
    attachmentCount: Number(input.attachmentCount || 0)
  });
  const deepseekKey = readEnvValue(["DEEPSEEK_API_KEY", "ORLIXOR_DEEPSEEK_API_KEY"], "");
  const openaiKey = readEnvValue("OPENAI_API_KEY", "");

  if (plan === "free" || !openaiKey) {
    return {
      provider: "deepseek",
      model: analysis.needsReasoning && plan !== "free" ? "deepseek-reasoner" : "deepseek-chat",
      reason: plan === "free" ? "free_cost_guardrail" : "openai_unavailable",
      analysis,
      configured: Boolean(deepseekKey)
    };
  }

  if ((analysis.needsReasoning || analysis.needsCoding) && deepseekKey && plan !== "spark") {
    return {
      provider: "deepseek",
      model: "deepseek-reasoner",
      reason: "reasoning_or_coding_cost_optimized",
      analysis,
      configured: true
    };
  }

  return {
    provider: "openai",
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    reason: "paid_default_quality",
    analysis,
    configured: Boolean(openaiKey)
  };
}

async function postJson(url, headers, body, timeoutMs = 30_000) {
  const { signal, clear } = infra.providerTimeoutSignal(timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal
    });
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_) {
      data = { raw: text };
    }
    if (!response.ok) {
      throw new Error(data?.error?.message || data?.message || `HTTP_${response.status}`);
    }
    return data;
  } finally {
    clear();
  }
}

async function callProvider(route, input = {}) {
  const providerState = infra.canCallProvider(route.provider);
  if (!providerState.allowed) {
    throw new Error(`PROVIDER_CIRCUIT_OPEN:${route.provider}`);
  }
  const startedAt = Date.now();
  try {
    let data;
    if (route.provider === "deepseek") {
      const key = readEnvValue(["DEEPSEEK_API_KEY", "ORLIXOR_DEEPSEEK_API_KEY"], "");
      if (!key) throw new Error("DEEPSEEK_API_KEY_MISSING");
      data = await postJson(
        process.env.DEEPSEEK_CHAT_COMPLETIONS_ENDPOINT || "https://api.deepseek.com/chat/completions",
        {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        {
          model: route.model,
          messages: [{ role: "user", content: String(input.message || input.prompt || "") }],
          temperature: Number(input.temperature || 0.4),
          max_tokens: Math.max(128, Math.min(Number(input.max_tokens || input.maxTokens || 900), 4000))
        }
      );
      const text = data?.choices?.[0]?.message?.content || "";
      infra.recordProviderSuccess(route.provider, Date.now() - startedAt);
      return { text, usage: data?.usage || {}, provider: route.provider, model: route.model };
    }

    const key = readEnvValue("OPENAI_API_KEY", "");
    if (!key) throw new Error("OPENAI_API_KEY_MISSING");
    data = await postJson(
      process.env.OPENAI_CHAT_COMPLETIONS_ENDPOINT || "https://api.openai.com/v1/chat/completions",
      {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      {
        model: route.model,
        messages: [{ role: "user", content: String(input.message || input.prompt || "") }],
        temperature: Number(input.temperature || 0.4),
        max_tokens: Math.max(128, Math.min(Number(input.max_tokens || input.maxTokens || 900), 4000))
      }
    );
    const text = data?.choices?.[0]?.message?.content || "";
    infra.recordProviderSuccess(route.provider, Date.now() - startedAt);
    return { text, usage: data?.usage || {}, provider: route.provider, model: route.model };
  } catch (error) {
    infra.recordProviderFailure(route.provider, error);
    throw error;
  }
}

async function generateResponse(payload = {}) {
  const route = selectProviderAndModel(payload);
  if (!route.configured) {
    throw new Error(`${route.provider.toUpperCase()}_NOT_CONFIGURED`);
  }
  const cache = await infra.getAiCache("semantic", {
    plan: payload.plan,
    model: route.model,
    prompt: payload.message || payload.prompt || "",
    context: payload.context || ""
  });
  if (cache.hit) {
    return {
      ...cache.value.value,
      cached: true,
      route
    };
  }
  const result = await callProvider(route, payload);
  await infra.setAiCache("semantic", {
    plan: payload.plan,
    model: route.model,
    prompt: payload.message || payload.prompt || "",
    context: payload.context || ""
  }, result);
  infra.recordAiRequest({
    provider: result.provider,
    model: result.model,
    plan: payload.plan || "unknown",
    routeReason: route.reason,
    ragUsed: Boolean(payload.context),
    latencyMs: 0,
    cached: false
  });
  return {
    ...result,
    cached: false,
    route
  };
}

function streamText(res, text) {
  const parts = String(text || "").match(/.{1,80}(\s|$)/g) || [String(text || "")];
  for (const part of parts) {
    sse(res, "delta", { text: part });
  }
}

async function routeRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { ok: true, service: "mullem-ai-service", infra: infra.getStatus() });
    return;
  }

  if (req.method === "GET" && url.pathname === "/metrics") {
    const body = await infra.getPrometheusMetrics();
    res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" });
    res.end(body);
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/route") {
    const payload = await parseJsonBody(req);
    sendJson(res, 200, { ok: true, route: selectProviderAndModel(payload) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/chat") {
    const payload = await parseJsonBody(req);
    const result = await generateResponse(payload);
    sendJson(res, 200, { ok: true, ...result });
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/chat/stream") {
    const payload = await parseJsonBody(req);
    sendSseHeaders(res);
    try {
      const route = selectProviderAndModel(payload);
      sse(res, "route", { provider: route.provider, model: route.model, reason: route.reason });
      const result = await generateResponse(payload);
      streamText(res, result.text);
      sse(res, "done", { ok: true, cached: result.cached, usage: result.usage || {} });
      res.end();
    } catch (error) {
      sse(res, "error", { ok: false, error: error?.message || String(error) });
      res.end();
    }
    return;
  }

  sendJson(res, 404, { ok: false, error: "ROUTE_NOT_FOUND" });
}

async function main() {
  await infra.initialize();
  const server = http.createServer((req, res) => {
    routeRequest(req, res).catch((error) => {
      infra.captureError(error, { service: "mullem-ai-service", url: req.url });
      sendJson(res, 500, { ok: false, error: "AI_SERVICE_ERROR", message: error?.message || String(error) });
    });
  });
  server.listen(PORT, () => {
    console.log(`Mullem AI service running on http://127.0.0.1:${PORT}`);
  });
}

if (require.main === module) {
  main().catch((error) => {
    infra.captureError(error, { service: "mullem-ai-service" });
    console.error("AI_SERVICE_FAILED", error?.stack || error?.message || error);
    process.exit(1);
  });
}

module.exports = {
  selectProviderAndModel,
  generateResponse,
  routeRequest
};
