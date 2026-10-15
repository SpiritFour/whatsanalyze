<template>
  <div class="ask-ai">
    <div class="ask-ai__head">
      <v-icon size="28" color="#21a68d">mdi-creation-outline</v-icon>
      <div>
        <h3 class="ask-ai__title">{{ t("askAiCard.title") }}</h3>
        <p class="ask-ai__text">{{ t("askAiCard.text") }}</p>
      </div>
    </div>
    <div class="ask-ai__chips">
      <NuxtLink
        v-for="id in PRESETS"
        :key="id"
        :to="toAi(id)"
        class="ask-ai__chip"
        @click="handOver"
      >
        {{ t(id === "custom" ? "toolsAi.askCustom" : `toolsAi.ask_${id}`) }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { analyticsTools } from "~/composables/useAnalytics";

const props = defineProps<{ messages: unknown[]; attachments?: unknown[] }>();

// Presets that work without knowing who "I" is come first.
const PRESETS = ["effort", "better", "into", "custom"] as const;

const { t } = useI18n();
const localePath = useLocalePath();
const sharedChat = useSharedChat();

const toAi = (ask: string) =>
  localePath({
    path: "/tools/ai-chat-analyzer",
    query: { ask, source: "results" },
  });

/** Hand the chat over in memory too: sessionStorage drops large chats. */
function handOver() {
  sharedChat.value = {
    messages: props.messages,
    attachments: props.attachments ?? [],
  } as typeof sharedChat.value;
  analyticsTools.ctaClick("results", "ai");
}
</script>

<style scoped lang="scss">
.ask-ai {
  margin: 2rem auto 0;
  max-width: 760px;
  padding: 1.5rem;
  border-radius: 20px;
  background: #fff;
  border: 1px solid rgba(33, 166, 141, 0.35);

  &__head {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }

  &__title {
    font-size: 1.15rem;
    margin: 0 0 0.25rem;
  }

  &__text {
    margin: 0;
    color: #4a5568;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  &__chip {
    border: 1px solid rgba(29, 29, 31, 0.18);
    border-radius: 100px;
    padding: 0.45rem 0.9rem;
    font-size: 0.9rem;
    color: #1d1d1f;
    background: #fff;
    text-decoration: none;
    overflow-wrap: anywhere;

    &:hover,
    &:focus-visible {
      background: #1d1d1f;
      color: #fff;
    }
  }
}
</style>
