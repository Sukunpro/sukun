'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=html.slice(html.indexOf('window.SukunCountCorrection=(()=>{'),html.indexOf('\n\n\nfunction rep(){'));
let passed=0;
function fixture(kind='single',phase='IDLE'){
 let owner=true,busy=false,saves=0,stats=[],persisted;
 const st={i:0,rep:2,totalDone:12,token:3,attemptSeq:4,paused:phase==='PAUSED',run:false,systemHold:false};
 const c={document:{hidden:false},Z:{cat:kind==='28'?'berhet':'esma',idx:0,count:2,target:100,total:22,devir:0},Object,Number,String,Math,
  S:{set(k,v){persisted=v}},zUI(){},SukunSecretPolicy:{unlocked:()=>true},SukunTabOwner:{owns:()=>owner},
  SukunManualVoice:{busy:()=>busy},SukunUsageStatsAdjustR695:(delta)=>stats.push(delta)};
 c.window=c;c.s={phase,journeyKind:kind,count:2,target:100,activeMode:c.Z.cat,activeIndex:0,canonical:{mode:c.Z.cat,index:0}};
 c.SukunSessionState={snapshot:()=>({...c.s,count:kind==='single'?c.Z.count:st.rep})};
 for(const name of ['SukunManualFeedback','SukunManualCounter','SukunVoiceResolver','SukunTickSound','speechSynthesis'])c[name]=new Proxy({},{get(_t,key){if(key==='isRecording'||key==='speaking'||key==='pending')return false;throw Error('Unexpected audio/repetition access '+name+'.'+String(key))}});
 vm.createContext(c);vm.runInContext(source,c);
 if(kind!=='single'){
 const cat=c.Z.cat,variable=kind==='28'?'BS':'ES',api=kind==='28'?'SukunBerhetiyyeSeyir':'SukunEsma99Seyir';
 c[variable]=st;c.ZIKIR={[cat]:{items:[{}]}};c.repeatCount=c.countFor=()=>100;c.seyirSave=c.save=()=>{saves++;persisted=JSON.parse(JSON.stringify(st))};c.seyirUI=c.ui=()=>{};
 const method=html.match(new RegExp('setCount\\(value\\)\\{const it=ZIKIR\\.'+cat+'[^\\n]+'))[0].replace(/,$/,'');
 c[api]={state:()=>st};c[api].setCount=vm.runInContext('({'+method+'}).setCount',c);
 }
 return {c,st,owner:v=>owner=v,busy:v=>busy=v,get saves(){return saves},get stats(){return stats},get persisted(){return persisted}};
}
function test(name,fn){fn();passed++;console.log('PASS '+name)}
for(const kind of ['single','99','28'])for(const phase of ['IDLE','PAUSED'])test(`${kind} ${phase} silent native set, persisted delta, no completion`,()=>{
 const f=fixture(kind,phase),a=f.c.SukunCountCorrection;
 assert.equal(a.set('59'),true);assert.equal(f.c.Z.count,59);assert.equal(f.c.Z.total,79);assert.deepEqual(f.stats,[57]);assert.equal(f.c.Z.idx,0);assert.equal(f.c.s.phase,phase);assert.equal(f.st.run,false);
 if(kind!=='single'){assert.equal(f.st.rep,59);assert.equal(f.st.totalDone,69);assert.equal(f.persisted.rep,59);assert.equal(f.st.token,4);assert.equal(f.st.attemptSeq,5);assert.equal(f.st.paused,phase==='PAUSED')}
 assert.equal(a.set(99),true);assert.equal(a.set(100),false);assert.equal(a.set(101),false);assert.equal(f.c.Z.count,99);assert.equal(a.set(0),true);assert.equal(f.c.Z.count,0);
});
for(const invalid of ['', ' ', '-1','1.5','1e2','Infinity','NaN','0x10',NaN,Infinity,null,undefined,{},1.2,-1])test('reject '+String(invalid),()=>{const f=fixture(),before=JSON.stringify(f.c.Z);assert.equal(f.c.SukunCountCorrection.set(invalid),false);assert.equal(JSON.stringify(f.c.Z),before);assert.deepEqual(f.stats,[])});
for(const phase of ['PLAYING','PREPARING','ERROR'])test('block '+phase,()=>{const f=fixture('single',phase);assert.equal(f.c.SukunCountCorrection.set(59),false)});
for(const block of ['owner','hidden','busy','smart','pending','transition','canonical','complete','locked','hold'])test('block '+block,()=>{
 const f=fixture(block==='canonical'||block==='complete'||block==='locked'||block==='hold'?'99':'single','PAUSED');
 if(block==='owner')f.owner(false);if(block==='hidden')f.c.document.hidden=true;if(block==='busy')f.busy(true);if(block==='smart')f.c.s.smartSession={};
 if(block==='pending')f.c.SukunR698Transport={snapshot:()=>({pendingStart:true})};if(block==='transition')f.c.SukunZikirTransaction={snapshot:()=>({active:{phase:'pending'}})};
 if(block==='canonical')f.c.s.canonical.index=1;if(block==='complete')f.c.s.journeyComplete=true;if(block==='locked')f.c.SukunSecretPolicy.unlocked=()=>false;if(block==='hold')f.st.systemHold=true;
 assert.equal(f.c.SukunCountCorrection.set(59),false);assert.equal(f.c.Z.count,2);
});
test('target one and free-count bounds',()=>{const f=fixture();f.c.s.target=1;assert.equal(f.c.SukunCountCorrection.set(1),false);assert.equal(f.c.SukunCountCorrection.set(0),true);f.c.s.target=0;assert.equal(f.c.SukunCountCorrection.set(999999999),true);assert.equal(f.c.SukunCountCorrection.set(1000000000),false)});
for(const kind of ['99','28'])test('reject wrong selected owner '+kind,()=>{const f=fixture(kind);f.c.s.journeyKind='single';assert.equal(f.c[kind==='28'?'SukunBerhetiyyeSeyir':'SukunEsma99Seyir'].setCount(59),false);assert.equal(f.st.rep,2)});
console.log(JSON.stringify({passed}));
