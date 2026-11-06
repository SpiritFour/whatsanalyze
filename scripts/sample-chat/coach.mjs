/**
 * What the coach offers to try on the sample chat, in each language: two
 * questions about it and two drafts to make calmer, all from Emma's side.
 * The answers are made once by readings.mjs; the coach shows these instead
 * of a text box, since anything typed would need the AI again.
 */
export const SAMPLE_COACH = [
  {
    id: "plans",
    kind: "ask",
    me: null,
    prompt: {
      en: "Why do our plans keep falling through?",
      de: "Warum platzen unsere Pläne immer wieder?",
      es: "¿Por qué siempre se nos caen los planes?",
      pt: "Porque é que os nossos planos estão sempre a falhar?",
      fr: "Pourquoi nos projets tombent-ils toujours à l'eau ?",
      it: "Perché i nostri piani saltano sempre?",
    },
  },
  {
    id: "distance",
    kind: "ask",
    me: "Emma",
    prompt: {
      en: "Is Leo pulling away, or is he just stressed?",
      de: "Zieht Leo sich zurück, oder ist er nur gestresst?",
      es: "¿Leo se está alejando o solo está estresado?",
      pt: "O Leo está a afastar-se ou está só stressado?",
      fr: "Est-ce que Leo prend ses distances, ou est-il juste stressé ?",
      it: "Leo si sta allontanando o è solo stressato?",
    },
  },
  {
    id: "talk",
    kind: "ask",
    me: "Emma",
    prompt: {
      en: "How can I start tomorrow's talk well?",
      de: "Wie fange ich das Gespräch morgen gut an?",
      es: "¿Cómo puedo empezar bien la conversación de mañana?",
      pt: "Como posso começar bem a conversa de amanhã?",
      fr: "Comment bien commencer la discussion de demain ?",
      it: "Come posso iniziare bene il discorso di domani?",
    },
  },
  {
    id: "breakup",
    kind: "reply",
    me: "Emma",
    prompt: {
      en: "what is that supposed to mean?? if you want to break up just say it",
      de: "was soll das denn heißen?? wenn du Schluss machen willst, sag es einfach",
      es: "¿¿qué se supone que significa eso?? si quieres cortar, dilo y ya",
      pt: "o que é que isso quer dizer?? se queres acabar, diz logo",
      fr: "ça veut dire quoi ça ?? si tu veux rompre, dis-le directement",
      it: "che cosa vorrebbe dire?? se vuoi lasciarmi dillo e basta",
    },
  },
  {
    id: "cancel",
    kind: "reply",
    me: "Emma",
    prompt: {
      en: "you always cancel on me and I'm done being the only one who tries",
      de: "du sagst ständig ab und ich hab keine Lust mehr, die Einzige zu sein, die sich Mühe gibt",
      es: "siempre me cancelas y estoy harta de ser la única que lo intenta",
      pt: "estás sempre a cancelar e estou farta de ser a única que se esforça",
      fr: "tu annules tout le temps et j'en ai marre d'être la seule à faire des efforts",
      it: "disdici sempre e sono stanca di essere l'unica che ci prova",
    },
  },
];
