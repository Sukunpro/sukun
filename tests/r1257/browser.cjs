'use strict';
// Runs in CI with disposable Chromium profiles, real IndexedDB and native
// media clocks. All recording bytes are locally generated tones, never user data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,wav,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'r1257-browser.json');
const report={checks:[],evidence:[],limitations:['Synthetic WAV recordings, disposable Chromium profiles and native media clocks; no physical Android, microphone, speaker or lock-screen verification.']};
let f;
const keys=['dua:tovbe','dua:seyyid','dua:salavat:1'];
const tone=wav(12,330),other=wav(12,550);
function checked(name,detail={}){report.checks.push({name,passed:true,...detail});}
async function openPanel(p,id){
 await p.evaluate(id=>{window.obClose?.();document.getElementById('dcClose')?.click();KLT_AC('r1257-synthetic-fixture');SukunFriendlyUI.go('zikir');document.querySelector('.tab[data-t="zkr"]')?.click();zNavGo(id);let el=document.getElementById(id);while(el){if(el.tagName==='DETAILS')el.open=true;el=el.parentElement}},id);
 await p.locator('#'+id).waitFor({state:'visible'});
}
async function seed(p,entries){
 await p.evaluate(async entries=>{
  for(const [key,base64] of entries){await REC_DB.set(key,new Blob([Uint8Array.from(atob(base64),x=>x.charCodeAt(0))],{type:'audio/wav'}));RECKEYS.add(key)}
  await skVoiceRestoreRefresh();
 },entries);
}
async function digests(p){return p.evaluate(async()=>{const out={};for(const key of await REC_DB.keys()){const b=await REC_DB.get(key);out[key]={type:b.type,bytes:b.size,hash:await skBackupHash(b)}}return out});}
async function idle(p){await p.waitForFunction(()=>!SukunTabOwner.snapshot().pending&&!SukunTabOwner.snapshot().releasing,null,{timeout:15000});}
async function clock(p,key){
 await p.waitForFunction(key=>[...SES.ler].some(a=>a._sukunRecordingKey===key&&!a.paused&&!a.ended&&a.currentTime>.15),key,{timeout:20000,polling:40});
 return p.evaluate(key=>{const a=[...SES.ler].find(a=>a._sukunRecordingKey===key&&!a.paused&&!a.ended);window.__r1257Media=a;return {key:a._sukunRecordingKey,time:a.currentTime,duration:a.duration,src:a.currentSrc||a.src}},key);
}
async function noErrors(){assert.deepEqual(f.errors,[]);assert(!f.consoleErrors.some(x=>/integrity|syntaxerror|referenceerror|typeerror/i.test(x)),f.consoleErrors.join('\n'));report.evidence.push(f.evidence());await f.close();f=null;}
async function playback(p,width){
 await p.evaluate(async()=>{await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('auto');SPK.on=true;SukunR698VoiceIntent.explicit(true)});
 for(const item of [
  {panel:'tvBox',button:'#tvKisimPlay',key:'dua:tovbe',pause:'tovbePause',resume:'tovbePlay',stop:'#tvStop'},
  {panel:'seyBox',button:'#seyTrPlay',key:'dua:seyyid',pause:'seyPause',resume:'seyResume',stop:'#seyStop'},
  {panel:'dhBox',button:'#dhPlay',key:'dua:salavat:1',pause:'dhPause',resume:'dhPlay',stop:'#dhStop'}
 ]){
  await idle(p);await openPanel(p,item.panel);
  if(item.panel==='dhBox'){
   if(!await p.evaluate(()=>!!SVATLA))await p.locator('#dhAtlaBtn').click();
   await p.evaluate(()=>{__r1064SpeechFixture.setAuto(true)});
  }
  const speechBefore=await p.evaluate(()=>__r1064SpeechFixture.log.length);
  await p.locator(item.button).click();
  const playing=await clock(p,item.key);assert.match(playing.src,/^blob:/);assert(Math.abs(playing.duration-12)<.1,'Native playback must be the seeded tone');
  if(item.panel!=='dhBox')assert.equal(await p.evaluate(()=>__r1064SpeechFixture.log.length),speechBefore,'Own recording must not fall through to TTS');
  await p.evaluate(name=>window[name](),item.pause);
  await p.waitForFunction(()=>window.__r1257Media.paused);
  const pausedAt=await p.evaluate(()=>__r1257Media.currentTime);await p.waitForTimeout(300);
  assert(Math.abs(await p.evaluate(()=>__r1257Media.currentTime)-pausedAt)<.08,'Paused native clock must stay still');
  await p.evaluate(name=>{window[name]()},item.resume);
  await p.waitForFunction(t=>!__r1257Media.paused&&__r1257Media.currentTime>t+.1,pausedAt,{timeout:10000});
  await p.locator(item.stop).click();await p.waitForFunction(()=>__r1257Media.paused||__r1257Media.ended);
  await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>[...SES.ler].some(a=>a._sukunRecordingKey&&!a.paused&&!a.ended)),false,'Stop must retire foreground recording');
  checked(width+' '+item.key+' visible start, native progress, pause/resume and stop',{playing});
 }
}
async function prayer(p,width){
 await openPanel(p,'ferasetBox');
 const view=await p.locator('#ferasetText').evaluate(el=>({text:el.textContent,client:el.clientWidth,scroll:el.scrollWidth,rect:el.getBoundingClientRect().toJSON(),wrap:getComputedStyle(el).whiteSpace}));
 assert(view.text.includes('[Ahzâb 33/43]'));assert(view.text.includes('هُوَ الَّذِي يُصَلِّي عَلَيْكُمْ'));
 assert(view.text.includes('Hüvellezî yusallî aleyküm ve melâiketühû'));
 assert(view.text.includes('Sizi karanlıklardan aydınlığa çıkarmak'));
 assert(view.text.length>15000,'Full prayer, not a verse-only excerpt');assert.equal(view.wrap,'pre-wrap');assert(view.scroll<=view.client+1,'Prayer must wrap within its panel');
 checked(width+' complete Feraset prayer and Ahzab 33:43 remain readable',{characters:view.text.length,width:view.client});
}
(async()=>{try{
 let exported,sourceDigests;
 for(const width of [390,1440]){
  f=await fixture(root,{width,height:900,seed:{'sukun.onboardSeen':'1','sukun.obDone':'1'}});const p=f.page;
  await seed(p,keys.map(k=>[k,tone.toString('base64')]));sourceDigests=await digests(p);
  await playback(p,width);await prayer(p,width);
  assert.deepEqual(await digests(p),sourceDigests,'Playback must preserve recording bytes');
  if(width===390){
   await idle(p);await openPanel(p,'ydkBox');await p.locator('#ydkDisa').click();
   const link=p.locator('#r1257VoiceTransferFiles a[download]');await link.first().waitFor({state:'visible'});assert.equal(await link.count(),1);
   const downloadPromise=p.waitForEvent('download');await link.first().click();const download=await downloadPromise;
   const downloadedPath=await download.path();assert(downloadedPath,'Browser must expose a completed file download');assert.equal(await download.failure(),null);
   const bytes=fs.readFileSync(downloadedPath);exported={name:download.suggestedFilename(),bytes};const parsed=JSON.parse(bytes.toString());
   assert.deepEqual(Object.keys(parsed.kayitlar).sort(),keys.slice().sort());assert.equal(parsed.backupSet.totalRecords,3);assert(parsed.backupSet.manifestHash);
   assert.deepEqual(await digests(p),sourceDigests);checked('Mobile export produces a downloadable verified JSON file with personal records only',{name:exported.name,bytes:bytes.length,sha256:hash(bytes)});
  }
  await noErrors();
 }
 // A separate fixture has a separate origin and a new profile: no source DB,
 // cookies, in-memory catalog or localStorage is shared with the destination.
 f=await fixture(root,{width:390,height:900,seed:{'sukun.onboardSeen':'1','sukun.obDone':'1'}});const p=f.page;
 assert.deepEqual(await digests(p),{});await seed(p,[['dua:tovbe',other.toString('base64')]]);const existing=await digests(p);
 await p.evaluate(()=>localStorage.setItem('r1257-transfer-sentinel','keep'));
 await openPanel(p,'ydkBox');
 await p.locator('#r1011VoiceRestoreFile').setInputFiles({name:exported.name,mimeType:'application/json',buffer:exported.bytes});
 await p.waitForFunction(async()=>!!await REC_DB.get('dua:seyyid')&&!!await REC_DB.get('dua:salavat:1'),null,{timeout:20000});
 await p.waitForFunction(()=>/2 eksik ses eklendi; 1 mevcut ses korundu/.test(document.getElementById('ydkDurum').textContent),null,{timeout:20000});
 const imported=await digests(p);assert.deepEqual(imported['dua:tovbe'],existing['dua:tovbe']);assert.deepEqual(imported['dua:seyyid'],sourceDigests['dua:seyyid']);assert.deepEqual(imported['dua:salavat:1'],sourceDigests['dua:salavat:1']);assert.equal(await p.evaluate(()=>localStorage.getItem('r1257-transfer-sentinel')),'keep');
 checked('File import into a second profile copies missing audio and preserves destination recording bytes and settings');
 await idle(p);await p.locator('#r1011VoiceRestoreFile').setInputFiles({name:exported.name,mimeType:'application/json',buffer:exported.bytes});
 await p.waitForFunction(()=>/0 eksik ses eklendi; 3 mevcut ses korundu/.test(document.getElementById('ydkDurum').textContent),null,{timeout:20000});assert.deepEqual(await digests(p),imported);checked('Repeated import is idempotent');
 const tampered=JSON.parse(exported.bytes.toString());tampered.kayitlar['dua:seyyid'].veri=other.toString('base64');
 await idle(p);await p.locator('#r1011VoiceRestoreFile').setInputFiles({name:'tampered-synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(tampered))});
 await p.waitForFunction(()=>/tamamlanamadı/.test(document.getElementById('ydkDurum').textContent),null,{timeout:20000});assert.deepEqual(await digests(p),imported);checked('Tampered audio is rejected without changing destination recordings');
 await p.reload({waitUntil:'load'});await p.waitForFunction(()=>typeof skVoiceRestoreRefresh==='function');await p.evaluate(()=>skVoiceRestoreRefresh());assert.deepEqual(await digests(p),imported);
 await p.evaluate(async()=>{KLT_AC('r1257-import-playback');await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('auto')});await idle(p);await openPanel(p,'seyBox');await p.locator('#seyTrPlay').click();await clock(p,'dua:seyyid');await p.locator('#seyStop').click();await p.waitForFunction(()=>__r1257Media.paused);checked('Transferred recording persists after reload and plays through the visible reader');
 await noErrors();report.allPassed=true;
}catch(error){report.allPassed=false;report.error=error.stack;process.exitCode=1;if(f){report.failureState=await f.page.evaluate(()=>({tab:window.SukunTabOwner?.snapshot?.(),reader:window.SukunReadingAudioR1064?.snapshot?.(),status:document.getElementById('ydkDurum')?.textContent,media:typeof SES==='object'?[...SES.ler].map(a=>({key:a._sukunRecordingKey,time:a.currentTime,paused:a.paused,ended:a.ended})):[]})).catch(()=>null);report.evidence.push(f.evidence())}}
finally{if(f)await f.close();report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report))}})();
