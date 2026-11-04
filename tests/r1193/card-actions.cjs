'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function fixture(kind){
 const states={'28':{i:8,rep:7,totalDone:150,run:false,paused:false},'99':{i:12,rep:9,totalDone:330,run:false,paused:false}},calls=[];
 let selected='single',unlocked=true,confirmed=true;
 const w={I18N:{lang:'tr'},toast(){},confirm:()=>confirmed,SukunSecretPolicy:{unlocked:()=>unlocked},SukunBerhetiyyeSeyir:{state:()=>states['28']},SukunEsma99Seyir:{state:()=>states['99']}};
 w.SukunSessionState={snapshot:()=>({journeyKind:selected}),async command(action,opts){calls.push({action,opts});if(action==='select'){selected=opts.journeyKind;assert.equal(opts.index,undefined)}if(action==='resume')states[selected].run=true;if(action==='stop'){states[selected].run=false;states[selected].paused=false}if(action==='restart-journey')Object.assign(states[selected],{i:0,rep:0,totalDone:0,run:true});return {accepted:true}}};
 const doc={readyState:'loading',addEventListener(){},getElementById(){return null}};
 vm.runInNewContext(fs.readFileSync('assets/runtime/journey-panels-r1193.js','utf8'),{window:w,document:doc,Object,requestAnimationFrame(){}});
 return {act:a=>w.SukunJourneyPanelControls.act(kind,a),states,calls,select:k=>selected=k,lock:()=>unlocked=false,cancel:()=>confirmed=false};
}
(async()=>{
 for(const kind of ['28','99']){
  const f=fixture(kind),before={...f.states[kind]},other=kind==='28'?'99':'28',otherBefore={...f.states[other]};
  assert.equal(await f.act('resume'),true);assert.deepEqual(f.calls.map(x=>x.action),['select','resume']);
  for(const key of ['i','rep','totalDone'])assert.equal(f.states[kind][key],before[key]);
  assert.equal(await f.act('stop'),true);assert.equal(f.states[kind].run,false);assert.equal(f.states[kind].rep,before.rep);
  assert.equal(await f.act('restart'),true);assert.equal(f.states[kind].i,0);assert.equal(f.states[kind].rep,0);assert.equal(f.states[kind].run,true);assert.deepEqual(f.states[other],otherBefore);
  const cancel=fixture(kind);cancel.cancel();assert.equal(await cancel.act('restart'),false);assert.equal(cancel.calls.length,0);
  const complete=fixture(kind);complete.states[kind].i=Number(kind);assert.equal(await complete.act('resume'),false);assert.equal(complete.calls.length,0);
  const foreign=fixture(kind);foreign.select(other);foreign.states[kind].paused=true;assert.equal(await foreign.act('stop'),false);assert.equal(foreign.calls.length,0);
 }
 const locked=fixture('28');locked.lock();assert.equal(await locked.act('resume'),false);
 const esma=fixture('99');esma.lock();assert.equal(await esma.act('resume'),true);
 console.log('PASS: 28/99 resume keeps name/count, stop keeps checkpoint, restart resets only chosen journey, cancel/complete/foreign stop/lock guards.');
})().catch(e=>{console.error(e);process.exitCode=1});
