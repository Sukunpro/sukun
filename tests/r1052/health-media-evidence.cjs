'use strict';
// Full passive collector with cached native metadata and command traps.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const collector=fs.readFileSync(path.join(root,'assets/runtime/health-r940.js'),'utf8');
const createFixture=require('../r1017/health_ui_fixture.cjs')(root);
const numeric=['currentTime','duration','mediaSpanSeconds','unitSeconds','repeatCycles','playbackRate','volume','mediaProgressSeconds','appliedCycles','lastPauseAt'];
const secret='PRIVATE_RECORDING_SENTINEL';
function fixture(snapshot,previous=null){
 const h=createFixture(false);let snapshots=0,commands=0;
 h.c.sessionStorage={getItem:k=>h.store.get(k)||null,setItem:(k,v)=>h.store.set(k,v)};
 if(previous)h.store.set('sukun.health.r940',previous);
 h.c.SukunLockAudio=new Proxy({snapshot(){snapshots++;return snapshot}},{get:(obj,key)=>key in obj?obj[key]:()=>{commands++;throw Error('health attempted playback command')}});
 h.c.PlaybackController=new Proxy({},{get:()=>()=>{commands++;throw Error('health attempted playback command')}});
 vm.runInContext(collector,h.c,{filename:'health-r940.js'});
 return{...h,commands:()=>commands,snapshots:()=>snapshots,async observe(evidence=snapshot){await h.c.dispatch('sukun:diagnostic',{kind:'background-handoff',evidence:{stage:'started',path:'single-recording',sourceKind:'baked',...evidence}});return h.c.SukunHealthR940.read()}};
}
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
const reportSource=r=>r.current.lock.singleSnapshot;
(async()=>{
 await test('known native media numbers and explicit mute/zero volume survive passive observation',async()=>{
  const snapshot={active:true,playing:true,currentTime:13.5,duration:60.6,mediaSpanSeconds:60.6,unitSeconds:2.02,repeatCycles:30,playbackRate:1,volume:0,muted:true,loop:true,mediaProgressSeconds:13.5,appliedCycles:6,lastPauseReason:'native-pause',lastPauseAt:123456,
   src:'blob:'+secret,currentSrc:'https://private.invalid/'+secret+'?token=SECRET',key:secret,text:secret,name:secret,recordingText:secret,errorMessage:secret};
  const h=fixture(snapshot),r=await h.observe(),e=reportSource(r);
  for(const key of numeric)assert.equal(e[key],snapshot[key],key);
  assert.equal(e.muted,true);assert.equal(e.loop,true);assert.equal(e.lastPauseReason,'native-pause');assert.equal(r.current.background.volume,0);
  const before=h.snapshots(),timers=h.timers.size,saved=JSON.stringify([...h.store]);h.c.SukunHealthR940.read();h.c.SukunHealthR940.read();
  assert.equal(h.snapshots(),before,'report read must use cached native observation');assert.equal(h.timers.size,timers);assert.equal(JSON.stringify([...h.store]),saved);
  assert.equal(h.commands(),0);assert.equal(h.transportCalls.length,0);assert.equal(h.fetches.length,0);
  assert(!JSON.stringify(r).includes(secret),'user text or a raw recording URL leaked into report');assert(!JSON.stringify(r).includes('private.invalid'));
 });
 for(const invalid of [null,undefined,'0',false,NaN,Infinity,-1,1e16])await test(`unknown native numeric metadata is omitted for ${String(invalid)}`,async()=>{
  const input={active:true,playing:true,muted:'true',loop:1,lastPauseReason:secret};for(const key of numeric)input[key]=invalid;
  const h=fixture(input),r=await h.observe(),e=reportSource(r);
  for(const key of numeric){assert(!Object.hasOwn(e,key),key+' incorrectly became a known number');assert(!Object.hasOwn(r.current.background,key),key+' background incorrectly became a known number')}
  assert(!Object.hasOwn(e,'muted'));assert(!Object.hasOwn(e,'loop'));assert(!Object.hasOwn(e,'lastPauseReason'));assert.equal(h.commands(),0);assert(!JSON.stringify(r).includes(secret));
 });
 await test('checkpoint round trip retains numeric zero, native booleans and bounded reason while dropping extra content',async()=>{
  const snapshot={active:true,playing:false,currentTime:0,duration:61,mediaSpanSeconds:61,unitSeconds:1,repeatCycles:61,playbackRate:1,volume:0,muted:true,loop:true,mediaProgressSeconds:0,appliedCycles:0,lastPauseReason:'single-pause',lastPauseAt:123456,src:'blob:'+secret,text:secret};
  const h=fixture(snapshot);await h.observe();h.d.hidden=true;for(const fn of h.d.listeners.visibilitychange||[])fn({});
  const saved=h.store.get('sukun.health.r940');assert(saved,'lifecycle checkpoint must be available');assert(!saved.includes(secret));
  const next=fixture(null,saved),previous=next.c.SukunHealthR940.read().previous;assert(previous,'checkpoint roundtrip must retain a previous observation');
  const e=previous.background;for(const key of numeric)assert.equal(e[key],snapshot[key],key);assert.equal(e.muted,true);assert.equal(e.loop,true);assert.equal(e.lastPauseReason,'single-pause');
  const event=previous.events.find(row=>row.evidence?.lock?.singleSnapshot);assert(event,'historic lifecycle media snapshot must survive');assert.equal(event.evidence.lock.singleSnapshot.volume,0);assert.equal(event.evidence.lock.singleSnapshot.muted,true);assert.equal(next.commands(),0);assert.equal(next.fetches.length,0);
 });
 const report={method:'Full production health collector and isolated cached snapshot/metadata checkpoint. Commands and network are trapped; recording bytes and physical speaker output are never read.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
