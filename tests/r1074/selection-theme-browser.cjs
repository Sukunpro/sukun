'use strict';
// Exact production bytes in one isolated native Chromium profile. Only
// generated personal WAV input and the device-TTS observer use the fixture.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(__dirname,'evidence/selection-theme-browser.json'));
const report={suite:'r1074 canonical selected-family theme with native playback and real global hold',build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),startedAt:new Date().toISOString(),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),testSha256:hash(fs.readFileSync(__filename)),checks:[],limitations:[
 'One isolated headless Linux Chromium at 390×844, Classic/Feyz, normal production visual CSS. Native trusted tab/Play/frequency clicks and genuine native media/Web Audio clocks are observed.',
 'Generated 30-second WAVs populate only two isolated personal recording slots; no user recordings or browser data are accessed. Device TTS is controlled by the shared fixture and must never be used in these personal-input cases.',
 'The public production selection and global Pause/Resume APIs are used to measure identity and command scope. A real production frequency provider retains the aggregate Pause while the old dhikr is retired.',
 'Service workers are blocked by the engineering fixture; Android screen locking, audible sound, OS focus and SW activation are not measured here.'
]};
let f,p;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=!!report.total&&report.total===report.passed;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));}
async function state(){return p.evaluate(()=>{
 const R=document.documentElement,scene=SukunSceneEngine.snapshot();
 const nodes=[...new Set([...document.querySelectorAll('audio'),window.__sukJourneyNative?.a].filter(Boolean))];
 return{build:SUKUN_BUILD,journal:SukunProgressJournal.snapshot(),journalNotice:{visible:!!document.getElementById('r982JournalNotice')&&!document.getElementById('r982JournalNotice').hidden,text:document.getElementById('r982JournalNotice')?.textContent||''},selected:{cat:zKat(),index:zIdx()},scene,theme:SukunBerhetTheme.snapshot(),root:{family:R.dataset.r1074Theme,dock:R.dataset.r933BerhetDock,context:R.dataset.r914Context,esmaScene:R.dataset.r923EsmaScene},tab:document.querySelector('.tabs .tab.act')?.dataset.t,menu:[...document.querySelectorAll('.tabs .tab')].map(e=>({tab:e.dataset.t,border:getComputedStyle(e).borderImageSource,background:getComputedStyle(e).backgroundColor})),session:SukunSessionState.snapshot(),aggregate:SukunAudioSessionRegistry.aggregateSnapshot(),direct:SukunDirectZikirTransportR698.state(),transport:SukunR698Transport.snapshot(),fr:{playing:FR.playing,ctx:typeof ctx==='undefined'?null:ctx?.state,time:typeof ctx==='undefined'?null:ctx?.currentTime},lock:SukunLockAudio.snapshot(),native:nodes.filter(a=>a.dataset.sukSilentCarrier!=='1'&&(a.dataset.sukLockKey||a._sukunRecordingKey||a===window.__sukJourneyNative?.a)).map(a=>({key:a.dataset.sukLockKey||a._sukunRecordingKey||window.__sukJourneyNative?.recordingKey||'',paused:a.paused,ended:a.ended,time:a.currentTime,ready:a.readyState})),speechCount:__r1064SpeechFixture.log.length,clicks:__r1074NativeClicks.slice()};
 });}
