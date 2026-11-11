'use strict';
// Production passive collector in an isolated metadata fixture; no physical
// speaker, Samsung or screen-lock claim and no access to personal recordings.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/health-r940.js'),'utf8');
const make=require('../r1017/health_ui_fixture.cjs')(root);
const secret='PRIVATE_AUDIO_AND_TEXT_SENTINEL';
function fixture(previous){
 const h=make(false);h.c.sessionStorage={getItem:k=>h.store.get(k)||null,setItem:(k,v)=>h.store.set(k,v)};
 if(previous)h.store.set('sukun.health.r940',previous);
 h.c.SukunSessionState={peek:()=>({phase:'IDLE',activeMode:'berhet',activeIndex:6,count:310,target:702,epoch:4,requestId:6,journeyKind:'28',owner:'',audioSource:'NONE'})};
 vm.runInContext(source,h.c,{filename:'health-r940.js'});
 return {...h,read:()=>h.c.SukunHealthR940.read(),emit:(name,value)=>h.c.dispatch(name,value)};
}
const session=(phase,audioSource='USER_RECORDING',owner='journey28')=>({phase,audioSource,owner,activeMode:'berhet',activeIndex:6,count:310,target:702,epoch:4,requestId:6,journeyKind:'28',reason:'sukun:backgroundownerchange',consistency:{audioIssues:phase==='PAUSED'?['background-native-interrupted']:[]}});
const owner=(extra={})=>({active:true,owner:'journey',lease:12,phase:'INTERRUPTED',reason:'pause',paused:true,ended:false,playing:false,readyState:4,error:'',hidden:true,lockTransitionAgeMs:140000,lockRecoveryPending:false,lockRecoveryAttempted:false,lockRecoveryReason:'pause-outside-lock-window',...extra});
const rows=[];
async function test(name,fn){try{await fn();rows.push({name,passed:true});}catch(e){rows.push({name,passed:false,error:e.stack});}}
(async()=>{
 await test('r1246 interrupted -> ERROR/PAUSED -> IDLE retains the audio failure at 310/702',async()=>{
  const h=fixture();h.d.hidden=true;
  for(const s of [session('PLAYING'),session('INTERRUPTED'),session('PAUSED','ERROR'),session('PREPARING','ERROR'),session('IDLE','ERROR','')])await h.emit('sukun:sessionchange',s);
  const r=h.read(),incident=r.incidents.find(x=>x.code==='SESSION_AUDIO_ERROR');
  assert(incident);assert.equal(incident.occurrences,1);assert.equal(incident.evidence.count,310);assert.equal(incident.context.session.target,702);assert.equal(incident.context.hidden,true);
  assert.equal(r.current.session.phase,'IDLE');assert.equal(r.summary.recordedIncidents,1);
 });
 await test('unrecovered delayed native pause is retained independently of later idle state',async()=>{
  const h=fixture();h.d.hidden=true;await h.emit('sukun:sessionchange',session('PLAYING'));
  await h.emit('sukun:backgroundownerchange',owner());await h.emit('sukun:sessionchange',session('IDLE','NONE',''));
  const r=h.read(),incident=r.incidents.find(x=>x.code==='BACKGROUND_NATIVE_INTERRUPTION');assert(incident);assert.equal(incident.evidence.lockTransitionAgeMs,140000);assert.equal(incident.context.session.count,310);
  assert(r.timeline.some(x=>x.kind==='background-owner'));assert.equal(r.summary.recordedIncidents,1);
 });
 await test('bounded loop recovery is observed without a false failure',async()=>{
  const h=fixture();h.d.hidden=true;
  await h.emit('sukun:backgroundownerchange',owner({lockRecoveryPending:true,lockRecoveryReason:'loop-boundary-pause',backgroundRecoveryKind:'loop-boundary',loopSeekAgeMs:3}));
  await h.emit('sukun:backgroundownerchange',owner({phase:'PREPARING',reason:'loop-boundary-recovery-request',lockRecoveryPending:false,lockRecoveryReason:'loop-boundary-recovery-request'}));
  await h.emit('sukun:backgroundownerchange',owner({phase:'PLAYING',reason:'loop-boundary-recovered',paused:false,playing:true,lockRecoveryReason:'loop-boundary-recovered',loopPauseRecoveries:1}));
  const r=h.read();assert.equal(r.incidents.length,0);assert.equal(r.timeline.filter(x=>x.kind==='background-owner').length,3);
 });
 await test('rejected loop recovery retains its bounded error class',async()=>{
  const h=fixture();h.d.hidden=true;await h.emit('sukun:backgroundownerchange',owner({phase:'BLOCKED',reason:'loop-boundary-recovery-rejected',lockRecoveryReason:'loop-boundary-recovery-rejected',error:'NotAllowedError',loopPauseRecoveries:1}));
  assert.equal(h.read().incidents[0].evidence.errorName,'NotAllowedError');
 });
 await test('explicit user pause, retired caller and app hold are not failures',async()=>{
  const h=fixture();h.d.hidden=true;await h.emit('sukun:sessionchange',session('PLAYING'));
  await h.emit('sukun:backgroundownerchange',owner({phase:'PAUSED',reason:'user-pause',lockRecoveryReason:'user-pause'}));
  for(const reason of ['retired-caller','user-or-owner-hold','user-pause','app-pause','pagehide-hold'])await h.emit('sukun:backgroundownerchange',owner({lockRecoveryReason:reason}));
  await h.emit('sukun:sessionchange',session('PAUSED'));await h.emit('sukun:sessionchange',session('IDLE','NONE',''));
  assert.equal(h.read().incidents.length,0);
 });
 await test('interruption evidence strips source URLs, user text and unknown error/reason strings',async()=>{
  const h=fixture();h.d.hidden=true;await h.emit('sukun:backgroundownerchange',owner({error:secret,lockRecoveryReason:secret,src:'https://private.invalid/'+secret,source:secret,text:secret,key:secret,loopSeekAgeMs:'3',lockTransitionAgeMs:-1}));
  const r=h.read(),e=r.incidents[0].evidence;assert.equal(e.errorName,'OtherError');assert.equal(e.lockRecoveryReason,'unknown');assert(!Object.hasOwn(e,'loopSeekAgeMs'));assert(!Object.hasOwn(e,'lockTransitionAgeMs'));assert(!JSON.stringify(r).includes(secret));assert(!JSON.stringify(r).includes('private.invalid'));
 });
 await test('checkpoint keeps interruption metadata after event ring rollover and next boot',async()=>{
  const h=fixture();h.d.hidden=true;await h.emit('sukun:backgroundownerchange',owner({loopSeekAgeMs:3,backgroundRecoveryKind:'loop-boundary',loopPauseRecoveries:1}));
  for(let i=0;i<140;i++)await h.emit('sukun:diagnostic',{kind:'routine'});
  assert(!h.read().timeline.some(x=>x.kind==='background-owner'));assert.equal(h.read().incidents.length,1);
  for(const fn of h.d.listeners.visibilitychange||[])fn({});
  const next=fixture(h.store.get('sukun.health.r940')),old=next.read().previous.incidents.find(x=>x.code==='BACKGROUND_NATIVE_INTERRUPTION');
  assert(old);assert.equal(old.evidence.loopSeekAgeMs,3);assert.equal(old.evidence.backgroundRecoveryKind,'loop-boundary');assert.equal(old.evidence.loopPauseRecoveries,1);
 });
 await test('new interruption observation and repeated reads issue no playback or network commands',async()=>{
  const h=fixture();h.d.hidden=true;await h.emit('sukun:backgroundownerchange',owner());
  const saved=JSON.stringify([...h.store]),timers=h.timers.size;
  for(let i=0;i<5;i++)h.read();
  assert.equal(JSON.stringify([...h.store]),saved);assert.equal(h.timers.size,timers);assert.equal(h.transportCalls.length,0);assert.equal(h.fetches.length,0);
 });
 console.log(JSON.stringify({passed:rows.filter(x=>x.passed).length,total:rows.length,rows},null,2));
 if(rows.some(x=>!x.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
