// window.$workbox.then((wb) => {
//   console.log("got workbox", wb);
//   wb.addEventListener("fetch", (event) => {
//     if (event.request.method !== "POST") {
//       event.respondWith(fetch(event.request));
//       return;
//     }
//
//     event.respondWith(
//       (async () => {
//         const formData = await event.request.formData();
//         console.log("got post request");
//         console.log("data is: ", formData);
//         const link = formData.get("files") || "";
//         console.log("files", link);
//         return new Response("got your message");
//       })()
//     );
//   });
// });

console.log("Custom service worker!");
// maybe i need servvice woker windows communicating with each other
//service-worker.js:

self.addEventListener("message", function (e) {
  console.log("log all messages");
  console.log(e);
});

// self.workbox.addEventListener("installed", (event) => {
//   // If we don't do this we'll be displaying the notification after the initial installation, which isn't perferred.
//   console.log("installed", event);
// });
//
// self.workbox.addEventListener("message", (event) => {
//   // If we don't do this we'll be displaying the notification after the initial installation, which isn't perferred.
//   console.log("message", event);
// });
//window is here not defined
// window.$workbox.then((w) => {
//   console.log("workbox here:", JSON.stringify(w));
//   w.addEventListener("message", (event) => {
//     // If we don't do this we'll be displaying the notification after the initial installation, which isn't perferred.
//     console.log("got message", event);
//   });
// });

console.log("self: ", self);
console.log("self: ", self.onpush);

self.onpush = (x) => {
  console.log(x);
};

self.onfetch = (event) => {
  const url = new URL(event.request.url);

  if (
    (event.request.method === "POST" &&
      url.pathname === "/" &&
      url.searchParams.has("share-target")) ||
    url.pathname === "/data2"
  ) {
    console.log(
      event,
      url,
      event.request.method,
      url.pathname,
      url.searchParams.has("share-target"),
      event.clientId
    );
    // we should only log this for better readability
    event.respondWith(Response.redirect("/?receiving-file-share=1"));
    event.waitUntil(
      (async function () {
        const client = await self.clients.get(
          event.clientId || event.resultingClientId
        );
        console.log("client in wait until", client);
        const data = await event.request.formData();
        console.log("data in wait until", data);
        const files = data.get("file");
        console.log("files in wait until", files); //todo this is null, find a way to log data with all keys (FormDat)
        client.postMessage({ files });
      })()
    );
    return;
  }
};

// if ("serviceWorker" in self) {
//   console.log("service workger in navigation!!! yuhu");
//   self.getRegistrations().then((registrations) => {
//     console.log("all registrations:", registrations);
//     for (const worker of registrations) {
//       console.log("Service worker:", worker);
//     }
//   });
// } else {
//   console.log("no service workger in navigation");
// }
