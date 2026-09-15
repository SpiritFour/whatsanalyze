/**
 * Page geometry and the stylesheet for the exported document.
 *
 * The layout is plain HTML/CSS laid out by the browser; the emitter then
 * transcribes the resulting boxes into vector PDF operators. That puts one
 * constraint on this stylesheet: only use paint the emitter can reproduce --
 * solid background colours, border radii, text and images. Gradients, shadows
 * and filters would lay out fine and then silently go missing in the PDF.
 */

/** CSS reference pixels per millimetre (1px = 1/96in by definition). */
export const PX_PER_MM = 96 / 25.4;

export const PAGE = {
  widthMm: 210,
  heightMm: 297,
  marginMm: 14,
};

export const PAGE_WIDTH_PX = PAGE.widthMm * PX_PER_MM;
export const PAGE_HEIGHT_PX = PAGE.heightMm * PX_PER_MM;
export const PAGE_MARGIN_PX = PAGE.marginMm * PX_PER_MM;

/** Footer strip reserved at the bottom of every page for the page number. */
export const FOOTER_HEIGHT_PX = 26;

export const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - 2 * PAGE_MARGIN_PX;
export const CONTENT_HEIGHT_PX =
  PAGE_HEIGHT_PX - 2 * PAGE_MARGIN_PX - FOOTER_HEIGHT_PX;

export const COLORS = {
  brand: "#21a68d",
  chatBackground: "#0d1418",
  bubble: "#262d31",
  bubbleEgo: "#0e6162",
  bubbleSystem: "#353526",
  systemText: "#f9d964",
  text: "#ffffff",
  mutedText: "#c8c8c8",
  onLight: "#0d1418",
  light: "#ffffff",
  /** Fallback when a participant's colour collides with the brand background. */
  authorFallback: "#20c5ff",
};

/**
 * Built from the same TTF that jsPDF embeds, so the widths the browser lays out
 * with are the widths the PDF renders with. Two different files here would make
 * every measured x-position drift against the glyphs actually drawn.
 */
export function fontFaceCss(normalBase64: string, boldBase64: string): string {
  return `
@font-face {
  font-family: "WaPdf";
  font-style: normal;
  font-weight: 400;
  src: url(data:font/truetype;charset=utf-8;base64,${normalBase64}) format("truetype");
}
@font-face {
  font-family: "WaPdf";
  font-style: normal;
  font-weight: 700;
  src: url(data:font/truetype;charset=utf-8;base64,${boldBase64}) format("truetype");
}`;
}

export const DOCUMENT_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: ${PAGE_WIDTH_PX}px;
  background: transparent;
  font-family: "WaPdf", sans-serif;
  /* The emitter reads per-word boxes, so the browser must not reflow text
     between measuring and drawing. Nothing here may depend on viewport size. */
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
  /* Mobile browsers inflate text in narrow frames. The document is a fixed A4
     sheet, not something to be made readable on a phone. */
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

.wa-flow {
  width: ${CONTENT_WIDTH_PX}px;
  margin: 0 auto;
}

/* A block is the unit of pagination: it is kept whole on one page unless it is
   taller than a page by itself. */
.wa-block { width: 100%; }

/* ---------- cover ---------- */

.wa-cover-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 48px;
}
.wa-cover-wordmark { font-size: 30px; font-weight: 700; color: ${COLORS.onLight}; }
.wa-cover-logo { width: 46px; height: 46px; }
.wa-title { font-size: 58px; font-weight: 700; color: ${COLORS.onLight}; padding-bottom: 36px; }
.wa-cover-dates { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 40px; }
.wa-cover-date-label { font-size: 15px; color: ${COLORS.onLight}; padding-bottom: 6px; }
/* Long weekday + month names in six locales; small enough that the two columns
   never meet in the middle. */
.wa-cover-date-value { font-size: 19px; font-weight: 700; color: ${COLORS.onLight}; }
.wa-cover-date-right { text-align: right; }
.wa-stat { padding-bottom: 14px; }
.wa-stat-value { font-size: 40px; font-weight: 700; color: ${COLORS.onLight}; }
.wa-stat-unit { font-size: 20px; color: ${COLORS.onLight}; padding-left: 8px; }
.wa-participants { padding-top: 26px; display: flex; flex-wrap: wrap; gap: 10px; }
.wa-participant {
  font-size: 17px;
  font-weight: 700;
  color: ${COLORS.light};
  border-radius: 999px;
  padding: 7px 16px;
}

/* ---------- charts & fun facts ---------- */

.wa-heading { font-size: 34px; font-weight: 700; padding-bottom: 16px; }
.wa-chart { padding-bottom: 34px; }
.wa-chart img { display: block; width: 100%; }
.wa-fact { padding-bottom: 22px; }
.wa-fact-lines { padding-top: 10px; }
.wa-fact-line { font-size: 15px; color: ${COLORS.onLight}; padding-bottom: 4px; }

/* ---------- messages ---------- */

.wa-day {
  display: flex;
  justify-content: center;
  padding: 14px 0 10px;
}
/* Class rather than \`.wa-day span\`: every word is wrapped in its own span for
   measuring, and a descendant selector would give each word its own pill. */
.wa-day-label {
  font-size: 12px;
  color: ${COLORS.mutedText};
  background: ${COLORS.bubble};
  border-radius: 8px;
  padding: 5px 12px;
}

.wa-message { display: flex; padding-bottom: 8px; }
.wa-message.is-ego { justify-content: flex-end; }
.wa-message.is-system { justify-content: center; }

.wa-bubble {
  max-width: 76%;
  min-width: 90px;
  border-radius: 10px;
  padding: 7px 10px 6px;
  background: ${COLORS.bubble};
}
.is-ego .wa-bubble { background: ${COLORS.bubbleEgo}; }
.is-system .wa-bubble {
  background: ${COLORS.bubbleSystem};
  max-width: 68%;
  min-width: 0;
  text-align: center;
}

.wa-author { font-size: 12px; font-weight: 700; padding-bottom: 3px; color: ${COLORS.mutedText}; }
.is-system .wa-author { display: none; }

.wa-text {
  font-size: 13.5px;
  line-height: 19px;
  color: ${COLORS.text};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.is-system .wa-text { color: ${COLORS.systemText}; font-size: 12.5px; }

.wa-attachment { padding: 2px 0 4px; }
.wa-attachment img { display: block; max-width: 100%; border-radius: 6px; }

.wa-time {
  font-size: 10px;
  color: ${COLORS.mutedText};
  text-align: right;
  padding-top: 3px;
}
.is-system .wa-time { display: none; }

/* Emoji are artwork, not glyphs -- see utils/pdf/emoji.ts. Sizing them here is
   what makes the browser reserve the right space while wrapping the line. */
.wa-emoji {
  display: inline-block;
  height: 1.15em;
  width: 1.15em;
  vertical-align: -0.2em;
  margin: 0 0.05em;
}

/* ---------- outro ---------- */

.wa-outro-title { font-size: 46px; font-weight: 700; color: ${COLORS.onLight}; padding-bottom: 12px; }
.wa-outro-text { font-size: 20px; color: ${COLORS.onLight}; }
`;
