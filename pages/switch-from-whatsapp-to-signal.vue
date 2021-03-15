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
        hid: "description",
        name: "description",
        content:
          "Learn how to export your chat from WhatsApp to Signal ✓ Now working for Group Chats ✓ Keep your Data ✓ No Chat Data is sent to a Server. Get Started now!",
      },
    ],
  },
};
</script>
