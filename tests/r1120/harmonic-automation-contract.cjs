#!/usr/bin/env node
'use strict';
// Controlled scheduling contract only. Native browser/audio acceptance remains
// mandatory; these recording AudioParams do not render or measure sound.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(__dirname,'evidence/harmonic-automation-contract.json'));
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const begin=source.indexOf('function frTuneHarmonics(');assert(begin>=0);
let end=source.indexOf('{',begin)+1,depth=1;
for(;end<source.length&&depth;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--}
assert.equal(depth,0);const production=source.slice(begin,end);
const context={FR:{harmonics:[]},ctx:{currentTime:100,sampleRate:48000},Math,Float32Array};
vm.createContext(context);vm.runInContext(production,context);
function param(nativeHold=true){
 const events=[],p={events,value:123,cancelScheduledValues:t=>events.push(['cancel',t]),setValueAtTime:(v,t)=>events.push(['set',v,t]),linearRampToValueAtTime:(v,t)=>events.push(['ramp',v,t]),setTargetAtTime:(v,t,tau)=>events.push(['target',v,t,tau]),setValueCurveAtTime:(v,t,d)=>events.push(['curve',Array.from(v),t,d])};
 if(nativeHold)p.cancelAndHoldAtTime=t=>events.push(['hold',t]);return p;
}
function schedule(first,last,{ratio=2,sampleRate=48000,scale='linear',duration=10,at=40,nativeHold=true}={}){
 const frequency=param(nativeHold),gain=param(nativeHold);
 context.ctx.sampleRate=sampleRate;context.FR.harmonics=[{osc:{frequency},gain:{gain},ratio}];
 context.frTuneHarmonics(last/ratio,.15,duration,first/ratio,scale,at);
 return {frequency:frequency.events,gain:gain.events};
}
function valueAt(events,time){
 let prior=null;
 for(const event of events.filter(e=>e[0]==='set'||e[0]==='ramp')){
  if(event[2]>time){
   if(event[0]==='ramp'&&prior)return prior[1]+(event[1]-prior[1])*(time-prior[2])/(event[2]-prior[2]);
   break;
  }
  prior=event;
 }
 return prior?.[1];
}
function near(actual,expected){assert(Number.isFinite(actual));assert(Math.abs(actual-expected)<=1e-8*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`)}
const report={suite:'r1120 harmonic scheduling source contract',startedAt:new Date().toISOString(),method:'Extracted unmodified production function with recording AudioParams. Verifies event identities and piecewise schedules, not browser interpolation or sound.',sourceSha256:hash(source),functionSha256:hash(production),testSha256:hash(fs.readFileSync(__filename)),checks:[]};
function check(name,fn){try{report.checks.push({name,passed:true,evidence:fn()})}catch(error){report.checks.push({name,passed:false,error:error.stack})}}
const scenarios=[
 ['In-band linear paths match native main ramp events',.25,.75],
 ['Upward crossing clamps at the exact guard and mutes',.5,1.5],
 ['Downward crossing holds the guard then restores the ratio',1.5,.5],
 ['Both-above paths stay clamped and silent',1.25,1.75],
 ['Exact-limit stationary paths remain supported',1,1],
 ['Exact-limit start moving upward mutes immediately',1,1.5],
 ['Exact-limit start moving downward remains supported',1,.5],
 ['Downward arrival exactly at the limit restores gain',1.5,1],
 ['Upward arrival exactly at the limit remains supported',.5,1]
];
for(const [name,from,to]of scenarios)check(name,()=>{
 let combinations=0;
 for(const sampleRate of [22050,44100,48000])for(const ratio of [2,3,4,5,7,8,9,16])for(const nativeHold of [true,false]){
  const limit=Math.min(18000,sampleRate/2-100),first=from*limit,last=to*limit,at=40,duration=10;
  const s=schedule(first,last,{ratio,sampleRate,nativeHold,at,duration});
  assert.equal(s.frequency[0][0],nativeHold?'hold':'cancel');assert.equal(s.gain[0][0],nativeHold?'hold':'cancel');
  assert.equal(s.frequency[0][1],at);assert.equal(s.gain[0][1],at);
  assert(!s.frequency.some(e=>e[0]==='curve'||e[0]==='target'),'Linear paths must use native linear events, never sampled curves');
  if(from<=1&&to<=1)assert.deepEqual(s.frequency.slice(1),[['set',first,at],['ramp',last,at+duration]]);
  for(const fraction of [0,.01,.1,.25,.499,.501,.75,.99,1]){
   const time=at+fraction*duration,hz=first+(last-first)*fraction;
   near(valueAt(s.frequency,time),Math.min(limit,hz));
   // At an upward departure from the exact boundary, immediate silence wins.
   const active=hz<=limit&&!(first===limit&&last>limit&&fraction===0);
   near(valueAt(s.gain,time),active?.34/ratio:0);
  }
  const crossing=at+duration*(limit-first)/(last-first);
  if((first<=limit&&last>limit)||(first>limit&&last<=limit)){
   assert(s.frequency.some(e=>(e[0]==='ramp'||e[0]==='set')&&e[1]===limit&&Math.abs(e[2]-crossing)<1e-10));
   near(valueAt(s.gain,crossing),first<=limit?0:.34/ratio);
  }
  combinations++;
 }
 return {combinations};
});
check('Log sweep keeps matching sampled frequency and gain curves',()=>{
 const limit=18000,s=schedule(400,4000,{scale:'log'});
 const f=s.frequency.find(e=>e[0]==='curve'),g=s.gain.find(e=>e[0]==='curve');
 assert.equal(f[1].length,257);assert.equal(g[1].length,257);assert.deepEqual(f.slice(2),[40,10]);assert.deepEqual(g.slice(2),[40,10]);
 for(let i=0;i<257;i++){assert.equal(f[1][i],Math.fround(Math.min(limit,400*Math.pow(10,i/256))));assert.equal(g[1][i],Math.fround(.17))}
 return {points:257,sharedStart:40,duration:10};
});
check('Immediate retune holds existing automation and uses the supplied timestamp',()=>{
 const s=schedule(400,1000,{duration:0,at:7});
 assert.deepEqual(s.frequency,[['hold',7],['set',123,7],['target',1000,7,.15]]);
 assert.deepEqual(s.gain,[['hold',7],['target',.17,7,.15]]);return s;
});
report.finishedAt=new Date().toISOString();report.total=report.checks.length;report.passed=report.checks.filter(c=>c.passed).length;report.allPassed=report.passed===report.total;
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(!report.allPassed)process.exitCode=1;
