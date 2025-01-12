<template>
  <div>
    <div class="text-h3 font-weight-bold pt-10 pb-5">
      {{ $t("examplePDF") }}
    </div>
    <v-img :lazy-src="img" :src="img"> </v-img>
  </div>
</template>
<script>
import img from "@/assets/img/whatsapp export pdf.png";

export default {
  name: "PdfExample",
  data() {
    return {
      img,
    };
  },
};
</script>

<style scoped></style>
