'use strict';
// Execute the shipped PCM block packer. Synthetic rendered samples test the
// container duration and repeated content; no browser decoder is substituted.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('async function r980RepeatWav('),end=html.indexOf('async function r477RenderLockTrack(',start);
assert(start>=0&&end>start,'production repeat packer boundary');
const context={Blob,ArrayBuffer,DataView,Uint8Array,Float32Array,Math,Number,String,Object,Promise,Date};
vm.createContext(context);vm.runInContext(html.slice(start,end),context);
vm.runInContext(html.slice(html.indexOf('function r477WavFromBuffer('),html.indexOf('function r477FxSignature(')),context);
vm.runInContext(html.slice(html.indexOf('function r954PcmEffects('),html.indexOf('/* r980 — bounded native repeat blocks')),context);
function pcm({seconds=1,sr=8000,channels=1}={}){
 const align=channels*2,frames=Math.round(seconds*sr),bytes=frames*align,buffer=new ArrayBuffer(44+bytes),v=new DataView(buffer);
 const word=(at,text)=>{for(let i=0;i<text.length;i++)v.setUint8(at+i,text.charCodeAt(i))};
 word(0,'RIFF');v.setUint32(4,36+bytes,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,channels,true);v.setUint32(24,sr,true);v.setUint32(28,sr*align,true);v.setUint16(32,align,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,bytes,true);
 // Distinct signed channel samples let this detect a silent/mono replacement
 // or accidental effect reprocessing while repetitions are assembled.
 for(let i=0;i<frames;i++)for(let c=0;c<channels;c++)v.setInt16(44+i*align+c*2,(i*37+c*8191)%65535-32767,true);
 return new Blob([buffer],{type:'audio/wav'});
}
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
(async()=>{
 for(const seconds of [1,2.02,5])for(const rate of [.5,1,2])await test(`native rendered ${seconds}s unit at rate ${rate} spans at least one minute`,async()=>{
  const original=pcm({seconds,channels:2}),packed=await context.r980RepeatWav(original,rate),bytes=new Uint8Array(await packed.blob.arrayBuffer()),view=new DataView(bytes.buffer);
  assert(packed.repeatCycles>1,'short native source must be packed beyond one reading');
  assert(packed.cycleMs*packed.repeatCycles>=60000-1e-6,'native block must survive an ordinary one-minute JS delay');
  assert(packed.cycleMs*packed.repeatCycles<60000+packed.cycleMs+1e-6,'block should not grow beyond its intended duration unnecessarily');
  assert(packed.repeatCycles<=512);assert(packed.blob.size<=16*1024*1024);
  assert.equal(packed.unitMediaSec,seconds);assert.equal(packed.cycleMs,seconds/rate*1000);
  assert.equal(view.getUint32(4,true),packed.blob.size-8);assert.equal(view.getUint32(40,true),packed.blob.size-44);
  assert.equal(view.getUint16(22,true),2,'spatial stereo must be retained');
  const unit=new Uint8Array(await original.slice(44).arrayBuffer());
  for(let n=0;n<packed.repeatCycles;n++)assert.deepEqual(bytes.subarray(44+n*unit.length,44+(n+1)*unit.length),unit,'every repeated unit must retain baked effects and samples');
 });
 await test('a recording longer than one minute remains one original unit',async()=>{
  const original=pcm({seconds:61}),packed=await context.r980RepeatWav(original,1);assert.equal(packed.repeatCycles,1);assert.equal(packed.blob,original);assert.equal(packed.cycleMs,61000);
 });
 await test('tiny units respect repeat bound instead of allocating an unbounded minute',async()=>{
  const packed=await context.r980RepeatWav(pcm({seconds:.001}),1);assert(packed.repeatCycles<=512);assert(packed.blob.size<=16*1024*1024);assert.equal(packed.unitMediaSec,.001);
 });
 await test('large stereo units respect memory bound',async()=>{
  const packed=await context.r980RepeatWav(pcm({seconds:12,sr:48000,channels:2}),2);assert(packed.blob.size<=16*1024*1024);assert(packed.repeatCycles<=512);assert(packed.repeatCycles>=1);
 });
 await test('available preparation memory bounds the complete packed file',async()=>{
  const supplied=pcm({seconds:1}),unitBytes=supplied.size-44,budget=44+unitBytes*7+100;
  const packed=await context.r980RepeatWav(supplied,1,{maxBytes:budget});assert.equal(packed.repeatCycles,7);assert(packed.blob.size<=budget);assert.equal(packed.unitMediaSec,1);
  const unchanged=await context.r980RepeatWav(supplied,1,{maxBytes:44});assert.equal(unchanged.blob,supplied);assert.equal(unchanged.repeatCycles,1,'no new unit allocation fits exhausted lease');
 });
 await test('actual baked echo and spatial stereo remain intact throughout the native minute',async()=>{
  const sr=8000,input=new Float32Array(sr*.6);input[800]=.5;
  const decoded={length:input.length,duration:.6,sampleRate:sr,numberOfChannels:1,getChannelData:()=>input};
  const rendered=context.r954PcmEffects(decoded,{frames:sr,rate:1,wet:.6,spatial:true});assert.equal(rendered.numberOfChannels,2);
  const left=rendered.getChannelData(0),right=rendered.getChannelData(1);
  for(const index of [800,1520,2280,3280]){assert(Math.abs(left[index])>0,'voice/echo tap disappeared');assert(Math.abs(right[index])>0);assert.notEqual(left[index],right[index],'spatial stereo was flattened');}
  assert.equal(left[5600],0,'chosen unit silence must remain silent');assert.equal(right[5600],0);
  const unit=context.r477WavFromBuffer(rendered),packed=await context.r980RepeatWav(unit,1),bytes=new Uint8Array(await packed.blob.arrayBuffer()),samples=new Uint8Array(await unit.slice(44).arrayBuffer());
  assert.equal(packed.repeatCycles,60);for(let i=0;i<packed.repeatCycles;i++)assert.deepEqual(bytes.subarray(44+i*samples.length,44+(i+1)*samples.length),samples);
 });
 await test('actual preparation lease constrains packing beside another resident audio allocation',async()=>{
  const timers=new Map();let sequence=0,leaseSnapshot,packed;
  const c={Blob,URL,ArrayBuffer,DataView,Uint8Array,Float32Array,WeakMap,Map,Set,Math,Number,String,Object,Promise,Date,Error,
   document:{baseURI:'https://test.invalid/sukun/',currentScript:{src:'https://test.invalid/sukun/assets/runtime/audio-preparation-r981.js?v=r1052'},getElementById:()=>null},
   setTimeout(fn){const id=++sequence;timers.set(id,fn);return id},clearTimeout:id=>timers.delete(id),dispatchEvent(){}};
  c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'assets/runtime/audio-preparation-r981.js'),'utf8'),c);
  const prep=c.SukunAudioPreparation;prep.addResident('synthetic-other-audio',()=>31*1024*1024);
  const decoded={duration:1,length:8000,sampleRate:8000,numberOfChannels:1},supplied=pcm();
  await prep.run(supplied,async()=>decoded,{purpose:'fx',extraSeconds:0,use:async(_decoded,job)=>{
   leaseSnapshot=prep.snapshot();const available=job.packedBudget(16*1024*1024);
   assert(available<16*1024*1024,'resident source must reduce packed byte allowance');assert(available>=44);
   packed=await context.r980RepeatWav(supplied,1,{maxBytes:available});assert(packed.blob.size<=available);return true;
  }});
  assert(leaseSnapshot.residentBytes+leaseSnapshot.activeEstimate+packed.blob.size<=leaseSnapshot.budgetBytes);
  assert(packed.repeatCycles<60,'memory constraint must take precedence over minute span');assert.equal(prep.snapshot().active,0);assert.equal(timers.size,0);
 });
 for(const damage of ['signature','format','alignment','size','channels','sampleRate','byteRate'])await test(`unsupported ${damage} leaves the supplied recording unchanged`,async()=>{
  const original=pcm(),buffer=await original.arrayBuffer(),v=new DataView(buffer);
  if(damage==='signature')v.setUint8(0,0);if(damage==='format')v.setUint16(20,3,true);if(damage==='alignment')v.setUint16(32,3,true);if(damage==='size')v.setUint32(40,v.getUint32(40,true)-2,true);if(damage==='channels')v.setUint16(22,3,true);if(damage==='sampleRate')v.setUint32(24,192001,true);if(damage==='byteRate')v.setUint32(28,1,true);
  const supplied=new Blob([buffer],{type:'audio/wav'}),packed=await context.r980RepeatWav(supplied,1);assert.equal(packed.blob,supplied);assert.equal(packed.repeatCycles,1);
 });
 const report={method:'Actual production WAV packer with synthetic rendered stereo PCM. Verifies bounded native container duration and byte-preserved effects; physical Android playback is not measured.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
