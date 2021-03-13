<template>
  <v-col class="my-4 mb-16">
    <v-row>
      <Chat :chat="chat" :attachments="attachments" @setEgo="setEgo" />
    </v-row>
    <v-row justify="center" id="payButton">
      <div class="cta my-md-4">
        <div class="text-h3 font-weight-bold pb-4">
          Download your Chat as a PDF
        </div>
        <v-progress-linear
          v-show="isLoading"
          indeterminate
          color="blue"
          class="mb-0"
        ></v-progress-linear>

        <div class="text-body-1">
          Get your full WhatsApp chat <br />
          for 3.99 € as a PDF instantly.
        </div>
        <v-btn @click="fr"></v-btn>
        {{ data }}
        <v-dialog v-model="showDownloadPopup" width="550">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              dark
              v-bind="attrs"
              v-on="on"
              color="#07bc4c"
              style="color: white; max-width: 100%"
              class="mt-5 mb-5 text-body-2 text-md-h6"
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
              Download your full chat as a PDF
            </v-btn>
            <div class="link" @click="downloadSample">
              Get a preview of your PDF for free
            </div>
          </template>
          <v-card>
            <v-card-title class="headline cyan" style="word-break: normal">
              <div class="text-h4 font-weight-bold">Nice !!</div>
              <span>You are just a step away from your PDF!</span>
            </v-card-title>
            <v-card-text class="pt-3 text-body-1 font-weight-bold">
              If you want to stay tuned and get notified when new features
              arrive, register
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
              >. We would love to stay in touch.
            </v-card-text>
            <v-card-text class="text-h5">
              Supporting us keeps the servers running :)
            </v-card-text>
            <v-row cols="12" justify="center" align="center" class="pt-6 pr-10">
              <ChatVisualizationPayment
                @onCreateOrder="onCreateOrder"
                @onApprove="onApprove"
                @onError="onError"
                currency="EUR"
                :amount="3.5"
              />
            </v-row>
            <v-row style="max-width: 100%">
              <v-col cols="auto" class="text-h5">
                Or insert pre-paid token:</v-col
              >
              <v-col>
                <v-text-field
                  counter="6"
                  maxlength="6"
                  style="font-family: monospace; width: 6em"
                ></v-text-field>
              </v-col>
              <v-col cols="2"><v-btn>redeem</v-btn></v-col>
            </v-row>

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
import { render } from "~/functions/pdf";
import { Firebase } from "~/functions/firebaseUtils";

export default {
  name: "ChatVisualization",
  props: ["chat", "attachments", "results"],
  data() {
    return {
      showDownloadPopup: false,
      ego: this.chat.messagesPerPerson[0].name,
      isLoading: false,
      data: [],
    };
  },
  methods: {
    setEgo(ego) {
      this.ego = ego;
    },
    async download() {
      this.$gtag.event("download-pdf", {
        event_category: "download",
        event_label: "download-pdf",
        value: "10",
      });
      this.isLoading = true;
      let done = await render(this.chat, this.attachments, this.ego, false);
      if (done) {
        this.isLoading = false;
      }
    },
    onCreateOrder(data, actions) {
      console.log("approved", event);

      console.log("order created", data, actions);
    },
    onApprove(event) {
      render(this.chat, this.attachments, this.ego, false);
      Firebase.getToken(event.payer.email_address);
      console.log("approved", event);
    },
    onError(event) {
      console.log("approved", event);

      console.log("error", event);
    },
    async downloadSample() {
      this.$gtag.event("download-sample-pdf", {
        event_category: "home",
        event_label: "download-sample-pdf",
        value: "5",
      });
      this.isLoading = true;
      // download sample
      let done = await render(this.chat, this.attachments, this.ego, true);
      if (done) {
        this.isLoading = false;
      }
    },
    fr() {
      Firebase.getToken("yyyaas").then((a) => (this.data = a));
    },
  },
};
</script>
