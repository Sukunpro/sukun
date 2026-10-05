/* Controlled IndexedDB lifecycle regression harness. Synthetic bytes only.
   Production REC_DB/catalog/lookup code is extracted unchanged from the app.
   This models event/transaction failures; it is not physical-browser QA. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=process.argv[2]||['../index.html','../app/index.html','../../index.html'].map(p=>require('node:path').resolve(__dirname,p)).find(p=>fs.existsSync(p));
assert(path,'Pass the production index.html path as the first argument');
const html=fs.readFileSync(path,'utf8');
const chunk=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
const production=chunk('const REC_DB=(function(){','/* r976: short feedback samples');
const catalog=chunk('const SK_RECORDING_CATALOG=','function skRecordingCatalogNotice()');
const priority=html.match(/<script id="r636-recording-priority-lock">([\s\S]*?)<\/script>/)[1];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function fixture(){
 const disk=new Map(),connections=[],heldOpens=[],faults={open:null,transaction:null,request:null,abort:false,scanLag:0};let opens=0,now=0;
 const failure=name=>Object.assign(new Error(name),{name});
 const indexedDB={open(name,version){opens++;const req={};const complete=()=>{
  if(faults.open==='hang')return;
  if(faults.open==='error'){req.error=failure('UnknownError');req.onerror?.();return}
  const conn={closed:false,closeCalls:0,objectStoreNames:{contains:()=>true},
   close(){this.closed=true;this.closeCalls++},
   unexpectedClose(){this.close();this.onclose?.({target:this})},
   versionChange(){this.onversionchange?.({target:this})},
   transaction(store,mode){if(this.closed)throw failure('InvalidStateError');if(faults.transaction)throw failure(faults.transaction);
    const tx={error:null,pending:0,completed:false,aborted:false,operations:[],abort(){if(this.completed)throw failure('InvalidStateError');this.aborted=true;this.error=failure('AbortError');setImmediate(()=>this.onabort?.());}};
    const complete=()=>setImmediate(()=>{if(tx.aborted||tx.completed||tx.pending)return;if(faults.abort){tx.abort();return;}for(const op of tx.operations)op();tx.completed=true;tx.oncomplete?.()});
    const request=(result,op)=>{tx.pending++;const r={};setTimeout(()=>{if(tx.aborted)return;
     if(faults.request){r.error=failure(faults.request);r.onerror?.();tx.error=r.error;tx.onerror?.();return}
     r.result=result();if(op)tx.operations.push(op);r.onsuccess?.({target:r});tx.pending--;complete();
    },faults.scanLag);return r};
    tx.objectStore=()=>({get:key=>request(()=>disk.get(key)),getKey:key=>request(()=>disk.has(key)?key:undefined),getAllKeys:()=>request(()=>[...disk.keys()]),
     put:(value,key)=>request(()=>key,()=>disk.set(key,value)),add:(value,key)=>request(()=>key,()=>{if(disk.has(key))throw failure('ConstraintError');disk.set(key,value)}),delete:key=>request(()=>undefined,()=>disk.delete(key)),
     openCursor:()=>{const entries=[...disk.entries()];let i=0;const r={};tx.pending++;const run=()=>setTimeout(()=>{if(tx.aborted)return;if(faults.abort){tx.abort();return;}const entry=entries[i++];r.result=entry?{key:entry[0],value:entry[1],continue:run}:null;r.onsuccess?.({target:r});if(!entry){tx.pending--;complete()}},faults.scanLag);run();return r}
    });complete();return tx;
   }};connections.push(conn);req.result=conn;req.onsuccess?.({target:req});
 };if(faults.open==='hold')heldOpens.push(complete);else setImmediate(complete);return req;}};
 const listeners=new Map();
 const context={Blob,console,Map,Set,Date,Promise,Number,String,Object,Array,Error,AbortController,CustomEvent:class{constructor(type,opt){this.type=type;this.detail=opt?.detail}},indexedDB,
  setTimeout:(fn,ms,...a)=>setTimeout(fn,Math.min(ms,ms>=10000?50:ms),...a),clearTimeout,setInterval,clearInterval,
  addEventListener:(n,fn)=>{const l=listeners.get(n)||new Set();l.add(fn);listeners.set(n,l)},removeEventListener:(n,fn)=>listeners.get(n)?.delete(fn),dispatchEvent:e=>{for(const fn of listeners.get(e.type)||[])fn(e)},
  document:{},speechSynthesis:null,I18N:{lang:'en'}};
 context.window=context;vm.createContext(context);
 vm.runInContext(`let RECKEYS=new Set();const Z={cat:'esma',idx:7,form:'nida'};const zKat=()=>Z.cat,zIdx=()=>Z.idx,zikirKey=()=>Z.cat+':'+Z.idx+':'+Z.form;const skVoiceRestoreKey=key=>typeof key==='string'&&key.length>0;const skBackupError=(tr,en)=>new Error(en);`+production+catalog+priority+`;window.test={db:REC_DB,catalog:skRecordingCatalogRead,priority:SukunRecordingPriorityLock,keys:()=>[...RECKEYS],clearKeys:()=>RECKEYS.clear(),setKeys:keys=>RECKEYS=new Set(keys)};`,context);
 return {disk,connections,heldOpens,faults,context,test:context.test,opens:()=>opens,blob:new Blob([new Uint8Array([1,2,3,4])],{type:'audio/wav'})};
}
async function bounded(p,ms=300){return Promise.race([p.then(value=>({value}),e=>({error:e.name||e.message})),delay(ms).then(()=>({timeout:true}))])}
const results=[];async function test(name,fn){try{const details=await fn();results.push({name,passed:true,details})}catch(e){results.push({name,passed:false,error:String(e.message||e)})}}
(async()=>{
 await test('Cold concurrent reads use one connection',async()=>{const f=fixture();await Promise.all([f.test.db.keys(),f.test.db.keys(),f.test.db.keys()]);assert.equal(f.opens(),1);return {opens:f.opens()}});
 await test('Unexpected connection closure recovers clips without import',async()=>{const f=fixture();await f.test.db.set('esma:7:tev',f.blob);f.connections[0].unexpectedClose();const r=await f.test.db.get('esma:7:tev');assert.equal(r.size,4);assert.equal(f.disk.size,1);assert.equal(f.opens(),2);return {bytes:r.size,opens:f.opens()}});
 await test('Each versionchange closes its own connection without throwing',async()=>{const f=fixture();await Promise.all([f.test.db.keys(),f.test.db.keys()]);for(const c of f.connections)c.versionChange();assert(f.connections.every(c=>c.closed));const k=await f.test.db.keys();return {oldConnectionsClosed:true,keys:k.length}});
 await test('Aborted catalog transaction rejects promptly',async()=>{const f=fixture();await f.test.db.keys();f.faults.abort=true;const r=await bounded(f.test.db.keys());assert(r.error);return r});
 await test('Aborted size scan rejects promptly',async()=>{const f=fixture();await f.test.db.set('esma:7:tev',f.blob);f.faults.abort=true;const r=await bounded(f.test.db.hepsi());assert(r.error);return r});
 await test('Hung opening times out and a later read reconnects',async()=>{const f=fixture();f.faults.open='hang';const first=await bounded(f.test.db.keys());assert(first.error);f.faults.open=null;const next=await bounded(f.test.db.keys());assert(!next.timeout&&!next.error);return {first,next}});
 await test('Empty in-memory catalog still locates alternate saved form',async()=>{const f=fixture();f.disk.set('esma:7:tev',f.blob);const r=await f.test.priority.find('esma',7,{tr:'Synthetic'});assert.equal(r.key,'esma:7:tev');return {key:r.key}});
 await test('Legacy form-less key found without another name collision',async()=>{const f=fixture();f.disk.set('esma:7',f.blob);f.disk.set('esma:8:nida',f.blob);const r=await f.test.priority.find('esma',7,{tr:'Synthetic'});assert.equal(r.key,'esma:7');return {key:r.key}});
 await test('Lookup storage errors do not masquerade as missing recording',async()=>{const f=fixture();f.faults.open='error';const r=await bounded(f.test.priority.find('esma',7,{tr:'Synthetic'}));assert(r.error);return r});
 await test('Failed catalog keeps last verified keys',async()=>{const f=fixture();f.disk.set('esma:7:tev',f.blob);assert((await f.test.catalog()).ok);f.faults.transaction='UnknownError';const r=await f.test.catalog();assert.equal(r.ok,false);assert.equal(r.keys[0],'esma:7:tev');assert.equal(f.disk.size,1);return {ok:r.ok,keys:r.keys}});
 await test('Read and catalog paths leave storage bytes unchanged',async()=>{const f=fixture();f.disk.set('esma:7:tev',f.blob);await f.test.catalog();await f.test.db.hepsi();await f.test.priority.find('esma',7,{});assert.equal(await f.disk.get('esma:7:tev').text(),await f.blob.text());return {count:f.disk.size}});
 await test('Closed cached handle without close event reconnects before read submission',async()=>{const f=fixture();await f.test.db.set('esma:7:tev',f.blob);f.connections[0].close();const r=await f.test.db.get('esma:7:tev');assert.equal(r.size,4);assert.equal(f.opens(),2);return {opens:f.opens(),bytes:r.size}});
 await test('Repeated invalid state performs at most one read reconnect',async()=>{const f=fixture();await f.test.db.keys();f.faults.transaction='InvalidStateError';const r=await bounded(f.test.db.get('esma:7:tev'));assert.equal(r.error,'InvalidStateError');assert.equal(f.opens(),2);return {opens:f.opens(),error:r.error}});
 await test('Security denial is reported without reconnect or mutation',async()=>{const f=fixture();await f.test.db.set('esma:7:tev',f.blob);f.faults.transaction='SecurityError';const r=await bounded(f.test.db.get('esma:7:tev'));assert.equal(r.error,'SecurityError');assert.equal(f.opens(),1);assert.equal(f.disk.size,1);return {opens:f.opens(),error:r.error}});
 await test('Submitted aborted read is not automatically replayed',async()=>{const f=fixture();await f.test.db.set('esma:7:tev',f.blob);f.faults.abort=true;const r=await bounded(f.test.db.get('esma:7:tev'));assert.equal(r.error,'AbortError');assert.equal(f.opens(),1);return r});
 await test('Old handle close and versionchange cannot retire its replacement',async()=>{const f=fixture();await f.test.db.keys();const old=f.connections[0];old.unexpectedClose();await f.test.db.keys();const current=f.connections[1];old.onclose?.();old.versionChange();assert.equal(current.closed,false);await f.test.db.keys();assert.equal(f.opens(),2);return {opens:f.opens(),replacementOpen:!current.closed}});
 await test('Opening failure is retryable without discarding recordings',async()=>{const f=fixture();f.disk.set('esma:7:tev',f.blob);f.faults.open='error';assert.equal((await bounded(f.test.db.keys())).error,'UnknownError');f.faults.open=null;assert.equal((await f.test.db.get('esma:7:tev')).size,4);return {opens:f.opens(),count:f.disk.size}});
 await test('Late timed-out opening closes itself and cannot replace fresh handle',async()=>{const f=fixture();f.disk.set('esma:7:tev',f.blob);f.faults.open='hold';const first=await bounded(f.test.db.keys());assert.equal(first.error,'RecordingOpenTimeout');f.faults.open=null;await f.test.db.keys();const current=f.connections[0];f.heldOpens[0]();const stale=f.connections[1];assert.equal(stale.closed,true);assert.equal(current.closed,false);assert.equal((await f.test.db.get('esma:7:tev')).size,4);assert.equal(f.opens(),2);return {opens:f.opens(),lateHandleClosed:stale.closed}});
 await test('Already aborted read neither opens storage nor mutates it',async()=>{const f=fixture(),signal=new AbortController();signal.abort();const r=await bounded(f.test.db.get('esma:7:tev',{signal:signal.signal}));assert.equal(r.error,'AbortError');assert.equal(f.opens(),0);return r});
 await test('Cancelled pending read cannot resume on late open',async()=>{const f=fixture(),signal=new AbortController();f.faults.open='hold';const p=f.test.db.get('esma:7:tev',{signal:signal.signal});signal.abort();assert.equal((await bounded(p)).error,'AbortError');f.faults.open=null;f.heldOpens[0]();await delay(2);assert.equal(f.disk.size,0);return {opens:f.opens(),count:f.disk.size}});
 await test('Write InvalidStateError is not replayed and prior clip is kept',async()=>{const f=fixture();await f.test.db.set('esma:7:tev',f.blob);f.connections[0].close();const r=await bounded(f.test.db.set('esma:7:tev',new Blob(['replacement'],{type:'audio/wav'})));assert.equal(r.error,'InvalidStateError');assert.equal(f.opens(),1);assert.equal(f.disk.get('esma:7:tev'),f.blob);return {opens:f.opens(),priorKept:true}});
 await test('Simultaneous stale readers share recovery without closing the new connection',async()=>{const f=fixture();await f.test.db.set('esma:7:tev',f.blob);const stale=f.connections[0];stale.close();const [one,two,three,four]=await Promise.all([f.test.db.get('esma:7:tev'),f.test.db.get('esma:7:tev'),f.test.db.keys(),f.test.db.hepsi()]);assert.equal(one.size,4);assert.equal(two.size,4);assert.equal(three[0],'esma:7:tev');assert.equal(four[0].boyut,4);assert.equal(f.opens(),2);assert.equal(f.connections[1].closed,false);assert.equal(f.disk.get('esma:7:tev'),f.blob);return {opens:f.opens(),readers:4,priorKept:true}});
 await test('Cancelling one cold reader does not cancel peer or write its data',async()=>{const f=fixture(),signal=new AbortController();f.disk.set('esma:7:tev',f.blob);f.faults.open='hold';const cancelled=f.test.db.get('esma:7:tev',{signal:signal.signal}),peer=f.test.db.get('esma:7:tev');signal.abort();assert.equal((await bounded(cancelled)).error,'AbortError');f.faults.open=null;for(const complete of f.heldOpens)complete();assert.equal((await peer).size,4);assert.equal(f.opens(),1);assert.equal(f.disk.get('esma:7:tev'),f.blob);return {opens:f.opens(),peerSucceeded:true,priorKept:true}});
 const report={source:path,mode:'controlled Node VM with synthetic IndexedDB event model; physical browser not run',passed:results.filter(x=>x.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));process.exitCode=results.every(x=>x.passed)?0:1;
})();
