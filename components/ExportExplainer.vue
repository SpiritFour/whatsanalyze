<template>
  <v-container class="pb-0">
    <div class="text-h5 text-md-h2 text-center pb-8">
      {{ $t("howToExportOn") }}
    </div>
    <v-tabs v-model="tab" centered>
      <v-tab
        v-for="(data, index) in tabData"
        :key="data.title"
        :value="index"
        class="text-body-1 text-md-h4"
        grow
        >{{ data.title }}
      </v-tab>
    </v-tabs>
    <v-window v-model="tab" :touch="false">
      <client-only>
        <v-window-item v-for="(data, idx) in tabData" :key="idx" :value="idx">
          <v-row no-gutters>
            <v-col class="pb-10" cols="12" sm="8">
              <v-timeline
                align="start"
                :density="$vuetify.display.xs ? 'compact' : 'default'"
                class="py-4"
              >
                <v-timeline-item
                  v-for="(tabItem, i) in data.tabItems"
                  :key="i"
                  :dot-color="tabStatus[idx] === i ? 'blue' : 'grey'"
                  fill-dot
                  :size="$vuetify.display.xs ? 'x-small' : 'small'"
                  class="mb-4"
                  @click.stop="tabStatus = [i, i]"
                >
                  <v-row
                    class="cursor-pointer"
                    style="cursor: pointer"
                    v-html="$t(tabItem.text)"
                  >
                  </v-row>
                  <v-btn
                    v-if="i === 0 && tab === 1"
                    id="dlPWA"
                    :disabled="!installButtonStatus"
                    class="mt-5 pa-2 btn-color"
                    @click="downloadPWA"
                    >{{ $t("addToHomescreen") }}
                  </v-btn>
                </v-timeline-item>
              </v-timeline>
              <v-btn
                :to="to ? to : null"
                class="text-md-h6 text-caption ml-10 text-white btn-color select-file-btn"
                elevation="10"
                size="large"
                @click="clickHandler"
              >
                <v-icon left>mdi-arrow-right</v-icon>
                {{ $t(cta) }}
              </v-btn>
            </v-col>
            <v-col
              :class="{ 'mobile-padding': $vuetify.display.xs }"
              class="py-5 px-md-15"
              cols="12"
              sm="4"
            >
              <div class="carousel-container px-4">
                <v-img ref="smartphone" :src="data.frameImg" class="frame" />
                <!-- model and pngs-->
                <v-carousel
                  v-model="tabStatus[idx]"
                  :continuous="false"
                  class="frame-container px-4"
                  height="auto"
                  hide-delimiter-background
                  hide-delimiters
                  show-arrows
                >
                  <v-carousel-item
                    v-for="(item, idx) in data.carouselItems"
                    :key="idx"
                    @click.stop="increaseTabstatus()"
                  >
                    <v-img :lazy-src="item.imgLazy" :src="item.img"></v-img>
                    <div
                      :style="'left: ' + item.x + '; top: ' + item.y"
                      class="click-indicator"
                    ></div>
                  </v-carousel-item>
                </v-carousel>
              </div>
            </v-col>
          </v-row>
        </v-window-item>
      </client-only>
    </v-window>
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
import { GTAG_INSTALL, GTAG_INTERACTION, gtagEvent } from "~/utils/gtagValues";
import { scrollTo } from "~/utils/scroll";

let apple = () => false;
// eslint-disable-next-line no-undef
if (import.meta.client) {
  apple = () => {
    return (
      navigator.platform.toLowerCase().includes("ios") ||
      navigator.platform.toLowerCase().includes("iphone") ||
      navigator.platform.toLowerCase().includes("ipad") ||
      navigator.platform.toLowerCase().includes("mac")
    );
  };
}

export default {
  props: {
    cta: {
      default: function () {
        return "selectFile";
      },
      type: String,
    },
    to: { default: null, type: String },
  },
  data() {
    return {
      GTAG_INTERACTION,
      deferredPrompt: null,
      installButtonStatus: false,
      tabStatus: [0, 0],
      tab: apple() ? 0 : 1,
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
              text: "tabItemiOS1",
            },
            {
              text: "tabItemiOS2",
            },
            {
              text: "tabItemiOS3",
            },
            {
              text: "tabItemiOS4",
            },
            {
              text: "tabItemiOS5",
            },
            {
              text: "tabItemiOS6",
            },
            {
              text: "tabItemiOS7",
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
              text: "tabItemAndroid1",
            },
            {
              text: "tabItemAndroid2",
            },
            {
              text: "tabItemAndroid3",
            },
            {
              text: "tabItemAndroid4",
            },
            {
              text: "tabItemAndroid5",
            },
            {
              text: "tabItemAndroid6",
            },
          ],
        },
      ],
    };
  },
  created() {
    this.catchPWA();
  },
  methods: {
    clickHandler() {
      if (!this.to) {
        gtagEvent("jump_to_filehandler_" + this.tab, GTAG_INTERACTION, 0);
        scrollTo(".filehandler", { offset: 100 });
      }
    },
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
      // eslint-disable-next-line no-undef
      if (import.meta.client) {
        window.addEventListener("beforeinstallprompt", (e) => {
          // Prevent the mini-infobar from appearing on mobile
          e.preventDefault();
          // Stash the event so it can be triggered later.
          this.deferredPrompt = e;
          // Update UI notify the user they can install the PWA
          this.showInstallPromotion(true);
          // Optionally, send analytics event that PWA install promo was shown.
        });
      }
    },
    gtagEvent,
  },
};
</script>

<style lang="scss" scoped>
.carousel-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 50px;
}

.mobile-padding {
  padding-left: 10%;
  padding-right: 10%;
}

.frame-container {
  left: 0;
  top: 0;
  position: absolute;
}

.frame {
  pointer-events: none;
  z-index: 1;
  top: 2px;
}

.select-file-btn {
  min-height: 44px;
  height: auto !important;
  padding: 8px 24px !important;
  white-space: normal;
  line-height: 1.3 !important;
}

.click-indicator {
  position: absolute;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.click-indicator::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid #25d366;
  background-color: rgba(37, 211, 102, 0.25);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: pulse-touch 1.6s ease-in-out infinite;
}

.click-indicator::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #25d366;
  box-shadow: 0 0 0 2px #ffffff, 0 1px 4px rgba(0, 0, 0, 0.3);
  animation: pulse-core 1.6s ease-in-out infinite;
}

@keyframes pulse-touch {
  0% {
    transform: scale(0.85);
    opacity: 0.9;
    border-color: #25d366;
  }
  50% {
    transform: scale(1.25);
    opacity: 1;
    border-color: #128c7e;
    background-color: rgba(37, 211, 102, 0.4);
  }
  100% {
    transform: scale(0.85);
    opacity: 0.9;
    border-color: #25d366;
  }
}

@keyframes pulse-core {
  0% {
    transform: scale(0.9);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(0.9);
  }
}
</style>
