'use strict';
// Full application and actual pointer interactions. Headless Chromium only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1141-nefs-access-layout.json');
process.env.CHROMIUM_PATH ||= chromium.executablePath();
const widths=[360,393], checks=[];
const report={suite:'Nefs, dream compass and long headings on phones',build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),expectedChecks:widths.length*3,checks,limitations:['Headless Chromium with a disposable synthetic profile; no physical phone or audible-output claim.']};
function save(){report.total=checks.length;report.passed=checks.filter(x=>x.passed).length;report.allPassed=report.total===report.expectedChecks&&report.total===report.passed&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function tap(page,selector){await page.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());if(await page.locator('#kandil.on').isVisible())await page.locator('#kandil.on').click({position:{x:20,y:20}});await page.locator(selector).first().click({timeout:20000});await page.waitForTimeout(180);}
async function measure(page,selector){return page.locator(selector).evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),style=getComputedStyle(n),w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),lines=[];while(w.nextNode()){const t=w.currentNode;if(!t.nodeValue.trim()||t.parentElement?.closest('.ico,.bozet'))continue;const range=document.createRange();range.selectNodeContents(t);for(const x of range.getClientRects())if(x.width>.5&&x.height>.5)lines.push({left:x.left,right:x.right,top:x.top,bottom:x.bottom});}const badge=n.querySelector('.bozet'),b=badge?.getBoundingClientRect();return{text:n.textContent.trim().replace(/\s+/g,' '),rect:r.toJSON(),lines,badge:b?.toJSON()||null,overflowX:n.scrollWidth>n.clientWidth+1,overflowY:n.scrollHeight>n.clientHeight+1,style:{fontSize:style.fontSize,lineHeight:style.lineHeight,whiteSpace:style.whiteSpace,overflow:style.overflow}};}));}
function valid(rows,min){assert(rows.length>=min,`Expected >=${min} headings, got ${rows.length}`);for(const row of rows){assert(row.lines.length,'Text not rendered '+JSON.stringify(row));assert(!row.overflowX&&!row.overflowY,'Heading overflow '+JSON.stringify(row));for(const l of row.lines){const r=row.rect;assert(l.left>=r.left-1&&l.right<=r.right+1&&l.top>=r.top-1&&l.bottom<=r.bottom+1,'Text escapes heading '+JSON.stringify(row));if(row.badge)assert(!(l.left<row.badge.right-1&&l.right>row.badge.left+1&&l.top<row.badge.bottom-1&&l.bottom>row.badge.top+1),'Text overlaps badge '+JSON.stringify(row));}}}
(async()=>{let f;try{for(const width of widths){
 const seed={'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(report.build)};
 f=await fixture(root,{width,height:852,voices:'tr',seed});const p=f.page;
 await p.waitForFunction(()=>window.SukunSecretPolicy&&window.SukunSessionState&&window.SukunNefsR948);
 if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();
 await tap(p,'.tab[data-t="zkr"]');assert.equal(await p.evaluate(()=>KLT_AC('LABELLED-r1141-disposable-layout-profile')),true);
 assert.equal((await p.evaluate(()=>SukunSessionState.command('select',{mode:'berhet',index:8,journeyKind:'single'}))).accepted,true);
 await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet');
 if(await p.locator('#r938Panel').getAttribute('data-open')!=='true')await tap(p,'#r938PanelToggle');await tap(p,'#r986Sections button[aria-controls="zmgSeyirler"]');await p.waitForFunction(()=>document.getElementById('zmgSeyirler')?.open);if(!(await p.locator('#nefsLtfHub').evaluate(e=>e.open)))await tap(p,'#nefsLtfHub>summary');await tap(p,'[data-nltf="nefsBox"]');
 try{
  await p.locator('#r948NefsRoot [data-nr-action="dream"]').waitFor({state:'visible'});
  assert.equal(await p.locator('#nr-about').evaluate(e=>e.open),false,'Overview must start compact');await tap(p,'#nr-about>summary');assert.equal(await p.locator('#nr-about').evaluate(e=>e.open),true);assert(await p.locator('#nr-about [data-nr-action="knowledge"]').isVisible(),'Knowledge shortcut missing');
  await p.evaluate(()=>I18N.set('en'));await p.waitForFunction(()=>document.querySelector('#r948NefsRoot [data-nr-action="dream"]')?.textContent.includes('Dream Compass'));await p.evaluate(()=>I18N.set('tr'));await p.waitForFunction(()=>document.querySelector('#r948NefsRoot [data-nr-action="dream"]')?.textContent.includes('Rüya Pusulası'));
  await tap(p,'#r948NefsRoot [data-nr-action="tab"][data-nr-value="journal"]');const input=p.locator('#r948NefsRoot textarea[data-nr-reflection]').first();await input.fill('Deneme notu: sakinlik.');
  await tap(p,'#r948NefsRoot [data-nr-action="tab"][data-nr-value="home"]');await tap(p,'#r948NefsRoot [data-nr-action="dream"]');
  await p.locator('#ruyaSheet').waitFor({state:'visible'});await p.locator('#ruyaQ').fill('köpek');await p.waitForFunction(()=>document.querySelectorAll('#ruyaList .ruyaItem').length>0);
  const found=await p.locator('#ruyaList').innerText();assert.match(found,/köpek/i);await tap(p,'#ruyaSheet [data-x="ruyaSheet"]');assert.equal(await p.locator('#ruyaSheet').isVisible(),false);
  await tap(p,'#r948NefsRoot [data-nr-action="tab"][data-nr-value="journal"]');assert.equal(await p.locator('#r948NefsRoot textarea[data-nr-reflection]').first().inputValue(),'Deneme notu: sakinlik.');
  await tap(p,'#r948NefsRoot [data-nr-action="tab"][data-nr-value="home"]');await tap(p,'#r948NefsRoot [data-nr-action="seyir"]');assert.equal(await p.locator('#r948LegacyNefs').evaluate(e=>e.open),true,'Existing forty-day journey shortcut did not open');
  checks.push({width,name:'dream-search-and-notes',passed:true});
 }catch(e){checks.push({width,name:'dream-search-and-notes',passed:false,error:e.stack||String(e)});}finally{save();}
 try{
  await tap(p,'#r948NefsRoot [data-nr-action="tab"][data-nr-value="guide"]');const rows=await measure(p,'#r948NefsRoot .nr-reading>summary');valid(rows,30);for(const title of ['Fîhi Mâ Fîh','Mantıku’t-Tayr','Tezkiretü’l-Evliyâ','Risâletü’n-Nushiyye','Garibnâme','Metafizik kavramları'])assert(rows.some(x=>x.text.includes(title)),'long reading heading missing: '+title);
  const entry=p.locator('#r948NefsRoot .nr-reading').filter({hasText:'Risâletü’n-Nushiyye'}).first();await entry.locator('summary').click();assert.equal(await entry.evaluate(e=>e.open),true,'Reading does not open');
  checks.push({width,name:'nefs-long-headings',passed:true,count:rows.length,longest:rows.sort((a,b)=>b.text.length-a.text.length).slice(0,4)});
 }catch(e){checks.push({width,name:'nefs-long-headings',passed:false,error:e.stack||String(e)});}finally{save();}
 try{
  if(await p.locator('#r938Panel').getAttribute('data-open')!=='true')await tap(p,'#r938PanelToggle');await tap(p,'#r986Sections button[aria-controls="zmgOkumalar"]');await p.waitForFunction(()=>document.getElementById('zmgOkumalar')?.open);
  const selectors=['hzvBox','seyBox','tvBox','mzbzBox','dhBox','dlBox','niyetBox','akBox'].map(id=>'#'+id+'>summary').join(',');const rows=await measure(p,selectors);valid(rows,8);
  const tv=p.locator('#tvBox');if(await tv.evaluate(e=>e.open))await tap(p,'#tvBox>summary');await tap(p,'#tvBox>summary');assert.equal(await tv.evaluate(e=>e.open),true,'Nasuh accordion does not open');
  checks.push({width,name:'prayer-long-headings',passed:true,count:rows.length,headings:rows});
 }catch(e){checks.push({width,name:'prayer-long-headings',passed:false,error:e.stack||String(e)});}finally{save();}
 await f.close();f=null;
}}catch(e){report.fatal=e.stack||String(e);}finally{if(f)await f.close().catch(()=>{});save();console.log(JSON.stringify({passed:report.passed,total:report.total,allPassed:report.allPassed,fatal:report.fatal,output}));if(!report.allPassed)process.exitCode=1;}})();
