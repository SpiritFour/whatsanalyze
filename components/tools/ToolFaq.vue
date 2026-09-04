<template>
  <section class="tool-faq-section">
    <div class="faq-header">
      <div class="faq-badge mono-label">
        <v-icon size="14" color="#0f766e" class="mr-1"
          >mdi-help-circle-outline</v-icon
        >
        QUESTIONS & ANSWERS
      </div>
      <h3 class="faq-title">Frequently Asked Questions</h3>
    </div>

    <div class="faq-list">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="faq-item"
        :class="{ 'is-open': openIndex === index }"
      >
        <button type="button" class="faq-question" @click="toggle(index)">
          <span>{{ item.question }}</span>
          <v-icon
            size="20"
            class="faq-chevron"
            :class="{ 'rotate-180': openIndex === index }"
          >
            mdi-chevron-down
          </v-icon>
        </button>

        <div v-show="openIndex === index" class="faq-answer">
          <p>{{ item.answer }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

export interface FaqItem {
  question: string;
  answer: string;
}

defineProps<{
  items: FaqItem[];
}>();

const openIndex = ref<number | null>(0);

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index;
}
</script>

<style scoped lang="scss">
.tool-faq-section {
  width: 100%;
  max-width: 820px;
  margin: 48px auto;
}

.faq-header {
  text-align: center;
  margin-bottom: 24px;
}

.faq-badge {
  display: inline-flex;
  align-items: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  color: #0f766e;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 4px 12px;
  border-radius: 100px;
  margin-bottom: 12px;
  font-weight: 600;
}

.faq-title {
  color: #0f172a;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;

  &.is-open {
    background: #ffffff;
    border-color: #21a68d;
  }
}

.faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  background: none;
  border: none;
  color: #0f172a;
  font-size: 1.02rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover {
    color: #21a68d;
  }
}

.faq-chevron {
  color: #64748b;
  transition: transform 0.25s ease;

  &.rotate-180 {
    transform: rotate(180deg);
    color: #21a68d;
  }
}

.faq-answer {
  padding: 0 24px 20px;
  color: #475569;
  font-size: 0.94rem;
  line-height: 1.6;

  p {
    margin: 0;
  }
}
</style>
