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
  name: "switch-from-whatsapp-to-signal",
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
        content:
          "Switch from WhatsApp to Signal ✓ Transfer your Group Chats ✓ Create Backups",
      },
      {
        hid: "og:description",
        name: "og:description",
        property: "og:description",
        content:
          "Switch from WhatsApp to Signal ✓ Transfer your Group Chats ✓ Create Backups",
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
