'use strict';
// Shipping canonical projection plus read model, including terminal/non-reading
// transitions. No media, scheduler, saved target or credit is owned by this test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),a=html.indexOf('const currentZikirState=(()=>{'),b=html.indexOf('window.currentZikirState=currentZikirState;',a);assert(a>=0&&b>a);
const first={type:'zikir',cat:'temel',idx:0,reps:3,repeatMode:'fixed',_r1082Id:'allah'},silence={type:'silence',ms:5000,_r1082Id:'pause'},last={type:'zikir',cat:'esma',idx:1,reps:11,repeatMode:'fixed',_r1082Id:'nur'};
const Z={cat:'berhet',idx:0,target:622,count:11,devir:2,targetMode:'ebced',total:87555};
const P={queue:[first,silence,last],i:0,playing:true,paused:false,name:'Projection fixture'};
let result={status:'playing',completed:0,failed:0,skipped:0},done=[],budget=null,direct={},journeyRunning=false,receiptCount=11,invalidReceipt=false,clears=0,saves=0;
const ctx={Z,FR:{playing:false},ZIKIR:{temel:{items:[{tr:'Allah'}]},esma:{items:[{t:'Rahmân'},{t:'Nûr'}]},berhet:{items:[{tr:'Berhetîhin',eb:622}]}},R170:{Player:P},console,
 CustomEvent:class{},dispatchEvent(){},addEventListener(){},queueMicrotask(){},URLSearchParams,location:{search:''},navigator:{},
 document:{readyState:'loading',visibilityState:'visible',hidden:false,querySelector:()=>null,addEventListener(){},body:{classList:{contains:()=>false}}}};
