<template>
  <Content :page="page" class="main-el mt-15" />
</template>

<script>
export default {
  async asyncData({ $content }) {
    const page = await $content("whatsapp-signal").fetch();
    return {
      page,
    };
  },
};
</script>
