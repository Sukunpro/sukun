const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
const start=html.indexOf('const CYM = '),end=html.indexOf('/* One optional view of the existing cymatics panel.');
let hz=715,amplitude=.001,sampleRate=48000;
const analyser={fftSize:8192,getFloatTimeDomainData(a){for(let i=0;i<a.length;i++)a[i]=amplitude*Math.sin(2*Math.PI*hz*i/sampleRate);}};
const sandbox={NS:{ctx:{state:'running'},analyser},window:{},document:{getElementById:()=>null},CYM3D:{refresh(){}},Float32Array,Uint8Array,Set,Number,Math};
vm.createContext(sandbox);vm.runInContext(html.slice(start,end)+';globalThis.api={CYM,cymLiveLevel,cymModesFor,cymSetHz,cymSeed,cymRandom,cymPrecompute};',sandbox);
const A=sandbox.api;
for(const rate of [44100,48000])for(const f of [20,120,219,220,252,396,438,528,639,715,852,963,2000,3000,6000,12000,18000]){
 sampleRate=rate;hz=f;amplitude=.001;
 const measured=A.cymLiveLevel();ok(Math.abs(measured-amplitude/Math.SQRT2)<.00004,`${rate} Hz sample rate: detects quiet ${f} Hz without subsampling blind spots`);
}
amplitude=0;ok(A.cymLiveLevel()===0,'exact silence stays still');amplitude=.2;sandbox.NS.ctx.state='suspended';ok(A.cymLiveLevel()===0,'suspended context cannot retain stale motion');sandbox.NS.ctx.state='running';
const makeChannel=sign=>({fftSize:8192,getFloatTimeDomainData(a){for(let i=0;i<a.length;i++)a[i]=sign*.2*Math.sin(i/15);}});
sandbox.NS.cymAnalysers=[makeChannel(1),makeChannel(-1)];ok(A.cymLiveLevel()>.14,'opposite phase stereo does not cancel motion power');
sandbox.NS.cymAnalysers=[makeChannel(1),{fftSize:8192,getFloatTimeDomainData:a=>a.fill(0)}];ok(A.cymLiveLevel()>.09,'one silent channel does not erase the other');
sandbox.NS.cymAnalysers=null;sandbox.NS.analyser={fftSize:128,getByteTimeDomainData:a=>a.fill(160)};ok(A.cymLiveLevel()===.25,'byte-only fallback uses real samples');
let previous=null;
for(const f of [20,120,219,220,221,252,396,528,639,715,716,852,963,2000,6000,18000]){
 A.cymSetHz(f);const grid=Array.from(A.CYM.grid);ok(grid.every(Number.isFinite),'finite interpolated modal field at '+f);
 if(previous)ok(grid.some((v,i)=>Math.abs(v-previous[i])>1e-5),'distinct Hz changes field at '+f);
 const copy=JSON.stringify(A.cymModesFor(f));ok(copy===JSON.stringify(A.cymModesFor(f)),'same Hz gives the same modal coefficients');previous=grid;
}
A.cymSetHz(399.999);const left=Array.from(A.CYM.grid);A.cymSetHz(400.001);ok(Math.max(...A.CYM.grid.map((v,i)=>Math.abs(v-left[i])))<.001,'modal boundary is continuous');
A.cymSeed();const seeded=JSON.stringify(A.CYM.particles.slice(0,10));A.cymSeed();ok(seeded===JSON.stringify(A.CYM.particles.slice(0,10)),'particle seed is repeatable, not per-visit randomness');
// Execute the production audio graph wiring with inert node fixtures.
const nodes=[];const node=type=>{const n={type,gain:{value:0},frequency:{value:0},connect(target,...args){this.edges.push({target,args});},edges:[]};nodes.push(n);return n;};
const context={state:'running',createGain:()=>node('gain'),createAnalyser:()=>node('analyser'),createBiquadFilter:()=>node('filter'),createChannelSplitter:count=>Object.assign(node('splitter'),{count}),destination:node('destination')};
const sinks=[],bus=node('bus'),audio={NS:{},window:{SUKUN:{ctx:()=>context,bus:()=>bus,tapSink:n=>sinks.push(n)}},showToast(){throw Error('audio init failed')}};
vm.createContext(audio);vm.runInContext(html.slice(html.indexOf('function initAudio() {'),html.indexOf('// ─── BINAURAL ───'))+';globalThis.init=initAudio;',audio);ok(audio.init()===true,'passive analysis graph initializes');
ok(sinks.includes(audio.NS.analyser)&&sinks.includes(audio.NS.cymSplitter),'both mono FFT and stereo power tap registered');
ok(audio.NS.cymAnalysers.length===2&&audio.NS.cymSplitter.edges.every((edge,i)=>edge.target===audio.NS.cymAnalysers[i]&&edge.args[0]===i),'stereo channels reach separate analysers');
ok(audio.NS.cymAnalysers.every(an=>an.edges.length===0)&&audio.NS.analyser.edges.length===0,'analysis never connects another audible output');
const count=nodes.length;audio.init();ok(nodes.length===count,'repeat init creates no duplicate tap or output');
ok(html.includes('boyutu, biçimi, malzemesi, sabitlenmesi'),'physical dependence disclosed');ok(html.includes('There is no universal salt shape'),'English physical dependence disclosed');
console.log(JSON.stringify({passed:checks,scope:'Production RMS, ordered modal field, seeded particles and passive stereo graph; controlled data, not a physical plate or native audio acceptance'}));
