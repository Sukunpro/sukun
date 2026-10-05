'use strict';
// Full production collector/presenter, synthetic cached inspections only. No real data.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const collector=fs.readFileSync(path.join(root,'assets/runtime/health-r940.js'),'utf8');
const presenter=fs.readFileSync(path.join(root,'assets/runtime/health-view-r943.js'),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const observation=(count=3,blobBytes=2048,overrides={})=>({at:1791200000000,build:'r1017',status:'ok',count,blobBytes,errorCode:null,...overrides});
const snapshot=(overrides={})=>({version:'r1017',phase:'idle',current:observation(),lastSuccessful:observation(),persistence:'available',...overrides});
function harness(data=snapshot(),lang='en'){
 let cached=data,timerId=0;
 const actions={},store=new Map(),blobs=[],downloads=[],timers=new Map();
 const hit=key=>actions[key]=(actions[key]||0)+1,deny=key=>()=>{hit(key);throw Error('Forbidden '+key);};
 class URLApi extends URL{static createObjectURL(blob){hit('blob');blobs.push(blob);return 'blob:synthetic';}static revokeObjectURL(){hit('revoke');}}
 const c={console,URL:URLApi,TextEncoder,TextDecoder,Blob,JSON,Math,Date,Promise,AbortController,DOMException,Uint8Array,
  navigator:{onLine:false,serviceWorker:{controller:null,addEventListener(){}}},location:{href:'https://fixture.invalid/nero.html',origin:'https://fixture.invalid'},performance:{now:()=>100,getEntriesByType:()=>[]},
  document:{readyState:'loading',hidden:false,wasDiscarded:false,querySelector(s){hit('dom');return s==='meta[name="sukun-build"]'?{content:'r1017'}:null;},getElementById(){hit('dom');return null;},querySelectorAll:deny('scan'),addEventListener(){},createElement(tag){hit('create');assert.equal(tag,'a');return{click(){hit('click');downloads.push(this.download);},remove(){hit('remove');}};},body:{append(){hit('append');}}},
  localStorage:{getItem(k){hit('storageRead');return store.get(k)||null;},setItem(k,v){hit('storageWrite');store.set(k,String(v));}},
  sessionStorage:{getItem(k){hit('storageRead');return store.get(k)||null;},setItem(k,v){hit('storageWrite');store.set(k,String(v));}},
  indexedDB:{open:deny('dbOpen'),databases:deny('dbList'),deleteDatabase:deny('dbDelete')},
  fetch:deny('network'),setTimeout(fn,ms){hit('timer');timers.set(++timerId,{fn,ms});return timerId;},clearTimeout(id){timers.delete(id);},setInterval:deny('interval'),requestAnimationFrame:deny('raf'),addEventListener(){},
  SukunRecordingInspection:{snapshot(){hit('snapshot');return cached;},inspect:deny('inspect')},
  SukunRecordingUpdateDiagnostics:{snapshot:()=>null,beforeUpdate:deny('collect'),afterUpdate:deny('collect')},
  SukunRecordingContinuity:{snapshot:deny('legacyAudio'),resume:deny('legacyAudio')},
  SukunRecordingPreparation:{prepare:deny('prepare')},SukunAIRouter:{complete:deny('ai')},I18N:{lang}};
 c.window=c;vm.createContext(c);vm.runInContext(collector,c,{filename:'health-r940.js'});vm.runInContext(presenter,c,{filename:'health-view-r943.js'});Object.keys(actions).forEach(k=>actions[k]=0);
 return {c,actions,store,blobs,downloads,timers,api:c.SukunHealthR940,view:c.SukunHealthViewR943,set:v=>cached=v};
}
// Explicit sibling dependency; copied with this suite for reproducible packaging.
const uiHarness=require('./health_ui_fixture.cjs')(root);
const row=r=>r.checks.find(x=>x.code==='RECORDING_INSPECTION');
const presented=(h,r)=>h.view.summarize(r).areas.find(x=>x.id==='storage').checks.find(x=>x.code==='RECORDING_INSPECTION');
function passive(h){for(const key of ['storageRead','storageWrite','dbOpen','dbList','dbDelete','network','collect','inspect','prepare','ai','legacyAudio','timer','interval','raf','dom','scan','create'])assert.equal(h.actions[key]||0,0,key+' must remain passive');}
const errors=['idb-unavailable','db-missing','store-missing','db-blocked','db-open-failed','read-failed','read-aborted','read-timeout','inspection-cancelled','invalid-record','unsafe-total','SecurityError','VersionError','UnknownError','InvalidStateError','QuotaExceededError','AbortError'];
const bad=(status='unavailable',errorCode='read-failed',overrides={})=>observation(null,null,{at:1791201000000,status,errorCode,...overrides});
const results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.stack});}}
(async()=>{
 await test('standalone cached owner is copied once; read and presenters cannot inspect, read DB or scan DOM',()=>{
  const input=freeze(snapshot()),before=JSON.stringify(input),h=harness(input),r=h.api.read();
  h.view.summarize(r);h.view.plainReport(r);h.view.aiPayload(r);h.view.reportKey(r);
  assert.equal(h.actions.snapshot,1);assert.equal(JSON.stringify(input),before);assert.equal(row(r).status,'OBSERVED');assert.equal(r.current.recordingInspection.current.count,3);passive(h);
 });
 await test('no owner or throwing owner stays unknown with no legacy fallback',()=>{
  const h=harness();delete h.c.SukunRecordingInspection;assert.equal(h.api.read().current.recordingInspection,null);assert.equal(row(h.api.read()),undefined);passive(h);
  const failed=harness();failed.c.SukunRecordingInspection.snapshot=()=>{throw Error('PRIVATE_SENTINEL')};const r=failed.api.read();assert.equal(row(r).status,'NOT_MEASURED');assert.equal(row(r).evidence.current,null);assert(!JSON.stringify(r).includes('PRIVATE_SENTINEL'));passive(failed);
 });
 await test('true empty observation displays zero with timestamp and build, never content verification',()=>{
  const h=harness(snapshot({current:observation(0,0),lastSuccessful:observation(0,0)})),r=h.api.read(),v=presented(h,r);
  assert.equal(row(r).evidence.current.count,0);assert.equal(row(r).evidence.current.blobBytes,0);assert.equal(v.status,'OBSERVED');assert.match(v.detail,/0 recordings · 0 bytes/);assert.match(v.detail,/2026-10-05T11:33:20.000Z/);assert.match(v.detail,/Build: r1017/);assert.match(v.detail,/do not verify deletion, recovery or audio contents/);assert.match(v.detail,/This report starts no new read/);passive(h);
 });
 await test('no completed observation is unknown, never zero or a successful check',()=>{
  const h=harness(snapshot({current:null,lastSuccessful:null})),r=h.api.read(),v=presented(h,r);assert.equal(row(r).status,'NOT_MEASURED');assert.equal(v.status,'NOT_MEASURED');assert.match(v.detail,/No completed inspection yet; recording count and size unknown/);assert(!v.detail.includes('0 recordings'));passive(h);
 });
 const statuses={'missing':'db-missing',unsupported:'idb-unavailable',unavailable:'read-failed','timed-out':'read-timeout',cancelled:'inspection-cancelled',blocked:'db-blocked'};
 for(const [state,code] of Object.entries(statuses))await test(state+' displays unknown current totals and historical success separately',()=>{
  const h=harness(snapshot({current:bad(state,code,{count:0,blobBytes:0})})),r=h.api.read(),v=presented(h,r);
  assert.equal(row(r).status,'NOT_MEASURED');assert.equal(row(r).evidence.current.count,null);assert.equal(row(r).evidence.current.blobBytes,null);assert.equal(row(r).evidence.current.errorCode,code);assert.equal(v.status,'NOT_MEASURED');assert.match(v.detail,/Latest completed request: Time: .*Recording count and size unknown/);assert.match(v.detail,/Last successful observation \(historical\): .*3 recordings · 2048 bytes/);assert(!v.detail.includes('0 recordings'));assert(v.detail.includes(code));passive(h);
 });
 for(const code of errors)await test('fixed error '+code+' is bounded and does not turn supplied zero into a measurement',()=>{
  const h=harness(snapshot({current:bad('unavailable',code,{count:0,blobBytes:0})})),r=h.api.read();assert.equal(row(r).evidence.current.errorCode,code);assert.equal(row(r).evidence.current.count,null);assert.equal(presented(h,r).status,'NOT_MEASURED');assert(presented(h,r).detail.includes(code));passive(h);
 });
 await test('reading preserves timestamped completed observations without claiming a new measurement',()=>{
  const h=harness(snapshot({phase:'reading'})),r=h.api.read(),v=presented(h,r);assert.equal(row(r).status,'NOT_MEASURED');assert.equal(v.status,'NOT_MEASURED');assert.equal(row(r).evidence.current.at,1791200000000);assert.match(v.detail,/A new inspection is running; completed observations below have not been refreshed/);assert.match(v.detail,/Last successful observation \(historical\)/);passive(h);
 });
 await test('clock reversal retains both timestamps without inferring loss, recovery or ordering',()=>{
  const input=snapshot({current:bad('cancelled','inspection-cancelled',{at:1791190000000}),lastSuccessful:observation(7,7000,{at:1791200000000,build:'r1016'})}),h=harness(input),r=h.api.read(),v=presented(h,r);
  assert.equal(row(r).evidence.lastSuccessful.at,1791200000000);assert.match(v.detail,/Build: r1016/);assert.match(v.detail,/Last successful observation \(historical\): .*7 recordings · 7000 bytes/);assert.equal(v.status,'NOT_MEASURED');assert(!/counts differ|deleted recordings|recovered recordings|newer successful/i.test(v.detail));passive(h);
 });
 await test('numeric strings, missing, negative, fractional and unsafe totals remain unknown',()=>{
  for(const invalid of [null,undefined,'0',false,NaN,Infinity,-1,1.5,Number.MAX_SAFE_INTEGER+1])for(const field of ['count','blobBytes']){
   const h=harness(snapshot({current:observation(0,0,{[field]:invalid}),lastSuccessful:null})),r=h.api.read(),v=presented(h,r);assert.equal(row(r).evidence.current.count,null);assert.equal(row(r).evidence.current.blobBytes,null);assert.equal(row(r).status,'NOT_MEASURED');assert.equal(v.status,'NOT_MEASURED');assert(!v.detail.includes('0 recordings'));passive(h);
  }
 });
 await test('success with any non-null error cannot pass and unexpected codes use fixed unknown',()=>{
  for(const errorCode of [undefined,'PRIVATE_SENTINEL','timeout','missing-store','cancelled','read-failed',0,{},false]){
   const h=harness(snapshot({current:observation(0,0,{errorCode}),lastSuccessful:null})),r=h.api.read();assert.equal(row(r).evidence.current.status,'unavailable');assert.equal(row(r).evidence.current.count,null);assert.equal(row(r).evidence.current.errorCode,errorCode==='read-failed'?'read-failed':'unknown');assert(!JSON.stringify(r).includes('PRIVATE_SENTINEL'));passive(h);
  }
 });
 await test('only exact fixed fields enter a bounded local report; payloads, names and identifiers are dropped',()=>{
  const secret='PRIVATE_SENTINEL',o=observation(3,2048,{at:secret,build:secret,key:secret,name:secret,url:'https://'+secret,voice:secret,payload:secret,message:secret,reason:secret,history:Array(10000).fill(secret)}),input=snapshot({version:secret,phase:secret,current:o,lastSuccessful:o,persistence:secret,history:Array(10000).fill(o)}),h=harness(input),r=h.api.read(),e=row(r).evidence;
  assert.deepEqual(Object.keys(e).sort(),['current','lastSuccessful','persistence','phase','version']);assert.deepEqual(Object.keys(e.current).sort(),['at','blobBytes','build','count','errorCode','status']);assert.equal(e.current.at,null);assert.equal(e.current.build,null);assert.equal(e.version,null);assert.equal(e.phase,'unknown');assert(JSON.stringify(e).length<700);for(const text of [JSON.stringify(r),h.view.plainReport(r),JSON.stringify(h.view.summarize(r))])assert(!text.includes(secret));assert.match(presented(h,r).detail,/Time: unknown · Build: unknown/);passive(h);
 });
 await test('arrays, hostile fields, invalid enums and malformed roots do not break report or leak input',()=>{
  for(const input of [null,[],[snapshot()],false,'PRIVATE_SENTINEL',{phase:'PRIVATE_SENTINEL',current:[]},Object.defineProperty({},'current',{get(){throw Error('PRIVATE_SENTINEL')}})]){
   const h=harness(input),r=h.api.read();assert.equal(row(r).status,'NOT_MEASURED');assert(!JSON.stringify(r).includes('PRIVATE_SENTINEL'));const v=presented(h,{checks:[{code:'RECORDING_INSPECTION',status:'PASS',evidence:input}]});assert.equal(v.status,'NOT_MEASURED');assert(!JSON.stringify(v).includes('PRIVATE_SENTINEL'));passive(h);
  }
 });
 await test('presenter independently rejects unsafe evidence and forged PASS',()=>{
  const h=harness();for(const input of [snapshot({current:bad('missing','db-missing',{count:0,blobBytes:0}),lastSuccessful:bad()}),snapshot({current:observation(null,null),lastSuccessful:null}),snapshot({current:observation(0,0,{errorCode:'PRIVATE_SENTINEL'}),lastSuccessful:null}),snapshot({phase:'reading'})]){
   const v=presented(h,{checks:[{code:'RECORDING_INSPECTION',status:'PASS',evidence:input}]});assert.equal(v.status,'NOT_MEASURED');assert(!v.detail.includes('PRIVATE_SENTINEL'));
  }passive(h);
 });
 await test('failed historical observation is discarded rather than claimed successful',()=>{
  const h=harness(snapshot({current:bad(),lastSuccessful:bad('blocked','db-blocked',{count:9,blobBytes:99})})),r=h.api.read(),v=presented(h,r);assert.equal(row(r).evidence.lastSuccessful,null);assert.match(v.detail,/No historical successful observation/);assert(!v.detail.includes('9 recordings'));passive(h);
 });
 await test('local storage persistence failure is separate from successful current metadata',()=>{
  const h=harness(snapshot({persistence:'unavailable'})),r=h.api.read(),v=presented(h,r);assert.equal(v.status,'OBSERVED');assert.match(v.detail,/may not be retained for the next launch/);assert.match(v.detail,/Local report only; excluded from AI/);passive(h);
 });
 await test('refresh uses new owner snapshot without retaining it in event history or checkpoints',()=>{
  const h=harness(),first=h.api.read(),saved=JSON.stringify([...h.store]);h.set(snapshot({current:bad(),lastSuccessful:observation()}));const next=h.api.read();assert.equal(row(next).status,'NOT_MEASURED');assert.deepEqual(plain(first.timeline),plain(next.timeline));assert.equal(saved,JSON.stringify([...h.store]));assert.equal(h.actions.snapshot,2);assert(!JSON.stringify(next.timeline).includes('recordingInspection'));assert(!saved.includes('recordingInspection'));passive(h);
 });
 await test('problem markers and their persisted context do not duplicate inspection history',()=>{
  const h=harness(snapshot({current:observation(918273,918273000)})),r=h.api.mark('audio'),saved=JSON.stringify([...h.store]);
  assert(r.timeline.some(x=>x.kind==='user-problem-marker'));assert(!JSON.stringify(r.timeline).includes('recordingInspection'));assert(!saved.includes('recordingInspection'));assert(!saved.includes('918273'));for(const key of ['inspect','dbOpen','dbList','dbDelete','collect','prepare','ai'])assert.equal(h.actions[key]||0,0,key);
 });
 await test('AI payload, aggregate counts, areas and report key are unchanged by any local inspection status',()=>{
  const h=harness(),base=h.api.read();base.checks=base.checks.filter(x=>x.code!=='RECORDING_INSPECTION');const expected=JSON.stringify(h.view.aiPayload(base)),key=h.view.reportKey(base);
  for(const state of ['ok',...Object.keys(statuses)])for(const phase of ['idle','reading']){
   const e=snapshot({phase,current:state==='ok'?observation(918273,918273000):bad(state,statuses[state]),lastSuccessful:observation(123456,123456000)}),r=plain(base);r.current.recordingInspection=e;r.summary={currentFailures:999,currentWarnings:999,unmeasured:999};r.checks.push({code:'RECORDING_INSPECTION',status:'FAIL',evidence:e});
   assert.equal(JSON.stringify(h.view.aiPayload(r)),expected,state+'/'+phase);assert.equal(h.view.reportKey(r),key,state+'/'+phase);assert(!JSON.stringify(h.view.aiPayload(r)).includes('918273'));assert(!JSON.stringify(h.view.aiPayload(r)).includes('RECORDING_INSPECTION'));
  }passive(h);
 });
 await test('historical update baseline remains separate from requested recording inspection',()=>{
  const h=harness();h.c.SukunRecordingUpdateDiagnostics.snapshot=()=>({version:'r1016',status:'baseline',persistence:'available',errorCode:null,before:null,after:{appVersion:'r1016',controllerVersion:'r1016',targetVersion:'r1016',status:'ok',count:1,blobBytes:1024,errorCode:null,at:1791190000000},comparison:{status:'not-ready',causality:'not-determined'}});
  const r=h.api.read(),local=h.view.plainReport(r);assert.equal(r.checks.filter(x=>x.code==='RECORDING_CONTINUITY').length,1);assert.equal(r.checks.filter(x=>x.code==='RECORDING_INSPECTION').length,1);assert.match(local,/Initial recording baseline/);assert.match(local,/Last saved observation; not a current inventory scan/);assert.match(local,/Latest recording inspection/);assert.match(local,/3 recordings · 2048 bytes/);passive(h);
 });
 for(const lang of ['tr','en'])await test('mounted local report navigation, plain export and AI preview keep inspection local in '+lang,async()=>{
  const h=harness(snapshot({current:bad('cancelled','inspection-cancelled')}),lang),ui=uiHarness(),view=ui.c.SukunHealthViewR943;let current=h.api.read();ui.c.I18N.lang=lang;view.mount(ui.panel,{read:()=>current,close(){}});
  let html=ui.panel.querySelector('[data-health-content]').innerHTML;assert(html.includes(lang==='en'?'Last successful observation (historical)':'Son başarılı gözlem (geçmiş)'));assert(html.includes('inspection-cancelled'));
  for(let i=0;i<2;i++){await ui.click('report');html=ui.panel.querySelector('[data-health-content]').innerHTML;assert(html.includes('RECORDING_INSPECTION'));await ui.click('home');}
  h.set(snapshot({current:observation(0,0),lastSuccessful:observation(0,0)}));current=h.api.read();view.render(ui.panel,current);html=ui.panel.querySelector('[data-health-content]').innerHTML;assert(html.includes(lang==='en'?'0 recordings · 0 bytes':'0 kayıt · 0 bayt'));
  await ui.click('explain');await ui.click('ai-preview');html=ui.panel.querySelector('[data-health-content]').innerHTML;assert(!html.includes('RECORDING_INSPECTION'));assert(!html.includes(lang==='en'?'0 recordings · 0 bytes':'0 kayıt · 0 bayt'));assert(!html.includes('inspection-cancelled'));assert.equal(ui.fetches.length,0);assert.equal(ui.transportCalls.length,0);passive(h);
 });
 await test('health open and repeated close/open render cached data without requesting inspection or DB access',()=>{
  const ui=uiHarness();ui.panel.remove();let scans=0,db=0;ui.c.sessionStorage={getItem:()=>null,setItem(){}};ui.c.indexedDB={open(){db++;throw Error('forbidden')},databases(){db++;throw Error('forbidden')}};ui.c.SukunRecordingInspection={snapshot:()=>snapshot(),inspect(){scans++;throw Error('forbidden')}};
  vm.runInContext(collector,ui.c);for(let i=0;i<3;i++){assert.equal(ui.c.SukunHealthR940.open(),true);ui.c.SukunHealthR940.close()};assert.equal(scans,0);assert.equal(db,0);assert.equal(ui.fetches.length,0);assert(!JSON.stringify([...ui.store]).includes('recordingInspection'));
 });
 await test('quick and deep health checks retain existing checks and never request recording inspection or DB reads',async()=>{
  const h=harness();for(const deep of [false,true]){const r=await h.api.run({deep,online:false});assert(row(r));assert(r.checks.some(x=>x.code==='RUNTIME_INTEGRITY'));assert(r.checks.some(x=>x.code==='BUILD'));assert.equal(row(r).evidence.current.count,3);assert(!JSON.stringify([...h.store]).includes('recordingInspection'));assert(!JSON.stringify(r.timeline).includes('recordingInspection'))};for(const key of ['inspect','dbOpen','dbList','dbDelete','collect','prepare','legacyAudio','ai'])assert.equal(h.actions[key]||0,0,key);
 });
 await test('real inspection owner loads retained metadata without a DB read and agrees with the health schema',()=>{
  const runtime=fs.readFileSync(path.join(root,'assets/runtime/recording-inspection-r1017.js'),'utf8');
  for(const state of ['ok',...Object.keys(statuses)]){
   const current=state==='ok'?observation(0,0):bad(state,statuses[state]),lastSuccessful=state==='ok'?current:observation(),h=harness();
   h.store.set('sukun.recording.inspection.v1',JSON.stringify({schema:1,current,lastSuccessful}));delete h.c.SukunRecordingInspection;vm.runInContext(runtime,h.c,{filename:'recording-inspection-r1017.js'});Object.keys(h.actions).forEach(k=>h.actions[k]=0);
   const owner=h.c.SukunRecordingInspection.snapshot(),r=h.api.read(),e=row(r).evidence;assert.deepEqual(plain(e),plain(owner));assert.equal(e.current.status,state);assert.equal(presented(h,r).status,state==='ok'?'OBSERVED':'NOT_MEASURED');passive(h);
  }
 });
 await test('real owner failure on a later explicit request keeps successful history and the report remains cached-only',async()=>{
  const runtime=fs.readFileSync(path.join(root,'assets/runtime/recording-inspection-r1017.js'),'utf8'),h=harness(),lastSuccessful=observation(0,0);
  h.store.set('sukun.recording.inspection.v1',JSON.stringify({schema:1,current:lastSuccessful,lastSuccessful}));delete h.c.SukunRecordingInspection;vm.runInContext(runtime,h.c);delete h.c.indexedDB;
  const requested=await h.c.SukunRecordingInspection.inspect();assert.equal(requested.status,'unsupported');Object.keys(h.actions).forEach(k=>h.actions[k]=0);
  const r=h.api.read();assert.equal(row(r).evidence.current.status,'unsupported');assert.equal(row(r).evidence.current.count,null);assert.equal(row(r).evidence.lastSuccessful.count,0);assert.equal(row(r).evidence.lastSuccessful.at,lastSuccessful.at);assert.equal(presented(h,r).status,'NOT_MEASURED');passive(h);
 });
 await test('technical export downloads sanitized cached inspection without DB reads or fresh collection',async()=>{
  const input=snapshot();input.current.name='PRIVATE_SENTINEL';const h=harness(input),r=await h.api.exportReport(),saved=JSON.parse(await h.blobs[0].text());assert.equal(h.actions.snapshot,1);assert.deepEqual(saved,plain(r));assert.equal(saved.current.recordingInspection.current.count,3);assert(!JSON.stringify(saved).includes('PRIVATE_SENTINEL'));assert.equal(h.actions.create,1);assert.equal(h.actions.click,1);assert.deepEqual([...h.timers.values()].map(x=>x.ms),[1000]);for(const key of ['inspect','dbOpen','dbList','dbDelete','network','collect','prepare','ai','storageRead','storageWrite','scan'])assert.equal(h.actions[key]||0,0,key);
 });
 const output={source:root,collectorSha256:crypto.createHash('sha256').update(collector).digest('hex'),presenterSha256:crypto.createHash('sha256').update(presenter).digest('hex'),scope:'Production health collector/presenter and isolated cached API counters; modeled DOM navigation. No real recording read, browser display, audio, update, recovery or publication verification.',passed:results.filter(x=>x.passed).length,total:results.length,results};
 fs.writeFileSync(path.join(__dirname,'health_inspection_results.json'),JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));process.exitCode=output.passed===output.total?0:1;
})();
