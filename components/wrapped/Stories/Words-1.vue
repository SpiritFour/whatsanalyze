<template>
  <WrappedStoryContainer title="">
    <WrappedStyleGlow />
    <WrappedStylePolygon />

    <div
      class="relative z-10 flex h-full flex-col items-center justify-center px-10 text-center"
    >
      <div
        class="text-[3rem] md:text-[4rem] lg:text-[4.5rem] font-extrabold leading-[1.1] tracking-tight"
      >
        <span
          class="bg-gradient-to-br from-white via-slate-200 to-slate-300 bg-clip-text text-transparent drop-shadow-xl"
        >
          {{ bannerLines.first }}
        </span>
        <br />

        {{ bannerLines.second }}

        <br />
        <span
          class="bg-gradient-to-br from-red-500 via-yellow-500 to-red-400 bg-clip-text text-transparent drop-shadow-xl"
        >
          {{ bannerLines.third }}
        </span>
      </div>

      <WrappedStyleAnimatedDots />
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import AnimatedDots from "~/components/wrapped/Style/AnimatedDots.vue";
import Glow from "~/components/wrapped/Style/Glow.vue";

const { t } = useI18n();
const bannerLines = computed(() => ({
  first: t("results.words.banner.first"),
  second: t("results.words.banner.second"),
  third: t("results.words.banner.third"),
}));
</script>
