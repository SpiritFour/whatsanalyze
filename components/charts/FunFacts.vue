<template>
  <div class="wa-scope fun-facts">
    <canvas ref="canvas" style="display: none"></canvas>
    <div class="grid gap-4" :class="gridClass">
      <article
        v-for="(person, idx) in data"
        :key="idx"
        class="rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-5"
      >
        <header class="flex items-center gap-3">
          <span
            class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
            :style="{ background: person.color }"
            aria-hidden="true"
          >
            {{ initial(person.name) }}
          </span>
          <h4
            class="m-0 truncate text-base font-bold leading-tight text-wa-ink"
            :title="person.name"
          >
            {{ person.name }}
          </h4>
        </header>

        <dl class="m-0 mt-4 grid grid-cols-2 gap-2">
          <div
            v-for="row in numberRows(person)"
            :key="row.label"
            class="rounded-token bg-[#f5f5f7] px-3 py-2.5"
          >
            <dt
              class="text-[0.65rem] font-semibold leading-tight text-wa-ink-faint"
            >
              {{ row.label }}
            </dt>
            <dd class="m-0 mt-1 text-lg font-bold tabular-nums text-wa-ink">
              {{ row.value }}
            </dd>
          </div>
        </dl>

        <div
          v-if="emojiRow(person)"
          class="mt-3 flex items-center justify-between gap-3 border-0 border-t border-solid border-[rgba(29,29,31,0.06)] pt-3"
        >
          <span class="text-xs text-wa-ink-faint">
            {{ emojiRow(person).label }}
          </span>
          <span class="text-xl leading-none">{{ emojiRow(person).value }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<script>
export default {
  props: ["chartdata"],
  data() {
    return {
      data: [],
    };
  },
  computed: {
    /**
     * A two-person chat gets one card per row: at three columns the pair sat
     * in two thirds of the width with a hole next to them.
     */
    gridClass() {
      if (this.data.length <= 2) return "sm:grid-cols-1";
      return "sm:grid-cols-2 lg:grid-cols-3";
    },
  },
  watch: {
    chartdata: {
      handler() {
        this.updateGraph();
      },
      deep: true,
    },
  },
  mounted() {
    this.updateGraph();
  },
  methods: {
    /** First letter of the name, for the colour chip that identifies them. */
    initial(name) {
      return (name || "?").trim().charAt(0).toUpperCase();
    },
    /** The four counts, shown as tiles. */
    numberRows(person) {
      return this.factRows(person).filter((row) => !row.isEmoji);
    },
    /** Emojis are not a number and do not belong in a number tile. */
    emojiRow(person) {
      return this.factRows(person).find((row) => row.isEmoji);
    },
    /**
     * The five facts per person, in one place: the cards on screen and the
     * image the share button hands out have to say the same thing.
     */
    factRows(person) {
      const emojis = Array.from(person.sortedEmojis || [])
        .map((e) => (typeof e === "string" ? e : e?.emoji || ""))
        .filter(Boolean)
        .join(" ");

      return [
        {
          icon: "\u{1F4D6}",
          label: this.$t("totalWords"),
          value: (person.numberOfWords || 0).toLocaleString(),
        },
        {
          icon: "\u{1F60A}",
          label: this.$t("mostUsedEmojie"),
          value: emojis || "-",
          isEmoji: true,
        },
        {
          icon: "\u{1F4AC}",
          label: this.$t("longestMessage"),
          value: `${person.longestMessage || 0}`,
        },
        {
          icon: "\u2B50",
          label: this.$t("uniqueWords"),
          value: (person.uniqueWords || 0).toLocaleString(),
        },
        {
          icon: "\u{1F4D0}",
          label: this.$t("avgWords"),
          value: `${person.averageMessageLength || 0}`,
        },
      ];
    },
    async updateGraph() {
      if (!this.chartdata?.getFunFacts) return;
      this.data = await this.chartdata.getFunFacts();
      this.$nextTick(() => {
        this.renderCanvas();
      });
    },
    renderCanvas() {
      const canvas = this.$refs.canvas;
      if (!canvas || !this.data || !this.data.length) return;

      const cardWidth = 340;
      const cardHeight = 360;
      const gap = 30;
      const margin = 20;

      const count = this.data.length;
      const width = margin * 2 + count * cardWidth + (count - 1) * gap;
      const height = margin * 2 + cardHeight;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      this.data.forEach((person, idx) => {
        const x = margin + idx * (cardWidth + gap);
        const y = margin;

        // Card outline
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, cardWidth, cardHeight, 12);
        } else {
          ctx.rect(x, y, cardWidth, cardHeight);
        }
        ctx.fill();
        ctx.stroke();

        // Card header with person's color
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, cardWidth, 75, [12, 12, 0, 0]);
        } else {
          ctx.rect(x, y, cardWidth, 75);
        }
        ctx.clip();
        ctx.fillStyle = person.color || "#00535f";
        ctx.fillRect(x, y, cardWidth, 75);
        ctx.restore();

        // Person Name
        ctx.fillStyle = "#ffffff";
        ctx.font =
          "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(person.name || "", x + cardWidth / 2, y + 38);

        // Stats rows
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const startY = y + 115;
        const rowHeight = 46;

        const rows = this.factRows(person);

        rows.forEach((row, rIdx) => {
          const rowY = startY + rIdx * rowHeight;
          // Icon
          ctx.font =
            "20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.fillText(row.icon, x + 24, rowY);

          // Label
          ctx.fillStyle = "#4b5563";
          ctx.font =
            "15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.fillText(row.label, x + 56, rowY);

          // Value
          ctx.fillStyle = "#111827";
          ctx.font =
            "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const valX = x + cardWidth - 24;
          ctx.textAlign = "right";
          ctx.fillText(row.value, valX, rowY);
          ctx.textAlign = "left";
        });
      });
    },
  },
};
</script>

<style scoped>
.fun-facts {
  overflow: hidden;
}
</style>
