<template>
  <div class="text-center">
    <div class="text-h2">How to export your chat</div>
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
            v-model="model"
            continuous="false"
            hide-delimiter-background
            hide-delimiters
            show-arrows-on-hover
            height="1230"
          >
            <v-carousel-item v-for="(item, idx) in carouselItems" :key="idx">
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

export default {
  data: () => ({
    model: 0,
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
