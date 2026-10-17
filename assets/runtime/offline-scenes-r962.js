/* Image-package UI facade. The worker remains the sole image cache authority;
   this module owns explicit scope, current-build/client and privacy fences. */
(()=>{'use strict';
 const w=window,VERSION='r1095',EVENT='sukun:imagepackchange',PACKAGES=Object.freeze([Object.freeze({id:'phone'}),Object.freeze({id:'all'})]);
 const CODES=new Set(['image-no-controller','image-update-required','image-cache-unreadable','image-manifest','image-plan-stale','image-cancelled','image-download-timeout','image-download-failed','image-integrity','image-quota','image-cache-write','image-busy','image-access-changed','image-offline','image-source','image-request','image-selection']);
 const fail=code=>Object.assign(new Error(code),{code}),build=()=>String(w.SUKUN_BUILD||w.document?.querySelector?.('meta[name="sukun-build"]')?.content||'');
 const unlocked=()=>{try{return w.SukunSecretPolicy?.unlocked?.()===true}catch(_){return false}};
 let accessEpoch=0,generation=0,active=null,statePrivate=false;
 let state={version:VERSION,packageId:'phone',phase:'idle',busy:false,preview:null,receipt:null,errorCode:'',progress:{done:0,total:0,downloadedBytes:0}};
 const cloneReceipt=value=>value?Object.freeze({...value}):null;
 function snapshot(){
  const privateVisible=unlocked(),sensitive=(statePrivate||state.preview?.includePrivate||state.receipt?.includePrivate)&&!privateVisible;
  return Object.freeze({...state,preview:sensitive?null:cloneReceipt(state.preview),receipt:sensitive?null:cloneReceipt(state.receipt),progress:Object.freeze(sensitive?{done:0,total:0,downloadedBytes:0}:{...state.progress})});
 }
 function set(patch){state={...state,...patch};try{w.dispatchEvent(new CustomEvent(EVENT,{detail:snapshot()}))}catch(_){}}
 const validPackage=id=>id==='phone'||id==='all';
 const controller=()=>w.navigator?.serviceWorker?.controller;
 function worker(){
  const value=controller();let url;
  try{url=new URL(value?.scriptURL,w.location.href)}catch(_){}
  const expected=new URL('./sw.js',w.location.href);
  if(!value||url?.origin!==expected.origin||url.pathname!==expected.pathname)throw fail('image-no-controller');
  return value;
 }
 const id=()=>{if(!w.crypto?.getRandomValues)throw fail('image-update-required');return Array.from(w.crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('')};
 function current(job){return active===job&&generation===job.generation&&accessEpoch===job.accessEpoch&&unlocked()===job.includePrivate&&build()===job.build&&controller()===job.worker&&!job.cancelled}
 function receipt(value,job){
  const numeric=['totalCount','totalBytes','verifiedCount','verifiedBytes','missingCount','missingBytes','corruptCount','unknownCount','unknownBytes'];
  if(value?.packageId!==job.packageId||value.includePrivate!==job.includePrivate||numeric.some(key=>!Number.isSafeInteger(value[key])||value[key]<0)||value.totalCount<1||value.corruptCount>value.missingCount||value.verifiedCount+value.missingCount+value.unknownCount!==value.totalCount||value.verifiedBytes+value.missingBytes+value.unknownBytes!==value.totalBytes||typeof value.ready!=='boolean'||value.planToken!=null&&!/^[a-f0-9]{48}$/.test(value.planToken)||value.errorCode&&!CODES.has(value.errorCode))throw fail('image-cache-unreadable');
  if(value.ready&&(value.missingCount||value.corruptCount||value.unknownCount||value.verifiedCount!==value.totalCount||value.verifiedBytes!==value.totalBytes||value.errorCode))throw fail('image-cache-unreadable');
  const clean={packageId:value.packageId,includePrivate:value.includePrivate,ready:value.ready,errorCode:value.errorCode||'',...(value.planToken?{planToken:value.planToken}:{})};
  for(const key of numeric)clean[key]=value[key];return Object.freeze(clean);
 }
 function cancelMessage(job){
  if(job.cancelPromise)return job.cancelPromise;
  const acknowledgement=new Promise(resolve=>{
   let channel,timer,done=false;
   const finish=acknowledged=>{if(done)return;done=true;clearTimeout(timer);try{channel?.port1.close();channel?.port2.close()}catch(_){}resolve(acknowledged===true)};
   try{channel=new MessageChannel();timer=setTimeout(()=>finish(false),30000);channel.port1.onmessage=event=>{const v=event.data;finish(v?.ok===true&&v.kind==='result'&&v.cancelled===true&&v.protocol===1&&v.build===job.build&&v.requestId===job.requestId)};channel.port1.onmessageerror=()=>finish(false);job.worker.postMessage({type:'IMAGE_PACK_CANCEL',requestId:job.requestId},[channel.port2])}catch(_){finish(false)}
  });
  job.cancelPromise=acknowledgement.then(async acknowledged=>{
   // A timeout, explicit cancel and a privacy change share one drain. An old
   // acknowledgement cannot overwrite a new generation or leave the facade
   // permanently busy after its original operation has already rejected.
   await job.operationDone;
   if(active===job&&generation===(job.invalidatedGeneration??job.generation)){
    active=null;
    set({busy:false,preview:null,...(job.cancelReason==='image-cancelled'?{phase:acknowledged?'cancelled':'error',errorCode:acknowledged?'image-cancelled':'image-cache-unreadable'}:job.invalidatedGeneration?{phase:acknowledged?'idle':'error',errorCode:acknowledged?job.cancelReason:'image-cache-unreadable'}:{})});
   }
   return acknowledged;
  });return job.cancelPromise;
 }
 function ask(job,type,extra={}){
  return new Promise((resolve,reject)=>{
   let channel,timer,done=false;
   const finish=(value,error)=>{if(done)return;done=true;clearTimeout(timer);try{channel?.port1.close();channel?.port2.close()}catch(_){}job.reject=null;error?reject(error):resolve(value)};
   const heartbeat=()=>{clearTimeout(timer);timer=setTimeout(()=>{job.cancelled=true;void cancelMessage(job);finish(null,fail(type==='IMAGE_PACK_DOWNLOAD'?'image-download-timeout':'image-cache-unreadable'))},45000)};
   job.reject=error=>finish(null,error);
   try{
    channel=new MessageChannel();heartbeat();
    channel.port1.onmessage=event=>{
     if(!current(job)){job.cancelled=true;void cancelMessage(job);finish(null,fail('image-access-changed'));return}
     const value=event.data;
     if(!value||value.protocol!==1||value.build!==job.build||value.requestId!==job.requestId){finish(null,fail('image-update-required'));return}
     if(value.kind==='progress'){
      if(value.packageId!==job.packageId||!['checking','downloading'].includes(value.phase)||!Number.isSafeInteger(value.done)||!Number.isSafeInteger(value.total)||!Number.isSafeInteger(value.downloadedBytes)||value.done<0||value.total<value.done||value.downloadedBytes<0){finish(null,fail('image-cache-unreadable'));return}
      let verifiedReceipt;try{if(value.receipt)verifiedReceipt=receipt(value.receipt,job)}catch(error){finish(null,error);return}
      heartbeat();set({phase:value.phase,...(verifiedReceipt?{receipt:verifiedReceipt}:{}),progress:{done:value.done,total:value.total,downloadedBytes:value.downloadedBytes}});return;
     }
     if(value.kind!=='result'){finish(null,fail('image-cache-unreadable'));return}
     if(value.ok!==true){finish(null,fail(CODES.has(value.errorCode)?value.errorCode:'image-cache-unreadable'));return}
     try{finish(receipt(value,job))}catch(error){finish(null,error)}
    };
    channel.port1.onmessageerror=()=>finish(null,fail('image-cache-unreadable'));
    job.worker.postMessage({type,requestId:job.requestId,packageId:job.packageId,includePrivate:job.includePrivate,...extra},[channel.port2]);
   }catch(error){finish(null,CODES.has(error?.code)?error:fail('image-update-required'))}
  });
 }
 async function run(packageId,type,options={}){
  if(!validPackage(packageId))throw fail('image-selection');
  if(active)throw fail('image-busy');
  const includePrivate=unlocked(),before=state.preview;
  if(type==='IMAGE_PACK_DOWNLOAD'&&(!before||before.packageId!==packageId||before.includePrivate!==includePrivate||before.planToken!==options.planToken||!options.planToken||before.unknownCount||before.errorCode)){set({preview:null,errorCode:'image-plan-stale',phase:'error'});throw fail('image-plan-stale')}
  if(type==='IMAGE_PACK_DOWNLOAD'&&w.navigator?.onLine===false){set({errorCode:'image-offline',phase:'error'});throw fail('image-offline')}
  let job;
  try{
   const selectedWorker=worker(),selectedBuild=build();if(!/^r\d+$/.test(selectedBuild))throw fail('image-update-required');
   let resolveOperation;
   job={packageId,worker:selectedWorker,build:selectedBuild,includePrivate,accessEpoch,generation:++generation,requestId:id(),cancelled:false,reject:null,cancelPromise:null,operationDone:new Promise(resolve=>{resolveOperation=resolve}),resolveOperation:()=>resolveOperation()};active=job;statePrivate=includePrivate;
   set({packageId,phase:'checking',busy:true,preview:type==='IMAGE_PACK_STATUS'?null:before,receipt:type==='IMAGE_PACK_STATUS'?null:before,errorCode:'',progress:{done:0,total:0,downloadedBytes:0}});
   const result=await ask(job,type,type==='IMAGE_PACK_DOWNLOAD'?{planToken:options.planToken}:{});
   if(!current(job))throw fail('image-access-changed');
   set({preview:result.errorCode?null:result,receipt:result,errorCode:result.errorCode,phase:result.errorCode?'error':result.ready?'ready':'incomplete'});return result;
  }catch(error){
   const code=CODES.has(error?.code)?error.code:'image-cache-unreadable';
   if(!job||active===job&&generation===job.generation)set({packageId,preview:null,receipt:state.receipt?{...state.receipt,ready:false,stale:true}:null,errorCode:code,phase:state.phase==='cancelling'?'cancelling':code==='image-cancelled'?'cancelled':'error'});
   throw fail(code);
  }finally{if(job){if(active===job&&!(job.cancelled&&job.cancelPromise)){active=null;set({busy:false})}job.resolveOperation()}}
 }
 async function cancel(){
  const job=active;if(!job){set({preview:null,receipt:state.receipt?{...state.receipt,ready:false,stale:true}:null,phase:'cancelled',errorCode:'image-cancelled'});return snapshot()}
  job.cancelReason='image-cancelled';job.cancelled=true;set({phase:'cancelling',preview:null,receipt:state.receipt?{...state.receipt,ready:false,stale:true}:null,errorCode:''});
  const acknowledgement=cancelMessage(job);job.reject?.(fail('image-cancelled'));const acknowledged=await acknowledgement;
  return snapshot();
 }
 function invalidate(code){
  accessEpoch++;generation++;const job=active;
  if(job){job.invalidatedGeneration=generation;job.cancelReason=code;job.cancelled=true;job.reject?.(fail(code));void cancelMessage(job)}
  statePrivate=false;
  set({phase:job?'cancelling':'idle',busy:!!job,preview:null,receipt:null,errorCode:code,progress:{done:0,total:0,downloadedBytes:0}});
 }
 for(const event of ['sukun:secretaccesschange','sukun:secretpolicyready'])w.addEventListener(event,()=>invalidate('image-access-changed'),{passive:true});
 w.navigator?.serviceWorker?.addEventListener?.('controllerchange',()=>invalidate('image-update-required'));
 w.addEventListener('pagehide',()=>invalidate('image-cancelled'),{passive:true});
 w.SukunOfflineScenes=Object.freeze({version:VERSION,packages:()=>PACKAGES,snapshot,inspect:packageId=>run(packageId||'phone','IMAGE_PACK_STATUS'),download:(packageId,options)=>run(packageId||'phone','IMAGE_PACK_DOWNLOAD',options),cancel});
})();
