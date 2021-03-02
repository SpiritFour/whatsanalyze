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
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method === "POST" &&
    url.pathname === "/" &&
    url.searchParams.has("share-target")
  ) {
    event.respondWith(Response.redirect("/?receiving-file-share=1"));
    event.waitUntil(
      (async function () {
        const client = await self.clients.get(event.resultingClientId);
        const data = await event.request.formData();
        const files = data.get("file");
        client.postMessage({ files });
      })()
    );
    return;
  }
});

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
window.$workbox.then((w) => {
  console.log("workbox here:", JSON.stringify(w));
  w.addEventListener("message", (event) => {
    // If we don't do this we'll be displaying the notification after the initial installation, which isn't perferred.
    console.log("got message", event);
  });
});

console.log("self: ", JSON.stringify(self));
console.log("self: ", JSON.stringify(self.workbox));

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
