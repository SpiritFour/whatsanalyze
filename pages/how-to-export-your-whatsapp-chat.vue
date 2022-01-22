<template>
  <v-container>
    <ExportExplainer class="mt-10" cta="exportAsPDF" to="/" />
    <PdfExample />
    <Content :page="page" />
    <v-data-table
      hide-default-footer
      disable-sort
      :headers="headers"
      :items="desserts"
      class="elevation-1 mt-3"
    >
    </v-data-table>
    <Cta
      to="/"
      class="pt-0 pb-15"
      title="analyzeYourOwnWhatsapp"
      button-txt="analyzeMyChat"
      text="interestedAbout"
    />
  </v-container>
</template>

<script>
export default {
  name: "HowToExportYourWhatsappChat",
  title: "WhatsAnalyze - How to export WhatsApp chat",
  meta: [
    {
      hid: "og:title",
      name: "og:title",
      property: "og:title",
      content: "WhatsAnalyze - How to export WhatsApp chat",
    },
    {
      hid: "og:site_name",
      name: "og:site_name",
      property: "og:site_name",
      content: "WhatsAnalyze - How to export WhatsApp chat",
    },
    {
      hid: "description",
      name: "description",
      property: "description",
      content: "metaDescriptionWhatsExport",
    },
    {
      hid: "og:description",
      name: "og:description",
      property: "og:description",
      content: "metaDescriptionWhatsExport",
    },
    {
      hid: "og:url",
      name: "og:url",
      property: "og:url",
      content: "whatsanalyze.com/how-to-export-your-whatsapp-chat",
    },
  ],
  async asyncData({ $content }) {
    const page = await $content("how-to-export-your-whatsapp-chat").fetch();
    return {
      page,
    };
  },
  data() {
    return {
      headers: [
        {
          text: "Features & Solutions  of PDF export tools",
          align: "start",
          sortable: false,
          value: "name",
        },
        { text: "Zapptales", value: "zapptales" },
        { text: "Dr. Fon", value: "drfon" },
        { text: "Longshot app", value: "longshotapp" },
        { text: "Export to txt and then to PDF", value: "pdfex" },
        {
          text: "WhatsAnalyze",
          value: "whatsAnalyze",
        },
      ],
      desserts: [
        {
          name: "Privacy",
          zapptales: "⛔️ user has no control",
          whatsAnalyze:
            "✅ Build with privacy in mind  ✅ all  calculations are done on the device  ✅ no chat data is stored or shared",
          drfon: "⛔️ user has no control",
          longshotapp: "✅",
          pdfex: "✅",
        },
        {
          name: "Security",
          zapptales: "⛔️ sent to server " + "⛔️ might be stored",
          whatsAnalyze:
            "✅ Everything runs locally on your device ✅ as secure as your phone ✅ secure your chat backup",
          drfon: "⛔️ sent to server " + "⛔️ No control",
          longshotapp: "⛔️ not open source",
          pdfex: "✅️ is secure",
        },
        {
          name: "Effort",
          zapptales:
            "⛔️external desktop application ⛔️ hundreds of steps needed",
          whatsAnalyze:
            "✅ directly on your phone takes ✅ less than 1 minute ✅ no third party device or desktop app is required",
          drfon: "⛔️ external desktop application",
          longshotapp: "✅ on phone" + "⛔️ external application",
          pdfex: "⚠️ high effort",
        },
        {
          name: "User can Print",
          zapptales: "✅ can be printed",
          whatsAnalyze:
            "✅ Pdf can be printed ✅ right size to be used for a booklet or book from your whatsapp chat",
          drfon: "✅ can be printed",
          longshotapp: "⛔️ can not be printed",
          pdfex: "✅ can be printed",
        },
        {
          name: "Analytics",
          zapptales: "⛔️ no additional information",
          whatsAnalyze:
            "✅ Fun facts ✅ Statistics ✅ Chat usage and time analysis data",
          drfon: "⛔️ no additional information",
          longshotapp: "⛔️ no additional information",
          pdfex: "⛔️ no additional information",
        },
        {
          name: "iOS",
          zapptales: "✅ works on iPhone",
          whatsAnalyze:
            "✅ runs on iPhone effortlessly just open whatsanalyze.com in your browser",
          drfon: "✅ works on iPhone",
          longshotapp: "⛔️ Android only",
          pdfex: "⚠️ complicated and external app needed",
        },
        {
          name: "Android",
          zapptales: "⚠️ complicated but works",
          whatsAnalyze:
            "✅ Android fully supported open whatsanalyze.com with your chrome browser on your android phone ",
          drfon: "⚠️ complicated but works",
          longshotapp: "✅ works",
          pdfex: "⚠️ external app needed",
        },
        {
          name: "Free Preview",
          zapptales: "⛔️ no preview",
          whatsAnalyze: " ✅ Free preview ✅ all statistics for free ",
          drfon: "⛔️ no preview ⚠️ subscription trial",
          longshotapp: "⛔️ no trial",
          pdfex: "⚠️ long process",
        },
        {
          name: "Price",
          zapptales: "⛔️ 14,90 is expensive",
          whatsAnalyze: "✅ Cheapest with just 1,99 ",
          drfon: "⛔️ 14,90 is expensive",
          longshotapp: "⚠️ in App purchases️",
          pdfex: "free apps but many ads",
        },
        {
          name: "Rating",
          zapptales: "✅✅✅",
          whatsAnalyze: "✅✅✅✅✅ -Secure -Affordable -Analytics",
          drfon: "✅✅",
          longshotapp: "✅",
          pdfex: "✅",
        },
      ],
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
