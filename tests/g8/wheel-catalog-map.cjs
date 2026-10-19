'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {mapWheelCatalog}=require('../../tools/wheel-catalog-map.cjs');
const results=[],production=fs.readFileSync(path.resolve(__dirname,'../../assets/runtime/wheels-r924.js'),'utf8');
function test(name,work){try{work();results.push({name,passed:true})}catch(error){results.push({name,passed:false,error:error.stack})}}
const builders=[
 "const premium=(mode,id,title)=>Object.freeze({mode,id,title,src:`./assets/wheels-r924/${mode==='berhet'?'berhetiyye':'esma'}/${id}.webp`,classic:false,matte:false,geometry:measuredGeometry[id]||baseGeometry});",
 'const classic=(mode,id,title,src,matte=false)=>Object.freeze({mode,id,title,src,classic:true,matte,geometry:measuredGeometry[id]||baseGeometry});',
 'const nativeWheel=(mode,id,title)=>Object.freeze({mode,id,title,src:`./assets/wheels-r977/${id}.webp`,classic:false,matte:false,nativeNavigation:true,darkNavigation:id==="sultan-taslari",darkInk:darkInk.has(id),geometry:measuredGeometry[id]});',
 'const wovenWheel=(mode,[id,title,titleEn,material,safeCenterPercent])=>Object.freeze({mode,id,title,titleEn,material,safeCenterPercent,src:`./assets/wheels/${id}-r1057.webp`,classic:false,matte:false,woven:true,geometry:baseGeometry});'
];
function fixture(options={}){
 const native=options.nativeRows||JSON.stringify([['native-one','Yerli']]),woven=options.wovenRows||JSON.stringify([['woven-one','Örgü','Weave','copper',32]]);
 const berhet=options.berhetRows||JSON.stringify([['premium-one','Birinci']]),esma=options.esmaRows||JSON.stringify([['premium-two','İkinci']]);
 const classicPath=JSON.stringify(options.classicPath||'./assets/old/one.svg');
 const catalog="const catalog=Object.freeze({\n berhet:Object.freeze("+berhet+".map(([id,title])=>premium('berhet',id,title)).concat([classic('berhet','classic-one','Eski',"+classicPath+")]).concat(newWheels.map(([id,title])=>nativeWheel('berhet',id,title))).concat(wovenWheels.map(row=>wovenWheel('berhet',row)))),\n esma:Object.freeze("+esma+".map(([id,title])=>premium('esma',id,title)).concat([classic('esma','classic-two','Diğer','./assets/old/two.png',true)]).concat(newWheels.map(([id,title])=>nativeWheel('esma',id,title))).concat(wovenWheels.map(row=>wovenWheel('esma',row))))\n});";
 return "(()=>{'use strict';\n"+builders.join('\n')+'\nconst newWheels=Object.freeze('+native+');\nconst wovenWheels=Object.freeze('+woven+'.map(row=>Object.freeze(row)));\n'+catalog+'\n})();';
}
function blocked(report){assert.equal(report.coverage.staticVerified,false);assert.equal(report.coverage.complete,false);assert(report.errors.length||report.unresolved.length)}

