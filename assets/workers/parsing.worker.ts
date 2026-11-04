import registerPromiseWorker from "promise-worker/register";
import { parser } from "~/utils/wrapped/parsing";
import type { Message } from "~/utils/wrapped/parsing/types";
import { SYSTEM_AUTHOR } from "~/utils/systemMessages";

registerPromiseWorker(async (input: File | { messages: Message[] }) => {
  if (input instanceof File) return parser.run(input);
  // A saved chat, parsed by the site's own parser: WhatsApp's notices carry
  // its "System" author there, where this parser expects none.
  return parser.analyze(
    input.messages.map((message) =>
      message.author === SYSTEM_AUTHOR ? { ...message, author: null } : message,
    ),
  );
});
