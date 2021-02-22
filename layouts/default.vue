<template>
  <v-app>
    <v-main style="overflow: auto; margin-bottom: 12em">
      <div class="nav pa-5">
        <nuxt-link to="/">
          <h1 style="color: white">
            <img
              src="@/assets/images/chat-24px.svg"
              height="40px"
              alt="chat icon"
              style="vertical-align: bottom"
            />
            WhatsAnalyse
          </h1>
        </nuxt-link>
      </div>

      <v-container style="margin-top: 8em">
        <nuxt />
      </v-container>
    </v-main>

    <div class="foot" style="text-align: center">
      <div style="margin-top: 1em">
        <h3>
          <nuxt-link :to="{ name: 'whatsapp-signal' }"
            >Switch from Signal to Whatsapp and keep your data
          </nuxt-link>
        </h3>
      </div>

      <hr
        width="40%"
        color="white"
        style="margin: auto; margin-top: 2em; margin-bottom: 1em"
      />
      <h3>
        WhatsAnalyse
        <span>&copy; {{ new Date().getFullYear() }}</span>
      </h3>
    </div>
  </v-app>
</template>

<style scoped lang="scss">
a:link {
  color: $c-blue;
  text-decoration: none;
}
a:visited {
  color: $c-blue;
}
a:hover {
  color: $c-blue-dark;
}

.nav {
  position: absolute;
  width: 100vw;
  left: 0;
  height: 5.5em;
  top: 0;
  background: $c-blue-accent;
  color: $c-white;
}
.foot {
  padding: 1em;
  position: absolute;
  width: 100vw;
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
