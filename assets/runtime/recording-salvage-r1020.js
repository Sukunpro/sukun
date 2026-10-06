/* r1020 — explicit, read-only search; additive, quarantined voice rescue.
 * No source deletion, settings restore, network fetch or automatic recovery.
 * Missing databases are never created by a scan. Original source copies and
 * quarantine copies remain available even when a later verification fails.
 */
(function(w){
 'use strict';
 if(w.SukunRecordingSalvage)return;
 const VERSION='r1020',QUARANTINE='sukunVoiceQuarantineR1020';
 const LIMIT={clips:2000,rows:8000,clip:64*1048576,total:1024*1048576,setting:4*1048576,settings:16*1048576};
 const sources=new Map();let task=null,lastReport=null,lastMessage='',sequence=0;
 const en=()=>w.I18N?.lang==='en'||document.documentElement?.lang==='en';
 const tr=(a,b)=>en()?b:a;
 const failure=code=>Object.assign(new Error(code),{code});
 const isObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const validKey=k=>typeof k==='string'&&/^[A-Za-z0-9_.:-]{1,200}$/.test(k)&&!['__proto__','prototype','constructor'].includes(k);
 const rec=()=>typeof REC_DB!=='undefined'?REC_DB:w.REC_DB;
 const build=()=>/^r\d{1,8}$/.test(document.querySelector('meta[name="sukun-build"]')?.content||'')?document.querySelector('meta[name="sukun-build"]').content:VERSION;
 const canSee=k=>!w.SukunSecretPolicy?.secretRecKey?.(k)||!!w.SukunSecretPolicy?.unlocked?.();
 function audio(blob){if(!(blob instanceof Blob)||!blob.size||blob.size>LIMIT.clip||blob.type&&!/^audio\/[a-z0-9.+_-]+(?:;[^\u0000-\u001f]*)?$/i.test(blob.type))throw failure('invalid-audio');return blob;}
 function assert(t,lease=null){if(task!==t||t.controller.signal.aborted)throw failure('cancelled');lease?.assertCurrent();}
 async function digest(value){if(!w.crypto?.subtle?.digest)throw failure('hash-unavailable');const bytes=typeof value==='string'?new TextEncoder().encode(value):value;return Array.from(new Uint8Array(await w.crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');}
 async function hash(blob){audio(blob);return digest(await blob.arrayBuffer());}
 async function signature(blob){return blob.size+':'+blob.type+':'+await hash(blob);}
 function errorCode(error){const code=String(error?.code||error?.name||'read-failed');return /^[a-zA-Z0-9_-]{1,60}$/.test(code)?code:'operation-failed';}
 function pending(){const s=w.SukunRecoveryData?.status?.();return !!(s?.pending||s?.reloadRequired||s?.busy);}

 // An absent DB triggers an initial upgrade. Aborting it avoids even creating
 // an empty schema on engines without indexedDB.databases().
 function openExisting(name){return new Promise((resolve,reject)=>{
  let request,settled=false,missing=false;
  const timer=setTimeout(()=>finish(null,failure('open-timeout')),10000);
  function finish(db,error){if(settled){try{db?.close()}catch(_){}return;}settled=true;clearTimeout(timer);error?reject(error):resolve(db);}
  try{request=w.indexedDB.open(name);}catch(error){finish(null,error);return;}
  request.onupgradeneeded=()=>{missing=true;try{request.transaction.abort()}catch(_){};finish(null);};
  request.onerror=()=>missing?finish(null):finish(null,failure('open-failed'));
  request.onblocked=()=>finish(null,failure('db-blocked'));
  request.onsuccess=()=>finish(request.result);
 });}
 async function readStores(name,names,t){
  const db=await openExisting(name);try{assert(t);}catch(error){db?.close();throw error;}if(!db)return {exists:false,rows:{}};
  try{
   if(db.version!==1||names.some(n=>!db.objectStoreNames.contains(n)))throw failure('unsupported-schema');
   return await new Promise((resolve,reject)=>{
    let tx,settled=false,ended=0,count=0;const rows=Object.fromEntries(names.map(n=>[n,[]]));
    const timer=setTimeout(()=>abort(failure('read-timeout')),30000);
    function done(error){if(settled)return;settled=true;clearTimeout(timer);t.controller.signal.removeEventListener('abort',cancel);db.onversionchange=null;error?reject(error):resolve({exists:true,rows});}
    function abort(error){try{tx?.abort()}catch(_){};done(error);}
    function cancel(){abort(failure('cancelled'));}
    try{
     tx=db.transaction(names,'readonly');db.onversionchange=()=>abort(failure('database-changed'));
     t.controller.signal.addEventListener('abort',cancel,{once:true});
     tx.oncomplete=()=>done(ended===names.length?null:failure('incomplete-read'));tx.onabort=tx.onerror=()=>done(failure('read-failed'));
     for(const name of names){const cursor=tx.objectStore(name).openCursor();cursor.onsuccess=()=>{try{assert(t);const item=cursor.result;if(!item){ended++;return;}if(++count>LIMIT.rows)throw failure('source-limit');rows[name].push([item.key,item.value]);item.continue();}catch(error){abort(error);}};}
    }catch(error){abort(error);}
   });
  }finally{db.close();}
 }
 function stats(entries){let bytes=0;const seen=new Set();if(!Array.isArray(entries)||entries.length>LIMIT.clips)throw failure('source-limit');for(const pair of entries){if(!Array.isArray(pair)||pair.length!==2||!validKey(pair[0])||seen.has(pair[0]))throw failure('invalid-source');seen.add(pair[0]);bytes+=audio(pair[1]).size;if(bytes>LIMIT.total)throw failure('source-limit');}return {count:entries.length,bytes};}
 function addSource(source){
  const entries=source.entries.filter(([key])=>canSee(key));const information=stats(entries);if(!information.count)return null;
  const id='source-'+(++sequence);sources.set(id,{...source,entries,information});
  return {kind:source.kind,at:Number(source.at)||0,build:/^r\d{1,8}$/.test(source.build||'')?source.build:null,hidden:!!source.hidden,state:source.state||'',count:information.count,bytes:information.bytes};
 }
 function receipt(value){if(!value||typeof value!=='object')return null;const out={};for(const key of ['status','errorCode'])if(typeof value[key]==='string'&&/^[a-zA-Z0-9_-]{1,60}$/.test(value[key]))out[key]=value[key];for(const key of ['count','blobBytes','at'])if(Number.isSafeInteger(value[key])&&value[key]>=0)out[key]=value[key];for(const key of ['build','appVersion','controllerVersion','targetVersion'])if(/^r\d{1,8}$/.test(value[key]||''))out[key]=value[key];return out;}
 function observations(){const out={};try{const s=w.SukunRecordingInspection?.snapshot?.();if(s)out.inspection={current:receipt(s.current),lastSuccessful:receipt(s.lastSuccessful),lastNonEmpty:receipt(s.lastNonEmpty),previouslyPopulatedNowEmpty:s.previouslyPopulatedNowEmpty===true};}catch(_){}try{const s=w.SukunRecordingUpdateDiagnostics?.snapshot?.();if(s)out.update={before:receipt(s.before),after:receipt(s.after),status:/^[a-z-]{1,40}$/.test(s.status||'')?s.status:null};}catch(_){}return out;}
 async function scan(){
  if(task)throw failure('busy');const t={kind:'scan',phase:'reading',controller:new AbortController()};task=t;sources.clear();lastMessage='';render();
  const report={schema:1,app:'SUKUN-Voice-Diagnostic',version:VERSION,build:build(),at:Date.now(),origin:w.location?.origin||'',databases:{},sources:[],recovery:{pending:pending()},observations:observations(),readOnly:true};
  try{
   for(const [name,names] of [['sukunRec',['clips']],['sukunRecoveryDataR1019',['points','meta']],['sukunStudioUndo',['jobs','clips']], [QUARANTINE,['jobs','clips']]]){
    assert(t);try{
     const result=await readStores(name,names,t);assert(t);report.databases[name]={exists:result.exists,status:result.exists?'read':'missing'};if(!result.exists)continue;
     if(name==='sukunRec'){const total=stats(result.rows.clips);report.databases[name]={exists:true,status:'read',...total};continue;}
     if(name==='sukunRecoveryDataR1019'){
      const points=result.rows.points.map(([,point])=>point),metadata=new Map(result.rows.meta.map(([,entry])=>[entry?.key,entry?.value]));
      const journal=metadata.get('journal');report.recovery.journalPresent=!!journal;report.recovery.beforePointFound=!!journal?.beforeId&&points.some(p=>p?.id===journal.beforeId);report.recovery.undoPresent=!!metadata.get('undo');report.recovery.pending=report.recovery.pending||!!journal;
      report.databases[name].pointCount=points.length;report.databases[name].emptyPoints=0;report.databases[name].invalidPoints=0;
      for(const point of points){try{if(point?.schema!==1||point?.app!=='SUKUN-Recovery'||!Array.isArray(point.stores?.sukunRec?.entries))throw failure('invalid-source');const all=stats(point.stores.sukunRec.entries);if(!all.count){report.databases[name].emptyPoints++;continue;}const summary=addSource({kind:'point',at:point.at,build:point.build,hidden:point.listed===false,entries:point.stores.sukunRec.entries,point});if(summary)report.sources.push(summary);}catch(_){report.databases[name].invalidPoints++;}}
     }else{
      const jobs=result.rows.jobs.map(([,job])=>job),clips=result.rows.clips.map(([,clip])=>clip);report.databases[name].jobs=jobs.length;report.databases[name].storedCopies=clips.length;
      for(const job of jobs){
       const rows=clips.filter(c=>c?.jobId===job?.id);if(!rows.length)continue;
       for(const choice of name===QUARANTINE?['blob']:['original','output']){try{const entries=rows.map(c=>[c.key,c[choice]]);const summary=addSource({kind:name===QUARANTINE?'quarantine':'studio-'+choice,at:job.created||job.at,build:job.version||job.build,state:/^[a-z-]{1,40}$/.test(job.state||'')?job.state:'',entries,rows,choice});if(summary)report.sources.push(summary);}catch(_){report.databases[name].invalidCopies=(report.databases[name].invalidCopies||0)+1;}}
      }
     }
    }catch(error){if(error?.code==='cancelled')throw error;report.databases[name]={exists:null,status:'unavailable',error:errorCode(error)};}
   }
   // Native prepared audio can survive a store failure within this page. Do
   // not fetch URLs, decode audio, pause playback or revoke any source URL.
   const prepared=[];try{if(typeof _r476Prepared!=='undefined')prepared.push(_r476Prepared);}catch(_){}try{if(typeof _r1007SingleFallback!=='undefined')prepared.push(_r1007SingleFallback);}catch(_){}
   const keys=new Set();for(const item of prepared){const key=item?.recordingKey||item?.key;if(!validKey(key)||keys.has(key)||!(item.blob instanceof Blob))continue;try{const summary=addSource({kind:'prepared',at:Date.now(),build:build(),entries:[[key,item.blob]]});if(summary){keys.add(key);report.sources.push(summary);}}catch(_){} }
   try{const q=await w.navigator.storage?.estimate?.();report.storage={quota:Number.isFinite(q?.quota)?q.quota:null,usage:Number.isFinite(q?.usage)?q.usage:null,persisted:typeof w.navigator.storage?.persisted==='function'?await w.navigator.storage.persisted():null};}catch(_){report.storage={status:'unavailable'};}
   assert(t);lastReport=report;lastMessage=report.sources.length?tr('Yerel ses kopyaları bulundu. Seçilen kopya aktarılmadan önce doğrulanır; mevcut sesler korunur.','Local voice copies found. The selected copy is verified before transfer; existing voices are kept.'):tr('Erişilebilir yerel ses kopyası bulunamadı. İndirdiğin JSON ses yedeğini seçebilirsin. Eski uygulama sürümü sesleri geri getirmez.','No accessible local voice copy was found. Select a downloaded JSON voice backup. An old app version does not restore voices.');return JSON.parse(JSON.stringify(report));
  }catch(error){lastMessage=describe(error);throw error;}finally{task=null;render();}
 }

 // Native point checksum matches r1019's complete immutable snapshot serial.
 // Personal setting values participate in verification but are never applied,
 // returned by the API or included in the diagnostic download.
 async function verifyPoint(point,t,lease){
  if(point.schema!==1||point.app!=='SUKUN-Recovery'||!Number.isSafeInteger(point.at)||point.at<=0||point.at>Date.now()+60000||!/^r\d{1,8}$/.test(point.build||'')||!isObject(point.ls)||Object.keys(point.ls).length>1000||!isObject(point.stores)||Object.keys(point.stores).length!==2||!/^[a-f0-9]{64}$/.test(point.digest||''))throw failure('invalid-source');
  let settings=0,total=0;for(const [key,value] of Object.entries(point.ls)){if(typeof key!=='string'||typeof value!=='string'||value.length>LIMIT.setting)throw failure('invalid-source');settings+=value.length*2;if(settings>LIMIT.settings)throw failure('source-limit');}
  const serial={schema:1,app:point.app,at:point.at,build:point.build,ls:Object.entries(point.ls).sort(([a],[b])=>a.localeCompare(b)),stores:{}};
  for(const name of ['sukunRec','sukunCustomAmb']){
   const saved=point.stores[name];if(!isObject(saved)||typeof saved.present!=='boolean'||saved.version!==1||!Array.isArray(saved.entries)||saved.entries.length>LIMIT.clips||!saved.present&&saved.entries.length)throw failure('invalid-source');
   const seen=new Set(),entries=[];for(const pair of saved.entries){assert(t,lease);if(!Array.isArray(pair)||pair.length!==2||!validKey(pair[0])||seen.has(pair[0]))throw failure('invalid-source');const [key,value]=pair,blob=audio(name==='sukunRec'?value:value?.blob);seen.add(key);total+=blob.size;if(total>LIMIT.total)throw failure('source-limit');let metadata=null;if(name==='sukunCustomAmb'){if(!isObject(value)||typeof value.name!=='string'||Object.keys(value).some(k=>!['name','blob','mix','hybrid'].includes(k)))throw failure('invalid-source');metadata=Object.fromEntries(Object.entries(value).filter(([k])=>k!=='blob').sort(([a],[b])=>a.localeCompare(b)));}entries.push([key,{size:blob.size,type:blob.type,sum:await hash(blob),metadata}]);}
   serial.stores[name]={present:saved.present,version:1,entries:entries.sort(([a],[b])=>a.localeCompare(b))};
  }
  assert(t,lease);if(await digest(JSON.stringify(serial))!==point.digest)throw failure('checksum-failed');
 }
 async function verifySource(source,t,lease){
  stats(source.entries);if(source.kind==='point')await verifyPoint(source.point,t,lease);
  const entries=[],hashes=new Map();for(const [key,blob] of source.entries){assert(t,lease);if(!canSee(key))throw failure('unlock-changed');const sum=await hash(blob);assert(t,lease);if(source.rows){const row=source.rows.find(c=>c.key===key);const expected=source.choice==='blob'?row?.hash:row?.[source.choice+'Hash'];if(source.choice==='blob'?sum!==expected:blob.size+':'+blob.type+':'+sum!==expected)throw failure('checksum-failed');}entries.push([key,blob]);hashes.set(key,sum);}return {entries,hashes};
 }
 function openQuarantine(){return new Promise((resolve,reject)=>{
  const rq=w.indexedDB.open(QUARANTINE,1);let settled=false;
  const timer=setTimeout(()=>finish(null,failure('quarantine-timeout')),10000);
  function finish(db,error){if(settled){db?.close();return;}settled=true;clearTimeout(timer);error?reject(error):resolve(db);}
  rq.onupgradeneeded=()=>{if(settled){rq.transaction.abort();return;}const db=rq.result;if(!db.objectStoreNames.contains('jobs'))db.createObjectStore('jobs',{keyPath:'id'});if(!db.objectStoreNames.contains('clips'))db.createObjectStore('clips',{keyPath:['jobId','key']});};
  rq.onerror=()=>finish(null,failure('quarantine-write-failed'));rq.onblocked=()=>finish(null,failure('db-blocked'));rq.onsuccess=()=>finish(rq.result);
 });}
 async function quarantineWrite(job,entries,hashes,t,lease){
  const db=await openQuarantine();try{assert(t,lease);}catch(error){db.close();throw error;}
  try{await new Promise((resolve,reject)=>{
   let tx,settled=false;const timer=setTimeout(()=>abort(failure('quarantine-timeout')),60000);
   function done(error){if(settled)return;settled=true;clearTimeout(timer);t.controller.signal.removeEventListener('abort',cancel);error?reject(error):resolve();}
   function abort(error){try{tx?.abort()}catch(_){}done(error);}
   function cancel(){abort(failure('cancelled'));}
   try{assert(t,lease);tx=db.transaction(['jobs','clips'],'readwrite');tx.oncomplete=()=>done();tx.onabort=tx.onerror=()=>done(failure('quarantine-write-failed'));t.controller.signal.addEventListener('abort',cancel,{once:true});tx.objectStore('jobs').add(job);for(const [key,blob] of entries){assert(t,lease);tx.objectStore('clips').add({jobId:job.id,key,blob,hash:hashes.get(key)});}}catch(error){abort(error);}
  });}finally{db.close();}
 }
 async function stageAndMerge(plan,t,lease){
  assert(t,lease);if(pending())throw failure('recovery-pending');
  if(typeof w.SukunRecoveryGuard?.assertSingleClient!=='function'||!rec()?.mergeMissing)throw failure('safe-restore-unavailable');
  await w.SukunRecoveryGuard.assertSingleClient(lease);assert(t,lease);
  const information=stats(plan.entries);if(!information.count)throw failure('no-voices');
  const space=await w.navigator.storage?.estimate?.();assert(t,lease);
  if(!Number.isFinite(space?.quota)||!Number.isFinite(space?.usage)||space.quota-space.usage<information.bytes*2+16*1048576)throw failure('quota-low');
  t.phase='staging';render();const job={id:w.crypto.randomUUID(),at:Date.now(),build:build(),state:'verified-source',version:VERSION,count:information.count,bytes:information.bytes};
  await quarantineWrite(job,plan.entries,plan.hashes,t,lease);assert(t,lease);
  const saved=await readStores(QUARANTINE,['jobs','clips'],t);assert(t,lease);const rows=saved.rows.clips.filter(([,c])=>c.jobId===job.id).map(([,c])=>c);
  if(rows.length!==information.count)throw failure('quarantine-verification-failed');
  for(const row of rows){assert(t,lease);if(await hash(row.blob)!==plan.hashes.get(row.key)||row.hash!==plan.hashes.get(row.key))throw failure('quarantine-verification-failed');}
  assert(t,lease);if(pending())throw failure('recovery-pending');await w.SukunRecoveryGuard.assertSingleClient(lease);assert(t,lease);
  t.phase='merging';render();const result=await rec().mergeMissing(rows.map(c=>[c.key,c.blob]),{isCurrent:lease.current,signal:t.controller.signal,conflictKeys:plan.conflictKeys||[],timeoutMs:60000});
  t.committed=result.added;t.phase='verifying';render();
  // Never delete an added clip if a later reader fails. The independent copy
  // remains in quarantine, and another rescue safely keeps any newer clip.
  for(const key of result.addedKeys||[]){lease.assertCurrent();const blob=await rec().get(key);if(!(blob instanceof Blob)||await hash(blob)!==plan.hashes.get(key))throw failure('write-verification-failed');}
  lastMessage=tr(result.added+' eksik ses eklendi ve doğrulandı; '+result.kept+' mevcut ses korundu. Ayarlar ve sayaçlar değişmedi.',result.added+' missing voices added and verified; '+result.kept+' existing voices kept. Settings and counters were unchanged.');
  try{if(typeof skVoiceRestoreRefresh==='function')await skVoiceRestoreRefresh();}catch(_){}
  return {ok:true,added:result.added,kept:result.kept,verified:true,quarantineKept:true};
 }
 async function perform(kind,prepare){
  if(task)throw failure('busy');if(pending())throw failure('recovery-pending');if(!w.SukunTabOwner?.maintenance)throw failure('safe-restore-unavailable');
  const t={kind,phase:'verifying-source',controller:new AbortController(),committed:0};task=t;lastMessage='';render();
  try{const result=await w.SukunTabOwner.maintenance('recording-salvage',async lease=>{assert(t,lease);const plan=await prepare(t,lease);return stageAndMerge(plan,t,lease);});if(result===false)throw failure('finish-first');return result;}
  catch(error){lastMessage=t.committed?tr(t.committed+' ses eklendi; son doğrulama tamamlanamadı. Yerel kurtarma kopyası saklandı; mevcut sesler silinmedi.',t.committed+' voices added; final verification did not complete. The rescue copy is retained; existing voices were not deleted.'):describe(error);throw Object.assign(error,{added:t.committed,quarantineKept:true});}
  finally{task=null;render();}
 }
 async function restore(id){const source=sources.get(id);if(!source)throw failure('select-source');return perform('restore',async(t,lease)=>verifySource(source,t,lease));}
 function nativeAudioURI(uri,type){
  if(typeof uri!=='string'||uri.length>90*1048576||typeof type!=='string'||type.length>100)throw failure('invalid-audio');
  const comma=uri.lastIndexOf(','),header=uri.slice(0,comma),encoded=uri.slice(comma+1);
  if(comma<0||!/^data:/i.test(header)||!header.toLowerCase().endsWith(';base64')||!encoded.length||encoded.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw failure('invalid-audio');
  const uriType=header.slice(5,-7),padding=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0,size=encoded.length/4*3-padding;
  if(!size||size>LIMIT.clip||type&&!/^audio\//i.test(type)||type&&uriType.toLowerCase()!==type.toLowerCase()||!type&&!/^application\/octet-stream$/i.test(uriType))throw failure('invalid-audio');
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';if(padding&&(alphabet.indexOf(encoded[encoded.length-padding-1])&(padding===2?15:3)))throw failure('invalid-audio');
  const decoded=atob(encoded);if(decoded.length!==size)throw failure('invalid-audio');const bytes=new Uint8Array(size);for(let i=0;i<size;i++)bytes[i]=decoded.charCodeAt(i);return audio(new Blob([bytes],{type}));
 }
 async function verifyNativeJSON(files,t,lease){
  const nativeEntries=[],legacyFiles=[];
  for(const file of files){
   assert(t,lease);if(!(file instanceof Blob)||!file.size||file.size>300*1048576)throw failure('file-limit');
   const data=JSON.parse(await file.text());assert(t,lease);
   // Legacy voice/full backups keep their existing planner and part manifest
   // checks. A native exact backup must verify its OLD complete digest, rather
   // than treating freshly hashed, possibly corrupted bytes as trusted input.
   if(!data?.recovery){legacyFiles.push(file);continue;}
   if(data.app!=='SUKUN'||data.fmt!==2||data.recovery.schema!==1||data.recovery.mode!=='exact-personal-data'||!isObject(data.idb)||Object.keys(data.idb).length!==2||!isObject(data.recovery.presence))throw failure('invalid-source');
   const point={schema:1,app:'SUKUN-Recovery',at:data.t,build:data.build,ls:data.ls,stores:{},digest:data.recovery.digest};let bytes=0;
   for(const name of ['sukunRec','sukunCustomAmb']){
    const input=data.idb[name];if(!isObject(input)||Object.keys(input).length>LIMIT.clips)throw failure('invalid-source');const entries=[];
    for(const [key,value]of Object.entries(input)){
     assert(t,lease);if(!validKey(key)||!isObject(value))throw failure('invalid-source');let converted;
     if(name==='sukunRec')converted=nativeAudioURI(value.__blob,value.type);
     else{const item=key.startsWith('h:')?value.__hybridRecord:value.__audioRecord;if(!isObject(item))throw failure('invalid-source');converted=Object.fromEntries(Object.entries(item).filter(([key])=>!['blob','type'].includes(key)));converted.blob=nativeAudioURI(item.blob,item.type);}
     bytes+=(name==='sukunRec'?converted:converted.blob).size;if(bytes>LIMIT.total)throw failure('source-limit');entries.push([key,converted]);
    }
    point.stores[name]={present:data.recovery.presence[name],version:1,entries};
   }
   await verifyPoint(point,t,lease);assert(t,lease);
   for(const pair of point.stores.sukunRec.entries)if(canSee(pair[0]))nativeEntries.push(pair);
  }
  return {nativeEntries,legacyFiles};
 }
 async function importJSON(files){return perform('import',async(t,lease)=>{
  const list=Array.from(files||[]);if(!list.length||list.length>1000||list.reduce((n,f)=>n+(Number(f.size)||0),0)>300*1048576)throw failure('file-limit');
  const native=await verifyNativeJSON(list,t,lease);assert(t,lease);
  let parsed={entries:[],conflictKeys:[]};
  if(native.legacyFiles.length){if(typeof skVoiceRestorePlan!=='function')throw failure('json-validator-unavailable');parsed=await skVoiceRestorePlan(native.legacyFiles,{assertCurrent:()=>assert(t,lease)});assert(t,lease);}
  // Verified native files use the exact already checked Blob/type pairs. The
  // legacy URI decoder deliberately rejects untyped octet-stream exports and
  // remains unchanged for legacy backups. Conflicting selected copies must be
  // imported separately; no arbitrary native/legacy winner is chosen here.
  const entries=new Map(),hashes=new Map(),signatures=new Map();
  for(const [key,blob]of [...native.nativeEntries,...parsed.entries]){assert(t,lease);if(!canSee(key))throw failure('unlock-changed');const sum=await hash(blob),sig=blob.size+':'+blob.type+':'+sum;if(entries.has(key)&&signatures.get(key)!==sig)throw failure('conflicting-backups');entries.set(key,blob);hashes.set(key,sum);signatures.set(key,sig);}
  const merged=[...entries];stats(merged);return {...parsed,entries:merged,hashes};
 });}
 function describe(error){const code=error?.code||'';if(code==='recovery-pending')return tr('Önce Kurtarma Merkezi içindeki bekleyen işlemi açıkça çöz veya gerekli yeniden açmayı tamamla. Bu tarama her zaman salt okunur yapılabilir.','Resolve the pending operation in Recovery Centre explicitly or complete the required reload first. Read-only scanning remains available.');if(code==='quota-low')return tr('Doğrulanmış karantina kopyası ve eksik sesleri eklemek için yeterli alan yok; mevcut sesler değiştirilmedi.','Insufficient space for a verified quarantine copy and missing voices; existing voices were unchanged.');if(code==='checksum-failed'||code==='quarantine-verification-failed')return tr('Kopya bütünlüğü doğrulanamadı; ana kayıt deposuna ses yazılmadı.','Copy integrity could not be verified; no voice was written to the main recording store.');if(code==='cancelled')return tr('İşlem iptal edildi. Mevcut sesler korundu.','Operation cancelled. Existing voices were kept.');if(code==='finish-first')return tr('Önce etkin zikri, dinlemeyi ve mikrofon kaydını bitir. Diğer SÜKÛN sekmelerini kapat.','Finish active dhikr, listening and microphone recording. Close other SÜKÛN tabs.');if(code==='select-source')return tr('Önce yerel kopyaları ara ve bir ses kaynağı seç.','Search local copies and choose a voice source first.');return tr('Ses kurtarma tamamlanamadı. Mevcut seslerin üzerine yazılmadı; bulunan kaynak kopyaları korunur.','Voice rescue did not complete. Existing voices were not overwritten; discovered source copies are kept.');}
 function label(source,index){const names={point:tr('Veri noktası','Data point'),'studio-original':tr('Stüdyo asılları','Studio originals'),'studio-output':tr('Stüdyo düzenlenmiş sesleri','Studio edited voices'),prepared:tr('Bu sayfada hazırlanmış ses','Prepared voice in this page'),quarantine:tr('Önceki kurtarma kopyası','Previous rescue copy')};return (index+1)+'. '+names[source.kind]+(source.hidden?tr(' · işlem öncesi gizli kopya',' · hidden before-image'):'')+' · '+source.information.count+tr(' ses',' voices')+' · '+(source.information.bytes/1048576).toFixed(1)+' MB'+(source.at?' · '+new Date(source.at).toLocaleString(en()?'en-GB':'tr-TR'):'');}
 function render(){
  const box=document.getElementById('r1020VoiceRescue');if(!box)return;
  box.querySelector('[data-title]').textContent=tr('🛟 Kayıp sesler için kurtarma','🛟 Rescue missing voices');
  box.querySelector('[data-intro]').textContent=tr('Yerel veri noktaları, stüdyo geri alma kopyaları ve bu sayfadaki hazırlanmış sesler aranır. Arama hiçbir veriyi değiştirmez. Sesler yalnız eksik anahtarlara eklenir; mevcut sesler, ayarlar ve sayaçlar korunur.','Search local data points, Studio undo copies and voices prepared in this page. Searching changes no data. Voices are added only to missing keys; existing voices, settings and counters are kept.');
  box.querySelector('[data-warning]').textContent=tr('Kopya bulunması seslerin mutlaka kurtarılacağı anlamına gelmez. Kopya yoksa indirilen JSON yedeği gerekir. Uygulama sürümüne dönmek silinen sesleri geri getirmez. Gizli bölüm sesleri için önce bölümün kilidini aç.','Finding a copy does not guarantee recovery. A downloaded JSON backup is needed when no copy remains. Returning to an app version does not restore deleted voices. Unlock the private section first for its voices.');
  const labels={scan:tr('Yerel ses kopyalarını ara','Search local voice copies'),restore:tr('Seçili kopyadan eksik sesleri tamamla','Add missing voices from selected copy'),file:tr('JSON yedeğinden yalnız eksik sesleri ekle','Add only missing voices from JSON backup'),report:tr('Salt okunur tanılama raporunu indir','Download read-only diagnostic report'),persist:tr('Kalıcı depolama iste','Request persistent storage'),cancel:tr('İptal et','Cancel')};
  for(const [action,text] of Object.entries(labels)){const button=box.querySelector('[data-action="'+action+'"]');button.textContent=text;button.disabled=!!task||(action==='restore'&&(!sources.size||pending()))||(action==='file'&&pending())||(action==='report'&&!lastReport);}
  const persist=box.querySelector('[data-action="persist"]');persist.disabled=!!task||typeof w.navigator.storage?.persist!=='function';
  const cancel=box.querySelector('[data-action="cancel"]');cancel.hidden=!task;cancel.disabled=!task||['merging','verifying'].includes(task.phase);
  const select=box.querySelector('select'),selected=select.value;select.replaceChildren();let index=0;for(const [id,source] of sources){const option=document.createElement('option');option.value=id;option.textContent=label(source,index++);select.appendChild(option);}if(!sources.size){const option=document.createElement('option');option.value='';option.textContent=tr('Önce yerel kopyaları ara','Search local copies first');select.appendChild(option);}else if(sources.has(selected))select.value=selected;select.disabled=!!task;
  box.querySelector('[data-pending]').hidden=!pending()&&!lastReport?.recovery?.journalPresent;box.querySelector('[data-pending]').textContent=tr('Bekleyen veri geri yükleme günlüğü bulundu. Tanılamayı indirebilirsin; ses eklemeden önce Kurtarma Merkezi içindeki bekleyen işlemi çöz.','A pending data restore journal was found. You can download diagnostics; resolve the pending operation in Recovery Centre before adding voices.');
  box.querySelector('[data-status]').textContent=task?tr('Güvenli işlem sürüyor: ','Safe operation in progress: ')+({reading:tr('salt okunur arama','read-only search'),'verifying-source':tr('kaynak doğrulaması','source verification'),staging:tr('kurtarma kopyası hazırlama','preparing rescue copy'),merging:tr('yalnız eksik sesleri ekleme','adding missing voices only'),verifying:tr('eklenen sesleri doğrulama','verifying added voices')}[task.phase]||''):lastMessage;
 }
 function downloadReport(){if(!lastReport)return false;const blob=new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sukun-ses-kurtarma-tanilama-'+VERSION+'-'+Date.now()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);return true;}
 function mount(){
  if(document.getElementById('r1020VoiceRescue'))return;const host=document.querySelector('#r1019DataRecovery .r170Body')||document.getElementById('ydkBox');if(!host)return;
  const box=document.createElement('section');box.id='r1020VoiceRescue';box.setAttribute('data-noi18n','');box.innerHTML='<h4 data-title></h4><p data-intro></p><div class="r1020RescueActions"><button type="button" class="r170Btn" data-action="scan"></button><select aria-label="Ses kurtarma kaynağı / Voice rescue source"></select><button type="button" class="r170Btn" data-action="restore"></button><button type="button" class="r170Btn" data-action="file"></button><button type="button" class="r170Btn" data-action="report"></button><button type="button" class="r170Btn" data-action="persist"></button><button type="button" class="r170Btn" data-action="cancel" hidden></button></div><input type="file" accept="application/json,.json" multiple hidden><p data-pending role="alert" hidden></p><p data-status role="status" aria-live="polite"></p><p data-warning></p>';
  host.appendChild(box);const run=work=>{Promise.resolve().then(work).catch(error=>{if(!(Number(error?.added)>0))lastMessage=describe(error);render();});};box.querySelector('[data-action="scan"]').onclick=()=>run(scan);box.querySelector('[data-action="restore"]').onclick=()=>run(()=>restore(box.querySelector('select').value));const input=box.querySelector('input');box.querySelector('[data-action="file"]').onclick=()=>input.click();input.onchange=()=>{const files=Array.from(input.files||[]);input.value='';if(files.length)run(()=>importJSON(files));};box.querySelector('[data-action="report"]').onclick=downloadReport;box.querySelector('[data-action="persist"]').onclick=()=>{w.navigator.storage.persist().then(granted=>{lastMessage=granted?tr('Tarayıcı kalıcı depolamayı kabul etti. Bu, elle silmeye karşı koruma değildir; JSON yedeğini ayrıca indir.','The browser granted persistent storage. This does not protect against manual deletion; download a JSON backup too.'):tr('Tarayıcı kalıcı depolama isteğini kabul etmedi. JSON yedeğini ayrıca indir.','The browser did not grant persistent storage. Download a JSON backup too.');render();},()=>{lastMessage=tr('Kalıcı depolama isteği tamamlanamadı. Sesler değiştirilmedi.','Persistent storage request did not finish. Voices were unchanged.');render();});};box.querySelector('[data-action="cancel"]').onclick=()=>{if(task&&!['merging','verifying'].includes(task.phase))task.controller.abort();};render();
 }
 function boot(){const style=document.createElement('style');style.textContent='#r1020VoiceRescue{margin:14px 0;padding:12px;border:1px solid #68887a;border-radius:14px;min-width:0;overflow-wrap:anywhere}#r1020VoiceRescue h4{margin:0 0 8px}#r1020VoiceRescue p{font-size:12px;line-height:1.65}.r1020RescueActions{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}#r1020VoiceRescue button,#r1020VoiceRescue select{width:100%;max-width:100%;min-width:0;min-height:44px;white-space:normal;font:inherit}#r1020VoiceRescue select{background:#102b32;color:inherit;padding:8px;border-radius:9px}#r1020VoiceRescue [hidden]{display:none!important}#r1020VoiceRescue [data-pending]{color:#ecd48e}';document.head.appendChild(style);mount();if(document.getElementById('r1020VoiceRescue'))return;const observer=new MutationObserver(()=>{mount();if(document.getElementById('r1020VoiceRescue'))observer.disconnect();});observer.observe(document.body,{childList:true,subtree:true});}
 w.SukunRecordingSalvage=Object.freeze({version:VERSION,scan,restore,importJSON,downloadReport,mount,listSources:()=>Array.from(sources,([id,s])=>({id,kind:s.kind,count:s.information.count,bytes:s.information.bytes,at:Number(s.at)||0})),status:()=>({busy:!!task,phase:task?.phase||'idle',sourceCount:sources.size,pending:pending()}),snapshot:()=>lastReport?JSON.parse(JSON.stringify(lastReport)):null});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();w.addEventListener('sukun:languagechange',render);w.addEventListener('sukun:recoverydata',render);w.addEventListener('sukun:secretaccesschange',()=>{if(task)task.controller.abort();else{sources.clear();render();}});
})(window);
