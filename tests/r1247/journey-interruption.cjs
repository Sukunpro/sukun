'use strict';
// Exact shipped journey loops and watchdogs: regress delayed background interruption.
// Providers, media observations and the wall clock are controlled test seams.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=require('../helpers/shipped-shell.cjs').readShippedShell(path.join(root,'index.html'));
const output=process.argv[3]?path.resolve(process.argv[3]):null;
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function slice(start,end){const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a,'shipped boundary: '+start);return html.slice(a,b);}
const sources={28:slice('const BS=window.BERHET_SEYIR=', '/* ═══ KENDİ SESLERİM — MEDYA KÜTÜPHANESİ'),99:slice('const ES=window.ESMA99_SEYIR=','function registerAudio(){')};
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function fixture(kind,hidden=false){
 let now=0,serial=0,owned=true;const timers=new Map(),listeners=new Map(),nodes=new Map(),reads=[],cuts=[],events=[],saves=[],completions=[];
 const prefix=kind===28?'bs':'es99',cat=kind===28?'berhet':'esma',key=kind===28?'berhet:6':'esma:6:nida';
 const bg={owner:'journey',active:false,phase:'PLAYING',blocked:false,preparing:false,lockRecoveryPending:false};
 const transport={active:true,owner:'journey'+kind,key,index:6,playing:true};let recovery=false;const recoveryChecks=[];
 function node(id){if(!nodes.has(id))nodes.set(id,{id,value:id===prefix+'Mode'?'custom':id===prefix+'Gap'?'1000':id===prefix+'Custom'?'702':'',hidden:false,textContent:'',dataset:{},style:{},options:[{value:'1000'}],setAttribute(){},removeAttribute(){},addEventListener(){},querySelector(){return null;},append(){}});return nodes.get(id);}
 const listen=(scope,type,fn)=>{const key=scope+':'+type;if(!listeners.has(key))listeners.set(key,[]);listeners.get(key).push(fn);};
 const c={window:null,document:{hidden,readyState:'loading',getElementById:node,addEventListener:(t,fn)=>listen('document',t,fn)},
  Z:{cat,idx:0,target:1,count:0,devir:0,total:0,tempo:1},ZIKIR:{[cat]:{items:Array.from({length:kind},(_,i)=>({tr:'Item '+i,t:'Item '+i,a:'',eb:1}))}},
  Math,Promise,Number,String,Object,Date:{now:()=>now},console,
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
  setTimeout(fn,ms=0){const id=++serial;timers.set(id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),
  addEventListener:(t,fn)=>listen('window',t,fn),dispatchEvent:e=>{events.push(e);for(const fn of listeners.get('window:'+e.type)||[])fn(e);},
  LS:{get:(_k,d)=>d,set:(...x)=>saves.push(x)},S:{get:(_k,d)=>d,set:(...x)=>saves.push(x)},
  SukunTabOwner:{owns:()=>owned,cancelPending(){},retire(){},defer:(_k,fn)=>owned&&fn(),run:(_k,fn)=>owned&&fn()},
  AudioLife:{userPaused:false,markUserPlay(){this.userPaused=false;},markInterruption(){},recover:()=>Promise.resolve()},
  SukunSecretPolicy:{unlocked:()=>true},SukunVoiceSessionCoordinator:{prepareJourney(){},release(){}},
  SukunForegroundArbiter:{snapshot:()=>({owner:null})},SukunBackgroundAudioOwner:{snapshot:()=>({...bg})},
  SukunLockJourneyTransportV2:{settle(){},handoff(){},ownsProgress:()=>false,ownsRecovery(...args){recoveryChecks.push(args);return recovery;},snapshot:()=>({...transport})},
  SukunJourneyCompletion:{complete:x=>completions.push(x)},
  SukunZikirRep(){c.Z.count++;c.Z.total++;},
  r168TtsCancel:why=>cuts.push(why),speechSynthesis:{cancel:()=>cuts.push('tts-cancel')},sesDurdur:why=>cuts.push(why),
  ensureTargetOpt(){},zTempoSync(){},zTempoSet(){},zUI(){},renderZikir(){},renderCats(){},saveSettings(){},sukunReport(){},LOG:[],Z_TEMPO_MIN:.18,
  zKat:()=>c.Z.cat,zIdx:()=>c.Z.idx,zEbcedDegeri:it=>it.eb,ebced:()=>1
 };
 c.window=c;c.$=node;c.sleep=ms=>new Promise(resolve=>c.setTimeout(resolve,ms));
 c.R168={AudioResolver:{play(category,index,item,options){return new Promise(resolve=>reads.push({category,index,options,resolve,at:now}));}}};c.AudioResolver=c.R168.AudioResolver;
 vm.createContext(c);vm.runInContext(sources[kind],c,{filename:'shipped-'+kind+'-journey.js'});
 const st=c[kind===28?'BERHET_SEYIR':'ESMA99_SEYIR'],api=c[kind===28?'SukunBerhetiyyeSeyir':'SukunEsma99Seyir'];
 async function advance(ms){await flush();const until=now+ms;let steps=0;while(true){const next=[...timers].filter(([,x])=>x.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;assert(++steps<10000,'bounded timer drain');timers.delete(next[0]);now=next[1].at;next[1].fn();await flush();}now=until;await flush();}
 return{c,st,api,reads,cuts,timers,events,nodes,completions,key,bg,transport,recoveryChecks,setRecovery:value=>recovery=value,flush,advance,setOwner:value=>owned=value,fire(scope,type){for(const fn of listeners.get(scope+':'+type)||[])fn({type});},node,
  finish(index=reads.length-1,result={ok:true,source:'recording'}){reads[index].resolve(result);return flush();},
  setNative(){c.__sukJourneyNative={recordingKey:key,a:{src:'blob:test',paused:true,ended:false,readyState:4,_sukunFinish:(ok,reason)=>cuts.push('native:'+reason),pause:()=>cuts.push('native:pause')}};},
  async start(){st.i=6;st.rep=310;st.totalDone=1600;api.play();await flush();},
  async hold(){api.pause();await flush();st.systemHold=true;}
 };
}
const results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.stack||String(e)});}}
function unchanged(f){
 assert.equal(f.st.i,6,'interruption must retain the selected name');
 assert.equal(f.st.rep,310,'interruption must not credit an unfinished word');
 assert.equal(f.st.totalDone,1600,'previous journey progress must survive');
 assert.equal(f.c.Z.total,0,'no unheard completion may enter the global count');
}
function held(f){
 unchanged(f);assert.equal(f.st.run,false);assert.equal(f.st.paused,true);
 assert.equal(f.st.systemHold,true,'an uncommanded native interruption must remain resumable');
 assert.equal(f.reads.length,1,'an interrupted owner must not race a second native caller');
 assert(!f.cuts.some(reason=>/user-stop|user-pause|seyir-stop|esma99-stop/.test(reason)),'system interruption is not user Stop/Pause');
}
(async()=>{
 for(const kind of [28,99]){
  for(const reason of ['native-lease-blocked','background-native-interrupted','native-interrupted']){
   await test(`${kind}: hidden ${reason} preserves a resumable journey and its heard count`,async()=>{
    const f=fixture(kind,true);await f.start();await f.finish(0,{ok:false,source:'recording',reason});
    held(f);await f.advance(120000);held(f);
   });
  }
  await test(`${kind}: an observed interrupted native lease suppresses blind transient retries`,async()=>{
   const f=fixture(kind,true);await f.start();f.setNative();Object.assign(f.bg,{active:true,phase:'INTERRUPTED'});
   await f.finish(0,{ok:false,source:'recording',reason:'playback-stalled'});await f.advance(1500);
   held(f);
  });
  await test(`${kind}: visible return resumes the held name once after repeated wake events`,async()=>{
   const f=fixture(kind,true);await f.start();await f.finish(0,{ok:false,source:'recording',reason:'native-lease-blocked'});held(f);
   f.c.document.hidden=false;f.fire('document','visibilitychange');f.fire('window','pageshow');f.fire('window','pageshow');await f.advance(200);
   assert.equal(f.reads.length,2);assert.equal(f.st.run,true);assert.equal(f.st.paused,false);assert.equal(f.st.systemHold,false);unchanged(f);
   assert.equal(f.reads[1].index,6);assert.equal(f.reads[1].options.isCurrent(),true);f.api.stop();
  });
  for(const action of ['pause','stop'])await test(`${kind}: explicit ${action} cancels a delayed interruption wake`,async()=>{
   const f=fixture(kind,true);await f.start();await f.finish(0,{ok:false,source:'recording',reason:'native-lease-blocked'});held(f);
   f.c.document.hidden=false;f.fire('document','visibilitychange');f.fire('window','pageshow');f.api[action]();await f.advance(120000);
   assert.equal(f.reads.length,1);assert.equal(f.st.run,false);assert.equal(f.st.paused,action==='pause');assert.equal(f.st.systemHold,false);unchanged(f);
  });
  await test(`${kind}: watchdog leaves bounded recovery intact then holds the failed native lease`,async()=>{
   const f=fixture(kind,true);await f.start();f.setNative();Object.assign(f.bg,{active:true,phase:'INTERRUPTED',lockRecoveryPending:true});f.setRecovery(true);
   const attempt=f.st.attemptSeq;await f.advance(kind===28?90000:95000);
   assert.equal(f.st.attemptSeq,attempt,'watchdog retired a recovery still owned by the source');
   assert.equal(f.reads[0].options.isCurrent(),true);assert.deepEqual(f.cuts,[]);unchanged(f);
   assert(f.recoveryChecks.some(args=>args[0]==='journey'+kind&&args[1]===f.key&&args[2]===6),'grace must check the exact owner/key/index');
   f.setRecovery(false);f.bg.lockRecoveryPending=false;await f.advance(10000);held(f);
  });
  await test(`${kind}: Stop during pending recovery wins over watchdog and late source success`,async()=>{
   const f=fixture(kind,true);await f.start();f.setNative();Object.assign(f.bg,{active:true,phase:'INTERRUPTED',lockRecoveryPending:true});f.setRecovery(true);
   await f.advance(kind===28?90000:95000);f.api.stop();await f.finish();f.setRecovery(false);await f.advance(120000);
   assert.equal(f.reads.length,1);assert.equal(f.st.run,false);assert.equal(f.st.paused,false);assert.equal(f.st.systemHold,false);unchanged(f);
  });
 }
 const report={suite:'r1247 exact journey interruption',sourceRoot:root,sourceSha256:hash(fs.readFileSync(path.join(root,'index.html'))),sourceFragmentsSha256:Object.fromEntries(Object.entries(sources).map(([key,value])=>[key,hash(value)])),testSha256:hash(fs.readFileSync(__filename)),passed:results.filter(x=>x.passed).length,total:results.length,results,limitations:['Node VM runs exact shipped journey owners with controlled native state, providers and timer delivery. No physical Android or audible-output claim.']};
 if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
