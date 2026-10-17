'use strict';
// Actual canonical catalog, form reader, privacy policy, source inspector and
// stored generic payload verifier. Native/storage boundaries are controlled.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture:bankFixture,record,bank,plain}=require('../r1055/generic-bank-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),core=fs.readFileSync(path.join(root,'index.html'),'utf8');
function block(start,end,from=0){const a=core.indexOf(start,from),b=core.indexOf(end,a+start.length);assert(a>=0&&b>a,start);return core.slice(a,b)}
const literal=block('const ZIKIR={','\n/* r980 — tempo'),forms=block('function esmaForms(it){','\nfunction syncFormSeg()'),tevhid=block('function tevhid99(){','\n/* ── Sesli zikir'),readingPolicy=block('window.SukunReadingPolicy=(()=>{','\n/* r1065: existing reading buttons');
const nameTts=block('function sukunNameTtsText(','\nfunction r476CanonicalItem()'),terkipPolicy=block('function sukunTerkipAllowed(x){','\nfunction virdAdimTemizle(v)');
const privacyStart=core.indexOf('<script id="r300-secret-access-policy">'),privacy=block('(()=>{','\n</script>',privacyStart);
const matrixCode=fs.readFileSync(path.join(root,'assets/runtime/source-matrix-r1094.js'),'utf8');
const results=[];async function test(name,work){try{await work();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:String(error.stack||error)})}}
function fixture({unlocked=true,genericEnabled=false}={}){
 const own=new Map(),revisions=new Map(),generic=new Map(),reads=[],keyReads=[],effects=[],listeners=new Map();let access=unlocked,settingsEpoch=0,archiveEpoch=0,archiveRevision=1;
 const forbidden=name=>()=>{effects.push(name);throw Error('Forbidden '+name)};
 const c={window:null,Blob,Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Date,Math,Promise,Error,AbortController,setTimeout,clearTimeout,
  Z:{cat:'esma',idx:0,form:'nida',count:17},SPK:{voice:{name:'Tolga',lang:'tr-TR',localService:true},arVoice:{name:'Arabic',lang:'ar-SA',localService:false},rate:.85,arRate:.7,arPitch:.76},
  I18N:{lang:'tr'},stripHarake:value=>String(value).replace(/[\u064b-\u065f]/g,''),zEbcedDegeri:()=>0,spkPitch:value=>value,
  KLT_ACIK:()=>access,RECKEYS:new Set(),SK_RECORDING_CATALOG:{sequence:0,verified:true,pending:false,error:''},
  REC_DB:{keys:async opt=>{keyReads.push(opt);return[...own.keys()]},get:async(key,opt)=>{reads.push(key);assert(opt.timeoutMs>0);return own.get(key)||null},revision:key=>revisions.get(key)||0,set:forbidden('personal write')},
  SukunVoiceSettings:{epoch:()=>settingsEpoch,getMode:()=> 'auto',getContent:()=> 'legacy'},
  SukunVoiceCatalog:{peek:lang=>lang==='ar'?c.SPK.arVoice:c.SPK.voice,resolve:forbidden('voice refresh')},
  SukunGenericRecordings:{epoch:()=>archiveEpoch,snapshot:()=>({enabled:genericEnabled}),inspectStored:async(keys,opt)=>{assert(opt.isCurrent());return{status:'ok',bankId:'a'.repeat(64),revision:archiveRevision,enabled:genericEnabled,rows:keys.map(key=>({key,state:generic.get(key)||'missing',reason:'fixture-observation'}))}},describeBank:async()=>({bankId:'a'.repeat(64),revision:archiveRevision,records:[]})},
  Audio:forbidden('audio element'),AudioContext:forbidden('audio context'),fetch:forbidden('network'),keyLabel:forbidden('keyLabel'),localStorage:{setItem:forbidden('settings write')},
  SukunTabOwner:{run:forbidden('playback owner'),maintenance:forbidden('maintenance')},sukunSourceSet:forbidden('source change'),
  speechSynthesis:{speak:forbidden('speech'),getVoices:forbidden('voice reload')},
  addEventListener(type,handler){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(handler)},
  dispatchEvent(event){for(const handler of listeners.get(event.type)||[])handler(event);return true},CustomEvent:class{constructor(type,opt){this.type=type;this.detail=opt?.detail}}
 };
 c.window=c;vm.createContext(c);vm.runInContext(literal+';window.ZIKIR=ZIKIR;const EMPH="حخصضطظعغقر";'+forms+tevhid+';tevhid99();',c);vm.runInContext(terkipPolicy,c);vm.runInContext(privacy,c);vm.runInContext(nameTts,c);vm.runInContext(readingPolicy,c);
 vm.runInContext(fs.readFileSync(path.join(root,'assets/runtime/reading-sources-r1064.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(root,'assets/runtime/session-preflight-r1092.js'),'utf8'),c);vm.runInContext(matrixCode,c);
 return{c,api:c.SukunSourceMatrixR1094,own,revisions,generic,reads,keyReads,effects,inspect:opt=>c.SukunSourceMatrixR1094.inspect(opt),event:type=>c.dispatchEvent(new c.CustomEvent(type)),setAccess(value){access=value;c.dispatchEvent(new c.CustomEvent('sukun:secretaccesschange'))},bumpSettings(){settingsEpoch++},bumpGeneric(){archiveEpoch++},bumpPersistedGeneric(){archiveRevision++},assertPassive(){assert.deepEqual(effects,[])}};
}
module.exports={fixture,root};
if(require.main===module)(async()=>{
 await test('full actual canonical catalog covers all381 valid slots without a256 cap or favorite duplication',async()=>{
  const f=fixture();f.c.ZIKIR.fav={items:[{_src:'esma',_i:0,tr:'favorite duplicate'}]};const result=await f.inspect();assert.equal(result.status,'ready');assert.equal(result.rows.length,381);assert.equal(result.counts.canonicalReadings,284);assert.equal(result.counts.validSlots,381);assert.equal(result.counts.uniqueNames,127);assert.equal(result.counts.unsupportedForms,2);assert.equal(result.rows.filter(row=>['esma','berhet'].includes(row.cat)).length,224);assert(result.rows.some(row=>row.id==='zikir:koruma:4'));assert(!result.rows.some(row=>row.cat==='fav'));assert.equal(f.keyReads.length,2);assert.equal(f.reads.length,0);f.assertPassive();
 });
 await test('unsupported tev forms never become missing recording burdens or Studio targets',async()=>{
  const f=fixture(),result=await f.inspect();for(const index of[83,84]){assert.equal(f.api.describeTarget(`zikir:esma:${index}:tev`),null);assert(!result.rows.some(row=>row.id===`zikir:esma:${index}:tev`));assert(result.rows.some(row=>row.id===`zikir:esma:${index}:nida`))}f.assertPassive();
 });
 await test('one observed nida file covers one exact form and one name, not both forms',async()=>{
  const f=fixture();f.own.set('esma:0:nida',new Blob(['personal'],{type:'audio/webm'}));const result=await f.inspect(),nida=result.rows.find(row=>row.id==='zikir:esma:0:nida'),tev=result.rows.find(row=>row.id==='zikir:esma:0:tev');assert.equal(nida.personal.state,'present');assert.equal(tev.personal.state,'missing');assert.equal(tev.personal.alternate,true);assert.equal(result.counts.personal.files,1);assert.equal(result.counts.personal.present,1);assert.equal(result.counts.personal.coveredNames,1);assert.equal(result.counts.personal.coveredReadings,1);assert.deepEqual(f.reads,['esma:0:nida']);f.assertPassive();
 });
 await test('bare legacy esma key is an ambiguous fallback and does not fill either exact form',async()=>{
  const f=fixture();f.own.set('esma:0',new Blob(['legacy'],{type:'audio/webm'}));const result=await f.inspect();for(const row of result.rows.filter(row=>row.cat==='esma'&&row.index===0)){assert.equal(row.personal.state,'missing');assert.equal(row.personal.legacy,true)}assert.equal(result.counts.personal.files,1);assert.equal(result.counts.personal.present,0);assert.equal(result.counts.personal.coveredNames,0);f.assertPassive();
 });
 for(const failure of['null','invalid','error'])await test(`listed but ${failure} personal storage is unavailable and not a missing row`,async()=>{
  const f=fixture();f.own.set('esma:0:nida',new Blob(['exists']));f.c.REC_DB.get=async key=>key==='esma:0:nida'?(failure==='error'?Promise.reject(Error('read denied')):failure==='invalid'?new Blob(['not audio'],{type:'text/plain'}):null):null;
  const result=await f.inspect(),row=result.rows.find(row=>row.id==='zikir:esma:0:nida');assert.equal(row.personal.state,'unavailable');assert(!result.rows.filter(row=>row.personal.state==='missing').includes(row));assert.equal(result.counts.personal.files,0);f.assertPassive();
 });
 await test('contradictory fresh empty key index makes ALL personal rows unavailable, not just the old known slot',async()=>{
  const f=fixture();f.c.RECKEYS.add('esma:0:nida');f.c.SK_RECORDING_CATALOG.error='RecordingCatalogMismatch';const result=await f.inspect();assert.equal(result.personalStatus,'unavailable');assert(result.rows.every(row=>row.personal.state==='unavailable'));assert.equal(result.rows.filter(row=>row.personal.state==='missing').length,0);assert.equal(result.counts.personal.missing,0);assert(f.c.RECKEYS.has('esma:0:nida'));f.assertPassive();
 });
 await test('inaccessible key index never produces a false missing filter',async()=>{
  const f=fixture();f.c.REC_DB.keys=async()=>{throw Object.assign(Error('PRIVATE ERROR DETAILS'),{name:'SecurityError'})};const result=await f.inspect();assert.equal(result.status,'attention');assert(result.rows.every(row=>row.personal.state==='unavailable'));assert.equal(result.counts.personal.missing,0);assert(!JSON.stringify(result).includes('PRIVATE ERROR DETAILS'));f.assertPassive();
 });
 await test('canonical labels and target descriptions never mutate the selected Z form or count',async()=>{
  const f=fixture();f.c.Z.form='tev';const before=plain(f.c.Z);Object.defineProperty(f.c.Z,'form',{get:()=> 'tev',set(){throw Error('form mutated')},configurable:true});const target=f.api.describeTarget('zikir:esma:0:nida');assert.equal(target.key,'esma:0:nida');assert.match(target.title,/Yâ/);await f.inspect();assert.deepEqual(plain(f.c.Z),before);f.assertPassive();
 });
 await test('locked matrix keeps353 public slots while protected shared source stays unknown with no private target',async()=>{
  const f=fixture({unlocked:false});f.own.set('berhet:0',new Blob(['private']));f.own.set('mzbz:berhetiyye',new Blob(['private']));const result=await f.inspect();assert.equal(result.rows.length,353);assert.equal(result.counts.canonicalReadings,256);assert.equal(result.counts.uniqueNames,99);assert.equal(result.rows.filter(row=>row.cat==='esma').length,196);assert(!result.rows.some(row=>row.cat==='berhet'));const shared=result.rows.find(row=>row.id==='zikir:arinma:8');assert(shared);assert.equal(shared.target.key,null);assert.equal(shared.personal.state,'unknown');assert.equal(shared.generic.reason,'source-locked');assert(!f.reads.some(key=>/^berhet:|^mzbz:/.test(key)));assert(!JSON.stringify(result).includes('mzbz:berhetiyye'));assert.equal(f.api.describeTarget('zikir:berhet:0'),null);f.assertPassive();
 });
 await test('locked custom terkip is gated by the actual canonical composition privacy policy before labels or keys',async()=>{
  const f=fixture({unlocked:false});f.c.ZIKIR.terkip.items.push({tr:'Yâ Berhet',ar:f.c.ZIKIR.berhet.items[0].ar});const id='zikir:terkip:24',step={type:'zikir',cat:'terkip',idx:24};assert.equal(f.c.SukunTerkipAllowed(step),false);assert.equal(f.c.SukunSecretPolicy.secretStep(step),false);assert.equal(f.api.describeTarget(id),null);assert.equal(f.api.isVisible(id),false);f.own.set('terkip:24',new Blob(['private'],{type:'audio/webm'}));const result=await f.inspect();assert(!result.rows.some(row=>row.id===id));assert(!f.reads.includes('terkip:24'));assert.equal(result.rows.length,353);f.setAccess(true);assert(f.api.describeTarget(id));const open=await f.inspect();assert(open.rows.some(row=>row.id===id));f.assertPassive();
 });
 await test('missing privacy dependency fails closed as attention instead of a completed empty catalog',async()=>{
  const f=fixture();f.c.SukunSessionPreflightR1092=null;const result=await f.inspect();assert.equal(result.status,'attention');assert.equal(result.reason,'catalog-unavailable');assert.equal(result.rows.length,0);assert.equal(f.keyReads.length,0);
 });
 await test('missing canonical source dependency cannot downgrade shared private keys or Esma form labels',async()=>{
  const f=fixture({unlocked:false});f.c.SukunReadingSourcesR1064=null;f.own.set('arinma:8',new Blob(['legacy alias'],{type:'audio/webm'}));assert.equal(f.api.describeTarget('zikir:arinma:8'),null);assert.equal(f.api.describeTarget('zikir:esma:0:tev'),null);const result=await f.inspect();assert.equal(result.status,'attention');assert.equal(result.reason,'catalog-unavailable');assert.equal(result.rows.length,0);assert.equal(f.reads.length,0);assert.equal(f.keyReads.length,0);f.assertPassive();
 });
 await test('late source result cannot survive a lock then unlock ABA transition',async()=>{
  const f=fixture();let release;f.c.REC_DB.keys=()=>new Promise(resolve=>release=resolve);const pending=f.inspect();for(let i=0;i<5&&!release;i++)await Promise.resolve();f.setAccess(false);f.setAccess(true);release([]);const result=await pending;assert.equal(result.status,'stale');assert.equal(result.rows.length,0);f.assertPassive();
 });
 await test('source catalog reorder or content edit while storage awaits retires every result',async()=>{
  for(const mutate of[f=>f.c.ZIKIR.terkip.items.reverse(),f=>{f.c.ZIKIR.temel.items[0].tr='Changed reading'}]){const f=fixture();let release;f.c.REC_DB.keys=()=>new Promise(resolve=>release=resolve);const pending=f.inspect();for(let i=0;i<5&&!release;i++)await Promise.resolve();mutate(f);release([]);const result=await pending;assert.equal(result.status,'stale');assert.equal(result.rows.length,0);f.assertPassive()}
 });
 await test('earlier personal key revision change during later read retires the complete matrix',async()=>{
  const f=fixture();f.own.set('esma:0:nida',new Blob(['first']));f.own.set('esma:1:nida',new Blob(['second']));const read=f.c.REC_DB.get;f.c.REC_DB.get=async(key,opt)=>{if(key==='esma:1:nida')f.revisions.set('esma:0:nida',1);return read(key,opt)};const result=await f.inspect();assert.equal(result.status,'stale');assert.equal(result.rows.length,0);f.assertPassive();
 });
 await test('a foreign personal key addition without a local event is caught by final relevant key membership',async()=>{
  const f=fixture();let first=true;const generic=f.c.SukunGenericRecordings.inspectStored;f.c.SukunGenericRecordings.inspectStored=async(keys,opt)=>{const value=await generic(keys,opt);if(first){first=false;f.own.set('esma:0:nida',new Blob(['foreign addition']))}return value};const result=await f.inspect();assert.equal(result.status,'stale');assert.equal(result.rows.length,0);f.assertPassive();
 });
 await test('foreign persisted generic revision without a storage event retires final matrix publication',async()=>{
  const f=fixture(),inspect=f.c.SukunGenericRecordings.inspectStored;f.c.SukunGenericRecordings.inspectStored=async(keys,opt)=>{const value=await inspect(keys,opt);f.bumpPersistedGeneric();return value};const result=await f.inspect();assert.equal(result.status,'stale');assert.equal(result.rows.length,0);f.assertPassive();
 });
 await test('dynamic user terkip catalog extends the matrix rather than using static284/381 counts',async()=>{
  const f=fixture();f.c.ZIKIR.terkip.items.push({tr:'Yâ Rahmân • Yâ Rahîm',ar:'يَا رَحْمَنُ يَا رَحِيمُ'});const result=await f.inspect();assert.equal(result.counts.canonicalReadings,285);assert.equal(result.counts.validSlots,382);assert(result.rows.some(row=>row.id==='zikir:terkip:24'));f.assertPassive();
 });
 await test('device cells describe existing voice/text metadata without promising offline synthesis',async()=>{
  const f=fixture(),result=await f.inspect(),row=result.rows.find(row=>row.id==='zikir:esma:0:nida');assert.equal(row.device.tr.state,'available');assert.equal(row.device.tr.metadataOnly,true);assert.equal(row.device.tr.offline,'device-dependent');assert.equal(row.device.ar.offline,'network-needed');assert.equal(result.rows.find(row=>row.id==='zikir:esma:0:tev').device.ar.reason,'arabic-text-unavailable');f.assertPassive();
 });
 await test('actual disabled generic inspection verifies stored bytes while leaving preference, bank status and personal stores untouched',async()=>{
  const f=fixture(),g=bankFixture(root);await g.api.ready();await g.import(bank([record('esma:0:nida')]));g.c.SukunSecretPolicy=f.c.SukunSecretPolicy;const before=plain(g.api.snapshot()),events=g.history.events.length,writes=g.history.lsWrites.length,commits=g.history.commits;f.c.SukunGenericRecordings=g.api;const result=await f.inspect();assert.equal(result.rows.find(row=>row.id==='zikir:esma:0:nida').generic.state,'present');assert.equal(result.rows.find(row=>row.id==='zikir:esma:0:tev').generic.state,'missing');assert.equal(result.counts.generic.files,1);assert.equal(result.counts.generic.present,1);assert.equal(result.counts.generic.enabled,false);assert.deepEqual(plain(g.api.snapshot()),before);assert.equal(g.history.events.length,events);assert.equal(g.history.lsWrites.length,writes);assert.equal(g.history.commits,commits);assert.equal(g.history.personalAccess.length,0);f.assertPassive();
 });
 await test('actual generic metadata without a matching valid blob cannot claim presence',async()=>{
  const g=bankFixture(root);await g.api.ready();await g.import(bank([record('esma:0:nida')]));const snapshot=plain(g.api.snapshot());g.disk.get('sukunGenericRec').get('clips').delete('esma:0:nida');const result=await g.api.inspectStored(['esma:0:nida']);assert.equal(result.rows[0].state,'unavailable');assert.equal(result.rows[0].reason,'archive-integrity');assert.deepEqual(plain(g.api.snapshot()),snapshot);
 });
 await test('actual generic same-size payload tamper fails SHA while only requested clips are inspected',async()=>{
  const g=bankFixture(root);await g.api.ready();await g.import(bank([record('esma:0:nida'),record('esma:1:nida')]));const clips=g.disk.get('sukunGenericRec').get('clips'),first=clips.get('esma:0:nida');first.blob=new Blob([Buffer.alloc(first.bytes)],{type:first.type});clips.get('esma:1:nida').blob.arrayBuffer=()=>{throw Error('unrequested clip bytes read')};const result=await g.api.inspectStored(['esma:0:nida']);assert.equal(result.rows.length,1);assert.equal(result.rows[0].state,'unavailable');assert.equal(result.rows[0].reason,'archive-integrity');
 });
 await test('actual generic key inspection detects authoritative foreign persisted revision change',async()=>{
  const g=bankFixture(root);await g.api.ready();await g.import(bank([record('esma:0:nida')]));let changed=false;const result=await g.api.inspectStored(['esma:0:nida'],{onProgress(){if(!changed){changed=true;const meta=g.disk.get('sukunGenericRec').get('meta'),bank=meta.get('bank');meta.set('bank',{...bank,revision:bank.revision+1})}}});assert.equal(result.status,'stale');assert.equal(result.rows.length,0);
 });
 await test('actual generic missing database after a positive receipt is unavailable rather than confirmed missing',async()=>{
  const g=bankFixture(root,{storage:new Map([['sukun.generic.recordings.bank.v1',JSON.stringify({bankId:'a'.repeat(64),count:10})]])});await g.api.ready();const result=await g.api.inspectStored(['esma:0:nida']);assert.equal(result.status,'unavailable');assert.equal(result.rows[0].state,'unavailable');assert.equal(result.rows[0].reason,'archive-catalog-unconfirmed');
 });
 const report={suite:'r1094 complete canonical source matrix',method:'Actual catalog/forms/privacy/reading policies and source matrix; matched personal Blob observations and actual disabled-independent generic bytes/type/SHA verifier with controlled native/storage leaves. No playback, codec audibility or physical-device claim.',passed:results.filter(row=>row.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
