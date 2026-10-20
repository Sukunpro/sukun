/* SÜKÛN r1101 — NeuroSync tools share the existing frequency controller. */
(()=>{
 'use strict';
 if(window.SukunFrequencyHubR1101)return;
 const VERSION='r1101',$=id=>document.getElementById(id);
 const safe=(fn,fallback=null)=>{try{return fn()}catch(_){return fallback}};
 const T=(tr,en)=>window.I18N?.lang==='en'?en:tr;
 const TOOLS={overview:['Öneriler','Suggestions','panel-main'],library:['Kütüphane','Library','panel-lib'],sweep:['Tarama','Sweep','panel-main'],breath:['Nefes','Breathing','panel-breath'],cymatics:['Kimatik','Cymatics','panel-cym'],guided:['Rehberli oturum','Guided session','panel-med']};
 let host=null,native=null,initializing=false,initialized=false,selectedTool='overview',expanded=false,poll=0,renderKey='';
 let libraryNoticeKey='';
 let sweep=null,sweepTick=0,frequencyTimer=null,timerTick=0;
 const nativeCards={};
 function frequency(){return safe(()=>({playing:!!FR.playing,c:+FR.c,b:+FR.b,mode:FR.mode,vol:+FR.vol,pink:!!FR.pink}),{playing:false,c:180,b:7.83,mode:'bin',vol:.5,pink:false})}
 function pending(){return safe(()=>!!(FR._restartTimer||FR._restartHeld),false)}
 function held(){return !!(safe(()=>window.SukunAudioSessionRegistry?.aggregateSnapshot?.()?.paused,false)||safe(()=>MINI?.paused,false)||safe(()=>window.AudioLife?.userPaused&&!window.AudioLife?._terminalIntent,false))}
 function notify(text){libraryNoticeKey='';const el=$('r1101FrequencyNotice');if(el){el.textContent=text;el.hidden=!text}}
 function libraryStateKey(f=frequency(),paused=held()){return[f.playing,paused,f.c,f.b].join('|')}
 function publish(reason){safe(()=>window.SukunAudioSessionRegistry?.schedule?.('frequency-hub:'+reason));safe(()=>window.currentFlowState?.refresh?.('frequency-hub:'+reason,true));safe(()=>window.SukunNowPlayingStore?.refresh?.());}
 function persist(){safe(()=>saveSettings())}
 function mirror(){
  const f=frequency(),paused=held();
  // A library message describes this exact playback state. Native Stop,
  // global Pause/Resume and manual tuning must not leave a stale claim.
  if(libraryNoticeKey&&libraryNoticeKey!==libraryStateKey(f,paused))notify('');
  if(initialized){safe(()=>native?.frequencyHubSync?.(f));const tag=$('cymHzTag');if(tag)tag.textContent=f.c.toFixed(1)+' Hz';}
  const key=[f.playing,paused,f.c.toFixed(1),f.b.toFixed(2),f.mode,window.I18N?.lang,sweep?.active,frequencyTimer?.end].join('|');
  if(key!==renderKey){renderKey=key;const state=$('r1101FrequencyState');if(state)state.textContent=(paused?T('Duraklatıldı','Paused'):f.playing?T('Çalıyor','Playing'):T('Hazır','Ready'))+' · '+f.c.toFixed(1)+' Hz / '+f.b.toFixed(2)+' Hz';}
  paintSweep();paintTimer();
 }
 function apply(values={},options={}){
  if(initializing)return false;
  const wasHeld=held();
  if(!options.sweep)stopSweep(false);
  safe(()=>stopJourney());
  // The retired journey may still own future AudioParam ramps after its
  // JavaScript timers stop. Retire those targets before applying this set.
  cancelRamps();
  safe(()=>{
   if(Number.isFinite(+values.c))FR.c=Math.min(18000,Math.max(20,+values.c));
   if(Number.isFinite(+values.b))FR.b=Math.min(40,Math.max(.5,+values.b));
   if(['bin','iso','mono','mix'].includes(values.mode)&&FR.mode!==values.mode){
    const on=FR.playing;if(on)frStop();FR.mode=values.mode;if(on&&!wasHeld&&!held())$('frToggle')?.click();
   }
   if(typeof values.pink==='boolean'&&FR.pink!==values.pink)$('pinkTgl')?.click();
   frRetune();syncFreqUI();
   document.querySelectorAll('#modeSeg [data-m]').forEach(b=>b.classList.toggle('act',b.dataset.m===FR.mode));
  });
  mirror();persist();return true;
 }
 function start(){
  if(held()){notify(T('Genel duraklatma açık. Önce ana kontrollerden Devam et seçin.','Global pause is active. Choose Resume in the main controls first.'));return false;}
  if(!frequency().playing){if(pending())safe(()=>frCancelPendingStart());$('frToggle')?.click();}
  mirror();publish('start');return frequency().playing;
 }
 function toggle(){if(frequency().playing||pending())stop();else start();return frequency().playing}
 function stop(){stopSweep(false);cancelTimer(false);if(frequency().playing)$('frToggle')?.click();else safe(()=>frStop());mirror();publish('stop');return true}
 function fromControls(){
  return apply({c:parseFloat($('carrierFreq')?.value),b:parseFloat($('beatFreq')?.value)});
 }
 function applyPreset(p){
  if(initializing||!p)return false;
  apply({c:p.carrier,b:p.beat,pink:p.noise==='pink'});
  notify(T('Ayarlar hazır: ','Settings ready: ')+(safe(()=>window.I18N?.t?.(p.name),p.name)||p.name)+T('. Sesi ana Frekansı Başlat düğmesinden açabilirsiniz.','. Use the main Start frequency button to play.'));
  open('overview',{navigate:false});return true;
 }
 function applyLibrary(item){
  if(initializing||!item?.apply||item.journey)return false;
  const a=item.apply,c=a.c??a.hz;
  if(!Number.isFinite(c)||(a.b!=null&&!Number.isFinite(a.b)))return false;
  const values={c};if(a.b!=null)values.b=a.b;
  if(!apply(values))return false;
  // A library activation is an explicit play request. Reuse the common
  // start guard: a playing graph is retuned, and global pause stays held.
  const playing=start(),name=safe(()=>window.I18N?.t?.(item.name),item.name)||item.name;
  notify(name+(playing?T(' çalıyor.',' is playing.'):held()?T(' uygulandı. Genel duraklatma açık; ana kontrollerden Devam et seçin.',' applied. Global pause is active; choose Resume in the main controls.'):T(' uygulandı. Çalma başlatılamadı; Frekansı Başlat düğmesini kullanın.',' applied. Playback could not start; use Start frequency.')));
  libraryNoticeKey=libraryStateKey();
  mirror();return playing;
 }
 function sweepValue(s=sweep){
  if(!s)return frequency().c;
  const now=safe(()=>ctx.currentTime,s.t0),p=Math.max(0,Math.min(1,(now-s.t0)/s.duration));
  return s.scale==='log'?s.from*Math.pow(s.to/s.from,p):s.from+(s.to-s.from)*p;
 }
 function cancelRamps(){
  const now=safe(()=>ctx.currentTime,null);if(now===null)return;
  for(const node of [FR.oL,FR.oR,FR.iso,FR.gate,...(FR.harmonics||[]).map(h=>h.osc)])safe(()=>{
   const p=node?.frequency;if(!p)return;
   // Capture before cancellation: older implementations may then expose the
   // pre-ramp value. Hold natively when supported for a continuous handoff.
   const value=p.value;
   if(typeof p.cancelAndHoldAtTime==='function'){
    try{p.cancelAndHoldAtTime(now);return}catch(_){}
   }
   p.cancelScheduledValues(now);p.setValueAtTime(value,now);
  });
 }
 function scheduleSweep(){
  if(!sweep||!frequency().playing)return false;
  safe(()=>{
   const now=ctx.currentTime;sweep.t0=now;FR.c=sweep.from;frRetune(.01);
   const targets=[{node:FR.oL,offset:-FR.b/2},{node:FR.oR,offset:FR.b/2},{node:FR.iso,offset:0}];
   for(const {node,offset} of targets){if(!node?.frequency)continue;const p=node.frequency;
    p.cancelScheduledValues(now);p.setValueAtTime(Math.max(1,sweep.from+offset),now);
    const target=Math.max(1,sweep.to+offset);
    if(sweep.scale==='log'){
     // Use the same interpolated carrier curve in both ears. Independent
     // exponential ramps of c±b/2 would change the beat difference mid-sweep.
     const curve=new Float32Array(257);
     for(let i=0;i<curve.length;i++)curve[i]=sweep.from*Math.pow(sweep.to/sweep.from,i/(curve.length-1))+offset;
     p.setValueCurveAtTime(curve,now,sweep.duration);
    }else p.linearRampToValueAtTime(target,now+sweep.duration);
   }
   frTuneHarmonics(sweep.to,.15,sweep.duration,sweep.from,sweep.scale,now);
  });
  return true;
 }
 function resumeSweepAfterRebuild(){
  if(!sweep?.active)return false;const current=sweepValue(),remaining=Math.max(.001,sweep.t0+sweep.duration-ctx.currentTime);
  sweep.original=sweep.original||{from:sweep.from,duration:sweep.duration};sweep.from=current;sweep.duration=remaining;return scheduleSweep();
 }
 function startSweep(){
  if(held()){start();return false}
  const from=parseFloat($('sweepStart')?.value),to=parseFloat($('sweepEnd')?.value),duration=parseFloat($('sweepDur')?.value);
  if(!Number.isFinite(from)||!Number.isFinite(to)||from<20||to<20||from>18000||to>18000||!Number.isFinite(duration)||duration<.5||duration>600){notify(T('Tarama için 20–18000 Hz ve 0,5–600 saniye girin.','Enter 20–18000 Hz and 0.5–600 seconds for the sweep.'));return false}
  stopSweep(false);safe(()=>stopJourney());apply({c:from},{sweep:true});if(!start())return false;
  const safeFrom=safe(()=>frSafeCarrier(from,FR.b),from),safeTo=safe(()=>frSafeCarrier(to,FR.b),to);
  sweep={active:true,from:safeFrom,to:safeTo,duration,scale:document.querySelector('#sweepScaleGroup .active')?.dataset.scale==='linear'?'linear':'log',loop:!!$('sweepLoop')?.checked,t0:0};
  FR._sweepActive=true;safe(()=>window.SukunBackgroundMix?.changed?.('frequency-sweep',{immediate:true}));
  scheduleSweep();sweepTick=setInterval(updateSweep,100);paintSweep();publish('sweep');return true;
 }
 function updateSweep(){
  if(!sweep?.active)return;
  if(!frequency().playing){stopSweep(false);return}
  const current=sweepValue();safe(()=>{FR.c=current;if(!document.hidden)syncFreqUI()});
  if(safe(()=>ctx.currentTime,0)>=sweep.t0+sweep.duration){
   if(sweep.loop&&!held()){if(sweep.original){sweep.from=sweep.original.from;sweep.duration=sweep.original.duration;sweep.original=null;}scheduleSweep();}else stopSweep(false);
  }
  mirror();
 }
 function stopSweep(user=false){
  const old=sweep;
  // Retire ownership before native retuning can synchronously publish a
  // background-mix update and re-enter this controller through its listener.
  sweep=null;FR._sweepActive=false;clearInterval(sweepTick);sweepTick=0;
  if(old?.active){const c=sweepValue(old);cancelRamps();safe(()=>{FR.c=c;frRetune(.03);syncFreqUI()});}
  paintSweep();
  if(user)notify(T('Tarama durdu; ana frekans son değerde sürer.','Sweep stopped; the main frequency continues at its last value.'));
  return !!old;
 }
 function paintSweep(){
  if($('sweepGo'))$('sweepGo').hidden=!!sweep?.active;
  if($('sweepStopBtn'))$('sweepStopBtn').hidden=!sweep?.active;
  const status=$('r1101SweepStatus');if(status)status.textContent=sweep?.active?T('Tarama sürüyor · ','Sweeping · ')+frequency().c.toFixed(1)+' Hz':T('Tek frekans motorunu kullanır; ambiyans ve zikir değişmez.','Uses the main frequency engine; ambience and dhikr are preserved.');
 }
 function cymToggle(hz){
  const value=+hz;if(!Number.isFinite(value))return false;
  const f=frequency(),same=Math.abs(f.c-value)<.1;
  if(same&&f.playing){stop();return false}
  apply({c:value});return start();
 }
 function timerRemaining(){return frequencyTimer?Math.max(0,frequencyTimer.end==null?frequencyTimer.duration:frequencyTimer.end-safe(()=>ctx.currentTime,0)):0;}
 function cancelTimer(restore=true){
  const had=!!frequencyTimer;clearInterval(timerTick);timerTick=0;frequencyTimer=null;FR._timerEnd=null;FR._timerFade=null;
  if(restore)safe(()=>frApplyGains(.3));paintTimer();
  if(had)safe(()=>window.SukunBackgroundMix?.changed?.('frequency-timer-cancel',{immediate:true}));
 }
 function armTimer(){
  if(!frequencyTimer)return false;
  if(frequencyTimer.end==null)frequencyTimer.end=ctx.currentTime+frequencyTimer.duration;
  FR._timerEnd=frequencyTimer.end;FR._timerFade=frequencyTimer.fade;
  return true;
 }
 function setTimer(minutes,source){
  cancelTimer();const mins=+minutes;if(!Number.isFinite(mins)||mins<=0)return true;
  frequencyTimer={duration:Math.min(180,mins)*60,end:null,fade:Math.min(300,Math.max(5,+$('fadeDuration')?.value||60))};
  if(frequency().playing){armTimer();safe(()=>frApplyGains(.3));}
  document.querySelectorAll('#ns .timer-btn').forEach(b=>b.classList.toggle('active',b===source||+b.dataset.min===mins));
  timerTick=setInterval(updateTimer,250);paintTimer();
  // Timed frequencies stay on the scheduled AudioContext envelope. A looping
  // pre-rendered mix cannot own a deadline, so it retains ambience only.
  safe(()=>window.SukunBackgroundMix?.changed?.('frequency-timer',{immediate:true}));return true;
 }
 function updateTimer(){
  if(!frequencyTimer)return;
  if(frequency().playing&&frequencyTimer.end==null){armTimer();safe(()=>frApplyGains(.3));}
  if(frequencyTimer.end!=null&&timerRemaining()<=0){stop();notify(T('Frekans süresi tamamlandı.','Frequency timer finished.'));return;}
  paintTimer();
 }
 function paintTimer(){
  const display=$('timerDisplay');if(display){const s=frequencyTimer?Math.ceil(timerRemaining()):null;display.textContent=s==null?'—':String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
  if(!frequencyTimer)document.querySelectorAll('#ns .timer-btn').forEach(b=>b.classList.remove('active'));
 }
 function text(el,tr,en){if(!el)return;el.dataset.frTr=tr;el.dataset.frEn=en;el.textContent=T(tr,en)}
 function makePanel(id){const p=document.createElement('div');p.id=id;p.className='r1101FrequencyPanel';return p}
 function moveCard(id,target){const el=$(id)?.closest('.card');if(el){nativeCards[id]=el;target.appendChild(el)}return el}
 function ensureNative(){
  if(initialized)return native;if(initializing)return native;
  initializing=true;
  try{
   native=window.Neuro?.hazirla?.();
   const ns=$('ns'),app=ns?.querySelector(':scope > .app');if(!native||!ns||!app)return null;
   const overview=makePanel('r1101FrequencyOverview'),sweepPanel=makePanel('r1101FrequencySweep');app.append(overview,sweepPanel);
   moveCard('spectrumCanvas',overview);moveCard('aiInput',overview);
   const time=moveCard('timerDisplay',overview);if(time){text(time.querySelector('.card-title'),'Frekans süresi','Frequency timer');const n=document.createElement('p');n.className='r1101FrequencyNote';text(n,'Ana frekans, harmonikler, gürültü ve ikinci katman birlikte kapanır. Duraklatmada süre bekler. Zikir ve ambiyans sürer. Süreli frekans, tarama ve yolculuk kilitte canlı ses yolunu kullanır; cihaz desteği değişebilir.','Main tone, harmonics, noise and second layer stop together. Pause holds the timer. Dhikr and ambience continue. Timed frequency, sweeps and journeys use live audio while locked; device support may vary.');time.appendChild(n)}
   const sweepCard=moveCard('sweepToggle',sweepPanel);if(sweepCard){$('sweepBody').hidden=false;$('sweepToggle').onclick=null;$('sweepToggle').removeAttribute('style');$('sweepChev').hidden=true;$('sweepToggle').setAttribute('role','heading');$('sweepToggle').setAttribute('aria-level','3');const status=document.createElement('p');status.id='r1101SweepStatus';status.className='r1101FrequencyNote';status.setAttribute('role','status');sweepCard.appendChild(status)}
   for(const id of ['sweepStart','sweepEnd'])if($(id)){$(id).min='20';$(id).max='18000'}
   host.querySelector('.r1101FrequencyDeck').appendChild(ns);
   ns.dataset.frequencyHub=VERSION;ns.removeAttribute('role');ns.hidden=!expanded;
   const legacy=$('panel-main');if(legacy){legacy.hidden=true;legacy.inert=true;legacy.setAttribute('aria-hidden','true')}
   const libNote=$('panel-lib')?.querySelector('.libNote');text(libNote,'Bir sete dokununca ana frekans ayarlanır ve çalmaya başlar. Çalıyorsa aynı ses akışı seçilen sete geçer. Genel duraklatma açıkken yalnız ayarlar uygulanır. Çok aşamalı yolculuklar başlatma alanına yönlendirir.','Tap a set to apply it and play the main frequency. While playing, the same audio stream switches to the selected set. During global pause, only settings are applied. Multi-stage journeys open their start area.');
   ns.querySelector('#tabNav')?.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;const tool=Object.keys(TOOLS).find(k=>TOOLS[k][2]===b.dataset.tab);if(tool)displayTool(tool)});
   $('cymNum')?.addEventListener('change',e=>{const c=+e.target.value;if(Number.isFinite(c))apply({c})});
   for(const id of ['cymPrev','cymNext'])$(id)?.addEventListener('click',()=>{const c=+$('cymNum')?.value;if(Number.isFinite(c))apply({c})});
   $('fadeDuration')?.addEventListener('input',e=>{if(frequencyTimer){frequencyTimer.fade=Math.min(300,Math.max(5,+e.target.value||60));armTimer();safe(()=>frApplyGains(.3))}});
   for(const [key,tool]of Object.entries(TOOLS)){const panel=$(key==='overview'?'r1101FrequencyOverview':key==='sweep'?'r1101FrequencySweep':tool[2]);if(panel){panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','r1101FrequencyTab-'+key)}}
   // Give native suggestion cards their existing keyboard action, with no copies.
   ns.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const el=e.target.closest('.ai-result-preset');if(el){e.preventDefault();el.click()}});
   new MutationObserver(()=>{ns.querySelectorAll('.ai-result-preset').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button')})}).observe($('aiResponse'),{childList:true,subtree:true});
   initialized=true;safe(()=>window.icoHydrate?.());localize();mirror();return native;
  }finally{initializing=false}
 }
 function displayTool(tool){
  if(!TOOLS[tool])tool='overview';selectedTool=tool;
  if(!initialized)return;
  for(const [id,key] of [['r1101FrequencyOverview','overview'],['r1101FrequencySweep','sweep'],['panel-lib','library'],['panel-breath','breath'],['panel-cym','cymatics'],['panel-med','guided']]){
   const p=$(id);if(p){p.hidden=key!==tool;p.classList.toggle('active',key===tool)}
  }
  if($('panel-main'))$('panel-main').hidden=true;
  host.querySelectorAll('[data-fr-tool]').forEach(b=>{const on=b.dataset.frTool===tool;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;b.classList.toggle('active',on)});
  mirror();
 }
 function choose(tool){
  if(!TOOLS[tool])tool='overview';
  ensureNative();
  native?.selectPanel?.(TOOLS[tool][2]);displayTool(tool);
 }
 function open(tool='overview',options={}){
  if(typeof tool!=='string'||!TOOLS[tool])tool='overview';
  mount();if(!host)return false;
  expanded=true;$('r1101FrequencyToolsToggle').setAttribute('aria-expanded','true');host.querySelector('.r1101FrequencyTools').hidden=false;
  if(options.navigate!==false)document.querySelector('.tab[data-t="frq"]')?.click();
  choose(tool);syncVisibility();mirror();return true;
 }
 function close(){
  expanded=false;if(host){$('r1101FrequencyToolsToggle')?.setAttribute('aria-expanded','false');host.querySelector('.r1101FrequencyTools').hidden=true}
  if($('ns'))$('ns').hidden=true;clearInterval(poll);poll=0;
  // Collapsing tools changes navigation only; the one frequency keeps its state.
  return true;
 }
 function syncVisibility(){
  const visible=expanded&&!$('tab-frq')?.hidden&&!document.hidden;
  if($('ns'))$('ns').hidden=!visible;
  clearInterval(poll);poll=visible?setInterval(mirror,500):0;
 }
 function localize(){
  if(!host)return;
  host.querySelectorAll('[data-fr-tr]').forEach(el=>{el.textContent=T(el.dataset.frTr,el.dataset.frEn)});
  host.setAttribute('aria-label',T('Frekans araçları','Frequency tools'));
  for(const [key,t] of Object.entries(TOOLS)){const b=host.querySelector('[data-fr-tool="'+key+'"]');if(b)b.textContent=T(t[0],t[1])}
  renderKey='';mirror();
 }
 function coachSpeechAllowed(owned=false){
  if(held()||safe(()=>Z.auto,false)||safe(()=>window.SukunR698Transport?.hasJourney?.(),false))return false;
  const reader=safe(()=>window.SukunReadingAudioR1064?.snapshot?.());if(reader&&['playing','preparing','paused'].includes(reader.phase))return false;
  const player=window.R170?.Player;if(player&&(player.playing||player.paused))return false;
  const recording=safe(()=>window.SukunItemRecording?.snapshot?.());if(recording&&['permission','preparing','recording','stopping','saving'].includes(recording.phase))return false;
  const session=safe(()=>window.SukunSessionState?.peek?.()||window.SukunSessionState?.snapshot?.());if(session&&(session.playing||session.preparing||session.paused||session.smartSession?.running))return false;
  if(!owned&&safe(()=>speechSynthesis.speaking||speechSynthesis.pending,false))return false;
  return true;
 }
 function mount(){
  const tab=$('tab-frq');if(!tab)return;
  const old=$('neuroBtn');if(old){old.hidden=true;old.setAttribute('aria-hidden','true');old.tabIndex=-1}
  if($('r1101FrequencyHub')){host=$('r1101FrequencyHub');return}
  host=document.createElement('section');host.id='r1101FrequencyHub';host.className='r1101FrequencyHub';host.setAttribute('aria-label',T('Frekans araçları','Frequency tools'));
  host.innerHTML='<div class="r1101FrequencyTop"><button id="r1101FrequencyToolsToggle" type="button" class="btn" aria-expanded="false" aria-controls="r1101FrequencyTools"></button><small id="r1101FrequencyState" role="status"></small></div><div class="r1101FrequencyTools" id="r1101FrequencyTools" hidden><p class="r1101FrequencyIntro"></p><div class="r1101FrequencyNav" role="tablist" aria-label="NeuroSync"></div><p id="r1101FrequencyNotice" class="r1101FrequencyNote" role="status" hidden></p><div class="r1101FrequencyDeck"></div></div>';
  text(host.querySelector('#r1101FrequencyToolsToggle'),'NeuroSync · Frekans araçları','NeuroSync · Frequency tools');
  text(host.querySelector('.r1101FrequencyIntro'),'Kütüphane, tarama ve görsel rehberler aynı frekans ayarlarını kullanır.','Library, sweep and visual guides use the same frequency settings.');
  for(const [key,t]of Object.entries(TOOLS)){const b=document.createElement('button');b.type='button';b.id='r1101FrequencyTab-'+key;b.dataset.frTool=key;b.setAttribute('role','tab');b.setAttribute('aria-controls',key==='overview'?'r1101FrequencyOverview':key==='sweep'?'r1101FrequencySweep':t[2]);b.setAttribute('aria-selected',String(key===selectedTool));b.tabIndex=key===selectedTool?0:-1;b.textContent=T(t[0],t[1]);b.addEventListener('click',()=>choose(key));host.querySelector('.r1101FrequencyNav').appendChild(b)}
  host.querySelector('.r1101FrequencyNav').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const tabs=[...host.querySelectorAll('[data-fr-tool]')],i=tabs.indexOf(e.target);if(i<0)return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();tabs[next].click()});
  const mainCard=$('frToggle')?.closest('.card');if(mainCard?.parentElement===tab)mainCard.after(host);else tab.insertBefore(host,old||tab.firstChild);
  $('r1101FrequencyToolsToggle').onclick=()=>expanded?close():open(selectedTool,{navigate:false});
  const nsFacade=window.Neuro;if(nsFacade){nsFacade.open=open;nsFacade.close=close;const breath=nsFacade.startBreathById?.bind(nsFacade);if(breath)nsFacade.startBreathById=(...args)=>{ensureNative();return breath(...args)}}
  tab.addEventListener('input',e=>{if(e.target.closest('#ns'))return;if(sweep&&['carSld','carNum','beatSld','beatNum'].includes(e.target.id))stopSweep(false);queueMicrotask(mirror)},true);
  // The native 3D knob and held +/- buttons retune directly without input
  // events. Cancel a scheduled sweep before those manual controls take over.
  tab.addEventListener('pointerdown',e=>{if(sweep&&e.target.closest('#carKnob,#carInc,#carDec'))stopSweep(false)},{capture:true,passive:true});
  tab.addEventListener('keydown',e=>{if(sweep&&e.target.closest('#carKnob')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))stopSweep(false)},true);
  tab.addEventListener('click',e=>{if(e.target.closest('#ns'))return;if(sweep&&e.target.closest('#modeSeg,#presets,#bandChips,#beatChips,#carChips,#carInc,#carDec,#jRun'))stopSweep(false);setTimeout(mirror,0)},true);
  safe(()=>window.addEventListener('sukun:languagechange',localize));
  ['sukun:audioaggregatechange','sukun:audiostate','sukun:backgroundmix'].forEach(ev=>window.addEventListener(ev,()=>{if(sweep&&!frequency().playing)stopSweep(false);mirror()},{passive:true}));
  ['sukun:tabchange','sukun:r616viewchange'].forEach(ev=>window.addEventListener(ev,syncVisibility,{passive:true}));
  document.addEventListener('visibilitychange',syncVisibility,{passive:true});
  window.addEventListener('pagehide',()=>{if(sweep)stopSweep(false)},{passive:true});
  mirror();
 }
 const controller=Object.freeze({open,close,toggle,stop,start,applyPreset,applyLibrary,startFromControls(){if(!initializing)fromControls();return start()},retuneFromControls:fromControls,startSweep,stopSweep,resumeSweepAfterRebuild,cymToggle,setTimer,cancelTimer,armTimer,timerRemaining,state:frequency,canStartCoach:()=>!held(),coachSpeechAllowed});
 window.SukunFrequencyHubR1101=Object.freeze({version:VERSION,open,close,controller,snapshot:()=>({version:VERSION,initialized,selectedTool,expanded,mounted:!!$('ns')?.closest('#tab-frq'),frequency:frequency(),sweep:sweep?{active:!!sweep.active,from:sweep.from,to:sweep.to,duration:sweep.duration,loop:sweep.loop}: {active:false},timer:frequencyTimer?{remaining:timerRemaining()*1000}:null,native:safe(()=>native?.frequencyHubSnapshot?.()),duplicateControllers:document.querySelectorAll('#frToggle').length})});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
