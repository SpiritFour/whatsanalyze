import { callableErrorCode } from "./cloudErrors";

describe("callableErrorCode", () => {
  // As GA4 recorded them: Firebase's SDK adds the HTTP status.
  it.each([
    ["preview_used [429]", "preview_used"],
    ["preview_cap [429]", "preview_cap"],
    ["daily_limit [429]", "daily_limit"],
    ["not_subscribed [403]", "not_subscribed"],
    ["analysis_failed [500]", "analysis_failed"],
    ["internal [0]", "internal"],
  ])("reads %j as %j", (message, code) => {
    expect(callableErrorCode(message)).toBe(code);
  });

  it("leaves a message without a status alone", () => {
    expect(callableErrorCode("local_invalid")).toBe("local_invalid");
    expect(callableErrorCode("Malformed [x] request")).toBe(
      "Malformed [x] request",
    );
  });

  it("copes with no message at all", () => {
    expect(callableErrorCode(undefined)).toBe("");
  });
});
