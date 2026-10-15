'use strict';
// Actual tab-owner module; controlled Web Lock completion, IndexedDB and clock.
// No audio or device behavior is simulated as evidence of physical playback.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=path.join(root,'assets/runtime/tab-owner-r981.js'),code=fs.readFileSync(source,'utf8');
const results=[],flush=async()=>{for(let i=0;i<45;i++)await Promise.resolve();};
function fixture({actualSession=false}={}){
 const calls=[],ownerEvents=[],timers=new Map(),listeners=new Map(),storage=new Map();let clock=0,next=0,identity='berhet:0:',record=null,physicalHeld=false,remoteHeld=false,pendingPhysical=null,primeCount=0,channel=null,nativeStarts=0,finishNative=null;
 const document={readyState:'complete',body:null,documentElement:{lang:'en'},getElementById:()=>null,querySelector:()=>null,addEventListener(){}};
 const db={objectStoreNames:{contains:()=>true},close(){},transaction(){
  const tx={objectStore(){return {get(){const r={};queueMicrotask(()=>{r.result=record;r.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.());});return r;},put(value){record=value;},delete(){record=null;}};},abort(){tx.onabort?.();}};return tx;
 }};
 const c={console,Promise,Map,Set,Object,Array,Number,String,Math,queueMicrotask,document,URLSearchParams,location:{search:''},
  crypto:{randomUUID:()=> 'this-tab'},Date:class extends Date{static now(){return clock;}},
  BroadcastChannel:class{constructor(){channel=this;}postMessage(){}},
  setTimeout(fn,ms=0){const id=++next;timers.set(id,{fn,at:clock+ms});return id;},clearTimeout:id=>timers.delete(id),
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  indexedDB:{open(){const r={};queueMicrotask(()=>{r.result=db;r.onsuccess?.();});return r;}},
  navigator:{locks:{request(name,options,callback){calls.push('lock.request');assert.equal(options.ifAvailable,true);if(remoteHeld||physicalHeld)return Promise.resolve().then(()=>callback(null));physicalHeld=true;return new Promise((resolve,reject)=>{Promise.resolve().then(()=>callback({name})).then(()=>{pendingPhysical=()=>{physicalHeld=false;pendingPhysical=null;resolve();};},reject);});}}},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
  dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);},
  SukunSessionState:{snapshot:()=>({epoch:0}),command(action){calls.push('command.'+action);return Promise.resolve({accepted:true});}},
 };
 c.window=c;vm.createContext(c);
 if(actualSession){
  delete c.SukunSessionState;c.ZIKIR={esma:{items:[{t:'Rahman'}]}};
  c.currentZikirState={snapshot:()=>({cat:'esma',idx:0,count:0,target:33})};
  c.SukunR698Transport={snapshot:()=>({}),presentation:()=>({}),resumeDhikr(){nativeStarts++;return new Promise(resolve=>{finishNative=resolve;});}};
  const sessionSource=path.join(root,'assets/runtime/session-r919.js');vm.runInContext(fs.readFileSync(sessionSource,'utf8'),c,{filename:sessionSource});
 }
 vm.runInContext(code,c,{filename:source});
 const api=c.SukunTabOwner;
 c.addEventListener('sukun:tabownerchange',event=>ownerEvents.push(event.detail));
 api.bind({identity:()=>identity,prime:()=>{primeCount++;calls.push('prime');},rebase:()=>true,busy:()=>false,paused:()=>false,finish(){calls.push('finish');}});
 async function advance(ms){clock+=ms;for(let i=0;i<20;i++){const ready=[...timers].filter(([,t])=>t.at<=clock);if(!ready.length)break;for(const [id,t]of ready){timers.delete(id);t.fn();}await flush();}}
 async function closing(){assert.equal(await api.run('first',()=>true),true);assert.equal(api.owns(),true);api.release();await advance(60);assert.equal(api.snapshot().releasing,true);assert.equal(api.owns(),false);assert.equal(typeof pendingPhysical,'function');}
 return {c,api,calls,ownerEvents,advance,closing,get primes(){return primeCount;},get pendingTimers(){return timers.size;},get nativeStarts(){return nativeStarts;},finishNative:()=>finishNative(true),releasePhysical(){assert.equal(typeof pendingPhysical,'function');pendingPhysical();},set identity(value){identity=value;},set remote(value){remoteHeld=value;},revoke:()=>channel.onmessage({data:{v:1,type:'revoked',id:'this-tab',method:'web-locks'}})};
}
async function test(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',error:error.stack});}}
(async()=>{
 await test('Explicit Start waits for this tab physical release and primes inside the gesture',async()=>{const h=fixture();await h.closing();let starts=0;const primes=h.primes,requests=h.calls.filter(x=>x==='lock.request').length;const start=h.api.run('start',()=>{starts++;return true;});assert.equal(h.primes,primes+1,'prime before first await');await flush();assert.equal(starts,0);assert.equal(h.calls.filter(x=>x==='lock.request').length,requests,'no claim before old physical completion');h.releasePhysical();assert.equal(await start,true);assert.equal(starts,1);assert.equal(h.api.owns(),true);assert.equal(h.primes,primes+1,'one prime for the queued gesture');});
 await test('Wrapped session Start uses the same own-release barrier',async()=>{const h=fixture();await h.closing();const start=h.c.SukunSessionState.command('start');await flush();assert(!h.calls.includes('command.start'));h.releasePhysical();assert.equal((await start).accepted,true);assert.equal(h.calls.filter(x=>x==='command.start').length,1);});
 await test('Queued Start stays observably pending across physical-release emit and reacquisition',async()=>{const h=fixture();await h.closing();h.ownerEvents.length=0;const start=h.api.run('start',()=>{assert.equal(h.api.snapshot().pending,true,'still pending on provider entry');return true;});assert.equal(h.api.snapshot().pending,true);h.releasePhysical();assert.equal(await start,true);assert(h.ownerEvents.some(s=>!s.releasing&&!s.owned&&s.pending),'closing completion emit remains busy');assert(!h.ownerEvents.some(s=>!s.releasing&&!s.owned&&!s.pending),'no unowned idle gap before acquire');assert.equal(h.api.snapshot().pending,false,'settled action removes waiter');});
 await test('Actual r919 pending Start deduplicates repeated explicit Starts after local release',async()=>{const h=fixture({actualSession:true});await h.closing();const a=h.c.SukunSessionState.command('start'),b=h.c.SukunSessionState.command('start');assert.equal(h.nativeStarts,0);h.releasePhysical();await flush();assert.equal(h.nativeStarts,1);h.finishNative();const [x,y]=await Promise.all([a,b]);assert.equal(x.accepted,true);assert.equal(y.accepted,true);assert.equal(x.requestId,y.requestId);});
 for(const action of ['pause','stop'])await test('Actual r919 '+action+' cancels queued Start across local release',async()=>{const h=fixture({actualSession:true});await h.closing();const start=h.c.SukunSessionState.command('start');await h.c.SukunSessionState.command(action);h.releasePhysical();assert.equal((await start).accepted,false);assert.equal(h.nativeStarts,0);});
 for(const action of ['pause','stop','select','next','previous','restart'])await test(action+' supersedes queued Start before own release',async()=>{const h=fixture();await h.closing();let starts=0;const start=h.api.run('start',()=>{starts++;return true;});assert.equal(h.api.snapshot().pending,true);const superseding=h.c.SukunSessionState.command(action);if(action!=='restart')assert.equal(h.api.snapshot().pending,false,'cancellation clears pending indication immediately');h.releasePhysical();assert.equal(await start,false);await superseding;assert.equal(starts,0);});
 await test('Identity change without command rejects the queued old selection',async()=>{const h=fixture();await h.closing();let starts=0;const start=h.api.run('start',()=>{starts++;return true;});h.identity='esma:4:';h.releasePhysical();assert.equal(await start,false);assert.equal(starts,0);});
 await test('Caller isCurrent cancellation rejects queued Start',async()=>{const h=fixture();await h.closing();let current=true,starts=0;const start=h.api.run('start',()=>{starts++;return true;},{isCurrent:()=>current});current=false;h.releasePhysical();assert.equal(await start,false);assert.equal(starts,0);});
 await test('A remote owner winning after local release remains excluded without waiting',async()=>{const h=fixture();await h.closing();let starts=0;const start=h.api.run('start',()=>{starts++;return true;});h.remote=true;h.releasePhysical();assert.equal(await start,false);assert.equal(starts,0);assert.equal(h.api.owns(),false);assert.equal(h.api.snapshot().blocked,true);});
 await test('Own-release wait expires at OWNER_WAIT_MS and never replays later',async()=>{const h=fixture();await h.closing();let starts=0;const start=h.api.run('start',()=>{starts++;return true;});await h.advance(9999);assert.equal(starts,0);assert.equal(h.api.snapshot().pending,true);await h.advance(1);assert.equal(await start,false);assert.equal(h.api.snapshot().pending,false);assert.equal(h.api.snapshot().reason,'unavailable');h.releasePhysical();await flush();assert.equal(starts,0);assert.equal(h.api.owns(),false);});
 await test('Revocation without this tab closingPromise rejects immediately',async()=>{const h=fixture();assert.equal(await h.api.run('first',()=>true),true);h.revoke();assert.equal(h.api.snapshot().releasing,true);let starts=0;const primes=h.primes;assert.equal(await h.api.run('start',()=>{starts++;return true;}),false);assert.equal(starts,0);assert.equal(h.primes,primes,'revocation does not prime or queue a delayed Start');});
 const failures=results.filter(x=>x.status==='FAIL');console.log(JSON.stringify({ok:!failures.length,source,sourceHash:crypto.createHash('sha256').update(code).digest('hex'),tests:results.length,passed:results.length-failures.length,failed:failures.length,results,scope:'Production TabOwner own physical-release barrier, explicit gesture prime, cancellation, identity fencing, remote lock exclusion and bounded timeout. Web Locks/IndexedDB/clock are controlled seams; no physical Android claim.'},null,2));if(failures.length)process.exitCode=1;
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
