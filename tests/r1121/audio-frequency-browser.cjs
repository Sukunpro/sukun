#!/usr/bin/env node
'use strict';
// Keep every r1120 native audio scenario/assertion, but wait for the authored
// startup surfaces before navigating after reload. This does not hide a dialog,
// force a click, alter production CSS/state or weaken an audio assertion.
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
// Guard scope mechanically: only the preparation function is replaced; all
// native check bodies, measurement thresholds, defaults and source checks stay.
assert.equal(adapted.slice(0,first),original.slice(0,first));
assert.equal(adapted.slice(first+prepare.length),original.slice(last));
const declaredChecks=(original.match(/await check\(/g)||[]).length;
assert.equal((adapted.match(/await check\(/g)||[]).length,declaredChecks);
const metadata={suite:'r1121 native frequency audio with awaited reload readiness',historicalTest:'tests/r1120/audio-frequency-browser.cjs',historicalTestSha256:hash(original),adaptedScenarioSha256:hash(adapted),wrapperTestSha256:hash(fs.readFileSync(__filename)),preparationAdaptation:{changedFunction:'prepare',changes:'Replace a visibility-only close click with observed natural startup completion and awaited active/visible frequency navigation.',checkBodiesUnchanged:true,declaredCheckSites:declaredChecks,noForcedClicks:true,noDialogOrStyleMutation:true}};
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
