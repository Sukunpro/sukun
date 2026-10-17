/* One editor and one playback engine. Presentation never credits a reading. */
(()=>{'use strict';
if(window.SukunSmartSessionUIR1082)return;
const $=id=>document.getElementById(id),safe=(fn,alt=null)=>{try{return fn()??alt}catch(_){return alt}},en=()=>window.I18N?.lang==='en',t=(tr,eng)=>en()?eng:tr;
const P=()=>window.R170?.Player,E=()=>window.SukunSessionEditor,engine=()=>window.SukunSmartSessionR1082;
const text=(node,value)=>{if(node&&node.textContent!==String(value))node.textContent=String(value)},attr=(node,name,value)=>{if(node&&node.getAttribute(name)!==String(value))node.setAttribute(name,String(value))};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=value=>safe(()=>structuredClone(value),null)||JSON.parse(JSON.stringify(value));
const mode=step=>['duration','manual'].includes(step?.repeatMode)?step.repeatMode:'fixed';
const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clock=ms=>{const n=Math.max(0,Math.ceil(number(ms)/1000));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
const focus=()=>document.body.classList.contains('sukun-tefekkur-mode');
const state=()=>engine()?.snapshot?.()||{playing:!!P()?.playing,paused:!!P()?.paused,completed:number(P()?._r982CompletedReps),stepIndex:P()?.i||0,locked:!!P()?.playing};
function stepInfo(step){
 const described=safe(()=>engine()?.describeStep?.(step));if(described)return described;
 if(step?.type==='zikir'){const item=safe(()=>ZIKIR?.[step.cat]?.items?.[step.idx]),title=String(item?.tr||item?.t||item?.nm||item?.oku||item?.translit||item?.ar||item?.a||'').trim();return {valid:!!title,title,reason:title?'':'missing-source'}}
 return {valid:!!step&&['silence','frequency'].includes(step.type),title:'',reason:'unsupported-step'};
}
function itemName(step){if(!step)return'—';if(!window.SukunSecretPolicy?.unlocked?.()&&safe(()=>window.SukunSecretPolicy?.secretStep?.(step),false))return t('Kilitli bölüm','Locked section');if(step.type==='zikir')return stepInfo(step).title||t('Okuma bulunamadı','Reading not found');return step.type==='silence'?t('Sükût','Silence'):step.type==='frequency'?t('Frekans','Frequency'):t('Desteklenmeyen adım','Unsupported step')}
function modeText(step){if(step?.type!=='zikir')return clock(step?.ms);return mode(step)==='duration'?t('Süre','Duration')+' · '+clock(step.repeatForMs||60000):mode(step)==='manual'?t('Ben geçene kadar','Until I move on'):t('Adet','Count')+' · '+Math.max(1,number(step.reps,1))}
let queued=0,started=false,lastFocus=focus(),hubObserver=null,queueNode=null;
function schedule(){if(queued||document.hidden)return;queued=requestAnimationFrame(()=>{queued=0;refresh()})}
function history(){const e=E();if(!e?.history)return;e.history.push({q:clone(P().queue),i:P().i});if(e.history.length>20)e.history.shift()}
function editable(index){return engine()?.canEdit?.(index)??!P()?.playing}
function change(index,key,value){const player=P(),step=player?.queue?.[index];if(!step||!editable(index))return false;history();step[key]=value;player.save?.();E()?.render?.();schedule();return true}
function open({reveal=true}={}){
 const hub=$('r170SessionHub');if(!hub)return false;
 if(focus())window.SUKUN_TEFEKKUR?.exit?.();
 const tab=document.querySelector('.tab[data-t="zkr"]');if(tab&&!tab.classList.contains('act'))tab.click();
 // Existing practice presentation owns visibility. Open its tools before the
 // nested flow section; opening only the inner details is immediately folded.
 window.SukunPracticeUI?.openSection?.('zmgAraclar',{reveal:false});
 document.body.classList.add('r920-details-open');
 for(let node=hub;node&&node!==document.body;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
 if(reveal){const target=hub.querySelector(':scope>summary');if(window.SukunNavigationR1066?.reveal)window.SukunNavigationR1066.reveal(hub,{reason:'session-editor',focus:target,isCurrent:()=>hub.open&&!focus()});else{hub.scrollIntoView({block:'start',behavior:'auto'});target?.focus({preventScroll:true})}}
 schedule();return true;
}
function loadProtectionPreset(queue,name){
 const player=P();if(!player||!Array.isArray(queue)||!queue.length)return false;
 // Never replace a live queue as a side effect of opening a template. The
 // explicit pause/edit action is the only path out of a playing editor.
 if(player.playing){open();$('r1082PauseEdit')?.focus({preventScroll:true});return false}
 window.SukunReadingAudioR1064?.stop?.('protective-preset-prepare');
 player.set(clone(queue),name||t('Koruma tertibi','Protective sequence'));
 if($('r170SessionName'))$('r170SessionName').value=player.name;
 open();E()?.render?.();schedule();return true;
}
function ensure(){
 const hub=$('r170SessionHub'),body=hub?.querySelector(':scope>.r170Body');if(!body)return false;
 hub.classList.add('r1082-session');hub.setAttribute('data-r1082-ui','');
 if(!$('r1082SessionSummary')){
  const card=document.createElement('section');card.id='r1082SessionSummary';card.setAttribute('data-noi18n','');card.setAttribute('aria-label',t('Seans özeti','Session overview'));
  card.innerHTML='<nav id="r1082StageNav"><button type="button" data-r1082-stage="prepare"></button><button type="button" data-r1082-stage="listen"></button><button type="button" data-r1082-stage="focus"></button></nav><div class="r1082-summary-head"><span class="r1082-spark" aria-hidden="true">✦</span><b id="r1082SessionHeading"></b><span id="r1082SessionPhase"></span></div><p id="r1082SessionCounts"></p><p id="r1082SessionNext"></p><p id="r1082ActualSource"></p><button id="r1082PauseEdit" type="button" class="r170Btn"></button><section id="r1082Failure" hidden role="status"><b id="r1082FailureText"></b><div><button id="r1082Retry" type="button" class="r170Btn"></button><button id="r1082Skip" type="button" class="r170Btn"></button></div></section><p id="r1082Outcome" hidden role="status"></p><details id="r1082Order"><summary id="r1082OrderTitle"></summary><ol id="r1082OrderList"></ol></details>';
  const validation=document.createElement('p');validation.id='r1084Validation';validation.hidden=true;validation.setAttribute('role','status');card.querySelector('#r1082SessionNext').after(validation);body.prepend(card);
  $('r1082PauseEdit').onclick=()=>{engine()?.pauseToEdit?.();schedule()};
  $('r1082Retry').onclick=()=>{engine()?.retryFailed?.();schedule()};$('r1082Skip').onclick=()=>{engine()?.skipFailed?.();schedule()};
  $('r1082StageNav').onclick=event=>{const b=event.target.closest('[data-r1082-stage]');if(!b)return;const stage=b.dataset.r1082Stage;if(stage==='prepare')open();else if(stage==='focus')window.SUKUN_TEFEKKUR?.enter?.();else if(P()?.playing||P()?.paused){window.SukunDockCollapse?.set?.(false);window.SukunDockVisibility?.setHidden?.(false);window.SukunDockSize?.set?.('midi',false)}else $('r170StartSession')?.focus({preventScroll:false})};
 }
 const practice=$('r920Practice');if(practice&&!$('r1082SessionEntry')){
  const entry=document.createElement('button');entry.id='r1082SessionEntry';entry.type='button';entry.className='r170Btn';entry.setAttribute('data-noi18n','');entry.onclick=()=>open();
  const anchor=$('r986Sections');if(anchor?.parentElement===practice)anchor.after(entry);else practice.append(entry);
 }
 const identity=practice?.querySelector('.r920Identity');if(identity&&!$('r1082FocusStrip')){
  const strip=document.createElement('details');strip.id='r1082FocusStrip';strip.setAttribute('data-noi18n','');strip.innerHTML='<summary id="r1082FocusSummary"></summary><p id="r1082FocusDetail"></p><button id="r1082FocusEdit" type="button" class="r170Btn"></button>';
  identity.after(strip);$('r1082FocusEdit').onclick=()=>open();
 }
 const q=$('r170Queue');if(q!==queueNode){hubObserver?.disconnect();queueNode=q;if(q){hubObserver=new MutationObserver(schedule);hubObserver.observe(q,{childList:true,subtree:true})}}
 return true;
}
function decorateCard(card,index,step,locked){
 if(!step)return;const main=card.querySelector('.r252StepMain');if(!main)return;
 // Old source probes are useful to playback but their own-recording-only
 // badge cannot describe bundled/generic sources. Show actual source once in
 // the current session summary instead; each row explains its fallback.
 if(step.type==='zikir'){
  const title=main.querySelector(':scope>b');text(title,itemName(step)+(mode(step)==='fixed'?' ×'+Math.max(1,number(step.reps,1)):mode(step)==='duration'?' · '+clock(step.repeatForMs||60000):' · ∞'));
  let modes=card.querySelector('.r1082-modes');if(!modes){modes=document.createElement('div');modes.className='r1082-modes';modes.setAttribute('data-noi18n','');modes.innerHTML=['fixed','duration','manual'].map(value=>'<button type="button" data-r1082-mode="'+value+'" data-i="'+index+'"></button>').join('');main.after(modes);
   modes.onclick=event=>{const b=event.target.closest('[data-r1082-mode]');if(!b||!editable(index))return;engine()?.setMode?.(index,b.dataset.r1082Mode);schedule()};
  }
  attr(modes,'role','group');attr(modes,'aria-label',t('Tekrar türü','Repeat type'));
  for(const b of modes.querySelectorAll('button')){text(b,t({fixed:'Adet',duration:'Süre',manual:'Ben geçene kadar'}[b.dataset.r1082Mode],{fixed:'Count',duration:'Duration',manual:'Until I move on'}[b.dataset.r1082Mode]));attr(b,'aria-pressed',mode(step)===b.dataset.r1082Mode);b.disabled=locked}
  const tools=card.querySelector('.r252Tools');if(tools){
   let fields=tools.querySelector('.r1082-fields');if(!fields){fields=document.createElement('div');fields.className='r1082-fields';fields.setAttribute('data-noi18n','');fields.innerHTML='<label data-r1082-fixed-field><span data-r1082-count-label></span><input type="number" inputmode="numeric" min="1" max="9999" step="1" data-r1082-reps></label><label data-r1082-duration-field><span data-r1082-duration-label></span><input type="number" inputmode="numeric" min="5" max="21600" step="1" data-r1082-duration></label><label><span data-r1082-gap-label></span><input type="number" inputmode="decimal" min="0" max="30" step="0.1" data-r1082-gap></label>';tools.prepend(fields);
    const invalid=input=>{attr(input,'aria-invalid','true');input.reportValidity?.();schedule()};
    fields.querySelector('[data-r1082-reps]').onchange=event=>{const n=Number(event.target.value);if(Number.isInteger(n)&&n>=1&&n<=9999){attr(event.target,'aria-invalid','false');change(index,'reps',n)}else invalid(event.target)};
    fields.querySelector('[data-r1082-duration]').onchange=event=>{const n=Number(event.target.value);if(Number.isInteger(n)&&n>=5&&n<=21600){attr(event.target,'aria-invalid','false');change(index,'repeatForMs',n*1000)}else invalid(event.target)};
    fields.querySelector('[data-r1082-gap]').onchange=event=>{const n=Number(event.target.value);if(event.target.value.trim()!==''&&Number.isFinite(n)&&n>=0&&n<=30){attr(event.target,'aria-invalid','false');change(index,'gap',Math.round(n*1000))}else invalid(event.target)};
   }
   fields.querySelector('[data-r1082-fixed-field]').hidden=mode(step)!=='fixed';fields.querySelector('[data-r1082-duration-field]').hidden=mode(step)!=='duration';text(fields.querySelector('[data-r1082-count-label]'),t('Okuma sayısı','Reading count'));text(fields.querySelector('[data-r1082-duration-label]'),t('Süre (saniye)','Duration (seconds)'));text(fields.querySelector('[data-r1082-gap-label]'),t('Okumalar arası (sn)','Gap between readings (s)'));
   const reps=fields.querySelector('[data-r1082-reps]'),gap=fields.querySelector('[data-r1082-gap]'),duration=fields.querySelector('[data-r1082-duration]');if(document.activeElement!==reps&&reps.getAttribute('aria-invalid')!=='true')reps.value=String(Math.max(1,number(step.reps,1)));if(document.activeElement!==gap&&gap.getAttribute('aria-invalid')!=='true')gap.value=String(Math.max(0,number(step.gap,600))/1000);if(document.activeElement!==duration&&duration.getAttribute('aria-invalid')!=='true')duration.value=String(Math.max(5,number(step.repeatForMs,60000)/1000));reps.disabled=gap.disabled=duration.disabled=locked;
   sourceControl(tools,index,step,locked);
  }
 }
 // The original edit buttons retain handlers for compatibility. Protect every
 // structural operation while allowing the live step-volume slider to work.
 for(const control of card.querySelectorAll('[data-a],[data-drag],[data-r261]:not([data-r261="vol"])'))control.disabled=locked;
 const expand=card.querySelector('.r422Expand');if(expand){text(expand,t(card.classList.contains('r422-expanded')?'Ayrıntıları kapat':'Ayrıntılar',card.classList.contains('r422-expanded')?'Close details':'Details'));attr(expand,'aria-label',t(itemName(step)+' ayrıntıları',itemName(step)+' details'))}
}
function sourceControl(tools,index,step,locked){
 let ctl=tools.querySelector('.r1082-source');if(!ctl){ctl=document.createElement('label');ctl.className='r1082-source';ctl.setAttribute('data-noi18n','');ctl.innerHTML='<span></span><select data-r1082-source><option value="auto"></option><option value="tts-f"></option><option value="tts-default"></option></select><small></small>';tools.append(ctl);
  ctl.querySelector('select').onchange=event=>change(index,'_r472SourceMode',event.target.value);
 }
 text(ctl.querySelector('span'),t('Kayıt yoksa cihaz sesi','Device voice when no recording is available'));
 const select=ctl.querySelector('select'),labels={auto:t('Erkek ses / pes ton','Male voice / low tone'),'tts-f':t('Kadın ses / ince ton','Female voice / high tone'),'tts-default':t('Cihazın varsayılan sesi','Device default voice')};
 for(const option of select.options)text(option,labels[option.value]);const value=['tts-f','tts-default'].includes(step._r472SourceMode)?step._r472SourceMode:'auto';if(select.value!==value)select.value=value;select.disabled=locked;
 text(ctl.querySelector('small'),t('Mevcut kayıt önceliği korunur. Seçim, kayıt bulunmadığında kullanılacak cihaz sesidir.','The existing recording priority is kept. This choice is the device voice used when no matching recording is available.'));
}
function summary(){
 const player=P(),s=state(),step=player?.queue?.[player.i],active=!!(player?.playing||player?.paused),count=player?.queue?.length||0;
 if(document.body.classList.contains('r1082-smart-session-active')!==active)document.body.classList.toggle('r1082-smart-session-active',active);
 attr($('r1082StageNav'),'aria-label',t('Seans görünümleri','Session views'));for(const button of $('r1082StageNav')?.querySelectorAll('button')||[]){const stage=button.dataset.r1082Stage;text(button,t({prepare:'Hazırla',listen:'Dinle',focus:'Tefekkür'}[stage],{prepare:'Prepare',listen:'Listen',focus:'Focus'}[stage]));attr(button,'aria-current',(focus()?'focus':active?'listen':'prepare')===stage?'step':'false');button.disabled=stage==='focus'&&(!active||step?.type!=='zikir')||stage==='listen'&&!count;}
 text($('r1082SessionEntry'),t('✦ Seans hazırla · hazır tertipler ve kendi sıralaman','✦ Prepare a session · templates and your sequence'));
 text($('r1082SessionHeading'),player?.name||t('Seansını hazırla','Prepare your session'));
 text($('r1082SessionPhase'),s.failed?t('Ses bekleniyor','Audio needs attention'):s.editing?t('Düzenleniyor · duraklatıldı','Editing · paused'):player?.playing?t('Dinleniyor','Playing'):player?.paused?t('Duraklatıldı','Paused'):t('Hazırla','Prepare'));
 const invalid=(player?.queue||[]).map((x,i)=>({step:x,index:i,info:stepInfo(x)})).filter(x=>!x.info.valid);
 const readings=(player?.queue||[]).filter(x=>x.type==='zikir'&&stepInfo(x).valid),fixed=readings.every(x=>mode(x)==='fixed'),planned=readings.reduce((a,x)=>a+Math.max(1,number(x.reps,1)),0);
 const planText=count?t(count+' adım'+(readings.length?(fixed?' · '+planned+' planlanan okuma':' · adet ve koşullu adımlar'):''),count+' steps'+(readings.length?(fixed?' · '+planned+' planned readings':' · count and conditional steps'):'')):t('Bir hazır tertip seç veya mevcut zikri ekle.','Choose a template or add the selected dhikr.');
 const position=t('Adım '+(player.i+1)+'/'+count,'Step '+(player.i+1)+'/'+count),progress=step?.type==='zikir'?t(number(s.completed)+' tamamlanan okuyuş',number(s.completed)+' completed readings'):itemName(step);
 const timing=step?.type==='zikir'&&mode(step)==='duration'&&Number.isFinite(s.remainingMs)?t('Kalan ','Remaining ')+clock(s.remainingMs):step?.type==='zikir'?modeText(step):Number.isFinite(s.remainingMs)?t('Kalan ','Remaining ')+clock(s.remainingMs):clock(step?.ms);
 text($('r1082SessionCounts'),active?position+' · '+progress+' · '+timing:planText);
 text($('r1082SessionNext'),active?(player.queue[player.i+1]?t('Sıradaki: ','Next: ')+itemName(player.queue[player.i+1]):t('Bu adımdan sonra seans sona erer.','The session ends after this step.')):t('Sıra yukarıdan aşağıya. Hazır tertipler bu ortak düzenleyicide açılır.','The sequence runs from top to bottom. Templates open in this shared editor.'));
 const validation=$('r1084Validation');if(validation){validation.hidden=!invalid.length;if(invalid.length)text(validation,t('Başlatmadan önce düzelt: ','Fix before starting: ')+invalid.map(x=>t('Adım ','Step ')+(x.index+1)+' · '+itemName(x.step)).join('; ')+'. '+t('Eksik okumayı kaldırıp listeden yeniden ekleyebilirsin.','Remove the missing reading and add it again from the list.'))}
 const source=$('r1082ActualSource');source.hidden=!active||step?.type!=='zikir';if(!source.hidden){const reading=window.SukunSessionState?.peek?.()||safe(()=>window.SukunSessionState?.snapshot?.(),{});text(source,t('Şu anki kaynak: ','Current source: ')+(window.SukunAudioSourceText?.label?.(reading,en()?'en':'tr')||t('Başlangıçta doğrulanır','Verified when playback starts')))}
 const pause=$('r1082PauseEdit');pause.hidden=!player?.playing;text(pause,t('Duraklat ve düzenle','Pause and edit'));
 const failed=$('r1082Failure');failed.hidden=!s.failed;if(s.failed)text($('r1082FailureText'),s.failed.reason==='intention-failed'?t('Niyet tamamlanamadı. Sayaç ilerletilmedi. Niyet kaydını veya cihaz sesini kontrol edip yeniden dene.','The intention did not complete. The counter did not advance. Check your intention recording or device voice, then retry.'):t('Okuma tamamlanamadı: ','Reading could not complete: ')+(s.failed.title||itemName(step))+'. '+t('Tamamlanan okuyuşlar korunuyor.','Completed readings are kept.'));
 text($('r1082Retry'),t('Yeniden dene','Retry'));text($('r1082Skip'),t('Bu adımı atla','Skip this step'));
 const result=s.result;const outcome=$('r1082Outcome');outcome.hidden=!result||!['completed','ended'].includes(result.status);if(!outcome.hidden)text(outcome,t('Seans sonucu: ','Session result: ')+number(result.completed)+' '+t('tamamlanan adım','completed steps')+' · '+number(result.skipped)+' '+t('atlanan','skipped')+' · '+number(result.failed)+' '+t('başarısız','failed'));
 $('r170SessionHub')?.classList.toggle('r1082-has-failure',!!s.failed);
 text($('r1082OrderTitle'),t('Sırayı önizle','Preview the sequence'));const list=$('r1082OrderList'),html=(player?.queue||[]).map(x=>'<li>'+esc(itemName(x))+' <span>'+esc(x.type==='zikir'?modeText(x):clock(x.ms))+'</span></li>').join('');if(list.innerHTML!==html)list.innerHTML=html;
 const start=$('r170StartSession');if(start){start.disabled=!count||!!invalid.length||!!s.failed||!!$('r170Queue')?.querySelector('[aria-invalid="true"]');if(invalid.length)attr(start,'aria-describedby','r1084Validation');else start.removeAttribute('aria-describedby')}
 text($('r1082FocusSummary'),(player?.name||t('Seans','Session'))+' · '+t('Adım ','Step ')+(player?.i+1)+'/'+count);
 text($('r1082FocusDetail'),step?itemName(step)+' · '+modeText(step)+(player.queue[player.i+1]?' · '+t('Sıradaki: ','Next: ')+itemName(player.queue[player.i+1]):''):'');
 text($('r1082FocusEdit'),t('Seans ayrıntılarını aç','Open session details'));if($('r1082FocusStrip'))$('r1082FocusStrip').hidden=!active;
 const locked=!!player?.playing;
 for(const control of document.querySelectorAll('#r170PresetPills button,#r170SavedSessions [data-sload],#r261FavoritePills [data-fload],#r170CurrentAdd,#r170SilenceAdd,#r170FreqAdd,#r170ClearQ,#r252Undo'))control.disabled=locked||control.id==='r252Undo'&&!E()?.history?.length;
 for(const card of document.querySelectorAll('#r170Queue .r252Step'))decorateCard(card,+card.dataset.i,player.queue[+card.dataset.i],locked);
}
function refresh(){if(!ensure())return;summary();const next=focus();if(next!==lastFocus){lastFocus=next;if(next&&$('r1082FocusStrip'))$('r1082FocusStrip').open=false}}
function boot(){if(started)return;started=true;refresh();[120,400,900].forEach(ms=>setTimeout(refresh,ms))}
for(const name of['sukun:smartphase','sukun:playbackchange','sukun:currentzikirchange','sukun:languagechange','sukun:domhydrate','sukun:zikirselectionchange','sukun:sessiondraftchange'])window.addEventListener(name,schedule,{passive:true});
document.addEventListener('click',event=>{if(event.target.closest?.('#r170SessionHub,#r1082SessionEntry'))schedule()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()},{passive:true});
window.SukunLifecycleHub?.onBodyClass?.(schedule);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SukunSmartSessionUIR1082=Object.freeze({version:'r1082',open,refresh:schedule,loadProtectionPreset,snapshot:()=>({sharedEditor:!!$('r170SessionHub'),open:!!$('r170SessionHub')?.open,focus:focus(),locked:!!P()?.playing})});
})();
