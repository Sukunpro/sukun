// Node contract coverage for the shipped Studio modules. Controlled PCM decode
// callbacks are labelled fixtures; native decoder/UI acceptance is a separate suite.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(process.argv[2]||path.join(here,'../..'));
const output=path.resolve(process.argv[3]||path.join(here,'evidence/studio-waveform-regression.json'));
const baseline=process.argv.includes('--baseline'),MiB=1024*1024;
const names=['index.html','nero.html','assets/runtime/audio-cpu-r981.js','assets/runtime/audio-preparation-r981.js','assets/runtime/studio-preparation-r982.js'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={suite:'r1105 bounded read-only Studio waveform contracts',startedAt:new Date().toISOString(),baseline,sourceSha256:Object.fromEntries(names.map(n=>[n,hash(fs.readFileSync(path.join(root,n)))])),testSha256:hash(fs.readFileSync(fileURLToPath(import.meta.url))),checks:[],limitations:['Node VM with controlled decode callbacks and real typed PCM; no native decoding, microphone, physical Android or audible-output proof.']};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function load(){
 const c={console,Blob,URL,ArrayBuffer,Uint8Array,Float32Array,DataView,AbortController,Promise,setTimeout,clearTimeout,setImmediate,document:{currentScript:{src:'https://sukun.test/assets/runtime/audio-preparation-r981.js'},baseURI:'https://sukun.test/',documentElement:{lang:'tr'},getElementById(){return null}},CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail}},dispatchEvent(){}};
 c.window=c;c.self=c;vm.createContext(c);
 for(const n of names.slice(2))vm.runInContext(fs.readFileSync(path.join(root,n),'utf8'),c,{filename:n});
 return c;
}
function wav(seconds,{rate=8000,channels=1}={}){
 const frames=Math.round(seconds*rate),align=channels*2,b=Buffer.alloc(44+frames*align),v=new DataView(b.buffer,b.byteOffset,b.byteLength);
 b.write('RIFF');v.setUint32(4,b.length-8,true);b.write('WAVEfmt ',8);v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,channels,true);v.setUint32(24,rate,true);v.setUint32(28,rate*align,true);v.setUint16(32,align,true);v.setUint16(34,16,true);b.write('data',36);v.setUint32(40,frames*align,true);return new Blob([b],{type:'audio/wav'});
}
function pcm(seconds,{rate=48000,channels=1}={}){
 const length=Math.round(seconds*rate),input=Array.from({length:channels},()=>new Float32Array(length));
 // Widely separated signed transients prove a full scan, not a start preview.
 input[0][16]=.25;input.at(-1)[length-17]=-.75;
 return{duration:length/rate,sampleRate:rate,numberOfChannels:channels,length,getChannelData:c=>input[c],input};
}
function authority(c,decode){c.SukunAudioDecodeAuthority={decode:(b,opt)=>c.SukunAudioPreparation.run(b,decode,opt)};}
function drain(gen){let step;do{step=gen.next()}while(!step.done);return step.value;}
async function rejectCode(run,code){await assert.rejects(run,e=>{assert.equal(e.code,code);return true})}
async function check(name,run){try{report.checks.push({name,passed:true,evidence:await run()});console.log('PASS',name)}catch(e){report.checks.push({name,passed:false,error:e.stack||String(e)});console.error('FAIL',name,e.message)}}

