'use strict';
// Real production layout, real dock size controls and pointer hit testing.
// An isolated browser profile is used; no geometry or control is mocked.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1139-dock-page-access.json');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
process.env.CHROMIUM_PATH ||= chromium.executablePath();
const profiles=[{width:360,height:640},{width:393,height:852}];
const report={suite:'Midi/Max page and dock access',build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),expectedChecks:profiles.length*2,checks:[],limitations:['Headless Chromium with synthetic speech; no physical phone, screen reader or Android system UI claim.']};
let f,p;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total===report.expectedChecks&&report.passed===report.total&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function tap(selector){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());if(await p.locator('#kandil.on').isVisible())await p.locator('#kandil.on').click({position:{x:20,y:20}});await p.locator(selector).first().click();await p.waitForTimeout(200);}
// Scroll the real document until the chosen point sits in the strip above the
// dock. The test checks the browser's hit test before dispatching a real click.
async function pageTarget(selector,click){
 await p.evaluate(selector=>{const n=document.querySelector(selector),dock=document.querySelector('#r170Now');const r=n.getBoundingClientRect(),d=dock.getBoundingClientRect();const safe=Math.max(30,Math.min(innerHeight-30,d.top/2));window.scrollBy({top:r.top+r.height/2-safe,behavior:"instant"});},selector);
 await p.waitForTimeout(250);
 const g=await p.evaluate(selector=>{const n=document.querySelector(selector),r=n.getBoundingClientRect(),d=document.querySelector('#r170Now').getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,hit=document.elementFromPoint(x,y);return{rect:r.toJSON(),dock:d.toJSON(),x,y,hit:hit?.id||hit?.tagName,hitHTML:hit?.outerHTML?.slice(0,600)||null,hitAncestors:hit?[...function*(e){for(let i=0;e&&i<5;i++,e=e.parentElement)yield {tag:e.tagName,id:e.id,className:String(e.className||'').slice(0,120)}}(hit)]:[],pointStack:document.elementsFromPoint(x,y).slice(0,6).map(e=>({tag:e.tagName,id:e.id,className:String(e.className||'').slice(0,120)})),hitTarget:!!hit&&(hit===n||n.contains(hit)),disabled:!!n.disabled,phase:window.SukunSessionState?.snapshot?.()?.phase||null,gate:window.SukunCountCorrection?.status?.(1)||null,scrollY,viewport:{width:innerWidth,height:innerHeight}};},selector);
 assert(g.x>=0&&g.x<g.viewport.width&&g.y>=0&&g.y<g.viewport.height,'Target point is outside viewport '+selector+' '+JSON.stringify(g));
 assert(g.y<g.dock.top,'Target still covered by the dock '+selector+' '+JSON.stringify(g));
 assert(g.hitTarget,'Target not hittable at its center '+selector+' '+JSON.stringify(g));
 if(click){assert(!g.disabled,'Native target disabled '+selector+' '+JSON.stringify(g));await p.evaluate(selector=>{const n=document.querySelector(selector);window.__r1139Clicked=false;n.addEventListener('click',()=>{window.__r1139Clicked=true},{once:true});},selector);await p.mouse.click(g.x,g.y);assert(await p.evaluate(()=>window.__r1139Clicked),'Native click did not reach '+selector+' '+JSON.stringify(g));}
 return g;
}
(async()=>{try{
 for(const profile of profiles){
  const seed={'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(report.build)};
  f=await fixture(root,{...profile,voices:'tr',seed});p=f.page;
  await p.waitForFunction(()=>window.SukunSecretPolicy&&window.SukunDockSize&&window.SukunSessionState);
  if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();
  await tap('.tab[data-t="zkr"]');assert.equal(await p.evaluate(()=>KLT_AC('LABELLED-r1139-disposable-layout-profile')),true);
  assert.equal((await p.evaluate(()=>SukunSessionState.command('select',{mode:'berhet',index:8,journeyKind:'single'}))).accepted,true);
  await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet');await tap('#r932EasyPlay');await p.locator('#r170Now').waitFor({state:'visible'});
  for(const mode of ['midi','max']){
   try{
    // Exercise each mode first while the session is playing, then pause using
    // the real dock control before testing the intentionally disabled counter.
    if(await p.evaluate(()=>SukunSessionState.snapshot().phase==='PAUSED')){await tap('#r588Play');}
    await p.waitForFunction(()=>SukunSessionState.snapshot().phase==='PLAYING',null,{timeout:15000});
    await p.evaluate(m=>SukunDockSize.set(m,true),mode);await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>SukunDockSize.get()),mode);
    // Only the inner wordmark owns the jewel; the native draggable button
    // remains transparent so the two blue plates cannot overlap.
    const grip=await p.evaluate(()=>{const button=document.querySelector('#r633DockGrip'),plate=button.querySelector(':scope > span:first-child'),b=getComputedStyle(button),s=getComputedStyle(plate),r=plate.getBoundingClientRect();return{buttonBorder:b.borderImageSource,buttonImage:b.backgroundImage,buttonColor:b.backgroundColor,plateBorder:s.borderImageSource,plateRect:r.toJSON()};});
    assert.equal(grip.buttonBorder,'none','Grip must not paint a second jewel border');
    assert.equal(grip.buttonImage,'none','Grip must not paint a second background image');
    assert.match(grip.buttonColor,/^(transparent|rgba\(0,\s*0,\s*0,\s*0\))$/,'Grip background must be transparent');
    assert.match(grip.plateBorder,/gem-sapphire-r933\.webp/,'Wordmark retains its sapphire plate');
    assert(grip.plateRect.width>0&&grip.plateRect.height>0,'Wordmark plate must remain visible');
    const nav=await pageTarget('.tab[data-t="zkr"]',false);
    const playingCounter=await pageTarget('#r920Counter',false);
    await tap('#r588Play');
    await p.waitForFunction(()=>SukunSessionState.snapshot().phase==='PAUSED'&&!document.querySelector('#r920Counter')?.disabled&&SukunCountCorrection.status(1).allowed,null,{timeout:15000});
    await p.waitForTimeout(300);
    const before=await p.evaluate(()=>Z.total);
    const counter=await pageTarget('#r920Counter',true);
    await p.waitForFunction(before=>Z.total>before,before,{timeout:15000});
    const after=await p.evaluate(()=>Z.total);
    const plus=await pageTarget('#r920Plus',false);
    // Dock's own scroller is independent of page scrolling, and its volume
    // value must fit within the actual client box rather than under a scrollbar.
    await p.locator('#r920DockVolume').fill('1');await p.waitForTimeout(100);
    const dock=await p.evaluate(()=>{const body=document.querySelector('#r659DockBody'),output=document.querySelector('#r920DockVolumeValue'),input=document.querySelector('#r920DockVolume'),footer=document.querySelector('#r588DockShell>.r588Mode');body.scrollTop=body.scrollHeight;const b=body.getBoundingClientRect(),v=output.getBoundingClientRect(),s=input.getBoundingClientRect(),ft=footer.getBoundingClientRect();return{body:b.toJSON(),clientLeft:body.clientLeft,clientWidth:body.clientWidth,paddingRight:parseFloat(getComputedStyle(body).paddingRight)||0,clientHeight:body.clientHeight,scrollHeight:body.scrollHeight,scrollTop:body.scrollTop,output:v.toJSON(),slider:s.toJSON(),footer:ft.toJSON(),value:output.textContent};});
    assert.match(dock.value,/100\s*%|%\s*100/,'Volume output must show 100% '+JSON.stringify(dock));
    assert(dock.output.right<=dock.body.left+dock.clientLeft+dock.clientWidth-dock.paddingRight+1,'Volume value under scroll gutter '+JSON.stringify(dock));
    assert(dock.slider.right<=dock.output.left+1,'Slider overlaps percentage '+JSON.stringify(dock));
    assert(dock.body.bottom<=dock.footer.top+1,'Dock body overlaps footer '+JSON.stringify(dock));
    assert(dock.scrollHeight<=dock.clientHeight+2||dock.scrollTop>0,'Scrollable dock did not scroll '+JSON.stringify(dock));
    report.checks.push({profile,mode,passed:true,grip,nav,playingCounter,counter,before,after,plus,dock});
   }catch(error){report.checks.push({profile,mode,passed:false,error:error.stack||String(error)});}
   save();console.log(JSON.stringify({profile,mode,passed:report.checks.at(-1).passed}));
  }
  await f.close();f=p=null;
 }
}catch(error){report.fatal=error.stack||String(error)}finally{if(f)await f.close().catch(()=>{});save();console.log(JSON.stringify({passed:report.passed,total:report.total,allPassed:report.allPassed,fatal:report.fatal,output}));if(!report.allPassed)process.exitCode=1;}})();
