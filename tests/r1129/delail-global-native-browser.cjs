'use strict';
// Full shipped app, original Giles MP3 and Chromium's actual media clock.
// The shared fixture observes media calls and controls only device TTS.
// No reader, transport, native playback, AudioLife or tab-owner endpoint is replaced.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1129-delail-global-native-browser.json');
const {fixture,hash}=require(path.join(root,'tests/r1064/browser-fixture.cjs'));
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim();
const sourceNames=['index.html','nero.html','assets/runtime/reading-audio-r1064.js','assets/runtime/delail-recorded-r1128.js'];
const report={suite:'r1129 original Delail native global dock regression',build,expectedChecks:5,startedAt:new Date().toISOString(),sourceHashes:Object.fromEntries(sourceNames.map(name=>[name,hash(fs.readFileSync(path.join(root,name)))])),testSha256:hash(fs.readFileSync(__filename)),checks:[],limitations:[
 'Fresh Linux headless Chromium with a real original MP3, HTMLAudioElement, playback clock and source ownership. No physical Android/Samsung, OS lock, headset or audible-output acceptance.',
 'Device TTS remains controlled by the shared fixture; all tested audio must be the original bundled Giles opening recording.',
 'Actual rendered Delail buttons, screen tabs and bottom dock controls are clicked. Service workers and external traffic are blocked; upgrade/offline acceptance belongs to its separate suite.'
]};
let f,p,mp3Requests=[];
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total===report.expectedChecks&&report.passed===report.total&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function check(name,fn){try{report.checks.push({name,passed:true,evidence:await fn()});}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error)});}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
async function idle(){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());}
async function tap(selector){await idle();if(await p.locator('#kandil.on').isVisible())await p.locator('#kandil.on').click({position:{x:20,y:20}});const n=p.locator(selector);assert(await n.isVisible(),'Expected visible user control '+selector);await n.scrollIntoViewIfNeeded();await n.click({timeout:15000});await p.waitForTimeout(80);}
async function snapshot(){return p.evaluate(()=>{const a=window.__sukJourneyNative?.a,s=window.SukunReadingAudioR1064.snapshot();return{reader:{id:s.id,kind:s.kind,phase:s.phase,sourceKind:s.sourceKind,content:s.content},aggregate:SukunAudioSessionRegistry.aggregateSnapshot(),native:a?{real:a instanceof HTMLAudioElement,paused:a.paused,ended:a.ended,time:a.currentTime,ready:a.readyState,src:a.src,currentSrc:a.currentSrc,owned:SES.ler.has(a),same:a===window.__r1129DelailNative}:null,zikr:Z.auto,speech:__r1064SpeechFixture.log.length,visibleZikr:document.body.classList.contains('sukun-zikir-tab'),local:{pauseDisabled:document.getElementById('r1128DelailPause').disabled,resumeDisabled:document.getElementById('r1128DelailResume').disabled}};});}
async function playing(){await p.waitForFunction(()=>{const s=SukunReadingAudioR1064.snapshot(),a=window.__sukJourneyNative?.a;return s.id==='reading:delail:acilis'&&s.phase==='playing'&&s.sourceKind==='bundled'&&a instanceof HTMLAudioElement&&!a.paused&&!a.ended&&a.readyState>=2&&SES.ler.has(a);},null,{timeout:20000});const before=(await snapshot()).native.time;await p.waitForTimeout(320);const after=await snapshot();assert(after.native.time>before+.05,'Native MP3 clock must advance');return after;}
async function held(){await p.waitForFunction(()=>SukunReadingAudioR1064.snapshot().phase==='paused'&&window.__sukJourneyNative?.a?.paused);const first=await snapshot();await p.waitForTimeout(420);const later=await snapshot();assert(Math.abs(later.native.time-first.native.time)<.04,'Paused native MP3 clock must stay fixed');assert.equal(later.native.same,true);assert.equal(later.native.owned,true);assert.equal(later.zikr,false,'Pause must not start direct zikr');return later;}
async function dockCycle(visibleZikr){
 await tap(visibleZikr?'.tab[data-t="zkr"]':'.tab[data-t="amb"]');
 const before=await playing(),requests=mp3Requests.length;assert.equal(before.visibleZikr,visibleZikr);assert.equal(before.native.same,true);
 await tap('#r588Play');const paused=await held();assert.equal(paused.aggregate.paused,true);assert(paused.aggregate.providerIds.includes('reading-r1064'));assert.equal(paused.local.pauseDisabled,true);assert.equal(paused.local.resumeDisabled,false);
 await tap('#r588Play');const resumed=await playing();assert.equal(resumed.aggregate.paused,false);assert.equal(resumed.native.same,true);assert.equal(resumed.native.src,before.native.src);assert(resumed.native.time>=paused.native.time,'Resume must continue, not restart');assert.equal(mp3Requests.length,requests,'Resume must not fetch a replacement MP3');assert.equal(resumed.speech,0,'Bundled MP3 must not fall back to device TTS');return{before,paused,resumed,requests};
}
(async()=>{try{
 const executable=process.env.CHROMIUM_PATH||chromium.executablePath();
 if(!fs.existsSync(executable))throw Error('Chromium executable unavailable: '+executable);
 process.env.CHROMIUM_PATH=executable;
 f=await fixture(root,{width:393,height:850,voices:'tr',seed:{'sukun.obSeenBuild':JSON.stringify(build),'sukun.obDone':'1','sukun.onboardSeen':'1','sukun.theme':'"feyz"','sukun.dock.r588.mode':'midi','sukun.esma.background.r923':'classic','sukun.reading.content.r1064':'"arabic"','sukun.zikirVoiceMode':'"auto"'}});p=f.page;report.browser=f.browser.version();
 p.on('request',request=>{if(/\/assets\/audio\/delail-giles-r1128\/[^/]+\.mp3(?:[?#]|$)/.test(request.url()))mp3Requests.push(request.url());});
 await p.waitForFunction(()=>window.SukunDelailRecordedR1128&&window.SukunReadingAudioR1064&&window.SukunPracticeUI&&window.SukunR698Transport);
 if(await p.locator('#dailyCard').isVisible())await p.keyboard.press('Escape');
 if(await p.locator('#dcClose').isVisible())await tap('#dcClose');
 await tap('.tab[data-t="zkr"]');await p.evaluate(()=>SukunPracticeUI.openSection('zmgOkumalar',{reveal:false}));await idle();
 if(!await p.locator('#r1128DelailPlay').isVisible())await tap('#dlBox > summary');
 await p.locator('#r1128DelailSection').selectOption('reading:delail:acilis');await tap('#r1128DelailPlay');await playing();
 await p.evaluate(()=>{window.__r1129DelailNative=window.__sukJourneyNative.a;});
 await check('One dock Pause and Resume control the same original Delail MP3 while Zikir is visible',()=>dockCycle(true));
 await check('One dock Pause and Resume preserve the same MP3 after switching to Ambiyans',()=>dockCycle(false));
 await check('Delail local Pause and Resume reflect the same native recording without a global hold',async()=>{await tap('.tab[data-t="zkr"]');const requests=mp3Requests.length;await tap('#r1128DelailPause');const paused=await held();assert.equal(paused.aggregate.paused,false);assert.equal(paused.local.pauseDisabled,true);assert.equal(paused.local.resumeDisabled,false);await tap('#r1128DelailResume');const resumed=await playing();assert.equal(resumed.native.same,true);assert.equal(resumed.native.src,paused.native.src);assert(resumed.native.time>=paused.native.time);assert.equal(mp3Requests.length,requests);return{paused,resumed};});
 await check('Global Stop retires Delail and no late playback revives the source',async()=>{const requests=mp3Requests.length;await tap('#r588Stop');await p.waitForFunction(()=>SukunReadingAudioR1064.snapshot().phase==='idle'&&window.__r1129DelailNative.paused&&!SukunR698Transport.snapshot().pendingStop);const stopped=await snapshot();assert.equal(stopped.native.owned,false);await p.waitForTimeout(1400);const late=await snapshot();assert.equal(late.reader.phase,'idle');assert.equal(late.native.paused,true);assert.equal(late.zikr,false);assert.equal(mp3Requests.length,requests);assert.equal(late.speech,0);return{stopped,late};});
 await check('Source-bound native execution has no JavaScript or integrity failures',async()=>{for(const[name,expected]of Object.entries(report.sourceHashes))assert.equal(hash(fs.readFileSync(path.join(root,name))),expected,'Production bytes changed during browser suite '+name);const e=f.evidence();for(const[name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'Served file mismatch '+name);assert.deepEqual(e.pageErrors,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));assert.deepEqual(e.failedRequests.filter(x=>!/^net::ERR_ABORTED$/.test(x.error||'')),[]);assert.equal(mp3Requests.length,1,'Only one selected original recording is fetched');return{servedFiles:Object.keys(e.served).length,mp3Requests:mp3Requests.length};});
}catch(error){report.fatal=error.stack||String(error);}finally{report.finishedAt=new Date().toISOString();if(f){report.evidence=f.evidence();await f.close();}save();console.log(JSON.stringify({build,passed:report.passed,total:report.total,expectedChecks:report.expectedChecks,allPassed:report.allPassed,fatal:report.fatal,output}));if(!report.allPassed)process.exitCode=1;}})();
