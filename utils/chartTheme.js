/**
 * One look for every chart on the site.
 *
 * The charts used to carry their options inline, so the same bar chart looked
 * one way on the homepage and another way in the results. Everything visual
 * lives here now: components say what they plot, not how it is painted.
 *
 * The values mirror the design tokens in assets/_theme-variables.scss. They
 * are literals because Chart.js paints on a canvas and cannot read CSS custom
 * properties.
 */
const INK = "#1d1d1f";
const INK_MUTED = "rgba(29, 29, 31, 0.68)";
const INK_FAINT = "rgba(29, 29, 31, 0.45)";
const GRID = "rgba(29, 29, 31, 0.07)";
const SURFACE = "#ffffff";
const SURFACE_DARK = "#0d1418";

export const chartFontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const legend = (compact = false) => ({
  position: "bottom",
  labels: {
    usePointStyle: true,
    pointStyle: "circle",
    boxWidth: 8,
    boxHeight: 8,
    padding: compact ? 12 : 18,
    color: INK_MUTED,
    font: { family: chartFontFamily, size: compact ? 11 : 12, weight: "600" },
  },
});

// Dark, rounded, no border — the same card the rest of the site uses for
// overlays, so a tooltip does not look like a browser default.
const tooltip = {
  backgroundColor: SURFACE_DARK,
  titleColor: "#f5f5f7",
  bodyColor: "rgba(245, 245, 247, 0.78)",
  titleFont: { family: chartFontFamily, size: 13, weight: "700" },
  bodyFont: { family: chartFontFamily, size: 12, weight: "500" },
  padding: 12,
  cornerRadius: 10,
  boxPadding: 6,
  usePointStyle: true,
  displayColors: true,
  borderWidth: 0,
};

const ticks = (compact = false) => ({
  color: INK_FAINT,
  font: { family: chartFontFamily, size: compact ? 10 : 11, weight: "500" },
  padding: 6,
});

const axisTitle = (text) => ({
  display: Boolean(text),
  text,
  color: INK_FAINT,
  font: { family: chartFontFamily, size: 11, weight: "600" },
});

function base(compact) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    animation: { duration: 500, easing: "easeOutQuart" },
    plugins: { legend: legend(compact), tooltip },
  };
}

/**
 * @param {object} opts
 * @param {boolean} opts.stacked  Bars stack once a group gets too crowded to read side by side.
 * @param {string}  opts.axisLabel Y axis title; omitted in the compact preview.
 * @param {boolean} opts.compact  The homepage preview: smaller type, no y axis.
 */
export function barOptions({
  stacked = false,
  axisLabel = "",
  compact = false,
} = {}) {
  return {
    ...base(compact),
    // Thin bars with a rounded top read as marks rather than as blocks.
    borderRadius: 6,
    borderSkipped: false,
    maxBarThickness: compact ? 18 : 26,
    categoryPercentage: 0.72,
    barPercentage: 0.86,
    scales: {
      x: {
        stacked,
        grid: { display: false },
        border: { display: false },
        ticks: {
          ...ticks(compact),
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: compact ? 8 : 12,
        },
      },
      y: {
        stacked,
        display: !compact,
        beginAtZero: true,
        grid: { color: GRID, drawTicks: false },
        border: { display: false },
        ticks: { ...ticks(compact), precision: 0 },
        title: axisTitle(compact ? "" : axisLabel),
      },
    },
  };
}

export function lineOptions({ axisLabel = "", compact = false } = {}) {
  return {
    ...base(compact),
    plugins: {
      // One series, so the title above the chart names it and a legend box
      // would only repeat itself.
      legend: { display: false },
      tooltip,
    },
    elements: {
      line: { tension: 0.35, borderWidth: 2, fill: true },
      point: { radius: 0, hitRadius: 12, hoverRadius: 4 },
    },
    scales: {
      x: {
        type: "time",
        grid: { display: false },
        border: { display: false },
        ticks: { ...ticks(compact), maxRotation: 0, autoSkip: true },
      },
      y: {
        display: !compact,
        beginAtZero: true,
        grid: { color: GRID, drawTicks: false },
        border: { display: false },
        ticks: { ...ticks(compact), precision: 0 },
        title: axisTitle(compact ? "" : axisLabel),
      },
    },
  };
}

export function doughnutOptions({ compact = false, centerText = null } = {}) {
  return {
    ...base(compact),
    maintainAspectRatio: true,
    aspectRatio: 1,
    // A ring, not a pie: the hole is where the total goes.
    cutout: "62%",
    plugins: {
      legend: legend(compact),
      tooltip,
      centerText,
    },
  };
}

export function radarOptions({ compact = false } = {}) {
  return {
    ...base(compact),
    maintainAspectRatio: true,
    aspectRatio: 1,
    interaction: { mode: "nearest", intersect: true },
    elements: {
      line: { borderWidth: 2, tension: 0.25 },
      point: { radius: compact ? 0 : 3, hoverRadius: 5 },
    },
    scales: {
      r: {
        beginAtZero: true,
        angleLines: { color: GRID },
        grid: { color: GRID, circular: true },
        border: { display: false },
        ticks: {
          display: !compact,
          backdropColor: "transparent",
          color: INK_FAINT,
          font: { family: chartFontFamily, size: 10, weight: "500" },
          precision: 0,
        },
        pointLabels: {
          color: INK_MUTED,
          font: {
            family: chartFontFamily,
            size: compact ? 10 : 11,
            weight: "600",
          },
        },
      },
    },
  };
}

/** Doughnut segments keep a hairline of the card between them. */
export function separateSegments(data) {
  if (!data || !Array.isArray(data.datasets)) return data;
  return {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      borderColor: SURFACE,
      borderWidth: 2,
      hoverOffset: 8,
    })),
  };
}

/**
 * Chart.js plugin: the headline number in the hole of the doughnut. Only
 * draws when a chart passes `plugins.centerText`.
 */
export const doughnutCenterText = {
  id: "centerText",
  afterDraw(chart, _args, options) {
    if (!options || !options.value) return;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const x = (chartArea.left + chartArea.right) / 2;
    const y = (chartArea.top + chartArea.bottom) / 2;
    const radius =
      Math.min(
        chartArea.right - chartArea.left,
        chartArea.bottom - chartArea.top
      ) / 2;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = INK;
    ctx.font = `700 ${Math.max(16, radius * 0.3)}px ${chartFontFamily}`;
    ctx.fillText(
      String(options.value),
      x,
      options.label ? y - radius * 0.08 : y
    );

    if (options.label) {
      ctx.fillStyle = INK_FAINT;
      ctx.font = `600 ${Math.max(10, radius * 0.11)}px ${chartFontFamily}`;
      ctx.fillText(options.label, x, y + radius * 0.2);
    }
    ctx.restore();
  },
};
