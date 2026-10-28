<template>
  <div class="landing-page">
    <OneTimePurchaseReturn :chat="chat" checkout-source="court_evidence_pdf" />

    <LandingHero
      align="left"
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('courtEvidence.heroEyebrow')"
      :title="t('courtEvidence.heroTitle')"
      :subtitle="t('courtEvidence.heroSubtitle')"
      :cta-text="t('courtEvidence.heroCta')"
      cta-to="#dropzone-slot"
      :note="t('courtEvidence.heroNote')"
      @click="trackHeroCta"
    >
      <figure class="preview">
        <LandingDocMock />
        <figcaption class="preview__caption mono-label">
          {{ t("courtEvidence.exampleBadge") }}
        </figcaption>
      </figure>
    </LandingHero>

    <!-- Upload and download right here: the court PDF is what this page is
         for, so it is not buried under the analyzer's charts. -->
    <LandingSection theme="white" :title="t('courtEvidence.uploadTitle')">
      <div id="dropzone-slot">
        <ToolDropzone
          tool-type="court"
          @analyzed="onChatAnalyzed"
          @reset="chat = null"
        />
      </div>
      <!-- #payButton: where PdfDownloadPopup scrolls a returning buyer -->
      <div v-if="chat" id="payButton" class="court-pdf">
        <PdfDownloadPopup
          :chat="chat"
          :attachments="attachments"
          :ego="ego"
          :source="source"
          :is-valid-subscription="isSubscriptionValid"
          court
        />
      </div>
    </LandingSection>

    <LandingSection theme="white">
      <LandingCards :items="pillars" />
    </LandingSection>

    <LandingSection
      theme="light"
      :eyebrow="t('courtEvidence.docEyebrow')"
      :title="t('courtEvidence.docTitle')"
      :text="t('courtEvidence.docText')"
    >
      <LandingCards :items="docFeatures" />
    </LandingSection>

    <LandingSection
      theme="dark"
      :eyebrow="t('courtEvidence.casesEyebrow')"
      :title="t('courtEvidence.casesTitle')"
      :text="t('courtEvidence.casesText')"
    >
      <LandingCards :items="useCases" />
    </LandingSection>

    <LandingSection
      theme="white"
      :eyebrow="t('courtEvidence.privacyEyebrow')"
      :title="t('courtEvidence.privacyTitle')"
      :text="t('courtEvidence.privacyText')"
    />

    <LandingSection theme="light" :title="t('courtEvidence.stepsTitle')">
      <LandingSteps :steps="steps" />
      <p class="landing-page__guide-link">
        <NuxtLink :to="exportGuidePath">
          {{ t("courtEvidence.stepsGuideLink") }} →
        </NuxtLink>
      </p>
    </LandingSection>

    <LandingSection theme="white" :title="t('courtEvidence.quotesTitle')">
      <LandingQuotes :quotes="quotes" />
    </LandingSection>

    <LandingSection theme="light" :title="t('courtEvidence.faqTitle')">
      <LandingFaq :items="faq" />
    </LandingSection>

    <LandingCta
      :title="t('courtEvidence.ctaTitle')"
      :cta-text="t('courtEvidence.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('courtEvidence.ctaNote')"
      :disclaimer="t('courtEvidence.disclaimer')"
      @click="trackBottomCta"
    />
  </div>
</template>

<script>
import { ONE_TIME_PRICE, formatPrice } from "~/utils/pricing";
import { analyticsTools } from "~/composables/useAnalytics";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import PdfDownloadPopup from "~/components/ChatVisualization/PdfDownloadPopup.vue";
import OneTimePurchaseReturn from "~/components/ChatVisualization/OneTimePurchaseReturn.vue";
import { Chat } from "~/utils/transformChatData";
import { useSubscriptionStore } from "~/stores/subscription";
import { storeToRefs } from "pinia";
import { markRaw, nextTick, shallowRef } from "vue";
import { scrollToSettled } from "~/utils/scroll";

