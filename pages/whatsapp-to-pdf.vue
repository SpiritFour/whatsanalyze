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
    useSeoMeta({
      title: "WhatsAnalyze - How to Export your WhatsApp Chat to PDF",
      robots: "noindex",
      description:
        "Export your WhatsApp chat to PDF in seconds without sending chat data to a server.",
      ogTitle: "WhatsAnalyze - How to Export your WhatsApp Chat to PDF",
      ogDescription:
        "Export your WhatsApp chat to PDF in seconds without sending chat data to a server.",
    });

    const { data: page } = await useAsyncData("content-whatsapp-to-pdf", () =>
      queryCollection("pages").path("/whatsapp-to-pdf").first()
    );
    const localePath = useLocalePath();
    return {
      page,
      localePath,
    };
  },
};
</script>
