<template>
  <!-- A fixed-position div that will follow the pointer with spring animation -->
  <div ref="ballEl" class="ball"></div>
</template>

<script lang="ts" setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {spring} from 'motion'

// Reference to our moving element
const ballEl = ref<HTMLDivElement | null>(null)

// Create two springs for x/y with desired parameters
const x = spring(0, {damping: 3, stiffness: 50, restDelta: 0.001})
const y = spring(0, {damping: 3, stiffness: 50, restDelta: 0.001})

// Pointer event handler
function handlePointerMove(event: PointerEvent) {
  // Position the circle so its center matches the pointer
  x.set(event.clientX - 50)
  y.set(event.clientY - 50)
}

onMounted(() => {
  // Listen for global pointer movements
  window.addEventListener('pointermove', handlePointerMove)

  // Subscribe to spring updates
  const stopX = x.start(val => {
    if (ballEl.value) {
      ballEl.value.style.transform = `translate3d(${val}px, ${y.current}px, 0)`
    }
  })
  const stopY = y.start(val => {
    if (ballEl.value) {
      ballEl.value.style.transform = `translate3d(${x.current}px, ${val}px, 0)`
    }
  })

  // Cleanup on unmount
  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', handlePointerMove)
    stopX()
    stopY()
  })
})
</script>

<style scoped>
.ball {
  width: 100px;
  height: 100px;
  background-color: #ff0088;
  border-radius: 50%;
  position: fixed; /* allows free movement within the viewport */
  left: 0;
  top: 0;
  pointer-events: none; /* so it doesn't block pointer input */
}
</style>
