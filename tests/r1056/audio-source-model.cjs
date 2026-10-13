'use strict';
// Actual passive session derivation and shared presentation API. No media,
// device, network or real profile is used; physical audibility is not measured.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/session-r919.js'),'utf8');
function fixture({kind='recording',label='KENDİ KAYIT',origin=null,native=false,nativeOrigin=null,nativeKey='esma:0:nida',expectedKey='esma:0:nida',owner='single',active=true,phase='PLAYING'}={}){
 const handlers=new Map(),commands=[],z={cat:'esma',idx:0,name:'Yâ Rahmân',auto:phase!=='IDLE',count:33,countRaw:33,target:99,length:99,session:{paused:phase==='PAUSED'}};
 const resolver={kind,label,recordingOrigin:origin},single={path:'single-recording',active:native,playing:phase==='PLAYING',paused:phase==='PAUSED',sourceKind:'baked',recordingOrigin:nativeOrigin};
 const bg={active,owner,phase:phase==='INTERRUPTED'?'INTERRUPTED':phase==='PAUSED'?'PAUSED':'PLAYING'};
 const document={hidden:false,visibilityState:'visible',readyState:'loading',body:{classList:{contains:()=>false}},querySelector:()=>null,addEventListener(){}};
 const context={Object,Number,String,Math,Date,Promise,document,navigator:{},I18N:{lang:'tr'},
  queueMicrotask(){},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},
  addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,[]);handlers.get(type).push(fn)},dispatchEvent(){},
  currentZikirState:{snapshot:()=>z},currentFlowState:{snapshot:()=>({source:{kind:'none'}})},
  SukunVoiceSource:{snapshot:()=>resolver},SukunSourceState:{kind:'recording',reason:label},SukunVoiceSettings:{getMode:()=> 'auto'},
  SukunR698Transport:{snapshot:()=>({direct:{auto:z.auto}}),presentation:()=>({paused:phase==='PAUSED',failed:false})},
  SukunAudioTruth:{snapshot:()=>({owner:'auto-zikir',state:phase.toLowerCase()})},
  SukunBackgroundAudioOwner:{snapshot:()=>bg},
  SukunLockAudio:{snapshot:()=>single,anahtar:()=>nativeKey,beklenenAnahtar:()=>expectedKey},
  SukunAudioSessionRegistry:{aggregateSnapshot:()=>({paused:phase==='PAUSED'}),pauseAll(){commands.push('pause')},resumeAll(){commands.push('resume')}},
  PlaybackController:{play(){commands.push('play')},pause(){commands.push('pause')}},fetch(){throw Error('read model must not fetch')},
  localStorage:{setItem(){throw Error('read model must not write settings')}}
 };
 context.window=context;vm.createContext(context);vm.runInContext(source,context,{filename:'session-r919.js'});
 return{c:context,z,resolver,single,bg,commands,handlers,snapshot:()=>context.SukunSessionState.snapshot(),text:context.SukunAudioSourceText};
}
const results=[];async function test(name,work){try{await work();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:String(error.stack||error)})}}
(async()=>{
 for(const phase of ['PLAYING','PAUSED','INTERRUPTED'])for(const origin of ['personal','generic'])await test(`${phase} accepted native ${origin} wins stale opposite badge and keeps historic playback enum`,()=>{
  const f=fixture({native:true,nativeOrigin:origin,origin:origin==='personal'?'generic':'personal',label:origin==='personal'?'GENERIC VOICE ARCHIVE':'KENDİ KAYIT',phase});
  const s=f.snapshot();assert.equal(s.audioSource,'USER_RECORDING');assert.equal(s.recordingSource,'USER_RECORDING');assert.equal(s.sourceOrigin,origin);assert.equal(s.recordingOrigin,origin);
  assert.equal(s.sourceMetadata.provenance,'native-single');assert(Object.isFrozen(s.sourceMetadata));assert.equal(f.text.label(s,'tr'),origin==='personal'?'Kendi kaydın':'Jenerik kayıt');assert.equal(f.text.label(s,'en'),origin==='personal'?'Your recording':'Generic recording');
  assert.equal(s.count,33);assert.equal(f.z.count,33);assert.equal(f.commands.length,0);
 });
 for(const origin of ['personal','generic'])await test(`resolver ${origin} metadata has priority over a misleading translated label`,()=>{
  const f=fixture({origin,label:origin==='personal'?'Genel ses arşivi':'KENDİ KAYIT'}),s=f.snapshot();assert.equal(s.sourceOrigin,origin);assert.equal(s.sourceMetadata.provenance,'resolver');assert.equal(f.commands.length,0);
 });
 for(const label of ['Jenerik kayıt','Genel ses arşivi','General voice archive','GENERIC RECORDING'])await test(`legacy source ${label} remains an archive label without new producer metadata`,()=>{
  const f=fixture({label}),s=f.snapshot();assert.equal(s.sourceOrigin,'generic');assert.equal(f.text.label(s,'en'),'Generic recording');
 });
 for(const choice of ['arabic','turkish'])await test(`explicit ${choice} device source ignores stale recording metadata`,()=>{
  const f=fixture({kind:'tts',origin:'generic',label:'Jenerik kayıt'});f.c.SukunVoiceSettings.getMode=()=>choice;const s=f.snapshot();assert.equal(s.audioSource,'TTS');assert.equal(s.sourceOrigin,'device');assert.equal(s.recordingOrigin,null);assert.equal(f.text.label(s,'tr'),'Cihaz sesi');assert.equal(f.text.label(s,'en'),'Device voice');assert(f.text.explanation(s,'en').includes(choice==='arabic'?'Arabic':'Turkish'));assert.equal(f.commands.length,0);
 });
 await test('a foreign native canonical key cannot overwrite current resolver origin',()=>{
  const f=fixture({origin:'personal',native:true,nativeOrigin:'generic',nativeKey:'esma:1:nida'});assert.equal(f.snapshot().sourceOrigin,'personal');assert.equal(f.snapshot().sourceMetadata.provenance,'resolver');
 });
 await test('a stale generic badge after quieting an idle session does not claim a recording',()=>{
  const f=fixture({kind:'silent',origin:'generic',label:'Jenerik kayıt',phase:'IDLE'}),s=f.snapshot();assert.equal(s.audioSource,'SILENCE');assert.equal(s.sourceOrigin,'none');assert.equal(s.recordingOrigin,null);assert.equal(f.text.label(s,'tr'),'Ses kapalı');assert.equal(f.commands.length,0);
 });
 await test('between-word idle badge retains accepted generic origin within the same session',()=>{
  const f=fixture({origin:'generic',label:'Genel ses arşivi'});const before=f.snapshot();f.resolver.kind='idle';f.resolver.label='HAZIR';f.resolver.recordingOrigin=null;const after=f.snapshot();assert.equal(after.audioSource,'USER_RECORDING');assert.equal(after.sourceOrigin,'generic');assert.equal(after.sourceMetadata.provenance,'retained');assert.equal(after.epoch,before.epoch);assert.equal(f.text.label(after,'tr'),'Jenerik kayıt');
 });
 await test('name change fences between-word retained source metadata',()=>{
  const f=fixture({origin:'generic'});const before=f.snapshot();f.z.idx=1;f.z.name='Yâ Rahîm';f.resolver.kind='idle';f.resolver.recordingOrigin=null;f.resolver.label='HAZIR';const after=f.snapshot();assert(after.epoch>before.epoch);assert.equal(after.sourceOrigin,'none');assert.equal(after.recordingOrigin,null);assert.equal(f.commands.length,0);
 });
 for(const origin of ['personal','generic'])await test(`${origin} recording failure label stays specific without starting a fallback`,()=>{
  const f=fixture({kind:'error',origin,label:origin==='personal'?'KENDİ KAYIT AÇILAMADI':'GENEL SES ARŞİVİ AÇILAMADI'});f.c.SukunRecordingFailure={get:()=>({active:true,cat:'esma',index:0,key:'esma:0:nida',message:'Controlled failure'})};const s=f.snapshot();assert.equal(s.phase,'ERROR');assert.equal(s.sourceOrigin,origin);assert.equal(f.text.label(s,'tr'),origin==='personal'?'Kendi kaydın açılamadı':'Jenerik kayıt açılamadı');assert.equal(f.commands.length,0);assert.equal(s.count,33);
 });
 await test('unknown source failure is not attributed to a personal recording',()=>{
  const f=fixture({kind:'error',label:'Ses hatası'}),s=f.snapshot();assert.equal(s.sourceOrigin,'error');assert.equal(s.recordingOrigin,null);assert.equal(f.text.label(s,'en'),'Audio is unavailable');
 });
 for(const origin of [null,'personal','generic','device'])await test(`preparation label is truthful for ${origin||'unknown'} source`,()=>{
  const f=fixture();const s={audioSource:origin===null?'PREPARING':origin==='device'?'TTS':'USER_RECORDING',recordingOrigin:origin,phase:'PREPARING'};
  assert.equal(f.text.label(s,'tr'),origin==='personal'?'Kendi kaydın hazırlanıyor':origin==='generic'?'Jenerik kayıt hazırlanıyor':origin==='device'?'Cihaz sesi hazırlanıyor':'Ses hazırlanıyor');
  assert(f.text.label(s,'en').startsWith('Preparing'));assert.equal(f.commands.length,0);
 });
 await test('shared TR and EN chain keeps optional archive between personal and device audio',()=>{
  const f=fixture();assert.equal(f.text.chain('tr'),'Kendi kaydın → etkin jenerik arşiv → cihaz sesi');assert.equal(f.text.chain('en'),'Your recording → enabled generic archive → device voice');assert(f.text.modeNote('auto','tr').includes('etkin jenerik'));assert(f.text.modeNote('auto','en').includes('enabled generic'));
 });
 await test('shared labels refresh language without playback/count/storage changes',()=>{
  const f=fixture({origin:'generic'}),before=f.snapshot();assert.equal(f.text.label(before),'Jenerik kayıt');f.c.I18N.lang='en';const after=f.snapshot();assert.equal(f.text.label(after),'Generic recording');assert.equal(after.epoch,before.epoch);assert.equal(after.count,before.count);assert.equal(f.commands.length,0);
 });
 for(const [kind,expected]of [['local-recording','Local recording'],['reader-recording','Recorded reader']])await test(`legacy ${kind} retains its separate human label`,()=>{
  const f=fixture({kind,label:'External reader'}),s=f.snapshot();assert.equal(s.sourceOrigin,'other');assert.equal(f.text.label(s,'en'),expected);
 });
 const report={method:'Actual passive session derivation and shared source text API, controlled metadata/media ownership only. No physical audible playback or Android lock test.',passed:results.filter(x=>x.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
