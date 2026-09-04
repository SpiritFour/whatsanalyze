const assert = require("assert");
const fs = require("fs");
const path = require("path");

const distDirectory = path.resolve(__dirname, "..", "dist");
const expectedFiles = [
  "index.html",
  "200.html",
  "sw.js",
  "about/index.html",
  "de/index.html",
  "pwa-results/index.html",
  "subscribe/index.html",
  "tools/index.html",
  "tools/inactivity/index.html",
  "whatsapp-to-pdf/index.html",
  "whatsapp-wrapped-year-review/index.html",
];

for (const relativePath of expectedFiles) {
  const filePath = path.join(distDirectory, relativePath);
  assert(fs.existsSync(filePath), `Missing generated file: ${relativePath}`);
  assert(
    fs.statSync(filePath).size > 0,
    `Generated file is empty: ${relativePath}`
  );
}

const generatedAssets = fs.readdirSync(path.join(distDirectory, "_nuxt"));
assert(
  fs.existsSync(path.join(distDirectory, "manifest.webmanifest")) ||
    generatedAssets.some((fileName) => fileName.endsWith(".webmanifest")),
  "Missing generated web app manifest"
);
assert(
  generatedAssets.some(
    (fileName) =>
      fileName.endsWith(".worker.js") ||
      (fileName.includes(".worker-") && fileName.endsWith(".js"))
  ),
  "Missing generated web worker"
);

console.log(`Verified ${expectedFiles.length} pages and required PWA assets.`);
