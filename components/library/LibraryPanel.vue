<template>
  <!-- The privacy panel: what is kept on this device and how to get rid of
       it (docs/saved-chats.md). Opened from every "Saved on this device" chip
       and from the header, so it is one instance, mounted by SiteHeader and
       loaded only once it is opened. A plain overlay rather than v-dialog:
       /wrapped has no <v-app> around it. -->
  <Teleport to="body">
    <div
      class="library-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="library-panel-title"
      @click.self="closePanel"
      @keydown.esc="closePanel"
    >
      <div
        ref="sheet"
        class="library-panel__sheet"
        tabindex="-1"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <header class="library-panel__head">
          <h2 id="library-panel-title">
            <v-icon size="22" color="#21a68d">mdi-shield-check-outline</v-icon>
            {{ t("library.panelTitle") }}
          </h2>
          <button
            type="button"
            class="library-panel__close"
            :aria-label="t('common.close')"
            @click="closePanel"
          >
            <v-icon size="22">mdi-close</v-icon>
          </button>
        </header>

        <p>{{ t("library.panelIntro") }}</p>
        <p class="library-panel__note">
          <v-icon size="18">mdi-incognito</v-icon>
          {{ t("library.panelShared") }}
        </p>

        <section v-if="chat" class="library-panel__section">
          <h3>{{ name(chat) }}</h3>
          <p class="library-panel__muted">
            {{ [people(chat), range(chat)].filter(Boolean).join(" · ") }}
          </p>
          <button
            type="button"
            class="library-panel__danger"
            :disabled="busy"
            @click="forgetThis"
          >
            {{ t("library.forgetThis") }}
          </button>
        </section>

        <section class="library-panel__section">
          <h3>{{ t("library.storageTitle") }}</h3>
          <p v-if="storage">
            {{ t("library.storageChats", { size: size(storage.chats) }) }}
            <template v-if="storage.usage !== null && storage.quota">
              {{
                t("library.storageSite", {
                  used: size(storage.usage),
                  quota: size(storage.quota),
                })
              }}
            </template>
          </p>
          <p v-if="persisted" class="library-panel__ok">
            <v-icon size="18" color="#21a68d">mdi-check-circle-outline</v-icon>
            {{ t("library.persisted") }}
          </p>
          <template v-else>
            <p class="library-panel__muted">{{ t("library.notPersisted") }}</p>
            <button
              v-if="canPersist"
              type="button"
              class="library-panel__button"
              @click="persist"
            >
              {{ t("library.persistButton") }}
            </button>
            <p v-if="persistAsked && !persisted" class="library-panel__muted">
              {{ t("library.persistDenied") }}
            </p>
          </template>
          <p v-if="homeScreenHint" class="library-panel__note">
            <v-icon size="18">mdi-information-outline</v-icon>
            {{ t("library.iosHint") }}
          </p>
        </section>

        <section class="library-panel__section">
          <h3>{{ t("library.backupTitle") }}</h3>
          <p class="library-panel__muted">{{ t("library.backupText") }}</p>
          <div class="library-panel__row">
            <button
              type="button"
              class="library-panel__button"
              :disabled="busy || !chats.length"
              @click="download"
            >
              <v-icon size="18">mdi-file-export</v-icon>
              {{ t("library.backupDownload") }}
            </button>
            <label class="library-panel__button">
              <v-icon size="18">mdi-file-upload-outline</v-icon>
              {{ t("library.backupRestore") }}
              <input
                type="file"
                accept=".gz,.json,application/gzip,application/json"
                class="library-panel__file"
                @change="onPick"
              />
            </label>
          </div>
          <p v-if="backupNotice" class="library-panel__ok" role="status">
            {{ backupNotice }}
          </p>
        </section>

        <section class="library-panel__section">
          <h3>{{ t("library.forgetTitle") }}</h3>
          <label class="library-panel__switch">
            <input
              type="checkbox"
              :checked="settings.autoForget"
              @change="
                setAutoForget(($event.target as HTMLInputElement).checked)
              "
            />
            <span>
              <strong>{{ t("library.autoForget") }}</strong>
              <span class="library-panel__muted">
                {{ t("library.autoForgetText") }}
              </span>
            </span>
          </label>
          <button
            v-if="!confirmAll"
            type="button"
            class="library-panel__danger"
            :disabled="busy"
            @click="confirmAll = true"
          >
            {{ t("library.forgetAll") }}
          </button>
          <div v-else class="library-panel__confirm" role="group">
            <p>{{ t("library.forgetAllConfirm") }}</p>
            <div class="library-panel__row">
              <button
                type="button"
                class="library-panel__danger"
                :disabled="busy"
                @click="forgetEverything"
              >
                {{ t("library.forgetAll") }}
              </button>
              <button
                type="button"
                class="library-panel__button"
                @click="confirmAll = false"
              >
                {{ t("library.cancel") }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useLibrary, useSavedChatLabels } from "~/composables/useLibrary";

const { t, locale } = useI18n();
const library = useLibrary();
const { chats, settings, persisted, panel, closePanel } = library;
const { name, people, range } = useSavedChatLabels();

