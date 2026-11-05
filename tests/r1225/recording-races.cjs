/* Controlled real-function tests: not physical microphone acceptance. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(process.env.SUKUN_HTML||'nero.html','utf8');
function fn(name){const a=html.indexOf('async function '+name+'(');assert(a>=0,name);return html.slice(a,html.indexOf('\n}',a)+2)}
const manager=html.slice(html.indexOf('let REC_CAPTURE='),html.indexOf('function recSure('));
function rig(){
 const pending=[],streams=[],recorders=[],timers=new Set();let failConstructor=false,failStart=false,prepare=null;
 class MR{constructor(st){if(failConstructor)throw Error('constructor');this.stream=st;this.state='inactive';this.mimeType='audio/webm';recorders.push(this)}start(){if(failStart)throw Error('start');this.state='recording'}stop(){this.state='inactive';this.stopped=true}}
 const c={console,Blob,Date,Promise,MediaRecorder:MR,window:{MediaRecorder:MR},navigator:{mediaDevices:{getUserMedia:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}},document:{getElementById:()=>null,querySelector:()=>null},micKisit:()=>({audio:true}),micHazirla:()=>prepare?prepare():Promise.resolve(),alert:()=>{},toast:()=>{},vib:()=>{},sfx:()=>{},recSure:()=>'',recWakeOn:()=>{},recWakeOff:()=>{},setTimeout,clearTimeout,setInterval:(f)=>{timers.add(f);return f},clearInterval:f=>timers.delete(f),dlRender:()=>{},tvkRender:()=>{},dhKisimSync:()=>{},duaRecSyncUI:()=>{},duaRecKnown:()=>{},REC_DB:{set:async()=>{}},dlKey:()=>'',tvkKey:()=>'',svkKey:()=>'',DELAIL_HIZB:[{ad:'d'},{ad:'d2'}],TOVBE_KISIM:[{ad:'t'},{ad:'t2'}],SALAVAT_KISIM:[{ad:'s'},{ad:'s2'}],DL:{},TVK:{},SVK:{},DUAREC:{defs:{one:{key:'one',title:'one'},two:{key:'two',title:'two'}}}};
 vm.createContext(c);vm.runInContext(manager+['dlRec','tvkRec','svkRec','duaRecToggle'].map(fn).join('\n'),c);
 const resolve=(n)=>{const t={stopped:false,stop(){this.stopped=true}},s={getTracks:()=>[t],t};streams.push(s);pending[n].resolve(s);return s};
 return {c,pending,streams,recorders,timers,resolve,failConstructor:()=>failConstructor=true,failStart:()=>failStart=true,prepare:f=>prepare=f};
}
(async()=>{
 let tests=0;const check=(x,m)=>{assert(x,m);tests++};
 for(const [name,key,id,next] of [['dlRec','DL',0,1],['tvkRec','TVK',0,1],['svkRec','SVK',0,1],['duaRecToggle','DUAREC','one','two']]){
  let r=rig(),a=r.c[name](id),b=r.c[name](id);check(r.pending.length===1,name+' double click creates one request');let st=r.resolve(0);await Promise.all([a,b]);check(st.t.stopped&&r.recorders.length===0,name+' cancelled late stream closes');
  r=rig();a=r.c[name](id);r.c[key].rec.stop();st=r.resolve(0);await a;check(st.t.stopped&&!r.c[key].rec,name+' pending stop');
  r=rig();a=r.c[name](id);st=r.resolve(0);await a;let old=r.recorders[0];check(old.state==='recording',name+' starts');b=r.c[name](next);check(st.t.stopped&&old.state==='inactive',name+' switch stops old');let st2=r.resolve(1);await b;await old.onstop();check(r.c[key].rec===r.recorders[1]&&!st2.t.stopped,name+' stale onstop keeps new owner');r.c[key].rec.stop();check(st2.t.stopped&&!r.c[key].rec,name+' active stop');
  r=rig();r.failConstructor();a=r.c[name](id);st=r.resolve(0);await a;check(st.t.stopped&&!r.c[key].rec,name+' constructor error cleanup');
  r=rig();r.failStart();a=r.c[name](id);st=r.resolve(0);await a;check(st.t.stopped&&!r.c[key].rec&&r.timers.size===0,name+' start error cleanup');
 }
 let r=rig(),a=r.c.dlRec(0),b=r.c.tvkRec(0);let s=r.resolve(0),s2=r.resolve(1);await Promise.all([a,b]);check(s.t.stopped&&r.recorders.length===1&&r.c.TVK.rec===r.recorders[0],'cross-type pending ownership');r.c.TVK.rec.stop();check(s2.t.stopped,'cross-type stop');
 r=rig();let release;r.prepare(()=>new Promise(resolve=>release=resolve));a=r.c.dlRec(0);s=r.resolve(0);await new Promise(resolve=>setImmediate(resolve));r.c.DL.rec.stop();release();await a;check(s.t.stopped&&r.recorders[0].state==='inactive','stop during microphone preparation');
 r=rig();a=r.c.dlRec(0);s=r.resolve(0);await a;r.c.recSessionBegin('Other recorder',30,()=>{});check(s.t.stopped&&!r.c.DL.rec,'other recorder session cancels audited microphone');
 r=rig();a=r.c.dlRec(0);r.pending[0].reject(Error('permission denied'));await a;check(!r.c.DL.rec&&r.recorders.length===0,'permission rejection clears pending owner');
 r=rig();let stopped=0;const prior=r.c.recSessionBegin('Prior legacy recorder',30,()=>stopped++);a=r.c.dlRec(0);s=r.resolve(0);await a;check(stopped===1,'audited recorder stops previous legacy owner');prior.stop();check(stopped===1,'prior stop is idempotent');check(r.c.DL.rec.state==='recording','prior delayed stop preserves current recording');r.c.DL.rec.stop();check(r.timers.size===0,'all recording clocks cleaned');
 console.log(JSON.stringify({passed:tests,scope:'controlled real-function microphone races; physical Android not tested'}));
})().catch(e=>{console.error(e);process.exit(1)});
