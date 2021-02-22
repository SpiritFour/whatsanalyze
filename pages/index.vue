<template>
  <div>
    <div
      class="header-cta"
      :style="'height:' + ($vuetify.breakpoint.mdAndUp ? '35vh' : '55vh')"
    >
      <div
        class="below-nav header-left"
        :class="{
          'pt-5': $vuetify.breakpoint.smAndDown,
          'pt-15': $vuetify.breakpoint.mdAndUp,
          'small-h1': $vuetify.breakpoint.smAndDown,
          'small-h2': $vuetify.breakpoint.smAndDown,
        }"
      >
        <h1>Analyze your WhatsApp Chat in seconds</h1>
        <h2 style="font-size: 1.3em">
          Insights and stats of your WhatsApp Chats generated locally on your
          computer.
        </h2>
        <br />
        <p>
          <v-icon color="black" style="vertical-align: sub">
            mdi-security
          </v-icon>
          All data about your chat stays on your device. Nowhere else.
        </p>
      </div>
      <LineChart class="header-right" :chartdata="chat_" />
    </div>

    <FileHandler
      :style="'height:' + ($vuetify.breakpoint.mdAndUp ? '40vh' : '20vh')"
      @new_messages="chat_ = new Chat($event)"
      @hide_explanation="isShowingChats = $event"
    />

    <v-container style="padding-top: 8em">
      <div v-show="!isShowingChats">
        <div class="explainer-container">
          <div>
            <h2 style="font-size: 3em">How it works</h2>
            <div class="explainer-list">
              <p>
                <v-icon large color="teal"> mdi-file-export </v-icon>
                1. Export your chat
              </p>
              <p>
                <v-icon large color="light-blue darken-3"> mdi-cog </v-icon>

                2. Drag chat file into box above
              </p>
              <p>
                <v-icon large color="amber darken-2">
                  mdi-emoticon-happy-outline
                </v-icon>
                3. Enjoy beautiful visualizations
              </p>
            </div>
          </div>

          <div class="explainer">
            <img
              src="https://images.unsplash.com/photo-1611746869696-d09bce200020?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2250&q=80"
              alt="How to export your WhatsApp chat"
            />
            <h2>Export your WhatsApp chat</h2>

            <p>
              - Open the individual or group chat. <br />
              - Tap More options > More > Export chat. <br />
              - Choose whether to export with media or without media.
            </p>
          </div>

          <div class="explainer">
            <img
              src="https://images.unsplash.com/photo-1611095567219-8fa7d4d8bf48?ixid=MXwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=3302&q=80"
              alt="How to export your WhatsApp chat"
            />
            <h2>Open file with our tool</h2>

            <p>
              Tab on the box above and select your file. Wait for 2 seconds.
            </p>
          </div>

          <div class="explainer">
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2250&q=80"
              alt="How to export your WhatsApp chat"
            />
            <h2>Enjoy beautiful visuaizations</h2>

            <p>
              Learn who you really are and how you communicate with your
              friends. Reveal never know facts!.
            </p>
          </div>

          <div class="explainer">
            <img
              src="https://images.unsplash.com/photo-1472746729193-36ad213ac4a5?ixid=MXwxMjA3fDB8MHxzZWFyY2h8MXx8ZnJpZW5kcyUyMHNoYXJlfGVufDB8fDB8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
              alt="How to export your WhatsApp chat"
            />
            <h2>Share results with friends</h2>

            <p>
              Impress your friends with real data. Know you know who writes the
              most messages, uses wich emojies and more.
            </p>
          </div>
        </div>

        <div style="text-align: center" class="testimonial-container">
          <h2 style="text-align: center">
            People who analyze their chats - get first hand data insights
          </h2>

          <div style="overflow: hidden">
            <div class="testimonial">
              <v-icon large color="black"> mdi-format-quote-close </v-icon>
              <p>Jennifer says</p>
              <p>
                Visualizing my friends chat revealed a lot about our
                relationship. I always though that I was the one sending more
                messages. Really nice to see all those fun facts about our
                history. Keep it going and add more beautiful visuals
              </p>
              <v-icon large color="#ffd782"> mdi-star </v-icon>
              <v-icon large color="#ffd782"> mdi-star </v-icon>
              <v-icon large color="#ffd782"> mdi-star </v-icon>
              <v-icon large color="#ffd782"> mdi-star </v-icon>
              <v-icon large color="#ffd782"> mdi-star </v-icon>
            </div>
            <div class="testimonial">
              <v-icon large color="black"> mdi-format-quote-close </v-icon>
              <p>Lara says</p>
              <p>
                Amazing to see a whole whatsapp history at a glance. I have
                chats going back multiple years seeing how the relationship is
                mirrored in the chat is amazing. I love that my files are not
                uploaded and that it runs directly in my browser
              </p>
              <v-icon large color="#ffd782"> mdi-star </v-icon>
              <v-icon large color="#ffd782"> mdi-star </v-icon>
              <v-icon large color="#ffd782"> mdi-star </v-icon>
              <v-icon large color="#ffd782"> mdi-star </v-icon>
              <v-icon large color="#ffd782"> mdi-star </v-icon>
            </div>
          </div>
        </div>

        <Cta />

        <Content :page="page" class="main-el mt-15" />

        <Cta />
      </div>

      <Results :chat_="chat_" />
    </v-container>
  </div>
