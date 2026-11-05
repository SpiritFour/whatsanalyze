<template>
  <!-- Under every drop box, wherever a chat is open: whether it is kept on
       this device, with the way out one tap away (docs/saved-chats.md,
       "Safety"). Nothing until the answer is known, so it never flickers
       from "Not kept" to "Saved" while a save is under way. -->
  <p
    v-if="state"
    class="library-status"
    :class="`library-status--${state}`"
    role="status"
  >
    <template v-if="state === 'saved'">
      <button
        type="button"
        class="library-status__chip"
        :title="t('library.panelOpen')"
        @click="openPanel(savedId)"
      >
        <v-icon size="16" color="#21a68d">mdi-shield-check-outline</v-icon>
        {{ t("library.saved") }}
      </button>
      <span class="library-status__sep" aria-hidden="true">·</span>
      <button
        type="button"
        class="library-status__action"
        :disabled="busy"
        @click="dontKeep"
      >
        {{ t("library.dontKeep") }}
      </button>
    </template>
    <template v-else>
      <span class="library-status__chip library-status__chip--off">
        <v-icon size="16">mdi-shield-alert-outline</v-icon>
        {{ t("library.notKept") }}
      </span>
      <template v-if="state === 'not_kept' && messages?.length">
        <span class="library-status__sep" aria-hidden="true">·</span>
        <button
          type="button"
          class="library-status__action"
          :disabled="busy"
          @click="keepAgain"
        >
          {{ t("library.keep") }}
        </button>
      </template>
      <span v-else-if="state !== 'not_kept'" class="library-status__why">
        {{
          t(
            state === "quota"
              ? "library.notKeptFull"
              : "library.notKeptUnavailable",
          )
        }}
      </span>
    </template>
  </p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ChatMessage, ChatSource } from "~/composables/useChatTool";
import { useLibrary } from "~/composables/useLibrary";

const props = withDefaults(
  defineProps<{
    /** The chat on screen, as parsed. */
    messages?: ChatMessage[] | null;
    /** Its export, so "Keep" can save it again under the same name. */
    source?: ChatSource | null;
    sourceName?: string | null;
    /** The sample chat is never kept, and says nothing about it. */
    sample?: boolean;
    /** Where the chat is on screen, for analytics: "home", "tool_ai", … */
    surface: string;
    /** A saved chat shown without its messages, like a Wrapped story. */
    chatId?: string | null;
  }>(),
  {
    messages: null,
    source: null,
    sourceName: null,
    sample: false,
    chatId: null,
  },
);

const { t } = useI18n();
const library = useLibrary();
const { ready, available, openPanel } = library;
const busy = ref(false);

// A chat shown by id stays the chat this line is about after "Don't keep"
// takes it out of the list.
const shownId = ref(props.chatId);
watch(
  () => props.chatId,
  (id) => {
    if (id) shownId.value = id;
  },
);

const savedId = computed(() => {
  if (shownId.value && library.chatById(shownId.value)) return shownId.value;
  return library.idFor(props.messages);
});

const state = computed(() => {
  if (props.sample || !ready.value) return null;
  if (!props.messages?.length && !shownId.value) return null;
  if (savedId.value) return "saved";
  if (library.isPending(props.messages)) return null;
  const failure = library.failureFor(props.messages);
  if (failure === "quota") return "quota";
  if (failure === "unavailable" || available.value === false) {
    return "unavailable";
  }
  return "not_kept";
});

async function dontKeep() {
  if (!savedId.value) return;
  busy.value = true;
  try {
    await library.dontKeep(savedId.value, { source: props.surface });
  } finally {
    busy.value = false;
  }
}

async function keepAgain() {
  if (!props.messages?.length) return;
  busy.value = true;
  try {
    const id = await library.keep(
      {
        messages: props.messages,
        source: props.source,
        sourceName: props.sourceName,
      },
      { source: props.surface },
    );
    if (id) shownId.value = id;
  } finally {
    busy.value = false;
  }
}
</script>

<style lang="scss" scoped>
// The page's own text colour, like the spec line above the box: this sits on
// the dark hero and on white sections alike.
.library-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.35rem 0.5rem;
  margin: 0.9rem 0 0;
  font-size: 0.85rem;
  color: inherit;
  text-align: center;
}

.library-status__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  border-radius: $wa-radius-pill;
  border: 1px solid rgba(127, 127, 127, 0.35);
  background: rgba(127, 127, 127, 0.1);
  color: inherit;
  font-weight: 600;

  &:is(button) {
    cursor: pointer;

    &:hover,
    &:focus-visible {
      border-color: $wa-accent;
    }
  }

  &--off {
    opacity: 0.85;
  }
}

.library-status__sep {
  opacity: 0.5;
}

.library-status__action {
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  opacity: 0.85;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    opacity: 1;
  }

  &:disabled {
    cursor: progress;
    opacity: 0.5;
  }
}

.library-status__why {
  flex-basis: 100%;
  font-size: 0.8rem;
  opacity: 0.7;
}
</style>
