/* SÜKÛN r798 — Update Recovery + Jewel Component Authority
   Amaç: yeni sürümün "waiting/install mismatch" yüzünden eski shell'de
   kilitlenmesini önlemek. Controller değişimi aktif sesi kendiliğinden
   kesmez; sayfa reload kararı istemci tarafında verilir. */
'use strict';

const SURUM = 'r916';
const CACHE = 'sukun-r916-unified-wheel-20260922-v1';
const CACHE_META = './__sukun_cache_meta_r916__.json';
const BUILD_MARKER = './__sukun_build_r916__.json';
const LATEST_MARKER = './__sukun_latest__.json';

/* Kurulumu kırabilecek büyük/görsel dosyaları zorunlu listeye koymuyoruz.
   Shell doğrulaması bağımsız; geri kalan assetler best-effort pre-cache ve
   normal fetch sırasında current cache'e yazılır. */
const CORE = [
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
  "./assets/sukun-nur-ring-r757.png",
  "./assets/berhetiyye-premium/scene-05-kristal.png",
  "./assets/berhetiyye-premium/wheel-seal-r916.svg",
  "./assets/berhetiyye-premium/btn-secondary-sapphire-r872-blank-r883.webp",
  "./assets/berhetiyye-premium/scene-02-asa.png",
  "./assets/berhetiyye-premium/control-nav-sapphire-r788.webp",
  "./assets/berhetiyye-premium/btn-secondary-ruby-r872-blank-r883.webp",
  "./assets/berhetiyye-premium/control-primary-r788.webp",
  "./assets/berhetiyye-premium/berhetiyye-wheel-source-r887.webp",
  "./assets/berhetiyye-premium/button-red-user-r915.png",
  "./assets/berhetiyye-premium/scene-03-selale.png",
  "./assets/berhetiyye-premium/berhetiyye-wheel-user-r885.webp",
  "./assets/berhetiyye-premium/button-gold-user-r915.png",
  "./assets/berhetiyye-premium/btn-secondary-emerald-r872-blank-r883.webp",
  "./assets/berhetiyye-premium/btn-primary-wide-r872-blank-r883.webp",
  "./assets/berhetiyye-premium/scene-07-mor-kristal.png",
  "./assets/berhetiyye-premium/wheel-alpha-r915.png",
  "./assets/berhetiyye-premium/scene-06-yuzuk.png",
  "./assets/berhetiyye-premium/wheel-pearls-r916.svg",
  "./assets/berhetiyye-premium/btn-compact-gold-blank-r883.webp",
  "./assets/berhetiyye-premium/control-round-minus-r788.webp",
  "./assets/berhetiyye-premium/control-nav-emerald-r788.webp",
  "./assets/berhetiyye-premium/berhetiyye-wheel-transparent-r892.webp",
  "./assets/berhetiyye-premium/button-green-user-r915.png",
  "./assets/berhetiyye-premium/scene-r887-04.webp",
  "./assets/berhetiyye-premium/scene-08-ayasofya-billur.png",
  "./assets/berhetiyye-premium/scene-04-teras.png",
  "./assets/berhetiyye-premium/scene-01-billur.png",
  "./assets/berhetiyye-premium/scene-r887-03.webp",
  "./assets/berhetiyye-premium/scene-r887-02.webp",
  "./assets/berhetiyye-premium/scene-r887-01.webp",
  "./assets/berhetiyye-premium/berhetiyye-wheel-user-r886.webp",
  "./assets/berhetiyye-premium/berhetiyye-wheel-r899.png",
  "./assets/berhetiyye-premium/scene-r887-05.webp",
  "./assets/berhetiyye-premium/control-round-plus-r788.webp",
  "./assets/berhetiyye-premium/control-nav-amethyst-r788.webp",
  "./icon-192.png",
  "./icon-512.png",
  "./index.html"
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
async function fetchFresh(path,timeout=4500){
  const req=new Request(path,{cache:'no-store'});
  let timer;
  try{
    const ctl=new AbortController();
    timer=setTimeout(()=>ctl.abort(),timeout);
    const res=await fetch(new Request(req,{signal:ctl.signal,cache:'no-store'}));
    if(!res||!res.ok||res.type==='opaque')throw new Error('fetch '+path+' '+(res?.status||'failed'));
    return res;
  }finally{clearTimeout(timer)}
}
async function put(cache,key,res){try{await cache.put(key,res.clone());return true}catch(e){return false}}
async function readCacheMeta(){
  try{const c=await caches.open(CACHE),r=await c.match(CACHE_META,{ignoreSearch:true});return r?await r.json():null}catch(e){return null}
}
async function writeCacheMeta(meta){
  try{const c=await caches.open(CACHE);await c.put(CACHE_META,new Response(JSON.stringify(meta),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}))}catch(e){}
  return meta;
}

