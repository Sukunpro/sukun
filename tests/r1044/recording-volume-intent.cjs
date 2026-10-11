'use strict';
// Actual playRecording and real setZVol, with controlled media/timer events.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const header=fs.readFileSync(path.join(__dirname,'../r1043/recording-attack.cjs'),'utf8').split('function clean(')[0];
const harness=Function('require','__dirname',header+'\nreturn harness;')(require,path.join(__dirname,'../r1043'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const setter=html.slice(html.indexOf('function setZVol('),html.indexOf('\nfunction setLayerVol('));
const drain=()=>new Promise(resolve=>setImmediate(resolve));let passed=0;const failures=[];
function prepare(opts){const h=harness(opts);Object.assign(h.context,{clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),S:{set:()=>{}},$:()=>null,pct:v=>String(v)});const start=html.indexOf('function sukunRecordingLevelRefresh('),end=html.indexOf('/* Kayıttan çalan sesi',start);if(start>=0&&end>start)vm.runInContext(html.slice(start,end),h.context);vm.runInContext(setter,h.context);return h}
async function scenario(label,fn){try{await fn();passed++}catch(e){failures.push({label,error:e.message})}}
async function finish(h,a,p){a._sukunFinish(false,'user-stop');await p;assert.equal(h.document.count('visibilitychange'),0);assert.equal(h.timers.size,0);assert.equal(a.plays,1)}
(async()=>{
 for(const phase of ['pending-hide','pending-start','attack-timer','attack-hide'])for(const value of [0,.25,.95]){
  await scenario(`${phase} latest ${value}`,async()=>{
   const h=prepare({volume:.8,deferPlay:true});const p=h.context.playRecording({size:12,type:'audio/webm'},'test',{resume:false});const a=h.instances[0];
   if(phase.startsWith('attack')){a.start();await drain();h.advance(6)}
   h.context.setZVol(value);const onsetPreserved=html.includes('function sukunRecordingLevelRefresh(');assert.equal(a.volume,onsetPreserved?(phase.startsWith('attack')?value/3:0):value);
   if(phase.endsWith('hide'))h.hide();else if(phase==='pending-start'){a.start();await drain();h.advance(30)}else h.advance(30);
   assert(Math.abs(a.volume-value)<1e-12,`${phase}: expected current level ${value}, received ${a.volume}`);
   if(phase==='pending-hide'){a.start();await drain();assert.equal(a.volume,value)}
   await finish(h,a,p);
  });
 }
 await scenario('multiple edits while play is pending',async()=>{const h=prepare({volume:.8,deferPlay:true});const p=h.context.playRecording({size:12},'test',{resume:false}),a=h.instances[0];for(const v of [.1,0,.5,0])h.context.setZVol(v);h.hide();a.start();await drain();assert.equal(a.volume,0);await finish(h,a,p)});
 await scenario('explicit step multiplier retained',async()=>{const h=prepare({volume:.8,deferPlay:true});h.context.window.__SUKUN_STEP_VOL=.9;const p=h.context.playRecording({size:12},'test',{resume:false,volume:.4}),a=h.instances[0];h.context.setZVol(.5);h.hide();assert.equal(a.volume,.2);a.start();await drain();assert.equal(a.volume,.2);await finish(h,a,p)});
 await scenario('latest implicit step/reader level',async()=>{const h=prepare({volume:.8,deferPlay:true});const p=h.context.playRecording({size:12},'test',{resume:false}),a=h.instances[0];h.context.window.__SUKUN_STEP_VOL=.5;h.context.window.okumaSeviyesi=()=>.5;h.context.setZVol(.4);h.hide();assert(Math.abs(a.volume-.1)<1e-12);await finish(h,a,p)});
 await scenario('quality gain with latest volume',async()=>{const h=prepare({volume:.8,deferPlay:true});h.context.window.SukunRecordingQuality=h.context.SukunRecordingQuality={analyse:async()=>({gain:1.5})};const p=h.context.playRecording({size:12},'test',{resume:false});await drain();const a=h.instances[0];h.context.setZVol(.2);h.hide();assert(Math.abs(a.volume-.3)<1e-12);await finish(h,a,p)});
 await scenario('helper latest target zero before delayed callback',async()=>{const h=prepare(),a=new h.Media('synthetic');let v=.8;h.helper(a,()=>v,18,()=>true);h.advance(6);v=0;h.throttle(1000);assert.equal(a.volume,0);assert.equal(h.timers.size,0);assert.equal(a.plays,0)});
 await scenario('muted element stays muted',async()=>{const h=prepare({volume:.8,deferPlay:true});const p=h.context.playRecording({size:12},'test',{resume:false}),a=h.instances[0];a.muted=true;h.context.setZVol(0);h.hide();a.start();await drain();assert.equal(a.volume,0);assert.equal(a.muted,true);await finish(h,a,p)});
 console.log(JSON.stringify({suite:'r1044 latest recording volume intent',passed,total:passed+failures.length,failures,scope:'Production playback/setter with controlled events, not physical audibility'},null,2));if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
