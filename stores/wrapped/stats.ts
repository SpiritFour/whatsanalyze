import { defineStore } from "pinia";
import type { ParserResult } from "~/utils/wrapped/parsing";

interface StatsStoreData {
  result: ParserResult | undefined;
  isLoading: boolean;
  /** The story of the made-up sample chat, not of the visitor's own. */
  isSample: boolean;
}

export const useStatsStore = defineStore("stats", {
  state: (): StatsStoreData => ({
    result: undefined,
    isLoading: false,
    isSample: false,
  }),
  getters: {
    getResult(state: StatsStoreData) {
      return state.result;
    },
    getAuthors(state: StatsStoreData) {
      return Object.keys(state.result?.getMostUsedEmojis.authors ?? {});
    },
  },
  persist: {
    storage: piniaPluginPersistedstate.sessionStorage(),
  },
});
