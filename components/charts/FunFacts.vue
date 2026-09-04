<template>
  <div class="fun-facts">
    <canvas ref="canvas" style="display: none"></canvas>
    <div v-for="(person, idx) in data" :key="idx" class="person-facts">
      <div
        class="text-h4 font-weight-bold py-5"
        :style="'color: white; background: ' + person.color"
      >
        {{ person.name }}
      </div>

      <div class="text-left mt-8">
        <div>
          <v-icon :color="person.color">mdi-book</v-icon>

          {{ $t("totalWords") }} <b>{{ person.numberOfWords }}</b>
        </div>

        <br />

        <!-- TODO: We need a count of how often emojies are used -->
        <div>
          <v-icon :color="person.color"> mdi-emoticon-excited-outline </v-icon>
          {{ $t("mostUsedEmojie") }}
          <span v-for="emojie in person.sortedEmojis" :key="emojie">
            {{ emojie }} {{ emojie.count }}
          </span>
        </div>

        <br />

        <div>
          <v-icon :color="person.color"> mdi-android-messages </v-icon>
          {{ $t("longestMessage") }}
          <b>{{ person.longestMessage }}</b> words
        </div>

        <br />

        <div>
          <v-icon :color="person.color"> mdi-star </v-icon>
          {{ $t("uniqueWords") }}
          <b>{{ person.uniqueWords }}</b>
        </div>

        <br />

        <div>
          <v-icon :color="person.color"> mdi-android-studio </v-icon>
          {{ $t("avgWords") }}
          <b>{{ person.averageMessageLength }}</b>
        </div>
      </div>
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

        const totalWordsLabel = this.$t("totalWords") || "Total words:";
        const mostUsedLabel = this.$t("mostUsedEmojie") || "Most used emojis:";
        const longestMessageLabel =
          this.$t("longestMessage") || "Longest message:";
        const uniqueWordsLabel = this.$t("uniqueWords") || "Unique words:";
        const avgWordsLabel = this.$t("avgWords") || "Avg words / message:";

        const emojiList = Array.from(person.sortedEmojis || []);
        const emojiStr =
          emojiList
            .map((e) => (typeof e === "string" ? e : e?.emoji || ""))
            .filter(Boolean)
            .join(" ") || "-";

        const rows = [
          {
            icon: "📖",
            label: totalWordsLabel,
            value: (person.numberOfWords || 0).toLocaleString(),
          },
          {
            icon: "😊",
            label: mostUsedLabel,
            value: emojiStr,
          },
          {
            icon: "💬",
            label: longestMessageLabel,
            value: `${person.longestMessage || 0} words`,
          },
          {
            icon: "⭐",
            label: uniqueWordsLabel,
            value: (person.uniqueWords || 0).toLocaleString(),
          },
          {
            icon: "📐",
            label: avgWordsLabel,
            value: `${person.averageMessageLength || 0}`,
          },
        ];

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

<style lang="scss">
.fun-facts {
  overflow: hidden;
}

.person-facts {
  display: inline-block;
  margin: 1em;
  padding: 1em;
  border: 2px solid $c-white;
}
</style>
