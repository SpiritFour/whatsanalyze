<template>
  <v-container class="text-center py-10">
    <v-row justify="center" v-if="chartdata">
      <v-col
        v-for="(person, index) in chartdata.messagesPerPerson"
        :key="index"
        cols="12"
        sm="6"
        md="4"
        class="mb-5"
      >
        <div class="text-h4 font-weight-bold">
          {{ $t("averageResponseTimeFor", { name: person.name }) }}
        </div>
        <div class="text-h5">
          {{
            person.averageResponseTime !== null
              ? formatResponseTime(person.averageResponseTime)
              : $t("noDataAvailable")
          }}
        </div>
      </v-col>
    </v-row>
    <div v-else class="text-h5">
      {{ $t("noDataAvailable") }}
    </div>
  </v-container>
</template>

<script>
import { Chat } from "~/utils/transformChatData";

export default {
  name: "AverageResponseTime",
  props: {
    chartdata: {
      type: new Chat(),
      required: true,
    },
  },
  methods: {
    formatResponseTime(timeInMillis) {
      const seconds = Math.floor((timeInMillis / 1000) % 60);
      const minutes = Math.floor((timeInMillis / (1000 * 60)) % 60);
      const hours = Math.floor((timeInMillis / (1000 * 60 * 60)) % 24);
      console.log({ hours, minutes, seconds });

      if (hours > 0) {
        return this.$t("responseTimeHours", { hours, minutes, seconds });
      } else if (minutes > 0) {
        return this.$t("responseTimeMinutes", { minutes, seconds });
      } else {
        return this.$t("responseTimeSeconds", { seconds });
      }
    },
  },
};
</script>

<style scoped></style>
