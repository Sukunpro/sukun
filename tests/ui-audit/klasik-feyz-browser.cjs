'use strict';
// Source-bound candidate QA; the shared fixture controls device speech only.
// Not locally executed: Chromium socket creation is denied in this workspace.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const out=path.resolve(process.argv[3]||'/tmp/klasik-feyz-browser');fs.mkdirSync(out,{recursive:true});
const sources=Object.fromEntries(['index.html','nero.html','css/visual-polish-r1232.css','assets/runtime/interface-r920.js','assets/runtime/wheels-r924.js'].map(n=>[n,hash(fs.readFileSync(path.join(root,n)))]));
const report={build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sources,testSha256:hash(fs.readFileSync(__filename)),startedAt:new Date().toISOString(),checks:[],fixtures:[],limitations:['Headless CSS viewports, not physical-device, screen-reader or audio acceptance.','Wheel target variants use shipped input handler and gallery API, not replacement rendering.','Screenshots require visual review. Transparency baseline comparison is not performed; source-contract tests cover paint changes separately.']};
let f,p,tag='';
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total===25&&report.passed===report.total&&!report.fatal;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n')}
async function focusDiagnostics(){return p.evaluate(()=>{
 const describe=n=>{if(!n)return null;const s=getComputedStyle(n);return{tag:n.tagName,id:n.id,className:n.className,hidden:n.hidden,inert:n.inert,inertAncestor:n.closest('[inert]')?.id||null,tabIndex:n.tabIndex,display:s.display,visibility:s.visibility,rect:n.getBoundingClientRect().toJSON(),ariaHidden:n.getAttribute('aria-hidden')}};
 const active=document.activeElement;
 return{active:describe(active),activeAncestors:active?[...function*(n){for(;n;n=n.parentElement)yield describe(n)}(active)]:[],tour:describe(document.getElementById('onboardCard')),dialog:describe(document.querySelector('#onboardCard .obInner')),skip:describe(document.getElementById('obSkip')),next:describe(document.getElementById('obNext')),search:describe(document.getElementById('prSearchOverlay')),sheetTop:window.SukunSheetAuthority?.top?.(),bodyClass:document.body.className,focusEvents:window.__kfFocusEvents||[],viewport:{width:innerWidth,height:innerHeight}};
})}
async function cleanupTour(){
 // Search helpers are closure-local. Use the shipped public sheet API instead.
 // Each cleanup stage runs even if an earlier stage failed; keep every error.
 const errors=[];
 try{
  await p.evaluate(()=>{const overlay=document.getElementById('prSearchOverlay');if(overlay&&!overlay.hidden){if(typeof window.SukunSheetAuthority?.close!=='function')throw Error('Missing public sheet close API');window.SukunSheetAuthority.close('prSearchOverlay',{returnFocus:false});}});
  await p.locator('#prSearchOverlay').waitFor({state:'hidden'});
 }catch(error){errors.push('search cleanup: '+(error.stack||error))}
 finally{
  try{await p.evaluate(()=>obClose());await p.locator('#onboardCard').waitFor({state:'hidden'});}
  catch(error){errors.push('tour cleanup: '+(error.stack||error))}
  finally{try{await p.setViewportSize({width:Number(tag),height:900});}catch(error){errors.push('viewport cleanup: '+(error.stack||error))}}
 }
 if(errors.length)throw Error(errors.join('\n'));
}
async function check(name,fn){
 let row;
 try{row={name:tag+' '+name,passed:true,evidence:await fn()}}
 catch(e){row={name:tag+' '+name,passed:false,error:e.stack||String(e)};
  try{row.focusDiagnostics=await focusDiagnostics()}catch(error){row.diagnosticsError=String(error)}
  try{await p.screenshot({path:path.join(out,tag+'-failure-'+(report.checks.length+1)+'.png')})}catch(error){row.screenshotError=String(error)}
 }finally{
  if(name.startsWith('onboarding ')||name.startsWith('500x265 ')){
   try{await cleanupTour();if(row)row.cleanup={passed:true}}
   catch(error){if(row){row.passed=false;row.cleanup={passed:false,error:error.stack||String(error)}}else throw error}
  }
 }
 report.checks.push(row);save();console.log(JSON.stringify(row));
}
async function tap(s){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());await p.locator(s).filter({visible:true}).first().click()}
async function tab(name){await tap('.tab[data-t="'+name+'"]');await p.waitForTimeout(200)}
async function shot(name,s){await p.locator(s).screenshot({path:path.join(out,tag+'-'+name+'.png'),timeout:15000})}
async function geometry(s){return p.locator(s).evaluateAll(ns=>ns.filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility==='visible').map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return{id:n.id,text:n.textContent,rect:r.toJSON(),scrollWidth:n.scrollWidth,clientWidth:n.clientWidth,whiteSpace:s.whiteSpace,fontSize:s.fontSize,background:s.backgroundColor,backdrop:s.backdropFilter}}))}
function inside(rows,width,min=0){assert(rows.length,'No visible matched controls');for(const n of rows){assert(n.rect.left>=-1&&n.rect.right<=width+1,'outside viewport '+JSON.stringify(n));assert(n.scrollWidth<=n.clientWidth+2,'horizontal clipping '+JSON.stringify(n));assert(n.rect.height>=min-1,'undersized target '+JSON.stringify(n))}}
(async()=>{try{
for(const width of [320,375,500,1280]){
 tag=String(width);f=await fixture(root,{width,height:900,seed:{'sukun.theme':'"feyz"','sukun.ui.shellMode':'classic','sukun.onboardSeen':'1','sukun.obDone':'1','sukun.obSeenBuild':JSON.stringify(report.build),'sukun.r920.focus':'0'}});p=f.page;report.browser=f.browser.version();
 await p.evaluate(()=>{window.__kfFocusEvents=[];document.addEventListener('focusin',e=>{window.__kfFocusEvents.push({at:performance.now(),id:e.target.id,tag:e.target.tagName,className:e.target.className});if(window.__kfFocusEvents.length>60)window.__kfFocusEvents.shift()},true)});
 if(await p.locator('#dailyCard').isVisible())await p.keyboard.press('Escape');await p.locator('#dailyCard').waitFor({state:'hidden'});
 await check('frequency order and native Enter Space pressed semantics',async()=>{
  await tab('frq');const ids=['carNum','beatNum','frVol','frToggle','bandChips','frequencyAdvancedR1120','frequencyWorkbenchR1120'];
  assert(await p.evaluate(ids=>ids.every((id,i)=>document.querySelectorAll('#'+id).length===1&&(!i||!!(document.getElementById(ids[i-1]).compareDocumentPosition(document.getElementById(id))&Node.DOCUMENT_POSITION_FOLLOWING))),ids));
  const before=await p.evaluate(()=>({carrier:FR.c,volume:FR.vol,playing:FR.playing}));
  for(const [band,key,value] of [['delta','Enter',2.5],['alpha','Space',10]]){const b=p.locator('#bandChips button[data-b="'+band+'"]');await b.focus();await b.press(key);await p.waitForFunction(v=>FR.b===v,value);assert.equal(await b.getAttribute('aria-pressed'),'true');assert.equal(await p.locator('#bandChips button[aria-pressed="true"]').count(),1)}
  assert.deepEqual(await p.evaluate(()=>({carrier:FR.c,volume:FR.vol,playing:FR.playing})),before);
  const rows=await geometry('#bandChips button,#beatChips button,#carChips button');inside(rows,width,44);assert(rows.every(r=>r.rect.width>=43));
  const bandLines=await p.locator('#bandChips button').evaluateAll(buttons=>buttons.map(button=>{const range=document.createRange();range.selectNodeContents(button);const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>r.toJSON());return{text:button.textContent,button:button.getBoundingClientRect().toJSON(),rects}}));
  assert.equal(bandLines.length,5);for(const band of bandLines){assert(band.rects.length>0,'missing band label '+band.text);assert(band.rects.every(r=>Math.abs(r.top-band.rects[0].top)<1),'band label split across lines '+JSON.stringify(band));assert(band.rects.every(r=>r.left>=band.button.left&&r.right<=band.button.right),'band label clips button '+JSON.stringify(band));}
  await shot('frequency','#tab-frq');return{controls:rows,bandLines};
 });
 await check('search grouping separate labels Turkish ASCII and keyboard',async()=>{
  await p.keyboard.press('Control+k');await p.locator('#prSearchInput').waitFor({state:'visible'});assert.deepEqual(await p.locator('.prSearchGroupTitle').allTextContents(),['İçerikler','Araçlar ve işlemler']);assert(await p.locator('.prResult b').count()>0);assert(await p.locator('.prResult .prResultDescription').count()>0);
  await p.locator('#prSearchInput').fill('yağmur');const tr=await p.locator('.prResult b').allTextContents();assert(tr.length>0);await p.locator('#prSearchInput').fill('yagmur');assert.deepEqual(await p.locator('.prResult b').allTextContents(),tr);
  await p.keyboard.press('ArrowDown');assert.equal(await p.locator('.prResult.sel').count(),1);await p.keyboard.press('ArrowUp');assert.equal(await p.locator('.prResult.sel').count(),1);inside(await geometry('.prResult'),width,44);await shot('search','#prSearchOverlay');await p.keyboard.press('Enter');await p.locator('#prSearchOverlay').waitFor({state:'hidden'});
  await p.keyboard.press('Control+k');await p.keyboard.press('Escape');await p.locator('#prSearchOverlay').waitFor({state:'hidden'});return{matches:tr};
 });
 await check('ambience wrapping and persistent Duzen input label',async()=>{
  await tab('amb');const rows=await geometry('.chName small');inside(rows,width);assert(rows.every(r=>r.whiteSpace!=='nowrap'));await shot('ambience','#tab-amb');await tab('rx');const label=p.locator('#rxInputLabelUX');assert(await label.isVisible());assert.equal(await label.getAttribute('for'),'rxInput');assert((await label.textContent()).trim());inside(await geometry('#rxInputLabelUX,#rxInput'),width);await shot('duzen','#tab-rx');return{ambience:rows,label:await label.textContent()};
 });
 await check('onboarding focus trap Escape reopen and Ctrl K takeover',async()=>{
  await p.evaluate(()=>obOpen());await p.waitForFunction(()=>document.activeElement?.matches('#onboardCard .obInner'));
  await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'obSkip');await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'obNext');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'obSkip');inside(await geometry('#obSkip,#obNext'),width,44);await shot('onboarding','#onboardCard');await p.keyboard.press('Escape');await p.locator('#onboardCard').waitFor({state:'hidden'});
  await p.evaluate(()=>{obOpen();obClose();obOpen()});await p.waitForTimeout(500);assert(await p.locator('#onboardCard').isVisible());await p.keyboard.press('Control+k');await p.locator('#prSearchInput').waitFor({state:'visible'});await p.locator('#prSearchInput').fill('yagmur');assert.equal(await p.evaluate(()=>document.activeElement.id),'prSearchInput');await p.keyboard.press('Escape');await p.locator('#prSearchOverlay').waitFor({state:'hidden'});await p.evaluate(()=>obClose());await p.locator('#onboardCard').waitFor({state:'hidden'});return{focusTrap:true,searchTakeover:true};
 });
 await check('wheel actual wide narrow gallery and high target variants',async()=>{
  await tab('zkr');await p.evaluate(()=>KLT_AC('isolated-klasik-feyz-browser'));assert((await p.evaluate(()=>SukunSessionState.command('select',{mode:'esma',index:0,journeyKind:'single'}))).accepted);
  const options=await p.evaluate(()=>SukunWheels.catalog.esma.map(x=>({id:x.id,woven:x.woven,opening:x.safeCenterPercent})));const wide=options.find(x=>!x.woven),narrow=options.find(x=>x.woven&&x.opening<36);assert(wide&&narrow,'Missing real gallery variants');const evidence=[];
  for(const wheel of [wide,narrow])for(const target of [33,9999,10000]){
   await p.evaluate(({id,target})=>{SukunWheels.choose('esma',id);document.getElementById('freeTargetInput').value=String(target);document.getElementById('freeApplyBtn').click()},{id:wheel.id,target});await p.waitForFunction(target=>SukunSessionState.snapshot().target===target,target);await p.waitForFunction(id=>SukunWheels.snapshot().resolved===id&&!SukunWheels.snapshot().pending,wheel.id);await p.waitForTimeout(200);
   const state=await p.locator('#r924WheelFrame').evaluate(n=>({geometry:n.dataset.r1057Center,targetHidden:document.getElementById('wheelTargetUX').hidden,targetDisplay:getComputedStyle(document.getElementById('wheelTargetUX')).display,percentDisplay:getComputedStyle(document.getElementById('r920Percent')).display}));assert.equal(state.geometry,wheel===wide?'wide':'narrow');assert.equal(state.targetHidden,target>9999);if(wheel===narrow||target>9999)assert.equal(state.targetDisplay,'none');else assert.notEqual(state.targetDisplay,'none');inside(await geometry('#r920Count'),width);evidence.push({wheel:wheel.id,target,...state});await shot('wheel-'+wheel.id+'-'+target,'#r924WheelFrame');
  }return evidence;
 });
 if(width===500)await check('500x265 onboarding scroll to actions',async()=>{
  await p.setViewportSize({width:500,height:265});await p.evaluate(()=>obOpen());await p.waitForTimeout(300);const dimensions=await p.locator('#onboardCard .obInner').evaluate(n=>({height:n.getBoundingClientRect().height,client:n.clientHeight,scroll:n.scrollHeight,overflow:getComputedStyle(n).overflowY}));assert(dimensions.height<=218);assert(dimensions.scroll>dimensions.client);assert.equal(dimensions.overflow,'auto');await p.locator('#obNext').scrollIntoViewIfNeeded();await shot('onboarding-short','#onboardCard');assert(await p.locator('#obNext').isVisible());await p.keyboard.press('Escape');await p.setViewportSize({width,height:900});return dimensions;
 });
 await check('exact served bytes and runtime errors',async()=>{const e=f.evidence();for(const[name,expected] of Object.entries(sources))assert.equal(hash(fs.readFileSync(path.join(root,name))),expected,'source mutated '+name);for(const[name,row] of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'served mismatch '+name);assert.deepEqual(e.pageErrors,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));return{served:Object.keys(e.served).length}});
 report.fixtures.push({width,...f.evidence()});await f.close();f=null;save();
}
}catch(e){report.fatal=e.stack||String(e)}finally{if(f){report.fixtures.push(f.evidence());await f.close().catch(e=>{report.closeError=String(e)})}report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({passed:report.passed,total:report.total,allPassed:report.allPassed,fatal:report.fatal,out}));if(!report.allPassed)process.exitCode=1}})();
