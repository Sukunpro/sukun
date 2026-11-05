'use strict';
// Exercise shipped keyboard handlers with actual filtered card order and row
// geometry. No transport or session command is supplied to these helpers.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/runtime/interface-r920.js','utf8');
const start=source.indexOf('function atlasTabstop('),end=source.indexOf('function renderAtlas(){',start);
assert(start>0&&end>start);
let columns=2,dir='ltr',paints=0,scrolls=0;
const document={activeElement:null};
const search={focus(){document.activeElement=this}};
const nodes={children:[]};
for(let index=0;index<99;index++)nodes.children.push({dataset:{index:String(index)},hidden:false,tabIndex:0,
 getBoundingClientRect(){return {top:Math.floor(nodes.children.filter(b=>!b.hidden).indexOf(this)/columns)*60}},
 focus(){document.activeElement=this},scrollIntoView(options){assert.equal(options.behavior,'instant');scrolls++},closest(){return this}});
const c={document,$:id=>id==='r920AtlasNodes'?nodes:search,prop:(node,key,value)=>node[key]=value,atlasIndex:0,getComputedStyle:()=>({direction:dir}),renderAtlas(){paints++;c.atlasTabstop(nodes)}};
vm.createContext(c);vm.runInContext(source.slice(start,end),c);
function stops(){return nodes.children.filter(b=>b.tabIndex===0)}
function key(value,extra={}){let prevented=false;const event={key:value,target:document.activeElement||nodes.children[0],preventDefault(){prevented=true},...extra};c.atlasKeydown(event);return prevented}
c.atlasTabstop(nodes);assert.equal(stops().length,1);assert.equal(stops()[0],nodes.children[0],'99 cards expose one catalogue Tab stop');
nodes.children[0].focus();assert(key('ArrowDown'));assert.equal(document.activeElement,nodes.children[2]);assert.equal(c.atlasIndex,2);
assert(key('ArrowRight'));assert.equal(document.activeElement,nodes.children[3]);
assert(key('Home'));assert.equal(document.activeElement,nodes.children[0]);
assert(key('End'));assert.equal(document.activeElement,nodes.children[98]);assert.equal(stops().length,1);
assert(key('ArrowRight'));assert.equal(document.activeElement,nodes.children[98],'end of catalogue does not wrap unexpectedly');
assert(!key('Tab'),'Tab stays native so details remain reachable');
assert(!key('ArrowLeft',{altKey:true}),'browser back shortcut is not consumed');
const previous=paints;assert(!key('Enter'));assert.equal(paints,previous,'native activation stays with the button handler');
// Search and status filters preserve catalogue indices, rather than skipping
// by raw DOM positions or previewing a hidden name.
for(const b of nodes.children)b.hidden=![2,7,11].includes(Number(b.dataset.index));
c.atlasIndex=0;document.activeElement=search;c.atlasTabstop(nodes);assert.equal(stops()[0],nodes.children[2]);assert.equal(c.atlasIndex,0,'filter alone does not change preview');
nodes.children[2].focus();key('ArrowRight');assert.equal(c.atlasIndex,7);key('ArrowDown');assert.equal(c.atlasIndex,11);
nodes.children[11].hidden=true;c.atlasTabstop(nodes);assert.equal(document.activeElement,nodes.children[2],'hidden focused card recovers within visible catalogue');
for(const b of nodes.children)b.hidden=true;c.atlasTabstop(nodes);assert.equal(stops().length,0);assert.equal(document.activeElement,search,'empty catalogue returns lost card focus to search');
for(const b of nodes.children)b.hidden=false;
columns=3;c.atlasIndex=1;nodes.children[1].focus();key('ArrowDown');assert.equal(c.atlasIndex,4,'desktop uses rendered row size');
dir='rtl';key('ArrowRight');assert.equal(c.atlasIndex,3,'horizontal arrows follow RTL geometry');
assert(scrolls>0);console.log('PASS Atlas keyboard: one Tab stop, arrow/Home/End preview, filtered order, focus recovery, responsive columns, RTL and native shortcuts.');
