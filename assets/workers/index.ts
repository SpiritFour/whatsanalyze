import PromiseWorker from "promise-worker";
import ParsingWorker from "./parsing.worker?worker";
import type { ParserResult } from "~/utils/wrapped/parsing";

const parsingWorker = import.meta.client
  ? new PromiseWorker(new ParsingWorker())
  : undefined;

export const sendFile = (file: File) =>
  parsingWorker?.postMessage<ParserResult, File>(file);
