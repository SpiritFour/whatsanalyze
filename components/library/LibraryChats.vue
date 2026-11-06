<template>
  <!-- "Your chats", above the upload box for a returning visitor. Rendered
       in the browser only (the page wraps it in <ClientOnly>), so the
       prerendered page search engines read stays the same. -->
  <section
    v-if="ready && chats.length"
    class="library-chats"
    aria-labelledby="library-chats-title"
  >
    <header class="library-chats__head">
      <h2 id="library-chats-title" class="library-chats__title">
        {{ t("library.yourChats") }}
      </h2>
      <button type="button" class="library-chats__chip" @click="openPanel()">
        <v-icon size="16" color="#21a68d">mdi-shield-check-outline</v-icon>
        {{ t("library.saved") }}
      </button>
    </header>

    <ul class="library-chats__list">
      <li v-for="chat in shown" :key="chat.id" class="library-chats__item">
        <template v-if="confirming !== chat.id">
          <div class="library-chats__info">
            <strong class="library-chats__name">{{ name(chat) }}</strong>
            <span class="library-chats__meta">
              {{ [people(chat), range(chat)].filter(Boolean).join(" · ") }}
            </span>
            <span class="library-chats__meta library-chats__meta--faint">
              {{ openedAgo(chat) }}
            </span>
          </div>
          <div class="library-chats__actions">
            <button
              type="button"
              class="library-chats__open"
              :disabled="busy !== null"
              @click="open(chat)"
            >
              {{ t("library.open") }}
            </button>
            <button
              v-if="continueIn(chat)"
              type="button"
              class="library-chats__link"
              :disabled="busy !== null"
              @click="open(chat, continueIn(chat)!.path)"
            >
              {{ t("library.continueIn", { tool: continueIn(chat)!.title }) }}
            </button>
            <button
              type="button"
              class="library-chats__link library-chats__link--quiet"
              @click="confirming = chat.id"
            >
              {{ t("library.forget") }}
            </button>
          </div>
        </template>
        <div v-else class="library-chats__confirm" role="group">
          <span>{{ t("library.forgetConfirm", { name: name(chat) }) }}</span>
          <button
            type="button"
            class="library-chats__forget"
            @click="forget(chat)"
          >
            {{ t("library.forget") }}
          </button>
          <button
            type="button"
            class="library-chats__link"
            @click="confirming = null"
          >
            {{ t("library.cancel") }}
          </button>
        </div>
      </li>
    </ul>

    <button
      v-if="chats.length > LIMIT && !showAll"
      type="button"
      class="library-chats__link library-chats__more"
      @click="showAll = true"
    >
      {{ t("library.showAll", { count: chats.length }) }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { cleanPath } from "~/utils/cleanPath";
import {
  useLibrary,
  useSavedChatLabels,
  type OpenedChat,
  type SavedChat,
} from "~/composables/useLibrary";

const emit = defineEmits<{ open: [chat: OpenedChat] }>();

/** Rows shown before "Show all". */
const LIMIT = 5;

const { t } = useI18n();
const localePath = useLocalePath();
const library = useLibrary();
const { chats, ready, openPanel } = library;
const { name, people, range, openedAgo } = useSavedChatLabels();
const { allTools } = useToolsNav();
const sharedChat = useSharedChat();

const showAll = ref(false);
const shown = computed(() =>
  showAll.value ? chats.value : chats.value.slice(0, LIMIT),
);
const confirming = ref<string | null>(null);
const busy = ref<string | null>(null);

/** Where "Continue" leads: the tool this chat was last used in, if any. */
function continueIn(chat: SavedChat) {
  if (!chat.lastTool || chat.lastTool === "/") return null;
  if (chat.lastTool === "/wrapped/") {
    return { path: "/wrapped", title: "Wrapped" };
  }
  const tool = allTools.value.find(
    (item) => cleanPath(item.to) === chat.lastTool,
  );
  return tool ? { path: chat.lastTool, title: tool.title } : null;
}

/**
 * Open a saved chat: its results here, or the tool it was last used in,
 * which picks it up from memory without a new upload.
 */
async function open(chat: SavedChat, path?: string) {
  busy.value = chat.id;
  try {
    const opened = await library.open(chat.id, { source: "home_list" });
    if (!opened) return;
    if (!path) {
      emit("open", opened);
      return;
    }
    sharedChat.value = library.toShared(opened);
    await navigateTo(localePath(path));
  } finally {
    busy.value = null;
  }
}

async function forget(chat: SavedChat) {
  confirming.value = null;
  const { wasOpen } = await library.forget(chat.id);
  // It was on screen too: start this page over without it.
  if (wasOpen) window.location.reload();
}
</script>

<style lang="scss" scoped>
// On the dark hero, above the upload box.
.library-chats {
  margin: 0 auto 1.5rem;
  padding: 1.1rem 1.2rem;
  border-radius: $wa-radius-xl;
  border: 1px solid $wa-border-invert;
  background: $wa-surface-dark-raised;
  color: $wa-ink-invert;
  text-align: left;
}

.library-chats__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.library-chats__title {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.library-chats__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.7rem;
  border-radius: $wa-radius-pill;
  border: 1px solid $wa-border-invert;
  color: $wa-ink-invert-muted;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: $wa-accent;
    color: $wa-ink-invert;
  }
}

.library-chats__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.library-chats__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem 1rem;
  padding: 0.75rem 0;
  border-top: 1px solid $wa-border-invert;
}

.library-chats__info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1 1 14rem;
}

.library-chats__name {
  font-size: 1rem;
  overflow-wrap: anywhere;
}

.library-chats__meta {
  font-size: 0.82rem;
  color: $wa-ink-invert-muted;
  overflow-wrap: anywhere;

  &--faint {
    color: $wa-ink-invert-faint;
  }
}

.library-chats__actions,
.library-chats__confirm {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.9rem;
}

.library-chats__confirm {
  flex: 1 1 100%;
  font-size: 0.9rem;
}

.library-chats__open,
.library-chats__forget {
  padding: 0.45rem 1.1rem;
  border-radius: $wa-radius-pill;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: progress;
  }
}

.library-chats__open {
  background: $wa-accent;
  color: $wa-surface-white;

  &:hover {
    background: $wa-accent-light;
  }
}

.library-chats__forget {
  background: #b91c1c;
  color: $wa-surface-white;
}

.library-chats__link {
  color: $wa-accent-light;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }

  &--quiet {
    color: $wa-ink-invert-faint;
  }
}

.library-chats__more {
  margin-top: 0.5rem;
}
</style>
