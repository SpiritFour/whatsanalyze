import { render } from "~/utils/pdf";
import { renderCourtEvidence } from "~/utils/pdfCourt";

self.onmessage = async (event) => {
  // this generates the jspdf document
  const {
    chat,
    attachments,
    ego,
    isSample,
    style,
    source,
    chatTimeline,
    messagesPerTimeOfDay,
    messagesPerPerson,
    radarMonth,
    radarDay,
  } = event.data;

  const doc =
    style === "court"
      ? await renderCourtEvidence(chat, attachments, isSample, source, self)
      : await render(
          chat,
          attachments,
          ego,
          isSample,
          chatTimeline,
          messagesPerTimeOfDay,
          messagesPerPerson,
          radarMonth,
          radarDay,
          self
        );

  // we can not transfer functions from web worker to main thread thus we serialize it
  const pdfData = { data: doc.output("arraybuffer"), type: "pdf" };
  self.postMessage(pdfData, []);
};
