'use strict';
// Exact shipped bytes; synthetic disposable profile, no personal data/audio.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const out=path.resolve(process.argv[3]||'/tmp/r1251-alignment/report.json');
const images=path.join(path.dirname(out),'screenshots');fs.mkdirSync(images,{recursive:true});
const report={build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sources:{},checks:[],limitations:['Synthetic Chromium TR/EN responsive geometry and screenshots, not physical Android or human visual approval.','Opening native details for coverage is setup, not a test of accordion click behavior.','No acoustic, screen-reader or operating-system fullscreen acceptance claimed.']};
for(const n of ['index.html','nero.html','css/visual-polish-r1232.css'])report.sources[n]=hash(fs.readFileSync(path.join(root,n)));
let f,p,tag;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(c=>c.passed).length;report.allPassed=!report.fatal&&report.total===141&&report.total===report.passed;fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n')}
async function check(name,fn){try{report.checks.push({tag,name,passed:true,evidence:await fn()})}catch(e){report.checks.push({tag,name,passed:false,error:e.stack});}save()}
async function settle(){await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(180)}
async function tab(t){await p.locator('.tab[data-t="'+t+'"]').evaluate(n=>n.click());await settle()}
async function expand(s){await p.locator(s).evaluateAll(ns=>ns.forEach(n=>{if(n.tagName==='DETAILS')n.open=true;for(const d of n.querySelectorAll('details'))d.open=true}));await settle()}
async function screenshot(name,selector){const n=p.locator(selector).first();assert(await n.isVisible(),selector+' must be visible');await n.scrollIntoViewIfNeeded();await p.screenshot({path:path.join(images,tag+'-'+name+'.png')})}
async function boxes(selector,{maxWidth,center=false,text=true}={}){
 const rows=await p.locator(selector).evaluateAll(ns=>ns.filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').map(n=>{
  const b=n.getBoundingClientRect(),s=getComputedStyle(n),parent=n.parentElement.getBoundingClientRect();const rects=[];
  if(!['SELECT','INPUT'].includes(n.tagName)){const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);while(w.nextNode()){if(!w.currentNode.textContent.trim()||!w.currentNode.parentElement.getClientRects().length)continue;const r=document.createRange();r.selectNodeContents(w.currentNode);for(const q of r.getClientRects())if(q.width&&q.height)rects.push(q.toJSON())}}
  return{id:n.id,text:n.textContent.trim().slice(0,180),box:b.toJSON(),parent:parent.toJSON(),scroll:n.scrollWidth,client:n.clientWidth,align:s.textAlign,rects,viewport:innerWidth};
 }));assert(rows.length>0,'No visible coverage: '+selector);
 for(const r of rows){assert(r.box.left>=-2&&r.box.right<=r.viewport+2,'Viewport overflow '+JSON.stringify(r));assert(r.scroll<=r.client+2,'Internal overflow '+JSON.stringify(r));if(maxWidth)assert(r.box.width<=maxWidth+2,'Excessive width '+JSON.stringify(r));if(center)assert(Math.abs((r.box.left+r.box.right-r.parent.left-r.parent.right)/2)<=4,'Not centered in parent '+JSON.stringify(r));if(text)for(const t of r.rects)assert(t.left>=r.box.left-2&&t.right<=r.box.right+2&&t.top>=r.box.top-2&&t.bottom<=r.box.bottom+2,'Text outside frame '+JSON.stringify(r));}
 return rows;
}
(async()=>{try{
 f=await fixture(root,{width:390,height:1000,seed:{'sukun.onboardSeen':'1','sukun.obDone':'1','sukun.obSeenBuild':JSON.stringify(report.build),'sukun.r920.focus':'0'}});p=f.page;
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{window.obClose?.();document.getElementById('dcClose')?.click();KLT_AC('LABELLED-r1251-alignment-disposable-profile')});
 await p.evaluate(()=>SukunTabOwner.run('manual',()=>SukunSessionState.command('select',{mode:'berhet',index:0,journeyKind:'single'}),{prime:false,releaseAfter:true}));await p.waitForFunction(()=>document.documentElement.dataset.r1074Theme==='berhet');
 for(const lang of ['tr','en'])for(const width of [320,390,768,1440,1920]){
  tag=lang+'-'+width;await p.setViewportSize({width,height:1000});await p.evaluate(l=>I18N.set(l),lang);await tab('amb');
  await check('Discovery center and bounded width',()=>boxes('#sukunDiscovery .discoveryGrid',{maxWidth:560,center:true,text:false}));
  await check('Ambience symmetric centered compact headings',()=>boxes('#mixer .preAccHead',{maxWidth:440,center:true}));await screenshot('ambience','#mixer');
  await tab('frq');await expand('#frequencyAdvancedR1120');await expand('#frequencyWorkbenchR1120');await expand('#r1107PresetsBox');
  await check('Frequency start compact',()=>boxes('#frToggle',{maxWidth:440}));
  await check('Frequency summaries compact and centered',()=>boxes('#frequencyAdvancedR1120>summary,#r1107PresetsBox>summary',{maxWidth:560,center:true}));
  await check('Octave and import-export compact',()=>boxes('#fr1120-octDown,#fr1120-octUp,#expBtn,#impBtn',{maxWidth:440}));
  await check('Workbench selected values centered',async()=>{const rs=await p.locator('#frequencyWorkbenchR1120 select').evaluateAll(ns=>ns.filter(n=>n.getClientRects().length).map(n=>{const s=getComputedStyle(n),c=document.createElement('canvas').getContext('2d');c.font=s.font;return{id:n.id,align:s.textAlignLast,text:n.selectedOptions[0]?.textContent,width:c.measureText(n.selectedOptions[0]?.textContent||'').width,available:n.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-16}}));assert(rs.length);for(const r of rs){assert.equal(r.align,'center');assert(r.width<=r.available+2,JSON.stringify(r))}return rs});
  await check('Preset category heads compact',()=>boxes('#presets .preAccHead',{maxWidth:520,center:true}));
  await p.locator('#presets .preAcc').evaluateAll(ns=>ns.forEach(n=>{if(!n.classList.contains('open'))n.querySelector('.preAccHead')?.click()}));await settle();
  await check('Preset cards and text contained after open',()=>boxes('#presets .pre'));await screenshot('frequency-presets','#presets');
  await tab('zkr');await expand('#r920Practice');
  await check('Zikir preparation compact',()=>boxes('#r1082SessionEntry',{maxWidth:440}));await screenshot('zikir','#r920Practice');
  await check('Reading summaries and description text contained',async()=>{const accepted=await p.evaluate(()=>SukunDiscoveryR1158.open('okumalar',document.querySelector('[data-discovery=okumalar]')));assert.equal(accepted,true,'Native readings route accepted');await p.waitForFunction(()=>document.body.classList.contains('r920-details-open')&&document.getElementById('zmgOkumalar')?.open);await settle();const selector='#zmgOkumalar :is(#dhBox,#dlBox,#akBox,#surah-abese,#surah-tarik)>summary';assert.equal(await p.locator(selector).count(),5,'All requested reading summaries must exist');const headings=await boxes(selector);await screenshot('readings','#zmgOkumalar');return headings});
  await tab('rx');await expand('#tab-rx');await check('Arrangement actions and headings contained',()=>boxes('#todayCard .tcRow>button:not([hidden]),#vakitBox>summary,#tab-rx .rxHead'));await screenshot('arrangement','#tab-rx');
  await tab('ntf');await check('Notification controls contained',()=>boxes('#tab-ntf .r554NotifyFilters button,#tab-ntf .r554NotifyTools button,#r607CenterMaint .r607MaintBtn'));await screenshot('notifications','#tab-ntf');
  await check('Explicit hidden controls remain hidden',async()=>{const bad=await p.locator('#todayCard [hidden],#tab-ntf [hidden],#sukunBerhetGate .sbg-back[hidden]').evaluateAll(ns=>ns.filter(n=>n.getClientRects().length).map(n=>n.id||n.className));assert.deepEqual(bad,[]);return{bad}});
  await check('Tekke purpose and Mihrab cards contained',async()=>{try{await p.evaluate(()=>Tekke.hazirla().open());await settle();const purpose=await boxes('#tk .r992PurposeBtn');await screenshot('tekke-purpose','#tk');await p.evaluate(()=>Tekke.hazirla().openSettings());await settle();const tabs=await p.locator('#tk [data-tk-tab]').evaluateAll(ns=>ns.map(n=>n.dataset.tkTab)),panels=[];assert(tabs.length);for(const t of tabs){await p.locator('#tk [data-tk-tab="'+t+'"]').evaluate(n=>n.click());await settle();const headings=await boxes('#tk #panel .pSec .pT');let cards=[];if(await p.locator('#tk #panel .imgeKartAna:visible').count()){cards=await boxes('#tk #panel .imgeKartAna');}panels.push({tab:t,headings,cards});await screenshot('tekke-mihrab-'+t,'#tk #panel');}return{purpose,panels}}finally{await p.evaluate(()=>{Tekke.hazirla().closeSettings();Tekke.hazirla().close()})}});
 }
 tag='source-integrity';await check('Source hashes and SRI retained',async()=>{for(const[n,h]of Object.entries(report.sources))assert.equal(hash(fs.readFileSync(path.join(root,n))),h);assert(!f.consoleErrors.some(e=>/integrity|digest|SRI/i.test(e)));assert.deepEqual(f.errors,[]);return f.evidence()});
}catch(e){report.fatal=e.stack}finally{if(f)await f.close().catch(()=>{});save();console.log(JSON.stringify({allPassed:report.allPassed,total:report.total,passed:report.passed,fatal:report.fatal}));if(!report.allPassed)process.exitCode=1}})();
