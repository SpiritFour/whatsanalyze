import { PdfWriter } from "~/utils/pdf/emit";
import type { WriterOptions } from "~/utils/pdf/emit";
import type { MeasuredBlock } from "~/utils/pdf/measure";
import type { FurnitureOp } from "~/utils/pdf/furniture";

/**
 * Writes the PDF off the page.
 *
 * Laying the document out needs the page's DOM, so that part stays there;
 * everything after it (paginating, drawing every word, image and shape, and
 * assembling and compressing the file) happens here. The last step alone
 * held the page for seconds on a long chat; now the page stays responsive
 * throughout. See utils/pdf/builder.ts for the other side.
 */

type Message =
  | { id: number; type: "init"; payload: WriterOptions }
  | { id: number; type: "emoji"; payload: Record<string, string> }
  | { id: number; type: "place"; payload: MeasuredBlock[] }
  | { id: number; type: "chapters" }
  | {
      id: number;
      type: "finish";
      payload: { title: string; pages: FurnitureOp[][] };
    };

let writer: PdfWriter | null = null;

const scope = self as unknown as {
  onmessage: ((_event: MessageEvent<Message>) => void) | null;
  postMessage: (_message: unknown, _transfer?: ArrayBuffer[]) => void;
};

scope.onmessage = ({ data }) => {
  try {
    if (data.type === "init") {
      writer = new PdfWriter(data.payload);
      scope.postMessage({ id: data.id });
      return;
    }
    if (!writer) throw new Error("PDF writer not initialised");

    if (data.type === "emoji") {
      writer.addEmoji(data.payload);
      scope.postMessage({ id: data.id });
    } else if (data.type === "place") {
      writer.place(data.payload);
      scope.postMessage({ id: data.id });
    } else if (data.type === "chapters") {
      scope.postMessage({ id: data.id, result: writer.chapters });
    } else if (data.type === "finish") {
      const bytes = writer.finishRecorded(
        data.payload.title,
        data.payload.pages,
      );
      writer = null;
      // Transferred, not copied: a long chat's PDF is tens of megabytes.
      scope.postMessage({ id: data.id, result: bytes }, [bytes]);
    }
  } catch (error) {
    scope.postMessage({
      id: data.id,
      error:
        error instanceof Error ? error.stack || error.message : String(error),
    });
  }
};
