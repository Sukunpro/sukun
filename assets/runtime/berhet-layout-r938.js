/* r938: layout only. Move native controls, retain their owners and restore Esma layout. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const FOCUS_KEY='sukun.zikir.quickControls.focus.v1';
let host,hero,panel,body,toggle,primary,quick,transport,finishRow,focusToggle,anchors=[],hiddenStates=new Map(),lastTef=null,open=false,transportId='';
// New installs begin with the wheel alone; an explicit saved preference wins.
let settingsAutoHidden=false,settingsHideTimer=null,settingsPlaybackStretch='',settingsRevealHeld=false;
const SETTINGS_HIDE_DELAY=10000,SETTINGS_PULSE_INTERVAL=600000,SETTINGS_PULSE_DURATION=5000;
let focusControlsVisible=false;try{focusControlsVisible=localStorage.getItem(FOCUS_KEY)==='1'}catch(_){}
const english=()=>window.I18N?.lang==='en';
function write(node,tr,en){const value=english()?en:tr;if(node&&node.textContent!==value)node.textContent=value;}
function attribute(node,key,value){if(node&&node.getAttribute(key)!==String(value))node.setAttribute(key,String(value));}
function hidden(node,value){if(node&&node.hidden!==value)node.hidden=value;}
function move(node,parent){if(!node)return;const anchor=document.createComment('r938-original');node.before(anchor);anchors.push([node,anchor]);parent.append(node)}
function labels(){
 write($('r1056SettingsCaption'),'Ayarlar ve görünüm','Settings and appearance');
 write($('r1242FocusControlsLabel'),focusControlsVisible?'Kolay kontrolleri gizle':'Kolay kontrolleri göster',focusControlsVisible?'Hide easy controls':'Show easy controls');
 attribute(focusToggle,'aria-label',settingsAutoHidden?(english()?'Show settings, reading information and controls':'Ayarları, okuma bilgilerini ve kontrolleri göster'):(english()?(focusControlsVisible?'Hide easy controls':'Show easy controls'):(focusControlsVisible?'Kolay kontrolleri gizle':'Kolay kontrolleri göster')));
 attribute(focusToggle,'data-r1242-eye',!focusControlsVisible||settingsAutoHidden);
 attribute(focusToggle,'aria-expanded',focusControlsVisible);
 attribute(panel,'aria-label',english()?'Dhikr controls':'Zikir kontrolleri');
 attribute(body,'aria-label',english()?'Dhikr settings and appearance':'Zikir ayarları ve görünüm');
 attribute(finishRow,'aria-label',english()?'Restart or finish':'Baştan başlat veya bitir');
 actionHelp();
}
// Explanations use the existing hover, keyboard-focus and touch-hold binder.
// Native click handlers and confirmation boundaries remain their sole owners.
function help(node,tr,en){
 if(!node)return;const value=english()?en:tr;
 attribute(node,'data-tip',value);attribute(node,'title',value);
 window.dockTipBagla?.(node);
}
function actionHelp(){
 const hint=$('r1241ControlHint');write(hint,'Çarktan başlat veya duraklat. Diğer işlemler için kolay kontrolleri aç.','Start or pause with the wheel. Open easy controls for more actions.');
 help($('r932QuickWheel'),'Çarkın görünümünü değiştirir; sayımı etkilemez.','Change the wheel appearance without changing the count.');
 help($('r932QuickScene'),'Arka plan sahnesini seçer; okumayı değiştirmez.','Choose the background scene without changing the reading.');
 help($('r920Minus'),'Sayacı bir azaltır; okuma sürerken kullanılamaz.','Decrease the count by one; unavailable while reading.');
 help($('r920Plus'),'Sayacı bir artırır; okuma sürerken kullanılamaz.','Increase the count by one; unavailable while reading.');

 const s=window.SukunSessionState?.peek?.()||window.SukunSessionState?.snapshot?.()||{},busy=['PLAYING','PREPARING'].includes(s.phase),resume=s.globalPauseBlocked||s.phase==='PAUSED';
 const terminal=!!s.smartSession?.terminal,nonReading=!!s.smartSession&&!s.smartSession.reading;
 // A terminal queue is replayed by the native smart-session owner. It is not
 // a continuation of the last displayed dhikr or an unrelated journey.
 if(terminal){
  write($('r932EasyPlay'),'Seansı yeniden başlat','Restart session');
  attribute($('r932EasyPlay'),'aria-label',english()?'Restart session':'Seansı yeniden başlat');
  help($('r932EasyPlay'),'Sona eren seansı ilk adımından yeniden başlatır. Yalnız son zikri sürdürmez.','Restart the ended session from its first step, rather than continuing only its last dhikr.');
 }else if(nonReading){
  attribute($('r932EasyPlay'),'aria-label',english()?(busy?'Pause session':resume?'Continue session':s.phase==='ERROR'?'Retry session step':'Start session step'):(busy?'Seansı duraklat':resume?'Seansı sürdür':s.phase==='ERROR'?'Seans adımını yeniden dene':'Seans adımını başlat'));
  help($('r932EasyPlay'),busy?'Seansın geçerli adımını duraklatır. Devam et ile bu adımı sürdürürsün.':resume?'Seansın geçerli adımını kaldığı yerden sürdürür.':s.phase==='ERROR'?'Seansın geçerli adımını yeniden dener.':'Seansın geçerli adımını başlatır.',busy?'Pause the current session step. Continue resumes that step.':resume?'Continue the current session step where it left off.':s.phase==='ERROR'?'Retry the current session step.':'Start the current session step.');
 }else{
 help($('r932EasyPlay'),busy?'Okumayı duraklatır. Devam et ile kaldığın yerden sürdürürsün.':resume?'Okumayı kaldığın yerden sürdürür. Sayımı sıfırlamaz.':s.phase==='ERROR'?'Ses kaynağını yeniden dener. Sayımı sıfırlamaz.':'Seçili zikri mevcut sayımdan başlatır. Seyri başa almaz.',busy?'Pause reading. Continue resumes where you left off.':resume?'Continue where you left off without resetting the count.':s.phase==='ERROR'?'Retry the audio source without resetting the count.':'Start the selected dhikr from its current count without restarting the journey.');
 }
 const name=s.activeMode==='berhet'?'Berhetiyye':'Esmâ',enName=s.activeMode==='berhet'?'Berhetiyye':'Esma',count=s.activeMode==='berhet'?28:99;
 write($('r920JourneyRestartAll'),'Seyri baştan başlat','Restart journey');
 attribute($('r920JourneyRestartAll'),'aria-label',english()?`Restart the entire ${enName} journey`:`Tüm ${name} seyrini baştan başlat`);
 help($('r920JourneyRestartAll'),`Onayından sonra ${count} isimlik ${name} seyrini ilk isimden başlatır ve bu seyrin ilerlemesini sıfırlar. Kayıtlar ve ayarlar korunur.`,`After confirmation, restart the ${count}-name ${enName} journey from the first name and reset this journey's progress. Recordings and settings are kept.`);
 attribute($('r932EasyStop'),'aria-label',english()?(terminal?'Close session result':s.smartSession?'Finish session':'End dhikr'):(terminal?'Seans sonucunu kapat':s.smartSession?'Seansı bitir':'Zikri bitir'));
 help($('r932EasyStop'),terminal?'Seans sonucunu kapatır; seansı yeniden başlatmaz.':s.smartSession?'Etkin seansı bitirir; ilk adımdan yeniden başlatmaz.':'Etkin okumayı bitirir. Seyri ilk isme döndürmez.',terminal?'Close the session result without restarting the session.':s.smartSession?'Finish the active session without restarting it from the first step.':'Finish the current reading without returning the journey to its first name.');
 help($('r920Restart'),terminal?'Sona eren seansı ilk adımından yeniden başlatır.':s.smartSession?'Seansın geçerli adımını yeniden başlatır.':'Yalnız seçili ismin sayımını sıfırlayıp yeniden başlatır. Tüm seyri başa almaz.',terminal?'Restart the ended session from its first step.':s.smartSession?'Restart the current session step.':'Reset and restart only the selected name, not the whole journey.');
 if(settingsAutoHidden)help(focusToggle,'Ayarları, görünümü ve okuma bilgi çubuğunu yeniden gösterir. Gizli kolay kontrolleri de açar.','Show settings, appearance and the reading information bar again, and reveal hidden easy controls.');
 else help(focusToggle,focusControlsVisible?'Başlat, baştan başlat ve bitir kontrollerini gizler. Tefekkürde alttaki Hedef/Kalan kartları da gizlenir; çarkın bilgileri ve çıkış düğmesi kalır.':'Kolay kontrolleri ve tefekkürde alttaki Hedef/Kalan kartlarını gösterir. Boyutları görünüme göre otomatik ayarlanır.',focusControlsVisible?'Hide the start, restart and finish controls. In reflection, also hide the lower target/remaining cards; wheel information and the exit remain.':'Show easy controls and the lower target/remaining cards in reflection. Their size adapts automatically.');
}
function placeSummary(){
 const summary=$('r1056ReadingSummary');if(!summary||!quick||!transport||quick.contains(summary))return;
 if(window.SukunCompactUI?.ownsSummary?.(summary))return;
 hiddenStates.set(summary,summary.hidden);
 // A late summary may be created beside the already-moved identity. Its
 // restore point must outlive the temporary hero that owns that identity.
 const identity=hero?.querySelector('.r920Identity'),original=anchors.find(([node])=>node===identity)?.[1];
 if(summary.parentElement===hero&&original?.isConnected){const anchor=document.createComment('r938-original');original.after(anchor);anchors.push([summary,anchor]);quick.append(summary)}
 else move(summary,quick);
 const anchor=$('r968ManualHint')||finishRow||transport;if(anchor?.parentElement===quick)anchor.after(summary);
}
function focusControls(tef=lastTef){
 // r1063: the saved easy-control preference applies on both sides of the
 // focus transition. The toggle must remain available to show them again.
 if(!host)return;const visible=focusControlsVisible;
 if(!visible&&[transport,finishRow].some(node=>node?.contains(document.activeElement)))focusToggle?.focus({preventScroll:true});
 hidden(transport,!visible);hidden(finishRow,!visible);
 // Context remains visible; restart and finish share the one easy-control group.
 hidden($('r1056ReadingSummary'),false);hidden($('r968ManualHint'),!visible);hidden(focusToggle,false);
 const state=visible?'shown':'hidden';if(host.dataset.r1056FocusControls!==state)host.dataset.r1056FocusControls=state;labels();window.SukunLowerStats?.syncControls?.(visible);window.SukunCountEntry?.render?.();
}
function setFocusControls(value){
 if(typeof value!=='boolean')return false;if(value===focusControlsVisible)return true;focusControlsVisible=value;
 try{localStorage.setItem(FOCUS_KEY,value?'1':'0')}catch(_){}
 focusControls();return true;
}
// Presentation-only inactivity state. The native session remains the playback owner.
function settingsPlaybackKey(tef){
 if(!host||!tef)return '';
 const s=window.SukunSessionState?.peek?.()||window.SukunSessionState?.snapshot?.()||{};
 if(s.paused||s.globalPauseBlocked||s.smartSession?.terminal)return '';
 const key=JSON.stringify([s.activeMode,s.activeIndex,s.journey?.kind??s.journeyKind]);
 // The session may prepare another clip after playback has started. Keep that
 // stretch's clock/hold, but never start a countdown from initial preparation.
 return s.phase==='PLAYING'||s.phase==='PREPARING'&&settingsPlaybackStretch===key?key:'';
}
function cancelSettingsHide(){
 if(settingsHideTimer!==null)clearTimeout(settingsHideTimer);settingsHideTimer=null;
}
function setSettingsAutoHidden(value){
 const changed=settingsAutoHidden!==value;settingsAutoHidden=value;
 if(host&&host.dataset.r1242SettingsHidden!==String(value))host.dataset.r1242SettingsHidden=String(value);
 if(changed)labels();
}
function resetSettingsAutoHide(){
 cancelSettingsHide();settingsPlaybackStretch='';settingsRevealHeld=false;setSettingsAutoHidden(false);
}
function revealSettings(){
 cancelSettingsHide();settingsRevealHeld=!!settingsPlaybackStretch;setSettingsAutoHidden(false);
}
function settingsBeingEdited(){
 return open||body?.contains(document.activeElement)||$('r1056ReadingSummary')?.contains(document.activeElement);
}
function scheduleSettingsVisibility(key,delay,show){
 const owner=host;
 settingsHideTimer=setTimeout(()=>{
  settingsHideTimer=null;
  if(host!==owner||settingsPlaybackKey(lastTef)!==key){syncSettingsAutoHide(lastTef);return}
  if(settingsBeingEdited()){revealSettings();return}
  if(settingsRevealHeld)return;
  if(!show&&document.activeElement===toggle)focusToggle?.focus({preventScroll:true});
  setSettingsAutoHidden(!show);
  // Pulse starts remain ten minutes apart; the five seconds are part of that interval.
  scheduleSettingsVisibility(key,show?SETTINGS_PULSE_DURATION:SETTINGS_PULSE_INTERVAL-SETTINGS_PULSE_DURATION,!show);
 },delay);
}
function syncSettingsAutoHide(tef){
 const key=settingsPlaybackKey(tef);
 if(key!==settingsPlaybackStretch){resetSettingsAutoHide();settingsPlaybackStretch=key}
 if(!key)return;
 // Never remove a settings surface or reading bar that the user is editing.
 if(settingsBeingEdited()){revealSettings();return}
 if(settingsAutoHidden||settingsRevealHeld||settingsHideTimer!==null)return;
 const owner=host;
 settingsHideTimer=setTimeout(()=>{
  settingsHideTimer=null;
  if(host!==owner||settingsPlaybackKey(lastTef)!==key){syncSettingsAutoHide(lastTef);return}
  if(settingsBeingEdited()){revealSettings();return}
  if(document.activeElement===toggle)focusToggle?.focus({preventScroll:true});
  setSettingsAutoHidden(true);
  scheduleSettingsVisibility(key,SETTINGS_PULSE_INTERVAL,true);
 },SETTINGS_HIDE_DELAY);
}
function setOpen(next,focus=false){
 open=!!next;if(!panel)return;if(open)revealSettings();
 if(!open&&body.contains(document.activeElement))toggle.focus({preventScroll:true});
 hidden(body,!open);attribute(toggle,'aria-expanded',open);write($('r1056SettingsChevron'),open?'⌄':'⌃',open?'⌄':'⌃');
 if(panel.dataset.open!==String(open))panel.dataset.open=String(open);if(focus)toggle.focus({preventScroll:true});
}
function restore(){
 resetSettingsAutoHide();
 window.SukunLowerStats?.beforeRestore?.(host);
 window.SukunCompactUI?.beforeRestore?.(host);
 if(host)delete host.querySelector('.r920Stats')?.dataset.r989ExitRow;
 for(const [node,anchor]of anchors.reverse()){if(anchor.isConnected)anchor.replaceWith(node)}anchors=[];
 for(const [node,hidden]of hiddenStates)node.hidden=hidden;hiddenStates.clear();
 if(transport)transport.id=transportId;
 body?.remove();toggle?.remove();primary?.remove();finishRow?.remove();$('r1241ControlHint')?.remove();focusToggle?.remove();hero?.remove();panel?.remove();
 if(host){delete host.dataset.r938Layout;delete host.dataset.r1056FocusControls;delete host.dataset.r1242SettingsHidden}
 host=hero=panel=body=toggle=quick=transport=finishRow=focusToggle=primary=null;lastTef=null;
}
function build(root){
 host=root;host.dataset.r938Layout='1';host.dataset.r1242SettingsHidden='false';
 hero=document.createElement('div');hero.id='r938Hero';
 const wheel=$('r924WheelFrame');wheel.before(hero);
 for(const node of [root.querySelector('.r920Identity'),wheel,root.querySelector('.r920Stats'),$('r920RecordingError'),$('r920SceneError')])move(node,hero);
 panel=document.createElement('section');panel.id='r938Panel';panel.setAttribute('aria-label','Zikir kontrolleri');hero.after(panel);
 // r1056: the existing delegate stays above both daily controls and settings.
 // Moving its original buttons keeps one click owner and all native gates.
 quick=$('r932WheelControls');move(quick,panel);
 toggle=document.createElement('button');toggle.id='r938PanelToggle';toggle.type='button';toggle.setAttribute('aria-controls','r938PanelBody');toggle.innerHTML='<span id="r1056SettingsCaption"></span><span id="r1056SettingsChevron" aria-hidden="true">⌃</span>';
 body=document.createElement('div');body.id='r938PanelBody';body.setAttribute('role','region');
 const controlHint=document.createElement('p');controlHint.id='r1241ControlHint';quick.append(controlHint);
 const shortcuts=quick.querySelector('.r932VisualShortcuts');
 const picker=$('r932QuickPicker');transport=quick.querySelector('.r932EasyTransport');transportId=transport?.id||'';
 if(transport){hiddenStates.set(transport,transport.hidden);move(transport,quick);transport.id='r1056PrimaryControls';quick.insertBefore(transport,quick.children[0]||null)}
 finishRow=document.createElement('div');finishRow.id='r1056FinishRow';quick.append(finishRow);move($('r932EasyStop'),finishRow);
 const hint=$('r968ManualHint');if(hint)hiddenStates.set(hint,hint.hidden);move(hint,quick);
 focusToggle=document.createElement('button');focusToggle.id='r1056FocusControlsToggle';focusToggle.type='button';focusToggle.setAttribute('aria-controls','r1056PrimaryControls r1056FinishRow r968ManualHint r920Target r920Remaining');focusToggle.innerHTML='<span id="r1242FocusControlsLabel"></span><svg class="r1242ControlsEye" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';quick.append(focusToggle,toggle,body);
 // Easy controls own the wrapper; the session renderer keeps the button's eligibility.
 const restartAll=$('r920JourneyRestartAll');if(restartAll){move(restartAll,finishRow);finishRow.prepend(restartAll)}
 for(const node of [shortcuts,picker])move(node,body);
 primary=document.createElement('div');primary.id='r968PrimaryActions';quick.insertBefore(primary,focusToggle);
 const nav=root.querySelector('.r920Transport');move(nav,body);body.prepend(nav);
 move($('r920TefEnter'),primary);
 // Exit belongs to the main focus surface, independently of disclosure.
 move($('r920TefExit'),hero);
 for(const node of [$('r920Actions'),$('r920JourneySettings'),$('r679ZikirAyarBox'),$('r920ViewOptions'),$('r920More')])move(node,body);

 focusToggle.onclick=()=>{if(settingsAutoHidden||(!focusControlsVisible&&settingsPlaybackStretch)){revealSettings();if(!focusControlsVisible)setFocusControls(true);return}setFocusControls(!focusControlsVisible)};
 toggle.onclick=()=>setOpen(!open);
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'&&open&&!e.defaultPrevented){e.preventDefault();setOpen(false,true)}});
 placeSummary();labels();
}
// Reparent the existing action, never clone it or attach another transport owner.
function placeExit(root,tef){
 const exit=$('r920TefExit'),stats=root.querySelector('.r920Stats');if(!exit||!stats)return;
 const row=tef&&(root.dataset.mode==='berhet'||root.dataset.mode==='esma');
 if(row){
  const remaining=stats.querySelector('#r920Remaining')?.parentElement;
  if(!remaining)return;
  if(exit.parentElement!==stats||exit!==stats.children[stats.children.length-1])stats.append(exit);
  if(stats.dataset.r989ExitRow!=='1')stats.dataset.r989ExitRow='1';
 }else{
  if(stats.dataset.r989ExitRow!==undefined)delete stats.dataset.r989ExitRow;
  if(exit.parentElement!==hero)hero.append(exit);
 }
}
function sync(root,tef){
 if(root.hidden){if(host)restore();return}
 if(!root.querySelector('#r932WheelControls'))return;
 if(!host)build(root);
 if(lastTef!==tef){lastTef=tef;setOpen(false)}
 syncSettingsAutoHide(tef);
 placeSummary();focusControls(tef);
 placeExit(root,tef);
 window.SukunLowerStats?.sync?.(root,tef);
 window.SukunCompactUI?.sync?.(root,tef);
 window.SukunPremiumLayout?.sync?.(root,tef);
 // r1213: native controls precede exploration. This is DOM order, so keyboard
 // and screen-reader order agree with the visual order. No duplicated buttons.
 const sections=$('r986Sections'),entry=$('r1082SessionEntry');
 if(panel?.parentElement===root&&sections?.parentElement===root&&panel.nextElementSibling!==sections)panel.after(sections);
 if(sections?.parentElement===root&&entry?.parentElement===root&&sections.nextElementSibling!==entry)sections.after(entry);
 // Native handlers continue to own status and count; this is only an empty-state caption.
 const phase=$('r920Phase'),wheel=$('r924WheelFrame');if(phase&&wheel&&phase.parentElement!==wheel)wheel.append(phase);if(root.dataset.phase==='PLAYING'&&!phase.textContent)phase.textContent='Zikir sürüyor';
}
window.addEventListener?.('sukun:languagechange',labels,{passive:true});
window.SukunBerhetLayout=Object.freeze({version:'r1056',revision:'r1242',sync,setFocusControls,snapshot:()=>({active:!!host,open,tef:lastTef,focusControlsVisible,settingsAutoHidden,settingsRevealHeld,settingsHidePending:settingsHideTimer!==null})});
})();
