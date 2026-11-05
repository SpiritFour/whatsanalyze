<template>
  <div class="mt-5 w-full border-t border-white/15 pt-4">
    <NuxtLink
      :to="localePath('/tools/ai-chat-analyzer')"
      class="text-sm font-semibold text-emerald-200 no-underline hover:text-emerald-100"
      @click="analyticsTools.ctaClick('wrapped', 'ai')"
    >
      {{ t("askAiCard.title") }} &rarr;
    </NuxtLink>
    <p class="mt-1 text-xs text-slate-200/70">
      {{ t("wrappedAiTeaser.text") }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { analyticsTools } from "~/composables/useAnalytics";

// AskAiCard, cut down to one line. Its preset chips do not fit under the share
// buttons on the 320x560 card, and unlike the analyzer's results Wrapped
// parses in a worker and keeps no messages to hand over: the AI page asks for
// the export again and offers the questions itself.
const { t } = useI18n();
const localePath = useLocalePath();
</script>
