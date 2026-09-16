// Every WhatsApp export opens with the end-to-end-encryption notice. Android exports it
// without an author, so whatsapp-chat-parser labels it "System". iOS attributes it to the
// chat partner instead, which made it render as the first person's first message (#406).
// Everything downstream already skips the "System" author, so we relabel these messages
// once, right after parsing, instead of filtering them in every analysis.
export const SYSTEM_AUTHOR = "System";

// The notice is exported in the language of the phone that created it, so match the
// languages the site itself supports.
const systemMessagePatterns = [
  /end-to-end encrypted/i, // en
  /ende-zu-ende-verschlüsselt/i, // de
  /cifrados de extremo a extremo/i, // es
  /chiffrés de bout en bout/i, // fr
  /(?:criptografad|encriptad)[ao]s (?:de )?ponta a ponta/i, // pt-BR / pt-PT
  /crittografati end-to-end/i, // it
];

export function isSystemMessage(message) {
  // iOS prefixes generated messages with a left-to-right mark
  const normalized = String(message ?? "")
    .replace(/\u200e/g, "")
    .trim();
  return systemMessagePatterns.some((pattern) => pattern.test(normalized));
}

export function markSystemMessages(messages) {
  messages.forEach((message) => {
    if (isSystemMessage(message.message)) {
      message.author = SYSTEM_AUTHOR;
    }
  });
  return messages;
}
