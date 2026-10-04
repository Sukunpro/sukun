/* SÜKÛN r982 Studio: shares the existing serialized audio preparation queue.
   Native browser decoding is bounded before entry; all sample scans and WAV
   transforms run in its worker or in yielding 4096-frame fallback chunks. */
(function(w){
 'use strict';if(w.SukunStudioPreparation)return;
 const failure=(code,message)=>Object.assign(Error(message||code),{code});
 const en=()=>w.I18N?.lang==='en'||document.documentElement?.lang==='en';
 function createCancellation(){
  if(typeof w.AbortController==='function')return new w.AbortController();
  // The same abort fence works on an old browser without AbortController.
  const listeners=new Set(),signal={aborted:false,addEventListener(type,fn){if(type==='abort')listeners.add(fn);},removeEventListener(type,fn){if(type==='abort')listeners.delete(fn);}};
  return {signal,abort(){if(signal.aborted)return;signal.aborted=true;for(const fn of [...listeners])try{fn({type:'abort'});}catch(_){}listeners.clear();}};
 }
 function explain(error){
  const code=String(error?.code||'');
  if(code==='PREP_CANCELLED'||code==='STUDIO_STALE')return en()?'The selection or session changed. The edit was cancelled and your original recording was kept.':'Seçim veya oturum değişti. Düzenleme iptal edildi; asıl kayıt korundu.';
  if(code==='STUDIO_SOURCE_CHANGED')return en()?'This recording changed while it was being edited. Your newer recording was kept.':'Düzenleme sırasında bu kayıt değişti. Daha yeni kayıt korundu.';
  if(code==='PREP_UNKNOWN_DURATION'||code==='PREP_UNKNOWN_LAYOUT')return en()?'The recording duration or channel layout could not be verified. No changes were saved.':'Kaydın süresi veya kanal yapısı doğrulanamadı. Değişiklik kaydedilmedi.';
  if(code.startsWith('PREP_'))return en()?'This recording could not be processed within the memory or time limit. Your original recording was kept.':'Bu kayıt bellek veya süre sınırında işlenemedi. Asıl kayıt korundu.';
  return en()?'The recording could not be processed. Your original recording was kept.':'Kayıt işlenemedi. Asıl kayıt korundu.';
 }
 async function process(blob,opt={}){
  const operation=opt.kind||'analyze';if(!['analyze','normalize','trim'].includes(operation))throw failure('STUDIO_OPERATION');
  const authority=w.SukunAudioDecodeAuthority;
  if(!authority?.decode||!w.SukunAudioPreparation)throw failure('STUDIO_UNAVAILABLE');
  const controller=createCancellation();
  const abort=()=>controller?.abort();opt.signal?.addEventListener?.('abort',abort,{once:true});
  const signal=controller?.signal||opt.signal;
  const current=()=>!signal?.aborted&&!opt.signal?.aborted&&(!opt.isCurrent||opt.isCurrent());
  const check=()=>{if(!current())throw failure('PREP_CANCELLED');};
  try{check();const result=await authority.decode(blob,{purpose:'studio',key:opt.key||'',signal,onExpire:abort,isCurrent:current,use:async(decoded,job)=>{
   job.check();
   const value=await job.cpu({kind:'studio',operation,waveBins:Math.max(1,Math.min(1024,Math.floor(+opt.waveBins||512)))});
   job.check();
   const output={...value,dur:value.duration,size:blob.size};
   if(value.wav){output.blob=new Blob([value.wav],{type:'audio/wav'});delete output.wav;}
   // A commit callback stays inside the same admitted transaction. It cannot
   // write after the queue deadline, abort or ownership/selection invalidation.
   if(opt.commit&&output.changed){job.check();await opt.commit(output,job.check,signal);job.check();}
   return output;
  }});
  check();return result;}finally{opt.signal?.removeEventListener?.('abort',abort);}
 }
 w.SukunStudioPreparation=Object.freeze({version:'r982',process,explain,createCancellation});
})(window);
