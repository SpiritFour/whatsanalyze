<template>
  <div class="flex items-center align-middle gap-6  cursor-pointer">

    <Gradient>
      <img :width="width" alt="logo" class="text-clip" src="/img/logo-inverse.png"/>
    </Gradient>

    <div v-if="!logoOnly" class="relative flex">
      <strong class="mr-2 text-xl md:text-3xl">WhatsAnalyze</strong>
      <slot/>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    logoOnly: {type: Boolean, default: false},
    width: {type: Number, default: 38},
  }
}

</script>