import { getHighlights } from "~/utils/wrapped/highlights";

const at = (day, time, author, message, month = 3) => {
  const [hour, minute] = time.split(":").map(Number);
  return {
    date: new Date(2026, month - 1, day, hour, minute),
    author,
    message,
  };
};

/** `count` messages from one person, a minute apart, starting at `time`. */
const many = (count, day, time, author, message, month = 3) => {
  const [hour, minute] = time.split(":").map(Number);
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(2026, month - 1, day, hour, minute + i),
    author,
    message: typeof message === "function" ? message(i) : message,
  }));
};

describe("getHighlights", () => {
  test("returns nothing for a chat without messages", () => {
    expect(getHighlights([])).toBeNull();
    expect(getHighlights([at(1, "10:00", null, "system")])).toBeNull();
  });

  test("counts the year and who wrote how much of it", () => {
    const result = getHighlights([
      at(1, "10:00", "Ana", "good morning"),
      at(1, "10:01", "Ben", "morning!"),
      at(1, "10:02", "Ana", "coffee later?"),
      at(3, "18:00", "Ana", "<Media omitted>"),
    ]);

    expect(result.year).toBe(2026);
    expect(result.isGroup).toBe(false);
    expect(result.totals.messages).toBe(4);
    expect(result.totals.daysActive).toBe(2);
    expect(result.totals.daysInSpan).toBe(3);
    expect(result.totals.media).toBe(1);
    expect(result.totals.firstDate).toBe("2026-03-01");
    expect(result.people.map((p) => [p.name, p.messages])).toEqual([
      ["Ana", 3],
      ["Ben", 1],
    ]);
    expect(result.people[0].share).toBe(0.75);
    // The media placeholder is not three words of Ana's.
    expect(result.people[0].words).toBe(4);
  });

  test("survives JSON, which is how a share link carries it", () => {
    const result = getHighlights([
      at(1, "10:00", "Ana", "hello"),
      at(1, "10:05", "Ben", "hi"),
    ]);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  test("reads dates that came back from storage as strings", () => {
    const message = at(1, "10:00", "Ana", "hello");
    const result = getHighlights([
      { ...message, date: message.date.toISOString() },
    ]);
    expect(result.totals.messages).toBe(1);
  });

  test("finds the peak hour and calls a late chat night owls", () => {
    const result = getHighlights([
      ...many(6, 1, "23:10", "Ana", "still up"),
      ...many(2, 2, "12:00", "Ben", "lunch"),
    ]);
    expect(result.peakHour).toBe(23);
    expect(result.hours[23]).toBe(6);
    expect(result.chronotype).toBe("nightOwls");
  });

  test("counts messages between midnight and five", () => {
    const result = getHighlights([
      at(1, "00:30", "Ana", "can't sleep"),
      at(1, "04:59", "Ben", "same"),
      at(1, "05:00", "Ana", "morning now"),
      at(1, "12:00", "Ben", "lunch"),
    ]);
    expect(result.afterMidnightShare).toBe(0.5);
  });

  test("finds the longest streak of days in a row", () => {
    const result = getHighlights([
      at(1, "10:00", "Ana", "a"),
      at(2, "10:00", "Ben", "b"),
      at(3, "10:00", "Ana", "c"),
      at(6, "10:00", "Ben", "d"),
      at(7, "10:00", "Ana", "e"),
    ]);
    expect(result.streak).toEqual({
      days: 3,
      start: "2026-03-01",
      end: "2026-03-03",
    });
  });

  test("keeps a streak going across the end of a month", () => {
    const result = getHighlights([
      at(30, "10:00", "Ana", "a"),
      at(31, "10:00", "Ben", "b"),
      at(1, "10:00", "Ana", "c", 4),
    ]);
    expect(result.streak.days).toBe(3);
  });

  test("finds the longest silence and the busiest day", () => {
    const result = getHighlights([
      at(1, "10:00", "Ana", "a"),
      at(1, "10:01", "Ben", "b"),
      at(1, "10:02", "Ana", "c"),
      at(9, "12:00", "Ben", "long time"),
    ]);
    expect(result.silence.days).toBe(8);
    expect(result.silence.start).toBe("2026-03-01");
    expect(result.silence.end).toBe("2026-03-09");
    expect(result.busiestDay).toEqual({ date: "2026-03-01", count: 3 });
  });

  test("says who starts conversations: the first message after six hours", () => {
    const result = getHighlights([
      at(1, "09:00", "Ana", "morning"),
      at(1, "09:05", "Ben", "hey"),
      at(1, "18:00", "Ana", "evening"),
      at(1, "18:02", "Ben", "hey again"),
      at(2, "09:00", "Ben", "my turn"),
    ]);
    const [ana, ben] = ["Ana", "Ben"].map((name) =>
      result.people.find((p) => p.name === name),
    );
    expect(result.totals.conversations).toBe(3);
    expect(ana.starts).toBe(2);
    expect(ben.starts).toBe(1);
    expect(ana.startShare).toBeCloseTo(0.6667, 3);
  });

  test("takes the median reply time, and none from too few replies", () => {
    const messages = [];
    // Ben answers after 2 minutes, six times; Ana's follow-up comes 30 later.
    for (let i = 0; i < 6; i += 1) {
      messages.push(at(1, `10:${String(i * 4).padStart(2, "0")}`, "Ana", "q"));
      messages.push(
        at(1, `10:${String(i * 4 + 2).padStart(2, "0")}`, "Ben", "a"),
      );
    }
    const result = getHighlights(messages);
    const ben = result.people.find((p) => p.name === "Ben");
    expect(ben.medianReplyMin).toBe(2);

    const few = getHighlights([
      at(1, "10:00", "Ana", "q"),
      at(1, "10:02", "Ben", "a"),
    ]);
    expect(few.people.find((p) => p.name === "Ben").medianReplyMin).toBeNull();
  });

  test("a morning after is a new conversation, not a twelve-hour reply", () => {
    const messages = [];
    for (let day = 1; day <= 6; day += 1) {
      messages.push(at(day, "22:00", "Ana", "good night"));
      messages.push(at(day + 1, "08:00", "Ben", "good morning"));
    }
    const result = getHighlights(messages);
    expect(
      result.people.find((p) => p.name === "Ben").medianReplyMin,
    ).toBeNull();
  });

  describe("texting age", () => {
    test("needs enough written messages", () => {
      const result = getHighlights(many(10, 1, "10:00", "Ana", "hello there"));
      expect(result.people[0].age).toBeNull();
      expect(result.people[0].role).toBeNull();
    });

    test("ages up full stops, long messages and 😂", () => {
      const result = getHighlights(
        many(
          40,
          1,
          "10:00",
          "Ana",
          "Hello dear, I just wanted to let you know that we arrived safely and the weather is lovely here 😂.",
        ),
      );
      const [ana] = result.people;
      expect(ana.age).toBeGreaterThan(50);
      expect(ana.ageReasons).toContain("emojiOld");
      expect(ana.ageEmoji).toBe("😂");
    });

    test("ages down lowercase, short messages and 💀", () => {
      const result = getHighlights(
        many(40, 1, "10:00", "Ben", (i) =>
          i % 2 ? "nooo 💀" : "ngl thats wild 😭",
        ),
      );
      const [ben] = result.people;
      expect(ben.age).toBeLessThan(22);
      expect(ben.ageReasons.length).toBeGreaterThan(0);
      expect(ben.ageEmoji).toMatch(/💀|😭/u);
    });

    test("stays between 13 and 79", () => {
      const result = getHighlights([
        ...many(40, 1, "10:00", "Ana", "Dear all... 😂😂😂 Kind regards, Ana."),
        ...many(40, 2, "10:00", "Ben", "fr 💀"),
      ]);
      for (const person of result.people) {
        expect(person.age).toBeGreaterThanOrEqual(13);
        expect(person.age).toBeLessThanOrEqual(79);
      }
    });
  });

  describe("roles", () => {
    test("someone who writes at night is the night owl", () => {
      const result = getHighlights([
        ...many(30, 1, "23:20", "Ana", "are you awake"),
        ...many(30, 2, "13:00", "Ben", "lunch was good today, thanks"),
      ]);
      const ana = result.people.find((p) => p.name === "Ana");
      expect(ana.role).toEqual({ id: "nightOwl", value: 100 });
    });

    test("someone who writes paragraphs is the novelist", () => {
      const long =
        "so what happened was that I got to the station and the train had already left which meant I had to wait another forty minutes in the cold";
      // Taking turns, a minute apart, as a conversation does.
      const result = getHighlights(
        Array.from({ length: 60 }, (_, i) =>
          at(
            1 + Math.floor(i / 20),
            `13:${String(i % 20).padStart(2, "0")}`,
            i % 2 ? "Ben" : "Ana",
            i % 2 ? "ok" : long,
          ),
        ),
      );
      expect(result.people.find((p) => p.name === "Ana").role.id).toBe(
        "novelist",
      );
      expect(result.people.find((p) => p.name === "Ben").role.id).toBe(
        "minimalist",
      );
    });

    test("two people do not share a role when another fits nearly as well", () => {
      const result = getHighlights([
        ...many(30, 1, "23:20", "Ana", "are you awake"),
        ...many(30, 1, "23:55", "Ben", "yes I am awake"),
      ]);
      const roles = result.people.map((p) => p.role.id);
      expect(new Set(roles).size).toBe(2);
    });
  });

  test("picks the words one person says and the other does not", () => {
    const result = getHighlights([
      ...many(30, 1, "13:00", "Ana", "pizza tonight, pizza tomorrow"),
      ...many(30, 2, "13:00", "Ben", "concert tickets tonight"),
    ]);
    const ana = result.people.find((p) => p.name === "Ana");
    const ben = result.people.find((p) => p.name === "Ben");
    expect(ana.words3[0]).toEqual({ word: "pizza", count: 60 });
    expect(ben.words3.map((w) => w.word)).toEqual(
      expect.arrayContaining(["concert", "tickets"]),
    );
    // Said by both, so it is nobody's signature.
    expect(ana.words3[0].word).not.toBe("tonight");
  });

  test("names at most eight people of a group and counts the rest", () => {
    const messages = [];
    for (let i = 0; i < 11; i += 1) {
      messages.push(...many(i + 1, 1, `${10 + i}:00`, `Person ${i}`, "hello"));
    }
    const result = getHighlights(messages);
    expect(result.isGroup).toBe(true);
    expect(result.peopleCount).toBe(11);
    expect(result.people).toHaveLength(8);
    expect(result.people[0].name).toBe("Person 10");
  });
});
