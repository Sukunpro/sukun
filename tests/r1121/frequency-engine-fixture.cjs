'use strict';
// Controlled clock and graph seams. Production functions and the hub are loaded
// unchanged; this fixture neither renders sound nor simulates Android audio focus.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function fixture(root,{nativeHold=true,sampleRate=48000}={}){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const hubPath=(html.match(/src="\.\/(js\/frequency-hub-r\d+\.js)\?/)||[])[1];assert(hubPath,'Loaded hub script');
 const hub=fs.readFileSync(path.join(root,hubPath),'utf8');
 const between=(a,b)=>{const start=html.indexOf(a);assert(start>=0,a);const end=html.indexOf(b,start+a.length);assert(end>start,b);return html.slice(start,end)};
 let wall=0,seq=0;const timers=new Map(),nodes=new Map(),environments=[],logs=[];
 const cl=()=>({add(){},remove(){},toggle(){}});
 const element=id=>{if(!nodes.has(id))nodes.set(id,{id,value:'',textContent:'',hidden:false,checked:false,dataset:{},classList:cl(),style:{setProperty(){}},closest(){return null},addEventListener(){},setAttribute(){},click(){this.onclick?.()}});return nodes.get(id)};
 const document={readyState:'loading',hidden:false,activeElement:null,getElementById:id=>nodes.get(id)||null,querySelector:s=>s==='#sweepScaleGroup .active'?{dataset:{scale:element('sweepScale').value}}:null,querySelectorAll:()=>[],addEventListener(){}};
 const context={console,Math,Number,Float32Array,Date,Map,Set,Promise,document,MINI:{paused:false},LOG:{touch(){},maybeEnd(){},push(){}},I18N:{lang:'en'},master:{},clamp:(n,l,h)=>Math.max(l,Math.min(h,n)),saveSettings(){},syncFreqUI(){},pinkOn(){},pinkOff(){},bandOf:()=>['alpha','Alpha'],setTimeout(fn,delay=0){const id=++seq;timers.set(id,{fn,at:wall+delay});return id},clearTimeout:id=>timers.delete(id),setInterval(fn,delay){const id=++seq;timers.set(id,{fn,at:wall+delay,delay});return id},clearInterval:id=>timers.delete(id),addEventListener(){},dispatchEvent(){}};
 context.window=context;context.$=selector=>element(selector.slice(1));context.$$=()=>[];
 context.ctx={currentTime:0,sampleRate,state:'running',suspend(){this.state='suspended';return Promise.resolve()},resume(){this.state='running';return Promise.resolve()}};
 function param(initial=0){
  let base=initial,order=0;const events=[],calls=[];
  const ordered=()=>events.slice().sort((a,b)=>a.at-b.at||a.order-b.order);
  function valueAt(time){let value=base,at=0,target=null,curve=null;
   const evolve=t=>{if(target)return target.value+(target.from-target.value)*Math.exp(-(t-target.at)/target.tau);if(curve){const f=Math.max(0,Math.min(1,(t-curve.at)/curve.duration))*(curve.values.length-1),i=Math.floor(f);return curve.values[i]+((curve.values[i+1]??curve.values[i])-curve.values[i])*(f-i)}return value};
   for(const e of ordered()){
    if(e.at>time){if(e.type==='linear')return evolve(at)+(e.value-evolve(at))*(time-at)/(e.at-at);return evolve(time)}
    const before=evolve(e.at);at=e.at;target=null;curve=null;
    if(e.type==='target'){value=before;target={...e,from:before}}
    else if(e.type==='curve'){value=e.values[0];curve=e}
    else value=e.value;
   }
   return evolve(time);
  }
  const add=(type,value,at,rest={})=>{assert(Number.isFinite(at));if(value!=null)assert(Number.isFinite(value));events.push({type,value,at,order:++order,...rest});return p};
  const p={events,calls,valueAt,get value(){return valueAt(context.ctx.currentTime)},set value(v){base=v},setValueAtTime(v,t){calls.push(['set',v,t]);return add('set',v,t)},setTargetAtTime(v,t,tau){calls.push(['target',v,t,tau]);return add('target',v,t,{tau})},linearRampToValueAtTime(v,t){calls.push(['linear',v,t]);return add('linear',v,t)},setValueCurveAtTime(v,t,d){calls.push(['curve',Array.from(v),t,d]);return add('curve',null,t,{values:Array.from(v),duration:d})},cancelScheduledValues(t){calls.push(['cancel',t]);for(let i=events.length-1;i>=0;i--)if(events[i].at>=t)events.splice(i,1);return p}};
  if(nativeHold)p.cancelAndHoldAtTime=t=>{const held=valueAt(t);p.calls.push(['hold',t]);p.cancelScheduledValues(t);add('set',held,t);return p};
  return p;
 }
 const audioNode=(frequency=0)=>({frequency:param(frequency),gain:param(),offset:param(),positionX:param(),positionY:param(),positionZ:param(),connect(){return this},disconnect(){},start(){},stop(){},setPosition(){}});
 context.g=value=>{const n=audioNode();n.gain.value=value;return n};context.osc=(hz,type='sine')=>{const n=audioNode(hz);n.type=type;return n};context.flt=audioNode;context.src=audioNode;
 for(const method of ['createChannelMerger','createChannelSplitter','createConstantSource','createPanner'])context.ctx[method]=audioNode;
 context.makeEnv=()=>{const env={nodes:[],aliveValue:true,n(node){this.nodes.push(node);return node},play(node){this.nodes.push(node);return node},alive(){return this.aliveValue},kill(fade){logs.push({type:'kill',fade});this.aliveValue=false}};environments.push(env);return env};
 context.ac=()=>context.ctx;
 context.SukunBackgroundMix={changed:(reason)=>logs.push({type:'background',reason})};
 context.SukunAudioSessionRegistry={aggregateSnapshot:()=>({paused:context.MINI.paused}),releaseFreshFrequencyPauseGate(){},schedule(){}};
 vm.createContext(context);
 const core=between('const FR={playing:false', 'const FREQ_PRESETS=[');
 const journey=between('const JOURNEY=[','function bandOf(');
 vm.runInContext(core+'\n'+journey+'\nwindow.FR=FR; window.journeyState=()=>({active:jActive,paused:jPaused,program:jProgram});',context,{filename:'index.html:frequency-and-journey'});
 vm.runInContext(hub,context,{filename:hubPath});
 vm.runInContext(between('function cakraJourney(){',"$('#cakraJrnBtn').onclick=cakraJourney;"),context,{filename:'index.html:cakraJourney'});
 context.CAKRA=[{n:'Synthetic stage',fc:432,fb:6}];context.cakraComplete=()=>{};context.cakraVizStart=()=>{};
 for(const id of ['sweepStart','sweepEnd','sweepDur','sweepScale','sweepLoop','fadeDuration','frToggle'])element(id);
 Object.assign(element('sweepStart'),{value:'180'});Object.assign(element('sweepEnd'),{value:'528'});Object.assign(element('sweepDur'),{value:'10'});Object.assign(element('sweepScale'),{value:'linear'});element('fadeDuration').value='5';
 element('frToggle').onclick=()=>context.FR.playing||context.FR._restartTimer||context.FR._restartHeld?context.frStop():context.frStart();
 function advance(milliseconds){const end=wall+milliseconds;let count=0;while(true){const pending=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0]);if(!pending.length)break;if(++count>50000)throw Error('Timer runaway');const [id,t]=pending[0];const delta=t.at-wall;wall=t.at;if(context.ctx.state==='running')context.ctx.currentTime+=delta/1000;if(t.delay)timers.set(id,{...t,at:t.at+t.delay});else timers.delete(id);t.fn()}if(context.ctx.state==='running')context.ctx.currentTime+=(end-wall)/1000;wall=end;}
 return{context,controller:context.SukunFrequencyHubR1101.controller,element,advance,param,environments,logs,timers,sourceHashes:{index:hash(html),hub:hash(hub)},hubPath};
}
module.exports={fixture,hash};
