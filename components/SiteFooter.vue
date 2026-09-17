<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__top">
        <div class="site-footer__brand">
          <NuxtLink :to="localePath('/')" class="site-footer__brand-link">
            <img
              alt="WhatsAnalyze logo"
              class="site-footer__logo"
              src="~/assets/whatsanalyze-logo-white.png"
            />
            <span class="site-footer__wordmark">WhatsAnalyze</span>
          </NuxtLink>
          <p class="site-footer__tagline">{{ $t("footer.madeBy") }}</p>
          <a
            class="site-footer__github"
            href="https://github.com/SpiritFour/whatsanalyze"
            target="_blank"
            rel="noopener noreferrer"
          >
            <v-icon size="18">mdi-github</v-icon>
            {{ $t("footer.checkOnGithub") }}
          </a>
        </div>

        <nav class="site-footer__columns">
          <div class="site-footer__column">
            <h3 class="site-footer__heading">
              {{ $t("toolsHub.headerTools") }}
            </h3>
            <NuxtLink
              v-for="tool in allTools"
              :key="tool.to"
              :to="tool.to"
              class="site-footer__link"
            >
              {{ tool.title }}
            </NuxtLink>
          </div>

          <div class="site-footer__column">
            <h3 class="site-footer__heading">{{ $t("footer.guides") }}</h3>
            <NuxtLink
              v-for="guide in guides"
              :key="guide.to"
              :to="guide.to"
              class="site-footer__link"
            >
              {{ guide.label }}
            </NuxtLink>
          </div>

          <div class="site-footer__column">
            <h3 class="site-footer__heading">{{ $t("footer.company") }}</h3>
            <NuxtLink
              v-for="item in company"
              :key="item.to"
              :to="item.to"
              class="site-footer__link"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
        </nav>
      </div>

      <div class="site-footer__notes">
        <section class="site-footer__note">
          <h3 class="site-footer__note-title">
            <v-icon size="18" color="#21a68d">mdi-shield-lock-outline</v-icon>
            {{ $t("footer.privacyFirst") }}
          </h3>
          <p class="site-footer__note-text">
            {{ $t("footer.privacyFirstDescription") }}
          </p>
        </section>

        <section class="site-footer__note">
          <h3 class="site-footer__note-title">
            <v-icon size="18" color="#21a68d">mdi-code-tags</v-icon>
            {{ $t("footer.openSource") }}
          </h3>
          <p class="site-footer__note-text">
            {{ $t("footer.openSourceDescription") }}
          </p>
        </section>
      </div>

      <p class="site-footer__legal">
        &copy; {{ new Date().getFullYear() }} WhatsAnalyze
      </p>
    </div>
  </footer>
</template>

<script setup>
import { computed } from "vue";

const { t } = useI18n();
const localePath = useLocalePath();
const { allTools } = useToolsNav();

const guides = computed(() => [
  {
    to: localePath("/how-to-export-your-whatsapp-chat"),
    label: t("pageNameExport"),
  },
  {
    to: localePath("/switch-from-whatsapp-to-signal"),
    label: t("pageNameSignal"),
  },
  { to: localePath("/wrapped"), label: t("nav.appTitle") },
]);

const company = computed(() => [
  { to: localePath("/about"), label: t("about") },
  { to: localePath("/subscribe"), label: t("nav.subscription") },
  { to: localePath("/impressum"), label: "Imprint" },
]);
</script>

<style lang="scss" scoped>
.site-footer {
  background: $wa-surface-dark;
  color: $wa-ink-invert-muted;
  border-top: 1px solid $wa-border-invert;
}

.site-footer__inner {
  max-width: $wa-shell-width;
  margin: 0 auto;
  padding: clamp(3rem, 7vw, 4.5rem) 1.5rem 2.5rem;
}

.site-footer__top {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 2fr;
  gap: clamp(2rem, 5vw, 4rem);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
}

.site-footer__brand-link {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}

.site-footer__logo {
  height: 28px;
  width: auto;
}

.site-footer__wordmark {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: $wa-ink-invert;
}

.site-footer__tagline {
  margin: 0.9rem 0 1.1rem;
  font-size: 0.92rem;
  line-height: 1.5;
  color: $wa-ink-invert-faint;
}

.site-footer__github {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: $wa-accent-light;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.site-footer__columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }
}

.site-footer__column {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.site-footer__heading {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $wa-ink-invert-faint;
  margin-bottom: 0.2rem;
}

.site-footer__link {
  font-size: 0.92rem;
  line-height: 1.4;
  color: $wa-ink-invert-muted;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: $wa-ink-invert;
  }
}

.site-footer__notes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  margin-top: clamp(2.5rem, 6vw, 4rem);
  padding-top: clamp(2rem, 4vw, 2.5rem);
  border-top: 1px solid $wa-border-invert;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
}

.site-footer__note-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1rem;
  font-weight: 700;
  color: $wa-ink-invert;
  margin-bottom: 0.5rem;
}

.site-footer__note-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: $wa-ink-invert-faint;
  margin: 0;
  max-width: 42rem;
}

.site-footer__legal {
  margin: clamp(2rem, 5vw, 3rem) 0 0;
  padding-top: 1.5rem;
  border-top: 1px solid $wa-border-invert;
  font-size: 0.8rem;
  color: $wa-ink-invert-faint;
  text-align: center;
}
</style>
