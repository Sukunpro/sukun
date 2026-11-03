const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const path=require('path');const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const src=fs.readFileSync(path.join(root,'assets/runtime/interface-r920.js'),'utf8');
const code=src.slice(src.indexOf('function writeJourneySetting('),src.indexOf('function wake()'));assert(code.includes('function syncJourneySettings'));
for(const [mode,journey,unlocked,permit] of [['esma','99',false,true],['esma','99',true,true],['berhet','28',false,false],['berhet','28',true,true],['esma','single',false,false],['berhet','single',true,false],['esma','28',true,false],['other','99',true,false]]){
 const controls={},events=[];let state={activeMode:mode,journeyKind:journey};
 const el=(id,obj={})=>controls[id]=Object.assign({id,hidden:false,value:'',dataset:{},options:[],replaceChildren(...items){this.options=items}},obj);
 el('r920JourneySettings');el('r920RepeatMode');el('r920RepeatGap');el('r920RepeatCustom');el('r920RepeatCustomLabel');
 for(const prefix of ['bs','es99']){
  el(prefix+'Mode',{value:'ebced',options:[{value:'1',textContent:'1 kez'},{value:'ebced',textContent:'Ebced'},{value:'custom',textContent:'Özel'}],dispatchEvent:e=>events.push([prefix+'Mode',e.type])});
  el(prefix+'Gap',{value:'1000',options:[{value:'1000',textContent:'1 sn'}],dispatchEvent:e=>events.push([prefix+'Gap',e.type])});
  el(prefix+'Custom',{value:'33',dispatchEvent:e=>events.push([prefix+'Custom',e.type])});
 }
 const ctx={snap:()=>state,allowed:()=>unlocked,$:id=>controls[id]||null,prop:(n,k,v)=>{if(n)n[k]=v},value:(n,v)=>{if(n)n.value=String(v)},document:{createElement:()=>({})},Event:class {constructor(type){this.type=type}},window:{SukunSessionState:{refresh:()=>{}}},queue:()=>{},Array};
 vm.createContext(ctx);vm.runInContext(code+';syncJourneySettings(snap());writeJourneySetting("Mode","custom","change");',ctx);
 assert.equal(controls.r920JourneySettings.hidden,!permit,`${mode}/${journey}/${unlocked} visible`);
 assert.equal(events.length,permit?1:0,`${mode}/${journey}/${unlocked} writes`);
 if(permit){assert.equal(events[0][0],(mode==='berhet'?'bs':'es99')+'Mode');assert.equal(controls.r920RepeatMode.value,'ebced');}
 const modePerm=vm.runInContext(`journeyModeAllowed(${JSON.stringify(mode)})`,ctx);
 assert.equal(modePerm,mode==='esma'||mode==='berhet'&&unlocked);
}
console.log('8/8 public/private journey permission cases passed');
