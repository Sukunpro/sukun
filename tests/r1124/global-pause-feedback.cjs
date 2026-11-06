'use strict';

const inputRoot=require('path').resolve(process.argv[2]||require('path').join(__dirname,'../..'));
const inputHashes=Object.fromEntries(["nero.html", "index.html", "assets/runtime/session-r919.js", "assets/runtime/interface-r920.js", "assets/runtime/wheels-r924.js", "tests/r1122/dhikr-navigation-route-contract.cjs"].map(file=>[file,require('crypto').createHash('sha256').update(require('fs').readFileSync(require('path').join(inputRoot,file))).digest('hex')]));
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const fixtureFile=path.join(root,'tests/r1122/dhikr-navigation-route-contract.cjs');
const fixtureCode=fs.readFileSync(fixtureFile,'utf8').split('const results=[];')[0];
const fixture=new Function('require','process','__dirname',fixtureCode+'\nreturn fixture;')(require,{argv:['node','test',root]},path.dirname(fixtureFile));
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.stack})}}
(async()=>{
for(const lang of ['tr','en'])for(const phase of ['IDLE','PAUSED'])await test(`${lang} ${phase}: explicit wheel command delegates common continuation without rejection feedback`,async()=>{
 const h=fixture({globalHeld:true,phase}),c=h.c,messages=[];c.I18N={lang};c.toast=x=>messages.push(x);const before=h.state.count,total=h.state.total;
 let held=true,resumes=0;c.SukunAudioSessionRegistry.aggregateSnapshot=()=>({paused:held});
 // The real session command delegates to the shared transport; r1062 exercises
 // that transport with the actual registry and wheel handlers end to end.
 c.SukunR698Transport.resumeDhikr=()=>{resumes++;held=false;c.AudioLife.userPaused=false;h.state.auto=true;h.state.paused=false;return true;};
 const s=c.SukunSessionState.snapshot();assert.equal(s.globalPauseBlocked,true);
 const r=await c.SukunSessionState.command(phase==='PAUSED'?'resume':'start');assert.equal(r.accepted,true);assert.equal(resumes,1);assert.equal(messages.length,0);assert.equal(h.state.count,before);assert.equal(h.state.total,total);assert.equal(c.AudioLife.userPaused,false);assert.equal(c.SukunSessionState.snapshot().globalPauseBlocked,false);
});
for(const phase of ['IDLE','PAUSED','PLAYING'])await test(`${phase}: no global hold does not falsely display blocking`,async()=>{const h=fixture({phase});assert.equal(h.c.SukunSessionState.snapshot().globalPauseBlocked,false)});
await test('Terminal Stop is not mislabeled as global Pause',async()=>{const h=fixture({phase:'IDLE'});h.c.AudioLife.userPaused=true;h.c.AudioLife._terminalIntent=true;assert.equal(h.c.SukunSessionState.snapshot().globalPauseBlocked,false)});
for(const lang of ['tr','en'])await test(`${lang}: wheel and easy controls offer continuation while the global pause snapshot is set`,()=>{
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{attrs:{},textContent:''});return nodes.get(id)};
 const c={$,text:(n,t)=>n.textContent=t,attr:(n,k,v)=>n.attrs[k]=v,english:lang==='en',s:{phase:'PAUSED',globalPauseBlocked:true},state:{phase:'PAUSED',globalPauseBlocked:true},smartSession:null,nonReading:false,Object,window:{I18N:{lang}}};vm.createContext(c);
 const int=fs.readFileSync(path.join(root,'assets/runtime/interface-r920.js'),'utf8').split('\n');
 vm.runInContext(int.find(x=>x.trim().startsWith("const busy=s.phase==='PLAYING'"))+int.find(x=>x.trim().startsWith('const actionNames='))+int.find(x=>x.trim().startsWith('for(const [id,label]of Object.entries(actionNames))')),c);
 assert.equal($('r927PlayCaption').textContent,lang==='en'?'Continue':'Devam');assert.equal($('r920Play').attrs['aria-label'],lang==='en'?'Continue dhikr':'Zikre devam et');
 const wheel=fs.readFileSync(path.join(root,'assets/runtime/wheels-r924.js'),'utf8').split('\n').find(x=>x.trim().startsWith("const busy=state?.phase==='PLAYING'"));vm.runInContext('{'+wheel+'}',c);assert.equal($('r932EasyPlay').textContent,lang==='en'?'Continue':'Devam et');
});
const report={inputHashes,method:'Exact read-model/command source plus exact render lines, controlled fixtures; not full browser/device QA',passed:results.filter(x=>x.passed).length,total:results.length,results,sourceSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'assets/runtime/session-r919.js'))).digest('hex'),testSha256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex')};if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(results.some(x=>!x.passed))process.exitCode=1;
})();
