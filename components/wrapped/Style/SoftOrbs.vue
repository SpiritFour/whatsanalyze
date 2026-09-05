<template>
  <div class="pointer-events-none absolute inset-0 opacity-50">
    <div
        class="absolute -left-24 -top-32 h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl"
    />
    <div
        class="absolute -right-10 top-24 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl"
    />
    <div
        class="absolute bottom-0 left-1/3 h-40 w-40 translate-y-1/2 rounded-full bg-pink-500/20 blur-3xl"
    />
  </div>
</template>
<script>
export default {
  name: 'SoftOrbs'
}
</script>