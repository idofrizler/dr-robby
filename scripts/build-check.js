const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const required = ["index.html", "styles.css", "main.js"];
for (const file of required) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) {
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
}

try {
  execSync("node --check main.js", { stdio: "inherit" });
} catch (error) {
  process.exit(error.status || 1);
}

console.log("Build check passed.");
