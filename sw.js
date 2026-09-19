/* SÜKÛN r876 UI FIX */
const SURUM='r876';
const CACHE='sukun-r876-ui-20260919a';
const CORE=['./','./index.html','./nero.html','./manifest.webmanifest?v=r876',
'./__sukun_latest__.json','./__sukun_build_r876__.json'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(async c=>{
    for(const u of CORE){try{await c.add(new Request(u,{cache:'reload'}));}catch(_){}}
  }));
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys()){
      if(k.startsWith('sukun-')&&k!==CACHE) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  const release=/\/(?:index|nero)\.html$/.test(u.pathname) ||
    u.pathname.endsWith('/sukun/') ||
    /(?:manifest\.webmanifest|__sukun_latest__\.json|__sukun_build_r875__\.json)$/.test(u.pathname);
  if(release){
    e.respondWith((async()=>{
      try{
        const r=await fetch(e.request,{cache:'no-store'});
        if(r.ok){const c=await caches.open(CACHE);c.put(e.request,r.clone()).catch(()=>{});return r;}
      }catch(_){}
      return (await caches.match(e.request))||Response.error();
    })());
  }else{
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
  }
});
