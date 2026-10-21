'use strict';
// Geometry acceptance on byte-for-byte production HTML. No screenshots, user
// profile, microphone or private data. A baseline run must reproduce clipping.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]),output=path.resolve(process.argv[3]);
const baseline=process.argv.includes('--baseline');
const report={build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),baseline,startedAt:new Date().toISOString(),checks:[],geometry:[],limitations:['Linux Chromium only; no physical phone or OS lockscreen acceptance.','Viewport width is effective CSS pixels, not a physical device claim.','Device speech is controlled and external requests blocked by the shared fixture.']};
let f,p;
async function measure(){return p.evaluate(()=>Array.from(document.querySelectorAll('.wrap > .tabs > button')).map(button=>{
 const label=button.querySelector('.tbL'),range=document.createRange();range.selectNodeContents(label);
 const rect=o=>({left:o.left,right:o.right,top:o.top,bottom:o.bottom,width:o.width,height:o.height});
 const b=button.getBoundingClientRect(),l=label.getBoundingClientRect(),cs=getComputedStyle(label),lines=Array.from(range.getClientRects()).filter(x=>x.width&&x.height).map(rect);
 return {text:label.textContent,button:rect(b),label:rect(l),lines,fontSize:cs.fontSize,lineHeight:cs.lineHeight,whiteSpace:cs.whiteSpace,overflowWrap:cs.overflowWrap,clipped:lines.some(x=>x.left<b.left-.75||x.right>b.right+.75||x.top<b.top-.75||x.bottom>b.bottom+.75||x.left<l.left-.75||x.right>l.right+.75||x.bottom>l.bottom+.75),reachable:!button.disabled&&b.width>0&&b.height>0};
}));}
async function check(name,fn){try{const evidence=await fn();report.checks.push({name,passed:true,evidence});}catch(e){report.checks.push({name,passed:false,error:e.stack});}console.log(name+': '+report.checks.at(-1).passed);}
(async()=>{try{
 f=await fixture(root,{seed:{'sukun.obDone':'1','sukun.onboardSeen':'1','sukun.obSeenBuild':JSON.stringify('2026-08-06-r3'),'sukun.theme':'"feyz"'}});p=f.page;report.browser=f.browser.version();
 if(await p.locator('#dailyCard').isVisible())await p.keyboard.press('Escape');await p.locator('#dailyCard').waitFor({state:'hidden'});await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());
 await p.evaluate(()=>document.fonts.ready);
 await check('Fixture is actually classic with Feyz enabled',async()=>{const state=await p.evaluate(()=>({mode:localStorage.getItem('sukun.ui.shellMode'),tefekkur:document.body.classList.contains('sukun-tefekkur-mode'),feyz:SukunR716Shell.snapshot().enabled}));assert.equal(state.mode,'classic');assert.equal(state.tefekkur,false);assert.equal(state.feyz,true);return state;});
 for(const language of ['tr','en']){
  await p.evaluate(lang=>I18N.set(lang),language);await p.waitForTimeout(400);
  await check(language+' locale is actually rendered',async()=>{const state=await p.evaluate(()=>({language:I18N.lang,labels:Array.from(document.querySelectorAll('.wrap > .tabs > button > .tbL')).map(x=>x.textContent.trim())}));assert.equal(state.language,language);assert.deepEqual(state.labels,language==='tr'?['Ambiyans','Frekanslar','Zikir','Düzen','Bildirimler','Tekke']:['Ambience','Frequencies','Dhikr','Arrangement','Notifications','Lodge']);return state;});
  for(const width of [297,320,360,390,430,768,1280]){
   await p.setViewportSize({width,height:844});await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(150);
   const rows=await measure();const viewport=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,nav:document.querySelector('.wrap > .tabs').getBoundingClientRect().toJSON()}));report.geometry.push({language,width,height:844,viewport,rows});
   await check(`${language} ${width}px: six labels and separate button bounds`,()=>{assert.equal(rows.length,6);assert(rows.every(x=>x.reachable));if(!baseline){assert(rows.every(x=>!x.clipped),JSON.stringify(rows.filter(x=>x.clipped)));assert(viewport.scrollWidth<=width+1,'Horizontal document overflow '+JSON.stringify(viewport));}assert(viewport.nav.left>=-.75&&viewport.nav.right<=width+.75,'Navigation outside viewport');assert(rows.every(x=>x.button.left>=-.75&&x.button.right<=width+.75),'Button outside viewport');for(let i=1;i<rows.length;i++)assert(rows[i].button.left>=rows[i-1].button.right-.75);return{labels:rows.map(x=>x.text),clipped:rows.filter(x=>x.clipped).map(x=>x.text)};});
  }
 }
 if(baseline){await check('Immutable baseline independently reproduces at least one clipped label',()=>{const clipped=report.geometry.flatMap(x=>x.rows.filter(r=>r.clipped).map(r=>({language:x.language,width:x.width,text:r.text})));assert(clipped.length>0);return clipped;});}
 else{
  await p.setViewportSize({width:320,height:844});await p.evaluate(()=>I18N.set('tr'));await p.waitForTimeout(300);
  await check('Existing tab handlers and keyboard focus still work',async()=>{const results=[];for(const tab of ['frq','zkr','rx','ntf','amb']){const el=p.locator('.wrap > .tabs > .tab[data-t="'+tab+'"]');await el.click();assert(await el.evaluate(x=>x.classList.contains('act')));await el.focus();assert(await el.evaluate(x=>document.activeElement===x));results.push(tab);}await p.locator('#tekkeTab').focus();assert(await p.locator('#tekkeTab').evaluate(x=>document.activeElement===x));return{clickedTabs:results,tekke:'keyboard focus only; full Tekke lifecycle is a separate suite'};});
  await check('Labels remain contained after the navigation becomes sticky',async()=>{await p.evaluate(()=>window.scrollTo(0,800));await p.waitForTimeout(200);const rows=await measure();assert(rows.every(x=>!x.clipped));const box=await p.locator('.wrap > .tabs').boundingBox();assert(box&&box.y>=-1&&box.y<844);return{box,labels:rows.map(x=>x.text)};});
  await check('The new rule does not select Tefekkür labels',async()=>{return p.evaluate(()=>{const style=document.getElementById('sukun-r1121-classic-label-wrap');if(!style?.sheet)throw Error('Missing shipped wrapping rule');const selectors=Array.from(style.sheet.cssRules).map(x=>x.selectorText).filter(Boolean);if(!selectors.length)throw Error('No shipped selectors');document.body.classList.add('sukun-tefekkur-mode');const selected=selectors.reduce((n,selector)=>n+document.querySelectorAll(selector).length,0);document.body.classList.remove('sukun-tefekkur-mode');if(selected)throw Error('Classic rule leaked into Tefekkür');return{selected};});});
 }
 await check('Served bytes match this source and no local resource or JavaScript failures occur',()=>{const e=f.evidence();assert.deepEqual(e.pageErrors,[]);assert.deepEqual(e.failedRequests,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));for(const[name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),name);return{servedFiles:Object.keys(e.served).length,pageErrors:e.pageErrors,failedRequests:e.failedRequests};});
 }catch(e){report.fatal=e.stack;console.error(e);}finally{if(f)await f.close();report.finishedAt=new Date().toISOString();report.passed=report.checks.filter(x=>x.passed).length;report.total=report.checks.length;report.sourceSha256=hash(fs.readFileSync(path.join(root,'index.html')));report.scriptSha256=hash(fs.readFileSync(__filename));fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,total:report.total,fatal:report.fatal}));if(report.fatal||report.passed!==report.total)process.exitCode=1;}})();
