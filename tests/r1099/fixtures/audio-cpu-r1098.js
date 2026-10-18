/* SÜKÛN r981: pure, bounded PCM math. This file is also the worker entry. */
(function(scope){
 'use strict';
 const CHUNK=4096;
 function* render(p){
  const {input,sampleRate:sr,length}=p, opt=p.options||{}, spatial=!!opt.spatial;
  const channels=spatial||opt.outputChannels===2?2:Math.min(2,input.length),frames=Math.max(length,Math.ceil(opt.frames||length));
  const rate=Math.max(.5,Math.min(2,+opt.rate||1)),wet=Math.max(0,Math.min(1,+opt.wet||0));
  if(!frames||!sr||input.length<1||input.length>2||frames*channels*6+length*input.length*4>32*1024*1024)throw Error('PCM budget');
  const data=Array.from({length:channels},()=>new Float32Array(frames)),offset=Math.round(Math.max(0,+opt.gapMs||0)*rate*sr/1000);
  const taps=wet>.01?[[0,.96],[.09*rate,wet*.30],[.185*rate,wet*.20],[.310*rate,wet*.12]]:[[0,.96]];
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
  // A single selected tesbih pulse is baked into each native repeat. It
  // follows the media clock even when JavaScript is suspended on lock.
  const tick=opt.tickSamples;
  if(tick instanceof Float32Array&&tick.length<=sr*.34){
   for(let c=0;c<channels;c++)for(let i=0,n=Math.min(tick.length,frames-offset);i<n;i++)data[c][offset+i]+=tick[i];
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
 /* r982 Studio: all-channel exact analysis, bounded waveform and transform.
    No AudioBuffer or long PCM result is returned to the UI. */
 function* studio(p){
  const {input,length,sampleRate:sr}=p,opt=p.options||{},operation=opt.operation||'analyze',ch=input?.length||0;
  if(!['analyze','normalize','trim'].includes(operation)||ch<1||ch>2||!Number.isSafeInteger(length)||length<1||!Number.isFinite(sr)||sr<=0||length/sr>60||input.some(d=>!(d instanceof Float32Array)||d.length!==length))throw Error('Studio PCM layout');
  const bins=Math.max(1,Math.min(1024,Math.floor(+opt.waveBins||512))),wave={min:new Float32Array(bins),max:new Float32Array(bins),bins};
  if(length*ch*6+bins*8>32*1024*1024)throw Error('Studio PCM budget');
  let peak=0,sum=0,n=0,first=length,last=-1;
  for(const d of input)for(let base=0;base<length;base+=CHUNK){
   for(let i=base;i<Math.min(length,base+CHUNK);i++){
    const value=d[i];if(!Number.isFinite(value))throw Error('Studio invalid sample');
    const x=Math.abs(value);peak=Math.max(peak,x);sum+=x*x;n++;
    if(x>=.012){first=Math.min(first,i);last=Math.max(last,i);}
   }yield;
  }
  // Match the original floor/ceil bins, including a shared boundary transient.
  let waveWork=0;
  for(let bin=0;bin<bins;bin++){
   const start=Math.floor(bin*length/bins),end=Math.min(length,Math.max(start+1,Math.ceil((bin+1)*length/bins)));let mn=1,mx=-1;
   for(const d of input)for(let i=start;i<end;i++){mn=Math.min(mn,d[i]);mx=Math.max(mx,d[i]);if(++waveWork>=CHUNK){waveWork=0;yield;}}
   wave.min[bin]=mn;wave.max[bin]=mx;
  }
  const result={peak,rms:Math.sqrt(sum/Math.max(1,n)),duration:length/sr,frames:length,channels:ch,wave,changed:false,scale:1,start:0,end:length};
  if(operation==='analyze')return result;
  if(operation==='trim'){
   if(last<first)return result;
   const pad=Math.round(sr*.08);result.start=Math.max(0,first-pad);result.end=Math.min(length,last+1+pad);
  }else result.scale=peak>.001?Math.min(4,.92/peak):1;
  const frames=result.end-result.start,bytes=44+frames*ch*2;
  if(!Number.isSafeInteger(bytes)||bytes>24*1024*1024)throw Error('Studio WAV budget');
  const ab=new ArrayBuffer(bytes),v=new DataView(ab),word=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  word(0,'RIFF');v.setUint32(4,bytes-8,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,frames*ch*2,true);
  let o=44;for(let base=result.start;base<result.end;base+=CHUNK){for(let i=base;i<Math.min(result.end,base+CHUNK);i++)for(let c=0;c<ch;c++){
   const x=Math.max(-1,Math.min(1,input[c][i]*result.scale));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2;
  }yield;}
  result.wav=ab;result.changed=true;return result;
 }
 const api=Object.freeze({version:'r981',render,pack,quality,studio,job:p=>p.kind==='studio'?studio(p):p.kind==='quality'?quality(p):p.kind==='pack'?pack(p):render(p)});
 scope.SukunAudioCpuR981=api;
 if(typeof document==='undefined'&&typeof scope.postMessage==='function')scope.onmessage=e=>{
  const {id,payload}=e.data||{};try{const g=api.job(payload);let x;do{x=g.next()}while(!x.done);scope.postMessage({id,result:x.value},x.value?.wav?[x.value.wav]:[])}catch(error){scope.postMessage({id,error:String(error?.message||error)})}
 };
})(typeof self!=='undefined'?self:globalThis);
