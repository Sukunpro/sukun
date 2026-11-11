'use strict';
// The shipped ownership probes run with separate wall/media clocks. This is
// an event-throttling regression, not a physical Android/audio-output test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(process.env.SUKUN_TEST_HTML||path.join(root,'index.html'),'utf8');
const start=html.indexOf('function ownsProgress(owner,key,index){');
const end=html.indexOf('function remainingFor(',start);
assert(start>=0&&end>start,'production watchdog ownership probes');
const code=html.slice(start,end);
function fixture(){
 let at=100000,sourceMatch=true,pausedIntent=false;
 const L={active:true,owner:'journey28',key:'berhet:6',index:6,dormant:false,frozen:false,
  mediaSource:'blob:word',lastCurrent:1,lastProgressAt:at,watchdogCurrent:1,watchdogProgressAt:0,
  mediaProgressMs:930000,applied:310,startRep:0,observedWraps:310,seekDebtMs:0};
 const a={src:'blob:word',paused:false,ended:false,seeking:false,readyState:4,currentTime:1};
 const bg={active:true,owner:'journey',blocked:false,lockRecoveryPending:false,preparing:false};
 const c={L,Number,String,Math,now:()=>at,audio:()=>a,sourceMatches:()=>sourceMatch,machinePaused:()=>pausedIntent,
  window:{SukunBackgroundAudioOwner:{snapshot:()=>({...bg})}}};
 vm.createContext(c);vm.runInContext(code,c,{filename:'shipped-journey-watchdog.js'});
 const progress=(owner=L.owner,key=L.key,index=L.index)=>c.ownsProgress(owner,key,index);
 const recovery=(owner=L.owner,key=L.key,index=L.index)=>c.ownsRecovery(owner,key,index);
 const probe=(owner=L.owner,key=L.key,index=L.index)=>c.claimProgressProbe?.(owner,key,index)||false;
 const counts=()=>[L.mediaProgressMs,L.applied,L.startRep,L.observedWraps,L.seekDebtMs,L.lastCurrent,L.lastProgressAt];
 return{L,a,bg,c,progress,recovery,probe,counts,wall:ms=>at+=ms,sourceMatch:value=>sourceMatch=value,intent:value=>pausedIntent=value};
}
const results=[];
function test(name,fn){try{fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.stack||String(e)});}}
test('delayed timeupdate does not expire an advancing native cursor',()=>{
 const f=fixture(),before=f.counts();f.wall(140000);f.a.currentTime=1.7;
 assert.equal(f.progress(),true,'native clock advanced even though lastProgressAt did not');
 assert.deepEqual(f.counts(),before,'watchdog observation must not count readings or alter the settlement clock');
 f.wall(5000);f.a.currentTime=2.4;assert.equal(f.progress(),true);assert.deepEqual(f.counts(),before);
});
test('a native loop cursor wrap is liveness evidence without count credit',()=>{
 const f=fixture(),before=f.counts();f.L.watchdogCurrent=2.9;f.wall(140000);f.a.currentTime=.1;
 assert.equal(f.progress(),true);assert.deepEqual(f.counts(),before);
});
test('unchanged cursor expires even after a watchdog sample once observed progress',()=>{
 const f=fixture();f.wall(140000);f.a.currentTime=1.5;assert.equal(f.progress(),true);
 f.wall(6499);assert.equal(f.progress(),true);f.wall(1);assert.equal(f.progress(),false);
 const last=f.L.watchdogProgressAt;f.wall(120000);assert.equal(f.progress(),false);assert.equal(f.L.watchdogProgressAt,last);
});
test('a stalled cursor cannot stay alive from the old timeupdate position difference',()=>{
 const f=fixture();f.wall(140000);f.a.currentTime=2;assert.equal(f.progress(),true);
 for(let i=0;i<4;i++)f.progress();f.wall(6500);assert.equal(f.progress(),false);
 assert.equal(f.L.lastCurrent,1,'settlement and watchdog samples are separate');
});
test('seeking rebases the observation without creating watchdog progress',()=>{
 const f=fixture(),before=f.counts();f.wall(140000);f.a.seeking=true;f.a.currentTime=20;
 assert.equal(f.progress(),false);assert.equal(f.L.watchdogProgressAt,0);assert.deepEqual(f.counts(),before);
 f.a.seeking=false;assert.equal(f.progress(),false,'the observed seek jump cannot become later playback evidence');
 f.wall(200);f.a.currentTime=20.2;assert.equal(f.progress(),true);assert.deepEqual(f.counts(),before);
});
test('sub-threshold cursor noise cannot indefinitely refresh a stalled source',()=>{
 const f=fixture();f.wall(7000);f.a.currentTime=1.01;assert.equal(f.progress(),false);
 f.wall(5000);f.a.currentTime=1.02;assert.equal(f.progress(),false);assert.equal(f.L.watchdogProgressAt,0);
});
test('fresh lease falls back to its current media sample without inventing movement',()=>{
 const f=fixture();delete f.L.watchdogCurrent;f.wall(7000);assert.equal(f.progress(),false);
 assert.equal(f.L.watchdogProgressAt,0);f.a.currentTime=1.1;assert.equal(f.progress(),true);
});
for(const mismatch of ['owner','key','index','source','recording-key'])test(`progress rejects mismatched ${mismatch}`,()=>{
 const f=fixture(),before=f.counts();f.wall(140000);f.a.currentTime=2;
 if(mismatch==='source')f.a.src='blob:replacement';if(mismatch==='recording-key')f.sourceMatch(false);
 assert.equal(f.progress(mismatch==='owner'?'journey99':f.L.owner,mismatch==='key'?'berhet:7':f.L.key,mismatch==='index'?7:6),false);
 assert.equal(f.L.watchdogProgressAt,0);assert.deepEqual(f.counts(),before);
});
for(const state of ['inactive','paused','ended','dormant','frozen','unready'])test(`progress rejects ${state} transport`,()=>{
 const f=fixture(),before=f.counts();f.wall(140000);f.a.currentTime=2;
 if(state==='inactive')f.L.active=false;if(state==='paused')f.a.paused=true;if(state==='ended')f.a.ended=true;
 if(state==='dormant')f.L.dormant=true;if(state==='frozen')f.L.frozen=true;if(state==='unready')f.a.readyState=1;
 assert.equal(f.progress(),false);assert.equal(f.L.watchdogProgressAt,0);assert.deepEqual(f.counts(),before);
});
for(const phase of ['lockRecoveryPending','preparing'])test(`matching ${phase} gives grace without credit`,()=>{
 const f=fixture(),before=f.counts();f.bg[phase]=true;f.a.paused=true;f.L.dormant=true;
 assert.equal(f.progress(),false);assert.equal(f.recovery(),true);assert.deepEqual(f.counts(),before);
 f.bg[phase]=false;assert.equal(f.recovery(),false);assert.deepEqual(f.counts(),before);
});
for(const mismatch of ['owner','key','index','source','recording-key','inactive','foreign-owner','blocked','user-pause'])test(`recovery grace rejects ${mismatch}`,()=>{
 const f=fixture(),before=f.counts();f.bg.lockRecoveryPending=true;
 if(mismatch==='source')f.a.src='blob:replacement';if(mismatch==='recording-key')f.sourceMatch(false);
 if(mismatch==='inactive')f.bg.active=false;if(mismatch==='foreign-owner')f.bg.owner='single';if(mismatch==='blocked')f.bg.blocked=true;if(mismatch==='user-pause')f.intent(true);
 assert.equal(f.recovery(mismatch==='owner'?'journey99':f.L.owner,mismatch==='key'?'berhet:7':f.L.key,mismatch==='index'?7:6),false);
 assert.deepEqual(f.counts(),before);
});
test('same-phase native loop gets one bounded second observation without count credit',()=>{
 const f=fixture(),before=f.counts();f.a.loop=true;f.a.duration=3;f.wall(90000);
 f.a.currentTime=(1+90)%f.a.duration;assert.equal(f.progress(),false,'same phase alone cannot prove progress');
 assert.equal(f.probe(),true,'an ambiguous loop may request a second observation');
 assert.equal(f.probe(),false,'the probe cannot be renewed without actual progress');
 f.wall(250);f.a.currentTime=(1+90.25)%f.a.duration;assert.equal(f.progress(),true);
 assert.deepEqual(f.counts(),before,'observation does not credit any completed reading');
 f.wall(6500);assert.equal(f.progress(),false);assert.equal(f.probe(),true,'real progress may reset the one-shot probe');
});
test('a stalled looping cursor expires after the single observation attempt',()=>{
 const f=fixture(),before=f.counts();f.a.loop=true;f.a.duration=3;f.wall(90000);
 assert.equal(f.progress(),false);assert.equal(f.probe(),true);f.wall(250);
 assert.equal(f.progress(),false);assert.equal(f.probe(),false);
 for(let i=0;i<5;i++){f.wall(5000);assert.equal(f.progress(),false);assert.equal(f.probe(),false);}
 assert.deepEqual(f.counts(),before);
});
for(const invalid of ['not-looping','unknown-duration','infinite-duration','seeking','paused','dormant','frozen','unready','inactive','user-pause','wrong-owner','wrong-key','wrong-index','changed-source'])test(`ambiguous loop probe rejects ${invalid}`,()=>{
 const f=fixture();f.a.loop=true;f.a.duration=3;f.wall(90000);
 if(invalid==='not-looping')f.a.loop=false;if(invalid==='unknown-duration')f.a.duration=NaN;if(invalid==='infinite-duration')f.a.duration=Infinity;
 if(invalid==='seeking')f.a.seeking=true;if(invalid==='paused')f.a.paused=true;if(invalid==='dormant')f.L.dormant=true;
 if(invalid==='frozen')f.L.frozen=true;if(invalid==='unready')f.a.readyState=1;if(invalid==='changed-source')f.a.src='blob:replacement';
 if(invalid==='inactive')f.L.active=false;if(invalid==='user-pause')f.intent(true);
 assert.equal(f.probe(invalid==='wrong-owner'?'journey99':f.L.owner,invalid==='wrong-key'?'berhet:7':f.L.key,invalid==='wrong-index'?7:6),false);
});
// Execute the actual two watchdog deadline callbacks against the production
// observation helpers, so an unexported or unused probe cannot pass the suite.
for(const kind of [28,99])test(`${kind}: shipped watchdog observes an aliased loop once and still retires a stall`,()=>{
 const from=html.indexOf(kind===28?'async function seyirOkuGuvenli(':'async function es99PlaySafe(');
 const first=html.indexOf('const deadline=()=>{',from),last=html.indexOf('timer=setTimeout(deadline,'+(kind===28?'timeout':'document.hidden?95000:35000'),first);
 assert.ok(first>from&&last>first,'production deadline boundaries');
 const deadlineCode=html.slice(first,last).trim().replace('const deadline=','var deadline=');
 const exportStart=html.indexOf('window.SukunLockJourneyTransportV2=Object.freeze('),exportEnd=html.indexOf(';',exportStart);
 function run(moving){
  const f=fixture(),before=f.counts(),timers=[],cuts=[],settled=[];
  const elapsed=kind===28?90000:95000,duration=kind===28?3:5;
  f.L.owner='journey'+kind;f.L.key=kind===28?'berhet:6':'esma:6:nida';f.a.loop=true;f.a.duration=duration;
  Object.assign(f.c,{current:()=>true,index:6,timer:0,timedOut:false,BS:{attemptSeq:1},ES:{attemptSeq:1},resolve:value=>settled.push(value),
   seyirAktifKaynakKes:reason=>cuts.push(reason),es99CutSource:reason=>cuts.push(reason),setTimeout:(fn,delay)=>{timers.push({fn,delay});return timers.length;}});
  f.c.window.SukunLockJourneyTransportV2={ownsProgress:f.progress,ownsRecovery:f.recovery,claimProgressProbe:f.probe};
  vm.runInContext(deadlineCode,f.c,{filename:'shipped-'+kind+'-watchdog-deadline.js'});
  f.wall(elapsed);f.a.currentTime=(1+elapsed/1000)%duration;f.c.deadline();
  assert.equal(cuts.length,0,'first aliased sample must not retire a healthy loop');assert.equal(timers.length,1);assert.equal(timers[0].delay,250);
  f.wall(250);if(moving)f.a.currentTime=(1+(elapsed+250)/1000)%duration;timers.shift().fn();
  if(moving){assert.equal(cuts.length,0);assert.equal(settled.length,0);assert.equal(timers[0].delay,5000);}
  else{assert.deepEqual(cuts,['resolver-timeout']);assert.equal(settled.length,1);assert.equal(settled[0].reason,'resolver-timeout');assert.equal(timers.length,0);}
  assert.deepEqual(f.counts(),before);
 }
 run(true);run(false);assert.match(html.slice(exportStart,exportEnd),/\bclaimProgressProbe\b/,'the production transport exports its probe');
});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const report={suite:'r1247 exact watchdog media observation',sourceSha256:hash(html),sourceFragmentSha256:hash(code),passed:results.filter(x=>x.passed).length,total:results.length,results,limitations:['Controlled independent wall/media clocks and native observations. No physical Android lockscreen, timeupdate scheduling or speaker-output verification.']};
if(process.argv[3]){const out=path.resolve(process.argv[3]);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
