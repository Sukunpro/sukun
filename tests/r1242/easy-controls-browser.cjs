'use strict';
// Byte-for-byte native app. Synthetic disposable selection, never user storage.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),out=path.resolve(process.argv[3]||'/tmp/sukun-r1242-controls');fs.mkdirSync(out,{recursive:true});
const results=[];let f;
const snapshot=()=>{const s=window.SukunSessionState.snapshot();return{mode:s.activeMode,index:s.activeIndex,count:s.count,target:s.target,playing:s.playing,paused:s.paused}};
async function select(p,mode){await p.evaluate(async mode=>{window.KLT_AC('LABELLED-r1242-disposable-profile');await window.SukunTabOwner.run('manual',async()=>{const r=await window.SukunSessionState.command('select',{mode,index:9,journeyKind:mode==='berhet'?'28':'99'});if(!r.accepted)throw Error('Fixture selection rejected');},{prime:false,releaseAfter:true});window.SukunFriendlyUI.go('zikir');window.SukunPracticeUI.refresh();},mode);await p.waitForTimeout(350);}
async function paint(p,mode,forced=false){const r=await p.locator('#r1056FocusControlsToggle').evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{text:el.textContent,theme:document.documentElement.dataset.r1074Theme,image:s.borderImageSource,background:s.backgroundColor,width:r.width,height:r.height,scroll:el.scrollWidth,client:el.clientWidth,viewport:innerWidth,pageWidth:document.documentElement.scrollWidth}});assert(r.height>=44&&r.width>=44,JSON.stringify(r));assert(r.scroll<=r.client+1,JSON.stringify(r));assert(r.pageWidth<=r.viewport+1,JSON.stringify(r));if(mode==='berhet')assert.equal(r.theme,'berhet');if(mode==='berhet'&&!forced){assert.match(r.image,/gem-diamond\.webp/);assert.equal(r.background,'rgba(0, 0, 0, 0)');}else if(!forced){assert.notEqual(r.theme,'berhet');assert.equal(r.image,'none');assert.equal(r.background,'rgba(8, 44, 53, 0.863)');}return r;}
(async()=>{try{
 f=await fixture(root,{width:393,height:1050,seed:{'sukun.ui.shellMode':'classic','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0'}});const p=f.page;
 for(const mode of ['berhet','esma','berhet']){
  await select(p,mode);
  for(const width of [320,393,1440])for(const lang of ['tr','en']){
   await p.setViewportSize({width,height:1050});await p.evaluate(lang=>window.I18N.set(lang),lang);await p.waitForTimeout(120);
   const before=await p.evaluate(snapshot),button=p.locator('#r1056FocusControlsToggle');
   for(const focus of [false,true]){
    if(focus){await p.locator('#r920TefEnter').click();await p.waitForFunction(()=>document.body.classList.contains('sukun-tefekkur-mode'));}
    await p.evaluate(()=>window.SukunBerhetLayout.setFocusControls(true));await p.waitForTimeout(100);
    for(let i=0;i<2;i++){
     const shown=await button.getAttribute('aria-expanded');assert.equal(shown,i===0?'true':'false');assert.equal(await p.locator('#r932EasyPlay').isVisible(),i===0);
     results.push({mode,width,lang,focus,shown,paint:await paint(p,mode)});await button.click();await p.waitForTimeout(100);
    }
    if(width===393&&lang==='tr')await p.screenshot({path:path.join(out,`${mode}-${focus?'focus':'normal'}.png`),fullPage:true});
    if(focus)await p.locator('#r920TefExit').click();
   }
   assert.deepEqual(await p.evaluate(snapshot),before,'Visibility controls must preserve selection, count and playback');
  }
 }
 await p.setViewportSize({width:393,height:1050});await p.emulateMedia({forcedColors:'active'});await p.waitForTimeout(100);const forced=await paint(p,'berhet',true);assert.equal(forced.image,'none');results.push({forcedColors:true,paint:forced});
 await p.emulateMedia({forcedColors:'none'});await p.locator('#r1056FocusControlsToggle').focus();assert(await p.locator('#r1056FocusControlsToggle').evaluate(el=>el===document.activeElement));
 const expanded=await p.locator('#r1056FocusControlsToggle').getAttribute('aria-expanded');await p.keyboard.press('Enter');await p.waitForTimeout(150);assert.notEqual(await p.locator('#r1056FocusControlsToggle').getAttribute('aria-expanded'),expanded);
 await p.reload();await p.waitForTimeout(2400);await p.evaluate(()=>{window.SukunFriendlyUI.go('zikir');window.SukunPracticeUI.refresh()});await p.waitForTimeout(200);assert.equal(await p.locator('#r1056FocusControlsToggle').getAttribute('aria-expanded'),expanded==='true'?'false':'true');await paint(p,'berhet');
 assert.deepEqual(f.errors,[]);assert(!f.consoleErrors.some(x=>/integrity|digest|Content Security Policy/i.test(x)),JSON.stringify(f.consoleErrors));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:true,results,sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),evidence:f.evidence(),limitations:['Linux Chromium with synthetic local state; not physical-device or audible-audio acceptance.']},null,2));console.log('PASS r1242 theme, mobile/desktop, TR/EN, normal/focus, repeated toggle, keyboard, forced colors and reload persistence '+results.length+' checks');
}catch(error){fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:false,results,error:error.stack,evidence:f?.evidence()},null,2));throw error}finally{await f?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
