'use strict';
// Usage: node tests/r1047/frequency-pause-contract.cjs [source-root] [baseline]
// Defaults to the containing source root and fixed behavior. baseline is optional comparison evidence.
// Uses unchanged extracted source handlers via actual-function-repro.cjs. No physical audio.
const {harness,source}=require('./frequency-pause-fixture.cjs');
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const fixed=process.argv[3]!=='baseline',results=[];
const click=(h,id='r588Play')=>h.c.fixtureDockClick({target:h.nodes.get(id),preventDefault(){},stopPropagation(){}});
const gate=h=>h.c.SukunAudioSessionRegistry.aggregateSnapshot().paused;
async function fresh(){const h=harness();await h.advance(600);return h;}
async function test(name,run){await run();results.push({name,ok:true});}
(async()=>{
 await test('stale-latch: actual first dock handler branch',async()=>{const h=await fresh();h.c.SukunAudioSessionRegistry.pauseAll('ui:stale-precondition');await h.advance(600);h.c.frStart();await h.advance(600);const before=h.c.fixtureSnapshot('before');assert.equal(before.dockLabel,'Duraklat');assert.equal(gate(h),!fixed);const n=h.calls.filter(x=>x==='ctx.suspend').length;click(h);await h.advance(600);const after=h.c.fixtureSnapshot('after');assert.equal(h.calls.filter(x=>x==='ctx.suspend').length,n+(fixed?1:0));assert.equal(h.c.ctx.state,fixed?'suspended':'running');assert.equal(after.dockLabel,fixed?'Devam Ettir':'Duraklat');assert.equal(gate(h),fixed);results.push({evidence:'stale-latch-first-click',before:{gate:before.aggregate.paused,label:before.dockLabel},after:{gate:after.aggregate.paused,label:after.dockLabel,ctx:after.ctxState},suspendDelta:after.ctxSuspendCalls-before.ctxSuspendCalls});});
 await test('clean frequency: pause, resume, stop through actual dock handlers',async()=>{const h=await fresh();const count=h.c.Z.count;h.c.frStart();await h.advance(600);click(h);await h.advance(600);assert(gate(h));assert.equal(h.c.ctx.state,'suspended');assert(h.c.MINI.paused);assert(h.c.FR.playing);assert.equal(h.c.fixtureSnapshot('paused').dockLabel,'Devam Ettir');click(h);await h.advance(600);assert(!gate(h));assert.equal(h.c.ctx.state,'running');assert(!h.c.MINI.paused);assert(h.c.FR.playing);assert.equal(h.c.fixtureSnapshot('resumed').dockLabel,'Duraklat');click(h,'r588Stop');await h.advance(1600);assert(!gate(h));assert(!h.c.FR.playing);assert(!h.c.MINI.paused);assert.equal(h.c.Z.count,count);assert.equal(h.c.SukunAudioSessionRegistry.aggregateState(),'idle');assert(h.calls.includes('env.kill'));});
 await test('new frequency can start and stop after previous dock stop',async()=>{const h=await fresh();h.c.frStart();await h.advance(600);click(h,'r588Stop');await h.advance(1600);h.c.frStart();await h.advance(600);assert(h.c.FR.playing);assert(!gate(h));click(h);await h.advance(600);assert.equal(h.c.ctx.state,'suspended');});
 await test('failed graph setup leaves aggregate gate unchanged',async()=>{const h=await fresh();h.c.SukunAudioSessionRegistry.pauseAll('ui:stale');h.c.makeEnv=()=>{throw Error('injected failure')};assert.throws(()=>h.c.frStart(),/injected failure/);await h.advance(600);assert(gate(h));assert(!h.c.FR.playing)});
 await test('already-playing early return leaves intentional frequency pause gate unchanged',async()=>{const h=await fresh();h.c.frStart();await h.advance(600);h.c.SukunAudioSessionRegistry.pauseAll('ui:real-pause');await h.advance(600);h.c.frStart();await h.advance(600);assert(gate(h));assert.equal(h.c.ctx.state,'suspended');});
 for(const st of ['paused','playing','stopping'])await test(`fresh frequency preserves existing ${st} unrelated provider`,async()=>{const h=await fresh();h.c.SukunAudioSessionRegistry.pauseAll('ui:prior');let resumes=0;h.c.SukunAudioSessionRegistry.register('unrelated',{getState:()=>st,resume(){resumes++}});h.c.frStart();await h.advance(600);assert(gate(h));assert.equal(resumes,0);assert.equal(h.c.SukunAudioSessionRegistry.state('unrelated'),st)});
 await test('settled captured provider is not restarted by fresh frequency',async()=>{const h=await fresh();let st='playing',resumes=0;h.c.SukunAudioSessionRegistry.register('old-reader',{getState:()=>st,pause(){st='paused'},resume(){resumes++;st='playing'}});h.c.SukunAudioSessionRegistry.pauseAll('ui:old');await h.advance(600);assert(gate(h));st='idle';h.c.SukunAudioSessionRegistry.sync();await h.advance(600);h.c.frStart();await h.advance(600);assert.equal(gate(h),!fixed);assert.equal(resumes,0)});
 for(const [name,id] of [['SukunEsma99Seyir','esma99'],['SukunBerhetiyyeSeyir','berhetiyye']])await test(`${id}: actual journey pause/resume branches retained`,async()=>{const h=await fresh();const js={run:true,paused:false,systemHold:false},commands=[];h.c[name]={state:()=>({...js,state:js.run&&!js.paused?'playing':js.paused?'paused':'idle'}),pause(){commands.push('pause');js.run=false;js.paused=true;return true},resume(){commands.push('resume');js.run=true;js.paused=false;return true},stop(){commands.push('stop');js.run=false;js.paused=false;return true}};h.c.SukunAudioSessionRegistry.register(id,{priority:105,getState:()=>h.c[name].state().state,pause:()=>h.c[name].pause(),resume:()=>h.c[name].resume(),stop:()=>h.c[name].stop()});await h.advance(600);click(h);await h.advance(600);assert.deepEqual(commands,['pause']);assert(gate(h));assert(js.paused);h.c.frStart();await h.advance(600);assert(gate(h),'a genuine paused journey keeps its group resume intent');assert.deepEqual(commands,['pause'],'fresh frequency does not resume the journey');click(h);await h.advance(600);assert.deepEqual(commands,['pause','resume']);assert(!gate(h));assert(js.run);click(h,'r588Stop');await h.advance(1600);assert.deepEqual(commands,['pause','resume','stop']);assert(!js.run&&!js.paused)});

 for(const [name,setup] of [
  ['missing arbiter',h=>{delete h.c.SukunForegroundArbiter}],
  ['observed spoken owner',h=>{h.c.SukunForegroundArbiter.snapshot=()=>({owner:null,queue:[],draining:false,observed:{spokenOwners:['single']}})}],
  ['missing observed owners',h=>{h.c.SukunForegroundArbiter.snapshot=()=>({owner:null,queue:[],draining:false})}],
  ['missing Tick recording API',h=>{delete h.c.SukunTickSound}],
  ['unknown Tick recording state',h=>{h.c.SukunTickSound.isRecording=()=>undefined}],
  ['missing physical-recording API',h=>{delete h.c.SukunPhysicalRecordingBusyR696}],
  ['unknown physical-recording state',h=>{h.c.SukunPhysicalRecordingBusyR696=()=>undefined}],
  ['missing item-recording API',h=>{delete h.c.SukunItemRecording}],
  ['null item-recording snapshot',h=>{h.c.SukunItemRecording.snapshot=()=>null}],
  ['foreground owner',h=>{h.c.SukunForegroundArbiter.snapshot=()=>({owner:{type:'single'},queue:[],draining:false})}],
  ['foreground queue',h=>{h.c.SukunForegroundArbiter.snapshot=()=>({owner:null,queue:[{type:'single'}],draining:false})}],
  ['foreground draining',h=>{h.c.SukunForegroundArbiter.snapshot=()=>({owner:null,queue:[],draining:true})}],
  ['unreadable arbiter',h=>{h.c.SukunForegroundArbiter.snapshot=()=>{throw Error('arbiter unavailable')}}],
  ['malformed arbiter queue',h=>{h.c.SukunForegroundArbiter.snapshot=()=>({owner:null,queue:null})}],
  ['central recording session',h=>{h.c._REC_AKTIF={}}],
  ['item microphone recording',h=>{h.c.ITEMREC={state:'recording'}}],
  ['item microphone preparing',h=>{h.c._r980ItemRecStarting=true}],
  ['item recording phase',h=>{h.c.SukunItemRecording={snapshot:()=>({phase:'saving'})}}],
  ['Studio recording session',h=>{h.c.R170={Studio:{session:{}}}}],
  ['Studio recording claim',h=>{h.c.R170={Studio:{recordClaim:{}}}}],
  ['Studio recording edit',h=>{h.c.R170={Studio:{edit:{}}}}],
  ['Tick microphone recording',h=>{h.c.SukunTickSound={isRecording:()=>true}}],
  ['physical recording playing',h=>{h.c.SukunPhysicalRecordingBusyR696=()=>true}],
  ['speech active',h=>{h.c.speechSynthesis.speaking=true}],
  ['speech pending',h=>{h.c.speechSynthesis.pending=true}],
  ['raw provider unknown',h=>{h.c.SukunAudioSessionRegistry.register('unknown',{getState:()=> 'preparing'})}],
  ['raw provider throws',h=>{h.c.SukunAudioSessionRegistry.register('throwing',{getState:()=>{throw Error('unreadable provider')}})}],
  ['raw provider unobservable',h=>{h.c.SukunAudioSessionRegistry.register('unobservable',{})}],
  ['raw provider nonstring',h=>{h.c.SukunAudioSessionRegistry.register('nonstring',{getState:()=>null})}],
 ])await test(`fail-closed: ${name}`,async()=>{const h=await fresh();h.c.SukunAudioSessionRegistry.pauseAll('ui:stale');setup(h);h.c.frStart();await h.advance(600);assert(gate(h));assert(h.c.FR.playing)});
 for(const fault of ['LOG.touch','syncFreqUI'])await test(`late start failure (${fault}) does not release gate`,async()=>{const h=await fresh();h.c.SukunAudioSessionRegistry.pauseAll('ui:stale');if(fault==='LOG.touch')h.c.LOG.touch=()=>{throw Error('injected late failure')};else h.c.syncFreqUI=()=>{throw Error('injected late failure')};assert.throws(()=>h.c.frStart(),/injected late failure/);await h.advance(600);assert(h.c.FR.playing);assert(gate(h))});
 await test('removed captured provider keeps unresolved gate',async()=>{const h=await fresh();let st='playing';h.c.SukunAudioSessionRegistry.register('removed',{getState:()=>st,pause(){st='paused'}});h.c.SukunAudioSessionRegistry.pauseAll('ui:captured');await h.advance(600);h.c.SukunAudioSessionRegistry.unregister('removed');h.c.frStart();await h.advance(600);assert(gate(h))});
 if(fixed)await test('internal STOPPING is not mistaken for raw idle before reconcile',async()=>{const h=await fresh();let st='playing';h.c.SukunAudioSessionRegistry.register('stopping-check',{getState:()=>st,pause(){st='paused'},stop(){return new Promise(()=>{})}});h.c.SukunAudioSessionRegistry.pauseAll('ui:captured');await h.advance(600);h.c.SukunAudioSessionRegistry.stop('stopping-check');st='idle';assert.equal(h.c.SukunAudioSessionRegistry.releaseFreshFrequencyPauseGate(),false);assert(gate(h))});
 const src=fs.readFileSync(source);
 const out={ok:true,variant:fixed?'candidate':'baseline',source,sha256:crypto.createHash('sha256').update(src).digest('hex'),tests:results.filter(x=>x.name).length,results,scope:'Actual extracted r588 click handler, r698 authority, registry, mini pause/resume, core frStart/frStop, hardStopAll and currentFlow/dock rendering. AudioContext, graph nodes, now-playing adaptation and journey APIs are controlled seams. Does not test device sound, microphone data, entire-page event ordering or original r932 stale-latch cause.'};
 fs.writeFileSync(path.join(__dirname,fixed?'frequency-pause-results.json':'frequency-pause-baseline-results.json'),JSON.stringify(out,null,2));console.log(JSON.stringify({ok:true,variant:out.variant,tests:out.tests,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
