'use strict';
// Actual presentation controller, native pointer sequencing and CSS/DOM
// composition. Playback/count endpoints are guarded and never commanded.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const code=fs.readFileSync(path.join(root,'assets/runtime/wheels-r924.js'),'utf8'),css=fs.readFileSync(path.join(root,'assets/runtime/wheels-r924.css'),'utf8'),ui=fs.readFileSync(path.join(root,'assets/runtime/interface-r920.js'),'utf8');
const source=code.slice(code.indexOf('/* r929: compositor-only motion;'),code.indexOf('/* r932: stationary shortcuts'));
assert(source.includes('manualStep'),'production mini-step controller boundary');
function events(){const map=new Map();return{addEventListener(type,fn,opt={}){if(!map.has(type))map.set(type,new Set());map.get(type).add(fn);opt.signal?.addEventListener('abort',()=>map.get(type)?.delete(fn),{once:true})},dispatch(type,props={}){const event={type,...props};for(const fn of [...map.get(type)||[]])fn(event)}}}
function fixture({phase='IDLE',enabled=true}={}){
 let at=100000,seq=0,state={phase,count:42,total:142,playing:phase==='PLAYING'};const timers=new Map(),writes=[],commands=[],store=[];
 function node(id){const values=new Map(),children=[];return Object.assign(events(),{id,dataset:{},hidden:false,isConnected:true,style:{getPropertyValue:k=>values.get(k)||'',setProperty(k,v){values.set(k,String(v));writes.push([id,k,String(v)])}},children,append(n){children.push(n);n.parentElement=this},contains(n){return n===this||children.some(child=>child.contains(n))}})}
 const body=node('body');body.classList={contains:()=>false};const frame=node('r924WheelFrame'),clip=node('r1029WheelClip'),rotor=node('r925WheelRotor'),counter=node('r920Counter'),toggle=node('r925WheelMotion'),tekke=node('tk');tekke.hidden=true;
 frame.dataset.wheelState='ready';frame.append(clip);clip.append(rotor);frame.append(counter);
 const elements={r924WheelFrame:frame,r1029WheelClip:clip,r925WheelRotor:rotor,r920Counter:counter,r925WheelMotion:toggle,tk:tekke};
 const document=Object.assign(events(),{hidden:false,body,documentElement:{dataset:{}},getElementById:id=>elements[id]||null});
 const reduced=Object.assign(events(),{matches:false}),window=events();
 const transport=new Proxy({},{get:(_obj,key)=>()=>{commands.push(String(key));throw Error('visual controller attempted playback/count command')}});
 const c={window:null,document,Set,Number,Math,Object,AbortController,matchMedia:()=>reduced,localStorage:{getItem:()=>enabled?null:'0',setItem:(...args)=>store.push(args)},
  SukunSessionState:{peek:()=>({...state}),snapshot:()=>({...state})},PlaybackController:transport,SukunR698Transport:transport,Z:{auto:phase==='PLAYING',count:42,total:142},
  addEventListener:window.addEventListener.bind(window),setTimeout(fn,delay){const id=++seq;timers.set(id,{fn,at:at+delay});return id},clearTimeout:id=>timers.delete(id)};
 c.window=c;vm.createContext(c);vm.runInContext(source,c);
 const host={querySelector:s=>s==='#r924WheelFrame'?frame:s==='#r925WheelMotion'?toggle:null};c.SukunWheelMotion.connect(host);writes.length=0;
 return{c,frame,clip,rotor,counter,toggle,document,reduced,writes,commands,store,timers,api:c.SukunWheelMotion,
  emit(type,props){window.dispatch(type,props)},state:()=>({...state}),setState(next){state={...state,...next};c.SukunWheelMotion.render(state)},
  down(id=1,pointerType='touch',button=0){const e={pointerId:id,pointerType,button};document.dispatch('pointerdown',e);frame.dispatch('pointerdown',e)},
  up(id=1,type='pointerup'){document.dispatch(type,{pointerId:id,pointerType:'touch'})},
  tick(ms){at+=ms;for(const[id,job]of [...timers])if(job.at<=at){timers.delete(id);job.fn()}},
  visible(hidden){document.hidden=hidden;document.dispatch('visibilitychange')}
 };
}
const results=[];function test(name,fn){try{fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
test('accepted idle manual step moves one small signed angle with upright inverse label angle',()=>{
 const f=fixture();assert.equal(f.api.manualStep(),true);const s=f.api.snapshot();assert.equal(s.manualSteps,1);assert.equal(s.manualAngle,-8);assert.equal(f.frame.style.getPropertyValue('--r1053-manual-angle'),'-8deg');assert.equal(f.frame.style.getPropertyValue('--r1053-manual-counter-angle'),'8deg');assert.equal(f.frame.dataset.motion,'paused');assert.equal(f.commands.length,0);assert.equal(f.c.Z.count,42);assert.equal(f.c.Z.total,142);
});
test('rapid accepted taps accumulate one CSS target without new timers or animation owners',()=>{
 const f=fixture();for(let i=0;i<100;i++)assert.equal(f.api.manualStep(),true);assert.equal(f.api.snapshot().manualSteps,100);assert.equal(f.api.snapshot().manualAngle,-800);assert.equal(f.frame.style.getPropertyValue('--r1053-manual-counter-angle'),'800deg');assert.equal(f.timers.size,0);assert.equal(f.store.length,0);assert.equal(f.commands.length,0);
});
test('paused correction can move presentation while its counter owner remains paused',()=>{const f=fixture({phase:'PAUSED'});assert.equal(f.api.manualStep(),true);assert.equal(f.state().phase,'PAUSED');assert.equal(f.frame.dataset.motion,'paused');assert.equal(f.c.Z.auto,false);assert.equal(f.c.Z.count,42);assert.equal(f.commands.length,0)});
for(const mode of ['hidden','reduced','saving','disabled','loading','disconnected','tekke'])test(`${mode} state suppresses a mini-step without changing count or playback`,()=>{
 const f=fixture({enabled:mode!=='disabled'});if(mode==='hidden')f.document.hidden=true;if(mode==='reduced')f.reduced.matches=true;if(mode==='saving')f.document.documentElement.dataset.r920Performance='saving';if(mode==='loading')f.frame.dataset.wheelState='loading';if(mode==='disconnected')f.frame.isConnected=false;if(mode==='tekke')f.document.getElementById('tk').hidden=false;
 assert.equal(f.api.manualStep(),false);assert.equal(f.api.snapshot().manualSteps,0);assert.equal(f.api.snapshot().manualAngle,0);assert.equal(f.commands.length,0);assert.equal(f.c.Z.count,42);assert.equal(f.timers.size,0);
});
test('automatic session counter updates never add a manual offset',()=>{const f=fixture({phase:'PLAYING'});f.setState({count:100,total:200});f.api.render();assert.equal(f.api.snapshot().manualSteps,0);assert.equal(f.frame.style.getPropertyValue('--r1053-manual-angle'),'0deg');assert.equal(f.commands.length,0)});
test('ordinary touch never changes the automatic transform state or schedules a release',()=>{
 const f=fixture({phase:'PLAYING'}),before=f.state();f.down();f.tick(10000);f.up();assert.equal(f.frame.dataset.motion,'running');assert.equal(f.api.snapshot().holding,false);assert.equal(f.api.snapshot().activePointers,0);assert.deepEqual(f.state(),before);assert.equal(f.commands.length,0);assert.equal(f.timers.size,0);assert.equal(f.api.snapshot().manualAngle,0);
});
test('hide and return obey current playback eligibility independently of a prior touch',()=>{
 const f=fixture({phase:'PLAYING'});f.down();f.visible(true);assert.equal(f.frame.dataset.motion,'paused');f.visible(false);assert.equal(f.frame.dataset.motion,'running');f.setState({phase:'PAUSED',playing:false});f.visible(true);f.visible(false);assert.equal(f.frame.dataset.motion,'paused');assert.equal(f.commands.length,0);assert.equal(f.timers.size,0);
});
test('mini-step writes only composed angle variables and preserves fixed counter/clip geometry',()=>{
 const f=fixture();f.api.manualStep();assert(f.writes.length);assert(f.writes.every(([id,key])=>id==='r924WheelFrame'&&['--r1053-manual-angle','--r1053-manual-counter-angle'].includes(key)));assert.equal(f.counter.style.getPropertyValue('transform'),'');assert.equal(f.clip.style.getPropertyValue('transform'),'');assert.equal(f.rotor.style.getPropertyValue('animation'),'');assert.equal(f.rotor.style.getPropertyValue('transform'),'');
 assert(css.includes('#r920Practice #r1029WheelClip{position:absolute!important;inset:0!important;z-index:3!important;overflow:hidden!important;overflow:clip!important;pointer-events:none!important;transform:none!important;animation:none!important}'));
 assert(css.includes('animation:r925WheelTurn 72s linear infinite!important;animation-play-state:paused!important'));assert(css.includes('animation:r925LabelTurn 72s linear infinite!important;animation-play-state:paused!important'));
 assert(css.includes('#r920Practice #r925WheelRotor{rotate:var(--r1053-manual-angle,0deg)!important;transition:rotate 180ms'));
 assert(css.includes('#r920Practice .r925GemLabel{rotate:var(--r1053-manual-counter-angle,0deg)!important;transition:rotate 180ms'));
 const rotorMarkup=ui.slice(ui.indexOf('<div id="r925WheelRotor">'),ui.indexOf('</div></div><svg class="r920Progress"'));for(const id of ['r920Wheel','r920Minus','r920Plus','r920Stop','r920Play'])assert(rotorMarkup.includes(`id="${id}"`),'art and stone controls must share the same composed rotation');assert(!rotorMarkup.includes('id="r920Counter"'),'counter must remain outside the moving plane');
});
const report={method:'Actual presentation-only controller with pointer events, clock and guarded count/playback endpoints, plus shipped CSS/DOM composition contracts. This does not measure a physical compositor or Android display.',passed:results.filter(r=>r.passed).length,total:results.length,results};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
