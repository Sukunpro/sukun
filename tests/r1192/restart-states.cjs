'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('nero.html','utf8'),ui=fs.readFileSync('assets/runtime/interface-r920.js','utf8');
function method(text){const start=text.indexOf('restartAll(){'),open=text.indexOf('{',start);let depth=1,i=open+1;while(depth){if(text[i]==='{')depth++;if(text[i]==='}')depth--;i++;}return text.slice(open+1,i-1)}
for(const kind of ['28','99'])for(const phase of ['idle','running','paused','completed']){
 const at=kind==='28'?html.indexOf("version:'r549'"):html.indexOf("version:'r553'",html.indexOf('r553-esma99-secret-runtime'));
 const state={run:phase==='running',paused:phase==='paused',systemHold:false,i:phase==='completed'?Number(kind):8,rep:7,totalDone:150,_r1074Selection:{i:8}},calls=[];
 const reset={click(){calls.push('reset');Object.assign(state,{run:false,paused:false,systemHold:false,i:0,rep:0,totalDone:0})}};
 const api={play(){assert.equal(state.i,0);assert.equal(state.rep,0);calls.push('play');return true}};
 const w={SukunSecretPolicy:{unlocked:()=>true},SukunTabOwner:{owns:()=>true},SukunBerhetiyyeSeyir:api,SukunEsma99Seyir:api};
 const pause=()=>{calls.push('pause');state.run=false;state.paused=true};
 assert.equal(new Function('window','BS','ES','document','$','seyirKes','stop',method(html.slice(at)))(w,state,state,{getElementById:()=>reset},()=>reset,pause,pause),true);
 assert.deepEqual(calls,phase==='running'||phase==='paused'?['pause','reset','play']:['reset','play']);assert.equal(state._r1074Selection,null);
}
const handler=ui.match(/\$\('r920JourneyRestartAll'\)\.onclick=async\(\)=>\{([\s\S]*?)\n \};/)[1];
const run=new Function('snap','allowed','window','command','wake','queue',`return(async()=>{${handler}})()`);
(async()=>{for(const mode of ['esma','berhet'])for(const journeyKind of ['single',mode==='esma'?'99':'28']){
 let calls=[],confirm=true;const s={activeMode:mode,journeyKind,smartSession:null};const w={I18N:{lang:'tr'},confirm:()=>confirm,toast(){}};
 const command=async(a,o)=>{calls.push([a,o]);return{accepted:true}};
 await run(()=>s,()=>true,w,command,()=>{},()=>{});
 assert.deepEqual(calls.map(x=>x[0]),journeyKind==='single'?['select','restart-journey']:['restart-journey']);
 calls=[];confirm=false;await run(()=>s,()=>true,w,command,()=>{},()=>{});assert.equal(calls.length,0);
 }
 console.log('PASS: both engines restart idle/running/paused/completed; single-name UI selects whole journey; cancellation changes nothing.');
})().catch(e=>{console.error(e);process.exitCode=1});
