<template>
  <div class="doc-mock" aria-hidden="true">
    <div class="doc-mock__sheet doc-mock__sheet--back"></div>
    <div class="doc-mock__sheet">
      <div class="doc-mock__header">
        <span class="doc-mock__kicker">{{ content.kicker }}</span>
        <span class="doc-mock__meta">{{ content.metaParticipants }}</span>
        <span class="doc-mock__meta">{{ content.metaDateRange }}</span>
      </div>
      <div class="doc-mock__divider">{{ content.dividerDate }}</div>
      <div
        v-for="row in content.rows"
        :key="row.time + row.text"
        class="doc-mock__row"
      >
        <span class="doc-mock__time">{{ row.time }}</span>
        <span class="doc-mock__body">
          <span class="doc-mock__name">{{ row.name }}</span>
          {{ row.text }}
        </span>
      </div>
      <div class="doc-mock__footer">
        <span>whatsanalyze.com</span>
        <span>{{ content.pageText }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LandingDocMock",
  computed: {
    content() {
      const locale = this.$i18n?.locale || "en";
      const translations = {
        de: {
          kicker: "Chat-Protokoll",
          metaParticipants: "WhatsApp-Export · 2 Teilnehmer",
          metaDateRange: "26. Aug. 2019 – 16. Feb. 2021 · 537 Nachrichten",
          dividerDate: "14. Jan. 2021",
          pageText: "Seite 3 von 24",
          rows: [
            {
              time: "09:14",
              name: "Alex",
              text: "Hast du meine Nachrichten von gestern bekommen?",
            },
            {
              time: "09:16",
              name: "Sam",
              text: "Ja, alle. Ich habe alles aufgehoben.",
            },
            {
              time: "09:17",
              name: "Alex",
              text: "Gut. Die brauchen wir vielleicht noch.",
            },
            {
              time: "12:02",
              name: "Sam",
              text: "Ich habe heute früh den ganzen Chat exportiert.",
            },
            {
              time: "12:05",
              name: "Alex",
              text: "Jede Nachricht, mit Datum und Uhrzeit.",
            },
            {
              time: "12:06",
              name: "Sam",
              text: "Genau. Schwarz auf weiß.",
            },
          ],
        },
        es: {
          kicker: "Transcripción del chat",
          metaParticipants: "Exportación de WhatsApp · 2 participantes",
          metaDateRange: "26 ago 2019 – 16 feb 2021 · 537 mensajes",
          dividerDate: "14 ene 2021",
          pageText: "Página 3 de 24",
          rows: [
            {
              time: "09:14",
              name: "Alex",
              text: "¿Recibiste mis mensajes de ayer?",
            },
            {
              time: "09:16",
              name: "Sam",
              text: "Sí, todos. Lo guardé todo.",
            },
            {
              time: "09:17",
              name: "Alex",
              text: "Bien. Quizás los necesitemos más tarde.",
            },
            {
              time: "12:02",
              name: "Sam",
              text: "Exporté todo el chat esta mañana.",
            },
            {
              time: "12:05",
              name: "Alex",
              text: "Cada mensaje, con fecha y hora.",
            },
            {
              time: "12:06",
              name: "Sam",
              text: "Exacto. En blanco y negro.",
            },
          ],
        },
        fr: {
          kicker: "Transcription du chat",
          metaParticipants: "Export WhatsApp · 2 participants",
          metaDateRange: "26 août 2019 – 16 févr. 2021 · 537 messages",
          dividerDate: "14 janv. 2021",
          pageText: "Page 3 sur 24",
          rows: [
            {
              time: "09:14",
              name: "Alex",
              text: "Tu as reçu mes messages d'hier ?",
            },
            {
              time: "09:16",
              name: "Sam",
              text: "Oui, tous. J'ai tout gardé.",
            },
            {
              time: "09:17",
              name: "Alex",
              text: "Bien. On en aura peut-être besoin plus tard.",
            },
            {
              time: "12:02",
              name: "Sam",
              text: "J'ai exporté tout le chat ce matin.",
            },
            {
              time: "12:05",
              name: "Alex",
              text: "Chaque message, avec date et heure.",
            },
            {
              time: "12:06",
              name: "Sam",
              text: "Exactement. Noir sur blanc.",
            },
          ],
        },
        pt: {
          kicker: "Transcrição da conversa",
          metaParticipants: "Exportação do WhatsApp · 2 participantes",
          metaDateRange:
            "26 de ago. de 2019 – 16 de fev. de 2021 · 537 mensagens",
          dividerDate: "14 de jan. de 2021",
          pageText: "Página 3 de 24",
          rows: [
            {
              time: "09:14",
              name: "Alex",
              text: "Você recebeu minhas mensagens de ontem?",
            },
            {
              time: "09:16",
              name: "Sam",
              text: "Sim, todas. Guardei tudo.",
            },
            {
              time: "09:17",
              name: "Alex",
              text: "Ótimo. Podemos precisar delas mais tarde.",
            },
            {
              time: "12:02",
              name: "Sam",
              text: "Exporteirei toda a conversa hoje cedo.",
            },
            {
              time: "12:05",
              name: "Alex",
              text: "Cada mensagem, com data e hora.",
            },
            {
              time: "12:06",
              name: "Sam",
              text: "Exato. Preto no branco.",
            },
          ],
        },
        it: {
          kicker: "Trascrizione della chat",
          metaParticipants: "Esportazione WhatsApp · 2 partecipanti",
          metaDateRange: "26 ago 2019 – 16 feb 2021 · 537 messaggi",
          dividerDate: "14 gen 2021",
          pageText: "Pagina 3 di 24",
          rows: [
            {
              time: "09:14",
              name: "Alex",
              text: "Hai ricevuto i miei messaggi di ieri?",
            },
            {
              time: "09:16",
              name: "Sam",
              text: "Sì, tutti. Ho tenuto tutto.",
            },
            {
              time: "09:17",
              name: "Alex",
              text: "Bene. Potrebbero servirci più tardi.",
            },
            {
              time: "12:02",
              name: "Sam",
              text: "Ho esportato tutta la chat stamattina.",
            },
            {
              time: "12:05",
              name: "Alex",
              text: "Ogni messaggio, con data e ora.",
            },
            {
              time: "12:06",
              name: "Sam",
              text: "Esatto. Nero su bianco.",
            },
          ],
        },
        en: {
          kicker: "Chat Transcript",
          metaParticipants: "WhatsApp export · 2 participants",
          metaDateRange: "Aug 26, 2019 – Feb 16, 2021 · 537 messages",
          dividerDate: "Jan 14, 2021",
          pageText: "Page 3 of 24",
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
            {
              time: "12:06",
              name: "Sam",
              text: "Exactly. In black and white.",
            },
          ],
        },
      };
      return translations[locale] || translations.en;
    },
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
