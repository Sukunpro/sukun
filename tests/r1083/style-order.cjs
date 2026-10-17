'use strict';
// Check actual first registration across head assets, rather than a CSS file's
// own order: an unrelated earlier stylesheet can steal important precedence.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),head=html.slice(0,html.indexOf('</head>')),seen=new Map();
for(const tag of head.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>|<link\b[^>]*>/gi)){
 let source=tag[1],owner='inline';
 if(source===undefined){if(!/\brel=["']stylesheet["']/i.test(tag[0]))continue;const url=tag[0].match(/\bhref=["']([^"']+)/i)?.[1];if(!url||/^(?:[a-z]+:|\/\/)/i.test(url))continue;owner=url.split('?')[0].replace(/^\.\//,'');source=fs.readFileSync(path.join(root,owner),'utf8');}
 source=source.replace(/\/\*[\s\S]*?\*\//g,'');
 for(const rule of source.matchAll(/@layer\s+([\w,\s-]+)\s*[;{]/g))for(const name of rule[1].split(',').map(s=>s.trim()))if(name&&!seen.has(name))seen.set(name,{index:seen.size,owner});
}
const expected=['sukun-r1077-contrast','sukun-r1057-compact','sukun-r986-access','sukun-r938-layout','sukun-r933-controls','sukun-r920-contract'];
for(const name of expected)assert(seen.has(name),'Missing layer: '+name);
for(let i=1;i<expected.length;i++)assert(seen.get(expected[i-1]).index<seen.get(expected[i]).index,'Important precedence reversed: '+expected[i-1]+' / '+expected[i]+'; '+JSON.stringify(Object.fromEntries(seen)));
console.log(JSON.stringify({suite:'r1083 shipped head important-layer precedence',passed:expected.length+expected.length-1,scope:'Actual shipped head plus linked CSS first registration; native geometry/material tests are separate.',layers:Object.fromEntries(seen)},null,2));
