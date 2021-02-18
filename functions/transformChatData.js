function filterSystem(chat_object) {
  return chat_object.filter(
    (message) => message.author.toLowerCase() !== "system"
  );
}
function groupBy(xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}

function totalNumberOfWords(chat_object) {
  return chat_object.reduce((n, { message }) => n + message.length, 0);
}

// Find hapax legomenons, a word or an expression that occurs only once within the context.
function uniqueWords(chat_object) {
  const message_string = chat_object.reduce(
    (n, { message }) => n + " " + message,
    " "
  );
  let message_array = message_string.replace(/\n/g, " ").split(" ");
  let distribution = {};
  message_array.map(function (item) {
    distribution[item] = (distribution[item] || 0) + 1;
  });
  return { fix: 1 };
  /*
  return Object.fromEntries(
    Object.entries(distribution).filter(([k, v]) => v === 1)
  );
  */
}

function getMessagesPerPerson(chat_object) {
  return groupBy(chat_object, "author");
}

function toDates(chat_object) {
  return chat_object.map((message) => message.date.setHours(0, 0, 0, 0));
}

function getDaysArray(s, e) {
  for (var a = [], d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    a.push(new Date(d).toDateString());
  }
  return a;
}

var d = {
  labels: ["January", "February"],
  datasets: [
    {
      label: "Person 1",
      backgroundColor: "rgba(255, 99, 132, 0.1)",
      borderColor: "rgb(255,99,132)",
      data: [60, 1000],
    },
    {
      label: "Person 2",
      backgroundColor: "rgba(75, 192, 192, 0.1)",
      borderColor: "rgba(75, 192, 192, 1)",
      data: [40, Math.random() * 1000],
    },
  ],
};

export function shareOfSpeech(chat_object) {
  var data = getMessagesPerPerson(chat_object);
  let values = Object.values(data);
  let values_lenght = [];
  values.forEach(function (value) {
    values_lenght.push(value.length);
  });
  return {
    labels: Object.keys(data).slice(1),
    datasets: [
      {
        label: "Share of Speech",
        backgroundColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
        data: values_lenght.slice(1),
      },
    ],
  };
}

export function funFacts(chat_object) {
  let number_of_words = totalNumberOfWords(chat_object);
  let unique_words = uniqueWords(chat_object);
  console.log(Object.keys(unique_words), number_of_words);
  return {
    labels: ["UnFun Facts"],
    datasets: [
      {
        label: "Unique words used in this chat",
        backgroundColor: "rgba(255, 99, 132, 1)",
        borderColor: "rgba(255, 99, 132, 0.1)",
        data: [Object.keys(unique_words).length],
      },
      {
        label: "Total Number of Words you typed",
        backgroundColor: "rgba(75, 192, 192, 1)",
        data: [number_of_words],
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

export function chat2frequencies(chat_object) {
  // remove text from whatsapp like encryption
  chat_object = filterSystem(chat_object);

  // if there are no chat messages return default chat
  if (chat_object.length === 0) return d;

  // group messages per person
  let messagesByPerson = getMessagesPerPerson(chat_object);

  // get all dates from chat
  var dates = toDates(chat_object);

  // calculate date ranges where messages happened
  var minDate = new Date(Math.min.apply(null, dates));
  var maxDate = new Date(Math.max.apply(null, dates));

  var x_axis = getDaysArray(minDate, maxDate);

  // iterate over persons
  var datasets = Object.keys(messagesByPerson).map((person) => {
    // this is the x axis with values to plot the graph with
    var hist_info = new Array(x_axis.length).fill(0);
    // now count messages per day
    messagesByPerson[person].forEach(
      (message) => (hist_info[x_axis.indexOf(message.date.toDateString())] += 1)
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