</template>

<script>
import { Chat } from "~/functions/transformChatData";

export default {
  async asyncData({ $content }) {
    const page = await $content("home").fetch();
    return {
      page,
    };
  },

  data() {
    return {
      isShowingChats: false,
      chat_: new Chat(),
    };
  },
  methods: { Chat },
};
</script>

<style lang="scss">
.header-cta {
  overflow: hidden;
}
.header-left {
  float: left;

  width: 60vw;
}

.header-right {
  float: left;
  width: 40vw;
  background: $c-blue-accent;
}

.below-nav {
  background: $c-blue-accent;
  padding: 5% !important;
}
.v-btn {
  text-transform: none !important;
}

@media (min-width: 760px) {
  .testimonial {
    min-width: 300px;
    width: 50%;
    float: left;
    padding: 3em;
  }
}

@media (min-width: 760px) {
  .testimonial {
    min-width: 300px;
    width: 50%;
    float: left;
    padding: 3em;
  }
  .explainer {
    min-width: 150px;
    max-width: 25%;
    float: left;
    padding: 1em;
  }
  .explainer-list p {
    margin-right: 10%;
    display: inline;
  }
}

.cta-bottom {
  text-align: center;
  background: $c-white;
  padding: 1em;
  margin-top: 2em;
  margin-bottom: 2em;
}

.main-el {
  margin-top: 1em;
  margin-bottom: 1em;
}
.explainer-list {
  overflow: hidden;
  margin-left: 10%;
  margin-bottom: 40px;
  margin-top: 20px;
}
.explainer-list p {
  font-size: 1.2em;
}

.explainer-container {
  overflow: hidden;
  margin: auto;
  text-align: center;
}

.explainer h2 {
  min-height: 3em;
}

.explainer img {
  max-height: 200px;
  padding: 1em;
}

@media (min-width: 761px) {
  .explainer {
    min-width: 150px;
    max-width: 25%;
    float: left;
    padding: 3em;
  }
  .explainer-list p {
    display: inline;
    padding: 1em;
    width: 33%;
  }
  .testimonial {
    width: 100%;
    padding: 3em;
  }
}

.cta-bottom {
  text-align: center;
  background: $c-white;
  padding: 1em;
  margin-top: 2em;
  margin-bottom: 2em;
}

.main-el {
  margin-top: 1em;
  margin-bottom: 1em;
}
</style>
