/**
 * The AI page's ready-made questions, by the id their labels go by
 * (`toolsAi.ask_<id>`). Some only make sense once we know who "I" is.
 * The sample chat's readings were made for exactly these
 * (scripts/sample-chat/readings.mjs).
 *
 * `sendable`: a reading about how the two talk, not about one side, which
 * the reader may send to the other person in the chat (utils/ai/sendReading.js).
 * Whether they're into me, what to worry about, a gift, who argues better or
 * who tries harder all take a side, and sent to the other person they can
 * turn a reading into an argument.
 */
export const AI_QUESTIONS = [
  { id: "into", needsMe: true },
  { id: "arguments", needsMe: false },
  { id: "worried", needsMe: true },
  { id: "gift", needsMe: true },
  { id: "effort", needsMe: false },
  { id: "better", needsMe: false, sendable: true },
];
