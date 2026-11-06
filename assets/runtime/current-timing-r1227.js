/* Read-only current-name associations. All assignments come from SukunTimingInfo. */
(()=>{'use strict';
if(window.SukunCurrentTiming)return;
const w=window,d=document,$=id=>d.getElementById(id);
const tr=(a,b)=>w.I18N?.lang==='en'?b:a;
const same=(a,b)=>String(a||'').normalize('NFC').trim()===String(b||'').normalize('NFC').trim();
function matches(state,data,item,unlocked){
 if(!state||!data||!item)return [];
 const rows=[],name=item.t||item.oku||item.tr;
 if(state.activeMode==='esma'){
  if(data.hour?.names?.some(n=>same(n,name)))rows.push({key:'hour',label:tr('Saatin zikri','Dhikr of the hour'),source:tr('Geleneksel gezegen saati eşlemesi','Traditional planetary-hour association')+' · '+data.hour.label+(data.hour.note?' · '+data.hour.note:'')});
  const names=data.day?.allNames||data.day?.names;
  if(names?.some(n=>same(n,name)))rows.push({key:'day',label:data.day.allNames?tr('Günün zikri','Dhikr of the day'):tr('Günün seçkisi','Today’s selection'),source:data.day.label+' · '+tr('Geleneksel haftanın günü eşlemesi; farklı eşlemeler de vardır.','Traditional weekday association; other associations exist.')});
  if(data.vakit?.esma&&same(data.vakit.esma,name))rows.push({key:'vakit',label:tr('Vaktin zikri','Dhikr of this time'),source:data.vakit.label+' · '+tr('SÜKÛN vakit rehberi','SUKUN time guide')});
 }else if(state.activeMode==='berhet'&&unlocked&&data.period?.index===state.activeIndex){
  const m=data.period.item?.may;
  rows.push({key:'period',label:tr('Dönemin zikri','Dhikr of the period'),source:(m?`${m[1]}.${m[0]}–${m[3]}.${m[2]} · `:'')+tr('Sabit geleneksel Berhetiyye takvimi; gerçek Ay konumu hesabı değildir.','Fixed traditional Berhetiyye calendar; not an astronomical Moon-position calculation.')});
 }
 return rows;
}
let queued=false,rowsNow=[],rotation=0,shownUntil=0,nextReveal=0,lastSignature='',revealTimer=0;
function reveal(now=Date.now(),manual=false){
 if(!rowsNow.length)return;
 const host=$('r1227CurrentTiming'),caption=$('r1227TimingCaption');if(!host||!caption)return;
 const row=rowsNow[rotation%rowsNow.length];caption.textContent=manual?rowsNow.map(r=>r.label).join(' · '):row.label;if(!manual)rotation++;
 shownUntil=now+4000;host.dataset.reveal='true';
 clearTimeout(revealTimer);revealTimer=setTimeout(()=>{host.dataset.reveal='false';},4000);
}
function render(now=new Date()){
 queued=false;const anchor=$('r920NameInfo');if(!anchor)return;
 let host=$('r1227CurrentTiming');
 if(!host){
  host=d.createElement('div');host.id='r1227CurrentTiming';host.hidden=true;
  const button=d.createElement('button');button.type='button';button.id='r1227TimingSeal';button.className='r1227TimingBadge';
  const icon=d.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');
  const path=d.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M12 2 15 5 19 5 19 9 22 12 19 15 19 19 15 19 12 22 9 19 5 19 5 15 2 12 5 9 5 5 9 5Z M12 7V12L15 14');icon.append(path);button.append(icon);
  const caption=d.createElement('span');caption.id='r1227TimingCaption';caption.setAttribute('aria-hidden','true');host.append(button,caption);anchor.after(host);
  for(const event of ['pointerenter','focus','click'])button.addEventListener(event,()=>{reveal(Date.now(),true);});
 }
 const state=w.SukunSessionState?.peek?.()||w.SukunSessionState?.snapshot?.();
 const item=typeof ZIKIR!=='undefined'?ZIKIR[state?.activeMode]?.items?.[state?.activeIndex]:null;
 let rows=[];try{rows=matches(state,w.SukunTimingInfo?.snapshot?.(now),item,w.SukunSecretPolicy?.unlocked?.()===true);}catch(_){}
 host.hidden=!rows.length;rowsNow=rows;
 const signature=JSON.stringify([state?.activeMode,state?.activeIndex,rows]);
 if(lastSignature!==signature){
  lastSignature=signature;rotation=0;shownUntil=0;nextReveal=now.getTime()+60000;host.dataset.reveal='false';
  const button=$('r1227TimingSeal'),description=rows.map(r=>r.label+' · '+r.source).join(' | ');
  button.title=description;button.setAttribute('aria-label',description);host.dataset.matches=rows.map(r=>r.key).join(' ');
  if(rows.length&&!d.hidden){const rect=host.getBoundingClientRect();if(rect.bottom>0&&rect.top<w.innerHeight&&rect.width>0)reveal(now.getTime());}
 }
 if(now.getTime()>=shownUntil)host.dataset.reveal='false';
 if(rows.length&&now.getTime()>=nextReveal){
  nextReveal=now.getTime()+60000;
  const rect=host.getBoundingClientRect();
  if(!d.hidden&&rect.bottom>0&&rect.top<w.innerHeight&&rect.width>0)reveal(now.getTime());
 }
}
function queue(){if(!queued){queued=true;requestAnimationFrame(()=>render());}}
function start(){
 render();w.SukunSessionState?.subscribe?.(queue);
 const tab=$('tab-zkr');if(tab)new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.id==='r920Practice'||n.querySelector?.('#r920NameInfo')))))queue();}).observe(tab,{childList:true,subtree:true});
 ['sukun:playbackchange','sukun:nowplayingchange','sukun:currentflowchange','sukun:journey-advance','sukun:secretaccesschange','sukun:languagechange','pageshow','focus'].forEach(e=>w.addEventListener(e,queue));
 d.addEventListener('visibilitychange',()=>{if(!d.hidden)queue();});
 // Also covers native location edits and clock/date changes without creating a timing owner.
 setInterval(()=>{if(!d.hidden)queue();},30000);
}
w.SukunCurrentTiming=Object.freeze({render,matches});
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
