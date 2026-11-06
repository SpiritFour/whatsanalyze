/**
 * The AI page's ready-made questions, by the id their labels go by
 * (`toolsAi.ask_<id>`). Some only make sense once we know who "I" is.
 * The sample chat's readings were made for exactly these
 * (scripts/sample-chat/readings.mjs).
 */
export const AI_QUESTIONS = [
  { id: "into", needsMe: true },
  { id: "arguments", needsMe: false },
  { id: "worried", needsMe: true },
  { id: "gift", needsMe: true },
  { id: "effort", needsMe: false },
  { id: "better", needsMe: false },
];