let prepareInFlight=null;
function prepareShell(){
  if(prepareInFlight)return prepareInFlight;
  const p=(async()=>{
    const cache=await caches.open(CACHE);
    const meta={v:SURUM,cache:CACHE,at:Date.now(),shell:false,manifest:false,marker:false,latest:false,complete:false,errors:[]};

    /* Her parça bağımsız. Tek bir 404 yeni worker'ı redundant yapamaz. */
    try{
      const r=await fetchFresh(BUILD_MARKER);const j=await r.clone().json();
      if(String(j?.v||'')===SURUM||String(j?.build||'').includes(SURUM)){await put(cache,BUILD_MARKER,r);meta.marker=true}else throw new Error('build marker mismatch');
    }catch(e){meta.errors.push('marker:'+String(e?.message||e))}
    try{
      const r=await fetchFresh(LATEST_MARKER);const j=await r.clone().json();
      if(j&&j.v){await put(cache,LATEST_MARKER,r);meta.latest=true}else throw new Error('latest invalid');
    }catch(e){meta.errors.push('latest:'+String(e?.message||e))}
    try{
      const r=await fetchFresh('./manifest.webmanifest');const j=await r.clone().json();
      const u=new URL(j?.start_url||'',self.location.href);
      if(j?.short_name==='SÜKÛN'&&u.searchParams.get('v')===SURUM){await put(cache,'./manifest.webmanifest',r);meta.manifest=true}else throw new Error('manifest mismatch');
    }catch(e){meta.errors.push('manifest:'+String(e?.message||e))}
    try{
      const r=await fetchFresh('./nero.html',6500);const b=buildOfHtml(await r.clone().text());
      if(b===SURUM){await put(cache,'./nero.html',r);meta.shell=true}else throw new Error('html '+(b||'unknown')+' != '+SURUM);
    }catch(e){meta.errors.push('html:'+String(e?.message||e))}

    meta.complete=meta.shell&&meta.manifest&&meta.marker;
    await writeCacheMeta(meta);

    return meta;
  })();
  prepareInFlight=p;
  p.finally(()=>{if(prepareInFlight===p)prepareInFlight=null}).catch(()=>{});
  return p;
}

async function warmAssets(){
 const cache=await caches.open(CACHE),queue=[...PRECACHE];
 async function worker(){while(queue.length){const path=queue.shift();try{
  const cached=await cache.match(path,{ignoreSearch:true});if(cached)continue;
  const r=await fetchFresh(path,10000);
  if(/\.(?:png|jpe?g|webp|svg)(?:\?|$)/i.test(path)&&!/^image\//i.test(r.headers.get('content-type')||''))continue;
  await put(cache,path,r);
 }catch(e){}}}
 await Promise.all(Array.from({length:4},worker));
}
async function cachedShellFrom(cacheName){
  try{
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
    /* r793: install hiçbir geçici Pages yayılım uyuşmazlığında beklemeye kilitlenmez.
       Sekiz saniyeden uzun CDN gecikmesinde aktivasyon yine devam eder; activate
       aşaması shell hazırlığını yeniden dener. */
    try{await Promise.race([prepareShell(),new Promise(r=>setTimeout(r,8000))])}catch(e){}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await self.clients.claim();
    let prepared=null;try{prepared=await prepareShell()}catch(e){}
    {
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith('sukun-')&&k!==CACHE).map(k=>caches.delete(k)));
    }
    await broadcastStatus({phase:'activated'});
    await warmAssets();
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
  /* r900: HTML is NETWORK-FIRST authority. A successful network document is never
     replaced by an older cached shell. This prevents SW-new / app-old split-brain. */
  try{
    const fresh=await fetch(new Request(request,{cache:'no-store',headers:request.headers}));
    if(fresh&&fresh.ok&&fresh.type!=='opaque'){
      const text=await fresh.clone().text();
      const b=buildOfHtml(text);
      if(b===SURUM){
        const c=await caches.open(CACHE);
        await put(c,'./nero.html',fresh.clone());
        await put(c,'./index.html',fresh.clone());
      }
      return fresh;
    }
  }catch(e){}
  const cached=await cachedShellFrom(CACHE);
  if(cached&&cached.build===SURUM)return cached.res;
  return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SÜKÛN</title><body style="background:#05090c;color:#8fe9ff;font:16px/1.7 system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px"><div><div style="font-size:44px;opacity:.75">۞</div><p>SÜKÛN çevrimdışı. r916 kabuğu henüz önbelleğe alınmadı.</p></div>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}

async function assetResponse(request){
  const url=new URL(request.url),current=await caches.open(CACHE);
  const latestPath=sameOriginPath(LATEST_MARKER),manifestPath=sameOriginPath('./manifest.webmanifest');
  const updateProbe=(url.pathname===latestPath)||url.pathname.endsWith('/sw.js')||/\/__sukun_build_r\d+__\.json$/.test(url.pathname);
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
  if(d.type==='SKIP_WAITING'){event.waitUntil(self.skipWaiting());return}
  if(d.type==='SURUM_NOTU'){try{port?.postMessage({v:SURUM,notlar:NOTLAR})}catch(e){};return}
  if(d.type==='STATUS'){
    event.waitUntil((async()=>{const m=await readCacheMeta();try{port?.postMessage({v:SURUM,cache:CACHE,complete:!!m?.complete,marker:m,error:m?.errors?.join(' | ')||''})}catch(e){}})());return;
  }
  if(d.type==='CACHE_REFRESH'){
    event.waitUntil(prepareShell().then(async m=>{await broadcastStatus({phase:'refresh'});try{port?.postMessage({ok:true,v:SURUM,cache:CACHE,complete:!!m?.complete,marker:m})}catch(e){}}).catch(e=>{try{port?.postMessage({ok:false,v:SURUM,error:String(e?.message||e)})}catch(_){}}));return;
  }
  if(d.type==='CHECK_UPDATE'){
    event.waitUntil((async()=>{try{await self.registration.update();port?.postMessage({ok:true,v:SURUM})}catch(e){port?.postMessage({ok:false,v:SURUM,error:String(e?.message||e)})}})());
  }
});
