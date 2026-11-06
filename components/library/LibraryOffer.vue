<!--
  "Run this on your chat with Anna": a landing page's shortcut for a visitor
  who has a chat saved on this device. It opens that chat and takes them to
  the page that does the work, which picks the chat up without a new upload.
  Renders nothing for everyone else (and in the prerendered HTML), so put it
  next to the page's usual call to action, not instead of it.

  Props
  - to (required): where the chat should open, as a path without the locale,
    e.g. "/tools/inactivity" or "/tools/ai-chat-analyzer". Any page whose
    ToolDropzone (or the home page) restores the shared chat works.
  - query: the target's query, e.g. { ask: "worried", source: "ghosting" }
    to arrive on the AI page with a question picked.
  - hash: e.g. "#results".
  - source (required): this page's name for analytics ("library_opened"
    with this source), e.g. "landing_ghosting".
  - chatId: offer this saved chat; by default, the one opened last.
  - label: an i18n key for the button, given {name}; by default
    library.runOnChat, or library.runOnGroup for a group chat.

  Events
  - open(id): the chat is open and the page is about to navigate.

  Slot
  - default, with { chatName, chat, open }: replace the button entirely;
    call open() to go.

  Example
    <ClientOnly>
      <LibraryOffer
        to="/tools/ai-chat-analyzer"
        :query="{ ask: 'worried' }"
        source="landing_worried"
      />
    </ClientOnly>
  <ClientOnly> is optional (the offer waits for the browser anyway), but
  keeps the component out of the prerendered page entirely.
-->
<template>
  <div v-if="chat" class="library-offer">
    <slot :chat-name="name(chat)" :chat="chat" :open="open">
      <button
        type="button"
        class="library-offer__button"
        :disabled="busy"
        @click="open"
      >
        <v-icon size="20">mdi-message-text-outline</v-icon>
        <span class="library-offer__text">
          <strong>{{ t(buttonKey, { name: name(chat) }) }}</strong>
          <span class="library-offer__note">{{ t("library.offerNote") }}</span>
        </span>
        <v-icon size="20">mdi-arrow-right</v-icon>
      </button>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useLibrary, useSavedChatLabels } from "~/composables/useLibrary";

const props = withDefaults(
  defineProps<{
    to: string;
    query?: Record<string, string>;
    hash?: string;
    source: string;
    chatId?: string | null;
    label?: string | null;
  }>(),
  { query: () => ({}), hash: "", chatId: null, label: null },
);
const emit = defineEmits<{ open: [id: string] }>();

const { t } = useI18n();
const localePath = useLocalePath();
const library = useLibrary();
const { name } = useSavedChatLabels();
const sharedChat = useSharedChat();
const busy = ref(false);

const chat = computed(() =>
  library.ready.value
    ? props.chatId
      ? library.chatById(props.chatId)
      : library.lastOpened.value
    : null,
);

const buttonKey = computed(
  () =>
    props.label ??
    (chat.value?.isGroup ? "library.runOnGroup" : "library.runOnChat"),
);

async function open() {
  if (!chat.value || busy.value) return;
  busy.value = true;
  try {
    const opened = await library.open(chat.value.id, { source: props.source });
    if (!opened) return;
    // In memory, which the target's drop box restores first.
    sharedChat.value = library.toShared(opened);
    emit("open", opened.id);
    await navigateTo(
      localePath({ path: props.to, query: props.query, hash: props.hash }),
    );
  } finally {
    busy.value = false;
  }
}
</script>

<style lang="scss" scoped>
.library-offer__button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 100%;
  padding: 0.75rem 1.2rem;
  border-radius: $wa-radius-lg;
  border: 1px solid rgba(33, 166, 141, 0.5);
  background: $wa-accent-soft;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover,
  &:focus-visible {
    border-color: $wa-accent;
  }

  &:disabled {
    cursor: progress;
    opacity: 0.6;
  }
}

.library-offer__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-wrap: anywhere;
}

.library-offer__note {
  font-size: 0.8rem;
  opacity: 0.7;
}
</style>
