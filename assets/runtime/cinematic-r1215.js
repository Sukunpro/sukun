/* Presentation-only ambience. Existing scene/performance/saver owners retain
   preferences; this module never issues a playback or counter command. */
(()=>{'use strict';
 const w=window,d=document,R=d.documentElement,$=id=>d.getElementById(id);
 const modes=['cinematic','balanced','saving'],globalMode={cinematic:'tam',balanced:'dengeli',saving:'pil'};
 const reducedQuery='(prefers-reduced-motion: reduce)',reduced=w.matchMedia(reducedQuery);
 let reducedMotion=!!reduced.matches;
 const runtime={readyAtLoad:d.readyState,startAttempts:0,started:false,mediaListener:false,reconciliations:0,startupError:null};
 const tr=(a,b)=>w.I18N?.lang==='en'?b:a;
 let frame=0,lastIdentity=null,lastScene=null,lastView=null,lastQualityPaint='',entryAnimation=null,nameAnimations=[],saverObserver=null,observedSaver=null,saverWasOn=false,applying=false,pageSuspended=false;
 const safe=(fn,fallback=null)=>{try{return fn()}catch(_){return fallback}};
 const text=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value};
 function requested(){const p=safe(()=>w.SukunSceneEngine?.snapshot?.().profile);return modes.includes(p)?p:'balanced'}
 function policy(){
  const profile=requested(),global=w.SukunPerformance?.mode||d.body?.dataset.perf,hidden=!!d.hidden||pageSuspended;
  return {profile,effective:hidden||reducedMotion||global==='pil'||profile==='saving'?'saving':profile,hidden,reduced:reducedMotion};
 }
 function stopTransitions(){entryAnimation?.cancel?.();entryAnimation=null;for(const a of nameAnimations)a.cancel?.();nameAnimations=[]}
 function enter(){
  const p=policy(),layer=$('r1215Atmosphere');if(p.effective==='saving'||!layer?.animate)return;
  entryAnimation?.cancel?.();entryAnimation=layer.animate([{opacity:0},{opacity:p.profile==='cinematic'?.65:.3,offset:.4},{opacity:1}],{duration:p.profile==='cinematic'?1100:650,easing:'ease-out'});
  entryAnimation.onfinish=()=>{entryAnimation=null};
 }
 function identity(){const s=w.SukunSessionState?.peek?.();return s&&['esma','berhet'].includes(s.activeMode)?s.activeMode+':'+s.activeIndex:null}
 function nameTransition(){
  const next=identity(),changed=lastIdentity!==null&&next!==null&&lastIdentity!==next;lastIdentity=next;
  if(!changed||policy().effective==='saving')return;
  for(const a of nameAnimations)a.cancel?.();nameAnimations=[];
  for(const id of ['r920NameInfo','r920SceneTitle']){const el=$(id);if(el?.animate)nameAnimations.push(el.animate([{opacity:.35,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'ease-out'}))}
 }
 function label(mode){return mode==='cinematic'?tr('Sinematik','Cinematic'):mode==='saving'?tr('Tasarruf','Saving'):tr('Dengeli','Balanced')}
 function help(){
  const p=policy();if(p.reduced)return tr('Azaltılmış hareket tercihin etkin. Sayaç ve ses aynı şekilde çalışır.','Reduced motion is enabled. Counting and audio continue unchanged.');
  if(p.effective==='saving'&&p.profile!=='saving')return tr('Pil profili hareketi sınırlar. Kaliteyi seçerek görsel tercihlerini birlikte değiştirebilirsin.','The battery profile limits motion. Choose a quality to update visual preferences together.');
  return p.profile==='cinematic'?tr('Yumuşak ışık ve sahne geçişleri. Ses ve sayaç etkilenmez.','Soft lighting and scene transitions. Audio and counting are unchanged.'):p.profile==='saving'?tr('Sabit sahne; dekoratif hareket kapalı. Ses ve sayaç etkilenmez.','Static scene; decorative motion is off. Audio and counting are unchanged.'):tr('Hafif ışık, kısa geçişler ve sınırlı hareket.','Soft light, short transitions and limited motion.');
 }
 function setQuality(value){
  if(!modes.includes(value)||applying||!w.SukunSceneEngine?.setProfile)return false;
  applying=true;
  try{
   if(w.SukunSceneEngine.setProfile(value)===false)return false;
   w.SukunPerformance?.apply?.(globalMode[value],false,true);
   // Use the native saver preference event, preserving its storage and clock.
   const saver=$('kandilPowerSel')||$('kandilPowerPref');
   if(saver){const power=value==='saving'?'saving':'premium';if(saver.value!==power){saver.value=power;saver.dispatchEvent(new Event('change',{bubbles:true}))}}
   const saved=safe(()=>localStorage.getItem('sukun.performance.r920')===value,false);
   if(!saved)w.toast?.(tr('Görsel tercih bu açılışta geçerli; cihazına kaydedilemedi.','Visual preference applies for this visit; it could not be saved.'));
   sync();return true;
  }finally{applying=false}
 }
 function qualityControl(host,id){
  if(!host||$(id))return;
  const row=d.createElement('div');row.className='r1215Quality';
  const labelNode=d.createElement('label'),select=d.createElement('select'),note=d.createElement('p');
  labelNode.htmlFor=id;labelNode.dataset.r1215QualityLabel='';select.id=id;select.setAttribute('aria-describedby',id+'Help');
  for(const value of modes){const option=d.createElement('option');option.value=value;select.append(option)}
  note.id=id+'Help';note.className='r1215QualityHelp';row.append(labelNode,select,note);host.append(row);
 }
 function mountQuality(){
  qualityControl($('kandilPowerWrap'),'r1215SaverQuality');qualityControl($('kandilPrefs'),'r1215SettingsQuality');
  for(const id of ['r920Performance','r1215SaverQuality','r1215SettingsQuality']){
   const select=$(id);if(!select)continue;
   const desired=requested();if(d.activeElement!==select&&select.value!==desired)select.value=desired;
   for(const option of select.options)text(option,label(option.value));
   const parent=id==='r920Performance'?select.closest('label'):select.previousElementSibling;
   if(id==='r920Performance'){
    // Retain the original select and its existing change listener.
    if(parent?.firstChild?.nodeType===3)text(parent.firstChild,tr('Ambiyans kalitesi','Ambience quality'));
    if(!$('r1215PracticeQualityHelp')){const note=d.createElement('p');note.id='r1215PracticeQualityHelp';note.className='r1215QualityHelp';parent?.after(note);select.setAttribute('aria-describedby',note.id)}
    text($('r1215PracticeQualityHelp'),help());
   }else{text(parent,tr('Ambiyans kalitesi','Ambience quality'));text($(id+'Help'),help())}
  }
  // Replaced by the three-profile control; keep native selectors for handlers.
  for(const id of ['kandilPowerLabel','kandilPowerSel','kandilPowerPrefLabel','kandilPowerPref']){const el=$(id);if(el&&!el.hasAttribute('data-r1215-replaced'))el.setAttribute('data-r1215-replaced','')}
 }
 function locationDialog(){
  let dialog=$('r1215LocationDialog');if(dialog)return dialog;
  dialog=d.createElement('dialog');dialog.id='r1215LocationDialog';dialog.setAttribute('aria-labelledby','r1215LocationTitle');
  const title=d.createElement('h2');title.id='r1215LocationTitle';
  const note=d.createElement('p');note.id='r1215LocationNote';
  const actions=d.createElement('div');actions.className='r1215LocationActions';
  for(const [id,target] of [['r1215Locate','vkLocBtn'],['r1215LocateManual','vkManBtn']]){const b=d.createElement('button');b.id=id;b.type='button';b.onclick=()=>{dialog.close();$(target)?.click()};actions.append(b)}
  const close=d.createElement('button');close.id='r1215LocationClose';close.type='button';close.onclick=()=>dialog.close();
  dialog.append(title,note,actions,close);
  dialog.addEventListener('close',()=>{$('r616SettingsBtn')?.focus?.({preventScroll:true})});
  d.body.append(dialog);return dialog;
 }
 function openLocation(){
  const dialog=locationDialog();
  text($('r1215LocationTitle'),tr('Konum seç','Choose location'));
  text($('r1215LocationNote'),tr('Vakit rehberi için cihaz konumunu kullanabilir veya koordinatlarını elle girebilirsin. Konum bu cihazda saklanır.','Use your device location or enter coordinates for the time guide. Location is stored on this device.'));
  text($('r1215Locate'),tr('Cihaz konumunu kullan','Use device location'));text($('r1215LocateManual'),tr('Elle koordinat gir','Enter coordinates'));text($('r1215LocationClose'),tr('Kapat','Close'));
  w.SukunKandil?.hide?.(true,false);if(!dialog.open)dialog.showModal();$('r1215LocationClose')?.focus();
 }
 function saverFacts(){
  const host=$('r1194Timing'),vakit=host?.querySelector('[data-key="vakit"]');if(!vakit)return;
  const missing=!safe(()=>w.SukunTimingInfo?.snapshot?.().vakit);
  let button=$('r1215ChooseLocation');
  if(missing&&!button){button=d.createElement('button');button.id='r1215ChooseLocation';button.type='button';button.onclick=event=>{event.stopPropagation();openLocation()};vakit.append(button);vakit.open=true}
  if(button){if(button.hidden!==!missing)button.hidden=!missing;text(button,tr('Konum seç','Choose location'))}
  const status=missing?'missing':'ready';if(vakit.dataset.r1215Location!==status)vakit.dataset.r1215Location=status;
  const names=d.querySelector('#r1193SaverInfo .r1193SaverNames');
  if(names){const count=String([...names.children].filter(n=>!n.hidden).length);if(names.dataset.r1215Cards!==count)names.dataset.r1215Cards=count}
 }
 function watchSaver(){
  const saver=$('kandil');
  if(saver&&saver!==observedSaver){
   saverObserver?.disconnect();observedSaver=saver;saverWasOn=saver.classList.contains('on');
   // Never write in a mutation microtask. Settings-peek/hover classes must
   // not repeatedly repaint controls and wake legacy document observers.
   saverObserver=new MutationObserver(()=>{const on=saver.classList.contains('on');if(on===saverWasOn)return;saverWasOn=on;if(on&&!d.hidden)queue()});
   saverObserver.observe(saver,{attributes:true,attributeFilter:['class']});
  }
 }
 function sync(){
  frame=0;const p=policy(),motion=p.hidden?'hidden':p.effective;
  if(R.dataset.r1215Quality!==p.profile)R.dataset.r1215Quality=p.profile;
  if(R.dataset.r1215Motion!==motion)R.dataset.r1215Motion=motion;
  if(p.effective==='saving')stopTransitions();
  if(p.hidden)return;
  const qualityKey=[p.profile,p.effective,p.reduced,w.I18N?.lang,$('r920Performance')?'practice':'', $('r1215SaverQuality')?'saver':''].join(':');
  if(qualityKey!==lastQualityPaint){lastQualityPaint=qualityKey;mountQuality()}
  watchSaver();if(observedSaver?.classList.contains('on'))saverFacts();nameTransition();
 }
 function queue(){if(policy().hidden){if(frame)cancelAnimationFrame(frame);frame=0;sync();return}if(!frame)frame=requestAnimationFrame(sync)}
 // Keep policy/snapshot reads separate from the subscribed MQL's getter:
 // reading that getter can consume a pending native match transition before
 // its change event is dispatched. The event owns the cached preference.
 function reconcileMotion(event){reducedMotion=!!event.matches;runtime.reconciliations++;if(frame)cancelAnimationFrame(frame);frame=0;sync()}
 function refreshReduced(){reducedMotion=!!w.matchMedia(reducedQuery).matches}

 // A cached or frozen page can receive pagehide before visibility changes.
 // Suspend our own queued work and effects without changing saved quality.
 function suspend(){pageSuspended=true;queue()}
 function resume(){pageSuspended=false;refreshReduced();queue()}
 function start(){
  runtime.startAttempts++;
  try {
  if(!$('r1215Atmosphere')){const layer=d.createElement('div');layer.id='r1215Atmosphere';layer.setAttribute('aria-hidden','true');layer.innerHTML='<i class="r1215LanternLight"></i><i class="r1215WaterLight"></i>';d.body.prepend(layer)}
  d.addEventListener('change',event=>{if(['r920Performance','r1215SaverQuality','r1215SettingsQuality'].includes(event.target.id))setQuality(event.target.value)});
  for(const event of ['sukun:performancechange','sukun:performance','sukun:performance-effective','sukun:selectionthemechange','sukun:secretaccesschange','sukun:languagechange','sukun:domhydrate'])w.addEventListener(event,queue,{passive:true});
  w.addEventListener('sukun:scenechange',event=>{const key=event.detail?.sceneId;if(key&&key!==lastScene){const prior=lastScene;lastScene=key;if(prior)enter()}queue()},{passive:true});
  w.addEventListener('sukun:r616viewchange',event=>{const key=event.detail?.view;if(key!==lastView){lastView=key;enter()}queue()},{passive:true});
  w.SukunSessionState?.subscribe?.(queue);
  d.addEventListener('visibilitychange',queue,{passive:true});w.addEventListener('pagehide',suspend,{passive:true});w.addEventListener('pageshow',resume,{passive:true});
  d.addEventListener('freeze',suspend,{passive:true});d.addEventListener('resume',resume,{passive:true});reduced.addEventListener?.('change',reconcileMotion);runtime.mediaListener=typeof reduced.addEventListener==='function';
  // Cover a preference change between module evaluation and DOM ready.
  refreshReduced();
  sync();runtime.started=true;
  } catch(error) {runtime.startupError=String(error?.stack||error);throw error}
 }
 w.SukunCinematic=Object.freeze({version:'r1215',setQuality,openLocation,snapshot:()=>({...policy(),identity:lastIdentity,transitioning:!!entryAnimation,runtime:{...runtime}})});
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
