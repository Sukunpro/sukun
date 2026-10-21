#!/usr/bin/env node
'use strict';
// Controlled production-source regression tests. No browser, acoustic, hardware,
// microphone, external network, or end-to-end release acceptance is claimed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const startedAt=new Date().toISOString(),args=process.argv.slice(2).filter(arg=>arg!=='--candidate');
const root=path.resolve(args[0]||path.join(__dirname,'../..')),output=args[1]?path.resolve(args[1]):null;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const candidate=process.argv.includes('--candidate');
function runtime(stem){
 const referenced=html.match(new RegExp('<script\\s+[^>]*src=["\\\']\\./(assets/runtime/'+stem+'-r\\d+\\.js)(?:\\?[^"\\\']*)?["\\\']'))?.[1];
 assert(referenced,'Missing referenced runtime: '+stem);
 return {referenced,tested:candidate?'assets/runtime/'+stem+'-r1121.js':referenced};
}
const controller=runtime('background-mix'),renderer=runtime('background-mix-render');
const fixturePath=path.join(root,'tests/r1059/background-mix.cjs');
let fixtureSource=fs.readFileSync(fixturePath,'utf8');
fixtureSource=fixtureSource.slice(0,fixtureSource.indexOf('(async()=>{'));
const old="'assets/runtime/background-mix-r1059.js'";
assert.equal(fixtureSource.split(old).length-1,1,'Exactly one production source path is adapted');
fixtureSource=fixtureSource.replace(old,JSON.stringify(controller.tested))+'\nglobalThis.fixture=fixture;';
const boundary={require,__dirname:path.dirname(fixturePath),process:{argv:['node',fixturePath,root]},console,Blob,ArrayBuffer,DataView,Uint8Array,URL,AbortController,queueMicrotask};
vm.createContext(boundary);vm.runInContext(fixtureSource,boundary,{filename:fixturePath});
const results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.stack});}}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
async function attenuation(name,before,after,{kind='combined',direct=false,held=false}={}){
 await test(name,async()=>{
  const f=boundary.fixture(kind);Object.assign(f.snapshot.frequency,before);const media=await f.start(),old=media.src;
  f.renderMode='pending';f.held=held;Object.assign(f.snapshot.frequency,after);
  if(direct)f.controller.prepare();else f.controller.changed('frequency-controls');
  assert(media.paused,'Old native loop must stop synchronously');assert(!f.urls.has(old),'Old louder PCM URL must be retired');
  assert.equal(f.liveMuted,false,'Current live graph is restored without dropping ambience');
  if(kind==='combined')assert.equal(f.snapshot.ambiences.length,1,'Existing ambience selection stays intact');
  await f.settle();f.advance(30000,{freezeJS:true});assert.equal(f.audible().length,0,'Frozen/pending replacement cannot retain obsolete louder PCM');
  if(held){assert.equal(f.controller.snapshot().state,'PAUSED');assert.equal(f.renderJobs.length,1,'Pause must not start a new render');}
 });
}
function param(value=0){return {value,setValueAtTime(){},setTargetAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){}};}
// Supplies known zero PCM to verify whether production correctly classifies
// silence. It does not emulate Web Audio rendering or prove audible spectra.
class ZeroOutputContext{
 constructor(channels,length,sampleRate){this.length=length;this.sampleRate=sampleRate;this.destination={};this.nodes=[];}
 node(kind){const n={kind,gain:param(1),frequency:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),offset:param(),connect(){},disconnect(){},start(){},stop(){}};this.nodes.push(n);return n;}
 createGain(){return this.node('gain');}createBiquadFilter(){return this.node('filter');}createDynamicsCompressor(){return this.node('compressor');}createConvolver(){return this.node('convolver');}createOscillator(){return this.node('oscillator');}createBufferSource(){return this.node('bufferSource');}createChannelSplitter(){return this.node('splitter');}createChannelMerger(){return this.node('merger');}
 createBuffer(ch,length,sr){return {numberOfChannels:ch,length,sampleRate:sr,getChannelData:()=>new Float32Array(length)};}
 async startRendering(){return this.createBuffer(2,this.length,this.sampleRate);}
}
const renderContext={window:{OfflineAudioContext:ZeroOutputContext},Blob,Float32Array,ArrayBuffer,DataView,Math,Number,Set,WeakSet,Map,Error,Proxy,Reflect};
vm.createContext(renderContext);vm.runInContext(fs.readFileSync(path.join(root,renderer.tested),'utf8'),renderContext,{filename:renderer.tested});
const renderZero=f=>renderContext.window.SukunBackgroundMixRenderer.render({ambiences:[],sampleRate:8000,frequency:{playing:true,mode:'bin',c:180,b:7.83,vol:.5,balL:0,balR:0,pink:false,secondary:{playing:false},...f}},{withContext:(ctx,fn)=>fn()});
(async()=>{
 await attenuation('Zero frequency volume immediately retires previously audible PCM',{vol:.5},{vol:0});
 await attenuation('Reduced frequency volume restores the quieter live graph without losing ambience',{vol:.5},{vol:.1});
 await attenuation('Reduced explicit output level retires old higher-profile PCM',{outputLevel:.7},{outputLevel:.35});
 await attenuation('Left-channel attenuation cannot leave that old channel audible',{balL:1,balR:1},{balL:0,balR:1});
 await attenuation('Right-channel attenuation cannot leave that old channel audible',{balL:1,balR:1},{balL:1,balR:.2});
 await attenuation('Pink-layer removal retires independently audible old pink PCM',{pink:true},{pink:false});
 await attenuation('Pink-level attenuation is independent of unchanged main level',{pink:true,pinkLevel:.12},{pink:true,pinkLevel:.03});
 await attenuation('Secondary removal retires old secondary PCM even when main remains',{secondary:{playing:true,c:100,b:2.5}},{secondary:{playing:false,c:100,b:2.5}});
 await attenuation('Secondary-level attenuation is independent of main stereo trims',{secondary:{playing:true,c:100,b:2.5},secondaryLevel:.22},{secondaryLevel:.04});
 await attenuation('Noise-volume attenuation retires the previously louder noise',{noise:'pink',noiseVol:1},{noise:'pink',noiseVol:0});
 await attenuation('Direct prepare also fences the obsolete louder frequency',{vol:.5},{vol:0},{direct:true});
 await attenuation('Attenuation during aggregate pause cannot restart any source',{vol:.5},{vol:0},{held:true});
 await test('Pure pitch changes retain accepted native route until current render is ready',async()=>{const f=boundary.fixture('combined'),a=await f.start(),old=a.src;f.renderMode='pending';f.snapshot.frequency.c=432;f.controller.changed('retune');await f.settle();assert.equal(a.src,old);assert.equal(a.paused,false);assert.equal(f.liveMuted,true);});
 await test('Delayed prior render cannot regain ownership after a zero-volume request',async()=>{const f=boundary.fixture('combined'),a=await f.start();f.renderMode='pending';f.snapshot.frequency.c=432;f.controller.changed('retune');await f.settle();const stale=f.renderJobs.length-1;f.snapshot.frequency.vol=0;f.controller.changed('mute');assert(a.paused);f.resolveRender(stale);await f.settle();assert.equal(f.audible().length,0);assert.equal(f.liveMuted,false);assert.equal(f.controller.snapshot().metrics.accepted,1);});
 for(const outcome of ['resolve','reject'])for(const restoreMethod of ['changed','prepare']){
  await test('Non-attenuating A to B to A via '+restoreMethod+' survives stale '+outcome,async()=>{
   const f=boundary.fixture('combined'),a=await f.start(),old=a.src;f.renderMode='pending';f.snapshot.frequency.c=432;f.controller.changed('retune');await f.settle();const stale=f.renderJobs.length-1;
   f.snapshot.frequency.c=180;if(restoreMethod==='prepare')await f.controller.prepare();else f.controller.changed('restore');await f.flush();
   assert.equal(f.renderJobs[stale].adapter.isCurrent(),false);assert.equal(f.controller.snapshot().ready,true);
   if(outcome==='resolve')f.resolveRender(stale);else f.renderJobs[stale].wait.reject(Object.assign(new Error('StaleOfflineRender'),{name:'AbortError'}));
   await f.settle();assert.equal(a.src,old);assert.equal(a.paused,false);assert.equal(f.controller.snapshot().ready,true);assert.equal(f.controller.snapshot().metrics.accepted,1);assert.equal(f.renderJobs.length,2);
  });
  await test('Secondary mute and restore via '+restoreMethod+' survives stale '+outcome+' without replaying disabled audio',async()=>{
   const f=boundary.fixture('combined');f.snapshot.frequency.secondary={playing:true,c:100,b:2.5};const a=await f.start(),old=a.src;f.renderMode='pending';f.snapshot.frequency.secondary.playing=false;f.controller.changed('secondary-off');await f.settle();const stale=f.renderJobs.length-1;
   assert.equal(a.paused,true);assert.equal(f.urls.has(old),false);assert.equal(f.liveMuted,false);
   f.snapshot.frequency.secondary.playing=true;let work;if(restoreMethod==='prepare')work=f.controller.prepare();else f.controller.changed('restore-secondary');await f.settle();assert.equal(f.renderJobs[stale].adapter.isCurrent(),false);
   if(outcome==='resolve')f.resolveRender(stale);else f.renderJobs[stale].wait.reject(Object.assign(new Error('StaleOfflineRender'),{name:'AbortError'}));
   await f.settle();assert.equal(f.audible().length,0);assert.equal(f.controller.snapshot().error,'');
   const current=f.renderJobs.length-1;assert(current>stale);assert.equal(f.renderJobs[current].state.frequency.secondary.playing,true);f.resolveRender(current);await f.settle();if(work)await work;
   assert.equal(f.audible().length,1);assert.equal(f.controller.snapshot().ready,true);assert.notEqual(a.src,old);assert.equal(f.controller.snapshot().metrics.accepted,2);
  });
 }
 await test('Deliberately muted left and right channels accept digital-zero PCM',async()=>{const r=await renderZero({});assert.equal(r.peak,0);});
 await test('Zero volume accepts digital-zero PCM',async()=>{const r=await renderZero({vol:0,balL:1,balR:1});assert.equal(r.peak,0);});
 await test('Explicitly zero main output accepts digital-zero PCM',async()=>{const r=await renderZero({balL:1,balR:1,outputLevel:0});assert.equal(r.peak,0);});
 await test('An audible main channel still rejects unexpected silence',async()=>{await assert.rejects(()=>renderZero({balL:1}),e=>e.code==='silent-render');});
 await test('Enabled independent pink output still rejects unexpected silence despite muted main trims',async()=>{await assert.rejects(()=>renderZero({pink:true}),e=>e.code==='silent-render');});
 await test('Enabled independent secondary output still rejects unexpected silence despite muted main trims',async()=>{await assert.rejects(()=>renderZero({secondary:{playing:true,c:100,b:2.5}}),e=>e.code==='silent-render');});
 await test('Explicitly muted pink and secondary outputs accept zero without masking audible branches',async()=>{const r=await renderZero({pink:true,pinkLevel:0,secondary:{playing:true,c:100,b:2.5},secondaryLevel:0});assert.equal(r.peak,0);});
 const report={suite:'r1121 frequency native handoff and silence guards',startedAt,finishedAt:new Date().toISOString(),testSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),fixtureSha256:crypto.createHash('sha256').update(fs.readFileSync(fixturePath)).digest('hex'),method:'Unmodified production runtimes in Node VM; existing media fixture uses one explicit path adaptation. Renderer receives controlled zero PCM. No browser, real audio rendering, physical device or acoustic acceptance.',candidateOverride:candidate,controller:{...controller,sha256:hash(controller.tested)},renderer:{...renderer,sha256:hash(renderer.tested)},passed:results.filter(x=>x.passed).length,total:results.length,results};
 report.failed=report.total-report.passed;report.allPassed=report.failed===0;
 const json=JSON.stringify(report,null,2)+'\n';if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,json);}
 console.log(json);if(!report.allPassed)process.exitCode=1;
})();
