/* r1020: explicit, read-only observation of the current local recording store.
   Totals describe one completed read, not recovery, deletion, or audio validity.
   No startup scan; no names, keys, audio bytes, payloads, or remote requests. */
(function(){
  'use strict';
  if(window.SukunRecordingInspection)return;
  const VERSION='r1020',KEY='sukun.recording.inspection.v1',MAX_BYTES=2048,READ_TIMEOUT=8000;
  const NATIVE_ERRORS=new Set(['SecurityError','VersionError','UnknownError','InvalidStateError','QuotaExceededError','AbortError']);
  const CODES=new Set(['idb-unavailable','db-missing','store-missing','db-blocked','db-open-failed','read-failed','read-aborted','read-timeout','inspection-cancelled','invalid-record','unsafe-total',...NATIVE_ERRORS]);
  const STATUS_CODES={missing:new Set(['db-missing','store-missing']),unsupported:new Set(['idb-unavailable']),unavailable:new Set(['db-open-failed','read-failed','read-aborted','invalid-record','unsafe-total',...NATIVE_ERRORS]),'timed-out':new Set(['read-timeout']),cancelled:new Set(['inspection-cancelled']),blocked:new Set(['db-blocked'])};
  function failure(error,fallback){try{const name=error?.name;return NATIVE_ERRORS.has(name)?name:fallback}catch(_){return fallback}}
  const integer=v=>Number.isSafeInteger(v)&&v>=0;
  const safeBuild=v=>typeof v==='string'&&/^r\d{1,8}$/.test(v)?v:null;
  function frozen(v){if(v&&typeof v==='object'){Object.values(v).forEach(frozen);Object.freeze(v)}return v}
  function observation(v){
    if(!v||typeof v!=='object'||!integer(v.at)||v.at>8640000000000000)return null;
    if(v.status==='ok'){
      if(!integer(v.count)||!integer(v.blobBytes)||(v.count===0&&v.blobBytes!==0)||v.errorCode!==null)return null;
    }else if(!Object.prototype.hasOwnProperty.call(STATUS_CODES,v.status)||!CODES.has(v.errorCode)||!STATUS_CODES[v.status].has(v.errorCode)||v.count!==null||v.blobBytes!==null)return null;
    return {at:v.at,build:safeBuild(v.build),status:v.status,count:v.count,blobBytes:v.blobBytes,errorCode:v.errorCode};
  }
  let latest=null,lastSuccessful=null,lastNonEmpty=null,persistence='available',active=null,generation=0;
  try{
    const raw=window.localStorage.getItem(KEY);
    if(typeof raw==='string'&&raw.length<=MAX_BYTES&&/^[\x00-\x7f]*$/.test(raw)){
      const value=JSON.parse(raw);
      if(value&&value.schema===1){
        latest=observation(value.current);
        const previous=observation(value.lastSuccessful);
        lastSuccessful=latest?.status==='ok'?latest:(previous?.status==='ok'?previous:null);
        const saved=observation(value.lastNonEmpty);
        lastNonEmpty=[saved,previous,latest].filter(v=>v?.status==='ok'&&v.count>0).sort((a,b)=>b.at-a.at)[0]||null;
      }
    }
  }catch(_){
    // Malformed persisted metadata is ignored; an inaccessible storage API is
    // distinguished below without storing any exception text.
    try{window.localStorage.getItem(KEY)}catch(_){persistence='unavailable'}
  }
  // Count-only historical receipts are evidence, never recording content.
  try{
    const raw=window.localStorage.getItem('sukun.recording.continuity.v1');
    if(typeof raw==='string'&&raw.length<=2048){
      const value=JSON.parse(raw);
      if(value?.schema===1)for(const receipt of [value.before,value.after]){
        if(receipt?.status!=='ok'||receipt.at>Date.now()+300000)continue;
        const candidate=observation({at:receipt.at,build:receipt.appVersion,status:'ok',count:receipt.count,blobBytes:receipt.blobBytes,errorCode:null});
        if(candidate?.count>0&&(!lastNonEmpty||candidate.at>lastNonEmpty.at))lastNonEmpty=candidate;
      }
    }
  }catch(_){}
  function persist(){
    try{
      const raw=JSON.stringify({schema:1,current:latest,lastSuccessful,lastNonEmpty});
      if(raw.length>MAX_BYTES||!/^[\x00-\x7f]*$/.test(raw))throw 0;
      window.localStorage.setItem(KEY,raw);
      if(window.localStorage.getItem(KEY)!==raw)throw 0;
      persistence='available';
    }catch(_){persistence='unavailable'}
  }
  function snapshot(){
    return frozen(JSON.parse(JSON.stringify({version:VERSION,phase:active?'reading':'idle',current:latest,lastSuccessful,lastNonEmpty,previouslyPopulatedNowEmpty:latest?.status==='ok'&&latest.count===0&&!!lastNonEmpty,persistence})));
  }
  function build(){try{return safeBuild(window.document?.querySelector('meta[name="sukun-build"]')?.content)}catch(_){return null}}
  function inspect(options={}){
    const signal=options?.signal;
    if(active){const running=active;running.listen(signal);return running.promise}
    const id=++generation,observedBuild=build();
    let resolve,done=false,db=null,tx=null,request=null,cursorRequest=null,count=0,blobBytes=0,ended=false,timer=null;
    const listeners=[];
    const promise=new Promise(accept=>{resolve=accept});
    const close=connection=>{try{connection?.close()}catch(_){}};
    const closeRequest=()=>{try{close(request?.result)}catch(_){}};
    const isCurrent=()=>!done&&active===job&&generation===id;
    function finish(status,errorCode=null){
      if(!isCurrent())return;
      done=true;clearTimeout(timer);
      for(const [source,listener] of listeners)try{source.removeEventListener('abort',listener)}catch(_){}
      if(cursorRequest)cursorRequest.onsuccess=cursorRequest.onerror=null;
      if(tx){tx.oncomplete=tx.onabort=tx.onerror=null;if(status!=='ok')try{tx.abort()}catch(_){}}
      if(db){db.onversionchange=null;close(db)}
      const result=frozen({at:Date.now(),build:observedBuild,status,count:status==='ok'?count:null,blobBytes:status==='ok'?blobBytes:null,errorCode});
      latest=result;if(status==='ok')lastSuccessful=result;if(status==='ok'&&count>0)lastNonEmpty=result;
      active=null;persist();resolve(result);
    }
    function listen(source){
      if(!source||!isCurrent())return;
      try{
        if(source.aborted){finish('cancelled','inspection-cancelled');return}
        if(typeof source.addEventListener!=='function'||typeof source.removeEventListener!=='function')return;
        if(listeners.some(item=>item[0]===source))return;
        const listener=()=>finish('cancelled','inspection-cancelled');
        listeners.push([source,listener]);source.addEventListener('abort',listener,{once:true});
        if(source.aborted)listener();
      }catch(_){finish('cancelled','inspection-cancelled')}
    }
    const job={promise,listen};active=job;
    timer=setTimeout(()=>finish('timed-out','read-timeout'),READ_TIMEOUT);
    listen(signal);if(!isCurrent())return promise;
    function open(factory){
      if(!isCurrent())return;
      try{
        request=factory.open('sukunRec');
        request.onupgradeneeded=()=>{
          // Even a late open may enter an initial upgrade. Always abort it so
          // engines without databases() cannot commit a newly created database.
          try{request.transaction?.abort()}catch(_){}
          closeRequest();finish('missing','db-missing');
        };
        request.onerror=()=>{closeRequest();finish('unavailable',failure(request.error,'db-open-failed'))};
        request.onblocked=()=>finish('blocked','db-blocked');
        request.onsuccess=event=>{
          const connection=event.target.result;
          if(!isCurrent()){close(connection);return}
          db=connection;
          try{
            db.onversionchange=()=>finish('unavailable','read-aborted');
            if(!db.objectStoreNames.contains('clips')){finish('missing','store-missing');return}
            tx=db.transaction('clips','readonly');
            tx.onabort=()=>finish('unavailable',failure(tx.error,'read-aborted'));
            tx.onerror=()=>finish('unavailable',failure(tx.error,'read-failed'));
            tx.oncomplete=()=>finish(ended?'ok':'unavailable',ended?null:'read-failed');
            cursorRequest=tx.objectStore('clips').openCursor();
            cursorRequest.onerror=()=>finish('unavailable',failure(cursorRequest.error,'read-failed'));
            cursorRequest.onsuccess=()=>{
              if(!isCurrent())return;
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
      }catch(error){closeRequest();finish('unavailable',failure(error,'db-open-failed'))}
    }
    try{
      const factory=window.indexedDB;
      if(!factory||typeof factory.open!=='function'){finish('unsupported','idb-unavailable');return promise}
      if(typeof factory.databases==='function'){
        Promise.resolve(factory.databases()).then(items=>{
          if(!isCurrent())return;
          try{
            if(!Array.isArray(items)){finish('unavailable','db-open-failed');return}
            if(!items.some(item=>item?.name==='sukunRec')){finish('missing','db-missing');return}
            open(factory);
          }catch(error){finish('unavailable',failure(error,'db-open-failed'))}
        },error=>finish('unavailable',failure(error,'db-open-failed')));
      }else open(factory);
    }catch(error){finish('unavailable',failure(error,'db-open-failed'))}
    return promise;
  }
  window.SukunRecordingInspection=Object.freeze({version:VERSION,inspect,snapshot});
})();
