/* SÜKÛN r878 — emergency stable worker: NO forced reload */
const SURUM="r878";
const CACHE="sukun-r878-stable-20260919a";
self.addEventListener("install",e=>{self.skipWaiting();});
self.addEventListener("activate",e=>{
 e.waitUntil((async()=>{
   for(const k of await caches.keys()){
     if(k.startsWith("sukun-") && k!==CACHE) await caches.delete(k);
   }
   await self.clients.claim();
 })());
});
self.addEventListener("message",e=>{
 const d=e.data||{};
 if(d.type==="GET_VERSION"){
   try{e.source&&e.source.postMessage({type:"SUKUN_SW_VERSION",version:SURUM,cache:CACHE})}catch(_){}
 }
});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.origin!==location.origin)return;
 const nav=e.request.mode==="navigate" || /\/(?:index|nero)\.html$/.test(u.pathname);
 if(nav){
   e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match(e.request)));
   return;
 }
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});
