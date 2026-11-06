'use strict';
// Production CSS cascade, native theme/quality owners and real return events.
// Run after release SRI/nero synchronization; no stylesheet injection or mocks.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/sukun-r1227-saver');
fs.mkdirSync(output,{recursive:true});
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),results=[];
async function check(name,fn){try{const evidence=await fn();results.push({name,passed:true,evidence});console.log('PASS '+name)}catch(e){results.push({name,passed:false,error:e.stack});console.error('FAIL '+name+': '+e.message)}}
async function open(p){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());await p.waitForFunction(()=>window.SukunKandil.snapshot().on||window.SukunKandil.show());await p.waitForTimeout(150)}
// emulateMedia resolves when the browser accepts emulation, not when the app's
// matchMedia change listener has run its queued requestAnimationFrame(sync).
// Wait for the native policy's DOM output, never mutate it or suppress motion.
async function media(p,options){
 await p.emulateMedia(options);
 await p.waitForFunction(options=>{
  if(options.reducedMotion&&matchMedia('(prefers-reduced-motion: reduce)').matches!==(options.reducedMotion==='reduce'))return false;
  if(options.forcedColors&&matchMedia('(forced-colors: active)').matches!==(options.forcedColors==='active'))return false;
  const policy=SukunCinematic.snapshot();
  return document.documentElement.dataset.r1215Motion===(policy.hidden?'hidden':policy.effective)&&policy.reduced===matchMedia('(prefers-reduced-motion: reduce)').matches;
 },options);
}
async function quality(p,value){
 assert(await p.evaluate(value=>SukunCinematic.setQuality(value),value),'native quality change accepted');
 await p.waitForFunction(value=>{
  const policy=SukunCinematic.snapshot(),root=document.documentElement;
  return policy.profile===value&&root.dataset.r1215Quality===value&&root.dataset.r1215Motion===(policy.hidden?'hidden':policy.effective)&&document.getElementById('kandil').dataset.power===(value==='saving'?'saving':'premium');
 },value);
}
async function resetVisuals(p){await media(p,{forcedColors:'none',reducedMotion:'no-preference'});await quality(p,'cinematic')}
async function geometry(p){return p.evaluate(()=>{
 const k=document.getElementById('kandil'),b=document.getElementById('kandilWake'),g=document.getElementById('kandilSettingsButton'),s=getComputedStyle(b),f=getComputedStyle(k,'::before');
 const range=document.createRange();range.selectNodeContents(b);
 return {policy:{...SukunCinematic.snapshot(),renderedMotion:document.documentElement.dataset.r1215Motion,forcedColors:matchMedia('(forced-colors: active)').matches},frame:{position:f.position,inset:f.inset,border:f.borderTopWidth,color:f.borderTopColor,shadow:f.boxShadow,background:f.backgroundImage,pointer:f.pointerEvents,animation:f.animationName},button:{rect:b.getBoundingClientRect().toJSON(),text:[...range.getClientRects()].map(r=>r.toJSON()),source:s.borderImageSource,border:s.borderTopWidth,padding:s.padding,outline:s.outlineStyle,outlineWidth:s.outlineWidth,color:s.color,animation:s.animationName},gear:g.getBoundingClientRect().toJSON(),flameAnimation:getComputedStyle(k.querySelector('.kFlame')).animationName};
 })}
