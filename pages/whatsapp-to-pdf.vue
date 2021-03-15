<template>
  <v-container>
    <Content :page="page" />
    <ExportExplainer
      to="/"
      cta="Convert your exported WhatsApp data to PDF"
      class="mt-10"
    />
    <Cta
      to="/"
      class="pt-0 pb-15"
      title="Get your chat as PDF"
      buttonTxt="Get your chat as PDF"
      text="✓ Group Chats ✓ Create your PDF Chat ✓ Privacy First"
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
