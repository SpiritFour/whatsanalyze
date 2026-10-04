import { onlyEmoji } from "emoji-aware";
import moment from "moment";
import { Chat, isNoiseWord } from "~/utils/transformChatData";

// WhatsApp exports reference voice notes either by attachment file name or by
// a localised "audio omitted" placeholder. Catching both keeps the duel card
// honest across locales without parsing the attachment archive.
const VOICE_NOTE_PATTERN =
  /\.(opus|m4a|mp3|aac|ogg)\b|\b(ptt|audio)\b[^\n]*\b(omitted|weggelassen|omesso|omitido|omis|ausgeschlossen)\b/i;

const EMOJI_PRESENTATION = /\p{Emoji_Presentation}/u;

/**
 * Counted off the word frequencies rather than the messages themselves.
 *
 * `onlyEmoji` costs around 4ms per call, so running it over 30,000 messages
 * took two minutes and froze the page; over the few thousand distinct words
 * behind them it is instant, and it is also how the emoji cloud counts, so the
 * two cannot disagree about who used what.
 */
function countEmojis(freqDict) {
  const counts = {};
  Object.entries(freqDict).forEach(([word, freq]) => {
    onlyEmoji(word).forEach((emoji) => {
      // Skip text-presentation glyphs (©, ™, digits with keycaps) which read as
      // noise on a share card.
      if (!EMOJI_PRESENTATION.test(emoji)) return;
      counts[emoji] = (counts[emoji] || 0) + freq;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([emoji, count]) => ({ emoji, count }));
}

function countVoiceNotes(messages) {
  return messages.filter(({ message }) =>
    VOICE_NOTE_PATTERN.test(message || ""),
  ).length;
}

function peakHourOf(hourly) {
  return hourly.reduce(
    (best, count, hour) => (count > hourly[best] ? hour : best),
    0,
  );
}

function shareOfHours(hourly, from, to) {
  const total = hourly.reduce((sum, count) => sum + count, 0);
  if (!total) return 0;
  let inRange = 0;
  for (let hour = from; hour <= to; hour += 1) inRange += hourly[hour];
  return inRange / total;
}

/**
 * Picks the words a person uses far more often than everybody else in the chat.
 * Score is the person's share of all uses of that word, weighted by how often
 * they use it, so a word needs to be both distinctive and frequent to win.
 */
function signatureWords(personFreq, overallFreq, limit) {
  return Object.entries(personFreq)
    .filter(
      ([word, freq]) => freq >= 3 && word.length > 2 && !isNoiseWord(word),
    )
    .map(([word, freq]) => ({
      word,
      freq,
      score: (freq / (overallFreq[word] || freq)) * Math.log(1 + freq),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function freqDictOf(messages) {
  return Chat.createSortedFreqDict(messages).reduce((dict, [word, freq]) => {
    dict[word] = freq;
    return dict;
  }, {});
}

/**
 * Derives everything the highlights need from a parsed chat. This walks every
 * message several times and builds a word frequency table per person, so it is
 * the expensive half; buildSocialCards below is only formatting.
 *
 * Call socialStatsFor instead unless you want the work done again.
 */
export function collectSocialStats(chat) {
  const messages = chat.filterdChatObject;
  if (!messages.length) return null;

  // One pass for the span and the days that saw a message. Spreading the dates
  // into Math.min would throw on a chat past about 65,000 messages, and
  // formatting each one through moment cost a second on its own.
  let first = messages[0].date.getTime();
  let last = first;
  const activeDays = new Set();
  messages.forEach(({ date }) => {
    const time = date.getTime();
    if (time < first) first = time;
    if (time > last) last = time;
    activeDays.add(
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    );
  });
  const start = new Date(first);
  const end = new Date(last);
  const totalDays = Math.max(1, moment(end).diff(moment(start), "days") + 1);

  // Every message belongs to exactly one entry here (extra participants are
  // collapsed into "Others"), so merging these is the whole chat's word count
  // and saves walking all the messages a third time to get it.
  const perPersonFreq = chat.messagesPerPerson.map((person) =>
    freqDictOf(person.messages),
  );
  const overallFreq = {};
  perPersonFreq.forEach((freqDict) => {
    Object.entries(freqDict).forEach(([word, freq]) => {
      overallFreq[word] = (overallFreq[word] || 0) + freq;
    });
  });

  const enrichedPeople = chat.messagesPerPerson.map((person, index) => {
    const hourly = Chat.hourlyDataFromChat(person.messages);
    const personFreq = perPersonFreq[index];
    return {
      name: person.name,
      color: person.color,
      messages: person.messages.length,
      words: Chat.getTotalNumberOfWords(person.messages),
      voiceNotes: countVoiceNotes(person.messages),
      emojis: countEmojis(personFreq).slice(0, 5),
      hourly,
      peakHour: peakHourOf(hourly),
      // Late evening and the small hours both count as "up late", which a plain
      // average over the hour numbers would cancel out against each other.
      lateShare: shareOfHours(hourly, 18, 23) + shareOfHours(hourly, 0, 4),
      earlyShare: shareOfHours(hourly, 5, 11),
      signatureWords: signatureWords(personFreq, overallFreq, 3),
    };
  });

  return {
    totalMessages: messages.length,
    totalDays,
    activeDays: activeDays.size,
    averagePerDay: messages.length / totalDays,
    start,
    end,
    people: enrichedPeople,
  };
}

const STATS_BY_CHAT = new WeakMap();

/**
 * The stats for a chat, computed once.
 *
 * The highlights on the results page and the share dialog both need them, and
 * the dialog rebuilds its cards every time a privacy option changes. Without
 * this the whole chat was walked again each of those times, which on a long
 * chat locked the page up for long enough that clicks were simply lost.
 */
export function socialStatsFor(chat) {
  // A shared analysis arrives with these already computed, and has no messages
  // behind it to compute them from.
  if (chat.socialStats) return chat.socialStats;

  if (!STATS_BY_CHAT.has(chat)) {
    STATS_BY_CHAT.set(chat, collectSocialStats(chat));
  }
  return STATS_BY_CHAT.get(chat);
}

function percentSplit(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return values.map(() => 0);
  return values.map((value) => Math.round((value / total) * 100));
}

/**
 * Turns raw stats into the renderable card descriptors, applying the privacy
 * choices (name masking, hiding absolute counts) on the way. Cards without
 * enough data to be interesting are left out entirely.
 */
export function buildSocialCards(stats, { t, locale }) {
  if (!stats) return [];

  const people = stats.people;
  const [first, second] = people;
  const formatNumber = (value) => {
    // A chat that runs for years can average well under one message a day, and
    // rounding that to a flat "1" would be a lie on a public card.
    const absolute = Math.abs(value);
    const digits = absolute < 1 ? 2 : absolute < 10 ? 1 : 0;
    return Number(value).toLocaleString(locale, {
      maximumFractionDigits: digits,
    });
  };
  const formatHour = (hour) => `${String(hour).padStart(2, "0")}:00`;
  // The chart labels carry a trailing colon, which reads wrong as a card label.
  const label = (key) => t(key).replace(/\s*:$/, "");
  const cards = [];

  const overviewStats = [
    {
      label: t("socialCardMessages"),
      value: formatNumber(stats.totalMessages),
    },
    { label: t("socialCardDays"), value: formatNumber(stats.totalDays) },
    { label: t("socialCardPeople"), value: formatNumber(people.length) },
    { label: t("socialCardPerDay"), value: formatNumber(stats.averagePerDay) },
  ];
  cards.push({
    id: "overview",
    type: "stats",
    kicker: t("socialCardOverviewKicker"),
    title: t("socialCardOverviewTitle"),
    subtitle: `${moment(stats.start).format("MMM YYYY")} – ${moment(
      stats.end,
    ).format("MMM YYYY")}`,
    stats: overviewStats,
    accent: first?.color,
  });

  if (second) {
    const rows = [
      {
        label: t("socialCardMessages"),
        values: [first.messages, second.messages],
      },
      { label: label("totalWords"), values: [first.words, second.words] },
    ];
    if (first.voiceNotes + second.voiceNotes > 0) {
      rows.push({
        label: t("socialCardVoiceNotes"),
        values: [first.voiceNotes, second.voiceNotes],
      });
    }
    cards.push({
      id: "duel",
      type: "duel",
      kicker: t("socialCardDuelKicker"),
      title: t("socialCardDuelTitle"),
      contenders: [first, second],
      rows: rows.map((row) => ({
        label: row.label,
        percents: percentSplit(row.values),
        values: row.values.map(formatNumber),
      })),
      accent: first.color,
    });
  }

  const clockPeople = people.slice(0, 4);
  if (clockPeople.some((person) => person.messages > 0)) {
    // The card promises a contrast, so the badges are handed out by comparing
    // people against each other rather than against a fixed hour. The night owl
    // is settled first, so the same person cannot take both titles.
    const nightOwl = clockPeople.reduce((owl, person) =>
      person.lateShare > owl.lateShare ? person : owl,
    );
    const earlyBird = clockPeople
      .filter((person) => person !== nightOwl)
      .reduce(
        (bird, person) =>
          !bird || person.earlyShare > bird.earlyShare ? person : bird,
        null,
      );

    cards.push({
      id: "clock",
      type: "clock",
      kicker: t("socialCardClockKicker"),
      title: t("socialCardClockTitle"),
      people: clockPeople.map((person) => ({
        name: person.name,
        color: person.color,
        hourly: person.hourly,
        peakHour: person.peakHour,
        peakLabel: formatHour(person.peakHour),
        badge:
          person === nightOwl
            ? t("socialCardNightOwl")
            : person === earlyBird
              ? t("socialCardEarlyBird")
              : "",
      })),
      accent: first?.color,
    });
  }

  const emojiPeople = people
    .filter((person) => person.emojis.length)
    .slice(0, 3);
  if (emojiPeople.length) {
    cards.push({
      id: "emoji",
      type: "emoji",
      kicker: t("socialCardEmojiKicker"),
      title: t("socialCardEmojiTitle"),
      people: emojiPeople.map((person) => ({
        name: person.name,
        color: person.color,
        emojis: person.emojis.map((entry) => ({
          emoji: entry.emoji,
          count: formatNumber(entry.count),
        })),
      })),
      accent: emojiPeople[0].color,
    });
  }

  const wordPeople = people
    .filter((person) => person.signatureWords.length)
    .slice(0, 3);
  if (wordPeople.length) {
    cards.push({
      id: "words",
      type: "words",
      kicker: t("socialCardWordsKicker"),
      title: t("socialCardWordsTitle"),
      people: wordPeople.map((person) => ({
        name: person.name,
        color: person.color,
        words: person.signatureWords.map((entry) => ({
          word: entry.word,
          count: formatNumber(entry.freq),
        })),
      })),
      accent: wordPeople[0].color,
    });
  }

  return cards;
}
