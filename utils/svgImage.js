/**
 * Pictures of the SVG charts, for the things that cannot draw SVG.
 *
 * The word and emoji clouds are amCharts SVG. html2canvas leaves them blank
 * in the downloaded summary and never even settles when asked for one on its
 * own, so both the share button and the summary capture rasterise them here
 * first.
 */

/** Marks a chart drawn as SVG, so a capture can find it without guessing. */
export const SVG_CHART_CLASS = "js-svg-chart";

/**
 * amCharts puts more than one <svg> in its container — the first is a hidden
 * one it measures text with, which rasterises to an empty picture. The chart
 * is the widest.
 */
export function largestSvg(element) {
  return Array.from(element?.querySelectorAll?.("svg") || []).sort(
    (a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width
  )[0];
}

export function svgToDataUrl(svg) {
  const rect = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (rect.width) clone.setAttribute("width", rect.width);
  if (rect.height) clone.setAttribute("height", rect.height);

  const source = new XMLSerializer().serializeToString(clone);
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
}

/** The SVG, drawn onto a white canvas at `scale` times its screen size. */
export async function svgToCanvas(svg, scale = 2) {
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("Could not rasterise the SVG"));
    image.src = svgToDataUrl(svg);
  });

  const canvas = document.createElement("canvas");
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Snapshot every SVG chart under `root` as a PNG, ready to be dropped into an
 * html2canvas clone. PNG rather than the SVG data URL: html2canvas decodes it
 * reliably, an inline SVG it does not.
 */
export async function snapshotSvgCharts(root) {
  const charts = Array.from(
    root?.querySelectorAll(`.${SVG_CHART_CLASS}`) || []
  );

  return Promise.all(
    charts.map(async (chart) => {
      const svg = largestSvg(chart);
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      try {
        const canvas = await svgToCanvas(svg);
        if (!canvas) return null;
        return {
          src: canvas.toDataURL("image/png"),
          width: rect.width,
          height: rect.height,
        };
      } catch (error) {
        console.error("Could not snapshot an SVG chart", error);
        return null;
      }
    })
  );
}

/**
 * Put those snapshots into the clone html2canvas is about to draw. The charts
 * are matched by position among the marked elements, which survives the
 * elements html2canvas drops from its clone.
 */
export function applySvgChartSnapshots(clonedRoot, snapshots) {
  const charts = Array.from(
    clonedRoot?.querySelectorAll(`.${SVG_CHART_CLASS}`) || []
  );

  charts.forEach((chart, index) => {
    const snapshot = snapshots[index];
    const svg = largestSvg(chart);
    if (!snapshot || !svg) return;

    const image = chart.ownerDocument.createElement("img");
    image.src = snapshot.src;
    image.style.width = `${snapshot.width}px`;
    image.style.height = `${snapshot.height}px`;
    svg.replaceWith(image);
  });
}
