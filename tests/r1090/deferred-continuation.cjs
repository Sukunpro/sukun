'use strict';
// Shipping base methods, navigation handoff, Play and final admission wrapper.
// Only preparation, loop endpoint and timer delivery are controlled. No audio
// completion is synthesized; the native companion checks real media events.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function part(start,end,from=0){const a=html.indexOf(start,from),b=html.indexOf(end,a);assert(a>=0&&b>a,start);return html.slice(a,b)}
function base(name,start,end){return part(start,end,html.indexOf('const P=R170.Player={')).replace(start,'P.'+name+'=function'+start.slice(start.indexOf('('))).replace(/},?\s*$/,'};')}
const block=part('    P.play=async function(){','    P.one=async function(step,token){',html.indexOf('if(P&&!P.__r244)'));
const admission=part('const oldPlay=P.play.bind(P);P.play=function(...args){','\n[',html.indexOf("const BUILD='r422'")).split('\n')[0];
const methods=[['pause',' pause(options={}){','\n stop(clear=true){'],['stop',' stop(clear=true){','\n prev(){'],['prev',' prev(){','\n next(){'],['next',' next(){','\n async one(step,token){'],['set',' set(q,name){','\n async play(){']];
async function flush(){for(let i=0;i<12;i++)await Promise.resolve()}
function harness(){let timer=0,now=0,preparation=async()=>{};const timers=new Map(),retired=[],loops=[],queue=[0,1,2,3].map(idx=>({type:'zikir',cat:'koruma',idx,reps:7,_r1082Id:'fixture_'+idx}));
 const P={queue,i:1,playing:true,paused:false,token:1,name:'Fixture',save(){},loop(token){loops.push({token,index:this.i,step:this.queue[this.i]})}};
 const api={freeze(){},clearStep(){},reset(){},pauseReason:x=>x||'user',onPlay(){},ids(){}};
 const w={R170:{Player:P},SukunSmartSessionR1082:api,SukunTerkipAllowed:()=>true};
 const c={window:w,P,Z:{cat:'koruma',idx:1,form:'nida'},R170:w.R170,Smart:api,speechSynthesis:{cancel(){}},sesDurdur(){},nowRender(){},queueRender(){},Date,ttsSeq:0,setTimeout:(f,ms)=>{timers.set(++timer,{f,at:now+ms});return timer},clearTimeout:id=>{const t=timers.get(id);if(t)retired.push(t.f);timers.delete(id)},primeQueue:()=>preparation(),setPhase(){}};
 vm.createContext(c);for(const [name,start,end]of methods)vm.runInContext(base(name,start,end),c);vm.runInContext(block,c);vm.runInContext(admission,c);
 async function advance(ms){const until=now+ms;for(;;){await flush();const next=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);now=next[1].at;next[1].f()}now=until;await flush()}
 return{P,c,loops,timers,retired,advance,setPreparation:fn=>{preparation=fn}};
}

