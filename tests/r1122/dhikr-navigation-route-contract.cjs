'use strict';
// Exact shipped session command boundary, global flow router, contextOf, and
// native direct navigation implementation. DOM, owner lease, audio start/stop,
// journey/smart owners and persistence are explicit controlled seams.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=process.argv[3]?path.resolve(process.argv[3]):null;
const html=fs.readFileSync(path.join(root,'nero.html'),'utf8');
const session=fs.readFileSync(path.join(root,'assets/runtime/session-r919.js'),'utf8');
const interfaceSource=fs.readFileSync(path.join(root,'assets/runtime/interface-r920.js'),'utf8');
const handlerLine=prefix=>{const line=interfaceSource.split('\n').find(x=>x.trim().startsWith(prefix));assert(line,'exact interface handler '+prefix);return line};
const handlerSource=[handlerLine('function command(action,options)'),handlerLine("$('r959WheelPrevious').onclick="),handlerLine("$('r920Previous').onclick=")].join('\n');
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function slice(start,end){const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a,'exact shipping source: '+start);return html.slice(a,b)}
const flowScript=slice('<script id="r508-flow-navigation">','</script>').replace('<script id="r508-flow-navigation">','');
const resumeScript=slice('<script id="r509-session-resume-policy">','</script>').replace('<script id="r509-session-resume-policy">','');
const contextSource=slice('function contextOf(z,np,fr,session){','function sourceOf(np,v,fr,context){');
const nativeSource=slice('let r988NavigationGeneration=0,r988NavigationPending=null;','/* Smart-session navigation now uses the exported PlaybackController contract.');
function fixture({cat='esma',phase='IDLE',count=0,background='',kind='single',smart=false,pendingSmart=false,globalHeld=false,terminal=false,nefs=false,captured=false}={}){
 const state={cat,idx:4,auto:phase==='PLAYING',paused:phase==='PAUSED',count,devir:0,total:17,target:10,form:'nida',length:cat==='esma'?99:28,name:'Name 4',session:{active:smart,presentation:smart||terminal,terminal,reading:smart,playing:smart},nefs:nefs?{active:true,linked:true,index:2,total:7}:null};
 const log=[],events=[],effects=[],listeners=new Map(),noop=()=>{};
 const storage=new Map([['sukun.resume.policy.v1',JSON.stringify({zikir:{status:'completed',updatedAt:1,reason:'completed-fixture',meta:{}}})]]);
 const np=background?{id:background==='reading'?'reading-r1064':background==='ambient'?'ambient':'frequency',state:'playing'}:{};
 const journey={i:4,run:kind!=='single'&&phase==='PLAYING',paused:kind!=='single'&&phase==='PAUSED'};
 const on=(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)};
 const current=()=>({...state,active:!!state.auto||state.paused||state.count>0||smart});
 const c={console,Promise,Object,String,Number,Math,Date,Set,Map,queueMicrotask,URLSearchParams,location:{search:''},navigator:{},SUKUN_BUILD:'r1122',
 CustomEvent:class{constructor(type,opt){this.type=type;this.detail=opt?.detail}},addEventListener:on,dispatchEvent:e=>{events.push(e);for(const fn of listeners.get(e.type)||[])fn(e);return true},
 localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value))},
 document:{readyState:'loading',visibilityState:'visible',addEventListener:noop,querySelector:()=>null,body:{classList:{contains:()=>false}}},
 Z:state,MINI:{wasAuto:captured},ZIKIR:{esma:{items:Array.from({length:99},()=>({}))},berhet:{items:Array.from({length:28},()=>({}))}},
 currentZikirState:{snapshot:current},SukunJourneyController:{target:()=>kind},SukunSecretPolicy:{unlocked:()=>true},
 SukunNowPlayingStore:{get:()=>np},SukunAudioSessionRegistry:{aggregateSnapshot:()=>({paused:globalHeld}),retireSinglePauseGate:r=>log.push(r)},
 AudioLife:{userPaused:globalHeld,snapshot:()=>({userIntentSeq:0})},SukunTabOwner:{owns:()=>true},
 SukunR698Transport:{whenStopped:()=>Promise.resolve(true)},
 SukunSmartSessionR1082:{terminal:()=>state.session.terminal,clearTerminal(){log.push('clear-terminal');state.session={active:false,presentation:false,terminal:false};}},
 PlaybackController:{next:id=>{log.push('generic-next:'+id);return false},previous:id=>{log.push('generic-previous:'+id);return false}},
 R170:{Player:{hasPendingContinuation:()=>pendingSmart,next(){log.push('pending-smart:1')},prev(){log.push('pending-smart:-1')},save:noop}},
 currentItems:()=>c.ZIKIR[cat].items,r639RouteJourneyNavigation:()=>false,
 autoStop:()=>{log.push('auto-stop');state.auto=false},autoStart:()=>{log.push('auto-start');state.auto=true;return true},stopZikirVoice:()=>log.push('stop-old-voice'),
 zHedefSecimeUyarla:noop,renderZikir:noop,zUI:noop,persistZero:noop,mertebeApply:i=>log.push('nefs:'+i)
 };
 c.window=c;vm.createContext(c);vm.runInContext(contextSource,c);vm.runInContext(nativeSource,c,{filename:'nero.html:actual-native-navigation'});
 c.currentFlowState={snapshot:()=>{const z=current();return {context:c.contextOf(z,np,{playing:background==='frequency'},{active:smart}),playback:np,zikir:z,nefs:z.nefs}},refresh:(...args)=>effects.push(args),subscribe:noop};
 c.__SUKUN_FLOW_NAV_OPS__={navigateDirect:delta=>{log.push('direct:'+delta);return c.navigateDirect(delta)},restartDirect:()=>{log.push('direct-restart');return true},navigateSmart:delta=>{log.push('smart:'+delta);return true}};
 if(kind!=='single')c[kind==='99'?'SukunEsma99Seyir':'SukunBerhetiyyeSeyir']={state:()=>({...journey}),display:()=>({index:journey.i,name:'Journey '+journey.i,count:0,target:10}),next(){log.push('journey:1');journey.i++;return true},previous(){log.push('journey:-1');journey.i--;return true}};
 vm.runInContext(flowScript,c,{filename:'nero.html:actual-flow-navigation'});
 vm.runInContext(session,c,{filename:'assets/runtime/session-r919.js'});
 vm.runInContext(resumeScript,c,{filename:'nero.html:actual-resume-policy'});
 const controls=new Map();c.$=id=>{if(!controls.has(id))controls.set(id,{id,disabled:false,click(){if(!this.disabled){log.push('control:'+id);this.onclick?.()}}});return controls.get(id)};c.queue=noop;
 vm.runInContext(handlerSource,c,{filename:'assets/runtime/interface-r920.js:actual-button-handlers'});
 return{c,log,events,effects,state,journey,controls,context:()=>c.currentFlowState.snapshot().context};
}
const results=[];
async function test(name,fn){try{results.push({name,passed:true,evidence:await fn()})}catch(error){results.push({name,passed:false,error:error.stack||String(error)})}}
async function routeCase(opt,action,expected){const h=fixture(opt),before={...h.state},context=h.context();const result=await h.c.SukunSessionState.command(action);
 assert(result.accepted,'Command should be accepted: '+JSON.stringify(h.c.SukunSessionState.commandDiagnostics()));assert(h.log.includes(expected),JSON.stringify(h.log));assert(!h.log.some(x=>x.startsWith('generic-')),'local navigation cannot target unrelated audio');
 assert.equal(h.state.total,before.total,'Navigation cannot credit a reading');assert.equal(h.c.AudioLife.userPaused,!!opt.globalHeld,'global hold must survive');
 if(expected.startsWith('direct:')&&!opt.captured){assertFlowEffects(h,action,1);assert.equal(h.c.SukunResumePolicy.status('zikir'),'continue');assert.equal(h.c.SukunResumePolicy.shouldRestore('zikir',{updatedAt:1}),true)}
 if(opt.captured){assertFlowEffects(h,action,0);assert.equal(h.c.SukunResumePolicy.status('zikir'),'completed')}
 if(expected.startsWith('direct:')){assert.equal(h.state.idx,before.idx+(action==='next'?1:-1));assert.equal(h.state.count,0);if(opt.phase!=='PLAYING'){assert(!h.log.includes('auto-start'),'idle/paused navigation cannot start audio');assert.equal(h.state.auto,false)}}
 return{context,log:h.log,idxBefore:before.idx,idxAfter:h.state.idx};}
