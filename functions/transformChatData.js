import { chatColors, hexToRgbA } from "~/functions/colors";
import stopwords_de from "stopwords-de";
import stopwords from "stopwords-en";
import { onlyEmoji } from "emoji-aware";
import * as moment from "moment";

export class Chat {
  static removeSystemMessages(chatObject) {
    // remove the first message with slice ("this chat is encrypted") and all system messages via the filter.
    return chatObject
      .filter((message) => message.author.toLowerCase() !== "system")
      .slice(1);
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

  static match_emojys(chat_distribution, terminationCondition = 3) {
    let mostUsedEmojis = new Set();
    const regexpEmojiPresentation = /\p{Emoji_Presentation}/gu;
    for (let entry of chat_distribution) {
      if (mostUsedEmojis.size === terminationCondition) {
        return mostUsedEmojis;
      }
      let emojis = onlyEmoji(entry[0]);
      if (emojis.length !== 0 && emojis[0].match(regexpEmojiPresentation)) {
        mostUsedEmojis.add(emojis[0]);
      }
    }
    return mostUsedEmojis;
  }

  static get_longest_message(chat_object) {
    let max_value = 0;
    chat_object.forEach((chat_line) => {
      const cur_length = chat_line.message.split(" ").length;
      if (max_value < cur_length) {
        max_value = cur_length;
      }
    });
    return max_value;
  }

  // creates a sorted FreqArray for the chat corpus [{word: 10},{hi:9},...]
  static createSortedFreqDict(chatObject) {
    let message_string = chatObject.reduce(
      (n, { message }) => n + " " + message,
      " "
    );
    message_string = message_string.replace(/\u200E/gi, "");
    let message_array = message_string.replace(/\n/g, " ").split(" ");
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

  constructor(chatObject = [], groupAfter = 9, maxWordsWordCloud = 150) {
    // this one is the complete input
    this.chatObject = chatObject;

    // for groupmessages we probably want to group after some time
    this._groupAfter = groupAfter;
    // max number of words shown in word cloud
    this._maxWordsWordCloud = maxWordsWordCloud;
    // here we remove messages (i.e. system messages)
    this.filterdChatObject = Chat.removeSystemMessages(this.chatObject);
    //number of persons in chat
    const messagesTemp = Object.entries(
      Chat.getMessagesPerPerson(this.filterdChatObject)
    );
    this.numPersonsInChat = messagesTemp.length;
    // All persons
    this.personColorMap = {};
    messagesTemp.forEach((item, idx) => {
      this.personColorMap[item[0]] = chatColors[idx % chatColors.length];
    });

    // frequencies for all words in chat (excluding system)
    this._sortedFreqList = null;
    // here we have the messages per person, also adding colors to them
    this._messagesPerPerson = null;

    // all dates of messages
    this._dates = null;

    this.__reload();
  }

  __reload() {
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
    this._sortedFreqList = Chat.createSortedFreqDict(this.chatObject);
    return this._sortedFreqList;
  }

  get groupAfter() {
    return this._groupAfter;
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
          color: this.personColorMap[person[0]],
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
    this._dates = this.filterdChatObject.map((message) => message.date);
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
      let personalFreqDic = Chat.createSortedFreqDict(person.messages);

      let uniqueWords = Chat.uniqueWords(personalFreqDic).length;
      let sortedEmojis = Chat.match_emojys(personalFreqDic, 3);
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
      labels: moment.weekdays(),
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
      labels: moment.months(),
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
    let getDaysArray = function (s, e) {
      let initDateDict = {};
      for (let m = moment(s); m.isBefore(e); m.add(1, "days")) {
        initDateDict[m.format("YYYY-MM-DD")] = 0;
      }
      return initDateDict;
    };
    function arrayMin(arr) {
      var len = arr.length,
        min = Infinity;
      while (len--) {
        if (arr[len] < min) {
          min = arr[len];
        }
      }
      return min;
    }

    function arrayMax(arr) {
      var len = arr.length,
        max = -Infinity;
      while (len--) {
        if (arr[len] > max) {
          max = arr[len];
        }
      }
      return max;
    }

    const minDate = new Date(arrayMin(this.dates));
    const maxDate = new Date(arrayMax(this.dates));
    let daysDict = getDaysArray(minDate, maxDate);
    this.filterdChatObject.map((message) => {
      daysDict[moment(message.date).format("YYYY-MM-DD")] += 1;
    });
    return {
      labels: Object.keys(daysDict),
      datasets: [
        {
          data: Object.values(daysDict),
          borderWidth: 1,
          lineTension: 0,
          pointRadius: 0,
          pointHitRadius: 2,
          backgroundColor: hexToRgbA("#EF5350"),
          borderColor: hexToRgbA("#B71C1C", [1]),
        },
      ],
    };
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
              "<attached:",
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
