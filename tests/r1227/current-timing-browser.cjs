'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/sukun-current-timing');fs.mkdirSync(out,{recursive:true});
const report={build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sources:Object.fromEntries(['index.html','nero.html','assets/runtime/current-timing-r1227.js','assets/runtime/current-timing-r1227.css'].map(file=>[file,hash(fs.readFileSync(path.join(root,file)))])),expectedChecks:2,checks:[],allPassed:false};
(async()=>{let f,current;try{
 for(const mode of ['esma','berhet']){
  current={mode,passed:false};report.checks.push(current);
  f=await fixture(root,{width:390,height:844,hasTouch:true,seed:{'sukun.onboardSeen':'1'}});const p=f.page;
  if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();
  await p.locator('.tab[data-t="zkr"]').first().click();await p.evaluate(()=>KLT_AC('current-timing-disposable-test'));
  assert(await p.evaluate(()=>!!window.SukunCurrentTiming),'Production shell must link timing module');
  const crypto=require('node:crypto');
  for(const ext of ['js','css']){const file='assets/runtime/current-timing-r1227.'+ext,selector=ext==='js'?`script[src*="${file}"]`:`link[href*="${file}"]`;const tag=p.locator(selector);assert.equal(await tag.count(),1);assert.equal(await tag.getAttribute('integrity'),'sha256-'+crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('base64'));}
  const index=await p.evaluate(mode=>{const t=SukunTimingInfo.snapshot();return mode==='esma'?ZIKIR.esma.items.findIndex(i=>i.t===t.day.names[0]):t.period.index;},mode);
  current.nativeIndex=index;
  assert((await p.evaluate(({mode,index})=>SukunSessionState.command('select',{mode,index,journeyKind:'single'}),{mode,index})).accepted);
  await p.waitForFunction(()=>!document.getElementById('r1227CurrentTiming').hidden);
  await p.locator('#r1227TimingSeal').scrollIntoViewIfNeeded();
  assert((await p.locator('#r1227CurrentTiming').getAttribute('data-matches')).includes(mode==='esma'?'day':'period'));
  current.matching=await p.evaluate(()=>({theme:document.documentElement.dataset.r1074Theme,activeName:document.getElementById('r920ActiveName').textContent,matches:document.getElementById('r1227CurrentTiming').dataset.matches,label:document.getElementById('r1227TimingCaption').textContent,accessibleLabel:document.getElementById('r1227TimingSeal').getAttribute('aria-label'),source:document.getElementById('r1227TimingSeal').title}));
  const before=await p.evaluate(()=>{const s=SukunSessionState.peek();return {count:s.count,index:s.activeIndex,playing:s.playing,media:__r1064SpeechFixture.snapshot().mediaLog.length};});
  const box=await p.locator('#r1227CurrentTiming').boundingBox();assert(box.x>=0&&box.x+box.width<=391);
  await p.locator('#r1227TimingSeal').click();assert.equal(await p.locator('#r1227CurrentTiming').getAttribute('data-reveal'),'true');
  await p.locator('#r1227TimingSeal').blur();await p.mouse.move(0,0);await p.waitForTimeout(4800);
  assert.equal(await p.locator('#r1227CurrentTiming').getAttribute('data-reveal'),'false');
  current.geometryBefore=box;
  const box2=await p.locator('#r1227CurrentTiming').boundingBox();assert.equal(box.height,box2.height);current.geometryAfter=box2;
  await p.locator('#r1227TimingSeal').focus();assert.equal(await p.locator('#r1227CurrentTiming').getAttribute('data-reveal'),'true');
  await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('#r1227TimingCaption').evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
  const after=await p.evaluate(()=>{const s=SukunSessionState.peek();return {count:s.count,index:s.activeIndex,playing:s.playing,media:__r1064SpeechFixture.snapshot().mediaLog.length};});assert.deepEqual(after,before);current.stateBefore=before;current.stateAfter=after;
  await p.screenshot({path:path.join(out,mode+'.png')});
  await p.evaluate(()=>SukunCurrentTiming.render(new Date(Date.now()+65000)));assert.equal(await p.locator('#r1227CurrentTiming').getAttribute('data-reveal'),'true');
  const unmatched=await p.evaluate(mode=>{const s=SukunSessionState.peek(),t=SukunTimingInfo.snapshot();return ZIKIR[mode].items.findIndex((it,i)=>!SukunCurrentTiming.matches({...s,activeIndex:i},t,it,true).length);},mode);
  assert((await p.evaluate(({mode,index})=>SukunSessionState.command('select',{mode,index,journeyKind:'single'}),{mode,index:unmatched})).accepted);
  await p.waitForFunction(()=>document.getElementById('r1227CurrentTiming').hidden);
  current.unmatchedIndex=unmatched;current.passed=true;current.evidence=f.evidence();current.screenshot=mode+'.png';
  console.log('PASS '+mode+': native timing match, unmatched hide, touch/focus, quiet expiry, stable geometry, reduced motion, 60-second recurrence, no count/audio side effects');
  await f.close();f=null;
 }
}catch(e){report.fatal=e.stack||String(e);if(current){current.error=report.fatal;if(f)current.evidence=f.evidence();}console.error(e);process.exitCode=1;}finally{if(f)await f.close().catch(e=>{report.fatal=report.fatal||e.stack||String(e);process.exitCode=1;});report.allPassed=!report.fatal&&report.checks.length===report.expectedChecks&&report.checks.every(c=>c.passed);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}})();
