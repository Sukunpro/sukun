/* SÜKÛN r949 — audio ownership, bounded scenes and phased visual scheduling
   Amaç: yeni sürümün "waiting/install mismatch" yüzünden eski shell'de
   kilitlenmesini önlemek. Controller değişimi aktif sesi kendiliğinden
   kesmez; sayfa reload kararı istemci tarafında verilir. */
'use strict';

const SURUM = 'r1023';
const ART_CACHE = 'sukun-art-persistent-v1';
const CACHE = 'sukun-r1023-session-labels-20261007-v1';
const CACHE_META = './sukun-cache-meta-r1023.json';
const BUILD_MARKER = './sukun-build-r1023.json';
const LATEST_MARKER = './sukun-latest.json';
const REQUIRED_RUNTIME = [{"url": "./assets/runtime/berhet-layout-r938.css?v=r1023", "sha256": "e963103a4742717dd1845452d7fba881210a7c901fe0193e284ec047d323b172"}, {"url": "./assets/runtime/berhet-materials-r933.css?v=r1023", "sha256": "4be10a5e23254a4644178d08e664177e1dab6275c8b0ce817d7bfeedbf5e2b24"}, {"url": "./assets/runtime/berhet-controls-r933.css?v=r1023", "sha256": "b446d7e2ea1041ee2bd350b042a67f4dbbcd9e98cbcf48c41368b6b5b9d5c415"}, {"url": "./assets/runtime/berhet-dock-r933.css?v=r1023", "sha256": "8ee1fba13a12f78500721cd6b5a5653b5a7d4914c02fa0be19046ebfd18bbc12"}, {"url": "./assets/runtime/background-owner-r949.js?v=r1023", "sha256": "0a76964b1cabf66ca701a1910a5938cc7046b78ed6ce8576b1000f47717c068e"}, {"url": "./assets/runtime/lifecycle-r949.js?v=r1023", "sha256": "23c80a9fdd863ed691402a0facc2119b6e72d86d8ec0bd9cfe2e42e4f67a8367"}, {"url": "./assets/runtime/audio-palette-r945.js?v=r1023", "sha256": "0df6131d56e869f22ba011a084300d4bb9ddddc4d41589e63436850492003bd1"}, {"url": "./assets/runtime/esma-scenes-r923.js?v=r1023", "sha256": "dc97cdaa6f31f63593f1576ad9ec7d3b206f0f55ff1b2aced8f43b0202d44854"}, {"url": "./assets/runtime/session-r919.js?v=r1023", "sha256": "659c21f0e122a18b34870ebefd89a86d1d8c28556c4746d8c3c1db44a8c21c16"}, {"url": "./assets/runtime/dock-r920.js?v=r1023", "sha256": "d9d86c7c21eb53e840b1f4fa968a3ab30b8c0e057dc2dc14a0704bae19ef3df0"}, {"url": "./assets/runtime/wheels-r924.js?v=r1023", "sha256": "3fdcfd5eb41e2f473eb86a8a16e6820e717cf679f327cdb9f73430b6301a1632"}, {"url": "./assets/runtime/berhet-layout-r938.js?v=r1023", "sha256": "e4b7019979fcd5c2921dac09a7162e9548e3e1740301e38eb580aaa01b3436da"}, {"url": "./assets/runtime/interface-r920.js?v=r1023", "sha256": "29f94e1b485d6b7281dfb3d30a1e0b2211a49ee660e1a06780cf8622c8f5afc0"}, {"url": "./assets/runtime/wheels-r924.css?v=r1023", "sha256": "22a07233940d7a8deebec8613885dcb534cd8a35482e0615b0ffd7febd240a2f"}, {"url": "./assets/runtime/berhet-theme-r933.js?v=r1023", "sha256": "da83b8f7c8abf49c00c3a11291da0c01a8484e742c4a920be9db3b7a56f6b434"}, {"url": "./assets/runtime/health-view-r943.css?v=r1023", "sha256": "51a89716056a0c9b823421bf39ec30d6de99dd182ad8373a19454aa6509596c3"}, {"url": "./assets/runtime/health-view-r943.js?v=r1023", "sha256": "91ef0974953e02ddaf64029de0c687764acdb370e74b8062c9a4aa7945c67c56"}, {"url": "./assets/runtime/scene-picker-r945.css?v=r1023", "sha256": "95038f4efddb07a52626b6701c9edaddd5c8831d1f327b18d5160ae2bb7154d2"}, {"url": "./assets/runtime/scene-picker-r945.js?v=r1023", "sha256": "1ed9d5905ed4c82834c69fb111d8fb24ad192d416a7c478c9075112b00794b75"}, {"url": "./assets/runtime/health-r940.js?v=r1023", "sha256": "298b64a623fb48206c0699371be9c308a04ed7c1fded80e6e37dfb83ab7713e5"}, {"url": "./assets/runtime/nefs-r948.css?v=r1023", "sha256": "94ccd9dad8bd65f2501f90d83bfb8aee1e27229fc7a3f497c5d51d0564848edf"}, {"url": "./assets/runtime/nefs-data-r948.js?v=r1023", "sha256": "c29f42eacaa014b90b87b85d906f2468f91a8347ddd486467b9ad1d7c39c214c"}, {"url": "./assets/runtime/nefs-model-r948.js?v=r1023", "sha256": "b5d4f9673e26f01ea5cb3714f5c45a1ca41c1cee1745f72461ed71b54fc7185b"}, {"url": "./assets/runtime/nefs-ui-r948.js?v=r1023", "sha256": "8201e3904068e222f32a3ad704188c620c48ccc2c25091668854b5e6e12e5721"}, {"url": "./assets/runtime/offline-scenes-r962.js?v=r1023", "sha256": "d1afd56086c4f2535ae6ddaf4324a63a1864b71a63da53e72c6ceb25ece974ba"}, {"url": "./assets/wheel-navigation-r964/gold.png?v=r1023", "sha256": "3ed982ef9fdc057c97416b6837b780f08ffb0f9e0a9eca0daa973ddfc3660ca2"}, {"url": "./assets/wheel-navigation-r964/copper.png?v=r1023", "sha256": "b731ba244c0f04a972276580a70e3b203a8a9e839abe35841cfd08c372283012"}, {"url": "./assets/wheel-navigation-r964/silver.png?v=r1023", "sha256": "d7095d1597bdeb288035bd3aa87c4168c63a4dd6b98c7f6ab860f0f7c24a516f"}, {"url": "./assets/wheel-navigation-r964/dark.png?v=r1023", "sha256": "c6407489d8c52d1b65985dbbdb8d5c3df625b184739c413c40c6d423d70c55bb"}, {"url": "./assets/wheel-navigation-r964/crystal.png?v=r1023", "sha256": "dd751abc6483a3c5f3585e170d0c9888fdef5ccb69e276bd61d765b33bdb6b85"}, {"url": "./assets/runtime/presentation-r979.js?v=r1023", "sha256": "12a36845037782ccf9fe851b3b498cd856771b85d412facb0e928918f70eaa19"}, {"url": "./assets/runtime/audio-cpu-r981.js?v=r1023", "sha256": "daba8b6eff390454fc7391aa80fdcf1f9e5db7d3a8b7d07d9be93abfb0cd0f4f"}, {"url": "./assets/runtime/audio-preparation-r981.js?v=r1023", "sha256": "2765a389211c07220f996061843727273c34e5b8f6aeb326002afb6dc3d8eea9"}, {"url": "./assets/runtime/tab-owner-r981.js?v=r1023", "sha256": "d24db3b8292038910df842b34a3b2f6fc45acb374ba9828315dfb4d96e2a6537"}, {"url": "./assets/runtime/cadence-r981.css?v=r1023", "sha256": "e8551396049c455e9c340c71e7d343ebbaf2f4cdeacc80bcb82e8d6046889992"}, {"url": "./assets/runtime/cadence-r981.js?v=r1023", "sha256": "f9bd5dbaaaaf20fb5523afdcf00dec639ef17b2bf6b0cf6462c872dff9aa9cda"}, {"url": "./assets/runtime/studio-preparation-r982.js?v=r1023", "sha256": "b59af5742f1f4cf86e60277f2a941034d13fdac98c47e64fb737883ae551c24e"}, {"url": "./assets/runtime/progress-journal-r982.js?v=r1023", "sha256": "b7fbd70dbcf9d08abdd88ec2c2d29566d56d75c8c76aca7ce7347149f59b48bc"}, {"url": "./assets/runtime/tekke-sequence-r988.js?v=r1023", "sha256": "c453373ee648876e06413a6272c27d4669d5abb895a495792f8fe52d1e7fe5f8"}, {"url": "./assets/runtime/tekke-set-r990.js?v=r1023", "sha256": "1e3b3baf822bd83a1f24cae1cab28aee9f54312aa644f8b3eaca07d8ad8a6f0a"}, {"url": "./assets/runtime/tekke-ux-r992.css?v=r1023", "sha256": "8fde58107301e708b36c16a8f25093dfed6144711b5ab6775199355109123113"}, {"url": "./assets/runtime/tekke-ux-r992.js?v=r1023", "sha256": "9baa78b9bc30249160be39e5f8d89fdbc5b5fbc8d0615ec4a6d0856423bee89d"}, {"url": "./assets/runtime/tekke-journey-r993.css?v=r1023", "sha256": "1173ffc1a32c8201c990d26996cf44020195a1e9a65540f5c37ad8cbae1df863"}, {"url": "./assets/runtime/tekke-journey-r993.js?v=r1023", "sha256": "0b09636e3ba8978dcf7e92221d03fb25ebe73d81feb61bef26ca1e408080e61a"}, {"url": "./assets/scenes/tekke-r1014/berhet-billur.webp?v=r1023", "sha256": "17cbb4b7cc419bcc7e4fd0618c012ede1104523ed956aeed380280d169af6a50"}, {"url": "./assets/runtime/recording-continuity-r1016.js?v=r1023", "sha256": "81b728a119d5dd0a10d9d28dcf87224def17d4876a50f718e1a5aae12e7e8d8e"}, {"url": "./assets/runtime/recording-inspection-r1020.js?v=r1023", "sha256": "0e85827711831bc60ab62f6e7ef30397f087a75f25715d50cb04036119ab8c04"}, {"url": "./assets/runtime/studio-batch-r1020.js?v=r1023", "sha256": "b3fec4c8f222778500e9eeaa67ca8fb054e510ffadca252618d866cfc99f0bda"}, {"url": "./assets/runtime/recovery-versions-r1019.js?v=r1023", "sha256": "6ec06065e10db9268e88d06fcd0f226cb9b4572754772f7484ada01e4e6cde77"}, {"url": "./assets/runtime/recovery-data-r1020.js?v=r1023", "sha256": "df96ed113ee05fe8865555c991e0ff907f394aff3e4e4525ac166d70d1961fbb"}, {"url": "./assets/runtime/site-backup-r1020.js?v=r1023", "sha256": "f9b983f5c909c7aa7993ef253be95e5aa904a5a27b35e20549d7b817cbaec685"}, {"url": "./assets/runtime/recovery-ui-r1019.js?v=r1023", "sha256": "54468ea9aa52047ffcb76d2271b3f7cecab8b0e98877f2c0381abb031241e541"}, {"url": "./assets/runtime/recording-salvage-r1020.js?v=r1023", "sha256": "fb0f99eb5d3fdffdbdd4322a184c01c7db11c1f1dafdaf7374f0e27f9fadc455"}];

