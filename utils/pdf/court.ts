import {
  PdfBuilder,
  anyEmoji,
  nextFrame,
  toDataUrl,
} from "~/utils/pdf/builder";
import { messageToHtml } from "~/utils/pdf/emoji";
import { block, emojiText, words, wrapWords } from "~/utils/pdf/html";
import type { BlockOptions } from "~/utils/pdf/html";
import { A4 } from "~/utils/pdf/page";
import type { PageGeometry } from "~/utils/pdf/page";
import { getAttachment } from "~/utils/attachments";
import type { Attachment, AttachmentSource } from "~/utils/attachments";
import {
  buildCanonicalTranscript,
  buildMonthlyCounts,
  buildRoster,
  buildTranscript,
  formatExtractionTimestamp,
  formatFileSize,
  formatHash,
  sha256Hex,
} from "~/utils/courtEvidence";

/**
 * The court evidence export: a sober, high-contrast transcript for courts and
 * authorities. Numbered lines, exact timestamps, SHA-256 fingerprints, an
 * exhibit index with the images themselves, and a signature page. Everything
 * but those images (and emoji artwork) is grayscale so it survives
 * photocopying, scanning and monochrome printing.
 *
 * Written as HTML/CSS and printed through the same pipeline as the visual
 * export (utils/pdf/builder.ts): the browser does the line breaking and column
 * layout, the emitter only transcribes it. The stylesheet is in millimetres
 * and points so it reads like the print spec it is.
 */

/** Name, size and SHA-256 of the uploaded export. */
export interface ChatSource {
  name?: string;
  size?: number;
  sha256?: string | null;
}

export interface RenderCourtPdfOptions {
  chat: any;
  attachments: AttachmentSource[];
  isSample?: boolean;
  source?: ChatSource | null;
  onProgress?: (_percent: number) => void;
  /** A4 (default) or US Letter, which US courts and lawyers file on. */
  paper?: "a4" | "letter";
}

/** Wide left margin: room for two/four-hole punching, binding and stamps. */
export const COURT_GEOMETRY: PageGeometry = {
  ...A4,
  margin: { top: 26, right: 15, bottom: 22, left: 28 },
};

/** US Letter: same margins; the message column takes the extra width. */
const LETTER = { widthMm: 215.9, heightMm: 279.4 };

export function courtGeometry(paper: "a4" | "letter" = "a4"): PageGeometry {
  return paper === "letter" ? { ...COURT_GEOMETRY, ...LETTER } : COURT_GEOMETRY;
}

const SAMPLE_MESSAGE_COUNT = 100;
const ROWS_PER_BATCH = 300;
const CHAPTER = "court";

// Grays as the old jsPDF export used them (0–255 levels).
const GRAY = {
  muted: "#5a5a5a", // 90
  faint: "#787878", // 120
  rule: "#aaaaaa", // 170
  rowRule: "#d7d7d7", // 215
};

