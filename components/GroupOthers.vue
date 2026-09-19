<template>
  <div
    v-if="chatObject.numPersonsInChat > 2"
    class="wa-scope rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-5 text-left shadow-card md:p-6"
  >
    <h3 class="m-0 text-lg font-bold text-wa-ink md:text-xl">
      <span class="text-wa-accent">{{ chatObject.numPersonsInChat }}</span>
      {{ $t("people") }}
    </h3>
    <p class="m-0 mt-1 text-sm text-wa-ink-muted">
      {{ $t("groupChat") }}
    </p>
    <p class="m-0 mt-1 text-xs text-wa-ink-faint">
      {{ $t("groupInfo") }}
    </p>

    <div class="mt-5 flex items-center gap-4">
      <input
        v-model.number="groupAfter"
        type="range"
        min="2"
        :max="chatObject.numPersonsInChat - 1"
        step="1"
        class="w-full cursor-pointer accent-[#21a68d]"
        @change="
          /* eslint-disable vue/no-mutating-props */
          chatObject.groupAfter = groupAfter
        "
      />
      <span
        class="min-w-8 rounded-full bg-[rgba(33,166,141,0.12)] px-2.5 py-1 text-center text-sm font-bold text-wa-accent"
      >
        {{ groupAfter }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: "GroupOthers",
  props: ["chatObject"],
  data() {
    return {
      groupAfter: this.chatObject.groupAfter,
    };
  },
  mounted() {
    this.groupAfter = this.chatObject.groupAfter;
  },
};
</script>
