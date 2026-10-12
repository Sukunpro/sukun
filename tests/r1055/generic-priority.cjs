'use strict';
// Actual priority wrapper, resolver, voice preferences, attempt authority and
// REC_DB with controlled transaction events. Generic bank/media are leaves.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const environment=require('./generic-priority-fixture.cjs'),results=[];
const PERSONAL=['esma:7:nida','esma:7:tev','esma:7'];
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
const silence=h=>{assert.equal(h.played.length,0);assert.equal(h.tts.length,0);assert.equal(h.genericCalls.length,0)};
async function test(name,run){try{await run();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack})}}
(async()=>{
 for(const key of PERSONAL)await test('personal '+key+' beats an enabled matching archive',async()=>{
  const h=environment(root),own=h.blob('personal-'+key),bank=h.blob('archive');h.disk.set(key,own);h.bank.set('esma:7:nida',bank);
  const r=await h.play();assert.equal(r.ok,true);assert.equal(r.key,key);assert.equal(h.played.length,1);assert.equal(h.played[0].blob,own);assert.equal(h.genericCalls.length,0);assert.equal(h.tts.length,0);assert.equal(h.disk.get(key),own);
 });
 await test('an indexed older personal form is considered before matching archive audio',async()=>{
  const h=environment(root),own=h.blob('older-form');h.disk.set('esma:7:older',own);h.test.setKeys(['esma:7:older']);h.bank.set('esma:7:nida',h.blob());
  const r=await h.play();assert.equal(r.key,'esma:7:older');assert.equal(h.played[0].blob,own);assert.equal(h.genericCalls.length,0);assert.equal(h.tts.length,0);
 });
 await test('Berhetiyye journey retains personal recording priority and native flags',async()=>{
  const h=environment(root),own=h.blob('berhet-personal');h.select('berhet',7);h.disk.set('berhet:7',own);h.bank.set('berhet:7',h.blob());
  const r=await h.c.SukunVoiceResolver.playItem('berhet',7,h.item(),{journey:true,backgroundNative:true});assert.equal(r.key,'berhet:7');assert.equal(h.played[0].blob,own);assert.equal(h.played[0].opt.backgroundNative,true);assert.equal(h.genericCalls.length,0);
 });
 await test('all same-name personal candidates are verified missing before archive playback',async()=>{
  const h=environment(root),bank=h.blob();h.bank.set('esma:7:nida',bank);const r=await h.play();
  assert.equal(r.ok,true);assert(r.key.startsWith('archive:'));assert.equal(h.played[0].blob,bank);assert.deepEqual(h.genericCalls[0].reads,PERSONAL);assert.deepEqual(h.genericCalls[0].keys,PERSONAL);assert.equal(h.disk.size,0);assert.equal(h.tts.length,0);
 });
 await test('archive playback through current-selection and AudioResolver wrappers retains canonical identity',async()=>{
  for(const route of ['current','audio']){
   const h=environment(root);h.bank.set('esma:7:nida',h.blob());const r=route==='current'?await h.current():await h.c.AudioResolver.play('esma',7,h.item());
   assert.equal(r.ok,true);assert.equal(h.played.length,1);assert(h.played[0].opt.recordingKey.startsWith('archive:'));assert.equal(h.played[0].opt.logicalRecordingKey,'esma:7:nida');assert.equal(h.tts.length,0);
  }
 });
 await test('missing archive continues through the actual selected Turkish TTS resolver',async()=>{
  const h=environment(root),r=await h.play();assert.equal(r.source,'tts');assert.equal(r.kind,'turkish');assert.equal(h.tts[0].lang,'tr-TR');assert.equal(h.tts[0].voice.name,'Synthetic Turkish');assert.equal(h.played.length,0);assert.deepEqual(h.genericCalls[0].reads,PERSONAL);
 });
 await test('disabled archive cannot play a clip even when every personal candidate is missing',async()=>{
  const h=environment(root);h.bank.set('esma:7:nida',h.blob());h.setGeneric(false);const r=await h.play();assert.equal(r.source,'tts');assert.equal(h.played.length,0);assert.equal(h.tts.length,1);assert.equal(h.disk.size,0);
 });
 for(const mode of ['arabic','turkish'])await test('explicit '+mode+' voice preference bypasses both recording banks',async()=>{
  const h=environment(root);h.disk.set('esma:7:nida',h.blob('personal'));h.bank.set('esma:7:nida',h.blob('archive'));assert.equal(await h.c.SukunVoiceSettings.setMode(mode),true);
  const r=await h.play();assert.equal(r.source,'tts');assert.equal(r.kind,mode);assert.equal(h.tts[0].lang,mode==='arabic'?'ar-SA':'tr-TR');assert.equal(h.reads.length,0);assert.equal(h.genericCalls.length,0);assert.equal(h.played.length,0);
 });
 await test('a pending personal read remains silent and a late personal result still has priority',async()=>{
  const h=environment(root),own=h.blob('personal');h.disk.set('esma:7:tev',own);h.bank.set('esma:7:nida',h.blob());const {work}=await h.pending();silence(h);
  await h.releaseOpen();assert.equal((await work).key,'esma:7:tev');assert.equal(h.played[0].blob,own);assert.equal(h.genericCalls.length,0);
 });
 await test('archive is reached only after a pending personal read confirms every candidate missing',async()=>{
  const h=environment(root);h.bank.set('esma:7:nida',h.blob());const {work}=await h.pending();silence(h);await h.releaseOpen();assert.equal((await work).ok,true);assert.deepEqual(h.genericCalls[0].reads,PERSONAL);
 });
 for(const fault of ['error','hang'])await test('personal storage '+fault+' blocks archive and TTS without rewriting bytes',async()=>{
  const h=environment(root),own=h.blob('kept');h.disk.set('esma:7:tev',own);h.bank.set('esma:7:nida',h.blob());h.faults.open=fault;
  const r=await h.play();assert.equal(r.ok,false);assert.equal(r.blocked,true);assert.equal(r.fallbackAllowed,false);silence(h);assert.equal(h.disk.get('esma:7:tev'),own);assert.equal(h.c.SukunRecordingFailure.snapshot().code,'recording-read-error');
 });
 await test('contradictory known personal key holds instead of treating catalog mismatch as absence',async()=>{
  const h=environment(root);h.test.setKeys(['esma:7:nida']);vm.runInContext("SK_RECORDING_CATALOG.error='RecordingCatalogMismatch'",h.c);h.bank.set('esma:7:nida',h.blob());
  const r=await h.play();assert.equal(r.blocked,true);silence(h);assert(h.test.keys().includes('esma:7:nida'));
 });
 await test('aborting a pending personal read cannot start archive or TTS after storage completes',async()=>{
  const h=environment(root),signal=new AbortController();h.bank.set('esma:7:nida',h.blob());h.faults.open='hold';const work=h.play({signal:signal.signal});await h.flush();silence(h);signal.abort();
  const r=await work;assert.equal(r.ok,false);await h.releaseOpen();silence(h);
 });
 for(const retired of ['selection','preference','intent','lease','parent'])await test(retired+' retirement fences late missing personal reads before fallback',async()=>{
  const h=environment(root);h.bank.set('esma:7:nida',h.blob());let current=true;h.faults.open='hold';const work=h.play({isCurrent:()=>current});await h.flush();silence(h);
  if(retired==='selection')h.select();if(retired==='preference')await h.c.SukunVoiceSettings.setMode('turkish');if(retired==='intent')h.intent();if(retired==='lease')h.lease();if(retired==='parent')current=false;
  await h.releaseOpen();const r=await work;assert.equal(r.ok,false);assert.equal(r.cancelled,true);silence(h);assert.equal(h.c.SukunRecordingFailure.snapshot().active,false);
 });
 await test('personal revision changed during a read cannot use a stale missing result for archive',async()=>{
  const h=environment(root);h.bank.set('esma:7:nida',h.blob());const {work}=await h.pending();const own=h.blob('new-personal'),writing=h.test.db.set('esma:7:nida',own);
  await h.releaseOpen();assert.equal((await work).blocked,true);await writing;silence(h);assert.equal(h.disk.get('esma:7:nida'),own);
 });
 await test('existing personal playback failure remains an own-recording hold',async()=>{
  const h=environment(root);h.disk.set('esma:7:nida',h.blob('personal'));h.bank.set('esma:7:nida',h.blob());h.playResult(()=>({ok:false,reason:'error'}));
  const r=await h.play();assert.equal(r.blocked,true);assert.equal(h.played.length,1);assert.equal(h.genericCalls.length,0);assert.equal(h.tts.length,0);
 });
 await test('personal source signature and playback guard do not depend on optional archive toggles',async()=>{
  const h=environment(root),late=deferred();h.disk.set('esma:7:nida',h.blob('personal'));h.test.setKeys(['esma:7:nida']);const before=h.signature();h.setGeneric(false);assert.equal(h.signature(),before);
  h.playResult(()=>late.promise);const work=h.play();for(let i=0;i<100&&!h.played.length;i++)await new Promise(resolve=>setTimeout(resolve,1));assert.equal(h.played.length,1);h.setGeneric(true);assert.equal(h.played[0].opt.isCurrent(),true);late.resolve({ok:true,reason:'ended'});assert.equal((await work).ok,true);assert.equal(h.genericCalls.length,0);
 });
 await test('an archive epoch change during playback rejects late completion',async()=>{
  const h=environment(root),late=deferred();h.bank.set('esma:7:nida',h.blob());h.playResult(()=>late.promise);const work=h.play();
  for(let i=0;i<100&&!h.played.length;i++)await new Promise(resolve=>setTimeout(resolve,1));assert.equal(h.played.length,1);h.bumpGeneric();assert.equal(h.played[0].opt.isCurrent(),false);late.resolve({ok:true,reason:'ended'});
  const r=await work;assert.equal(r.ok,false);assert.equal(r.cancelled,true);assert.equal(h.tts.length,0);assert.equal(h.c.SukunRecordingFailure.snapshot().active,false);
 });
 await test('archive availability and epoch invalidate actual missing/prepared source matches',async()=>{
  const h=environment(root),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('let _r1007SingleFallback=null,'),end=html.indexOf('function r1007RecordingStatus(',start);assert(start>=0&&end>start);
  vm.runInContext("const r476CanonicalItem=()=>zItem();const r477FxSignature=()=> 'fx';let _r476Prepared={};"+html.slice(start,end),h.c);
  const seed=()=>vm.runInContext("_r1010MissingRecording={key:zikirKey(),signature:r1010RecordingLookupSignature(),voiceEpoch:SukunVoiceSettings.epoch(),ownerEpoch:SukunTabOwner.snapshot().epoch,ownerIntent:SukunTabOwner.snapshot().intent};_r476Prepared={key:zikirKey(),voiceEpoch:SukunVoiceSettings.epoch(),fxSig:'fx',lookupSignature:r1010RecordingLookupSignature(),recordingKey:'',recordingRevision:0};",h.c);
  h.setGeneric(false);seed();assert.equal(h.c.r1010MissingRecordingMatches(),true);assert.equal(h.c.r1010PreparedRecordingMatches(),true);
  const before=h.signature();h.setGeneric(true);assert.notEqual(h.signature(),before);assert.equal(h.c.r1010MissingRecordingMatches(),false);assert.equal(h.c.r1010PreparedRecordingMatches(),false);
  seed();h.bumpGeneric();assert.equal(h.c.r1010MissingRecordingMatches(),false);assert.equal(h.c.r1010PreparedRecordingMatches(),false);
 });
 await test('explicit empty noncanonical terkip recording slot never probes either recording bank',async()=>{
  const h=environment(root);h.bank.set('esma:7:nida',h.blob());h.disk.set('esma:7:nida',h.blob('personal'));
  const r=await h.play({key:'',terkipPart:true,canonicalPart:false,text:'Synthetic noncanonical invocation'});assert.equal(r.source,'tts');assert.equal(h.reads.length,0);assert.equal(h.genericCalls.length,0);assert.equal(h.played.length,0);
 });
 const report={suite:'r1055 generic recording priority',root,method:'Actual REC_DB transaction/read model, priority lock, resolver, settings, source-match guards and attempt authority with synthetic separate-bank and media/TTS leaves. No browser playback or physical Android claim.',passed:results.filter(row=>row.passed).length,total:results.length,results};
 console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
