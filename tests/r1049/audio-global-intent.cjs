'use strict';
// Real aggregate pause/resume and recording source handlers. Media/registry
// membership are controlled; no physical Android or audible-output claim.
const assert=require('node:assert/strict');
const {harness,between}=require('../r1048/audio-volume-preview.cjs');
const noop=()=>{};
function fixture({journey=false}={}){
 const h=harness(),c=h.c;let paused=false,stopped=false,intervalSeq=1000000;const intervals=new Map(),owner={owned:true,epoch:1};
 c.setInterval=(fn,ms)=>{const id=++intervalSeq;intervals.set(id,{fn,ms,at:c.Date.now()+ms});return id};c.clearInterval=id=>intervals.delete(id);
 c.SukunTabOwner={owns:()=>owner.owned,snapshot:()=>({epoch:owner.epoch,intent:'play'})};
 const id=journey?'berhetiyye':'seyyid';
 const provider={pause(){paused=true;c.sesDuraklat();return true},resume(){paused=false;c.sesSurdur();return true},stop(){stopped=true;paused=false;c.sesDurdur('registry-stop');return true},getState:()=>stopped?'ended':paused?'paused':'playing'};
 const providers=new Map([[id,provider]]),sessions=new Map([[id,{id,state:'playing',commandEpoch:0}]]);
 if(journey){providers.set('mix',{pause(){c.sesDuraklat();return true},resume(){c.sesSurdur();return true},getState:()=>paused?'paused':'idle'});sessions.set('mix',{id:'mix',state:'idle',commandEpoch:0});}
 Object.assign(c,{providers,sessions,resolveId:x=>x,reconcileOne(rid){const s=sessions.get(rid);if(s)s.state=providers.get(rid).getState();return s},reconcileAll:noop,activate:noop,schedule:noop,discover:noop,activeId:null,STATES:{IDLE:'idle',PLAYING:'playing',PAUSED:'paused',STOPPING:'stopping',ENDED:'ended'},ACTIVE_STATES:new Set(['playing','paused']),transition(s,state){s.state=state},aggregate:{paused:false,providerIds:[],mixCaptured:false,reason:''},SukunJourneyAudioMachine:{pauseIntentActive:()=>journey}});
 Object.assign(c.AudioLife,{userPaused:false,_terminalIntent:false,_recoverSeq:0,_recoverReasons:new Set(),_log:noop,set:noop,busy:()=>true,ownerSnapshot:()=>({})});
 h.run('Object.assign(AudioLife,{'+between('  setUserPaused(','  busy(){')+'});');
 h.run(between('function state(id){','function session(id){'));
 // The state-to-volume seam may not exist in historical source order; state
 // below invokes the shipped reconcileOne contract used by aggregate resume.
 h.run(between('function invoke(action,id){','function toggle(id){'));
 h.run(between('function backgroundMixNeeded(){','/* r640 —'));
 h.run(between('function stopAll(){','function aggregateState(){'));
 async function tick(ms){for(let remaining=ms;remaining>0;){const step=Math.min(1000,remaining);await h.advance(step);remaining-=step;for(const [key,job]of [...intervals])if(job.at<=c.Date.now()){job.at=c.Date.now()+job.ms;if(intervals.has(key))job.fn();}await h.flush();}}
 return Object.assign(h,{id,owner,tick,globalPause(){c.pauseAll('dock-pause')},globalResume(){c.resumeAll()}});
}
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
(async()=>{
 for(const native of [false,true]){
  const label=native?'native':'raw';
  await test(label+' aggregate 12-second Pause/Resume retains the same accepted word and position',async()=>{
   const h=fixture(),{a,p}=await h.start({native});await h.advance(40);a.currentTime=.8;const src=a.src;
   h.globalPause();assert(a.paused);await h.tick(12000);assert(h.c.SES.ler.has(a),'Explicit Pause retired its accepted word before Resume');
   h.globalResume();a.dispatch('playing');await h.flush();assert(h.c.SES.ler.has(a),'Aggregate Resume retired its own accepted word');assert.equal(a.src,src);assert.equal(a.currentTime,.8);assert.equal(a.plays,2);a.dispatch('ended');assert.equal((await p).ok,true);
  });
  for(const invalid of ['stop','provider-stop','selection','voice','owner','owner-epoch','fresh-play','source','parent'])await test(label+' aggregate Resume cannot revive accepted word after '+invalid,async()=>{
   const h=fixture();let parentCurrent=true;
   h.c.SukunRecordingQuality={analyse:async()=>({gain:1,trimStart:0,trimEnd:0,fadeMs:78})};
   const p=h.c.playRecording(new Blob(['synthetic'],{type:'audio/wav'}),'test',{detail:true,resume:false,backgroundNative:native,recordingKey:'esma:0:nida',isCurrent:()=>parentCurrent});await h.flush();const a=h.audios.at(-1);assert(a);await h.advance(40);a.currentTime=.8;h.globalPause();
   if(invalid==='stop')await h.c.stopAll();
   if(invalid==='provider-stop')h.c.invoke('stop',h.id);
   if(invalid==='selection')h.c.Z.idx++;
   if(invalid==='voice')h.voiceChange();
   if(invalid==='owner')h.owner.owned=false;
   if(invalid==='owner-epoch')h.owner.epoch++;
   if(invalid==='fresh-play')h.c.AudioLife.markUserPlay('unrelated-fresh-reader');
   if(invalid==='source')a.src='blob:replacement';
   if(invalid==='parent')parentCurrent=false;
   const plays=a.plays;h.globalResume();a.dispatch('playing');await h.flush();assert.equal(a.plays,plays,'Resume issued play for a retired or changed attempt');h.c.sesDurdur('test-cleanup');assert.equal((await p).ok,false);
  });
  await test(label+' unresolved first play is not promoted by aggregate Pause/Resume',async()=>{
   const h=fixture(),{a,p}=await h.start({native,pending:true});h.globalPause();const plays=a.plays;h.globalResume();assert.equal(a.plays,plays,'Aggregate Resume replayed a not-yet-accepted attempt');h.c.pendingMediaPlay.resolve();await h.flush();assert(a.paused||!h.c.SES.ler.has(a),'Late original play reopened an unaccepted paused attempt');h.c.sesDurdur('test-cleanup');assert.equal((await p).ok,false);
  });
 }
 for(const kind of ['manager','backup','library'])await test(kind+' unresolved preview read cannot reopen after aggregate Pause/Resume',async()=>{
  const h=fixture();let resolve;h.c.REC_DB.get=()=>new Promise(r=>{resolve=r});h.previewClick(kind);await h.flush();h.globalPause();h.globalResume();resolve(new Blob(['synthetic'],{type:'audio/wav'}));await h.flush();assert.equal(h.audios.length,0,'Resume admitted a delayed preview that had never played');
 });
 for(const native of [false,true])await test((native?'native':'raw')+' accepted unpaused media still expires when real playback stops advancing',async()=>{
  const h=fixture(),{a,p}=await h.start({native});await h.advance(40);a.currentTime=.8;assert.equal(a.paused,false);await h.tick(9000);assert.equal(h.c.SES.ler.has(a),false,'Pause preservation accidentally disabled the real stall deadline');const result=await p;assert.equal(result.ok,false);assert.equal(result.reason,'playback-stalled');
 });
 for(const native of [false,true])await test((native?'native':'raw')+' accepted dua caller keeps its nested attempt alive across aggregate Pause/Resume',async()=>{
  const h=fixture();h.c.DUAREC={attempt:null};h.run(between('function duaRecBegin(id,onCancel){','function duaRecFailure(id){'));
  const attempt=h.c.duaRecBegin('test');h.c.SukunRecordingQuality={analyse:async()=>({gain:1,trimStart:0,trimEnd:0,fadeMs:78})};
  const p=h.c.playRecording(new Blob(['synthetic'],{type:'audio/wav'}),'test',{detail:true,resume:false,backgroundNative:native,recordingKey:'esma:0:nida',isCurrent:attempt.current});await h.flush();const a=h.audios.at(-1);assert(a);await h.advance(40);a.currentTime=.8;h.globalPause();await h.tick(12000);assert(h.c.SES.ler.has(a),'Nested dua guard retired accepted word during app Pause');h.globalResume();a.dispatch('playing');await h.flush();assert.equal(attempt.cancelled,false,'Resuming owned accepted word cancelled its enclosing dua attempt');assert(h.c.SES.ler.has(a));a.dispatch('ended');assert.equal((await p).ok,true);
 });
 await test('Journey double pause intent and repeated Pause retain only the accepted owned word',async()=>{
  const h=fixture({journey:true}),{a,p}=await h.start({native:true});await h.advance(40);a.currentTime=.8;h.globalPause();h.globalPause();await h.tick(12000);assert(h.c.SES.ler.has(a),'Journey paused word retired after repeated pause intent');h.globalResume();a.dispatch('playing');await h.flush();assert(h.c.SES.ler.has(a));assert.equal(a.currentTime,.8);a.dispatch('ended');assert.equal((await p).ok,true);
 });
 const report={method:'Real shipped aggregate/registry/AudioLife/recording handlers. Synthetic provider membership, media bytes and deterministic intervals; no physical lock or audible-output claim.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
