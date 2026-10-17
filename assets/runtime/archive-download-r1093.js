/* Explicit resumable archive staging. The live bank changes only after a
 * reviewed, revalidated CAS commit through its existing maintenance owner. */
(function(w){
 'use strict';if(w.SukunArchiveDownloadR1093)return;
 const VERSION='r1093',DB='sukunGenericStageR1093',PREFIX='assets/generic-recordings/',MAX_MANIFEST=2*1048576,TIMEOUT=30000;
 const MANIFEST_SHA256='565a668263eb3c3872a9c0f1639fcaa81e7e73a5c31c8c901c054d533ba4be14';
 const LIMIT={bytes:64*1048576,clip:8*1048576,count:2000},LABELS={arinma:'Arınma',berhet:'Berhetiyye',dua:'Dualar',esma:'Esmâ',hizb:'Hizb',koruma:'Koruma',mzbz:'Berhetiyye',niyet:'Niyet',salavat:'Salavat',seyyid:'İstiğfar',temel:'Temel zikir',terkip:'Terkip',tesbih:'Tesbih',tevhid:'Tevhid',vakif:'Vakıf'};
 let catalogue=null,active=null,task=null,previewPlan=null,accessEpoch=0;
 let state={phase:'idle',selection:[],resumable:false,verifiedCount:0,totalCount:0,verifiedBytes:0,totalBytes:0,downloadedBytes:0,errorCode:'',preview:null};
 const fail=code=>Object.assign(new Error(code),{name:code==='archive-cancelled'?'AbortError':'ArchiveDownloadError',code});
 const ERROR_CODES=new Set(['archive-access-locked','archive-cancelled','archive-download-failed','archive-download-timeout','archive-integrity','archive-invalid','archive-limit','archive-preview-stale','archive-selection','archive-stage-blocked','archive-stage-busy','archive-stage-empty','archive-stage-incomplete','archive-stage-integrity','archive-stage-limit','archive-stage-quota','archive-stage-stale','archive-stage-storage','archive-stage-timeout','archive-stream-unavailable','archive-update-required','archive-stale','archive-private-bank-locked','archive-lock','archive-busy','archive-storage','archive-timeout','archive-empty','archive-preference']);
 const ownError=error=>typeof error?.code==='string'&&ERROR_CODES.has(error.code);
 const normalizeError=(error,fallback='archive-stage-storage')=>ownError(error)?error:fail(error?.name==='QuotaExceededError'?'archive-stage-quota':error?.name==='AbortError'?'archive-cancelled':fallback);
 const privateKey=key=>/^berhet:|^mzbz:|berhetiy/i.test(String(key||''));
 function allowed(key){try{const unlocked=w.SukunSecretPolicy?.unlocked?.()===true;if(privateKey(key)&&!unlocked)return false;return w.SukunSecretPolicy?.secretRecKey?.(key)!==true||unlocked}catch(_){return false}}
 const category=row=>String(row.key).split(':')[0];
 const categoriesFor=manifest=>{const groups=new Map();for(const row of manifest?.records||[]){if(!allowed(row.key))continue;const id=category(row),item=groups.get(id)||{id,label:LABELS[id]||'Diğer kayıtlar',count:0,bytes:0};item.count++;item.bytes+=row.bytes;groups.set(id,item)}return [...groups.values()]};
 function snapshot(){
  const selection=state.selection.filter(id=>allowed(id+':0')),sensitive=selection.length!==state.selection.length;
  return Object.freeze({version:VERSION,...state,busy:!!task,categories:categoriesFor(catalogue?.manifest),selection,preview:sensitive?null:state.preview?{...state.preview}:null,
   ...(sensitive?{resumable:false,verifiedCount:0,totalCount:0,verifiedBytes:0,totalBytes:0,downloadedBytes:0}:{})});
 }
 function emit(){try{w.dispatchEvent(new CustomEvent('sukun:archivedownloadchange',{detail:snapshot()}))}catch(_){}}
 function set(patch){state={...state,...patch};emit()}
 function check(opt={}){if(opt.signal?.aborted||opt.isCurrent&&opt.isCurrent()!==true)throw fail('archive-cancelled')}
 const random=()=>typeof w.crypto?.randomUUID==='function'?w.crypto.randomUUID():Array.from(w.crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
 async function hash(value,opt={}){check(opt);if(!w.crypto?.subtle)throw fail('archive-integrity');const bytes=typeof value==='string'?new TextEncoder().encode(value):await value.arrayBuffer();check(opt);let digest;try{digest=await w.crypto.subtle.digest('SHA-256',bytes)}catch(error){throw normalizeError(error,'archive-integrity')}check(opt);return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('')}
 function validateRow(row){
  if(!row||typeof row.key!=='string'||!/^[A-Za-z0-9_.:-]{1,200}$/.test(row.key)||['__proto__','prototype','constructor'].includes(row.key)||row.key.startsWith('archive:')||typeof row.type!=='string'||!/^audio\/webm(?:;\s*codecs=[A-Za-z0-9,._-]+)?$/i.test(row.type)||!Number.isSafeInteger(row.bytes)||row.bytes<1||row.bytes>LIMIT.clip||!/^[a-f0-9]{64}$/.test(row.sha256||'')||row.file!=='audio/'+row.sha256+'.webm')throw fail('archive-invalid');
  return{key:row.key,type:row.type.toLowerCase(),bytes:row.bytes,sha256:row.sha256,file:row.file};
 }
 const metaRows=rows=>rows.map(({key,type,bytes,sha256})=>({key,type,bytes,sha256}));
 async function validateManifest(value,opt={}){
  if(!value||value.app!=='SUKUN_GENERIC_RECORDINGS'||value.schema!==1||!Array.isArray(value.records)||!value.records.length||value.records.length>LIMIT.count||!/^[a-f0-9]{64}$/.test(value.bankSha256||''))throw fail('archive-invalid');
  const records=value.records.map(validateRow),keys=new Set(records.map(row=>row.key)),bytes=records.reduce((sum,row)=>sum+row.bytes,0);
  if(keys.size!==records.length||bytes>LIMIT.bytes)throw fail('archive-limit');
  if(await hash(JSON.stringify(metaRows(records)),opt)!==value.bankSha256)throw fail('archive-integrity');
  const manifest={app:value.app,schema:1,bankSha256:value.bankSha256,records};
  return{manifest,manifestId:await hash(JSON.stringify(manifest),opt)};
 }
 function selectedRows(manifest,ids){
  if(!Array.isArray(ids)||!ids.length||ids.length>64||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!/^[a-z0-9_-]{1,40}$/.test(id)||!allowed(id+':0')))throw fail('archive-selection');
  const rows=manifest.records.filter(row=>ids.includes(category(row)));
  if(!rows.length||ids.some(id=>!rows.some(row=>category(row)===id))||rows.some(row=>!allowed(row.key)))throw fail('archive-selection');return rows;
 }
 function same(a,b){return !!a&&!!b&&a.stageId===b.stageId&&a.manifestId===b.manifestId&&a.revision===b.revision&&JSON.stringify(a.categories)===JSON.stringify(b.categories)}
 function open(create=false){return new Promise((resolve,reject)=>{
  if(!w.indexedDB)return reject(fail('archive-stage-storage'));let settled=false,missing=false,request;
  const finish=(db,error)=>{if(settled){try{db?.close()}catch(_){};return}settled=true;clearTimeout(timer);error?reject(error):resolve(db)};
  const timer=setTimeout(()=>finish(null,fail('archive-stage-timeout')),TIMEOUT);
  try{request=w.indexedDB.open(DB,1);request.onupgradeneeded=()=>{if(settled||!create){missing=true;try{request.transaction.abort()}catch(_){};return}request.result.createObjectStore('clips',{keyPath:'id'});request.result.createObjectStore('meta')};request.onerror=()=>missing?finish(null):finish(null,normalizeError(request.error));request.onblocked=()=>finish(null,fail('archive-stage-blocked'));request.onsuccess=()=>{const db=request.result;if(!db.objectStoreNames.contains('clips')||!db.objectStoreNames.contains('meta')){db.close();finish(null,fail('archive-stage-storage'));return}finish(db)}}catch(error){finish(null,normalizeError(error))}
 })}
 async function transaction(mode,work,opt={},create=false){
  check(opt);const db=await open(create);try{check(opt)}catch(error){db?.close();throw error}if(!db)return null;
  try{return await new Promise((resolve,reject)=>{
   let tx,value,done=false;const finish=error=>{if(done)return;done=true;clearTimeout(timer);opt.signal?.removeEventListener?.('abort',abort);error?reject(error):resolve(typeof value==='function'?value():value)};
   const abort=()=>{if(tx)tx.__stageFailure=fail('archive-cancelled');try{tx?.abort()}catch(_){};finish(fail('archive-cancelled'))};
   const timer=setTimeout(()=>{if(tx)tx.__stageFailure=fail('archive-stage-timeout');try{tx?.abort()}catch(_){};finish(fail('archive-stage-timeout'))},TIMEOUT);
   try{tx=db.transaction(['clips','meta'],mode);tx.oncomplete=()=>finish();tx.onabort=tx.onerror=event=>finish(normalizeError(tx.__stageFailure||tx.error||event?.target?.error));opt.signal?.addEventListener?.('abort',abort,{once:true});check(opt);value=work(tx.objectStore('clips'),tx.objectStore('meta'),tx)}catch(error){const failure=normalizeError(error);if(tx)tx.__stageFailure=failure;try{tx?.abort()}catch(_){};finish(failure)}
  })}finally{db.close()}
 }
 function rejectTransaction(tx,error){tx.__stageFailure=normalizeError(error);try{tx.abort()}catch(_){}}
 async function stageDescriptor(opt={}){
  const raw=await transaction('readonly',(_clips,meta)=>{const request=meta.get('active');return()=>request.result||null},opt);check(opt);if(!raw)return null;
  if(raw.schema!==1||!Number.isSafeInteger(raw.revision)||raw.revision<1||typeof raw.stageId!=='string'||raw.stageId!==raw.manifestId)throw fail('archive-stage-integrity');
  if(typeof raw.manifestText!=='string'||new TextEncoder().encode(raw.manifestText).byteLength>MAX_MANIFEST||await hash(raw.manifestText,opt)!==MANIFEST_SHA256)throw fail('archive-stage-integrity');
  let parsed;try{parsed=JSON.parse(raw.manifestText)}catch(_){throw fail('archive-stage-integrity')}
  const value=await validateManifest(parsed,opt);if(value.manifestId!==raw.manifestId)throw fail('archive-stage-integrity');
  if(!Array.isArray(raw.categories)||raw.categories.some(id=>!allowed(id+':0')))throw fail('archive-access-locked');
  const rows=selectedRows(value.manifest,raw.categories);return{...raw,manifest:value.manifest,rows};
 }
 function requireActive(raw,descriptor,claim){if(!same(raw,descriptor)||raw.claim&&raw.claim.until>Date.now()&&raw.claim.id!==claim)throw fail('archive-stage-stale')}
 async function beginStage(value,ids,opt){
  const categories=ids.slice().sort(),rows=selectedRows(value.manifest,categories);let descriptor;
  await transaction('readwrite',(clips,meta,tx)=>{
   const request=meta.get('active');request.onsuccess=()=>{try{
    check(opt);const before=request.result;if(before?.claim?.until>Date.now())throw fail('archive-stage-busy');
    const revision=before?.revision||0;if(!Number.isSafeInteger(revision)||revision>=Number.MAX_SAFE_INTEGER)throw fail('archive-stage-integrity');
    descriptor={schema:1,stageId:value.manifestId,manifestId:value.manifestId,revision:revision+1,manifest:value.manifest,manifestText:value.manifestText,categories,rows,savedCount:0,savedBytes:0,claim:null};
    const existing=clips.getAll();existing.onsuccess=()=>{try{check(opt);if(existing.result.length>LIMIT.count*2)throw fail('archive-stage-limit');for(const clip of existing.result)if(clip.stageId!==value.manifestId)clips.delete(clip.id);meta.put(descriptor,'active')}catch(error){rejectTransaction(tx,error)}};
   }catch(error){rejectTransaction(tx,error)}};
  },opt,true);check(opt);return descriptor;
 }
 async function claimStage(descriptor,opt){
  const claim={id:random(),until:Date.now()+180000};
  await transaction('readwrite',(_clips,meta,tx)=>{const request=meta.get('active');request.onsuccess=()=>{try{check(opt);requireActive(request.result,descriptor);meta.put({...request.result,claim},'active')}catch(error){rejectTransaction(tx,error)}}},opt);
  return claim;
 }
 async function releaseClaim(descriptor,claim){try{await transaction('readwrite',(_clips,meta)=>{const request=meta.get('active');request.onsuccess=()=>{if(same(request.result,descriptor)&&request.result.claim?.id===claim.id)meta.put({...request.result,claim:null},'active')}})}catch(_){}}
 async function readClip(descriptor,row,opt,claim){
  return transaction('readonly',(clips,meta,tx)=>{const m=meta.get('active'),c=clips.get(descriptor.stageId+':'+row.key);m.onsuccess=()=>{try{check(opt);requireActive(m.result,descriptor,claim)}catch(error){rejectTransaction(tx,error)}};return()=>c.result||null},opt);
 }
 async function persist(descriptor,row,blob,count,bytes,opt){
  await transaction('readwrite',(clips,meta,tx)=>{const request=meta.get('active');request.onsuccess=()=>{try{check(opt);requireActive(request.result,descriptor);if(blob)clips.put({id:descriptor.stageId+':'+row.key,stageId:descriptor.stageId,key:row.key,type:row.type,bytes:row.bytes,sha256:row.sha256,blob});meta.put({...request.result,savedCount:count,savedBytes:bytes},'active')}catch(error){rejectTransaction(tx,error)}}},opt);
 }
 async function networkProtocol(opt){
  const worker=w.navigator?.serviceWorker?.controller;if(!worker)return;
  if(opt.protocolWorker===worker)return;
  if(typeof MessageChannel!=='function')throw fail('archive-update-required');
  const data=await new Promise((resolve,reject)=>{const channel=new MessageChannel();let done=false;const finish=(value,error)=>{if(done)return;done=true;clearTimeout(timer);channel.port1.close();opt.signal?.removeEventListener?.('abort',abort);error?reject(error):resolve(value)};const abort=()=>finish(null,fail('archive-cancelled')),timer=setTimeout(()=>finish(null,fail('archive-update-required')),2000);opt.signal?.addEventListener?.('abort',abort,{once:true});channel.port1.onmessage=event=>finish(event.data);try{worker.postMessage({type:'ARCHIVE_STAGE_STATUS'},[channel.port2])}catch(_){finish(null,fail('archive-update-required'))}});check(opt);
  const build=w.document?.querySelector?.('meta[name="sukun-build"]')?.content;
  if(data?.ok!==true||data.protocol!==1||data.networkOnly!==true||!build||data.build!==build||worker!==w.navigator.serviceWorker.controller)throw fail('archive-update-required');opt.protocolWorker=worker;
 }
 async function download(file,max,opt,progress=false){
  check(opt);await networkProtocol(opt);const url=new URL(PREFIX+file,new URL('./',w.location.href));
  if(url.origin!==w.location.origin||file!=='manifest.json'&&!/^audio\/[a-f0-9]{64}\.webm$/.test(file))throw fail('archive-invalid');
  const controller=new AbortController(),abort=()=>controller.abort();opt.signal?.addEventListener?.('abort',abort,{once:true});let reader,timer,lastProgress=0,complete=false;
  const assertCurrent=()=>{check(opt);if(controller.signal.aborted)throw fail('archive-cancelled')};
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(fail('archive-download-timeout'))},TIMEOUT)});
  const work=(async()=>{
   const response=await w.fetch(url.href,{credentials:'same-origin',redirect:'error',cache:'no-store',headers:{'X-Sukun-Archive-Stage':'1'},signal:controller.signal});assertCurrent();
   if(!response.ok)throw fail('archive-download-failed');if(Number(response.headers?.get?.('content-length'))>max)throw fail('archive-limit');
   if(!response.body||typeof response.body.getReader!=='function')throw fail('archive-stream-unavailable');reader=response.body.getReader();const chunks=[];let bytes=0;
   while(true){assertCurrent();const value=await reader.read();assertCurrent();if(value.done)break;if(!(value.value instanceof Uint8Array))throw fail('archive-download-failed');bytes+=value.value.byteLength;if(bytes>max)throw fail('archive-limit');chunks.push(value.value);if(progress){state={...state,downloadedBytes:state.downloadedBytes+value.value.byteLength};if(Date.now()-lastProgress>=100){lastProgress=Date.now();emit()}}}
   if(progress)emit();
   return new Blob(chunks);
  })();
  try{const result=await Promise.race([work,deadline]);complete=true;return result}catch(error){try{Promise.resolve(reader?.cancel()).catch(()=>{})}catch(_){};if(opt.signal?.aborted)throw fail('archive-cancelled');throw normalizeError(error,'archive-download-failed')}
  finally{clearTimeout(timer);if(!complete)controller.abort();opt.signal?.removeEventListener?.('abort',abort)}
 }
 async function fetchCatalogue(opt){const blob=await download('manifest.json',MAX_MANIFEST,opt);if(await hash(blob,opt)!==MANIFEST_SHA256)throw fail('archive-integrity');const manifestText=await blob.text();let value;try{value=JSON.parse(manifestText)}catch(_){throw fail('archive-invalid')}return{...await validateManifest(value,opt),manifestText}}
 async function verifyStage(descriptor,opt,{downloadMissing=false,claim=null}={}){
  const records=[];set({phase:downloadMissing?'verifying':state.phase,selection:descriptor.categories,resumable:true,verifiedCount:0,verifiedBytes:0,totalCount:descriptor.rows.length,totalBytes:descriptor.rows.reduce((sum,row)=>sum+row.bytes,0)});
  for(const row of descriptor.rows){
   check(opt);if(!allowed(row.key))throw fail('archive-cancelled');const staged=await readClip(descriptor,row,opt,claim?.id);let blob=staged?.blob;
   let verified=staged?.stageId===descriptor.stageId&&staged.key===row.key&&staged.type===row.type&&staged.bytes===row.bytes&&staged.sha256===row.sha256&&blob instanceof Blob&&blob.size===row.bytes&&blob.type===row.type&&await hash(blob,opt)===row.sha256;
   if(!verified){
    if(!downloadMissing)throw fail('archive-stage-incomplete');set({phase:'downloading'});const fetched=await download(row.file,row.bytes,opt,true);blob=new Blob([fetched],{type:row.type});if(blob.size!==row.bytes||await hash(blob,opt)!==row.sha256)throw fail('archive-integrity');verified=true;
   }
   check(opt);const count=records.length+1,bytes=state.verifiedBytes+row.bytes;
   if(downloadMissing)await persist(descriptor,row,staged?.blob===blob?null:blob,count,bytes,opt);
   records.push({...row,blob});set({phase:downloadMissing?'verifying':state.phase,verifiedCount:count,verifiedBytes:bytes});
  }
  check(opt);return records;
 }
 async function run(phase,opt,work){
  if(task)throw fail('archive-stage-busy');const controller=new AbortController(),id=random(),captured=accessEpoch,externalAbort=()=>controller.abort(),job={controller,id,descriptor:null,committed:false};task=job;opt=opt||{};opt.signal?.addEventListener?.('abort',externalAbort,{once:true});previewPlan=phase==='committing'?previewPlan:null;
  const guard={signal:controller.signal,isCurrent:()=>task===job&&!controller.signal.aborted&&!opt.signal?.aborted&&captured===accessEpoch&&(!opt.isCurrent||opt.isCurrent()===true)};
  set({phase,errorCode:'',preview:phase==='committing'?state.preview:null});
  try{return await work(guard,job)}catch(error){const failure=normalizeError(error),code=failure.code;set({phase:code==='archive-cancelled'?'cancelled':'failed',errorCode:code,preview:null});throw failure}
  finally{opt.signal?.removeEventListener?.('abort',externalAbort);if(task===job)task=null;emit()}
 }
 async function catalog(opt={}){return run('catalog',opt,async guard=>{const value=await fetchCatalogue(guard);check(guard);catalogue=value;set({phase:'idle'});const categories=categoriesFor(value.manifest);return{manifestId:value.manifestId,categories,count:categories.reduce((sum,row)=>sum+row.count,0),bytes:categories.reduce((sum,row)=>sum+row.bytes,0)}})}
 async function resumeInfo(opt={}){
  const captured=accessEpoch;let descriptor;try{descriptor=await stageDescriptor(opt)}catch(error){if(error?.code==='archive-access-locked'){set({selection:[],resumable:false,verifiedCount:0,totalCount:0,verifiedBytes:0,totalBytes:0,preview:null});return null}throw normalizeError(error)}check(opt);if(captured!==accessEpoch)throw fail('archive-cancelled');
  if(!descriptor)return null;
  const info={manifestId:descriptor.manifestId,categories:descriptor.categories.slice(),totalCount:descriptor.rows.length,totalBytes:descriptor.rows.reduce((sum,row)=>sum+row.bytes,0),storedCount:Number.isSafeInteger(descriptor.savedCount)&&descriptor.savedCount>=0&&descriptor.savedCount<=descriptor.rows.length?descriptor.savedCount:0,resumable:true};
  if(!task){catalogue={manifest:descriptor.manifest,manifestId:descriptor.manifestId,manifestText:descriptor.manifestText};active=descriptor;set({selection:info.categories,resumable:true,totalCount:info.totalCount,totalBytes:info.totalBytes,verifiedCount:0,verifiedBytes:0})}return info;
 }
 async function prepare({categories}={},opt={}){return run('verifying',opt,async(guard,job)=>{
  const value=catalogue||await fetchCatalogue(guard);check(guard);catalogue=value;const descriptor=await beginStage(value,categories,guard);active=descriptor;job.descriptor=descriptor;set({downloadedBytes:0});await verifyStage(descriptor,guard,{downloadMissing:true});set({phase:'ready',resumable:true});return snapshot();
 })}
 async function resume(opt={}){return run('verifying',opt,async(guard,job)=>{
  const saved=await stageDescriptor(guard);if(!saved)throw fail('archive-stage-empty');catalogue={manifest:saved.manifest,manifestId:saved.manifestId,manifestText:saved.manifestText};const descriptor=await beginStage(catalogue,saved.categories,guard);active=descriptor;job.descriptor=descriptor;set({downloadedBytes:0});await verifyStage(descriptor,guard,{downloadMissing:true});set({phase:'ready',resumable:true});return snapshot();
 })}
 async function preview({mode,conflicts}={},opt={}){return run('verifying',opt,async guard=>{
  if(!['merge','replace'].includes(mode)||mode==='merge'&&!['keep','replace'].includes(conflicts))throw fail('archive-invalid');
  const descriptor=await stageDescriptor(guard);if(!descriptor)throw fail('archive-stage-empty');const records=await verifyStage(descriptor,guard),core=w.SukunGenericRecordings;
  if(typeof core?.describeBank!=='function')throw fail('archive-update-required');const bank=await core.describeBank({...guard,forReplace:mode==='replace'});check(guard);
  const existing=new Map(bank.records.map(row=>[row.key,row])),incoming=new Map(records.map(row=>[row.key,row]));let added=0,replaced=0,kept=0,removed=0;const final=new Map(mode==='merge'?existing:[]);
  for(const row of records){if(existing.has(row.key)){if(mode==='replace'||conflicts==='replace'){replaced++;final.set(row.key,row)}else kept++}else{added++;final.set(row.key,row)}}
  for(const row of bank.records)if(!incoming.has(row.key)){if(mode==='merge')kept++;else removed++}
  const bytes=[...final.values()].reduce((sum,row)=>sum+row.bytes,0);if(final.size>LIMIT.count||bytes>LIMIT.bytes)throw fail('archive-limit');
  const previewId=random(),value={previewId,mode,conflicts:mode==='merge'?conflicts:'replace',added,replaced,kept,preserved:kept,removed,count:final.size,bytes,countScope:'visible',preservesOtherRecords:mode==='merge'};
  previewPlan={...value,descriptor,expectedBankId:bank.bankId,expectedRevision:bank.revision,accessEpoch};active=descriptor;set({phase:'preview',preview:value});return{...value};
 })}
 async function commit(previewId,opt={}){return run('committing',opt,async(guard,job)=>{
  const plan=previewPlan;if(!plan||plan.previewId!==previewId||plan.accessEpoch!==accessEpoch)throw fail('archive-preview-stale');
  const descriptor=await stageDescriptor(guard);if(!same(descriptor,plan.descriptor))throw fail('archive-preview-stale');job.descriptor=descriptor;
  const claim=await claimStage(descriptor,guard),until=Date.now()+120000;
  const admission={...guard,isCurrent:()=>guard.isCurrent()&&Date.now()<until&&Date.now()<claim.until};
  try{
   const records=await verifyStage(descriptor,admission,{claim}),core=w.SukunGenericRecordings;if(typeof core?.commitRecords!=='function')throw fail('archive-update-required');
   const accepted=await core.commitRecords(records,{...admission,mode:plan.mode,conflicts:plan.conflicts,expectedBankId:plan.expectedBankId,expectedRevision:plan.expectedRevision});job.committed=accepted?.ok===true;previewPlan=null;set({phase:'ready',preview:null,errorCode:''});return{...accepted,count:plan.count,bytes:plan.bytes,countScope:'visible'};
  }finally{await releaseClaim(descriptor,claim)}
 })}
 function cancel(){
  const job=task;job?.controller.abort();previewPlan=null;set({phase:'cancelled',preview:null,errorCode:''});
  if(job?.descriptor)void transaction('readwrite',(_clips,meta)=>{const request=meta.get('active');request.onsuccess=()=>{const value=request.result;if(same(value,job.descriptor)&&!value.claim)meta.put({...value,revision:value.revision+1},'active')}}).catch(()=>{});
  return snapshot();
 }
 w.addEventListener?.('sukun:secretaccesschange',()=>{accessEpoch++;cancel();set({verifiedCount:0,verifiedBytes:0,totalCount:0,totalBytes:0,downloadedBytes:0})});
 w.SukunArchiveDownloadR1093=Object.freeze({version:VERSION,snapshot,catalog,resumeInfo,prepare,resume,preview,commit,cancel,limits:Object.freeze({...LIMIT})});
})(window);
