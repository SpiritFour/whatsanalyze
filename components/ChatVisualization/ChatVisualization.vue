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
                  event_category: 'home',
                  event_label: 'lead',
                  value: '1',
                })
              "
            >
              <v-icon>mdi-download</v-icon>
              Download full chat PDF
            </v-btn>
            <div class="link" @click="download">
              Retrieve a free preview of your analyzed chat
            </div>
          </template>
          <v-card>
            <v-card-title class="headline cyan" style="word-break: normal">
              <div class="text-h4 font-weight-bold">
                This feature is coming soon !!
              </div>
              <span>You can still buy us a ☕️ if you like!!!</span>
            </v-card-title>
            <v-card-text class="pt-3 text-h5 font-weight-bold">
              If you want to stay tuned and get notified when new features
              arrive, register
              <a
                :href="'https://forms.gle/FmX4LKYhMwxs4gYs8'"
                @click="
                  $gtag.event('download-chat-register-email-clicked', {
                    event_category: 'home',
                    event_label: 'lead',
                    value: '1',
                  })
                "
                target="_blank"
                >here</a
              >. We would love to stay in touch.
            </v-card-text>
            <v-card-text>
              Supporting us keeps the servers running, as all services provided
              are for free.
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
import html2canvas from "html2canvas";
import { downloadBase64File } from "~/functions/utils";

export default {
  name: "ChatVisualization",
  props: ["chat", "attachments", "results"],
  data() {
    return {
      showDownloadPopup: false,
    };
  },
  methods: {
    onCreateOrder(data, actions) {
      console.log("order created", data, actions);
      this.$gtag.event("paypal-opened", {
        event_category: "home",
        event_label: "payment",
        value: "1",
      });
    },
    onApprove(event) {
      console.log("approved", event);
      this.$gtag.event("paypal-approved", {
        event_category: "home",
        event_label: "payment",
        value: "100",
      });
    },
    onError(event) {
      console.log("error", event);
    },
    async download() {
      this.$gtag.event("download-started", {
        event_category: "home",
        event_label: "payment",
        value: "1",
      });

      let canvas = html2canvas(this.results.$el, {
        scrollX: 0,
        scrollY: -window.scrollY,
      });
      let names = this.chat.messagesPerPerson
        .slice(0, 2)
        .map((person) => person.name)
        .join("-");
      canvas.then((canvas) => {
        downloadBase64File(
          canvas.toDataURL(),
          "whatsanlazye-results-" + names + ".png"
        );
      });
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
