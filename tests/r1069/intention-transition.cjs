'use strict';
// The shipped intention gate/player, automatic scheduler and prepared-source
// admission execute unchanged. Media bytes/end events, speech, time, native
// ownership and storage are controlled seams; no device audibility is claimed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
process.argv[2]=root;
const {harness}=require('../r1048/audio-volume-preview.cjs');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const between=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,'Production boundary '+a);return html.slice(i,j)};
const noop=()=>{};
function fixture({hidden=false,tts=false,quality=false}={}){
 const h=harness(),c=h.c,blob=new Blob(['controlled intention recording'],{type:'audio/mpeg'}),spoken=[],claims=[];
 Object.assign(c,{NIYET:{on:false,spk:true,devir:false},NIYET_BLOB:quality?blob:null,NIYET_HAS_REC:quality,NIYET_REC_KEY:'niyet:core',SPK:{rate:.85,voice:{name:'TR',lang:'tr-TR'}},niyetTO:0,niyetTO2:0,_zAutoSon:0,
  SukunReadingSourcesR1064:{forReading:()=>({id:'reading:niyet'})},SukunBundledArabicR1065:{find:async()=>(tts||quality)?null:{blob,key:'bundled:niyet',bundled:true}},SukunGenericRecordings:{find:async()=>null},r1065LegacyReadingSelected:()=>false,
  REC_DB:{get:async()=>null},spkPitch:x=>x,SpeechSynthesisUtterance:class{constructor(text){this.text=text}},speechSynthesis:{speaking:false,speak(u){spoken.push(u)},cancel(){c.speechCancels=(c.speechCancels||0)+1}},
  zikirKey:()=>`esma:${c.Z.idx}:nida`,_r476Hidden:null,_r476Prepared:{key:''},_r476LockAudio:null,_r476SilentUrl:'blob:silent',_r949PrepareTask:null,_r838HiddenStart:null,
  _r1007HiddenStartSeq:0,_r946HandoffSource:'',_r1007SingleFallback:null,r477FxSignature:key=>key+'-fx',r838CaptureAudible:noop,r946LockDiagnostic:noop,r946LockEvidence:()=>({}),r946ReleaseLockUrls:noop,r476MediaSession:noop,
  r946LockLease:a=>(a._sukunLockEpoch=(a._sukunLockEpoch||0)+1),r476StopTtsBatch:noop,r476CancelPrepare:noop,
  zikirSesliTekrarMi:()=>true,zikirSesMesgul:()=>!!c.__SUKUN_NIYET_GATE_PROMISE__,r1007SingleFallbackMatches:()=>false,r1010RecordingSelection:()=>({cat:'esma',index:c.Z.idx}),r1010MissingRecordingMatches:()=>false,
  r949CurrentCycleMs:()=>800,zAutoTempoMs:()=>800,zSessizTamamla:n=>{c.Z.count+=n},rep:()=>{c.Z.count++;c.Z.total++;return true},r1007RecordingStatus:noop,r476CurrentLabel:()=> 'Controlled name',autoStop:()=>{c.Z.auto=false},
  r1010PreparedRecordingMatches:()=>true,r476Prepare:async()=>true,r476BeginHidden:async()=>true,
  SukunRecordingFailure:{hold:noop}});
 c.Z.count=0;c.Z.total=37;c.Z.devir=1;c.Z.idx=1;c.Z.auto=true;c.Z.tempo=.8;c.Z.adv=true;c.Z.target=99;h.document.hidden=hidden;
 h.run(between("let _r485NiyetDoneKey=''",'\nrep=()=>'));
 h.run(between('function niyetShow(opt={}){',"/* ── Niyet'e özel ses kaydı"));
 h.run(between('let _r998NiyetEpoch=0',"[['niyetTgl'"));
 h.run(between('let _zAutoPlanSeq=0;','function zAutoUyan(reason){'));
 // This cut deliberately includes neighboring admission helpers added here.
 h.run(between('/* r978 — only a name change switches immediately.','/* ═══ r541'));
 h.run(between('function r476Stop(all=true','window.SukunLockScreenZikir={'));
 if(quality)c.SukunRecordingQuality={analyse:async()=>({gain:1.3,trimStart:1,trimEnd:2,tailTrim:3,fadeMs:78}),publish:noop};
 c.r988NativeRecordedStart=()=>false;
 c.r1009BeginHiddenChecked=()=>Promise.resolve(true);
 const originalClaim=c.SukunBackgroundAudioOwner.claim;
 c.SukunBackgroundAudioOwner.claim=(owner,a,key)=>{claims.push({owner,key});return originalClaim(owner,a,key)};
 function oldNative(){
  const a=h.document.createElement('audio');Object.assign(a,{src:'blob:old-name',currentSrc:'blob:old-name',paused:false,readyState:4,currentTime:.3,duration:60});
  Object.assign(a.dataset,{sukLockKey:'esma:0:nida',sukLockSignature:'esma:0:nida-fx',sukRepeatUnitSec:'1'});
  c._r476LockAudio=a;c._r476Hidden={mode:'recording',preparedKey:'esma:0:nida',cycleMs:1000,phaseMs:0,audibleMs:0,credited:0,mediaSource:a.src,mediaEpoch:0,audibleSince:c.Date.now(),mediaSampleAt:c.Date.now(),lastMediaTime:a.currentTime};
  c._r476Prepared={key:c.zikirKey(),blob,url:'blob:next-name',fxReady:true,fxSig:c.zikirKey()+'-fx',cycleMs:1000,playRate:1,unitMediaSec:1,repeatCycles:60};return a;
 }
 return {...h,spoken,claims,blob,oldNative,doneKey:()=>vm.runInContext('_r485NiyetDoneKey',c)};
}
function directBeginFixture(){
 const f=fixture({hidden:true}),c=f.c,a=f.oldNative(),owner={epoch:1,intent:1};let lease=0;const attempts=new Map();let state={lease:0,owner:'single',phase:'PLAYING'};
 c.SukunTabOwner={owns:()=>true,snapshot:()=>({...owner})};
 c.SukunBackgroundAudioOwner={
  claim(kind,media,key){const id=++lease;attempts.set(id,media);state={lease:id,owner:kind,phase:'STARTING'};f.claims.push({owner:kind,key});return id},
  allowed:id=>id===state.lease,holdRecovery:noop,
  async play(id){if(id!==state.lease)return false;const media=attempts.get(id);media.paused=false;media.plays=(media.plays||0)+1;state.phase='PLAYING';return true},
  snapshot:()=>({...state}),release(kind){if(kind===state.owner)state.phase='ENDED'}
 };
 c.r476Audio=()=>a;c.r1010RecordingLookupSignature=()=> 'matching-recording';c._r476Prepared.lookupSignature='matching-recording';
 c.r1007RecordStartupFailure=(key,code)=>{throw Error('Unexpected admission failure '+key+' '+code)};
 f.run(between('async function r476BeginHidden(allowVisible=false){','function r838CaptureAudible(s,playing){'));
 return {...f,owner,native:a};
}
const results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.stack||String(e)})}}
async function finishRecording(f){const a=f.audios.findLast(x=>x._sukunAd==='niyet');assert(a,'Intention media was created');a.currentTime=5;a.dispatch('ended');await f.flush();return a;}
(async()=>{
 await test('Direct hidden admission accepts only its own synchronous intention park and resumes after full ended',async()=>{
  const f=directBeginFixture();let result;const p=f.c.r476BeginHidden().then(v=>{result=v;return v});await f.flush();
  assert(f.c.__SUKUN_NIYET_GATE_PROMISE__);assert.equal(f.native.paused,true);assert.equal(f.c._r476Hidden,null);assert.equal(result,undefined);assert.equal(f.claims.filter(x=>x.owner==='single').length,0);
  await finishRecording(f);assert.equal(await p,true,'The same BeginHidden call must survive only the retirement it synchronously initiated');
  assert.equal(f.c._r476Hidden?.preparedKey,f.c.zikirKey());assert.equal(f.native.src,'blob:next-name');assert.equal(f.native.paused,false);assert.equal(f.claims.filter(x=>x.owner==='single').length,1);assert.equal(f.c.Z.count,0);assert.equal(f.c.Z.total,37);
 });
 await test('An older canceled BeginHidden gate cannot borrow a newer completed gate for the same name',async()=>{
  const f=directBeginFixture(),actual=f.c.r485NiyetGate;let deliver;
  // Hold only delivery of the old actual gate result. This models a suspended
  // await continuation; the production gate and both native phrases still run.
  f.c.r485NiyetGate=()=>{const original=actual();return new Promise(resolve=>{deliver=()=>original.then(resolve)})};
  const p=f.c.r476BeginHidden();await f.flush();f.c.r998NiyetCancel('same-name-replacement');await f.flush();
  const newer=actual();await f.flush();await finishRecording(f);assert.equal(await newer,true);assert.equal(f.doneKey(),'esma:1:1');
  deliver();assert.equal(await p,false,'A false gate result must remain terminal even if a replacement has the same completed key');assert.equal(f.claims.filter(x=>x.owner==='single').length,0);assert.equal(f.c.Z.count,0);assert.equal(f.c.Z.total,37);
 });
 for(const change of ['later-stop-sequence','pause','stop','new-name-gate','owner-epoch','owner-intent'])await test(`Direct hidden admission cannot accept ${change} after its own intention park`,async()=>{
  const f=directBeginFixture();const p=f.c.r476BeginHidden();await f.flush();assert(f.c.__SUKUN_NIYET_GATE_PROMISE__);let replacement;
  if(change==='later-stop-sequence')f.c.r476Stop(false);
  if(change==='pause'||change==='stop'){f.c.Z.auto=false;f.c.r998NiyetCancel(change);f.c.r476Stop(change==='stop');}
  if(change==='new-name-gate'){f.c.Z.idx++;f.c.Z.devir++;replacement=f.c.r485NiyetGate();await f.flush();}
  if(change==='owner-epoch')f.owner.epoch++;
  if(change==='owner-intent')f.owner.intent++;
  if(!['pause','stop'].includes(change))await finishRecording(f);
  assert.equal(await p,false,'Only the opener’s synchronous retirement can be accepted');assert.equal(f.claims.filter(x=>x.owner==='single').length,0);assert.notEqual(f.native.src,'blob:next-name');assert.equal(f.c.Z.count,0);assert.equal(f.c.Z.total,37);
  if(replacement)assert.equal(await replacement,true);f.c.r998NiyetCancel('test-cleanup');await f.flush();
 });
 for(const hidden of [false,true])await test(`Native automatic ${hidden?'hidden':'visible'} next-name scheduler enters its pending intention`,async()=>{
  const f=fixture({hidden});f.oldNative();f.c.zAutoKur(false);await f.flush();
  assert(f.c.__SUKUN_NIYET_GATE_PROMISE__,'An existing native loop must not bypass the next-name intention gate');
  assert.equal(f.c.Z.count,0);assert.equal(f.c.Z.total,37);assert.equal(f.claims.filter(x=>x.owner==='single').length,0,'The next-name native source must wait');
  f.c.r998NiyetCancel('test-cleanup');await f.flush();
 });
 for(const repeatCycle of [false,true])await test(`Same-name new cycle ${repeatCycle?'requires':'omits'} intention according to the saved preference`,async()=>{
  const f=fixture();const first=f.c.r485NiyetGate();await f.flush();await finishRecording(f);assert.equal(await first,true);assert.equal(f.doneKey(),'esma:1:1');
  const a=f.oldNative();a.dataset.sukLockKey=f.c.zikirKey();f.c._r476Hidden.preparedKey=f.c.zikirKey();f.c.NIYET.devir=repeatCycle;f.c.Z.devir++;
  f.c.zAutoKur(false);await f.flush();assert.equal(!!f.c.__SUKUN_NIYET_GATE_PROMISE__,repeatCycle,'The saved per-cycle intention switch controls this boundary');assert.equal(f.c.Z.count,0);assert.equal(f.c.Z.total,37);
  f.c.r998NiyetCancel('test-cleanup');await f.flush();
 });
 for(const hidden of [false,true])for(const pending of [false,true])await test(`Prepared ${hidden?'hidden':'visible'} next-name apply waits while intention ${pending?'is playing':'is due'}`,async()=>{
  const f=fixture({hidden}),a=f.oldNative();if(pending){f.c.r485NiyetGate();await f.flush();}
  const result=f.c.r978ApplyPreparedLockSource();await f.flush();
  assert.equal(result,false,'Prepared name replacement must be denied before introduction completion');
  assert.notEqual(a.src,'blob:next-name','The following name must not replace the native source during the intention');
  assert.equal(f.claims.filter(x=>x.owner==='single').length,0,'The next name must not supersede the native intention lease');
  assert.equal(f.c.Z.count,0);assert.equal(f.c.Z.total,37);f.c.r998NiyetCancel('test-cleanup');await f.flush();
 });
 for(const hidden of [false,true])await test(`Actual ${hidden?'hidden':'visible'} media ledger cannot count the following name before intention ends`,async()=>{
  const f=fixture({hidden}),a=f.oldNative();f.c.r485NiyetGate();await f.flush();
  Object.assign(f.c,{_r476HedefTimer:0,r476TtsSpoken:()=>0,_zAutoSessizUntil:0,r694CreditUsageStats:noop,zUI:noop,_repS(){f.c.Z.count++;f.c.Z.total++;}});
  f.run(between('function r838CaptureAudible(s,playing){','function r476TtsSpoken(){'));
  f.run(between('async function r476SilentApply(reps){','async function r476EndHidden(){'));
  const authority=html.match(/<script id="r693-lock-target-boundary-authority">([\s\S]*?)<\/script>/);assert(authority);f.document.readyState='loading';f.run(authority[1]);
  f.c.r978ApplyPreparedLockSource();await f.flush();await f.advance(1500);a.currentTime=1.5;
  await f.c.SukunLockTargetAuthorityR693.settle();await f.flush();
  assert.equal(f.c.Z.count,0,'A following-name media sample must not count before the intention completes');assert.equal(f.c.Z.total,37);
  f.c.r998NiyetCancel('test-cleanup');await f.flush();
 });
 for(const hidden of [false,true])await test(`${hidden?'Native hidden':'Raw visible'} complete intention before each of three next names`,async()=>{
  const f=fixture({hidden});
  for(let i=1;i<=3;i++){
   f.c.Z.idx=i;f.c.Z.devir=i;let outcome;const p=f.c.r485NiyetGate().then(v=>{outcome=v;return v});await f.flush();
   assert.equal(outcome,undefined);const a=f.audios.findLast(x=>x._sukunAd==='niyet');assert(a);assert.equal(a.plays>=1,true);
   await f.advance(4000);assert.equal(outcome,undefined,'Selected 0.8 s tempo or elapsed time must not truncate a 5 s phrase');assert.equal(f.c.Z.count,0);assert.equal(f.c.Z.total,37);
   await finishRecording(f);assert.equal(await p,true);assert.equal(f.doneKey(),`esma:${i}:${i}`);assert.equal(f.c.Z.count,0,'The intention is never a counted repeat');assert.equal(f.c.Z.total,37);
  }
 });
 for(const hidden of [false,true])await test(`${hidden?'Native hidden':'Raw visible'} intention keeps the complete recorded phrase despite silence-analysis trim hints`,async()=>{
  const f=fixture({hidden,quality:true});let outcome;const p=f.c.r485NiyetGate().then(v=>{outcome=v;return v});await f.flush();const a=f.audios.findLast(x=>x._sukunAd==='niyet');assert(a);
  a.dispatch('loadedmetadata');assert.equal(a.currentTime,0,'A complete intention must start at the beginning of its recording');
  await f.advance(2000);a.currentTime=2;a.dispatch('timeupdate');await f.advance(500);
  assert.equal(outcome,undefined,'Silence-analysis trimEnd must not terminate an intention before native ended');assert.equal(f.c.Z.count,0);assert.equal(f.c.Z.total,37);
  await finishRecording(f);assert.equal(await p,true);assert.equal(f.c.Z.count,0);
 });
 await test('Device speech delayed onset and long phrase wait for actual onend',async()=>{
  const f=fixture({tts:true});let outcome;const p=f.c.r485NiyetGate().then(v=>{outcome=v;return v});await f.flush();assert.equal(f.spoken.length,1);const u=f.spoken[0];
  await f.advance(7000);assert.equal(outcome,undefined,'Waiting for TTS start cannot release the following name');u.onstart();await f.advance(12000);assert.equal(outcome,undefined,'A phrase longer than the selected tempo waits for real completion');assert.equal(f.c.Z.count,0);assert.equal(f.c.Z.total,37);
  u.onend();assert.equal(await p,true);assert.equal(f.c.Z.count,0);
 });
 for(const hidden of [false,true])for(const reason of ['manual-next','auto-pause','auto-stop'])await test(`${hidden?'Native hidden':'Raw visible'} canceled ${reason} cannot settle a newer name via stale ended`,async()=>{
  const f=fixture({hidden});let oldResult;const old=f.c.r485NiyetGate().then(v=>{oldResult=v;return v});await f.flush();const a=f.audios.findLast(x=>x._sukunAd==='niyet'),stale=a.onended;assert.equal(typeof stale,'function');
  f.c.r998NiyetCancel(reason);assert.equal(await old,false);assert.equal(oldResult,false);assert.equal(f.doneKey(),'');
  f.c.Z.idx++;f.c.Z.devir++;let nextResult;const next=f.c.r485NiyetGate().then(v=>{nextResult=v;return v});await f.flush();stale();await f.flush();assert.equal(nextResult,undefined,'A retired native/raw endpoint cannot complete the new introduction');assert.equal(f.c.Z.count,0);assert.equal(f.c.Z.total,37);
  await finishRecording(f);assert.equal(await next,true);assert.equal(f.doneKey(),'esma:2:2');
 });
 const report={source:'index.html',sourceHash:crypto.createHash('sha256').update(html).digest('hex'),passed:results.filter(x=>x.passed).length,total:results.length,scope:'Actual production gate, automatic scheduler, prepared native source replacement, raw/native media and TTS integration. Leaf media events, clocks and storage are controlled. No physical phone, audio recording mutation or audible screen-lock claim.',results};
 console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
