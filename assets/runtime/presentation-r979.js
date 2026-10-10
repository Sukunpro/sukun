/* Foreground presentation recovery. No audio, transport, count or reload work.
 * Probes run only at boot/foreground/manual recovery, never on each repetition.
 * DOM rectangles and a delivered RAF are observations, not rendered pixels. */
(()=>{'use strict';
 if(window.SukunPresentationRecovery)return;
 const $=id=>document.getElementById(id),safe=(fn,fallback=null)=>{try{return fn()}catch(_){return fallback}};
 const flags=['r608-opening-active','r610-opening-active','sukun-tefekkur-mode','sukun-focus-mode','r920-practice-on','r920-focus-rest','r920-details-open','r433-dock-hidden','sukun-resume-settling'];
 const tabs=['tab-amb','tab-frq','tab-zkr','tab-rx','tab-ntf'];
 const state={version:'r1042',state:'ready',checks:0,recoveries:0,lastReason:'boot',lastAt:0,lastProbe:null,lastRepair:null,scope:'DOM visibility and observed animation frame; not raster or physical display test'};
 let timer=0,frame=0,fallback=0,generation=0,gestures=0,lastWake=0,notice=null,wasHidden=!!document.hidden,pendingReturn=false,returnGesture=0;
 const at=()=>Date.now(),round=n=>Math.round((Number(n)||0)*10)/10;
 function cancel(){clearTimeout(timer);clearTimeout(fallback);if(frame)cancelAnimationFrame(frame);timer=frame=fallback=0;generation++}
 function rootEvidence(node){
  const empty={connected:false,display:'',visibility:'',opacity:0,width:0,height:0,inViewport:false,blocker:'missing'};
  if(!node?.isConnected)return empty;
  const style=getComputedStyle(node),rect=node.getBoundingClientRect();let blocker=null,opacity=1;
  // Small fixed set of app roots, only at lifecycle boundaries. Parent hiding
  // matters: a child can report display:block under an invisible wrapper.
  for(let p=node;p;p=p.parentElement){const s=p===node?style:getComputedStyle(p);opacity*=Number.isFinite(+s.opacity)?+s.opacity:1;
   if(!blocker){if(p.hidden)blocker='hidden';else if(s.display==='none')blocker='display';else if(['hidden','collapse'].includes(s.visibility))blocker='visibility';else if(+s.opacity===0)blocker='opacity';else if(s.contentVisibility==='hidden')blocker='content-visibility';}
  }
  const width=round(rect.width),height=round(rect.height),inViewport=!blocker&&opacity>.01&&width>0&&height>0&&rect.bottom>0&&rect.right>0&&rect.top<innerHeight&&rect.left<innerWidth;
  return{connected:true,display:style.display,visibility:style.visibility,opacity:round(opacity),width,height,inViewport,blocker:blocker||(!width||!height?'zero-size':null)};
 }
 function probe(reason,frameObserved,delay){
  const body=document.body,curtain=$('acilisPerde'),tef=!!body?.classList.contains('sukun-tefekkur-mode');
  const selected=document.querySelector('.tab.act[data-t]');
  const selectedId=selected?'tab-'+selected.dataset.t:'';
  const activeTab=tabs.includes(selectedId)?$(selectedId):document.querySelector('section[id^="tab-"]:not([hidden])');
  const roots={wrap:rootEvidence(document.querySelector('body > .wrap')),tab:rootEvidence(tef?$('tab-zkr'):activeTab),practice:rootEvidence($('r920Practice')),nav:rootEvidence($('r616BottomNav'))};
  const openingActive=!!(curtain&&!curtain.hidden&&!curtain.classList.contains('bitti'));
  return{at:at(),reason,hidden:!!document.hidden,tef,selectedTab:tabs.includes(activeTab?.id)?activeTab.id:'',readyState:document.readyState,
   viewportWidth:round(innerWidth),viewportHeight:round(innerHeight),scrollX:round(window.scrollX),scrollY:round(window.scrollY),frameObserved,frameDelayMs:delay===null?null:round(delay),
   domSurfaceVisible:tef?(body?.classList.contains('r920-practice-on')?roots.practice.inViewport:roots.tab.inViewport):roots.nav.inViewport||roots.tab.inViewport||roots.wrap.inViewport,
   openingActive,openingPresent:!!curtain,lifecycleHidden:document.documentElement.dataset.r949Hidden==='1',bodyFlags:flags.filter(x=>body?.classList.contains(x)),roots};
 }
 function snapshot(){return JSON.parse(JSON.stringify(state))}
 function notify(){safe(()=>window.dispatchEvent(new CustomEvent('sukun:presentationrecovery',{detail:snapshot()})))}
 function isEnglish(){return /^en\b/i.test(document.documentElement.lang||'')}
 function showNotice(show){
  if(!show){if(notice)notice.hidden=true;return}
  if(!notice){notice=document.createElement('aside');notice.id='r979PresentationNotice';notice.setAttribute('role','status');
   const text=document.createElement('p'),button=document.createElement('button');button.type='button';notice.append(text,button);document.body.append(notice);
   Object.assign(notice.style,{position:'fixed',inset:'auto 12px 18px',zIndex:'2147483000',maxWidth:'480px',margin:'0 auto',padding:'14px',border:'1px solid #c3a06e',borderRadius:'16px',background:'#071d27',color:'#f5e7c9',fontFamily:'system-ui,sans-serif',boxShadow:'0 8px 28px #0008'});
   Object.assign(button.style,{minHeight:'44px',width:'100%',border:'1px solid #c3a06e',borderRadius:'10px',background:'#123d48',color:'inherit',font:'inherit',cursor:'pointer'});
   button.addEventListener('click',()=>schedule('manual',true));
  }
  notice.firstElementChild.textContent=isEnglish()?'The interface could not be verified after returning. Redisplay it without resetting your count.':'Ekrana dönüşte görünüm doğrulanamadı. Sayacı sıfırlamadan yeniden göster.';
  notice.lastElementChild.textContent=isEnglish()?'Redisplay interface':'Görünümü yeniden göster';notice.hidden=false;
 }
 function observeFrame(seq,callback){
  const start=performance.now();let finished=false;
  const done=(observed)=>{if(finished||seq!==generation)return;finished=true;clearTimeout(fallback);fallback=0;if(frame)cancelAnimationFrame(frame);frame=0;
   if(document.hidden){hide();return}callback(observed,observed?Math.max(0,performance.now()-start):null)};
  frame=requestAnimationFrame(()=>done(true));fallback=setTimeout(()=>done(false),800);
 }
 function run(reason,returned,gesture){
  timer=0;if(document.hidden){hide();return}const seq=generation;
  state.state='checking';state.lastReason=reason;state.lastAt=at();
  observeFrame(seq,(observed,delay)=>{
   const before=safe(()=>probe(reason,observed,delay));if(!before){pendingReturn=false;state.state='attention';showNotice(true);notify();return}
   const actions=[],body=document.body,curtain=$('acilisPerde');
   // Only expired opening flags are removed. A live opening is left intact.
   if(!before.openingActive)for(const name of ['r608-opening-active','r610-opening-active'])if(body?.classList.contains(name)){body.classList.remove(name);actions.push('clear-'+name)}
   if(before.tef&&$('tab-zkr')?.hidden){$('tab-zkr').hidden=false;actions.push('show-tefekkur-tab')}
   // A delivered RAF runs before paint. Rebuilding an already visible practice
   // here delays the first foreground frame and duplicates its queued render.
   // Recheck small repairs first; hidden practice on another tab is intentional.
   const surface=actions.length?safe(()=>probe(reason,observed,delay),before):before;
   if(!surface.openingActive&&(!observed||!surface.domSurfaceVisible)){
    const restored=safe(()=>window.SukunPracticeUI?.restorePresentation?.(),false);
    if(restored)actions.push('refresh-practice');
   }
   // Preserve legitimate positions within the reading/settings surface. Only
   // rescue an entirely off-screen focus surface after return, before input.
   const after=safe(()=>probe(reason,observed,delay),before);
   if(returned&&gesture===gestures&&after.tef&&!after.openingActive&&after.roots.practice.connected&&!after.roots.practice.blocker&&!after.roots.practice.inViewport&&!document.querySelector('dialog[open]')){
    const target=$('r920Counter')||$('r920Practice');safe(()=>target.scrollIntoView({block:'center',behavior:'instant'}));actions.push('restore-focus-position');
   }
   observeFrame(seq,(settled,settledDelay)=>{
    pendingReturn=false;state.checks++;state.lastAt=at();state.lastProbe=safe(()=>probe(reason,settled,settledDelay),after);
    const visible=state.lastProbe.domSurfaceVisible||state.lastProbe.openingActive;
    state.state=visible&&settled?(actions.length?'recovered':'ready'):'attention';
    if(actions.length){state.recoveries++;state.lastRepair={at:at(),actions}}
    showNotice(state.state==='attention');notify();
   });
  });
 }
 function schedule(reason,manual=false){
  if(document.hidden){hide();return}
  const time=at();if(!manual&&reason==='focus'&&time-lastWake<1200)return;
  lastWake=time;const returned=pendingReturn||wasHidden||reason==='resume'||reason==='pageshow-persisted'||manual;
  if(returned&&!pendingReturn||manual)returnGesture=gestures;pendingReturn=returned;wasHidden=false;
  cancel();const gesture=returned?returnGesture:gestures;timer=setTimeout(()=>run(reason,returned,gesture),manual?0:120);
 }
 function hide(){wasHidden=true;cancel();state.state='hidden';state.lastReason='hidden';state.lastAt=at();showNotice(false)}
 document.addEventListener('visibilitychange',()=>document.hidden?hide():schedule('visible'),{passive:true});
 document.addEventListener('freeze',hide,{passive:true});document.addEventListener('resume',()=>schedule('resume'),{passive:true});
 addEventListener('pagehide',hide,{passive:true});addEventListener('pageshow',e=>schedule(e.persisted?'pageshow-persisted':'pageshow'),{passive:true});
 addEventListener('focus',()=>schedule('focus'),{passive:true});
 for(const event of ['pointerdown','wheel','keydown'])document.addEventListener(event,()=>{gestures++},{capture:true,passive:true});
 window.SukunPresentationRecovery=Object.freeze({version:'r1042',snapshot,recover:()=>schedule('manual',true)});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule('boot'),{once:true});else schedule('boot');
})();
