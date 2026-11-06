'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {fixture}=require('../r1121/frequency-engine-fixture.cjs');
const root=path.resolve(__dirname,'../..');
let checks=0;
for(const mode of ['bin','mono','iso','mix'])for(let mask=0;mask<16;mask++){
 const f=fixture(root),c=f.context,nodes=[],waves=[],starts=[];
 const origOsc=c.osc,origEnv=c.makeEnv;
 c.osc=(hz,type)=>{const n=origOsc(hz,type);n.detune=f.param(0);n.setPeriodicWave=w=>n.wave=w;nodes.push(n);return n};
 c.ctx.createPeriodicWave=(real,imag,options)=>{const w={real:Array.from(real),imag:Array.from(imag),options};waves.push(w);return w};
 c.makeEnv=()=>{const e=origEnv(),play=e.play;e.play=(n,t)=>{starts.push({n,t});return play.call(e,n)};return e};
 Object.assign(c.FR,{mode,wave:'square',fm:!!(mask&1),am:!!(mask&2),rm:!!(mask&4),pwm:!!(mask&8)});
 c.frStart();assert.equal(c.frLiveOnly(),mask!==0);assert.equal(c.FR.playing,true);
 if(mask&8){
  assert(waves.length>=3);const a=waves[0],b=waves[1];assert.equal(a.imag.length,129);
  for(let n=1;n<129;n++)assert.equal(b.imag[n],a.imag[n]*(n%2?-1:1));
  const timed=starts.filter(x=>x.t!==undefined);assert(timed.length>=4);assert(timed.every(x=>x.t===.03));
 }
 c.frRamp(528,10,10);f.advance(5000);const p=c.frRampPosition();assert(p.c>180&&p.c<528);
 c.frRebuild();assert.equal(c.FR.playing,true);c.frStop();assert.equal(c.FR.playing,false);assert.equal(c.FR.E,null);
 assert(f.environments.every(e=>!e.alive()));checks++;
}
for(const wave of ['sine','triangle','sawtooth']){
 const f=fixture(root),c=f.context;Object.assign(c.FR,{wave,pwm:true});c.frStart();assert.equal(c.frLiveOnly(),false);c.frStop();checks++;
}
console.log(JSON.stringify({passed:checks,total:checks,method:'Production core in controlled graph/clock fixture; no native rendering or physical audio claim'},null,2));
