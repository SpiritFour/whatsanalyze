<template>
  <v-container>
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
        <v-container>
          <v-row no-gutters>
            <v-col cols="12" sm="4" class="pb-8">
              <div class="text-center">
                <div class="carousel-container">
                  <div class="frame-container">
                    <v-img class="frame" contain :src="data.frameImg" />
                  </div>
                  <v-carousel
                    v-model="activeTab"
                    :continuous="false"
                    hide-delimiter-background
                    hide-delimiters
                    show-arrows-on-hover
                    height="100%"
                    width="100%"
                  >
                    <v-carousel-item
                      v-for="(item, idx) in data.carouselItems"
                      :key="idx"
                    >
                      <v-img contain :lazy-src="item.imgLazy" :src="item.img" />
                      <v-btn
                        fab
                        outlined
                        color="black"
                        disabled
                        :style="
                          'position: absolute; left: ' +
                          item.x +
                          '; top: ' +
                          item.y
                        "
                        class="blinking"
                      ></v-btn>
                    </v-carousel-item>
                  </v-carousel>
                </div>
              </div>
            </v-col>
            <v-col cols="12" sm="8" class="pt-md-15">
              <v-timeline dense>
                <v-timeline-item
                  class="mb-4 align-center"
                  small
                  v-for="(tabItem, i) in data.tabItems"
                  :key="i"
                  :text="tabItem.text"
                  :color="activeTab === i ? 'blue' : 'grey'"
                  fill-dot
                  @click.native.stop="activeTab = i"
                >
                  <v-row v-html="tabItem.text"> </v-row>
                </v-timeline-item>
                <v-timeline-item class="mb-4" hide-dot>
                  <v-btn
                    @click="$vuetify.goTo('#fileHandler')"
                    color="#07bc4c"
                    class="my-5 text-h6 white--text"
                  >
                    <v-icon>mdi-arrow-right</v-icon>
                    Tab on the upload box above and select your file.
                  </v-btn>
                </v-timeline-item>
              </v-timeline>
            </v-col>
          </v-row>
        </v-container>
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
import iOS_img8_lazy from "@/assets/img/iOS/Frame8_lazy.png";
import iOS_img8 from "@/assets/img/iOS/Frame8.png";
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
import img5_lazy from "@/assets/img/Android/5copy.png";
import img5 from "@/assets/img/Android/5.png";

export default {
  data: () => ({
    tab: window.safari ? 0 : 1,
    activeTab: 0,
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
            y: "20%",
          },
          {
            img: iOS_img2,
            imgLazy: iOS_img2_lazy,
            text: "",
            x: "50%",
            y: "10%",
          },
          {
            img: iOS_img3,
            imgLazy: iOS_img3_lazy,
            text: "",
            x: "50%",
            y: "90%",
          },
          {
            img: iOS_img4,
            imgLazy: iOS_img4_lazy,
            text: "",
            x: "20%",
            y: "61%",
          },
          {
            img: iOS_img5,
            imgLazy: iOS_img5_lazy,
            text: "",
            x: "50%",
            y: "76%",
          },
          {
            img: iOS_img6,
            imgLazy: iOS_img6_lazy,
            text: "",
            x: "50%",
            y: "63%",
          },
          {
            img: iOS_img7,
            imgLazy: iOS_img7_lazy,
            text: "",
            x: "85%",
            y: "11%",
          },
          {
            img: iOS_img8,
            imgLazy: iOS_img8_lazy,
            text: "",
          },
        ],
        tabItems: [
          {
            text:
              "On iPhone open WhatsApp and tap on the chat you would like to export",
          },
          {
            text:
              'Tap on the name of the chat at the top to open <b class="px-1">Group/Chat Info</b>',
          },
          {
            text: "In chat info, scroll all the way to the bottom",
          },
          {
            text: 'Tap on<b class="px-1">Export Chat</b>',
          },
          {
            text: 'Choose<b class="px-1">Without Media</b>',
          },
          {
            text:
              'Tap on<b class="px-1">Save to Files</b> to save it on your iPhone',
          },
          {
            text:
              'Finally select <b class="px-1">On my iPhone</b> to save it locally',
          },
          {
            text: "At last you can choose your exported .zip to be analyzed",
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
            x: "50%",
            y: "18%",
          },
          {
            img: img2,
            imgLazy: img2_lazy,
            text: "",
            x: "50%",
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
            x: "27%",
            y: "50%",
          },
        ],
        tabItems: [
          {
            text:
              'On your Android phone open <b class="px-1">WhatsApp</b> and tap on the chat you would like to export',
          },
          {
            text:
              'Tap on the name of the chat at the top to open the  <b class="px-1">Group/Chat Info</b>',
          },
          {
            text: 'In the new menu tap on <b class="px-1">More</b>',
          },
          {
            text: 'Tap on <b class="px-1">Export chat</b>',
          },
          {
            text:
              'Choose <b class="px-1">Without Media</b>. Send the file yourself via <b class="px-1">E-Mail</b> or save it to <b class="px-1">Google Drive</b>',
          },
        ],
      },
    ],
  }),
};
</script>

<style scoped lang="scss">
.carousel-container {
  position: relative;
  width: 100%;
}

.frame-container {
  pointer-events: none;
  left: 0;
  top: 0;
  width: 100%;
  position: absolute;
}

.frame {
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
