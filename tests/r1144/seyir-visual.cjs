'use strict';
// The real, user-visible journey summaries at mobile widths. Synthetic text
// enlargement is not a substitute for physical device accessibility testing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1144-seyir-visual.json');
const shots=path.join(path.dirname(output),'screenshots');fs.mkdirSync(shots,{recursive:true});
process.env.CHROMIUM_PATH ||= chromium.executablePath();
const checks=[];const report={suite:'Berhetiyye real journey summary interior',build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),expectedChecks:8,checks,limitations:['Desktop headless Chromium at mobile viewports; enlarged text is simulated per component, not a physical phone or OS font scaling test.']};
function save(){report.total=checks.length;report.passed=checks.filter(x=>x.passed).length;report.allPassed=report.total===report.expectedChecks&&report.passed===report.total&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function tap(p,sel){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());if(await p.locator('#kandil.on').isVisible())await p.locator('#kandil.on').click({position:{x:20,y:20}});await p.locator(sel).first().click({timeout:20000});await p.waitForTimeout(180);}
// Use real wheel scrolling and observe the target against the sticky navigation.
// Programmatic scrollIntoView can be superseded by the app's viewport policy,
// which previously produced screenshots of a different section.
async function move(p,sel){
 let state;
 for(let i=0;i<24;i++){
  state=await p.locator(sel).first().evaluate(n=>{const r=n.getBoundingClientRect(),nav=document.querySelector('.wrap > nav.tabs'),nr=nav?.getBoundingClientRect(),ns=nav&&getComputedStyle(nav),top=nr&&['sticky','fixed'].includes(ns.position)&&nr.bottom>0?nr.bottom:0,x=r.left+r.width/2,y=r.top+r.height/2,hit=document.elementFromPoint(x,y);return{rect:r.toJSON(),navBottom:top,viewportHeight:innerHeight,scrollY:window.scrollY,hit:hit?.id||hit?.tagName,visible:r.top>=top+6&&r.bottom<=innerHeight-6&&!!hit&&(hit===n||n.contains(hit))};});
  if(state.visible)return state;
  const center=(state.navBottom+6+state.viewportHeight-6)/2, target=(state.rect.top+state.rect.bottom)/2,delta=target-center;
  await p.mouse.move(25,Math.max(state.navBottom+15,Math.min(state.viewportHeight-30,state.viewportHeight*.65)));
  await p.mouse.wheel(0,Math.sign(delta||1)*Math.max(100,Math.min(650,Math.abs(delta))));await p.waitForTimeout(200);
 }
 return state;
}
async function measure(p,selector){return p.locator(selector).evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').map(n=>{
 const r=n.getBoundingClientRect(),s=getComputedStyle(n);const tokens=(s.borderImageWidth.match(/(?:min|max|clamp)\([^)]*\)|[^\s]+/g)||[]);
 function calc(v,side){if(!v)return 0;const basis=(side==='top'||side==='bottom')?r.height:r.width;const f=x=>{x=x.trim();if(x.endsWith('%'))return parseFloat(x)*basis/100;if(x.endsWith('px'))return parseFloat(x);if(x==='auto')return parseFloat(s['border'+side[0].toUpperCase()+side.slice(1)+'Width'])||0;const z=parseFloat(x);return Number.isFinite(z)?z*(parseFloat(s['border'+side[0].toUpperCase()+side.slice(1)+'Width'])||0):0;};if(v.startsWith('min('))return Math.min(...v.slice(4,-1).split(',').map(f));if(v.startsWith('max('))return Math.max(...v.slice(4,-1).split(',').map(f));return f(v);}
 const top=calc(tokens[0],'top'),right=calc(tokens[1]||tokens[0],'right'),bottom=calc(tokens[2]||tokens[0],'bottom'),left=calc(tokens[3]||tokens[1]||tokens[0],'left');
 const walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),lines=[];while(walker.nextNode()){const t=walker.currentNode,el=t.parentElement;if(!t.nodeValue.trim()||el?.closest('.zMegaIc,.zMegaRight,[aria-hidden="true"]'))continue;const range=document.createRange();range.selectNodeContents(t);for(const x of range.getClientRects())if(x.width>.5&&x.height>.5)lines.push({text:t.nodeValue.trim(),left:x.left,right:x.right,top:x.top,bottom:x.bottom});}
 const others=[...n.querySelectorAll('.zMegaIc,.zMegaRight')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>({name:e.className,rect:e.getBoundingClientRect().toJSON()}));
 const x=r.left+r.width/2,y=r.top+r.height/2,hit=document.elementFromPoint(x,y);return{id:n.parentElement?.id||n.id,text:n.textContent.trim().replace(/\s+/g,' '),rect:r.toJSON(),insets:{top,right,bottom,left},borderImageWidth:s.borderImageWidth,borderImageSource:s.borderImageSource,lines,others,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth,scrollHeight:n.scrollHeight,clientHeight:n.clientHeight,hit:hit?.id||hit?.tagName,hitTarget:!!hit&&(hit===n||n.contains(hit)),fontSize:s.fontSize};}));}
