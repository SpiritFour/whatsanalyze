<template>
  <div>
    <div v-if="attachment.mimeType">
      <img
        v-if="attachment.mimeType.startsWith('image/')"
        :src="attachment.src"
        :title="attachment.fileName"
        alt=""
      />
      <video
        v-if="attachment.mimeType.startsWith('video/')"
        controls
        :title="attachment.fileName"
      >
        <source :src="attachment.src" :type="attachment.mimeType" />
      </video>

      <audio
        v-if="attachment.mimeType.startsWith('audio/')"
        controls
        :src="attachment.src"
        :title="attachment.fileName"
      />
      <a
        v-if="attachment.mimeType.startsWith('href')"
        :href="attachment.src"
        :download="attachment.fileName"
      >
        {{ attachment.fileName }}
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: "Attachment",
  props: ["attachment"],
};
</script>
