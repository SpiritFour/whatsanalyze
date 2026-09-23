<template>
  <div>
    <LandingHero
      :breadcrumbs="[
        { label: 'WhatsAnalyze', to: localePath('/') },
        { label: page?.title || 'WhatsApp chat to PDF' },
      ]"
      :title="page?.title || 'WhatsApp chat to PDF'"
      :subtitle="page?.description || ''"
    />
    <Content :page="page" />
    <v-container>
      <ExportExplainer to="/" cta="convertToPDF" class="mt-10" />
      <Cta
        to="/"
        class="pt-0 pb-15"
        title="exportAsPDF"
        button-txt="convertToPDF"
        text="ctaBullets"
      />
    </v-container>
  </div>
</template>

<script>
export default {
  async setup() {
    const { t } = useI18n();

    useSeoMeta({
      title: () => t("seo.pdfGuideTitle"),
      robots: "noindex",
      description: () => t("seo.pdfGuideDescription"),
      ogTitle: () => t("seo.pdfGuideTitle"),
      ogDescription: () => t("seo.pdfGuideDescription"),
    });

    const localePath = useLocalePath();
    const { data: page } = await useAsyncData("content-whatsapp-to-pdf", () =>
      queryCollection("pages").path("/whatsapp-to-pdf").first(),
    );
    return {
      page,
      localePath,
    };
  },
};
</script>
