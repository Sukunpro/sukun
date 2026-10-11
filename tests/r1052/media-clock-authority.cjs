'use strict';
// Actual production capture/settlement and target authority, with event-capable
// media and separate wall/media clocks. No physical screen-lock claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function between(start,end){const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a,'production boundary '+start);return html.slice(a,b)}
function hub(){const handlers=new Map();return{addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(fn)},removeEventListener(type,fn){handlers.get(type)?.delete(fn)},dispatchEvent(e){for(const fn of [...handlers.get(e.type)||[]])fn(e)}}}
function fixture({rate=1,unit=1,duration=60,target=9999,adv=false,authority=false}={}){
 let now=100000,next=0;const jobs=new Map(),document=Object.assign(hub(),{hidden:true,readyState:'loading'}),window=hub();
 const a=Object.assign(hub(),{currentTime:0,duration,playbackRate:rate,src:'blob:packed-fx',currentSrc:'blob:packed-fx',loop:true,paused:false,ended:false,seeking:false,readyState:4,_sukunLockEpoch:1,dataset:{sukLockKey:'esma:0:nida',sukRepeatUnitSec:String(unit)}});
 const s={mode:'recording',cycleMs:unit/rate*1000,preparedKey:'esma:0:nida',lastMediaTime:0,mediaSource:a.src,mediaEpoch:1,mediaSampleAt:now,audibleSince:now,audibleMs:0,credited:0,phaseMs:0};
 const c={window,document,Math,Number,String,Object,Promise,Date:{now:()=>now},_r476LockAudio:a,_r476Hidden:s,_r476SilentUrl:'blob:silent',_r476HedefTimer:0,_r476Prepared:{cycleMs:s.cycleMs},
  Z:{auto:true,adv,target,count:0,total:0,cat:'esma',idx:0},zikirKey:()=> 'esma:0:nida',zikirSesliTekrarMi:()=>true,zAutoTempoMs:()=>1000,r476TtsSpoken:()=>0,
  S:{set(){}},_repS(){c.Z.count++;c.Z.total++;},r978ApplyPreparedLockSource(){c.effectApplies++;},effectApplies:0,
  setTimeout(fn,delay){const id=++next;jobs.set(id,{fn,at:now+delay});return id},clearTimeout(id){jobs.delete(id)}};
 window.SukunTabOwner={owns:()=>true};window.SukunRhythm={voiceStarted(){c.rhythmStarts++},stop(){}};c.rhythmStarts=0;
 vm.createContext(c);vm.runInContext(between('function r838CaptureAudible(s,playing){','function r476TtsSpoken(){'),c);
 c.r476SilentApply=async n=>{c.Z.count+=n;c.Z.total+=n;};
 if(authority)vm.runInContext(html.split('<script id="r693-lock-target-boundary-authority">')[1].split('</script>')[0],c);
 const fire=(target,type)=>target.dispatchEvent({type});
 const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
 return{c,a,s,jobs,document,window,fire,flush,
  wall(ms){now+=ms},sample(position,wallMs=0,playing=true){now+=wallMs;a.currentTime=position;c.r838CaptureAudible(s,playing)},
  earned(){return c.r838EarnedRepeats(s)},async settle(){await window.SukunLockTargetAuthorityR693.settle();await flush()},
  async start(){fire(window,'sukun:lock-ready');await flush()},
  async timers(){const pending=[...jobs].filter(([,job])=>job.at<=now).sort((a,b)=>a[1].at-b[1].at);for(const[id,job]of pending){jobs.delete(id);job.fn()}await flush()}
 };
}
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
(async()=>{
 for(const rate of [.5,1,2])await test(`hidden delayed observer credits only completed media units at rate ${rate}`,()=>{
  const f=fixture({rate});f.sample(35.7,40000/rate);assert.equal(f.earned(),35);assert.equal(f.earned(),0,'duplicate read must be consumed once');assert(Math.abs(f.s.audibleMs-35700/rate)<1e-6);
 });
 await test('wall-clock suspension with an unchanged media position gives zero credit',()=>{const f=fixture();f.wall(120000);assert.equal(f.earned(),0);assert.equal(f.s.audibleMs,0)});
 await test('one observed native block wrap credits its observed tail and head exactly once',()=>{const f=fixture();f.sample(59.6,59600);assert.equal(f.earned(),59);f.sample(.6,1000);assert.equal(f.earned(),1);assert.equal(f.earned(),0)});
 await test('a skipped whole block cannot be guessed from elapsed wall time',()=>{const f=fixture();f.sample(2,2000);assert.equal(f.earned(),2);f.sample(2,180000);assert.equal(f.earned(),0);assert.equal(f.s.audibleMs,2000)});
 await test('duplicate samples after waiting keep the last observed completion exactly once',()=>{const f=fixture();f.sample(2.3,2300,false);assert.equal(f.earned(),2);assert.equal(f.earned(),0);f.wall(120000);assert.equal(f.earned(),0);assert.equal(f.s.audibleMs,2300)});
 await test('long pause and resume cannot count paused media position changes',()=>{
  const f=fixture();f.sample(.6,600,false);f.a.paused=true;f.sample(4.6,40000,false);assert.equal(f.earned(),0);assert.equal(f.s.audibleMs,600);
  f.a.paused=false;f.sample(4.6,0,true);f.sample(5,400,true);assert.equal(f.earned(),1);
 });
 await test('source replacement settles no progress from its new cursor',()=>{const f=fixture();f.sample(.4,400);f.a.src=f.a.currentSrc='blob:new';f.a._sukunLockEpoch++;f.sample(25,100);assert.equal(f.earned(),0);assert.equal(f.s.audibleMs,400)});
 await test('an explicit seek discards a partial reading and drains to the next full reading boundary',()=>{
  const f=fixture();f.sample(.4,400);f.a.seeking=true;f.sample(10.25,100);f.a.seeking=false;assert.equal(f.earned(),0);
  f.sample(11,750);assert.equal(f.earned(),0,'partial unit at seek destination cannot be counted');f.sample(12,1000);assert.equal(f.earned(),1);
 });
 await test('an impossible forward jump without a seeking event cannot create 40 readings',()=>{const f=fixture();f.sample(.4,400);f.sample(40.4,100);assert.equal(f.earned(),0,'hidden missed seek event must not synthesize completions')});
 await test('an impossible backward jump without a seeking event is not a native wrap',()=>{const f=fixture();f.sample(20.4,20400);assert.equal(f.earned(),20);f.sample(10.4,100);assert.equal(f.earned(),0,'arbitrary rewind is not a completed native block')});
 await test('expected FX seek keeps prior earned fraction without counting its cursor jump',()=>{
  const f=fixture();f.sample(.4,400);f.a._r980ExpectedSeek={position:20.4,source:f.a.src,epoch:1,at:100400};f.sample(20.4,0);assert.equal(f.earned(),0);f.sample(21,600);assert.equal(f.earned(),1);
 });
 await test('actual authority settles a delayed media sample and remains unchanged on timer-only callbacks',async()=>{
  const f=fixture({authority:true});await f.start();f.sample(32.25,32250);await f.settle();assert.equal(f.c.Z.count,32);assert.equal(f.c.Z.total,32);await f.settle();assert.equal(f.c.Z.count,32);
  f.wall(180000);await f.timers();assert.equal(f.c.Z.count,32,'timer does not stand in for the media clock');
 });
 await test('actual target authority caps an observed old-name surplus at its remaining target',async()=>{
  const f=fixture({authority:true,target:5,adv:true});await f.start();f.sample(20,20000);await f.settle();assert.equal(f.c.Z.count,5);assert.equal(f.c.Z.total,5);await f.settle();assert.equal(f.c.Z.count,5);
 });
 await test('terminal Stop retires delayed progress callbacks and later native events',async()=>{
  const f=fixture({authority:true});await f.start();f.sample(2.5,2500);await f.settle();assert.equal(f.c.Z.count,2);
  f.c.Z.auto=false;f.c._r476Hidden=null;f.a.paused=true;f.a.currentTime=30;f.wall(30000);f.fire(f.a,'timeupdate');f.fire(f.a,'playing');await f.timers();await f.settle();assert.equal(f.c.Z.count,2);
 });
 await test('actual native snapshot reports zero volume/mute and classifies explicit versus browser pause',()=>{
  const f=fixture(),c=f.c,a=f.a;let pauses=0;
  Object.assign(a,{style:{},setAttribute(){},pause(){pauses++;this.paused=true;f.fire(this,'pause')},networkState:2,volume:0,muted:true});
  Object.assign(c,{_r476LockAudio:null,_r838HiddenStart:null,r476SilentWav:()=>new Blob(['synthetic silence']),URL:{createObjectURL:()=> 'blob:silent'},navigator:{}});
  f.document.createElement=()=>a;f.document.body={appendChild(){}};
  vm.runInContext(between('function r957Volume(','function r954PcmEffects('),c);
  vm.runInContext(between('function r476Audio(){','function r476Prime(){'),c);
  vm.runInContext(between('window.SukunLockAudio={','function r476MediaSession(mode){'),c);
  c.r476Audio();a.src=a.currentSrc='blob:packed-fx';delete a.dataset.sukSilentCarrier;a.dataset.sukLockFx='1';a.dataset.sukRepeatCycles='60';a.currentTime=12.25;f.s.mediaProgressSeconds=12.25;f.s.credited=12;
  const before=a.src,snap=f.window.SukunLockAudio.snapshot();assert.equal(snap.volume,0);assert.equal(snap.muted,true);assert.equal(snap.duration,60);assert.equal(snap.mediaSpanSeconds,60);assert.equal(snap.unitSeconds,1);assert.equal(snap.repeatCycles,60);assert.equal(snap.currentTime,12.25);assert.equal(snap.appliedCycles,12);assert.equal(snap.sourceKind,'baked');assert.equal(pauses,0);assert.equal(a.src,before);
  assert.equal(f.window.SukunLockAudio.duraklat(),true);assert.equal(pauses,1);assert.equal(f.window.SukunLockAudio.snapshot().lastPauseReason,'user-pause');
  a.paused=false;f.wall(3000);a.pause();assert.equal(f.window.SukunLockAudio.snapshot().lastPauseReason,'browser-pause');
  a._sukunPauseIntent={reason:'handoff',at:103000};a.paused=false;a.pause();assert.equal(f.window.SukunLockAudio.snapshot().lastPauseReason,'handoff');assert.equal(f.window.SukunLockAudio.snapshot().lastPauseAt,103000);
 });
 const report={method:'Actual production media-clock accumulator and target settlement with independent wall/media samples and native events. Android lock, browser scheduling and speaker output are not simulated.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
