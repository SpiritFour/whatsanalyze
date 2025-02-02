// stores/userDataStore.js
import { defineStore } from "pinia";
import type { ParserResult } from "~/utils/parsing";
import { parser } from "~/utils/parsing";
import {
  retrieveResult,
  type ShareInfo,
  storeResult,
} from "~/utils/sharing/firestore";

type UserData = {
  userData: ParserResult | null;
};

export const useUserDataStore = defineStore("userData", {
  state: (): UserData => ({
    userData: null,
  }),
  actions: {
    async saveData(result: ParserResult): Promise<ShareInfo> {
      console.log("recieved data", result);
      const data = parser.serialize(result);
      console.log("serialized data", data);

      const st = await storeResult(data);
      console.log("recieved data", st);
      return st;
    },
    async loadData(shareInfo: ShareInfo): Promise<ParserResult> {
      return parser.deserialize(await retrieveResult(shareInfo));
    },
  },
});
