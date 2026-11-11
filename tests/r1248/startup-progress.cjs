'use strict';
// The native clock may move before queued playing/play Promise delivery.
// Controlled events verify the timeout gate, not physical Android audibility.
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
async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.stack||e.message})}}
const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve()};
function pending(){
 const f=fixture();f.hide();f.a.mode='pending';
 const initialForeground={owner:{id:1,type:'journey28',identity:'berhet:6'},observed:{spokenOwners:['journey28']}};
 f.window.SukunForegroundArbiter={snapshot:()=>initialForeground};
 f.window.SukunJourneyAudioMachine={intentBlocked:()=>false};
 f.id=f.claim();f.result=f.owner.play(f.id).catch(error=>error.name);
 f.a.paused=false;f.a.currentTime=1.25;
 return f;
}
(async()=>{
 await test('Already advancing native media survives delayed playing and play Promise callbacks',async()=>{
  const f=pending();f.delayedTick(12000);assert.equal(await f.result,true);
  assert.equal(f.a.paused,false);assert.equal(f.a.pauseCalls,0);assert.equal(f.a.playCalls,1);
  assert.equal(f.owner.snapshot().phase,'PLAYING');assert.equal(f.owner.snapshot().blocked,false);
  assert.equal(f.owner.snapshot().preparing,false);assert.equal(f.jobs.size,0);
  f.fire(f.a,'playing');await flush();assert.equal(f.a.pauseCalls,0);assert.equal(f.a.playCalls,1);
 });
 await test('Retained accepted foreground owner does not appear to be a competing caller',async()=>{
  const f=pending();f.tick(8000);assert.equal(await f.result,true);assert.equal(f.a.pauseCalls,0);
 });
 await test('A prior source seek does not poison a later native start attempt',async()=>{
  const f=fixture();f.hide();f.a.mode='pending';const id=f.claim();f.seek(.2);
  const result=f.owner.play(id).catch(error=>error.name);f.a.paused=false;f.a.currentTime=.8;
  f.tick(8000);assert.equal(await result,true);assert.equal(f.a.pauseCalls,0);
 });
 for(const invalid of ['unchanged','cursor-noise','backward','nonfinite','paused','ended','seeking','finished-seek','unready','error','source','current-source','source-object','app-pause','native-epoch','caller','replaced-caller','tab','session-pause','terminal','journey-stop','foreign-owner','foreign-spoken-owner','microphone','freeze','pagehide'])await test(`Startup progress rejects ${invalid}`,async()=>{
  const f=pending();
  if(invalid==='unchanged')f.a.currentTime=0;
  if(invalid==='cursor-noise')f.a.currentTime=.02;
  if(invalid==='backward')f.a.currentTime=-.2;
  if(invalid==='nonfinite')f.a.currentTime=NaN;
  if(invalid==='paused')f.a.paused=true;
  if(invalid==='ended')f.a.ended=true;
  if(invalid==='seeking')f.a.seeking=true;
  if(invalid==='finished-seek'){f.seek(.5);f.a.seeking=false;f.a.currentTime=1.25;}
  if(invalid==='unready')f.a.readyState=1;
  if(invalid==='error')f.a.error={code:2};
  if(invalid==='source')f.a.src='blob:replacement';
  if(invalid==='current-source')f.a.currentSrc='blob:replacement';
  if(invalid==='source-object')f.a.srcObject={};
  if(invalid==='app-pause')f.a._sukunAppPauseAt=11000;
  if(invalid==='native-epoch')f.a._sukunLockEpoch=2;
  if(invalid==='caller')f.retire();
  if(invalid==='replaced-caller')f.owner.claim('journey',f.a,'source-a',{isCurrent:()=>true});
  if(invalid==='tab')f.window.SukunTabOwner.owns=()=>false;
  if(invalid==='session-pause')f.window.SukunAudioSessionRegistry={aggregateSnapshot:()=>({paused:true})};
  if(invalid==='terminal')f.window.AudioLife._terminalIntent=true;
  if(invalid==='journey-stop')f.window.SukunJourneyAudioMachine.intentBlocked=()=>true;
  if(invalid==='foreign-owner')f.window.SukunForegroundArbiter.snapshot=()=>({owner:{id:2,type:'reader',identity:'yasin'},observed:{spokenOwners:['reader']}});
  if(invalid==='foreign-spoken-owner')f.window.SukunForegroundArbiter.snapshot=()=>({owner:{id:1,type:'journey28',identity:'berhet:6'},observed:{spokenOwners:['journey28','reader']}});
  if(invalid==='microphone')f.window.SukunItemRecording={snapshot:()=>({phase:'recording'})};
  if(invalid==='freeze')f.fire(f.document,'freeze');
  if(invalid==='pagehide')f.fire(f.window,'pagehide');
  f.delayedTick(12000);assert.equal(await f.result,'PlaybackStartTimeout');
  assert.equal(f.owner.snapshot().blocked,true);assert.equal(f.a.paused,true);assert.equal(f.a.playCalls,1);assert.equal(f.jobs.size,0);
 });
 await test('User pause cancels the pending startup deadline without reopening audio',async()=>{
  const f=pending();f.owner.userPause(f.id);f.a.pause();f.delayedTick(12000);
  assert.equal(await f.result,false);assert.equal(f.owner.snapshot().phase,'PAUSED');assert.equal(f.a.playCalls,1);assert.equal(f.jobs.size,0);
 });
 await test('Source lease replacement retires the old deadline',async()=>{
  const f=pending();f.owner.claim('journey',f.a,'replacement',f.authority);f.delayedTick(12000);
  assert.equal(await f.result,false);assert.equal(f.owner.snapshot().phase,'PREPARING');assert.equal(f.a.pauseCalls,0);assert.equal(f.jobs.size,0);
 });
 await test('Unchanged media still fails at the original eight second boundary',async()=>{
  const f=pending();f.a.currentTime=0;f.tick(7999);assert.equal(f.a.pauseCalls,0);assert.equal(f.owner.snapshot().preparing,true);
  f.tick(1);assert.equal(await f.result,'PlaybackStartTimeout');assert.equal(f.a.pauseCalls,1);
 });
 const failed=results.filter(r=>!r.passed);
 console.log(JSON.stringify({suite:'r1248 native startup progress',total:results.length,passed:results.length-failed.length,failed:failed.length,scope:'Shipped owner with independent native cursor and queued events; no physical-device/audio-output verification.',results},null,2));if(failed.length)process.exitCode=1;
})();
