'use strict';
// Native UI capture with disposable synthetic selection/recording; no user data.
const fs=require('node:fs'),path=require('node:path');
const {fixture,wav}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),out=path.resolve(process.argv[3]||'/tmp/r1242-mockup');fs.mkdirSync(out,{recursive:true});
(async()=>{let f;try{f=await fixture(root,{width:1000,height:1600});const p=f.page;
 await p.goto(f.origin+'/tests/tefekkur-help/managed-preview.html?mode=berhet',{waitUntil:'load',timeout:60000});await p.waitForFunction(()=>!document.getElementById('run').disabled,null,{timeout:30000});
 await p.locator('#app').evaluate(el=>{el.width=393;el.height=1100});const app=p.frames().find(x=>x.url().includes('/nero.html'));
 await app.evaluate(async tone=>{SukunR698Transport.stop('r1242-mockup-fixture');await SukunR698Transport.whenStopped();await SukunAudioSessionRegistry.stopAll();NIYET.on=NIYET.spk=NIYET.devir=false;ZA.kapali=true;SPK.on=true;Z.tick=Z.vib=false;Z.adv=false;await SukunVoiceSettings.setContent('legacy');await SukunVoiceSettings.setMode('personal');SukunR698VoiceIntent.explicit(true);SukunManualVoice.set(false);const key='berhet:9';await REC_DB.set(key,new Blob([Uint8Array.from(atob(tone),c=>c.charCodeAt(0))],{type:'audio/wav'}));RECKEYS.add(key);SukunBerhetLayout.setFocusControls(true);SukunPracticeUI.refresh();},wav(45).toString('base64'));
 await app.locator('#r920TefEnter').click();await app.locator('#r932EasyPlay').click();await app.waitForFunction(()=>SukunSessionState.snapshot().phase==='PLAYING',null,{timeout:15000});
 await app.locator('#r920Practice').screenshot({path:path.join(out,'controls-visible.png')});
 await app.evaluate(()=>SukunBerhetLayout.setFocusControls(false));
 await app.waitForFunction(()=>SukunBerhetLayout.snapshot().settingsAutoHidden,null,{timeout:15000});
 await app.locator('#r920Practice').screenshot({path:path.join(out,'controls-hidden.png')});
 fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),syntheticData:true,actualRuntime:true,states:['playing-controls-visible','playing-controls-hidden-after-10s'],snapshot:await app.evaluate(()=>SukunBerhetLayout.snapshot())},null,2));
 }catch(error){try{await f?.page.screenshot({path:path.join(out,'capture-failure.png'),fullPage:true})}catch(_){}throw error}finally{await f?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
