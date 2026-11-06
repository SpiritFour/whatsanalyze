/**
 * The everyday messages between the story's moments: mornings, errands,
 * dinner plans, night shifts. Each one is a short exchange started by "a"
 * and answered by "b"; a line given as a list is said one of those ways, so
 * a year of mornings doesn't read like the same morning. `who` pins who
 * starts it, `max` how often it can come up at all, `weekday` keeps it to
 * Monday to Friday, and `from`/`until` to
 * the part of the story it belongs to (no Lisbon before it was booked, no
 * shopping lists the week they met). `{dish}` and the like come from SLOTS.
 */
export const SLOTS = {
  dish: [
    "ramen",
    "pad thai",
    "pizza",
    "that lentil curry",
    "tacos",
    "dumplings",
    "risotto",
    "shakshuka",
    "falafel",
    "pasta",
    "burritos",
    "soup",
  ],
  show: [
    "the bake off",
    "that danish crime show",
    "the cooking one",
    "our documentary",
    "the space series",
    "the dating show we pretend not to like",
  ],
  item: [
    "oat milk",
    "eggs",
    "limes",
    "coffee",
    "bread",
    "avocados",
    "blueberries",
    "tomatoes",
    "dish soap",
    "pasta",
    "cheese",
  ],
  time: ["7", "7:30", "8", "6:45", "8:15"],
  friend: ["Jana", "Max", "Sophie", "Tom"],
  place: ["the park", "the market", "the bakery", "the bridge", "the corner"],
};

