/**
 * Saved chats, kept on the visitor's device (docs/saved-chats.md). The pages
 * reach this through composables/useLibrary.ts, which loads it on first use:
 * IndexedDB and gzip are only needed by visitors who keep a chat.
 */
export {
  DB_NAME,
  STORES,
  chatRange,
  closeLibrary,
  libraryExists,
  openLibrary,
  request,
  transact,
} from "./database";
export {
  bucketByMonth,
  monthKey,
  packMonth,
  revive,
  toStored,
  unpackMonths,
} from "./months";
export {
  backupFileName,
  chatTitle,
  hashText,
  isBackupName,
  streamKey,
  summarize,
} from "./identity";
export {
  DAY,
  expireChats,
  forgetAll,
  forgetChat,
  forgetChats,
  listChats,
  matchSavedChat,
  newId,
  openChat,
  readChat,
  readStored,
  saveChat,
  updateChat,
  writeMessages,
} from "./chats";
export {
  addArtifact,
  keepArtifact,
  listArtifacts,
  putArtifacts,
} from "./artifacts";
export { DEFAULT_SETTINGS, readSettings, writeSettings } from "./settings";
export {
  BACKUP_FORMAT,
  exportLibrary,
  importLibrary,
  parseBackup,
} from "./backup";
export {
  didLocalAiFail,
  forgetLocalAiFailure,
  localAiFailure,
  rememberLocalAiFailure,
} from "./device";
