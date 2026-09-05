<template>
  <section id="top" class="relative overflow-hidden pb-0">
    <WrappedStylePolygon />
    <div class="card card--flush container w-full h-full">
      <div class="flex flex-col gap-8">
        <div>
          <div
            class="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4"
          >
            <span
              class="uppercase tracking-widest text-green-400 font-semibold"
              >{{ heroCopy.tagline }}</span
            >
          </div>
          <h1 class="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
            {{ heroCopy.headline }}
          </h1>
          <p
            v-if="heroDescriptionMobile"
            class="text-lg text-gray-300 mb-6 lg:hidden"
          >
            {{ heroDescriptionMobile }}
          </p>
          <p
            v-if="heroDescriptionDesktop"
            class="hidden lg:block text-lg md:text-xl text-gray-300 mb-6"
          >
            {{ heroDescriptionDesktop }}
          </p>
          <div class="flex flex-wrap gap-3 text-sm text-gray-400">
            <span
              v-for="highlight in heroCopy.highlights"
              :key="highlight"
              class="rounded-full border border-gray-700/80 px-3 py-1"
            >
              {{ highlight }}
            </span>
          </div>
        </div>
        <div class="w-full">
          <WrappedUpload />
          <p class="text-sm text-center text-gray-500">
            {{ $t("home.hero.usedBy") }}
          </p>
        </div>
      </div>
    </div>
  </section>
  <section v-if="pressQuotes.length" class="container card py-8">
    <div class="text-center mb-8">
      <p class="text-sm uppercase tracking-widest text-green-400 font-semibold">
        {{ $t("home.press.eyebrow") }}
      </p>
      <h2 class="text-3xl md:text-4xl font-extrabold mt-2">
        {{ $t("home.press.title") }}
      </h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <article
        v-for="mention in pressQuotes"
        :key="mention.source"
        class="rounded-2xl border border-gray-800 p-6 bg-gray-900/40"
      >
        <div class="flex items-center gap-3 mb-4">
          <img
            :alt="mention.source + ' logo'"
            :src="mention.logo"
            class="h-8 w-auto"
            loading="lazy"
          />
          <span class="text-sm uppercase tracking-widest text-gray-400">{{
            mention.source
          }}</span>
        </div>
        <blockquote class="text-lg font-semibold text-white">
          &ldquo;{{ mention.quote }}&rdquo;
        </blockquote>
        <a
          :href="mention.href"
          class="mt-4 inline-flex text-sm text-green-300 hover:text-green-200"
          rel="noopener noreferrer"
          target="_blank"
        >
          {{ $t("home.press.cta") }}
        </a>
      </article>
    </div>
  </section>

  <section class="relative container py-20">
    <div class="text-center mb-12">
      <h2 class="text-3xl md:text-5xl font-extrabold mb-8">
        {{ $t("home.sections.whatIs") }}
      </h2>

      <p class="text-lg md:text-xl text-green-400">
        {{ $t("home.sections.whatIsSubheading") }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-center">
      <div
        v-for="explanation in explanations"
        :key="explanation.title"
        class="space-y-4"
      >
        <div class="mx-auto w-12 h-12 flex items-center justify-center mb-2">
          <component :is="explanation.icon" class="w-8 h-8" />
        </div>
        <h3 class="text-xl font-semibold">{{ explanation.title }}</h3>
        <p class="text-sm md:text-base leading-relaxed text-gray-500">
          {{ explanation.description }}
        </p>
      </div>
    </div>
  </section>

  <section id="guide" class="container bg-gradient card">
    <WrappedExportGuide />
  </section>

  <section id="features" class="container card">
    <div class="text-center mb-12">
      <h2 class="text-3xl md:text-5xl font-extrabold mb-8">
        {{ $t("home.sections.whatToExpect") }}
      </h2>

      <p class="text-lg md:text-xl text-green-400">
        {{ $t("home.sections.whatToExpectSubheading") }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-center">
      <div
        v-for="feature in featureList"
        :key="feature.title"
        class="space-y-4"
      >
        <h3 class="text-xl font-semibold">{{ feature.title }}</h3>
        <p class="text-sm md:text-base leading-relaxed text-gray-500">
          {{ feature.description }}
        </p>
      </div>
    </div>
  </section>

  <section v-if="shareHighlights.length" class="container card">
    <div class="text-center mb-10">
      <p class="text-sm uppercase tracking-widest text-green-400 font-semibold">
        {{ $t("home.share.eyebrow") }}
      </p>
      <h2 class="text-3xl md:text-5xl font-extrabold mt-2">
        {{ $t("home.share.title") }}
      </h2>
      <p class="text-lg text-gray-300 mt-4">
        {{ $t("home.share.description") }}
      </p>
    </div>

    <div class="flex flex-wrap justify-center gap-6">
      <article
        v-for="share in shareHighlights"
        :key="share.title"
        class="rounded-2xl border border-gray-800 p-6 bg-gray-900/40"
      >
        <h3 class="text-2xl font-semibold mb-3">{{ share.title }}</h3>
        <p class="text-gray-400 text-sm leading-relaxed">
          {{ share.description }}
        </p>
      </article>
    </div>
  </section>
  <WrappedSubscriptionAd />

  <section id="privacy" class="container card">
    <div class="text-center mb-12">
      <div class="flex flex-col items-center justify-center">
        <LockClosedIcon class="w-28 h-28 mb-8" />
        <h2 class="text-3xl md:text-5xl font-extrabold mb-8">
          {{ $t("home.sections.privacyFirst") }}
        </h2>
      </div>
      <p class="text-lg md:text-xl text-green-400">
        {{ $t("home.sections.privacyFirstSubheading") }}
      </p>
    </div>
  </section>

  <section id="about" class="container bg-gradient card">
    <WrappedAbout />
  </section>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "#imports";
import {
  ChatBubbleLeftIcon,
  DocumentArrowDownIcon,
  LightBulbIcon,
  LockClosedIcon,
} from "@heroicons/vue/24/solid";
import { getTargetYear } from "~/utils/wrapped/dateUtils";

definePageMeta({
  layout: "wrapped",
});

const { t, tm } = useI18n();
useHead({
  title: "WhatsApp Wrapped - Your Year in Review",
});

useSeoMeta({
  title: "WhatsApp Wrapped - Your Year in Review",
  description:
    "Analyze your WhatsApp chats and get stunning insights into your conversations, peak times, emoji podium, and messaging habits.",
  ogTitle: "WhatsApp Wrapped - Your Year in Review",
  ogDescription:
    "Analyze your WhatsApp chats and get stunning insights into your conversations, peak times, emoji podium, and messaging habits.",
});

interface HeroCopy {
  date?: string;
  tagline: string;
  headline: string;
  description?: string;
  descriptionMobile?: string;
  descriptionDesktop?: string;
  highlights: string[];
}

interface PressQuote {
  quote: string;
  source: string;
  href: string;
  logo: string;
}

interface FeatureCard {
  title: string;
  description: string;
}

interface SimpleCard {
  title: string;
  description: string;
}

const heroCopy = computed<HeroCopy>(() => {
  const raw = tm("home.hero.english") as HeroCopy;
  if (!raw || !raw.tagline) {
    return {
      tagline: `YOUR CHATS WRAPPED ${getTargetYear()}`,
      headline: "Your WhatsApp year, told like a story",
      highlights: ["100% Private", "No Server Upload", "Free"],
    };
  }
  return {
    ...raw,
    tagline: raw.tagline.replace("{year}", getTargetYear().toString()),
  };
});

const heroDescriptionMobile = computed(() => {
  return heroCopy.value?.descriptionMobile ?? heroCopy.value?.description;
});

const heroDescriptionDesktop = computed(() => {
  return heroCopy.value?.descriptionDesktop ?? heroCopy.value?.description;
});

const pressQuotes = computed<PressQuote[]>(() => {
  const quotes = tm("home.press.quotes") as PressQuote[];
  return Array.isArray(quotes) ? quotes : [];
});

const featureList = computed<FeatureCard[]>(() => {
  const list = tm("home.features") as FeatureCard[];
  return Array.isArray(list) ? list : [];
});

const shareHighlights = computed<SimpleCard[]>(() => {
  const list = tm("home.share.cards") as SimpleCard[];
  return Array.isArray(list) ? list : [];
});

const explanations = computed(() => [
  {
    title: t("home.explanations.0.title"),
    description: t("home.explanations.0.description"),
    icon: LightBulbIcon,
  },
  {
    title: t("home.explanations.1.title"),
    description: t("home.explanations.1.description"),
    icon: ChatBubbleLeftIcon,
  },
  {
    title: t("home.explanations.2.title"),
    description: t("home.explanations.2.description"),
    icon: DocumentArrowDownIcon,
  },
]);
</script>
