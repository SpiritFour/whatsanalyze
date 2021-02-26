<template>
  <v-container>
    <div class="text-h5 text-md-h2 text-center pb-8">
      How To export your chat on
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
                  <v-row>
                    {{ tabItem.text }}
                  </v-row>
                </v-timeline-item>
              </v-timeline>

              <v-btn
                to="#drop"
                color="#07bc4c"
                class="text-md-h6 text-caption ml-10 white--text"
                style="max-width: 100%"
              >
                <v-icon>mdi-arrow-right</v-icon>
                Select file via box above.
              </v-btn>
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
    tab: null,
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
          },
          {
            img: iOS_img2,
            imgLazy: iOS_img2_lazy,
            text: "",
          },
          {
            img: iOS_img3,
            imgLazy: iOS_img3_lazy,
            text: "",
          },
          {
            img: iOS_img4,
            imgLazy: iOS_img4_lazy,
            text: "",
          },
          {
            img: iOS_img5,
            imgLazy: iOS_img5_lazy,
            text: "",
          },
          {
            img: iOS_img6,
            imgLazy: iOS_img6_lazy,
            text: "",
          },
          {
            img: iOS_img7,
            imgLazy: iOS_img7_lazy,
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
              'Tap on the name of the chat at the top to open "Group/Chat Info"',
          },
          {
            text: "In chat info, scroll all the way to the bottom",
          },
          {
            text: 'Tap on "export chat" > choose "Without Media"',
          },
          {
            text: 'Choose "Without Media"',
          },
          {
            text: 'Tap on "Save to Files" to save it on your iPhone',
          },
          {
            text: "Save the file on your iPhone",
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
          },
          {
            img: img2,
            imgLazy: img2_lazy,
            text: "",
          },
          {
            img: img3,
            imgLazy: img3_lazy,
            text: "",
          },
          {
            img: img4,
            imgLazy: img4_lazy,
            text: "",
          },
          {
            img: img5,
            imgLazy: img5_lazy,
            text: "",
          },
        ],
        tabItems: [
          {
            text:
              "On your Android phone open WhatsApp and tap on the chat you would like to export",
          },
          {
            text:
              'Tap on the name of the chat at the top to open the "Group/Chat Info"',
          },
          {
            text: 'In the new menu tap on "More >"',
          },
          {
            text: 'Tap on "Export chat"',
          },
          {
            text:
              'Choose "Without Media". Send the file yourself via "E-Mail" or save it to Google Drive',
          },
        ],
      },
    ],
  }),
};
</script>

<style scoped>
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
</style>
