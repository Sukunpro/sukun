'use strict';
// Full shipped app + Chromium/native HTMLMediaElement/WebAudio. Only isolated
// generated WAV inputs, device TTS, and explicitly named race seams are controlled.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1121-dhikr-lifecycle-browser.json');
const report={suite:'r1121 native journey lifecycle and independent background scope',sourceSha256:hash(fs.readFileSync(path.join(root,'index.html'))),testSha256:hash(fs.readFileSync(__filename)),startedAt:new Date().toISOString(),checks:[],limitations:[
 'Full app served byte-for-byte, isolated Chromium profile and generated WAV recordings only; no private fixtures.',
 'Device speech is controlled by the existing fixture. Personal recordings use real HTMLMediaElement clocks; ambience/frequency use real WebAudio graphs.',
 'Visibility events in designated checks are simulated document visibility, not OS lock or native Android/PWA behavior.',
 'Wake-race checks inject a system-hold state; watchdog checks keep only the retired resolver promise unresolved and wait the real shipped watchdog duration.',
 'Native interaction uses current visible r932 easy controls and r920 settings/navigation. Legacy bs/es99 button rows are intentionally hidden and are covered by the source-owner contract, not misreported as clickable UI.',
 'No physical Android, lockscreen, Bluetooth, audio-focus or subjective audibility acceptance is claimed.'
]};
let f,p,playProbeSeq=0;
const save=()=>{report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total>0&&report.total===report.passed&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');};
async function state(){return p.evaluate(()=>{
 const all=new Set([...document.querySelectorAll('audio'),...(window.SES?.ler||[]),window.__sukJourneyNative?.a].filter(Boolean));
 return{b:SukunBerhetiyyeSeyir.state(),e:SukunEsma99Seyir.state(),counter:{cat:Z.cat,index:Z.idx,count:Z.count,total:Z.total,target:Z.target},session:SukunSessionState.snapshot().phase,frequency:FR.playing,ambience:Object.keys(AMB).sort(),context:ctx?.state||null,contextSampleRate:ctx?.sampleRate||null,aggregate:SukunAudioSessionRegistry.aggregateSnapshot(),speech:__r1064SpeechFixture.log.length,recordingFailure:SukunRecordingFailure.snapshot(),preparation:window.SukunAudioPreparation?.snapshot?.(),nativeEcho:window.SukunNativeEchoBridge?.snapshot?.(),
 media:[...all].filter(a=>a.dataset.sukSilentCarrier!=='1').map(a=>({key:a===window.__sukJourneyNative?.a?window.__sukJourneyNative.recordingKey:a.dataset.sukLockKey||a._sukunRecordingKey||'',nativeMedia:a instanceof HTMLMediaElement,nativeAudio:a instanceof HTMLAudioElement,constructor:a.constructor?.name,tag:a.tagName,paused:a.paused,ended:a.ended,seeking:a.seeking,time:a.currentTime,duration:a.duration,rate:a.playbackRate,ready:a.readyState,sourceMatches:a===window.__sukJourneyNative?.a&&a.currentSrc===window.__sukJourneyNative.playUrl})).filter(a=>a.key)};
});}
async function reset(){if(await p.locator('#r629DoneClose').isVisible()){await tap('#r629DoneClose');await p.locator('#r629JourneyDone').waitFor({state:'hidden'});}await p.evaluate(async()=>{delete window.__r1121Hidden;SukunR698Transport.stop('r1121-test-reset');await SukunR698Transport.whenStopped();SukunAudioSessionRegistry.stopAll();SukunBerhetiyyeSeyir.stop();SukunEsma99Seyir.stop();SukunForegroundArbiter.clearQueue('r1121-test-reset');SukunRecordingFailure.clearForRetry();if(window.__r1121Resolver){window.AudioResolver.play=__r1121Resolver;delete window.__r1121Resolver;}});await p.waitForFunction(()=>!SukunR698Transport.snapshot().pendingStop&&!SukunTabOwner.snapshot().releasing&&!SukunTabOwner.snapshot().pending);await p.waitForTimeout(200);}
async function check(name,fn,cleanup){
 try{await reset();const evidence=await fn();report.checks.push({name,passed:true,evidence});}
 catch(error){report.checks.push({name,passed:false,error:error.stack||String(error),state:await state().catch(()=>null),ui:await uiRoute().catch(()=>null)});}
 finally{if(cleanup)try{await cleanup();}catch(error){const row=report.checks.at(-1);row.passed=false;row.cleanupError=error.stack||String(error);}}
 save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));
}
async function idle(){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());await p.waitForTimeout(100);}
async function panel(){await idle();if(await p.locator('#r938PanelToggle').getAttribute('aria-expanded')!=='true')await tap('#r938PanelToggle');await p.locator('#r938PanelBody').waitFor({state:'visible'});}
async function uiRoute(){return p.evaluate(()=>({phase:SukunSessionState.snapshot().phase,journeyKind:SukunSessionState.snapshot().journeyKind,rootClass:document.documentElement.className,panel:document.getElementById('r938Panel')?.dataset.open,controls:['r932EasyPlay','r932EasyStop','r920Next','r920Restart','r920RepeatMode','r920RepeatCustom','bsStart','es99Start'].map(id=>{const n=document.getElementById(id),r=n?.getBoundingClientRect();return{id,exists:!!n,visible:!!n&&!!r.width&&!!r.height&&getComputedStyle(n).visibility!=='hidden',display:n?getComputedStyle(n).display:null,disabled:n?.disabled,value:n?.value};})}));}
async function tap(selector){await idle();assert(await p.locator(selector).isVisible(),'Supported native control must be visible: '+selector+'; '+JSON.stringify(await uiRoute()));await p.locator(selector).scrollIntoViewIfNeeded();await p.locator(selector).click({timeout:15000});await p.waitForTimeout(60);}
async function selected(kind,index=0,repeats=3){
 const r=await p.evaluate(async({kind,index})=>{const r=await SukunSessionState.command('select',{mode:kind===28?'berhet':'esma',journeyKind:String(kind),index});Z.tick=Z.vib=false;Z.adv=false;return r;},{kind,index});assert.equal(r.accepted,true,JSON.stringify(r));await idle();
 await panel();if(!await p.locator('#r920JourneySettings').evaluate(n=>n.open))await tap('#r920JourneySettings > summary');
 await p.locator('#r920RepeatMode').focus();await p.keyboard.press('End');await p.keyboard.press('Tab');await idle();assert.equal(await p.locator('#r920RepeatMode').inputValue(),'custom');
 await p.locator('#r920RepeatCustom').focus();await p.keyboard.press('Control+A');await p.keyboard.type(String(repeats));await p.keyboard.press('Tab');await idle();
 await p.locator('#r920RepeatGap').focus();await p.keyboard.press('Home');await p.keyboard.press('Tab');await idle();
 const applied=await p.evaluate(kind=>{const pre=kind===28?'bs':'es99';return{mode:document.getElementById(pre+'Mode').value,repeats:Number(document.getElementById(pre+'Custom').value),compact:Number(document.getElementById('r920RepeatCustom').value),kind:SukunSessionState.snapshot().journeyKind};},kind);
 assert.equal(applied.mode,'custom');assert.equal(applied.repeats,repeats);assert.equal(applied.compact,repeats);assert.equal(applied.kind,String(kind));
 assert(await p.locator('#r932EasyPlay').isVisible(),'Current easy transport is visible');
}
async function recording(kind,index,seconds){await p.evaluate(async({key,tone})=>{await REC_DB.set(key,new Blob([Uint8Array.from(atob(tone),c=>c.charCodeAt(0))],{type:'audio/wav'}));RECKEYS.add(key);},{key:kind===28?'berhet:'+index:'esma:'+index+':nida',tone:wav(seconds,440).toString('base64')});}
async function waitPlaying(kind,index=0){
 const probe=++playProbeSeq;let handle;
 try{
  // Playwright1.57 polls synchronous truthiness: an async predicate would
  // accept its Promise even when it resolves false. Retain samples ourselves.
  handle=await p.waitForFunction(({kind,index,probe})=>{
   const api=kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir,j=window.__sukJourneyNative,a=j?.a,s=api.state();
   const key=kind===28?'berhet:'+index:'esma:'+index+':nida';
   const ready=s.run&&!s.paused&&s.i===index&&!!j&&!!a&&a instanceof HTMLMediaElement&&a instanceof HTMLAudioElement&&
    j.recordingKey===key&&a.currentSrc===j.playUrl&&a.readyState>=2&&!a.seeking&&!a.paused&&!a.ended&&
    Number.isFinite(a.duration)&&a.duration>0&&window.SukunBackgroundAudioOwner.snapshot().playing;
   if(!ready){delete window.__r1121MediaProbe;return false;}
   const old=window.__r1121MediaProbe,at=performance.now();
   if(!old||old.probe!==probe||old.j!==j||old.a!==a||old.source!==j.playUrl||old.sequence!==j.prepareSeq||old.attempt!==s.attemptSeq){
    window.__r1121MediaProbe={probe,j,a,source:j.playUrl,sequence:j.prepareSeq,attempt:s.attemptSeq,time:a.currentTime,at};return false;
   }
   // The initial baked-gap seek is not playback. Require the same physical
   // source/attempt to advance over a distinct150ms observation interval.
   return at-old.at>=150&&a.currentTime>old.time+.03;
  },{kind,index,probe},{timeout:18000,polling:50});
  assert.equal(await handle.jsonValue(),true,'native readiness must resolve true, not merely settle');
 }finally{
  if(handle)await handle.dispose();
  await p.evaluate(probe=>{if(window.__r1121MediaProbe?.probe===probe)delete window.__r1121MediaProbe;},probe);
 }
}
async function start(kind,index=0){await p.waitForFunction(()=>!SukunTabOwner.snapshot().releasing&&!SukunTabOwner.snapshot().pending);await tap('#r932EasyPlay');await waitPlaying(kind,index);}
async function stop(kind){await tap('#r932EasyStop');await p.waitForFunction(kind=>!(kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state().run,kind);}
function own(s,kind){return kind===28?s.b:s.e;}
(async()=>{try{
 f=await fixture(root,{seed:{'sukun.kilitAcik':'true','sukun.onboardSeen':'1','sukun.obDone':'1','sukun.obSeenBuild':'"2026-08-06-r3"','sukun.zikir.quickControls.focus.v1':'1','sukun.r920.focus':'0'}});p=f.page;if(await p.locator('#obSkip').isVisible())await tap('#obSkip');if(await p.locator('#dcClose').isVisible())await tap('#dcClose');
 await p.evaluate(async()=>{KLT_AC('r1121-isolated-fixture');NIYET.on=NIYET.spk=NIYET.devir=false;ZA.kapali=true;SPK.on=true;Z.tick=Z.vib=false;Z.adv=false;KAYIT.yankiMik=0;KAYIT.mekan=false;await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');SukunR698VoiceIntent.explicit(true);window.__r1121Clicks=[];document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b)__r1121Clicks.push({id:b.id,trusted:e.isTrusted,kind:window.SukunSessionState?.snapshot?.()?.journeyKind})},true);});
 await tap('.tab[data-t="zkr"]');
 for(const kind of [28,99]){
  await recording(kind,0,8);await recording(kind,1,8);await recording(kind,kind-1,1.5);
  await check(`${kind}: visible native Pause/Resume/Finish and duplicate Resume retain one reading`,async()=>{await selected(kind);await start(kind);const before=await state();const result=await p.evaluate(kind=>{const api=kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir,s=api.state();api.resume();api.resume();return{before:s,after:api.state()};},kind);assert.equal(result.after.attemptSeq,result.before.attemptSeq);await tap('#r932EasyPlay');const paused=await state();assert.equal(own(paused,kind).paused,true);assert.equal(own(paused,kind).run,false);assert.equal(paused.counter.total,before.counter.total);await p.waitForTimeout(400);assert.equal((await state()).counter.total,paused.counter.total);await tap('#r932EasyPlay');await waitPlaying(kind);const resumed=await state();assert.equal(own(resumed,kind).rep,own(paused,kind).rep);assert.equal(resumed.speech,0);await stop(kind);const stopped=await state();await p.waitForTimeout(500);assert.equal(own(await state(),kind).run,false);assert.equal((await state()).counter.total,stopped.counter.total);return{before,paused,resumed,stopped};});
  await check(`${kind}: rapid native Pause/Resume burst leaves one active reading and Stop remains terminal`,async()=>{await selected(kind);await start(kind);const before=await state();await p.locator('#r932EasyPlay').dblclick({delay:80});await waitPlaying(kind);const after=await state();assert.equal(own(after,kind).run,true);assert.equal(after.media.filter(a=>!a.paused&&!a.ended).length,1);assert.equal(after.counter.total,before.counter.total);await stop(kind);await p.waitForTimeout(600);assert.equal(own(await state(),kind).run,false);assert.equal((await state()).counter.total,before.counter.total);return{before,after};});
  await check(`${kind}: Next and Again cancel partial reading without invented credit`,async()=>{await selected(kind);await start(kind);const before=await state();await panel();await tap('#r920Next');await waitPlaying(kind,1);assert.equal((await state()).counter.total,before.counter.total);await panel();await tap('#r920Restart');await waitPlaying(kind,1);const after=await state();assert.equal(own(after,kind).rep,0);assert.equal(after.counter.total,before.counter.total);await stop(kind);return{before,after};});
  await check(`${kind}: final native recording gives exactly one credit and replay restarts item zero`,async()=>{await selected(kind,kind-1,1);const before=await state();await start(kind,kind-1);await p.waitForFunction(kind=>{const s=(kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir).state();return !s.run&&s.i===kind;},kind,{timeout:12000});const completed=await state();assert.equal(completed.counter.total,before.counter.total+1);await p.locator('#r629DoneRepeat').waitFor({state:'visible'});await tap('#r629DoneRepeat');await waitPlaying(kind,0);await p.locator('#r629JourneyDone').waitFor({state:'hidden'});const replay=await state();assert.equal(own(replay,kind).i,0);await stop(kind);return{before,completed,replay};});
  await check(`${kind}: queued pageshow cannot revive a later explicit Stop`,async()=>{await selected(kind);await start(kind);await p.evaluate(kind=>{const api=kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir,s=kind===28?BERHET_SEYIR:ESMA99_SEYIR;api.pause();s.systemHold=true;window.dispatchEvent(new PageTransitionEvent('pageshow'));api.stop();},kind);const before=await state();await p.waitForTimeout(700);const after=await state();assert.equal(own(after,kind).run,false);assert.equal(own(after,kind).paused,false);assert.equal(after.counter.total,before.counter.total);return{before,after};});
  await check(`${kind}: retired watchdog cannot interrupt real replacement media at the old deadline`,async()=>{
   // The former 45-second fixture exceeded the shipped 32-MiB FX budget.
   // 37 seconds fits at 44.1/48 kHz and still outlasts either retired deadline.
   // Real preparation and native media clocks remain in use, without overrides.
   await recording(kind,0,37);await selected(kind);
   await p.evaluate(()=>{delete window.__r1121OldStart;window.__r1121Resolver=window.AudioResolver.play;window.AudioResolver.play=()=>{window.__r1121OldStart=performance.now();return new Promise(()=>{});};});
   await tap('#r932EasyPlay');await p.waitForFunction(()=>Number.isFinite(window.__r1121OldStart));await p.waitForTimeout(1000);
   await p.evaluate(kind=>{const api=kind===28?SukunBerhetiyyeSeyir:SukunEsma99Seyir;api.pause();window.AudioResolver.play=__r1121Resolver;delete window.__r1121Resolver;window.__r1121NewStart=performance.now();api.resume();},kind);
   await waitPlaying(kind);const before=await state();
   const deadline=await p.evaluate(kind=>({old:__r1121OldStart+(kind===28?26000:35000),next:__r1121NewStart+(kind===28?26000:35000),now:performance.now()}),kind);
   const target=deadline.old+Math.min(300,(deadline.next-deadline.old)/2);assert(target<deadline.next,'old/new deadlines distinct');
   const replacement=before.media.find(a=>!a.paused&&!a.ended);assert(replacement,'real replacement media exists');
   assert((replacement.duration-replacement.time)/replacement.rate*1000>target-deadline.now,'native fixture outlasts the retired watchdog');
   await p.waitForTimeout(Math.max(0,target-deadline.now));const after=await state();
   assert.equal(own(after,kind).run,true);assert.equal(own(after,kind).attemptSeq,own(before,kind).attemptSeq);assert.equal(after.counter.total,before.counter.total);
   assert(after.media.some(a=>!a.paused&&!a.ended&&a.time>20),'native replacement clock kept progressing');
   await stop(kind);return{before,after,deadline,target,fixtureSeconds:37};
  },async()=>{try{await reset();}finally{await recording(kind,0,8);}});

 }
 for(const hidden of [false,true])await check(`${hidden?'simulated hidden':'visible'} local journey Pause/Resume/Finish preserve real ambience and frequency`,async()=>{await selected(99);await p.evaluate(()=>{ac();const def=AMBIENT_DEFS.find(x=>x.id==='stream')||AMBIENT_DEFS[0];window.__r1121AmbId=def.id;chOn(def);frStart();window.__r1121AmbRef=AMB[def.id];window.__r1121FreqRef=FR.E;});await start(99);if(hidden)await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>!!window.__r1121Hidden});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__r1121Hidden?'hidden':'visible'});window.__r1121Hidden=true;document.dispatchEvent(new Event('visibilitychange'));});if(hidden)await p.waitForTimeout(1200);await p.evaluate(()=>{window.__r1121AmbRef=AMB[__r1121AmbId];window.__r1121FreqRef=FR.E;});const before=await state();for(const action of ['pause','resume','stop']){const result=await p.evaluate(action=>SukunSessionState.command(action),action);assert.equal(result.accepted,true,JSON.stringify(result));await p.waitForTimeout(200);const s=await state();assert.equal(s.frequency,true);assert(s.ambience.includes(await p.evaluate(()=>__r1121AmbId)));assert.equal(s.context,before.context);assert.equal(s.aggregate.paused,false);assert(await p.evaluate(()=>AMB[__r1121AmbId]===__r1121AmbRef&&FR.E===__r1121FreqRef));}const after=await state();assert.equal(after.counter.total,before.counter.total);await p.evaluate(()=>{window.__r1121Hidden=false;document.dispatchEvent(new Event('visibilitychange'));});return{before,after};});
 await check('global Pause/Resume stops/restarts the shared context and terminal Stop clears all layers',async()=>{await selected(99);await p.evaluate(()=>{ac();chOn(AMBIENT_DEFS.find(x=>x.id==='stream')||AMBIENT_DEFS[0]);frStart();});await start(99);const before=await state();await p.evaluate(()=>SukunAudioSessionRegistry.pauseAll('r1121-global'));await p.waitForFunction(()=>ctx.state==='suspended'&&SukunAudioSessionRegistry.aggregateSnapshot().paused);const paused=await state();await p.waitForTimeout(500);assert.equal((await state()).counter.total,paused.counter.total);await p.evaluate(()=>SukunAudioSessionRegistry.resumeAll());await p.waitForFunction(()=>ctx.state==='running'&&!SukunAudioSessionRegistry.aggregateSnapshot().paused);await p.evaluate(()=>SukunAudioSessionRegistry.stopAll());await p.waitForFunction(()=>!FR.playing&&Object.keys(AMB).length===0&&!ESMA99_SEYIR.run&&!BERHET_SEYIR.run);const stopped=await state();await p.waitForTimeout(500);assert.equal((await state()).counter.total,stopped.counter.total);return{before,paused,stopped};});
 await check('served production bytes, trusted current-shell clicks and no runtime/SRI faults',async()=>{const evidence=f.evidence();for(const[name,row]of Object.entries(evidence.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'source changed '+name);assert.deepEqual(evidence.pageErrors,[]);assert(!evidence.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),evidence.consoleErrors.join('\n'));assert.deepEqual(evidence.failedRequests.filter(x=>!/^net::ERR_ABORTED$/.test(x.error||'')),[]);const clicks=await p.evaluate(()=>__r1121Clicks);for(const kind of ['28','99'])for(const id of ['r932EasyPlay','r932EasyStop','r920Next','r920Restart','r629DoneRepeat'])assert(clicks.some(x=>x.id===id&&x.trusted&&x.kind===kind),'trusted native control '+id+' in journey '+kind);report.evidence=evidence;return{clicks,servedFiles:Object.keys(evidence.served).length};});
 report.browser=f.browser.version();
}catch(error){report.fatal=error.stack||String(error);}finally{report.finishedAt=new Date().toISOString();if(f){report.evidence=report.evidence||f.evidence();await f.close();}save();console.log(JSON.stringify({passed:report.passed,total:report.total,allPassed:report.allPassed,fatal:report.fatal,output}));if(!report.allPassed)process.exitCode=1;}})();
