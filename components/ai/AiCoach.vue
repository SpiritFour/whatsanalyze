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

    <p v-if="needsMe && !sample" class="coach__hint">
      {{ t("toolsAi.coachPickMe") }}
    </p>
    <!-- The sample chat: its answers were made in advance, so these instead
         of a box anything could be typed into -->
    <div v-if="sample" class="coach__suggestions">
      <p class="coach__text">{{ t("toolsAi.coachSampleIntro") }}</p>
      <button
        v-for="turn in sampleTurns"
        :key="turn.id"
        type="button"
        class="coach__suggestion"
        :disabled="thinking || asked.has(turn.id)"
        @click="askSample(turn)"
      >
        <span v-if="turn.kind === 'reply' && turn.me" class="mono-label">
          {{ t("toolsAi.coachSampleDraft", { name: turn.me }) }}
        </span>
        {{ turn.prompt }}
      </button>
    </div>
    <form v-else class="coach__form" @submit.prevent="send">
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
      {{ note }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { ChatMessage } from "~/composables/useChatTool";
import { useLibrary } from "~/composables/useLibrary";
import { rememberLocalAiFailure } from "~/utils/library/device";
import { localErrorKey } from "~/utils/ai/localErrors";
import { analyticsTools } from "~/composables/useAnalytics";
import { useSubscriptionStore } from "~/stores/subscription";
import { buildDigest, readerText, restoreNames } from "~/utils/ai/digest";
import {
  isSafetyReply,
  isUnchangedRewrite,
  needsSupport,
} from "~/utils/ai/coach";
import {
  coachLocally,
  localCoachChars,
  reportLocalFailure,
  type LocalModel,
} from "~/utils/ai/localModel";
import { coachInCloud, type CloudAllowance } from "~/utils/ai/cloudModel";
import { SAMPLE_COACH_MS, type SampleCoachTurn } from "~/utils/ai/sample";
import { callableErrorCode } from "~/utils/ai/cloudErrors";
import {
  CLOUD_TRANSCRIPT_CHARS,
  MAX_BACKGROUND_CHARS,
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
  /**
   * What the reader said the chat doesn't show, as typed for the report:
   * the coach is told the same, anonymized the same way.
   */
  background?: string;
  /**
   * After a free cloud preview: no subscription, so each cloud reply is one
   * of the few free ones a visitor gets a day.
   */
  free?: boolean;
  /**
   * The sample chat's questions and drafts, answered in advance: offered to
   * try instead of the text box, and shown without asking the AI again.
   */
  sample?: SampleCoachTurn[] | null;
  /** Which kind is picked to start with: reply help, for "What should I reply?". */
  initialKind?: CoachKind;
}>();
const emit = defineEmits<{ allowance: [CloudAllowance] }>();

const { t } = useI18n();
const subscriptionStore = useSubscriptionStore();

/**
 * Reply help without knowing who the reader is: the model guesses whose
 * side the draft is from, and in testing it guessed wrong. Ask instead.
 */
const needsMe = computed(
  () =>
    kind.value === "reply" &&
    !props.me &&
    new Set(props.chat.map((m) => m.author).filter(Boolean)).size > 1,
);

/** Free replies left today, once the first free reply has said. */
const freeLeft = ref<number | null>(null);
const note = computed(() => {
  if (props.sample) return t("toolsAi.coachNoteSample");
  if (props.mode !== "cloud") return t("toolsAi.coachNoteLocal");
  if (!props.free) return t("toolsAi.coachNoteCloud");
  return freeLeft.value === null
    ? t("toolsAi.coachNoteFree")
    : t("toolsAi.coachNoteFreeLeft", { n: freeLeft.value });
});

const kinds: CoachKind[] = ["ask", "reply"];
const kind = ref<CoachKind>(props.initialKind ?? "ask");
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

// A saved chat keeps the conversation that goes with each reading, so it is
// still here after a reload or on the next visit.
const library = useLibrary();
onMounted(async () => {
  const kept = await library.coachTurns(props.chat, props.summary);
  if (kept?.length && !turns.value.length) turns.value = kept as Turn[];
});
const keepTurns = () =>
  void library.keepCoachTurns(props.chat, props.summary, turns.value);

// Built once per chat: the same excerpts and placeholders every turn.
const anonymized = computed(() =>
  buildDigest(
    props.chat,
    props.mode === "cloud"
      ? CLOUD_TRANSCRIPT_CHARS
      : localCoachChars(props.localModel!),
  ),
);

/** The sample's suggestions for the kind picked, and which were tried. */
const sampleTurns = computed(
  () => props.sample?.filter((turn) => turn.kind === kind.value) ?? [],
);
const asked = ref(new Set<string>());

/** A sample suggestion: asked, a moment to think, its answer. */
async function askSample(turn: SampleCoachTurn) {
  if (thinking.value) return;
  errorKey.value = null;
  analyticsTools.aiCoachMessage("sample", turn.kind, false);
  asked.value.add(turn.id);
  const index = turns.value.push({ shown: turn.prompt, sent: "" }) - 1;
  thinking.value = true;
  await new Promise((resolve) => setTimeout(resolve, SAMPLE_COACH_MS));
  thinking.value = false;
  turns.value[index].answer = turn.reply;
}

async function send() {
  const text = draft.value.trim();
  if (!text || thinking.value) return;
  errorKey.value = null;
  analyticsTools.aiCoachMessage(
    props.mode,
    kind.value,
    !!props.background?.trim(),
  );

  if (needsSupport(text)) {
    turns.value.push({
      shown: text,
      sent: "",
      support: true,
    });
    keepTurns();
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
    background: readerText(anonymize, props.background, MAX_BACKGROUND_CHARS),
  };

  thinking.value = true;
  try {
    let reply: string;
    if (props.mode === "cloud") {
      const cloud = await coachInCloud(
        useNuxtApp().$functions,
        props.free
          ? null
          : {
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
      if (cloud.free) freeLeft.value = cloud.allowance.remaining;
      else emit("allowance", cloud.allowance);
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
      // The small model can hand the draft back word for word and explain a
      // change it never made: say so, and keep the draft to try again.
      if (
        kind.value === "reply" &&
        !isSafetyReply(reply) &&
        isUnchangedRewrite(reply, turn.sent)
      ) {
        errorKey.value = "coach_local_unchanged";
        analyticsTools.error("ai", "coach_local:unchanged");
        return;
      }
    }
    if (isSafetyReply(reply)) {
      turn.support = true;
      analyticsTools.aiCoachSafety("model");
    } else {
      turn.reply = reply.slice(0, MAX_COACH_REPLY_CHARS);
      turn.answer = restoreNames(reply, names);
    }
    turns.value.push(turn);
    keepTurns();
    draft.value = "";
  } catch (err: any) {
    const known = [
      "not_subscribed",
      "daily_limit",
      "coach_free_used",
      "preview_cap",
    ];
    const code = callableErrorCode(err?.message);
    errorKey.value = known.includes(code) ? code : props.mode;
    if (code === "coach_free_used") freeLeft.value = 0;
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
      rememberLocalAiFailure({
        reason: localErrorKey(String(err?.message ?? "")),
        model: props.localModel?.id,
        phase: "coach",
      });
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

  &__hint {
    font-size: 0.9rem;
    color: #b45309;
  }

  &__error {
    color: #b91c1c;
  }

  &__form,
  &__suggestions {
    display: grid;
    gap: 0.6rem;
  }

  &__suggestion {
    display: grid;
    gap: 0.2rem;
    text-align: left;
    border: 1px solid rgba(29, 29, 31, 0.18);
    border-radius: 14px;
    padding: 0.7rem 0.9rem;
    background: #fff;
    color: #1d1d1f;

    &:disabled {
      opacity: 0.5;
    }
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
