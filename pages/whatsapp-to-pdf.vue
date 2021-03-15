<template>
  <v-container>
    <Content :page="page" class="mt-15" />
    <ExportExplainer class="mt-10" />
    <Cta
      to="/"
      class="pt-0 pb-15"
      title="Analyze your own WhatsApp data"
      buttonText="Analyze my chat"
      text="Interested about your own chat data? Take deep dive in your data!"
    />
  </v-container>
</template>

<script>
export default {
  async asyncData({ $content }) {
    const page = await $content("whatsapp-to-pdf").fetch();
    return {
      page,
    };
  },
  head: {
    title: "WhatsAnalyze - How to Export your WhatsApp Chat to PDF",
    meta: [
      {
        hid: "description",
        name: "description",
        content:
          "Export your Whatsapp chat to PDF in seconds ✓ Group Chats ✓ Create a PDF Book ✓ Privacy First -> No Chat Data is sent to a Server. Get your pdf now!",
      },
      {
        property: "op:image",
        content: "/whatsanalyze-logo-white.png",
      },
    ],
  },
};
</script>
