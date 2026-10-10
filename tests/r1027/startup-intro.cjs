'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const code=fs.readFileSync(path.join(root,'assets/runtime/startup-intro-r1027.js'),'utf8');
const clock=html.match(/<script id="sukun-auto-intro-clock">([\s\S]*?)<\/script>/)[1];
const style=html.match(/<style id="sukun-auto-intro-style">([\s\S]*?)<\/style>/)[1];
function hub(){return{listeners:new Map(),addEventListener(t,fn){if(!this.listeners.has(t))this.listeners.set(t,new Set());this.listeners.get(t).add(fn);},removeEventListener(t,fn){this.listeners.get(t)?.delete(fn);},dispatchEvent(e){for(const fn of [...this.listeners.get(e.type)||[]])fn(e);return true;}};}
function fire(target,type,extra={}){target.dispatchEvent({type,isTrusted:true,...extra});}
function fixture(options={}){
 let now=options.now??0,next=0;const jobs=new Map(),contexts=[],root=hub(),document=hub(),window=hub();
 root.dataset={started:'0'};root.hidden=false;document.hidden=!!options.hidden;
 document.getElementById=()=>options.noRoot?null:root;document.querySelectorAll=()=>options.media||[];
 function param(){return{value:1,schedule:[],cancelScheduledValues(t){this.schedule.push(['cancel',t]);},setValueAtTime(v,t){this.schedule.push(['set',v,t]);},linearRampToValueAtTime(v,t){this.schedule.push(['linear',v,t]);},exponentialRampToValueAtTime(v,t){this.schedule.push(['exponential',v,t]);}};}
 class AC{
  constructor(){if(options.throwConstruct)throw Error('unsupported');this.state=options.state||'running';this.currentTime=10;this.destination={};this.oscillators=[];this.gains=[];this.closeCalls=0;this.resumeCalls=0;Object.assign(this,hub());contexts.push(this);}
  createGain(){const g={gain:param(),connections:[],disconnected:false,connect(dest){this.connections.push(dest);},disconnect(){this.disconnected=true;}};this.gains.push(g);return g;}
  createOscillator(){if(options.failOscillatorAt===this.oscillators.length+1)throw Error('graph failure');const osc={frequency:param(),starts:[],stops:[],disconnected:false,connect(){},disconnect(){this.disconnected=true;},start(t){this.starts.push(t);},stop(t){this.stops.push(t);}};this.oscillators.push(osc);return osc;}
  close(){this.closeCalls++;if(options.closeThrow)throw Error('close blocked');if(options.closeReject)return Promise.reject(Error('close rejected'));this.state='closed';return Promise.resolve();}
  resume(){this.resumeCalls++;throw Error('must never unlock');}
 }
 window.matchMedia=()=>({matches:!!options.reduced});window.AudioContext=options.noAudio?undefined:AC;
 window.AudioLife={busy:()=>options.busy??false};window.SukunSessionState={snapshot:()=>({phase:options.phase||'IDLE'})};window.SukunTickSound={isRecording:()=>!!options.tickRecording};window.SukunPhysicalRecordingBusyR696=()=>!!options.recording;
 window.SukunAudioSessionRegistry={aggregateSnapshot:()=>options.aggregate||{paused:false,providerIds:[],mixCaptured:false}};
 if(options.missingAPI)delete window[options.missingAPI];
 if(options.apiThrow)window.AudioLife.busy=()=>{throw Error('unknown state');};
 const ctx={window,document,performance:{now:()=>now},Promise,Number,Event:class{constructor(type){this.type=type;this.isTrusted=false;}},
  localStorage:{getItem(){if(options.storageThrows)throw Error('storage denied');return options.owner||null;},setItem(){throw Error('unexpected write');},removeItem(){throw Error('unexpected delete');}},
  setTimeout:(fn,ms)=>{jobs.set(++next,{fn,when:now+ms});return next;},clearTimeout:id=>jobs.delete(id)};
 for(const key of ['caches','indexedDB','fetch','ac','gongSentez'])Object.defineProperty(ctx,key,{get(){throw Error('unexpected shared API: '+key);}});
 vm.createContext(ctx);
 function runClock(){vm.runInContext(clock,ctx);}
 function run(){vm.runInContext(code,ctx);}
 function tick(ms){const until=now+ms;for(;;){const found=[...jobs].filter(([,v])=>v.when<=until).sort((a,b)=>a[1].when-b[1].when)[0];if(!found)break;now=found[1].when;jobs.delete(found[0]);found[1].fn();}now=until;}
 return{root,document,window,contexts,jobs,run,runClock,tick,setNow:n=>now=n};
}
const results=[];function test(name,fn){try{fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.message});}}
test('Selected artwork is the exact existing clean icon-512 bytes, not a screenshot or redraw',()=>{assert.deepEqual(fs.readFileSync(path.join(root,'assets/branding/sukun-selected-logo-r1028.png')),fs.readFileSync(path.join(root,'icon-512.png')));});
test('Intro has only the selected logo image, no additional title or tap control',()=>{const markup=html.match(/<div id="sukun-auto-intro"[^>]*>([\s\S]*?)<script id="sukun-auto-intro-clock">/)[1];assert.match(markup,/src="\.\/assets\/branding\/sukun-selected-logo-r1028\.png/);assert(!/button|onclick|dokun|<h[1-6]|apAd|apAlt/.test(markup));assert.match(markup,/alt=""/);assert.match(html,/<div id="sukun-auto-intro" aria-hidden="true" role="presentation">/);});
test('Full square artwork is contained without circular clipping',()=>{assert.match(style,/object-fit:contain;border-radius:0/);assert.match(style,/aspect-ratio:1/);assert(!/border-radius:50%/.test(style));});
test('Cinematic light and scale affect a presentation layer only',()=>{assert.match(style,/\.sukunIntroFrame::after/);assert.match(style,/@keyframes sukunIntroLight/);assert.match(style,/prefers-reduced-motion/);});
test('CSS independent exit is fixed at 1.3 seconds and cannot trap interaction',()=>{assert.match(style,/animation:sukunIntroExit 1\.3s linear both/);assert.match(style,/100%\{opacity:0;visibility:hidden\}/);assert.match(style,/pointer-events:none!important/);assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);assert.match(style,/#sukun-auto-intro \.sukunIntroFrame\{animation:none;opacity:1/);});
test('Audio module is deferred until main parsing completes without blocking HTML',()=>{assert.match(html,/<script defer src="\.\/assets\/runtime\/startup-intro-r1027.js\?v=r\d+" integrity="sha256-/);});
test('Only immediately running, known-idle context starts one bounded hit',()=>{const f=fixture();f.runClock();f.run();assert.equal(f.contexts.length,1);const c=f.contexts[0];assert.equal(c.oscillators.length,3);assert(c.oscillators.every(o=>o.starts.length===1&&o.starts[0]===10&&o.stops[0]===10.65));assert.equal(c.resumeCalls,0);const peaks=c.gains.slice(1).map(g=>g.gain.schedule.find(v=>v[0]==='linear')[1]);assert(Math.abs(peaks.reduce((a,b)=>a+b,0)*c.gains[0].gain.value-.243)<1e-10);});
test('Main app AudioContext and ownership functions are never invoked',()=>{assert(!/\b(?:ac|gongSentez|huSentez)\s*\(|\.(?:resume|acquire|defer|run|setItem|removeItem)\s*\(/.test(code));const f=fixture();f.run();assert.equal(f.contexts.length,1);});
for(const state of ['suspended','interrupted','closed'])test(state+' context never schedules sources or future unlock',()=>{const f=fixture({state});f.runClock();f.run();const c=f.contexts[0];assert.equal(c.oscillators.length,0);assert.equal(c.resumeCalls,0);assert.equal(c.closeCalls,state==='closed'?0:1);fire(f.document,'pointerdown');f.tick(2000);assert.equal(c.oscillators.length,0);assert.equal(f.contexts.length,1);});
test('Suspended close rejection leaves no scheduled sound for later input',()=>{const f=fixture({state:'suspended',closeReject:true});f.run();const c=f.contexts[0];assert.equal(c.oscillators.length,0);c.state='running';fire(c,'statechange');fire(f.document,'pointerdown');assert.equal(c.oscillators.length,0);});
test('Autoplay result never changes visual 1.3-second deadline',()=>{for(const state of ['running','suspended']){const f=fixture({state});f.runClock();f.run();f.tick(1299);assert.equal(f.root.hidden,false);f.tick(1);assert.equal(f.root.hidden,true);}});
test('Clock exits even when module never loads',()=>{const f=fixture();f.runClock();f.tick(1300);assert(f.root.hidden);assert.equal(f.contexts.length,0);});
test('Delayed module cannot play after visual deadline',()=>{const f=fixture();f.runClock();f.tick(1300);f.run();assert.equal(f.contexts.length,0);});
test('Even a mildly late audio fetch is skipped, never backlogged',()=>{const f=fixture();f.runClock();f.tick(241);f.run();assert.equal(f.contexts.length,0);});
test('Absent or invalid clock marker cannot start audio',()=>{for(const started of [undefined,'bad','999']){const f=fixture();f.root.dataset.started=started;f.run();assert.equal(f.contexts.length,0);}});
test('Early real user gesture prevents any later asynchronous audio attempt',()=>{const f=fixture();f.runClock();fire(f.document,'pointerdown');f.run();assert.equal(f.contexts.length,0);});
test('Clock cancellation stops already-playing intro before subsequently registered Start handler',()=>{const f=fixture();f.runClock();f.run();let mutedBeforeStart=false;f.document.addEventListener('pointerdown',()=>{mutedBeforeStart=f.contexts[0].gains[0].gain.value===0;});fire(f.document,'pointerdown');assert(mutedBeforeStart);assert.equal(f.contexts[0].closeCalls,1);});
for(const event of ['pointerdown','keydown'])test('Real '+event+' stops audio and cannot replay it',()=>{const f=fixture();f.runClock();f.run();const c=f.contexts[0];fire(f.document,event);assert.equal(c.closeCalls,1);assert(c.oscillators.every(o=>o.disconnected&&o.stops.length===2));fire(f.document,event);f.run();assert.equal(f.contexts.length,1);});
test('Synthetic input does not trigger an audio unlock or reattempt',()=>{const f=fixture();f.runClock();f.run();fire(f.document,'pointerdown',{isTrusted:false});assert.equal(f.contexts[0].closeCalls,0);f.tick(760);assert.equal(f.contexts[0].closeCalls,1);});
test('Pagehide stops sound and prevents visual reappearance',()=>{const f=fixture();f.runClock();f.run();fire(f.window,'pagehide');assert(f.root.hidden);assert.equal(f.contexts[0].closeCalls,1);fire(f.window,'pageshow');f.run();assert.equal(f.contexts.length,1);});
test('Visibility loss immediately cancels own nodes and context',()=>{const f=fixture();f.runClock();f.run();f.document.hidden=true;fire(f.document,'visibilitychange');assert(f.root.hidden);assert.equal(f.contexts[0].closeCalls,1);});
test('Context suspension while running stops/disconnects every source',()=>{const f=fixture();f.run();const c=f.contexts[0];c.state='suspended';fire(c,'statechange');assert.equal(c.closeCalls,1);assert(c.oscillators.every(o=>o.disconnected));assert.equal(c.gains[0].gain.value,0);});
test('Audio watchdog closes at 760ms independent of CSS exit',()=>{const f=fixture();f.runClock();f.run();f.tick(759);assert.equal(f.contexts[0].closeCalls,0);f.tick(1);assert.equal(f.contexts[0].closeCalls,1);assert(!f.root.hidden);f.tick(540);assert(f.root.hidden);});
test('Graph construction failure closes and removes already-scheduled sources',()=>{const f=fixture({failOscillatorAt:2});f.run();const c=f.contexts[0];assert.equal(c.closeCalls,1);assert.equal(c.gains[0].gain.value,0);assert(c.oscillators[0].disconnected);});
test('Close throwing still mutes and disconnects all existing nodes',()=>{const f=fixture({closeThrow:true});f.run();f.tick(760);const c=f.contexts[0];assert.equal(c.gains[0].gain.value,0);assert(c.oscillators.every(o=>o.disconnected));});
test('All transient input/state listeners and timers are cleaned after exit',()=>{const f=fixture();f.runClock();f.run();f.tick(1300);assert.equal(f.jobs.size,0);for(const target of [f.root,f.document,f.window,f.contexts[0]])assert.equal([...target.listeners.values()].reduce((n,x)=>n+x.size,0),0);});
for(const option of [{hidden:true},{reduced:true},{owner:'active-tab'},{storageThrows:true},{busy:true},{phase:'PLAYING'},{phase:'PAUSED'},{tickRecording:true},{recording:true},{aggregate:{providerIds:['tekke']}},{media:[{paused:false,ended:false}]},{apiThrow:true}])test('Conservative no-overlap/safety guard: '+JSON.stringify(option),()=>{const f=fixture(option);f.runClock();f.run();assert.equal(f.contexts.length,0);f.tick(1300);assert(f.root.hidden);});
for(const missingAPI of ['AudioLife','SukunSessionState','SukunTickSound','SukunPhysicalRecordingBusyR696'])test('Unknown '+missingAPI+' means silent intro, not inferred inactivity',()=>{const f=fixture({missingAPI});f.run();assert.equal(f.contexts.length,0);});
for(const option of [{noAudio:true},{throwConstruct:true},{noRoot:true}])test('Unavailable audio/DOM fails safely: '+JSON.stringify(option),()=>{const f=fixture(option);f.runClock();f.run();assert.equal(f.contexts.length,0);});
test('No gesture requirement, automatic data action, fetch, or recovery mutation',()=>{assert(!/\.preventDefault\(|\.stopPropagation\(|\b(?:fetch|indexedDB|caches)\s*[.(]|RECOVERY_|\.postMessage\(/.test(code+clock));assert(!/location\.(?:assign|reload|replace)/.test(code+clock));});
console.log(JSON.stringify({total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,scope:'Actual intro sources with deterministic clock and WebAudio endpoints; exact user-selected clean logo bytes; no browser compositor, speakers, microphone, or real user data.',results},null,2));
if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
