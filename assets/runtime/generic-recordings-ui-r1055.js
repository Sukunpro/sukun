/* r1055: explicit optional voice-bank controls on the shared classic/Feyz settings. */
(function(w){
 'use strict';let host=null,busy=false,notice='';
 if(w.I18N?.D)Object.assign(w.I18N.D,{'Jenerik kayıt':'Generic recording','Jenerik kayıt · aynı ses dosyası':'Generic recording · same audio file','SÜKÛN · Jenerik kayıt':'SÜKÛN · Generic recording','Genel ses arşivi':'Generic voice archive','GENEL SES ARŞİVİ':'GENERIC VOICE ARCHIVE','JENERİK KAYIT':'GENERIC RECORDING'});
 const $=id=>document.getElementById(id),bank=()=>w.SukunGenericRecordings;
 const copy=(tr,en)=>w.I18N?.lang==='en'?en:tr;
 const labels={
  title:['Jenerik zikir kayıtları','Generic dhikr recordings'],
  use:['Jenerik kayıtları kullan','Use generic recordings'],
  explain:['Hazır ses arşivini isteğe bağlı kullan. Kendi kaydın varsa önce o çalar; yoksa etkin jenerik kayıt, o da yoksa uygun cihaz sesi kullanılır.','Use the ready-made voice archive optionally. Your own recording plays first; otherwise an enabled generic recording is used, then a suitable device voice.'],
  mode:['Jenerik arşiv yalnız “Kendi kayıt öncelikli” ses seçiminde kullanılır. Arapça veya Türkçe cihaz sesi seçimini değiştirmez.','The generic archive is used only in “Own recording first” mode. It does not override an Arabic or Turkish device-voice choice.'],
  safe:['Arşiv kişisel kayıtlarından ayrı tutulur; onları, ayarlarını veya sayacı geri yüklemez. Arşiv yüklemek için önce Bitir’e dokun. Kullanımı açmak veya kapatmak, sürmekte olan okumayı duraklatabilir.','The archive is kept separately from personal recordings; it does not restore them, settings or counts. Tap Finish before loading an archive. Enabling or disabling it may pause a current reading.'],
  bundled:['Paketin ses arşivini yükle','Load the included voice archive'],
  file:['Dosyadan arşiv yükle','Load an archive file'],
  download:['Yüklenen arşivi indir','Download the loaded archive'],
  cancel:['Yüklemeyi iptal et','Cancel loading'],
  fileLabel:['Jenerik ses arşivi için JSON dosyaları','JSON files for the generic voice archive']
 };
 function text(node,value){if(node&&node.textContent!==value)node.textContent=value;}
 function render(){
  if(!host)return;const s=bank()?.snapshot?.()||{},working=busy||s.busy;
  for(const key of ['title','use','explain','mode','safe','bundled','file','download','cancel'])text($('r1055Generic'+key[0].toUpperCase()+key.slice(1)),copy(...labels[key]));
  const input=$('r1055GenericInput');input?.setAttribute('aria-label',copy(...labels.fileLabel));
  const toggle=$('r1055GenericToggle');if(toggle){toggle.disabled=working||!s.count;toggle.classList.toggle('on',!!s.enabled);toggle.setAttribute('aria-checked',String(!!s.enabled));toggle.setAttribute('aria-label',copy(...labels.use));}
  for(const id of ['Bundled','File'])if($('r1055Generic'+id))$('r1055Generic'+id).disabled=working;
  if($('r1055GenericDownload'))$('r1055GenericDownload').disabled=working||!s.count;
  if($('r1055GenericCancel'))$('r1055GenericCancel').hidden=!s.busy;
  const summary=s.count?copy(s.count+' kayıt · '+(s.enabled?'kullanım açık':'kullanım kapalı'),s.count+' recordings · '+(s.enabled?'enabled':'disabled')):copy('Henüz ses arşivi yüklenmedi; kullanım kapalı.','No voice archive is loaded; playback is disabled.');
  text($('r1055GenericSummary'),summary);
  const status=notice==='failed'?copy('Arşiv işlemi tamamlanamadı. Durumu kontrol edip yeniden dene.','The archive operation did not finish. Check its status and retry.'):notice==='exported'?copy('Ses arşivi indirildi; yalnız ses kayıtlarını içerir.','The voice archive was downloaded; it contains recordings only.'):s.message||'';
  text($('r1055GenericStatus'),status);
 }
 async function run(action,sourceChanged=false){
  if(busy)return false;busy=true;notice='';render();
  try{
   if(!bank())throw new Error('archive-unavailable');
   const result=await action();
   // The bank maintenance lease prevents starts during replacement. Refresh
   // the existing voice epoch after commit, so pending preparation stays fenced.
   if(sourceChanged)await w.SukunVoiceSettings?.edit?.();
   return result;
  }catch(error){notice=bank()?.snapshot?.().errorCode?'':'failed';return false;}
  finally{busy=false;render();}
 }
 function mount(){
  if(host?.isConnected)return;
  const anchor=$('r976ManualFeedbackSettings');if(!anchor)return;
  host=document.createElement('fieldset');host.id='r1055GenericSection';host.setAttribute('data-noi18n','');host.style.cssText='margin:10px 0;padding:10px;border:1px solid var(--line);border-radius:14px;min-width:0';
  host.innerHTML='<legend id="r1055GenericTitle"></legend><p id="r1055GenericExplain" class="hint"></p><div class="opt"><span id="r1055GenericUse"></span><button id="r1055GenericToggle" type="button" class="sw" role="switch" aria-checked="false" aria-describedby="r1055GenericExplain r1055GenericMode" disabled></button></div><p id="r1055GenericMode" class="hint"></p><p id="r1055GenericSafe" class="hint"></p><div class="zBtns" style="display:flex;flex-wrap:wrap;gap:8px"><button id="r1055GenericBundled" class="btn" type="button"></button><button id="r1055GenericFile" class="btn" type="button"></button><button id="r1055GenericDownload" class="btn" type="button" disabled></button><button id="r1055GenericCancel" class="btn" type="button" hidden></button></div><input id="r1055GenericInput" type="file" accept="application/json,.json" multiple hidden><p id="r1055GenericSummary" class="hint"></p><p id="r1055GenericStatus" class="hint" role="status" aria-live="polite" aria-atomic="true"></p>';
  anchor.after(host);
  $('r1055GenericToggle').onclick=()=>run(()=>bank().setEnabled(!bank().snapshot().enabled));
  $('r1055GenericBundled').onclick=()=>run(()=>bank().loadBundled(),true);
  $('r1055GenericFile').onclick=()=>{if(!busy)$('r1055GenericInput').click();};
  $('r1055GenericInput').onchange=e=>{
   const files=Array.from(e.target.files||[]);e.target.value='';if(files.length)void run(()=>bank().importFiles(files),true);
  };
  $('r1055GenericCancel').onclick=()=>{bank()?.cancel?.();};
  $('r1055GenericDownload').onclick=()=>run(async()=>{
   const exported=await bank().exportBank();
   const blob=exported instanceof Blob?exported:exported?.file||exported?.blob;
   if(!(blob instanceof Blob))throw new Error('archive-export');
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=exported?.filename||'SUKUN_JENERIK_SES_ARSIVI.json';
   try{document.body.append(a);a.click();notice='exported';}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  });
  render();Promise.resolve(bank()?.ready?.()).then(render).catch(render);
 }
 for(const event of ['sukun:genericrecordingschange','sukun:genericrecordingsstatus','sukun:voicesettingschange','sukun:languagechange'])w.addEventListener(event,()=>{mount();render();},{passive:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 w.SukunGenericRecordingsUI=Object.freeze({version:'r1055',mount,render,snapshot:()=>({mounted:!!host?.isConnected,busy})});
})(window);
