'use strict';
// Actual production navigation function and event listeners; deliberately never
// execute animation frames, modelling a delayed presentation paint.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const src=fs.readFileSync(path.join(root,'assets/runtime/premium-layout-r1215.js'),'utf8');
const code=src.slice(src.indexOf(' function syncReadingNavigation(){'),src.indexOf(' function readings(event)'));
const queue=src.slice(src.indexOf(' function queue(){'),src.indexOf(' desktop.addEventListener'));
let passed=0;
for(const lang of ['tr','en'])for(const hidden of [false,true]){
 const events={},docEvents={},frames=[];
 function node(){const attrs={},classes=new Set();return{attrs,classes,textContent:'',classList:{toggle(k,on){if(on)classes.add(k);else classes.delete(k)}},getAttribute:k=>attrs[k]??null,setAttribute(k,v){attrs[k]=v},removeAttribute(k){delete attrs[k]}}}
 const entry=node(),dhikr=node(),group={id:'zmgOkumalar',open:true},name=node();
 const nodes={r1215ReadingsEntry:entry,zmgOkumalar:group,r616ViewName:name,r616BottomNav:{querySelector:()=>dhikr}};
 const context={window:{addEventListener:(name,cb)=>events[name]=cb},document:{hidden,body:{dataset:{r616View:'zikir'}},addEventListener:(name,cb)=>docEvents[name]=cb,querySelector:()=>({content:'r1259'})},$:id=>nodes[id],english:()=>lang==='en',requestAnimationFrame:fn=>{frames.push(fn);return frames.length},sync:()=>{throw Error('Presentation sync must not be needed')},entry};
 vm.createContext(context);vm.runInContext('let readingButton=entry,readingActive=false,frame=0;\n'+code+queue,context);
 events['sukun:practicesectionchange']({detail:{id:'zmgOkumalar'}});
 assert.equal(entry.getAttribute('aria-current'),'page');assert.equal(dhikr.getAttribute('aria-current'),null);
 events['sukun:practicesectionchange']({detail:{id:'zmgOkumalar'}});
 group.open=false;docEvents.toggle({target:group});
 assert.equal(entry.getAttribute('aria-current'),null,'close clears selection without RAF');assert.equal(dhikr.getAttribute('aria-current'),'page');assert.equal(entry.classes.has('active'),false);assert.match(name.textContent,lang==='tr'?/^Zikir/:/^Dhikr/);
 group.open=true;docEvents.toggle({target:group});assert.equal(entry.getAttribute('aria-current'),'page');
 context.document.body.dataset.r616View='home';events['sukun:r616viewchange']();assert.equal(entry.getAttribute('aria-current'),null,'view departure clears selection without RAF');
 // Closing/opening an unrelated disclosure must not select Readings.
 docEvents.toggle({target:{id:'other',open:true}});assert.equal(entry.getAttribute('aria-current'),null);
 assert.equal(frames.length,hidden?0:1,'layout work remains coalesced');passed++;
}
console.log('PASS immediate native navigation state with delayed/hidden paints, TR/EN, repeated open/close/home ('+passed+' scenarios)');
