<template>
  <div class="stats-mock">
    <div class="stats-mock__card">
      <!-- Says out loud that these are made-up numbers. It used to read as a
           real report, with a hard-coded axis that ended in 2024. -->
      <span class="stats-mock__badge mono-label">{{ exampleLabel }}</span>
      <div class="stats-mock__numbers" aria-hidden="true">
        <div class="stats-mock__stat">
          <span class="stats-mock__value">1,247</span>
          <span class="stats-mock__label">{{ daysLabel }}</span>
        </div>
        <div class="stats-mock__stat">
          <span class="stats-mock__value">86,412</span>
          <span class="stats-mock__label">{{ messagesLabel }}</span>
        </div>
        <div class="stats-mock__stat">
          <span class="stats-mock__value">2</span>
          <span class="stats-mock__label">{{ peopleLabel }}</span>
        </div>
      </div>
      <div class="stats-mock__chart" aria-hidden="true">
        <div
          v-for="(bar, index) in bars"
          :key="index"
          class="stats-mock__bar"
          :style="{ height: bar + '%' }"
        ></div>
      </div>
      <div class="stats-mock__axis" aria-hidden="true">
        <span v-for="year in axisYears" :key="year">{{ year }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LandingStatsMock",
  props: {
    daysLabel: { type: String, default: "days" },
    messagesLabel: { type: String, default: "messages" },
    peopleLabel: { type: String, default: "people" },
    exampleLabel: { type: String, default: "Example data" },
  },
  data() {
    return {
      bars: [
        22,
        30,
        26,
        38,
        34,
        45,
        40,
        52,
        47,
        58,
        55,
        66,
        60,
        72,
        68,
        80,
        74,
        86,
        82,
        92,
        88,
        96,
        90,
        100,
      ],
    };
  },
  computed: {
    // The four years ending with the current one, so the mock cannot go stale.
    axisYears() {
      const thisYear = new Date().getFullYear();
      return [thisYear - 3, thisYear - 2, thisYear - 1, thisYear];
    },
  },
};
</script>

<style lang="scss" scoped>
.stats-mock {
  max-width: 560px;
  margin: 0 auto;
}

.stats-mock__card {
  position: relative;
  background: #ffffff;
  color: #1d1d1f;
  border-radius: 20px;
  padding: clamp(1.6rem, 4vw, 2.4rem);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
  text-align: left;
}

.stats-mock__badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 3px 9px;
  border-radius: $wa-radius-pill;
  background: $wa-surface-light;
  color: $wa-ink-faint;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.stats-mock__numbers {
  display: flex;
  gap: clamp(1.2rem, 4vw, 2.5rem);
  flex-wrap: wrap;
}

.stats-mock__stat {
  display: flex;
  flex-direction: column;
}

.stats-mock__value {
  font-size: clamp(1.6rem, 4vw, 2.3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.stats-mock__label {
  font-size: 0.8rem;
  color: rgba(29, 29, 31, 0.55);
}

.stats-mock__chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  margin-top: 1.8rem;
}

.stats-mock__bar {
  flex: 1;
  border-radius: 3px 3px 0 0;
  background: linear-gradient(180deg, $c-blue-accent-light, $c-blue-accent);
  min-height: 8px;
}

.stats-mock__axis {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.72rem;
  color: rgba(29, 29, 31, 0.45);
}
</style>
