/**
 * The paper a visitor most likely prints on: US Letter in the United States
 * and Canada (and the few other places that use it), A4 everywhere else.
 * Only a default; both tools let it be changed.
 */
const LETTER_REGIONS = new Set(["US", "CA", "MX", "PH", "CL", "CO", "VE"]);

export function defaultPaper(): "a4" | "letter" {
  if (typeof navigator === "undefined") return "a4";
  for (const tag of navigator.languages ?? [navigator.language]) {
    const region = tag?.split("-")[1]?.toUpperCase();
    if (region) return LETTER_REGIONS.has(region) ? "letter" : "a4";
  }
  return "a4";
}
