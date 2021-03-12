<template>
  <v-col class="my-4 mt-10">
    <v-row justify="center">
      <div class="cta my-md-4">
        <div class="text-h3 font-weight-bold pb-4">
          Download all Graphs at once!
        </div>
        <div class="text-body-1 pb-2">All for free, just for you ❤️️</div>
        <div class="text-body-2 pb-4">
          You might want to wait until the <b>Word Cloud</b> is finished
          arranging.
        </div>
        <v-dialog v-model="dialog" width="600">
          <template v-slot:activator="{ on }">
            <v-btn
              color="#07bc4c"
              dark
              v-on="on"
              @click="download"
              :loading="loading"
            >
              <v-icon>mdi-download</v-icon>Download your Results now!
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

            <v-row
              align="center"
              justify="center"
              class="mb-3"
              @click="paypalButtonPressed"
            >
              <form
                action="https://www.paypal.com/donate"
                method="post"
                target="_blank"
              >
                <input
                  type="hidden"
                  name="hosted_button_id"
                  value="EPCYG8WEF289G"
                />
                <input
                  type="image"
                  src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
                  border="0"
                  name="submit"
                  title="PayPal - The safer, easier way to pay online!"
                  alt="Donate with PayPal button"
                />
                <img
                  alt=""
                  border="0"
                  src="https://www.paypal.com/en_US/i/scr/pixel.gif"
                  width="1"
                  height="1"
                />
              </form>
            </v-row>
            <v-divider></v-divider>
            <v-progress-linear
              v-if="loading"
              indeterminate
              color="blue"
              class="mb-0"
            ></v-progress-linear>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="red darken-1" text @click="dialog = false">
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
  name: "DownloadPopup",
  props: ["chat"],
  data() {
    return {
      dialog: false,
      loading: false,
    };
  },
  methods: {
    download: function () {
      this.loading = true;
      this.$gtag.event("donation-popup-clicked", {
        event_category: "donation",
        event_label: "popup-clicked",
        value: "1",
      });

      setTimeout(() => {
        let additionalHeight = 0;
        document
          .querySelectorAll(".additional-height")
          .forEach((a) => (additionalHeight += a.clientHeight));

        let negativeHeight = 0;
        document
          .querySelectorAll("[remove-height-in-html2-canvas]")
          .forEach((a) => (negativeHeight -= a.clientHeight));

        let normalHeight = document.querySelector("#download-graphs")
          .clientHeight;

        //wordcloud
        let canvas = html2canvas(document.querySelector("#download-graphs"), {
          scrollX: 0,
          scrollY: -window.scrollY,
          height: normalHeight + additionalHeight + negativeHeight,
          onclone: function (clonedDoc) {
            let nonVisibleStuff = clonedDoc.querySelectorAll(
              ".only-visible-to-html2canvas"
            );
            nonVisibleStuff.forEach((y) => (y.style.display = "block"));
            return clonedDoc;
          },
        });

        let names = this.chat.messagesPerPerson
          .slice(0, 2)
          .map((person) => person.name)
          .join("-");
        canvas.then((canvas) => {
          downloadBase64File(
            canvas.toDataURL(),
            "whatsanlayze-results-" + names + ".png"
          );
          this.loading = false;
        });
      }, 250);
    },
    paypalButtonPressed() {
      this.$gtag.event("donation-popup-clicked", {
        event_category: "donation",
        event_label: "paypal-clicked",
        value: "1",
      });
    },
  },
};
</script>
