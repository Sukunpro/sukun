/* Advisory, read-only checks of audio in the current verified worker cache. */
(()=>{
 'use strict';
 if(window.SukunPreflightCacheR1092)return;
 const groups=new WeakMap(),result=(state,reason)=>Object.freeze({state,reason});
 const alive=fn=>{try{return fn()!==false&&!document.hidden}catch(_){return false}};
 const build=()=>String(window.SUKUN_BUILD||document.querySelector('meta[name="sukun-build"]')?.content||'');
 function status(current){
  return new Promise(resolve=>{
   const controller=navigator.serviceWorker?.controller;
   if(!controller||typeof MessageChannel!=='function'){resolve(null);return}
   const channel=new MessageChannel();let done=false,timer;
   const finish=value=>{if(done)return;done=true;clearTimeout(timer);channel.port1.onmessage=null;try{channel.port1.close();channel.port2.close()}catch(_){}resolve(value)};
   timer=setTimeout(()=>finish(null),1800);
   channel.port1.onmessage=event=>{
    const value=event.data,version=build();
    finish(alive(current)&&/^r\d+$/.test(version)&&value?.v===version&&value.complete===true&&typeof value.cache==='string'&&value.cache.startsWith('sukun-'+version+'-')?value:null);
   };
   try{controller.postMessage({type:'STATUS'},[channel.port2])}catch(_){finish(null)}
  });
 }
 async function bounded(promise){
  let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('cache-read-timeout')),5000))])}finally{clearTimeout(timer)}
 }
 async function audioBytes(response,size,current){
  const length=Number(response.headers?.get?.('content-length'));
  if(Number.isFinite(length)&&length>size)throw Error('cache-size');
  if(!response.body?.getReader)throw Error('cache-stream-unavailable');
  const reader=response.body.getReader(),parts=[];let total=0;
  try{
   for(;;){
    if(!alive(current))throw Error('stale');
    const chunk=await bounded(reader.read());if(chunk.done)break;
    total+=chunk.value.byteLength;if(total>size)throw Error('cache-size');parts.push(chunk.value);
   }
   const bytes=new Uint8Array(total);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength}return bytes.buffer;
  }finally{try{await reader.cancel()}catch(_){}try{reader.releaseLock()}catch(_){}}
 }
 async function read(row,current,group){
  if(!alive(current))return result('unavailable','stale');
  let url;try{url=new URL(row.url,location.href)}catch(_){return result('unavailable','invalid-descriptor')}
  if(url.origin!==location.origin||url.username||url.password||url.hash||!Number.isSafeInteger(row.bytes)||row.bytes<1||row.bytes>64*1048576||! /^[a-f0-9]{64}$/i.test(row.sha256||''))return result('unavailable','invalid-descriptor');
  const currentBuild=build(),worker=await group.status;
  if(!alive(current)||currentBuild!==build())return result('unavailable','stale');
  if(!worker||!window.caches?.match||!window.crypto?.subtle)return result('unavailable','cache-unavailable');
  try{
   // CacheStorage.match with cacheName never creates a cache. The exact bytes
   // are verified even if the worker stores a release-pinned query variant.
   const response=await bounded(window.caches.match(url.href,{cacheName:worker.cache,ignoreSearch:true}));
   if(!alive(current)||currentBuild!==build())return result('unavailable','stale');
   if(!response)return result('not-cached','cache-missing');
   if(!response.ok||response.type==='opaque')return result('unavailable','cache-response-invalid');
   const bytes=await audioBytes(response,row.bytes,current);
   if(bytes.byteLength!==row.bytes)return result('not-cached','cache-integrity');
   const digest=await bounded(window.crypto.subtle.digest('SHA-256',bytes));
   if(!alive(current)||currentBuild!==build())return result('unavailable','stale');
   const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
   return hash===row.sha256.toLowerCase()?result('cached','cache-verified'):result('not-cached','cache-integrity');
  }catch(_){return result('unavailable',alive(current)?'cache-read-failed':'stale')}
 }
 async function inspect(row,isCurrent){
  const current=typeof isCurrent==='function'?isCurrent:()=>true;
  let group=groups.get(current);if(!group){group={status:status(current),pending:new Map()};groups.set(current,group)}
  const key=JSON.stringify([build(),row?.url,row?.bytes,row?.sha256]);
  if(!group.pending.has(key))group.pending.set(key,read(row||{},current,group));
  return group.pending.get(key);
 }
 window.SukunPreflightCacheR1092=Object.freeze({version:'r1092',inspect});
})();
