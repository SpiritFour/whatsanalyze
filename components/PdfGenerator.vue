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
  props: ["chat", "ego"],
  methods: {
    hexToRgb(hex) {
      if (hex.length != 6) {
        throw "Only six-digit hex colors are allowed.";
      }

      var aRgbHex = hex.match(/.{1,2}/g);
      var aRgb = [
        parseInt(aRgbHex[0], 16),
        parseInt(aRgbHex[1], 16),
        parseInt(aRgbHex[2], 16),
      ];
      return aRgb;
    },
    render() {
      // Default export is a4 paper, portrait, using millimeters for units
      const doc = new jsPDF();
      const width = 210;
      const height = 297;
      let fontSize = 11;
      const marginTop = 25;
      const marginLeft = 20;
      const pageYSpace = 297 - marginTop * 2;

      const messageMarginBottom = 5;
      const authorHeight = 9;
      const timeHeight = 3;
      let usedYSpace = 0;

      const paddingMessage = 3;
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

      const addPage = function () {
        doc.addPage("a4", "p");
        // page design
        doc.setFillColor(13, 20, 24);
        doc.rect(0, 0, width, height, "F");
      };

      addPage();

      doc.setFontSize(fontSize);
      // line + padding top and bottom
      const lineHeight = (fontSize * 1.5) / 3.64;
      doc.setFont("helvetica", "normal");

      // https://stackoverflow.com/questions/24272058/word-wrap-in-generated-pdf-using-jspdf
      // var splitTitle = doc.splitTextToSize(reportTitle, 180);

      const calcMessageBodyHeight = function (numLines) {
        let messageY = marginTop + usedYSpace;
        // Height of Messages
        const messageYSpace = numLines * lineHeight + authorHeight + timeHeight;
        // Check if lines fit on page,
        if (usedYSpace + messageYSpace > pageYSpace) {
          // is first message
          addPage();
          messageY = marginTop;
          usedYSpace = 0;
        }
        usedYSpace += messageMarginBottom + messageYSpace;
        return messageY;
      };

      this.chat.chatObject.forEach((data) => {
        const isSystem = "System" === data.author;
        let isEgo = this.ego === data.author;

        const splitMessage = doc.splitTextToSize(
          data.message,
          isSystem ? 120 : 60
        );
        const numLines = splitMessage.length;
        const messageHeight = lineHeight * numLines;
        // Y Coordinate of Message
        let messageY = calcMessageBodyHeight(numLines);
        let messageX = isEgo ? 58 : marginLeft + paddingMessage;

        // Draw background
        if (isSystem) {
          messageX = 40;
          doc.setFillColor(53, 53, 38);
        } else {
          doc.setFillColor(38, 45, 49);
        }
        // draw bubble
        doc.roundedRect(
          messageX,
          messageY - 1,
          130,
          messageHeight + authorHeight + timeHeight,
          2,
          2,
          "F"
        );

        if (!isSystem) {
          // draw author
          doc.setFontSize(fontSize / 1.3);

          if (data.author in this.chat.personColorMap) {
            const rgbAuthorColor = this.hexToRgb(
              this.chat.personColorMap[data.author].slice(1)
            );
            doc.setTextColor(
              rgbAuthorColor[0],
              rgbAuthorColor[1],
              rgbAuthorColor[2]
            );
          }

          doc.setFont("helvetica", "bold");
          doc.text(
            messageX + paddingMessage,
            messageY + paddingMessage,
            data.author
          );
        }

        // Draw message lines
        if (isSystem) {
          doc.setTextColor(249, 217, 100);
        } else {
          doc.setTextColor(255, 255, 255);
        }
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "normal");

        doc.text(
          isSystem ? messageX + 65 : messageX + paddingMessage,
          messageY + authorHeight,
          splitMessage,
          isSystem ? "center" : ""
        );

        // draw time
        if (!isSystem) {
          doc.setFontSize(fontSize / 1.8);
          doc.setTextColor(200, 200, 200);
          doc.text(
            messageX + 104,
            messageY + authorHeight + messageHeight - 1,
            getDateString(data.date)
          );
        }
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
