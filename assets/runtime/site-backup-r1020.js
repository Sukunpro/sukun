/* SÜKÛN r1020 — verified, portable site + personal data export.
 * Reads only. ZIP STORE uses Blob parts, so it never builds a second full
 * archive ArrayBuffer. A missing/mismatched asset aborts the entire export.
 */
(function(w){
 'use strict';
 if(w.SukunSiteBackup)return;
 // Component filenames stay stable; the active release comes from the shell.
 const COMPONENT='assets/runtime/site-backup-r1020.js';
 const LIMIT=512*1024*1024,MANIFEST_LIMIT=2*1024*1024,FILE_LIMIT=64*1024*1024,FETCH_MS=20000;
 const MAX_FILES=3000,ZIP_LIMIT=0xffffffff,encoder=new TextEncoder();
 let task=null,last={code:'ready'},observer=null,booted=false,downloadPending=false;
 const en=()=>w.I18N?.lang==='en'||document.documentElement?.lang==='en';
 const tr=(a,b)=>en()?b:a;
 const fail=(code,file='')=>Object.assign(new Error(code),{code,file});
 function build(){
  const script=String(w.SUKUN_BUILD||''),meta=String(document.querySelector('meta[name="sukun-build"]')?.content||'');
  if(script&&meta&&script!==meta)return '';
  const value=script||meta;return /^r[1-9]\d{2,8}$/.test(value)?value:'';
 }
 const releasePaths=value=>({build:value,marker:'sukun-build-'+value+'.json',manifest:'sukun-site-assets-'+value+'.json',personal:'recovery/SUKUN_KISISEL_YEDEK_'+value+'.json'});
 const base=()=>new URL('./',w.location.href);
 const check=t=>{if(t.controller.signal.aborted||t.lease&&!t.lease.current())throw fail('SITE_CANCELLED');if(build()!==t.release.build)throw fail('SITE_UNSUPPORTED_BUILD');};
 const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
 function safePath(path){
  if(typeof path!=='string'||!path||path.length>600||/^[\/\\]|[\\\u0000-\u001f?#%]/.test(path)||path.split('/').some(s=>!s||s==='.'||s==='..'))throw fail('SITE_MANIFEST_INVALID');
  const url=new URL(path,base());
  if(url.origin!==w.location.origin||!url.pathname.startsWith(base().pathname))throw fail('SITE_MANIFEST_INVALID');
  return path;
 }
 function validateManifest(value,release){
  if(value?.schema!==1||value.build!==release.build||!Array.isArray(value.files)||!value.files.length||value.files.length>MAX_FILES)throw fail('SITE_MANIFEST_INVALID');
  let total=0,largest=0;const paths=new Set();
  for(const entry of value.files){
   safePath(entry?.path);
   if(paths.has(entry.path)||[release.manifest,release.personal,'recovery/OKU_README.txt'].includes(entry.path)||!Number.isSafeInteger(entry.bytes)||entry.bytes<0||entry.bytes>FILE_LIMIT||!/^[a-f0-9]{64}$/.test(entry.sha256||''))throw fail('SITE_MANIFEST_INVALID');
   paths.add(entry.path);total+=entry.bytes;largest=Math.max(largest,entry.bytes);
  }
  if(!Number.isSafeInteger(total)||total!==value.totalBytes||total>LIMIT)throw fail('SITE_MEMORY_LIMIT');
  for(const required of ['index.html','nero.html','sw.js','manifest.webmanifest',release.marker,COMPONENT,'sukun-latest.json','LICENSE'])if(!paths.has(required))throw fail('SITE_MANIFEST_INCOMPLETE',required);
  // Current page dependencies also have to be portable; this catches a stale
  // inventory without claiming to discover dynamic/worker assets from the DOM.
  for(const element of document.querySelectorAll('script[src],link[rel="stylesheet"][href],link[rel="manifest"][href]')){
   const raw=element.getAttribute('src')||element.getAttribute('href');
   if(!raw||raw.startsWith('data:'))continue;
   const url=new URL(raw,base());
   // The existing shell's optional Google font CSS is not application code.
   // Offline it already falls back to embedded Amiri/Cormorant/system fonts.
   // Only this exact non-executable stylesheet origin/path is permitted.
   const optionalFont=element.tagName==='LINK'&&String(element.getAttribute('rel')||'').split(/\s+/).includes('stylesheet')&&url.origin==='https://fonts.googleapis.com'&&url.pathname==='/css2';
   if(optionalFont)continue;
   if(url.origin!==w.location.origin||!url.pathname.startsWith(base().pathname))throw fail('SITE_EXTERNAL_DEPENDENCY');
   const path=decodeURIComponent(url.pathname.slice(base().pathname.length));
   if(!paths.has(path))throw fail('SITE_MANIFEST_INCOMPLETE',path);
  }
  return {value,total,largest};
 }
 function parseJson(bytes){try{return JSON.parse(new TextDecoder().decode(bytes));}catch(_){throw fail('SITE_MANIFEST_INVALID');}}
 function validateMarker(marker,release){
  if(!marker||String(marker.build||marker.v)!==release.build||['build','v'].some(k=>marker[k]!==undefined&&marker[k]!==release.build))throw fail('SITE_MANIFEST_INVALID',release.marker);
  // A marker may select only its own canonical same-origin inventory. Never
  // follow arbitrary URLs or a latest-release alias during an in-flight export.
  if(marker.siteBackupManifestUrl!=='./'+release.manifest&&marker.siteBackupManifestUrl!==release.manifest)throw fail('SITE_MANIFEST_INVALID',release.marker);
  if(!Array.isArray(marker.runtime)||!marker.runtime.length||marker.runtime.length>MAX_FILES||!/^[a-f0-9]{64}$/.test(marker.shell?.sha256||''))throw fail('SITE_MANIFEST_INVALID',release.marker);
 }
 function validateReleaseInventory(marker,inventory,release){
  const files=new Map(inventory.value.files.map(f=>[f.path,f])),seen=new Set();
  for(const entry of marker.runtime){
   if(typeof entry?.url!=='string')throw fail('SITE_MANIFEST_INVALID',release.marker);
   const url=new URL(entry.url,base());
   if(url.origin!==w.location.origin||!url.pathname.startsWith(base().pathname)||url.hash||url.search!=='?v='+release.build)throw fail('SITE_MANIFEST_INVALID',release.marker);
   const path=safePath(decodeURIComponent(url.pathname.slice(base().pathname.length)));
   if(seen.has(path)||!/^[a-f0-9]{64}$/.test(entry.sha256||'')||files.get(path)?.sha256!==entry.sha256)throw fail('SITE_MANIFEST_INVALID',path);
   seen.add(path);
  }
  if(!seen.has(COMPONENT)||files.get('index.html')?.sha256!==marker.shell.sha256||files.get('nero.html')?.sha256!==marker.shell.sha256)throw fail('SITE_MANIFEST_INVALID',release.marker);
 }
 function validateReleaseFile(path,bytes,release){
  if(path==='manifest.webmanifest'){
   const value=parseJson(bytes),url=new URL(value.start_url||'',base());
   if(value.short_name!=='SÜKÛN'||url.origin!==w.location.origin||!['index.html','nero.html'].some(p=>url.pathname===new URL(p,base()).pathname)||url.searchParams.get('v')!==release.build)throw fail('SITE_MANIFEST_INVALID',path);
  }else if(path==='sukun-latest.json'){
   const value=parseJson(bytes);if(value.recoveryPinned||['v','build','latest'].some(k=>value[k]!==release.build))throw fail('SITE_MANIFEST_INVALID',path);
  }else if(path==='sw.js'){
   const text=new TextDecoder().decode(bytes),declared=text.match(/\bconst\s+SURUM\s*=\s*['"](r\d+)['"]/);
   if(declared?.[1]!==release.build)throw fail('SITE_MANIFEST_INVALID',path);
  }else if(path==='index.html'||path==='nero.html'){
   const text=new TextDecoder().decode(bytes),tags=text.match(/<meta\b[^>]*>/gi)||[];
   const versions=tags.filter(tag=>/\bname\s*=\s*["']sukun-build["']/i.test(tag)).map(tag=>tag.match(/\bcontent\s*=\s*["'](r\d+)["']/i)?.[1]);
   if(!versions.length||versions.some(value=>value!==release.build))throw fail('SITE_MANIFEST_INVALID',path);
  }
 }
 async function readFile(t,path,expected=null){
  check(t);safePath(path);
  const controller=new AbortController(),abort=()=>controller.abort();let timedOut=false;
  t.controller.signal.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},FETCH_MS);
  const url=new URL(path,base());url.searchParams.set('v',t.release.build);
  try{
   const response=await w.fetch(url.href,{cache:'no-store',credentials:'same-origin',redirect:'error',signal:controller.signal});
   check(t);
   if(!response.ok||response.type==='opaque'||response.url&&new URL(response.url).origin!==w.location.origin)throw fail('SITE_ASSET_MISSING',path);
   const max=expected===null?MANIFEST_LIMIT:expected;
   const declared=response.headers.get('content-length');
   const encoding=response.headers.get('content-encoding');
   // Content-Length may describe compressed transfer bytes while ReadableStream
   // exposes the decoded file. The bounded reader below checks decoded size.
   if((!encoding||encoding==='identity')&&declared!==null&&Number(declared)>max)throw fail('SITE_ASSET_SIZE',path);
   // Stream into a bounded buffer: a bad server cannot make arrayBuffer()
   // allocate an unbounded body before the advertised size is checked.
   if(!response.body?.getReader)throw fail('SITE_STREAM_UNAVAILABLE');
   const reader=response.body.getReader(),chunks=expected===null?[]:null;
   let bytes=expected===null?null:new Uint8Array(expected),length=0;
   try{
    while(true){
     const part=await reader.read();check(t);
     if(part.done)break;
     if(length+part.value.byteLength>max)throw fail('SITE_ASSET_SIZE',path);
     if(chunks)chunks.push(part.value);else bytes.set(part.value,length);
     length+=part.value.byteLength;
    }
   }finally{try{await reader.cancel();}catch(_){};try{reader.releaseLock();}catch(_){}}
   if(expected!==null&&length!==expected)throw fail('SITE_ASSET_SIZE',path);
   if(chunks){bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}}
   return bytes;
  }catch(error){
   check(t);
   if(timedOut)throw fail('SITE_FETCH_TIMEOUT',path);
   if(error?.code)throw error;
   throw fail('SITE_FETCH_FAILED',path);
  }finally{clearTimeout(timer);t.controller.signal.removeEventListener('abort',abort);}
 }
 const crcTable=new Uint32Array(256);
 for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c>>>0;}
 async function crc32(t,bytes){
  let crc=0xffffffff;
  for(let start=0;start<bytes.length;start+=1048576){
   check(t);const end=Math.min(start+1048576,bytes.length);
   for(let i=start;i<end;i++)crc=crcTable[(crc^bytes[i])&255]^(crc>>>8);
   await tick();
  }
  return (crc^0xffffffff)>>>0;
 }
 async function hashedEntry(t,path,bytes,expected){
  check(t);
  const hash=Array.from(new Uint8Array(await w.crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  check(t);if(hash!==expected)throw fail('SITE_ASSET_HASH',path);
  return {path,blob:new Blob([bytes]),bytes:bytes.byteLength,crc:await crc32(t,bytes)};
 }
 async function unverifiedEntry(t,path,blob){
  safePath(path);check(t);
  if(!(blob instanceof Blob)||blob.size>LIMIT)throw fail('SITE_MEMORY_LIMIT');
  // Small synthetic metadata and portable personal JSON have no network hash.
  // Their CRC is computed a slice at a time, without a second complete buffer.
  let crc=0xffffffff;
  for(let start=0;start<blob.size;start+=1048576){
   const bytes=new Uint8Array(await blob.slice(start,start+1048576).arrayBuffer());check(t);
   for(let i=0;i<bytes.length;i++)crc=crcTable[(crc^bytes[i])&255]^(crc>>>8);
   await tick();
  }
  return {path,blob,bytes:blob.size,crc:(crc^0xffffffff)>>>0};
 }
 function zipStore(t,entries,date){
  check(t);if(!entries.length||entries.length>65535)throw fail('SITE_ZIP_LIMIT');
  const parts=[],central=[];let offset=0,centralBytes=0;
  const year=Math.max(1980,Math.min(2107,date.getFullYear()));
  const dosDate=((year-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate();
  const dosTime=(date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1);
  for(const entry of entries){
   check(t);safePath(entry.path);const name=encoder.encode(entry.path);
   if(name.length>65535||entry.bytes>ZIP_LIMIT||offset+30+name.length+entry.bytes>ZIP_LIMIT)throw fail('SITE_ZIP_LIMIT');
   const local=new Uint8Array(30),v=new DataView(local.buffer);
   v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);v.setUint16(8,0,true);v.setUint16(10,dosTime,true);v.setUint16(12,dosDate,true);
   v.setUint32(14,entry.crc,true);v.setUint32(18,entry.bytes,true);v.setUint32(22,entry.bytes,true);v.setUint16(26,name.length,true);
   const header=new Uint8Array(46),c=new DataView(header.buffer);
   c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,dosTime,true);c.setUint16(14,dosDate,true);
   c.setUint32(16,entry.crc,true);c.setUint32(20,entry.bytes,true);c.setUint32(24,entry.bytes,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);
   parts.push(local,name,entry.blob);central.push(header,name);centralBytes+=46+name.length;offset+=30+name.length+entry.bytes;
  }
  if(offset+centralBytes+22>ZIP_LIMIT)throw fail('SITE_ZIP_LIMIT');
  const end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,centralBytes,true);e.setUint32(16,offset,true);
  check(t);return new Blob([...parts,...central,end],{type:'application/zip'});
 }
 function readme(date,release){
  const BUILD=release.build;
  return 'SÜKÛN '+BUILD+' — TAM SİTE + KİŞİSEL VERİ YEDEĞİ / FULL SITE + PERSONAL DATA BACKUP\n'+date.toISOString()+'\n\n'+
   'TR: Bu ZIP, doğrulanmış '+BUILD+' uygulama dosyalarını, yerel görselleri ve diğer site varlıklarını içerir. Kişisel ses ve ayar yedeği '+release.personal+' içindedir. ZIP özel seslerini içerir; paylaşırken bunu gözet. Bu dosyaları site klasörüne topluca yükleyerek aynı sürümü barındırabilirsin. Dosyaları tarayıcıda file:// adresiyle açmak, kurulu siteyi geri yüklemez. Kişisel JSON’u SÜKÛN Kurtarma Aracı üzerinden içe aktar. Yükleme öncesi yeni bir kişisel yedek al. Google Fonts isteğe bağlıdır ve internet gerektirir; bu dış hizmetin dosyaları ZIP’e alınmaz. Çevrimdışında gömülü Amiri/Cormorant ve sistem yazı tipleri kullanılır; görünüm birebir aynı olmayabilir. Yapay zekâ gibi isteğe bağlı dış hizmetler de internet gerektirir ve yedeklenmez. Bu ZIP, GitHub hesabını, sunucu geçmişini veya tarayıcının kendisini yedeklemez. Başka alan adında kişisel veriler kendiliğinden görünmez; JSON’u orada içe aktar. Başarı mesajı tüm uygulama dosyaları SHA-256 doğrulamasını tamamladıktan sonra verilir.\n\n'+
   'EN: This ZIP contains verified '+BUILD+' application files, local artwork and other site assets. The personal voice/settings backup is '+release.personal+'. The archive contains private recordings; take care when sharing it. Deploy the entire folder together to host this version. Opening files with file:// does not restore an installed site. Import the personal JSON through the SÜKÛN Recovery Tool and make a fresh personal backup first. Optional Google Fonts requires internet; files from that external service are not archived. Offline, embedded Amiri/Cormorant and system fonts are used, so the appearance may differ. Optional external services such as AI also require internet and are not backed up. This archive does not include a GitHub account, server history or the browser itself. A new origin does not automatically receive personal data; import the JSON there. Every application file passed SHA-256 verification before this archive was created.\n';
 }
 function describe(code){
  const texts={
   ready:['Tam site ZIP’i; uygulama dosyaları, görseller, kendi seslerin ve ayarlar birlikte indirilir.','Full site ZIP: download application files, artwork, your recordings and settings together.'],
   SITE_UNSUPPORTED_BUILD:['Açık uygulamanın sürümü doğrulanamadı veya yedekleme sırasında değişti. Güncellemeyi tamamlayıp yeniden dene.','The open application version could not be verified or changed during backup. Finish the update and try again.'],
   SITE_CANCELLED:['Yedekleme iptal edildi; kayıtların değiştirilmedi.','Backup cancelled; your recordings were not changed.'],
   SITE_MEMORY_LIMIT:['Bu yedek bu cihaz için güvenli bellek sınırını aşıyor. Kişisel JSON yedeğini ayrı indir; tam site için bilgisayar kullan.','This backup exceeds the safe memory limit. Download the personal JSON separately and use a computer for the full site archive.'],
   SITE_MANIFEST_INVALID:['Site dosya listesi doğrulanamadı. Eksik yedek indirilmedi.','The site file inventory could not be verified. No incomplete backup was downloaded.'],
   SITE_MANIFEST_INCOMPLETE:['Site dosya listesinde gerekli bir dosya eksik. Eksik yedek indirilmedi.','A required file is missing from the site inventory. No incomplete backup was downloaded.'],
   SITE_EXTERNAL_DEPENDENCY:['Bu sürümde taşınabilir yedeğe alınamayan dış bir dosya var. Eksik yedek indirilmedi.','This version has an external dependency that cannot be archived. No incomplete backup was downloaded.'],
   SITE_ASSET_MISSING:['Bir site dosyası alınamadı. Bağlantıyı ve güncelleme dosyalarını kontrol et; eksik yedek indirilmedi.','A site file is unavailable. Check the connection and update files; no incomplete backup was downloaded.'],
   SITE_ASSET_SIZE:['Bir site dosyasının boyutu beklenenle uyuşmuyor. Yedekleme durduruldu.','A site file has an unexpected size. Backup stopped.'],
   SITE_ASSET_HASH:['Bir site dosyasının sürümü veya içeriği uyuşmuyor. Güncellemeyi tamamla; eksik yedek indirilmedi.','A site file has a mismatched version or content. Finish the update; no incomplete backup was downloaded.'],
   SITE_FETCH_TIMEOUT:['Bir dosya 20 saniyede alınamadı. Bağlantıyı kontrol edip yeniden dene. Eksik ZIP oluşturulmadı.','A file could not be fetched within 20 seconds. Check the connection and retry. No incomplete ZIP was created.'],
   SITE_FETCH_FAILED:['Site dosyaları okunamadı. Bağlantıyı kontrol edip yeniden dene; eksik ZIP oluşturulmadı.','Site files could not be read. Check the connection and retry; no incomplete ZIP was created.'],
   SITE_STREAM_UNAVAILABLE:['Bu tarayıcı güvenli tam site dışa aktarımını desteklemiyor. Güncel Chrome kullan.','This browser does not support safe full site export. Use an up-to-date Chrome browser.'],
   SITE_ZIP_LIMIT:['Yedek ZIP boyut sınırını aşıyor. İşlem durduruldu.','The backup exceeds the ZIP size limit. The operation stopped.'],
   SITE_PERSONAL_UNAVAILABLE:['Kişisel veri yedeği okunamadı. Eksik site yedeği indirilmedi.','The personal data backup could not be read. No incomplete site backup was downloaded.'],
   SITE_HASH_UNAVAILABLE:['Dosya bütünlüğü bu tarayıcıda doğrulanamıyor. HTTPS ile güncel Chrome kullan.','This browser cannot verify file integrity. Use an up-to-date Chrome over HTTPS.'],
   SITE_BUSY:['Önce etkin zikri, kaydı veya veri işlemini tamamla; ardından yeniden dene.','Finish active dhikr, recording or data operations, then retry.'],
   SITE_DOWNLOAD_PENDING:['Önce başlatılan ZIP indirmesini tamamla. Yeni tam site yedeği kısa süre sonra açılır.','Finish the ZIP download already started. A new full site backup will be available shortly.'],
   SITE_FAILED:['Tam site yedeği tamamlanamadı. Kayıtların değiştirilmedi; eksik ZIP indirilmedi.','Full site backup could not finish. Recordings were not changed; no incomplete ZIP was downloaded.'],
   SITE_DONE:['Tam site ZIP’i doğrulandı ve indirme başlatıldı. İndirme tamamlanınca dosyayı sakla.','Full site ZIP verified and download started. Keep the file after the download completes.']
  };
  return tr(...(texts[code]||texts.SITE_FAILED));
 }
 function setStatus(code,file='',detail=null){last={code,file,detail};render();}
 function cancel(){if(!task)return false;task.controller.abort();return true;}
 function download(blob,filename){
  const url=URL.createObjectURL(blob),link=document.createElement('a');downloadPending=true;link.href=url;link.download=filename;link.style.display='none';document.body.append(link);
  // Keep the link valid for Android's download handoff, but do not permit a
  // second large archive while this first Blob is still retained by its URL.
  try{link.click();}finally{link.remove();setTimeout(()=>{URL.revokeObjectURL(url);downloadPending=false;render();},60000);}
 }
 async function exportSite(options={}){
  if(task)return {ok:false,error:'SITE_BUSY'};
  if(downloadPending){setStatus('SITE_DOWNLOAD_PENDING');return {ok:false,error:'SITE_DOWNLOAD_PENDING'};}
  if(!build()){setStatus('SITE_UNSUPPORTED_BUILD');return {ok:false,error:'SITE_UNSUPPORTED_BUILD'};}
  if(!w.crypto?.subtle){setStatus('SITE_HASH_UNAVAILABLE');return {ok:false,error:'SITE_HASH_UNAVAILABLE'};}
  const t={release:releasePaths(build()),controller:new AbortController(),phase:'preparing',done:0,total:0,lease:null};task=t;render();
  const work=async lease=>{
   t.lease=lease;check(t);
   const release=t.release,markerBytes=await readFile(t,release.marker);
   const marker=parseJson(markerBytes);validateMarker(marker,release);
   const manifestBytes=await readFile(t,release.manifest),manifest=parseJson(manifestBytes);
   const inventory=validateManifest(manifest,release);validateReleaseInventory(marker,inventory,release);check(t);
   // Verify the already-read marker against the inventory before reading personal data.
   const markerEntry=await hashedEntry(t,release.marker,markerBytes,inventory.value.files.find(f=>f.path===release.marker).sha256);
   if(markerEntry.bytes!==inventory.value.files.find(f=>f.path===release.marker).bytes)throw fail('SITE_ASSET_SIZE',release.marker);
   if(inventory.total+inventory.largest*3+8*1024*1024>LIMIT)throw fail('SITE_MEMORY_LIMIT');
   if(typeof w.SukunRecoveryData?.capturePortable!=='function')throw fail('SITE_PERSONAL_UNAVAILABLE');
   t.phase='personal';render();
   let personal=await w.SukunRecoveryData.capturePortable({lease,signal:t.controller.signal,download:false});check(t);
   if(!personal||personal.ok===false)throw fail('SITE_PERSONAL_UNAVAILABLE');
   const personalBlob=personal.file instanceof Blob?personal.file:personal instanceof Blob?personal:new Blob([JSON.stringify(personal.data||personal)],{type:'application/json'});personal=null;
   // Blob-part STORE output references native Blob backing. Allow for personal
   // JSON strings/parse objects, a hash/copy of the largest file, and headers.
   const estimate=inventory.total+inventory.largest*3+personalBlob.size*4+8*1024*1024;
   if(!Number.isSafeInteger(estimate)||estimate>LIMIT)throw fail('SITE_MEMORY_LIMIT');
   const created=new Date(),entries=[];t.total=manifest.files.length;t.phase='assets';render();
   entries.push(await unverifiedEntry(t,release.personal,personalBlob));
   for(const file of manifest.files){
    check(t);
    if(file.path===release.marker)entries.push(markerEntry);
    else{const bytes=await readFile(t,file.path,file.bytes);const entry=await hashedEntry(t,file.path,bytes,file.sha256);validateReleaseFile(file.path,bytes,release);entries.push(entry);}
    t.done++;render();
   }
   check(t);t.phase='packaging';render();
   entries.push(await unverifiedEntry(t,release.manifest,new Blob([manifestBytes],{type:'application/json'})));
   entries.push(await unverifiedEntry(t,'recovery/OKU_README.txt',new Blob([readme(created,release)],{type:'text/plain;charset=utf-8'})));
   const blob=zipStore(t,entries,created);check(t);
   const filename='SUKUN_'+release.build+'_TAM_SITE_YEDEGI_'+created.toISOString().slice(0,19).replace(/[-:]/g,'').replace('T','_')+'.zip';
   if(options.download!==false){check(t);download(blob,filename);setStatus('SITE_DONE');}
   return {ok:true,blob,filename,files:entries.length,bytes:blob.size};
  };
  try{
   if(!w.SukunTabOwner?.maintenance)throw fail('SITE_BUSY');
   const result=await w.SukunTabOwner.maintenance('portable-site-backup',work);
   if(result===false){setStatus('SITE_BUSY');return {ok:false,error:'SITE_BUSY'};}
   return result;
  }catch(error){
   const cancelled=t.controller.signal.aborted||t.lease&&!t.lease.current();
   const code=cancelled?'SITE_CANCELLED':error?.code||'SITE_FAILED';
   // capturePortable's trusted bilingual errors explain locked private data
   // and personal-file limits. Never display arbitrary Error.message text.
   const detail=!cancelled&&typeof error?.tr==='string'&&typeof error?.en==='string'?{tr:error.tr.slice(0,700),en:error.en.slice(0,700)}:null;
   setStatus(code,error?.file||'',detail);return {ok:false,error:code,file:error?.file||''};
  }
  finally{if(task===t)task=null;render();}
 }
 function render(){
  const box=document.getElementById('r1020SiteBackup');if(!box)return;
  box.querySelector('[data-site-title]').textContent=tr('Tüm siteyi yedekle','Back up the whole site');
  box.querySelector('[data-site-note]').textContent=tr('Uygulama dosyaları ve özel seslerin aynı ZIP’e alınır. Eksik veya uyuşmayan dosyada işlem durur. Site sürümü değiştirilmez. Büyük yedek birkaç dakika sürebilir. Google yazı tipleri ve yapay zekâ gibi dış hizmetler internet gerektirir; çevrimdışında gömülü veya sistem yazı tipleri kullanılır.','Application files and private recordings go into one ZIP. Any missing or mismatched file stops the export. The site version stays unchanged. A large backup can take several minutes. External services such as Google Fonts and AI require internet; offline, embedded or system fonts are used.');
  const start=box.querySelector('[data-site-start]');start.textContent=tr('↓ Tam site ZIP yedeğini indir','↓ Download full site ZIP backup');start.disabled=!!task||downloadPending||!build();
  const stop=box.querySelector('[data-site-cancel]');stop.textContent=tr('İptal et','Cancel');stop.hidden=!task;
  const status=box.querySelector('[data-site-status]');
  if(task){
   status.textContent=task.phase==='assets'?tr('Site dosyaları doğrulanıyor: '+task.done+' / '+task.total,'Verifying site files: '+task.done+' / '+task.total):task.phase==='personal'?tr('Kendi seslerin ve ayarların okunuyor…','Reading your recordings and settings…'):task.phase==='packaging'?tr('Doğrulanmış dosyalar ZIP’e hazırlanıyor…','Preparing verified files as a ZIP…'):tr('Güvenli yedekleme hazırlanıyor…','Preparing a safe backup…');
  }else status.textContent=(!build()?describe('SITE_UNSUPPORTED_BUILD'):last.detail?tr(last.detail.tr,last.detail.en):describe(last.code))+(last.file?' ('+last.file+')':'');
  const progress=box.querySelector('progress');progress.hidden=!task||task.phase!=='assets';progress.max=task?.total||1;progress.value=task?.done||0;
 }
 function mount(){
  if(document.getElementById('r1020SiteBackup'))return true;
  const panel=document.getElementById('r1019SiteBackupSlot')||document.getElementById('r1019DataRecovery');if(!panel)return false;
  const box=document.createElement('section');box.id='r1020SiteBackup';box.innerHTML='<h4 data-site-title></h4><p data-site-note></p><div class="r1020SiteActions"><button type="button" class="r170Btn" data-site-start></button><button type="button" class="r170Btn" data-site-cancel hidden></button></div><progress hidden></progress><p data-site-status role="status" aria-live="polite"></p>';
  panel.append(box);box.querySelector('[data-site-start]').onclick=()=>exportSite();box.querySelector('[data-site-cancel]').onclick=cancel;render();return true;
 }
 function boot(){
  if(booted)return;booted=true;const style=document.createElement('style');
  style.textContent='#r1020SiteBackup{padding:12px;margin-top:12px;border:1px solid rgba(141,208,177,.5);border-radius:14px;min-width:0;overflow-wrap:anywhere}#r1020SiteBackup h4{margin:0 0 8px;font-size:15px}#r1020SiteBackup p{font-size:12px;line-height:1.6;margin:8px 0}.r1020SiteActions{display:grid;gap:8px;grid-template-columns:minmax(0,1fr)}#r1020SiteBackup button,#r1020SiteBackup progress{width:100%;min-width:0;max-width:100%}#r1020SiteBackup button{white-space:normal;min-height:44px}#r1020SiteBackup [hidden]{display:none!important}';document.head.append(style);
  if(!mount()){observer=new MutationObserver(()=>{if(mount()){observer.disconnect();observer=null;}});observer.observe(document.body,{childList:true,subtree:true});}
  for(const event of ['sukun:languagechange','sukun:langchange','sukun:i18nchange','sukun:recoveryready'])w.addEventListener(event,()=>{mount();render();});
  w.addEventListener('sukun:tabownerchange',()=>{if(task?.lease&&!task.lease.current())cancel();});
  w.addEventListener('pagehide',cancel);document.addEventListener('freeze',cancel);
 }
 w.SukunSiteBackup=Object.freeze({get version(){return build();},exportSite,cancel,mount,describe,
  snapshot:()=>({version:build(),busy:!!task,downloadPending,phase:task?.phase||'idle',done:task?.done||0,total:task?.total||0,code:last.code})});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
