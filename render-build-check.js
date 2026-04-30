const path = require("path");

function verifyModule(specifier) {
  try {
    const resolved = require.resolve(specifier);
    console.log(`[render-build-check] OK ${specifier} -> ${resolved}`);
    return true;
  } catch (error) {
    console.error(`[render-build-check] MISSING ${specifier}`);
    console.error(error?.message || error);
    process.exitCode = 1;
    return false;
  }
}

const checks = [
  "pg",
  path.join(process.cwd(), "postgres-db.js"),
  path.join(process.cwd(), "server.js")
];

let passed = true;
for (const specifier of checks) {
  passed = verifyModule(specifier) && passed;
}

if (!passed) {
  console.error("[render-build-check] Build verification failed.");
  process.exit(1);
}

console.log("[render-build-check] Build verification completed successfully.");
