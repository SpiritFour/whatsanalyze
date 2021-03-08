<template>
  <v-container>
    <v-btn @click="render">jsPDF render!</v-btn>
    <div ref="content">
      <h1>Helo</h1>
    </div>
  </v-container>
</template>

<script>
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
// eslint-disable-next-line no-unused-vars
import logo from "/assets/whatsanalyze-logo-black.png";

import { getDateString } from "~/functions/utils";

export default {
  props: ["chat"],
  methods: {
    render() {
      // Default export is a4 paper, portrait, using millimeters for units
      const doc = new jsPDF();
      const width = 210;
      const height = 297;
      // Draw background
      doc.setFillColor(23, 166, 141);
      //
      doc.rect(0, 0, width, height, "F");
      // subtitle
      doc.setFontSize(16);
      doc.text(15, 30, "Your Chat in your hands.");
      // logo
      doc.addImage(logo, "PNG", 15, 40, 40, 40);
      // title
      doc.setFontSize(50);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(65, 76, "WhatsAnalyze");

      doc.addPage("a4", "p");

      // messages
      // 16 =~ 4 mm
      let fontSize = 14;
      doc.setFontSize(fontSize);
      // line + padding top and bottom
      const lineHeight = (fontSize * 1.5) / 3.64;
      doc.setFont("helvetica", "normal");

      // https://stackoverflow.com/questions/24272058/word-wrap-in-generated-pdf-using-jspdf
      // var splitTitle = doc.splitTextToSize(reportTitle, 180);
      const marginTop = 25;
      const marginLeft = 20;
      const pageYSpace = 297 - marginTop * 2;

      const messageMarginBottom = 5;
      const authorHeight = 8;
      const timeHeight = 5;
      let usedYSpace = 0;

      const calcMessageBodyHeight = function (numLines) {
        let messageY = marginTop + usedYSpace;

        // Height of Messages
        const messageYSpace = numLines * lineHeight + authorHeight + timeHeight;

        // Check if lines fit on page,
        if (usedYSpace + messageYSpace > pageYSpace) {
          // is first message
          doc.addPage("a4", "p");
          messageY = marginTop;
          usedYSpace = 0;
        }
        usedYSpace += messageMarginBottom + messageYSpace;

        return messageY;
      };

      this.chat.chatObject.forEach((data, idx) => {
        const splitMessage = doc.splitTextToSize(
          parseInt(idx) + data.message,
          100
        );
        const numLines = splitMessage.length;
        const messageHeight = lineHeight * numLines;
        // Y Coordinate of Message
        let messageY = calcMessageBodyHeight(numLines);

        // Draw background
        doc.setFillColor(10, 100, 200);
        // draw bubble
        doc.rect(
          marginLeft,
          messageY - 3,
          100,
          messageHeight + authorHeight + timeHeight,
          "F"
        );

        // draw author
        doc.setFontSize(fontSize / 1.5);
        // doc.setDrawColor(100, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(marginLeft, messageY, data.author);

        // Draw message lines
        doc.setFontSize(fontSize);
        doc.setDrawColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.text(marginLeft, messageY + authorHeight, splitMessage);

        // draw time
        console.log(data.date);
        doc.setFontSize(fontSize / 2);
        doc.text(
          marginLeft,
          messageY + authorHeight + messageHeight,
          getDateString(data.date)
        );
      });

      doc.save("WhatsAnalyze - Report");
    },
    renderCss() {
      const doc = new jsPDF();
      /** WITH CSS */
      var canvasElement = document.createElement("canvas");
      html2canvas(this.$refs.content, { canvas: canvasElement }).then(function (
        canvas
      ) {
        const img = canvas.toDataURL("image/jpeg", 0.8);
        doc.addImage(img, "JPEG", 20, 20);
        doc.save("sample.pdf");
      });
    },
  },
};
</script>

<style></style>
