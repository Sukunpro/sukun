/* Foreground presentation recovery. No audio, transport, count or reload work.
 * Probes run only at boot/foreground/manual recovery, never on each repetition.
 * DOM rectangles and a delivered RAF are observations, not rendered pixels. */
(()=>{'use strict';
 if(window.SukunPresentationRecovery)return;
 const $=id=>document.getElementById(id),safe=(fn,fallback=null)=>{try{return fn()}catch(_){return fallback}};
 const flags=['r608-opening-active','r610-opening-active','sukun-tefekkur-mode','sukun-focus-mode','r920-practice-on','r920-focus-rest','r920-details-open','r433-dock-hidden','sukun-resume-settling'];
 const tabs=['tab-amb','tab-frq','tab-zkr','tab-rx','tab-ntf'];
 const state={version:'r1108',state:'ready',checks:0,recoveries:0,lastReason:'boot',lastContext:'startup',lastAt:0,lastProbe:null,lastRepair:null,scope:'DOM visibility and observed animation frame; not raster or physical display test'};
 let timer=0,frame=0,fallback=0,generation=0,gestures=0,lastWake=0,notice=null,wasHidden=false,pendingReturn=false,pendingManual=false,returnGesture=0,seenForeground=!document.hidden,noticeContext='startup';
 let noticeTimer=0,noticeResize=null,noticeMutations=null,noticeFocus=null;
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
 function placeNotice(){
  if(!notice||notice.hidden||document.hidden)return;
  const v=window.visualViewport,top=(v?.offsetTop||0)+12,bottom=(v?.offsetTop||0)+(v?.height||innerHeight)-12;
  const width=Math.max(1,Math.min(480,(v?.width||innerWidth)-24)),left=(v?.offsetLeft||0)+((v?.width||innerWidth)-width)/2;
  // Protect the rendered player, its hidden-mode restore control and navigation.
  // In very short viewports the player also keeps stacking priority over the notice.
  const obstacles=['r170Now','r433DockPeek','r616BottomNav'].map($).filter(e=>e&&rootEvidence(e).inViewport&&getComputedStyle(e).pointerEvents!=='none');
  let ranges=[[top,bottom]],z=11999;
  for(const e of obstacles){
   const r=e.getBoundingClientRect(),s=getComputedStyle(e),layer=parseInt(s.zIndex,10);if(Number.isFinite(layer)&&layer>0)z=Math.min(z,layer-1);
   if(r.right<=left||r.left>=left+width)continue;
   const a=r.top-10,b=r.bottom+10,next=[];
   for(const [lo,hi] of ranges){if(b<=lo||a>=hi)next.push([lo,hi]);else{if(a>lo)next.push([lo,Math.min(a,hi)]);if(b<hi)next.push([Math.max(b,lo),hi]);}}
   ranges=next;
  }
  const range=ranges.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0],room=range?range[1]-range[0]:0;
  // Keep both actions usable, with scrolling if only a compact free strip remains.
  // No free strip: draw below the player and pass background pointer events through.
  const usable=room>=72,limit=Math.max(1,usable?room:bottom-top);
  Object.assign(notice.style,{inset:'auto',left:left+'px',right:'auto',top:(usable?range[0]:top)+'px',bottom:'auto',width:width+'px',maxWidth:'none',maxHeight:limit+'px',zIndex:String(z)});
 }
 function queueNoticePlacement(){
  if(!notice||notice.hidden||document.hidden||noticeTimer)return;
  // A warning produced by a missing RAF must not depend on another RAF to move.
  noticeTimer=setTimeout(()=>{noticeTimer=0;safe(placeNotice)},0);
 }
 function watchNotice(){
  if(noticeResize||noticeMutations)return;
  const nodes=['r170Now','r433DockPeek','r616BottomNav'].map($).filter(Boolean);
  if(typeof ResizeObserver==='function'){noticeResize=new ResizeObserver(queueNoticePlacement);for(const e of [notice,...nodes])safe(()=>noticeResize.observe(e));}
  if(typeof MutationObserver==='function'){noticeMutations=new MutationObserver(queueNoticePlacement);for(const e of [document.documentElement,document.body,...nodes])safe(()=>noticeMutations.observe(e,{attributes:true,attributeFilter:['class','style','hidden']}));}
 }
 function stopNoticeWatch(){
  clearTimeout(noticeTimer);noticeTimer=0;safe(()=>noticeResize?.disconnect());safe(()=>noticeMutations?.disconnect());noticeResize=noticeMutations=null;
 }
 function restoreNoticeFocus(){
  // A successful probe can hide the warning too. Keep keyboard focus out of
  // that hidden subtree, without stealing focus the user moved elsewhere.
  if(document.hidden||!safe(()=>notice?.contains(document.activeElement),false))return;
  const candidates=[noticeFocus,$('r588Play'),$('r433DockPeek'),document.querySelector('.tab.act[data-t]')];
  for(const target of candidates){
   if(!target?.isConnected||target.disabled||typeof target.focus!=='function'||safe(()=>rootEvidence(target).blocker,'unverified'))continue;
   safe(()=>target.focus({preventScroll:true}));if(document.activeElement===target)return;
  }
 }
 function dismissNotice(){showNotice(false)}
 function localizeNotice(){
  if(!notice)return;
  const lead=noticeContext==='return'?(isEnglish()?'The interface could not be verified after returning.':'Ekrana dönüşte görünüm doğrulanamadı.'):noticeContext==='startup'?(isEnglish()?'The interface could not be verified during startup.':'İlk açılışta görünüm doğrulanamadı.'):(isEnglish()?'The interface could not be verified.':'Görünüm doğrulanamadı.');
  notice.firstElementChild.textContent=lead+(isEnglish()?' Redisplay it without resetting your count.':' Sayacı sıfırlamadan yeniden göster.');
  notice.lastElementChild.textContent=isEnglish()?'Redisplay interface':'Görünümü yeniden göster';
  const close=notice.children[1],label=isEnglish()?'Dismiss interface notice':'Görünüm uyarısını kapat';close.setAttribute('aria-label',label);close.title=label;
  safe(placeNotice);
 }
 function showNotice(show){
  if(!show){restoreNoticeFocus();if(notice)notice.hidden=true;stopNoticeWatch();return}
  noticeContext=state.lastContext;
  if(!notice||notice.hidden)noticeFocus=document.activeElement;
  if(!notice){notice=document.createElement('aside');notice.id='r979PresentationNotice';notice.dataset.i18nOwned='r979';notice.setAttribute('role','status');
   const text=document.createElement('p'),close=document.createElement('button'),button=document.createElement('button');button.type=close.type='button';close.id='r979PresentationNoticeDismiss';close.textContent='×';notice.append(text,close,button);document.body.append(notice);
   Object.assign(notice.style,{position:'fixed',inset:'auto',zIndex:'11999',boxSizing:'border-box',margin:'0',padding:'14px',border:'1px solid #c3a06e',borderRadius:'16px',background:'#071d27',color:'#f5e7c9',fontFamily:'system-ui,sans-serif',boxShadow:'0 8px 28px #0008',overflow:'auto',pointerEvents:'none'});
   Object.assign(text.style,{margin:'0 42px 10px 0'});
   Object.assign(button.style,{minHeight:'44px',width:'100%',border:'1px solid #c3a06e',borderRadius:'10px',background:'#123d48',color:'inherit',font:'inherit',cursor:'pointer',pointerEvents:'auto'});
   Object.assign(close.style,{position:'absolute',top:'8px',right:'8px',width:'44px',minHeight:'44px',border:'1px solid #c3a06e',borderRadius:'10px',background:'#123d48',color:'inherit',font:'24px system-ui,sans-serif',cursor:'pointer',pointerEvents:'auto'});
   button.addEventListener('click',()=>schedule('manual',true));
   close.addEventListener('click',dismissNotice);
   notice.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented){e.preventDefault();e.stopPropagation?.();dismissNotice();}});
  }
  localizeNotice();notice.hidden=false;safe(placeNotice);watchNotice();
 }
 function observeFrame(seq,callback){
  const start=performance.now();let finished=false;
  const done=(observed)=>{if(finished||seq!==generation)return;finished=true;clearTimeout(fallback);fallback=0;if(frame)cancelAnimationFrame(frame);frame=0;
   if(document.hidden){hide();return}callback(observed,observed?Math.max(0,performance.now()-start):null)};
  frame=requestAnimationFrame(()=>done(true));fallback=setTimeout(()=>done(false),800);
 }
 function run(reason,returned,gesture,context,manual){
  timer=0;if(document.hidden){hide();return}const seq=generation;
  state.state='checking';state.lastReason=reason;state.lastContext=context;state.lastAt=at();
  observeFrame(seq,(observed,delay)=>{
   const before=safe(()=>probe(reason,observed,delay));if(!before){pendingReturn=returned;pendingManual=manual;state.state='attention';showNotice(true);notify();return}
   const actions=[],body=document.body,curtain=$('acilisPerde');
   // Only expired opening flags are removed. A live opening is left intact.
   if(!before.openingActive)for(const name of ['r608-opening-active','r610-opening-active'])if(body?.classList.contains(name)){body.classList.remove(name);actions.push('clear-'+name)}
   if(before.tef&&$('tab-zkr')?.hidden){$('tab-zkr').hidden=false;actions.push('show-tefekkur-tab')}
   // A delivered RAF runs before paint. Rebuilding an already visible practice
   // here delays the first foreground frame and duplicates its queued render.
   // Recheck small repairs first; hidden practice on another tab is intentional.
   const surface=actions.length?safe(()=>probe(reason,observed,delay),before):before;
   // Startup may be busy without delivering a RAF in 800 ms. A visible DOM
   // alone is not proof of paint, but a missed startup frame is not evidence
   // of a failed lock/foreground return and must not rebuild a healthy view.
   const frameRequired=returned||manual;
   if(!surface.openingActive&&((frameRequired&&!observed)||!surface.domSurfaceVisible)){
    const restored=safe(()=>window.SukunPracticeUI?.restorePresentation?.(),false);
    if(restored)actions.push('refresh-practice');
   }
   // Preserve legitimate positions within the reading/settings surface. Only
   // rescue an entirely off-screen focus surface after return, before input.
   const after=safe(()=>probe(reason,observed,delay),before);
   if((returned||manual)&&gesture===gestures&&after.tef&&!after.openingActive&&after.roots.practice.connected&&!after.roots.practice.blocker&&!after.roots.practice.inViewport&&!document.querySelector('dialog[open]')){
    const target=$('r920Counter')||$('r920Practice');safe(()=>target.scrollIntoView({block:'center',behavior:'instant'}));actions.push('restore-focus-position');
   }
   observeFrame(seq,(settled,settledDelay)=>{
    state.checks++;state.lastAt=at();state.lastProbe=safe(()=>probe(reason,settled,settledDelay),after);
    const visible=state.lastProbe.domSurfaceVisible||state.lastProbe.openingActive;
    state.state=visible?(settled?(actions.length?'recovered':'ready'):frameRequired?'attention':'unverified'):'attention';
    // A later ordinary focus event must not dilute an unresolved return or
    // explicit redisplay request into startup's frame-only exemption.
    pendingReturn=returned&&state.state==='attention';pendingManual=manual&&state.state==='attention';
    if(actions.length){state.recoveries++;state.lastRepair={at:at(),actions}}
    showNotice(state.state==='attention');notify();
   });
  });
 }
 function schedule(reason,manual=false){
  if(document.hidden){hide();return}
  const time=at();if(!manual&&reason==='focus'&&time-lastWake<1200)return;
  lastWake=time;const returned=pendingReturn||seenForeground&&(wasHidden||reason==='resume'||reason==='pageshow-persisted'),requestedManual=manual||pendingManual;
  const context=manual?'manual':returned?'return':requestedManual?'manual':state.checks===0?'startup':'foreground';seenForeground=true;
  if(returned&&!pendingReturn||manual)returnGesture=gestures;pendingReturn=returned;pendingManual=requestedManual;wasHidden=false;
  cancel();const gesture=returned||requestedManual?returnGesture:gestures;timer=setTimeout(()=>run(reason,returned,gesture,context,requestedManual),manual?0:120);
 }
 function hide(){wasHidden=seenForeground;cancel();state.state='hidden';state.lastReason='hidden';state.lastAt=at();showNotice(false)}
 document.addEventListener('visibilitychange',()=>document.hidden?hide():schedule('visible'),{passive:true});
 document.addEventListener('freeze',hide,{passive:true});document.addEventListener('resume',()=>schedule('resume'),{passive:true});
 addEventListener('pagehide',hide,{passive:true});addEventListener('pageshow',e=>schedule(e.persisted?'pageshow-persisted':'pageshow'),{passive:true});
 addEventListener('focus',()=>schedule('focus'),{passive:true});
 // Labels belong to this notice; a language change must not recover, reveal
 // or dismiss it. The app updates html.lang before publishing this event.
 addEventListener('sukun:languagechange',localizeNotice,{passive:true});
 for(const event of ['resize','sukun:r698modechange','sukun:miniflowglasschange','sukun:r616viewchange'])addEventListener(event,queueNoticePlacement,{passive:true});
 window.visualViewport?.addEventListener?.('resize',queueNoticePlacement,{passive:true});window.visualViewport?.addEventListener?.('scroll',queueNoticePlacement,{passive:true});
 for(const event of ['pointerdown','wheel','keydown'])document.addEventListener(event,()=>{gestures++},{capture:true,passive:true});
 window.SukunPresentationRecovery=Object.freeze({version:'r1108',snapshot,recover:()=>schedule('manual',true)});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule('boot'),{once:true});else schedule('boot');
})();
