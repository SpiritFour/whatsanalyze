import { chatColors, hexToRgbA } from "~/functions/colors";
import stopwords_de from "stopwords-de";
import stopwords from "stopwords-en";

export class Chat {
  static removeSystemMessages(chatObject) {
    // remove the first message with slice ("this chat is encrypted") and all system messages via the filter.
    return chatObject
      .slice(1)
      .filter((message) => message.author.toLowerCase() !== "system");
  }

  static groupBy(chatObject, key) {
    return chatObject.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  }

  static getTotalNumberOfWords(chatObject) {
    return chatObject.reduce(
      (n, { message }) => n + message.split(" ").length,
      0
    );
  }

  // Find hapax legomenons, a word or an expression that occurs only once within the context.
  static uniqueWords(chat_distribution) {
    function singleOccurrence(value) {
      return value[1] === 1;
    }
    return chat_distribution.filter(singleOccurrence);
  }

  static match_emojies(chat_distribution) {
    const regexpEmojiPresentation = /\p{Emoji_Presentation}/gu;
    function isEmoji(value) {
      return value[0].match(regexpEmojiPresentation);
    }

    return chat_distribution.filter(isEmoji);
  }

  static get_longest_message(chat_object) {
    return Math.max(
      ...chat_object.map((object) => object.message.split(" ").length)
    );
  }

  // creates a sorted FreqArray for the chat corpus [{word: 10},{hi:9},...]
  static createSortedFreqArray(chatObject) {
    let message_string = chatObject.reduce(
      (n, { message }) => n + " " + message,
      " "
    );
    message_string = message_string.replace(/\u200E/gi, "");
    let message_array = message_string.replace(/\n/g, " ").split(" ");
    let filtered_message_array = [];

    const regexpEmojiPresentation = /\p{Emoji_Presentation}/gu;

    message_array.map(function (item) {
      const words = item
        .split(regexpEmojiPresentation)
        .filter(function isNotEmpty(i) {
          return i.length > 0;
        });
      const emojies = item.match(regexpEmojiPresentation);
      filtered_message_array.push(...words, ...emojies);
    });

    let distribution = {};

    message_array.map(function (item) {
      distribution[item] = (distribution[item] || 0) + 1;
    });

    let sorted_distribution = Object.entries(distribution).sort(
      (a, b) => b[1] - a[1]
    );
    return sorted_distribution;
  }

  static toDayDates(chatObject) {
    return chatObject.map((message) => message.date.setHours(0, 0, 0, 0));
  }

  static getDaysBetween(start, end) {
    for (
      var a = [], d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      a.push(new Date(d));
    }
    return a;
  }

  static getMessagesPerPerson(chatObject) {
    return this.groupBy(chatObject, "author");
  }

  static hourlyDataFromChat(messages) {
    let hours = new Array(24).fill(0);
    messages.map((message) => {
      hours[message.date.getHours()] += 1;
    });
    return hours;
  }

  static dailyDataFromChat(messages) {
    let hours = new Array(7).fill(0);
    messages.map((message) => {
      hours[message.date.getDay()] += 1;
    });
    return hours;
  }

  static weeklyDataFromChat(messages) {
    let hours = new Array(12).fill(0);
    messages.map((message) => {
      hours[message.date.getMonth()] += 1;
    });
    return hours;
  }

  constructor(chatObject = [], groupAfter = 9, maxWordsWordCloud = 200) {
    // this one is the complete input
    this.chatObject = chatObject;
    // for groupmessages we probably want to group after some time
    this._groupAfter = groupAfter;
    // max number of words shown in word cloud
    this._maxWordsWordCloud = maxWordsWordCloud;
    // here we remove messages (i.e. system messages)
    this.filterdChatObject = Chat.removeSystemMessages(chatObject);
    //number of persons in chat
    this.numPersonsInChat = Object.entries(
      Chat.getMessagesPerPerson(this.filterdChatObject)
    ).length;
    // frequencies for all words in chat (excluding system)
    this._sortedFreqList = null;
    // here we have the messages per person, also adding colors to them
    this._messagesPerPerson = null;

    // all dates of messages
    this._dates = null;

    this._lineGraphData = Promise.resolve(this._getLineGraphData());
    this._funfacts = Promise.resolve(this._getFunFacts());
    this._allWords = Promise.resolve(this._getAllWords());
    this._hourlyData = Promise.resolve(this._getHourlyData());
    this._dailyData = Promise.resolve(this._getDailyData());
    this._weeklyData = Promise.resolve(this._getWeeklyData());
    this._shareOfSpeech = Promise.resolve(this._getShareOfSpeech());
  }

