'use strict';
// Execute the production selection/focus helpers and complete dock/rail
// runtimes. DOM geometry, input policy and lifecycle events are controlled.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'nero.html'),'utf8'),interfaceCode=fs.readFileSync(path.join(root,'assets/runtime/interface-r920.js'),'utf8');
function block(source,start,end){const i=source.indexOf(start),j=source.indexOf(end,i+start.length);assert(i>=0&&j>i,start);return source.slice(i,j)}
function script(id){return block(html,'<script id="'+id+'">','</script>').replace(/^<script[^>]*>/,'')}
function hub(){return{handlers:new Map(),addEventListener(type,fn){if(!this.handlers.has(type))this.handlers.set(type,new Set());this.handlers.get(type).add(fn)},removeEventListener(type,fn){this.handlers.get(type)?.delete(fn)},fire(type,values={}){const e={type,...values};for(const fn of [...(this.handlers.get(type)||[])])fn(e);return e}}}
function classes(...names){const set=new Set(names);return{contains:n=>set.has(n),add:(...ns)=>ns.forEach(n=>set.add(n)),remove:(...ns)=>ns.forEach(n=>set.delete(n)),toggle(n,on){const next=on??!set.has(n);next?set.add(n):set.delete(n);return next}}}
function style(){const values=new Map();return{getPropertyValue:k=>values.get(k)||'',getPropertyPriority:()=>'',setProperty:(k,v)=>values.set(k,String(v)),removeProperty:k=>values.delete(k)}}
function clock(){let now=1000,seq=0;const raf=new Map(),timers=new Map();return{raf,timers,now:()=>now,requestAnimationFrame:fn=>{raf.set(++seq,fn);return seq},cancelAnimationFrame:id=>raf.delete(id),setTimeout:(fn,ms)=>{timers.set(++seq,{fn,at:now+ms});return seq},clearTimeout:id=>timers.delete(id),frame(){const ready=[...raf];raf.clear();for(const[,fn]of ready)fn(now)},tick(ms){const end=now+ms;let guard=0;for(;;){const due=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;assert(++guard<250,'bounded lifecycle scheduling');timers.delete(due[0]);now=due[1].at;due[1].fn()}now=end}}}
function policy(){let interaction=0,panning=false,quiet=false;const idleCallbacks=[];return{captureNavigation:()=>({interaction}),navigationCurrent:t=>t.interaction===interaction,suppress(){},input(){interaction++},setPanning:v=>{panning=v},setQuiet:v=>{quiet=v},active:()=>panning||quiet,snapshot:()=>({active:panning,quietMs:quiet?160:0}),whenIdle(fn){if(panning||quiet)idleCallbacks.push(fn);else fn()},idleCallbacks,settle(){panning=false;quiet=false;const callbacks=idleCallbacks.splice(0);for(const fn of callbacks)fn()}}}
const noop=()=>{};
function selection(){
 const timer=clock(),intent=policy(),writes=[];let scrollY=0,anchorPosition=200;
 const anchor={isConnected:true,getBoundingClientRect:()=>({top:anchorPosition-scrollY})};
 const w={get scrollY(){return scrollY},get scrollX(){return 0},scrollBy(options,dy){const delta=typeof options==='object'?options.top:dy;writes.push({kind:'by',from:scrollY,delta,options});scrollY+=delta},scrollTo(options,y){const top=typeof options==='object'?options.top:y;writes.push({kind:'to',from:scrollY,to:top,options});scrollY=top},SukunViewportPolicy:intent,SukunInteractionGateR732:intent,currentZikirState:{refresh:noop},dispatchEvent:noop};
 const c={window:w,document:{documentElement:{scrollTop:0},hidden:false},NEFS:[{n:'Test',ei:1,esma:'Test',fb:1}],CAKRA:[{fc:1}],Z:{cat:'esma',idx:0},FR:{c:1,b:1,playing:false},S:{set:noop},mertebeZikir:()=>true,nefsSel:-1,cakraSel:-1,stopJourney:noop,frRetune:noop,frStart:noop,syncFreqUI:noop,saveSettings:noop,nefsRender:noop,cakraRender:noop,nefsLadderRender:noop,...timer,performance:{now:timer.now},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},Date,Number,Math};
 vm.createContext(c);vm.runInContext(block(html,'function mertebeApply(i,opt={}){',"$('#nefsRows').addEventListener('click'"),c);
 return{c,intent,timer,writes,anchor,y:()=>scrollY,userScroll(value){scrollY=value;intent.input()},layoutShift(value){anchorPosition+=value},setY:value=>{scrollY=value},begin:()=>c.mertebeApply(0,{preserveScroll:true,anchor})};
}
function focus(){
 const timer=clock(),intent=policy(),writes=[],tab={scrollTop:43};let active=false,x=7,y=280;
 const w={get scrollX(){return x},get scrollY(){return y},scrollTo(o){writes.push({...o});x=o.left;y=o.top},SukunViewportPolicy:intent,SukunInteractionGateR732:intent,SUKUN_TEFEKKUR:{active:()=>active}};
 const c={window:w,document:{hidden:false},$:id=>id==='tab-zkr'?tab:null,restorePresentation:noop,focusGeneration:0,focusOrigin:null,...timer};
 vm.createContext(c);vm.runInContext(block(interfaceCode,'function beginFocus(){','// r979:'),c);
 return{c,intent,timer,writes,tab,active:v=>{active=v},y:()=>y,setY:v=>{y=v},begin:()=>c.beginFocus(),settle:v=>c.settleFocus(v)};
}
function node(id,rect={x:0,y:600,top:600,left:0,right:390,bottom:720,width:390,height:120}){return Object.assign(hub(),{id,isConnected:true,hidden:false,classList:classes(),style:style(),dataset:{},getBoundingClientRect:()=>rect,setAttribute:noop,getAttribute:()=>'',querySelector:()=>null,contains:()=>false,setPointerCapture(id){this.captured=id},releasePointerCapture(id){this.released=id;if(this.captured===id)this.captured=null},scrollTop:0,scrollLeft:0})}
function dock(){
 const timer=clock(),w=hub(),doc=hub(),rootNode=node('html'),body=node('body'),host=node('r170Now'),grip=node('r633DockGrip'),probe=node('r633SafeProbe');rootNode.clientHeight=844;doc.hidden=false;doc.readyState='loading';doc.documentElement=rootNode;doc.body=body;
 const nodes=new Map([[host.id,host],[grip.id,grip],[probe.id,probe]]);doc.getElementById=id=>nodes.get(id)||null;doc.querySelectorAll=()=>[];doc.querySelector=()=>null;
 let saves=0,measures=0;const c={window:w,document:doc,innerHeight:844,innerWidth:390,localStorage:{getItem:()=>'-20',setItem:()=>saves++},getComputedStyle:()=>({display:'block',visibility:'visible',opacity:'1',paddingBottom:'0',position:'fixed'}),MutationObserver:class{observe(){}disconnect(){}},performance:{now:timer.now},Date,Number,Math,Object,Set,...timer};
 const source=script('r633-flow-dock-placement-runtime').replace(/\}\)\(\);\s*$/,"window.__dockFixture={bindGrip,read:()=>({drag,y,quietUntil,deferred}),replaceMeasure:fn=>{measure=fn}};})();");
 vm.createContext(c);vm.runInContext(source,c);w.__dockFixture.replaceMeasure(()=>{measures++});w.__dockFixture.bindGrip(grip);
 const event=(type,id=1,clientY=100)=>({pointerId:id,pointerType:'touch',isPrimary:true,button:0,clientY,target:grip,preventDefault:noop,stopImmediatePropagation:noop});
 return{c,w,doc,grip,host,body,timer,read:w.__dockFixture.read,saves:()=>saves,measures:()=>measures,
 down(id=1,y=100){const e=event('pointerdown',id,y);doc.fire('pointerdown',e);grip.fire('pointerdown',e)},move(id=1,y=70){grip.fire('pointermove',event('pointermove',id,y))},end(type,id=1){const e=event(type,id);doc.fire(type,e);grip.fire(type,e)},mode(){w.fire('sukun:r698modechange',{detail:{mode:'max'}})},cancel(type){if(type==='hidden'){doc.hidden=true;doc.fire('visibilitychange')}else w.fire(type)},returnVisible(){doc.hidden=false;doc.fire('visibilitychange');w.fire('pageshow')}};
}
function rail(){
 const timer=clock(),intent=policy(),w=hub(),r=node('zList'),a=node('verse-a'),b=node('verse-b'),calls=[];let selected=a,railNode=r,ancestorBlocked=false;
 r.classList.add('compactOneRow');r.clientWidth=200;r.offsetLeft=0;a.offsetLeft=250;a.clientWidth=40;b.offsetLeft=400;b.clientWidth=40;r.querySelector=()=>selected;r.scrollTo=opt=>{calls.push({...opt});r.scrollLeft=opt.left};
 r.closest=()=>r.hidden||ancestorBlocked?r:null;
 const doc={hidden:false,readyState:'loading',getElementById:id=>id==='zList'?railNode:null,addEventListener:noop};w.SukunViewportPolicy=intent;w.SukunInteractionGateR732=intent;
 const c={window:w,document:doc,addEventListener:w.addEventListener.bind(w),Date,Number,Math,Object,...timer};vm.createContext(c);vm.runInContext(script('sukun-r900-horizontal-name-rail-runtime'),c);
 return{c,w,r,a,b,intent,timer,calls,select:v=>{selected=v},replaceRail:()=>{railNode=node('replacement-rail')},blockAncestor:()=>{ancestorBlocked=true},reveal:()=>w.SukunR900NameRail.reveal()};
}
const results=[];function test(name,fn){try{fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e.stack})}}
for(const step of ['first-frame','second-frame','third-frame','fourth-frame','delayed-timer','late-dock-settle'])test('Nefs selection does not restore an old position after input before '+step,()=>{
 const f=selection();f.begin();const frameCount={'first-frame':0,'second-frame':1,'third-frame':2,'fourth-frame':3,'delayed-timer':4,'late-dock-settle':4}[step];for(let i=0;i<frameCount;i++)f.timer.frame();
 if(step==='late-dock-settle')f.timer.tick(110);
 f.userScroll(60);for(let i=0;i<4;i++)f.timer.frame();f.timer.tick(step==='late-dock-settle'?170:280);assert.equal(f.y(),60);assert.equal(f.writes.length,0);
});
test('Nefs quiet layout shift still restores its selected anchor instantly',()=>{const f=selection();f.begin();f.layoutShift(35);f.timer.frame();assert.equal(f.y(),35);assert.equal(f.writes.length,1);assert.equal(f.writes[0].options.behavior,'instant');f.timer.frame();f.timer.tick(280);assert.equal(f.writes.length,1)});
test('Quiet selection corrects evolving anchor geometry across four bounded frames',()=>{const f=selection();f.begin();for(let i=1;i<=4;i++){f.layoutShift(10);f.timer.frame();assert.equal(f.y(),i*10)}assert.equal(f.writes.length,4);assert(f.writes.every(x=>x.options.behavior==='instant'));assert.equal(f.timer.raf.size,0);f.layoutShift(10);f.timer.frame();assert.equal(f.y(),40);assert.equal(f.writes.length,4)});
test('Post-click quiet window without an active contact preserves legitimate anchor correction',()=>{const f=selection();f.intent.setQuiet(true);f.begin();f.layoutShift(35);f.timer.frame();assert.equal(f.y(),35);assert.equal(f.writes.length,1);assert.equal(f.writes[0].options.behavior,'instant')});
test('Late dock layout shift settles its quiet Nefs anchor at280ms',()=>{const f=selection();f.begin();f.timer.frame();f.timer.frame();f.timer.tick(110);f.layoutShift(33);f.timer.tick(170);assert.equal(f.y(),33);assert.equal(f.writes.length,1);assert.equal(f.writes[0].options.behavior,'instant')});
test('Nefs correction without an anchor uses the native object scrollTo API instantly',()=>{const f=selection();f.c.mertebeApply(0,{preserveScroll:true});f.setY(40);f.timer.frame();assert.equal(f.y(),0);assert.equal(f.writes.length,1);assert.equal(f.writes[0].kind,'to');assert.equal(f.writes[0].options.behavior,'instant')});
for(const state of ['panning','hidden'])test('Nefs delayed restoration yields while '+state,()=>{const f=selection();f.begin();f.setY(70);if(state==='panning')f.intent.setPanning(true);else f.c.document.hidden=true;f.timer.frame();f.timer.frame();f.timer.tick(280);assert.equal(f.y(),70);assert.equal(f.writes.length,0)});
for(const active of [true,false])test('Tefekkür '+(active?'entry':'exit')+' immediate reset works but a new touch cancels its delayed reset',()=>{
 const f=focus();f.begin();f.active(true);if(!active){f.setY(0);f.tab.scrollTop=0;f.active(false)}f.settle(active);assert.equal(f.y(),active?0:280);assert.equal(f.tab.scrollTop,active?0:43);
 f.intent.input();f.setY(96);f.tab.scrollTop=77;f.timer.frame();assert.equal(f.y(),96);assert.equal(f.tab.scrollTop,77);assert.equal(f.writes.length,1);
});
test('Quiet focus restoration still repeats once after layout settles',()=>{const f=focus();f.begin();f.active(true);f.settle(true);f.setY(20);f.tab.scrollTop=15;f.timer.frame();assert.equal(f.y(),0);assert.equal(f.tab.scrollTop,0);assert.equal(f.writes.length,2)});
for(const state of ['panning','hidden'])test('Focus delayed reset yields while '+state,()=>{const f=focus();f.begin();f.active(true);f.settle(true);f.setY(80);f.tab.scrollTop=70;if(state==='panning')f.intent.setPanning(true);else f.c.document.hidden=true;f.timer.frame();assert.equal(f.y(),80);assert.equal(f.tab.scrollTop,70);assert.equal(f.writes.length,1)});
test('A replacement focus transition retires the previous frame callback',()=>{const f=focus();f.begin();f.active(true);f.settle(true);f.active(false);f.settle(false);f.timer.frame();assert.equal(f.y(),280);assert.equal(f.tab.scrollTop,43);assert.equal(f.writes.length,3)});
for(const lifecycle of ['blur','pagehide','hidden'])for(const moved of [false,true])test('Dock '+lifecycle+' clears '+(moved?'moved':'stationary')+' abandoned contact and allows the next mode action',()=>{
 const f=dock();f.down();if(moved)f.move();const y=f.read().y;assert(f.read().drag);f.mode();assert.equal(f.measures(),0);f.cancel(lifecycle);assert.equal(f.read().drag,null);assert.equal(f.read().y,y);assert.equal(f.body.classList.contains('r633-dock-dragging'),false);assert.equal(f.host.classList.contains('r633-dragging'),false);assert.equal(f.grip.captured,null);assert.equal(f.saves(),moved?1:0);
 f.returnVisible();f.timer.tick(200);f.mode();f.timer.frame();assert(f.measures()>0);assert.equal(f.w.SukunFlowDockPlacement.snapshot().dragging,false);
});
test('Old dock release cannot retire a new contact; new contact accepts movement and ends normally',()=>{
 const f=dock();f.down(1);f.move(1,75);f.cancel('blur');f.down(2);assert.equal(f.read().drag.id,2);f.end('pointercancel',1);assert.equal(f.read().drag.id,2);f.move(2,85);assert.equal(f.read().drag.moved,true);f.end('pointerup',2);assert.equal(f.read().drag,null);assert.equal(f.grip.captured,null);
});
test('The first subsequent dock-mode click schedules geometry after its normal contact release',()=>{
 const f=dock();f.down(1);f.cancel('blur');f.timer.frame();const before=f.measures(),target={closest:selector=>selector.includes('[data-r588-mode]')?target:null};
 f.doc.fire('pointerdown',{pointerId:2,pointerType:'touch',target});f.doc.fire('pointerup',{pointerId:2,pointerType:'touch',target});f.doc.fire('click',{target});f.timer.tick(200);f.timer.frame();assert(f.measures()>before);assert.equal(f.read().drag,null);assert.equal(f.w.SukunInteractionGateR732.snapshot().pointers,0);
});
test('Horizontal rail quiet reveal centers the selected name in one instant action',()=>{const f=rail();f.reveal();f.timer.frame();assert.equal(f.calls.length,1);assert.equal(f.calls[0].left,170);assert.equal(f.calls[0].behavior,'instant')});
for(const change of ['new-input','panning','detached','new-selected','hidden','vertical-list','replaced-rail','hidden-rail','inert-parent'])test('Queued name-rail reveal is retired by '+change,()=>{
 const f=rail();f.reveal();if(change==='new-input')f.intent.input();if(change==='panning')f.intent.setPanning(true);if(change==='detached')f.r.isConnected=false;if(change==='new-selected')f.select(f.b);if(change==='hidden')f.c.document.hidden=true;if(change==='vertical-list')f.r.classList.remove('compactOneRow');if(change==='replaced-rail')f.replaceRail();if(change==='hidden-rail')f.r.hidden=true;if(change==='inert-parent')f.blockAncestor();f.timer.frame();assert.equal(f.calls.length,0);
});
test('Two name-rail requests admit only the latest selected name',()=>{const f=rail();f.reveal();f.select(f.b);f.reveal();f.timer.frame();assert.equal(f.calls.length,1);assert.equal(f.calls[0].left,320)});
test('Selected name waits through post-tap quiet then reveals exactly once',()=>{const f=rail();f.intent.setQuiet(true);f.reveal();f.timer.frame();assert.equal(f.calls.length,0);assert.equal(f.intent.idleCallbacks.length,1);f.intent.settle();assert.equal(f.calls.length,1);assert.equal(f.calls[0].left,170);assert.equal(f.calls[0].behavior,'instant');f.intent.settle();assert.equal(f.calls.length,1)});
test('A newer pan during the quiet window retires the waiting name reveal',()=>{const f=rail();f.intent.setQuiet(true);f.reveal();f.timer.frame();f.intent.input();f.intent.setPanning(true);f.r.scrollLeft=81;f.intent.settle();assert.equal(f.calls.length,0);assert.equal(f.r.scrollLeft,81)});
test('Superseded waiting rail callback cannot move the current selected name',()=>{const f=rail();f.intent.setQuiet(true);f.reveal();f.timer.frame();const old=f.intent.idleCallbacks[0];f.select(f.b);f.reveal();f.timer.frame();assert.equal(f.intent.idleCallbacks.length,2);f.intent.settle();assert.equal(f.calls.length,1);assert.equal(f.calls[0].left,320);old();assert.equal(f.calls.length,1);assert.equal(f.r.scrollLeft,320)});
const report={version:'r1067',root,scope:'Actual production selection/focus helpers and dock/rail runtimes; controlled DOM/input/lifecycle. No native-browser or physical-phone gesture claim.',passed:results.filter(x=>x.ok).length,total:results.length,allPassed:results.every(x=>x.ok),tests:results};console.log(JSON.stringify(report,null,2));if(!report.allPassed)process.exitCode=1;
