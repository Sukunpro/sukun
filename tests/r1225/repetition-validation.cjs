'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.argv[2]||path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'nero.html'),'utf8'),ui=fs.readFileSync(path.join(root,'assets/runtime/interface-r920.js'),'utf8'),journal=fs.readFileSync(path.join(root,'assets/runtime/progress-journal-r982.js'),'utf8');
let checks=0;function check(fn){fn();checks++}
const invalid=['','-1','0','2.5','10000','100000','Infinity','NaN'];
function input(value){return {value,dataset:{r1225Custom:'47'},setCustomValidity(x){this.error=x},setAttribute(k,v){this[k]=v}}}
for(const [prefix,name,end] of [['bs','repeatCount','function seyirSave'],['es99','countFor','function save']]){
 const start=html.indexOf('function '+name+'('),src=html.slice(start,html.indexOf(end,start));
 const c=input('47'),mode={value:'custom'},nodes={[prefix+'Custom']:c,[prefix+'Mode']:mode};
 const ctx={document:{getElementById:id=>nodes[id]},$:id=>nodes[id]};vm.createContext(ctx);vm.runInContext(src,ctx);
 for(const value of invalid){c.value=value;check(()=>assert.equal(ctx[name]({eb:12}),47))}
 for(const value of ['1','9999']){c.value=value;check(()=>assert.equal(ctx[name]({eb:12}),Number(value)))}
 const bindStart=html.indexOf(prefix==='bs'?'function bindSeyir()':'function bind(){',start);
 const handlerStart=html.indexOf('if(c)c.oninput=()=>{',bindStart),handler=html.slice(handlerStart,html.indexOf('\n  };',handlerStart)+5);
 let calls=0;const handlerCtx={c,targetEdit:()=>calls++};vm.createContext(handlerCtx);vm.runInContext(handler,handlerCtx);
 for(const value of invalid){c.value=value;c.oninput();check(()=>{assert.equal(c.value,'47');assert.equal(calls,0);assert.equal(c['aria-invalid'],'true')})}
 c.value='9999';c.oninput();check(()=>{assert.equal(c.dataset.r1225Custom,'9999');assert.equal(calls,1);assert.equal(c.error,'')});
}
// Invalid presentation drafts never reach native controls, refresh, or save paths.
const c=input('47'),native=input('47'),mode={value:'custom'};let dispatched=0,refreshed=0;
native.dispatchEvent=()=>dispatched++;mode.dispatchEvent=()=>dispatched++;
const ctx={$:id=>id==='r920RepeatCustom'?c:id==='es99Custom'?native:mode,snap:()=>({activeMode:'esma'}),journeySettingsAllowed:()=>true,Event:function(){},window:{SukunSessionState:{refresh:()=>refreshed++}},queue:()=>{}};
vm.createContext(ctx);const st=ui.indexOf('function writeJourneySetting(');vm.runInContext(ui.slice(st,ui.indexOf('// Public Esmâ settings',st)),ctx);
for(const value of invalid){c.value=value;ctx.writeJourneySetting('Custom',value,'input');check(()=>{assert.equal(native.value,'47');assert.equal(dispatched,0);assert.equal(refreshed,0)})}
ctx.writeJourneySetting('Custom','9999','input');check(()=>{assert.equal(native.value,'9999');assert.equal(dispatched,1)});
c.value='2.5';ctx.writeJourneySetting('Mode','ebced','change');check(()=>{assert.equal(c.value,'9999');assert.equal(c.error,'')});
// Journal accepts exactly the same integer range without modifying counters.
const jctx={obj:x=>x&&typeof x==='object',integer:(x,max=1e12)=>Number.isSafeInteger(x)&&x>=0&&x<=max,text:(x,n)=>typeof x==='string'&&x.length<=n,num:(x,a,b)=>typeof x==='number'&&x>=a&&x<=b};vm.createContext(jctx);
const js=journal.indexOf('function journey(');vm.runInContext(journal.slice(js,journal.indexOf('function step(',js)),jctx);
const saved={i:3,rep:21,totalDone:321,mode:'custom',custom:47,gap:900,active:false};
for(const value of invalid){check(()=>assert.throws(()=>jctx.journey({...saved,custom:Number(value)},98),/journey-invalid/))}
for(const value of [1,47,9999])check(()=>assert.equal(jctx.journey({...saved,custom:value},98).rep,21));
console.log(`F02 repetition validation: ${checks} checks passed (controlled source test, not device acceptance).`);
