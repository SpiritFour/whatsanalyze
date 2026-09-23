#!/usr/bin/env node
// The templates ask for icons by name (`<v-icon>mdi-cog</v-icon>`), and
// utils/mdiPaths.js is the only place those names have path data now. A name
// that is not in the map renders an empty <svg> — visible to nobody until a
// screenshot, so check the two agree.
//
// Dynamic names still have to be written out somewhere as `mdi-...` strings
// for this to find them, which is how every one of them is written today.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = [
  "components",
  "pages",
  "layouts",
  "utils",
  "composables",
  "stores",
  "plugins",
];
const EXT = new Set([".vue", ".js", ".ts"]);

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXT.has(path.extname(entry.name))) out.push(full);
  }
  return out;
};

const used = new Map();
for (const dir of DIRS) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) continue;
  for (const file of walk(full)) {
    // The map itself, and the plugin that imports vuetify/iconsets/mdi-svg.
    if (
      file.endsWith(path.join("utils", "mdiPaths.js")) ||
      file.endsWith(path.join("plugins", "vuetify-icons.js"))
    )
      continue;
    const source = fs.readFileSync(file, "utf8");
    for (const [name] of source.matchAll(/mdi-[a-z0-9-]+/g)) {
      if (!used.has(name)) used.set(name, path.relative(root, file));
    }
  }
}

const map = fs.readFileSync(path.join(root, "utils/mdiPaths.js"), "utf8");
const mapped = new Set(
  [...map.matchAll(/"(mdi-[a-z0-9-]+)":/g)].map((m) => m[1]),
);

const missing = [...used].filter(([name]) => !mapped.has(name));
const unused = [...mapped].filter((name) => !used.has(name));

for (const [name, file] of missing)
  console.error(`missing from utils/mdiPaths.js: ${name}  (${file})`);
for (const name of unused)
  console.error(`in utils/mdiPaths.js but nothing draws it: ${name}`);

if (missing.length || unused.length) {
  console.error(
    `\n${missing.length} missing, ${unused.length} unused. Regenerate the map or drop the icon.`,
  );
  process.exit(1);
}
console.log(`utils/mdiPaths.js matches the ${mapped.size} icons in use.`);
