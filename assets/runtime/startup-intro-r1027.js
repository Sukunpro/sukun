/* One automatic, optional bass hit. Completely separate from app audio.
   A denied/late/hidden attempt is discarded, never queued for a future tap. */
(function(){
  'use strict';
  var root=document.getElementById('sukun-auto-intro');
  if(!root||root.dataset.audioAttempted==='1')return;
  root.dataset.audioAttempted='1';
  // Ephemeral, nonvisual diagnostics only; scheduled does not prove audibility.
  root.dataset.audioOutcome='ineligible';
  var started=Number(root.dataset.started),INTRO_MS=1300,HIT_MS=650,ineligibleReason='ineligible';
  function deny(reason){ineligibleReason=reason;return false;}
  function eligible(requiredMs){
    var age=performance.now()-started;
    // Leave room for the complete unchanged hit before the visual exit.
    if(!Number.isFinite(started)||!Number.isFinite(age)||age<0||age+requiredMs>=INTRO_MS)return deny('expired');
    if(root.dataset.cancelled==='1')return deny('cancelled');
    if(root.hidden||document.hidden)return deny('hidden');
    // Unknown/active ownership is a reason for silence, never a reason to claim
    // or clear another tab's lock. These checks only read existing app state.
    try{
      if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return deny('reduced-motion');
      if(localStorage.getItem('sukun.tab.owner.r981'))return deny('unsafe-owner');
      if(!window.AudioLife||typeof window.AudioLife.busy!=='function'||
         !window.SukunSessionState||typeof window.SukunSessionState.snapshot!=='function'||
         !window.SukunTickSound||typeof window.SukunTickSound.isRecording!=='function'||
         typeof window.SukunPhysicalRecordingBusyR696!=='function')return deny('unavailable');
      if(window.AudioLife.busy()!==false||window.SukunTickSound.isRecording()!==false||
         window.SukunPhysicalRecordingBusyR696()!==false||
         window.SukunSessionState.snapshot().phase!=='IDLE')return deny('unsafe-audio');
      var owner=window.SukunTabOwner&&window.SukunTabOwner.snapshot();
      if(window.SukunTabOwner&&(!owner||owner.owned||owner.pending||owner.blocked||owner.maintenance||owner.retiring))return deny('unsafe-owner');
      var sessions=window.SukunAudioSessionRegistry&&window.SukunAudioSessionRegistry.aggregateSnapshot();
      if(sessions&&(sessions.active||sessions.playing||sessions.running||sessions.paused||(sessions.providerIds||[]).length))return deny('unsafe-audio');
      var media=document.querySelectorAll('audio,video');
      for(var m=0;m<media.length;m++)if(!media[m].paused&&!media[m].ended)return deny('unsafe-audio');
      return true;
    }catch(_){return deny('unavailable');}
  }
  if(!eligible(HIT_MS)){root.dataset.audioOutcome=ineligibleReason;return;}
  var AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass){root.dataset.audioOutcome='unavailable';return;}
  var context=null,voices=[],bus=null,stopped=false,closing=false,playing=false,resumeReady=false,watchdog=0,guardTimer=0;
  var activityEvents=['storage','sukun:tabownerchange','sukun:audioaggregatechange','sukun:audiostate','sukun:itemrecordingchange'];
  function listen(target,type,handler){target.addEventListener(type,handler,{capture:true,passive:true});}
  function unlisten(target,type,handler){target.removeEventListener(type,handler,{capture:true});}
  function stop(reason){
    if(stopped)return;stopped=true;
    if(typeof reason==='string')root.dataset.audioOutcome=reason;
    else if(root.dataset.audioOutcome==='waiting')root.dataset.audioOutcome='cancelled';
    if(watchdog)clearTimeout(watchdog);
    if(guardTimer)clearTimeout(guardTimer);
    watchdog=0;guardTimer=0;
    try{if(bus){bus.gain.cancelScheduledValues(0);bus.gain.value=0;bus.disconnect();}}catch(_){}
    voices.forEach(function(voice){try{voice.osc.stop();}catch(_){}try{voice.osc.disconnect();voice.gain.disconnect();}catch(_){}});
    voices=[];bus=null;
    unlisten(document,'pointerdown',input);unlisten(document,'keydown',input);unlisten(document,'click',input);
    unlisten(document,'visibilitychange',visibility);unlisten(window,'pagehide',stop);
    unlisten(document,'play',activity);
    activityEvents.forEach(function(type){unlisten(window,type,activity);});
    root.removeEventListener('sukun:intro-cancel',stop);
    if(context){
      try{context.removeEventListener('statechange',state);}catch(_){}
      // Pending resumes have no graph. Even if close fails, a late resolution
      // sees stopped=true and can never schedule sources or register an unlock.
      if(!closing&&context.state!=='closed'){
        closing=true;try{Promise.resolve(context.close()).catch(function(){});}catch(_){}
      }
    }
  }
  function input(event){if(event.isTrusted===true)stop('cancelled');}
  function visibility(){if(document.hidden)stop('hidden');}
  function activity(){if(!stopped&&!eligible(playing?0:HIT_MS))stop(ineligibleReason);}
  function state(){
    if(stopped)return;
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
    if(stopped||playing||!resumeReady||context.state!=='running')return;
    if(!eligible(HIT_MS)){stop(ineligibleReason);return;}
    playing=true;
    try{
      bus=context.createGain();bus.gain.value=0.6;bus.connect(context.destination);
      var t=context.currentTime;
      // One shared onset, three sine partials. Their amplitude upper bound is
      // (0.28 + 0.09 + 0.035) * 0.6 = 0.243, well below digital full scale.
      [{ratio:1,peak:0.28},{ratio:2,peak:0.09},{ratio:3,peak:0.035}].forEach(function(part){
        var osc=context.createOscillator(),gain=context.createGain();
        voices.push({osc:osc,gain:gain});osc.type='sine';
        osc.frequency.setValueAtTime(86*part.ratio,t);
        osc.frequency.exponentialRampToValueAtTime(48*part.ratio,t+0.13);
        gain.gain.setValueAtTime(0,t);
        gain.gain.linearRampToValueAtTime(part.peak,t+0.016);
        gain.gain.exponentialRampToValueAtTime(0.0001,t+0.62);
        osc.connect(gain);gain.connect(bus);
      });
      // Recheck after graph construction as well: a slow attempt must not
      // schedule its first source after input, ownership change or expiry.
      if(stopped)return;
      if(context.state!=='running'){stop('interrupted');return;}
      if(!eligible(HIT_MS)){stop(ineligibleReason);return;}
      voices.forEach(function(voice){voice.osc.start(t);voice.osc.stop(t+0.65);});
      root.dataset.audioOutcome='scheduled';
      clearTimeout(watchdog);
      watchdog=setTimeout(stop,Math.min(760,INTRO_MS-(performance.now()-started)));
    }catch(_){stop('failed');}
  }
  try{
    // Register cancellation before creating/resuming the isolated context.
    listen(document,'pointerdown',input);listen(document,'keydown',input);listen(document,'click',input);
    listen(document,'visibilitychange',visibility);listen(window,'pagehide',stop);
    listen(document,'play',activity);
    activityEvents.forEach(function(type){listen(window,type,activity);});
    root.addEventListener('sukun:intro-cancel',stop);
    root.dataset.audioOutcome='waiting';
    context=new AudioContextClass({latencyHint:'interactive'});
    context.addEventListener('statechange',state);
    if(stopped||!eligible(HIT_MS)){stop(ineligibleReason);return;}
    watchdog=setTimeout(function(){stop('expired');},INTRO_MS-HIT_MS-(performance.now()-started));
    if(context.state==='running')resumeReady=true;
    else if(context.state==='suspended'){
      // Exactly one automatic request, while the intro can still contain the
      // whole hit. Browser autoplay policy remains authoritative. A blocked
      // or never-settling promise expires without even an oscillator graph.
      Promise.resolve(context.resume()).then(function(){
        if(stopped)return;
        resumeReady=true;state();
      },function(){stop('blocked');});
    }else{stop('interrupted');return;}
    guard();
  }catch(_){stop('failed');}
})();
