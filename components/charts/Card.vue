<template>
  <section
    class="wa-scope rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-5 text-left shadow-card md:p-6"
  >
    <header v-if="title" class="mb-5 flex items-start justify-between gap-3">
      <div>
        <h3 class="m-0 text-lg font-bold leading-tight text-wa-ink md:text-xl">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="m-0 mt-1 text-sm text-wa-ink-faint">
          {{ subtitle }}
        </p>
      </div>
      <slot name="action" />
    </header>
    <slot />
  </section>
</template>

<script>
/**
 * The frame every chart sits in: one surface, one heading size, one radius.
 * The charts themselves stay dumb and only draw their data.
 */
export default {
  name: "ChartsCard",
  props: {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
  },
};
</script>
