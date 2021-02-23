<template>
  <div>
    <p style="font-size: 3em" class="text-h2 text-center">How it works</p>
    <v-row class="explainer-list my-10">
      <v-col cols="4" class="text-h5 text-center">
        <v-icon large color="teal"> mdi-file-export </v-icon>
        Export your chat
      </v-col>
      <v-col cols="4" class="text-h5 text-center">
        <v-icon large color="light-blue darken-3"> mdi-cog </v-icon>
        Drag chat file into box above
      </v-col>
      <v-col cols="4" class="text-h5 text-center">
        <v-icon large color="amber darken-2">
          mdi-emoticon-happy-outline
        </v-icon>
        Enjoy beautiful visualizations
      </v-col>
    </v-row>

    <v-timeline align-top :dense="$vuetify.breakpoint.smAndDown">
      <v-timeline-item
        v-for="(item, i) in items"
        :key="i"
        :color="item.color"
        :icon="item.icon"
        :title="item.title"
        :text="item.text"
        :text2="item.text2"
        :text3="item.text3"
        :imageSrc="item.imageSrc"
        :imageAlt="item.imageAlt"
        fill-dot
      >
        <v-card :color="item.color" dark>
          <v-card-title class="title"> {{ item.title }} </v-card-title>
          <v-card-text
            style="float: left; text-align: left"
            class="white text--primary"
          >
            <p class="text-body-1">
              <v-img
                style="float: left; margin-right: 2rem"
                max-height="147"
                max-width="250"
                :src="item.imageSrc"
              />
              <br />
              {{ item.text }}
              <br />
              {{ item.text2 }}
              <br />
              {{ item.text3 }}
            </p>
          </v-card-text>
        </v-card>
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        {
          color: "cyan darken-1",
          icon: "mdi-file-export",
          text: " 1. Open the (group) chat.",
          text2: "2. Tap More options > More > Export chat.",
          text3: "3. Choose to export without media.",
          title: "Export your chat",
          imageSrc:
            "https://images.unsplash.com/photo-1611746869696-d09bce200020?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2250&q=80",
          imageAlt: "How to export your WhatsApp Signal Telegram Threema chat",
        },
        {
          color: "red darken-1",
          icon: "mdi-file",
          text: "Tab on the box above and select your chat .txt file.",
          title: "Drag file into box above",
          imageSrc:
            "https://images.unsplash.com/photo-1611095567219-8fa7d4d8bf48?ixid=MXwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=3302&q=80",
          imageAlt: "How to export your WhatsApp chat",
        },
        {
          color: "teal lighten-1",
          icon: "mdi-chart-box",
          text:
            "Learn who you really are and how you communicate with your friends. Reveal never know facts!. ",
          title: "Enjoy beautiful visualizations",
          imageSrc:
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2250&q=80",
          imageAlt: "How to export your WhatsApp chat",
        },
        {
          color: "amber",
          icon: "mdi-share",
          text:
            "Impress your friends with real data. Stun them with data, who writes the most messages, what emojis are most used and much more. ",
          title: "Share the results with your friends",
          imageSrc:
            "https://images.unsplash.com/photo-1472746729193-36ad213ac4a5?ixid=MXwxMjA3fDB8MHxzZWFyY2h8MXx8ZnJpZW5kcyUyMHNoYXJlfGVufDB8fDB8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
          imageAlt: "How to export your WhatsApp chat",
        },
      ],
    };
  },
};
</script>

<style></style>
