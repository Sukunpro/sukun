'use strict';
// Measure actual text inside the production gemstone frames. No CSS mocks.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/sukun-r1219-mobile');
fs.mkdirSync(output,{recursive:true});
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),results=[];
async function check(name,fn){try{results.push({name,passed:true,evidence:await fn()});console.log('PASS '+name)}catch(error){results.push({name,passed:false,error:error.stack||String(error)});console.error('FAIL '+name+': '+error.message)}}
async function tap(p,selector){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());if(await p.locator('#kandil.on').isVisible())await p.locator('#kandil.on').click({position:{x:20,y:20}});await p.locator(selector).filter({visible:true}).first().click()}
async function measure(p,selector){return p.locator(selector).evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility==='visible').map(n=>{
 const r=n.getBoundingClientRect(),s=getComputedStyle(n),values=s.borderImageWidth.split(/\s+/),sides=['top','right','bottom','left'];
 const inset={};for(let i=0;i<4;i++){const side=sides[i],v=values[i]||values[i%2]||values[0];inset[side]=s.borderImageSource==='none'?parseFloat(s['border'+side[0].toUpperCase()+side.slice(1)+'Width'])||0:v.endsWith('px')?parseFloat(v):v.endsWith('%')?parseFloat(v)*(i%2?r.width:r.height)/100:parseFloat(v)*(parseFloat(s['border'+side[0].toUpperCase()+side.slice(1)+'Width'])||0)}
 const lines=[],walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const t=walker.currentNode,e=t.parentElement;if(!t.textContent.trim()||e.closest('[aria-hidden="true"],.di,.ico')||getComputedStyle(e).display==='none'||getComputedStyle(e).visibility==='hidden')continue;const range=document.createRange();range.selectNodeContents(t);for(const b of range.getClientRects())if(b.width>.5&&b.height>.5)lines.push({text:t.textContent.trim(),left:b.left-r.left,right:b.right-r.left,top:b.top-r.top,bottom:b.bottom-r.top})}
 const ctx=document.createElement('canvas').getContext('2d');ctx.font=s.font;
 return{id:n.id,rect:r.toJSON(),inset,lines,font:s.font,fontSize:s.fontSize,lineHeight:s.lineHeight,source:s.borderImageSource,padding:{left:parseFloat(s.paddingLeft),right:parseFloat(s.paddingRight)},selected:n.tagName==='SELECT'?n.selectedOptions[0].textContent:null,selectedWidth:n.tagName==='SELECT'?ctx.measureText(n.selectedOptions[0].textContent).width:0,scroll:[n.scrollWidth,n.clientWidth,n.scrollHeight,n.clientHeight]};
 }))}
function inside(rows,width){assert(rows.length,'missing visible control');for(const n of rows){const r=n.rect,i=n.inset;assert(r.left>=-1&&r.right<=width+1,'outside viewport '+JSON.stringify(n));assert(n.scroll[0]<=n.scroll[1]+1&&n.scroll[2]<=n.scroll[3]+1,'clipped control '+JSON.stringify(n));if(n.selected){assert(n.padding.left>=i.left-1&&n.padding.right>=i.right-1,'select padding crosses bevel '+JSON.stringify(n));assert(n.selectedWidth<=r.width-n.padding.left-n.padding.right-2+1,'selected text clipped '+JSON.stringify(n))}else{assert(n.lines.length,'missing visible text');for(const t of n.lines)assert(t.left>=i.left-1&&t.right<=r.width-i.right+1&&t.top>=i.top-1&&t.bottom<=r.height-i.bottom+1,'text crosses gemstone '+JSON.stringify({n,t}))}}}
(async()=>{let f;try{for(const width of [320,360,393]){
 f=await fixture(root,{width,height:852,voices:'tr',seed:{'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(build)}});const p=f.page;
 await p.waitForFunction(()=>window.SukunSecretPolicy&&window.SukunSessionState&&window.SukunPracticeUI);if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();await tap(p,'.tab[data-t="zkr"]');assert.equal(await p.evaluate(()=>KLT_AC('r1219-layout-disposable')),true);
 for(const mode of ['esma','berhet']){
  assert((await p.evaluate(mode=>SukunSessionState.command('select',{mode,index:8,journeyKind:'single'}),mode)).accepted);
  await p.waitForFunction(mode=>document.documentElement.dataset.r1074Theme===mode&&document.body.classList.contains('r1215-premium'),mode);
  if(await p.locator('#r938PanelToggle').getAttribute('aria-expanded')!=='true')await tap(p,'#r938PanelToggle');
  for(const value of ['single','journey'])await check(`${width} ${mode} ${value} path labels`,async()=>{
   await p.locator('#r920JourneyMode').selectOption(value);await p.waitForTimeout(200);
   const rows=await measure(p,'#r920AtlasOpen,#r920JourneyMode');assert.equal(rows.length,2);inside(rows,width);
   const [a,b]=rows;assert(Math.abs(a.rect.width-b.rect.width)<=1&&Math.abs(a.rect.height-b.rect.height)<=1,'unequal control sizes '+JSON.stringify(rows));assert.equal(a.fontSize,b.fontSize);assert.equal(a.lineHeight,b.lineHeight);assert(a.rect.height>=44);assert.equal(b.selected,value==='single'?'Tekil zikir':'Seyir');
   if(mode==='berhet')assert(rows.every(n=>n.source.includes('/assets/berhetiyye-premium/')),'gem artwork lost');
   await p.locator('.r920Path').screenshot({path:path.join(output,`${width}-${mode}-${value}-path.png`)});return rows;
  });
  await check(`${width} ${mode} target and remaining labels`,async()=>{const rows=await measure(p,'#r938Hero .r920Stats>span');assert.equal(rows.length,2);inside(rows,width);await p.locator('#r938Hero .r920Stats').screenshot({path:path.join(output,`${width}-${mode}-stats.png`)});return rows});
 }
 if(!(await p.evaluate(()=>document.body.classList.contains('r920-details-open'))))await tap(p,'#r920More');
 await check(`${width} ruby stop caption`,async()=>{const rows=await measure(p,'#dock>#stopAll');assert.equal(rows.length,1);inside(rows,width);assert(rows[0].source.includes('gem-ruby'),'ruby artwork lost');await p.locator('#stopAll').screenshot({path:path.join(output,`${width}-stop.png`)});return rows});
 await f.close();f=null;
}}catch(error){results.push({name:'fixture',passed:false,error:error.stack||String(error)})}finally{if(f)await f.close().catch(()=>{});const report={build,passed:results.filter(r=>r.passed).length,total:results.length,results,limitations:['Headless Chromium at mobile CSS widths; physical phone and system font scaling are not covered.','Screenshots need visual review.']};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,total:report.total,output}));if(report.total!==21||report.passed!==report.total)process.exitCode=1}})();