/* Kurulumu kırabilecek büyük/görsel dosyaları zorunlu listeye koymuyoruz.
   Shell doğrulaması bağımsız; geri kalan assetler yalnız görünüm istediğinde
   normal fetch sırasında ortak görsel cache'ine yazılır. Toplu görsel indirme
   install/activate yaşam döngüsünü veya aktif ses oturumunu meşgul etmez. */
const CORE = [
  "./assets/runtime/recording-salvage-r1020.js?v=r1023",
  "./sukun-site-assets-r1023.json?v=r1023",
  "./assets/runtime/recovery-ui-r1019.js?v=r1023",
  "./assets/runtime/site-backup-r1020.js?v=r1023",
  "./assets/runtime/recovery-data-r1020.js?v=r1023",
  "./assets/runtime/recovery-versions-r1019.js?v=r1023",
  "./assets/runtime/studio-batch-r1020.js?v=r1023",
  './assets/runtime/recording-inspection-r1020.js?v=r1023',
  './assets/runtime/recording-continuity-r1016.js?v=r1023',
  "./assets/runtime/offline-scenes-r962.js?v=r1023",
  "./assets/wheel-navigation-r964/gold.png?v=r1023",
  "./assets/wheel-navigation-r964/copper.png?v=r1023",
  "./assets/wheel-navigation-r964/silver.png?v=r1023",
  "./assets/wheel-navigation-r964/dark.png?v=r1023",
  "./assets/wheel-navigation-r964/crystal.png?v=r1023",

  "./assets/runtime/tekke-journey-r993.css?v=r1023",
  "./assets/runtime/tekke-journey-r993.js?v=r1023",

  "./assets/runtime/tekke-ux-r992.css?v=r1023",
  "./assets/runtime/tekke-ux-r992.js?v=r1023",

  "./assets/runtime/tekke-set-r990.js?v=r1023",


  "./assets/runtime/tekke-sequence-r988.js?v=r1023",

  "./assets/runtime/studio-preparation-r982.js?v=r1023",
  "./assets/runtime/progress-journal-r982.js?v=r1023",

  "./assets/runtime/audio-cpu-r981.js?v=r1023",
  "./assets/runtime/audio-preparation-r981.js?v=r1023",
  "./assets/runtime/tab-owner-r981.js?v=r1023",
  "./assets/runtime/cadence-r981.css?v=r1023",
  "./assets/runtime/cadence-r981.js?v=r1023",

  "./assets/runtime/presentation-r979.js?v=r1023",
  "./assets/runtime/lifecycle-r949.js?v=r1023",
  "./assets/runtime/background-owner-r949.js?v=r1023",
  "./assets/runtime/berhet-layout-r938.css?v=r1023",
  "./assets/runtime/berhet-materials-r933.css?v=r1023",
  "./assets/runtime/berhet-controls-r933.css?v=r1023",
  "./assets/runtime/berhet-dock-r933.css?v=r1023",
  "./assets/runtime/audio-palette-r945.js?v=r1023",
  "./assets/runtime/esma-scenes-r923.js?v=r1023",
  "./assets/runtime/session-r919.js?v=r1023",
  "./assets/runtime/dock-r920.js?v=r1023",
  "./assets/runtime/wheels-r924.js?v=r1023",
  "./assets/runtime/berhet-layout-r938.js?v=r1023",
  "./assets/runtime/interface-r920.js?v=r1023",
  "./assets/runtime/wheels-r924.css?v=r1023",
  "./assets/runtime/berhet-theme-r933.js?v=r1023",
  "./assets/runtime/health-view-r943.css?v=r1023",
  "./assets/runtime/health-view-r943.js?v=r1023",
  "./assets/runtime/scene-picker-r945.css?v=r1023",
  "./assets/runtime/scene-picker-r945.js?v=r1023",
  "./assets/runtime/health-r940.js?v=r1023",
  "./assets/runtime/nefs-r948.css?v=r1023",
  "./assets/runtime/nefs-data-r948.js?v=r1023",
  "./assets/runtime/nefs-model-r948.js?v=r1023",
  "./assets/runtime/nefs-ui-r948.js?v=r1023",





















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

const NOTLAR = ["Kayıt koruması: yarım kalmış veri kurtarma günlüğü açılışta otomatik uygulanmaz. Tam veri geri yükleme ve toplu silme inceleme sırasında kapalıdır.", "🛟 Kayıp sesler: eski kişisel veri noktaları, stüdyo asılları ve doğrulanmış JSON yedekleri taranır. Yalnız eksik sesler eklenir; mevcut sesler değiştirilmez.", "Güncel depo sonucu ile önceki dolu gözlem ayrı gösterilir. Sıfır sonucu geçmişi silmez; okumalar eksik bir ses deposunu kendiliğinden oluşturmaz.", "Önbelleği yenileme sesleri veya ayarları silmez. Eski ve gizli veri noktaları ile stüdyo kopyaları korunur. r1019 sürümüne dönüş engellenmiştir.", "İsteğe bağlı görseller ortak önbelleğe alınır; sürüm başına yeniden çoğaltılmaz. Yerel kopya kalmamış seslerin kurtarılması için harici JSON yedeği gerekir."];

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


/* r1019 recovery: verified code caches only. Personal IndexedDB/localStorage
   are never read or replaced here. A pin outlives the service-worker process. */
const RECOVERY_CONTROL_CACHE = 'sukun-recovery-control-v1';
const RECOVERY_STATE_KEY = './__sukun_recovery_state__';
const RECOVERY_ROUTE = './__sukun_recovery__';
const RECOVERY_MAX_PREVIOUS = 5;
// r1019 could replay an automatic restore journal at startup. A later worker
// must never reopen that shell through rollback, a persisted pin, or fallback.
const RECOVERY_BLOCKED_BUILDS = new Set(['r1019']);
const recoveryUnsafeBuild = build => build!==SURUM&&RECOVERY_BLOCKED_BUILDS.has(build);
function recoveryUnsafeExecutable(url){
 if(url.origin!==self.location.origin||!/\.(?:m?js|css|html)$/i.test(url.pathname))return false;
 // An old controlled tab can ask for a file absent from the current manifest;
 // reject before generic cache/network fallback has a chance to serve it.
 if(url.searchParams.getAll('v').some(recoveryUnsafeBuild))return true;
 return recoveryUnsafeBuild('r1019')&&url.pathname===sameOriginPath('./assets/runtime/recovery-data-r1019.js');
}
const isAppCacheName = name => /^sukun-r\d+(?:-|$)/.test(String(name));
const recoveryUrl = path => new URL(path,self.location.href).href;
const recoveryPath = path => new URL(path,self.location.href).pathname;
let recoveryMutation = Promise.resolve();
function recoverySerialize(work){
 const next=recoveryMutation.then(work,work);recoveryMutation=next.catch(()=>{});return next;
}
async function recoveryReadState(){
 const c=await caches.open(RECOVERY_CONTROL_CACHE),r=await c.match(RECOVERY_STATE_KEY);
 if(!r)return {schema:1,pin:null};
 let d;try{d=await r.json()}catch(_){throw Error('RECOVERY_STATE_UNREADABLE')}
 if(d?.schema!==1||d.pin!=null&&(!isAppCacheName(d.pin.cache)||!/^r\d+$/.test(d.pin.build||'')))throw Error('RECOVERY_STATE_UNREADABLE');
 return d;
}
async function recoveryWriteState(data){
 const c=await caches.open(RECOVERY_CONTROL_CACHE);
 await c.put(RECOVERY_STATE_KEY,new Response(JSON.stringify({...data,schema:1,at:Date.now()}),{headers:{'Content-Type':'application/json'}}));
}
function recoveryProofKey(name){return './__sukun_recovery_proof__/'+encodeURIComponent(name)}
async function recoveryReadProof(name){
 try{const c=await caches.open(RECOVERY_CONTROL_CACHE),r=await c.match(recoveryProofKey(name));return r?await r.json():null}catch(_){return null}
}
function recoveryAttribute(tag,name){
 const m=String(tag).match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return m?(m[1]??m[2]??m[3]):'';
}
function recoveryExecutables(html){
 const out=[];
 for(const tag of String(html).match(/<(?:script|link)\b[^>]*>/gi)||[]){
  const isScript=/^<script\b/i.test(tag),rel=recoveryAttribute(tag,'rel');
  if(!isScript&&!/\bstylesheet\b/i.test(rel))continue;
  const path=recoveryAttribute(tag,isScript?'src':'href');if(!path)continue;
  const url=new URL(path,self.location.href);if(url.origin!==self.location.origin)continue;
  out.push({url:url.href,integrity:recoveryAttribute(tag,'integrity')});
 }
 return out;
}
function recoveryHexToBase64(hex){
 let raw='';for(let i=0;i<hex.length;i+=2)raw+=String.fromCharCode(parseInt(hex.slice(i,i+2),16));return btoa(raw);
}
async function recoveryVerifyCache(name,enroll=false){
 if(!isAppCacheName(name))return null;
 try{
  const cache=await caches.open(name),htmlResponse=await cache.match('./nero.html',{ignoreSearch:true});
  if(!htmlResponse?.ok)return null;
  const html=await htmlResponse.clone().text(),build=buildOfHtml(html);if(!/^r\d+$/.test(build)||!name.startsWith('sukun-'+build+'-')||recoveryUnsafeBuild(build))return null;
  const metaResponse=await cache.match('./sukun-cache-meta-'+build+'.json',{ignoreSearch:true});
  const markerResponse=await cache.match('./sukun-build-'+build+'.json',{ignoreSearch:true});
  const manifestResponse=await cache.match('./manifest.webmanifest',{ignoreSearch:true});
  if(!metaResponse?.ok||!markerResponse?.ok||!manifestResponse?.ok)return null;
  const meta=await metaResponse.clone().json(),marker=await markerResponse.clone().json(),manifest=await manifestResponse.clone().json();
  if(!meta.complete||meta.v!==build||(meta.cache&&meta.cache!==name)||(marker.build||marker.v)!==build||manifest.short_name!=='SÜKÛN'||new URL(manifest.start_url||'',self.location.href).searchParams.get('v')!==build)return null;
  if(!Array.isArray(marker.runtime)||!marker.runtime.length)return null;
  const expected=new Map();
  for(const entry of marker.runtime){
   if(typeof entry?.url!=='string'||!/^[a-f0-9]{64}$/i.test(entry.sha256||''))return null;
   const url=new URL(entry.url,self.location.href);
   if(url.origin!==self.location.origin||url.searchParams.get('v')!==build||expected.has(url.href))return null;
   const response=await cache.match(entry.url,{ignoreSearch:false});
   if(!response?.ok||await sha256Response(response)!==entry.sha256.toLowerCase())return null;
   expected.set(url.href,entry.sha256.toLowerCase());
  }
  for(const entry of recoveryExecutables(html)){
   const digest=expected.get(entry.url);if(!digest||!entry.integrity.split(/\s+/).includes('sha256-'+recoveryHexToBase64(digest)))return null;
  }
  const shellSha256=await sha256Response(htmlResponse),markerSha256=await sha256Response(markerResponse),manifestSha256=await sha256Response(manifestResponse);
  // New releases may publish a shell digest in their build marker. Older
  // releases are enrolled only after complete runtime + HTML SRI validation.
  if(marker.shell?.sha256&&marker.shell.sha256!==shellSha256)return null;
  const proof=await recoveryReadProof(name);
  if(proof&&(proof.build!==build||proof.shellSha256!==shellSha256||proof.markerSha256!==markerSha256||proof.manifestSha256!==manifestSha256))return null;
  const result={build,cache:name,at:Number(meta.at)||0,shellSha256,markerSha256,manifestSha256,shellBytes:Number(htmlResponse.headers.get('content-length'))||new TextEncoder().encode(html).byteLength,runtimeCount:marker.runtime.length,verified:true};
  if(!proof){
   if(!enroll)return null;
   const controls=await caches.open(RECOVERY_CONTROL_CACHE);
   await controls.put(recoveryProofKey(name),new Response(JSON.stringify({...result,verifiedAt:Date.now()}),{headers:{'Content-Type':'application/json'}}));
  }
  return result;
 }catch(_){return null}
}
async function recoveryVersions(enroll=true){
 const names=(await caches.keys()).filter(isAppCacheName),entries=[];
 for(const name of names){const entry=await recoveryVerifyCache(name,enroll);if(entry)entries.push(entry)}
 entries.sort((a,b)=>vnum(b.build)-vnum(a.build)||b.at-a.at||a.cache.localeCompare(b.cache));
 const state=await recoveryReadState(),unique=[];
 for(const entry of entries){const existing=unique.find(e=>e.build===entry.build);if(!existing)unique.push(entry);else if(entry.cache===state.pin?.cache||entry.cache===CACHE)unique[unique.indexOf(existing)]=entry}
 const current=unique.find(e=>e.cache===CACHE)||null;
 const previous=unique.filter(e=>vnum(e.build)<vnum(SURUM));
 return {current:SURUM,currentCache:CACHE,currentReady:!!current,selected:state.pin?.build||SURUM,rollback:!!state.pin,maxPrevious:RECOVERY_MAX_PREVIOUS,availablePrevious:previous.length,versions:unique.filter(e=>vnum(e.build)<=vnum(SURUM)).map(e=>({...e,current:e.cache===CACHE,selected:e.cache===(state.pin?.cache||CACHE)}))};
}
async function recoveryPrune(){
 const state=await recoveryReadState(),report=await recoveryVersions(true),keep=new Set([CACHE]);
 const previous=report.versions.filter(e=>vnum(e.build)<vnum(SURUM)).slice(0,RECOVERY_MAX_PREVIOUS);
 if(state.pin&&!previous.some(e=>e.cache===state.pin.cache)){
  const pinned=report.versions.find(e=>e.cache===state.pin.cache);if(pinned){if(previous.length>=RECOVERY_MAX_PREVIOUS)previous.pop();previous.push(pinned)}
 }
 for(const entry of previous)keep.add(entry.cache);
 // Every executable history entry must verify; artwork and unrelated caches
 // are deliberately outside this predicate and cannot be deleted.
 for(const name of (await caches.keys()).filter(isAppCacheName))if(vnum(name)<=vnum(SURUM)&&!keep.has(name))await caches.delete(name);
 return recoveryVersions(false);
}
let recoveryPinMemo=null;
async function recoveryPinned(){
 const state=await recoveryReadState();if(!state.pin){recoveryPinMemo=null;return null;}
 if(recoveryUnsafeBuild(state.pin.build))throw Error('UNSAFE_PIN');
 if(!recoveryPinMemo||recoveryPinMemo.cache!==state.pin.cache){recoveryPinMemo={cache:state.pin.cache,check:recoveryVerifyCache(state.pin.cache,false)};}
 const entry=await recoveryPinMemo.check;
 if(!entry||entry.build!==state.pin.build)throw Error('PIN_INVALID');return entry;
}
async function recoverySource(event){
 const id=event.source?.id;if(!id)throw Error('SAME_ORIGIN_WINDOW_REQUIRED');
 const client=await self.clients.get(id);if(!client||client.type!=='window')throw Error('SAME_ORIGIN_WINDOW_REQUIRED');
 const url=new URL(client.url),scope=new URL(self.registration.scope||'./',self.location.href);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(scope.pathname))throw Error('SAME_ORIGIN_WINDOW_REQUIRED');
 return client;
}
async function recoverySingleSource(event){
 const client=await recoverySource(event);
 const all=await self.clients.matchAll({type:'window',includeUncontrolled:true}),scope=new URL(self.registration.scope||'./',self.location.href);
 if(all.some(c=>{try{const u=new URL(c.url);return c.id!==client.id&&u.origin===scope.origin&&u.pathname.startsWith(scope.pathname)}catch(_){return false}}))throw Error('OTHER_APP_TAB_OPEN');
 return client;
}
async function recoveryMutationSource(event){
 if(event.data?.confirm!==true)throw Error('EXPLICIT_CONFIRM_REQUIRED');
 return recoverySingleSource(event);
}
async function recoverySwitch(event,mode){
 await recoveryMutationSource(event);
 const expiresAt=Math.min(Number(event.data?.expiresAt)||Date.now()+55000,Date.now()+55000);
 const assertLive=()=>{if(Date.now()>=expiresAt)throw Error('RECOVERY_REQUEST_EXPIRED')};assertLive();
 if(mode==='current'){
  const current=await recoveryVerifyCache(CACHE,true);if(!current)throw Error('CURRENT_NOT_VERIFIED');
  await recoveryMutationSource(event);assertLive();recoveryPinMemo=null;
  await recoveryWriteState({schema:1,pin:null});return {ok:true,build:SURUM,cache:CACHE,rollback:false,reload:true};
 }
 const {cache,build}=event.data||{};
 if(recoveryUnsafeBuild(build)||recoveryUnsafeBuild(String(cache||'').match(/^sukun-(r\d+)(?:-|$)/)?.[1]))throw Error('HISTORICAL_BUILD_UNSAFE');
 const report=await recoveryVersions(true);
 const targets=report.versions.filter(e=>vnum(e.build)<vnum(SURUM)).slice(0,RECOVERY_MAX_PREVIOUS);
 const entry=targets.find(e=>e.cache===cache&&e.build===build);if(!entry)throw Error('HISTORICAL_BUILD_UNAVAILABLE');
 const verified=await recoveryVerifyCache(entry.cache,false);if(!verified)throw Error('HISTORICAL_BUILD_NOT_VERIFIED');
 await recoveryMutationSource(event);assertLive();recoveryPinMemo=null;
 await recoveryWriteState({schema:1,pin:{cache:entry.cache,build:entry.build,at:Date.now()}});
 return {ok:true,build:entry.build,cache:entry.cache,rollback:true,reload:true};
}
function recoveryUnavailable(error){
 const message=String(error?.message||error||'Önbellek okunamadı');
 return new Response('<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SÜKÛN Kurtarma</title><body style="background:#071219;color:#f3ead0;font:16px/1.7 system-ui;padding:24px"><h1>Korunan sürüm açılamadı</h1><p>Doğrulama başarısız olduğu için başka sürümün dosyalarıyla karıştırılmadı.</p><p><a style="color:#9fdfc4" href="'+RECOVERY_ROUTE+'">Kurtarma aracını aç</a></p><p>'+message.replace(/[<&]/g,'')+'</p></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
async function recoveryNavigation(request,pin){
 const cache=await caches.open(pin.cache),res=await cache.match('./nero.html',{ignoreSearch:true});if(!res)return recoveryUnavailable('PIN_SHELL_MISSING');
 if(await sha256Response(res)!==pin.shellSha256)return recoveryUnavailable('PIN_SHELL_CHANGED');
 const html=await res.text(),link='<a href="'+RECOVERY_ROUTE+'" style="position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#081d28;color:#d5fff1;padding:10px 14px;border:1px solid #7fb8ad;border-radius:12px;font:14px system-ui;text-decoration:none" aria-label="Kurtarma ve güncel sürüme dönüş">🛟 '+pin.build+' · Kurtarma</a>';
 const body=html.includes('</body>')?html.replace('</body>',link+'</body>'):html+link;
 const headers=new Headers(res.headers);headers.delete('content-length');headers.set('Cache-Control','no-store');return new Response(body,{status:res.status,headers});
}
async function recoveryAsset(request,pin){
 const cache=await caches.open(pin.cache),url=new URL(request.url),markerResponse=await cache.match('./sukun-build-'+pin.build+'.json',{ignoreSearch:true});
 if(!markerResponse||await sha256Response(markerResponse)!==pin.markerSha256)return Response.error();
 const marker=await markerResponse.clone().json();
 const entry=marker.runtime.find(e=>recoveryPath(e.url)===url.pathname);
 if(entry){
  const requested=url.searchParams.get('v'),revision=entry.url.match(/\/wheel-navigation-(r\d+)\//)?.[1];
  if(requested&&requested!==pin.build&&!(isArt(url)&&requested===revision))return Response.error();
  const res=await cache.match(entry.url,{ignoreSearch:false});return res&&await sha256Response(res)===entry.sha256?res:Response.error();
 }
 if(url.pathname===recoveryPath('./manifest.webmanifest')){const res=await cache.match('./manifest.webmanifest',{ignoreSearch:true});return res&&await sha256Response(res)===pin.manifestSha256?res:Response.error();}
 if(url.pathname===recoveryPath(LATEST_MARKER))return new Response(JSON.stringify({v:pin.build,build:pin.build,latest:pin.build,recoveryPinned:true,worker:SURUM}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(url.pathname===recoveryPath('./sukun-build-'+pin.build+'.json'))return markerResponse;
 if(/\.(?:m?js|css|html)$/i.test(url.pathname)||/\/(?:sukun-build-r\d+|__sukun_build_r\d+__)\.json$/.test(url.pathname))return Response.error();
 const exact=await cache.match(request,{ignoreSearch:false});if(exact)return exact;
 // Artwork is non-executable and persists independently; no network request
 // can replace a historical runtime, stylesheet, manifest, or shell.
 if(isArt(url)){const art=await caches.open(ART_CACHE),res=await art.match(artKey(request));if(validArt(res))return res;}
 return Response.error();
}
function recoveryPage(){
 const html='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SÜKÛN Kurtarma</title><style>body{margin:0;background:#081820;color:#f3ead0;font:16px/1.6 system-ui}main{max-width:640px;margin:auto;padding:22px}button,a{font:inherit;border:1px solid #557d75;border-radius:12px;padding:12px;color:#fff;background:#153c39;cursor:pointer;display:block;margin:12px 0}button:disabled{opacity:.45}li{margin:15px 0}small{color:#b1c6c2}</style><main><h1>🛟 SÜKÛN Kurtarma</h1><p>Yalnız bu cihazda doğrulanmış uygulama sürümleri açılır. Kişisel kayıtlar ve ayarlar değiştirilmez.</p><p id="status" role="status">Sürümler kontrol ediliyor…</p><button id="current" disabled>Güncel sürüme dön</button><ul id="versions"></ul><a href="./nero.html">Uygulamayı aç</a><small>Başka SÜKÛN sekmesi açıksa kapat. Eski sürüm, daha yeni kişisel veri biçimlerini desteklemeyebilir. Ses ve ayar yedeğini güncel sürümden ayrıca al.</small></main><script>(function(){const status=document.getElementById("status"),current=document.getElementById("current"),list=document.getElementById("versions");let busy=false;async function ask(type,extra){const worker=navigator.serviceWorker.controller;if(!worker)throw Error("Etkin servis çalışanı yok. Bu sayfayı yeniden aç.");return new Promise((resolve,reject)=>{const ch=new MessageChannel(),timer=setTimeout(()=>reject(Error("Kontrol zaman aşımı")),60000);ch.port1.onmessage=e=>{clearTimeout(timer);ch.port1.close();e.data.ok===false?reject(Error(e.data.error)):resolve(e.data)};worker.postMessage(Object.assign({type},extra),[ch.port2])})}async function act(type,extra){if(busy)return;if(!confirm("Uygulama sürümü değiştirilsin mi? Kişisel kayıtlar geri yüklenmez."))return;busy=true;current.disabled=true;list.querySelectorAll("button").forEach(b=>b.disabled=true);try{await ask(type,Object.assign({confirm:true,expiresAt:Date.now()+55000},extra));location.href="./nero.html"}catch(e){status.textContent=e.message;busy=false;await refresh()}}async function refresh(){try{const r=await ask("RECOVERY_LIST");status.textContent="Açılan sürüm: "+r.selected+" · güncel: "+r.current+" · mevcut eski sürüm: "+r.availablePrevious+" / en çok 5";current.disabled=!r.rollback;list.replaceChildren();for(const v of r.versions.filter(v=>!v.current).slice(0,5)){const li=document.createElement("li"),b=document.createElement("button");b.textContent=v.build+(v.selected?" · seçili":" · bu sürüme dön");b.disabled=v.selected;b.onclick=()=>act("RECOVERY_ROLLBACK",{cache:v.cache,build:v.build});li.append(b);list.append(li)}}catch(e){status.textContent=e.message}}current.onclick=()=>act("RECOVERY_CURRENT");refresh()})();<\/script></html>';
 return new Response(html.replace('<\\/script>','</script>'),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
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
 try{const pin=await recoveryPinned();if(pin)return true;if(!await currentComplete())return false;const cache=await caches.open(CACHE);let htmlReady=false;
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
  let shellDigestReady=true;
  try{const markerResponse=staged.find(e=>e[0]===BUILD_MARKER)?.[1],htmlResponse=staged.find(e=>e[0]==='./nero.html')?.[1],marker=markerResponse?await markerResponse.clone().json():null;if(marker?.shell?.sha256)shellDigestReady=!!htmlResponse&&await sha256Response(htmlResponse)===marker.shell.sha256;if(!shellDigestReady)meta.errors.push('HTML SHA-256 uyuşmazlığı')}catch(_){shellDigestReady=false;meta.errors.push('HTML doğrulaması başarısız')}
  const valid=shellDigestReady&&meta.shell&&meta.manifest&&meta.marker&&REQUIRED_RUNTIME.every(e=>meta.runtime[e.url]);
  if(valid){for(const [key,response] of staged){live();if(!await put(cache,key,response)){meta.errors.push('cache write:'+key);await writeCacheMeta(meta);return meta}}}
  live();meta.complete=valid;
  const stored=await writeCacheMeta(meta);if(!stored)throw Error('cache metadata write failed');return meta;
 },60000,'Dosya doğrulama');
 prepareInFlight=task;task.finally(()=>{if(prepareInFlight===task)prepareInFlight=null}).catch(()=>{});return task;
}

async function cachedShellFrom(cacheName){
 if(recoveryUnsafeBuild(String(cacheName||'').match(/^sukun-(r\d+)(?:-|$)/)?.[1]))return null;
 try{const entry=await recoveryVerifyCache(cacheName,true);if(!entry)return null;const c=await caches.open(cacheName),res=await c.match('./nero.html',{ignoreSearch:true});return res?{res,build:entry.build,cache:cacheName}:null}catch(_){return null}
}
async function bestCachedShell(){
  const current=await cachedShellFrom(CACHE);if(current)return current;
  const keys=(await caches.keys()).filter(k=>isAppCacheName(k)&&k!==CACHE)
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
  // Optional visuals are shared once across the retained releases. Migration
  // only removes a duplicate after its shared bytes match; release-manifest
  // runtime images remain in every release's verified cache.
  try{await compactOptionalArt()}catch(_){}
  await recoveryPrune();
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
 try{const pin=await recoveryPinned();if(pin)return recoveryNavigation(request,pin)}catch(e){return recoveryUnavailable(e)}
 try{
  const fresh=await fetchFresh(request.url,6500),build=buildOfHtml(await fresh.clone().text());
  if(build===SURUM){
   if(!await currentComplete())await prepareShell();
   if(await currentComplete()){const cache=await caches.open(CACHE),markerResponse=await cache.match(BUILD_MARKER,{ignoreSearch:true});const marker=markerResponse?await markerResponse.json():null;if(marker?.shell?.sha256&&await sha256Response(fresh)!==marker.shell.sha256)throw Error('HTML SHA-256 mismatch');const proof=await recoveryReadProof(CACHE);if(proof&&await sha256Response(fresh)!==proof.shellSha256)throw Error('HTML snapshot changed');await put(cache,'./nero.html',fresh);return fresh}
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
    for(const name of (await caches.keys()).filter(n=>isAppCacheName(n))){
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
// This ceiling stops new optional admissions; it never evicts a user's
// already available offline scenes to make room for another scene. Cache
// storage shares the origin quota with recordings, so leave a reserve when
// an estimate is available. No personal data store is accessed here.
const ART_MAX_BYTES=256*1024*1024,ART_MAX_ENTRIES=400,ART_QUOTA_RESERVE=64*1024*1024;
let artBudgetPromise=null,artWriteQueue=Promise.resolve();
async function artByteLength(response){
 const reader=response.clone().body?.getReader();if(!reader)return 0;
 let bytes=0;
 try{for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>ART_MAX_BYTES){try{await reader.cancel()}catch(_){}return bytes}}return bytes}
 finally{try{reader.releaseLock()}catch(_){}}
}
async function artBudget(cache){
 if(!artBudgetPromise)artBudgetPromise=(async()=>{
  const sizes=new Map();let bytes=0;
  for(const request of await cache.keys()){
   const response=await cache.match(request);if(!response)continue;
   const size=await artByteLength(response);sizes.set(request.url,size);bytes+=size;
  }
  return {sizes,bytes};
 })().catch(error=>{artBudgetPromise=null;throw error});
 return artBudgetPromise;
}
async function artHasHeadroom(bytes){
 try{
  const storage=self.navigator?.storage;if(typeof storage?.estimate!=='function')return true;
  const estimate=await storage.estimate(),quota=Number(estimate.quota),usage=Number(estimate.usage);
  if(Number.isFinite(quota)&&quota>0&&Number.isFinite(usage)&&usage>=0)return quota-usage>=Math.max(ART_QUOTA_RESERVE,bytes*2);
 }catch(_){}
 return true;
}
function storeOptionalArt(request,response){
 const work=async()=>{
  if(!validArt(response))return false;
  const cache=await caches.open(ART_CACHE),key=artKey(request),budget=await artBudget(cache),size=await artByteLength(response);
  const previous=budget.sizes.get(key.url)||0,newBytes=budget.bytes-previous+size;
  if(size>ART_MAX_BYTES||newBytes>ART_MAX_BYTES||(!budget.sizes.has(key.url)&&budget.sizes.size>=ART_MAX_ENTRIES)||!await artHasHeadroom(Math.max(0,size-previous)))return false;
  if(!await put(cache,key,response))return false;
  budget.bytes=newBytes;budget.sizes.set(key.url,size);return true;
 };
 const result=artWriteQueue.then(work,work).catch(()=>false);artWriteQueue=result.then(()=>{});return result;
}
async function compactOptionalArt(){
 const shared=await caches.open(ART_CACHE);
 // Newer artwork wins the unversioned shared key. A differing older image
 // keeps its own release copy; only a verified identical duplicate is deleted.
 const names=(await caches.keys()).filter(isAppCacheName).sort((a,b)=>vnum(b)-vnum(a));
 for(const name of names){
  const cache=await caches.open(name),build=name.match(/^sukun-(r\d+)/)?.[1];
  let marker;try{const response=await cache.match('./sukun-build-'+build+'.json',{ignoreSearch:true});marker=response?await response.json():null}catch(_){}
  // Missing metadata cannot establish which historical images are mandatory.
  if(!Array.isArray(marker?.runtime))continue;
  const protectedPaths=new Set(marker.runtime.map(entry=>{try{return sameOriginPath(entry.url)}catch(_){return ''}}));
  for(const request of await cache.keys()){
   const url=new URL(request.url);if(!isArt(url)||protectedPaths.has(url.pathname))continue;
   const original=await cache.match(request);if(!validArt(original))continue;
   const key=artKey(request);let saved=await shared.match(key);
   if(!validArt(saved)){if(!await storeOptionalArt(key,original))continue;saved=await shared.match(key)}
   if(validArt(saved)&&await sha256Response(saved)===await sha256Response(original))await cache.delete(request);
  }
 }
}
async function artResponse(request){
 const current=await caches.open(CACHE),art=await caches.open(ART_CACHE),key=artKey(request);
 const exact=await current.match(request,{ignoreSearch:false});if(validArt(exact)){await storeOptionalArt(key,exact);return exact}
 try{const fresh=await timedFetch(request,6000);if(!validArt(fresh))throw Error('art unavailable');await storeOptionalArt(key,fresh);return fresh}catch(_){const saved=await art.match(key);if(validArt(saved))return saved;return Response.error()}
}
async function assetResponse(request){
  const url=new URL(request.url);
  if(recoveryUnsafeExecutable(url))return Response.error();
  if(url.pathname===recoveryPath(RECOVERY_ROUTE))return recoveryPage();
  try{const pin=await recoveryPinned();if(pin)return recoveryAsset(request,pin)}catch(e){return Response.error()}
  const current=await caches.open(CACHE);
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
    const keys=(await caches.keys()).filter(k=>isAppCacheName(k)&&k!==CACHE&&!recoveryUnsafeBuild(k.match(/^sukun-(r\d+)(?:-|$)/)?.[1])).sort((a,b)=>vnum(b)-vnum(a));
    for(const k of keys){try{const c=await caches.open(k),r=await c.match(request,{ignoreSearch:false});if(r)return r}catch(_){} }
    return Response.error();
  }
}

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  // Installed launchers retain their old start_url query. Recognized app
  // navigations still choose a verified safe shell; this exception never
  // permits an old executable or an arbitrary auxiliary HTML response.
  const appNavigation=req.mode==='navigate'&&isAppNavigation(req);
  if(!appNavigation&&recoveryUnsafeExecutable(url)){event.respondWith(Promise.resolve(Response.error()));return;}
  event.respondWith(appNavigation?navigationResponse(req):assetResponse(req));
});

self.addEventListener('message',event=>{
  const d=event.data||{},port=event.ports?.[0];
  if(/^RECOVERY_(?:LIST|STATUS|ROLLBACK|CURRENT|SINGLE_CLIENT)$/.test(d.type||'')){
   event.waitUntil(recoverySerialize(async()=>{try{
    await recoverySource(event);
    const result=d.type==='RECOVERY_SINGLE_CLIENT'?{single:true,clientId:(await recoverySingleSource(event)).id}:d.type==='RECOVERY_ROLLBACK'?await recoverySwitch(event,'rollback'):d.type==='RECOVERY_CURRENT'?await recoverySwitch(event,'current'):await recoveryVersions(true);
    replyUpdate(port,{ok:true,...result});
   }catch(e){replyUpdate(port,{ok:false,error:String(e?.message||e),current:SURUM})}}));return;
  }

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
      const result=await updateDeadline(async()=>{const state=await recoveryReadState();if(state.pin){const pin=await recoveryPinned();return {v:pin.build,workerV:SURUM,cache:pin.cache,complete:true,recoveryPinned:true,recoveryVersion:'r1019'}}const m=await readCacheMeta();return {v:SURUM,cache:CACHE,recoveryVersion:'r1019',complete:await currentComplete(),marker:m,error:m?.errors?.join(' | ')||''}},12000,'Önbellek doğrulama');
      replyUpdate(port,result);
    }catch(e){replyUpdate(port,{v:SURUM,cache:CACHE,complete:false,error:String(e?.message||e)})}})());return;
  }
  if(d.type==='CACHE_REFRESH'){
    event.waitUntil((async()=>{const state=await recoveryReadState();if(state.pin){try{const pin=await recoveryPinned();replyUpdate(port,{ok:true,v:pin.build,workerV:SURUM,cache:pin.cache,complete:true,recoveryPinned:true})}catch(e){replyUpdate(port,{ok:false,error:String(e?.message||e),recoveryPinned:true})}return;}const m=await prepareShell();replyUpdate(port,{ok:!!m.complete,v:SURUM,cache:CACHE,complete:!!m.complete,marker:m,error:m.errors?.join(' | ')||''});})().catch(e=>replyUpdate(port,{ok:false,error:String(e?.message||e)})));return;
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
