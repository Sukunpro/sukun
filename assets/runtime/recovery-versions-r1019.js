/* SÜKÛN r1019 — local, verified application version recovery.
   Only CacheStorage release selection is changed. Personal data stays intact. */
(function(){
 'use strict';
 if(window.SukunRecoveryVersions?.version==='r1019')return;
 let last=null,operation=null;const supported=new WeakSet();
 const messages={
  SAME_ORIGIN_WINDOW_REQUIRED:'Kurtarma yalnız SÜKÛN sayfasından kullanılabilir.',
  EXPLICIT_CONFIRM_REQUIRED:'Sürüm değişikliği için onay gerekiyor.',
  OTHER_APP_TAB_OPEN:'Diğer SÜKÛN sekmelerini kapatıp yeniden dene.',
  HISTORICAL_BUILD_UNAVAILABLE:'Bu eski sürümün doğrulanmış dosyaları cihazda bulunmuyor.',
  HISTORICAL_BUILD_UNSAFE:'Bu sürüm kayıt koruması nedeniyle kapalı. Güncel sürümü kullan.',
  UNSAFE_PIN:'Seçili eski sürüm kayıt koruması nedeniyle kapalı. Kurtarma sayfasından güncele dön.',
  HISTORICAL_BUILD_NOT_VERIFIED:'Eski sürümün dosya kontrolü başarısız oldu.',
  CURRENT_NOT_VERIFIED:'Güncel sürüm dosyaları hazır değil. Bağlantı varken güncellemeyi kontrol et.',
  PIN_INVALID:'Korunan sürüm doğrulanamadı. Kurtarma sayfasından güncel sürüme dön.',
  RECOVERY_STATE_UNREADABLE:'Kurtarma durumu okunamadı. Kurtarma sayfasından güncel sürüme dön.',
  RECOVERY_BUSY:'Önce aktif ses oturumunu bitir ve veri işleminin tamamlanmasını bekle.',
  RECOVERY_REQUEST_EXPIRED:'Sürüm değiştirme süresi doldu. Sürüm listesini yeniden kontrol edip dene.',
  RECOVERY_UNSUPPORTED:'Bu servis çalışanında sürüm kurtarma yok. r1020 güncellemesini tamamla.',
  NO_CONTROLLER:'Kurtarma için uygulamanın çevrimdışı servisi hazır olmalı. Sayfayı tekrar aç.'
 };
 const messagesEn={
  SAME_ORIGIN_WINDOW_REQUIRED:'Recovery is available only from the SÜKÛN page.',
  EXPLICIT_CONFIRM_REQUIRED:'Confirm the application version change first.',
  OTHER_APP_TAB_OPEN:'Close the other SÜKÛN tabs and try again.',
  HISTORICAL_BUILD_UNAVAILABLE:'Verified files for this older version are not available on this device.',
  HISTORICAL_BUILD_UNSAFE:'This version is blocked to protect recordings. Use the current version.',
  UNSAFE_PIN:'The selected older version is blocked to protect recordings. Return to current from the recovery page.',
  HISTORICAL_BUILD_NOT_VERIFIED:'The older version failed its file checks.',
  CURRENT_NOT_VERIFIED:'The current version files are not ready. Check for updates while online.',
  PIN_INVALID:'The selected recovery version could not be verified. Return to the current version from the recovery page.',
  RECOVERY_STATE_UNREADABLE:'The recovery state could not be read. Return to the current version from the recovery page.',
  RECOVERY_BUSY:'Finish the active audio session and wait for the data operation to complete.',
  RECOVERY_REQUEST_EXPIRED:'The version change timed out. Check the version list and try again.',
  RECOVERY_UNSUPPORTED:'This service worker does not support version recovery. Complete the r1020 update first.',
  NO_CONTROLLER:'Recovery requires the application offline service to be ready. Open the page again.'
 };
 function error(code){const selected=window.I18N?.lang==='en'?messagesEn:messages;const e=Error(selected[code]||code);e.code=code;return e;}
 function emit(){try{window.dispatchEvent(new CustomEvent('sukun:recoveryversions',{detail:snapshot()}))}catch(_){};}
 function snapshot(){return {version:'r1019',busy:!!operation,last:last?{...last,versions:[...(last.versions||[])]}:null,rescueUrl:new URL('./__sukun_recovery__',location.href).href};}
 function ask(type,extra={},timeout=65000){
  const controller=navigator.serviceWorker?.controller;if(!controller)return Promise.reject(error('NO_CONTROLLER'));
  return new Promise((resolve,reject)=>{
   let channel=null,done=false,timer=0;
   const finish=(fn,value)=>{if(done)return;done=true;clearTimeout(timer);try{channel?.port1.close();channel?.port2.close()}catch(_){}fn(value)};
   try{
    channel=new MessageChannel();timer=setTimeout(()=>finish(reject,error('RECOVERY_UNSUPPORTED')),timeout);
    channel.port1.onmessage=e=>{const d=e.data;if(!d||d.ok===false)return finish(reject,error(d?.error||'RECOVERY_UNSUPPORTED'));finish(resolve,d)};
    channel.port1.onmessageerror=()=>finish(reject,error('RECOVERY_UNSUPPORTED'));
    controller.postMessage({type,...extra},[channel.port2]);
   }catch(e){finish(reject,e)}
  });
 }
 function busy(){
  try{if(window.SukunTabOwner?.snapshot?.()?.maintenance)return true}catch(_){return true}
  try{const update=window.SukunUpdateManager?.snapshot?.();if(update?.sessionBusy||update?.reloadPending||['saving','activating','verifying'].includes(update?.phase))return true}catch(_){return true}
  try{const data=window.SukunRecoveryData?.status?.()||window.SukunRecoveryData?.snapshot?.();if(data?.busy||data?.pending||data?.reloadRequired||window.SukunRecoveryData?.hasPending?.()||window.SukunStudioBatch?.snapshot?.()?.busy||window.SukunSiteBackup?.snapshot?.()?.busy)return true}catch(_){return true}
  try{const studio=window.R170?.Studio||window.Studio;if(studio?.session||studio?.recordClaim||studio?.edit)return true}catch(_){return true}
  for(const name of ['SukunManualVoice','SukunPhysicalRecording','SukunTickSound','Tekke','SukunTekkeSet']){
   try{const s=window[name]?.snapshot?.();if(s?.playing||s?.paused||s?.preparing||s?.pending||s?.recording||s?.busy||s?.active)return true}catch(_){return true}
  }
  try{const s=window.SukunSessionState?.snapshot?.();if(s&&['PREPARING','PLAYING','PAUSED','COMPLETING','INTERRUPTED','RECOVERING'].includes(String(s.phase||s.playbackState).toUpperCase()))return true}catch(_){return true}
  try{if([...document.querySelectorAll('audio,video')].some(a=>!a.paused&&!a.ended))return true}catch(_){return true}
  try{if(window.speechSynthesis?.speaking||window.speechSynthesis?.pending)return true}catch(_){return true}
  return false;
 }
 async function ensureSupported(){const controller=navigator.serviceWorker?.controller;if(!controller)throw error('NO_CONTROLLER');if(supported.has(controller))return;const status=await ask('STATUS',{},15000);if(status.recoveryVersion!=='r1019')throw error('RECOVERY_UNSUPPORTED');supported.add(controller);}
 async function assertSingleClient(lease){lease?.assertCurrent?.();await ensureSupported();lease?.assertCurrent?.();const result=await ask('RECOVERY_SINGLE_CLIENT',{},15000);lease?.assertCurrent?.();if(result.single!==true)throw error('OTHER_APP_TAB_OPEN');return true;}
 window.SukunRecoveryGuard=Object.freeze({version:'r1019',assertSingleClient});
 async function list(){await ensureSupported();const result=await ask('RECOVERY_LIST');last=result;emit();return result;}
 async function mutate(type,target,options={}){
  if(operation||busy())throw error('RECOVERY_BUSY');
  if(options.confirm!==true)throw error('EXPLICIT_CONFIRM_REQUIRED');
  await ensureSupported();if(operation||busy())throw error('RECOVERY_BUSY');
  const work=async token=>{token?.assertCurrent?.();const result=await ask(type,{confirm:true,expiresAt:Date.now()+55000,...target});return result;};
  // The existing ownership guard prevents playback or imports from starting
  // while cached HTML and runtime files are being checked before the switch.
  const task=window.SukunTabOwner?.maintenance?Promise.resolve(window.SukunTabOwner.maintenance('version-recovery',work)):work(null);
  operation=task;emit();
  try{
   const result=await task;if(!result?.ok)throw error('RECOVERY_BUSY');
   try{last=await ask('RECOVERY_LIST')}catch(e){result.listError=String(e?.message||e);last={...(last||{}),selected:result.build,rollback:result.rollback,currentReady:true};}
   if(options.reload===true)location.href=new URL('./nero.html',location.href).href;
   return result;
  }finally{if(operation===task)operation=null;emit();}
 }
 const current=options=>mutate('RECOVERY_CURRENT',{},options);
 window.SukunRecoveryVersions=Object.freeze({
  version:'r1019',list,status:list,snapshot,busy,assertSingleClient,
  rollback:(target,options)=>mutate('RECOVERY_ROLLBACK',{cache:String(target?.cache||''),build:String(target?.build||'')},options),
  current,returnCurrent:current,
  openRescue:()=>{if(operation||busy())throw error('RECOVERY_BUSY');location.href=new URL('./__sukun_recovery__',location.href).href;}
 });
})();
