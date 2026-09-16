// The referral URL printed on every share card never changes, so instead of
// shipping a QR encoder we keep the pre-computed matrix here.
// Version 4, error correction M, mask 3 -> 33x33 modules.
export const SHARE_URL =
  "https://whatsanalyze.com?utm_source=user_share&utm_medium=card";

export const QR_MODULES = [
  "111111101111001010111101001111111",
  "100000101111111011101101101000001",
  "101110100010010100101011001011101",
  "101110101110011011010010001011101",
  "101110100110101111010000101011101",
  "100000100011100001011010101000001",
  "111111101010101010101010101111111",
  "000000001110000001100011000000000",
  "101101110011101001100100101001011",
  "110100000111000110110101001101101",
  "001010111000000011100011011111011",
  "101101000010010000011000100101011",
  "001000100111100001000000110111000",
  "111111001000011110010100110101010",
  "000100100010000001111100001101100",
  "011111001011000000011100111101100",
  "011010111111010000111110111011100",
  "000011001101000101001011101011001",
  "101111101011111100100010000110110",
  "110110011111101011111001000010011",
  "111000100001100011101100000101100",
  "111000010111101011001111010001101",
  "000100100001010011100001111100011",
  "011011010010000000111001001110011",
  "100100111000110011111010111111011",
  "000000001110011111110001100011010",
  "111111101100101000111001101010000",
  "100000101001101110000111100011111",
  "101110100101100010111111111110110",
  "101110101001101111001100000101101",
  "101110101111010111000110001101100",
  "100000100000111011100000110110001",
  "111111101101110101111101001011100",
];

// Scanners need a light margin around the matrix, 4 modules is the spec minimum.
const QUIET_ZONE = 4;

/**
 * Draws the referral QR code into `size` x `size` pixels at (x, y), including
 * the quiet zone and a rounded light backdrop so it stays scannable on top of
 * the dark card backgrounds.
 */
export function drawQrCode(ctx, x, y, size, { dark = "#0d1b16" } = {}) {
  const modulesPerSide = QR_MODULES.length + QUIET_ZONE * 2;
  const moduleSize = size / modulesPerSide;
  const offset = QUIET_ZONE * moduleSize;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, size, size, size * 0.08);
  } else {
    ctx.rect(x, y, size, size);
  }
  ctx.fill();

  ctx.fillStyle = dark;
  QR_MODULES.forEach((row, rowIdx) => {
    for (let colIdx = 0; colIdx < row.length; colIdx += 1) {
      if (row[colIdx] !== "1") continue;
      ctx.fillRect(
        x + offset + colIdx * moduleSize,
        y + offset + rowIdx * moduleSize,
        // overdraw by a hair so neighbouring modules do not show seams
        moduleSize + 0.5,
        moduleSize + 0.5
      );
    }
  });
  ctx.restore();
}
