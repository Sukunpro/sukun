/* One selected guided set and one transport, shared by Home and Tekke.
 * Complete recordings retain r988's single native WAV. Mixed sets never
 * skip an unrecorded step: each uses its own recording, otherwise TTS.
 * A stopped generation cannot advance, speak, or repaint a replacement. */
(()=>{'use strict';
 if(window.SukunTekkeSet)return;
 const KEY='tekke.imge.selected',safe=(fn,d=null)=>{try{return fn()}catch(_){return d}};
 const tr=t=>window.I18N?.t?.(t)||t;
 let catalog=null,options={},selected='',run=null,generation=0,scan=0,recorded=null;
 let last={phase:'idle',key:'',index:0,total:0,source:'',stage:'',reason:''};
 const listeners=new Set(),cards=[];
 const stored=safe(()=>JSON.parse(localStorage.getItem(KEY)));
 let selection=stored&&typeof stored.key==='string'&&typeof stored.title==='string'?stored:null;
 const active=s=>run===s&&s.generation===generation;
 const snapshot=()=>({...last,active:!!run,selected:selected||selection?.key||'',selection:selection?{...selection}:null,recorded});
 function publish(){const state=snapshot();for(const f of listeners)safe(()=>f(state));paint();safe(()=>window.SukunAudioSessionRegistry?.schedule?.('tekke-set'));}
 function state(s,phase,patch={}){if(!active(s))return;last={...last,...patch,phase,key:s.key,title:s.set.ad,total:s.set.adimlar.length,index:s.index};publish();}
 function detach(s){s.task?.stop?.();s.task=null;s.gate?.();s.gate=null;s.gap?.stop?.();s.gap=null;}
 function finish(s,phase,reason=''){if(!active(s))return;detach(s);run=null;last={...last,phase,reason,source:'',stage:''};publish();}
 function stop(reason='user-stop'){generation++;const s=run;run=null;if(s){detach(s);if(s.native)window.SukunTekkeSequence?.stop?.(reason);}last={...last,phase:'idle',reason,source:'',stage:''};publish();return !!s;}
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
  safe(()=>options.persist?.(KEY,selection));publish();refresh();return true;
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
   const a=document.createElement('audio'),url=URL.createObjectURL(blob);let ended=false,cleanup=null,attempt=0;
   a.preload='auto';a.playsInline=true;a.src=url;a.volume=options.volume?.()??.6;
   cleanup=safe(()=>options.routeAudio?.(a));
   const complete=ok=>{if(ended)return;ended=true;attempt++;a.onended=null;a.onerror=null;safe(()=>a.pause());safe(()=>a.removeAttribute('src'));safe(()=>a.load());safe(()=>cleanup?.());URL.revokeObjectURL(url);s.task=null;resolve(ok);};
   a.onended=()=>complete(true);a.onerror=()=>complete(false);
   const play=async()=>{const ticket=++attempt;try{await a.play();if(ended||!active(s)){a.pause();return;}if(last.phase==='paused'){a.pause();return;}if(ticket!==attempt)return;state(s,'playing',{reason:''});}catch(e){if(!ended&&active(s)&&ticket===attempt)state(s,'paused',{reason:'play-blocked'});}};
   s.task={kind:'recorded',audio:a,pause(){attempt++;a.pause();},resume:play,stop:()=>complete(false)};
   play();
  });
 }
 function speech(s,text){
  return new Promise(resolve=>{
   const synth=window.speechSynthesis;let ended=false,ticket=0;
   const complete=ok=>{if(ended)return;ended=true;ticket++;s.task=null;resolve(ok);};
   const speak=()=>{
    if(ended||!active(s))return;
    if(!synth||!window.SpeechSynthesisUtterance){complete(false);return;}
    const id=++ticket,u=safe(()=>options.utterance?.(text))||new SpeechSynthesisUtterance(text);
    u.onend=()=>{if(id===ticket)complete(true);};
    u.onerror=e=>{if(id!==ticket||!active(s))return;
     if(['not-allowed','interrupted','canceled'].includes(e.error)){state(s,'paused',{reason:'tts-restart'});}else complete(false);
    };
    try{synth.resume();synth.speak(u);}catch(_){complete(false);}
   };
   // Mobile TTS pause/resume is inconsistent. Cancel only our current
   // utterance; explicit Resume restarts this step, never advances it.
   s.task={kind:'tts',pause(){ticket++;safe(()=>synth?.cancel());},resume:speak,stop(){ticket++;safe(()=>synth?.cancel());complete(false);}};
   speak();
  });
 }
 async function start(key=selected){
  if(!catalog?.[key])return false;
  stop('replace');const s=run={key,set:catalog[key],generation,index:0,task:null,gap:null,gate:null,native:false};
  const settings=options.settings?.()||{};
  last={phase:'preparing',key,title:s.set.ad,index:0,total:s.set.adimlar.length,source:'',stage:'',reason:''};publish();
  const blobs=[];
  try{
   for(let i=0;i<s.set.adimlar.length;i++){blobs.push(await options.load(key,i).catch(()=>null));if(!active(s))return false;}
   if(blobs.every(Boolean)&&window.SukunTekkeSequence){
    s.native=true;
    const sequence=await window.SukunTekkeSequence.start({key,title:tr(s.set.ad),steps:s.set.adimlar,load:i=>Promise.resolve(blobs[i]),...settings,
     volume:options.volume?.()??.6,isCurrent:()=>active(s),onStep:i=>{if(active(s)){s.index=i;state(s,last.phase,{source:'recorded',stage:'reading'});}},
     onState:v=>{if(active(s)&&!['idle','ended','error'].includes(v.phase))state(s,v.phase,{source:'recorded',reason:v.reason||''});}});
    if(!active(s))return false;
    if(sequence.handled){const result=await sequence.done;if(!active(s))return false;
     if(result.ok){finish(s,'ended');return true;}
     if(result.reason!=='prepare-failed'){finish(s,'error','recording-error');return false;}
    }
    // A set exceeding the preparation budget still plays serially; do not
    // allocate a larger WAV or change the recordings/quiet intervals.
    s.native=false;
   }
   for(let i=0;i<s.set.adimlar.length;i++){
    if(!await gate(s)||!active(s))return false;s.index=i;
    state(s,'playing',{source:blobs[i]?'recorded':'tts',stage:'reading',reason:''});
    let ok=false;if(blobs[i])ok=await recording(s,blobs[i]);
    if(!active(s)||!await gate(s))return false;
    if(!ok){state(s,'playing',{source:'tts',stage:'reading'});ok=await speech(s,tr(s.set.adimlar[i].t));}
    if(!active(s)||!await gate(s))return false;
    if(!ok){finish(s,'error','tts-unavailable');return false;}
    safe(()=>options.echo?.());state(s,'playing',{stage:'quiet'});
    const seconds=Number(s.set.adimlar[i].sn);
    await quiet(s,Number.isFinite(seconds)?seconds:20);if(!active(s))return false;
   }
   finish(s,'ended');return true;
  }catch(_){if(active(s))finish(s,'error','set-error');return false;}
 }
 function pause(){const s=run;if(!s||last.phase!=='playing')return false;
  if(s.native)return window.SukunTekkeSequence.pause();
  state(s,'paused',{reason:s.task?.kind==='tts'?'tts-restart':''});s.task?.pause?.();s.gap?.pause?.();return true;
 }
 async function resume(){const s=run;if(!s||last.phase!=='paused')return false;
  if(s.native)return window.SukunTekkeSequence.resume();
  state(s,'playing',{reason:''});s.gate?.();s.gap?.resume?.();await s.task?.resume?.();return active(s)&&last.phase==='playing';
 }
 function bind(sets,adapter){catalog=sets;options=adapter;select(catalog[selection?.key]?selection.key:Object.keys(catalog)[0]);paint();}
 function card(id){
  let el=document.getElementById(id);if(el)return el;
  el=document.createElement('section');el.id=id;el.className='r990SetCard';el.hidden=true;
  el.innerHTML='<div class="r990SetHeading"></div><h2 class="r990SetName"></h2><p class="r990SetStatus" role="status" aria-live="polite"></p><p class="r990SetStep" hidden></p><p class="r990SetHint"></p><div class="r990SetActions"><button type="button" data-set-action="toggle"></button><button type="button" data-set-action="finish" hidden></button><button type="button" data-set-action="settings"></button></div>';
  el.addEventListener('click',e=>{const b=e.target.closest('[data-set-action]');if(!b||!el.contains(b)||b.disabled)return;
   const action=b.dataset.setAction;
   if(action==='finish'){stop();return;}
   if(action==='toggle'&&run){last.phase==='paused'?resume():pause();return;}
   const tk=window.Tekke?.hazirla?.();
   if(action==='settings')tk?.setSettings?.();else tk?.startSet?.(selected);
  });cards.push(el);return el;
 }
 function mount(){
  const nav=document.querySelector('.wrap > nav.tabs');if(nav&&!document.getElementById('r990HomeSetCard'))nav.after(card('r990HomeSetCard'));
  const root=document.getElementById('tk');if(root?.firstElementChild&&!document.getElementById('r990TekkeSetCard'))root.querySelector('#top')?.after(card('r990TekkeSetCard'));
  paint();
 }
 function paint(){
  const v=snapshot(),playing=v.active,shown=playing?{key:v.key,title:v.title,total:v.total}:selection;
  for(const el of cards){
   el.hidden=!shown;if(!shown)continue;
   if(el.id==='r990TekkeSetCard'){
    const root=document.getElementById('tk'),gate=root?.querySelector('#gate'),top=root?.querySelector('#top');
    const preview=gate&&!gate.classList.contains('bye');el.dataset.preview=preview?'1':'0';
    if(preview&&el.parentElement!==gate)gate.prepend(el);else if(!preview&&el.parentElement===gate)top?.after(el);
   }
   el.dataset.phase=v.phase;el.querySelector('.r990SetHeading').textContent=tr('TEKKE · TEFEKKÜR SETİ');
   el.querySelector('.r990SetName').textContent=tr(shown.title);
   let status=playing?`${v.index+1} / ${shown.total} · ${tr(v.phase==='preparing'?'Hazırlanıyor':v.phase==='paused'?'Duraklatıldı':v.stage==='quiet'?'Tefekkür arası':v.source==='recorded'?'Kendi kaydın':'Cihaz sesi (TTS)')}`:
    v.phase==='ended'&&v.key===shown.key?tr('Set tamamlandı'):v.phase==='error'&&v.key===shown.key?tr('Set durdu'):recorded==null?tr('Kayıtlar kontrol ediliyor'):`${recorded} / ${shown.total} · ${tr('adım kendi sesinle')}`;
   el.querySelector('.r990SetStatus').textContent=status;
   const step=el.querySelector('.r990SetStep');step.hidden=!playing||v.phase==='preparing';step.textContent=playing?tr(catalog?.[v.key]?.adimlar[v.index]?.t||''):'';
   let hint=tr('Adımlar sırayla ilerler. Önce kendi kaydın, eksik adımda cihaz sesi kullanılır.');
   if(v.reason==='tts-unavailable')hint=tr('Cihaz sesi kullanılamadı. Eksik adımı kaydet veya cihazındaki TTS dilini kontrol et; sonra yeniden başlat.');
   else if(v.reason==='play-blocked')hint=tr('Tarayıcı sesi başlatmadı. Devam et düğmesine dokun.');
   else if(v.reason==='tts-restart')hint=tr('Devam et dediğinde duraklattığın metin aynı adımın başından okunur.');
   else if(v.phase==='error')hint=tr('Set oynatılamadı. Kayıtların korundu; yeniden başlatabilirsin.');
   if(playing&&selected!==v.key)hint+=' '+tr('Sonraki set:')+' '+tr(selection.title);
   el.querySelector('.r990SetHint').textContent=hint;
   const toggle=el.querySelector('[data-set-action="toggle"]');toggle.disabled=v.phase==='preparing';
   toggle.textContent=tr(playing?(v.phase==='paused'?'Devam et':v.phase==='preparing'?'Hazırlanıyor':'Duraklat'):'Başlat')+(playing?'':' · '+tr(shown.title));
   toggle.title=tr('Seçilen seti başlatır. Akış sırasında aynı düğme duraklatır ve devam ettirir.');toggle.setAttribute('aria-label',toggle.textContent);
   const end=el.querySelector('[data-set-action="finish"]');end.hidden=!playing;end.textContent=tr('Bitir');end.title=tr('Seti bitirir ve sesini durdurur. Kayıtlarını silmez.');
   const settings=el.querySelector('[data-set-action="settings"]');settings.textContent=tr('Set ayarları');settings.title=tr('Set seçimini ve adım kayıtlarını açar.');
  }
 }
 const api=Object.freeze({version:'r990',bind,select,refresh,start,stop,pause,resume,snapshot,mount,render:paint,subscribe(f){listeners.add(f);return()=>listeners.delete(f);}});
 window.SukunTekkeSet=api;
 safe(()=>window.SukunAudioSessionRegistry?.register?.('tekke-set-mixed',{priority:121,title:'Tekke tefekkür seti',getState:()=>run&&!run.native?last.phase==='playing'?'playing':last.phase==='paused'?'paused':'idle':'idle',play:resume,resume,pause,stop,getVolume:()=>options.volume?.()??.6,setVolume:v=>{if(run?.task?.audio)run.task.audio.volume=Math.max(0,Math.min(1,Number(v)||0));}}));
 safe(()=>window.AudioLife?.register?.('tekke-set-mixed',()=>!!(run&&!run.native&&last.phase==='playing')));
 window.addEventListener('tekke:opened',()=>{mount();paint();});
 window.addEventListener('languagechange',paint);window.addEventListener('sukun:language',paint);
 if(typeof MutationObserver!=='undefined'){
  const observer=new MutationObserver(paint);observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 }
 mount();
 // Restore only a previously configured set; do not eagerly construct Tekke
 // for users who have never selected one.
 if(selection)safe(()=>window.Tekke?.hazirla?.());
})();
