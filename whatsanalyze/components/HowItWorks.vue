<template>
  <div>
    <p class="text-h2 text-center" style="font-size: 3em">How it works</p>
    <div class="explainer-list my-10">
      <div class="text-h5 text-center" cols="4">
        <v-icon color="teal" large> mdi-file-export</v-icon>
        Export your chat
      </div>
      <div class="text-h5 text-center" cols="4">
        <v-icon color="light-blue darken-3" large> mdi-cog</v-icon>
        Drag chat file into box above
      </div>
      <div class="text-h5 text-center" cols="4">
        <v-icon color="amber darken-2" large>
          mdi-emoticon-happy-outline
        </v-icon>
        Enjoy beautiful visualizations
      </div>
    </div>

    <v-timeline align-top>
      <v-timeline-item
        v-for="(item, i) in items"
        :key="i"
        :color="item.color"
        :icon="item.icon"
        :imageAlt="item.imageAlt"
        :imageSrc="item.imageSrc"
        :inageSrcLazy="item.imageSrcLazy"
        :text="item.text"
        :text2="item.text2"
        :text3="item.text3"
        :title="item.title"
        fill-dot
      >
        <div :color="item.color" dark>
          <div class="title"> {{ item.title }}</div>
          <div
            class="white text--primary"
            style="float: left; text-align: left"
          >
            <p class="text-body-1">
              <v-img
                :lazy-src="item.imageSrcLazy"
                :src="item.imageSrc"
                max-height="147"
                max-width="250"
                style="float: left; margin-right: 2rem"
              />
              <br />
              {{ item.text }}
              <br />
              {{ item.text2 }}
              <br />
              {{ item.text3 }}
            </p>
          </div>
        </div>
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<script>
import img1 from "assets/img/adem-ay-zs-41Br0WhQ-unsplash.jpg";
import img1Lazy from "assets/img/adem-ay-zs-41Br0WhQ-unsplash-lazy.jpeg";
import img2 from "assets/img/bermix-studio-1xmcsdkBgWg-unsplash.jpg";
import img2Lazy from "assets/img/bermix-studio-1xmcsdkBgWg-unsplash-lazy.jpeg";
import img3 from "assets/img/christian-wiediger-5BG-9id-A6I-unsplash.jpg";
import img3Lazy from "assets/img/christian-wiediger-5BG-9id-A6I-unsplash-lazy.jpeg";
import img4 from "assets/img/luke-chesser-JKUTrJ4vK00-unsplash.jpg";
import img4Lazy from "assets/img/luke-chesser-JKUTrJ4vK00-unsplash-lazy.jpeg";

export default {
  data() {
    return {
      items: [
        {
          color: "cyan darken-1",
          icon: "mdi-file-export",
          text: " 1. Open the (group) chat.",
          text2: "2. Tap More options > More > Export chat.",
          text3: "3. Choose to export without media.",
          title: "Export your chat",
          imageSrc: img1,
          imageSrcLazy: img1Lazy,
          imageAlt: "How to export your WhatsApp Signal Telegram Threema chat"
        },
        {
          color: "red darken-1",
          icon: "mdi-file",
          text: "Tab on the box above and select your chat .txt file.",
          title: "Drag file into box above",
          imageSrc: img2,
          imageSrcLazy: img2Lazy,
          imageAlt: "How to export your WhatsApp chat"
        },
        {
          color: "teal lighten-1",
          icon: "mdi-chart-box",
          text:
            "Learn who you really are and how you communicate with your friends. Reveal never know facts!. ",
          title: "Enjoy beautiful visualizations",
          imageSrc: img3,
          imageSrcLazy: img3Lazy,
          imageAlt: "How to export your WhatsApp chat"
        },
        {
          color: "amber",
          icon: "mdi-share",
          text:
            "Impress your friends with real data. Stun them with data, who writes the most messages, what emojis are most used and much more. ",
          title: "Share the results with your friends",
          imageSrc: img4,
          imageSrcLazy: img4Lazy,
          imageAlt: "How to export your WhatsApp chat"
        }
      ]
    };
  }
};
</script>

<style></style>
