/* eslint-env jest */
import { SHARE_URL } from "./qrCode";
import { buildShareUrl } from "./share";

describe("buildShareUrl", () => {
  it("matches the URL baked into the printed QR code", () => {
    // The QR matrix is pre-computed, so it can only stay correct while the
    // link the rest of the app hands out is byte for byte the same.
    expect(buildShareUrl("card")).toBe(SHARE_URL);
  });

  it("tags every surface with its own medium", () => {
    expect(buildShareUrl("whatsapp")).toBe(
      "https://whatsanalyze.com?utm_source=user_share&utm_medium=whatsapp"
    );
  });
});
