import jsPDF from "jspdf";

import "~/utils/pdfFont";
import { getAttachmentBytes } from "~/utils/attachments";
import {
  buildCanonicalTranscript,
  buildRoster,
  buildTranscript,
  formatExtractionTimestamp,
  formatFileSize,
  formatHash,
  sha256Hex,
} from "~/utils/courtEvidence";

// same shape as the session's ChatSource, kept local so the worker bundle does
// not pull in the session helpers
interface ChatSource {
  name?: string;
  size?: number;
  sha256?: string | null;
}

// A4 in millimeters, like the visual export.
const PAGE_W = 210;
const PAGE_H = 297;
// Wide left margin: room for two/four-hole punching, binding and clerk stamps.
const MARGIN_LEFT = 28;
const MARGIN_RIGHT = 15;
const MARGIN_TOP = 26;
const MARGIN_BOTTOM = 22;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;

const BODY_SIZE = 9.5;
const META_SIZE = 8;
const LINE = 4.2;
const ROW_GAP = 1.8;

// Transcript columns: line number, timestamp, sender, message.
const COL = {
  no: MARGIN_LEFT,
  time: MARGIN_LEFT + 9,
  speaker: MARGIN_LEFT + 41,
  message: MARGIN_LEFT + 73,
};
const COL_W = {
  speaker: 30,
  message: PAGE_W - MARGIN_RIGHT - COL.message,
};

/**
 * Renders the chat as a sober, high-contrast transcript for courts and
 * authorities: numbered lines, exact timestamps, SHA-256 fingerprints, an
 * exhibit index and a signature page. Everything is grayscale so it survives
 * photocopying, scanning and monochrome printing.
 */
