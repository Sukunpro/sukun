'use strict';
// Real production DOM and CSS in disposable Classic/Feyz profiles. Native
// BrowserContext deviceScaleFactor provides actual Chromium DPR; no style, theme or control mocks.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1135-mobile-layout.json');
const baseline=process.argv[4]?path.resolve(process.argv[4]):null;
const {fixture,hash}=require(path.join(root,'tests/r1064/browser-fixture.cjs'));
const shotDir=path.join(path.dirname(output),'button-clarity');
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim();
// A focused rerun may isolate the 393px profile; the default retains all 3.
const profiles=process.env.SUKUN_VISUAL_QUICK==='1'?[{width:393,dpr:2}]:[{width:360,dpr:3},{width:393,dpr:2}];
const selectors=['.r920Stats>span','.tab[data-t="zkr"]','#r986Sections button','#r1082SessionEntry','#r1056FocusControlsToggle','#r938PanelToggle','#r932QuickWheel','#r932QuickScene','#r932EasyPlay','#r932EasyStop','#r920Previous','#r920Restart','#r920Next','#r920TefEnter','#r920Actions button','#r920ViewOptions > summary'];
const report={suite:'r1135 real mobile navigation and gemstone text fit',build,expectedChecks:profiles.length*2,startedAt:new Date().toISOString(),testSha256:hash(fs.readFileSync(__filename)),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),checks:[],profiles:[],limitations:[
 'Disposable Linux headless Chromium BrowserContexts use native deviceScaleFactor at DPR 2/3. These images do not establish physical Samsung/Windows display sharpness or photograph quality.',
 'Public session selection and disposable KLT_AC/KLT_KILITLE APIs establish unlocked/locked cases without changing policy. Native handlers, CSS, themes, widths and element visibility remain unmodified.',
 'Body-level layout-dialog opening uses its public production API; real controls close it. The shell remains Classic. Picker and Ambiyans routing use real clicks.',
 'Computed paint, element/text geometry, real focus/click/disclosure behavior and nonpersonal screenshot panels are checked. Visual screenshot inspection is separate from these assertions.',
 'The shared fixture owns the exact-byte HTTP server and browser. Visual-only contexts set their native DPR and leave speech unused; this suite starts no audio or recording. Service workers/external traffic are blocked.'
]};
let f,p,profile;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total===report.expectedChecks&&report.passed===report.total&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function state(){return p.evaluate(()=>({theme:document.documentElement.dataset.r1074Theme,dock:document.documentElement.dataset.r933BerhetDock,unlocked:SukunSecretPolicy.unlocked(),mode:SukunSessionState.snapshot().activeMode,total:Z.total,auto:Z.auto,layout:SukunLayoutModes.current(),skin:SukunShellSkin.getAppearance(),dpr:devicePixelRatio,width:innerWidth}));}
async function idle(){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());await p.waitForTimeout(100);}
async function tap(selector){await idle();if(await p.locator('#kandil.on').isVisible())await p.locator('#kandil.on').click({position:{x:20,y:20}});const n=p.locator(selector).first();assert(await n.isVisible(),'Expected visible real control '+selector);await n.scrollIntoViewIfNeeded();await n.click({timeout:10000});await idle();}
async function select(mode){const r=await p.evaluate(mode=>SukunSessionState.command('select',{mode,index:8,journeyKind:'single'}),mode);assert.equal(r.accepted,true,JSON.stringify(r));await p.waitForFunction(mode=>document.documentElement.dataset.r1074Theme===mode&&SukunSceneEngine.snapshot().selectionTheme.family===mode,mode,{timeout:20000});await idle();}
async function settings(){if(await p.locator('#r938PanelToggle').getAttribute('aria-expanded')!=='true')await tap('#r938PanelToggle');await p.locator('#r938PanelBody').waitFor({state:'visible'});}
async function unlock(){assert.equal(await p.evaluate(()=>KLT_AC('LABELLED-r1133-disposable-visual-profile')),true);await select('berhet');await settings();}
async function paints(wanted=selectors){return p.evaluate(selectors=>{
 const rows=[];
 for(const selector of selectors)for(const[nIndex,n]of [...document.querySelectorAll(selector)].entries()){
  const s=getComputedStyle(n),r=n.getBoundingClientRect();if(!r.width||!r.height||s.visibility==='hidden'||s.display==='none')continue;
  const pseudo=side=>{const x=getComputedStyle(n,side);return{content:x.content,background:x.backgroundImage,filter:x.filter}};
  const textRects=[],walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let text;
  while((text=walker.nextNode())){
   if(!text.textContent.trim())continue;const parent=text.parentElement,style=getComputedStyle(parent);if(style.display==='none'||style.visibility==='hidden')continue;
   const range=document.createRange();range.selectNodeContents(text);
   for(const box of range.getClientRects())if(box.width&&box.height)textRects.push({text:text.textContent.trim().slice(0,80),rect:box.toJSON()});
  }
  rows.push({key:selector+':'+nIndex,id:n.id,tag:n.tagName,text:n.textContent.trim().replace(/\s+/g,' ').slice(0,160),textRects,rect:r.toJSON(),clientWidth:n.clientWidth,scrollWidth:n.scrollWidth,border:s.borderImageSource,slice:s.borderImageSlice,borderWidth:s.borderImageWidth,borderRepeat:s.borderImageRepeat,background:s.backgroundImage,backgroundSize:s.backgroundSize,color:s.color,filter:s.filter,material:s.getPropertyValue('--r1133-material').trim(),radius:s.borderRadius,padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft],disabled:!!n.disabled,before:pseudo('::before'),after:pseudo('::after')});
 }
 return rows;
},wanted);}
async function screenshot(name){const files={};await settings();const hero=p.locator('#r938Hero');if(await hero.isVisible()){const file=path.join(shotDir,name+'-hero.png');await hero.screenshot({path:file,animations:'disabled',scale:'device'});files.hero=file;}const panel=p.locator('#r938Panel');const target=path.join(shotDir,name+'-controls.png');await panel.screenshot({path:target,animations:'disabled',scale:'device'});files.controls=target;const sections=p.locator('#r986Sections');if(await sections.isVisible()){const file=path.join(shotDir,name+'-sections.png');await sections.screenshot({path:file,animations:'disabled',scale:'device'});files.sections=file;}return files;}
async function open(source,label){
 const b=fs.readFileSync(path.join(source,'version.txt'),'utf8').trim(),seed={'sukun.ui.shellMode':'classic','sukun.shell.r716':'1','sukun.obSeenBuild':JSON.stringify(b),'sukun.obDone':'1','sukun.onboardSeen':'1','sukun.theme':'"feyz"','sukun.esma.background.r923':'classic','sukun.r920.focus':'0','sukun.zikir.quickControls.focus.v1':'1'};
 const x=await fixture(source,{width:profile.width,height:950,voices:'tr',seed});f=x;
 // A CDP override alone can be reset by locator screenshot viewport changes.
 // Native BrowserContext DPR remains correct through all screenshots/resizes.
 const originalClose=x.close.bind(x),originalEvidence=x.evidence.bind(x);await x.context.close();
 const context=await x.browser.newContext({viewport:{width:profile.width,height:950},deviceScaleFactor:profile.dpr,locale:'tr-TR',serviceWorkers:'block'});
 const errors=[],consoleErrors=[],failed=[],external=[];
 x.context=context;x.close=async()=>{await context.close();await originalClose();};
 x.evidence=()=>{const e=originalEvidence();return{...e,pageErrors:[...e.pageErrors,...errors],consoleErrors:[...e.consoleErrors,...consoleErrors],failedRequests:[...e.failedRequests,...failed],externalBlocked:[...e.externalBlocked,...external]};};
 await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(x.origin+'/')||/^(data|blob):/.test(url))return route.continue();external.push(url);return route.abort();});
 await context.addInitScript(seed=>{for(const[key,value]of Object.entries(seed))if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},seed);
 p=await context.newPage();x.page=p;p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.stack||e.message));p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});p.on('requestfailed',r=>{if(r.url().startsWith(x.origin))failed.push({url:r.url(),error:r.failure()?.errorText})});
 await p.goto(x.origin+'/nero.html',{waitUntil:'load',timeout:60000});await p.waitForFunction(()=>window.SukunSceneEngine&&window.SukunPracticeUI&&window.SukunSecretPolicy&&window.SukunBerhetLayout);await p.waitForTimeout(2200);await idle();assert.equal(await p.evaluate(()=>devicePixelRatio),profile.dpr,'Native Chromium DPR');
 if(await p.locator('#obSkip').isVisible())await p.locator('#obSkip').click();
 const daily=p.locator('#dailyCard');
 if(await daily.isVisible()){
  await p.keyboard.press('Escape');
  try{await daily.waitFor({state:'hidden',timeout:2500});}
  catch(error){if(await daily.isVisible())await p.locator('#dcClose').click({timeout:5000});await daily.waitFor({state:'hidden',timeout:5000});}
 }
 await tap('.tab[data-t="zkr"]');return{label,browser:x.browser.version()};
}
async function check(name,fn){try{report.checks.push({profile:{...profile},name,passed:true,evidence:await fn()});}catch(error){let failedShot=null;if(p)try{failedShot=path.join(shotDir,'failure-'+profile.width+'-'+report.checks.length+'.png');await p.screenshot({path:failedShot,animations:'disabled'});}catch(_){}report.checks.push({profile:{...profile},name,passed:false,error:error.stack||String(error),screenshot:failedShot,state:await state().catch(()=>null)});}save();console.log(JSON.stringify({profile,name,passed:report.checks.at(-1).passed}));}

