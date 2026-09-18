<template>
  <div>
    <LandingHero
      :breadcrumbs="[
        { label: 'WhatsAnalyze', to: localePath('/') },
        { label: page?.title || 'Switch from WhatsApp to Signal' },
      ]"
      :title="page?.title || 'Switch from WhatsApp to Signal'"
      :subtitle="page?.description || ''"
    />
    <Content :page="page" />
    <v-container>
      <Cta
        to="/"
        class="pt-0 pb-15"
        title="backupWhatsApp"
        button-txt="exportAsPDF"
        text="ctaBullets"
      />
    </v-container>
  </div>
</template>

<script>
export default {
  name: "SwitchFromWhatsappToSignal",
  async setup() {
    useSeoMeta({
      title: "WhatsAnalyze - How to switch from WhatsApp to Signal",
      description:
        "Switch from WhatsApp to Signal, transfer group chats, and create backups.",
      ogTitle: "WhatsAnalyze - How to switch from WhatsApp to Signal",
      ogSiteName: "WhatsAnalyze - How to switch from WhatsApp to Signal",
      ogDescription:
        "Switch from WhatsApp to Signal, transfer group chats, and create backups.",
      ogUrl: "https://www.whatsanalyze.com/switch-from-whatsapp-to-signal",
    });

    const { data: page } = await useAsyncData("content-whatsapp-signal", () =>
      queryCollection("pages").path("/whatsapp-signal").first()
    );
    const localePath = useLocalePath();
    return {
      page,
      localePath,
    };
  },
};
</script>
