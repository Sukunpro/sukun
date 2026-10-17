'use strict';
// Actual owner runtime, actual bound busy/paused callbacks and actual Studio
// reservation. Web Locks/IDB/timing and capture are controlled seams.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));process.env.SUKUN_AUDIO_SOURCE=root;
const {origin}=require('../helpers/tab-owner-origin.cjs'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function cut(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i,a);return html.slice(i,j)}
const binding=cut('window.SukunTabOwner?.bind?.({','\n\n\n/* ═'),reservation=cut('async function studioRecordReservation(key){','async function studioRecord(_r982Lease=null){');
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack||String(error)})}}
async function settle(w,p){let out;Promise.resolve(p).then(value=>out={value},error=>out={error});await w.flush();assert(out,'controlled operation must settle');return out}
function fixture(){const w=origin(),t=w.tab(),c=t.window,Studio={key:'esma:98:tev',analysisSeq:7,recordClaim:null,session:null,edit:null,analysisTask:null};Object.assign(c,{Z:{cat:'esma',idx:98,form:'tev',auto:false},R170:{Studio},Studio,AbortController,SukunStudioPreparation:{createCancellation:()=>new AbortController(),explain:()=> 'controlled-error'},studioAbort:task=>task?.controller?.abort(),studioControls(){},studioStatus(){},studioText:(tr,en)=>en,studioAnalyze:async()=>true});vm.runInContext('let _r980ItemRecStarting=false,ITEMREC=null;',c);vm.runInContext(binding,c);vm.runInContext('globalThis.__boundBusy='+binding.slice(binding.indexOf(' busy:')+6,binding.indexOf(',\n stop:')),c);t.owner.bind({rebase:()=>true});vm.runInContext(reservation,c);let starts=0,finish;c.studioRecord=async lease=>{assert(lease.current());starts++;Studio.session={key:Studio.key,finished:new Promise(resolve=>finish=resolve)};return true};return{w,t,c,Studio,get starts(){return starts},finish(){Studio.session=null;finish(false)},claim(){return Studio.recordClaim={key:Studio.key,seq:Studio.analysisSeq,controller:new AbortController()}}}}
async function admit(f,{kind='studio-record',claim=f.Studio.recordClaim,strict=false}={}){let calls=0;const out=await settle(f.w,f.t.owner.maintenance(kind,()=>{calls++;return true},{recordClaim:claim,throwOnBlocked:strict}));return{...out,calls}}
(async()=>{
 for(const held of [false,true])await test((held?'Owned':'Unowned')+' actual Studio reservation discounts only its own pending claim and reaches capture admission',async()=>{const f=fixture();if(held)assert.equal((await settle(f.w,f.t.owner.acquire())).value,true);const p=f.c.studioRecordReservation(f.Studio.key);await f.w.flush();assert.equal(await p,true);assert.equal(f.starts,1);assert(f.Studio.recordClaim);assert(f.t.owner.snapshot().maintenance,'reservation retains maintenance until explicit capture completion');f.finish();await f.w.flush();assert.equal(f.Studio.recordClaim,null);assert.equal(f.t.owner.snapshot().maintenance,false);assert.equal(f.w.dbRecord,null);assert.equal(f.t.calls.flush,0)});
 await test('The ordinary busy check outside maintenance still reports the pending Studio claim',async()=>{const f=fixture();f.claim();assert.equal(f.c.__boundBusy(),true);assert.equal(f.c.__boundBusy(false,{maintenanceKind:'studio-record',recordClaim:f.Studio.recordClaim}),false);assert.equal(f.c.__boundBusy(false,{maintenanceKind:'backup-import',recordClaim:f.Studio.recordClaim}),true)});
 const invalid={
  'missing context':(f,o)=>{o.recordClaim=null},
  'another maintenance kind':(f,o)=>{o.kind='backup-import'},
  'different claim reference':(f,o)=>{o.recordClaim={...f.Studio.recordClaim}},
  'changed key':f=>{f.Studio.key='temel:0'},
  'changed sequence':f=>{f.Studio.analysisSeq++},
  'aborted claim':f=>{f.Studio.recordClaim.controller.abort()},
  'unknown abort state':f=>{f.Studio.recordClaim.controller={signal:{}}},
  'active Studio session':f=>{f.Studio.session={}},
  'active Studio edit':f=>{f.Studio.edit={}}
 };
 for(const[name,mutate]of Object.entries(invalid))await test('Admission remains blocked for '+name,async()=>{const f=fixture();const claim=f.claim(),o={recordClaim:claim,kind:'studio-record'};mutate(f,o);const result=await admit(f,{kind:o.kind,claim:o.recordClaim});assert.equal(result.value,false);assert.equal(result.calls,0);assert.equal(f.w.dbRecord,null)});
 const busy={
  'automatic dhikr':c=>{c.Z.auto=true},
  'set session':c=>{c.SukunTekkeSet={snapshot:()=>({active:true})}},
  'active Tekke':c=>{c.Tekke={sessionState:()=>({active:true})}},
  'direct Start':c=>{c.SukunDirectZikirTransportR698={state:()=>({starting:true})}},
  'pending Start':c=>{c.SukunR698Transport={snapshot:()=>({pendingStart:true})}},
  'pending Stop':c=>{c.SukunR698Transport={snapshot:()=>({pendingStop:true})}},
  'Berhet journey':c=>{c.SukunBerhetiyyeSeyir={state:()=>({run:true})}},
  'Esma journey':c=>{c.SukunEsma99Seyir={state:()=>({run:true})}},
  'manual voice':c=>{c.SukunManualVoice={busy:()=>true}},
  'physical media':c=>{c.SukunPhysicalRecordingBusyR696=()=>true},
  'voice busy':c=>{c.__SUKUN_ZIKIR_VOICE_BUSY__=true},
  'pending voice':c=>{c.__SUKUN_ZIKIR_VOICE_PROMISE__={}},
  'item recording preparation':c=>vm.runInContext('_r980ItemRecStarting=true',c),
  'terkip voice':c=>{c.SukunTerkipVoice={snapshot:()=>({active:true})}},
  'foreground audio':c=>{c.SukunForegroundArbiter={snapshot:()=>({owner:'controlled-owner'})}},
  'player':c=>{c.R170.Player={playing:true}},
  'speech':c=>{c.speechSynthesis={speaking:true}},
  'pending speech':c=>{c.speechSynthesis={pending:true}},
  'item microphone':c=>vm.runInContext('ITEMREC={}',c),
  'tick microphone':c=>{c.SukunTickSound={isRecording:()=>true}}
 };
 for(const[name,mutate]of Object.entries(busy))await test('Own claim never discounts '+name,async()=>{const f=fixture();f.claim();mutate(f.c);const result=await admit(f);assert.equal(result.value,false);assert.equal(result.calls,0);assert.equal(f.w.dbRecord,null)});
 await test('Owned paused dhikr is still blocked before Studio capture admission',async()=>{const f=fixture();assert.equal((await settle(f.w,f.t.owner.acquire())).value,true);f.claim();f.c.Tekke={sessionState:()=>({phase:'paused'})};const result=await admit(f);assert.equal(result.value,false);assert.equal(result.calls,0);assert(f.t.owner.owns())});
 for(const strict of [false,true])await test('Busy getter errors remain fail-closed '+(strict?'with typed diagnostics':'for legacy boolean callers'),async()=>{const f=fixture();f.claim();f.c.SukunR698Transport={snapshot:()=>{throw new TypeError('controlled')}};const out=await admit(f,{strict});assert.equal(out.calls,0);if(strict)assert.equal(out.error.code,'maintenance-check-failed');else assert.equal(out.value,false)});
 await test('Strict non-boolean busy state remains unavailable and context is frozen',async()=>{const f=fixture();const claim=f.claim();let context;f.t.owner.bind({busy:(_report,admission)=>{context=admission;return undefined}});const out=await admit(f,{strict:true});assert.equal(out.calls,0);assert.equal(out.error.code,'maintenance-check-unavailable');assert(Object.isFrozen(context));assert.equal(context.recordClaim,claim);assert.equal(context.maintenanceKind,'studio-record')});
 await test('Cancellation while waiting for ownership cannot start a stale Studio reservation',async()=>{const f=fixture();f.w.allowLocks=false;const p=f.c.studioRecordReservation(f.Studio.key);await f.w.flush();f.Studio.recordClaim.controller.abort();f.w.unpauseLocks();await f.w.flush();assert.equal(await p,false);assert.equal(f.starts,0);assert.equal(f.w.dbRecord,null);assert.equal(f.Studio.recordClaim,null)});
 assert.equal(html,fs.readFileSync(path.join(root,'nero.html'),'utf8'));const report={suite:'r1094 exact Studio pending-claim owner admission',method:'Shipped owner runtime and extracted shipped binding/reservation in controlled VM origin. No real browser, audio capture, microphone or physical-device claim.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
