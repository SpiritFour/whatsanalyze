<template>
  <v-app>
    <h1 v-if="error?.statusCode === 404">
      {{ pageNotFound }}
    </h1>
    <h1 v-else>
      {{ otherError }}
    </h1>
    <!-- Most non-404s that land here are a chunk that failed to download, so a
         reload is the thing that actually fixes it. -->
    <button v-if="error?.statusCode !== 404" type="button" @click="retry">
      Reload
    </button>
    <NuxtLink to="/"> Home page </NuxtLink>
  </v-app>
</template>

<script setup>
const props = defineProps({
  error: {
    type: Object,
    default: null,
  },
});

const pageNotFound = "404 Not Found";
const otherError = "An error occurred";

const title = computed(() =>
  props.error?.statusCode === 404 ? pageNotFound : otherError
);

// `force` because Nuxt otherwise skips a reload it already did for this path
// within the last 10 seconds, which is exactly when someone clicks this.
function retry() {
  reloadNuxtApp({ force: true });
}

useSeoMeta({ title });
</script>

<style scoped>
h1 {
  font-size: 20px;
}
</style>
