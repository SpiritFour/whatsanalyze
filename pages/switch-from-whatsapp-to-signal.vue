<template>
  <v-container>
    <Content :page="page" class="my-15" />
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
  pwa: {
    manifest: {
      name: "WhatsAnalyze - How to switch from Signal to WhatsApp",
      description:
        "Learn how to export your chat from WhatsApp to Signal ✓ Now working for Group Chats ✓ Keep your Data ✓ No Chat Data is sent to a Server. Get Started now!",
    },
  },
  head: {
    title: "WhatsAnalyze - How to switch from Signal to WhatsApp",
    meta: [
      {
        hid: "description",
        name: "description",
        content:
          "Learn how to export your chat from WhatsApp to Signal ✓ Now working for Group Chats ✓ Keep your Data ✓ No Chat Data is sent to a Server. Get Started now!",
      },
      {
        property: "op:image",
        content: "/whatsanalyze-logo-white.png",
      },
    ],
  },
};
</script>
