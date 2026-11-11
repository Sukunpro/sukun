'use strict';
// Exercise the complete shipped transport with both legal loop event orders.
// Synthetic native events do not verify physical Android/audio output.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(process.env.SUKUN_TEST_HTML||path.join(root,'index.html'),'utf8');
const shipped=html.split('<script id="r648-lock-journey-transport-v2">')[1]?.split('</script>')[0];
assert.ok(shipped,'Complete production native journey transport');
// Test-only closure access; production code and control flow remain unchanged.
const source=shipped.replace('version:VERSION,arm,revive,finishCycle,','__test:{L,onTime,onSeeking,onPause,bind},version:VERSION,arm,revive,finishCycle,');
assert.notEqual(source,shipped,'Production transport export anchor');
function fixture(kind){
 let at=10000;const raw={run:true,paused:false,i:6,rep:0,totalDone:0};
 const key=kind===28?'berhet:6':'esma:6:nida',owner='journey'+kind;
 const a={src:'blob:word',currentTime:2.9,duration:3,playbackRate:1,paused:false,ended:false,loop:true,seeking:false,addEventListener(){},removeEventListener(){}};
 const api={state:()=>raw};
 const window={__sukJourneyNative:{a,recordingKey:key},
  [kind===28?'SukunBerhetiyyeSeyir':'SukunEsma99Seyir']:api,[kind===28?'BERHET_SEYIR':'ESMA99_SEYIR']:raw,
  ZIKIR:{berhet:{items:Array(28).fill({eb:999})},esma:{items:Array(99).fill({eb:999})}},
  SukunJourneyAudioMachine:{snapshot:()=>({})},SukunRhythm:{voiceStarted(){},stop(){}},addEventListener(){},dispatchEvent(){}};
 const context={window,document:{hidden:true,addEventListener(){},getElementById:id=>/^(bs|es99)Mode$/.test(id)?{value:'ebced'}:null},
  localStorage:{getItem(){return null},setItem(){}},Date:{now:()=>at},Number,String,Math,Object,JSON,CustomEvent:function(){},setTimeout(){},clearTimeout(){},navigator:{},sukunJourneyGapMs:()=>900,KAYIT:{},r957Volume:n=>n};
 vm.runInNewContext(source,context,{filename:'shipped-journey-transport.js'});
 const t=window.SukunLockJourneyTransportV2.__test;t.bind(a);
 Object.assign(t.L,{active:true,owner,key,index:6,seq:1,mediaSource:a.src,settingsSig:'900|1|0|0',cycleMs:3000,limit:999,startRep:0,startPhaseMs:0,mediaProgressMs:2900,lastCurrent:2.9,mediaSampleAt:at,dormant:false,frozen:false});
 return{a,t,raw,clock:ms=>{at+=ms},emit:name=>t[name].call(a),at:()=>at};
}
const results=[];
function check(name,fn){try{fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.stack||String(e)});}}
function wrap(f,order=['onTime','onSeeking']){f.clock(100);f.a.currentTime=0;for(const event of order)f.emit(event);}
function nextWord(f){for(let i=1;i<=29;i++){f.clock(100);f.a.currentTime=i/10;f.emit('onTime')}wrap(f);}
for(const kind of [28,99]){
 for(const order of [['onSeeking','onTime'],['onTime','onSeeking']])check(`${kind}: ${order.join(' then ')} preserves the next complete word`,()=>{
  const f=fixture(kind);wrap(f,order);
  assert.equal(f.raw.rep,1,'The observed native wrap completes one reading');
  assert.equal(f.t.L.seekDebtMs||0,0,'The matching seeking event must not discard the next word');
  nextWord(f);assert.equal(f.raw.rep,2);assert.equal(f.raw.totalDone,2);
  assert.ok(Math.abs(f.t.L.mediaProgressMs-6000)<.001);
 });
 for(const direction of ['backward','forward'])check(`${kind}: timeupdate before explicit ${direction} seeking cannot earn a reading`,()=>{
  const f=fixture(kind);
  if(direction==='forward'){f.t.L.mediaProgressMs=1000;f.t.L.lastCurrent=1;}
  f.clock(10);f.a.currentTime=direction==='backward'?1:3;f.a.seeking=true;
  f.emit('onTime');f.emit('onSeeking');
  assert.equal(f.raw.rep,0,'A cursor jump with seeking=true is not a completed reading');
  assert.equal(f.t.L.mediaProgressMs,0);
 });
 for(const order of [['onSeeking','onTime'],['onTime','onSeeking']])check(`${kind}: native wrap order ${order.join('/')} remains valid while seeking=true`,()=>{
  const f=fixture(kind);f.a.seeking=true;wrap(f,order);f.emit('onTime');
  assert.equal(f.raw.rep,1);assert.equal(f.t.L.seekDebtMs||0,0);
  f.a.seeking=false;nextWord(f);assert.equal(f.raw.rep,2);
 });
 check(`${kind}: repeated timeupdate at the same boundary does not double-credit`,()=>{
  const f=fixture(kind);wrap(f);for(let i=0;i<5;i++)f.emit('onTime');assert.equal(f.raw.rep,1);assert.equal(f.t.L.mediaProgressMs,3000);
 });
 check(`${kind}: an ordinary backward seek cannot complete a reading`,()=>{
  const f=fixture(kind);f.clock(10);f.a.currentTime=1;f.a.seeking=true;f.emit('onSeeking');
  assert.equal(f.raw.rep,0);assert.equal(f.t.L.mediaProgressMs,0);assert.equal(f.t.L.seekDebtMs,2000);
  f.a.seeking=false;f.clock(1000);f.a.currentTime=2;f.emit('onTime');assert.equal(f.raw.rep,0);assert.equal(f.t.L.mediaProgressMs,0);
 });
 check(`${kind}: a forward seek cannot combine two fragments into a reading`,()=>{
  const f=fixture(kind);f.t.L.mediaProgressMs=1000;f.t.L.lastCurrent=1;f.a.currentTime=2.8;f.a.seeking=true;f.emit('onSeeking');
  assert.equal(f.raw.rep,0);assert.equal(f.t.L.mediaProgressMs,0);assert.ok(Math.abs(f.t.L.seekDebtMs-200)<.001);
  f.a.seeking=false;f.clock(200);f.a.currentTime=0;f.emit('onTime');assert.equal(f.raw.rep,0);assert.ok(Math.abs(f.t.L.mediaProgressMs)<.001);
 });
 for(const invalid of ['pause','frozen','changed-source','new-lease','expired','new-position'])check(`${kind}: consumed wrap evidence does not survive ${invalid}`,()=>{
  const f=fixture(kind);f.clock(100);f.a.currentTime=0;f.emit('onTime');assert.equal(f.raw.rep,1);
  if(invalid==='pause'){f.a.paused=true;f.emit('onPause')}
  if(invalid==='frozen')f.t.L.frozen=true;
  if(invalid==='changed-source')f.a.src='blob:replacement';
  if(invalid==='new-lease')f.t.L.seq++;
  if(invalid==='expired')f.clock(501);
  if(invalid==='new-position')f.a.currentTime=.02;
  f.emit('onSeeking');assert.equal(f.raw.rep,1,'No seeking event invents a completed reading');
  if(invalid==='changed-source'){assert.equal(f.t.L.mediaProgressMs,3000);return;}
  assert.ok(f.t.L.seekDebtMs>2900,'Unmatched seeking retains the conservative rebase');
 });
 check(`${kind}: loop seeking evidence is consumed once`,()=>{
  const f=fixture(kind);wrap(f);f.emit('onSeeking');assert.equal(f.raw.rep,1);assert.equal(f.t.L.seekDebtMs,3000);
 });
}
const report={suite:'r1248 native journey loop event order',passed:results.filter(x=>x.passed).length,total:results.length,results,
 limitations:['Exact shipped transport with controlled media events; no physical Samsung screen-lock or speaker-output verification.']};
console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
