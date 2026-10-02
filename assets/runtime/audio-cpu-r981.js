/* SÜKÛN r981: pure, bounded PCM math. This file is also the worker entry. */
(function(scope){
 'use strict';
 const CHUNK=4096;
 function* render(p){
  const {input,sampleRate:sr,length}=p, opt=p.options||{}, spatial=!!opt.spatial;
  const channels=spatial?2:Math.min(2,input.length),frames=Math.max(length,Math.ceil(opt.frames||length));
  const rate=Math.max(.5,Math.min(2,+opt.rate||1)),wet=Math.max(0,Math.min(1,+opt.wet||0));
  if(!frames||!sr||input.length<1||input.length>2||frames*channels*6+length*input.length*4>32*1024*1024)throw Error('PCM budget');
  const data=Array.from({length:channels},()=>new Float32Array(frames)),offset=Math.round(Math.max(0,+opt.gapMs||0)*rate*sr/1000);
  const taps=wet>.01?[[0,.78],[.09*rate,wet*.16],[.185*rate,wet*.09],[.310*rate,wet*.05]]:[[0,.96]];
  for(const [seconds,gain] of taps){
   const start=offset+Math.round(seconds*sr);
   for(let c=0;c<channels;c++){
    const src=input[Math.min(c,input.length-1)],dst=data[c],n=Math.min(src.length,frames-start);
    for(let base=0;base<n;base+=CHUNK){for(let i=base;i<Math.min(n,base+CHUNK);i++)dst[start+i]+=src[i]*gain;yield;}
   }
  }
  if(spatial){
   const left=data[0],right=data[1],mono=input.length===1;
   for(let base=0;base<frames;base+=CHUNK){for(let i=base;i<Math.min(frames,base+CHUNK);i++){
    const phase=Math.max(0,Math.min(1,(i-offset)/Math.max(1,length))),pan=opt.journey?-.78*Math.cos(Math.PI*phase):Math.sin(i/sr/rate*.55)*.85,l=left[i],r=right[i];
    if(mono){const a=(pan+1)*Math.PI/4;left[i]=l*Math.cos(a);right[i]=l*Math.sin(a)}
    else if(pan<=0){const a=(pan+1)*Math.PI/2;left[i]=l+r*Math.cos(a);right[i]=r*Math.sin(a)}
    else{const a=pan*Math.PI/2;left[i]=l*Math.cos(a);right[i]=r+l*Math.sin(a)}
   }yield;}
  }
  return yield* pack({input:data,sampleRate:sr,length:frames});
 }
 function* pack(p){
  const ch=Math.min(2,p.input.length),frames=p.length,sr=p.sampleRate,bytes=44+frames*ch*2;
  if(!ch||!Number.isSafeInteger(bytes)||bytes>24*1024*1024)throw Error('WAV budget');
  const ab=new ArrayBuffer(bytes),v=new DataView(ab),word=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  word(0,'RIFF');v.setUint32(4,bytes-8,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,frames*ch*2,true);
  let o=44;for(let base=0;base<frames;base+=CHUNK){for(let i=base;i<Math.min(frames,base+CHUNK);i++)for(let c=0;c<ch;c++){
   let x=Math.max(-1,Math.min(1,p.input[c][i]||0));v.setInt16(o,x<0?x*0x8000:x*0x7fff,true);o+=2;
  }yield;}
  return{wav:ab};
 }
 function* quality(p){
  const {input,length,sampleRate:sr}=p,duration=length/sr,step=Math.max(1,Math.floor(sr/220));
  let peak=0,sum=0,n=0;
  for(const d of input)for(let base=0;base<length;base+=CHUNK*step){for(let i=base;i<Math.min(length,base+CHUNK*step);i+=step){const x=Math.abs(d[i]);peak=Math.max(peak,x);sum+=x*x;n++;}yield;}
  const rms=Math.sqrt(sum/Math.max(1,n)),gain=Math.max(.72,Math.min(1.42,Math.min(rms>.002?.125/rms:1,peak>.01?.92/peak:Infinity)));
  const thr=Math.max(.0035,Math.min(.018,peak*.035)),block=Math.max(1,Math.floor(sr*.065)),sub=Math.max(1,Math.floor(step/2));
  let first=0,last=length-1,found=false;
  outer1:for(let i=0;i<length;i+=block){for(const d of input)for(let j=i;j<Math.min(length,i+block);j+=sub)if(Math.abs(d[j])>=thr){first=i;found=true;break outer1;}yield;}
  if(found){outer2:for(let i=length-1;i>=0;i-=block){for(const d of input)for(let j=i;j>=Math.max(0,i-block);j-=sub)if(Math.abs(d[j])>=thr){last=i;break outer2;}yield;}}
  const trimStart=Math.max(0,first/sr-.055),trimEnd=Math.min(duration,(last+1)/sr+.055),tailTrim=Math.max(0,duration-trimEnd),base=duration<4?66:duration<12?72:duration<45?80:86;
  return{gain,trimStart,trimEnd,tailTrim,fadeMs:Math.round(Math.max(60,Math.min(88,base-(trimStart+tailTrim)*2))),rms,peak,duration};
 }
 const api=Object.freeze({version:'r981',render,pack,quality,job:p=>p.kind==='quality'?quality(p):p.kind==='pack'?pack(p):render(p)});
 scope.SukunAudioCpuR981=api;
 if(typeof document==='undefined'&&typeof scope.postMessage==='function')scope.onmessage=e=>{
  const {id,payload}=e.data||{};try{const g=api.job(payload);let x;do{x=g.next()}while(!x.done);scope.postMessage({id,result:x.value},x.value?.wav?[x.value.wav]:[])}catch(error){scope.postMessage({id,error:String(error?.message||error)})}
 };
})(typeof self!=='undefined'?self:globalThis);
