'use strict';
// Independent adversarial checks of the shipped matrix, source catalog,
// visibility helper and generic core. IDB scheduling/personal endpoints and
// device voice metadata are controlled boundaries, never coverage policies.
// Native transaction serialization, codecs, audible output and hardware are
// deliberately outside this suite and belong to the native browser tests.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture:bankFixture,record,bank,plain,digest}=require('../r1055/generic-bank-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const paths=['assets/runtime/reading-sources-r1064.js','assets/runtime/session-preflight-r1092.js','assets/runtime/source-matrix-r1094.js','assets/runtime/generic-recordings-r1055.js'];
const sources=new Map(paths.map(name=>[name,fs.readFileSync(path.join(root,name),'utf8')]));
const initialTestSha256=digest(fs.readFileSync(__filename));
function between(start,end){const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a,'Production expression boundaries are present');return html.slice(a,b);}
const canonical=between('const ZIKIR=','\n};')+'\n};';
const forms=between('function esmaForms(','function syncFormSeg');
const tevhid=between('function tevhid99(','/* ── Sesli zikir');
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
async function bounded(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Controlled boundary was not reached')),5000))]);}finally{clearTimeout(timer);}}

async function fixture({unlocked=true,disk,storage}={}){
 const f=bankFixture(root,{disk,storage});await f.api.ready();
 const c=f.c,personal=new Map(),revisions=new Map(),reads=[],listings=[],effects=[];let access=unlocked,preferenceEpoch=0,onGet=null,onKeys=null,form='tev';
 c.Z={};Object.defineProperty(c.Z,'form',{get:()=>form,set:value=>{effects.push(['Z.form',value]);form=value;}});
 c.REC_DB={revision:key=>revisions.get(key)||0,keys:async opt=>{listings.push(opt);assert(opt.timeoutMs>0);return onKeys?onKeys(opt):[...personal.keys()]},get:async(key,opt)=>{reads.push(key);assert(opt.timeoutMs>0);if(onGet)return onGet(key,opt);return personal.get(key)||null;}};
 c.RECKEYS=new Set();c.SK_RECORDING_CATALOG={sequence:0,verified:true,pending:false,error:''};
 c.SukunSecretPolicy={unlocked:()=>access,secretRecKey:key=>!access&&/^berhet:|^mzbz:|berhetiy/i.test(key),secretStep:step=>!access&&step?.cat==='berhet'};
 c.SukunTerkipAllowed=()=>true; // Public fixture boundary; actual policy is exercised separately below.
 c.SukunVoiceSettings={epoch:()=>preferenceEpoch};
 c.SukunVoiceCatalog={peek:lang=>({name:'LABELLED '+lang,voiceURI:'LABELLED '+lang,lang,localService:true})};
 c.SukunReadingPolicy={plan:(_item,opt)=>{assert.equal(opt.readOnly,true);return{ok:true,lang:opt.source==='arabic'?'ar':'tr',voice:{localService:true}};}};
 for(const name of ['Audio','AudioContext','SpeechSynthesisUtterance'])c[name]=()=>{effects.push(name);throw Error('Forbidden media start '+name)};
 c.fetch=()=>{effects.push('fetch');throw Error('Forbidden network read')};
 c.speechSynthesis={speak(){effects.push('speak');throw Error('Forbidden speech')},cancel(){effects.push('cancel');throw Error('Forbidden speech cancellation')}};
 // These are exactly the production declarations also used by the retained
 // catalog test. Ebced is unrelated display metadata at this boundary.
 vm.runInContext(canonical+"\nconst EMPH='حخصضطظعغقر';const stripHarake=a=>String(a||'').replace(/[\\u064B-\\u065F\\u0670\\u0640\\s]/g,'');function zEbcedDegeri(){return 0;}\n"+forms+tevhid+';tevhid99();window.ZIKIR=ZIKIR;',c,{filename:'index.html:canonical-catalog-expressions'});
 for(const name of paths.slice(0,3))vm.runInContext(sources.get(name),c,{filename:name});
 effects.length=0; // Exclude production tevhid99's startup form restoration.
 const core=f.api,api=c.SukunSourceMatrixR1094;
 return{...f,core,api,personal,revisions,reads,listings,effects,
  inspect:opt=>api.inspect(opt),
  put(key,value=new Blob(['LABELLED personal'],{type:'audio/wav'})){personal.set(key,value);c.RECKEYS.add(key);},
  getHook:fn=>{onGet=fn},keysHook:fn=>{onKeys=fn},
  access(value){access=value;c.dispatchEvent(new c.CustomEvent('sukun:secretaccesschange',{detail:{unlocked:value}}));},
  preference(){preferenceEpoch++;},
  baseline(){return{snapshot:plain(core.snapshot()),events:f.history.events.length,writes:f.history.lsWrites.length,commits:f.history.commits,maintenance:f.history.maintenance.length,transactions:f.history.transactions.length,form};},
  passive(before){assert.deepEqual(effects,[]);assert.equal(form,before.form);assert.deepEqual(plain(core.snapshot()),before.snapshot);assert.equal(f.history.events.length,before.events);assert.equal(f.history.lsWrites.length,before.writes);assert.equal(f.history.commits,before.commits);assert.equal(f.history.maintenance.length,before.maintenance);assert(f.history.transactions.slice(before.transactions).every(tx=>tx.mode==='readonly'));}
 };
}
function row(value,id){const found=value.rows.find(item=>item.id===id);assert(found,'Expected canonical row '+id);return found;}
function stale(value){assert.equal(value.status,'stale');assert.deepEqual(plain(value.rows),[]);assert.equal(value.counts.validSlots,0);}
const results=[];async function test(name,work){try{await work();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.stack||String(error)});}}

