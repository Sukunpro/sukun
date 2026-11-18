'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root=path.resolve(process.argv[2] || path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/frequency-workbench-r1120.js'),'utf8');
const begin=source.indexOf(' function mountFrequencyPulse(){');
const end=source.indexOf(' function mount(){',begin);
assert(begin>=0&&end>begin,'Missing published frequency light owner');
const owner=source.slice(begin,end);

class Element extends EventTarget {
  constructor(){super();this.attributes=new Map();this.style={};this.dataset={};this.hidden=false;}
  setAttribute(key,value){this.attributes.set(key,String(value));}
  getAttribute(key){return this.attributes.get(key);}
}

function fixture(){
  const ids=['frequencyPulseToggle','frequencyPulseGlow','frequencyPulseStatus','frequencyPulseLabel','masterVol'];
  const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
  const button=elements.frequencyPulseToggle,glow=elements.frequencyPulseGlow,master=elements.masterVol;
  master.value='0.5';glow.hidden=true;
  const window=new EventTarget(),document=new EventTarget(),motion=new EventTarget();
  let job=null, consent=false; motion.matches=false;
  window.CIZ={ekle(id,draw,options){job={id,draw,options};},cikar(){job=null;}};
  window.matchMedia=()=>motion; window.confirm=()=>consent;
  const FR={playing:true,c:256,b:8,vol:.5,balL:1,balR:1},ctx={state:'running'},MINI={paused:false};
  window.AudioLife={userPaused:false};window.I18N={lang:'tr'};
  const $=id=>elements[id],T=(tr,en)=>window.I18N.lang==='en'?en:tr;
  vm.runInNewContext(owner+'\nmountFrequencyPulse();',{window,document,FR,ctx,MINI,AVE:{int:.18},$,T,frRampPosition:()=>({b:FR._ramp.beat})});
  return {window,document,motion,button,glow,master,FR,ctx,MINI,status:elements.frequencyPulseStatus,
    enter(value=true){consent=value;button.dispatchEvent(new Event('click'));},
    tick(time){if(job?.options.active())job.draw(time);},
    hasJob:()=>!!job,
    emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}));}};
}

test('rejected consent, idle playback and opt-out',()=>{
  const f=fixture(); f.enter(false);f.tick(0);assert(!f.hasJob()&&f.glow.hidden);
  f.FR.playing=false;f.enter();f.tick(50);assert(f.hasJob()&&f.glow.hidden);
  f.FR.playing=true;f.tick(100);assert(!f.glow.hidden);
  f.enter();assert(!f.hasJob()&&f.glow.hidden);
});

test('known beats, ramps and pure tones use bounded musical subdivisions',()=>{
  const f=fixture(); f.enter();
  const pairs=[[0,.5],[.5,.5],[.75,.75],[1,1],[1.25,.625],[2,1],[6,.75],[7.83,.97875],[8,1],[10,.625],[16,1],[32,1],[40,.625]];
  for(const [i,[beat,hz]] of pairs.entries()){
    f.FR.b=beat;f.tick(i*300);assert.equal(Number(f.glow.dataset.rateHz),hz);
  }
  f.FR._ramp={beat:3};f.FR.b=32;f.tick(5100);assert.equal(Number(f.glow.dataset.rateHz),.75);
  f.FR._ramp=null;f.FR.b=NaN;f.tick(5500);assert(f.glow.hidden);
});

test('focus, silence and actual background handoff control display without starting sound',()=>{
  const f=fixture();f.enter();let t=0;
  const active=(value)=>{f.tick(t+=300);assert.equal(!f.glow.hidden,value);};
  active(true);
  f.master.value='0';active(false);f.master.value='.5';active(true);
  f.FR.balL=f.FR.balR=0;active(false);f.FR.balR=1;active(true);
  f.ctx.state='suspended';active(false);
  f.emit('sukun:backgroundmix',{mutedLive:true,playing:true,currentSelectionPrepared:true,native:{waiting:false},volume:.5});
  active(true);
  f.emit('sukun:backgroundmix',{mutedLive:true,playing:true,currentSelectionPrepared:false,native:{waiting:false},volume:.5});
  active(false);
  f.emit('sukun:backgroundmix',{mutedLive:false});f.ctx.state='running';active(true);
  f.emit('sukun:audioaggregatechange',{paused:true});assert(f.glow.hidden);active(false);
  f.emit('sukun:audioaggregatechange',{paused:false});active(true);
  f.document.hidden=true;f.document.dispatchEvent(new Event('visibilitychange'));assert(f.glow.hidden);active(false);
  f.document.hidden=false;active(true);
  f.FR.playing=false;active(false);
});

test('reduce motion and page departure disarm; a fresh opt-in is required',()=>{
  const f=fixture();f.enter();f.tick(100);assert(!f.glow.hidden);
  f.motion.matches=true;f.motion.dispatchEvent(new Event('change'));assert(f.button.disabled&&f.glow.hidden&&!f.hasJob());
  f.motion.matches=false;f.motion.dispatchEvent(new Event('change'));assert(!f.button.disabled&&!f.hasJob());
  f.enter();f.tick(300);assert(!f.glow.hidden);
  f.window.dispatchEvent(new Event('pagehide'));assert(f.glow.hidden&&!f.hasJob());
});

test('long scheduling gaps do not introduce an abrupt full-range jump',()=>{
  const f=fixture();f.enter();f.tick(0);const first=Number(f.glow.style.opacity);
  f.tick(100000);const second=Number(f.glow.style.opacity);
  assert(second>=first&&second-first<.15);
});
