import admin from "firebase-admin";

// todo we might not need this at all as the http calls might only come from paypal/stripe
export async function verifyAppCheckHttp(
  req: any,
  res: any
): Promise<{ valid: boolean }> {
  if (process.env.FUNCTIONS_EMULATOR === "true") {
    return { valid: true };
  }

  const token = req.get("X-Firebase-AppCheck");

  if (!token) {
    res.status(401).json({ error: "App Check token is missing" });
    return { valid: false };
  }

  try {
    const appCheckClaims = await admin.appCheck().verifyToken(token);
    return { valid: appCheckClaims.token.valid };
  } catch (err) {
    res.status(401).json({ error: "App Check token is invalid" });
    return { valid: false };
  }
}
