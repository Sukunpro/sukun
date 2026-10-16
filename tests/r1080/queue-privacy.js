/* Synthetic queue fixtures only; no user PIN, recordings, or saved tertips. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../index.html'),'utf8');
const script=id=>html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
const KEY='sukun.globalqueue.v1';
const clone=x=>JSON.parse(JSON.stringify(x));
let passed=0;
const test=(name,fn)=>Promise.resolve().then(fn).then(()=>{passed++;process.stdout.write('PASS '+name+'\n')});
function boot(store=new Map(),open=true){
  const events=new Map(),calls={stop:[],voice:0,tts:0,fr:0,play:[],commands:[],publications:[]},timers=[];
  const w={PlaybackController:{register(){},stop:id=>calls.stop.push(id),publishNowPlaying:(x,r)=>calls.publications.push({x:clone(x),r})},KLT_ACIK:()=>open,
    SukunTerkipAllowed:x=>open||x.cat!=='berhet',sesDurdur:()=>calls.voice++,sukunTtsCancel:()=>calls.tts++,
    AudioResolver:{play:(cat,idx,it,opt)=>{calls.play.push({cat,idx,opt});return new Promise(()=>{})}},
    addEventListener:(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn)},dispatchEvent:e=>{for(const fn of events.get(e.type)||[])fn(e)},
    SukunSessionState:{snapshot:()=>({activeMode:'koruma',phase:'PLAYING'}),command:action=>{calls.commands.push(action);return Promise.resolve(true)}}};
  const context={window:w,document:{hidden:false,readyState:'complete',getElementById:()=>null,querySelector:()=>null,addEventListener(){}},
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},CustomEvent:class{constructor(type,opt){this.type=type;this.detail=opt?.detail}},
    setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout(){},structuredClone:clone,
    speechSynthesis:{cancel:()=>calls.tts++},FR:{playing:true},frStop:()=>calls.fr++,
    Z:{cat:'koruma',idx:0},ZIKIR:{berhet:{gizli:true,items:[{tr:'Synthetic private'}]},koruma:{items:[{tr:'Synthetic public'}]}},renderZikir(){},zUI(){},
    KLT:{acik:open,acikAnahtar:'synthetic-device-open'},S:{set(){}},renderCats(){},console};
  vm.createContext(context);
  vm.runInContext(html.slice(html.indexOf('function kltKilitle(){'),html.indexOf('function kltSifirla(){')),context);
  w.KLT_KILITLE=()=>{open=false;context.kltKilitle()};
  const unlock=()=>{open=true;context.KLT.acik=true;w.dispatchEvent(new context.CustomEvent('sukun:secretaccesschange'))};
  // The real getter follows lexical KLT as does the production helper.
  w.KLT_ACIK=()=>context.KLT.acik;
  vm.runInContext(script('r291-global-queue'),context);
  return{w,context,calls,store,unlock,reset(){for(const k of ['stop','play','commands','publications'])calls[k]=[];for(const k of ['voice','tts','fr'])calls[k]=0},setOpen(v){open=v;context.KLT.acik=v}};
}
const pub=(label='public')=>({type:'silence',ms:90000,label});
const priv=(label='Synthetic private')=>({type:'zikir',cat:'berhet',idx:0,reps:2,label});
(async()=>{
 await test('Lock parks private steps without deletion and redacts all public queue getters',()=>{
   const b=boot();b.w.GlobalQueue.setQueue([pub('A'),priv(),pub('B')],'Private tertip');b.reset();
   assert.equal(b.w.SukunBerhetGatePrivacy.lock(),true);
   assert.deepEqual(clone(b.w.GlobalQueue.state.queue).map(x=>x.label),['A','B']);
   assert.deepEqual(clone(b.w.GlobalQueue.queue).map(x=>x.label),['A','B']);
   assert.equal(b.w.GlobalQueue.name,'Global Akış');
   assert.equal(JSON.stringify(b.w.GlobalQueue).includes('Synthetic private'),false);
   const saved=JSON.parse(b.store.get(KEY));assert.equal(saved.parkedPrivate.items.length,1);assert.equal(saved.parkedPrivate.items[0].item.reps,2);
   assert.equal(b.calls.fr,0);assert.equal(b.calls.voice,0);assert.equal(b.calls.tts,0);
   b.unlock();assert.deepEqual(clone(b.w.GlobalQueue.state.queue).map(x=>x.label),['A','Synthetic private','B']);assert.equal(b.w.GlobalQueue.state.playing,false);
 });
 await test('Locked reload and public edits preserve private steps and public order',()=>{
   const b=boot();b.w.GlobalQueue.setQueue([pub('A'),priv('Private 1'),pub('B'),priv('Private 2'),pub('C')]);b.w.SukunBerhetGatePrivacy.lock();
   const r=boot(b.store,false);assert.deepEqual(clone(r.w.GlobalQueue.queue).map(x=>x.label),['A','B','C']);
   r.w.GlobalQueue.remove(0);r.w.GlobalQueue.move(1,-1);r.w.GlobalQueue.add(pub('D'));
   const again=boot(r.store,false);assert.deepEqual(clone(again.w.GlobalQueue.queue).map(x=>x.label),['C','B','D']);
   again.unlock();assert.deepEqual(clone(again.w.GlobalQueue.queue).map(x=>x.label),['Private 1','C','Private 2','B','D']);assert.equal(again.w.GlobalQueue.state.playing,false);
 });
 await test('Replacing visible public queue while locked does not erase parked private tertip steps',()=>{
   const b=boot();b.w.GlobalQueue.setQueue([pub('A'),priv(),pub('B')]);b.w.SukunBerhetGatePrivacy.lock();
   b.w.GlobalQueue.setQueue([pub('New')],'New public');b.unlock();assert.deepEqual(clone(b.w.GlobalQueue.queue).map(x=>x.label),['New','Synthetic private']);assert.equal(b.w.GlobalQueue.name,'New public');
 });
 await test('Legacy saved private queue migrates on locked load and survives second reload',()=>{
   const store=new Map([[KEY,JSON.stringify({queue:[priv(),pub()],i:0,name:'Berhetiyye custom',unfinished:true,itemElapsed:1500})]]);
   const b=boot(store,false);assert.equal(b.w.GlobalQueue.state.queue.length,1);assert.equal(b.w.GlobalQueue.name,'Global Akış');
   const r=boot(store,false);r.unlock();assert.equal(r.w.GlobalQueue.state.queue[0].cat,'berhet');assert.equal(r.w.GlobalQueue.state.itemElapsed,1500);assert.equal(r.w.GlobalQueue.state.restored,true);assert.equal(r.w.GlobalQueue.state.playing,false);
 });
 await test('Active private queue voice is fenced and stopped without FR or ambience stop',()=>{
   const b=boot();b.w.GlobalQueue.setQueue([priv(),pub()]);b.reset();b.w.GlobalQueue.play();assert.equal(b.calls.play.length,1);const current=b.calls.play[0].opt.isCurrent;assert.equal(current(),true);
   b.w.SukunBerhetGatePrivacy.lock();assert.equal(current(),false);assert.equal(b.calls.voice,1);assert.equal(b.calls.tts,1);assert.equal(b.calls.fr,0);assert.deepEqual(b.calls.stop,[]);assert.equal(b.w.GlobalQueue.state.playing,false);
   b.unlock();assert.equal(b.calls.play.length,1);assert.equal(b.w.GlobalQueue.state.playing,false);assert.equal(b.w.GlobalQueue.state.restored,true);
 });
 await test('A stale private promise cannot cancel newly selected public speech',()=>{
   const b=boot();b.w.GlobalQueue.setQueue([priv(),pub()]);b.w.GlobalQueue.play();b.context.Z.cat='koruma';b.context.Z.idx=0;b.reset();
   b.w.SukunBerhetGatePrivacy.lock();assert.equal(b.calls.voice,0);assert.equal(b.calls.tts,0);assert.equal(b.calls.fr,0);
   const stopped=boot();stopped.w.GlobalQueue.setQueue([priv(),pub()]);stopped.w.GlobalQueue.play();stopped.w.GlobalQueue.stop();stopped.context.Z.cat='koruma';stopped.reset();
   stopped.w.SukunBerhetGatePrivacy.lock();assert.equal(stopped.calls.voice,0);assert.equal(stopped.calls.tts,0);assert.equal(stopped.calls.fr,0);
 });
 await test('Legacy direct lock cancels its exact private voice after changing selection to Esma',()=>{
   const b=boot();b.w.GlobalQueue.setQueue([priv(),pub()]);b.w.GlobalQueue.play();b.reset();b.w.KLT_KILITLE();
   assert.equal(b.context.Z.cat,'esma');assert.equal(b.calls.voice,1);assert.equal(b.calls.tts,1);assert.equal(b.calls.fr,0);assert.equal(b.w.GlobalQueue.state.playing,false);
   assert.equal(b.w.GlobalQueue.queue.some(x=>x.cat==='berhet'),false);b.unlock();assert.equal(b.w.GlobalQueue.queue[0].cat,'berhet');assert.equal(b.w.GlobalQueue.state.playing,false);
 });
 await test('Legacy direct lock leaves newly selected public speech and stale queue attempts untouched',()=>{
   const b=boot();b.w.GlobalQueue.setQueue([priv(),pub()]);b.w.GlobalQueue.play();b.context.Z.cat='koruma';b.context.Z.idx=0;b.reset();b.w.KLT_KILITLE();
   assert.equal(b.calls.voice,0);assert.equal(b.calls.tts,0);assert.equal(b.calls.fr,0);
   const p=boot();p.w.GlobalQueue.setQueue([pub(),priv()]);p.w.GlobalQueue.play();p.reset();p.w.KLT_KILITLE();assert.equal(p.w.GlobalQueue.state.playing,true);assert.equal(p.calls.voice,0);assert.equal(p.calls.tts,0);assert.equal(p.calls.fr,0);
 });
 await test('Active public queue continues during hide and restore of future private steps',()=>{
   const b=boot();b.w.GlobalQueue.setQueue([pub(),priv()]);b.reset();b.w.GlobalQueue.play();const token=b.w.GlobalQueue.state.token;b.w.SukunBerhetGatePrivacy.lock();
   assert.equal(b.w.GlobalQueue.state.playing,true);assert.equal(b.w.GlobalQueue.state.token,token);assert.equal(b.calls.voice,0);assert.equal(b.calls.tts,0);assert.equal(b.calls.fr,0);
   b.unlock();assert.equal(b.w.GlobalQueue.state.playing,true);assert.equal(b.w.GlobalQueue.state.i,0);assert.equal(b.w.GlobalQueue.state.token,token);
 });
 await test('Only the active private module child is stopped',()=>{
   const b=boot();b.w.GlobalQueue.setQueue([{type:'module',provider:'berhetiyye',title:'Synthetic module'},pub()]);b.reset();b.w.PlaybackController.play=()=>{};b.w.GlobalQueue.play();b.w.SukunBerhetGatePrivacy.lock();
   assert.deepEqual(b.calls.stop,['berhetiyye']);assert.equal(b.calls.fr,0);assert.equal(b.calls.voice,0);assert.equal(b.calls.tts,0);
 });
 await test('Trusted provider unlock is memory only, rejects inactive or absent provider',()=>{
   const b=boot(new Map(),false);assert.equal(b.w.SukunBerhetGatePrivacy.unlock(),false);
   b.w.SUKUN_BERHET_ACCESS_PROVIDER={isActive:()=>false};assert.equal(b.w.SukunBerhetGatePrivacy.unlock(),false);
   b.w.SUKUN_BERHET_ACCESS_PROVIDER={isActive:()=>{throw Error('offline')}};assert.equal(b.w.SukunBerhetGatePrivacy.unlock(),false);
   b.w.SUKUN_BERHET_ACCESS_PROVIDER={isActive:()=>true};assert.equal(b.w.SukunBerhetGatePrivacy.unlock(),true);
   assert.equal([...b.store.keys()].some(x=>/kilit/i.test(x)),false);
 });
 await test('Active Berhet foreground uses scoped session stop before legacy lock; public foreground does not',()=>{
   const b=boot();b.w.SukunSessionState.snapshot=()=>({activeMode:'berhet',phase:'PLAYING'});let stoppedWhileOpen=false;b.w.SukunSessionState.command=action=>{b.calls.commands.push(action);stoppedWhileOpen=b.w.KLT_ACIK();return Promise.resolve(true)};
   b.w.SukunBerhetGatePrivacy.lock();assert.deepEqual(b.calls.commands,['stop']);assert.equal(stoppedWhileOpen,true);assert.equal(b.calls.fr,0);
   const p=boot();p.w.SukunBerhetGatePrivacy.lock();assert.deepEqual(p.calls.commands,[]);
 });
 await test('Locked backup policy excludes the record containing parked entries',()=>{
   const b=boot(new Map(),false);vm.runInContext(script('r300-secret-access-policy'),b.context);assert.equal(b.w.SukunSecretPolicy.privateLocalKey(KEY),true);b.setOpen(true);assert.equal(b.w.SukunSecretPolicy.privateLocalKey(KEY),false);
 });
 await test('Repeated lock/unlock does not duplicate private steps; returned queue copy cannot mutate state',()=>{
   const b=boot();b.w.GlobalQueue.setQueue([priv(),priv('Second private')]);
   for(let i=0;i<3;i++){b.w.SukunBerhetGatePrivacy.lock();b.w.SukunBerhetGatePrivacy.lock();assert.equal(b.w.GlobalQueue.queue.length,0);b.unlock();assert.equal(b.w.GlobalQueue.queue.length,2)}
   const visible=b.w.GlobalQueue.queue;visible.length=0;assert.equal(b.w.GlobalQueue.queue.length,2);
 });
 process.stdout.write(`${passed}/${passed} queue privacy checks passed\n`);
})().catch(e=>{console.error(e);process.exitCode=1});
