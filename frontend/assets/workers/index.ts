import PromiseWorker from "promise-worker";
import ParsingWorker from "./parsing.worker?worker";
import { importTest } from "~/utils/fileWorker";


const parsingWorker = new PromiseWorker(new ParsingWorker());

export const send = (message: any) => {
  console.log("message here!!",JSON.stringify(message));
  return parsingWorker.postMessage({
    type: "message",
    message: message + importTest
  });
};