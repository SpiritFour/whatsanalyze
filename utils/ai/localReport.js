/**
 * Reading the on-device model's report. Its JSON is held to the schema by
 * WebLLM's grammar, so when it doesn't parse, it is nearly always cut off: a
 * report in German or Spanish runs past the token budget mid-list. That used
 * to be "local_invalid" twice over (the retry is cut off the same way). Here
 * the complete part is kept: the cut item goes, everything before it stays.
 */

/**
 * What the model said, without the think block Qwen opens with. Thinking is
 * switched off, but Qwen 3.5 still starts every answer with an empty
 * `<think></think>`, and WebLLM passes it on: the report's JSON began with
 * "<think>", never parsed, and every run on a computer ended in
 * "local_invalid". A block cut off before it closes leaves nothing to keep.
 *
 * @param {string} text
 * @returns {string}
 */
export function withoutThinking(text) {
  const s = String(text ?? "");
  if (!/^\s*<think>/.test(s)) return s;
  const end = s.indexOf("</think>");
  return end === -1 ? "" : s.slice(end + "</think>".length).trimStart();
}

/**
 * People named by the placeholders the model was given. A small model
 * sometimes takes a nickname from the chat instead ("Adri" for Person B),
 * which then shows up next to the real names as a stranger. An entry whose
 * name is no placeholder takes the first placeholder nobody has yet.
 *
 * @template {{ people: { name: string }[] }} R
 * @param {R} report
 * @param {string[]} aliases the placeholders, in the order they were given
 * @returns {R}
 */
export function namePeopleByAlias(report, aliases) {
  const known = new Set(aliases);
  const free = aliases.filter((a) => !report.people.some((p) => p.name === a));
  return {
    ...report,
    people: report.people.map((person) =>
      known.has(person.name) || !free.length
        ? person
        : { ...person, name: free.shift() },
    ),
  };
}

/**
 * JSON.parse that survives a truncated end: cut back to the last complete
 * value and close what is still open. Null if nothing complete is left.
 *
 * @param {string} text
 * @returns {unknown}
 */
export function parseTruncatedJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Cut below.
  }
  /** @type {{ close: "}" | "]", expectKey: boolean }[]} */
  const stack = [];
  let inString = false;
  let escaped = false;
  let stringIsKey = false;
  let safe = -1;
  let closers = "";
  const markSafe = (end) => {
    safe = end;
    closers = stack
      .map((open) => open.close)
      .reverse()
      .join("");
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') {
        inString = false;
        // A key on its own is not a value yet.
        if (!stringIsKey) markSafe(i + 1);
      }
      continue;
    }
    const top = stack[stack.length - 1];
    if (c === '"') {
      inString = true;
      stringIsKey = top?.close === "}" && top.expectKey;
    } else if (c === "{") {
      stack.push({ close: "}", expectKey: true });
    } else if (c === "[") {
      stack.push({ close: "]", expectKey: false });
    } else if (c === "}" || c === "]") {
      stack.pop();
      markSafe(i + 1);
    } else if (c === ":" && top) {
      top.expectKey = false;
    } else if (c === "," && top?.close === "}") {
      top.expectKey = true;
    }
  }
  if (safe < 0) return null;
  try {
    return JSON.parse(text.slice(0, safe) + closers);
  } catch {
    return null;
  }
}

/**
 * The report's shape from whatever was salvaged: missing fields empty, and
 * list items the cut left without one of their fields dropped. Nothing is
 * made up; tidyInsights (digest.js) then drops what's blank.
 *
 * @param {any} json
 * @returns {import("~/functions/src/ai/insights").ChatInsights}
 */
export function completeReport(json) {
  const text = (value) => (typeof value === "string" ? value : "");
  const whole = (list, keys) =>
    Array.isArray(list)
      ? list
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              keys.every((key) => typeof item[key] === "string"),
          )
          .map((item) =>
            Object.fromEntries(keys.map((key) => [key, item[key]])),
          )
      : [];
  return {
    answer: text(json?.answer),
    summary: text(json?.summary),
    vibe: text(json?.vibe),
    topics: whole(json?.topics, ["title", "description"]),
    people: whole(json?.people, ["name", "role", "style"]),
    dynamics: whole(json?.dynamics, ["title", "description"]),
    highlights: Array.isArray(json?.highlights)
      ? json.highlights.filter((h) => typeof h === "string")
      : [],
  };
}

/**
 * The model's answer as a report, or null when not even a summary made it.
 *
 * @param {string} content
 */
export function readLocalReport(content) {
  const json = parseTruncatedJson(content);
  if (!json || typeof json !== "object") return null;
  const report = completeReport(json);
  return report.summary.trim() ? report : null;
}
