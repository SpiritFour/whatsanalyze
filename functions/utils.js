import * as moment from "moment";
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
  if (date) {
    if (includeTime === true) {
      return moment(date).format("MMMM Do YYYY h:mm");
    } else {
      return moment(date).format("dddd, MMMM Do YYYY");
    }
  }
  return "";
}
