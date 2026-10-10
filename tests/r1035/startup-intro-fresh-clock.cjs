'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fire,createFixture}=require('../helpers/startup-intro-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const code=fs.readFileSync(path.join(root,'assets/runtime/startup-intro-r1027.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const clock=html.match(/<script id="sukun-auto-intro-clock">([\s\S]*?)<\/script>/)[1];
const fixture=options=>createFixture(code,clock,{audioUnitWindow:true,...options});
const results=[];
async function test(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.stack});}}
function near(a,b){assert(Math.abs(a-b)<1e-10,`${a} differs from ${b}`);}
function noSources(f){assert(f.contexts.every(c=>c.oscillators.every(o=>o.starts.length===0)));}
function clean(f){assert.equal(f.jobs.size,0);for(const target of [f.root,f.document,f.window,...f.contexts])assert.equal([...target.listeners.values()].reduce((n,x)=>n+x.size,0),0);}
const {assertHit:assertSynthesis}=require('../helpers/intro-hit-contract.cjs');
function assertHit(f,expectedAudioTime){
 const c=assertSynthesis(f,expectedAudioTime);
 assert.equal(f.root.dataset.audioOutcome,'scheduled');assert.equal(f.root.dataset.audioSourcesScheduled,'1');
 const sample=c.currentTimeReads.at(-1);near(sample.value,expectedAudioTime);assert.equal(sample.oscillators,6);assert.equal(sample.gains,7);assert.equal(sample.wall,f.now);
 return c;
}
function stallFinalMediaRead(f,delay,change){
 const original=f.document.querySelectorAll;let stalled=false;
 f.document.querySelectorAll=selector=>{
  const c=f.contexts[0];
  if(selector==='audio,video'&&!stalled&&c?.oscillators.length===6&&c.gains.length===7){stalled=true;f.setNow(f.now+delay);if(change)change(c);}
  return original(selector);
 };
 return()=>assert(stalled,'Expected the final eligibility/media read to execute');
}
(async()=>{
 await test('Default fixture keeps its existing constant10-second audio clock and20-ms future onset',async()=>{
  const f=fixture();f.runClock();f.run();assertHit(f,10);await f.advance(2400);clean(f);
 });
 for(const state of ['running','suspended'])await test(state+' context advances both clocks during graph creation before taking the shared fresh onset',async()=>{
  const f=fixture({state,audioCurrentTime:now=>10+(now-1000)/1000});let graphChecks=0;
  f.options.onCreateOscillator=(_n,_o,c)=>{assert(c.gains.every(g=>g.gain.value===0&&g.gain.schedule.length===0));assert(c.oscillators.every(o=>o.starts.length===0&&o.frequency.schedule.length===0));f.setNow(f.now+150);graphChecks++;};
  f.runClock();f.run();if(state==='suspended'){assert.equal(graphChecks,0);f.resolveResume();await f.flush();}
  assert.equal(graphChecks,6);assert.equal(f.now,1900);const c=assertHit(f,10.9);assert.equal(c.currentTimeReads.length,1);
  fire(c,'statechange');fire(c,'statechange');f.run();await f.flush();assertHit(f,10.9);assert.equal(c.currentTimeReads.length,1);
  await f.advance(1500);clean(f);
 });
 await test('Final eligibility read consumes600 ms and advancing audio is sampled afterwards',async()=>{
  const f=fixture({audioCurrentTime:now=>24+(now-1000)/1000});f.runClock();const verify=stallFinalMediaRead(f,600);f.run();verify();assert.equal(f.now,1600);const c=assertHit(f,24.6);assert.equal(c.currentTimeReads.length,1);await f.advance(1800);clean(f);
 });
 await test('Graph plus final safety stalls preserve the r1036 dry/echo envelopes within650 ms',async()=>{
  const f=fixture({state:'suspended',audioCurrentTime:now=>50+(now-1000)/1000});f.runClock();f.run();
  f.options.onCreateOscillator=()=>f.setNow(f.now+75);const verify=stallFinalMediaRead(f,450);f.resolveResume();await f.flush();verify();assert.equal(f.now,1900);assertHit(f,50.9);
  await f.advance(669);assert.equal(f.contexts[0].closeCalls,0);await f.advance(111);assert.equal(f.contexts[0].closeCalls,1);await f.advance(720);clean(f);
 });
 for(const delay of [1729,1730,1731,1749,1750])await test('Full650-ms hit plus20-ms lead uses strict1730-ms admission: '+delay,async()=>{
  const f=fixture();f.runClock();await f.advance(delay);f.run();
  if(delay<1730){assertHit(f,10);assert(Number(f.root.dataset.started)+delay+670<Number(f.root.dataset.started)+2400);}else{assert.equal(f.contexts.length,0);noSources(f);assert.equal(f.root.dataset.audioOutcome,'load_expired');}
  await f.advance(Math.max(0,3400-f.now));clean(f);
 });
 for(const phase of ['graph','last-safety-read'])for(const state of ['running','suspended'])await test(phase+' stall crossing the1730-ms boundary is silent for '+state,async()=>{
  const f=fixture({state,audioCurrentTime:now=>10+(now-1000)/1000});f.runClock();await f.advance(1100);let verify=()=>{};
  if(phase==='graph')f.options.onCreateOscillator=n=>{if(n===6)f.setNow(f.now+630);};else verify=stallFinalMediaRead(f,630);
  f.run();if(state==='suspended'){f.resolveResume();await f.flush();}verify();assert.equal(f.now,2730);noSources(f);
  const c=f.contexts[0];assert.equal(c.oscillators.length,6);assert.equal(c.currentTimeReads.length,0);assert.equal(c.closeCalls,1);assert(c.oscillators.every(o=>o.frequency.schedule.length===0&&o.disconnected));assert(c.gains.every(g=>g.gain.value===0));assert.equal(f.root.dataset.audioOutcome,state==='suspended'?'resume_timeout':'load_expired');
  await f.advance(670);clean(f);
 });
 await test('Trusted input before resume settlement still cancels without audio clock reads or sources',async()=>{
  const f=fixture({state:'suspended',audioCurrentTime:now=>now/1000});f.runClock();f.run();fire(f.document,'pointerdown');f.resolveResume();await f.flush();noSources(f);assert.equal(f.contexts[0].currentTimeReads.length,0);assert.equal(f.contexts[0].closeCalls,1);assert.equal(f.root.dataset.audioOutcome,'cancelled');await f.advance(2400);clean(f);
 });
 for(const event of ['pointerdown','keydown','click'])await test('Trusted '+event+' during future20-ms lead mutes before the following app handler',async()=>{
  const f=fixture({audioCurrentTime:now=>10+(now-1000)/1000});f.runClock();f.run();const c=assertHit(f,10);let stoppedBeforeApp=false;
  f.document.addEventListener(event,()=>{stoppedBeforeApp=c.closeCalls===1&&c.gains[0].gain.value===0&&c.oscillators.every(o=>o.disconnected);});
  await f.advance(10);fire(f.document,event);assert(stoppedBeforeApp);assert.equal(f.root.dataset.audioOutcome,'cancelled');assert(c.oscillators.every(o=>o.starts.length===1&&o.stops.length===2));f.run();assert.equal(f.contexts.length,1);
 });
 for(const recording of ['recording','tickRecording'])await test(recording+' starts during graph construction and no oscillator/envelope is submitted',async()=>{
  const f=fixture({audioCurrentTime:now=>10+(now-1000)/1000});f.options.onCreateOscillator=n=>{f.setNow(f.now+200);if(n===6)f.options[recording]=true;};f.runClock();f.run();noSources(f);const c=f.contexts[0];assert.equal(c.currentTimeReads.length,0);assert.equal(c.closeCalls,1);assert(c.gains.every(g=>g.gain.value===0&&g.gain.schedule.every(x=>x[0]==='cancel')));assert(c.oscillators.every(o=>o.frequency.schedule.length===0&&o.disconnected));assert.equal(f.root.dataset.audioOutcome,'unsafe-audio');await f.advance(2400);clean(f);
 });
 await test('Recording signal during future lead immediately stops already scheduled hit and never retries',async()=>{
  const f=fixture();f.runClock();f.run();const c=assertHit(f,10);await f.advance(5);f.options.recording=true;fire(f.window,'sukun:itemrecordingchange');assert.equal(c.closeCalls,1);assert.equal(c.gains[0].gain.value,0);assert(c.oscillators.every(o=>o.disconnected));f.options.recording=false;fire(c,'statechange');f.run();assert.equal(c.currentTimeReads.length,1);assert(c.oscillators.every(o=>o.starts.length===1));await f.advance(2395);clean(f);
 });
 await test('Context interrupted during final eligibility read cannot schedule after that read',async()=>{
  const f=fixture();f.runClock();const verify=stallFinalMediaRead(f,100,c=>{c.state='interrupted';});f.run();verify();noSources(f);assert.equal(f.contexts[0].currentTimeReads.length,0);assert.equal(f.root.dataset.audioOutcome,'interrupted');await f.advance(2300);clean(f);
 });
 for(const audioCurrentTime of [NaN,Infinity,-1])await test('Invalid fresh audio clock '+String(audioCurrentTime)+' closes a muted graph without scheduling',async()=>{
  const f=fixture({audioCurrentTime});f.runClock();f.run();noSources(f);assert.equal(f.root.dataset.audioOutcome,'failed');assert.equal(f.contexts[0].closeCalls,1);assert(f.contexts[0].gains.every(g=>g.gain.value===0));await f.advance(2400);clean(f);
 });
 const report={total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,scope:'Production runtime and inline clock with separately advancing wall/audio clocks, muted graph construction, r1036 dry/echo envelopes,20-ms lead, strict1730-ms admission and existing cancellation guards. These synthetic WebAudio endpoints do not establish audible output or Android autoplay eligibility.',results};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
})();
