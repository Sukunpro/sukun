'use strict';
// Shipping media transport under a controlled delayed-playing callback.
// No timers or callbacks are needed to make the phrase's head audible.
const assert=require('node:assert/strict'),{harness}=require('../r1048/audio-volume-preview.cjs');
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.stack})}}
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return{promise,resolve}}
function fixture({graph=false,volume=.8,step=.4,gain=1.5,hidden=false,intention=true,session=false}={}){
 const h=harness(),c=h.c,pending=deferred(),automation=[];c.pendingMediaPlay=pending;c.ZVOL=volume;c.__SUKUN_STEP_VOL=step;h.document.hidden=hidden;
 c.SukunRecordingQuality={analyse:async()=>({gain,trimStart:.5,trimEnd:2.4,tailTrim:.6,fadeMs:78})};
 c.ctx=graph?{currentTime:10}:null;c.KAYIT.yankiMik=.2;
 const param=kind=>({value:0,cancelScheduledValues(at){automation.push({kind,method:'cancel',at})},setValueAtTime(v,at){this.value=v;automation.push({kind,method:'set',value:v,at})},linearRampToValueAtTime(v,at){this.value=v;automation.push({kind,method:'ramp',value:v,at})}});
 c.kayitZinciriKur=a=>{if(!graph)return null;a._kuru={gain:param('dry')};a._wet={gain:param('wet')};return{}};
 const start=()=>c.playRecording(new Blob(['synthetic intention'],{type:'audio/wav'}),'niyet',{detail:true,resume:false,intention,session,recordingKey:intention?'niyet:core':'berhet:0'});
 return{...h,pending,automation,start};
}
(async()=>{
 for(const mode of ['intention','session'])for(const graph of [false,true])for(const volume of [0,.5])await test(`${graph?'graph':'raw'}: ${mode} output is armed before delayed native start at level ${volume}`,async()=>{
  const h=fixture({graph,volume,intention:mode==='intention',session:mode==='session'});let result;const p=h.start().then(v=>{result=v;return v});await h.flush();const a=h.audios.at(-1);assert(a);assert.equal(a.plays,1);assert.equal(a.currentTime,0);assert.equal(result,undefined);
  const expected=graph?volume*.4:Math.min(1,volume*.4*1.5);assert(Math.abs(a.volume-expected)<1e-9);
  if(graph){assert(h.automation.some(x=>x.kind==='dry'&&x.method==='ramp'&&x.value===1.5&&x.at===10.018));assert(h.automation.some(x=>x.kind==='wet'&&x.method==='ramp'&&Math.abs(x.value-.3)<1e-9));}
  // The media clock progressed while its main-thread callbacks were blocked.
  // A late callback must not rewind, re-mute or trim the running phrase.
  a.currentTime=1.4;h.pending.resolve();await h.flush();assert.equal(a.currentTime,1.4);assert(Math.abs(a.volume-expected)<1e-9);if(graph){assert.equal(a._kuru.gain.value,1.5);assert.equal(a._r978Envelope,null)}
  a.currentTime=5;a.dispatch('ended');assert.equal((await p).ok,true);assert.equal(result.reason,'ended');
 });
 await test('A short smart Name has an audible route before its entire media duration can elapse',async()=>{const h=fixture({graph:true,intention:false,session:true}),p=h.start();await h.flush();const a=h.audios.at(-1);a.duration=.35;assert(Math.abs(a.volume-.32)<1e-9);assert.equal(a._kuru.gain.value,1.5);a.currentTime=.35;a.dispatch('ended');assert.equal((await p).ok,true);h.pending.resolve();await h.flush();assert.equal(a.currentTime,.35);assert.equal(a.plays,1)});
 await test('Smart and intention playback retain enabled spatial rotation after native start',async()=>{for(const intention of [false,true]){const h=fixture({graph:true,intention,session:!intention});let runningPan=0;h.c.KAYIT.mekan=true;h.c.kayitPanDondur=()=>{if(h.audios.some(a=>!a.paused&&!a.ended))runningPan++};const p=h.start();await h.flush();h.pending.resolve();await h.flush();assert(runningPan>0);h.audios.at(-1).dispatch('ended');assert.equal((await p).ok,true)}});
 await test('Ordinary visible recording retains its existing pending zero-volume onset',async()=>{const h=fixture({intention:false});const p=h.start();await h.flush();assert.equal(h.audios.at(-1).volume,0);h.c.sesDurdur('test-stop');assert.equal((await p).ok,false)});
 await test('Pause before native acceptance retires intention without late gain or restart',async()=>{const h=fixture({graph:true}),p=h.start();await h.flush();const a=h.audios.at(-1),callback=a._sukunRefreshVolume;h.c.sesDurdur('test-pause');a.volume=.17;h.pending.resolve();await h.flush();callback?.();assert.equal((await p).ok,false);assert.equal(a.volume,.17);assert.equal(a.paused,true);assert.equal(a.plays,1)});
 await test('Expired preparation cannot prearm or create late intention media',async()=>{const h=fixture();let resolve,current=true;h.c.SukunRecordingQuality.analyse=()=>new Promise(r=>{resolve=r});const p=h.c.playRecording(new Blob(['synthetic']),'niyet',{detail:true,intention:true,recordingKey:'niyet:core',isCurrent:()=>current});current=false;resolve({gain:1.5});assert.equal((await p).ok,false);assert.equal(h.audios.length,0)});
 console.log(JSON.stringify({suite:'r1085 intention onset before delayed media callbacks',passed:results.filter(x=>x.passed).length,total:results.length,results},null,2));if(results.some(x=>!x.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
