/* r945: one paged visual chooser for the existing scene authority.
 * Native clicks only; no drag/pointer interception, timers or observers.
 * Four scene images at a time, created only while the chooser is open. */
(()=>{'use strict';
 if(window.SukunScenePicker)return;
 // r955: deploys may lack the optional thumbnail directory. Fall back once
 // to the existing scene image; never retry a broken URL in a loop.
 function loadPreview(image,fallback,scene){
  const sources=[...new Set([scene.thumbnail,scene.asset].filter(x=>typeof x==='string'&&x.trim()))];
  let next=0;
  const loadNext=()=>{
   if(next>=sources.length){image.hidden=true;fallback.hidden=false;return}
   image.hidden=false;fallback.hidden=true;image.src=sources[next++];
  };
  image.onerror=loadNext;
  image.onload=()=>{image.hidden=false;fallback.hidden=true};
  loadNext();
 }
 const $=id=>document.getElementById(id),size=4;
 const text=(node,value)=>{value=String(value??'');if(node&&node.textContent!==value)node.textContent=value};
 const attr=(node,key,value)=>{value=String(value);if(node&&node.getAttribute(key)!==value)node.setAttribute(key,value)};
 const engine=()=>window.SukunSceneEngine;
 const mode=()=>window.SukunSessionState?.snapshot?.().activeMode==='berhet'?'berhet':'esma';
 const catalog=()=>mode()==='berhet'?(engine()?.berhetScenes||[]):(engine()?.esmaScenes||[]).map((scene,index)=>({...scene,ordinal:index+1,name:scene.group,thumbnail:scene.lite}));
 const state=()=>engine()?.snapshot?.()||{};
 const choice=()=>mode()==='berhet'?state().scene:state().esmaChoice;
 let picker=null,page=0,raf=0,opened=false,lastChoice='',listKey='',sourceSelect=null,renderedMode='';
 const nativeSelects=new WeakSet();
 function updateNativeOptions(){
  const family=mode(),source=$(family==='berhet'?'r920SceneSelect':'r923EsmaSceneSelect'),all=catalog();if(!source||!all.length)return;
  sourceSelect=source;
  for(const native of (family==='berhet'?['r920SceneSelect','r829SceneSel','r916SceneChoice']:[]).map($).filter(Boolean)){
   if(nativeSelects.has(native))continue;
   const frag=document.createDocumentFragment();
   const auto=document.createElement('option');auto.value='auto';auto.textContent='İsme göre otomatik';frag.append(auto);
   for(const scene of all){const o=document.createElement('option');o.value=scene.id;o.textContent=(scene.ordinal?scene.ordinal+'. '+scene.name+' · ':'')+scene.title;frag.append(o)}
   native.replaceChildren(frag);native.value=state().scene||'auto';nativeSelects.add(native);
  }
  const parent=$(family==='berhet'?'r920BerhetOptions':'r923EsmaOptions'),buttonId=family==='berhet'?'r945OpenScenes':'r956OpenEsmaScenes';if(parent&&!$(buttonId)){
   const button=document.createElement('button');button.type='button';button.id=buttonId;button.textContent='Sahneleri görerek seç';button.setAttribute('aria-controls','r945ScenePicker');
   button.addEventListener('click',()=>{
    if(window.SukunWheelQuickControls?.snapshot?.().openKind!=='scene')$('r932QuickScene')?.click();
    render();const title=$('r945SceneHeading');title?.focus({preventScroll:true});picker?.scrollIntoView({block:'start',behavior:'auto'});
   });parent.append(button);
  }
 }
 function make(){
  const host=$('r932QuickPicker');if(!host)return false;
  if(picker?.isConnected)return true;
  picker=document.createElement('section');picker.id='r945ScenePicker';picker.hidden=true;picker.setAttribute('aria-labelledby','r945SceneHeading');
  picker.innerHTML='<div class="r945SceneHead"><h3 id="r945SceneHeading" tabindex="-1">Süleyman (A.S.) sahneleri</h3><button id="r945SceneClose" type="button" aria-label="Sahne seçimini kapat">Kapat</button></div><button id="r945SceneAuto" type="button" aria-pressed="false"><strong>İsme göre otomatik</strong><small>İsim değiştikçe ona ait sahneye geç</small></button><p id="r945SceneSelection" role="status" aria-live="polite"></p><div id="r945SceneGrid" role="group" aria-label="Sahne önizlemeleri"></div><div class="r945ScenePages"><button id="r945ScenePrev" type="button" aria-label="Önceki sahne sayfası">‹ Önceki</button><span id="r945ScenePage" aria-live="polite"></span><button id="r945SceneNext" type="button" aria-label="Sonraki sahne sayfası">Sonraki ›</button></div>';
  host.append(picker);
  $('r945SceneClose').onclick=()=>{$('r932QuickClose')?.click();render()};
  $('r945SceneAuto').onclick=()=>choose('auto');
  $('r945ScenePrev').onclick=()=>{if(page>0){page--;renderCards()}};
  $('r945SceneNext').onclick=()=>{if((page+1)*size<catalog().length){page++;renderCards()}};
  $('r945SceneGrid').addEventListener('click',event=>{const button=event.target.closest('button[data-scene]');if(button&&event.currentTarget.contains(button))choose(button.dataset.scene)});
  return true;
 }
 function choose(id){
  const same=choice()===id;
  const accepted=mode()==='berhet'?engine()?.setScene?.(id):engine()?.setEsmaScene?.(id);if(!accepted)return false;
  if(same&&state().sceneLoad==='error')engine()?.retry?.();
  if(sourceSelect)sourceSelect.value=id;
  window.SukunPracticeUI?.refresh?.();window.SukunWheelQuickControls?.render?.();
  // Stay open for comparison; the source name/count/tempo are never changed.
  updateSelection();return true;
 }
 function clearCards(){
  const grid=$('r945SceneGrid');if(!grid)return;
  for(const img of grid.querySelectorAll('img')){img.onload=img.onerror=null;img.removeAttribute('src')}
  grid.replaceChildren();listKey='';
 }
 function renderCards(){
  const all=catalog(),pages=Math.max(1,Math.ceil(all.length/size));page=Math.max(0,Math.min(page,pages-1));
  const grid=$('r945SceneGrid'),visible=all.slice(page*size,(page+1)*size),key=visible.map(x=>x.id).join('|');
  if(key!==listKey){
   clearCards();const fragment=document.createDocumentFragment();
   for(const scene of visible){
    const b=document.createElement('button');b.type='button';b.className='r945SceneCard';b.dataset.scene=scene.id;
    const image=document.createElement('img');image.alt='';image.decoding='async';image.loading='eager';image.width=180;image.height=160;image.draggable=false;
    const label=document.createElement('strong');label.textContent=scene.title;
    const name=document.createElement('small');name.textContent=scene.ordinal?scene.ordinal+'. '+scene.name:scene.name;
    const fallback=document.createElement('span');fallback.className='r945SceneFallback';fallback.textContent='Önizleme yüklenemedi';fallback.hidden=true;
    b.append(image,fallback,label,name);fragment.append(b);loadPreview(image,fallback,scene);
   }
   grid.append(fragment);listKey=key;
  }
  const previous=$('r945ScenePrev'),next=$('r945SceneNext');
  if(previous.disabled!==(page===0))previous.disabled=page===0;if(next.disabled!==(page===pages-1))next.disabled=page===pages-1;
  text($('r945ScenePage'),`${page+1} / ${pages}`);updateSelection();
 }
 function updateSelection(){
  if(!picker)return;const snapshot=state(),selectedChoice=choice()||'auto',all=catalog(),selected=all.find(x=>x.id===selectedChoice);
  attr($('r945SceneAuto'),'aria-pressed',selectedChoice==='auto');
  for(const button of $('r945SceneGrid').children)attr(button,'aria-pressed',button.dataset.scene===selectedChoice);
  const active=mode()==='berhet'?all.find(x=>x.ordinal===Number(snapshot.activeIndex)+1):snapshot.esmaScene;
  const title=selectedChoice==='auto'?'Otomatik'+(active?' · '+active.title:''):selected?.title||'Sabit sahne';
  const status=snapshot.sceneLoad==='error'?'Görsel açılamadı. Yeniden denemek için seçime dokun.':snapshot.sceneLoad==='loading'?'Sahne yükleniyor…':title;
  text($('r945SceneSelection'),status);lastChoice=selectedChoice;
 }
 function render(){
  raf=0;updateNativeOptions();if(!make())return;
  const quick=window.SukunWheelQuickControls?.snapshot?.(),visible=quick?.openKind==='scene'&&!$('r932QuickPicker').hidden&&!$('r932QuickPicker').closest('[hidden]');
  if(picker.hidden===visible)picker.hidden=!visible;
  const host=$('r932QuickPicker');if(host.classList.contains('r945VisualScenes')!==visible)host.classList.toggle('r945VisualScenes',visible);
  if(!visible){if(opened)clearCards();opened=false;return}
  if(renderedMode!==mode()){clearCards();opened=false;renderedMode=mode()}
  text($('r945SceneHeading'),mode()==='berhet'?'Süleyman (A.S.) sahneleri':'Esmâ arka planları');
  if(!opened){const index=catalog().findIndex(scene=>scene.id===(choice()||'auto'));page=index<0?(mode()==='berhet'?Math.floor(Math.max(0,Number(state().activeIndex)||0)/size):Math.floor(Math.max(0,catalog().findIndex(scene=>scene.id===state().esmaScene?.id))/size)):Math.floor(index/size);opened=true;$('r945SceneHeading')?.focus({preventScroll:true})}
  renderCards();
 }
 function queue(){if(document.hidden)return;if(!raf)raf=requestAnimationFrame(render)}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;clearCards();}else queue();},{passive:true});
 ['DOMContentLoaded','pageshow','sukun:scenechange','sukun:sessionchange','sukun:tefekkurchange','sukun:secretaccesschange','sukun:domhydrate'].forEach(name=>addEventListener(name,queue,{passive:true}));
 document.addEventListener('click',event=>{if(event.target.closest('#r932QuickScene,#r932QuickWheel,#r932QuickClose,#r938PanelToggle'))render()},{passive:true});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened)queue()},{passive:true,capture:true});
 window.SukunScenePicker=Object.freeze({version:'r956',refresh:queue,snapshot:()=>({mode:mode(),open:opened,page:page+1,pageSize:size,count:catalog().length,choice:lastChoice,renderedCards:$('r945SceneGrid')?.children.length||0})});
 queue();
})();
