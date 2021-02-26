<template>
  <div class="text-center">
    <v-dialog v-model="dialog" width="500">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          color="red lighten-2"
          dark
          v-bind="attrs"
          v-on="on"
          @click="
            $gtag.event('donation-popup-clicked', {
              event_category: 'donation',
              event_label: 'popup-clicked',
              value: '1',
            })
          "
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

        <v-row align="center" justify="center" class="mb-3" @click="download">
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
    async download() {
      this.$gtag.event("donation-popup-clicked", {
        event_category: "donation",
        event_label: "paypal-clicked",
        value: "1",
      });
      let canvas = html2canvas(this.results.$el, {
        scrollX: 0,
        scrollY: -window.scrollY,
      });

      let timeout = new Promise((res) => setTimeout(() => res(), 20000));
      timeout.then(() => {
        canvas.then((canvas) => {
          let names = this.chat.messagesPerPerson
            .slice(0, 2)
            .map((person) => person.name)
            .join("-");
          downloadBase64File(
            canvas.toDataURL(),
            "whatsanlazye-results-" + names + ".png"
          );
        });
      });
    },
  },
};
</script>

<style scoped></style>
