import moment from "moment";

export function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function downloadBase64File(content, fileName) {
  let url;
  let isBlob = false;

  if (
    typeof HTMLCanvasElement !== "undefined" &&
    content instanceof HTMLCanvasElement
  ) {
    url = content.toDataURL("image/png");
  } else if (typeof Blob !== "undefined" && content instanceof Blob) {
    url = URL.createObjectURL(content);
    isBlob = true;
  } else if (typeof content === "string") {
    url = content;
  } else {
    return;
  }

  const downloadLink = document.createElement("a");
  document.body.appendChild(downloadLink);
  downloadLink.href = url;
  downloadLink.download = fileName;
  downloadLink.click();
  document.body.removeChild(downloadLink);

  if (isBlob) {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch (_error) {
        // ignore revoke error
      }
    }, 40000);
  }
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
  // reactive proxies (Vue wraps everything in data()) cannot be structured-cloned
  // into a Worker: unwrap by serializing. Dates become ISO strings; typed arrays
  // and ArrayBuffers are cloned as-is.
  if (ArrayBuffer.isView(value)) return value;
  if (value instanceof ArrayBuffer) return value;
  if (value instanceof Date) return value.toISOString();

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
