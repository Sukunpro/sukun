/* r924: artwork and preference presentation only; never owns playback or counting. */
(()=>{'use strict';
const safe=(fn,fallback=null)=>{try{return fn()}catch{return fallback}};
const normalMode=mode=>mode==='berhet'?'berhet':'esma';
const baseGeometry=Object.freeze({minus:Object.freeze([12,50]),plus:Object.freeze([88,50]),stop:Object.freeze([50,12]),play:Object.freeze([50,88])});
const measuredGeometry={"inci-sema":{"minus":[10,50.5],"plus":[90,50.5],"stop":[50,10.8],"play":[50,88.5]},"zumrut-tesbih":{"minus":[11,49.6],"plus":[89,49.6],"stop":[50,12.2],"play":[50,86.4]},"oniks-sukuneti":{"minus":[11.4,48.9],"plus":[90,48.9],"stop":[50,10.8],"play":[50,86.6]},"kehribar-tesbih":{"minus":[10,49.6],"plus":[90,49.6],"stop":[50,10.8],"play":[50,88.5]}};
for(const g of Object.values(measuredGeometry)){for(const p of Object.values(g))Object.freeze(p);Object.freeze(g)}Object.freeze(measuredGeometry);
const premium=(mode,id,title)=>Object.freeze({mode,id,title,src:`./assets/wheels-r924/${mode==='berhet'?'berhetiyye':'esma'}/${id}.webp`,classic:false,matte:false,geometry:measuredGeometry[id]||baseGeometry});
const classic=(mode,id,title,src,matte=false)=>Object.freeze({mode,id,title,src,classic:true,matte,geometry:baseGeometry});
const catalog=Object.freeze({
 berhet:Object.freeze([
  ['ham-kristal','Ham Kristal'],['faset-kesim','Faset Kesim'],['ametist-yuvarlak','Yuvarlak Ametist'],['ametist-saltanati','Ametist Saltanatı'],['zumrut-tac','Zümrüt Taç'],['safir-ruzgari','Safir Rüzgârı'],['obsidyen-muhur','Obsidyen Mühür'],['bakir-ruzgari','Bakır Rüzgârı'],['yakut-muhur','Yakut Mühür'],['billur-hisar','Billur Hisar'],['lacivert-usturlap','Lacivert Usturlap']
 ].map(([id,title])=>premium('berhet',id,title)).concat([
  classic('berhet','crystal','Klasik · Kristal Taç','./assets/berhetiyye-premium/wheel-alpha-r915.png'),
  classic('berhet','seal','Klasik · Süleyman Mührü','./assets/berhetiyye-premium/wheel-seal-r916.svg'),
  classic('berhet','pearls','Klasik · İnci Halkası','./assets/berhetiyye-premium/wheel-pearls-r916.svg')
 ])),
 esma:Object.freeze([
  ['inci-sema','İnci Semâ'],['zumrut-tesbih','Zümrüt Tesbih'],['oniks-sukuneti','Oniks Sükûneti'],['kehribar-tesbih','Kehribar Tesbih'],['sedef-nuru','Sedef Nuru']
 ].map(([id,title])=>premium('esma',id,title)).concat([
  classic('esma','classic','Klasik · Nur Halkası','./assets/sukun-nur-ring-r757.png',true)
 ]))
});
const storageKey=mode=>'sukun.wheel.r924.'+mode;
const choiceFor=mode=>{const stored=safe(()=>localStorage.getItem(storageKey(mode)));return catalog[mode].some(item=>item.id===stored)?stored:catalog[mode][0].id};
const choices={berhet:choiceFor('berhet'),esma:choiceFor('esma')};
let host=null,mode='',key='',generation=0,cancel=null,pending=false,resolved=null,status='idle',fallback=0,requests=0;
const $=id=>host?.querySelector('#'+id)||null;
const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value};
const setAttr=(node,name,value)=>{if(node&&node.getAttribute(name)!==String(value))node.setAttribute(name,String(value))};
const setHidden=(node,value)=>{if(node&&node.hidden!==value)node.hidden=value};
const current=()=>catalog[mode]?.find(item=>item.id===choices[mode]);
function syncStatus(){
 const selection=current();if(!selection)return;
 const select=$('r920WheelSelect');if(select&&select.value!==selection.id)select.value=selection.id;
 const message=status==='loading'?'Çark yükleniyor…':status==='error'?'Görsel açılamadı; sade nur halkası kullanılıyor.':fallback?'Seçilen görsel açılamadı; klasik çark gösteriliyor.':selection.title+' seçildi.';
 setText($('r924WheelStatus'),message);setHidden($('r924WheelRetry'),status==='loading'||!fallback&&status!=='error');
 for(const button of $('r924WheelGallery')?.querySelectorAll('[data-wheel]')||[])setAttr(button,'aria-pressed',button.dataset.wheel===selection.id);
}
function updateGeometry(item){
 const frame=$('r924WheelFrame');if(!frame)return;
 const geometry=item?.geometry||baseGeometry;
 for(const action of ['minus','plus','stop','play'])for(const [i,axis]of ['x','y'].entries()){
  const prop=`--r924-${action}-${axis}`,value=geometry[action][i]+'%';if(frame.style.getPropertyValue(prop)!==value)frame.style.setProperty(prop,value);
 }
}
function buildOptions(){
 const selection=current(),select=$('r920WheelSelect'),gallery=$('r924WheelGallery');if(!selection||!select||!gallery)return;
 setText($('r924WheelFamily'),mode==='berhet'?'Berhetiyye çarkı':'Esmâ çarkı');
 select.replaceChildren(...catalog[mode].map(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=item.title;return option}));
 gallery.replaceChildren(...catalog[mode].map(item=>{
  const button=document.createElement('button');button.type='button';button.dataset.wheel=item.id;button.setAttribute('aria-label',item.title+' çarkını seç');
  const thumb=document.createElement('img');thumb.src=item.src;thumb.alt='';thumb.loading='lazy';thumb.decoding='async';thumb.setAttribute('aria-hidden','true');
  if(item.matte)thumb.className='r924MatteThumb';
  thumb.onerror=()=>{thumb.style.visibility='hidden'};
  const label=document.createElement('span');label.textContent=item.title;button.append(thumb,label);return button;
 }));syncStatus();
}
function loadImage(src,token){
 requests++;
 return new Promise((resolve,reject)=>{
  const image=new Image();let settled=false;
  const cleanup=()=>{clearTimeout(timer);image.onload=image.onerror=null;if(cancel===abort)cancel=null};
  const finish=(error)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve(src)};
  const abort=()=>{if(settled)return;finish(new Error('cancelled'));image.src=''};
  const timer=setTimeout(()=>finish(new Error('timeout')),8000);cancel=abort;
  image.onerror=()=>finish(new Error('image load failed'));
  image.onload=async()=>{try{if(typeof image.decode==='function')await image.decode();if(token!==generation)return finish(new Error('cancelled'));if(!image.naturalWidth)return finish(new Error('empty image'));finish()}catch(error){finish(error)}};
  image.decoding='async';image.src=src;
 });
}
async function resolveSelection(){
 const selection=current();if(!selection)return;
 cancel?.();const token=++generation;resolved=null;pending=true;status='loading';fallback=0;
 const frame=$('r924WheelFrame'),image=$('r920Wheel');
 if(!frame||!image)return;
 image.removeAttribute('src');image.hidden=true;
 setAttr(frame,'data-wheel-state','loading');setAttr(frame,'data-wheel-matte','0');setAttr(frame,'data-wheel-classic','0');updateGeometry(selection);syncStatus();
 const legacy=catalog[mode].find(item=>item.classic),candidates=selection===legacy?[selection]:[selection,legacy];
 for(let index=0;index<candidates.length;index++){
  const candidate=candidates[index];try{
   await loadImage(candidate.src,token);if(token!==generation||!host?.isConnected)return;
   resolved=candidate;pending=false;status='ready';fallback=index;
   image.src=candidate.src;image.hidden=false;setAttr(frame,'data-wheel-state','ready');setAttr(frame,'data-wheel-matte',candidate.matte?'1':'0');setAttr(frame,'data-wheel-classic',candidate.classic?'1':'0');updateGeometry(candidate);syncStatus();return;
  }catch(error){if(token!==generation)return;}
 }
 if(token!==generation)return;pending=false;status='error';fallback=candidates.length;setAttr(frame,'data-wheel-state','error');syncStatus();
}
function connect(nextHost){
 if(host===nextHost&&host?.isConnected)return;
 cancel?.();generation++;host=nextHost;mode='';key='';pending=false;resolved=null;status='idle';
 const gallery=$('r924WheelGallery');if(gallery)gallery.onclick=event=>{const button=event.target.closest('[data-wheel]');if(button&&gallery.contains(button))choose(mode,button.dataset.wheel)};
 const retry=$('r924WheelRetry');if(retry)retry.onclick=()=>resolveSelection();
}
function render(nextMode){
 if(!host?.isConnected)return;
 const family=normalMode(nextMode),changed=family!==mode;
 mode=family;if(changed)buildOptions();
 const nextKey=mode+':'+choices[mode];if(nextKey!==key){key=nextKey;void resolveSelection()}else syncStatus();
}
function choose(nextMode,id){
 const family=normalMode(nextMode);if(!catalog[family].some(item=>item.id===id))return false;
 choices[family]=id;safe(()=>localStorage.setItem(storageKey(family),id));if(family===mode)render(family);return true;
}
window.SukunWheels=Object.freeze({version:'r924',catalog,connect,render,choose,snapshot:()=>({version:'r924',mode,choice:choices[mode]||null,choices:{...choices},resolved:resolved?.id||null,src:resolved?.src||null,status,fallback,requests,pending})});
})();

