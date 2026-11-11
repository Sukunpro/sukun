'use strict';
// Execute shipped transport callbacks and both journey deadlines with independent
// wall/media clocks. Synthetic evidence only: this does not measure phone audio.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(process.env.SUKUN_TEST_HTML||path.join(root,'index.html'),'utf8');
function fragment(first,last,from=0){const a=html.indexOf(first,from),b=html.indexOf(last,a);assert(a>=0&&b>a,first+' shipped boundaries');return html.slice(a,b);}
const probes=fragment('function ownsProgress(owner,key,index){','function remainingFor(');
const events=fragment('function onTime(','function onPause(){',html.indexOf('<script id="r648-lock-journey-transport-v2">'));
function fixture(kind=28,hidden=false){
 let at=100000,matched=true,held=false,live=true;
 const L={active:true,owner:'journey'+kind,key:kind===28?'berhet:6':'esma:6:nida',index:6,seq:2,
  dormant:false,frozen:false,mediaSource:'blob:synthetic-word',lastCurrent:1,lastProgressAt:at,
  mediaSampleAt:at,watchdogCurrent:1,watchdogProgressAt:0,watchdogProbeUsed:false,
  mediaProgressMs:930000,applied:310,startRep:0,observedWraps:310,seekDebtMs:0,
  startPhaseMs:0,cycleMs:3000,settingsSig:'same',settingsPending:false,pauseAt:0,playEvents:0};
 const a={src:L.mediaSource,paused:false,ended:false,seeking:false,readyState:4,currentTime:1,duration:3,playbackRate:1,loop:true,error:null};
 const timers=[],cuts=[],settled=[],logs=[];
 const c={L,boundAudio:a,Number,String,Math,now:()=>at,audio:()=>a,sourceMatches:()=>matched,machinePaused:()=>held,
  clamp:(n,min,max)=>Math.max(min,Math.min(max,n)),requestedSettings:()=>L.settingsSig,
  completedCycles:()=>Math.floor(L.mediaProgressMs/L.cycleMs),settleNow(){},remainingFor:()=>300,
  advance(){throw Error('unexpected target completion');},scheduleTarget(){},log:type=>logs.push(type),native:()=>({gapIncludedMs:0}),
  document:{hidden},window:{SukunBackgroundAudioOwner:{snapshot:()=>({active:true,owner:'journey',blocked:false,preparing:false,lockRecoveryPending:false})}},
  current:()=>live,index:6,timer:0,timedOut:false,BS:{attemptSeq:1},ES:{attemptSeq:1},resolve:value=>settled.push(value),
  seyirAktifKaynakKes:reason=>cuts.push(reason),es99CutSource:reason=>cuts.push(reason),
  setTimeout:(fn,delay)=>{timers.push({fn,delay});return timers.length;}};
 vm.createContext(c);vm.runInContext(probes+'\n'+events,c,{filename:'shipped-transport-probes-and-events.js'});
 const progress=(owner=L.owner,key=L.key,index=L.index)=>c.ownsProgress(owner,key,index);
 const probe=()=>c.claimProgressProbe(L.owner,L.key,L.index);
 c.window.SukunLockJourneyTransportV2={ownsProgress:progress,ownsRecovery:c.ownsRecovery,claimProgressProbe:c.claimProgressProbe};
 const from=html.indexOf(kind===28?'async function seyirOkuGuvenli(':'async function es99PlaySafe(');
 const deadline=fragment('const deadline=()=>{','timer=setTimeout(deadline,'+(kind===28?'timeout':'document.hidden?95000:35000'),from).trim().replace('const deadline=','var deadline=');
 vm.runInContext(deadline,c,{filename:'shipped-'+kind+'-deadline.js'});
 const wall=ms=>at+=ms,emit=name=>c[name].call(a),counts=()=>[L.mediaProgressMs,L.applied,L.startRep,L.observedWraps,L.seekDebtMs];
 const physical=()=>{wall(90000);a.currentTime=1.8;emit('onTime');};
 const buffering=state=>{wall(213);a.readyState=state==='seeking'?4:state;a.seeking=state==='seeking';a.currentTime=0;emit('onSeeking');};
 const next=()=>{const t=timers.shift();assert(t,'scheduled watchdog');wall(t.delay);t.fn();};
 return{L,a,c,timers,cuts,settled,logs,progress,probe,wall,emit,counts,physical,buffering,next,
  hold:v=>held=v,match:v=>matched=v,live:v=>live=v};
}
const results=[];
function test(name,fn){try{fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.stack||String(e)});}}
for(const kind of [28,99])for(const hidden of [false,true])for(const state of [0,1,'seeking']){
 const label=kind+' '+(hidden?'hidden':'visible')+' '+(state==='seeking'?'seeking':'readyState '+state);
 test(label+': deadline retains recent physical progress through loop buffering',()=>{
  const f=fixture(kind,hidden);f.physical();f.buffering(state);const before=f.counts();
  f.c.deadline();assert.equal(f.cuts.length,0,'recent physical progress must not be retired at the loop seek');
  assert.equal(f.timers[0]?.delay,5000);assert.equal(f.settled.length,0);assert.deepEqual(f.counts(),before,'watchdog grants no repeat credit');
  f.a.readyState=4;f.a.seeking=false;f.a.currentTime=.2;f.next();assert.equal(f.cuts.length,0,'actual resumed progress keeps the same caller');
 });
 test(label+': prolonged buffering expires despite playing/seeking event delivery',()=>{
  const f=fixture(kind,hidden);f.physical();f.buffering(state);f.c.deadline();
  assert.equal(f.cuts.length,0);f.emit('onPlaying');f.next();assert.equal(f.cuts.length,0,'existing physical grace covers its first five seconds');
  f.emit('onPlaying');f.emit('onSeeking');f.next();
  assert.deepEqual(f.cuts,['resolver-timeout']);assert.equal(f.settled[0]?.reason,'resolver-timeout');assert.equal(f.timers.length,0);
 });
}
for(const state of [0,1,'seeking'])test('physical grace expires at 6500ms for '+state,()=>{
 const f=fixture();f.physical();f.buffering(state);f.wall(6286);assert.equal(f.progress(),true);
 f.wall(1);assert.equal(f.progress(),false);f.wall(60000);assert.equal(f.progress(),false);
});
test('playing events without clock movement cannot renew healthy-ready liveness or its one-shot probe',()=>{
 const f=fixture();f.physical();const at=f.L.watchdogProgressAt;f.wall(6500);f.emit('onPlaying');
 assert.equal(f.progress(),false);assert.equal(f.probe(),true);f.emit('onPlaying');f.wall(250);
 assert.equal(f.progress(),false);assert.equal(f.probe(),false);assert.equal(f.L.watchdogProgressAt,at);
});
for(const state of [0,1,'seeking'])test('unready/seeking timeupdates and later readiness cannot turn seek offsets into progress: '+state,()=>{
 const f=fixture();f.physical();const at=f.L.watchdogProgressAt;f.buffering(state);f.wall(7000);
 for(let i=0;i<3;i++){f.a.currentTime=.4+i*.1;f.emit('onTime');f.emit('onPlaying');assert.equal(f.progress(),false);}
 assert.equal(f.L.watchdogProgressAt,at);f.a.seeking=false;f.a.readyState=4;assert.equal(f.progress(),false,'same seek position is not later physical proof');
 f.wall(200);f.a.currentTime+=.2;assert.equal(f.progress(),true,'new physical movement may prove recovery');
});
test('seeking callback rebases before a later non-seeking watchdog even without a seeking-time sample',()=>{
 const f=fixture();f.physical();f.wall(7000);f.a.seeking=true;f.a.currentTime=.5;f.emit('onSeeking');
 f.a.seeking=false;assert.equal(f.progress(),false,'seek jump must not masquerade as playback');
});
test('queued native-loop seeking callback alone cannot renew proof after seeking flag clears',()=>{
 const f=fixture();f.physical();const at=f.L.watchdogProgressAt;f.wall(7000);f.a.currentTime=0;
 f.emit('onSeeking');assert.equal(f.L.watchdogProgressAt,at);assert.equal(f.progress(),false);
});
test('a delayed timeupdate cannot renew cursor movement already observed by the watchdog',()=>{
 const f=fixture();f.wall(90000);f.a.currentTime=1.8;assert.equal(f.progress(),true);
 const at=f.L.watchdogProgressAt;f.wall(6500);f.emit('onTime');assert.equal(f.L.watchdogProgressAt,at);assert.equal(f.progress(),false);
});
for(const invalid of ['paused','ended','error','dormant','frozen','inactive','pause-intent','source','recording-key','owner','key','index'])test('recent progress does not bypass '+invalid,()=>{
 const f=fixture();f.physical();f.buffering(1);
 if(invalid==='paused')f.a.paused=true;if(invalid==='ended')f.a.ended=true;if(invalid==='error')f.a.error={code:3};
 if(invalid==='dormant')f.L.dormant=true;if(invalid==='frozen')f.L.frozen=true;if(invalid==='inactive')f.L.active=false;
 if(invalid==='pause-intent')f.hold(true);if(invalid==='source')f.a.src='blob:replacement';if(invalid==='recording-key')f.match(false);
 const before=f.counts();assert.equal(f.progress(invalid==='owner'?'journey99':f.L.owner,invalid==='key'?'berhet:7':f.L.key,invalid==='index'?7:6),false);
 assert.deepEqual(f.counts(),before);
});
test('errored native loop cannot obtain the one-shot progress probe',()=>{
 const f=fixture();f.physical();f.wall(7000);f.a.error={code:3};assert.equal(f.probe(),false);
});
for(const kind of [28,99])for(const command of ['pause','stop','replacement'])test(kind+': '+command+' retires the old watchdog without cutting its successor',()=>{
 const f=fixture(kind,true);f.physical();f.buffering(1);f.live(false);f.c.deadline();
 assert.equal(f.settled[0]?.reason,'stale-sequence');assert.equal(f.cuts.length,0);assert.equal(f.timers.length,0);
});
test('a lease with no physical evidence cannot borrow repeated playing events for buffering grace',()=>{
 const f=fixture();f.a.readyState=1;for(let i=0;i<3;i++){f.emit('onPlaying');f.wall(100);assert.equal(f.progress(),false);}
});
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const report={suite:'r1248 bounded native loop buffering watchdog',sourceSha256:hash(html),probeSha256:hash(probes),eventSha256:hash(events),passed:results.filter(r=>r.passed).length,total:results.length,results,
 limitations:['Synthetic independent wall/media clocks exercise shipped functions. Physical Android lockscreen scheduling, Bluetooth/focus behavior and audible speaker output are not measured.']};
if(process.argv[3]){const output=path.resolve(process.argv[3]);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
