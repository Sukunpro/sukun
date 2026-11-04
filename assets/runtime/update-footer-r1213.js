/* One footer presentation owner. Installation, recording preservation and
   safe reload remain owned by the established update manager. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),button=$('r1165UpdateCheck'),label=$('r1165UpdateLabel'),status=$('r1165UpdateStatus');if(!button||!label||!status)return;
 const t=(tr,en)=>window.I18N?.lang==='en'?en:tr,build=document.querySelector('meta[name="sukun-build"]')?.content||'';
 let busy=false,checked=false,latest='',fetchError=false;
 const num=v=>/^r\d+$/.test(String(v||''))?Number(String(v).slice(1)):0;
 const preparing=s=>['checking','installing','verifying','saving','activating'].includes(s?.phase);
 const waiting=s=>!!(s?.hasWaiting||s?.reloadPending||s?.versionMatch===false&&num(s.controllerVersion)>num(build));
 function describe(s){
  let caption=t('Güncellemeyi kontrol et','Check for updates'),message='',working=busy||preparing(s);
  const p=s?.progress,progress=p&&p.total>0?' '+Math.min(100,Math.floor(p.done/p.total*100))+'%':'';
  if(s?.lastError||s?.phase==='error'){working=false;caption=t('Yeniden dene','Retry');message=t('Güncelleme tamamlanamadı. Mevcut sürüm korunuyor; bağlantı varken yeniden dene.','The update could not finish. Your current version is kept; retry while connected.')}
  else if(s?.updateQueued){working=false;caption=s.reloadPending?t('Güncelleme bekliyor','Update pending'):t('Beklemeyi iptal et','Cancel waiting');message=t('Hazır güncelleme, oturum bitince uygulanacak.','The ready update will apply when the session ends.')}
  else if(preparing(s)){
   const phase=s.phase;caption=phase==='saving'?t('Oturum kaydediliyor…','Saving session…'):phase==='activating'?t('Güncelleme uygulanıyor…','Applying update…'):phase==='checking'?t('Kontrol ediliyor…','Checking…'):t('Güncelleme indiriliyor…','Downloading update…');
   message=(phase==='saving'?t('İlerlemen kaydediliyor.','Your progress is being saved.'):phase==='activating'?t('Doğrulanmış sürüme geçiliyor.','Switching to the verified version.'):phase==='verifying'||p?.stage==='saving'?t('İndirilen dosyalar doğrulanıyor.','Verifying downloaded files.'):t('Uygulama dosyaları hazırlanıyor.','Preparing app files.'))+progress;
  }else if(busy){caption=t('Kontrol ediliyor…','Checking…');message=t('Yeni sürüm aranıyor.','Looking for a new version.')}
  else if(waiting(s)){caption=t('Güncellemeyi uygula','Apply update');message=t('Yeni sürüm hazır. İlerlemen kaydedilerek uygulanacak.','The update is ready. Your progress will be saved before applying it.')}
  else if(checked&&(!s||fetchError)){caption=t('Yeniden dene','Retry');message=t('Sürüm bilgisi doğrulanamadı. Bağlantıyı kontrol edip yeniden dene.','Version information could not be verified. Check your connection and retry.')}
  else if(checked&&num(latest)>num(build)){caption=t('İndirmeyi yeniden dene','Retry download');message=t('Yeni sürüm '+latest+' bulundu, fakat indirme tamamlanmadı. Çalışan sürüm: '+build+'.','Version '+latest+' was found, but the download did not finish. Running version: '+build+'.')}
  else if(checked&&s?.versionMatch===true&&latest===build){message=t('Güncel sürüm çalışıyor: ','Running the current version: ')+build+'.'}
  else if(checked){caption=t('Yeniden dene','Retry');message=t('Çalışan sürüm doğrulanamadı. Yeniden kontrol et.','The running version could not be verified. Check again.')}
  return{caption,message,working,disabled:working||!!(s?.updateQueued&&s?.reloadPending)};
 }
 function draw(){const view=describe(window.SukunUpdateManager?.snapshot?.());button.disabled=view.disabled;button.dataset.updateBusy=String(view.working);button.setAttribute('aria-busy',String(view.working));label.textContent=view.caption;status.textContent=view.message;status.setAttribute('role','status');status.setAttribute('aria-live','polite')}
 async function getLatest(){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{const response=await fetch('./sukun-latest.json?t='+Date.now(),{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('HTTP');const data=await response.json(),v=String(data?.v||data?.latest||data?.build||'');if(!num(v))throw Error('version');return v}finally{clearTimeout(timer)}}
 button.addEventListener('click',async()=>{
  const manager=window.SukunUpdateManager,s=manager?.snapshot?.();if(busy)return;
  if(s?.updateQueued){if(!s.reloadPending)manager.cancel();draw();return}
  if(waiting(s)&&!preparing(s)&&!s?.lastError){await manager.activate();draw();return}
  if(!manager?.check){checked=true;draw();return}
  busy=true;checked=true;fetchError=false;latest='';draw();
  try{const results=await Promise.allSettled([getLatest(),manager.check()]);if(results[0].status==='fulfilled')latest=results[0].value;else fetchError=true;if(results[1].status==='rejected')fetchError=true}catch(_){fetchError=true}finally{busy=false;draw()}
 });
 window.addEventListener('sukun:swstate',draw,{passive:true});window.addEventListener('sukun:languagechange',draw,{passive:true});window.addEventListener('pageshow',draw,{passive:true});
 // A manager deadline also expires after a suspended mobile tab resumes.
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)draw()},{passive:true});draw();
 window.SukunUpdateFooterR1213=Object.freeze({version:'r1213',snapshot:()=>({...describe(window.SukunUpdateManager?.snapshot?.()),build,latest})});
})();
