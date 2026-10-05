/* SÜKÛN r949 — audio ownership, bounded scenes and phased visual scheduling
   Amaç: yeni sürümün "waiting/install mismatch" yüzünden eski shell'de
   kilitlenmesini önlemek. Controller değişimi aktif sesi kendiliğinden
   kesmez; sayfa reload kararı istemci tarafında verilir. */
'use strict';

const SURUM = 'r1012';
const ART_CACHE = 'sukun-art-persistent-v1';
const CACHE = 'sukun-r1012-lifecycle-20261005-v44';
const CACHE_META = './sukun-cache-meta-r1012.json';
const BUILD_MARKER = './sukun-build-r1012.json';
const LATEST_MARKER = './sukun-latest.json';
const REQUIRED_RUNTIME = [{"url": "./assets/runtime/berhet-layout-r938.css?v=r1012", "sha256": "e963103a4742717dd1845452d7fba881210a7c901fe0193e284ec047d323b172"}, {"url": "./assets/runtime/berhet-materials-r933.css?v=r1012", "sha256": "4be10a5e23254a4644178d08e664177e1dab6275c8b0ce817d7bfeedbf5e2b24"}, {"url": "./assets/runtime/berhet-controls-r933.css?v=r1012", "sha256": "b446d7e2ea1041ee2bd350b042a67f4dbbcd9e98cbcf48c41368b6b5b9d5c415"}, {"url": "./assets/runtime/berhet-dock-r933.css?v=r1012", "sha256": "8ee1fba13a12f78500721cd6b5a5653b5a7d4914c02fa0be19046ebfd18bbc12"}, {"url": "./assets/runtime/background-owner-r949.js?v=r1012", "sha256": "0a76964b1cabf66ca701a1910a5938cc7046b78ed6ce8576b1000f47717c068e"}, {"url": "./assets/runtime/lifecycle-r949.js?v=r1012", "sha256": "23c80a9fdd863ed691402a0facc2119b6e72d86d8ec0bd9cfe2e42e4f67a8367"}, {"url": "./assets/runtime/audio-palette-r945.js?v=r1012", "sha256": "0df6131d56e869f22ba011a084300d4bb9ddddc4d41589e63436850492003bd1"}, {"url": "./assets/runtime/esma-scenes-r923.js?v=r1012", "sha256": "dc97cdaa6f31f63593f1576ad9ec7d3b206f0f55ff1b2aced8f43b0202d44854"}, {"url": "./assets/runtime/session-r919.js?v=r1012", "sha256": "659c21f0e122a18b34870ebefd89a86d1d8c28556c4746d8c3c1db44a8c21c16"}, {"url": "./assets/runtime/dock-r920.js?v=r1012", "sha256": "d9d86c7c21eb53e840b1f4fa968a3ab30b8c0e057dc2dc14a0704bae19ef3df0"}, {"url": "./assets/runtime/wheels-r924.js?v=r1012", "sha256": "3fdcfd5eb41e2f473eb86a8a16e6820e717cf679f327cdb9f73430b6301a1632"}, {"url": "./assets/runtime/berhet-layout-r938.js?v=r1012", "sha256": "e4b7019979fcd5c2921dac09a7162e9548e3e1740301e38eb580aaa01b3436da"}, {"url": "./assets/runtime/interface-r920.js?v=r1012", "sha256": "8e53be6f27bd1694844ffed7d97af55d68887162db8b7e10514be2859d640d10"}, {"url": "./assets/runtime/wheels-r924.css?v=r1012", "sha256": "22a07233940d7a8deebec8613885dcb534cd8a35482e0615b0ffd7febd240a2f"}, {"url": "./assets/runtime/berhet-theme-r933.js?v=r1012", "sha256": "da83b8f7c8abf49c00c3a11291da0c01a8484e742c4a920be9db3b7a56f6b434"}, {"url": "./assets/runtime/health-view-r943.css?v=r1012", "sha256": "51a89716056a0c9b823421bf39ec30d6de99dd182ad8373a19454aa6509596c3"}, {"url": "./assets/runtime/health-view-r943.js?v=r1012", "sha256": "a7f909445a8d24ed8dc25b5afc1ed2696ccbe965b4e3b88eda2b213bbb56f28a"}, {"url": "./assets/runtime/scene-picker-r945.css?v=r1012", "sha256": "95038f4efddb07a52626b6701c9edaddd5c8831d1f327b18d5160ae2bb7154d2"}, {"url": "./assets/runtime/scene-picker-r945.js?v=r1012", "sha256": "1ed9d5905ed4c82834c69fb111d8fb24ad192d416a7c478c9075112b00794b75"}, {"url": "./assets/runtime/health-r940.js?v=r1012", "sha256": "8cd3b968907e81a9bd501a11db233718a63300d38d136a46a94c5935b771a744"}, {"url": "./assets/runtime/nefs-r948.css?v=r1012", "sha256": "94ccd9dad8bd65f2501f90d83bfb8aee1e27229fc7a3f497c5d51d0564848edf"}, {"url": "./assets/runtime/nefs-data-r948.js?v=r1012", "sha256": "c29f42eacaa014b90b87b85d906f2468f91a8347ddd486467b9ad1d7c39c214c"}, {"url": "./assets/runtime/nefs-model-r948.js?v=r1012", "sha256": "b5d4f9673e26f01ea5cb3714f5c45a1ca41c1cee1745f72461ed71b54fc7185b"}, {"url": "./assets/runtime/nefs-ui-r948.js?v=r1012", "sha256": "8201e3904068e222f32a3ad704188c620c48ccc2c25091668854b5e6e12e5721"}, {"url": "./assets/runtime/offline-scenes-r962.js?v=r1012", "sha256": "d1afd56086c4f2535ae6ddaf4324a63a1864b71a63da53e72c6ceb25ece974ba"}, {"url": "./assets/wheel-navigation-r964/gold.png?v=r1012", "sha256": "3ed982ef9fdc057c97416b6837b780f08ffb0f9e0a9eca0daa973ddfc3660ca2"}, {"url": "./assets/wheel-navigation-r964/copper.png?v=r1012", "sha256": "b731ba244c0f04a972276580a70e3b203a8a9e839abe35841cfd08c372283012"}, {"url": "./assets/wheel-navigation-r964/silver.png?v=r1012", "sha256": "d7095d1597bdeb288035bd3aa87c4168c63a4dd6b98c7f6ab860f0f7c24a516f"}, {"url": "./assets/wheel-navigation-r964/dark.png?v=r1012", "sha256": "c6407489d8c52d1b65985dbbdb8d5c3df625b184739c413c40c6d423d70c55bb"}, {"url": "./assets/wheel-navigation-r964/crystal.png?v=r1012", "sha256": "dd751abc6483a3c5f3585e170d0c9888fdef5ccb69e276bd61d765b33bdb6b85"}, {"url": "./assets/runtime/presentation-r979.js?v=r1012", "sha256": "12a36845037782ccf9fe851b3b498cd856771b85d412facb0e928918f70eaa19"}, {"url": "./assets/runtime/audio-cpu-r981.js?v=r1012", "sha256": "daba8b6eff390454fc7391aa80fdcf1f9e5db7d3a8b7d07d9be93abfb0cd0f4f"}, {"url": "./assets/runtime/audio-preparation-r981.js?v=r1012", "sha256": "2765a389211c07220f996061843727273c34e5b8f6aeb326002afb6dc3d8eea9"}, {"url": "./assets/runtime/tab-owner-r981.js?v=r1012", "sha256": "c3b561f196fabf93c01fd3631b72d4b68a4d56b6549a268598e041c1e615112c"}, {"url": "./assets/runtime/cadence-r981.css?v=r1012", "sha256": "e8551396049c455e9c340c71e7d343ebbaf2f4cdeacc80bcb82e8d6046889992"}, {"url": "./assets/runtime/cadence-r981.js?v=r1012", "sha256": "f9bd5dbaaaaf20fb5523afdcf00dec639ef17b2bf6b0cf6462c872dff9aa9cda"}, {"url": "./assets/runtime/studio-preparation-r982.js?v=r1012", "sha256": "b59af5742f1f4cf86e60277f2a941034d13fdac98c47e64fb737883ae551c24e"}, {"url": "./assets/runtime/progress-journal-r982.js?v=r1012", "sha256": "b7fbd70dbcf9d08abdd88ec2c2d29566d56d75c8c76aca7ce7347149f59b48bc"}, {"url": "./assets/runtime/tekke-sequence-r988.js?v=r1012", "sha256": "c453373ee648876e06413a6272c27d4669d5abb895a495792f8fe52d1e7fe5f8"}, {"url": "./assets/runtime/tekke-set-r990.js?v=r1012", "sha256": "af2498880a1b9e9cbd72513a5c0237d54e8fd686b138a4544e33064bd78cb67b"}, {"url": "./assets/runtime/tekke-ux-r992.css?v=r1012", "sha256": "dfbfba0a65ebd605d06b244a68fc1c9294b1793b933ce6e07e7b9fed580ab515"}, {"url": "./assets/runtime/tekke-ux-r992.js?v=r1012", "sha256": "0a293836510e4c9c9a32fb32fdf8b0676f5aef39daa1ba8c812640c19846a579"}, {"url": "./assets/runtime/tekke-journey-r993.css?v=r1012", "sha256": "1173ffc1a32c8201c990d26996cf44020195a1e9a65540f5c37ad8cbae1df863"}, {"url": "./assets/runtime/tekke-journey-r993.js?v=r1012", "sha256": "0b09636e3ba8978dcf7e92221d03fb25ebe73d81feb61bef26ca1e408080e61a"}];