function assertFlowEffects(h,action,count){const events=h.events.filter(e=>e.type==='sukun:flownavigation');assert.equal(events.length,count,'successful local navigation retains one flow event');if(count===1)assert.deepEqual(JSON.parse(JSON.stringify(events[0].detail)),{action:action==='previous'?'prev':action,context:'zikir',surface:'r919'});assert.equal(h.effects.filter(x=>x[0]==='flow-navigation'&&x[1]===true).length,count,'successful local navigation refreshes flow once')}
(async()=>{
 for(const cat of ['esma','berhet'])for(const phase of ['IDLE','PLAYING','PAUSED'])for(const background of ['','ambient','frequency','reading'])for(const action of ['next','previous'])await test(`${cat} ${phase} ${background||'no background'} ${action}`,()=>routeCase({cat,phase,background},action,'direct:'+(action==='next'?1:-1)));
 for(const cat of ['esma','berhet'])for(const phase of ['IDLE','PLAYING','PAUSED'])for(const surface of ['wheel','lower'])for(const action of ['next','previous'])await test(`${cat} ${phase} ${surface} actual ${action} handler`,async()=>{const h=fixture({cat,phase}),suffix=action==='next'?'Next':'Previous',id=(surface==='wheel'?'r959Wheel':'r920')+suffix,before=h.state.idx;h.c.$(id).click();await flush();assert.equal(h.state.idx,before+(action==='next'?1:-1));assert.equal(h.c.SukunSessionState.commandDiagnostics().accepted,true);assert(h.log.includes('control:r920'+suffix),'wheel must dispatch existing lower button');if(surface==='wheel')assert(h.log.includes('control:r959Wheel'+suffix));if(phase!=='PLAYING')assert(!h.log.includes('auto-start'));assert.equal(h.state.total,17);return h.log});
 for(const cat of ['esma','berhet'])for(const phase of ['IDLE','PAUSED'])await test(`${cat} ${phase} retains global pause`,()=>routeCase({cat,phase,globalHeld:true},'next','direct:1'));
 for(const cat of ['esma','berhet'])await test(`${cat}: count1 next resets count0; next and previous remain available`,async()=>{const h=fixture({cat,count:1});const rows=[];for(const action of ['next','next','previous']){const before=h.state.idx,context=h.context();const r=await h.c.SukunSessionState.command(action);assert.equal(r.accepted,true);assert.equal(h.state.idx,before+(action==='next'?1:-1));assert.equal(h.state.count,0);rows.push({action,context,index:h.state.idx})}assert.equal(h.state.total,17);assert.equal(h.state.auto,false);assert(!h.log.includes('auto-start'));return rows});
 for(const cat of ['esma','berhet'])await test(`${cat}: rapid running next then previous retains only latest continuation`,async()=>{const h=fixture({cat,phase:'PLAYING'});const first=h.c.SukunSessionState.command('next'),second=h.c.SukunSessionState.command('previous');await Promise.all([first,second]);assert.equal(h.state.idx,4);assert.equal(h.log.filter(x=>x==='auto-start').length,1);assert.equal(h.state.auto,true);return h.log});
 for(const kind of ['99','28'])for(const phase of ['IDLE','PLAYING','PAUSED'])await test(`journey ${kind} ${phase} preserves owner`,()=>routeCase({kind,cat:kind==='28'?'berhet':'esma',phase},'next','journey:1'));
 await test('live smart preserves smart authority',()=>routeCase({smart:true,phase:'PLAYING'},'next','smart:1'));
 await test('pending smart preserves smart authority',()=>routeCase({pendingSmart:true},'next','pending-smart:1'));
 for(const cat of ['esma','berhet'])await test(`${cat}: linked Nefs preserves Nefs authority`,()=>routeCase({cat,nefs:true},'next','nefs:3'));
 await test('terminal smart clears result before local selection',()=>routeCase({terminal:true},'next','direct:1'));
 await test('captured single preserves paused native navigation',()=>routeCase({captured:true,globalHeld:true,background:'ambient'},'next','direct:1'));
 for(const requested of [{surface:'main',contextOverride:'zikir'},{surface:'dock',contextOverride:'zikir'},{surface:'r919',contextOverride:'smart'},{surface:'r919',contextOverride:'nefs'}])await test('arbitrary context override is ignored: '+JSON.stringify(requested),async()=>{const h=fixture();const ok=await h.c.SukunFlowNavigation.act('next',requested);assert.equal(ok,false);assert.equal(h.state.idx,4);assertFlowEffects(h,'next',0);return h.log});
 for(const opt of [{smart:true},{pendingSmart:true},{nefs:true},{kind:'99'},{kind:'28'},{cat:'temel'}])await test('local override preserves protected context '+JSON.stringify(opt),async()=>{const h=fixture(opt);await h.c.SukunFlowNavigation.act('next',{surface:'r919',contextOverride:'zikir'});assert(!h.log.includes('direct:1'));if(opt.smart)assert(h.log.includes('smart:1'));if(opt.nefs)assert(h.log.includes('nefs:3'));return h.log});
 await test('context override cannot change Restart routing',async()=>{const h=fixture();const ok=await h.c.SukunFlowNavigation.act('reset',{surface:'r919',contextOverride:'zikir'});assert.equal(ok,false);assert(!h.log.includes('direct-restart'));assertFlowEffects(h,'reset',0);return h.log});
 await test('rejected native local navigation has no successful flow effects',async()=>{const h=fixture();h.c.__SUKUN_FLOW_NAV_OPS__.navigateDirect=()=>false;const r=await h.c.SukunSessionState.command('next');assert.equal(r.accepted,false);assertFlowEffects(h,'next',0);assert.equal(h.c.SukunResumePolicy.status('zikir'),'completed');assert.equal(h.c.SukunResumePolicy.shouldRestore('zikir',{updatedAt:1}),false);return h.log});
 for(const newer of ['pause','stop','select'])await test('superseded running navigation cannot restart or alter selection after '+newer,async()=>{const h=fixture({phase:'PLAYING'});let resolve;h.c.SukunR698Transport.whenStopped=()=>new Promise(r=>{resolve=r});const first=h.c.SukunSessionState.command('next');assert.equal(h.state.idx,5);if(newer==='pause')h.state.paused=true;if(newer==='select')h.state.idx=12;h.c.dispatchEvent(new h.c.CustomEvent('sukun:sessioncommand',{detail:{action:newer}}));const selected=h.state.idx;resolve(true);const result=await first;assert.equal(result.accepted,true,'historical native superseded selection returns true');assert.equal(h.state.idx,selected);assert.equal(h.state.total,17);assert(!h.log.includes('auto-start'));assertFlowEffects(h,'next',1);assert.equal(h.c.SukunResumePolicy.status('zikir'),'continue');return{log:h.log,note:'Preserves existing flow semantics: an accepted navigation still emits progress/event/refresh after its automatic continuation is superseded; it cannot restart or credit audio.'}});
 const report={suite:'Local dhikr session navigation command route',sourceRoot:root,sourceHashes:{html:hash(html),session:hash(session),flow:hash(flowScript),native:hash(nativeSource),resume:hash(resumeScript),interface:hash(interfaceSource),handlers:hash(handlerSource)},passed:results.filter(r=>r.passed).length,total:results.length,limitations:['Exact shipped JavaScript in node:vm. The exact production lower and wheel click handlers run against a synthetic DOM; owner lease admission, audio starts/stops, persistence, journey and smart endpoints are controlled seams, not physical device or full browser evidence. No unrelated generic next/previous is sent, but the controlled stopZikirVoice seam does not establish preservation of unrelated reader media sharing the native SES pool.'],results};report.allPassed=report.passed===report.total&&report.total>0;if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify(report,null,2));if(results.some(r=>!r.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
