const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const original=html.slice(html.indexOf('/* One optional view of the existing cymatics panel.'),html.indexOf('function cymEnter(){CYM3D.enter();}'));
// Replace only the import transport with a controlled promise; production bridge remains otherwise unchanged.
const code=original.replace("import('./assets/runtime/cymatics-3d.js')",'globalThis.load3D()');
let checks=0;const ok=(v,m)=>{assert(v,m);checks++};
function fixture(){
 const element=()=>({hidden:false,textContent:'',value:'',style:{},options:[{},{}],listeners:{},classList:{toggle(){},contains(){return true;}},addEventListener(k,f){this.listeners[k]=f;},setAttribute(){}});
 const elements=Object.fromEntries(['cymView','cymQuality','cymViewLabel','cymQualityLabel','cym3dNote','cym3dStatus','cymCanvas','cym3dHost','cymLive','panel-cym','ns','tab-frq'].map(k=>[k,element()]));
 const jobs=new Map(),timers=new Map();let timerId=0;let resolve,reject,loads=0,created=0,disposed=0,enters=0,pauses=0,refreshes=0;let options;
 const media={matches:false,addEventListener(_,fn){this.listener=fn;}};
 const instance={canvas:element(),enter(){enters++;},pause(){pauses++;},refresh(){refreshes++;},dispose(){disposed++;},frame(){},snapshot(){return {active:true}}};
 const module={createCymaticView(o){created++;options=o;return instance}};
 const events={};const sandbox={setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);},window:{I18N:{lang:'tr'},matchMedia:()=>media,addEventListener(n,fn){events[n]=fn;}},document:{getElementById:id=>elements[id],addEventListener(n,fn){events[n]=fn;}},CIZ:{cikar:k=>jobs.delete(k),ekle:(k,f)=>{jobs.set(k,f);return k;}},SPEC:{updateSignalRoute(){}},CYM:{n:3,m:4,ready:true,canvas:elements.cymCanvas},cymLiveLevel:()=>.1,cymResize(){},cymSeed(){},cymTick(){},load3D:()=>{loads++;return new Promise((a,b)=>{resolve=a;reject=b;})}};
 sandbox.MutationObserver=class {constructor(fn){events.mutation=fn;}observe(){}};vm.createContext(sandbox);vm.runInContext(code,sandbox);return {c:sandbox.window.SukunCymatics3D,events,e:elements,jobs,timers,poll(){const batch=[...timers];timers.clear();for(const[,timer]of batch){assert.equal(timer.delay,500);timer.fn();}},media,instance,module,resolve:()=>resolve(module),reject:()=>reject(Error('missing module')),counts:()=>({loads,created,disposed,enters,pauses,refreshes}),contextLost:()=>options.onContextLost(),sandbox};
}
(async()=>{
 let f=fixture();f.c.enter();ok(f.counts().loads===0,'2D default never loads Three');ok(f.jobs.has('cym'),'2D uses existing scheduler');
 let pending=f.c.choose('3d');ok(f.c.loading,'pending state exposed');f.resolve();await pending;ok(f.counts().created===1&&f.jobs.has('cym3d')&&!f.jobs.has('cym'),'one scene replaces 2D job');ok(f.e.cymCanvas.hidden&&f.e.cymCanvas.style.display==='none','2D canvas actually hidden');
 await f.c.choose('2d');ok(f.jobs.has('cym')&&!f.jobs.has('cym3d')&&!f.e.cymCanvas.hidden,'switch back restores 2D');await f.c.choose('3d');ok(f.counts().created===1&&f.counts().loads===1,'repeat visits reuse one scene/module');
 f.media.matches=true;f.media.listener();ok(!f.jobs.has('cym3d')&&f.counts().refreshes>0,'reduced motion unschedules animation and refreshes static frame');
 f.c.pause();ok(!f.jobs.has('cym3d')&&!f.jobs.has('cym')&&!f.c.active,'navigation pauses both render owners');
 f.c.enter();await new Promise(r=>setImmediate(r));f.contextLost();ok(f.c.mode==='2d'&&f.counts().disposed===1,'context loss disposes scene and returns 2D');ok(f.e.cym3dStatus.textContent.includes('2B'),'fallback disclosed');
 f=fixture();await f.c.choose('3d');ok(f.counts().loads===0,'hidden panel cannot start dependency load');f.c.enter();f.resolve();await new Promise(r=>setImmediate(r));ok(f.counts().created===1,'deferred selection enters normally');
 f=fixture();f.c.enter();f.media.matches=true;f.media.listener();ok(!f.jobs.has('cym'),'reduced-motion change stops 2D fallback animation');f.media.matches=false;f.media.listener();ok(f.jobs.has('cym'),'restoring motion resumes active 2D');
 // Reproduce CI: matches changes back to false but the native change event is
 // absent. The product's own timer, not a snapshot/input read, must restore it.
 for(const mode of ['2d','3d']){
  f=fixture();f.c.enter();if(mode==='3d'){pending=f.c.choose('3d');f.resolve();await pending;}
  ok(f.timers.size===1,'one visible-panel preference watcher for '+mode);
  f.media.matches=true;f.media.listener();ok(!f.jobs.has('cym')&&!f.jobs.has('cym3d'),'native reduce event stops '+mode+' jobs');
  const still=f.counts().refreshes;for(let i=0;i<5;i++)f.poll();ok(!f.jobs.size&&f.counts().refreshes===still,'unchanged reduced preference schedules/paints nothing in '+mode);
  f.media.matches=false;f.poll();ok(f.jobs.has(mode==='3d'?'cym3d':'cym'),'missing restore event recovered independently in '+mode);
  const job=f.jobs.get(mode==='3d'?'cym3d':'cym'),refreshes=f.counts().refreshes;
  for(let i=0;i<5;i++)f.poll();ok(f.timers.size===1&&f.jobs.get(mode==='3d'?'cym3d':'cym')===job&&f.counts().refreshes===refreshes,'steady preference does not replace jobs or duplicate timers in '+mode);
  f.media.matches=true;f.poll();ok(!f.jobs.size,'missing reduce event also stops '+mode+' jobs');
  f.c.pause();ok(f.timers.size===0,'pause cancels preference watcher in '+mode);f.media.matches=false;f.poll();ok(!f.jobs.size&&!f.c.active,'late timer cannot resurrect paused '+mode);
  f.c.enter();await new Promise(r=>setImmediate(r));ok(f.timers.size===1&&f.jobs.has(mode==='3d'?'cym3d':'cym'),'visible reentry restores one watcher and latest motion in '+mode);
  f.e.ns.hidden=true;f.poll();ok(f.timers.size===0&&!f.c.active&&!f.jobs.size,'hidden panel stops polling and render jobs in '+mode);
 }
 f=fixture();f.c.enter();pending=f.c.choose('3d');f.c.pause();f.resolve();await pending;ok(f.counts().created===0&&!f.jobs.has('cym3d'),'navigation during load cannot resurrect renderer');
 f=fixture();f.c.enter();pending=f.c.choose('3d');await f.c.choose('2d');f.resolve();await pending;ok(f.counts().created===0&&f.c.mode==='2d','cancel during import keeps 2D');
 f=fixture();f.c.enter();pending=f.c.choose('3d');f.reject();await pending;ok(f.c.mode==='2d'&&f.jobs.has('cym'),'module failure preserves working 2D');
 f.sandbox.window.I18N.lang='en';f.c.localize();ok(f.e.cym3dStatus.textContent.includes('2D view retained'),'fallback localizes');
 f=fixture();f.c.enter();f.events.pagehide();ok(!f.jobs.has('cym'),'pagehide removes 2D animation job');f.events.pageshow();ok(f.c.active&&f.jobs.has('cym'),'BFCache pageshow restores still-visible 2D panel');
 f=fixture();f.c.enter();pending=f.c.choose('3d');f.resolve();await pending;f.events.pagehide();f.events.pageshow();await new Promise(r=>setImmediate(r));ok(f.jobs.has('cym3d')&&f.counts().created===1,'BFCache restores existing 3D scene without duplicate');
 f.events.pagehide();f.e['panel-cym'].hidden=true;f.events.pageshow();ok(!f.c.active&&!f.jobs.has('cym3d'),'changed panel intent prevents BFCache resurrection');
 f=fixture();f.c.enter();f.events.pagehide();f.c.pause();f.events.pageshow();ok(!f.c.active,'explicit later pause overrides pagehide resume');
 f=fixture();f.c.enter();f.events.pagehide();f.e['ns'].hidden=true;f.events.pageshow();ok(!f.c.active,'closed frequency tools do not resume');
 f=fixture();f.c.enter();pending=f.c.choose('3d');f.e.ns.hidden=true;f.resolve();await pending;ok(f.counts().created===0&&!f.c.active,'ancestor hidden during import cannot create or render a scene even before observer runs');
 f=fixture();f.c.enter();pending=f.c.choose('3d');f.e['tab-frq'].hidden=true;f.events.mutation();f.resolve();await pending;ok(f.counts().created===0&&!f.c.active,'leaving main tab cancels pending scene');f.e['tab-frq'].hidden=false;f.events.mutation();await new Promise(r=>setImmediate(r));ok(f.counts().created===1&&f.c.active,'returning to visible selected panel resumes latest view');
 f.e.ns.hidden=true;f.events.mutation();ok(!f.jobs.has('cym3d')&&!f.c.active,'collapsing hub pauses active 3D job');f.e.ns.hidden=false;f.e['panel-cym'].hidden=true;f.events.mutation();ok(!f.c.active,'reopening hub on another subpanel does not resume cymatics');
 let scripts=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/\bsrc\s*=|application\/(?:ld\+)?json|text\/x-sukun-tpl/.test(m[1])||!m[2].trim())continue;new vm.Script(m[2]);scripts++;}
 ok(scripts>300,'full inline/lazy scripts parse');ok(fs.readFileSync(path.join(root,'nero.html'),'utf8')===html,'entrypoints identical');
 console.log(JSON.stringify({passed:checks,scriptsParsed:scripts,scope:'Controlled dynamic-import/DOM/CIZ bridge, not native WebGL'}));
})().catch(e=>{console.error(e);process.exit(1)});
