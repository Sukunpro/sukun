/* Optional, local-only Three.js scene. Geometry is a simulation, not measured sound geometry. */
import * as THREE from '../vendor/three-r170/three.module.min.js';

export function normalizedInput(value={}) {
  const number=(n,fallback,min,max)=>Number.isFinite(Number(n))?Math.min(max,Math.max(min,Number(n))):fallback;
  return {n:number(value.n,3,1,16),m:number(value.m,4,1,16),level:number(value.level,0,0,1),reduced:!!value.reduced,quality:value.quality==='medium'?'medium':'low'};
}
export function fillPositions(array,input,phase=0) {
  const s=normalizedInput(input), count=array.length/3;
  const energy=s.reduced?0:s.level;
  for(let i=0;i<count;i++) {
    const y=1-2*(i+.5)/count, theta=i*Math.PI*(3-Math.sqrt(5)), latitude=Math.acos(y);
    // Chladni-inspired nodal field mapped onto a sphere; never label as a physical reconstruction.
    const field=Math.cos(s.n*theta)*Math.cos(s.m*latitude)-Math.cos(s.m*theta)*Math.cos(s.n*latitude);
    const radius=1+Math.abs(field)*.10+energy*.16*Math.sin(phase+field*3);
    const ring=Math.sqrt(Math.max(0,1-y*y));
    array[i*3]=Math.cos(theta)*ring*radius;array[i*3+1]=y*radius;array[i*3+2]=Math.sin(theta)*ring*radius;
  }
  return array;
}
export function createCymaticView({host,getInput,onContextLost}) {
  let renderer=null,points=null,geometry=null,material=null,shell=null,shellGeo=null,shellMat=null,observer=null;
  let disposed=false,active=false,last=0,phase=0,lastSignature='',width=0,height=0;
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(42,1,.1,20);camera.position.z=3.9;
  const group=new THREE.Group();scene.add(group);
  let canvas=null;
  const lost=event=>{event.preventDefault();active=false;onContextLost?.();};
  function dispose(){
    if(disposed)return;disposed=true;active=false;observer?.disconnect();
    canvas?.removeEventListener('webglcontextlost',lost);
    geometry?.dispose();material?.dispose();shellGeo?.dispose();shellMat?.dispose();
    renderer?.dispose();renderer?.forceContextLoss?.();canvas?.remove();
  }
  function resize(){
    if(disposed||!renderer)return;
    const w=Math.max(1,Math.round(host.clientWidth||300)),h=Math.max(1,Math.round(host.clientHeight||w));
    if(w===width&&h===height)return;width=w;height=h;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    if(active)frame(performance.now(),true);
  }
  function rebuild(quality){
    if(points)group.remove(points);geometry?.dispose();material?.dispose();
    const positions=new Float32Array((quality==='medium'?1400:700)*3);
    geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    material=new THREE.PointsMaterial({color:0x8be8ff,size:quality==='medium'?.025:.035,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending});
    points=new THREE.Points(geometry,material);group.add(points);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,quality==='medium'?1.5:1));
    lastSignature='';
  }
  function frame(now=performance.now(),force=false){
    if(disposed||!active||document.hidden)return;
    const input=normalizedInput(getInput());
    const signature=[input.n,input.m,input.quality,input.reduced,input.level===0].join('|');
    if(!force&&signature===lastSignature&&(input.reduced||input.level===0))return;
    if(!force&&now-last<1000/30)return;
    const delta=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
    if(geometry.attributes.position.count!==(input.quality==='medium'?1400:700))rebuild(input.quality);
    if(!input.reduced&&input.level>0)phase+=delta*(.35+input.level);
    fillPositions(geometry.attributes.position.array,input,phase);geometry.attributes.position.needsUpdate=true;
    // Rotation is opt-out through OS reduced motion and stops at zero measured input.
    if(!input.reduced&&input.level>0)group.rotation.y+=delta*.09*input.level;
    shellMat.opacity=input.reduced?.08:.08+input.level*.12;
    material.opacity=input.reduced?.8:.65+input.level*.3;
    renderer.render(scene,camera);lastSignature=signature;
  }
  try {
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});
    renderer.setClearColor(0x070714,1);canvas=renderer.domElement;
    canvas.style.cssText='display:block;width:100%;height:100%;';canvas.setAttribute('role','img');
    canvas.setAttribute('aria-label','Chladni-inspired audio-reactive 3D simulation');
    canvas.addEventListener('webglcontextlost',lost);host.append(canvas);
    shellGeo=new THREE.SphereGeometry(.96,24,16);shellMat=new THREE.MeshBasicMaterial({color:0x32b8df,wireframe:true,transparent:true,opacity:.08,depthWrite:false});
    shell=new THREE.Mesh(shellGeo,shellMat);group.add(shell);rebuild(normalizedInput(getInput()).quality);resize();
    if(typeof ResizeObserver==='function'){observer=new ResizeObserver(resize);observer.observe(host);}
    return {canvas,frame,resize,enter(){if(disposed)return;active=true;last=0;resize();frame(performance.now(),true);},pause(){active=false;},refresh(){if(active)frame(performance.now(),true);},dispose,
      snapshot:()=>({active,disposed,particles:geometry?.attributes.position.count||0,rendererCount:disposed?0:1,phase})};
  }catch(error){dispose();throw error;}
}
