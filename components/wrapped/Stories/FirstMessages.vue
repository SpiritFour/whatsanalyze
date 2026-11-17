<template>
  <WrappedStoryContainer
    theme="ocean"
    :eyebrow="firstDay"
    :title="t('results.intro.firstMessagesTitle')"
  >
    <div class="mt-3 flex w-full max-w-sm flex-col gap-3">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="first-bubble story-in"
        :class="index % 2 ? 'first-bubble--right' : 'first-bubble--left'"
        :style="{ '--i': index * 3 + 2 }"
      >
        <div class="first-bubble__meta">
          <span class="first-bubble__author">{{ message.author }}</span>
          <span>{{ message.time }}</span>
        </div>
        <p class="first-bubble__text">{{ message.text }}</p>
      </div>
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useWrappedStory } from "~/composables/useWrappedStory";
import { shortName } from "~/utils/wrapped/story";

const { result, locale, t } = useWrappedStory();

// A photo as the year's first message exports as a placeholder in angle
// brackets, in the phone's language.
const MEDIA = /^‎?<[^>]+>$/;

const sorted = computed(() =>
  [...Object.values(result.value?.getFirstMessages ?? {})]
    .map((message) => ({ ...message, date: new Date(message.date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    // A group's first messages do not fit on one card.
    .slice(0, 3),
);

const messages = computed(() =>
  sorted.value.map((message) => ({
    author: shortName(message.author ?? ""),
    time: new Intl.DateTimeFormat(locale.value, {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(message.date),
    text: MEDIA.test(message.message.trim()) ? "📎" : message.message,
  })),
);

const firstDay = computed(() => {
  const first = sorted.value[0];
  if (!first) return "";
  return new Intl.DateTimeFormat(locale.value, {
    day: "numeric",
    month: "long",
  }).format(first.date);
});
</script>

<style scoped>
.first-bubble {
  max-width: 88%;
  padding: 0.65rem 0.9rem 0.75rem;
  border-radius: 1.15rem;
  text-align: left;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.first-bubble--left {
  align-self: flex-start;
  border-bottom-left-radius: 0.3rem;
  background: #ffffff;
  color: #0b2230;
}

.first-bubble--right {
  align-self: flex-end;
  border-bottom-right-radius: 0.3rem;
  background: #d9fdd3;
  color: #0b2230;
}

.first-bubble__meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.68rem;
  opacity: 0.65;
}

.first-bubble__author {
  font-weight: 800;
}

.first-bubble__text {
  margin: 0.2rem 0 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  overflow: hidden;
}
</style>
