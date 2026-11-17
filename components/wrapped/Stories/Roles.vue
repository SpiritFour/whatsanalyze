<template>
  <WrappedStoryContainer
    theme="violet"
    :eyebrow="t('results.story.roles.eyebrow')"
    :title="t('results.story.roles.title')"
  >
    <div
      class="role-list"
      :class="{ 'role-list--compact': cast.length > 2 }"
      data-testid="roles"
    >
      <div
        v-for="(person, index) in cast"
        :key="person.name"
        class="role story-card story-in"
        :style="{ '--i': index * 2 + 2 }"
      >
        <span class="role__emoji story-pop" :style="{ '--i': index * 2 + 3 }">
          {{ ROLE_EMOJI[person.role!.id] }}
        </span>
        <div class="min-w-0">
          <p class="role__name">{{ person.short }}</p>
          <p class="role__title">{{ roleTitle(person.role!.id) }}</p>
          <p class="role__line">
            {{ roleLine(person.role!.id, person.role!.value) }}
          </p>
        </div>
      </div>
    </div>

    <button
      v-if="!isSample"
      type="button"
      class="story-btn story-btn--small story-in mt-2"
      style="--i: 8"
      :disabled="card.busy.value || !card.ready.value"
      @click="card.share"
    >
      {{ t("results.story.card.share") }}
    </button>
    <p v-if="card.statusText.value" class="text-xs font-semibold">
      {{ card.statusText.value }}
    </p>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import {
  ROLE_EMOJI,
  useWrappedCard,
  useWrappedStory,
} from "~/composables/useWrappedStory";
import { useStoryContext } from "~/utils/wrapped/story";

const { people, roleTitle, roleLine, t } = useWrappedStory();
// The sample chat is nobody's to post, as on the closing slide.
const context = useStoryContext();
const isSample = computed(() => context?.isSample.value ?? false);
const card = useWrappedCard("roles");

const cast = computed(() =>
  people.value.filter((person) => person.role).slice(0, 4),
);
</script>

<style scoped>
.role-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  max-width: 19rem;
  margin-top: 0.3rem;
}

.role {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  text-align: left;
}

.role__emoji {
  font-size: 2.8rem;
  line-height: 1;
}

.role__name {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--s-accent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role__title {
  margin: 0.1rem 0;
  font-size: 1.3rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.role__line {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--s-muted);
}

.role-list--compact .role {
  padding: 0.5rem 0.85rem;
}

.role-list--compact .role__emoji {
  font-size: 1.9rem;
}

.role-list--compact .role__title {
  font-size: 1.02rem;
}

.role-list--compact .role__line {
  font-size: 0.72rem;
}
</style>
