<template>
  <WrappedStoryContainer
    :theme="theme"
    :eyebrow="feedback || t('results.story.guess.eyebrow')"
    :title="t(`results.story.guess.${kind}.question`)"
  >
    <!-- Before the guess: the options, and the story waits. -->
    <div
      v-if="!picked"
      class="guess-options story-in"
      :class="{ 'guess-options--grid': kind === 'emoji' }"
      style="--i: 3"
    >
      <button
        v-for="option in options"
        :key="option.id"
        type="button"
        class="guess-option"
        :class="{ 'guess-option--emoji': kind === 'emoji' }"
        :data-testid="`guess-${kind}`"
        @click="pick(option.id)"
      >
        {{ option.label }}
      </button>
    </div>
    <p v-if="!picked" class="guess-skip story-in" style="--i: 6">
      {{ t("results.story.guess.skip") }}
    </p>

    <!-- After it: the answer, with the numbers behind it. -->
    <div v-else class="guess-reveal">
      <template v-if="kind === 'talker' || kind === 'funny'">
        <div class="flex w-full flex-col gap-2">
          <div
            v-for="(bar, index) in bars"
            :key="bar.name"
            class="guess-bar story-in"
            :style="{ '--i': index }"
          >
            <div class="guess-bar__head">
              <span class="guess-bar__name">
                {{ bar.short }}
                <span v-if="bar.name === picked" class="guess-bar__you">
                  {{ t("results.story.guess.yours") }}
                </span>
              </span>
              <span>{{ bar.label }}</span>
            </div>
            <div class="guess-bar__track">
              <div
                class="guess-bar__fill"
                :class="{ 'guess-bar__fill--top': index === 0 }"
                :style="{ width: `${(bar.value / bars[0].value) * 100}%` }"
              />
            </div>
          </div>
        </div>
        <p class="guess-verdict story-in" style="--i: 5">{{ verdict }}</p>
      </template>

      <template v-else-if="kind === 'emoji'">
        <div class="guess-emoji story-pop">{{ answer }}</div>
        <p class="guess-verdict story-in" style="--i: 2">
          {{
            t("results.story.guess.emoji.verdict", {
              emoji: answer,
              count: fmt(emojiRanking[0]?.count ?? 0),
            })
          }}
        </p>
        <div class="flex flex-wrap justify-center gap-2">
          <span
            v-for="(entry, index) in emojiRanking.slice(1)"
            :key="entry.emoji"
            class="story-chip story-in"
            :style="{ '--i': index + 4 }"
          >
            {{ entry.emoji }} {{ fmt(entry.count) }}
          </span>
        </div>
      </template>

      <template v-else>
        <div class="flex w-full flex-col gap-2">
          <div
            v-for="(person, index) in repliers"
            :key="person.name"
            class="guess-row story-card story-in"
            :style="{ '--i': index }"
          >
            <span class="guess-row__icon">{{ index === 0 ? "⚡" : "🐢" }}</span>
            <span class="guess-row__name">{{ person.short }}</span>
            <span class="guess-row__value">
              {{ duration(person.medianReplyMin ?? 0) }}
            </span>
          </div>
        </div>
        <p class="guess-verdict story-in" style="--i: 4">
          {{
            t("results.story.guess.replier.verdict", {
              name: repliers[0].short,
              time: duration(repliers[0].medianReplyMin ?? 0),
            })
          }}
        </p>
        <p v-if="starter" class="story-muted story-in text-sm" style="--i: 6">
          🚀
          {{
            t("results.story.guess.replier.starter", {
              name: starter.short,
              percent: Math.round(starter.startShare * 100),
            })
          }}
        </p>
      </template>
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import type { PropType } from "vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useWrappedStory } from "~/composables/useWrappedStory";
import { analyticsWrapped } from "~/composables/useAnalytics";
import { useStoryContext, useStoryControls } from "~/utils/wrapped/story";
import type { StoryTheme } from "~/components/wrapped/StoryContainer.vue";

type GuessKind = "talker" | "emoji" | "replier" | "funny";

const props = defineProps({
  kind: {
    type: String as PropType<GuessKind>,
    required: true,
  },
});

const { people, topEmojis, fmt, duration, t } = useWrappedStory();
const controls = useStoryControls();
const context = useStoryContext();

const THEMES: Record<GuessKind, StoryTheme> = {
  talker: "violet",
  emoji: "sunset",
  replier: "ocean",
  funny: "violet",
};
const theme = computed(() => THEMES[props.kind]);

/** Most messages first. */
const ranking = computed(() => people.value.slice(0, 5));
const emojiRanking = computed(() => topEmojis.value.slice(0, 4));
/** Fastest first, from the people with enough replies to say. */
const repliers = computed(() =>
  people.value
    .filter((person) => person.medianReplyMin !== null)
    .slice(0, 4)
    .sort((a, b) => (a.medianReplyMin ?? 0) - (b.medianReplyMin ?? 0)),
);
/** Most laughs caused first. */
const comedians = computed(() =>
  people.value
    .filter((person) => (person.laughsCaused ?? 0) > 0)
    .sort((a, b) => (b.laughsCaused ?? 0) - (a.laughsCaused ?? 0))
    .slice(0, 4),
);

