/* Read-only saver facts; explicit links use the existing selection command. */
(()=>{'use strict';
const $=id=>document.getElementById(id),en=()=>window.I18N?.lang==='en';
const tr=(a,b)=>en()?b:a;
const allowed=()=>window.SukunSecretPolicy?.unlocked?.()===true;
const items=mode=>typeof ZIKIR!=='undefined'?ZIKIR[mode]?.items||[]:[];
const set=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value};
let root=null,busy=false;
function checkpoint(){
 const s=window.SukunSessionState?.peek?.()||window.SukunSessionState?.snapshot?.();
 if(s&&(s.activeMode!=='berhet'||allowed())&&!s.journeyComplete&&s.phase!=='COMPLETED'&&['esma','berhet'].includes(s.activeMode)&&(s.playing||s.paused||s.preparing||s.journey?.active))
  return {mode:s.activeMode,index:s.activeIndex,kind:s.journeyKind,count:s.count,target:s.target,status:s.phase==='ERROR'?tr('Ses bekleniyor','Audio needs attention'):s.paused||s.journeyPaused?tr('Duraklatıldı','Paused'):tr('Devam ediyor','In progress')};
 for(const [kind,api] of [['28',window.SukunBerhetiyyeSeyir],['99',window.SukunEsma99Seyir]]){
  if(kind==='28'&&!allowed())continue;
  const state=api?.state?.(),d=api?.display?.();
  if(state&&d&&!d.complete&&(state.i>0||state.rep>0))return {mode:kind==='28'?'berhet':'esma',index:d.index,kind,count:d.count,target:d.target,status:tr('Kaldığın yer','Saved progress')};
 }
 return null;
}
function mount(){
 const saver=$('kandil');if(!saver)return false;
 if(root?.isConnected)return true;
 saver.classList.add('r1193Info');root=document.createElement('section');root.id='r1193SaverInfo';
 root.innerHTML='<p id="r1193PalaceState"></p><button type="button" id="r1193SaverActive" class="r1193SaverLink"><small></small><strong></strong><span></span></button><p id="r1193SaverEmpty"></p><div class="r1193SaverNames"><button type="button" id="r1193SaverEsma" class="r1193SaverLink"><small></small><strong></strong><span></span><em></em></button><button type="button" id="r1193SaverBerhet" class="r1193SaverLink"><small></small><strong></strong><span></span><em></em></button></div><blockquote><p id="r1193SaverQuote"></p><cite id="r1193SaverSource"></cite></blockquote>';
 saver.querySelector('.kEsma').after(root);
 for(const button of root.querySelectorAll('button'))button.onclick=()=>load(button);
 return true;
}
function card(id,mode,index,title,meta,kind='single'){
 const b=$(id),it=items(mode)[index];if(!b||!it)return;
 b.dataset.mode=mode;b.dataset.index=index;b.dataset.kind=kind;
 set(b.querySelector('small'),title);set(b.querySelector('strong'),(mode==='esma'?'Yâ ':'')+(it.t||it.oku||it.tr));
 set(b.querySelector('span'),meta||it.m||it.mean||it.isaret||'');
 set(b.querySelector('em'),tr('Zikir çarkına yükle →','Load on the dhikr wheel →'));
}
function render(){
 if(!mount())return;
 const open=allowed(),s=window.SukunSessionState?.peek?.()||{},active=checkpoint(),now=new Date();
 const day=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000);
 set($('r1193PalaceState'),open?tr('Saray kapısı açık','Palace gate open'):tr('Saray kapısı kapalı','Palace gate closed'));
 $('r1193SaverActive').hidden=!active;set($('r1193SaverEmpty'),active?'':tr('Devam eden bir zikir yok.','No dhikr in progress.'));
 if(active)card('r1193SaverActive',active.mode,active.index,active.status,`${active.kind==='single'?'':(active.index+1)+'/'+active.kind+' · '}${active.count} / ${active.target} ${tr('tekrar · Çarka dön','repetitions · Return to wheel')}`,active.kind);
 const ei=s.activeMode==='esma'?s.activeIndex:day%items('esma').length;
 card('r1193SaverEsma','esma',Math.max(0,ei||0),tr('Esmâü’l-Hüsnâ · anlamı','Beautiful Name · meaning'));
 const bi=s.activeMode==='berhet'?s.activeIndex:(window.SukunBerhetiyyeSeyir?.display?.()?.index??day%28);
 $('r1193SaverBerhet').hidden=!open;
 if(open)card('r1193SaverBerhet','berhet',Math.max(0,bi||0),tr('Berhetiyye · uygulama yorumu','Berhetiyye · reflection'));
 // Preserve the app's existing attribution/source labels with its current quote.
 const quote=document.querySelector('#sozKutu .sozMetin')?.textContent,source=document.querySelector('#sozKutu .sozKim')?.textContent,type=document.querySelector('#sozKutu .sozTur')?.textContent;
 set($('r1193SaverQuote'),quote||tr('Kalbin yöneldiği iyilik, küçük bir adımla başlar.','The good your heart turns toward begins with a small step.'));
 set($('r1193SaverSource'),quote?[type,source].filter(Boolean).join(' · '):tr('Sükûn · tefekkür sözü','Sukun · reflection'));
}
async function load(button){
 if(busy||button.hidden)return false;
 const mode=button.dataset.mode,index=Number(button.dataset.index),kind=button.dataset.kind;
 if(!['esma','berhet'].includes(mode)||!Number.isInteger(index)||!items(mode)[index]||mode==='berhet'&&!allowed())return false;
 busy=true;
 try{
  const session=window.SukunSessionState,s=session?.snapshot?.();
  const same=s?.activeMode===mode&&s.activeIndex===index;
  // Returning to the current name is navigation, never a restart or pause.
  if(!same){
   const options={mode,journeyKind:kind};if(kind==='single')options.index=index;
   const result=await session?.command?.('select',options);
   if(!result?.accepted||result?.stale){window.toast?.(tr('İsim yüklenemedi. Oturumunu kontrol et.','Could not load the name. Check the current session.'));return false;}
  }
  window.SukunKandil?.hide?.(true,false);
  document.querySelector('[role="tab"][data-t="zkr"]')?.click();
  window.SukunPracticeUI?.refresh?.();
  requestAnimationFrame(()=>{$('r920Practice')?.scrollIntoView({block:'start',behavior:'auto'});$('r920NameInfo')?.focus?.({preventScroll:true})});
  return true;
 }finally{busy=false;}
}
window.SukunSaverInfo=Object.freeze({render,checkpoint});
const start=()=>{mount();const update=()=>{if(window.SukunKandil?.snapshot?.().on&&!document.hidden)render()};window.SukunSessionState?.subscribe?.(update);window.addEventListener('sukun:secretaccesschange',update);window.addEventListener('sukun:languagechange',update);};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
