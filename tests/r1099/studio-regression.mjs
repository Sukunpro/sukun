// Run: node tests/r1099/studio-regression.mjs
// Executes the shipped preparation/CPU/Studio modules, not a reimplementation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..'),MiB=1024*1024;
const report={suite:'r1099 Studio read-only long inspection',started:new Date().toISOString(),passed:[],failed:[],observations:{}};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const arrayBuffer=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
function load({baseline=false}={}){
  const events=[];
  const c={console,Blob,URL,ArrayBuffer,Uint8Array,Float32Array,DataView,AbortController,Promise,setTimeout,clearTimeout,setImmediate,
    document:{currentScript:{src:'https://sukun.test/assets/runtime/audio-preparation-r981.js'},baseURI:'https://sukun.test/',documentElement:{lang:'tr'},getElementById(){return null}},
    CustomEvent:class {constructor(type,{detail}){this.type=type;this.detail=detail}},dispatchEvent(e){events.push(e)}};
  c.window=c;c.self=c;
  vm.createContext(c);
  const files=baseline?['fixtures/audio-cpu-r1098.js','fixtures/audio-preparation-r1098.js','fixtures/studio-preparation-r1098.js']:['../../assets/runtime/audio-cpu-r981.js','../../assets/runtime/audio-preparation-r981.js','../../assets/runtime/studio-preparation-r982.js'];
  for(const file of files)vm.runInContext(fs.readFileSync(path.join(here,file),'utf8'),c,{filename:file});
  c.events=events;
  return c;
}
function wav(seconds,{rate=8000,channels=1,bits=8}={}){
  const frames=Math.round(seconds*rate),align=channels*bits/8,data=frames*align;
  const b=Buffer.alloc(44+data),v=new DataView(b.buffer,b.byteOffset,b.byteLength);
  b.write('RIFF');v.setUint32(4,b.length-8,true);b.write('WAVE',8);b.write('fmt ',12);v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,channels,true);v.setUint32(24,rate,true);v.setUint32(28,rate*align,true);v.setUint16(32,align,true);v.setUint16(34,bits,true);b.write('data',36);v.setUint32(40,data,true);
  return b;
}
function decoded(seconds,{rate=48000,channels=1}={}){
  const length=Math.round(seconds*rate),data=[];
  return {duration:length/rate,sampleRate:rate,numberOfChannels:channels,length,getChannelData(c){return data[c]??=new Float32Array(length)}};
}
function loadUi(){
  const c=load(),elements=new Map(),listeners=new Map(),draw={clears:0,strokes:0},records=new Map(),revisions=new Map();let writes=0,decodes=0;
  const element=id=>{if(!elements.has(id))elements.set(id,{id,textContent:'',disabled:false,setAttribute(){},clientWidth:300,clientHeight:96,getContext(){return{scale(){},clearRect(){draw.clears++},beginPath(){},moveTo(){},lineTo(){},stroke(){draw.strokes++}}}});return elements.get(id)};
  c.document.getElementById=element;c.addEventListener=(type,fn)=>{const list=listeners.get(type)||[];list.push(fn);listeners.set(type,list)};c.R170={};c.devicePixelRatio=1;c.getComputedStyle=()=>({getPropertyValue:()=>''});
  c.REC_DB={revision:key=>revisions.get(key)||0,async get(key){return records.get(key)},async set(key,blob){writes++;records.set(key,blob);revisions.set(key,(revisions.get(key)||0)+1)}};
  c.SukunAudioDecodeAuthority={decode:(b,opt)=>c.SukunAudioPreparation.run(b,async()=>{decodes++;throw Error('long inspection must never decode')},opt)};
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('const Studio=R170.Studio='),end=html.indexOf('// Cancel native/worker/storage stages',start);assert.ok(start>0&&end>start);
  vm.runInContext(html.slice(start,end),c,{filename:'index.html actual Studio integration'});
  const ui=vm.runInContext('({Studio,studioAnalyze,analyzeKey,studioClearMeasurements})',c);
  return{c,ui,element,draw,records,revisions,emit(type){for(const fn of listeners.get(type)||[])fn()},get writes(){return writes},get decodes(){return decodes}};
}
async function rejectCode(action,code){await assert.rejects(action,e=>{assert.equal(e.code,code);return true})}
async function test(name,run){try{await run();report.passed.push(name);console.log('PASS',name)}catch(e){report.failed.push({name,error:e.stack||String(e)});console.error('FAIL',name,e.message)}}
const longOptions={purpose:'studio',operation:'analyze',allowLongInspection:true};
const editOptions={purpose:'studio',operation:'normalize'};
const asBlob=(b,type='audio/wav')=>new Blob([b],{type});

