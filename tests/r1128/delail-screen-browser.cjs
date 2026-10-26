'use strict';
// Full production app and real DOM navigation. Only the device speech service
// is controlled by the existing labelled fixture; no OS/background claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(__dirname,'evidence/delail-screen-browser.json'));
const build=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim();
const report={suite:'Delail real application screen navigation',build,expectedChecks:8,startedAt:new Date().toISOString(),sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),testSha256:hash(fs.readFileSync(__filename)),checks:[],limitations:[
 'Disposable Linux headless Chromium at 393 CSS pixels in Classic/Feyz. No physical Android, Samsung compositor, OS screen lock, Bluetooth, audio focus or audible continuity claim.',
 'The shared r1064 fixture replaces only device speech voices, queue and native completion delivery. It retains a live utterance until the test explicitly emits completion; production app, transport, TTS wrappers and UI code run unchanged.',
 'Navigation uses the real rendered Ambiyans and Zikir tab buttons. This suite does not simulate document.hidden or describe synthetic lifecycle events as native visibility transitions.',
 'Disclosure setup uses the production practice/readers APIs. Service workers and external traffic are blocked; update/offline acceptance belongs to the separate required release-upgrade suite.'
]};
let f,p;
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total===report.expectedChecks&&report.passed===report.total&&!report.fatal;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
async function check(name,fn){try{report.checks.push({name,passed:true,evidence:await fn()});}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error)});}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
async function idle(){await p.waitForFunction(()=>!window.SukunInteractionGateR732?.active?.());await p.waitForTimeout(150);}
async function tap(selector){await idle();if(await p.locator('#kandil.on').isVisible())await p.locator('#kandil.on').click({position:{x:20,y:20}});await p.locator(selector).scrollIntoViewIfNeeded();await p.locator(selector).click();await idle();}
async function legacy(){return p.evaluate(()=>({playing:DL.playing,paused:DL.paused,recording:DL.kayitCaliyor,qi:DL.qi,section:DL.hedefHizb,attempt:DL.readAttempt,chain:DL.chainAttempt,total:DL.queue.length,expectedNext:DL.queue[DL.qi]?.t||null,speech:__r1064SpeechFixture.snapshot()}));}
async function modern(){return p.evaluate(()=>({reader:SukunReadingAudioR1064.snapshot(),speech:__r1064SpeechFixture.snapshot()}));}
function sameSpeech(before,after){assert(before.speech.active,'Expected a live native fixture utterance');assert.equal(after.speech.active,before.speech.active,'Screen change replaced or cancelled current text');assert.equal(after.speech.log.length,before.speech.log.length,'Screen change enqueued another utterance');assert.equal(after.speech.cancelLog.length,before.speech.cancelLog.length,'Screen change cancelled native speech');}
(async()=>{try{
 f=await fixture(root,{width:393,height:850,voices:'tr',seed:{'sukun.obSeenBuild':JSON.stringify(build),'sukun.obDone':'1','sukun.theme':'"feyz"','sukun.esma.background.r923':'classic','sukun.reading.content.r1064':'"legacy"','sukun.zikirVoiceMode':'"auto"'}});p=f.page;report.browser=f.browser.version();
 await p.waitForFunction(()=>window.SukunPracticeUI&&window.SukunReadingUIR1064&&window.SukunShellSkin);
 if(await p.locator('#dailyCard').isVisible())await p.keyboard.press('Escape');
 if(await p.locator('#dcClose').isVisible())await tap('#dcClose');
 await tap('.tab[data-t="zkr"]');
 await check('Classic active-reading button reveals the original-text explorer through its hidden ancestors',async()=>{
  await tap('#r1064CurrentReadingOpen');await p.locator('#r1064ReadingExplorer').waitFor({state:'visible'});assert.equal(await p.locator('#r1064ReadingSelect').isVisible(),true);
  const visibility=await p.locator('#zCtl').evaluate(n=>({display:getComputedStyle(n).display,hidden:n.hidden,rect:n.getBoundingClientRect().toJSON()}));assert.notEqual(visibility.display,'none');assert(visibility.rect.width>0&&visibility.rect.height>0);return visibility;
 });
 await p.evaluate(()=>SukunPracticeUI.openSection('zmgOkumalar',{reveal:false}));
 await idle();if(!await p.locator('#dlOkuBtn').isVisible())await tap('#dlBox > summary');
 await check('Classic/Feyz real Delail row starts an unchanged live TTS sentence',async()=>{
  const ui=await p.evaluate(()=>({layout:SukunLayoutModes.current(),skin:SukunShellSkin.getAppearance(),content:SukunVoiceSettings.getContent(),source:SukunVoiceSettings.getMode()}));
  assert.equal(ui.layout,'classic');assert.equal(ui.skin,'feyz');assert.equal(ui.content,'legacy');assert.equal(ui.source,'auto');
  await tap('#dlList button[data-oku="0"]');await p.waitForFunction(()=>DL.playing&&!!__r1064SpeechFixture.snapshot().active);
  const s=await legacy();assert.equal(s.recording,false);assert.equal(s.paused,false);assert.equal(s.qi,1);assert(s.total>1);return{ui,state:s};
 });
 await check('Ambiyans and Zikir screen clicks retain the same legacy sentence and cursor',async()=>{
  const before=await legacy();await tap('.tab[data-t="amb"]');assert.equal(await p.locator('#tab-zkr').evaluate(n=>n.hidden),true);await tap('.tab[data-t="zkr"]');
  const after=await legacy();sameSpeech(before,after);assert.equal(after.playing,true);assert.equal(after.paused,false);for(const key of ['qi','section','attempt','chain'])assert.equal(after[key],before[key],key+' changed on navigation');return{before,after};
 });
 await check('Opening active original text while Delail speaks preserves the same utterance and cursor',async()=>{
  const before=await legacy();await tap('#r1064CurrentReadingOpen');await p.locator('#r1064ReadingExplorer').waitFor({state:'visible'});const after=await legacy();sameSpeech(before,after);assert.equal(after.playing,true);assert.equal(after.qi,before.qi);assert.equal(after.attempt,before.attempt);return{before,after};
 });
 await check('One native completion after screen return admits exactly the next Delail sentence',async()=>{
  const before=await legacy();assert(before.expectedNext);assert.equal(await p.evaluate(()=>__r1064SpeechFixture.finish()),true);await p.waitForFunction(qi=>DL.qi===qi+1, before.qi);
  const after=await legacy();assert.equal(after.qi,before.qi+1);assert.equal(after.speech.active,before.expectedNext);assert.equal(after.speech.log.length,before.speech.log.length+1);assert.equal(after.attempt,before.attempt);return{before,after};
 });
 await tap('#dlStopBtn');await p.waitForFunction(()=>!DL.playing&&!__r1064SpeechFixture.snapshot().active);await p.waitForTimeout(180);
 await p.evaluate(()=>SukunReadingUIR1064.open('reading:delail:acilis'));await idle();
 await check('Real original-text panel starts the modern Delail meaning TTS owner',async()=>{
  await tap('#r1064MeaningListen');await p.waitForFunction(()=>SukunReadingAudioR1064.snapshot().phase==='playing'&&!!__r1064SpeechFixture.snapshot().active);
  const s=await modern();assert.equal(s.reader.id,'reading:delail:acilis');assert.equal(s.reader.kind,'delail');assert.equal(s.reader.sourceKind,'tts');assert.equal(s.reader.content,'meaning');assert.equal(s.reader.part,1);assert(s.reader.total>1);return s;
 });
 await check('Screen clicks retain modern Delail ownership and explicit Stop prevents revival',async()=>{
  const before=await modern();await tap('.tab[data-t="amb"]');await tap('.tab[data-t="zkr"]');const after=await modern();sameSpeech(before,after);assert.equal(after.reader.id,before.reader.id);assert.equal(after.reader.phase,'playing');assert.equal(after.reader.part,before.reader.part);
  await tap('#r1064ReadingStop');await p.waitForFunction(()=>SukunReadingAudioR1064.snapshot().phase==='idle'&&!__r1064SpeechFixture.snapshot().active);const stopped=await modern();await tap('.tab[data-t="amb"]');await tap('.tab[data-t="zkr"]');await p.waitForTimeout(300);const returned=await modern();assert.equal(returned.reader.phase,'idle');assert.equal(returned.speech.active,null);assert.equal(returned.speech.log.length,stopped.speech.log.length);return{before,after,stopped,returned};
 });
 await check('Served app bytes stay exact with no local resource or JavaScript failures',async()=>{
  const e=f.evidence();for(const[name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'File changed during suite: '+name);assert.deepEqual(e.pageErrors,[]);assert.deepEqual(e.failedRequests,[]);assert(!e.consoleErrors.some(x=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)),e.consoleErrors.join('\n'));return{served:Object.keys(e.served).length,pageErrors:e.pageErrors.length,failedRequests:e.failedRequests.length};
 });
}catch(error){report.fatal=error.stack||String(error);}finally{report.finishedAt=new Date().toISOString();if(f){report.evidence=f.evidence();await f.close();}save();console.log(JSON.stringify({build,passed:report.passed,total:report.total,expectedChecks:report.expectedChecks,allPassed:report.allPassed,fatal:report.fatal,output}));if(!report.allPassed)process.exitCode=1;}})();
