<template>
  <v-app>
    <GlobalHeader />

    <v-main style="overflow-x: hidden">
      <FeedbackBtn />
      <slot />
    </v-main>

    <GlobalFooter />
  </v-app>
</template>
