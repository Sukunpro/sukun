'use strict';
// Execute the shipped terminal reconciler with controlled provider state.
// No physical audio or Samsung screen-lock acceptance is claimed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(process.env.SUKUN_TEST_HTML||path.join(root,'index.html'),'utf8');
const source=html.split('<script id="r654-terminal-audio-reconcile">')[1]?.split('</script>')[0];
assert.ok(source,'Production terminal reconciler must exist');

function fixture({kind='28',hold=false,failure='native-lease-blocked',intent='play',userPaused=false}={}){
  const state={run:false,paused:true,systemHold:hold,lastFailure:failure,i:6,rep:310,totalDone:1421};
  const events=new Map(),timers=new Map(),calls={stops:0,intents:[],pauseReconciles:0};let next=0;
  const machine={intent:{type:intent},activeJourney:hold?'journey'+kind:null};
  const api={state:()=>({...state}),stop(){calls.stops++;state.run=false;state.paused=false;state.systemHold=false;}};
  const window={
    addEventListener(name,fn){if(!events.has(name))events.set(name,[]);events.get(name).push(fn)},
    SukunAudioTruth:{snapshot:()=>({tangible:false})},
    SukunJourneyAudioMachine:{snapshot:()=>machine,pauseIntentActive:()=>machine.intent.type==='pause',intent(type,reason){machine.intent={type};calls.intents.push({type,reason});}},
    SukunAudioSessionRegistry:{aggregateSnapshot:()=>({paused:userPaused}),reconcilePauseGate(){calls.pauseReconciles++;},sync(){}},
    AudioLife:{reconcileUserPaused(){calls.pauseReconciles++;}},
    SukunAudioHub:{userPaused},PlaybackController:{sync(){}},SukunNowPlayingStore:{refresh(){}},currentFlowState:{refresh(){}},
    [kind==='28'?'SukunBerhetiyyeSeyir':'SukunEsma99Seyir']:api
  };
  vm.runInNewContext(source,{window,Date,String,Math,Object,setTimeout(fn){timers.set(++next,fn);return next;},clearTimeout(id){timers.delete(id)}},{filename:'r654-terminal-audio-reconcile'});
  const reconcile=()=>window.SukunTerminalAudioReconcile.reconcile('controlled-media-interruption');
  return{window,state,machine,calls,reconcile};
}

const results=[];
function check(name,fn){try{fn();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.message});}}
for(const kind of ['28','99']){
  for(const hold of [false,true])check(`${kind}: ${hold?'system hold':'source error'} remains resumable across repeated cleanup`,()=>{
    const f=fixture({kind,hold}),before={...f.state};
    for(let i=0;i<4;i++)f.reconcile();
    assert.equal(f.calls.stops,0,'A missing physical voice must not stop an unfinished journey');
    assert.equal(f.calls.intents.length,0,'An interrupted journey must not acquire a fabricated Complete intent');
    assert.deepEqual(f.state,before,'Name, count, totals and paused/hold state must survive');
    assert.equal(f.calls.pauseReconciles,0,'A held journey must retain its pause authority');
  });
  check(`${kind}: explicit user pause stays paused`,()=>{
    const f=fixture({kind,intent:'pause',userPaused:true});f.reconcile();f.reconcile();
    assert.equal(f.calls.stops,0);assert.equal(f.calls.intents.length,0);assert.equal(f.state.paused,true);
  });
  for(const intent of ['stop','complete'])check(`${kind}: explicit ${intent} still cleans the terminal provider`,()=>{
    const f=fixture({kind,intent});f.reconcile();f.reconcile();
    assert.equal(f.calls.stops,1);assert.equal(f.state.paused,false);assert.equal(f.state.systemHold,false);
    assert.equal(f.state.rep,310);assert.equal(f.state.totalDone,1421);
  });
  check(`${kind}: explicitly stopped failure remains terminal`,()=>{
    const f=fixture({kind,failure:'stopped'});f.reconcile();
    assert.equal(f.calls.stops,1);assert.equal(f.state.paused,false);
  });
  check(`${kind}: running journey is never cleaned`,()=>{
    const f=fixture({kind});f.state.run=true;f.state.paused=false;f.reconcile();
    assert.equal(f.calls.stops,0);assert.equal(f.calls.intents.length,0);
  });
}
check('Fully idle provider may still reconcile terminal state',()=>{
  const f=fixture();f.state.paused=false;f.state.lastFailure='';f.reconcile();
  assert.equal(f.calls.stops,0);assert.equal(f.calls.intents.length,1);
  assert.equal(f.calls.intents[0].type,'complete');
});
const failed=results.filter(x=>!x.passed);
console.log(JSON.stringify({suite:'r1247 terminal interruption preservation',total:results.length,passed:results.length-failed.length,failed:failed.length,scope:'Exact shipped reconciler in Node VM; controlled state and events, no native-device/audio claim.',results},null,2));
if(failed.length)process.exitCode=1;
