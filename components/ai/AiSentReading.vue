<template>
  <!-- The sender's preview shows this too, inert: what the other person
       gets, without the sender wandering off through its links -->
  <div class="sent" :inert="preview">
    <div class="sent__intro">
      <span class="mono-label sent__eyebrow">{{
        t("toolsAi.sentEyebrow")
      }}</span>
      <h2 class="sent__title">{{ t("toolsAi.sentTitle", { name: from }) }}</h2>
      <p>{{ t(introKey, { name: from }) }}</p>
      <p class="sent__note">{{ t("toolsAi.sentNote", { name: from }) }}</p>
    </div>

    <AiReport :report="report" />

    <div class="sent__cta">
      <h3 class="sent__cta-title">{{ t("toolsAi.sentCtaTitle") }}</h3>
      <p>{{ t("toolsAi.sentCtaText") }}</p>
      <div class="sent__actions">
        <UiButton
          :to="ownLink"
          size="lg"
          @click="analyticsTools.ctaClick('ai_shared', 'ai')"
        >
          {{ t("toolsAi.sentCtaUpload") }}
        </UiButton>
        <UiButton
          :to="sampleLink"
          variant="secondary"
          size="lg"
          @click="analyticsTools.ctaClick('ai_shared', 'sample')"
        >
          {{ t("toolsAi.sentCtaSample") }}
        </UiButton>
      </div>
      <NuxtLink
        :to="localePath('how-to-export-your-whatsapp-chat')"
        class="sent__guide"
        @click="analyticsTools.ctaClick('ai_shared', 'export_guide')"
      >
        {{ t("toolsAi.sampleYoursGuide") }} →
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AiReport from "~/components/ai/AiReport.vue";
import type { AiReport as AiReportData } from "~/utils/ai/report";
import { analyticsTools } from "~/composables/useAnalytics";

/**
 * A reading someone sent from their side of the chat, as the other person
 * opens it (pages/s.vue), and as the sender previews it before sending
 * (AiSendReading.vue): who it's from in plain words, the reading unchanged,
 * and their own reading of the chat next.
 */
const props = defineProps<{
  report: AiReportData;
  from: string;
  /** The sender's preview: shown, not used. */
  preview?: boolean;
}>();
const { t } = useI18n();
const localePath = useLocalePath();

const asked = computed(() => props.report.asked?.preset ?? null);
const introKey = computed(() =>
  asked.value === "better" ? "toolsAi.sentTextBetter" : "toolsAi.sentTextNone",
);

// Their own reading, asked the same way, so it's one they could send back.
const query = computed(() => ({
  source: "shared",
  ...(asked.value ? { ask: asked.value } : {}),
}));
const ownLink = computed(() =>
  localePath({ path: "/tools/ai-chat-analyzer", query: query.value }),
);
const sampleLink = computed(() =>
  localePath({
    path: "/tools/ai-chat-analyzer",
    query: { ...query.value, try: "sample" },
  }),
);
</script>

<style scoped lang="scss">
.sent {
  display: grid;
  gap: 1.5rem;
  text-align: left;
}

.sent__intro {
  display: grid;
  gap: 0.6rem;
  color: #1d1d1f;
  line-height: 1.55;

  p {
    margin: 0;
  }
}

.sent__eyebrow {
  color: #21a68d;
}

.sent__title {
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2.1rem);
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.sent__note {
  color: rgba(29, 29, 31, 0.62);
  font-size: 0.92rem;
}

.sent__cta {
  display: grid;
  gap: 0.8rem;
  justify-items: start;
  padding: 1.4rem 1.3rem;
  border-radius: 18px;
  background: #ecfdf5;
  color: #1d1d1f;
  line-height: 1.5;

  p {
    margin: 0;
  }
}

.sent__cta-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.sent__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.sent__guide {
  color: #127a67;
  font-weight: 600;
}
</style>
