const { execSync } = require("child_process");

function hasPg() {
  try {
    require.resolve("pg");
    return true;
  } catch (_) {
    return false;
  }
}

if (hasPg()) {
  console.log("[render-runtime] pg is available for Neon/PostgreSQL.");
  process.exit(0);
}

console.warn("[render-runtime] pg is missing. Attempting runtime install...");

try {
  execSync("npm install pg --no-save", {
    stdio: "inherit",
    env: process.env
  });
} catch (error) {
  console.error("[render-runtime] Failed to install pg automatically.");
  console.error(String(error?.message || error));
  process.exit(1);
}

if (!hasPg()) {
  console.error("[render-runtime] pg still unavailable after runtime install.");
  process.exit(1);
}

console.log("[render-runtime] pg installed successfully.");
