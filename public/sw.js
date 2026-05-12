self.addEventListener("push", (event) => {
  const payload = (() => {
    try {
      return event.data ? event.data.json() : {};
    } catch {
      return {};
    }
  })();

  const title = typeof payload.title === "string" && payload.title.trim() ? payload.title : "Al-Rihla";
  const options = {
    body: typeof payload.body === "string" ? payload.body : "You have a new Pal message.",
    icon: typeof payload.icon === "string" ? payload.icon : "/icon-192.png",
    badge: typeof payload.badge === "string" ? payload.badge : "/icon-192.png",
    tag: typeof payload.tag === "string" ? payload.tag : "pal-messages",
    renotify: !!payload.renotify,
    data: payload.data && typeof payload.data === "object" ? payload.data : { url: "/pal" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl =
    event.notification &&
    event.notification.data &&
    typeof event.notification.data.url === "string" &&
    event.notification.data.url.trim()
      ? event.notification.data.url
      : "/pal";
  const targetUrl = new URL(rawUrl, self.location.origin).toString();

  event.waitUntil(
    (async () => {
      const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if ("navigate" in client) {
          try {
            await client.navigate(targetUrl);
          } catch {
            /* ignore navigation failure and try focusing */
          }
        }
        if ("focus" in client) {
          await client.focus();
          return;
        }
      }
      if (clients.openWindow) {
        await clients.openWindow(targetUrl);
      }
    })()
  );
});
