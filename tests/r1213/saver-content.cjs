/* Presentation regressions: switching saver density must never select, pause,
   reset, or rewrite a dhikr session. Run with node, without a browser. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('assets/runtime/saver-info-r1193.js','utf8');
function between(start,end){const i=source.indexOf(start),j=source.indexOf(end,i);assert(i>=0&&j>i);return source.slice(i,j);}
function node(){return {textContent:'',dataset:{},attrs:{},style:{},hidden:false,scrollTop:31,setAttribute(k,v){this.attrs[k]=v;},querySelector(selector){return (this.children||={})[selector]||=node();}};}
function fixture(saved,throws=false){
 const ids=['kandil','r1213SaverContent','r1213SaverSimple','r1213SaverDetailed','r1193PalaceState','r1193SaverActive','r1193SaverEmpty','r1213SaverCount','r1213SaverProgress','r1193SaverEsma','r1193SaverBerhet','r1193SaverQuote','r1193SaverSource','r1213SaverReflection'];
 const nodes=Object.fromEntries(ids.map(id=>[id,node()])),writes=[];
 const data={esma:[{t:'Rahmân',m:'Rahmeti bütün varlığı kuşatan'}],berhet:[{tr:'Berhetîhin',mean:'Tenzih, arınma ve iç temizlik',serh:'Geleneksel tefekkür yorumu'}]};
 const c={nodes,root:node(),$:(id)=>nodes[id],tr:a=>a,set:(e,v)=>{if(e)e.textContent=v},items:m=>data[m],allowed:()=>c.access,
  access:true,localStorage:{getItem(){if(throws)throw Error('private mode');return saved},setItem(k,v){if(throws)throw Error('quota');writes.push([k,v])}},
  window:{},document:{querySelector:()=>null},Date,Math,Number,mount:()=>true,journeyInfo:()=>{},timingInfo:()=>{}};
 c.window.SukunSessionState={peek:()=>c.session};
 c.window.SukunTargetInfo={describe:s=>({label:s.journeyKind==='28'?'Ebced hedefi':'Serbest hedef'})};
 vm.createContext(c);
 vm.runInContext(between('const CONTENT_KEY=','function checkpoint(')+between('function checkpoint(','function mount(')+between('function card(','function name(')+between('function render()','async function load(')+'this.test={setContent,contentUI,progressInfo,checkpoint,render,content:()=>contentMode};',c);
 return {c,nodes,writes};
}
const f=fixture(null);assert.equal(f.c.test.content(),'detailed','upgrade preserves detailed information by default');
f.c.test.contentUI();assert.equal(f.nodes.r1213SaverDetailed.attrs['aria-pressed'],'true');
assert.equal(f.c.test.setContent('simple'),true);assert.equal(f.c.test.content(),'simple');
assert.deepEqual(f.writes,[['sukun.kandil.content','simple']]);
assert.equal(f.nodes.kandil.dataset.saverContent,'simple');assert.equal(f.nodes.r1213SaverSimple.attrs['aria-pressed'],'true');assert.equal(f.nodes.r1213SaverSimple.dataset.sukunSurface,'emerald');assert.equal(f.nodes.r1213SaverDetailed.attrs['aria-pressed'],'false');
assert.equal(f.c.test.setContent('cinematic'),false,'quality values cannot change content density');assert.equal(f.c.test.content(),'simple');
assert.equal(fixture('simple').c.test.content(),'simple','saved mode survives a fresh load');assert.equal(fixture('corrupt').c.test.content(),'detailed');
const denied=fixture(null,true);assert.doesNotThrow(()=>denied.c.test.setContent('simple'));assert.equal(denied.c.test.content(),'simple','storage-denied users can still switch this session');
const session={activeMode:'berhet',activeIndex:0,journeyKind:'28',count:246,target:622,phase:'PAUSED',paused:true,journey:{active:true}};
f.c.session=session;const before=JSON.stringify(session);f.c.test.render();
assert.equal(f.nodes.r1193SaverActive.hidden,false);assert.equal(f.nodes.r1193SaverActive.querySelector('span').textContent,'Seyir 1/28 · Ebced hedefi 622');assert.equal(f.nodes.r1213SaverCount.textContent,'246 / 622');assert.equal(f.nodes.r1213SaverProgress.value,246);assert.equal(f.nodes.r1213SaverProgress.max,622);assert.equal(f.nodes.r1213SaverProgress.attrs['aria-valuetext'],'246 / 622');
assert.equal(f.nodes.r1213SaverReflection.querySelector('p').textContent,'Tenzih, arınma ve iç temizlik');
f.c.test.setContent('detailed');f.c.test.render();assert.equal(JSON.stringify(session),before,'density changes are presentation-only');
assert.equal(f.writes.every(([key])=>key==='sukun.kandil.content'),true,'never writes session or quality preferences');
f.c.session={activeMode:'esma',activeIndex:0,journeyKind:'single',count:12,target:100,phase:'PAUSED',paused:true};f.c.test.render();assert.equal(f.nodes.r1193SaverActive.querySelector('span').textContent,'Serbest hedef 100');
f.c.session.target=0;f.c.test.render();assert.equal(f.nodes.r1213SaverProgress.hidden,true,'unbounded counts must not show fabricated progress');assert.equal(f.nodes.r1213SaverCount.textContent,'12');
f.c.session={...session,count:900};f.c.test.render();assert.equal(f.nodes.r1213SaverProgress.value,622,'bar clamps while actual count remains visible');assert.equal(f.nodes.r1213SaverCount.textContent,'900 / 622');
f.c.access=false;f.c.test.render();assert.equal(f.nodes.r1193SaverActive.hidden,true,'private checkpoint is hidden when gate closes');assert.equal(f.nodes.r1193SaverBerhet.hidden,true);assert.equal(f.nodes.r1213SaverReflection.querySelector('p').textContent,'Kalbin yöneldiği iyilik, küçük bir adımla başlar.','private reflection must not remain visible');
console.log('PASS: saver content persistence, invalid/storage-denied fallback, accessible toggle state, independent quality, Ebced/Serbest labels, progress bounds, session preservation and gate privacy.');
