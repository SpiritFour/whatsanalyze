<template>
  <div class="header-cta pl-16">
    <v-row no-gutters>
      <v-col class="below-nav header-left" cols="12" md="6">
        <h1>Analyze your WhatsApp Chat in seconds</h1>
        <h2 style="font-size: 1.3em">
          Insights and stats of your WhatsApp Chats generated locally on your
          computer.
        </h2>
        <br />
        <p
          style="
            background: rgba(0, 0, 0, 0.2);
            color: white;
            border-radius: 5px;
            width: fit-content;
          "
          class="py-1 px-3"
        >
          <v-icon color="white" style="vertical-align: sub">
            mdi-security
          </v-icon>
          <strong>No</strong> chat <strong>data</strong> is sent to a server it
          runs only <strong>locally</strong> in your browser.
        </p>
      </v-col>
      <v-col cols="12" md="6">
        <v-row no-gutters>
          <v-col cols="1" v-show="$vuetify.breakpoint.mdAndUp"> </v-col>
          <v-col md="8" xs="12" class="pr-10">
            <LineChart class="header-right" :chartdata="chat_" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  props: ["chat_"],
};
</script>

<style scoped lang="scss">
.header-cta {
  background: $c-blue-accent;
  overflow: hidden;
}

.header-left {
  float: left;
}

.header-right {
  background: $c-blue-accent;
}

.below-nav {
  background: $c-blue-accent;
}
</style>
