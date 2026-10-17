/* Real production awaiters + TTSD wrapper, with deterministic native callbacks. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function block(start,end){const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert(a>=0&&b>a,start);return html.slice(a,b);}
const awaiters=block('let _r475ZTtsSeq=0, _r475ZTtsState=null;','/* Zikri konuşurken:');
const manager=block('const TTSD={duruk:false, son:null};','const SES={ler:new Set(), ad:null};');
const legacy=block('let R168_TTS_FINISH=null,R168_TTS_SEQ=0;','/* r919: one attempt guard');
const results=[];
async function test(name,fn){try{await fn();results.push({name,ok:true});}catch(e){results.push({name,ok:false,error:e.stack});}}
function fixture(){
  let now=0,next=0,cancelled=0,cancelEnd=false,throwSpeak=false;
  const timers=new Map(),spoken=[],rhythm=[];
  const c={console,Promise,Map,Set,Object,Array,String,Number,Math,RegExp,JSON};
  c.window=c;c.document={hidden:false,getElementById:()=>null};
  c.Date=class extends Date{static now(){return now;}};
  c.setTimeout=(fn,ms)=>{const id=++next;timers.set(id,{fn,at:now+(Number(ms)||0)});return id;};
  c.clearTimeout=id=>timers.delete(id);
  c.SpeechSynthesisUtterance=class{constructor(text){this.text=text;this.volume=1;}};
  const tr={name:'Turkish',lang:'tr-TR'};
  c.SPK={rate:.8,voice:tr,arRate:.8,arPitch:.9};c.spkPitch=x=>x;c.ZVOL=1;
  c.SukunVoiceCatalog={resolve:()=>tr};c.SukunRhythm={voiceStarted:(valid,kind)=>rhythm.push({valid,kind})};
  c.speechSynthesis={speaking:false,pending:false,paused:false,
    speak(u){if(throwSpeak)throw Error('native speak failure');spoken.push(u);u.initialEnd=u.onend;u.initialError=u.onerror;u.initialStart=u.onstart;this.pending=true;},
    cancel(){cancelled++;this.speaking=false;this.pending=false;if(cancelEnd)spoken.at(-1)?.initialEnd?.();},
    resume(){this.paused=false;}
  };
  vm.createContext(c);vm.runInContext(awaiters,c);vm.runInContext(manager,c);vm.runInContext(legacy,c);
  const fire=(type,u=spoken.at(-1))=>{assert(u,'No utterance');if(type==='start'){c.speechSynthesis.speaking=true;c.speechSynthesis.pending=false;}if(['end','error'].includes(type)){c.speechSynthesis.speaking=false;c.speechSynthesis.pending=false;}u['on'+type]?.({type,error:type==='error'?'synthesis-failed':undefined});};
  const tick=ms=>{const end=now+ms;let guard=0;while(true){const item=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!item)break;assert(++guard<1000);now=item[1].at;timers.delete(item[0]);item[1].fn();}now=end;};
  const begin=(kind,current=()=>true,text='Allah',interrupt=false)=>kind==='zikir'?c.zikirTtsAwait(text,interrupt,'tr-TR',tr,.8,.9,current):c.ttsPromise(text,'tr-TR',current);
  return{c,spoken,rhythm,timers,fire,tick,begin,get cancelled(){return cancelled;},set cancelEnd(v){cancelEnd=v;},set throwSpeak(v){throwSpeak=v;}};
}
(async()=>{
  for(const kind of ['zikir','legacy']){
    await test(kind+': success requires accepted start followed by end',async()=>{const f=fixture(),p=f.begin(kind);f.fire('start');assert.equal(f.rhythm.length,1);f.fire('end');assert.equal(await p,true);assert.equal(f.timers.size,0);assert.equal(f.rhythm[0].valid(),false);});
    await test(kind+': end without start is failure',async()=>{const f=fixture(),p=f.begin(kind);f.fire('end');assert.equal(await p,false);assert.equal(f.rhythm.length,0);assert.equal(f.timers.size,0);});
    await test(kind+': synthesis error before start is failure',async()=>{const f=fixture(),p=f.begin(kind);f.fire('error');assert.equal(await p,false);});
    await test(kind+': synthesis error after start is failure',async()=>{const f=fixture(),p=f.begin(kind);f.fire('start');f.fire('error');assert.equal(await p,false);});
    await test(kind+': no callbacks time out without credit',async()=>{const f=fixture(),p=f.begin(kind);f.tick(200000);assert.equal(await p,false);assert(f.cancelled>0);});
    await test(kind+': timeout cannot become success through cancel to end',async()=>{const f=fixture();f.cancelEnd=true;const p=f.begin(kind);f.fire('start');f.tick(200000);assert.equal(await p,false);assert.equal(f.timers.size,0);});
    await test(kind+': direct cancel to end cannot become success',async()=>{const f=fixture();f.cancelEnd=true;const p=f.begin(kind);f.fire('start');f.c.speechSynthesis.cancel();assert.equal(await p,false);assert.equal(f.timers.size,0);});
    await test(kind+': direct cancel without callbacks settles failure',async()=>{const f=fixture(),p=f.begin(kind);f.fire('start');f.c.speechSynthesis.cancel();assert.equal(await p,false);assert.equal(f.timers.size,0);});
    await test(kind+': stale completion loses authority',async()=>{const f=fixture();let current=true;const p=f.begin(kind,()=>current);f.fire('start');current=false;f.fire('end');assert.equal(await p,false);});
    await test(kind+': stale start settles and stops only its owned speech',async()=>{const f=fixture();let current=true;const p=f.begin(kind,()=>current);current=false;f.fire('start');assert.equal(await p,false);assert(f.cancelled>0);assert.equal(f.rhythm.length,0);});
    await test(kind+': high level cancel rejects late captured end',async()=>{const f=fixture(),p=f.begin(kind);f.fire('start');const end=f.spoken.at(-1).initialEnd;f.c.sukunTtsCancel('test-stop');end?.();assert.equal(await p,false);});
    await test(kind+': captured start after cancellation cannot reactivate rhythm',async()=>{const f=fixture(),p=f.begin(kind),u=f.spoken.at(-1);f.c.sukunTtsCancel('test-stop');u.initialStart?.();u.initialEnd?.();assert.equal(await p,false);assert.equal(f.rhythm.length,0);});
    await test(kind+': replacement keeps new utterance ownership',async()=>{const f=fixture(),old=f.begin(kind),u=f.spoken.at(-1),p=f.begin(kind,()=>true,'Yâ Nûr',true);u.initialStart?.();u.initialEnd?.();assert.equal(await old,false);f.fire('start');f.fire('end');assert.equal(await p,true);assert.equal(f.timers.size,0);});
    await test(kind+': whitespace never enters native synthesis',async()=>{const f=fixture();assert.equal(await f.begin(kind,()=>true,'  \n '),false);assert.equal(f.spoken.length,0);});
    await test(kind+': stale admission never enters native synthesis',async()=>{const f=fixture();assert.equal(await f.begin(kind,()=>false),false);assert.equal(f.spoken.length,0);});
    await test(kind+': synchronous speak exception is failure',async()=>{const f=fixture();f.throwSpeak=true;assert.equal(await f.begin(kind),false);assert.equal(f.timers.size,0);});
    await test(kind+': pause before native start resumes with preserved start callback',async()=>{const f=fixture(),p=f.begin(kind);assert.equal(f.c.ttsDurakla(),true);assert.equal(f.c.ttsSurdur(),true);assert.equal(f.spoken.length,2);f.fire('start');f.fire('end');assert.equal(await p,true);});
    await test(kind+': direct cancel after resumed speech remains failure',async()=>{const f=fixture();f.cancelEnd=true;const p=f.begin(kind);f.fire('start');assert.equal(f.c.ttsDurakla(),true);assert.equal(f.c.ttsSurdur(),true);f.fire('start');f.c.speechSynthesis.cancel();assert.equal(await p,false);});
    await test(kind+': replay clone preserves start and cancellation ownership',async()=>{const f=fixture(),p=f.begin(kind),u=f.spoken.at(-1);f.c.ttsYenidenSoyle(u);f.fire('start');f.c.speechSynthesis.cancel();assert.equal(await p,false);});
  }
  await test('zikir: late start from superseded queued speech cannot stop replacement',async()=>{const f=fixture(),old=f.begin('zikir'),u=f.spoken.at(-1),p=f.begin('zikir');const cancels=f.cancelled;u.initialStart?.();assert.equal(await old,false);assert.equal(f.cancelled,cancels);f.fire('start');f.fire('end');assert.equal(await p,true);});
  await test('zikir: hidden stalled synthesis remains failed after background pulses',async()=>{const f=fixture(),p=f.begin('zikir');f.c.document.hidden=true;f.fire('start');f.c.speechSynthesis.speaking=false;f.tick(200000);for(let i=0;i<3;i++)f.c.zikirTtsBackgroundPulse();assert.equal(await p,false);});
  await test('zikir: synchronous native start/end leaves no watchdog behind',async()=>{const f=fixture();f.c.speechSynthesis.speak=u=>{u.onstart?.();u.onend?.();};assert.equal(await f.begin('zikir'),true);assert.equal(f.timers.size,0);});
  const report={version:'r1084',scope:'Production TTS completion functions and TTSD wrapper; deterministic native callbacks, no audible-device claim',passed:results.filter(x=>x.ok).length,total:results.length,allPassed:results.every(x=>x.ok),tests:results};
  console.log(JSON.stringify(report,null,2));if(!report.allPassed)process.exitCode=1;
})();
