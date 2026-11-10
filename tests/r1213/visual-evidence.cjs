'use strict';
// Shared source binding for the visual matrices. Only declared application
// stylesheets/scripts are required; optional media/fallback requests are not.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function binding(root,suite){
 const html=fs.readFileSync(path.join(root,'nero.html'),'utf8');
 const required=new Set(['nero.html',`tests/${suite}/managed-preview.html`]);
 for(const tag of html.match(/<(?:script|link)\b[^>]*>/gi)||[]){
  if(!/^<script\b/i.test(tag)&&! /\brel=["']stylesheet["']/i.test(tag))continue;
  const url=tag.match(/\b(?:src|href)=["']([^"']+)["']/i)?.[1];
  if(!url||/^(?:[a-z]+:|\/\/)/i.test(url))continue;
  required.add(new URL(url,'http://fixture/nero.html').pathname.slice(1));
 }
 if(suite==='tefekkur-glass')required.add(`tests/${suite}/baseline.css`);
 const files=new Set([...required,'index.html',`tests/${suite}/browser.cjs`,'tests/r1064/browser-fixture.cjs','tests/r1213/visual-evidence.cjs']);
 const sources=Object.fromEntries([...files].sort().map(name=>[name,hash(fs.readFileSync(path.join(root,name)))]));
 return {sources,required:[...required].sort(),unchanged:()=>Object.entries(sources).every(([name,digest])=>hash(fs.readFileSync(path.join(root,name)))===digest),verify(f){
  assert.deepEqual(f.errors,[],'Application JavaScript errors');
  for(const name of required)assert.equal(f.served.get(name)?.sha256,sources[name],'Required served source: '+name);
  assert(!f.consoleErrors.some(x=>/integrity|digest|\bSRI\b|Content Security Policy/i.test(x)),'Integrity or CSP error');
 }};
}
module.exports={binding};
