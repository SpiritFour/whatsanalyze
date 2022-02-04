export let chatColors = [
  "#00535f",
  "#51b0bc",
  "#21a68d",
  "#ffd45c",
  "#35cd96",
  "#ed8c2b",
  "#b3f94f",
  "#ba33dc",
  "#ffa35c",
  "#227373",
  "#ff855c",
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

export function updateAlpha(rgba, alpha = 0.1) {
  return rgba.split(",").slice(0, -1).join(",") + "," + alpha + ")";
}
