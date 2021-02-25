<template>
  <div class="text-center testimonial-container py-10">
    <div class="text-h2">
      Analyze your chats and
      <strong> get first hand data insights</strong>
    </div>
    <div style="overflow: hidden">
      <div v-for="t in testimonials" class="testimonial" :key="t.name">
        <v-icon large color="black"> mdi-format-quote-close </v-icon>
        <p>
          <strong>{{ t.name }}</strong> says
        </p>
        <p>{{ t.text }}</p>
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
          text:
            "Visualizing my friends chat revealed a lot about our relationship. I always though that I was the one sending more messages. Really nice to see all those fun facts about our history. Keep it going and add more beautiful visuals.",
        },
        {
          name: "Lara",
          text:
            "Amazing to see a whole WhatsApp history at a glance. I have chats going back multiple years seeing how the relationship is mirrored in the chat is amazing. I love that my files are not uploaded and that it runs directly in my browser.",
        },
      ],
    };
  },
};
</script>
