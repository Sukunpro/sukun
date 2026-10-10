'use strict';
// Production-source and synthetic preference contracts, not compositor/device QA.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const controls=fs.readFileSync(path.join(root,'assets/runtime/berhet-controls-r933.css'),'utf8');
const layout=fs.readFileSync(path.join(root,'assets/runtime/berhet-layout-r938.css'),'utf8');
const dock=fs.readFileSync(path.join(root,'assets/runtime/berhet-dock-r933.css'),'utf8');
const paint=html.match(/<style id="sukun-r1029-surface-clarity">([\s\S]*?)<\/style>/)?.[1];
const preference=html.match(/<script id="sukun-r1029-mic-notes-preference">([\s\S]*?)<\/script>/)?.[1];
const results=[];function test(name,fn){try{fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
test('Entry points remain identical',()=>assert.equal(html,fs.readFileSync(path.join(root,'nero.html'),'utf8')));
test('Clarity style and preference script each have exactly one owner',()=>{assert(paint&&preference);assert.equal((html.match(/id="sukun-r1029-surface-clarity"/g)||[]).length,1);assert.equal((html.match(/id="sukun-r1029-mic-notes-preference"/g)||[]).length,1)});
test('Visible label sits above actual master-volume range',()=>{assert.match(html,/<div class="card masterBar">\s*<label id="r1029MasterVolumeLabel" for="masterVol">Ses düzeyi<\/label>\s*<div class="mbRow">/);assert.match(html,/<input aria-label="Ses düzeyi" aria-labelledby="r1029MasterVolumeLabel" id="masterVol"[^>]*max="1" min="0" step="0.01" type="range" value="0.7"/)});
test('Volume label does not target the separate flow player',()=>{assert(!/<label id="r1029MasterVolumeLabel"[^>]*(?:r920DockVolume|r434MasterVol|r588)/.test(html));assert.match(paint,/#r1029MasterVolumeLabel\{[\s\S]*?display:block!important/)});
test('Exact master-volume input behavior is preserved',()=>assert.equal(sha(html.match(/\$\('#masterVol'\)\.addEventListener\('input',e=>\{[\s\S]*?\n\}\);/)[0]),'df0832374e6ba33833072fc064500a789fe506b34680f1cf8784447b7a71b9d6'));
test('Exact microphone/record/preview/save handlers are preserved',()=>assert.equal(sha(html.match(/function csOpen\(\)\{[\s\S]*?\$\('#csSaveBtn'\)\.onclick=csSave;/)[0]),'cd373c07e2127c9b6476bd0af02fd42ead98af3d2a4904967a97fa74fef0e48b'));
const card=html.match(/<div id="r1029MicCard"[\s\S]*?<script id="sukun-r1029-mic-notes-preference">/)?.[0];
const notes=html.match(/<details id="r1029MicNotes" open data-hep-acik>([\s\S]*?)<\/details>/)?.[1];
test('Microphone action and explanations share one labelled frame',()=>{assert(card);assert.match(card,/role="group" aria-labelledby="r1029MicActionText"/);assert.match(card,/<span id="r1029MicActionText">Mikrofonla kendin ses ekle<\/span>/);assert(card.indexOf('id="addCustomSoundBtn"')<card.indexOf('<details'));assert(!notes.includes('id="addCustomSoundBtn"'))});
test('Native details/summary remains keyboard-operable with no scripted replacement',()=>{assert(notes);assert.match(notes,/^\s*<summary id="r1029MicNotesSummary" aria-controls="r1029MicNotesBody">Önemli açıklamalar<\/summary>/);assert(!/tabindex="-1"|role="button"|aria-expanded=|onkeydown=/.test(notes));assert(!/keydown|preventDefault|stopPropagation/.test(preference));assert.match(paint,/#r1029MicNotes>summary:focus-visible/);assert.match(paint,/display:block!important;list-style:none!important;min-height:44px!important/)});
test('The two complete existing guidance paragraphs are inside the accordion',()=>{assert.equal((notes.match(/<p class="hint">/g)||[]).length,2);assert(notes.includes('internet ve dosya gerektirmez.'));assert(notes.includes('Bu bir tedavi yöntemi değil'));assert(notes.includes('istediğin an silebilirsin.'));assert(notes.includes('en yakın tamperamanlı yaklaşıklıkla cihazda sentezlenir.'))});
test('Permissions, results, recording and preview controls are not buried',()=>{for(const id of ['customSoundSheet','customSoundClose','csName','csRecBtn','csStat','csPreview','csPlayBtn','csSaveBtn']){assert(html.includes('id="'+id+'"'));assert(!notes.includes('id="'+id+'"'))}});
test('Old microphone label is removed from the action, empty state and dictionaries',()=>{assert(!html.includes('Mikrofonla kendi ses ekle'));assert.match(html,/Aşağıdaki «Mikrofonla kendin ses ekle» düğmesiyle/)});
const iStart=html.indexOf('const I18N = {'),iEnd=html.indexOf('window.I18N=I18N;',iStart)+'window.I18N=I18N;'.length;
const locale={};locale.window=locale;vm.createContext(locale);vm.runInContext(html.slice(iStart,iEnd),locale);
for(const [tr,en] of [['Ses düzeyi','Volume'],['Önemli açıklamalar','Important information'],['Mikrofonla kendin ses ekle','Add your own sound with the microphone']])test('TR/EN/TR round trip: '+tr,()=>{locale.I18N.lang='tr';assert.equal(locale.I18N.t(tr),tr);locale.I18N.lang='en';assert.equal(locale.I18N.t(tr),en);locale.I18N.lang='tr';assert.equal(locale.I18N.t(tr),tr)});
const closer=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('r544 — AÇILIŞTA BÜTÜN AKORDİYONLAR KAPALI'))?.[1];
const detailsAttrs=html.match(/<details ([^>]*id="r1029MicNotes"[^>]*)>/)[1];
const key='sukun.ui.micNotesOpen.r1029';
function fixture(store=new Map(),options={}){
 const writes=[],listeners=new Map(),domListeners=new Map(),timers=[],details={open:true,addEventListener(type,fn){listeners.set(type,fn)},closest(){return null},hasAttribute(name){return !options.unprotected&&name==='data-hep-acik'&&detailsAttrs.includes('data-hep-acik')}};
 const c={document:{readyState:'loading',getElementById:id=>options.missing?null:id==='r1029MicNotes'?details:null,querySelectorAll(selector){assert.equal(selector,'details[open]');return details.open?[details]:[]},addEventListener(type,fn){domListeners.set(type,fn)}},setTimeout(fn,delay){assert.equal(delay,1200);timers.push(fn)},localStorage:{getItem(k){assert.equal(k,key);if(options.readThrows)throw Error('denied');return store.get(k)??null},setItem(k,v){assert.equal(k,key);writes.push([k,v]);if(options.writeThrows)throw Error('denied');store.set(k,v)}}};
 for(const name of ['indexedDB','caches','fetch','MediaRecorder','navigator','CAMB_DB'])Object.defineProperty(c,name,{get(){throw Error('Unrequested API '+name)}});
 vm.runInNewContext(preference,c);return{store,writes,details,runCloser(){assert(closer);vm.runInNewContext(closer,c)},domReady(){domListeners.get('DOMContentLoaded')?.()},delayed(){for(const fn of timers)fn()},toggle(open){details.open=open;listeners.get('toggle')?.()},fire(){listeners.get('toggle')?.()}};
}
test('Unset preference starts open and does not write during initial toggle',()=>{const f=fixture();assert.equal(f.details.open,true);f.fire();assert.deepEqual(f.writes,[]);assert.equal(f.store.size,0)});
test('Close is remembered across a fresh page fixture',()=>{const f=fixture();f.toggle(false);assert.equal(f.store.get(key),'closed');const refresh=fixture(f.store);assert.equal(refresh.details.open,false);refresh.fire();assert.equal(refresh.writes.length,0)});
test('Reopen is remembered across a second fresh page fixture',()=>{const store=new Map([[key,'closed']]);const f=fixture(store);f.toggle(true);assert.equal(store.get(key),'open');const refresh=fixture(store);assert.equal(refresh.details.open,true);assert.equal(refresh.writes.length,0)});
test('Explicit open is restored without a write',()=>{const f=fixture(new Map([[key,'open']]));assert(f.details.open);f.fire();assert.equal(f.writes.length,0)});
test('Unknown preference conservatively defaults open',()=>{const f=fixture(new Map([[key,'unexpected']]));assert(f.details.open);assert.equal(f.writes.length,0)});
test('Unavailable storage keeps disclosure functional without touching recordings',()=>{const f=fixture(new Map(),{readThrows:true,writeThrows:true});assert(f.details.open);f.toggle(false);assert.equal(f.details.open,false);f.toggle(true);assert.equal(f.details.open,true);assert.equal(f.writes.length,2)});
test('Read-only storage can restore closed and does not block reopening',()=>{const f=fixture(new Map([[key,'closed']]),{writeThrows:true});assert.equal(f.details.open,false);f.toggle(true);assert(f.details.open)});
test('Duplicate toggle notifications do not add writes',()=>{const f=fixture();f.toggle(false);f.fire();f.fire();assert.equal(f.writes.length,1)});
test('Missing component safely performs no preference writes',()=>assert.equal(fixture(new Map(),{missing:true}).writes.length,0));
for(const saved of [null,'open','closed'])test('Actual r544 DOM-ready and 1200ms sweep preserve '+(saved??'unset')+' preference',()=>{const f=fixture(saved===null?new Map():new Map([[key,saved]]));const expected=saved!=='closed';f.runCloser();f.domReady();f.fire();assert.equal(f.details.open,expected);assert.equal(f.writes.length,0);f.delayed();f.fire();assert.equal(f.details.open,expected);assert.equal(f.writes.length,0)});
test('Actual delayed r544 sweep preserves a user reopen before 1200ms',()=>{const f=fixture(new Map([[key,'closed']]));f.runCloser();f.domReady();f.toggle(true);assert.equal(f.writes.length,1);f.delayed();f.fire();assert(f.details.open);assert.equal(f.store.get(key),'open');assert.equal(f.writes.length,1)});
test('Startup exemption does not force a user-closed disclosure open',()=>{const f=fixture();f.runCloser();f.domReady();f.toggle(false);f.delayed();f.fire();assert.equal(f.details.open,false);assert.equal(f.store.get(key),'closed');assert.equal(f.writes.length,1)});
test('Closer regression harness detects the original unprotected startup race',()=>{const f=fixture(new Map(),{unprotected:true});f.runCloser();f.domReady();f.fire();assert.equal(f.details.open,false);assert.equal(f.store.get(key),'closed')});
test('Preference has one narrow key and no recording/storage migration APIs',()=>{assert(preference.includes("const key='"+key+"'"));assert(!/indexedDB|CAMB_DB|\.removeItem\(|\.clear\(|getUserMedia|MediaRecorder|querySelectorAll/.test(preference))});
test('Berhetiyye section frame overrides its actual active owner only',()=>assert.match(layout,/html body\.sukun-zikir-tab:not\(\.sukun-tefekkur-mode\) #r920Practice\[data-mode="berhet"\]:not\(\[hidden\]\)>#r986Sections:not\(\[hidden\]\)\{\s*background:#0c202d99!important;/));
test('Expanded panel paint is mode-scoped inside its owning layout layer',()=>assert.match(layout,/#r920Practice\[data-r938-layout="1"\]\[data-mode="berhet"\] #r938PanelBody:not\(\[hidden\]\)\{background:linear-gradient\(150deg,#08192799,#06152199\)!important\}/));
test('Dense Berhetiyye text cards retain 76–78% local scrims',()=>{for(const bg of ['linear-gradient(145deg,#0b2826c7,#071725c7)','linear-gradient(145deg,#102923c2,#091522c2)','linear-gradient(145deg,#102e2bc7,#0a1d2cc7)'])assert(controls.includes('background:'+bg+'!important'))});
test('Berhetiyye dock has an explicit session-theme gate',()=>assert.match(dock,/html\[data-r933-berhet-dock="1"\] body\.r920-dock #r170Now\.r588-authority:not\(\[hidden\]\)\s*\{[^}]*background:radial-gradient\(ellipse at 20% 0%,#0b2826c7,#08281fc7 40%,#031811cc\)!important/s));
test('New ambience paint requires its active tab and never selects the flow player or Tekke',()=>{assert(paint.includes(':has(#tab-amb:not([hidden])) .masterBar #dock>.dockItem:not(.danger)'));assert(!/#r170Now|#r588|#r920DockVolume|#tk\b|#ns\b|#r717Scene/.test(paint));assert(!/filter:blur|opacity:\s*\.[0-9]/.test(paint))});
test('No full-page blur, fixed geometry or audio intervention in ambience paint',()=>{assert(!/position:fixed|z-index:|animation:/.test(paint));assert(!/backdrop-filter:(?!none)/.test(paint))});
test('Closed ambience accordions have glass gaps and word-local scrims',()=>{assert.match(paint,/#mixer>\.preAcc:not\(\.open\)\{background:#06192329!important\}/);assert.match(paint,/#mixer>\.preAcc:not\(\.open\)>\.preAccHead\{background:#07172524!important\}/);assert.match(paint,/:is\(\.preAccT,\.preAccN,\.preAccChev\)\{\s*background:#071725ad!important/)});
test('Compact accordion header keeps a 44px minimum',()=>assert.match(paint,/#mixer>\.preAcc>\.preAccHead\{\s*min-height:44px!important;padding:8px 10px!important/));
test('Compact info and preview faces retain separate 44px native hit targets',()=>{assert.match(paint,/\.chn :is\(\.chInfo,\.chPrev\)\{[^}]*width:44px!important;min-width:44px!important;max-width:44px!important;[^}]*height:44px!important;min-height:44px!important;max-height:44px!important/);assert(paint.includes('transparent 13px)!important'));assert.match(paint,/:is\(\.chInfo,\.chPrev,button\.sw\):focus-visible/)});
test('Compact switch has 36x20px track inside 44px target and two distinct positions',()=>{assert.match(paint,/\.chn button\.sw\{[^}]*width:44px!important[^}]*height:44px!important/);assert(paint.includes('width:36px!important;height:20px!important'));assert(paint.includes('transform:translateX(0)!important'));assert.match(paint,/button\.sw\.on::after\{transform:translateX\(16px\)!important\}/)});
test('Reduced transparency preference has an opaque local fallback',()=>assert.match(paint,/@media\(prefers-reduced-transparency:reduce\)\{[\s\S]*background:#071725f5!important/));
function rgb(hex){return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255)}
function lum(c){return c.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0)}
function contrast(fg,bg){const a=lum(fg),b=lum(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}
const contrastResults=[];
// Pure white is a conservative backdrop for these lighter foreground colours.
// Do not count text shadows, nested dark cards, or the scene veil as extra help.
for(const [name,fg,stops] of [
 ['Berhetiyye text','c1d8cd',['102e2bc7','0a1d2cc7']],
 ['Berhetiyye setting label','d8d8ce',['102923c2','091522c2']],
 ['Berhetiyye dock label','c9dbc5',['0b2826c7','08281fc7','031811cc']],
 ['Berhetiyye dock grip','ddccaa',['0b2826c7','08281fc7','031811cc']],
 ['Main settings control','f4ead1',['0b2826b8','071725b8']],
 ['Ambience small text','d8e4df',['0b2826c7','071725c7']],
 ['Volume label','f5ecd6',['0a1d2cc7']],
 ['Microphone guidance','d8e4df',['0b2826c7','071725c7']]
])test(name+' exceeds 4.5:1 over a white backdrop',()=>{const ratios=stops.map(h=>{const a=parseInt(h.slice(6),16)/255;return contrast(rgb(fg),rgb(h).map(v=>v*a+1-a))});const min=Math.min(...ratios);contrastResults.push({name,minimumContrast:+min.toFixed(3)});assert(min>=4.5,name+' '+min)});
test('Closed-accordion words exceed 4.5:1 while clear gaps transmit 72% of the scene',()=>{let bg=[1,1,1];for(const h of ['06192329','07172524','071725ad']){const a=parseInt(h.slice(6),16)/255;bg=rgb(h).map((v,i)=>v*a+bg[i]*(1-a))}const ratio=contrast(rgb('f4ead1'),bg);contrastResults.push({name:'Closed accordion words',minimumContrast:+ratio.toFixed(3)});assert(ratio>=4.5);const transmission=(1-41/255)*(1-36/255);assert(transmission>.72)});
const report={total:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,scope:'Production-source, exact unchanged handler checks, actual TR/EN translator, synthetic native-details preference lifecycle and sRGB compositing math. Not live CSSOM, browser keyboard/compositor, physical Android or audio proof.',contrastResults,results};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
