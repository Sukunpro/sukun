'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(process.argv[2]||path.join(__dirname,'../..'),'index.html'),'utf8');
const start=html.indexOf('function r1043RecordingElementAttack(');
const end=html.indexOf('\nfunction itemRecSyncUI()',start);
assert(start>=0&&end>start,'recording attack and its actual playback caller exist');
const playbackSource=html.slice(start,end);
const helperSource=playbackSource.slice(0,playbackSource.indexOf('\nasync function playRecording('));

class Events {
  constructor(){this.listeners=new Map()}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn)}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn)}
  dispatch(type){for(const fn of [...(this.listeners.get(type)||[])])fn({type})}
  count(type){return this.listeners.get(type)?.size||0}
}
function harness({hidden=false,volume=.6,deferPlay=false}={}){
  let now=0,sequence=0;const timers=new Map(),instances=[];
  const document=new Events();document.hidden=hidden;
  const setTimer=(fn,delay,interval=false)=>{const id=++sequence;timers.set(id,{fn,due:now+delay,delay,interval});return id};
  const advance=ms=>{
    const until=now+ms;let limit=100;
    while(limit--){
      const next=[...timers].filter(([,t])=>t.due<=until).sort((a,b)=>a[1].due-b[1].due)[0];
      if(!next)break;
      const [id,t]=next;now=Math.max(now,t.due);timers.delete(id);t.fn();
      if(t.interval&& !timers.has(id))timers.set(id,{...t,due:now+t.delay});
    }
    assert(limit>0,'bounded scheduled work');now=until;
  };
  class Media extends Events {
    constructor(url){super();this.src=url;this.paused=false;this.ended=false;this.currentTime=0;this.duration=2;this.playbackRate=1;this.writes=[];this._volume=0;this.plays=0;this.pauses=0;instances.push(this)}
    get volume(){return this._volume}
    set volume(n){this._volume=n;this.writes.push(n)}
    play(){this.plays++;this.volumeAtPlay=this.volume;this.paused=false;return deferPlay?new Promise(resolve=>{this.resolvePlay=resolve}):Promise.resolve()}
    start(){this.dispatch('playing');this.resolvePlay?.()}
    pause(){this.pauses++;this.paused=true;this.dispatch('pause')}
  }
  let current=true;
  const context={
    document,performance:{now:()=>now},
    setTimeout:(fn,ms)=>setTimer(fn,ms),clearTimeout:id=>timers.delete(id),
    setInterval:(fn,ms)=>setTimer(fn,ms,true),clearInterval:id=>timers.delete(id),
    requestAnimationFrame:()=>{throw Error('recording audio must not request a visual frame')},cancelAnimationFrame:()=>{},
    Audio:Media,URL:{createObjectURL:()=>`blob:test-${instances.length}`,revokeObjectURL:()=>{}},
    window:{SukunVoiceAttempt:{capture:()=>()=>current},dispatchEvent:()=>{}},
    SES:{ad:null,ler:new Set()},Z:{auto:false},ZVOL:volume,KAYIT:{mekan:false,yankiMik:0},KAYIT_RAF:null,ctx:null,
    localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
    RECPLAYING:false,zikirSesliTekrarMi:()=>false,zikirKey:()=>'',
    sukunRecordingKeyFrom:()=> 'test-recording',sesDurdur:()=>{},kayitZinciriKur:()=>null,
    r957Volume:v=>v==null?1:v,r657ContinuityBump:()=>{},r658BoundaryBump:()=>{},sukunVoiceOverlapGuard:()=>{},
    sukunPoolDispose:()=>{},Date:{now:()=>now},CustomEvent:class {},
  };
  vm.createContext(context);
  // r1049 adds a production attempt-identity capability; load that real
  // helper rather than bypassing it in this extracted playback fixture.
  const authorityStart=html.indexOf('window.SukunRecordingStartIntent=')>=0?html.indexOf('window.SukunRecordingStartIntent='):html.indexOf('function r1049RecordingIntentAuthority('),authorityEnd=html.indexOf('/* r1048: live recording level',authorityStart);
  if(authorityStart>=0&&authorityEnd>authorityStart)vm.runInContext(html.slice(authorityStart,authorityEnd),context);
  vm.runInContext(playbackSource,context);
  return {context,document,timers,instances,Media,advance,stale:()=>{current=false},
    hide:()=>{document.hidden=true;document.dispatch('visibilitychange')},
    throttle:ms=>{now+=ms;advance(0)},
    helper:(...args)=>context.r1043RecordingElementAttack(...args)};
}
function clean(h,a){assert.equal(h.document.count('visibilitychange'),0);assert.equal(a.count('pause'),0);assert.equal(a.count('ended'),0);assert.equal(h.timers.size,0)}

