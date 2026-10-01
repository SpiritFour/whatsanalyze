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

      <!-- The same component the home page renders after an upload, so a
           shared link and an upload cannot show different analyses. -->
      <ChartsResults v-else :chat="chat" :shareable="false" />
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
import { Chat } from "~/utils/transformChatData";
import { loadSharedChat } from "~/utils/social/shareLinkStore";
import { analyticsChat } from "~/composables/useAnalytics";

const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();

// shallowRef: Chat holds every message and caches derived tables on itself,
// and making all of that reactive costs seconds on a long chat for nothing.
const chat = shallowRef(null);
const loading = ref(true);
const errorKey = ref(null);

useHead({
  title: "Shared chat analysis - WhatsAnalyze",
  // A share link holds someone's chat. Keeping it out of search results
  // matters more than the traffic an indexed one would bring.
  meta: [{ name: "robots", content: "noindex, nofollow" }],
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
    chat.value = new Chat(await loadSharedChat(fragment));
    analyticsChat.sharedHighlightsOpened();
  } catch (error) {
    console.error("Could not open the shared chat", error);
    errorKey.value = "sharedHighlightsMissing";
  } finally {
    loading.value = false;
  }
});
</script>
