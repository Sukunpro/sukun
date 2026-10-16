'use strict';
// Exact production CSS/DOM in isolated Chromium. Native trusted clicks cover
// source disclosure, visibility preference and contemplation entry/exit.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(__dirname,'evidence/reading-summary-browser.json'));
const report={suite:'r1075 Berhetiyye compact reading strip materials and native controls',build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),startedAt:new Date().toISOString(),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),cssSha256:hash(fs.readFileSync(path.join(root,'assets/runtime/compact-ui-r1057.css'))),testSha256:hash(fs.readFileSync(__filename)),checks:[],profiles:[],limitations:[
 'Isolated headless Linux Chromium in Classic/Feyz at 320×640 and 390×844, Turkish and English. Production files are served byte-for-byte; external font requests and service workers are blocked by the common engineering fixture.',
 'No playback, personal recording access or microphone is requested. Session selection and the controls-visibility preference use public production APIs. Source disclosure, visibility toggles and contemplation entry/exit use trusted native browser clicks.',
 'Assertions cover native node identity, layout bounds, computed material paint and idle counter/transport state. Physical Android appearance, audible sound, OS locking and service-worker activation are outside this visual suite.'
]};
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=!!report.total&&report.passed===report.total;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));}
async function profile(width,height){
 const label=width+'x'+height,f=await fixture(root,{width,height,seed:{'sukun.kilitAcik':'true','sukun.esma.background.r923':'classic'}}),p=f.page;
 async function idle(){await p.waitForFunction(()=>!SukunInteractionGateR732.active(),null,{timeout:5000});await p.waitForTimeout(100);}
 async function tap(selector){await idle();await p.locator(selector).click();await idle();}
 async function state(){return p.evaluate(()=>{
  const ids=['r1056ReadingSummary','r986Total','totalCnt','r1056ReadingSource','r1056ReadingTempo','r1056ReadingExplanation'];
  const nodes=Object.fromEntries(ids.map(id=>{const e=document.getElementById(id),s=getComputedStyle(e),r=e.getBoundingClientRect();return[id,{count:document.querySelectorAll('#'+id).length,parent:e.parentElement.id,hidden:e.hidden,text:e.textContent,expanded:e.getAttribute('aria-expanded'),display:s.display,borderImage:s.borderImageSource,borderImageSlice:s.borderImageSlice,borderImageWidth:s.borderImageWidth,borderRightColor:s.borderRightColor,background:s.background,backgroundColor:s.backgroundColor,grid:s.gridTemplateColumns,left:r.left,right:r.right,width:r.width,height:r.height,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}]}));
  return{build:SUKUN_BUILD,lang:I18N.lang,layout:SukunLayoutModes.current(),skin:SukunShellSkin.getAppearance(),mode:document.getElementById('r920Practice').dataset.mode,tef:SUKUN_TEFEKKUR.active(),compact:SukunCompactUI.snapshot(),sameNodes:!!window.__r1075Nodes&&ids.every(id=>__r1075Nodes[id]===document.getElementById(id)),focusControls:SukunBerhetLayout.snapshot().focusControlsVisible,nodes,selected:{mode:zKat(),index:zIdx()},transport:{auto:Z.auto,count:Z.count,total:Z.total,phase:SukunSessionState.snapshot().phase},page:{width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth},clicks:window.__r1075Clicks.slice()};
 });}
 async function check(name,fn){try{report.checks.push({profile:label,name,passed:true,evidence:await fn()});}catch(error){report.checks.push({profile:label,name,passed:false,error:error.stack||String(error),state:await state().catch(()=>null)});}save();console.log(JSON.stringify({profile:label,name,passed:report.checks.at(-1).passed}));}
 function material(s,family){
  assert.equal(s.mode,family);assert.equal(s.selected.mode,family);assert.equal(s.compact.sharedStrip,true);assert.equal(s.compact.nativeTotal,true);assert.equal(s.sameNodes,true);
  for(const[id,n]of Object.entries(s.nodes))assert.equal(n.count,1,'one native '+id);
  const strip=s.nodes.r1056ReadingSummary,source=s.nodes.r1056ReadingSource,total=s.nodes.r986Total;
  assert.equal(strip.parent,'r920Practice');assert.equal(total.parent,'r1056ReadingSummary');assert.equal(source.parent,'r1056ReadingSummary');assert.equal(strip.display,'grid');assert.equal(strip.hidden,false);
  if(family==='berhet'){assert.match(strip.borderImage,/panel-emerald-r932\.webp/);assert.equal(strip.borderImageSlice,'250');assert.equal(strip.borderImageWidth,'7px');assert.match(source.borderImage,/gem-sapphire-r933\.webp/);assert.equal(source.borderImageSlice,'330 fill');assert.equal(source.borderImageWidth,'5px');}
  else{assert.equal(strip.borderImage,'none');assert.equal(source.borderImage,'none');assert.equal(strip.backgroundColor,'rgba(7, 31, 41, 0.73)');}
  assert.equal(total.borderImage,'none','Native total stays transparent inside the shared bezel');assert.equal(total.backgroundColor,'rgba(0, 0, 0, 0)');assert.equal(s.transport.auto,false);assert.equal(s.transport.count,0);
  assert(s.page.scroll<=s.page.client+1,'No page horizontal overflow: '+JSON.stringify(s.page));assert(strip.left>=-1&&strip.right<=s.page.width+1,'Strip stays in viewport');
  assert(strip.scrollWidth<=strip.clientWidth+1,'Strip content does not overflow horizontally');
  for(const id of ['r986Total','r1056ReadingSource','r1056ReadingTempo']){const n=s.nodes[id];assert(n.left>=strip.left-1&&n.right<=strip.right+1,id+' stays inside the strip');assert(n.scrollWidth<=n.clientWidth+1,id+' text wraps');}
  assert(source.height>=44,'Source keeps native touch target');
  assert.equal(s.nodes.r986TotalLabel,undefined);assert.match(s.nodes.r1056ReadingTempo.text,s.lang==='en'?/^Selected tempo:/:/^Seçili tempo:/);
 }
 async function select(family){const result=await p.evaluate(family=>SukunSessionState.command('select',{mode:family,journeyKind:'single',index:0}),family);assert.equal(result.accepted,true,JSON.stringify(result));await p.waitForFunction(family=>SukunSceneEngine.snapshot().selectionTheme.family===family&&SukunSceneEngine.snapshot().sceneLoad==='ready',family,{timeout:15000});await idle();}
 async function enter(){if(await p.locator('#r938Panel').getAttribute('data-open')!=='true')await tap('#r938PanelToggle');await tap('#r920TefEnter');await p.waitForFunction(()=>SUKUN_TEFEKKUR.active());await idle();}
 async function exit(){await tap('#r920TefExit');await p.waitForFunction(()=>!SUKUN_TEFEKKUR.active());await idle();}
 async function screenshot(name){await p.locator('#r1056ReadingSummary').scrollIntoViewIfNeeded();await idle();const file=path.join(path.dirname(output),name+'.png');await p.screenshot({path:file});const crop=path.join(path.dirname(output),name+'-strip.png');await p.locator('#r1056ReadingSummary').screenshot({path:crop});return{viewport:file,strip:crop};}
 async function disclosure(family){const before=await state();const expanded=before.nodes.r1056ReadingSource.expanded==='true';await tap('#r1056ReadingSource');const opened=await state();material(opened,family);assert.equal(opened.nodes.r1056ReadingSource.expanded,String(!expanded));assert.equal(opened.nodes.r1056ReadingExplanation.hidden,expanded);assert(opened.clicks.some(x=>x.id==='r1056ReadingSource'&&x.trusted));assert.deepEqual(opened.transport,before.transport);await tap('#r1056ReadingSource');const closed=await state();assert.equal(closed.nodes.r1056ReadingExplanation.hidden,!expanded);assert.deepEqual(closed.transport,before.transport);return{before,opened,closed};}
 async function visibility(family){const before=await state();await tap('#r1056FocusControlsToggle');const hidden=await state();assert.equal(hidden.nodes.r1056ReadingSummary.hidden,true);assert.equal(hidden.nodes.r1056ReadingSummary.display,'none');assert.equal(hidden.focusControls,false);assert.equal(hidden.sameNodes,true);assert.equal(await p.locator('#r1056FocusControlsToggle').isVisible(),true);assert.equal(await p.locator('#r1056ReadingSource').isVisible(),false);assert.deepEqual(hidden.transport,before.transport);await tap('#r1056FocusControlsToggle');const shown=await state();material(shown,family);assert.equal(shown.focusControls,true);assert.deepEqual(shown.transport,before.transport);return{before,hidden,shown};}
 try{
  await p.evaluate(()=>{KLT_AC('r1075-reading-summary-fixture');SPK.on=false;NIYET.on=false;NIYET.spk=false;Z.tick=false;Z.vib=false;SukunBerhetLayout.setFocusControls(true);window.__r1075Clicks=[];document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b)__r1075Clicks.push({id:b.id,trusted:e.isTrusted})},true);});
  await select('berhet');await tap('.tab[data-t="zkr"]');
  await p.evaluate(()=>{window.__r1075Nodes=Object.fromEntries(['r1056ReadingSummary','r986Total','totalCnt','r1056ReadingSource','r1056ReadingTempo','r1056ReadingExplanation'].map(id=>[id,document.getElementById(id)]));});
  await check('Candidate is Classic/Feyz with one durable compact strip',async()=>{const s=await state();assert.equal(s.build,report.build);assert.equal(s.layout,'classic');assert.equal(s.skin,'feyz');material(s,'berhet');return s;});
  for(const lang of ['tr','en']){
   await p.evaluate(lang=>I18N.set(lang),lang);await select('berhet');await idle();
   await check(lang+' Berhetiyye normal has hollow panel and sapphire source without overflow',async()=>{const s=await state();material(s,'berhet');assert.equal(s.tef,false);return{state:s,screenshots:await screenshot('berhet-normal-'+width+'-'+lang)};});
   await check(lang+' normal source disclosure responds to trusted native clicks',()=>disclosure('berhet'));
   await check(lang+' normal hide/show policy preserves nodes and transport',()=>visibility('berhet'));
   await check(lang+' Berhetiyye contemplation keeps the same materials and native nodes',async()=>{await enter();const s=await state();material(s,'berhet');assert.equal(s.tef,true);return{state:s,screenshots:await screenshot('berhet-tefekkur-'+width+'-'+lang)};});
   await check(lang+' contemplation source disclosure responds to trusted native clicks',()=>disclosure('berhet'));
   await check(lang+' contemplation hide/show policy preserves nodes and transport',()=>visibility('berhet'));
   await check(lang+' contemplation exit preserves the same summary/count/source nodes',async()=>{const before=await state();await exit();const after=await state();material(after,'berhet');assert.equal(after.tef,false);assert.deepEqual(after.transport,before.transport);return{before,after};});
   await check(lang+' Esma restores its original normal strip and source paint',async()=>{await select('esma');const s=await state();material(s,'esma');assert.equal(s.tef,false);return s;});
   await check(lang+' Esma contemplation restores original paint with the same native nodes',async()=>{await enter();const s=await state();material(s,'esma');assert.equal(s.tef,true);return s;});
   await check(lang+' Esma exit and Berhetiyye re-entry retain one total and reapply material',async()=>{await exit();await select('berhet');const s=await state();material(s,'berhet');assert.equal(s.tef,false);return s;});
  }
  await check('Every served production byte matches disk with no missing files or JS/SRI faults',async()=>{const e=f.evidence();for(const[name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'Source changed: '+name);assert.deepEqual(e.pageErrors,[]);assert.deepEqual(e.failedRequests,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));report.profiles.push({label,browser:f.browser.version(),evidence:e});return{servedFiles:Object.keys(e.served).length,pageErrors:e.pageErrors,failedRequests:e.failedRequests};});
 }finally{await f.close();}
}
(async()=>{try{for(const[width,height]of[[320,640],[390,844]])await profile(width,height);}catch(error){report.fatal=error.stack||String(error);console.error(error);}report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({build:report.build,passed:report.passed,total:report.total,output,failed:report.checks.filter(x=>!x.passed).map(x=>({profile:x.profile,name:x.name,error:x.error})),fatal:report.fatal},null,2));if(!report.allPassed||report.fatal)process.exitCode=1;})();