  get sortedFreqDict() {
    if (this._sortedFreqList) return this._sortedFreqList;
    this._sortedFreqList = Chat.createSortedFreqArray(this.chatObject);
    return this._sortedFreqList;
  }

  get messagesPerPerson() {
    if (this._messagesPerPerson) return this._messagesPerPerson;
    this._messagesPerPerson = this._getMessagesPerPerson();
    return this._messagesPerPerson;
  }

  set groupAfter(groupAfter) {
    this._groupAfter = groupAfter;
    this._messagesPerPerson = null;

    this._lineGraphData = Promise.resolve(this._getLineGraphData());
    this._funfacts = Promise.resolve(this._getFunFacts());
    // this._allWords = Promise.resolve(this._getAllWords());
    this._hourlyData = Promise.resolve(this._getHourlyData());
    this._dailyData = Promise.resolve(this._getDailyData());
    this._weeklyData = Promise.resolve(this._getWeeklyData());
    this._shareOfSpeech = Promise.resolve(this._getShareOfSpeech());
  }

  _getMessagesPerPerson() {
    let persons = Object.entries(
      Chat.getMessagesPerPerson(this.filterdChatObject)
    );
    persons = persons.sort((a, b) => b[1].length - a[1].length);

    let enrichedPersons = [];

    let grouped = false;

    persons.forEach((person, idx) => {
      if (idx > this._groupAfter) {
        enrichedPersons[this._groupAfter].messages = enrichedPersons[
          this._groupAfter
        ].messages.concat(person[1]);
        grouped = true;
      } else {
        enrichedPersons.push({
          name: person[0],
          color: chatColors[idx % chatColors.length],
          messages: person[1].sort((a, b) => a.date - b.date),
        });
      }
    });

    if (grouped) {
      enrichedPersons[this._groupAfter].name = "Others";
      enrichedPersons[this._groupAfter].color = "#D3D3D3";
      enrichedPersons[this._groupAfter].messages.sort(
        (a, b) => a.absolute_id - b.absolute_id
      );
    }

    return enrichedPersons;
  }

  get dates() {
    if (this._dates) return this._dates;
    this._dates = this.chatObject.map((message) => message.date);
    return this._dates;
  }

  _getShareOfSpeech(opacity = 1) {
    return {
      labels: this.messagesPerPerson.map((person) => person.name),
      datasets: [
        {
          label: "Share of Speech",
          backgroundColor: this.messagesPerPerson.map((person) =>
            hexToRgbA(person.color, opacity)
          ),
          borderColor: this.messagesPerPerson.map((person) => person.color),
          data: this.messagesPerPerson.map((person) => person.messages.length),
        },
      ],
    };
  }

  getShareOfSpeech() {
    return this._shareOfSpeech;
  }

  _getFunFacts() {
    let people = this.messagesPerPerson.map((person) => {
      let name = person.name;
      let numberOfWords = Chat.getTotalNumberOfWords(person.messages);
      let longestMessage = Chat.get_longest_message(person.messages);
      let personalFreqArray = Chat.createSortedFreqArray(person.messages);

      let uniqueWords = Chat.uniqueWords(personalFreqArray).length;

      let sortedEmojis = Chat.match_emojies(personalFreqArray)
        .map((emoji) => emoji[0])
        .slice(0, 3);
      let averageMessageLength = numberOfWords / person.messages.length;
      return {
        color: person.color,
        name: name,
        numberOfWords: numberOfWords,
        longestMessage: longestMessage,
        uniqueWords: uniqueWords,
        sortedEmojis: sortedEmojis,
        averageMessageLength: Math.round(averageMessageLength),
      };
    });
    return people;
  }

  getFunFacts() {
    return this._funfacts;
  }

