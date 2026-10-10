/* One automatic, optional bass hit. Completely separate from app audio.
   A denied/late/hidden attempt is discarded, never queued for a future tap. */
(function(){
  'use strict';
  var root=document.getElementById('sukun-auto-intro');
  if(!root||root.dataset.audioAttempted==='1')return;
  root.dataset.audioAttempted='1';
  var started=Number(root.dataset.started),age=performance.now()-started;
  if(!Number.isFinite(started)||!Number.isFinite(age)||age<0||age>240||
      root.dataset.cancelled==='1'||root.hidden||document.hidden)return;
  try{if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;}catch(_){return;}
  // Unknown/active ownership is a reason for silence, never a reason to claim
  // or clear another tab's lock. No writes, acquires or retries occur here.
  try{
    if(localStorage.getItem('sukun.tab.owner.r981'))return;
    if(!window.AudioLife||typeof window.AudioLife.busy!=='function'||
       !window.SukunSessionState||typeof window.SukunSessionState.snapshot!=='function'||
       !window.SukunTickSound||typeof window.SukunTickSound.isRecording!=='function'||
       typeof window.SukunPhysicalRecordingBusyR696!=='function')return;
    if(window.AudioLife.busy()!==false||window.SukunTickSound.isRecording()!==false||
       window.SukunPhysicalRecordingBusyR696()!==false||
       window.SukunSessionState.snapshot().phase!=='IDLE')return;
    var sessions=window.SukunAudioSessionRegistry&&window.SukunAudioSessionRegistry.aggregateSnapshot();
    if(sessions&&(sessions.active||sessions.playing||sessions.running||sessions.paused||(sessions.providerIds||[]).length))return;
    var media=document.querySelectorAll('audio,video');
    for(var m=0;m<media.length;m++)if(!media[m].paused&&!media[m].ended)return;
  }catch(_){return;}
  var AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass)return;
  var context=null,voices=[],bus=null,stopped=false,closing=false,watchdog=0;
  function listen(target,type,handler){target.addEventListener(type,handler,{capture:true,passive:true});}
  function unlisten(target,type,handler){target.removeEventListener(type,handler,{capture:true});}
  function stop(){
    if(stopped)return;stopped=true;
    if(watchdog)clearTimeout(watchdog);
    watchdog=0;
    try{if(bus){bus.gain.cancelScheduledValues(0);bus.gain.value=0;bus.disconnect();}}catch(_){}
    voices.forEach(function(voice){try{voice.osc.stop();}catch(_){}try{voice.osc.disconnect();voice.gain.disconnect();}catch(_){}});
    voices=[];bus=null;
    unlisten(document,'pointerdown',input);unlisten(document,'keydown',input);
    unlisten(document,'visibilitychange',visibility);unlisten(window,'pagehide',stop);
    root.removeEventListener('sukun:intro-cancel',stop);
    if(context){
      try{context.removeEventListener('statechange',state);}catch(_){}
      // Closing a suspended context is safe. Even if close is rejected, no
      // sources were scheduled for a blocked attempt and all others are muted.
      if(!closing&&context.state!=='closed'){
        closing=true;try{Promise.resolve(context.close()).catch(function(){});}catch(_){}
      }
    }
  }
  function input(event){if(event.isTrusted===true)stop();}
  function visibility(){if(document.hidden)stop();}
  function state(){if(context&&context.state!=='running')stop();}
  try{
    context=new AudioContextClass({latencyHint:'interactive'});
    // Never resume. A fresh context must already be permitted to run now.
    // Suspended contexts have no oscillator graph and are immediately closed.
    if(context.state!=='running'||document.hidden||root.dataset.cancelled==='1'||performance.now()-started>240){stop();return;}
    listen(document,'pointerdown',input);listen(document,'keydown',input);
    listen(document,'visibilitychange',visibility);listen(window,'pagehide',stop);
    context.addEventListener('statechange',state);
    root.addEventListener('sukun:intro-cancel',stop);
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
      osc.connect(gain);gain.connect(bus);osc.start(t);osc.stop(t+0.65);
    });
    watchdog=setTimeout(stop,760);
  }catch(_){stop();}
})();
