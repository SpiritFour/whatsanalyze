<template>
  <v-container>
    <Content :page="page" class="my-15" />
    <Cta
      to="/"
      class="pt-0 pb-15"
      title="Backup your WhatsApp Data"
      buttonTxt="Save your WhatsApp as PDF"
      text="✓ Group Chats ✓ Create your PDF Chat ✓ Privacy First"
    />
  </v-container>
</template>

<script>
export default {
  name: "whatsapp-signal",
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
        hid: "robots",
        name: "robots",
        content: "noindex",
      },
      {
        hid: "og:title",
        name: "og:title",
        content: "WhatsAnalyze - How to Export your WhatsApp Chat to PDF",
      },

      {
        hid: "og:description",
        name: "og:description",
        content:
          "Export your Whatsapp chat to PDF in seconds ✓ Group Chats ✓ Create a PDF Book ✓ Privacy First -> No Chat Data is sent to a Server. Get your pdf now!",
      },
      {
        hid: "description",
        name: "description",
        content:
          "Export your Whatsapp chat to PDF in seconds ✓ Now working for Group Chats ✓ Create your own PDF Book ✓ No Chat Data is sent to a Server. Get Started now!",
      },
    ],
  },
};
</script>