{
  const h=harness(),a=new h.Media('raw');h.helper(a,.6,18,()=>true);
  assert.equal(a.volume,0);h.advance(6);assert(Math.abs(a.volume-.2)<1e-10);
  h.advance(6);assert(Math.abs(a.volume-.4)<1e-10);h.advance(6);assert.equal(a.volume,.6);
  clean(h,a);assert.equal(a.plays,0);assert.equal(a.pauses,0);
}
{
  const h=harness({hidden:true}),a=new h.Media('raw');h.helper(a,.7,18,()=>true);
  assert.equal(a.volume,.7);clean(h,a);assert.equal(a.plays,0);
}
{
  const h=harness(),a=new h.Media('raw');h.helper(a,.6,18,()=>true);h.advance(6);h.hide();
  assert.equal(a.volume,.6);clean(h,a);h.advance(1000);assert.equal(a.volume,.6);assert.equal(a.plays,0);
}
{
  const h=harness(),a=new h.Media('raw');h.helper(a,.6,18,()=>true);h.throttle(1000);
  assert.equal(a.volume,.6);clean(h,a);
}
for(const stop of ['pause','cancel','stale-timer','stale-hide','ended']){
  const h=harness(),a=new h.Media('pooled');let current=true;
  const cancel=h.helper(a,.6,18,()=>current);h.advance(6);const before=a.volume;
  if(stop==='pause')a.pause();
  if(stop==='cancel')cancel();
  if(stop==='ended'){a.ended=true;a.dispatch('ended')}
  if(stop.startsWith('stale'))current=false;
  if(stop==='stale-hide')h.hide();else h.advance(18);
  assert.equal(a.volume,before,`${stop} must not change a stopped or reused source`);clean(h,a);
  assert.equal(a.plays,0,`${stop} must not reopen playback`);cancel();
}
{
  const h=harness(),a=new h.Media('silent');a.volume=.7;h.helper(a,0,18,()=>true);
  assert.equal(a.volume,0,'an explicit zero target remains zero');clean(h,a);
}
for(const state of ['paused','ended']){
  const h=harness(),a=new h.Media('stopped');a[state]=true;a.volume=.4;
  h.helper(a,.8,18,()=>true);assert.equal(a.volume,.4);clean(h,a);assert.equal(a.plays,0);
}

const drain=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  // Run the actual caller, including the pre-play hidden volume assignment.
  {
    const h=harness({hidden:true,volume:.8,deferPlay:true});
    const completed=h.context.playRecording({size:12,type:'audio/webm'},'test',{resume:false});
    const a=h.instances[0];assert(a);assert.equal(a.volumeAtPlay,.8,'hidden request is audible before playing');
    a.start();await drain();assert.equal(a.volume,.8);assert.equal(a.plays,1);
    a._sukunFinish(false,'user-stop');await completed;
    assert.equal(h.document.count('visibilitychange'),0);assert.equal(h.timers.size,0);
  }
  {
    const h=harness({volume:.8,deferPlay:true});
    const completed=h.context.playRecording({size:12,type:'audio/webm'},'test',{resume:false});
    const a=h.instances[0];assert.equal(a.volumeAtPlay,0);h.hide();
    assert.equal(a.volume,.8,'hide while native start is pending restores intended volume');assert.equal(a.plays,1);
    a.start();await drain();assert.equal(a.volume,.8);
    a._sukunFinish(false,'user-stop');await completed;
    assert.equal(h.document.count('visibilitychange'),0);assert.equal(h.timers.size,0);
  }
  for(const stop of ['pause','stale','finish']){
    const h=harness({volume:.8,deferPlay:true});
    const completed=h.context.playRecording({size:12,type:'audio/webm'},'test',{resume:false});
    const a=h.instances[0];
    if(stop==='pause')a.pause();if(stop==='stale')h.stale();if(stop==='finish')a._sukunFinish(false,'user-stop');
    const writes=a.writes.length;h.hide();assert.equal(a.writes.length,writes,`pending ${stop} does not restore volume`);
    assert.equal(h.document.count('visibilitychange'),0);assert.equal(a.plays,1);
    if(stop!=='finish')a._sukunFinish(false,'user-stop');await completed;assert.equal(h.timers.size,0);
  }
  {
    const h=harness({volume:.8,deferPlay:true});
    const completed=h.context.playRecording({size:12,type:'audio/webm'},'test',{resume:false});
    const a=h.instances[0];a.start();await drain();h.advance(6);
    assert(Math.abs(a.volume-.8/3)<1e-10);const writes=a.writes.length;
    a._sukunPlayEpoch++;h.hide();
    assert.equal(a.writes.length,writes,'an older pooled attempt cannot raise its newer owner volume');
    assert.equal(h.document.count('visibilitychange'),0);assert.equal(a.plays,1);
    const pauses=a.pauses;a._sukunFinish(false,'stale-sequence');await completed;
    assert.equal(a.pauses,pauses,'stale cleanup does not pause the pooled source of its newer owner');
    assert.equal(h.timers.size,0);
  }
  {
    const h=harness({volume:.8,deferPlay:true});
    const completed=h.context.playRecording({size:12,type:'audio/webm'},'test',{resume:false});
    const a=h.instances[0];a.start();await drain();h.advance(6);const before=a.volume;
    a._sukunFinish(false,'user-stop');await completed;h.hide();h.advance(20);
    assert.equal(a.volume,before);assert.equal(a.plays,1);assert.equal(h.document.count('visibilitychange'),0);assert.equal(h.timers.size,0);
  }
  {
    const h=harness({volume:0,deferPlay:true,hidden:true});
    const completed=h.context.playRecording({size:12,type:'audio/webm'},'test',{resume:false});
    const a=h.instances[0];assert.equal(a.volumeAtPlay,0);a.start();await drain();assert.equal(a.volume,0);
    a._sukunFinish(false,'user-stop');await completed;assert.equal(h.document.count('visibilitychange'),0);assert.equal(h.timers.size,0);
  }
  assert(!helperSource.includes('requestAnimationFrame('),'helper does not use RAF');
  console.log('PASS r1043 recording attack: visible/hidden onset, pending native start, throttle, cancellation, stale pool ownership, pause, zero volume and cleanup');
})().catch(error=>{console.error(error);process.exitCode=1});
