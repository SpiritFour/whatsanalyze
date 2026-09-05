<!-- components/LeaderboardCard.vue -->
<template>
  <WrappedStoryContainer class="text-6xl">
    <div class="font-extrabold mb-8">
      {{ headline }}
    </div>

    <WrappedLogo />

    <WrappedStyleBlueSlider />
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import BlueSlider from "~/components/wrapped/Style/BlueSlider.vue";
import { getTargetYear } from "~/utils/wrapped/dateUtils";

const { t } = useI18n();
const currentYear = getTargetYear();
const headline = computed(() => t("results.intro.headline", { year: currentYear }));
</script>
