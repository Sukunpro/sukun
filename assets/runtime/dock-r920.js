/* r921 — presentation of the existing dock. No timer, counter or audio owner. */
(()=>{
 'use strict';
 if(window.SukunDockR920)return;
 const $=id=>document.getElementById(id);
 let mounted=false,raf=0;
 function text(el,value){if(el&&el.textContent!==value)el.textContent=value;}
 function button(id,label,title){const b=document.createElement('button');b.type='button';b.id=id;b.textContent=label;b.setAttribute('aria-label',title||label);return b;}
 function navigate(delta){
  if(window.SukunNavigation?.navigate)return window.SukunNavigation.navigate(delta,'dock-r920');
  return $(delta<0?'r170Prev':'r170Next')?.click();
 }
 function openAmbience(){
  const tab=document.querySelector('.tabs [data-t="amb"]');
  if(!tab)return false;
  tab.click();
  // Use the existing mixer and its native accordion; no second sound list.
  requestAnimationFrame(()=>{
   const head=document.querySelector('#mixer [data-ambacctgl="ozel"]');
   if(head){
    const options={block:'start',behavior:'instant'};
    if(window.SukunViewportPolicy?.scrollTo)window.SukunViewportPolicy.scrollTo(head,options,'dock-ambience');
    else head.scrollIntoView(options);
    head.focus({preventScroll:true});
   }
  });
  return true;
 }
 function accessibility(){
  document.querySelectorAll('#mixer [data-ambacc]').forEach(acc=>{
   const head=acc.querySelector('[data-ambacctgl]'),body=acc.querySelector('.preAccBody');
   if(!head||!body)return;
   const id='r920Amb-'+acc.dataset.ambacc;
   if(!body.id)body.id=id;
   if(head.getAttribute('aria-controls')!==body.id)head.setAttribute('aria-controls',body.id);
   if(head.type!=='button')head.type='button';
  });
 }
 function miniPresentation(mode){
  const shell=$('r588DockShell'),footer=shell?.querySelector(':scope > .r588Mode');
  const identity=shell?.querySelector('.r588Identity'),tef=$('r730MiniTef');
  // Keep the original button and its shell-delegated SUKUN_TEFEKKUR.enter handler.
  // Its previous header is hidden in Mini; moving it preserves one entry owner.
  const home=mode==='mini'?footer:identity;
  if(tef&&home&&tef.parentElement!==home){
   if(mode==='mini')home.insertBefore(tef,home.querySelector('.r588Transport'));
   else home.prepend(tef);
  }
  const container=shell?.querySelector('.r588Text');
  if(!container)return;
  let name=$('r921DockName');
  if(!name){name=document.createElement('b');name.id='r921DockName';container.prepend(name);}
  const session=window.SukunSessionState?.snapshot?.();
  const zikir=!!session&&(session.journey?.active||session.playing||session.paused||session.preparing||
   /^(auto-zikir|journey28|journey99|smart-session)$/.test(session.owner||''));
  const permitted=session?.activeMode!=='berhet'||!!window.SukunSecretPolicy?.unlocked?.();
  const value=String(!permitted?'SÜKÛN':zikir&&session.activeName?session.activeName:$('r588Title')?.textContent||'SÜKÛN').trim();
  text(name,value);if(name.title!==value)name.title=value;
 }
 function mount(){
  const shell=$('r588DockShell'),body=$('r659DockBody'),footer=shell?.querySelector(':scope > .r588Mode');
  if(!shell||!body||!footer)return false;
  if(!mounted){
   mounted=true;document.body.classList.add('r920-dock');
   const expand=button('r920DockExpand','⌃','Akış barını Midi boyutunda aç');
   expand.setAttribute('aria-controls','r659DockBody');
   expand.addEventListener('click',()=>window.SukunDockSize?.set?.('midi',true));footer.appendChild(expand);
   const tools=document.createElement('div');tools.id='r920DockTools';tools.setAttribute('role','group');tools.setAttribute('aria-label','Akış kısayolları');
   const prev=button('r920DockPrev','Önceki','Önceki isim');const next=button('r920DockNext','Sonraki','Sonraki isim');
   const ambience=button('r920DockAmbience','Ambiyans','Ambiyans ve kendi seslerini aç');ambience.setAttribute('aria-controls','tab-amb');
   prev.addEventListener('click',()=>navigate(-1));next.addEventListener('click',()=>navigate(1));ambience.addEventListener('click',openAmbience);tools.append(prev,next,ambience);
   const level=document.createElement('label');level.id='r920DockLevel';level.htmlFor='r920DockVolume';
   const name=document.createElement('span');name.textContent='Zikir sesi';
   const input=document.createElement('input');input.id='r920DockVolume';input.type='range';input.min='0';input.max='1';input.step='.01';input.setAttribute('aria-label','Zikir sesi seviyesi');
   const output=document.createElement('output');output.id='r920DockVolumeValue';output.htmlFor=input.id;
   input.addEventListener('input',()=>{const source=$('zVolSld');if(!source)return;source.value=input.value;source.dispatchEvent(new Event('input',{bubbles:true}));text(output,Math.round(Number(source.value)*100)+'%');});
   input.addEventListener('change',()=>{const source=$('zVolSld');if(source){source.value=input.value;source.dispatchEvent(new Event('change',{bubbles:true}));}});
   level.append(name,input,output);
   body.append(tools,level);
   $('zVolSld')?.addEventListener('input',schedule,{passive:true});
   // Existing layout controller owns dimensions, drag, safe areas and scroll.
   window.SukunAdaptiveDockLayout?.rebind?.();
  }
  accessibility();sync();return true;
 }
 function sync(){
  const mode=window.SukunDockSize?.get?.()||'mini';
  miniPresentation(mode);
  const source=$('zVolSld'),input=$('r920DockVolume');
  if(input){input.disabled=!source||source.disabled;if(source&&document.activeElement!==input&&input.value!==source.value)input.value=source.value;text($('r920DockVolumeValue'),source?Math.round(Number(source.value)*100)+'%':'—');}
  const expand=$('r920DockExpand');if(expand)expand.setAttribute('aria-expanded',String(mode!=='mini'));
  window.SukunAdaptiveDockLayout?.schedule?.('r920-dock-presentation');
 }
 function schedule(){if(raf||document.hidden)return;raf=requestAnimationFrame(()=>{raf=0;if(!mounted)mount();else sync();});}
 ['sukun:r698modechange','sukun:r616viewchange','sukun:tabchange','sukun:sessionchange','sukun:currentflowchange','sukun:secretaccesschange','pageshow'].forEach(event=>window.addEventListener(event,schedule,{passive:true}));
 document.addEventListener('visibilitychange',schedule,{passive:true});
 document.addEventListener('click',event=>{if(event.target.closest?.('#mixer [data-ambacctgl],#uiBtn'))requestAnimationFrame(accessibility);},{passive:true});
 function boot(n=0){if(mount())return;if(n<40)setTimeout(()=>boot(n+1),100);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot(),{once:true});else boot();
 window.SukunDockR920=Object.freeze({version:'r921',openAmbience,refresh:mount,snapshot:()=>({version:'r921',mounted,mode:window.SukunDockSize?.get?.()||'mini',transport:'SukunR698Transport',layout:'SukunR699Layout',tefekkurButton:'r730MiniTef',name:$('r921DockName')?.textContent||'',ownSoundsPresent:!!document.querySelector('#mixer [data-ambacc="ozel"]')})});
})();
