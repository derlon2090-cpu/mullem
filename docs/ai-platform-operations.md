# AI Platform Operations

## Architecture

The platform has three runtime services:

- Web Service: serves the app and protected APIs.
- AI Worker: processes background jobs through Redis/BullMQ.
- AI Service: private service for routing, provider calls, caching, and streaming-ready AI operations.

Shared dependencies:

- PostgreSQL/Neon for durable app data.
- Render Key Value/Redis for rate limits, queue state, AI cache, session cache, worker heartbeat, abuse tracking, and temporary memory.
- Sentry for operational errors.
- Prometheus endpoint for metrics.

## AI Flow

1. User request reaches the Web Service.
2. Auth, plan limits, XP, token limits, abuse checks, and safe mode run first.
3. Model routing chooses the model and provider.
4. RAG retrieves approved Knowledge Base context when relevant.
5. Cache is checked before provider calls.
6. Provider call runs with timeout, circuit breaker, retry budget, and fallback policy.
7. Usage, quality, cost, RAG use, latency, and route reason are recorded.

## Routing

Routing is versioned by `AI_ROUTING_VERSION`.

Default policy:

- Free: lowest-cost DeepSeek path when available.
- Spark: DeepSeek + limited GPT mini paths.
- Tuwaiq: reasoning and creative paths.
- Pioneer: highest limits and priority.

Routing changes must update `AI_ROUTING_VERSION` and pass staging release gates.

## Cost System

The cost system tracks:

- Daily site cost.
- Plan-level daily cost.
- User-level cost.
- Input and output token estimates.
- Image, RAG, and code cost categories when recorded.

If the error budget or cost guardrail is breached, actions are:

- Warning at 80%.
- Safe Mode near hard stop.
- Disable heavy features and images when needed.
- Force low-cost models for free users.

## Queue System

BullMQ uses Redis when `REDIS_URL` is configured.

Worker jobs include:

- Embeddings generation.
- Analytics aggregation.
- Weekly reports.
- Abuse analysis.
- Referral rewards.
- AI recommendations.
- Quality scoring.

Worker health is published as `worker:heartbeat` and shown in `/api/admin/real-scale`.

## RAG System

RAG uses approved Knowledge Base entries only.

Rules:

- `draft` and `rejected` entries do not enter retrieval.
- All user-derived content must be sanitized.
- Embeddings remain disabled in production until staging proves pgvector or Qdrant quality.
- Keyword fallback stays available for rollback.

## Safe Mode

Safe Mode activates when:

- Admin forces it.
- Provider health degrades.
- Site daily cost is blocked.
- Error budget evaluation recommends it.

Effects:

- Free users use low-cost routing.
- Images can be disabled.
- Heavy requests can be disabled.
- Context can be reduced.

## Recovery Flow

Provider failure recovery:

1. Circuit breaker checks provider state.
2. Timeout protects the request.
3. Retry budget limits repeated failures.
4. Provider fallback is used only if `provider_fallback` feature flag is enabled.
5. Failures are visible in AI health, Sentry, and Prometheus metrics.

## Feature Flags

Admin flags:

- `embeddings`
- `streaming`
- `advanced_rag`
- `provider_fallback`
- `smart_routing`
- `beta_features`

Endpoint:

- `GET /api/admin/feature-flags`
- `POST /api/admin/feature-flags`

Feature flags are stored through Redis when available and fall back to process memory.

## AI Versioning

Versioned areas:

- `AI_PROMPTS_VERSION`
- `AI_ROUTING_VERSION`
- `AI_RAG_VERSION`
- `AI_SCORING_VERSION`
- `AI_LIMITS_VERSION`
- `AI_COST_POLICY_VERSION`
- `AI_FEATURE_FLAGS_VERSION`

Every important prompt, routing, RAG, scoring, or limit change should update the matching version.

## Deployment Steps

1. Deploy to staging.
2. Run `npm run ai:release-gate` against staging.
3. Review `/api/admin/ops`.
4. Promote to production manually.
5. Run `npm run ai:production-activation-check` against production.

## Incident Handling

Use `/api/admin/incidents` for production incidents.

Record:

- Severity.
- Owner.
- Affected systems.
- Timeline events.
- Resolution.
- Postmortem for SEV1/SEV2.

Do not store raw user conversations, API keys, private URLs, or sensitive data in incidents.
