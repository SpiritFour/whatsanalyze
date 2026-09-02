<template>
  <div>
    <div id="faq" class="font-weight-bold text-h2 text-center py-10">
      {{ $t("faqWhatsapp") }}
    </div>
    <v-expansion-panels v-model="expandedPanels" multiple class="px-sm-10 px-0">
      <v-expansion-panel>
        <v-expansion-panel-title id="faq-privacy">
          {{ $t("privacyFAQTitle") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          {{ $t("privacyFAQContent") }}
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ $t("howToExport") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          {{ $t("howToExportLong") }}
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ $t("howToGroup") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          {{ $t("howToGroupLong") }}
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ $t("howToArchiveiOS") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          {{ $t("howToArchiveiOSLong") }}
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ $t("howToArchiveAndroid") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          {{ $t("howToArchiveAndroidLong") }}
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ $t("howToBackupiOS") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          {{ $t("howToBackupiOSLong") }}
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ $t("howToBackupAndroid") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          {{ $t("howToBackupAndroidLong") }}
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ $t("howToTransferSignal") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          {{ $t("howToTransferSignalLong") }}
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ $t("howToTransferTelegram") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          {{ $t("howToTransferTelegramLong") }}
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ $t("howToTransferToIphone") }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          {{ $t("howToTransferToIphoneLong") }}
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
export default {
  data: () => ({
    expandedPanels: [0],
  }),
};
</script>

<style scoped>
.v-expansion-panel-title {
  font-weight: bold;
  border-bottom: 2px solid rgba(0, 0, 0, 0.2);
}
</style>