async function check(name,fn){try{report.checks.push({name,passed:true,evidence:await fn()});}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error),state:await state().catch(()=>null)});}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
async function idle(){await p.waitForFunction(()=>!SukunInteractionGateR732.active(),null,{timeout:5000});await p.waitForTimeout(100);}
async function tap(selector){await idle();await p.locator(selector).click();await idle();}
async function select(mode){const result=await p.evaluate(mode=>SukunSessionState.command('select',{mode,journeyKind:'single',index:0}),mode);assert.equal(result.accepted,true,JSON.stringify(result));await p.waitForFunction(mode=>SukunSceneEngine.snapshot().selectionTheme.family===(mode==='berhet'?'berhet':'esma')&&SukunSceneEngine.snapshot().sceneLoad==='ready',mode,{timeout:15000});await idle();return result;}
function assertTheme(s,family,tab){
 assert.equal(s.selected.cat,family);assert.equal(s.selected.index,0);assert.equal(s.scene.selectionTheme.family,family);assert.equal(s.root.family,family);assert.equal(s.root.dock,family==='berhet'?'1':'0');assert.equal(s.theme.dock,family==='berhet');assert.equal(s.theme.family,family);assert.equal(s.scene.requestedFamily,family);assert.equal(s.tab,tab);assert.equal(s.scene.sceneLoad,'ready');
 if(family==='berhet'){assert.equal(s.root.context,'berhet');assert(s.scene.activeSceneId);for(const m of s.menu)assert.match(m.border,/gem-(emerald|diamond)/,JSON.stringify(m));}
 else{assert.equal(s.root.context,'base');assert.equal(s.root.esmaScene,'classic');assert.equal(s.scene.activeSceneId,'esma-classic');assert.match(s.scene.renderedScene,/mevlevi\.webp/);for(const m of s.menu)assert(!/gem-(emerald|diamond)/.test(m.border),JSON.stringify(m));}
 assert.equal(s.speechCount,0,'Personal inputs must never fall back to controlled device TTS');assert.equal(s.journal.error,'','Progress snapshots must remain valid');assert.equal(s.journalNotice.visible,false,s.journalNotice.text);
}
async function clock(mode){await p.waitForFunction(mode=>{const a=SukunLockAudio.snapshot(),s=SukunSessionState.snapshot();return s.activeMode===mode&&s.phase==='PLAYING'&&s.sourceOrigin==='personal'&&a.playing&&a.readyState>=2&&a.currentTime>.1},mode,{timeout:20000});const before=await state();await p.waitForTimeout(200);const after=await state();assert(after.lock.currentTime>before.lock.currentTime,'Real native media clock must progress');return{before,after};}
async function visit(family,phase){for(const tab of ['amb','frq','rx','zkr'])await check(`${family} ${phase}: trusted ${tab} tab keeps one scene/menu/dock family`,async()=>{
  const before=await state();await tap(`.tab[data-t="${tab}"]`);const s=await state();assertTheme(s,family,tab);assert.equal(s.selected.index,before.selected.index);assert.equal(s.session.count,before.session.count,'Navigation alone must not credit a repetition');
  assert(s.clicks.some(x=>x.trusted&&x.tab===tab),'Trusted native tab click must be observed');
  if(phase==='idle')assert.equal(s.direct.auto,false);
  if(phase==='playing'){assert.equal(s.session.phase,'PLAYING');assert.equal(s.lock.playing,true);}
  if(phase==='global-paused'){assert.equal(s.aggregate.paused,true);assert.equal(s.fr.ctx,'suspended');assert.equal(s.native.filter(a=>!a.paused&&!a.ended&&a.ready>=2).length,0);}
  return s;
 });}
