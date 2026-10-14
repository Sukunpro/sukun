'use strict';

const assert=require('assert/strict'),crypto=require('crypto'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const qa=path.resolve(process.argv[3]||path.join(root,'qa-r1067'));
const runtimePath=path.join(root,'assets/runtime/yasin-timing-r1067.js');
const source=fs.readFileSync(runtimePath,'utf8');
const documentedBytes=fs.readFileSync(path.join(root,'docs/yasin-timing-r1067.json'));
const documented=JSON.parse(documentedBytes.toString('utf8'));
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/yasin-cues-r1067.expected.json'),'utf8'));
const sourceRows=JSON.parse(fs.readFileSync(path.join(root,'docs/arabic-audio-manifest-r1065.json'),'utf8'));
const arabicSource=sourceRows.find(row=>row.key==='yasin');
const metadata={sha256:documented.sourceSha256,bytes:documented.sourceBytes};
const duration=documented.durationSeconds,checks=[];
let wallTime=0;
const context={Date:class extends Date{static now(){return wallTime;}},performance:{now:()=>wallTime},setTimeout(){throw Error('Unexpected wall-clock timer');},setInterval(){throw Error('Unexpected wall-clock timer');}};
context.window=context;vm.createContext(context);vm.runInContext(source,context,{filename:runtimePath});
const api=context.SukunYasinTimingR1067;
const plain=value=>JSON.parse(JSON.stringify(value));
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const cues=documented.cues;
function test(name,work){try{work();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.stack});}}
function expected(time){if(time<cues[0].start)return 0;let verse=0;for(const cue of cues){if(cue.start>time)break;verse=cue.verse;}return verse;}
function compare(time,durationOverride=duration){const actual=api.at(metadata,time,durationOverride);assert(actual,`Missing cue at ${time}`);assert.equal(actual.verse,expected(time),`Wrong floor cue at ${time}`);return actual;}

