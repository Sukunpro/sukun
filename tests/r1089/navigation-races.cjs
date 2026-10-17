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
 const c={window:w,P,R170:w.R170,Smart:api,speechSynthesis:{cancel(){}},sesDurdur(){},nowRender(){},queueRender(){},Date,ttsSeq:0,setTimeout:(f,ms)=>{timers.set(++timer,{f,at:now+ms});return timer},clearTimeout:id=>{const t=timers.get(id);if(t)retired.push(t.f);timers.delete(id)},primeQueue:()=>preparation(),setPhase(){}};
 vm.createContext(c);for(const [name,start,end]of methods)vm.runInContext(base(name,start,end),c);vm.runInContext(block,c);vm.runInContext(admission,c);
 async function advance(ms){const until=now+ms;for(;;){await flush();const next=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);now=next[1].at;next[1].f()}now=until;await flush()}
 return{P,loops,timers,retired,advance,setPreparation:fn=>{preparation=fn}};
}
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack||String(error)})}}
(async()=>{
 for(const nav of ['next','prev'])for(const action of ['pause','stop','set'])await test(nav+' followed by '+action+' retires the old automatic continuation',async()=>{const h=harness();h.P[nav]();if(action==='set')h.P.set([{type:'zikir',cat:'koruma',idx:3,reps:1}],'Replacement');else h.P[action]();const expected={token:h.P.token,i:h.P.i,playing:h.P.playing,paused:h.P.paused,queue:h.P.queue};await h.advance(1000);assert.equal(h.loops.length,0);for(const key of ['token','i','playing','paused','queue'])assert.equal(h.P[key],expected[key],key)});
 for(const nav of ['next','prev'])await test('Legitimate '+nav+' automatically continues exactly once at the selected step',async()=>{const h=harness();h.P[nav]();await h.advance(59);assert.equal(h.loops.length,0);await h.advance(1);assert.equal(h.loops.length,1);assert.equal(h.loops[0].index,nav==='next'?2:0);assert.equal(h.P.playing,true);await h.advance(1000);assert.equal(h.loops.length,1)});
 for(const sequence of [['next','next'],['next','prev'],['prev','next'],['next','next','prev']])await test('Rapid '+sequence.join(' → ')+' retains only the latest selection and continuation',async()=>{const h=harness();for(const action of sequence)h.P[action]();const index=h.P.i,token=h.P.token;assert.equal(h.timers.size,1);await h.advance(60);assert.equal(h.loops.length,1);assert.equal(h.loops[0].index,index);assert.equal(h.loops[0].token,token+1);assert.equal(h.P.playing,true)});
 for(const action of ['pause','stop'])await test('Navigation after '+action+' does not inherit a retired running intention',async()=>{const h=harness();h.P.next();h.P[action]();h.P.prev();await h.advance(1000);assert.equal(h.loops.length,0);assert.equal(h.P.playing,false);assert.equal(h.P.paused,action==='pause')});
 await test('A new explicit Play during handoff starts only one loop',async()=>{const h=harness();h.P.next();await h.P.play();assert.equal(h.loops.length,1);await h.advance(1000);assert.equal(h.loops.length,1)});
 await test('Pause delivered one millisecond before handoff wins without later token changes',async()=>{const h=harness();h.P.next();await h.advance(59);h.P.pause();const token=h.P.token;await h.advance(1000);assert.equal(h.P.token,token);assert.equal(h.P.paused,true);assert.equal(h.loops.length,0)});
 await test('An already queued retired timer callback has no authority after Pause',async()=>{const h=harness();h.P.next();h.P.pause();assert.equal(h.retired.length,1);h.retired[0]();await flush();assert.equal(h.loops.length,0);assert.equal(h.P.paused,true)});
 for(const mutation of ['token','queue','index','step'])await test('A '+mutation+' change fences continuation even without delivering an explicit cancel hook',async()=>{const h=harness();h.P.next();if(mutation==='token')h.P.token++;else if(mutation==='queue')h.P.queue=h.P.queue.slice();else if(mutation==='index')h.P.i=1;else h.P.queue[h.P.i]={...h.P.queue[h.P.i]};await h.advance(1000);assert.equal(h.loops.length,0);assert.equal(h.P.playing,false)});
 for(const actions of [['next'],['prev'],['next','prev']])await test('New navigation '+actions.join(' → ')+' during delayed asynchronous preparation carries only the latest continuation',async()=>{
  const h=harness();let release,calls=0;h.setPreparation(()=>++calls===1?new Promise(resolve=>{release=resolve}):Promise.resolve());h.P.next();await h.advance(60);assert.equal(h.loops.length,0);assert(h.P._r422PlayPending);for(const action of actions)h.P[action]();const index=h.P.i;await h.advance(60);assert.equal(h.loops.length,0);release();await flush();await h.advance(0);assert.equal(h.loops.length,1);assert.equal(h.loops[0].index,index);assert.equal(h.P.playing,true);assert.equal(calls,2);
 });
 for(const action of ['pause','stop','set'])await test(action+' still wins after a newer navigation has waited on an obsolete asynchronous preparation',async()=>{
  const h=harness();let release;h.setPreparation(()=>new Promise(resolve=>{release=resolve}));h.P.next();await h.advance(60);h.P.prev();await h.advance(60);if(action==='set')h.P.set([{type:'zikir',cat:'koruma',idx:3,reps:1}],'Replacement');else h.P[action]();const token=h.P.token;release();await flush();await h.advance(1000);assert.equal(h.loops.length,0);assert.equal(h.P.token,token);assert.equal(h.P.playing,false);assert.equal(h.P.paused,action==='pause');
 });
 console.log(JSON.stringify({suite:'r1089 shipping smart navigation latest-command ownership',passed:results.filter(x=>x.passed).length,total:results.length,results},null,2));if(results.some(x=>!x.passed))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
