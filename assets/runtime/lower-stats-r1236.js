/* Automatic lower duplicate statistics. One visibility owner, no size/eye UI.
   Historical size/eye storage is intentionally untouched for rollback. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 let host=null,inTef=false,controlsVisible=false;
 const hidden=()=>!!host&&inTef&&!controlsVisible;
 const focusTarget=()=>$('r1056FocusControlsToggle');
 function paint(){
  if(!host)return;
  if(hidden()&&[$('r920Target')?.parentElement,$('r920Remaining')?.parentElement,$('r1227CountEntry')].some(node=>node?.contains(document.activeElement)))focusTarget()?.focus({preventScroll:true});
  const mode=hidden()?'hidden':inTef?'compact':'normal',changed=host.dataset.r1236Stats!==mode;
  if(changed)host.dataset.r1236Stats=mode;
  if(changed)window.SukunCountEntry?.render?.();
 }
 function syncControls(value){controlsVisible=!!value;paint()}
 function sync(root,tef){host=root;inTef=!!tef;controlsVisible=root.dataset.r1056FocusControls==='shown';paint()}
 function beforeRestore(root){if(host!==root)return;delete root.dataset.r1236Stats;host=null;inTef=false}
 window.SukunLowerStats=Object.freeze({sync,beforeRestore,syncControls,hidden,focusTarget,snapshot:()=>({automatic:true,effective:hidden()?'hidden':inTef?'compact':'normal',inTef,controlsVisible})});
})();
