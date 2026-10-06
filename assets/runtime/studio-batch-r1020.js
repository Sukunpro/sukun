/* SÜKÛN r1020 — local, staged, reversible bulk Studio operations.
 * Originals live in a separate undo database before any recording is changed.
 * The recording database performs one content-guarded atomic write; no uploads.
 */
(function(w){
 'use strict';
 if(w.SukunStudioBatch)return;
 const VERSION='r1020',MAX_CLIP_BYTES=64*1024*1024,MAX_STAGE_BYTES=1024*1024*1024,MAX_CLIPS=2000,UNDO_DB='sukunStudioUndo';
 let task=null,undoConnection=null,message=null,recent=null,booted=false,voiceCount=null,refreshTimer=0;
 const en=()=>w.I18N?.lang==='en'||document.documentElement?.lang==='en';
 const tr=(a,b)=>en()?b:a;
 const fail=code=>Object.assign(new Error(code),{code});
 const rec=()=>typeof REC_DB!=='undefined'?REC_DB:w.REC_DB;
 const check=t=>{if(t.cancel.signal.aborted||t.lease&&!t.lease.current())throw fail('BATCH_CANCELLED');};
 const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
 function cancellation(){return w.SukunStudioPreparation?.createCancellation?.()||new AbortController();}
 async function fingerprint(blob){
  if(!(blob instanceof Blob)||!blob.size)throw fail('BATCH_EMPTY_RECORDING');
  if(blob.size>MAX_CLIP_BYTES)throw fail('BATCH_MEMORY_LIMIT');
  if(!w.crypto?.subtle)throw fail('BATCH_HASH_UNAVAILABLE');
  const digest=await w.crypto.subtle.digest('SHA-256',await blob.arrayBuffer());
  return blob.size+':'+blob.type+':'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 }
 /* Called by REC_DB.compareAndSwap; its wrapper owns revision/cache publication.
  * Keepalive requests keep the same write transaction open while Blob hashing
  * yields. A later write from another tab waits until comparison + commit finish.
  * No write is submitted until EVERY expected content fingerprint is verified.
  */
 function atomicSwapImpl(connection,entries,opt={}){
  return new Promise((resolve,reject)=>{
   let tx,done=false,ready=false,verified=false,timer=0,reason=null;
   const expected=opt.expectedHashes instanceof Map?opt.expectedHashes:new Map(Object.entries(opt.expectedHashes||{}));
   const current=()=>!opt.signal?.aborted&&(!opt.isCurrent||opt.isCurrent());
   const cleanup=()=>{clearTimeout(timer);opt.signal?.removeEventListener?.('abort',abort);w.removeEventListener?.('sukun:tabownerchange',ownerChanged);};
   const finish=(error)=>{if(done)return;done=true;cleanup();error?reject(error):resolve(entries.length);};
   const abort=()=>{reason=reason||fail('BATCH_CANCELLED');try{tx?.abort();}catch(_){};};
   const ownerChanged=()=>{if(!current())abort();};
   try{
    if(!current())throw fail('BATCH_CANCELLED');
    if(!Array.isArray(entries)||!entries.length||entries.length>MAX_CLIPS)throw fail('BATCH_INVALID');
    const seen=new Set();for(const [key,blob] of entries){if(typeof key!=='string'||seen.has(key)||!expected.has(key)||!(blob instanceof Blob)||!blob.size)throw fail('BATCH_INVALID');seen.add(key);}
    tx=connection.transaction('clips','readwrite');const store=tx.objectStore('clips'),sources=new Map();
    tx.oncomplete=()=>finish();tx.onabort=()=>finish(reason||tx.error||fail('BATCH_WRITE_ABORTED'));tx.onerror=()=>{reason=reason||tx.error||fail('BATCH_WRITE_FAILED');};
    opt.signal?.addEventListener?.('abort',abort,{once:true});w.addEventListener?.('sukun:tabownerchange',ownerChanged);
    timer=setTimeout(()=>{reason=fail('BATCH_WRITE_TIMEOUT');abort();},Math.min(120000,Math.max(1000,opt.timeoutMs||60000)));
    const keepalive=()=>{
     if(done||ready)return;
     if(!current()){abort();return;}
     if(verified){try{ready=true;for(const [key,blob] of entries)store.put(blob,key);}catch(error){reason=error;abort();}return;}
     const ping=store.get('__sukun_studio_keepalive__');ping.onsuccess=keepalive;
    };
    for(const [key] of entries){const request=store.get(key);request.onsuccess=()=>sources.set(key,request.result||null);}
    const fence=store.get('__sukun_studio_keepalive__');fence.onsuccess=()=>{
     keepalive();
     (async()=>{
      for(const [key] of entries){if(!current())throw fail('BATCH_CANCELLED');const source=sources.get(key);if(!source||await fingerprint(source)!==expected.get(key))throw fail('BATCH_CONFLICT');}
      if(!current())throw fail('BATCH_CANCELLED');
      // The digest continuation cannot enqueue IDB requests: the transaction
      // is inactive here. The next keepalive request event submits the puts.
      verified=true;
     })().catch(error=>{reason=error;abort();});
    };
   }catch(error){reason=error;try{tx?.abort();}catch(_){};if(!tx)finish(error);}
  });
 }
 function openUndo(){
  if(undoConnection)return Promise.resolve(undoConnection);
  return new Promise((resolve,reject)=>{
   const request=w.indexedDB.open(UNDO_DB,1);let done=false;
   const timer=setTimeout(()=>{done=true;reject(fail('BATCH_BACKUP_TIMEOUT'));},10000);
   request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('jobs'))db.createObjectStore('jobs',{keyPath:'id'});if(!db.objectStoreNames.contains('clips')){const s=db.createObjectStore('clips',{keyPath:['jobId','key']});s.createIndex('jobId','jobId');}};
   request.onsuccess=()=>{clearTimeout(timer);if(done){request.result.close();return;}undoConnection=request.result;undoConnection.onversionchange=()=>{undoConnection.close();undoConnection=null;};resolve(undoConnection);};
   request.onerror=()=>{clearTimeout(timer);reject(request.error||fail('BATCH_BACKUP_FAILED'));};
  });
 }
 function undoTransaction(db,stores,mode,work){
  return new Promise((resolve,reject)=>{
   let tx,getResult,settled=false,timer=0;
   const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);if(error)reject(error);else{try{resolve(getResult?.());}catch(e){reject(e);}}};
   try{tx=db.transaction(stores,mode);tx.oncomplete=()=>finish();tx.onabort=()=>finish(tx.error||fail('BATCH_BACKUP_FAILED'));tx.onerror=()=>{};
    timer=setTimeout(()=>{try{tx.abort();}catch(_){}finish(fail('BATCH_BACKUP_TIMEOUT'));},30000);getResult=work(tx);
   }catch(error){try{tx?.abort();}catch(_){}finish(error);}
  });
 }
 async function undoRead(store,key){const db=await openUndo();return undoTransaction(db,store,'readonly',tx=>{const request=key==null?tx.objectStore(store).getAll():tx.objectStore(store).get(key);return ()=>request.result;});}
 async function jobClips(id){const db=await openUndo();return undoTransaction(db,'clips','readonly',tx=>{const request=tx.objectStore('clips').index('jobId').getAll(id);return ()=>request.result||[];});}
 async function saveJob(job,clip){const db=await openUndo();return undoTransaction(db,clip?['jobs','clips']:['jobs'],'readwrite',tx=>{tx.objectStore('jobs').put(job);if(clip)tx.objectStore('clips').put(clip);return ()=>true;});}
 async function removeJob(id){
  // Incident containment: retiring a job must never destroy voice copies.
  // Archived jobs no longer participate in lastUndo()/refresh(), but both
  // original and processed Blobs remain available to the rescue scanner.
  const db=await openUndo();return undoTransaction(db,'jobs','readwrite',tx=>{
   const store=tx.objectStore('jobs'),request=store.get(id);
   request.onsuccess=()=>{const job=request.result;if(!job||job.state==='archived')return;store.put({...job,state:'archived',archivedFrom:job.state||'unknown',archivedAt:Date.now(),archiveReason:'r1020-incident-retention'});};
   return ()=>true;
  });
 }
 async function budget(extra,total){
  if(total>MAX_STAGE_BYTES)throw fail('BATCH_MEMORY_LIMIT');
  const estimate=await w.navigator?.storage?.estimate?.();
  if(estimate?.quota&&estimate.quota-(estimate.usage||0)<extra+8*1024*1024)throw fail('BATCH_STORAGE_LIMIT');
 }
 function voiceKey(key){return typeof key==='string'&&key!=='feedback:tesbih'&&!/:(?:original|first-original)$/.test(key);}
 function visibleKeys(keys){return w.SukunSecretPolicy?.visibleRecKeys?.(keys)||keys;}
 function status(text){message=typeof text==='function'?text:()=>text;render();}
 function describeError(error){
  const code=error?.code||'';
  if(code==='BATCH_CONFLICT')return tr('Bir kayıt işlemden sonra değişmiş. Yeni kaydı korumak için toplu işlem durduruldu; hiçbir kayıt üzerine yazılmadı.','A recording has changed. The batch was stopped to keep newer recordings; nothing was overwritten.');
  if(code==='BATCH_CANCELLED'||code==='PREP_CANCELLED')return tr('İptal edildi. Asıl kayıtlar korundu.','Cancelled. Original recordings were kept.');
  if(code==='BATCH_STORAGE_LIMIT'||code==='BATCH_MEMORY_LIMIT')return tr('Güvenli yedek için yeterli depolama veya işleme alanı yok. Asıl kayıtlar korundu.','There is not enough space for a safe backup or processing. Original recordings were kept.');
  if(code==='BATCH_NO_VOICES')return tr('Düzenlenecek ses kaydı bulunamadı.','No voice recordings were found.');
  if(code==='BATCH_NO_UNDO')return tr('Geri alınabilecek toplu düzenleme yok.','There is no batch edit to undo.');
  if(code==='BATCH_INTEGRATION_REQUIRED')return tr('Güvenli toplu kayıt desteği hazır değil; değişiklik yapılmadı.','Safe batch storage is unavailable; nothing was changed.');
  return tr('Toplu işlem tamamlanamadı. Asıl kayıtlar korundu.','The batch could not finish. Original recordings were kept.');
 }
 async function lastUndo(){const jobs=await undoRead('jobs');return (jobs||[]).filter(j=>['ready','applied','undoing','recovery-needed'].includes(j.state)).sort((a,b)=>b.created-a.created)[0]||null;}
 async function inspectJob(job){
  const clips=await jobClips(job.id);if(!clips.length)return {mode:'empty',clips};
  let output=0,original=0,other=0;
  for(const clip of clips){const blob=await rec().get(clip.key);if(!blob){other++;continue;}const hash=await fingerprint(blob);if(hash===clip.outputHash)output++;else if(hash===clip.originalHash)original++;else other++;}
  return {mode:!other&&output===clips.length?'output':!other&&original===clips.length?'original':'conflict',clips};
 }
 async function refresh(){
  if(task)return;
  try{voiceCount=visibleKeys(await rec().keys()).filter(voiceKey).length;}catch(_){voiceCount=null;}
  try{for(let attempt=0;attempt<MAX_CLIPS;attempt++){recent=await lastUndo();if(!recent||recent.state==='applied')break;const inspected=await inspectJob(recent);if(inspected.mode==='output'){recent.state='applied';await saveJob(recent);break;}if(inspected.mode==='original'||inspected.mode==='empty'){await removeJob(recent.id);recent=null;continue;}recent.state='recovery-needed';await saveJob(recent);break;}render();}catch(_){recent=null;render();}
 }
 async function publish(){
  try{if(typeof studioKeys==='function')await studioKeys();}catch(_){}
  try{if(typeof mediaRender==='function')await mediaRender();}catch(_){}
  try{if(typeof ydkListe==='function')ydkListe();}catch(_){}
  try{w.SukunTekkeSet?.refresh?.();}catch(_){}
  try{w.dispatchEvent(new CustomEvent('sukun:studiobatchchange',{detail:{version:VERSION}}));}catch(_){}
 }
 async function apply(options={}){
  if(task)return {ok:false,busy:true};
  const kind=typeof options==='string'?options:options.kind||'both';
  if(!['normalize','trim','both'].includes(kind))throw fail('BATCH_INVALID');
  if(w.R170?.Studio?.session||w.R170?.Studio?.recordClaim||w.R170?.Studio?.edit){status(()=>tr('Önce açık kayıt veya düzenlemeyi tamamla.','Finish the current recording or edit first.'));return {ok:false,busy:true};}
  if(!rec()?.compareAndSwap){status(()=>describeError(fail('BATCH_INTEGRATION_REQUIRED')));return {ok:false};}
  const t={cancel:cancellation(),lease:null,phase:'preparing',done:0,total:0,job:null,committed:false};task=t;
  const work=async lease=>{
   t.lease=lease;check(t);
   try{w.R170?.Studio?.analysisTask?.controller?.abort();}catch(_){}
   const abandoned=await undoRead('jobs');for(const job of abandoned||[])if(job.state==='staging')await removeJob(job.id);check(t);
   const keys=visibleKeys(await rec().keys()).filter(voiceKey);check(t);if(!keys.length)throw fail('BATCH_NO_VOICES');if(keys.length>MAX_CLIPS)throw fail('BATCH_MEMORY_LIMIT');
   t.total=keys.length;voiceCount=keys.length;
   const job={id:Date.now()+'-'+Math.random().toString(36).slice(2),created:Date.now(),kind,state:'staging',version:VERSION,count:0,bytes:0};t.job=job;await saveJob(job);
   const ops=kind==='both'?['trim','normalize']:[kind];
   for(const key of keys){
    check(t);const original=await rec().get(key,{signal:t.cancel.signal});check(t);
    if(!(original instanceof Blob)||!original.size||original.type&&!/^audio\//i.test(original.type))throw fail('BATCH_EMPTY_RECORDING');
    const originalHash=await fingerprint(original);check(t);let output=original;
    for(const operation of ops){const prepared=await w.SukunStudioPreparation.process(output,{key,kind:operation,signal:t.cancel.signal,isCurrent:()=>!t.cancel.signal.aborted&&(!t.lease||t.lease.current())});check(t);if(prepared.changed){if(!(prepared.blob instanceof Blob)||!prepared.blob.size)throw fail('BATCH_PROCESS_FAILED');output=prepared.blob;}}
    const outputHash=await fingerprint(output);check(t);
    if(outputHash!==originalHash){const bytes=original.size+output.size;await budget(bytes,job.bytes+bytes);check(t);job.bytes+=bytes;job.count++;await saveJob(job,{jobId:job.id,key,original,output,originalHash,outputHash});}
    t.done++;status(()=>tr('Sesler hazırlanıyor: ','Preparing recordings: ')+t.done+' / '+t.total);await tick();
   }
   check(t);if(!job.count){await removeJob(job.id);t.job=null;status(()=>tr('Tüm kayıtlar incelendi; değişiklik gerekmedi.','All recordings were checked; no changes were needed.'));return {ok:true,changed:0};}
   // Re-read persisted undo data and verify both stored copies before committing.
   const clips=await jobClips(job.id);if(clips.length!==job.count)throw fail('BATCH_BACKUP_FAILED');
   for(const clip of clips){check(t);if(await fingerprint(clip.original)!==clip.originalHash||await fingerprint(clip.output)!==clip.outputHash)throw fail('BATCH_BACKUP_FAILED');}
   job.state='ready';await saveJob(job);check(t);t.phase='committing';render();
   await rec().compareAndSwap(clips.map(c=>[c.key,c.output]),{expectedHashes:new Map(clips.map(c=>[c.key,c.originalHash])),signal:t.cancel.signal,isCurrent:()=>!t.cancel.signal.aborted&&(!t.lease||t.lease.current())});t.committed=true;
   // After commit cancellation becomes a request to roll back, not a false success.
   try{
    check(t);const result=await inspectJob(job);check(t);if(result.mode!=='output')throw fail('BATCH_VERIFY_FAILED');
    job.state='applied';await saveJob(job);recent=job;
   }catch(error){
    t.phase='rolling-back';render();
    try{await rec().compareAndSwap(clips.map(c=>[c.key,c.original]),{expectedHashes:new Map(clips.map(c=>[c.key,c.outputHash])),isCurrent:()=>!t.lease||t.lease.current()});job.state='rolled-back';await saveJob(job);t.committed=false;await publish();}
    catch(rollbackError){job.state='recovery-needed';try{await saveJob(job);}catch(_){};recent=job;status(()=>tr('Doğrulama tamamlanamadı. Asıllar güvenli geri alma yedeğinde; “Toplu düzenlemeyi geri al” ile yeniden dene.','Verification could not finish. Originals are in the undo backup; retry “Undo batch edit”.'));throw Object.assign(fail('BATCH_RECOVERY_NEEDED'),{cause:rollbackError});}
    throw error;
   }
   const old=await undoRead('jobs').catch(()=>[]);for(const j of old||[])if(j.id!==job.id&&j.state!=='recovery-needed')await removeJob(j.id).catch(()=>{});
   await publish();status(()=>tr(job.count+' kayıt düzenlendi. Tek dokunuşla geri alabilirsin.',job.count+' recordings edited. You can undo in one tap.'));
   return {ok:true,changed:job.count};
  };
  try{const value=w.SukunTabOwner?.maintenance?await w.SukunTabOwner.maintenance('studio-batch',work):false;if(value===false){status(()=>tr('Önce etkin veya duraklatılmış zikri Bitir ile tamamla; diğer sekmelerdeki kaydı da durdur.','Finish active or paused dhikr and any recording in other tabs first.'));return {ok:false,busy:true};}return value;}
  catch(error){if(error?.code!=='BATCH_RECOVERY_NEEDED')status(()=>describeError(error));return {ok:false,error:error?.code||error?.message,originalsKept:!t.committed};}
  finally{if(t.job&&!t.committed&&t.job.state!=='recovery-needed')await removeJob(t.job.id).catch(()=>{});if(task===t)task=null;await refresh();render();}
 }
 async function undo(){
  if(task)return {ok:false,busy:true};
  if(!rec()?.compareAndSwap)return {ok:false,error:'BATCH_INTEGRATION_REQUIRED'};
  const t={cancel:cancellation(),lease:null,phase:'undoing',done:0,total:0,committed:false};task=t;render();
  const work=async lease=>{
   t.lease=lease;check(t);const job=await lastUndo();check(t);if(!job)throw fail('BATCH_NO_UNDO');const inspected=await inspectJob(job);check(t);
   if(inspected.mode==='original'){await removeJob(job.id);recent=null;status(()=>tr('Asıl kayıtlar zaten yerinde.','Original recordings are already in place.'));return {ok:true,changed:0};}
   if(inspected.mode!=='output')throw fail('BATCH_CONFLICT');
   const clips=inspected.clips;t.total=clips.length;
   for(const clip of clips){check(t);if(await fingerprint(clip.original)!==clip.originalHash)throw fail('BATCH_BACKUP_FAILED');}
   job.state='undoing';await saveJob(job);t.phase='committing';render();check(t);
   await rec().compareAndSwap(clips.map(c=>[c.key,c.original]),{expectedHashes:new Map(clips.map(c=>[c.key,c.outputHash])),signal:t.cancel.signal,isCurrent:()=>!t.cancel.signal.aborted&&(!t.lease||t.lease.current())});t.committed=true;
   job.state='undone';await saveJob(job);recent=null;await publish();status(()=>tr(clips.length+' kayıt asıl hâline döndürüldü.',clips.length+' recordings restored to their originals.'));return {ok:true,changed:clips.length};
  };
  try{const result=w.SukunTabOwner?.maintenance?await w.SukunTabOwner.maintenance('studio-batch-undo',work):false;if(result===false){status(()=>tr('Geri almadan önce etkin zikri veya kaydı tamamla.','Finish active dhikr or recording before undoing.'));return {ok:false,busy:true};}return result;}
  catch(error){status(()=>t.committed?tr('Asıl sesler geri yüklendi; işlem durumu yeniden açıldığında kontrol edilecek.','Originals were restored; the operation status will be checked after reopening.'):describeError(error));return {ok:false,error:error?.code||error?.message,restored:t.committed};}
  finally{if(task===t)task=null;await refresh();render();}
 }
 function cancel(){if(!task||['committing','rolling-back'].includes(task.phase))return false;task.cancel.abort();status(()=>tr('İptal ediliyor…','Cancelling…'));return true;}
 function render(){
  const box=document.getElementById('r1019StudioBatch');if(!box)return;
  const select=box.querySelector('select');select.disabled=!!task;
  const apply=box.querySelector('[data-batch-apply]'),undoBtn=box.querySelector('[data-batch-undo]'),cancelBtn=box.querySelector('[data-batch-cancel]');
  apply.textContent=tr('Tüm erişilebilir seslere uygula','Apply to all accessible voices')+(voiceCount==null?'':' ('+voiceCount+')');apply.disabled=!!task||voiceCount===0;
  undoBtn.textContent=tr('↶ Toplu düzenlemeyi geri al','↶ Undo batch edit');undoBtn.disabled=!!task||!recent;
  cancelBtn.textContent=tr('İptal et','Cancel');cancelBtn.hidden=!task;cancelBtn.disabled=!!task&&['committing','rolling-back'].includes(task.phase);
  box.querySelector('[data-batch-title]').textContent=tr('Tüm kayıtlar için stüdyo','Studio for all recordings');
  box.querySelector('[data-batch-note]').textContent=tr('Önce asıllar saklanır; hazırlık tamamlanınca tüm sesler birlikte güncellenir. Son toplu düzenleme, sayfayı yeniden açınca da geri alınabilir. Sonradan değiştirilen kayıtlara dokunulmaz. Tık sesi, korunan asıl kopyalar ve kilidi kapalı bölüm kayıtları kapsam dışıdır. İnceleme sırasında eski stüdyo kopyaları da saklanır.','Originals are saved first; all prepared voices update together. The latest batch can be undone after reopening. Later recording changes are protected. Click sounds, protected original copies and recordings in locked sections are excluded. Older Studio copies are also kept during the investigation.');
  const labels={both:tr('Sessizliği kırp + normalize','Trim silence + normalise'),normalize:tr('Yalnız normalize','Normalise only'),trim:tr('Yalnız sessizliği kırp','Trim silence only')};for(const option of select.options)option.textContent=labels[option.value];
  const stat=box.querySelector('[data-batch-status]');stat.textContent=task?.phase==='committing'?tr('Kayıtlar güvenle güncelleniyor…','Safely updating recordings…'):task?.phase==='rolling-back'?tr('Asıllara geri dönülüyor…','Restoring originals…'):(message?message():'')||tr('Hazır. Son toplu düzenleme için geri alma yedeği saklanır.','Ready. An undo backup is kept for the latest batch edit.');
  const progress=box.querySelector('progress');progress.hidden=!task||!task.total;progress.max=task?.total||1;progress.value=task?.done||0;
 }
 function mount(){
  const pane=document.querySelector('#r170Studio .r170Body');if(!pane||document.getElementById('r1019StudioBatch'))return;
  const box=document.createElement('section');box.id='r1019StudioBatch';box.innerHTML='<h4 data-batch-title></h4><p data-batch-note></p><select class="r170Select" aria-label="Toplu stüdyo işlemi / Batch Studio operation"><option value="both"></option><option value="normalize"></option><option value="trim"></option></select><div class="r1019BatchActions"><button type="button" class="r170Btn" data-batch-apply></button><button type="button" class="r170Btn" data-batch-undo></button><button type="button" class="r170Btn" data-batch-cancel hidden></button></div><progress hidden></progress><p data-batch-status role="status" aria-live="polite"></p>';
  pane.append(box);box.querySelector('[data-batch-apply]').onclick=()=>apply({kind:box.querySelector('select').value});box.querySelector('[data-batch-undo]').onclick=undo;box.querySelector('[data-batch-cancel]').onclick=cancel;
  render();void refresh();
 }
 function boot(){
  if(booted)return;booted=true;
  const style=document.createElement('style');style.textContent='#r1019StudioBatch{margin-top:14px;padding:12px;border:1px solid rgba(185,159,229,.4);border-radius:14px;min-width:0;overflow-wrap:anywhere}#r1019StudioBatch h4{margin:0 0 8px;font-size:15px}#r1019StudioBatch p{font-size:12px;line-height:1.6;margin:8px 0}#r1019StudioBatch select,#r1019StudioBatch progress{width:100%;max-width:100%;min-width:0}.r1019BatchActions{display:grid;grid-template-columns:1fr;gap:7px;margin:8px 0}#r1019StudioBatch button{width:100%;white-space:normal;min-height:44px}#r1019StudioBatch [hidden]{display:none!important}';document.head.append(style);
  mount();const observer=new MutationObserver(()=>{if(!document.getElementById('r1019StudioBatch'))mount();});observer.observe(document.body,{childList:true,subtree:true});
  for(const event of ['sukun:languagechange','sukun:langchange','sukun:i18nchange'])w.addEventListener(event,render);
  w.addEventListener('sukun:recordingcatalog',()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,100);});
  for(const event of ['sukun:secretaccesschange','sukun:secretpolicyready'])w.addEventListener(event,()=>{if(task)task.cancel.abort();else void refresh();});
  w.addEventListener('sukun:tabownerchange',()=>{if(task&&task.lease&&!task.lease.current())task.cancel.abort();});
  w.addEventListener('pagehide',()=>task?.cancel.abort());document.addEventListener('freeze',()=>task?.cancel.abort());
 }
 w.SukunStudioBatch=Object.freeze({version:VERSION,apply,undo,cancel,refresh,mount,fingerprint,atomicSwapImpl,
  snapshot:()=>({version:VERSION,busy:!!task,phase:task?.phase||'idle',done:task?.done||0,total:task?.total||0,undoAvailable:!!recent,voiceCount,message:message?message():''})});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
