<template>
  <v-container>
    <ExportExplainer
      class="mt-10"
      cta="Analyze your data and save it as a beautiful PDF"
      to="/"
    />
    <PdfExample class="pb-10" />
    <Content :page="page" />
    <Cta
      to="/"
      class="pt-0 pb-15"
      title="Analyze your own WhatsApp data"
      buttonTxt="Analyze my chat"
      text="Interested about your own chat data? Take deep dive in your data!"
    />
  </v-container>
</template>

<script>
export default {
  async asyncData({ $content }) {
    const page = await $content("how-to-export-your-whatsapp-chat").fetch();
    return {
      page,
    };
  },
  head: {
    title: "WhatsAnalyze - How to Export your WhatsApp Chat",
    meta: [
      {
        hid: "og:title",
        name: "og:title",
        property: "og:title",
        content: "WhatsAnalyze - How to Export your WhatsApp Chat",
      },
      {
        hid: "og:site_name",
        name: "og:site_name",
        property: "og:site_name",
        content: "WhatsAnalyze - How to Export your WhatsApp Chat",
      },
      {
        hid: "description",
        name: "description",
        property: "description",
        content: "Export your Whatsapp Chat ✓ iOS Tutorial ✓ Android Guide",
      },
      {
        hid: "og:description",
        name: "og:description",
        property: "og:description",
        content: "Export your Whatsapp Chat ✓ iOS Tutorial ✓ Android Guide",
      },
      {
        hid: "og:url",
        name: "og:url",
        property: "og:url",
        content: "whatsanalyze.com/how-to-export-your-whatsapp-chat",
      },
    ],
  },
};
</script>
