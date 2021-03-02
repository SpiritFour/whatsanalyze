<template>
  <div>
    <img
      v-if="mimeType.startsWith('image/')"
      :src="src"
      :title="fileName"
      alt=""
    />
    <video v-if="mimeType.startsWith('video/')" :title="fileName">
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
  props: ["mimeType", "src", "fileName"],
};
</script>
