'use strict';
// Complete app, real release marker and native SHA-256/network. Disposable
// Classic/Feyz profile; no sound or physical-device result is inferred.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(root,'../qa-r1092/health/native.json'));
const sourceSha256=hash(fs.readFileSync(path.join(root,'nero.html')));
const report={suite:'r1092 complete-app health inventory admission',sourceSha256,testSha256:hash(fs.readFileSync(__filename)),checks:[],limitations:[
 'Disposable native Chromium at390×844, Classic/Feyz, exact production application and runtime marker. The real production health collector hashes every declared runtime file using native fetch, response streams and SHA-256.',
 'Chromium can report ERR_ABORTED for a collector fetch after every byte has passed the production SHA-256 check. Such observations are accepted only with a unique exact runtime URL, HTTP200, native response completion timing and matching production/local/served byte receipts; unrelated or incomplete request failures remain failures.',
 'Service workers are blocked. No user profile, microphone, audio recording, perceptual sound, screen lock, Bluetooth or physical Android behavior is tested. Playback stays idle; this test measures preservation of that state, not audible playback.'
]};
let f,p,before,observation,after,collectorStartedAt,collectorCompletedAt;const requests=new Map(),failures=[];
function save(){report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.allPassed=report.total>0&&report.total===report.passed;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));}
async function check(name,work){try{report.checks.push({name,passed:true,evidence:await work()});}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error)});}save();console.log(JSON.stringify({name,passed:report.checks.at(-1).passed}));}
async function playback(){return p.evaluate(()=>{
 const s=SukunSessionState.snapshot(),z=typeof Z==='object'?Z:null,smart=window.R170?.Player,lock=window.SukunLockAudio?.snapshot?.();
 return {session:{id:s.sessionId,requestId:s.requestId,phase:s.phase,mode:s.activeMode,index:s.activeIndex,kind:s.journeyKind,count:s.count,target:s.target,sourceOrigin:s.sourceOrigin},selected:{cat:z?.cat,index:z?.idx,count:z?.count,target:z?.target,total:z?.total},smart:{playing:!!smart?.playing,paused:!!smart?.paused,index:smart?.i,token:smart?.token},lock:{playing:!!lock?.playing},speech:__r1064SpeechFixture.log.length};
});}
(async()=>{try{
 if(process.env.SUKUN_QA_SOURCE_SHA256)assert.equal(sourceSha256,process.env.SUKUN_QA_SOURCE_SHA256,'Unexpected source before health test');
 f=await fixture(root,{width:390,height:844});p=f.page;await p.waitForFunction(()=>!!window.SukunHealthR940&&!!window.SukunShellSkin);
 await check('Final Classic/Feyz release exposes its actual98-member runtime inventory',async()=>{
  const identity=await p.evaluate(async()=>{const response=await fetch('./sukun-build-'+SUKUN_BUILD+'.json',{cache:'no-store'});return {build:SUKUN_BUILD,layout:SukunLayoutModes.current(),skin:SukunShellSkin.getAppearance(),marker:await response.json()};});
  assert.equal(identity.build,'r1092');assert.equal(identity.marker.build,identity.build);assert.equal(identity.layout,'classic');assert.equal(identity.skin,'feyz');assert.equal(identity.marker.runtime.length,98);assert.equal(new Set(identity.marker.runtime.map(x=>x.url)).size,98);
  const expected=JSON.parse(fs.readFileSync(path.join(root,'sukun-build-r1092.json'),'utf8'));assert.deepEqual(identity.marker,expected);
  return {build:identity.build,layout:identity.layout,skin:identity.skin,runtimeEntries:identity.marker.runtime.length,markerSha256:hash(fs.readFileSync(path.join(root,'sukun-build-r1092.json')))};
 });
 report.startupFailureObservations=f.evidence().failedRequests.slice();
 p.on('request',request=>requests.set(request,{url:request.url(),method:request.method(),resourceType:request.resourceType(),startedAt:Date.now()}));
 p.on('response',response=>{const row=requests.get(response.request());if(row)row.response={status:response.status()};});
 p.on('requestfailed',request=>{const row=requests.get(request);failures.push({...(row||{url:request.url(),unobservedRequest:true}),error:request.failure()?.errorText,failedAt:Date.now(),timing:request.timing()});});
 before=await playback();collectorStartedAt=Date.now();
 observation=await p.evaluate(async()=>{const report=await SukunHealthR940.run({deep:true,online:false});return {build:report.build,lastRun:report.lastRun,check:report.checks.find(x=>x.code==='RUNTIME_INTEGRITY')};});
 collectorCompletedAt=Date.now();after=await playback();await p.waitForTimeout(250);
 await check('Explicit production health check verifies all98 exact runtime hashes within unchanged byte budgets',async()=>{
  const r=observation.check;assert(r,'Missing actual production integrity result');assert.equal(r.status,'PASS');assert.equal(r.evidence.expected,98);assert.equal(r.evidence.files.length,98);assert.equal(r.evidence.matched,98);assert.equal(r.evidence.mismatched,0);assert.equal(r.evidence.configurationErrors,0);assert.equal(r.evidence.unverified,0);assert.equal(r.evidence.complete,true);assert(r.evidence.files.every(x=>x.status==='MATCH'));
  assert(r.evidence.bytes>0&&r.evidence.bytes<=9437184);assert(r.evidence.mediaBytes>0&&r.evidence.mediaBytes<=33554432);assert.equal(r.evidence.verifiedBytes,r.evidence.bytes+r.evidence.mediaBytes);
  const marker=JSON.parse(fs.readFileSync(path.join(root,'sukun-build-r1092.json'),'utf8'));const exactBytes=marker.runtime.reduce((total,e)=>total+fs.readFileSync(path.join(root,new URL(e.url,'https://fixture.invalid/').pathname.slice(1))).length,0);assert.equal(r.evidence.verifiedBytes,exactBytes);
  return {status:r.status,evidence:r.evidence,lastRun:observation.lastRun};
 });
 await check('Deep collection preserves idle playback identity, selection, counters and transport ownership',async()=>{assert.equal(before.session.phase,'IDLE');assert.equal(before.lock.playing,false);assert.equal(before.smart.playing,false);assert.deepEqual(after,before);return {before,after};});
 await check('Health run serves exact production bytes with no unexpected request, JavaScript or SRI faults',async()=>{
  const evidence=f.evidence();assert.deepEqual(evidence.pageErrors,[]);assert(!evidence.consoleErrors.some(x=>/integrity|digest|SyntaxError|ReferenceError|TypeError/i.test(x)),evidence.consoleErrors.join('\n'));
  for(const [name,row]of Object.entries(evidence.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))),'Unfrozen served bytes:'+name);
  assert.equal(evidence.served['nero.html']?.sha256,sourceSha256);assert.equal(hash(fs.readFileSync(path.join(root,'nero.html'))),sourceSha256);
  const marker=JSON.parse(fs.readFileSync(path.join(root,'sukun-build-r1092.json'),'utf8'));
  const declared=new Map(marker.runtime.map(entry=>[new URL(entry.url,f.origin+'/nero.html').href,entry]));
  const receipts=new Map(observation.check.evidence.files.map(entry=>[entry.path,entry]));
  const completedButCancelled=[],unexpected=[];
  for(const failure of failures){
   const entry=declared.get(failure.url),url=new URL(failure.url),name=url.pathname.slice(1),receipt=receipts.get(url.pathname),served=evidence.served[name];
   const sameURLRequests=[...requests.values()].filter(row=>row.url===failure.url);
   const data=entry?fs.readFileSync(path.join(root,name)):null;
   const verified=failure.error==='net::ERR_ABORTED'&&!failure.unobservedRequest&&failure.method==='GET'&&failure.resourceType==='fetch'&&failure.startedAt>=collectorStartedAt&&failure.failedAt<=collectorCompletedAt+250&&failure.response?.status===200&&sameURLRequests.length===1&&url.origin===f.origin&&entry&&receipt?.status==='MATCH'&&receipt.expected===entry.sha256&&receipt.actual===entry.sha256&&hash(data)===entry.sha256&&served?.sha256===entry.sha256&&served.bytes===data.length&&failure.timing.responseStart>=0&&failure.timing.responseEnd>=failure.timing.responseStart;
   if(verified)completedButCancelled.push({...failure,bytes:data.length,expectedSha256:entry.sha256,collectorActualSha256:receipt.actual,servedSha256:served.sha256});else unexpected.push(failure);
  }
  assert.equal(evidence.failedRequests.length,report.startupFailureObservations.length+failures.length,'Unobserved request failure');
  assert.deepEqual(unexpected,[],'A request failure lacks complete exact-byte correlation');
  report.completedButCancelled=completedButCancelled;report.unexpectedRequestFailures=unexpected;
  report.fixture=evidence;report.browser=f.browser.version();return {files:Object.keys(evidence.served).length,pageErrors:evidence.pageErrors,startupFailureObservations:report.startupFailureObservations,completedButCancelled,unexpectedRequestFailures:unexpected,hashes:{'nero.html':sourceSha256,'index.html':hash(fs.readFileSync(path.join(root,'index.html')))}};
 });
}catch(error){report.fatal=error.stack||String(error);}finally{if(f)await f.close();save();console.log(JSON.stringify({passed:report.passed,total:report.total,output,fatal:report.fatal},null,2));if(!report.allPassed||report.fatal)process.exitCode=1;}})();
