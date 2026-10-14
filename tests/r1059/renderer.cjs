/* Real Chromium OfflineAudioContext rendering of exact shipped ambience builders.
 * This proves sample generation and scheduling, not Android physical lock playback. */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const from = (a, b) => { const start = html.indexOf(a), end = html.indexOf(b, start); assert(start >= 0 && end > start, a); return html.slice(start, end); };
const builders = 'let ctx = {live:true};\nconst clamp=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0)),rnd=(a,b)=>a+Math.random()*(b-a);\n' +
  from('const g=v=>', '/* ════ ÇİZİM ZAMANLAYICISI') +
  from('const SOUND_URLS=', '/* Aktif kanallar */') +
  '\nwindow.__defs=AMBIENT_DEFS;window.__live=ctx;window.__ctx=()=>ctx;window.__noise=t=>NOISE.get(t);window.__with=(proxy,fn)=>{const before=ctx;ctx=proxy;try{return fn()}finally{ctx=before}};';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.SUKUN_CHROMIUM || '/tmp/sukun-browser/chromium', headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'assets/runtime/audio-palette-r945.js'), 'utf8') });
    await page.addScriptTag({ content: builders });
    await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'assets/runtime/background-mix-render-r1059.js'), 'utf8') });
    const report = await page.evaluate(async () => {
      const R = window.SukunBackgroundMixRenderer, result = [], def = id => window.__defs.find(x => x.id === id);
      const adapter = { withContext: window.__with, noise: window.__noise };
      function ok(name, pass, detail) { if (!pass) throw new Error(name + ': ' + JSON.stringify(detail)); result.push({name,pass:true,detail}); }
      const output = async value => new OfflineAudioContext(2, 1, value.sampleRate).decodeAudioData(await value.blob.arrayBuffer());
      const energy = (b, channel, start, duration) => { const d=b.getChannelData(channel);let sum=0;for(let i=Math.floor(start*b.sampleRate),end=Math.floor((start+duration)*b.sampleRate);i<end;i++)sum+=d[i]*d[i];return Math.sqrt(sum/(duration*b.sampleRate)); };
      const amplitude = (b, channel, hz) => {const d=b.getChannelData(channel),sr=b.sampleRate,n=sr*4,start=sr*20;let sin=0,cos=0;for(let i=0;i<n;i++){const phase=2*Math.PI*hz*i/sr;sin+=d[start+i]*Math.sin(phase);cos+=d[start+i]*Math.cos(phase);}return 2*Math.hypot(sin,cos)/n;};
      const before = window.__ctx(), timeout = window.setTimeout, interval = window.setInterval;
      // The entire finite graph must be constructed without wall-clock timers.
      const timerAdapter = { ...adapter, withContext(proxy, fn) { window.setTimeout = window.setInterval = () => { throw new Error('wall timer used while building'); }; try{return window.__with(proxy,fn)}finally{window.setTimeout=timeout;window.setInterval=interval} } };
      const timerMix = await R.render({sampleRate:44100,ambiences:['ney','su_bardak','ninni','rain'].map(id=>({id,def:def(id),volume:.3})),frequency:{playing:true,mode:'bin',c:180,b:7.83,vol:.2}}, timerAdapter);
      const mix = await output(timerMix);
      ok('timer-heavy shipped channels build in virtual audio time', timerMix.virtualEvents > 100 && timerMix.nodes > 300 && window.__ctx()===before, {events:timerMix.virtualEvents,nodes:timerMix.nodes,restored:window.__ctx()===before});
      ok('48-second stereo PCM WAV and late audible samples',timerMix.duration===48&&mix.duration===48&&mix.numberOfChannels===2&&timerMix.peak<=.951&&energy(mix,0,44,3)>.0001,{duration:mix.duration,channels:mix.numberOfChannels,peak:timerMix.peak,rms44s:energy(mix,0,44,3)});
      const bin = await R.render({sampleRate:44100,ambiences:[],frequency:{playing:true,mode:'bin',c:180,b:7.83,vol:.5}},adapter), tones=await output(bin);
      const ll=amplitude(tones,0,176.085),lr=amplitude(tones,0,183.915),rr=amplitude(tones,1,183.915),rl=amplitude(tones,1,176.085);
      ok('fractional binaural carriers preserve separate stereo frequencies',ll>lr*50&&rr>rl*50,{leftExpected:ll,leftWrong:lr,rightExpected:rr,rightWrong:rl});
      const secondary=await R.render({sampleRate:48000,frequency:{playing:false,vol:.5,secondary:{playing:true,c:100,b:2.5}}},adapter),secondTones=await output(secondary),sl=amplitude(secondTones,0,98.75),sr=amplitude(secondTones,1,101.25),swl=amplitude(secondTones,0,101.25),swr=amplitude(secondTones,1,98.75);
      ok('secondary binaural frequencies remain stereo with primary disabled',secondary.secondaryFrequency&&sl>.02&&sr>.02&&sl>swl*50&&sr>swr*50,{leftExpected:sl,leftWrong:swl,rightExpected:sr,rightWrong:swr});
      let secondaryRange=false;try{await R.render({sampleRate:44100,frequency:{playing:false,vol:.5,secondary:{playing:true,c:50000,b:2.5}}},adapter)}catch(e){secondaryRange=e.code==='secondary-frequency-range'}ok('invalid secondary carrier rejects and restores live context',secondaryRange&&window.__ctx()===before);
      for(const mode of ['mono','iso','mix']){const x=await R.render({sampleRate:44100,frequency:{playing:true,mode,c:180,b:8,vol:.5,pink:true,harmonicRatios:[2,3]}},adapter);ok('native '+mode+' plus pink/harmonics renders nonzero',x.rms>.001&&x.channels===2,{peak:x.peak,rms:x.rms});}
      let missing=false;try{await R.render({sampleRate:44100,ambiences:[{id:'custom',url:'blob:missing',def:{cal:1},volume:.5}]},adapter)}catch(e){missing=e.code==='custom-decode-required'}ok('missing custom decoder rejects instead of omitting sound',missing);
      const customContext = new OfflineAudioContext(1,44100,44100), custom=customContext.createBuffer(1,44100,44100), data=custom.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.sin(2*Math.PI*220*i/44100)*.1;
      const native = await R.render({sampleRate:44100,ambiences:[{id:'custom',url:'blob:validated',decoded:custom,def:{cal:1,wet:.1},volume:.5}]},adapter);ok('validated custom decoded ambience remains audible',native.rms>.001,{rms:native.rms});
      const hybrid=await R.render({sampleRate:44100,spatial:true,ambiences:[{id:'ney',def:def('ney'),volume:.5,hybridKey:'test',hybridDecoded:custom,hybridMix:.42}]},adapter);ok('hybrid recording and procedural balance with audio-clock spatial motion',hybrid.rms>.001&&hybrid.virtualEvents>1,{rms:hybrid.rms,events:hybrid.virtualEvents});
      const uncached=await R.render({sampleRate:44100,ambiences:[{id:'ney',def:def('ney'),volume:.5,hybridKey:'test',hybridBlob:new Blob(['test']),hybridMix:1}]},{...adapter,decodeHybrid:async()=>custom});ok('uncached hybrid layer decodes before synchronous context binding',uncached.rms>.001&&window.__ctx()===before,{rms:uncached.rms});
      const hrtf=await R.render({sampleRate:48000,frequency:{playing:true,mode:'bin',c:180,b:7.83,vol:.5,uzam:true,uzamHiz:22}},adapter);ok('frequency HRTF motion is rendered in native audio time at48kHz',hrtf.rms>.001&&hrtf.sampleRate===48000,{rms:hrtf.rms,sampleRate:hrtf.sampleRate});
      const zero=await R.render({sampleRate:44100,ambiences:[{id:'custom-zero',url:'blob:intentionally-muted',volume:0,def:{cal:1}}],frequency:{playing:true,mode:'bin',c:180,b:7.83,vol:0,secondary:{playing:true,c:100,b:2.5}}},adapter);ok('intentionally zero-volume channels and both frequency layers stay silent and require no decode',zero.peak===0&&zero.rms===0,{peak:zero.peak,rms:zero.rms});
      let cancellation=false;try{await R.render({sampleRate:44100,frequency:{playing:true}}, {...adapter,isCurrent:()=>false})}catch(e){cancellation=e.name==='AbortError'}ok('cancelled preparation cannot build or render',cancellation&&window.__ctx()===before);
      let budget=false;try{await R.render({sampleRate:44100,ambiences:[{id:'bad',volume:1,def:{cal:1,wet:0,build(E){E.every(()=>{},1)}}}]},adapter)}catch(e){budget=e.code==='event-limit'}ok('runaway recurring builder has bounded budget and restores live context',budget&&window.__ctx()===before);
      let throwRestored=false;try{await R.render({sampleRate:44100,ambiences:[{id:'throw',volume:1,def:{build(){throw new Error('builder failure')}}}]},adapter)}catch(e){throwRestored=e.ambienceId==='throw'}ok('builder exception identifies channel and restores context',throwRestored&&window.__ctx()===before);
      return {scope:'Real Chromium OfflineAudioContext, exact shipped procedural builders, virtual scheduling, WAV sample analysis. No Android physical lockscreen verification.',passed:result.length,total:result.length,results:result};
    });
    if(process.env.RENDER_ALL==='1') {
      const ids=await page.evaluate(()=>window.__defs.map(d=>d.id));report.bundled=[];
      for(const id of ids){const r=await page.evaluate(async id=>{const before=window.__ctx(),d=window.__defs.find(d=>d.id===id),r=await window.SukunBackgroundMixRenderer.render({sampleRate:44100,ambiences:[{id,def:d,volume:.5}]},{withContext:window.__with,noise:window.__noise});if(window.__ctx()!==before)throw new Error('live ctx not restored');return{id,peak:r.peak,rms:r.rms,events:r.virtualEvents,nodes:r.nodes}},id);assert(r.peak>0&&r.rms>0,id);report.bundled.push(r);console.error('rendered',report.bundled.length+'/'+ids.length,id,r.nodes);}
      report.bundledPassed=report.bundled.length;
    }
    console.log(JSON.stringify(report,null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
