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
      <v-row v-else class="white--text" align="center">
        <v-btn class="ma-2" color="primary" dark>
          .{{ attachment.mimeType }}
          <v-icon size="20">mdi-file</v-icon>
        </v-btn>
        {{ attachment.fileName }}
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
