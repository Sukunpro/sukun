/* One automatic, optional approved audio signature. Completely separate from app audio.
   A denied/late/hidden attempt is discarded, never queued for a future tap. */
(function(){
  'use strict';
  var root=document.getElementById('sukun-auto-intro');
  if(!root||root.dataset.audioAttempted==='1')return;
  root.dataset.audioAttempted='1';
  // Read-only Health projection: use this captured root, never rescan the DOM
  // or sample audio, app state, clocks, storage, or personal data on demand.
  try{
    var diagnosticKeys=['introBootstrap','introPhase','bootStarted','firstFrameAgeMs','started','visualClock','visualCssAgeMs','visualStarted','visualEnded','cancelled',
      'audioAttempted','audioModuleAgeMs','audioReadyAgeMs','audioOutcome','audioDisabled','audioContextInitialState','audioContextState','audioContextStopState',
      'audioResumeState','audioResumeSettledAfterStop','audioResumeError','audioOnsetBudgetMs','audioPendingApis','audioSourcesScheduled','audioAssetState','audioDecodeState','audioAssetReadyAgeMs','audioBufferDurationMs'];
    window.SukunIntroAudioDiagnostics=Object.freeze({snapshot:function(){
      var result={};diagnosticKeys.forEach(function(key){try{var value=root.dataset[key];result[key]=typeof value==='string'?value:null;}catch(_){result[key]=null;}});
      return Object.freeze(result);
    }});
  }catch(_){}
  // Ephemeral, nonvisual diagnostics only; scheduled does not prove audibility.
  var boot=Number(root.dataset.bootStarted),handshake=root.dataset.introBootstrap==='r1033',readinessTimer=0,readySent=false;
  if(handshake)root.dataset.audioModuleAgeMs=String(Math.max(0,Math.round(performance.now()-boot)));
  if(handshake&&(root.dataset.introPhase==='done'||root.dataset.introPhase==='abandoned'))return;
  if(!handshake)root.dataset.audioOutcome='ineligible';
  var started=Number(root.dataset.started),INTRO_MS=4800,HIT_MS=3000,LEAD_MS=20,ineligibleReason='ineligible';
  // Per-load observations only: bounded enums/numbers, no app or device data.
  // Missing/failed diagnostic writes can never affect the audio decision.
  function diagnostic(key,value){try{value=String(value);if(root.dataset[key]!==value)root.dataset[key]=value;}catch(_){}}
  function contextDiagnostic(key){
    try{
      if(!context)return;
      var value=context.state;
      if(['running','suspended','interrupted','closed'].indexOf(value)===-1)value='unknown';
      diagnostic('audioContextState',value);if(key)diagnostic(key,value);
    }catch(_){}
  }
  function budgetDiagnostic(origin){
    try{var value=INTRO_MS-HIT_MS-LEAD_MS-(performance.now()-origin);
      if(Number.isFinite(value))diagnostic('audioOnsetBudgetMs',Math.max(-10000,Math.min(10000,Math.round(value))));
    }catch(_){}
  }
  function pendingDiagnostic(){
    try{diagnostic('audioPendingApis',JSON.stringify({
      audioLife:!window.AudioLife||typeof window.AudioLife.busy!=='function',
      sessionState:!window.SukunSessionState||typeof window.SukunSessionState.snapshot!=='function',
      tickSound:!window.SukunTickSound||typeof window.SukunTickSound.isRecording!=='function',
      physicalRecording:typeof window.SukunPhysicalRecordingBusyR696!=='function',
      tabOwner:!window.SukunTabOwner||typeof window.SukunTabOwner.snapshot!=='function',
      sessionRegistry:!window.SukunAudioSessionRegistry||typeof window.SukunAudioSessionRegistry.aggregateSnapshot!=='function'
    }));}catch(_){}
  }
  function resumeDiagnostic(value,error){
    diagnostic('audioResumeState',value);
    if(value==='fulfilled'||value==='rejected')diagnostic('audioResumeSettledAfterStop',stopped?'1':'0');
    if(error){try{var name=error.name;
      diagnostic('audioResumeError',['NotAllowedError','InvalidStateError','NotSupportedError','AbortError','SecurityError'].indexOf(name)!==-1?name:'Error');
    }catch(_){diagnostic('audioResumeError','Error');}}
  }
  diagnostic('audioResumeState','not_requested');diagnostic('audioSourcesScheduled','0');
  function deny(reason){ineligibleReason=reason;if(reason==='apis_pending'||reason==='unavailable')pendingDiagnostic();return false;}
  // Reused around potentially costly DOM/layout reads so a changed recording
  // or owner is not accepted from an earlier snapshot. Read-only, no lock claim.
  function criticalAudioIdle(){
    if(window.AudioLife.busy()!==false||window.SukunTickSound.isRecording()!==false||
       window.SukunPhysicalRecordingBusyR696()!==false||
       window.SukunSessionState.snapshot().phase!=='IDLE')return deny('unsafe-audio');
    var owner=window.SukunTabOwner.snapshot();
    if(!owner||typeof owner!=='object'||Array.isArray(owner)||
       ['owned','pending','blocked','maintenance','retiring','recoveryRequired'].some(function(key){return typeof owner[key]!=='boolean';}))return deny('unavailable');
    if(owner.owned||owner.pending||owner.blocked||owner.maintenance||owner.retiring||owner.recoveryRequired)return deny('unsafe-owner');
    var sessions=window.SukunAudioSessionRegistry.aggregateSnapshot();
    if(!sessions||typeof sessions!=='object'||Array.isArray(sessions)||typeof sessions.paused!=='boolean'||
       typeof sessions.mixCaptured!=='boolean'||!Array.isArray(sessions.providerIds))return deny('unavailable');
    if(sessions.active||sessions.playing||sessions.running||sessions.paused||sessions.mixCaptured||sessions.providerIds.length)return deny('unsafe-audio');
    return true;
  }
  function eligible(requiredMs,preparing){
    var age=performance.now()-started;
    if(handshake){
      var clock=typeof root.sukunIntroReadClock==='function'?root.sukunIntroReadClock():null;
      if(!clock)return deny('timing_unavailable');
      if(clock.pending)return deny('timing_pending');
      if(Number.isFinite(clock.started))budgetDiagnostic(clock.started);
      if(clock.ended)return deny(resumeRequested?'resume_timeout':'load_expired');
      if(clock.waiting){if(!preparing)return deny('visual_pending');}
      else{
        started=clock.started;age=clock.elapsed;root.dataset.started=String(started);
        if(age<0||age+requiredMs>=INTRO_MS)return deny(resumeRequested?'resume_timeout':'load_expired');
      }
    }else if(!Number.isFinite(started)||!Number.isFinite(age)||age<0||age+requiredMs>=INTRO_MS)return deny(resumeRequested?'resume_timeout':'onset_expired');
    if(root.dataset.cancelled==='1')return deny('cancelled');
    if(root.hidden||document.hidden)return deny('hidden');
    // Unknown/active ownership is a reason for silence, never a reason to claim
    // or clear another tab's lock. These checks only read existing app state.
    try{
      if(root.dataset.audioDisabled)return deny(root.dataset.audioDisabled);
      if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){root.dataset.audioDisabled='reduced-motion';return deny('reduced-motion');}
      if(localStorage.getItem('sukun.tab.owner.r981'))return deny('unsafe-owner');
      if(!window.AudioLife||typeof window.AudioLife.busy!=='function'||
         !window.SukunSessionState||typeof window.SukunSessionState.snapshot!=='function'||
         !window.SukunTickSound||typeof window.SukunTickSound.isRecording!=='function'||
         typeof window.SukunPhysicalRecordingBusyR696!=='function'||
         !window.SukunTabOwner||typeof window.SukunTabOwner.snapshot!=='function'||
         !window.SukunAudioSessionRegistry||typeof window.SukunAudioSessionRegistry.aggregateSnapshot!=='function')return deny(preparing?'apis_pending':'unavailable');
      diagnostic('audioPendingApis','{"audioLife":false,"sessionState":false,"tickSound":false,"physicalRecording":false,"tabOwner":false,"sessionRegistry":false}');
      if(!criticalAudioIdle())return false;
      var dialogs=document.querySelectorAll('dialog[open],[role="dialog"],[role="alertdialog"]');
      for(var d=0;d<dialogs.length;d++){
        var node=dialogs[d],visible=!!(node.getClientRects&&node.getClientRects().length);
        for(var parent=node;visible&&parent;parent=parent.parentElement){
          if(parent.hidden){visible=false;break;}
          var style=window.getComputedStyle(parent);
          if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse'||Number(style.opacity)===0)visible=false;
        }
        if(visible)return deny('dialog');
      }
      var media=document.querySelectorAll('audio,video');
      for(var m=0;m<media.length;m++)if(!media[m].paused&&!media[m].ended)return deny('unsafe-audio');
      if(localStorage.getItem('sukun.tab.owner.r981'))return deny('unsafe-owner');
      if(!criticalAudioIdle())return false;
      // Safety reads/layout can consume the last onset allowance in this task.
      // Reuse the validated origin, never refresh it from a stale CSS sample.
      age=performance.now()-(handshake?clock.started:started);
      if(!Number.isFinite(age)||(!preparing&&age<0)||age+requiredMs>=INTRO_MS)
        return deny(resumeRequested?'resume_timeout':'load_expired');
      return true;
    }catch(_){return deny('unavailable');}
  }
  var AudioContextClass=window.AudioContext||window.webkitAudioContext;
  var assetBytes=null,buffer=null,assetController=null,decodeStarted=false;
  var context=null,voices=[],bus=null,stopped=false,closing=false,playing=false,resumeReady=false,resumeRequested=false,watchdog=0,guardTimer=0;
  var activityEvents=['storage','sukun:tabownerchange','sukun:audioaggregatechange','sukun:audiostate','sukun:itemrecordingchange'];
  function listen(target,type,handler){target.addEventListener(type,handler,{capture:true,passive:true});}
  function unlisten(target,type,handler){target.removeEventListener(type,handler,{capture:true});}
  function stop(reason){
    if(stopped)return;contextDiagnostic('audioContextStopState');if(Number.isFinite(started))budgetDiagnostic(started);stopped=true;
    if(typeof reason==='string')root.dataset.audioOutcome=reason;
    else if(root.dataset.audioOutcome==='waiting')root.dataset.audioOutcome='cancelled';
    if(watchdog)clearTimeout(watchdog);
    if(guardTimer)clearTimeout(guardTimer);
    if(readinessTimer)clearTimeout(readinessTimer);
    readinessTimer=0;
    watchdog=0;guardTimer=0;
    if(assetController){try{assetController.abort();}catch(_){}assetController=null;}
    assetBytes=null;buffer=null;
    try{if(bus){bus.gain.cancelScheduledValues(0);bus.gain.value=0;bus.disconnect();}}catch(_){}
    voices.forEach(function(voice){try{voice.osc.stop();}catch(_){}try{voice.osc.disconnect();if(voice.gain)voice.gain.disconnect();}catch(_){}});
    voices=[];bus=null;
    unlisten(document,'pointerdown',input);unlisten(document,'keydown',input);unlisten(document,'click',input);
    unlisten(document,'visibilitychange',visibility);unlisten(window,'pagehide',stop);
    unlisten(document,'play',activity);
    activityEvents.forEach(function(type){unlisten(window,type,activity);});
    root.removeEventListener('sukun:intro-cancel',stop);
    root.removeEventListener('sukun:intro-start',visualStart);
    if(context){
      try{context.removeEventListener('statechange',state);}catch(_){}
      // Pending resumes have no graph. Even if close fails, a late resolution
      // sees stopped=true and can never schedule sources or register an unlock.
      if(!closing&&context.state!=='closed'){
        closing=true;try{Promise.resolve(context.close()).then(function(){contextDiagnostic();},function(){contextDiagnostic();});contextDiagnostic();}catch(_){contextDiagnostic();}
      }
    }
  }
  function input(event){if(event.isTrusted===true)stop('cancelled');}
  function visibility(){if(document.hidden)stop('hidden');}
  function activity(){if(!stopped&&context&&!eligible(playing?0:HIT_MS+LEAD_MS))stop(ineligibleReason);}
  function state(){
    if(stopped)return;contextDiagnostic();
    if(context.state==='running'){start();return;}
    if(playing||context.state!=='suspended')stop('interrupted');
  }
  function guard(){
    guardTimer=0;
    if(stopped)return;
    activity();
    if(stopped)return;
    state();
    if(!stopped)guardTimer=setTimeout(guard,25);
  }
  function start(){
    if(stopped||playing||!resumeReady||!buffer||!context||context.state!=='running')return;
    if(!eligible(HIT_MS+LEAD_MS)){stop(ineligibleReason);return;}
    playing=true;
    try{
      bus=context.createGain();bus.gain.value=0;bus.connect(context.destination);
      var source=context.createBufferSource();voices.push({osc:source,gain:null});
      source.buffer=buffer;source.loop=false;source.playbackRate.value=1;
      source.connect(bus);
      // Buffer/node preparation and ownership reads may advance the audio clock.
      // Check again, then anchor this one whole signature to the fresh clock.
      if(stopped)return;
      if(context.state!=='running'){stop('interrupted');return;}
      if(!eligible(HIT_MS+LEAD_MS)){stop(ineligibleReason);return;}
      if(stopped)return;
      if(context.state!=='running'){stop('interrupted');return;}
      var t=context.currentTime+LEAD_MS/1000;
      if(!Number.isFinite(t)||t<0){stop('failed');return;}
      bus.gain.value=1;source.onended=function(){if(!stopped)stop();};
      source.start(t);diagnostic('audioSourcesScheduled','1');source.stop(t+HIT_MS/1000);
      root.dataset.audioOutcome='scheduled';assetBytes=null;buffer=null;
      clearTimeout(watchdog);
      watchdog=setTimeout(stop,Math.min(HIT_MS+110+LEAD_MS,INTRO_MS-(performance.now()-started)));
    }catch(_){stop('failed');}
  }
  function decodeAsset(){
    if(stopped||decodeStarted||!context||!assetBytes)return;
    if(!eligible(HIT_MS+LEAD_MS)){stop(ineligibleReason);return;}
    decodeStarted=true;diagnostic('audioDecodeState','decoding');
    try{
      var pending=context.decodeAudioData(assetBytes.slice(0));
      Promise.resolve(pending).then(function(value){
        if(stopped)return;
        if(!eligible(HIT_MS+LEAD_MS)){stop(ineligibleReason);return;}
        if(!value||!Number.isFinite(value.duration)||Math.abs(value.duration-3)>0.001||value.numberOfChannels!==1){
          diagnostic('audioDecodeState','invalid');stop('asset_failed');return;
        }
        buffer=value;assetBytes=null;diagnostic('audioDecodeState','ready');diagnostic('audioBufferDurationMs',Math.round(value.duration*1000));start();
      },function(){if(!stopped){diagnostic('audioDecodeState','failed');stop('asset_failed');}});
    }catch(_){diagnostic('audioDecodeState','failed');stop('asset_failed');}
  }
  function loadAsset(){
    if(stopped)return;
    diagnostic('audioAssetState','loading');diagnostic('audioDecodeState','not_started');
    try{
      if(!window.crypto||!window.crypto.subtle){diagnostic('audioAssetState','failed');stop('asset_failed');return;}
      assetController=typeof window.AbortController==='function'?new window.AbortController():null;
      var options={cache:'force-cache',credentials:'same-origin',integrity:'sha256-GecAJ60xJdEWWgn9tSnIeIEEjChmCU6I4aFp5B995Fc='};
      if(assetController)options.signal=assetController.signal;
      window.fetch('./assets/audio/sukun-intro-signature-r1037.wav?v=r1037',options).then(function(response){
        if(stopped)return null;
        if(!response||!response.ok)throw Error('asset');
        return response.arrayBuffer();
      }).then(function(bytes){
        if(stopped||!bytes)return null;
        if(bytes.byteLength!==288044)throw Error('length');
        return window.crypto.subtle.digest('SHA-256',bytes).then(function(digest){
          if(stopped)return;
          var actual=Array.prototype.map.call(new Uint8Array(digest),function(x){return x.toString(16).padStart(2,'0');}).join('');
          if(actual!=='19e70027ad3125d1165a09fdb529c87881048c2866094e88e1a169e41f7de457'){diagnostic('audioAssetState','integrity_failed');stop('asset_failed');return;}
          assetBytes=bytes;diagnostic('audioAssetState','ready');diagnostic('audioAssetReadyAgeMs',Math.max(0,Math.round(performance.now()-boot)));decodeAsset();
        });
      }).catch(function(){if(!stopped){diagnostic('audioAssetState','failed');stop('asset_failed');}});
    }catch(_){diagnostic('audioAssetState','failed');stop('asset_failed');}
  }
  function beginAudio(){
    if(stopped||context)return;
    started=Number(root.dataset.started);
    if(!eligible(HIT_MS+LEAD_MS)){stop(ineligibleReason);return;}
    if(!AudioContextClass){stop('unavailable');return;}
    try{
      root.dataset.audioOutcome='waiting';
      context=new AudioContextClass({latencyHint:'interactive'});contextDiagnostic('audioContextInitialState');
      context.addEventListener('statechange',state);
      if(stopped||!eligible(HIT_MS+LEAD_MS)){stop(ineligibleReason);return;}
      watchdog=setTimeout(function(){stop('resume_timeout');},INTRO_MS-HIT_MS-LEAD_MS-(performance.now()-started));
      decodeAsset();
      if(stopped)return;
      if(context.state==='running')resumeReady=true;
      else if(context.state==='suspended'){
        // Exactly one automatic request. Pending/denied autoplay never gets a
        // graph, and cannot borrow a later gesture or exceed this visual run.
        resumeRequested=true;resumeDiagnostic('pending');
        var result;try{result=context.resume();}catch(error){resumeDiagnostic('threw',error);stop('blocked');return;}
        Promise.resolve(result).then(function(){
          resumeDiagnostic('fulfilled');contextDiagnostic();
          if(stopped)return;
          resumeReady=true;state();
        },function(error){resumeDiagnostic('rejected',error);contextDiagnostic();stop('blocked');});
      }else{stop('interrupted');return;}
      guard();
    }catch(_){stop('failed');}
  }
  function visualStart(){if(stopped||context)return;readySent=false;if(readinessTimer)clearTimeout(readinessTimer);readinessTimer=0;readiness();}
  function readiness(){
    readinessTimer=0;if(stopped||readySent)return;
    if(!eligible(HIT_MS+LEAD_MS,true)){
      if(ineligibleReason==='apis_pending'||ineligibleReason==='timing_pending'){
        root.dataset.audioOutcome='waiting_readiness';
        readinessTimer=setTimeout(readiness,25);return;
      }
      stop(ineligibleReason);if(ineligibleReason==='dialog')root.dispatchEvent(new Event('sukun:intro-skip'));return;
    }
    readySent=true;root.dataset.audioReadyAgeMs=String(Math.max(0,Math.round(performance.now()-boot)));
    root.dataset.audioOutcome='ready';
    var clock=root.sukunIntroReadClock();
    if(clock&&!clock.waiting)beginAudio();
  }
  try{
    // Register cancellation before the readiness handshake or context creation.
    listen(document,'pointerdown',input);listen(document,'keydown',input);listen(document,'click',input);
    listen(document,'visibilitychange',visibility);listen(window,'pagehide',stop);
    listen(document,'play',activity);
    activityEvents.forEach(function(type){listen(window,type,activity);});
    root.addEventListener('sukun:intro-cancel',stop);
    root.addEventListener('sukun:intro-start',visualStart);
    if(handshake)readiness();else beginAudio();
    if(!stopped)loadAsset();
  }catch(_){stop('failed');}
})();
