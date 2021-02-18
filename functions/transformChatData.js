import { chatColors } from "~/functions/colors";

export class Chat {
  static remove_named_messages(chatObject, name = "system") {
    return chatObject.filter(
      (message) => message.author.toLowerCase() !== name
    );
  }

  static groupBy(chatObject, key) {
    return chatObject.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  }

  static getTotalNumberOfWords(chatObject) {
    return chatObject.reduce((n, { message }) => n + message.length, 0);
  }

  // Find hapax legomenons, a word or an expression that occurs only once within the context.
  static getUniqueWords(chatObject) {
    const messageString = chatObject.reduce(
      (n, { message }) => n + " " + message,
      " "
    );
    let messageArray = messageString.replace(/\n/g, " ").split(" ");
    let distribution = {};
    messageArray.map(function (item) {
      distribution[item] = (distribution[item] || 0) + 1;
    });
    return { fix: 1 };
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
      a.push(new Date(d).toDateString());
    }
    return a;
  }

  static getMessagesPerPerson(chatObject) {
    return this.groupBy(chatObject, "author");
  }

  static getFunFacts(chatObject) {
    let numberOfWords = Chat.getTotalNumberOfWords(chatObject);
    let uniqueWords = Chat.getUniqueWords(chatObject);
    console.log(Object.keys(uniqueWords), numberOfWords);
    return {
      labels: ["UnFun Facts"],
      datasets: [
        {
          label: "Unique words used in this chat",
          backgroundColor: "rgba(255, 99, 132, 1)",
          borderColor: "rgba(255, 99, 132, 0.1)",
          data: [Object.keys(uniqueWords).length],
        },
        {
          label: "Total Number of Words you typed",
          backgroundColor: "rgba(75, 192, 192, 1)",
          data: [numberOfWords],
        },
        {
          // image of smiley
          label: "You are a cry baby, most used smiley",
          backgroundColor: "rgba(75, 192, 192, 1)",
          data: [100],
        },
      ],
    };
  }

  static getLineGraphData(messagesByPerson, dates) {
    // calculate date ranges where messages happened
    var minDate = new Date(Math.min.apply(null, dates));
    var maxDate = new Date(Math.max.apply(null, dates));

    var x_axis = this.getDaysBetween(minDate, maxDate);

    // iterate over persons
    var datasets = Object.keys(messagesByPerson).map((person) => {
      // this is the x axis with values to plot the graph with
      var hist_info = new Array(x_axis.length).fill(0);
      // now count messages per day
      messagesByPerson[person].forEach(
        (message) =>
          (hist_info[x_axis.indexOf(message.date.toDateString())] += 1)
      );
      return {
        label: person,
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        borderColor: "rgb(255,99,132)",
        data: hist_info,
      };
    });

    return {
      labels: x_axis,
      datasets: datasets,
    };
  }

  static hourlyDataFromChat(messages) {
    let hours = new Array(24).fill(0);
    messages.map((message) => {
      hours[message.date.getHours()] += 1;
    });
    return hours;
  }

  constructor(chatObject = []) {
    // this one is the complete input
    this.chatObject = chatObject;
    // here we remove messages (i.e. system messages)
    this.filterdChatObject = Chat.remove_named_messages(chatObject);
    // frequencies for all words in chat (excluding system)
    this._sortedFreqList = null;
    // here we have the messages per person, also adding colors to them
    this._messagesPerPerson = null;
  }

  get sortedFreqDict() {
    if (this._sortedFreqList) return this._sortedFreqList;
    this._sortedFreqList = this._getSortedFreqDict();
    return this._sortedFreqList;
  }

  _getSortedFreqDict() {
    return null;
  }

  get messagesPerPerson() {
    if (this._messagesPerPerson) return this._messagesPerPerson;
    this._messagesPerPerson = this._getMessagesPerPerson();
    return this._messagesPerPerson;
  }

  _getMessagesPerPerson() {
    let persons = Chat.getMessagesPerPerson(this.filterdChatObject);
    let enrichedPersons = [];
    Object.keys(persons).map((name, idx) => {
      enrichedPersons.push({
        name: name,
        color: chatColors[idx % chatColors.length],
        messages: persons[name],
      });
    });
    return enrichedPersons;
  }

  getShareOfSpeech() {
    return {
      labels: this.messagesPerPerson.map((person) => person.name),
      datasets: [
        {
          label: "Share of Speech",
          backgroundColor: this.messagesPerPerson.map((person) => person.color),
          data: this.messagesPerPerson.map((person) => person.messages.length),
        },
      ],
    };
  }

  getHourlyData() {
    return {
      labels: [...Array(24).keys()],
      datasets: this.messagesPerPerson.map((person) => {
        return {
          label: person.name,
          backgroundColor: person.color,
          data: Chat.hourlyDataFromChat(person.messages),
        };
      }),
    };
  }
}
