'use strict';
// Byte-for-byte native app. Synthetic disposable selection, never user storage.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fixture,hash,wav}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),out=path.resolve(process.argv[3]||'/tmp/sukun-r1242-controls');fs.mkdirSync(out,{recursive:true});

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
const results=[];let f;
const snapshot=()=>{const s=window.SukunSessionState.snapshot();return{mode:s.activeMode,index:s.activeIndex,count:s.count,target:s.target,playing:s.playing,paused:s.paused}};
async function select(p,mode){await p.evaluate(async mode=>{window.KLT_AC('LABELLED-r1242-disposable-profile');await window.SukunTabOwner.run('manual',async()=>{const r=await window.SukunSessionState.command('select',{mode,index:9,journeyKind:mode==='berhet'?'28':'99'});if(!r.accepted)throw Error('Fixture selection rejected');window.SukunSessionMemory.save();window.SukunProgressJournal.commit('r1242-fixture');},{prime:false,releaseAfter:true});document.querySelector('.tab[data-t=zkr]').click();window.SukunPracticeUI.refresh();},mode);await p.waitForTimeout(350);}
// Tab activation runs tabEbru for 420ms, including an ancestor scale.
// Wait for natural completion before measuring; do not disable production motion
// or relax the exact 44px target / 24px icon assertions below.
async function settlePaint(p){
 await p.waitForFunction(()=>{
  const el=document.getElementById('r1056FocusControlsToggle');if(!el)return false;
  for(let node=el;node;node=node.parentElement){
   if(node.getAnimations().some(a=>a.playState!=='finished'&&a.playState!=='idle'&&
      Number.isFinite(a.effect?.getComputedTiming().endTime)))return false;
  }
  return true;
 },null,{polling:'raf',timeout:5000});
}
async function paint(p,mode,forced=false){await settlePaint(p);const r=await p.locator('#r1056FocusControlsToggle').evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect(),eye=el.querySelector('.r1242ControlsEye'),er=eye?.getBoundingClientRect();return{text:el.textContent,name:el.getAttribute('aria-label'),eye:el.dataset.r1242Eye==='true',eyeWidth:er?.width,eyeHeight:er?.height,theme:document.documentElement.dataset.r1074Theme,image:s.borderImageSource,background:s.backgroundColor,width:r.width,height:r.height,scroll:el.scrollWidth,client:el.clientWidth,viewport:innerWidth,pageWidth:document.documentElement.scrollWidth}});assert(r.height>=44&&r.width>=44,JSON.stringify(r));assert(r.name,JSON.stringify(r));assert(r.scroll<=r.client+1,JSON.stringify(r));assert(r.pageWidth<=r.viewport+1,JSON.stringify(r));if(mode==='berhet')assert.equal(r.theme,'berhet');if(r.eye){assert.equal(r.width,44);assert.equal(r.height,44);assert.equal(r.eyeWidth,24);assert.equal(r.eyeHeight,24);assert.equal(r.image,'none');}else if(mode==='berhet'&&!forced){assert.match(r.image,/gem-diamond\.webp/);assert.equal(r.background,'rgba(0, 0, 0, 0)');}else if(!forced){assert.notEqual(r.theme,'berhet');assert.equal(r.image,'none');assert.equal(r.background,'rgba(8, 44, 53, 0.863)');}return r;}
async function compact(p){const rows=await p.evaluate(()=>['r932EasyPlay','r932EasyStop','r920JourneyRestartAll'].map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return{id,text:e.textContent,width:r.width,height:r.height,scroll:e.scrollWidth,client:e.clientWidth,visible:!!e.getClientRects().length,copies:document.querySelectorAll('#'+id).length}}));for(const r of rows){assert.equal(r.copies,1);if(r.visible){assert(r.height>=44&&r.width>=44,JSON.stringify(r));assert(r.scroll<=r.client+1,JSON.stringify(r));assert(r.width<=250,JSON.stringify(r));if(r.id==='r932EasyStop')assert(r.width<150,JSON.stringify(r));}}return rows;}

