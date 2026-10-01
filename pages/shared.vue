<template>
  <div class="landing-page">
    <LandingSection theme="light" :reveal="false">
      <p v-if="loading" class="wa-scope m-0 text-center text-wa-ink-muted">
        {{ $t("sharedHighlightsLoading") }}
      </p>

      <div
        v-else-if="errorKey"
        class="wa-scope mx-auto max-w-lg rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-8 text-center shadow-card"
      >
        <p class="m-0 text-lg font-bold text-wa-ink">{{ $t(errorKey) }}</p>
        <p class="m-0 mt-2 text-sm text-wa-ink-muted">
          {{ $t("sharedHighlightsErrorText") }}
        </p>
      </div>

      <!-- The same component the home page renders after an upload, drawing
           the same charts from the sender's finished numbers rather than from
           their messages. -->
      <ChartsResults v-else :chat="analysis" shared />
    </LandingSection>

    <LandingSection theme="white">
      <div class="wa-scope text-center">
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
import { SharedAnalysis } from "~/utils/social/analysisSnapshot";
import { loadSharedAnalysis } from "~/utils/social/shareLinkStore";
import { analyticsChat } from "~/composables/useAnalytics";

const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();

// shallowRef: the charts read whole arrays off this and never mutate them, so
// there is nothing to gain from making every entry reactive.
const analysis = shallowRef(null);
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
    analysis.value = new SharedAnalysis(await loadSharedAnalysis(fragment));
    analyticsChat.sharedHighlightsOpened();
  } catch (error) {
    console.error("Could not open the shared analysis", error);
    errorKey.value = "sharedHighlightsMissing";
  } finally {
    loading.value = false;
  }
});
</script>
