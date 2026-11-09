'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {fixture}=require('../r1056/ui-controls-fixture.cjs');
const root=path.resolve(__dirname,'../..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name)}
for(const mode of ['esma','berhet'])for(const language of ['tr','en'])test(mode+' '+language+' original actions, one toggle and direct restart',()=>{
 const f=fixture(root,{preference:'1',language}),restart=f.add('r920JourneyRestartAll',f.$('nav'),'button');let calls=0;restart.onclick=()=>calls++;const handler=restart.onclick;
 f.reading();f.sync(mode,false);
 assert.equal(f.$('r1213JourneyActionsTitle'),null);assert.equal(f.$('r1196JourneyRestartControls'),null);assert.equal(restart.parentElement,f.$('r1056FinishRow'));assert.equal(restart.nextElementSibling,f.$('r932EasyStop'));assert.equal(restart.onclick,handler);
 const nodes=['r932EasyPlay','r932EasyStop','r932EasyMinus','r932EasyPlus'].map(id=>f.$(id));
 for(const tef of [true,false,true,false]){f.sync(mode,tef);f.window.SukunBerhetLayout.setFocusControls(false);assert.equal(f.$('r1056FinishRow').hidden,true);f.window.SukunBerhetLayout.setFocusControls(true);assert.equal(f.$('r1056FinishRow').hidden,false);assert.deepEqual(nodes,nodes.map(n=>f.$(n.id)));assert.equal(restart.onclick,handler)}
 restart.click();assert.equal(calls,1);assert.equal(f.commands.length,0);assert.match(restart.getAttribute('aria-label'),mode==='berhet'?/Berhetiyye/:/Esmâ|Esma/);assert.match(restart.getAttribute('data-tip'),mode==='berhet'?/28/:/99/);
 for(const id of ['r932EasyPlay','r932EasyStop','r920JourneyRestartAll','r1056FocusControlsToggle'])assert(f.$(id).getAttribute('data-tip'));
 restart.focus();f.window.SukunBerhetLayout.setFocusControls(false);assert.equal(f.document.activeElement,f.$('r1056FocusControlsToggle'));
 f.root.hidden=true;f.window.SukunBerhetLayout.sync(f.root,false);assert.equal(restart.parentElement,f.$('nav'));assert.equal(restart.onclick,handler);
});
test('state-specific help follows the current transport without another owner',()=>{const f=fixture(root,{preference:'1'});for(const phase of ['IDLE','PLAYING','PREPARING','PAUSED','ERROR']){f.state.phase=phase;f.sync('berhet');const tip=f.$('r932EasyPlay').getAttribute('data-tip');assert.match(tip,phase==='PLAYING'||phase==='PREPARING'?/duraklatır/:phase==='PAUSED'?/kaldığın yerden/:phase==='ERROR'?/yeniden dener/:/başa almaz/)}assert.equal(f.commands.length,0)});
test('native reset confirmation and original transport source remain untouched',()=>{const s=read('assets/runtime/interface-r920.js');assert.match(s,/if\(!window.confirm\(question\)\)return/);assert.match(s,/command\('restart-journey'/);assert.match(read('assets/runtime/berhet-layout-r938.js'),/window\.dockTipBagla\?\.\(node\)/);assert(!read('assets/runtime/berhet-layout-r938.js').includes('Seyir işlemleri'))});
test('terminal and non-reading smart steps have accurate localized help without commanding owners',()=>{
 for(const language of ['tr','en']){const f=fixture(root,{preference:'1',language});f.add('r920Restart',f.$('nav'),'button');f.state.phase='COMPLETED';f.state.smartSession={terminal:true,reading:true,stepType:'zikir'};f.sync('esma');
  assert.equal(f.$('r932EasyPlay').textContent,language==='en'?'Restart session':'Seansı yeniden başlat');assert.equal(f.$('r932EasyPlay').getAttribute('aria-label'),language==='en'?'Restart session':'Seansı yeniden başlat');
  assert.match(f.$('r932EasyPlay').getAttribute('data-tip'),language==='en'?/first step/:/ilk adımından/);assert.match(f.$('r920Restart').getAttribute('data-tip'),language==='en'?/first step/:/ilk adımından/);assert.match(f.$('r932EasyStop').getAttribute('data-tip'),language==='en'?/Close the session result/:/Seans sonucunu kapatır/);assert.equal(f.$('r932EasyStop').getAttribute('aria-label'),language==='en'?'Close session result':'Seans sonucunu kapat');
  for(const stepType of ['silence','frequency'])for(const phase of ['IDLE','PLAYING','PAUSED','ERROR']){f.state.smartSession={terminal:false,reading:false,stepType};f.state.phase=phase;f.sync('esma');const help=f.$('r932EasyPlay').getAttribute('data-tip');assert.match(help,language==='en'?/session step/:/Seansın geçerli adımını/);assert(!/count|sayım|sayım|zikri/.test(help));assert.match(f.$('r932EasyPlay').getAttribute('aria-label'),language==='en'?/session/:/Seans/);assert.match(f.$('r920Restart').getAttribute('data-tip'),language==='en'?/current session step/:/geçerli adımını/);}
  f.state.smartSession=null;f.state.phase='IDLE';f.sync('esma');assert.equal(f.$('r932EasyPlay').textContent,language==='en'?'Start':'Başlat');assert.equal(f.$('r932EasyPlay').getAttribute('aria-label'),language==='en'?'Start dhikr':'Zikri başlat');assert.equal(f.commands.length,0);
 }
 const session=read('assets/runtime/session-r919.js');assert.match(session,/if\(pendingSmart\|\|before.smartSession\?\.terminal\)return pc\?\.play\?\.\('smart-session'\)/);assert.match(session,/if\(action==='restart'&&before.smartSession\?\.terminal\)return route\('play',before,reject\)/);
});
test('the native unified owner retains the exact bilingual finish icon and label',()=>{
 const html=read('nero.html'),unified=html.match(/<script id="r390-unified-playback">([\s\S]*?)<\/script>/)?.[1];assert(unified,'Native unified playback owner missing');
 const f=fixture(root,{preference:'1'}),stop=f.$('r932EasyStop');
 f.document.querySelectorAll=selector=>selector==='[data-action="stop"]'?[stop]:[];f.document.addEventListener=()=>{};f.document.readyState='loading';f.context.navigator={};f.context.setTimeout=()=>{};
 vm.runInContext(unified,f.context);f.window.SukunUnifiedPlayback.sync();f.sync('berhet');
 assert.equal(stop.textContent,'■ Bitir');assert.equal(stop.getAttribute('aria-label'),'Zikri bitir');assert.equal(stop.dataset.sukunAction,'finish');assert.equal(f.commands.length,0);
 const start=html.indexOf('const I18N = {'),end=html.indexOf('window.I18N=I18N;',start)+'window.I18N=I18N;'.length;assert(start>=0&&end>start);
 const locale={};locale.window=locale;vm.createContext(locale);vm.runInContext(html.slice(start,end),locale);
 for(const [lang,expected]of [['tr','■ Bitir'],['en','■ End']]){locale.I18N.lang=lang;assert.equal(locale.I18N.t(stop.textContent),expected)}
 const browser=read('tests/seyir-controls/browser.cjs');assert.match(browser,/id:'r932EasyStop',label:lang==='en'\?'■ End':'■ Bitir'/);
});
test('native media count excludes only the real silent identities, never markers or user recordings',()=>{
 const html=read('nero.html'),browser=read('tests/seyir-controls/browser.cjs');
 const slice=(start,end)=>{const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert(a>=0&&b>a);return html.slice(a,b)};
 const anchor=slice('const SesCapa=window.SesCapa=','function makeIR(dur,decay){'),carriers=slice('function r476SilentWav(){','function r476Prime(){');
 const predicates=browser.split('\n').filter(line=>line.trim().startsWith('const certifiedSilent=')||line.trim().startsWith('const countedMedia='));assert.equal(predicates.length,2);assert.match(browser,/const audio=allAudio\.filter\(countedMedia\)/);
 const literal=anchor.match(/const silentAnchorSource='([^']+)'/)[1],pcm=Buffer.from(literal.split(',')[1],'base64');
 assert.equal(require('node:crypto').createHash('sha256').update(literal).digest('hex'),'109257adda3ec247f7f998f413f6ce1c957fb0924349e6c4bbbef5076a72e0df');
 assert.equal(pcm.toString('ascii',0,4),'RIFF');assert.equal(pcm.toString('ascii',8,12),'WAVE');assert.equal(pcm.readUInt16LE(20),1);assert.equal(pcm.readUInt16LE(22),1);assert.equal(pcm.readUInt32LE(24),8000);assert.equal(pcm.readUInt16LE(34),8);assert.equal(pcm.readUInt32LE(40),1600);assert.equal(pcm.length,1644);assert(pcm.subarray(44).every(x=>x===128));
 const media=[],element=()=>({dataset:{},style:{},src:'',currentSrc:'',srcObject:null,paused:true,ended:false,readyState:4,networkState:1,volume:1,muted:false,setAttribute(){},addEventListener(){},play(){this.currentSrc=this.src;this.paused=false;return Promise.resolve()},pause(){this.paused=true}});
 const c={window:{},navigator:{},Blob,ArrayBuffer,DataView,URL:{createObjectURL:()=> 'blob:https://sukun.test/exact-lock-zero'},document:{createElement:()=>element(),body:{appendChild:a=>media.push(a)}}};vm.createContext(c);
 vm.runInContext('let _r476LockAudio=null,_r476SilentUrl="";'+anchor+carriers+predicates.join('\n')+';window.testCount=countedMedia;window.SesCapa.ensure();r476Audio().play();',c);
 const count=items=>items.filter(c.window.testCount).length;assert.equal(media.length,2);assert.equal(count(media),0);
 const recording=element();recording.src=recording.currentSrc='blob:https://sukun.test/generated-personal-recording';recording.paused=false;recording._sukunRecordingKey='berhet:0';
 assert.equal(count([...media,recording]),1,'One real recording alongside both exact zero carriers');
 for(const marker of ['sukSilentAnchor','sukSilentCarrier'])for(const volume of [1,0]){const copy={...recording,dataset:{[marker]:'1'},volume,muted:volume===0};assert.equal(count([...media,copy]),1,'A marker, muted state or zero volume cannot certify a user recording')}
 for(const original of media){
  const clone={...original,dataset:{...original.dataset}};assert.equal(count([...media,clone]),1,'Even identical bytes and flags on a foreign element are counted');
  const saved={src:original.src,currentSrc:original.currentSrc,srcObject:original.srcObject,dataset:{...original.dataset}};
  for(const mutate of [a=>a.src=a.currentSrc=recording.src,a=>a.currentSrc=recording.src,a=>a.srcObject={},a=>a.dataset={},a=>{for(const k of Object.keys(a.dataset))a.dataset[k]=true}]){mutate(original);assert.equal(count(media),1,'Changed real carrier loses its certificate');Object.assign(original,{...saved,dataset:{...saved.dataset}})}
 }
 const api=c.window.SukunSilentCarrierIdentity;
 for(const invalid of [undefined,{isSilent(){throw Error('unavailable')}},{isSilent:()=>1}]){c.window.SukunSilentCarrierIdentity=invalid;assert.equal(count([...media,recording]),3,'Unknown or non-boolean certification fails closed')}
 c.window.SukunSilentCarrierIdentity=api;assert.equal(count([...media,recording]),1);
 recording.paused=true;assert.equal(count([...media,recording]),0);recording.paused=false;recording.ended=true;assert.equal(count([...media,recording]),0);
});
test('native evidence rejects missing cases, hashes, browser errors and changed files',()=>{
 const {expectedChecks,expectedNames,sourcePaths,testPaths,complete}=require('./evidence.cjs');assert.equal(expectedChecks,31);assert.equal(expectedNames.length,31);
 const digest='a'.repeat(64),sources=Object.fromEntries(sourcePaths.map(n=>[n,digest])),testSources=Object.fromEntries(testPaths.map(n=>[n,digest]));
 const served=Object.fromEntries([...sourcePaths,'tests/tefekkur-help/managed-preview.html'].map(n=>[n,{sha256:digest}]));
 const valid={expectedChecks,passed:31,total:31,browserExecuted:true,sourceUnchanged:true,testUnchanged:true,servedHashesValid:true,sources,testSources,results:expectedNames.map(name=>({name,passed:true})),browserEvidence:[{pageErrors:[],consoleErrors:[],served}]};
 assert.equal(complete(valid),true);
 const mutate=[r=>r.results.pop(),r=>r.results[1].name=r.results[0].name,r=>r.results[0].name='unexpected case',r=>r.results[0].passed=false,r=>r.results[0]=null,r=>r.total=28,r=>r.passed=28,r=>r.expectedChecks=20,r=>r.browserExecuted=false,r=>r.sourceUnchanged=false,r=>r.testUnchanged=false,r=>r.servedHashesValid=false,r=>r.fatal='fixture failed',r=>delete r.testSources,r=>delete r.testSources[testPaths[0]],r=>r.testSources[testPaths[0]]='invalid',r=>delete r.sources[sourcePaths[0]],r=>r.browserEvidence=[],r=>r.browserEvidence[0]=null,r=>r.browserEvidence[0].pageErrors.push('Uncaught error'),r=>r.browserEvidence[0].consoleErrors.push('Failed to find a valid digest in integrity attribute'),r=>r.browserEvidence[0].consoleErrors.push('TypeError: broken handler'),r=>delete r.browserEvidence[0].served['nero.html'],r=>r.browserEvidence[0].served['nero.html'].sha256='b'.repeat(64)];
 for(const change of mutate){const r=JSON.parse(JSON.stringify(valid));change(r);assert.equal(complete(r),false,String(change));}assert.equal(complete(null),false);
});
console.log(JSON.stringify({passed,total:10,scope:'Current production layout, original quick delegates, controlled endpoints and fail-closed native evidence contract. No native browser execution implied.'}));