/** The answer's numbers, as bars: messages for the talker, laughs for funny. */
const bars = computed(() =>
  props.kind === "funny"
    ? comedians.value.map((person) => ({
        name: person.name,
        short: person.short,
        value: person.laughsCaused ?? 0,
        label: `😂 ${fmt(person.laughsCaused ?? 0)}`,
      }))
    : ranking.value.map((person) => ({
        name: person.name,
        short: person.short,
        value: person.share,
        label: `${Math.round(person.share * 100)}%`,
      })),
);

const verdict = computed(() => {
  const top = props.kind === "funny" ? comedians.value[0] : ranking.value[0];
  if (!top) return "";
  if (props.kind === "talker") {
    return t("results.story.guess.talker.verdict", {
      name: top.short,
      percent: Math.round(top.share * 100),
    });
  }
  const others = people.value.filter((person) => person.name !== top.name);
  return others.length === 1
    ? t("results.story.guess.funny.verdict", {
        name: top.short,
        other: others[0].short,
        count: fmt(top.laughsCaused ?? 0),
      })
    : t("results.story.guess.funny.verdictGroup", {
        name: top.short,
        count: fmt(top.laughsCaused ?? 0),
      });
});

const starter = computed(
  () =>
    [...people.value].sort((a, b) => b.startShare - a.startShare)[0] ?? null,
);

const answer = computed(() => {
  if (props.kind === "talker") return ranking.value[0]?.name ?? "";
  if (props.kind === "emoji") return emojiRanking.value[0]?.emoji ?? "";
  if (props.kind === "funny") return comedians.value[0]?.name ?? "";
  return repliers.value[0]?.name ?? "";
});

// In an order of their own (by name, by code point): listed by rank, the
// first option would always be the answer.
const options = computed(() => {
  const list =
    props.kind === "emoji"
      ? emojiRanking.value.map((entry) => ({
          id: entry.emoji,
          label: entry.emoji,
        }))
      : (props.kind === "talker"
          ? ranking.value.slice(0, 4)
          : props.kind === "funny"
            ? comedians.value
            : repliers.value
        ).map((person) => ({ id: person.name, label: person.short }));
  return [...list].sort((a, b) => a.label.localeCompare(b.label));
});

// Kept on the story, so stepping back to this slide shows the answer again.
const picked = ref<string | null>(context?.guesses[props.kind]?.picked ?? null);

const feedback = computed(() => {
  if (!picked.value) return "";
  return picked.value === answer.value
    ? t("results.story.guess.right")
    : t("results.story.guess.wrong");
});

function pick(option: string) {
  picked.value = option;
  const right = option === answer.value;
  if (context) context.guesses[props.kind] = { picked: option, right };
  analyticsWrapped.guessAnswered(props.kind, right);
  controls.resume("guess");
}

onMounted(() => {
  if (!picked.value) controls.pause("guess");
});
onBeforeUnmount(() => controls.resume("guess"));
</script>

<style scoped>
.guess-options {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  max-width: 15rem;
  margin-top: 0.75rem;
}

.guess-options--grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 12.5rem;
}

.guess-option {
  padding: 0.85rem 1rem;
  border-radius: 1.1rem;
  background: var(--s-fg);
  color: #16102e;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.1;
  cursor: pointer;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.22);
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
  overflow-wrap: anywhere;
}

.guess-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.22);
}

.guess-option:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.22);
}

.guess-option--emoji {
  aspect-ratio: 1;
  padding: 0;
  font-size: 2.6rem;
}

.guess-skip {
  margin: 0.9rem 0 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--s-muted);
}

.guess-reveal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 17rem;
  margin-top: 0.5rem;
}

.guess-bar__head {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 800;
}

.guess-bar__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guess-bar__you {
  margin-left: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--s-muted);
}

.guess-bar__track {
  height: 0.9rem;
  margin-top: 0.25rem;
  border-radius: 9999px;
  background: var(--s-card);
  overflow: hidden;
}

.guess-bar__fill {
  height: 100%;
  border-radius: 9999px;
  background: var(--s-fg);
  transform-origin: left;
  animation: guess-grow 0.9s cubic-bezier(0.2, 0.9, 0.3, 1) both;
}

.guess-bar__fill--top {
  background: var(--s-accent);
}

.guess-verdict {
  margin: 0.25rem 0 0;
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.2;
}

.guess-emoji {
  font-size: 5.5rem;
  line-height: 1.1;
}

.guess-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  font-weight: 800;
}

.guess-row__icon {
  font-size: 1.4rem;
}

.guess-row__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guess-row__value {
  color: var(--s-accent);
  font-size: 1.15rem;
  font-weight: 900;
  white-space: nowrap;
}

@keyframes guess-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .guess-bar__fill {
    animation: none;
  }
}
</style>
