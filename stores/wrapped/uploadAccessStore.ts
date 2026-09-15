import { defineStore } from "pinia";

interface UploadAccessState {
  freeUploadUsed: boolean;
}

export const useUploadAccessStore = defineStore("uploadAccess", {
  state: (): UploadAccessState => ({
    freeUploadUsed: false,
  }),
  getters: {
    hasFreeUploadRemaining(state: UploadAccessState): boolean {
      return !state.freeUploadUsed;
    },
  },
  actions: {
    markFreeUploadUsed() {
      this.freeUploadUsed = true;
    },
    resetFreeUploads() {
      this.freeUploadUsed = false;
    },
  },
  persist: {
    storage: import.meta.client ? localStorage : undefined,
  },
});
