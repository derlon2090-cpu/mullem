const { execSync } = require("child_process");

function hasMysql2() {
  try {
    require.resolve("mysql2/promise");
    return true;
  } catch (_) {
    return false;
  }
}

if (hasMysql2()) {
  console.log("[render-runtime] mysql2 is available.");
  process.exit(0);
}

console.warn("[render-runtime] mysql2 is missing. Attempting runtime install...");

try {
  execSync("npm install mysql2 --no-save", {
    stdio: "inherit",
    env: process.env
  });
} catch (error) {
  console.error("[render-runtime] Failed to install mysql2 automatically.");
  console.error(String(error?.message || error));
  process.exit(1);
}

if (!hasMysql2()) {
  console.error("[render-runtime] mysql2 still unavailable after runtime install.");
  process.exit(1);
}

console.log("[render-runtime] mysql2 installed successfully.");
