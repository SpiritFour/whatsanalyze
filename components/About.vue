<template>
  <v-container class="pa-5">
    <v-row class="ma-10" justify="center">
      <v-col
        cols="12"
        sm="6"
        md="3"
        justify="center"
        class="mb-3 my-xs-16"
        v-for="person in persons"
        :key="person.name"
        style="text-align: center"
      >
        <v-row justify="center" class="mb-3">
          <v-avatar size="120">
            <v-img :src="person.image"></v-img>
          </v-avatar>
        </v-row>
        <v-row justify="center">
          {{ person.name }}
        </v-row>
        <v-row justify="center">
          <v-col v-for="university in person.universities" :key="university">
            {{ university }}
          </v-col>
        </v-row>
        <v-row v-for="d in person.description" :key="d" justify="center">
          {{ d }}
        </v-row>
      </v-col>
    </v-row>
    <v-row class="ma-10" justify="center">
      General stuff about this page and why we did this
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "About",
  data() {
    return {
      persons: [
        {
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/us/Sebastian_WA.jpg"),
          name: "Sebastian Fellner",
          description: ["Computer Science MSc", "AI Enthusiast"],
          universities: ["TUM", "UiO"],
        },
        {
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/us/Paul_WA.jpg"),

          name: "Paul Kehnel",
          description: ["Computer Science  MSc", "likes stuff"],
          universities: ["TUM"],
        },
        {
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/us/Adrian_WA.jpg"),

          name: "Adrian Thiesen",
          description: ["Business Administration BSc", "likes stuff"],
          universities: ["TUM"],
        },
        {
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/us/Moritz_WA.jpeg"),

          name: "Moritz Wolf",
          description: ["Robotics MSc", "likes stuff"],
          universities: ["TUM"],
        },
      ],
    };
  },
};
</script>

<style scoped></style>
