<template>
  <v-container>
    <Content :page="page" class="my-15" />
    <Cta
      to="/"
      class="pt-0 pb-15"
      title="backupWhatsApp"
      button-txt="exportAsPDF"
      text="ctaBullets"
    />
  </v-container>
</template>

<script>
export default {
  name: "SwitchFromWhatsappToSignal",
  async asyncData({ $content }) {
    const page = await $content("whatsapp-signal").fetch();
    return {
      page,
    };
  },
  head: {
    title: "WhatsAnalyze - How to switch from Signal to WhatsApp",
    meta: [
      {
        hid: "og:title",
        name: "og:title",
        property: "og:title",
        content: "WhatsAnalyze - How to switch from WhatsApp to PDF",
      },
      {
        hid: "og:site_name",
        name: "og:site_name",
        property: "og:site_name",
        content: "WhatsAnalyze - How to switch from WhatsApp to PDF",
      },
      {
        hid: "description",
        name: "description",
        property: "description",
        content: "metaDescriptionSignal",
      },
      {
        hid: "og:description",
        name: "og:description",
        property: "og:description",
        content: "metaDescriptionSignal",
      },
      {
        hid: "og:url",
        name: "og:url",
        property: "og:url",
        content: "whatsanalyze.com/switch-from-whatsapp-to-signal",
      },
    ],
  },
};
</script>
