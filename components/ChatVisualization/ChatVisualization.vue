<template>
  <v-col class="my-4 mb-16">
    <v-row>
      <ChatVisualizationChat :chat="chat" />
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
