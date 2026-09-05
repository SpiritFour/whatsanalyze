<template>
  <div class="wrapped-scope bg-black w-full h-full min-h-screen text-gray-300">
    <header
      class="sticky top-0 z-50 py-6 md:py-8 border-b-2 border-gray-900 bg-black px-4 md:px-8"
    >
      <div
        class="grid-container flex flex-wrap items-center justify-between gap-4"
      >
        <div class="shrink-0">
          <WrappedLogo />
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-6 ml-auto">
          <NuxtLink
            :to="localePath('/wrapped/subscription/verify')"
            class="hover:text-gray-300 transition-colors text-sm font-semibold flex gap-2 items-center cursor-pointer hover:scale-105"
          >
            <CheckCircleIcon v-if="isVerified" class="w-4 h-4 text-green-400" />
            <InformationCircleIcon v-else class="w-4 h-4 text-blue-400" />
            {{ $t("nav.subscription") }}
          </NuxtLink>

          <NuxtLink
            :to="localePath('/wrapped') + '#privacy'"
            class="hover:text-gray-300 transition-colors text-sm font-semibold hover:scale-105"
          >
            {{ $t("nav.privacy") }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/wrapped') + '#guide'"
            class="hover:text-gray-300 transition-colors text-sm font-semibold hover:scale-105"
          >
            {{ $t("nav.exportGuide") }}
          </NuxtLink>
          <WrappedLanguageSwitcher />
        </nav>

        <!-- Mobile Navigation -->
        <div class="md:hidden flex items-center gap-3 ml-auto">
          <WrappedLanguageSwitcher />
          <button
            :aria-expanded="mobileMenuOpen"
            :aria-label="
              mobileMenuOpen ? $t('common.close') : $t('common.menu')
            "
            class="flex h-10 w-10 items-center justify-center rounded-md border border-gray-800 hover:border-gray-600 transition-colors"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <span v-if="!mobileMenuOpen" class="text-xl">☰</span>
            <span v-else class="text-xl">✕</span>
          </button>
        </div>
      </div>

      <!-- Mobile Menu (collapsible) -->
      <nav
        v-if="mobileMenuOpen"
        class="md:hidden mt-4 pt-4 border-t border-gray-900 flex flex-col gap-3"
      >
        <NuxtLink
          :to="localePath('/wrapped/subscription/verify')"
          class="hover:text-gray-300 transition-colors text-sm font-semibold flex gap-2 items-center cursor-pointer hover:scale-105"
          @click="mobileMenuOpen = false"
        >
          <CheckCircleIcon v-if="isVerified" class="w-4 h-4 text-green-400" />
          <InformationCircleIcon v-else class="w-4 h-4 text-blue-400" />
          {{ $t("nav.subscription") }}
        </NuxtLink>

        <NuxtLink
          :to="localePath('/wrapped') + '#privacy'"
          class="hover:text-gray-300 transition-colors text-sm font-semibold py-2 px-2 rounded hover:bg-gray-900"
          @click="mobileMenuOpen = false"
        >
          {{ $t("nav.privacy") }}
        </NuxtLink>
        <NuxtLink
          :to="localePath('/wrapped') + '#guide'"
          class="hover:text-gray-300 transition-colors text-sm font-semibold py-2 px-2 rounded hover:bg-gray-900"
          @click="mobileMenuOpen = false"
        >
          {{ $t("nav.exportGuide") }}
        </NuxtLink>
      </nav>
    </header>

    <main class="text-white font-sans px-4 md:px-0">
      <slot />
    </main>

    <footer class="border-t-gray-900 py-8 text-gray-500">
      <div class="container flex items-center justify-center flex-col gap-8">
        <hr class="border-gray-900 border-t-2 w-full" />

        <div class="flex flex-col md:flex-row flex-wrap w-full">
          <div id="privacy" class="p-4 md:p-8 flex-1 min-w-full md:min-w-0">
            <div class="w-max mb-4">
              <div
                class="flex flex-col md:flex-row items-start md:items-center justify-start gap-2 md:gap-8"
              >
                <h2 class="text-lg font-semibold">
                  {{ $t("footer.privacyFirst") }}
                </h2>
              </div>

              <hr class="border-gray-900 border-t-2 w-full" />
            </div>

            <div>
              <p>
                {{ $t("footer.privacyFirstDescription") }}
              </p>
              <p>If you create a share-link, only encrypted data is saved.</p>
            </div>
          </div>

          <div id="code" class="p-4 md:p-8 flex-1 min-w-full md:min-w-0">
            <div class="w-max mb-4">
              <div
                class="flex flex-col md:flex-row items-start md:items-center justify-start gap-2 md:gap-8"
              >
                <h2 class="text-lg font-semibold">
                  {{ $t("footer.openSource") }}
                </h2>
                <div>
                  <a
                    class="hover:underline text-blue-400"
                    href="https://github.com/SpiritFour/whatsanalyze-wrapped/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ $t("footer.checkOnGithub") }}
                  </a>
                </div>
              </div>

              <hr class="border-gray-900 border-t-2 w-full" />
            </div>

            <div>
              <p>
                {{ $t("footer.openSourceDescription") }}
              </p>
              <p>Feel free to run it locally and see how it is working.</p>
            </div>
          </div>
        </div>
        <div class="text-xs mt-12">{{ $t("footer.madeBy") }}</div>

        <p class="text-xs text-center md:text-right">
          &copy; {{ new Date().getFullYear() }} WhatsAnalyze.
          {{
            $t("footer.copyright").split(". All rights reserved.")[1]
              ? "All rights reserved."
              : ""
          }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useSubscriptionStore } from "~/stores/wrapped/subscriptionStore";
import { CheckCircleIcon, InformationCircleIcon } from "@heroicons/vue/16/solid";

const localePath = useLocalePath();
const subscriptionStore = useSubscriptionStore();
const { isVerified } = storeToRefs(subscriptionStore);
const mobileMenuOpen = ref(false);
</script>
