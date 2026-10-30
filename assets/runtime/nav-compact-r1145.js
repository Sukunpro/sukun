/* Compact mobile navigation: measure actual labels and the sticky bar rather
   than shrinking text or guessing screen-reader/locale/zoom dimensions. */
(()=>{
 'use strict';
 if(window.SukunNavCompactR1145)return;
 const root=document.documentElement;
 let nav=null,labels=[],raf=0,observer=null,last={columns:6,margin:0};
 function active(){return root.dataset.r1074Theme==='berhet'&&matchMedia('(max-width:720px)').matches&&!document.body.matches('.sukun-tefekkur-mode,.sukun-focus-mode,.r616-ui')}
 function setVar(name,value){if(root.style.getPropertyValue(name)!==value)root.style.setProperty(name,value)}
 function textWidth(el){
  const range=document.createRange();range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
 }
 function measure(){
  raf=0;
  if(!nav||!nav.isConnected)return;
  if(!active()){
   if(nav.hasAttribute('data-r1145-cols'))nav.removeAttribute('data-r1145-cols');
   root.style.removeProperty('--r1145-nav-scroll-margin');return;
  }
  const ns=getComputedStyle(nav),button=nav.querySelector(':scope>button');
  if(!button||!nav.clientWidth||ns.display==='none')return;
  // The six sections now remain in one row; labels wrap within their own
  // controls. Keep measuring the real bar height for sticky navigation.
  const cols=6;
  if(nav.dataset.r1145Cols!==String(cols))nav.dataset.r1145Cols=String(cols);
  const r=nav.getBoundingClientRect(),position=getComputedStyle(nav);
  const top=Number.parseFloat(position.top)||0;
  const scrollPad=Number.parseFloat(getComputedStyle(root).scrollPaddingTop)||0;
  const margin=Math.max(0,Math.ceil(r.height+Math.max(0,top)+12-scrollPad));
  setVar('--r1145-nav-scroll-margin',margin+'px');
  last={columns:cols,margin,height:r.height};
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(measure)}
 function boot(){
  nav=document.querySelector('.wrap>nav.tabs');if(!nav)return;
  labels=[...nav.querySelectorAll(':scope>button>.tbL')];
  if(window.ResizeObserver){observer=new ResizeObserver(schedule);observer.observe(nav);for(const el of labels)observer.observe(el)}
  const mutation=new MutationObserver(schedule);
  mutation.observe(nav,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['style','class','hidden']});
  mutation.observe(root,{attributes:true,attributeFilter:['data-r1074-theme']});
  mutation.observe(document.body,{attributes:true,attributeFilter:['class']});
  for(const event of ['resize','sukun:languagechange','sukun:selectionthemechange','pageshow'])window.addEventListener(event,schedule,{passive:true});
  window.visualViewport?.addEventListener?.('resize',schedule,{passive:true});
  document.fonts?.ready?.then(schedule).catch(()=>{});schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.SukunNavCompactR1145=Object.freeze({refresh:schedule,snapshot:()=>({...last})});
})();
