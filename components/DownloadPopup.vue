<template>
  <v-col class="my-4 mb-16">
    <v-row justify="center">
      <div class="cta my-md-4">
        <div class="text-h3 font-weight-bold pb-4">
          Download all Graphs at once!
        </div>
        <div class="text-body-1">Currently for free! <br /></div>
        <v-dialog v-model="dialog" width="500">
          <template v-slot:activator="{ on }">
            <v-btn color="#07bc4c" dark v-on="on" @click="() => download()">
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

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="red darken-1" text @click="dialog = false">
                Close
              </v-btn>
              <v-btn color="primary" text :loading="true"> Download </v-btn>
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
  props: ["results", "chat"],
  data() {
    return {
      dialog: false,
    };
  },
  methods: {
    download() {
      console.log("download here", this.results);
      this.$gtag.event("donation-popup-clicked", {
        event_category: "donation",
        event_label: "popup-clicked",
        value: "1",
      });

      let canvas = html2canvas(this.results.$refs.graphs, {
        scrollX: 0,
        scrollY: -window.scrollY,
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
          "whatsanlazye-results-" + names + ".png"
        );
      });
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
