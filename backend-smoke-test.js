"use strict";

const { requestJson } = require("./request-lite");

const BASE_URL = String(process.env.MULLEM_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

async function expectJson(path, expectedStatus) {
  const response = await requestJson(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json" }
  });

  if (response.payload && Object.prototype.hasOwnProperty.call(response.payload, "raw")) {
    throw new Error(`${path} did not return JSON. Status=${response.status} Body=${String(response.text || "").slice(0, 200)}`);
  }

  if (response.status !== expectedStatus) {
    throw new Error(`${path} returned ${response.status} instead of ${expectedStatus}. Payload=${JSON.stringify(response.payload)}`);
  }

  console.log(`PASS ${path} -> ${response.status}`);
  return response.payload;
}

async function main() {
  const health = await expectJson("/api/health", 200);
  if (!health?.status || !health?.db) {
    throw new Error("/api/health response is missing expected fields.");
  }

  const ready = await requestJson(`${BASE_URL}/api/ready`, {
    headers: { Accept: "application/json" }
  });
  if (![200, 503].includes(ready.status)) {
    throw new Error(`/api/ready returned unexpected status ${ready.status}`);
  }
  console.log(`PASS /api/ready -> ${ready.status}`);

  const notFound = await expectJson("/api/not-a-real-route", 404);
  if (!/route not found/i.test(String(notFound?.message || ""))) {
    throw new Error("/api/not-a-real-route did not return a route-not-found message.");
  }

  console.log("Backend smoke test completed successfully.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
