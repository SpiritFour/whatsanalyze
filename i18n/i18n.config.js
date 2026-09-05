import { messages } from "../utils/translations.js";
import {
  de as vuetifyDe,
  en as vuetifyEn,
  es as vuetifyEs,
  fr as vuetifyFr,
  it as vuetifyIt,
  pt as vuetifyPt,
} from "vuetify/locale";

const vuetifyMessages = {
  de: vuetifyDe,
  en: vuetifyEn,
  es: vuetifyEs,
  fr: vuetifyFr,
  it: vuetifyIt,
  pt: vuetifyPt,
};

export default defineI18nConfig(() => ({
  legacy: true,
  fallbackLocale: "en",
  warnHtmlMessage: false,
  messages: Object.fromEntries(
    Object.entries(messages).map(([locale, localeMessages]) => [
      locale,
      {
        $vuetify: vuetifyMessages[locale],
        ...localeMessages,
      },
    ])
  ),
}));
