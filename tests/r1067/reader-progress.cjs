'use strict';
// Production reading policy/queue/transport with controlled speech starts and
// native progress callbacks. The synthetic timing map tests routing only; it
// deliberately makes no assertion about a real reciter's timestamps.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
let header=fs.readFileSync(path.join(__dirname,'../r1065/audio-priority.cjs'),'utf8').split('(async()=>{')[0];
header=header.replace("const root=path.resolve(__dirname,'../..'),core=",'const root='+JSON.stringify(root)+',core=');
const readerHarness=Function('require','__dirname',header+'\nreturn fixture;')(require,path.join(__dirname,'../r1065'));
const results=[];async function test(name,fn){try{await fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e.stack})}}
function fixture(){
 const f=readerHarness();f.reader=f.c.SukunReadingAudioR1064;f.changes=[];f.writes=0;f.mapCalls=[];f.native=[];
 f.c.speechSynthesis.speak=u=>f.spoken.push(u);f.reader.subscribe(s=>f.changes.push(s));
 for(const method of ['put','set','delete','clear'])f.c.REC_DB[method]=()=>{f.writes++;throw Error('Recording storage write forbidden')};
 f.meta=Object.freeze({timingId:'synthetic-progress-test',sha256:'synthetic-exact-source'});
 f.c.SukunYasinTimingR1067={at:(metadata,time,duration)=>{
  f.mapCalls.push({metadata,time,duration});if(metadata!==f.meta||!Number.isFinite(time)||!Number.isFinite(duration)||duration!==30||time<0||time>=30)return null;
  return{verse:time<2?0:time<9?1:time<18?2:3};
 }};
 f.c.playRecording=(blob,id,opt)=>new Promise(resolve=>f.native.push({blob,id,opt,resolve}));
 f.bundle=(metadata=f.meta)=>{const value={blob:new Blob(['test-source']),key:'bundled:test:yasin',bundled:true,metadata};f.c.SukunBundledArabicR1065={find:async()=>value};return value;};
 f.sample=(time,duration=30,key='bundled:test:yasin',index=f.native.length-1)=>f.native[index].opt.onProgress?.({currentTime:time,duration,recordingKey:key,paused:f.reader.snapshot().phase==='paused',ended:false,playbackRate:1});
 f.stop=async promise=>{f.reader.stop('test-cleanup');for(const native of f.native)native.resolve({ok:false,reason:'stopped'});if(promise)await promise;};
 return f;
}
(async()=>{
 for(const content of ['arabic','meaning'])await test('Yasin '+content+' frame becomes eligible only on actual TTS start and follows the selected verse',async()=>{
  const f=fixture(),p=f.reader.play({id:'reading:yasin',content,source:content==='arabic'?'arabic':'turkish',startVerse:2,onlyVerse:true});await f.flush();
  assert.equal(f.spoken.length,1);assert.equal(f.reader.snapshot().verse,2);assert.equal(f.reader.snapshot().verseSync,'pending');
  const expected=content==='arabic'?f.c.SukunYasinDataR1064.verses[1].arabicTts:f.c.SukunYasinDataR1064.verses[1].meaning;
  assert.equal(f.spoken[0].text,f.c.ttsBol(expected,190)[0]);assert.match(f.spoken[0].lang,content==='arabic'?/^ar/:/^tr/);
  f.spoken[0].onstart();assert.equal(f.reader.snapshot().verseSync,'tts');assert.equal(f.reader.snapshot().verse,2);f.end();
  while(['playing','preparing'].includes(f.reader.snapshot().phase)){await f.flush();f.spoken.at(-1).onstart?.();f.end();}
  assert.equal((await p).ok,true);assert.equal(f.writes,0);
 });
 for(const content of ['arabic','meaning'])await test('All 83 '+content+' verses follow real speech starts in source order without skipped or mixed text',async()=>{
  const f=fixture(),data=f.c.SukunYasinDataR1064,observed=[],p=f.reader.play({id:'reading:yasin',content,source:content==='arabic'?'arabic':'turkish'});await f.flush();let guard=0;
  while(['playing','preparing'].includes(f.reader.snapshot().phase)&&guard++<1000){
   const u=f.spoken.at(-1);assert(u?.onstart);u.onstart();const s=f.reader.snapshot();assert.equal(s.verseSync,'tts');assert.equal(s.content,content);observed.push(s.verse);u.onend();await f.flush();
  }
  assert.equal((await p).ok,true);assert.deepEqual([...new Set(observed)],[0,...Array.from({length:83},(_,i)=>i+1)]);
  const texts=[content==='arabic'?data.basmalaTts:data.basmalaMeaning,...data.verses.map(v=>content==='arabic'?v.arabicTts:v.meaning)].flatMap(t=>Array.from(f.c.ttsBol(t,190)));
  assert.deepEqual(f.spoken.map(u=>u.text),texts);assert.equal(f.writes,0);
 });
 await test('Several speech chunks retain one verse then await the next verse actual start',async()=>{
  const f=fixture();f.entries.set('reading:yasin',{...f.entries.get('reading:yasin'),verses:[{number:24,arabicTts:'سُبْحَانَ اللَّهِ '.repeat(35),meaning:'Anlam '.repeat(70)},{number:25,arabicTts:'الْحَمْدُ لِلَّهِ',meaning:'Hamd Allah’a mahsustur.'}]});
  const p=f.reader.play({id:'reading:yasin',content:'arabic',source:'arabic',startVerse:24});await f.flush();
  assert.equal(f.reader.snapshot().verse,24);f.spoken.at(-1).onstart();let guard=0,parts=0;
  while(f.reader.snapshot().verse===24&&guard++<20){assert.equal(f.reader.snapshot().verseSync,'tts');parts++;f.end();await f.flush();if(f.reader.snapshot().verse===24)f.spoken.at(-1).onstart?.();}
  assert(parts>1);assert.equal(f.reader.snapshot().verse,25);assert.equal(f.reader.snapshot().verseSync,'pending');f.spoken.at(-1).onstart();assert.equal(f.reader.snapshot().verseSync,'tts');f.end();assert.equal((await p).ok,true);
 });
 await test('TTS pause keeps its verse, replays only its held chunk and rejects the canceled start callback',async()=>{
  const f=fixture(),p=f.reader.play({id:'reading:yasin',content:'meaning',source:'turkish',startVerse:12,onlyVerse:true});await f.flush();f.spoken[0].onstart();
  const oldStart=f.spoken[0].onstart,oldEnd=f.spoken[0].onend,oldText=f.spoken[0].text;
  f.reader.pause();const before=f.changes.length;oldStart();oldEnd();await f.flush();assert.equal(f.changes.length,before);assert.equal(f.reader.snapshot().phase,'paused');assert.equal(f.reader.snapshot().verse,12);
  f.reader.resume();await f.flush();assert.equal(f.spoken.length,2);assert.equal(f.spoken[1].text,oldText);f.spoken[1].onstart();assert.equal(f.reader.snapshot().verseSync,'tts');await f.stop(p);
 });
 await test('Stop clears verse synchronization and stale TTS start/end cannot restore it',async()=>{
  const f=fixture(),p=f.reader.play({id:'reading:yasin',content:'arabic',source:'arabic',startVerse:6,onlyVerse:true});await f.flush();const u=f.spoken[0],start=u.onstart,end=u.onend;u.onstart();
  f.reader.stop();const before=f.changes.length;start();end();await f.flush();assert.equal(f.changes.length,before);assert.equal(f.reader.snapshot().phase,'idle');assert.equal(f.reader.snapshot().verse,0);assert.equal(f.reader.snapshot().verseSync,'none');assert.equal((await p).cancelled,true);
 });
 await test('Bundled Yasin uses its exact metadata and media time; seeking updates the mapped verse',async()=>{
  const f=fixture(),bundle=f.bundle(),p=f.reader.play({id:'reading:yasin',content:'arabic',source:'auto'});await f.flush();assert.equal(f.native.length,1);assert.equal(f.native[0].blob,bundle.blob);
  assert.equal(f.reader.snapshot().verseSync,'none');f.sample(1);assert.equal(f.reader.snapshot().verse,0);assert.equal(f.reader.snapshot().verseSync,'timestamp');
  f.sample(3.25);assert.equal(f.reader.snapshot().verse,1);assert.equal(f.reader.snapshot().currentTime,3.25);assert.equal(f.reader.snapshot().duration,30);assert.equal(f.mapCalls.at(-1).metadata,f.meta);
  f.sample(21);assert.equal(f.reader.snapshot().verse,3);f.sample(10);assert.equal(f.reader.snapshot().verse,2);assert(Math.abs(f.reader.snapshot().progress-100/3)<1e-10);assert.equal(f.writes,0);await f.stop(p);
 });
 await test('Same mapped verse updates clock snapshot without redundant reading broadcasts',async()=>{
  const f=fixture();f.bundle();const p=f.reader.play({id:'reading:yasin',content:'arabic',source:'auto'});await f.flush();f.sample(3);const before=f.changes.length;
  f.sample(4);f.sample(5.5);assert.equal(f.changes.length,before);assert.equal(f.reader.snapshot().currentTime,5.5);f.sample(11);assert.equal(f.changes.length,before+1);assert.equal(f.reader.snapshot().verse,2);await f.stop(p);
 });
 await test('Pause and resume preserve native mapped verse without restarting the file or writing recordings',async()=>{
  const f=fixture();f.bundle();const p=f.reader.play({id:'reading:yasin',content:'arabic',source:'auto'});await f.flush();f.sample(11);f.reader.pause();f.sample(11);assert.equal(f.reader.snapshot().phase,'paused');assert.equal(f.reader.snapshot().verse,2);
  f.reader.resume();f.sample(13);assert.equal(f.native.length,1);assert.equal(f.reader.snapshot().verse,2);assert.equal(f.reader.snapshot().verseSync,'timestamp');assert.equal(f.writes,0);await f.stop(p);
 });
 for(const kind of ['wrong-source','superseded-token','caller-current','tab-epoch','voice-preference','audio-intent'])await test('Bundled progress rejects '+kind+' observations',async()=>{
  const f=fixture();f.bundle();let valid=true,epoch=1;f.c.SukunTabOwner={owns:()=>true,snapshot:()=>({epoch})};const p=f.reader.play({id:'reading:yasin',content:'arabic',source:'auto',isCurrent:()=>valid});await f.flush();f.sample(4);
  if(kind==='wrong-source')f.sample(20,30,'bundled:foreign:yasin');
  if(kind==='superseded-token')f.reader.stop();
  if(kind==='caller-current')valid=false;
  if(kind==='tab-epoch')epoch++;
  if(kind==='voice-preference')f.c.SukunVoiceSettings.rememberContent('meaning');
  if(kind==='audio-intent')f.c.AudioLife._userIntentSeq++;
  const expected=f.reader.snapshot(),before=f.changes.length;f.sample(22,30,kind==='wrong-source'?'bundled:foreign:yasin':'bundled:test:yasin');assert.equal(f.changes.length,before);assert.deepEqual(f.reader.snapshot(),expected);await f.stop(p);
 });
 await test('Unknown timing metadata and invalid durations never invent a Yasin verse',async()=>{
  const f=fixture();f.bundle({timingId:'foreign-reciter'});const p=f.reader.play({id:'reading:yasin',content:'arabic',source:'auto'});await f.flush();f.sample(22);assert.equal(f.reader.snapshot().verse,0);assert.equal(f.reader.snapshot().verseSync,'none');f.sample(22,Infinity);assert.equal(f.reader.snapshot().duration,null);assert.equal(f.reader.snapshot().verse,0);await f.stop(p);
 });
 await test('Superseded bundled callback cannot change a new attempt of the identical recording key',async()=>{
  const f=fixture();f.bundle();const first=f.reader.play({id:'reading:yasin',content:'arabic',source:'auto'});await f.flush();f.sample(4);const old=f.native[0].opt.onProgress;
  const second=f.reader.play({id:'reading:yasin',content:'arabic',source:'auto'});await f.flush();assert.equal(f.native.length,2);f.sample(11);const before=f.changes.length;
  old({currentTime:22,duration:30,recordingKey:'bundled:test:yasin'});assert.equal(f.changes.length,before);assert.equal(f.reader.snapshot().verse,2);assert.equal(f.reader.snapshot().currentTime,11);
  f.native[0].resolve({ok:false,reason:'superseded'});assert.equal((await first).cancelled,true);assert.equal(f.reader.snapshot().phase,'playing');await f.stop(second);
 });
 for(const origin of ['personal','generic','other-bundle'])await test('No timestamp tracking is attached to '+origin+' recordings',async()=>{
  const f=fixture(),blob=new Blob(['existing-recording']);let opt;
  if(origin==='personal')f.personal.set('dua:yasin',blob);
  if(origin==='generic')f.generic.set('dua:yasin',blob);
  if(origin==='other-bundle')f.c.SukunBundledArabicR1065={find:async()=>({blob,key:'other',bundled:true,metadata:f.meta})};
  const id=origin==='other-bundle'?'reading:short':'reading:yasin',source=origin==='personal'?'personal':origin==='generic'?'generic':'auto';
  const p=f.reader.play({id,content:'legacy',source});await f.flush();opt=f.native[0].opt;assert.equal(opt.onProgress,undefined);assert.equal(f.reader.snapshot().verse,0);assert.equal(f.reader.snapshot().verseSync,'none');assert.equal(f.mapCalls.length,0);assert.equal(f.writes,0);await f.stop(p);
 });
 const report={version:'r1067',root,scope:'Actual reading policy and runtime, controlled native callback and real speech-start callbacks. Synthetic timing map checks routing, not real reciter alignment.',passed:results.filter(x=>x.ok).length,total:results.length,allPassed:results.every(x=>x.ok),tests:results};console.log(JSON.stringify(report,null,2));if(!report.allPassed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
