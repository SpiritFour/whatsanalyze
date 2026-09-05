<template>
  <WrappedStoryContainer
    class="text-5xl"
    :title="t('results.conversation.changeTitle')"
  >
    <WrappedStyleAuroraGrid />
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useStatsStore } from "~/stores/wrapped/stats";
import Aurora from "~/components/wrapped/Style/AuroraGrid.vue";

const statsStore = useStatsStore();

const { result } = storeToRefs(statsStore);
const { t } = useI18n();
</script>
