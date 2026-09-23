<template>
  <!--
    The three tags are spelled out rather than picked by `<component :is>`.
    Nuxt resolves auto-imported components at compile time, so a runtime string
    `"NuxtLink"` finds nothing to resolve and ships a literal `<NUXTLINK>`
    element: no href, no navigation, every `to=` button dead.
  -->
  <NuxtLink
    v-if="to"
    :to="to"
    :class="classes"
    :aria-busy="loading ? 'true' : null"
  >
    <span v-if="loading" :class="SPINNER"></span>
    <slot />
  </NuxtLink>
  <a
    v-else-if="href"
    :href="href"
    :class="classes"
    :aria-busy="loading ? 'true' : null"
  >
    <span v-if="loading" :class="SPINNER"></span>
    <slot />
  </a>
  <button
    v-else
    type="button"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : null"
  >
    <span v-if="loading" :class="SPINNER"></span>
    <slot />
  </button>
</template>

<script>
/**
 * The one button on the site.
 *
 * Vuetify's v-btn brought its own type scale, its own uppercase and its own
 * elevation into pages that had already left all three behind, so everything
 * that is a button outside /wrapped is this component now.
 */
// No `bg-transparent` anywhere below: Vuetify ships its own .bg-transparent
// carrying `color: currentColor !important`, which silently wins over every
// text colour here. Buttons have no background of their own anyway.
const VARIANTS = {
  primary:
    "bg-wa-accent text-white shadow-[0_8px_24px_rgba(33,166,141,0.28)] hover:bg-wa-accent-light",
  secondary:
    "border border-solid border-[rgba(29,29,31,0.12)] text-wa-ink hover:border-wa-accent hover:text-wa-accent",
  ghost: "text-wa-ink-muted hover:bg-[rgba(29,29,31,0.05)]",
  danger: "text-[#d93b3b] hover:bg-[rgba(217,59,59,0.08)]",
};

const SIZES = {
  sm: "px-4 py-2 text-[0.8rem]",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-3.5 text-base",
};

const SPINNER =
  "block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-solid border-current border-t-transparent opacity-70";

export default {
  name: "UiButton",
  props: {
    /** Internal route. Renders a NuxtLink instead of a button. */
    to: { type: [String, Object], default: null },
    /** External URL. Renders an anchor. */
    href: { type: String, default: null },
    variant: {
      type: String,
      default: "primary",
      validator: (value) => Object.keys(VARIANTS).includes(value),
    },
    size: {
      type: String,
      default: "md",
      validator: (value) => Object.keys(SIZES).includes(value),
    },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    /** Full width, for stacked cards and narrow screens. */
    block: { type: Boolean, default: false },
  },
  data() {
    return { SPINNER };
  },
  computed: {
    classes() {
      return [
        // Wrapping is the normal case here: these labels are translated, and
        // the German ones are long.
        "wa-scope inline-flex items-center justify-center gap-2 rounded-full text-center font-semibold leading-snug no-underline transition-colors",
        "disabled:cursor-default disabled:opacity-60",
        VARIANTS[this.variant],
        SIZES[this.size],
        this.block ? "w-full" : "max-w-full",
      ];
    },
  },
};
</script>

<style>
/* Tailwind is not loaded globally (see nuxt.config): the parts of the
   site that opt into it pull it in themselves. */
@import "~/assets/tailwind.css";
</style>
