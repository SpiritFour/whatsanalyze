<template>
  <v-container>
    <v-row no-gutters>
      <v-col cols="12" md="3" class="pb-8">
        <div class="text-center">
          <div class="py-10">
            <div class="carousel-container" style="height: 600px; width: 300px">
              <div class="frame-container">
                <v-img
                  class="frame"
                  height="600px"
                  width="300px"
                  contain
                  :src="require('@/assets/img/iOS/FrameiOS.png')"
                />
              </div>

              <div>
                <v-carousel
                  v-model="activeTab"
                  continuous="false"
                  hide-delimiter-background
                  hide-delimiters
                  show-arrows-on-hover
                  height="1230"
                >
                  <v-carousel-item
                    v-for="(item, idx) in carouselItems"
                    :key="idx"
                  >
                    <v-row align="center" justify="center">
                      <v-img
                        height="600px"
                        contain
                        :lazy-src="item.imgLazy"
                        :src="item.img"
                      />
                    </v-row>
                  </v-carousel-item>
                </v-carousel>
              </div>
            </div>
          </div>
        </div>
      </v-col>
      <v-col cols="12" md="9" class="pt-md-15">
        <v-timeline dense clipped>
          <v-slide-x-transition group> </v-slide-x-transition>
          <v-timeline-item
            class="mb-4"
            small
            v-for="(tabItems, i) in tabItems"
            :key="i"
            :text="tabItems.text"
            :color="activeTab === i ? 'blue' : 'grey'"
            fill-dot
            @click.native.stop="activeTab = i"
          >
            <v-row justify="space-between">
              <v-col cols="7">
                <v-chip
                  v-if="i === 0"
                  class="white--text ml-0"
                  color="purple"
                  label
                  small
                >
                  iOS
                </v-chip>
                {{ tabItems.text }}
              </v-col>
            </v-row>
          </v-timeline-item>
          <v-timeline-item class="mb-4" hide-dot>
            <v-btn to="#drop" class="mx-0"> Select my chat .zip now. </v-btn>
          </v-timeline-item>
        </v-timeline>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import img1_lazy from "@/assets/img/iOS/Frame1_lazy.png";
import img1 from "@/assets/img/iOS/Frame1.png";
import img2_lazy from "@/assets/img/iOS/Frame2_lazy.png";
import img2 from "@/assets/img/iOS/Frame2.png";
import img3_lazy from "@/assets/img/iOS/Frame3_lazy.png";
import img3 from "@/assets/img/iOS/Frame3.png";
import img4_lazy from "@/assets/img/iOS/Frame4_lazy.png";
import img4 from "@/assets/img/iOS/Frame4.png";
import img5_lazy from "@/assets/img/iOS/Frame5_lazy.png";
import img5 from "@/assets/img/iOS/Frame5.png";
import img6_lazy from "@/assets/img/iOS/Frame6_lazy.png";
import img6 from "@/assets/img/iOS/Frame6.png";
import img7_lazy from "@/assets/img/iOS/Frame7_lazy.png";
import img7 from "@/assets/img/iOS/Frame7.png";
import img8_lazy from "@/assets/img/iOS/Frame8_lazy.png";
import img8 from "@/assets/img/iOS/Frame8.png";

export default {
  data: () => ({
    activeTab: 0,
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
      {
        img: img6,
        imgLazy: img6_lazy,
        text: "",
      },
      {
        img: img7,
        imgLazy: img7_lazy,
        text: "",
      },
      {
        img: img8,
        imgLazy: img8_lazy,
        text: "",
      },
    ],
    tab: null,
    tabItems: [
      {
        text:
          "On Iphone open WhatsApp and tap on the chat you would like to export",
      },
      {
        text:
          'Tap on the name of the chat at the top to open "Group/Chat Info"',
      },
      {
        text: "In chat info, scroll all the way to the bottom",
      },
      {
        text: 'tap on "export chat" > choose "Without Media"',
      },
      {
        text: 'choose "Without Media"',
      },
      {
        text: 'Tap on "Save to Files" to save it on your Iphone',
      },
      {
        text: 'Finally select "On my Iphone" to save it locally',
      },
      {
        text:
          "At last you can select your exported chat .zip now to be analyzed",
      },
    ],
  }),
};
</script>

<style scoped>
.carousel-container {
  height: 600px;
  position: relative;
}

.frame-container {
  pointer-events: none;
  left: 50%;
  position: absolute;
}

.frame {
  left: -50%;
  z-index: 99999;
  top: -11px;
}
</style>
