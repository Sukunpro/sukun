'use strict';
// Actual human-count, paused-correction and manual-voice commit owners.
// DOM, selected state and voice-result endpoints are synthetic and isolated.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function between(start,end){const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a,'production boundary '+start);return html.slice(a,b)}
function fixture(){
 const events=[],manualSteps=[],jobs=new Map(),listeners=new Map();let seq=0,phase='IDLE',owned=true,journeyKind='single';
 const document={hidden:false,readyState:'loading',getElementById:()=>null,querySelector:()=>null,addEventListener(){}};
 const c={window:null,document,navigator:{},Math,Number,String,Object,Promise,Date:{now:()=>100000},Set,
  Z:{cat:'esma',idx:0,count:2,total:10,target:0,vib:false,tick:false,auto:false},ZVOL:1,
  S:{get:(_key,value)=>value,set(){}},ZIKIR:{esma:{items:[{t:'Rahmân',tr:'Yâ Rahmân'}]}},
  zKat:()=>c.Z.cat,zIdx:()=>c.Z.idx,zItem:()=>c.ZIKIR.esma.items[0],zikirSesliAktifMi:()=>false,
  ac(){},pulseZ(){},zUI(){},SukunTabOwner:{owns:()=>owned,defer:()=>false},
  SukunSessionState:{snapshot:()=>({phase,count:c.Z.count,journeyKind,activeMode:c.Z.cat,activeIndex:c.Z.idx,canonical:{mode:c.Z.cat,index:c.Z.idx}})},
  SukunAudioTruth:{snapshot:()=>({pendingPhysical:false})},SukunR698Transport:{snapshot:()=>({})},
  SukunWheelMotion:{manualStep(){manualSteps.push({total:Number(c.Z.total),count:Number(c.Z.count)});return true;}},
  setTimeout(fn,delay){const id=++seq;jobs.set(id,{fn,delay});return id},clearTimeout:id=>jobs.delete(id),
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)},
  dispatchEvent(event){events.push(event);for(const fn of listeners.get(event.type)||[])fn(event);return true}
 };
 c.window=c;vm.createContext(c);
 vm.runInContext(between('window.SukunManualFeedback=(()=>{','/* r976: one human-requested reading'),c);
 vm.runInContext(between('window.SukunManualVoice=(()=>{','/* r976 manual voice end */'),c);
 vm.runInContext(between('const SukunManualCounter=(()=>{','// A disabled native count button'),c);
 vm.runInContext(between('window.SukunCountCorrection=(()=>{','function rep(){'),c);
 vm.runInContext(between('function rep(){','/* ── Uzun kayıt altyapısı'),c);
 const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve()};
 return{c,document,jobs,flush,
  steps:()=>manualSteps,phase:value=>{phase=value},owner:value=>{owned=value},journey:value=>{journeyKind=value},
  async zero(){for(const[id,job]of [...jobs])if(job.delay===0){jobs.delete(id);job.fn()}await flush()},
  voice(){let resolve;const result=new Promise(r=>resolve=r);c.SukunVoiceResolver={playItem:()=>result};c.SukunManualVoice.set(true);return resolve}
 };
}
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
(async()=>{
 await test('accepted idle manual reading calls one mini-step after the production counter changes',()=>{
  const f=fixture(),before=f.c.Z.total;assert.equal(f.c.SukunManualCounter.count(),true);assert.equal(f.c.Z.count,3);assert.equal(f.c.Z.total,before+1);assert.equal(f.steps().length,1);assert.equal(f.steps()[0].total,before+1,'presentation observes an already committed credit');
 });
 await test('nested paused correction calls one mini-step and does not start media or resume auto',()=>{
  const f=fixture();f.phase('PAUSED');assert.equal(f.c.SukunManualCounter.count(),true);assert.equal(f.c.Z.count,3);assert.equal(f.steps().length,1);assert.equal(f.c.Z.auto,false);assert.equal(f.c.SukunManualVoice.busy(),false);
 });
 await test('manual -1 correction never calls a forward mini-step',()=>{
  const f=fixture();f.phase('PAUSED');assert.equal(f.c.SukunCountCorrection.adjust(-1),true);assert.equal(f.c.Z.count,1);assert.equal(f.steps().length,0);
 });
 for(const phase of ['PLAYING','PREPARING','ERROR'])await test(`blocked ${phase} count neither credits nor signals a manual turn`,()=>{
  const f=fixture();f.phase(phase);if(phase==='PLAYING')f.c.Z.auto=true;assert.equal(f.c.SukunManualCounter.count(),false);assert.equal(f.c.Z.count,2);assert.equal(f.steps().length,0);
 });
 await test('hidden and lost-owner count attempts never call a mini-step',()=>{
  const f=fixture();f.document.hidden=true;assert.equal(f.c.SukunManualCounter.count(),false);assert.equal(f.steps().length,0);f.document.hidden=false;f.owner(false);assert.equal(f.c.SukunCountCorrection.adjust(1),false);assert.equal(f.steps().length,0);
 });
 await test('direct automatic rep and imported count updates never call a mini-step',()=>{
  const f=fixture();f.c.Z.auto=true;f.c.rep();assert.equal(f.c.Z.count,3);assert.equal(f.steps().length,0);f.c.Z.count=100;f.c.Z.total=200;assert.equal(f.steps().length,0);
 });
 await test('true action without an actual +1 cannot call a mini-step',()=>{
  const f=fixture();assert.equal(f.c.SukunManualFeedback.perform(()=>true,1),true);assert.equal(f.steps().length,0);
 });
 await test('successful target completion still calls one step after the count resets',()=>{
  const f=fixture(),before=f.c.Z.total;f.c.Z.target=3;f.c.ZikirTransitionTxn={prepare:()=>({txid:1})};f.c.r482CommitTransition=()=>{f.c.Z.count=0;f.c.Z.devir=1;return true};
  assert.equal(f.c.SukunManualCounter.count(),true);assert.equal(f.c.Z.count,0);assert.equal(f.c.Z.total,before+1);assert.equal(f.steps().length,1);assert.equal(f.steps()[0].count,0,'total guard covers a confirmed target reset');
 });
 for(const [kind,cat,variable,apiName,saveName,uiName]of [['28','berhet','BS','SukunBerhetiyyeSeyir','seyirSave','seyirUI'],['99','esma','ES','SukunEsma99Seyir','save','ui']])await test(`paused journey ${kind} commits through its selected production owner and calls one step`,()=>{
  const f=fixture(),c=f.c,st={i:0,run:false,paused:true,systemHold:false,rep:2,totalDone:2,token:10,attemptSeq:3};let saves=0,updates=0;
  f.phase('PAUSED');f.journey(kind);c.Z.cat=cat;c.Z.target=100;c[variable]=st;c.ZIKIR[cat]={items:[{t:'Synthetic'}]};c.SukunSecretPolicy={unlocked:()=>true};c[saveName]=()=>saves++;c[uiName]=()=>updates++;c.repeatCount=c.countFor=()=>100;
  const start=html.indexOf(`adjustCount(delta){const it=ZIKIR.${cat}.items[${variable}.i]`),end=html.indexOf('},',start)+1;assert(start>=0&&end>start,'production journey correction boundary');
  c[apiName]=Object.assign({state:()=>st},vm.runInContext('({'+html.slice(start,end)+'})',c));
  assert.equal(c.SukunManualCounter.count(),true);assert.equal(st.rep,3);assert.equal(c.Z.count,3);assert.equal(c.Z.total,11);assert.equal(st.token,11);assert.equal(st.attemptSeq,4);assert.equal(st.paused,true);assert.equal(st.run,false);assert.equal(saves,1);assert.equal(updates,1);assert.equal(f.steps().length,1);
 });
 await test('a presentation exception cannot undo or reject an accepted manual credit',()=>{
  const f=fixture();f.c.SukunWheelMotion.manualStep=()=>{throw Error('synthetic compositor failure')};assert.equal(f.c.SukunManualCounter.count(),true);assert.equal(f.c.Z.count,3);assert.equal(f.c.Z.total,11);
 });
 await test('ManualVoice request waits for verified completion before +1 and one turn',async()=>{
  const f=fixture(),complete=f.voice();assert.equal(f.c.SukunManualCounter.count(),true);await f.flush();assert.equal(f.c.Z.count,2);assert.equal(f.steps().length,0);assert.equal(f.c.SukunManualVoice.busy(),true);
  complete({ok:true});await f.flush();await f.zero();await f.flush();assert.equal(f.c.Z.count,3);assert.equal(f.steps().length,1);assert.equal(f.c.SukunManualVoice.busy(),false);
 });
 for(const failure of ['failed','selection','hidden'])await test(`ManualVoice ${failure} completion gives no reading and no turn`,async()=>{
  const f=fixture(),complete=f.voice();assert.equal(f.c.SukunManualCounter.count(),true);await f.flush();
  if(failure==='selection')f.c.Z.idx=1;if(failure==='hidden')f.document.hidden=true;
  complete({ok:failure!=='failed'});await f.flush();await f.zero();assert.equal(f.c.Z.count,2);assert.equal(f.steps().length,0);
 });
 const report={method:'Production human feedback, counter/correction and manual-voice owners with controlled result/DOM endpoints; no browser compositor or audible device claim.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
