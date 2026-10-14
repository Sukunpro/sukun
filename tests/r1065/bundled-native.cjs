'use strict';
/* Run production playRecording and native caller. Only media events, the
 * bounded decode service and FX interface are controlled. The simulated long
 * source proves admission does not request an all-file PCM decode or bake.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const attackHeader=fs.readFileSync(path.join(__dirname,'../r1043/recording-attack.cjs'),'utf8').split('function clean(')[0];
const playbackHarness=Function('require','__dirname',attackHeader+'\nreturn harness;')(require,path.join(__dirname,'../r1043'));
const nativeHeader=fs.readFileSync(path.join(__dirname,'../r1044/native-recovery-authority.cjs'),'utf8').split('(async()=>{')[0];
const nativeHarness=Function('require','__dirname',nativeHeader+'\nreturn setup;')(require,path.join(__dirname,'../r1044'));
const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve()};
const results=[];async function test(name,fn){try{await fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e.stack})}}
(async()=>{
 for(const bundled of [true,false])await test((bundled?'Bundled long source bypasses':'Own source keeps')+' quality decode before native admission',async()=>{
  const h=playbackHarness();let analyses=0,accepted;
  h.context.window.SukunRecordingQuality=h.context.SukunRecordingQuality={analyse:async()=>{analyses++;return{gain:1.5}}};
  h.context.sukunJourneyNativeRecording=async(blob,ad,opt,quality)=>{accepted={blob,ad,opt,quality};return{ok:true,reason:'ended'}};
  const blob=Object.freeze({size:31_000_000,type:'audio/mpeg'});
  const result=await h.context.playRecording(blob,'long-source',{detail:true,resume:false,backgroundNative:true,bundled});
  assert(result.ok);assert.equal(analyses,bundled?0:1);assert.equal(accepted.blob,blob);assert.equal(accepted.opt.bundled,bundled);assert.equal(accepted.quality?.gain||1,bundled?1:1.5);assert.equal(h.instances.length,0);
 });
 for(const hidden of [false,true])await test('Bundled long native '+(hidden?'hidden':'visible')+' source skips FX despite echo/spatial/gap preferences',async()=>{
  const f=nativeHarness();if(hidden)f.hide();const c=f.context;const calls=[];
  c.KAYIT={yankiMik:1,mekan:true};f.window.OKUMA_HIZ=1.25;c.sukunJourneyGapMs=()=>450;
  f.window.SukunNativeEchoBridge={getCached(){calls.push('getCached');throw Error('Full source cache/decode prohibited')},prepare(){calls.push('prepare');throw Error('Full source PCM bake prohibited')},stop(){},start(){}};
  f.a.duration=1293;const blob=Object.freeze({size:31_000_000,type:'audio/mpeg'});
  const p=c.sukunJourneyNativeRecording(blob,'bundled:yasin',{detail:true,bundled:true,recordingKey:'bundled:yasin',isCurrent:()=>true},null);await flush();
  assert.deepEqual(calls,[]);assert.equal(f.a.playCalls,1);assert.equal(f.a.playbackRate,1.25);assert.equal(f.window.__sukJourneyNative.fx,false);assert.equal(f.window.__sukJourneyNative.gapDesiredMs,0);assert.equal(f.a._sukunRecordingOrigin,'bundled');assert.equal(c.KAYIT.yankiMik,1);assert.equal(c.KAYIT.mekan,true);
  f.stop();await p;
 });
 await test('Personal native source retains selected echo, spatial and gap processing',async()=>{
  const f=nativeHarness(),c=f.context;let options=null;c.KAYIT={yankiMik:.8,mekan:true};f.window.OKUMA_HIZ=1.2;c.sukunJourneyGapMs=()=>250;
  f.window.SukunNativeEchoBridge={getCached(_blob,_key,opt){options=opt;return{url:'blob:prepared-fx',sig:'prepared',gapMs:250,spatial:true}},stop(){},start(){}};
  const p=c.sukunJourneyNativeRecording({size:100,type:'audio/wav'},'own',{detail:true,isCurrent:()=>true},null);await flush();
  assert.equal(options.wet,.8);assert.equal(options.spatial,true);assert.equal(options.gapMs,250);assert.equal(options.rate,1.2);assert.equal(f.window.__sukJourneyNative.fx,true);assert.equal(f.a._sukunRecordingOrigin,'personal');f.stop();await p;
 });
 const report={version:'r1065',scope:'Actual bundled recording admission/native source, controlled media events and FX seams; no physical phone/decoder audibility claim',passed:results.filter(x=>x.ok).length,total:results.length,allPassed:results.every(x=>x.ok),tests:results};console.log(JSON.stringify(report,null,2));if(!report.allPassed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
