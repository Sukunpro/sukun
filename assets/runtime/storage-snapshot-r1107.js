/* r1107: explicit local audio inventory. Blob.size only; no playback, audio
 * decoding, hashing, recording writes, recovery, archive activation or timers
 * between requests. Missing/unreadable stores never become empty inventories. */
(function(w){
 'use strict';
 if(w.SukunStorageSnapshotR1107)return;
 const VERSION='r1107',READ_TIMEOUT=8000,QUOTA_TIMEOUT=4000;
 const LIMIT={rows:10000,points:1000,entries:200000,bytes:8*1024*1048576};
 const integer=value=>Number.isSafeInteger(value)&&value>=0;
 const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value};
 const clone=value=>JSON.parse(JSON.stringify(value));
 let active=null,generation=0,current=null,lastSuccessful=null;
 const build=()=>{try{const value=w.document?.querySelector('meta[name="sukun-build"]')?.content;return typeof value==='string'&&/^r\d{1,8}$/.test(value)?value:null}catch(_){return null}};
 const failed=(scope,status='unavailable',errorCode='read-failed',extra={})=>({status,count:null,blobBytes:null,errorCode,scope,...extra});
 const cancelled=scope=>failed(scope,'cancelled','inspection-cancelled');
 const errorCode=(error,fallback)=>['SecurityError','VersionError','UnknownError','InvalidStateError','QuotaExceededError','AbortError'].includes(error?.name)?error.name:fallback;
 const check=job=>{if(job.controller.signal.aborted||active!==job||generation!==job.id)throw new Error('inspection-cancelled')};
 function total(sum,value){if(!integer(value)||!Number.isSafeInteger(sum+value)||sum+value>LIMIT.bytes)throw new Error('unsafe-total');return sum+value}
 function snapshot(){return freeze(clone({version:VERSION,phase:active?'reading':'idle',current,lastSuccessful}))}

 function readStore(job,name,store,scope,visit,initial={count:0,blobBytes:0}){
  return new Promise(resolve=>{
   let done=false,db=null,request=null,tx=null,cursorRequest=null,ended=false,rows=0;
   const signal=job.controller.signal,result={...initial};
   const close=value=>{try{value?.close()}catch(_){}};
   const finish=(status,error=null)=>{
    if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);
    if(cursorRequest)cursorRequest.onsuccess=cursorRequest.onerror=null;
    if(tx){tx.oncomplete=tx.onerror=tx.onabort=null;if(status!=='ok')try{tx.abort()}catch(_){}}
    if(db){db.onversionchange=null;close(db)}
    resolve(status==='ok'?{status,count:result.count,blobBytes:result.blobBytes,errorCode:null,scope,...result}:failed(scope,status,error,Object.fromEntries(Object.keys(initial).filter(key=>!['count','blobBytes'].includes(key)).map(key=>[key,null]))));
   };
   const abort=()=>finish('cancelled','inspection-cancelled');
   const timer=setTimeout(()=>finish('unavailable','read-timeout'),READ_TIMEOUT);
   signal.addEventListener('abort',abort,{once:true});
   if(signal.aborted){abort();return}
   const open=factory=>{
    if(done)return;
    try{
     check(job);request=factory.open(name);
     request.onupgradeneeded=()=>{
      // Never create a store while observing an absent database. Even a late
      // open is aborted after cancellation/deadline before its upgrade commits.
      try{request.transaction?.abort()}catch(_){}
      try{close(request.result)}catch(_){}
      finish('missing','db-missing');
     };
     request.onblocked=()=>finish('unavailable','db-blocked');
     request.onerror=()=>finish('unavailable',errorCode(request.error,'db-open-failed'));
     request.onsuccess=event=>{
      const connection=event.target.result;if(done){close(connection);return}db=connection;
      try{
       check(job);db.onversionchange=()=>finish('unavailable','read-aborted');
       if(!db.objectStoreNames.contains(store)){finish('missing','store-missing');return}
       tx=db.transaction(store,'readonly');
       tx.oncomplete=()=>finish(ended?'ok':'unavailable',ended?null:'read-failed');
       tx.onerror=tx.onabort=()=>finish('unavailable',errorCode(tx.error,'read-aborted'));
       cursorRequest=tx.objectStore(store).openCursor();
       cursorRequest.onerror=()=>finish('unavailable',errorCode(cursorRequest.error,'read-failed'));
       cursorRequest.onsuccess=()=>{
        if(done)return;
        try{
         check(job);const cursor=cursorRequest.result;if(!cursor){ended=true;return}
         if(++rows>LIMIT.rows)throw new Error('inspection-limit');
         visit(cursor.value,result);cursor.continue();
        }catch(error){finish(error?.message==='inspection-cancelled'?'cancelled':'unavailable',['unsafe-total','invalid-record','invalid-point','inspection-limit'].includes(error?.message)?error.message:error?.message==='inspection-cancelled'?'inspection-cancelled':'read-failed')}
       };
      }catch(error){finish(error?.message==='inspection-cancelled'?'cancelled':'unavailable',error?.message==='inspection-cancelled'?'inspection-cancelled':errorCode(error,'read-failed'))}
     };
    }catch(error){finish(error?.message==='inspection-cancelled'?'cancelled':'unavailable',error?.message==='inspection-cancelled'?'inspection-cancelled':errorCode(error,'db-open-failed'))}
   };
   try{
    const factory=w.indexedDB;if(!factory||typeof factory.open!=='function'){finish('unavailable','idb-unavailable');return}
    if(typeof factory.databases==='function')Promise.resolve(factory.databases()).then(items=>{
     if(done)return;if(!Array.isArray(items)){finish('unavailable','db-open-failed');return}
     if(!items.some(item=>item?.name===name)){finish('missing','db-missing');return}open(factory);
    },error=>finish('unavailable',errorCode(error,'db-open-failed')));
    else open(factory);
   }catch(error){finish('unavailable',errorCode(error,'db-open-failed'))}
  });
 }
 function addBlob(blob,result){
  if(!(blob instanceof Blob)||!integer(blob.size))throw new Error('invalid-record');
  result.blobBytes=total(result.blobBytes,blob.size);result.count++;
 }
 function recoveryPoint(value,result){
  if(!value||value.schema!==1||value.app!=='SUKUN-Recovery'||!value.stores||!Array.isArray(value.stores.sukunRec?.entries)||!Array.isArray(value.stores.sukunCustomAmb?.entries))throw new Error('invalid-point');
  if(result.count>=LIMIT.points)throw new Error('inspection-limit');
  const recordings=value.stores.sukunRec.entries,ambience=value.stores.sukunCustomAmb.entries;
  if(recordings.length+ambience.length>4000||result.recordings+result.ambience+recordings.length+ambience.length>LIMIT.entries)throw new Error('inspection-limit');
  let bytes=0;
  for(const [entries,custom] of [[recordings,false],[ambience,true]]){
   const keys=new Set();
   for(const entry of entries){
    if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||keys.has(entry[0]))throw new Error('invalid-point');keys.add(entry[0]);
    const blob=custom?entry[1]?.blob:entry[1];if(!(blob instanceof Blob)||!integer(blob.size))throw new Error('invalid-point');bytes=total(bytes,blob.size);
   }
  }
  result.count++;result.recordings+=recordings.length;result.ambience+=ambience.length;
  if(value.listed!==false)result.listed++;
  result.blobBytes=total(result.blobBytes,bytes);
 }
 async function generic(job){
  const scope='accessible-generic',owner=w.SukunGenericRecordings;
  if(typeof owner?.inspectTotals!=='function')return failed(scope,'unavailable','generic-inspector-unavailable',{enabled:null});
  try{
   check(job);const value=await owner.inspectTotals({signal:job.controller.signal,isCurrent:()=>active===job&&generation===job.id&&!job.controller.signal.aborted});check(job);
   if(!value||!['ok','missing','unavailable','cancelled'].includes(value.status))throw new Error('invalid-generic-summary');
   const enabled=typeof value.enabled==='boolean'?value.enabled:null;
   if(value.status!=='ok')return failed(scope,value.status,typeof value.errorCode==='string'?value.errorCode.slice(0,64):'generic-read-failed',{enabled});
   if(!integer(value.count)||!integer(value.blobBytes)||(value.count===0&&value.blobBytes!==0))throw new Error('invalid-generic-summary');
   return {status:'ok',count:value.count,blobBytes:value.blobBytes,errorCode:null,scope,enabled};
  }catch(error){return job.controller.signal.aborted||active!==job?{...cancelled(scope),enabled:null}:failed(scope,'unavailable',error?.message==='invalid-generic-summary'?'invalid-generic-summary':'generic-read-failed',{enabled:null})}
 }
 function quota(job){
  return new Promise(resolve=>{
   const result=(status,errorCode=null,value={})=>({status,usage:null,quota:null,approximate:true,errorCode,...value});
   let done=false;const signal=job.controller.signal;
   const finish=value=>{if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);resolve(value)};
   const abort=()=>finish(result('cancelled','inspection-cancelled'));
   const timer=setTimeout(()=>finish(result('unavailable','quota-timeout')),QUOTA_TIMEOUT);
   signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return}
   try{
    if(typeof w.navigator?.storage?.estimate!=='function'){finish(result('unsupported','quota-unsupported'));return}
    Promise.resolve(w.navigator.storage.estimate()).then(value=>{
     if(done)return;
     if(!integer(value?.usage)||!integer(value?.quota)||value.quota===0||value.usage>value.quota){finish(result('unavailable','quota-invalid'));return}
     finish(result('ok',null,{usage:value.usage,quota:value.quota}));
    },()=>finish(result('unavailable','quota-unavailable')));
   }catch(_){finish(result('unavailable','quota-unavailable'))}
  });
 }
 async function run(job,previous){
  if(previous)await previous.promise;
  const started=Date.now(),sources={},observedBuild=build();
  try{
   check(job);
   sources.personal=await readStore(job,'sukunRec','clips','current-personal',(value,result)=>addBlob(value,result));check(job);
   sources.ambience=await readStore(job,'sukunCustomAmb','sounds','current-ambience',(value,result)=>addBlob(value?.blob,result));check(job);
   sources.generic=await generic(job);check(job);
   sources.recovery=await readStore(job,'sukunRecoveryDataR1019','points','recovery-copies',recoveryPoint,{count:0,blobBytes:0,recordings:0,ambience:0,listed:0});check(job);
  }catch(_){}
  for(const [key,scope] of [['personal','current-personal'],['ambience','current-ambience'],['generic','accessible-generic'],['recovery','recovery-copies']])if(!sources[key])sources[key]={...cancelled(scope),...(key==='generic'?{enabled:null}:key==='recovery'?{recordings:null,ambience:null,listed:null}:{})};
  const measuredQuota=await quota(job),isCancelled=job.controller.signal.aborted||active!==job||generation!==job.id;
  const observation=freeze({at:Date.now(),build:observedBuild,status:isCancelled?'cancelled':Object.values(sources).every(value=>value.status==='ok')&&measuredQuota.status==='ok'?'complete':'partial',sources,quota:measuredQuota,elapsedMs:Math.max(0,Date.now()-started)});
  if(active===job&&generation===job.id){current=observation;if(observation.status==='complete')lastSuccessful=observation;active=null;return snapshot()}
  return freeze(clone({version:VERSION,phase:'idle',current:observation,lastSuccessful}));
 }
 function inspect(options={}){
  const previous=active;if(previous)previous.controller.abort();
  const job={id:++generation,controller:new AbortController(),promise:null};active=job;
  const signal=options?.signal,abort=()=>job.controller.abort();
  try{if(signal?.aborted)abort();else signal?.addEventListener?.('abort',abort,{once:true})}catch(_){abort()}
  job.promise=run(job,previous).finally(()=>{try{signal?.removeEventListener?.('abort',abort)}catch(_){}});return job.promise;
 }
 w.SukunStorageSnapshotR1107=Object.freeze({version:VERSION,snapshot,inspect,cancel:()=>{if(!active)return false;active.controller.abort();return true}});
})(window);
