'use strict';
// Real production DOM and CSS in disposable Classic/Feyz profiles. Native
// BrowserContext deviceScaleFactor provides actual Chromium DPR; no style, theme or control mocks.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1133-button-clarity-browser.json');
const baseline=process.argv[4]?path.resolve(process.argv[4]):null;
const {fixture,hash}=require(path.join(root,'tests/r1064/browser-fixture.cjs'));
const shotDir=path.join(path.dirname(output),'button-clarity');
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim();
// A focused rerun may isolate the 393px profile; the default retains all 3.
const profiles=process.env.SUKUN_VISUAL_QUICK==='1'?[{width:393,dpr:2}]:process.env.SUKUN_VISUAL_MOBILE==='1'?[{width:393,dpr:2},{width:360,dpr:3}]:[{width:360,dpr:3},{width:393,dpr:2},{width:1280,dpr:2}];
const selectors=['.r920Stats>span','.tab[data-t="zkr"]','#r986Sections button','#r1082SessionEntry','#r1056FocusControlsToggle','#r938PanelToggle','#r932QuickWheel','#r932QuickScene','#r932EasyPlay','#r932EasyStop','#r920Previous','#r920Restart','#r920Next','#r920TefEnter','#r920Actions button','#r920ViewOptions > summary'];
const report={suite:'r1133 native-DPR premium gemstone controls across Berhetiyye tabs and dialogs',build,expectedChecks:profiles.length*2,startedAt:new Date().toISOString(),testSha256:hash(fs.readFileSync(__filename)),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),checks:[],profiles:[],limitations:[
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
// Preserve the exact prior, high-resolution Berhetiyye image files. The
// comparison is independent of the CSS implementation and baseline clone.
const originalArt={
 'gem-sapphire-r933.webp':'62c5ff06eae7fcf2cbba43f57228905e9460f8cfe26f205577d8473d179020be',
 'gem-emerald-r932.webp':'19219874a4b5b1634630745b191b4a0bf9c17b4263450e8b9ca54ebfc025f721',
 'gem-amethyst-r933.webp':'9f82669a2d5c97e0dd9a4642c2230da2a76a285ed63e262f86665c5def59400b',
 'gem-ruby-r933.webp':'b27393700407c5eb2d66e675acbef3ea16829d6cd9adbcbe092aeab85d47f1bc',
 'gem-diamond-r933.webp':'64aa52732c5b778602e1977452253ebb0d8b96538767dc1df6060257a4f4f0a8',
 'gem-topaz-r935.webp':'e127786625c7d8d2e99734ae7d5358f2cf75f63f12b0fe6cd1acba7d98f8107a',
 'tefekkur-amethyst-r931.webp':'387cf2edb07a57efe499d68b1c58165671793098f0115612986823fb6866d129',
 'panel-emerald-r932.webp':'ef9b20b66a0f0a04846ab8ec6dafe348ee334c30c78414f7af4142a65eaf1f4e'
};
const gemArt=/\/r1133\/gem-(?:sapphire|emerald|amethyst|ruby|diamond|black-diamond|citrine|topaz)\.webp/;
const premiumMaterials=['amethyst','black-diamond','citrine','diamond','emerald','ruby','sapphire','topaz'];
function geometry(rows,minimum=10){
 assert(rows.length>=minimum,'The visible panel must include the relevant rectangular controls');
 for(const r of rows){
  assert(r.rect.width>0&&r.rect.height>0);assert(r.rect.left>=-2&&r.rect.right<=profile.width+2,'Control escapes viewport: '+JSON.stringify(r));
  // scrollWidth includes the existing tab glow pseudo-elements. Measure the
  // rendered DOM labels themselves so ornament overflow is not text overflow.
  for(const text of r.textRects)assert(text.rect.left>=r.rect.left-1&&text.rect.right<=r.rect.right+1&&text.rect.top>=r.rect.top-1&&text.rect.bottom<=r.rect.bottom+1,'Rendered label escapes button bounds: '+JSON.stringify({key:r.key,button:r.rect,text}));
 }
}
function artwork(rows,minimum=10){
 geometry(rows,minimum);
 for(const r of rows){
  assert.match(r.border,gemArt,'Premium gemstone setting missing on '+r.key);
  assert.equal(r.borderRepeat,'stretch','Bright gemstone facets must not tile on '+r.key);
  assert.match(r.slice,/\bfill\b/,'The stone face must share the same coherent horizontal master '+r.key);
  assert.equal(r.background,'none','Avoid overlapping old stone face behind the setting '+r.key);
  assert.equal(r.filter,'none','Button art must remain unblurred '+r.key);
 }
}
function clean(rows){for(const r of rows)assert.equal(r.material,'','Berhetiyye coat leaked to '+r.key);}
(async()=>{try{
 // Assert the currently shipped original bytes, including the wide artwork and
 // emerald panel. With a frozen r1132 baseline, compare those bytes as well.
 report.originalArt={};
 for(const [file,expected] of Object.entries(originalArt)){
  const candidate=hash(fs.readFileSync(path.join(root,'assets/berhetiyye-premium',file)));
  assert.equal(candidate,expected,'The original Berhetiyye artwork must be preserved: '+file);
  let previous=null;if(baseline){previous=hash(fs.readFileSync(path.join(baseline,'assets/berhetiyye-premium',file)));assert.equal(candidate,previous,'Artwork changed from r1132: '+file);}
  report.originalArt[file]={candidate,previous};
 }
 report.premiumArt=Object.fromEntries(premiumMaterials.map(material=>{const file='assets/berhetiyye-premium/r1133/gem-'+material+'.webp',bytes=fs.readFileSync(path.join(root,file));return[material,{file,bytes:bytes.length,sha256:hash(bytes)}]}));
 const executable=process.env.CHROMIUM_PATH||chromium.executablePath();if(!fs.existsSync(executable))throw Error('Chromium executable unavailable: '+executable);process.env.CHROMIUM_PATH=executable;fs.mkdirSync(shotDir,{recursive:true});
 for(const q of profiles){profile=q;const entry={...q,baseline:null,candidate:null};report.profiles.push(entry);let oldRows=null;
  if(baseline){try{entry.baseline=await open(baseline,'baseline');await unlock();oldRows=await paints();entry.baseline.state=await state();entry.baseline.paints=oldRows;entry.baseline.screenshots=await screenshot('before-'+q.width+'-dpr'+q.dpr);entry.baseline.evidence=f.evidence();}finally{if(f)await f.close();f=p=null;}}
  try{entry.candidate=await open(root,'candidate');
   entry.candidate.artwork=await p.evaluate(async materials=>Promise.all(materials.map(async material=>{const img=new Image();img.src='./assets/berhetiyye-premium/r1133/gem-'+material+'.webp';await img.decode();return{material,width:img.naturalWidth,height:img.naturalHeight};})),premiumMaterials);
   for(const art of entry.candidate.artwork){assert(art.width>=1600&&art.height>=512,'High-resolution gemstone master: '+JSON.stringify(art));}

   await check('Premium gemstone settings avoid tiled reflections and preserve control geometry',async()=>{const initial=await state();assert.equal(initial.layout,'classic');assert.equal(initial.skin,'feyz');assert.equal(initial.unlocked,false);clean(await paints());await unlock();const rows=await paints();const shots=await screenshot('after-'+q.width+'-dpr'+q.dpr);entry.candidate.unlocked={state:await state(),paints:rows,screenshots:shots};assert.equal(entry.candidate.unlocked.state.dpr,q.dpr,'Screenshots retain native DPR');artwork(rows);const byId=Object.fromEntries(rows.filter(x=>x.id).map(x=>[x.id,x]));assert.equal(byId.r932EasyPlay.material,'emerald','Play keeps its green action material');assert.equal(byId.r932EasyStop.material,'ruby','Stop keeps its ruby action material');assert.equal(byId.r932QuickWheel.material,'amethyst','Wheel chooser keeps its amethyst material');assert.equal(byId.r932QuickScene.material,'sapphire');assert.equal(byId.r938PanelToggle.material,'diamond');assert.match(byId.r938PanelToggle.border,/gem-diamond\.webp/);assert.notEqual(byId.r932EasyPlay.border,byId.r932EasyStop.border,'Play and Stop must remain visually distinct');assert.notEqual(byId.r932QuickWheel.border,byId.r932QuickScene.border,'Wheel and background controls must retain their distinct roles');
    const comparison=[];if(oldRows){const prior=new Map(oldRows.map(r=>[r.key,r]));for(const row of rows){const old=prior.get(row.key);if(!old)continue;const dx=Math.abs(row.rect.width-old.rect.width),dy=Math.abs(row.rect.height-old.rect.height);assert(dx<=2&&dy<=2,'Paint-only change altered geometry '+JSON.stringify({key:row.key,before:old.rect,after:row.rect}));comparison.push({key:row.key,before:{width:old.rect.width,height:old.rect.height},after:{width:row.rect.width,height:row.rect.height}});}}
    // The original Berhetiyye summaries have distinct stone colours. Read
    // the real visible DOM after the app selects single and journey modes;
    // the journey summary is genuinely hidden until a journey is selected.
    const summaryMaterials=[];
    if(q.width===393){
     const verifySummary=async(selector,material)=>{
      assert.equal(await p.locator(selector).isVisible(),true,'Summary must be visible: '+selector);
      const values=await paints([selector]);assert.equal(values.length,1,'Expected one visible summary: '+selector);
      const row=values[0];assert.equal(row.material,material,'Original summary colour: '+selector);
      const originalFile='gem-'+material+'.webp';
      assert(row.border.includes(originalFile),'Original summary setting: '+selector);
      summaryMaterials.push({selector,material,border:row.border});
     };
     await verifySummary('#r920ViewOptions>summary','amethyst');
     await verifySummary('#r679ZikirAyarBox>summary','sapphire');
     const selection=await p.evaluate(()=>SukunSessionState.command('select',{mode:'berhet',index:8,journeyKind:'28'}));
     assert.equal(selection.accepted,true,'Real Berhetiyye journey selection must succeed');
     await p.waitForFunction(()=>!document.getElementById('r920JourneySettings')?.hidden);await idle();await settings();
     await verifySummary('#r920JourneySettings>summary','emerald');
     await select('berhet');await settings();
    }
    return{initial,state:await state(),rows,comparison,summaryMaterials,screenshots:shots};});
   await check('Native picker, body dialog and second tab share the ornate theme; focus, hide and private-material cleanup retain ownership',async()=>{await unlock();const before=await state();await p.locator('#r932QuickWheel').focus();await p.keyboard.press('Tab');const focus=await p.evaluate(()=>{const n=document.activeElement,s=getComputedStyle(n);return{id:n.id,focusVisible:n.matches(':focus-visible'),outline:s.outlineStyle,width:s.outlineWidth,color:s.outlineColor};});assert.equal(focus.id,'r932QuickScene');assert.equal(focus.focusVisible,true);assert.notEqual(focus.outline,'none');assert(parseFloat(focus.width)>=2,'Keyboard focus remains visibly outlined');await tap('#r932QuickScene');assert.equal(await p.locator('#r932QuickScene').getAttribute('aria-expanded'),'true');assert.equal(await p.locator('#r932QuickPicker').isVisible(),true);await p.locator('#r945ScenePicker').waitFor({state:'visible'});const pickerRows=await paints(['#r945SceneClose','#r945SceneAuto','#r945ScenePrev','#r945SceneNext']);artwork(pickerRows,4);const thumbnails=await paints(['#r945SceneGrid .r945SceneCard']);assert(thumbnails.length>0,'Real scene thumbnails rendered');for(const row of thumbnails){assert.match(row.border,/panel-emerald-r932\.webp/);assert(!gemArt.test(row.background),'Thumbnail must keep its scene image');}const pickerShot=path.join(shotDir,'picker-'+q.width+'-dpr'+q.dpr+'.png');await p.locator('#r945ScenePicker').screenshot({path:pickerShot,animations:'disabled',scale:'device'});entry.candidate.picker={rows:pickerRows,thumbnails,screenshot:pickerShot};await p.keyboard.press('Escape');await idle();assert.equal(await p.locator('#r932QuickPicker').isVisible(),false);assert.equal(await p.evaluate(()=>document.activeElement.id),'r932QuickScene','Escape restores the actual trigger focus');
    await tap('#r1056FocusControlsToggle');assert.equal(await p.locator('#r1056PrimaryControls').evaluate(n=>n.hidden),true);assert.equal(await p.locator('#r1056FocusControlsToggle').getAttribute('aria-expanded'),'false');await tap('#r1056FocusControlsToggle');assert.equal(await p.locator('#r1056PrimaryControls').evaluate(n=>n.hidden),false);assert.equal(await p.locator('#r1056FocusControlsToggle').getAttribute('aria-expanded'),'true');await p.evaluate(()=>SukunLayoutModes.open());await p.locator('#r617ModeSheet').waitFor({state:'visible'});assert.equal(await p.locator('#r617ModeSheet').evaluate(n=>n.parentElement===document.body),true,'The native dialog is a body portal');const dialogRows=await paints(['#r617ModeSheet .r617ModeClose','#r617ModeSheet .r617ModeOption','#r617ModeApply']);artwork(dialogRows,5);const dialogShot=path.join(shotDir,'dialog-'+q.width+'-dpr'+q.dpr+'.png');await p.locator('#r617ModeSheet').screenshot({path:dialogShot,animations:'disabled',scale:'device'});entry.candidate.bodyDialog={rows:dialogRows,screenshot:dialogShot};await tap('#r617ModeSheet .r617ModeClose');assert.equal(await p.locator('#r617ModeSheet').isVisible(),false);assert.equal((await state()).layout,'classic','Dialog browsing does not change the shell');await tap('.tab[data-t="amb"]');const ambientRows=await paints(['#tab-amb button:not(.sw):not([role="switch"])']);artwork(ambientRows,2);const ambientShot=path.join(shotDir,'ambience-'+q.width+'-dpr'+q.dpr+'.png');await p.locator('#tab-amb').screenshot({path:ambientShot,animations:'disabled',scale:'device'});entry.candidate.ambience={rows:ambientRows,screenshot:ambientShot};const nativePalette=await p.evaluate(()=>[...new Set([...document.querySelectorAll('button,summary,select')].filter(n=>/berhetiyye-premium\/r1133\/gem-/.test(getComputedStyle(n).borderImageSource)&&getComputedStyle(n).getPropertyValue('--r1133-material').trim()).map(n=>getComputedStyle(n).getPropertyValue('--r1133-material').trim()))].sort());assert.deepEqual(nativePalette,['amethyst','black-diamond','citrine','diamond','emerald','ruby','sapphire','topaz']);entry.candidate.palette=nativePalette;await tap('.tab[data-t="zkr"]');await settings();await select('esma');await settings();const esma=await state(),esmaRows=await paints();clean(esmaRows);geometry(esmaRows);assert.equal(esma.dock,'0');const esmaShots=await screenshot('esma-'+q.width+'-dpr'+q.dpr);await select('berhet');await settings();artwork(await paints());await p.evaluate(()=>KLT_KILITLE());await p.waitForFunction(()=>!SukunSecretPolicy.unlocked()&&document.documentElement.dataset.r1074Theme!=='berhet');await idle();await settings();const locked=await state(),lockedRows=await paints();clean(lockedRows);assert.equal(locked.dock,'0');assert.equal(await p.locator('#r920ModeBerhet').evaluate(n=>n.hidden),true);assert.equal(locked.auto,false);assert.equal(locked.total,before.total,'Cosmetic controls must not count a zikr');const lockedShots=await screenshot('locked-'+q.width+'-dpr'+q.dpr);const e=f.evidence();for(const[name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'Served bytes changed during visual suite '+name);assert.deepEqual(e.pageErrors,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));assert.deepEqual(e.failedRequests.filter(x=>!/^net::ERR_ABORTED$/.test(x.error||'')),[]);entry.candidate.esma={state:esma,screenshots:esmaShots};entry.candidate.locked={state:locked,screenshots:lockedShots};entry.candidate.evidence=e;return{focus,before,esma,locked,screenshots:{esma:esmaShots,locked:lockedShots},servedFiles:Object.keys(e.served).length};});
  }finally{if(f){if(entry.candidate)entry.candidate.evidence=entry.candidate.evidence||f.evidence();await f.close();}f=p=null;}
 }
}catch(error){report.fatal=error.stack||String(error);}finally{if(f)await f.close().catch(()=>{});report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({build,passed:report.passed,total:report.total,expectedChecks:report.expectedChecks,allPassed:report.allPassed,fatal:report.fatal,output}));if(!report.allPassed)process.exitCode=1;}})();
