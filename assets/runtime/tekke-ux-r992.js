/* Approved Tekke UX, r992. Native controls stay in place; the factory and
 * SukunTekkeSet retain exclusive ownership of audio, timing and recordings. */
(()=>{'use strict';
 if(window.SukunTekkeUX)return;
 const safe=(f,d=null)=>{try{return f()}catch(_){return d}},
 english=()=>window.I18N?.lang==='en'||document.documentElement.lang==='en',
 copy=(tr,en)=>english()?en:tr;
 let root=null,api=null,chosen=safe(()=>JSON.parse(localStorage.getItem('tekke.purpose')),'dhikr'),
 collapsed=safe(()=>JSON.parse(localStorage.getItem('tekke.set.collapsed'))) !== false,
 tab='session',returnFocus=null,viewportHeight=0;
 if(!['dhikr','set','quiet'].includes(chosen))chosen='dhikr';
 const $=s=>root?.querySelector(s),all=s=>root?[...root.querySelectorAll(s)]:[];
 const save=(k,v)=>safe(()=>{if(window.SukunTabOwner?.canPersist?.(k)!==false)localStorage.setItem(k,JSON.stringify(v))});
 const factory=()=>api||(api=window.Tekke?.hazirla?.());
 const state=()=>window.Tekke?.sessionState?.()||{purpose:'dhikr',phase:'idle',active:false};
 const words={dhikr:['Zikir ve nefes','Dhikr and breathing'],set:['Tefekkür seti','Reflection set'],quiet:['Sessiz tefekkür','Quiet reflection']};
 const label=k=>copy(...(words[k]||words.dhikr));
 function button(text,action,cls=''){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.dataset.tkAction=action;return b;}
 function section(id,cls){const n=document.createElement('section');n.id=id;n.className=cls;return n;}
 function purposePick(kind){
  chosen=kind;save('tekke.purpose',kind);render();
 }
 function chooseTab(kind){
  tab=kind;for(const b of all('[data-tk-tab]')){b.setAttribute('aria-selected',String(b.dataset.tkTab===tab));b.tabIndex=b.dataset.tkTab===tab?0:-1;}
  for(const s of all('#r992PanelBody > .pSec'))s.hidden=s.dataset.tkGroup!==tab;
  $('#panel .pHead')?.toggleAttribute('hidden',tab!=='session');
  $('#r992PanelBody')?.setAttribute('aria-labelledby','r992Tab-'+tab);
  $('#r992PanelBody')?.setAttribute('aria-label',copy(...{session:['Seans ayarları','Session settings'],sounds:['Ses ayarları','Sound settings'],recordings:['Setler ve kayıtlar','Sets and recordings'],appearance:['Görünüm ayarları','Appearance settings']}[tab]));
 }
 function groupSettings(){
  const panel=$('#panel');if(!panel)return;
  const header=section('r992PanelHeader','r992SheetHead');
  const h=document.createElement('h2');h.dataset.tkCopy='Mihrap · Ayarlar|Mihrab · Settings';header.append(h,button('×','close-settings','r992IconBtn'));panel.prepend(header);
  const tabs=document.createElement('div');tabs.id='r992PanelTabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',copy('Ayar kategorileri','Settings categories'));
  const names={session:['Seans','Session'],sounds:['Sesler','Sounds'],recordings:['Kayıtlar','Recordings'],appearance:['Görünüm','Appearance']};
  for(const [key,txt] of Object.entries(names)){const b=button('',`tab-${key}`);b.dataset.tkTab=key;b.dataset.tkCopy=txt.join('|');b.id=`r992Tab-${key}`;b.setAttribute('role','tab');b.setAttribute('aria-controls','r992PanelBody');tabs.append(b);}
  header.after(tabs);
  // Keep each existing section and its wired handlers intact. Audio controls
  // in the old preset section move as native nodes into a new sound section.
  const sound=section('r992SoundSection','pSec');sound.dataset.tkGroup='sounds';
  const title=document.createElement('div');title.className='pT';title.dataset.tkCopy='Okuyuş ve ortam sesi|Narration and ambience';sound.append(title);
  const priority=document.createElement('p');priority.className='pD';priority.dataset.tkCopy='Kendi kaydın önceliklidir. Eksik adımda cihaz sesi (TTS) kullanılır. Yankı ve 8D kendi kayıtlarına uygulanır.|Your recording takes priority. Missing steps use device speech (TTS). Echo and 8D apply to your recordings.';sound.append(priority);
  for(const sel of ['#vMaster','#katVol','#tkNoiseTgl','#rehber8dTgl']){const row=$(sel)?.closest('.row, .opt');if(row)sound.append(row);}
  const appearance=$('#tkTemaRow')?.closest('.pSec');for(const sel of ['#sakinTgl','#hapTgl']){const row=$(sel)?.closest('.opt');if(row&&appearance)appearance.append(row);}
  for(const sec of all('#panel > .pSec')){
   sec.dataset.tkGroup=sec.querySelector('#imgRecList, #imgeRow')?'recordings':sec.querySelector('#tkTemaRow')?'appearance':sec.querySelector('#rehberTgl, #bpmSld, #vNey')?'sounds':'session';
   // Existing collapsible headers remain keyboard reachable.
   const heading=sec.querySelector('.pT');if(heading){heading.tabIndex=0;heading.setAttribute('role','button');heading.setAttribute('aria-expanded',String(!sec.classList.contains('kapali')));heading.addEventListener('click',()=>heading.setAttribute('aria-expanded',String(!sec.classList.contains('kapali'))));heading.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();heading.click();}});}
  }
  tabs.after(sound);
  const body=document.createElement('div');body.id='r992PanelBody';body.setAttribute('role','tabpanel');body.tabIndex=0;sound.before(body);for(const sec of all('#panel > .pSec'))body.append(sec);
  const foot=section('r992PanelFooter','r992SheetFoot');foot.append(button('','close-settings','r992GoldBtn'));foot.firstElementChild.dataset.tkCopy='Tamam|Done';const notice=document.createElement('p');notice.id='r992PanelNotice';foot.append(notice);panel.append(foot);
  // The title, close action and tabs share one sticky header, including text zoom.
  header.append(tabs);
  tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const bs=[...tabs.querySelectorAll('[data-tk-tab]')],i=bs.findIndex(b=>b.dataset.tkTab===tab),n=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;e.preventDefault();chooseTab(bs[n].dataset.tkTab);bs[n].focus();});
  chooseTab(tab);
 }
 function mount(){
  root=document.getElementById('tk');if(!root?.firstElementChild||root.dataset.tkUx==='r992')return;
  root.dataset.tkUx='r992';
  const gate=$('#gate'),intro=section('r992Purpose','r992Purpose');
  const h=document.createElement('h2');h.dataset.tkCopy='Bugün nasıl devam etmek istersin?|How would you like to continue today?';intro.append(h);
  for(const [key,sub,symbol] of [['dhikr',['Seçtiğin zikre eşlik et','Accompany your chosen dhikr'],'◌'],['set',['Kendi kaydınla adım adım','Step by step with your voice'],'۞'],['quiet',['Yalnız mekân ve sükûnet','Just the space and stillness'],'❋']]){
   const b=button('',`purpose-${key}`,'r992PurposeBtn');b.dataset.tkPurpose=key;
   const icon=document.createElement('span');icon.className='r992PurposeSymbol';icon.textContent=symbol;icon.setAttribute('aria-hidden','true');
   const body=document.createElement('span'),name=document.createElement('strong'),small=document.createElement('small');name.dataset.tkCopy=words[key].join('|');small.dataset.tkCopy=sub.join('|');body.append(name,small);
   const check=document.createElement('span');check.className='r992PurposeCheck';check.setAttribute('aria-hidden','true');b.append(icon,body,check);intro.append(b);
  }
  $('#gT').after(intro);
  const settings=button('','settings','r992SettingsBtn');settings.id='r992GateSettings';settings.dataset.tkCopy='⚙ Mihrap · Ayarlar|⚙ Mihrab · Settings';$('#topR').append(settings);
  const summary=document.createElement('p');summary.id='r992RecordingSummary';summary.setAttribute('role','status');$('#gSetSelect').after(summary);
  $('#gBtn').onclick=()=>factory()?.startPurpose?.(chosen);
  groupSettings();
  const badge=document.createElement('p');badge.id='r992SessionBadge';badge.setAttribute('role','status');$('#top').after(badge);
  const stage=section('r992ReflectionGuide','r992ReflectionGuide'),caption=document.createElement('p');caption.id='r992ReflectionCaption';stage.append(caption,button('','expand','r992StepButton'));stage.lastElementChild.id='r992StepButton';$('#stage').append(stage);
  const transport=section('r992Transport','r992Transport');transport.setAttribute('aria-label',copy('Tekke oynatma kontrolleri','Tekke playback controls'));
  const title=document.createElement('div');title.id='r992TransportTitle';title.className='r992TransportTitle';
  const controls=document.createElement('div');controls.className='r992TransportControls';
  const pause=button('','toggle','r992PauseBtn');pause.id='r992Pause';
  const end=button('','finish','r992EndBtn');end.dataset.tkCopy='□ Bitir|□ Finish';end.id='r992Finish';
  const volume=document.createElement('label');volume.className='r992TransportVolume';const span=document.createElement('span');span.dataset.tkCopy='Ses|Volume';const range=document.createElement('input');range.type='range';range.min='0';range.max='1';range.step='.01';range.id='r992Volume';const output=document.createElement('output');output.id='r992VolumeValue';volume.append(span,range,output);
  range.addEventListener('input',()=>{const master=$('#vMaster');master.value=range.value;master.dispatchEvent(new Event('input',{bubbles:true}));render();});
  const note=document.createElement('p');note.id='r992NavigationHint';note.dataset.tkCopy='Ana sayfaya dönmek akışı durdurmaz.|Returning to Home keeps the session going.';
  controls.append(pause,end,volume);transport.append(title,controls,note);root.append(transport);
  const home=section('r992HomeSession','r992HomeSession');home.hidden=true;
  const homeTitle=document.createElement('strong');homeTitle.id='r992HomeTitle';const homeNotice=document.createElement('p');homeNotice.id='r992HomeNotice';
  const returnBtn=button('','return','r992SettingsBtn');returnBtn.dataset.tkCopy='Tekke’ye dön|Return to Tekke';home.append(homeTitle,homeNotice,returnBtn);
  document.querySelector('.wrap > nav.tabs')?.after(home);
  home.addEventListener('click',e=>{if(e.target.closest('[data-tk-action="return"]'))factory()?.open?.();});
  root.addEventListener('click',e=>{const b=e.target.closest('[data-tk-action]');if(!b||b.disabled||!root.contains(b))return;const a=b.dataset.tkAction;
   if(a.startsWith('purpose-'))purposePick(a.slice(8));
   else if(a.startsWith('tab-'))chooseTab(a.slice(4));
   else if(a==='settings'){tab=(state().active?state().purpose:chosen)==='set'?'recordings':'session';factory()?.openSettings?.();}
   else if(a==='close-settings')factory()?.closeSettings?.();
   else if(a==='expand'){collapsed=!collapsed;save('tekke.set.collapsed',collapsed);render();}
   else if(a==='toggle'){const st=state();if(!st.active)factory()?.startPurpose?.(st.purpose);else if(st.phase==='paused')factory()?.resume?.();else factory()?.pause?.();render();}
   else if(a==='finish')factory()?.finish?.();
  });
  $('#panel').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();factory()?.closeSettings?.();}});
  $('#panelBtn').title=copy('Mihrap ayarlarını açar; akışı durdurmaz.','Open Mihrab settings; the session continues.');
  $('#backSukun').title=copy('SÜKÛN’a dön; akış devam eder.','Return to Home; the session continues.');
  fitViewport();
  const resize=()=>{if(!root.hidden)fitViewport();};
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('orientationchange',resize,{passive:true});
  window.visualViewport?.addEventListener('resize',resize,{passive:true});
  render();
 }
 function fitViewport(){
  const height=window.visualViewport?.height||window.innerHeight;
  if(Number.isFinite(height)&&height>0&&height!==viewportHeight){viewportHeight=height;root?.style.setProperty?.('--tkux-view-height',height+'px');}
 }
 function compactCard(){
  const card=$('#r990TekkeSetCard');if(!card)return;
  const stage=$('#stage');if(stage&&card.parentElement!==stage)stage.prepend(card);
  if(!card.querySelector('.r992SetExpand')){const expand=button('⌄','expand','r992IconBtn r992SetExpand');card.prepend(expand);}
  card.classList.toggle('r992Collapsed',collapsed);card.dataset.reason=window.SukunTekkeSet?.snapshot?.()?.reason||'';
  const exp=card.querySelector('.r992SetExpand');exp.setAttribute('aria-expanded',String(!collapsed));exp.setAttribute('aria-controls','r992SetStepText');exp.setAttribute('aria-label',copy(collapsed?'Adım metnini göster':'Adım metnini daralt',collapsed?'Show step text':'Collapse step text'));exp.title=copy('Daraltmak sesi durdurmaz.','Collapsing keeps the audio playing.');exp.textContent=collapsed?'⌄':'⌃';
  const step=card.querySelector('.r990SetStep');if(step)step.id='r992SetStepText';
 }
 function render(){
  if(!root?.firstElementChild||root.dataset.tkUx!=='r992')return;
  const close=$('#r992PanelHeader [data-tk-action]');if(close)close.setAttribute('aria-label',copy('Ayarları kapat','Close settings'));
  const st=state(),v=window.SukunTekkeSet?.snapshot?.()||{},gate=$('#gate'),entered=gate?.classList.contains('bye');
  root.dataset.tkPurpose=entered?st.purpose:chosen;
  root.dataset.tkSessionPhase=st.phase;
  root.dataset.tkEntered=entered?'1':'0';
  fitViewport();
  $('#r992GateSettings').hidden=!!entered;
  const mihrab=$('#panelBtn');mihrab.textContent=copy('⚙ Mihrap','⚙ Mihrab');mihrab.setAttribute('aria-label',copy('Mihrap ayarlarını aç','Open Mihrab settings'));
  // Keep native feedback in the scrollable stage, above the transport.
  const center=$('#center');for(const id of ['#tkGuide','#telkin']){const n=$(id);if(n&&center&&n.parentElement!==center)center.append(n);}
  for(const n of all('[data-tk-copy]'))n.textContent=copy(...n.dataset.tkCopy.split('|'));
  for(const b of all('[data-tk-purpose]')){const on=b.dataset.tkPurpose===chosen;b.setAttribute('aria-pressed',String(on));b.querySelector('.r992PurposeCheck').textContent=on?'✓':'›';}
  const summary=$('#r992RecordingSummary');if(summary)summary.textContent=v.recorded==null?copy('Kayıtlar kontrol ediliyor…','Checking recordings…'):`${v.selection?.total||0} ${copy('adım','steps')} · ${v.recorded} ${copy('kendi kaydın','your recordings')} · ${Math.max(0,(v.selection?.total||0)-v.recorded)} ${copy('cihaz sesi','device voices')}`;
  const start=$('#gBtn');if(start){start.textContent=chosen==='set'?copy('Seti başlat','Start set')+(v.selection?' · '+(window.I18N?.t?.(v.selection.title)||v.selection.title):''):chosen==='quiet'?copy('Sessiz tefekküre başla','Begin quiet reflection'):copy('Zikir ve nefese başla','Start dhikr and breathing');start.disabled=chosen==='set'&&!v.selected;}
  const phaseText=st.phase==='paused'?copy('Duraklatıldı','Paused'):st.phase==='preparing'?copy('Hazırlanıyor','Preparing'):st.active?copy('Devam ediyor','In progress'):st.phase==='ended'?copy('Tamamlandı','Completed'):st.phase==='error'?copy('Ses kullanılamadı','Audio unavailable'):copy('Hazır','Ready');
  const badge=$('#r992SessionBadge');if(badge){badge.hidden=!entered;badge.textContent=label(st.purpose)+' · '+phaseText;}
  const transport=$('#r992Transport');if(transport){transport.hidden=!entered||root.classList.contains('ayarModu');$('#r992TransportTitle').textContent=label(st.purpose);const pause=$('#r992Pause');pause.textContent=!st.active?copy(st.phase==='error'?'▶ Tekrar başlat':'▶ Başlat',st.phase==='error'?'▶ Retry':'▶ Start'):st.phase==='paused'?copy('▶ Devam et','▶ Resume'):copy('Ⅱ Duraklat','Ⅱ Pause');pause.disabled=st.phase==='preparing'||(!st.active&&st.purpose==='set'&&!v.selected);pause.setAttribute('aria-label',pause.textContent+' · '+label(st.purpose));}
  const vol=$('#r992Volume');if(vol){vol.value=String(st.volume??.75);vol.disabled=st.purpose==='quiet';vol.setAttribute('aria-label',copy('Tekke ana ses düzeyi','Tekke master volume'));vol.title=copy('Kayıt sesini hemen değiştirir. Cihaz sesinde bir sonraki okumada uygulanır.','Recording volume changes immediately. Device speech uses it on the next reading.');$('#r992VolumeValue').textContent=Math.round((st.volume??.75)*100)+'%';}
  const reflection=$('#r992ReflectionGuide');if(reflection){reflection.hidden=!entered||st.purpose==='dhikr'||st.purpose==='set'&&!collapsed;$('#r992ReflectionCaption').textContent=st.purpose==='quiet'?copy('Mekân ve sükûnet','Space and stillness'):copy('Dinle ve tefekkür et','Listen and reflect');const step=$('#r992StepButton');step.hidden=st.purpose!=='set'||!v.visible;step.textContent=copy(collapsed?'Adım metnini göster':'Adım metnini daralt',collapsed?'Show step text':'Collapse step text');step.setAttribute('aria-expanded',String(!collapsed));step.setAttribute('aria-controls','r992SetStepText');}
  const panelNotice=$('#r992PanelNotice');if(panelNotice)panelNotice.textContent=st.active&&st.phase!=='paused'?copy('Akış devam ediyor.','The session continues.'):st.phase==='paused'?copy('Akış duraklatıldı.','The session is paused.'):copy('Ayarların kaydedilir.','Your settings are saved.');
  const oldNotice=$('#panelDurum');if(oldNotice)oldNotice.textContent=panelNotice?.textContent||'';
  const home=document.getElementById('r992HomeSession');if(home){home.hidden=!st.active||st.purpose==='set';const title=document.getElementById('r992HomeTitle');title.textContent='TEKKE · '+label(st.purpose);document.getElementById('r992HomeNotice').textContent=phaseText;home.querySelector('button').textContent=copy('Tekke’ye dön','Return to Tekke');}
  compactCard();chooseTab(tab);
 }
 function settingsOpened(){
  returnFocus=document.activeElement;
  chooseTab(tab);render();
  requestAnimationFrame(()=>$('#r992PanelHeader [data-tk-action]')?.focus({preventScroll:true}));
 }
 function settingsClosed(){render();safe(()=>returnFocus?.focus({preventScroll:true}));returnFocus=null;}
 window.SukunTekkeUX=Object.freeze({version:'r992',mount,render,settingsOpened,settingsClosed,selectPurpose:purposePick,selectTab:chooseTab});
 safe(()=>window.SukunAudioSessionRegistry?.register?.('tekke-dhikr-r992',{priority:115,title:'Tekke · Zikir ve nefes',
  getState:()=>{const s=state();return s.purpose==='dhikr'&&s.active?(['playing','paused'].includes(s.phase)?s.phase:'idle'):'idle';},
  pause:()=>window.Tekke?.pause?.(),resume:()=>window.Tekke?.resume?.(),play:()=>window.Tekke?.resume?.(),stop:()=>window.Tekke?.stop?.('registry-stop'),
  getVolume:()=>state().volume??.75,setVolume:v=>{const n=$('#vMaster');if(n){n.value=String(Math.max(0,Math.min(1,Number(v)||0)));n.dispatchEvent(new Event('input',{bubbles:true}));render();}}}));
 window.addEventListener('tekke:opened',()=>{mount();render();});
 window.addEventListener('tekke:started',()=>{mount();render();});
 window.addEventListener('tekke:closed',render);
 window.addEventListener('languagechange',render);window.addEventListener('sukun:language',render);
 if(window.SukunTekkeSet){window.SukunTekkeSet.subscribe(()=>{mount();render();});}
 mount();
})();
