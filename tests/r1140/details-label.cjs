'use strict';
// Full production page, real ambience preset and pointer input in headless Chromium.
// Synthetic speech and disposable local browser profile only. No physical phone/audio claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1140-details-label.json');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
process.env.CHROMIUM_PATH ||= chromium.executablePath();
const widths=[360,393],langs=['tr','en'],checks=[];
const report={suite:'Actual mini-player active-layer details label',build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),expectedChecks:widths.length*langs.length,checks,limitations:['Full production page and native browser pointer input in headless Chromium; no physical phone or audible-output claim.']};
function save(){report.total=checks.length;report.passed=checks.filter(x=>x.passed).length;report.allPassed=report.total===report.expectedChecks&&report.passed===report.total&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function tap(p,selector){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());if(await p.locator('#kandil.on').isVisible())await p.locator('#kandil.on').click({position:{x:20,y:20}});await p.locator(selector).first().click();await p.waitForTimeout(200);}
function intersects(a,b){return a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1}
(async()=>{let f;try{
 for(const width of widths){
  const seed={'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(report.build)};
  f=await fixture(root,{width,height:852,voices:'tr',seed});const p=f.page;
  if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();
  await tap(p,'.tab[data-t="zkr"]');assert.equal(await p.evaluate(()=>KLT_AC('LABELLED-r1140-disposable-layout-profile')),true);
  assert.equal((await p.evaluate(()=>SukunSessionState.command('select',{mode:'berhet',index:8,journeyKind:'single'}))).accepted,true);
  await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet');await tap(p,'.tab[data-t="amb"]');
  // The real Seher preset starts several ambience channels and a frequency.
  await tap(p,'#sessRow [data-sess="0"]');
  await p.waitForFunction(()=>SukunActiveSource.read().background&&SukunActiveSource.read().layers.length>=4,null,{timeout:20000});
  await p.evaluate(()=>SukunDockSize.set('mini',true));await p.locator('#r170Now').waitFor({state:'visible'});
  for(const lang of langs){try{
   await p.evaluate(lang=>I18N.set(lang),lang);await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());
   const hint=p.locator('#r1061LayersHint');await hint.waitFor({state:'visible',timeout:15000});await p.waitForTimeout(250);
   const data=await p.evaluate(()=>{const hint=document.getElementById('r1061LayersHint'),name=document.getElementById('r921DockName'),container=hint.closest('.r588Text'),h=hint.getBoundingClientRect(),nameRect=name.getBoundingClientRect(),box=container.getBoundingClientRect(),s=getComputedStyle(hint);const x=h.left+h.width/2,y=h.top+h.height/2,hit=document.elementFromPoint(x,y);const ids=['r633DockGrip','r730MiniTef','r588Play','r588Hide'];return{text:hint.textContent,rect:h.toJSON(),name:nameRect.toJSON(),container:box.toJSON(),lineHeight:parseFloat(s.lineHeight),clientWidth:hint.clientWidth,scrollWidth:hint.scrollWidth,hit:hit?.id||hit?.tagName,hitTarget:hit===hint||hint.contains(hit),controls:ids.map(id=>{const n=document.getElementById(id),r=n?.getBoundingClientRect();return{id,visible:!!n&&r.width>0&&r.height>0&&getComputedStyle(n).visibility!=='hidden'&&getComputedStyle(n).display!=='none',rect:r?.toJSON()}}),layers:SukunActiveSource.read().layers,viewport:{width:innerWidth,height:innerHeight}}});
   assert.equal(data.text,lang==='tr'?'Detaylar':'Details');assert(data.rect.width>0&&data.rect.height>0,'hint must be visible');
   assert(data.rect.left>=0&&data.rect.right<=data.viewport.width+1&&data.rect.top>=0&&data.rect.bottom<=data.viewport.height+1,'hint must fit viewport '+JSON.stringify(data));
   assert(data.rect.left>=data.container.left-1&&data.rect.right<=data.container.right+1&&data.rect.bottom<=data.container.bottom+1,'hint must fit its text lane '+JSON.stringify(data));
   assert(data.scrollWidth<=data.clientWidth+1,'short label must not be clipped horizontally');
   assert(!intersects(data.rect,data.name),'hint overlaps playing names '+JSON.stringify(data));
   for(const c of data.controls)if(c.visible)assert(!intersects(data.rect,c.rect),'hint overlaps '+c.id+' '+JSON.stringify(data));
   assert(data.hitTarget,'hint center must receive native pointer '+JSON.stringify(data));
   await hint.click();const popup=p.locator('#r1061ActiveLayersPopup');await popup.waitFor({state:'visible'});
   // Locale changes asynchronously refresh both source names and popup. Wait
   // for the current authoritative model and visible list to converge, rather
   // than comparing a pre-refresh snapshot with the refreshed translations.
   await p.waitForFunction(lang=>{const current=SukunActiveSource.read().layers;const shown=[...document.querySelectorAll('#r1061ActiveLayersList>li')].map(n=>n.textContent);return I18N.lang===lang&&current.length>=4&&JSON.stringify(current)===JSON.stringify(shown)&&current.some(x=>(lang==='en'?/Birdsong/i:/Kuş Cıvıltıları/i).test(x));},lang,{timeout:15000});
   const current=await p.evaluate(()=>SukunActiveSource.read().layers);const shown=await p.locator('#r1061ActiveLayersList>li').allTextContents();
   assert(current.length>=4,'expected real preset frequency and ambience items');assert.deepEqual(shown,current,'click opens the complete current source list in order');
   assert(current.some(x=>(lang==='en'?/Birdsong/i:/Kuş Cıvıltıları/i).test(x)),'source names match active language');
   await p.locator('#r1061ActiveLayersClose').click();assert.equal(await popup.isVisible(),false);
   checks.push({width,lang,passed:true,evidence:{...data,currentLayers:current}});
  }catch(error){checks.push({width,lang,passed:false,error:error.stack||String(error)});}finally{save();}}
  await f.close();f=null;
 }
}catch(error){report.fatal=error.stack||String(error)}finally{if(f)await f.close().catch(()=>{});save();console.log(JSON.stringify({passed:report.passed,total:report.total,allPassed:report.allPassed,fatal:report.fatal,output}));if(!report.allPassed)process.exitCode=1;}})();
