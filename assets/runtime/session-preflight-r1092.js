/* r1092: a local, read-only explanation of the smart session's planned sources.
 * A successful probe is not an audio-start, codec or screen-lock guarantee.
 * No resolver play/has/find, fetch, audio context, lease or storage write is used.
 */
(function(w){
 'use strict';if(w.SukunSessionPreflightR1092)return;
 const VERSION='r1092',READ_TIMEOUT=2500,MAX_STEPS=256,MAX_KEYS=2000;
 const text=value=>typeof value==='string'?value.trim():'';
 const safe=(fn,fallback=null)=>{try{return fn()??fallback}catch(_){return fallback}};
 const database=()=>typeof REC_DB!=='undefined'?REC_DB:null;
 const catalog=()=>typeof SK_RECORDING_CATALOG!=='undefined'?SK_RECORDING_CATALOG:null;
 const known=key=>typeof RECKEYS!=='undefined'&&RECKEYS?.has?.(key)===true;
 const validBlob=blob=>typeof Blob!=='undefined'&&blob instanceof Blob&&blob.size>0&&(!blob.type||/^audio\//i.test(blob.type));
 const result=(source,availability,reason='')=>({source,availability,reason});
 const unavailable=reason=>result('unavailable','unavailable',reason);
 const unknown=reason=>result('unknown','unknown',reason);
 function isVisible(step){
  const policy=w.SukunSecretPolicy;
  if(!policy||typeof policy.secretStep!=='function'||!step||typeof step!=='object')return false;
  try{
   let current=step;const seen=new Set();
   // Favorites carry only a category/index alias. Check that canonical
   // metadata before a protected title or source key can reach this surface.
   for(let depth=0;depth<8;depth++){
    // User compositions can contain protected names without carrying them
    // on the category/index step. Consult the canonical gate before labels.
    if(current.type==='zikir'&&current.cat==='terkip'&&(typeof w.SukunTerkipAllowed!=='function'||w.SukunTerkipAllowed(current)!==true))return false;
    if(policy.secretStep(current)===true)return false;
    if(current.type!=='zikir')return true;
    const identity=String(current.cat)+':'+String(current.idx);if(seen.has(identity))return false;seen.add(identity);
    const item=itemFor(current),source=item?._src,aliasIndex=item?._i;
    if(source==null&&aliasIndex==null)return true;
    if(typeof source!=='string'||!source||aliasIndex===null||aliasIndex===''||aliasIndex===undefined||!Number.isInteger(Number(aliasIndex))||Number(aliasIndex)<0)return false;
    current={type:'zikir',cat:source,idx:Number(aliasIndex)};
   }
   return false;
  }catch(_){return false}
 }
 const hidden=step=>!isVisible(step);
 function stamp(step){return JSON.stringify([step?.type,step?.cat,step?.idx,step?._r472SourceMode||'auto'])}
 function itemFor(step){
  const raw=step?.idx,index=Number(raw);
  if(raw===null||raw===''||raw===undefined||!Number.isInteger(index)||index<0)return null;
  const all=typeof ZIKIR!=='undefined'?ZIKIR:w.ZIKIR;
  const items=all?.[step.cat]?.items;return Array.isArray(items)?items[index]||null:null;
 }
 function titleFor(item){return[item?.tr,item?.t,item?.nm,item?.oku,item?.translit,item?.ar,item?.a].map(text).find(Boolean)||''}
 function personalError(error){
  return error?.name==='AbortError'?'inspection-cancelled':error?.name==='RecordingReadTimeout'||error?.name==='RecordingOpenTimeout'?'recording-read-timeout':'recording-storage-unavailable';
 }
 async function inspect(queue,opt={}){
  const policy=w.SukunSecretPolicy;
  if(!policy||typeof policy.secretStep!=='function')return{version:VERSION,status:'attention',rows:[],reason:'privacy-policy-unavailable'};
  if(!Array.isArray(queue))return{version:VERSION,status:'attention',rows:[],reason:'queue-unavailable'};
  const settings=w.SukunVoiceSettings,archive=w.SukunGenericRecordings,initialLength=queue.length;
  const preferenceEpoch=safe(()=>settings?.epoch?.(),0),archiveEpoch=safe(()=>archive?.epoch?.(),0),initialAccess=safe(()=>policy.unlocked?.(),false);
  // Filter before catalog labels, recording candidates or any source lookup.
  const visible=[];for(let index=0;index<queue.length;index++){const step=queue[index];if(step&&typeof step==='object'&&!hidden(step))visible.push({step,index,stamp:stamp(step)})}
  const selected=visible.slice(0,MAX_STEPS),reads=new Map(),versions=new Map(),genericReads=new Map();let keyList=null;
  const current=()=>safe(()=>!opt.signal?.aborted&&(typeof opt.isCurrent!=='function'||opt.isCurrent()===true)&&queue.length===initialLength&&preferenceEpoch===(settings?.epoch?.()||0)&&archiveEpoch===(archive?.epoch?.()||0)&&initialAccess===(policy.unlocked?.()||false)&&visible.every(row=>queue[row.index]===row.step&&row.stamp===stamp(row.step))&&[...versions].every(([key,value])=>database()===value.db&&(value.db.revision?.(key)||0)===value.revision),false);
  const check=()=>{if(!current())throw Object.assign(new Error('inspection-cancelled'),{name:'AbortError'})};
  async function read(key){
   if(reads.has(key))return reads.get(key);
   const promise=(async()=>{
    check();if(policy.secretRecKey?.(key))return{state:'unknown',reason:'recording-key-locked'};
    const db=database();if(!db||typeof db.get!=='function')return{state:'unavailable',reason:'recording-storage-unavailable'};
    const revision=db.revision?.(key)||0;versions.set(key,{db,revision});
    try{
     const memory=w.SukunSingleRecordedFallback?.get?.(key)?.blob;
     const blob=memory||await db.get(key,{signal:opt.signal,timeoutMs:READ_TIMEOUT});check();
     if(revision!==(db.revision?.(key)||0))return{state:'unknown',reason:'recording-source-changed'};
     if(blob)return validBlob(blob)?{state:'present'}:{state:'unavailable',reason:'recording-invalid'};
     if(catalog()?.error==='RecordingCatalogMismatch'&&known(key))return{state:'unavailable',reason:'recording-catalog-unconfirmed'};
     return{state:'missing'};
    }catch(error){if(!current())throw error;return{state:'unavailable',reason:personalError(error)}}
   })();reads.set(key,promise);return promise;
  }
  async function personal(keys){
   let mismatch=null;
   for(const key of keys){
    const found=await read(key);check();
    // r637 allows another valid form of the same Name after an unconfirmed
    // empty catalog read. Other storage failures still stop the source plan.
    if(found.state==='unavailable'&&found.reason==='recording-catalog-unconfirmed'){mismatch=found;continue}
    if(found.state!=='missing')return found;
   }
   return mismatch||{state:'missing'};
  }
  async function legacyPersonal(step){
   const legacy=w.SukunSmartSessionSource,db=database();
   if(typeof legacy?.legacyCandidates!=='function'||typeof legacy?.matchesLegacyKey!=='function')return{state:'unknown',reason:'legacy-recording-index-unverified'};
   const direct=legacy.legacyCandidates(step);
   if(!Array.isArray(direct)||direct.length>MAX_KEYS)return{state:'unknown',reason:'legacy-recording-index-unverified'};
   for(const key of direct){if(typeof key!=='string'||policy.secretRecKey?.(key))return{state:'unknown',reason:'recording-key-locked'}}
   const foundDirect=await personal(direct);if(foundDirect.state!=='missing')return foundDirect;
   if(!db||typeof db.keys!=='function')return{state:'unknown',reason:'legacy-recording-index-unverified'};
   try{
    if(!keyList)keyList=Promise.resolve().then(()=>db.keys({signal:opt.signal,timeoutMs:READ_TIMEOUT}));
    const keys=await keyList;check();if(!Array.isArray(keys)||keys.length>MAX_KEYS)return{state:'unknown',reason:'legacy-recording-index-unverified'};
    // r472 also admits old label-based keys. Inspect only visible keys and use
    // that exact match rule; never relabel protected recordings for this UI.
    for(const key of keys){
     check();if(typeof key!=='string'||policy.secretRecKey?.(key))continue;
     if(legacy.matchesLegacyKey(step,key)){
      const found=await read(key);if(found.state!=='missing')return found;
     }
    }
    return{state:'missing'};
   }catch(error){if(!current())throw error;return{state:'unavailable',reason:personalError(error)}}
  }
  function sourceResult(found,source){
   if(found.state==='present')return result(source,'local','recording-read');
   if(found.state==='unavailable')return unavailable(found.reason||'recording-storage-unavailable');
   if(found.state==='unknown')return unknown(found.reason||'recording-source-unverified');
   return null;
  }
  async function generic(keys){
   const identity=JSON.stringify(keys);if(genericReads.has(identity))return genericReads.get(identity);
   const promise=(async()=>{
   check();if(!archive)return{state:'unknown',reason:'archive-unavailable'};
   const snapshot=safe(()=>archive.snapshot?.());
   if(snapshot?.enabled===false)return{state:'missing'};
   if(typeof archive.probe!=='function')return{state:'unknown',reason:'archive-probe-unavailable'};
   try{const found=await archive.probe(keys,{signal:opt.signal,isCurrent:current,timeoutMs:READ_TIMEOUT});check();return found||{state:'unknown',reason:'archive-source-unverified'}}
   catch(error){if(!current())throw error;return{state:'unavailable',reason:'archive-storage-unavailable'}}
   })();genericReads.set(identity,promise);return promise;
  }
  async function bundle(step,item,permissions){
   if(step.cat!=='koruma'||permissions.source!=='auto'||permissions.content==='meaning')return null;
   const entry=w.SukunReadingSourcesR1064?.forZikir?.(step.cat,Number(step.idx),'nida');
   const descriptor=entry&&w.SukunBundledArabicR1065?.descriptor?.(entry);if(!descriptor)return null;
   if(!w.SukunPreflightCacheR1092?.inspect)return result('bundled','unknown','cache-unverified');
   try{
    const cached=await w.SukunPreflightCacheR1092.inspect(descriptor,current);check();
    return result('bundled',cached?.state==='cached'?'cached':cached?.state==='not-cached'?'network-needed':'unknown',cached?.state==='cached'?'bundled-cache-verified':cached?.state==='not-cached'?'bundled-not-cached':'cache-unverified');
   }catch(error){if(!current())throw error;return result('bundled','unknown','cache-unverified')}
  }
  function fallback(step){
   const describe=w.SukunSmartSessionSource?.describeFallback;
   if(typeof describe!=='function')return unknown('smart-fallback-unverified');
   const descriptor=describe(step);
   if(!descriptor||descriptor.verified===false)return unknown(descriptor?.reason||'smart-fallback-unverified');
   if(descriptor.available===false)return /text-unavailable/.test(descriptor.reason||'')?result('missing','unavailable',descriptor.reason):unavailable(descriptor.reason||'device-voice-unavailable');
   if(descriptor.textAvailable===false)return result('missing','unavailable',descriptor.reason||'text-unavailable');
   const voice=descriptor.voice;
   return result('device',voice?.localService===false?'network-needed':'device-dependent',voice?.localService===true?'device-reports-local':voice?.localService===false?'device-reports-remote':'device-offline-unverified');
  }
  async function inspectStep(row){
   const {step,index}=row;check();if(hidden(step))return null;
   const type=String(step.type||'');
   // A silence step still plays its recorded/TTS opening announcement. Until
   // that separate adapter exposes a source plan, do not certify it offline.
   if(type==='silence')return{index,type,title:'',...result('silence','unknown','silence-announcement-unverified')};
   if(type==='frequency')return{index,type,title:'',...result('frequency','not-needed','generated-frequency')};
   if(type!=='zikir')return{index,type,title:'',...unknown('unsupported-step')};
   const item=itemFor(step),title=item?titleFor(item):'';
   if(!item||!title)return{index,type,title,...result('missing','unavailable',!item?'missing-source':'empty-source')};
   // Multipart cycles have a different whole-recording/part resolver. Keep the
   // limitation explicit until that resolver provides its own read-only plan.
   if(step.cat==='terkip')return{index,type,title,...unknown('multipart-source-unverified')};
   const priority=w.SukunRecordingPriorityLock,reading=w.SukunReadingPolicy;
   if(typeof priority?.candidates!=='function'||typeof reading?.permissions!=='function')return{index,type,title,...unknown('source-policy-unavailable')};
   const options={session:true,form:'nida',cat:step.cat,index:Number(step.idx)};
   const permissions=reading.permissions(item,options),mode=permissions.source||settings?.getMode?.()||'auto';
   const bundled=await bundle(step,item,{...permissions,source:mode});if(bundled)return{index,type,title,...bundled};
   // The smart adapter's shared pure fallback descriptor is authoritative for
   // explicit device modes too; those modes do not admit recording lookups.
   if(mode==='arabic'||mode==='turkish')return{index,type,title,...fallback(step)};
   if(!['auto','personal','generic'].includes(mode))return{index,type,title,...unknown('explicit-device-policy-unverified')};
   const keys=priority.candidates(step.cat,Number(step.idx),item,options);
   if(!Array.isArray(keys)||keys.length>MAX_KEYS)return{index,type,title,...unknown('recording-candidates-unverified')};
   if(keys.some(key=>typeof key!=='string'||policy.secretRecKey?.(key)))return{index,type,title,...unknown('recording-key-locked')};
   if(permissions.personal){const found=await personal(keys),value=sourceResult(found,'personal');if(value)return{index,type,title,...value}}
   if(permissions.generic){const found=await generic(keys),value=sourceResult(found,'generic');if(value)return{index,type,title,...value}}
   if(mode==='personal'||mode==='generic')return{index,type,title,...result('missing','unavailable',permissions[mode]?'recording-required':'recording-content-unknown')};
   const legacy=await legacyPersonal(step),legacyValue=sourceResult(legacy,'personal');
   return{index,type,title,...(legacyValue||fallback(step))};
  }
  try{
   const rows=[];for(const row of selected){const value=await inspectStep(row);check();if(value&&!hidden(row.step))rows.push(value)}
   check();const attention=visible.length>MAX_STEPS||rows.some(row=>['unknown','unavailable','missing'].includes(row.source)||['unknown','unavailable','network-needed','device-dependent'].includes(row.availability));
   return{version:VERSION,status:attention?'attention':'ready',rows,...(visible.length>MAX_STEPS?{reason:'queue-limit'}:{})};
  }catch(error){return{version:VERSION,status:current()?'attention':'stale',rows:[],reason:current()?'inspection-unavailable':'inspection-cancelled'}}
 }
 w.SukunSessionPreflightR1092=Object.freeze({version:VERSION,inspect,isVisible});
})(window);
