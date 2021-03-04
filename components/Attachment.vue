<template>
  <div>
    <div v-if="attachment" class="media-style">
      <img
        v-if="attachment.mimeType.startsWith('image/')"
        :src="attachment.src"
        :title="attachment.fileName"
        :alt="attachment.fileName"
      />
      <video
        v-else-if="attachment.mimeType.startsWith('video/')"
        controls
        :title="attachment.fileName"
      >
        <source :src="attachment.src" :type="attachment.mimeType" />
      </video>

      <audio
        v-else-if="attachment.mimeType.startsWith('audio/')"
        controls
        :src="attachment.src"
        :title="attachment.fileName"
      />

      <v-row v-else color="black" dark align="center" justify="center">
        <v-col class="my-0 px-0" style="position: relative" align="center">
          <v-row justify="center" align="center">
            <v-icon size="40" color="grey" left>mdi-file</v-icon>
          </v-row>
          <v-row
            style="position: absolute; bottom: 50%; right: 75%"
            justify="center"
          >
            {{ attachment.mimeType }}
          </v-row>
        </v-col>
        <v-col
          class="ma-0 pa-1 pr-2"
          justify="center"
          align="center"
          style="flex-wrap: nowrap; overflow-x: auto"
        >
          {{ attachment.fileName }}
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
export default {
  name: "Attachment",
  props: ["attachmentPromise"],
  data() {
    return {
      attachment: undefined,
    };
  },
  created() {
    this.attachmentPromise.then((resolved) => (this.attachment = resolved));
  },
};
</script>

<style>
.media-style img,
video,
audio,
a {
  max-width: 100%;
  max-height: 50vh;
}
</style>
