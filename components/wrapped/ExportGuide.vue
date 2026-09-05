<template>
  <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
    <div>
      <h2 class="text-3xl md:text-4xl font-bold mb-4">
        {{ $t("exportGuide.title").split("WhatsApp")[0] }}<i>WhatsApp</i>{{ $t("exportGuide.title").split("WhatsApp")[1] }}
      </h2>
      <p class="mb-4">
        In depth guide to export your WhatsApp Chat data from your Android or
        iOS phone.
      </p>

      <div>
        <button
          :class="{
            'bg-green-600': selectedSystem === 'iOS',
          }"
          class="inline-block mt-4 bg-black px-5 py-2 rounded-full rounded-r-none font-semibold hover:bg-green-800 transition-colors"
          @click="changeSystemTo('iOS')"
        >
          {{ $t("exportGuide.ios") }}
        </button>
        <button
          :class="{
            'bg-green-600': selectedSystem === 'Android',
          }"
          class="inline-block mt-4 bg-black px-5 py-2 rounded-full rounded-l-none font-semibold hover:bg-green-800 transition-colors"
          @click="changeSystemTo('Android')"
        >
          {{ $t("exportGuide.android") }}
        </button>
      </div>

      <ol class="mt-4">
        <template
          v-for="(instruction, idx) in instructions[selectedSystem]"
          :key="`${selectedSystem}-${idx}`"
        >
          <li
            :class="{
              'bg-gradient-red': selectedStep === idx,
              'font-bold': selectedStep === idx,
            }"
            class="p-2 rounded-xl cursor-pointer"
            @mouseover="selectedStep = idx"
            @click="selectedStep = idx"
          >
            <div class="flex items-center">
              <span
                class="w-8 h-8 border-2 text-center rounded-full inline-block mr-2"
              >
                {{ idx + 1 }}
              </span>
              <div>
                {{ instruction.text }}
              </div>
            </div>
            <div v-if="isMobile && selectedStep === idx" class="mb-2 mt-4 pl-10">
              <div class="relative max-w-[320px]" :style="frameWrapperStyle">
                <span
                  aria-hidden="true"
                  class="absolute z-20 text-4xl drop-shadow pointer-events-none animate-bounce"
                  :style="pointerStyle(instruction.pointer)"
                >
                  👇
                </span>
                <img
                  :src="`/img/instructions/frame${selectedSystem}.png`"
                  :alt="`${selectedSystem} frame overlay`"
                  class="pointer-events-none absolute inset-0 z-10 w-full select-none"
                />
                <img
                  :src="instruction.img"
                  :alt="`Step ${idx + 1} screenshot for ${selectedSystem}`"
                  class="relative z-0 w-full rounded-2xl shadow-lg"
                  :style="screenStyle(selectedSystem)"
                />
              </div>
            </div>
          </li>
        </template>
      </ol>

      <div
        v-if="shouldShowMobileInfo"
        class="mt-6 rounded-2xl border border-green-200 bg-green-50/80 p-4 text-sm leading-relaxed text-green-900 dark:border-green-600/50 dark:bg-green-900/10 dark:text-green-50/90"
      >
        <p class="mb-1 text-base font-semibold">
          {{ infoContent.title }}
        </p>
        <p>
          {{ infoContent.description }}
        </p>
      </div>

      <div class="font-bold text-xl flex justify-between mx-auto w-20 my-8">
        <ArrowLeftCircleIcon
          class="w-8 h-8 hover:text-green-600 cursor-pointer hover:bg-white rounded-full"
          @click="decrementIdx()"
        />
        <ArrowRightCircleIcon
          class="w-8 h-8 hover:text-green-600 cursor-pointer hover:bg-white rounded-full"
          @click="incrementIdx()"
        />
      </div>
    </div>
    <div v-if="!isMobile" class="flex items-center justify-center">
      <div class="relative max-w-[350px]" :style="frameWrapperStyle">
        <span
          aria-hidden="true"
          class="absolute z-20 text-5xl drop-shadow pointer-events-none animate-bounce"
          :style="pointerStyle(activeInstructions.pointer)"
        >
          👇
        </span>
        <img
          :src="`/img/instructions/frame${selectedSystem}.png`"
          :alt="`${selectedSystem} frame overlay`"
          class="pointer-events-none absolute inset-0 z-10 w-full select-none"
        />
        <img
          :src="activeInstructions.img"
          :alt="`Step ${selectedStep + 1} screenshot for ${selectedSystem}`"
          class="relative z-0 w-full rounded-2xl shadow-lg"
          :style="screenStyle(selectedSystem)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  LightBulbIcon,
} from "@heroicons/vue/24/solid";
import type { CSSProperties } from "vue";
import Gradient from "~/components/wrapped/Gradient.vue";

type System = "iOS" | "Android";
type PointerStyle = CSSProperties | null;