/* r925: one compositor rotor, stationary count, touch freezes rotation before click. */
(()=>{'use strict';
 let host,frame,hold=false,keyHold=false,releaseTimer=0;
 let enabled=true;try{enabled=localStorage.getItem('sukun.wheel.motion')!=='0'}catch(e){}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function render(s=window.SukunSessionState?.snapshot?.()){
  if(!frame)return;
  const saving=window.SukunSceneEngine?.snapshot?.().profile==='saving';
  const run=enabled&&!reduced.matches&&!saving&&!document.hidden&&!hold&&!keyHold&&s?.phase==='PLAYING';
  const state=run?'running':'paused';if(frame.dataset.motion!==state)frame.dataset.motion=state;
 }
 function connect(next){if(host===next)return;host=next;frame=host.querySelector('#r924WheelFrame');
  const toggle=host.querySelector('#r925WheelMotion');toggle.checked=enabled;toggle.onchange=()=>{enabled=toggle.checked;try{localStorage.setItem('sukun.wheel.motion',enabled?'1':'0')}catch(e){}render()};
  frame.addEventListener('pointerdown',()=>{clearTimeout(releaseTimer);hold=true;keyHold=false;render()},{capture:true,passive:true});
  const release=()=>{clearTimeout(releaseTimer);releaseTimer=setTimeout(()=>{hold=false;render()},650)};
  document.addEventListener('pointerup',release,{passive:true});document.addEventListener('pointercancel',release,{passive:true});
  frame.addEventListener('focusin',()=>{if(!hold){keyHold=true;render()}});frame.addEventListener('focusout',e=>{if(!frame.contains(e.relatedTarget)){keyHold=false;render()}});
  frame.addEventListener('keydown',()=>{keyHold=true;render()});render();
 }
 document.addEventListener('visibilitychange',()=>render());reduced.addEventListener('change',()=>render());
 addEventListener('sukun:performancechange',()=>render());
 window.SukunWheelMotion=Object.freeze({version:'r925',connect,render,snapshot:()=>({enabled,reduced:reduced.matches,state:frame?.dataset.motion||'none'})});
})();
