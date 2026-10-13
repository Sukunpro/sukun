/* r938: layout only. Move native controls, retain their owners and restore Esma layout. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const FOCUS_KEY='sukun.zikir.quickControls.focus.v1';
let host,hero,panel,body,toggle,primary,quick,transport,finishRow,focusToggle,anchors=[],hiddenStates=new Map(),lastTef=null,open=false,transportId='';
let focusControlsVisible=true;try{focusControlsVisible=localStorage.getItem(FOCUS_KEY)!=='0'}catch(_){}
const english=()=>window.I18N?.lang==='en';
function write(node,tr,en){const value=english()?en:tr;if(node&&node.textContent!==value)node.textContent=value;}
function attribute(node,key,value){if(node&&node.getAttribute(key)!==String(value))node.setAttribute(key,String(value));}
function hidden(node,value){if(node&&node.hidden!==value)node.hidden=value;}
function move(node,parent){if(!node)return;const anchor=document.createComment('r938-original');node.before(anchor);anchors.push([node,anchor]);parent.append(node)}
function labels(){
 write($('r1056SettingsCaption'),'Ayarlar ve görünüm','Settings and appearance');
 write(focusToggle,focusControlsVisible?'Kolay kontrolleri gizle':'Kolay kontrolleri göster',focusControlsVisible?'Hide easy controls':'Show easy controls');
 attribute(focusToggle,'aria-expanded',focusControlsVisible);
 attribute(panel,'aria-label',english()?'Dhikr controls':'Zikir kontrolleri');
 attribute(body,'aria-label',english()?'Dhikr settings and appearance':'Zikir ayarları ve görünüm');
 attribute(finishRow,'aria-label',english()?'Finish the session':'Oturumu bitir');
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
 quick.insertBefore(summary,transport);
}
function focusControls(tef=lastTef){
 if(!host)return;const visible=!tef||focusControlsVisible;
 if(!visible&&[transport,finishRow,$('r1056ReadingSummary')].some(node=>node?.contains(document.activeElement)))focusToggle?.focus({preventScroll:true});
 if(!tef&&focusToggle?.contains(document.activeElement))toggle?.focus({preventScroll:true});
 hidden(transport,!visible);hidden(finishRow,!visible);
 hidden($('r1056ReadingSummary'),!visible);hidden($('r968ManualHint'),!visible);hidden(focusToggle,!tef);
 const state=visible?'shown':'hidden';if(host.dataset.r1056FocusControls!==state)host.dataset.r1056FocusControls=state;labels();
}
function setFocusControls(value){
 if(typeof value!=='boolean')return false;if(value===focusControlsVisible)return true;focusControlsVisible=value;
 try{localStorage.setItem(FOCUS_KEY,value?'1':'0')}catch(_){}
 focusControls();return true;
}
function setOpen(next,focus=false){
 open=!!next;if(!panel)return;
 if(!open&&body.contains(document.activeElement))toggle.focus({preventScroll:true});
 body.hidden=!open;toggle.setAttribute('aria-expanded',String(open));write($('r1056SettingsChevron'),open?'⌄':'⌃',open?'⌄':'⌃');
 panel.dataset.open=String(open);if(focus)toggle.focus({preventScroll:true});
}
function restore(){
 window.SukunCompactUI?.beforeRestore?.(host);
 if(host)delete host.querySelector('.r920Stats')?.dataset.r989ExitRow;
 for(const [node,anchor]of anchors.reverse()){if(anchor.isConnected)anchor.replaceWith(node)}anchors=[];
 for(const [node,hidden]of hiddenStates)node.hidden=hidden;hiddenStates.clear();
 if(transport)transport.id=transportId;
 body?.remove();toggle?.remove();primary?.remove();finishRow?.remove();focusToggle?.remove();hero?.remove();panel?.remove();
 if(host){delete host.dataset.r938Layout;delete host.dataset.r1056FocusControls}
 host=hero=panel=body=toggle=quick=transport=finishRow=focusToggle=primary=null;lastTef=null;
}
function build(root){
 host=root;host.dataset.r938Layout='1';
 hero=document.createElement('div');hero.id='r938Hero';
 const wheel=$('r924WheelFrame');wheel.before(hero);
 for(const node of [root.querySelector('.r920Identity'),wheel,root.querySelector('.r920Stats'),$('r920RecordingError'),$('r920SceneError')])move(node,hero);
 panel=document.createElement('section');panel.id='r938Panel';panel.setAttribute('aria-label','Zikir kontrolleri');hero.after(panel);
 // r1056: the existing delegate stays above both daily controls and settings.
 // Moving its original buttons keeps one click owner and all native gates.
 quick=$('r932WheelControls');move(quick,panel);
 toggle=document.createElement('button');toggle.id='r938PanelToggle';toggle.type='button';toggle.setAttribute('aria-controls','r938PanelBody');toggle.innerHTML='<span id="r1056SettingsCaption"></span><span id="r1056SettingsChevron" aria-hidden="true">⌃</span>';
 body=document.createElement('div');body.id='r938PanelBody';body.setAttribute('role','region');
 const shortcuts=quick.querySelector('.r932VisualShortcuts');
 const picker=$('r932QuickPicker');transport=quick.querySelector('.r932EasyTransport');transportId=transport?.id||'';
 if(transport){hiddenStates.set(transport,transport.hidden);move(transport,quick);transport.id='r1056PrimaryControls';quick.insertBefore(transport,quick.children[0]||null)}
 finishRow=document.createElement('div');finishRow.id='r1056FinishRow';quick.append(finishRow);move($('r932EasyStop'),finishRow);
 const hint=$('r968ManualHint');if(hint)hiddenStates.set(hint,hint.hidden);move(hint,quick);
 focusToggle=document.createElement('button');focusToggle.id='r1056FocusControlsToggle';focusToggle.type='button';focusToggle.setAttribute('aria-controls','r1056PrimaryControls r1056FinishRow');quick.append(focusToggle,toggle,body);
 for(const node of [shortcuts,picker])move(node,body);
 primary=document.createElement('div');primary.id='r968PrimaryActions';body.append(primary);
 const nav=root.querySelector('.r920Transport');move(nav,body);body.insertBefore(nav,primary);
 move($('r920TefEnter'),primary);
 // Exit belongs to the main focus surface, independently of disclosure.
 move($('r920TefExit'),hero);
 for(const node of [$('r920Actions'),$('r920JourneySettings'),$('r679ZikirAyarBox'),$('r920ViewOptions'),$('r920More')])move(node,body);

 focusToggle.onclick=()=>setFocusControls(!focusControlsVisible);
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
  if(exit.parentElement!==stats||exit.nextElementSibling!==remaining)stats.insertBefore(exit,remaining);
  stats.dataset.r989ExitRow='1';
 }else{
  delete stats.dataset.r989ExitRow;
  if(exit.parentElement!==hero)hero.append(exit);
 }
}
function sync(root,tef){
 if(root.hidden){if(host)restore();return}
 if(!root.querySelector('#r932WheelControls'))return;
 if(!host)build(root);
 if(lastTef!==tef){lastTef=tef;setOpen(false)}
 placeSummary();focusControls(tef);
 placeExit(root,tef);
 window.SukunCompactUI?.sync?.(root,tef);
 // Native handlers continue to own status and count; this is only an empty-state caption.
 const phase=$('r920Phase'),wheel=$('r924WheelFrame');if(phase&&wheel&&phase.parentElement!==wheel)wheel.append(phase);if(root.dataset.phase==='PLAYING'&&!phase.textContent)phase.textContent='Zikir sürüyor';
}
window.addEventListener?.('sukun:languagechange',labels,{passive:true});
window.SukunBerhetLayout=Object.freeze({version:'r1056',sync,setFocusControls,snapshot:()=>({active:!!host,open,tef:lastTef,focusControlsVisible})});
})();