if(baseline){
 await check('Previous release reproduces the 63.1-second blank-wave metadata path',async()=>{
  const c=load();let calls=0;authority(c,async()=>{calls++;throw Error('unexpected decode')});
  const result=await c.SukunStudioPreparation.process(wav(63.1),{kind:'analyze'});
  assert.equal(result.metadataOnly,true);assert.equal(result.wave,undefined);assert.equal(result.peak,undefined);assert.equal(calls,0);return{dur:result.dur,reason:result.reason,decodeCalls:calls};
 });
}else{
 for(const channels of [1,2])await check(`63.1-second ${channels}-channel analysis measures both ends without modifying any PCM or source bytes`,async()=>{
  const c=load(),d=pcm(63.1,{channels}),blob=wav(63.1,{channels}),original=hash(Buffer.from(await blob.arrayBuffer())),samples=d.input.map(x=>hash(Buffer.from(x.buffer)));let calls=0,commits=0;
  authority(c,async()=>{calls++;return d});const result=await c.SukunStudioPreparation.process(blob,{kind:'analyze',commit(){commits++}});
  assert.equal(result.metadataOnly,undefined);assert.equal(result.changed,false);assert.equal(result.dur,63.1);assert.equal(result.peak,.75);assert.ok(result.rms>0);assert.equal(result.wave.bins,512);assert.equal(result.wave.max[0],.25);assert.equal(result.wave.min[511],-.75);assert.equal(result.blob,undefined);assert.equal(result.wav,undefined);assert.equal(calls,1);assert.equal(commits,0);
  assert.equal(hash(Buffer.from(await blob.arrayBuffer())),original);assert.deepEqual(d.input.map(x=>hash(Buffer.from(x.buffer))),samples);
  const snap=c.SukunAudioPreparation.snapshot();assert.ok(snap.peakEstimate<=32*MiB);assert.equal(snap.pending,0);assert.equal(snap.active,0);assert.equal(snap.maxConcurrent,1);return{duration:result.dur,peak:result.peak,rms:result.rms,bins:result.wave.bins,snapshot:snap};
 });
 await check('180-second CPU analysis requires the explicit read-only flag; edit operations retain 60-second bounds',async()=>{
  const c=load(),d=pcm(180,{rate:8000}),payload={input:d.input,length:d.length,sampleRate:d.sampleRate};
  assert.throws(()=>drain(c.SukunAudioCpuR981.studio({...payload,options:{operation:'analyze'}})),/Studio PCM layout/);
  for(const operation of ['normalize','trim'])assert.throws(()=>drain(c.SukunAudioCpuR981.studio({...payload,options:{operation,allowLongInspection:true}})),/Studio PCM layout/);
  const result=drain(c.SukunAudioCpuR981.studio({...payload,options:{operation:'analyze',allowLongInspection:true}}));assert.equal(result.duration,180);assert.equal(result.peak,.75);assert.equal(result.changed,false);assert.equal(result.wav,undefined);
  const over=pcm(180.001,{rate:8000});assert.throws(()=>drain(c.SukunAudioCpuR981.studio({input:over.input,length:over.length,sampleRate:over.sampleRate,options:{operation:'analyze',allowLongInspection:true}})),/Studio PCM layout/);return{duration:result.duration,peak:result.peak};
 });
 for(const operation of ['normalize','trim'])await check(`Long-wave permission and metadata cache cannot admit ${operation} or FX`,async()=>{
  const c=load(),blob=wav(63.1);let calls=0;authority(c,async()=>{calls++;return pcm(63.1)});await c.SukunStudioPreparation.process(blob,{kind:'analyze'});assert.equal(calls,1);
  await rejectCode(()=>c.SukunStudioPreparation.process(blob,{kind:operation}),'PREP_DURATION_LIMIT');await rejectCode(()=>c.SukunAudioPreparation.run(blob,async()=>{calls++},{purpose:'fx',allowLongInspection:true,operation:'analyze'}),'PREP_DURATION_LIMIT');assert.equal(calls,1);return{decodeCalls:calls};
 });
 await check('Read-only memory fallback remains honest and does not start a native decode or fabricate a graph',async()=>{
  const c=load();c.SukunAudioPreparation.addResident('labelled-test-resident',()=>25*MiB);let calls=0;authority(c,async()=>{calls++;throw Error('must not decode')});
  const result=await c.SukunStudioPreparation.process(wav(63.1),{kind:'analyze'});assert.equal(result.metadataOnly,true);assert.equal(result.reason,'memory');assert.equal(result.wave,undefined);assert.equal(result.peak,undefined);assert.equal(calls,0);return{duration:result.dur,reason:result.reason,snapshot:c.SukunAudioPreparation.snapshot()};
 });
 await check('180.001-second or 8 MiB+1 sources are rejected before decoder entry',async()=>{
  const c=load();let calls=0,reads=0;authority(c,async()=>{calls++});await rejectCode(()=>c.SukunStudioPreparation.process(wav(180.001),{kind:'analyze'}),'PREP_DURATION_LIMIT');
  await rejectCode(()=>c.SukunStudioPreparation.process({size:8*MiB+1,arrayBuffer(){reads++;throw Error('must not read')}},{kind:'analyze'}),'PREP_SOURCE_LIMIT');assert.equal(calls,0);assert.equal(reads,0);return{decodeCalls:calls,oversizedReads:reads};
 });
 await check('Cancellation during a long sample scan publishes no result or edit and releases the queue',async()=>{
  const c=load(),controller=new AbortController(),d=pcm(63.1),blob=wav(63.1);let commits=0;authority(c,async()=>d);
  const work=c.SukunStudioPreparation.process(blob,{kind:'analyze',signal:controller.signal,commit(){commits++}});
  while(c.SukunAudioPreparation.snapshot().stage!=='cpu')await tick();controller.abort();await rejectCode(()=>work,'PREP_CANCELLED');while(c.SukunAudioPreparation.snapshot().pending)await tick();assert.equal(commits,0);assert.equal(d.input[0].at(-17),-.75);assert.equal(c.SukunAudioPreparation.snapshot().active,0);return c.SukunAudioPreparation.snapshot();
 });
 await check('Cancelled native decode retains the serial lease until it settles and cannot publish a stale waveform',async()=>{
  const c=load(),controller=new AbortController(),blob=wav(63.1);let settle,started=false,commits=0;authority(c,()=>new Promise(resolve=>{started=true;settle=resolve}));
  const work=c.SukunStudioPreparation.process(blob,{kind:'analyze',signal:controller.signal,commit(){commits++}});while(!started)await tick();controller.abort();await rejectCode(()=>work,'PREP_CANCELLED');assert.equal(c.SukunAudioPreparation.snapshot().decodeBlocked,true);
  await rejectCode(()=>c.SukunStudioPreparation.process(blob,{kind:'analyze'}),'PREP_DECODE_BUSY');settle(pcm(63.1));while(c.SukunAudioPreparation.snapshot().pending)await tick();assert.equal(commits,0);assert.equal(c.SukunAudioPreparation.snapshot().maxConcurrent,1);return c.SukunAudioPreparation.snapshot();
 });
 await check('Selection ownership change after decode starts rejects an obsolete analysis result',async()=>{
  const c=load();let current=true,started=false,settle,commits=0;authority(c,()=>new Promise(resolve=>{started=true;settle=resolve}));const work=c.SukunStudioPreparation.process(wav(63.1),{kind:'analyze',isCurrent:()=>current,commit(){commits++}});
  while(!started)await tick();current=false;settle(pcm(63.1));await rejectCode(()=>work,'PREP_CANCELLED');assert.equal(commits,0);assert.equal(c.SukunAudioPreparation.snapshot().pending,0);return{commits,snapshot:c.SukunAudioPreparation.snapshot()};
 });
 await check('Short normalization still produces a changed WAV while its original remains byte-identical',async()=>{
  const c=load(),blob=wav(.1),original=hash(Buffer.from(await blob.arrayBuffer()));let commits=0;authority(c,async()=>pcm(.1,{rate:8000}));const result=await c.SukunStudioPreparation.process(blob,{kind:'normalize',commit(output,check){check();assert.equal(output.blob.type,'audio/wav');commits++}});
  assert.equal(result.changed,true);assert.equal(commits,1);assert.equal(hash(Buffer.from(await blob.arrayBuffer())),original);return{changed:result.changed,commits,type:result.blob.type};
 });
}
report.finishedAt=new Date().toISOString();report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.sourceUnchanged=names.every(n=>hash(fs.readFileSync(path.join(root,n)))===report.sourceSha256[n]);report.testUnchanged=hash(fs.readFileSync(fileURLToPath(import.meta.url)))===report.testSha256;report.allPassed=report.passed===report.total&&report.sourceUnchanged&&report.testUnchanged;
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,passed:report.passed,total:report.total,sourceUnchanged:report.sourceUnchanged}));if(!report.allPassed)process.exitCode=1;
