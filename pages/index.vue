<template>
  <div>
    <v-row no-gutters class="top-color">
      <v-col cols="12" md="6" class="px-16 pb-8">
        <HeaderCta />
        <FileHandler
          v-if="$vuetify.breakpoint.mdAndUp"
          @new_messages="chat_ = new Chat($event)"
          @hide_explanation="isShowingChats = $event"
        />
      </v-col>
      <v-col cols="12" md="6" class="px-16 pl-md-0">
        <LineChart
          class="header-right"
          :chartdata="chat_"
          :options="linegraphHeaderChartOptions"
        />
      </v-col>
    </v-row>
    <v-row v-if="$vuetify.breakpoint.smAndDown" class="top-color ma-0">
      <v-col>
        <FileHandler
          @new_messages="chat_ = new Chat($event)"
          @hide_explanation="isShowingChats = $event"
        />
      </v-col>
    </v-row>

    <v-container v-show="!isShowingChats" class="pt-16">
      <HowItWorks />
      <CtaMiddle />
      <Testimonials />
      <Content :page="page" />
      <CtaBottom />
      <Faq />
    </v-container>

    <v-container>
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
      linegraphHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: "bottom",
          labels: {
            fontStyle: "bold",
            fontColor: "black",
            fontSize: 15,
          },
        },

        scales: {
          xAxes: [
            {
              ticks: {
                fontColor: "black",
                fontStyle: "bold",
                fontSize: 11,
              },
              type: "time",
              time: {
                unit: "month",
              },
              gridLines: {
                display: false,
                zeroLineColor: "#ffffff",
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                fontStyle: "bold",

                fontColor: "black",
                fontSize: 11,
                beginAtZero: true,
              },
              scaleLabel: {
                display: true,
                labelString: "Messages",
                fontColor: "black",
                fontStyle: "bold",
              },
              gridLines: {
                display: false,
              },
            },
          ],
        },
        elements: {
          line: {
            tension: 0,
          },
        },
      },
    };
  },
  methods: { Chat },
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
