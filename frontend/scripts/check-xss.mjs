import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src");
const disallowedPatterns = [
  "dangerouslySetInnerHTML",
  "innerHTML",
  "insertAdjacentHTML"
];
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

const walk = (directory) => {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (allowedExtensions.has(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }

  return files;
};

const violations = [];

for (const file of walk(root)) {
  const content = readFileSync(file, "utf8");

  for (const pattern of disallowedPatterns) {
    if (content.includes(pattern)) {
      violations.push({
        file,
        pattern
      });
    }
  }
}

if (violations.length > 0) {
  console.error("XSS guard failed. Disallowed patterns found:");
  for (const violation of violations) {
    console.error(`- ${violation.pattern} in ${path.relative(process.cwd(), violation.file)}`);
  }
  process.exit(1);
}

console.log("XSS guard passed.");
