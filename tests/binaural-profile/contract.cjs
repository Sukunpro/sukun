'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {fixture}=require('../r1121/frequency-engine-fixture.cjs');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(root+'/index.html','utf8');
const presetText=html.slice(html.indexOf('const FREQ_PRESETS=['),html.indexOf('const JOURNEY=['));
const presets=vm.runInNewContext(presetText+';FREQ_PRESETS'),astro=presets.filter(p=>p.cat==='astral'&&!p.journey);
let checks=0;
function make(){
 const f=fixture(root),c=f.context;
 c.FR2={on:false,c:100,b:2.5};c.fr2Stop=()=>{c.FR2.E=null};c.fr2Start=()=>{c.FR2.E={}};c.CustomEvent=function(){};
 vm.runInContext(fs.readFileSync(root+'/assets/runtime/frequency-workbench-r1120.js','utf8'),c);
 f.element('binauralPresetStatus');
 return f;
}
const hostile={mode:'iso',wave:'square',uzam:true,harmonik:3,balL:0,balR:.2,pink:true,noise:'brown',noiseVol:.7,filterOn:true,fm:true,am:true,rm:true,pwm:true,vol:.23};
function verify(c,p){
 for(const [k,v]of Object.entries({c:p.c,b:p.b,mode:'bin',wave:'sine',uzam:false,harmonik:0,balL:1,balR:1,pink:false,noise:'off',noiseVol:0,filterOn:false,fm:false,am:false,rm:false,pwm:false,vol:.23}))assert.equal(c.FR[k],v,k);
 assert.equal(c.FR2.on,false);assert.equal(c.FR2.E,null);
 if(c.FR.playing){assert(Math.abs(c.FR.oL.frequency.value-(p.c-p.b/2))<1e-8);assert(Math.abs(c.FR.oR.frequency.value-(p.c+p.b/2))<1e-8);assert.equal(c.FR.iso,null);}
}
for(const p of astro)for(const running of [false,true]){
 const f=make(),c=f.context;
 if(running)c.frStart();Object.assign(c.FR,hostile);Object.assign(c.FR2,{on:true,E:{}});
 // Exercise the exact production preset click listener.
 let click;f.element('presets').addEventListener=(type,fn)=>click=fn;c.FREQ_PRESETS=presets;c.tipSuppressClick=false;c.celebrate=()=>{};c.toast=()=>{};
 const start=html.indexOf("$('#presets').addEventListener('click',e=>{");vm.runInContext(html.slice(start,html.indexOf('/* ── 3B frekans',start)),c);
 click({target:{closest:()=>({dataset:{p:presets.indexOf(p)},classList:{add(){}}})}});
 // A stopped secondary has no graph to retire. Production apply should always stop stale secondary too.
 verify(c,p);assert(c.FR.playing);assert.equal(f.environments.filter(e=>e.alive()).length,1);assert.equal(f.element('binauralPresetStatus').dataset.binauralResult,'applied');checks++;
}
for(const playing of [false,true]){
 const f=make(),c=f.context;if(playing)c.frStart();Object.assign(c.FR,hostile);c.FR2.on=true;c.FR2.E={};c.MINI.paused=true;c.ctx.suspend();
 const r=c.SukunFrequencyR1120.applyBinauralPreset(astro[0]);assert(r.ok&&r.paused&&!r.playing);assert.equal(c.ctx.state,'suspended');assert.equal(c.FR.playing,playing);verify(c,astro[0]);checks++;
}
{
 const f=make(),c=f.context;c.FR.vol=.23;c.FR2.E=null;assert(f.controller.startSweep());c.frQueueModeStart();
 assert(c.SukunFrequencyR1120.applyBinauralPreset(astro[0]).ok);assert(!c.FR._sweepActive&&!c.FR._restartTimer);f.advance(30000);verify(c,astro[0]);checks++;
}
{
 const f=make(),c=f.context;c.FR.vol=.23;c.FR2.E=null;
 const start=html.indexOf('function libData(){');vm.runInContext(html.slice(start,html.indexOf('function libLetters',start)),c);c.FREQ_PRESETS=presets;
 const item=c.libData().find(p=>p.name===astro[0].name);assert(item.apply.binauralProfile);assert(f.controller.applyLibrary(item));verify(c,astro[0]);checks++;
}
{
 const f=make();assert(!f.context.SukunFrequencyR1120.applyBinauralPreset({c:NaN,b:4}).ok);assert(!f.context.FR.playing);checks++;
}
{
 const f=make(),c=f.context,links=[];c.FR2.E=null;
 for(const key of ['osc','g']){const original=c[key];c[key]=(...args)=>{const node=original(...args);node.connect=(to,...ports)=>{links.push({from:node,to,ports});return to};return node;};}
 assert(c.SukunFrequencyR1120.applyBinauralPreset(astro[0]).ok);
 const left=links.find(x=>x.from===c.FR.oL).to,right=links.find(x=>x.from===c.FR.oR).to;
 const l=links.find(x=>x.from===left),r=links.find(x=>x.from===right);
 assert.equal(l.to,r.to);assert.deepEqual(l.ports,[0,0]);assert.deepEqual(r.ports,[0,1]);checks++;
}
{
 const f=make(),c=f.context;c.FR2.E=null;
 c.SukunFrequencyR1120.applyBinauralPreset(astro[0]);assert(f.element('binauralPresetStatus').textContent);
 c.FR.wave='triangle';c.SukunFrequencyR1120.sync();assert.equal(f.element('binauralPresetStatus').textContent,'');checks++;
}
console.log(JSON.stringify({passed:checks,astroPresets:astro.length,scope:'Production handler, hub, settings and graph functions in controlled Node VM; not native audio rendering'},null,2));
