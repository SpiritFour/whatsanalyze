<template>
  <WrappedStoryContainer
    theme="ink"
    :eyebrow="t('results.story.finale.eyebrow')"
    :title="t('results.story.finale.title', { year })"
  >
    <!-- The card that gets posted, as it will look. -->
    <img
      v-if="card.previewUrl.value"
      :src="card.previewUrl.value"
      :alt="t('results.story.finale.cardAlt')"
      class="finale-card story-pop"
      style="--i: 2"
      data-testid="share-card"
    />

    <p v-if="score" class="finale-score story-in" style="--i: 4">
      🎯 {{ score }}
    </p>

    <div class="flex w-full max-w-xs flex-col gap-2">
      <!-- Somebody else's story, or the sample: the next step is their own. -->
      <button
        v-if="isGuest"
        type="button"
        class="story-btn story-in"
        style="--i: 5"
        data-testid="make-yours"
        @click="handleAnalyzeAnother"
      >
        {{ t("results.story.finale.makeYours") }}
      </button>

      <!-- The image: to a status, a story, a chat. -->
      <button
        v-if="card.ready.value && !isSample"
        type="button"
        class="story-btn story-in"
        :class="{ 'story-btn--ghost': isGuest }"
        style="--i: 5"
        :disabled="card.busy.value"
        data-testid="share-image"
        @click="card.share"
      >
        <!-- Somebody else's story is not "my Wrapped". -->
        {{
          t(
            isGuest
              ? "results.story.card.share"
              : "results.story.finale.shareImage",
          )
        }}
      </button>

      <!-- The whole story, guesses included, to the people who are in it:
           straight into WhatsApp, where the chat it is about lives. A real
           link, worked out before the tap, so a phone hands it to the app in
           one tap; the encrypted story uploads as WhatsApp opens. -->
      <template v-if="isOwn">
        <a
          v-if="whatsappHref"
          :href="whatsappHref"
          target="_blank"
          rel="noopener"
          class="story-btn finale-whatsapp story-in"
          style="--i: 6"
          data-testid="whatsapp-link"
          @click="handleWhatsapp"
        >
          <WhatsappGlyph />
          {{ t("results.story.finale.whatsapp") }}
        </a>
        <button
          v-else
          type="button"
          class="story-btn finale-whatsapp story-in"
          style="--i: 6"
          disabled
        >
          <WhatsappGlyph />
          {{ t("results.share.preparing") }}
        </button>
      </template>

      <div v-if="!isSample && card.ready.value" class="flex gap-2">
        <button
          type="button"
          class="story-btn story-btn--ghost story-btn--small story-in flex-1"
          style="--i: 7"
          data-testid="save-image"
          @click="card.save"
        >
          {{ t("results.story.finale.saveImage") }}
        </button>
        <button
          v-if="isOwn"
          type="button"
          class="story-btn story-btn--ghost story-btn--small story-in flex-1"
          style="--i: 7"
          :disabled="!prepared"
          data-testid="copy-link"
          @click="handleCopy"
        >
          🔒 {{ t("results.story.finale.copyLink") }}
        </button>
      </div>
    </div>

    <label
      v-if="card.ready.value && !isSample"
      class="finale-toggle story-in"
      style="--i: 8"
    >
      <input v-model="hideNames" type="checkbox" />
      {{ t("results.story.finale.hideNames") }}
    </label>

    <p v-if="isSample" class="story-muted story-in text-sm" style="--i: 6">
      {{ t("results.story.finale.sampleNote") }}
    </p>

    <p v-if="statusText" class="finale-status" role="status">
      {{ statusText }}
    </p>
    <p
      v-if="shareErrorText"
      class="finale-status finale-status--error"
      role="alert"
    >
      {{ shareErrorText }}
      <button
        v-if="uploadFailed"
        type="button"
        class="finale-retry"
        @click="retryUpload"
      >
        {{ t("results.story.finale.retry") }}
      </button>
    </p>

    <button
      v-if="isOwn"
      type="button"
      class="finale-again story-in"
      style="--i: 9"
      @click="handleAnalyzeAnother"
    >
      {{ t("results.share.buttons.analyzeAnother") }}
    </button>

    <!-- After the story, never in front of it: the way on to the AI. -->
    <WrappedAskAiTeaser v-if="!isSample" />
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, ref, shallowRef } from "vue";
import { mdiWhatsapp } from "@mdi/js";
import { useStatsStore } from "~/stores/wrapped/stats";
import { useUserDataStore } from "~/stores/wrapped/userDataStore";
import { serializeShareInfo } from "~/utils/wrapped/sharing/param";
import type { PreparedShare } from "~/utils/wrapped/sharing/firestore";
import { analyticsWrapped } from "~/composables/useAnalytics";
import { useWrappedCard, useWrappedStory } from "~/composables/useWrappedStory";
import { useStoryContext } from "~/utils/wrapped/story";

const statsStore = useStatsStore();
const userDataStore = useUserDataStore();
const { result, year, isGroup, hideNames, t } = useWrappedStory();
const card = useWrappedCard("summary");
const context = useStoryContext();
const localePath = useLocalePath();

const runtimeConfig = useRuntimeConfig();

/** WhatsApp's mark, drawn in the button's own colour. */
const WhatsappGlyph = () =>
  h(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: 18,
      height: 18,
      fill: "currentColor",
      "aria-hidden": "true",
    },
    [h("path", { d: mdiWhatsapp })],
  );

