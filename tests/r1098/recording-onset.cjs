'use strict';
// Production recording playback with synthetic media, PCM-quality metadata and
// deliberately delayed main-thread start callbacks. Graph assertions inspect
// the pre-play audio-clock automation rather than treating the stub's ramp
// assignment as instantaneous full gain. No actual voice is stored.
const assert=require('node:assert/strict');
const {harness}=require('../r1048/audio-volume-preview.cjs');
const results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack})}}
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return{promise,resolve}}
function fixture({graph=false,volume=.8,gain=1.5,quality=true,hidden=false}={}){
 const h=harness(),c=h.c,pending=deferred(),automation=[],qualityValue={gain,trimStart:.5,trimEnd:2.4,tailTrim:.6,fadeMs:78};
 c.pendingMediaPlay=pending;c.ZVOL=volume;c.__SUKUN_STEP_VOL=.4;h.document.hidden=hidden;c.KAYIT.yankiMik=0;
 if(quality)c.SukunRecordingQuality={analyse:async()=>qualityValue,publish(){}};
 c.ctx=graph?{currentTime:10}:null;
 const param=kind=>({value:0,cancelScheduledValues(at){automation.push({kind,method:'cancel',at})},setValueAtTime(value,at){this.value=value;automation.push({kind,method:'set',value,at})},linearRampToValueAtTime(value,at){this.value=value;automation.push({kind,method:'ramp',value,at})}});
 c.kayitZinciriKur=a=>{if(!graph)return null;a._kuru={gain:param('dry')};a._wet={gain:param('wet')};return{}};
 const originalPlay=c.Audio.prototype.play;
 c.Audio.prototype.play=function(){this.onsetAtPlay={volume:this.volume,automation:automation.map(event=>({...event}))};return originalPlay.call(this)};
 const start=(ad='test-recording',options={})=>c.playRecording(new Blob(['synthetic name'],{type:'audio/wav'}),ad,{detail:true,resume:false,recordingKey:'berhet:0',...options});
 return{...h,pending,automation,qualityValue,start};
}
async function finish(h,a,p){a.dispatch('ended');const result=await p;assert.equal(result.ok,true);assert.equal(result.reason,'ended');h.pending.resolve();await h.flush();return result}
const modes=[
 {name:'personal Name',ad:'test-recording',options:{}},
 {name:'generic Name',ad:'resolver:berhet:0',options:{generic:true}},
 {name:'preview',ad:'onizle:berhet:0',options:{}},
 {name:'repeat unit',ad:'dongu:berhet:0',options:{}},
 {name:'automatic personal unit',ad:'resolver:berhet:0',options:{automatic:true},automatic:true}
];
(async()=>{
 for(const graph of [false,true])for(const mode of modes)for(const volume of [0,.8])await test(`${graph?'graph':'raw'} ${mode.name}: level ${volume} ${graph?'output is pre-scheduled':'is armed'} before delayed start acceptance`,async()=>{
  const h=fixture({graph,volume});if(mode.automatic){h.c.Z.auto=true;h.c.zikirSesliTekrarMi=()=>true;h.c.zikirKey=()=> 'berhet:0'}
  const p=h.start(mode.ad,mode.options);await h.flush();const a=h.audios.at(-1);assert(a);assert.equal(a.plays,1);assert.equal(a.currentTime,0);
  const expected=graph?volume*.4:Math.min(1,volume*.4*1.5);
  assert(Math.abs(a.onsetAtPlay.volume-expected)<1e-9,`native start received volume ${a.onsetAtPlay.volume}; expected ${expected}`);
  if(graph){const before=a.onsetAtPlay.automation;assert(before.some(x=>x.kind==='dry'&&x.method==='set'&&x.value===.0001&&x.at===10),'attack has an audio-clock origin before native play');assert(before.some(x=>x.kind==='dry'&&x.method==='ramp'&&x.value===1.5&&x.at===10.018),'complete attack is scheduled before native play')}
  // The media decoder can advance independently while JS notification waits.
  a.currentTime=.32;const beforeCallback=h.automation.length;h.pending.resolve();await h.flush();assert.equal(a.currentTime,.32);assert(Math.abs(a.volume-expected)<1e-9);
  if(graph){assert(!h.automation.slice(beforeCallback).some(x=>x.method==='ramp'||x.method==='set'&&x.value===.0001),'late callback must not restart the attack or remute running output');assert.equal(a._r978Envelope,null,'late callback cannot create a new head/tail envelope')}
  await finish(h,a,p);assert.equal(a.plays,1);
 });
 for(const graph of [false,true])await test(`${graph?'graph':'raw'} fresh playback ignores inferred prefix trim and retains the original quality metadata`,async()=>{
  const h=fixture({graph}),p=h.start();await h.flush();const a=h.audios.at(-1);a.dispatch('loadedmetadata');assert.equal(a.currentTime,0,'inferred silence must never skip a quiet prefix');
  assert.equal(h.qualityValue.trimStart,.5);assert.equal(h.qualityValue.trimEnd,2.4);assert.equal(h.qualityValue.tailTrim,.6);
  h.pending.resolve();await h.flush();await finish(h,a,p);
 });
 for(const graph of [false,true])await test(`${graph?'graph':'raw'} inferred silence cannot fade and finish a quiet suffix`,async()=>{
  const h=fixture({graph}),p=h.start();await h.flush();const a=h.audios.at(-1);h.pending.resolve();await h.flush();a.currentTime=2.6;a.dispatch('timeupdate');let settled=false;p.then(()=>{settled=true});await h.advance(500);assert.equal(settled,false,'inferred silence must never finish a quiet suffix');assert.equal(a.paused,false);if(graph)assert.equal(a._kuru.gain.value,1.5);await finish(h,a,p);
 });
 for(const saved of [0,2,7.5])await test(`explicit chapter resume retains valid saved position ${saved} independently of automatic trim`,async()=>{
  const h=fixture();h.c.localStorage={getItem:()=>String(saved),setItem(){},removeItem(){}};const p=h.start('chapter:own-prayer',{resume:true});await h.flush();const a=h.audios.at(-1);a.duration=8;a.dispatch('loadedmetadata');assert.equal(a.currentTime,saved===2?2:0);h.pending.resolve();await h.flush();await finish(h,a,p);
 });
 for(const graph of [false,true])await test(`${graph?'graph':'raw'} pooled repeat resets to the beginning and ${graph?'pre-schedules':'prearms'} every new lease`,async()=>{
  const h=fixture({graph});const first=h.start('dongu:berhet:0');await h.flush();const a=h.audios.at(-1);h.pending.resolve();await h.flush();a.currentTime=4;await finish(h,a,first);
  h.c.pendingMediaPlay=deferred();const beforeSecond=h.automation.length,second=h.start('dongu:berhet:0');await h.flush();assert.equal(h.audios.length,1);assert.equal(a.currentTime,0);assert.equal(a.plays,2);assert(Math.abs(a.onsetAtPlay.volume-(graph?.32:.48))<1e-9);if(graph){const own=a.onsetAtPlay.automation.slice(beforeSecond);assert(own.some(x=>x.kind==='dry'&&x.method==='set'&&x.value===.0001&&x.at===10));assert(own.some(x=>x.kind==='dry'&&x.method==='ramp'&&x.value===1.5&&x.at===10.018))}
  a.dispatch('loadedmetadata');assert.equal(a.currentTime,0);h.c.pendingMediaPlay.resolve();await h.flush();await finish(h,a,second);assert.equal(a.plays,2);
 });
 for(const graph of [false,true])await test(`${graph?'graph':'raw'} Stop retires pending callbacks without late gain, seek or restart`,async()=>{
  const h=fixture({graph}),p=h.start();await h.flush();const a=h.audios.at(-1),refresh=a._sukunRefreshVolume;h.c.sesDurdur('test-stop');const result=await p;assert.equal(result.ok,false);
  a.volume=.17;a.currentTime=.22;const count=h.automation.length;h.pending.resolve();await h.flush();a.dispatch('playing');a.dispatch('loadedmetadata');refresh?.();await h.advance(50);
  assert.equal(a.volume,.17);assert.equal(a.currentTime,.22);assert.equal(h.automation.length,count);assert.equal(a.paused,true);assert.equal(a.plays,1);
 });
 for(const hidden of [false,true])await test(`native journey ${hidden?'hidden':'visible'} fresh recording retains the complete source`,async()=>{
  const h=fixture({hidden}),p=h.start('journey:berhet:0',{backgroundNative:true});await h.flush();const a=h.audios.at(-1);assert(a);assert.equal(a.currentTime,0,'raw native source must not seek to inferred first loud sample');assert(Math.abs(a.volume-.48)<1e-9);assert.equal(a.plays,1);h.pending.resolve();await h.flush();await finish(h,a,p);
 });
 const report={suite:'r1098 complete recording onset and source preservation',passed:results.filter(x=>x.passed).length,total:results.length,limitations:['Production functions with controlled media elements, callback delivery and quality results; no physical Android, screen lock, speaker output or personal recordings are tested.'],results};
 console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
