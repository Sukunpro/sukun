'use strict';
// Execute actual preparation, WAV packing, cadence and session read models.
// Metadata/decode/media are controlled boundaries; speaker output is not measured.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'nero.html'),'utf8');
const sessionCode=fs.readFileSync(path.join(root,'assets/runtime/session-r919.js'),'utf8');
function between(start,end){const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert(a>=0&&b>a,'production boundary '+start);return html.slice(a,b)}
function wav(frames,sr){
 const bytes=frames*2,buffer=new ArrayBuffer(44+bytes),v=new DataView(buffer);
 const word=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i))};
 word(0,'RIFF');v.setUint32(4,36+bytes,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,bytes,true);
 return buffer;
}
function preparation({fx=true,metadataMs=0,seconds=1.98,rate=1}={}){
 const noop=()=>{},timers=new Map();let nextTimer=0,nextUrl=0,decodes=0;
 const blob=new Blob(['synthetic recording bytes'],{type:'audio/webm'}),sr=10000;
 const owner={epoch:7,intent:3},c={Blob,ArrayBuffer,DataView,Uint8Array,Float32Array,Math,Number,String,Object,Promise,Set,
  Date:{now:()=>10000},setTimeout(fn,delay){timers.set(++nextTimer,{fn,delay});return nextTimer},clearTimeout:id=>timers.delete(id),
  URL:{createObjectURL:()=>`blob:synthetic-${++nextUrl}`,revokeObjectURL:noop},document:{hidden:false},
  Z:{cat:'esma',idx:0,auto:true,tempo:1,tick:false},KAYIT:{yankiMik:.5,mekan:true},OKUMA_HIZ:rate,
  _r476PrepareSeq:0,_r477FxBuildSeq:0,_r477FxCacheSig:'',_r477FxUrl:'',_r477FxCycleMs:0,_r477FxDurationMs:0,_r980FxUnitSec:0,_r980FxRepeats:1,
  _r476Prepared:{key:''},_r476RecUrl:'',_r476LockAudio:null,_r476SilentUrl:'blob:silent',_r476Hidden:null,_r949PrepareTask:null,_r1010MissingRecording:null,
  R1009_FOREGROUND_PREPARE_TIMEOUT:3000,REC_DB:{revision:()=>0},
  zikirKey:()=> 'esma:0:nida',r476CurrentText:()=>({txt:'Yâ Rahmân'}),r1010RecordingSelection:()=>({cat:'esma',index:0}),r1010RecordingLookupSignature:()=> 'same-recording',
  r1007ReadRecording:async()=>({blob,key:'esma:0:nida',revision:0}),r476ProbeDuration:async()=>metadataMs,
  r477FxSignature:()=> `esma:0:nida|${rate}`,r946RetireLockUrl:noop,r946ReleaseLockUrls:noop,r978ApplyPreparedLockSource:noop,r1009PreparationStage:noop,r946LockDiagnostic:noop,r1007RecordStartupFailure:noop,
  SukunTabOwner:{snapshot:()=>owner},SukunVoiceSettings:{capture:()=>()=>true,epoch:()=>0,recordingAllowed:()=>true},
  SukunAudioPreparation:{createUrl:()=>`blob:synthetic-${++nextUrl}`},
  r653DecodeAudioBlob:async(_blob,opt)=>{
   decodes++;const decoded={duration:seconds,length:Math.round(seconds*sr),sampleRate:sr,numberOfChannels:1};
   return opt.use(decoded,{check:noop,cpu:async({frames})=>({wav:wav(frames,sr)}),createUrl:()=>`blob:fx-${++nextUrl}`});
  }
 };
 c.window=c;vm.createContext(c);
 vm.runInContext(between('async function r980RepeatWav(','let _r949PrepareTask=null;'),c);
 if(!fx)c.r477RenderLockTrack=async()=>null;
 vm.runInContext(between('async function r949PrepareCore(task){','/* r978'),c);
 vm.runInContext(between('function zAutoTempoMs(){','function zSessizTamamla(n){'),c);
 const task={ownerEpoch:7,ownerIntent:3,fxSig:c.r477FxSignature(),controller:new AbortController(),cancel:noop};c._r949PrepareTask=task;
 return {c,timers,blob,task,decodes:()=>decodes,run:()=>c.r949PrepareCore(task)};
}
function sessionFixture({kind='silent',lockKey='esma:0:nida',expectedKey='esma:0:nida',owner='single',active=true,playing=true,sourceKind='baked',lockActive=true,pathKind='single-recording',phase='PLAYING'}={}){
 const listeners=new Map(),document={hidden:false,visibilityState:'visible',readyState:'loading',body:{classList:{contains:()=>false}},querySelector:()=>null,addEventListener(){}};
 let commands=0;
 const z={cat:'esma',idx:0,name:'Yâ Rahmân',auto:true,count:808,target:9999,length:99};
 const c={Object,Number,String,Math,Date,Promise,document,navigator:{},queueMicrotask:()=>{},CustomEvent:class{constructor(type,opt){this.type=type;this.detail=opt?.detail}},
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)},dispatchEvent(){},
  currentZikirState:{snapshot:()=>z},currentFlowState:{snapshot:()=>({source:{kind:'none'}})},SukunVoiceSource:{snapshot:()=>({kind,label:kind==='silent'?'SES KAPALI':'Cihaz sesi'})},
  SukunR698Transport:{snapshot:()=>({direct:{auto:true}}),presentation:()=>({paused:phase==='PAUSED'})},
  SukunAudioTruth:{snapshot:()=>({state:'playing'})},SukunSourceState:{kind:'recording',reason:'Kendi kayıt · aynı ses dosyası'},
  SukunBackgroundAudioOwner:{snapshot:()=>({owner,active,phase})},
  SukunLockAudio:{snapshot:()=>({path:pathKind,active:lockActive,playing,sourceKind,paused:!playing}),anahtar:()=>lockKey,beklenenAnahtar:()=>expectedKey},
  PlaybackController:{play(){commands++},pause(){commands++}},SukunAudioSessionRegistry:{aggregateSnapshot:()=>({paused:phase==='PAUSED'})}
 };
 c.window=c;vm.createContext(c);vm.runInContext(sessionCode,c);
 return {c,z,snapshot:()=>c.SukunSessionState.snapshot(),commands:()=>commands};
}
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
(async()=>{
 for(const fx of [true,false])for(const rate of [.5,1,2])await test(`${fx?'FX':'packed'} decoded duration survives unavailable metadata at rate ${rate}`,async()=>{
  const f=preparation({fx,rate});assert.equal(await f.run(),true);const p=f.c._r476Prepared;
  assert.equal(p.durationMs,1980,'successful decoding must retain the original voice duration');
  const expected=Math.max(1000,1980/rate+40);assert(Math.abs(p.cycleMs-expected)<.01,'applied cadence completes original clip plus minimum gap');
  assert.equal(f.c.Z.tempo,1,'selected tempo must stay unchanged');assert.equal(f.timers.size,0);
  const snapshot=f.c.SukunCadence.snapshot();assert.equal(snapshot.recordingAvailable,true);assert.equal(snapshot.recordingMs,1980);assert(Math.abs(snapshot.effectiveMs-expected)<.01);
  const applied={src:p.fxUrl||p.url,currentSrc:p.fxUrl||p.url,dataset:{sukLockKey:'esma:0:nida',sukRepeatUnitSec:String(p.unitMediaSec)},playbackRate:rate,paused:false,ended:false,readyState:4,duration:p.unitMediaSec*p.repeatCycles};f.c._r476LockAudio=applied;
  assert(Math.abs(f.c.SukunCadence.snapshot().appliedCycleMs-expected)<.01);
  if(fx){const previous=f.decodes();const cached=await f.c.r477RenderLockTrack(f.blob,'esma:0:nida',{recordingKey:'esma:0:nida',recordingRevision:0});assert.equal(f.decodes(),previous);assert.equal(cached.durationMs,1980,'cached FX must preserve decoded duration');}
 });
 await test('decoded duration replaces a rounded browser metadata estimate',async()=>{const f=preparation({metadataMs:1900});assert.equal(await f.run(),true);assert.equal(f.c._r476Prepared.durationMs,1980);assert.equal(f.c._r476Prepared.cycleMs,2020)});
 await test('known prepared original remains available when its duration is unknown',()=>{const f=preparation();f.c._r476Prepared={key:'esma:0:nida',blob:f.blob,url:'blob:raw',durationMs:0,playRate:1};const s=f.c.SukunCadence.snapshot();assert.equal(s.recordingAvailable,true);assert.equal(s.recordingMs,0);assert.equal(s.appliedCycleMs,null)});
 for(const kind of ['silent','idle','tts'])for(const phase of ['PLAYING','PAUSED','INTERRUPTED'])await test(`matching accepted single recording overrides stale ${kind} label in ${phase}`,()=>{const f=sessionFixture({kind,phase,playing:phase==='PLAYING'});const s=f.snapshot();assert.equal(s.audioSource,'USER_RECORDING');assert.equal(s.recordingSource,'USER_RECORDING');assert.equal(s.sourceLabel,'Kendi kayıt · aynı ses dosyası');assert.equal(f.commands(),0);assert.equal(f.z.count,808)});
 await test('unrelated recent TTS text cannot relabel the accepted recording',()=>{const f=sessionFixture();f.c.SukunSourceState={kind:'tts',reason:'Cihaz sesi kullanılıyor'};const s=f.snapshot();assert.equal(s.audioSource,'USER_RECORDING');assert.equal(s.sourceLabel,'Kendi kayıt');assert.equal(f.commands(),0)});
 for(const options of [{lockKey:'esma:1:nida'},{expectedKey:''},{owner:'journey'},{active:false},{lockActive:false},{sourceKind:'none'},{pathKind:'tts'}])await test(`unmatched/native silent source cannot claim voice ownership ${JSON.stringify(options)}`,()=>{const f=sessionFixture(options);assert.equal(f.snapshot().audioSource,'SILENCE');assert.equal(f.commands(),0);assert.equal(f.z.count,808)});
 const report={method:'Actual production preparation, WAV packing and read models with controlled metadata/decode/media; physical audibility is not measured.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