/* Kurulumu kırabilecek büyük/görsel dosyaları zorunlu listeye koymuyoruz.
   Shell doğrulaması bağımsız; geri kalan assetler yalnız görünüm istediğinde
   normal fetch sırasında current cache'e yazılır. Toplu görsel indirme
   install/activate yaşam döngüsünü veya aktif ses oturumunu meşgul etmez. */
const CORE = [
  "./assets/runtime/offline-scenes-r962.js?v=r1012",
  "./assets/wheel-navigation-r964/gold.png?v=r1012",
  "./assets/wheel-navigation-r964/copper.png?v=r1012",
  "./assets/wheel-navigation-r964/silver.png?v=r1012",
  "./assets/wheel-navigation-r964/dark.png?v=r1012",
  "./assets/wheel-navigation-r964/crystal.png?v=r1012",

  "./assets/runtime/tekke-journey-r993.css?v=r1012",
  "./assets/runtime/tekke-journey-r993.js?v=r1012",

  "./assets/runtime/tekke-ux-r992.css?v=r1012",
  "./assets/runtime/tekke-ux-r992.js?v=r1012",

  "./assets/runtime/tekke-set-r990.js?v=r1012",


  "./assets/runtime/tekke-sequence-r988.js?v=r1012",

  "./assets/runtime/studio-preparation-r982.js?v=r1012",
  "./assets/runtime/progress-journal-r982.js?v=r1012",

  "./assets/runtime/audio-cpu-r981.js?v=r1012",
  "./assets/runtime/audio-preparation-r981.js?v=r1012",
  "./assets/runtime/tab-owner-r981.js?v=r1012",
  "./assets/runtime/cadence-r981.css?v=r1012",
  "./assets/runtime/cadence-r981.js?v=r1012",

  "./assets/runtime/presentation-r979.js?v=r1012",
  "./assets/runtime/lifecycle-r949.js?v=r1012",
  "./assets/runtime/background-owner-r949.js?v=r1012",
  "./assets/runtime/berhet-layout-r938.css?v=r1012",
  "./assets/runtime/berhet-materials-r933.css?v=r1012",
  "./assets/runtime/berhet-controls-r933.css?v=r1012",
  "./assets/runtime/berhet-dock-r933.css?v=r1012",
  "./assets/runtime/audio-palette-r945.js?v=r1012",
  "./assets/runtime/esma-scenes-r923.js?v=r1012",
  "./assets/runtime/session-r919.js?v=r1012",
  "./assets/runtime/dock-r920.js?v=r1012",
  "./assets/runtime/wheels-r924.js?v=r1012",
  "./assets/runtime/berhet-layout-r938.js?v=r1012",
  "./assets/runtime/interface-r920.js?v=r1012",
  "./assets/runtime/wheels-r924.css?v=r1012",
  "./assets/runtime/berhet-theme-r933.js?v=r1012",
  "./assets/runtime/health-view-r943.css?v=r1012",
  "./assets/runtime/health-view-r943.js?v=r1012",
  "./assets/runtime/scene-picker-r945.css?v=r1012",
  "./assets/runtime/scene-picker-r945.js?v=r1012",
  "./assets/runtime/health-r940.js?v=r1012",
  "./assets/runtime/nefs-r948.css?v=r1012",
  "./assets/runtime/nefs-data-r948.js?v=r1012",
  "./assets/runtime/nefs-model-r948.js?v=r1012",
  "./assets/runtime/nefs-ui-r948.js?v=r1012",





















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

const NOTLAR = ["Kayıtlı sesle Zikri başlat akışındaki süresiz hazırlık ve oynatma beklemeleri sonlandırılır. Durdur sonrası yeniden Başlat, eski bekleyen işlemi devralmaz.", "Efekt için hazırlanamayınca ekran açıkken özgün kayıt oynatılır; sayaç yalnız tamamlanan okuyuşta ilerler. Kilit ekranı için hazırlanamayınca açık bir bilgi gösterilir.", "Mikrofon hazırlığı görünür ve ikinci KAYIT dokunuşuyla iptal edilebilir. İptalden sonra geç gelen mikrofon yanıtı kayıt başlatmaz.", "Takılmaların incelenmesi için sistem raporuna ekran yenileme evreleri eklendi."];

function buildOfHtml(text){
 const tags=String(text||'').match(/<meta\b[^>]*>/gi)||[];
 for(const tag of tags){
  if(/\bname\s*=\s*["']sukun-build["']/i.test(tag))return tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1]||'';
 }
 return '';
}
function vnum(v){const m=String(v||'').match(/r(\d+)/i);return m?Number(m[1]):-1}
function sameOriginPath(path){return new URL(path,self.location.href).pathname}
// Bound CacheStorage/hash/worker-message waits as well as network fetches.
function updateDeadline(work,ms,label){return new Promise((resolve,reject)=>{
 let done=false;const finish=(fn,value)=>{if(done)return;done=true;clearTimeout(timer);fn(value)};
 const timer=setTimeout(()=>finish(reject,Error(label+': zaman aşımı')),ms);
 Promise.resolve().then(work).then(v=>finish(resolve,v),e=>finish(reject,e));
})}
function replyUpdate(port,value){try{port?.postMessage(value)}catch(_){}}
async function prepareProgress(progress){
 try{const cs=await updateDeadline(()=>self.clients.matchAll({type:'window',includeUncontrolled:true}),2000,'İlerleme bildirimi');
  for(const c of cs)try{c.postMessage({type:'SUKUN_SW_STATUS',v:SURUM,cache:CACHE,phase:'prepare-progress',progress})}catch(_){}
 }catch(_){}
}
/* Keep one deadline alive through headers and the complete response body.
   Abort the network and cancel the reader before releasing a timed-out slot.
   Late headers/body chunks can never reach the cache-writing caller. */
function fetchBuffered(request,timeout){
 return new Promise((resolve,reject)=>{
  const ctl=new AbortController();let settled=false,response=null,reader=null,timer=null;
  const sourceSignal=typeof request==='object'?request.signal:null;
  const cancel=reason=>{try{ctl.abort(reason)}catch(_){}try{const target=reader,work=target?target.cancel(reason):response?.body?.cancel(reason);work?.catch(()=>{}).finally(()=>{try{target?.releaseLock()}catch(_){}})}catch(_){}};
  const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);sourceSignal?.removeEventListener('abort',onAbort);fn(value)};
  const onAbort=()=>{const error=sourceSignal?.reason||new DOMException('Dosya indirme iptal edildi','AbortError');cancel(error);finish(reject,error)};
  timer=setTimeout(()=>{const error=new DOMException('Dosya indirme zaman aşımı','TimeoutError');cancel(error);finish(reject,error)},timeout);
  if(sourceSignal?.aborted){onAbort();return}
  sourceSignal?.addEventListener('abort',onAbort,{once:true});
  Promise.resolve().then(async()=>{
   if(settled)return;
   response=await fetch(new Request(request,{signal:ctl.signal}));
   if(settled){cancel(ctl.signal.reason);return}
   if(!response||response.type==='opaque'||response.type==='error')throw Error('unreadable response');
   const chunks=[];let length=0;
   if(response.body){reader=response.body.getReader();for(;;){const part=await reader.read();if(settled)return;if(part.done)break;chunks.push(part.value);length+=part.value.byteLength}reader.releaseLock();reader=null}
   if(settled)return;
   const data=new Uint8Array(length);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength}
   finish(resolve,new Response(length?data:null,{status:response.status,statusText:response.statusText,headers:response.headers}));
  }).catch(error=>{cancel(error);finish(reject,error)});
 });
}
async function fetchFresh(path,timeout=30000){
 const response=await fetchBuffered(new Request(path,{cache:'no-store'}),timeout);
 if(!response?.ok)throw Error('fetch '+path+' '+(response?.status||'failed'));
 return response;
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
// Read-only readiness checks the actual cached shell as well as runtime hashes.
async function tekkeShellReady(){
 try{if(!await currentComplete())return false;const cache=await caches.open(CACHE);let htmlReady=false;
  for(const path of ['./nero.html','./index.html','./']){const res=await cache.match(path,{ignoreSearch:true});if(res?.ok&&buildOfHtml(await res.text())===SURUM){htmlReady=true;break;}}
  if(!htmlReady)return false;const manifest=await cache.match('./manifest.webmanifest',{ignoreSearch:true}),marker=await cache.match(BUILD_MARKER,{ignoreSearch:true});
  if(!manifest?.ok||!marker?.ok)return false;const m=await manifest.json(),b=await marker.json();return m.short_name==='SÜKÛN'&&new URL(m.start_url,self.location.href).searchParams.get('v')===SURUM&&(b.v===SURUM||b.build===SURUM);
 }catch(_){return false;}
}
let prepareInFlight=null;
function prepareShell(){
 if(prepareInFlight)return prepareInFlight;
 const deadline=Date.now()+60000;
 const live=()=>{if(Date.now()>=deadline)throw Error('Dosya doğrulama süresi doldu')};
 let finishedFiles=0;const totalFiles=REQUIRED_RUNTIME.length+4;
 const report=stage=>{prepareProgress({done:finishedFiles,total:totalFiles,stage}).catch(()=>{})};
 const task=updateDeadline(async()=>{
  const cache=await caches.open(CACHE),staged=[];live();report('download');
  const meta={v:SURUM,cache:CACHE,at:Date.now(),shell:false,manifest:false,marker:false,latest:false,runtime:{},runtimeRequired:REQUIRED_RUNTIME.length,complete:false,errors:[]};
  const downloadQueue=[];let activeDownloads=0;
  function drainDownloads(){
   while(activeDownloads<3&&downloadQueue.length){
    const job=downloadQueue.shift();activeDownloads++;
    Promise.resolve().then(job.run).then(job.resolve,job.reject).finally(()=>{activeDownloads--;drainDownloads()});
   }
  }
  function obtain(...args){return new Promise((resolve,reject)=>{downloadQueue.push({run:()=>obtainOne(...args),resolve,reject});drainDownloads()})}
  async function obtainOne(path,validate,key,required=true){
   live();let response,error;
   try{const cached=await cache.match(path,{ignoreSearch:false});if(cached&&await validate(cached))response=cached}catch(_){}
   live();for(let attempt=0;!response&&attempt<2;attempt++){
    live();
    try{const fresh=await fetchFresh(path,30000);if(!await validate(fresh))throw Error('sürüm veya SHA-256 uyuşmazlığı');response=fresh}
    catch(e){error=e;response=null;if(/fetch .* 4\d\d$|SHA-256/.test(String(e?.message||'')))break}
   }
   live();finishedFiles++;report('download');
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
  await Promise.all(base);live();report('saving');
  const valid=meta.shell&&meta.manifest&&meta.marker&&REQUIRED_RUNTIME.every(e=>meta.runtime[e.url]);
  if(valid){for(const [key,response] of staged){live();if(!await put(cache,key,response)){meta.errors.push('cache write:'+key);await writeCacheMeta(meta);return meta}}}
  live();meta.complete=valid;
  const stored=await writeCacheMeta(meta);if(!stored)throw Error('cache metadata write failed');return meta;
 },60000,'Dosya doğrulama');
 prepareInFlight=task;task.finally(()=>{if(prepareInFlight===task)prepareInFlight=null}).catch(()=>{});return task;
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
  const keys=(await caches.keys()).filter(k=>k.startsWith('sukun-')&&k!==CACHE&&k!==ART_CACHE)
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
   try{await updateDeadline(()=>broadcastStatus({phase:'install-error',error:String(error?.message||error)}),2000,'Durum bildirimi')}catch(_){}
   throw error;
  }
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  if(!await currentComplete()){const meta=await prepareShell();if(!meta.complete)throw Error('Incomplete release cannot activate')}
  await self.clients.claim();
  const art=await caches.open(ART_CACHE);
  for(const name of (await caches.keys()).filter(n=>n.startsWith('sukun-')&&n!==ART_CACHE)){const old=await caches.open(name);for(const req of await old.keys()){if(isArt(new URL(req.url))){const res=await old.match(req);if(validArt(res))await put(art,artKey(req),res)}}}
  const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('sukun-')&&k!==CACHE&&k!==ART_CACHE).sort((a,b)=>vnum(b)-vnum(a)).slice(1).map(k=>caches.delete(k)));
  // Optional art is cached only by assetResponse when the page requests it.
  // Do not start detached warm-up work here: it competes with playback and may
  // be terminated at any point. Activation requires the verified shell only.
  await broadcastStatus({phase:'activated'});
 })());
});

