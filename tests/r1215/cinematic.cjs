/* Behaviour checks for motion policy and the explicit existing-owner bridge. */
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/runtime/cinematic-r1215.js','utf8');
function fixture(){
 const calls=[],nodes={},data=new Map([['sukun.performance.r920','cinematic']]);
 const media={matches:false,addEventListener(){}};
 const session={activeMode:'esma',activeIndex:0,count:128,target:298,phase:'PAUSED'};
 const document={readyState:'loading',hidden:false,documentElement:{dataset:{}},body:{dataset:{perf:'tam'}},getElementById:id=>nodes[id]||null,addEventListener(){},querySelector:()=>null};
 const w={matchMedia:()=>media,SukunPerformance:{mode:'tam',apply(mode){calls.push(['global',mode]);this.mode=mode}},SukunSceneEngine:{snapshot:()=>({profile:data.get('sukun.performance.r920')}),setProfile(value){calls.push(['scene',value]);data.set('sukun.performance.r920',value);return true}},SukunSessionState:{peek:()=>session},toast:message=>calls.push(['toast',message])};
 const c={window:w,document,localStorage:{getItem:k=>data.get(k)},Event:class{constructor(type,options){this.type=type;this.bubbles=options?.bubbles}},MutationObserver:class{observe(){} disconnect(){}},requestAnimationFrame(){return 1},cancelAnimationFrame(){}};
 vm.createContext(c);vm.runInContext(source,c);
 return {c,w,document,media,nodes,data,calls,session,api:w.SukunCinematic};
}
const f=fixture(),before=JSON.stringify(f.session);
assert.equal(f.api.snapshot().effective,'cinematic');assert.equal(f.calls.length,0,'reading saved quality never rewrites another existing preference');
f.media.matches=true;assert.equal(f.api.snapshot().effective,'saving');assert.equal(f.api.snapshot().profile,'cinematic','reduced motion does not erase user choice');
f.media.matches=false;f.document.hidden=true;assert.equal(f.api.snapshot().effective,'saving');assert.equal(f.api.snapshot().hidden,true);
f.document.hidden=false;f.w.SukunPerformance.mode='pil';assert.equal(f.api.snapshot().effective,'saving','global battery choice overrides decorative motion');
f.w.SukunPerformance.mode='tam';f.data.set('sukun.performance.r920','broken');assert.equal(f.api.snapshot().profile,'balanced');
assert.equal(f.api.setQuality('wrong'),false);assert.equal(f.calls.length,0,'invalid profile has no side effect');
const saver={value:'premium',dispatchEvent(event){f.calls.push(['saver',this.value,event.type,event.bubbles])}};f.nodes.kandilPowerSel=saver;
f.document.hidden=true; // avoids UI mounting in this owner-bridge test
assert.equal(f.api.setQuality('saving'),true);assert.deepEqual(f.calls,[['scene','saving'],['global','pil'],['saver','saving','change',true]]);
assert.equal(JSON.stringify(f.session),before,'quality changes cannot mutate active name, count, target or phase');
assert.equal(f.api.snapshot().profile,'saving');assert.equal(f.document.documentElement.dataset.r1215Motion,'hidden');
f.calls.length=0;f.w.SukunSceneEngine.setProfile=()=>false;assert.equal(f.api.setQuality('balanced'),false);assert.equal(f.calls.length,0,'failed canonical profile does not apply a partial bridge');
// Identity-only transition: count updates must not repeatedly animate a name.
const animationSource=source.slice(source.indexOf('function identity()'),source.indexOf('function label('));
let runs=0,cancels=0;const c={w:{SukunSessionState:{peek:()=>f.session}},$:(id)=>({animate(){runs++;return {cancel(){cancels++}}}}),policy:()=>({effective:'cinematic'})};vm.createContext(c);vm.runInContext('let lastIdentity=null,nameAnimations=[];'+animationSource+'this.paint=nameTransition;',c);
c.paint();assert.equal(runs,0);f.session.count++;c.paint();assert.equal(runs,0,'a count paint does not replay name entrance');f.session.activeIndex=1;c.paint();assert.equal(runs,2);f.session.count++;c.paint();assert.equal(runs,2);c.policy=()=>({effective:'saving'});f.session.activeIndex=2;c.paint();assert.equal(runs,2,'saving profile suppresses name entrance');
// Stable paints must be mutation-free: old document-wide observers also see
// text and hidden writes, even when a browser would render the same pixels.
let writes=0;
const tracked=object=>new Proxy(object,{set(target,key,value){writes++;target[key]=value;return true}});
const nativeLabel={firstChild:tracked({nodeType:3,textContent:'Ambiyans kalitesi'})};
const qualityNodes={};
for(const id of ['r920Performance','r1215SaverQuality','r1215SettingsQuality']){
 qualityNodes[id]=tracked({value:'cinematic',options:[['cinematic','Sinematik'],['balanced','Dengeli'],['saving','Tasarruf']].map(([value,textContent])=>tracked({value,textContent})),closest:()=>nativeLabel,previousElementSibling:tracked({textContent:'Ambiyans kalitesi'})});
 qualityNodes[id+'Help']=tracked({textContent:'same help'});
}
qualityNodes.r1215PracticeQualityHelp=tracked({textContent:'same help'});
for(const id of ['kandilPowerLabel','kandilPowerSel','kandilPowerPrefLabel','kandilPowerPref'])qualityNodes[id]={hasAttribute:()=>true,setAttribute(){writes++}};
const q={$:id=>qualityNodes[id],d:{activeElement:null},modes:['cinematic','balanced','saving'],requested:()=> 'cinematic',tr:a=>a,text:(el,value)=>{if(el&&el.textContent!==value)el.textContent=value},help:()=> 'same help',label:value=>({cinematic:'Sinematik',balanced:'Dengeli',saving:'Tasarruf'})[value]};
vm.createContext(q);vm.runInContext(source.slice(source.indexOf('function qualityControl('),source.indexOf('function locationDialog('))+'this.paint=mountQuality;',q);
q.paint();q.paint();assert.equal(writes,0,'identical quality paints do not change text, selected value or replaced attributes');
const vakit={dataset:tracked({r1215Location:'missing'})},button=tracked({hidden:false,textContent:'Konum seç'}),names={dataset:tracked({r1215Cards:'1'}),children:[{hidden:false},{hidden:true}]};
const facts={$:id=>id==='r1194Timing'?{querySelector:()=>vakit}:id==='r1215ChooseLocation'?button:null,d:{querySelector:()=>names},w:{SukunTimingInfo:{snapshot:()=>({vakit:null})}},safe:fn=>fn(),text:q.text,tr:a=>a};
vm.createContext(facts);vm.runInContext(source.slice(source.indexOf('function saverFacts()'),source.indexOf('function watchSaver()'))+'this.paint=saverFacts;',facts);
facts.paint();facts.paint();assert.equal(writes,0,'unchanged saver facts do not rewrite hidden or data attributes');
let queued=0,callback,on=false;
const observed={classList:{contains:()=>on}},ob={$:()=>observed,d:{hidden:false},queue:()=>queued++,MutationObserver:class{constructor(fn){callback=fn}observe(){}disconnect(){}}};
vm.createContext(ob);vm.runInContext('let saverObserver=null,observedSaver=null,saverWasOn=false;'+source.slice(source.indexOf('function watchSaver()'),source.indexOf('function sync()'))+'this.watch=watchSaver;',ob);
ob.watch();callback();assert.equal(queued,0);on=true;callback();assert.equal(queued,1);callback();assert.equal(queued,1,'peek/hover mutations while on do not enqueue another paint');
// Full module lifecycle: pagehide may precede visibilitychange, and frozen
// pages must not restart motion from already queued selection/view events.
function lifecycleFixture(){
 const events=new Map(),frames=new Map(),animations=[],session={activeMode:'esma',activeIndex:0,count:12,target:66,phase:'PAUSED'};
 let serial=0;
 const listen=target=>(name,fn)=>{const key=target+':'+name;if(!events.has(key))events.set(key,[]);events.get(key).push(fn)};
 const animated={animate(){const a={cancelled:false,cancel(){this.cancelled=true}};animations.push(a);return a}};
 const nodes={r1215Atmosphere:animated,r920NameInfo:animated,r920SceneTitle:animated};
 const media={matches:false,addEventListener:listen('media')};
 const document={readyState:'complete',hidden:false,documentElement:{dataset:{}},body:{dataset:{perf:'tam'}},getElementById:id=>nodes[id]||null,addEventListener:listen('document'),querySelector:()=>null};
 const w={addEventListener:listen('window'),matchMedia:()=>media,SukunPerformance:{mode:'tam'},SukunSceneEngine:{snapshot:()=>({profile:'cinematic'})},SukunSessionState:{peek:()=>session,subscribe:fn=>listen('session')('change',fn)}};
 const context={window:w,document,localStorage:{getItem:()=> 'cinematic'},MutationObserver:class{observe(){}disconnect(){}},requestAnimationFrame(fn){const id=++serial;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id)};
 vm.createContext(context);vm.runInContext(source,context);
 return {document,media,frames,animations,session,api:w.SukunCinematic,emit(target,name,detail){for(const fn of events.get(target+':'+name)||[])fn({detail})},flush(){const pending=[...frames.values()];frames.clear();for(const fn of pending)fn()}};
}
const life=lifecycleFixture(),savedSession=JSON.stringify(life.session);
assert.equal(life.document.documentElement.dataset.r1215Motion,'cinematic');
life.emit('window','sukun:r616viewchange',{view:'zikir'});
assert.equal(life.api.snapshot().transitioning,true);assert.equal(life.frames.size,1);
life.emit('window','pagehide');
assert.equal(life.document.hidden,false,'exercise pagehide before browser visibility notification');
assert.equal(life.frames.size,0,'pagehide cancels pending paint');
assert.equal(life.document.documentElement.dataset.r1215Motion,'hidden');
assert.equal(life.api.snapshot().transitioning,false);assert(life.animations.every(a=>a.cancelled));
const suspendedAnimations=life.animations.length;
life.emit('window','sukun:r616viewchange',{view:'atlas'});life.emit('session','change');
assert.equal(life.frames.size,0);assert.equal(life.animations.length,suspendedAnimations,'suspended page cannot restart effects');
life.emit('window','pageshow');life.flush();
assert.equal(life.document.documentElement.dataset.r1215Motion,'cinematic');
life.emit('window','sukun:r616viewchange',{view:'zikir'});life.emit('document','freeze');
assert.equal(life.frames.size,0);assert.equal(life.api.snapshot().hidden,true);assert.equal(life.api.snapshot().transitioning,false);
life.emit('document','visibilitychange');assert.equal(life.api.snapshot().hidden,true,'visibility alone does not undo a frozen lifecycle');
life.emit('document','resume');life.flush();assert.equal(life.api.snapshot().effective,'cinematic');
life.emit('window','sukun:r616viewchange',{view:'atlas'});life.media.matches=true;life.emit('media','change');life.flush();
assert.equal(life.api.snapshot().effective,'saving');assert.equal(life.api.snapshot().transitioning,false);assert.equal(life.api.snapshot().profile,'cinematic');
life.media.matches=false;life.emit('media','change');life.flush();assert.equal(life.api.snapshot().effective,'cinematic');
assert.equal(JSON.stringify(life.session),savedSession,'lifecycle and reduced motion preserve the active practice');
console.log('PASS: preference preservation, motion policy, native owner bridge, session invariance, identity-only transitions, mutation-free repeated paints, bounded saver observer and suspend/resume lifecycle.');