const COURT_CSS = `
.c-doc, .wa-block { color: #000; font-size: 9.5pt; line-height: 4.2mm; }

/* ---------- cover ---------- */
.c-title { font-size: 20pt; font-weight: 700; line-height: 8mm; }
.c-subtitle { font-size: 10.5pt; line-height: 5mm; padding-top: 0.5mm; }
.c-note {
  font-size: 8.5pt; line-height: 4mm; color: ${GRAY.muted};
  padding-bottom: 1.5mm; border-bottom: 0.6mm solid #000; margin-bottom: 7mm;
}

.c-notice { border: 0.5mm solid #000; padding: 3mm 4mm 3.5mm; margin-bottom: 6mm; }
.c-notice-title { font-size: 9.5pt; font-weight: 700; line-height: 5mm; }
.c-notice-text { font-size: 8.5pt; line-height: 4.2mm; }

/* ---------- sections ---------- */
.c-heading {
  font-size: 11pt; font-weight: 700; line-height: 5mm;
  padding: 3mm 0 1.2mm; border-bottom: 0.4mm solid #000; margin-bottom: 2.5mm;
}
.c-space { height: 3mm; }

.c-kv { display: grid; grid-template-columns: 50mm 1fr; padding-bottom: 0.8mm; }
.c-kv-label { font-weight: 700; padding-right: 2mm; }
.c-kv-value { overflow-wrap: anywhere; white-space: pre-wrap; }

.c-paragraph { white-space: pre-wrap; }
.c-paragraph.is-small { font-size: 8.5pt; color: ${GRAY.muted}; padding-bottom: 4mm; }
.c-caption { font-size: 8pt; color: ${GRAY.muted}; padding-bottom: 1.5mm; }

/* ---------- tables ---------- */
.c-row { display: grid; column-gap: 2mm; }
.c-head {
  font-size: 8pt; font-weight: 700;
  padding-bottom: 0.8mm; border-bottom: 0.3mm solid #000; margin-bottom: 1.4mm;
}
.c-rule { border-bottom: 0.1mm solid ${GRAY.rowRule}; padding-bottom: 1.2mm; margin-bottom: 1.2mm; }
.c-meta { font-size: 8pt; }
.c-right { text-align: right; }
.c-nowrap { white-space: nowrap; }
.c-wrap { overflow-wrap: anywhere; white-space: pre-wrap; }

/* number · date & time · sender · message, at the old export's columns */
.c-transcript { grid-template-columns: 7mm 30mm 30mm 1fr; }
.c-no { color: ${GRAY.muted}; }
.c-time { color: ${GRAY.muted}; }
/* At most three lines of sender; the roster has every name in full. */
.c-sender { font-weight: 700; max-height: 12.6mm; overflow: hidden; overflow-wrap: anywhere; }
.c-message { overflow-wrap: anywhere; white-space: pre-wrap; }
.c-exhibit-ref { white-space: normal; }
.c-cont { position: absolute; left: 0; top: 0; font-size: 8pt; color: ${GRAY.muted}; }

.c-roster { grid-template-columns: 64mm 18mm 38mm 1fr; }
.c-index { grid-template-columns: 16mm 8mm 30mm 26mm 1fr; }
.c-index-detail { grid-column: 2 / -1; font-size: 7pt; color: ${GRAY.muted}; overflow-wrap: anywhere; }

.c-months { grid-template-columns: 28mm 10mm repeat(4, 24mm); }
.c-months .is-empty { color: ${GRAY.faint}; }
.c-month-name { max-height: 8.4mm; overflow: hidden; overflow-wrap: anywhere; }

/* ---------- exhibit images ---------- */
.c-figure { padding-bottom: 8mm; }
.c-figure-caption { display: flex; gap: 3mm; font-size: 8pt; padding-bottom: 1mm; }
.c-figure-label { font-weight: 700; flex: none; }
/* one line: the index above has the full details */
.c-figure-text { color: ${GRAY.muted}; white-space: nowrap; overflow: hidden; }
.c-figure img { display: block; max-width: 100%; max-height: 115mm; }
.c-figure-missing { font-size: 8pt; color: ${GRAY.muted}; }

/* ---------- signature ---------- */
.c-signature { padding-top: 12mm; }
.c-signature-line {
  width: 80mm; border-top: 0.3mm solid #000; padding-top: 1mm;
  font-size: 8pt; color: ${GRAY.muted}; margin-bottom: 17mm;
}

.c-preview-title { font-size: 16pt; font-weight: 700; line-height: 8mm; }
`;

const pad = (lineNumber: number) => String(lineNumber).padStart(4, "0");

function courtBlock(html: string, options: BlockOptions = {}): string {
  return block(CHAPTER, html, options);
}

function heading(text: string, options: BlockOptions = {}): string {
  return courtBlock(
    `<div class="c-heading">${words(text.toUpperCase())}</div>`,
    {
      keepWithNext: true,
      ...options,
    },
  );
}

