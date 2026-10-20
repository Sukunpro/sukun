/* r1121: immediate frequency attenuation during native handoff.
 * Actual, pre-rendered background sound. No voice/counter/storage ownership. */
(()=>{'use strict';
 if(window.SukunBackgroundMix)return;
 let adapter=null,audio=null,primeUrl='',sourceUrl='',sourceKey='',pending=null,renderFlight=null,timer=0,revision=0;
 let state='IDLE',error='',mutedLive=false,departed=false,primeAccepted=false,lastReason='boot',renderInfo=null;
 let nativeFade=null,fadeTimer=0,resumeFlight=null,accepted=null,internalPauseAt=null,lastPauseAt=null,lastPauseReason='',waiting=false,frozen=false;
 let wasHidden=!!document.hidden,visibility=0,hiddenAt=null,lockCandidate=null,recoveryTimer=0,recoveryUsed=false,recoveryReason='';
 const LOCK_RECOVERY_WINDOW=12000,LOCK_RECOVERY_DELAY=120; 
 const metrics={preparations:0,accepted:0,cancelled:0,rejected:0,stops:0,nativePauses:0,pauseRecoveries:0,recoveryFailures:0};
 const safe=(fn,fallback=null)=>{try{return fn()}catch(_){return fallback}};
 const held=()=>departed||safe(()=>{const mic=window.SukunItemRecording?.snapshot?.();return !!(adapter?.held?.()??true)||!!window.SukunAudioSessionRegistry?.aggregateSnapshot?.()?.paused||!!(mic?.preparing||['permission','preparing','recording','stopping','saving'].includes(mic?.phase));},true);
 const config=()=>safe(()=>adapter?.snapshot?.(),null);
 const active=s=>!!(s&&(s.ambiences?.length||s.frequency?.playing||s.frequency?.secondary?.playing));
 const key=s=>JSON.stringify({ambiences:(s?.ambiences||[]).map(x=>[x.id,x.volume,x.url||'',x.hybridKey||'',x.hybridMix||0]),frequency:(s?.frequency?.playing||s?.frequency?.secondary?.playing)?s.frequency:{playing:false,secondary:{playing:false}},eq:s?.eq,spatial:s?.spatial,sampleRate:s?.sampleRate});
 const owns=element=>!!audio&&element===audio;
 function emit(reason){lastReason=reason;safe(()=>window.dispatchEvent(new CustomEvent('sukun:backgroundmix',{detail:snapshot()})));}
 function mute(value){if(mutedLive===value)return;adapter?.muteLive?.(value);mutedLive=value;}
 function cancelRecovery(reason='cancelled'){clearTimeout(recoveryTimer);recoveryTimer=0;recoveryReason=reason;}
 function stopMedia(reason='app-pause'){if(!audio)return;internalPauseAt=Date.now();audio._sukunBackgroundPauseIntent={at:internalPauseAt,reason};safe(()=>audio.pause());}
 function sourceMatches(url=sourceUrl){return !!(audio&&url&&audio.src===url&&(audio.currentSrc===url||!audio.currentSrc)&&audio.srcObject==null);}
 function confirmed(){return !!(sourceUrl&&sourceMatches()&&audio&&!audio.paused&&!audio.ended&&!audio.error&&audio.readyState>=2);}
 function canRecover(){return !!(lockCandidate&&!recoveryUsed&&!recoveryTimer&&document.hidden&&!frozen&&!departed&&!held()&&state==='INTERRUPTED'&&accepted&&accepted.url===sourceUrl&&lockCandidate.url===sourceUrl&&lockCandidate.key===sourceKey&&sourceKey===key(config())&&lockCandidate.visibility===visibility&&Date.now()-lockCandidate.at>=0&&Date.now()-lockCandidate.at<=LOCK_RECOVERY_WINDOW&&sourceMatches()&&audio.paused&&!audio.ended&&!audio.error&&audio.readyState>=2&&!audio.muted&&Number(audio.volume)>0&&lockCandidate.pauseIntentAt===internalPauseAt);}
 function armAcceptedHidden(){
  const age=hiddenAt==null?Infinity:Date.now()-hiddenAt;
  if(document.hidden&&!frozen&&!recoveryUsed&&!held()&&accepted&&confirmed()&&sourceKey===key(config())&&age>=0&&age<=LOCK_RECOVERY_WINDOW)lockCandidate={at:hiddenAt,visibility,url:sourceUrl,key:sourceKey,pauseIntentAt:internalPauseAt};
 }
 function recoverLockPause(){
  if(!canRecover())return false;
  recoveryReason='lock-transition-pause';
  recoveryTimer=setTimeout(()=>{
   recoveryTimer=0;if(!canRecover()){recoveryReason='lock-transition-recovery-cancelled';emit(recoveryReason);return;}
   recoveryUsed=true;metrics.pauseRecoveries++;recoveryReason='lock-transition-recovery-request';
   Promise.resolve(resume('lock-transition')).then(ok=>{recoveryReason=ok?'lock-transition-recovered':'lock-transition-recovery-incomplete';if(!ok)metrics.recoveryFailures++;emit(recoveryReason);},()=>{metrics.recoveryFailures++;recoveryReason='lock-transition-recovery-rejected';emit(recoveryReason);});
  },LOCK_RECOVERY_DELAY);return true;
 }
 function nativePause(){
  if(!sourceUrl||!accepted||accepted.url!==sourceUrl||!sourceMatches()||!audio.paused)return;
  const intent=audio._sukunBackgroundPauseIntent;audio._sukunBackgroundPauseIntent=null;lastPauseAt=Date.now();lastPauseReason=intent&&lastPauseAt-intent.at<2000?intent.reason:'browser-pause';
  if(held()||lastPauseReason!=='browser-pause'||['IDLE','PAUSED','STARTING','ERROR'].includes(state))return;
  metrics.nativePauses++;state='INTERRUPTED';waiting=false;mute(false);emit('native-pause');recoverLockPause();
 }
 function clearSource(){cancelRecovery('source-cleared');accepted=null;resumeFlight=null;stopMedia('source-cleared');clearInterval(fadeTimer);fadeTimer=0;nativeFade=null;if(audio){safe(()=>audio.removeAttribute('src'));safe(()=>audio.load());audio.dataset.sukSilentCarrier='1';}if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl='';sourceKey='';renderInfo=null;}
 function silentBlob(){const b=new ArrayBuffer(1644),v=new DataView(b),str=(p,s)=>[...s].forEach((x,i)=>v.setUint8(p+i,x.charCodeAt(0)));str(0,'RIFF');v.setUint32(4,1636,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,8000,true);v.setUint16(32,1,true);v.setUint16(34,8,true);str(36,'data');v.setUint32(40,1600,true);new Uint8Array(b,44).fill(128);return new Blob([b],{type:'audio/wav'});}
 function element(){
  if(audio)return audio;
  audio=document.createElement('audio');audio.id='sukunBackgroundMixAudio';audio.preload='auto';audio.loop=true;audio.setAttribute('playsinline','');audio.setAttribute('aria-hidden','true');audio.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-20px;bottom:-20px';audio.disableRemotePlayback=false;audio.dataset.sukNativeOutput='direct';audio.dataset.sukBackgroundMix='1';audio.dataset.sukSilentCarrier='1';document.body.appendChild(audio);
  audio.addEventListener('pause',nativePause,{passive:true});
  audio.addEventListener('playing',()=>{waiting=false;if(accepted?.url===sourceUrl&&confirmed()&&!held()&&['INTERRUPTED','BUFFERING'].includes(state)){mute(true);state='PLAYING';error='';emit('native-playing-event');}},{passive:true});
  audio.addEventListener('waiting',()=>{if(sourceMatches()){waiting=true;if(accepted&&state==='PLAYING'&&audio.readyState<2)state='BUFFERING';emit('native-waiting');}},{passive:true});
  audio.addEventListener('ended',()=>{if(sourceMatches()){cancelRecovery('native-ended');state='INTERRUPTED';mute(false);emit('native-ended');}},{passive:true});
  audio.addEventListener('error',()=>{if(sourceUrl&&audio.src===sourceUrl){cancelRecovery('native-error');error='native-media-error';state='ERROR';mute(false);emit('native-error');}});
  return audio;
 }
 function isSilentCarrier(element){return owns(element)&&!!primeUrl&&element.dataset.sukSilentCarrier==='1'&&element.src===primeUrl&&element.srcObject==null&&(element.currentSrc===primeUrl||!element.currentSrc);}
 function prime(){
  if(!adapter||held()||!active(config())||sourceUrl)return false;
  const a=element();if(!primeUrl)primeUrl=URL.createObjectURL(silentBlob());
  a.dataset.sukSilentCarrier='1';a.src=primeUrl;a.volume=1;
  const requested=primeUrl;safe(()=>Promise.resolve(a.play()).then(()=>{primeAccepted=true;if(a.src===requested&&!sourceUrl)stopMedia();},()=>{primeAccepted=false;}));return true;
 }
 function volume(){const value=Number(safe(()=>adapter?.volume?.(),1)),base=Number.isFinite(value)?Math.max(0,Math.min(1,value)):1;if(!nativeFade)return base;const elapsed=Math.max(0,(Date.now()-nativeFade.started)/1000);return elapsed>=nativeFade.seconds?0:base*Math.exp(-elapsed/(nativeFade.seconds/3.25));}
 function fadeOut(seconds=13){if(!active(config())||held())return false;seconds=Math.max(.1,Math.min(60,Number(seconds)||13));nativeFade={started:Date.now(),seconds};clearInterval(fadeTimer);fadeTimer=setInterval(()=>{sync();if(!nativeFade||Date.now()-nativeFade.started>=seconds*1000){clearInterval(fadeTimer);fadeTimer=0;}},200);sync();emit('sleep-fade');return true;}
 function invalidate(reason,clear=false){cancelRecovery(reason);lockCandidate=null;revision++;clearTimeout(timer);timer=0;pending=null;stopMedia();mute(false);if(clear)clearSource();state=clear?'IDLE':'PAUSED';emit(reason);}
 async function admit(result,signature,token){
  if(token!==revision||held()||!active(config())||key(config())!==signature){metrics.cancelled++;return false;}
  const a=element(),url=URL.createObjectURL(result.blob),previous=sourceUrl;
  cancelRecovery('source-replaced');lockCandidate=null;accepted=null;resumeFlight=null;internalPauseAt=Date.now();a._sukunBackgroundPauseIntent={at:internalPauseAt,reason:'source-replace'};
  a.dataset.sukSilentCarrier='0';a.src=url;a.loop=true;a.volume=volume();a.load();
  sourceUrl=url;sourceKey=signature;state='STARTING';emit('native-start');
  try{
   await a.play();
   if(token!==revision||held()||!active(config())||key(config())!==signature){if(a.src===url||held()||!active(config()))stopMedia();if(sourceUrl===url){sourceUrl='';sourceKey='';}URL.revokeObjectURL(url);if(previous)URL.revokeObjectURL(previous);metrics.cancelled++;return false;}
   if(!confirmed())throw new Error('native-play-unconfirmed');
   accepted={url,key:signature,at:Date.now()};a._sukunBackgroundPauseIntent=null;waiting=false;mute(true);state='PLAYING';error='';renderInfo={duration:result.duration,sampleRate:result.sampleRate,channels:result.channels,peak:result.peak,rms:result.rms,virtualEvents:result.virtualEvents,bytes:result.blob.size};metrics.accepted++;armAcceptedHidden();
   if(previous&&previous!==url)URL.revokeObjectURL(previous);if(primeUrl){URL.revokeObjectURL(primeUrl);primeUrl='';}emit('native-playing');return true;
  }catch(e){
   if(sourceUrl===url){stopMedia();sourceUrl='';sourceKey='';mute(false);state='ERROR';error=String(e?.name||e?.message||'native-play-rejected');}
   URL.revokeObjectURL(url);if(previous)URL.revokeObjectURL(previous);metrics.rejected++;emit('native-rejected');return false;
  }
 }
 function restorePrepared(signature){
  if(!sourceUrl||sourceKey!==signature||accepted?.url!==sourceUrl)return false;
  // Returning A → B → A makes the retained native A route current again.
  // Retire B's authority before its obsolete renderer reports AbortError;
  // that completion must never clear the already accepted A source.
  const restored=!!timer||!!(pending&&pending.key!==signature);
  if(!restored)return false;
  revision++;pending=null;clearTimeout(timer);timer=0;error='';
  if(audio)audio.volume=volume();
  if(confirmed()){adapter.muteLive(true);mutedLive=true;state='PLAYING';}
  else if(state!=='PAUSED')state='INTERRUPTED';
  emit('prepared-selection-restored');return true;
 }
 function resume(reason='explicit-resume'){
  if(!adapter||held()||!active(config()))return Promise.resolve(false);
  const signature=key(config());if(!sourceUrl||sourceKey!==signature||accepted?.url!==sourceUrl)return prepare();
  if(confirmed()){adapter.muteLive(true);mutedLive=true;state='PLAYING';return Promise.resolve(true);}
  if(resumeFlight)return resumeFlight;
  const a=element(),url=sourceUrl,token=revision;a.volume=volume();state='STARTING';emit('native-resume-request');
  let attempt;try{attempt=a.play();}catch(e){attempt=Promise.reject(e);}
  const work=Promise.resolve(attempt).then(()=>{
   if(token!==revision||held()||sourceUrl!==url||sourceKey!==key(config())){if(a.src===url||held()||!active(config()))stopMedia('stale-resume');return false;}
   if(!confirmed())throw new Error('native-resume-unconfirmed');
   accepted={url,key:signature,at:Date.now()};a._sukunBackgroundPauseIntent=null;waiting=false;mute(true);state='PLAYING';error='';emit('native-resumed:'+reason);return true;
  },e=>{throw e;}).catch(e=>{
   if(token===revision&&sourceUrl===url){state='ERROR';error=String(e?.name||e?.message||'native-resume-rejected');mute(false);emit('native-rejected');}return false;
  }).finally(()=>{if(resumeFlight===work)resumeFlight=null;emit('native-resume-settled');});resumeFlight=work;return work;
 }
 function frequencyAttenuated(previous,next){
  // A rendered loop contains its old gains. Do not retain a louder frequency
  // while preparing a quieter setting: restore the current live graph instead.
  // Pink and the secondary layer bypass the main stereo trims, so compare them
  // independently. Ambience ownership and aggregate pause remain unchanged.
  const level=(value,fallback)=>Number.isFinite(Number(value))?Math.max(0,Number(value)):fallback;
  const channels=f=>{
   const vol=level(f?.vol,.5),main=f?.playing&&vol>0?level(f.outputLevel,vol*.35):0;
   return {left:main*level(f?.balL,1),right:main*level(f?.balR,1),
    pink:f?.playing&&f.pink&&vol>0?level(f.pinkLevel,vol*.12):0,
    secondary:f?.secondary?.playing&&vol>0?level(f.secondaryLevel,vol*.22):0,
    noise:['white','pink','brown'].includes(f?.noise)?level(f.noiseVol,0):0};
  };
  const a=channels(previous),b=channels(next);
  return ['left','right','pink','secondary'].some(k=>b[k]<a[k])||
   b.left*b.noise<a.left*a.noise||b.right*b.noise<a.right*a.noise;
 }
 function retireAttenuatedFrequency(s){
  if(sourceKey&&frequencyAttenuated(safe(()=>JSON.parse(sourceKey).frequency),s?.frequency))invalidate('frequency-attenuation',true);
 }
 function prepare(){
  if(!adapter||held())return Promise.resolve(false);
  const s=config();if(!active(s)){invalidate('inactive',true);return Promise.resolve(false);}
  retireAttenuatedFrequency(s);
  const signature=key(s);
  if(pending?.key===signature&&!accepted)return pending.promise;
  if(sourceKey===signature&&sourceUrl&&accepted?.url===sourceUrl){restorePrepared(signature);return resume('prepare');}
  if(pending?.key===signature)return pending.promise;
  const token=++revision;state='PREPARING';error='';metrics.preparations++;emit('prepare');
  const job={key:signature,promise:null};pending=job;
  // Native offline rendering cannot be aborted. Serialize it and discard queued
  // stale snapshots before graph allocation, so fast sliders use one graph.
  const previousFlight=renderFlight;
  job.promise=Promise.resolve(previousFlight).catch(()=>false).then(()=>{
   if(token!==revision||held()||key(config())!==signature){metrics.cancelled++;return null;}
   return window.SukunBackgroundMixRenderer.render(s,{...adapter,isCurrent:()=>token===revision&&!held()&&key(config())===signature});
  }).then(result=>result?admit(result,signature,token):false,e=>{if(token===revision){clearSource();state='ERROR';error=String(e?.name||e?.message||'render-failed');mute(false);emit('prepare-failed');}return false;}).finally(()=>{if(pending===job)pending=null;if(renderFlight===job.promise)renderFlight=null;emit('prepare-settled');});
  renderFlight=job.promise;
  return job.promise;
 }
 function changed(reason='change',options={}){
  if(!adapter)return false;
  if(options.immediate)invalidate(reason,true);
  const s=config();if(!active(s)){invalidate(reason,true);metrics.stops++;return false;}
  // A retained ambience-only source cannot own a newly static frequency bus,
  // and a retained static tone cannot own a newly moving/timed frequency.
  // Restore the live graph before preparing across that ownership boundary.
  const ownsFrequency=x=>!!(x?.frequency?.playing||x?.frequency?.secondary?.playing);
  if(sourceKey&&ownsFrequency(s)!==ownsFrequency(safe(()=>JSON.parse(sourceKey))))invalidate('frequency-route-change',true);
  retireAttenuatedFrequency(s);
  if(held()){invalidate(reason);return false;}
  if(options.gesture){cancelRecovery('new-gesture');lockCandidate=null;prime();}
  if(pending?.key===key(s)){if(audio)audio.volume=volume();if(mutedLive&&confirmed())adapter.muteLive(true);return true;}
  if(sourceKey&&key(s)===sourceKey&&accepted?.url===sourceUrl){
   restorePrepared(sourceKey);
   if(audio)audio.volume=volume();if(confirmed()){adapter.muteLive(true);mutedLive=true;if(accepted)state='PLAYING';}
   if(state==='PAUSED'||options.gesture&&['INTERRUPTED','ERROR'].includes(state))prepare();return true;
  }
  revision++;pending=null;clearTimeout(timer);state='PREPARING';
  // A live setter/new layer may have changed an already muted gain. Keep the
  // accepted native route as the only audible background until replacement.
  if(mutedLive&&sourceUrl&&audio&&!audio.paused)adapter.muteLive(true);
  timer=setTimeout(()=>{timer=0;prepare();},options.gesture?0:180);emit(reason);return true;
 }
 function sync(){
  if(!adapter)return false;
  if(held()){if(state!=='PAUSED'&&state!=='IDLE')invalidate('explicit-hold');return false;}
  if(!active(config())){if(state!=='IDLE'||sourceUrl)invalidate('inactive',true);return false;}
  if(audio)audio.volume=volume();
  if(state==='PAUSED'&&!document.hidden)prepare();
  return true;
 }
 function bind(value){adapter=value;emit('bound');return true;}
 function snapshot(){return{version:'r1121',state,active:active(config()),nativePaused:!!audio?.paused,readyState:audio?.readyState||0,nativeDuration:Number.isFinite(Number(audio?.duration))?Number(audio.duration):null,currentSelectionPrepared:!!(sourceKey&&sourceKey===key(config())),ready:!!(accepted?.url===sourceUrl&&confirmed()&&sourceKey===key(config())&&renderInfo?.duration>=5&&Number.isFinite(Number(audio?.duration))&&Number(audio.duration)>=5&&!pending&&!resumeFlight),reason:lastReason,hidden:!!document.hidden,prepared:!!sourceUrl,playing:confirmed(),nativeTime:Number(audio?.currentTime)||0,duration:renderInfo?.duration||0,volume:audio?.volume??null,sourceKind:sourceUrl?'rendered-background-mix':'none',mutedLive,preparing:!!pending||!!resumeFlight,primeAccepted,error,render:renderInfo,native:{paused:!!audio?.paused,ended:!!audio?.ended,readyState:audio?.readyState||0,networkState:audio?.networkState||0,mediaErrorCode:audio?.error?.code||0,currentSourceMatch:sourceMatches(),waiting,pauseReason:lastPauseReason,pauseAt:lastPauseAt},lockTransitionAgeMs:hiddenAt==null?null:Math.max(0,Date.now()-hiddenAt),lockRecoveryWindowMs:LOCK_RECOVERY_WINDOW,lockRecoveryEligible:canRecover(),lockRecoveryPending:!!recoveryTimer,lockRecoveryAttempted:recoveryUsed,lockRecoveryReason:recoveryReason,metrics:{...metrics},scope:'native pre-rendered ambience/frequency; no dhikr counter or voice ownership'};}
 document.addEventListener('visibilitychange',()=>{
  const hidden=!!document.hidden;if(hidden===wasHidden){sync();emit('visibility-unchanged');return;}wasHidden=hidden;
  visibility++;cancelRecovery('visibility-change');
  if(document.hidden){
   hiddenAt=Date.now();recoveryUsed=false;
   const adjacent=state==='INTERRUPTED'&&lastPauseReason==='browser-pause'&&lastPauseAt!=null&&hiddenAt-lastPauseAt<=250;
   lockCandidate=accepted&&sourceMatches()&&!held()&&!frozen&&(confirmed()||adjacent)?{at:hiddenAt,visibility,url:sourceUrl,key:sourceKey,pauseIntentAt:internalPauseAt}:null;
   // A queued debounce cannot own preparation after the page freezes.
   // Begin the current snapshot now, rather than waiting for a hidden timer.
   if(timer){clearTimeout(timer);timer=0;prepare();}
   sync();if(adjacent)recoverLockPause();
  }else{
   hiddenAt=null;lockCandidate=null;frozen=false;sync();
   if(state==='INTERRUPTED'&&sourceUrl&&!held())resume('visible-return');
  }
  emit(document.hidden?'hidden-native-continue':'visible-native-continue');
 },{passive:true});
 document.addEventListener('freeze',()=>{frozen=true;cancelRecovery('freeze');},{passive:true});
 document.addEventListener('resume',()=>{frozen=false;},{passive:true});
 window.addEventListener('sukun:audiostate',sync,{passive:true});
 window.addEventListener('sukun:audioaggregatechange',event=>{
  sync();
  // Aggregate Resume clears its hold after provider callbacks. That explicit
  // command may arrive while hidden; ordinary lifecycle sync never retries.
  if(event.detail?.reason==='resumeAll'&&event.detail?.paused===false&&state==='PAUSED'&&!held()&&active(config()))resume('aggregate-resume');
 },{passive:true});
 window.addEventListener('pagehide',()=>{departed=true;invalidate('pagehide',true);if(primeUrl){URL.revokeObjectURL(primeUrl);primeUrl='';}},{passive:true});
 window.addEventListener('pageshow',()=>{departed=false;changed('pageshow');},{passive:true});
 const api=Object.freeze({version:'r1121',bind,changed,prepare,resume,sync,fadeOut,owns,isSilentCarrier,snapshot});window.SukunBackgroundMix=api;window.SukunBackgroundMixR1059=api;
})();
