'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const core=html.slice(html.indexOf('const FR={playing:false'),html.indexOf('const FREQ_PRESETS=['));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
 const page=await browser.newPage();
 const result=await page.evaluate(async(core)=>{
  const cases=[];
  async function render(flags={},wave='square',mode='bin',sweep=false,sampleRate=48000){
   const ctx=new OfflineAudioContext(2,sampleRate*3,sampleRate),master=ctx.destination;
   const g=n=>{const a=ctx.createGain();a.gain.value=n;return a},osc=(f,type='sine')=>{const a=ctx.createOscillator();a.type=type;a.frequency.value=f;return a};
   const clamp=(n,l,h)=>Math.max(l,Math.min(h,n)),flt=(type,f)=>{const a=ctx.createBiquadFilter();a.type=type;a.frequency.value=f;return a};
   const sources=[],makeEnv=()=>({n:n=>n,play(n,t){sources.push(n);n.start(t);return n},alive:()=>true,kill(){for(const n of sources)n.stop(ctx.currentTime+.01)}});
   const syncFreqUI=()=>{};
   const setup=new Function('ctx','master','g','osc','clamp','flt','makeEnv','syncFreqUI',core+'; return {FR,frBuildGraph,frRamp,frLiveOnly,frDisposeGraph};');
   const api=setup(ctx,master,g,osc,clamp,flt,makeEnv,syncFreqUI);
   Object.assign(api.FR,{c:440,b:8,wave,mode,...flags});api.frBuildGraph();
   if(sweep)api.frRamp(1200,12,2.5);
   const live=api.frLiveOnly();
   const buf=await ctx.startRendering(),samples=buf.getChannelData(0);
   let peak=0,sum=0;for(const x of samples){if(!Number.isFinite(x))throw Error('Nonfinite output');peak=Math.max(peak,Math.abs(x));sum+=x*x;}
   const duty=[];for(let t=.8;t<2.8;t+=.05){const part=samples.slice(Math.floor(t*sampleRate),Math.floor((t+.025)*sampleRate));duty.push(part.filter(x=>x>0).length/part.length);}
   return {peak,rms:Math.sqrt(sum/samples.length),dutyMin:Math.min(...duty),dutyMax:Math.max(...duty),live,sources:sources.length};
  }
  for(const mode of ['bin','mono','iso','mix'])for(let mask=0;mask<16;mask++){
   const flags={fm:!!(mask&1),am:!!(mask&2),rm:!!(mask&4),pwm:!!(mask&8)};
   const x=await render(flags,'square',mode,true);if(x.peak>1||x.rms<.0001)throw Error('Invalid output '+JSON.stringify({mode,mask,x}));
   if(!x.live)throw Error('Sweep must remain live');cases.push({mode,mask,...x});
  }
  const plain=await render(),pwm=await render({pwm:true});
  const nonsquare=await render({pwm:true},'sine');
  const edges=[];for(const sampleRate of [22050,44100,48000])edges.push(await render({fm:true,am:true,rm:true,pwm:true},'square','mix',true,sampleRate));
  return{cases,plain,pwm,nonsquare,edges};
 },core);
 assert(result.pwm.dutyMax-result.pwm.dutyMin>.15,'PWM varies duty rather than static square');
 assert(result.plain.dutyMax-result.plain.dutyMin<.08,'Unmodulated square reference');
 assert.equal(result.nonsquare.live,false,'Non-square PWM is inactive');
 assert.equal(result.nonsquare.sources,2,'No PWM nodes for non-square wave');
 console.log(JSON.stringify({passed: true,renderedCases:result.cases.length+6,pwm:result.pwm,plain:result.plain,maxPeak:Math.max(...result.cases.map(x=>x.peak)),method:'Native Chromium OfflineAudioContext using extracted production frequency graph; not audible/physical device QA'},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
