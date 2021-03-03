<template>
  <v-col class="my-4 mb-16">
    <v-row>
      <ChatVisualizationChat :chat="chat" />
    </v-row>
    <v-row justify="center">
      <v-dialog v-model="showDownloadPopup" width="500">
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="red lighten-2"
            dark
            v-bind="attrs"
            v-on="on"
            @click="
              $gtag.event('download-chat-popup-clicked', {
                event_category: 'download',
                event_label: 'popup-clicked',
                value: '1',
              })
            "
          >
            <v-icon>mdi-download</v-icon>Download your chat as PDF now!
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
            <v-btn color="red darken-1" text @click="showDownloadPopup = false">
              Close
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>
  </v-col>
</template>

<script>
export default {
  name: "ChatVisualization",
  props: ["chat"],
  data() {
    return {
      showDownloadPopup: false,
    };
  },
  methods: {
    onCreateOrder(data, actions) {
      console.log("order created", data, actions);
    },
    onApprove(event) {
      console.log("approved", event);
    },
    onError(event) {
      console.log("error", event);
    },
  },
};
</script>

<style scoped></style>
