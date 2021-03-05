<template>
  <v-col class="my-4 mb-16">
    <v-row>
      <ChatVisualizationChat :chat="chat" :attachments="attachments" />
    </v-row>
    <v-row justify="center" id="payButton">
      <div class="cta my-md-4">
        <div class="text-h3 font-weight-bold pb-4">
          We generate your chat PDF
        </div>
        <div class="text-body-1">
          Now get your full WhatsApp chat <br />
          for 3,99 $ as a PDF instantly
        </div>
        <v-dialog v-model="showDownloadPopup" width="550">
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
            <div
              class="link"
              v-bind="attrs"
              v-on.prevent="on"
              @click="
                $gtag.event('download-preview-popup-clicked', {
                  event_category: 'download',
                  event_label: 'popup-clicked',
                  value: '0.5',
                })
              "
            >
              Retrieve a free preview of your chat
            </div>
          </template>
          <v-card>
            <v-card-title class="headline cyan" style="word-break: normal">
              <div class="text-h4 font-weight-bold">
                This feature is coming soon !!
              </div>
              <span>You can still buy us a ☕️ if you like!!!</span>
            </v-card-title>
            <v-card-text class="pt-3">
              If you want to stay tuned and get notified, register
              <a
                :href="'https://forms.gle/FmX4LKYhMwxs4gYs8'"
                @click="
                  $gtag.event('download-chat-register-email-clicked', {
                    event_category: 'download',
                    event_label: 'popup-clicked',
                    value: '1',
                  })
                "
                target="_blank"
                >here</a
              >.
            </v-card-text>
            <v-row cols="12" justify="center" align="center" class="pt-6 pr-10">
              <ChatVisualizationPayment
                @onCreateOrder="onCreateOrder"
                @onApprove="onApprove"
                @onError="onError"
                currency="EUR"
                :amount="3"
              />
            </v-row>
            <v-card-text class="pt-3">
              You will get all results as an image exactly as presented on your
              device. Generating may take a while.
            </v-card-text>

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
      </div>
    </v-row>
  </v-col>
</template>

<script>
export default {
  name: "ChatVisualization",
  props: ["chat", "attachments"],
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
    formClicked() {
      console.log("form clicked");
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
