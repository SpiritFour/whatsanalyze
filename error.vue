<template>
  <NuxtLayout name="default">
    <section class="error-page">
      <p v-if="error?.statusCode" class="error-page__code">
        {{ error.statusCode }}
      </p>
      <h1 class="error-page__title">{{ title }}</h1>
      <p class="error-page__text">{{ description }}</p>

      <div class="error-page__actions">
        <NuxtLink
          :to="homePath"
          class="error-page__primary"
          @click.prevent="goTo(homePath)"
        >
          {{ $t("errorPage.backHome") }}
        </NuxtLink>
        <NuxtLink
          :to="wrappedPath"
          class="error-page__secondary"
          @click.prevent="goTo(wrappedPath)"
        >
          {{ $t("errorPage.toWrapped") }}
        </NuxtLink>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup>
const props = defineProps({
  error: {
    type: Object,
    default: null,
  },
});

const { t } = useI18n();
const localePath = useLocalePath();

const isNotFound = computed(() => props.error?.statusCode === 404);
const title = computed(() =>
  t(isNotFound.value ? "errorPage.notFoundTitle" : "errorPage.genericTitle"),
);
const description = computed(() =>
  t(isNotFound.value ? "errorPage.notFoundText" : "errorPage.genericText"),
);

const homePath = computed(() => localePath("/"));
const wrappedPath = computed(() => localePath("/wrapped"));

// A NuxtLink on its own leaves the error in place and the user on this page,
// so every way out of here has to clear it first.
const goTo = (path) => clearError({ redirect: path });

useSeoMeta({ title, robots: "noindex" });
</script>

<style lang="scss" scoped>
.error-page {
  max-width: 640px;
  margin: 0 auto;
  padding: clamp(4rem, 12vw, 8rem) 1.5rem;
  text-align: center;
}

.error-page__code {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: $wa-ink-faint;
}

.error-page__title {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 700;
  color: $wa-ink;
  margin: 0.5rem 0 1rem;
}

.error-page__text {
  font-size: 1.05rem;
  color: $wa-ink-muted;
}

.error-page__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2.5rem;
}

.error-page__primary {
  display: inline-block;
  padding: 0.9em 2.2em;
  border-radius: 999px;
  background: $wa-accent;
  color: #ffffff;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 10px 30px rgba(33, 166, 141, 0.35);

  &:hover {
    background: $wa-accent-light;
  }
}

.error-page__secondary {
  color: $wa-accent;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
