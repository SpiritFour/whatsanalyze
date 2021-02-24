<template>
  <div>
    <v-col v-if="$vuetify.breakpoint.smAndUp">
      <v-row>
        <v-col cols="12" sm="6">
          <LineChart
            :chartdata="chat_"
            :options="linegraphHeaderChartOptions"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <DonughtChart
            :chartdata="chat_"
            :options="donoughtHeaderChartOptions"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" sm="6">
          <RadarChart
            :chartdata="chat_"
            :options="radarchartHeaderChartOptions"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <BarChart
            :chartdata="chat_"
            :options="barchartHeaderChartOptions"
            dataGrouping="hourly"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <WordCloud :chartdata="chat_" />
        </v-col>
      </v-row>
    </v-col>
    <v-col v-else>
      <v-carousel
        :continuous="true"
        :cycle="true"
        :show-arrows="false"
        hide-delimiter-background
        height="350"
      >
        <v-carousel-item>
          <LineChart
            :chartdata="chat_"
            :options="linegraphHeaderChartOptions"
          />
        </v-carousel-item>
        <v-carousel-item>
          <DonughtChart
            :chartdata="chat_"
            :options="donoughtHeaderChartOptions"
          />
        </v-carousel-item>
        <v-carousel-item>
          <RadarChart
            :chartdata="chat_"
            :options="radarchartHeaderChartOptions"
          /> </v-carousel-item
        ><v-carousel-item>
          <BarChart
            :chartdata="chat_"
            :options="barchartHeaderChartOptions"
            dataGrouping="hourly"
          /> </v-carousel-item
        ><v-carousel-item>
          <v-container fill-height fluid>
            <v-row align="center" justify="center">
              <v-col>
                <WordCloud :chartdata="chat_" />
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
      donoughtHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        legend: {
          position: "top",
        },
      },
      radarchartHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        scale: {
          angleLines: {
            // display: false,
          },
          ticks: {
            beginAtZero: true,
            precision: 0,
          },
        },
        legend: {
          position: "top",
        },
      },
      barchartHeaderChartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        legend: {
          position: "top",
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: false,
              },
            },
          ],
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "Messages",
              },
              ticks: {
                beginAtZero: true,
                precision: 0,
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
