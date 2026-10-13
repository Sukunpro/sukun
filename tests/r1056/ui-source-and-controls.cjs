'use strict';
const path=require('node:path'),assert=require('node:assert/strict');
const {fixture}=require('./ui-controls-fixture.cjs');
const app=path.resolve(process.argv[2]||path.join(__dirname,'../..')),results=[];
async function test(name,run){try{await run();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.stack});}}
function visible(node){for(let current=node;current;current=current.parentElement)if(current.hidden)return false;return true;}
const ids=['r932EasyMinus','r932EasyPlay','r932EasyPlus','r932EasyStop','r920TefExit'];
(async()=>{
 for(const mode of ['esma','berhet']){
  await test(mode+': closed settings leave original primary actions visible, finish separate and exit accessible',()=>{
   const f=fixture(app);const identities=Object.fromEntries(ids.map(id=>[id,f.$(id)]));f.sync(mode,true);
   assert.equal(f.$('r938PanelBody').hidden,true);assert.deepEqual(f.$('r1056PrimaryControls').children.map(node=>node.id),['r932EasyMinus','r932EasyPlay','r932EasyPlus']);assert.deepEqual(f.$('r1056FinishRow').children.map(node=>node.id),['r932EasyStop']);
   for(const [id,node]of Object.entries(identities)){assert.equal(f.$(id),node);assert(visible(node),id);}assert.equal(f.$('r920TefExit').parentElement,f.stats);assert.equal(f.$('r920TefExit').nextElementSibling.id,'remaining');
  });
  await test(mode+': delegated native actions retain exactly one command after reparenting',()=>{
   const f=fixture(app);f.sync(mode,true);
   for(const [id,name,delta]of [['r932EasyMinus','adjust',-1],['r932EasyPlay','start'],['r932EasyPlus','adjust',1],['r932EasyStop','stop']]){const before=f.commands.length;f.$(id).click();assert.equal(f.commands.length,before+1);assert.equal(f.commands.at(-1).name,name);if(delta)assert.equal(f.commands.at(-1).args.delta,delta);}
  });
  await test(mode+': count and native transport gates remain authoritative outside settings',()=>{
   const f=fixture(app);f.sync(mode,true);f.setAllowed(false);f.sync(mode,true);
   for(const id of ['r932EasyMinus','r932EasyPlus']){assert.equal(f.$(id).disabled,true);assert.equal(f.$(id).getAttribute('aria-describedby'),'r968ManualHint');f.$(id).click();}assert.equal(f.commands.length,0);
   for(const [native,quick]of [['r920Play','r932EasyPlay'],['r920Stop','r932EasyStop']]){f.$(native).disabled=true;f.sync(mode,true);assert.equal(f.$(quick).disabled,true);f.$(quick).click();}assert.equal(f.commands.length,0);
  });
  await test(mode+': actual native play handler preserves start, pause, resume and explicit stop',()=>{
   const f=fixture(app);for(const [phase,label,name]of [['IDLE','Başlat','start'],['PLAYING','Duraklat','pause'],['PREPARING','Duraklat','pause'],['PAUSED','Devam et','resume'],['ERROR','Yeniden dene','start']]){f.state.phase=phase;f.sync(mode,true);assert.equal(f.$('r932EasyPlay').textContent,label);const before=f.commands.length;f.$('r932EasyPlay').click();assert.equal(f.commands.length,before+1);assert.equal(f.commands.at(-1).name,name);}
  });
  await test(mode+': focus collapse moves focus to its visible toggle without audio or count command',()=>{
   const f=fixture(app);f.state.phase='PLAYING';f.state.count=42;f.sync(mode,true);const before=JSON.stringify(f.state);f.$('r932EasyPlay').focus();assert.equal(f.window.SukunBerhetLayout.setFocusControls(false),true);
   assert.equal(f.document.activeElement,f.$('r1056FocusControlsToggle'));assert.equal(f.$('r1056PrimaryControls').hidden,true);assert.equal(f.$('r1056FinishRow').hidden,true);assert(visible(f.$('r920TefExit')));assert(visible(f.$('r1056FocusControlsToggle')));assert.equal(f.$('r1056FocusControlsToggle').getAttribute('aria-expanded'),'false');assert.equal(JSON.stringify(f.state),before);assert.equal(f.commands.length,0);
   f.$('r1056FocusControlsToggle').click();assert(visible(f.$('r932EasyPlay')));assert.equal(f.commands.length,0);
  });
  await test(mode+': leaving focus returns focus before the focus-only toggle disappears',()=>{
   const f=fixture(app);f.sync(mode,true);f.$('r1056FocusControlsToggle').focus();f.sync(mode,false);assert.equal(f.$('r1056FocusControlsToggle').hidden,true);assert.equal(f.document.activeElement,f.$('r938PanelToggle'));assert(visible(f.document.activeElement));assert.equal(f.commands.length,0);
  });
  await test(mode+': saved focus preference affects tefekkür only and cannot hide ordinary controls',()=>{
   const f=fixture(app,{preference:'0'});f.sync(mode,false);assert(visible(f.$('r932EasyPlay')));assert.equal(f.$('r1056FocusControlsToggle').hidden,true);f.sync(mode,true);assert.equal(f.$('r1056PrimaryControls').hidden,true);f.sync(mode,false);assert(visible(f.$('r932EasyPlay')));assert.equal(f.$('r1056PrimaryControls').hidden,false);assert.equal(f.window.SukunBerhetLayout.snapshot().focusControlsVisible,false);assert.equal(f.commands.length,0);
  });
  await test(mode+': settings collapse restores focus from settings and retains visible quick actions',()=>{
   const f=fixture(app);f.sync(mode,false);f.$('r938PanelToggle').click();assert.equal(f.$('r938PanelBody').hidden,false);f.$('r932QuickWheel').focus();f.$('r938PanelToggle').click();assert.equal(f.$('r938PanelBody').hidden,true);assert.equal(f.document.activeElement,f.$('r938PanelToggle'));assert(visible(f.$('r932EasyPlay')));assert.equal(f.commands.length,0);
  });
  await test(mode+': picker Escape consumes only picker closure and keeps settings open',()=>{
   const f=fixture(app);f.sync(mode,false);f.$('r938PanelToggle').click();f.$('r932QuickWheel').click();assert.equal(f.$('r932QuickPicker').hidden,false);f.$('r932QuickSelect').dispatchEvent(new f.Event('keydown',{key:'Escape',bubbles:true}));assert.equal(f.$('r932QuickPicker').hidden,true);assert.equal(f.$('r938PanelBody').hidden,false);assert.equal(f.document.activeElement,f.$('r932QuickWheel'));assert.equal(f.commands.length,0);
  });
  await test(mode+': hide/reentry restores anchors, transport identity, ordering and hidden preference',()=>{
   const f=fixture(app);const primary=f.$('r932EasyPlay').parentElement,original=f.$('r932WheelControls').parentElement,identities=Object.fromEntries(ids.map(id=>[id,f.$(id)]));
   for(let cycle=0;cycle<4;cycle++){f.sync(mode,true);f.window.SukunBerhetLayout.setFocusControls(false);f.root.hidden=true;f.window.SukunBerhetLayout.sync(f.root,true);assert.equal(f.$('r932WheelControls').parentElement,original);assert.equal(f.$('r932EasyPlay').parentElement,primary);assert.equal(f.$('r932EasyStop').parentElement,primary);assert.equal(primary.id,'');assert.deepEqual(primary.children.map(node=>node.id),['r932EasyMinus','r932EasyPlay','r932EasyPlus','r932EasyStop']);assert.equal(primary.hidden,false);assert.equal(f.$('r938Panel'),null);f.root.hidden=false;f.sync(mode,true);for(const [id,node]of Object.entries(identities))assert.equal(f.$(id),node);assert.equal(f.$('r1056PrimaryControls').hidden,true);assert(visible(f.$('r920TefExit')));}assert.equal(f.commands.length,0);
  });
 }
 await test('Only the focus-visibility preference is written; invalid values do nothing',()=>{
  const f=fixture(app);f.sync('esma',true);assert.equal(f.window.SukunBerhetLayout.setFocusControls('false'),false);assert.equal(f.writes.length,0);f.window.SukunBerhetLayout.setFocusControls(false);assert.deepEqual(f.writes,[['sukun.zikir.quickControls.focus.v1','0']]);assert.equal(f.commands.length,0);
 });
 await test('Language event translates disclosure and focus toggle without replaying state',()=>{
  const f=fixture(app);f.sync('esma',true);f.window.SukunBerhetLayout.setFocusControls(false);f.window.I18N.lang='en';f.window.dispatchEvent(new f.Event('sukun:languagechange'));assert.equal(f.$('r1056SettingsCaption').textContent,'Settings and appearance');assert.equal(f.$('r1056FocusControlsToggle').textContent,'Show easy controls');assert.equal(f.$('r1056FinishRow').getAttribute('aria-label'),'Finish the session');assert.equal(f.commands.length,0);assert.equal(f.window.SukunBerhetLayout.snapshot().focusControlsVisible,false);
 });
 await test('Unchanged repeated layout syncs do not rewrite attributes or preferences',()=>{
  const f=fixture(app);f.sync('esma',true);f.attributeWrites.length=0;for(let i=0;i<100;i++)f.sync('esma',true);assert.deepEqual(f.attributeWrites,[]);assert.deepEqual(f.writes,[]);assert.equal(f.commands.length,0);
 });
 await test('Late summary is reparented once, follows focus visibility and restores its original location',()=>{
  const f=fixture(app);f.sync('esma',true);const summary=f.add('r1056ReadingSummary');const original=summary.parentElement;for(let n=0;n<10;n++)f.sync('esma',true);assert.equal(summary.parentElement,f.$('r932WheelControls'));assert.equal(summary.nextElementSibling,f.$('r1056PrimaryControls'));f.window.SukunBerhetLayout.setFocusControls(false);assert.equal(summary.hidden,true);f.root.hidden=true;f.window.SukunBerhetLayout.sync(f.root,true);assert.equal(summary.parentElement,original);assert.equal(summary.hidden,false);assert.equal(f.commands.length,0);
 });
 await test('Summary created after layout inside the temporary hero survives teardown in the durable root',()=>{
  const f=fixture(app);f.sync('esma',true);f.reading();const summary=f.$('r1056ReadingSummary'),identity=f.$('identity');assert.equal(summary.parentElement,f.$('r938Hero'));f.sync('esma',true);assert.equal(summary.parentElement,f.$('r932WheelControls'));f.root.hidden=true;f.window.SukunBerhetLayout.sync(f.root,true);assert.equal(f.$('r1056ReadingSummary'),summary);assert.equal(summary.isConnected,true);assert.equal(summary.parentElement,f.root);assert.equal(identity.nextElementSibling,summary);assert.equal(f.commands.length,0);
 });
 for(const language of ['tr','en'])for(const [origin,kind,label]of [['personal','USER_RECORDING',language==='en'?'Your recording':'Kendi kaydın'],['generic','USER_RECORDING',language==='en'?'Generic recording':'Jenerik kayıt'],['device','TTS',language==='en'?'Device voice':'Cihaz sesi']])for(const phase of ['PLAYING','PAUSED','INTERRUPTED'])await test(`${language} ${origin} ${phase}: actual reading-summary consumer shows accepted origin and shares priority explanation`,()=>{
  const f=fixture(app,{language});Object.assign(f.state,{phase,audioSource:kind,sourceOrigin:origin,recordingOrigin:['personal','generic'].includes(origin)?origin:null,sourceLabel:'Stale resolver badge',journeyKind:'single'});const before=JSON.stringify(f.state);f.reading();f.sync('esma',true);assert.equal(f.$('r1056ReadingSource').textContent,label);assert.equal(f.$('r1056ReadingSource').getAttribute('data-source-origin'),origin);assert.match(f.$('r1056ReadingSource').getAttribute('title'),language==='en'?/enabled generic archive/:/etkin jenerik arşiv/);assert.equal(f.$('r1056ReadingSummary').parentElement,f.$('r932WheelControls'));assert.equal(JSON.stringify(f.state),before);assert.equal(f.commands.length,0);
 });
 await test('Missing cadence remains unknown; actual selected tempo and journey gap keep separate meanings',()=>{
  const f=fixture(app);f.state.journeyKind='single';f.reading();assert.equal(f.$('r1056ReadingTempo').textContent,'Seçili tempo: —');f.window.SukunCadenceUI={snapshot:()=>({requestedMs:1200,gapMs:500}),view:()=>({reason:'Production cadence explanation boundary'})};f.reading();assert.equal(f.$('r1056ReadingTempo').textContent,'Seçili tempo: 1,2 sn');f.state.journeyKind='99';f.reading();assert.equal(f.$('r1056ReadingTempo').textContent,'Okuyuş sonrası: 0,5 sn');f.window.I18N.lang='en';f.reading();assert.equal(f.$('r1056ReadingTempo').textContent,'After recitation: 0.5 s');assert.equal(f.commands.length,0);
 });
 await test('Source button bubbles through the existing quick delegate and toggles explanation exactly once without transport or credit',()=>{
  const f=fixture(app);Object.assign(f.state,{phase:'PLAYING',audioSource:'USER_RECORDING',recordingOrigin:'generic',sourceOrigin:'generic',count:42});f.reading();f.sync('esma',true);const source=f.$('r1056ReadingSource'),detail=f.$('r1056ReadingExplanation'),before=JSON.stringify(f.state);assert.equal(source.tagName,'BUTTON');assert.equal(source.getAttribute('data-action'),null);assert.equal(source.getAttribute('aria-controls'),detail.id);assert.equal(detail.hidden,true);source.click();assert.equal(detail.hidden,false);assert.equal(source.getAttribute('aria-expanded'),'true');assert.match(detail.textContent,/etkin jenerik arşiv/);source.click();assert.equal(detail.hidden,true);assert.equal(source.getAttribute('aria-expanded'),'false');assert.equal(JSON.stringify(f.state),before);assert.equal(f.commands.length,0);assert.equal(f.refreshes(),0);
 });
 await test('Focus collapse returns focus from source disclosure to the visible focus toggle',()=>{
  const f=fixture(app);f.reading();f.sync('esma',true);f.$('r1056ReadingSource').focus();f.window.SukunBerhetLayout.setFocusControls(false);assert.equal(f.document.activeElement,f.$('r1056FocusControlsToggle'));assert.equal(f.$('r1056ReadingSummary').hidden,true);assert(visible(f.document.activeElement));assert.equal(f.commands.length,0);
 });
 await test('Stable reading refresh preserves a touched source control and expanded explanation without attribute rewrites',()=>{
  const f=fixture(app);f.reading();f.sync('esma',true);const source=f.$('r1056ReadingSource'),detail=f.$('r1056ReadingExplanation');source.click();source.focus();f.attributeWrites.length=0;for(let i=0;i<100;i++)f.reading();assert.equal(f.$('r1056ReadingSource'),source);assert.equal(f.document.activeElement,source);assert.equal(detail.hidden,false);assert.equal(source.getAttribute('aria-expanded'),'true');assert.deepEqual(f.attributeWrites,[]);assert.equal(f.commands.length,0);
 });
 for(const origin of ['personal','generic','device'])await test(origin+': actual mini-dock source stays truthful while paused and creates no extra transport',()=>{
  const f=fixture(app,{language:'en'}),shell=f.add('r588DockShell',f.document.body);f.add('dockText',shell,'div','r588Text');Object.assign(f.state,{phase:'PAUSED',paused:true,playing:false,activeName:'Yâ Rahmân',audioSource:origin==='device'?'TTS':'USER_RECORDING',sourceOrigin:origin,recordingOrigin:origin==='device'?null:origin});const before=JSON.stringify(f.state);f.dock();const node=f.$('r1056DockSource');assert.equal(node.hidden,false);assert.equal(node.textContent,f.window.SukunAudioSourceText.label(f.state));assert.equal(node.dataset.sourceOrigin,origin);assert.match(node.title,/enabled generic archive/);for(let i=0;i<20;i++)f.dock();assert.equal(f.$('r1056DockSource'),node);assert.equal(f.document.root.querySelectorAll('#r1056DockSource').length,1);assert.equal(JSON.stringify(f.state),before);assert.equal(f.commands.length,0);
 });
 await test('Mini-dock hides recording origin for idle and locked private contexts',()=>{
  const f=fixture(app),shell=f.add('r588DockShell',f.document.body);f.add('dockText',shell,'div','r588Text');Object.assign(f.state,{phase:'IDLE',paused:false,playing:false,activeMode:'esma',audioSource:'USER_RECORDING',recordingOrigin:'generic',sourceOrigin:'generic'});f.dock();assert.equal(f.$('r1056DockSource').hidden,true);assert.equal(f.$('r1056DockSource').textContent,'');f.state.activeMode='berhet';f.state.paused=true;f.window.SukunSecretPolicy={unlocked:()=>false};f.dock();assert.equal(f.$('r1056DockSource').hidden,true);assert.equal(f.$('r1056DockSource').dataset.sourceOrigin,'none');assert.equal(f.commands.length,0);
 });
 const report={suite:'r1056 independent stationary controls and focus ownership',source:app,passed:results.filter(result=>result.passed).length,total:results.length,method:'Actual shipped quick-control delegates, native command-handler branches, layout controller and shared source-text API executed with minimal DOM and final session-command endpoints. No rendered browser, physical Android or audible-output claim.',results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
