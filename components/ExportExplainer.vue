<template>
  <div class="export-explainer">
    <div class="export-explainer__tabs" role="tablist">
      <button
        v-for="(data, index) in tabData"
        :key="data.title"
        type="button"
        role="tab"
        :aria-selected="tab === index"
        class="export-explainer__tab"
        :class="{ 'is-active': tab === index }"
        @click="tab = index"
      >
        {{ data.title }}
      </button>
    </div>

    <div class="export-explainer__body">
      <ol class="export-explainer__steps">
        <li v-for="(tabItem, i) in activeTab.tabItems" :key="i">
          <button
            type="button"
            class="export-explainer__step"
            :class="{ 'is-active': activeStep === i }"
            @click="goToStep(i)"
          >
            <span class="export-explainer__step-num">{{ i + 1 }}</span>
            <span
              class="export-explainer__step-text"
              v-html="$t(tabItem.text)"
            ></span>
          </button>
          <!-- Only offered where the browser actually fired
               beforeinstallprompt. It used to render permanently greyed out
               everywhere else, which read as a broken button. -->
          <button
            v-if="i === 0 && tab === 1 && installButtonStatus"
            id="dlPWA"
            type="button"
            class="export-explainer__pwa"
            @click="downloadPWA"
          >
            {{ $t("addToHomescreen") }}
          </button>
        </li>
      </ol>

      <div class="export-explainer__phone">
        <div class="export-explainer__frame" @click="goToStep(activeStep + 1)">
          <img
            :src="activeTab.frameImg"
            alt=""
            aria-hidden="true"
            class="export-explainer__frame-img"
          />
          <div class="export-explainer__screen">
            <img
              :src="activeSlide.img"
              :alt="`${activeTab.title} — ${activeStep + 1}`"
              loading="lazy"
            />
            <span
              class="export-explainer__tap"
              :style="{ left: activeSlide.x, top: activeSlide.y }"
            ></span>
          </div>
        </div>

        <div class="export-explainer__pager">
          <button
            type="button"
            class="export-explainer__arrow"
            :disabled="activeStep === 0"
            aria-label="Previous step"
            @click="goToStep(activeStep - 1)"
          >
            <v-icon size="18">mdi-chevron-left</v-icon>
          </button>
          <span class="export-explainer__dots">
            <button
              v-for="(item, i) in activeTab.carouselItems"
              :key="i"
              type="button"
              class="export-explainer__dot"
              :class="{ 'is-active': activeStep === i }"
              :aria-label="`Step ${i + 1}`"
              @click="goToStep(i)"
            ></button>
          </span>
          <button
            type="button"
            class="export-explainer__arrow"
            :disabled="activeStep === activeTab.carouselItems.length - 1"
            aria-label="Next step"
            @click="goToStep(activeStep + 1)"
          >
            <v-icon size="18">mdi-chevron-right</v-icon>
          </button>
        </div>
      </div>
    </div>

    <div class="export-explainer__cta">
      <NuxtLink v-if="to" :to="to" class="export-explainer__button">
        {{ $t(cta) }}
      </NuxtLink>
      <button
        v-else
        type="button"
        class="export-explainer__button"
        @click="clickHandler"
      >
        {{ $t(cta) }}
      </button>
    </div>
  </div>
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
import { analyticsSite } from "~/composables/useAnalytics";
import { scrollTo } from "~/utils/scroll";

let apple = () => false;

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
      deferredPrompt: null,
      installButtonStatus: false,
      tabStatus: [0, 0],
      tab: 0,
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
  computed: {
    activeTab() {
      return this.tabData[this.tab];
    },
    activeStep() {
      return Math.min(
        this.tabStatus[this.tab],
        this.activeTab.carouselItems.length - 1,
      );
    },
    activeSlide() {
      return this.activeTab.carouselItems[this.activeStep];
    },
  },
  created() {
    this.catchPWA();
  },
  mounted() {
    // Only now: picking the tab from the platform during setup would render
    // iOS on the server and Android in the browser, and hydration would trip
    // over the mismatch.
    this.tab = apple() ? 0 : 1;
  },
  methods: {
    clickHandler() {
      analyticsSite.jumpToUpload(
        this.tab === 0 ? "export_guide_ios" : "export_guide_android",
      );
      scrollTo("#dropzone-slot, .file-handler", { offset: 100 });
    },
    goToStep(index) {
      const steps = this.activeTab.carouselItems.length;
      const next = Math.max(0, Math.min(index, steps - 1));
      const status = [...this.tabStatus];
      status[this.tab] = next;
      this.tabStatus = status;
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
          analyticsSite.pwaInstall(outcome);

          // We've used the prompt, and can't use it again, throw it away
          this.deferredPrompt = null;
        }
      }
    },

    showInstallPromotion(status) {
      this.installButtonStatus = status;
    },
    catchPWA() {
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
  },
};
</script>

