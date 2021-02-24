<template>
  <v-app>
    <div class="nav pl-xs-8 pl-0 py-8">
      <v-container>
        <nuxt-link to="/">
          <h1 style="color: black; font-size: 2em" class="pl-md-16">
            <img
              src="@/assets/whatsanalyze-logo-black.png"
              height="40px"
              alt="chat icon"
              style="vertical-align: sub"
              class="pr-3"
            />
            WhatsAnalyze
          </h1>
        </nuxt-link>
      </v-container>
    </div>

    <v-main>
      <nuxt />
    </v-main>

    <div class="foot py-7">
      <h3 class="my-7">
        <nuxt-link :to="{ name: 'whatsapp-signal' }">
          Switch from Signal to Whatsapp and keep your data
        </nuxt-link>
      </h3>

      <hr width="70%" color="white" />
      <h3>
        <img
          src="@/assets/whatsanalyze-logo-white.png"
          height="22px"
          alt="whatsanalyze logo"
          style="vertical-align: sub"
        />
        WhatsAnalyze
      </h3>

      <h3 class="mt-5">&copy; {{ new Date().getFullYear() }}</h3>
    </div>
  </v-app>
</template>

<style lang="scss" scoped>
hr {
  margin: auto;
  margin-top: 1em;
  margin-bottom: 1em;
  border-top: none;
}

a:link {
  color: $c-white !important;
  text-decoration: none;
}
a:visited {
  color: $c-white !important;
}
a:hover {
  color: $c-blue-dark !important;
}

.small-h1 h1 {
  font-size: 2em !important;
}
.small-h2 h2 {
  font-size: 1.3em !important;
}

.nav {
  width: 100%;
  background: $c-blue-accent;
}

.mobile {
  margin: 0 !important;
}

h1 {
  font-size: 3em;
}

h2 {
  font-size: 2em;
  font-weight: 400;
}

.foot {
  padding: 1em;
  width: 100vw;
  background: $c-blue-accent;
  color: $c-white;
  text-align: center;
}
</style>
