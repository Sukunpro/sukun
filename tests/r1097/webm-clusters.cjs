'use strict';
// Real packaged MediaRecorder bytes plus synthetic EBML container fixtures.
// This suite calls shipped inspection, not a replacement parser or native decode.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/audio-preparation-r981.js'),'utf8');
const results=[],MiB=1024*1024;let packagedBank=null;
async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack||String(error)})}}
function size(value){for(let length=1;length<=8;length++)if(value<2**(7*length)-1){const bytes=Buffer.alloc(length);let rest=value;for(let i=length-1;i>=0;i--){bytes[i]=rest%256;rest=Math.floor(rest/256)}bytes[0]|=1<<(8-length);return bytes}throw Error('Fixture too large')}
const unknown=Buffer.from('01ffffffffffffff','hex');
const el=(id,...parts)=>{const payload=Buffer.concat(parts);return Buffer.concat([Buffer.from(id,'hex'),size(payload.length),payload])};
const streamEl=(id,...parts)=>Buffer.concat([Buffer.from(id,'hex'),unknown,...parts]);
function uint(id,value){const bytes=[];do{bytes.unshift(value%256);value=Math.floor(value/256)}while(value);return el(id,Buffer.from(bytes))}
const str=(id,value)=>el(id,Buffer.from(value));
const header=el('1a45dfa3',uint('4286',1),uint('42f7',1),uint('42f2',4),uint('42f3',8),str('4282','webm'),uint('4287',4),uint('4285',2));
const info=el('1549a966',uint('2ad7b1',1000000),str('4d80','SUKUN regression'),str('5741','SUKUN regression'));
const opusHead=Buffer.alloc(19);opusHead.write('OpusHead');opusHead[8]=1;opusHead[9]=1;opusHead.writeUInt16LE(312,10);opusHead.writeUInt32LE(48000,12);
const rate=Buffer.alloc(8);rate.writeDoubleBE(48000);
const tracks=el('1654ae6b',el('ae',uint('d7',1),uint('73c5',1),uint('83',2),str('86','A_OPUS'),el('63a2',opusHead),el('e1',el('b5',rate),uint('9f',1))));
const silence=Buffer.from([0xf8,0xff,0xfe]);
function block(offset=0,packet=silence){const b=Buffer.alloc(4);b[0]=0x81;b.writeInt16BE(offset,1);b[3]=0x80;return el('a3',b,packet)}
const cluster=(timestamp=0,parts=[block()],sized=false)=>(sized?el:streamEl)('1f43b675',uint('e7',timestamp),...parts);
const file=(parts,{sizedSegment=false}={})=>Buffer.concat([header,(sizedSegment?el:streamEl)('18538067',info,tracks,...parts)]);
const arrayBuffer=bytes=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const blob=bytes=>new Blob([bytes],{type:'audio/webm;codecs=opus'});
function fixture(){const events=[];const window={SUKUN_BUILD:'r1097',I18N:{lang:'tr'},dispatchEvent:e=>events.push(e)};const document={baseURI:'https://fixture.invalid/',getElementById:()=>null};vm.runInNewContext(source,{window,document,URL,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail}},ArrayBuffer,DataView,Uint8Array,Float32Array,Blob,AbortController,setTimeout,clearTimeout},{filename:'audio-preparation-r981.js'});return{api:window.SukunAudioPreparation,events}}
const rejects=(promise,code)=>assert.rejects(promise,error=>{assert.equal(error.code,code);return true});
const throws=(fn,code)=>assert.throws(fn,error=>{assert.equal(error.code,code);return true});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await flush()}assert.fail('Preparation did not reach controlled stage')}
(async()=>{
 await test('Packaged Ayet-el-Kursi koruma:0 verifies actual bank bytes and passes production inspection',async()=>{
  const record=JSON.parse(fs.readFileSync(path.join(root,'assets/generic-recordings/manifest.json'))).records.find(x=>x.key==='koruma:0');assert(record);const bytes=fs.readFileSync(path.join(root,'assets/generic-recordings',record.file));assert.equal(bytes.length,record.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.sha256);const parsed=await fixture().api.inspect(blob(bytes));assert.equal(parsed.verified,'webm-opus');assert.equal(parsed.channels,1);assert.equal(parsed.sampleRate,48000);assert(parsed.packetSeconds>0&&parsed.packetSeconds<=59);assert(parsed.duration>parsed.packetSeconds&&parsed.duration<=60);
 });
 await test('Entire packaged bank classifies 291 hash-verified clips with no header failures',async()=>{
  const records=JSON.parse(fs.readFileSync(path.join(root,'assets/generic-recordings/manifest.json'))).records,{api}=fixture(),clips=[];let accepted=0,durationLimited=0;
  for(const record of records){const bytes=fs.readFileSync(path.join(root,'assets/generic-recordings',record.file));assert.equal(bytes.length,record.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.sha256);try{const meta=await api.inspect(blob(bytes));assert.equal(meta.verified,'webm-opus');assert(meta.duration>0&&meta.duration<=60);accepted++;clips.push({key:record.key,bytes:bytes.length,outcome:'accepted',duration:meta.duration,packetSeconds:meta.packetSeconds,channels:meta.channels})}catch(error){assert.equal(error.code,'PREP_DURATION_LIMIT',record.key+' must only fail the retained duration bound');durationLimited++;clips.push({key:record.key,bytes:bytes.length,outcome:error.code})}}
  packagedBank={total:records.length,accepted,durationLimited,headerFailures:0,clips};assert.equal(records.length,291);assert.equal(accepted,279);assert.equal(durationLimited,12);assert.equal(api.snapshot().decodeStarts,0);
 });
 await test('Twenty unknown-sized sibling Clusters remain siblings in unknown and known-sized Segments',async()=>{
  for(const sizedSegment of [false,true]){const bytes=file(Array.from({length:20},(_,i)=>cluster(i*1000)),{sizedSegment});const meta=await fixture().api.inspect(blob(bytes));assert.equal(meta.duration,20);assert.equal(meta.packetSeconds,.4);assert.equal(meta.channels,1)}
 });
 await test('Cluster local timestamps reset for every unknown-sized sibling',async()=>{
  const bytes=file([cluster(0,[block(30000)]),cluster(1000,[block(0)])]);const meta=await fixture().api.inspect(blob(bytes));assert.equal(meta.duration,31);assert.equal(meta.packetSeconds,.04);
 });
 await test('Known-sized and unknown-sized sibling Clusters may be mixed without nesting',async()=>{
  const meta=await fixture().api.inspect(blob(file([cluster(0),cluster(1000,[block()],true),cluster(2000)])));assert.equal(meta.duration,3);assert.equal(meta.packetSeconds,.06);
 });
 await test('Segment-level Cues, Tags and SeekHead terminate an unknown Cluster at parsed element boundaries',async()=>{
  for(const id of ['1c53bb6b','1254c367','114d9b74']){const bytes=file([cluster(0),el(id),cluster(1000)]);assert.equal((await fixture().api.inspect(blob(bytes))).duration,2)}
 });
 await test('Void and CRC global elements stay inside the current Cluster',async()=>{
  const bytes=file([cluster(0,[el('bf',Buffer.alloc(4)),el('ec',Buffer.from([1,2,3])),block(500)]),cluster(1000,[block(500)])]);const meta=await fixture().api.inspect(blob(bytes));assert.equal(meta.duration,2.5);assert.equal(meta.packetSeconds,.04);
 });
 await test('Cluster and Segment magic bytes inside a sized Opus packet never create container boundaries',async()=>{
  const packet=Buffer.concat([silence,Buffer.from('1f43b67501ffffffffffffff18538067','hex')]);const meta=await fixture().api.inspect(blob(file([cluster(0,[block(0,packet)]),cluster(1000)])));assert.equal(meta.duration,2);assert.equal(meta.packetSeconds,.04);
 });
 await test('Known-sized Cluster cannot contain another Cluster, whether child length is known or unknown',async()=>{
  for(const childSized of [false,true]){const bytes=file([cluster(0,[block(),cluster(1000,[block()],childSized)],true)]);throws(()=>fixture().api.inspectBytes(arrayBuffer(bytes)),'PREP_INVALID_HEADER')}
 });
 await test('Recognized masters in invalid parents fail closed instead of becoming nested tracks',async()=>{
  for(const invalid of [tracks,el('ae'),el('e1'),el('a0',el('a0'))]){const bytes=file([cluster(0,[block(),invalid])]);throws(()=>fixture().api.inspectBytes(arrayBuffer(bytes)),'PREP_INVALID_HEADER')}
 });
 await test('Segment or EBML roots inside a Cluster are rejected and never swallowed',async()=>{
  for(const next of [el('18538067'),header]){const bytes=file([cluster(0,[block(),next])]);throws(()=>fixture().api.inspectBytes(arrayBuffer(bytes)),'PREP_INVALID_HEADER')}
 });
 await test('Unknown-size scalar, Void and unsupported master are rejected before decode',async()=>{
  for(const bad of [streamEl('e7',Buffer.from([0])),streamEl('ec'),streamEl('1c53bb6b')]){const bytes=file([cluster(0,[block(),bad])]);let calls=0;await rejects(fixture().api.run(blob(bytes),async()=>{calls++},{purpose:'studio'}),'PREP_INVALID_HEADER');assert.equal(calls,0)}
 });
 await test('Truncated sized payload, element ID and size cannot be accepted as an unknown Cluster boundary',async()=>{
  const cases=[file([cluster(0,[block()],true)]).subarray(0,-1),file([cluster(0,[block()])]).subarray(0,-1),Buffer.concat([file([cluster()]),Buffer.from([0x1f])]),Buffer.concat([file([cluster()]),Buffer.from('1f43b675','hex')])];for(const bytes of cases)throws(()=>fixture().api.inspectBytes(arrayBuffer(bytes)),'PREP_INVALID_HEADER');
 });
 await test('Unknown Cluster siblings retain cluster and block timestamp duration checks',async()=>{
  for(const parts of [[cluster(0),cluster(60001)],[cluster(0),cluster(60000,[block(1)])]]){let calls=0;await rejects(fixture().api.run(blob(file(parts)),async()=>{calls++},{purpose:'studio'}),'PREP_DURATION_LIMIT');assert.equal(calls,0)}
 });
 await test('Cumulative Opus packet budget still rejects over sixty seconds across sibling Clusters',async()=>{
  const parts=Array.from({length:31},(_,i)=>cluster(0,Array.from({length:i===30?1:100},()=>block())));let calls=0;await rejects(fixture().api.run(blob(file(parts)),async()=>{calls++},{purpose:'studio'}),'PREP_DURATION_LIMIT');assert.equal(calls,0);
 });
 await test('Twenty-thousand-node bound still rejects a deliberately oversized element list',async()=>{
  const bytes=file([cluster(0,[block(),...Array.from({length:20001},()=>el('ec'))])]);throws(()=>fixture().api.inspectBytes(arrayBuffer(bytes)),'PREP_INVALID_HEADER');
 });
 await test('Source and memory budgets retain published values and reject input without decode',async()=>{
  const {api}=fixture(),s=api.snapshot();assert.equal(s.maxDurationSeconds,60);assert.equal(s.sourceBudgetBytes,8*MiB);assert.equal(s.budgetBytes,32*MiB);let reads=0,calls=0;await rejects(api.run({size:8*MiB+1,arrayBuffer:async()=>{reads++}},async()=>{calls++}),'PREP_SOURCE_LIMIT');assert.equal(reads,0);assert.equal(calls,0);
  api.addResident('controlled-full-budget',()=>32*MiB);await rejects(api.run(blob(file([cluster()])),async()=>{calls++}),'PREP_MEMORY_LIMIT');assert.equal(calls,0);assert.equal(api.snapshot().active,0);
 });
 await test('Cancellation during controlled decode settles caller promptly and retains native memory lease',async()=>{
  const {api}=fixture(),bytes=blob(file([cluster()])),controller=new AbortController();let resolve,calls=0,used=0;const gate=new Promise(done=>resolve=done);const task=api.run(bytes,async()=>{calls++;return gate},{signal:controller.signal,use:()=>{used++}});const rejected=rejects(task,'PREP_CANCELLED');await until(()=>api.snapshot().stage==='decode');controller.abort();await rejected;assert.equal(api.snapshot().decodeBlocked,true);await rejects(api.run(bytes,async()=>{calls++}),'PREP_DECODE_BUSY');assert.equal(calls,1);resolve({duration:.02,sampleRate:48000,numberOfChannels:1,length:960});await until(()=>api.snapshot().active===0);assert.equal(used,0);assert.equal(api.snapshot().pending,0);assert.equal(api.snapshot().cancelled,1);
 });
 const report={suite:'r1097 bounded WebM unknown-size Cluster regression',method:'Shipped parser in Node VM; all 291 packaged recordings hash-verified against manifest plus synthetic EBML hierarchy, duration and malformed-input cases. Native browser decode and physical Android capture are separate checks.',passed:results.filter(x=>x.passed).length,total:results.length,results,packagedBank};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
