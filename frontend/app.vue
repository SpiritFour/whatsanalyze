<template>
  <div class="bg-gray-900  w-full h-full min-h-screen text-gray-300">
    <header class="sticky top-0 z-50 bg-gray-950 py-8">
      <div class="gid-container flex flex-col md:flex-row  items-center justify-between">
        <Logo>
          <Gradient
              class="w-min h-min translate-y-2 absolute rounded-lg right-0 top-0 rotate-12 bg-gradient px-2 font-black ">
            wrapped
          </Gradient>
        </Logo>

        <nav class="block items-center space-x-6 mt-8 md:mt-0">
          <a class="hover:text-gray-300 transition-colors text-sm font-semibold" href="#privacy">
            Privacy
          </a>
          <a
              class="text-sm font-semibold border-orange-500 border-2 py-2 px-4 rounded-full hover:text-orange-500 transition-colors"
              href="#"
          >
            Get Started
          </a>
        </nav>
      </div>
    </header>
    <!--    <FeedbackBtn/>-->
    <main class="text-white font-sans px-4 md:px-0 min-h-screen">
      <NuxtPage class="my-28"/>
    </main>


    <footer class="bg-gray-950 py-8 text-gray-500">
      <div class="container flex items-center justify-center flex-col gap-8 ">
        <hr class="border-gray-900 w-full"/>

        <div>
          Made with ❤ by friends in Munich️
        </div>

        <p class="text-xs text-center md:text-right">
          &copy; {{ new Date().getFullYear() }} WhatsAnalyze. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>

</style>


<script lang="ts" setup>
</script>