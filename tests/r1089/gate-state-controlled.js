'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),crypto=require('node:crypto');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const repo=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(__dirname,'evidence/gate-state-controlled.json'));
fs.mkdirSync(path.dirname(output),{recursive:true});
const portal=path.join(repo,'assets/berhetiyye-gate/portal-r1080.js');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sukun-gate-seams-'));
const bootstrap=`
window.audit={grant:true,busy:false,modern:'idle',manual:false,mic:false,verifyCalls:0,commits:0,enters:0,enterPending:false,lockCalls:0,voices:[],effects:[],enable:[]};
window.R170={Player:{playing:false,paused:false}};
window.SukunSessionState={peek:()=>({playing:false,preparing:false,presentationOnly:false})};
window.SukunPhysicalRecordingBusyR696=()=>audit.busy;
window.SukunReadingAudioR1064={snapshot:()=>({phase:audit.modern})};
window.SukunManualVoice={busy:()=>audit.manual};
window.SukunTickSound={isRecording:()=>audit.mic};
window.speechSynthesis={speaking:false,pending:false};
window.Audio=function(src){this.src=src;this.volume=1;this.currentTime=0;this.paused=true;this.play=()=>{this.paused=false;this.promise=new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject});return this.promise};this.pause=()=>{this.paused=true;this.pauses=(this.pauses||0)+1};audit.voices.push(this)};
window.createSukunPortalAudio=({onStatus})=>{let enabled=false,volume=.35,mix=1,generation=0;const status=()=>({enabled,volume,mix,available:true,ready:enabled,blocked:false});const notify=()=>onStatus(status());return{enableFromGesture:()=>{const mine=++generation;return new Promise(resolve=>{audit.enable.push(()=>{if(mine===generation)enabled=true;notify();resolve(mine===generation&&enabled)})})},setEnabled:v=>{generation++;enabled=!!v;notify()},setVolume:v=>{volume=v;notify()},setMix:v=>{mix=v;notify()},stop:()=>audit.effects.push('stop'),play:v=>{audit.effects.push(v);return enabled},snapshot:status}};
`;
const adapter=`
SukunBerhetGate.configure({invitationAudioURL:'./labelled-invitation-fixture.mp3',adapter:{
isUnlocked:()=>audit.grant,verify:()=>{audit.verifyCalls++;return new Promise(resolve=>audit.resolveVerify=resolve)},
sessionOpened:({signal})=>{if(!signal.aborted){audit.grant=true;audit.commits++}},
enter:()=>{audit.enters++;if(!audit.grant)return Promise.reject(Error('Access denied'));if(audit.enterPending)return new Promise(resolve=>audit.resolveEnter=resolve);return Promise.resolve()},
endSession:()=>{audit.lockCalls++;audit.grant=false;dispatchEvent(new CustomEvent('sukun:secretaccesschange',{detail:{unlocked:false}}));return new Promise(resolve=>audit.resolveLock=resolve)}
}});
document.getElementById('entry').onclick=()=>SukunBerhetGate.open({trigger:document.getElementById('entry')});
`;
const html=path.join(temp,'fixture.html');
fs.writeFileSync(html,'<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><button id="entry">Gate</button><script>'+bootstrap+'</script><script src="'+pathToFileURL(portal).href+'"></script><script>'+adapter+'</script></body></html>');
const report={kind:'r1089 controlled gate state regression',source:{path:path.relative(repo,portal),sha256:crypto.createHash('sha256').update(fs.readFileSync(portal)).digest('hex')},checks:[],limitations:['Exact production portal module in native Chromium DOM with controlled clocks. Effects engine, HTMLAudio promises and access adapter are labelled doubles; audible/native recording behavior is tested separately.','No real user credentials, physical Samsung/Android lock screen, microphone capture or remote entitlement is measured.']};
let browser;
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
async function fixture(grant=true){const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await p.clock.install();await p.goto(pathToFileURL(html).href);await p.evaluate(v=>audit.grant=v,grant);return p;}
async function open(p){await p.locator('#entry').click();await p.clock.runFor(20);}
async function enable(p){await p.evaluate(()=>audit.enable.at(-1)?.());await p.clock.runFor(2);}
async function ready(p){await open(p);await p.waitForSelector('#sbgEnter');await enable(p);}
async function pressVoice(p){await p.locator('[data-act="voice"]').click();}
async function check(name,fn){let p;try{p=await fixture();const evidence=await fn(p);report.checks.push({name,passed:true,evidence});}catch(e){report.checks.push({name,passed:false,error:e.stack||String(e)});}finally{if(p)await p.close();fs.writeFileSync(output,JSON.stringify(report,null,2));}}
(async()=>{browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/tmp/sukun-browser/chromium',args:['--no-sandbox']});try{
await check('Superseded invitation rejection leaves replacement audio and label intact',async p=>{
 await ready(p);await pressVoice(p);await pressVoice(p);
 await p.evaluate(()=>{audit.voices[1].resolve();audit.voices[0].reject(new DOMException('Superseded','AbortError'));});await p.clock.runFor(5);
 const e=await p.evaluate(()=>({playing:SukunBerhetGate.snapshot().invitation.playing,label:document.querySelector('[data-act="voice"]').textContent,paused:audit.voices.map(a=>a.paused)}));
 assert.equal(e.playing,true);assert.equal(e.label,'Türkçe daveti dinle');assert.deepEqual(e.paused,[true,false]);return e;
});
await check('Superseded invitation fulfillment cannot stop replacement source',async p=>{
 await ready(p);await pressVoice(p);await pressVoice(p);await p.evaluate(()=>{audit.voices[1].resolve();audit.voices[0].resolve();});await p.clock.runFor(5);
 const e=await p.evaluate(()=>({playing:SukunBerhetGate.snapshot().invitation.playing,paused:audit.voices.map(a=>a.paused)}));assert.equal(e.playing,true);assert.deepEqual(e.paused,[true,false]);return e;
});
await check('Pending invitation close and late fulfillment cannot reopen or play',async p=>{
 await ready(p);await pressVoice(p);await p.evaluate(()=>{SukunBerhetGate.close({fromHistory:true});audit.voices[0].resolve();});await p.clock.runFor(10);
 const e=await p.evaluate(()=>({state:SukunBerhetGate.snapshot(),voice:{paused:audit.voices[0].paused,time:audit.voices[0].currentTime}}));assert.equal(e.state.open,false);assert.equal(e.state.invitation.playing,false);assert.equal(e.voice.paused,true);assert.equal(e.voice.time,0);return e;
});
await check('Old pending enable does not stop a replacement door cue',async p=>{
 await open(p);await p.evaluate(()=>{SukunBerhetGate.close({fromHistory:true});SukunBerhetGate.open();});await p.clock.runFor(20);await p.evaluate(()=>audit.enable[1]());await p.clock.runFor(5);const before=await p.evaluate(()=>audit.effects.slice());await p.evaluate(()=>audit.enable[0]());await p.clock.runFor(5);
 const e=await p.evaluate(()=>({enabled:SukunBerhetGate.snapshot().audio.enabled,effects:audit.effects.slice()}));assert.equal(e.enabled,true);assert.deepEqual(e.effects,before);return e;
});
await check('Hidden return keeps preferred effects and does not replay stale cues',async p=>{
 await ready(p);await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await p.clock.runFor(5);
 const e=await p.evaluate(()=>({audio:SukunBerhetGate.snapshot().audio,button:document.getElementById('sbgAudioToggle').textContent}));assert.equal(e.audio.preferredEnabled,true);assert.equal(e.audio.enabled,false);assert.match(e.button,/aç/);return e;
});
await check('Independent modern preparing and playing block narration before physical sound',async p=>{
 await ready(p);const evidence=[];
 for(const phase of ['preparing','playing']){
  await p.evaluate(phase=>{audit.modern=phase;dispatchEvent(new CustomEvent('sukun:readingchange'));document.querySelector('[data-act="voice"]').click();},phase);
  const e=await p.evaluate(()=>({phase:audit.modern,disabled:document.querySelector('[data-act="voice"]').disabled,audio:SukunBerhetGate.snapshot().audio,invitation:SukunBerhetGate.snapshot().invitation,created:audit.voices.length}));
  assert.equal(e.disabled,true);assert.equal(e.audio.mix,.32);assert.equal(e.invitation.playing,false);assert.equal(e.created,0);evidence.push(e);
 }return evidence;
});
await check('New modern preparation stops only the owned invitation immediately',async p=>{
 await ready(p);await pressVoice(p);await p.evaluate(()=>audit.voices[0].resolve());await p.clock.runFor(2);
 await p.evaluate(()=>{audit.modern='preparing';dispatchEvent(new CustomEvent('sukun:readingchange'));});
 const e=await p.evaluate(()=>({phase:audit.modern,paused:audit.voices[0].paused,time:audit.voices[0].currentTime,gate:SukunBerhetGate.snapshot(),commits:audit.commits,enters:audit.enters,locks:audit.lockCalls}));
 assert.equal(e.paused,true);assert.equal(e.time,0);assert.equal(e.phase,'preparing');assert.equal(e.gate.audio.mix,.32);assert.equal(e.commits,0);assert.equal(e.enters,0);assert.equal(e.locks,0);return e;
});
await check('Paused independent reader permits a new invitation and restores own mix',async p=>{
 await ready(p);await p.evaluate(()=>{audit.modern='preparing';dispatchEvent(new CustomEvent('sukun:readingchange'));audit.modern='paused';dispatchEvent(new CustomEvent('sukun:readingchange'));});
 assert.equal(await p.locator('[data-act="voice"]').isEnabled(),true);await pressVoice(p);await p.evaluate(()=>audit.voices[0].resolve());await p.clock.runFor(2);
 const e=await p.evaluate(()=>({reader:audit.modern,gate:SukunBerhetGate.snapshot()}));assert.equal(e.reader,'paused');assert.equal(e.gate.audio.mix,1);assert.equal(e.gate.invitation.playing,true);return e;
});
await check('External revocation removes ready entry and stops owned narration without adapter commands',async p=>{
 await ready(p);await pressVoice(p);await p.evaluate(()=>audit.voices[0].resolve());await p.clock.runFor(2);
 await p.evaluate(()=>{audit.grant=false;dispatchEvent(new CustomEvent('sukun:secretaccesschange',{detail:{unlocked:false}}));});await p.clock.runFor(20);
 const e=await p.evaluate(()=>({state:SukunBerhetGate.snapshot(),entry:!!document.getElementById('sbgEnter'),paused:audit.voices[0].paused,time:audit.voices[0].currentTime,enters:audit.enters,locks:audit.lockCalls,commits:audit.commits}));
 assert.equal(e.state.authenticated,false);assert.equal(e.state.reason,'revoked');assert.equal(e.state.phase,'sealed');assert.equal(e.entry,false);assert.equal(e.paused,true);assert.equal(e.time,0);assert.equal(e.enters,0);assert.equal(e.locks,0);assert.equal(e.commits,0);return e;
});
await check('Revocation during verification aborts late result and clears old timeout',async p=>{
 await p.evaluate(()=>audit.grant=false);await open(p);await enable(p);await p.locator('[data-act="knock"]').click();await p.clock.runFor(10);await p.locator('#sbgPassword').fill('labelled-fixture');await p.locator('button[type="submit"]').click();
 await p.evaluate(()=>dispatchEvent(new CustomEvent('sukun:secretaccesschange',{detail:{unlocked:false}})));await p.clock.runFor(20);await p.evaluate(()=>audit.resolveVerify({ok:true}));await p.clock.runFor(16000);
 const e=await p.evaluate(()=>({state:SukunBerhetGate.snapshot(),grant:audit.grant,commits:audit.commits,password:!!document.getElementById('sbgPassword')}));assert.equal(e.state.authenticated,false);assert.equal(e.state.reason,'revoked');assert.equal(e.state.phase,'sealed');assert.equal(e.grant,false);assert.equal(e.commits,0);assert.equal(e.password,false);return e;
});
await check('Revocation during opening prevents the old ready animation timer',async p=>{
 await p.emulateMedia({reducedMotion:'no-preference'});await p.locator('#entry').click();
 assert.equal(await p.evaluate(()=>SukunBerhetGate.snapshot().phase),'unlocking');await p.evaluate(()=>{audit.grant=false;dispatchEvent(new CustomEvent('sukun:secretaccesschange',{detail:{unlocked:false}}));});await p.clock.runFor(6000);
 const e=await p.evaluate(()=>({state:SukunBerhetGate.snapshot(),entry:!!document.getElementById('sbgEnter')}));assert.equal(e.state.phase,'sealed');assert.equal(e.state.authenticated,false);assert.equal(e.state.reason,'revoked');assert.equal(e.entry,false);return e;
});
await check('Revocation while entry is pending fences late success without reopening',async p=>{
 await ready(p);await p.evaluate(()=>audit.enterPending=true);await p.locator('#sbgEnter').click();await p.evaluate(()=>{audit.grant=false;dispatchEvent(new CustomEvent('sukun:secretaccesschange',{detail:{unlocked:false}}));audit.resolveEnter();});await p.clock.runFor(20);
 const e=await p.evaluate(()=>({state:SukunBerhetGate.snapshot(),entry:!!document.getElementById('sbgEnter'),enters:audit.enters}));assert.equal(e.state.open,true);assert.equal(e.state.entering,false);assert.equal(e.state.authenticated,false);assert.equal(e.state.reason,'revoked');assert.equal(e.entry,false);assert.equal(e.enters,1);return e;
});
await check('A gate-owned lock event retains its pending close and revocation operation',async p=>{
 await ready(p);await p.locator('[data-act="lock-exit"]').click();
 const before=await p.evaluate(()=>({state:SukunBerhetGate.snapshot(),locks:audit.lockCalls}));assert.equal(before.state.phase,'closing');assert.equal(before.state.reason,'manual');assert.equal(before.state.revoking,true);assert.equal(before.locks,1);
 await p.evaluate(()=>audit.resolveLock());await p.clock.runFor(100);
 const after=await p.evaluate(()=>({state:SukunBerhetGate.snapshot(),locks:audit.lockCalls,grant:audit.grant}));assert.equal(after.state.open,false);assert.equal(after.locks,1);assert.equal(after.grant,false);return{before,after};
});
await check('Close immediately before verify deadline prevents late verification commit',async p=>{
 await p.evaluate(()=>audit.grant=false);await open(p);await enable(p);await p.locator('[data-act="knock"]').click();await p.clock.runFor(10);await p.locator('#sbgPassword').fill('labelled-fixture');await p.locator('button[type="submit"]').click();await p.clock.runFor(14999);await p.evaluate(()=>{SukunBerhetGate.close({fromHistory:true});audit.resolveVerify({ok:true});});await p.clock.runFor(20);
 const e=await p.evaluate(()=>({state:SukunBerhetGate.snapshot(),grant:audit.grant,commits:audit.commits}));assert.equal(e.state.open,false);assert.equal(e.grant,false);assert.equal(e.commits,0);return e;
});
await check('Closing a pending lock cannot regrant access on late completion',async p=>{
 await ready(p);await p.locator('[data-act="lock-exit"]').click();assert.equal(await p.evaluate(()=>audit.lockCalls),1);await p.evaluate(()=>SukunBerhetGate.close({fromHistory:true}));await open(p);await p.evaluate(()=>audit.resolveLock());await p.clock.runFor(20);
 const e=await p.evaluate(()=>({state:SukunBerhetGate.snapshot(),grant:audit.grant,commits:audit.commits,locks:audit.lockCalls}));assert.equal(e.state.open,true);assert.equal(e.state.authenticated,false);assert.equal(e.grant,false);assert.equal(e.commits,0);assert.equal(e.locks,1);return e;
});
}finally{
 report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total===report.passed;report.testSha256=sha(__filename);report.sourceUnchanged=sha(portal)===report.source.sha256;
 fs.writeFileSync(output,JSON.stringify(report,null,2));await browser.close();fs.rmSync(temp,{recursive:true,force:true});
 console.log(JSON.stringify({total:report.total,passed:report.passed,sourceUnchanged:report.sourceUnchanged,output},null,2));
 if(!report.allPassed||!report.sourceUnchanged)process.exitCode=1;
}})().catch(e=>{console.error(e);process.exitCode=1});