function keyValue(label: string, value: string | string[]): string {
  const lines = Array.isArray(value) ? value : [value || "—"];
  return courtBlock(
    `<div class="c-kv">
       <div class="c-kv-label">${words(label)}</div>
       <div class="c-kv-value">${lines.map((line) => `<div>${words(line)}</div>`).join("")}</div>
     </div>`,
  );
}

function paragraph(text: string, small = false): string {
  return courtBlock(
    `<div class="c-paragraph${small ? " is-small" : ""}">${words(text)}</div>`,
    { splittable: true },
  );
}

function noticeBox(title: string, text: string): string {
  return courtBlock(
    `<div class="c-notice">
       <div class="c-notice-title">${words(title)}</div>
       <div class="c-notice-text">${words(text)}</div>
     </div>`,
  );
}

function cells(cellsHtml: Array<{ html: string; className?: string }>): string {
  return cellsHtml
    .map(
      ({ html, className = "" }) => `<div class="${className}">${html}</div>`,
    )
    .join("");
}

function tableHeader(
  table: string,
  className: string,
  labels: Array<{ label: string; className?: string }>,
): string {
  return courtBlock(
    `<div class="c-row c-head ${className}">${cells(
      labels.map(({ label, className: cell }) => ({
        html: words(label),
        className: cell,
      })),
    )}</div>`,
    { tableHeader: table, keepWithNext: true },
  );
}

