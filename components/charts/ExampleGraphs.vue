<template>
  <div v-if="chat">
    <v-col v-if="$vuetify.breakpoint.smAndUp">
      <v-row class="mt-10">
        <v-spacer></v-spacer>
        <v-col cols="12" sm="6" xl="5">
          <ChartsBarChart
            :chartdata="chat"
            :options="barchartHeaderChartOptions"
            data-grouping="hourly"
          />
          <div class="mx-3 mt-3 text-body-1 text-xl-h6 font-weight-bold">{{ $t("exampleGraphSubtitle1") }}
          </div>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="12" sm="6" xl="5">
          <ChartsDonughtChart
            :chartdata="chat"
            :options="donoughtHeaderChartOptions"
          />
          <div class="mx-3 mt-3 text-body-1 text-xl-h6 font-weight-bold">{{ $t("exampleGraphSubtitle2") }}
          </div>
        </v-col>
        <v-spacer></v-spacer>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-img src="example-fun-facts.png"></v-img>
        </v-col>
      </v-row>
    </v-col>
    <v-col v-else class="py-0">
      <v-carousel
        :continuous="true"
        :cycle="false"
        :show-arrows="true"
        height="auto"
        hide-delimiter-background
      >
        <v-carousel-item>
          <ChartsBarChart
            :chartdata="chat"
            :options="barchartHeaderChartOptions"
            data-grouping="hourly"
          />
        </v-carousel-item>

        <v-carousel-item>
          <v-container fill-height fluid>
            <v-row align="center" justify="center">
              <v-col>
                <ChartsWordCloud :chartdata="chat" />
              </v-col>
            </v-row>
          </v-container>
        </v-carousel-item>

        <!--        <v-carousel-item>-->
        <!--          <ChartsLineChart-->
        <!--            :chartdata="chat"-->
        <!--            :options="linegraphHeaderChartOptions"-->
        <!--          />-->
        <!--        </v-carousel-item>-->

        <v-carousel-item>
          <ChartsDonughtChart
            :chartdata="chat"
            :options="donoughtHeaderChartOptions"
          />
        </v-carousel-item>
        <v-carousel-item>
          <ChartsRadarChart
            :chartdata="chat"
            :options="radarchartHeaderChartOptions"
          />
        </v-carousel-item>
      </v-carousel>
    </v-col>
  </div>
</template>
<script>
import { Chat } from "~/functions/transformChatData";

export default {
  name: "ExampleGraphs",
  data() {
    return {
      chat: undefined,
      linegraphHeaderChartOptions: {
        tooltips: { enabled: false },
        hover: { mode: null },
        pointHitRadius: 5,
        responsive: true,
        maintainAspectRatio: true,
        lineTension: 1,
        legend: {
          position: "top",
          labels: {
            fontStyle: "bold",
            fontColor: "rgb(51,51,51)",
            fontSize: 10
          }
        },
        scales: {
          xAxes: [
            {
              type: "time",
              time: {},
              gridLines: {
                display: false,
                color: "#FFFFFF"
              },
              ticks: {
                fontColor: "rgb(51,51,51)",
                fontStyle: "bold",
                fontSize: 11
              }
            }
          ],
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: this.$t("messages"),
                fontColor: "rgb(51,51,51)",
                fontStyle: "bold",
                fontSize: 11
              },
              ticks: {
                precision: 0,
                stepSize: 1,
                beginAtZero: true,
                display: false
              },
              gridLines: {
                display: false,
                color: "#FFFFFF"
              }
            }
          ]
        },
        elements: {
          line: {
            tension: 0
          }
        }
      },
      donoughtHeaderChartOptions: {
        tooltips: { enabled: true },
        hover: { mode: null },
        responsive: true,
        maintainAspectRatio: true,
        legend: {
          position: "bottom",
          labels: {
            fontStyle: "bold",
            fontColor: "rgb(51,51,51)",
            fontSize: 10
          }
        },
        scales: {
          yAxes: [
            {
              scaleLabel: {
                display: false,
                labelString: this.$t("messages"),
                fontColor: "rgb(51,51,51)",
                fontStyle: "bold",
                fontSize: 11
              },
              ticks: {
                display: false
              },
              gridLines: {
                display: false
              }
            }
          ]
        }
      },
      radarchartHeaderChartOptions: {
        tooltips: { enabled: false },
        hover: { mode: null },
        responsive: true,
        maintainAspectRatio: true,
        scale: {
          angleLines: {
            // display: false,
            color: "rgb(51,51,51)"
          },
          ticks: {
            display: false
          },
          gridLines: {
            color: "rgb(51,51,51)"
          },

          pointLabels: {
            fontColor: "rgb(51,51,51)"
          }
        },
        legend: {
          position: "top",
          labels: {
            fontStyle: "bold",
            fontColor: "rgb(51,51,51)",
            fontSize: 10
          }
        }
      },
      barchartHeaderChartOptions: {
        tooltips: { enabled: true },
        hover: { mode: null },
        responsive: true,
        maintainAspectRatio: true,
        legend: {
          position: "bottom",
          labels: {
            fontStyle: "bold",
            fontColor: "rgb(51,51,51)",
            fontSize: 10
          }
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                fontColor: "rgb(51,51,51)"
              }
            }
          ],
          yAxes: [
            {
              scaleLabel: {
                display: false,
                labelString: this.$t("messages"),
                fontStyle: "bold",
                fontColor: "rgb(51,51,51)",
                fontSize: 10
              },
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                precision: 0,
                display: false
              }
            }
          ]
        }
      }
    };
  },
  created() {
    // eslint-disable-next-line no-undef
    if (process.client) {
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
            _shareOfSpeech: Promise.resolve(serializedObject[6])
          });
          this.chat = instance;
        });
    }
  }
};
</script>
<style lang="scss">
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
