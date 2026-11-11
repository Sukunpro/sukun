'use strict';
// Production collector and view in an isolated metadata fixture. No personal
// recordings, physical device or audible-output assertions are involved.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/health-r940.js'),'utf8');
const make=require('../r1017/health_ui_fixture.cjs')(root);
const event='sukun:journey-watchdog-timeout',code='JOURNEY_WATCHDOG_TIMEOUT';
const secret='PRIVATE_RECORDING_TEXT_SENTINEL';
function fixture(previous){
 const h=make(false);h.c.sessionStorage={getItem:k=>h.store.get(k)||null,setItem:(k,v)=>h.store.set(k,v)};
 if(previous)h.store.set('sukun.health.r940',previous);
 h.c.SukunSessionState={peek:()=>({phase:'IDLE',activeMode:'berhet',activeIndex:6,count:378,target:702,epoch:4,requestId:6,journeyKind:'28',owner:'',audioSource:'NONE'})};
 vm.runInContext(source,h.c,{filename:'health-r940.js'});
 return {...h,read:()=>h.c.SukunHealthR940.read(),emit:(name,value)=>h.c.dispatch(name,value)};
}
const session=phase=>({phase,activeMode:'berhet',activeIndex:6,count:378,target:702,epoch:4,requestId:6,journeyKind:'28',owner:phase==='IDLE'?'':'journey28',audioSource:phase==='IDLE'?'NONE':'USER_RECORDING'});
const deadline=(extra={})=>({owner:'journey28',index:6,reason:'resolver-timeout',active:true,paused:false,ended:false,seeking:true,loop:true,dormant:false,frozen:false,sourceMatches:true,currentTime:.002,duration:3.01,lastPhysicalProgressAgeMs:6700,readyState:1,mediaErrorCode:0,...extra});
const retired=(reason='retired-caller')=>({active:true,owner:'journey',lease:3,phase:'INTERRUPTED',reason:'pause',paused:true,ended:false,playing:false,readyState:1,lockRecoveryReason:reason,lockRecoveryPending:false,lockRecoveryAttempted:false});
const rows=[];
async function test(name,fn){try{await fn();rows.push({name,passed:true});}catch(e){rows.push({name,passed:false,error:e.stack});}}
(async()=>{
 for(const owner of ['journey28','journey99'])for(const hidden of [false,true])await test(owner+' '+(hidden?'hidden':'visible')+' timeout retains observed pre-retirement evidence',async()=>{
  const h=fixture();h.d.hidden=hidden;await h.emit('sukun:sessionchange',session('PLAYING'));
  await h.emit(event,deadline({owner,index:owner==='journey28'?27:98,hidden:!hidden}));
  await h.emit('sukun:backgroundownerchange',retired());
  const r=h.read(),incident=r.incidents.find(x=>x.code===code);assert(incident);
  assert.equal(r.summary.recordedIncidents,1);assert.equal(incident.severity,'WARN');assert.equal(incident.certainty,'observed');assert.equal(incident.occurrences,1);
  assert.equal(incident.evidence.hidden,hidden);assert.equal(incident.evidence.owner,owner);assert.equal(incident.evidence.readyState,1);assert.equal(incident.evidence.seeking,true);
  assert.equal(incident.evidence.lastPhysicalProgressAgeMs,6700);assert.equal(incident.context.session.count,378);assert.equal(incident.context.session.target,702);
  assert.equal(r.timeline.filter(x=>x.kind==='journey-watchdog').length,1);
 });
 await test('invalid owner, reason, index and payload types create no timeout history',async()=>{
  const h=fixture();
  for(const value of [null,[],false,1,'resolver-timeout',{},deadline({owner:'single'}),deadline({reason:'stale-sequence'}),deadline({reason:'user-pause'}),deadline({index:-1}),deadline({index:28}),deadline({owner:'journey99',index:99}),deadline({index:'6'}),deadline({index:6.5}),deadline({index:NaN})])await h.emit(event,value);
  const r=h.read();assert.equal(r.incidents.length,0);assert(!r.timeline.some(x=>x.kind==='journey-watchdog'));
 });
 await test('privacy allowlist omits sources, text and invalid optional values without coercion',async()=>{
  const h=fixture();await h.emit(event,deadline({src:'https://private.invalid/'+secret,key:secret,text:secret,error:secret,paused:'false',ended:0,seeking:null,loop:1,active:'true',dormant:1,frozen:0,sourceMatches:secret,currentTime:'1',duration:Infinity,lastPhysicalProgressAgeMs:-1,readyState:5,mediaErrorCode:'4'}));
  const r=h.read(),data=r.incidents[0].evidence;
  assert.deepEqual(Object.keys(data).sort(),['hidden','index','owner','reason']);
  assert(!JSON.stringify(r).includes(secret));assert(!JSON.stringify(r).includes('private.invalid'));
  const h2=fixture();await h2.emit(event,deadline({currentTime:NaN,duration:1e16,lastPhysicalProgressAgeMs:'213',readyState:-1,mediaErrorCode:4.5}));
  for(const key of ['currentTime','duration','lastPhysicalProgressAgeMs','readyState','mediaErrorCode'])assert(!Object.hasOwn(h2.read().incidents[0].evidence,key));
 });
 await test('repeated timeout updates bounded incident count and latest evidence',async()=>{
  const h=fixture();await h.emit(event,deadline());await h.emit(event,deadline({owner:'journey99',index:98,lastPhysicalProgressAgeMs:8000}));
  const r=h.read();assert.equal(r.incidents.length,1);assert.equal(r.incidents[0].occurrences,2);assert.equal(r.incidents[0].evidence.owner,'journey99');assert.equal(r.incidents[0].evidence.lastPhysicalProgressAgeMs,8000);
 });
 await test('idle, event ring rollover and next boot preserve timeout metadata',async()=>{
  const h=fixture();h.d.hidden=true;await h.emit('sukun:sessionchange',session('PLAYING'));await h.emit(event,deadline());await h.emit('sukun:sessionchange',session('IDLE'));
  for(let i=0;i<140;i++)await h.emit('sukun:diagnostic',{kind:'routine'});
  const r=h.read();assert.equal(r.current.session.phase,'IDLE');assert(!r.timeline.some(x=>x.kind==='journey-watchdog'));assert.equal(r.incidents.length,1);
  for(const fn of h.d.listeners.visibilitychange||[])fn({});
  const next=fixture(h.store.get('sukun.health.r940')),old=next.read().previous.incidents.find(x=>x.code===code);assert(old);
  for(const [key,value] of Object.entries(deadline()))assert.equal(old.evidence[key],value,key+' survives checkpoint');
  assert.equal(old.context.session.count,378);assert.equal(old.evidence.hidden,true);
 });
 await test('explicit pauses and retired or stale callers without deadline remain normal cancellation',async()=>{
  const h=fixture();h.d.hidden=true;
  for(const reason of ['retired-caller','user-or-owner-hold','user-pause','app-pause','pagehide-hold'])await h.emit('sukun:backgroundownerchange',retired(reason));
  await h.emit(event,deadline({reason:'stale-sequence'}));await h.emit('sukun:sessionchange',session('PAUSED'));await h.emit('sukun:sessionchange',session('IDLE'));
  assert.equal(h.read().incidents.length,0);
 });
 await test('timeout collection and repeated reads issue no playback or network commands',async()=>{
  const h=fixture();h.d.hidden=true;await h.emit(event,deadline());
  const saved=JSON.stringify([...h.store]),timers=h.timers.size;
  for(let i=0;i<5;i++)h.read();
  assert.equal(JSON.stringify([...h.store]),saved);assert.equal(h.timers.size,timers);assert.equal(h.transportCalls.length,0);assert.equal(h.fetches.length,0);
 });
 await test('plain report explains application timeout in Turkish and English',async()=>{
  const h=fixture();await h.emit(event,deadline());
  const report=h.read();assert(h.c.SukunHealthViewR943.plainReport(report).includes('Seyir denetimi, ses denemesini zaman aşımı nedeniyle durdurdu.'));
  h.c.I18N.lang='en';assert(h.c.SukunHealthViewR943.plainReport(report).includes('The journey watchdog stopped an audio attempt after its deadline expired.'));
 });
 console.log(JSON.stringify({passed:rows.filter(x=>x.passed).length,total:rows.length,rows},null,2));
 if(rows.some(x=>!x.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
