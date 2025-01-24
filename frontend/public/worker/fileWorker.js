importScripts('https://cdn.jsdelivr.net/npm/jszip/dist/jszip.min.js');
importScripts('https://cdn.jsdelivr.net/npm/whatsapp-chat-parser@4.0.2/dist/index.global.js');

const readFile = async (file) => {
    const results = [];

    if (file.name.endsWith('.zip')) {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        for (const fileName of Object.keys(zip.files)) {
            const entry = zip.files[fileName];

            if (!entry.dir && fileName.endsWith('.txt') && !fileName.includes('__MACOSX/')) {
                return await entry.async('text');
            }
        }
    }
    if (file.type === 'text/plain') {
        return await file.text();
    }

    throw new Error('Unsupported file type');
}

// Filter out all messages with author === null
function filterValidMessages(messages) {
    return messages.filter(msg => msg.author !== null);
}

function getMostUsedEmojis(messages) {
    // Simple emoji regex (covers many, but not all)
    const emojiRegex = /\p{Extended_Pictographic}/gu;

    // Global stats
    const globalEmojiCountMap = new Map();
    let globalMaxEmojiCount = 0;
    let globalMessageWithMostEmojis = null;

    // Per-author stats
    // authorEmojiData[author] = {
    //   emojiCountMap: Map<emoji, count>,
    //   maxEmojiCount: number,
    //   messageWithMostEmojis: messageObj
    // }
    const authorEmojiData = {};

    for (let i = 0; i < messages.length; i++) {
        const {author, message} = messages[i];
        // If this is the first time we see the author, init
        if (!authorEmojiData[author]) {
            authorEmojiData[author] = {
                emojiCountMap: new Map(),
                maxEmojiCount: 0,
                messageWithMostEmojis: null
            };
        }

        const emojis = message.match(emojiRegex);
        if (!emojis) continue;

        // Update global usage
        for (let j = 0; j < emojis.length; j++) {
            const e = emojis[j];
            globalEmojiCountMap.set(e, (globalEmojiCountMap.get(e) || 0) + 1);
        }

        // Update author usage
        const authorMap = authorEmojiData[author].emojiCountMap;
        for (let j = 0; j < emojis.length; j++) {
            const e = emojis[j];
            authorMap.set(e, (authorMap.get(e) || 0) + 1);
        }

        // Check if this is the new global max
        if (emojis.length > globalMaxEmojiCount) {
            globalMaxEmojiCount = emojis.length;
            globalMessageWithMostEmojis = messages[i];
        }

        // Check if this is the new author max
        if (emojis.length > authorEmojiData[author].maxEmojiCount) {
            authorEmojiData[author].maxEmojiCount = emojis.length;
            authorEmojiData[author].messageWithMostEmojis = messages[i];
        }
    }

    // Now compute the top 5 emojis for each author
    const authors = {};
    for (const author in authorEmojiData) {
        const {emojiCountMap, messageWithMostEmojis} = authorEmojiData[author];

        // Sort by count desc
        const sorted = [...emojiCountMap.entries()].sort((a, b) => b[1] - a[1]);
        const top5Emojis = sorted.slice(0, 5).map(([emoji, count]) => ({emoji, count}));

        authors[author] = {
            top5Emojis,
            messageWithMostEmojis
        };
    }

    // Global top 5
    const sortedGlobal = [...globalEmojiCountMap.entries()].sort((a, b) => b[1] - a[1]);
    const globalTop5Emojis = sortedGlobal.slice(0, 5).map(([emoji, count]) => ({emoji, count}));

    return {
        authors,
        globalTop5Emojis,
        globalMessageWithMostEmojis
    };
}

function getNumberOfMessagesPerMonth(messages) {
    // Structure: { [author: string]: { [yearMonth: string]: number } }
    const result = {};

    for (let i = 0; i < messages.length; i++) {
        const {author, date} = messages[i];

        const d = new Date(date);
        // Create a simple key for year-month
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;

        if (!result[author]) {
            result[author] = {};
        }

        if (!result[author][key]) {
            result[author][key] = 0;
        }
        result[author][key]++;
    }

    return result;
}


// Example set of stopwords you can adjust as necessary.
const STOP_WORDS = new Set([
    "<media",
    "<attached",
    "audio",
    "omitted>",
    "bild",
    "image",
    "<medien",
    "ausgeschlossen>",
    "weggelassen",
    "omitted",
    "_",
    "_weggelassen>",
    "_ommited>",
    "_omesso>",
    "_omitted",
    "_weggelassen",
    "_attached",
]);

