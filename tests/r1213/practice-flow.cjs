const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/runtime/interface-r920.js','utf8');
const start=source.indexOf('function targetInfo('),end=source.indexOf('function syncJourneySettings(',start);
let direct={cat:'berhet',idx:0,targetMode:'manual',target:622},selected={activeMode:'berhet',activeIndex:0,journeyKind:'28',journeyIndex:0,count:246,target:622};
const nodes={bsMode:{value:'ebced'},es99Mode:{value:'custom'},r920JourneyRestartAll:{}};
let unlocked=true,confirmResult=false,question='',commands=[];
const window={I18N:{lang:'tr'},currentZikirState:{snapshot:()=>direct},SukunBerhetiyyeSeyir:{state:()=>({i:4,rep:21}),display:()=>({index:4,target:250})},SukunEsma99Seyir:{state:()=>({i:17,rep:9}),display:()=>({index:17,target:100})},confirm:q=>(question=q,confirmResult)};
const context={window,$:id=>nodes[id],view:()=>selected,snap:()=>selected,safe:(fn,fallback)=>{try{return fn()}catch{return fallback}},allowed:()=>unlocked,command:async(action,options)=>{commands.push({action,options});return{accepted:true}},wake(){},queue(){}};
vm.createContext(context);vm.runInContext(source.slice(start,end),context);
const describe=window.SukunTargetInfo.describe;
assert.equal(describe(selected).mode,'ebced','journey owns its target even when direct counter is custom');
assert.equal(describe(selected).label,'Ebced hedefi');
assert.equal(describe({...selected,journeyKind:'single'}).label,'Serbest hedef','same numeric target cannot imply Ebced');
nodes.bsMode.value='custom';assert.equal(describe(selected).label,'Serbest hedef');
nodes.bsMode.value='ebced';
assert.equal(describe({...selected,activeMode:'esma',journeyKind:'99'}).mode,'free','public journey reads its own mode');
assert.equal(describe({...selected,activeMode:'esma',journeyKind:'single'}).mode,'unknown','different checkpoint does not inherit another selection');
direct.targetMode='fixed';assert.equal(describe({...selected,journeyKind:'single'}).label,'Sabit hedef');
direct.targetMode='duration';assert.equal(describe({...selected,smartSession:{reading:true},journeyKind:'single'}).mode,'duration');
window.I18N.lang='en';assert.equal(describe(selected).label,'Abjad target');window.I18N.lang='tr';
const questionFn=context.journeyRestartQuestion;
assert.match(questionFn(selected,'28'),/Berhetiyye seyri \(28\)/);assert.match(questionFn(selected,'28'),/1\/28 · bu isimde 246 \/ 622/);
assert.match(questionFn({...selected,journeyKind:'single'},'99'),/18\/99 · bu isimde 9 \/ 100/,'confirmation reads stored journey scope, not unrelated current count');
const handlerStart=source.indexOf("$('r920JourneyRestartAll').onclick=async()=>{"),handlerEnd=source.indexOf("\n $('r920TefEnter').onclick",handlerStart);
vm.runInContext(source.slice(handlerStart,handlerEnd),context);
(async()=>{
 await nodes.r920JourneyRestartAll.onclick();assert.equal(commands.length,0,'cancel sends no selection or restart command');assert.match(question,/kayıtlar ve ayarlar korunur/);
 confirmResult=true;await nodes.r920JourneyRestartAll.onclick();assert.deepEqual(commands.map(x=>x.action),['restart-journey']);
 commands=[];selected={...selected,journeyKind:'single'};await nodes.r920JourneyRestartAll.onclick();assert.deepEqual(commands.map(x=>x.action),['select','restart-journey'],'selection follows confirmation for the same destination');
 commands=[];unlocked=false;await nodes.r920JourneyRestartAll.onclick();assert.equal(commands.length,0,'locked destination cannot reset');
 // Actual compact-strip placement: native nodes are moved once, never cloned.
 class Element{
  constructor(id){this.id=id;this.children=[];this.dataset={};this.parentElement=null;this.hidden=false;this.moves=0;}
  get previousElementSibling(){const a=this.parentElement?.children||[];return a[a.indexOf(this)-1]||null;}
  append(n){if(n.parentElement)n.parentElement.children.splice(n.parentElement.children.indexOf(n),1);this.children.push(n);n.parentElement=this;n.moves++;}
  insertBefore(n,ref){this.append(n);this.children.splice(this.children.indexOf(n),1);this.children.splice(this.children.indexOf(ref),0,n);}
  after(n){this.parentElement.append(n);const a=this.parentElement.children;a.splice(a.indexOf(n),1);a.splice(a.indexOf(this)+1,0,n);}
  contains(n){return n===this||this.children.some(x=>x.contains(n));}
  getAttribute(k){return k==='data-r1057-compact'?this.dataset.r1057Compact:null;}
  setAttribute(k,v){if(k==='data-r1057-compact')this.dataset.r1057Compact=v;}
 }
 const root=new Element('r920Practice'),quick=new Element('r932WheelControls'),hero=new Element('r938Hero'),finish=new Element('r968ManualHint'),summary=new Element('r1056ReadingSummary'),total=new Element('r986Total'),primary=new Element('r1056PrimaryControls'),stop=new Element('r1056FinishRow');
 root.append(hero);root.append(quick);root.append(summary);root.append(total);quick.append(primary);quick.append(stop);quick.append(finish);
 const registry=Object.fromEntries([root,quick,hero,finish,summary,total].map(n=>[n.id,n]));
 const compact=fs.readFileSync('assets/runtime/compact-ui-r1057.js','utf8');const a=compact.indexOf('function sync(root='),b=compact.indexOf('\nfunction start()',a);
 const layout={$:id=>registry[id],attr:(n,k,v)=>{if(n.getAttribute(k)!==v)n.setAttribute(k,v)},frequencySafety(){},helpPlacement(){},labels(){}};
 vm.runInNewContext(compact.slice(a,b)+';this.sync=sync;',layout);layout.sync(root);
 assert.deepEqual(quick.children.map(n=>n.id),['r1056PrimaryControls','r1056FinishRow','r968ManualHint','r1056ReadingSummary']);assert.equal(total.parentElement,summary);
 const moves=summary.moves;layout.sync(root);assert.equal(summary.moves,moves,'count refresh causes no presentation reparenting');
 assert.equal(root.children.filter(n=>n===summary).length,0);assert.equal(quick.children.filter(n=>n===summary).length,1);
 console.log('PASS r1213 practice: owner-aware target captions, scoped reset confirmation and cancel, stable native action/audio order');
})().catch(error=>{console.error(error);process.exitCode=1});
