/* SÜKÛN r875 — atomic update worker */
const SURUM = 'r875';
const CACHE = 'sukun-r875-20260919a';
const CORE = [
  './',
  './index.html',
  './nero.html',
  './manifest.webmanifest',
  './__sukun_latest__.json',
  './__sukun_build_r875__.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      for (const url of CORE) {
        try { await cache.add(new Request(url,{cache:'reload'})); } catch (_) {}
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k.startsWith('sukun-') && k !== CACHE) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if(event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET') return;
  const u=new URL(req.url);
  if(u.origin!==self.location.origin) return;

  const isReleaseFile =
    u.pathname.endsWith('/index.html') ||
    u.pathname.endsWith('/nero.html') ||
    u.pathname.endsWith('/manifest.webmanifest') ||
    u.pathname.endsWith('/__sukun_latest__.json') ||
    u.pathname.endsWith('/__sukun_build_r875__.json') ||
    u.pathname.endsWith('/');

  if(isReleaseFile){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        if(fresh && fresh.ok){
          const cache=await caches.open(CACHE);
          cache.put(req,fresh.clone()).catch(()=>{});
          return fresh;
        }
      }catch(_){}
      return (await caches.match(req)) || Response.error();
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(req);
    if(cached) return cached;
    try{
      const fresh=await fetch(req);
      if(fresh && fresh.ok){
        const cache=await caches.open(CACHE);
        cache.put(req,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch(_){ return cached || Response.error(); }
  })());
});
