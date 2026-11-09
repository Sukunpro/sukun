import assert from 'node:assert/strict';
import {fillPositions,normalizedInput} from '../../assets/runtime/cymatics-3d.js';
let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
for(const size of [700,1400]){
 const a=new Float32Array(size*3),b=new Float32Array(size*3);
 fillPositions(a,{n:3,m:4,level:0},0);fillPositions(b,{n:3,m:4,level:0},100);
 ok(a.every(Number.isFinite),'finite coordinates');ok(a.every((x,i)=>x===b[i]),'zero input gives stationary geometry regardless of phase');
 fillPositions(b,{n:3,m:4,level:.5},1);ok(a.some((x,i)=>x!==b[i]),'nonzero measured level deforms simulated shape');
 fillPositions(a,{n:3,m:4,level:.5,reduced:true},0);fillPositions(b,{n:3,m:4,level:.5,reduced:true},20);ok(a.every((x,i)=>x===b[i]),'reduced motion geometry static');
 fillPositions(b,{n:7,m:5,level:0},0);ok(a.some((x,i)=>x!==b[i]),'chosen modal frequencies change geometry');
 ok(b.every(x=>Math.abs(x)<1.6),'geometry remains bounded');
}
const a=new Float32Array(700*3),b=new Float32Array(700*3);
fillPositions(a,{n:3,m:1,nextN:3,nextM:2,mix:.1,level:0});fillPositions(b,{n:3,m:1,nextN:3,nextM:2,mix:.2,level:0});
ok(a.some((x,i)=>x!==b[i]),'adjacent Hz interpolation changes 3D geometry without switching integer modes');
fillPositions(a,{n:22,m:21,level:0});ok(a.every(Number.isFinite),'high-frequency modal range stays finite');
ok(normalizedInput({level:Infinity}).level===0,'nonfinite level defaults silent');ok(normalizedInput({level:-2}).level===0,'negative level clamped');ok(normalizedInput({quality:'ultra'}).quality==='low','conservative quality fallback');
console.log(JSON.stringify({passed:checks,scope:'Actual Three.js module imports; deterministic simulation geometry, no GPU or physical audio'}));
