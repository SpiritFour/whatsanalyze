import { defineStore } from "pinia";

interface UploadAccessState {
  /** Local calendar day (YYYY-MM-DD) of the last free analysis. */
  lastFreeUploadDay: string | null;
}

const localDay = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Start of the next local day, when the free analysis comes back. */
export const nextFreeUploadAt = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
};

// One free analysis per day: whoever hits the limit is asked to come back
// tomorrow (or subscribe) instead of being locked out for good.
export const useUploadAccessStore = defineStore("uploadAccess", {
  state: (): UploadAccessState => ({
    lastFreeUploadDay: null,
  }),
  actions: {
    // A method rather than a getter: a cached getter would not notice a tab
    // left open past midnight.
    hasFreeUploadToday(): boolean {
      return this.lastFreeUploadDay !== localDay();
    },
    markFreeUploadUsed() {
      this.lastFreeUploadDay = localDay();
    },
  },
  persist: {
    storage: import.meta.client ? localStorage : undefined,
  },
});
