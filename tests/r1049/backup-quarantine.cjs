/* Real missing-voice import and REC_DB.mergeMissing with synthetic IndexedDB
 * transactions. No browser profile, network, microphone or personal data.
 * Run: node tests/r1049/backup-quarantine.cjs [source root]
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=fs.readFileSync(path.join(root,'assets/runtime/recording-salvage-r1020.js'),'utf8');
const results=[];
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const cut=(text,start,end)=>{const a=text.indexOf(start),b=text.indexOf(end,a);assert(a>=0&&b>a,start);return text.slice(a,b);};
const keyCompare=(a,b)=>{if(Array.isArray(a)&&Array.isArray(b)){for(let i=0;i<Math.min(a.length,b.length);i++){const c=keyCompare(a[i],b[i]);if(c)return c;}return a.length-b.length;}return a<b?-1:a>b?1:0;};
const IDBKeyRange={only:key=>({includes:other=>keyCompare(key,other)===0}),bound:(lo,hi)=>({includes:key=>keyCompare(lo,key)<=0&&keyCompare(key,hi)<=0})};
function native(){
 const t=Date.now(),build='r1048',ls={'sukun.lang':'en'},recordings={existing:'OLD!',missing:'NEW!'},type='audio/webm';
 const entries=Object.entries(recordings).map(([key,bytes])=>[key,{size:bytes.length,type,sum:hash(bytes),metadata:null}]).sort(([a],[b])=>a.localeCompare(b));
 const serial={schema:1,app:'SUKUN-Recovery',at:t,build,ls:Object.entries(ls),stores:{sukunRec:{present:true,version:1,entries},sukunCustomAmb:{present:false,version:1,entries:[]}}};
 return {app:'SUKUN',fmt:2,t,build,ls,idb:{sukunRec:Object.fromEntries(Object.entries(recordings).map(([key,bytes])=>[key,{__blob:'data:'+type+';base64,'+Buffer.from(bytes).toString('base64'),type}])),sukunCustomAmb:{}},recovery:{schema:1,mode:'exact-personal-data',presence:{sukunRec:true,sukunCustomAmb:false},digest:hash(JSON.stringify(serial))}};
}
function fixture({historyJobs=0,clipsPerJob=0,tamperStaged=false,loseLeaseOnRead=false}={}){
 const clips=new Map([['existing',new Blob(['CURRENT'],{type:'audio/webm'})]]),jobs=new Map(),quarantine=new Map();
 const oldBlob=new Blob(['SAFE'],{type:'audio/webm'}),oldHash=hash('SAFE');
 for(let i=0;i<historyJobs;i++){const id='old-'+i;jobs.set(id,{id,state:'verified-source',at:1});for(let j=0;j<clipsPerJob;j++)quarantine.set(JSON.stringify([id,'voice-'+j]),{jobId:id,key:'voice-'+j,blob:oldBlob,hash:oldHash});}
 const history={reads:[],commits:[],aborts:0,mainMergeCalls:0,settingWrites:0,closed:0};let current=true,revision=0;
 const stores={jobs,clips:quarantine,main:clips};
 function db(which){return {version:1,objectStoreNames:{contains:n=>which==='quarantine'?['jobs','clips'].includes(n):n==='clips'},close(){history.closed++;},transaction(names,mode){
  names=Array.isArray(names)?names:[names];const selected=names.map(n=>which==='main'?'main':n),pending=new Map(selected.map(n=>[n,new Map(stores[n])]));let operations=0,aborted=false,complete=false,scheduled=false;
  const tx={abort(){if(aborted||complete)return;aborted=true;history.aborts++;queueMicrotask(()=>tx.onabort?.());},objectStore(name){const id=which==='main'?'main':name,map=pending.get(id);assert(map,'unknown store '+name);return {
   openCursor(query){const request={},rows=[...map].map(([encoded,value])=>[id==='clips'?JSON.parse(encoded):encoded,value]).filter(([key])=>query===undefined||query===null||(typeof query.includes==='function'?query.includes(key):keyCompare(query,key)===0)).sort(([a],[b])=>keyCompare(a,b));let at=0;operations++;history.reads.push({store:id,restricted:query!==undefined&&query!==null,rows:rows.length});
    const emit=()=>{if(aborted)return;const row=rows[at++];if(row){if(loseLeaseOnRead&&id==='clips')current=false;const value=tamperStaged&&id==='clips'&&row[1].jobId.startsWith('new-')?{...row[1],blob:new Blob(['BAD!'],{type:'audio/webm'})}:row[1];request.result={key:row[0],value,continue:()=>queueMicrotask(emit)};request.onsuccess?.();}else{request.result=null;request.onsuccess?.();operations--;settle();}};queueMicrotask(emit);return request;
   },
   getKey(key){const request={};operations++;queueMicrotask(()=>{if(aborted)return;request.result=map.has(key)?key:undefined;request.onsuccess?.();operations--;settle();});return request;},
   add(value,key){assert.equal(mode,'readwrite');const resolved=id==='main'?key:id==='jobs'?value.id:JSON.stringify([value.jobId,value.key]);if(map.has(resolved))throw Error('ConstraintError');map.set(resolved,value);settle();return {};}
  };}};
  function settle(){if(scheduled||operations||aborted||complete)return;scheduled=true;queueMicrotask(()=>{scheduled=false;if(operations||aborted||complete)return;complete=true;if(mode==='readwrite'){for(const [id,pairs]of pending){stores[id].clear();for(const pair of pairs)stores[id].set(...pair);}history.commits.push(which);}tx.oncomplete?.();});}
  return tx;
 }};}
 const window={crypto:{subtle:crypto.webcrypto.subtle,randomUUID:()=> 'new-'+(jobs.size+1)},indexedDB:{open(name){assert.equal(name,'sukunVoiceQuarantineR1020');const rq={};queueMicrotask(()=>{rq.result=db('quarantine');rq.onsuccess?.();});return rq;}},IDBKeyRange,navigator:{storage:{estimate:async()=>({quota:1024*1048576,usage:0})}},SukunRecoveryGuard:{assertSingleClient:async lease=>lease.assertCurrent()},SukunTabOwner:{maintenance:async(_,fn)=>fn({current:()=>current,assertCurrent:()=>{if(!current)throw Object.assign(Error('cancelled'),{code:'cancelled'});}})},I18N:{lang:'en'},addEventListener(){},removeEventListener(){},location:{origin:'https://example.invalid'}};
 const document={readyState:'loading',documentElement:{lang:'en'},getElementById:()=>null,querySelector:()=>({content:'r1048'}),addEventListener(){}};
 const c={window,document,Blob,Uint8Array,TextEncoder,Map,Set,Promise,Date,Object,Array,Error,Number,String,JSON,RegExp,AbortController,setTimeout,clearTimeout,atob,queueMicrotask,IDBKeyRange,RECKEYS:new Set(clips.keys()),open:async()=>db('main'),revision:()=>revision,revisions:{set:(_,v)=>revision=v},skRecordingCatalogPublish(){},skVoiceRestoreRefresh:async()=>{},skRecordingCatalogRead:async()=>({ok:true,keys:[...clips.keys()]}),skRecordingCatalogWarning:()=>'',SK_RECORDING_CATALOG:{error:''},localStorage:{setItem(){history.settingWrites++;}}};
 vm.createContext(c);vm.runInContext(cut(html,'function skBackupLimits(){','function skVoiceRestoreBind(){'),c);const merge=vm.runInContext('('+cut(html,'  async function mergeMissing(entries,opt={}){','  /* Tüm kayıtları anahtar+boyutuyla listele')+')',c);
 c.REC_DB={mergeMissing:async(...args)=>{history.mainMergeCalls++;return merge(...args);},get:async key=>clips.get(key)};vm.runInContext(source,c);
 return {api:window.SukunRecordingSalvage,clips,jobs,quarantine,history,current:value=>current=value};
}
async function test(name,fn){try{await fn();results.push({name,passed:true});}catch(error){results.push({name,passed:false,code:error.code,error:String(error.stack||error)});}}
async function restored(f){const out=await f.api.importJSON([new Blob([JSON.stringify(native())],{type:'application/json'})]);assert.equal(out.ok,true);assert.equal(out.added,1);assert.equal(out.kept,1);assert.equal(await f.clips.get('existing').text(),'CURRENT');assert.equal(await f.clips.get('missing').text(),'NEW!');assert.equal(f.history.settingWrites,0);assert.equal(f.api.status().busy,false);return out;}
(async()=>{
 await test('empty quarantine imports valid native backup through real atomic merge',async()=>{const f=fixture();await restored(f);assert.equal(f.jobs.size,1);assert.equal(f.quarantine.size,2);assert.equal(f.history.mainMergeCalls,1);});
 await test('8000 historical voices cannot block a new missing-only import',async()=>{const f=fixture({historyJobs:4,clipsPerJob:2000});await restored(f);assert.equal(f.jobs.size,5);assert.equal(f.quarantine.size,8002);for(let i=0;i<4;i++)assert.equal(await f.quarantine.get(JSON.stringify(['old-'+i,'voice-1999'])).blob.text(),'SAFE');});
 await test('historical jobs beyond scan cap do not inflate new operation read',async()=>{const f=fixture({historyJobs:8001});await restored(f);assert.equal(f.jobs.size,8002);assert(f.history.reads.filter(x=>x.store==='jobs').every(x=>x.rows===1&&x.restricted));assert(f.history.reads.filter(x=>x.store==='clips').every(x=>x.rows===2&&x.restricted));});
 await test('selected job range excludes earlier and later UUID clips with same voice keys',async()=>{const f=fixture({historyJobs:3,clipsPerJob:5});await restored(f);assert.equal(f.quarantine.size,17);const read=f.history.reads.find(x=>x.store==='clips');assert.equal(read.rows,2);assert.equal(read.restricted,true);});
 await test('tampered newly staged quarantine still rejects before main merge',async()=>{const f=fixture({historyJobs:4,clipsPerJob:2000,tamperStaged:true});await assert.rejects(f.api.importJSON([new Blob([JSON.stringify(native())])]),e=>e.code==='quarantine-verification-failed');assert.equal(f.clips.has('missing'),false);assert.equal(await f.clips.get('existing').text(),'CURRENT');assert.equal(f.history.mainMergeCalls,0);assert.equal(f.quarantine.size,8002);assert.equal(f.api.status().busy,false);});
 await test('lease lost during new quarantine read rejects before main merge',async()=>{const f=fixture({historyJobs:4,clipsPerJob:2000,loseLeaseOnRead:true});await assert.rejects(f.api.importJSON([new Blob([JSON.stringify(native())])]),e=>e.code==='cancelled');assert.equal(f.clips.has('missing'),false);assert.equal(f.history.mainMergeCalls,0);assert.equal(f.jobs.size,5);assert.equal(f.quarantine.size,8002);assert.equal(f.api.status().busy,false);});
 console.log(JSON.stringify({sourceRoot:root,method:'Production importJSON, quarantine transactions and production mergeMissing with synthetic records only.',passed:results.filter(x=>x.passed).length,total:results.length,results},null,2));if(results.some(x=>!x.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
