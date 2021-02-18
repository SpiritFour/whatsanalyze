<template>
  <v-main>
    <div style="margin-bottom: 10em">
      <h1 style="font-size: 3em">Analyse your WhatsApp Chat</h1>
      <p style="font-size: 2em">Now drag your .txt file in the area below</p>
      <p>No data is sent to a server and will never be saved.</p>

      <br />
      <FileHandler @new_messages="chat_ = new Chat($event)" />
    </div>

    <div v-show="!isShowingCharts" class="explainer-container">
      <div>
        <h2 style="font-size: 3em">How it works</h2>
        <div class="explainer-list">
          <p>1. Export your chat</p>
          <p>2. Drag chat file into box above</p>
          <p>3. Enjoy beautiful visualizations</p>
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

        <p>Tab on the box above and select your file. Wait for 2 seconds.</p>
      </div>

      <div class="explainer">
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2250&q=80"
          alt="How to export your WhatsApp chat"
        />
        <h2>Enjoy beautiful visuaizations</h2>

        <p>
          Learn who you really are and how you communicate with your friends.
          Reveal never know facts!.
        </p>
      </div>

      <div class="explainer">
        <img
          src="https://images.unsplash.com/photo-1472746729193-36ad213ac4a5?ixid=MXwxMjA3fDB8MHxzZWFyY2h8MXx8ZnJpZW5kcyUyMHNoYXJlfGVufDB8fDB8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
          alt="How to export your WhatsApp chat"
        />
        <h2>Share results with friends</h2>

        <p>
          Impress your friends with real data. Know you know who writes the most
          messages, uses wich emojies and more.
        </p>
      </div>
    </div>

    <div style="text-align: center" class="testimonial-container">
      <h2 style="text-align: center">
        People who analyse their chats - get first hand data insights
      </h2>

      <div style="overflow: hidden">
        <div class="testimonial">
          <v-icon large color="black"> mdi-format-quote-close </v-icon>
          <p>Jennifer says</p>
          <p>
            Visualizing my friends chat revealed a lot about our relationship. I
            always though that I was the one sending more messages. Really nice
            to see all those fun facts about our history. Keep it going and add
            more beautiful visuals
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
            Amazing to see a whole whatsapp history at a glance. I have chats
            going back multiple years seeing how the relationship is mirrored in
            the chat is amazing. I love that my files are not uploaded and that
            it runs directly in my browser
          </p>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
        </div>
      </div>
    </div>

    <div class="cta-bottom">
      <h1 style="text-align: center">Start now</h1>
      <span>
        Analyse your chat, reveal unknown facts and surprise your friends with
        insights into your communication.</span
      >
      <br />
      <v-btn to="#drop" color="#07bc4c" style="color: #ffffff" class="my-5">
        Analyse my chat
      </v-btn>
    </div>

    <Content :page="page" class="main-el mt-15" />

    <div v-show="isShowingCharts">
      <DonughtChart :chartdata="chat_" />
    </div>
  </v-main>
</template>

<script>
import { Chat } from "~/functions/transformChatData";

export default {
  async asyncData({ $content }) {
    const page = await $content("home").fetch();
    console.log(page);
    return {
      page,
    };
  },

  data() {
    return {
      isShowingCharts: false,
      isStripeLoaded: false,
      chat_: new Chat(),
    };
  },
  methods: { Chat },
};
</script>

<style scoped lang="scss">
.a {
  color: $c-blue-accent;
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
@media (max-width: 759px) {
  .testimonial {
    width: 100%;
    padding: 3em;
  }
  .explainer {
    float: none;
    padding: 2em;
  }
  .explainer-list p {
    margin-top: 1em;
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
}
@media (max-width: 759px) {
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
