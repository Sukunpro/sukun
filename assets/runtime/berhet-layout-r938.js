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
 const quick=$('r932WheelControls');move(quick,panel);
 primary=document.createElement('div');primary.id='r967PrimaryActions';quick.append(primary);
 const nav=root.querySelector('.r920Transport');move(nav,quick);quick.insertBefore(nav,primary);
 for(const node of [$('r920TefEnter'),$('r920TefExit'),$('r932EasyStop')])move(node,primary);
 toggle=document.createElement('button');toggle.id='r938PanelToggle';toggle.type='button';toggle.setAttribute('aria-controls','r938PanelBody');toggle.innerHTML='Kontroller ve görünüm <span aria-hidden="true">⌄</span>';quick.append(toggle);
 body=document.createElement('div');body.id='r938PanelBody';body.setAttribute('role','region');body.setAttribute('aria-label','Görünüm ve ek zikir kontrolleri');quick.append(body);
 for(const node of [quick.querySelector('.r932VisualShortcuts'),$('r932QuickPicker'),$('r920Actions'),$('r920JourneySettings'),$('r679ZikirAyarBox'),$('r920ViewOptions'),$('r920More')])move(node,body);

 toggle.onclick=()=>setOpen(!open);
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'&&open&&!e.defaultPrevented){e.preventDefault();setOpen(false,true)}});
}
function sync(root,tef){
 if(root.hidden){if(host)restore();return}
 if(!root.querySelector('#r932WheelControls'))return;
 if(!host)build(root);
 if(lastTef!==tef){lastTef=tef;setOpen(false)}
 // Native handlers continue to own status and count; this is only an empty-state caption.
 const phase=$('r920Phase'),wheel=$('r924WheelFrame');if(phase&&wheel&&phase.parentElement!==wheel)wheel.append(phase);if(root.dataset.phase==='PLAYING'&&!phase.textContent)phase.textContent='Zikir sürüyor';
}
window.SukunBerhetLayout=Object.freeze({version:'r967',sync,snapshot:()=>({active:!!host,open,tef:lastTef})});
})();
