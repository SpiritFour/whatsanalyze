<template>
  <div>
    <div class="top-color">
      <v-container>
        <v-row no-gutters>
          <v-col
            cols="12"
            :md="isShowingChats ? 12 : 6"
            class="px-0 px-md-16 pb-8"
          >
            <HeaderCta />
            <FileHandler
              id="fileHandler"
              v-if="$vuetify.breakpoint.mdAndUp"
              @new_messages="newMessages"
              @hide_explanation="isShowingChats = $event"
            />
          </v-col>
          <v-col v-if="!isShowingChats" cols="12" md="6">
            <ChartsExampleGraphs :chat_="chat_" />
          </v-col>
        </v-row>
        <v-row v-if="$vuetify.breakpoint.smAndDown" class="top-color ma-0">
          <v-col>
            <FileHandler
              id="fileHandler"
              @new_messages="newMessages"
              @hide_explanation="isShowingChats = $event"
            />
          </v-col>
        </v-row>
      </v-container>
    </div>

    <v-container v-show="!isShowingChats" class="pt-16">
      <ExportExplainer />
      <Cta />
      <Faq />
      <Testimonials />
      <Cta
        title="Analyze your own WhatsApp data now"
        buttonText="Analyze my chat"
        text="Interested about your own chat data? Reveal some interesting facts now.
      Start with figuring out how many toilet rolls would be needed to print
      your whole chat. Take deep dive in your data now!."
      />
    </v-container>
    <v-container v-if="isShowingChats">
      <ChartsResults :chat_="chat_" />
      <v-row align="center" justify="center" class="mb-3">
        <form
          action="https://www.paypal.com/donate"
          method="post"
          target="_top"
        >
          <input type="hidden" name="hosted_button_id" value="EPCYG8WEF289G" />
          <input
            type="image"
            src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
            border="0"
            name="submit"
            title="PayPal - The safer, easier way to pay online!"
            alt="Donate with PayPal button"
          />
          <img
            alt=""
            border="0"
            src="https://www.paypal.com/en_US/i/scr/pixel.gif"
            width="1"
            height="1"
          />
        </form>
      </v-row>
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
  methods: {
    Chat,
    newMessages(messages) {
      this.chat_ = new Chat(messages);
    },
  },
};
</script>

<style lang="scss">
.top-color {
  background-color: $c-blue-accent;
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

.explainer-list {
  overflow: hidden;
  margin-left: 10%;
  margin-bottom: 40px;
  margin-top: 20px;
}
.explainer-list p {
  font-size: 1.2em;
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
