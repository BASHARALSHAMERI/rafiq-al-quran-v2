import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const packageJsonPath = path.join(process.cwd(), "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

console.log("🛡️ Running Database Safety Checks...");

const scripts = packageJson.scripts || {};
const forbiddenSubstrings = [
  "prisma migrate reset",
  "--force-reset",
  "db push --force-reset"
];

let failed = false;

// 1. Check for forbidden commands in all non-test scripts
for (const [scriptName, scriptCmd] of Object.entries(scripts)) {
  if (typeof scriptCmd === "string") {
    // Only 'db:reset' is allowed to have the word "reset" if it throws an error (which we just setup)
    if (scriptName === "db:reset" && scriptCmd.includes("throw new Error")) {
      continue;
    }
    
    for (const forbidden of forbiddenSubstrings) {
      if (scriptCmd.includes(forbidden)) {
        console.error(`❌ [SAFETY VIOLATION] Script '${scriptName}' contains forbidden destructive command: '${forbidden}'`);
        failed = true;
      }
    }
  }
}

// 2. Check if the environment looks accidentally destructive
const dbUrl = process.env.DATABASE_URL || "";
if (process.env.NODE_ENV === "test") {
  if (!dbUrl.toLowerCase().includes("test") && !dbUrl.toLowerCase().includes("ci")) {
    console.error(`❌ [SAFETY VIOLATION] NODE_ENV is 'test', but DATABASE_URL does not point to a test database! URL: ${dbUrl}`);
    failed = true;
  }
}

if (failed) {
  console.error("🚨 Safety checks FAILED. Please fix the violations to prevent accidental data loss.");
  process.exit(1);
} else {
  console.log("✅ Safety checks PASSED. System is configured safely.");
}
