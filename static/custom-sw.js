console.alert("Custom service worker!");
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

//service-worker.js:
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
