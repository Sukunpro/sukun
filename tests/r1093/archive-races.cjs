'use strict';
// Adversarial sequencing of the shipped archive modules. The retained r1055
// fixture supplies controlled IDB endpoints, not archive policy. Its stage-only
// keyPath adapter below adds ID-keyed writes. It does not model simultaneous
// native IDB transaction serialization; the browser suites own that claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture:bankFixture,record,bank}=require('../r1055/generic-bank-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const stagePath='assets/runtime/archive-download-r1093.js',stageSource=fs.readFileSync(path.join(root,stagePath),'utf8');
const STAGE='sukunGenericStageR1093';
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
async function bounded(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Controlled archive boundary was not reached')),5000))]);}finally{clearTimeout(timer);}}
const plain=x=>JSON.parse(JSON.stringify(x));

async function fixture({disk=new Map(),storage=new Map(),unlocked=false}={}){
 const f=bankFixture(root,{disk,storage}),c=f.c,requests=[],held=new Map();let access=unlocked;
 c.SukunSecretPolicy={unlocked:()=>access,secretRecKey:key=>!access&&/^berhet:|^mzbz:|berhetiy/i.test(key)};
 // The old fixture uses explicit keys. Only adapt stage records' declared id
 // keyPath; no manifest validation, source choice, staging or commit is copied.
 const originalOpen=c.indexedDB.open.bind(c.indexedDB);
 c.indexedDB={open(name,version){
  const request=originalOpen(name,version);if(name!==STAGE)return request;
  let onSuccess;Object.defineProperty(request,'onsuccess',{configurable:true,set(fn){onSuccess=fn;},get(){return event=>{
   const db=request.result,originalTransaction=db.transaction.bind(db);
   db.transaction=(names,mode)=>{const tx=originalTransaction(names,mode),originalStore=tx.objectStore.bind(tx),stores=new Map();tx.objectStore=name=>{
    if(stores.has(name))return stores.get(name);const store=originalStore(name);
    if(name==='clips'){const put=store.put.bind(store),add=store.add.bind(store);store.put=(value,key)=>put(value,key??value.id);store.add=(value,key)=>add(value,key??value.id);}
    stores.set(name,store);return store;
   };return tx;};onSuccess?.(event);
  };}});return request;
 }};
 c.fetch=async(url,opt={})=>{
  const parsed=new URL(url),name=parsed.pathname.replace(/^\/sukun\//,'');
  assert(name.startsWith('assets/generic-recordings/'),'Only exact packaged archive input is allowed');
  assert.equal(opt.headers?.['X-Sukun-Archive-Stage'],'1');assert.equal(opt.cache,'no-store');
  requests.push({name,signal:opt.signal});const gate=held.get(name);if(gate){held.delete(name);gate.entered.resolve();await gate.release.promise;}
  const bytes=fs.readFileSync(path.join(root,name));return new Response(bytes,{status:200,headers:{'content-length':String(bytes.length)}});
 };
 vm.runInContext(stageSource,c,{filename:stagePath});await f.api.ready();
 const api=c.SukunArchiveDownloadR1093;
 return{...f,api,core:f.api,requests,
  hold(name){const gate={entered:defer(),release:defer()};held.set(name,gate);return gate;},
  access(value){access=value;c.dispatchEvent(new c.CustomEvent('sukun:secretaccesschange',{detail:{unlocked:value}}));},
  stage:()=>disk.get(STAGE)?.get('meta')?.get('active'),
  clips:()=>disk.get(STAGE)?.get('clips')||new Map(),
  live:()=>disk.get('sukunGenericRec')?.get('meta')?.get('bank'),
  async prepared(categories=['temel']){await api.catalog();await api.prepare({categories});return api.preview({mode:'merge',conflicts:'replace'});}
 };
}

const results=[];async function test(name,work){try{await work();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.stack||String(error)});}}
(async()=>{
 await test('A previous download cannot overwrite a newer selected stage after its held response arrives',async()=>{
  const a=await fixture(),b=await fixture({disk:a.disk,storage:a.storage});await a.api.catalog();await b.api.catalog();
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/generic-recordings/manifest.json'))),first=manifest.records.find(x=>x.key.startsWith('temel:'));
  const held=a.hold('assets/generic-recordings/'+first.file),pending=a.api.prepare({categories:['temel']}),rejection=assert.rejects(pending,error=>error.code==='archive-stage-stale');
  await bounded(held.entered.promise);await b.api.prepare({categories:['niyet']});const revision=b.stage().revision;
  held.release.resolve();await rejection;assert.equal(a.stage().revision,revision);assert.deepEqual(plain(a.stage().categories),['niyet']);assert(!a.clips().has(a.stage().stageId+':'+first.key));assert.equal(a.live(),undefined);assert.equal(a.history.personalAccess.length,0);
 });
 await test('A persisted commit claim blocks a second selected stage while live-owner admission is pending',async()=>{
  const a=await fixture(),b=await fixture({disk:a.disk,storage:a.storage}),preview=await a.prepared();await b.api.catalog();
  const entered=defer(),release=defer(),maintenance=a.c.SukunTabOwner.maintenance;
  a.c.SukunTabOwner.maintenance=async(...args)=>{entered.resolve();await release.promise;return maintenance(...args);};
  const pending=a.api.commit(preview.previewId);await bounded(entered.promise);assert(a.stage().claim?.id);
  await assert.rejects(b.api.prepare({categories:['niyet']}),error=>error.code==='archive-stage-busy');release.resolve();const committed=await pending;
  assert.equal(committed.ok,true);assert.equal(a.live().records.length,4);assert.equal(a.stage().claim,null);assert.equal(a.history.personalAccess.length,0);
 });
 await test('A lock followed by unlock retires pending preparation even when access ends in its original state',async()=>{
  const f=await fixture({unlocked:true});await f.api.catalog();const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/generic-recordings/manifest.json'))),first=manifest.records.find(x=>x.key.startsWith('berhet:'));
  const held=f.hold('assets/generic-recordings/'+first.file),pending=f.api.prepare({categories:['berhet']}),rejection=assert.rejects(pending,error=>error.code==='archive-cancelled');
  await bounded(held.entered.promise);f.access(false);const locked=plain(f.api.snapshot());assert.equal(locked.totalCount,0);assert(!locked.categories.some(x=>x.id==='berhet'||x.id==='mzbz'));f.access(true);held.release.resolve();await rejection;
  assert.equal(f.live(),undefined);assert.equal(f.clips().size,0);assert.equal(f.api.snapshot().preview,null);
 });
 await test('A persisted live-bank revision rejects an A-to-B-to-A legacy replacement despite identical final digest',async()=>{
  const f=await fixture();await f.import(bank([record('qa:old',Buffer.from('LABELLED A'),'audio/webm')]));const preview=await f.prepared(),initial=f.live().bankId;
  await f.import(bank([record('qa:old',Buffer.from('LABELLED B'),'audio/webm')]));await f.import(bank([record('qa:old',Buffer.from('LABELLED A'),'audio/webm')]));assert.equal(f.live().bankId,initial);
  const before=plain(f.live());await assert.rejects(f.api.commit(preview.previewId),error=>error.code==='archive-stale');assert.deepEqual(plain(f.live()),before);assert.equal(f.core.snapshot().errorCode,'archive-stale');
 });
 await test('Cancellation on the completed live-import event retains the committed success receipt',async()=>{
  const f=await fixture(),preview=await f.prepared();let cancelled=false;
  f.c.addEventListener('sukun:genericrecordingschange',event=>{if(event.detail?.reason==='import'){cancelled=true;f.api.cancel();}});
  const result=await f.api.commit(preview.previewId);assert(cancelled);assert.equal(result.ok,true);assert.equal(f.live().records.length,4);assert.equal(f.api.snapshot().phase,'ready');assert.equal(f.api.snapshot().errorCode,'');assert.equal(f.stage().claim,null);
 });
 await test('Locked public merge preserves hidden live recordings and reports only the reviewed visible count',async()=>{
  const f=await fixture({unlocked:true});await f.import(bank([record('berhet:0',Buffer.from('LABELLED private retained'),'audio/webm')]));f.access(false);
  const preview=await f.prepared();assert.equal(preview.countScope,'visible');assert.equal(preview.count,4);const result=await f.api.commit(preview.previewId);
  assert.equal(result.ok,true);assert.equal(result.countScope,'visible');assert.equal(result.count,4);assert.equal(f.live().records.length,5);assert(f.disk.get('sukunGenericRec').get('clips').has('berhet:0'));
  await assert.rejects(f.api.preview({mode:'replace',conflicts:'replace'}),error=>error.code==='archive-private-bank-locked');assert.equal(f.live().records.length,5);
 });
 console.log(JSON.stringify({suite:'r1093 independent adversarial archive sequencing',method:'Actual shipped archive/core modules, native SHA-256, exact original manifest and exercised category bytes; retained controlled IDB fixture plus labelled held responses/owner admission. No native concurrency, physical device or audible claim.',passed:results.filter(x=>x.passed).length,total:results.length,results},null,2));if(results.some(x=>!x.passed))process.exitCode=1;
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
