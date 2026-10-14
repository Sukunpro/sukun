'use strict';
// Actual session command, wheel/easy-button handlers, r698 transport, registry,
// frequency graph lifecycle and global Stop. Native dhikr endpoints are seams;
// this does not establish audible output or physical Android lock behavior.
// Usage: node tests/r1058/stop-scope.cjs [source-root]
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
process.argv[2]=root;
const {harness,source}=require('../r1047/frequency-pause-fixture.cjs');
const html=fs.readFileSync(source,'utf8');
const sessionCode=fs.readFileSync(path.join(root,'assets/runtime/session-r919.js'),'utf8');
const interfaceCode=fs.readFileSync(path.join(root,'assets/runtime/interface-r920.js'),'utf8');
const wheelsCode=fs.readFileSync(path.join(root,'assets/runtime/wheels-r924.js'),'utf8');
const results=[];
const extract=(text,start,end)=>{const a=text.indexOf(start),b=text.indexOf(end,a);assert(a>=0&&b>a,'production boundary: '+start);return text.slice(a,b);};
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
async function fresh({kind='single',phase='playing',mode='esma'}={}){
 const h=harness(),c=h.c,calls=h.calls;
 await h.advance(600);
 c.queueMicrotask=queueMicrotask;c.location={search:''};c.URLSearchParams=URLSearchParams;
 c.Z.cat=kind==='28'?'berhet':mode;c.Z.idx=1;c.Z.count=57;c.Z.total=79137;c.Z.target=298;
 c.Z.auto=kind==='single'&&phase==='playing';let directPaused=kind==='single'&&phase==='paused';
 c.currentZikirState={snapshot:()=>({...c.Z,name:'Synthetic dhikr',session:{active:c.Z.auto||directPaused,paused:directPaused}}),refresh(){}};
 c.ZIKIR={esma:{items:[{},{}]},berhet:{items:[{},{}]}};
 c.SukunJourneyController={target:()=>kind};c.SukunSecretPolicy={unlocked:()=>true};
 c.SukunVoiceSettings={checkReady:()=>true};
 const state={run:kind!=='single'&&phase==='playing',paused:kind!=='single'&&phase==='paused',systemHold:false,i:1,rep:57};
 let cleanup=null;
 const endpoint={state:()=>({...state}),display:()=>({index:state.i,name:'Synthetic journey',count:state.rep,target:298}),
  stop(){calls.push('journey.stop');state.run=state.paused=state.systemHold=false;return cleanup||true;},
  resume(){calls.push('journey.resume');state.run=true;state.paused=false;return true;},
  play(){calls.push('journey.play');state.run=true;state.paused=false;return true;}};
 if(kind!=='single'){
  const key=kind==='28'?'SukunBerhetiyyeSeyir':'SukunEsma99Seyir',id=kind==='28'?'berhetiyye':'esma99';
  c[key]=endpoint;
  c.SukunAudioSessionRegistry.register(id,{getState:()=>state.run?'playing':state.paused?'paused':'idle',stop:()=>endpoint.stop()});
 }
 c.SukunDirectZikirTransportR698={state:()=>({auto:c.Z.auto,starting:false,cat:c.Z.cat,idx:c.Z.idx,count:c.Z.count,target:c.Z.target,voiceRequired:true}),
  stop(){calls.push('direct.stop');c.Z.auto=false;directPaused=false;return cleanup||true;},
  start(){calls.push('direct.start');c.Z.auto=true;directPaused=false;return true;},primeGesture(){return true;},clearStale(){}};
 c.SukunTabOwner={owns:()=>true,cancelPending:why=>calls.push('tab.cancel:'+why)};
 c.SukunForegroundArbiter.clearQueue=why=>calls.push('queue.clear:'+why);
 h.d.body.classList.add('sukun-zikir-tab');
 h.run(sessionCode,'actual-session-r919');
 // Extract the production command function and its wheel click assignment.
 const wheelNode={id:'r920Stop',disabled:false,click(){return this.onclick();}};
 const easyNode={id:'r932EasyStop',disabled:false,dataset:{action:'stop'}};
 c.fixtureNodes={r920Stop:wheelNode,r932EasyStop:easyNode};
 const command=interfaceCode.match(/function command\(action,options\)\{[^\n]+\}/)?.[0];
 const wheelBinding=interfaceCode.match(/\$\('r920Stop'\)\.onclick=\(\)=>command\('stop'\);/)?.[0];
 assert(command&&wheelBinding,'actual wheel Stop handler');
 const easyHandler=extract(wheelsCode,"box.addEventListener('click',event=>{","});render();");
 h.run(`(()=>{const $=id=>fixtureNodes[id],queue=()=>{};${command};${wheelBinding};
  const sources={stop:'r920Stop'},box={addEventListener(type,fn){window.fixtureEasyStop=fn;}};${easyHandler}});})();`,'actual-wheel-easy-stop');
 c.frStart();await h.advance(600);await flush();
 calls.length=0;
 const graph=c.FR.E||c.FR.env||c.FR.out,frequency={c:c.FR.c,b:c.FR.b,mode:c.FR.mode,vol:c.FR.vol};
 return {...h,state,endpoint,wheelNode,easyNode,graph,frequency,
  setCleanup(promise){cleanup=promise;},
  async stop(surface){if(surface==='wheel')await wheelNode.click();else if(surface==='easy'){c.fixtureEasyStop({target:{closest:()=>easyNode}});await flush();}else await c.SukunSessionState.command('stop');await flush();await h.advance(600);},
  assertFrequency(){assert.equal(c.FR.playing,true,'Finish must preserve the background frequency');assert.equal(c.ctx.state,'running','Finish must preserve the running shared context');assert.equal(c.FR.E||c.FR.env||c.FR.out,graph,'Finish must retain the same frequency graph');assert.deepEqual({c:c.FR.c,b:c.FR.b,mode:c.FR.mode,vol:c.FR.vol},frequency);assert.equal(calls.filter(x=>x==='env.kill').length,0,'Finish must not destroy the frequency graph');assert.equal(calls.filter(x=>x==='ctx.suspend').length,0,'Finish must not suspend background audio');}
 };
}
async function test(name,fn){await fn();results.push({name,ok:true});}
(async()=>{
 for(const surface of ['wheel','easy'])for(const kind of ['single','28','99']){
  await test(`${surface}: ${kind} Finish preserves live frequency and counts`,async()=>{
   const h=await fresh({kind}),before={count:h.c.Z.count,total:h.c.Z.total,rep:h.state.rep};
   await h.stop(surface);h.assertFrequency();assert.equal(h.c.Z.auto,false);assert.equal(h.state.run,false);assert.equal(h.state.paused,false);
   assert.deepEqual({count:h.c.Z.count,total:h.c.Z.total,rep:h.state.rep},before);
   assert(!h.calls.some(x=>Array.isArray(x)&&x[0]==='life.stop'&&x[1]==='registry:stopAll'),'dhikr Finish must avoid global registry Stop');
   assert(h.calls.includes(kind==='single'?'direct.stop':'journey.stop'),'Finish must reach its dhikr owner');
  });
 }
 await test('single Berhetiyye Finish preserves live frequency',async()=>{const h=await fresh({mode:'berhet'});await h.stop('wheel');h.assertFrequency();assert.equal(h.c.Z.auto,false);assert.equal(h.c.Z.cat,'berhet');});
 for(const kind of ['single','28','99'])for(const phase of ['paused','idle']){
  await test(`${kind} ${phase}: repeated Finish leaves frequency alive`,async()=>{const h=await fresh({kind,phase});await h.stop('wheel');await h.stop('easy');h.assertFrequency();assert.equal(h.c.Z.auto,false);assert.equal(h.state.run,false);assert.equal(h.state.paused,false);});
 }
 for(const kind of ['single','28','99'])await test(`${kind}: global mini-dock Stop still stops frequency and dhikr`,async()=>{
  const h=await fresh({kind});h.c.fixtureDockClick({target:h.nodes.get('r588Stop'),preventDefault(){},stopPropagation(){}});await flush();await h.advance(1600);
  assert.equal(h.c.FR.playing,false);assert.equal(h.c.Z.auto,false);assert.equal(h.state.run,false);assert.equal(h.state.paused,false);assert(h.calls.includes('env.kill'));
 });
 await test('main home global Stop retains complete frequency shutdown',async()=>{const h=await fresh();h.c.hardStopAll();await h.advance(1600);assert.equal(h.c.FR.playing,false);assert.equal(h.c.Z.auto,false);assert(h.calls.includes('env.kill'));});
 await test('Finish cancels a queued tab-claim Play before it can revive dhikr',async()=>{
  const h=await fresh({phase:'idle'});let released,owned=false;
  const claim=new Promise(resolve=>{released=resolve;});
  h.c.SukunTabOwner.owns=()=>owned;h.c.SukunTabOwner.run=(kind,work)=>claim.then(()=>{owned=true;return work();});
  assert.equal(h.c.SukunR698Transport.playPause('r919-command'),true);assert.equal(h.c.SukunR698Transport.snapshot().pendingStart,true);
  await h.stop('wheel');released();await flush();await h.advance(600);h.assertFrequency();assert.equal(h.c.Z.auto,false);assert(!h.calls.includes('direct.start'));assert.equal(h.c.SukunR698Transport.snapshot().pendingStart,false);
 });
 for(const kind of ['single','28','99'])await test(`${kind}: Finish cleanup barrier waits before the next Start`,async()=>{
  const h=await fresh({kind});let done;const cleanup=new Promise(resolve=>{done=resolve;});h.setCleanup(cleanup);
  // The wheel handler is synchronous; session boundary wraps its result.
  h.wheelNode.click();await flush();assert.equal(h.c.SukunR698Transport.snapshot().pendingStop,true);h.assertFrequency();
  const next=h.c.SukunSessionState.command('start');await flush();assert(!h.calls.includes('direct.start'));assert(!h.calls.includes('journey.play'));assert(!h.calls.includes('journey.resume'));
  h.setCleanup(null);done(true);await next;await flush();await h.advance(600);h.assertFrequency();assert.equal(h.c.SukunR698Transport.snapshot().pendingStop,false);
  assert(h.calls.includes(kind==='single'?'direct.start':'journey.play'),kind+': next Start must use the native dhikr endpoint after cleanup');
 });
 await test('Finish removes queued dhikr starts and preserves independent foreground requests',async()=>{
  const h=await fresh();let queue=[{id:'a',type:'single'},{id:'b',type:'auto-zikir'},{id:'c',type:'journey28'},{id:'d',type:'journey99'},{id:'e',type:'reader'},{id:'f',type:'smart-session'},{id:'g',type:'unknown-future'}];
  const retained=queue.slice(4);h.c.SukunForegroundArbiter.snapshot=()=>({owner:null,queue:queue.map(x=>({...x})),draining:false,observed:{spokenOwners:[]}});
  h.c.SukunForegroundArbiter.remove=id=>{h.calls.push('queue.remove:'+id);queue=queue.filter(x=>x.id!==id);return true;};
  await h.stop('easy');h.assertFrequency();assert.deepEqual(queue,retained);assert(!h.calls.some(x=>typeof x==='string'&&x.startsWith('queue.clear:')));
 });
 for(const kind of ['single','28','99'])await test(`${kind}: global Stop escalates during pending scoped Finish cleanup`,async()=>{
  const h=await fresh({kind});let done;h.setCleanup(new Promise(resolve=>{done=resolve;}));
  h.wheelNode.click();await flush();h.assertFrequency();assert.equal(h.c.SukunR698Transport.snapshot().pendingStop,true);
  h.c.fixtureDockClick({target:h.nodes.get('r588Stop'),preventDefault(){},stopPropagation(){}});await flush();
  assert.equal(h.c.FR.playing,false,'global Stop must take effect while scoped cleanup is pending');assert(h.calls.includes('env.kill'));
  assert.equal(h.c.SukunR698Transport.snapshot().pendingStop,true);done(true);await flush();await h.advance(1600);
  assert.equal(h.c.FR.playing,false);assert.equal(h.c.SukunR698Transport.snapshot().pendingStop,false);assert.equal(h.c.Z.auto,false);assert.equal(h.state.run,false);
 });
 await test('Finish clears every active or system-held journey without stopping the frequency',async()=>{
  const h=await fresh({kind:'28',phase:'paused'}),other={run:false,paused:false,systemHold:true};let stops=0;
  h.c.SukunEsma99Seyir={state:()=>other,stop(){stops++;other.run=other.paused=other.systemHold=false;return true;}};
  await h.stop('wheel');h.assertFrequency();assert.equal(h.state.paused,false);assert.equal(other.systemHold,false);assert.equal(stops,1);
 });
 for(const kind of ['single','28','99'])await test(`${kind}: missing scoped transport falls back to dhikr owner safely`,async()=>{
  const h=await fresh({kind});h.c.SukunR698Transport={...h.c.SukunR698Transport,stopDhikr:undefined,stop(){throw Error('fallback used the global Stop');}};
  await h.stop('wheel');h.assertFrequency();assert.equal(h.c.Z.auto,false);assert.equal(h.state.run,false);assert.equal(h.state.paused,false);
 });
 console.log(JSON.stringify({ok:true,source,tests:results.length,results,scope:'Production session module, wheel/easy handlers, r698 transport, registry, frStart/frStop, hardStopAll, currentFlow and mini dock. Direct/journey endpoints, WebAudio nodes and tab ownership are controlled seams. No physical Android/audio claim.'},null,2));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