const windowEvents=new Map(),documentEvents=new Map();
ctx.addEventListener=(type,fn)=>{if(!windowEvents.has(type))windowEvents.set(type,[]);windowEvents.get(type).push(fn)};
ctx.document.addEventListener=(type,fn)=>{if(!documentEvents.has(type))documentEvents.set(type,[]);documentEvents.get(type).push(fn)};
const emit=(registry,type,event={})=>{for(const fn of registry.get(type)||[])fn(event)};
ctx.window=ctx;ctx.SukunProgressJournal={stepIdentity:s=>JSON.stringify(s||null)};
ctx.SukunSmartSessionR1082={snapshot:()=>({result}),outcomes:()=>({completedIds:done}),progress:()=>budget,terminal:()=>['completed','ended'].includes(result.status)?{stepId:'nur',signature:invalidReceipt?'invalid':ctx.SukunProgressJournal.stepIdentity(last),completed:receiptCount,status:result.status}:null,clearTerminal(){clears++;result={status:'idle',completed:0,failed:0,skipped:0}}};
ctx.SukunDirectZikirTransportR698={state:()=>direct};
ctx.SukunJourneyController={target:()=> '99'};ctx.SukunSecretPolicy={unlocked:()=>true};
ctx.SukunEsma99Seyir={state:()=>({run:journeyRunning}),display:()=>({index:0,name:'Idle saved journey',count:25,target:99})};
ctx.SukunVoiceSource={snapshot:()=>({kind:'tts',label:'Device recitation'})};
vm.createContext(ctx);vm.runInContext(html.slice(a,b)+'window.currentZikirState=currentZikirState;',ctx);
vm.runInContext(fs.readFileSync(path.join(root,'assets/runtime/session-r919.js'),'utf8'),ctx);
let passed=0;const check=fn=>{fn();passed++},fresh=()=>{ctx.currentZikirState.refresh('test',true);return ctx.SukunSessionState.refresh('test')};
const credit=n=>{P._r982CompletedReps=n;P._r982RepIndex=P.i;P._r982RepStep=P.queue[P.i];P._r982RepSignature=ctx.SukunProgressJournal.stepIdentity(P.queue[P.i])};
let s=fresh();check(()=>assert.equal(s.target,3));check(()=>assert.equal(s.count,0));check(()=>assert.equal(s.activeName,'Allah'));check(()=>assert.equal(s.journeyKind,'single'));check(()=>assert.equal(s.smartSession.reading,true));
credit(2);s=fresh();check(()=>assert.equal(s.count,2));check(()=>assert.equal(s.remaining,1));check(()=>assert.equal(Z.target,622));check(()=>assert.equal(Z.count,11));
P.i=1;Z.cat='temel';Z.idx=0;credit(0);s=fresh();check(()=>assert.equal(s.target,0));check(()=>assert.equal(s.count,0));check(()=>assert.equal(s.activeName,'Sükût'));check(()=>assert.equal(s.smartSession.stepType,'silence'));check(()=>assert.equal(s.smartSession.reading,false));check(()=>assert.equal(s.audioSource,'SILENCE'));check(()=>assert.equal(s.remaining,null));
P.queue[1]={...silence,type:'frequency',c:180};s=fresh();check(()=>assert.equal(s.target,0));check(()=>assert.equal(s.activeName,'Frekans'));check(()=>assert.equal(s.smartSession.stepType,'frequency'));P.queue[1]=silence;
P.i=2;Z.cat='esma';Z.idx=1;credit(3);s=fresh();check(()=>assert.equal(s.target,11));check(()=>assert.equal(s.count,3));check(()=>assert.equal(s.remaining,8));check(()=>assert.equal(s.activeName,'Nûr'));
P.playing=false;P.paused=true;s=fresh();check(()=>assert.equal(s.target,11));check(()=>assert.equal(s.count,3));check(()=>assert.equal(s.phase,'PAUSED'));
P.paused=false;P.i=0;P._r982CompletedReps=0;done=['allah','pause','nur'];result={status:'completed',completed:3,failed:0,skipped:0};s=fresh();
check(()=>assert.equal(s.target,11));check(()=>assert.equal(s.count,11));check(()=>assert.equal(s.remaining,0));check(()=>assert.equal(s.phase,'COMPLETED'));check(()=>assert.equal(s.activeName,'Nûr'));check(()=>assert.equal(s.smartSession.active,false));check(()=>assert.equal(s.smartSession.terminal,true));check(()=>assert.equal(s.journeyKind,'single'));check(()=>assert.equal(Z.target,622));
// Startup/hydration emits the same selection notification as the native list.
// Only a nested trusted input dispatch may invalidate a durable receipt.
emit(windowEvents,'sukun:zikirselectionchange',{detail:{cat:'esma',idx:1}});s=fresh();
check(()=>assert.equal(clears,0));check(()=>assert.equal(s.target,11));check(()=>assert.equal(s.count,11));
emit(documentEvents,'click',{isTrusted:false,eventPhase:2});emit(windowEvents,'sukun:zikirselectionchange',{detail:{cat:'esma',idx:1}});check(()=>assert.equal(clears,0));
const trusted={isTrusted:true,eventPhase:2};emit(documentEvents,'change',trusted);emit(windowEvents,'sukun:zikirselectionchange',{detail:{cat:'esma',idx:0}});
check(()=>assert.equal(clears,1));check(()=>assert.equal(result.status,'idle'));
trusted.eventPhase=0;result={status:'completed',completed:3,failed:0,skipped:0};emit(windowEvents,'sukun:zikirselectionchange',{detail:{cat:'esma',idx:1}});s=fresh();
check(()=>assert.equal(clears,1));check(()=>assert.equal(s.target,11));check(()=>assert.equal(s.count,11));clears=0;
// Completion cannot supersede a new direct playback intent or new selection.
Z.auto=true;s=fresh();check(()=>assert.equal(s.smartSession,null));check(()=>assert.equal(s.target,622));Z.auto=false;
Z.cat='berhet';Z.idx=0;s=fresh();check(()=>assert.equal(s.smartSession,null));check(()=>assert.equal(ctx.currentZikirState.snapshot().target,622));
// A malformed saved index is shown as missing, never clamped to another reading.
P.playing=true;P.i=2;const saved=last.idx;last.idx=99;credit(0);s=fresh();check(()=>assert.equal(s.activeName,'Okuma seçilmedi'));check(()=>assert.equal(s.activeIndex,99));check(()=>assert.equal(s.target,11));last.idx=saved;
// Duration/manual credits remain identity-fenced and never borrow a fixed target.
last.repeatMode='duration';last.repeatForMs=30000;budget={stepId:'nur',signature:ctx.SukunProgressJournal.stepIdentity(last),elapsedMs:12000,completed:4};s=fresh();check(()=>assert.equal(s.target,0));check(()=>assert.equal(s.count,4));check(()=>assert.equal(s.smartSession.remainingMs,18000));
budget={...budget,stepId:'old'};s=fresh();check(()=>assert.equal(s.count,0));check(()=>assert.equal(s.smartSession.elapsedMs,0));
// Completed duration reading retains actual credits and completed time, not622.
P.playing=false;Z.cat='esma';Z.idx=1;receiptCount=4;budget=null;result={status:'completed',completed:3,failed:0,skipped:0};s=fresh();
check(()=>assert.equal(s.count,4));check(()=>assert.equal(s.target,0));check(()=>assert.equal(s.smartSession.elapsedMs,30000));check(()=>assert.equal(s.smartSession.remainingMs,0));
invalidReceipt=true;s=fresh();check(()=>assert.equal(s.smartSession,null));check(()=>assert.equal(ctx.currentZikirState.snapshot().target,622));invalidReceipt=false;
// Replay goes to the queue owner before clearing its receipt. Stop clears the
// durable result through the engine/save APIs, without rewriting a direct count.
P.save=()=>{saves++;ctx.currentZikirState.refresh('save',true)};
const plays=[];ctx.PlaybackController={play(id){plays.push(id);P.playing=true;P.i=0;result={status:'playing'};credit(0);ctx.currentZikirState.refresh('play',true);return true}};
ctx.SukunR698Transport={stopDhikr:()=>true};fresh();
(async()=>{
// An unrelated locked saved journey is only a preview, not this queue's owner.
ctx.SukunSecretPolicy.unlocked=()=>false;check(()=>assert.equal(ctx.SukunJourneyController.target(),'99'));
const start=await ctx.SukunSessionState.command('play');check(()=>assert.equal(start.accepted,true));check(()=>assert.equal(plays[0],'smart-session'));check(()=>assert.equal(clears,0));check(()=>assert.equal(start.snapshot.target,3));
P.playing=false;P.i=0;result={status:'completed',completed:3,failed:0,skipped:0};fresh();const stop=await ctx.SukunSessionState.command('stop');
check(()=>assert.equal(stop.accepted,true));check(()=>assert.equal(clears,1));check(()=>assert.equal(saves,1));check(()=>assert.equal(Z.target,622));check(()=>assert.equal(Z.count,11));
// An idle saved journey cannot steal Next/Previous from the terminal card,
// even when that saved journey is locked. A real active journey still owns them.
const moved=[],idleMoves=[];ctx.SukunEsma99Seyir.next=()=>{idleMoves.push('next');return true};ctx.SukunEsma99Seyir.previous=()=>{idleMoves.push('previous');return true};
ctx.SukunFlowNavigation={nextContext:()=>{moved.push('next');return true},previousContext:()=>{moved.push('previous');return true}};
for(const action of ['next','previous']){
 result={status:'completed',completed:3,failed:0,skipped:0};Z.cat='esma';Z.idx=1;fresh();const cleared=clears;
 const command=await ctx.SukunSessionState.command(action);check(()=>assert.equal(command.accepted,true));check(()=>assert.equal(moved.at(-1),action));check(()=>assert.equal(idleMoves.length,0));check(()=>assert.equal(clears,cleared+1));
}
ctx.SukunSecretPolicy.unlocked=()=>true;journeyRunning=true;result={status:'completed',completed:3,failed:0,skipped:0};fresh();const cleared=clears;
const activeNext=await ctx.SukunSessionState.command('next');check(()=>assert.equal(activeNext.accepted,true));check(()=>assert.equal(idleMoves.at(-1),'next'));check(()=>assert.equal(clears,cleared));
console.log(JSON.stringify({suite:'r1084 canonical and session projection transitions',passed}));
})().catch(error=>{console.error(error);process.exitCode=1});
