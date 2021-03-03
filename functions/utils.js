export function downloadBase64File(contentBase64, fileName) {
  const downloadLink = document.createElement("a");
  document.body.appendChild(downloadLink);

  downloadLink.href = contentBase64;
  downloadLink.target = "_self";
  downloadLink.download = fileName;
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

export function getDateString(date, includeTime = true) {
  const months = [
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
  ];
  if (date) {
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hour = date.getHours();
    const min = date.getMinutes();

    return (
      day +
      " " +
      month +
      " " +
      year +
      (includeTime ? ", " + hour + ":" + min : "")
    );
  }
  return "";
}
