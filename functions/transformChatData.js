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

function getMessagesPerPerson(chat_object) {
  return groupBy(chat_object, "author");
}

function toDates(chat_object) {
  return chat_object.map((message) => message.date);
}

function getDaysArray(s, e) {
  for (var a = [], d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    a.push(new Date(d));
  }
  return a;
}

export function chat2frequencies(chat_object) {
  chat_object = filterSystem(chat_object);
  let messagesByPerson = getMessagesPerPerson(chat_object);

  var dates = toDates(chat_object);

  var maxDate = new Date(Math.max.apply(null, dates));
  var minDate = new Date(Math.min.apply(null, dates));

  var x_axis = getDaysArray(minDate, maxDate);
  x_axis;
  console.log(messagesByPerson);

  // var datasets = messagesByPerson.map((person) => {
  //   return {
  //     label: person.name,
  //     backgroundColor: "rgba(255, 99, 132, 0.1)",
  //     borderColor: "rgb(255,99,132)",
  //   };
  // });

  return {
    labels: ["January", "February"],
    datasets: [
      {
        label: "Person 1",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        borderColor: "rgb(255,99,132)",
        data: [60, 100],
      },
      {
        label: "Person 2",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        borderColor: "rgba(75, 192, 192, 1)",
        data: [40, 70],
      },
    ],
  };
}
