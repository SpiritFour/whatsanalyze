<template>
  <v-main>
    <div style="margin-bottom: 10em">
      <h1 style="font-size: 3em">Analyse your WhatsApp Chat</h1>
      <p style="font-size: 2em">Now drag your .txt file in the area below</p>
      <v-alert dense text type="success" dismissible>
        <strong>No</strong> chat <strong>data</strong> is sent to a server it
        runs all <strong>locally</strong> in your browser
      </v-alert>

      <br />
      <FileHandler
        @new_messages="chat_ = new Chat($event)"
        @hide_explanation="isShowingChats = $event"
      />
    </div>

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
                <p>
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

      <div style="text-align: center" class="testimonial-container">
        <h2 style="text-align: center">
          People who analyse their chats - get first hand data insights
        </h2>

        <div style="overflow: hidden">
          <div class="testimonial">
            <v-icon large color="black"> mdi-format-quote-close </v-icon>
            <p>Jennifer says</p>
            <p>
              Visualizing my friends chat revealed a lot about our relationship.
              I always though that I was the one sending more messages. Really
              nice to see all those fun facts about our history. Keep it going
              and add more beautiful visuals
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
              going back multiple years seeing how the relationship is mirrored
              in the chat is amazing. I love that my files are not uploaded and
              that it runs directly in my browser
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
    <h2 style="font-size: 3em">FAQ about WhatsApp chat</h2>
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-header>
          How to export your WhatsApp chat
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          Everyone can easily export his whatsapp chat or group chat. Open
          WhatsApp on the device you are currently logged in with > Tap on the
          chat > Go to the chats settings > Scroll down and tap on Export chat >
          Choose to export with or without media.
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          How to export your WhatsApp group chat
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          Exporting your WhatsApp group chat works like a normal chat. Open up
          Whatsapp with the device that you are logged in with. Go to the chat
          and tap on "More" and then Export chat. You can now choose to export
          the chat with or without Media.
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          How to Archive all Whatsapp chats on iOS
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          On iOS you can Archive your WhatsApp chats by opening WhatsApp then
          tap on "Settings" in the Navigation bar. Tap on chats and then Archive
          All Chats.
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          How to Archive all Whatsapp chats on Android
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          On Android open WhatsApp then tap on the three-dot icon at the top
          right corner. Tap on "Settings" and then "Chats". On the new View tap
          "Chat history" and "Archive all chats".
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          How to Backup Whatsapp chat on iOS including iOS 14
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          By backing up your WhatsApp chat on your Iphone you can load your
          account to a new device easily. Open WhatsApp, tap on "Settings" at
          the bottom-right corner. Then tap on "Chats" and "Chat Backup" next
          press "Back Up Now"
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          How to Backup Whatsapp chat on Android
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          to Backup Whatsapp chat on your Android device, tap on the three-dots
          at the top-right of your screen. Tap on "Settings and then on "Chats".
          Next press on "Chat backup" and on the next screen "Back Up" Button
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          How to transfer Whatsapp Group Chats to Signal
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          Create a group in Signal with your whatsApp contacts, now click on the
          group or on the three-dots at the top right. In the Settings view tap
          on group link copy the link. Finally go to whatsApp and paste the link
          in the chat box of the group you want to migrate.
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          How to transfer Whatsapp to Telegram
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          Open the chat you want to transfer in WhatsApp and tap on the
          three-dots at the top right corner. Select "Export Chat" and in the
          "Share menu" select Telegram. You can choose to export with or without
          media. You can repeat this step for all chats you would like to
          transfer.
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-main>
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
      items: [
        {
          color: "red lighten-2",
          icon: "mdi-file-export",
          text: " 1. Open the individual or group chat.",
          text2: "2. Tap More options > More > Export chat.",
          text3: "3. Choose to export without media.",
          title: "Export your WhatsApp chat",
          imageSrc:
            "https://images.unsplash.com/photo-1611746869696-d09bce200020?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2250&q=80",
          imageAlt: "How to export your WhatsApp Signal Telegram Threema chat",
        },
        {
          color: "purple darken-1",
          icon: "mdi-file",
          text: "Tab on the box above and select your chat .txt file.",
          title: "Open file with our tool",
          imageSrc:
            "https://images.unsplash.com/photo-1611095567219-8fa7d4d8bf48?ixid=MXwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=3302&q=80",
          imageAlt: "How to export your WhatsApp chat",
        },
        {
          color: "green lighten-1",
          icon: "mdi-chart-box",
          text:
            "Learn who you really are and how you communicate with your friends. Reveal never know facts!. ",
          title: "Enjoy beautiful visualizations",
          imageSrc:
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2250&q=80",
          imageAlt: "How to export your WhatsApp chat",
        },
        {
          color: "indigo",
          icon: "mdi-share",
          text:
            "Impress your friends with real data. Stun them with data, who writes the most messages, what emojis are most used and much more. ",
          title: "Share results with friends",
          imageSrc:
            "https://images.unsplash.com/photo-1472746729193-36ad213ac4a5?ixid=MXwxMjA3fDB8MHxzZWFyY2h8MXx8ZnJpZW5kcyUyMHNoYXJlfGVufDB8fDB8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
          imageAlt: "How to export your WhatsApp chat",
        },
      ],
    };
  },
  methods: { Chat },
};
</script>

<style lang="scss">
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
