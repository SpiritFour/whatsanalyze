<template>
  <div class="bluf-card">
    <div class="bluf-header">
      <span class="bluf-badge">
        <v-icon size="14" color="#21a68d" class="mr-1"
          >mdi-information-outline</v-icon
        >
        HOW IT WORKS
      </span>
      <span class="security-tag mono-label">
        <v-icon size="12" color="#059669" class="mr-1">mdi-shield-check</v-icon>
        100% PRIVATE & OFFLINE
      </span>
    </div>

    <h2 class="bluf-title">{{ title }}</h2>
    <p class="bluf-summary">
      {{ summary }}
    </p>

    <!-- Key Quick Facts Table -->
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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 24px 28px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
}

.bluf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.bluf-badge {
  display: inline-flex;
  align-items: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.74rem;
  font-weight: 700;
  color: #0f766e;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 3px 10px;
  border-radius: 6px;
  letter-spacing: 0.04em;
}

.security-tag {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.72rem;
  font-weight: 600;
  color: #059669;
}

.mono-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.bluf-title {
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 8px;
}

.bluf-summary {
  color: #334155;
  font-size: 0.96rem;
  line-height: 1.6;
  margin-bottom: 16px;
}

.bluf-facts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 18px;
}

.fact-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fact-label {
  color: #64748b;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fact-value {
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 600;
}
</style>