(async()=>{
 await test('The full actual catalog retains 284 canonical readings and 381 exact slots without favorites or a source/form mutation',async()=>{
  const f=await fixture();f.put('esma:6:tev');f.put('esma:0');f.put('unrelated:99');f.c.ZIKIR.fav={items:[Object.assign(Object.create(f.c.ZIKIR.esma.items[6]),{_src:'esma',_i:6})]};
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/generic-recordings/manifest.json'))),selected=manifest.records.filter(item=>['esma:6:nida','esma:6:tev'].includes(item.key));assert.equal(selected.length,2);
  await f.import(bank(selected.map(item=>record(item.key,fs.readFileSync(path.join(root,'assets/generic-recordings',item.file)),item.type))));assert.equal(f.core.snapshot().enabled,false);
  const before=f.baseline(),value=await f.inspect();assert.equal(value.status,'ready');assert.equal(value.counts.canonicalReadings,284);assert.equal(value.counts.validSlots,381);assert.equal(value.counts.uniqueNames,127);assert.equal(value.counts.unsupportedForms,2);assert.equal(value.rows.filter(item=>['esma','berhet'].includes(item.cat)).length,224);assert(!value.rows.some(item=>item.cat==='fav'||item.id.startsWith('reading:')));assert.equal(new Set(value.rows.map(item=>item.id)).size,381);
  assert.equal(row(value,'zikir:esma:6:nida').personal.state,'missing');assert.equal(row(value,'zikir:esma:6:nida').personal.alternate,true);assert.equal(row(value,'zikir:esma:6:tev').personal.state,'present');assert.equal(row(value,'zikir:esma:0:nida').personal.legacy,true);assert.equal(row(value,'zikir:esma:0:nida').personal.state,'missing');assert.equal(row(value,'zikir:esma:0:tev').personal.state,'missing');assert.equal(value.counts.personal.present,1);assert.equal(value.counts.personal.files,2);
  assert.equal(row(value,'zikir:esma:6:nida').generic.state,'present');assert.equal(row(value,'zikir:esma:6:tev').generic.state,'present');assert.equal(value.counts.generic.enabled,false);assert.equal(value.counts.generic.present,2);assert.equal(value.counts.generic.files,2);
  assert.equal(f.reads.length,new Set(f.reads).size);assert.deepEqual([...f.reads].sort(),['esma:0','esma:6:tev']);assert(f.listings.length>=1&&f.listings.length<=2);f.passive(before);
 });
 await test('Locked canonical rows and favorite getters are never inspected and the shared private source key is not exposed',async()=>{
  const f=await fixture({unlocked:false});f.c.ZIKIR.berhet.items[0]=Object.defineProperty({},'tr',{get(){throw Error('Protected title inspected')}});f.c.ZIKIR.fav={get items(){throw Error('Favorite catalog inspected')}};f.put('berhet:0');f.put('mzbz:berhetiyye');const value=await f.inspect();
  assert(!value.rows.some(item=>item.cat==='berhet'||item.cat==='fav'));assert(!f.reads.some(key=>/^berhet:|^mzbz:/.test(key)));const shared=row(value,'zikir:arinma:8');assert.equal(shared.key,null);assert.equal(shared.target.key,null);assert.equal(shared.personal.state,'unknown');assert.equal(shared.generic.state,'unknown');assert(!JSON.stringify(value).includes('mzbz:berhetiyye'));assert.equal(f.api.describeTarget('zikir:berhet:0'),null);
 });
 await test('The actual production privacy policy cannot expose a protected user terkip through a cat/index-only matrix target',async()=>{
  // Reuse only the exported controlled endpoints and actual source-expression
  // loader. It executes the real TerkipAllowed and SecretPolicy declarations;
  // the independent assertion below does not trust secretStep as its oracle.
  const {fixture:policyFixture}=require('./source-matrix.cjs'),f=policyFixture({unlocked:false});
  const protectedItem={tr:'LABELLED protected combination',ar:f.c.ZIKIR.berhet.items[0].ar};f.c.ZIKIR.terkip.items.push(protectedItem);const index=f.c.ZIKIR.terkip.items.length-1,id=`zikir:terkip:${index}`,step={type:'zikir',cat:'terkip',idx:index};
  assert.equal(f.c.SukunTerkipAllowed(step),false,'Existing canonical privacy authority denies this content');assert.equal(f.c.SukunSessionPreflightR1092.isVisible(step),false);assert.equal(f.api.describeTarget(id),null);const value=await f.inspect();assert(!value.rows.some(item=>item.id===id));assert(!JSON.stringify(value).includes(protectedItem.tr));assert(!f.reads.includes(`terkip:${index}`));
  f.c.ZIKIR.fav={items:[{_src:'terkip',_i:index}]};assert.equal(f.c.SukunSessionPreflightR1092.isVisible({type:'zikir',cat:'fav',idx:0}),false,'Canonical denial also follows the existing favorites alias loop');
  for(const helper of [undefined,()=>{throw Error('LABELLED unavailable privacy authority')}]){f.c.SukunTerkipAllowed=helper;assert.equal(f.c.SukunSessionPreflightR1092.isVisible(step),false);assert.equal(f.api.describeTarget(id),null);}
 });
 await test('A missing source catalog cannot silently relabel forms or open a legacy alias for the locked shared source',async()=>{
  const {fixture:policyFixture}=require('./source-matrix.cjs'),f=policyFixture({unlocked:false});f.own.set('arinma:8',new Blob(['LABELLED legacy shared source'],{type:'audio/wav'}));f.c.SukunReadingSourcesR1064=null;
  assert.equal(f.api.describeTarget('zikir:arinma:8'),null);const value=await f.inspect();assert.equal(value.status,'attention');assert.equal(value.reason,'catalog-unavailable');assert.deepEqual(plain(value.rows),[]);assert.equal(f.reads.length,0);assert.equal(f.keyReads.length,0);
 });
 await test('Personal key-list failure is unavailable and cannot become a confirmed missing filter result',async()=>{
  const f=await fixture();f.keysHook(()=>{throw Object.assign(Error('LABELLED private disk failure'),{name:'SecurityError'})});const value=await f.inspect();assert.equal(value.status,'attention');assert(value.rows.every(item=>item.personal.state==='unavailable'));assert.equal(value.counts.personal.missing,0);assert.equal(f.reads.length,0);assert(!JSON.stringify(value).includes('LABELLED private disk failure'));
 });
 await test('A contradictory empty personal index is unavailable without editing the known catalog',async()=>{
  const f=await fixture();f.c.RECKEYS.add('esma:0:nida');const value=await f.inspect();assert.equal(value.counts.personal.missing,0);assert(value.rows.every(item=>item.personal.state==='unavailable'));assert(f.c.RECKEYS.has('esma:0:nida'));
 });
 await test('A listed absent, empty or nonaudio personal payload stays unavailable instead of missing',async()=>{
  const f=await fixture();f.put('esma:0:nida',null);f.put('esma:1:nida',new Blob([],{type:'audio/wav'}));f.put('esma:2:nida',new Blob(['LABELLED image'],{type:'image/png'}));const value=await f.inspect();for(const index of [0,1,2])assert.equal(row(value,`zikir:esma:${index}:nida`).personal.state,'unavailable');assert.equal(value.counts.personal.unavailable,3);assert.equal(value.counts.personal.present,0);
 });
 await test('An earlier row revision changing during a later matched read retires the entire matrix',async()=>{
  const f=await fixture();f.put('esma:0:nida');f.put('esma:1:nida');f.getHook(async key=>{if(key==='esma:1:nida')f.revisions.set('esma:0:nida',1);return f.personal.get(key)});stale(await f.inspect());
 });
 await test('A lock-unlock ABA during a held personal read cannot publish protected labels or keys',async()=>{
  const f=await fixture(),entered=defer(),release=defer();f.put('berhet:0');f.getHook(async key=>{entered.resolve();await release.promise;return f.personal.get(key)});const pending=f.inspect();await bounded(entered.promise);f.access(false);f.access(true);release.resolve();const value=await pending;stale(value);assert(!JSON.stringify(value).includes('berhet:0'));
 });
 for(const mode of ['replacement','in-place-content'])await test(`A ${mode} canonical catalog edit during a source read retires indices and labels`,async()=>{
  const f=await fixture();f.put('esma:0:nida');f.getHook(async key=>{if(mode==='replacement')f.c.ZIKIR.terkip.items=[...f.c.ZIKIR.terkip.items].reverse();else f.c.ZIKIR.terkip.items[0].tr+=' LABELLED changed';return f.personal.get(key)});stale(await f.inspect());
 });
 for(const mode of ['aborted','caller-retired'])await test(`A ${mode} held scan returns no stale rows or counts`,async()=>{
  const f=await fixture(),entered=defer(),release=defer(),controller=new AbortController();let current=true;f.put('esma:0:nida');f.getHook(async key=>{entered.resolve();await release.promise;return f.personal.get(key)});const pending=f.inspect({signal:controller.signal,isCurrent:()=>current});await bounded(entered.promise);if(mode==='aborted')controller.abort();else current=false;release.resolve();stale(await pending);
 });
 await test('A late foreign personal addition after initial keys is not published as a confirmed absence',async()=>{
  const f=await fixture(),original=f.core.inspectStored;f.c.SukunGenericRecordings={...f.core,inspectStored:async(...args)=>{const value=await original(...args);f.personal.set('esma:0:nida',new Blob(['LABELLED foreign addition'],{type:'audio/wav'}));return value;}};stale(await f.inspect());
 });
 await test('A foreign A-B-A generic replacement with identical final digest is rejected by its persisted revision without an incoming event',async()=>{
  const f=await fixture(),a=bank([record('esma:0:nida',Buffer.from('LABELLED A'),'audio/webm')]),b=bank([record('esma:0:nida',Buffer.from('LABELLED B'),'audio/webm')]);await f.import(a);const other=bankFixture(root,{disk:f.disk,storage:f.storage});await other.api.ready();const before=f.disk.get('sukunGenericRec').get('meta').get('bank'),firstId=before.bankId,firstRevision=before.revision,original=f.core.inspectStored;
  f.c.SukunGenericRecordings={...f.core,inspectStored:async(...args)=>{const value=await original(...args);await other.import(b);await other.import(a);return value;}};const initialEpoch=f.core.epoch(),events=f.history.events.length;stale(await f.inspect());const after=f.disk.get('sukunGenericRec').get('meta').get('bank');assert.equal(after.bankId,firstId);assert.equal(after.revision,firstRevision+2);assert.equal(f.core.epoch(),initialEpoch);assert.equal(f.history.events.length,events);
 });
 await test('Stored generic bytes are hash-verified while disabled and corruption never changes global archive status',async()=>{
  const f=await fixture();await f.import(bank([record('esma:0:nida',Buffer.from('LABELLED A'),'audio/webm')]));const clip=f.disk.get('sukunGenericRec').get('clips').get('esma:0:nida');clip.blob=new Blob(['LABELLED B'],{type:clip.blob.type});const before=f.baseline(),value=await f.inspect();assert.equal(row(value,'zikir:esma:0:nida').generic.state,'unavailable');assert.equal(value.counts.generic.present,0);assert.equal(value.counts.generic.enabled,false);f.passive(before);
 });
 await test('Generic stored inspection rejects a persisted revision change during sequential payload validation',async()=>{
  const f=await fixture();await f.import(bank([record('esma:0:nida')]));let changed=false;const value=await f.core.inspectStored(['esma:0:nida','esma:1:nida'],{onProgress(){if(!changed){changed=true;f.disk.get('sukunGenericRec').get('meta').get('bank').revision++;}}});assert(changed);assert.equal(value.status,'stale');assert.deepEqual(plain(value.rows),[]);
 });
 await test('Generic stored inspection retires a lock-unlock ABA even when the final grant is unchanged',async()=>{
  const f=await fixture();await f.import(bank([record('berhet:0')]));let changed=false;const value=await f.core.inspectStored(['berhet:0'],{onProgress(){if(!changed){changed=true;f.access(false);f.access(true);}}});assert(changed);assert.equal(value.status,'stale');assert.deepEqual(plain(value.rows),[]);
 });
 const sourceUnchanged=html===fs.readFileSync(path.join(root,'index.html'),'utf8')&&paths.every(name=>sources.get(name)===fs.readFileSync(path.join(root,name),'utf8')),testUnchanged=initialTestSha256===digest(fs.readFileSync(__filename));
 const report={suite:'r1094 independent exact-source matrix races',method:'Actual production canonical expressions, source catalog, r1092 visibility helper, r1094 matrix and generic core; controlled personal storage/IDB scheduling, labelled metadata voices and late settlements. No native concurrency, codec or hardware claim.',sourceSha256:Object.fromEntries(paths.map(name=>[name,digest(sources.get(name))])),indexSha256:digest(html),testSha256:initialTestSha256,sourceUnchanged,testUnchanged,passed:results.filter(item=>item.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total||!sourceUnchanged||!testUnchanged)process.exitCode=1;
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
