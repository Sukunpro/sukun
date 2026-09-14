/* SÜKÛN r828 — resilient GitHub Pages service worker */
'use strict';
const VERSION='r828';
const CACHE='sukun-r828-20260914b';
const CORE=['./nero.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-512-maskable.png'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const c=await caches.open(CACHE);for(const u of CORE){try{const r=await fetch(new Request(u,{cache:'reload'}));if(r&&r.ok)await c.put(u,r.clone())}catch(e){}}await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{await self.clients.claim();const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('sukun-')&&k!==CACHE).map(k=>caches.delete(k)))})())});
async function networkFirst(req){try{const fresh=await fetch(new Request(req,{cache:'no-store'}));if(fresh&&fresh.ok){const c=await caches.open(CACHE);try{await c.put(req,fresh.clone())}catch(e){}return fresh}}catch(e){}const c=await caches.open(CACHE);return (await c.match(req,{ignoreSearch:true}))||(await c.match('./nero.html',{ignoreSearch:true}))||Response.error()}
async function cacheThenNetwork(req){const c=await caches.open(CACHE);const hit=await c.match(req,{ignoreSearch:true});const p=fetch(req).then(async r=>{if(r&&r.ok){try{await c.put(req,r.clone())}catch(e){}}return r}).catch(()=>null);return hit||await p||Response.error()}
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==self.location.origin)return;if(req.mode==='navigate'){event.respondWith(networkFirst(req));return}if(/(?:sw\.js|__sukun_|manifest\.webmanifest|nero\.html|index\.html)$/.test(u.pathname)){event.respondWith(networkFirst(req));return}event.respondWith(cacheThenNetwork(req))});
self.addEventListener('message',event=>{const d=event.data||{};if(d.type==='SKIP_WAITING')self.skipWaiting();if(d.type==='STATUS'&&event.ports&&event.ports[0])event.ports[0].postMessage({v:VERSION,cache:CACHE,complete:true});if(d.type==='CHECK_UPDATE')event.waitUntil(self.registration.update())});
