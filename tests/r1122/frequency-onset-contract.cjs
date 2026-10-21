const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const crypto=require('crypto'),startedAt=new Date().toISOString();
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),output=process.argv[3]?path.resolve(process.argv[3]):null;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),runtime=html.match(/src="\.\/(assets\/runtime\/background-mix-r\d+\.js)\?/)?.[1];assert(runtime);
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
let src=fs.readFileSync(path.join(root,'tests/r1059/background-mix.cjs'),'utf8');src=src.slice(0,src.indexOf('(async()=>{')).replace("'assets/runtime/background-mix-r1059.js'",JSON.stringify(runtime))+'\nglobalThis.fixture=fixture;';
const c={require,__dirname:path.join(root,'tests/r1059'),process:{argv:['node','fixture',root]},console,Blob,ArrayBuffer,DataView,Uint8Array,URL,AbortController,queueMicrotask};vm.createContext(c);vm.runInContext(src,c);
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.message});}}
const audible=a=>!a.paused&&!a.muted&&a.volume>0&&a.dataset.sukSilentCarrier==='0';
async function setup(){const f=c.fixture('bin');f.controller.changed('test',{gesture:true});await f.flush();return f;}
(async()=>{
await test('Fresh native playing event cannot overlap live frequency',async()=>{const f=await setup(),a=f.media[0],observations=[];a.addEventListener('playing',()=>{if(a.dataset.sukSilentCarrier==='0')observations.push(audible(a)&&!f.liveMuted);});await f.controller.prepare();assert(observations.length);assert(!observations.some(Boolean));assert(f.liveMuted&&audible(a));});
await test('Pending play confirmation remains single-route even after sync',async()=>{const f=await setup(),a=f.media[0];let release;a.play=()=>{a.paused=false;a.dispatchEvent({type:'playing',target:a});return new Promise(r=>release=r);};const work=f.controller.prepare();await f.flush();assert(release);f.controller.sync();assert(!(audible(a)&&!f.liveMuted));release();await work;assert(f.liveMuted&&audible(a));});
await test('Native browser pause then explicit resume has no overlap',async()=>{const f=await setup(),a=f.media[0];await f.controller.prepare();a._sukunBackgroundPauseIntent=null;a.pause();assert(!f.liveMuted);const observations=[];a.addEventListener('playing',()=>observations.push(audible(a)&&!f.liveMuted));await f.controller.resume('test');assert(!observations.some(Boolean));assert(f.liveMuted&&audible(a));});
await test('Rejected native admission preserves current live route',async()=>{const f=await setup(),a=f.media[0];a.mode='reject';await f.controller.prepare();assert(!f.liveMuted);assert(!audible(a));});
await test('Stop during pending native admission cannot revive sound',async()=>{const f=await setup(),a=f.media[0];a.mode='pending';const work=f.controller.prepare();await f.flush();f.held=true;f.controller.changed('stop',{immediate:true});a.resolvePlay();await work;assert(!audible(a));});
await test('Master mute remains mute after handoff',async()=>{const f=await setup(),a=f.media[0];f.volume=0;await f.controller.prepare();assert.equal(a.volume,0);assert(!audible(a));});
for(const operation of ['resume','prepare','changed','sync'])await test('Pending resume remains audible live through concurrent '+operation,async()=>{
 const f=await setup(),a=f.media[0];await f.controller.prepare();await f.settle();a._sukunBackgroundPauseIntent=null;a.pause();
 let release;a.play=()=>{a.paused=false;a.dispatchEvent({type:'playing',target:a});return new Promise(r=>release=r)};
 const work=f.controller.resume('first');await f.flush();assert(release);assert(a.muted&&!f.liveMuted);
 let other;
 if(operation==='resume')other=f.controller.resume('second');
 if(operation==='prepare')other=f.controller.prepare();
 if(operation==='changed')f.controller.changed('same-key');
 if(operation==='sync')f.controller.sync();
 await f.flush();assert(a.muted&&!f.liveMuted,'Live route must remain until native admission completes');
 release();await work;if(other)await other;assert(!a.muted&&f.liveMuted);
});


const {fixture:engineFixture}=require(path.join(root,'tests/r1121/frequency-engine-fixture.cjs'));
await test('Spatial panner starts at orbit radius before audio can sound',async()=>{const f=engineFixture(root),c=f.context;let pan;const create=c.ctx.createPanner;c.ctx.createPanner=()=>pan=create();c.FR.uzam=true;c.frStart();assert.equal(pan.positionX.value,0);assert.equal(pan.positionY.value,0);assert.equal(pan.positionZ.value,1.6);const gainBefore=1/(1+.5*(Math.hypot(pan.positionX.value,pan.positionY.value,pan.positionZ.value)-1));f.advance(80);const gainAfter=1/(1+.5*(Math.hypot(pan.positionX.value,pan.positionY.value,pan.positionZ.value)-1));assert(Math.abs(20*Math.log10(gainAfter/gainBefore))<.01,'No startup distance attenuation step');c.frStop();c.frStart();assert.equal(pan.positionZ.value,1.6);});
await test('Spatial legacy position fallback initializes before first scheduled turn',async()=>{const f=engineFixture(root),c=f.context;let position;const create=c.ctx.createPanner;c.ctx.createPanner=()=>{const p=create();delete p.positionX;delete p.positionY;delete p.positionZ;p.setPosition=(...args)=>position=args;return p};c.FR.uzam=true;c.frStart();assert.deepEqual(position,[0,0,1.6]);});
await test('Spatial-disabled start does not create a panner',async()=>{const f=engineFixture(root),c=f.context;c.FR.uzam=false;let calls=0;const create=c.ctx.createPanner;c.ctx.createPanner=()=>{calls++;return create()};c.frStart();assert.equal(calls,0);assert(c.FR.playing);assert(c.FR.out.gain.value<=c.frOutputLevel());});

const report={suite:'r1122 frequency onset source contracts',build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),startedAt,finishedAt:new Date().toISOString(),testSha256:hash(fs.readFileSync(__filename)),sourceHashes:{index:hash(html),controller:hash(fs.readFileSync(path.join(root,runtime)))},scope:'Controlled source-level ownership tests, not acoustic/physical-device evidence',results,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length};report.total=results.length;report.allPassed=report.failed===0;if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify(report,null,2));process.exitCode=report.failed?1:0;})();
