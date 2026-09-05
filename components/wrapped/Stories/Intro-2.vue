<template>
  <WrappedStoryContainer
    class="text-2xl"
    :title="t('results.intro.firstMessagesTitle')"
  >
    <div
      v-for="(message, index) in result?.getFirstMessages"
      :key="index"
      class="rounded-3xl bg-gradient-to-br from-blue-400/40 via-sky-500/40 to-green-500/40 p-[2px] shadow-2xl mt-4 w-full"
    >
      <div
        class="flex items-center gap-6 rounded-[1.6rem] bg-black/80 px-6 py-5 backdrop-blur-xl"
      >
        <div class="flex-1 space-y-1 text-left">
          <div
            class="flex items-center gap-2 text-xs tracking-[0.05em] text-slate-400 justify-between"
          >
            {{ message.author }}
            <span>
              {{ new Date(message.date).toLocaleString() }}
            </span>
          </div>

          <p class="text-lg leading-tight">
            {{ message.message }}
          </p>
        </div>
      </div>
    </div>
    <WrappedStyleBlueSlider reverse />
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useStatsStore } from "~/stores/wrapped/stats";
import BlueSlider from "~/components/wrapped/Style/BlueSlider.vue";

const statsStore = useStatsStore();
const { result } = storeToRefs(statsStore);
const { t } = useI18n();
</script>
