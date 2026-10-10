/* r949: the only play gate for single/journey native background leases.
 * r1043: one bounded recovery for an accepted native source paused during
 * the screen-lock transition. Later OS focus interruptions remain held.
 * r1044: recovery belongs to the live caller attempt, not just its retained URL.
 * No heartbeat or automatic play on freeze. Rejections consume the lease. */
(()=>{'use strict';
 if(window.SukunBackgroundAudioOwner)return;
 let lease=null,seq=0,visibility=0,frozen=false,departed=false;
 const START_TIMEOUT=8000,LOCK_RECOVERY_WINDOW=1500,LOCK_RECOVERY_DELAY=120;
 const metrics={claims:0,playAttempts:0,rejections:0,suppressed:0,staleCompletions:0,pauseRecoveries:0,pauseRecoveryFailures:0};
 function snapshot(){const a=lease?.audio;return{version:'r949',revision:'r1044',lease:lease?.id||0,owner:lease?.owner||'',active:!!lease,phase:lease?.phase||'IDLE',blocked:!!lease?.blocked,preparing:!!lease?.pending,hidden:document.hidden,frozen,departed,playing:!!(lease&&!lease.blocked&&a&&!a.paused&&!a.ended&&a.readyState>=2),paused:!!a?.paused,ended:!!a?.ended,readyState:a?.readyState||0,error:lease?.error||'',visibilityEpoch:visibility,lockTransitionAgeMs:lease?.lockTransitionAt==null?null:Math.max(0,Date.now()-lease.lockTransitionAt),lockRecoveryWindowMs:LOCK_RECOVERY_WINDOW,lockRecoveryEligible:canRecover(lease),lockRecoveryPending:!!lease?.recoveryTimer,lockRecoveryAttempted:!!lease?.recoveryUsed,lockRecoveryReason:lease?.recoveryReason||'',...metrics};}
 function emit(reason){window.dispatchEvent(new CustomEvent('sukun:backgroundownerchange',{detail:{...snapshot(),reason}}));}
 function cancelRecovery(l){if(l?.recoveryTimer){clearTimeout(l.recoveryTimer);l.recoveryTimer=0;}}
 function authorityCurrent(l){
  // Journey elements are pooled across words and remain referenced after stop.
  // Transport reclaims the same lease without replacing this caller's guard.
  if(!l||l.owner==='journey'&&!l.authority)return false;
  try{return !l.authority||l.authority.isCurrent()===true;}catch(_){return false;}
 }
 function foreground(){return window.SukunForegroundArbiter?.snapshot?.()||null;}
 function held(l){
  if(window.AudioLife?.userPaused||window.AudioLife?._terminalIntent||l?.audio?._miniDurdu)return true;
  try{
   if(typeof window.SukunTabOwner?.owns==='function'&&!window.SukunTabOwner.owns())return true;
   if(window.SukunAudioSessionRegistry?.aggregateSnapshot?.()?.paused)return true;
   const mic=window.SukunItemRecording?.snapshot?.();
   if(mic?.preparing||['permission','preparing','recording','stopping','saving'].includes(mic?.phase))return true;
   // Terkip/intention also use the native journey element; an old 28/99
   // Stop latch must not hold a newly accepted, unrelated foreground caller.
   if(['journey28','journey99'].includes(l?.foreground?.owner?.type)&&window.SukunJourneyAudioMachine?.intentBlocked?.())return true;
   const fg=foreground(),before=l?.foreground;
   if(fg?.owner&&(!before?.owner||['id','type','identity'].some(k=>fg.owner[k]!==before.owner[k])))return true;
   const types=[...(before?.observed?.spokenOwners||[]),...(before?.owner?[before.owner.type]:[])];
   if((fg?.observed?.spokenOwners||[]).some(type=>!types.includes(type)))return true;
  }catch(_){return true;}
  return false;
 }
 function holdRecovery(a,reason='app-pause',id,authority){
  const l=lease;if(!l||l.audio!==a||id!=null&&(l.id!==id||l.authority!==authority))return false;
  cancelRecovery(l);l.recoveryRetired=true;l.lockTransitionAt=null;l.lockVisibility=-1;l.recoveryReason=reason;return true;
 }
 function rememberPlaying(l){
  if(!l||l.audio.paused||l.audio.ended||l.audio.readyState<2)return;
  l.accepted=true;l.appPauseAt=l.audio._sukunAppPauseAt;l.nativeEpoch=l.audio._sukunLockEpoch;try{l.foreground=foreground()}catch(_){l.foreground=null;}l.confirmedSrc=String(l.audio.src||'');l.confirmedCurrentSrc=String(l.audio.currentSrc||l.audio.src||'');l.confirmedSrcObject=l.audio.srcObject;
 }
 function sameSource(l){return l&&l.confirmedSrc===String(l.audio.src||'')&&l.confirmedCurrentSrc===String(l.audio.currentSrc||l.audio.src||'')&&l.confirmedSrcObject===l.audio.srcObject;}
 function canRecover(l){
  if(!l||lease!==l||!document.hidden||frozen||departed||l.blocked||l.pending||!l.accepted||l.recoveryUsed||l.phase!=='INTERRUPTED'||l.recoveryRetired||!authorityCurrent(l)||held(l))return false;
  const a=l.audio,age=l.lockTransitionAt==null?Infinity:Date.now()-l.lockTransitionAt;
  return l.lockVisibility===visibility&&age>=0&&age<=LOCK_RECOVERY_WINDOW&&sameSource(l)&&a._sukunAppPauseAt===l.appPauseAt&&a._sukunLockEpoch===l.nativeEpoch&&a.paused&&!a.ended&&!a.error&&a.readyState>=2&&!a.muted&&Number(a.volume)>0;
 }
 function scheduleRecovery(l){
  if(!canRecover(l)){if(l)l.recoveryReason=!authorityCurrent(l)||l.recoveryRetired?'retired-caller':held(l)?'user-or-owner-hold':'pause-outside-lock-window';return;}
  if(l.recoveryTimer)return;
  l.recoveryReason='lock-transition-pause';
  l.recoveryTimer=setTimeout(()=>{
   l.recoveryTimer=0;
   if(!canRecover(l)){l.recoveryReason='lock-transition-recovery-cancelled';emit(l.recoveryReason);return;}
   l.recoveryUsed=true;l.recoveryPermit=true;metrics.pauseRecoveries++;l.recoveryReason='lock-transition-recovery-request';
   const task=play(l.id);l.recoveryPermit=false;
   Promise.resolve(task).then(ok=>{
    if(lease!==l)return;l.recoveryReason=ok?'lock-transition-recovered':'lock-transition-recovery-incomplete';if(!ok)metrics.pauseRecoveryFailures++;emit(l.recoveryReason);
   },()=>{if(lease!==l)return;metrics.pauseRecoveryFailures++;l.recoveryReason='lock-transition-recovery-rejected';emit(l.recoveryReason);});
  },LOCK_RECOVERY_DELAY);
 }
 function detach(l){cancelRecovery(l);l?.cancelPlay?.();for(const [name,fn]of l?.events||[])l.audio.removeEventListener(name,fn);}
 function claim(owner,a,source,authority){
  if(lease?.owner===owner&&lease.audio===a&&lease.source===source){
   if(authority&&lease.authority!==authority){
    cancelRecovery(lease);lease.authority=authority;lease.accepted=false;lease.recoveryRetired=false;lease.lockTransitionAt=null;lease.lockVisibility=-1;
   }
   return lease.id;
  }
  const old=lease;detach(old);lease=null;
  if(old?.audio&&old.audio!==a){try{old.audio.pause()}catch(_){}}
  const l=lease={id:++seq,owner,audio:a,source,authority:authority||null,recoveryRetired:false,visibility,phase:'PREPARING',attempted:false,blocked:false,error:'',pending:null,events:[],accepted:false,lockTransitionAt:null,lockVisibility:-1,recoveryTimer:0,recoveryUsed:false,recoveryPermit:false,recoveryReason:'',pauseFromPlaying:false,pauseAt:null};metrics.claims++;
  for(const name of ['playing','pause','ended','error']){
   const fn=()=>{if(lease!==l)return;
    if(name==='playing'&&!l.blocked){cancelRecovery(l);l.phase='PLAYING';if(authorityCurrent(l))l.recoveryRetired=false;rememberPlaying(l);if(!l.audio.paused&&!l.audio.ended)l.finishPlay?.(true);}
    if(name==='pause'&&!l.pending&&!l.blocked&&l.phase!=='PAUSED'){l.pauseFromPlaying=l.phase==='PLAYING';l.pauseAt=Date.now();l.phase='INTERRUPTED';scheduleRecovery(l);}
    if(name==='ended'){cancelRecovery(l);l.phase='ENDED';}
    if(name==='error'){cancelRecovery(l);l.phase='BLOCKED';l.blocked=true;l.error='MediaError';l.finishPlay?.(false,Object.assign(new Error('Native media error'),{name:'MediaError'}));}
    emit(name);
   };
   l.events.push([name,fn]);a.addEventListener(name,fn,{passive:true});
  }
  emit('claim');return l.id;
 }
 function allowed(id){return !!(lease?.id===id&&!lease.blocked&&(!document.hidden||!lease.attempted||lease.pending||lease.recoveryPermit||!lease.audio.paused&&!lease.audio.ended));}
 function play(id){
  const l=lease;if(!l||l.id!==id)return Promise.resolve(false);
  if(l.pending)return l.pending;
  if(!allowed(id)){metrics.suppressed++;return Promise.resolve(false);}
  if(!l.audio.paused&&!l.audio.ended&&l.audio.readyState>=2){l.phase='PLAYING';rememberPlaying(l);return Promise.resolve(true);}
  l.attempted=true;l.phase='PREPARING';metrics.playAttempts++;
  let resolve,reject,done=false,timer=0;
  const task=new Promise((yes,no)=>{resolve=yes;reject=no});
  const finish=(ok,error)=>{
   if(done)return;done=true;clearTimeout(timer);l.finishPlay=l.cancelPlay=null;
   if(l.pending===task)l.pending=null;
   if(lease!==l){metrics.staleCompletions++;resolve(false);return;}
   if(error){l.blocked=true;l.phase='BLOCKED';l.error=String(error.name||'Error');metrics.rejections++;try{l.audio.pause()}catch(_){};reject(error);}
   else if(ok&&!l.audio.paused&&!l.audio.ended){l.phase='PLAYING';l.error='';rememberPlaying(l);resolve(true);}
   else {if(!l.blocked)l.phase='INTERRUPTED';resolve(false);}
   emit('play-settled');
  };
  l.pending=task;l.finishPlay=finish;l.cancelPlay=()=>finish(false);
  timer=setTimeout(()=>finish(false,Object.assign(new Error('Native playback did not start'),{name:'PlaybackStartTimeout'})),START_TIMEOUT);
  let result;try{result=l.audio.play()}catch(e){result=Promise.reject(e)}
  Promise.resolve(result).then(()=>{if(done){metrics.staleCompletions++;return;}finish(true)},error=>{if(done){metrics.staleCompletions++;return;}finish(false,error)});
  emit('play-request');return task;
 }
 function userPause(id){if(lease?.id!==id||lease.blocked)return false;cancelRecovery(lease);lease.cancelPlay?.();lease.phase='PAUSED';lease.attempted=false;lease.recoveryReason='user-pause';emit('user-pause');return true;}
 function release(owner,reason='release'){if(!lease||owner&&lease.owner!==owner)return false;detach(lease);lease=null;emit(reason);return true;}
 document.addEventListener('visibilitychange',()=>{
  visibility++;const l=lease;if(l)cancelRecovery(l);
  if(document.hidden&&l&&!l.blocked&&!frozen&&!departed&&l.accepted&&!l.recoveryRetired&&authorityCurrent(l)&&sameSource(l)&&!held(l)){
   // A native pause can arrive just before visibilitychange. Only this
   // adjacent previously-playing pause joins the same lock transition.
   const adjacentPause=l.phase==='INTERRUPTED'&&l.pauseFromPlaying&&l.pauseAt!=null&&Date.now()-l.pauseAt<=250;
   if(!l.audio.ended&&(!l.audio.paused||adjacentPause)){l.lockTransitionAt=Date.now();l.lockVisibility=visibility;l.recoveryUsed=false;if(l.audio.paused)scheduleRecovery(l);}
  }
  if(l&&!l.blocked&&!l.audio.paused&&!l.audio.ended){l.visibility=visibility;emit('visibility-continue');}else if(!document.hidden){release(null,'visible-handoff');}
 },{passive:true});
 document.addEventListener('freeze',()=>{frozen=true;cancelRecovery(lease);emit('freeze');},{passive:true});
 document.addEventListener('resume',()=>{frozen=false;emit('resume');},{passive:true});
 window.addEventListener('pagehide',()=>{departed=true;cancelRecovery(lease);if(lease){lease.lockTransitionAt=null;lease.lockVisibility=-1;lease.recoveryReason='pagehide-hold';}emit('pagehide');},{passive:true});
 window.addEventListener('pageshow',()=>{departed=false;emit('pageshow');},{passive:true});
 window.SukunBackgroundAudioOwner=Object.freeze({version:'r949',claim,allowed,play,userPause,holdRecovery,release,snapshot});
})();
