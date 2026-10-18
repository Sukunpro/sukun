'use strict';
// VM regression seam: shipped preparation runtime, synthetic PCM WAVs and WebM/Opus,
// controlled metadata and decoded AudioBuffer-shaped results. This suite does
// not call native decodeAudioData, capture a microphone, or prove device limits.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/audio-preparation-r981.js'),'utf8');
const MiB=1024*1024;
const results=[];
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await flush()}assert.fail('Controlled VM operation did not reach its expected state')}
async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack||String(error)})}}
function wav(seconds,{channels=1,sampleRate=48000,bits=16}={}){
 const frames=Math.round(seconds*sampleRate),align=channels*bits/8,size=44+frames*align;
 const bytes=new ArrayBuffer(size),view=new DataView(bytes),u8=new Uint8Array(bytes);
 const word=(offset,text)=>{for(let i=0;i<text.length;i++)u8[offset+i]=text.charCodeAt(i)};
 word(0,'RIFF');view.setUint32(4,size-8,true);word(8,'WAVE');word(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*align,true);view.setUint16(32,align,true);view.setUint16(34,bits,true);word(36,'data');view.setUint32(40,size-44,true);
 return new Blob([bytes],{type:'audio/wav'});
}
// Small EBML files with a WebM header, Info, one Opus audio track and clusters.
// RFC 6716's three-byte 20-ms silence packet supplies actual Opus packet data;
// these fixtures exercise production parsing, not native browser decoding.
function opusWebm({clusters=[{timestamp:0,offsets:[1000]}]}={}){
 const size=value=>{for(let length=1;length<=8;length++)if(value<2**(7*length)-1){const bytes=Buffer.alloc(length);let rest=value;for(let i=length-1;i>=0;i--){bytes[i]=rest%256;rest=Math.floor(rest/256)}bytes[0]|=1<<(8-length);return bytes}throw Error('Fixture element too large')};
 const element=(id,...parts)=>{const payload=Buffer.concat(parts);return Buffer.concat([Buffer.from(id,'hex'),size(payload.length),payload])};
 const uint=(id,value)=>{const bytes=[];do{bytes.unshift(value%256);value=Math.floor(value/256)}while(value);return element(id,Buffer.from(bytes))};
 const str=(id,value)=>element(id,Buffer.from(value));
 const header=element('1a45dfa3',uint('4286',1),uint('42f7',1),uint('42f2',4),uint('42f3',8),str('4282','webm'),uint('4287',4),uint('4285',2));
 const info=element('1549a966',uint('2ad7b1',1000000),str('4d80','SUKUN test'),str('5741','SUKUN test'));
 const opusHead=Buffer.alloc(19);opusHead.write('OpusHead');opusHead[8]=1;opusHead[9]=1;opusHead.writeUInt16LE(312,10);opusHead.writeUInt32LE(48000,12);
 const rate=Buffer.alloc(8);rate.writeDoubleBE(48000);
 const tracks=element('1654ae6b',element('ae',uint('d7',1),uint('73c5',1),uint('83',2),str('86','A_OPUS'),element('63a2',opusHead),element('e1',element('b5',rate),uint('9f',1))));
 const packet=Buffer.from([0xf8,0xff,0xfe]);
 const blocks=clusters.map(({timestamp,offsets})=>element('1f43b675',uint('e7',timestamp),...offsets.map(offset=>{const block=Buffer.alloc(4);block[0]=0x81;block.writeInt16BE(offset,1);block[3]=0x80;return element('a3',block,packet)})));
 return new Blob([header,element('18538067',info,tracks,...blocks)],{type:'audio/webm;codecs=opus'});
}
function decoded(meta,overrides={}){
 return{duration:meta.duration,sampleRate:48000,numberOfChannels:meta.channels,length:Math.ceil(meta.duration*48000),...overrides};
}
function fixture(){
 let urlSeq=0;const events=[];
 class ControlledURL extends URL{}
 ControlledURL.createObjectURL=()=>`blob:vm-preparation-${++urlSeq}`;
 ControlledURL.revokeObjectURL=()=>{};
 const window={I18N:{lang:'tr'},SUKUN_BUILD:'r1096',dispatchEvent:event=>events.push(event)};
 const document={baseURI:'https://vm.invalid/',currentScript:{src:'https://vm.invalid/assets/runtime/audio-preparation-r981.js?v=r1096'},getElementById:()=>null,
  createElement:()=>({duration:2,removeAttribute(){},load(){if(this.onloadedmetadata)queueMicrotask(()=>this.onloadedmetadata?.())}})};
 vm.runInNewContext(source,{window,document,URL:ControlledURL,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail}},ArrayBuffer,DataView,Uint8Array,Float32Array,Blob,AbortController,setTimeout,clearTimeout,queueMicrotask},{filename:'audio-preparation-r981.js'});
 return{api:window.SukunAudioPreparation,events};
}
async function rejectsCode(promise,code){await assert.rejects(promise,error=>{assert.equal(error.code,code);return true})}
(async()=>{
 await test('Published budgets remain 60 seconds, 8 MiB source, 32 MiB preparation',async()=>{const s=fixture().api.snapshot();assert.equal(s.maxDurationSeconds,60);assert.equal(s.sourceBudgetBytes,8*MiB);assert.equal(s.budgetBytes,32*MiB)});
 await test('Valid two-second WAV reaches the controlled decode seam and releases its lease',async()=>{
  const{api}=fixture(),blob=wav(2),meta=await api.inspect(blob);assert.equal(meta.duration,2);assert.equal(meta.channels,1);assert.equal(meta.verified,'wav');
  let calls=0;const stages=[],buffer=decoded(meta),result=await api.run(blob,async(bytes,control)=>{calls++;assert.equal(bytes.byteLength,blob.size);control.check();return buffer},{purpose:'studio',onStage:value=>stages.push(value),use:(audio,control)=>{assert.equal(audio,buffer);assert.equal(control.meta.duration,2);control.check();return'controlled-success'}});
  assert.equal(result,'controlled-success');assert.equal(calls,1);assert.deepEqual(stages,['queued','inspect','decode']);assert.equal(api.snapshot().decodeStarts,1);assert.equal(api.snapshot().pending,0);assert.equal(api.snapshot().active,0);
 });
 await test('WAV duration boundary is inclusive at 60 and typed duration rejection begins above 60',async()=>{
  const{api}=fixture();assert.equal((await api.inspect(wav(60,{sampleRate:8000}))).duration,60);
  const over=wav(60.001,{sampleRate:8000});let calls=0;await rejectsCode(api.inspect(over),'PREP_DURATION_LIMIT');await rejectsCode(api.run(over,async()=>{calls++;return decoded({duration:2,channels:1})},{purpose:'studio'}),'PREP_DURATION_LIMIT');assert.equal(calls,0);assert.equal(api.snapshot().decodeStarts,0);assert.equal(api.snapshot().last.code,'PREP_DURATION_LIMIT');
 });
 await test('Valid WebM Opus fixture reaches production inspection and the controlled decode seam',async()=>{
  const{api}=fixture(),blob=opusWebm(),meta=await api.inspect(blob);assert.equal(meta.verified,'webm-opus');assert.equal(meta.duration,2);assert.equal(meta.packetSeconds,0.02);assert.equal(meta.channels,1);assert.equal(meta.sampleRate,48000);let calls=0;
  assert.equal((await api.run(blob,async()=>{calls++;return decoded(meta)})).duration,2);assert.equal(calls,1);assert.equal(api.snapshot().pending,0);assert.equal(api.snapshot().active,0);
 });
 await test('WebM cluster timestamp accepts exactly 60 seconds and rejects an over-limit cluster before decode',async()=>{
  // Both audio blocks begin at 59 seconds. Only the cluster timestamp crosses
  // the limit, so the final +1-second duration check cannot mask this branch.
  const{api}=fixture(),at=opusWebm({clusters:[{timestamp:60000,offsets:[-1000]}]}),over=opusWebm({clusters:[{timestamp:60001,offsets:[-1001]}]});assert.equal((await api.inspect(at)).duration,60);
  const bytes=await over.arrayBuffer();assert.throws(()=>api.inspectBytes(bytes),error=>error.code==='PREP_DURATION_LIMIT');let calls=0;await rejectsCode(api.inspect(over),'PREP_DURATION_LIMIT');await rejectsCode(api.run(over,async()=>{calls++},{purpose:'studio'}),'PREP_DURATION_LIMIT');assert.equal(calls,0);assert.equal(api.snapshot().decodeStarts,0);assert.equal(api.snapshot().last.code,'PREP_DURATION_LIMIT');
 });
 await test('WebM block timestamp raw boundary stays inclusive at 60 and rejects above 60 with the duration code',async()=>{
  const{api}=fixture(),at=opusWebm({clusters:[{timestamp:30000,offsets:[30000]}]}),over=opusWebm({clusters:[{timestamp:30000,offsets:[30001]}]});
  assert.equal(api.inspectBytes(await at.arrayBuffer()).duration,61);
  const bytes=await over.arrayBuffer();assert.throws(()=>api.inspectBytes(bytes),error=>error.code==='PREP_DURATION_LIMIT');let calls=0;await rejectsCode(api.inspect(at),'PREP_DURATION_LIMIT');await rejectsCode(api.inspect(over),'PREP_DURATION_LIMIT');await rejectsCode(api.run(over,async()=>{calls++},{purpose:'studio'}),'PREP_DURATION_LIMIT');assert.equal(calls,0);assert.equal(api.snapshot().decodeStarts,0);assert.equal(api.snapshot().last.code,'PREP_DURATION_LIMIT');
 });
 await test('WebM block timestamps retain the conservative second: 59 seconds fits and 59.001 does not',async()=>{
  const{api}=fixture(),at=opusWebm({clusters:[{timestamp:30000,offsets:[29000]}]}),over=opusWebm({clusters:[{timestamp:30000,offsets:[29001]}]});assert.equal((await api.inspect(at)).duration,60);assert.equal(api.inspectBytes(await over.arrayBuffer()).duration,60.001);await rejectsCode(api.inspect(over),'PREP_DURATION_LIMIT');
 });
 await test('WebM cumulative Opus samples accept exactly 60 seconds raw and reject the next packet before decode',async()=>{
  // All timestamps are zero: the packet total alone must enforce this limit.
  const{api}=fixture(),at=opusWebm({clusters:[{timestamp:0,offsets:Array(3000).fill(0)}]}),over=opusWebm({clusters:[{timestamp:0,offsets:Array(3001).fill(0)}]});const raw=api.inspectBytes(await at.arrayBuffer());assert.equal(raw.packetSeconds,60);assert.equal(raw.duration,61);
  const bytes=await over.arrayBuffer();assert.throws(()=>api.inspectBytes(bytes),error=>error.code==='PREP_DURATION_LIMIT');let calls=0;await rejectsCode(api.inspect(at),'PREP_DURATION_LIMIT');await rejectsCode(api.inspect(over),'PREP_DURATION_LIMIT');await rejectsCode(api.run(over,async()=>{calls++},{purpose:'studio'}),'PREP_DURATION_LIMIT');assert.equal(calls,0);assert.equal(api.snapshot().decodeStarts,0);assert.equal(api.snapshot().last.code,'PREP_DURATION_LIMIT');
 });
 await test('WebM packet duration retains the conservative second: 59 seconds fits and one more packet does not',async()=>{
  const{api}=fixture(),at=opusWebm({clusters:[{timestamp:0,offsets:Array(2950).fill(0)}]}),over=opusWebm({clusters:[{timestamp:0,offsets:Array(2951).fill(0)}]});const accepted=await api.inspect(at);assert.equal(accepted.packetSeconds,59);assert.equal(accepted.duration,60);const raw=api.inspectBytes(await over.arrayBuffer());assert.equal(raw.packetSeconds,59.02);assert.equal(raw.duration,60.02);await rejectsCode(api.inspect(over),'PREP_DURATION_LIMIT');
 });
 await test('Over-8-MiB input is rejected without reading the source or calling decode',async()=>{
  const{api}=fixture();let reads=0,calls=0;const large={size:8*MiB+1,arrayBuffer:async()=>{reads++;throw Error('source must not be read')}};
  await rejectsCode(api.inspect(large),'PREP_SOURCE_LIMIT');await rejectsCode(api.run(large,async()=>{calls++}),'PREP_SOURCE_LIMIT');assert.equal(reads,0);assert.equal(calls,0);assert.equal(api.snapshot().pending,0);
 });
 await test('Thirty-second 48-kHz stereo source fits source limit but exceeds processing memory before decode',async()=>{
  const{api}=fixture(),blob=wav(30,{channels:2});assert(blob.size<8*MiB);assert.equal((await api.inspect(blob)).duration,30);let calls=0;
  await rejectsCode(api.run(blob,async()=>{calls++},{purpose:'studio'}),'PREP_MEMORY_LIMIT');assert.equal(calls,0);assert.equal(api.snapshot().decodeStarts,0);assert.equal(api.snapshot().active,0);assert(api.snapshot().peakEstimate<=32*MiB);
 });
 await test('Malformed RIFF is a header error, independent of duration errors',async()=>{
  const{api}=fixture(),bytes=await wav(2).arrayBuffer();new DataView(bytes).setUint32(4,1,true);let calls=0;
  await rejectsCode(api.run(new Blob([bytes]),async()=>{calls++}),'PREP_INVALID_HEADER');assert.equal(calls,0);assert.equal(api.snapshot().last.code,'PREP_INVALID_HEADER');
 });
 await test('Metadata-only format with unverifiable channel layout is a layout error before decode',async()=>{
  const{api}=fixture();let calls=0;await rejectsCode(api.run(new Blob(['not WAV or WebM']),async()=>{calls++}),'PREP_UNKNOWN_LAYOUT');assert.equal(calls,0);
 });
 await test('Decoded duration and layout are independently checked after the controlled decode seam',async()=>{
  for(const[overrides,code]of [[{duration:61},'PREP_DURATION_LIMIT'],[{numberOfChannels:3},'PREP_UNKNOWN_LAYOUT']]){
   const{api}=fixture(),blob=wav(2),meta=await api.inspect(blob);await rejectsCode(api.run(blob,async()=>decoded(meta,overrides)),code);assert.equal(api.snapshot().decodeStarts,1);assert.equal(api.snapshot().pending,0);assert.equal(api.snapshot().last.code,code);
  }
 });
 await test('Decoded-rate growth is re-budgeted and fails before use or output creation',async()=>{
  const{api}=fixture(),blob=wav(2),meta=await api.inspect(blob);let used=0;
  await rejectsCode(api.run(blob,async()=>decoded(meta,{sampleRate:1920000,length:3840000}),{use:()=>{used++}}),'PREP_MEMORY_LIMIT');assert.equal(used,0);assert.equal(api.snapshot().decodeStarts,1);assert.equal(api.snapshot().active,0);assert(api.snapshot().peakEstimate<=32*MiB);
 });
 await test('Resident PCM counts toward the same budget and approved trimmers can reclaim it',async()=>{
  const{api}=fixture(),blob=wav(2),meta=await api.inspect(blob);let resident=31*MiB,trims=0;
  api.addResident('controlled-cache',()=>resident);await rejectsCode(api.run(blob,async()=>decoded(meta)),'PREP_MEMORY_LIMIT');assert.equal(api.snapshot().decodeStarts,0);
  api.addTrimmer(target=>{trims++;assert(target>=0&&target<=32*MiB);resident=0});assert.equal((await api.run(blob,async()=>decoded(meta))).duration,2);assert.equal(trims,1);assert.equal(api.snapshot().residentBytes,0);assert(api.snapshot().peakEstimate<=32*MiB);
 });
 await test('Packed output headroom retains the active preparation estimate and resident URLs',async()=>{
  const{api}=fixture(),blob=wav(2),meta=await api.inspect(blob);let url;
  await api.run(blob,async()=>decoded(meta),{use:(_audio,control)=>{const before=api.snapshot();assert.equal(control.packedBudget(99*MiB),32*MiB-before.activeEstimate-before.residentBytes);url=control.createUrl(new Blob([new Uint8Array(1234)]));assert.equal(api.snapshot().residentBytes,0);return true}});
  assert.equal(api.snapshot().residentBytes,1234);api.forgetUrl(url);assert.equal(api.snapshot().residentBytes,0);
 });
 await test('Preparation queue serializes four admissions and rejects the fifth',async()=>{
  const{api}=fixture(),blob=wav(2),meta=await api.inspect(blob),gate=deferred();let concurrent=0,max=0,calls=0;
  const decode=async()=>{calls++;concurrent++;max=Math.max(max,concurrent);if(calls===1)await gate.promise;concurrent--;return decoded(meta)};
  const jobs=Array.from({length:4},()=>api.run(blob,decode));await rejectsCode(api.run(blob,decode),'PREP_QUEUE_FULL');await until(()=>calls===1);assert.equal(api.snapshot().pending,4);assert.equal(api.snapshot().active,1);gate.resolve();await Promise.all(jobs);assert.equal(calls,4);assert.equal(max,1);assert.equal(api.snapshot().maxConcurrent,1);assert.equal(api.snapshot().pending,0);
 });
 await test('Aborted decode rejects promptly but retains its lease until decode settles and blocks a new decode',async()=>{
  const{api}=fixture(),blob=wav(2),meta=await api.inspect(blob),gate=deferred(),controller=new AbortController();let calls=0,used=0;
  const first=api.run(blob,async()=>{calls++;return gate.promise},{signal:controller.signal,use:()=>{used++}});const rejection=rejectsCode(first,'PREP_CANCELLED');await until(()=>api.snapshot().stage==='decode');controller.abort();await rejection;
  assert.equal(api.snapshot().active,1);assert.equal(api.snapshot().decodeBlocked,true);await rejectsCode(api.run(blob,async()=>{calls++;return decoded(meta)}),'PREP_DECODE_BUSY');assert.equal(calls,1);gate.resolve(decoded(meta));await until(()=>api.snapshot().active===0);assert.equal(used,0);assert.equal(api.snapshot().pending,0);
  assert.equal((await api.run(blob,async()=>{calls++;return decoded(meta)})).duration,2);assert.equal(calls,2);assert.equal(api.snapshot().maxConcurrent,1);assert.equal(api.snapshot().cancelled,1);
 });
 await test('Stale queued job is cancelled before decoding and does not disturb its predecessor',async()=>{
  const{api}=fixture(),blob=wav(2),meta=await api.inspect(blob),gate=deferred();let current=true,staleDecode=0;
  const first=api.run(blob,()=>gate.promise);await until(()=>api.snapshot().stage==='decode');const stale=api.run(blob,async()=>{staleDecode++;return decoded(meta)},{isCurrent:()=>current});const rejection=rejectsCode(stale,'PREP_CANCELLED');current=false;gate.resolve(decoded(meta));assert.equal((await first).duration,2);await rejection;assert.equal(staleDecode,0);assert.equal(api.snapshot().decodeStarts,1);assert.equal(api.snapshot().pending,0);assert.equal(api.snapshot().active,0);
 });
 await test('Controlled decoder failure releases the queue so a later preparation succeeds',async()=>{
  const{api}=fixture(),blob=wav(2),meta=await api.inspect(blob);await assert.rejects(api.run(blob,async()=>{throw Error('controlled native decode failure')}),/controlled native decode failure/);assert.equal(api.snapshot().active,0);assert.equal((await api.run(blob,async()=>decoded(meta))).duration,2);assert.equal(api.snapshot().maxConcurrent,1);
 });
 const report={suite:'r1096 preparation duration, source, memory and queue regression',method:'Shipped audio-preparation-r981.js in Node VM; own WAV and WebM/Opus fixtures exercise production container parsing; metadata/audio element, URL handling and decoded AudioBuffer results are controlled seams. No native browser decode, microphone capture or physical-device claim.',passed:results.filter(result=>result.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
