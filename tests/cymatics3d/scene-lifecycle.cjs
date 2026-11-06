const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../..');let source=fs.readFileSync(path.join(root,'assets/runtime/cymatics-3d.js'),'utf8');
// Native WebGL construction is the controlled seam. All production frame/lifecycle code is executed.
source=source.replace("import * as THREE from '../vendor/three-r170/three.module.min.js';",'const THREE=globalThis.THREE;').replace(/export function /g,'function ');source+='\nglobalThis.createView=createCymaticView;';
let checks=0,renders=0,time=100,removed=0,rendererDisposed=0;const mats=[];
const canvas={style:{},listeners:{},setAttribute(){},addEventListener(k,f){this.listeners[k]=f;},removeEventListener(k){delete this.listeners[k];},remove(){removed++;}};
class Group{constructor(){this.rotation={y:0};this.items=[];}add(x){this.items.push(x)}remove(x){this.items=this.items.filter(y=>y!==x)}}
class Geometry{constructor(){this.attributes={};}setAttribute(k,v){this.attributes[k]=v}dispose(){}}
class Material{constructor(o){Object.assign(this,o);mats.push(this)}dispose(){}}
const THREE={Scene:Group,Group,PerspectiveCamera:class{constructor(){this.position={};}updateProjectionMatrix(){}},BufferGeometry:Geometry,BufferAttribute:class{constructor(array,size){this.array=array;this.count=array.length/size}},PointsMaterial:Material,MeshBasicMaterial:Material,SphereGeometry:Geometry,Points:class{constructor(g,m){this.geometry=g;this.material=m}},Mesh:class{},AdditiveBlending:2,WebGLRenderer:class{constructor(){this.domElement=canvas}setClearColor(){}setSize(){}setPixelRatio(){}render(){renders++}dispose(){rendererDisposed++}forceContextLoss(){}}};
let input={n:3,m:4,level:.5,reduced:false,quality:'low'};
const sandbox={THREE,window:{devicePixelRatio:3},document:{hidden:false},performance:{now:()=>time},Float32Array,Math,Number,ResizeObserver:class{observe(){}disconnect(){}}};vm.createContext(sandbox);vm.runInContext(source,sandbox);
const view=sandbox.createView({host:{clientWidth:300,clientHeight:300,append(){}},getInput:()=>input,onContextLost(){view.dispose();}});const ok=(v,m)=>{assert(v,m);checks++};
view.enter();ok(renders===1,'entry renders once');time=150;view.frame();ok(renders===2,'non-forced live frame renders');const phase=view.snapshot().phase;
input={...input,level:0};time=200;view.frame();ok(renders===3,'zero transition redraws once without forcing');ok(mats[0].opacity===.08&&mats[1].opacity===.65,'zero transition clears live shell and point intensity');ok(view.snapshot().phase===phase,'zero transition does not advance simulation phase');time=250;view.frame();ok(renders===3,'continued silence freezes after corrected frame');
input={...input,level:.5,reduced:true};time=300;view.frame();ok(renders===4&&view.snapshot().phase===phase,'reduced-motion transition draws static frame');time=350;view.frame();ok(renders===4,'reduced motion does not keep rendering');
view.pause();time=400;view.frame(time,true);ok(renders===4,'pause also blocks forced frame');view.enter();ok(renders===5,'reentry shows retained static scene');canvas.listeners.webglcontextlost({preventDefault(){}});ok(view.snapshot().disposed&&removed===1&&rendererDisposed===1,'context loss handler disposes once');view.dispose();ok(rendererDisposed===1,'dispose is idempotent');
console.log(JSON.stringify({passed:checks,scope:'Production scene frame/lifecycle with controlled THREE renderer; not native WebGL'}));
