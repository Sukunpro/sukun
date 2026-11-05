'use strict';
// Native dialog/keyboard regression against the shipped DOM and styles.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/sukun-atlas-keyboard');fs.mkdirSync(output,{recursive:true});
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),results=[];
(async()=>{let f;try{
 for(const width of [390,1024]){
  f=await fixture(root,{width,height:900,voices:'tr',seed:{'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(build)}});
  const p=f.page;await p.waitForFunction(()=>window.SukunSecretPolicy&&window.SukunSessionState&&window.SukunPracticeUI);
  if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();
  await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());
  await p.locator('.tab[data-t="zkr"]').click();assert.equal(await p.evaluate(()=>KLT_AC('atlas-keyboard-disposable-profile')),true);
  for(const mode of ['esma','berhet']){
   const before=await p.evaluate(async mode=>{const result=await SukunSessionState.command('select',{mode,index:0,journeyKind:'single'});if(!result.accepted)throw Error('Cannot select '+mode);return SukunSessionState.snapshot()},mode);
   await p.locator('#r920AtlasOpen').click();await p.waitForFunction(()=>document.querySelector('#r920Atlas').open);
   const cards=p.locator('#r920AtlasNodes button:not([hidden])');assert.equal(await cards.count(),mode==='esma'?99:28);
   assert.equal(await p.locator('#r920AtlasNodes button[tabindex="0"]').count(),1);
   await p.locator('#r1215AtlasFilter').focus();
   await p.keyboard.press('Tab');
   const initial=await p.evaluate(()=>document.activeElement?.dataset.index);assert.equal(initial,'0');
   await p.keyboard.press('ArrowDown');
   const next=await p.evaluate(()=>({index:document.activeElement?.dataset.index,columns:getComputedStyle(document.querySelector('#r920AtlasNodes')).gridTemplateColumns.split(' ').length}));assert.equal(Number(next.index),next.columns);
   await p.keyboard.press('End');assert.equal(await p.evaluate(()=>document.activeElement?.dataset.index),mode==='esma'?'98':'27');
   await p.keyboard.press('Home');assert.equal(await p.evaluate(()=>document.activeElement?.dataset.index),'0');
   await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>document.activeElement?.dataset.index),'1');
   await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement?.id),'r920AtlasChoose','one Tab from cards reaches the action');
   const name=(await cards.nth(1).locator('.r1215AtlasName').textContent()).trim();await p.locator('#r1215AtlasSearch').fill(name);
   assert.equal(await p.locator('#r920AtlasNodes button:not([hidden])[tabindex="0"]').count(),1);
   const after=await p.evaluate(()=>SukunSessionState.snapshot());for(const field of ['activeMode','activeIndex','count','target','journeyKind'])assert.equal(after[field],before[field],'keyboard preview changed '+field);
   await p.keyboard.press('Escape');assert.equal(await p.locator('#r920Atlas').evaluate(el=>el.open),false);assert.equal(await p.evaluate(()=>document.activeElement?.id),'r920AtlasOpen');
   results.push({name:width+' '+mode+' keyboard and native dialog',passed:true,columns:next.columns});
  }
  await f.close();f=null;
 }
}catch(e){results.push({name:'keyboard regression',passed:false,error:e.stack||String(e)})}finally{
 if(f)await f.close().catch(()=>{});const report={build,passed:results.filter(x=>x.passed).length,total:results.length,results,limitations:['Headless Chromium; no physical keyboard/screen-reader acceptance.']};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!results.length||report.passed!==4||report.total!==4)process.exitCode=1;
}})();
