'use strict';
// Native UI capture with disposable synthetic selection/recording; no user data.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fixture,wav}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),out=path.resolve(process.argv[3]||'/tmp/r1242-mockup');fs.mkdirSync(out,{recursive:true});

const stage=message=>console.log('[r1242 '+new Date().toISOString()+'] '+message);
async function observeNative(p){await p.evaluate(()=>{
 window.__r1242Diagnostics=[];
 for(const type of ['sukun:diagnostic','sukun:journey-native-source','sukun:journey-native-playing','sukun:journey-native-retry','sukun:voicecyclechange'])window.addEventListener(type,e=>{
  let detail;try{detail=JSON.parse(JSON.stringify(e.detail))}catch(_){detail=String(e.detail)}
  __r1242Diagnostics.push({type,at:Date.now(),detail});if(__r1242Diagnostics.length>200)__r1242Diagnostics.shift();
 });
 __r1064SpeechFixture.reset();
});}
async function nativeDiagnostics(p){return p.evaluate(()=>{
 const read=fn=>{try{return fn()}catch(e){return{error:String(e)}}},j=window.__sukJourneyNative;
 const media=a=>a?{key:a._sukunRecordingKey||a.dataset?.sukLockKey||'',origin:a._sukunRecordingOrigin||'',src:a.currentSrc||a.src,time:a.currentTime,duration:Number.isFinite(a.duration)?a.duration:null,paused:a.paused,ended:a.ended,readyState:a.readyState,networkState:a.networkState,error:a.error?{code:a.error.code,message:a.error.message}:null}:null;
 return{session:read(()=>SukunSessionState.snapshot()),layout:read(()=>SukunBerhetLayout.snapshot()),failure:read(()=>window.SukunRecordingFailure?.get?.()),owner:read(()=>window.SukunBackgroundAudioOwner?.snapshot?.()),native:j?{recordingKey:j.recordingKey,fx:j.fx,fxPreparing:j.fxPreparing,gapDesiredMs:j.gapDesiredMs,media:media(j.a)}:null,activeMedia:read(()=>[...SES.ler].map(media)),fx:read(()=>window.SukunNativeEchoBridge?.snapshot?.()),speech:read(()=>__r1064SpeechFixture.snapshot()),events:window.__r1242Diagnostics||[],tef:document.body.classList.contains('sukun-tefekkur-mode'),visibility:document.visibilityState};
});}
async function assertPersonalProgress(p){
 // Berhetiyye journey explicitly passes backgroundNative:true. Its real
 // persistent media owner is __sukJourneyNative, not an arbitrary ambience node.
 await p.waitForFunction(()=>{const j=window.__sukJourneyNative,a=j?.a;return SukunSessionState.snapshot().phase==='PLAYING'&&j?.recordingKey==='berhet:9'&&a?._sukunRecordingOrigin==='personal'&&!a.paused&&!a.ended&&a.readyState>=2&&a.currentTime>.12},null,{timeout:20000});
 const before=await p.evaluate(()=>{const j=__sukJourneyNative;return{src:j.a.currentSrc||j.a.src,time:j.a.currentTime}});
 await p.waitForFunction(before=>{const a=window.__sukJourneyNative?.a;return a&&!a.paused&&!a.ended&&(a.currentSrc||a.src)===before.src&&a.currentTime>before.time+.12},before,{timeout:5000});
 assert.equal(await p.evaluate(()=>__r1064SpeechFixture.log.length),0,'Personal recording must not fall back to speech');
 const evidence=await nativeDiagnostics(p);stage('Confirmed personal native media progress: '+JSON.stringify(evidence.native));return evidence;
}

