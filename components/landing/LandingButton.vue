<template>
  <NuxtLink :to="to" class="landing-btn" @click="$emit('click')">
    <slot />
  </NuxtLink>
</template>

<script>
export default {
  name: "LandingButton",
  props: {
    to: { type: [String, Object], required: true },
  },
  emits: ["click"],
};
</script>

<style lang="scss" scoped>
.landing-btn {
  display: inline-block;
  padding: 0.9em 2.2em;
  border-radius: 999px;
  background: $c-blue-accent;
  color: #ffffff !important;
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 30px rgba(33, 166, 141, 0.35);

  &:hover {
    background: $c-blue-accent-light;
    transform: translateY(-1px);
    box-shadow: 0 14px 34px rgba(33, 166, 141, 0.45);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
