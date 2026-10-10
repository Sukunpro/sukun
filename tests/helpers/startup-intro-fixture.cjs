'use strict';
const vm=require('node:vm');
function hub(){return{listeners:new Map(),addEventListener(t,fn){if(!this.listeners.has(t))this.listeners.set(t,new Set());this.listeners.get(t).add(fn);},removeEventListener(t,fn){this.listeners.get(t)?.delete(fn);},dispatchEvent(e){for(const fn of [...this.listeners.get(e.type)||[]])fn(e);return true;}};}
function fire(target,type,extra={}){target.dispatchEvent({type,isTrusted:true,...extra});}
function createFixture(code,clock,options={}){
 let now=options.now??0,next=0;const jobs=new Map(),frames=new Map(),contexts=[],root=hub(),document=hub(),window=hub(),reads=[];
 root.dataset={started:'0'};root.hidden=false;document.hidden=!!options.hidden;
 document.getElementById=()=>options.noRoot?null:root;document.querySelectorAll=selector=>selector==='audio,video'?options.media||[]:options.dialogs||[];
 window.getComputedStyle=node=>node===root?{display:root.hidden?'none':'grid',visibility:'visible',opacity:'1',...options.rootCSS}:{display:'block',visibility:'visible',opacity:'1',...node.styleData};
 if(options.raf){window.requestAnimationFrame=fn=>{frames.set(++next,fn);return next;};window.cancelAnimationFrame=id=>frames.delete(id);}
 function param(){return{value:1,schedule:[],cancelScheduledValues(t){this.schedule.push(['cancel',t]);},setValueAtTime(v,t){this.schedule.push(['set',v,t]);},linearRampToValueAtTime(v,t){this.schedule.push(['linear',v,t]);},exponentialRampToValueAtTime(v,t){this.schedule.push(['exponential',v,t]);}};}
 class AC{
  constructor(){if(options.throwConstruct)throw Error('unsupported');this.state=options.state||'running';this.currentTime=10;this.destination={};this.oscillators=[];this.gains=[];this.closeCalls=0;this.resumeCalls=0;Object.assign(this,hub());contexts.push(this);this.pendingResume=new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});}
  createGain(){const g={gain:param(),connections:[],disconnected:false,connect(dest){this.connections.push(dest);},disconnect(){this.disconnected=true;}};this.gains.push(g);return g;}
  createOscillator(){if(options.failOscillatorAt===this.oscillators.length+1)throw Error('graph failure');const osc={frequency:param(),starts:[],stops:[],disconnected:false,connect(){},disconnect(){this.disconnected=true;},start(t){this.starts.push(t);this.startedAt=now;},stop(t){this.stops.push(t);}};this.oscillators.push(osc);if(options.onCreateOscillator)options.onCreateOscillator(this.oscillators.length);return osc;}
  close(){this.closeCalls++;if(options.closeThrow)throw Error('close blocked');if(options.closeReject)return Promise.reject(Error('close rejected'));this.state='closed';return Promise.resolve();}
  resume(){this.resumeCalls++;if(options.resumeMode==='throw')throw Error('resume blocked');if(options.resumeMode==='reject')return Promise.reject(Error('autoplay denied'));if(options.resumeMode==='resolve'){this.state='running';return Promise.resolve();}if(options.resumeMode==='resolve-suspended')return Promise.resolve();return this.pendingResume;}
 }
 window.matchMedia=()=>{if(options.mediaQueryThrows)throw Error('unknown preference');return{matches:!!options.reduced};};window.AudioContext=options.noAudio?undefined:AC;
 window.AudioLife={busy:()=>options.busy??false};window.SukunSessionState={snapshot:()=>({phase:options.phase||'IDLE'})};window.SukunTickSound={isRecording:()=>options.tickRecording??false};window.SukunPhysicalRecordingBusyR696=()=>options.recording??false;
 window.SukunAudioSessionRegistry={aggregateSnapshot:()=>options.aggregate||{paused:false,providerIds:[],mixCaptured:false}};
 window.SukunTabOwner={snapshot:()=>{if(options.ownerAPIThrows)throw Error('owner unknown');return options.ownerState||{owned:false,pending:false,blocked:false,maintenance:false,retiring:false};},acquire(){throw Error('unexpected acquire');}};
 if(options.missingAPI)delete window[options.missingAPI];
 if(options.apiThrow)window.AudioLife.busy=()=>{throw Error('unknown state');};
 const ctx={window,document,performance:{now:()=>now},Promise,Number,Event:class{constructor(type){this.type=type;this.isTrusted=false;}},
  localStorage:{getItem(key){reads.push(key);if(options.storageThrows)throw Error('storage denied');return options.owner||null;},setItem(){throw Error('unexpected write');},removeItem(){throw Error('unexpected delete');}},
  setTimeout:(fn,ms)=>{jobs.set(++next,{fn,when:now+ms});return next;},clearTimeout:id=>jobs.delete(id)};
 for(const key of ['caches','indexedDB','fetch','ac','gongSentez'])Object.defineProperty(ctx,key,{get(){throw Error('unexpected shared API: '+key);}});
 vm.createContext(ctx);
 function runClock(){vm.runInContext(clock,ctx);}
 function run(){vm.runInContext(code,ctx);}
 function nextJob(until){return[...jobs].filter(([,v])=>v.when<=until).sort((a,b)=>a[1].when-b[1].when||a[0]-b[0])[0];}
 function tick(ms){const until=now+ms;for(;;){const found=nextJob(until);if(!found)break;now=Math.max(now,found[1].when);jobs.delete(found[0]);found[1].fn();}now=until;}
 async function flush(){for(let i=0;i<8;i++)await Promise.resolve();}
 async function advance(ms){await flush();const until=now+ms;for(;;){const found=nextJob(until);if(!found)break;now=Math.max(now,found[1].when);jobs.delete(found[0]);found[1].fn();await flush();}now=until;await flush();}
 function paint(at){if(at!==undefined)now=at;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}
 function resolveResume(state='running',emit=true){const c=contexts[0];c.state=state;c.resolve();if(emit)fire(c,'statechange');}
 function rejectResume(){contexts[0].reject(Error('autoplay denied'));}
 return{root,document,window,contexts,jobs,frames,reads,options,run,runClock,tick,advance,flush,paint,resolveResume,rejectResume,setNow:n=>now=n,get now(){return now;}};
}
module.exports={hub,fire,createFixture};
