<template>
  <v-container class="pb-0">
    <div class="text-h5 text-md-h2 text-center pb-8">
      How to export your chat on
    </div>
    <v-tabs v-model="tab" centered>
      <v-tab
        v-for="data in tabData"
        :key="data.title"
        grow
        class="text-body-1 text-md-h4"
        >{{ data.title }}</v-tab
      >
    </v-tabs>
    <v-tabs-items v-model="tab">
      <v-tab-item v-for="(data, idx) in tabData" :key="idx">
        <v-row no-gutters>
          <v-col cols="12" sm="8" class="pt-md-15">
            <v-timeline dense>
              <v-timeline-item
                class="mb-4 align-center"
                small
                v-for="(tabItem, i) in data.tabItems"
                :key="i"
                :text="tabItem.text"
                :color="tabStatus[idx] === i ? 'blue' : 'grey'"
                fill-dot
                @click.native.stop="tabStatus = [i, i]"
              >
                <v-row v-html="tabItem.text" style="cursor: pointer"> </v-row>
                <v-btn
                  v-if="i === 0 && tab === 1"
                  v-bind:disabled="!installButtonStatus"
                  v-on:click="downloadPWA"
                  id="dlPWA "
                  class="mt-5 pa-2 white--text"
                  color="#07bc4c"
                  style=""
                  >add to Homescreen</v-btn
                >
              </v-timeline-item>
            </v-timeline>
            <v-btn
              elevation="10"
              @click="
                gtagEvent('jump_to_filehandler_' + tab, GTAG_INTERACTION, 0);
                $vuetify.goTo('#fileHandler', {
                  duration: 300,
                  offset: 100,
                });
              "
              color="#07bc4c"
              class="text-md-h6 text-caption ml-10 white--text"
            >
              <v-icon>mdi-arrow-right</v-icon>
              Select file via box above.
            </v-btn>
          </v-col>
          <v-col cols="12" sm="4" class="pt-5">
            <div class="carousel-container px-md-16 px-4">
              <v-img ref="smartphone" class="frame" :src="data.frameImg" />
              <!--                this is model and pngs-->
              <v-carousel
                v-model="tabStatus[idx]"
                :continuous="false"
                hide-delimiter-background
                hide-delimiters
                show-arrows
                class="frame-container px-md-16 px-4"
                height="auto"
              >
                <v-carousel-item
                  v-for="(item, idx) in data.carouselItems"
                  :key="idx"
                  @click.native.stop="increaseTabstatus()"
                >
                  <v-img :lazy-src="item.imgLazy" :src="item.img"> </v-img>
                  <v-btn
                    fab
                    outlined
                    color="black"
                    disabled
                    :style="
                      'position: absolute; left: ' + item.x + '; top: ' + item.y
                    "
                    class="blinking"
                  ></v-btn>
                </v-carousel-item>
              </v-carousel>
            </div>
          </v-col>
        </v-row>
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script>
// iOS
import iOSFrame from "@/assets/img/iOS/FrameiOS.png";
import iOS_img1_lazy from "@/assets/img/iOS/Frame1_lazy.png";
import iOS_img1 from "@/assets/img/iOS/Frame1.png";
import iOS_img2_lazy from "@/assets/img/iOS/Frame2_lazy.png";
import iOS_img2 from "@/assets/img/iOS/Frame2.png";
import iOS_img3_lazy from "@/assets/img/iOS/Frame3_lazy.png";
import iOS_img3 from "@/assets/img/iOS/Frame3.png";
import iOS_img4_lazy from "@/assets/img/iOS/Frame4_lazy.png";
import iOS_img4 from "@/assets/img/iOS/Frame4.png";
import iOS_img5_lazy from "@/assets/img/iOS/Frame5_lazy.png";
import iOS_img5 from "@/assets/img/iOS/Frame5.png";
import iOS_img6_lazy from "@/assets/img/iOS/Frame6_lazy.png";
import iOS_img6 from "@/assets/img/iOS/Frame6.png";
import iOS_img7_lazy from "@/assets/img/iOS/Frame7_lazy.png";
import iOS_img7 from "@/assets/img/iOS/Frame7.png";
// Android
import AndroidFrame from "@/assets/img/Android/frameAndroid.png";
import img1_lazy from "@/assets/img/Android/1copy.png";
import img1 from "@/assets/img/Android/1.png";
import img2_lazy from "@/assets/img/Android/2copy.png";
import img2 from "@/assets/img/Android/2.png";
import img3_lazy from "@/assets/img/Android/3copy.png";
import img3 from "@/assets/img/Android/3.png";
import img4_lazy from "@/assets/img/Android/4copy.png";
import img4 from "@/assets/img/Android/4.png";
import img5 from "@/assets/img/Android/5.png";
import img5_lazy from "@/assets/img/Android/5copy.png";
import img6 from "@/assets/img/Android/6.png";
import img6_lazy from "@/assets/img/Android/6copy.png";
import {
  GTAG_INTERACTION,
  GTAG_INSTALL,
  gtagEvent,
} from "~/functions/gtagValues";

