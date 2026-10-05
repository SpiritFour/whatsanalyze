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
 *
 * Once a morning rather than at each signup's midnight: nobody needs the
 * email at 1 am. 08:00 Berlin, since most users are in Europe; whoever's
 * midnight falls later (the Americas' west) gets it the next morning.
 */
export const sendWrappedReminders = onSchedule(
  { schedule: "0 8 * * *", timeZone: "Europe/Berlin" },
  async () => {
    let sent = 0;
    // 200 per batch keeps each commit (a create and a delete per reminder)
    // under Firestore's 500-write limit.
    for (;;) {
      const due = await db
        .collection("wrappedReminders")
        .where("notifyAt", "<=", Timestamp.now())
        .limit(200)
        .get();
      if (due.empty) break;

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
      sent += due.size;
    }

    if (sent) logger.info("✉️ Wrapped reminders queued", { count: sent });
  },
);
