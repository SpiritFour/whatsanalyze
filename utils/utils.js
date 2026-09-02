import moment from "moment";
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
export function objectToDictionary(value) {
  if (typeof value === "function") return undefined;
  if (value === null || typeof value !== "object") return value;
  if (
    value instanceof Date ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(objectToDictionary);
  }

  const dict = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    const clonedValue = objectToDictionary(nestedValue);
    if (clonedValue !== undefined) dict[key] = clonedValue;
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
  const canvas = document.querySelector(`${selector} canvas`);
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error(`Could not find chart canvas in "${selector}"`);
  }

  const imgUrl = canvas.toDataURL("image/png");
  const sizes = await getImgSizes(imgUrl);
  return { img: imgUrl, width: sizes[0], height: sizes[1] };
};
