'use strict';
// Execute the exact picker-commit queue with controlled browser event/paint
// seams. Native popup opening and shared Navigation behavior are separate QA.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/reading-ui-r1064.js'),'utf8');
const start=source.indexOf(' function queueVerseSelection(number){'),end=source.indexOf('\n function renderYasin(){',start);
assert(start>=0&&end>start,'actual picker queue exists');const queueSource=source.slice(start,end);
const starts=['pointerdown','touchstart','touchmove','wheel','keydown'];
const capture=options=>options===true||!!options?.capture;
function eventHub(){const entries=[];return{entries,addEventListener(type,fn,options){const cap=capture(options);if(!entries.some(x=>x.type===type&&x.fn===fn&&x.capture===cap))entries.push({type,fn,capture:cap})},removeEventListener(type,fn,options){const cap=capture(options),index=entries.findIndex(x=>x.type===type&&x.fn===fn&&x.capture===cap);if(index>=0)entries.splice(index,1)},fire(type,event={}){const e={type,isTrusted:true,...event};for(const x of entries.slice())if(x.type===type&&entries.includes(x))x.fn(e);return e}}}
function fixture(){
 const document=eventHub(),w=eventHub(),frames=[],navigations=[],foreign=[],foreignEvents=[];
 let select={id:'r1064YasinVerse',isConnected:true,value:'7'};document.hidden=false;
 for(const type of [...starts,'click','visibilitychange']){const fn=e=>foreignEvents.push(['document',e.type]);document.addEventListener(type,fn,{capture:starts.includes(type)});foreign.push({hub:document,type,fn,capture:starts.includes(type)})}
 for(const type of ['blur','pagehide']){const fn=e=>foreignEvents.push(['window',e.type]);w.addEventListener(type,fn);foreign.push({hub:w,type,fn,capture:false})}
 const baselineCount=document.entries.length+w.entries.length;
 const c={document,w,$:id=>id==='r1064YasinVerse'?select:null,verseSelectionSequence:0,Number,requestAnimationFrame:fn=>frames.push(fn),scrollVerse:number=>navigations.push(number)};
 vm.createContext(c);vm.runInContext(queueSource,c);
 const count=()=>document.entries.length+w.entries.length;
 return{c,document,w,frames,navigations,foreignEvents,select:()=>select,replace(value='7'){select={id:'r1064YasinVerse',isConnected:true,value};return select},queue:number=>c.queueVerseSelection(number),paintOne(){const fn=frames.shift();assert(fn,'queued paint exists');fn()},paintAll(){while(frames.length)this.paintOne()},transient:()=>count()-baselineCount,
  assertForeign(){assert.equal(count(),baselineCount);for(const old of foreign)assert(old.hub.entries.some(x=>x.type===old.type&&x.fn===old.fn&&x.capture===old.capture),'foreign '+old.type+' listener remains')},
  click(target=select,isTrusted=true){document.fire('click',{target,isTrusted})},input:type=>document.fire(type,{target:select}),hide(){document.hidden=true;document.fire('visibilitychange')},show(){document.hidden=false;document.fire('visibilitychange')}
 };
}
const results=[];function test(name,fn){try{fn();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack})}}
test('Committed native choice accepts its trusted same-select trailing click before first paint',()=>{const f=fixture();assert.equal(f.queue(7),true);assert.equal(f.transient(),9);f.click();assert.equal(f.navigations.length,0);assert.equal(f.transient(),9);f.paintOne();assert.deepEqual(f.navigations,[7]);assert.equal(f.transient(),0);f.assertForeign()});
test('A commit without a trailing click still navigates once at first paint',()=>{const f=fixture();f.queue(7);f.paintAll();assert.deepEqual(f.navigations,[7]);assert.equal(f.transient(),0);f.assertForeign()});
test('Repeated trusted trailing clicks on the same selector remain one committed navigation',()=>{const f=fixture();f.queue(7);f.click();f.click();f.paintAll();assert.deepEqual(f.navigations,[7]);f.assertForeign()});
for(const type of starts)test('New '+type+' cancels the pending choice and immediately removes temporary listeners',()=>{const f=fixture();f.queue(7);f.input(type);assert.equal(f.transient(),0);f.assertForeign();f.paintAll();assert.deepEqual(f.navigations,[]);assert(f.foreignEvents.some(([,event])=>event===type));f.assertForeign()});
test('An outside trusted click cancels pending choice',()=>{const f=fixture();f.queue(7);f.click({id:'another-control'});assert.equal(f.transient(),0);f.paintAll();assert.deepEqual(f.navigations,[]);f.assertForeign()});
test('A programmatic click on the same selector is not adopted as the native completion',()=>{const f=fixture();f.queue(7);f.click(f.select(),false);assert.equal(f.transient(),0);f.paintAll();assert.deepEqual(f.navigations,[]);f.assertForeign()});
for(const type of ['blur','pagehide'])test(type+' retires the pending request even when focus/visibility returns before paint',()=>{const f=fixture();f.queue(7);f.w.fire(type);assert.equal(f.transient(),0);f.document.hidden=false;f.w.fire(type==='blur'?'focus':'pageshow');f.paintAll();assert.deepEqual(f.navigations,[]);f.assertForeign()});
test('A hidden interval retires the request even if visible again before paint',()=>{const f=fixture();f.queue(7);f.hide();assert.equal(f.transient(),0);f.show();f.paintAll();assert.deepEqual(f.navigations,[]);f.assertForeign()});
test('A visible visibilitychange alone does not cancel a native choice',()=>{const f=fixture();f.queue(7);f.show();f.paintAll();assert.deepEqual(f.navigations,[7]);f.assertForeign()});
test('Hidden state at paint blocks navigation even if no lifecycle event was delivered',()=>{const f=fixture();f.queue(7);f.document.hidden=true;f.paintAll();assert.deepEqual(f.navigations,[]);f.assertForeign()});
test('A changed selector value cannot reveal the old verse',()=>{const f=fixture();f.queue(7);f.select().value='12';f.paintAll();assert.deepEqual(f.navigations,[]);f.assertForeign()});
test('A disconnected selector cannot reveal its old verse',()=>{const f=fixture();f.queue(7);f.select().isConnected=false;f.paintAll();assert.deepEqual(f.navigations,[]);f.assertForeign()});
test('A replaced selector with the same value does not inherit the old request',()=>{const f=fixture();f.queue(7);f.replace('7');f.paintAll();assert.deepEqual(f.navigations,[]);f.assertForeign()});
test('A stale generation cannot navigate or remove the latest request listeners',()=>{const f=fixture();f.queue(7);f.select().value='12';f.queue(12);assert.equal(f.transient(),18);f.paintOne();assert.deepEqual(f.navigations,[]);assert.equal(f.transient(),9);f.paintOne();assert.deepEqual(f.navigations,[12]);assert.equal(f.transient(),0);f.assertForeign()});
test('Two commits of the same value still admit only the newest generation',()=>{const f=fixture();f.queue(7);f.queue(7);f.paintOne();assert.deepEqual(f.navigations,[]);assert.equal(f.transient(),9);f.paintOne();assert.deepEqual(f.navigations,[7]);f.assertForeign()});
test('Cancelled old paint cannot remove a fresh request armed after the cancel event',()=>{const f=fixture();f.queue(7);f.input('pointerdown');assert.equal(f.transient(),0);f.select().value='19';f.queue(19);f.paintOne();assert.equal(f.transient(),9);assert.deepEqual(f.navigations,[]);f.click();f.paintOne();assert.deepEqual(f.navigations,[19]);f.assertForeign()});
test('A disconnected selector rejects scheduling and installs no temporary listeners',()=>{const f=fixture();f.select().isConnected=false;assert.equal(f.queue(7),false);assert.equal(f.frames.length,0);assert.equal(f.transient(),0);f.assertForeign()});
test('All temporary listeners are absent after navigation and later events preserve foreign listeners',()=>{const f=fixture();f.queue(7);f.paintAll();for(const type of starts)f.input(type);f.click();f.w.fire('blur');f.w.fire('pagehide');f.hide();f.show();assert.deepEqual(f.navigations,[7]);f.assertForeign();assert(f.foreignEvents.length>=10)});
const report={version:'r1068',root,scope:'Exact production queueVerseSelection with controlled event/RAF seams. Native selector popup and shared Navigation behavior are verified separately.',total:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,results};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
