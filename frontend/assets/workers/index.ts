import PromiseWorker from "promise-worker";
import ParsingWorker from "./parsing.worker?worker";
import { type defaultParserResult } from "~/utils/parsing";

const parsingWorker = new PromiseWorker(new ParsingWorker());

export const sendFile = (file: File) =>
  parsingWorker.postMessage<defaultParserResult, File>(file);