function layout(m,width,height){const b=m.button.rect;assert(b.width>=44&&b.height>=44,'44px return target');assert(b.left>=14&&b.right<=width-14&&b.top>=0&&b.bottom<=height-14,'return clear of outer rim');assert(b.right<=m.gear.left-3,'return and settings do not overlap');assert(m.gear.right<=width-14,'settings clear of frame');for(const t of m.button.text){assert(t.left>=b.left+24&&t.right<=b.right-24,'caption clear of gemstone end caps');assert(t.top>=b.top+10&&t.bottom<=b.bottom-10,'caption clear of gemstone rim')}assert.equal(m.frame.pointer,'none');assert.equal(m.frame.position,'fixed');assert.equal(m.frame.border,'2px')}
(async()=>{let f;try{
 for(const [width,height] of [[320,740],[393,852],[1280,800]]){
  f=await fixture(root,{width,height,voices:'tr',seed:{'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(build)}});const p=f.page;
  await p.waitForFunction(()=>window.SukunCinematic&&window.SukunSaverInfo&&window.SukunKandil);
  if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();
  await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());
  await p.locator('.tab[data-t="zkr"]').first().click();
  assert.equal(await p.evaluate(()=>KLT_AC('r1227-saver-disposable')),true);
  for(const theme of ['esma','berhet']){
   await p.evaluate(()=>SukunKandil.hide(false,false));
   assert((await p.evaluate(mode=>SukunSessionState.command('select',{mode,index:0,journeyKind:'single'}),theme)).accepted);
   await p.waitForFunction(mode=>document.documentElement.dataset.r1074Theme===mode,theme);
   await resetVisuals(p);
   await open(p);
   for(const content of ['simple','detailed'])await check(`${width} ${theme} ${content} frames`,async()=>{
    await p.locator(content==='simple'?'#r1213SaverSimple':'#r1213SaverDetailed').click();
    await p.keyboard.press('Tab');await p.locator('#kandilWake').focus();const m=await geometry(p);layout(m,width,height);
    assert.notEqual(m.frame.shadow,'none','gold rim visible');
    if(theme==='berhet'){assert(m.button.source.includes('gem-sapphire'),'sapphire artwork survives cascade');assert(m.frame.background.includes('radial-gradient'),'four gemstone corners survive')}
    else {assert.equal(m.button.source,'none');assert.equal(m.button.border,'2px')}
    assert.notEqual(m.button.outline,'none','keyboard focus visible');
    await p.locator('#kandil').screenshot({path:path.join(output,`${width}-${theme}-${content}.png`)});return m;
   });
   await check(`${width} ${theme} reduced motion and saving`,async()=>{
    try {
     await resetVisuals(p);
     await media(p,{reducedMotion:'reduce'});
     const reduced=await geometry(p);assert.equal(reduced.flameAnimation,'none');assert.equal(reduced.frame.animation,'none');
     // Test the saving owner independently of the reduced-motion preference.
     await media(p,{reducedMotion:'no-preference'});await quality(p,'saving');
     const saving=await geometry(p);assert.equal(saving.frame.shadow,'none');assert.equal(saving.frame.background,'none');assert.equal(saving.flameAnimation,'none');layout(saving,width,height);
     return {reduced,saving};
    } finally {await resetVisuals(p)}
   });
   await check(`${width} ${theme} forced colors`,async()=>{
    try {
     // Own this prerequisite even if an earlier assertion failed.
     await resetVisuals(p);await quality(p,'saving');await media(p,{forcedColors:'active'});
     assert.equal(await p.locator('#kandil').getAttribute('data-power'),'saving','exercise combined forced-colors and saving');
     const m=await geometry(p);const canvasText=await p.evaluate(()=>{const probe=document.createElement('span');probe.style.color='CanvasText';document.body.append(probe);const color=getComputedStyle(probe).color;probe.remove();return color});
     assert.equal(m.frame.color,canvasText,'saving frame uses opaque system CanvasText in forced colors');assert.equal(m.button.source,'none');assert.equal(m.frame.shadow,'none');assert.equal(m.frame.background,'none');assert.equal(m.button.border,'2px');return m;
    } finally {await resetVisuals(p)}
   });
   for(const action of ['click','Enter','Space'])await check(`${width} ${theme} return ${action}`,async()=>{
    await open(p);const before=await p.evaluate(()=>{const s=SukunSessionState.snapshot();return {mode:s.activeMode,index:s.activeIndex,count:s.count}});
    if(action==='click')await p.locator('#kandilWake').click();else{await p.locator('#kandilWake').focus();await p.keyboard.press(action)}
    await p.waitForFunction(()=>!SukunKandil.snapshot().on);
    assert.deepEqual(await p.evaluate(()=>{const s=SukunSessionState.snapshot();return {mode:s.activeMode,index:s.activeIndex,count:s.count}}),before,'return preserves session');return before;
   });
  }
  assert(!f.consoleErrors.some(x=>/integrity|digest/i.test(x)),'SRI prevents stylesheet load');
  await f.close();f=null;
 }
 }catch(e){results.push({name:'fixture',passed:false,error:e.stack})}finally{if(f)await f.close().catch(()=>{});const report={build,sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),passed:results.filter(r=>r.passed).length,total:results.length,results,limitations:['Headless Chromium; physical device and OS font scaling are not covered.']};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,total:report.total,output}));if(report.total!==42||report.passed!==report.total)process.exitCode=1}})();
