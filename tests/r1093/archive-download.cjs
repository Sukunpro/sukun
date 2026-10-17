'use strict';
// Production staging/core modules, actual packaged manifest/audio bytes,
// deterministic streaming HTTP boundary and isolated transactional IDB stores.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture:genericFixture,record,bank,wav,plain,flush}=require('../r1055/generic-bank-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const code=fs.readFileSync(path.join(root,'assets/runtime/archive-download-r1093.js'),'utf8');
const manifestBytes=fs.readFileSync(path.join(root,'assets/generic-recordings/manifest.json')),manifest=JSON.parse(manifestBytes);
const temel=manifest.records.filter(row=>row.key.startsWith('temel:')),temelBytes=temel.reduce((n,row)=>n+row.bytes,0),results=[];
async function test(name,work){try{await work();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:String(error.stack||error)})}}
function stageFactory(disk,history,faults){
 let running=false;const jobs=[];
 const startNext=()=>{if(running||!jobs.length)return;running=true;jobs.shift()()};
 function transaction(stores,mode){
  const names=Array.isArray(stores)?stores:[stores];let draft=null,pending=0,done=false,started=false,settleQueued=false,error=null;
  const waiting=[];history.stageTransactions.push({mode,names});
  const tx={error:null,objectStore:name=>store(name),abort(){if(done)return;done=true;tx.error=error||Object.assign(Error('aborted'),{name:'AbortError'});queueMicrotask(()=>{tx.onabort?.();if(started){running=false;startNext()}})}};
  const settle=()=>{if(!started||done||pending||settleQueued)return;settleQueued=true;setImmediate(()=>{settleQueued=false;if(done||pending)return;done=true;if(mode==='readwrite'){for(const [name,values]of draft)disk.get('sukunGenericStageR1093').set(name,values);history.stageCommits++}tx.oncomplete?.();running=false;startNext()})};
  function request(work){const req={};pending++;const execute=()=>queueMicrotask(()=>{if(done)return;try{req.result=work();req.onsuccess?.({target:req})}catch(err){error=err;tx.error=err;req.error=err;req.onerror?.({target:req});tx.onerror?.({target:req});tx.abort();return}pending--;settle()});if(started)execute();else waiting.push(execute);return req}
  function store(name){if(!names.includes(name))throw Error('unlisted stage store');return{
   get:key=>request(()=>draft.get(name).get(key)),getAll:()=>request(()=>[...draft.get(name).values()]),getAllKeys:()=>request(()=>[...draft.get(name).keys()]),
   put:(value,key)=>{if(faults.nativeQuotaKey&&name==='clips'&&value.key===faults.nativeQuotaKey){faults.nativeQuotaKey=null;const error=new DOMException('Native staged quota exceeded','QuotaExceededError');assert.equal(error.code,22);throw error}return request(()=>{if(mode!=='readwrite')throw Error('write in readonly');if(faults.quotaKey&&name==='clips'&&value.key===faults.quotaKey){faults.quotaKey=null;throw Object.assign(Error('quota'),{name:'QuotaExceededError'})}const id=key??value.id;draft.get(name).set(id,value);return id})},
   delete:key=>request(()=>draft.get(name).delete(key))
  }}
  jobs.push(()=>{if(done){running=false;startNext();return}started=true;draft=new Map(names.map(name=>[name,new Map(disk.get('sukunGenericStageR1093').get(name))]));for(const run of waiting)run();settle()});queueMicrotask(startNext);return tx;
 }
 return{open(name,version){assert.equal(name,'sukunGenericStageR1093');history.stageOpens++;const req={};queueMicrotask(()=>{
  const fresh=!disk.has(name);if(fresh)disk.set(name,new Map());const stores=disk.get(name),db={objectStoreNames:{contains:name=>stores.has(name)},createObjectStore(name){stores.set(name,new Map());return{}},transaction,close(){history.stageCloses++}};req.result=db;
  if(fresh){req.transaction={abort(){disk.delete(name);req.error=Object.assign(Error('missing'),{name:'AbortError'})}};req.onupgradeneeded?.({target:req})}
  if(req.error){req.onerror?.({target:req});return}req.onsuccess?.({target:req});
 });return req}};
}
async function fixture({disk=new Map(),storage=new Map(),stage=null}={}){
 const f=genericFixture(root,{disk,storage});await f.api.ready();const history=f.history;history.stageTransactions=[];history.stageCommits=0;history.stageOpens=0;history.stageCloses=0;history.fetches=[];
 const faults={quotaKey:null,nativeQuotaKey:null,hold:null,holdStarted:null,release:null,tamperManifest:false,offline:false,oversize:null,fetchLimit:null};
 const staging=stage||stageFactory(disk,history,faults),original=f.c.indexedDB;
 f.c.indexedDB={open:(name,version)=>name==='sukunGenericStageR1093'?staging.open(name,version):original.open(name,version)};
 let access=false;f.c.SukunSecretPolicy={unlocked:()=>access,secretRecKey:key=>/^berhet:|^mzbz:/.test(key)};
 f.c.fetch=async(url,opt)=>{
  const value=new URL(String(url));assert.equal(opt.headers['X-Sukun-Archive-Stage'],'1');assert.equal(opt.cache,'no-store');assert.equal(opt.redirect,'error');history.fetches.push(value.pathname);
  if(faults.offline)throw Error('offline');if(faults.fetchLimit!==null&&history.fetches.length>faults.fetchLimit)throw Error('network interrupted');
  if(faults.hold&&value.pathname.endsWith(faults.hold)){faults.holdStarted?.();return new Promise(resolve=>{faults.release=()=>resolve(new Response(fs.readFileSync(path.join(root,value.pathname.split('/sukun/')[1]))))})}
  const file=value.pathname.split('/sukun/')[1],bytes=file.endsWith('manifest.json')?(faults.tamperManifest?Buffer.from(manifestBytes.toString().replace('arinma:0','arinma:9')):manifestBytes):fs.readFileSync(path.join(root,file));
  if(faults.oversize&&file.endsWith(faults.oversize))return new Response(Buffer.alloc(bytes.length+1));
  return new Response(bytes,{headers:{'content-length':String(bytes.length)}});
 };
 vm.runInContext(code,f.c,{filename:'archive-download-r1093.js'});
 const api=f.c.SukunArchiveDownloadR1093;
 return{...f,download:api,stage:staging,stageFaults:faults,history,async prepare(ids=['temel']){await api.catalog();return api.prepare({categories:ids})},setAccess(value){access=value;f.c.dispatchEvent(new f.c.CustomEvent('sukun:secretaccesschange'))},event:()=>f.c.dispatchEvent(new f.c.CustomEvent('sukun:secretaccesschange'))};
}
function active(f){return f.disk.get('sukunGenericStageR1093')?.get('meta')?.get('active')}
function staged(f){return f.disk.get('sukunGenericStageR1093')?.get('clips')||new Map()}
async function oldBank(f){await f.import(bank([record('qa:extra',wav(5)),record('temel:0',wav(9))]));return f.api.describeBank()}
const fingerprint=f=>JSON.stringify([...f.disk.get('sukunGenericRec')?.get('meta')||[]]);
module.exports={fixture,active,staged,oldBank,fingerprint,temel,temelBytes,root,manifest,manifestBytes,stageFactory};
if(require.main===module)(async()=>{
 await test('catalog verifies exact release manifest and filters both protected category families before output',async()=>{
  const f=await fixture(),catalog=await f.download.catalog();assert.equal(catalog.count,manifest.records.filter(row=>!/^berhet:|^mzbz:/.test(row.key)).length);assert(!catalog.categories.some(row=>['berhet','mzbz'].includes(row.id)));assert.equal(f.disk.has('sukunGenericStageR1093'),false);assert.equal(f.history.maintenance.length,0);
  f.setAccess(true);const unlocked=await f.download.catalog();assert(unlocked.categories.some(row=>row.id==='berhet'));assert(unlocked.categories.some(row=>row.id==='mzbz'));assert.equal(unlocked.count,manifest.records.length);
 });
 await test('tampered manifest fails before staging writes or any audio request',async()=>{
  const f=await fixture();f.stageFaults.tamperManifest=true;await assert.rejects(f.download.catalog(),error=>error.code==='archive-integrity');assert.equal(f.disk.has('sukunGenericStageR1093'),false);assert.equal(f.history.fetches.length,1);
 });
 await test('selected category uses independent durable stage with accurate verified record/byte progress and no live bank or preference writes',async()=>{
  const f=await fixture();await oldBank(f);const before=fingerprint(f),writes=f.history.lsWrites.length,maintenance=f.history.maintenance.length;const value=await f.prepare();assert.equal(value.phase,'ready');assert.equal(value.verifiedCount,temel.length);assert.equal(value.totalCount,temel.length);assert.equal(value.verifiedBytes,temelBytes);assert.equal(value.totalBytes,temelBytes);assert.equal(value.downloadedBytes,temelBytes);assert.equal(staged(f).size,temel.length);assert.equal(active(f).savedCount,temel.length);assert.equal(fingerprint(f),before);assert.equal(f.history.lsWrites.length,writes);assert.equal(f.history.maintenance.length,maintenance);assert.equal(f.history.personalAccess.length,0);
 });
 await test('successfully drained network responses finish naturally without aborting their fetch signals',async()=>{
  const f=await fixture(),signals=[],fetch=f.c.fetch;f.c.fetch=(url,opt)=>{signals.push(opt.signal);return fetch(url,opt)};await f.prepare();assert.equal(signals.length,temel.length+1);assert(signals.every(signal=>signal.aborted===false),'successful fetch was aborted after its verified EOF');
 });
 await test('reload resume rehashes durable blobs and downloads only missing staged clips',async()=>{
  const f=await fixture();await f.download.catalog();f.stageFaults.fetchLimit=3;await assert.rejects(f.download.prepare({categories:['temel']}));assert.equal(staged(f).size,2);const next=await fixture({disk:f.disk,storage:f.storage});const info=await next.download.resumeInfo();assert.equal(info.resumable,true);assert.equal(next.download.snapshot().verifiedCount,0);const ready=await next.download.resume();assert.equal(ready.verifiedCount,temel.length);assert.equal(ready.verifiedBytes,temelBytes);assert.equal(next.history.fetches.length,temel.length-2);assert(next.history.fetches.every(url=>!url.endsWith('manifest.json')));
 });
 await test('complete saved stage resumes fully offline after raw manifest and every blob are rehashed',async()=>{
  const f=await fixture();await f.prepare();const next=await fixture({disk:f.disk,storage:f.storage});next.stageFaults.offline=true;const ready=await next.download.resume();assert.equal(ready.verifiedCount,temel.length);assert.equal(next.history.fetches.length,0);
 });
 await test('same-sized corrupted staged audio is never counted verified and is repaired only by a verified download',async()=>{
  const f=await fixture();await f.prepare();const clip=[...staged(f).values()][0];clip.blob=new Blob([Buffer.alloc(clip.bytes)],{type:clip.type});const next=await fixture({disk:f.disk,storage:f.storage});await next.download.resume();assert.equal(next.history.fetches.length,1);assert.equal(next.download.snapshot().verifiedBytes,temelBytes);
 });
 await test('stage corruption blocks preview and keeps the live bank unchanged',async()=>{
  const f=await fixture();await oldBank(f);await f.prepare();const before=fingerprint(f),clip=[...staged(f).values()][0];clip.blob=new Blob(['bad'],{type:clip.type});await assert.rejects(f.download.preview({mode:'replace'}),error=>error.code==='archive-stage-incomplete');assert.equal(fingerprint(f),before);
 });
 await test('quota failure preserves earlier verified stage transactions and the old live bank',async()=>{
  const f=await fixture();await oldBank(f);const before=fingerprint(f);await f.download.catalog();f.stageFaults.quotaKey=temel[1].key;await assert.rejects(f.download.prepare({categories:['temel']}),error=>error.code==='archive-stage-quota');assert.equal(staged(f).size,1);assert.equal(active(f).savedCount,1);assert.equal(f.download.snapshot().verifiedCount,1);assert.equal(fingerprint(f),before);
 });
 await test('native DOMException QuotaExceededError code22 is normalized to the safe quota domain code',async()=>{
  const f=await fixture();await oldBank(f);const before=fingerprint(f);await f.download.catalog();f.stageFaults.nativeQuotaKey=temel[1].key;
  await assert.rejects(f.download.prepare({categories:['temel']}),error=>error.code==='archive-stage-quota');assert.equal(f.download.snapshot().errorCode,'archive-stage-quota');assert.equal(typeof f.download.snapshot().errorCode,'string');assert.equal(staged(f).size,1);assert.equal(active(f).savedCount,1);assert.equal(f.download.snapshot().verifiedCount,1);assert.equal(fingerprint(f),before);
 });
 await test('cancelled late fetch cannot store its blob or increase verified progress; committed stage bytes survive',async()=>{
  const f=await fixture();await f.download.catalog();f.stageFaults.hold=temel[1].file;let entered;const start=new Promise(resolve=>entered=resolve);f.stageFaults.holdStarted=entered;const pending=f.download.prepare({categories:['temel']});await start;f.download.cancel();f.stageFaults.release();await assert.rejects(pending,error=>error.code==='archive-cancelled');await flush();assert.equal(staged(f).size,1);assert.equal(f.download.snapshot().verifiedCount,1);assert.equal(f.history.maintenance.length,0);
 });
 await test('oversized streamed response rejects before it becomes a verified or durable clip',async()=>{
  const f=await fixture();await f.download.catalog();f.stageFaults.oversize=temel[0].file;await assert.rejects(f.download.prepare({categories:['temel']}),error=>error.code==='archive-limit');assert.equal(staged(f).size,0);assert.equal(f.download.snapshot().verifiedBytes,0);
 });
 await test('preview does not mutate the live bank and replace acceptance remains explicit and never enables playback',async()=>{
  const f=await fixture();await oldBank(f);await f.prepare();const before=fingerprint(f),preview=await f.download.preview({mode:'replace'});assert.equal(preview.added,temel.length-1);assert.equal(preview.replaced,1);assert.equal(preview.removed,1);assert.equal(preview.count,temel.length);assert.equal(preview.countScope,'visible');assert.equal(fingerprint(f),before);assert.equal(f.api.snapshot().enabled,false);await f.download.commit(preview.previewId);const installed=await f.api.describeBank();assert.equal(installed.count,temel.length);assert.equal(installed.bytes,temelBytes);assert.equal(f.api.snapshot().enabled,false);assert.equal(f.history.personalAccess.length,0);
 });
 for(const conflicts of['keep','replace'])await test(`merge with explicit ${conflicts} policy preserves entries outside selected keys`,async()=>{
  const f=await fixture();await oldBank(f);await f.prepare();const old=(await f.api.describeBank()).records.find(row=>row.key==='temel:0'),preview=await f.download.preview({mode:'merge',conflicts});assert.equal(preview.count,temel.length+1);assert.equal(preview.removed,0);await f.download.commit(preview.previewId);const installed=await f.api.describeBank();assert(installed.records.some(row=>row.key==='qa:extra'));assert.equal(installed.records.find(row=>row.key==='temel:0').sha256,conflicts==='keep'?old.sha256:temel[0].sha256);
 });
 await test('stale live bank preview is rejected using fresh disk revision even after identical-content ABA rewrites',async()=>{
  const f=await fixture();await oldBank(f);await f.prepare();const preview=await f.download.preview({mode:'replace'}),old=await f.api.describeBank();await f.import(bank([record('qa:different')]));await oldBank(f);const now=await f.api.describeBank();assert.equal(now.bankId,old.bankId);assert(now.revision>old.revision);const before=fingerprint(f);await assert.rejects(f.download.commit(preview.previewId),error=>error.code==='archive-stale');assert.equal(fingerprint(f),before);
 });
 await test('competing stage selection invalidates an older preview without changing live bank',async()=>{
  const f=await fixture();await oldBank(f);await f.prepare();const preview=await f.download.preview({mode:'replace'});await f.download.prepare({categories:['tesbih']});const before=fingerprint(f);await assert.rejects(f.download.commit(preview.previewId),error=>error.code==='archive-preview-stale');assert.equal(fingerprint(f),before);
 });
 await test('lock transition invalidates a preview even if the user unlocks again before accepting',async()=>{
  const f=await fixture();await f.prepare();const preview=await f.download.preview({mode:'replace'});f.setAccess(true);f.setAccess(false);await assert.rejects(f.download.commit(preview.previewId),error=>error.code==='archive-preview-stale');assert.equal(f.disk.has('sukunGenericRec'),false);
 });
 await test('locked merge preserves unseen private entries while descriptors/preview expose only visible counts',async()=>{
  const f=await fixture();f.setAccess(true);await f.import(bank([record('berhet:0'),record('qa:extra')]));f.setAccess(false);const descriptor=await f.api.describeBank();assert.equal(descriptor.count,1);assert(!descriptor.records.some(row=>row.key==='berhet:0'));await f.prepare();await assert.rejects(f.download.preview({mode:'replace'}),error=>error.code==='archive-private-bank-locked');const preview=await f.download.preview({mode:'merge',conflicts:'replace'});assert.equal(preview.count,temel.length+1);await f.download.commit(preview.previewId);assert(f.disk.get('sukunGenericRec').get('clips').has('berhet:0'));assert.equal((await f.api.describeBank()).count,temel.length+1);
 });
 await test('retained generic payload corruption aborts a merge without deleting any old clip',async()=>{
  const f=await fixture();await oldBank(f);await f.prepare();const preview=await f.download.preview({mode:'merge',conflicts:'replace'}),before=fingerprint(f);f.disk.get('sukunGenericRec').get('clips').get('qa:extra').blob=new Blob(['tampered'],{type:'audio/wav'});await assert.rejects(f.download.commit(preview.previewId),error=>error.code==='archive-integrity');assert.equal(fingerprint(f),before);assert(f.disk.get('sukunGenericRec').get('clips').has('qa:extra'));
 });
 await test('untrusted old service-worker protocol blocks network instead of double-caching stage bytes',async()=>{
  const f=await fixture();f.c.navigator.serviceWorker={controller:{postMessage(message,ports){ports[0].postMessage({ok:true,protocol:0,networkOnly:false,build:'r1092'})}}};f.c.MessageChannel=MessageChannel;f.c.document.querySelector=()=>({content:'r1093'});await assert.rejects(f.download.catalog(),error=>error.code==='archive-update-required');assert.equal(f.history.fetches.length,0);
 });
 await test('supported same-build staging service-worker protocol uses explicit marked network requests',async()=>{
  const f=await fixture();f.c.navigator.serviceWorker={controller:{postMessage(message,ports){assert.equal(message.type,'ARCHIVE_STAGE_STATUS');ports[0].postMessage({ok:true,protocol:1,networkOnly:true,build:'r1093'})}}};f.c.MessageChannel=MessageChannel;f.c.document.querySelector=()=>({content:'r1093'});const result=await f.download.catalog();assert(result.categories.length>0);assert.equal(f.history.fetches.length,1);
 });
 const report={suite:'r1093 verified durable generic archive staging',method:'Actual production modules, packaged manifest/audio bytes, bounded streaming responses and isolated transactional IDB fixtures. Native companion tests cover real browser cross-tab serialization.',passed:results.filter(row=>row.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
