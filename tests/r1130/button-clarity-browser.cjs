'use strict';
// Real production DOM and CSS in disposable Classic/Feyz profiles. Native CDP
// BrowserContext deviceScaleFactor provides actual Chromium DPR; no style, theme or control mocks.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1130-button-clarity-browser.json');
const baseline=process.argv[4]?path.resolve(process.argv[4]):null;
const {fixture,hash}=require(path.join(root,'tests/r1064/browser-fixture.cjs'));
const shotDir=path.join(path.dirname(output),'button-clarity');
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim();
const profiles=[{width:360,dpr:3},{width:393,dpr:2},{width:1280,dpr:2}];
const selectors=['.tab[data-t="zkr"]','#r986Sections button','#r1082SessionEntry','#r1056FocusControlsToggle','#r938PanelToggle','#r932QuickWheel','#r932QuickScene','#r932EasyPlay','#r932EasyStop','#r920Previous','#r920Restart','#r920Next','#r920TefEnter','#r920Actions button','#r920ViewOptions > summary'];
const report={suite:'r1130 native-DPR rectangular Berhetiyye button clarity',build,expectedChecks:6,startedAt:new Date().toISOString(),testSha256:hash(fs.readFileSync(__filename)),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),checks:[],profiles:[],limitations:[
 'Disposable Linux headless Chromium BrowserContexts use native deviceScaleFactor at DPR 2/3. These images do not establish physical Samsung/Windows display sharpness or photograph quality.',
 'Public session selection and disposable KLT_AC/KLT_KILITLE APIs establish unlocked/locked cases without changing policy. Native handlers, CSS, themes, widths and element visibility remain unmodified.',
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
async function unlock(){assert.equal(await p.evaluate(()=>KLT_AC('LABELLED-r1130-disposable-visual-profile')),true);await select('berhet');await settings();}
async function paints(){return p.evaluate(selectors=>{
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
  rows.push({key:selector+':'+nIndex,id:n.id,tag:n.tagName,text:n.textContent.trim().replace(/\s+/g,' ').slice(0,160),textRects,rect:r.toJSON(),clientWidth:n.clientWidth,scrollWidth:n.scrollWidth,border:s.borderImageSource,slice:s.borderImageSlice,borderWidth:s.borderImageWidth,background:s.backgroundImage,color:s.color,filter:s.filter,top:s.getPropertyValue('--r1130-top').trim(),radius:s.borderRadius,padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft],disabled:!!n.disabled,before:pseudo('::before'),after:pseudo('::after')});
 }
 return rows;
},selectors);}
async function screenshot(name){const files={};await settings();const panel=p.locator('#r938Panel');const target=path.join(shotDir,name+'-controls.png');await panel.screenshot({path:target,animations:'disabled',scale:'device'});files.controls=target;const sections=p.locator('#r986Sections');if(await sections.isVisible()){const file=path.join(shotDir,name+'-sections.png');await sections.screenshot({path:file,animations:'disabled',scale:'device'});files.sections=file;}return files;}
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
 await tap('.tab[data-t="zkr"]');await settings();return{label,browser:x.browser.version()};
}
async function check(name,fn){try{report.checks.push({profile:{...profile},name,passed:true,evidence:await fn()});}catch(error){let failedShot=null;if(p)try{failedShot=path.join(shotDir,'failure-'+profile.width+'-'+report.checks.length+'.png');await p.screenshot({path:failedShot,animations:'disabled'});}catch(_){}report.checks.push({profile:{...profile},name,passed:false,error:error.stack||String(error),screenshot:failedShot,state:await state().catch(()=>null)});}save();console.log(JSON.stringify({profile,name,passed:report.checks.at(-1).passed}));}
const bitmap=/\.(?:png|webp|jpe?g)(?:[?"')]|$)/i;
function geometry(rows){
 assert(rows.length>=10,'The visible panel must include the relevant rectangular controls');
 for(const r of rows){
  assert(r.rect.width>0&&r.rect.height>0);assert(r.rect.left>=-2&&r.rect.right<=profile.width+2,'Control escapes viewport: '+JSON.stringify(r));
  // scrollWidth includes the existing tab glow pseudo-elements. Measure the
  // rendered DOM labels themselves so ornament overflow is not text overflow.
  for(const text of r.textRects)assert(text.rect.left>=r.rect.left-1&&text.rect.right<=r.rect.right+1&&text.rect.top>=r.rect.top-1&&text.rect.bottom<=r.rect.bottom+1,'Rendered label escapes button bounds: '+JSON.stringify({key:r.key,button:r.rect,text}));
 }
}
function vector(rows){geometry(rows);for(const r of rows){assert.match(r.border,/berhetiyye-premium\/gem-gold-bezel-r1130\.svg/,'Vector bezel missing on '+r.key);assert(!/\bfill\b/.test(r.slice),'Border must not stretch-fill the button face');assert(!/url\(/i.test(r.background),'Face must be resolution-independent CSS gradients: '+r.key);assert.equal(r.filter,'none','Button paint must not be blurred '+r.key);for(const side of ['before','after'])assert(!bitmap.test(r[side].background),'A pseudo-element still stretches raster art on '+r.key+' '+side);}}
function clean(rows){for(const r of rows)assert(!/gem-gold-bezel-r1130\.svg/.test(r.border),'Private Berhetiyye vector material leaked to '+r.key);}
(async()=>{try{
 const executable=process.env.CHROMIUM_PATH||chromium.executablePath();if(!fs.existsSync(executable))throw Error('Chromium executable unavailable: '+executable);process.env.CHROMIUM_PATH=executable;fs.mkdirSync(shotDir,{recursive:true});
 for(const q of profiles){profile=q;const entry={...q,baseline:null,candidate:null};report.profiles.push(entry);let oldRows=null;
  if(baseline){try{entry.baseline=await open(baseline,'baseline');await unlock();oldRows=await paints();entry.baseline.state=await state();entry.baseline.paints=oldRows;entry.baseline.screenshots=await screenshot('before-'+q.width+'-dpr'+q.dpr);entry.baseline.evidence=f.evidence();}finally{if(f)await f.close();f=p=null;}}
  try{entry.candidate=await open(root,'candidate');
   await check('Unlocked jewel controls use a vector edge and crisp CSS faces at native DPR without layout expansion',async()=>{const initial=await state();assert.equal(initial.layout,'classic');assert.equal(initial.skin,'feyz');assert.equal(initial.unlocked,false);clean(await paints());await unlock();const rows=await paints();const shots=await screenshot('after-'+q.width+'-dpr'+q.dpr);entry.candidate.unlocked={state:await state(),paints:rows,screenshots:shots};assert.equal(entry.candidate.unlocked.state.dpr,q.dpr,'Screenshots retain native DPR');vector(rows);const byId=Object.fromEntries(rows.filter(x=>x.id).map(x=>[x.id,x]));assert.equal(byId.r932EasyPlay.top,'#17644f','Play keeps its green action material');assert.equal(byId.r932EasyStop.top,'#77304a','Stop keeps its ruby action material');assert.equal(byId.r932QuickWheel.top,'#593077','Wheel chooser keeps its amethyst material');assert.notEqual(byId.r932EasyPlay.background,byId.r932EasyStop.background,'Play and Stop must remain visually distinct');assert.notEqual(byId.r932QuickWheel.background,byId.r932QuickScene.background,'Wheel and background controls must retain their distinct roles');
    const comparison=[];if(oldRows){const prior=new Map(oldRows.map(r=>[r.key,r]));for(const row of rows){const old=prior.get(row.key);if(!old)continue;const dx=Math.abs(row.rect.width-old.rect.width),dy=Math.abs(row.rect.height-old.rect.height);assert(dx<=2&&dy<=2,'Paint-only change altered geometry '+JSON.stringify({key:row.key,before:old.rect,after:row.rect}));comparison.push({key:row.key,before:{width:old.rect.width,height:old.rect.height},after:{width:row.rect.width,height:row.rect.height}});}}
    return{initial,state:await state(),rows,comparison,screenshots:shots};});
   await check('Native focus, picker and hide controls retain ownership; Esma and access lock clear the private material',async()=>{await unlock();const before=await state();await p.locator('#r932QuickWheel').focus();await p.keyboard.press('Tab');const focus=await p.evaluate(()=>{const n=document.activeElement,s=getComputedStyle(n);return{id:n.id,focusVisible:n.matches(':focus-visible'),outline:s.outlineStyle,width:s.outlineWidth,color:s.outlineColor};});assert.equal(focus.id,'r932QuickScene');assert.equal(focus.focusVisible,true);assert.notEqual(focus.outline,'none');assert(parseFloat(focus.width)>=2,'Keyboard focus remains visibly outlined');await tap('#r932QuickScene');assert.equal(await p.locator('#r932QuickScene').getAttribute('aria-expanded'),'true');assert.equal(await p.locator('#r932QuickPicker').isVisible(),true);await p.keyboard.press('Escape');await idle();assert.equal(await p.locator('#r932QuickPicker').isVisible(),false);assert.equal(await p.evaluate(()=>document.activeElement.id),'r932QuickScene','Escape restores the actual trigger focus');
    await tap('#r1056FocusControlsToggle');assert.equal(await p.locator('#r1056PrimaryControls').evaluate(n=>n.hidden),true);assert.equal(await p.locator('#r1056FocusControlsToggle').getAttribute('aria-expanded'),'false');await tap('#r1056FocusControlsToggle');assert.equal(await p.locator('#r1056PrimaryControls').evaluate(n=>n.hidden),false);assert.equal(await p.locator('#r1056FocusControlsToggle').getAttribute('aria-expanded'),'true');await select('esma');await settings();const esma=await state(),esmaRows=await paints();clean(esmaRows);geometry(esmaRows);assert.equal(esma.dock,'0');const esmaShots=await screenshot('esma-'+q.width+'-dpr'+q.dpr);await select('berhet');await settings();vector(await paints());await p.evaluate(()=>KLT_KILITLE());await p.waitForFunction(()=>!SukunSecretPolicy.unlocked()&&document.documentElement.dataset.r1074Theme!=='berhet');await idle();await settings();const locked=await state(),lockedRows=await paints();clean(lockedRows);assert.equal(locked.dock,'0');assert.equal(await p.locator('#r920ModeBerhet').evaluate(n=>n.hidden),true);assert.equal(locked.auto,false);assert.equal(locked.total,before.total,'Cosmetic controls must not count a zikr');const lockedShots=await screenshot('locked-'+q.width+'-dpr'+q.dpr);const e=f.evidence();for(const[name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'Served bytes changed during visual suite '+name);assert.deepEqual(e.pageErrors,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));assert.deepEqual(e.failedRequests.filter(x=>!/^net::ERR_ABORTED$/.test(x.error||'')),[]);entry.candidate.esma={state:esma,screenshots:esmaShots};entry.candidate.locked={state:locked,screenshots:lockedShots};entry.candidate.evidence=e;return{focus,before,esma,locked,screenshots:{esma:esmaShots,locked:lockedShots},servedFiles:Object.keys(e.served).length};});
  }finally{if(f){if(entry.candidate)entry.candidate.evidence=entry.candidate.evidence||f.evidence();await f.close();}f=p=null;}
 }
}catch(error){report.fatal=error.stack||String(error);}finally{if(f)await f.close().catch(()=>{});report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({build,passed:report.passed,total:report.total,expectedChecks:report.expectedChecks,allPassed:report.allPassed,fatal:report.fatal,output}));if(!report.allPassed)process.exitCode=1;}})();
