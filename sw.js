/* SÜKÛN r932 — Pages-safe release files and actionable install diagnostics
   Amaç: yeni sürümün "waiting/install mismatch" yüzünden eski shell'de
   kilitlenmesini önlemek. Controller değişimi aktif sesi kendiliğinden
   kesmez; sayfa reload kararı istemci tarafında verilir. */
'use strict';

const SURUM = 'r932';
const CACHE = 'sukun-r932-tempo-atlas-20260926-v1';
const CACHE_META = './sukun-cache-meta-r932.json';
const BUILD_MARKER = './sukun-build-r932.json';
const LATEST_MARKER = './sukun-latest.json';
const REQUIRED_RUNTIME = [{"url":"./assets/runtime/dock-r920.js?v=r932","sha256":"d9d86c7c21eb53e840b1f4fa968a3ab30b8c0e057dc2dc14a0704bae19ef3df0"},{"url":"./assets/runtime/esma-scenes-r923.js?v=r932","sha256":"dc97cdaa6f31f63593f1576ad9ec7d3b206f0f55ff1b2aced8f43b0202d44854"},{"url":"./assets/runtime/interface-r920.js?v=r932","sha256":"08475e033253b961306e1eecb6ae32e92e585800ea3f70174240d7a1836284f0"},{"url":"./assets/runtime/session-r919.js?v=r932","sha256":"e30048eada67bf4e81315930f3175c93d4c5a93189551bdc9e33097329e5c5f4"},{"url":"./assets/runtime/wheels-r924.css?v=r932","sha256":"8b9820a362ffcba66affa7091909ab6dd4e56c872374e95897c2e67d448db386"},{"url":"./assets/runtime/wheels-r924.js?v=r932","sha256":"1fda1c9b9d8f6b17d291fd7ee5f78c9df40ca14a41a7040c45ef2798ee84b096"}];

/* Kurulumu kırabilecek büyük/görsel dosyaları zorunlu listeye koymuyoruz.
   Shell doğrulaması bağımsız; geri kalan assetler best-effort pre-cache ve
   normal fetch sırasında current cache'e yazılır. */
const CORE = [
  "./assets/runtime/dock-r920.js?v=r932",
  "./assets/runtime/esma-scenes-r923.js?v=r932",
  "./assets/runtime/interface-r920.js?v=r932",
  "./assets/runtime/session-r919.js?v=r932",
  "./assets/runtime/wheels-r924.js?v=r932",
  "./assets/runtime/wheels-r924.css?v=r932",
  './assets/berhetiyye-premium/control-round-plus-r788.webp',
  './assets/berhetiyye-premium/control-round-minus-r788.webp',
  './assets/berhetiyye-premium/control-nav-amethyst-r788.webp',
  './assets/berhetiyye-premium/control-nav-sapphire-r788.webp',
  './assets/berhetiyye-premium/control-nav-emerald-r788.webp',
  './assets/berhetiyye-premium/control-primary-r788.webp',
  './nero.html',
  './manifest.webmanifest',
  BUILD_MARKER,
  LATEST_MARKER


];

