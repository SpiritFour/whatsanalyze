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

const analyzeFile = async (textData) => {

    return {messages}
}

// Filter out all messages with author === null
function filterValidMessages(messages) {
    return messages.filter(msg => msg.author !== null);
}

function getMostUsedEmojis(messages) {
    // Simple emoji regex (covers many, but not all possible emojis)
    // For production, you might need a more robust approach.
    const emojiRegex = /\p{Extended_Pictographic}/gu;

    const emojiCountMap = new Map(); // Map<emoji, count>
    let maxEmojiCount = 0;
    let messageWithMostEmojis = null;

    for (let i = 0; i < messages.length; i++) {
        const {message} = messages[i];
        // Match all emojis in the current message
        const emojis = message.match(emojiRegex);
        if (!emojis) continue;

        // Update total usage for each emoji
        for (let j = 0; j < emojis.length; j++) {
            const e = emojis[j];
            emojiCountMap.set(e, (emojiCountMap.get(e) || 0) + 1);
        }

        // Track message with the most emojis
        if (emojis.length > maxEmojiCount) {
            maxEmojiCount = emojis.length;
            messageWithMostEmojis = messages[i];
        }
    }

    // Convert map to array of [emoji, count] and sort by count desc
    const sorted = [...emojiCountMap.entries()].sort((a, b) => b[1] - a[1]);
    const top3Emojis = sorted.slice(0, 3).map(item => ({emoji: item[0], count: item[1]}));

    return {
        top3Emojis,
        messageWithMostEmojis
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
    'the', 'a', 'an', 'to', 'and', 'in', 'that', 'it', 'of', 'is',
    'you', 'for', 'on', 'with', 'as', 'was', 'are', 'this', 'i',
    // add more stopwords if needed
]);

function getRelativeWordUsage(messages) {
    const wordCountByAuthor = {};
    let totalWordCount = 0;

    let longestMessage = null;
    let maxLength = 0;

    const globalWordFreq = new Map(); // Map<word, count>

    for (let i = 0; i < messages.length; i++) {
        const {author, message} = messages[i];
        const length = message.length;

        // Track longest message
        if (length > maxLength) {
            maxLength = length;
            longestMessage = messages[i];
        }

        // Split message into words by non-alphanumeric characters
        // or something more sophisticated if needed
        const words = message
            .toLowerCase()
            .split(/[^a-zA-Z0-9äöüÄÖÜß]+/) // adjust for your locale
            .filter(Boolean);

        // Count words for each author
        if (!wordCountByAuthor[author]) {
            wordCountByAuthor[author] = 0;
        }
        wordCountByAuthor[author] += words.length;
        totalWordCount += words.length;

        // Update global frequency map (excluding stopwords)
        for (let w = 0; w < words.length; w++) {
            const word = words[w];
            if (!STOP_WORDS.has(word)) {
                globalWordFreq.set(word, (globalWordFreq.get(word) || 0) + 1);
            }
        }
    }

    // Calculate relative usage
    const relativeUsage = {};
    for (const author in wordCountByAuthor) {
        if (totalWordCount === 0) {
            relativeUsage[author] = 0;
        } else {
            relativeUsage[author] = wordCountByAuthor[author] / totalWordCount;
        }
    }

    // Get top 3 words from globalWordFreq
    const sortedWords = [...globalWordFreq.entries()].sort((a, b) => b[1] - a[1]);
    const top3Words = sortedWords.slice(0, 3).map(([word, count]) => ({word, count}));

    return {
        relativeUsage,    // e.g. { "John Doe": 0.7, "Jane Doe": 0.3 }
        longestMessage,   // message object with the longest character length
        top3Words
    };
}


function getTimeData(messages) {

    // Sort by date ascending
    const sortedByDate = [...messages].sort((a, b) => new Date(a.date) - new Date(b.date));

    let longestGap = 0;

    for (let i = 0; i < sortedByDate.length; i++) {
        // Check time gaps
        if (i > 0) {
            const prevDate = new Date(sortedByDate[i - 1].date);
            const currentDate = new Date(sortedByDate[i].date);
            const gap = currentDate - prevDate; // in ms
            if (gap > longestGap) {
                longestGap = gap;
            }
        }
    }

    return {
        longestGap // in milliseconds
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
        const messages = whatsappChatParser.parseString(textData);

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
