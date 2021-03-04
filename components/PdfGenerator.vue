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

export default {
  props: ["chat"],
  methods: {
    render() {
      // Default export is a4 paper, portrait, using millimeters for units
      const doc = new jsPDF();

      // Draw background
      doc.setFillColor(23, 166, 141);
      doc.rect(0, 0, 1000, 1000, "F");
      // Add logo
      doc.addImage(logo, "PNG", 15, 40, 40, 40);

      // Add title
      doc.setFontSize(50);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(65, 76, "WhatsAnalyze");

      doc.setFontSize(16);
      doc.text(20, 30, "Your Chat in your hands.");
      doc.addPage("a4", "p");

      this.chat.chatObject.forEach((data, idx) => {
        doc.text(20, 20 + 10 * (idx % 20), data.message);
        if ((idx + 1) % 20 === 0) {
          doc.addPage("a4", "p");
        }
      });

      // doc.html(this.$refs.content.innerHTML, {
      //   callback: function (d) {
      //     d.save("popo.pdf");
      //   },
      // });
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