const PRECACHE = [
  "./assets/berhetiyye-premium/gem-emerald-r932.webp",
  "./assets/berhetiyye-premium/panel-emerald-r932.webp",

  "./assets/berhetiyye-premium/panel-ruby-r931.webp",
  "./assets/berhetiyye-premium/seal-amethyst-r931.webp",
  "./assets/berhetiyye-premium/tefekkur-amethyst-r931.webp",

  "./assets/berhetiyye-premium/menu-ruby-r930.webp",
  "./assets/berhetiyye-premium/peek-ruby-r930.webp",

  "./assets/scenes/mobile-r918/mevlevi.webp",
  "./assets/sukun-nur-ring-r757.png",
  "./assets/berhetiyye-premium/wheel-alpha-r915.png",
  "./assets/berhetiyye-premium/wheel-seal-r916.svg",
  "./assets/berhetiyye-premium/wheel-pearls-r916.svg",
  "./assets/berhetiyye-premium/control-primary-r788.webp",
  "./assets/berhetiyye-premium/control-nav-sapphire-r788.webp",
  "./assets/berhetiyye-premium/control-nav-amethyst-r788.webp",
  "./assets/berhetiyye-premium/control-nav-emerald-r788.webp",
  "./assets/berhetiyye-premium/control-round-minus-r788.webp",
  "./assets/berhetiyye-premium/control-round-plus-r788.webp",
  "./assets/berhetiyye-premium/button-red-user-r915.png",
  "./assets/berhetiyye-premium/button-green-user-r915.png",
  "./assets/berhetiyye-premium/button-gold-user-r915.png",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/scenes/esma-r923/mevlevi-sema.webp",
  "./assets/scenes/esma-r923/mevlevi-sema-lite.webp",
  "./assets/scenes/esma-r923/kandilli-tekke.webp",
  "./assets/scenes/esma-r923/kandilli-tekke-lite.webp",
  "./assets/scenes/esma-r923/cami-avlusu.webp",
  "./assets/scenes/esma-r923/cami-avlusu-lite.webp",
  "./assets/scenes/esma-r923/kabede-seher.webp",
  "./assets/scenes/esma-r923/kabede-seher-lite.webp",
  "./assets/scenes/esma-r923/kuduste-seher.webp",
  "./assets/scenes/esma-r923/kuduste-seher-lite.webp",
  "./assets/scenes/esma-r923/aksada-ayni-saf.webp",
  "./assets/scenes/esma-r923/aksada-ayni-saf-lite.webp",
  "./assets/scenes/esma-r923/lud-kapisi.webp",
  "./assets/scenes/esma-r923/lud-kapisi-lite.webp",
  "./assets/scenes/esma-r923/nur-mucadelesi-catalli.webp",
  "./assets/scenes/esma-r923/nur-mucadelesi-catalli-lite.webp",
  "./assets/scenes/esma-r923/nur-mucadelesi-yivli.webp",
  "./assets/scenes/esma-r923/nur-mucadelesi-yivli-lite.webp",
  "./assets/runtime/esma-scenes-r923.js?v=r932",
  "./assets/wheels-r924/berhetiyye/ham-kristal.webp",
  "./assets/wheels-r924/berhetiyye/faset-kesim.webp",
  "./assets/wheels-r924/berhetiyye/ametist-yuvarlak.webp",
  "./assets/wheels-r924/berhetiyye/ametist-saltanati.webp",
  "./assets/wheels-r924/berhetiyye/zumrut-tac.webp",
  "./assets/wheels-r924/berhetiyye/safir-ruzgari.webp",
  "./assets/wheels-r924/berhetiyye/obsidyen-muhur.webp",
  "./assets/wheels-r924/berhetiyye/bakir-ruzgari.webp",
  "./assets/wheels-r924/berhetiyye/yakut-muhur.webp",
  "./assets/wheels-r924/berhetiyye/billur-hisar.webp",
  "./assets/wheels-r924/berhetiyye/lacivert-usturlap.webp",
  "./assets/wheels-r924/esma/inci-sema.webp",
  "./assets/wheels-r924/esma/zumrut-tesbih.webp",
  "./assets/wheels-r924/esma/oniks-sukuneti.webp",
  "./assets/wheels-r924/esma/kehribar-tesbih.webp",
  "./assets/wheels-r924/esma/sedef-nuru.webp"
];

const NOTLAR = [
  'r837 · Üç yeni arka plan isme bağlandı; tek Berhetiyye çarkı korundu.',
  'r836 · Elle/otomatik sayım ayrımı, doğrudan tempo ve bendir ayarları.',
  'r835 · Tema bağlamı, şeffaf kontroller, ayar paneli ve liste kısayolları düzeltildi.',
  'r834 · Jewel varlıkları assets/berhetiyye-premium altında tekilleştirildi; dosya yolları güncellendi.',
  'r833 · Canlı r832 ile r798 varlıkları birleştirildi; erişim ve aktif isim tabanlı tek çark/sahne otoritesi.',
  'r798 · Berhetiyye ownership fix: r778 inline !important painter is gated off Berhetiyye content surfaces; Jewel is the sole visual owner there.',
  'Atlas, 28/99 seyir, bağlam panelleri ve Zikir Ayarları normal akışta; legacy inline visual residue r798 binder tarafından temizlenir.',
  'Service worker r798 Jewel asset ailesini best-effort pre-cache eder; install bir görsel 404 yüzünden kilitlenmez.',
  'Ses motoru, Global Queue, sayaç mantığı, pause/resume/stop ve 28/99 state makineleri değiştirilmedi.'
];

