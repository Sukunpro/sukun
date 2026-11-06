'use strict';
// Production haptic, transaction, manual-feedback and correction functions.
// Synthetic navigator only: this does not verify a physical phone vibration.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function between(a,b){const s=html.indexOf(a),e=html.indexOf(b,s);assert(s>=0&&e>s,a);return html.slice(s,e)}
function fixture({vib=true,manual=null,supported=true,throws=false}={}){
 const pulses=[],sounds=[],timers=[];const c={document:{hidden:false,readyState:'loading',body:{classList:{contains:()=>false}},getElementById:()=>null,addEventListener(){}},
  navigator:supported?{vibrate(p){if(throws)throw Error('unsupported device');pulses.push(JSON.parse(JSON.stringify(p)));return true}}:{},
  Z:{cat:'esma',idx:0,count:2,total:10,target:3,devir:0,vib,tick:false,auto:false},ZVOL:1,
  S:{get:(key,fallback)=>key==='sukun.manualFeedback.vibration'?manual:fallback,set(){}},
  addEventListener(){},dispatchEvent(){},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},
  ctx:{state:'running'},tickSnd(){sounds.push('tick')},zikirSonuSes(){sounds.push('end')},tozSac(){},zikirTamam(){},zUI(){},ac(){},pulseZ(){},zikirSesliAktifMi:()=>false,
  SukunTabOwner:{owns:()=>true},SukunSessionState:{snapshot:()=>({phase:'IDLE',journeyKind:'single',count:c.Z.count,target:c.Z.target,activeMode:'esma',activeIndex:0,canonical:{mode:'esma',index:0}})},
  setTimeout(fn,delay){timers.push({fn,delay});return timers.length},clearTimeout(){},Math,Number,String,Object,Date,Promise,Set};
 c.ZIKIR={esma:{items:[{t:'Synthetic',tr:'Synthetic'}]}};c.zKat=()=>c.Z.cat;c.zIdx=()=>c.Z.idx;c.zItem=()=>c.ZIKIR.esma.items[0];
 c.window=c;vm.createContext(c);
 vm.runInContext(between('window.SukunHaptics=window.SukunHaptics||{','/* r566:'),c);
 vm.runInContext(between('window.SukunManualFeedback=(()=>{','/* r976: one human-requested reading'),c);
 vm.runInContext(between('window.SukunManualVoice=(()=>{','/* r976 manual voice end */'),c);
 vm.runInContext(between('window.SukunCountCorrection=(()=>{','function rep(){'),c);
 vm.runInContext(between('function rep(){','/* ── Uzun kayıt altyapısı'),c);
 return{c,pulses,sounds,timers,transaction:()=>c.SukunZikirTransaction.prepare({cat:'esma',idx:0,target:3})};
}
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name)}
test('automatic target commits one devir signature and duplicate commit cannot repeat it',()=>{
 const f=fixture(),t=f.transaction();assert.equal(f.c.SukunZikirTransaction.commit(t),true);assert.deepEqual(f.pulses,[[22,34,34]]);assert.equal(f.c.SukunZikirTransaction.commit(t),false);assert.equal(f.pulses.length,1);
});
test('automatic final rep has its ordinary pulse and one completion signature',()=>{const f=fixture();f.c.rep();assert.deepEqual(f.pulses,[10,[22,34,34]]);assert.equal(f.c.Z.devir,1)});
test('automatic opt-out suppresses all target vibration',()=>{const f=fixture({vib:false});f.c.rep();assert.deepEqual(f.pulses,[])});
test('silent catchup completion produces no vibration or tone',()=>{const f=fixture();f.c.__r476SilentCatchup=true;f.c.rep();assert.deepEqual(f.pulses,[]);assert.deepEqual(f.sounds,[])});
test('plain manual target completion produces exactly one completion signature',()=>{
 const f=fixture();assert.equal(f.c.SukunManualFeedback.perform(()=>{f.c.rep();return true}),true);assert.equal(f.c.Z.devir,1);assert.deepEqual(f.pulses,[[22,34,34]]);
});
for(const settings of [{vib:false},{manual:false}])test('manual preference opt-out '+JSON.stringify(settings),()=>{const f=fixture(settings);f.c.SukunManualFeedback.perform(()=>{f.c.rep();return true});assert.deepEqual(f.pulses,[])});
test('saved manual vibration preference stays independent from automatic toggle',()=>{const f=fixture({vib:false,manual:true});f.c.SukunManualFeedback.perform(()=>{f.c.rep();return true});assert.deepEqual(f.pulses,[[22,34,34]])});
for(const settings of [{supported:false},{throws:true}])test('unsupported/refused vibration is a safe no-op '+JSON.stringify(settings),()=>{const f=fixture(settings);f.c.SukunManualFeedback.perform(()=>{f.c.rep();return true});assert.equal(f.c.Z.devir,1);assert.deepEqual(f.pulses,[])});
test('remaining edit and its inverse correction neither vibrate nor complete target',()=>{
 const f=fixture();f.c.Z.target=100;const api=f.c.SukunCountCorrection;
 assert.equal(api.setRemaining(41),true);assert.equal(f.c.Z.count,59);assert.equal(api.set(2),true);assert.equal(f.c.Z.count,2);assert.deepEqual(f.pulses,[]);assert.deepEqual(f.sounds,[]);assert.equal(f.c.Z.devir,0);
});
test('manual voice confirmed target produces one completion pulse without an extra tick',()=>{
 const f=fixture();f.c.SukunManualVoice={enabled:()=>true,committing:()=>true};f.c.SukunManualFeedback.set('beat',true);
 f.c.SukunManualFeedback.perform(()=>{f.c.rep();return true});assert.equal(f.c.Z.devir,1);assert.deepEqual(f.pulses,[[22,34,34]]);assert.deepEqual(f.sounds,['end']);
});
test('full journey helper uses existing preference and completion pattern',()=>{const f=fixture();f.c.SukunHaptics.tamam();assert.deepEqual(f.pulses,[[28,40,42,48,56]]);f.c.Z.vib=false;f.c.SukunHaptics.tamam();assert.equal(f.pulses.length,1)});
test('ordinary manual voiced commit adds no vibration or tick',()=>{const f=fixture();f.c.Z.target=100;f.c.SukunManualVoice={enabled:()=>true,committing:()=>true};f.c.SukunManualFeedback.set('beat',true);f.c.SukunManualFeedback.perform(()=>{f.c.rep();return true});assert.deepEqual(f.pulses,[]);assert.deepEqual(f.sounds,[])});
for(const settings of [{manual:false},{vib:false},{supported:false},{throws:true}])test('manual voiced completion honors preference and platform '+JSON.stringify(settings),()=>{const f=fixture(settings);f.c.SukunManualVoice={enabled:()=>true,committing:()=>true};f.c.SukunManualFeedback.perform(()=>{f.c.rep();return true});assert.equal(f.c.Z.devir,1);assert.deepEqual(f.pulses,[])});
test('nested manual action gives one completion signature',()=>{const f=fixture();f.c.SukunManualFeedback.perform(()=>f.c.SukunManualFeedback.perform(()=>{f.c.rep();return true}));assert.deepEqual(f.pulses,[[22,34,34]])});
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve()};
(async()=>{
 for(const success of [true,false]){
  const f=fixture();let resolve;f.c.SukunVoiceResolver={playItem:()=>new Promise(r=>{resolve=r})};f.c.SukunManualVoice.set(true);f.c.SukunManualFeedback.set('beat',true);
  const action=()=>{f.c.rep();return true};assert.equal(f.c.SukunManualFeedback.perform(action),true);await flush();assert.equal(f.c.Z.count,2);assert.deepEqual(f.pulses,[12]);assert.deepEqual(f.sounds,['tick']);
  // A second tap while the real production voice owner is busy is rejected.
  assert.equal(f.c.SukunManualFeedback.perform(action),false);assert.deepEqual(f.pulses,[12]);
  resolve({ok:success});await flush();for(const timer of f.timers.splice(0))if(timer.delay===0)timer.fn();await flush();
  assert.equal(f.c.Z.devir,success?1:0);assert.deepEqual(f.pulses,success?[12,[22,34,34]]:[12]);assert.deepEqual(f.sounds,success?['tick','end']:['tick']);
  passed++;console.log('PASS production manual voice '+(success?'verified completion only':'failure does not complete or vibrate'));
 }
 console.log(JSON.stringify({passed,method:'Production functions with synthetic navigator and controlled voice result; physical device not tested'}));
})().catch(e=>{console.error(e);process.exitCode=1});
