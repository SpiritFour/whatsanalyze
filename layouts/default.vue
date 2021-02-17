<template>
  <v-app>
    <div class="nav">
      <h1>
        <img
          src="@/assets/images/chat-24px.svg"
          height="40px"
          alt="chat icon"
          style="vertical-align: bottom"
        />
        WhatsAnalyse
      </h1>
      <h4>- The Chat Visualization Tool</h4>

      <!-- Menu items -->
      <!-- <span style="float: right; margin-right: 15vw; vertical-align: bottom; margin-top: 0.66em">
             <h3>link1</h3>
             <h3>link2</h3>
             <h3>link3</h3>
        </span> -->
    </div>

    <v-main style="margin: 6em 0; overflow: auto">
      <v-container>
        <nuxt />
      </v-container>
    </v-main>

    <v-footer absolute app class="footer">
      <h3>
        WhatsAnalyse
        <span>&copy; {{ new Date().getFullYear() }}</span>
      </h3>
    </v-footer>
  </v-app>
</template>

<style scoped lang="scss">
.nav {
  padding: 1em;
  position: absolute;
  width: 100vw;
  left: 0;
  height: 5em;
  top: 0;
  background: $red;
  color: $white;
}

h1,
h2,
h3,
h4 {
  display: inline;
}

h4 {
  font-size: 1.2em;
  vertical-align: text-bottom;
}

.nav h1 {
  margin-left: 15vw;
}

h3 {
  margin-right: 5vh;
}
</style>