function buildOfHtml(text){
 const tags=String(text||'').match(/<meta\b[^>]*>/gi)||[];
 for(const tag of tags){
  if(/\bname\s*=\s*["']sukun-build["']/i.test(tag))return tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1]||'';
 }
 return '';
}
function vnum(v){const m=String(v||'').match(/r(\d+)/i);return m?Number(m[1]):-1}
function sameOriginPath(path){return new URL(path,self.location.href).pathname}
async function fetchFresh(path,timeout=8000){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
 try{const response=await fetch(new Request(path,{cache:'no-store',signal:ctl.signal}));
  if(!response?.ok||response.type==='opaque')throw Error('fetch '+path+' '+(response?.status||'failed'));
  const data=await response.arrayBuffer();return new Response(data,{status:response.status,statusText:response.statusText,headers:response.headers});
 }finally{clearTimeout(timer)}
}
async function put(cache,key,res){try{await cache.put(key,res.clone());return true}catch(e){return false}}
async function readCacheMeta(){
  try{const c=await caches.open(CACHE),r=await c.match(CACHE_META,{ignoreSearch:true});return r?await r.json():null}catch(e){return null}
}
async function writeCacheMeta(meta){
 try{const cache=await caches.open(CACHE);await cache.put(CACHE_META,new Response(JSON.stringify(meta),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}));return meta}catch(_){return null}
}

/* Required executable assets are verified against the release manifest. */
async function sha256Response(response){
 const data=await response.clone().arrayBuffer();
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('');
}
async function runtimeReady(cache){
 for(const entry of REQUIRED_RUNTIME){const response=await cache.match(entry.url,{ignoreSearch:false});if(!response||await sha256Response(response)!==entry.sha256)return false}
 return true;
}
async function currentComplete(){
 const meta=await readCacheMeta();if(!meta?.complete)return false;
 return runtimeReady(await caches.open(CACHE));
}
let prepareInFlight=null;
function prepareShell(){
 if(prepareInFlight)return prepareInFlight;
 const task=(async()=>{
  const cache=await caches.open(CACHE),staged=[];
  const meta={v:SURUM,cache:CACHE,at:Date.now(),shell:false,manifest:false,marker:false,latest:false,runtime:{},runtimeRequired:REQUIRED_RUNTIME.length,complete:false,errors:[]};
  async function obtain(path,validate,key,required=true){
   let response,error;
   try{response=await fetchFresh(path,8000);if(!await validate(response))throw Error('sürüm veya SHA-256 uyuşmazlığı')}
   catch(e){error=e;response=null;try{const cached=await cache.match(path,{ignoreSearch:false});if(cached&&await validate(cached))response=cached}catch(_){}}
   if(!response){meta.errors.push(path+': '+String(error?.message||'missing'));return false}
   staged.push([path,response]);return true;
  }
  const base=[
   obtain(BUILD_MARKER,async r=>{const j=await r.clone().json();return String(j?.v||'')===SURUM||String(j?.build||'')===SURUM},'marker').then(ok=>meta.marker=ok),
   obtain(LATEST_MARKER,async r=>!!(await r.clone().json())?.v,'latest',false).then(ok=>meta.latest=ok),
   obtain('./manifest.webmanifest',async r=>{const j=await r.clone().json();return j?.short_name==='SÜKÛN'&&new URL(j?.start_url||'',self.location.href).searchParams.get('v')===SURUM},'manifest').then(ok=>meta.manifest=ok),
   obtain('./nero.html',async r=>buildOfHtml(await r.clone().text())===SURUM,'html').then(ok=>meta.shell=ok),
   ...REQUIRED_RUNTIME.map(entry=>obtain(entry.url,async r=>await sha256Response(r)===entry.sha256,entry.url).then(ok=>meta.runtime[entry.url]=ok))
  ];
  await Promise.all(base);
  const valid=meta.shell&&meta.manifest&&meta.marker&&REQUIRED_RUNTIME.every(e=>meta.runtime[e.url]);
  if(valid){for(const [key,response] of staged){if(!await put(cache,key,response)){meta.errors.push('cache write:'+key);await writeCacheMeta(meta);return meta}}}
  meta.complete=valid;
  const stored=await writeCacheMeta(meta);if(!stored)throw Error('cache metadata write failed');return meta;
 })();
 prepareInFlight=task;task.finally(()=>{if(prepareInFlight===task)prepareInFlight=null}).catch(()=>{});return task;
}

async function warmAssets(){
 const cache=await caches.open(CACHE),queue=[...PRECACHE];
 async function worker(){while(queue.length){const path=queue.shift();try{
  const cached=await cache.match(path,{ignoreSearch:true});if(cached)continue;
  const r=await fetchFresh(path,10000);
  if(/\.(?:png|jpe?g|webp|svg)(?:\?|$)/i.test(path)&&!/^image\//i.test(r.headers.get('content-type')||''))continue;
  await put(cache,path,r);
 }catch(e){}}}
 await Promise.all(Array.from({length:2},worker));
}
async function cachedShellFrom(cacheName){
  try{
    if(cacheName===CACHE&&!await currentComplete())return null;
    const c=await caches.open(cacheName),r=await c.match('./nero.html',{ignoreSearch:true});
    if(!r)return null;const b=buildOfHtml(await r.clone().text());return b?{res:r,build:b,cache:cacheName}:null;
  }catch(e){return null}
}
async function bestCachedShell(){
  const current=await cachedShellFrom(CACHE);if(current)return current;
  const keys=(await caches.keys()).filter(k=>k.startsWith('sukun-')&&k!==CACHE)
    .sort((a,b)=>vnum(b)-vnum(a));
  for(const k of keys){const x=await cachedShellFrom(k);if(x)return x}
  return null;
}
async function broadcastStatus(extra={}){
  const m=await readCacheMeta();
  const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const msg={type:'SUKUN_SW_STATUS',v:SURUM,cache:CACHE,complete:!!m?.complete,marker:m||null,...extra};
  cs.forEach(c=>{try{c.postMessage(msg)}catch(e){}});
}

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  try{const meta=await prepareShell();if(!meta.complete)throw Error(meta.errors.join(' | '))}
  catch(error){
   // Report before this worker becomes redundant; the active worker stays intact.
   try{await broadcastStatus({phase:'install-error',error:String(error?.message||error)})}catch(_){}
   throw error;
  }
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  if(!await currentComplete()){const meta=await prepareShell();if(!meta.complete)throw Error('Incomplete release cannot activate')}
  await self.clients.claim();
  const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('sukun-')&&k!==CACHE).sort((a,b)=>vnum(b)-vnum(a)).slice(1).map(k=>caches.delete(k)));
  await broadcastStatus({phase:'activated'});await warmAssets();
 })());
});

