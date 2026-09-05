import { defineStore } from "pinia";
import type { ParserResult } from "~/utils/wrapped/parsing";
import { parser } from "~/utils/wrapped/parsing";
import {
  retrieveResult,
  type ShareInfo,
  storeResult,
} from "~/utils/wrapped/sharing/firestore";

interface UserData {
  userData: ParserResult | null;
}

export const useUserDataStore = defineStore("userData", {
  state: (): UserData => ({
    userData: null,
  }),
  actions: {
    async saveData(result: ParserResult): Promise<ShareInfo> {
      const data = parser.serialize(result);
      return await storeResult(data);
    },
    async loadData(shareInfo: ShareInfo): Promise<ParserResult> {
      return parser.deserialize(await retrieveResult(shareInfo));
    },
  },
});
