<template>
  <div class="bluf-card">
    <div class="bluf-header">
      <span class="bluf-badge">
        <v-icon size="14" color="#21a68d" class="mr-1">mdi-flash</v-icon>
        SUMMARY / BLUF
      </span>
      <span class="bluf-tag mono-label">LLM-READY DEFINITION</span>
    </div>

    <h2 class="bluf-title">{{ title }}</h2>
    <p class="bluf-summary">
      {{ summary }}
    </p>

    <!-- Key Quick Facts Table for LLM ingestion -->
    <div v-if="facts && facts.length > 0" class="bluf-facts-grid">
      <div v-for="fact in facts" :key="fact.label" class="fact-item">
        <span class="fact-label mono-label">{{ fact.label }}</span>
        <span class="fact-value">{{ fact.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface BlufFact {
  label: string;
  value: string;
}

defineProps<{
  title: string;
  summary: string;
  facts?: BlufFact[];
}>();
</script>

<style scoped lang="scss">
.bluf-card {
  width: 100%;
  max-width: 820px;
  margin: 0 auto 32px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px 28px;
}

.bluf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.bluf-badge {
  display: inline-flex;
  align-items: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.74rem;
  font-weight: 600;
  color: #60d8bd;
  background: rgba(33, 166, 141, 0.1);
  border: 1px solid rgba(33, 166, 141, 0.25);
  padding: 3px 10px;
  border-radius: 6px;
}

.mono-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.72rem;
  color: #718096;
}

.bluf-title {
  color: #f7fafc;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 8px;
}

.bluf-summary {
  color: #cbd5e0;
  font-size: 0.94rem;
  line-height: 1.6;
  margin-bottom: 16px;
}

.bluf-facts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 12px;
  padding: 14px 18px;
}

.fact-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fact-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fact-value {
  color: #edf2f7;
  font-size: 0.9rem;
  font-weight: 500;
}
</style>
