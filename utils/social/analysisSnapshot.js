import { socialStatsFor } from "~/utils/social/cardData";

export const SNAPSHOT_VERSION = 4;

/**
 * Everything the results page draws, and nothing it was drawn from.
 *
 * A share link used to carry the chat. It does not any more: what travels is
 * the finished analysis -- counts per hour, per weekday, per person, the word
 * and emoji frequencies, the fun facts -- which is what the charts read
 * anyway. No message text, no timestamps per message, nothing that could be
 * read back as a conversation. That is also why a shared link has no chat
 * view and no PDF: there is nothing behind them to show.
 *
 * It is a snapshot rather than a recipe because the numbers are what the
 * sender saw. It also makes the payload a few tens of kilobytes whatever the
 * chat's size, so there is no longer a limit on how long a chat may be.
 */
export async function captureAnalysis(chat) {
  const [
    lineGraph,
    funFacts,
    words,
    emojis,
    hourly,
    daily,
    weekly,
    shareOfSpeech,
  ] = await Promise.all([
    chat.getLineGraphData(),
    chat.getFunFacts(),
    chat.getAllWords(),
    chat.getEmojiCloudData(),
    chat.getHourlyData(),
    chat.getDailyData(),
    chat.getWeeklyData(),
    chat.getShareOfSpeech(),
  ]);

  const messages = chat.filterdChatObject;

  return {
    version: SNAPSHOT_VERSION,
    totalMessages: messages.length,
    firstDate: messages[0]?.date ?? null,
    lastDate: messages[messages.length - 1]?.date ?? null,
    numPersonsInChat: chat.numPersonsInChat,
    // Names and colours only: the charts label their series with these, and
    // the download names its file after them.
    people: chat.messagesPerPerson.map((person) => ({
      name: person.name,
      color: person.color,
    })),
    lineGraph,
    // Every fun fact is plain data except the emoji, which arrive as a Set --
    // and JSON writes a Set as `{}`, which is how they went missing.
    funFacts: funFacts.map((person) => ({
      ...person,
      sortedEmojis: [...person.sortedEmojis],
    })),
    words,
    emojis,
    hourly,
    daily,
    weekly,
    shareOfSpeech,
    socialStats: socialStatsFor(chat),
  };
}

/**
 * Stands in for a Chat on the page behind a share link: the same methods the
 * charts call, answered from the snapshot instead of from messages.
 */
export class SharedAnalysis {
  constructor(snapshot) {
    this.snapshot = snapshot;
    this.numPersonsInChat = snapshot.numPersonsInChat;
    this.messagesPerPerson = snapshot.people;
    this.socialStats = snapshot.socialStats;
  }

  /**
   * Only its length and its ends are ever read -- the message count, and the
   * first and last dates above the charts -- so that is all there is. The
   * array is sparse: nothing in between was shared.
   */
  get filterdChatObject() {
    const stub = new Array(this.snapshot.totalMessages);
    if (this.snapshot.totalMessages > 0) {
      stub[0] = { date: this.snapshot.firstDate };
      stub[this.snapshot.totalMessages - 1] = { date: this.snapshot.lastDate };
    }
    return stub;
  }

  /**
   * Promises, because Chat returns one from every one of these and the word
   * and emoji clouds call `.then` on the result rather than awaiting it. A
   * bare value there is a TypeError inside a component, which shows up as a
   * chart that silently never fills.
   */
  getLineGraphData() {
    return Promise.resolve(this.snapshot.lineGraph);
  }

  getShareOfSpeech() {
    return Promise.resolve(this.snapshot.shareOfSpeech);
  }

  getHourlyData() {
    return Promise.resolve(this.snapshot.hourly);
  }

  getDailyData() {
    return Promise.resolve(this.snapshot.daily);
  }

  getWeeklyData() {
    return Promise.resolve(this.snapshot.weekly);
  }

  getAllWords() {
    return Promise.resolve(this.snapshot.words);
  }

  getEmojiCloudData() {
    return Promise.resolve(this.snapshot.emojis);
  }

  getFunFacts() {
    return Promise.resolve(this.snapshot.funFacts);
  }
}