export default {
  components: { ToolDropzone, PdfDownloadPopup, OneTimePurchaseReturn },
  setup() {
    const { t, locale } = useI18n();
    const localePath = useLocalePath();

    function trackHeroCta() {
      analyticsTools.ctaClick("court_evidence", "hero_dropzone");
    }

    function trackBottomCta() {
      scrollToDropzone();
      analyticsTools.ctaClick("court_evidence", "scroll_to_dropzone");
    }

    // kept out of Vue's deep reactivity: Chat caches its lazy getters on
    // itself, and proxying a whole chat is slow
    const chat = shallowRef(null);
    const attachments = shallowRef([]);
    const source = shallowRef(null);
    const ego = computed(() => chat.value?.messagesPerPerson[0]?.name || "");
    const { isSubscriptionValid } = storeToRefs(useSubscriptionStore());

    function onChatAnalyzed(payload) {
      chat.value = markRaw(new Chat(payload.messages));
      attachments.value = payload.attachments || [];
      source.value = payload.source || null;
      nextTick(() => scrollToSettled("#payButton", { offset: 80 }));
    }
    useSeoMeta({
      title: () => t("courtEvidence.seoTitle"),
      description: () => t("courtEvidence.seoDescription"),
      ogTitle: () => t("courtEvidence.seoTitle"),
      ogDescription: () => t("courtEvidence.seoDescription"),
    });

    // The cost question closes both PDF pages, quoting the real one-time
    // price rather than "a one-time purchase" — /tools/proof-of-relationship
    // had no cost question at all, so a visa applicant could not find out
    // that the download is paid.
    const faq = computed(() => [
      ...[1, 2, 3, 4].map((i) => ({
        q: t(`courtEvidence.faq${i}Q`),
        a: t(`courtEvidence.faq${i}A`),
      })),
      {
        q: t("courtEvidence.faqCostQ"),
        a: t("courtEvidence.faqCostA", {
          price: formatPrice(ONE_TIME_PRICE, locale.value),
        }),
      },
    ]);

    useToolSchema({ faqItems: faq });

    const pillars = computed(() =>
      [1, 2, 3].map((i) => ({
        icon: [
          "mdi-cellphone-lock",
          "mdi-format-list-numbered",
          "mdi-clock-fast",
        ][i - 1],
        title: t(`courtEvidence.pillar${i}Title`),
        text: t(`courtEvidence.pillar${i}Text`),
      })),
    );

    const docFeatures = computed(() =>
      [1, 2, 3, 4].map((i) => ({
        icon: [
          "mdi-sort-clock-ascending-outline",
          "mdi-account-clock-outline",
          "mdi-file-document-outline",
          "mdi-shield-check-outline",
        ][i - 1],
        title: t(`courtEvidence.docCard${i}Title`),
        text: t(`courtEvidence.docCard${i}Text`),
      })),
    );

    const useCases = computed(() =>
      [1, 2, 3, 4].map((i) => ({
        icon: [
          "mdi-shield-alert-outline",
          "mdi-scale-balance",
          "mdi-heart-outline",
          "mdi-briefcase-outline",
        ][i - 1],
        title: t(`courtEvidence.case${i}Title`),
        text: t(`courtEvidence.case${i}Text`),
        to: i === 3 ? localePath("/tools/proof-of-relationship") : undefined,
        linkText: i === 3 ? t("courtEvidence.caseLinkText") : undefined,
      })),
    );

    const steps = computed(() =>
      [1, 2, 3].map((i) => ({
        title: t(`courtEvidence.step${i}Title`),
        text: t(`courtEvidence.step${i}Text`),
      })),
    );

    const quotes = computed(() =>
      [1, 2].map((i) => ({
        text: t(`courtEvidence.quote${i}Text`),
        attribution: t(`courtEvidence.quote${i}Attribution`),
      })),
    );

    // The last crumb is the tool's name from the shared catalogue
    // (composables/useSiteNav.ts), the same string the /tools index, the footer
    // and the header use. Each page used to name itself differently here.
    const breadcrumbs = useToolBreadcrumbs("toolsHub.toolCourtTitle");

    return {
      t,
      breadcrumbs,
      chat,
      attachments,
      source,
      ego,
      isSubscriptionValid,
      onChatAnalyzed,
      exportGuidePath: computed(() =>
        localePath("how-to-export-your-whatsapp-chat"),
      ),
      pillars,
      docFeatures,
      useCases,
      steps,
      quotes,
      faq,
      trackHeroCta,
      trackBottomCta,
    };
  },
};
</script>

<style lang="scss" scoped>
.preview {
  margin: 2.5rem auto 0;
  padding-bottom: 1rem;
}

.preview__caption {
  margin-top: 1.6rem;
  text-align: center;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(245, 245, 247, 0.5);
}

@media (min-width: 1000px) {
  .preview {
    margin-top: 0;
  }
}

#dropzone-slot {
  margin-top: 2.5rem;
  scroll-margin-top: 6rem;

  // the dropzone's banner is styled for the dark hero it usually sits in
  :deep(.tech-spec-bar) {
    color: rgba(29, 29, 31, 0.55);
  }
}

.court-pdf {
  max-width: 960px;
  margin: 3rem auto 0;
  scroll-margin-top: 6rem;
}

.landing-page__guide-link {
  margin-top: 2rem;

  a {
    color: $c-blue-accent-dark;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
