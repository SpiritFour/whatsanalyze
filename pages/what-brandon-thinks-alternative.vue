<template>
  <div class="landing-page">
    <LandingHero
      align="left"
      :breadcrumbs="breadcrumbs"
      :title="t('brandonAlt.heroTitle')"
      :subtitle="t('brandonAlt.heroSubtitle')"
      :cta-text="t('brandonAlt.heroCta')"
      cta-to="#dropzone-slot"
      :note="t('brandonAlt.heroNote')"
      @click="onCtaClick"
    >
      <!-- What the AI gives you, shown with the real report cards rather than
           described: the competitor pages all lead with a picture of theirs. -->
      <figure class="preview">
        <div class="preview__back">
          <LandingStatsMock
            :days-label="t('days')"
            :messages-label="t('messages')"
            :people-label="t('people')"
            :example-label="t('exampleDataLabel')"
          />
        </div>
        <div class="preview__front">
          <AiReport :report="exampleReport" />
        </div>
        <figcaption class="preview__caption mono-label">
          {{ t("brandonAlt.exampleBadge") }}
        </figcaption>
      </figure>
    </LandingHero>

    <!-- Upload right here rather than on the next page. A chat restored from
         earlier in this visit only offers the button, so coming back to this
         page does not bounce anyone straight to the analyzer. -->
    <LandingSection theme="white" :title="t('brandonAlt.ctaTitle')">
      <div
        id="dropzone-slot"
        @change.capture="acted = true"
        @drop.capture="acted = true"
        @click.capture="acted = true"
      >
        <ToolDropzone tool-type="ai" @analyzed="onAnalyzed" />
      </div>
      <div v-if="chatReady" class="upload__next">
        <LandingButton :to="aiPath" @click="trackCta">
          {{ t("brandonAlt.ctaButton") }}
        </LandingButton>
      </div>
    </LandingSection>

    <LandingSection
      theme="light"
      :eyebrow="t('brandonAlt.compareEyebrow')"
      :title="t('brandonAlt.compareTitle')"
      :text="t('brandonAlt.compareText')"
    >
      <div class="compare">
        <table class="compare__table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">WhatsAnalyze</th>
              <th scope="col">What Brandon Thinks</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.label">
              <th scope="row">{{ row.label }}</th>
              <td>
                <v-icon size="18" class="compare__mark">
                  mdi-check-circle-outline
                </v-icon>
                {{ row.us }}
              </td>
              <td>
                <v-icon size="18" class="compare__mark">mdi-close</v-icon>
                {{ row.them }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="compare__source">{{ t("brandonAlt.compareSource") }}</p>
    </LandingSection>

    <LandingSection
      theme="dark"
      :eyebrow="t('brandonAlt.privacyEyebrow')"
      :title="t('brandonAlt.privacyTitle')"
      :text="t('brandonAlt.privacyText')"
    >
      <LandingCards :items="pillars" />
    </LandingSection>

    <LandingSection theme="white" :title="t('brandonAlt.faqTitle')">
      <LandingFaq :items="faq" />
    </LandingSection>

    <LandingCta
      :title="t('brandonAlt.ctaTitle')"
      :cta-text="t('brandonAlt.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('brandonAlt.ctaNote')"
      :disclaimer="t('brandonAlt.disclaimer')"
      @click="onCtaClick"
    />
  </div>
</template>

<script>
import { SUBSCRIPTION_PRICE, formatPrice } from "~/utils/pricing";
import { analyticsTools } from "~/composables/useAnalytics";
import AiReport from "~/components/ai/AiReport.vue";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import { scrollToDropzone } from "~/composables/useToolPage";

export default {
  components: { AiReport, ToolDropzone },
  setup() {
    const { t, locale } = useI18n();
    const localePath = useLocalePath();

    useSeoMeta({
      title: () => t("brandonAlt.seoTitle"),
      description: () => t("brandonAlt.seoDescription"),
      ogTitle: () => t("brandonAlt.seoTitle"),
      ogDescription: () => t("brandonAlt.seoDescription"),
    });

    const rows = computed(() =>
      [1, 2, 3, 4, 5].map((i) => ({
        label: t(`brandonAlt.row${i}Label`),
        us: t(`brandonAlt.row${i}Us`, {
          price: formatPrice(SUBSCRIPTION_PRICE, locale.value),
        }),
        them: t(`brandonAlt.row${i}Them`),
      })),
    );

    const exampleReport = computed(() => ({
      kind: "ai",
      version: 1,
      question: t("brandonAlt.exampleQuestion"),
      ranOn: "local",
      coverage: null,
      insights: {
        answer: t("brandonAlt.exampleAnswer"),
        vibe: t("brandonAlt.exampleVibe"),
        summary: t("brandonAlt.exampleSummary"),
        people: [],
        dynamics: [],
        topics: [],
        highlights: [],
      },
    }));

    const pillars = computed(() =>
      [1, 2, 3].map((i) => ({
        icon: ["mdi-cellphone-lock", "mdi-incognito", "mdi-delete-clock"][
          i - 1
        ],
        title: t(`brandonAlt.pillar${i}Title`),
        text: t(`brandonAlt.pillar${i}Text`),
      })),
    );

    const faq = computed(() =>
      [1, 2, 3, 4].map((i) => ({
        q: t(`brandonAlt.faq${i}Q`),
        a: t(`brandonAlt.faq${i}A`, {
          price: formatPrice(SUBSCRIPTION_PRICE, locale.value),
        }),
      })),
    );

    useToolSchema({ faqItems: faq });

    const aiPath = computed(() => localePath("/tools/ai-chat-analyzer"));
    const trackCta = () =>
      analyticsTools.ctaClick("brandon_alternative", "other");
    const acted = ref(false);
    const chatReady = ref(false);

    return {
      t,
      breadcrumbs: computed(() => [
        { label: "WhatsAnalyze", to: localePath("/") },
        { label: t("brandonAlt.navLabel") },
      ]),
      aiPath,
      acted,
      chatReady,
      // The analyzer page picks the parsed chat up from shared state.
      onAnalyzed: () => {
        chatReady.value = true;
        if (acted.value) navigateTo(aiPath.value);
      },
      onCtaClick: () => {
        scrollToDropzone();
        analyticsTools.ctaClick("brandon_alternative", "scroll_to_dropzone");
      },
      rows,
      exampleReport,
      pillars,
      faq,
      trackCta,
    };
  },
};
</script>

<style lang="scss" scoped>
.preview {
  position: relative;
  max-width: 560px;
  margin: 2.5rem auto 0;
  padding-bottom: 2rem;
}

.preview__back {
  transform: rotate(2deg);
}

.preview__front {
  position: relative;
  width: 88%;
  margin-top: -5rem;
  transform: rotate(-1.5deg);

  :deep(.report-card) {
    box-shadow: 0 24px 50px rgba(0, 0, 0, 0.45);
  }

  // The example needs no "this is AI, double-check it" note; the caption
  // already says it is made up.
  :deep(.report-disclaimer) {
    display: none;
  }
}

.preview__caption {
  margin-top: 1.4rem;
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

  .preview__front {
    margin-left: -1rem;
  }
}

.compare {
  overflow-x: auto;
  margin-top: 2rem;
}

.compare__table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th,
  td {
    padding: 0.85rem 0.6rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    vertical-align: top;
  }

  thead th {
    font-weight: 700;
  }

  tbody th {
    font-weight: 600;
  }

  // Our column reads as one highlighted card running down the table.
  thead th:nth-child(2),
  td:nth-child(2) {
    background: rgba(33, 166, 141, 0.08);
    color: $c-blue-accent-dark;
    font-weight: 600;
    padding-inline: 1rem;
  }

  thead th:nth-child(2) {
    border-radius: 14px 14px 0 0;
    color: $c-blue-accent-dark;
  }

  tbody tr:last-child td:nth-child(2) {
    border-radius: 0 0 14px 14px;
  }

  td:nth-child(3) {
    color: rgba(29, 29, 31, 0.6);
  }
}

.compare__mark {
  margin: -0.15em 0.35rem 0 0;
  opacity: 0.85;
}

#dropzone-slot {
  margin-top: 2.5rem;
}

.upload__next {
  margin-top: 1.5rem;
  text-align: center;
}

.compare__source {
  margin-top: 1rem;
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
