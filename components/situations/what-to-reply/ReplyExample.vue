<!--
  The coach's "Help me reply" (components/ai/AiCoach.vue), drawn rather than
  run: the message that came in, the reader's draft, and the calmer version
  with its "Why:" line, the shape the coach's prompt asks for. The people are
  made up, and the caption says so.
-->
<template>
  <figure class="reply-example">
    <div class="reply-example__chat">
      <p class="reply-example__from">{{ FROM }}</p>
      <p class="reply-example__incoming">
        {{ t("situationWhatToReply.exampleIncoming") }}
      </p>
    </div>

    <div class="reply-example__coach">
      <p class="reply-example__title">{{ t("toolsAi.coachTitle") }}</p>
      <!-- The real chips' labels, so the example matches what's on screen -->
      <div class="reply-example__kinds" aria-hidden="true">
        <span class="chip">{{ t("toolsAi.coach_ask") }}</span>
        <span class="chip chip--on">{{ t("toolsAi.coach_reply") }}</span>
      </div>
      <p class="bubble bubble--me">
        {{ t("situationWhatToReply.exampleDraft") }}
      </p>
      <div class="bubble">
        <p>{{ t("situationWhatToReply.exampleReply") }}</p>
        <p class="bubble__why">{{ t("situationWhatToReply.exampleWhy") }}</p>
      </div>
    </div>

    <figcaption class="reply-example__caption mono-label">
      {{ t("situationWhatToReply.exampleBadge") }}
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
const { t } = useI18n();

/** The same in every language, like the names in a real chat. */
const FROM = "Tom";
</script>

<style lang="scss" scoped>
.reply-example {
  max-width: 560px;
  margin: clamp(2rem, 5vw, 3rem) auto 0;
  text-align: left;
}

.reply-example__chat {
  background: #efeae2;
  border-radius: 20px 20px 0 0;
  padding: 1.2rem 1.2rem 1.6rem;
}

.reply-example__from {
  font-size: 0.8rem;
  font-weight: 700;
  color: $c-blue-accent-dark;
  margin-bottom: 0.3rem;
}

.reply-example__incoming {
  display: inline-block;
  max-width: 85%;
  background: #fff;
  border-radius: 0 14px 14px 14px;
  padding: 0.6rem 0.9rem;
  line-height: 1.45;
  color: #1d1d1f;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
}

// Laid out like AiCoach.vue's panel, which sits under the AI reading.
.reply-example__coach {
  display: grid;
  gap: 0.8rem;
  background: #f5f5f7;
  border-radius: 0 0 20px 20px;
  padding: 1.4rem 1.2rem;
  color: #1d1d1f;
}

.reply-example__title {
  font-size: 1.1rem;
  font-weight: 700;
}

.reply-example__kinds {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  border: 1px solid rgba(29, 29, 31, 0.18);
  border-radius: 100px;
  padding: 0.4rem 0.85rem;
  font-size: 0.85rem;
  background: #fff;

  &--on {
    background: #1d1d1f;
    border-color: #1d1d1f;
    color: #fff;
  }
}

.bubble {
  background: #fff;
  border-radius: 16px;
  padding: 0.9rem 1.1rem;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.05);
  line-height: 1.5;
  max-width: 90%;
  overflow-wrap: anywhere;

  &--me {
    justify-self: end;
    background: #e7f6f2;
  }
}

.bubble__why {
  margin-top: 0.7rem;
  font-size: 0.92rem;
  color: rgba(29, 29, 31, 0.72);
}

.reply-example__caption {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(29, 29, 31, 0.5);
}
</style>
