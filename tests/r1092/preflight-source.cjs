'use strict';
// Evaluate production policies/helpers and the actual inspector. Recording and
// native boundaries are controlled; these checks do not claim audible playback.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const core=fs.readFileSync(path.join(root,'index.html'),'utf8'),runtime=fs.readFileSync(path.join(root,'assets/runtime/session-preflight-r1092.js'),'utf8');
const at=core.indexOf('<script id="r472-smart-session-source-runtime">');assert(at>=0);
function block(start,end,from=0){const a=core.indexOf(start,from),b=core.indexOf(end,a+start.length);assert(a>=0&&b>a,start);return core.slice(a,b)}
const legacy=block('const norm=s=>','let ttsSeq=0;',at),fallback=block('function sourceMode(step)','\nasync function resolveStep(step)',at);
const policy=block('window.SukunReadingPolicy=(()=>{','\n/* r1065: existing reading buttons');
const nameTts=block('function sukunNameTtsText(','\nfunction r476CanonicalItem()');
const priority=block('function currentForm(){','\nfunction hasKnown(cat,idx,item,opt={})',core.indexOf('<script id="r636-recording-priority-lock">'));
const results=[];
async function test(name,work){try{await work();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:String(error.stack||error)})}}
const plain=value=>JSON.parse(JSON.stringify(value));
function fixture({mode='auto',archive='disabled',localService=true}={}){
 const own=new Map(),revisions=new Map(),labels=new Map(),reads=[],genericReads=[],cacheReads=[],touches=[];let access=true,pref=0,bankEpoch=0;
 const tr={name:'Tolga male',lang:'tr-TR',localService},ar={name:'Maged male',lang:'ar-SA',localService};
 const items={esma:{items:[{t:'Rahmân',a:'الرَّحْمَٰنُ',aya:'يَا رَحْمَٰنُ',ya:'Yâ Rahmân',m:'Merhamet eden'},{t:'Rahîm',a:'الرَّحِيمُ',ya:'Yâ Rahîm'}]},temel:{items:[{tr:'Elhamdülillah',oku:'Elhamdülillah',ar:'الْحَمْدُ لِلَّهِ'}]},koruma:{items:[{tr:'Felak',oku:'Kul euzu',ar:'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ'}]},terkip:{items:[{tr:'Yâ Rahmân • Yâ Rahîm',oku:'Yâ Rahmân • Yâ Rahîm'}]},berhet:{items:[{get tr(){throw Error('protected title read')}}]}};
 const forbid=name=>()=>{touches.push(name);throw Error('forbidden '+name)};
 const c={window:null,Blob,Object,Array,Map,Set,String,Number,Math,Date,JSON,RegExp,Promise,AbortController,setTimeout,clearTimeout,
  ZIKIR:items,Z:{cat:'esma',idx:0,form:'nida'},RECKEYS:new Set(),SK_RECORDING_CATALOG:{error:''},SPK:{voice:tr,arVoice:ar,rate:.85,arRate:.7,arPitch:.76},I18N:{lang:'tr'},spkPitch:x=>x,
  SukunSecretPolicy:{unlocked:()=>access,secretStep:step=>!access&&step?.cat==='berhet',secretRecKey:key=>!access&&/^berhet:/.test(key)},
  // The fixture's sole composition is public. Missing/denied canonical
  // composition gates are exercised with actual production policy in r1094.
  SukunTerkipAllowed:step=>step?.cat==='terkip'&&Number(step.idx)===0,
  SukunVoiceSettings:{getMode:()=>mode,getContent:()=> 'arabic',epoch:()=>pref},
  SukunVoiceCatalog:{peek:lang=>lang==='ar'?c.SPK.arVoice:c.SPK.voice,resolve:forbid('voice refresh')},
  AudioResolver:{keyFor:(cat,index)=>cat==='esma'?`esma:${index}:nida`:`${cat}:${index}`,play:forbid('play'),has:forbid('has')},
  REC_DB:{revision:key=>revisions.get(key)||0,get:async(key,opt)=>{reads.push(key);assert(opt.timeoutMs>0);return own.get(key)||null},keys:async opt=>{assert(opt.timeoutMs>0);return [...own.keys()]}},
  keyLabel:key=>{if(/^berhet:/.test(key)&&!access)throw Error('protected key label read');return labels.get(key)||key},
  SukunGenericRecordings:{epoch:()=>bankEpoch,snapshot:()=>({enabled:archive!=='disabled'}),probe:async(keys,opt)=>{genericReads.push([...keys]);assert(opt.isCurrent());return{state:archive==='disabled'?'missing':archive,reason:archive==='unknown'?'archive-preparing':archive==='unavailable'?'archive-storage-unavailable':''}},find:forbid('archive find')},
  SukunReadingSourcesR1064:{forZikir:(cat,index)=>{const item=items[cat]?.items[index];return item?{id:`zikir:${cat}:${index}`,arabic:item.ar||item.a||'',verifiedArabic:item.ar||item.a||'',latin:item.oku||item.ya||item.tr||item.t||'',status:'verified',recordingContent:'unknown'}:null}},
  SukunBundledArabicR1065:{descriptor:entry=>entry?.id==='zikir:koruma:0'?{key:'falaq',url:'./assets/audio/arabic-r1065/falaq.mp3',sha256:'a'.repeat(64),bytes:10}:null,find:forbid('bundle fetch')},
  SukunPreflightCacheR1092:{inspect:async(row,current)=>{cacheReads.push(row.key);assert(current());return{state:'cached'}}},
  speechSynthesis:{getVoices:()=>[tr,ar],speak:forbid('speak'),cancel:forbid('cancel')},SpeechSynthesisUtterance:class{},
  Audio:forbid('Audio'),AudioContext:forbid('AudioContext'),fetch:forbid('fetch'),SukunTabOwner:{claim:forbid('claim'),run:forbid('run')},localStorage:{setItem:forbid('storage write')}
 };
 c.window=c;vm.createContext(c);vm.runInContext(nameTts,c);vm.runInContext(policy,c);vm.runInContext(legacy,c);vm.runInContext(fallback,c);
 vm.runInContext('const clean=v=>String(v==null?"":v).trim();'+priority+';window.SukunRecordingPriorityLock={candidates};',c);
 vm.runInContext('window.SukunSmartSessionSource={describeFallback,legacyCandidates:step=>preflightVisible(step)?candidateKeys(step.cat,step.idx,itemForStep(step)):[],matchesLegacyKey:(step,key)=>preflightVisible(step,key)&&matchesLegacyLabel(itemForStep(step),key)};',c);
 vm.runInContext(runtime,c,{filename:'session-preflight-r1092.js'});
 return{c,own,revisions,labels,reads,genericReads,cacheReads,touches,inspect:(queue=[{type:'zikir',cat:'esma',idx:0}],opt={})=>c.SukunSessionPreflightR1092.inspect(queue,opt),lock:()=>{access=false},bump:()=>pref++,bumpArchive:()=>bankEpoch++,setMode:value=>{mode=value},assertPassive(){assert.deepEqual(touches,[])}};
}
(async()=>{
 await test('actual priority candidates select personal recording before generic and keep raw keys/audio private',async()=>{
  const f=fixture({archive:'present'});f.own.set('esma:0:nida',new Blob(['own'],{type:'audio/wav'}));const r=await f.inspect();assert.equal(r.rows[0].source,'personal');assert.equal(r.rows[0].availability,'local');assert.equal(f.genericReads.length,0);assert(!JSON.stringify(r).includes('esma:0:nida'));assert(!JSON.stringify(r).includes('blob'));f.assertPassive();
 });
 await test('enabled validated generic source is selected only after every personal candidate is absent',async()=>{
  const f=fixture({archive:'present'}),r=await f.inspect();assert.equal(r.rows[0].source,'generic');assert.equal(r.rows[0].availability,'local');assert(f.reads.includes('esma:0:nida'));assert.equal(f.genericReads.length,1);f.assertPassive();
 });
 await test('personal storage error is unavailable and cannot open generic or device fallback',async()=>{
  const f=fixture({archive:'present'});f.c.REC_DB.get=async()=>{throw Object.assign(Error('PRIVATE DETAILS'),{name:'SecurityError'})};const r=await f.inspect();assert.equal(r.rows[0].source,'unavailable');assert.equal(f.genericReads.length,0);assert(!JSON.stringify(r).includes('PRIVATE DETAILS'));f.assertPassive();
 });
 await test('a contradictory known-missing catalog stays unavailable without editing its known keys',async()=>{
  const f=fixture({archive:'present'});f.c.RECKEYS.add('esma:0:nida');f.c.SK_RECORDING_CATALOG.error='RecordingCatalogMismatch';const r=await f.inspect();assert.equal(r.rows[0].source,'unavailable');assert.equal(r.rows[0].reason,'recording-catalog-unconfirmed');assert(f.c.RECKEYS.has('esma:0:nida'));assert.equal(f.genericReads.length,0);
 });
 await test('catalog mismatch still admits a later valid form using actual production candidate order',async()=>{
  const f=fixture({archive:'present'});f.c.RECKEYS.add('esma:0:nida');f.c.RECKEYS.add('esma:0:tev');f.c.SK_RECORDING_CATALOG.error='RecordingCatalogMismatch';f.own.set('esma:0:tev',new Blob(['same-name-alternative'],{type:'audio/wav'}));
  const r=await f.inspect();assert.equal(r.rows[0].source,'personal');assert.equal(r.rows[0].availability,'local');assert(f.reads.indexOf('esma:0:nida')<f.reads.indexOf('esma:0:tev'));assert.equal(f.genericReads.length,0);assert(f.c.RECKEYS.has('esma:0:nida'));f.assertPassive();
 });
 await test('verified bundle cache has protective priority and no recording/network side effect',async()=>{
  const f=fixture({archive:'present'}),r=await f.inspect([{type:'zikir',cat:'koruma',idx:0}]);assert.equal(r.rows[0].source,'bundled');assert.equal(r.rows[0].availability,'cached');assert.deepEqual(f.cacheReads,['falaq']);assert.equal(f.reads.length,0);f.assertPassive();
 });
 for(const [state,availability]of[['not-cached','network-needed'],['unavailable','unknown']])await test(`bundle cache ${state} is reported without downloading or claiming offline readiness`,async()=>{
  const f=fixture();f.c.SukunPreflightCacheR1092.inspect=async()=>({state});const r=await f.inspect([{type:'zikir',cat:'koruma',idx:0}]);assert.equal(r.rows[0].source,'bundled');assert.equal(r.rows[0].availability,availability);assert.equal(r.status,'attention');f.assertPassive();
 });
 for(const archive of['unknown','unavailable'])await test(`generic ${archive} cannot become proof of missing audio or device fallback`,async()=>{
  const f=fixture({archive}),r=await f.inspect();assert.equal(r.rows[0].source,archive);assert.equal(r.rows[0].availability,archive);f.assertPassive();
 });
 for(const mode of['personal','generic'])await test(`explicit ${mode}-only missing remains blocked instead of reaching device speech`,async()=>{
  const f=fixture({mode,archive:'missing'});f.c.SukunSmartSessionSource.describeFallback=()=>{throw Error('fallback forbidden')};const r=await f.inspect();assert.equal(r.rows[0].source,'missing');assert.equal(r.rows[0].availability,'unavailable');assert.equal(r.rows[0].reason,'recording-required');f.assertPassive();
 });
 for(const mode of['arabic','turkish'])await test(`explicit ${mode} shares production fallback plan without recording probes or voice refresh`,async()=>{
  const f=fixture({mode});f.c.REC_DB.get=()=>{throw Error('recording forbidden')};const r=await f.inspect();assert.equal(r.rows[0].source,'device');assert.equal(r.rows[0].availability,'device-dependent');const descriptor=f.c.SukunSmartSessionSource.describeFallback({type:'zikir',cat:'esma',idx:0});assert.match(descriptor.lang,mode==='arabic'?/^ar/:/^tr/);assert.equal(f.genericReads.length,0);f.assertPassive();
 });
 await test('missing Arabic device voice stays unavailable rather than a false missing recording',async()=>{
  const f=fixture({mode:'arabic'});f.c.SPK.arVoice=null;const r=await f.inspect();assert.equal(r.rows[0].source,'unavailable');assert.equal(r.rows[0].reason,'arabic-voice-unavailable');f.assertPassive();
 });
 for(const [localService,availability]of[[true,'device-dependent'],[false,'network-needed'],[undefined,'device-dependent']])await test(`device localService ${localService} does not certify synthesis works offline`,async()=>{
  const f=fixture({localService}),r=await f.inspect();assert.equal(r.rows[0].source,'device');assert.equal(r.rows[0].availability,availability);assert.equal(r.status,'attention');f.assertPassive();
 });
 await test('the production legacy fuzzy-key matcher admits an old personal clip after direct/archive absence',async()=>{
  const f=fixture();f.own.set('legacy:other:slot',new Blob(['legacy'],{type:'audio/webm'}));f.labels.set('legacy:other:slot','Rahmân');const r=await f.inspect();assert.equal(r.rows[0].source,'personal');assert(f.reads.includes('legacy:other:slot'));f.assertPassive();
 });
 await test('legacy key listing failure is unavailable, not proof of a TTS fallback',async()=>{
  const f=fixture();f.c.REC_DB.keys=async()=>{throw Error('disk denied')};const r=await f.inspect();assert.equal(r.rows[0].source,'unavailable');f.assertPassive();
 });
 await test('locked rows are discarded before catalog title getters or recording keys are inspected',async()=>{
  const f=fixture();f.lock();const r=await f.inspect([{type:'zikir',cat:'berhet',idx:0},{type:'silence',ms:1000}]);assert.equal(r.rows.length,1);assert.equal(r.rows[0].index,1);assert.equal(r.rows[0].source,'silence');assert.equal(f.reads.length,0);assert.equal(f.cacheReads.length,0);assert(!JSON.stringify(r).includes('berhet'));f.assertPassive();
 });
 await test('locked favorite aliases are omitted before protected titles or source keys are read',async()=>{
  const f=fixture();f.c.ZIKIR.fav={items:[{_src:'berhet',_i:0,get tr(){throw Error('protected favorite title read')}}]};f.lock();
  const step={type:'zikir',cat:'fav',idx:0};assert.equal(f.c.SukunSessionPreflightR1092.isVisible(step),false);const r=await f.inspect([step,{type:'frequency',c:40}]);assert.equal(r.rows.length,1);assert.equal(r.rows[0].index,1);assert.equal(f.reads.length,0);f.assertPassive();
 });
 await test('nested favorite aliases and cycles are checked without opening protected labels',async()=>{
  const f=fixture();f.c.ZIKIR.fav={items:[{_src:'fav',_i:1},{_src:'berhet',_i:0},{_src:'fav',_i:2,get tr(){throw Error('cycle title read')}}]};f.lock();
  const r=await f.inspect([{type:'zikir',cat:'fav',idx:0},{type:'zikir',cat:'fav',idx:2}]);assert.deepEqual(plain(r.rows),[]);assert.equal(f.reads.length,0);f.assertPassive();
 });
 await test('secret recording labels are never read while searching legacy aliases',async()=>{
  const f=fixture();f.lock();f.own.set('berhet:0',new Blob(['private']));const r=await f.inspect();assert.equal(r.rows[0].source,'device');assert(!f.reads.includes('berhet:0'));f.assertPassive();
 });
 await test('relocking while a source read is pending drops every returned title and result',async()=>{
  const f=fixture();f.c.ZIKIR.berhet.items[0]={tr:'Protected name',ar:'اسم'};let release;f.c.REC_DB.get=()=>new Promise(resolve=>release=resolve);const p=f.inspect([{type:'zikir',cat:'berhet',idx:0}]);for(let i=0;i<8&&!release;i++)await Promise.resolve();assert(release);f.lock();release(new Blob(['late']));const r=await p;assert.equal(r.status,'stale');assert.deepEqual(plain(r.rows),[]);f.assertPassive();
 });
 await test('favorite alias read cannot publish its protected title after access is revoked',async()=>{
  const f=fixture();f.c.ZIKIR.berhet.items[0]={tr:'PRIVATE FAVORITE'};f.c.ZIKIR.fav={items:[{_src:'berhet',_i:0,tr:'PRIVATE FAVORITE'}]};let release;f.c.REC_DB.get=()=>new Promise(resolve=>release=resolve);const p=f.inspect([{type:'zikir',cat:'fav',idx:0}]);for(let i=0;i<8&&!release;i++)await Promise.resolve();assert(release);f.lock();release(new Blob(['late']));const r=await p;assert.equal(r.status,'stale');assert(!JSON.stringify(r).includes('PRIVATE FAVORITE'));assert.deepEqual(plain(r.rows),[]);f.assertPassive();
 });
 await test('source revision changes during read retire the entire plan without lower-priority fallback',async()=>{
  const f=fixture({archive:'present'});f.c.REC_DB.get=async key=>{f.revisions.set(key,1);return new Blob(['new'])};const r=await f.inspect();assert.equal(r.status,'stale');assert.deepEqual(plain(r.rows),[]);assert.equal(f.genericReads.length,0);
 });
 await test('queue edit or caller retirement fences stale results without a playback command',async()=>{
  const f=fixture(),queue=[{type:'zikir',cat:'esma',idx:0}];f.c.REC_DB.get=async()=>{queue[0].idx=1;return null};const r=await f.inspect(queue);assert.equal(r.status,'stale');assert.deepEqual(plain(r.rows),[]);assert.equal((await f.inspect(queue,{isCurrent:()=>false})).status,'stale');f.assertPassive();
 });
 await test('repeated rows reuse local reads but retain separate public queue indexes',async()=>{
  const f=fixture();f.own.set('esma:0:nida',new Blob(['same']));const step={type:'zikir',cat:'esma',idx:0},r=await f.inspect([step,{...step}]);assert.equal(r.rows.length,2);assert.deepEqual(plain(r.rows.map(x=>x.index)),[0,1]);assert.deepEqual(f.reads,['esma:0:nida']);f.assertPassive();
 });
 await test('repeated generic rows share one readonly payload and integrity probe per inspection',async()=>{
  const f=fixture({archive:'present'}),queue=Array.from({length:16},()=>({type:'zikir',cat:'esma',idx:0})),r=await f.inspect(queue);assert.equal(r.rows.length,16);assert(r.rows.every(x=>x.source==='generic'));assert.equal(f.genericReads.length,1);f.assertPassive();
 });
 await test('frequency, silence, invalid source and multipart uncertainty never start media',async()=>{
  const f=fixture(),r=await f.inspect([{type:'frequency',c:528},{type:'silence',ms:1000},{type:'zikir',cat:'esma',idx:null},{type:'zikir',cat:'terkip',idx:0}]);assert.deepEqual(plain(r.rows.map(x=>x.source)),['frequency','silence','missing','unknown']);assert.equal(r.rows[1].availability,'unknown');assert.equal(r.rows[1].reason,'silence-announcement-unverified');assert.equal(f.reads.length,0);f.assertPassive();
 });
 await test('an earlier local row is retired when its recording changes during a later row read',async()=>{
  const f=fixture();f.own.set('esma:0:nida',new Blob(['first']));const original=f.c.REC_DB.get;f.c.REC_DB.get=async(key,opt)=>{if(key==='esma:1:nida')f.revisions.set('esma:0:nida',1);return original(key,opt)};
  const r=await f.inspect([{type:'zikir',cat:'esma',idx:0},{type:'zikir',cat:'esma',idx:1}]);assert.equal(r.status,'stale');assert.deepEqual(plain(r.rows),[]);f.assertPassive();
 });
 // Test the real generic probe as well: its failure path must not publish a
 // new global archive error or acquire a maintenance/playback owner.
 const {fixture:bankFixture,record,bank}=require('../r1055/generic-bank-fixture.cjs');
 await test('real generic probe verifies payload in readonly storage without changing status, epoch, events or persisted data',async()=>{
  const f=bankFixture(root);await f.api.ready();await f.import(bank([record('temel:0')]));await f.api.setEnabled(true);
  const before={snapshot:plain(f.api.snapshot()),events:f.history.events.length,writes:f.history.lsWrites.length,commits:f.history.commits,maintenance:f.history.maintenance.length,transactions:f.history.transactions.length};
  const r=await f.api.probe(['temel:0'],{timeoutMs:1000});assert.equal(r.state,'present');assert.deepEqual(plain(f.api.snapshot()),before.snapshot);assert.equal(f.history.events.length,before.events);assert.equal(f.history.lsWrites.length,before.writes);assert.equal(f.history.commits,before.commits);assert.equal(f.history.maintenance.length,before.maintenance);assert(f.history.transactions.slice(before.transactions).every(x=>x.mode==='readonly'));assert.equal(f.history.personalAccess.length,0);
 });
 await test('real generic corrupt or inaccessible payload is unavailable without publishing a global archive failure',async()=>{
  const f=bankFixture(root);await f.api.ready();await f.import(bank([record('temel:0')]));await f.api.setEnabled(true);const before=plain(f.api.snapshot()),events=f.history.events.length;
  f.disk.get('sukunGenericRec').get('clips').get('temel:0').blob=new Blob(['broken'],{type:'audio/wav'});
  assert.equal((await f.api.probe(['temel:0'])).state,'unavailable');assert.deepEqual(plain(f.api.snapshot()),before);assert.equal(f.history.events.length,events);
  f.faults.readError=true;assert.equal((await f.api.probe(['temel:0'])).state,'unavailable');assert.deepEqual(plain(f.api.snapshot()),before);assert.equal(f.history.events.length,events);
 });
 await test('real generic bootstrap is unknown until existing metadata hydration finishes',async()=>{
  const f=bankFixture(root,{storage:new Map([['sukun.generic.recordings.enabled.v1','true']])});const early=await f.api.probe(['temel:0']);assert.equal(early.state,'unknown');assert.equal(early.reason,'archive-preparing');await f.api.ready();assert.equal((await f.api.probe(['temel:0'])).state,'missing');
 });
 const report={suite:'r1092 passive session source preflight',method:'Actual production source policy, priority candidates, legacy matcher, shared fallback and generic storage probe with controlled native/storage interfaces; no physical playback or Android lock claim',passed:results.filter(x=>x.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
