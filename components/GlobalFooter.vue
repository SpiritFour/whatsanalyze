<template>
  <div class="foot py-7 additional-height">
    <h3 v-for="post in posts" :key="post.to" class="my-3">
      <nuxt-link :to="post.name">
        {{ $t(post.text) }}
      </nuxt-link>
    </h3>

    <hr color="white" width="70%" />

    <div class="my-5">{{ $t("love") }}</div>

    <a
      class="black--text"
      href="https://github.com/SpiritFour/whatsanalyze"
      target="_blank"
    >
      <img
        alt="github logo"
        height="22"
        src="/img/github/GitHub-Mark-Light-32px.png"
        style="vertical-align: sub"
      />
      <span v-html="$t('openSource')"></span>
    </a>
    <br />

    <div>
      <h3>
        <img
          alt="whatsanalyze logo"
          height="32px"
          src="~//whatsanalyze-logo-white.png"
          style="vertical-align: sub"
        />
        WhatsAnalyze
      </h3>

      <h3 class="mt-5" style="height: 70px">
        &copy; {{ new Date().getFullYear() }} -
        <nuxt-link to="/about">About</nuxt-link>
        -
        <nuxt-link to="/impressum">Imprint</nuxt-link>
        -
        <nuxt-link to="/subscribe">Subscriptions</nuxt-link>
      </h3>
    </div>
  </div>
</template>
<script>
export default {
  name: "GlobalFooter",
  data() {
    return {
      posts: [
        // {
        //   name: "whatsapp-to-pdf",
        //   text: "Create a PDF from your WhatsApp chat",
        // },
        {
          name: "switch-from-whatsapp-to-signal",
          text: "pageNameSignal"
        },
        {
          name: "how-to-export-your-whatsapp-chat",
          text: "pageNameExport"
        }
      ]
    };
  }
};
</script>
<style scoped>
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
