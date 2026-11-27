import { DEFAULT_FONT, PDF_FONT_FAMILY, fontFaceCss } from "~/utils/pdf/fonts";
import type { PdfFont } from "~/utils/pdf/fonts";
import { contentWidthPx, pageWidthPx } from "~/utils/pdf/page";
import type { PageGeometry } from "~/utils/pdf/page";

/**
 * What every document's stylesheet starts from. The document-specific CSS is
 * appended after it, and may only use paint the emitter can reproduce: solid
 * background colours, solid borders, border radii, text and images. Gradients,
 * shadows and filters would lay out fine and then silently go missing in the
 * PDF.
 */
function baseCss(geometry: PageGeometry): string {
  return `
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: ${pageWidthPx(geometry)}px;
  background: transparent;
  font-family: "WaPdf", sans-serif;
  /* The emitter reads per-word boxes, so the browser must not reflow text
     between measuring and drawing. Nothing here may depend on viewport size. */
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
  /* Mobile browsers inflate text in narrow frames. The document is a fixed
     sheet, not something to be made readable on a phone. */
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

.wa-flow { width: ${contentWidthPx(geometry)}px; }

/* A block is the unit of pagination: it is kept whole on one page unless it is
   splittable or taller than a page by itself. */
.wa-block { width: 100%; position: relative; }

/* Emoji are artwork, not glyphs -- see utils/pdf/emoji.ts. Sizing them here is
   what makes the browser reserve the right space while wrapping the line. */
.wa-emoji {
  display: inline-block;
  height: 1.15em;
  width: 1.15em;
  vertical-align: -0.2em;
  margin: 0 0.05em;
}
`;
}

/**
 * The offscreen surface the document is laid out on.
 *
 * It is an iframe rather than a hidden div so the export cannot be disturbed by
 * the host page: Vuetify, Tailwind preflight and any global stylesheet stop at
 * the frame boundary, and a chat exported today lays out the same way after the
 * next CSS change on the site.
 *
 * It is positioned offscreen rather than hidden, because `display: none` and
 * `visibility: hidden` subtrees have no boxes to measure.
 */
