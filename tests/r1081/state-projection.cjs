'use strict';
// Exercise the production canonical projection, not a duplicated formula.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('const currentZikirState=(()=>{');
const end=html.indexOf('window.currentZikirState=currentZikirState;',start);
assert(start>=0&&end>start,'canonical state module found');
const Z={cat:'berhet',idx:0,target:622,count:11,devir:2,targetMode:'ebced',total:87555};
const items=names=>({items:names.map(tr=>({tr,ar:'',eb:622}))});
const P={queue:[],i:0,playing:false,paused:false};
const ctx={Z,ZIKIR:{berhet:items(['Berhetîhin']),koruma:items(['Felâk','Nâs','İhlâs','Kalem','Âyetel Kürsî']),esma:items(['Yâ Rahmân']),temel:items(['İstiğfar'])},FR:{playing:false},console,CustomEvent:class{}};
ctx.window=ctx;ctx.document={body:{classList:{contains:()=>false}}};ctx.dispatchEvent=()=>{};ctx.R170={Player:P};
ctx.SukunProgressJournal={stepIdentity:s=>JSON.stringify(s||null)};
vm.runInNewContext(html.slice(start,end)+'window.currentZikirState=currentZikirState;',ctx);
let checks=0;
function check(name,run){run();checks++;}
function current(){return ctx.currentZikirState.refresh('test',true);}
function select(step,completed=0){P.queue=[step];P.i=0;P.playing=true;P.paused=false;P._r982RepIndex=0;P._r982RepStep=step;P._r982RepSignature=ctx.SukunProgressJournal.stepIdentity(step);P._r982CompletedReps=completed;return current();}
const directBefore=JSON.stringify(Z);
check('direct projection keeps its own target',()=>{const s=current();assert.equal(s.target,622);assert.equal(s.count,11);assert.equal(s.devir,2);assert.equal(s.targetMode,'ebced');});
for(const cat of ['koruma','esma','temel']){
 check('untagged '+cat+' has its own fixed target',()=>{const s=select({type:'zikir',cat,idx:0,reps:7,repeatMode:'fixed'},3);assert.equal(s.target,7);assert.equal(s.count,3);assert.equal(s.remain,4);assert.equal(s.devir,0);assert.equal(s.targetMode,'fixed');assert.equal(s.source,'smart');});
}
check('legacy saved steps default to fixed',()=>{const s=select({type:'zikir',cat:'koruma',idx:0,reps:7},1);assert.equal(s.target,7);assert.equal(s.count,1);assert.equal(s.remain,6);assert.equal(s.targetMode,'fixed');});
check('tagged protective plan keeps the same projection',()=>{const s=select({type:'zikir',cat:'koruma',idx:4,reps:7,repeatMode:'fixed',protectionPlan:'r1078'},2);assert.equal(s.target,7);assert.equal(s.count,2);assert.equal(s.remain,5);});
check('exact target completion never wraps to zero',()=>{const s=select({type:'zikir',cat:'koruma',idx:0,reps:7,repeatMode:'fixed'},7);assert.equal(s.count,7);assert.equal(s.remain,0);assert.equal(s.pct,1);});
check('over-target persisted credit is bounded',()=>{const s=select({type:'zikir',cat:'koruma',idx:0,reps:7},99);assert.equal(s.count,7);assert.equal(s.remain,0);});
check('paused step retains confirmed progress',()=>{select({type:'zikir',cat:'koruma',idx:1,reps:7},4);P.playing=false;P.paused=true;const s=current();assert.equal(s.count,4);assert.equal(s.target,7);assert.equal(s.session.paused,true);});
check('another queue index cannot lend old credit',()=>{select({type:'zikir',cat:'koruma',idx:0,reps:7},4);P._r982RepIndex=1;assert.equal(current().count,0);});
check('another step object cannot lend old credit',()=>{select({type:'zikir',cat:'koruma',idx:0,reps:7},4);P.queue[0]={...P.queue[0]};assert.equal(current().count,0);});
check('edited repeat count invalidates old credit',()=>{select({type:'zikir',cat:'koruma',idx:0,reps:7},4);P.queue[0].reps=9;const s=current();assert.equal(s.target,9);assert.equal(s.count,0);});
check('in-flight repeat index is never credited',()=>{select({type:'zikir',cat:'koruma',idx:0,reps:7},0);P.repeatIndex=5;assert.equal(current().count,0);});
for(const mode of ['manual','duration']){
 check(mode+' never borrows a finite direct target',()=>{const s=select({type:'zikir',cat:'koruma',idx:0,reps:7,repeatMode:mode},4);P.conditionCount=5;assert.equal(s.target,0);assert.equal(s.count,0);assert.equal(s.remain,null);assert.equal(s.devir,0);assert.equal(s.targetMode,mode);});
}
for(const [reps,target] of [[-1,1],[7.9,7],[99999,99999],[1000000,99999]]){
 check('bounded smart repeat '+reps,()=>{assert.equal(select({type:'zikir',cat:'koruma',idx:0,reps}).target,target);});
}
check('smart queue position is independent of category order',()=>{const a={type:'zikir',cat:'koruma',idx:4,reps:7},b={type:'zikir',cat:'koruma',idx:0,reps:7};select(a);P.queue=[a,b];const s=current();assert.equal(s.session.stepIndex,0);assert.equal(s.session.stepTotal,2);assert.equal(s.position,5);});
// r1084: silence/frequency retain smart presentation without borrowing an
// unrelated dhikr goal. The direct counter remains unchanged underneath.
for(const type of ['frequency','silence'])check('smart '+type+' does not display the direct target',()=>{select({type,ms:1000});const s=current();assert.equal(s.source,'smart');assert.equal(s.target,0);assert.equal(s.count,0);assert.equal(s.session.reading,false);assert.equal(s.session.presentation,true);assert.equal(JSON.stringify(Z),directBefore);});
check('Stop returns to untouched direct counter',()=>{P.playing=false;P.paused=false;const s=current();assert.equal(s.target,622);assert.equal(s.count,11);assert.equal(s.devir,2);assert.equal(JSON.stringify(Z),directBefore);});
const cardOwner=html.match(/function cardSmart\(\)\{[^\n]+\}/)?.[0];
assert(cardOwner,'production wheel owner selector found');vm.runInNewContext(cardOwner,ctx);
check('wheel controls own ordinary smart dhikr',()=>{select({type:'zikir',cat:'koruma',idx:0,reps:7});assert.equal(ctx.cardSmart(),P);});
check('wheel controls retain paused smart owner',()=>{P.playing=false;P.paused=true;assert.equal(ctx.cardSmart(),P);});
check('wheel controls release a stopped smart owner',()=>{P.paused=false;assert.equal(ctx.cardSmart(),null);});
for(const type of ['frequency','silence'])check('wheel does not take over smart '+type,()=>{select({type,ms:1000});assert.equal(ctx.cardSmart(),null);});
console.log(JSON.stringify({passed:checks,failed:0}));
