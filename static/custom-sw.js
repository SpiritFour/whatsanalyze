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

console.log("self: ", self);

if ("serviceWorker" in navigator) {
  console.log("service workger in navigation!!! yuhu");
  navigator.serviceWorker.addEventListener("message", function (e) {
    console.log("log all messages");
    console.log(e);
  });

  navigator.serviceWorker.getRegistrations().then((registrations) => {
    console.log("all registrations:", registrations);
    for (const worker of registrations) {
      console.log("Service worker:", worker);
    }
  });
} else {
  console.log("no service workger in navigation");
}
