#!/usr/bin/env node
'use strict';
// Keep every r1120 native audio scenario/assertion. Await authored startup
// surfaces after reload and give the real-render integration timer a duration
// longer than its renderer deadline. No forced clicks or production mutation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),Module=require('node:module');
const historical=path.resolve(__dirname,'../r1120/audio-frequency-browser.cjs');
const original=fs.readFileSync(historical,'utf8');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const first=original.indexOf('async function prepare(page){');
const last=original.indexOf('\nasync function reset(values={})',first);
assert(first>=0&&last>first,'Exact historical preparation boundary');
const oldPrepare=original.slice(first,last);
const oldRoute="if(await p.locator('#dcClose').isVisible())await p.locator('#dcClose').click();await idle();await tap('.tab[data-t=\"frq\"]')";
assert.equal(oldPrepare.split(oldRoute).length-1,1,'Exactly one historical close-and-route sequence');
const newRoute=`
 const began=Date.now();
 // The daily card closes itself. During its opacity/visibility transition,
 // isVisible() can still be true after pointer-events has become none. Clicking
 // that fading button races its timer and can hit the footer behind it.
 // First await the independent logo intro, then the complete natural close.
 await p.waitForFunction(()=>{
  const intro=document.getElementById('sukun-auto-intro');
  if(!intro||intro.hidden)return true;
  const style=getComputedStyle(intro);
  return style.display==='none'||style.visibility==='hidden';
 },null,{timeout:20000});
 await p.waitForFunction(()=>{
  const card=document.getElementById('dailyCard');
  if(!card)return true;
  const style=getComputedStyle(card);
  return !card.classList.contains('daily-active')&&!card.classList.contains('fade-out-splash')&&
   (card.hidden||style.display==='none'||style.visibility==='hidden');
 },null,{timeout:15000});
 await idle();
 await p.locator('.tab[data-t="frq"]').waitFor({state:'visible',timeout:15000});
 await tap('.tab[data-t="frq"]');
 await p.waitForFunction(()=>{
  const tab=document.querySelector('.tab[data-t="frq"]'),panel=document.getElementById('tab-frq'),toggle=document.getElementById('frToggle');
  if(!tab?.classList.contains('act')||!panel||!toggle||panel.hidden)return false;
  const panelStyle=getComputedStyle(panel),style=getComputedStyle(toggle),box=toggle.getBoundingClientRect();
  return panelStyle.display!=='none'&&panelStyle.visibility!=='hidden'&&style.display!=='none'&&style.visibility!=='hidden'&&box.width>0&&box.height>0;
 },null,{timeout:15000});
 const ready=await p.evaluate(()=>({introPhase:document.getElementById('sukun-auto-intro')?.dataset.introPhase||null,dailyClass:document.getElementById('dailyCard')?.className||'',dailyVisibility:document.getElementById('dailyCard')?getComputedStyle(document.getElementById('dailyCard')).visibility:null,frequencyTabActive:!!document.querySelector('.tab[data-t="frq"].act'),frequencyPanelHidden:document.getElementById('tab-frq')?.hidden}));
 (report.readinessTransitions??=[]).push({url:p.url(),waitMilliseconds:Date.now()-began,method:'Observe natural intro/card completion, trusted tab click, await visible frequency controls',...ready});
`;
const prepare=oldPrepare.replace(oldRoute,newRoute);
let adapted=original.slice(0,first)+prepare+original.slice(last);
// First guard the readiness adaptation before the independently scoped timing
// adaptation below. No historical assertion or measurement threshold is removed.
assert.equal(adapted.slice(0,first),original.slice(0,first));
assert.equal(adapted.slice(first+prepare.length),original.slice(last));
// CI's native reload can outlast Playwright's default 10 s while all shipped
// assets finish loading. The fixture's first navigation already permits 60 s.
// Retain the real load event and the complete prepare/readiness checks after it.
const historicalReload="await p.reload({waitUntil:'load'});";
assert.equal(adapted.split(historicalReload).length-1,1,'One exact manual-set reload');
adapted=adapted.replace(historicalReload,"await p.reload({waitUntil:'load',timeout:60000});");
// This native 48-second loop is rendered while other acceptance groups run.
// The previous 15 s admission wait expired while the real renderer was still
// preparing. Keep all sweep ownership and PCM assertions, but allow the same
// bounded 30 s admission budget as the scenario's two other render waits.
// Keep the sweep active for 45 s so it cannot finish during that wait; the
// existing active-sweep, route-ownership and replacement assertions still apply.
const sweepName='Admitted ambience during a live sweep cannot mute the replacement static frequency while it prepares';
const sweepFirst=adapted.indexOf(" await check('"+sweepName+"',async()=>{");
const sweepLast=adapted.indexOf("\n await reset({mode:'mix'",sweepFirst);
assert(sweepFirst>=0&&sweepLast>sweepFirst,'Exact sweep integration scenario boundary');
const originalSweep=adapted.slice(sweepFirst,sweepLast);
const sweepWait='SukunBackgroundMix.snapshot().ready,null,{timeout:15000}';
assert.equal(originalSweep.split(sweepWait).length-1,1,'One sweep renderer admission budget');
const sweepDuration="p.locator('#sweepDur').fill('20')";
assert.equal(originalSweep.split(sweepDuration).length-1,1,'One sweep integration duration');
const adaptedSweep=originalSweep.replace(sweepWait,'SukunBackgroundMix.snapshot().ready,null,{timeout:30000}').replace(sweepDuration,"p.locator('#sweepDur').fill('45')");
assert.equal(adaptedSweep.replace('SukunBackgroundMix.snapshot().ready,null,{timeout:30000});const sweep=',sweepWait+');const sweep=').replace("p.locator('#sweepDur').fill('45')",sweepDuration),originalSweep,'All historical sweep assertions retained');
adapted=adapted.slice(0,sweepFirst)+adaptedSweep+adapted.slice(sweepLast);
const scenarioName='Unmodified background admission renders restored tools and timer transfer preserves only ambience';
const scenarioFirst=adapted.indexOf(" await check('"+scenarioName+"',async()=>{");
const scenarioLast=adapted.indexOf("\n await check('Exact served release resources",scenarioFirst);
assert(scenarioFirst>=0&&scenarioLast>scenarioFirst,'Exact timer integration scenario boundary');
const oldScenario=adapted.slice(scenarioFirst,scenarioLast);
let scenario=oldScenario;
const scenarioEdits=[];
function changeScenario(before,after,reason){
 assert.equal(scenario.split(before).length-1,1,'One scoped timing/diagnostic site: '+reason);
 scenario=scenario.replace(before,after);scenarioEdits.push({before,after,reason});
}
// The historical 9 s timer could expire during its permitted real render.
// A passing CI run had only 1.85 s remaining; the later failure had already
// stopped every frequency layer. Native admission took more than 20 s under
// concurrent CI rendering. Keep a bounded 30 s render deadline and require an
// active timer at admission, rather than accepting stopped/silent frequency.
changeScenario('controller.setTimer(.15)','controller.setTimer(.75);window.__r1121TimerTrace.sample("timer-armed")','45 s integration timer exceeds the bounded 30 s native admission budget');
changeScenario('SukunBackgroundMix.snapshot().ready,null,{timeout:20000});const ambienceOnly=','SukunBackgroundMix.snapshot().ready,null,{timeout:30000});const ambienceOnly=','Allow native render plus media admission within a bounded 30 s budget');
changeScenario("()=>!FR.playing&&!FR2.E&&!PINKE,null,{timeout:15000}","()=>!FR.playing&&!FR2.E&&!PINKE,null,{timeout:50000}",'Observe natural expiry of the same timer, with 5 s scheduler allowance');
changeScenario("const handoff=await state();","const handoff=await state();await p.evaluate(()=>window.__r1121TimerTrace.sample('live-handoff'));",'Record live handoff clock and gains');
changeScenario("const ambienceOnly=await state(),nativeAmbience=await p.evaluate(()=>SukunBackgroundMix.snapshot());","const ambienceOnly=await state(),nativeAmbience=await p.evaluate(()=>SukunBackgroundMix.snapshot());await p.evaluate(()=>window.__r1121TimerTrace.sample('ambience-admission-observed'));assert(ambienceOnly.playing&&ambienceOnly.timer?.remaining>0,'Timer must still be active when ambience admission is observed');",'Require active-timer precondition before unchanged positive-gain assertions');
changeScenario("const paused=await state();","const paused=await state();await p.evaluate(()=>window.__r1121TimerTrace.sample('paused'));",'Record suspension with native audio clock');
changeScenario("const held=await state();","const held=await state();await p.evaluate(()=>window.__r1121TimerTrace.sample('pause-held'));",'Record wall-time passage with held audio clock');
changeScenario("await p.waitForFunction(()=>ctx.state==='running');","await p.waitForFunction(()=>ctx.state==='running');const timerResume=await p.evaluate(()=>({armed:window.__r1121TimerTrace.armed,current:window.__r1121TimerTrace.sample('resumed')}));assert(Number.isFinite(timerResume.armed?.audioDeadlineSeconds),'Original timer has a finite audio deadline');assert.equal(timerResume.current.audioDeadlineSeconds,timerResume.armed.audioDeadlineSeconds,'Pause/resume preserves the original timer deadline');assert(timerResume.current.remainingMs>0,'The same timer remains active after resume');",'Require the original deadline after resume before waiting for natural expiry');
changeScenario("const after=await state(),nativeAfter=await p.evaluate(()=>SukunBackgroundMix.snapshot());","const after=await state(),nativeAfter=await p.evaluate(()=>SukunBackgroundMix.snapshot());await p.evaluate(()=>window.__r1121TimerTrace.sample('natural-expiry-observed'));assert.equal(after.timer,null,'Natural expiry clears the frequency timer');assert(after.time>=timerResume.armed.audioDeadlineSeconds,'Frequency ended only after the originally armed audio deadline');",'Prove completion follows the original audio deadline, not an unrelated early Stop');
const diagnosticsStart=`
  await p.evaluate(()=>{
   const rows=[];
   const sample=phase=>{
    const background=SukunBackgroundMix.snapshot(),timer=SukunFrequencyHubR1101.snapshot().timer;
    const row={phase,wallMs:Date.now(),monotonicMs:performance.now(),audioTimeSeconds:ctx?.currentTime??null,context:ctx?.state??null,audioDeadlineSeconds:Number.isFinite(FR._timerEnd)?FR._timerEnd:null,remainingMs:timer?.remaining??null,playing:!!FR.playing,main:FR.out?.gain.value??null,secondary:!!FR2.E,secondaryGain:FR2.out?.gain.value??null,pink:!!PINKE,pinkGain:PINKE?.out?.gain.value??null,ambience:Object.fromEntries(Object.entries(AMB).map(([id,value])=>[id,value.gain?.gain.value??null])),background:{state:background.state,reason:background.reason,ready:background.ready,playing:background.playing,mutedLive:background.mutedLive,preparing:background.preparing,metrics:background.metrics}};
    rows.push(row);
    if(phase==='timer-armed')window.__r1121TimerTrace.armed=row;
    if(rows.length>256)rows.splice(0,rows.length-256);
    return row;
   };
   const background=event=>sample('background:'+String(event.detail?.reason||''));
   const aggregate=event=>sample('aggregate:'+String(event.detail?.reason||''));
   window.addEventListener('sukun:backgroundmix',background);
   window.addEventListener('sukun:audioaggregatechange',aggregate);
   window.__r1121TimerTrace={sample,finish(){sample('scenario-finished');window.removeEventListener('sukun:backgroundmix',background);window.removeEventListener('sukun:audioaggregatechange',aggregate);return rows}};
   sample('scenario-started');
  });
  try {
`;
const diagnosticsEnd=`
  } finally {
   report.timerTransferDiagnostics={method:'Read-only, atomic browser samples of native audio time, wall time, timer deadline, gains and route events; retained on failure.',timerSeconds:45,rendererTimeoutMs:30000,naturalExpiryTimeoutMs:50000,rows:await p.evaluate(()=>{const trace=window.__r1121TimerTrace;try{return trace?.finish()||[]}finally{delete window.__r1121TimerTrace}})};
  }
`;
changeScenario("',async()=>{","',async()=>{"+diagnosticsStart,'Install read-only clock and lifecycle diagnostics');
changeScenario('\n });',diagnosticsEnd+'\n });','Persist diagnostics and remove listeners even after an assertion failure');
// Reversing the explicit substitution list must recover the entire original
// check byte-for-byte. All other check bodies and the 4.8 s fade test stay exact.
let recovered=scenario;
for(const edit of [...scenarioEdits].reverse()){
 assert.equal(recovered.split(edit.after).length-1,1,'One reversible adaptation: '+edit.reason);
 recovered=recovered.replace(edit.after,edit.before);
}
assert.equal(recovered,oldScenario,'Every historical assertion survives the explicit adaptation');
const beforeScenario=adapted.slice(0,scenarioFirst),afterScenario=adapted.slice(scenarioLast);
adapted=beforeScenario+scenario+afterScenario;
assert.equal(adapted.slice(0,scenarioFirst),beforeScenario);
assert.equal(adapted.slice(scenarioFirst+scenario.length),afterScenario);
const declaredChecks=(original.match(/await check\(/g)||[]).length;
assert.equal((adapted.match(/await check\(/g)||[]).length,declaredChecks);
const metadata={suite:'r1121 native frequency audio with awaited reload readiness',historicalTest:'tests/r1120/audio-frequency-browser.cjs',historicalTestSha256:hash(original),adaptedScenarioSha256:hash(adapted),wrapperTestSha256:hash(fs.readFileSync(__filename)),preparationAdaptation:{changedFunction:'prepare',changes:'Replace a visibility-only close click with observed natural startup completion and awaited active/visible frequency navigation.',checkBodiesUnchanged:false,allHistoricalAssertionsRetained:true,declaredCheckSites:declaredChecks,noForcedClicks:true,noDialogOrStyleMutation:true},sweepIntegrationAdaptation:{check:sweepName,originalScenarioSha256:hash(originalSweep),adaptedScenarioSha256:hash(adaptedSweep),historicalSweepSeconds:20,sweepSeconds:45,historicalAdmissionTimeoutMs:15000,admissionTimeoutMs:30000,allHistoricalAssertionsRetained:true},timerIntegrationAdaptation:{check:scenarioName,originalScenarioSha256:hash(oldScenario),adaptedScenarioSha256:hash(scenario),historicalTimerSeconds:9,timerSeconds:45,rendererTimeoutMs:30000,historicalExpiryTimeoutMs:15000,naturalExpiryTimeoutMs:50000,activeTimerPreconditionAdded:true,naturalExpiryRequired:true,shortTimerCaseUnchanged:true,otherCheckBodiesUnchangedExceptDocumentedSweepBudget:true,changes:scenarioEdits.map(({reason})=>reason)}};
const reportBoundary='let f,p;';
assert.equal(adapted.split(reportBoundary).length-1,1,'One report metadata boundary');
adapted=adapted.replace(reportBoundary,'Object.assign(report,'+JSON.stringify(metadata)+');\n'+reportBoundary);
if(process.argv.includes('--check-source')){
 new (require('node:vm').Script)(adapted,{filename:__filename});
 console.log(JSON.stringify({allPassed:true,passed:1,total:1,...metadata},null,2));
}else{
 const compiled=new Module(__filename,module);
 compiled.filename=__filename;compiled.paths=Module._nodeModulePaths(__dirname);
 compiled._compile(adapted,__filename);
}
