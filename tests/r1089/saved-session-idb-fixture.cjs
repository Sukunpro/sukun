'use strict';
// Controlled IDB scheduling with atomic record storage. The real production
// canonical transaction and localStorage mirror code execute unchanged.
const assert=require('node:assert/strict');
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
function guardOrigin({blocked=false,unavailable=false}={}){
 const queued=[],databases=new Set(),history=[],records=new Map();let active=null,held=blocked,serial=0,maxActive=0,putFailure=false,commitFailure=false;
 function pump(){if(held||active||!queued.length)return;const tx=queued.shift();active=tx;tx.working=new Map([...records].map(([k,v])=>[k,clone(v)]));maxActive=Math.max(maxActive,1);history.push({type:'start',id:tx.id});queueMicrotask(()=>run(tx));}
 function run(tx){if(tx.aborted)return finish(tx,false);const request=tx.requests.shift();if(!request)return queueMicrotask(()=>finish(tx,!tx.aborted));
  if(request.kind==='put'&&putFailure){putFailure=false;request.error=Error('Controlled IDB put failure');request.onerror?.();tx.aborted=true;return finish(tx,false);}
  if(request.kind==='get')request.result=clone(tx.working.get(request.key));else{tx.working.set(request.key,clone(request.value));request.result=request.key;}
  request.onsuccess?.();queueMicrotask(()=>run(tx));
 }
 function finish(tx,ok){if(tx.done)return;if(ok&&commitFailure){commitFailure=false;ok=false;}tx.done=true;if(ok){records.clear();for(const[k,v]of tx.working)records.set(k,clone(v));}if(active===tx)active=null;history.push({type:ok?'complete':'abort',id:tx.id});if(ok)tx.oncomplete?.();else tx.onabort?.();pump();}
 const indexedDB={open(name,version){const rq={};queueMicrotask(()=>{if(unavailable){rq.error=Object.assign(Error('Unavailable'),{name:'SecurityError'});rq.onerror?.();return;}
  const stores=new Set(),db={closed:false,objectStoreNames:{contains:n=>stores.has(n)},createObjectStore(n){stores.add(n);return{}},close(){this.closed=true},transaction(store,mode){
   if(this.closed)throw Object.assign(Error('Closed connection'),{name:'InvalidStateError'});assert.equal(store,'guard');assert.equal(mode,'readwrite');
   const tx={id:++serial,requests:[],aborted:false,done:false,objectStore(n){assert.equal(n,'guard');return{get(key){assert.equal(key,'state');const r={kind:'get',key};tx.requests.push(r);return r},put(value,key){assert.equal(key,'state');const r={kind:'put',key,value:clone(value)};tx.requests.push(r);return r}}},abort(){if(this.done)throw Object.assign(Error('Finished'),{name:'InvalidStateError'});this.aborted=true;if(active!==this){const i=queued.indexOf(this);if(i>=0)queued.splice(i,1);queueMicrotask(()=>finish(this,false));}}};queued.push(tx);queueMicrotask(pump);return tx;
  }};databases.add(db);rq.result=db;rq.onupgradeneeded?.();rq.onsuccess?.();});return rq;}};
 return{indexedDB,history,databases,records,hold(){held=true},release(){held=false;pump()},failNextPut(){putFailure=true},abortNextCommit(){commitFailure=true},get pending(){return queued.length+(active?1:0)},get maxActive(){return maxActive}};
}
module.exports={guardOrigin};
