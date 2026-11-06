/**
 * The sample chat's readings in English, written by Claude Opus 5.5 from the
 * chat and the production model's readings of it. One reading per point of
 * view (nobody's, Emma's, Leo's) and an answer per question; polish.mjs puts
 * them together into static/sample/ai/en.json.
 */
export default {
  why: "Why:",
  bases: {
    none: {
      vibe: "Pigeons, Pancakes & Promises",
      summary:
        "A love story told in texts: it starts with a lost argument about pineapple pizza and a ramen date, grows into a key, a Christmas with Emma’s parents and a trip to Lisbon, and runs on in-jokes about a pigeon called Gerald. Then the same fight about late and cancelled plans keeps coming back, Leo’s replies get shorter, and the chat ends on a message that hasn’t been answered yet.",
      people: [
        {
          name: "Emma",
          role: "The one who reaches out",
          style:
            "Starts most of the conversations, says plainly what she needs (“I just want to be a priority sometimes”), and keeps the jokes going even when things are tense.",
        },
        {
          name: "Leo",
          role: "The warm, busy one",
          style:
            "Funny and tender when he’s present (“I remember everything you tell me”), and lately writes far less: often one word, often hours later.",
        },
      ],
      dynamics: [
        {
          title: "Who reaches out",
          description:
            "In the first months they start conversations almost equally. Since August Emma has started nearly four in five, while Leo’s typical reply has gone from a few minutes to about three hours.",
        },
        {
          title: "The same fight, four times",
          description:
            "The dinner on April 9, the Lisbon flight, Emma’s birthday toast, the cinema in July: each time a plan slips, Emma says how it lands and Leo apologises, until she names it: “this is the same fight again.”",
        },
        {
          title: "Making up with pancakes",
          description:
            "Their repairs have a ritual. After the April fight it’s “pancakes on sunday?”, and in October Leo reaches back out with the same offer, via Gerald.",
        },
        {
          title: "Humour as glue",
          description:
            "Gerald, the “five more minutes” mornings and the egg at the ramen place keep coming back, and they’re still there when everything else gets quieter.",
        },
      ],
      topics: [
        {
          title: "Gerald the pigeon",
          description:
            "Leo’s balcony pigeon becomes a running character: he judges breakfasts, has standards about coffee, and disappears for a while before coming back in October, “looking older.”",
        },
        {
          title: "Plans and timing",
          description:
            "Restaurants, flights, cinema tickets and who is late for what: the most practical topic in the chat is also the most painful one.",
        },
        {
          title: "Lisbon",
          description:
            "Booked in March, counted down for weeks and remembered as their best days: eleven pastéis de nata, a tram that goes vertically and “I love you here. like this.”",
        },
        {
          title: "Work and shifts",
          description:
            "Emma’s night shifts on the ward and Leo’s pitches and projects decide when they can talk, and lately whether they do.",
        },
        {
          title: "Family and friends",
          description:
            "Jana, who introduced them, a Christmas with Emma’s parents (lemon cake, too much football), and Max with his couch on the night of the cinema.",
        },
      ],
      highlights: [
        "Leo’s very first message: “it’s Leo from Jana’s party. the guy who lost the pineapple pizza argument 🍍”, and Emma’s answer: “you didn’t lose, you gave up.”",
        "On a night shift a patient proposes to Emma. She tells Leo she said she’s taken, worries that was too soon, and he answers: “no. I like it. a lot ❤️”",
        "In Lisbon Emma sends Leo the photos while sitting right next to him, as a “backup”, and he writes: “I love you here. like this.”",
      ],
    },
    Emma: {
      vibe: "Pigeons, Pancakes & Promises",
      summary:
        "Your chat with Leo is a love story told in texts: a lost argument about pineapple pizza, a ramen date, a key, Christmas with your parents and Lisbon, all held together by a pigeon called Gerald. Then the same fight about late and cancelled plans keeps coming back, his replies get shorter, and the chat ends on his message, still waiting for your answer.",
      people: [
        {
          name: "Emma",
          role: "The one who reaches out",
          style:
            "You start most of the conversations, say plainly what you need (“I just want to be a priority sometimes”), and keep the jokes alive even when it’s tense.",
        },
        {
          name: "Leo",
          role: "The warm, busy one",
          style:
            "Funny and tender when he’s present (“I remember everything you tell me”), and lately he writes far less: often one word, often hours later.",
        },
      ],
      dynamics: [
        {
          title: "Who reaches out",
          description:
            "In the first months you two start conversations almost equally. Since August you’ve started nearly four in five, and Leo’s typical reply has gone from a few minutes to about three hours.",
        },
        {
          title: "The same fight, four times",
          description:
            "The dinner on April 9, the Lisbon flight, your birthday toast, the cinema in July: each time a plan slips, you say how it lands and he apologises, until you name it: “this is the same fight again.”",
        },
        {
          title: "Making up with pancakes",
          description:
            "Your repairs have a ritual. After the April fight it’s your “pancakes on sunday?”, and in October Leo reaches back out with the same offer, via Gerald.",
        },
        {
          title: "Humour as glue",
          description:
            "Gerald, the “five more minutes” mornings and the egg at the ramen place keep coming back, and they’re still there when everything else gets quieter.",
        },
      ],
      topics: [
        {
          title: "Gerald the pigeon",
          description:
            "Leo’s balcony pigeon becomes a running character: he judges breakfasts, has standards about coffee, and disappears for a while before coming back in October, “looking older.”",
        },
        {
          title: "Plans and timing",
          description:
            "Restaurants, flights, cinema tickets and who is late for what: the most practical topic in your chat is also the most painful one.",
        },
        {
          title: "Lisbon",
          description:
            "Booked in March, counted down for weeks and remembered as your best days: eleven pastéis de nata, a tram that goes vertically and “I love you here. like this.”",
        },
        {
          title: "Work and shifts",
          description:
            "Your night shifts on the ward and Leo’s pitches and projects decide when you can talk, and lately whether you do.",
        },
        {
          title: "Family and friends",
          description:
            "Jana, who introduced you, Christmas with your parents (lemon cake, too much football), and Max with his couch on the night of the cinema.",
        },
      ],
      highlights: [
        "Leo’s very first message: “it’s Leo from Jana’s party. the guy who lost the pineapple pizza argument 🍍”, and your answer: “you didn’t lose, you gave up.”",
        "On a night shift a patient proposes to you. You tell Leo you said you’re taken, worry that was too soon, and he answers: “no. I like it. a lot ❤️”",
        "In Lisbon you send Leo the photos while sitting right next to him, as a “backup”, and he writes: “I love you here. like this.”",
      ],
    },
    Leo: {
      vibe: "Pigeons, Pancakes & Promises",
      summary:
        "Your chat with Emma is a love story told in texts: a lost argument about pineapple pizza, a ramen date, a key, Christmas with her parents and Lisbon, all held together by your pigeon Gerald. Then the same fight about late and cancelled plans keeps coming back, your replies get shorter, and the chat ends on your own message asking her to talk.",
      people: [
        {
          name: "Leo",
          role: "The warm, busy one",
          style:
            "You’re funny and tender when you’re present (“I remember everything you tell me”), and lately you write far less: often one word, often hours later.",
        },
        {
          name: "Emma",
          role: "The one who reaches out",
          style:
            "She starts most of your conversations, says plainly what she needs (“I just want to be a priority sometimes”), and keeps the jokes going even when it’s tense.",
        },
      ],
      dynamics: [
        {
          title: "Who reaches out",
          description:
            "In the first months you two start conversations almost equally. Since August Emma has started nearly four in five, and your typical reply has gone from a few minutes to about three hours.",
        },
        {
          title: "The same fight, four times",
          description:
            "The dinner on April 9, the Lisbon flight, her birthday toast, the cinema in July: each time one of your plans slips, she says how it lands and you apologise, until she names it: “this is the same fight again.”",
        },
        {
          title: "Making up with pancakes",
          description:
            "Your repairs have a ritual. After the April fight she offers “pancakes on sunday?”, and in October you reach back out with the same offer, via Gerald.",
        },
        {
          title: "Humour as glue",
          description:
            "Gerald, the “five more minutes” mornings and the egg at the ramen place keep coming back, and they’re still there when everything else gets quieter.",
        },
      ],
      topics: [
        {
          title: "Gerald the pigeon",
          description:
            "Your balcony pigeon becomes a running character: he judges breakfasts, has standards about coffee, and disappears for a while before coming back in October, “looking older.”",
        },
        {
          title: "Plans and timing",
          description:
            "Restaurants, flights, cinema tickets and who is late for what: the most practical topic in your chat is also the most painful one.",
        },
        {
          title: "Lisbon",
          description:
            "Booked in March, counted down for weeks and remembered as your best days: eleven pastéis de nata, a tram that goes vertically and “I love you here. like this.”",
        },
        {
          title: "Work and shifts",
          description:
            "Your pitches and projects and Emma’s night shifts on the ward decide when you can talk, and lately whether you do.",
        },
        {
          title: "Family and friends",
          description:
            "Jana, who introduced you, Christmas with Emma’s parents (lemon cake, too much football), and Max with his couch on the night of the cinema.",
        },
      ],
      highlights: [
        "Your very first message: “it’s Leo from Jana’s party. the guy who lost the pineapple pizza argument 🍍”, and Emma’s answer: “you didn’t lose, you gave up.”",
        "On a night shift a patient proposes to Emma. She tells you she said she’s taken, worries that was too soon, and you answer: “no. I like it. a lot ❤️”",
        "In Lisbon Emma sends you the photos while sitting right next to you, as a “backup”, and you write: “I love you here. like this.”",
      ],
    },
  },
  answers: {
    better:
      "The pattern to work on is clear, and it’s fixable: a plan changes, nobody hears about it until it’s late, and the apology arrives after the hurt. On April 9 Emma waited an hour (“you could have texted”), and in June Leo promised exactly that: “I’ll text when I’m running late. like an adult.” Turn that promise into a rule you both keep: the moment a plan wobbles, say so, before the other person is waiting. And say needs out loud instead of testing for them: Emma’s week of not texting first told her something, but “I miss being someone you think about during the day” told Leo far more. His “can we talk tomorrow?” is the opening; go into it with one concrete wish each, not a list.",
    arguments:
      "Neither wins on points, because they’re arguing about different things. Leo argues the circumstances (“the client changed everything again”, “the train really was stuck”, “I’m doing this for us too”), and each of those is true. Emma argues the pattern (“it’s always one meeting”, “it’s not about the train”), and that holds up across four fights. Leo is most convincing when he stops defending and agrees: “you’re right that it’s a pattern. I don’t want it to be.” The strongest line in the whole chat is also the simplest: “I just want to be a priority sometimes.”",
    effort:
      "For the first months it’s an even match: they write a similar amount and start conversations about equally. Since August the balance has tipped: Emma has started nearly four in five conversations, and Leo’s typical reply now takes about three hours instead of a few minutes. Emma notices and says so, first “you just seem far away lately”, then, after a week of deliberately not texting first, “I just miss being someone you think about during the day.” Leo’s effort shows in other places (he moved the Lisbon meeting, made her a key, and he’s the one asking to talk now), but in the chat itself Emma is carrying more of it lately.",
    "into:Emma":
      "Yes, the chat shows real feeling from Leo, even now. He said “I love you” first, made you a key, remembered your yellow flowers and wrote “I love you here. like this” in Lisbon; in October he still reaches out with Gerald and pancakes. What has changed is how much of it reaches you: since August his replies are slower and shorter, and he admits he’s “bad at showing it right now.” His “I’ve been thinking a lot about us lately” could mean several things, so ask him tomorrow what he’s been thinking, and tell him what you need to feel thought of.",
    "into:Leo":
      "Clearly, yes. Emma keeps reaching out even when you go quiet: she starts most of your conversations, asks “are we ok?”, and when she holds back for a week it’s to see whether you’ll come towards her. Her hardest messages are about wanting more of you, not less: “I just want to be a priority sometimes”, “I want you to want to be there.” When you offered pancakes in October, she said yes within minutes. Tomorrow’s talk is your chance to show it goes both ways: bring something concrete, not only an apology.",
    "worried:Emma":
      "Some of it, yes, and you’ve already named it: since August Leo rarely starts a conversation, his typical reply has stretched to about three hours, and in September you went five days without hearing from him. Add the fight that keeps coming back (the dinner, Lisbon, your birthday toast, the cinema) and his “I’ve been thinking a lot about us lately”, and your unease makes sense. But there are good signs too: he admits the pattern (“I don’t want it to be”), blames his workload rather than you, and still comes back with Gerald and pancakes. The chat can’t tell you what he’ll say tomorrow; go in calm, let him say what’s on his mind first, and be clear about what you need.",
    "worried:Leo":
      "Yes, and it’s worth taking seriously before tomorrow. Emma has told you the same thing in many ways (“it’s always something”, “I want you to want to be there”, “I miss being someone you think about during the day”), and four times one of your plans slipped at the last minute. Since August she starts almost every conversation and your typical reply takes about three hours, so from her side the chat has gone quiet. She hasn’t given up: she still asks “are we ok?” and said yes to pancakes within minutes. Whatever you’ve been thinking about “us”, bring one concrete change to the talk you asked for, not only an apology.",
    "gift:Emma":
      "Something that pulls Leo back into your shared world, not something expensive. A small print or figure of a pigeon (Gerald, obviously) would land, especially now that “Gerald is back.” Or make it an experience: a Sunday pancake breakfast that you plan entirely, or a framed photo from Lisbon, the trip where he wrote “I love you here. like this.” He’s been “drowning at work”, so anything that gives him an easy evening with you will count for more than a big surprise.",
    "gift:Leo":
      "Yellow flowers again: she loved that you remembered them on Valentine’s Day. Better still, pair them with something that shows you’ve heard her, like a date in the calendar that you promise not to move, signed with your own line: “I’ll be there at 7:45. not even late.” A framed Lisbon photo would bring back the days she wants to “keep like this”, and a bag of pretzels for her next night shift would make her laugh. Whatever you choose, give it after tomorrow’s talk, not instead of it.",
  },
  coach: {
    plans:
      "Because work keeps winning the last-minute decisions, and the news arrives late. The dinner on April 9, the Lisbon morning, the birthday toast and the cinema in July all follow the same shape: a plan is set, something comes up for Leo, and Emma finds out when she’s already waiting. Each apology is sincere (“I hate when we end the day like this”, “I mean it this time”), but the habit underneath doesn’t change, which is why it feels like the same fight every time. One small rule would break the shape: a message the moment a plan is at risk, and one evening a week that neither of you moves.",
    distance:
      "Probably both, and the chat can’t fully separate them. He told you the new project would be intense until October and says he’s “drowning at work”, which is stress. But the drop goes beyond work hours: since August he rarely starts a conversation, often answers in one word, and in September you went five days without a message from him. He still reaches back (Gerald, pancakes, “I’m right here”), so he hasn’t checked out; ask him tomorrow what’s been on his mind, and whether the project is the whole story.",
    talk: "Start by making it easy for him to be honest: “I’m glad you want to talk. Tell me what’s been on your mind, and then I’d like to tell you what’s been on mine.” Let him go first, since he asked, and hear him out before you answer. When it’s your turn, name one or two things, concretely: you want to hear from him when a plan changes, and you want to feel thought of during the day. Leave “always” and “never” out of it; you’ll both hear the specifics better.",
    breakup:
      "Ok, tomorrow works. Honestly, that message made me nervous. Can you tell me roughly what it’s about, or is it something we should only talk about in person?\n\n{why} Your draft jumps to the worst case and dares him to say it, which makes an honest answer harder. This keeps your feeling in it (“nervous”) and asks for what you actually want to know, without accusing him of something he hasn’t said.",
    cancel:
      "I’ve felt like the one holding our plans together lately, and when they fall through it really hurts. Can we talk about how we both protect our time together?\n\n{why} “Always” and “I’m done” invite him to defend himself instead of listening. This says the same thing (the plans, the effort, the hurt) in a way he can answer, and points at what you want next.",
  },
};
