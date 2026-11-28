/**
 * Voice messages, drawn like WhatsApp draws them: the sender's picture with
 * a microphone, a play button, a waveform and the length.
 *
 * The waveform is a generic shape (the same file always gets the same one);
 * the length is the real one where the export has the file. Everything is
 * boxes and two small PNG icons, so the PDF engine draws it as it draws any
 * other part of a bubble.
 */

const AUDIO = /\.(opus|ogg|oga|m4a|mp3|aac|wav|amr)$/i;

export function isVoiceFile(fileName: string | undefined): boolean {
  return !!fileName && AUDIO.test(fileName);
}

// ----- length ---------------------------------------------------------------

const OGG = [0x4f, 0x67, 0x67, 0x53]; // "OggS"

function isOggPage(bytes: Uint8Array, at: number): boolean {
  return OGG.every((byte, index) => bytes[at + index] === byte);
}

function find(bytes: Uint8Array, text: string, from: number, to: number) {
  const codes = Array.from(text, (char) => char.charCodeAt(0));
  const end = Math.min(to, bytes.length - codes.length);
  for (let i = from; i <= end; i++) {
    if (codes.every((code, index) => bytes[i + index] === code)) return i;
  }
  return -1;
}

/**
 * The length of an Ogg file (Opus, as WhatsApp records voice messages, or
 * Vorbis) without decoding it: the last page's granule position is the
 * number of samples, less Opus' pre-skip.
 */
export function oggDuration(bytes: Uint8Array): number | null {
  if (bytes.length < 64 || !isOggPage(bytes, 0)) return null;

  let rate = 48000;
  let preSkip = 0;
  const opus = find(bytes, "OpusHead", 0, 512);
  if (opus >= 0) {
    preSkip = bytes[opus + 10] | (bytes[opus + 11] << 8);
  } else {
    const vorbis = find(bytes, "vorbis", 0, 512);
    if (vorbis < 0) return null;
    const at = vorbis + 6 + 4 + 1; // after "vorbis", version and channels
    rate =
      (bytes[at] |
        (bytes[at + 1] << 8) |
        (bytes[at + 2] << 16) |
        (bytes[at + 3] << 24)) >>>
      0;
    if (!rate) return null;
  }

  for (let i = bytes.length - 27; i >= 0; i--) {
    if (!isOggPage(bytes, i)) continue;
    const view = new DataView(bytes.buffer, bytes.byteOffset + i + 6, 8);
    const low = view.getUint32(0, true);
    const high = view.getUint32(4, true);
    // -1: a page that ends no packet; look further back
    if (low === 0xffffffff && high === 0xffffffff) continue;
    const samples = high * 2 ** 32 + low - preSkip;
    return samples > 0 ? samples / rate : null;
  }
  return null;
}

/** Any other audio: as long as the browser says it is, if it can tell. */
function mediaDuration(
  bytes: Uint8Array,
  fileName: string,
): Promise<number | null> {
  if (typeof document === "undefined") return Promise.resolve(null);
  const ending = fileName.split(".").pop()?.toLowerCase() || "";
  const type =
    ending === "m4a" || ending === "aac"
      ? "audio/mp4"
      : ending === "mp3"
        ? "audio/mpeg"
        : `audio/${ending}`;
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const audio = document.createElement("audio");
  audio.preload = "metadata";
  return new Promise<number | null>((resolve) => {
    const done = (value: number | null) => {
      clearTimeout(timer);
      audio.removeAttribute("src");
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => done(null), 3000);
    audio.onloadedmetadata = () =>
      done(Number.isFinite(audio.duration) ? audio.duration : null);
    audio.onerror = () => done(null);
    audio.src = url;
  });
}

export async function voiceDuration(
  bytes: Uint8Array | undefined,
  fileName: string,
): Promise<number | null> {
  if (!bytes?.length) return null;
  try {
    return oggDuration(bytes) ?? (await mediaDuration(bytes, fileName));
  } catch {
    return null;
  }
}

/** "0:03", "12:41", "1:02:05" */
export function formatDuration(seconds: number): string {
  const total = Math.max(1, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

// ----- shape ----------------------------------------------------------------

const BARS = 30;

/** Bar heights in px, the same for the same file: a generic voice shape. */
export function waveform(seed: string): number[] {
  let state = 2166136261;
  for (const char of seed)
    state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  const next = () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    return ((state ^= state >>> 16) >>> 0) / 4294967296;
  };
  return Array.from({ length: BARS }, (_, index) => {
    // louder in the middle of a phrase, quieter at its ends
    const phrase = Math.sin((index / BARS) * Math.PI * (2 + next() * 0.5));
    return Math.round(4 + (0.35 + 0.65 * Math.abs(phrase)) * next() * 18);
  });
}

// ----- icons ----------------------------------------------------------------

const icons = new Map<string, string>();

/** A small PNG icon in `color`, drawn once per colour on a canvas. */
export function voiceIcon(kind: "play" | "mic", color: string): string {
  const key = `${kind}:${color}`;
  const cached = icons.get(key);
  if (cached) return cached;
  if (typeof document === "undefined") return "";

  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";

  if (kind === "play") {
    ctx.beginPath();
    ctx.moveTo(22, 12);
    ctx.lineTo(82, 48);
    ctx.lineTo(22, 84);
    ctx.closePath();
    ctx.lineJoin = "round";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fill();
  } else {
    // capsule
    ctx.beginPath();
    ctx.roundRect(34, 6, 28, 52, 14);
    ctx.fill();
    // cradle and stand
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(48, 42, 26, 0.05 * Math.PI, 0.95 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(48, 68);
    ctx.lineTo(48, 88);
    ctx.stroke();
  }

  const url = canvas.toDataURL("image/png");
  icons.set(key, url);
  return url;
}
