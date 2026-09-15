# PDF export

The chat transcript is laid out as HTML/CSS by the browser, then transcribed
into a vector PDF. This replaced the imperative jsPDF coordinate maths that used
to live in `utils/pdf.ts` ([#391](https://github.com/SpiritFour/whatsanalyze/issues/391)).

## Why not the browser's print dialog

The original idea was to let the browser's own print engine produce the PDF,
ideally without the user noticing. Two findings ruled that out:

1. **`window.print()` always shows the dialog.** It takes no parameters and
   blocks while the dialog is open; suppressing it needs Chrome's
   `--kiosk-printing` flag or a headless browser server-side. Neither is
   available to a static site, and server-side rendering would break the
   no-upload promise outright.
2. **Printing would not have fixed emoji anyway.** PDF has no notion of the
   colour tables that colour emoji fonts live in — CBDT/CBLC (Noto), sbix
   (Apple), COLR/CPAL (Segoe), OT-SVG. Anything left as *text* comes out
   monochrome, and Chrome's print-to-PDF is reported to drop emoji to white
   outlines for exactly this reason.

So the emoji requirement forces emoji to be drawn as artwork no matter which
engine writes the file — which removes the main argument for the print dialog.

## The pipeline

`utils/pdf/` — each stage is one file:

| File | Role |
| --- | --- |
| `template.ts` | The document as HTML. Cover, charts, fun facts, message bubbles, outro. |
| `theme.ts` | Page geometry and the stylesheet. |
| `document.ts` | The offscreen iframe the layout happens in. |
| `measure.ts` | Reads the finished layout back as a flat list of draw instructions. |
| `emit.ts` | Replays those instructions as vector PDF operators, and paginates. |
| `emoji.ts` | Twemoji artwork: SVG for layout, rasterised PNG for the PDF. |
| `fonts.ts` | Registers one TTF with both jsPDF and the layout document. |
| `index.ts` | Orchestration, batching and progress. |

The important property: **nothing computes a position.** The browser decides
where every word, bubble and image goes, and the measuring pass only transcribes
the result. Changing a padding is a CSS edit, not an offset recalculation.

### Things that are load-bearing

- **One font, two consumers.** `assets/pdf-fonts/Helvetica.js` is registered
  with jsPDF *and* declared as an `@font-face` in the layout frame. Two
  different files would make the measured x-positions drift against the glyphs
  actually drawn.
- **An iframe, not a hidden div.** Vuetify, Tailwind preflight and any global
  stylesheet stop at the frame boundary, so a CSS change elsewhere on the site
  cannot alter a paid export. It is positioned offscreen rather than hidden —
  `display: none` subtrees have no boxes to measure.
- **One `.wa-w` span per word.** This is what gets a box per word straight from
  the browser's line breaker. Beware descendant selectors like `.wa-day span`:
  they match every word span individually.
- **No mutation during a measuring pass.** Reads against one settled layout are
  cheap; a single write between them forces a reflow per word.
- **Only paint the emitter can reproduce.** Solid backgrounds, border radii,
  text and images. Gradients, shadows and filters lay out fine and then go
  missing in the PDF.

### Emoji artwork

Emoji are substituted with `<img>` elements *before* layout, so the line breaker
reserves real space for them and the measured position is exactly where the
artwork belongs. twemoji's matcher handles ZWJ sequences, variation selectors
and skin-tone modifiers, so those arrive as one image rather than a pile of
components.

`scripts/build-twemoji-sprite.mjs` bundles all ~3,700 SVGs into a single
`static/twemoji-sprite.json` at build time (`build:before` hook in
`nuxt.config.js`; git-ignored). It has to be one file: fetching
`/twemoji/1f602.svg` the moment someone exports would let anyone reading the
access log infer which emoji that chat contains. One request for the whole set
leaks nothing. It costs ~1.4 MB gzipped, fetched only when a chat actually
contains emoji, and cached afterwards.

### Main thread, not a worker

A Worker has no DOM, and the DOM is the layout engine, so the old
`assets/js/pdf.worker.js` is gone. Messages are processed in batches of 300 with
a yield in between so the progress bar repaints and the tab stays responsive.

## Cost

Roughly 2 ms per message on a desktop browser — 5,000 messages export in about
10 seconds, so the progress bar matters. Streams are Flate-compressed
(`compress: true`): drawing a word at a time produces very repetitive content,
and the same 5,000-message chat is 23 MB uncompressed against 3.2 MB
compressed.

## Known limitations

- **Emoji are not in the text layer.** They are images, so a text search for 😂
  finds nothing. Emitting invisible text behind them was considered and dropped:
  the embedded font has no emoji glyphs, so the extracted characters would be
  wrong, and corrupt search results are worse than absent ones.
- **Font coverage.** The bundled Helvetica does not cover every script. Where a
  glyph is missing the browser falls back to another font for layout while
  jsPDF draws its own, so a non-Latin *word* can render wrong. Because
  positions are measured per word, the damage stays inside that word instead of
  shifting the line. The old pipeline drew tofu for the same input.
- **Charts are raster.** They are snapshots of `<canvas>` elements, so they
  cannot be anything else.

## Testing

`tests/e2e/pdf.spec.js` exports a chat covering every emoji shape in the
acceptance criteria and asserts on the produced bytes: an embedded font program
plus text operators (the transcript is real, searchable text), image XObjects
(the emoji artwork is there), a single same-origin request for the sprite, and
no request carrying chat content. It also runs on the mobile project.

To look at the output rather than assert on it, save the download to disk and
render it:

```bash
pdftoppm -png -r 80 -f 1 -l 4 out.pdf page   # visual check
pdftotext out.pdf -                          # text layer
```
