export let chatColors = [
  "#1f7aec",
  "#fe7c7f",
  "#6bcbef",
  "#fc644b",
  "#35cd96",
  "#e542a3",
  "#91ab01",
  "#ba33dc",
  "#ffa97a",
  "#029d00",
  "#dfb610",
];

export function hexToRgbA(hex, alpha = 0.1) {
  var c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split("");
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = "0x" + c.join("");
    return (
      "rgba(" +
      [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
      ", " +
      alpha +
      " )"
    );
  }
  throw new Error("Bad Hex");
}
