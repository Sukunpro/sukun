/* Focused gate lifecycle regressions. Run directly with node; no app data/PIN is read. */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const repo = path.resolve(__dirname, '../..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'sukun-gate-lifecycle-'));
const scriptURL = pathToFileURL(path.join(repo, 'assets/berhetiyye-gate/portal-r1080.js')).href;
const stylesheetURL = pathToFileURL(path.join(repo, 'assets/berhetiyye-gate/portal-r1080.css')).href;
const invitationURL = pathToFileURL(path.join(repo, 'assets/berhetiyye-gate/invitation-tr.mp3')).href;
const bootstrap = `
window.testState={grant:false,verifyCalls:0,commits:0,endCalls:0,mode:'normal',resolveEnd:null};
window.testAudio=[];
window.Audio=function(src){this.src=src;this.volume=1;this.currentTime=0;this.paused=true;this.play=()=>{this.paused=false;return Promise.resolve()};this.pause=()=>{this.paused=true};testAudio.push(this)};
window.createSukunPortalAudio=({onStatus})=>{let enabled=false,volume=.35;const status=()=>({enabled,volume,available:true,ready:enabled,blocked:false});const notify=()=>onStatus(status());return{enableFromGesture:async()=>{enabled=true;notify();return true},setEnabled:v=>{enabled=!!v;notify()},setVolume:v=>{volume=v;notify()},stop:()=>{},play:()=>{},snapshot:status}};
`;
const adapter = `
SukunBerhetGate.configure({invitationAudioURL:${JSON.stringify(invitationURL)},adapter:{
 isUnlocked:()=>testState.grant,getAccessLabel:()=>document.documentElement.lang==='en'?'This device’s password':'Bu cihazın giriş şifresi',
 verify:async password=>{testState.verifyCalls++;return{ok:password==='fixture-valid'}},
 sessionOpened:({signal})=>{if(!signal.aborted){testState.commits++;testState.grant=true}},
 enter:async()=>{},endSession:()=>{testState.endCalls++;if(testState.mode==='pending')return new Promise(resolve=>{testState.resolveEnd=resolve});testState.grant=false;return Promise.resolve()}
}});
document.querySelector('#entry').onclick=()=>SukunBerhetGate.open({trigger:document.querySelector('#entry')});
`;
const fixture = path.join(temporary, 'fixture.html');
fs.writeFileSync(fixture, '<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="'+stylesheetURL+'"></head><body><button id="entry">Kapı</button><input id="existing" value="Zikir 17"><script>'+bootstrap+'</script><script src="'+scriptURL+'"></script><script>'+adapter+'</script></body></html>');
(async () => {
  const browser = await playwright.chromium.launch({headless:true,executablePath:process.env.SUKUN_BROWSER || '/tmp/sukun-browser/chromium',args:['--no-sandbox']});
  let count=0; const errors=[];
  async function page(options={}) { const p=await browser.newPage({viewport:{width:320,height:720},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));if(options.fallback)await p.addInitScript(()=>{HTMLDialogElement.prototype.showModal=undefined});await p.goto(pathToFileURL(fixture).href);return p; }
  function passed(label) { count++; process.stdout.write('PASS '+label+'\n'); }
  try {
    // Real browser task ordering: the old native close event must not close the replacement.
    let p=await page();await p.locator('#entry').click();await p.evaluate(()=>{SukunBerhetGate.close();SukunBerhetGate.open()});await p.waitForFunction(()=>SukunBerhetGate.snapshot().open);await p.waitForTimeout(60);assert.equal(await p.evaluate(()=>SukunBerhetGate.snapshot().open),true);assert.equal(await p.evaluate(()=>!!history.state.sukunBerhetGate),true);await p.evaluate(()=>history.back());await p.waitForFunction(()=>!SukunBerhetGate.snapshot().open);passed('same-task close/reopen survives old close event and preserves Back');await p.close();

    // Two user gestures while the provider is pending perform exactly one revocation.
    p=await page();await p.clock.install();await p.evaluate(()=>{testState.grant=true;testState.mode='pending';SukunBerhetGate.open()});await p.clock.runFor(10);await p.waitForSelector('#sbgEnter');await p.evaluate(()=>{SukunBerhetGate.lockAndExit();SukunBerhetGate.lockAndExit()});assert.equal(await p.evaluate(()=>testState.endCalls),1);assert.equal(await p.evaluate(()=>SukunBerhetGate.snapshot().authenticated),false);passed('pending lock immediately denies access and rejects duplicate gesture');
    await p.clock.runFor(16000);await p.waitForFunction(()=>SukunBerhetGate.snapshot().phase==='sealed');assert.equal(await p.evaluate(()=>SukunBerhetGate.snapshot().authenticated),false);assert.match(await p.locator('.sbg-network').textContent(),/kilitlendi/);await p.evaluate(()=>testState.resolveEnd());await p.clock.runFor(20);assert.equal(await p.evaluate(()=>SukunBerhetGate.snapshot().authenticated),false);await p.evaluate(()=>{SukunBerhetGate.close();SukunBerhetGate.open()});await p.clock.runFor(30);await p.waitForTimeout(30);assert.equal(await p.evaluate(()=>SukunBerhetGate.snapshot().authenticated),false);assert.equal(await p.evaluate(()=>testState.commits),0);passed('revocation timeout and late result cannot regrant the old session');await p.close();

    // An explicit fresh verification is the only route out of the local lock.
    p=await page();await p.locator('#entry').click();await p.locator('[data-act="knock"]').click();await p.waitForSelector('#sbgPassword');await p.locator('[data-act="extend"]').focus();await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>testState.verifyCalls),0);assert((await p.evaluate(()=>SukunBerhetGate.snapshot().remaining))>85);passed('keyboard time extension does not submit the password');await p.locator('#sbgPassword').fill('fixture-valid');await p.locator('button[type="submit"]').click();await p.waitForSelector('#sbgEnter');assert.equal(await p.evaluate(()=>testState.commits),1);passed('fresh explicit verification opens one session');

    // Recorded invitation is owned separately from app TTS and follows the shared UI volume.
    await p.locator('[data-act="voice"]').click();assert.equal(await p.evaluate(()=>SukunBerhetGate.snapshot().invitation.playing),true);await p.locator('#sbgAudioLevel').fill('20');assert.equal(await p.evaluate(()=>SukunBerhetGate.snapshot().invitation.volume),.2);await p.locator('[data-act="audio"]').click();await p.locator('[data-act="audio"]').click();assert.equal(await p.evaluate(()=>SukunBerhetGate.snapshot().invitation.playing),false);assert.equal(await p.evaluate(()=>testAudio[0].currentTime),0);passed('live invitation volume changes and effects mute resets invitation');
    await p.locator('[data-act="voice"]').click();await p.evaluate(()=>SukunBerhetGate.close());assert.equal(await p.evaluate(()=>SukunBerhetGate.snapshot().invitation.playing),false);assert.equal(await p.locator('#existing').inputValue(),'Zikir 17');passed('close stops only owned invitation and preserves existing app state');await p.close();

    // Non-native dialog fallback keeps the background inert and restores previous attributes.
    p=await page({fallback:true});await p.locator('#entry').click();assert.equal(await p.locator('#sukunBerhetGate').evaluate(el=>el.classList.contains('sbg-fallback')),true);assert.equal(await p.locator('#existing').evaluate(el=>el.inert),true);await p.keyboard.press('Escape');assert.equal(await p.locator('#existing').evaluate(el=>el.inert),false);assert.equal(await p.locator('#existing').getAttribute('aria-hidden'),null);await p.waitForTimeout(30);assert.equal(await p.locator('#entry').evaluate(el=>el===document.activeElement),true);passed('fallback modal restores background and focus');await p.close();
    assert.deepEqual(errors,[]);process.stdout.write(JSON.stringify({passed:count,errors},null,2)+'\n');
  } finally { await browser.close();fs.rmSync(temporary,{recursive:true,force:true}); }
})().catch(error=>{console.error(error);process.exitCode=1});
