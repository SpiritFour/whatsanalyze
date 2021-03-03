console.log("Custom service worker!");
// maybe i need servvice woker windows communicating with each other
//service-worker.js:

self.addEventListener("message", function (e) {
  console.log("log all messages");
  console.log(e);
});

console.log("self: ", self);
console.log("self: ", self.onpush);

self.onpush = (x) => {
  console.log(x);
};

// self.onfetch = (event) => {
//   const url = new URL(event.request.url);
//
//   if (
//     (event.request.method === "POST" &&
//       url.pathname === "/" &&
//       url.searchParams.has("share-target")) ||
//     url.pathname === "/data2"
//   ) {
//     console.log(
//       event,
//       url,
//       event.request.method,
//       url.pathname,
//       url.searchParams.has("share-target"),
//       event.clientId
//     );
//     // we should only log this for better readability
//     event.respondWith(Response.redirect("/?receiving-file-share=1"));
//     event.waitUntil(
//       (async function () {
//         const client = await self.clients.get(
//           event.clientId || event.resultingClientId
//         );
//         console.log("client in wait until", client);
//         const data = await event.request.formData();
//         console.log("data in wait until", data);
//         data.forEach((b, c) => {
//           console.log(b, c);
//         });
//         const files = data.get("file");
//         console.log("files in wait until", files); //todo this is null, find a way to log data with all keys (FormDat)
//         client.postMessage({ files });
//       })()
//     );
//     return;
//   }
// };

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Don't care about other-origin URLs
  if (url.origin !== location.origin) return;

  if (
    (url.pathname === "/" &&
      url.searchParams.has("share-target") &&
      event.request.method === "POST") ||
    url.pathname === "/data2"
  ) {
    serveShareTarget(event);
    return;
  }
});

function serveShareTarget(event) {
  const dataPromise = event.request.formData();

  // Redirect so the user can refresh the page without resending data.
  event.respondWith(Response.redirect("/?receiving-file-share=1"));

  event.waitUntil(
    (async function () {
      // The page sends this message to tell the service worker it's ready to receive the file.
      // await nextMessage("share-ready");
      const client = await self.clients.get(
        event.resultingClientId || event.clientId
      );
      console.log("client in wait until", client);
      const data = await dataPromise;
      console.log("data in wait until", data);
      data.forEach((b, c) => {
        console.log(b, c);
      });
      const file = data.get("file");
      console.log("files in wait until", file);
      client.postMessage({ file });
    })()
  );
}

// const nextMessageResolveMap = new Map();

// /**
//  * Wait on a message with a particular event.data value.
//  *
//  * @param dataVal The event.data value.
//  */
// function nextMessage(dataVal) {
//   return new Promise((resolve) => {
//     if (!nextMessageResolveMap.has(dataVal)) {
//       nextMessageResolveMap.set(dataVal, []);
//     }
//     nextMessageResolveMap.get(dataVal).push(resolve);
//   });
// }
