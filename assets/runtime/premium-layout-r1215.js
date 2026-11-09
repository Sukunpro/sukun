/* r1215: presentation only. Native navigation, transport, access and journal
   remain authoritative. No cloned transport, polling, or document observer. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),english=()=>window.I18N?.lang==='en';
 const desktop=matchMedia('(min-width:1100px)');
 let readingButton,context,frame=0,readingActive=false;
 function syncReadingNavigation(){
  const active=readingActive&&document.body.dataset.r616View==='zikir'&&$('zmgOkumalar')?.open;
  readingButton?.classList.toggle('active',!!active);
  if(readingButton){if(active){if(readingButton.getAttribute('aria-current')!=='page')readingButton.setAttribute('aria-current','page')}else if(readingButton.getAttribute('aria-current')!=null)readingButton.removeAttribute('aria-current');}
  const zikir=$('r616BottomNav')?.querySelector('[data-r616-view="zikir"]');
  if(zikir&&document.body.dataset.r616View==='zikir'){zikir.classList.toggle('active',!active);if(active){if(zikir.getAttribute('aria-current')!=null)zikir.removeAttribute('aria-current')}else if(zikir.getAttribute('aria-current')!=='page')zikir.setAttribute('aria-current','page');}
  if(document.body.dataset.r616View==='zikir')text($('r616ViewName'),(active?(english()?'Readings':'Okumalar'):(english()?'Dhikr':'Zikir'))+' · '+(document.querySelector('meta[name="sukun-build"]')?.content||''));
 }
 window.addEventListener('sukun:practicesectionchange',e=>{readingActive=e.detail?.id==='zmgOkumalar';queue()});
 window.addEventListener('sukun:r616viewchange',()=>{readingActive=false;queue()});
 document.addEventListener('toggle',e=>{if(e.target.id==='zmgOkumalar'){readingActive=!!e.target.open&&document.body.dataset.r616View==='zikir';queue()}},true);
 const text=(node,value)=>{if(node&&node.textContent!==String(value))node.textContent=String(value)};
 function readings(event){window.SukunDiscoveryR1158?.open?.('okumalar',event.currentTarget)}
 function ensureNavigation(root){
  if(!document.body.classList.contains('r1215-premium'))document.body.classList.add('r1215-premium');
  const nav=$('r616BottomNav');
  // Classic has its own visible tabs and section actions. Preserve that
  // navigation preference; the shared premium practice surface still mounts.
  if(!nav||!document.body.classList.contains('r616-ui')){readingButton?.remove();return;}
  if(!readingButton){
   readingButton=document.createElement('button');readingButton.type='button';readingButton.id='r1215ReadingsEntry';
   readingButton.innerHTML='<i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v15M3 4c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1Z"/></svg></i><span></span>';
   readingButton.addEventListener('click',readings);
  }
  text(readingButton.querySelector('span'),english()?'Readings':'Okumalar');
  // One reading entry: sidebar on desktop, practice path on mobile. The
  // original discovery reading entry remains for other mobile sections.
  const path=root?.querySelector('.r920Path');
  if(desktop.matches){if(readingButton.parentElement!==nav)nav.insertBefore(readingButton,nav.querySelector('[data-r616-view="journeys"]'));}
  else if(path){if(readingButton.parentElement!==path)path.append(readingButton);}
  else readingButton.remove();
 }
 function makeContext(root){
  const panel=root?.querySelector('#r938Panel');if(!panel)return null;
  if(!context?.isConnected){
   context=document.createElement('div');context.id='r1215PracticeContext';
   context.innerHTML='<p id="r1215ContextKicker"></p><h2 id="r1215ContextTitle"></h2><p id="r1215ContextProgress"></p><div id="r1215NextCard"><small id="r1215NextLabel"></small><strong id="r1215NextName"></strong></div><p id="r1215SaveState" role="status" aria-live="polite"></p>';
   panel.prepend(context);
  }
  return context;
 }
 function saved(){
  const node=$('r1215SaveState');if(!node)return;
  const state=window.SukunProgressJournal?.snapshot?.(),kind=state?.saveState||'idle',en=english();
  const label={idle:en?'Progress is saved on this device':'İlerleme bu cihazda saklanır',pending:en?'Saving…':'Kaydediliyor…',saved:en?'Saved on this device':'Bu cihazda kaydedildi',error:en?'Could not save · check device storage':'Kaydedilemedi · cihaz alanını kontrol et',unsaved:en?'Not saved · return to the active tab':'Kaydedilmedi · etkin sekmeye dön'}[kind]||'';
  text(node,label);if(node.dataset.state!==kind)node.dataset.state=kind;
  const title=kind==='saved'&&state.savedAt?new Date(state.savedAt).toLocaleString(en?'en-GB':'tr-TR'):'';if(node.title!==title)node.title=title;
 }
 function sync(root=$('r920Practice'),tef=!!window.SUKUN_TEFEKKUR?.active?.()){
  ensureNavigation(root);syncReadingNavigation();
  if(!root||root.hidden||root.dataset.r1211State==='unavailable'||!makeContext(root))return;
  if(context.hidden!==!!tef)context.hidden=!!tef;
  const s=window.SukunSessionState?.peek?.();if(!s)return;
  const en=english(),journey=s.journeyKind&&s.journeyKind!=='single',mode=s.activeMode,privateAllowed=mode!=='berhet'||!!window.SukunSecretPolicy?.unlocked?.();
  let items=[];try{items=privateAllowed&&typeof ZIKIR!=='undefined'?ZIKIR[mode]?.items||[]:[]}catch(_){}
  const index=Math.max(0,Number(s.activeIndex)||0);
  text($('r1215ContextKicker'),en?'YOUR SESSION':'SEANSIN');
  text($('r1215ContextTitle'),journey?(mode==='berhet'?(en?'Berhetiyye Journey':'Berhetiyye Seyri'):(en?'Esma Journey':'Esmâü’l-Hüsnâ Seyri')):(en?'Single dhikr':'Tekil zikir'));
  text($('r1215ContextProgress'),journey&&items.length?(index+1)+' / '+items.length+(en?' names':' isim'):(en?'Your pace · your intention':'Kendi ritmin · kendi niyetin'));
  const next=items[index+1],card=$('r1215NextCard'),hideNext=!journey||!next;if(card.hidden!==hideNext)card.hidden=hideNext;
  if(next){text($('r1215NextLabel'),en?'Next name':'Sıradaki isim');let name=next.t||next.tr||'';if(mode==='berhet')name=window.SukunR853Scene?.nameScenes?.[index+1]?.name||name;text($('r1215NextName'),name);}
  saved();
 }
 function queue(){if(document.hidden||frame)return;frame=requestAnimationFrame(()=>{frame=0;sync()})}
 desktop.addEventListener?.('change',queue);
 ['DOMContentLoaded','pageshow','sukun:r616viewchange','sukun:sessionchange','sukun:languagechange','sukun:tefekkurchange','sukun:secretaccesschange'].forEach(name=>window.addEventListener(name,queue,{passive:true}));
 window.addEventListener('sukun:progressjournalstatus',saved,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0}else queue()},{passive:true});
 window.SukunPremiumLayout=Object.freeze({version:'r1215',sync});
 queue();
})();
