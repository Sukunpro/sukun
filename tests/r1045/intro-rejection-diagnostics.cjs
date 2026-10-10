'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),base=path.resolve(process.argv[3]||root);
const plain=x=>JSON.parse(JSON.stringify(x));
function integration(target){
 const file=path.join(root,'tests/r1039/silent-anchor-init.cjs'),source=fs.readFileSync(file,'utf8').split('(async () => {')[0],m={exports:{}};
 vm.runInNewContext(source+'\nmodule.exports={setup,boot,playing,finish,stoppedForMedia,anchorLiteral};',{require:createRequire(file),module:m,__dirname:path.dirname(file),process:{argv:['node',file,target]},console,Blob,ArrayBuffer,DataView,queueMicrotask});return m.exports;
}
function health(){
 const file=path.join(root,'tests/r1017/health_inspection_contract.cjs'),source=fs.readFileSync(file,'utf8').split('// Explicit sibling dependency;')[0],m={exports:{}};
 vm.runInNewContext(source+'\nmodule.exports={harness};',{require:createRequire(file),process:{argv:['node',file,root]},__dirname:path.dirname(file),module:m,console,Blob,AbortController,DOMException,TextEncoder,TextDecoder,URL});return m.exports.harness();
}
const tests=[];async function test(name,fn){try{await fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.stack});}}
async function prepared(target=root){const h=integration(target),f=h.setup();await h.boot(f);await f.advance(900);f.window.SUKUN.ctx();await f.flush();h.playing(f);return {h,f,a:f.media[0]};}
async function reject(p){await p.f.advance(25);p.h.stoppedForMedia(p.f);return JSON.parse(p.f.root.dataset.audioRejectedMedia);}
function passive(h){for(const key of ['storageRead','storageWrite','dbOpen','dbList','dbDelete','network','collect','inspect','prepare','ai','legacyAudio','timer','interval','raf','dom','scan','create'])assert.equal(h.actions[key]||0,0,key);}
(async()=>{
 await test('Existing predicates and approved WAV/visual bootstrap are byte-identical',()=>{
  const old=fs.readFileSync(path.join(base,'index.html'),'utf8'),next=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const [start,end] of [['  function isSilentCarrier(element){','  // Passive diagnosis only'],['function r1038IsSilentCarrier(element){','function inspectSilentCarriers(element){']]){
   const current=next.slice(next.indexOf(start),next.indexOf(end,next.indexOf(start))).trim();assert(old.includes(current));
  }
  assert.equal(next.match(/<script id="sukun-auto-intro-clock">([\s\S]*?)<\/script>/)[1],old.match(/<script id="sukun-auto-intro-clock">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(fs.readFileSync(path.join(root,'assets/audio/sukun-intro-signature-r1037.wav')),fs.readFileSync(path.join(base,'assets/audio/sukun-intro-signature-r1037.wav')));
 });
 await test('Known owned anchor inspector returns bounded exact source states',async()=>{const {f,a}=await prepared();const value=plain(f.window.SukunSilentCarrierIdentity.inspect(a));assert.equal(value.anchor.identity,'match');assert.equal(value.lock.identity,'mismatch');assert.equal(value.anchor.flag,'match');assert.equal(value.anchor.requestedSource,'match');assert.equal(value.anchor.currentSource,'match');assert.equal(value.anchor.srcObject,'null');assert.equal(value.anchor.srcObjectPresent,true);assert(!JSON.stringify(value).includes('data:'));assert(!JSON.stringify(value).includes('blob:'));});
 const cases=[
  ['currentSrc empty',a=>{a.currentSrc='';},'currentSource','empty'],
  ['requested source changed',a=>{a.src='PRIVATE_SOURCE';},'requestedSource','mismatch'],
  ['current source changed',a=>{a.currentSrc='PRIVATE_SOURCE';},'currentSource','mismatch'],
  ['flag missing',a=>{delete a.dataset.sukSilentAnchor;},'flag','missing'],
  ['flag changed',a=>{a.dataset.sukSilentAnchor='PRIVATE_SOURCE';},'flag','mismatch'],
  ['srcObject null versus undefined',a=>{a.srcObject=undefined;},'srcObject','undefined'],
  ['srcObject property missing',a=>{delete a.srcObject;},'srcObjectPresent',false],
  ['actual recording stream',a=>{a.srcObject={private:'PRIVATE_SOURCE'};},'srcObject','non-null'],
  ['throwing currentSrc getter',a=>{Object.defineProperty(a,'currentSrc',{get(){throw Error('PRIVATE_SOURCE')}});},'currentSource','unavailable'],
  ['throwing srcObject getter',a=>{Object.defineProperty(a,'srcObject',{get(){throw Error('PRIVATE_SOURCE')}});},'srcObject','unavailable']
 ];
 for(const [name,mutate,key,expected] of cases)await test('Rejected decision preserved with diagnosis: '+name,async()=>{
  const p=await prepared();mutate(p.a);const value=await reject(p);assert.equal(value.guardResult,'rejected');assert.equal(value.samplePhase,'after-rejection');assert.equal(value.anchor[key],expected);assert.equal(value.anchor.identity,'match');assert(!JSON.stringify(value).includes('PRIVATE_SOURCE'));assert(!JSON.stringify(value).includes('data:'));assert(!JSON.stringify(value).includes('blob:'));
  const baseline=await prepared(base);mutate(baseline.a);await baseline.f.advance(25);baseline.h.stoppedForMedia(baseline.f);assert.equal(p.f.root.dataset.audioOutcome,baseline.f.root.dataset.audioOutcome);assert.equal(p.f.root.dataset.audioPlaybackElapsedMs,baseline.f.root.dataset.audioPlaybackElapsedMs);assert.equal(p.f.contexts.length,baseline.f.contexts.length);
 });
 await test('srcObject present but undefined is distinguished from absent',async()=>{const p=await prepared();p.a.srcObject=undefined;const value=await reject(p);assert.equal(value.anchor.srcObjectPresent,true);assert.equal(value.anchor.srcObject,'undefined');});
 for(const [value,expected] of [[0,'nothing'],[1,'metadata'],[2,'current'],[3,'future'],[4,'enough'],[5,'unavailable'],['PRIVATE_SOURCE','unavailable']])await test('readyState projection '+String(value),async()=>{const p=await prepared();p.a.currentSrc='';p.a.readyState=value;const out=await reject(p);assert.equal(out.readyState,expected);});
 for(const [value,expected] of [[0,'empty'],[1,'idle'],[2,'loading'],[3,'no-source'],[4,'unavailable']])await test('networkState projection '+value,async()=>{const p=await prepared();p.a.currentSrc='';p.a.networkState=value;const out=await reject(p);assert.equal(out.networkState,expected);});
 for(const [kind,api,expect] of [['missing',{isSilent:()=>false},'missing'],['throws',{isSilent:()=>false,inspect(){throw Error('PRIVATE_SOURCE')}},'throws'],['invalid',{isSilent:()=>false,inspect(){return 'PRIVATE_SOURCE'}},'invalid']])await test('Inspector '+kind+' cannot alter stop or leak',async()=>{const p=await prepared();p.f.window.SukunSilentCarrierIdentity=api;const out=await reject(p);assert.equal(out.inspectApi,expect);assert(!JSON.stringify(out).includes('PRIVATE_SOURCE'));});
 await test('Foreign media clone cannot acquire ownership through diagnostic flag',async()=>{const p=await prepared(),clone={...p.a,dataset:{...p.a.dataset}};p.f.media.push(clone);const out=await reject(p);assert.equal(out.anchor.identity,'mismatch');assert.equal(out.lock.identity,'mismatch');});
 await test('Inspector values are whitelisted before DOM snapshot',async()=>{const p=await prepared();p.f.window.SukunSilentCarrierIdentity={isSilent:()=>false,inspect(){return {anchorInspectApi:'PRIVATE_SOURCE',lock:{identity:'PRIVATE_SOURCE'},anchor:{srcObject:'PRIVATE_SOURCE',private:'PRIVATE_SOURCE'}};}};const out=await reject(p);assert.equal(out.anchorInspectApi,'invalid');assert.equal(out.lock.identity,'unavailable');assert(!JSON.stringify(out).includes('PRIVATE_SOURCE'));});
 await test('Each inspector property read once; source throw preserves other reads',async()=>{const {f,a}=await prepared();let calls=0;Object.defineProperty(a,'currentSrc',{get(){calls++;throw Error('PRIVATE_SOURCE')}});const out=f.window.SesCapa.inspectSilentCarrier(a);assert.equal(calls,1);assert.equal(out.currentSource,'unavailable');assert.equal(out.srcObject,'null');assert.equal(out.identity,'match');});
 await test('Diagnostic dataset write failure cannot prevent cancellation or cleanup',async()=>{const p=await prepared();Object.defineProperty(p.f.root.dataset,'audioRejectedMedia',{get(){return undefined;},set(){throw Error('write rejected')}});p.a.currentSrc='';await p.f.advance(25);p.h.stoppedForMedia(p.f);await p.h.finish(p.f);});
 await test('Rejected snapshot is captured once and is not a later live projection',async()=>{const p=await prepared();p.a.currentSrc='';const out=await reject(p),saved=p.f.root.dataset.audioRejectedMedia;p.a.currentSrc=p.a.src;await p.f.advance(300);assert.equal(p.f.root.dataset.audioRejectedMedia,saved);assert.equal(out.anchor.currentSource,'empty');});
 await test('Health copies rejection evidence without re-inspecting live carrier or DOM',async()=>{const p=await prepared();p.a.currentSrc='';await reject(p);const h=health();h.c.SukunIntroAudioDiagnostics=p.f.window.SukunIntroAudioDiagnostics;h.c.SukunSilentCarrierIdentity={inspect(){throw Error('must not call')}};const result=h.api.read().current.introAudio;assert.equal(result.rejectedMedia.anchor.currentSource,'empty');assert.equal(result.audibleSound,'NOT_MEASURED');passive(h);});
 await test('Health rejects extra values, URL strings, wrong data types and malformed JSON',()=>{for(const raw of ['PRIVATE_SOURCE','[]','null',JSON.stringify({guardResult:'rejected',samplePhase:'after-rejection',inspectApi:'PRIVATE_SOURCE',anchorInspectApi:'PRIVATE_SOURCE',readyState:'PRIVATE_SOURCE',paused:'PRIVATE_SOURCE',lock:{srcObject:'PRIVATE_SOURCE',private:'PRIVATE_SOURCE'}}),'x'.repeat(2049)]){const h=health();h.c.SukunIntroAudioDiagnostics={snapshot:()=>({audioOutcome:'unsafe-audio',audioRejectedMedia:raw})};const out=h.api.read().current.introAudio;assert.equal(out.outcome,'unsafe-audio');assert(!JSON.stringify(out).includes('PRIVATE_SOURCE'));passive(h);}});
 await test('Health samples diagnostic raw getter exactly once and does not disclose values',()=>{const h=health();let count=0;const raw={audioOutcome:'unsafe-audio'};Object.defineProperty(raw,'audioRejectedMedia',{get(){count++;return '{}'}});h.c.SukunIntroAudioDiagnostics={snapshot:()=>raw};h.api.read();assert.equal(count,1);passive(h);});
 await test('Healthy path does not call inspector or add rejected evidence',async()=>{const p=await prepared();p.f.window.SukunSilentCarrierIdentity={isSilent:()=>true,inspect(){throw Error('must not call')}};await p.f.advance(100);p.h.playing(p.f);assert.equal(p.f.root.dataset.audioRejectedMedia,undefined);});

 await test('Explicit Health JSON export contains only saved bounded rejection evidence',async()=>{
  const p=await prepared();p.a.currentSrc='';await reject(p);const h=health();h.c.SukunIntroAudioDiagnostics=p.f.window.SukunIntroAudioDiagnostics;
  h.c.SukunSilentCarrierIdentity={inspect(){throw Error('must not call')}};
  const prior=JSON.stringify([...h.store]),jobs=p.f.jobs.size,reads=p.f.reads.length;
  await h.api.exportReport();assert.equal(h.downloads.length,1);assert.equal(h.blobs.length,1);
  const exported=JSON.parse(await h.blobs[0].text());assert.equal(exported.current.introAudio.rejectedMedia.anchor.currentSource,'empty');
  assert.equal(exported.current.introAudio.audibleSound,'NOT_MEASURED');
  assert.equal(exported.checks.find(x=>x.code==='INTRO_AUDIO').evidence.rejectedMedia.samplePhase,'after-rejection');
  assert.equal(JSON.stringify([...h.store]),prior);assert.equal(p.f.jobs.size,jobs);assert.equal(p.f.reads.length,reads);
  for(const key of ['storageRead','storageWrite','dbOpen','dbList','dbDelete','network','collect','inspect','prepare','ai','legacyAudio','scan'])assert.equal(h.actions[key]||0,0,key);
 });
 await test('Health presenter and AI payload cannot create or transmit live rejection data',async()=>{
  const p=await prepared();p.a.currentSrc='';await reject(p);const h=health();h.c.SukunIntroAudioDiagnostics=p.f.window.SukunIntroAudioDiagnostics;
  const r=h.api.read(),without={...r,checks:r.checks.filter(x=>x.code!=='INTRO_AUDIO')};
  assert.deepEqual(plain(h.view.aiPayload(r)),plain(h.view.aiPayload(without)));assert(!JSON.stringify(h.view.aiPayload(r)).includes('rejectedMedia'));
  h.view.summarize(r);h.view.plainReport(r);h.view.reportKey(r);passive(h);
 });
 await test('After-rejection sample may match again and never rewrites the rejected result',async()=>{
  const p=await prepared();let count=0;Object.defineProperty(p.a,'currentSrc',{get(){return ++count===1?'':p.a.src;}});
  const r=await reject(p);assert.equal(r.guardResult,'rejected');assert.equal(r.samplePhase,'after-rejection');assert.equal(r.anchor.currentSource,'match');
  assert.equal(p.f.root.dataset.audioOutcome,'unsafe-audio');assert.equal(p.f.root.dataset.audioCompleted,undefined);
 });
 for(const missing of [true,false])await test('Missing or throwing anchor inspector remains observational '+missing,async()=>{
  const p=await prepared();p.a.currentSrc='';if(missing)delete p.f.window.SesCapa.inspectSilentCarrier;else p.f.window.SesCapa.inspectSilentCarrier=()=>{throw Error('PRIVATE_SOURCE')};
  const r=await reject(p);assert.equal(r.inspectApi,'present');assert.equal(r.anchorInspectApi,missing?'missing':'throws');assert.equal(r.anchor,null);assert(!JSON.stringify(r).includes('PRIVATE_SOURCE'));
 });
 await test('Actual ac initialization with unselected currentSrc can reject; fixture hypothesis only',async()=>{
  for(const target of [base,root]){
   const h=integration(target),f=h.setup();
   f.window.HTMLMediaElement.prototype.play=function(){this.paused=false;this.ended=false;return Promise.resolve();};
   await h.boot(f);await f.advance(900);h.playing(f);f.window.SUKUN.ctx();await f.flush();assert.equal(f.media[0].currentSrc,'');
   await f.advance(25);h.stoppedForMedia(f);if(target===root){const r=JSON.parse(f.root.dataset.audioRejectedMedia);assert.equal(r.anchor.identity,'match');assert.equal(r.anchor.currentSource,'empty');}
   await h.finish(f);
  }
 });
 console.log(JSON.stringify({passed:tests.filter(x=>x.passed).length,total:tests.length,tests},null,2));if(tests.some(x=>!x.passed))process.exitCode=1;
})();
