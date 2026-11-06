<template>
  <section
    v-if="people.length === 2 && canSendReading(report)"
    class="send"
    aria-labelledby="send-title"
  >
    <h3 id="send-title" class="send__title">
      {{
        parties
          ? t("toolsAi.sendTitle", { name: parties.to })
          : t("toolsAi.sendTitleAnyone")
      }}
    </h3>
    <p>{{ t("toolsAi.sendText") }}</p>

    <template v-if="!preview">
      <!-- The reading wasn't written to anyone, so it doesn't know who is
           sending it. Asked here, not on the page: a reading made knowing
           who "I" am is written to "you", and can't be sent. -->
      <div class="send__who">
        <p class="send__label">{{ t("toolsAi.sendWho") }}</p>
        <div
          class="send__chips"
          role="radiogroup"
          :aria-label="t('toolsAi.sendWho')"
        >
          <button
            v-for="person in people"
            :key="person"
            type="button"
            role="radio"
            class="send__chip"
            :class="{ 'send__chip--on': from === person }"
            :aria-checked="from === person"
            @click="from = person"
          >
            {{ person }}
          </button>
        </div>
      </div>
      <UiButton :disabled="!parties" :loading="busy" @click="prepare">
        {{
          busy
            ? t("toolsAi.sendPreparing")
            : parties
              ? t("toolsAi.sendButton", { name: parties.to })
              : t("toolsAi.sendButtonAnyone")
        }}
      </UiButton>
      <p v-if="failed" class="send__error" role="alert">
        {{ t("shareLinkError") }}
      </p>
    </template>

    <!-- Exactly what the other person gets, before anything is sent -->
    <div v-else-if="parties" class="send-preview">
      <p class="mono-label send-preview__label">
        {{ t("toolsAi.sendPreviewMessage", { name: parties.to }) }}
      </p>
      <p class="send-preview__bubble">{{ preview.message }}</p>
      <p class="mono-label send-preview__label">
        {{ t("toolsAi.sendPreviewPage", { name: parties.to }) }}
      </p>
      <div
        class="send-preview__page"
        tabindex="0"
        :aria-label="t('toolsAi.sendPreviewPage', { name: parties.to })"
      >
        <AiSentReading :report="preview.payload" :from="parties.from" preview />
      </div>

      <div class="send-preview__actions">
        <UiButton
          :href="preview.whatsApp"
          target="_blank"
          rel="noopener noreferrer"
          @click="onSent"
        >
          {{ t("toolsAi.sendWhatsApp") }}
        </UiButton>
        <UiButton variant="ghost" @click="back">
          {{ t("toolsAi.sendBack") }}
        </UiButton>
      </div>
      <p v-if="sent" class="send__done" role="status">
        {{ t("toolsAi.sendDone", { name: parties.to }) }}
      </p>
      <p class="send__fineprint">{{ t("toolsAi.sendFineprint") }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import * as Sentry from "@sentry/nuxt";
import AiSentReading from "~/components/ai/AiSentReading.vue";
import type { AiReport } from "~/utils/ai/report";
import { analyticsTools } from "~/composables/useAnalytics";
import { buildShareLinkUrl } from "~/utils/social/shareLink";
import { storeSharedAnalysis } from "~/utils/social/shareLinkStore";
import {
  canSendReading,
  readingToSend,
  sendParties,
  sentQuestion,
  whatsAppLink,
} from "~/utils/ai/sendReading";

/**
 * "Send this to Leo": a reading about the two of them, sent to the other
 * person in the chat through WhatsApp, as the same encrypted link as any
 * other share (utils/social/shareLink.js). The sender sees the message and
 * the page it opens, exactly as they'll arrive, before anything is sent.
 */
const props = defineProps<{
  report: AiReport;
  /** The chat's participants: only a chat between two has another person. */
  people: string[];
  /** Who the reader said they are, if they did. */
  me: string | null;
}>();
const { t } = useI18n();
const localePath = useLocalePath();

const from = ref<string | null>(
  props.me && props.people.includes(props.me) ? props.me : null,
);
const parties = computed(() => sendParties(props.people, from.value));

const busy = ref(false);
const failed = ref(false);
const sent = ref(false);
const preview = shallowRef<{
  payload: AiReport;
  message: string;
  whatsApp: string;
} | null>(null);
/** One link per sender, so going back and forth doesn't store another. */
const links = new Map<string, string>();

const question = computed(() => sentQuestion(props.report));

async function prepare() {
  const who = parties.value;
  if (!who || busy.value) return;
  busy.value = true;
  failed.value = false;
  try {
    const payload = readingToSend(props.report, who.from) as AiReport;
    let link = links.get(who.from);
    if (!link) {
      link = buildShareLinkUrl(
        window.location.origin,
        localePath("/s"),
        await storeSharedAnalysis(payload),
      );
      links.set(who.from, link);
    }
    const message = t(
      question.value === "better"
        ? "toolsAi.sendMessageBetter"
        : "toolsAi.sendMessageNone",
      { link },
    );
    preview.value = { payload, message, whatsApp: whatsAppLink(message) };
    sent.value = false;
    analyticsTools.aiSharePreviewed(question.value);
  } catch (error) {
    console.error("Could not create the link to send", error);
    Sentry.captureException(error);
    failed.value = true;
  } finally {
    busy.value = false;
  }
}

function onSent() {
  sent.value = true;
  analyticsTools.aiShareSent(question.value);
}

function back() {
  preview.value = null;
  sent.value = false;
}
</script>

<style scoped lang="scss">
.send {
  display: grid;
  gap: 0.9rem;
  justify-items: start;
  padding: 1.4rem 1.3rem;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(33, 166, 141, 0.35);
  color: #1d1d1f;
  line-height: 1.5;

  p {
    margin: 0;
  }
}

.send__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.send__who {
  display: grid;
  gap: 0.5rem;
}

.send__label {
  font-weight: 600;
  font-size: 0.92rem;
}

.send__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.send__chip {
  border: 1px solid rgba(29, 29, 31, 0.18);
  border-radius: 100px;
  padding: 0.45rem 0.9rem;
  font-size: 0.9rem;
  color: #1d1d1f;
  background: #fff;
  overflow-wrap: anywhere;

  &--on {
    background: #1d1d1f;
    border-color: #1d1d1f;
    color: #fff;
  }
}

.send__error {
  color: #d93b3b;
  font-size: 0.9rem;
}

.send__done {
  color: #127a67;
  font-weight: 600;
}

.send__fineprint {
  font-size: 0.82rem;
  color: rgba(29, 29, 31, 0.55);
}

.send-preview {
  display: grid;
  gap: 0.7rem;
  width: 100%;
  min-width: 0;
}

.send-preview__label {
  color: rgba(29, 29, 31, 0.62);
}

// A WhatsApp message, roughly as the other person's phone will show it
.send-preview__bubble {
  justify-self: start;
  max-width: 34rem;
  padding: 0.7rem 0.9rem;
  border-radius: 12px 12px 12px 4px;
  background: #dcf8c6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.send-preview__page {
  max-height: 32rem;
  overflow: auto;
  padding: 1.2rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(29, 29, 31, 0.12);
  background: #f5f5f7;
}

.send-preview__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
}
</style>
