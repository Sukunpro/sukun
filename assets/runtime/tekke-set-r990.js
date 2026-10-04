/* One selected guided set and one transport, shared by Home and Tekke.
 * Complete recordings retain r988's single native WAV. Mixed sets never
 * skip an unrecorded step: each uses its own recording, otherwise TTS.
 * A stopped generation cannot advance, speak, or repaint a replacement.
 * r996: explicit set starts acquire the tab lease before any voice starts. */
(()=>{'use strict';
 if(window.SukunTekkeSet)return;
 const CHECKPOINT_KEY='tekke.journey.checkpoint',KEY='tekke.imge.selected',VISIBLE_KEY='tekke.imge.visible',safe=(fn,d=null)=>{try{return fn()}catch(_){return d}};
 const tr=t=>((window.I18N?.lang==='en'||document.documentElement.lang==='en')?({'Detaylar':'Details','Detayları gizle':'Hide details','Set başlatılamadı. Diğer SÜKÛN sekmesini bitir veya kapat; sonra Tekrar başlat düğmesine dokun.':'Set could not start. Finish or close the other SÜKÛN tab, then press Retry.','Ses erişimi beklerken süre doldu. Kayıtların korundu; Tekrar başlat düğmesine dokun.':'Audio access timed out. Your recordings are retained; press Retry.','Kayıt yüklenirken süre doldu. Kayıtların korundu; Tekrar başlat düğmesine dokun.':'Recording loading timed out. Your recordings are retained; press Retry.','Ses başlamadı. Aynı adımı yeniden denemek için Devam et düğmesine dokun.':'Audio did not start. Press Resume to retry the same step.'}[t]):null)||window.I18N?.t?.(t)||t;
 let catalog=null,options={},selected='',run=null,generation=0,scan=0,recorded=null;
 let last={phase:'idle',key:'',index:0,total:0,source:'',stage:'',reason:''};
 const listeners=new Set(),cards=[];let homeExpanded=false;
 let checkpoint=safe(()=>JSON.parse(localStorage.getItem(CHECKPOINT_KEY))),saveTimer=null;
 const signature=set=>{let h=2166136261;for(const ch of JSON.stringify(set.adimlar))h=Math.imul(h^ch.charCodeAt(0),16777619);return (h>>>0).toString(16);};
 function validCheckpoint(){const c=checkpoint,set=catalog?.[c?.key];return c?.schema===1&&set&&c.signature===signature(set)&&Number.isInteger(c.index)&&c.index>=0&&c.index<set.adimlar.length&&Number.isFinite(c.elapsed)&&c.elapsed>=0&&c.elapsed<604800&&(!c.completed||Array.isArray(c.completed)&&c.completed.every(i=>Number.isInteger(i)&&i>=0&&i<set.adimlar.length))?{...c,title:set.ad,total:set.adimlar.length}:null;}
 function elapsed(s){return s?Math.max(0,s.elapsed+(s.clockAt==null?0:(performance.now()-s.clockAt)/1000)):last.elapsed||0;}
 function accrue(s){s.elapsed=elapsed(s);s.clockAt=null;}
 function persistProgress(){const s=run;if(!s||!s.owned||s.claimPending||window.SukunTabOwner?.owns?.()===false)return;
  checkpoint={schema:1,key:s.key,signature:signature(s.set),index:s.index,completed:[...s.completed],elapsed:elapsed(s),updated:Date.now()};
  safe(()=>options.persist?.(CHECKPOINT_KEY,checkpoint));
 }
 function clearCheckpoint(){if(window.SukunTabOwner?.canPersist?.(CHECKPOINT_KEY)===false)return;checkpoint=null;safe(()=>options.persist?.(CHECKPOINT_KEY,null));}
 function clock(s,phase){if(s.clockAt!=null)accrue(s);if(phase==='playing')s.clockAt=performance.now();}
 function progressTimer(on){if(saveTimer!=null){clearInterval(saveTimer);saveTimer=null;}if(on&&typeof setInterval==='function')saveTimer=setInterval(persistProgress,5000);}
 
 const stored=safe(()=>JSON.parse(localStorage.getItem(KEY)));
 let selection=stored&&typeof stored.key==='string'&&typeof stored.title==='string'?stored:null;
 let visible=safe(()=>JSON.parse(localStorage.getItem(VISIBLE_KEY)))!==false;
 const active=s=>run===s&&s.generation===generation;
 const snapshot=()=>({...last,active:!!run,visible,selected:selected||selection?.key||'',selection:selection?{...selection}:null,recorded,elapsed:elapsed(run),checkpoint:validCheckpoint(),completed:run?.completed.size??last.completed??0});
 function publish(){const state=snapshot();for(const f of listeners)safe(()=>f(state));paint();safe(()=>window.SukunAudioSessionRegistry?.schedule?.('tekke-set'));}
 function state(s,phase,patch={}){if(!active(s))return;clock(s,phase);last={...last,...patch,phase,key:s.key,title:s.set.ad,total:s.set.adimlar.length,index:s.index};persistProgress();publish();}
 function detach(s){s.waitCancel?.();s.waitCancel=null;s.task?.stop?.();s.task=null;s.gate?.();s.gate=null;s.gap?.stop?.();s.gap=null;}
 function finish(s,phase,reason=''){if(!active(s))return;accrue(s);persistProgress();detach(s);progressTimer(false);run=null;
  last={...last,phase,reason,elapsed:s.elapsed,completed:s.completed.size,source:'',stage:''};if(phase==='ended')clearCheckpoint();publish();safe(()=>window.SukunTabOwner?.retire?.('tekke-set-'+phase,true));}
 
 function stop(reason='user-stop'){const s=run;if(s){accrue(s);persistProgress();}generation++;run=null;progressTimer(false);
  if(s){if(s.claimPending)safe(()=>window.SukunTabOwner?.cancelPending?.('tekke-set:'+reason));detach(s);if(s.native)window.SukunTekkeSequence?.stop?.(reason);}if(['user-stop','card-close'].includes(reason))clearCheckpoint();
  last={...last,phase:'idle',reason,elapsed:s?.elapsed||last.elapsed||0,completed:s?.completed.size||0,source:'',stage:''};publish();if(s)safe(()=>window.SukunTabOwner?.retire?.('tekke-set:'+reason,true));return !!s;}
 
 function setVisible(value){
  const next=!!value;if(visible===next)return;
  visible=next;safe(()=>options.persist?.(VISIBLE_KEY,visible));
  // This transport owns only set narration. Leave the independent Tekke
  // breath/dhikr session, recordings and selected set intact.
  if(!visible&&run)stop('card-close');else publish();
 }
 async function refresh(){
  if(!catalog||!catalog[selected])return;
  const ticket=++scan,key=selected,steps=catalog[key].adimlar;let n=0;
  for(let i=0;i<steps.length;i++){if(ticket!==scan)return;const blob=await safe(()=>options.load(key,i),Promise.resolve(null)).catch(()=>null);if(blob)n++;}
  if(ticket!==scan||selected!==key)return;recorded=n;publish();
 }
 function select(key){
  if(!catalog?.[key])return false;selected=key;recorded=null;scan++;
  selection={key,title:catalog[key].ad,total:catalog[key].adimlar.length};
  if(!run)last={...last,phase:'idle',reason:'',key,index:0,total:selection.total};
  safe(()=>options.persist?.(KEY,selection));safe(()=>options.selectionChanged?.(key));publish();refresh();return true;
 }
 function gate(s){if(!active(s))return Promise.resolve(false);if(last.phase!=='paused')return Promise.resolve(true);return new Promise(r=>s.gate=()=>{s.gate=null;r(active(s))});}
 function quiet(s,seconds){
  return new Promise(resolve=>{
   let timer=null,left=Math.max(0,seconds)*1000,began=0,done=false;
   const end=()=>{if(done)return;done=true;clearTimeout(timer);s.gap=null;resolve(active(s));};
   const arm=()=>{if(done||!active(s))return;began=performance.now();timer=setTimeout(end,left);};
   s.gap={pause(){clearTimeout(timer);left=Math.max(0,left-(performance.now()-began));timer=null;},resume:arm,stop:end};arm();
  });
 }
 function recording(s,blob){
  return new Promise(resolve=>{
   const a=document.createElement('audio'),url=URL.createObjectURL(blob);let ended=false,cleanup=null,attempt=0,startTimer=null;
   const clearStart=()=>{clearTimeout(startTimer);startTimer=null;};
   a.preload='auto';a.playsInline=true;a.src=url;a.volume=options.volume?.()??.6;
   cleanup=safe(()=>options.routeAudio?.(a));
   const complete=ok=>{if(ended)return;ended=true;attempt++;clearStart();a.onended=null;a.onerror=null;a.onplaying=null;safe(()=>a.pause());safe(()=>a.removeAttribute('src'));safe(()=>a.load());safe(()=>cleanup?.());URL.revokeObjectURL(url);s.task=null;resolve(ok);};
   a.onended=()=>complete(true);a.onerror=()=>complete(false);
   a.onplaying=()=>{if(ended||!active(s)||last.phase==='paused'){a.pause();return;}clearStart();state(s,'playing',{reason:''});};
   const play=async()=>{clearStart();const ticket=++attempt;
    startTimer=setTimeout(()=>{if(ended||!active(s)||ticket!==attempt)return;attempt++;clearStart();a.pause();state(s,'paused',{reason:'play-start-timeout'});},8000);
    try{await a.play();if(ended||!active(s)){a.pause();return;}if(ticket!==attempt)return;clearStart();if(last.phase==='paused'){a.pause();return;}state(s,'playing',{reason:''});}
    catch(e){if(!ended&&active(s)&&ticket===attempt){clearStart();state(s,'paused',{reason:'play-blocked'});}}
   };
   s.task={kind:'recorded',audio:a,pause(){attempt++;clearStart();a.pause();},resume:play,stop:()=>complete(false)};
   play();
  });
 }
 function speech(s,text){
  return new Promise(resolve=>{
   const synth=window.speechSynthesis;let ended=false,ticket=0,startTimer=null;
   const clearStart=()=>{clearTimeout(startTimer);startTimer=null;};
   const complete=ok=>{if(ended)return;ended=true;ticket++;clearStart();s.task=null;resolve(ok);};
   const speak=()=>{
    if(ended||!active(s))return;
    if(!synth||!window.SpeechSynthesisUtterance){complete(false);return;}
    clearStart();const id=++ticket,u=safe(()=>options.utterance?.(text))||new SpeechSynthesisUtterance(text);
    u.onstart=()=>{if(id===ticket&&active(s)){clearStart();state(s,'playing',{reason:''});}};
    u.onend=()=>{if(id===ticket)complete(true);};
    u.onerror=e=>{if(id!==ticket||!active(s))return;
     clearStart();if(['not-allowed','interrupted','canceled'].includes(e.error)){state(s,'paused',{reason:'tts-restart'});}else complete(false);
    };
    startTimer=setTimeout(()=>{if(id!==ticket||ended||!active(s))return;ticket++;clearStart();safe(()=>synth.cancel());state(s,'paused',{reason:'tts-start-timeout'});},8000);
    try{synth.resume();synth.speak(u);}catch(_){complete(false);}
   };
   // Mobile TTS pause/resume is inconsistent. Cancel only our current
   // utterance; explicit Resume restarts this step, never advances it.
   s.task={kind:'tts',pause(){ticket++;clearStart();safe(()=>synth?.cancel());},resume:speak,stop(){ticket++;clearStart();safe(()=>synth?.cancel());complete(false);}};
   speak();
  });
 }
 async function start(key=selected,startOptions={}){
  if(!catalog?.[key]||options.canPlay?.()===false)return false;
  // Explicit playback restores its transport controls; showing a card by
  // itself never starts audio.
  setVisible(true);
  const offset=Math.max(0,Math.min(catalog[key].adimlar.length-1,Number.isInteger(startOptions.index)?startOptions.index:0));
  stop('replace');const s=run={key,set:catalog[key],generation,index:offset,offset,elapsed:Math.max(0,Number(startOptions.elapsed)||0),clockAt:null,completed:new Set(Array.isArray(startOptions.completed)?startOptions.completed.filter(i=>Number.isInteger(i)&&i>=0&&i<catalog[key].adimlar.length):Array.from({length:offset},(_,i)=>i)),task:null,gap:null,gate:null,native:false,owned:false};
  const settings=options.settings?.()||{};
  last={phase:'preparing',key,title:s.set.ad,index:offset,total:s.set.adimlar.length,source:'',stage:'',reason:'',elapsed:s.elapsed,completed:s.completed.size};persistProgress();publish();
  // Prime the audio context on the actual tap, before ownership/DB awaits.
  safe(()=>options.prime?.());
  const playSet=async()=>{
  if(!active(s)||window.SukunTabOwner?.owns?.()===false)return false;
  s.owned=true;persistProgress();progressTimer(true);
  const blobs=[];
  try{
   for(let i=0;i<s.set.adimlar.length;i++){
    let timer;const cancelled=new Promise(resolve=>{s.waitCancel=()=>resolve(null);});const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('recording-load-timeout')),10000);});
    try{blobs.push(await Promise.race([Promise.resolve().then(()=>options.load(key,i)).catch(()=>null),timeout,cancelled]));}finally{clearTimeout(timer);s.waitCancel=null;}
    if(!active(s))return false;
   }
   if(blobs.every(Boolean)&&window.SukunTekkeSequence){
    s.native=true;
    const sequence=await window.SukunTekkeSequence.start({key,title:tr(s.set.ad),steps:s.set.adimlar.slice(offset),load:i=>Promise.resolve(blobs[i+offset]),...settings,autoPlay:!startOptions.paused,
     volume:options.volume?.()??.6,isCurrent:()=>active(s),onStep:(i,meta)=>{if(active(s)){if(!meta?.seek)for(let j=s.index;j<i+offset;j++)s.completed.add(j);s.index=i+offset;state(s,last.phase,{source:'recorded',stage:'reading'});}},
     onState:v=>{if(active(s)&&!['idle','ended','error'].includes(v.phase))state(s,v.phase,{source:'recorded',stage:v.stage||'reading',reason:v.reason||''});}});
    if(!active(s))return false;
    if(sequence.handled){const result=await sequence.done;if(!active(s))return false;
     if(result.ok){s.completed.add(s.index);finish(s,'ended');return true;}
     if(result.reason!=='prepare-failed'){finish(s,'error','recording-error');return false;}
    }
    // A set exceeding the preparation budget still plays serially; do not
    // allocate a larger WAV or change the recordings/quiet intervals.
    s.native=false;
   }
   if(startOptions.paused)state(s,'paused');
   for(let i=offset;i<s.set.adimlar.length;i++){
    if(!await gate(s)||!active(s))return false;s.index=i;
    state(s,'playing',{source:blobs[i]?'recorded':'tts',stage:'reading',reason:''});
    let ok=false;if(blobs[i])ok=await recording(s,blobs[i]);
    if(!active(s)||!await gate(s))return false;
    if(!ok){state(s,'playing',{source:'tts',stage:'reading'});ok=await speech(s,tr(s.set.adimlar[i].t));}
    if(!active(s)||!await gate(s))return false;
    if(!ok){finish(s,'error','tts-unavailable');return false;}
    safe(()=>options.echo?.());state(s,'playing',{stage:'quiet'});
    const seconds=Number(s.set.adimlar[i].sn);
    await quiet(s,Number.isFinite(seconds)?seconds:20);if(!active(s))return false;s.completed.add(i);
   }
   finish(s,'ended');return true;
  }catch(error){if(active(s))finish(s,'error',error?.message==='recording-load-timeout'?'recording-load-timeout':'set-error');return false;}
  };
  const owner=window.SukunTabOwner;
  if(owner?.owns?.()===false){
   s.claimPending=true;state(s,'preparing',{reason:'tab-claim'});
   let timer;const expired=new Promise(resolve=>{timer=setTimeout(()=>{if(active(s)&&s.claimPending){safe(()=>owner.cancelPending?.('tekke-set-claim-timeout'));finish(s,'error','tab-claim-timeout');}resolve(false);},12000);});
   const cancelled=new Promise(resolve=>{s.waitCancel=()=>{clearTimeout(timer);resolve(false);};});
   const claim=Promise.resolve().then(()=>!active(s)?false:owner.run('tekke-set',()=>{
    clearTimeout(timer);s.waitCancel=null;s.claimPending=false;if(!active(s))return false;return playSet();
   },{isCurrent:()=>active(s),keepSelection:true})).catch(()=>false);
   const ok=await Promise.race([claim,expired,cancelled]);clearTimeout(timer);s.waitCancel=null;
   if(active(s)&&s.claimPending){s.claimPending=false;finish(s,'error','tab-access');}
   return ok;
  }
  return playSet();
 }
 function pause(){const s=run;if(!s||last.phase!=='playing')return false;
  if(s.native)return window.SukunTekkeSequence.pause();
  state(s,'paused',{reason:s.task?.kind==='tts'?'tts-restart':''});s.task?.pause?.();s.gap?.pause?.();return true;
 }
 async function resume(){const s=run;if(!s||last.phase!=='paused'||options.canPlay?.()===false||window.SukunTabOwner?.owns?.()===false)return false;
  safe(()=>options.prime?.());
  if(s.native)return window.SukunTekkeSequence.resume();
  state(s,'playing',{reason:''});s.gate?.();s.gap?.resume?.();await s.task?.resume?.();return active(s)&&last.phase==='playing';
 }
 function discardCheckpoint(){const owner=window.SukunTabOwner;if(owner?.owns?.()===false)return owner.run('tekke-checkpoint-discard',()=>{clearCheckpoint();publish();return true;},{releaseAfter:true});clearCheckpoint();publish();return true;}
 function recover(){const c=validCheckpoint();if(!c)return false;select(c.key);return window.Tekke?.hazirla?.()?.startSet?.(c.key,{index:c.index,elapsed:c.elapsed,completed:c.completed});}
 function jump(index){const s=run;if(!s||!['playing','paused'].includes(last.phase)||!Number.isInteger(index)||index<0||index>=s.set.adimlar.length||window.SukunTabOwner?.owns?.()===false||options.canPlay?.()===false)return false;
  const paused=last.phase==='paused';
  if(s.native&&index>=s.offset&&window.SukunTekkeSequence?.seekStep){s.index=index;return window.SukunTekkeSequence.seekStep(index-s.offset);}
  return start(s.key,{index,elapsed:elapsed(s),paused,completed:[...s.completed]});
 }
 function navigate(delta){return run?jump(run.index+delta):false;}
 function details(key=selected){const set=catalog?.[key];return set?{key,title:set.ad,description:set.izah,steps:set.adimlar.map(a=>({...a}))}:null;}
 function bind(sets,adapter){catalog=sets;options=adapter;select(catalog[selection?.key]?selection.key:Object.keys(catalog)[0]);paint();}
 function card(id){
  let el=document.getElementById(id);if(el)return el;
  el=document.createElement('section');el.id=id;el.className='r990SetCard';el.hidden=true;
  el.innerHTML='<button type="button" class="r991SetDismiss" data-set-action="dismiss"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button><div class="r990SetHeading"></div><h2 class="r990SetName"></h2><p class="r990SetStatus" role="status" aria-live="polite"></p><p class="r990SetStep" hidden></p><p class="r990SetHint"></p><div class="r990SetActions"><button type="button" data-set-action="details"></button><button type="button" data-set-action="toggle"></button><button type="button" data-set-action="finish" hidden></button><button type="button" data-set-action="settings"></button></div>';
  el.addEventListener('click',e=>{const b=e.target.closest('[data-set-action]');if(!b||!el.contains(b)||b.disabled)return;
   const action=b.dataset.setAction;
   if(action==='details'){homeExpanded=!homeExpanded;paint();return;}
   if(action==='dismiss'){
    setVisible(false);
    const root=document.getElementById('tk'),gate=root?.querySelector('#gate');
    const focus=el.id==='r990TekkeSetCard'?root?.querySelector(gate&&!gate.classList.contains('bye')?'#gSetVisible':'#panelBtn'):document.getElementById('tekkeTab');
    safe(()=>focus?.focus({preventScroll:true}));return;
   }
   if(action==='finish'){stop();return;}
   if(action==='toggle'&&run){last.phase==='paused'?resume():pause();return;}
   const tk=window.Tekke?.hazirla?.();
   if(action==='settings')tk?.setSettings?.();else tk?.startSet?.(selected);
  });cards.push(el);return el;
 }
 function settings(){
  const root=document.getElementById('tk');if(!root?.querySelectorAll)return;
  for(const node of root.querySelectorAll('[data-tekke-set-copy]'))node.textContent=tr(node.dataset.tekkeSetCopy);
  for(const control of root.querySelectorAll('[data-tekke-set-select]')){
   if(!catalog)continue;
   const entries=Object.entries(catalog),signature=JSON.stringify(entries.map(([key,set])=>[key,tr(set.ad)]));
   if(control.dataset.setOptions!==signature){
    control.replaceChildren(...entries.map(([key,set])=>{const option=document.createElement('option');option.value=key;option.textContent=tr(set.ad);return option;}));
    control.dataset.setOptions=signature;
   }
   control.value=selected;control.setAttribute('aria-label',tr('Tefekkür seti seçimi'));
   control.title=tr('Seti seçer; sesi başlatmaz. Akış varsa yeni seçim sonraki başlatma içindir.');
   if(!control.dataset.setBound){control.dataset.setBound='1';control.addEventListener('change',()=>select(control.value));}
  }
  for(const control of root.querySelectorAll('[data-tekke-set-visible]')){
   control.checked=visible;control.title=tr('Kapatınca yalnız set sesi durur. Tekke zikir ve nefes akışı devam eder; kayıtların silinmez.');
   if(!control.dataset.setBound){control.dataset.setBound='1';control.addEventListener('change',()=>setVisible(control.checked));}
  }
 }
 function mount(){
  const nav=document.querySelector('.wrap > nav.tabs');if(nav&&!document.getElementById('r990HomeSetCard'))nav.after(card('r990HomeSetCard'));
  const root=document.getElementById('tk');if(root?.firstElementChild&&!document.getElementById('r990TekkeSetCard'))root.querySelector('#top')?.after(card('r990TekkeSetCard'));
  paint();
 }
 function paint(){
  settings();
  const v=snapshot(),playing=v.active,shown=playing?{key:v.key,title:v.title,total:v.total}:selection;
  for(const el of cards){
   el.hidden=!shown||!visible;el.dataset.compact='r993';if(!shown)continue;
   if(el.id==='r990TekkeSetCard'){
    const root=document.getElementById('tk'),gate=root?.querySelector('#gate'),top=root?.querySelector('#top');
    const preview=gate&&!gate.classList.contains('bye');el.dataset.preview=preview?'1':'0';
    if(preview&&el.parentElement!==gate)gate.prepend(el);else if(!preview&&el.parentElement===gate)top?.after(el);
   }
   if(el.id==='r990HomeSetCard')el.classList?.toggle('r993HomeExpanded',homeExpanded);
   el.dataset.phase=v.phase;el.querySelector('.r990SetHeading').textContent=tr('TEKKE · TEFEKKÜR SETİ');
   const dismiss=el.querySelector('[data-set-action="dismiss"]');dismiss.setAttribute('aria-label',tr('Seti kapat'));dismiss.title=tr('Seti durdurur ve kartını gizler. İlk Tekke ayarlarından yeniden gösterebilirsin; kayıtların korunur.');
   el.querySelector('.r990SetName').textContent=tr(shown.title);
   let status=playing?`${v.index+1} / ${shown.total} · ${tr(v.phase==='preparing'?'Hazırlanıyor':v.phase==='paused'?'Duraklatıldı':v.stage==='quiet'?'Tefekkür arası':v.source==='recorded'?'Kendi kaydın':'Cihaz sesi (TTS)')}`:
    v.phase==='ended'&&v.key===shown.key?tr('Set tamamlandı'):v.phase==='error'&&v.key===shown.key?tr('Set durdu'):recorded==null?tr('Kayıtlar kontrol ediliyor'):`${recorded} / ${shown.total} · ${tr('adım kendi sesinle')}`;
   el.querySelector('.r990SetStatus').textContent=status;
   const step=el.querySelector('.r990SetStep');step.hidden=!playing||v.phase==='preparing';step.textContent=playing?tr(catalog?.[v.key]?.adimlar[v.index]?.t||''):'';
   let hint=tr('Adımlar sırayla ilerler. Önce kendi kaydın, eksik adımda cihaz sesi kullanılır.');
   if(v.reason==='tts-unavailable')hint=tr('Cihaz sesi kullanılamadı. Eksik adımı kaydet veya cihazındaki TTS dilini kontrol et; sonra yeniden başlat.');
   else if(v.reason==='tab-access')hint=tr('Set başlatılamadı. Diğer SÜKÛN sekmesini bitir veya kapat; sonra Tekrar başlat düğmesine dokun.');
   else if(v.reason==='tab-claim-timeout')hint=tr('Ses erişimi beklerken süre doldu. Kayıtların korundu; Tekrar başlat düğmesine dokun.');
   else if(v.reason==='recording-load-timeout')hint=tr('Kayıt yüklenirken süre doldu. Kayıtların korundu; Tekrar başlat düğmesine dokun.');
   else if(['play-start-timeout','tts-start-timeout'].includes(v.reason))hint=tr('Ses başlamadı. Aynı adımı yeniden denemek için Devam et düğmesine dokun.');
   else if(v.reason==='play-blocked')hint=tr('Tarayıcı sesi başlatmadı. Devam et düğmesine dokun.');
   else if(v.reason==='tts-restart')hint=tr('Devam et dediğinde duraklattığın metin aynı adımın başından okunur.');
   else if(v.phase==='error')hint=tr('Set oynatılamadı. Kayıtların korundu; yeniden başlatabilirsin.');
   if(playing&&selected!==v.key)hint+=' '+tr('Sonraki set:')+' '+tr(selection.title);
   el.querySelector('.r990SetHint').textContent=hint;
   const toggle=el.querySelector('[data-set-action="toggle"]');toggle.disabled=v.phase==='preparing';
   toggle.textContent=tr(playing?(v.phase==='paused'?'Devam et':v.phase==='preparing'?'Hazırlanıyor':'Duraklat'):'Başlat')+(playing||el.id==='r990HomeSetCard'?'':' · '+tr(shown.title));
   toggle.title=tr('Seçilen seti başlatır. Akış sırasında aynı düğme duraklatır ve devam ettirir.');toggle.setAttribute('aria-label',toggle.textContent);
   const end=el.querySelector('[data-set-action="finish"]');end.hidden=!playing;end.textContent=tr('Bitir');end.title=tr('Seti bitirir ve sesini durdurur. Kayıtlarını silmez.');
   const detail=el.querySelector('[data-set-action="details"]');if(detail){detail.hidden=el.id!=='r990HomeSetCard';detail.textContent=tr(homeExpanded?'Detayları gizle':'Detaylar');detail.setAttribute('aria-expanded',String(homeExpanded));detail.setAttribute('aria-controls','r993HomeSetDetails');}el.querySelector('.r990SetHint').id=el.id==='r990HomeSetCard'?'r993HomeSetDetails':'r993TekkeSetHint';
   const settings=el.querySelector('[data-set-action="settings"]');settings.textContent=tr('Set ayarları');settings.title=tr('Set seçimini ve adım kayıtlarını açar.');
  }
 }
 function updateVolume(){const v=Math.max(0,Math.min(1,Number(options.volume?.()??.6)));if(run?.native)window.SukunTekkeSequence?.setVolume?.(v);else if(run?.task?.audio)run.task.audio.volume=v;}
 const api=Object.freeze({version:'r993',details,jump,navigate,recover,discardCheckpoint,updateVolume,bind,select,setVisible,refresh,start,stop,pause,resume,snapshot,mount,render:paint,subscribe(f){listeners.add(f);return()=>listeners.delete(f);}});
 window.SukunTekkeSet=api;
 safe(()=>window.SukunAudioSessionRegistry?.register?.('tekke-set-mixed',{priority:121,title:'Tekke tefekkür seti',getState:()=>run&&!run.native?last.phase==='playing'?'playing':last.phase==='paused'?'paused':'idle':'idle',play:resume,resume,pause,stop,getVolume:()=>options.volume?.()??.6,setVolume:v=>{if(run?.task?.audio)run.task.audio.volume=Math.max(0,Math.min(1,Number(v)||0));}}));
 safe(()=>window.AudioLife?.register?.('tekke-set-mixed',()=>!!(run&&!run.native&&last.phase==='playing')));
 window.addEventListener('pagehide',persistProgress);
 window.addEventListener('visibilitychange',persistProgress);
 window.addEventListener('storage',e=>{if(e.key===CHECKPOINT_KEY&&!run){checkpoint=safe(()=>JSON.parse(e.newValue));publish();}});
 window.addEventListener('tekke:opened',()=>{mount();paint();});
 window.addEventListener('languagechange',paint);window.addEventListener('sukun:language',paint);window.addEventListener('sukun:languagechange',paint);
 if(typeof MutationObserver!=='undefined'){
  const observer=new MutationObserver(paint);observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 }
 mount();
 // Restore only a previously configured set; do not eagerly construct Tekke
 // for users who have never selected one.
 if(selection)safe(()=>window.Tekke?.hazirla?.());
})();
