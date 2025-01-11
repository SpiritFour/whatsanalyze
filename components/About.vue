<template>
  <div class="px-5 pt-5">
    <div class="ma-10 text-h3 font-weight-bold" justify="center">
      {{ $t("about") }}
    </div>
    <div class="ma-10 text-body-1" justify="center">
      <div
        align="center"
        cols="12"
        md="10"
        sm="12"
        v-html="$t('aboutPoints')"
      >
      </div>
    </div>
    <div class="ma-10">
      <div
        v-for="person in persons"
        :key="person.name"
        class="mb-3 my-xs-16 text-center"
        cols="12"
        md="3"
        sm="6"
      >
        <div justify="center">
          <v-img
            :lazy-src="person.image"
            :src="person.image"
            style="height: 120px; max-width: 120px; border-radius: 60px"
          />
        </div>
        <div class="text-h5 font-weight-bold" justify="center">
          {{ person.name }}
        </div>
        <div
          v-for="d in person.description"
          :key="d"
          class="text-body-1"
          justify="center"
        >
          {{ d }}
        </div>
      </div>
    </div>
    <div align="center" class="mx-md-10">
      <div v-for="university in universities" :key="university" cols="3">
        <div justify="center">
          <v-img
            :lazy-src="university"
            :src="university"
            style="width: 100%; max-width: 100px"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "About",
  data() {
    return {
      universities: [
        // eslint-disable-next-line no-undef
        require("/img/uni/TUM_Logo.png"),
        // eslint-disable-next-line no-undef
        require("/img/uni/Oslo_Logo.png"),
        // eslint-disable-next-line no-undef
        require("/img/uni/Otago_Logo.png"),
        // eslint-disable-next-line no-undef
        require("/img/uni/Stockholm_Logo.png")
      ],
      persons: [
        {
          // eslint-disable-next-line no-undef
          image: require("/img/us/Sebastian_WA.jpg"),
          name: "Sebastian Fellner",
          description: ["Computer Science MSc", "AI Enthusiast"]
        },
        {
          // eslint-disable-next-line no-undef
          image: require("/img/us/Paul_WA.jpg"),
          name: "Paul Kehnel",
          description: ["Computer Science  MSc", "Bicycle Dude"]
        },
        {
          // eslint-disable-next-line no-undef
          image: require("/img/us/Adrian_WA.jpg"),
          name: "Adrian Thiesen",
          description: ["Information Systems BSc", "The Product Enthusiast"]
        },
        {
          // eslint-disable-next-line no-undef
          image: require("/img/us/Moritz_WA.jpeg"),
          name: "Moritz Wolf",
          description: ["Robotics MSc", "Outdoor Specialist"]
        }
      ]
    };
  }
};
</script>

<style scoped></style>
