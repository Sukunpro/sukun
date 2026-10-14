/* r1055: optional, independent voice bank. Personal sukunRec is never written.
   Loading/replacing validates every clip before one atomic bank transaction.
   Playback is personal-recording > enabled archive > existing device voice. */
(function(w){
 'use strict';if(w.SukunGenericRecordings)return;
 const VERSION='r1055',DB='sukunGenericRec',PREF='sukun.generic.recordings.enabled.v1',RECEIPT='sukun.generic.recordings.bank.v1';
 const LIMIT={files:96*1048576,bytes:64*1048576,clip:8*1048576,count:2000},TIMEOUT=20000;
 const PREFIX='assets/generic-recordings/',MANIFEST=PREFIX+'manifest.json';
 let enabled=false,bank=null,epoch=0,operation=null,status='ready',errorCode='',readyError=null,bootPromise=null;
 const en=()=>w.I18N?.lang==='en';
 const messages={
  'archive-empty':['Pakette henüz genel ses arşivi yok. Ses JSON yedeğini seçerek ayrı arşive yükleyebilirsin.','This package has no general voice archive yet. Select a voice JSON backup to load the separate archive.'],
  'archive-invalid':['Ses arşivi biçimi doğrulanamadı. Önceki arşiv ve kişisel kayıtların korundu.','The voice archive format could not be verified. The previous archive and personal recordings were kept.'],
  'archive-integrity':['Ses arşivi bütünlük denetiminden geçmedi. Önceki arşiv ve kişisel kayıtların korundu.','Voice archive integrity verification failed. The previous archive and personal recordings were kept.'],
  'archive-limit':['Ses arşivi boyut veya kayıt sayısı sınırını aşıyor. Daha küçük ses JSON parçalarını seç.','The voice archive exceeds the size or recording count limit. Select smaller voice JSON parts.'],
  'archive-storage':['Genel ses arşivi deposu okunamadı veya yazılamadı. Kişisel kayıtların değiştirilmedi.','The general voice archive storage could not be read or written. Personal recordings were not changed.'],
  'archive-timeout':['Genel ses arşivi işlemi süre sınırını aştı. Durumu kontrol edip yeniden dene.','The general voice archive operation timed out. Check its status and try again.'],
  'archive-cancelled':['Genel ses arşivi işlemi iptal edildi.','The general voice archive operation was cancelled.'],
  'archive-busy':['Başka bir genel ses arşivi işlemi sürüyor.','Another general voice archive operation is running.'],
  'archive-lock':['Arşiv yüklemek için etkin sesi ve mikrofon kaydını bitir; uygulamanın hazırlanmasını bekleyip yeniden dene.','Finish active audio and microphone recording before loading an archive; wait for the app to finish preparing and retry.'],
  'archive-preference':['Genel ses arşivi tercihi saklanamadı. Kullanım kapalı tutuldu.','The general voice archive preference could not be saved. Playback was kept disabled.']
 };
 const fail=code=>Object.assign(new Error((messages[code]||messages['archive-invalid'])[en()?1:0]),{name:code==='archive-cancelled'?'AbortError':'GenericArchiveError',code});
 const safeError=err=>Object.prototype.hasOwnProperty.call(messages,err?.code)?err.code:err?.name==='AbortError'?'archive-cancelled':'archive-storage';
 function message(){return errorCode?(messages[errorCode]||messages['archive-storage'])[en()?1:0]:status==='loaded'?(en()?'General voice archive loaded. Enable it to use recordings where your own voice is missing.':'Genel ses arşivi yüklendi. Kendi kaydın bulunmayan okumalar için kullanımı açabilirsin.'):status==='exported'?(en()?'General voice archive export is ready.':'Genel ses arşivi dışa aktarımı hazır.'):(en()?'In automatic mode, your own recordings have priority. The archive is optional.':'Otomatik seçimde kendi kayıtların önceliklidir. Arşiv kullanımı isteğe bağlıdır.');}
 const snapshot=()=>Object.freeze({version:VERSION,enabled,ready:!!bank,count:bank?.records.length||0,bytes:bank?.bytes||0,bankId:bank?.bankId||'',epoch,busy:!!operation,status,errorCode,message:message()});
 function emit(reason='status'){try{w.dispatchEvent(new CustomEvent(reason==='status'?'sukun:genericrecordingsstatus':'sukun:genericrecordingschange',{detail:reason==='status'?snapshot():{reason,epoch,snapshot:snapshot()}}))}catch(_){};}
 function state(value,err=''){status=value;errorCode=err;emit();}
 function check(opt={}){if(opt.signal?.aborted||opt.isCurrent&&opt.isCurrent()!==true)throw fail('archive-cancelled');}
 function keyOk(key){return typeof key==='string'&&/^[A-Za-z0-9_.:-]{1,200}$/.test(key)&&!['__proto__','prototype','constructor'].includes(key)&&!key.startsWith('archive:');}
 function typeOk(type){return typeof type==='string'&&type.length<=100&&/^audio\/[A-Za-z0-9.+-]+(?:;\s*[A-Za-z0-9.+_-]+=(?:"[A-Za-z0-9., +_/-]+"|[A-Za-z0-9., +_/-]+))*$/i.test(type);}
 function allowed(key){try{return !w.SukunSecretPolicy?.secretRecKey?.(key)||w.SukunSecretPolicy?.unlocked?.()===true}catch(_){return false}}
 function row(value){
  if(!value||!keyOk(value.key)||!typeOk(value.type)||!Number.isSafeInteger(value.bytes)||value.bytes<1||value.bytes>LIMIT.clip||!/^[a-f0-9]{64}$/.test(value.sha256||''))throw fail('archive-invalid');
  return{key:value.key,type:value.type.toLowerCase(),bytes:value.bytes,sha256:value.sha256};
 }
 function metadata(value){
  if(!value||value.schema!==1||!/^[a-f0-9]{64}$/.test(value.bankId||'')||!Array.isArray(value.records)||!value.records.length||value.records.length>LIMIT.count)throw fail('archive-invalid');
  const records=value.records.map(row),seen=new Set();let bytes=0;
  for(const item of records){if(seen.has(item.key))throw fail('archive-invalid');seen.add(item.key);bytes+=item.bytes;}
  if(bytes>LIMIT.bytes)throw fail('archive-limit');
  return{schema:1,bankId:value.bankId,records,bytes,keys:new Set(records.map(x=>x.key))};
 }
 const metaRows=records=>records.map(({key,type,bytes,sha256})=>({key,type,bytes,sha256}));
 async function hash(value,opt={}){
  check(opt);if(!w.crypto?.subtle)throw fail('archive-integrity');
  const bytes=typeof value==='string'?new TextEncoder().encode(value):await value.arrayBuffer();check(opt);
  const digest=await w.crypto.subtle.digest('SHA-256',bytes);check(opt);
  return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 }
 function decode(data,type){
  if(!typeOk(type)||typeof data!=='string'||!data.length||data.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw fail('archive-invalid');
  const padding=data.endsWith('==')?2:data.endsWith('=')?1:0,alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  if(padding&&(alphabet.indexOf(data[data.length-padding-1])&(padding===2?15:3)))throw fail('archive-invalid');
  const size=data.length/4*3-padding;if(size<1||size>LIMIT.clip)throw fail('archive-limit');
  let binary;try{binary=atob(data)}catch(_){throw fail('archive-invalid')};if(binary.length!==size)throw fail('archive-invalid');
  const bytes=new Uint8Array(size);for(let i=0;i<size;i++)bytes[i]=binary.charCodeAt(i);
  return new Blob([bytes],{type});
 }
 function dataUri(value){
  if(typeof value!=='string')throw fail('archive-invalid');const comma=value.lastIndexOf(','),head=value.slice(0,comma);
  if(comma<0||!head.startsWith('data:')||!head.toLowerCase().endsWith(';base64'))throw fail('archive-invalid');
  return decode(value.slice(comma+1),head.slice(5,-7));
 }
 function open(create=false){
  return new Promise((resolve,reject)=>{
   if(!w.indexedDB){reject(fail('archive-storage'));return}
   let done=false,missing=false,request;const timer=setTimeout(()=>finish(null,fail('archive-timeout')),TIMEOUT);
   function finish(db,error){if(done){try{db?.close()}catch(_){};return}done=true;clearTimeout(timer);error?reject(error):resolve(db)}
   try{
    request=w.indexedDB.open(DB,1);
    request.onupgradeneeded=()=>{
     if(done){request.transaction.abort();return}
     if(!create){missing=true;request.transaction.abort();return}
     const db=request.result;db.createObjectStore('clips',{keyPath:'key'});db.createObjectStore('meta');
    };
    request.onerror=()=>missing?finish(null):finish(null,fail('archive-storage'));
    request.onblocked=()=>finish(null,fail('archive-storage'));
    request.onsuccess=()=>{const db=request.result;if(!db.objectStoreNames.contains('clips')||!db.objectStoreNames.contains('meta')){finish(db,fail('archive-storage'));db.close();return}finish(db)};
   }catch(_){finish(null,fail('archive-storage'))}
  });
 }
 async function tx(mode,work,opt={},create=false){
  check(opt);const db=await open(create);if(!db){check(opt);return null;}
  try{check(opt);return await new Promise((resolve,reject)=>{
   let settled=false,value,transaction;const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);opt.signal?.removeEventListener?.('abort',abort);w.removeEventListener?.('sukun:tabownerchange',changed);error?reject(error):resolve(typeof value==='function'?value():value)};
   const abort=()=>{try{transaction?.abort()}catch(_){};finish(fail('archive-cancelled'))};
   const changed=()=>{try{check(opt)}catch(_){abort()}};
   const timer=setTimeout(()=>{try{transaction?.abort()}catch(_){};finish(fail('archive-timeout'))},TIMEOUT);
   try{
    transaction=db.transaction(['clips','meta'],mode);
    transaction.oncomplete=()=>finish();transaction.onerror=transaction.onabort=()=>finish(fail(opt.signal?.aborted?'archive-cancelled':'archive-storage'));
    opt.signal?.addEventListener?.('abort',abort,{once:true});w.addEventListener?.('sukun:tabownerchange',changed);check(opt);
    value=work(transaction.objectStore('clips'),transaction.objectStore('meta'),transaction);
   }catch(error){try{transaction?.abort()}catch(_){};finish(error)}
  })}finally{db.close()}
 }
 async function hydrate(){
  const currentEpoch=epoch;
  try{
   const value=await tx('readonly',(_clips,meta)=>{const request=meta.get('bank');return()=>request.result});
   if(currentEpoch!==epoch)return snapshot();
   const candidate=value?metadata(value):null;
   if(candidate&&await hash(JSON.stringify(metaRows(candidate.records)))!==candidate.bankId)throw fail('archive-integrity');
   if(currentEpoch!==epoch)return snapshot();
   bank=candidate;readyError=null;epoch++;emit('ready');return snapshot();
  }catch(error){if(currentEpoch===epoch){readyError=error;bank=null;epoch++;state('failed',safeError(error));emit('ready')}return snapshot()}
 }
 const ready=()=>bootPromise||(bootPromise=hydrate());
 function hasKnown(keys){return !!(enabled&&bank&&Array.from(keys||[]).some(key=>bank.keys.has(key)&&allowed(key)));}
 function signature(keys){return !enabled?'archive:off':`archive:${epoch}:${bank?.bankId||'missing'}:`+Array.from(keys||[]).filter(key=>bank?.keys.has(key)&&allowed(key)).join(',');}
 async function readGeneric(keys,opt={}){
  if(!enabled)return null;await ready();check(opt);if(!enabled)return null;
  if(readyError)throw readyError;
  const selected=Array.from(keys||[]).find(key=>bank?.keys.has(key)&&allowed(key));if(!selected)return null;
  const captured=epoch,id=bank.bankId,record=bank.records.find(x=>x.key===selected);
  const current=()=>enabled&&epoch===captured&&(!opt.isCurrent||opt.isCurrent()===true);
  const recordOpt={...opt,isCurrent:current};check(recordOpt);
  const value=await tx('readonly',clips=>{const request=clips.get(selected);return()=>request.result},recordOpt);check(recordOpt);
  if(!value||!(value.blob instanceof Blob)||value.blob.size!==record.bytes||value.blob.type!==record.type||value.sha256!==record.sha256||await hash(value.blob,recordOpt)!==record.sha256){state('failed','archive-integrity');throw fail('archive-integrity')}
  check(recordOpt);return{key:'archive:'+id+':'+selected,canonicalKey:selected,blob:value.blob,revision:0,generic:true,genericEpoch:captured};
 }
 async function find(keys,opt={}){
  if(!enabled)return null;check(opt);if(!Array.from(keys||[]).length)return null;
  const controller=new AbortController(),abort=()=>controller.abort();opt.signal?.addEventListener?.('abort',abort,{once:true});
  const guard={...opt,signal:controller.signal},budget=Math.max(1,Math.min(TIMEOUT,Number(opt.timeoutMs)||TIMEOUT));let timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(fail('archive-timeout'))},budget);});
  try{return await Promise.race([readGeneric(keys,guard),deadline]);}
  catch(error){if(error?.name!=='AbortError')state('failed',safeError(error));throw error;}
  finally{clearTimeout(timer);opt.signal?.removeEventListener?.('abort',abort);}
 }
 async function readText(file,opt={}){
  check(opt);return new Promise((resolve,reject)=>{
   let done=false;const finish=(value,error)=>{if(done)return;done=true;clearTimeout(timer);opt.signal?.removeEventListener?.('abort',abort);error?reject(error):resolve(value)};
   const abort=()=>finish(null,fail('archive-cancelled')),timer=setTimeout(()=>finish(null,fail('archive-timeout')),TIMEOUT);
   opt.signal?.addEventListener?.('abort',abort,{once:true});
   Promise.resolve().then(()=>file.text()).then(value=>{try{check(opt);finish(value)}catch(error){finish(null,error)}},()=>finish(null,fail('archive-invalid')));
  });
 }
 async function validateFiles(files,opt={}){
  const list=Array.from(files||[]);if(!list.length||list.length>1000)throw fail('archive-empty');
  let inputBytes=0,bytes=0,legacyFiles=0;const entries=new Map(),sets=new Map();
  for(const file of list){
   check(opt);inputBytes+=file.size;if(!Number.isSafeInteger(file.size)||file.size<1||inputBytes>LIMIT.files)throw fail('archive-limit');
   let value;try{value=JSON.parse(await readText(file,opt))}catch(error){throw error?.code?error:fail('archive-invalid')};check(opt);
   if(!value||typeof value!=='object'||Array.isArray(value))throw fail('archive-invalid');
   let records,format,set=null,verified=null;
   if(value.app==='SUKUN_GENERIC_RECORDINGS'&&value.schema===1){
    if(!Array.isArray(value.records)||!value.records.length||value.records.length>LIMIT.count)throw fail('archive-empty');
    const rows=value.records.map(row);if(new Set(rows.map(x=>x.key)).size!==rows.length)throw fail('archive-invalid');
    if(await hash(JSON.stringify(metaRows(rows)),opt)!==value.bankSha256)throw fail('archive-integrity');
    records=value.records;format='generic';
   }else if(Object.prototype.hasOwnProperty.call(value,'recovery')){
    if(typeof w.SukunRecordingSalvage?.validateNativeJSON!=='function')throw fail('archive-invalid');
    try{verified=new Map(await w.SukunRecordingSalvage.validateNativeJSON(value,{assertCurrent:()=>check(opt)}))}catch(_){throw fail('archive-integrity')}
    records=value.idb?.sukunRec;format='full';
   }else if(value.uygulama==='SUKUN'&&value.kayitlar&&typeof value.kayitlar==='object'&&!Array.isArray(value.kayitlar)){
    records=value.kayitlar;format='voices';
    if(typeof skAudioSetValidate==='function')set=await skAudioSetValidate(value,{detached:true});
    else if(value.sur>=2||value.backupSet)throw fail('archive-integrity');else legacyFiles++;
    if(set?.legacy)legacyFiles++;
    if(set&&!set.legacy){const prior=sets.get(set.setId);if(prior&&prior.hash!==set.manifestHash)throw fail('archive-integrity');if(!prior)sets.set(set.setId,{hash:set.manifestHash,parts:set.parts,received:new Set()});sets.get(set.setId).received.add(set.part);}
   }else if(value.app==='SUKUN'&&[undefined,1,2].includes(value.fmt)&&value.idb?.sukunRec&&typeof value.idb.sukunRec==='object'&&!Array.isArray(value.idb.sukunRec)){
    records=value.idb.sukunRec;format='full';legacyFiles++;
   }else throw fail('archive-invalid');
   if(!records||typeof records!=='object'||format!=='generic'&&Array.isArray(records))throw fail('archive-invalid');
   const items=format==='generic'?records.map(record=>[record.key,record]):Object.entries(records);
   if(items.length>LIMIT.count)throw fail('archive-limit');
   for(const [key,record]of items){
    check(opt);if(!keyOk(key)||!record||typeof record!=='object'||Array.isArray(record))throw fail('archive-invalid');
    const blob=verified?verified.get(key):format==='generic'?dataUri(record.data):format==='full'?dataUri(record.__blob):decode(record.veri,record.tur||'audio/webm');
    if(!(blob instanceof Blob)||blob.size<1||blob.size>LIMIT.clip||!typeOk(blob.type))throw fail('archive-limit');
    const sha256=await hash(blob,opt);check(opt);
    if(format==='generic'&&(record.bytes!==blob.size||record.type.toLowerCase()!==blob.type||record.sha256!==sha256))throw fail('archive-integrity');
    if(set&&!set.legacy){const expected=set.records.find(item=>item[0]===key);if(!expected||expected[1].toLowerCase()!==blob.type||expected[2]!==blob.size||expected[3]!==sha256)throw fail('archive-integrity');}
    if(entries.has(key)){if(entries.get(key).sha256!==sha256||entries.get(key).type!==blob.type)throw fail('archive-integrity');continue}
    bytes+=blob.size;if(bytes>LIMIT.bytes||entries.size>=LIMIT.count)throw fail('archive-limit');
    entries.set(key,{key,blob,type:blob.type,bytes:blob.size,sha256});
    if(entries.size%8===0){await new Promise(resolve=>setTimeout(resolve,0));check(opt);}
   }
  }
  if(!entries.size)throw fail('archive-empty');
  for(const set of sets.values())if(set.received.size!==set.parts)throw fail('archive-integrity');
  const records=Array.from(entries.values()).sort((a,b)=>a.key.localeCompare(b.key));
  return{records,bytes,bankId:await hash(JSON.stringify(metaRows(records)),opt),legacyFiles};
 }
 async function replace(plan,opt={}){
  check(opt);await tx('readwrite',(clips,meta)=>{
   check(opt);clips.clear();for(const record of plan.records)clips.put(record);
   meta.put({schema:1,bankId:plan.bankId,records:metaRows(plan.records)},'bank');
  },opt,true);
  // Transaction completion is authoritative; publish the committed bank even
  // if the UI request is cancelled just after it commits.
  const previous=bank;bank=metadata({schema:1,bankId:plan.bankId,records:metaRows(plan.records)});readyError=null;epoch++;invalidate(previous);
  try{w.localStorage.setItem(RECEIPT,JSON.stringify({bankId:bank.bankId,count:bank.records.length,at:Date.now()}))}catch(_){}
  state('loaded');emit('import');return{ok:true,count:bank.records.length,bytes:bank.bytes,bankId:bank.bankId,legacyFiles:plan.legacyFiles||0};
 }
 async function managed(work,opt={}){
  if(operation)throw fail('archive-busy');
  const controller=new AbortController(),task={controller};operation=task;state('loading');
  const current=()=>operation===task&&!controller.signal.aborted&&(!opt.isCurrent||opt.isCurrent()===true)&&!opt.signal?.aborted;
  const guard={signal:controller.signal,isCurrent:current};const externalAbort=()=>controller.abort();opt.signal?.addEventListener?.('abort',externalAbort,{once:true});
  try{
   await ready();check(guard);
   if(typeof w.SukunTabOwner?.maintenance!=='function')throw fail('archive-lock');
   const result=await w.SukunTabOwner.maintenance('generic-archive-import',lease=>work({...guard,isCurrent:()=>current()&&lease.current()}),{throwOnBlocked:true});
   if(result===false)throw fail('archive-lock');return result;
  }catch(error){state('failed',safeError(error));throw error?.code?error:fail(safeError(error));}
  finally{opt.signal?.removeEventListener?.('abort',externalAbort);if(operation===task)operation=null;emit();}
 }
 const importFiles=(files,opt={})=>managed(async guard=>replace(await validateFiles(files,guard),guard),opt);
 function pathFor(file){
  if(typeof file!=='string'||!/^[A-Za-z0-9._/-]{1,240}$/.test(file)||file.startsWith('/')||file.split('/').some(x=>!x||x==='.'||x==='..'))throw fail('archive-invalid');
  const url=new URL(PREFIX+file,new URL('./',w.location.href));if(url.origin!==w.location.origin)throw fail('archive-invalid');return url;
 }
 async function fetchFile(url,max,opt={}){
  check(opt);const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,TIMEOUT);opt.signal?.addEventListener?.('abort',abort,{once:true});
  try{const response=await w.fetch(url,{signal:controller.signal,credentials:'same-origin'});if(!response.ok)throw fail('archive-empty');if(Number(response.headers?.get?.('content-length'))>max)throw fail('archive-limit');const blob=await response.blob();check(opt);if(blob.size>max)throw fail('archive-limit');return blob;}
  catch(error){if(controller.signal.aborted&&!opt.signal?.aborted)throw fail('archive-timeout');throw error;}
  finally{clearTimeout(timer);opt.signal?.removeEventListener?.('abort',abort);}
 }
 const loadBundled=(opt={})=>managed(async guard=>{
  const manifestBlob=await fetchFile(new URL(MANIFEST,new URL('./',w.location.href)),2*1048576,guard);let manifest;
  try{manifest=JSON.parse(await manifestBlob.text())}catch(_){throw fail('archive-invalid')}
  if(manifest?.app!=='SUKUN_GENERIC_RECORDINGS'||manifest.schema!==1||!Array.isArray(manifest.records))throw fail('archive-invalid');
  if(!manifest.records.length)throw fail('archive-empty');
  const rows=manifest.records.map(row);if(rows.length>LIMIT.count||rows.reduce((n,x)=>n+x.bytes,0)>LIMIT.bytes)throw fail('archive-limit');
  if(await hash(JSON.stringify(metaRows(rows)),guard)!==manifest.bankSha256)throw fail('archive-integrity');
  const seen=new Set(),records=[];
  for(let i=0;i<rows.length;i++){
   const row=rows[i];if(seen.has(row.key))throw fail('archive-invalid');seen.add(row.key);
   const fetched=await fetchFile(pathFor(manifest.records[i].file),row.bytes,guard),blob=new Blob([fetched],{type:row.type});
   if(blob.size!==row.bytes||await hash(blob,guard)!==row.sha256)throw fail('archive-integrity');records.push({...row,blob});
  }
  return replace({records,bankId:manifest.bankSha256,legacyFiles:0},guard);
 },opt);
 function invalidate(previous){
  if(!previous)return;for(const record of previous.records)try{w.sukunInvalidateRecordingPool?.('archive:'+previous.bankId+':'+record.key,'generic-archive-change')}catch(_){}
 }
 async function setEnabled(value){
  if(typeof value!=='boolean')throw fail('archive-invalid');if(operation)throw fail('archive-busy');await ready();if(operation)throw fail('archive-busy');
  if(value&&(!bank||readyError)){state('failed',readyError?safeError(readyError):'archive-empty');throw readyError||fail('archive-empty');}
  if(enabled===value)return snapshot();
  const captured=epoch,task={controller:new AbortController()};operation=task;
  const apply=()=>{
   if(epoch!==captured||operation!==task||task.controller.signal.aborted)throw fail('archive-cancelled');
   try{w.localStorage.setItem(PREF,value?'true':'false');if(w.localStorage.getItem(PREF)!==(value?'true':'false'))throw 0;}
   catch(_){try{w.localStorage.setItem(PREF,'false')}catch(_){}enabled=false;epoch++;state('failed','archive-preference');invalidate(bank);emit('disabled');throw fail('archive-preference');}
   enabled=value;epoch++;invalidate(bank);state(value?'enabled':'disabled');emit(value?'enabled':'disabled');
  };
  try{
   if(typeof w.SukunVoiceSettings?.edit==='function'){
    if(await w.SukunVoiceSettings.edit(apply)===false)throw fail('archive-cancelled');
   }else{
    if(typeof w.SukunTabOwner?.maintenance!=='function')throw fail('archive-lock');
    const result=await w.SukunTabOwner.maintenance('generic-archive-preference',lease=>{lease.assertCurrent();apply();return true;},{throwOnBlocked:true});
    if(result===false)throw fail('archive-lock');
   }
   return snapshot();
  }catch(error){state('failed',safeError(error));throw error;}
  finally{if(operation===task)operation=null;emit();}
 }

 function encode(blob,opt={}){return new Promise((resolve,reject)=>{
  check(opt);const reader=new FileReader();reader.onerror=reader.onabort=()=>reject(fail('archive-storage'));reader.onload=()=>{try{check(opt);resolve(String(reader.result))}catch(e){reject(e)}};reader.readAsDataURL(blob);
 });}
 async function exportBank(opt={}){
  await ready();check(opt);if(operation)throw fail('archive-busy');if(!bank)throw fail('archive-empty');
  const captured=epoch,original=bank,guard={...opt,isCurrent:()=>epoch===captured&&(!opt.isCurrent||opt.isCurrent()===true)},records=[];
  for(const item of original.records){
   check(guard);const value=await tx('readonly',clips=>{const request=clips.get(item.key);return()=>request.result},guard);
   if(!value?.blob||value.blob.size!==item.bytes||value.blob.type!==item.type||await hash(value.blob,guard)!==item.sha256)throw fail('archive-integrity');
   records.push({...item,data:await encode(value.blob,guard)});
  }
  check(guard);const blob=new Blob([JSON.stringify({app:'SUKUN_GENERIC_RECORDINGS',schema:1,bankSha256:original.bankId,records})],{type:'application/json'});
  state('exported');return{blob,filename:'SUKUN_GENEL_SES_ARSIVI.json',count:records.length,bytes:original.bytes};
 }
 try{enabled=w.localStorage.getItem(PREF)==='true'}catch(_){enabled=false}
 w.addEventListener?.('storage',event=>{
  if(event.key===PREF){enabled=event.newValue==='true';epoch++;emit(enabled?'enabled':'disabled');}
  if(event.key===RECEIPT){epoch++;bank=null;bootPromise=null;emit('refresh');void ready();}
 });
 w.SukunGenericRecordings=Object.freeze({version:VERSION,snapshot,ready,epoch:()=>epoch,signature,hasKnown,find,validateFiles,importFiles,loadBundled,setEnabled,exportBank,cancel(){operation?.controller.abort();},limits:Object.freeze({...LIMIT})});
 void ready();
})(window);
