<template>
  <v-app>
    <v-main style="overflow: auto; margin-bottom: 12em">
      <!-- <div class="nav pa-5">
        <h1>
          <img
            src="@/assets/images/chat-24px.svg"
            height="40px"
            alt="chat icon"
            style="vertical-align: bottom"
          />
          WhatsAnalyse
        </h1>

        <span
          style="
            float: right;
            margin-right: 15vw;
            vertical-align: bottom;
            margin-top: 0.66em;
          "
        >
          <h3>link1</h3>
          <h3>link2</h3>
          <h3>link3</h3>
          <h4
            style="margin-left: 5em"
            @click="$vuetify.theme.dark = !$vuetify.theme.dark"
          >
            {{ $vuetify.theme.dark ? "dark mode off" : "dark mode on" }}
          </h4>
        </span>
        <hr class="mt-4" />
      </div> -->

      <v-container style="margin-top: 8em">
        <nuxt />
      </v-container>
    </v-main>

    <div class="foot" style="text-align: center">
      <h3>
        WhatsAnalyse
        <span>&copy; {{ new Date().getFullYear() }}</span>
      </h3>
    </div>
  </v-app>
</template>

<style scoped lang="scss">
.nav {
  position: absolute;
  width: 100vw;
  left: 0;
  height: 6.5em;
  top: 0;
  background: $c-blue-accent;
  color: $c-white;
}
.foot {
  padding: 1em;
  position: absolute;
  width: 100vw;
  height: 5em;
  bottom: 0;
  background: $c-blue-accent;
  color: $c-white;
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
