'use strict';
// Deterministic waveform model driven by the real production AudioParam calls.
// It is not a microphone, speaker or Android audibility test.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {createFixture}=require('../helpers/startup-intro-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const code=fs.readFileSync(path.join(root,'assets/runtime/startup-intro-r1027.js'),'utf8');
const clock=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script id="sukun-auto-intro-clock">([\s\S]*?)<\/script>/)[1];
const f=createFixture(code,clock,{audioUnitWindow:true});f.runClock();f.run();const c=f.contexts[0];
assert.equal(c.oscillators.length,6);const origin=c.oscillators[0].starts[0],master=c.gains[0].gain.value;
const voices=c.oscillators.map((o,i)=>({start:o.starts[0]-origin,stop:o.stops[0]-origin,frequency:o.frequency.schedule.map(e=>[e[0],e[1],e[2]-o.starts[0]]),gain:c.gains[i+1].gain.schedule.map(e=>[e[0],e[1],e[2]-o.starts[0]])}));
const bound=master*voices.reduce((sum,v)=>sum+Math.max(...v.gain.map(e=>e[1])),0);assert(Math.abs(bound-.4284)<1e-9);
const results=[];
for(const rate of [22050,44100,48000,96000,192000]){
 try{
  const samples=new Float64Array(Math.round(.65*rate));
  for(const v of voices){const f0=v.frequency[0][1],f1=v.frequency[1][1],glide=v.frequency[1][2],k=Math.log(f1/f0)/glide;
   for(let i=Math.max(0,Math.ceil(v.start*rate));i<Math.min(samples.length,Math.ceil(v.stop*rate));i++){
    const u=i/rate-v.start;if(u<0)continue;const phase=f0*Math.expm1(k*Math.min(u,glide))/k+f1*Math.max(0,u-glide);let gain=v.gain.at(-1)[1];
    for(let j=1;j<v.gain.length;j++){const a=v.gain[j-1],b=v.gain[j];if(u<b[2]){const q=(u-a[2])/(b[2]-a[2]);gain=b[0]==='exponential'?a[1]*Math.pow(b[1]/a[1],q):a[1]+(b[1]-a[1])*q;break;}}
    samples[i]+=Math.sin(2*Math.PI*phase)*gain*master;
   }
  }
  let peak=0,energy=0,last=0,clipped=0;for(let i=0;i<samples.length;i++){const a=Math.abs(samples[i]);peak=Math.max(peak,a);energy+=samples[i]*samples[i];if(a>1e-12)last=i/rate;if(a>=1)clipped++;}
  const rms=Math.sqrt(energy/samples.length);assert(peak>.26&&peak<.28);assert(rms>.041&&rms<.043);assert(last<.641);assert.equal(clipped,0);assert(peak<bound&&bound<.5);assert(samples.slice(Math.ceil(.641*rate)).every(x=>x===0));
  results.push({name:rate+' Hz production-schedule rendering',status:'PASS',rate,peak,rms650ms:rms,lastNonzeroSeconds:last,clippedSamples:clipped});
 }catch(e){results.push({name:rate+' Hz production-schedule rendering',status:'FAIL',error:e.stack});}
}
const report={total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,conservativeBound:bound,headroomDb:-20*Math.log10(bound),scope:'Analytic production sine phase/envelope model at five sample rates; no normalization or physical audibility claim.',results};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
