'use strict';
// Execute the complete shipped worker and its real message/deadline helpers.
// Clock delivery, CacheStorage/network and readiness/native-activation are
// explicit controlled seams. This is not a browser activation or lock test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=process.argv[3]?path.resolve(process.argv[3]):null;
const originalPath=process.argv[4]?path.resolve(process.argv[4]):null;
const source=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const baselineCommit='a91afc3ed6424bb81b4882dde825b996d132cf8e';
const baselineWorkerSha256='92b7f6766813f18b04ba5955e07dd22b8311853296ad6a172836cc5a7b4cfb1c';
const baselineHandlerSha256='46e3341074b473f59ace82d220a5f97690685ff95488eb82afa0a9c3ba140983';
const originalHandler=String.raw`  if(d.type==='SKIP_WAITING'){
    event.waitUntil((async()=>{try{
      let ready=await updateDeadline(currentComplete,12000,'Önbellek doğrulama');
      if(!ready){const meta=await prepareShell();ready=!!meta.complete}
      if(!ready)throw Error('release incomplete');
      await updateDeadline(()=>self.skipWaiting(),4000,'Servis aktivasyonu');
      replyUpdate(port,{ok:true,v:SURUM,complete:true});
    }catch(e){replyUpdate(port,{ok:false,v:SURUM,complete:false,error:String(e?.message||e)})}})());return;
  }
`;
function handler(text){const a=text.indexOf("  if(d.type==='SKIP_WAITING'){"),b=text.indexOf("  if(d.type==='SURUM_NOTU')",a);assert(a>=0&&b>a,'exact shipped message boundaries');return text.slice(a,b);}
const candidateHandler=handler(source);
assert.equal(hash(originalHandler),baselineHandlerSha256,'immutable pre-fix handler bytes');
const baselineSource=source.replace(candidateHandler,originalHandler);
let originalComparison=null;
if(originalPath){const original=fs.readFileSync(originalPath,'utf8');assert.equal(hash(original),baselineWorkerSha256,'exact original worker');assert.equal(handler(original),originalHandler);assert.equal(baselineSource,original,'only SKIP_WAITING changed');originalComparison={workerSha256:hash(original),onlyHandlerChanged:true};}
const hostTurn=()=>new Promise(setImmediate);
async function flush(){for(let round=0;round<2;round++){for(let i=0;i<40;i++)await Promise.resolve();await hostTurn();}}
function fixture(options={},workerSource=source){
 let now=0,serial=0,settled=false;const timers=new Map(),listeners=new Map(),calls=[],replies=[],nativeSettlements=[],waits=[];
 const base='https://sukun.test/sw.js',stores=new Map();
 const cacheStore=name=>{if(!stores.has(name))stores.set(name,new Map());return stores.get(name);};
 const requestKey=input=>new URL(typeof input==='string'?input:input.url,base).href;
 const c={console,URL,Promise,Math,Number,String,Object,Set,Map,Array,Uint8Array,TextEncoder,Response,Headers,AbortController,DOMException,crypto:crypto.webcrypto,btoa,
  Request:class extends Request{constructor(input,init){super(typeof input==='string'?new URL(input,base):input,init);}},
  Date:{now:()=>now},
  setTimeout(fn,ms=0){const id=++serial;timers.set(id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),
  fetch:async()=>new Response('Synthetic unavailable release',{status:404}),
  caches:{async open(name){const store=cacheStore(name);return{async match(input){return store.get(requestKey(input))?.clone();},async put(input,response){store.set(requestKey(input),response.clone());}};}},
  self:{location:new URL(base),clients:{matchAll:async()=>[]},addEventListener(type,fn){listeners.set(type,fn);}}
 };
 function phase(name,spec={},fallback){
  calls.push({name,at:now});
  if(spec.jump)now+=spec.jump;
  if(spec.throw)throw Error(spec.throw);
  const finish=()=>{if(spec.error)throw Error(spec.error);if(name==='activation')nativeSettlements.push({at:now});return Object.hasOwn(spec,'value')?spec.value:fallback;};
  if(spec.delay===Infinity)return new Promise(()=>{});
  if(!spec.delay)return Promise.resolve().then(finish);
  return new Promise((resolve,reject)=>c.setTimeout(()=>{try{resolve(finish());}catch(e){reject(e);}},spec.delay));
 }
 c.readinessSeam=()=>phase('readiness',options.readiness,true);
 c.preparationSeam=()=>phase('preparation',options.preparation,{complete:true});
 c.self.skipWaiting=()=>phase('activation',options.activation,undefined);
 vm.createContext(c);vm.runInContext(workerSource,c,{filename:'shipped-sw.js'});
 if(!options.realReadiness)vm.runInContext('currentComplete=readinessSeam;',c);
 if(!options.realPreparation)vm.runInContext('prepareShell=preparationSeam;',c);
 function send(){listeners.get('message')({data:{type:'SKIP_WAITING'},ports:[{postMessage(value){replies.push({at:now,...JSON.parse(JSON.stringify(value))});}}],waitUntil(work){waits.push(work);work.then(()=>settled=true);}});assert.equal(waits.length,1,'one extended message lifetime');}
 async function advance(ms){await flush();const until=now+ms;let steps=0;for(;;){const next=[...timers].filter(([,v])=>v.at<=until).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;assert(++steps<10000,'bounded timer drain');timers.delete(next[0]);now=Math.max(now,next[1].at);next[1].fn();await flush();}now=Math.max(now,until);await flush();}
 return{send,advance,flush,calls,replies,nativeSettlements,timers,waits,get now(){return now;},get settled(){return settled;},jump:ms=>now+=ms};
}
const activationCalls=f=>f.calls.filter(x=>x.name==='activation');
function singleReply(f,ok,at){assert.equal(f.replies.length,1,'exactly one reply');assert.equal(f.replies[0].ok,ok);assert.equal(f.replies[0].complete,ok);assert.equal(f.replies[0].v,'r1125');if(at!==undefined)assert.equal(f.replies[0].at,at);assert.equal(f.settled,true,'message lifetime settled');}
const results=[];async function test(name,fn){try{const evidence=await fn();results.push({name,passed:true,...evidence&&{evidence}});}catch(e){results.push({name,passed:false,error:e.stack||String(e)});}}
(async()=>{
 await test('5.2-second native activation waits, then succeeds without an early reply',async()=>{const f=fixture({activation:{delay:5200}});f.send();await f.advance(5199);assert.equal(f.replies.length,0);assert.equal(f.settled,false);await f.advance(1);singleReply(f,true,5200);assert.equal(activationCalls(f).length,1);assert.equal(f.nativeSettlements[0].at,5200);assert.equal(f.timers.size,0);return{reply:f.replies[0]};});
 await test('11-second readiness plus 5.2-second activation fits one 17-second budget',async()=>{const f=fixture({readiness:{delay:11000},activation:{delay:5200}});f.send();await f.advance(16199);assert.equal(f.replies.length,0);await f.advance(1);singleReply(f,true,16200);assert.equal(activationCalls(f)[0].at,11000);return{reply:f.replies[0]};});
 await test('Never-settling activation fails exactly once at its 12-second phase cap',async()=>{const f=fixture({activation:{delay:Infinity}});f.send();await f.advance(11999);assert.equal(f.replies.length,0);await f.advance(1);singleReply(f,false,12000);assert.match(f.replies[0].error,/Servis aktivasyonu: zaman aşımı/);await f.advance(60000);singleReply(f,false,12000);assert.equal(activationCalls(f).length,1);assert.equal(f.timers.size,0);return{reply:f.replies[0]};});
 await test('Late native activation after the total deadline cannot send a success reply',async()=>{const f=fixture({readiness:{delay:11000},activation:{delay:6500}});f.send();await f.advance(16999);assert.equal(f.replies.length,0);await f.advance(1);singleReply(f,false,17000);await f.advance(500);assert.equal(f.nativeSettlements[0].at,17500,'native operation remains non-cancellable');singleReply(f,false,17000);assert.equal(f.timers.size,0);return{reply:f.replies[0],nativeSettlement:f.nativeSettlements[0]};});
 await test('Never-settling readiness fails at 12 seconds without preparation or activation',async()=>{const f=fixture({readiness:{delay:Infinity}});f.send();await f.advance(12000);singleReply(f,false,12000);assert.match(f.replies[0].error,/Önbellek doğrulama: zaman aşımı/);assert.deepEqual(f.calls.map(x=>x.name),['readiness']);await f.advance(60000);singleReply(f,false,12000);});
 await test('Readiness and repair exhaust the total budget before activation can start',async()=>{const f=fixture({readiness:{delay:11000,value:false},preparation:{delay:7000}});f.send();await f.advance(16999);assert.equal(f.replies.length,0);await f.advance(1);singleReply(f,false,17000);assert.match(f.replies[0].error,/Dosya doğrulama: zaman aşımı/);assert.equal(activationCalls(f).length,0);await f.advance(10000);singleReply(f,false,17000);assert.equal(activationCalls(f).length,0,'late valid repair never activates');return{reply:f.replies[0],activationCalls:0};});
 await test('Never-settling repair is bounded by remaining total time, not its old 60-second cap',async()=>{const f=fixture({readiness:{delay:1000,value:false},preparation:{delay:Infinity}});f.send();await f.advance(17000);singleReply(f,false,17000);assert.equal(activationCalls(f).length,0);assert.equal(f.timers.size,0);});
 await test('Repair shares the total budget and can succeed only after native activation settles',async()=>{const f=fixture({readiness:{delay:1000,value:false},preparation:{delay:14000},activation:{delay:1900}});f.send();await f.advance(16899);assert.equal(f.replies.length,0);await f.advance(1);singleReply(f,true,16900);assert.equal(activationCalls(f)[0].at,15000);return{reply:f.replies[0]};});
 await test('Incomplete repaired cache is rejected without activation',async()=>{const f=fixture({readiness:{value:false},preparation:{value:{complete:false}}});f.send();await f.flush();singleReply(f,false,0);assert.equal(f.replies[0].error,'release incomplete');assert.equal(activationCalls(f).length,0);});
 await test('Actual empty CacheStorage and failed fetches remain incomplete with real verification and preparation',async()=>{const f=fixture({realReadiness:true,realPreparation:true});f.send();for(let i=0;i<30&&!f.settled;i++)await f.flush();singleReply(f,false,0);assert.equal(f.replies[0].error,'release incomplete');assert.equal(activationCalls(f).length,0);assert.equal(f.timers.size,0);});
 await test('A clock jump that consumes readiness budget fails before invoking native activation',async()=>{const f=fixture({readiness:{jump:17000}});f.send();await f.flush();singleReply(f,false,17000);assert.equal(activationCalls(f).length,0);});
 await test('Completion delivered after a clock jump beyond the deadline cannot claim success',async()=>{const f=fixture({activation:{jump:17001}});f.send();await f.flush();singleReply(f,false,17001);assert.equal(activationCalls(f).length,1);assert.equal(f.nativeSettlements.length,1);});
 for(const stage of ['readiness','preparation','activation'])for(const kind of ['throw','error'])await test(stage+' '+(kind==='throw'?'synchronous exception':'promise rejection')+' returns one failure',async()=>{const settings=stage==='preparation'?{readiness:{value:false}}:{};settings[stage]={[kind]:stage+' test failure'};const f=fixture(settings);f.send();await f.flush();singleReply(f,false,0);assert.equal(f.replies[0].error,stage+' test failure');assert.equal(activationCalls(f).length,stage==='activation'?1:0);await f.advance(60000);singleReply(f,false,0);assert.equal(f.timers.size,0);});
 await test('Immutable pre-fix negative control reproduces false timeout for 5.2-second activation',async()=>{const f=fixture({activation:{delay:5200}},baselineSource);f.send();await f.advance(4000);singleReply(f,false,4000);assert.match(f.replies[0].error,/Servis aktivasyonu: zaman aşımı/);await f.advance(1200);assert.equal(f.nativeSettlements[0].at,5200);singleReply(f,false,4000);return{role:'negative control, not a candidate pass',reply:f.replies[0],nativeSettlement:f.nativeSettlements[0],handlerSha256:baselineHandlerSha256};});
 const candidateResults=results.filter(x=>!x.name.startsWith('Immutable pre-fix'));
 const negativeControls=results.filter(x=>x.name.startsWith('Immutable pre-fix'));
 const report={build:'r1125',method:'Complete shipped sw.js evaluated in Node VM. Unmodified message handler, updateDeadline and replyUpdate. Controlled virtual Date/timer delivery and explicit readiness, repair and native skipWaiting promises; one empty-cache case uses actual currentComplete and prepareShell with synthetic CacheStorage and 404 Fetch. No browser, OS-lock, physical-device or native activation timing claim.',sourceFiles:{'sw.js':hash(source)},sourceSha256:hash(source),handlerSha256:hash(candidateHandler),scriptSha256:hash(fs.readFileSync(__filename)),totalBudgetMs:17000,readinessCapMs:12000,activationCapMs:12000,baseline:{commit:baselineCommit,workerSha256:baselineWorkerSha256,handlerSha256:baselineHandlerSha256,method:'Exact pre-fix handler bytes substituted into the current complete worker; unchanged helper and validation code.',...originalComparison&&{originalComparison}},passed:candidateResults.filter(x=>x.passed).length,total:candidateResults.length,results:candidateResults,negativeControls,negativeControlsPassed:negativeControls.every(x=>x.passed),limitations:['Native skipWaiting cannot be cancelled once called. Late native completion beyond the total deadline is reported as failure, never a late success.','Node virtual-clock contracts do not replace the source-bound real Chromium upgrade/offline/rollback gate.']};
 if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify(report,null,2));if(report.passed!==report.total||!report.negativeControlsPassed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