await test('r1098 reproduces 90-second Studio rejection before decode',async()=>{
  const c=load({baseline:true});let calls=0;
  await rejectCode(()=>c.SukunAudioPreparation.run(asBlob(wav(90)),async()=>{calls++;return decoded(90)},longOptions),'PREP_DURATION_LIMIT');assert.equal(calls,0);
});
await test('decode, FX, source and CPU limits remain 60 s / 32 MiB / 8 MiB',async()=>{
  const c=load(),s=c.SukunAudioPreparation.snapshot();assert.equal(s.maxDurationSeconds,60);assert.equal(s.budgetBytes,32*MiB);assert.equal(s.sourceBudgetBytes,8*MiB);
  const input=[new Float32Array(61*8000)];assert.throws(()=>c.SukunAudioCpuR981.studio({input,length:input[0].length,sampleRate:8000,options:{operation:'analyze'}}).next(),/Studio PCM layout/);
  assert.equal(hash(fs.readFileSync(path.join(root,'assets/runtime/audio-cpu-r981.js'))),hash(fs.readFileSync(path.join(here,'fixtures/audio-cpu-r1098.js'))));
});
for(const seconds of [61,90,140,180])await test(`WAV ${seconds} s read-only inspection uses no decoder or CPU`,async()=>{
  const c=load(),bytes=wav(seconds),original=hash(bytes),blob=asBlob(bytes);let calls=0,uses=0;
  const result=await c.SukunAudioPreparation.run(blob,async()=>{calls++;throw Error('decoder must not run')},{...longOptions,use(){uses++;throw Error('CPU must not run')}});
  assert.equal(result.metadataOnly,true);assert.equal(result.meta.duration,seconds);assert.equal(calls,0);assert.equal(uses,0);assert.equal(hash(Buffer.from(await blob.arrayBuffer())),original);
  const s=c.SukunAudioPreparation.snapshot();assert.equal(s.decodeStarts,0);assert.equal(s.workerJobs,0);assert.equal(s.fallbackJobs,0);assert.equal(s.pending,0);assert.equal(s.active,0);
});
await test('WAV 180.001 s is rejected before decoder',async()=>{
  const c=load();let calls=0;await rejectCode(()=>c.SukunAudioPreparation.run(asBlob(wav(180.001)),async()=>{calls++},longOptions),'PREP_DURATION_LIMIT');assert.equal(calls,0);
});
await test('metadata cache cannot admit long input into FX or normalization',async()=>{
  const c=load(),blob=asBlob(wav(90));let calls=0;
  assert.equal((await c.SukunAudioPreparation.run(blob,async()=>{calls++},longOptions)).metadataOnly,true);
  await rejectCode(()=>c.SukunAudioPreparation.run(blob,async()=>{calls++},{purpose:'fx'}),'PREP_DURATION_LIMIT');
  await rejectCode(()=>c.SukunAudioPreparation.run(blob,async()=>{calls++},editOptions),'PREP_DURATION_LIMIT');
  assert.equal(calls,0);
});
await test('long analyze requires its explicit read-only admission flag',async()=>{
  const c=load();await rejectCode(()=>c.SukunAudioPreparation.run(asBlob(wav(90)),async()=>{throw Error('decoder must not run')},{purpose:'studio',operation:'analyze'}),'PREP_DURATION_LIMIT');
});
await test('8 MiB + 1 input rejects without reading its ArrayBuffer',async()=>{
  const c=load();let reads=0,decodes=0;
  const tooBig={size:8*MiB+1,arrayBuffer(){reads++;throw Error('must not read')}};
  await rejectCode(()=>c.SukunAudioPreparation.run(tooBig,async()=>{decodes++},longOptions),'PREP_SOURCE_LIMIT');assert.equal(reads,0);assert.equal(decodes,0);
});
await test('malformed long WAV never becomes metadata success',async()=>{
  const c=load(),bytes=wav(90);bytes.writeUInt32LE(bytes.length,4);
  await rejectCode(()=>c.SukunAudioPreparation.run(asBlob(bytes),async()=>{throw Error('must not decode')},longOptions),'PREP_INVALID_HEADER');
});
await test('short Studio still decodes once and performs real exact analysis',async()=>{
  const c=load(),d=decoded(.1,{rate:8000});d.getChannelData(0)[400]=.5;
  c.SukunAudioDecodeAuthority={decode:(blob,opt)=>c.SukunAudioPreparation.run(blob,async()=>d,opt)};
  const result=await c.SukunStudioPreparation.process(asBlob(wav(.1)),{kind:'analyze'});
  assert.equal(result.metadataOnly,undefined);assert.equal(result.peak,.5);assert.ok(result.rms>0);assert.ok(result.wave.min instanceof Float32Array);assert.equal(c.SukunAudioPreparation.snapshot().decodeStarts,1);
});
await test('short Studio normalize produces WAV while preserving the input',async()=>{
  const c=load(),d=decoded(.1,{rate:8000});d.getChannelData(0)[400]=.25;const blob=asBlob(wav(.1)),before=hash(Buffer.from(await blob.arrayBuffer()));let commits=0;
  c.SukunAudioDecodeAuthority={decode:(b,opt)=>c.SukunAudioPreparation.run(b,async()=>d,opt)};
  const result=await c.SukunStudioPreparation.process(blob,{kind:'normalize',commit(output,check){check();commits++;assert.equal(output.changed,true)}});
  assert.equal(commits,1);assert.equal(result.changed,true);assert.equal(result.blob.type,'audio/wav');assert.equal(hash(Buffer.from(await blob.arrayBuffer())),before);
});
await test('long Studio wrapper exposes only metadata and never commits changes',async()=>{
  const c=load(),blob=asBlob(wav(140));let decodes=0,commits=0,passed;
  c.SukunAudioDecodeAuthority={decode:(b,opt)=>{passed=opt;return c.SukunAudioPreparation.run(b,async()=>{decodes++;throw Error('must not decode')},opt)}};
  const result=await c.SukunStudioPreparation.process(blob,{kind:'analyze',commit(){commits++}});
  assert.equal(passed.operation,'analyze');assert.equal(passed.allowLongInspection,true);assert.equal(result.metadataOnly,true);assert.equal(result.changed,false);assert.equal(decodes,0);assert.equal(commits,0);assert.equal(result.dur,140);
  for(const key of ['peak','rms','wave','blob','wav'])assert.equal(result[key],undefined,`${key} must not be fabricated`);
});
await test('predecode memory failure can return metadata for analyze only',async()=>{
  const c=load(),blob=asBlob(wav(50));c.SukunAudioPreparation.addResident('held',()=>32*MiB-2*MiB);let calls=0;
  const result=await c.SukunAudioPreparation.run(blob,async()=>{calls++},longOptions);assert.equal(result.metadataOnly,true);assert.equal(calls,0);
  await rejectCode(()=>c.SukunAudioPreparation.run(blob,async()=>{calls++},editOptions),'PREP_MEMORY_LIMIT');assert.equal(calls,0);
});
await test('decoded PCM duration over 60 s never reaches CPU or use',async()=>{
  const c=load();let uses=0;await rejectCode(()=>c.SukunAudioPreparation.run(asBlob(wav(10)),async()=>decoded(61),{...longOptions,use(){uses++}}),'PREP_DURATION_LIMIT');assert.equal(uses,0);
});
await test('decoded stereo PCM over memory budget is rejected before use',async()=>{
  const c=load();let uses=0;await rejectCode(()=>c.SukunAudioPreparation.run(asBlob(wav(50)),async()=>decoded(50,{rate:192000,channels:2}),{...editOptions,use(){uses++}}),'PREP_MEMORY_LIMIT');assert.equal(uses,0);
});
await test('cancelled native decode retains the serial lease until it settles',async()=>{
  const c=load(),controller=new AbortController(),blob=asBlob(wav(.1));let settle,started=false,staleWrites=0;
  const first=c.SukunAudioPreparation.run(blob,()=>new Promise(resolve=>{started=true;settle=resolve}),{...editOptions,signal:controller.signal,use(){staleWrites++}});
  while(!started)await tick();controller.abort();await rejectCode(()=>first,'PREP_CANCELLED');assert.equal(c.SukunAudioPreparation.snapshot().decodeBlocked,true);
  await rejectCode(()=>c.SukunAudioPreparation.run(blob,async()=>decoded(.1),longOptions),'PREP_DECODE_BUSY');
  settle(decoded(.1));while(c.SukunAudioPreparation.snapshot().pending)await tick();assert.equal(staleWrites,0);assert.equal(c.SukunAudioPreparation.snapshot().maxConcurrent,1);
  await c.SukunAudioPreparation.run(blob,async()=>decoded(.1),{purpose:'decode'});assert.equal(c.SukunAudioPreparation.snapshot().active,0);
});
await test('selection ownership invalidation prevents an edit commit',async()=>{
  const c=load();let current=true,started=false,settle,commits=0;
  c.SukunAudioDecodeAuthority={decode:(b,opt)=>c.SukunAudioPreparation.run(b,()=>new Promise(resolve=>{started=true;settle=resolve}),opt)};
  const job=c.SukunStudioPreparation.process(asBlob(wav(.1)),{kind:'normalize',isCurrent:()=>current,commit(){commits++}});
  while(!started)await tick();current=false;settle(decoded(.1));await rejectCode(()=>job,'PREP_CANCELLED');assert.equal(commits,0);
});
await test('inspect enforces read-only policy while inspectBytes preserves raw WAV parsing',async()=>{
  const c=load(),bytes=wav(90),blob=asBlob(bytes),readOnly={purpose:'studio',readOnlyLongStudio:true};
  assert.equal((await c.SukunAudioPreparation.inspect(blob,readOnly)).duration,90);assert.equal(c.SukunAudioPreparation.inspectBytes(arrayBuffer(bytes),readOnly).duration,90);
  await rejectCode(()=>c.SukunAudioPreparation.inspect(blob,{purpose:'studio'}),'PREP_DURATION_LIMIT');await rejectCode(()=>c.SukunAudioPreparation.inspect(blob,{purpose:'fx',readOnlyLongStudio:true}),'PREP_DURATION_LIMIT');
  // The legacy pure parser reports raw format facts; inspect/run own final
  // duration admission. Its WAV branch must not silently become a policy API.
  assert.equal(c.SukunAudioPreparation.inspectBytes(arrayBuffer(bytes),{purpose:'studio'}).duration,90);
  await rejectCode(()=>c.SukunAudioPreparation.run(blob,async()=>{throw Error('must not decode')},{purpose:'studio',operation:'normalize'}),'PREP_DURATION_LIMIT');
});
await test('actual Studio UI clears old sample statistics and presents read-only result',async()=>{
  const h=loadUi(),bytes=wav(140),blob=asBlob(bytes);h.records.set('A',blob);h.revisions.set('A',7);h.ui.Studio.key='A';
  h.element('r170Peak').textContent='95%';h.element('r170Dur').textContent='12.1 sn';
  assert.equal(await h.ui.studioAnalyze(),true);assert.equal(h.element('r170Peak').textContent,'—');assert.equal(h.element('r170Dur').textContent,'140.0 sn');assert.match(h.element('r170StudioStat').textContent,/Tepe, RMS ve dalga ölçülmedi/);assert.doesNotMatch(h.element('r170StudioStat').textContent,/RMS \d+%/);
  assert.equal(h.draw.strokes,0);assert.ok(h.draw.clears>=2);assert.equal(h.decodes,0);assert.equal(h.writes,0);assert.equal(h.revisions.get('A'),7);assert.equal(hash(Buffer.from(await blob.arrayBuffer())),hash(bytes));
});
await test('completed analysis is invalidated when the selected source revision changes',async()=>{
  const h=loadUi();h.records.set('A',asBlob(wav(140)));h.revisions.set('A',1);h.ui.Studio.key='A';
  assert.equal(await h.ui.studioAnalyze(),true);assert.equal(h.element('r170Dur').textContent,'140.0 sn');
  const jobs=h.c.SukunAudioPreparation.snapshot().metadataOnlyJobs;
  h.records.set('A',asBlob(wav(90)));h.revisions.set('A',2);h.emit('sukun:recordingcatalog');
  for(const id of ['r170Dur','r170Peak','r170Size'])assert.equal(h.element(id).textContent,'—');
  assert.match(h.element('r170StudioStat').textContent,/Kayıt değişti.*Analiz et/);assert.equal(h.element('r170Analyze').disabled,false);
  assert.equal(h.ui.Studio.analysisTask,null);assert.equal(h.c.SukunAudioPreparation.snapshot().metadataOnlyJobs,jobs);
  assert.equal(await h.ui.studioAnalyze(),true);assert.equal(h.element('r170Dur').textContent,'90.0 sn');assert.equal(h.writes,0);assert.equal(h.decodes,0);
});
await test('unchanged catalog notifications and other source edits retain the analyzed measurements',async()=>{
  const h=loadUi();h.records.set('A',asBlob(wav(140)));h.revisions.set('A',1);h.ui.Studio.key='A';
  assert.equal(await h.ui.studioAnalyze(),true);const jobs=h.c.SukunAudioPreparation.snapshot().metadataOnlyJobs,clears=h.draw.clears;
  h.revisions.set('B',2);for(let i=0;i<3;i++)h.emit('sukun:recordingcatalog');
  assert.equal(h.element('r170Dur').textContent,'140.0 sn');assert.equal(h.draw.clears,clears);assert.equal(h.c.SukunAudioPreparation.snapshot().metadataOnlyJobs,jobs);assert.equal(h.writes,0);assert.equal(h.decodes,0);
});
for(const busy of ['edit','session'])await test(`source replacement during ${busy} clears old measurements without starting analysis or replacing its status`,async()=>{
  const h=loadUi();h.records.set('A',asBlob(wav(140)));h.revisions.set('A',1);h.ui.Studio.key='A';
  assert.equal(await h.ui.studioAnalyze(),true);const jobs=h.c.SukunAudioPreparation.snapshot().metadataOnlyJobs;
  h.ui.Studio[busy]={key:'A'};h.element('r170StudioStat').textContent='Current operation';h.revisions.set('A',2);h.emit('sukun:recordingcatalog');
  assert.equal(h.element('r170Dur').textContent,'—');assert.equal(h.element('r170StudioStat').textContent,'Current operation');assert.equal(h.ui.Studio.analysisTask,null);assert.equal(h.c.SukunAudioPreparation.snapshot().metadataOnlyJobs,jobs);assert.equal(h.writes,0);assert.equal(h.decodes,0);
});
await test('late metadata from a different key cannot replace the selected UI',async()=>{
  const h=loadUi(),old=wav(140);let release,reading=false;
  h.records.set('A',{size:old.length,arrayBuffer:()=>new Promise(resolve=>{reading=true;release=()=>resolve(arrayBuffer(old))})});h.records.set('B',asBlob(wav(90)));h.ui.Studio.key='A';
  const first=h.ui.studioAnalyze();while(!reading)await tick();assert.equal(h.c.SukunAudioPreparation.snapshot().stage,'inspect');
  h.ui.Studio.key='B';const second=h.ui.studioAnalyze();release();assert.equal(await first,false);assert.equal(await second,true);
  assert.equal(h.element('r170Dur').textContent,'90.0 sn');assert.match(h.element('r170StudioStat').textContent,/Süre ve boyut incelendi/);assert.equal(h.decodes,0);assert.equal(h.writes,0);
});
await test('source revision changed during inspection cannot publish old metadata',async()=>{
  const h=loadUi(),bytes=wav(140);let release,reading=false;
  h.records.set('A',{size:bytes.length,arrayBuffer:()=>new Promise(resolve=>{reading=true;release=()=>resolve(arrayBuffer(bytes))})});h.revisions.set('A',3);h.ui.Studio.key='A';
  const result=h.ui.studioAnalyze();while(!reading)await tick();h.revisions.set('A',4);release();assert.equal(await result,false);
  assert.equal(h.element('r170Dur').textContent,'—');assert.equal(h.element('r170Peak').textContent,'—');assert.equal(h.decodes,0);assert.equal(h.writes,0);
});
for(const changedStage of ['tab ownership','recording session'])await test(`${changedStage} change during inspection prevents stale UI publication`,async()=>{
  const h=loadUi(),bytes=wav(90);let release,reading=false,owner={epoch:1,intent:1};
  h.c.SukunTabOwner={snapshot:()=>owner};h.records.set('A',{size:bytes.length,arrayBuffer:()=>new Promise(resolve=>{reading=true;release=()=>resolve(arrayBuffer(bytes))})});h.ui.Studio.key='A';
  const result=h.ui.studioAnalyze();while(!reading)await tick();if(changedStage==='tab ownership')owner={epoch:2,intent:2};else h.ui.Studio.session={phase:'recording',key:'A'};
  release();assert.equal(await result,false);assert.equal(h.element('r170Dur').textContent,'—');assert.equal(h.element('r170Peak').textContent,'—');assert.equal(h.decodes,0);assert.equal(h.writes,0);
});