<style lang="scss" scoped>
.export-explainer {
  max-width: 900px;
  margin: 0 auto;
  text-align: left;
}

.export-explainer__tabs {
  display: flex;
  width: fit-content;
  gap: 0.25rem;
  padding: 0.25rem;
  margin: 0 auto;
  border-radius: $wa-radius-pill;
  background: $wa-surface-light;
  border: 1px solid $wa-border;
}

.export-explainer__tab {
  padding: 0.5rem 1.4rem;
  border: none;
  border-radius: $wa-radius-pill;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 600;
  color: $wa-ink-muted;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &.is-active {
    background: $wa-accent;
    color: #ffffff;
  }
}

.export-explainer__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 260px);
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
  margin-top: clamp(1.8rem, 4vw, 2.6rem);

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.export-explainer__steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.export-explainer__step {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1px solid transparent;
  border-radius: $wa-radius-md;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: $wa-surface-white;
  }

  &.is-active {
    background: $wa-surface-white;
    border-color: $wa-border;
    box-shadow: $wa-shadow-sm;
  }
}

.export-explainer__step-num {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
  color: $wa-ink-faint;
  background: $wa-surface-light;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  .export-explainer__step.is-active & {
    background: $wa-accent;
    color: #ffffff;
  }
}

.export-explainer__step-text {
  font-size: 1rem;
  line-height: 1.5;
  color: $wa-ink-muted;

  .export-explainer__step.is-active & {
    color: $wa-ink;
  }

  :deep(b),
  :deep(strong) {
    color: $wa-ink;
    font-weight: 600;
  }
}

.export-explainer__pwa {
  margin: 0.4rem 0 0.6rem 3.35rem;
  padding: 0.5rem 1.1rem;
  border-radius: $wa-radius-pill;
  border: none;
  background: $wa-accent;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: $wa-accent-dark;
  }
}

.export-explainer__phone {
  position: sticky;
  top: 6rem;

  @media (max-width: 720px) {
    position: static;
    max-width: 260px;
    margin: 0 auto;
  }
}

.export-explainer__frame {
  position: relative;
  cursor: pointer;
}

.export-explainer__frame-img {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  pointer-events: none;
}

.export-explainer__screen {
  position: absolute;
  inset: 0;
  padding: 0 4%;

  img {
    display: block;
    width: 100%;
  }
}

.export-explainer__tap {
  position: absolute;
  width: 34px;
  height: 34px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }

  &::before {
    width: 100%;
    height: 100%;
    border: 2px solid $wa-accent;
    background: rgba(33, 166, 141, 0.25);
    animation: export-tap 1.6s ease-in-out infinite;
  }

  &::after {
    width: 12px;
    height: 12px;
    background: $wa-accent;
    box-shadow: 0 0 0 2px #ffffff;
  }
}

@keyframes export-tap {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(0.85);
    opacity: 0.9;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .export-explainer__tap::before {
    animation: none;
  }
}

.export-explainer__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 1rem;
}

.export-explainer__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid $wa-border;
  background: $wa-surface-white;
  color: $wa-ink-muted;
  cursor: pointer;

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
}

.export-explainer__dots {
  display: inline-flex;
  gap: 0.35rem;
}

.export-explainer__dot {
  width: 7px;
  height: 7px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: $wa-border;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;

  &.is-active {
    background: $wa-accent;
    transform: scale(1.3);
  }
}

.export-explainer__cta {
  margin-top: clamp(1.8rem, 4vw, 2.6rem);
  text-align: center;
}

.export-explainer__button {
  display: inline-block;
  padding: 0.9em 2.2em;
  border: none;
  border-radius: $wa-radius-pill;
  background: $wa-accent;
  color: #ffffff;
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(33, 166, 141, 0.35);
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: $wa-accent-light;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
