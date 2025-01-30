import registerPromiseWorker from "promise-worker/register";
import { defaultParser } from "~/utils/parsing";

registerPromiseWorker(async (file: File) => {
  return defaultParser.run(file);
});
