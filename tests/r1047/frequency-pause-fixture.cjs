'use strict';
// Controlled source-function fixture. No browser, network, recordings or real audio.
// Source root is argv[2], otherwise two directories above this test folder.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const input=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.statSync(input).isDirectory()?path.join(input,'index.html'):input;
const html=fs.readFileSync(source,'utf8');
const codeFor=id=>{const re=new RegExp('<script\\b[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>'); const m=html.match(re);assert(m,id);return m[1];};
const between=(start,end,from=0)=>{const s=html.indexOf(start,from);assert(s>=0,start);const e=html.indexOf(end,s+start.length);assert(e>s,end);return html.slice(s,e);};
const lineFor=s=>html.slice(0,html.indexOf(s)).split('\n').length;
const fn=(name,next,from=0)=>between('function '+name+'(', 'function '+next+'(',from);
function harness(){
 const calls=[],timers=new Map(),listeners={},nodes=new Map();let now=100000,id=0;
 const cls=()=>{const s=new Set();return{add(...x){x.forEach(v=>s.add(v))},remove(...x){x.forEach(v=>s.delete(v))},contains(x){return s.has(x)},toggle(x,v){const on=v===undefined?!s.has(x):!!v;on?s.add(x):s.delete(x);return on},values(){return[...s]}}};
 function node(id){return{id,textContent:'',dataset:{},style:{setProperty(){}},classList:cls(),attrs:{},disabled:false,hidden:false,value:'1',children:[],setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]??null},querySelector(){return null},querySelectorAll(){return[]},replaceChildren(...x){this.children=x},append(...x){this.children.push(...x)},closest(s){return s.split(',').some(x=>x.trim()==='#'+this.id)?this:null},addEventListener(){}};}
 ['miniBar','mbPause','mbPulse','mbLive','mbT','mbS','r170Now','r170Play','r588Play','r588Stop','r588DockShell','frToggle','carSld','beatSld','carNum','beatNum','beatVal','bandName','bandDesc','lrInfo','orb','frVolVal'].forEach(x=>nodes.set(x,node(x)));
 const d={body:node('body'),readyState:'loading',hidden:false,visibilityState:'visible',getElementById:id=>nodes.get(id)||null,querySelector:s=>s.startsWith('#')?nodes.get(s.slice(1))||null:null,querySelectorAll:()=>[],createElement:tag=>node(tag),addEventListener(k,f){(listeners['doc:'+k]??=[]).push(f)}};
 class FakeDate extends Date {static now(){return now;}}
 const c={console,Promise,Date:FakeDate,Math,JSON,Map,Set,Object,Array,Number,String,Error,TypeError,document:d,navigator:{},CustomEvent:class {constructor(type,init){this.type=type;this.detail=init?.detail}},performance:{now:()=>now},setTimeout(f,ms=0){const i=++id;timers.set(i,{f,at:now+ms});return i},clearTimeout(i){timers.delete(i)},requestAnimationFrame(f){const i=++id;timers.set(i,{f,at:now+16});return i},cancelAnimationFrame(i){timers.delete(i)},addEventListener(k,f){(listeners[k]??=[]).push(f)},dispatchEvent(e){for(const f of listeners[e.type]||[])f(e)},MutationObserver:class {observe(){}},speechSynthesis:{speaking:false,pending:false,cancel(){calls.push('speech.cancel')}},localStorage:{getItem(){return null}},clamp:(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),bandOf:()=>['alpha','Alfa','desc'],FR:{playing:false,c:180,b:8,mode:'bin',vol:.3},MINI:{paused:false,wasAuto:false},Z:{auto:false,count:7,target:33},SES:{ler:new Set()},AMB:{},PREVIEW:{},AMBIENT_DEFS:[],chVol:{},DONGU:{},master:{},LOG:{touch(){},maybeEnd(){}},setFill(){},renderBeatChips(){},pinkOn(){},pinkOff(){},harmonikKur(){},stopJourney(){},uzamKur:(E,out)=>out,ttsDurakla(){calls.push('tts.pause')},ttsSurdur(){calls.push('tts.resume')},autoStop(){c.Z.auto=false;calls.push('auto.stop')},autoStart(){calls.push('auto.start')},tvkBtnTazele(){},sesDurdur(){},sukunReport(...x){calls.push(['report',...x.map(String)])},currentZikirState:{snapshot:()=>null},SukunDirectZikirTransportR698:{state:()=>({auto:false}),start(){calls.push('direct.start');return true}},SukunVoiceSource:{snapshot:()=>({kind:'idle'})},SukunJourneyAudioMachine:{intent(t,s){calls.push(['intent',t,s]);this.type=t},pauseIntentActive(){return this.type==='pause'},snapshot(){return{intent:{type:this.type||''}}}},AudioLife:{userPaused:false,set(s,r){this.state=s;calls.push(['life.set',s,r]);c.dispatchEvent(new c.CustomEvent('sukun:audiostate',{detail:{state:s}}))},markUserPause(r){this.userPaused=true;calls.push(['life.pause',r])},markUserPlay(r){this.userPaused=false;calls.push(['life.play',r])},markUserStop(r){this.userPaused=false;calls.push(['life.stop',r])},markInterruption(r){calls.push(['life.interruption',r])},setOwner(){},busy:()=>c.FR.playing},SukunItemRecording:{snapshot:()=>({phase:'idle',preparing:false})},SukunTickSound:{isRecording:()=>false},SukunPhysicalRecordingBusyR696:()=>false,SukunForegroundArbiter:{snapshot:()=>({owner:null,queue:[],draining:false,observed:{spokenOwners:[]}})},SukunAudioTruth:{snapshot:()=>({tangible:c.ctx.state==='running'&&c.FR.playing})}};
 const audioNode=()=>({gain:{value:0,setTargetAtTime(){}},frequency:{value:0,setTargetAtTime(){}},connect(){}});
 c.ctx={state:'running',currentTime:0,sampleRate:48000,createChannelMerger:audioNode,suspend(){calls.push('ctx.suspend');this.state='suspended';return Promise.resolve()},resume(){calls.push('ctx.resume');this.state='running';return Promise.resolve()}};
 c._sukDurduruluyor=false;c.sukunDurdurmaIzi=()=>{};c.chOff=()=>{};c.syncMixerUI=()=>{};c.rxEsmaBgStop=()=>{};c.clearInterval=()=>{};
 c.ac=()=>{}; // Replaced below by the unchanged source ac().
 c.g=audioNode;c.osc=audioNode;c.flt=audioNode;c.makeEnv=()=>({n:n=>n,play:n=>n,kill(){calls.push('env.kill')}});
 c.window=c;c.$=s=>d.querySelector(s);c.$$=s=>d.querySelectorAll(s);
 vm.createContext(c);const run=(s,label)=>vm.runInContext(s,c,{filename:label});
 run(fn('miniPlayingInfo','miniDurumYaz'),'actual-miniPlayingInfo+event-hooks');
 run(fn('miniDurumYaz','miniSync')+fn('miniSync','miniClearPause')+fn('miniClearPause','miniPause')+fn('miniPause','miniResume')+between('function miniResume(){','/* ══════════════════════════════════════════════════════════════════\n   SIRALI'),'actual-mini-functions');
 run(between('function ac(){','/* ── Günlük manevi söz / hatırlatma ── */'),'actual-ac');
 run(fn('frSafeCarrier','frStart')+fn('frStart','frStop')+fn('frStop','frRetune'),'actual-frequency-functions');
 run(between('function hardStopAll(){',"$('#stopAll').onclick=hardStopAll;"),'actual-hardStopAll');
 run(between('function syncFreqUI(){','/* ════════════════════════════════════════════════════════════\n   5)'),'actual-frequency-ui');
 run(html.split('\n').find(x=>x.startsWith('const _mFrS=frStart;')),'actual-mini-frStart-wrapper');
 run(between("try{if(typeof frStart==='function')","try{if(typeof frStop==='function')"),'actual-AudioLife-frStart-wrapper');
 run(codeFor('r454-audio-session-registry-runtime'),'actual-registry');
 c.SukunNowPlayingStore={get:()=>{const s=c.PlaybackController.snapshot();return{...s,moduleTitle:s.title}},refresh(){c.currentFlowState?.refresh('fixture-np-refresh',true)}};
 run(codeFor('r508-current-flow-state'),'actual-current-flow');
 run(codeFor('r698-transport-authority'),'actual-r698-transport');
 run(codeFor('r654-terminal-audio-reconcile'),'actual-terminal-reconcile');
 // Actual dock renderer, with structural/irrelevant metadata helpers controlled.
 const dock=codeFor('r588-single-owner-dock-runtime');
 const prefix=dock.slice(dock.indexOf('const $='),dock.indexOf('function activeFlow'));
 const handler=dock.slice(dock.indexOf('function onClick(e)'),dock.indexOf('function setMode(next'));
 const render=dock.slice(dock.indexOf('function render(state)'),dock.indexOf('function syncAlerts'));
 run(`(()=>{${prefix}\n const ensure=()=>true,titleFor=()=>'',r697Voice=()=>{},setMode=()=>{},syncAlerts=()=>{},layers=()=>[],calcName=()=>''; ${render};${handler};window.fixtureRenderDock=render;window.fixtureDockClick=onClick})();`,'actual-dock-renderer');
 c.fixtureSnapshot=label=>{c.currentFlowState.refresh(label,true);c.fixtureRenderDock();return{label,aggregate:c.SukunAudioSessionRegistry.aggregateSnapshot(),mix:c.SukunAudioSessionRegistry.state('mix'),MINI:{...c.MINI},FRPlaying:c.FR.playing,ctxState:c.ctx.state,bodyPlayback:d.body.dataset.playbackState,mixPausedClass:d.body.classList.contains('r439-mix-paused'),flow:c.currentFlowState.snapshot(),dockLabel:nodes.get('r588Play').getAttribute('aria-label'),frLabel:nodes.get('frToggle').textContent,ctxSuspendCalls:calls.filter(x=>x==='ctx.suspend').length,ctxResumeCalls:calls.filter(x=>x==='ctx.resume').length}};
 async function advance(ms){const limit=now+ms;let n=0;while(true){await Promise.resolve();await Promise.resolve();const pending=[...timers].filter(([i,t])=>t.at<=limit).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0]);if(!pending.length)break;if(++n>3000)throw Error('timer loop');const [i,t]=pending[0];timers.delete(i);now=t.at;t.f();}now=limit;await Promise.resolve();await Promise.resolve();}
 return{c,d,nodes,run,calls,advance};
}
module.exports={harness,source};
