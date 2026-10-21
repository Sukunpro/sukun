'use strict';
// Exact shipped 28/99 journey owners, loops, watchdogs and wake listeners.
// DOM, voice providers and timer delivery are explicit controlled seams.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const output=process.argv[3]?path.resolve(process.argv[3]):null;
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function slice(start,end){const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a,'shipped boundary: '+start);return html.slice(a,b);}
const sources={28:slice('const BS=window.BERHET_SEYIR=', '/* ═══ KENDİ SESLERİM — MEDYA KÜTÜPHANESİ'),99:slice('const ES=window.ESMA99_SEYIR=','function registerAudio(){')};
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function fixture(kind,hidden=false){
 let now=0,serial=0,owned=true;const timers=new Map(),listeners=new Map(),nodes=new Map(),reads=[],cuts=[],events=[],saves=[],completions=[];
 const prefix=kind===28?'bs':'es99',cat=kind===28?'berhet':'esma',key=kind===28?'berhet:0':'esma:0:nida';
 function node(id){if(!nodes.has(id))nodes.set(id,{id,value:id===prefix+'Mode'?'1':id===prefix+'Gap'?'1000':id===prefix+'Custom'?'33':'',hidden:false,textContent:'',dataset:{},style:{},options:[{value:'1000'}],setAttribute(){},removeAttribute(){},addEventListener(){},querySelector(){return null;},append(){}});return nodes.get(id);}
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
  SukunForegroundArbiter:{snapshot:()=>({owner:null})},SukunBackgroundAudioOwner:{snapshot:()=>({blocked:false})},
  SukunLockJourneyTransportV2:{settle(){},handoff(){},ownsProgress:()=>false},
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
 return{c,st,api,reads,cuts,timers,events,nodes,completions,key,flush,advance,setOwner:value=>owned=value,fire(scope,type){for(const fn of listeners.get(scope+':'+type)||[])fn({type});},node,
  finish(index=reads.length-1,result={ok:true,source:'recording'}){reads[index].resolve(result);return flush();},
  setNative(){c.__sukJourneyNative={recordingKey:key,a:{_sukunFinish:(ok,reason)=>cuts.push('native:'+reason),pause:()=>cuts.push('native:pause')}};},
  async start(){api.play();await flush();},
  async hold(){api.pause();await flush();st.systemHold=true;}
 };
}
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.stack||String(e)});}}
(async()=>{
for(const kind of [28,99]){
 for(const hidden of [false,true]){
  await test(`${kind}: ${hidden?'hidden':'visible'} duplicate play/resume is one active reading`,async()=>{const f=fixture(kind,hidden);await f.start();const token=f.st.token;f.api.play();f.api.resume();f.api.resume();await f.flush();assert.equal(f.reads.length,1);assert.equal(f.st.token,token);f.api.stop();});
  await test(`${kind}: ${hidden?'hidden':'visible'} stale watchdog cannot cut a resumed same-name source`,async()=>{const f=fixture(kind,hidden);await f.start();await f.advance(1000);f.api.pause();f.api.resume();await f.flush();f.setNative();const attempt=f.st.attemptSeq;f.cuts.length=0;await f.advance((hidden?(kind===28?90000:95000):(kind===28?26000:35000))-1000);assert.equal(f.st.attemptSeq,attempt,'retired watchdog changed current attempt');assert.equal(f.reads.at(-1).options.isCurrent(),true);assert.deepEqual(f.cuts,[],'retired source cut current native/TTS');assert.equal(f.st.totalDone,0);f.api.stop();});
  await test(`${kind}: ${hidden?'hidden':'visible'} stop wins over unresolved and late successful provider`,async()=>{const f=fixture(kind,hidden);await f.start();f.api.stop();await f.finish();await f.advance(100000);assert.equal(f.st.run,false);assert.equal(f.st.paused,false);assert.equal(f.st.totalDone,0);assert.equal(f.c.Z.total,0);});
  await test(`${kind}: ${hidden?'hidden':'visible'} completion credits once, then gap advances only current item`,async()=>{const f=fixture(kind,hidden);await f.start();assert.equal(f.c.Z.total,0);await f.finish();assert.equal(f.st.rep,1);assert.equal(f.st.totalDone,1);assert.equal(f.c.Z.total,1);assert.equal(f.c.Z.count,1);await f.advance(999);assert.equal(f.reads.length,1);await f.advance(1);assert.equal(f.st.i,1);assert.equal(f.reads.length,2);assert.equal(f.c.Z.count,0);assert.equal(f.reads[1].options.gapAlreadyWaited,true);f.api.stop();});
  await test(`${kind}: ${hidden?'hidden':'visible'} pause during gap retains credit without launching next item`,async()=>{const f=fixture(kind,hidden);await f.start();await f.finish();f.api.pause();await f.advance(2000);assert.equal(f.st.totalDone,1);assert.equal(f.reads.length,1);f.api.resume();await f.flush();assert.equal(f.st.i,1);assert.equal(f.reads.length,2);assert.equal(f.st.totalDone,1);f.api.stop();});
  await test(`${kind}: ${hidden?'hidden':'visible'} next/previous retire old completion without credit`,async()=>{const f=fixture(kind,hidden);await f.start();f.api.next();await f.flush();f.api.previous();await f.flush();await f.finish(0);await f.finish(1);assert.equal(f.st.i,0);assert.equal(f.st.totalDone,0);assert.equal(f.reads.length,3);await f.finish(2);assert.equal(f.st.totalDone,1);f.api.stop();});
  await test(`${kind}: ${hidden?'hidden':'visible'} provider stalls are bounded and never counted`,async()=>{const f=fixture(kind,hidden);await f.start();await f.advance(hidden?300000:90000);assert.equal(f.st.run,false);assert.equal(f.st.paused,true);assert.equal(f.st.systemHold,hidden);assert.equal(f.st.totalDone,0);assert.equal(f.c.Z.total,0);assert.equal(f.reads.length,hidden?3:2);});
 }
 for(const action of ['stop','pause','new-play','hidden','lost-owner'])await test(`${kind}: delayed pageshow recovery respects newer ${action}`,async()=>{const f=fixture(kind);await f.start();await f.hold();f.fire('window','pageshow');if(action==='stop')f.api.stop();if(action==='pause')f.api.pause();if(action==='new-play')f.api.play();if(action==='hidden')f.c.document.hidden=true;if(action==='lost-owner')f.setOwner(false);await f.flush();const count=f.reads.length;await f.advance(121);assert.equal(f.reads.length,count,'delayed wake started an obsolete reading');if(action==='stop')assert.equal(f.st.run,false);f.api.stop();});
 await test(`${kind}: visible wake and repeated pageshow recover a held journey exactly once`,async()=>{const f=fixture(kind);await f.start();await f.hold();f.fire('document','visibilitychange');f.fire('window','pageshow');f.fire('window','pageshow');await f.advance(200);assert.equal(f.reads.length,2);assert.equal(f.st.run,true);f.api.stop();});
 await test(`${kind}: lost ownership is checked before a stale running flag can short-circuit Resume`,async()=>{const f=fixture(kind);await f.start();f.setOwner(false);const requests=[];f.c.SukunTabOwner.defer=(name,fn)=>{requests.push({name,fn});return false;};const result=vm.runInContext(kind===28?'seyirSurdur(false)':'resume(false)',f.c);assert.equal(result,false);assert.equal(requests.length,0);vm.runInContext(kind===28?'seyirSurdur(true)':'resume(true)',f.c);assert.equal(requests.length,1);assert.equal(f.reads.length,1);f.api.stop();});
 await test(`${kind}: native Start button toggles running pause/resume without duplicate reads`,async()=>{const f=fixture(kind);vm.runInContext(kind===28?'bindSeyir();':'bind();',f.c);f.node((kind===28?'bs':'es99')+'Start').onclick();await f.flush();assert.equal(f.reads.length,1);f.node((kind===28?'bs':'es99')+'Start').onclick();await f.flush();assert.equal(f.st.run,false);assert.equal(f.st.paused,true);assert.equal(f.reads.length,1);f.node((kind===28?'bs':'es99')+'Start').onclick();await f.flush();assert.equal(f.st.run,true);assert.equal(f.reads.length,2);f.api.stop();});
 await test(`${kind}: final heard reading completes once and explicit replay starts at first item`,async()=>{const f=fixture(kind);f.st.i=kind-1;await f.start();await f.finish();assert.equal(f.st.run,false);assert.equal(f.st.i,kind);assert.equal(f.completions.length,1);assert.equal(f.st.totalDone,1);await f.advance(100000);assert.equal(f.completions.length,1);await f.start();assert.equal(f.st.i,0);assert.equal(f.reads.length,2);f.api.stop();});
}
const report={suite:'r1121 exact journey lifecycle',sourceRoot:root,sourceSha256:hash(html),sourceFragmentsSha256:Object.fromEntries(Object.entries(sources).map(([key,value])=>[key,hash(value)])),testSha256:hash(fs.readFileSync(__filename)),passed:results.filter(x=>x.passed).length,total:results.length,results,limitations:['Node VM runs exact shipped journey owners with controlled DOM, voice providers and timer delivery; not native audio/Android lockscreen evidence.']};if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify(report,null,2));if(results.some(x=>!x.passed))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