test('Current production is 54 scoped wheel candidates and 37 unique asset paths',()=>{
 const report=mapWheelCatalog(production);assert.equal(report.coverage.staticVerified,true);assert.equal(report.coverage.complete,true);assert.deepEqual(report.errors,[]);assert.deepEqual(report.unresolved,[]);assert.equal(report.aliases.length,54);assert.equal(report.coverage.uniqueTargets,37);
 assert.deepEqual(report.coverage.countsByBuilder,{premium:16,classic:4,nativeWheel:16,wovenWheel:18});assert.deepEqual(report.coverage.countsByFamily,{berhet:31,esma:23});
 const byAlias=new Map(report.aliases.map(row=>[row.alias,row]));
 assert.equal(byAlias.get('wheel:berhet:ham-kristal').target,'assets/wheels-r924/berhetiyye/ham-kristal.webp');assert.equal(byAlias.get('wheel:esma:inci-sema').target,'assets/wheels-r924/esma/inci-sema.webp');assert.equal(byAlias.get('wheel:berhet:crystal').target,'assets/berhetiyye-premium/wheel-alpha-r915.png');assert.equal(byAlias.get('wheel:esma:classic').target,'assets/sukun-nur-ring-r757.png');
 for(const id of ['ceviz-naksi','zeytin-tesbihi','abanoz-sukunu','sandal-halkasi','altin-nakis','elmas-taci','gumus-telkari','sultan-taslari'])for(const family of ['berhet','esma'])assert.equal(byAlias.get('wheel:'+family+':'+id).target,'assets/wheels-r977/'+id+'.webp');
 for(const id of ['copper-amethyst-weave','gold-amethyst-weave','platinum-turquoise-spiral','copper-amber-spiral','copper-ruby-weave','gold-ruby-weave','gold-emerald-weave','gold-emerald-knot','sapphire-torus'])for(const family of ['berhet','esma'])assert.equal(byAlias.get('wheel:'+family+':'+id).target,'assets/wheels/'+id+'-r1057.webp');
 assert.equal(new Set(report.aliases.map(row=>row.alias)).size,54);assert(report.aliases.every(row=>row.family&&row.builder&&row.basis.includes('static table-derived candidate')));assert.match(report.coverage.meaning,/no JavaScript execution/);
});
test('Resolved template metadata identifies exact source offsets without claiming unrelated templates',()=>{
 const report=mapWheelCatalog(production),templates=report.coverage.resolvedTemplates;assert.equal(templates.length,3);
 assert.deepEqual(templates.map(row=>row.builder).sort(),['nativeWheel','premium','wovenWheel']);
 for(const row of templates){assert(production.split('\n')[row.line-1].includes('`'+row.expression+'`'));assert.equal(production.slice(row.offset,row.offset+row.expression.length+2),'`'+row.expression+'`');}
 const source=fixture()+"\nconst other=`./assets/wheels-r977/${id}.webp`;",r=mapWheelCatalog(source);assert.equal(r.coverage.resolvedTemplates.length,3);assert(r.coverage.resolvedTemplates.every(row=>row.line<source.split('\n').length));
});
test('Standalone literal tables produce exact synthetic targets and preserve distinct family paths',()=>{
 const r=mapWheelCatalog(fixture());assert.equal(r.coverage.staticVerified,true);assert.equal(r.aliases.length,8);assert.equal(r.coverage.uniqueTargets,6);
 assert.deepEqual(r.aliases.map(row=>[row.alias,row.target]),[
  ['wheel:berhet:classic-one','assets/old/one.svg'],['wheel:berhet:native-one','assets/wheels-r977/native-one.webp'],['wheel:berhet:premium-one','assets/wheels-r924/berhetiyye/premium-one.webp'],['wheel:berhet:woven-one','assets/wheels/woven-one-r1057.webp'],
  ['wheel:esma:classic-two','assets/old/two.png'],['wheel:esma:native-one','assets/wheels-r977/native-one.webp'],['wheel:esma:premium-two','assets/wheels-r924/esma/premium-two.webp'],['wheel:esma:woven-one','assets/wheels/woven-one-r1057.webp']
 ]);
 const shared=mapWheelCatalog(fixture({esmaRows:'[["premium-one","Ortak kimlik"]]'}));assert.equal(shared.coverage.staticVerified,true);assert.equal(shared.coverage.uniqueTargets,6);assert.notEqual(shared.aliases.find(row=>row.alias==='wheel:berhet:premium-one').target,shared.aliases.find(row=>row.alias==='wheel:esma:premium-one').target);
});
test('Whitespace, comments, quote styles, Unicode titles, escapes and literal trailing commas are supported',()=>{
 const source=fixture({nativeRows:String.raw`[['native-one','Türkçe \'Özel\' \u0130sim',],]`,wovenRows:'[["woven-one","Örgü","Weave","gold",32,],]'}).replace('const catalog=Object.freeze','const /* catalog binding */ catalog = Object . freeze');
 const r=mapWheelCatalog(source);assert.equal(r.coverage.staticVerified,true,JSON.stringify(r));assert.equal(r.aliases.length,8);
});
test('Each altered builder remains unresolved and emits no aliases from that builder',()=>{
 const mutations=[['premium','./assets/wheels-r924/','./assets/unknown/'],['classic','src,classic:true','src:change(src),classic:true'],['nativeWheel','./assets/wheels-r977/','./assets/unknown/'],['wovenWheel','./assets/wheels/${id}-r1057.webp','./assets/unknown/${id}.webp']];
 for(const [builder,before,after]of mutations){const r=mapWheelCatalog(fixture().replace(before,after));blocked(r);assert.equal(r.errors.length,0);assert(r.unresolved.some(row=>row.code==='WHEEL_BUILDER_SHAPE_UNSUPPORTED'&&row.builder===builder));assert(!r.aliases.some(row=>row.builder===builder));assert(!r.coverage.resolvedTemplates.some(row=>row.builder===builder));assert.equal(r.aliases.length,6)}
});
test('Altered mode, chain, mapped arguments and extra catalog operations fail closed',()=>{
 for(const [before,after]of [
  ["premium('berhet',id,title)","premium('esma',id,title)"],
  ["nativeWheel('esma',id,title)","nativeWheel('esma',title,id)"],
  ["wovenWheels.map(row=>wovenWheel('esma',row))","unrelated.map(row=>wovenWheel('esma',row))"],
  [".concat(newWheels.map(([id,title])=>nativeWheel('berhet',id,title)))",".concat(newWheels.map(([id,title])=>nativeWheel('berhet',id,title))).filter(Boolean)"],
  ["classic('berhet','classic-one'","classic('esma','classic-one'"]
 ]){const r=mapWheelCatalog(fixture().replace(before,after));blocked(r);assert.equal(r.aliases.length,0);assert.equal(r.coverage.resolvedTemplates.length,0)}
});
test('Unsupported literal table wrappers remain explicit and cannot borrow unrelated tables',()=>{
 for(const [before,after,builder]of [
  ['const newWheels=Object.freeze(','const newWheels=Object.seal(','nativeWheel'],
  ['.map(row=>Object.freeze(row))','.map(row=>different(row))','wovenWheel']
 ]){const r=mapWheelCatalog(fixture().replace(before,after)+'\nconst unrelated=Object.freeze([["extra","Other"]]);');blocked(r);assert.equal(r.errors.length,0);assert(r.unresolved.some(row=>row.code==='WHEEL_TABLE_SHAPE_UNSUPPORTED'));assert(!r.aliases.some(row=>row.builder===builder));assert.equal(r.aliases.length,6)}
});
test('Computed rows and computed metadata remain unresolved and never execute expressions',()=>{
 const flag='__SUKUN_WHEEL_EXTRACTOR_MUST_NOT_RUN';delete globalThis[flag];
 const rows='[["native-one",(()=>{globalThis.'+flag+'=true;throw Error("MUST NOT EXECUTE")})()]]';
 const r=mapWheelCatalog(fixture({nativeRows:rows}));blocked(r);assert.equal(r.errors.length,0);assert(r.unresolved.some(row=>row.code==='WHEEL_TABLE_SHAPE_UNSUPPORTED'));assert.equal(globalThis[flag],undefined);assert(!r.aliases.some(row=>row.builder==='nativeWheel'));
 const woven=mapWheelCatalog(fixture({wovenRows:'[["woven-one","Örgü","Weave","gold",computeRadius()]]'}));blocked(woven);assert.equal(woven.errors.length,0);assert(!woven.aliases.some(row=>row.builder==='wovenWheel'));
});
test('Unsafe, escaped, encoded and malformed IDs are blocking errors with no successful partial aliases',()=>{
 for(const id of ['../escape','./escape','bad/name','bad\\name','%2e%2e','bad id','A_unsafe','','bad\0id','__proto__']){
  const r=mapWheelCatalog(fixture({nativeRows:JSON.stringify([[id,'Title']])}));blocked(r);assert(r.errors.some(row=>row.code==='WHEEL_UNSAFE_ID'),id);assert.equal(r.aliases.length,0);assert.equal(r.coverage.resolvedTemplates.length,0);
 }
 const escaped=mapWheelCatalog(fixture({nativeRows:String.raw`[["\u002e\u002e/escape","Title"]]`}));assert(escaped.errors.some(row=>row.code==='WHEEL_UNSAFE_ID'));assert.equal(escaped.aliases.length,0);
 for(const value of ['123','false','null']){const r=mapWheelCatalog(fixture({nativeRows:'[['+value+',"Title"]]'}));assert(r.errors.length);assert.equal(r.aliases.length,0)}
});
test('Unsafe literal classic paths are rejected before mapping',()=>{
 for(const classicPath of ['./assets/../outside.png','../outside.svg','./assets/foo%2fbar.png','https://elsewhere/x.webp','//other/x.png','/absolute/x.png','./assets/unsafe\\x.png','./assets/x.svg?query','./assets//double.png']){
  const r=mapWheelCatalog(fixture({classicPath}));blocked(r);assert(r.errors.some(row=>row.code==='WHEEL_UNSAFE_PATH'),classicPath);assert.equal(r.aliases.length,0);
 }
});
test('Duplicate rows and IDs shared across builders are blocking errors',()=>{
 const duplicate=mapWheelCatalog(fixture({nativeRows:'[["native-one","One"],["native-one","Two"]]'}));assert(duplicate.errors.some(row=>row.code==='WHEEL_DUPLICATE_ID'));assert.equal(duplicate.aliases.length,0);
 const cross=mapWheelCatalog(fixture({wovenRows:'[["native-one","Örgü","Weave","gold",32]]'}));assert(cross.errors.some(row=>row.code==='WHEEL_DUPLICATE_ALIAS'&&row.alias==='wheel:berhet:native-one'));assert(cross.errors.some(row=>row.code==='WHEEL_DUPLICATE_ALIAS'&&row.alias==='wheel:esma:native-one'));assert.equal(cross.aliases.length,0);
 const crossClassic=mapWheelCatalog(fixture({berhetRows:'[["classic-one","Conflicting"]]'}));assert(crossClassic.errors.some(row=>row.code==='WHEEL_DUPLICATE_ALIAS'));assert.equal(crossClassic.aliases.length,0);
 const unknownBuilder=mapWheelCatalog(fixture({wovenRows:'[["native-one","Örgü","Weave","gold",32]]'}).replace('./assets/wheels/${id}-r1057.webp','./unknown/${id}.webp'));assert(unknownBuilder.errors.some(row=>row.code==='WHEEL_DUPLICATE_ALIAS'));assert.equal(unknownBuilder.aliases.length,0);
});
test('Malformed woven values and titles are blocking errors',()=>{
 for(const row of [['woven-one','Title','English','invalid',32],['woven-one','Title','English','gold',0],['woven-one','Title','English','gold',101],['woven-one','','English','gold',32],['woven-one','Title','','gold',32]]){
  const r=mapWheelCatalog(fixture({wovenRows:JSON.stringify([row])}));blocked(r);assert(r.errors.length);assert.equal(r.aliases.length,0);
 }
});
test('Unrelated calls, tables, regexes, strings, comments and shadowed bindings add no aliases',()=>{
 const original=mapWheelCatalog(fixture()),extra=[
  "classic('esma','unrelated-call','Should not count','./assets/elsewhere.png');",
  'const unrelated=Object.freeze([["not-a-wheel","Text"]]);',
  'const unrelatedRegex=/const catalog=Object.freeze({fake:[]})/;',
  'const quoted="const newWheels=Object.freeze([[\'extra\',\'Fake\']]);";',
  '/* '+builders.join('\n')+' const catalog=Object.freeze({}); */',
  'function otherScope(){const newWheels=Object.freeze([["shadow-id","Shadow"]]);const premium=unknown;}'
 ].join('\n');
 const r=mapWheelCatalog(fixture().replace("(()=>{'use strict';","(()=>{'use strict';\n"+extra));assert.equal(r.coverage.staticVerified,true);assert.deepEqual(r.aliases,original.aliases);
});
test('Missing, duplicate and shadow-only builders stay unresolved',()=>{
 for(const source of [fixture().replace(builders[0],''),fixture().replace(builders[0],builders[0]+'\n'+builders[0]),fixture().replace(builders[0],'function unrelatedScope(){'+builders[0]+'}')]){
  const r=mapWheelCatalog(source);blocked(r);assert(r.unresolved.some(row=>row.declaration==='premium'));assert(!r.aliases.some(row=>row.builder==='premium'));
 }
 const missingCatalog=mapWheelCatalog(builders.join('\n'));blocked(missingCatalog);assert.equal(missingCatalog.aliases.length,0);
});
test('Application statements and malicious strings are never evaluated or imported',()=>{
 const flag='__SUKUN_WHEEL_SOURCE_EXECUTED';delete globalThis[flag];
 const dangerous='globalThis.'+flag+'=true;throw new Error("MUST NOT EXECUTE");require("missing-production-module");';
 const r=mapWheelCatalog(fixture().replace("(()=>{'use strict';","(()=>{'use strict';\n"+dangerous));assert.equal(r.coverage.staticVerified,true);assert.equal(r.aliases.length,8);assert.equal(globalThis[flag],undefined);
 const id='x\');globalThis.'+flag+'=true;//',injected=mapWheelCatalog(fixture({nativeRows:JSON.stringify([[id,'Malicious text']])}));assert(injected.errors.length);assert.equal(globalThis[flag],undefined);
});
test('Limits and invalid source shapes fail closed without executing source',()=>{
 for(const source of [null,{},'x'.repeat(1024*1024+1)]){const r=mapWheelCatalog(source);blocked(r);assert(r.errors.length);assert.equal(r.aliases.length,0)}
 const rows=Array.from({length:1025},(_,i)=>['native-'+i,'Title']),tooMany=mapWheelCatalog(fixture({nativeRows:JSON.stringify(rows)}));assert(tooMany.errors.length);assert.equal(tooMany.aliases.length,0);
 for(const source of [fixture()+'\n"unclosed',fixture()+'\n/* unclosed',fixture()+'\nconst template=`unclosed',fixture()+'\n'+'('.repeat(129)]){const r=mapWheelCatalog(source);blocked(r);assert(r.unresolved.some(row=>row.code==='WHEEL_LEXICAL_SHAPE_UNSUPPORTED'));assert.equal(r.aliases.length,0)}
});
test('Repeated extraction is byte-for-byte deterministic and preserves the supplied source',()=>{
 const before=production,first=JSON.stringify(mapWheelCatalog(production));for(let i=0;i<3;i++)assert.equal(JSON.stringify(mapWheelCatalog(production)),first);assert.equal(production,before);assert.deepEqual(JSON.parse(first).aliases,[...JSON.parse(first).aliases].sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:JSON.stringify(a)>JSON.stringify(b)?1:0));
});

console.log(JSON.stringify({suite:'G8 bounded static wheel catalog map',method:'Data-only lexical/source-shape fixtures. Production JavaScript is never executed by this helper or suite.',passed:results.filter(row=>row.passed).length,total:results.length,results},null,2));
if(results.some(row=>!row.passed))process.exitCode=1;
