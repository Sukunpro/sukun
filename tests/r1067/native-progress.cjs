'use strict';
// Execute the accepted production native caller and owner. Media events and
// clocks are controlled; no Android decoder or audible-output claim is made.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const header=fs.readFileSync(path.join(__dirname,'../r1044/native-recovery-authority.cjs'),'utf8').split('(async()=>{')[0];
const nativeHarness=Function('require','__dirname',header+'\nreturn setup;')(require,path.join(__dirname,'../r1044'));
const playbackHeader=fs.readFileSync(path.join(__dirname,'../r1043/recording-attack.cjs'),'utf8').split('function clean(')[0];
const playbackHarness=Function('require','__dirname',playbackHeader+'\nreturn harness;')(require,path.join(__dirname,'../r1043'));
const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve()};
const results=[];async function test(name,fn){try{await fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e.stack})}}
function fixture(){
 const f=nativeHarness();f.samples=[];f.valid=true;
 f.context.sukunRecordingKeyFrom=(_ad,opt)=>opt.recordingKey;
 f.beginProgress=()=>f.context.sukunJourneyNativeRecording({size:30_000_000,type:'audio/mpeg'},'reading:yasin',{
  detail:true,bundled:true,recordingKey:'bundled:test:yasin',isCurrent:()=>f.valid,onProgress:s=>f.samples.push(s)
 },null);
 f.a.duration=1200;return f;
}
(async()=>{
 await test('Actual playRecording forwards the exact progress callback and source key to native playback',async()=>{
  const h=playbackHarness();let admitted;const callback=()=>{},blob=Object.freeze({size:30_000_000,type:'audio/mpeg'});
  h.context.sukunJourneyNativeRecording=async(value,ad,opt)=>{admitted={value,ad,opt};return{ok:true,reason:'ended'}};
  const r=await h.context.playRecording(blob,'reading:yasin',{detail:true,resume:false,backgroundNative:true,bundled:true,recordingKey:'bundled:test:yasin',onProgress:callback,isCurrent:()=>true});
  assert.equal(r.ok,true);assert.equal(admitted.value,blob);assert.equal(admitted.opt.onProgress,callback);assert.equal(admitted.opt.recordingKey,'bundled:test:yasin');assert.equal(admitted.opt.bundled,true);assert.equal(h.instances.length,0);
 });
 await test('Accepted media clock reports playing, timeupdate, seeked, duration and rate unchanged',async()=>{
  const f=fixture(),p=f.beginProgress();await flush();assert.equal(f.samples.length,1);
  f.a.currentTime=21.125;f.fire(f.a,'timeupdate');let s=f.samples.at(-1);
  assert.equal(s.currentTime,21.125);assert.equal(s.duration,1200);assert.equal(s.recordingKey,'bundled:test:yasin');assert.equal(s.paused,false);
  f.a.currentTime=9.5;f.fire(f.a,'seeked');assert.equal(f.samples.at(-1).currentTime,9.5);
  f.a.duration=1201.75;f.fire(f.a,'durationchange');assert.equal(f.samples.at(-1).duration,1201.75);
  f.a.playbackRate=1.5;f.fire(f.a,'ratechange');assert.equal(f.samples.at(-1).playbackRate,1.5);
  assert.equal(f.a.playCalls,1);assert.equal(f.a.currentTime,9.5);f.stop();await p;
 });
 await test('Real pause and resumed playing report the same source without observer playback requests',async()=>{
  const f=fixture(),p=f.beginProgress();await flush();f.a.currentTime=54;f.context.sesDuraklat();f.drainPause();
  assert.equal(f.samples.at(-1).paused,true);assert.equal(f.samples.at(-1).currentTime,54);
  const before=f.a.playCalls;f.context.sesSurdur();await flush();assert.equal(f.a.playCalls,before+1);
  assert.equal(f.samples.at(-1).paused,false);assert.equal(f.samples.at(-1).currentTime,54);f.stop();await p;
 });
 await test('Hidden and visible observations read the actual media position; no wall-clock interpolation',async()=>{
  const f=fixture(),p=f.beginProgress();await flush();f.a.currentTime=62.25;f.hide();assert.equal(f.samples.at(-1).currentTime,62.25);
  f.tick(2000);assert.equal(f.samples.at(-1).currentTime,62.25);assert.equal(f.a.currentTime,62.25);assert.equal(f.a.playCalls,1);
  f.a.currentTime=164.75;f.visible();assert.equal(f.samples.at(-1).currentTime,164.75);assert.equal(f.a.playCalls,1);f.stop();await p;
 });
 await test('No accepted playing event means no progress, even with metadata, pause and visibility events',async()=>{
  const f=fixture();f.a.mode='pending';const p=f.beginProgress();await flush();f.a.currentTime=40;
  for(const type of ['timeupdate','seeked','pause','durationchange','ratechange'])f.fire(f.a,type);
  f.hide();f.visible();assert.equal(f.samples.length,0);f.stop();await p;
 });
 for(const kind of ['caller-token','prepare-sequence','session-membership','finish-handler','lease'])await test('Stale '+kind+' cannot deliver a native clock sample',async()=>{
  const f=fixture();let foreign=false;
  if(kind==='lease')f.window.SukunBackgroundAudioOwner={...f.owner,snapshot:()=>({...f.owner.snapshot(),lease:f.owner.snapshot().lease+(foreign?100:0)})};
  const p=f.beginProgress();await flush();const before=f.samples.length,finish=f.a._sukunFinish;
  if(kind==='caller-token')f.valid=false;
  if(kind==='prepare-sequence')f.window.__sukJourneyNative.prepareSeq++;
  if(kind==='session-membership')f.context.SES.ler.delete(f.a);
  if(kind==='finish-handler')f.a._sukunFinish=()=>{};
  if(kind==='lease')foreign=true;
  f.a.currentTime=550;f.fire(f.a,'timeupdate');f.fire(f.a,'seeked');f.hide();assert.equal(f.samples.length,before);
  finish(false,'test-cleanup');await p;
 });
 await test('Completed attempt removes all progress listeners and a retained callback remains inert',async()=>{
  const f=fixture(),p=f.beginProgress();await flush();const callback=[...f.a.handlers.get('timeupdate')][0],before=f.samples.length;
  f.a.ended=true;f.a.onended();assert.equal((await p).ok,true);
  for(const type of ['timeupdate','seeked','durationchange','ratechange'])assert.equal(f.a.handlers.get(type)?.size||0,0,type);
  assert.equal(f.document.handlers.get('visibilitychange')?.has(callback),false);f.a.currentTime=900;callback();assert.equal(f.samples.length,before);
 });
 await test('Reused audio element rejects old attempt callbacks while the new one alone reports',async()=>{
  const f=fixture(),first=f.beginProgress();await flush();const oldCallback=[...f.a.handlers.get('timeupdate')][0],oldFinish=f.a._sukunFinish;
  f.stop();await first;const oldCount=f.samples.length;f.samples=[];const second=f.beginProgress();await flush();const newCount=f.samples.length;
  assert(oldCount>0);assert.equal(newCount,1);f.a.currentTime=77;oldCallback();oldFinish(false,'late-finish');assert.equal(f.samples.length,newCount);
  f.fire(f.a,'timeupdate');assert.equal(f.samples.length,newCount+1);assert.equal(f.samples.at(-1).currentTime,77);f.stop();await second;
 });
 await test('Adding the observer introduces no extra timers, seeks, storage writes or play requests',async()=>{
  const without=nativeHarness(),withProgress=fixture();let writes=0;withProgress.context.localStorage.setItem=()=>writes++;
  const p0=without.context.sukunJourneyNativeRecording({size:30_000_000,type:'audio/mpeg'},'reading:yasin',{detail:true,bundled:true,isCurrent:()=>true},null),p1=withProgress.beginProgress();await flush();
  assert.equal(withProgress.jobs.size,without.jobs.size);const before=[...withProgress.jobs.values()].map(x=>x.at);const plays=withProgress.a.playCalls;
  withProgress.a.currentTime=19;for(const type of ['timeupdate','seeked','durationchange','ratechange'])withProgress.fire(withProgress.a,type);
  assert.deepEqual([...withProgress.jobs.values()].map(x=>x.at),before);assert.equal(withProgress.a.currentTime,19);assert.equal(withProgress.a.playCalls,plays);assert.equal(writes,0);
  without.stop();withProgress.stop();await Promise.all([p0,p1]);
 });
 const report={version:'r1067',root,scope:'Actual production native recording/owner with controlled media clock and events. No physical Android, decoder or audibility claim.',passed:results.filter(x=>x.ok).length,total:results.length,allPassed:results.every(x=>x.ok),tests:results};
 console.log(JSON.stringify(report,null,2));if(!report.allPassed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
