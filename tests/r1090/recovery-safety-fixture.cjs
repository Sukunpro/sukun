'use strict';
// r1090 deliberately evolves canonical settings capture and export privacy.
// Pin the unchanged safety regions from r1089/a5cf9ad instead of treating the
// entire evolving exporter as frozen. Canonical capture/privacy has behavioral
// coverage in canonical-export.cjs and site-export-privacy.cjs.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const regions=[
 ['settings validation','  function allowedKey(',['  function captureLS(','  async function captureLS('],'476db06672a771246999038cde285824484d08d91200ddffd11665f4a5bab5be'],
 ['admission and audio read','  function assertion(',['  async function hashBytes('],'0b5a9ab294cc8eb212ad243793b36eb5bd2fdb3c88ff61935e8547f808510650'],
 ['fingerprint schema','  async function hashBytes(',['  async function capture('],'69c564d143a0c12a51ac1994aba222ed2ab648fedde356be1990bab6023733f1'],
 ['restore-point protected storage','  async function quota(',['  function checkPrivate('],'7c071abe7228bde415ee64c542fdf521805738978ef1f8e14c1194717cb317ca'],
 ['suspended exact restore and additive-only rescue','  function recordings(',['  async function capturePortable('],'9759e3c0bd7bb1d90f85f6cb20d62a032586449cb12d4e867b5fd208b0ab6be4'],
 ['guarded import','  async function importPersonal(',['\n  function render()'],'7c7f070069662fcd695c6550f62e8ea6e25d3fe1f3eabbd83f57010fbf93372e']
];
function assertRecoverySafety(data){for(const[label,start,ends,expected]of regions){const i=data.indexOf(start),candidates=ends.map(end=>data.indexOf(end,i)).filter(j=>j>i),j=Math.min(...candidates);assert(i>=0&&Number.isFinite(j),'Missing recovery safety region: '+label);assert.equal(hash(data.slice(i,j)),expected,'Recovery safety region changed: '+label);}assert.match(data,/exactRestoreEnabled:\s*false/);assert.match(data,/automaticReplay:\s*false/);}
module.exports={assertRecoverySafety};
