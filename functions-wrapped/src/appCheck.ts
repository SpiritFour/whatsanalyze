import { HttpsError } from "firebase-functions/v2/https";

export function verifyAppCheckCallable(context: any): void {
  if (process.env.FUNCTIONS_EMULATOR === "true") {
    return;
  }

  if (!context.app?.token?.valid) {
    throw new HttpsError(
      "unauthenticated",
      "App Check token is missing or invalid"
    );
  }
}
