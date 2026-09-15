/**
 * Bundles every Twemoji SVG into a single `static/twemoji-sprite.json`.
 *
 * The PDF exporter draws emoji as artwork rather than as text, because PDF has
 * no notion of the colour tables (CBDT/sbix/COLR/OT-SVG) that colour emoji
 * fonts live in -- any emoji left as text comes out monochrome, whatever the
 * generator.
 *
 * It has to be *one* file rather than 3.7k individual assets: fetching
 * `/twemoji/1f602.svg` the moment someone exports a chat would let anyone
 * reading the access log infer which emoji that chat contains. One request for
 * the whole set leaks nothing. It costs ~1.4 MB gzipped, fetched lazily on the
 * first export only and cached from then on.
 *
 * Generated at build time (see the `build:before` hook in nuxt.config.js) and
 * git-ignored -- 8 MB of derived JSON does not belong in the repo.
 */
import { createRequire } from "node:module";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);

const OUTPUT = resolve(process.cwd(), "static/twemoji-sprite.json");

async function main() {
  const assetDir = dirname(require.resolve("@twemoji/svg/package.json"));
  const files = (await readdir(assetDir)).filter((name) =>
    name.endsWith(".svg")
  );

  if (files.length === 0) {
    throw new Error(`No Twemoji SVGs found in ${assetDir}`);
  }

  const sprite = {};
  for (const file of files) {
    const svg = await readFile(join(assetDir, file), "utf8");
    // Keys are Twemoji icon ids ("1f602", "1f469-1f3fd-200d-1f4bb"), which is
    // exactly what twemoji's own parser hands us at runtime.
    sprite[file.slice(0, -4)] = svg.trim();
  }

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(sprite));

  const bytes = Buffer.byteLength(JSON.stringify(sprite));
  console.log(
    `twemoji sprite: ${files.length} emoji, ${(bytes / 1024 / 1024).toFixed(
      1
    )} MB -> static/twemoji-sprite.json`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
