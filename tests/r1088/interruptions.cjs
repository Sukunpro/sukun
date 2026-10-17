'use strict';
// Execute shipping engine and journal functions. Only audio results and elapsed
// waits are controlled so cancellation can be placed exactly at a boundary.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const journalSource=fs.readFileSync(path.join(root,'assets/runtime/progress-journal-r982.js'),'utf8');
function fragment(start,end,from=0){const a=source.indexOf(start,from),b=source.indexOf(end,a);assert(a>=0&&b>a,start);return source.slice(a,b+end.length)}
const apiCode=fragment('const Smart=window.SukunSmartSessionR1082=(()=>{','\n})();');
const fixedCode=fragment('    P.one=async function(step,token){','\n    };',source.indexOf('if(P&&!P.__r244)'));
const loopCode=fragment('P.loop=async function(token){while(this.playing','\n};',source.indexOf('/* Adım sonu davranışı:'));
const method=(start,end,replacement,closing)=>fragment(start,end).replace(start,replacement).replace(closing,';');
const methods=[method(' save(){Smart.reconcile();','\n restore(){','P.save=function(){Smart.reconcile();',/,\n restore\(\)\{$/),method(' restore(){','\n set(q,name){','P.restore=function(){',/,\n set\(q,name\)\{$/),method(' pause(options={}){','\n stop(clear=true){','P.pause=function(options={}){',/,\n stop\(clear=true\)\{$/),method(' stop(clear=true){','\n prev(){','P.stop=function(clear=true){',/,\n prev\(\)\{$/)];
const plain=x=>JSON.parse(JSON.stringify(x));
const step=(idx=0,extra={})=>({type:'zikir',cat:'koruma',idx,reps:7,gap:0,repeatMode:'fixed',advance:'auto',...extra});
function harness(queue=[step()],checkpoint=null){
 let saved=checkpoint&&plain(checkpoint),calls=0,completed=0,reader=async()=>({ok:true,source:'controlled-leaf'});
 const P={queue:plain(queue),i:0,token:1,playing:true,paused:false,failures:0,name:'Korunma Okumaları',key:'sukun.session.player.v2',_r982CompletedReps:0,async play(){if(this.playing)return true;w.SukunSmartSessionR1082.onPlay();this.playing=true;this.paused=false;this.token++;return this.loop(this.token)}};
 const identity=s=>s?JSON.stringify([s.type,s.cat,s.idx,s.reps,s.repeatMode||'fixed',s._r472SourceMode||'auto',s.repeatForMs]):'';
 const w={R170:{Player:P},SukunProgressJournal:{stepIdentity:identity},SukunResumePolicy:{complete(){completed++}},AudioResolver:{async play(...args){calls++;return reader(...args)}}};
 const c={P,R170:w.R170,window:w,document:{documentElement:{lang:'tr'}},Date,Z:{},ZIKIR:{koruma:{items:[{tr:'Felâk Sûresi'},{tr:'Nâs Sûresi'}]}},ls:{get:()=>saved,set:(_k,value)=>{saved=plain(value)}},speechSynthesis:{cancel(){}},sesDurdur(){},renderZikir(){},zUI(){},r244PlayerRender(){},nowRender(){},queueRender(){},E:{render(){}},normalized:s=>s,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),async cancelableWait(){},async wait(){},vib(){},sfx(){},console:{warn(){}}};
 vm.createContext(c);vm.runInContext(apiCode,c);for(const m of methods)vm.runInContext(m,c);vm.runInContext(fixedCode,c);vm.runInContext(loopCode,c);w.SukunSmartSessionR1082.ids();if(!checkpoint)P.save();
 return{P,api:w.SukunSmartSessionR1082,calls:()=>calls,completions:()=>completed,saved:()=>plain(saved),setReader:f=>{reader=f},ctx:c};
}
function journalProfile(storage=new Map()){
 const w={addEventListener(){},dispatchEvent(){},SukunTabOwner:{owns:()=>true,snapshot:()=>({owned:true,epoch:1,intent:1,maintenance:false})}};
 vm.runInNewContext(journalSource,{window:w,document:{readyState:'loading',body:null,addEventListener(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},CustomEvent:class{},queueMicrotask,console,Date,setTimeout,clearTimeout});
 const progress={total:0,days:{},names:{},direct:{cat:'koruma',idx:0,form:'',count:0,devir:0,target:622,targetMode:'fixed',total:0,auto:false},journey28:null,journey99:null,smart:{queue:[step(0,{_r1082Id:'protected_first'})],i:0,name:'Korunma Okumaları',active:true,unfinished:true,completedReps:2},resume:{},canonical:{context:'smart',phase:'PAUSED',journeyKind:'single'}};
 w.SukunProgressJournal.bind({capture:()=>progress,validate:()=>true,apply:()=>true});return{api:w.SukunProgressJournal,progress,storage};
}
const checks=[];async function test(name,fn){try{await fn();checks.push({name,passed:true})}catch(error){checks.push({name,passed:false,error:error.stack||String(error)})}}
(async()=>{
 await test('A still-current cancelled reading pauses visibly, preserves two confirmed reads and retries only five remaining reads',async()=>{
  const h=harness();h.setReader(async()=>h.calls()===3?{ok:false,cancelled:true,reason:'internal-media-cancel'}:{ok:true});await h.P.loop(1);
  assert.equal(h.calls(),3);assert.equal(h.P.i,0);assert.equal(h.P.paused,true);assert.equal(h.api.snapshot().pauseReason,'audio-interrupted');assert.equal(h.api.snapshot().failed.reason,'audio-interrupted');assert.equal(h.api.snapshot().completed,2);assert.equal(h.completions(),0);assert.equal(h.saved().pauseReason,'audio-interrupted');assert.equal(h.saved().completedReps,2);
  h.setReader(async()=>({ok:true}));await h.api.retryFailed();assert.equal(h.calls(),8);assert.equal(h.completions(),1);assert.equal(h.api.snapshot().failed,null);assert.equal(h.api.snapshot().pauseReason,'');
 });
 for(const action of ['pause','stop','replacement'])await test('Late cancelled result after '+action+' cannot create a failure, new credit or auto-resume',async()=>{
  const h=harness();let release;h.setReader(()=>new Promise(resolve=>{release=resolve}));const work=h.P.loop(1);assert.equal(typeof release,'function');
  if(action==='pause')h.P.pause();else if(action==='stop')h.P.stop();else h.P.token++;
  release({ok:false,cancelled:true,reason:'retired-attempt'});await work;
  assert.equal(h.api.snapshot().failed,null);assert.equal(h.P._r982CompletedReps,0);assert.equal(h.completions(),0);assert.equal(h.calls(),1);
  if(action==='pause'){assert.equal(h.P.paused,true);assert.equal(h.api.snapshot().pauseReason,'user')}else if(action==='stop'){assert.equal(h.P.paused,false);assert.equal(h.P.playing,false)}else{assert.equal(h.P.playing,true);assert.equal(h.P.paused,false)}
 });
 await test('An explicit wait belongs to the next step and survives restore without being labelled a sound failure',async()=>{
  const h=harness([step(0,{reps:1,advance:'wait'}),step(1,{reps:1})]);await h.P.loop(1);assert.equal(h.calls(),1);assert.equal(h.P.i,1);assert.equal(h.api.snapshot().completed,0);assert.equal(h.api.snapshot().completedSteps,1);assert.equal(h.api.snapshot().pauseReason,'step-wait');assert.equal(h.api.snapshot().failed,null);const checkpoint=h.saved();
  const restored=harness([],checkpoint);restored.P.playing=false;assert.equal(restored.P.restore(),true);assert.equal(restored.calls(),0);assert.equal(restored.P.i,1);assert.equal(restored.api.snapshot().pauseReason,'step-wait');assert.equal(restored.api.snapshot().failed,null);assert.equal(restored.api.snapshot().completedSteps,1);await restored.P.play();assert.equal(restored.calls(),1);assert.equal(restored.completions(),1);
 });
 await test('Interrupted progress restores paused with Retry available and no source invoked before explicit retry',async()=>{
  const h=harness();h.setReader(async()=>h.calls()===3?{ok:false,cancelled:true}:{ok:true});await h.P.loop(1);const restored=harness([],h.saved());restored.P.playing=false;assert.equal(restored.P.restore(),true);assert.equal(restored.calls(),0);assert.equal(restored.P.paused,true);assert.equal(restored.api.snapshot().pauseReason,'audio-interrupted');assert.equal(restored.api.snapshot().failed.reason,'audio-interrupted');assert.equal(restored.api.snapshot().completed,2);await restored.api.retryFailed();assert.equal(restored.calls(),5);assert.equal(restored.completions(),1);
 });
 await test('A failed intention retains its specific retry explanation after restore',async()=>{
  const h=harness();h.api.fail(h.P.queue[0],'intention-failed');const restored=harness([],h.saved());restored.P.playing=false;restored.P.restore();assert.equal(restored.calls(),0);assert.equal(restored.api.snapshot().pauseReason,'intention-failed');assert.equal(restored.api.snapshot().failed.reason,'intention-failed');
 });
 await test('Older unfinished checkpoints with no reason restore as ordinary user pauses',async()=>{
  const h=harness();h.P.pause();const checkpoint=h.saved();delete checkpoint.pauseReason;const restored=harness([],checkpoint);restored.P.playing=false;restored.P.restore();assert.equal(restored.api.snapshot().pauseReason,'user');assert.equal(restored.api.snapshot().failed,null);assert.equal(restored.calls(),0);
 });
 for(const reason of ['step-wait','audio-interrupted','intention-failed','user'])await test('Actual pagehide cleanup keeps the existing '+reason+' explanation through paused restore',async()=>{
  const h=harness();if(['step-wait','user'].includes(reason))h.P.pause({reason});else h.api.fail(h.P.queue[0],reason);let binding;h.ctx.window.SukunTabOwner={bind:value=>{binding=value}};
  vm.runInContext(fragment('window.SukunTabOwner?.bind?.({','\n});',source.indexOf('const Z={cat:')),h.ctx);const token=h.P.token;binding.stop('pagehide');assert.equal(h.P.paused,true);assert.equal(h.P.token,token+1);assert.equal(h.saved().pauseReason,reason);
  const restored=harness([],h.saved());restored.P.playing=false;assert.equal(restored.P.restore(),true);assert.equal(restored.calls(),0);assert.equal(restored.api.snapshot().pauseReason,reason);assert.equal(restored.api.snapshot().failed?.reason||null,['step-wait','user'].includes(reason)?null:reason);
 });
 await test('An explicit pause reason can replace an old wait reason while an unqualified cleanup pause cannot',async()=>{
  const h=harness();h.P.pause({reason:'step-wait'});h.P.pause({reason:'user'});assert.equal(h.api.snapshot().pauseReason,'user');h.P.pause();assert.equal(h.api.snapshot().pauseReason,'user');
 });
 for(const reason of ['user','step-wait','audio-interrupted','intention-failed'])await test('Verified journal and fresh runtime round-trip pause reason '+reason,async()=>{
  const h=journalProfile();h.progress.smart.pauseReason=reason;assert.equal(h.api.commit('reason-checkpoint'),true);const restored=journalProfile(h.storage);assert.equal(restored.api.read().smart.pauseReason,reason);assert.equal(restored.api.read().smart.completedReps,2);
 });
 for(const invalid of ['unexpected-private-message','<script>',1,{},[]])await test('Unknown pause reason cannot overwrite a verified checkpoint: '+JSON.stringify(invalid),async()=>{
  const h=journalProfile();h.progress.smart.pauseReason='step-wait';assert.equal(h.api.commit('valid'),true);const prior=h.storage.get(h.api.key);h.progress.smart.pauseReason=invalid;assert.equal(h.api.commit('invalid'),false);assert.equal(h.storage.get(h.api.key),prior);
 });
 console.log(JSON.stringify({suite:'r1088 honest interruption, explicit step-wait and durable recovery',passed:checks.filter(c=>c.passed).length,total:checks.length,checks},null,2));if(checks.some(c=>!c.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
