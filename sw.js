/* SÜKÛN r877 — forced SW handover */
const SURUM="r877";
const CACHE="sukun-r877-sw-20260919a";
const CORE=["./","./index.html","./nero.html","./manifest.webmanifest?v=r877",
"./__sukun_latest__.json","./__sukun_build_r877__.json"];

self.addEventListener("install",e=>{
 self.skipWaiting();
 e.waitUntil(caches.open(CACHE).then(async c=>{
   for(const u of CORE){try{await c.add(new Request(u,{cache:"reload"}))}catch(_){}}
 }));
});
self.addEventListener("activate",e=>{
 e.waitUntil((async()=>{
   for(const k of await caches.keys()){
     if(k.startsWith("sukun-") && k!==CACHE) await caches.delete(k);
   }
   await self.clients.claim();
 })());
});
self.addEventListener("message",e=>{
 const d=e.data;
 if(d==="SKIP_WAITING" || (d&&d.type==="SKIP_WAITING")) self.skipWaiting();
 if(d&&d.type==="GET_VERSION"){
   try{e.source&&e.source.postMessage({type:"SUKUN_SW_VERSION",version:SURUM,cache:CACHE})}catch(_){}
 }
});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.origin!==self.location.origin)return;
 const release=/\/(?:index|nero)\.html$/.test(u.pathname)||u.pathname.endsWith("/sukun/")||
   /(?:manifest\.webmanifest|__sukun_latest__\.json|__sukun_build_r877__\.json)$/.test(u.pathname);
 if(release){
   e.respondWith((async()=>{
     try{
       const r=await fetch(e.request,{cache:"no-store"});
       if(r.ok){const c=await caches.open(CACHE);c.put(e.request,r.clone()).catch(()=>{});return r}
     }catch(_){}
     return (await caches.match(e.request))||Response.error();
   })());
 }else{
   e.respondWith((async()=>{
     const c=await caches.match(e.request);
     if(c)return c;
     return fetch(e.request);
   })());
 }
});
