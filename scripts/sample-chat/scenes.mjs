/**
 * The story of the sample chat, the moments that make it one. Emma and Leo
 * are made up, and so is everything they say.
 *
 * Each line is "HH:MM|who|text" or "|who|text" (a minute or two after the
 * line before). "who" is E or L. A "\n" in the text is a second line of the
 * same message, the way WhatsApp exports a message with line breaks.
 */
export const SCENES = [
  {
    date: "2025-09-12",
    lines: [
      "23:48|L|hey, it's Leo from Jana's party. the guy who lost the pineapple pizza argument 🍍",
      "23:51|E|haha hi! you didn't lose, you gave up",
      "|E|I'm glad you texted though",
      "|L|Jana said you'd kill me if I didn't",
      "|E|Jana is a liar",
      "|E|(a little bit true)",
      "|L|😄 so… would you want to get ramen sometime? as a peace offering",
      "|E|only if you admit pineapple is fine",
      "|L|never. but I'll pay",
      "|E|deal. thursday?",
      "|L|thursday 👍",
    ],
  },
  {
    date: "2025-09-18",
    lines: [
      "18:41|E|running 5 min late, the tram is crawling 🙈",
      "|L|no stress, I got us a table by the window",
      "23:12|E|I had a really good time tonight",
      "|L|me too. like, really",
      "|L|also you were right about the egg",
      "|E|I'm always right about eggs",
      "|L|noted 📝",
      "|E|goodnight Leo 🌙",
      "|L|night Emma ✨",
    ],
  },
  {
    date: "2025-09-27",
    lines: [
      "08:02|L|there is a pigeon on my balcony and it is staring at me",
      "|L|<Media omitted>",
      "08:09|E|he looks like a Gerald",
      "|L|oh no. he's definitely a Gerald",
      "|E|tell Gerald I said hi",
      "|L|Gerald says my coffee is too weak",
      "|E|Gerald has standards 😂",
    ],
  },
  {
    date: "2025-10-05",
    lines: [
      "10:14|E|I'm making pancakes. this is not an invitation. (it is an invitation)",
      "|L|on my way 🥞",
      "|L|what do I bring",
      "|E|blueberries and your bad jokes",
      "|L|I only have the jokes",
      "|E|acceptable",
    ],
  },
  {
    date: "2025-10-21",
    lines: [
      "03:12|E|break time. eating pretzels in the staff room and thinking about you",
      "07:01|L|just saw this. most romantic thing anyone has ever said about pretzels",
      "|L|how was the night?",
      "07:40|E|long. a patient asked me to marry him. I said I'm taken",
      "|L|wait. taken?",
      "|E|…was that too soon",
      "|L|no. I like it. a lot ❤️",
    ],
  },
  {
    date: "2025-11-29",
    lines: [
      "00:34|L|I know saying this over text is cowardly but I love you",
      "00:35|E|you're not a coward",
      "|E|I love you too. I've wanted to say it for two weeks 🥹",
      "|L|two weeks?? we wasted two weeks",
      "|E|we'll make up for it",
    ],
  },
  {
    date: "2025-12-12",
    lines: [
      "19:20|E|so my mum asked if you're coming for christmas",
      "|L|is that a test",
      "|E|everything with my mum is a test",
      "|L|then yes. what do I bring? what does she like?",
      "|E|lemon cake. and don't bring up football with my dad, he gets emotional",
      "|L|noted 📝 lemon cake, no football",
    ],
  },
  {
    date: "2025-12-26",
    lines: [
      "22:05|L|your dad and I talked about football for two hours",
      "|E|I said NOT football",
      "|L|he started it 😂",
      "|E|he really likes you btw. mum too. she asked for the cake recipe",
      "|L|tell her it's a family secret",
      "|E|you bought it at the bakery",
      "|L|a family secret",
    ],
  },
  {
    date: "2026-01-01",
    lines: [
      "00:01|E|happy new year ❤️🎆",
      "|L|happy new year. best year starts now",
      "|E|cheesy",
      "|L|you love it",
      "|E|I do",
    ],
  },
  {
    date: "2026-01-17",
    lines: [
      "17:30|L|I made you a key. don't make it weird",
      "|E|it's very weird. I love it 🔑",
      "|L|Gerald approves",
      "|E|then it's official",
    ],
  },
  {
    date: "2026-02-06",
    lines: [
      "18:52|L|hey I'm so sorry, the pitch got moved to monday and I have to stay. can we do dinner tomorrow instead?",
      "18:55|E|oh. ok. I already reserved the table but it's fine",
      "|L|I'll make it up to you, promise",
      "|E|you'd better. tomorrow 8?",
      "|L|tomorrow 8 ❤️",
    ],
  },
  {
    date: "2026-02-14",
    lines: [
      "09:12|E|happy valentine's to my favourite pigeon owner",
      "|L|Gerald isn't mine, Gerald is free. but happy valentine's ❤️",
      "16:40|L|<Media omitted>",
      "|L|check your door",
      "16:52|E|they're beautiful 😭",
      "|E|you remembered the yellow ones",
      "|L|I remember everything you tell me",
      "|E|that's a big claim",
      "|L|test me",
    ],
  },
  {
    date: "2026-03-03",
    lines: [
      "00:00|E|happy birthday old man 🎂",
      "|E|30 looks good on you",
      "00:04|L|you stayed up for this?",
      "|E|obviously",
      "|L|❤️ best girlfriend",
      "19:10|E|table's booked for 8. Max and Jana are coming too",
      "|L|I'll be there at 7:45. not even late",
      "23:48|L|thank you for today. really",
    ],
  },
  {
    date: "2026-03-20",
    lines: [
      "21:03|L|flights to Lisbon in May are cheap right now. 15th to 19th?",
      "|E|YES. book it before I check my shifts",
      "|L|booked ✈️",
      "|E|I can't believe we're going",
      "|L|pastel de nata tour. I made a list",
      "|E|of course you made a list",
    ],
  },
  {
    // The same fight, the first time: late, and no text to say so.
    date: "2026-04-09",
    lines: [
      "19:05|E|I'm at the restaurant",
      "19:31|E|Leo?",
      "19:58|E|are you coming?",
      "20:14|L|shit. sorry. we're still in the meeting, I lost track of time",
      "20:15|E|you said 7. I've been sitting here for an hour",
      "|L|I know. I'm really sorry. the client changed everything again",
      "|E|you could have texted",
      "|L|I didn't see the time, I said I'm sorry",
      "20:21|E|I'm going home",
      "20:40|L|can I come over later?",
      "21:22|E|I'm tired. tomorrow",
      "23:50|L|I hate when we end the day like this",
      "23:58|E|me too. pancakes on sunday?",
      "|L|pancakes on sunday 🥞",
    ],
  },
  {
    // The second time, two weeks before Lisbon.
    date: "2026-05-02",
    lines: [
      "17:40|L|so… I might have to work on the 15th. just the morning. we could take the later flight?",
      "17:42|E|are you serious",
      "|E|we booked this two months ago",
      "|L|I know. it's one meeting",
      "|E|it's always one meeting",
      "|L|that's not fair. I'm doing this for us too, you know that",
      "|E|I know you think that",
      "18:30|L|ok. I'll move it. I'll tell them I'm off",
      "18:31|E|thank you",
      "|E|I'm not trying to be difficult. I just want to be a priority sometimes",
      "18:40|L|you are. I've been bad at showing it lately. I'm sorry",
      "|E|ok ❤️",
    ],
  },
  {
    date: "2026-05-14",
    lines: [
      "21:10|E|packing list: sunscreen, the good camera, you",
      "|L|I'm not fitting in the suitcase",
      "|E|we'll see",
    ],
  },
  {
    date: "2026-05-15",
    lines: [
      "06:58|L|at the gate. B12. where are you",
      "|E|security line from hell. 10 min",
      "|L|I bought you a croissant as emotional support",
      "07:14|E|running 🏃‍♀️",
    ],
  },
  {
    date: "2026-05-17",
    lines: [
      "15:22|E|<Media omitted>",
      "|E|<Media omitted>",
      "|E|sending you the photos so you have them",
      "|L|we're literally sitting next to each other",
      "|E|backup",
      "|L|this tram is going vertically and I've accepted it",
      "22:47|L|I love you here. like this",
      "|E|let's keep it like this when we're home",
      "|L|promise",
    ],
  },
  {
    date: "2026-05-19",
    lines: [
      "21:30|E|home. I miss Lisbon already",
      "|L|I miss you already and you left 20 min ago",
      "|E|pastel de nata count?",
      "|L|11. no regrets",
    ],
  },
  {
    // Her birthday, and the third time.
    date: "2026-06-13",
    lines: [
      "00:00|L|happy birthday ❤️ can't wait for tonight",
      "00:02|E|🥹❤️",
      "19:40|E|everyone's here. where are you?",
      "20:05|L|15 min!! the train is stuck, I swear",
      "20:06|E|ok",
      "20:35|L|here, coming in",
      "23:30|E|thanks for the gift. I love it. I just wish you'd been there for the toast",
      "|L|I know. I'm sorry. the train really was stuck",
      "|E|I know. it's not about the train",
      "|L|then what is it about",
      "|E|it's that it's always something",
      "23:52|L|I don't know what you want me to say",
      "|E|nothing. I'm going to sleep",
    ],
  },
  {
    date: "2026-06-14",
    lines: [
      "08:10|L|I've been thinking about what you said. you're right that it's a pattern. I don't want it to be",
      "09:30|E|thank you for saying that. can we talk about it properly this weekend?",
      "|L|yes",
    ],
  },
  {
    date: "2026-06-20",
    lines: [
      "23:15|E|thank you for tonight. I feel better after talking",
      "|L|me too. I'll text when I'm running late. like an adult",
      "|E|like an adult 😂",
      "|L|calendar reminders and everything",
    ],
  },
  {
    // The fourth time, after the promise.
    date: "2026-07-22",
    lines: [
      "18:20|E|are we still on for the cinema at 8?",
      "19:47|L|ah no, I completely forgot, I told Max I'd help him move his couch tonight",
      "19:48|E|you forgot",
      "|E|we planned this on monday",
      "|L|I'm sorry, it slipped. can we go thursday?",
      "|E|this is the same fight again and I'm so tired of having it",
      "|L|then let's not have it. I said sorry",
      "|E|saying sorry and then doing it again isn't the same as changing",
      "21:10|L|ok. you're right. I don't know why I keep doing this",
      "22:30|E|I don't want to be your secretary. I want you to want to be there",
      "22:45|L|I do want to be there. I'll fix my calendar thing. I mean it this time",
      "|E|ok",
    ],
  },
  {
    date: "2026-08-12",
    lines: [
      "20:02|L|new project starts monday, it's going to be intense for a while",
      "|E|how long is a while?",
      "20:31|L|october probably",
      "|E|ok. we'll manage 💪",
      "|L|we will",
    ],
  },
  {
    date: "2026-08-30",
    lines: [
      "21:14|E|are we ok?",
      "23:58|L|yeah. why",
      "23:59|E|you just seem far away lately",
    ],
  },
  {
    date: "2026-08-31",
    lines: [
      "00:12|L|just tired. work is a lot",
      "|E|ok. you know you can talk to me",
      "|L|I know",
    ],
  },
  {
    date: "2026-09-13",
    lines: [
      "23:40|L|that was amazing. thank you for dragging me out",
      "|E|I missed you",
      "|L|I'm right here",
      "|E|you know what I mean",
      "00:01|L|yeah. I do",
    ],
  },
  {
    date: "2026-09-27",
    lines: ["23:40|L|hey, you alive?"],
  },
  {
    date: "2026-09-28",
    lines: [
      "09:15|E|I didn't text first all week on purpose. I wanted to see if you would",
      "12:40|L|that feels like a test",
      "12:41|E|maybe. but you didn't text for five days, Leo",
      "|L|I've been drowning at work, you know that",
      "|E|I know. I just miss being someone you think about during the day",
      "18:02|L|I do think about you. I'm just bad at showing it right now",
      "|E|ok",
    ],
  },
  {
    date: "2026-10-10",
    lines: [
      "11:05|L|Gerald is back. he looks older. I think he missed you",
      "11:20|E|tell him I miss him too",
      "|L|he says come over sunday? pancakes?",
      "|E|🥞 yes",
    ],
  },
  {
    // The chat ends here, with a message waiting for an answer.
    date: "2026-10-24",
    lines: [
      "22:47|L|are you awake?",
      "|L|can we talk tomorrow? in person. I've been thinking a lot about us lately",
    ],
  },
];

/** Days with no messages at all: the week Emma waited for him to text first. */
export const QUIET_DAYS = [
  "2026-09-22",
  "2026-09-23",
  "2026-09-24",
  "2026-09-25",
  "2026-09-26",
  "2026-09-27",
];

/** Days they spent together, with nothing to text about. */
export const TOGETHER_DAYS = ["2026-05-16", "2026-05-17", "2026-05-18"];
