<template>
  <div>
    <img
      v-if="attachments.mimeType.startsWith('image/')"
      :src="attachments.src"
      :title="attachments.fileName"
      alt=""
    />
    <video
      v-if="attachments.mimeType.startsWith('video/')"
      controls
      :title="attachments.fileName"
    >
      <source :src="attachments.src" :type="attachments.mimeType" />
    </video>

    <audio
      v-if="attachments.mimeType.startsWith('audio/')"
      controls
      :src="attachments.src"
      :title="attachments.fileName"
    />
    <a
      v-if="attachments.mimeType.startsWith('href')"
      :href="attachments.src"
      :download="attachments.fileName"
    >
      {{ attachments.fileName }}
    </a>
  </div>
</template>

<script>
export default {
  name: "Attachment",
  props: ["attachments"],
};
</script>
