self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Don't care about other-origin URLs
  if (url.origin !== location.origin) return;

  if (
    url.pathname === "/pwa-results" &&
    url.searchParams.has("share-target") &&
    event.request.method === "POST"
  ) {
    serveShareTarget(event);
    return;
  }
});

function serveShareTarget(event, wait = true) {
  const dataPromise = event.request.formData();

  // Redirect so the user can refresh the page without resending data.
  event.respondWith(Response.redirect("/pwa-results?receiving-file-share=1"));

  event.waitUntil(
    (async function () {
      // The page sends this message to tell the service worker it's ready to receive the file.
      console.log("wait for share ready");
      if (wait) await nextMessage("SHARE_READY");

      const client = await self.clients.get(
        event.resultingClientId || event.clientId
      );
      console.log("client in wait until", client);
      const data = await dataPromise;
      console.log("data in wait until", data);
      data.forEach((b, c) => {
        console.log(b, c);
      });
      const file = data.getAll("file");
      console.log("files in wait until", file);
      client.postMessage({ file });
    })()
  );
}

const nextMessageResolveMap = new Map();

/**
 * Wait on a message with a particular event.data value.
 *
 * @param dataVal The event.data value.
 */
function nextMessage(dataVal) {
  return new Promise((resolve) => {
    if (!nextMessageResolveMap.has(dataVal)) {
      nextMessageResolveMap.set(dataVal, []);
    }
    nextMessageResolveMap.get(dataVal).push(resolve);
  });
}

self.addEventListener("message", (event) => {
  console.log("log all messages");
  console.log(event);
  if (event.data === "SHARE_READY") {
    console.log("yuhu ready");
  }
  const resolvers = nextMessageResolveMap.get(event.data);
  console.log("here are the resolvers", resolvers);
  if (!resolvers) return;
  nextMessageResolveMap.delete(event.data);
  for (const resolve of resolvers) resolve();
});
