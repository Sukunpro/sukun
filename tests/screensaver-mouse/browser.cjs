'use strict';
// Exact production shell, native Chromium input and a clock installed before
// navigation. Only the fixture's synthetic speech/data and elapsed time are controlled.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const requested=path.resolve(process.argv[3]||'/tmp/sukun-saver-mouse');
const output=requested.endsWith('.json')?path.dirname(requested):requested,reportPath=requested.endsWith('.json')?requested:path.join(output,'report.json');
fs.mkdirSync(output,{recursive:true});
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),results=[],browserEvidence=[];
async function check(name,fn){try{results.push({name,passed:true,evidence:await fn()});console.log('PASS '+name)}catch(error){results.push({name,passed:false,error:error.stack});throw error}}
async function nativePage(f){
 // The shared fixture performs its standard startup probe first. Close it so
 // only one owner remains, then install the clock before any app timers exist.
 await f.page.close();const p=await f.context.newPage();p.setDefaultTimeout(10000);p.setDefaultNavigationTimeout(60000);
 p.on('pageerror',e=>f.errors.push(e.stack||e.message));p.on('console',m=>{if(m.type()==='error')f.consoleErrors.push(m.text())});
 await p.clock.install({time:new Date('2026-11-09T12:00:00Z')});
 await p.goto(f.origin+'/nero.html',{waitUntil:'load'});
 await p.waitForFunction(()=>window.SukunKandil&&window.SukunSessionState);
 await p.waitForTimeout(2500);
 if(await p.locator('#obSkip').isVisible())await p.locator('#obSkip').click();
 await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());
 const dailyCard=p.locator('#dailyCard');
 if(await dailyCard.isVisible()){
  try{await p.locator('#dcClose').click()}
  catch(error){
   // Startup may dismiss this optional card while the native click waits.
   // A card that remains visible, or any non-timeout error, still fails setup.
   if(error.name!=='TimeoutError'||await dailyCard.isVisible())throw error;
  }
 }
 await dailyCard.waitFor({state:'hidden'});
 await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());
 await p.evaluate(()=>{
  window.__saverMouseEvents=[];
  for(const type of ['mousemove','touchstart','keydown','click'])document.addEventListener(type,e=>window.__saverMouseEvents.push({type,trusted:e.isTrusted,x:e.clientX,y:e.clientY,key:e.key}),{capture:true,passive:true});
 });
 const clockTime=await p.evaluate(()=>Date.now());await p.clock.pauseAt(clockTime+1000);
 return p;
}
async function snapshot(p){return p.evaluate(()=>SukunKandil.snapshot())}
async function arm(p,mode='1m'){assert(await p.evaluate(mode=>SukunKandil.setMode(mode,false),mode));assert.equal((await snapshot(p)).on,false)}
async function visible(p){return p.locator('#kandil').evaluate(el=>el.classList.contains('on')&&el.getAttribute('aria-hidden')==='false')}
(async()=>{let f;try{
 f=await fixture(root,{width:1280,height:800,voices:'tr',seed:{'sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(build)}});
 let p=await nativePage(f);
 await check('desktop real mouse activity spans the old deadline and starts a complete new idle interval',async()=>{
  const before=await p.evaluate(()=>({session:SukunSessionState.snapshot()}));
  await arm(p);await p.mouse.move(45,45);await p.clock.fastForward(59000);await p.mouse.move(85,45);await p.clock.fastForward(1000);assert.equal(await visible(p),false,'old deadline must not open the saver');
  for(let i=0;i<3;i++){await p.clock.fastForward(30000);await p.mouse.move(90+i*10,45);assert.equal(await visible(p),false)}
  await p.clock.fastForward(59999);assert.equal(await visible(p),false);await p.clock.fastForward(1);assert.equal(await visible(p),true,'full quiet interval opens saver');
  const nativeMoves=await p.evaluate(()=>__saverMouseEvents.filter(e=>e.type==='mousemove'));assert(nativeMoves.length>=5&&nativeMoves.every(e=>e.trusted));
  const after=await p.evaluate(()=>SukunSessionState.snapshot());for(const key of ['activeMode','activeIndex','count','target','playing','paused'])assert.deepEqual(after[key],before.session[key]);return {nativeMoves,before:before.session,after};
 });
 await check('moving on the open saver reveals settings without dismissal; explicit return and focus work',async()=>{
  await p.mouse.move(140,70);assert.equal(await visible(p),true);assert(await p.locator('#kandil').evaluate(el=>el.classList.contains('k-settings-active')));
  await p.locator('#kandilWake').focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>!!document.activeElement.closest('#kandil')),true);
  await p.keyboard.press('Escape');assert.equal(await visible(p),false);
  const focus=await p.evaluate(()=>document.activeElement.id);await arm(p);assert(await p.evaluate(()=>SukunKandil.show()));const button=await p.locator('#kandilWake').boundingBox();assert(button);await p.mouse.click(button.x+button.width/2,button.y+button.height/2);assert.equal(await visible(p),false);return {restoredFocus:focus};
 });
 await check('scripted and same-position mouse events do not reset desktop idle',async()=>{
  await arm(p);await p.mouse.move(230,75);await p.clock.fastForward(59000);
  await p.evaluate(()=>document.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:400,clientY:100})));await p.mouse.move(230,75);
  await p.clock.fastForward(1000);assert.equal(await visible(p),true);return {on:(await snapshot(p)).on};
 });
 await check('five-minute preference and off remain respected after native mouse activity',async()=>{
  await arm(p,'5m');await p.mouse.move(250,75);await p.clock.fastForward(299000);await p.mouse.move(260,75);await p.clock.fastForward(1000);assert.equal(await visible(p),false);await p.clock.fastForward(299000);assert.equal(await visible(p),true);
  await arm(p,'off');await p.mouse.move(280,75);await p.clock.fastForward(360000);assert.equal(await visible(p),false);assert.equal((await snapshot(p)).timerPending,false);
 });
 browserEvidence.push(f.evidence());await f.close();f=null;
 f=await fixture(root,{width:393,height:852,hasTouch:true,voices:'tr',seed:{'sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(build)}});p=await nativePage(f);
 await check('mobile touch still postpones idle; saver remains modal and explicit tap return works',async()=>{
  await arm(p);await p.clock.fastForward(59000);await p.touchscreen.tap(8,250);await p.clock.fastForward(1000);assert.equal(await visible(p),false);await p.clock.fastForward(59000);assert.equal(await visible(p),true);
  await p.touchscreen.tap(8,250);assert.equal(await visible(p),true,'ordinary tap does not leak through or dismiss');assert(await p.locator('#kandil').evaluate(el=>el.classList.contains('k-settings-active')));
  const rect=await p.locator('#kandilWake').boundingBox();assert(rect&&rect.width>=44&&rect.height>=44);await p.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);assert.equal(await visible(p),false);
  const touches=await p.evaluate(()=>__saverMouseEvents.filter(e=>e.type==='touchstart'));assert(touches.length>=3&&touches.every(e=>e.trusted));return {touches:touches.length,returnTarget:rect};
 });
 }catch(error){console.error(error);if(!results.some(r=>!r.passed))results.push({name:'fixture',passed:false,error:error.stack})}
 finally{if(f){browserEvidence.push(f.evidence());await f.close().catch(()=>{})}const report={build,sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),passed:results.filter(r=>r.passed).length,total:results.length,results,browserEvidence,limitations:['Headless Linux Chromium with native browser mouse/keyboard/touch input and controlled time; not physical desktop/Android/iOS hardware.','The release metadata must be finalized together with the next release before full offline/upgrade acceptance.']};fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,total:report.total,reportPath}));if(report.total!==5||report.passed!==report.total)process.exit(1)}
})();
