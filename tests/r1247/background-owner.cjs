'use strict';
// Execute the production owner with native media events and a controlled clock.
// This verifies ownership and bounded recovery; it cannot measure Android sound.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=process.env.SUKUN_OWNER_SOURCE||path.join(root,'assets/runtime/background-owner-r949.js'),code=fs.readFileSync(source,'utf8');
function fixture(){
 let at=10000,next=0;const jobs=new Map();
 const hub=()=>({handlers:new Map(),addEventListener(type,fn){if(!this.handlers.has(type))this.handlers.set(type,new Set());this.handlers.get(type).add(fn)},removeEventListener(type,fn){this.handlers.get(type)?.delete(fn)},dispatchEvent(event){for(const fn of [...(this.handlers.get(event.type)||[])])fn(event)}});
 const window=hub(),document=hub();document.hidden=false;
 window.AudioLife={userPaused:false,_terminalIntent:false};window.SukunTabOwner={owns:()=>true};
 const events=[];window.addEventListener('sukun:backgroundownerchange',e=>events.push(e.detail));
 const context=vm.createContext({window,document,CustomEvent:class{constructor(type,opt){this.type=type;this.detail=opt.detail}},Date:{now:()=>at},Object,String,Number,Promise,Error,setTimeout:(fn,ms)=>{jobs.set(++next,{fn,at:at+ms});return next},clearTimeout:id=>jobs.delete(id)});
 vm.runInContext(code,context,{filename:source});
 const fire=(target,type)=>target.dispatchEvent({type});
 const media=()=>Object.assign(hub(),{src:'blob:test',currentSrc:'blob:test',srcObject:null,currentTime:0,duration:2,loop:true,paused:true,ended:false,readyState:4,error:null,muted:false,volume:1,playCalls:0,pauseCalls:0,mode:'playing',play(){this.playCalls++;if(this.mode==='reject')return Promise.reject(Object.assign(new Error('rejected'),{name:'NotAllowedError'}));if(this.mode==='pending')return new Promise(()=>{});this.paused=false;fire(this,'playing');return Promise.resolve()},pause(){this.pauseCalls++;this.paused=true;fire(this,'pause')}});
 const tick=ms=>{const end=at+ms;let n=0;for(;;){const due=[...jobs].filter(([,job])=>job.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;if(++n>100)throw new Error('unbounded timer loop');jobs.delete(due[0]);at=due[1].at;due[1].fn()}at=end};
 // Model a hidden event loop that delivers all overdue timers at the later
 // wall-clock time, rather than running each at its requested deadline.
 const delayedTick=ms=>{at+=ms;let n=0;for(;;){const due=[...jobs].filter(([,job])=>job.at<=at).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;if(++n>100)throw new Error('unbounded delayed timer loop');jobs.delete(due[0]);due[1].fn()}};
 const owner=window.SukunBackgroundAudioOwner,a=media();
 let callerLive=true;const authority={isCurrent:()=>callerLive};
 const claim=(element=a,key='source-a')=>owner.claim('journey',element,key,authority);
 const start=async(element=a,key='source-a')=>{const id=claim(element,key);assert.equal(await owner.play(id),true);return id};
 const hide=()=>{document.hidden=true;fire(document,'visibilitychange')};
 const visible=()=>{document.hidden=false;fire(document,'visibilitychange')};
 const pause=()=>a.pause();
 const progress=(time=1.8)=>{a.currentTime=time;fire(a,'timeupdate')};
 const seek=(time=0)=>{a.currentTime=time;fire(a,'seeking')};
 const retire=()=>{callerLive=false};
 return{window,document,a,owner,events,jobs,fire,tick,delayedTick,claim,start,hide,visible,pause,progress,seek,retire,authority};
}
const results=[];
async function test(name,fn){try{await fn();results.push({name,status:'PASS'})}catch(e){results.push({name,status:'FAIL',error:e.stack||e.message})}}
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve()};
(async()=>{
 const late=async()=>{const f=fixture();await f.start();f.hide();f.tick(140000);f.progress();return f};
 await test('A witnessed loop seek then pause after 140 seconds hidden recovers the current lease once',async()=>{
  const f=await late();f.seek();f.pause();const pending=f.owner.snapshot();
  assert.equal(pending.phase,'INTERRUPTED');assert.equal(pending.lockRecoveryPending,true);assert.equal(pending.backgroundRecoveryKind,'loop-boundary');
  assert.equal(pending.lockTransitionAgeMs,140000);assert.equal(pending.lockRecoveryEligible,true);
  f.tick(120);await flush();assert.equal(f.a.playCalls,2);assert.equal(f.a.currentTime,0);assert.equal(f.a.src,'blob:test');assert.equal(f.owner.snapshot().phase,'PLAYING');assert.equal(f.owner.snapshot().loopPauseRecoveries,1);assert.equal(f.owner.snapshot().lockRecoveryReason,'loop-boundary-recovered');assert.equal(f.jobs.size,0);
 });
 await test('Delayed background timer delivery preserves the exact loop pause evidence',async()=>{
  for(const delay of [1000,4000]){const f=await late();f.seek();f.pause();f.delayedTick(delay);await flush();assert.equal(f.a.playCalls,2,`delay ${delay}`);assert.equal(f.owner.snapshot().phase,'PLAYING');assert.equal(f.owner.snapshot().loopPauseRecoveries,1);assert.equal(f.jobs.size,0)}
 });
 await test('Lock-transition recovery retains its existing expiry boundary',async()=>{const f=fixture();await f.start();f.hide();f.pause();f.delayedTick(2000);await flush();assert.equal(f.a.playCalls,1);assert.equal(f.owner.snapshot().lockRecoveryReason,'lock-transition-recovery-cancelled')});
 await test('Delayed recovery remains bounded and does not replay an expired pause',async()=>{const f=await late();f.seek();f.pause();f.delayedTick(8001);await flush();assert.equal(f.a.playCalls,1);assert.equal(f.owner.snapshot().phase,'INTERRUPTED');assert.equal(f.owner.snapshot().lockRecoveryPending,false);assert.equal(f.jobs.size,0)});
 await test('Delayed loop recovery rechecks user commands, caller and source ownership',async()=>{
  for(const change of ['pause','stop','caller','source','epoch','tab','session','foreground','muted','freeze','pagehide','visible']){
   const f=await late();f.seek();f.pause();
   if(change==='pause')f.owner.userPause(f.owner.snapshot().lease);
   if(change==='stop')f.owner.holdRecovery(f.a,'app-stop');
   if(change==='caller')f.retire();
   if(change==='source')f.a.src='blob:replacement';
   if(change==='epoch')f.a._sukunLockEpoch=2;
   if(change==='tab')f.window.SukunTabOwner.owns=()=>false;
   if(change==='session')f.window.SukunAudioSessionRegistry={aggregateSnapshot:()=>({paused:true})};
   if(change==='foreground')f.window.SukunForegroundArbiter={snapshot:()=>({owner:{id:9,type:'reader',identity:'other'}})};
   if(change==='muted')f.a.muted=true;
   if(change==='freeze')f.fire(f.document,'freeze');
   if(change==='pagehide')f.fire(f.window,'pagehide');
   if(change==='visible')f.visible();
   f.delayedTick(1000);await flush();assert.equal(f.a.playCalls,1,change);assert.equal(f.jobs.size,0,change);
  }
 });
 await test('A later pause cannot inherit the delayed recovery permit of an earlier pause',async()=>{const f=await late();f.seek();f.pause();f.pause();f.delayedTick(1000);await flush();assert.equal(f.a.playCalls,1);assert.equal(f.owner.snapshot().phase,'INTERRUPTED')});
 await test('A zero-position timeupdate before seeking preserves the observed loop boundary',async()=>{const f=await late();f.progress(0);f.seek();f.pause();f.tick(120);await flush();assert.equal(f.a.playCalls,2);assert.equal(f.owner.snapshot().loopPauseRecoveries,1)});
 await test('A zero-position timeupdate alone cannot authorize a late native pause',async()=>{const f=await late();f.progress(0);f.pause();f.tick(2000);assert.equal(f.a.playCalls,1)});
 await test('Loop seek events alone never replay audio or schedule timers',async()=>{const f=await late();f.seek();f.tick(120000);assert.equal(f.a.playCalls,1);assert.equal(f.jobs.size,0)});
 await test('Unknown late OS focus or headphone pause remains held',async()=>{const f=await late();f.pause();f.tick(120000);assert.equal(f.a.playCalls,1);assert.equal(f.owner.snapshot().phase,'INTERRUPTED');assert.equal(f.jobs.size,0)});
 await test('A stale loop seek cannot reopen a later OS pause',async()=>{const f=await late();f.seek();f.tick(501);f.pause();f.tick(2000);assert.equal(f.a.playCalls,1)});
 await test('A non-loop seek cannot authorize background replay',async()=>{const f=await late();f.a.loop=false;f.seek();f.pause();f.tick(2000);assert.equal(f.a.playCalls,1)});
 await test('A seek into the middle of a loop does not authorize replay',async()=>{const f=await late();f.seek(.5);f.pause();f.tick(2000);assert.equal(f.a.playCalls,1)});
 await test('An unprogressed initial source cannot authorize loop recovery',async()=>{const f=fixture();await f.start();f.hide();f.tick(140000);f.seek();f.pause();f.tick(2000);assert.equal(f.a.playCalls,1)});
 await test('Explicit pause cancels a pending late loop recovery',async()=>{const f=await late();f.seek();f.pause();f.owner.userPause(f.owner.snapshot().lease);f.tick(2000);assert.equal(f.a.playCalls,1);assert.equal(f.owner.snapshot().phase,'PAUSED')});
 await test('App stop retires loop recovery even before its native pause arrives',async()=>{const f=await late();f.seek();f.owner.holdRecovery(f.a,'app-stop');f.pause();f.tick(2000);assert.equal(f.a.playCalls,1)});
 await test('Caller retirement during the recovery delay prevents replay',async()=>{const f=await late();f.seek();f.pause();f.retire();f.tick(2000);assert.equal(f.a.playCalls,1)});
 await test('Replacement of source or native epoch during delay prevents replay',async()=>{for(const prop of ['src','currentSrc','srcObject','_sukunLockEpoch','_sukunAppPauseAt']){const f=await late();f.seek();f.pause();f.a[prop]=prop==='srcObject'?{}:'changed';f.tick(2000);assert.equal(f.a.playCalls,1,prop)}});
 await test('Audio session pause, recorder ownership and terminal intent cancel delayed recovery',async()=>{for(const hold of ['session','recording','terminal','tab','foreground']){const f=await late();f.seek();f.pause();if(hold==='session')f.window.SukunAudioSessionRegistry={aggregateSnapshot:()=>({paused:true})};if(hold==='recording')f.window.SukunItemRecording={snapshot:()=>({phase:'recording'})};if(hold==='terminal')f.window.AudioLife._terminalIntent=true;if(hold==='tab')f.window.SukunTabOwner.owns=()=>false;if(hold==='foreground')f.window.SukunForegroundArbiter={snapshot:()=>({owner:{id:9,type:'reader',identity:'other'}})};f.tick(2000);assert.equal(f.a.playCalls,1,hold)}});
 await test('Freeze and page departure cancel late loop recovery without retry on resume',async()=>{for(const type of ['freeze','pagehide']){const f=await late();f.seek();f.pause();f.fire(type==='freeze'?f.document:f.window,type);f.tick(500);f.fire(type==='freeze'?f.document:f.window,type==='freeze'?'resume':'pageshow');f.pause();f.tick(2000);assert.equal(f.a.playCalls,1,type)}});
 await test('A second loop-associated pause in the same hidden epoch remains held',async()=>{const f=await late();f.seek();f.pause();f.tick(120);await flush();f.tick(140000);f.progress();f.seek();f.pause();f.tick(120000);assert.equal(f.a.playCalls,2);assert.equal(f.owner.snapshot().phase,'INTERRUPTED');assert.equal(f.jobs.size,0)});
 await test('Rejected loop recovery consumes the lease with no retry storm',async()=>{const f=await late();f.a.mode='reject';f.seek();f.pause();f.tick(120);await flush();assert.equal(f.owner.snapshot().blocked,true);assert.equal(f.owner.snapshot().pauseRecoveryFailures,1);assert.equal(f.owner.snapshot().lockRecoveryReason,'loop-boundary-recovery-rejected');f.tick(120000);assert.equal(f.a.playCalls,2);assert.equal(f.jobs.size,0)});
 await test('Recovery never crosses a hidden visibility epoch or changes muted intent',async()=>{for(const change of ['visible','muted']){const f=await late();f.seek();f.pause();if(change==='visible')f.visible();else f.a.muted=true;f.tick(2000);assert.equal(f.a.playCalls,1,change)}});
 await test('A source started hidden can recover its own later witnessed loop pause',async()=>{const f=fixture();f.hide();await f.start();f.tick(140000);f.progress();f.seek();f.pause();f.tick(120);await flush();assert.equal(f.a.playCalls,2);assert.equal(f.owner.snapshot().loopPauseRecoveries,1)});
 const failed=results.filter(r=>r.status==='FAIL');console.log(JSON.stringify({source,total:results.length,passed:results.length-failed.length,failed:failed.length,scope:'Production owner with controlled native events and timers; no physical Android audio verification.',results},null,2));if(failed.length)process.exitCode=1;
})();