test('Actual original MP3 hash and byte length agree with acquisition metadata, documented cues and compiled runtime',()=>{
 const bytes=fs.readFileSync(path.join(root,'assets/audio/arabic-r1065/yasin.mp3'));
 assert.equal(digest(bytes),'4096f23ddba18fb4b410e54459cac520d91de178c5b5d2a78232e57723fb6a3d');
 assert.equal(bytes.length,21195286);
 for(const row of [documented,original,api.snapshot()]){assert.equal(row.sourceSha256,digest(bytes));assert.equal(row.sourceBytes,bytes.length);}
 assert.equal(arabicSource.sha256,digest(bytes));assert.equal(arabicSource.bytes,bytes.length);
});
test('Canonical 83-verse source is unchanged and bound by its actual source hash',()=>{
 const canonicalPath=path.join(root,'assets/runtime/yasin-data-r1064.js'),canonicalBytes=fs.readFileSync(canonicalPath);
 const canonicalContext={};canonicalContext.window=canonicalContext;vm.createContext(canonicalContext);vm.runInContext(canonicalBytes.toString('utf8'),canonicalContext);
 const data=canonicalContext.SukunYasinDataR1064;
 assert.equal(data.verseCount,83);assert.equal(data.verses.length,83);
 assert.deepEqual(Array.from(data.verses,v=>v.number),Array.from({length:83},(_,i)=>i+1));
 for(const row of [documented,original,api.snapshot()])assert.equal(row.review.canonicalSourceSha256,digest(canonicalBytes));
 assert.equal(documented.review.canonicalTextModified,false);
});
test('Production map preserves all 83 measured start/end boundaries exactly',()=>{
 assert.equal(api.version,'r1067');assert.equal(api.available,true);
 assert.equal(digest(documentedBytes),original.originalDocumentSha256,'Full provenance document changed from the pinned acoustic extraction');
 assert.deepEqual(cues,original.cues);
 const track=api.snapshot();assert.equal(track.chapter,36);assert.equal(track.verseCount,83);
 assert.deepEqual(plain(track.cues),original.cues.map(({verse,start,end})=>({verse,start,end})));
 assert.deepEqual(plain(track.intro),original.intro);
 assert.equal(track.durationSeconds,1260.3278125);
 assert.equal(track.cues[0].start,6.86);assert.equal(track.cues[82].start,1246.88);
 assert.equal(track.cues[82].end,track.durationSeconds);
 for(let i=0;i<83;i++){assert.equal(track.cues[i].verse,i+1);assert(track.cues[i].end>track.cues[i].start);if(i)assert.equal(track.cues[i-1].end,track.cues[i].start);}
});
test('Intro remains verse zero until measured Yasin onset; seven seconds is verse one',()=>{
 for(const time of [0,.01,1,4.8,6.859999]){const value=compare(time);assert.equal(value.verse,0);assert.equal(value.kind,'intro');assert.equal(value.start,0);assert.equal(value.end,6.86);}
 assert.equal(compare(6.86).verse,1);assert.equal(compare(7).verse,1);
});
test('Every measured onset switches by exact floor semantics immediately before, at and after its boundary',()=>{
 for(let i=0;i<cues.length;i++){
  const time=cues[i].start;
  assert.equal(compare(time-.000001).verse,i===0?0:cues[i-1].verse);
  assert.equal(compare(time).verse,cues[i].verse);
  assert.equal(compare(time+.000001).verse,cues[i].verse);
 }
});
test('Every full verse interval, including interverse silence, holds its preceding verse',()=>{
 for(const cue of cues){for(const time of [cue.start,(cue.start+cue.end)/2,cue.end-.000001]){const value=compare(time);assert.equal(value.verse,cue.verse);assert.equal(value.start,cue.start);assert.equal(value.end,cue.end);assert.equal(value.kind,'verse');}}
 for(const time of [1257.8325,1258.03,1258.11,1259,duration-.000001,duration])assert.equal(compare(time).verse,83);
});
test('4096 reproducible random media timestamps agree with an independent linear oracle',()=>{
 let seed=0x36a183;
 for(let i=0;i<4096;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;compare((seed/4294967296)*duration);}
});
test('Missing, nonfinite, wrongly typed and negative media times fail closed',()=>{
 for(const time of [undefined,null,NaN,Infinity,-Infinity,-.000001,-1,-duration,'7',{},[]])assert.equal(api.at(metadata,time,duration),null,`Accepted invalid time ${String(time)}`);
});
test('Only the exact immutable source hash and byte count permit timing',()=>{
 for(const value of [undefined,null,{}, {sha256:'0'.repeat(64),bytes:metadata.bytes},{sha256:metadata.sha256.toUpperCase(),bytes:metadata.bytes},{sha256:metadata.sha256,bytes:metadata.bytes-1},{sha256:metadata.sha256,bytes:metadata.bytes+1},{sha256:metadata.sha256,bytes:String(metadata.bytes)}])assert.equal(api.at(value,7,duration),null);
 assert.equal(api.at({...metadata,reciter:'Aaqib Azeez'},7,duration).verse,1);
});
test('Duration identity permits bounded native rounding and rejects wrong or unknown recordings',()=>{
 for(const value of [undefined,null,NaN,Infinity,-Infinity,0,-1,'1260.3278',{},duration-.151,duration+.151,1257,1300])assert.equal(api.at(metadata,7,value),null,`Accepted invalid duration ${String(value)}`);
 for(const value of [1260.3278,duration-.149,duration+.149])assert.equal(compare(7,value).verse,1);
 assert.equal(api.at(metadata,duration+.149,duration).verse,83);
 assert.equal(api.at(metadata,duration+.151,duration),null);
});
test('Runtime API, snapshot, intro, review and every returned cue are deeply protected against mutation',()=>{
 const track=api.snapshot();assert(Object.isFrozen(api));assert(Object.isFrozen(track));assert(Object.isFrozen(track.cues));assert(Object.isFrozen(track.intro));assert(Object.isFrozen(track.review));
 for(const cue of track.cues)assert(Object.isFrozen(cue));
 assert.equal(Reflect.set(track,'durationSeconds',1),false);assert.equal(Reflect.set(track.cues[0],'start',0),false);assert.equal(Reflect.set(track.review,'humanListeningAudited',true),false);
 assert.throws(()=>Object.defineProperty(track.cues[0],'start',{value:0}),TypeError);
 for(const time of [0,7,1247]){const result=compare(time);assert(Object.isFrozen(result));assert.equal(Reflect.set(result,'verse',99),false);}
 assert.equal(api.snapshot().cues[0].start,6.86);assert.equal(compare(7).verse,1);
});
test('Source position is independent of playback rate, elapsed wall time and external clock values',()=>{
 for(const rate of [.25,.5,1,1.25,2,4])for(const time of [0,6.86,100.52,748.14,1246.88,1259]){
  wallTime=rate*1e12;
  const actual=api.at({...metadata,playbackRate:rate},time,duration,rate);
  assert.equal(actual.verse,expected(time));
 }
});
test('Machine audit and 20 ms resolution are accurately described without human or probability claims',()=>{
 for(const row of [documented,original,api.snapshot()]){
  assert.equal(row.review.status,'machine-acoustically-cross-validated');assert.equal(row.review.humanListeningAudited,false);assert.equal(row.review.scoreIsCalibratedProbability,false);
  assert.equal(row.precisionSeconds,.02);assert.equal(row.review.all83Ordered,true);assert.equal(row.review.all83UnforcedTextChecksPass,true);assert.equal(row.review.all83WaveformOnsetsCorroborated,true);
 }
 assert(documented.review.evidence.length>0);
 assert(Math.abs(documented.review.nativeClockCalibration.nativeDurationSeconds-duration)<.00002);
 assert(documented.review.knownIssues.some(text=>/resolution.*not.*guarantee/i.test(text)));
 assert.equal(documented.review.globalBareHarakatFirstTokenMaxDifferenceSeconds,0);
 assert.equal(documented.review.minimumCtcLogScore,-1.685387);
 assert(documented.cues.every(cue=>Number.isFinite(cue.score)&&cue.score<=0));
});

const report={suite:'r1067 exact Arabic Yasin timing and source identity',build:'r1067',sourceRoot:root,passed:checks.filter(check=>check.passed).length,total:checks.length,
 observations:{verses:83,boundarySamples:249,randomSamples:4096,sourceSha256:metadata.sha256,sourceBytes:metadata.bytes,durationSeconds:duration,canonicalSourceSha256:documented.review.canonicalSourceSha256,firstCueStart:6.86,lastCueStart:1246.88,humanListeningAudited:false},checks};
fs.mkdirSync(qa,{recursive:true});fs.writeFileSync(path.join(qa,'yasin-timing.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
if(checks.some(check=>!check.passed))process.exitCode=1;
