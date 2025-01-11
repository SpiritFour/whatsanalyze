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

export function dateDiffs(firstDate, lastDate, measurementUnit = "days") {
  return moment(lastDate).diff(moment(firstDate), measurementUnit);
}

export function firstDate(chat) {
  return chat.filterdChatObject[0]?.date;
}

export function lastDate(chat) {
  return chat.filterdChatObject.slice(-1)[0]?.date;
}

// this is used on objects that should be transfered to the web worker
// the webworker can not receive functions
export function objectToDictionary(obj, dict = {}) {
  for (const [key, value] of Object.entries(obj)) {
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      objectToDictionary(value, (dict[key] = {}));
    } else if (typeof value !== "function") {
      dict[key] = value;
    }
  }
  return dict;
}

export const getImgSizes = function (imgUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve([img.width, img.height]);
    };
    img.onerror = reject;
    img.src = imgUrl;
  });
};

export const loadImage = async function (selector) {
  const imgUrl = document
    .querySelector(selector + ">*>canvas")
    .toDataURL("image/png");
  const sizes = await getImgSizes(imgUrl);
  return { img: imgUrl, width: sizes[0], height: sizes[1] };
};
