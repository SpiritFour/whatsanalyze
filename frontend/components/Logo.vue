<template>
  <nuxt-link class="flex items-center align-middle gap-6 cursor-pointer" to="/">

    <Gradient style="width: 38px; height: 38px;">
      <img alt="logo" class="text-clip" src="/img/logo-inverse.png" width="38px"/>
    </Gradient>

    <div v-if="!logoOnly" class="relative flex">
      <strong class="mr-2 text-xl md:text-3xl">WhatsAnalyze</strong>
      <slot/>
    </div>
  </nuxt-link>
</template>

<script lang="ts">
export default {
  props: {
    logoOnly: {type: Boolean, default: false},
  }
}
</script>