'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const rescue=fs.readFileSync(path.join(root,'rescue.html'),'utf8');
const entry=fs.readFileSync(path.join(root,'assets/runtime/recovery-entry-r1027.js'),'utf8');
const rescueCode=rescue.match(/<script id="sukun-static-rescue">([\s\S]*?)<\/script>/)[1];
function hub(){return{handlers:{},addEventListener(type,fn,options){(this.handlers[type]??=[]).push({fn,options})}};}
function fire(target,type,data={}){for(const {fn} of target.handlers[type]||[])fn({type,isTrusted:true,pointerId:1,isPrimary:true,button:0,clientX:10,clientY:10,...data});}
function deny(){throw Error('Unexpected data/network mutation or read');}
function entryFixture(){
 let next=0,at=0;const jobs=new Map(),navigation=[],title=hub(),fallback=hub(),document=hub(),window=hub();
 document.hidden=false;document.documentElement={lang:'tr'};document.querySelector=selector=>selector==='[data-sukun-recovery-title]'?title:null;document.getElementById=id=>id==='sukun-rescue-link'?fallback:null;
 const ctx={document,window,location:{href:'https://example.test/app/index.html?other=1',assign:url=>navigation.push(url)},URL,Math,
 setTimeout:(fn,ms)=>{jobs.set(++next,{fn,when:at+ms});return next;},clearTimeout:id=>jobs.delete(id),fetch:deny};
 for(const key of ['localStorage','sessionStorage','indexedDB','caches'])Object.defineProperty(ctx,key,{get:deny});
 vm.runInNewContext(entry,ctx);
 function tick(ms){at+=ms;for(const [id,j] of jobs)if(j.when<=at){jobs.delete(id);j.fn();}}
 return{title,fallback,document,window,navigation,jobs,tick,down:(data={})=>{fire(document,'pointerdown',data);fire(title,'pointerdown',data)},up:(data={})=>fire(document,'pointerup',data)};
}
function rescueFixture(options={}){
 const elements=Object.fromEntries(['worker-tr','worker-en','status-tr','status-en'].map(id=>[id,{hidden:true,href:null,textContent:'',removeAttribute(key){delete this[key];}}]));
 const sections=['tr','en'].map(lang=>({hidden:false,getAttribute:()=>lang}));const document={documentElement:{lang:'tr'},querySelectorAll:()=>sections,getElementById:id=>elements[id]};
 const sw=hub();sw.controller=options.controller||null;sw.register=deny;sw.getRegistration=deny;sw.getRegistrations=deny;
 const navigator={language:options.language||'tr-TR'};
 if(options.throwSW)Object.defineProperty(navigator,'serviceWorker',{get:deny});else if(!options.noSW)navigator.serviceWorker=sw;
 const ctx={document,navigator,location:{href:options.href||'https://example.test/app/rescue.html',assign:deny,reload:deny},URL,fetch:deny};
 for(const key of ['localStorage','sessionStorage','indexedDB','caches'])Object.defineProperty(ctx,key,{get:deny});
 vm.runInNewContext(rescueCode,ctx);
 return{document,sections,elements,sw};
}
const results=[];function test(name,fn){try{fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.message});}}
test('No legacy tap curtain, visible tap label or obsolete toggle markup',()=>{for(const id of ['acilisPerde','apDokun','acilisTgl','sukun-startup-curtain-runtime'])assert(!new RegExp('id="'+id+'"').test(html),id);});
test('Rescue does not import main JavaScript, CSS or any remote asset',()=>{assert(!/<script[^>]+src=|<link[^>]+(?:stylesheet|preload)|https?:\/\//i.test(rescue));new vm.Script(rescueCode);});
test('Native keyboard fallback is a plain focusable same-origin link without main JS',()=>{assert.match(html,/<a id="sukun-rescue-link" href="\.\/rescue\.html">/);assert(!/<a id="sukun-rescue-link"[^>]*(?:tabindex="-1"|onclick=|hidden)/.test(html));assert.match(html,/#sukun-rescue-link:focus/);});
test('Independent entry script is deferred and has no main-runtime dependency',()=>{assert.match(html,/<script defer src="\.\/assets\/runtime\/recovery-entry-r1027\.js\?v=r\d+"/);const f=entryFixture();f.down();f.tick(1200);f.up();assert.deepEqual(f.navigation,['https://example.test/app/rescue.html?lang=tr']);});
test('Short click remains unchanged and never navigates',()=>{const f=entryFixture();f.down();f.tick(1199);f.up();f.tick(100);assert.equal(f.navigation.length,0);assert.equal(f.jobs.size,0);});
test('Long press requires release and navigates once',()=>{const f=entryFixture();f.down();f.tick(1500);assert.equal(f.navigation.length,0);f.up();f.up();assert.equal(f.navigation.length,1);});
test('English title entry forwards only whitelisted language',()=>{const f=entryFixture();f.document.documentElement.lang='en';f.down();f.tick(1200);f.up();assert.equal(f.navigation[0],'https://example.test/app/rescue.html?lang=en');});
test('Native link uses current document language on explicit activation',()=>{const f=entryFixture();f.document.documentElement.lang='en';fire(f.fallback,'click');assert.equal(f.fallback.href,'https://example.test/app/rescue.html?lang=en');assert.equal(f.navigation.length,0);});
for(const name of ['pointercancel','scroll'])test(name+' cancels long press',()=>{const f=entryFixture();f.down();f.tick(1200);fire(f.document,name);f.up();assert.equal(f.navigation.length,0);});
for(const name of ['blur','pagehide'])test(name+' cancels long press',()=>{const f=entryFixture();f.down();f.tick(1200);fire(f.window,name);f.up();assert.equal(f.navigation.length,0);});
test('Hidden visibility cancels long press',()=>{const f=entryFixture();f.down();f.document.hidden=true;fire(f.document,'visibilitychange');f.tick(1200);f.up();assert.equal(f.navigation.length,0);});
test('Escape cancels long press without intercepting keyboard input',()=>{const f=entryFixture();f.down();f.tick(1200);fire(f.document,'keydown',{key:'Escape',preventDefault:deny});f.up();assert.equal(f.navigation.length,0);});
test('Movement during press cancels without preventing scroll',()=>{const f=entryFixture();f.down();fire(f.document,'pointermove',{clientX:21,preventDefault:deny});f.tick(1200);f.up();assert.equal(f.navigation.length,0);});
test('Moved release cancels even when move event was missed',()=>{const f=entryFixture();f.down();f.tick(1200);f.up({clientY:30});assert.equal(f.navigation.length,0);});
test('Second finger cancels the initial intent',()=>{const f=entryFixture();f.down();fire(f.document,'pointerdown',{pointerId:2,isPrimary:false});f.tick(1200);f.up();assert.equal(f.navigation.length,0);});
test('Right button and untrusted input cannot open hidden entry',()=>{for(const e of [{button:2},{isTrusted:false},{isPrimary:false}]){const f=entryFixture();f.down(e);f.tick(1400);f.up();assert.equal(f.navigation.length,0);}});
test('Ordinary input handlers never prevent default, stop propagation or capture pointers',()=>{assert(!/\.preventDefault\(|\.stopPropagation\(|\.setPointerCapture\(/.test(entry));});
test('Returning through Back allows a fresh deliberate entry',()=>{const f=entryFixture();f.down();f.tick(1200);f.up();fire(f.window,'pageshow');f.down();f.tick(1200);f.up();assert.equal(f.navigation.length,2);});
for(const options of [{noSW:true},{},{throwSW:true}])test('Static page remains usable without accessible controlling SW: '+JSON.stringify(options),()=>{const f=rescueFixture(options);assert.equal(f.elements['worker-tr'].hidden,true);assert.equal(f.elements['worker-tr'].href,undefined);assert.match(rescue,/<a class="action" href="\.\/index\.html">/);});
test('Only the matching activated same-origin worker exposes version options',()=>{for(const controller of [{state:'activated',scriptURL:'https://evil.test/app/sw.js'},{state:'activated',scriptURL:'https://example.test/other/sw.js'},{state:'installing',scriptURL:'https://example.test/app/sw.js'}])assert(rescueFixture({controller}).elements['worker-tr'].hidden);const f=rescueFixture({controller:{state:'activated',scriptURL:'https://example.test/app/sw.js?v=r1026'}});assert.equal(f.elements['worker-tr'].hidden,false);assert.equal(f.elements['worker-en'].href,'./__sukun_recovery__?lang=en');});
test('Controller disappearance removes the no-longer-valid version link',()=>{const f=rescueFixture({controller:{state:'activated',scriptURL:'https://example.test/app/sw.js'}});f.sw.controller=null;fire(f.sw,'controllerchange');assert(f.elements['worker-tr'].hidden);assert.equal(f.elements['worker-tr'].href,undefined);});
test('Explicit language whitelist overrides device language without reading or writing storage',()=>{const f=rescueFixture({language:'tr',href:'https://example.test/app/rescue.html?lang=en&next=https://evil.test/'});assert.equal(f.document.documentElement.lang,'en');assert.equal(f.sections[0].hidden,true);assert.equal(f.sections[1].hidden,false);const invalid=rescueFixture({language:'en-US',href:'https://example.test/app/rescue.html?lang=javascript:evil'});assert.equal(invalid.document.documentElement.lang,'en');});
test('Both languages and usable app links are present before any JavaScript runs',()=>{assert.match(rescue,/<section data-language="tr" lang="tr">/);assert.match(rescue,/<section data-language="en" lang="en">/);assert.equal((rescue.match(/href="\.\/index\.html"/g)||[]).length,2);assert.match(rescue,/<noscript>/);});
test('Load cannot restore, unregister, clear cache, replace data, or select a version',()=>{assert(!/\b(?:localStorage|sessionStorage|indexedDB|caches|fetch)\s*[.(]|\.(?:register|unregister|update|postMessage|reload|replace|assign)\s*\(/.test(rescueCode));assert(!/RECOVERY_(?:CURRENT|ROLLBACK)|CACHE_REFRESH|SKIP_WAITING/.test(rescueCode));});
console.log(JSON.stringify({total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,scope:'Production standalone sources, synthetic event/timer/controller endpoints, no main runtime or real user data. Browser rendering and actual audio are separate checks.',results},null,2));
if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
