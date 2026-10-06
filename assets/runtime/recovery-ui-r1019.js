/* SÜKÛN r1019 — application release controls in the Recovery Centre. */
(function(){
 'use strict';
 let root=null,listed=null,loading=false,result=null;
 const text=(tr,en)=>window.I18N?.lang==='en'?en:tr;
 function render(){
  if(!root)return;
  const api=window.SukunRecoveryVersions,working=loading||api?.snapshot?.().busy,blocked=!!api?.busy?.();
  root.querySelector('[data-role="title"]').textContent=text('Uygulama sürümüne dön','Restore app version');
  root.querySelector('[data-role="intro"]').textContent=text('Güncel sürüm ve en fazla 5 eski, doğrulanmış sürüm bu cihazda saklanır. Kişisel seslerin ve verilerin sürüm değişiminde korunur.','The current release and up to 5 previous verified releases are kept on this device. Changing app version preserves personal recordings and data.');
  root.querySelector('[data-role="label"]').textContent=text('Cihazdaki doğrulanmış sürüm','Verified version on this device');
  const labels={list:['Sürümleri kontrol et','Check versions'],rollback:['Seçili eski sürüme dön','Restore selected previous version'],current:['Güncel sürüme dön','Return to current version'],rescue:['Acil sürüm kurtarma sayfası','Emergency version recovery page']};
  for(const [action,pair] of Object.entries(labels)){
   const button=root.querySelector('[data-action="'+action+'"]');button.textContent=text(...pair);
   button.disabled=!!working||blocked||!api||(action==='rollback'&&!root.querySelector('select').value)||(action==='current'&&!listed?.rollback);
  }
  root.querySelector('select').disabled=!!working||blocked;
  const state=listed?text('Güncel: ','Current: ')+listed.current+text(' · Açık: ',' · Selected: ')+listed.selected+text(' · Eski sürüm: ',' · Previous versions: ')+listed.availablePrevious+'/5':text('Henüz sürüm listesi kontrol edilmedi.','Versions have not been checked yet.');
  root.querySelector('[data-role="status"]').textContent=working?text('Sürüm dosyaları doğrulanıyor…','Verifying release files…'):result?.error||(blocked?text('Sürüm değiştirmek için aktif ses veya veri işlemini bitir.','Finish active audio or data work before changing version.'):state);
  root.querySelector('[data-role="note"]').textContent=text('Geçmiş, bu güncellemeden sonra birikir. Cihazda bulunmayan sürümler listelenmez. Diğer SÜKÛN sekmelerini kapatıp aktif sesi bitirdikten sonra sürüm değiştirebilirsin.','History accumulates after this update. Unavailable releases are not listed. Close other SÜKÛN tabs and end active audio before changing version.');
 }
 async function refresh(){
  if(loading)return;loading=true;result=null;render();
  try{
   const data=await window.SukunRecoveryVersions.list();listed=data;
   const select=root.querySelector('select'),previous=select.value;select.textContent='';
   for(const version of data.versions||[]){
    if(version.build===data.current)continue;
    const option=document.createElement('option');option.value=version.cache;option.textContent=version.build+(version.build===data.selected?text(' · şu an açık',' · currently selected'):'');select.appendChild(option);
   }
   if([...select.options].some(option=>option.value===previous))select.value=previous;
   if(!select.options.length){const option=document.createElement('option');option.value='';option.textContent=text('Henüz doğrulanmış eski sürüm yok','No verified previous version yet');select.appendChild(option);}
  }catch(error){result={error:String(error.message||error)};}finally{loading=false;render();}
 }
 async function change(current){
  if(loading)return;
  const target=current?null:listed?.versions?.find(version=>version.cache===root.querySelector('select').value);
  if(!current&&!target)return;
  const build=current?listed?.current:target.build;
  if(!confirm(text(build+' açılacak. Kişisel veri değişmez. Devam?',build+' will open. Personal data is preserved. Continue?')))return;
  loading=true;result=null;render();
  try{
   const options={confirm:true,reload:false};
   const reply=current?await window.SukunRecoveryVersions.current(options):await window.SukunRecoveryVersions.rollback(target,options);
   if(reply?.ok)location.href=new URL('./nero.html',location.href).href;
  }catch(error){result={error:String(error.message||error)};}finally{loading=false;render();}
 }
 function mount(){
  if(root)return;
  root=document.getElementById('r1019VersionRecovery');if(!root)return;
  root.innerHTML='<h3 data-role="title"></h3><p data-role="intro"></p><label for="r1019AppVersionSelect" data-role="label"></label><select id="r1019AppVersionSelect"></select><div class="r1019RecoveryActions"><button type="button" class="r170Btn" data-action="list"></button><button type="button" class="r170Btn" data-action="rollback"></button><button type="button" class="r170Btn" data-action="current"></button><button type="button" class="r170Btn" data-action="rescue"></button></div><p data-role="status" role="status" aria-live="polite"></p><p data-role="note"></p>';
  root.querySelector('[data-action="list"]').onclick=()=>void refresh();
  root.querySelector('[data-action="rollback"]').onclick=()=>void change(false);
  root.querySelector('[data-action="current"]').onclick=()=>void change(true);
  root.querySelector('[data-action="rescue"]').onclick=()=>{try{window.SukunRecoveryVersions.openRescue();}catch(error){result={error:String(error.message||error)};render();}};
  root.querySelector('select').onchange=render;
  document.getElementById('r1019DataRecovery')?.addEventListener('toggle',event=>{if(event.target.open&&!listed&&!loading)void refresh();});
  render();
 }
 window.addEventListener('sukun:recoverymounted',mount);
 window.addEventListener('sukun:languagechange',render);
 window.addEventListener('sukun:recoveryversions',render);
 window.addEventListener('sukun:recoverydata',render);
 window.addEventListener('sukun:tabownerchange',render);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
