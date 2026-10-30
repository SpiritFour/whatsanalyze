<template>
  <div class="coach">
    <h3 class="coach__title">{{ t("toolsAi.coachTitle") }}</h3>
    <p class="coach__text">{{ t("toolsAi.coachText") }}</p>

    <div class="coach__kinds" role="radiogroup">
      <button
        v-for="option in kinds"
        :key="option"
        type="button"
        role="radio"
        class="chip"
        :class="{ 'chip--on': kind === option }"
        :aria-checked="kind === option"
        @click="kind = option"
      >
        {{ t(`toolsAi.coach_${option}`) }}
      </button>
    </div>

    <div v-for="(turn, i) in turns" :key="i" class="coach__turn">
      <p class="coach__bubble coach__bubble--me">{{ turn.shown }}</p>
      <div
        v-if="turn.support"
        class="coach__bubble coach__bubble--support"
        role="alert"
      >
        <strong>{{ t("toolsAi.coachSupportTitle") }}</strong>
        <p>{{ t("toolsAi.coachSupportText") }}</p>
      </div>
      <p v-else-if="turn.answer" class="coach__bubble">{{ turn.answer }}</p>
    </div>

    <div v-if="thinking" class="coach__thinking" role="status">
      <v-progress-linear indeterminate color="#21a68d" rounded />
      <p>{{ t("toolsAi.coachThinking") }}</p>
    </div>
    <p v-if="errorKey" class="coach__error" role="alert">
      <v-icon size="18">mdi-alert-circle-outline</v-icon>
      {{ t(`toolsAi.error_${errorKey}`) }}
    </p>

    <form class="coach__form" @submit.prevent="send">
      <textarea
        v-model="draft"
        class="coach__input"
        rows="3"
        :maxlength="MAX_COACH_CHARS"
        :aria-label="t(`toolsAi.coachPlaceholder_${kind}`)"
        :placeholder="t(`toolsAi.coachPlaceholder_${kind}`)"
      />
      <button
        type="submit"
        class="coach__send"
        :disabled="thinking || !draft.trim()"
      >
        {{ t("toolsAi.coachSend") }}
      </button>
    </form>
    <p class="coach__note mono-label">
      {{
        t(
          mode === "cloud"
            ? "toolsAi.coachNoteCloud"
            : "toolsAi.coachNoteLocal",
        )
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { ChatMessage } from "~/composables/useChatTool";
import { analyticsTools } from "~/composables/useAnalytics";
import { useSubscriptionStore } from "~/stores/subscription";
import { buildDigest, restoreNames } from "~/utils/ai/digest";
import { isSafetyReply, needsSupport } from "~/utils/ai/coach";
import {
  coachLocally,
  localCoachChars,
  reportLocalFailure,
  type LocalModel,
} from "~/utils/ai/localModel";
import { coachInCloud, type CloudAllowance } from "~/utils/ai/cloudModel";
import {
  CLOUD_TRANSCRIPT_CHARS,
  MAX_COACH_CHARS,
  MAX_COACH_REPLY_CHARS,
  type AiLanguage,
  type CoachKind,
  type CoachTurn,
} from "~/functions/src/ai/insights";

/**
 * Follow-ups after an AI report: questions about the chat, or a draft reply
 * to make calmer and clearer. Runs where the report ran. Like the report,
 * the model only ever sees placeholders; real names come back on screen.
 */
const props = defineProps<{
  chat: ChatMessage[];
  mode: "local" | "cloud";
  language: AiLanguage;
  localModel: LocalModel | null;
  /** The reader's real name, if they said which participant they are. */
  me: string | null;
  /** The report's summary, with real names; anonymized before sending. */
  summary: string;
}>();
const emit = defineEmits<{ allowance: [CloudAllowance] }>();

const { t } = useI18n();
const subscriptionStore = useSubscriptionStore();

const kinds: CoachKind[] = ["ask", "reply"];
const kind = ref<CoachKind>("ask");
const draft = ref("");
const thinking = ref(false);
const errorKey = ref<string | null>(null);

interface Turn {
  shown: string;
  /** What the model saw and said, in placeholders, for the next turn. */
  sent: string;
  reply?: string;
  answer?: string;
  support?: boolean;
}
const turns = ref<Turn[]>([]);

// Built once per chat: the same excerpts and placeholders every turn.
const anonymized = computed(() =>
  buildDigest(
    props.chat,
    props.mode === "cloud"
      ? CLOUD_TRANSCRIPT_CHARS
      : localCoachChars(props.localModel!),
  ),
);

async function send() {
  const text = draft.value.trim();
  if (!text || thinking.value) return;
  errorKey.value = null;
  analyticsTools.aiCoachMessage(props.mode, kind.value);

  if (needsSupport(text)) {
    turns.value.push({
      shown: text,
      sent: "",
      support: true,
    });
    draft.value = "";
    analyticsTools.aiCoachSafety("keywords");
    return;
  }

  const { digest, names, anonymize } = anonymized.value;
  const turn: Turn = {
    shown: text,
    sent: anonymize(text).slice(0, MAX_COACH_CHARS),
  };
  // Earlier exchanges that got an answer; a support handover is left out.
  const history: CoachTurn[] = [
    ...turns.value
      .filter((x) => x.reply)
      .flatMap((x): CoachTurn[] => [
        { role: "user", content: x.sent },
        { role: "assistant", content: x.reply! },
      ]),
    { role: "user", content: turn.sent },
  ];
  const options = {
    me: Object.keys(names).find((alias) => names[alias] === props.me),
    context: anonymize(props.summary).slice(0, MAX_COACH_REPLY_CHARS),
  };

  thinking.value = true;
  try {
    let reply: string;
    if (props.mode === "cloud") {
      const cloud = await coachInCloud(
        useNuxtApp().$functions,
        {
          email: subscriptionStore.getEmail!,
          subscriptionId: subscriptionStore.getSubscriptionId!,
        },
        {
          digest,
          language: props.language,
          kind: kind.value,
          history,
          ...options,
        },
      );
      reply = cloud.reply;
      emit("allowance", cloud.allowance);
    } else {
      reply = await coachLocally(
        props.localModel!,
        digest,
        props.language,
        kind.value,
        history,
        options,
        () => {},
      );
    }
    if (isSafetyReply(reply)) {
      turn.support = true;
      analyticsTools.aiCoachSafety("model");
    } else {
      turn.reply = reply.slice(0, MAX_COACH_REPLY_CHARS);
      turn.answer = restoreNames(reply, names);
    }
    turns.value.push(turn);
    draft.value = "";
  } catch (err: any) {
    const known = ["not_subscribed", "daily_limit"];
    errorKey.value = known.includes(err?.message) ? err.message : props.mode;
    analyticsTools.error(
      "ai",
      `coach_${props.mode}:${err?.message ?? "unknown"}`,
    );
    if (props.mode === "local") {
      reportLocalFailure(
        String(err?.message ?? "unknown"),
        props.localModel?.id,
        "coach",
      );
    }
  } finally {
    thinking.value = false;
  }
}
</script>

<style scoped lang="scss">
.coach {
  text-align: left;
  display: grid;
  gap: 0.8rem;
  margin-top: 1.5rem;
  color: #1d1d1f;

  &__title {
    font-size: 1.2rem;
    font-weight: 700;
  }

  &__kinds {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__turn {
    display: grid;
    gap: 0.5rem;
  }

  &__bubble {
    background: #fff;
    border-radius: 16px;
    padding: 0.9rem 1.1rem;
    box-shadow: 0 4px 22px rgba(0, 0, 0, 0.05);
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    max-width: 90%;

    &--me {
      justify-self: end;
      background: #e7f6f2;
    }

    &--support {
      border-left: 4px solid #b45309;

      p {
        margin-top: 0.4rem;
      }
    }
  }

  &__thinking p,
  &__note {
    font-size: 0.85rem;
    color: rgba(29, 29, 31, 0.65);
  }

  &__error {
    color: #b91c1c;
  }

  &__form {
    display: grid;
    gap: 0.6rem;
  }

  &__input {
    width: 100%;
    border: 1px solid rgba(29, 29, 31, 0.2);
    border-radius: 12px;
    padding: 0.7rem 0.9rem;
    font: inherit;
    color: #1d1d1f;
    background: #fff;
  }

  &__send {
    justify-self: start;
    background: #1d1d1f;
    color: #fff;
    font-weight: 600;
    border-radius: 100px;
    padding: 0.8rem 1.4rem;

    &:disabled {
      opacity: 0.5;
    }
  }
}

.chip {
  border: 1px solid rgba(29, 29, 31, 0.18);
  border-radius: 100px;
  padding: 0.45rem 0.9rem;
  font-size: 0.9rem;
  color: #1d1d1f;
  background: #fff;

  &--on {
    background: #1d1d1f;
    border-color: #1d1d1f;
    color: #fff;
  }
}
</style>
