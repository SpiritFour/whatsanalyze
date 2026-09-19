import { defineStore } from "pinia";
import type { ParserResult } from "~/utils/wrapped/parsing";

interface StatsStoreData {
  result: ParserResult | undefined;
  isLoading: boolean;
}

export const useStatsStore = defineStore("stats", {
  state: (): StatsStoreData => ({ result: undefined, isLoading: false }),
  getters: {
    getResult(state: StatsStoreData) {
      return state.result;
    },
    getAuthors(state: StatsStoreData) {
      return Object.keys(state.result?.getMostUsedEmojis.authors ?? {});
    },
  },
  persist: {
    storage: import.meta.client ? sessionStorage : undefined,
  },
});
