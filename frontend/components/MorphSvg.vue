<template>
  <svg
      ref="iconSvg"
      height="200"
      viewBox="0 0 400 400"
      width="200"
  >
    <g transform="translate(10 10) scale(17 17)">
      <path ref="pathEl"/>
    </g>
  </svg>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import {animate} from 'motion'
import {interpolate} from "flubber"

interface Path {
  color: string,
  d: string,
}

const {fromPath, toPath} = defineProps<{
  fromPath: Path
  toPath: Path
}>()

// Refs to our SVG elements
const iconSvg = ref<SVGSVGElement | null>(null)
const pathEl = ref<SVGPathElement | null>(null)

// Current path object (initially "star")
let currentPath = fromPath

/**
 * Toggle between "star" and "heart" shapes
 * and animate both the fill color & path data.
 */
function togglePath() {
  currentPath = currentPath === fromPath ? toPath : fromPath
  if (!pathEl.value) return

  // Prepare Flubber interpolation
  const fromD = pathEl.value.getAttribute("d") || ""
  const toD = currentPath.d
  const mixPaths = interpolate(fromD, toD, {maxSegmentLength: 0.1})

  const duration = 0.5

  // Animate fill color
  animate(pathEl.value, {fill: currentPath.color}, {duration})

  // Animate the path data from "fromD" to "toD"
  animate(0, 1, {
    duration,
    onUpdate: (progress) => {
      pathEl.value!.setAttribute("d", mixPaths(progress))
    },
  })
}

onMounted(() => {
  // Initialize the path with default color/shape
  if (pathEl.value) {
    pathEl.value.setAttribute("fill", currentPath.color)
    pathEl.value.setAttribute("d", currentPath.d)
  }

  // Toggle shape every second
  setInterval(togglePath, 1000)
})
</script>

<style scoped>
/* Example style from your snippet */
.segment use,
.segment path {
  fill: #ff0088;
  transform-origin: 100px 100px;
}
</style>
