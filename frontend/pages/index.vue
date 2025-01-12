<template>
  <section class="relative overflow-hidden py-16">
    <div
        class="absolute left-0 top-1/2 -translate-y-1/2 w-56 h-56 bg-gradient -rotate-12 animate-pulse  hidden md:block"
        style="clip-path: polygon(0 0, 100% 50%, 0 100%)"
    />

    <div
        class="absolute right-0 top-1/2 -translate-y-1/2 w-56 h-56 bg-gradient rotate-12 animate-pulse hidden md:block"
        style="clip-path: polygon(100% 0, 0 50%, 100% 100%)"
    />

    <div
        class="card text-center container w-full h-full border-gray-950"
    >
      <h1 class="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight z-10">
        Your WhatsApp Wrapped
      </h1>
      <p class="max-w-2xl mx-auto text-lg md:text-xl mb-8">
        <!--      Summary of your chat data.
              - Who dominates the chat? # and % of messages and
              - Wer redet gern? Länge der Sprachnachrichten
              - wieviel wird telefoniert (Anrufe), wer ruft immer an?
              - When did you chat the most? Month & date and time of day.
              - Total messages per person
              - top 3 used word and emoji per person
              - number of images per person
              - Klassifizierung / Typeneinteilung / Chat-Persönlichkeit: Schwafler (>4h pro Jahr sprachnachricht), Emoji-King (>
              20 verschiedene Emojies), Emojie Spammer (mehr als 200x das gleiche Emojie)-->

        Dive into your year of chats, voice notes, and memories.
        The story of your chat, told through your WhatsApp data.
      </p>
      <Gradient
          class="inline-block text-white font-bold px-6 py-3 rounded-full hover:bg-gray-900 transition-colors">
        <button>
          Get Your WhatsApp Wrapped
        </button>
      </Gradient>
    </div>
  </section>

  <section class="relative container">
    <h2 class="text-3xl md:text-5xl font-extrabold text-center mb-12">
      What is Wrapped, anyway?
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-center">
      <div v-for="explanation in explanations" class="space-y-4">
        <div class="mx-auto w-12 h-12 flex items-center justify-center mb-2">

          <component :is="explanation.icon" class="w-8 h-8"></component>
        </div>
        <h3 class="text-xl font-semibold">{{ explanation.title }}</h3>
        <p class="text-gray-300 text-sm md:text-base leading-relaxed">
          {{ explanation.description }}
        </p>
      </div>
    </div>
  </section>

  <!-- SECTION 1: Overview -->
  <section id="stats" class="container bg-gradient card">
    <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <div>
        <h2 class="text-3xl md:text-4xl font-bold mb-4">Top Chats & Emojis</h2>
        <p class="mb-4">
          Curious which chats kept you typing day and night?
          Your top emojis reveal the mood of your convos.
          Share your favorites or keep them a fun secret—it's up to you!
        </p>
        <a
            class="inline-block mt-4 bg-green-500 text-black px-5 py-2 rounded-full font-semibold hover:bg-green-600 transition-colors"
            href="#"
        >
          Explore Now
        </a>
      </div>
      <!-- Image / Visualization Placeholder -->
      <div class="bg-gray-900 p-6 rounded-lg flex items-center justify-center">
        <!-- Replace with an actual data visual, chart, or image -->
        <div class="bg-gray-800 h-48 w-full rounded-md"></div>
      </div>
    </div>
  </section>

</template>

<script lang="ts">
import {CalendarIcon, ChatBubbleLeftIcon, LightBulbIcon} from "@heroicons/vue/24/solid";
import Gradient from "~/components/Gradient.vue";

export default {
  components: {Gradient, ChatBubbleLeftIcon, CalendarIcon, LightBulbIcon},
  data() {
    return {
      explanations: [
        {
          title: "Your year in messages",
          description: "Get a deeper look into your WhatsApp usage stats with a personal recap made just for you.",
          icon: "CalendarIcon",
        },
        {
          title: "A conversation booster",
          description: "Compare your WhatsApp “Wrapped” highlights with friends and spark new conversations around your top stats.",
          icon: "ChatBubbleLeftIcon"
        },
        {
          title: "Only on WhatsAnalyze",
          description: "WhatsApp Wrapped is an exclusive feature for WhatsAnalyze users. Don't miss your next year’s recap.",
          icon: "LightBulbIcon"
        }
      ]
    }
  }
};
</script>

