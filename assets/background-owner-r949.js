/* r949: the only play gate for single/journey native background leases.
 * No heartbeat, retry timer, or automatic play on pause/freeze. A rejection
 * consumes this source/visibility lease. Async completions are epoch checked. */
(()=>{'use strict';
 if(window.SukunBackgroundAudioOwner)return;
 let lease=null,seq=0,visibility=0,frozen=false;
 const metrics={claims:0,playAttempts:0,rejections:0,suppressed:0,staleCompletions:0};
 function snapshot(){const a=lease?.audio;return{version:'r949',lease:lease?.id||0,owner:lease?.owner||'',active:!!lease,phase:lease?.phase||'IDLE',blocked:!!lease?.blocked,preparing:!!lease?.pending,hidden:document.hidden,frozen,playing:!!(lease&&!lease.blocked&&a&&!a.paused&&!a.ended&&a.readyState>=2),paused:!!a?.paused,ended:!!a?.ended,readyState:a?.readyState||0,error:lease?.error||'',visibilityEpoch:visibility,...metrics};}
 function emit(reason){window.dispatchEvent(new CustomEvent('sukun:backgroundownerchange',{detail:{...snapshot(),reason}}));}
 function detach(l){for(const [name,fn]of l?.events||[])l.audio.removeEventListener(name,fn);}
 function claim(owner,a,source){
  if(lease?.owner===owner&&lease.audio===a&&lease.source===source)return lease.id;
  const old=lease;detach(old);lease=null;
  if(old?.audio&&old.audio!==a){try{old.audio.pause()}catch(_){}}
  const l=lease={id:++seq,owner,audio:a,source,visibility,phase:'PREPARING',attempted:false,blocked:false,error:'',pending:null,events:[]};metrics.claims++;
  for(const name of ['playing','pause','ended','error']){
   const fn=()=>{if(lease!==l)return;if(name==='playing'&&!l.blocked)l.phase='PLAYING';if(name==='pause'&&!l.pending&&!l.blocked&&l.phase!=='PAUSED')l.phase='INTERRUPTED';if(name==='ended')l.phase='ENDED';if(name==='error'){l.phase='BLOCKED';l.blocked=true;l.error='MediaError';}emit(name);};
   l.events.push([name,fn]);a.addEventListener(name,fn,{passive:true});
  }
  emit('claim');return l.id;
 }
 function allowed(id){return !!(lease?.id===id&&!lease.blocked&&(!document.hidden||!lease.attempted||lease.pending||!lease.audio.paused&&!lease.audio.ended));}
 function play(id){
  const l=lease;if(!l||l.id!==id)return Promise.resolve(false);
  if(l.pending)return l.pending;
  if(!allowed(id)){metrics.suppressed++;return Promise.resolve(false);}
  if(!l.audio.paused&&!l.audio.ended&&l.audio.readyState>=2){l.phase='PLAYING';return Promise.resolve(true);}
  l.attempted=true;l.phase='PREPARING';metrics.playAttempts++;
  let result;try{result=l.audio.play()}catch(e){result=Promise.reject(e)}
  const task=Promise.resolve(result).then(()=>{
   if(lease!==l){metrics.staleCompletions++;return false;}
   if(l.audio.paused||l.audio.ended){l.phase='INTERRUPTED';return false;}
   l.phase='PLAYING';l.error='';return true;
  },error=>{
   if(lease!==l){metrics.staleCompletions++;return false;}
   l.blocked=true;l.phase='BLOCKED';l.error=String(error?.name||'Error');metrics.rejections++;throw error;
  }).finally(()=>{if(lease===l){l.pending=null;emit('play-settled');}});
  l.pending=task;emit('play-request');return task;
 }
 function userPause(id){if(lease?.id!==id||lease.blocked)return false;lease.phase='PAUSED';lease.attempted=false;emit('user-pause');return true;}
 function release(owner,reason='release'){if(!lease||owner&&lease.owner!==owner)return false;detach(lease);lease=null;emit(reason);return true;}
 document.addEventListener('visibilitychange',()=>{visibility++;if(lease&&!lease.blocked&&!lease.audio.paused&&!lease.audio.ended){lease.visibility=visibility;emit('visibility-continue');}else if(!document.hidden){release(null,'visible-handoff');}},{passive:true});
 document.addEventListener('freeze',()=>{frozen=true;emit('freeze');},{passive:true});
 document.addEventListener('resume',()=>{frozen=false;emit('resume');},{passive:true});
 window.SukunBackgroundAudioOwner=Object.freeze({version:'r949',claim,allowed,play,userPause,release,snapshot});
})();
