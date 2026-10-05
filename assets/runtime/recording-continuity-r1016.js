/* r1016: local metadata receipts around an explicitly approved application update.
   Read-only IndexedDB inspection. Never read audio bytes, keys, names or URLs.
   Equal totals are not content verification; changed totals do not establish cause.
   This is not a microphone-save guard, backup, recovery or storage-retention promise. */
(function(){
  'use strict';
  if(window.SukunRecordingUpdateDiagnostics)return;
  const VERSION='r1016',KEY='sukun.recording.continuity.v1',MAX_BYTES=2048,MAX_AGE=86400000,READ_TIMEOUT=8000;
  const CODES=new Set(['idb-unavailable','db-missing','store-missing','db-blocked','db-open-failed','read-failed','read-aborted','read-timeout','invalid-record','unsafe-total','storage-unavailable','invalid-receipt','stale-receipt','build-mismatch','changed-receipt','update-cancelled','correlation-unavailable','SecurityError','UnknownError','QuotaExceededError','VersionError','AbortError','NotFoundError','InvalidStateError','DataError','TransactionInactiveError','ConstraintError','InvalidAccessError','NotReadableError']);
  const NATIVE_ERRORS=new Set(['SecurityError','UnknownError','QuotaExceededError','VersionError','AbortError','NotFoundError','InvalidStateError','DataError','TransactionInactiveError','ConstraintError','InvalidAccessError','NotReadableError']);
  const failure=(error,fallback)=>NATIVE_ERRORS.has(error?.name)?error.name:fallback;
  const safeBuild=v=>typeof v==='string'&&/^r\d{1,8}$/.test(v)?v:null;
  const safeCode=v=>CODES.has(v)?v:null;
  const integer=v=>Number.isSafeInteger(v)&&v>=0;
  const clone=v=>JSON.parse(JSON.stringify(v));
  function frozen(v){if(v&&typeof v==='object'){Object.values(v).forEach(frozen);Object.freeze(v)}return v}
  let pair=null,persistence='available',problem=null,stageGeneration=0,bootStarted=false,observedBuild=null;
  try{observedBuild=safeBuild(window.document?.querySelector('meta[name="sukun-build"]')?.content)}catch(_){}
  const tickets=new WeakMap();
  function readStorage(){
    try{return window.localStorage.getItem(KEY)}catch(_){persistence='unavailable';problem='storage-unavailable';return undefined}
  }
  function receipt(v){
    if(!v||typeof v!=='object'||!integer(v.at)||!['ok','unavailable'].includes(v.status))return null;
    const status=v.status,errorCode=safeCode(v.errorCode);
    if(status==='ok'&&(!integer(v.count)||!integer(v.blobBytes)||v.errorCode!==null))return null;
    if(status==='unavailable'&&(v.count!==null||v.blobBytes!==null||!errorCode))return null;
    const correlationId=typeof v.correlationId==='string'&&/^[a-f0-9]{32}$/.test(v.correlationId)?v.correlationId:null;
    return {appVersion:safeBuild(v.appVersion),controllerVersion:safeBuild(v.controllerVersion),targetVersion:safeBuild(v.targetVersion),status,count:status==='ok'?v.count:null,blobBytes:status==='ok'?v.blobBytes:null,errorCode,at:v.at,correlationId};
  }
  function decode(raw){
    if(raw==null||raw==='')return null;
    try{
      if(typeof raw!=='string'||raw.length>MAX_BYTES)throw 0;
      const value=JSON.parse(raw),before=value.before===null?null:receipt(value.before),after=value.after===null?null:receipt(value.after);
      if(value.schema!==1||(value.before!==null&&!before)||(value.after!==null&&!after)||(!before&&!after))throw 0;
      if(before&&(!before.appVersion||!before.targetVersion||before.appVersion===before.targetVersion))throw 0;
      if(!before&&(!after.appVersion||after.targetVersion!==after.appVersion||after.correlationId!==null))throw 0;
      if(before&&after&&(after.correlationId!==before.correlationId||after.targetVersion!==before.targetVersion||after.appVersion!==before.targetVersion||after.at<before.at))throw 0;
      return {schema:1,before,after};
    }catch(_){problem='invalid-receipt';return null}
  }
  const bootRaw=readStorage();
  const bootPair=decode(bootRaw);pair=bootPair;
  function store(value){
    try{
      const raw=JSON.stringify(value);
      if(raw.length>MAX_BYTES)throw 0;
      window.localStorage.setItem(KEY,raw);
      if(window.localStorage.getItem(KEY)!==raw)throw 0;
      pair=value;persistence='available';problem=null;return true;
    }catch(_){pair=value;persistence='unavailable';problem='storage-unavailable';return false}
  }
  function randomId(){
    try{const v=new Uint8Array(16);window.crypto.getRandomValues(v);return Array.from(v,x=>x.toString(16).padStart(2,'0')).join('')}catch(_){return null}
  }
  function current(check){try{return typeof check!=='function'||check()===true}catch(_){return false}}
  function scan(isCurrent){
    return new Promise(resolve=>{
      let done=false,db=null,tx=null,request=null,cursorRequest=null,count=0,blobBytes=0,ended=false;
      const finish=(status,errorCode=null)=>{
        if(done)return;done=true;clearTimeout(timer);
        if(cursorRequest)cursorRequest.onsuccess=cursorRequest.onerror=null;
        if(tx){tx.oncomplete=tx.onabort=tx.onerror=null;if(status!=='ok')try{tx.abort()}catch(_){}}
        try{db?.close()}catch(_){}
        resolve({status,count:status==='ok'?count:null,blobBytes:status==='ok'?blobBytes:null,errorCode});
      };
      const timer=setTimeout(()=>finish('unavailable','read-timeout'),READ_TIMEOUT);
      function open(){
        if(done)return;if(!current(isCurrent)){finish('unavailable','update-cancelled');return}
        try{
          request=window.indexedDB.open('sukunRec');
          request.onupgradeneeded=()=>{
            // Aborting the implicit initial upgrade prevents even an empty database
            // from being committed on engines without indexedDB.databases().
            try{request.transaction?.abort()}catch(_){}
            finish('unavailable','db-missing');
          };
          request.onerror=()=>finish('unavailable',failure(request.error,'db-open-failed'));
          request.onblocked=()=>finish('unavailable','db-blocked');
          request.onsuccess=e=>{
            const connection=e.target.result;
            if(done){try{connection.close()}catch(_){};return}
            db=connection;db.onversionchange=()=>finish('unavailable','read-aborted');
            if(!current(isCurrent)){finish('unavailable','update-cancelled');return}
            if(!db.objectStoreNames.contains('clips')){finish('unavailable','store-missing');return}
            try{
              tx=db.transaction('clips','readonly');
              tx.onabort=()=>finish('unavailable',failure(tx.error,'read-aborted'));
              tx.onerror=()=>finish('unavailable',failure(tx.error,'read-failed'));
              tx.oncomplete=()=>finish(ended?'ok':'unavailable',ended?null:'read-failed');
              cursorRequest=tx.objectStore('clips').openCursor();
              cursorRequest.onerror=()=>finish('unavailable',failure(cursorRequest.error,'read-failed'));
              cursorRequest.onsuccess=()=>{
                if(done)return;if(!current(isCurrent)){finish('unavailable','update-cancelled');return}
                try{
                  const cursor=cursorRequest.result;
                  if(!cursor){ended=true;return}
                  const value=cursor.value;
                  if(!(value instanceof Blob)){finish('unavailable','invalid-record');return}
                  const size=value.size;
                  if(!integer(size)||!Number.isSafeInteger(blobBytes+size)||!Number.isSafeInteger(count+1)){finish('unavailable','unsafe-total');return}
                  count++;blobBytes+=size;cursor.continue();
                }catch(error){finish('unavailable',failure(error,'read-failed'))}
              };
            }catch(error){finish('unavailable',failure(error,'read-failed'))}
          };
        }catch(error){finish('unavailable',failure(error,'db-open-failed'))}
      }
      if(!current(isCurrent)){finish('unavailable','update-cancelled');return}
      try{
        if(!window.indexedDB){finish('unavailable','idb-unavailable');return}
        if(typeof window.indexedDB.databases==='function'){
          Promise.resolve(window.indexedDB.databases()).then(items=>{
            if(done)return;
            if(!Array.isArray(items)){finish('unavailable','db-open-failed');return}
            if(!items.some(item=>item?.name==='sukunRec')){finish('unavailable','db-missing');return}
            open();
          },error=>finish('unavailable',failure(error,'db-open-failed')));
        }else open();
      }catch(error){finish('unavailable',failure(error,'db-open-failed'))}
    });
  }
  async function prepareBeforeUpdate(options={}){
    const generation=++stageGeneration,isCurrent=options.isCurrent;
    if(!current(isCurrent))return null;
    const result=await scan(()=>generation===stageGeneration&&current(isCurrent));
    if(generation!==stageGeneration||!current(isCurrent))return null;
    const appVersion=safeBuild(options.appVersion),targetVersion=safeBuild(options.targetVersion);
    if(!appVersion||!targetVersion||appVersion===targetVersion){problem='build-mismatch';return null}
    const before={appVersion,controllerVersion:safeBuild(options.controllerVersion),targetVersion,...result,at:Date.now(),correlationId:randomId()};
    const ticket=Object.freeze({});tickets.set(ticket,{before,generation,isCurrent});return ticket;
  }
  function commitBeforeReload(ticket){
    const staged=ticket&&tickets.get(ticket);if(!staged)return false;tickets.delete(ticket);
    if(staged.generation!==stageGeneration||!current(staged.isCurrent))return false;
    // Diagnostics failing to persist must not block an otherwise approved update.
    // The in-memory snapshot explicitly becomes unavailable; no verified pair.
    store({schema:1,before:staged.before,after:null});return true;
  }
  function abandonPrepared(){stageGeneration++}
  async function afterBoot(options={}){
    if(bootStarted)return snapshot();bootStarted=true;
    const appVersion=safeBuild(options.appVersion);observedBuild=appVersion||observedBuild;
    if(persistence==='unavailable'||problem==='invalid-receipt'||bootPair?.after)return snapshot();
    const now=Date.now(),before=bootPair?.before||null;
    if(!appVersion){problem='build-mismatch';return snapshot()}
    if(before&&(now-before.at>MAX_AGE||before.at>now+300000)){problem='stale-receipt';return snapshot()}
    if(before&&(appVersion!==before.targetVersion||appVersion===before.appVersion)){problem='build-mismatch';return snapshot()}
    const stillRelevant=()=>stageGeneration===0&&current(options.isCurrent);
    let result=await scan(stillRelevant);
    if(stageGeneration!==0)return snapshot();
    if(!current(options.isCurrent))result={status:'unavailable',count:null,blobBytes:null,errorCode:'update-cancelled'};
    if(readStorage()!==bootRaw){if(persistence!=='unavailable')problem='changed-receipt';return snapshot()}
    const after={appVersion,controllerVersion:safeBuild(options.controllerVersion),targetVersion:before?.targetVersion||appVersion,...result,at:Date.now(),correlationId:before?.correlationId||null};
    store({schema:1,before,after});return snapshot();
  }
  function snapshot(){
    let relevance=null;
    if(pair){
      const last=pair.after||pair.before;
      if(Date.now()-last.at>MAX_AGE||last.at>Date.now()+300000||(pair.before&&pair.after&&pair.after.at-pair.before.at>MAX_AGE))relevance='stale-receipt';
      else if(pair.after&&observedBuild&&pair.after.appVersion!==observedBuild)relevance='build-mismatch';
      else if(pair.after&&pair.before&&pair.after.controllerVersion&&pair.after.controllerVersion!==pair.before.targetVersion)relevance='build-mismatch';
    }
    let status='none',errorCode=problem||relevance,comparison={status:'not-ready',countDelta:null,blobBytesDelta:null,causality:'not-determined'};
    if(persistence==='unavailable'||problem==='invalid-receipt'){status='unavailable';comparison.status='unavailable'}
    else if(problem||relevance){status='not-relevant';comparison.status='not-relevant'}
    else if(pair){
      if(!pair.before){status=pair.after.status==='ok'?'baseline':'unavailable';if(status==='unavailable'){comparison.status='unavailable';errorCode=pair.after.errorCode}}
      else if(!pair.after)status='pending';
      else if(!pair.before.correlationId){status='unavailable';comparison.status='unavailable';errorCode='correlation-unavailable'}
      else if(pair.before.status!=='ok'||pair.after.status!=='ok'){status='unavailable';comparison.status='unavailable';errorCode=pair.after.errorCode||pair.before.errorCode}
      else if(!pair.after.controllerVersion||!pair.before.controllerVersion||![pair.before.appVersion,pair.before.targetVersion].includes(pair.before.controllerVersion)){status='unavailable';comparison.status='unavailable';errorCode='build-mismatch'}
      else{
        const countDelta=pair.after.count-pair.before.count,blobBytesDelta=pair.after.blobBytes-pair.before.blobBytes;
        status=countDelta===0&&blobBytesDelta===0?'same':'different';comparison={status,countDelta,blobBytesDelta,causality:'not-determined'};
      }
    }
    return frozen(clone({version:VERSION,status,persistence,errorCode:errorCode||null,before:pair?.before||null,after:pair?.after||null,comparison}));
  }
  window.SukunRecordingUpdateDiagnostics=Object.freeze({version:VERSION,snapshot,prepareBeforeUpdate,commitBeforeReload,abandonPrepared,afterBoot});
})();