const isSample = computed(() => context?.isSample.value ?? false);
const isShared = computed(() => context?.isShared.value ?? false);
/** Not the visitor's own chat: what they want next is one of their own. */
const isGuest = computed(() => isSample.value || isShared.value);
const isOwn = computed(() => !isGuest.value);

const score = computed(() => {
  const guesses = Object.values(context?.guesses ?? {});
  if (!guesses.length) return "";
  return t("results.story.finale.score", {
    right: guesses.filter((guess) => guess.right).length,
    total: guesses.length,
  });
});

/**
 * The story encrypted and its link worked out on this device, as soon as
 * the last slide is up. Nothing is uploaded until a link is sent.
 */
const prepared = shallowRef<PreparedShare | null>(null);
let upload: Promise<void> | null = null;
const uploadFailed = ref(false);
const shareMessageKey = ref<string | null>(null);
const shareErrorKey = ref<string | null>(null);

const statusText = computed(
  () =>
    (shareMessageKey.value ? t(shareMessageKey.value) : "") ||
    card.statusText.value,
);
const shareErrorText = computed(() =>
  shareErrorKey.value ? t(shareErrorKey.value) : "",
);

const resolveBaseUrl = () => {
  if (import.meta.client && typeof window !== "undefined") {
    return window.location.origin;
  }
  const configured = runtimeConfig.public.baseUrl ?? "";
  return configured.replace(/\/$/, "");
};

/**
 * The key goes in the fragment, which browsers never send anywhere: not to
 * our server, not in a Referer, not in the page URL analytics records. The
 * UTM tags stay in the query so the visit shows up as its own source.
 */
const buildShareUrl = (medium: "social" | "whatsapp") => {
  if (!prepared.value) return "";
  const base = resolveBaseUrl().replace(/\/$/, "");
  const path = localePath("/wrapped/results");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const fragment = serializeShareInfo(prepared.value.info);
  return `${base}${normalizedPath}?utm_source=wrapped_share&utm_medium=${medium}#${fragment}`;
};

const linkText = () =>
  t(
    isGroup.value
      ? "results.story.finale.linkTextGroup"
      : "results.story.finale.linkText",
  );

const whatsappHref = computed(() => {
  if (!prepared.value) return "";
  const message = `${linkText()}\n${buildShareUrl("whatsapp")}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
});

onMounted(async () => {
  if (!isOwn.value || !result.value) return;
  try {
    prepared.value = await userDataStore.prepareShare(result.value);
  } catch (error) {
    console.error("Could not prepare the story link", error);
    shareErrorKey.value = "results.share.messages.unableToPrepare";
  }
});

/** Uploads the prepared story, once; a failed upload can be tried again. */
const startUpload = () => {
  if (!prepared.value) {
    return Promise.reject(new Error("The story link is not ready."));
  }
  if (!upload) {
    uploadFailed.value = false;
    upload = userDataStore.uploadShare(prepared.value).catch((error) => {
      upload = null;
      uploadFailed.value = true;
      shareErrorKey.value = "results.story.finale.uploadFailed";
      throw error;
    });
  }
  return upload;
};

/**
 * The link is followed as tapped, to WhatsApp; the story uploads alongside.
 * Someone who opens the link before the upload is done waits a moment for
 * it (utils/wrapped/sharing/firestore.ts).
 */
const handleWhatsapp = () => {
  shareErrorKey.value = null;
  shareMessageKey.value = null;
  analyticsWrapped.storyShared("whatsapp");
  startUpload().catch((error) =>
    console.error("Could not upload the shared story", error),
  );
};

const copyToClipboard = async (text: string) => {
  if (!import.meta.client) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

/** Copied first, inside the tap, which Safari asks of the clipboard. */
const handleCopy = async () => {
  shareErrorKey.value = null;
  shareMessageKey.value = null;
  const url = buildShareUrl("social");
  if (!url) return;
  try {
    await copyToClipboard(url);
  } catch (error) {
    console.error("Could not copy the story link", error);
    shareErrorKey.value = "results.share.messages.unableToPrepare";
    return;
  }
  analyticsWrapped.storyShared("copy");
  try {
    await startUpload();
    shareMessageKey.value = "results.share.messages.linkCopied";
  } catch (error) {
    console.error("Could not upload the shared story", error);
  }
};

const retryUpload = async () => {
  shareErrorKey.value = null;
  try {
    await startUpload();
    shareMessageKey.value = "results.story.finale.uploaded";
  } catch (error) {
    console.error("Could not upload the shared story", error);
  }
};

const handleAnalyzeAnother = async () => {
  statsStore.$reset();
  // Back to the Wrapped upload, not the analyzer's home page.
  await navigateTo(localePath("/wrapped"));
};
</script>

<style scoped>
.finale-card {
  width: 6rem;
  aspect-ratio: 9 / 16;
  margin: 0.1rem 0 0.3rem;
  border-radius: 0.8rem;
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.14);
  /* Its own property: the entrance animation ends on `transform: none`. */
  rotate: -3deg;
}

/* Room for a bigger card on the large desktop frame and on a tall phone. */
@media (min-width: 1024px), (max-width: 639px) and (min-height: 700px) {
  .finale-card {
    width: 8.5rem;
  }
}

.finale-score {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
}

.wrapped-scope .finale-whatsapp {
  background: #25d366;
  color: #062b17;
}

.finale-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--s-muted);
  cursor: pointer;
}

.finale-toggle input {
  accent-color: var(--s-accent);
}

.finale-status {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: #a7f3d0;
}

.finale-status--error {
  color: #fecdd3;
}

.wrapped-scope .finale-retry {
  margin-left: 0.3rem;
  color: inherit;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.finale-again {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--s-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
</style>
