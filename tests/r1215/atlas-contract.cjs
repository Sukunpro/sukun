'use strict';
// Exercise the canonical Atlas presentation and command handlers without a
// browser/audio shim, personal data, or a second implementation of the engine.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/runtime/interface-r920.js','utf8');
let current={activeMode:'esma',activeIndex:0,count:7,target:298},unlocked=true;
const catalogue={esma:[{t:'Rahmân',m:'Rahmeti bütün varlığı kuşatan',a:'رَحْمٰن',ebced:298},{t:'İlim',m:'Gizli olanı bilen'},{t:'Mâlikü’l-Mülk',m:'Mülkün sahibi'}],berhet:[{tr:'Berhetiyye',meaning:'Özgün anlam'}]};
class Node{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.hidden=false;this.textContent='';this.disabled=false;this.value='';}
 set innerHTML(s){this.children=[new Node('span'),new Node('span'),new Node('span')];}
 append(n){this.children.push(n)}
 replaceChildren(...items){this.children=items}
 setAttribute(k,v){this.attributes[k]=String(v)}
 getAttribute(k){return this.attributes[k]??null}
 focus(){this.focused=true}
}
const ids=['r920AtlasTitle','r920AtlasCaption','r920AtlasNodes','r920AtlasName','r920AtlasMeaning','r920AtlasEbced','r920AtlasProgress','r920AtlasScene','r920AtlasNote','r1215AtlasSearchLabel','r1215AtlasSearch','r1215AtlasFilterLabel','r1215AtlasFilter','r1215AtlasResults','r1215AtlasEmpty','r1215AtlasEmptyText','r1215AtlasClear','r920AtlasChoose','r1215AtlasError'];
const nodes=Object.fromEntries(ids.map(id=>[id,new Node()]));
nodes.r1215AtlasFilter.options=['all','remaining','completed','active'].map(value=>Object.assign(new Node(),{value}));
const dialog={open:true,closed:0,close(){this.open=false;this.closed++}};
const context={window:{I18N:{lang:'tr'},SukunSceneEngine:{esmaSceneFor:()=>null}},document:{createElement:t=>new Node(t)},$:(id)=>nodes[id],snap:()=>current,allowed:()=>unlocked,items:mode=>catalogue[mode]||[],scenes:()=>[],itemName:(mode,i)=>catalogue[mode][i].t||catalogue[mode][i].tr,text:(n,v)=>n.textContent=String(v),attr:(n,k,v)=>n.setAttribute(k,v),prop:(n,k,v)=>n[k]=v,safe:(f,d)=>{try{return f()}catch{return d}},dialog,atlasMode:'esma',atlasIndex:0,atlasQuery:'',atlasFilter:'all',atlasChoosing:false,completed:{'esma:1':123},select:async()=>({accepted:true})};
vm.createContext(context);
const a=source.indexOf('function atlasFold('),b=source.indexOf('/* r1056:',a);assert(a>0&&b>a);
vm.runInContext(source.slice(a,b),context);
const matches=context.atlasMatches;
const base={index:0,name:'Yâ Rahmân',meaning:'Rahmeti bütün varlığı kuşatan',arabic:'رَحْمٰن',done:false,active:true};
assert(matches('rahman','all',base));assert(matches('RÂHMÂN','all',base));assert(matches('varligi kusatan','all',base));
assert(matches('rahman rahmeti','all',base),'separate words can match name and meaning');
assert(matches('رحمن','all',base),'Arabic vowel marks do not prevent a match');
assert(matches('ILIM','all',{...base,name:'İlim'}),'Turkish dotted/dotless I share a search key');
assert(matches('MALIKUL MULK','all',{...base,name:'Mâlikü’l-Mülk'}),'apostrophe/hyphen typography does not block an ordinary spelling');
assert(matches('1','all',base));assert(!matches('unknown','all',base));
assert(matches('','active',base));assert(matches('','remaining',base));assert(!matches('','completed',base));
assert(matches('','completed',{...base,done:true}));assert(!matches('','active',{...base,active:false}));
const sessionBefore=JSON.stringify(current);context.renderAtlas();
assert.equal(nodes.r920AtlasNodes.children.length,3);
assert.equal(nodes.r920AtlasNodes.children[0].children[1].textContent,'Rahmân');
assert.equal(nodes.r920AtlasNodes.children[1].children[2].textContent,'✓');
assert.equal(nodes.r920AtlasNodes.children[0].children[2].textContent,'●');
assert.equal(nodes.r920AtlasProgress.textContent,'Aktif · 7 / 298 · %2');
const original=nodes.r920AtlasNodes.children[0];context.atlasQuery='rahman';context.renderAtlas();
assert.strictEqual(nodes.r920AtlasNodes.children[0],original,'search preserves native node identity and focus');
assert.equal(nodes.r920AtlasNodes.children.filter(n=>!n.hidden).length,1);assert.equal(nodes.r1215AtlasResults.textContent,'3 isimden 1 sonuç');
context.atlasQuery='not found';context.renderAtlas();assert.equal(nodes.r1215AtlasEmpty.hidden,false);assert.equal(nodes.r920AtlasNodes.children.filter(n=>!n.hidden).length,0);
assert.equal(nodes.r920AtlasName.textContent,'1. Rahmân','empty search does not silently choose another name');
context.atlasQuery='';context.atlasFilter='completed';context.renderAtlas();assert.deepEqual(nodes.r920AtlasNodes.children.filter(n=>!n.hidden).map(n=>n.dataset.index),[1]);
assert.equal(JSON.stringify(current),sessionBefore,'search and filters never alter session or count');
context.atlasMode='berhet';context.atlasIndex=0;context.atlasFilter='all';context.renderAtlas();assert.equal(nodes.r920AtlasNodes.children.length,1);assert.equal(nodes.r920AtlasNodes.children[0].children[1].textContent,'Berhetiyye');
unlocked=false;context.renderAtlas();assert.equal(dialog.open,false,'relocking closes private Atlas');
// Run the actual handler, testing race and failure outcomes rather than text.
const h1=source.indexOf("$('r920AtlasChoose').onclick=async()=>{"),h2=source.indexOf('\n // Move existing action controls',h1);assert(h1>0&&h2>h1);
vm.runInContext(source.slice(h1,h2),context);
(async()=>{
 unlocked=true;dialog.open=true;dialog.closed=0;let commands=0,release;
 context.select=()=>{commands++;return new Promise(resolve=>release=resolve)};
 const first=nodes.r920AtlasChoose.onclick();assert.equal(nodes.r920AtlasChoose.disabled,true);await nodes.r920AtlasChoose.onclick();assert.equal(commands,1,'double activation submits one command');
 release({accepted:false});await first;assert.equal(dialog.closed,0,'rejected selection keeps detail open');assert.equal(nodes.r1215AtlasError.hidden,false);assert.equal(nodes.r920AtlasChoose.disabled,false);
 context.select=async()=>({accepted:true,stale:true});await nodes.r920AtlasChoose.onclick();assert.equal(dialog.closed,0,'stale command cannot close as success');
 context.select=async()=>{throw Error('interrupted')};await nodes.r920AtlasChoose.onclick();assert.equal(dialog.closed,0);assert.equal(nodes.r920AtlasChoose.disabled,false);
 context.select=async()=>({accepted:true});await nodes.r920AtlasChoose.onclick();assert.equal(dialog.closed,1);assert.equal(nodes.r1215AtlasError.hidden,true);
 console.log('PASS r1215 Atlas: Turkish/Arabic search, state filters, catalogue names, stable native nodes, unchanged session, private relock, duplicate activation, failure/stale handling');
})().catch(e=>{console.error(e);process.exitCode=1});
