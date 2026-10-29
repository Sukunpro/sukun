'use strict';
// Real production UI, native disclosures and actual element geometry.
// Browser-only evidence; does not assert physical-device rendering or audio.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1142-responsive-headings.json');
process.env.CHROMIUM_PATH ||= chromium.executablePath();
const widths=[360,393],checks=[];
const report={suite:'Berhetiyye responsive readings, journeys and tools',build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),expectedChecks:widths.length*5,checks,limitations:['Full production DOM in headless Chromium using synthetic speech and disposable storage; not a physical phone test.']};
function save(){report.total=checks.length;report.passed=checks.filter(x=>x.passed).length;report.allPassed=report.total===report.expectedChecks&&report.passed===report.total&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function tap(p,sel){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());if(await p.locator('#kandil.on').isVisible())await p.locator('#kandil.on').click({position:{x:20,y:20}});await p.locator(sel).first().click({timeout:20000});await p.waitForTimeout(180);}
async function toggle(p,id,open){const loc=p.locator('#'+id);if(await loc.evaluate(n=>n.open)!==open)await tap(p,'#'+id+'>summary');assert.equal(await loc.evaluate(n=>n.open),open,'Disclosure action failed: '+id);}
// Measure actual text line boxes rather than outer element boxes; r1141's old
// assertion allowed text to sit on top of the decorative bevel inside the box.
async function measure(p,selector){return p.locator(selector).evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n),walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),lines=[];while(walker.nextNode()){const t=walker.currentNode,el=t.parentElement;if(!t.nodeValue.trim()||el?.closest('.ico,.qb,.bozet,.zMegaIc,.zMegaRight,.r168Tag,[aria-hidden="true"]'))continue;const range=document.createRange();range.selectNodeContents(t);for(const x of range.getClientRects())if(x.width>.5&&x.height>.5)lines.push({text:t.nodeValue.trim(),left:x.left,right:x.right,top:x.top,bottom:x.bottom});}const aux=[...n.querySelectorAll('.ico,.qb,.bozet,.zMegaIc,.zMegaRight,.r168Tag')].filter(x=>x.getClientRects().length&&getComputedStyle(x).display!=='none').map(x=>({type:x.className,rect:x.getBoundingClientRect().toJSON(),text:x.textContent.trim()}));return{id:n.parentElement?.id||n.id,text:n.textContent.trim().replace(/\s+/g,' '),rect:r.toJSON(),lines,aux,overflowX:n.scrollWidth>n.clientWidth+1,overflowY:n.scrollHeight>n.clientHeight+1,style:{fontSize:s.fontSize,lineHeight:s.lineHeight,padding:s.padding,borderImageWidth:s.borderImageWidth}};}));}
function intersect(a,b){return a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;}
function validate(rows,min){assert(rows.length>=min,`Only ${rows.length} headings; expected ${min}`);for(const row of rows){assert(row.lines.length,'Text missing '+JSON.stringify(row));assert(!row.overflowX&&!row.overflowY,'Clipped heading '+JSON.stringify(row));for(const line of row.lines){const r=row.rect;assert(line.left>=r.left+12&&line.right<=r.right-12&&line.top>=r.top+5&&line.bottom<=r.bottom-5,'Text reaches decorative frame '+JSON.stringify(row));for(const a of row.aux){if(a.rect.width>.5&&a.rect.height>.5)assert(!intersect(line,a.rect),'Text touches icon or badge '+JSON.stringify(row));}}for(let i=0;i<row.aux.length;i++){const a=row.aux[i];if(!a.text||!a.rect.width||!a.rect.height)continue;const r=row.rect;assert(a.rect.left>=r.left+10&&a.rect.right<=r.right-10&&a.rect.top>=r.top+3&&a.rect.bottom<=r.bottom-3,'Badge exceeds frame '+JSON.stringify(row));}}}
function named(rows,names){for(const text of names)assert(rows.some(x=>x.text.includes(text)),'Missing heading '+text);}
async function run(check,width,fn){try{const evidence=await fn();checks.push({width,name:check,passed:true,evidence});}catch(e){checks.push({width,name:check,passed:false,error:e.stack||String(e)});}finally{save();}}
(async()=>{let f;try{for(const width of widths){
 const seed={'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(report.build)};
 f=await fixture(root,{width,height:852,voices:'tr',seed});const p=f.page;
 await p.waitForFunction(()=>window.SukunSecretPolicy&&window.SukunSessionState);
 if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();
 await tap(p,'.tab[data-t="zkr"]');assert.equal(await p.evaluate(()=>KLT_AC('LABELLED-r1142-disposable-layout-profile')),true);
 assert.equal((await p.evaluate(()=>SukunSessionState.command('select',{mode:'berhet',index:8,journeyKind:'single'}))).accepted,true);
 await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet');
 if(await p.locator('#r938Panel').getAttribute('data-open')!=='true')await tap(p,'#r938PanelToggle');
 await tap(p,'#r986Sections button[aria-controls="zmgOkumalar"]');await p.waitForFunction(()=>document.getElementById('zmgOkumalar')?.open);
 await run('group-headings',width,async()=>{const rows=await measure(p,'#zMegaHost>.zMegaGroup>summary');validate(rows,3);named(rows,['OKUMALAR','SEYİRLER','ARAÇLAR']);return rows;});
 await run('reading-disclosures',width,async()=>{
  await p.locator('#r1064ReadingExplorer>summary').waitFor({state:'visible'});await p.locator('#r1064YasinBox>summary').waitFor({state:'visible'});
  await toggle(p,'r1064ReadingExplorer',true);await p.locator('#r1064MeaningDetails>summary').waitFor({state:'visible'});
  const sel='#r1064ReadingExplorer>summary,#r1064YasinBox>summary,#r1064MeaningDetails>summary,#niyetBox>summary,#hzvBox>summary,#seyBox>summary,#tvBox>summary,#mzbzBox>summary,#dhBox>summary,#dlBox>summary,#akBox>summary';
  const rows=await measure(p,sel);validate(rows,11);named(rows,['Özgün metin','Yâsîn','Türkçe anlamı']);await toggle(p,'r1064MeaningDetails',true);await toggle(p,'r1064MeaningDetails',false);return rows;});
 await run('portal-and-journeys',width,async()=>{
  const portal=p.locator('#r1080BerhetEntry');await portal.waitFor({state:'visible'});
  const gate=await p.evaluate(()=>{const b=document.querySelector('#r1080BerhetEntry'),r=b.getBoundingClientRect(),parts=[...b.querySelectorAll('.r1080-gate-thumb,[data-entry-label],[data-entry-title],[data-entry-hint],.r1080-gate-arrow')].map(x=>({name:x.className||Object.keys(x.dataset)[0],text:x.textContent.trim(),rect:x.getBoundingClientRect().toJSON()}));return{rect:r.toJSON(),parts};});
  for(const x of gate.parts){const r=gate.rect,q=x.rect;assert(q.left>=r.left+8&&q.right<=r.right-8&&q.top>=r.top+4&&q.bottom<=r.bottom-4,'Portal content outside frame '+JSON.stringify(gate));}
  for(let i=0;i<gate.parts.length;i++)for(let j=i+1;j<gate.parts.length;j++)assert(!intersect(gate.parts[i].rect,gate.parts[j].rect),'Portal content overlaps '+JSON.stringify(gate));
  await tap(p,'#r1080BerhetEntry');await p.waitForFunction(()=>SukunBerhetGate.snapshot().open);await p.evaluate(()=>SukunBerhetGate.close());
  await tap(p,'#r986Sections button[aria-controls="zmgSeyirler"]');await p.waitForFunction(()=>document.getElementById('zmgSeyirler')?.open);
  const rows=await measure(p,'#nefsLtfHub>summary,#cakraBox>summary,#virdBox>summary,#berhetSeyir>summary,#esmaSeyir99>summary');validate(rows,5);named(rows,['Nefs','Enerji','28 İSİM','99 İSİM']);
  await toggle(p,'cakraBox',true);await toggle(p,'cakraBox',false);return{gate,rows};});
 await run('tools-disclosures',width,async()=>{
  await tap(p,'#r986Sections button[aria-controls="zmgAraclar"]');await p.waitForFunction(()=>document.getElementById('zmgAraclar')?.open);
  const rows=await measure(p,'#vhBox>summary,#trkBox>summary,#ydkBox>summary');validate(rows,3);named(rows,['Kendi sesinle','Terkip Kur','Kayıtlarım']);await toggle(p,'vhBox',true);await toggle(p,'vhBox',false);return rows;});
 await run('frequency-disclosures',width,async()=>{
  await tap(p,'.tab[data-t="frq"]');const rows=await measure(p,'#frequencyAdvancedR1120>summary,#jEd>summary,#fr2Box>summary,#pitBox>summary');validate(rows,4);named(rows,['Harmonikler','Kendi yolculuğunu','İkinci binaural','Ledün Lab']);await toggle(p,'jEd',true);await toggle(p,'jEd',false);return rows;});
 await f.close();f=null;
}}catch(e){report.fatal=e.stack||String(e);}finally{if(f)await f.close().catch(()=>{});save();console.log(JSON.stringify({passed:report.passed,total:report.total,allPassed:report.allPassed,fatal:report.fatal,output}));if(!report.allPassed)process.exitCode=1;}})();
