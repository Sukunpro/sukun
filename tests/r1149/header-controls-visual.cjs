'use strict';
// Actual DOM, rendered artwork and session controls at mobile CSS widths.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {fixture}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),dir=path.resolve(process.argv[3]||'/tmp/r1149-visual');fs.mkdirSync(dir,{recursive:true});let f,p;
const report={expectedChecks:30,checks:[],limitations:['Headless Chromium at mobile CSS widths; no physical phone or OS font scaling.','Screenshots require human inspection; checks measure actual rendered text and border-image interior.']};
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total===report.expectedChecks&&report.total===report.passed&&!report.fatal;fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));}
async function check(width,name,fn){try{report.checks.push({width,name,passed:true,evidence:await fn()});}catch(e){report.checks.push({width,name,passed:false,error:e.stack||String(e)});console.log(`[${width}px] ${name}: ${e.stack||e}`)}save()}
async function tap(sel){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());if(await p.locator('#kandil.on').isVisible())await p.locator('#kandil.on').click({position:{x:20,y:20}});await p.locator(sel).filter({visible:true}).first().click({timeout:15000});await p.waitForTimeout(200)}
async function place(sel){const n=p.locator(sel).filter({visible:true}).first();await n.evaluate(el=>window.SukunViewportPolicy?.scrollTo(el,{block:'center',behavior:'instant'},'r1149-test')||el.scrollIntoView({block:'center'}));await p.waitForTimeout(250)}
async function frames(sel,min=1){const rows=await p.locator(sel).evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility==='visible').map(n=>{let r=n.getBoundingClientRect(),s=getComputedStyle(n),parts=s.borderImageWidth.match(/(?:min|max|clamp)\([^)]*\)|[^\s]+/g)||[];let v=(str,side)=>{let basis=/^(top|bottom)$/.test(side)?r.height:r.width;let f=x=>{x=(x||'0').trim();return x.endsWith('%')?parseFloat(x)*basis/100:x.endsWith('px')?parseFloat(x):(parseFloat(x)||0)*(parseFloat(s['border'+side[0].toUpperCase()+side.slice(1)+'Width'])||0)};return str?.startsWith('min(')?Math.min(...str.slice(4,-1).split(',').map(f)):str?.startsWith('max(')?Math.max(...str.slice(4,-1).split(',').map(f)):f(str)};let ins={top:v(parts[0],'top'),right:v(parts[1]||parts[0],'right'),bottom:v(parts[2]||parts[0],'bottom'),left:v(parts[3]||parts[1]||parts[0],'left')},lines=[],walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);while(walker.nextNode()){let t=walker.currentNode,e=t.parentElement;if(!t.textContent.trim()||getComputedStyle(e).display==='none'||getComputedStyle(e).visibility==='hidden'||e.closest('[aria-hidden="true"],.di,.ico'))continue;let range=document.createRange();range.selectNodeContents(t);for(const b of range.getClientRects())if(b.width>.5&&b.height>.5)lines.push({text:t.textContent.trim().slice(0,100),left:b.left-r.left,right:b.right-r.left,top:b.top-r.top,bottom:b.bottom-r.top})}return{id:n.id,text:n.textContent.trim().replace(/\s+/g,' ').slice(0,80),rect:r.toJSON(),insets:ins,lines,source:s.borderImageSource,scroll:[n.scrollWidth,n.clientWidth,n.scrollHeight,n.clientHeight]}}));assert(rows.length>=min,'Missing visible elements '+sel+' '+rows.length);for(const n of rows){assert(n.rect.width<=p.viewportSize().width+1,'Overflow viewport '+JSON.stringify(n));assert(n.scroll[0]<=n.scroll[1]+1&&n.scroll[2]<=n.scroll[3]+1,'Content clipped '+JSON.stringify(n));for(const l of n.lines){const i=n.insets;assert(l.left>=i.left-1&&l.right<=n.rect.width-i.right+1&&l.top>=i.top-1&&l.bottom<=n.rect.height-i.bottom+1,'Text enters jewel border '+JSON.stringify({n,l}));}}return rows}
async function wholeQuickLabels(){
 const words=await p.locator('#dock > button.dockItem :is(.dl,.dlAlt)').evaluateAll(nodes=>nodes.flatMap(n=>{if(!n.getClientRects().length)return [];const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),out=[];while(w.nextNode()){const t=w.currentNode;for(const m of t.textContent.matchAll(/\S+/g)){const r=document.createRange();r.setStart(t,m.index);r.setEnd(t,m.index+m[0].length);const boxes=[...r.getClientRects()].filter(b=>b.width>.5&&b.height>.5);if(boxes.length)out.push({text:m[0],lines:boxes.length})}}return out}));
 assert(words.length>=6,'Missing master control labels');for(const w of words)assert.equal(w.lines,1,'Master control word split '+JSON.stringify(w));return words;
}
(async()=>{try{for(const width of [320,360,393]){
 const seed={'sukun.theme':'"feyz"','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0','sukun.obSeenBuild':JSON.stringify(fs.readFileSync(path.join(root,'version.txt'),'utf8').trim())};f=await fixture(root,{width,height:852,voices:'tr',seed});p=f.page;await p.waitForFunction(()=>window.SukunSecretPolicy&&window.SukunSessionState&&window.I18N);if(await p.locator('#dailyCard').isVisible())await p.locator('#dcClose').click();
 await check(width,'ordinary-header',async()=>{const s=await p.locator('.wrap > header').evaluate(n=>({source:getComputedStyle(n).borderImageSource,theme:document.documentElement.dataset.r1074Theme,logo:getComputedStyle(n.querySelector('.logo')).backgroundImage}));assert.notEqual(s.theme,'berhet');assert(!s.source.includes('panel-emerald-r932'),'Ordinary theme was changed');return s});
 await tap('.tab[data-t="zkr"]');assert.equal(await p.evaluate(()=>KLT_AC('r1149-test-profile')),true);assert.equal((await p.evaluate(()=>SukunSessionState.command('select',{mode:'berhet',index:8,journeyKind:'single'}))).accepted,true);await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet');await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(500);
 // r1170/r1172 replaced the separate frame and logo with approved complete
 // artwork. The heading is a transparent recovery target and the description
 // is clipped for screen readers, so their unpainted Range boxes are not ink.
 await check(width,'hero',async()=>{
  const header=p.locator('.wrap > header');
  await header.screenshot({path:path.join(dir,`${width}-hero.png`)});
  const h=await header.evaluate(async n=>{
   const s=getComputedStyle(n),r=n.getBoundingClientRect(),heading=n.querySelector('h1'),description=n.querySelector('.sub');
   const semantic=el=>{const cs=getComputedStyle(el);return{text:el.textContent.trim(),rect:el.getBoundingClientRect().toJSON(),display:cs.display,visibility:cs.visibility,hidden:!!el.closest('[hidden],[aria-hidden="true"]'),clip:cs.clipPath,overflow:cs.overflow,color:cs.webkitTextFillColor,pointerEvents:cs.pointerEvents,recovery:el.hasAttribute('data-sukun-recovery-title')}};
   const src=s.backgroundImage.match(/url\("([^"\n]*sukun-berhet-selected-r1172\.png)"\)/)?.[1];
   let image=null;if(src){const img=new Image();img.src=src;await img.decode();image={width:img.naturalWidth,height:img.naturalHeight,src};}
   return{rect:r.toJSON(),background:s.backgroundImage,backgroundSize:s.backgroundSize,source:s.borderImageSource,scroll:[n.scrollWidth,n.clientWidth,n.scrollHeight,n.clientHeight],image,heading:semantic(heading),description:semantic(description),legacyLogo:getComputedStyle(n.querySelector('.logo')).display};
  });
  assert(h.rect.width>0&&h.rect.left>=-1&&h.rect.right<=width+1,'Hero outside viewport '+JSON.stringify(h));
  assert(Math.abs(h.rect.height-h.rect.width*1004/1567)<=1,'Hero artwork stretched '+JSON.stringify(h));
  assert.equal(h.source,'none','Retired frame must not overlay complete artwork');
  assert.equal(h.backgroundSize.split(',')[0].trim(),'contain','Complete artwork must not be cropped');
  assert.deepEqual(h.image&&[h.image.width,h.image.height],[1567,1004],'Approved artwork must decode at its original dimensions');
  assert.equal(h.legacyLogo,'none','Separate logo would duplicate the approved artwork');
  assert(h.scroll[0]<=h.scroll[1]+1&&h.scroll[2]<=h.scroll[3]+1,'Hero overflows '+JSON.stringify(h));
  assert.match(h.heading.text,/SÜKÛN/,'Semantic brand heading missing');
  assert(h.description.text.length>0,'Semantic description missing');
  for(const text of [h.heading,h.description])assert(!text.hidden&&text.display!=='none'&&text.visibility==='visible','Semantic text removed from accessibility tree '+JSON.stringify(text));
  assert.equal(await header.getByRole('heading',{level:1,name:'SÜKÛN',exact:true}).count(),1,'Brand heading must remain accessible');
  assert(h.heading.recovery&&h.heading.pointerEvents==='auto','Original recovery gesture target missing');
  for(const edge of ['left','right','top','bottom'])assert(Math.abs(h.heading.rect[edge]-h.rect[edge])<=1,'Recovery target must cover artwork '+JSON.stringify(h));
  assert.match(h.heading.color,/^(transparent|rgba\(0,\s*0,\s*0,\s*0\))$/,'Recovery text must not duplicate artwork');
  assert.equal(h.description.clip,'inset(50%)','Description should remain screen-reader-only');
  return h;
 });
 await check(width,'navigation',async()=>{
  await p.screenshot({path:path.join(dir,`${width}-hero-and-nav.png`)});
  // The r1160 design has six equal targets in one full-width row. Keep the
  // strict actual-frame text bounds: the layout update is not a bevel waiver.
  const rows=await frames('.wrap > nav.tabs > button',6);assert.equal(rows.length,6);
  const nav=await p.locator('.wrap>nav.tabs').evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),scroll:[n.scrollWidth,n.clientWidth],labels:[...n.querySelectorAll(':scope>button')].map(b=>{const r=b.getBoundingClientRect(),ic=b.querySelector('.tbIc,.tbRub')?.getBoundingClientRect();return{r:r.toJSON(),icon:ic?.toJSON()}})}));
  assert(nav.rect.left>=-1&&nav.rect.right<=width+1,'Navigation outside viewport');
  assert(nav.scroll[0]<=nav.scroll[1]+1,'Navigation scrolls horizontally');
  const first=nav.labels[0].r;
  for(const [i,b] of nav.labels.entries()){
   assert(b.r.width>=44&&b.r.height>=44,'Navigation target too small');
   assert(Math.abs(b.r.top-first.top)<=1&&Math.abs(b.r.height-first.height)<=1&&Math.abs(b.r.width-first.width)<=1,'Navigation must have six equal targets in one row');
   assert(!i||b.r.left>=nav.labels[i-1].r.right-1,'Navigation targets overlap');
   assert(b.r.left>=nav.rect.left-1&&b.r.right<=nav.rect.right+1,'Navigation target outside rail');
   assert(b.icon&&Math.abs((b.icon.left+b.icon.right-b.r.left-b.r.right)/2)<3,'Navigation icon off center');
   assert(rows[i].lines.length,'Navigation label missing');
  }
  return{nav,rows};
 });
 // Berhetiyye practice intentionally hides the master bar while its tools are
 // collapsed. Open the actual tools control before measuring it.
 if(await p.locator('#r938Panel').getAttribute('data-open')!=='true')await tap('#r938PanelToggle');
 if(!(await p.evaluate(()=>document.body.classList.contains('r920-details-open'))))await tap('#r920More');
 await check(width,'master-quick-controls',async()=>{await place('#dock');const rows=await frames('#dock > button.dockItem',6);for(const r of rows)assert(r.rect.width>=44&&r.rect.height>=44,'Master control target too small');const words=await wholeQuickLabels();const timer=await p.locator('#sleepTimer').evaluate(el=>{let s=getComputedStyle(el),c=document.createElement('canvas').getContext('2d');c.font=s.font;return{text:el.selectedOptions[0].textContent,w:el.clientWidth,p:parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),textW:c.measureText(el.selectedOptions[0].textContent).width}});assert(timer.textW<=timer.w-timer.p+1,'Timer text clipped');await p.locator('.masterBar').screenshot({path:path.join(dir,`${width}-master-controls.png`)});return{rows,timer,words}});
 // Use the app's session entry: it opens the enclosing tools and session hub.
 // Opening only nested <details> nodes does not reveal their closed parent.
 await tap('#r1082SessionEntry');await p.locator('#r170SessionHub[open]').waitFor({state:'visible'});await p.waitForTimeout(500);
 for(const [name,selector,min] of [['session-order','#r1082OrderTitle',1],['session-preflight','#r1092PreflightSummary',1],['session-stage','#r1082StageNav>button',3],['session-presets','#r170PresetPills>button',3],['session-actions','#r170CurrentAdd,#r170FreqAdd,#r170SilenceAdd,#r170ClearQ',4]])await check(width,name,async()=>{const rows=await frames(selector,min);await place(selector);await p.locator(selector).filter({visible:true}).first().screenshot({path:path.join(dir,`${width}-${name}.png`)});return rows});
 await check(width,'compact-dock',async()=>{
  await tap('#r170SilenceAdd');await p.waitForFunction(()=>!document.querySelector('#r170StartSession').disabled);await tap('#r170StartSession');
  await p.waitForFunction(()=>document.body.classList.contains('r431-dock-visible'),null,{timeout:15000});
  await p.evaluate(()=>window.SukunDockCollapse?.set?.(true));await p.waitForTimeout(500);
  const peek=p.locator('#r433DockPeek');assert(await peek.isVisible(),'Dock peek not visible after collapse');
  await peek.screenshot({path:path.join(dir,`${width}-compact-dock.png`)});
  const rows=await frames('#r433DockPeek');assert.equal(rows.length,1);const r=rows[0].rect;
  // r1197 intentionally supersedes r1149's right-aligned 190px handle with
  // one centered handle, capped at 300px and with at least 12px side gutters.
  assert(Math.abs(r.width-Math.min(300,width-24))<=1,'Collapsed dock width differs from current design '+JSON.stringify(rows[0]));
  assert(Math.abs((r.left+r.right)/2-width/2)<=1,'Collapsed dock not centered');
  assert(r.left>=11&&r.right<=width-11&&r.top>=0&&r.bottom<=p.viewportSize().height+1,'Collapsed dock outside safe viewport');
  assert(r.height>=44&&rows[0].lines.length,'Collapsed dock lacks a readable touch target');
  assert(rows[0].lines.some(l=>l.text==='Oynatıcıyı göster'),'Player restore label missing');
  await tap('#r433DockPeek');
  await p.waitForFunction(()=>!document.body.classList.contains('r433-dock-hidden'));
  assert.equal(await peek.isVisible(),false,'Peek did not hide after restoring player');
  assert(await p.locator('#r170Now').isVisible(),'Original player did not return');
  return{rows,restoredByRealClick:true};
 });
 await f.close();f=null;
 }}catch(error){report.fatal=error.stack||String(error);console.log(report.fatal)}finally{if(f)await f.close().catch(()=>{});save();console.log(JSON.stringify({passed:report.passed,total:report.total,expectedChecks:report.expectedChecks,allPassed:report.allPassed,fatal:report.fatal,dir}));if(!report.allPassed)process.exitCode=1}})();
