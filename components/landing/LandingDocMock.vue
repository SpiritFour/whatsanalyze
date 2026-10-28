<template>
  <!-- Two pages of the court transcript (utils/pdfCourt.ts) as they print:
       the cover's integrity record behind a page of the transcript. English
       in every locale, like the PDF itself. -->
  <div class="doc-mock" aria-hidden="true">
    <div class="doc-mock__sheet doc-mock__sheet--back">
      <div class="doc-mock__running">
        <span>WhatsApp chat transcript — Alex, Sam</span>
        <span>SHA-256 4f2a91c0e7d3b58a…</span>
      </div>
      <p class="doc-mock__title">WhatsApp chat transcript</p>
      <p class="doc-mock__heading">1. Document integrity &amp; audit record</p>
      <dl class="doc-mock__record">
        <template v-for="[label, value] in record" :key="label">
          <dt>{{ label }}</dt>
          <dd>{{ value }}</dd>
        </template>
      </dl>
    </div>

    <div class="doc-mock__sheet">
      <div class="doc-mock__running">
        <span>WhatsApp chat transcript — Alex, Sam</span>
        <span>SHA-256 4f2a91c0e7d3b58a…</span>
      </div>
      <p class="doc-mock__heading">4. Transcript</p>
      <div class="doc-mock__row doc-mock__row--head">
        <span>No.</span>
        <span>Date &amp; time</span>
        <span>Sender</span>
        <span>Message</span>
      </div>
      <div v-for="row in rows" :key="row[0]" class="doc-mock__row">
        <span>{{ row[0] }}</span>
        <span>{{ row[1] }}</span>
        <span class="doc-mock__sender">{{ row[2] }}</span>
        <span>{{ row[3] }}</span>
      </div>
      <div class="doc-mock__footer">
        <span>Generated client-side with whatsanalyze.com</span>
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
      record: [
        ["Source file", "WhatsApp Chat with Sam.zip"],
        ["SHA-256", "4f2a91c0 e7d3b58a 0c6e1f92 d84b7a35"],
        ["Transcript period", "2019-08-26 to 2021-02-16"],
        ["Messages", "537 (including 4 system notices)"],
      ],
      rows: [
        ["0412", "2021-01-14 09:14:02", "Alex", "Did you get my messages?"],
        ["0413", "2021-01-14 09:16:47", "Sam", "Yes, all of them."],
        [
          "0414",
          "2021-01-14 09:17:05",
          "[SYSTEM]",
          "Alex changed their phone number.",
        ],
        [
          "0415",
          "2021-01-14 12:02:31",
          "Sam",
          "<attached: 00000415-PHOTO.jpg> [Exhibit A-07]",
        ],
        [
          "0416",
          "2021-01-14 12:05:12",
          "Alex",
          "Every message, to the second.",
        ],
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
  padding-top: 3.5rem;
  font-family: Helvetica, Arial, sans-serif;
}

.doc-mock__sheet {
  position: relative;
  background: #ffffff;
  color: #1d1d1f;
  border-radius: 6px;
  padding: clamp(1.1rem, 3vw, 1.6rem);
  text-align: left;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
  transform: rotate(-1.5deg);

  &--back {
    position: absolute;
    top: 0;
    left: 8%;
    right: -4%;
    transform: rotate(2.5deg);
    background: #f4f4f4;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
  }
}

.doc-mock__running {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(29, 29, 31, 0.25);
  font-size: 0.6rem;
  color: rgba(29, 29, 31, 0.55);
}

.doc-mock__title {
  margin: 0.9rem 0 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.doc-mock__heading {
  margin: 0.8rem 0 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.doc-mock__record {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.15rem 1rem;
  margin: 0;
  font-size: 0.66rem;

  dt {
    color: rgba(29, 29, 31, 0.55);
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
}

.doc-mock__row {
  display: grid;
  grid-template-columns: 2.2rem 7.6rem 3.6rem 1fr;
  gap: 0.5rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid rgba(29, 29, 31, 0.08);
  font-size: 0.68rem;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;

  &--head {
    font-weight: 700;
    border-bottom-color: rgba(29, 29, 31, 0.4);
  }

  > span:nth-child(-n + 2) {
    color: rgba(29, 29, 31, 0.6);
  }
}

.doc-mock__sender {
  font-weight: 700;
}

.doc-mock__footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.9rem;
  font-size: 0.6rem;
  color: rgba(29, 29, 31, 0.5);
}

@media (max-width: 480px) {
  .doc-mock__row {
    grid-template-columns: 2rem 1fr;

    > span:not(:first-child) {
      grid-column: 2;
    }
  }

  .doc-mock__row--head {
    display: none;
  }
}
</style>
