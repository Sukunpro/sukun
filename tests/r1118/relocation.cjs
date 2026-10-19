'use strict';
const fs=require('fs'),assert=require('assert/strict'),cp=require('child_process'),crypto=require('crypto');
const html=fs.readFileSync('index.html','utf8'),base=cp.execFileSync('git',['show','5459587e2a4ce794683908c1b098076b3f2eb081:index.html'],{maxBuffer:20e6}).toString();
const rows=JSON.parse(fs.readFileSync('tests/r1118/recovered-css.json'));
for(const row of rows){
 const original=base.match(new RegExp('<style id="'+row.id+'">([\\s\\S]*?)</style>'))[1];
 const css=fs.readFileSync(row.path,'utf8');assert.equal(css,original);
 assert.equal(crypto.createHash('sha256').update(css).digest('hex'),row.sha256);
 assert.equal(html.split('id="'+row.id+'"').length,2);
 const before=base.slice(0,base.indexOf('<style id="'+row.id+'">')).match(/(?:id|href)="[^"]+"/g).at(-1);
 const after=html.slice(0,html.indexOf('<link rel="stylesheet" id="'+row.id+'"')).match(/(?:id|href)="[^"]+"/g).at(-1);
 // Adjacent relocated owner has a new href; compare owner order separately.
 if(!after.includes('r1118.css'))assert.equal(after.replaceAll('r1118','r1117'),before);
}
const ids=s=>[...s.matchAll(/<(?:style|link)\b[^>]*id="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(ids(html),ids(base));
for(const id of ['sukun-r1029-mic-notes-preference','sukun-r914-runtime']){
 const extract=s=>s.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))?.[1];assert(extract(base));assert.equal(extract(html),extract(base));
}
assert.equal(html,fs.readFileSync('nero.html','utf8'));
console.log(JSON.stringify({passed:true,owners:3,bytes:rows.reduce((n,r)=>n+r.bytes,0),baseline:'5459587e2a4ce794683908c1b098076b3f2eb081'}));