export async function renderCourtPdf(
  options: RenderCourtPdfOptions,
): Promise<Blob> {
  const {
    chat,
    attachments,
    isSample = false,
    source = null,
    onProgress,
    paper = "a4",
  } = options;

  const participants = Object.keys(chat.personColorMap || {});
  const messages = isSample
    ? chat.chatObject.slice(0, SAMPLE_MESSAGE_COUNT)
    : chat.chatObject;
  const { rows, exhibits, stats } = buildTranscript(messages, participants);
  const roster = buildRoster(messages, participants);

  // The source file is the better fingerprint, but it is gone once the chat
  // comes back from the browser session (e.g. after the Stripe redirect). The
  // transcript as printed is then hashed instead, and labelled as such.
  const sourceHash = source?.sha256 || null;
  const documentHash =
    sourceHash || (await sha256Hex(buildCanonicalTranscript(rows)));

  // Exhibits first: the annex needs every hash, and reading the media is the
  // slow part of a chat with many photos.
  const images = new Map<string, Attachment>();
  for (let index = 0; index < exhibits.length; index++) {
    const exhibit = exhibits[index];
    const attachment = await getAttachment(exhibit.fileName, attachments);
    const bytes = attachment.src;
    if (attachment.mimeTypeData.renderInPDF)
      images.set(exhibit.label, attachment);
    if (bytes) {
      exhibit.size = bytes.length;
      exhibit.sha256 = await sha256Hex(bytes);
    } else if (
      attachments.some((file) => file.name.includes(exhibit.fileName))
    ) {
      // a chat restored from the browser session keeps the file names of
      // its export but not the files themselves
      exhibit.notLoaded = true;
    }
    onProgress?.(((index + 1) / exhibits.length) * 15);
  }

  const builder = await PdfBuilder.create({
    geometry: courtGeometry(paper),
    css: COURT_CSS,
    background: () => null,
    needsEmoji: anyEmoji([
      ...rows.map((row: any) => row.text),
      ...participants,
    ]),
  });

  try {
    //   ----- COVER PAGE
    let html = courtBlock(
      `<div class="c-title">${words("WHATSAPP CHAT TRANSCRIPT")}</div>
       <div class="c-subtitle">${words("Evidence copy — verbatim transcript of a WhatsApp chat export")}</div>
       <div class="c-note">${words("Produced in the browser with whatsanalyze.com. The chat was never uploaded to a server.")}</div>`,
      { breakBefore: true },
    );

    if (isSample) {
      html += noticeBox(
        "PREVIEW COPY — NOT FOR SUBMISSION",
        "This preview contains the first 100 messages only and is therefore not a complete record. " +
          "Download the full transcript before filing it with a court or authority.",
      );
    }

    html += heading("1. Document integrity & audit record");
    html += keyValue(
      "Source file",
      source?.name || "not recorded (chat restored from this browser session)",
    );
    if (source?.size)
      html += keyValue("Source file size", formatFileSize(source.size));
    html += keyValue(
      sourceHash ? "SHA-256 (source file)" : "SHA-256 (transcript)",
      formatHash(documentHash),
    );
    html += keyValue(
      "Verification",
      sourceHash
        ? `Recompute with: shasum -a 256 "${source?.name || "export file"}"`
        : "Recompute over the transcript text: line number, timestamp, sender and message " +
            "of every row, separated by tabs, rows separated by newlines.",
    );
    html += keyValue("Extracted (client-side)", formatExtractionTimestamp());
    html += keyValue(
      "Transcript period",
      stats.start && stats.end ? `${stats.start}  to  ${stats.end}` : "—",
    );
    html += keyValue(
      "Messages in transcript",
      `${stats.total} (including ${stats.system} system ${
        stats.system === 1 ? "notice" : "notices"
      })`,
    );
    html += keyValue("Media files referenced", String(stats.media));
    html += keyValue("Deleted messages", String(stats.deleted));
    html += keyValue("Participants", String(roster.length));
    html += courtBlock('<div class="c-space"></div>');

    html += heading("2. Participant roster");
    html += courtBlock(
      `<div class="c-caption">${words("Names and numbers exactly as contained in the WhatsApp export.")}</div>`,
      { keepWithNext: true },
    );
    html += tableHeader("roster", "c-roster", [
      { label: "Name / number as exported" },
      { label: "Messages", className: "c-right" },
      { label: "First message" },
      { label: "Last message" },
    ]);
    for (const person of roster) {
      html += courtBlock(
        `<div class="c-row c-rule c-roster">${cells([
          { html: emojiText(person.name, builder.sprite), className: "c-wrap" },
          { html: words(String(person.messages)), className: "c-meta c-right" },
          { html: words(person.first), className: "c-meta c-nowrap" },
          { html: words(person.last), className: "c-meta c-nowrap" },
        ])}</div>`,
        { table: "roster" },
      );
    }
    html += courtBlock('<div class="c-space"></div>');

    html += heading("3. Integrity declaration");
    html += paragraph(
      "This document was generated directly from the WhatsApp chat export identified above, " +
        "inside the browser of the person who exported it. Messages are reproduced in full, " +
        "unabridged and in their original order, including system notices and notices about " +
        "deleted messages. No message was added, removed, shortened or reworded, and no content " +
        "was translated or corrected. Timestamps are printed to the second in the time zone stated " +
        "above, as recorded in the export. The SHA-256 values in this document identify the source " +
        "file and every attachment; recomputing them over the same files reproduces the same values.",
    );
    await builder.add(html);

    //   ----- TRANSCRIPT
    html = heading("4. Transcript", { breakBefore: true });
    html += tableHeader("transcript", "c-transcript", [
      { label: "No." },
      { label: "Date & time" },
      { label: "Sender" },
      { label: "Message" },
    ]);

    for (let start = 0; start < rows.length; start += ROWS_PER_BATCH) {
      const batch = rows.slice(start, start + ROWS_PER_BATCH);
      for (const row of batch) {
        // The exhibit reference has to stay with the message it belongs to.
        const exhibitRef = row.exhibit
          ? `<div class="c-exhibit-ref">${words(`[Exhibit ${row.exhibit} — see annex A]`)}</div>`
          : "";
        html += courtBlock(
          `<div class="c-row c-rule c-transcript">${cells([
            {
              html: words(pad(row.lineNumber)),
              className: "c-meta c-no c-nowrap",
            },
            { html: words(row.timestamp), className: "c-meta c-time c-nowrap" },
            {
              html: emojiText(row.speaker, builder.sprite),
              className: "c-meta c-sender",
            },
            {
              html:
                wrapWords(messageToHtml(row.text, builder.sprite)) + exhibitRef,
              className: "c-message",
            },
          ])}</div>
           <div class="c-cont" data-continuation>${words("cont.")}</div>`,
          { table: "transcript", splittable: true },
        );
      }
      await builder.add(html);
      html = "";
      onProgress?.(
        15 + ((start + batch.length) / Math.max(rows.length, 1)) * 75,
      );
      await nextFrame();
    }
    if (!rows.length) await builder.add(html);

    //   ----- ANNEX A: MEDIA EXHIBITS
    if (exhibits.length) {
      html = heading("Annex A — index of media exhibits", {
        breakBefore: true,
      });
      html += paragraph(
        "Every file referenced in the transcript, in the order of its first appearance. " +
          "Hashes are computed over the file as it is contained in the export. " +
          '"not contained in the export" means the chat text refers to a file that ' +
          "the export did not include — most often because it was exported without media. " +
          '"not loaded" means the export contains the file, but it was not available when ' +
          "this document was generated, so it could not be hashed. JPEG and PNG images are " +
          "reproduced after the index; other media is listed only.",
        true,
      );
      html += tableHeader("exhibits", "c-index", [
        { label: "Exhibit" },
        { label: "Line" },
        { label: "Date & time" },
        { label: "Sender" },
        { label: "File" },
      ]);

      for (const exhibit of exhibits) {
        const detail =
          `${exhibit.fileType || "unknown type"} · ` +
          (exhibit.sha256
            ? `${formatFileSize(exhibit.size ?? NaN)} · SHA-256 ${exhibit.sha256}`
            : exhibit.notLoaded
              ? "contained in the export, not loaded · SHA-256 —"
              : "not contained in the export · SHA-256 —");
        html += courtBlock(
          `<div class="c-row c-rule c-index c-meta">${cells([
            { html: words(exhibit.label), className: "c-nowrap" },
            { html: words(pad(exhibit.lineNumber)), className: "c-nowrap" },
            { html: words(exhibit.timestamp), className: "c-nowrap" },
            {
              html: emojiText(exhibit.sender, builder.sprite),
              className: "c-wrap",
            },
            { html: words(exhibit.fileName), className: "c-wrap" },
            { html: words(detail), className: "c-index-detail" },
          ])}</div>`,
          { table: "exhibits" },
        );
      }
      await builder.add(html);

      // The photos themselves, as contained in the export: JPEGs are embedded
      // byte for byte, so the image in the PDF is the file the hash identifies.
      const figures: string[] = [];
      for (const exhibit of exhibits) {
        const image = images.get(exhibit.label);
        if (!image?.src || !image.width || !image.height) continue;
        const isPng = image.mimeTypeData.mimeTypeEnding.toLowerCase() === "png";
        const dataUrl = await toDataUrl(
          image.src,
          isPng ? "image/png" : "image/jpeg",
        );
        figures.push(
          courtBlock(
            `<div class="c-figure">
               <div class="c-figure-caption">
                 <div class="c-figure-label">${words(exhibit.label)}</div>
                 <div class="c-figure-text">${words(
                   `line ${pad(exhibit.lineNumber)} · ${exhibit.timestamp} · ${exhibit.sender} · ${exhibit.fileName}`,
                 )}</div>
               </div>
               <img src="${dataUrl}" data-format="${isPng ? "PNG" : "JPEG"}" alt="">
             </div>`,
          ),
        );
      }
      if (figures.length) {
        await builder.add(
          heading("Annex A — exhibit images", { breakBefore: true }) +
            figures.join(""),
        );
      }
    }

    //   ----- ANNEX B: MESSAGES PER MONTH
    const { people, months } = buildMonthlyCounts(messages, participants);
    if (months.length) {
      // per-person columns stop at four people, group chats get the total
      // only; a wider table would need landscape pages
      const perPerson = people.length <= 4;
      html = heading("Annex B — messages per month", { breakBefore: true });
      html += paragraph(
        "Messages sent per calendar month, counted from the transcript above. " +
          "System notices are not counted. Months without any message are listed with 0." +
          (perPerson
            ? ""
            : " Per-person totals are in the participant roster."),
        true,
      );
      html += courtBlock(
        `<div class="c-row c-head c-months">${cells([
          { html: words("Month") },
          { html: words("Total"), className: "c-right" },
          ...(perPerson ? people : []).map((person: string) => ({
            html: words(person),
            className: "c-right c-month-name",
          })),
        ])}</div>`,
        { tableHeader: "months", keepWithNext: true },
      );
      for (const row of months) {
        // empty months in gray, so gaps stand out
        const empty = row.total ? "" : " is-empty";
        html += courtBlock(
          `<div class="c-row c-months c-meta">${cells([
            { html: words(row.month), className: empty },
            { html: words(String(row.total)), className: `c-right${empty}` },
            ...(perPerson ? row.perPerson : []).map((count: number) => ({
              html: words(String(count)),
              className: `c-right${empty}`,
            })),
          ])}</div>`,
          { table: "months" },
        );
      }
      await builder.add(html);
    }

    //   ----- DECLARATION / SIGNATURE PAGE
    html = heading("Annex C — declaration of authenticity", {
      breakBefore: true,
    });
    html += paragraph(
      "I declare that the transcript in this document was produced by me from the WhatsApp chat " +
        "export identified on the cover page, using whatsanalyze.com in my own web browser. " +
        "The export file was not altered before, during or after the conversion, and the transcript " +
        "reproduces the chat completely and unchanged. I am aware that a false declaration may have " +
        "legal consequences.",
    );
    html += courtBlock('<div class="c-space" style="height:6mm"></div>');
    html += keyValue("Document fingerprint", formatHash(documentHash));
    html += courtBlock(
      `<div class="c-signature">${[
        "Place, date",
        "Signature",
        "Name in block letters",
      ]
        .map((label) => `<div class="c-signature-line">${words(label)}</div>`)
        .join("")}</div>`,
    );

    if (isSample) {
      html += courtBlock(
        `<div class="c-preview-title">${words("This is a preview copy")}</div>`,
        { breakBefore: true },
      );
      html += paragraph(
        "Only the first 100 messages are included. Get the complete court transcript, " +
          "with every message, the full exhibit index and the signature page, at whatsanalyze.com.",
      );
    }
    await builder.add(html);

    onProgress?.(100);

    //   ----- RUNNING HEADER AND FOOTER ON EVERY SHEET
    const names = roster.map((person) => person.name);
    const participantsLabel =
      names.length > 3
        ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`
        : names.join(", ") || "WhatsApp chat";
    const hashSnippet = documentHash
      ? `SHA-256 ${documentHash.slice(0, 16)}…`
      : "";
    const title = `WhatsApp chat transcript — ${participantsLabel}`;

    return builder.finish(title, ({ doc, page, total, geometry }) => {
      const left = geometry.margin.left;
      const right = geometry.widthMm - geometry.margin.right;
      const contentWidth = right - left;

      const rule = (y: number) => {
        doc.setDrawColor(170, 170, 170);
        doc.setLineWidth(0.1);
        doc.line(left, y, right, y);
      };

      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);
      const hashWidth = hashSnippet ? doc.getTextWidth(hashSnippet) : 0;
      doc.text(
        doc.splitTextToSize(title, contentWidth - hashWidth - 6)[0],
        left,
        12,
      );
      if (hashSnippet) doc.text(hashSnippet, right, 12, { align: "right" });
      rule(14.5);

      rule(geometry.heightMm - 16);
      doc.text(
        isSample
          ? "PREVIEW COPY — NOT FOR SUBMISSION · whatsanalyze.com"
          : "Generated client-side with whatsanalyze.com",
        left,
        geometry.heightMm - 11,
      );
      doc.text(`Page ${page} of ${total}`, right, geometry.heightMm - 11, {
        align: "right",
      });
    });
  } finally {
    builder.destroy();
  }
}
