console.log("Custom service worker!");
window.$workbox.then((wb) => {
  console.log("got workbox", wb);
  wb.addEventListener("fetch", (event) => {
    if (event.request.method !== "POST") {
      event.respondWith(fetch(event.request));
      return;
    }

    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        console.log("got post request");
        console.log("data is: ", formData);
        const link = formData.get("files") || "";
        console.log("files", link);
        return new Response("got your message");
      })()
    );
  });
});
