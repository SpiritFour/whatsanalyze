<template>
  <section class="flex flex-col gap-12 md:px-10">
    <div class="text-center space-y-6">
      <h2 class="text-3xl md:text-5xl font-extrabold">
        {{ $t("wrappedAbout") }}
      </h2>
      <div
        class="about-copy mx-auto max-w-2xl text-center text-base md:text-lg text-gray-200 leading-relaxed space-y-4"
        v-html="$t('wrappedAboutPoints')"
      />
    </div>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <article
        v-for="person in persons"
        :key="person.name"
        class="flex flex-col items-center gap-4 rounded-3xl bg-black/40 p-6 text-center shadow-lg shadow-black/30 backdrop-blur"
      >
        <img
          :alt="person.name"
          :src="person.image"
          class="h-28 w-28 rounded-full border border-white/10 object-cover"
          loading="lazy"
        />
        <h3 class="text-xl font-semibold">{{ person.name }}</h3>
        <p class="text-sm uppercase tracking-wide text-green-300">
          {{ person.tagline }}
        </p>
        <ul class="space-y-1 text-sm text-gray-300 leading-relaxed">
          <li v-for="d in person.description" :key="d">{{ d }}</li>
        </ul>
      </article>
    </div>

    <div
      class="grid grid-cols-2 gap-6 sm:grid-cols-4 items-center justify-items-center"
    >
      <a
        v-for="university in universities"
        :key="university.name"
        :href="university.url"
        class="flex items-center justify-center"
        rel="noreferrer noopener"
        target="_blank"
      >
        <img
          :alt="university.name"
          :src="university.src"
          class="max-h-16 w-full max-w-[140px] object-contain grayscale hover:grayscale-0 transition"
          loading="lazy"
        />
      </a>
    </div>
  </section>
</template>

<script lang="ts" setup>
interface Person {
  image: string;
  name: string;
  description: string[];
  tagline: string;
}

interface University {
  name: string;
  src: string;
  url: string;
}

const universities: University[] = [
  {
    name: "Technical University of Munich",
    src: "/img/uni/TUM_Logo.png",
    url: "https://www.tum.de/",
  },
  {
    name: "University of Oslo",
    src: "/img/uni/Oslo_Logo.png",
    url: "https://www.uio.no/",
  },
  {
    name: "University of Otago",
    src: "/img/uni/Otago_Logo.png",
    url: "https://www.otago.ac.nz/",
  },
  {
    name: "KTH Royal Institute of Technology",
    src: "/img/uni/Stockholm_Logo.png",
    url: "https://www.kth.se/",
  },
];

const persons: Person[] = [
  {
    image: "/img/us/Sebastian_WA.jpg",
    name: "Sebastian Fellner",
    tagline: "Machine learning explorer building smart analytics.",
    description: ["Computer Science MSc", "AI Enthusiast"],
  },
  {
    image: "/img/us/Paul_WA.jpg",
    name: "Paul Kehnel",
    tagline: "Architect at heart, shaping physical and digital spaces.",
    description: ["Computer Science  MSc", "Bicycle Dude"],
  },
  {
    image: "/img/us/Adrian_WA.jpg",
    name: "Adrian Thiesen",
    tagline: "Building AI-driven products that users love",
    description: ["Information Systems BSc", "The Product Enthusiast"],
  },
  {
    image: "/img/us/Moritz_WA.jpeg",
    name: "Moritz Wolf",
    tagline: "Creative energy from photography to playful apps.",
    description: ["Robotics MSc", "Outdoor Specialist"],
  },
];
</script>

<style scoped>
:deep(.about-copy p) {
  margin-bottom: 1rem;
}

:deep(.about-copy p:last-child) {
  margin-bottom: 0;
}
</style>
