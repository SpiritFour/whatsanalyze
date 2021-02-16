<template>
  <v-content>
    <file-reader />

    {{ hund }}
    <div class="helo" @click="updateHund()">UPDATE</div>
  </v-content>
</template>

<script>
export default {
  methods: {
    renameHund(name) {
      this.hund = name;
    },
    updateHund() {
      this.renameHund("Hans");
    },
  },
  data() {
    return {
      hund: "Paul",
    };
  },
};
</script>

<style>
.helo {
  background-color: aliceblue;
  color: black;
  border-radius: 10px;
}
</style>
