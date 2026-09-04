<template>
  <div v-if="chat">
    <v-col v-if="$vuetify.display.smAndUp">
      <v-row>
        <v-spacer></v-spacer>
        <v-col cols="12" sm="6" xl="5">
          <ChartsBarChart
            :chartdata="chat"
            :options="barchartHeaderChartOptions"
            data-grouping="hourly"
          />
          <div class="mx-3 mt-3 text-body-1 text-xl-h6 font-weight-bold">
            {{ $t("exampleGraphSubtitle1") }}
          </div>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="12" sm="6" xl="5">
          <ChartsDonughtChart
            :chartdata="chat"
            :options="donoughtHeaderChartOptions"
          />
          <div class="mx-3 mt-3 text-body-1 text-xl-h6 font-weight-bold">
            {{ $t("exampleGraphSubtitle2") }}
          </div>
        </v-col>
        <v-spacer></v-spacer>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-img src="/example-fun-facts.png"></v-img>
        </v-col>
      </v-row>
    </v-col>
    <v-col v-else class="py-0">
      <v-carousel
        :continuous="true"
        :cycle="false"
        :show-arrows="true"
        height="280"
        hide-delimiter-background
      >
        <v-carousel-item>
          <div class="carousel-slide-content">
            <ChartsBarChart
              :chartdata="chat"
              :options="barchartHeaderChartOptions"
              data-grouping="hourly"
            />
          </div>
        </v-carousel-item>

        <v-carousel-item>
          <div class="carousel-slide-content">
            <ChartsWordCloud :chartdata="chat" />
          </div>
        </v-carousel-item>

        <v-carousel-item>
          <div class="carousel-slide-content">
            <ChartsDonughtChart
              :chartdata="chat"
              :options="donoughtHeaderChartOptions"
            />
          </div>
        </v-carousel-item>
        <v-carousel-item>
          <div class="carousel-slide-content">
            <ChartsRadarChart
              :chartdata="chat"
              :options="radarchartHeaderChartOptions"
            />
          </div>
        </v-carousel-item>
      </v-carousel>
    </v-col>
  </div>
</template>
<script>
import { Chat } from "~/utils/transformChatData";

export default {
  name: "ExampleGraphs",
  data() {
    return {
      chat: undefined,
      linegraphHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        elements: {
          line: {
            tension: 1,
          },
          point: {
            hitRadius: 5,
          },
        },
        plugins: {
          tooltip: { enabled: false },
          legend: {
            position: "top",
            labels: {
              font: {
                weight: "bold",
                size: 10,
              },
              color: "rgb(51,51,51)",
            },
          },
        },
        scales: {
          x: {
            type: "time",
            grid: {
              display: false,
              color: "#FFFFFF",
            },
            ticks: {
              color: "rgb(51,51,51)",
              font: {
                weight: "bold",
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            display: false,
            ticks: {
              precision: 0,
              stepSize: 1,
            },
            grid: {
              display: false,
              color: "#FFFFFF",
            },
          },
        },
      },
      donoughtHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          tooltip: { enabled: true },
          legend: {
            position: "bottom",
            labels: {
              font: {
                weight: "bold",
                size: 10,
              },
              color: "rgb(51,51,51)",
            },
          },
        },
      },
      radarchartHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            angleLines: {
              color: "rgb(51,51,51)",
            },
            ticks: {
              display: false,
            },
            grid: {
              color: "rgb(51,51,51)",
            },
            pointLabels: {
              color: "rgb(51,51,51)",
            },
          },
        },
        plugins: {
          tooltip: { enabled: false },
          legend: {
            position: "top",
            labels: {
              font: {
                weight: "bold",
                size: 10,
              },
              color: "rgb(51,51,51)",
            },
          },
        },
      },
      barchartHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          tooltip: { enabled: true },
          legend: {
            position: "bottom",
            labels: {
              font: {
                weight: "bold",
                size: 10,
              },
              color: "rgb(51,51,51)",
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "rgb(51,51,51)",
            },
          },
          y: {
            beginAtZero: true,
            display: false,
            ticks: {
              precision: 0,
            },
            grid: {
              display: false,
            },
          },
        },
      },
    };
  },
  created() {
    // eslint-disable-next-line no-undef
    if (import.meta.client) {
      fetch("/example-results.json")
        .then((response) => response.text())
        .then((messages) => {
          var instance = new Chat();
          var serializedObject = JSON.parse(messages);
          Object.assign(instance, {
            _lineGraphData: Promise.resolve(serializedObject[0]),
            _funfacts: Promise.resolve(serializedObject[1]),
            _allWords: Promise.resolve(serializedObject[2]),
            _hourlyData: Promise.resolve(serializedObject[3]),
            _dailyData: Promise.resolve(serializedObject[4]),
            _weeklyData: Promise.resolve(serializedObject[5]),
            _shareOfSpeech: Promise.resolve(serializedObject[6]),
          });
          this.chat = instance;
        });
    }
  },
};
</script>
<style lang="scss">
.carousel-slide-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 8px 48px 24px 48px;
  box-sizing: border-box;
}

.v-carousel__controls__item {
  margin: 0 8px !important;
  width: 7px !important;
  height: 7px !important;
}

.col {
  padding: 1em !important;
}

.v-image {
  margin-bottom: 50px;
}

@media (min-width: 760px) {
}

@media (min-width: 760px) {
  .explainer-list p {
    margin-right: 10%;
    display: inline;
  }
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
  .explainer-list p {
    display: inline;
    padding: 1em;
    width: 33%;
  }
}
</style>
