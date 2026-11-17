<template>
  <!-- Only in the browser: the story lives in this tab's storage, so the
       prerendered page can only be the empty state, and hydrating over it on
       a phone reload left its styling behind (the story shifted and cut off). -->
  <ClientOnly>
    <div
      v-if="shareErrorMessage"
      class="mx-auto mt-6 max-w-lg rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100"
    >
      {{ shareErrorMessage }}
    </div>
    <div
      v-else-if="shareLoading"
      class="mx-auto mt-6 max-w-lg rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center text-sm text-emerald-100"
    >
      {{ t("results.status.loadingSharedStory") }}
    </div>

    <!-- The visitor's own chat, saved on this device: say so, with the way
       out (a shared story is someone else's, and isn't saved here; the
       sample is nobody's). -->
    <LibraryStatus
      v-if="result && !shareLoading && !isSharedStory && !isSample"
      :chat-id="activeId"
      surface="wrapped"
      class="mb-4"
    />

    <WrappedStoryCarousel v-if="result" :slides="slides" :duration="6500" />

    <!-- Without an analysis the carousel used to play all eleven slides empty —
       an emoji card with two quote marks and nothing between them, a dangling
       "from". Send people back to the upload instead. -->
    <div
      v-else-if="isEmpty"
      class="mx-auto mt-16 mb-24 max-w-lg rounded-2xl border border-white/15 bg-white/5 px-6 py-10 text-center"
    >
      <p class="text-2xl font-bold text-white">
        {{ t("results.status.emptyTitle") }}
      </p>
      <p class="mt-3 text-sm text-slate-300">
        {{ t("results.status.emptyText") }}
      </p>
      <NuxtLink
        :to="localePath('/wrapped')"
        class="mt-8 inline-block rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black no-underline shadow-lg shadow-emerald-500/40 transition-colors hover:bg-emerald-300"
      >
        {{ t("results.status.emptyCta") }}
      </NuxtLink>
    </div>
  </ClientOnly>
</template>

<script lang="ts" setup>
import { computed, onMounted, provide, reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useStatsStore } from "~/stores/wrapped/stats";
import { useUserDataStore } from "~/stores/wrapped/userDataStore";
import { hasShareInfo, parseShareInfo } from "~/utils/wrapped/sharing/param";
import { useI18n } from "vue-i18n";
import { analyticsWrapped } from "~/composables/useAnalytics";
import { useLibrary } from "~/composables/useLibrary";
import { STORY_CONTEXT, type StorySlide } from "~/utils/wrapped/story";
import Cover from "~/components/wrapped/Stories/Cover.vue";
import FirstMessages from "~/components/wrapped/Stories/FirstMessages.vue";
import Total from "~/components/wrapped/Stories/Total.vue";
import Guess from "~/components/wrapped/Stories/Guess.vue";
import Clock from "~/components/wrapped/Stories/Clock.vue";
import Podium from "~/components/wrapped/Stories/Podium.vue";
import TextingAge from "~/components/wrapped/Stories/TextingAge.vue";
import Records from "~/components/wrapped/Stories/Records.vue";
import Roles from "~/components/wrapped/Stories/Roles.vue";
import Words from "~/components/wrapped/Stories/Words.vue";
import Rhythm from "~/components/wrapped/Stories/Rhythm.vue";
import Funniest from "~/components/wrapped/Stories/Funniest.vue";
import SoftSide from "~/components/wrapped/Stories/SoftSide.vue";
import LeftOnRead from "~/components/wrapped/Stories/LeftOnRead.vue";
import Chemistry from "~/components/wrapped/Stories/Chemistry.vue";
import Stuff from "~/components/wrapped/Stories/Stuff.vue";
import Finale from "~/components/wrapped/Stories/Finale.vue";

definePageMeta({
  layout: "wrapped",
});

const route = useRoute();
const router = useRouter();

const statsStore = useStatsStore();
const { result, isSample } = storeToRefs(statsStore);
const userDataStore = useUserDataStore();
const { activeId } = useLibrary();

const { t } = useI18n();
const localePath = useLocalePath();

useSeoMeta({
  title: () => t("wrappedSeo.resultsTitle"),
  description: () => t("wrappedSeo.resultsDescription"),
  // Someone's own story, from their own upload: nothing for a search engine.
  // The sitemap leaves it out already (config/routes.js).
  robots: "noindex, follow",
});

const shareLoading = ref(false);
const shareErrorKey = ref<string | null>(null);
const shareErrorMessage = computed(() =>
  shareErrorKey.value ? t(shareErrorKey.value) : "",
);

// Nothing to tell a story about: no analysis in the store, and no share link
// still on its way in.
const isEmpty = computed(
  () => !result.value && !shareLoading.value && !shareErrorKey.value,
);

const isSharedStory = computed(
  () => !!buildSearchFromHash() || !!route.query.key,
);

/** The share link's id and key, which live in the URL fragment. */
const buildSearchFromHash = () =>
  hasShareInfo(route.hash) ? route.hash : null;

/**
 * Links shared before the key moved to the fragment carry it in the query,
 * where analytics and error reporting would record it. Move it over before
 * anything reads the URL.
 */
const moveLegacyKeyToHash = () => {
  const { uuid, iv, key, ...rest } = route.query;
  if (
    typeof uuid !== "string" ||
    typeof iv !== "string" ||
    typeof key !== "string"
  ) {
    return false;
  }
  router.replace({
    query: rest,
    // Raw values: the router percent-encodes the hash itself, and encoding
    // them here too would double it.
    hash: `#uuid=${uuid}&iv=${iv}&key=${key}`,
  });
  return true;
};

provide(STORY_CONTEXT, {
  isShared: isSharedStory,
  isSample: computed(() => isSample.value),
  guesses: reactive({}),
});

/**
 * The story, built from what this chat has to tell. A slide whose numbers
 * are missing is left out instead of shown empty: a chat without emoji gets
 * no podium, a note-to-self no "who texts more", and a story shared before
 * the 2026 numbers existed plays the slides it has data for.
 */
const slides = computed<StorySlide[]>(() => {
  const data = result.value;
  if (!data) return [];
  const highlights = data.getHighlights ?? null;
  const people = highlights?.people ?? [];
  const emojis = data.getMostUsedEmojis?.globalTop5Emojis ?? [];
  const months = Object.values(data.getNumberOfMessagesPerMonth ?? {});
  const list: StorySlide[] = [{ name: "Cover", component: Cover }];
  const add = (name: string, component: StorySlide["component"], extra = {}) =>
    list.push({ name, component, ...extra });

  if (Object.keys(data.getFirstMessages ?? {}).length) {
    add("FirstMessages", FirstMessages);
  }
  if (highlights) {
    add("Total", Total);
    if (people.length > 1 && people[0].messages > people[1].messages) {
      add("GuessTalker", Guess, { props: { kind: "talker" } });
    }
    add("Clock", Clock);
  }
  if (emojis.length >= 3 && emojis[0].count > emojis[1].count) {
    add("GuessEmoji", Guess, { props: { kind: "emoji" } });
  }
  if (emojis.length) add("Podium", Podium);
  if (highlights) {
    // Who's funnier, then the joke: only when the laughs have a clear winner.
    const laughs = people
      .map((person) => person.laughsCaused ?? 0)
      .sort((a, b) => b - a);
    if (people.length > 1 && laughs[0] >= 5 && laughs[0] > laughs[1]) {
      add("GuessFunny", Guess, { props: { kind: "funny" } });
    }
    if (highlights.funniest) {
      add("Funniest", Funniest, { duration: 8000 });
    }
    if (people.some((person) => person.age !== null)) {
      // The slides with a card to share get the time to reach for it.
      add("TextingAge", TextingAge, { duration: 12000 });
    }
    const said = people.reduce(
      (sum, person) =>
        sum + Object.values(person.phrases ?? {}).reduce((a, b) => a + b, 0),
      0,
    );
    if (said >= 5) add("SoftSide", SoftSide, { duration: 9000 });
    add("Records", Records, { duration: 9000 });
    if (people.filter((person) => person.medianReplyMin !== null).length > 1) {
      add("GuessReplier", Guess, { props: { kind: "replier" } });
    }
    if (highlights.burst || highlights.waited) {
      add("LeftOnRead", LeftOnRead, { duration: 9000 });
    }
    if (highlights.chemistry) {
      add("Chemistry", Chemistry, { duration: 12000 });
    }
    if (people.some((person) => person.role)) {
      add("Roles", Roles, { duration: 12000 });
    }
    if (people.some((person) => person.words3.length)) {
      add("Words", Words, { duration: 8000 });
    }
    const stuff = highlights.stuff;
    if (stuff) {
      const sent = Object.entries(stuff)
        .filter(([kind]) => kind !== "deleted" && kind !== "edited")
        .reduce((sum, [, count]) => sum + count, 0);
      if (sent >= 5 || stuff.deleted > 0) {
        add("Stuff", Stuff, { duration: 8000 });
      }
    }
  }
  if (months.some((perMonth) => Object.keys(perMonth).length)) {
    add("Rhythm", Rhythm, { duration: 8000 });
  }
  add("Finale", Finale);
  return list;
});

const loadSharedStory = async () => {
  // The replace re-triggers the watcher with the key in the hash.
  if (moveLegacyKeyToHash()) {
    shareLoading.value = true;
    return;
  }
  const queryString = buildSearchFromHash();
  if (!queryString) {
    shareErrorKey.value = null;
    shareLoading.value = false;
    return;
  }

  shareLoading.value = true;
  shareErrorKey.value = null;

  try {
    const shareInfo = parseShareInfo(queryString);
    const loadedData = await userDataStore.loadData(shareInfo);
    result.value = loadedData;
    // Whatever was open in this tab before, this is somebody's real chat.
    isSample.value = false;
  } catch (error) {
    console.error("Failed to load shared story", error);
    shareErrorKey.value = "results.status.decryptError";
  } finally {
    shareLoading.value = false;
  }
};

watch(
  () => route.fullPath,
  () => {
    loadSharedStory();
  },
  { immediate: true },
);

onMounted(() => {
  // A legacy link may still be on its way from the query to the hash.
  analyticsWrapped.resultsViewed(!!(buildSearchFromHash() || route.query.key));
});
</script>
