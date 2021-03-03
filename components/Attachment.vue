<template>
  <div>
    <img
      v-if="mimeType.startsWith('image/')"
      :src="src"
      :title="fileName"
      alt=""
    />
    <video v-if="mimeType.startsWith('video/')" controls :title="fileName">
      <source :src="src" :type="mimeType" />
    </video>

    <audio
      v-if="mimeType.startsWith('audio/')"
      controls
      :src="src"
      :title="fileName"
    />
    <a v-if="mimeType.startsWith('href')" :href="src" :download="fileName">
      {{ fileName }}
    </a>
  </div>
</template>

<script>
export default {
  name: "Attachment",
  props: ["file"],
  data() {
    return {
      mimeType: null,
      src: null,
      fileName: null,
    };
  },
  methods: {
    getMimeType(fileName) {
      if (/\.jpe?g$/.test(fileName)) return "image/jpeg";
      if (fileName.endsWith(".png")) return "image/png";
      if (fileName.endsWith(".gif")) return "image/gif";
      if (fileName.endsWith(".webp")) return "image/webp";
      if (fileName.endsWith(".svg")) return "image/svg+xml";

      if (fileName.endsWith(".mp4")) return "video/mp4";
      if (fileName.endsWith(".webm")) return "video/webm";

      if (fileName.endsWith(".mp3")) return "audio/mpeg";
      if (fileName.endsWith(".m4a")) return "audio/mp4";
      if (fileName.endsWith(".wav")) return "audio/wav";
      if (fileName.endsWith(".opus")) return "audio/ogg";
      return "undefined";
    },

    renderAttachment(attachment) {
      const mimeType = this.getMimeType(this.fileName) || "";
      let src;
      if (mimeType === "undefined") {
        src = "data:" + "image/jpeg" + ";64base, " + "imagePREVIEW";
      } else {
        src = "data:" + mimeType + ";base64, " + attachment;
      }
      this.mimeType = mimeType;
      this.src = src;
    },

    initializeLoading() {
      console.log("hey");
      this.fileName = this.file.name;
      this.file.async("base64").then((data) => {
        this.renderAttachment(data);
      });
    },
  },
  mounted() {
    this.initializeLoading();
  },
};
</script>
