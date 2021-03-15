<template>
  <Content :page="page" class="main-el mt-15" />
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
        hid: "description",
        name: "description",
        content:
          "Learn how to export your chat from WhatsApp to Signal ✓ Now working for Group Chats ✓ Keep your Data ✓ No Chat Data is sent to a Server. Get Started now!",
      },
    ],
  },
};
</script>