/** A measured box in CSS px, relative to the flow container. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class LayoutSurface {
  private iframe: HTMLIFrameElement;
  private win!: Window;
  private doc!: Document;
  private flow!: HTMLElement;
  private measureContext!: CanvasRenderingContext2D;
  private ascentCache = new Map<string, { ascent: number; descent: number }>();

  private css: string;
  private fonts: PdfFont[];
  private textRange: Range | null = null;
  /** The flow's position during the current measuring pass. */
  private origin: DOMRect | null = null;

  private constructor(
    iframe: HTMLIFrameElement,
    css: string,
    fonts: PdfFont[],
  ) {
    this.iframe = iframe;
    this.css = css;
    this.fonts = fonts;
  }

  static async create(
    geometry: PageGeometry,
    css: string,
    extraFonts: PdfFont[] = [],
  ): Promise<LayoutSurface> {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("tabindex", "-1");
    iframe.style.cssText = [
      "position:fixed",
      "left:-20000px",
      "top:0",
      `width:${pageWidthPx(geometry)}px`,
      // Tall enough that nothing is ever clipped or virtualised away; the
      // frame is offscreen so the height costs nothing visually.
      "height:20000px",
      "border:0",
      "opacity:0",
      "pointer-events:none",
    ].join(";");

    document.body.appendChild(iframe);

    const surface = new LayoutSurface(iframe, baseCss(geometry) + css, [
      DEFAULT_FONT,
      ...extraFonts,
    ]);
    await surface.init();
    return surface;
  }

  private async init(): Promise<void> {
    const win = this.iframe.contentWindow;
    const doc = this.iframe.contentDocument;
    if (!win || !doc) throw new Error("Could not open the PDF layout frame");

    this.win = win;
    this.doc = doc;

    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaceCss(this.fonts)}${this.css}</style></head><body><div class="wa-flow"></div></body></html>`,
    );
    doc.close();

    this.flow = doc.querySelector(".wa-flow") as HTMLElement;

    const canvas = doc.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not measure text for the PDF");
    this.measureContext = context;

    // Measuring before the webfont is live would produce fallback-font metrics
    // and misplace every word in the document.
    await doc.fonts.ready;
    for (const font of this.fonts) {
      await doc.fonts.load(`400 14px "${font.family}"`);
      await doc.fonts.load(`700 14px "${font.family}"`);
    }
  }

  /**
   * The registered family a computed `font-family` resolves to: the first
   * name in the list that is one of ours. Anything else is drawn in the
   * default font, which is what the layout fell back to as well.
   */
  familyOf(fontFamily: string): string {
    for (const name of fontFamily.split(",")) {
      const family = name.trim().replace(/^["']|["']$/g, "");
      if (this.fonts.some((font) => font.family === family)) return family;
    }
    return PDF_FONT_FAMILY;
  }

  /** One Range reused for every word of a measuring pass. */
  get range(): Range {
    this.textRange ??= this.doc.createRange();
    return this.textRange;
  }

  get document(): Document {
    return this.doc;
  }

  get window(): Window {
    return this.win;
  }

  /**
   * Replaces the flow contents and waits until everything is laid out and every
   * image has real dimensions -- measuring an undecoded image would size it 0.
   */
  async render(html: string): Promise<HTMLElement[]> {
    this.flow.innerHTML = html;

    // Emoji are sized by the stylesheet, so their layout does not wait for
    // them to decode; only pictures sized by their own pixels do. Waiting for
    // thousands of emoji decodes was a third of a long export's idle time.
    const images = Array.from(
      this.flow.querySelectorAll<HTMLImageElement>("img:not([data-emoji])"),
    );
    await Promise.all(
      images.map((image) =>
        image.complete && image.naturalWidth > 0
          ? Promise.resolve()
          : image.decode().catch(() => undefined),
      ),
    );

    // Force layout so every rect read afterwards is served from one settled
    // layout pass rather than triggering a reflow each time.
    void this.flow.offsetHeight;
    // Nothing moves while a batch is measured, so the flow's own position is
    // read once here instead of once per element.
    this.origin = this.flow.getBoundingClientRect();

    return Array.from(this.flow.querySelectorAll<HTMLElement>("[data-block]"));
  }

  /** Flow-relative box, i.e. with the flow container's origin at (0, 0). */
  boxOf(element: Element): Box {
    const origin = this.origin ?? this.flow.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    return {
      x: box.left - origin.left,
      y: box.top - origin.top,
      width: box.width,
      height: box.height,
    };
  }

  rectsOf(range: Range | Element): Box[] {
    const origin = this.origin ?? this.flow.getBoundingClientRect();
    const out: Box[] = [];
    for (const rect of range.getClientRects()) {
      if (rect.width > 0 && rect.height > 0) {
        out.push({
          x: rect.left - origin.left,
          y: rect.top - origin.top,
          width: rect.width,
          height: rect.height,
        });
      }
    }
    return out;
  }

  /**
   * Font ascent/descent for a given size and weight, used to turn a measured
   * box into the baseline jsPDF draws from.
   */
  metricsFor(
    fontSize: number,
    bold: boolean,
    family: string = PDF_FONT_FAMILY,
  ): { ascent: number; descent: number } {
    const key = `${family}-${bold ? 700 : 400}-${fontSize}`;
    const cached = this.ascentCache.get(key);
    if (cached) return cached;

    this.measureContext.font = `${bold ? 700 : 400} ${fontSize}px "${family}"`;
    const metrics = this.measureContext.measureText("Hxg");
    const value = {
      ascent: metrics.fontBoundingBoxAscent ?? fontSize * 0.8,
      descent: metrics.fontBoundingBoxDescent ?? fontSize * 0.2,
    };
    this.ascentCache.set(key, value);
    return value;
  }

  destroy(): void {
    this.iframe.remove();
  }
}
