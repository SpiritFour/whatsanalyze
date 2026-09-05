<template>
  <div class="doc-mock" aria-hidden="true">
    <div class="doc-mock__sheet doc-mock__sheet--back"></div>
    <div class="doc-mock__sheet">
      <div class="doc-mock__header">
        <span class="doc-mock__kicker">Chat Transcript</span>
        <span class="doc-mock__meta">WhatsApp export · 2 participants</span>
        <span class="doc-mock__meta"
          >Aug 26, 2019 – Feb 16, 2021 · 537 messages</span
        >
      </div>
      <div class="doc-mock__divider">Jan 14, 2021</div>
      <div v-for="row in rows" :key="row.time + row.text" class="doc-mock__row">
        <span class="doc-mock__time">{{ row.time }}</span>
        <span class="doc-mock__body">
          <span class="doc-mock__name">{{ row.name }}</span>
          {{ row.text }}
        </span>
      </div>
      <div class="doc-mock__footer">
        <span>whatsanalyze.com</span>
        <span>Page 3 of 24</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LandingDocMock",
  data() {
    return {
      rows: [
        {
          time: "09:14",
          name: "Alex",
          text: "Did you get my messages yesterday?",
        },
        {
          time: "09:16",
          name: "Sam",
          text: "Yes, all of them. I kept everything.",
        },
        {
          time: "09:17",
          name: "Alex",
          text: "Good. We might need them later.",
        },
        {
          time: "12:02",
          name: "Sam",
          text: "I exported the whole chat this morning.",
        },
        {
          time: "12:05",
          name: "Alex",
          text: "Every message, with date and time.",
        },
        { time: "12:06", name: "Sam", text: "Exactly. In black and white." },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
.doc-mock {
  position: relative;
  max-width: 520px;
  margin: 0 auto;
}

.doc-mock__sheet {
  position: relative;
  background: #ffffff;
  color: #1d1d1f;
  border-radius: 14px;
  padding: clamp(1.6rem, 4vw, 2.6rem);
  text-align: left;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);

  &--back {
    position: absolute;
    inset: 0;
    transform: rotate(-3deg) translateY(10px);
    background: rgba(255, 255, 255, 0.35);
    box-shadow: none;
  }
}

.doc-mock__header {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  border-bottom: 2px solid #1d1d1f;
  padding-bottom: 0.9rem;
}

.doc-mock__kicker {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.doc-mock__meta {
  font-size: 0.75rem;
  color: rgba(29, 29, 31, 0.6);
}

.doc-mock__divider {
  margin: 1.1rem 0 0.7rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(29, 29, 31, 0.45);
}

.doc-mock__row {
  display: flex;
  gap: 0.8rem;
  padding: 0.35rem 0;
  font-size: 0.85rem;
  line-height: 1.45;
}

.doc-mock__time {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: rgba(29, 29, 31, 0.45);
}

.doc-mock__name {
  font-weight: 700;
  margin-right: 0.35rem;

  &::after {
    content: ":";
  }
}

.doc-mock__footer {
  display: flex;
  justify-content: space-between;
  margin-top: 1.3rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(29, 29, 31, 0.15);
  font-size: 0.72rem;
  color: rgba(29, 29, 31, 0.45);
}
</style>
