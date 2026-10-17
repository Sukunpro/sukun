'use strict';
// Actual two shipped activation callbacks; only the asynchronous lookup result
// and surrounding DOM/player are controlled. The store transaction has its
// own tests. In particular, a shared lastError must never drive these alerts.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const savedStart=html.indexOf("b.onclick=async()=>{const intent=window.__r1089SavedOpenIntent"),savedEnd=html.indexOf(';h.appendChild(b)',savedStart);
assert(savedStart>0&&savedEnd>savedStart,'actual saved activation callback is located');
const favoriteStart=html.indexOf(' const openSaved=async id=>{'),favoriteEnd=html.indexOf('\n f.querySelectorAll',favoriteStart);
assert(favoriteStart>0&&favoriteEnd>favoriteStart,'actual favorite/saved shared activation callback is located');
const sources={saved:html.slice(savedStart,savedEnd).replace('b.onclick=','window.activate='),favorite:html.slice(favoriteStart,favoriteEnd).trim().replace('const openSaved=','window.activate=')};
const clone=x=>JSON.parse(JSON.stringify(x)),step=(reps=3)=>({type:'zikir',cat:'esma',idx:0,reps,gap:900}),row={id:10,name:'Saved plan',queue:[step(7)]};
function fixture(surface,language='tr'){
 const receipts=[],messages=[],input={value:'Current draft'},player={queue:[step()],name:'Current draft',token:3,opens:0,open(q,name){this.queue=q;this.name=name;this.opens++}},calls={render:0};let visible=true;
 const api={lookupVisibleById(id){assert.equal(+id,10);return new Promise(resolve=>receipts.push(resolve))},sameQueue:(a,b)=>JSON.stringify(a)===JSON.stringify(b),isVisible:()=>visible,snapshot(){throw Error('Shared lastError is not an operation receipt')}};
 const window={SukunSavedSessionsR1088:api,I18N:{lang:language},toast:x=>messages.push(x),savedRender:()=>calls.render++};
 const c=vm.createContext({window,SavedSessions:api,P:player,s:row,b:{},clone,savedRender:()=>calls.render++,favoritesRender:()=>calls.render++,document:{getElementById:()=>input}});vm.runInContext(sources[surface],c);
 return {activate:()=>window.activate(10),receipts,messages,input,player,calls,api,window,private(){visible=false}};
}
const checks=[];async function check(name,run){try{await run();checks.push({name,passed:true})}catch(error){checks.push({name,passed:false,error:error.stack||String(error)})}}
(async()=>{
 for(const surface of Object.keys(sources)){
  for(const language of ['tr','en'])await check(surface+': current storage failure is explained in '+language+' and explicit retry can open the same plan',async()=>{
   const f=fixture(surface,language),before=clone(f.player.queue),task=f.activate();f.receipts.shift()({row:null,error:'storage-unavailable'});await task;assert.equal(f.player.opens,0);assert.deepEqual(f.player.queue,before);assert.equal(f.player.name,'Current draft');assert.equal(f.input.value,'Current draft');assert.equal(f.calls.render,1);assert.equal(f.messages.length,1);assert.match(f.messages[0],language==='en'?/Template could not open.*try again/:/Şablon açılamadı.*yeniden dene/);
   const retry=f.activate();f.receipts.shift()({row:clone(row),error:''});await retry;assert.equal(f.player.opens,1);assert.equal(f.player.queue[0].reps,7);assert.equal(f.input.value,row.name);assert.equal(f.messages.length,1);
  });
  for(const kind of ['deleted','private','private-after-lookup'])await check(surface+': '+kind+' result is silent and never opens a hidden plan',async()=>{
   const f=fixture(surface),task=f.activate();if(kind==='private-after-lookup')f.private();f.receipts.shift()({row:kind==='private-after-lookup'?clone(row):null,error:''});await task;assert.equal(f.player.opens,0);assert.equal(f.messages.length,0);assert.equal(f.calls.render,1);
  });
  for(const kind of ['queue-replaced','queue-mutated','token','name','typed-input','later-open-intent'])await check(surface+': a superseded '+kind+' suppresses the old failure alert and rerender',async()=>{
   const f=fixture(surface),task=f.activate();if(kind==='queue-replaced')f.player.queue=[step(11)];if(kind==='queue-mutated')f.player.queue[0].reps=11;if(kind==='token')f.player.token++;if(kind==='name')f.player.name='Later name';if(kind==='typed-input')f.input.value='Later typed name';if(kind==='later-open-intent')f.window.__r1089SavedOpenIntent++;
   f.receipts.shift()({row:null,error:'storage-unavailable'});await task;assert.equal(f.messages.length,0);assert.equal(f.calls.render,0);assert.equal(f.player.opens,0);
  });
  await check(surface+': a later successful activation wins over an older failed lookup',async()=>{
   const f=fixture(surface),older=f.activate(),oldResolve=f.receipts.shift(),newer=f.activate(),newResolve=f.receipts.shift();newResolve({row:clone(row),error:''});await newer;oldResolve({row:null,error:'storage-unavailable'});await older;assert.equal(f.player.opens,1);assert.equal(f.messages.length,0);assert.equal(f.calls.render,0);assert.equal(f.player.name,row.name);assert.equal(f.input.value,row.name);
  });
 }
 const report={suite:'r1090 saved activation scoped storage errors and latest intent',sourceSha256:crypto.createHash('sha256').update(html).digest('hex'),passed:checks.filter(x=>x.passed).length,total:checks.length,checks,limitations:['Actual saved and favorite activation callbacks with controlled lookup receipts/DOM/player. No native IndexedDB failure, pointer or audible-output claim; storage and browser suites cover those separately.']};
 if(process.env.SUKUN_SAVED_ACTIVATION_RESULTS)fs.writeFileSync(process.env.SUKUN_SAVED_ACTIVATION_RESULTS,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