export const EVERYDAY = [
  // Mornings
  {
    slot: "morning",
    lines: [
      [
        "a",
        ["good morning ☀️", "morning!", "morniiing", "hey you. good morning"],
      ],
      [
        "b",
        [
          "morning! slept like a rock",
          "morning 😴",
          "hi! barely awake",
          "good morning ❤️",
          "morning. need coffee before words",
        ],
      ],
    ],
  },
  {
    slot: "morning",
    lines: [
      ["a", ["morning", "are you up?", "wake up sleepyhead"]],
      ["b", ["five more minutes", "no", "define up"]],
      [
        "a",
        [
          "that's what you said 20 minutes ago",
          "the sun is up, so you're up",
          "fair",
        ],
      ],
    ],
  },
  {
    slot: "morning",
    who: "L",
    from: "2025-09-28",
    until: "2026-07-31",
    lines: [
      [
        "a",
        [
          "Gerald is back on the balcony. judging my breakfast",
          "Gerald update: he's sitting on my bike",
          "Gerald knocked over the basil",
        ],
      ],
      ["b", ["what are you having", "of course he did", "Gerald is chaos"]],
      [
        "a",
        [
          "toast",
          "he's not even sorry",
          "he's looking at me like it's my fault",
        ],
      ],
      ["b", ["Gerald is right", "classic Gerald", "😂"]],
    ],
  },
  {
    max: 3,
    slot: "morning",
    who: "L",
    from: "2025-11-01",
    until: "2026-07-31",
    lines: [
      ["a", "Gerald brought a friend today 🐦🐦"],
      ["b", "Gerald has a girlfriend??"],
      ["a", "Gerald is doing better than all of us"],
    ],
  },
  {
    slot: "morning",
    lines: [
      [
        "a",
        [
          "it's raining sideways",
          "it's so cold today",
          "the sun is out!!",
          "fog everywhere, can't see the street",
        ],
      ],
      [
        "b",
        [
          "I'm not going outside then",
          "staying in bed is the only option",
          "finally",
          "spooky",
        ],
      ],
    ],
  },
  {
    slot: "morning",
    lines: [
      ["a", ["did you sleep ok?", "how did you sleep?"]],
      ["b", ["yes! you?", "badly. you?", "like a baby. you?"]],
      [
        "a",
        [
          "dreamt I forgot my shoes at work. very stressful",
          "the neighbours had a party until 2",
          "fine, until the alarm",
          "great actually",
        ],
      ],
    ],
  },
  {
    slot: "morning",
    who: "E",
    lines: [
      [
        "a",
        [
          "early shift, already on the tram 🥱",
          "early shift. send coffee",
          "at work already",
        ],
      ],
      [
        "b",
        ["have a good one. drink water", "you're a hero", "good luck today"],
      ],
      ["a", ["yes doctor", "I'll try", "thank you"]],
    ],
  },
  {
    slot: "morning",
    who: "L",
    weekday: true,
    lines: [
      [
        "a",
        [
          "coffee machine at work is broken. this is how it ends",
          "forgot my laptop charger. great start",
          "train is late again",
        ],
      ],
      ["b", ["stay strong", "oh no", "the classic"]],
    ],
  },
  {
    slot: "morning",
    weekday: true,
    lines: [
      ["a", ["what's your day looking like?", "busy day?"]],
      [
        "b",
        [
          "meetings until 3 and then nothing",
          "full. you?",
          "calm for once",
          "chaotic already",
        ],
      ],
      ["a", ["jealous of the nothing", "same", "lucky", "hang in there"]],
    ],
  },
  // During the day
  {
    slot: "day",
    lines: [
      ["a", ["what are you having for lunch", "lunch?", "did you eat?"]],
      [
        "b",
        [
          "leftover {dish}. living the dream",
          "{dish} from the place downstairs",
          "a banana and regret",
          "not yet",
        ],
      ],
      ["a", ["😂", "eat something proper!", "nice"]],
    ],
  },
  {
    slot: "day",
    from: "2025-11-01",
    lines: [
      [
        "a",
        [
          "can you grab {item} on the way?",
          "we're out of {item}",
          "can you get {item} and {item}?",
        ],
      ],
      ["b", ["on it", "sure", "yep, after work"]],
    ],
  },
  {
    max: 6,
    slot: "day",
    weekday: true,
    lines: [
      ["a", "<Media omitted>"],
      ["b", ["hahaha where is that", "what am I looking at", "omg"]],
      [
        "a",
        [
          "next to the office. someone parked a sofa on the street",
          "the new coffee place. they do latte art of cats",
          "my desk. someone left a cake",
        ],
      ],
    ],
  },
  {
    slot: "day",
    lines: [
      ["a", "https://www.instagram.com/reel/{id}/"],
      [
        "b",
        [
          "this is literally you",
          "hahaha",
          "why is this so accurate",
          "I can't breathe 😂",
          "ok this one got me",
        ],
      ],
    ],
  },
  {
    slot: "day",
    from: "2025-10-20",
    weekday: true,
    lines: [
      [
        "a",
        [
          "{friend} asked if we're coming on saturday",
          "{friend} is doing a dinner on saturday",
          "{friend} wants to go bouldering this weekend",
        ],
      ],
      ["b", ["do you want to?", "I'm in", "only if I don't have a shift"]],
      ["a", ["yes but not too late", "yes!", "I'll ask what time"]],
    ],
  },
  {
    slot: "day",
    who: "L",
    weekday: true,
    lines: [
      [
        "a",
        [
          "this meeting could have been an email",
          "third meeting about the same slide",
          "my boss just said 'synergy' unironically",
        ],
      ],
      ["b", ["most meetings could", "😂", "escape while you can"]],
    ],
  },
  {
    slot: "day",
    who: "E",
    lines: [
      [
        "a",
        [
          "on my break. ward is chaos today",
          "finally a break. my feet hate me",
          "break! 20 minutes of freedom",
        ],
      ],
      [
        "b",
        [
          "sending you strength 💪",
          "eat something!",
          "you're amazing, you know that",
        ],
      ],
    ],
  },
  {
    max: 5,
    slot: "day",
    from: "2026-01-17",
    lines: [
      ["a", ["did you call the landlord?", "did you pay the electricity?"]],
      ["b", ["not yet. later", "doing it now", "oops"]],
    ],
  },
  {
    slot: "day",
    lines: [
      ["a", ["song of the day", "listen to this"]],
      ["a", "https://open.spotify.com/track/{id}"],
      [
        "b",
        ["ok this is good", "adding it to the playlist", "not my thing 😅"],
      ],
    ],
  },
  {
    slot: "day",
    from: "2026-03-20",
    until: "2026-05-14",
    lines: [
      [
        "a",
        [
          "how many days until Lisbon",
          "I looked up the tram routes again",
          "found a rooftop bar for Lisbon",
        ],
      ],
      ["b", ["too many", "nerd", "add it to the list"]],
    ],
  },
  {
    slot: "day",
    from: "2025-12-26",
    lines: [
      ["a", ["my mum called. she says hi", "mum asked about you again"]],
      [
        "b",
        ["hi back!", "tell her I say hi", "she likes me more than you now"],
      ],
    ],
  },
  {
    max: 6,
    slot: "day",
    lines: [
      [
        "a",
        [
          "I just saw a dog in a raincoat",
          "there's a cat on the tram",
          "a guy just rollerbladed past with a cello",
        ],
      ],
      [
        "b",
        [
          "photo or it didn't happen",
          "I need to see this",
          "only in this city",
        ],
      ],
    ],
  },
  {
    slot: "day",
    from: "2025-11-01",
    lines: [
      ["a", ["miss you", "thinking about you", "can't wait for tonight"]],
      ["b", ["miss you too", "❤️", "me too"]],
    ],
  },
  // Evenings
  {
    slot: "evening",
    lines: [
      ["a", ["{dish} or {dish} tonight?", "dinner: {dish} or {dish}?"]],
      ["b", ["the second one obviously", "the first one", "you choose"]],
      ["a", ["ordering", "done", "ok"]],
    ],
  },
  {
    slot: "evening",
    from: "2025-10-15",
    lines: [
      ["a", ["on my way, 15 min", "leaving now", "almost there"]],
      ["b", ["door's open", "see you soon", "👍"]],
    ],
  },
  {
    slot: "evening",
    from: "2025-10-15",
    lines: [
      ["a", ["one more episode of {show}?", "{show} tonight?"]],
      ["b", ["you know the rule", "yes please", "only one"]],
    ],
  },
  {
    slot: "evening",
    lines: [
      ["a", ["how was your day?", "how was work?", "how did it go today?"]],
      [
        "b",
        [
          "long. good though. yours?",
          "fine. tired. you?",
          "actually really good!",
          "don't ask",
        ],
      ],
    ],
  },
  {
    slot: "evening",
    from: "2025-10-15",
    lines: [
      ["a", ["are we still on for {time}?", "still {time}?"]],
      ["b", ["yes! meet at {place}?", "yep", "yes, see you there"]],
    ],
  },
  {
    slot: "evening",
    from: "2025-10-15",
    lines: [
      [
        "a",
        ["I'm cooking. it's going badly", "trying a new recipe. pray for me"],
      ],
      ["b", ["how badly", "what is it", "I'm bringing pizza"]],
    ],
  },
  {
    slot: "evening",
    lines: [
      ["a", ["running a bit late, 10 min", "5 min late, sorry!"]],
      ["b", ["no worries", "ok!"]],
    ],
  },
  {
    slot: "evening",
    who: "E",
    from: "2025-10-15",
    lines: [
      ["a", ["home. feet are dead", "finally home", "what a day"]],
      ["b", ["come over, I'll make tea", "want me to come over?", "rest!"]],
    ],
  },
  {
    slot: "evening",
    who: "L",
    from: "2025-10-15",
    lines: [
      [
        "a",
        ["just got home. what are you doing?", "home. what are you up to?"],
      ],
      ["b", ["couch. blanket. {show}", "reading", "nothing, come over"]],
    ],
  },
  {
    max: 6,
    slot: "evening",
    from: "2026-01-17",
    lines: [
      ["a", "shopping list:\n{item}\n{item}\n{item}\nsomething sweet"],
      [
        "b",
        [
          "'something sweet' is doing a lot of work",
          "on it",
          "chocolate counts?",
        ],
      ],
    ],
  },
  {
    slot: "evening",
    from: "2025-10-20",
    lines: [
      [
        "a",
        [
          "do you want to go to {friend}'s thing on friday?",
          "{friend} invited us for drinks friday",
        ],
      ],
      [
        "b",
        ["only if we leave before midnight", "sure", "I'm working, you go"],
      ],
    ],
  },
  // Getting to know each other
  {
    max: 1,
    slot: "evening",
    until: "2025-10-15",
    lines: [
      ["a", "what kind of music do you like?"],
      ["b", "everything except jazz. sorry"],
      ["a", "jazz is beautiful!!"],
      ["b", "then this can never work"],
    ],
  },
  {
    max: 1,
    slot: "day",
    until: "2025-10-15",
    lines: [
      ["a", "favourite food? apart from ramen"],
      ["b", "anything someone else cooks. you?"],
      ["a", "my nan's dumplings. unbeatable"],
    ],
  },
  {
    slot: "evening",
    until: "2025-10-15",
    lines: [
      ["a", "what are you up to this weekend?"],
      ["b", "nothing planned. you?"],
      ["a", "maybe the market on sunday"],
      ["b", "funny, I might be at the market on sunday too"],
    ],
  },
  {
    slot: "late",
    until: "2025-10-15",
    lines: [
      ["a", "is it weird that I already want to see you again"],
      ["b", "no. I was about to ask the same thing"],
    ],
  },
  {
    max: 1,
    slot: "late",
    until: "2025-10-15",
    lines: [
      ["a", "tell me three things about you"],
      ["b", "1. I can't whistle\n2. I hate olives\n3. I'm bad at this"],
      ["a", "you're not bad at this"],
    ],
  },
  {
    max: 2,
    slot: "day",
    until: "2025-10-15",
    lines: [
      ["a", "I keep thinking about our conversation"],
      ["b", "which part"],
      ["a", "all of it"],
    ],
  },
  {
    max: 1,
    slot: "evening",
    until: "2025-10-31",
    lines: [
      ["a", "what was your first concert?"],
      ["b", "a boy band. I will not elaborate"],
      ["a", "I need to know which one"],
      ["b", "never"],
    ],
  },
  // Late at night, mostly while it's new
  {
    slot: "late",
    until: "2026-03-31",
    lines: [
      ["a", ["are you asleep?", "you up?"]],
      ["b", ["no. you?", "almost"]],
      ["a", ["obviously not", "can't sleep"]],
      ["b", ["what are you thinking about", "count pigeons"]],
    ],
  },
  {
    slot: "late",
    until: "2026-03-31",
    lines: [
      ["a", ["goodnight ❤️", "night night", "sleep well, love"]],
      ["b", ["night. talk tomorrow", "goodnight ❤️", "sweet dreams"]],
    ],
  },
  {
    slot: "late",
    until: "2025-12-31",
    lines: [
      [
        "a",
        ["I can't stop smiling and it's your fault", "today was really nice"],
      ],
      ["b", ["I accept full responsibility", "it was"]],
    ],
  },
  {
    max: 2,
    slot: "late",
    until: "2025-12-31",
    lines: [
      ["a", "tell me something nobody knows about you"],
      ["b", "I cried at a car advert last week"],
      ["a", "which one"],
      ["b", "the one with the old man and the dog. don't judge"],
    ],
  },
  {
    slot: "late",
    lines: [
      ["a", ["sleep well", "night", "going to bed"]],
      ["b", ["you too 🌙", "night", "sleep well"]],
    ],
  },
];

/** Emma's night shifts: a message on her break, answered in the morning. */
export const SHIFT = [
  [
    [
      "E",
      [
        "night shift is quiet for once",
        "quiet night so far",
        "3am and all is calm",
      ],
    ],
    ["L", "good morning, hope you're asleep now"],
  ],
  [
    ["E", "3am thoughts: we should get a plant. a small one"],
    ["L", "we can't even keep the basil alive"],
    ["E", "the basil had a good life"],
  ],
  [
    [
      "E",
      [
        "colleague brought cake. night shift isn't all bad",
        "someone brought pizza for the night team 🍕",
      ],
    ],
    ["L", "save me a piece"],
  ],
  [
    [
      "E",
      [
        "so tired I put sugar in my soup",
        "I just tried to open a door with my badge. it was a window",
      ],
    ],
    ["L", "go to sleep when you're home!!"],
  ],
  [
    ["E", "break. the vending machine ate my coins again"],
    ["L", "I'll write it a strongly worded letter"],
  ],
];

/** What Leo answers with once he is pulling away. */
export const TERSE = [
  "ok",
  "sure",
  "sounds good",
  "👍",
  "yeah",
  "can't talk now",
  "busy, later",
  "sorry, just saw this",
  "maybe",
];
