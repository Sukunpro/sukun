/* r938: layout only. Move native controls, retain their owners and restore Esma layout. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let host,hero,panel,body,toggle,primary,anchors=[],lastTef=null,open=false;
function move(node,parent){if(!node)return;const anchor=document.createComment('r938-original');node.before(anchor);anchors.push([node,anchor]);parent.append(node)}
function setOpen(next,focus=false){
 open=!!next;if(!panel)return;
 if(!open&&body.contains(document.activeElement))toggle.focus({preventScroll:true});
 body.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.querySelector('span').textContent=open?'⌄':'⌃';
 panel.dataset.open=String(open);if(focus)toggle.focus({preventScroll:true});
}
function restore(){
 if(host)delete host.querySelector('.r920Stats')?.dataset.r989ExitRow;
 for(const [node,anchor]of anchors.reverse()){if(anchor.isConnected)anchor.replaceWith(node)}anchors=[];
 body?.remove();toggle?.remove();primary?.remove();hero?.remove();panel?.remove();if(host)delete host.dataset.r938Layout;
 host=hero=panel=body=toggle=null;lastTef=null;
}
function build(root){
 host=root;host.dataset.r938Layout='1';
 hero=document.createElement('div');hero.id='r938Hero';
 const wheel=$('r924WheelFrame');wheel.before(hero);
 for(const node of [root.querySelector('.r920Identity'),wheel,root.querySelector('.r920Stats'),$('r920RecordingError'),$('r920SceneError')])move(node,hero);
 panel=document.createElement('section');panel.id='r938Panel';panel.setAttribute('aria-label','Zikir kontrolleri');hero.after(panel);
 toggle=document.createElement('button');toggle.id='r938PanelToggle';toggle.type='button';toggle.setAttribute('aria-controls','r938PanelBody');toggle.innerHTML='Kontroller ve görünüm <span aria-hidden="true">⌄</span>';panel.append(toggle);
 body=document.createElement('div');body.id='r938PanelBody';body.setAttribute('role','region');body.setAttribute('aria-label','Zikir kontrolleri ve görünüm');panel.append(body);
 const quick=$('r932WheelControls');move(quick,body);
 primary=document.createElement('div');primary.id='r968PrimaryActions';quick.append(primary);
 const nav=root.querySelector('.r920Transport');move(nav,quick);quick.insertBefore(nav,primary);
 for(const node of [$('r920TefEnter'),$('r932EasyStop')])move(node,primary);
 // Exit belongs to the main focus surface, independently of disclosure.
 move($('r920TefExit'),hero);
 for(const node of [$('r968ManualHint'),$('r920Actions'),$('r920JourneySettings'),$('r679ZikirAyarBox'),$('r920ViewOptions'),$('r920More')])move(node,quick);

 toggle.onclick=()=>setOpen(!open);
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'&&open&&!e.defaultPrevented){e.preventDefault();setOpen(false,true)}});
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
 placeExit(root,tef);
 // Native handlers continue to own status and count; this is only an empty-state caption.
 const phase=$('r920Phase'),wheel=$('r924WheelFrame');if(phase&&wheel&&phase.parentElement!==wheel)wheel.append(phase);if(root.dataset.phase==='PLAYING'&&!phase.textContent)phase.textContent='Zikir sürüyor';
}
window.SukunBerhetLayout=Object.freeze({version:'r989',sync,snapshot:()=>({active:!!host,open,tef:lastTef})});
})();
