'use strict';
// Reuse the actual native-speech fixture; this is deterministic source coverage,
// not a real speaker or Android acceptance claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const fixturePath=path.resolve(__dirname,'../r1128/delail-tts-lifecycle.cjs');
const original=fs.readFileSync(fixturePath,'utf8');
const moduleBox={exports:{}};
new Function('require','module','__dirname',original.slice(0,original.indexOf('(async()=>{'))+'\nmodule.exports={fixture,block};')(createRequire(fixturePath),moduleBox,path.dirname(fixturePath));
const {fixture,block}=moduleBox.exports;
let checks=0;
(async()=>{
 for(const error of ['voice-unavailable','synthesis-failed','audio-busy']){
  for(const hidden of [false,true]){
   const f=fixture('legacy');const done=f.api.start();await f.flush();f.visibility(hidden);
   const old=f.spoken[0];old.onerror.call(old,{error});await f.advance(500);
   assert.equal((await done).ok,false);assert.equal(f.c.DL.qi,0);assert.equal(f.c.DL.hedefHizb,0);assert.equal(f.c.DL.paused,true);assert.equal(f.spoken.length,1);
   old.onend.call(old);await f.advance(500);assert.equal(f.spoken.length,1);
   f.api.resume();await f.flush();assert.equal(f.spoken[1].text,old.text);assert.equal(f.c.DL.activeQi,0);
   await f.cleanup();checks++;
  }
 }
 {
  const f=fixture('legacy');f.synth.failSpeak=true;const result=await f.api.start();
  assert.equal(result.ok,false);assert.equal(f.c.DL.qi,0);assert.equal(f.c.DL.failedPart.index,0);
  f.synth.failSpeak=false;f.api.resume();await f.flush();assert.equal(f.spoken[0].text,'Birinci tamamlanmamış cümle');await f.cleanup();checks++;
 }
 {
  const f=fixture('legacy');vm.runInContext(block('async function dlTamOku(mod){','function dlPause(){'),f.c);
  f.c.dlSiraYap=()=>[0,1];f.c.DELAIL_HIZB.push({id:'h2',ad:'Second'});
  const chain=f.c.dlTamOku('tum');await f.flush();const u=f.spoken[0];u.onerror.call(u,{error:'synthesis-failed'});await chain;
  assert.equal(f.c.DL.hedefHizb,0);assert.equal(f.spoken.length,1);assert.equal(f.c.DL.zincir,false);await f.cleanup();checks++;
 }
 {
  const f=fixture('legacy'),el={};f.c.$=()=>el;vm.runInContext(block('function dlIlerlemeYaz(){','/* Tek bölüm okuma.'),f.c);
  f.c.dlParcala=()=>['one','two','three'].map(t=>({t,ar:false}));const done=f.api.start();await f.flush();
  for(let i=0;i<3;i++){assert(el.innerHTML.includes(' · '+(i+1)+'/3'),'active paragraph '+(i+1));f.end();await f.flush();}
  assert.equal((await done).ok,true);await f.cleanup();checks++;
 }
 {
  const f=fixture('legacy');const done=f.api.start();await f.flush();f.api.stop();assert.equal((await done).cancelled,true);assert.equal(f.c.DL.failedPart,null);checks++;
 }
 console.log(JSON.stringify({passed:checks,total:10,scope:'Controlled shipped-function tests; physical audio untested'}));
})().catch(e=>{console.error(e);process.exitCode=1});
