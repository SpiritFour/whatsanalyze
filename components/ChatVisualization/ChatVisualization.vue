<template>
  <v-col class="my-4 mb-16">
    <v-row>
      <ChatVisualizationChat
        :chat="chat"
        :attachments="attachments"
        @setEgo="setEgo"
      />
    </v-row>
    <v-row justify="center">
      <div class="cta my-md-4">
        <div class="text-h3 font-weight-bold pb-4">
          We generate your chat PDF
        </div>
        <div class="text-body-1">
          Now get your full WhatsApp chat <br />
          for 3,99 $ as a PDF instantly
        </div>
        <v-dialog v-model="showDownloadPopup" width="500">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              dark
              v-bind="attrs"
              v-on.prevent="on"
              color="#07bc4c"
              style="color: white"
              class="mt-5 mb-5 text-h6"
              elevation="10"
              @click="
                $gtag.event('download-chat-popup-clicked', {
                  event_category: 'download',
                  event_label: 'popup-clicked',
                  value: '1',
                })
              "
            >
              <v-icon>mdi-download</v-icon>
              Download full chat PDF
            </v-btn>
          </template>
          <v-card>
            <v-card-title class="headline cyan" style="word-break: normal">
              <div class="text-h4 font-weight-bold">Did we make you go 🥳?</div>
              <span>Buy us a ☕️ and get your results for free!!!</span>
            </v-card-title>

            <v-card-text class="pt-3">
              You will get all results as an image exactly as presented on your
              device. Generating may take a while.
            </v-card-text>
            <v-row justify="center"
              ><ChatVisualizationPayment
                @onCreateOrder="onCreateOrder"
                @onApprove="onApprove"
                @onError="onError"
                currency="EUR"
                :amount="10"
            /></v-row>
            <v-divider></v-divider>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="red darken-1"
                text
                @click="showDownloadPopup = false"
              >
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <div class="link">Retrieve a free preview of your chat</div>
      </div>
    </v-row>
  </v-col>
</template>

<script>
import jsPDF from "jspdf";
import logo from "/assets/whatsanalyze-logo-black.png";
import { getDateString } from "~/functions/utils";

export default {
  name: "ChatVisualization",
  props: ["chat", "attachments"],
  data() {
    return {
      showDownloadPopup: false,
      ego: this.chat.messagesPerPerson[0].name,
    };
  },
  methods: {
    setEgo(ego) {
      this.ego = ego;
    },
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
        } else if (isEgo) {
          doc.setFillColor(13, 97, 98);
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
      doc.save("WhatsAnalyze - " + this.ego);
    },
    onCreateOrder(data, actions) {
      console.log("approved", event);

      console.log("order created", data, actions);
    },
    onApprove(event) {
      this.render();
      console.log("approved", event);
    },
    onError(event) {
      console.log("approved", event);

      console.log("error", event);
    },
  },
};
</script>

<style lang="scss" scoped>
.cta {
  text-align: center;
  background: $c-white;
  padding: 2em;
}
.link {
  border: none;
  /*optional*/
  font-family: arial, sans-serif;
  /*input has OS specific font-family*/
  color: #069;
  text-decoration: underline;
  cursor: pointer;
}
</style>