const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/generic-recordings/manifest.json'),'utf8'));
for(const key of ['dua:ak','koruma:4'])await test(`packaged ${key} is read-only metadata with unchanged bytes`,async()=>{
  const c=load(),record=manifest.records.find(r=>r.key===key);assert.ok(record);const bytes=fs.readFileSync(path.join(root,'assets/generic-recordings',record.file));assert.equal(hash(bytes),record.sha256);
  let calls=0;const result=await c.SukunAudioPreparation.run(asBlob(bytes,'audio/webm;codecs=opus'),async()=>{calls++;throw Error('must not decode')},longOptions);
  assert.equal(result.metadataOnly,true);assert.ok(result.meta.duration>60&&result.meta.duration<=180);assert.equal(calls,0);assert.equal(hash(bytes),record.sha256);
  report.observations[key]={sourceBytes:bytes.length,verifiedSeconds:result.meta.duration,packetSeconds:result.meta.packetSeconds,channels:result.meta.channels,sha256:hash(bytes)};
});

const generated=fs.mkdtempSync(path.join(os.tmpdir(),'sukun-r1099-'));
const generatedFiles=[];
try{
  for(const seconds of [90,140,178.8,179,180,181]){
    const file=path.join(generated,`tone-${seconds}.webm`);
    const made=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t',String(seconds),'-c:a','libopus','-b:a','24k','-y',file],{encoding:'utf8'});
    if(made.error||made.status!==0)throw Error(`ffmpeg unavailable: ${made.error||made.stderr}`);
    generatedFiles.push({seconds,file});
  }
  for(const {seconds,file}of generatedFiles)await test(`real WebM Opus ${seconds} s observes conservative +1 s admission`,async()=>{
    const c=load(),bytes=fs.readFileSync(file),blob=asBlob(bytes,'audio/webm');let calls=0;
    if(seconds<=178.8){const result=await c.SukunAudioPreparation.run(blob,async()=>{calls++;throw Error('must not decode')},longOptions);assert.equal(result.metadataOnly,true);assert.ok(result.meta.duration>=seconds&&result.meta.duration<=180);report.observations[`webm-${seconds}`]={verifiedSeconds:result.meta.duration,packetSeconds:result.meta.packetSeconds};}
    else await rejectCode(()=>c.SukunAudioPreparation.run(blob,async()=>{calls++},longOptions),'PREP_DURATION_LIMIT');
    assert.equal(calls,0);
  });
}finally{fs.rmSync(generated,{recursive:true,force:true})}

report.completed=new Date().toISOString();report.count={passed:report.passed.length,failed:report.failed.length};
fs.writeFileSync(path.join(here,'node-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.count));
if(report.failed.length)process.exitCode=1;
