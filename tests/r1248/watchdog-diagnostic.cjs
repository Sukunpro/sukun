'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('function reportTimeout(owner,key,index){'),end=html.indexOf('function remainingFor(',start);
assert(start>0&&end>start);
const rows=[];
function test(name,fn){try{fn();rows.push({name,passed:true});}catch(e){rows.push({name,passed:false,error:e.stack});}}
for(const kind of [28,99])test(kind+': exact deadline reports current timeout before invalidating caller, never grace/stale',()=>{
 const from=html.indexOf(kind===28?'async function seyirOkuGuvenli(':'async function es99PlaySafe(');
 const begin=html.indexOf('const deadline=()=>{',from),last=html.indexOf('timer=setTimeout(deadline,'+(kind===28?'timeout':'document.hidden?95000:35000'),begin);
 for(const phase of ['stale','progress','recovery','probe','timeout']){
  const order=[],state={attemptSeq:1};
  const c={current:()=>phase!=='stale',index:6,timedOut:false,timer:0,BS:state,ES:state,
   resolve:r=>order.push(r.reason),setTimeout:()=>1,seyirAktifKaynakKes:()=>order.push('cut'),es99CutSource:()=>order.push('cut'),
   window:{SukunLockJourneyTransportV2:{ownsProgress:()=>phase==='progress',ownsRecovery:()=>phase==='recovery',claimProgressProbe:()=>phase==='probe',
    reportTimeout:(owner,key,index)=>{assert.equal(state.attemptSeq,1);assert.equal(c.timedOut,false);assert.equal(owner,'journey'+kind);assert.equal(key,kind===28?'berhet:6':'esma:6:nida');assert.equal(index,6);order.push('report');}}}};
  vm.createContext(c);vm.runInContext(html.slice(begin,last).trim().replace('const deadline=','var deadline='),c);c.deadline();
  assert.deepEqual(order,phase==='timeout'?['report','cut','resolver-timeout']:phase==='stale'?['stale-sequence']:[]);
 }
});
test('passive timeout snapshot includes physical age and no recording identity or commands',()=>{
 const calls=[],secret='PRIVATE_SENTINEL';
 const a={src:'blob:'+secret,paused:false,ended:false,seeking:true,loop:true,currentTime:0,duration:3,readyState:1,error:null,
  play(){throw Error('play mutation');},pause(){throw Error('pause mutation');}};
 const L={active:true,owner:'journey28',key:'berhet:6',index:6,mediaSource:a.src,watchdogProgressAt:100000,dormant:false,frozen:false};
 const c={L,Math,Number,String,now:()=>100213,audio:()=>a,sourceMatches:()=>true,window:{dispatchEvent:e=>calls.push(e)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
 vm.createContext(c);vm.runInContext(html.slice(start,end),c);c.reportTimeout('journey28','berhet:6',6);
 assert.equal(calls.length,1);assert.equal(calls[0].type,'sukun:journey-watchdog-timeout');
 const d=calls[0].detail;assert.equal(d.lastPhysicalProgressAgeMs,213);assert.equal(d.readyState,1);assert.equal(d.seeking,true);assert.equal(d.sourceMatches,true);
 assert(!JSON.stringify(calls).includes(secret));assert(!Object.hasOwn(d,'key'));assert(!Object.hasOwn(d,'src'));
 for(const tuple of [['journey',6],['journey28',28],['journey99',99],['journey99',-1]])c.reportTimeout(tuple[0],'unused',tuple[1]);
 assert.equal(calls.length,1);
});
test('timeout reporter is exported by the shipped transport',()=>{
 const at=html.indexOf('window.SukunLockJourneyTransportV2=Object.freeze(');
 assert.match(html.slice(at,html.indexOf(';',at)),/\breportTimeout\b/);
});
console.log(JSON.stringify({passed:rows.filter(r=>r.passed).length,total:rows.length,rows},null,2));
if(rows.some(r=>!r.passed))process.exitCode=1;
