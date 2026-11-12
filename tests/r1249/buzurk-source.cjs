'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync('index.html','utf8');assert.equal(s,fs.readFileSync('nero.html','utf8'));
const body=s.slice(s.indexOf('function makamNefes3('),s.indexOf('function makamMizrap3('));
const profile=s.match(/buzurk:(\{scale:.*?\}),(?:\n|\r)/)[1];
const notes=[],queue=[];let alive=true;
const c={rnd:(a,b)=>(a+b)/2,ambNoiseShot:()=>{},ambNodeNote:(e,out,o)=>notes.push(o)};vm.createContext(c);vm.runInContext(body+';this.build=makamNefes3('+profile+')',c);
c.build({alive:()=>alive,later:(f,ms)=>{assert(ms>0);queue.push(f)}},{});
assert.equal(notes[0].f,329.63);assert.equal(queue.length,1);for(let i=0;i<4;i++)queue.shift()();assert.equal(notes.at(-1).f,196);
for(const n of notes){assert(n.f>0&&n.dur>0&&n.peak<=.1);assert(Number.isFinite(n.delay));}
const before=notes.length;alive=false;queue.shift()();assert.equal(notes.length,before);assert.equal(queue.length,0);
assert.match(s,/id:'buzurk',kat:'makam'/);assert.match(s,/mahur','buzurk'/);
assert.match(s,/tıbbi tedavi veya belirli bir etki garantisi değildir/);
console.log(JSON.stringify({passed:8,method:'Exact shipped Buzurk builder with controlled note scheduler, lifecycle and source contracts'}));