export async function renderCourtEvidence(
  chat: any,
  attachments: Array<{
    name: string;
    compressedContent?: Uint8Array;
    decompressedData?: Uint8Array;
  }>,
  isSample = false,
  source: ChatSource | null,
  webworker: any
) {
  // eslint-disable-next-line new-cap
  const doc = new jsPDF();
  const bottom = PAGE_H - MARGIN_BOTTOM;

  const participants = Object.keys(chat.personColorMap || {});
  const messages = isSample ? chat.chatObject.slice(0, 100) : chat.chatObject;
  const { rows, exhibits, stats } = buildTranscript(messages, participants);
  const roster = buildRoster(messages, participants);

  // The source file is the better fingerprint, but it is gone once the chat
  // comes back from the browser session (e.g. after the Stripe redirect). The
  // transcript as printed is then hashed instead, and labelled as such.
  const sourceHash = source?.sha256 || null;
  const documentHash =
    sourceHash || (await sha256Hex(buildCanonicalTranscript(rows)));

  let y = MARGIN_TOP;

  //    --- HELPER FUNCTIONS
  const setFont = function (size: number, weight = "normal", gray = 0) {
    doc.setFont("myFont", weight);
    doc.setFontSize(size);
    doc.setTextColor(gray, gray, gray);
  };
  const newPage = function () {
    doc.addPage("a4", "p");
    y = MARGIN_TOP;
  };
  const ensure = function (height: number) {
    if (y + height > bottom) newPage();
  };
  const rule = function (atY: number, gray = 0, lineWidth = 0.2) {
    doc.setDrawColor(gray, gray, gray);
    doc.setLineWidth(lineWidth);
    doc.line(MARGIN_LEFT, atY, PAGE_W - MARGIN_RIGHT, atY);
  };
  // jsPDF spaces array text by its own line height factor — keep control of it
  // so columns stay aligned with the line numbers next to them.
  const drawLines = function (lines: string[], x: number, startY: number) {
    lines.forEach((line, index) => doc.text(line, x, startY + index * LINE));
  };
  /**
   * jsPDF only breaks on spaces, so a long link, file name or hash would run
   * straight into the binding margin. Anything still too wide is cut by
   * character — a court copy may not lose text off the edge of the sheet.
   */
  const wrap = function (text: string, width: number): string[] {
    const lines: string[] = [];
    doc.splitTextToSize(text || "", width).forEach((line: string) => {
      while (doc.getTextWidth(line) > width && line.length > 1) {
        let cut = Math.max(
          1,
          Math.floor((line.length * width) / doc.getTextWidth(line))
        );
        while (cut > 1 && doc.getTextWidth(line.slice(0, cut)) > width) cut--;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
      lines.push(line);
    });
    return lines;
  };
  const paragraph = function (text: string, size = BODY_SIZE, gray = 0) {
    setFont(size, "normal", gray);
    doc.splitTextToSize(text, CONTENT_W).forEach((line: string) => {
      ensure(LINE);
      doc.text(line, MARGIN_LEFT, y);
      y += LINE;
    });
  };
  const heading = function (text: string) {
    ensure(16);
    y += 3;
    setFont(11, "bold");
    doc.text(text.toUpperCase(), MARGIN_LEFT, y);
    y += 1.8;
    rule(y, 0, 0.4);
    y += 5.5;
  };
  const keyValue = function (label: string, value: string | string[]) {
    const labelWidth = 50;
    setFont(BODY_SIZE, "normal");
    const lines = Array.isArray(value)
      ? value
      : wrap(value || "—", CONTENT_W - labelWidth);
    ensure(lines.length * LINE);
    setFont(BODY_SIZE, "bold");
    doc.text(label, MARGIN_LEFT, y);
    setFont(BODY_SIZE, "normal");
    drawLines(lines, MARGIN_LEFT + labelWidth, y);
    y += lines.length * LINE + 0.8;
  };
  const tableHeader = function (
    columns: Array<{ label: string; x: number; align?: "left" | "right" }>
  ) {
    setFont(META_SIZE, "bold");
    columns.forEach((column) =>
      doc.text(column.label, column.x, y, { align: column.align || "left" })
    );
    y += 1.6;
    rule(y, 0, 0.3);
    y += 4.4;
  };
  const noticeBox = function (title: string, text: string) {
    const lines = doc.splitTextToSize(text, CONTENT_W - 8);
    const height = 9 + lines.length * LINE;
    ensure(height + 4);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(MARGIN_LEFT, y, CONTENT_W, height);
    setFont(9.5, "bold");
    doc.text(title, MARGIN_LEFT + 4, y + 6);
    setFont(8.5, "normal");
    drawLines(lines, MARGIN_LEFT + 4, y + 11);
    y += height + 6;
  };
  const progress = function (value: number) {
    webworker.postMessage({ data: value, type: "progress" });
  };

  //   ----- COVER PAGE
  setFont(20, "bold");
  doc.text("WHATSAPP CHAT TRANSCRIPT", MARGIN_LEFT, y);
  y += 7.5;
  setFont(10.5, "normal");
  doc.text(
    "Evidence copy — verbatim transcript of a WhatsApp chat export",
    MARGIN_LEFT,
    y
  );
  y += 5;
  setFont(8.5, "normal", 90);
  doc.text(
    "Produced in the browser with whatsanalyze.com. The chat was never uploaded to a server.",
    MARGIN_LEFT,
    y
  );
  y += 4;
  rule(y, 0, 0.6);
  y += 8;

  if (isSample) {
    noticeBox(
      "PREVIEW COPY — NOT FOR SUBMISSION",
      "This preview contains the first 100 messages only and is therefore not a complete record. " +
        "Download the full transcript before filing it with a court or authority."
    );
  }

  heading("1. Document integrity & audit record");
  keyValue(
    "Source file",
    source?.name || "not recorded (chat restored from this browser session)"
  );
  if (source?.size) keyValue("Source file size", formatFileSize(source.size));
  keyValue(
    sourceHash ? "SHA-256 (source file)" : "SHA-256 (transcript)",
    formatHash(documentHash)
  );
  keyValue(
    "Verification",
    sourceHash
      ? `Recompute with: shasum -a 256 "${source?.name || "export file"}"`
      : "Recompute over the transcript text: line number, timestamp, sender and message " +
          "of every row, separated by tabs, rows separated by newlines."
  );
  keyValue("Extracted (client-side)", formatExtractionTimestamp());
  keyValue(
    "Transcript period",
    stats.start && stats.end ? `${stats.start}  to  ${stats.end}` : "—"
  );
  keyValue(
    "Messages in transcript",
    `${stats.total} (including ${stats.system} system ${
      stats.system === 1 ? "notice" : "notices"
    })`
  );
  keyValue("Media files referenced", String(stats.media));
  keyValue("Deleted messages", String(stats.deleted));
  keyValue("Participants", String(roster.length));

  y += 3;
  heading("2. Participant roster");
  setFont(8, "normal", 90);
  doc.text(
    "Names and numbers exactly as contained in the WhatsApp export.",
    MARGIN_LEFT,
    y
  );
  y += 5;
  const rosterCols = {
    name: MARGIN_LEFT,
    messages: MARGIN_LEFT + 84,
    first: MARGIN_LEFT + 88,
    last: MARGIN_LEFT + 128,
  };
  tableHeader([
    { label: "Name / number as exported", x: rosterCols.name },
    { label: "Messages", x: rosterCols.messages, align: "right" },
    { label: "First message", x: rosterCols.first },
    { label: "Last message", x: rosterCols.last },
  ]);
  roster.forEach((person) => {
    setFont(BODY_SIZE, "normal");
    const nameLines = wrap(person.name, 80);
    ensure(nameLines.length * LINE);
    drawLines(nameLines, rosterCols.name, y);
    setFont(META_SIZE, "normal");
    doc.text(String(person.messages), rosterCols.messages, y, {
      align: "right",
    });
    doc.text(person.first, rosterCols.first, y);
    doc.text(person.last, rosterCols.last, y);
    y += nameLines.length * LINE + 1;
    rule(y - 2.4, 215, 0.1);
  });

  y += 4;
  heading("3. Integrity declaration");
  paragraph(
    "This document was generated directly from the WhatsApp chat export identified above, " +
      "inside the browser of the person who exported it. Messages are reproduced in full, " +
      "unabridged and in their original order, including system notices and notices about " +
      "deleted messages. No message was added, removed, shortened or reworded, and no content " +
      "was translated or corrected. Timestamps are printed to the second in the time zone stated " +
      "above, as recorded in the export. The SHA-256 values in this document identify the source " +
      "file and every attachment; recomputing them over the same files reproduces the same values."
  );

  //   ----- TRANSCRIPT
  const drawTranscriptHeader = function () {
    tableHeader([
      { label: "No.", x: COL.no },
      { label: "Date & time", x: COL.time },
      { label: "Sender", x: COL.speaker },
      { label: "Message", x: COL.message },
    ]);
  };

  newPage();
  heading("4. Transcript");
  drawTranscriptHeader();

  const newTranscriptPage = function () {
    newPage();
    drawTranscriptHeader();
  };

  rows.forEach((row, index) => {
    if (index % 25 === 0) progress((index / rows.length) * 80);

    setFont(BODY_SIZE, "normal");
    const messageLines = wrap(row.text, COL_W.message);
    const lines = messageLines.length ? messageLines : [""];
    // The exhibit reference has to stay with the message it belongs to.
    if (row.exhibit) lines.push(`[Exhibit ${row.exhibit} — see annex A]`);

    setFont(META_SIZE, "normal");
    let speakerLines = wrap(row.speaker, COL_W.speaker);
    if (speakerLines.length > 3) {
      speakerLines = speakerLines.slice(0, 3);
      speakerLines[2] += "…";
    }

    let drawn = 0;
    let isContinuation = false;
    do {
      // Never start a row on the last line of a page — a lone line number with
      // its message on the next sheet is unreadable in a filing.
      if (bottom - y < LINE * 2) newTranscriptPage();
      const capacity = Math.max(1, Math.floor((bottom - y) / LINE));
      const chunk = lines.slice(drawn, drawn + capacity);

      setFont(META_SIZE, "normal", 90);
      if (isContinuation) {
        doc.text("cont.", COL.no, y);
      } else {
        doc.text(String(row.lineNumber).padStart(4, "0"), COL.no, y);
        doc.text(row.timestamp, COL.time, y);
        setFont(META_SIZE, "bold", 0);
        drawLines(speakerLines, COL.speaker, y);
      }

      setFont(BODY_SIZE, "normal", 0);
      drawLines(chunk, COL.message, y);

      y +=
        Math.max(chunk.length, isContinuation ? 0 : speakerLines.length) * LINE;
      drawn += chunk.length;
      isContinuation = true;
    } while (drawn < lines.length);

    y += ROW_GAP;
    if (y < bottom) rule(y - ROW_GAP / 2, 215, 0.1);
  });

  //   ----- ANNEX A: MEDIA EXHIBITS
  if (exhibits.length) {
    for (let index = 0; index < exhibits.length; index++) {
      const exhibit = exhibits[index];
      const bytes = getAttachmentBytes(exhibit.fileName, attachments);
      if (bytes) {
        exhibit.size = bytes.length;
        exhibit.sha256 = await sha256Hex(bytes);
      }
      progress(80 + ((index + 1) / exhibits.length) * 20);
    }

    newPage();
    heading("Annex A — index of media exhibits");
    paragraph(
      "Every file referenced in the transcript, in the order of its first appearance. " +
        "Hashes are computed over the file as it is contained in the export. " +
        '"not contained in the export" means the chat text refers to a file that ' +
        "the export did not include — most often because it was exported without media.",
      8.5,
      90
    );
    y += 4;

    const exhibitCols = {
      label: MARGIN_LEFT,
      line: MARGIN_LEFT + 18,
      time: MARGIN_LEFT + 28,
      sender: MARGIN_LEFT + 60,
      file: MARGIN_LEFT + 90,
    };
    const fileWidth = PAGE_W - MARGIN_RIGHT - exhibitCols.file;
    tableHeader([
      { label: "Exhibit", x: exhibitCols.label },
      { label: "Line", x: exhibitCols.line },
      { label: "Date & time", x: exhibitCols.time },
      { label: "Sender", x: exhibitCols.sender },
      { label: "File", x: exhibitCols.file },
    ]);

    exhibits.forEach((exhibit) => {
      setFont(META_SIZE, "normal");
      const fileLines = wrap(exhibit.fileName, fileWidth);
      const senderLines = wrap(exhibit.sender, 28);
      const detail =
        `${exhibit.fileType || "unknown type"} · ` +
        (exhibit.sha256
          ? `${formatFileSize(exhibit.size ?? NaN)} · SHA-256 ${exhibit.sha256}`
          : "not contained in the export · SHA-256 —");
      const detailLines = wrap(
        detail,
        PAGE_W - MARGIN_RIGHT - exhibitCols.line
      );
      const height =
        (Math.max(fileLines.length, senderLines.length) + detailLines.length) *
          LINE +
        ROW_GAP;
      ensure(height);

      setFont(META_SIZE, "bold");
      doc.text(exhibit.label, exhibitCols.label, y);
      setFont(META_SIZE, "normal");
      doc.text(
        String(exhibit.lineNumber).padStart(4, "0"),
        exhibitCols.line,
        y
      );
      doc.text(exhibit.timestamp, exhibitCols.time, y);
      drawLines(senderLines, exhibitCols.sender, y);
      drawLines(fileLines, exhibitCols.file, y);

      const detailY =
        y + Math.max(fileLines.length, senderLines.length) * LINE + 0.4;
      setFont(7, "normal", 90);
      drawLines(detailLines, exhibitCols.line, detailY);

      y += height;
      if (y < bottom) rule(y - ROW_GAP / 2, 215, 0.1);
    });
  }

  //   ----- DECLARATION / SIGNATURE PAGE
  newPage();
  heading("Annex B — declaration of authenticity");
  paragraph(
    "I declare that the transcript in this document was produced by me from the WhatsApp chat " +
      "export identified on the cover page, using whatsanalyze.com in my own web browser. " +
      "The export file was not altered before, during or after the conversion, and the transcript " +
      "reproduces the chat completely and unchanged. I am aware that a false declaration may have " +
      "legal consequences."
  );
  y += 6;
  setFont(BODY_SIZE, "normal");
  keyValue("Document fingerprint", formatHash(documentHash));
  y += 12;

  const signatureLine = function (label: string) {
    ensure(20);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_LEFT, y, MARGIN_LEFT + 80, y);
    setFont(8, "normal", 90);
    doc.text(label, MARGIN_LEFT, y + 4);
    y += 22;
  };
  signatureLine("Place, date");
  signatureLine("Signature");
  signatureLine("Name in block letters");

  if (isSample) {
    newPage();
    setFont(16, "bold");
    doc.text("This is a preview copy", MARGIN_LEFT, y);
    y += 8;
    paragraph(
      "Only the first 100 messages are included. Get the complete court transcript, " +
        "with every message, the full exhibit index and the signature page, at whatsanalyze.com."
    );
  }

  //   ----- RUNNING HEADER AND FOOTER ON EVERY SHEET
  const rosterLabel = roster.map((person) => person.name);
  const participantsLabel =
    rosterLabel.length > 3
      ? `${rosterLabel.slice(0, 3).join(", ")} and ${
          rosterLabel.length - 3
        } more`
      : rosterLabel.join(", ") || "WhatsApp chat";
  const hashSnippet = documentHash
    ? `SHA-256 ${documentHash.slice(0, 16)}…`
    : "";
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    setFont(7.5, "normal", 90);
    const hashWidth = hashSnippet ? doc.getTextWidth(hashSnippet) : 0;
    const title = doc.splitTextToSize(
      `WhatsApp chat transcript — ${participantsLabel}`,
      CONTENT_W - hashWidth - 6
    )[0];
    doc.text(title, MARGIN_LEFT, 12);
    if (hashSnippet) {
      doc.text(hashSnippet, PAGE_W - MARGIN_RIGHT, 12, { align: "right" });
    }
    rule(14.5, 170, 0.1);

    rule(PAGE_H - 16, 170, 0.1);
    doc.text(
      isSample
        ? "PREVIEW COPY — NOT FOR SUBMISSION · whatsanalyze.com"
        : "Generated client-side with whatsanalyze.com",
      MARGIN_LEFT,
      PAGE_H - 11
    );
    doc.text(
      `Page ${page} of ${totalPages}`,
      PAGE_W - MARGIN_RIGHT,
      PAGE_H - 11,
      {
        align: "right",
      }
    );
  }

  progress(100);
  return doc;
}
