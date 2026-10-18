// Supplemental real-media proof: FFmpeg's native Opus decoder produces PCM,
// then the shipped preparation/Studio/CPU modules process that labelled buffer.
// This is not browser AudioContext, canvas, IndexedDB or Android acceptance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(process.argv[2]||path.join(here,'../..'));
const output=path.resolve(process.argv[3]||path.join(here,'evidence/studio-waveform-real-audio.json'));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const names=['index.html','nero.html','assets/runtime/audio-cpu-r981.js','assets/runtime/audio-preparation-r981.js','assets/runtime/studio-preparation-r982.js','assets/generic-recordings/manifest.json'];
const report={suite:'r1105 real shipped WebM native FFmpeg decode and actual Studio generator',startedAt:new Date().toISOString(),sourceSha256:Object.fromEntries(names.map(n=>[n,hash(fs.readFileSync(path.join(root,n)))])),testSha256:hash(fs.readFileSync(fileURLToPath(import.meta.url))),checks:[],limitations:[
 'FFmpeg native Opus decoder produces actual Float32 PCM from verified shipped public WebM. A controlled AudioBuffer-compatible callback supplies those samples to the actual shipped SukunAudioPreparation and SukunStudioPreparation modules in Node VM.',
 'Peak and RMS are independently checked against FFmpeg astats from a separate decode; waveform bins are checked against independently reduced Float64 reference extrema of the native PCM.',
 'No browser, browser AudioContext, canvas-pixel, IndexedDB, live playback, microphone, private user recording, physical Android or screen-lock claim. Budget assertions concern production accounting, not total Node/FFmpeg process memory.'
]};
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/generic-recordings/manifest.json'),'utf8'));
function ffmpeg(args){const result=spawnSync('ffmpeg',['-hide_banner','-nostdin',...args],{encoding:null,maxBuffer:64*1024*1024});if(result.error||result.status!==0)throw Error(result.error?.message||result.stderr.toString());return result;}
function load(){
 const c={console,Blob,URL,ArrayBuffer,Uint8Array,Float32Array,DataView,AbortController,Promise,setTimeout,clearTimeout,document:{currentScript:{src:'https://sukun.test/assets/runtime/audio-preparation-r981.js'},baseURI:'https://sukun.test/',documentElement:{lang:'tr'},getElementById(){return null}},CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail}},dispatchEvent(){}};
 c.window=c;c.self=c;vm.createContext(c);for(const n of names.slice(2,5))vm.runInContext(fs.readFileSync(path.join(root,n),'utf8'),c,{filename:n});return c;
}
async function check(name,run){try{report.checks.push({name,passed:true,evidence:await run()});console.log('PASS',name)}catch(e){report.checks.push({name,passed:false,error:e.stack||String(e)});console.error('FAIL',name,e.message)}}
report.decoder=spawnSync('ffmpeg',['-version'],{encoding:'utf8'}).stdout.split('\n')[0];
for(const key of ['koruma:4','dua:ak']){
 const row=manifest.records.find(r=>r.key===key);assert.ok(row,'Shipped public fixture '+key);
 const file=path.join(root,'assets/generic-recordings',row.file),source=fs.readFileSync(file),beforeHash=hash(source);
 let pcm,native,reference,result,c,calls=0,commits=0;
 await check(`${key}: shipped WebM hash matches its manifest and native FFmpeg decodes every sample`,async()=>{
  assert.equal(source.length,row.bytes);assert.equal(beforeHash,row.sha256);
  const decoded=ffmpeg(['-v','error','-i',file,'-map','0:a:0','-ar','48000','-acodec','pcm_f32le','-f','f32le','pipe:1']).stdout;
  assert.equal(decoded.byteLength%4,0);pcm=new Float32Array(decoded.buffer.slice(decoded.byteOffset,decoded.byteOffset+decoded.byteLength));
  const stats=ffmpeg(['-nostats','-i',file,'-map','0:a:0','-af','astats=metadata=0:reset=0','-acodec','pcm_f32le','-f','null','-']).stderr.toString();
  const overall=stats.slice(stats.lastIndexOf('Overall'));
  const number=label=>{const match=overall.match(new RegExp(label+': ([^\\s]+)'));assert.ok(match,'FFmpeg astats '+label);return Number(match[1]);};
  native={sampleRate:48000,channels:1,frames:number('Number of samples'),peak:10**(number('Peak level dB')/20),rms:10**(number('RMS level dB')/20),duration:pcm.length/48000,decodedPcmSha256:hash(Buffer.from(pcm.buffer))};
  assert.equal(native.frames,pcm.length);assert.ok(native.duration>60&&native.duration<180);assert.ok(native.peak>0&&native.rms>0);
  reference={min:[],max:[]};for(let bin=0;bin<512;bin++){const samples=pcm.subarray(Math.floor(bin*pcm.length/512),Math.ceil((bin+1)*pcm.length/512));reference.min.push(samples.reduce((a,x)=>Math.min(a,x),Infinity));reference.max.push(samples.reduce((a,x)=>Math.max(a,x),-Infinity));}
  return{key,sourceBytes:source.length,sourceSha256:beforeHash,native};
 });
 await check(`${key}: actual Studio service measures full-duration peak, RMS and all 512 waveform bins`,async()=>{
  assert.ok(pcm&&native,'Native fixture decode must succeed first');c=load();
  const decoded={duration:native.duration,sampleRate:native.sampleRate,numberOfChannels:1,length:pcm.length,getChannelData(channel){assert.equal(channel,0);return pcm;}};
  c.SukunAudioDecodeAuthority={decode:(blob,opt)=>c.SukunAudioPreparation.run(blob,async bytes=>{calls++;assert.equal(hash(Buffer.from(bytes)),beforeHash);return decoded;},opt)};
  result=await c.SukunStudioPreparation.process(new Blob([source],{type:row.type}),{kind:'analyze',key,waveBins:512,commit(){commits++}});
  assert.equal(result.metadataOnly,undefined);assert.equal(result.dur,native.duration);assert.equal(result.wave.bins,512);assert.equal(result.changed,false);assert.ok(Math.abs(result.peak-native.peak)<0.000001,JSON.stringify({actual:result.peak,native:native.peak}));assert.ok(Math.abs(result.rms-native.rms)<0.000001,JSON.stringify({actual:result.rms,native:native.rms}));
  assert.deepEqual(Array.from(result.wave.min),reference.min);assert.deepEqual(Array.from(result.wave.max),reference.max);assert.equal(result.wav,undefined);assert.equal(result.blob,undefined);assert.equal(commits,0);assert.equal(calls,1);
  const snapshot=c.SukunAudioPreparation.snapshot();assert.equal(snapshot.pending,0);assert.equal(snapshot.active,0);assert.equal(snapshot.maxConcurrent,1);assert.ok(snapshot.peakEstimate<=32*1024*1024);
  return{dur:result.dur,peak:result.peak,rms:result.rms,bins:result.wave.bins,firstBin:{min:result.wave.min[0],max:result.wave.max[0]},lastBin:{min:result.wave.min[511],max:result.wave.max[511]},maxBinError:0,commits,decodeCalls:calls,snapshot};
 });
 await check(`${key}: raw WebM and native PCM remain byte-identical after read-only analysis`,async()=>{
  assert.ok(result,'Analysis must succeed first');assert.equal(hash(fs.readFileSync(file)),beforeHash);assert.equal(hash(source),beforeHash);assert.equal(hash(Buffer.from(pcm.buffer)),native.decodedPcmSha256);assert.equal(commits,0);return{sourceSha256:beforeHash,pcmSha256:native.decodedPcmSha256,sourceFileUnchanged:true,pcmUnchanged:true,commits};
 });
 await check(`${key}: successful waveform measurement grants no permission to normalize or trim the long original`,async()=>{
  assert.ok(c&&result,'Analysis must succeed first');const blob=new Blob([source],{type:row.type}),codes={};for(const kind of ['normalize','trim'])await assert.rejects(()=>c.SukunStudioPreparation.process(blob,{kind,key,commit(){commits++}}),e=>{codes[kind]=e.code;assert.equal(e.code,'PREP_DURATION_LIMIT');return true;});assert.equal(calls,1);assert.equal(commits,0);assert.equal(hash(fs.readFileSync(file)),beforeHash);return{codes,decodeCalls:calls,commits};
 });
}
report.finishedAt=new Date().toISOString();report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.sourceUnchanged=names.every(n=>hash(fs.readFileSync(path.join(root,n)))===report.sourceSha256[n]);report.testUnchanged=hash(fs.readFileSync(fileURLToPath(import.meta.url)))===report.testSha256;report.allPassed=report.passed===report.total&&report.sourceUnchanged&&report.testUnchanged;
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,passed:report.passed,total:report.total,sourceUnchanged:report.sourceUnchanged}));if(!report.allPassed)process.exitCode=1;
