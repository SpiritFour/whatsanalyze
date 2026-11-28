import type jsPDF from "jspdf";

/**
 * Running headers and footers ("Page 3 of 40", the court hash), drawn by
 * each document's own callback once the page count is known.
 *
 * The PDF is written in a Web Worker (utils/pdf/writer.worker.ts), and a
 * callback cannot be sent there. So the callback runs on the page against a
 * recorder: its drawing calls are written down, its measuring calls
 * (getTextWidth, splitTextToSize) are answered by a jsPDF kept only for
 * measuring, with the same fonts. The worker then replays the recording on
 * the real document. A callback is written once and works either way.
 */

/** What a furniture callback may call: the subset of jsPDF it uses. */
export interface FurnitureDoc {
  setTextColor(..._args: any[]): unknown;
  setFontSize(_size: number): unknown;
  setFont(_family: string, _style?: string): unknown;
  text(..._args: any[]): unknown;
  setDrawColor(..._args: any[]): unknown;
  setLineWidth(_width: number): unknown;
  line(..._args: any[]): unknown;
  getTextWidth(_text: string): number;
  splitTextToSize(_text: string, _width: number): string[];
}

export type FurnitureOp = [string, unknown[]];

/** The drawing calls a recorder writes down; anything else is measuring. */
const DRAWING = [
  "setTextColor",
  "setFontSize",
  "setFont",
  "text",
  "setDrawColor",
  "setLineWidth",
  "line",
] as const;

export class FurnitureRecorder implements FurnitureDoc {
  ops: FurnitureOp[] = [];
  private measure: jsPDF;

  constructor(measure: jsPDF) {
    this.measure = measure;
  }

  private record(method: string, args: unknown[]) {
    this.ops.push([method, args]);
    // Font state matters to measuring too.
    if (method === "setFont" || method === "setFontSize") {
      (this.measure as any)[method](...args);
    }
    return this;
  }

  setTextColor(...args: any[]) {
    return this.record("setTextColor", args);
  }

  setFontSize(size: number) {
    return this.record("setFontSize", [size]);
  }

  setFont(family: string, style?: string) {
    return this.record(
      "setFont",
      style === undefined ? [family] : [family, style],
    );
  }

  text(...args: any[]) {
    return this.record("text", args);
  }

  setDrawColor(...args: any[]) {
    return this.record("setDrawColor", args);
  }

  setLineWidth(width: number) {
    return this.record("setLineWidth", [width]);
  }

  line(...args: any[]) {
    return this.record("line", args);
  }

  getTextWidth(text: string): number {
    return this.measure.getTextWidth(text);
  }

  splitTextToSize(text: string, width: number): string[] {
    return this.measure.splitTextToSize(text, width);
  }
}

/** Plays a recording onto the current page of the real document. */
export function replayFurniture(doc: jsPDF, ops: FurnitureOp[]): void {
  for (const [method, args] of ops) {
    if (!(DRAWING as readonly string[]).includes(method)) continue;
    (doc as any)[method](...args);
  }
}