  _getHourlyData(opacity = 1) {
    return {
      labels: [
        "0AM",
        "1AM",
        "2AM",
        "3AM",
        "4AM",
        "5AM",
        "6AM",
        "7AM",
        "8AM",
        "9AM",
        "10AM",
        "11AM",
        "12PM",
        "1PM",
        "2PM",
        "3PM",
        "4PM",
        "5PM",
        "6PM",
        "7PM",
        "8PM",
        "9PM",
        "10PM",
        "11PM",
      ],
      datasets: this.messagesPerPerson.map((person) => {
        return {
          label: person.name,
          backgroundColor: hexToRgbA(person.color, opacity),
          borderColor: person.color,
          data: Chat.hourlyDataFromChat(person.messages),
        };
      }),
    };
  }

  getHourlyData() {
    return this._hourlyData;
  }

  _getDailyData(opacity = 1) {
    return {
      labels: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      datasets: this.messagesPerPerson.map((person) => {
        return {
          label: person.name,
          backgroundColor: hexToRgbA(person.color, opacity),
          borderColor: person.color,
          data: Chat.dailyDataFromChat(person.messages),
        };
      }),
    };
  }

  getDailyData() {
    return this._dailyData;
  }

  _getWeeklyData(opacity = 1) {
    return {
      labels: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      datasets: this.messagesPerPerson.map((person) => {
        return {
          label: person.name,
          backgroundColor: hexToRgbA(person.color, opacity),
          borderColor: person.color,
          data: Chat.weeklyDataFromChat(person.messages),
        };
      }),
    };
  }

  getWeeklyData() {
    return this._weeklyData;
  }

  _getLineGraphData() {
    // calculate date ranges where messages happened
    var minDate = new Date(Math.min.apply(null, this.dates));
    var maxDate = new Date(Math.max.apply(null, this.dates));

    // iterate over persons
    var datasets = this.messagesPerPerson.map((person) => {
      var hist_info = {};

      function _addDayCount(message) {
        const oneDayInMS = 24 * 60 * 60 * 1000;

        // we group for one day -> set to mid day
        var currDate = new Date(message.date);
        currDate.setHours(12, 0, 0, 0);

        var prevDate = new Date(currDate.getTime() - oneDayInMS);
        if (prevDate > minDate) {
          hist_info[prevDate] = hist_info[prevDate] || 0;
        }

        hist_info[currDate] = (hist_info[currDate] || 0) + 1;

        var nextDate = new Date(currDate.getTime() + oneDayInMS);
        if (nextDate < maxDate) {
          hist_info[nextDate] = hist_info[nextDate] || 0;
        }
      }

      person.messages.forEach(_addDayCount);

      return {
        borderWidth: 2,
        lineTension: 0,
        pointRadius: 1,
        pointHitRadius: 5,
        label: person.name,
        backgroundColor: hexToRgbA(person.color),
        borderColor: person.color,
        data: Object.entries(hist_info).map((entry) => {
          return { x: entry[0], y: entry[1] };
        }),
      };
    });

    return [
      {
        datasets: datasets,
      },
      this.getLineGraphXAxis(maxDate, minDate),
    ];
  }

  getLineGraphData() {
    return this._lineGraphData;
  }

  getLineGraphXAxis(maxDate, minDate) {
    var diffDate = new Date(maxDate - minDate);
    var unit = "";
    if (diffDate.getFullYear() > 1971) unit = "year";
    else if (diffDate.getFullYear() > 1970 && diffDate.getMonth() > 0)
      unit = "month";
    else unit = "day";
    return unit;
  }

  _getAllWords() {
    return this.sortedFreqDict
      .filter(
        (word) =>
          !(
            stopwords_de.includes(word[0].toLowerCase()) ||
            stopwords.includes(word[0].toLowerCase()) ||
            [
              "",
              "ich",
              "du",
              "wir",
              "aber",
              "<media",
              "omitted>",
              "bild",
              "image",
              "weggelassen",
              "omitted",
            ].includes(word[0].toLowerCase())
          ) && word[1] > 1
      )
      .map((word) => {
        return { word: word[0], freq: word[1] };
      });
  }

  getAllWords() {
    return this._allWords.then((x) => x.slice(0, this._maxWordsWordCloud));
  }
}
