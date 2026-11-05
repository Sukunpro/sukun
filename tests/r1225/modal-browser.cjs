'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {fixture}=require('../r1064/browser-fixture.cjs');
(async()=>{let f;try{
 f=await fixture(path.resolve(__dirname,'../..'),{seed:{'sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0'}});
 const p=f.page;
 await p.evaluate(()=>{document.querySelector('#dailyCard')?.setAttribute('hidden','');window.SukunSheetAuthority.closeAll();document.querySelector('#hybridOpen').focus();hybridOpen()});
 await p.waitForFunction(()=>SukunSheetAuthority.top()==='hybridSheet');
 assert.equal(await p.evaluate(()=>document.querySelector('#hybridSheet').contains(document.activeElement)),true,'focus enters hybrid');
 for(const key of ['Tab','Shift+Tab'])for(let i=0;i<15;i++){
  await p.keyboard.press(key);assert.equal(await p.evaluate(()=>document.querySelector('#hybridSheet').contains(document.activeElement)),true,key+' trapped');
 }
 await p.keyboard.press('Escape');
 assert.equal(await p.locator('#hybridSheet').evaluate(el=>el.hidden),true);
 assert.equal(await p.evaluate(()=>document.activeElement.id),'hybridOpen');
 await p.evaluate(()=>hybridOpen());await p.locator('#hybridClose').click();
 assert.equal(await p.evaluate(()=>document.activeElement.id),'hybridOpen');
 for(const id of ['ruyaSheet','haySheet','virdSheet','fatSheet','yksSheet'])assert.ok(await p.locator('#'+id).evaluate(el=>document.getElementById(el.getAttribute('aria-labelledby'))?.textContent.trim()));
 console.log('PASS: real Chromium hybrid focus, 30 Tab/Shift+Tab transitions, Escape, close-button focus restore, five labels');
 }finally{if(f)await f.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
