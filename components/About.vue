<template>
  <v-container class="px-5 pt-5">
    <v-row class="ma-10 text-h3 font-weight-bold" justify="center">
      {{ $t("about") }}
    </v-row>
    <v-row class="ma-10 text-body-1" justify="center">
      <v-col
        align="center"
        cols="12"
        md="10"
        sm="12"
        v-html="$t('aboutPoints')"
      >
      </v-col>
    </v-row>
    <v-row class="ma-10">
      <v-col
        v-for="person in persons"
        :key="person.name"
        class="mb-3 my-xs-16 text-center"
        cols="12"
        md="3"
        sm="6"
      >
        <v-row justify="center">
          <v-img
            :lazy-src="person.image"
            :src="person.image"
            style="height: 120px; max-width: 120px; border-radius: 60px"
          />
        </v-row>
        <v-row class="text-h5 font-weight-bold" justify="center">
          {{ person.name }}
        </v-row>
        <v-row
          v-for="d in person.description"
          :key="d"
          class="text-body-1"
          justify="center"
        >
          {{ d }}
        </v-row>
      </v-col>
    </v-row>
    <v-row align="center" class="mx-md-10">
      <v-col v-for="university in universities" :key="university" cols="3">
        <v-row justify="center">
          <v-img
            :lazy-src="university"
            :src="university"
            style="width: 100%; max-width: 100px"
          />
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import adrianImage from "~/assets/img/us/Adrian_WA.jpg";
import moritzImage from "~/assets/img/us/Moritz_WA.jpeg";
import paulImage from "~/assets/img/us/Paul_WA.jpg";
import sebastianImage from "~/assets/img/us/Sebastian_WA.jpg";
import osloLogo from "~/assets/img/uni/Oslo_Logo.png";
import otagoLogo from "~/assets/img/uni/Otago_Logo.png";
import stockholmLogo from "~/assets/img/uni/Stockholm_Logo.png";
import tumLogo from "~/assets/img/uni/TUM_Logo.png";

export default {
  name: "About",
  data() {
    return {
      universities: [tumLogo, osloLogo, otagoLogo, stockholmLogo],
      persons: [
        {
          image: sebastianImage,
          name: "Sebastian Fellner",
          description: ["Computer Science MSc", "AI Enthusiast"],
        },
        {
          image: paulImage,
          name: "Paul Kehnel",
          description: ["Computer Science  MSc", "Bicycle Dude"],
        },
        {
          image: adrianImage,
          name: "Adrian Thiesen",
          description: ["Information Systems BSc", "The Product Enthusiast"],
        },
        {
          image: moritzImage,
          name: "Moritz Wolf",
          description: ["Robotics MSc", "Outdoor Specialist"],
        },
      ],
    };
  },
};
</script>

<style scoped></style>
