'use strict';
// Preserve the historic transport/volume owner hash after admitting only the
// independently exercised r1056 accepted-source row and its language repaint.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const baseline='d9d86c7c21eb53e840b1f4fa968a3ab30b8c0e057dc2dc14a0704bae19ef3df0';
function normalizeApprovedSourceRow(value){
 const source=String(value);
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
