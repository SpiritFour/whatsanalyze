<template>
  <div class="foot py-7 additional-height">
    <h3 class="my-3" v-for="post in posts" :key="post.to">
      <nuxt-link :to="post.name">
        {{ $t(post.text) }}
      </nuxt-link>
    </h3>

    <hr width="70%" color="white" />

    <div class="my-5">{{ $t("love") }}</div>

    <a
      class="black--text"
      target="_blank"
      href="https://github.com/SpiritFour/whatsanalyze"
    >
      <img
        height="22"
        style="vertical-align: sub"
        alt="github logo"
        src="~/assets/img/github/GitHub-Mark-Light-32px.png"
      />
      <span v-html="$t('openSource')"></span>
    </a>
    <br />

    <v-container>
      <h3>
        <img
          src="~/assets/whatsanalyze-logo-white.png"
          height="32px"
          alt="whatsanalyze logo"
          style="vertical-align: sub"
        />
        WhatsAnalyze
      </h3>

      <h3 class="mt-5" style="height: 70px">
        &copy; {{ new Date().getFullYear() }} -
        <nuxt-link to="/about">About</nuxt-link> -
        <nuxt-link to="/impressum">Impressum</nuxt-link>
      </h3>
    </v-container>
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
          text: "pageNameSignal",
        },
        {
          name: "how-to-export-your-whatsapp-chat",
          text: "pageNameExport",
        },
      ],
    };
  },
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