async function visibleRows(selector){
 const rows=[];const nodes=p.locator(selector);
 for(let i=0;i<await nodes.count();i++){
  const n=nodes.nth(i);if(!await n.isVisible())continue;
  await n.scrollIntoViewIfNeeded();await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  rows.push(await n.evaluate(node=>{
   const r=node.getBoundingClientRect(),s=getComputedStyle(node),texts=[];
   const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let t;
   while((t=walker.nextNode())){if(!t.textContent.trim())continue;
    const el=t.parentElement,es=getComputedStyle(el);if(es.display==='none'||es.visibility==='hidden'||el.closest('[aria-hidden="true"],.ico,.sIc,.tbIc,.tbRub,.preAccN,.preAccChev'))continue;
    const range=document.createRange();range.selectNodeContents(t);
    for(const box of range.getClientRects())if(box.width&&box.height)texts.push({text:t.textContent.trim(),rect:box.toJSON()});
   }
   return {id:node.id,key:node.dataset.t||node.dataset.sess||node.id,rect:r.toJSON(),texts,padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft],fontSize:s.fontSize,border:s.borderImageSource,filter:s.filter};
  }));
 }
 return rows;
}
function bounded(rows,min=1){
 assert(rows.length>=min,'Expected visible controls: '+rows.length);
 for(const row of rows){assert(row.rect.left>=-2&&row.rect.right<=profile.width+2,'Control exceeds viewport '+JSON.stringify(row));
  for(const t of row.texts)assert(t.rect.left>=row.rect.left-1&&t.rect.right<=row.rect.right+1&&t.rect.top>=row.rect.top-1&&t.rect.bottom<=row.rect.bottom+1,'Text exceeds control '+JSON.stringify({row:row.key,rect:row.rect,text:t}));
 }
}
async function shot(selector,name){const n=p.locator(selector).first();if(!await n.isVisible())return null;await n.scrollIntoViewIfNeeded();const file=path.join(shotDir,profile.width+'-'+name+'.png');await n.screenshot({path:file,animations:'disabled',scale:'device'});return file;}
(async()=>{try{
 const executable=process.env.CHROMIUM_PATH||chromium.executablePath();assert(fs.existsSync(executable),'Chromium executable unavailable');process.env.CHROMIUM_PATH=executable;fs.mkdirSync(shotDir,{recursive:true});
 for(profile of profiles){const entry={...profile};report.profiles.push(entry);
  try{entry.browser=await open(root,'candidate');assert.equal(await p.evaluate(()=>KLT_AC('LABELLED-r1135-disposable-layout-profile')),true);await select('berhet');const initial=await state();assert.equal(initial.layout,'classic');assert.equal(initial.skin,'feyz');
   await check('Mobile navigation fits six readable controls and preserves native routes',async()=>{
    const nav=await visibleRows('.tabs>button');bounded(nav,6);assert.equal(nav.length,6);
    for(const r of nav){assert(r.rect.width>=44&&r.rect.height>=44,'Small touch target: '+r.key);assert(r.texts.length,'Missing visible label '+r.key);assert.match(r.border,/r1133\/gem-/,'Gemstone missing: '+r.key)}
    const rows=[...new Set(nav.map(r=>Math.round(r.rect.top)))];assert.equal(rows.length,2,'Six navigation buttons must occupy two rows on a phone');
    const screenshot=await shot('nav.tabs','navigation');await tap('.tabs .tab[data-t="amb"]');assert(await p.locator('#tab-amb').isVisible());await tap('.tabs .tab[data-t="zkr"]');assert(await p.locator('#tab-zkr').isVisible());await tap('.tabs .tab[data-t="amb"]');return{nav,screenshot};
   });
   await check('Ambience presets and long headings fit without clipping',async()=>{
    await tap('.tabs .tab[data-t="amb"]');const summaries=await visibleRows('#vakitBox>summary,#karisimBox>summary,#r1029MicNotesSummary');bounded(summaries,3);
    const groups=await visibleRows('#mixer .preAccHead');bounded(groups,5);
    const presets=await visibleRows('#sessRow>button.sess');bounded(presets,5);
    for(const r of presets)assert(r.texts.length>=2,'Preset title/description missing '+r.key);
    const screenshots={nav:await shot('nav.tabs','nav'),presets:await shot('#sessRow','presets'),mixes:await shot('#karisimBox','mixes'),vakit:await shot('#vakitBox','vakit'),notes:await shot('#r1029MicCard','notes')};
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal page overflow');
    const evidence=f.evidence();assert.deepEqual(evidence.pageErrors,[]);assert(!evidence.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),evidence.consoleErrors.join('\n'));
    assert.equal((await state()).total,initial.total,'Layout must not change the count');return{summaries,groups,presets,screenshots};
   });
  }finally{if(f)await f.close();f=p=null;}
 }
}catch(error){report.fatal=error.stack||String(error)}finally{if(f)await f.close().catch(()=>{});report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({build,passed:report.passed,total:report.total,expectedChecks:report.expectedChecks,allPassed:report.allPassed,fatal:report.fatal,output}));if(!report.allPassed)process.exitCode=1;}})();
