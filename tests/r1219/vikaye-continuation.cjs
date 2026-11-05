'use strict';
// Real shipped Vikaye reader with deterministic storage, native playback and
// clock seams. No user recording is read or changed by this test.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(process.env.SUKUN_TEST_HTML||path.join(root,'nero.html'),'utf8');
function block(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j);}
const declarations=block('const HZV={','/* r138:');
const reader=block('function hzvDurdur(){','/* Bölüm kayıtları eski anahtarlarla korunur:');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
function fixture(kind){
 let now=0,serial=0;const timers=new Map(),recordings=[],speech=[],gets=[],status={textContent:'',innerHTML:''};
 const blob=kind==='recording'?new Blob(['synthetic test audio']):null;
 const c={console,Promise,Set,Array,Number,Math,Blob,window:null,
  setTimeout(fn,ms=0){const id=++serial;timers.set(id,{fn,at:now+ms});return id},clearTimeout:id=>timers.delete(id),
  document:{getElementById:()=>status,querySelectorAll:()=>[],querySelector:()=>null},
  HZV_KISIM:[0,1].map(i=>({ad:'Bölüm '+i,p:[i]})),RECKEYS:new Set(),HZV_P:['ilk','ikinci'],
  hzvKey:i=>'dua:hizb:'+i,hzvSira:()=>[0,1],hzvKisimYaz(){},hzvDugmeler(){},hzvMetin:k=>k.ad,
  REC_DB:{async get(key){gets.push(key);return blob}},
  playRecording(b,id,options){const d=deferred();recordings.push({id,options,...d});return d.promise},
  SpeechSynthesisUtterance:class{constructor(text){this.text=text}},
  speechSynthesis:{speak(u){speech.push(u)},cancel(){}},
  ttsDurakla(){},ttsSurdur(){},sesDuraklat(){},sesSurdur(){},sesDurdur(){},hardStopAll(){},ac(){},toast(){},
  zikirSonuSes(){},zikirTamam(){},LOG:{touch(){}},SukunVoiceSettings:{getMode:()=> 'auto'}};
 c.window=c;vm.createContext(c);vm.runInContext(declarations+reader+';this.state=HZV;',c);
 const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
 async function advance(ms){const end=now+ms;await flush();let limit=0;for(;;){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;assert(++limit<100,'bounded schedule');now=next[1].at;timers.delete(next[0]);next[1].fn();await flush()}now=end;await flush()}
 const media=()=>kind==='recording'?recordings:speech;
 async function finish(ok=true){if(kind==='recording')recordings.at(-1).resolve({ok});else if(ok)speech.at(-1).onend();else speech.at(-1).onerror();await flush()}
 const start=async()=>{c.hzvGit(0);await advance(100)};
 return{c,recordings,speech,gets,status,media,flush,advance,finish,start,pause:()=>c.hzvDuraklaCevir(),stop:()=>c.hzvDurdur()};
}
const results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS '+name)}catch(e){results.push({name,passed:false,error:e.stack});console.error('FAIL '+name+': '+e.message)}}
(async()=>{
 for(const kind of ['recording','tts']){
  await test(kind+': pause during chapter gap holds then resumes exactly once',async()=>{const f=fixture(kind);await f.start();assert.equal(f.media().length,1);await f.finish();f.pause();await f.advance(500);assert.equal(f.media().length,1);assert.equal(f.c.state.i,0);f.pause();await f.flush();assert.equal(f.media().length,2);assert.equal(f.c.state.i,1);await f.finish();await f.advance(320);assert.equal(f.c.state.playing,false);assert.equal(f.c.state.zincir,false);assert.equal(f.media().length,2)});
  await test(kind+': pause before first chapter prevents playback until Resume',async()=>{const f=fixture(kind);f.c.hzvGit(0);f.pause();await f.advance(150);assert.equal(f.media().length,0);f.pause();await f.flush();assert.equal(f.media().length,1)});
  await test(kind+': Stop cancels a paused chapter transition permanently',async()=>{const f=fixture(kind);await f.start();await f.finish();f.pause();await f.advance(320);f.stop();f.pause();await f.advance(1000);assert.equal(f.media().length,1);assert.equal(f.c.state.playing,false)});
  await test(kind+': navigation replaces a paused transition without stale playback',async()=>{const f=fixture(kind);await f.start();await f.finish();f.pause();await f.advance(320);f.c.hzvGit(0,true);await f.advance(100);assert.equal(f.media().length,2);assert.equal(f.c.state.i,0);await f.finish();await f.advance(1000);assert.equal(f.media().length,2);assert.equal(f.c.state.playing,false)});
  await test(kind+': source lookup finishing while paused cannot start audio',async()=>{const f=fixture(kind),lookup=deferred();f.c.REC_DB.get=()=>lookup.promise;await f.start();f.pause();lookup.resolve(kind==='recording'?new Blob(['fixture']):null);await f.flush();assert.equal(f.media().length,0);f.pause();await f.flush();assert.equal(f.media().length,1)});
  await test(kind+': completion received while paused preserves chapter until Resume',async()=>{const f=fixture(kind);await f.start();f.pause();await f.finish();await f.advance(500);assert.equal(f.media().length,1);assert.equal(f.c.state.i,0);f.pause();await f.advance(320);assert.equal(f.media().length,2);assert.equal(f.c.state.i,1)});
  await test(kind+': interruption from pause retries same source without skipping',async()=>{const f=fixture(kind);await f.start();f.pause();await f.finish(false);await f.advance(1000);assert.equal(f.media().length,1);f.pause();await f.flush();assert.equal(f.media().length,2);assert.equal(f.c.state.i,0);if(kind==='recording'){assert.equal(f.recordings[1].id,f.recordings[0].id);assert.equal(f.speech.length,0)}else assert.equal(f.speech[1].text,f.speech[0].text)});
  await test(kind+': immediate Stop after Resume defeats queued continuation',async()=>{const f=fixture(kind);await f.start();await f.finish();f.pause();await f.advance(320);f.pause();f.stop();await f.advance(1000);assert.equal(f.media().length,1);assert.equal(f.c.state.playing,false)});
 }
 await test('A failed personal recording never falls through to device speech',async()=>{const f=fixture('recording');await f.start();await f.finish(false);await f.advance(1000);assert.equal(f.speech.length,0);assert.equal(f.c.state.playing,false);assert(f.status.textContent.includes('Kayıt korunuyor'))});
 await test('Explicit personal mode with no recording never uses device speech',async()=>{const f=fixture('tts');f.c.SukunVoiceSettings.getMode=()=> 'personal';await f.start();assert.equal(f.speech.length,0);assert.equal(f.c.state.playing,false)});
 await test('Real TTS failure retries once then stops without advancing',async()=>{const f=fixture('tts');await f.start();await f.finish(false);await f.advance(180);assert.equal(f.speech.length,2);assert.equal(f.speech[1].text,f.speech[0].text);await f.finish(false);await f.advance(1000);assert.equal(f.c.state.playing,false);assert.equal(f.speech.length,2)});
 const report={suite:'Vikaye pause and source continuity',passed:results.filter(x=>x.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
