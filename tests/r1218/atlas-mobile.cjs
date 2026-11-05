'use strict';
// Regression for the production Atlas at narrow widths, with real DOM/CSS.
// Run in CI with Playwright Chromium; this does not claim physical-device QA.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/sukun-atlas-mobile');
fs.mkdirSync(output,{recursive:true});
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim();
const results=[];
async function record(name,run){try{const evidence=await run();results.push({name,passed:true,evidence});console.log('PASS '+name);}catch(e){results.push({name,passed:false,error:e.stack||String(e)});console.error('FAIL '+name+': '+e.message);}}
async function tap(page,selector){await page.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());if(await page.locator('#kandil.on').isVisible())await page.locator('#kandil.on').click({position:{x:20,y:20}});await page.locator(selector).first().click();}
async function geometry(page){return page.evaluate(()=>{
 const dialog=document.querySelector('#r920Atlas'),grid=document.querySelector('#r920AtlasNodes');
 const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
 const cards=Array.from(grid.querySelectorAll('button:not([hidden])')).map(n=>{
  const name=n.querySelector('.r1215AtlasName'),r=rect(n),s=getComputedStyle(n),textRects=[];
  if(name){const w=document.createTreeWalker(name,NodeFilter.SHOW_TEXT);while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(w.currentNode);for(const b of range.getClientRects())textRects.push({left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height});}}
  return {index:n.dataset.index,label:name?.textContent,rect:r,textRects,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth,scrollHeight:n.scrollHeight,clientHeight:n.clientHeight,pressed:n.getAttribute('aria-pressed'),active:n.dataset.active,background:s.backgroundColor,backgroundImage:s.backgroundImage};
 });
 return {mode:grid.dataset.mode,title:document.querySelector('#r920AtlasTitle').textContent,dialog:rect(dialog),grid:rect(grid),columns:getComputedStyle(grid).gridTemplateColumns,detail:rect(document.querySelector('#r920AtlasDetail')),cards,windowWidth:innerWidth};
 });}
function validate(g,width,mode){assert.equal(g.mode,mode);assert(g.dialog.left>=-1&&g.dialog.right<=width+1,'dialog outside viewport');assert(g.detail.width>0&&g.detail.height>0,'missing detail panel');assert(g.cards.length>2,'catalogue missing');const a=g.cards[0].rect,b=g.cards[1].rect,c=g.cards[2].rect;assert(Math.abs(a.top-b.top)<2,'first two cards must share a row');assert(c.top>a.bottom-1,'third card must begin next row (two columns)');assert(a.width>100&&b.width>100,'cards too narrow');for(const card of g.cards){const r=card.rect;assert(card.label?.trim(),'card name missing');assert(card.textRects.length,'name text not rendered: '+card.label);assert(card.scrollWidth<=card.clientWidth+1&&card.scrollHeight<=card.clientHeight+1,'card content clipped: '+card.label);for(const t of card.textRects)assert(t.left>=r.left-1&&t.right<=r.right+1&&t.top>=r.top-1&&t.bottom<=r.bottom+1,'text crosses card: '+card.label+' '+JSON.stringify({r,t}));}assert.equal(g.cards.filter(x=>x.pressed==='true').length,1,'one selected card');assert.equal(g.cards.filter(x=>x.active==='1').length,1,'one active card');}
(async()=>{let f;try{for(const width of [360,390,412]){
 f=await fixture(root,{width,height:844,voices:'tr',seed:{'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(build)}});const p=f.page;
 await p.waitForFunction(()=>window.SukunSecretPolicy&&window.SukunSessionState&&window.SukunPracticeUI);if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();await tap(p,'.tab[data-t="zkr"]');assert.equal(await p.evaluate(()=>KLT_AC('atlas-mobile-disposable-profile')),true);
 const themes={};for(const mode of ['esma','berhet']){
  const select=await p.evaluate(mode=>SukunSessionState.command('select',{mode,index:0,journeyKind:'single'}),mode);assert(select.accepted,'cannot select '+mode);
  await p.waitForFunction(mode=>SukunSessionState.snapshot().activeMode===mode,mode);await p.evaluate(()=>window.SukunPracticeUI.atlas());await p.waitForFunction(()=>document.querySelector('#r920Atlas')?.open);
  await record(width+' '+mode+' two columns and no text overflow',async()=>{const g=await geometry(p);await p.screenshot({path:path.join(output,`${width}-${mode}.png`)});validate(g,width,mode);themes[mode]=g.cards[1].backgroundImage+' '+g.cards[1].background;return {title:g.title,columns:g.columns,count:g.cards.length,dialog:g.dialog,detail:g.detail};});
  await record(width+' '+mode+' selection, search and filter',async()=>{
   const before=await p.evaluate(()=>SukunSessionState.snapshot());await p.locator('#r920AtlasNodes button').nth(1).click();const selected=await p.locator('#r920AtlasNodes button').nth(1).getAttribute('aria-pressed');assert.equal(selected,'true');const after=await p.evaluate(()=>SukunSessionState.snapshot());assert.equal(after.activeIndex,before.activeIndex,'preview selection changed active session');
   const name=(await p.locator('#r920AtlasNodes button').nth(1).locator('.r1215AtlasName').textContent()).trim();await p.locator('#r1215AtlasSearch').fill(name);assert((await p.locator('#r920AtlasNodes button:visible').count())>=1,'search did not find selected name');await p.locator('#r1215AtlasSearch').fill('');await p.locator('#r1215AtlasFilter').selectOption('active');assert.equal(await p.locator('#r920AtlasNodes button:visible').count(),1,'active filter');await p.locator('#r1215AtlasFilter').selectOption('all');
   await p.locator('#r920AtlasNodes button').nth(1).click();await p.locator('#r920AtlasChoose').click();await p.waitForFunction(()=>!document.querySelector('#r920Atlas').open);await p.waitForFunction(()=>SukunSessionState.snapshot().activeIndex===1);return{name};
  });
  if(await p.locator('#r920Atlas').evaluate(el=>el.open))await p.locator('#r920AtlasClose').click();
 }
 await record(width+' catalogue themes remain distinct',async()=>{assert(themes.esma&&themes.berhet&&themes.esma!==themes.berhet,'atlas palette must follow catalogue');return themes;});
 await f.close();f=null;
}}catch(e){results.push({name:'fixture',passed:false,error:e.stack||String(e)});}finally{if(f)await f.close().catch(()=>{});const report={build,passed:results.filter(r=>r.passed).length,total:results.length,results,limitations:['Headless Chromium, not physical Samsung or system font scaling.','Screenshots require visual review.']};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,total:report.total,output}));if(!results.length||report.passed!==report.total)process.exitCode=1;}})();
