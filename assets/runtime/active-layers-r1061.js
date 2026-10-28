/* r1061: bounded active-layer names and a read-only, accessible sound list. */
(()=>{'use strict';
 if(window.SukunActiveLayers)return;
 const $=id=>document.getElementById(id),sel='#r921DockName,#r588Current,#r588Title,#r588Item,#r588LayerCount,.r588Layer';
 let mounted=false,raf=0,closeTimer=0,anchor=null,opened=false,hover=false,observed=null,restoreTarget=null,scrollBody=null;
 const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
 const en=()=>window.I18N?.lang==='en',t=(tr,eng)=>en()?eng:tr;
 const text=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
 function read(){try{const s=window.SukunActiveSource?.read?.();return s?.permitted===false?null:s;}catch(_){return null;}}
 function layers(s){return Array.isArray(s?.layers)?s.layers.map(clean).filter(Boolean):[];}
 function visible(node){return !!node?.isConnected&&node.getClientRects().length>0;}
 function trigger(node){return node?.closest?.('[data-r1061-layers="true"]')||null;}
 function installStyle(){
  if($('r1061ActiveLayersStyle'))return;
  const style=document.createElement('style');style.id='r1061ActiveLayersStyle';style.textContent=`
  @layer sukun-r933-controls {
   html body #r170Now #r588DockShell[data-r1061-background="true"] :is(#r921DockName,#r588Current,#r588Item){
    -webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;
    white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;
    overflow:hidden!important;text-overflow:ellipsis!important;height:auto!important;min-height:0!important;
    max-height:30px!important;line-height:15px!important;
   }
   html body:not(.r588-mode-mini) #r170Now #r588DockShell[data-r1061-background="true"] :is(#r588Current,#r588Item){display:-webkit-box!important}
   html body.r920-dock.r588-mode-mini #r170Now #r588DockShell[data-r1061-background="true"] #r921DockName{
    display:-webkit-box!important;font-size:12px!important;line-height:16px!important;max-height:32px!important;
   }
   html body.r920-dock.r588-mode-mini #r170Now #r588DockShell[data-r1061-background="true"] .r588Main{
    top:6px!important;height:auto!important;max-height:56px!important;
   }
   html body.r920-dock.r588-mode-mini #r170Now #r588DockShell[data-r1061-background="true"] .r588Text{
    display:block!important;height:auto!important;max-height:56px!important;overflow:hidden!important;
   }
   html body.r920-dock.r588-mode-mini #r170Now #r588DockShell[data-r1061-background="true"] .r588Stats{display:none!important}
   html body #r170Now #r588DockShell #r1061LayersHint{
    display:block!important;min-height:0!important;height:auto!important;max-height:none!important;
    width:auto!important;max-width:100%!important;min-width:0!important;padding:3px 0!important;margin:2px 0 0!important;
    border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important;
    color:#d5cfaa!important;font:500 10px/14px system-ui!important;text-align:left!important;
    white-space:normal!important;overflow-wrap:anywhere!important;cursor:pointer!important;
   }
   html body.r920-dock.r588-mode-mini #r170Now #r588DockShell #r1061LayersHint{
    padding:0!important;margin-top:2px!important;font-size:9px!important;line-height:11px!important;
    display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;max-height:22px!important;overflow:hidden!important;
   }
   html body #r170Now #r588DockShell #r1061LayersHint[hidden],html body.r920-dock #r170Now #r588DockShell #r1061LayersHint[hidden]{display:none!important}
   html body #r170Now #r588DockShell [data-r1061-layers="true"]{cursor:help!important;touch-action:manipulation!important}
   html body #r170Now #r588DockShell [data-r1061-layers="true"]:focus-visible{outline:2px solid #ddce9b!important;outline-offset:2px!important;border-radius:3px!important}
  }
  #r1061ActiveLayersPopup{position:fixed;z-index:19009;box-sizing:border-box;width:min(360px,calc(100vw - 16px));max-height:min(65dvh,480px);display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid #a9b9a77a;border-radius:16px;background:linear-gradient(145deg,#0a2830,#101b2b);color:#e6ece8;box-shadow:0 12px 36px #0008;font:500 13px/1.45 system-ui;overflow:hidden;touch-action:pan-y pinch-zoom}
  #r1061ActiveLayersPopup[hidden]{display:none!important}
  #r1061ActiveLayersPopup .r1061LayersHead{display:flex;align-items:center;gap:8px;flex-shrink:0}
  #r1061ActiveLayersTitle{flex:1;min-width:0;margin:0;font:600 14px/1.35 system-ui;color:#f0dfb0;overflow-wrap:anywhere}
  #r1061ActiveLayersPopup button{box-sizing:border-box;min-height:44px;padding:8px 12px;border:1px solid #b8c8b940;border-radius:10px;background:#9ac1b018;color:#e9ecd9;font:600 12px/1.3 system-ui;cursor:pointer;touch-action:manipulation}
  #r1061ActiveLayersClose{width:44px;flex:0 0 44px;font-size:20px!important}
  #r1061ActiveLayersList{margin:0;padding:0 0 0 22px;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
  #r1061ActiveLayersList li{padding:6px 3px;overflow-wrap:anywhere;border-bottom:1px solid #b8c8b916}
  #r1061ActiveLayersDetails{width:100%;flex-shrink:0}
  #r1061ActiveLayersPopup button:focus-visible{outline:2px solid #ddce9b;outline-offset:2px}
  `;document.head.append(style);
 }
 function mount(){
  const shell=$('r588DockShell'),container=shell?.querySelector('.r588Text');if(!shell||!container)return false;
  installStyle();
  if(!$('r1061LayersHint')){const b=document.createElement('button');b.id='r1061LayersHint';b.type='button';b.hidden=true;b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls','r1061ActiveLayersPopup');container.append(b);}
  if(!$('r1061ActiveLayersPopup')){
   const popup=document.createElement('section');popup.id='r1061ActiveLayersPopup';popup.hidden=true;popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','false');popup.setAttribute('aria-labelledby','r1061ActiveLayersTitle');
   const head=document.createElement('div');head.className='r1061LayersHead';const title=document.createElement('h2');title.id='r1061ActiveLayersTitle';const close=document.createElement('button');close.id='r1061ActiveLayersClose';close.type='button';close.textContent='×';head.append(title,close);
   const list=document.createElement('ul');list.id='r1061ActiveLayersList';const details=document.createElement('button');details.id='r1061ActiveLayersDetails';details.type='button';popup.append(head,list,details);document.body.append(popup);
   close.addEventListener('click',()=>hide(true));details.addEventListener('click',()=>{hide(false);const target=$('r588Details');target?.click();const focus=visible(target)?target:$('r433DetailBtn');if(visible(focus))focus.focus({preventScroll:true});});
   popup.addEventListener('pointerenter',()=>{hover=true;clearTimeout(closeTimer);});popup.addEventListener('pointerleave',()=>{hover=false;later();});
  }
  mounted=true;
  const body=$('r659DockBody');if(body&&body!==scrollBody){scrollBody=body;body.addEventListener('scroll',()=>{if(opened)schedule();},{passive:true});}
  if(typeof ResizeObserver==='function'&&!observed){observed=new ResizeObserver(schedule);observed.observe(container);if($('r588Item'))observed.observe($('r588Item'));}
  return true;
 }
 function setExpanded(value){document.querySelectorAll('#r588DockShell [data-r1061-layers="true"],#r1061LayersHint').forEach(n=>{const v=String(!!value&&n===anchor);if(n.getAttribute('aria-expanded')!==v)n.setAttribute('aria-expanded',v);});}
 function position(){
  const popup=$('r1061ActiveLayersPopup');if(!opened||!popup||!visible(anchor)){hide(false);return;}
  const vv=window.visualViewport,x=vv?.offsetLeft||0,y=vv?.offsetTop||0,w=vv?.width||innerWidth,h=vv?.height||innerHeight,a=anchor.getBoundingClientRect();
  popup.style.width=Math.min(360,Math.max(120,w-16))+'px';popup.style.maxHeight=Math.max(80,Math.min(480,h*.65,h-16))+'px';
  const rect=popup.getBoundingClientRect();const left=Math.max(x+8,Math.min(a.left,x+w-rect.width-8));
  const above=a.top-rect.height-8,below=a.bottom+8;const top=above>=y+8?above:below+rect.height<=y+h-8?below:Math.max(y+8,y+h-rect.height-8);
  popup.style.left=Math.round(left)+'px';popup.style.top=Math.round(top)+'px';
 }
 function fill(s){
  const values=layers(s),list=$('r1061ActiveLayersList');if(!list)return values;
  const sig=JSON.stringify(values);if(list.dataset.sig!==sig){list.dataset.sig=sig;list.replaceChildren(...values.map(value=>{const li=document.createElement('li');li.textContent=value;return li;}));}
  text($('r1061ActiveLayersTitle'),t('Şu an çalan ögeler','Currently playing items')+' · '+values.length);
  text($('r1061ActiveLayersDetails'),t('≡ Detaylar · tüm ses kontrolleri','≡ Details · all sound controls'));
  $('r1061ActiveLayersClose')?.setAttribute('aria-label',t('Çalan ögeler listesini kapat','Close the playing items list'));
  return values;
 }
 function show(target){
  if(document.hidden||!mount())return false;
  const s=read();if(!layers(s).length){hide(false);return false;}
  const node=typeof target==='string'?$(target):target;anchor=node||$('r1061LayersHint');if(!visible(anchor)){hide(false);return false;}
  clearTimeout(closeTimer);fill(s);opened=true;$('r1061ActiveLayersPopup').hidden=false;setExpanded(true);position();return opened;
 }
 function hide(restore){
  clearTimeout(closeTimer);closeTimer=0;opened=false;hover=false;const popup=$('r1061ActiveLayersPopup'),wasInside=popup?.contains(document.activeElement);if(popup)popup.hidden=true;setExpanded(false);
  if(restore&&wasInside&&visible(anchor)){restoreTarget=anchor;anchor.focus({preventScroll:true});restoreTarget=null;}
 }
 function clearList(){const list=$('r1061ActiveLayersList');if(list){list.replaceChildren();delete list.dataset.sig;}}
 function later(){clearTimeout(closeTimer);closeTimer=setTimeout(()=>{closeTimer=0;const popup=$('r1061ActiveLayersPopup');if(!hover&&!popup?.contains(document.activeElement)&&document.activeElement!==anchor)hide(false);},180);}
 function sync(){
  if(document.hidden){hide(false);return;}if(!mount())return;
  const s=read(),values=layers(s),shell=$('r588DockShell'),background=!!s?.background&&!!values.length;
  const bg=String(background);if(shell.dataset.r1061Background!==bg)shell.dataset.r1061Background=bg;
  shell.querySelectorAll(sel).forEach(n=>{
   if(values.length){n.dataset.r1061Layers='true';if(n.tabIndex!==0)n.tabIndex=0;n.setAttribute('role','button');n.setAttribute('aria-haspopup','dialog');n.setAttribute('aria-controls','r1061ActiveLayersPopup');n.setAttribute('aria-label',t('Tüm çalan ögeleri göster','Show all playing items'));}
   else if(n.dataset.r1061Layers){delete n.dataset.r1061Layers;n.removeAttribute('tabindex');n.removeAttribute('role');n.removeAttribute('aria-haspopup');n.removeAttribute('aria-controls');n.removeAttribute('aria-label');n.removeAttribute('aria-expanded');}
  });
  const mode=window.SukunDockSize?.get?.()||(document.body.classList.contains('r588-mode-mini')?'mini':'midi'),name=$(mode==='mini'?'r921DockName':'r588Current');
  const overflow=background&&visible(name)&&name.scrollHeight>name.clientHeight+1,hint=$('r1061LayersHint');hint.hidden=!overflow;
  text(hint,t('Detaylar','Details'));
  hint.setAttribute('aria-label',t('Tüm çalan ögeleri göster','Show all playing items'));
  if(!values.length){hide(false);clearList();}else if(opened){if(!visible(anchor))hide(false);else{fill(s);position();}}
 }
 function schedule(){if(raf)return;if(document.hidden){hide(false);return;}raf=requestAnimationFrame(()=>{raf=0;sync();});}
 document.addEventListener('pointerover',e=>{if(e.pointerType&&e.pointerType!=='mouse')return;const n=trigger(e.target);if(n&&!n.contains(e.relatedTarget))show(n);},{passive:true});
 document.addEventListener('pointerout',e=>{const n=trigger(e.target);if(n&&!n.contains(e.relatedTarget)&&!$('r1061ActiveLayersPopup')?.contains(e.relatedTarget))later();},{passive:true});
 document.addEventListener('focusin',e=>{if(e.target===restoreTarget)return;const n=trigger(e.target);if(n)show(n);else if(!$('r1061ActiveLayersPopup')?.contains(e.target)&&e.target!==$('r1061LayersHint'))hide(false);});
 document.addEventListener('focusout',()=>{if(opened)later();});
 document.addEventListener('click',e=>{const n=trigger(e.target)||e.target.closest?.('#r1061LayersHint');if(n){clearTimeout(closeTimer);show(n);}});
 document.addEventListener('pointerdown',e=>{if(opened&&!trigger(e.target)&&!e.target.closest?.('#r1061LayersHint,#r1061ActiveLayersPopup'))hide(false);},{capture:true,passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.preventDefault();hide(true);}else if((e.key==='Enter'||e.key===' ')&&trigger(e.target)){e.preventDefault();if(show(trigger(e.target)))$('r1061ActiveLayersClose')?.focus({preventScroll:true});}});
 ['sukun:backgroundmix','sukun:currentflowchange','sukun:nowplayingchange','sukun:sessionchange','sukun:r698modechange','sukun:languagechange','sukun:secretaccesschange','sukun:r616viewchange','sukun:tabchange','resize','pageshow'].forEach(ev=>window.addEventListener(ev,schedule,{passive:true}));
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('scroll',()=>{if(opened)schedule();},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;hide(false);clearList();}else schedule();});
 window.addEventListener('pagehide',()=>{if(raf)cancelAnimationFrame(raf);raf=0;hide(false);clearList();observed?.disconnect();observed=null;});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
 window.SukunActiveLayers=Object.freeze({version:'r1061',refresh:sync,show,hide:()=>hide(false),snapshot:()=>({version:'r1061',mounted,open:opened,count:layers(read()).length,labels:layers(read()),hintVisible:!!$('r1061LayersHint')&&!$('r1061LayersHint').hidden,trigger:anchor?.id||''})});
})();
