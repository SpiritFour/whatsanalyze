<template>
  <div>
    <div class="font-weight-bold text-h2 text-center py-10">
      {{ $t("faqWhatsapp") }}
    </div>
    <v-expansion-panels class="px-sm-10 px-0">
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ $t("howToExport") }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ $t("howToExportLong") }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ $t("howToGroup") }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ $t("howToGroupLong") }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ $t("howToArchiveiOS") }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ $t("howToArchiveiOSLong") }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ $t("howToArchiveAndroid") }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ $t("howToArchiveAndroidLong") }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ $t("howToBackupiOS") }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ $t("howToBackupiOSLong") }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ $t("howToBackupAndroid") }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ $t("howToBackupAndroidLong") }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ $t("howToTransferSignal") }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ $t("howToTransferSignalLong") }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ $t("howToTransferTelegram") }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ $t("howToTransferTelegramLong") }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ $t("howToTransferToIphone") }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ $t("howToTransferToIphoneLong") }}
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
.v-expansion-panel-header {
  font-weight: bold;
  border-bottom: 2px solid rgba(0, 0, 0, 0.2);
}
</style>