async function main(){
 f=await fixture(root,{width:390,height:844,seed:{'sukun.kilitAcik':'true','sukun.esma.background.r923':'classic'}});p=f.page;report.browser=f.browser.version();
 await p.evaluate(async tone=>{
  KLT_AC('r1074-isolated-fixture');const blob=()=>new Blob([Uint8Array.from(atob(tone),c=>c.charCodeAt(0))],{type:'audio/wav'});
  for(const key of ['berhet:0','esma:0:nida']){await REC_DB.set(key,blob());RECKEYS.add(key);}
  NIYET.on=false;NIYET.spk=false;NIYET.devir=false;ZA.kapali=true;await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');SPK.on=true;SukunR698VoiceIntent.explicit(true);
  Object.assign(Z,{target:999,targetMode:'manual',adv:false,tick:false,vib:false});if(SukunTempo.set(6,'r1074-fixture')!==true)throw Error('Public tempo configuration failed');const focus=document.getElementById('r920Focus');focus.checked=false;focus.dispatchEvent(new Event('change',{bubbles:true}));
  window.__r1074NativeClicks=[];document.addEventListener('click',e=>{const el=e.target.closest?.('button');if(el)__r1074NativeClicks.push({id:el.id,tab:el.dataset.t||'',trusted:e.isTrusted,at:performance.now()});},true);
 },wav(30,330).toString('base64'));
 await check('Exact candidate boots Classic/Feyz with private family unlocked only in fixture',async()=>{const s=await p.evaluate(()=>({build:SUKUN_BUILD,layout:SukunLayoutModes.current(),skin:SukunShellSkin.getAppearance(),unlocked:SukunSecretPolicy.unlocked()}));assert.equal(s.build,report.build);assert.equal(s.layout,'classic');assert.equal(s.skin,'feyz');assert.equal(s.unlocked,true);return s;});
 await select('berhet');await visit('berhet','idle');
 await check('Trusted Berhetiyye Play uses generated personal audio with a progressing native clock',async()=>{await tap('#r932EasyPlay');return clock('berhet');});
 await visit('berhet','playing');
 await check('Real production frequency joins Berhetiyye and global Pause suspends its Web Audio context',async()=>{
  await tap('.tab[data-t="frq"]');await tap('#frToggle');await p.waitForFunction(()=>FR.playing&&ctx?.state==='running',null,{timeout:10000});const playing=await state();assert.equal(playing.lock.playing,true);assert.equal(await p.evaluate(()=>SukunAudioSessionRegistry.pauseAll('ui:r1074-theme-fixture')),true);await p.waitForFunction(()=>SukunAudioSessionRegistry.aggregateSnapshot().paused&&ctx?.state==='suspended',null,{timeout:10000});const held=await state();assert.equal(held.fr.playing,true);assert.equal(held.lock.playing,false);assert.equal(held.native.filter(a=>!a.paused&&!a.ended&&a.ready>=2).length,0);return{playing,held};
 });
 await visit('berhet','global-paused');
 await check('Esma selection under retained frequency hold restores Classic Mevlevi without waking media or context',async()=>{
  const before=await state();await select('esma');const s=await state();assertTheme(s,'esma','zkr');assert.equal(s.aggregate.paused,true);assert.equal(s.fr.playing,true);assert.equal(s.fr.ctx,'suspended');assert.equal(s.direct.auto,false);assert.equal(s.native.filter(a=>!a.paused&&!a.ended&&a.ready>=2).length,0);assert.equal(s.session.count,0);const requested=await p.evaluate(()=>SukunSessionState.command('start'));assert.equal(requested.accepted,false);await p.waitForTimeout(250);const still=await state();assert.equal(still.fr.ctx,'suspended');assert.equal(still.aggregate.paused,true);assert.equal(still.speechCount,before.speechCount);assert.equal(still.direct.auto,false);return{before,selected:s,startRequest:requested,still};
 });
 await visit('esma','global-paused');
 await check('Explicit global Resume releases frequency hold without reviving retired Berhetiyye',async()=>{await p.evaluate(()=>SukunAudioSessionRegistry.resumeAll());await p.waitForFunction(()=>!SukunAudioSessionRegistry.aggregateSnapshot().paused&&ctx?.state==='running',null,{timeout:10000});const s=await state();assert.equal(s.selected.cat,'esma');assert.equal(s.direct.auto,false);assert.equal(s.fr.playing,true);assert.equal(s.native.filter(a=>!a.paused&&!a.ended&&a.ready>=2).length,0);return s;});
 await check('Trusted Esma Play starts the selected personal source with a genuine native clock',async()=>{await tap('#r932EasyPlay');return clock('esma');});
 await visit('esma','playing');
 await tap('.tab[data-t="amb"]');await p.screenshot({path:path.join(path.dirname(output),'esma-classic-ambiyans.png')});
 await p.evaluate(async()=>{SukunAudioSessionRegistry.stopAll();await SukunR698Transport.whenStopped();});
 await check('Progress journal persists a valid record with no warning',async()=>{const s=await p.evaluate(()=>({journal:SukunProgressJournal.snapshot(),raw:localStorage.getItem(SukunProgressJournal.key),notice:{visible:!!document.getElementById('r982JournalNotice')&&!document.getElementById('r982JournalNotice').hidden,text:document.getElementById('r982JournalNotice')?.textContent||''},tempo:SukunTempo.snapshot()}));assert.equal(s.journal.error,'');assert.equal(s.notice.visible,false,s.notice.text);assert(s.journal.writes>0);assert(s.journal.revision>0);assert.equal(await p.evaluate(raw=>SukunProgressJournal.validate(raw),s.raw),true);assert.equal(s.tempo.value,6);assert.equal(s.tempo.maximum,6);return s;});
 await check('Every served production byte matches disk with no missing files or JS/SRI errors',async()=>{const evidence=f.evidence();for(const[name,row]of Object.entries(evidence.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'Source changed: '+name);assert.deepEqual(evidence.pageErrors,[]);assert.deepEqual(evidence.failedRequests,[]);assert(!evidence.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),evidence.consoleErrors.join('\n'));report.evidence=evidence;return{servedFiles:Object.keys(evidence.served).length,pageErrors:evidence.pageErrors,failedRequests:evidence.failedRequests};});
 report.finalState=await state();report.finishedAt=new Date().toISOString();save();
}
main().catch(error=>{report.fatal=error.stack||String(error);save();console.error(error);process.exitCode=1;}).finally(async()=>{if(f){report.evidence=report.evidence||f.evidence();save();await f.close();}console.log(JSON.stringify({build:report.build,passed:report.passed,total:report.total,output,failed:report.checks.filter(x=>!x.passed).map(x=>({name:x.name,error:x.error}))},null,2));if(!report.allPassed||report.fatal)process.exitCode=1;});
