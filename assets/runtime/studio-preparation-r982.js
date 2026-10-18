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
 function explainSaved(error){
  const code=String(error?.code||''),english=en();let reason;
  if(code==='PREP_CANCELLED'||code==='STUDIO_STALE')reason=english?'The selection or session changed.':'Seçim veya oturum değişti.';
  else if(code==='STUDIO_SOURCE_CHANGED')reason=english?'The recording changed again during analysis.':'Kayıt analiz sırasında yeniden değişti.';
  else if(code==='PREP_DURATION_LIMIT')reason=english?'The recording exceeds the verified 180-second inspection or 60-second editing limit, including any safety margin.':'Güvenlik payı dahil doğrulanan süre, 180 saniyelik inceleme veya 60 saniyelik düzenleme sınırını aşıyor.';
  else if(code==='PREP_SOURCE_LIMIT')reason=english?'The recording exceeds the 8 MiB Studio file limit.':'Kayıt, stüdyonun 8 MiB dosya sınırını aşıyor.';
  else if(code==='PREP_MEMORY_LIMIT')reason=english?'Analysis would exceed the safe memory budget.':'Analiz, güvenli bellek bütçesini aşıyor.';
  else if(code==='PREP_QUEUE_FULL')reason=english?'The audio preparation queue is full.':'Ses hazırlama sırası dolu.';
  else if(code==='PREP_DECODE_BUSY')reason=english?'A previous audio decoding operation has not finished yet.':'Önceki ses çözümleme işlemi henüz bitmedi.';
  else if(code==='PREP_WORKER_TIMEOUT'||code==='PREP_TIMEOUT')reason=english?'Analysis did not finish within the allowed time.':'Analiz, ayrılan süre içinde tamamlanamadı.';
  else if(code==='PREP_INVALID_HEADER')reason=english?'The audio file header could not be verified.':'Ses dosyasının başlık bilgileri doğrulanamadı.';
  else if(code==='PREP_UNKNOWN_DURATION')reason=english?'The recording duration could not be verified.':'Kaydın süresi doğrulanamadı.';
  else if(code==='PREP_UNKNOWN_LAYOUT')reason=english?'The recording channel layout could not be verified.':'Kaydın kanal yapısı doğrulanamadı.';
  else if(code==='PREP_WORKER_FAILED')reason=english?'The audio samples could not be processed.':'Ses örnekleri işlenemedi.';
  else reason=english?'Audio analysis could not be completed.':'Ses analizi tamamlanamadı.';
  return english?'The recording was saved; analysis of the current recording could not finish. '+reason+' The current recording is saved.':'Kayıt kaydedildi; güncel kaydın analizi tamamlanamadı. '+reason+' Güncel kayıt saklandı.';
 }
 function explain(error,opt={}){
  if(opt.saved)return explainSaved(error);
  const code=String(error?.code||'');
  if(code==='PREP_CANCELLED'||code==='STUDIO_STALE')return en()?'The selection or session changed. The edit was cancelled and your original recording was kept.':'Seçim veya oturum değişti. Düzenleme iptal edildi; asıl kayıt korundu.';
  if(code==='STUDIO_SOURCE_CHANGED')return en()?'This recording changed while it was being edited. Your newer recording was kept.':'Düzenleme sırasında bu kayıt değişti. Daha yeni kayıt korundu.';
  if(code==='PREP_DURATION_LIMIT')return en()?'Read-only duration inspection supports up to 180 verified seconds; normalization and trimming support up to 60 seconds, including any safety margin. Your original recording was kept.':'Salt okunur süre incelemesi en çok 180 saniye; normalize ve kırpma 60 saniyelik sınırla çalışır. WebM güvenlik payı da sınıra dahildir. Asıl kayıt korundu.';
  if(code==='PREP_SOURCE_LIMIT')return en()?'This recording exceeds the 8 MiB file limit for Studio processing. Your original recording was kept.':'Bu kayıt, stüdyo işlemleri için 8 MiB dosya sınırını aşıyor. Asıl kayıt korundu.';
  if(code==='PREP_MEMORY_LIMIT')return en()?'Processing this recording would exceed the safe memory budget. Your original recording was kept.':'Bu kaydın işlenmesi güvenli bellek bütçesini aşıyor. Asıl kayıt korundu.';
  if(code==='PREP_QUEUE_FULL')return en()?'The audio preparation queue is full. Wait for the other operations to finish, then try again. Your original recording was kept.':'Ses hazırlama sırası dolu. Diğer işlemler bitince yeniden dene. Asıl kayıt korundu.';
  if(code==='PREP_DECODE_BUSY')return en()?'A previous audio decoding operation has not finished yet. Try again after it finishes. Your original recording was kept.':'Önceki ses çözümleme işlemi henüz bitmedi. İşlem tamamlanınca yeniden dene. Asıl kayıt korundu.';
  if(code==='PREP_WORKER_TIMEOUT'||code==='PREP_TIMEOUT')return en()?'Audio processing did not finish within the allowed time. You can try again. Your original recording was kept.':'Ses işleme, ayrılan süre içinde tamamlanamadı. Yeniden deneyebilirsin. Asıl kayıt korundu.';
  if(code==='PREP_INVALID_HEADER')return en()?'The audio file header could not be verified. Your original recording was kept.':'Ses dosyasının başlık bilgileri doğrulanamadı. Asıl kayıt korundu.';
  if(code==='PREP_UNKNOWN_DURATION')return en()?'The recording duration could not be verified. No changes were saved; your original recording was kept.':'Kaydın süresi doğrulanamadı. Değişiklik kaydedilmedi; asıl kayıt korundu.';
  if(code==='PREP_UNKNOWN_LAYOUT')return en()?'The recording channel layout could not be verified. No changes were saved; your original recording was kept.':'Kaydın kanal yapısı doğrulanamadı. Değişiklik kaydedilmedi; asıl kayıt korundu.';
  if(code==='PREP_WORKER_FAILED')return en()?'The audio samples could not be processed. You can try again. Your original recording was kept.':'Ses örnekleri işlenemedi. Yeniden deneyebilirsin. Asıl kayıt korundu.';
  if(code.startsWith('PREP_'))return en()?'Audio processing could not be completed. Your original recording was kept.':'Ses işleme tamamlanamadı. Asıl kayıt korundu.';
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
  try{check();const result=await authority.decode(blob,{purpose:'studio',operation,allowLongInspection:operation==='analyze',key:opt.key||'',signal,onExpire:abort,isCurrent:current,use:async(decoded,job)=>{
   job.check();
   const value=await job.cpu({kind:'studio',operation,allowLongInspection:operation==='analyze',waveBins:Math.max(1,Math.min(1024,Math.floor(+opt.waveBins||512)))});
   job.check();
   const output={...value,dur:value.duration,size:blob.size};
   if(value.wav){output.blob=new Blob([value.wav],{type:'audio/wav'});delete output.wav;}
   // A commit callback stays inside the same admitted transaction. It cannot
   // write after the queue deadline, abort or ownership/selection invalidation.
   if(opt.commit&&output.changed){job.check();await opt.commit(output,job.check,signal);job.check();}
   return output;
  }});
  check();if(result?.metadataOnly)return {metadataOnly:true,changed:false,dur:result.meta.duration,size:blob.size,durationUpperBound:result.meta.verified==='webm-opus',verified:result.meta.verified,reason:result.reason||'duration'};return result;}finally{opt.signal?.removeEventListener?.('abort',abort);}
 }
 w.SukunStudioPreparation=Object.freeze({version:'r982',process,explain,createCancellation});
})(window);
