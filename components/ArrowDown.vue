<template>
  <v-icon
    :class="{ 'arrow-down': animate }"
    class="py-2"
    color="rgba(0,0,0,0.8)"
    content-class="elevation-0"
    size="50"
    @click="goToExportExplainer"
  >
    mdi-chevron-down
  </v-icon>
  <!--  todo hide ugly button grey thingy after pressing-->
</template>

<script>
import { scrollTo } from "~/utils/scroll";

export default {
  name: "ArrowDown",
  props: { animate: { default: false, type: Boolean } },
  methods: {
    goToExportExplainer() {
      scrollTo(".exportexplainer");
    },
  },
};
</script>

<style scoped>
.v-icon.v-icon::after {
  background-color: transparent;
}

.arrow-down {
  animation-name: attention;
  animation-duration: 2s;
  animation-iteration-count: infinite;
}

@keyframes attention {
  50% {
    opacity: 0.5;
  }
}
</style>
