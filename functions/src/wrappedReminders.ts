import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "./firebase";
import { emailBaseUrl } from "./mail";

const COPY: Record<string, { subject: string; body: string; cta: string }> = {
  en: {
    subject: "Your free WhatsApp Wrapped analysis is back",
    body: "A new day, a new free analysis. Which chat is next?",
    cta: "Analyze a chat",
  },
  de: {
    subject: "Deine kostenlose WhatsApp-Wrapped-Analyse ist wieder da",
    body: "Neuer Tag, neue Gratis-Analyse. Welcher Chat ist als Nächstes dran?",
    cta: "Chat analysieren",
  },
  fr: {
    subject: "Ton analyse WhatsApp Wrapped gratuite est de retour",
    body: "Nouveau jour, nouvelle analyse gratuite. Quelle discussion ensuite ?",
    cta: "Analyser une discussion",
  },
  it: {
    subject: "La tua analisi gratuita di WhatsApp Wrapped è tornata",
    body: "Nuovo giorno, nuova analisi gratuita. Quale chat analizzi adesso?",
    cta: "Analizza una chat",
  },
  es: {
    subject: "Tu análisis gratuito de WhatsApp Wrapped ha vuelto",
    body: "Nuevo día, nuevo análisis gratuito. ¿Qué chat toca ahora?",
    cta: "Analizar un chat",
  },
  pt: {
    subject: "Sua análise gratuita do WhatsApp Wrapped voltou",
    body: "Novo dia, nova análise gratuita. Qual conversa vem agora?",
    cta: "Analisar uma conversa",
  },
};

const wrappedUrl = (locale: string): string => {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${emailBaseUrl.value()}${prefix}/wrapped/?utm_source=reminder&utm_medium=email`;
};

/**
 * Mails everyone whose free daily analysis is back, then deletes their
 * signup: the address is only kept until this one email goes out.
 */
export const sendWrappedReminders = onSchedule("every 60 minutes", async () => {
  const due = await db
    .collection("wrappedReminders")
    .where("notifyAt", "<=", Timestamp.now())
    .limit(200)
    .get();
  if (due.empty) return;

  const batch = db.batch();
  for (const reminder of due.docs) {
    const { email, locale } = reminder.data();
    const copy = COPY[locale] ?? COPY.en;
    const url = wrappedUrl(COPY[locale] ? locale : "en");
    batch.create(db.collection("mail").doc(), {
      to: email,
      message: {
        subject: copy.subject,
        text: `${copy.body}\n\n${url}`,
        html: `<p>${copy.body}</p><p><a href="${url}">${copy.cta}</a></p>`,
      },
    });
    batch.delete(reminder.ref);
  }
  await batch.commit();

  logger.info("✉️ Wrapped reminders queued", { count: due.size });
});
