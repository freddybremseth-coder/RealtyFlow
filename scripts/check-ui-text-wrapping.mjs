import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cssPath = path.join(root, "src", "index.css");
const css = fs.readFileSync(cssPath, "utf8");

const requiredCss = [
  ".rf-text-protected",
  ".rf-text-nowrap",
  ".rf-text-breakable",
  "word-break: keep-all",
  "overflow-wrap: normal",
  "hyphens: none",
  ":where(.break-all, .break-words, .hyphens-auto):not(.rf-text-breakable)",
];

const missing = requiredCss.filter((token) => !css.includes(token));
if (missing.length) {
  console.error("UI text wrapping guard is incomplete:", missing.join(", "));
  process.exit(1);
}

const scanRoots = ["components", "pages", "src"];
const sourceExtensions = new Set([".tsx", ".ts", ".jsx", ".js"]);
const riskyUtilities = ["break-all", "break-words", "hyphens-auto"];
const violations = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      walk(full);
      continue;
    }

    if (!sourceExtensions.has(path.extname(entry.name))) continue;
    const text = fs.readFileSync(full, "utf8");

    for (const utility of riskyUtilities) {
      let index = text.indexOf(utility);
      while (index !== -1) {
        const start = Math.max(0, index - 180);
        const end = Math.min(text.length, index + utility.length + 180);
        const nearby = text.slice(start, end);

        if (!nearby.includes("rf-text-breakable")) {
          const line = text.slice(0, index).split("\n").length;
          violations.push(
            `${path.relative(root, full)}:${line} uses ${utility} without rf-text-breakable`
          );
        }
        index = text.indexOf(utility, index + utility.length);
      }
    }
  }
}

for (const dir of scanRoots) walk(path.join(root, dir));

if (violations.length) {
  console.error(
    [
      "Unsafe UI text wrapping detected.",
      "Human-facing names and labels must not split inside words.",
      "If this is a URL/ID/path that genuinely needs emergency wrapping, add rf-text-breakable.",
      "",
      ...violations.map((item) => "- " + item),
    ].join("\n")
  );
  process.exit(1);
}

console.log("UI text wrapping guard OK");
