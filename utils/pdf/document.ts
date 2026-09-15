import { DOCUMENT_CSS, PAGE_WIDTH_PX } from "~/utils/pdf/theme";
import { pdfFontFaceCss } from "~/utils/pdf/fonts";

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
export class LayoutSurface {
  private iframe: HTMLIFrameElement;
  private win!: Window;
  private doc!: Document;
  private flow!: HTMLElement;
  private measureContext!: CanvasRenderingContext2D;
  private ascentCache = new Map<string, { ascent: number; descent: number }>();

  private constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  static async create(): Promise<LayoutSurface> {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("tabindex", "-1");
    iframe.style.cssText = [
      "position:fixed",
      "left:-20000px",
      "top:0",
      `width:${PAGE_WIDTH_PX}px`,
      // Tall enough that nothing is ever clipped or virtualised away; the
      // frame is offscreen so the height costs nothing visually.
      "height:20000px",
      "border:0",
      "opacity:0",
      "pointer-events:none",
    ].join(";");

    document.body.appendChild(iframe);

    const surface = new LayoutSurface(iframe);
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
      `<!doctype html><html><head><meta charset="utf-8"><style>${pdfFontFaceCss()}${DOCUMENT_CSS}</style></head><body><div class="wa-flow"></div></body></html>`
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
    await doc.fonts.load('400 14px "WaPdf"');
    await doc.fonts.load('700 14px "WaPdf"');
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

    const images = Array.from(this.flow.querySelectorAll("img"));
    await Promise.all(
      images.map((image) =>
        image.complete && image.naturalWidth > 0
          ? Promise.resolve()
          : image.decode().catch(() => undefined)
      )
    );

    // Force layout so every rect read afterwards is served from one settled
    // layout pass rather than triggering a reflow each time.
    void this.flow.offsetHeight;

    return Array.from(this.flow.querySelectorAll<HTMLElement>("[data-block]"));
  }

  /** Flow-relative box, i.e. with the flow container's origin at (0, 0). */
  boxOf(element: Element): DOMRect {
    const origin = this.flow.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    return new DOMRect(
      box.left - origin.left,
      box.top - origin.top,
      box.width,
      box.height
    );
  }

  rectsOf(range: Range | Element): DOMRect[] {
    const origin = this.flow.getBoundingClientRect();
    return Array.from(range.getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map(
        (rect) =>
          new DOMRect(
            rect.left - origin.left,
            rect.top - origin.top,
            rect.width,
            rect.height
          )
      );
  }

  /**
   * Font ascent/descent for a given size and weight, used to turn a measured
   * box into the baseline jsPDF draws from.
   */
  metricsFor(
    fontSize: number,
    bold: boolean
  ): { ascent: number; descent: number } {
    const key = `${bold ? 700 : 400}-${fontSize}`;
    const cached = this.ascentCache.get(key);
    if (cached) return cached;

    this.measureContext.font = `${bold ? 700 : 400} ${fontSize}px "WaPdf"`;
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
