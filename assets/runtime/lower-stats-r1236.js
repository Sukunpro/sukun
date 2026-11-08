/* Lower duplicate statistics only. The wheel and count engines keep their owners. */
(()=>{'use strict';
 const KEY='sukun.practice.tefStats.v1',choices=['normal','compact','hidden'];
 const $=id=>document.getElementById(id);
 let preference='normal',host=null,field=null,select=null,inTef=false;
 try{const saved=localStorage.getItem(KEY);if(choices.includes(saved))preference=saved}catch(_){}
 const english=()=>window.I18N?.lang==='en';
 function write(node,value){if(node&&node.textContent!==value)node.textContent=value}
 function labels(){
  write($('r1236StatsLabel'),english()?'Lower indicators in contemplation':'Tefekkürde alt göstergeler');
  write($('r1236StatsHelp'),english()?'Only the target and remaining cards below the wheel. Wheel information stays visible.':'Yalnız çarkın altındaki hedef ve kalan kartları. Çarkın bilgileri görünür kalır.');
  if(select)for(const [i,option]of [...select.options].entries())write(option,(english()?['Normal','Small','Hidden']:['Normal','Küçük','Gizli'])[i]);
 }
 const hidden=()=>!!host&&inTef&&preference==='hidden';
 function paint(){
  if(!host)return;
  // Move focus before a lower value/editor becomes hidden, never into the wheel.
  if(hidden()&&[$('r920Target')?.parentElement,$('r920Remaining')?.parentElement,$('r1227CountEntry')].some(node=>node?.contains(document.activeElement)))select?.focus({preventScroll:true});
  const mode=inTef?preference:'normal';
  const changed=host.dataset.r1236Stats!==mode;
  if(changed)host.dataset.r1236Stats=mode;
  if(select&&select.value!==preference)select.value=preference;
  if(changed)window.SukunCountEntry?.render?.();
 }
 function set(value){
  if(!choices.includes(value))return false;
  preference=value;try{localStorage.setItem(KEY,value)}catch(_){}
  paint();return true;
 }
 function make(){
  if(field?.isConnected)return;
  field=document.createElement('div');field.id='r1236StatsChoice';
  field.innerHTML='<label id="r1236StatsLabel" for="r1236StatsSelect"></label><select id="r1236StatsSelect" aria-describedby="r1236StatsHelp"><option value="normal"></option><option value="compact"></option><option value="hidden"></option></select><p id="r1236StatsHelp"></p>';
  select=field.querySelector('select');select.value=preference;select.onchange=()=>set(select.value);
 }
 function sync(root,tef){
  host=root;inTef=!!tef;const options=$('r920ViewOptions'),hero=$('r938Hero');
  if(!options||!hero)return;
  make();const parent=inTef?hero:options;
  if(field.parentElement!==parent)parent.append(field);
  labels();paint();
 }
 function beforeRestore(root){
  if(host!==root)return;
  const options=$('r920ViewOptions');if(field&&options&&field.parentElement!==options)options.append(field);
  delete root.dataset.r1236Stats;host=null;inTef=false;
 }
 window.addEventListener('storage',event=>{
  if(event.key!==KEY&&event.key!==null)return;
  preference=choices.includes(event.newValue)?event.newValue:'normal';paint();
 });
 window.addEventListener('sukun:languagechange',labels,{passive:true});
 window.SukunLowerStats=Object.freeze({sync,beforeRestore,set,hidden,snapshot:()=>({preference,effective:inTef?preference:'normal',inTef})});
})();
