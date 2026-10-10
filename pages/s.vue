<template>
  <div class="landing-page">
    <LandingSection theme="light" :reveal="false">
      <!--
        The link has to be fetched and decrypted before there is anything to
        draw, and on a slow connection that is a few seconds of a page that
        would otherwise look broken. The min-height is what the error card
        occupies, so neither state makes the page jump when it replaces this.
      -->
      <div
        v-if="loading"
        class="wa-scope flex min-h-[220px] flex-col items-center justify-center gap-4"
        role="status"
        aria-live="polite"
      >
        <span
          class="block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[rgba(29,29,31,0.12)] border-t-wa-accent"
        ></span>
        <p class="m-0 text-center text-wa-ink-muted">
          {{ $t("sharedHighlightsLoading") }}
        </p>
      </div>

      <div
        v-else-if="errorKey"
        class="wa-scope mx-auto flex min-h-[220px] max-w-lg flex-col items-center justify-center rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-8 text-center shadow-card"
      >
        <p class="m-0 text-lg font-bold text-wa-ink">{{ $t(errorKey) }}</p>
        <p class="m-0 mt-2 text-sm text-wa-ink-muted">
          {{ $t("sharedHighlightsErrorText") }}
        </p>
      </div>

      <!-- The same component the home page renders after an upload, drawing
           the same charts from the sender's finished numbers rather than from
           their messages. -->
      <AiReport v-else-if="aiReport" :report="aiReport" />
      <ChartsResults v-else :chat="analysis" shared />
    </LandingSection>

    <LandingSection theme="white">
      <!-- An AI report invites the reader to the AI analyzer, not the charts -->
      <div v-if="aiReport" class="wa-scope text-center">
        <p class="m-0 text-xl font-bold text-wa-ink">
          {{ $t("toolsAi.ctaTitle") }}
        </p>
        <p class="m-0 mb-6 mt-2 text-sm text-wa-ink-muted">
          {{ $t("toolsAi.ctaNote") }}
        </p>
        <UiButton :to="localePath('/tools/ai-chat-analyzer')" size="lg">
          {{ $t("toolsAi.ctaButton") }}
        </UiButton>
      </div>
      <div v-else class="wa-scope text-center">
        <p class="m-0 text-xl font-bold text-wa-ink">
          {{ $t("sharedHighlightsCtaTitle") }}
        </p>
        <p class="m-0 mb-6 mt-2 text-sm text-wa-ink-muted">
          {{ $t("sharedHighlightsCtaText") }}
        </p>
        <UiButton :to="localePath('/')" size="lg">
          {{ $t("sharedHighlightsCtaButton") }}
        </UiButton>
      </div>
    </LandingSection>
  </div>
</template>

<script setup>
import { onMounted, ref, shallowRef } from "vue";
import AiReport from "~/components/ai/AiReport.vue";
import { SharedAnalysis } from "~/utils/social/analysisSnapshot";
import { reviveSnapshot } from "~/utils/social/shareLink";
import { loadSharedPayload } from "~/utils/social/shareLinkStore";
import { isAiReport } from "~/utils/ai/report";
import { analyticsChat } from "~/composables/useAnalytics";

const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();

// shallowRef: the charts read whole arrays off this and never mutate them, so
// there is nothing to gain from making every entry reactive.
const analysis = shallowRef(null);
// Or an AI report: same link format, told apart by the payload's `kind`.
const aiReport = shallowRef(null);
const loading = ref(true);
const errorKey = ref(null);

// The preview a link gets when it is pasted into a chat. It says only that
// somebody shared an analysis: the numbers are decrypted in the reader's
// browser, and none of them belong in a preview card that WhatsApp, Telegram
// and every link scraper in between will happily cache.
useHead({
  title: "A shared WhatsApp chat analysis - WhatsAnalyze",
  meta: [
    // A share link holds someone's chat. Keeping it out of search results
    // matters more than the traffic an indexed one would bring.
    { name: "robots", content: "noindex, nofollow" },
    {
      property: "og:title",
      content: "Someone shared their WhatsApp chat analysis",
    },
    {
      property: "og:description",
      content:
        "Open the link to see the charts. Want the same for your own chat? It takes one file and never leaves your browser.",
    },
  ],
});

onMounted(async () => {
  // The hash is not on the route yet when this page mounts -- the router is
  // still resolving the first navigation, and reading too early finds an empty
  // fragment and calls a perfectly good link dead.
  await router.isReady();

  // The uuid and key live in the fragment, which the server never sees.
  const fragment = route.hash || window.location.hash;
  if (!fragment || fragment === "#") {
    loading.value = false;
    errorKey.value = "sharedHighlightsMissing";
    return;
  }

  try {
    const payload = await loadSharedPayload(fragment);
    if (isAiReport(payload)) aiReport.value = payload;
    else analysis.value = new SharedAnalysis(reviveSnapshot(payload));
    analyticsChat.sharedHighlightsOpened();
  } catch (error) {
    console.error("Could not open the shared analysis", error);
    errorKey.value = "sharedHighlightsMissing";
  } finally {
    loading.value = false;
  }
});
</script>
