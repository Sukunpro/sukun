'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {fixture,wav}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||'.'),out=process.argv[3]||'/tmp/nasuh-browser.json';
let f;const report={checks:[],limitations:['Disposable Chromium and synthetic recording bytes only; not physical Android or user microphone audio.']};
(async()=>{try{
 f=await fixture(root,{seed:{'sukun.onboardSeen':'1','sukun.obDone':'1'}});const p=f.page;
 await p.evaluate(async bytes=>{window.obClose?.();document.getElementById('dcClose')?.click();KLT_AC('nasuh-recording-test');for(let i=0;i<11;i++)await REC_DB.set(tvkKey(i),new Blob([new Uint8Array(bytes)],{type:'audio/wav'}));await tvkInit();},[...wav(1)]);
 assert.equal(await p.evaluate(()=>tvkOynat(0)),true);report.checks.push('Fresh-page recorded section preview completes');
 await p.evaluate(()=>tvkSeyirPlay({type:'click'}));await p.waitForFunction(()=>TVK.audio&&!TVK.audio.paused&&TVK.audio.currentTime>0);
 await p.waitForFunction(()=>!TVK.playing,null,{timeout:25000});
 assert.equal(await p.evaluate(()=>TVK.i),11);report.checks.push('11 recorded sections complete sequentially');
 await p.evaluate(()=>tvkSeyirPlay({type:'click'}));await p.waitForFunction(()=>TVK.audio&&!TVK.audio.paused);await p.evaluate(()=>tvkSeyirStop());await p.waitForTimeout(1500);
 assert.equal(await p.evaluate(()=>TVK.playing),false);assert.equal(await p.evaluate(()=>TVK.audio),null);report.checks.push('Stop closes recording without advancing');
 assert.deepEqual(f.errors,[]);report.allPassed=true;
}catch(e){report.error=e.stack;report.allPassed=false;process.exitCode=1}finally{if(f){report.evidence=f.evidence();await f.close()}fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report))}})();
