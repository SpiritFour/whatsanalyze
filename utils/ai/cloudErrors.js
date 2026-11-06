/**
 * The code a failed cloud call carries ("preview_used", "daily_limit", …),
 * as functions/src/ai/analyzeChatAi.ts threw it. Firebase's SDK appends the
 * HTTP status to the message ("preview_used [429]"), so comparing the raw
 * message never matched: every visitor whose free preview was used up was
 * told the cloud AI was down and to try again in a minute.
 *
 * @param {unknown} message
 * @returns {string}
 */
export const callableErrorCode = (message) =>
  String(message ?? "").replace(/\s*\[\d+\]$/, "");
