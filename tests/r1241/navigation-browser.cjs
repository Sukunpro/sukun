'use strict';
// Native app, fresh isolated browser profile. No patched runtime/SRI responses.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {fixture}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),out=path.resolve(process.argv[3]||'/tmp/sukun-r1241-navigation');fs.mkdirSync(out,{recursive:true});
(async()=>{let f;const checks=[];try{
 f=await fixture(root,{width:1440,height:1100,seed:{'sukun.ui.shellMode':'simple'}});const p=f.page;
 for(const width of [1440,393,320])for(const lang of ['tr','en']){
  await p.setViewportSize({width,height:1100});await p.evaluate(lang=>{window.I18N.set(lang);window.SukunFriendlyUI.go('home')},lang);await p.waitForTimeout(250);
  assert.equal(await p.locator('#r1241ContinueLabel').textContent(),lang==='tr'?'İlk seyrine başla':'Start your first journey');
  await p.screenshot({path:path.join(out,`home-${width}-${lang}.png`)});
  await p.evaluate(()=>{window.SukunFriendlyUI.go('zikir');window.SukunPracticeUI.refresh()});await p.waitForTimeout(250);
  const entry=p.locator('#r1215ReadingsEntry');await entry.click();
  await p.waitForFunction(()=>document.getElementById('r1215ReadingsEntry')?.getAttribute('aria-current')==='page');
  assert.match(await p.locator('#r616ViewName').textContent(),lang==='tr'?/Okumalar/:/Readings/);
  assert.equal(await p.locator('#r616BottomNav [data-r616-view="zikir"]').getAttribute('aria-current'),null);
  // Repeated opening stays in the same section; closing restores Dhikr identity.
  await entry.click();await p.waitForTimeout(200);await p.evaluate(()=>document.getElementById('zmgOkumalar').open=false);await p.waitForTimeout(100);
  assert.equal(await entry.getAttribute('aria-current'),null);
  assert.equal(await p.locator('#r616BottomNav [data-r616-view="zikir"]').getAttribute('aria-current'),'page');
  await entry.click();await p.waitForTimeout(150);await p.evaluate(()=>window.SukunFriendlyUI.go('home'));await p.waitForTimeout(200);assert.equal(await entry.getAttribute('aria-current'),null);
  await p.evaluate(()=>{window.SukunFriendlyUI.go('zikir');window.SukunPracticeUI.refresh()});await p.waitForTimeout(200);
  for(const shown of [true,false]){
   await p.evaluate(shown=>window.SukunBerhetLayout.setFocusControls(shown),shown);await p.waitForTimeout(120);
   assert(await p.locator('#r1056FocusControlsToggle').isVisible());
   assert.equal(await p.locator('#r932EasyPlay').isVisible(),shown);
   for(const id of ['r932EasyPlay','r920JourneyRestartAll','r932EasyStop','r1056FocusControlsToggle'])assert.equal(await p.locator('#'+id).count(),1);
  }
  const fit=await p.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,hint:document.getElementById('r1241ControlHint')?.textContent,context:getComputedStyle(document.getElementById('r1215PracticeContext')).backgroundImage}));assert(fit.scroll<=fit.viewport+1,JSON.stringify(fit));assert(fit.hint);assert.match(fit.context,/linear-gradient/);
  await p.screenshot({path:path.join(out,`practice-${width}-${lang}.png`)});
  await p.locator('#r616SettingsBtn').click();await p.waitForTimeout(150);assert.match(await p.locator('#r635ArbiterPanel').innerText(),lang==='tr'?/Okuma sırası/:/Reading queue/);assert(!/foreground|arbitration/i.test(await p.locator('#r635ArbiterPanel').innerText()));await p.locator('#r616ToolsClose').click();
  checks.push({width,lang,passed:true,fit});
 }
 assert.equal(f.errors.length,0,JSON.stringify(f.errors));assert(!f.consoleErrors.some(x=>/integrity|digest|Content Security Policy/i.test(x)),JSON.stringify(f.consoleErrors));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:true,checks,evidence:f.evidence()},null,2));console.log('PASS r1241 navigation browser '+checks.length+' language/viewport scenarios');
 }catch(error){fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:false,checks,error:error.stack,evidence:f?.evidence()},null,2));throw error}finally{await f?.close()}})().catch(error=>{console.error(error);process.exitCode=1});
