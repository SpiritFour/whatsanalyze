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

const { t } = useI18n();
</script>
