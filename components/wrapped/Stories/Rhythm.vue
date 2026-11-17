<template>
  <WrappedStoryContainer
    theme="night"
    :eyebrow="t('results.story.rhythm.eyebrow')"
    :title="t('results.conversation.rhythm.title')"
  >
    <template v-if="summary">
      <div class="mt-1 flex w-full items-stretch justify-center gap-3">
        <div
          class="story-card story-in flex-1 px-3 py-2 text-left"
          style="--i: 2"
        >
          <p class="rhythm-label">
            {{ t("results.conversation.rhythm.mostActiveMonth") }}
          </p>
          <p class="rhythm-value">{{ prettyMonth(summary.maxMonth) }}</p>
        </div>
        <div
          class="story-card story-in flex-1 px-3 py-2 text-left"
          style="--i: 3"
        >
          <p class="rhythm-label">
            {{ t("results.conversation.rhythm.maxMessagesPerMonth") }}
          </p>
          <p class="rhythm-value">{{ summary.max.toLocaleString(locale) }}</p>
        </div>
      </div>

      <div class="story-in h-56 w-full px-1 lg:h-72" style="--i: 5">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </template>

    <div
      class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs"
    >
      <div
        v-for="item in legendMeta"
        :key="item.name"
        class="flex items-center gap-2"
      >
        <span :class="item.dotClass" class="h-2.5 w-2.5 rounded-full" />
        <span class="text-slate-100">{{ item.name }}</span>
      </div>
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { Line } from "vue-chartjs";
import "~/utils/chartSetup";
import {
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useI18n } from "vue-i18n";
import { useStatsStore } from "~/stores/wrapped/stats";
import { shortName } from "~/utils/wrapped/story";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const statsStore = useStatsStore();
const { result } = storeToRefs(statsStore);
const { t, locale } = useI18n();

// The busiest few: a group of twenty is a tangle of lines nobody can read.
const authors = computed(() => {
  const named = result.value?.getHighlights?.people.map((p) => p.name);
  return (named ?? statsStore.getAuthors ?? []).slice(0, 4);
});

const authorColors = [
  {
    borderColor: "#22d3ee",
    backgroundColor: "rgba(45,212,191,0.16)",
    dotClass: "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]",
  },
  {
    borderColor: "#fb7185",
    backgroundColor: "rgba(251,113,133,0.14)",
    dotClass: "bg-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.9)]",
  },
  // add more colors if needed
  {
    borderColor: "#a855f7",
    backgroundColor: "rgba(168,85,247,0.16)",
    dotClass: "bg-purple-300 shadow-[0_0_12px_rgba(196,181,253,0.9)]",
  },
  {
    borderColor: "#4ade80",
    backgroundColor: "rgba(74,222,128,0.16)",
    dotClass: "bg-emerald-300 shadow-[0_0_12px_rgba(74,222,128,0.9)]",
  },
];

type MessagesPerMonth = Record<string, number>;

const prettyMonth = (value: string) => {
  if (!value || !value.includes("-")) return value; // fallback

  const [year, month] = value.split("-");
  const y = Number(year);
  const m = Number(month);

  if (!y || !m) return value; // invalid split → return original

  const date = new Date(y, m - 1, 1);
  // One year on the axis: the month says it all.
  return date.toLocaleString(locale.value, { month: "short" });
};

const chartData = computed<ChartData<"line">>(() => {
  const authorList = authors.value;
  if (!result.value || !authorList.length) return { labels: [], datasets: [] };

  const messagesData = result.value.getNumberOfMessagesPerMonth as Record<
    string,
    MessagesPerMonth
  >;

  // collect per-author data
  const perAuthorData = authorList.map(
    (name) => messagesData[name] ?? ({} as MessagesPerMonth),
  );

  // union of all months across authors
  const labels = Array.from(
    new Set(perAuthorData.flatMap((data) => Object.keys(data))),
  ).sort();

  return {
    labels,
    datasets: authorList.map((name, index) => {
      const authorData = perAuthorData[index];
      const color = authorColors[index % authorColors.length];

      return {
        label: name,
        data: labels.map((month) => authorData[month] ?? 0),
        borderColor: color.borderColor,
        backgroundColor: color.backgroundColor,
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHitRadius: 12,
        pointHoverRadius: 4,
      };
    }),
  };
});

const chartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 900,
    easing: "easeOutQuart",
  },
  plugins: {
    legend: {
      display: false, // custom legend in the template
    },
    title: {
      display: false,
    },
    tooltip: {
      intersect: false,
      mode: "index",
      backgroundColor: "rgba(15,23,42,0.95)",
      borderColor: "rgba(148,163,184,0.6)",
      borderWidth: 1,
      padding: 10,
      displayColors: false,
      callbacks: {
        title: (items) => {
          if (!items[0]?.chart?.data?.labels) return "";
          const index = items[0].dataIndex;
          const rawLabel = items[0]?.chart?.data?.labels[index] as string;
          return prettyMonth(rawLabel);
        },
        label: (ctx) => {
          const label = ctx.dataset.label ?? "";
          const value = ctx.parsed.y ?? 0;
          return t("results.conversation.rhythm.tooltip", {
            name: label,
            value,
          });
        },
      },
    },
  },
  layout: {
    padding: {
      left: 0,
      right: 8,
      top: 10,
      bottom: 2,
    },
  },
  scales: {
    x: {
      type: "category",
      grid: {
        display: false,
      },
      ticks: {
        color: "#e5e7eb",
        maxRotation: 0,
        autoSkipPadding: 20,
        callback: function (value) {
          return prettyMonth(this.getLabelForValue(Number(value)));
        },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(148,163,184,0.18)",
        drawTicks: false,
      },
      ticks: {
        display: false,
      },
      border: {
        display: false,
      },
    },
  },
};

const summary = computed(() => {
  const authorList = authors.value;
  if (!result.value || !authorList.length) return null;

  const messagesData = result.value.getNumberOfMessagesPerMonth as Record<
    string,
    MessagesPerMonth
  >;

  const perAuthorData = authorList.map(
    (name) => messagesData[name] ?? ({} as MessagesPerMonth),
  );

  const labels = Array.from(
    new Set(perAuthorData.flatMap((data) => Object.keys(data))),
  ).sort();

  if (!labels.length) return null;

  let maxMonth = labels[0];
  let max = 0;
  let totalMessages = 0;

  for (const month of labels) {
    const totalForMonth = perAuthorData.reduce(
      (sum, authorData) => sum + (authorData[month] ?? 0),
      0,
    );
    totalMessages += totalForMonth;
    if (totalForMonth > max) {
      max = totalForMonth;
      maxMonth = month;
    }
  }

  return {
    maxMonth,
    max,
    totalMessages,
    firstMonth: labels[0],
  };
});

// legend metadata for template
const legendMeta = computed(() =>
  authors.value.map((name, index) => {
    const color = authorColors[index % authorColors.length];
    return {
      name: shortName(name),
      dotClass: color.dotClass,
    };
  }),
);
</script>

<style scoped>
.rhythm-label {
  margin: 0;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--s-accent);
}

.rhythm-value {
  margin: 0.15rem 0 0;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1.1;
}
</style>
