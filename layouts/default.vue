<template>
  <v-app>
    <SiteHeader />

    <v-main style="overflow-x: hidden">
      <FeedbackBtn />
      <slot />
    </v-main>

    <SiteFooter />
  </v-app>
</template>
