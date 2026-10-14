/* Actual, pre-rendered background sound. No voice/counter/storage ownership. */
(()=>{'use strict';
 if(window.SukunBackgroundMix)return;
 let adapter=null,audio=null,primeUrl='',sourceUrl='',sourceKey='',pending=null,renderFlight=null,timer=0,revision=0;
 let state='IDLE',error='',mutedLive=false,departed=false,primeAccepted=false,lastReason='boot',renderInfo=null;
 let nativeFade=null,fadeTimer=0;
 const metrics={preparations:0,accepted:0,cancelled:0,rejected:0,stops:0};
 const safe=(fn,fallback=null)=>{try{return fn()}catch(_){return fallback}};
 const held=()=>departed||safe(()=>adapter?.held?.(),true);
 const config=()=>safe(()=>adapter?.snapshot?.(),null);
 const active=s=>!!(s&&(s.ambiences?.length||s.frequency?.playing||s.frequency?.secondary?.playing));
 const key=s=>JSON.stringify({ambiences:(s?.ambiences||[]).map(x=>[x.id,x.volume,x.url||'',x.hybridKey||'',x.hybridMix||0]),frequency:s?.frequency,eq:s?.eq,spatial:s?.spatial,sampleRate:s?.sampleRate});
 const owns=element=>!!audio&&element===audio;
 function emit(reason){lastReason=reason;safe(()=>window.dispatchEvent(new CustomEvent('sukun:backgroundmix',{detail:snapshot()})));}
 function mute(value){if(mutedLive===value)return;adapter?.muteLive?.(value);mutedLive=value;}
 function stopMedia(){if(!audio)return;safe(()=>audio.pause());}
 function clearSource(){stopMedia();clearInterval(fadeTimer);fadeTimer=0;nativeFade=null;if(audio){safe(()=>audio.removeAttribute('src'));safe(()=>audio.load());audio.dataset.sukSilentCarrier='1';}if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl='';sourceKey='';renderInfo=null;}
 function silentBlob(){const b=new ArrayBuffer(1644),v=new DataView(b),str=(p,s)=>[...s].forEach((x,i)=>v.setUint8(p+i,x.charCodeAt(0)));str(0,'RIFF');v.setUint32(4,1636,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,8000,true);v.setUint16(32,1,true);v.setUint16(34,8,true);str(36,'data');v.setUint32(40,1600,true);new Uint8Array(b,44).fill(128);return new Blob([b],{type:'audio/wav'});}
 function element(){
  if(audio)return audio;
  audio=document.createElement('audio');audio.id='sukunBackgroundMixAudio';audio.preload='auto';audio.loop=true;audio.setAttribute('playsinline','');audio.setAttribute('aria-hidden','true');audio.style.display='none';audio.dataset.sukBackgroundMix='1';audio.dataset.sukSilentCarrier='1';document.body.appendChild(audio);
  audio.addEventListener('error',()=>{if(sourceUrl&&audio.src===sourceUrl){error='native-media-error';state='ERROR';mute(false);emit('native-error');}});
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
 function invalidate(reason,clear=false){revision++;clearTimeout(timer);timer=0;pending=null;stopMedia();mute(false);if(clear)clearSource();state=clear?'IDLE':'PAUSED';emit(reason);}
 async function admit(result,signature,token){
  if(token!==revision||held()||!active(config())||key(config())!==signature){metrics.cancelled++;return false;}
  const a=element(),url=URL.createObjectURL(result.blob),previous=sourceUrl;
  a.dataset.sukSilentCarrier='0';a.src=url;a.loop=true;a.volume=volume();a.load();
  sourceUrl=url;sourceKey=signature;state='STARTING';emit('native-start');
  try{
   await a.play();
   if(token!==revision||held()||!active(config())||key(config())!==signature){if(a.src===url||held()||!active(config()))stopMedia();if(sourceUrl===url){sourceUrl='';sourceKey='';}URL.revokeObjectURL(url);if(previous)URL.revokeObjectURL(previous);metrics.cancelled++;return false;}
   if(a.paused||a.ended)throw new Error('native-play-unconfirmed');
   mute(true);state='PLAYING';error='';renderInfo={duration:result.duration,sampleRate:result.sampleRate,channels:result.channels,peak:result.peak,rms:result.rms,virtualEvents:result.virtualEvents,bytes:result.blob.size};metrics.accepted++;
   if(previous&&previous!==url)URL.revokeObjectURL(previous);if(primeUrl){URL.revokeObjectURL(primeUrl);primeUrl='';}emit('native-playing');return true;
  }catch(e){
   if(sourceUrl===url){stopMedia();sourceUrl='';sourceKey='';mute(false);state='ERROR';error=String(e?.name||e?.message||'native-play-rejected');}
   URL.revokeObjectURL(url);if(previous)URL.revokeObjectURL(previous);metrics.rejected++;emit('native-rejected');return false;
  }
 }
 function prepare(){
  if(!adapter||held())return Promise.resolve(false);
  const s=config();if(!active(s)){invalidate('inactive',true);return Promise.resolve(false);}
  const signature=key(s);
  if(sourceKey===signature&&sourceUrl){
   const a=element();a.volume=volume();if(!a.paused&&!a.ended){adapter.muteLive(true);mutedLive=true;state='PLAYING';return Promise.resolve(true);}
   const token=revision;state='STARTING';return Promise.resolve(a.play()).then(()=>{if(token!==revision||held()){stopMedia();return false;}mute(true);state='PLAYING';emit('native-resumed');return true;},()=>{mute(false);state='ERROR';error='native-resume-rejected';emit('native-rejected');return false;});
  }
  if(pending?.key===signature)return pending.promise;
  const token=++revision;state='PREPARING';error='';metrics.preparations++;emit('prepare');
  const job={key:signature,promise:null};pending=job;
  // Native offline rendering cannot be aborted. Serialize it and discard queued
  // stale snapshots before graph allocation, so fast sliders use one graph.
  const previousFlight=renderFlight;
  job.promise=Promise.resolve(previousFlight).catch(()=>false).then(()=>{
   if(token!==revision||held()||key(config())!==signature){metrics.cancelled++;return null;}
   return window.SukunBackgroundMixRenderer.render(s,{...adapter,isCurrent:()=>token===revision&&!held()&&key(config())===signature});
  }).then(result=>result?admit(result,signature,token):false,e=>{if(token===revision){clearSource();state='ERROR';error=String(e?.name||e?.message||'render-failed');mute(false);emit('prepare-failed');}return false;}).finally(()=>{if(pending===job)pending=null;if(renderFlight===job.promise)renderFlight=null;});
  renderFlight=job.promise;
  return job.promise;
 }
 function changed(reason='change',options={}){
  if(!adapter)return false;
  const s=config();if(!active(s)){invalidate(reason,true);metrics.stops++;return false;}
  if(held()){invalidate(reason);return false;}
  if(options.gesture)prime();
  if(sourceKey&&key(s)===sourceKey){if(audio)audio.volume=volume();if(audio&&!audio.paused&&!audio.ended){adapter.muteLive(true);mutedLive=true;}if(state==='PAUSED')prepare();return true;}
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
 function snapshot(){return{version:'r1059',state,reason:lastReason,hidden:!!document.hidden,prepared:!!sourceUrl,playing:!!(sourceUrl&&audio&&!audio.paused&&!audio.ended),nativeTime:Number(audio?.currentTime)||0,duration:renderInfo?.duration||0,volume:audio?.volume??null,sourceKind:sourceUrl?'rendered-background-mix':'none',mutedLive,preparing:!!pending,primeAccepted,error,render:renderInfo,metrics:{...metrics},scope:'native pre-rendered ambience/frequency; no dhikr counter or voice ownership'};}
 document.addEventListener('visibilitychange',()=>{sync();emit(document.hidden?'hidden-native-continue':'visible-native-continue');},{passive:true});
 window.addEventListener('sukun:audiostate',sync,{passive:true});
 window.addEventListener('sukun:audioaggregatechange',sync,{passive:true});
 window.addEventListener('pagehide',()=>{departed=true;invalidate('pagehide',true);if(primeUrl){URL.revokeObjectURL(primeUrl);primeUrl='';}},{passive:true});
 window.addEventListener('pageshow',()=>{departed=false;changed('pageshow');},{passive:true});
 const api=Object.freeze({version:'r1059',bind,changed,prepare,sync,fadeOut,owns,isSilentCarrier,snapshot});window.SukunBackgroundMix=api;window.SukunBackgroundMixR1059=api;
})();
