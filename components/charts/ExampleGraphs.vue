<template>
  <div>
    <v-col v-if="$vuetify.breakpoint.smAndUp">
      <v-row>
        <v-col cols="12" sm="6">
          <ChartsLineChart
            :chartdata="chat_"
            :options="linegraphHeaderChartOptions"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <ChartsDonughtChart
            :chartdata="chat_"
            :options="donoughtHeaderChartOptions"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" sm="6">
          <ChartsRadarChart
            :chartdata="chat_"
            :options="radarchartHeaderChartOptions"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <ChartsBarChart
            :chartdata="chat_"
            :options="barchartHeaderChartOptions"
            dataGrouping="hourly"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <ChartsWordCloud :chartdata="chat_" />
        </v-col>
      </v-row>
    </v-col>
    <v-col v-else>
      <v-carousel
        :continuous="true"
        :cycle="false"
        :show-arrows="false"
        hide-delimiter-background
        height="100vw"
      >
        <v-carousel-item>
          <ChartsLineChart
            :chartdata="chat_"
            :options="linegraphHeaderChartOptions"
          />
        </v-carousel-item>
        <v-carousel-item>
          <ChartsDonughtChart
            :chartdata="chat_"
            :options="donoughtHeaderChartOptions"
          />
        </v-carousel-item>
        <v-carousel-item>
          <ChartsRadarChart
            :chartdata="chat_"
            :options="radarchartHeaderChartOptions"
          /> </v-carousel-item
        ><v-carousel-item>
          <ChartsBarChart
            :chartdata="chat_"
            :options="barchartHeaderChartOptions"
            dataGrouping="hourly"
          /> </v-carousel-item
        ><v-carousel-item>
          <v-container fill-height fluid>
            <v-row align="center" justify="center">
              <v-col>
                <ChartsWordCloud :chartdata="chat_" />
              </v-col>
            </v-row>
          </v-container>
        </v-carousel-item>
      </v-carousel>
    </v-col>
  </div>
</template>
<script>
export default {
  name: "ExampleGraphs",
  props: {
    chat_: {},
  },
  data() {
    return {
      linegraphHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        // aspectRatio: 1,
        legend: {
          position: "top",
          labels: {
            fontStyle: "bold",
            fontColor: "rgb(51,51,51)",
            fontSize: 10,
          },
        },

        scales: {
          xAxes: [
            {
              ticks: {
                fontColor: "rgb(51,51,51)",
                fontStyle: "bold",
                fontSize: 11,
              },
              type: "time",
              time: {
                unit: "month",
              },
              gridLines: {
                display: false,
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                display: false,
              },
              scaleLabel: {
                display: false,
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
      donoughtHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        legend: {
          position: "top",
          labels: {
            fontStyle: "bold",
            fontColor: "rgb(51,51,51)",
            fontSize: 10,
          },
        },
      },
      radarchartHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        scale: {
          angleLines: {
            // display: false,
            color: "rgb(51,51,51)",
          },
          ticks: {
            display: false,
          },
          gridLines: {
            color: "rgb(51,51,51)",
          },

          pointLabels: {
            fontColor: "rgb(51,51,51)",
          },
        },
        legend: {
          position: "top",
          labels: {
            fontStyle: "bold",
            fontColor: "rgb(51,51,51)",
            fontSize: 10,
          },
        },
      },
      barchartHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        legend: {
          position: "top",
          labels: {
            fontStyle: "bold",
            fontColor: "rgb(51,51,51)",
            fontSize: 10,
          },
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: false,
              },
              ticks: {
                fontColor: "rgb(51,51,51)",
              },
            },
          ],
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "Messages",
                fontColor: "rgb(51,51,51)",
              },
              gridLines: {
                display: false,
              },
              ticks: {
                beginAtZero: true,
                precision: 0,
                display: false,
              },
            },
          ],
        },
      },
    };
  },
};
</script>
<style lang="scss">
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
