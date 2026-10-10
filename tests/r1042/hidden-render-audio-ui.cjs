/* Exact shipped now-playing/navigation view bodies with controlled DOM/RAF.
 * Optional r1041 comparison reproduces backlog; no browser/audio/device assertion. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const root=path.resolve(process.argv.slice(2).find(s=>!s.startsWith('--'))||path.join(__dirname,'../..')),html=fs.readFileSync(root+'/index.html','utf8');
const baselineCommit=process.argv.find(s=>s.startsWith('--compare-base='))?.slice('--compare-base='.length);
const baseline=baselineCommit?cp.execFileSync('git',['show',baselineCommit+':index.html'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024}):null;
const ids=['r402-stability-runtime','r406-stable-nowplaying','r530-single-navigation-runtime','r422-smart-session-unified-runtime'];
function source(text,id){const m=[...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(m=>m[1].includes('id="'+id+'"'));assert(m,'script '+id);assert(!m[1].includes('application/x-sukun-disabled'));return m[2];}
async function host(body,id){
  let serial=0,rafScheduled=0;const frames=new Map(),timers=new Map(),intervals=new Map(),winEvents=new Map(),docEvents=new Map(),subscribers=[],bodyClassSubscribers=[],writes=[],measurements=[],commands=[];
  const state={count:0,context:'zikir'},ownership={owned:true,epoch:73,intent:19};
  const events=map=>({addEventListener(type,fn){if(!map.has(type))map.set(type,[]);map.get(type).push(fn)},emit(type,detail){for(const fn of map.get(type)||[])fn({type,detail})}});
  const nodes=new Map();
  function node(id){
    let text='',hidden=false;const classes=new Set(),attrs=new Map(),children=[];
    const n={id,children,dataset:{},style:new Proxy({setProperty(k,v){writes.push([id,k,v])}},{set(o,k,v){o[k]=v;writes.push([id,k,v]);return true}}),
      classList:{contains:k=>classes.has(k),add(...ks){ks.forEach(k=>classes.add(k));writes.push([id,'add',...ks])},remove(...ks){ks.forEach(k=>classes.delete(k));writes.push([id,'remove',...ks])},toggle(k,v){if(v===undefined)v=!classes.has(k);v?classes.add(k):classes.delete(k);writes.push([id,'toggle',k,v]);return v}},
      get textContent(){return text},set textContent(v){text=String(v);writes.push([id,'text',text])},get hidden(){return hidden},set hidden(v){hidden=!!v;writes.push([id,'hidden',hidden])},
      get firstElementChild(){return children[0]||null},get firstChild(){return children[0]||null},get nextElementSibling(){const siblings=n.parentElement?.children||[];return siblings[siblings.indexOf(n)+1]||null},
      get previousElementSibling(){const siblings=n.parentElement?.children||[];return siblings[siblings.indexOf(n)-1]||null},
      get scrollWidth(){measurements.push({text,count:state.count});return 100+text.length*6},clientWidth:100,
      getAttribute:k=>attrs.get(k)||null,setAttribute(k,v){attrs.set(k,String(v));writes.push([id,'attr',k,v])},addEventListener(){},querySelector(){return null},querySelectorAll(){return[]},
      appendChild(child){child.parentElement=n;children.push(child)},append(...ns){ns.forEach(n.appendChild)},insertBefore(child,before){child.parentElement=n;const i=before?children.indexOf(before):children.length;children.splice(i,0,child)},closest(){return null}};
    Object.defineProperty(n,'innerHTML',{get:()=>'',set(v){writes.push([id,'html',v])}});nodes.set(id,n);return n;
  }
  ['miniBar','mbT','mbS','mbNowMeta','mbStableDetails','r170Now','r422NowInfo','r422NowHead','r496DockCore','r494DockNavSlot','r478DockStats','r422NowSession','r422NowCurrent','r422NowSource','r422NowPhase','r422NowNext','r422Mod','r422Repeat','r422Gap','r422Level','r422Remaining','r422RemainPill','r422Progress','r170Play','r494_dock_prev','r494_dock_reset','r494_dock_next'].forEach(node);
  const bodyNode=node('body'),info=node('mini-info'),detailSpan=node('detail-span'),progressFill=node('progress-fill');nodes.get('mbStableDetails').appendChild(detailSpan);nodes.get('r422Progress').appendChild(progressFill);
  const core=nodes.get('r496DockCore');core.append(nodes.get('r422NowHead'),nodes.get('r494DockNavSlot'),nodes.get('r478DockStats'));
  const document={...events(docEvents),readyState:'complete',hidden:false,body:bodyNode,getElementById:id=>nodes.get(id)||null,querySelector:s=>s==='#miniBar .mbInfo'?info:null,querySelectorAll:()=>[],createElement:()=>node('created-'+serial)};
  const snapshot=()=>({id:'smart-session',state:'playing',moduleTitle:'Session '+state.count,sectionTitle:'Item '+state.count,sectionIndex:state.count+1,sectionCount:20000,sourceLabel:'Recorded '+state.count,repeatIndex:state.count,repeatTotal:20000,remaining:state.count*1000,progress:state.count%100});
  const player={name:'Initial',playing:true,paused:false,i:0,token:44,repeatIndex:0,repeatTotal:20000,queue:[{type:'zikir',cat:'esma',idx:0,reps:20000,gap:500}]};
  for(const name of ['set','play','one','stop','next','prev'])player[name]=(...args)=>commands.push({name,args});
  const np={get:snapshot,refresh(){},subscribe(fn){subscribers.push(fn);fn(snapshot());return()=>{}}};
  const context={...events(winEvents),document,console,Date,Math,Promise,Set,Object,Number,String,CustomEvent:class{constructor(type,opt){this.type=type;this.detail=opt?.detail}},queueMicrotask,
    SukunNowPlayingStore:np,R170:{Player:player},ZIKIR:{esma:{items:[{tr:'Mercy',t:'Mercy'}]}},Z:{cat:'esma',idx:0,count:0,devir:0,auto:true,total:0},
    SukunTabOwner:{snapshot:()=>({...ownership}),claim(){commands.push({name:'claim'})},release(){commands.push({name:'release'})}},
    currentFlowState:{snapshot:()=>({context:state.context})},
    SukunLifecycleHub:{onBodyClass(fn){bodyClassSubscribers.push(fn)}},
    requestAnimationFrame(fn){const key=++serial;frames.set(key,fn);rafScheduled++;return key},cancelAnimationFrame:key=>frames.delete(key),
    setTimeout(fn){const key=++serial;timers.set(key,fn);return key},clearTimeout:key=>timers.delete(key),setInterval(fn){const key=++serial;intervals.set(key,fn);return key},clearInterval:key=>intervals.delete(key)};
  context.window=context;context.dispatchEvent=e=>context.emit(e.type,e.detail);vm.createContext(context);vm.runInContext(body,context,{filename:id+'.js'});
  function flush(){for(let round=0;(timers.size||frames.size)&&round<50;round++){const ts=[...timers];timers.clear();ts.forEach(([,fn])=>fn());const fs=[...frames];frames.clear();fs.forEach(([,fn])=>fn());}assert.equal(timers.size+frames.size,0,'settled callbacks');}
  await new Promise(setImmediate);flush();writes.length=0;measurements.length=0;commands.length=0;
  function burst(n){for(let i=1;i<=n;i++){state.count=i;subscribers.forEach(fn=>fn(snapshot()));context.emit('sukun:nowplayingchange',snapshot());context.emit('sukun:playbackchange');context.emit('sukun:audiostate');context.emit('sukun:smartphase',{kind:i%2?'gap':'playing'});context.emit('sukun:source');}}
  function visibility(hidden){document.hidden=hidden;document.emit('visibilitychange');}
  return{context,document,state,player,ownership,nodes,frames,timers,intervals,writes,measurements,commands,snapshot,burst,visibility,flush,bodyClass:()=>bodyClassSubscribers.forEach(fn=>fn()),stats:()=>({rafScheduled,pendingRAF:frames.size,pendingTimers:timers.size})};
}
(async()=>{
  const results=[];
  for(const id of ids){
    let before={pendingRAF:null,pendingTimers:null};
    if(baseline){const old=await host(source(baseline,id),id);old.visibility(true);old.burst(10000);before=old.stats();assert(before.pendingRAF>=10000||before.pendingTimers>=10000,'baseline demonstrates hidden backlog '+id);}
    const h=await host(source(html,id),id),owner=JSON.stringify(h.ownership);
    h.burst(10000);assert(h.frames.size<=1&&h.timers.size<=1,'visible event burst coalesces '+id);
    h.visibility(true);assert.equal(h.frames.size+h.timers.size,0,'hidden transition cancels pending frame/timer '+id);
    h.writes.length=0;h.measurements.length=0;const submitted=h.stats().rafScheduled;h.burst(10000);
    if(id==='r530-single-navigation-runtime')for(let i=0;i<10000;i++)h.bodyClass();
    if(id==='r406-stable-nowplaying')for(let i=0;i<10000;i++){h.context.SukunMiniStable.applyNow(h.snapshot());h.context.SukunMiniStable.applyInfo({title:'Info '+i,sub:'Sub '+i});}
    if(id==='r422-smart-session-unified-runtime')for(let i=0;i<10000;i++)h.context.SukunSmartSessionView.render(h.snapshot());
    assert.equal(h.frames.size+h.timers.size,0,'hidden callbacks never accumulate '+id);assert.equal(h.stats().rafScheduled,submitted,'hidden burst submits no RAF '+id);assert.equal(h.writes.length,0,'hidden burst makes no DOM writes '+id);
    h.state.count=10001;h.state.context='idle';h.player.name='Final latest session';h.visibility(false);assert.equal(h.frames.size,1,'unlock submits one current render '+id);h.flush();
    if(id==='r402-stability-runtime')assert.equal(h.nodes.get('mbT').textContent,'Session 10001');
    if(id==='r406-stable-nowplaying'){assert.equal(h.nodes.get('mbT').textContent,'Session 10001');assert.equal(h.nodes.get('mbS').textContent,'Item 10001');assert(h.nodes.get('detail-span').textContent.includes('10001/20000'));assert.equal(h.measurements.length,1,'one latest detail measurement');assert.equal(h.measurements[0].count,10001);
      h.measurements.length=0;for(let i=0;i<10000;i++){h.state.count=i;h.context.SukunMiniStable.applyNow(h.snapshot());}assert.equal(h.frames.size,1,'direct visible paints share one detail measurement');h.flush();assert.equal(h.measurements.length,1);assert(h.measurements[0].text.includes('9999/20000'));
      h.context.SukunMiniStable.applyNow(h.snapshot());assert.equal(h.frames.size,1);h.visibility(true);assert.equal(h.frames.size,0,'hidden transition cancels pending detail measurement');h.visibility(false);h.flush();
      h.context.SukunNowPlayingStore=null;h.visibility(true);h.context.SukunMiniStable.applyInfo({title:'Latest standalone info',sub:'Standalone details',tam:[{ad:'Saved detail'}]});h.visibility(false);h.flush();assert.equal(h.nodes.get('mbT').textContent,'Latest standalone info');assert(h.nodes.get('detail-span').textContent.includes('Saved detail'));}
    if(id==='r530-single-navigation-runtime')assert(!h.nodes.get('r170Now').classList.contains('r494-nav-visible'),'navigation uses latest idle context');
    if(id==='r422-smart-session-unified-runtime'){assert.equal(h.nodes.get('r422NowSession').textContent,'Final latest session');assert.equal(h.nodes.get('progress-fill').style.width,'1.0%');}
    assert.equal(h.commands.length,0,'render event routing cannot issue playback/owner commands '+id);assert.equal(JSON.stringify(h.ownership),owner,'owner is unchanged '+id);
    results.push({id,pass:true,eventsPerBurst:50000,baselinePendingRAF:before.pendingRAF,baselinePendingTimers:before.pendingTimers,candidateHiddenRAF:0,candidateHiddenTimers:0,latestVisibleState:true,audioOrOwnerCommands:0});
  }
  console.log(JSON.stringify({scope:'Exact shipped view/navigation scripts in controlled DOM/RAF VM; optional baseline comparison. No browser, compositor, audio or physical lockscreen verification.',baselineCommit:baselineCommit||null,passed:results.length,total:ids.length,results},null,2));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
