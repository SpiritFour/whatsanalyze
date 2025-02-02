import registerPromiseWorker from "promise-worker/register";
import { parser } from "~/utils/parsing";

registerPromiseWorker(async (file: File) => {
  return parser.run(file);
});
