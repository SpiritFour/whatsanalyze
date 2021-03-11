<template>
  <div class="foot py-7 additional-height">
    <h3 class="my-7">
      <nuxt-link :to="{ name: 'whatsapp-to-pdf' }">
        Export your WhatsApp Chat directly to PDF
      </nuxt-link>
    </h3>

    <hr width="70%" color="white" />
    <a
      class="black--text"
      target="_blank"
      href="https://github.com/SpiritFour/whatsanalyze"
    >
      <h3>
        <img
          style="vertical-align: sub"
          alt="github logo"
          src="~/assets/img/github/GitHub-Mark-Light-32px.png"
        />

        This project is <b>open-source</b> and all code is <b>public</b> on
        <b>github</b>
      </h3>
    </a>
    <br />

    <h3>
      <img
        src="~/assets/whatsanalyze-logo-white.png"
        height="32px"
        alt="whatsanalyze logo"
        style="vertical-align: sub"
      />
      WhatsAnalyze
    </h3>

    <h3 class="mt-5">&copy; {{ new Date().getFullYear() }}</h3>
  </div>
</template>
<script>
export default {
  name: "GlobalFooter",
};
</script>
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

.foot {
  padding: 1em;
  width: 100%;
  background: $c-blue-accent;
  color: $c-white;
  text-align: center;
}
</style>
