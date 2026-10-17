'use strict';
// Read the shipping UI's name resolver against both catalog representations.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const source=fs.readFileSync(path.join(root,'assets/runtime/smart-session-ui-r1082.js'),'utf8');
const start=source.indexOf('function stepInfo(step){'),end=source.indexOf('function modeText(step)',start);
assert(start>=0&&end>start);
let english=false,secret=false,describe=null;
const ctx={window:{SukunSecretPolicy:{unlocked:()=>!secret,secretStep:s=>s.cat==='berhet'}},ZIKIR:{esma:{items:[{t:'Nûr',a:'نُور'}]},arinma:{items:[{tr:'Estağfirullâhel-azîm ve etûbü ileyh'}]},empty:{items:[{}]}},safe:(fn,alt=null)=>{try{return fn()??alt}catch{return alt}},engine:()=>describe,t:(tr,en)=>english?en:tr};
vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
const checks=[];function check(name,run){run();checks.push(name)}
check('Esma .t names stay visible rather than the generic Okuma label',()=>assert.equal(ctx.itemName({type:'zikir',cat:'esma',idx:0,reps:11}),'Nûr'));
check('Ordinary .tr names stay visible',()=>assert.equal(ctx.itemName({type:'zikir',cat:'arinma',idx:0}),'Estağfirullâhel-azîm ve etûbü ileyh'));
check('A stale saved label cannot hide a missing catalog reading',()=>assert.equal(ctx.itemName({type:'zikir',cat:'empty',idx:0,label:'Old title'}),'Okuma bulunamadı'));
check('Missing sources are invalid before playback',()=>assert.equal(ctx.stepInfo({type:'zikir',cat:'esma',idx:999}).valid,false));
check('Empty catalog objects are invalid before playback',()=>assert.equal(ctx.stepInfo({type:'zikir',cat:'empty',idx:0}).valid,false));
check('The UI consumes the engine validation result without inventing another item',()=>{describe={describeStep:()=>({valid:false,title:'Eksik kayıt',reason:'missing-source'})};assert.equal(ctx.itemName({type:'zikir',cat:'esma',idx:0}),'Eksik kayıt');assert.equal(ctx.stepInfo({type:'zikir'}).valid,false);describe=null});
check('Invalid-source guidance follows the language choice',()=>{english=true;assert.equal(ctx.itemName({type:'zikir',cat:'absent',idx:0}),'Reading not found');english=false});
check('Locked names remain redacted',()=>{secret=true;assert.equal(ctx.itemName({type:'zikir',cat:'berhet',idx:0}),'Kilitli bölüm');secret=false});
check('Silence remains a named non-reading step',()=>assert.equal(ctx.itemName({type:'silence',ms:5000}),'Sükût'));
console.log(JSON.stringify({suite:'r1084 reading names and validation guidance',passed:checks.length,checks}));
