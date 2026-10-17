'use strict';
// Shipping smart player and its private TTS awaiter, with controlled clocks and
// audio results. Native browser tests separately verify actual media endings.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
function part(start,end,from=0){const a=source.indexOf(start,from),b=source.indexOf(end,a);assert(a>=0&&b>a,start);return source.slice(a,b+end.length)}
const fixedCode=part('    P.one=async function(step,token){','\n    };',source.indexOf('if(P&&!P.__r244)'));
const loopCode=part('P.loop=async function(token){while(this.playing','\n};',source.indexOf('/* Adım sonu davranışı:'));
const conditionalCode=part('P.one=async function(step,token){step=normalized(step||{});','\n};');
const ttsCode=part('let ttsSeq=0;','\nfunction sourceMode(',source.indexOf('<script id="r472-smart-session-source-runtime">')).replace(/\nfunction sourceMode\($/,'');
const step=(idx=0,reps=1,gap=900)=>({type:'zikir',cat:'berhet',idx,reps,gap,repeatMode:'fixed',_r1082Id:'step'+idx});
let passed=0;const check=fn=>{fn();passed++};
function fixture(queue){
 let now=0,budgetStart=0,budgetCompleted=0,read=async()=>({ok:true,source:'recording'}),waitHook=null;
 const events=[],reads=[],waits=[],ticks=[],completed=[];
 const P={queue:structuredClone(queue),i:0,playing:true,paused:false,token:1,failures:0,_r982CompletedReps:0,
  save(){},pause(){this.playing=false;this.paused=true;this.token++;},name:'Cadence',
 };
 const smart={describeStep:()=>({valid:true}),signature:s=>s._r1082Id,current:(s,t,stamp)=>P.queue[P.i]?._r1082Id===s._r1082Id&&P.token===t&&stamp===s._r1082Id,
  completeStep:id=>completed.push(id),clearStep(){},skipped:()=>0,finish(){},pauseToEdit:()=>P.pause(),
  fail(){P.pause();return {ok:false,failed:true}},
  beginBudget(){budgetStart=now;budgetCompleted=0},elapsed:()=>now-budgetStart,credit(){budgetCompleted++},snapshot:()=>({completed:budgetCompleted}),freeze(){},
 };
 const window={SukunSmartSessionR1082:smart,SukunResumePolicy:{complete(){}},SukunIntention:{before:async()=>true},
  AudioResolver:{async play(cat,idx,item,opt){reads.push({at:now,index:idx});return read(cat,idx,item,opt)}},
  dispatchEvent:e=>events.push(e),SesCapa:{syncPaused(){}},
 };
 async function wait(ms){waits.push(ms);now+=ms;if(waitHook)await waitHook(ms);}
 const ctx={P,window,Z:{target:622,count:12,tick:true},ZIKIR:{berhet:{items:Array.from({length:28},(_,i)=>({tr:'Name '+i,oku:'Name '+i}))}},
  Date:{now:()=>now},Math,Number,Object,console,normalized:s=>s,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),
  r244PlayerRender(){},renderZikir(){},zUI(){},queueRender(){},nowRender(){},vib(){},sfx(){},r485NiyetKey:()=>P.queue[P.i]?._r1082Id,
  E:{render(){}},cancelableWait:wait,wait,tickSnd:manual=>ticks.push({at:now,manual}),
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},
 };
 vm.createContext(ctx);vm.runInContext(fixedCode+'\n'+loopCode,ctx);
 return {P,ctx,reads,waits,ticks,events,completed,advance:ms=>{now+=ms},setRead:f=>{read=f},setWait:f=>{waitHook=f},run:()=>P.loop(P.token),
  useConditional(){ctx.oldOne=P.one.bind(P);vm.runInContext('let r1082VolumeLease=null;\n'+conditionalCode,ctx);},};
}
function ttsFixture(){
 let current=true,next=0;const utterances=[],pulses=[],timers=new Map();
 const speech={speaking:false,pending:false,cancel(){utterances.at(-1)?.__sukunAwaitCancel?.();},speak:u=>utterances.push(u)};
 const ctx={window:{speechSynthesis:speech,SukunRhythm:{voiceStarted(guard,source){pulses.push({guard,source});}}},speechSynthesis:speech,
  SpeechSynthesisUtterance:class{constructor(text){this.text=text}},sleep:async()=>{},pickVoice:()=>({voice:{name:'Turkish',lang:'tr-TR'},realGender:true}),
  setTimeout:(fn,ms)=>{const id=++next;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),SPK:{rate:.86},ZVOL:1,r957Volume:x=>x,
 };
 vm.createContext(ctx);vm.runInContext(ttsCode,ctx);
 return {ctx,pulses,utterances,timers,start:()=>ctx.tts('Yâ Berhetîhin',{isCurrent:()=>current}),invalidate:()=>{current=false},
  async flush(){for(let i=0;i<8;i++)await Promise.resolve();}};
}
(async()=>{
 const all=fixture(Array.from({length:28},(_,i)=>step(i)));all.setRead(async()=>{all.advance(700);return {ok:true,source:'recording'}});await all.run();
 check(()=>assert.equal(all.reads.length,28));check(()=>assert.equal(all.waits.length,27));check(()=>assert(all.waits.every(ms=>ms===900)));
 check(()=>assert(all.reads.slice(1).every((value,i)=>value.at-all.reads[i].at===1600)));
 check(()=>assert.equal(all.ticks.length,28));check(()=>assert(all.ticks.every(pulse=>pulse.manual===true)));
 check(()=>assert.equal(all.completed.length,28));check(()=>assert.equal(all.ctx.Z.target,622));check(()=>assert.equal(all.ctx.Z.count,12));
 check(()=>assert.equal(all.events.filter(e=>e.detail.kind==='gap').length,27));
 const repeated=fixture([step(0,3,900),step(1,2,1500)]);await repeated.run();
 check(()=>assert.deepEqual(repeated.waits,[900,900,900,1500]));check(()=>assert.equal(repeated.ticks.length,5));
 const zero=fixture([step(0,1,0),step(1,1,900)]);await zero.run();check(()=>assert.equal(zero.waits.length,0));
 const silent=fixture([step(0,1,900),{type:'silence',ms:5000,_r1082Id:'quiet'}]);await silent.run();
 check(()=>assert.deepEqual(silent.waits,[5000]));check(()=>assert.equal(silent.ticks.length,1));
 const waiting=fixture([{...step(),advance:'wait'},step(1)]);await waiting.run();
 check(()=>assert.equal(waiting.reads.length,1));check(()=>assert.equal(waiting.P.paused,true));check(()=>assert.deepEqual(waiting.waits,[]));
 // Conditional playback owns its own per-cycle wait and may reach its time
 // limit in that wait. The outer boundary must not add a second full gap.
 const conditional=fixture([{...step(),repeatMode:'duration',repeatForMs:5000},step(1)]);conditional.useConditional();conditional.setRead(async()=>{conditional.advance(4500);return {ok:true,source:'recording'}});await conditional.run();check(()=>assert.deepEqual(conditional.waits,[900]));check(()=>assert.equal(conditional.reads.length,2));
 const off=fixture([step(0,2)]);off.ctx.Z.tick=false;await off.run();check(()=>assert.equal(off.ticks.length,0));
 const failed=fixture([step(),step(1)]);failed.setRead(async()=>({ok:false}));await failed.run();
 check(()=>assert.equal(failed.ticks.length,0));check(()=>assert.equal(failed.reads.length,2));check(()=>assert.deepEqual(failed.waits,[220]));check(()=>assert.equal(failed.P.i,0));
 const cancelled=fixture([step(),step(1)]);cancelled.setRead(async()=>({ok:false,cancelled:true}));await cancelled.run();
 check(()=>assert.equal(cancelled.ticks.length,0));check(()=>assert.equal(cancelled.waits.length,0));
 const stale=fixture([step(),step(1)]);stale.setRead(async()=>{stale.P.pause();return {ok:true}});await stale.run();
 check(()=>assert.equal(stale.ticks.length,0));check(()=>assert.equal(stale.waits.length,0));
 // A confirmed read remains spent if Pause happens during its outgoing gap.
 // Resume waits again, but never replays/recounts that already complete read.
 const paused=fixture([step(),step(1)]);let release,atGap;
 const gapReady=new Promise(resolve=>{atGap=resolve});paused.setWait(async()=>{atGap();await new Promise(resolve=>{release=resolve});});
 const pending=paused.run();await gapReady;check(()=>assert.equal(paused.P._r982CompletedReps,1));paused.P.pause();release();await pending;
 check(()=>assert.equal(paused.reads.length,1));check(()=>assert.equal(paused.completed.length,0));
 paused.setWait(null);paused.P.playing=true;paused.P.paused=false;await paused.run();
 check(()=>assert.equal(paused.reads.length,2));check(()=>assert.equal(paused.ticks.length,2));check(()=>assert.equal(paused.completed.length,2));
 const edited=fixture([step(),step(1)]);edited.setWait(async()=>{edited.P.queue[0]={...edited.P.queue[0],_r1082Id:'replacement'};});await edited.run();
 check(()=>assert.equal(edited.P.paused,true));check(()=>assert.equal(edited.reads.length,1));check(()=>assert.equal(edited.completed.length,0));
 for(const [gap,expected] of [[NaN,600],[-10,0],[50000,30000]]){const bounded=fixture([step(0,1,gap),step(1)]);await bounded.run();check(()=>assert.deepEqual(bounded.waits,expected?[expected]:[]));}
 const success=ttsFixture(),successful=success.start();await success.flush();const u=success.utterances[0];
 check(()=>assert.equal(success.pulses.length,0));u.onstart();u.onstart();check(()=>assert.equal(success.pulses.length,1));
 check(()=>assert.equal(success.pulses[0].source,'smart-tts'));check(()=>assert.equal(success.pulses[0].guard(),true));u.onend();const successResult=await successful;check(()=>assert.equal(successResult.ok,true));check(()=>assert.equal(success.pulses[0].guard(),false));
 const unstarted=ttsFixture(),unstartedWork=unstarted.start();await unstarted.flush();unstarted.utterances[0].onend();const unstartedResult=await unstartedWork;check(()=>assert.equal(unstartedResult.ok,false));check(()=>assert.equal(unstarted.pulses.length,0));
 const obsolete=ttsFixture(),obsoleteWork=obsolete.start();await obsolete.flush();obsolete.invalidate();obsolete.utterances[0].onstart();const obsoleteResult=await obsoleteWork;check(()=>assert.equal(obsoleteResult.ok,false));check(()=>assert.equal(obsolete.pulses.length,0));
 const interrupted=ttsFixture(),interruptedWork=interrupted.start();await interrupted.flush();interrupted.utterances[0].onstart();interrupted.invalidate();check(()=>assert.equal(interrupted.pulses[0].guard(),false));interrupted.utterances[0].onend();const interruptedResult=await interruptedWork;check(()=>assert.equal(interruptedResult.ok,false));
 process.stdout.write(JSON.stringify({suite:'r1085 smart cadence, selected tick and guarded TTS rhythm',passed,scope:'shipping functions; controlled clocks/audio outcomes; audible sound not measured'})+'\n');
})().catch(error=>{console.error(error);process.exitCode=1});
