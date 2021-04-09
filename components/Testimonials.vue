<template>
  <div class="text-center testimonial-container py-10">
    <div class="text-h2" v-html="$t('testimonialHeadline')"></div>
    <div style="overflow: hidden">
      <div v-for="t in testimonials" class="testimonial" :key="t.name">
        <v-icon large color="black"> mdi-format-quote-close </v-icon>
        <p>
          <strong>{{ t.name }}</strong> {{ $t("says") }}
        </p>
        <p>{{ $t(t.text) }}</p>
        <v-icon v-for="id in 5" large color="#ffd782" :key="id">
          mdi-star
        </v-icon>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      testimonials: [
        {
          name: "Jennifer",
          text: "jennifer",
        },
        {
          name: "Lara",
          text: "lara",
        },
      ],
    };
  },
};
</script>