function intersects(a,b){return a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;}
function validate(rows,min,extra=2){assert(rows.length>=min,'Missing components '+JSON.stringify(rows));for(const row of rows){const r=row.rect,i=row.insets;assert(row.lines.length,'Missing text '+JSON.stringify(row));assert(row.scrollWidth<=row.clientWidth+1&&row.scrollHeight<=row.clientHeight+1,'Content clipped '+JSON.stringify(row));for(const l of row.lines){assert(l.left>=r.left+i.left+extra-1&&l.right<=r.right-i.right-extra+1&&l.top>=r.top+i.top+extra-1&&l.bottom<=r.bottom-i.bottom-extra+1,'Text touches decorated bevel '+JSON.stringify(row));for(const x of row.others)assert(!intersects(l,x.rect),'Text overlaps icon/badge '+JSON.stringify(row));}}}

async function run(name,width,scale,fn){try{const evidence=await fn();checks.push({name,width,scale,passed:true,evidence});}catch(e){checks.push({name,width,scale,passed:false,error:e.stack||String(e)});}finally{save();}}
(async()=>{let f;try{for(const width of [360,393])for(const scale of [1,1.25]){
 const seed={'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(report.build)};
 f=await fixture(root,{width,height:852,voices:'tr',seed});const p=f.page;
 await p.waitForFunction(()=>window.SukunSecretPolicy&&window.SukunSessionState);if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();
 await tap(p,'.tab[data-t="zkr"]');assert.equal(await p.evaluate(()=>KLT_AC('LABELLED-r1144-disposable-profile')),true);
 assert.equal((await p.evaluate(()=>SukunSessionState.command('select',{mode:'berhet',index:15,journeyKind:'single'}))).accepted,true);await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet');
 if(await p.locator('#r938Panel').getAttribute('data-open')!=='true')await tap(p,'#r938PanelToggle');
 await tap(p,'#r986Sections button[aria-controls="zmgSeyirler"]');await p.waitForFunction(()=>document.getElementById('zmgSeyirler')?.open);
 await p.waitForSelector('#berhetSeyir>summary');await p.waitForSelector('#esmaSeyir99>summary');
 if(scale!==1)await p.evaluate(scale=>{for(const n of document.querySelectorAll('#berhetSeyir>summary :is(b,.r168Tag),#esmaSeyir99>summary :is(b,.r168Tag)')){const size=parseFloat(getComputedStyle(n).fontSize);n.style.setProperty('font-size',(size*scale)+'px','important');n.style.setProperty('line-height','1.35','important');}},scale);
 for(const id of ['berhetSeyir','esmaSeyir99'])await run(id,width,scale,async()=>{
  const selector='#'+id+'>summary',details=p.locator('#'+id),tag=p.locator(selector+' .r168Tag');
  const original=await tag.textContent();assert(original&&original.trim(),'Missing real description');
  const evidence=[];
  for(const isLong of [false,true]){
   if(isLong)await tag.evaluate((n,t)=>{n.textContent=t+' · isimleri takip ederek kaldığın yerden güvenle devam edebilirsin';},original);
   for(const open of [false,true]){
    if(await details.evaluate(n=>n.open)!==open)await tap(p,selector);
    assert.equal(await details.evaluate(n=>n.open),open,'Disclosure did not toggle');
    const visible=await move(p,selector);
    await p.screenshot({path:path.join(shots,`${id}-${width}-${Math.round(scale*100)}-${isLong?'long':'original'}-${open?'open':'closed'}.png`)});
    assert(visible.visible,'Target not visible or obscured '+JSON.stringify(visible));
    const rows=await measure(p,selector);assert.equal(rows.length,1);const row=rows[0];
    assert(row.lines.some(l=>l.text.includes(id==='berhetSeyir'?'28 İSİM':'99 İSİM')),'Title not measured '+JSON.stringify(row));
    assert(row.lines.some(l=>l.text.includes('kaldığın yerden')),'Description not measured '+JSON.stringify(row));
    validate(rows,1,3);evidence.push({open,isLong,visible,row});
   }
  }
  await tag.evaluate((n,t)=>{n.textContent=t;},original);return evidence;
 });
 await f.close();f=null;
}}catch(e){report.fatal=e.stack||String(e);}finally{if(f)await f.close().catch(()=>{});save();console.log(JSON.stringify({passed:report.passed,total:report.total,allPassed:report.allPassed,fatal:report.fatal,output,shots}));if(!report.allPassed)process.exitCode=1;}})();