function getRelativeWordUsage(messages) {
    const totalMessages = messages.length;
    let globalLongestMessage = null;
    let globalLongestLength = 0;

    let totalWordCount = 0;

    // For global top words
    const globalWordFreq = new Map();

    // Per-author stats
    // Structure:
    // authorStats[author] = {
    //   messageCount: number,
    //   wordCount: number,
    //   freqMap: Map<word, count>,
    //   longestMessage: { length, messageObject }
    // }
    const authorStats = {};

    for (let i = 0; i < messages.length; i++) {
        const msgObj = messages[i];
        const {author, message} = msgObj;
        const length = message.length;

        // Initialize if first time we see this author
        if (!authorStats[author]) {
            authorStats[author] = {
                messageCount: 0,
                wordCount: 0,
                freqMap: new Map(),
                longestMessage: {
                    length: 0,
                    messageObject: null
                }
            };
        }

        // Update author's message count
        authorStats[author].messageCount++;

        // Track longest message overall
        if (length > globalLongestLength) {
            globalLongestLength = length;
            globalLongestMessage = msgObj;
        }

        // Track author's longest message
        if (length > authorStats[author].longestMessage.length) {
            authorStats[author].longestMessage.length = length;
            authorStats[author].longestMessage.messageObject = msgObj;
        }

        // Split into words
        const words = message
            .toLowerCase()
            .split(/[^a-zA-Z0-9äöüÄÖÜß]+/) // adjust as needed
            .filter(Boolean);

        const wordCount = words.length;
        authorStats[author].wordCount += wordCount;
        totalWordCount += wordCount;

        // Update global freq map & author's freq map
        for (let w = 0; w < words.length; w++) {
            const word = words[w];
            if (!STOP_WORDS.has(word)) {
                // global
                globalWordFreq.set(word, (globalWordFreq.get(word) || 0) + 1);
                // author
                const authorMap = authorStats[author].freqMap;
                authorMap.set(word, (authorMap.get(word) || 0) + 1);
            }
        }
    }

    // Prepare final data structure
    // 1) Compute top 5 words for each author
    // 2) Compute relative share of words & messages for each author
    const resultByAuthor = {};

    for (const author in authorStats) {
        const {messageCount, wordCount, freqMap, longestMessage} = authorStats[author];

        // Sort freqMap to get top 5 for this author
        const sortedAuthorWords = [...freqMap.entries()].sort((a, b) => b[1] - a[1]);
        const top5Words = sortedAuthorWords.slice(0, 5).map(([word, count]) => ({word, count}));

        // Relative usage
        const relativeWords = totalWordCount === 0 ? 0 : (wordCount / totalWordCount);
        const relativeMessages = totalMessages === 0 ? 0 : (messageCount / totalMessages);

        resultByAuthor[author] = {
            top5Words,
            longestMessage: longestMessage.messageObject,
            relativeWords,       // fraction of total words in conversation
            relativeMessages     // fraction of total messages in conversation
        };
    }

    // Also compute global top 5 words
    const sortedGlobalWords = [...globalWordFreq.entries()].sort((a, b) => b[1] - a[1]);
    const globalTop5Words = sortedGlobalWords.slice(0, 5).map(([word, count]) => ({word, count}));

    return {
        authors: resultByAuthor,
        globalLongestMessage, // the longest among all authors
        globalTop5Words
    };
}


function getTimeData(messages) {
    // Sort by date ascending
    const sortedByDate = [...messages].sort((a, b) => new Date(a.date) - new Date(b.date));

    let longestGap = 0;
    let longestGapStart = null;
    let longestGapEnd = null;

    for (let i = 0; i < sortedByDate.length; i++) {
        const {message} = sortedByDate[i];


        // Check time gaps
        if (i > 0) {
            const prevDate = new Date(sortedByDate[i - 1].date);
            const currentDate = new Date(sortedByDate[i].date);
            const gap = currentDate - prevDate; // in ms
            if (gap > longestGap) {
                longestGap = gap;
                longestGapStart = prevDate;
                longestGapEnd = currentDate;
            }
        }
    }

    return {
        longestGap,        // in milliseconds
        longestGapStart,   // Date object
        longestGapEnd      // Date object
    };
}

function getISOWeekNumber(dateObj) {
    // This formula calculates the ISO week number for a given date.
    // Alternatively, you can use a library like date-fns.
    const temp = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
    // Thursday in current week decides the year
    temp.setUTCDate(temp.getUTCDate() + 4 - (temp.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
    return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getActiveDates(messages) {
    const dayCount = {};  // { dayKey: number }
    const weekCount = {}; // { weekKey: number }

    for (let i = 0; i < messages.length; i++) {
        const d = new Date(messages[i].date);

        // Day key
        const dayKey = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
        dayCount[dayKey] = (dayCount[dayKey] || 0) + 1;

        // ISO week key
        const weekKey = getISOWeekNumber(d);
        weekCount[weekKey] = (weekCount[weekKey] || 0) + 1;
    }

    // Find day with max messages
    let maxDay = null;
    let maxDayCount = 0;
    for (const day in dayCount) {
        if (dayCount[day] > maxDayCount) {
            maxDayCount = dayCount[day];
            maxDay = day;
        }
    }

    // Find week with max messages
    let maxWeek = null;
    let maxWeekCount = 0;
    for (const week in weekCount) {
        if (weekCount[week] > maxWeekCount) {
            maxWeekCount = weekCount[week];
            maxWeek = week;
        }
    }

    return {
        dayWithMostMessages: {day: maxDay, count: maxDayCount},
        weekWithMostMessages: {week: maxWeek, count: maxWeekCount}
    };
}


self.addEventListener('message', async (event) => {
    const {file} = event.data;

    self.postMessage({state: 'WORKING'});

    try {
        const textData = await readFile(file);
        const messages = whatsappChatParser.parseString(textData, {
            parseAttachments: true,
        });

        const validMessages = filterValidMessages(messages);

        const emoji = getMostUsedEmojis(validMessages);
        const messagesPerMonth = getNumberOfMessagesPerMonth(validMessages);
        const wordUsage = getRelativeWordUsage(validMessages)
        const time = getTimeData(messages)
        const active = getActiveDates(messages);
        // TODO: anzahl der Bilder, Videos

        const stats = {emoji, messagesPerMonth, wordUsage, time, active};
        self.postMessage({response: {data: stats}, state: "DONE"});
    } catch (error) {
        self.postMessage({response: {message: error.message}, state: 'ERROR'});
    }
});
