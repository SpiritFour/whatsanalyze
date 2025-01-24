<template>
  <ul class="example">
    <!-- Four items that animate in on mount -->
    <li></li>
    <li></li>
    <li></li>
    <li></li>
  </ul>
</template>

<script lang="ts" setup>
import {onMounted} from 'vue'
import {animate, stagger} from 'motion'

onMounted(() => {
  // Animate each <li> with a staggered delay
  animate(
      '.example li',
      {opacity: 1, y: [50, 0]},
      {delay: stagger(0.05)}
  )
})
</script>

<style scoped>
.example {
  list-style: none;
  display: flex;
  justify-content: center;
  gap: 20px;
  flex: 0;
  margin: 0;
  padding: 0;
}

.example li {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: block;
  background-color: #0cdcf7;
  opacity: 0; /* start invisible */
  flex: 0 0 50px;
}
</style>
