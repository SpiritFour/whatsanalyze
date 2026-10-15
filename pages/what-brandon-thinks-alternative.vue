<template>
  <div class="landing-page">
    <LandingHero
      align="left"
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('brandonAlt.heroEyebrow')"
      :title="t('brandonAlt.heroTitle')"
      :subtitle="t('brandonAlt.heroSubtitle')"
      :cta-text="t('brandonAlt.heroCta')"
      :cta-to="aiPath"
      :note="t('brandonAlt.heroNote')"
      @click="trackCta"
    />

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
              <td>{{ row.us }}</td>
              <td>{{ row.them }}</td>
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
      :cta-to="aiPath"
      :note="t('brandonAlt.ctaNote')"
      :disclaimer="t('brandonAlt.disclaimer')"
      @click="trackCta"
    />
  </div>
</template>

<script>
import { SUBSCRIPTION_PRICE, formatPrice } from "~/utils/pricing";
import { analyticsTools } from "~/composables/useAnalytics";

export default {
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

    return {
      t,
      breadcrumbs: computed(() => [
        { label: "WhatsAnalyze", to: localePath("/") },
        { label: t("brandonAlt.navLabel") },
      ]),
      aiPath: computed(() => localePath("/tools/ai-chat-analyzer")),
      rows,
      pillars,
      faq,
      trackCta: () => analyticsTools.ctaClick("brandon_alternative", "other"),
    };
  },
};
</script>

<style lang="scss" scoped>
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

  td:nth-child(2) {
    color: $c-blue-accent-dark;
    font-weight: 600;
  }
}

.compare__source {
  margin-top: 1rem;
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
