import { defineStore } from "pinia";
import type { ParserResult } from "~/utils/parsing";

type StatsStoreDate = {
  result: ParserResult | null;
  isLoading: boolean;
};

export const useStatsStore = defineStore("stats", {
  state: (): StatsStoreDate => ({ result: null, isLoading: false }),
  getters: {
    getResult(state: StatsStoreDate) {
      return state.result;
    },
  },
  persist: {
    storage: sessionStorage,
  },
});
