/* Koruma tertibi is a draft for the existing smart-session player. */
(()=>{'use strict';
if(window.SukunProtectivePlanR1078)return;
const safe=(fn,fallback=null)=>{try{return fn()}catch(_){return fallback}};
const key='sukun.protective-plan.r1078';
const spec=[
 {idx:4,tr:'Âyetü’l-Kürsî',en:'Ayat al-Kursi',included:true},
 {idx:0,tr:'Felâk Sûresi',en:'Al-Falaq',included:true},
 {idx:1,tr:'Nâs Sûresi',en:'An-Nas',included:true},
 {idx:3,tr:'Kalem 51–52',en:'Al-Qalam 51–52',included:true},
 {idx:2,tr:'İhlâs Sûresi',en:'Al-Ikhlas',included:false}
];
const stored=safe(()=>JSON.parse(localStorage.getItem(key)||'null'));
const saved=Array.isArray(stored)?stored:[];
const rows=spec.map(x=>{const old=saved?.find?.(r=>r.idx===x.idx);return{...x,
 included:typeof old?.included==='boolean'?old.included:x.included,
 reps:Number.isInteger(old?.reps)&&old.reps>=1&&old.reps<=9999?old.reps:7}});
let host=null,offered=false,prepared='',busy=false,status='',statusError=false;
const en=()=>window.I18N?.lang==='en'||document.documentElement.lang==='en';
const t=(tr,eng)=>en()?eng:tr;
const cat=()=>safe(()=>Z.cat,'');
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId=id=>document.getElementById(id);
function persist(){safe(()=>localStorage.setItem(key,JSON.stringify(rows.map(({idx,reps,included})=>({idx,reps,included})))))}
function signature(queue){return JSON.stringify((queue||[]).map(({type,cat,idx,reps,repeatMode,protectionPlan})=>({type,cat,idx,reps,repeatMode:repeatMode||'fixed',protectionPlan})))}
function plan(){return rows.filter(r=>r.included).map(r=>({type:'zikir',cat:'koruma',idx:r.idx,reps:r.reps,gap:900,repeatMode:'fixed',advance:'auto',label:r.tr,protectionPlan:'r1078'}))}
function setStatus(kind,error=false){status=kind;statusError=error;paintStatus()}
function paintStatus(){const node=byId('r1078PlanStatus');if(!node)return;
 const count=rows.filter(r=>r.included).length;
 const messages={ready:t(`${count} okuma sıraya hazır. Ses başlatılmadı.`,`${count} readings are queued. Audio has not started.`),
 started:t('Tertip başlatıldı. Duraklat ve Bitir için oynatıcı kontrollerini kullan.','The sequence has started. Use the player controls to pause or stop.'),
 invalid:t('Her seçili okuma için 1–9999 arasında bir tam sayı gir.','Enter a whole number from 1 to 9999 for each selected reading.'),
 empty:t('En az bir okuma seç.','Select at least one reading.'),
 unavailable:t('Oynatıcı henüz hazır değil. Biraz sonra yeniden dene.','The player is not ready yet. Try again shortly.'),
 changed:t('Tertip değişti. Önce yeniden Hazırla’ya dokun.','The sequence has changed. Tap Prepare again first.'),
 rejected:t('Başlatma tamamlanamadı. Oynatıcı durumunu kontrol edip yeniden dene.','Playback could not start. Check the player state and try again.')};
 node.textContent=messages[status]||'';node.classList.toggle('r1078PlanError',statusError);
}
function labels(){if(!host)return;
 const texts={r1078PlanTitle:t('Koruma tertibi','Protective reading sequence'),
 r1078PlanOpen:t('Hazır tertip oluştur','Create a reading sequence'),
 r1078PlanQuestion:t('Seçtiğin ayetleri sırayla kaç kez okuyayım?','How many times should I play each selected reading in order?'),
 r1078PlanNote:t('Tekrar sayılarını isteğine göre değiştirebilirsin. Hazırla, oynatıcı kuyruğunu bu tertiple değiştirir ve mevcut okumayı bitirir.','You can choose the repeat count for each reading. Prepare replaces the player queue with this sequence and stops the current reading.'),
 r1078PlanPrepare:t('Tertibi hazırla','Prepare sequence'),r1078PlanStart:t('Başlat','Start'),
 r1078PlanDismiss:t('Şimdilik geç','Maybe later'),
 r1078PlanOrder:t('Sıra yukarıdan aşağıya; her okuma kendi adedi bitince sonraki okumaya geçer. Tertip bir tur çalınır.','The sequence runs from top to bottom. Each reading finishes its count before the next begins. The sequence plays once.')};
 for(const [id,value]of Object.entries(texts)){const node=byId(id);if(node)node.textContent=value}
 for(const n of[1,3,7]){const node=host.querySelector(`[data-plan-all="${n}"]`);if(node)node.textContent=t(`Seçilenlerin her biri ${n} kez`,`${n} times per selected reading`)}
 for(const row of rows){const name=host.querySelector(`[data-plan-name="${row.idx}"]`),number=host.querySelector(`[data-plan-count="${row.idx}"]`);
  if(name)name.textContent=(en()?row.en:row.tr)+(row.idx===2?t(' · isteğe bağlı',' · optional'):'');
  number?.setAttribute('aria-label',t(row.tr+' tekrar sayısı',row.en+' repeat count'));
 }
 byId('r1078PlanAll')?.setAttribute('aria-label',t('Seçili okumalara ortak tekrar sayısı','Apply a repeat count to the selected readings'));
 paintStatus();
}
function setOpen(open,focus=false){if(!host)return;const body=byId('r1078PlanBody'),button=byId('r1078PlanOpen');
 body.hidden=!open;button.setAttribute('aria-expanded',String(open));
 if(open&&focus){const heading=byId('r1078PlanQuestion');heading?.focus({preventScroll:true});
  if(window.SukunNavigationR1066?.reveal)window.SukunNavigationR1066.reveal(host,{reason:'protective-plan',focus:heading,isCurrent:()=>cat()==='koruma'&&!body.hidden});
  else host.scrollIntoView({behavior:'auto',block:'nearest'});
 }
}
function invalidate(){prepared='';byId('r1078PlanStart').disabled=true;if(status)setStatus('')}
function collect(){let valid=true;
 for(const row of rows){const check=host.querySelector(`[data-plan-include="${row.idx}"]`),number=host.querySelector(`[data-plan-count="${row.idx}"]`);
  row.included=check.checked;number.disabled=!row.included;
  const n=Number(number.value),ok=number.value.trim()!==''&&Number.isInteger(n)&&n>=1&&n<=9999;
  number.setAttribute('aria-invalid',String(row.included&&!ok));
  if(ok)row.reps=n;else if(row.included)valid=false;
 }
 if(!valid){setStatus('invalid',true);host.querySelector('[aria-invalid="true"]')?.focus();return false}
 if(!rows.some(r=>r.included)){setStatus('empty',true);return false}
 persist();return true;
}
function prepare(){invalidate();if(!collect())return false;
 const player=window.R170?.Player;if(typeof player?.set!=='function'){setStatus('unavailable',true);return false}
 const queue=plan();if(queue.some(row=>!safe(()=>ZIKIR.koruma.items[row.idx])))return setStatus('unavailable',true),false;
 const reading=window.SukunReadingAudioR1064;
 if(['playing','paused','preparing','error'].includes(String(reading?.snapshot?.()?.phase||'').toLowerCase()))reading.stop('protective-plan-prepare');
 player.set(queue,t('Koruma tertibi','Protective reading sequence'));
 if(signature(player.queue)!==signature(queue)){setStatus('rejected',true);return false}
 prepared=signature(queue);byId('r1078PlanStart').disabled=false;setStatus('ready');
 window.dispatchEvent(new CustomEvent('sukun:protectiveplan',{detail:{phase:'prepared',count:queue.length}}));return true;
}
async function start(){if(busy)return false;const player=window.R170?.Player;
 if(!prepared||prepared!==signature(player?.queue)){invalidate();setStatus('changed',true);return false}
 const controller=window.PlaybackController;if(typeof controller?.play!=='function'){setStatus('unavailable',true);return false}
 busy=true;byId('r1078PlanStart').disabled=true;
 try{window.SukunReadingAudioR1064?.stop?.('protective-plan-start');const result=await controller.play('smart-session');const accepted=result!==false&&!!(player.playing||player.paused);
  setStatus(accepted?'started':'rejected',!accepted);return accepted;
 }catch(_){setStatus('rejected',true);return false}
 finally{busy=false;byId('r1078PlanStart').disabled=!prepared}
}
function place(){const practice=byId('r920Practice'),identity=practice?.querySelector('.r920Identity');
 // r938 may move the identity into its durable hero. Compare its real parent
 // and sibling before moving; a redundant insertion would blur active fields.
 if(identity&&(host.parentElement!==identity.parentElement||identity.nextElementSibling!==host))identity.after(host);
}
function mount(){if(host?.isConnected){place();return true}const list=byId('zList');if(!list)return false;
 host=document.createElement('section');host.id='r1078ProtectivePlan';host.hidden=true;host.setAttribute('aria-labelledby','r1078PlanTitle');host.setAttribute('data-noi18n','');
 host.innerHTML=`<div class="r1078PlanHead"><h3 id="r1078PlanTitle"></h3><button id="r1078PlanOpen" type="button" aria-expanded="false" aria-controls="r1078PlanBody"></button></div>
 <div id="r1078PlanBody" hidden><h4 id="r1078PlanQuestion" tabindex="-1"></h4><p id="r1078PlanNote"></p><div id="r1078PlanAll" role="group">${[1,3,7].map(n=>`<button type="button" data-plan-all="${n}"></button>`).join('')}</div>
 <div id="r1078PlanRows">${rows.map(row=>`<div class="r1078PlanRow"><label><input id="r1078PlanInclude${row.idx}" type="checkbox" data-plan-include="${row.idx}"${row.included?' checked':''}><span data-plan-name="${row.idx}"></span></label><input id="r1078PlanCount${row.idx}" type="number" inputmode="numeric" min="1" max="9999" step="1" data-plan-count="${row.idx}" value="${row.reps}"${row.included?'':' disabled'}></div>`).join('')}</div>
 <p id="r1078PlanOrder"></p><div class="r1078PlanActions"><button id="r1078PlanPrepare" type="button"></button><button id="r1078PlanStart" type="button" disabled></button><button id="r1078PlanDismiss" type="button"></button></div><p id="r1078PlanStatus" role="status" aria-live="polite" aria-atomic="true"></p></div>`;
 list.before(host);place();byId('r1078PlanOpen').onclick=()=>{offered=true;setOpen(byId('r1078PlanBody').hidden)};
 byId('r1078PlanDismiss').onclick=()=>{setOpen(false);byId('r1078PlanOpen').focus({preventScroll:true})};
 byId('r1078PlanPrepare').onclick=prepare;byId('r1078PlanStart').onclick=start;
 host.addEventListener('input',event=>{if(event.target.matches('[data-plan-count]'))invalidate()});
 host.addEventListener('change',event=>{if(event.target.matches('[data-plan-include]')){invalidate();const idx=Number(event.target.dataset.planInclude),row=rows.find(r=>r.idx===idx);row.included=event.target.checked;host.querySelector(`[data-plan-count="${idx}"]`).disabled=!row.included}});
 host.addEventListener('click',event=>{const all=event.target.closest('[data-plan-all]');if(!all)return;invalidate();for(const row of rows)if(host.querySelector(`[data-plan-include="${row.idx}"]`).checked){row.reps=Number(all.dataset.planAll);host.querySelector(`[data-plan-count="${row.idx}"]`).value=String(row.reps)}});
 labels();return true;
}
function sync({entry=false}={}){if(!mount())return false;const selected=cat()==='koruma';host.hidden=!selected;
 if(selected&&!offered){offered=true;setOpen(true,entry)}return selected;
}
document.addEventListener('click',event=>{if(event.target.closest?.('#zCats [data-c]'))queueMicrotask(()=>sync({entry:true}))},{passive:true});
for(const event of['sukun:currentzikirchange','sukun:zikirselectionchange','sukun:domhydrate','pageshow'])window.addEventListener(event,()=>sync(),{passive:true});
window.addEventListener('sukun:languagechange',labels,{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>sync(),{once:true});else sync();
window.SukunProtectivePlanR1078=Object.freeze({version:'r1078',sync,prepare,start,open(){sync();offered=true;setOpen(true)},snapshot:()=>({offered,open:!!byId('r1078PlanBody')&&!byId('r1078PlanBody').hidden,prepared:!!prepared,queue:plan()})});
})();
