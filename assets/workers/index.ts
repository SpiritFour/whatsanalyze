import PromiseWorker from "promise-worker";
import ParsingWorker from "./parsing.worker?worker";
import type { ParserResult } from "~/utils/wrapped/parsing";
import type { Message } from "~/utils/wrapped/parsing/types";

const parsingWorker = import.meta.client
  ? new PromiseWorker(new ParsingWorker())
  : undefined;

export const sendFile = (file: File) =>
  parsingWorker?.postMessage<ParserResult, File>(file);

/** A saved chat's messages, analyzed off the main thread like an upload. */
export const sendMessages = (messages: Message[]) =>
  parsingWorker?.postMessage<ParserResult, { messages: Message[] }>({
    messages,
  });
