'use strict';
// Reuse the existing event/transaction storage model with the actual REC_DB,
// catalog and priority lock; only media/TTS and the separate bank are leaves.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=function environment(root){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const storageFile=path.join(__dirname,'../recording-storage.cjs'),storage=fs.readFileSync(storageFile,'utf8');
 const boundary=storage.indexOf('const results=[];');assert(boundary>0);
 const exported={exports:{}};
 vm.runInNewContext(storage.slice(0,boundary)+'\nmodule.exports={fixture,bounded};',{
  require,__dirname:path.dirname(storageFile),process:{argv:['node',storageFile,path.join(root,'index.html')]},module:exported,
  console,Blob,AbortController,Uint8Array,setImmediate,setTimeout,clearTimeout,setInterval,clearInterval
 },{filename:storageFile});
 const f=exported.exports.fixture(),c=f.context,reads=[],played=[],tts=[],commands=[],sourceUpdates=[],genericCalls=[];
 const original=f.test.db.get.bind(f.test.db);f.test.db.get=(key,opt)=>{reads.push(key);return original(key,opt)};
 let genericEnabled=true,genericEpoch=1,genericHook=null,playHook=null,owned=true,tabEpoch=1,tabIntent=1;
 const bank=new Map(),settings=new Map(),bankId='b'.repeat(64);
 const generic={
  snapshot:()=>({enabled:genericEnabled,epoch:genericEpoch}),epoch:()=>genericEpoch,
  signature:keys=>genericEnabled?'archive:'+genericEpoch+':'+bankId+':'+keys.filter(key=>bank.has(key)).join(','):'archive:off',
  hasKnown:keys=>genericEnabled&&keys.some(key=>bank.has(key)),
  async find(keys,opt={}){
   genericCalls.push({keys:[...keys],reads:[...reads]});
   if(genericHook)return genericHook(keys,opt);
   if(!genericEnabled)return null;
   const canonicalKey=keys.find(key=>bank.has(key));if(!canonicalKey)return null;
   return{key:'archive:'+bankId+':'+canonicalKey,canonicalKey,blob:bank.get(canonicalKey),revision:0,generic:true,genericEpoch};
  }
 };
 Object.assign(c,{
  S:{get:(key,fallback)=>settings.has(key)?settings.get(key):fallback,set:(key,value)=>settings.set(key,value)},
  SukunGenericRecordings:generic,
  SukunTabOwner:{owns:()=>owned,snapshot:()=>({epoch:tabEpoch,intent:tabIntent})},
  AudioLife:{_userIntentSeq:1,markUserPause:reason=>commands.push(['intent-pause',reason])},
  SukunAudioSessionRegistry:{pauseAll:reason=>commands.push(['pause-all',reason])},
  SukunSessionState:{snapshot:()=>({phase:'IDLE'}),command:async action=>{commands.push(['session',action]);return true},refresh(){}},
  SukunVoiceSource:{set:(...args)=>sourceUpdates.push(args)},
  playRecording:async(blob,name,opt)=>{played.push({blob,name,opt});return playHook?playHook(blob,name,opt):{ok:true,reason:'ended'}},
  zikirTtsAwait:async(text,interrupt,lang,voice,rate,pitch,isCurrent)=>{tts.push({text,lang,voice,rate,pitch,isCurrent});return true},
  ttsPromise:async(text,lang,isCurrent)=>{tts.push({text,lang,isCurrent,device:true});return true},
  spkPitch:value=>value,sukunTtsCancel(){},r485NiyetKey:()=> 'selected',
  speechSynthesis:{cancel(){},speak(){}},$ : ()=>null
 });
 Object.assign(c.document,{hidden:false,getElementById:()=>null,body:{classList:{contains:()=>false}}});
 const extract=(start,end)=>{const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a,'production boundary '+start);return html.slice(a,b)};
 vm.runInContext(extract('function sukunNameTtsText(','\nfunction r476CanonicalItem()'),c);
 vm.runInContext("const SPK={on:true,rate:.9,arRate:.85,arPitch:.9,arOn:false,voice:{name:'Synthetic Turkish',lang:'tr-TR'},arVoice:{name:'Synthetic Arabic',lang:'ar-SA'}};const ZIKIR={esma:{items:[]},berhet:{items:[]}};ZIKIR.esma.items[7]={tr:'Yâ Rahmân',ar:'يَا رَحْمَٰن',status:'verified'};ZIKIR.berhet.items[7]={tr:'Yâ Berhet',ar:'يَا بَرْهَت',status:'verified'};const zItem=()=>ZIKIR[Z.cat]?.items[Z.idx]||null;",c);
 vm.runInContext(extract('window.SukunReadingPolicy=(()=>{','/* r922: persisted reading preference;'),c);
 vm.runInContext(extract('function ttsTemizle(t){','/* Bir bölümün tüm okunabilir parçalarını'),c);
 vm.runInContext(extract('window.SukunVoiceSettings=(()=>{',"  /* '', 'f' (kadın), 'm' (erkek) */"),c);
 vm.runInContext(extract('window.SukunVoiceAttempt=Object.freeze({','const SukunVoiceResolver=window.SukunVoiceResolver=(()=>{'),c);
 vm.runInContext(extract('function keyFor(cat,idx,item){','let R168_TTS_FINISH='),c);
 vm.runInContext(extract('const SukunVoiceResolver=window.SukunVoiceResolver=(()=>{','window.AudioResolver=R168.AudioResolver={'),c);
 c.AudioResolver={play:(...args)=>c.SukunVoiceResolver.playItem(...args),has:async()=>false};
 c.SukunRecordingPriorityLock.install();
 const flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve()};
 return{...f,c,reads,played,tts,commands,sourceUpdates,genericCalls,bank,generic,flush,
  blob:(text='generic')=>new Blob([text],{type:'audio/wav'}),
  item:()=>vm.runInContext('zItem()',c),
  play:(opt={})=>c.SukunVoiceResolver.playItem('esma',7,vm.runInContext('zItem()',c),opt),
  current:(opt={})=>c.SukunVoiceResolver.playCurrentZikir(opt),
  setGeneric(value){genericEnabled=value;genericEpoch++},bumpGeneric(){genericEpoch++},
  genericFind(fn){genericHook=fn},playResult(fn){playHook=fn},
  select(cat='esma',idx=8){vm.runInContext('Z.cat='+JSON.stringify(cat)+';Z.idx='+Number(idx),c)},
  owner(value){owned=value},lease(){tabEpoch++},intent(){c.AudioLife._userIntentSeq++},
  state:()=>vm.runInContext('({cat:Z.cat,idx:Z.idx,form:Z.form})',c),
  async releaseOpen(){f.faults.open=null;for(const complete of f.heldOpens.splice(0))complete();await flush()},
  async pending(){f.faults.open='hold';const work=c.SukunVoiceResolver.playItem('esma',7,vm.runInContext('zItem()',c));await flush();assert.equal(f.heldOpens.length,1);return{work}},
  signature:()=>c.SukunRecordingPriorityLock.signature('esma',7,vm.runInContext('zItem()',c))
 };
};