const NET_TIMEOUT=3500;
async function timedFetch(request,ms=NET_TIMEOUT){
  return new Promise(resolve=>{
    let done=false;const t=setTimeout(()=>{if(!done){done=true;resolve(null)}},ms);
    fetch(request).then(r=>{if(!done){done=true;clearTimeout(t);resolve(r)}}).catch(()=>{if(!done){done=true;clearTimeout(t);resolve(null)}});
  });
}
async function navigationResponse(request){
 try{
  const fresh=await fetchFresh(request.url,6500),build=buildOfHtml(await fresh.clone().text());
  if(build===SURUM){
   if(!await currentComplete())await prepareShell();
   if(await currentComplete()){const cache=await caches.open(CACHE);await put(cache,'./nero.html',fresh);return fresh}
  }else{try{await self.registration.update()}catch(_){}}
 }catch(_){}
 const cached=await bestCachedShell();if(cached)return cached.res;
 return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SÜKÛN</title><body style="background:#071219;color:#f3ead0;font:16px/1.7 system-ui;padding:24px"><p>SÜKÛN çevrimdışı. Doğrulanmış uygulama dosyaları henüz hazır değil. Bağlantı geldiğinde yeniden deneyin.</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
async function runtimeResponse(request,entry){
 const cache=await caches.open(CACHE),url=new URL(request.url),requestedBuild=url.searchParams.get('v');
 // A document from a later build cannot receive this worker's older executable.
 if(requestedBuild&&requestedBuild!==SURUM){try{return await fetchFresh(request.url)}catch(_){return Response.error()}}
 const cached=await cache.match(entry.url,{ignoreSearch:false});
 if(cached&&await sha256Response(cached)===entry.sha256)return cached;
 try{const fresh=await fetchFresh(entry.url);if(await sha256Response(fresh)!==entry.sha256)throw Error('runtime hash mismatch');await put(cache,entry.url,fresh);return fresh}catch(_){return Response.error()}
}

async function assetResponse(request){
  const url=new URL(request.url),current=await caches.open(CACHE);
  const runtime=REQUIRED_RUNTIME.find(entry=>sameOriginPath(entry.url)===url.pathname);if(runtime)return runtimeResponse(request,runtime);
  const latestPath=sameOriginPath(LATEST_MARKER),manifestPath=sameOriginPath('./manifest.webmanifest');
  const updateProbe=(url.pathname===latestPath)||url.pathname.endsWith('/sw.js')||/\/(?:sukun-build-r\d+|__sukun_build_r\d+__)\.json$/.test(url.pathname);
  /* Update probeları cache-first olamaz; aksi halde latest marker kendi cache'inde
     sonsuza dek kalır ve bir sonraki sürüm hiç algılanmaz. */
  if(updateProbe){
    try{
      const fresh=await fetch(new Request(request,{cache:'no-store'}));
      if(fresh?.ok&&fresh.type!=='opaque')put(current,new Request(url.origin+url.pathname),fresh.clone());
      return fresh;
    }catch(e){
      const fb=await current.match(new Request(url.origin+url.pathname),{ignoreSearch:true});
      if(fb)return fb;
    }
  }
  const cached=await current.match(request,{ignoreSearch:false})||await current.match(new Request(url.origin+url.pathname),{ignoreSearch:true});
  if(cached)return cached;
  try{
    const res=await fetch(request);
    if(res?.ok&&res.type!=='opaque'&&(!/\.(?:png|jpe?g|webp|svg)$/i.test(url.pathname)||/^image\//i.test(res.headers.get('content-type')||'')))await put(current,request,res.clone());
    return res;
  }catch(e){
    const keys=(await caches.keys()).filter(k=>k.startsWith('sukun-')&&k!==CACHE).sort((a,b)=>vnum(b)-vnum(a));
    for(const k of keys){try{const c=await caches.open(k),r=await c.match(request,{ignoreSearch:true});if(r)return r}catch(_){} }
    return Response.error();
  }
}

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  event.respondWith(req.mode==='navigate'?navigationResponse(req):assetResponse(req));
});

self.addEventListener('message',event=>{
  const d=event.data||{},port=event.ports?.[0];
  if(d.type==='SKIP_WAITING'){
    event.waitUntil((async()=>{
      let ready=await currentComplete();if(!ready){const meta=await prepareShell();ready=!!meta.complete}
      if(!ready){try{port?.postMessage({ok:false,v:SURUM,complete:false,error:'release incomplete'})}catch(_){};return}
      try{port?.postMessage({ok:true,v:SURUM,complete:true})}catch(_){};await self.skipWaiting();
    })());return;
  }
  if(d.type==='SURUM_NOTU'){try{port?.postMessage({v:SURUM,notlar:NOTLAR})}catch(e){};return}
  if(d.type==='STATUS'){
    event.waitUntil((async()=>{const m=await readCacheMeta();try{port?.postMessage({v:SURUM,cache:CACHE,complete:await currentComplete(),marker:m,error:m?.errors?.join(' | ')||''})}catch(e){}})());return;
  }
  if(d.type==='CACHE_REFRESH'){
    event.waitUntil(prepareShell().then(async m=>{await broadcastStatus({phase:'refresh'});try{port?.postMessage({ok:true,v:SURUM,cache:CACHE,complete:!!m?.complete,marker:m})}catch(e){}}).catch(e=>{try{port?.postMessage({ok:false,v:SURUM,error:String(e?.message||e)})}catch(_){}}));return;
  }
  if(d.type==='CHECK_UPDATE'){
    event.waitUntil((async()=>{try{await self.registration.update();port?.postMessage({ok:true,v:SURUM})}catch(e){port?.postMessage({ok:false,v:SURUM,error:String(e?.message||e)})}})());
  }
});
