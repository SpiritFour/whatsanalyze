import type { Message } from "../types";

export function getFirstMessages(messages: Message[]): Message[] {
  const authors: string[] = [
    ...new Set(
      messages
        .filter((m) => m.author) // remove undefined/null authors
        .map((m) => m.author as string),
    ),
  ];

  const result: Message[] = [];
  for (const author of authors) {
    const firstMessage = messages.find((m) => m.author === author);
    if (!firstMessage) continue;

    result.push(firstMessage);
  }

  return result;
}
