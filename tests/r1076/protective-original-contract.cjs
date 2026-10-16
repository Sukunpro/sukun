'use strict';
// Exact protective admission, preparation deadline and native media ledger.
// Media metadata, storage leaves, timers and FX readiness are controlled.
// No Android lock, real recording, storage write or audible output is claimed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
process.argv[2]=root;
const {harness}=require('../r1048/audio-volume-preview.cjs');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const cut=(start,end)=>{const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert(a>=0&&b>a,'Production boundary '+start);return html.slice(a,b);};
const noop=()=>{};
const results=[];
const describe=value=>JSON.stringify(value,(_key,item)=>typeof item==='number'&&!Number.isFinite(item)?String(item):item);
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
function fixture({cat='koruma',index=3,duration=4,actualDuration=duration,rate=1,tempo=1,hidden=false,pendingPlay=false}={}){
 const h=harness(),c=h.c,a=h.document.createElement('audio'),owner={epoch:1,intent:1};
 const notices=[],holds=[],bridge=[],claims=[],failures=[],native=deferred();let lease=0,bg={};
 Object.assign(c.Z,{cat,idx:index,auto:true,count:11,devir:2,total:47,tempo});
 Object.assign(a,{duration:actualDuration,readyState:4,currentTime:0,seeking:false});
 h.document.hidden=hidden;
 Object.assign(c,{_r476LockAudio:a,_r476Hidden:null,_r838HiddenStart:null,_r1007HiddenStartSeq:0,
  _r949PrepareTask:null,_r946HandoffSource:'',_r476PrepareSeq:0,_r477FxBuildSeq:0,_r476RecUrl:'',_r1010MissingRecording:null,
  _r1007StartFailure:null,R1009_FOREGROUND_PREPARE_TIMEOUT:3000,
  zikirKey:()=>c.Z.cat+':'+c.Z.idx,zikirSesliTekrarMi:()=>true,r485NiyetDue:()=>false,
  r1010PreparedRecordingMatches:()=>true,r1010RecordingLookupSignature:()=> 'verified-source',
  r476Audio:()=>a,r946LockLease:el=>(el._sukunLockEpoch=(el._sukunLockEpoch||0)+1),
  r476CurrentLabel:()=>index===4?'Ayatul Kursi':'Kalem 51-52',r476CurrentText:()=>({txt:'complete original'}),
  r1010RecordingSelection:key=>({cat:c.Z.cat,index:c.Z.idx,key,item:{tr:'Protective reading'}}),
  r1007RecordingStatus:(phase,code)=>{notices.push({phase,code});return phase+':'+(code||'');},
  r1007SetSingleFallback:p=>notices.push({phase:'visible-fallback',key:p.key}),
  r476MediaSession:noop,r946LockDiagnostic:noop,r946LockEvidence:()=>({}),r946ReleaseLockUrls:noop,r946RetireLockUrl:noop,
  r978ApplyPreparedLockSource:noop,r476StopTtsBatch:noop,r1009BeginHiddenChecked:()=>Promise.resolve(false),
  navigator:{},speechSynthesis:{cancel:noop},REC_DB:{revision:()=>0},zAutoTempoMs:()=>c.Z.tempo*1000,
  _r476Prepared:{key:cat+':'+index,recordingKey:cat+':'+index,recordingRevision:0,blob:new Blob(['complete controlled original'],{type:'audio/wav'}),
   url:'blob:verified-original',fxUrl:'',fxReady:false,cadenceReady:false,cycleMs:duration*1000/rate+40,
   durationMs:duration*1000,playRate:rate,lookupSignature:'verified-source',fxSig:'selected-fx',voiceEpoch:0},
  SukunTabOwner:{owns:()=>true,snapshot:()=>({...owner})},
  SukunZikirTransportGate:{snapshot:()=>({generation:1}),invalidate:noop,reset:noop},
  SukunR698Transport:{hasJourney:()=>false},
  SukunNativeEchoBridge:{start:(_a,opt)=>bridge.push({action:'start',opt}),stop:(_a,reason)=>bridge.push({action:'stop',reason})},
  SukunRecordingFailure:{hold:info=>{holds.push(info);return{ok:false,blocked:true};}},
  SukunBackgroundAudioOwner:{
   claim(kind,element,source){bg={lease:++lease,owner:kind};claims.push({kind,element,source});return lease;},
   allowed:id=>id===bg.lease,
   async play(id){if(id!==bg.lease)return false;a.paused=false;a.plays=(a.plays||0)+1;if(pendingPlay)await native.promise;return true;},
   snapshot:()=>({...bg}),release:()=>{bg={};},holdRecovery:noop},
  SukunReadingPolicy:{permissions:()=>({personal:true,generic:true})},r477FxSignature:()=> 'selected-fx'});
 h.run(cut('function r1076ProtectiveOriginal(prepared){','/* r1009: original voice'));
 h.run(cut('function r949CycleMs(durationMs,rate=1){','function r949CurrentCycleMs('));
 h.run(cut('function r1009PreparationStage(task,stage){','window.SukunRecordingPreparation='));
 h.run(cut("function r476CancelPrepare(reason='prepare-cancelled'){",'function r476Prepare(){'));
 h.run(html.match(/^function r1007RecordStartupFailure\([^\n]+$/m)[0]);
 const record=c.r1007RecordStartupFailure;c.r1007RecordStartupFailure=(key,code)=>{failures.push({key,code});return record(key,code);};
 h.run(cut('async function r476BeginHidden(allowVisible=false){','function r838CaptureAudible(s,playing){'));
 h.run(cut('function r838CaptureAudible(s,playing){','function r476TtsSpoken(){'));
 h.run(cut('async function r949PrepareCore(task){','/* r978 — only a name change'));
 const begin=()=>c.r476BeginHidden(!h.document.hidden);
 return {...h,c,a,owner,notices,holds,bridge,claims,failures,native,begin};
}
async function test(name,fn){try{await fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.stack||String(e)});}}
async function preparation(options={}){
 const h=fixture(options),c=h.c,fx=deferred(),settled=[];
 c.r1007ReadRecording=async key=>({key,blob:new Blob(['complete original'],{type:'audio/wav'}),revision:0});
 c.r476ProbeDuration=async()=>options.duration===undefined?4000:options.duration*1000;
 c.r477RenderLockTrack=()=>fx.promise;c.r953CadenceTrack=async()=>null;
 const task={ownerEpoch:h.owner.epoch,ownerIntent:h.owner.intent,fxSig:'selected-fx',cancelled:false,fallbackUsed:false,
  controller:new AbortController(),stage:'read',cancel:value=>settled.push(value)};
 c._r949PrepareTask=task;const promise=c.r949PrepareCore(task);await h.flush();
 return{...h,task,promise,fx,settled};
}
(async()=>{
 for(const index of [3,4])for(const hidden of [false,true])await test(`koruma:${index} complete original admits ${hidden?'hidden':'visible'} without inventing FX or a 40ms gap`,async()=>{
  const h=fixture({index,hidden});assert.equal(await h.begin(),true);
  assert.equal(h.a.plays,1);assert.equal(h.claims.length,1);assert.equal(h.a.loop,true);assert.equal(h.a.src,'blob:verified-original');
  assert.equal(h.c._r476Hidden.nativeOriginal,true);assert.equal(h.c._r476Hidden.cycleMs,4000);
  assert.equal(h.a.dataset.sukRepeatUnitSec,'4');assert.equal(h.a.dataset.sukRepeatCycles,'1');
  assert.equal(h.c._r476Prepared.fxReady,false);assert.equal(h.c._r476Prepared.cadenceReady,false);
  assert.deepEqual(h.bridge,[{action:'stop',reason:'protective-original'}]);assert.equal(h.holds.length,0);
  assert.deepEqual([h.c.Z.count,h.c.Z.total],[11,47]);
 });
 for(const rate of [.5,1,2])await test(`accepted native metadata controls the exact wall unit at read rate ${rate}`,async()=>{
  const h=fixture({duration:10,actualDuration:12,rate});assert.equal(await h.begin(),true);
  assert.equal(h.a.playbackRate,rate);assert.equal(h.a.dataset.sukRepeatUnitSec,'12');assert.equal(h.c._r476Hidden.cycleMs,12000/rate);
 });
 for(const options of [{cat:'esma'},{cat:'berhet'},{duration:NaN},{duration:Infinity},{duration:.8,tempo:1},{duration:1.5,rate:2,tempo:1}])await test('ineligible raw source stays blocked before play: '+describe(options),async()=>{
  const h=fixture({...options,hidden:true});assert.equal(await h.begin(),false);assert.equal(h.a.plays||0,0);assert.equal(h.claims.length,0);
  assert.equal(h.holds[0]?.code,'native-format-unavailable');assert.equal(h.c._r476Hidden,null);
 });
 for(const actualDuration of [4,12])await test(`unknown preliminary duration defers to native ${actualDuration}s without inventing time`,async()=>{
  const h=fixture({duration:0,actualDuration,hidden:true});assert.equal(await h.begin(),true);
  assert.equal(h.c._r476Hidden.cycleMs,actualDuration*1000);assert.equal(h.a.dataset.sukRepeatUnitSec,String(actualDuration));assert.deepEqual([h.c.Z.count,h.c.Z.total],[11,47]);
 });
 for(const actualDuration of [0,NaN,Infinity,.5])await test(`unknown probe cannot lend native ${String(actualDuration)}s a valid duration`,async()=>{
  const h=fixture({duration:0,actualDuration,hidden:true});assert.equal(await h.begin(),false);assert.equal(h.a.plays,1);assert.equal(h.a.paused,true);assert.equal(h.c._r476Hidden,null);assert.equal(h.failures[0]?.code,'native-format-unavailable');assert.deepEqual([h.c.Z.count,h.c.Z.total],[11,47]);
 });
 for(const mutation of ['key','url'])await test('unknown protective candidate requires matching '+mutation,async()=>{
  const h=fixture({duration:0,actualDuration:4,hidden:true});if(mutation==='key')h.c._r476Prepared.key='koruma:4';else h.c._r476Prepared.url='https://foreign.example/audio';assert.equal(h.c.r1076ProtectiveOriginal(h.c._r476Prepared),false);
 });
 for(const property of ['blob','url'])await test('missing original '+property+' is never eligible',async()=>{
  const h=fixture();h.c._r476Prepared[property]=null;assert.equal(h.c.r1076ProtectiveOriginal(h.c._r476Prepared),false);
 });
 await test('wall duration equal to selected tempo is admitted without adding a synthetic gap',async()=>{
  const h=fixture({duration:6,rate:2,tempo:3});assert.equal(await h.begin(),true);assert.equal(h.c._r476Hidden.cycleMs,3000);
 });
 for(const actualDuration of [0,NaN,Infinity,.5])await test(`native duration ${String(actualDuration)} cannot borrow the preparation descriptor`,async()=>{
  const h=fixture({duration:4,actualDuration,tempo:1});assert.equal(await h.begin(),false);
  assert.equal(h.a.plays,1);assert.equal(h.a.paused,true);assert.equal(h.c._r476Hidden,null);assert.equal(h.failures[0]?.code,'native-format-unavailable');
  assert.equal(h.c.SukunBackgroundAudioOwner.snapshot().owner,undefined);assert.equal(h.bridge.length,0);assert.deepEqual([h.c.Z.count,h.c.Z.total],[11,47]);
 });
 for(const action of ['stop','selection','owner-epoch','owner-intent','voice'])await test(`retired ${action} during source preparation cannot claim or start native original`,async()=>{
  const h=fixture(),read=deferred();h.c._r949PrepareTask={};h.c.r476Prepare=()=>read.promise;
  const p=h.begin();await h.flush();
  if(action==='stop'){h.c.Z.auto=false;h.c._r1007HiddenStartSeq++;}
  if(action==='selection')h.c.Z.idx++;
  if(action==='owner-epoch')h.owner.epoch++;
  if(action==='owner-intent')h.owner.intent++;
  if(action==='voice')h.voiceChange();
  read.resolve(true);assert.equal(await p,false);assert.equal(h.a.plays||0,0);assert.equal(h.claims.length,0);assert.equal(h.c._r476Hidden,null);
 });
 for(const action of ['stop','selection','voice'])await test(`pending accepted original retired by ${action} is silenced without count or new play`,async()=>{
  const h=fixture({pendingPlay:true}),p=h.begin();await h.flush();assert.equal(h.a.plays,1);
  if(action==='stop'){h.c.Z.auto=false;h.c._r1007HiddenStartSeq++;}
  if(action==='selection')h.c.Z.idx++;
  if(action==='voice')h.voiceChange();
  h.native.resolve();assert.equal(await p,false);assert.equal(h.a.paused,true);assert.equal(h.a.plays,1);assert.equal(h.c._r476Hidden,null);assert.deepEqual([h.c.Z.count,h.c.Z.total],[11,47]);
 });
 await test('hidden protective preparation deadline preserves the complete original while FX remains unavailable',async()=>{
  const h=await preparation({hidden:true});await h.advance(3001);
  assert.equal(h.task.fallbackUsed,true);assert.equal(h.task.stage,'original-ready');assert.equal(h.task.controller.signal.aborted,true);assert.deepEqual(h.settled,[true]);
  assert.equal(h.c._r476Prepared.key,'koruma:3');assert.equal(h.c._r476Prepared.durationMs,4000);assert.equal(h.c._r476Prepared.fxReady,false);
  assert.equal(h.holds.length,0);h.fx.resolve(null);await h.promise;
 });
 await test('hidden preparation with unknown probe can commit an original candidate for native verification',async()=>{
  const h=await preparation({duration:0,hidden:true});await h.advance(3001);assert.equal(h.task.fallbackUsed,true);assert.deepEqual(h.settled,[true]);assert.equal(h.c._r476Prepared.durationMs,0);assert.equal(h.holds.length,0);h.fx.resolve(null);await h.promise;
 });
 for(const options of [{cat:'esma'},{cat:'berhet'},{duration:.5,tempo:1}])await test('hidden original deadline keeps the old rejection guard for '+JSON.stringify(options),async()=>{
  const h=await preparation({...options,hidden:true});await h.advance(3001);
  assert.equal(h.task.cancelled,true);assert.equal(h.holds[0]?.code,'native-format-unavailable');assert.deepEqual(h.settled,[false]);h.fx.resolve(null);await h.promise;
 });
 await test('hidden journey cannot acquire the protective single-original deadline',async()=>{
  const h=await preparation({hidden:true});h.c.SukunR698Transport.hasJourney=()=>true;await h.advance(3001);
  assert.equal(h.task.cancelled,true);assert.equal(h.holds[0]?.code,'native-format-unavailable');h.fx.resolve(null);await h.promise;
 });
 for(const action of ['stop','owner-epoch','owner-intent','selection'])await test(`retired ${action} cannot commit original preparation at its delayed deadline`,async()=>{
  const h=await preparation({hidden:true}),before=h.c._r476Prepared;
  if(action==='stop')h.c.r476CancelPrepare('user-stop');if(action==='owner-epoch')h.owner.epoch++;if(action==='owner-intent')h.owner.intent++;if(action==='selection')h.c.Z.idx++;
  await h.advance(3001);assert.equal(h.c._r476Prepared,before);assert.equal(h.holds.length,0);h.fx.resolve(null);assert.equal(await h.promise,false);
 });
 for(const rate of [1,2])await test(`original media ledger credits the genuine wrap at rate ${rate} with no phantom 40ms`,async()=>{
  const h=fixture({rate});assert.equal(await h.begin(),true);const s=h.c._r476Hidden;
  await h.advance(3990/rate);h.a.currentTime=3.99;assert.equal(h.c.r838EarnedRepeats(s),0);
  await h.advance(11/rate);h.a.currentTime=.001;assert.equal(h.c.r838EarnedRepeats(s),1);assert.equal(h.c.r838EarnedRepeats(s),0);
  assert.equal(s.credited,1);assert.deepEqual([h.c.Z.count,h.c.Z.total],[11,47]);
 });
 await test('wall-clock suspension alone never invents completed original readings',async()=>{
  const h=fixture();assert.equal(await h.begin(),true);await h.advance(3600000);assert.equal(h.c.r838EarnedRepeats(h.c._r476Hidden),0);
  assert.equal(h.a.plays,1);assert.deepEqual([h.c.Z.count,h.c.Z.total],[11,47]);
 });
 const report={suite:'r1076 protective original admission, preparation deadline and exact native media ledger',source:path.join(root,'index.html'),scope:'Production functions with controlled metadata, storage/FX readiness, timers and native-media leaves. No physical Android lock or audibility claim.',passed:results.filter(x=>x.passed).length,total:results.length,results};
 console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
