'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
for(const file of ['index.html','nero.html']){
 const src=fs.readFileSync(path.join(root,file),'utf8'),code=src.slice(src.indexOf('function preferredJourney(){'),src.indexOf('\nfunction actJourney('));
 for(const lang of ['tr','en'])for(const state of [{},{rep:1},{i:3},{totalDone:2},{paused:true},{run:true},{i:99}]){
  const nodes=Object.fromEntries(['r1241ContinueLabel','r616ContinueTitle','r616ContinueMeta','r616ContinueBtn','r616Continue'].map(id=>[id,{textContent:'',dataset:{}}]));
  const context={window:{I18N:{lang}},$:id=>nodes[id],r704Text:(n,t)=>n.textContent=t,unlocked:()=>false,journeyState:()=>state};
  vm.runInNewContext(code+';syncContinue()',context);
  assert.equal(nodes.r1241ContinueLabel.textContent,state.i===99?(lang==='tr'?'Seyir tamamlandı':'Journey completed'):Object.keys(state).length?(lang==='tr'?'Kaldığın yerden devam':'Continue where you left off'):(lang==='tr'?'İlk seyrine başla':'Start your first journey'));
 }
 assert(src.includes("window.addEventListener('sukun:languagechange',render,{passive:true})"));
 assert(!src.includes('⟲ Foreground Queue · Session Arbitration'));
}
console.log('PASS r1241 first-use, partial repetition, paused/running/completed journeys and TR/EN in both entrypoints');
