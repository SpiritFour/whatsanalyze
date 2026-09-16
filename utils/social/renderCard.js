import { drawQrCode } from "~/utils/social/qrCode";

export const FORMAT_STORY = "story";
export const FORMAT_SQUARE = "square";

export const CARD_FORMATS = {
  // 9:16 for Instagram Stories, WhatsApp Status, TikTok and Snapchat.
  [FORMAT_STORY]: { width: 1080, height: 1920 },
  // 1:1 for Instagram feed, X and group chat attachments.
  [FORMAT_SQUARE]: { width: 1080, height: 1080 },
};

const BRAND_GREEN = "#07bc4c";
const TEXT_PRIMARY = "#ffffff";
const TEXT_MUTED = "rgba(226, 232, 240, 0.72)";

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const EMOJI_FONT =
  "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

const font = (size, weight = "normal") => `${weight} ${size}px ${SANS}`;

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
}

function withAlpha(hex, alpha) {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const value = parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Shrinks the font until the text fits, so long names never overflow a card. */
function fittedFont(ctx, text, maxWidth, size, weight) {
  let currentSize = size;
  ctx.font = font(currentSize, weight);
  while (ctx.measureText(text).width > maxWidth && currentSize > 16) {
    currentSize -= 2;
    ctx.font = font(currentSize, weight);
  }
  return currentSize;
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawBackground(ctx, width, height, accent) {
  const backdrop = ctx.createLinearGradient(0, 0, width, height);
  backdrop.addColorStop(0, "#0b1220");
  backdrop.addColorStop(0.55, "#0f2027");
  backdrop.addColorStop(1, "#05100c");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  // Soft accent orbs, echoing the look of the Wrapped stories.
  const orbs = [
    { x: width * 0.12, y: height * 0.08, r: width * 0.55, color: accent },
    { x: width * 0.95, y: height * 0.42, r: width * 0.5, color: BRAND_GREEN },
    { x: width * 0.2, y: height * 0.95, r: width * 0.6, color: accent },
  ];
  orbs.forEach((orb) => {
    const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
    glow.addColorStop(0, withAlpha(orb.color, 0.28));
    glow.addColorStop(1, withAlpha(orb.color, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  });
}

function drawHeader(ctx, card, layout) {
  const { padding, width } = layout;
  const maxWidth = width - padding * 2;
  let y = layout.headerTop;

  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  ctx.fillStyle = card.accent || BRAND_GREEN;
  ctx.font = font(layout.kickerSize, "bold");
  const kicker = String(card.kicker || "").toUpperCase();
  ctx.save();
  // Letterspacing is not supported everywhere, so draw the kicker glyph by glyph.
  let kickerX = padding;
  kicker.split("").forEach((char) => {
    ctx.fillText(char, kickerX, y);
    kickerX += ctx.measureText(char).width + layout.kickerSize * 0.14;
  });
  ctx.restore();
  y += layout.kickerSize * 1.9;

  ctx.fillStyle = TEXT_PRIMARY;
  const titleSize = fittedFont(
    ctx,
    card.title,
    maxWidth,
    layout.titleSize,
    "bold"
  );
  ctx.font = font(titleSize, "bold");
  wrapLines(ctx, card.title, maxWidth).forEach((line) => {
    ctx.fillText(line, padding, y);
    y += titleSize * 1.15;
  });

  if (card.subtitle) {
    y += layout.subtitleSize * 0.35;
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = font(layout.subtitleSize);
    ctx.fillText(card.subtitle, padding, y);
    y += layout.subtitleSize * 1.4;
  }

  return y;
}

function drawFooter(ctx, layout) {
  const { padding, width, height } = layout;
  const qrSize = layout.qrSize;
  const qrY = height - padding - qrSize;

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fillRect(padding, qrY - layout.footerGap, width - padding * 2, 2);

  drawQrCode(ctx, width - padding - qrSize, qrY, qrSize);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = BRAND_GREEN;
  ctx.font = font(layout.brandSize, "bold");
  ctx.fillText("WhatsAnalyze.com", padding, qrY + qrSize * 0.08);

  ctx.fillStyle = TEXT_MUTED;
  ctx.font = font(layout.footnoteSize);
  const tagline = layout.tagline;
  wrapLines(
    ctx,
    tagline,
    width - padding * 2 - qrSize - layout.footerGap
  ).forEach((line, index) => {
    ctx.fillText(
      line,
      padding,
      qrY +
        qrSize * 0.08 +
        layout.brandSize * 1.5 +
        index * layout.footnoteSize * 1.3
    );
  });
}

/**
 * Row heights are capped so tiles never become absurdly tall, which leaves a
 * short body sitting against the header. This drops it into the middle of the
 * space it was given instead.
 */
function centered(box, naturalHeight) {
  const offset = Math.max((box.height - naturalHeight) / 2, 0);
  return { ...box, y: box.y + offset, height: naturalHeight };
}

function drawStats(ctx, card, box, layout) {
  const stats = card.stats;
  const columns = layout.format === FORMAT_SQUARE && stats.length > 2 ? 2 : 1;
  const rows = Math.ceil(stats.length / columns);
  const gap = layout.tileGap;
  const tileWidth = (box.width - gap * (columns - 1)) / columns;
  const tileHeight = Math.min(
    (box.height - gap * (rows - 1)) / rows,
    layout.maxTileHeight
  );
  const area = centered(box, rows * tileHeight + gap * (rows - 1));

  stats.forEach((stat, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = area.x + column * (tileWidth + gap);
    const y = area.y + row * (tileHeight + gap);

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    roundRect(ctx, x, y, tileWidth, tileHeight, 32);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const centerX = x + tileWidth / 2;

    ctx.fillStyle = TEXT_PRIMARY;
    const valueSize = fittedFont(
      ctx,
      stat.value,
      tileWidth - 60,
      Math.min(tileHeight * 0.42, layout.statValueSize),
      "bold"
    );
    ctx.font = font(valueSize, "bold");
    ctx.fillText(stat.value, centerX, y + tileHeight * 0.42);

    ctx.fillStyle = TEXT_MUTED;
    ctx.font = font(layout.statLabelSize);
    ctx.fillText(stat.label, centerX, y + tileHeight * 0.75);
  });
}

function drawDuel(ctx, card, box, layout) {
  const [left, right] = card.contenders;
  const nameSize = layout.statLabelSize * 1.25;
  const headerHeight = nameSize * 2.2;
  const rowHeight = Math.min(
    (box.height - headerHeight) / card.rows.length,
    layout.maxDuelRow
  );
  const area = centered(box, headerHeight + rowHeight * card.rows.length);

  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = left.color;
  const leftSize = fittedFont(
    ctx,
    left.name,
    area.width * 0.42,
    nameSize,
    "bold"
  );
  ctx.font = font(leftSize, "bold");
  ctx.fillText(left.name, area.x, area.y);

  ctx.textAlign = "right";
  ctx.fillStyle = right.color;
  const rightSize = fittedFont(
    ctx,
    right.name,
    area.width * 0.42,
    nameSize,
    "bold"
  );
  ctx.font = font(rightSize, "bold");
  ctx.fillText(right.name, area.x + area.width, area.y);

  const rowsTop = area.y + headerHeight;

  card.rows.forEach((row, index) => {
    const y = rowsTop + index * rowHeight;
    const barHeight = Math.min(rowHeight * 0.3, 34);
    const barY = y + rowHeight * 0.42;

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = font(layout.statLabelSize);
    ctx.fillText(row.label, area.x + area.width / 2, y);

    const leftWidth = (area.width * row.percents[0]) / 100;
    ctx.save();
    roundRect(ctx, area.x, barY, area.width, barHeight, barHeight / 2);
    ctx.clip();
    ctx.fillStyle = right.color;
    ctx.fillRect(area.x, barY, area.width, barHeight);
    ctx.fillStyle = left.color;
    ctx.fillRect(area.x, barY, leftWidth, barHeight);
    ctx.restore();

    const captionY = barY + barHeight + layout.statLabelSize * 0.4;
    ctx.font = font(layout.statLabelSize, "bold");
    ctx.textAlign = "left";
    ctx.fillStyle = left.color;
    ctx.fillText(
      row.values
        ? `${row.percents[0]}% · ${row.values[0]}`
        : `${row.percents[0]}%`,
      area.x,
      captionY
    );
    ctx.textAlign = "right";
    ctx.fillStyle = right.color;
    ctx.fillText(
      row.values
        ? `${row.values[1]} · ${row.percents[1]}%`
        : `${row.percents[1]}%`,
      area.x + area.width,
      captionY
    );
  });
}

function drawClock(ctx, card, box, layout) {
  const gap = layout.tileGap;
  const rowHeight = Math.min(
    (box.height - gap * (card.people.length - 1)) / card.people.length,
    layout.maxClockRow
  );
  const area = centered(
    box,
    rowHeight * card.people.length + gap * (card.people.length - 1)
  );

  card.people.forEach((person, index) => {
    const y = area.y + index * (rowHeight + gap);

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    roundRect(ctx, area.x, y, area.width, rowHeight, 28);
    ctx.fill();

    const innerX = area.x + 32;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = person.color;
    const nameSize = fittedFont(
      ctx,
      person.name,
      area.width * 0.5,
      layout.statLabelSize * 1.2,
      "bold"
    );
    ctx.font = font(nameSize, "bold");
    ctx.fillText(person.name, innerX, y + 26);

    ctx.textAlign = "right";
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = font(layout.statLabelSize * 1.5, "bold");
    ctx.fillText(person.peakLabel, area.x + area.width - 32, y + 22);

    ctx.textAlign = "left";
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = font(layout.footnoteSize);
    ctx.fillText(person.badge, innerX, y + 26 + nameSize * 1.35);

    // 24 hour histogram along the bottom of the row.
    const histTop = y + rowHeight * 0.58;
    const histHeight = rowHeight * 0.3;
    const histWidth = area.width - 64;
    const barWidth = histWidth / 24;
    const max = Math.max(...person.hourly, 1);
    person.hourly.forEach((count, hour) => {
      const barHeight = Math.max((count / max) * histHeight, 3);
      ctx.fillStyle =
        hour === person.peakHour ? person.color : withAlpha(person.color, 0.4);
      roundRect(
        ctx,
        innerX + hour * barWidth,
        histTop + histHeight - barHeight,
        barWidth * 0.66,
        barHeight,
        barWidth * 0.33
      );
      ctx.fill();
    });
  });
}

function drawEmoji(ctx, card, box, layout) {
  const gap = layout.tileGap;
  const rowHeight = Math.min(
    (box.height - gap * (card.people.length - 1)) / card.people.length,
    layout.maxEmojiRow
  );
  const area = centered(
    box,
    rowHeight * card.people.length + gap * (card.people.length - 1)
  );

  card.people.forEach((person, index) => {
    const y = area.y + index * (rowHeight + gap);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = person.color;
    const nameSize = fittedFont(
      ctx,
      person.name,
      area.width,
      layout.statLabelSize * 1.2,
      "bold"
    );
    ctx.font = font(nameSize, "bold");
    ctx.fillText(person.name, area.x, y);

    const podiumTop = y + nameSize * 1.6;
    const slotWidth = area.width / 5;
    const emojiSize = Math.min(slotWidth * 0.62, rowHeight * 0.4);

    person.emojis.forEach((entry, position) => {
      const centerX = area.x + slotWidth * position + slotWidth / 2;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = `${emojiSize}px ${EMOJI_FONT}`;
      ctx.fillText(entry.emoji, centerX, podiumTop);

      ctx.fillStyle = position === 0 ? TEXT_PRIMARY : TEXT_MUTED;
      ctx.font = font(layout.footnoteSize, position === 0 ? "bold" : "normal");
      ctx.fillText(
        entry.count ? entry.count : `#${position + 1}`,
        centerX,
        podiumTop + emojiSize * 1.2
      );
      ctx.fillStyle = person.color;
    });
  });
}

function drawWords(ctx, card, box, layout) {
  const gap = layout.tileGap;
  const rowHeight = Math.min(
    (box.height - gap * (card.people.length - 1)) / card.people.length,
    layout.maxWordsRow
  );
  const area = centered(
    box,
    rowHeight * card.people.length + gap * (card.people.length - 1)
  );

  card.people.forEach((person, index) => {
    const y = area.y + index * (rowHeight + gap);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = person.color;
    const nameSize = fittedFont(
      ctx,
      person.name,
      area.width,
      layout.statLabelSize * 1.2,
      "bold"
    );
    ctx.font = font(nameSize, "bold");
    ctx.fillText(person.name, area.x, y);

    let chipX = area.x;
    let chipY = y + nameSize * 1.7;
    const chipHeight = Math.min(rowHeight * 0.28, 92);
    const wordSize = chipHeight * 0.4;

    person.words.forEach((entry) => {
      const label = entry.count ? `${entry.word} ×${entry.count}` : entry.word;
      ctx.font = font(wordSize, "bold");
      const chipWidth = ctx.measureText(label).width + chipHeight * 0.8;
      if (chipX + chipWidth > area.x + area.width) {
        chipX = area.x;
        chipY += chipHeight * 1.2;
      }

      ctx.fillStyle = withAlpha(person.color, 0.22);
      roundRect(ctx, chipX, chipY, chipWidth, chipHeight, chipHeight / 2);
      ctx.fill();
      ctx.strokeStyle = withAlpha(person.color, 0.55);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = TEXT_PRIMARY;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, chipX + chipWidth / 2, chipY + chipHeight / 2);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      chipX += chipWidth + chipHeight * 0.25;
    });
  });
}

const BODY_RENDERERS = {
  stats: drawStats,
  duel: drawDuel,
  clock: drawClock,
  emoji: drawEmoji,
  words: drawWords,
};

function layoutFor(format, tagline) {
  const { width, height } = CARD_FORMATS[format];
  const isStory = format === FORMAT_STORY;
  return {
    format,
    width,
    height,
    tagline,
    padding: 80,
    headerTop: isStory ? 150 : 80,
    kickerSize: isStory ? 34 : 30,
    titleSize: isStory ? 92 : 74,
    subtitleSize: isStory ? 38 : 32,
    statValueSize: isStory ? 108 : 84,
    statLabelSize: isStory ? 36 : 32,
    footnoteSize: isStory ? 28 : 26,
    brandSize: isStory ? 40 : 34,
    tileGap: isStory ? 32 : 24,
    maxTileHeight: isStory ? 260 : 220,
    maxDuelRow: isStory ? 260 : 190,
    maxClockRow: isStory ? 280 : 200,
    maxEmojiRow: isStory ? 320 : 230,
    maxWordsRow: isStory ? 300 : 210,
    qrSize: isStory ? 190 : 160,
    footerGap: 56,
  };
}

/**
 * Renders one share card at full social-media resolution. The same canvas is
 * used for the on-screen preview and for the export, so what users see is
 * exactly what they post.
 */
export function renderCard(card, { format = FORMAT_STORY, tagline = "" } = {}) {
  const layout = layoutFor(format, tagline);
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  drawBackground(ctx, layout.width, layout.height, card.accent || BRAND_GREEN);
  const bodyTop = drawHeader(ctx, card, layout) + layout.tileGap;
  drawFooter(ctx, layout);

  const bodyBottom =
    layout.height - layout.padding - layout.qrSize - layout.footerGap * 1.6;
  const box = {
    x: layout.padding,
    y: bodyTop,
    width: layout.width - layout.padding * 2,
    height: Math.max(bodyBottom - bodyTop, 200),
  };

  const renderBody = BODY_RENDERERS[card.type];
  if (renderBody) renderBody(ctx, card, box, layout);

  return canvas;
}

export function cardFileName(card, format) {
  return `whatsanalyze-${card.id}-${format}.png`;
}
