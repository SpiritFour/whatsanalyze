<template>
  <v-container class="pa-5">
    <v-row class="ma-10 text-h3 font-weight-bold" justify="center">
      About us
    </v-row>
    <v-row class="ma-10 text-body-1" justify="center">
      <v-col cols="12" sm="12" md="10">
        We are a group of four friends that switched from signal to whatsapp a
        few weeks ago.
      </v-col>
    </v-row>
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
        <v-row class="text-h5 font-weight-bold" justify="center">
          {{ person.name }}
        </v-row>
        <v-row
          v-for="d in person.description"
          :key="d"
          justify="center"
          class="text-body-1"
        >
          {{ d }}
        </v-row>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col
        align="center"
        cols="3"
        v-for="university in universities"
        :key="university"
      >
        <img :src="university" style="width: 100%; max-width: 100px" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "About",
  data() {
    return {
      universities: [
        // eslint-disable-next-line no-undef
        require("~/assets/img/uni/TUM_Logo.png"),
        // eslint-disable-next-line no-undef
        require("~/assets/img/uni/Oslo_Logo.png"),
        // eslint-disable-next-line no-undef
        require("~/assets/img/uni/Otago_Logo.png"),
        // eslint-disable-next-line no-undef
        require("~/assets/img/uni/Stockholm_Logo.png"),
      ],
      persons: [
        {
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/us/Sebastian_WA.jpg"),
          name: "Sebastian Fellner",
          description: ["Computer Science MSc", "AI Enthusiast"],
        },
        {
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/us/Paul_WA.jpg"),
          name: "Paul Kehnel",
          description: ["Computer Science  MSc", "likes stuff"],
        },
        {
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/us/Adrian_WA.jpg"),
          name: "Adrian Thiesen",
          description: ["Business Administration BSc", "likes stuff"],
        },
        {
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/us/Moritz_WA.jpeg"),
          name: "Moritz Wolf",
          description: ["Robotics MSc", "likes stuff"],
        },
      ],
    };
  },
};
</script>

<style scoped></style>