async function fitFrame(p,app){
 for(let i=0;i<5;i++){
  const need=await app.evaluate(()=>{const root=document.getElementById('r920Practice'),tab=document.getElementById('tab-zkr'),panel=document.getElementById('r938Panel');return Math.ceil(Math.max(root.scrollHeight,tab.scrollHeight,panel.getBoundingClientRect().bottom,root.getBoundingClientRect().bottom)-innerHeight)});
  if(need<=1)break;
  await p.locator('#app').evaluate((el,extra)=>{el.width=393;el.height=Number(el.height)+extra+8},need);await app.waitForTimeout(150);
 }
 const geometry=await app.evaluate(()=>({width:innerWidth,height:innerHeight,rootHeight:document.getElementById('r920Practice').scrollHeight,panelBottom:document.getElementById('r938Panel').getBoundingClientRect().bottom}));
 assert.equal(geometry.width,393);assert(geometry.panelBottom<=geometry.height+1,JSON.stringify(geometry));assert(geometry.rootHeight<=geometry.height+1,JSON.stringify(geometry));stage('Capture frame fitted: '+JSON.stringify(geometry));
}
(async()=>{let f,app;try{
 stage('Capture: initialize native fixture');f=await fixture(root,{width:1000,height:1600});const p=f.page;
 await p.goto(f.origin+'/tests/tefekkur-help/managed-preview.html?mode=berhet',{waitUntil:'load',timeout:60000});await p.waitForFunction(()=>!document.getElementById('run').disabled,null,{timeout:30000});
 await p.locator('#app').evaluate(el=>{el.width=393;el.height=1100});app=p.frames().find(x=>x.url().includes('/nero.html'));assert(app,'Prepared native app frame missing');await observeNative(app);
 stage('Capture: seed dry 20s personal recording; native journey gap remains unchanged');
 await app.evaluate(async tone=>{SukunR698Transport.stop('r1242-mockup-fixture');await SukunR698Transport.whenStopped();await SukunAudioSessionRegistry.stopAll();NIYET.on=NIYET.spk=NIYET.devir=false;ZA.kapali=true;SPK.on=true;Z.tick=Z.vib=false;Z.adv=false;KAYIT.yankiMik=0;KAYIT.mekan=false;await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');SukunR698VoiceIntent.explicit(true);SukunManualVoice.set(false);const key='berhet:9';await REC_DB.set(key,new Blob([Uint8Array.from(atob(tone),c=>c.charCodeAt(0))],{type:'audio/wav'}));RECKEYS.add(key);SukunBerhetLayout.setFocusControls(true);SukunPracticeUI.refresh();},wav(20).toString('base64'));
 stage('Capture: enter reflection and verify visible controls');await app.locator('#r920TefEnter').click();await app.waitForFunction(()=>document.body.classList.contains('sukun-tefekkur-mode'));
 await fitFrame(p,app);
 for(const id of ['r938PanelToggle','r1056ReadingSummary','r932EasyPlay'])assert(await app.locator('#'+id).isVisible(),id);
 stage('Capture: start real personal playback');await app.locator('#r932EasyPlay').click();const playing=await assertPersonalProgress(app);
 for(const id of ['r938PanelToggle','r1056ReadingSummary'])assert(await app.locator('#'+id).isVisible(),id);
 await app.locator('#r920Practice').screenshot({path:path.join(out,'controls-visible.png')});stage('Capture: visible screenshot saved');
 await app.evaluate(()=>SukunBerhetLayout.setFocusControls(false));
 stage('Capture: wait for native 10s presentation hide');await app.waitForFunction(()=>SukunBerhetLayout.snapshot().settingsAutoHidden,null,{timeout:15000});
 for(const id of ['r938PanelToggle','r938PanelBody','r1056ReadingSummary','r932EasyPlay'])assert.equal(await app.locator('#'+id).isVisible(),false,id);
 for(const id of ['r1056FocusControlsToggle','r920TefExit'])assert(await app.locator('#'+id).isVisible(),id);
 assert(await app.evaluate(()=>document.body.classList.contains('sukun-tefekkur-mode')));const hidden=await assertPersonalProgress(app);
 await fitFrame(p,app);await app.locator('#r920Practice').screenshot({path:path.join(out,'controls-hidden.png')});stage('Capture: hidden screenshot saved');
 assert.deepEqual(f.errors,[]);assert(!f.consoleErrors.some(x=>/integrity|digest|Content Security Policy/i.test(x)),JSON.stringify(f.consoleErrors));
 fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),syntheticData:true,actualRuntime:true,states:['playing-controls-visible','playing-controls-hidden-after-10s'],playing,hidden,evidence:f.evidence()},null,2));
 }catch(error){stage('Capture failed: '+error.message);let diagnostics;try{diagnostics=app?await nativeDiagnostics(app):null}catch(e){diagnostics={error:String(e)}}fs.writeFileSync(path.join(out,'capture-failure.json'),JSON.stringify({error:error.stack,diagnostics,evidence:f?.evidence()},null,2));try{await f?.page.screenshot({path:path.join(out,'capture-failure.png'),fullPage:true})}catch(_){}throw error}finally{await f?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