export default {
  components: {
    Gradient,
    ChatBubbleLeftIcon,
    CalendarIcon,
    LightBulbIcon,
    ArrowRightCircleIcon,
    ArrowLeftCircleIcon,
  },
  methods: {
    changeSystemTo(system: System) {
      this.selectedStep = 0;
      this.selectedSystem = system;
    },
    decrementIdx(): void {
      this.selectedStep = Math.min(this.selectedStep - 1, 0);
    },
    incrementIdx(): void {
      this.selectedStep = Math.min(
        this.selectedStep + 1,
        this.instructions[this.selectedSystem].length - 1,
      );
    },
    handleBreakpointChange(event: MediaQueryListEvent) {
      this.isMobile = event.matches;
    },
    registerBreakpointListener() {
      if (typeof window === "undefined") {
        return;
      }
      this.mobileQuery = window.matchMedia("(max-width: 767px)");
      this.isMobile = this.mobileQuery.matches;
      if (this.mobileQuery.addEventListener) {
        this.mobileQuery.addEventListener("change", this.handleBreakpointChange);
      } else {
        this.mobileQuery.addListener(this.handleBreakpointChange);
      }
    },
    unregisterBreakpointListener() {
      if (!this.mobileQuery) {
        return;
      }
      if (this.mobileQuery.removeEventListener) {
        this.mobileQuery.removeEventListener(
          "change",
          this.handleBreakpointChange,
        );
      } else {
        this.mobileQuery.removeListener(this.handleBreakpointChange);
      }
    },
    pointerStyle(pointerOverrides?: PointerStyle) {
      const baseStyle: CSSProperties = {
        top: "1rem",
        left: "50%",
        transform: "translate(-50%, 0)",
      };

      if (!pointerOverrides) {
        return baseStyle;
      }

      return {
        ...baseStyle,
        ...pointerOverrides,
      };
    },
    screenStyle(system: System) {
      const baseStyle: CSSProperties = {
        display: "block",
        marginLeft: "auto",
        marginRight: "auto",
      };

      const desktopStyle = this.screenStyles[system];
      const mobileStyle = this.screenStylesMobile[system];
      const style =
        this.isMobile && mobileStyle !== undefined ? mobileStyle : desktopStyle;

      if (!style) {
        return baseStyle;
      }

      return {
        ...baseStyle,
        ...style,
      };
    },
  },
  mounted() {
    this.registerBreakpointListener();
  },
  beforeUnmount() {
    this.unregisterBreakpointListener();
  },
  computed: {
    activeInstructions() {
      return this.instructions[this.selectedSystem][this.selectedStep];
    },
    shouldShowMobileInfo() {
      return this.isMobile;
    },
    infoContent() {
      return {
        title: this.$t("exportGuide.info.title") as string,
        description: this.$t("exportGuide.info.description") as string,
      };
    },
    frameWrapperStyle(): CSSProperties {
      return {
        width: "100%",
        aspectRatio: "854 / 1716",
      };
    },
    instructions() {
      // iOS: 7 steps, Android: 6 steps
      const iosSteps = Array.from({ length: 7 }, (_, idx) => ({
        text: this.$t(`exportGuide.iosSteps.${idx}`) as string,
        img: `/img/instructions/iOS/Frame${idx + 1}.png`,
        pointer: this.pointerLayouts.iOS[idx],
      }));

      const androidSteps = Array.from({ length: 6 }, (_, idx) => ({
        text: this.$t(`exportGuide.androidSteps.${idx}`) as string,
        img: `/img/instructions/Android/${idx + 1}.png`,
        pointer: this.pointerLayouts.Android[idx],
      }));

      return {
        iOS: iosSteps,
        Android: androidSteps,
      };
    },
  },
  data() {
    return {
      selectedSystem: "iOS" as "iOS" | "Android",
      selectedStep: 0,
      isMobile: false,
      mobileQuery: null as MediaQueryList | null,
      // Adjust these coordinates to move the 👇 overlay for specific steps.
      pointerLayouts: {
        iOS: [
          { top: "20%", left: "20%" },
          { top: "3%"},
          { top: "77%", left: "20%" },
          { top: "83%", left: "40%"  },
          { top: "45%", left: "53%" },
          { top: "40%", left: "20%" },
          { top: "60%" },
        ] as PointerStyle[],
        Android: [
          { top: "50%", left: "70%" },
          { top: "7%", left: "80%" },
          { top: "32%" },
          { top: "22%" },
          { top: "45%", left: "20%" },
          { top: "75%", left: "10%" },
        ] as PointerStyle[],
      } as Record<System, PointerStyle[]>,
      screenStyles: {
        iOS: {
          width: "88%",
          marginTop: "5.3%",
        },
        Android: {
          width: "100%",
          marginTop: "0%",
        },
      } as Record<System, CSSProperties | undefined>,
      screenStylesMobile: {
        iOS: {
          width: "88%",
          transform: "translateY(2.8%)",
        },
        Android: undefined,
      } as Record<System, CSSProperties | undefined>,
    };
  },
};
</script>
