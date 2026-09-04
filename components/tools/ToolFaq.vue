<template>
  <section class="tool-faq-section">
    <div class="faq-header">
      <div class="faq-badge mono-label">
        <v-icon size="14" color="#21a68d" class="mr-1"
          >mdi-help-circle-outline</v-icon
        >
        TECHNICAL SPEC & FAQS
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
  color: #60d8bd;
  background: rgba(33, 166, 141, 0.1);
  padding: 4px 12px;
  border-radius: 100px;
  margin-bottom: 12px;
}

.faq-title {
  color: #ffffff;
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
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease;

  &.is-open {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(33, 166, 141, 0.3);
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
  color: #f7fafc;
  font-size: 1.02rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover {
    color: #60d8bd;
  }
}

.faq-chevron {
  color: #a0aec0;
  transition: transform 0.25s ease;

  &.rotate-180 {
    transform: rotate(180deg);
    color: #60d8bd;
  }
}

.faq-answer {
  padding: 0 24px 20px;
  color: #a0aec0;
  font-size: 0.92rem;
  line-height: 1.6;

  p {
    margin: 0;
  }
}
</style>
