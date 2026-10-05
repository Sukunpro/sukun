/* Recorded Tekke guidance: one native media file includes every step and its
 * quiet interval. timeupdate paints text only; it never advances playback.
 * Original recordings remain in REC_DB. Decodes are serial and bounded. */
(()=>{'use strict';
 if(window.SukunTekkeSequence)return;
 const SR=16000,CHANNELS=2,MAX_BYTES=32*1024*1024,MAX_SECONDS=500;
 const OWNER='tekke-imge',PROVIDER='tekke-imge';
 let generation=0,current=null,last={phase:'idle',index:0,total:0,reason:''};
 const safe=(fn,d=null)=>{try{return fn()}catch(_){return d}};
 const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
 const silence=new Blob([new Uint8Array(SR*CHANNELS*2)],{type:'audio/wav'});
 function header(bytes){
  const b=new ArrayBuffer(44),v=new DataView(b),word=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  word(0,'RIFF');v.setUint32(4,36+bytes,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);
  v.setUint16(20,1,true);v.setUint16(22,CHANNELS,true);v.setUint32(24,SR,true);v.setUint32(28,SR*CHANNELS*2,true);
  v.setUint16(32,CHANNELS*2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,bytes,true);return b;
 }
 function update(s,phase,reason=''){
  if(current!==s)return;
  last={phase,active:phase!=='idle'&&phase!=='ended'&&phase!=='error',native:!!s.audio,index:s.index,total:s.steps.length,reason,stage:s.timeline?.[s.index]&&Number(s.audio?.currentTime)>=s.timeline[s.index].voiceEnd?'quiet':'reading',set:s.key,seconds:Number(s.audio?.currentTime)||0,duration:s.duration||0,bytes:s.bytes||0};
  safe(()=>s.onState?.({...last}));
  safe(()=>window.dispatchEvent(new CustomEvent('sukun:tekke-sequence',{detail:{...last}})));
  safe(()=>window.SukunAudioSessionRegistry?.schedule?.('tekke-sequence'));
 }
 function alive(s){return current===s&&s.generation===generation&&s.isCurrent()}
 function cleanup(s,reason){
  if(!s||s.finished)return;s.finished=true;s.cancelPlay?.();s.cancelPlay=null;s.signalPlay=null;
  for(const [type,fn]of s.events)s.audio?.removeEventListener(type,fn);
  if(current===s){safe(()=>window.SukunBackgroundAudioOwner?.release?.(OWNER,reason));current=null;}
  safe(()=>{s.audio?.pause();s.audio?.removeAttribute('src');s.audio?.load()});
  if(s.url)safe(()=>URL.revokeObjectURL(s.url));s.url='';s.bytes=0;
  s.audio?.remove?.();s.resolve?.({ok:reason==='ended',reason});
 }
 function stop(reason='stop'){
  generation++;const s=current;if(!s)return false;
  update(s,'idle',reason);cleanup(s,reason);return true;
 }
 function observe(s){
  if(!alive(s)||!s.audio)return;
  const time=Math.max(0,Number(s.audio.currentTime)||0);
  const found=s.timeline.findIndex((step,i)=>time<step.end||i===s.timeline.length-1);
  if(found!==s.index){s.index=Math.max(0,found);safe(()=>s.onStep?.(s.index));}
  const stage=time>=s.timeline[s.index]?.voiceEnd?'quiet':'reading';if(last.stage!==stage)update(s,last.phase);
 }
 async function prepare(s){
  const parts=[],timeline=[];let bytes=0,time=0;
  const OC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!OC||!window.SukunAudioPreparation)return {handled:false,reason:'preparation-unavailable'};
  for(let i=0;i<s.steps.length;i++){
   const blob=await s.load(i);if(!alive(s))return {handled:true,reason:'cancelled'};
   if(!blob)return {handled:false,reason:'missing-recording',missing:i};
   update(s,'preparing',`${i+1}/${s.steps.length}`);
   const seconds=Number(s.steps[i].sn),gap=Math.max(0,Math.min(90,Number.isFinite(seconds)?seconds:20));
   const result=await window.SukunAudioPreparation.run(blob,
    raw=>new OC(CHANNELS,1,SR).decodeAudioData(raw),
    {key:`tekke:imge:${s.key}:${i}`,purpose:'fx',decodeRate:SR,spatial:s.spatial,extraSeconds:.5,isCurrent:()=>alive(s),
     use:async(decoded,job)=>{
      if(decoded.sampleRate!==SR)throw Error('sequence-sample-rate');
      const tail=s.wet>.01?.39:0,frames=decoded.length+Math.ceil(tail*SR);
      const output=await job.cpu({frames,rate:1,wet:s.wet,spatial:s.spatial,outputChannels:CHANNELS,journey:true});job.check();
      return {blob:new Blob([output.wav],{type:'audio/wav'}),voiceSeconds:decoded.length/SR,tail};
     }});
   if(!alive(s))return {handled:true,reason:'cancelled'};
   const voice=result.blob.slice(44),quietFrames=Math.round(Math.max(0,gap-result.tail)*SR),quietBytes=quietFrames*CHANNELS*2;
   if(bytes+voice.size+quietBytes>MAX_BYTES||time+result.voiceSeconds+gap>MAX_SECONDS)throw Error('sequence-budget');
   parts.push(voice);for(let n=quietBytes;n>0;n-=silence.size)parts.push(silence.slice(0,Math.min(n,silence.size)));
   const start=time;bytes+=voice.size+quietBytes;s.bytes=bytes;time=bytes/(SR*CHANNELS*2);
   timeline.push({index:i,start,end:time,voiceEnd:start+result.voiceSeconds});
  }
  return{handled:true,blob:new Blob([header(bytes),...parts],{type:'audio/wav'}),timeline,duration:time};
 }
 async function play(s){
  if(!alive(s)||!s.audio||!s.url)return false;
  const owner=window.SukunBackgroundAudioOwner;
  const attempt=s.playAttempt=(s.playAttempt||0)+1;s.playBlocked=false;
  const lease=owner?.claim?.(OWNER,s.audio,s.url);s.lease=lease;
  update(s,'preparing');let timer;
  const cancelled=new Promise(resolve=>{s.cancelPlay=()=>resolve(false);});
  const started=new Promise(resolve=>{s.signalPlay=()=>resolve(true);});
  const timeout=new Promise(resolve=>{timer=setTimeout(()=>{
   if(alive(s)&&s.playAttempt===attempt){s.playBlocked=true;s.audio.pause();safe(()=>owner?.release?.(OWNER,'play-start-timeout'));update(s,'paused','play-start-timeout');}resolve(false);
  },8000);});
  try{
   const result=owner?owner.play(lease):s.audio.play().then(()=>true);
   const ok=await Promise.race([result,timeout,cancelled,started]);
   if(!alive(s)||s.playAttempt!==attempt)return false;
   if(!ok){if(!s.playBlocked){s.playBlocked=true;s.audio.pause();update(s,'paused','play-blocked');}return false;}
   update(s,'playing');return true;
  }catch(error){if(alive(s)&&s.playAttempt===attempt){s.playBlocked=true;s.audio.pause();update(s,'paused',String(error?.name||'play-blocked'));}return false;}
  finally{clearTimeout(timer);if(s.playAttempt===attempt){s.cancelPlay=null;s.signalPlay=null;}}
 }
 async function start(options){
  stop('replace');
  let resolve;const done=new Promise(r=>resolve=r);
  const s=current={...options,generation,resolve,done,events:[],finished:false,index:0,url:'',audio:null,timeline:[],wet:clamp(options.wet),spatial:!!options.spatial};
  update(s,'preparing');
  try{
   const result=await prepare(s);
   if(!alive(s)){cleanup(s,'cancelled');return{handled:true,done,reason:'cancelled'};}
   if(!result.handled){update(s,'idle',result.reason);cleanup(s,result.reason);return result;}
   s.timeline=result.timeline;s.duration=result.duration;s.bytes=result.blob.size;
   s.url=URL.createObjectURL(result.blob);
   const a=s.audio=document.createElement('audio');a.preload='auto';a.playsInline=true;a.loop=false;a.src=s.url;a.volume=clamp(options.volume??.6);
   a.setAttribute('playsinline','');a.setAttribute('aria-hidden','true');a.dataset.sukunTekkeSequence='1';a.style.display='none';document.body.append(a);
   const listen=(type,fn)=>{s.events.push([type,fn]);a.addEventListener(type,fn,{passive:true})};
   listen('timeupdate',()=>observe(s));
   listen('playing',()=>{if(!alive(s))return;if(s.playBlocked){s.audio.pause();return;}s.signalPlay?.();update(s,'playing')});
   listen('pause',()=>{if(alive(s)&&!a.ended)update(s,'paused')});
   listen('ended',()=>{if(!alive(s))return;observe(s);update(s,'ended');cleanup(s,'ended')});
   listen('error',()=>{if(!alive(s))return;update(s,'error','media-error');cleanup(s,'media-error')});
   safe(()=>options.onAudio?.(a));safe(()=>s.onStep?.(0));
   if('mediaSession'in navigator)safe(()=>{const translate=value=>window.I18N?.t?.(value)||value;navigator.mediaSession.metadata=new MediaMetadata({title:translate(options.title||'Tekke tefekkürü'),artist:translate('SÜKÛN · Kendi kayıt'),album:translate('Tekke')});navigator.mediaSession.playbackState=options.autoPlay===false?'paused':'playing'});
   if(options.autoPlay===false)update(s,'paused');else await play(s);return{handled:true,done};
  }catch(error){
   if(alive(s)){update(s,'error',String(error?.code||error?.message||'prepare-failed'));safe(()=>s.onError?.(error));}
   cleanup(s,'prepare-failed');return{handled:true,done,reason:'prepare-failed'};
  }
 }
 function pause(){const s=current;if(!s?.audio)return false;s.playBlocked=true;s.playAttempt=(s.playAttempt||0)+1;s.cancelPlay?.();s.cancelPlay=null;safe(()=>window.SukunBackgroundAudioOwner?.userPause?.(s.lease));s.audio.pause();update(s,'paused');return true}
 function resume(){const s=current;if(!s?.audio)return Promise.resolve(false);
  // Only an explicit Resume may retry a rejected source. Retain its file and
  // currentTime; background lifecycle events never issue another play.
  if(window.SukunBackgroundAudioOwner?.snapshot?.()?.blocked)safe(()=>window.SukunBackgroundAudioOwner.release(OWNER,'explicit-resume'));
  return play(s);
 }
 function seekStep(index){const s=current;if(!alive(s)||!s.audio||!Number.isInteger(index)||!s.timeline[index])return false;
  const paused=s.audio.paused;
  try{s.audio.currentTime=s.timeline[index].start;s.index=index;safe(()=>s.onStep?.(index,{seek:true}));update(s,paused?'paused':'playing');return true;}catch(_){return false;}
 }
 function setVolume(value){if(current?.audio)current.audio.volume=clamp(value)}
 const snapshot=()=>({...last,index:current?.index??last.index,seconds:Number(current?.audio?.currentTime)||last.seconds||0,active:!!current,native:!!current?.audio,mediaCount:current?.audio?1:0});
 const api=Object.freeze({version:'r993',seekStep,start,stop,pause,resume,setVolume,snapshot});window.SukunTekkeSequence=api;
 safe(()=>window.SukunAudioSessionRegistry?.register?.(PROVIDER,{priority:120,title:'Tekke tefekkürü',
  getState:()=>!current?'idle':current.audio?.paused?'paused':current.audio?'playing':'idle',
  play:resume,resume,pause,stop:()=>stop('registry-stop'),getVolume:()=>current?.audio?.volume??.6,setVolume}));
 safe(()=>window.AudioLife?.register?.(PROVIDER,()=>!!(current?.audio&&!current.audio.paused&&!current.audio.ended)));
 safe(()=>window.SukunAudioPreparation?.addResident?.(PROVIDER,()=>current?.bytes||0));
})();
