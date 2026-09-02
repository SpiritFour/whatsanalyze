<template>
  <v-container>
    <Content :page="page" />
    <ExportExplainer to="/" cta="convertToPDF" class="mt-10" />
    <Cta
      to="/"
      class="pt-0 pb-15"
      title="exportAsPDF"
      buttonTxt="convertToPDF"
      text="ctaBullets"
    />
  </v-container>
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
    return {
      page,
    };
  },
};
</script>
