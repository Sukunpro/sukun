'use strict';
// Execute the shipped layout controller and original quick-control delegates.
// The small DOM fixture controls session endpoints; it does not model layout logic.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {fixture}=require('../r1056/ui-controls-fixture.cjs');
const app=path.resolve(process.argv[2]||path.join(__dirname,'../..')),source=fs.readFileSync(path.join(app,'assets/runtime/berhet-layout-r938.js'),'utf8'),results=[];
const key='sukun.zikir.quickControls.focus.v1';
const visible=node=>{for(let parent=node;parent;parent=parent.parentElement)if(parent.hidden)return false;return !!node?.isConnected;};
const targets=['r1056PrimaryControls','r1056FinishRow','r1056ReadingSummary','r968ManualHint'];
async function test(name,run){try{await run();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.stack});}}
function controls(f,expected){for(const id of targets){assert.equal(f.$(id).hidden,!expected,id);assert.equal(visible(f.$(id)),expected,id);}const toggle=f.$('r1056FocusControlsToggle');assert(visible(toggle),'disclosure remains accessible');assert.equal(toggle.disabled,false);assert.equal(toggle.getAttribute('aria-expanded'),String(expected));}
function prepare(mode,options){const f=fixture(app,options);f.reading();f.sync(mode,false);return f;}
(async()=>{
 for(const mode of ['esma','berhet']){
  await test(`${mode}: returning from focus keeps the original easy-control button effective`,()=>{
   const f=prepare(mode);f.sync(mode,true);const toggle=f.$('r1056FocusControlsToggle');f.sync(mode,false);assert.equal(f.$('r1056FocusControlsToggle'),toggle);assert(visible(toggle));toggle.click();controls(f,false);toggle.click();controls(f,true);assert.equal(f.commands.length,0);
  });
  await test(`${mode}: ordinary hide and show include transport, Finish, summary and manual hint`,()=>{
   const f=prepare(mode);controls(f,true);f.$('r1056FocusControlsToggle').click();controls(f,false);assert.equal(f.root.dataset.r1056FocusControls,'hidden');f.$('r1056FocusControlsToggle').click();controls(f,true);assert.equal(f.root.dataset.r1056FocusControls,'shown');assert.equal(f.commands.length,0);
  });
  await test(`${mode}: the saved hidden preference survives repeated focus entry and exit`,()=>{
   const f=prepare(mode);f.window.SukunBerhetLayout.setFocusControls(false);for(const tef of [true,false,true,false,true,false]){f.sync(mode,tef);controls(f,false);assert.equal(f.window.SukunBerhetLayout.snapshot().focusControlsVisible,false);}assert.deepEqual(f.writes,[[key,'0']]);assert.equal(f.commands.length,0);
  });
  await test(`${mode}: show after exiting focus survives further focus cycles`,()=>{
   const f=prepare(mode,{preference:'0'});f.sync(mode,true);f.sync(mode,false);f.$('r1056FocusControlsToggle').click();for(const tef of [false,true,false,true,false]){f.sync(mode,tef);controls(f,true);}assert.deepEqual(f.writes,[[key,'1']]);assert.equal(f.commands.length,0);
  });
  await test(`${mode}: original action nodes and handlers remain identical through visibility and mode changes`,()=>{
   const f=fixture(app),ids=['r932EasyMinus','r932EasyPlay','r932EasyPlus','r932EasyStop','r920TefEnter','r920TefExit'];const originals=ids.map(id=>[id,f.$(id),f.$(id).onclick]),delegate=f.$('r932WheelControls').listeners.click.slice();f.reading();
   for(const tef of [false,true,false,true,false]){f.sync(mode,tef);f.window.SukunBerhetLayout.setFocusControls(false);f.window.SukunBerhetLayout.setFocusControls(true);for(const [id,node,handler]of originals){assert.equal(f.$(id),node,id);assert.equal(node.onclick,handler,id);}assert.deepEqual(f.$('r932WheelControls').listeners.click,delegate);}
   for(const [id,name]of [['r932EasyMinus','adjust'],['r932EasyPlay','start'],['r932EasyPlus','adjust'],['r932EasyStop','stop']]){const before=f.commands.length;f.$(id).click();assert.equal(f.commands.length,before+1);assert.equal(f.commands.at(-1).name,name);}
  });
  await test(`${mode}: normal collapse leaves settings disclosure and its open body unchanged`,()=>{
   const f=prepare(mode);f.$('r938PanelToggle').click();const settings=f.$('r938PanelBody'),settingsToggle=f.$('r938PanelToggle');assert.equal(settings.hidden,false);settingsToggle.focus();f.$('r1056FocusControlsToggle').click();controls(f,false);assert.equal(settings.hidden,false);assert.equal(settingsToggle.getAttribute('aria-expanded'),'true');assert.equal(f.document.activeElement,settingsToggle);f.$('r1056FocusControlsToggle').click();assert.equal(settings.hidden,false);assert.equal(f.commands.length,0);
  });
  await test(`${mode}: focus remains on the easy-controls toggle across focus exit`,()=>{
   const f=prepare(mode);f.sync(mode,true);const toggle=f.$('r1056FocusControlsToggle');toggle.focus();f.sync(mode,false);assert.equal(f.document.activeElement,toggle);assert(visible(toggle));toggle.click();assert.equal(f.document.activeElement,toggle);controls(f,false);assert.equal(f.commands.length,0);
  });
  await test(`${mode}: recreating the layout controller reuses the saved ordinary visibility preference`,()=>{
   const f=prepare(mode);f.window.SukunBerhetLayout.setFocusControls(false);const play=f.$('r932EasyPlay');f.root.hidden=true;f.window.SukunBerhetLayout.sync(f.root,false);vm.runInContext(source,f.context);f.root.hidden=false;f.sync(mode,false);assert.equal(f.$('r932EasyPlay'),play);controls(f,false);assert.equal(f.storage.get(key),'0');f.$('r1056FocusControlsToggle').click();controls(f,true);assert.equal(f.storage.get(key),'1');assert.equal(f.commands.length,0);
  });
  await test(`${mode}: native hidden attributes restore after teardown and are not overwritten by preference`,()=>{
   const f=fixture(app),transport=f.$('r932EasyPlay').parentElement,hint=f.$('r968ManualHint'),summary=f.add('r1056ReadingSummary'),quick=f.$('r932WheelControls'),oldParent=quick.parentElement;transport.hidden=true;hint.hidden=true;summary.hidden=true;const summaryParent=summary.parentElement;
   f.sync(mode,false);controls(f,true);f.window.SukunBerhetLayout.setFocusControls(false);f.root.hidden=true;f.window.SukunBerhetLayout.sync(f.root,false);assert.equal(transport.hidden,true);assert.equal(hint.hidden,true);assert.equal(summary.hidden,true);assert.equal(summary.parentElement,summaryParent);assert.equal(quick.parentElement,oldParent);assert.equal(f.$('r932EasyPlay').parentElement,transport);assert.equal(f.$('r932EasyStop').parentElement,transport);assert.equal(transport.id,'');assert.equal(f.$('r938Panel'),null);assert.equal(f.commands.length,0);
  });
 }
 for(const target of ['r932EasyPlay','r932EasyStop','r1056ReadingSource'])await test(`Hiding ordinary controls moves focus only out of the hidden ${target} subtree`,()=>{
  const f=prepare('esma');f.$(target).focus();f.window.SukunBerhetLayout.setFocusControls(false);assert.equal(f.document.activeElement,f.$('r1056FocusControlsToggle'));assert(visible(f.document.activeElement));assert.equal(f.commands.length,0);
 });
 for(const target of ['r938PanelToggle','r932QuickWheel','r920TefExit'])await test(`Collapsing easy controls preserves focus on unrelated ${target}`,()=>{
  const f=prepare('berhet');if(target==='r920TefExit')f.sync('berhet',true);if(target==='r932QuickWheel')f.$('r938PanelToggle').click();const node=f.$(target);node.focus();f.window.SukunBerhetLayout.setFocusControls(false);assert.equal(f.document.activeElement,node);assert(visible(node));assert.equal(f.commands.length,0);
 });
 for(const language of ['tr','en'])await test(`${language}: captions and accessible disclosure state update in ordinary and focus modes`,()=>{
  const f=prepare('esma',{language});for(const tef of [false,true,false]){f.sync('esma',tef);for(const shown of [false,true]){f.window.SukunBerhetLayout.setFocusControls(shown);const node=f.$('r1056FocusControlsToggle');assert.equal(node.textContent,language==='en'?(shown?'Hide easy controls':'Show easy controls'):(shown?'Kolay kontrolleri gizle':'Kolay kontrolleri göster'));assert.equal(node.getAttribute('aria-expanded'),String(shown));assert.deepEqual(node.getAttribute('aria-controls').split(/\s+/).sort(),targets.slice().sort());assert(visible(node));}}assert.equal(f.$('r1056SettingsCaption').textContent,language==='en'?'Settings and appearance':'Ayarlar ve görünüm');assert.equal(f.commands.length,0);
 });
 await test('Language changes while ordinary controls are hidden retain state and focus',()=>{
  const f=prepare('esma');f.$('r1056FocusControlsToggle').focus();f.window.SukunBerhetLayout.setFocusControls(false);const toggle=f.$('r1056FocusControlsToggle');for(const [lang,label]of [['en','Show easy controls'],['tr','Kolay kontrolleri göster']]){f.window.I18N.lang=lang;f.window.dispatchEvent(new f.Event('sukun:languagechange'));assert.equal(toggle.textContent,label);assert.equal(f.document.activeElement,toggle);controls(f,false);}assert.deepEqual(f.writes,[[key,'0']]);assert.equal(f.commands.length,0);
 });
 await test('Only explicit preference changes write storage; repeated sync and invalid values do not',()=>{
  const f=prepare('esma');for(const value of [undefined,null,0,1,'false',{}])assert.equal(f.window.SukunBerhetLayout.setFocusControls(value),false);f.window.SukunBerhetLayout.setFocusControls(false);f.window.SukunBerhetLayout.setFocusControls(false);for(let i=0;i<60;i++)f.sync('esma',i%2===0);assert.deepEqual(f.writes,[[key,'0']]);assert.equal(f.commands.length,0);assert.equal(f.window.SukunBerhetLayout.snapshot().open,false);
 });
 await test('New independent page fixture reads hidden preference without resetting it',()=>{
  const f=prepare('esma');f.$('r1056FocusControlsToggle').click();const reloaded=prepare('berhet',{preference:f.storage.get(key)});controls(reloaded,false);assert.equal(reloaded.writes.length,0);reloaded.$('r1056FocusControlsToggle').click();controls(reloaded,true);assert.deepEqual(reloaded.writes,[[key,'1']]);assert.equal(reloaded.commands.length,0);
 });
 await test('Late summary created after ordinary collapse joins the hidden quick-control scope',()=>{
  const f=fixture(app);f.sync('esma',true);f.sync('esma',false);f.$('r1056FocusControlsToggle').click();f.reading();f.sync('esma',false);controls(f,false);assert.equal(f.$('r1056ReadingSummary').parentElement,f.$('r932WheelControls'));f.$('r1056FocusControlsToggle').click();controls(f,true);assert.equal(f.commands.length,0);
 });
 const report={suite:'r1063 easy controls after focus exit',source:app,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),passed:results.filter(result=>result.passed).length,total:results.length,method:'Actual shipped berhet-layout controller, original action nodes and production quick delegates run in the existing minimal DOM fixture. Covers state, ownership, focus and persistence; CSS rendering and physical device behavior require full-app checks.',results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
