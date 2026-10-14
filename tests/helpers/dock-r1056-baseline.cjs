'use strict';
// Preserve the historic transport/volume owner hash after admitting only the
// independently exercised r1056 accepted-source row and its language repaint.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const baseline='d9d86c7c21eb53e840b1f4fa968a3ab30b8c0e057dc2dc14a0704bae19ef3df0';
function normalizeApprovedSourceRow(value){
 let source=String(value);
 // r1060: pin the complete reviewed file, then restore only context-display
 // and matching-volume changes. Transport/layout bytes remain pinned below.
 if(sha(source)==='921a6ec8374233a3db782eaf35dcd5628f2bcfa296f1efa34606871cda1e4590'){
  const approved=[{"new": "  const display=window.SukunActiveSource?.read?.();\n  const zikir=display?display.dhikr:!!session&&(session.journey?.active||session.playing||session.paused||session.preparing||\n", "old": "  const zikir=!!session&&(session.journey?.active||session.playing||session.paused||session.preparing||\n"}, {"new": "  const permitted=!zikir||session?.activeMode!=='berhet'||!!window.SukunSecretPolicy?.unlocked?.();\n  const value=String(!permitted?'SÜKÛN':zikir&&session.activeName?session.activeName:display?.current||display?.title||$('r588Title')?.textContent||'SÜKÛN').trim();\n", "old": "  const permitted=session?.activeMode!=='berhet'||!!window.SukunSecretPolicy?.unlocked?.();\n  const value=String(!permitted?'SÜKÛN':zikir&&session.activeName?session.activeName:$('r588Title')?.textContent||'SÜKÛN').trim();\n"}, {"new": "   const name=document.createElement('span');name.id='r1060DockVolumeLabel';name.textContent='Zikir sesi';\n", "old": "   const name=document.createElement('span');name.textContent='Zikir sesi';\n"}, {"new": "   input.addEventListener('input',()=>{const source=$(input.dataset.r1060VolumeSource||'zVolSld');if(!source)return;source.value=input.value;source.dispatchEvent(new Event('input',{bubbles:true}));text(output,Math.round(Number(source.value)*100)+'%');});\n   input.addEventListener('change',()=>{const source=$(input.dataset.r1060VolumeSource||'zVolSld');if(source){source.value=input.value;source.dispatchEvent(new Event('change',{bubbles:true}));}});\n", "old": "   input.addEventListener('input',()=>{const source=$('zVolSld');if(!source)return;source.value=input.value;source.dispatchEvent(new Event('input',{bubbles:true}));text(output,Math.round(Number(source.value)*100)+'%');});\n   input.addEventListener('change',()=>{const source=$('zVolSld');if(source){source.value=input.value;source.dispatchEvent(new Event('change',{bubbles:true}));}});\n"}, {"new": "   $('masterVol')?.addEventListener('input',schedule,{passive:true});\n", "old": ""}, {"new": "  const display=window.SukunActiveSource?.read?.(),sourceId=display&&display.volumeScope!=='zikir'?'masterVol':'zVolSld';\n  const source=$(sourceId),input=$('r920DockVolume');\n  if(input){input.dataset.r1060VolumeSource=sourceId;const zikir=sourceId==='zVolSld',en=window.I18N?.lang==='en';text($('r1060DockVolumeLabel'),zikir?(en?'Dhikr volume':'Zikir sesi'):(en?'Master volume':'Genel ses'));input.setAttribute('aria-label',zikir?(en?'Dhikr volume':'Zikir sesi seviyesi'):(en?'Master volume':'Genel ses seviyesi'));}\n  for(const id of ['r920DockPrev','r920DockNext']){const b=$(id);if(b){const show=display?display.navigation:true;b.hidden=!show;b.dataset.r1060Hide=String(!show);}}\n", "old": "  const source=$('zVolSld'),input=$('r920DockVolume');\n"}, {"new": " ['sukun:r698modechange','sukun:r616viewchange','sukun:tabchange','sukun:sessionchange','sukun:currentflowchange','sukun:secretaccesschange','sukun:languagechange','sukun:backgroundmix','pageshow'].forEach(event=>window.addEventListener(event,schedule,{passive:true}));\n", "old": " ['sukun:r698modechange','sukun:r616viewchange','sukun:tabchange','sukun:sessionchange','sukun:currentflowchange','sukun:secretaccesschange','sukun:languagechange','pageshow'].forEach(event=>window.addEventListener(event,schedule,{passive:true}));\n"}];
  for(const patch of approved){assert.equal(source.split(patch.new).length-1,1,'one exact r1060 display/control patch');source=source.replace(patch.new,patch.old);}
 }
 if(sha(source)===baseline)return source;
 const marker='  // One short source line reuses the accepted session, including a paused\n';
 const start=source.indexOf(marker),end=source.indexOf(' }\n function mount(){',start);
 assert(start>=0&&end>start,'exact approved r1056 source-row boundary');
 assert.equal(source.indexOf(marker,start+marker.length),-1,'one source-row addition');
 // Pin every new byte; do not ignore an arbitrary body or future mutation.
 // tests/r1056/ui-source-and-controls.cjs executes miniPresentation against
 // personal/generic/device, paused, hidden and private-context cases.
 assert.equal(sha(source.slice(start,end)),'68400a6acf52d3c36480c69fed61784cdef29294c67d2544b2853fbbc15c2d14','approved read-only source-row bytes');
 const current=" ['sukun:r698modechange','sukun:r616viewchange','sukun:tabchange','sukun:sessionchange','sukun:currentflowchange','sukun:secretaccesschange','sukun:languagechange','pageshow'].forEach(event=>window.addEventListener(event,schedule,{passive:true}));";
 const original=" ['sukun:r698modechange','sukun:r616viewchange','sukun:tabchange','sukun:sessionchange','sukun:currentflowchange','sukun:secretaccesschange','pageshow'].forEach(event=>window.addEventListener(event,schedule,{passive:true}));";
 assert.equal(source.split(current).length-1,1,'one exact reviewed language-repaint event addition');
 return (source.slice(0,start)+source.slice(end)).replace(current,original);
}
module.exports={normalizeApprovedSourceRow};
