/* Lower duplicate statistics only. No wheel, count, transport or recording owner. */
(()=>{'use strict';
 const KEY='sukun.practice.tefStats.v2',LEGACY='sukun.practice.tefStats.v1';
 const $=id=>document.getElementById(id),defaults=()=>({size:50,visible:true});
 let preference=defaults(),host=null,field=null,range=null,eye=null,inTef=false,controlsVisible=false;
 function decode(value){try{const x=JSON.parse(value);return x&&Number.isInteger(x.size)&&x.size>=0&&x.size<=100&&typeof x.visible==='boolean'?{size:x.size,visible:x.visible}:null}catch(_){return null}}
 try{const saved=localStorage.getItem(KEY);preference=decode(saved)||defaults();if(saved===null){const old=localStorage.getItem(LEGACY);if(old==='compact')preference.size=0;if(old==='hidden')preference.visible=false}}catch(_){}
 const english=()=>window.I18N?.lang==='en';
 function write(node,value){if(node&&node.textContent!==value)node.textContent=value}
 function attr(node,key,value){if(node&&node.getAttribute(key)!==String(value))node.setAttribute(key,String(value))}
 function focusTarget(){return field?.isConnected&&!field.hidden?eye:$('r1056FocusControlsToggle')}
 function labels(){
  write($('r1237StatsLabel'),english()?'Size':'Boyut');
  write($('r1236StatsHelp'),english()?'Resize or hide only the target and remaining cards below the wheel. Wheel information stays visible.':'Yalnız çarkın altındaki hedef ve kalan kartlarını boyutlandırır veya gizler. Çarkın bilgileri görünür kalır.');
  attr(field,'aria-label',english()?'Lower indicator controls':'Alt gösterge kontrolleri');
  attr(range,'aria-label',english()?'Lower indicator size':'Alt gösterge boyutu');
  attr(range,'aria-valuetext',String(preference.size)+(english()?' percent':' yüzde'));
  const action=preference.visible?(english()?'Hide target and remaining indicators':'Hedef ve kalan göstergelerini gizle'):(english()?'Show target and remaining indicators':'Hedef ve kalan göstergelerini göster');
  attr(eye,'aria-label',action);attr(eye,'title',action);attr(eye,'aria-pressed',preference.visible);
  attr($('r1237StatsSmaller'),'aria-label',english()?'Make indicators smaller':'Göstergeleri küçült');
  attr($('r1237StatsLarger'),'aria-label',english()?'Make indicators larger':'Göstergeleri büyüt');
 }
 const hidden=()=>!!host&&inTef&&!preference.visible;
 function paint(){
  if(!host||!field)return;
  const hideField=!controlsVisible;
  if(hideField&&field.contains(document.activeElement))$('r1056FocusControlsToggle')?.focus({preventScroll:true});
  field.hidden=hideField;
  if(hidden()&&[$('r920Target')?.parentElement,$('r920Remaining')?.parentElement,$('r1227CountEntry')].some(node=>node?.contains(document.activeElement)))focusTarget()?.focus({preventScroll:true});
  const mode=hidden()?'hidden':'normal',changed=host.dataset.r1236Stats!==mode;
  if(changed)host.dataset.r1236Stats=mode;
  const size=inTef?preference.size:50;
  if(host.style.getPropertyValue('--r1237-stats-size')!==String(size))host.style.setProperty('--r1237-stats-size',String(size));
  if(range.value!==String(preference.size))range.value=String(preference.size);
  const sizer=$('r1237StatsSizer');
  if(!preference.visible&&sizer.contains(document.activeElement))focusTarget()?.focus({preventScroll:true});
  sizer.hidden=!preference.visible;
  attr(eye,'data-visible',preference.visible);labels();
  if(changed)window.SukunCountEntry?.render?.();
 }
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(preference))}catch(_){}paint()}
 function setSize(value){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100)return false;preference={...preference,size:Math.round(value)};persist();return true}
 function setVisible(value){if(typeof value!=='boolean')return false;preference={...preference,visible:value};persist();return true}
 function syncControls(value){controlsVisible=!!value;paint()}
 function make(){
  if(field?.isConnected)return;
  field=document.createElement('div');field.id='r1237StatsControls';field.setAttribute('role','group');
  field.innerHTML='<div id="r1237StatsSizer"><label id="r1237StatsLabel" for="r1237StatsSize"></label><button id="r1237StatsSmaller" type="button" aria-controls="r1237StatsSize">−</button><input id="r1237StatsSize" type="range" min="0" max="100" step="1" aria-describedby="r1236StatsHelp"><button id="r1237StatsLarger" type="button" aria-controls="r1237StatsSize">+</button></div><button id="r1237StatsEye" type="button" aria-controls="r920Target r920Remaining" aria-describedby="r1236StatsHelp"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="r1237EyeSlash" d="m4 3 16 18"/></svg></button><p id="r1236StatsHelp"></p>';
  range=$('r1237StatsSize')||field.querySelector('input');eye=field.querySelector('#r1237StatsEye');
  range.oninput=()=>setSize(Number(range.value));
  field.querySelector('#r1237StatsSmaller').onclick=()=>setSize(Math.max(0,preference.size-10));
  field.querySelector('#r1237StatsLarger').onclick=()=>setSize(Math.min(100,preference.size+10));
  eye.onclick=()=>setVisible(!preference.visible);
 }
 function sync(root,tef){
  host=root;inTef=!!tef;const options=$('r920ViewOptions'),stats=root.querySelector('.r920Stats');
  if(!options||!stats)return;
  make();const parent=inTef?stats:options,exit=$('r920TefExit');
  if(inTef&&exit?.parentElement===stats){if(field.parentElement!==stats||field.nextElementSibling!==exit)stats.insertBefore(field,exit)}else if(field.parentElement!==parent)parent.append(field);
  controlsVisible=root.dataset.r1056FocusControls==='shown';paint();
 }
 function beforeRestore(root){
  if(host!==root)return;const options=$('r920ViewOptions');
  if(field&&options&&field.parentElement!==options)options.append(field);
  delete root.dataset.r1236Stats;root.style.removeProperty('--r1237-stats-size');host=null;inTef=false;
 }
 window.addEventListener('storage',event=>{if(event.key!==KEY&&event.key!==null)return;preference=decode(event.newValue)||defaults();paint()});
 window.addEventListener('sukun:languagechange',labels,{passive:true});
 window.SukunLowerStats=Object.freeze({sync,beforeRestore,syncControls,setSize,setVisible,hidden,focusTarget,snapshot:()=>({...preference,effective:inTef?(preference.visible?'sized':'hidden'):'normal',inTef,controlsVisible})});
})();
