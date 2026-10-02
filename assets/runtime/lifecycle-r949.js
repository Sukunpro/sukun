/* Local resource/lifecycle evidence. No URL queries, text, recordings or keys.
 * Weak references never keep AudioNodes alive; counts are not native GPU/RAM. */
(()=>{'use strict';
 const boot=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),key='sukun.lifecycle.r949';
 let previous=null,storageAvailable=true,frozen=false,freezeEvents=0,resumeEvents=0,pagehideSeen=false;
 const nav=performance.getEntriesByType('navigation')[0]?.type||'unknown';
 try{previous=JSON.parse(sessionStorage.getItem(key)||'null');}catch(e){storageAvailable=false;}
 const wasDiscarded=typeof document.wasDiscarded==='boolean'?document.wasDiscarded:null;
 const unexpectedReload=wasDiscarded===true?'DISCARDED':previous&&!previous.pagehideSeen&&previous.active?'POSSIBLE_UNCLOSED_ACTIVE_SESSION':'NOT_OBSERVED';
 function checkpoint(){try{sessionStorage.setItem(key,JSON.stringify({boot,at:Date.now(),pagehideSeen,hidden:document.hidden,active:['PLAYING','PREPARING','INTERRUPTED'].includes(window.SukunSessionState?.peek?.()?.phase)}));}catch(e){storageAvailable=false;}}
 // A visible document is runnable even if a browser restores it without a
 // matching resume event. Never leave the global animation gate latched.
 function hidden(){if(!document.hidden)frozen=false;document.documentElement.dataset.r949Hidden=document.hidden||frozen?'1':'0';checkpoint();}
 document.addEventListener('visibilitychange',hidden,{passive:true});
 document.addEventListener('freeze',()=>{frozen=true;freezeEvents++;document.documentElement.dataset.r949Hidden='1';checkpoint();},{passive:true});
 document.addEventListener('resume',()=>{frozen=false;resumeEvents++;hidden();},{passive:true});
 addEventListener('pagehide',()=>{pagehideSeen=true;checkpoint();},{passive:true});
 addEventListener('pageshow',()=>{pagehideSeen=false;hidden();},{passive:true});
 // Session changes already exist; no new polling or unload handler.
 let lastSave=0;addEventListener('sukun:sessionchange',e=>{if(Date.now()-lastSave>15000||e.detail.phase!=='PLAYING'){lastSave=Date.now();checkpoint();}},{passive:true});
 const refs=[],maxNodes=4096;let created=0,dropped=0;
 const supported=typeof WeakRef==='function'&&!!window.AudioContext;
 if(supported){
  for(const method of ['createOscillator','createBufferSource','createGain','createBiquadFilter','createStereoPanner','createPanner','createDelay','createWaveShaper','createConvolver','createAnalyser','createDynamicsCompressor','createChannelMerger','createChannelSplitter','createMediaElementSource','createMediaStreamSource','createMediaStreamDestination']){
   const proto=typeof AudioContext.prototype[method]==='function'?AudioContext.prototype:null;if(!proto)continue;
   const original=proto[method];proto[method]=function(...args){const node=original.apply(this,args);created++;refs.push(new WeakRef(node));if(refs.length>maxNodes){const alive=refs.filter(r=>r.deref());refs.splice(0,refs.length,...alive);if(refs.length>maxNodes){dropped+=refs.length-maxNodes;refs.splice(0,refs.length-maxNodes);}}return node;};
  }
 }
 function snapshot(){
  let reachable=0;if(supported)for(const ref of refs)if(ref.deref())reachable++;
  const canvases=[...document.querySelectorAll('canvas')];
  return{version:'r949',bootId:boot,navigationType:nav,wasDiscarded,discardSupported:wasDiscarded!==null,unexpectedReload,previousBoot:previous?.boot||null,previousAgeMs:previous?Math.max(0,Date.now()-previous.at):null,storageAvailable,freezeEvents,resumeEvents,frozen,
   scene:window.SukunSceneEngine?.snapshot?.()?.residency||null,
   canvas:{count:canvases.length,pixelBackingEstimateBytes:canvases.reduce((n,c)=>n+c.width*c.height*4,0),scope:'DOM canvases only; RGBA lower estimate; not GPU memory'},
   audioNodes:{supported,created: supported?created:null,reachableWrappers:supported?reachable:null,tracked:refs.length,dropped,limit:maxNodes,scope:'weak JS wrappers for live AudioContext factories; not native node/connection count'},
   cadence:window.SukunCadence?.snapshot?.()||null,scheduler:window.CIZ?.snapshot?.()||null,backgroundOwner:window.SukunBackgroundAudioOwner?.snapshot?.()||null};
 }
 hidden();window.SukunLifecycleR949=Object.freeze({version:'r949',snapshot});
})();
