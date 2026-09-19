/* SÜKÛN r875 SAFE ROLLBACK */
const SURUM="r875";
const CACHE="sukun-r875-safe-rollback-20260919";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith("sukun-") && k !== CACHE)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  const d=event.data||{};
  if(d.type==="GET_VERSION"){
    try {
      event.source && event.source.postMessage({
        type:"SUKUN_SW_VERSION", version:SURUM, cache:CACHE
      });
    } catch(_) {}
  }
});

/* Network-first for documents. Absolutely no reload/redirect logic. */
self.addEventListener("fetch", event => {
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  if(event.request.mode==="navigate" ||
     /\/(?:index|nero)\.html$/.test(url.pathname)){
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .catch(()=>caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request))
  );
});
