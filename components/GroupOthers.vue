<template>
  <div v-if="chatObject.numPersonsInChat > 2">
    <div class="text-h5">
      You can group the persons with the least messages here.
    </div>
    <v-slider
      v-model="groupAfter"
      label="Number of people grouped into Others"
      thumb-color="red"
      thumb-label="always"
      tick
      step="1"
      min="2"
      :max="Math.min(chatObject.numPersonsInChat - 1, 20)"
      @change="
        /* eslint-disable vue/no-mutating-props */
        chatObject.groupAfter = groupAfter
      "
    ></v-slider>
  </div>
</template>

<script>
export default {
  name: "GroupOthers",
  props: ["chatObject"],
  data() {
    return {
      groupAfter: this.chatObject.groupAfter,
    };
  },
  mounted() {
    this.groupAfter = this.chatObject.groupAfter;
  },
};
</script>

<style scoped></style>
