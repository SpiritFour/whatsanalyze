import { cleanPath, contentGroupFor } from "./cleanPath";

describe("cleanPath and contentGroupFor", () => {
  it("normalizes root and localized root paths to /", () => {
    expect(cleanPath("/")).toBe("/");
    expect(cleanPath("/de/")).toBe("/");
    expect(cleanPath("/es/")).toBe("/");
    expect(cleanPath("/fr/")).toBe("/");
    expect(cleanPath("/pt/")).toBe("/");
    expect(cleanPath("/it/")).toBe("/");
    expect(cleanPath("/es")).toBe("/");
    expect(cleanPath("")).toBe("/");
    expect(cleanPath(undefined)).toBe("/");
  });

  it("strips locale prefixes while preserving the subpath with trailing slash", () => {
    expect(cleanPath("/tools/word-counter")).toBe("/tools/word-counter/");
    expect(cleanPath("/de/tools/word-counter/")).toBe("/tools/word-counter/");
    expect(cleanPath("/es/tools/ai-chat-analyzer")).toBe(
      "/tools/ai-chat-analyzer/",
    );
    expect(cleanPath("/wrapped/results/")).toBe("/wrapped/results/");
    expect(cleanPath("/it/wrapped/")).toBe("/wrapped/");
    expect(cleanPath("/subscribe")).toBe("/subscribe/");
    expect(cleanPath("/es/subscribe/")).toBe("/subscribe/");
  });

  it("strips query strings and hashes", () => {
    expect(cleanPath("/tools/word-counter/?foo=bar#section")).toBe(
      "/tools/word-counter/",
    );
    expect(cleanPath("/de/wrapped/results?utm_source=share")).toBe(
      "/wrapped/results/",
    );
  });

  it("contentGroupFor delegates to cleanPath", () => {
    expect(contentGroupFor("/de/tools/word-counter/")).toBe(
      "/tools/word-counter/",
    );
    expect(contentGroupFor("/es/")).toBe("/");
  });
});
