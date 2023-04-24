<template>
  <div>
    <div v-if="attachment" class="media-style">
      <img
        v-if="attachment.mimeTypeData.mimeTypeGroup === MimeTypeGroup.image"
        :src="attachment.src"
        :title="attachment.fileName"
        :alt="attachment.fileName"
      />
      <video
        v-else-if="
          attachment.mimeTypeData.mimeTypeGroup === MimeTypeGroup.video
        "
        controls
        :title="attachment.fileName"
      >
        <source
          :src="attachment.src"
          :type="attachment.mimeTypeData.mimeType"
        />
      </video>
      <audio
        v-else-if="
          attachment.mimeTypeData.mimeTypeGroup === MimeTypeGroup.audio
        "
        controls
        :src="attachment.src"
        :title="attachment.fileName"
      />
      <v-row v-else align="center" class="rando-file-container">
        <v-col class="ma-0 pa-0 pr-3" style="position: relative" cols="2">
          <v-row justify="center">
            <v-icon class="ma-0 pa-0" size="30" color="grey" left>
              mdi-file
            </v-icon>
          </v-row>
          <div class="center" style="font-size: xx-small">
            {{ attachment.mimeTypeData.mimeTypeEnding }}
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
import { MimeTypeGroup } from "~/functions/attachments";
export default {
  name: "Attachment",
  props: {
    attachmentPromise: {
      type: Promise,
      default: undefined,
    },
  },
  data() {
    return {
      attachment: undefined,
      MimeTypeGroup,
    };
  },
  async fetch() {
    let attachment = await this.attachmentPromise;
    // transform uint8array to url
    attachment.src = URL.createObjectURL(new Blob([attachment.src.buffer]));
    this.attachment = attachment;
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