const sheet = ref<HTMLElement | null>(null);
const busy = ref(false);
const confirmAll = ref(false);
const persistAsked = ref(false);
const backupNotice = ref("");
const storage = ref<Awaited<ReturnType<typeof library.storageInfo>> | null>(
  null,
);

/** The chat whose chip opened the panel, if it was one. */
const chat = computed(() => library.chatById(panel.value.chatId));

const canPersist =
  typeof navigator !== "undefined" && !!navigator.storage?.persist;

// Safari evicts a site's storage after weeks without a visit, unless the
// site was added to the Home Screen (WebKit's storage policy).
const homeScreenHint = computed(() => {
  if (typeof navigator === "undefined") return false;
  const iOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    (navigator as { standalone?: boolean }).standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches;
  return iOS && !standalone;
});

const size = (bytes: number) =>
  new Intl.NumberFormat(locale.value, {
    style: "unit",
    unit: bytes < 1e6 ? "kilobyte" : bytes < 1e9 ? "megabyte" : "gigabyte",
    maximumFractionDigits: 1,
  }).format(bytes / (bytes < 1e6 ? 1e3 : bytes < 1e9 ? 1e6 : 1e9));

onMounted(async () => {
  await nextTick();
  sheet.value?.focus();
  storage.value = await library.storageInfo();
});

async function persist() {
  persistAsked.value = true;
  await library.requestPersist();
}

async function forgetThis() {
  if (!chat.value) return;
  busy.value = true;
  try {
    const { wasOpen } = await library.forget(chat.value.id);
    closePanel();
    // It was on screen: start this page over without it.
    if (wasOpen) window.location.reload();
  } finally {
    busy.value = false;
  }
}

async function forgetEverything() {
  busy.value = true;
  try {
    await library.forgetEverything();
    closePanel();
    window.location.reload();
  } finally {
    busy.value = false;
  }
}

const setAutoForget = (on: boolean) => library.setAutoForget(on);

async function download() {
  busy.value = true;
  try {
    const count = await library.downloadBackup();
    backupNotice.value = t("library.backupDownloaded", { count });
  } catch (error) {
    console.warn("Could not write the backup:", error);
  } finally {
    busy.value = false;
  }
}

async function restore(file: File | undefined) {
  if (!file) return;
  backupNotice.value = "";
  try {
    const { added, merged } = await library.restoreBackup(file);
    backupNotice.value = t("library.backupRestored", {
      count: added + merged,
    });
    storage.value = await library.storageInfo();
  } catch (error) {
    console.warn("Could not restore the backup:", error);
    backupNotice.value = t("library.backupInvalid");
  }
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement;
  void restore(input.files?.[0]);
  input.value = "";
}

const onDrop = (event: DragEvent) => restore(event.dataTransfer?.files?.[0]);
</script>

<style lang="scss" scoped>
.library-panel {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(1rem, 6vh, 4rem) 1rem;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.6);
}

.library-panel__sheet {
  width: 100%;
  max-width: 34rem;
  padding: clamp(1.2rem, 4vw, 1.8rem);
  border-radius: $wa-radius-xl;
  background: $wa-surface-white;
  color: $wa-ink;
  box-shadow: $wa-shadow-lg;
  display: grid;
  gap: 0.8rem;
  line-height: 1.5;
  text-align: left;

  &:focus {
    outline: none;
  }
}

.library-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  h2 {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    font-weight: 700;
  }
}

.library-panel__close {
  padding: 0.3rem;
  border-radius: 50%;
  color: $wa-ink-muted;
  cursor: pointer;

  &:hover {
    background: $wa-surface-light;
  }
}

.library-panel__section {
  display: grid;
  gap: 0.5rem;
  padding-top: 0.9rem;
  border-top: 1px solid $wa-border;

  h3 {
    font-size: 1rem;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
}

.library-panel__muted {
  font-size: 0.9rem;
  color: $wa-ink-muted;
}

.library-panel__note,
.library-panel__ok {
  display: flex;
  gap: 0.45rem;
  align-items: flex-start;
  font-size: 0.9rem;
}

.library-panel__note {
  color: $wa-ink-muted;
}

.library-panel__ok {
  color: $wa-accent-dark;
  font-weight: 600;
}

.library-panel__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.library-panel__button,
.library-panel__danger {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: $wa-radius-pill;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: progress;
  }
}

.library-panel__button {
  border: 1px solid $wa-border;
  color: $wa-ink;
  background: $wa-surface-white;

  &:hover {
    background: $wa-surface-light;
  }
}

.library-panel__danger {
  background: #b91c1c;
  color: $wa-surface-white;

  &:hover {
    background: #991b1b;
  }
}

.library-panel__file {
  display: none;
}

.library-panel__switch {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  cursor: pointer;

  input {
    margin-top: 0.3rem;
    accent-color: $wa-accent;
  }

  > span {
    display: grid;
    gap: 0.15rem;
  }
}

.library-panel__confirm {
  display: grid;
  gap: 0.5rem;
  font-weight: 600;
}
</style>
