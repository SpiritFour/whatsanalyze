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
      <v-row v-else align="center" class="rando-file-container">
        <v-col class="ma-0 pa-0 pr-3" style="position: relative" cols="2">
          <v-row justify="center">
            <v-icon class="ma-0 pa-0" size="30" color="grey" left
              >mdi-file</v-icon
            >
          </v-row>
          <div class="center" style="font-size: xx-small">
            {{ attachment.mimeType }}
          </div>
        </v-col>
        <v-col class="ma-auto pl-0 pr-2 py-1" align="left" cols="10">
          <div
            class="caption"
            style="
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            "
          >
            {{ attachment.fileName }}
          </div>
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

.center {
  position: absolute;
  top: 0;
  left: -10px;
  bottom: 0;
  right: 0;
}

.rando-file-container {
  margin: 0;
  padding: 2px 0 2px 10px;
  border-radius: 5px;
  background-color: rgba(0, 0, 0, 0.2);
}
</style>
