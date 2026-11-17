import { defineStore } from "pinia";
import type { ParserResult } from "~/utils/wrapped/parsing";
import { parser } from "~/utils/wrapped/parsing";
import type {
  PreparedShare,
  ShareInfo,
} from "~/utils/wrapped/sharing/firestore";
import {
  prepareResult,
  retrieveResult,
  storeResult,
  uploadPrepared,
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
    /** The story encrypted and its link worked out, on this device only. */
    async prepareShare(result: ParserResult): Promise<PreparedShare> {
      return await prepareResult(parser.serialize(result));
    },
    async uploadShare(prepared: PreparedShare): Promise<void> {
      await uploadPrepared(prepared);
    },
    async loadData(shareInfo: ShareInfo): Promise<ParserResult> {
      return parser.deserialize(await retrieveResult(shareInfo));
    },
  },
});
