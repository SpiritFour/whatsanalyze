<template>
  <div v-if="chatObject.numPersonsInChat > 2" class="mt-16">
    <div class="text-h2 font-weight-bold mb-5">
      <span class="red darken-2 white--text px-2">{{
        chatObject.numPersonsInChat
      }}</span>
      {{ $t("people") }}
    </div>
    <div class="text-h6">
      {{ $t("groupChat") }}
      <br />
      <small>
        {{ $t("groupInfo") }}
      </small>
    </div>
    <v-slider
      class="pt-10"
      v-model="groupAfter"
      thumb-color="red darken-2"
      thumb-label="always"
      ticks="always"
      tick-size="4"
      step="1"
      min="2"
      :max="chatObject.numPersonsInChat - 1"
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