export default {
  data: () => ({
    GTAG_INTERACTION,
    deferredPrompt: null,
    installButtonStatus: false,
    tabStatus: [0, 0],
    tab:
      navigator.platform.toLowerCase().includes("ios") ||
      navigator.platform.toLowerCase().includes("iphone") ||
      navigator.platform.toLowerCase().includes("ipad") ||
      navigator.platform.toLowerCase().includes("mac")
        ? 0
        : 1,
    tabData: [
      {
        title: "iOS (Apple)",
        frameImg: iOSFrame,
        carouselItems: [
          {
            img: iOS_img1,
            imgLazy: iOS_img1_lazy,
            text: "",
            x: "50%",
            y: "10%",
          },
          {
            img: iOS_img2,
            imgLazy: iOS_img2_lazy,
            text: "",
            x: "50%",
            y: "88%",
          },
          {
            img: iOS_img3,
            imgLazy: iOS_img3_lazy,
            text: "",
            x: "20%",
            y: "61%",
          },
          {
            img: iOS_img4,
            imgLazy: iOS_img4_lazy,
            text: "",
            x: "50%",
            y: "76%",
          },
          {
            img: iOS_img5,
            imgLazy: iOS_img5_lazy,
            text: "",
            x: "50%",
            y: "63%",
          },
          {
            img: iOS_img6,
            imgLazy: iOS_img6_lazy,
            text: "",
            x: "50%",
            y: "32%",
          },
          {
            img: iOS_img7,
            imgLazy: iOS_img7_lazy,
            text: "",
            x: "50%",
            y: "81.5%",
          },
        ],
        tabItems: [
          {
            text:
              "<span>On iPhone <b>open</b> WhatsApp and the <b>chat</b> or <b>group chat</b> you would like to export > at the top <b>tap on</b> the <b>name</b> of the chat.</span>",
          },
          {
            text:
              "<span>In chat info, scroll all the way to the bottom.</span>",
          },
          {
            text: "<span>Tap on <b>Export Chat</b>.</span>",
          },
          {
            text: "<span>Choose <b >Without Media</b>.</span>",
          },
          {
            text:
              "<span>Tap on <b>Save to Files</b> to save it on your iPhone.</span>",
          },
          {
            text:
              "<span>Finally select <b >On my iPhone</b> and <b >save</b> to save it locally.</span>",
          },
          {
            text:
              "<span>At last you can select your exported .zip to be analyzed.</span>",
          },
        ],
      },
      {
        title: "Android",
        frameImg: AndroidFrame,
        carouselItems: [
          {
            img: img1,
            imgLazy: img1_lazy,
            text: "",
            x: "78%",
            y: "51%",
          },
          {
            img: img2,
            imgLazy: img2_lazy,
            text: "",
            x: "89%",
            y: "13%",
          },
          {
            img: img3,
            imgLazy: img3_lazy,
            text: "",
            x: "60%",
            y: "37%",
          },
          {
            img: img4,
            imgLazy: img4_lazy,
            text: "",
            x: "60%",
            y: "27%",
          },
          {
            img: img5,
            imgLazy: img5_lazy,
            text: "",
            x: "67%",
            y: "48%",
          },
          {
            img: img6,
            imgLazy: img6_lazy,
            text: "",
            x: "14%",
            y: "73%",
          },
        ],
        tabItems: [
          {
            text:
              "<span>On your Android phone open this Website in <b>Chrome</b> and tap on the button <b>add to Homescreen</b> and press install</span>",
          },
          {
            text:
              "<span>Open <b>WhatsApp</b> and tap on the chat you would like to export > tap on the <b>three-dots</b> at the top right corner.</span>",
          },
          {
            text: "<span>In the new menu tap on <b>More</b>.</span>",
          },
          {
            text: "<span>Tap on <b>Export chat</b>.</span>",
          },
          {
            text:
              "<span>Choose Without Media or <b>Include Media</b> if you want to include your images and other files in the export.</span>",
          },
          {
            text:
              "<span>Now in the sharing view tap on <b>Whatsanalyze</b> or alternatively if you skipped step 1 send it to your self via <b>E-Mail</b> or save it to <b>Google Drive</b>.</span>",
          },
        ],
      },
    ],
  }),
  methods: {
    increaseTabstatus() {
      let maxValue = this.tabData[this.tab].carouselItems.length;
      let a = [...this.tabStatus];
      a[this.tab] = Math.min(a[this.tab] + 1, maxValue);
      this.tabStatus = a;
    },
    async downloadPWA() {
      {
        // Hide the app provided install promotion
        this.showInstallPromotion(false);
        // Show the install prompt
        if (this.deferredPrompt) {
          this.deferredPrompt.prompt();
          // Wait for the user to respond to the prompt
          const { outcome } = await this.deferredPrompt.userChoice;
          // Optionally, send analytics event with outcome of user choice
          gtagEvent("pwa_" + outcome, GTAG_INSTALL, 2);

          // We've used the prompt, and can't use it again, throw it away
          this.deferredPrompt = null;
        }
      }
    },
    // eslint-disable-next-line no-unused-vars
    showInstallPromotion(status) {
      this.installButtonStatus = status;
    },
    catchPWA() {
      window.addEventListener("beforeinstallprompt", (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        this.deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        this.showInstallPromotion(true);
        // Optionally, send analytics event that PWA install promo was shown.
      });
    },
    gtagEvent,
  },
  created() {
    this.catchPWA();
  },
};
</script>

<style scoped lang="scss">
.carousel-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 50px;
}
.frame-container {
  left: 0;
  top: 0;
  position: absolute;
}

.frame {
  pointer-events: none;
  z-index: 99999;
  top: 2px;
}

.blinking {
  animation-name: blink;
  animation-duration: 2s;
  animation-iteration-count: infinite;
  z-index: 99999;
  border: 3px solid rgba(0, 128, 0, 0.7);
  background-color: transparent;
  margin-left: -25px;
  margin-top: -25px;
}

@keyframes blink {
  0% {
    width: 50px;
    height: 50px;
  }
  50% {
    width: 10px;
    height: 10px;
    margin-left: 0px;
    margin-top: 0px;
    background-color: rgba(0, 128, 0, 0.3);
    border-color: rgba(0, 128, 0, 0.3);
    border-width: 2px;
  }
  100% {
    width: 50px;
    height: 50px;
  }
}
</style>
