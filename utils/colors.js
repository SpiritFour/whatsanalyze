/**
 * The series palette.
 *
 * Eight fixed hues, assigned to people in order and never cycled — a ninth
 * participant folds into "Others" instead of repeating a colour, because two
 * people in the same colour is worse than one bucket without a name.
 *
 * Validated on a white chart surface (the cards the charts sit in): every hue
 * is inside the OKLCH lightness band, above the chroma floor, and the worst
 * neighbouring pair keeps ΔE 12.7 under simulated protanopia / deuteranopia
 * and 27.0 under normal vision. Reordering or swapping a hue means running
 * that check again — the order is what makes the palette colour-blind safe,
 * not the individual values.
 *
 * Amber and pink sit below 3:1 against white, so charts always carry a legend
 * or a tooltip label: colour alone never has to carry the identity.
 */
export let chatColors = [
  "#21a68d", // teal — the brand accent, so a 1:1 chat leads with it
  "#eb6834", // orange
  "#2a78d6", // blue
  "#eda100", // amber
  "#008300", // green
  "#e87ba4", // pink
  "#4a3aa7", // indigo
  "#e34948", // red
];

/** Everyone past the last slot, pooled. Neutral on purpose: it is not an identity. */
export const othersColor = "#64748b";

/** Single-series charts (the timeline) have no identity to encode — brand teal. */
export const accentColor = "#21a68d";

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

/**
 * Repaint chart data that was serialised with an older palette.
 *
 * The example graphs on the homepage come from a JSON file with the colours
 * baked in, so without this they would keep showing whatever palette was
 * current the day the file was generated.
 */
export function recolorChartData(data) {
  if (!data || !Array.isArray(data.datasets)) return data;
  return {
    ...data,
    datasets: data.datasets.map((dataset, idx) => {
      // Per-point colours (the doughnut): one entry per slice.
      if (Array.isArray(dataset.backgroundColor)) {
        const colors = dataset.backgroundColor.map(
          (_, i) => chatColors[i % chatColors.length]
        );
        return { ...dataset, backgroundColor: colors, borderColor: colors };
      }
      const color = chatColors[idx % chatColors.length];
      return { ...dataset, backgroundColor: color, borderColor: color };
    }),
  };
}