const routeSource=fs.readFileSync(path.join(root,'assets/runtime/session-r919.js'),'utf8');
function routeHarness(h){const a=routeSource.indexOf('  function pendingSmartContinuation()'),b=routeSource.indexOf('  async function select(',a);assert(a>0&&b>a);Object.assign(h.c,{read:(fn,fallback=null)=>{try{return fn()??fallback}catch(_){return fallback}},journeys:()=>({active:null,view:null}),clearSmartResult(){},clean:String,number:(x,v=0)=>Number.isFinite(+x)?+x:v});h.c.window.SukunR698Transport={stopDhikr:()=>true};h.c.window.PlaybackController={play:()=>h.P.play()};vm.runInContext(routeSource.slice(a,b),h.c);return action=>h.c.route(action,{phase:'IDLE',journeyKind:'single'});}
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack||String(error)})}}
const act=(h,method)=>method==='jump'?h.P.jumpTo(2):method==='restart'?h.P.restartStep():h.P[method]();
(async()=>{
 for(const method of ['jump','restart'])for(const terminal of ['pause','stop','set'])await test(method+' then '+terminal+' retires automatic continuation',async()=>{
  const h=harness();act(h,method);if(terminal==='set')h.P.set([{type:'zikir',cat:'koruma',idx:3,reps:3}],'Replacement');else h.P[terminal]();const before={token:h.P.token,i:h.P.i,queue:h.P.queue,paused:h.P.paused};await h.advance(2000);assert.equal(h.loops.length,0);assert.equal(h.P.token,before.token);assert.equal(h.P.i,before.i);assert.equal(h.P.queue,before.queue);assert.equal(h.P.paused,before.paused);assert.equal(h.P.playing,false);
 });
 for(const method of ['jump','restart'])await test('Legitimate '+method+' continues once from reset count and selected index',async()=>{
  const h=harness();h.P._r982CompletedReps=4;act(h,method);assert.equal(h.P._r982CompletedReps,0);await h.advance(59);assert.equal(h.loops.length,0);await h.advance(21);assert.equal(h.loops.length,1);assert.equal(h.loops[0].index,method==='jump'?2:1);assert.equal(h.P.playing,true);assert.equal(h.P.paused,false);await h.advance(1000);assert.equal(h.loops.length,1);
 });
 for(const methods of [['jump','jump'],['restart','restart'],['restart','jump'],['jump','restart'],['restart','next'],['jump','prev'],['next','restart'],['next','jump']])await test('Rapid '+methods.join(' → ')+' keeps only latest continuation',async()=>{
  const h=harness();for(const method of methods)act(h,method);const i=h.P.i;assert.equal(h.timers.size,1);await h.advance(500);assert.equal(h.loops.length,1);assert.equal(h.loops[0].index,i);assert.equal(h.P.playing,true);assert.equal(h.P.paused,false);
 });
 for(const method of ['jump','restart'])for(const state of ['paused','idle'])await test(method+' from '+state+' never starts automatically',async()=>{
  const h=harness();state==='paused'?h.P.pause():h.P.stop();act(h,method);await h.advance(1000);assert.equal(h.loops.length,0);assert.equal(h.P.playing,false);
 });
 for(const method of ['jump','restart'])await test('Explicit Play during '+method+' starts only one loop',async()=>{const h=harness();act(h,method);await h.P.play();await h.advance(1000);assert.equal(h.loops.length,1);assert.equal(h.P.playing,true)});
 for(const method of ['jump','restart'])await test('Retired queued '+method+' timer cannot revive after Pause',async()=>{const h=harness();act(h,method);h.P.pause();assert.equal(h.retired.length,1);h.retired[0]();await flush();assert.equal(h.loops.length,0);assert.equal(h.P.paused,true)});
 for(const first of ['jump','restart'])for(const second of ['jump','restart','next'])await test(first+' preparing → '+second+' waits then starts latest exactly once',async()=>{
  const h=harness();let release,calls=0;h.setPreparation(()=>++calls===1?new Promise(resolve=>release=resolve):Promise.resolve());act(h,first);await h.advance(80);assert(h.P._r422PlayPending);act(h,second);const i=h.P.i;await h.advance(80);assert.equal(h.loops.length,0);release();await flush();await h.advance(0);assert.equal(h.loops.length,1);assert.equal(h.loops[0].index,i);assert.equal(calls,2);
 });
 for(const terminal of ['pause','stop','set'])await test('Delayed preparation then restart then '+terminal+' keeps terminal command',async()=>{
  const h=harness();let release;h.setPreparation(()=>new Promise(resolve=>release=resolve));h.P.jumpTo(2);await h.advance(70);h.P.restartStep();await h.advance(80);if(terminal==='set')h.P.set([{type:'silence',ms:3000}],'New');else h.P[terminal]();const token=h.P.token;release();await flush();await h.advance(2000);assert.equal(h.loops.length,0);assert.equal(h.P.token,token);assert.equal(h.P.playing,false);
 });
 for(const method of ['jump','restart'])for(const terminal of ['pause','stop'])await test('Exact canonical route '+method+' then '+terminal+' is accepted and owns the paused gap',async()=>{const h=harness(),route=routeHarness(h);act(h,method);assert.equal(route(terminal),true);const token=h.P.token;await h.advance(1000);assert.equal(h.loops.length,0);assert.equal(h.P.token,token);assert.equal(h.P.playing,false);assert.equal(h.P.paused,terminal==='pause')});
 for(const terminal of ['pause','stop'])await test('Canonical '+terminal+' during source preparation invalidates the pending Play token',async()=>{const h=harness(),route=routeHarness(h);let release;h.setPreparation(()=>new Promise(resolve=>release=resolve));h.P.jumpTo(2);await h.advance(70);assert(h.P._r422PlayPending);assert.equal(route(terminal),true);const token=h.P.token;release();await flush();await h.advance(1000);assert.equal(h.loops.length,0);assert.equal(h.P.token,token)});
 for(const action of ['next','previous','restart'])await test('Canonical '+action+' retains only latest matching smart continuation',async()=>{const h=harness(),route=routeHarness(h);h.P.jumpTo(2);assert.equal(route(action),true);const index=h.P.i;await h.advance(1000);assert.equal(h.loops.length,1);assert.equal(h.loops[0].index,index)});
 for(const key of ['cat','idx','form'])await test('Pending getter rejects a changed selected '+key+' without taking another owner',async()=>{const h=harness();h.P.jumpTo(2);assert.equal(h.P.hasPendingContinuation(),true);h.c.Z[key]=key==='idx'?2:key==='cat'?'esma':'tev';assert.equal(h.P.hasPendingContinuation(),false);await h.advance(1000);assert.equal(h.loops.length,0)});
 for(const key of ['cat','idx','form'])await test('Selected '+key+' change during existing Play preparation cannot revive retired continuation',async()=>{const h=harness();let release;h.setPreparation(()=>new Promise(resolve=>release=resolve));h.P.jumpTo(2);await h.advance(70);assert(h.P._r422PlayPending);h.c.Z[key]=key==='idx'?2:key==='cat'?'esma':'tev';assert.equal(h.P.hasPendingContinuation(),false);release();await flush();await h.advance(1000);assert.equal(h.loops.length,0);assert.equal(h.P.playing,false)});
 await test('Manual count correction keeps a matching pending continuation valid',async()=>{const h=harness();h.P.jumpTo(2);h.c.Z.count=5;assert.equal(h.P.hasPendingContinuation(),true);await h.advance(1000);assert.equal(h.loops.length,1)});
 await test('Shipping timeline and restart UI delegate to the same continuation owner',async()=>{assert(html.includes("w.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>P.jumpTo?.(+b.dataset.jump));"));const src=part('async function restartSmart(){','\nfunction actionText(',html.indexOf('r530-single-navigation-runtime'));assert(src.includes('P.restartStep()'));assert(!src.includes('setTimeout'));assert(!src.includes('P.play()'));});
 console.log(JSON.stringify({suite:'r1090 shared smart jump/restart continuation ownership',passed:results.filter(x=>x.passed).length,total:results.length,results,limitations:['Shipping Player methods and admission wrapper with controlled timer delivery and source preparation. No native audio claim; native companion covers real media clocks.']},null,2));if(results.some(x=>!x.passed))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
