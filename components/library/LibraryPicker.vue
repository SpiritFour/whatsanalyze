<template>
  <!-- "Use a saved chat": the chats kept on this device, the one opened last
       first. Client-only by way of the list, which is empty until the
       browser has read it, so the prerendered page never has it. -->
  <div v-if="options.length" class="library-picker" @click.stop>
    <label :for="selectId" class="library-picker__label">
      <v-icon size="18" color="#21a68d">mdi-message-text-outline</v-icon>
      {{ t(exclude ? "library.useAnother" : "library.useSaved") }}
    </label>
    <div class="library-picker__row">
      <select :id="selectId" v-model="selected" class="library-picker__select">
        <option v-for="chat in options" :key="chat.id" :value="chat.id">
          {{ optionLabel(chat) }}
        </option>
      </select>
      <button
        type="button"
        class="library-picker__open"
        :disabled="!selected || busy"
        @click="open"
      >
        {{ t("library.open") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import {
  useLibrary,
  useSavedChatLabels,
  type SavedChat,
} from "~/composables/useLibrary";

const props = withDefaults(
  defineProps<{
    /** The saved chat already on screen, which isn't offered again. */
    exclude?: string | null;
    /** True while the page opens the chat picked. */
    busy?: boolean;
  }>(),
  { exclude: null, busy: false },
);
const emit = defineEmits<{ open: [id: string] }>();

const { t } = useI18n();
const { chats } = useLibrary();
const { name, range } = useSavedChatLabels();
const selectId = useId();

const options = computed(() =>
  chats.value.filter((chat) => chat.id !== props.exclude),
);
const optionLabel = (chat: SavedChat) =>
  [name(chat), range(chat)].filter(Boolean).join(" · ");

// The chat opened last, until the visitor picks another.
const selected = ref<string | null>(null);
watch(
  options,
  (list) => {
    if (!list.some((chat) => chat.id === selected.value)) {
      selected.value = list[0]?.id ?? null;
    }
  },
  { immediate: true },
);

function open() {
  if (selected.value) emit("open", selected.value);
}
</script>

<style lang="scss" scoped>
.library-picker {
  display: grid;
  gap: 0.5rem;
  margin-top: 1.4rem;
  padding-top: 1.2rem;
  border-top: 1px solid rgba(127, 127, 127, 0.25);
  text-align: left;
  cursor: default;
}

.library-picker__label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.library-picker__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.library-picker__select {
  flex: 1 1 14rem;
  min-width: 0;
  padding: 0.55rem 0.8rem;
  border-radius: $wa-radius-sm;
  border: 1px solid rgba(127, 127, 127, 0.4);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.9rem;
  // The arrow Safari draws otherwise ignores the colour around it.
  appearance: auto;

  option {
    color: $wa-ink;
    background: $wa-surface-white;
  }
}

.library-picker__open {
  padding: 0.55rem 1.2rem;
  border-radius: $wa-radius-pill;
  background: $wa-accent;
  color: $wa-surface-white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: $wa-accent-light;
  }

  &:disabled {
    opacity: 0.5;
    cursor: progress;
  }
}
</style>
