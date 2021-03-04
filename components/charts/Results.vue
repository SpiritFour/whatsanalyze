<template>
  <div>
    <div class="text-center py-10">
      <ChatVisualization :chat="chat" :attachments="attachments" />
      <div class="text-h2 font-weight-bold py-10">Chat Timeline</div>
      <div>Messages per Day</div>
      <Share>
        <ChartsLineChart :chartdata="chat" class="pb-10" />
      </Share>

      <GroupOthers :chat-object="chat" />

      <ChartsTextStats :chat="chat" />

      <ChartsFunFacts :chartdata="chat" class="pb-10" />

      <!-- Make dropdown -> messages or words -->
      <div class="text-h3 font-weight-bold py-10">Messages per</div>

      <v-row>
        <v-col cols="12" md="6">
          <div class="text-h4 font-weight-bold">Person</div>
          <Share>
            <ChartsDonughtChart :chartdata="chat" class="py-10" />
          </Share>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-h4 font-weight-bold">Time of Day</div>
          <Share>
            <ChartsBarChart
              :chartdata="chat"
              dataGrouping="hourly"
              class="py-10"
            />
          </Share>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6">
          <div class="text-h4 font-weight-bold">Month</div>
          <Share>
            <ChartsRadarChart
              :chartdata="chat"
              dataGrouping="weekly"
              class="py-10"
            />
          </Share>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="text-h4 font-weight-bold">Weekday</div>
          <Share>
            <ChartsRadarChart
              :chartdata="chat"
              dataGrouping="daily"
              class="py-10"
            />
          </Share>
        </v-col>
      </v-row>

      <!-- make toggle between radar and normal charts -->
      <div v-if="false">
        <ChartsBarChart :chartdata="chat" dataGrouping="hourly" class="py-10" />
        <ChartsBarChart :chartdata="chat" dataGrouping="daily" class="py-10" />
        <ChartsBarChart :chartdata="chat" dataGrouping="weekly" class="py-10" />
      </div>

      <!-- Remove "weggelassen" und so whatsapp shit -->
      <!-- Add workcloud with emojies only  -->
      <div class="text-h3 font-weight-bold pt-10">Word Cloud</div>
      <ChartsWordCloud :chartdata="chat" class="pb-10" />
    </div>
  </div>
</template>

<script>
// import * as JsPDF from "jspdf";
// import html2canvas from "html2canvas";
// // eslint-disable-next-line no-unused-vars
// import DOMPurify from "dompurify";

export default {
  props: ["chat", "attachments"],
  methods: {
    // download() {
    //   html2canvas(this.$refs.content, {
    //     imageTimeout: 5000,
    //     useCORS: true,
    //   }).then((canvas) => {
    //     document.getElementById("pdf").appendChild(canvas);
    //     let img = canvas.toDataURL("image/png");
    //     let pdf = new JsPDF("portrait", "mm", "a4");
    //     pdf.addImage(img, "JPEG", 5, 5, 200, 287);
    //     pdf.save("relatorio-remoto.pdf");
    //     document.getElementById("pdf").innerHTML = "";
    //   });
    // },
    // download() {
    //   const doc = new jsPDF();
    //   // const cleanContent = DOMPurify.sanitize(this.$refs.content.innerHtml, {
    //   //   USE_PROFILES: { html: true },
    //   // });
    //   doc.html(this.$refs.content.innerHtml, {
    //     callback: function (d) {
    //       d.save("popo.pdf");
    //     },
    //   });
    // },
    // download_() {
    //   const doc = new jsPDF();
    //   /** WITH CSS */
    //   var canvasElement = document.createElement("canvas");
    //   html2canvas(this.$refs.content, { canvas: canvasElement }).then(function (
    //     canvas
    //   ) {
    //     const img = canvas.toDataURL("image/jpeg", 0.8);
    //     doc.addImage(img, "JPEG", 20, 20);
    //     doc.save("sample.pdf");
    //   });
    // },
  },
};
</script>
