'use strict';
// Unmodified shipped application, real Chromium and real native media clocks.
// Only source inputs are synthetic WAVs in an isolated profile. One optional
// registry provider is a controlled background endpoint, explicitly identified.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const out=path.resolve(process.argv[3]||path.join(root,'../qa-followup/session-transition-matrix.json'));
const expectedBuild=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim();
const report={suite:expectedBuild+' actual-app cross-mode session transition matrix',root,expectedBuild,candidateHandoff:process.env.SUKUN_MATRIX_EXPECT_HANDOFF==='1',quietVisuals:process.env.SUKUN_MATRIX_QUIET_VISUALS==='1',startedAt:new Date().toISOString(),sourceHash:hash(fs.readFileSync(path.join(root,'index.html'))),testHash:hash(fs.readFileSync(__filename)),checks:[],limitations:[
 'Real Classic/Feyz application scripts and native HTMLMediaElement clocks; recordings are generated tones in isolated IndexedDB. No personal browser or user recording is read.',
 'Calls use public production session/journey/arbiter APIs. Speech is the existing controlled fixture and is forbidden during personal-recording cases.',
 'A separate controlled registry background provider checks command scope/captured resume policy. It is not a physical ambient/frequency audio or Android test.',
 'No physical Android lock, OS focus, speaker audibility or Service Worker update transition is measured.'
]};
fs.mkdirSync(path.dirname(out),{recursive:true});
let f,p,cdp;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=!!report.total&&report.total===report.passed;fs.writeFileSync(out,JSON.stringify(report,null,2));}
async function state(){return p.evaluate(()=>__matrixState())}
async function test(name,fn){if(process.env.SUKUN_MATRIX_FILTER&&!new RegExp(process.env.SUKUN_MATRIX_FILTER).test(name))return;try{report.checks.push({name,passed:true,...await fn()})}catch(e){report.checks.push({name,passed:false,error:e.stack||String(e),state:await state().catch(()=>null),nativeLocks:await p.evaluate(()=>navigator.locks.query()).catch(()=>null),lockAck:await p.evaluate(()=>({delay:window.__matrixLockAckDelay,events:window.__matrixLockAckEvents})).catch(()=>null)})}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
async function reset(){
 await p.evaluate(async()=>{window.__matrixLockAckDelay=0;SukunR698Transport.stop('matrix-reset');await SukunR698Transport.whenStopped();SukunForegroundArbiter.clearQueue('matrix-reset');for(const api of [SukunBerhetiyyeSeyir,SukunEsma99Seyir])api.stop();SukunTerkipVoice.cancel('matrix-reset');SukunIntention.cancel('matrix-reset');SukunRecordingFailure.clearForRetry();__matrixBackground.state='ended';SukunAudioSessionRegistry.sync();});
 await p.waitForFunction(()=>!SukunR698Transport.snapshot().pendingStop&&!SukunR698Transport.snapshot().pendingStart&&!SukunBerhetiyyeSeyir.state().run&&!SukunEsma99Seyir.state().run&&!SukunTerkipVoice.snapshot().active,null,{timeout:10000});
 await p.waitForTimeout(150);
 if(cdp)await cdp.send('HeapProfiler.collectGarbage');
}
const kinds={single:{mode:'esma',journeyKind:'single',index:0},terkip:{mode:'terkip',journeyKind:'single',index:0},'28':{mode:'berhet',journeyKind:'28',index:0},'99':{mode:'esma',journeyKind:'99',index:0}};
async function select(kind){const selected=await p.evaluate(async options=>{const result=await SukunSessionState.command('select',options);if(result.accepted){Object.assign(Z,{target:99,targetMode:'manual',adv:false,tempo:4.2,tick:false,vib:false});if(options.journeyKind!=='single'){const prefix=options.journeyKind==='28'?'bs':'es99',mode=document.getElementById(prefix+'Mode'),custom=document.getElementById(prefix+'Custom');if(mode){mode.value='custom';mode.dispatchEvent(new Event('change'));}if(custom){custom.value=99;custom.dispatchEvent(new Event('input'));}}}return result;},kinds[kind]);assert.equal(selected.accepted,true,JSON.stringify(selected));return selected;}
async function start(kind){
 // Ordinary transition cases wait for the preceding native/Web Lock release.
 // A dedicated case below deliberately omits this wait to exercise rapid input.
 await p.waitForFunction(()=>!SukunTabOwner.snapshot().releasing&&!SukunTabOwner.snapshot().pending,null,{timeout:10000});
 const result=await p.evaluate(()=>SukunSessionState.command('start'));assert.equal(result.accepted,true,JSON.stringify(result));
 await p.waitForFunction(kind=>{const x=__matrixState();return kind==='28'?x.b.run&&!x.b.paused:kind==='99'?x.e.run&&!x.e.paused:x.direct.auto&&x.z.cat===(kind==='terkip'?'terkip':'esma')},kind,{timeout:15000});
 await p.waitForFunction(kind=>__matrixState().native.some(x=>!x.paused&&!x.ended&&x.ready>=2&&x.key===(kind==='28'?'berhet:0':kind==='terkip'?'terkip:0':'esma:0:nida')),kind,{timeout:18000});
 return state();
}
function assertOne(s,kind){assert.equal(s.b.run&&s.e.run,false,'two journey loops cannot run together');assert.equal(s.direct.auto&&(s.b.run||s.e.run),false,'single scheduler cannot overlap journey');assert.equal(s.terkip.active&&(s.b.run||s.e.run),false,'terkip cannot overlap journey');assert.equal(s.arb.owner?.type,kind==='28'?'journey28':kind==='99'?'journey99':'auto-zikir',JSON.stringify(s.arb));const active=s.native.filter(x=>!x.paused&&!x.ended&&x.ready>=2);assert(active.length<=1,'multiple counted/spoken native elements');for(const a of active)assert.equal(a.key,kind==='28'?'berhet:0':kind==='terkip'?'terkip:0':'esma:0:nida','physical native source must match its logical owner');}
async function main(){
 f=await fixture(root,{seed:{'sukun.kilitAcik':'true'}});p=f.page;
 if(process.env.SUKUN_MATRIX_EXPECT_HANDOFF==='1'){
  // Deterministically expose the native completion boundary without replacing
  // Web Locks. Physical acquisition/callback/release stay native; delivery of
  // request() completion alone is delayed, and only in the handoff cases.
  report.limitations.push('Handoff cases use native Web Locks, with only delivery of native request() completion delayed by 1500 ms. This makes the own-release fence observable; ordinary matrix cases have zero added delay.');
  await f.context.addInitScript(()=>{const native=navigator.locks.request.bind(navigator.locks);window.__matrixLockAckDelay=0;window.__matrixLockAckEvents=[];navigator.locks.request=(...args)=>native(...args).then(value=>{const delay=Number(window.__matrixLockAckDelay)||0;if(!delay)return value;__matrixLockAckEvents.push({op:'native-request-completed',at:performance.now(),delay});return new Promise(resolve=>setTimeout(()=>{__matrixLockAckEvents.push({op:'completion-delivered',at:performance.now(),delay});resolve(value)},delay))});});
  await p.reload({waitUntil:'load',timeout:60000});await p.waitForFunction(()=>!!window.SukunVoiceSettings&&!!window.SukunSessionState&&!!window.SukunForegroundArbiter);await p.waitForTimeout(1200);
 }
 if(process.env.SUKUN_MATRIX_QUIET_VISUALS==='1'){
  report.limitations.push('Audio semantic run uses reduced-motion media preference and a test-only stylesheet disabling animation, transition, filter and backdrop-filter. CDP garbage collection runs only between independent cases. Production HTML/CSS/script bytes remain unchanged; this run does not validate visual rendering/performance.');
  await p.emulateMedia({reducedMotion:'reduce'});await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;filter:none!important;backdrop-filter:none!important}'});cdp=await f.context.newCDPSession(p);
 }
 report.limitations.push('Each independent case ends the prior session and explicitly clears a held synthetic-recording error through the public Retry-clear API; no playback is started by that reset. Failure snapshots are retained before any reset.');
 const tone=wav(4,440).toString('base64');
 await p.evaluate(async tone=>{
  KLT_AC('matrix-fixture');const blob=()=>new Blob([Uint8Array.from(atob(tone),x=>x.charCodeAt(0))],{type:'audio/wav'});
  for(const key of ['esma:0:nida','esma:1:nida','esma:2:nida','berhet:0','berhet:1','berhet:2','terkip:0']){await REC_DB.set(key,blob());RECKEYS.add(key);}
  NIYET.on=false;NIYET.spk=false;ZA.kapali=true;
  await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');SPK.on=true;SukunR698VoiceIntent.explicit(true);
  window.__matrixBackground={state:'ended',pauses:0,resumes:0,stops:0};
  SukunAudioSessionRegistry.register('matrix-background',{priority:1,title:'Matrix controlled background',getState:()=>__matrixBackground.state,play:()=>{__matrixBackground.state='playing';return true},resume:()=>{__matrixBackground.resumes++;__matrixBackground.state='playing';return true},pause:()=>{__matrixBackground.pauses++;__matrixBackground.state='paused';return true},stop:()=>{__matrixBackground.stops++;__matrixBackground.state='ended';return true}});
  window.__matrixState=()=>({z:{cat:Z.cat,idx:Z.idx,count:Z.count,total:Z.total},direct:SukunDirectZikirTransportR698.state(),b:SukunBerhetiyyeSeyir.state(),e:SukunEsma99Seyir.state(),terkip:SukunTerkipVoice.snapshot(),arb:SukunForegroundArbiter.snapshot(),transport:SukunR698Transport.snapshot(),session:SukunSessionState.snapshot(),failure:SukunRecordingFailure.get(),single:SukunLockAudio?.snapshot?.(),aggregate:SukunAudioSessionRegistry.aggregateSnapshot(),tab:SukunTabOwner.snapshot(),bg:{...__matrixBackground},heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null,speech:__r1064SpeechFixture.snapshot(),native:[...document.querySelectorAll('audio')].filter(a=>a.dataset.sukLockKey||a._sukunRecordingKey||a._sukunAd||a===window.__sukJourneyNative?.a).filter(a=>a.dataset.sukSilentCarrier!=='1').map(a=>({key:a.dataset.sukLockKey||a._sukunRecordingKey||window.__sukJourneyNative?.recordingKey||a._sukunAd||'',paused:a.paused,ended:a.ended,ready:a.readyState,time:a.currentTime,duration:Number.isFinite(a.duration)?a.duration:null}))});
 },tone);
 await test('Exact application starts Classic/Feyz with unlocked fixture-only inputs',async()=>{const x=await p.evaluate(()=>({build:SukunSessionState.snapshot().build,theme:SukunShellSkin.getAppearance(),shell:localStorage.getItem('sukun.ui.shellMode'),unlocked:SukunSecretPolicy.unlocked()}));assert.equal(x.build,expectedBuild);assert.equal(x.theme,'feyz');assert.equal(x.shell,'classic');assert.equal(x.unlocked,true);return x});
 for(const from of ['28','99','single','terkip'])for(const to of ['28','99','single','terkip'])if(from!==to)await test(`Session selection ${from} → ${to} retires old owner before replacement`,async()=>{
  await reset();await select(from);const before=await start(from);assertOne(before,from);
  const request=await select(to);const selected=await state();assert.equal(selected.b.run,false);assert.equal(selected.e.run,false);assert.equal(selected.direct.auto,false);assert.equal(selected.terkip.active,false);assert.equal(selected.arb.queue.filter(x=>['auto-zikir','journey28','journey99'].includes(x.type)).length,0,'explicit selection cannot leave an old automatic resume queued');
  const after=await start(to);assertOne(after,to);assert.equal(after.speech.log.length,0,'personal mode must not fall back to speech');return{before:{mode:from,owner:before.arb.owner,z:before.z},selectionEpoch:request.epoch,after:{mode:to,owner:after.arb.owner,z:after.z,native:after.native}};
 });
 for(const kind of ['28','99','single','terkip'])await test(`${kind} local Pause holds owner and queued Listen; global Resume cannot release local hold`,async()=>{
  await reset();await select(kind);await start(kind);
  assert.equal(await p.evaluate(()=>SukunR698Transport.pauseDhikr('matrix-local')),true);
  const before=await state();assertOne(before,kind);assert.equal(before.session.paused,true);
  const q=await p.evaluate(()=>{const ok=SukunForegroundArbiter.enqueueCaptured({cat:'esma',idx:1,item:ZIKIR.esma.items[1],kind:'single',source:'matrix-paused-owner'});return ok?SukunForegroundArbiter.snapshot().queue.find(x=>x.source==='matrix-paused-owner')?.id:null});assert(q);
  await p.evaluate(()=>SukunAudioSessionRegistry.resumeAll());await p.waitForTimeout(350);
  const held=await state();assert.equal(held.session.paused,true,'global Resume must not release an independent local Pause');assert.equal(held.z.total,before.z.total);assert.equal(held.arb.owner.id,before.arb.owner.id);assert(held.arb.queue.some(x=>x.id===q));assert.equal(held.native.filter(x=>!x.paused&&!x.ended&&x.ready>=2).length,0);
  assert.equal(await p.evaluate(()=>SukunR698Transport.resumeDhikr('matrix-local')),true);await p.waitForFunction(()=>!__matrixState().session.paused&&__matrixState().native.some(x=>!x.paused&&!x.ended&&x.ready>=2),null,{timeout:15000});
  const resumed=await state();assertOne(resumed,kind);assert.equal(resumed.z.total,before.z.total,'Resume itself never credits a repetition');return{owner:before.arb.owner,queueId:q,heldTotal:held.z.total,resumedTotal:resumed.z.total};
 });
 for(const kind of ['28','99','single','terkip'])await test(`${kind} local/global Pause scopes retain only captured providers`,async()=>{
  await reset();await select(kind);await start(kind);await p.evaluate(()=>SukunAudioSessionRegistry.play('matrix-background'));
  const playing=await state();assert.equal(playing.bg.state,'playing');
  await p.evaluate(()=>SukunR698Transport.pauseDhikr('matrix-scope'));const local=await state();assert.equal(local.bg.state,'playing');assert.equal(local.aggregate.paused,false);
  await p.evaluate(()=>SukunAudioSessionRegistry.pauseAll('ui:matrix-global'));const global=await state();assert.equal(global.bg.state,'paused');assert.equal(global.aggregate.paused,true);assert(global.aggregate.providerIds.includes('matrix-background'));
  assert.equal(await p.evaluate(()=>SukunR698Transport.resumeDhikr('matrix-forbidden-local-resume')),false);assert.equal((await state()).session.paused,true);
  await p.evaluate(()=>SukunAudioSessionRegistry.resumeAll());const restored=await state();assert.equal(restored.bg.state,'playing');assert.equal(restored.session.paused,true,'captured global Resume must leave independently locally paused dhikr held');return{playing:playing.bg,local:local.bg,global:global.bg,restored:restored.bg};
 });
 for(const kind of ['28','99','single','terkip'])await test(`${kind} rapid Stop → Start → Pause fences stale restart and repeat credit`,async()=>{
  await reset();await select(kind);await start(kind);const before=await state();
  await p.evaluate(()=>{SukunR698Transport.stopDhikr('matrix-rapid');window.__matrixPendingStart=SukunSessionState.command('start');window.__matrixPendingPause=SukunSessionState.command('pause');});
  await p.evaluate(async()=>{await Promise.all([__matrixPendingStart,__matrixPendingPause,SukunR698Transport.whenStopped()])});await p.waitForTimeout(350);
  const after=await state();assert.equal(after.direct.auto,false);assert.equal(after.b.run,false);assert.equal(after.e.run,false);assert.equal(after.z.total,before.z.total);assert.equal(after.native.filter(x=>!x.paused&&!x.ended&&x.ready>=2).length,0);return{before:before.z,after:after.z,transport:after.transport};
 });
 await test('Rapid owned 28 selection → 99 Start fails closed during own lock release; trusted retry starts',async()=>{
  await reset();await select('28');await start('28');const before=await state();assert.equal(before.tab.owned,true);assert.equal(before.tab.releasing,false);
  const result=await p.evaluate(async options=>{const selected=await SukunSessionState.command('select',options);const afterSelect=__matrixState();const started=await SukunSessionState.command('start');return{selected,afterSelect,started,afterStart:__matrixState()};},kinds['99']);
  assert.equal(result.selected.accepted,true);report.rapidSelectEvidence=result;
  if(!result.started.accepted){assert.equal(result.started.reason,'cross-tab-held');assert.equal(result.afterSelect.tab.releasing,true);assert.equal(result.afterStart.tab.blocked,false);assert.equal(result.afterStart.tab.reason,'preparing');assert.equal(result.afterStart.e.run,false);}
  await p.waitForFunction(()=>!SukunTabOwner.snapshot().releasing&&!SukunTabOwner.snapshot().pending,null,{timeout:10000});
  if(!result.started.accepted){await p.locator('.tab[data-t="zkr"]').click();await p.locator('#r920Play').click({force:true});}
  await p.waitForFunction(()=>SukunEsma99Seyir.state().run,null,{timeout:15000});return{before:before.tab,afterSelect:result.afterSelect.tab,immediateStart:result.started,trustedRetry:await state()};
 });
 if(process.env.SUKUN_MATRIX_EXPECT_HANDOFF==='1'){
  for(const [from,to]of [['28','99'],['99','28']])await test(`Candidate trusted ${from} → ${to} EasyPlay waits for own lock release`,async()=>{
   await reset();await p.locator('.tab[data-t="zkr"]').click();await select(from);await start(from);const before=await state();assert.equal(before.tab.owned,true);
   const selected=await p.evaluate(async options=>{window.__matrixLockAckDelay=1500;return SukunSessionState.command('select',options);},kinds[to]);assert.equal(selected.accepted,true);
   await p.waitForFunction(()=>SukunTabOwner.snapshot().releasing&&!SukunTabOwner.snapshot().owned,null,{timeout:10000});const atClick=await state();await p.locator('#r932EasyPlay').click({force:true});
   const queued=await state();assert.equal(queued.tab.pending,true,'The new explicit Start is observable while its own completion is held');
   await p.waitForFunction(kind=>kind==='28'?SukunBerhetiyyeSeyir.state().run:SukunEsma99Seyir.state().run,to,{timeout:15000});
   await p.waitForFunction(()=>__matrixState().native.some(x=>!x.paused&&!x.ended&&x.ready>=2),null,{timeout:18000});const after=await state();assertOne(after,to);return{input:'trusted Playwright click through shipped EasyPlay handler; real owner/Web Lock/media, delayed completion delivery',before:before.tab,atClick:atClick.tab,queued:queued.tab,after:after.tab,owner:after.arb.owner};
  });
  for(const superseding of ['pause','stop','select'])await test(`Candidate queued EasyPlay is fenced by intervening ${superseding}`,async()=>{
   await reset();await p.locator('.tab[data-t="zkr"]').click();await select('28');await start('28');
   await p.evaluate(async options=>{window.__matrixLockAckDelay=1500;await SukunSessionState.command('select',options);},kinds['99']);await p.waitForFunction(()=>SukunTabOwner.snapshot().releasing&&!SukunTabOwner.snapshot().owned,null,{timeout:10000});const atClick=await state();await p.locator('#r932EasyPlay').click({force:true});const queued=await state();assert.equal(queued.tab.pending,true);
   await p.evaluate(async superseding=>{await(superseding==='select'?SukunSessionState.command('select',{mode:'esma',journeyKind:'single',index:2}):SukunSessionState.command(superseding));},superseding);
   await p.waitForFunction(()=>!SukunTabOwner.snapshot().releasing&&!SukunTabOwner.snapshot().pending,null,{timeout:10000});await p.waitForTimeout(400);const after=await state();assert.equal(after.b.run,false);assert.equal(after.e.run,false);assert.equal(after.direct.auto,false);assert.equal(after.native.filter(x=>!x.paused&&!x.ended&&x.ready>=2).length,0);assert.equal(after.z.total,atClick.z.total);return{atClick:atClick.tab,queued:queued.tab,after:after.tab,z:after.z};
  });
  await test('Candidate immediate mode change followed by trusted EasyPlay click starts exactly one journey',async()=>{
   await reset();await p.locator('.tab[data-t="zkr"]').click();await select('28');await start('28');
   await p.evaluate(()=>{window.__matrixTrustedClicks=[];document.addEventListener('click',e=>{if(e.target.closest?.('#r932EasyPlay'))__matrixTrustedClicks.push({trusted:e.isTrusted,tab:SukunTabOwner.snapshot(),at:performance.now()})},true)});
   await select('99');await p.locator('#r932EasyPlay').click({force:true});await p.waitForFunction(()=>SukunEsma99Seyir.state().run,null,{timeout:15000});const after=await state(),clicks=await p.evaluate(()=>__matrixTrustedClicks);assert(clicks.some(x=>x.trusted));assertOne(after,'99');return{clicks,owner:after.arb.owner,tab:after.tab};
  });
 }
 await reset();
 await test('All served app bytes still match disk with no missing app files or script/integrity errors',async()=>{const evidence=f.evidence();for(const [name,row]of Object.entries(evidence.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),name);assert.equal(evidence.pageErrors.length,0,JSON.stringify(evidence.pageErrors));assert.equal(evidence.failedRequests.length,0,JSON.stringify(evidence.failedRequests));assert(!evidence.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),JSON.stringify(evidence.consoleErrors));report.evidence=evidence;return{servedFiles:Object.keys(evidence.served).length,failedRequests:evidence.failedRequests};});
 report.finishedAt=new Date().toISOString();report.finalState=await state();save();
}
main().catch(e=>{report.fatal=e.stack||String(e);save();console.error(e);process.exitCode=1}).finally(async()=>{if(f){report.evidence=report.evidence||f.evidence();save();await f.close()}console.log(JSON.stringify({passed:report.passed,total:report.total,report:out}));if(!report.allPassed)process.exitCode=1});
