# PDF export

Every PDF the site produces — the chat PDF (from the WhatsApp-to-PDF tool
and, in its default look, from the analyzer) and the court evidence
transcript — is laid out as HTML/CSS by the browser, then transcribed into a
vector PDF. This replaced the imperative jsPDF coordinate maths that used to
live in `utils/pdf.ts` and `utils/pdfCourt.ts`
([#391](https://github.com/SpiritFour/whatsanalyze/issues/391)).

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

`utils/pdf/` — the shared pipeline, then one file per document:

| File | Role |
| --- | --- |
| `builder.ts` | The pipeline: HTML in, laid out, measured, placed on pages. |
| `html.ts` | Markup conventions: blocks, per-word spans, pagination attributes. |
| `page.ts` | Page geometry and unit conversion. Each document picks its margins. |
| `document.ts` | The offscreen iframe the layout happens in, and the base stylesheet. |
| `measure.ts` | Reads the finished layout back as a flat list of draw instructions. |
| `emit.ts` | Replays those instructions as vector PDF operators, and paginates. |
| `emoji.ts` | Twemoji artwork: SVG for layout, rasterised PNG for the PDF. |
| `fonts.ts` | Registers one TTF with both jsPDF and the layout document. |
| `court.ts` | The court transcript: audit record, roster, numbered transcript, annexes. |
| `chatStyles.ts`, `chatView.ts`, `chatPdf.ts` | The chat PDF: the chat as on a phone, in a chosen style. |
| `chatPages.ts`, `chatAnalysis.ts`, `chatLabels.ts` | Its cover, outro and analysis pages, and their words (shared by the tool and the analyzer). |
| `index.ts` | Public entry points: `renderCourtPdf`, `renderChatViewPdf`. |

### Pagination

The emitter keeps a block on one page unless told otherwise. Blocks opt into
more through data attributes (documented in `html.ts`):

- `data-break-before` starts a new page; a change of `data-chapter` does too.
- `data-keep-with-next` keeps a heading or table header off the bottom of a
  page on its own.
- `data-splittable` lets a block break across pages, always at a line
  boundary. Court transcript rows and long paragraphs use it; elements marked
  `data-continuation` (the "cont." marker) are drawn only on the continuation.
- `data-table-header` / `data-table` repeat a table's header on every page its
  rows continue on.

Running headers and footers ("Page X of Y", the court hash) are drawn by each
document's furniture callback once the page count is known.

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
- **Only paint the emitter can reproduce.** Solid backgrounds, solid borders,
  border radii, text, images and links (an `<a href>` becomes a clickable
  area). `text-transform` is applied when measuring; `letter-spacing` is not
  reproduced, so do not use it. Gradients, shadows and filters lay out fine and then go
  missing in the PDF.

- **`overflow: hidden` clips.** The browser lays out hidden lines too, so the
  measuring pass drops anything outside an `overflow: hidden` ancestor. That is
  how the court sender column stops at three lines.

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

### Layout on the page, writing in a worker

Layout and measuring need the DOM, so they run on the page, in batches of 150
messages with a yield in between. Writing the PDF (pagination, drawing, and
assembling and compressing the file) runs in a Web Worker
(`writer.worker.ts`), which removed the multi-second freezes at the end of a
long export. What crosses over is data: measured blocks per batch, emoji
rasterised on the page (they need a canvas) once per icon, page backgrounds as
`ChapterValue` data instead of functions. Each document's header and footer
callback runs on the page against a `FurnitureRecorder` (`furniture.ts`) that
writes its drawing calls down and answers its measuring with a local jsPDF;
the worker replays them. Without Worker support the same writer runs on the
page.

The two sides overlap: while the worker draws one batch, the page lays out
the next (`PdfBuilder.add`), with at most one batch in flight. A text node
that sits on one line is measured with a single rect and drawn as one run;
only text over several lines is measured word by word, to learn where each
line breaks. A run whose jsPDF width differs from the browser's by more than
half a pixel gets character spacing that makes up the difference, inside a
graphics save/restore. The layout frame turns kerning and ligatures off,
because jsPDF draws neither.

## One chat PDF, from the analyzer and the tool

The analyzer used to make its own "visual story" PDF (charts as screenshots
of its canvases, dark bubbles). It now downloads the tool's document in the
default look (`PdfDownloadPopup.defaultView`), with a link to the tool for
another; the chat goes along in memory (`useSharedChat`), so it is not
uploaded twice.

Both include the analysis pages after the cover (`chatAnalysis.ts`): headline
numbers, messages per person, over time (a column per day, month, quarter or
year, whichever fits), by hour and by weekday, and fun facts per person. They
are HTML boxes, not chart images: the tool has no charts on its page to
capture, and boxes come out as vector shapes in the design's colours. They
count every message the document is about, also on a preview. The tool can
turn them off (`options.analysis`).

## The WhatsApp-to-PDF tool: one view, three outputs

`/tools/whatsapp-to-pdf` shows the chat the way it looks on a phone and lets the
visitor pick a style (iPhone or Android, light or dark, and an ink saver for
paper) and adjust it (text size, times, photos, names, whose messages go on the
right). `chatView.ts` writes that view as one piece of HTML and one stylesheet,
and three things use it unchanged:

1. **The live preview** (`components/tools/ChatPreview.vue`) puts it in a
   shadow root, so the site's styles cannot reach it.
2. **The browser's print dialog.** `chatViewCss` has `@media print` rules (no
   bubble or header split across sheets, a day label never alone at the bottom
   of a sheet, backgrounds kept with `print-color-adjust: exact`), and
   `chatPrintGlobalCss` adds a named `@page chat` (A4, 12 mm, the style's
   wallpaper) plus the rule that only `#cv-print-root` prints while
   `html.cv-printing` is set. The tool sets that class on `beforeprint` and
   clears it on `afterprint`, so Ctrl+P and the Print button both print just
   the chat. Fonts and `@page` only work from the document, which is why that
   part is injected into `<head>` rather than the shadow root.
3. **The PDF** (`chatPdf.ts`) lays the same markup out through the shared
   pipeline, with the style's wallpaper as the page background.

The PDF (not the preview or the browser printout) adds two pages around the
chat, from `chatPages.ts`: a cover with the logo, the chat's name, members,
period and counts, and, on a preview only, an outro that says how many messages
were left out, links to the tool with the price, and lists the other products.
Its links are clickable, carry `utm_source=chat_pdf` and are printed as plain
addresses as well, for paper.

### Pro designs

With full access (the one-time purchase for that chat, or a subscription) the
design can go further (`chatDesign.ts`, controls in
`components/tools/ChatPdfDesign.vue`):

- **Custom colours.** Four picks (background, their bubbles, your bubbles,
  accent) become a full palette in `deriveStyle`. No text colour is chosen by
  hand: `textOn`/`mutedOn` pick each one for at least 4.5:1 contrast against
  what it sits on, and a participant's name colour is only used where it
  reads on the bubble.
- **Background.** Six patterns drawn on a canvas in the palette's own
  colours (no image files to ship or license), or the buyer's own photo,
  cropped to A4 and faded towards the page colour. The PDF cannot draw
  transparency, so the fading is baked into the JPEG. The writer draws it on
  every chat page under one alias, so it is stored in the file once.
- **Cover.** Own title, a dedication, a cover colour and a cover photo, picked
  from the chat's photos or uploaded. The cover tab of the preview shows the
  PDF's cover from the same markup, scaled to fit.

- **Mood presets.** Romance, Vintage, Midnight, Pastel and High contrast
  (`pro: true` in `chatStyles.ts`). Every preset's text passes 4.5:1, the
  phone presets' timestamps included.
- **Fonts.** A book serif (Lora), a rounded one (Nunito) and a typewriter
  (Courier Prime), all SIL OFL TTFs from npm (`chatFonts.ts`). The engine
  registers any number of families: each is embedded in jsPDF and declared as
  an `@font-face` in the layout frame from the same bytes, the measuring pass
  records each word's family, and the emitter switches per word. A font is
  fetched only when picked (about 270 KB for both weights).
  A font is only offered when it has a glyph for every letter of the chat,
  its names and the cover text: `fontsFor` checks against each font's real
  character map (`chatFontCoverage.ts`, generated from the TTFs by
  `scripts/build-font-coverage.mjs`). Russian loses the typewriter; Greek,
  Arabic, Hebrew and CJK get the default font only. The renderer applies the
  same check, so a remembered choice can never print gaps.
- **Book layout.** Every month is its own chapter (`chat-YYYY-MM`): it opens a
  page with the month as a heading, and the footer names the month.

Free for everyone: paper size (A4, US Letter, A5, with wallpapers drawn at
the sheet's proportions), hiding WhatsApp's own notices, and a date range.
The filters go through `filterChatMessages`, so the preview, printout, PDF and
cover count the same messages, and a sample is the first 100 of what is left.

Everyone can try all of it in the preview. `designForAccess` decides what
prints: without full access the PDF, the Print button and the browser
printout fall back to the preset the custom palette started from, with no
background and the standard cover. The design is remembered so it survives
the trip through Stripe Checkout: colours and background choice in
`localStorage`, the cover's words in `sessionStorage`, the photos in
IndexedDB for the tab (`designStore.ts`, the same rule as the kept export).

The free preview, the printout without a purchase and the sample PDF all stop
at the first 100 messages. The style choice is remembered in `localStorage`, so
a buyer back from Stripe gets the PDF they configured.

Only paint the emitter can reproduce is allowed here too: the styles are solid
colours and uniform corner radii, without bubble tails or shadows.

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

`tests/e2e/pdf.spec.js` exports both documents. The analyzer's export test uses a chat covering every emoji shape in the
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