const NET_TIMEOUT=3500;
async function timedFetch(request,ms=NET_TIMEOUT){
  try{return await fetchBuffered(request,ms)}catch(_){return null}
}
function isAppNavigation(request){
 const path=new URL(request.url).pathname;
 return [sameOriginPath('./'),sameOriginPath('./index.html'),sameOriginPath('./nero.html')].includes(path);
}
async function navigationResponse(request){
 if(!isAppNavigation(request))return assetResponse(request);
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
 // Navigation PNGs use their component revision in CSS. They still resolve
 // only to the canonical release bytes verified by REQUIRED_RUNTIME.
 const componentRevision=entry.url.match(/\/wheel-navigation-(r\d+)\//)?.[1];
 const componentAlias=isArt(url)&&requestedBuild===componentRevision;
 // A document from a later build cannot receive this worker's older executable.
 if(requestedBuild&&requestedBuild!==SURUM&&!componentAlias){
  if(/^r\d+$/.test(requestedBuild)&&vnum(requestedBuild)<vnum(SURUM)){
    for(const name of (await caches.keys()).filter(n=>n.startsWith('sukun-')&&n!==ART_CACHE)){
      const shell=await cachedShellFrom(name);if(shell?.build!==requestedBuild)continue;
      const old=await caches.open(name),marker=await old.match('./sukun-build-'+requestedBuild+'.json',{ignoreSearch:true});
      if(!marker)continue;
      try{
        const build=await marker.json();if(build.build!==requestedBuild&&build.v!==requestedBuild)continue;
        const expected=build.runtime?.find(e=>sameOriginPath(e.url)===url.pathname&&new URL(e.url,self.location.href).searchParams.get('v')===requestedBuild);
        if(!expected||!/^[a-f0-9]{64}$/i.test(expected.sha256))continue;
        const saved=await old.match(expected.url,{ignoreSearch:false});
        if(saved&&await sha256Response(saved)===expected.sha256)return saved;
      }catch(_){}
    }
    // A mutable online URL cannot identify a historical build.
    return Response.error();
  }
  try{return await fetchFresh(request.url)}catch(_){return Response.error()}
}
 const cached=await cache.match(entry.url,{ignoreSearch:false});
 if(cached&&await sha256Response(cached)===entry.sha256)return cached;
 try{const fresh=await fetchFresh(entry.url);if(await sha256Response(fresh)!==entry.sha256)throw Error('runtime hash mismatch');await put(cache,entry.url,fresh);return fresh}catch(_){return Response.error()}
}

function isArt(url){return /\.(?:png|jpe?g|webp|svg)$/i.test(url.pathname)&&url.pathname.includes('/assets/')}
function validArt(res){return res?.ok&&res.type!=='opaque'&&/^image\//i.test(res.headers.get('content-type')||'')}
function artKey(request){const url=new URL(request.url||request,self.location.href);url.searchParams.delete('v');url.searchParams.delete('t');return new Request(url.href)}
async function artResponse(request){
 const current=await caches.open(CACHE),art=await caches.open(ART_CACHE),key=artKey(request);
 const exact=await current.match(request,{ignoreSearch:false});if(validArt(exact)){await put(art,key,exact.clone());return exact}
 try{const fresh=await timedFetch(request,6000);if(!validArt(fresh))throw Error('art unavailable');await put(current,request,fresh.clone());await put(art,key,fresh.clone());return fresh}catch(_){const saved=await art.match(key);if(validArt(saved))return saved;return Response.error()}
}
async function assetResponse(request){
  const url=new URL(request.url),current=await caches.open(CACHE);
  const runtime=REQUIRED_RUNTIME.find(entry=>sameOriginPath(entry.url)===url.pathname);if(runtime)return runtimeResponse(request,runtime);
  if(isArt(url))return artResponse(request);
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
  // The shell stores a version-checked canonical manifest. Its current
  // build alias is safe offline; ordinary art never ignores its query.
  if(url.pathname===manifestPath&&(!url.searchParams.get('v')||url.searchParams.get('v')===SURUM)){
    const manifest=await current.match('./manifest.webmanifest',{ignoreSearch:false});
    if(manifest)try{const data=await manifest.clone().json();if(new URL(data.start_url||'',self.location.href).searchParams.get('v')===SURUM)return manifest}catch(_){}
  }
  const cached=await current.match(request,{ignoreSearch:false});
  if(cached)return cached;
  try{
    const res=await fetch(request);
    if(res?.ok&&res.type!=='opaque'&&(!/\.(?:png|jpe?g|webp|svg)$/i.test(url.pathname)||/^image\//i.test(res.headers.get('content-type')||'')))await put(current,request,res.clone());
    return res;
  }catch(e){
    const keys=(await caches.keys()).filter(k=>k.startsWith('sukun-')&&k!==CACHE&&k!==ART_CACHE).sort((a,b)=>vnum(b)-vnum(a));
    for(const k of keys){try{const c=await caches.open(k),r=await c.match(request,{ignoreSearch:false});if(r)return r}catch(_){} }
    return Response.error();
  }
}

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  event.respondWith(req.mode==='navigate'&&isAppNavigation(req)?navigationResponse(req):assetResponse(req));
});

self.addEventListener('message',event=>{
  const d=event.data||{},port=event.ports?.[0];
  if(d.type==='TEKKE_READY_STATUS'){
    event.waitUntil((async()=>{const art=await caches.open(ART_CACHE),paths=Array.isArray(d.paths)?d.paths.slice(0,40):[];let saved=0;for(const path of paths){try{const url=new URL(path,self.location.href);if(url.origin===self.location.origin&&isArt(url)&&validArt(await art.match(artKey(url.href))))saved++;}catch(_){}}port?.postMessage({shell:await tekkeShellReady(),saved,total:paths.length});})());return;
  }
  if(d.type==='ART_STATUS'){
    event.waitUntil((async()=>{const art=await caches.open(ART_CACHE),paths=Array.isArray(d.paths)?d.paths.slice(0,200):[];let saved=0;for(const path of paths){const url=new URL(path,self.location.href);if(url.origin===self.location.origin&&isArt(url)&&validArt(await art.match(artKey(url.href))))saved++}port?.postMessage({saved,total:paths.length})})());return;
  }
  if(d.type==='SKIP_WAITING'){
    event.waitUntil((async()=>{try{
      let ready=await updateDeadline(currentComplete,12000,'Önbellek doğrulama');
      if(!ready){const meta=await prepareShell();ready=!!meta.complete}
      if(!ready)throw Error('release incomplete');
      await updateDeadline(()=>self.skipWaiting(),4000,'Servis aktivasyonu');
      replyUpdate(port,{ok:true,v:SURUM,complete:true});
    }catch(e){replyUpdate(port,{ok:false,v:SURUM,complete:false,error:String(e?.message||e)})}})());return;
  }
  if(d.type==='SURUM_NOTU'){try{port?.postMessage({v:SURUM,notlar:NOTLAR})}catch(e){};return}
  if(d.type==='STATUS'){
    event.waitUntil((async()=>{try{
      const result=await updateDeadline(async()=>{const m=await readCacheMeta();return {v:SURUM,cache:CACHE,complete:await currentComplete(),marker:m,error:m?.errors?.join(' | ')||''}},12000,'Önbellek doğrulama');
      replyUpdate(port,result);
    }catch(e){replyUpdate(port,{v:SURUM,cache:CACHE,complete:false,error:String(e?.message||e)})}})());return;
  }
  if(d.type==='CACHE_REFRESH'){
    // Reply first. A delayed client enumeration must not hide verified readiness.
    event.waitUntil(prepareShell().then(async m=>{
      replyUpdate(port,{ok:!!m.complete,v:SURUM,cache:CACHE,complete:!!m.complete,marker:m,error:m.errors?.join(' | ')||''});
      try{await updateDeadline(()=>broadcastStatus({phase:'refresh'}),2000,'Durum bildirimi')}catch(_){}
    }).catch(e=>replyUpdate(port,{ok:false,v:SURUM,cache:CACHE,complete:false,error:String(e?.message||e)})));return;
  }
  if(d.type==='CHECK_UPDATE'){
    event.waitUntil((async()=>{try{await self.registration.update();port?.postMessage({ok:true,v:SURUM})}catch(e){port?.postMessage({ok:false,v:SURUM,error:String(e?.message||e)})}})());
  }
});
