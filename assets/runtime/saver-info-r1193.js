/* Read-only saver facts; explicit links use the existing selection command. */
(()=>{'use strict';
const $=id=>document.getElementById(id),en=()=>window.I18N?.lang==='en';
const tr=(a,b)=>en()?b:a;
const allowed=()=>window.SukunSecretPolicy?.unlocked?.()===true;
const items=mode=>typeof ZIKIR!=='undefined'?ZIKIR[mode]?.items||[]:[];
const set=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value};
let root=null,busy=false,lastJourney=null,lastCycle=null;
const CONTENT_KEY='sukun.kandil.content';
// Retain the detailed layout for existing users until they choose otherwise.
const contentValue=value=>value==='simple'?'simple':'detailed';
function savedContent(){try{return contentValue(localStorage.getItem(CONTENT_KEY));}catch(_){return 'detailed';}}
let contentMode=savedContent();
function contentUI(){
 const saver=$('kandil');if(!saver||!root)return;
 saver.dataset.saverContent=contentMode;
 const group=$('r1213SaverContent');if(group)group.setAttribute('aria-label',tr('Ekran koruyucu içeriği','Screensaver content'));
 for(const [id,value,label] of [['r1213SaverSimple','simple',tr('Sade','Simple')],['r1213SaverDetailed','detailed',tr('Bilgili','Detailed')]]){
  const button=$(id);if(!button)continue;
  const selected=contentMode===value;button.setAttribute('aria-pressed',String(selected));
  button.dataset.sukunSurface=selected?'emerald':'sapphire';set(button,label+(selected?' ✓':''));
 }
}
function setContent(value){
 if(!['simple','detailed'].includes(value))return false;
 contentMode=value;try{localStorage.setItem(CONTENT_KEY,value);}catch(_){}
 contentUI();if(root)root.scrollTop=0;return true;
}
function targetDescription(active){
 const description=window.SukunTargetInfo?.describe?.({activeMode:active.mode,activeIndex:active.index,journeyKind:active.kind,smartSession:active.smartSession});
 return description?.label||tr('Hedef','Target');
}
function progressInfo(active){
 const count=Math.max(0,Number(active?.count)||0),target=Math.max(0,Number(active?.target)||0);
 return {count,target,value:Math.min(count,target),percent:target>0?Math.min(100,Math.round(100*count/target)):null};
}
function simpleInfo(active){
 const host=$('r1213SaverReflection'),it=active&&items(active.mode)[active.index];if(!host)return;
 set(host.querySelector('small'),active?tr('Tefekkür','Reflection'):tr('Sükûn · tefekkür sözü','Sukun · reflection'));
 set(host.querySelector('p'),it?.m||it?.mean||it?.isaret||it?.serh||tr('Kalbin yöneldiği iyilik, küçük bir adımla başlar.','The good your heart turns toward begins with a small step.'));
}

function checkpoint(){
 const s=window.SukunSessionState?.peek?.()||window.SukunSessionState?.snapshot?.();
 if(s&&(s.activeMode!=='berhet'||allowed())&&!s.journeyComplete&&s.phase!=='COMPLETED'&&['esma','berhet'].includes(s.activeMode)&&(s.playing||s.paused||s.preparing||s.journey?.active))
  return {mode:s.activeMode,index:s.activeIndex,kind:s.journeyKind,count:s.count,target:s.target,smartSession:s.smartSession,status:s.phase==='ERROR'?tr('Ses bekleniyor','Audio needs attention'):s.paused||s.journeyPaused?tr('Duraklatıldı','Paused'):tr('Devam ediyor','In progress')};
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
 root.innerHTML='<div id="r1213SaverContent" role="group"><button type="button" id="r1213SaverSimple" aria-pressed="false" data-sukun-surface="sapphire">Sade</button><button type="button" id="r1213SaverDetailed" aria-pressed="true" data-sukun-surface="emerald">Bilgili ✓</button></div><p id="r1193PalaceState"></p><button type="button" id="r1193SaverActive" class="r1193SaverLink"><small></small><strong></strong><span></span><b id="r1213SaverCount"></b><progress id="r1213SaverProgress" max="1" value="0"></progress><em></em></button><p id="r1193SaverEmpty"></p><p id="r1194JourneyMeta"></p><p id="r1194Transition" role="status" aria-live="polite"></p><div class="r1194Neighbors" id="r1194Neighbors"><span id="r1194Previous"></span><span id="r1194Next"></span></div><div class="r1194Timing" id="r1194Timing"></div><div class="r1193SaverNames"><button type="button" id="r1193SaverEsma" class="r1193SaverLink"><small></small><strong></strong><span></span><em></em></button><button type="button" id="r1193SaverBerhet" class="r1193SaverLink"><small></small><strong></strong><span></span><em></em></button></div><div id="r1213SaverReflection"><small></small><p></p></div><blockquote><p id="r1193SaverQuote"></p><cite id="r1193SaverSource"></cite></blockquote>';
 saver.querySelector('.kEsma').after(root);
 for(const button of root.querySelectorAll('.r1193SaverLink'))button.onclick=()=>load(button);
 $('r1213SaverSimple').onclick=event=>{event.stopPropagation();setContent('simple')};
 $('r1213SaverDetailed').onclick=event=>{event.stopPropagation();setContent('detailed')};
 contentUI();
 return true;
}
function card(id,mode,index,title,meta,kind='single'){
 const b=$(id),it=items(mode)[index];if(!b||!it)return;
 b.dataset.mode=mode;b.dataset.index=index;b.dataset.kind=kind;
 set(b.querySelector('small'),title);set(b.querySelector('strong'),(mode==='esma'?'Yâ ':'')+(it.t||it.oku||it.tr));
 set(b.querySelector('span'),meta||it.m||it.mean||it.isaret||'');
 b.title=[it.m||it.mean||it.isaret,mode==='berhet'?it.serh:'',mode==='berhet'?tr('Berhetiyye · geleneksel şerh ve tefekkür yorumu','Berhetiyye · traditional commentary and reflection'):tr('Esmâü’l-Hüsnâ','Beautiful Names')].filter(Boolean).join(' · ');
 set(b.querySelector('em'),tr('Zikir çarkına yükle →','Load on the dhikr wheel →'));
}
function name(mode,index){const it=items(mode)[index];return it?(mode==='esma'?'Yâ ':'')+(it.t||it.oku||it.tr):'';}
function journeyInfo(active){
 const row=$('r1194Neighbors'),meta=$('r1194JourneyMeta'),transition=$('r1194Transition');
 if(!active){row.hidden=true;set(meta,'');set(transition,'');lastJourney=null;lastCycle=null;return;}
 const journey=['28','99'].includes(active.kind),idx=active.index,total=Number(active.kind);
 row.hidden=!journey;row.style.display=journey?'':'none';
 if(journey){
  set($('r1194Previous'),tr('Önceki: ','Previous: ')+(idx>0?name(active.mode,idx-1):tr('İlk isim','First name')));
  set($('r1194Next'),tr('Sıradaki: ','Next: ')+(idx+1<total?name(active.mode,idx+1):tr('Seyir tamamlanacak','Journey completion')));
  set(meta,`${idx+1} / ${total} · ${tr('Tamamlanan isim','Names passed')}: ${idx} · ${tr('Bu isimde devir','Cycles for this name')}: ${active.count>=active.target?1:0} · ${active.count} / ${active.target}`);
 }else{
  const z=window.currentZikirState?.snapshot?.()||{},cycles=Math.max(0,Number(z.devir)||0);
  set(meta,tr('Tamamlanan devir: ','Completed cycles: ')+cycles);
 }
 const key=active.mode+':'+active.kind+':'+idx;
 if(lastJourney&&lastJourney.key!==key&&lastJourney.kind===active.kind&&lastJourney.mode===active.mode){
  set(transition,`${lastJourney.name} → ${name(active.mode,idx)}`);transition.dataset.pulse=String(transition.dataset.pulse==='1'?'2':'1');
 }else if(!lastJourney||lastJourney.key!==key){set(transition,tr('Şimdi: ','Now: ')+name(active.mode,idx));transition.dataset.pulse='0';}
 if(!journey){const z=window.currentZikirState?.snapshot?.()||{},cycle=Number(z.devir)||0;if(lastCycle!==null&&cycle>lastCycle){set(transition,tr('Yeni devir · ','New cycle · ')+name(active.mode,idx));transition.dataset.pulse=String(transition.dataset.pulse==='1'?'2':'1');}lastCycle=cycle;}
 lastJourney={key,kind:active.kind,mode:active.mode,name:name(active.mode,idx)};
}
function meanings(names){return names.map(n=>{const it=items('esma').find(x=>x.t===n);return 'Yâ '+n+(it?.m?' — '+it.m:'')}).join(' · ');}
function timingInfo(open,now){
 const host=$('r1194Timing'),data=window.SukunTimingInfo?.snapshot?.(now);if(!host||!data)return;
 const rows=[];
 if(data.vakit)rows.push(['vakit',tr('Vaktin zikri','Dhikr of this time')+' · '+data.vakit.label+(data.vakit.name?' · '+data.vakit.name:''),data.vakit.meaning+(data.vakit.esma?' · '+meanings([data.vakit.esma]):'')+' · '+tr('Sükûn vakit rehberi','Sukun time guide')]);
 else rows.push(['vakit',tr('Vaktin zikri','Dhikr of this time'),tr('Vakit ve saat eşlemesi için uygulamada konumunu seç.','Choose your location in the app to show time-based names.')]);
 if(data.hour){const h=data.hour,span=[h.start,h.end].map(x=>new Date(x).toLocaleTimeString(en()?'en-GB':'tr-TR',{hour:'2-digit',minute:'2-digit'})).join('–');rows.push(['hour',tr('Saatin esmâsı','Names of the hour')+' · '+h.label+' · '+h.names.map(x=>'Yâ '+x).join(' / '),meanings(h.names)+' · '+span+' · '+tr('Geleneksel saat eşlemesi','Traditional hour association')+(h.note?' · '+h.note:'')]);}
 rows.push(['day',tr('Günün esmâsı','Names of the day')+' · '+data.day.label+' · '+data.day.names.map(x=>'Yâ '+x).join(' / '),meanings(data.day.names)+' · '+tr('Geleneksel haftalık eşlemeden seçki','Selection from traditional weekday associations')]);
 if(open&&data.period){const it=data.period.item,m=it.may;rows.push(['period',tr('Ay / dönem zikri','Month / period dhikr')+' · '+it.tr,[it.serh,it.mean,it.menzil,`${m[1]}.${m[0]}–${m[3]}.${m[2]}`,tr('Sabit geleneksel takvim; gerçek Ay konumu hesabı değildir.','Fixed traditional calendar; not an astronomical Moon-position calculation.')].filter(Boolean).join(' · ')]);}
 const keys=new Set(rows.map(x=>x[0]));for(const child of [...host.children])if(!keys.has(child.dataset.key))child.remove();
 for(const [key,title,description] of rows){let detail=[...host.children].find(x=>x.dataset.key===key);if(!detail){detail=document.createElement('details');detail.className='r1194Fact';detail.dataset.key=key;detail.append(document.createElement('summary'),document.createElement('p'));host.append(detail);}set(detail.querySelector('summary'),title);detail.querySelector('summary').title=description;set(detail.querySelector('p'),description);}
}
function render(){
 if(!mount())return;
 const open=allowed(),s=window.SukunSessionState?.peek?.()||{},active=checkpoint(),now=new Date();
 journeyInfo(active);timingInfo(open,now);contentUI();simpleInfo(active);
 const day=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000);
 set($('r1193PalaceState'),open?tr('Saray kapısı açık','Palace gate open'):tr('Saray kapısı kapalı','Palace gate closed'));
 $('r1193SaverActive').hidden=!active;set($('r1193SaverEmpty'),active?'':tr('Devam eden bir zikir yok.','No dhikr in progress.'));
 if(active){
  const progress=progressInfo(active),journey=['28','99'].includes(active.kind)?`${tr('Seyir','Journey')} ${active.index+1}/${active.kind} · `:'';
  card('r1193SaverActive',active.mode,active.index,active.status,`${journey}${targetDescription(active)}${progress.target>0?' '+progress.target:''}`,active.kind);
  set($('r1213SaverCount'),progress.target>0?`${progress.count} / ${progress.target}`:String(progress.count));
  const bar=$('r1213SaverProgress');bar.hidden=progress.target<=0;bar.max=progress.target||1;bar.value=progress.value;
  bar.setAttribute('aria-label',tr('Zikir ilerlemesi','Dhikr progress'));bar.setAttribute('aria-valuetext',`${progress.count} / ${progress.target}`);
  set($('r1193SaverActive').querySelector('em'),tr('Çarka dön →','Return to wheel →'));
 }
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
window.SukunSaverInfo=Object.freeze({render,checkpoint,content:()=>contentMode,setContent});
const start=()=>{mount();const update=()=>{if(window.SukunKandil?.snapshot?.().on&&!document.hidden)render()};window.SukunSessionState?.subscribe?.(update);window.addEventListener('sukun:secretaccesschange',update);window.addEventListener('sukun:languagechange',update);window.addEventListener('storage',event=>{if(event.key===CONTENT_KEY){contentMode=contentValue(event.newValue);contentUI();}});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
