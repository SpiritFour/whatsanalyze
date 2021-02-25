<template>
  <div class="text-center py-10">
    <GroupOthers :chat-object="chat_" />

    <div class="text-h3 font-weight-bold py-10">Chat Timeline</div>
    <small>Messages per Day </small>
    <ChartsLineChart :chartdata="chat_" class="pb-10" ref="lineChart" />
    <v-btn @click="share"></v-btn>

    <div class="text-h3 font-weight-bold pt-10">Fun Facts</div>
    <ChartsFunFacts :chartdata="chat_" class="pb-10" />

    <!-- Make dropdown -> messages or words -->
    <div class="text-h3 font-weight-bold py-10">Messages per</div>

    <v-row>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Person</div>
        <ChartsDonughtChart :chartdata="chat_" class="py-10" />
      </v-col>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Month</div>
        <ChartsRadarChart
          :chartdata="chat_"
          dataGrouping="weekly"
          class="py-10"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Time of Day</div>
        <ChartsRadarChart
          :chartdata="chat_"
          dataGrouping="hourly"
          class="py-10"
        />
      </v-col>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Weekday</div>
        <ChartsRadarChart
          :chartdata="chat_"
          dataGrouping="daily"
          class="py-10"
        />
      </v-col>
    </v-row>

    <!-- make toggle between radar and normal charts -->
    <div v-show="false">
      <ChartsBarChart :chartdata="chat_" dataGrouping="hourly" class="py-10" />
      <ChartsBarChart :chartdata="chat_" dataGrouping="daily" class="py-10" />
      <ChartsBarChart :chartdata="chat_" dataGrouping="weekly" class="py-10" />
    </div>

    <!-- Remove "weggelassen" und so whatsapp shit -->
    <!-- Add workcloud with emojies only  -->
    <div class="text-h3 font-weight-bold pt-10">Word Cloud</div>
    <ChartsWordCloud :chartdata="chat_" class="pb-10" />
  </div>
</template>

<script>
export default {
  props: ["chat_"],
  methods: {
    share() {
      function dataURLtoFile(dataUrl, filename) {
        var arr = dataUrl.split(",");
        console.log(arr);
        var mime = arr[0].match(/:(.*?);/)[1];
        var bstr = atob(arr[1]);
        var n = bstr.length;
        var u8arr = new Uint8Array(n);

        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
      }

      let url = this.$refs.lineChart.$refs.canvas.toDataURL();
      let file = dataURLtoFile(url, "hello.png");

      if (!navigator.share) alert("not shareable");
      navigator
        .share({
          title: "Pictures",
          text: "Our Pictures.",
          files: [file],
        })
        .then(() => console.log("Share was successful."))
        .catch((error) => console.log("Sharing failed", error));
    },
  },
};
</script>
