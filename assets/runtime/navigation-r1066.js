/* r1066: deliberate navigation reveals its target after layout settles.
 * A later touch, wheel or key cancels the request. Native pan owns scrolling. */
(()=>{
 'use strict';
 const w=window;let sequence=0,pending=false,last=null;
 function reveal(target,options={}){
  if(!target?.isConnected)return false;
  const token=++sequence,policy=w.SukunViewportPolicy,ticket=policy?.captureNavigation?.();
  const reason=options.reason||'explicit-navigation';pending=true;
  const finish=(ok,why)=>{if(token!==sequence)return;pending=false;last={reason,result:why,ok,target:target.id||target.tagName,at:Date.now()};};
  const current=()=>token===sequence&&!document.hidden&&target.isConnected&&
   (!ticket||policy?.navigationCurrent?.(ticket,{includeScroll:false})!==false)&&options.isCurrent?.()!==false;
  const run=()=>{
   if(!current()){finish(false,'superseded-or-user-input');return;}
   const gate=w.SukunInteractionGateR732;
   if(gate?.active?.()){gate.whenIdle(run);return;}
   if(target.closest?.('[hidden],[inert]')||!target.getClientRects?.().length){finish(false,'target-hidden');return;}
   const opt={behavior:options.behavior||'instant',block:options.block||'start',inline:'nearest'};
   const ok=policy?.scrollTo?policy.scrollTo(target,opt,reason):(target.scrollIntoView(opt),true);
   if(ok&&options.focus){const focus=options.focus===true?target:options.focus;if(focus?.isConnected)focus.focus?.({preventScroll:true});}
   finish(ok!==false,ok===false?'native-input':'revealed');
  };
  // One layout paint and one instant reveal, unaffected by CSS smooth scrolling.
  requestAnimationFrame(run);return true;
 }
 function tabTarget(tab){return document.getElementById('tab-'+tab?.dataset?.t);}
 function revealTab(tab){
  if(!tab||document.body.classList.contains('sukun-tefekkur-mode'))return false;
  const target=tabTarget(tab);if(!target)return false;
  return reveal(target,{reason:'tab-selection',isCurrent:()=>tab.classList.contains('act')&&!target.hidden});
 }
 document.addEventListener('click',e=>{
  // Internal tab changes during practice/reader setup keep their own position.
  if(!e.isTrusted||e.defaultPrevented)return;
  const tab=e.target?.closest?.('.tab[data-t]');if(tab)revealTab(tab);
 },{passive:true});
 document.addEventListener('keydown',e=>{
  if(!e.isTrusted||!['ArrowRight','ArrowLeft'].includes(e.key)||!e.target?.closest?.('.tab[data-t]'))return;
  revealTab(document.querySelector('.tabs .tab.act[data-t]'));
 },{passive:true});
 w.SukunNavigationR1066=Object.freeze({version:'r1066',reveal,snapshot:()=>({version:'r1066',sequence,pending,last:last?{...last}:null})});
})();
