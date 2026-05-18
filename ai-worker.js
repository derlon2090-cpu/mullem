"use strict";

const { createRealScaleInfra } = require("./ai-real-scale-infra");

const infra = createRealScaleInfra({ serviceName: "mullem-ai-worker" });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acknowledgeJob(name, payload = {}) {
  const startedAt = Date.now();
  await sleep(Math.max(5, Math.min(Number(process.env.AI_WORKER_SIMULATED_MS || 25), 1000)));
  return {
    ok: true,
    job: name,
    processed_at: new Date().toISOString(),
    latency_ms: Date.now() - startedAt,
    payload_keys: Object.keys(payload || {}).slice(0, 20)
  };
}

const handlers = {
  "embeddings:generation": async (payload) => {
    return acknowledgeJob("embeddings:generation", payload);
  },
  "analytics:aggregation": async (payload) => {
    return acknowledgeJob("analytics:aggregation", payload);
  },
  "reports:weekly": async (payload) => {
    return acknowledgeJob("reports:weekly", payload);
  },
  "abuse:analysis": async (payload) => {
    return acknowledgeJob("abuse:analysis", payload);
  },
  "referrals:rewards": async (payload) => {
    return acknowledgeJob("referrals:rewards", payload);
  },
  "ai:recommendations": async (payload) => {
    return acknowledgeJob("ai:recommendations", payload);
  },
  "quality:scoring": async (payload) => {
    return acknowledgeJob("quality:scoring", payload);
  },
  default: async (payload, job) => {
    return acknowledgeJob(job?.name || "default", payload);
  }
};

async function main() {
  await infra.initialize();
  const workerState = infra.startWorkers(handlers);
  console.log(JSON.stringify({
    ok: true,
    service: "mullem-ai-worker",
    worker: workerState,
    status: infra.getStatus()
  }, null, 2));
}

process.on("SIGINT", async () => {
  await infra.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await infra.close();
  process.exit(0);
});

main().catch((error) => {
  infra.captureError(error, { service: "mullem-ai-worker" });
  console.error("AI_WORKER_FAILED", error?.stack || error?.message || error);
  process.exit(1);
});
