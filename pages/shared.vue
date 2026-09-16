<template>
  <div class="landing-page">
    <LandingSection
      theme="light"
      :eyebrow="$t('sharedHighlightsEyebrow')"
      :title="$t('sharedHighlightsTitle')"
      :reveal="false"
    >
      <div class="wa-scope mx-auto flex max-w-[1080px] flex-col gap-6 md:gap-8">
        <p v-if="loading" class="m-0 text-center text-wa-ink-muted">
          {{ $t("sharedHighlightsLoading") }}
        </p>

        <div
          v-else-if="errorKey"
          class="mx-auto max-w-lg rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-8 text-center shadow-card"
        >
          <p class="m-0 text-lg font-bold text-wa-ink">
            {{ $t(errorKey) }}
          </p>
          <p class="m-0 mt-2 text-sm text-wa-ink-muted">
            {{ $t("sharedHighlightsErrorText") }}
          </p>
        </div>

        <template v-else>
          <ChartsCard
            v-for="card in cards"
            :key="card.id"
            :title="card.title"
            :subtitle="card.kicker"
          >
            <HighlightsBody :card="card" />
          </ChartsCard>
        </template>

        <!-- The point of the link: whoever opened it can analyze their own
             chat without ever seeing the sender's. -->
        <div
          class="rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-8 text-center shadow-card"
        >
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
      </div>
    </LandingSection>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { loadSharedCards } from "~/utils/social/shareLinkStore";
import { analyticsChat } from "~/composables/useAnalytics";

const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();

const cards = ref([]);
const loading = ref(true);
const errorKey = ref(null);

useHead({
  title: "Chat highlights - WhatsAnalyze",
  // A share link holds someone's chat highlights. Keeping it out of search
  // results matters more than the traffic an indexed one would bring.
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
    const payload = await loadSharedCards(fragment);
    cards.value = payload.cards;
    analyticsChat.sharedHighlightsOpened();
  } catch (error) {
    console.error("Could not open the shared highlights", error);
    errorKey.value = "sharedHighlightsMissing";
  } finally {
    loading.value = false;
  }
});
</script>
