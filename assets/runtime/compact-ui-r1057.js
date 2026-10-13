/* r1057: a shared, compact reading strip. Native text, count and controls retain
   their owners; this module never starts audio, counts, or measures the wheel. */
(()=>{'use strict';
if(window.SukunCompactUI)return;
const $=id=>document.getElementById(id),english=()=>window.I18N?.lang==='en';
let warningText=null,observer=null;
const safety={
 tr:'🎧 Binaural mod için kulaklık gerekir • Yanıp sönen ışığa duyarlılık veya epilepsi öyküsü varsa fotik uyarımı kullanmayın • Rahatsızlıkta hemen durun • Araç kullanırken dinlemeyin.',
 en:'🎧 Headphones are required for binaural mode • Do not use photic stimulation if you have photosensitivity or a history of epilepsy • Stop immediately if you feel discomfort • Do not listen while driving.'
};
function attr(node,key,value){if(node&&node.getAttribute(key)!==String(value))node.setAttribute(key,String(value))}
function text(node,value){if(node&&node.textContent!==value)node.textContent=value}
function ownsSummary(node){return !!node&&node.dataset.r1057Compact==='1'&&node.parentElement===$('r920Practice')}
function ownsTotal(node){return !!node&&ownsSummary(node.parentElement)&&node.id==='r986Total'}
function labels(){
 text($('r986TotalLabel'),english()?'Total dhikr':'Toplam zikir');
 attr($('r1056ReadingSummary'),'aria-label',english()?'Total dhikr, audio source and tempo':'Toplam zikir, ses kaynağı ve tempo');
 attr($('r986Total'),'aria-label',english()?'Total dhikr on this device':'Bu cihazda toplam zikir');
 if(warningText){const value=safety[english()?'en':'tr'];if(warningText.nodeValue!==value)warningText.nodeValue=value}
 attr($('r1057FrequencySafety'),'aria-label',english()?'Frequency safety':'Frekans kullanım uyarısı');
}
function frequencySafety(){
 const tab=$('tab-frq');if(!tab)return;
 let notice=$('r1057FrequencySafety');
 if(!notice){
  // The original warning was raw footer text. Move that very text node into
  // its requested tab; backups and every other footer child stay in place.
  let found=null;
  for(const footer of document.querySelectorAll('footer')){
   found=[...footer.childNodes].find(node=>node.nodeType===3&&/Binaural mod|binaural mode|Headphones are required/i.test(node.nodeValue||''));
   if(found)break;
  }
  if(!found)return;
  notice=document.createElement('aside');notice.id='r1057FrequencySafety';notice.setAttribute('data-noi18n','');
  const next=found.nextSibling;notice.append(found);if(next?.nodeName==='BR')next.remove();
  tab.prepend(notice);warningText=found;
 }
 if(!warningText)warningText=[...notice.childNodes].find(node=>node.nodeType===3)||null;
 if(notice.parentElement!==tab)tab.prepend(notice);
 labels();
}
function helpPlacement(){
 const tab=$('tab-zkr');if(!tab)return;
 for(const helper of tab.querySelectorAll('.dockTipHelp')){
  const parent=helper.parentElement;if(!parent)continue;
  // Native help already owns the ? button, caption and click. Give a label
  // with a direct select/input two explicit cells instead of stacking ?.
  const control=[...parent.children].find(node=>['SELECT','INPUT','TEXTAREA'].includes(node.tagName));
  if(parent.tagName==='LABEL'&&control){
   attr(parent,'data-r1057-help-row','1');attr(control,'data-r1057-help-control','1');
  }else if(['SPAN','LABEL','B','SMALL'].includes(parent.tagName))attr(parent,'data-r1057-help-caption','1');
 }
}
function beforeRestore(root){
 const summary=$('r1056ReadingSummary'),total=$('r986Total');
 // Native r938 restores/removes a temporary hero. Its total must remain in
 // the durable root when a private selection becomes unavailable.
 if(root&&total&&summary?.contains(total))root.append(total);
 if(summary?.dataset.r1057Compact==='1')delete summary.dataset.r1057Compact;
}
function sync(root=$('r920Practice')){
 if(root&&!root.hidden){
  const summary=$('r1056ReadingSummary'),total=$('r986Total'),hero=$('r938Hero');
  if(summary&&total&&root.contains(summary)&&root.contains(total)){
   if(summary.parentElement!==root){if(hero?.parentElement===root)hero.after(summary);else root.append(summary)}
   attr(summary,'data-r1057-compact','1');
   if(total.parentElement!==summary)summary.insertBefore(total,summary.children[0]||null);
  }
 }
 frequencySafety();helpPlacement();labels();
}
function start(){
 sync();
 // Only newly mounted helper elements matter here. Counter text and native
 // attributes never trigger this observer, and the observer never polls.
 const tab=$('tab-zkr');if(tab&&typeof MutationObserver==='function'){
  observer=new MutationObserver(records=>{
   if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(node.classList?.contains('dockTipHelp')||node.querySelector?.('.dockTipHelp')))))helpPlacement();
  });
  observer.observe(tab,{childList:true,subtree:true});
 }
}
window.SukunCompactUI=Object.freeze({version:'r1057',sync,ownsSummary,ownsTotal,beforeRestore,helpPlacement,snapshot:()=>({sharedStrip:ownsSummary($('r1056ReadingSummary')),nativeTotal:ownsTotal($('r986Total')),safetyTab:$('r1057FrequencySafety')?.parentElement?.id||null})});
window.addEventListener('sukun:languagechange',()=>{labels();helpPlacement()},{passive:true});
window.addEventListener('pageshow',()=>sync(),{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