(async()=>{try{
 stage('Browser: initialize native fixture and geometry matrix');f=await fixture(root,{width:393,height:1050,seed:{'sukun.ui.shellMode':'classic','sukun.obDone':'1','sukun.onboardSeen':'1','sukun.r920.focus':'0'}});const p=f.page;
 for(const mode of ['berhet','esma','berhet']){
  stage('Browser: theme matrix '+mode);await select(p,mode);
  for(const width of [320,393,1440])for(const lang of ['tr','en']){
   await p.setViewportSize({width,height:1050});await p.evaluate(lang=>window.I18N.set(lang),lang);await p.waitForTimeout(120);
   const before=await p.evaluate(snapshot),button=p.locator('#r1056FocusControlsToggle');
   for(const focus of [false,true]){
    if(focus){await p.locator('#r920TefEnter').click();await p.waitForFunction(()=>document.body.classList.contains('sukun-tefekkur-mode'));}
    await p.evaluate(()=>window.SukunBerhetLayout.setFocusControls(true));await p.waitForTimeout(100);
    for(let i=0;i<2;i++){
     const shown=await button.getAttribute('aria-expanded');assert.equal(shown,i===0?'true':'false');assert.equal(await p.locator('#r932EasyPlay').isVisible(),i===0);
     results.push({mode,width,lang,focus,shown,paint:await paint(p,mode),actions:i===0?await compact(p):[]});await button.click();await p.waitForTimeout(100);
    }
    if(width===393&&lang==='tr')await p.screenshot({path:path.join(out,`${mode}-${focus?'focus':'normal'}.png`),fullPage:true});
    if(focus)await p.locator('#r920TefExit').click();
   }
   assert.deepEqual(await p.evaluate(snapshot),before,'Visibility controls must preserve selection, count and playback');
  }
 }
 stage('Browser: forced colors, keyboard and reload');await p.setViewportSize({width:393,height:1050});await p.emulateMedia({forcedColors:'active'});await p.waitForTimeout(100);const forced=await paint(p,'berhet',true);assert.equal(forced.image,'none');results.push({forcedColors:true,paint:forced});
 await p.emulateMedia({forcedColors:'none'});await p.locator('#r1056FocusControlsToggle').focus();assert(await p.locator('#r1056FocusControlsToggle').evaluate(el=>el===document.activeElement));
 const expanded=await p.locator('#r1056FocusControlsToggle').getAttribute('aria-expanded');await p.keyboard.press('Enter');await p.waitForTimeout(150);assert.notEqual(await p.locator('#r1056FocusControlsToggle').getAttribute('aria-expanded'),expanded);
 await p.reload();await p.waitForTimeout(2400);await p.evaluate(()=>{document.querySelector('.tab[data-t=zkr]').click();window.SukunPracticeUI.refresh()});await p.waitForTimeout(200);assert.equal(await p.locator('#r1056FocusControlsToggle').getAttribute('aria-expanded'),expanded==='true'?'false':'true');await paint(p,'berhet');
 // Actual native recorded playback stays alive while the presentation timer runs.
 stage('Browser: seed dry 20s native personal recording');await select(p,'berhet');await observeNative(p);await p.evaluate(async tone=>{
  SukunR698Transport.stop('r1242-native-fixture');await SukunR698Transport.whenStopped();await SukunAudioSessionRegistry.stopAll();
  NIYET.on=NIYET.spk=NIYET.devir=false;ZA.kapali=true;SPK.on=true;Z.tick=Z.vib=false;Z.adv=false;KAYIT.yankiMik=0;KAYIT.mekan=false;
  await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');SukunR698VoiceIntent.explicit(true);SukunManualVoice.set(false);
  const key='berhet:9';await REC_DB.set(key,new Blob([Uint8Array.from(atob(tone),c=>c.charCodeAt(0))],{type:'audio/wav'}));RECKEYS.add(key);
  SukunBerhetLayout.setFocusControls(true);SukunPracticeUI.refresh();
 },wav(20).toString('base64'));
 stage('Browser: enter reflection and start native playback');await p.locator('#r920TefEnter').click();await p.waitForFunction(()=>document.body.classList.contains('sukun-tefekkur-mode'));await p.locator('#r932EasyPlay').click();results.push({nativePlaying:await assertPersonalProgress(p)});
 results.push({playingActions:await compact(p)});
 stage('Browser: wait for 10s automatic settings hide');await p.waitForFunction(()=>SukunBerhetLayout.snapshot().settingsAutoHidden,null,{timeout:15000});
 for(const id of ['r938PanelToggle','r1056ReadingSummary'])assert.equal(await p.locator('#'+id).isVisible(),false,id);
 assert.equal(await p.locator('#r1056FocusControlsToggle').isVisible(),true);assert.equal((await paint(p,'berhet')).eye,true);
 await p.screenshot({path:path.join(out,'berhet-playing-hidden.png'),fullPage:true});
 stage('Browser: pause and verify restored surfaces');await p.locator('#r932EasyPlay').click();await p.waitForFunction(()=>SukunSessionState.snapshot().phase==='PAUSED');
 await p.waitForFunction(()=>!SukunBerhetLayout.snapshot().settingsAutoHidden);assert(await p.locator('#r938PanelToggle').isVisible());assert(await p.locator('#r1056ReadingSummary').isVisible());results.push({pausedActions:await compact(p)});
 stage('Browser: resume real media and fresh 10s hide');await p.locator('#r932EasyPlay').click();results.push({nativeResumed:await assertPersonalProgress(p)});await p.waitForFunction(()=>SukunBerhetLayout.snapshot().settingsAutoHidden,null,{timeout:15000});
 stage('Browser: explicit eye reveal');await p.locator('#r1056FocusControlsToggle').click();assert(await p.locator('#r938PanelToggle').isVisible());assert(await p.locator('#r1056ReadingSummary').isVisible());assert(await p.evaluate(()=>SukunBerhetLayout.snapshot().settingsRevealHeld));
 stage('Browser: reduced-motion manual hold');await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(10500);assert.equal(await p.evaluate(()=>SukunBerhetLayout.snapshot().settingsAutoHidden),false);
 stage('Browser: exit reflection and stop');await p.locator('#r920TefExit').click();assert.equal(await p.evaluate(()=>SukunBerhetLayout.snapshot().settingsHidePending),false);assert(await p.locator('#r1056ReadingSummary').isVisible());
 await p.locator('#r932EasyStop').click();await p.waitForTimeout(200);results.push({nativeAutoHide:true,manualReveal:true,pauseResume:true,reducedMotion:true});
 assert.deepEqual(f.errors,[]);assert(!f.consoleErrors.some(x=>/integrity|digest|Content Security Policy/i.test(x)),JSON.stringify(f.consoleErrors));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:true,results,sourceSha256:hash(fs.readFileSync(path.join(root,'nero.html'))),evidence:f.evidence(),limitations:['Linux Chromium with synthetic local state; not physical-device or audible-audio acceptance.']},null,2));console.log('PASS r1242 theme, mobile/desktop, TR/EN, normal/focus, repeated toggle, keyboard, forced colors and reload persistence '+results.length+' checks');
}catch(error){stage('Browser failed: '+error.message);let diagnostics;try{diagnostics=f?await nativeDiagnostics(f.page):null}catch(e){diagnostics={error:String(e)}}fs.writeFileSync(path.join(out,'native-failure.json'),JSON.stringify({error:error.stack,diagnostics},null,2));try{await f?.page.screenshot({path:path.join(out,'failure.png'),fullPage:true})}catch(_){}fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:false,results,error:error.stack,evidence:f?.evidence()},null,2));throw error}finally{await f?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
