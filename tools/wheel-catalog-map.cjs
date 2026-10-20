'use strict';
// Recognize only this wheel module's reviewed builders and catalog expressions.
// This is a table-derived candidate inventory, never JavaScript execution or a
// proof that the module runs, that a choice is reachable, or that an asset loads.
const SOURCE='assets/runtime/wheels-r924.js';
const LIMIT={bytes:1024*1024,tokens:100000,depth:128,rows:1024};
const FAMILIES=['berhet','esma'];
const BUILDERS={
 premium:"(mode,id,title)=>Object.freeze({mode,id,title,src:`./assets/wheels-r924/${mode==='berhet'?'berhetiyye':'esma'}/${id}.webp`,classic:false,matte:false,geometry:measuredGeometry[id]||baseGeometry})",
 classic:'(mode,id,title,src,matte=false)=>Object.freeze({mode,id,title,src,classic:true,matte,geometry:measuredGeometry[id]||baseGeometry})',
 nativeWheel:'(mode,id,title)=>Object.freeze({mode,id,title,src:`./assets/wheels-r977/${id}.webp`,classic:false,matte:false,nativeNavigation:true,darkNavigation:id==="sultan-taslari",darkInk:darkInk.has(id),geometry:measuredGeometry[id]})',
 wovenWheel:'(mode,[id,title,titleEn,material,safeCenterPercent])=>Object.freeze({mode,id,title,titleEn,material,safeCenterPercent,src:`./assets/wheels/${id}-r1057.webp`,classic:false,matte:false,woven:true,geometry:baseGeometry})'
};
const compare=(a,b)=>a<b?-1:a>b?1:0;
const ordered=rows=>rows.sort((a,b)=>compare(JSON.stringify(a),JSON.stringify(b)));
class Unsupported extends Error{}
class Invalid extends Error{constructor(message,code='WHEEL_INVALID_LITERAL'){super(message);this.code=code}}

// A small lexical scanner keeps comments, quoted text, templates and regexes
// opaque. It is not a JavaScript parser. No token can run application code.
function tokenize(source){
 const tokens=[];let i=0;
 const fail=message=>{throw new Unsupported(message)};
 function quoted(start){
  const quote=source[i++];let value='';
  while(i<source.length){
   let c=source[i++];if(c===quote)return {kind:'string',value,start};
   if(c==='\n'||c==='\r')fail('Newline in a quoted literal');
   if(c!=='\\'){value+=c;continue}
   c=source[i++];if(c===undefined)fail('Unclosed string escape');
   const simple={n:'\n',r:'\r',t:'\t',b:'\b',f:'\f',v:'\v'};
   if(Object.hasOwn(simple,c)){value+=simple[c];continue}
   if(c==='\n')continue;
   if(c==='\r'){if(source[i]==='\n')i++;continue}
   if(c==='0'){if(/[0-9]/.test(source[i]||''))fail('Legacy octal escapes are unsupported');value+='\0';continue}
   if(/[1-9]/.test(c))fail('Legacy numeric escapes are unsupported');
   if(c==='x'||c==='u'){
    const length=c==='x'?2:4;let hex;
    if(c==='u'&&source[i]==='{'){
     const end=source.indexOf('}',++i);if(end<0)fail('Unclosed Unicode escape');
     hex=source.slice(i,end);if(!/^[\da-f]{1,6}$/i.test(hex)||parseInt(hex,16)>0x10ffff)fail('Invalid Unicode escape');i=end+1;
    }else{hex=source.slice(i,i+length);if(!new RegExp('^[\\da-f]{'+length+'}$','i').test(hex))fail('Invalid hexadecimal escape');i+=length}
    value+=String.fromCodePoint(parseInt(hex,16));continue;
   }
   value+=c;
  }
  fail('Unclosed quoted literal');
 }
 function comment(){
  if(source[i+1]==='/'){i+=2;while(i<source.length&&!/[\n\r]/.test(source[i]))i++;return true}
  if(source[i+1]==='*'){const end=source.indexOf('*/',i+2);if(end<0)fail('Unclosed comment');i=end+2;return true}
  return false;
 }
 function regex(){
  const start=i++;let group=false;
  while(i<source.length){const c=source[i++];if(c==='\\'){i++;continue}if(c==='\n'||c==='\r')fail('Unclosed regular expression');if(c==='[')group=true;else if(c===']')group=false;else if(c==='/'&&!group){while(/[a-z]/i.test(source[i]||''))i++;return {kind:'regex',value:source.slice(start,i),start}}}
  fail('Unclosed regular expression');
 }
 const expressionStart=previous=>!previous||previous.kind==='punct'&&['(','[','{',',',':',';','=','=>','!','?','&&','||','??'].includes(previous.value)||previous.kind==='word'&&['return','throw','case','delete','void','typeof','yield','await'].includes(previous.value);
 function template(depth=0){
  if(depth>LIMIT.depth)fail('Template nesting limit exceeded');
  const start=i++;
  while(i<source.length){
   const c=source[i++];if(c==='\\'){i++;continue}if(c==='`')return {kind:'template',value:source.slice(start,i),start};
   if(c==='$'&&source[i]==='{'){
    i++;let braces=1,previous=null;
    while(i<source.length&&braces){
     const ch=source[i];if(/\s/.test(ch)){i++;continue}
     if(ch==='/'&&comment())continue;
     if(ch==='"'||ch==="'"){previous=quoted(i);continue}
     if(ch==='`'){previous=template(depth+1);continue}
     if(ch==='/'&&expressionStart(previous)){previous=regex();continue}
     if(ch==='{'){if(++braces>LIMIT.depth)fail('Template nesting limit exceeded')}
     if(ch==='}')braces--;
     const word=source.slice(i).match(/^[A-Za-z_$][\w$]*/);
     if(word){previous={kind:'word',value:word[0]};i+=word[0].length;continue}
     previous={kind:'punct',value:ch};i++;
    }
    if(braces)fail('Unclosed template expression');
   }
  }
  fail('Unclosed template literal');
 }
 while(i<source.length){
  const c=source[i],start=i;if(/\s/.test(c)){i++;continue}
  if(c==='/'&&comment())continue;
  if(c==='"'||c==="'")tokens.push(quoted(start));
  else if(c==='`')tokens.push(template());
  else if(c==='/'&&expressionStart(tokens.at(-1)))tokens.push(regex());
  else{
   const word=source.slice(i).match(/^[A-Za-z_$][\w$]*/),number=source.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
   if(word){i+=word[0].length;tokens.push({kind:'word',value:word[0],start})}
   else if(number){i+=number[0].length;tokens.push({kind:'number',value:number[0],start})}
   else{const op=['===','!==','...','=>','==','!=','&&','||','??','?.','<=','>=','++','--','**'].find(value=>source.startsWith(value,i))||c;i+=op.length;tokens.push({kind:'punct',value:op,start})}
  }
  if(tokens.length>LIMIT.tokens)fail('Token limit exceeded');
 }
 return tokens;
}
const sameTokens=(a,b)=>a.length===b.length&&a.every((token,index)=>token.kind===b[index].kind&&token.value===b[index].value);

function declarations(tokens){
 const found=new Map(),scope=[],close={')':'(',']':'[','}':'{'};
 for(let i=0;i<tokens.length;i++){
  const token=tokens[i],value=token.value;
  if(token.kind==='word'&&value==='const'&&tokens[i+1]?.kind==='word'&&tokens[i+2]?.value==='='){
   const name=tokens[i+1].value;
   if(['catalog','newWheels','wovenWheels',...Object.keys(BUILDERS)].includes(name)){
    let end=i+3;const groups=[];
    for(;end<tokens.length;end++){
     const part=tokens[end];if(part.kind!=='punct')continue;
     if(part.value===';'&&!groups.length)break;
     if(['(','[','{'].includes(part.value))groups.push(part.value);
     else if(Object.hasOwn(close,part.value)){if(groups.pop()!==close[part.value])throw new Unsupported('Unbalanced declaration: '+name)}
     if(groups.length>LIMIT.depth)throw new Unsupported('Declaration nesting limit exceeded');
    }
    if(end===tokens.length||groups.length)throw new Unsupported('Unclosed declaration: '+name);
    if(!found.has(name))found.set(name,[]);
    found.get(name).push({tokens:tokens.slice(i+3,end),scope:scope.join('/'),start:token.start});
   }
  }
  if(token.kind!=='punct')continue;
  if(['(','[','{'].includes(value))scope.push(value+':'+i);
  else if(Object.hasOwn(close,value)){const opening=scope.pop();if(!opening?.startsWith(close[value]+':'))throw new Unsupported('Unbalanced source groups')}
  if(scope.length>LIMIT.depth)throw new Unsupported('Source nesting limit exceeded');
 }
 if(scope.length)throw new Unsupported('Unclosed source groups');
 return found;
}

class Reader{
 constructor(tokens){this.tokens=tokens;this.index=0}
 get next(){return this.tokens[this.index]}
 is(value){return this.next?.kind!=='string'&&this.next?.kind!=='template'&&this.next?.value===value}
 eat(value){if(!this.is(value))throw new Unsupported('Expected '+value);this.index++}
 optional(value){if(!this.is(value))return false;this.index++;return true}
 sequence(text){for(const token of tokenize(text)){const actual=this.tokens[this.index++];if(!actual||!sameTokens([actual],[token]))throw new Unsupported('Unsupported consumer expression')}}
 string(){const token=this.tokens[this.index++];if(token?.kind!=='string'){if(token?.kind==='number'||['true','false','null'].includes(token?.value))throw new Invalid('Expected a quoted string');throw new Unsupported('Computed string expressions are unsupported')}return token.value}
 number(){const token=this.tokens[this.index++];if(token?.kind!=='number'){if(token?.kind==='string'||['true','false','null'].includes(token?.value))throw new Invalid('Expected a finite literal number');throw new Unsupported('Computed number expressions are unsupported')}if(!Number.isFinite(Number(token.value)))throw new Invalid('Expected a finite literal number');return Number(token.value)}
 done(){if(this.index!==this.tokens.length)throw new Unsupported('Unexpected trailing expression')}
 rows(woven=false){
  const result=[];this.eat('[');
  if(!this.is(']'))do{
   if(result.length>=LIMIT.rows)throw new Invalid('Wheel row limit exceeded');
   this.eat('[');const row=[this.string()];this.eat(',');row.push(this.string());
   if(woven){for(let i=0;i<2;i++){this.eat(',');row.push(this.string())}this.eat(',');row.push(this.number())}
   this.optional(',');this.eat(']');result.push(row);
   if(!this.optional(','))break;
  }while(!this.is(']'));
  this.eat(']');return result;
 }
}

function table(tokens,woven){
 const reader=new Reader(tokens);reader.sequence('Object.freeze(');const rows=reader.rows(woven);
 if(woven)reader.sequence('.map(row=>Object.freeze(row))');
 reader.eat(')');reader.done();return rows;
}
function catalog(tokens){
 const reader=new Reader(tokens),result={};reader.sequence('Object.freeze({');
 for(let index=0;index<FAMILIES.length;index++){
  const family=FAMILIES[index];if(index)reader.eat(',');reader.sequence(family+':Object.freeze(');
  const premium=reader.rows();reader.sequence(".map(([id,title])=>premium('"+family+"',id,title)).concat([");
  const classic=[];
  if(!reader.is(']'))do{
   reader.sequence('classic(');const mode=reader.string();reader.eat(',');const id=reader.string();reader.eat(',');const title=reader.string();reader.eat(',');const src=reader.string();
   if(reader.optional(',')){if(reader.optional('true')===false)reader.eat('false')}
   reader.eat(')');if(mode!==family)throw new Invalid('Classic row family differs from its catalog consumer');classic.push([id,title,src]);
   if(classic.length>LIMIT.rows)throw new Invalid('Classic row limit exceeded');
   if(!reader.optional(','))break;
  }while(!reader.is(']'));
  reader.sequence("]).concat(newWheels.map(([id,title])=>nativeWheel('"+family+"',id,title))).concat(wovenWheels.map(row=>wovenWheel('"+family+"',row))))");
  result[family]={premium,classic};
 }
 reader.optional(',');reader.sequence('})');reader.done();return result;
}
function safeId(id){return typeof id==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)&&id.length<=128}
function safeAssetPath(value){
 if(typeof value!=='string'||!/^\.\/assets\/[A-Za-z0-9_./-]+\.(?:png|svg|webp)$/.test(value))return false;
 return value.slice(2).split('/').every(part=>part!=='.'&&part!=='..'&&part.length>0);
}
function validateRows(rows,builder){
 const ids=new Set();
 for(const row of rows){
  if(!safeId(row[0]))throw new Invalid('Unsafe or malformed wheel ID in '+builder,'WHEEL_UNSAFE_ID');
  if(ids.has(row[0]))throw new Invalid('Duplicate wheel ID in '+builder+': '+row[0],'WHEEL_DUPLICATE_ID');ids.add(row[0]);
  if(typeof row[1]!=='string'||!row[1]||/[\u0000-\u001f\u007f]/.test(row[1]))throw new Invalid('Invalid title in '+builder);
  if(builder==='classic'&&!safeAssetPath(row[2]))throw new Invalid('Unsafe classic asset path','WHEEL_UNSAFE_PATH');
  if(builder==='wovenWheel'&&(!row[2]||/[\u0000-\u001f\u007f]/.test(row[2])||!['copper','gold','silver'].includes(row[3])||row[4]<=0||row[4]>100))throw new Invalid('Invalid woven metadata');
 }
}

function mapWheelCatalog(source){
 const aliases=[],unresolved=[],errors=[],recognizedBuilders={},recognizedTables={},builderTemplates={};let recognizedCatalog=false;
 const issue=(code,message,detail={})=>({code,source:SOURCE,message,...detail});
 const unresolvedIssue=(code,message,detail)=>unresolved.push(issue(code,message,detail));
 const invalid=(code,message,detail)=>errors.push(issue(code,message,detail));
 function finish(){
  // Malformed data never yields a superficially successful partial inventory.
  if(errors.length)aliases.length=0;
  const countsByBuilder=Object.fromEntries(Object.keys(BUILDERS).map(name=>[name,aliases.filter(row=>row.builder===name).length]));
  const countsByFamily=Object.fromEntries(FAMILIES.map(name=>[name,aliases.filter(row=>row.family===name).length]));
  const staticVerified=recognizedCatalog&&Object.values(recognizedBuilders).every(Boolean)&&Object.keys(recognizedBuilders).length===4&&Object.values(recognizedTables).every(Boolean)&&Object.keys(recognizedTables).length===2&&!unresolved.length&&!errors.length;
  const resolvedTemplates=[];
  if(recognizedCatalog&&!errors.length)for(const [builder,tokens]of Object.entries(builderTemplates)){
   if(!recognizedBuilders[builder]||builder==='nativeWheel'&&!recognizedTables.newWheels||builder==='wovenWheel'&&!recognizedTables.wovenWheels)continue;
   for(const token of tokens)resolvedTemplates.push({expression:token.value.slice(1,-1),offset:token.start,line:1+(source.slice(0,token.start).match(/\n/g)||[]).length,builder});
  }
  return {aliases:ordered(aliases),unresolved:ordered(unresolved),errors:ordered(errors),coverage:{staticVerified,complete:staticVerified,meaning:'Exact known builder and consumer shapes plus literal-table-derived candidates; no JavaScript execution, runtime reachability, loading or rendering proof.',catalogRecognized:recognizedCatalog,recognizedBuilders,recognizedTables,entryCount:aliases.length,aliases:aliases.length,uniqueTargets:new Set(aliases.map(row=>row.target)).size,countsByBuilder,countsByFamily,resolvedTemplates:ordered(resolvedTemplates)}};
 }
 if(typeof source!=='string'){invalid('WHEEL_SOURCE_INVALID','Expected wheel source text');return finish()}
 if(Buffer.byteLength(source,'utf8')>LIMIT.bytes){invalid('WHEEL_SOURCE_LIMIT','Wheel source byte limit exceeded');return finish()}
 let found;
 try{found=declarations(tokenize(source))}catch(e){unresolvedIssue('WHEEL_LEXICAL_SHAPE_UNSUPPORTED',e.message);return finish()}
 const catalogDefinitions=found.get('catalog')||[];
 if(catalogDefinitions.length!==1){unresolvedIssue('WHEEL_CATALOG_SHAPE_UNSUPPORTED','Expected one catalog const declaration');return finish()}
 const context=catalogDefinitions[0].scope;
 function definition(name){
  const definitions=(found.get(name)||[]).filter(row=>row.scope===context);
  if(definitions.length!==1){unresolvedIssue('WHEEL_DECLARATION_SHAPE_UNSUPPORTED','Expected one '+name+' declaration in the catalog scope',{declaration:name});return null}
  return definitions[0].tokens;
 }
 for(const [name,form]of Object.entries(BUILDERS)){
  const tokens=definition(name);recognizedBuilders[name]=!!tokens&&sameTokens(tokens,tokenize(form));
  if(recognizedBuilders[name])builderTemplates[name]=tokens.filter(token=>token.kind==='template');
  if(tokens&&!recognizedBuilders[name])unresolvedIssue('WHEEL_BUILDER_SHAPE_UNSUPPORTED','Builder differs from reviewed '+name+' source form',{builder:name});
 }
 let rows;
 try{rows=catalog(catalogDefinitions[0].tokens);recognizedCatalog=true;for(const family of FAMILIES){validateRows(rows[family].premium,'premium');validateRows(rows[family].classic,'classic')}}
 catch(e){(e instanceof Invalid?invalid:unresolvedIssue)(e.code||'WHEEL_CATALOG_SHAPE_UNSUPPORTED',e.message);return finish()}
 const tables={};
 for(const [name,builder]of [['newWheels','nativeWheel'],['wovenWheels','wovenWheel']]){
  const tokens=definition(name);recognizedTables[name]=false;if(!tokens)continue;
  try{tables[name]=table(tokens,name==='wovenWheels');validateRows(tables[name],builder);recognizedTables[name]=true}
  catch(e){(e instanceof Invalid?invalid:unresolvedIssue)(e.code||'WHEEL_TABLE_SHAPE_UNSUPPORTED',e.message,{table:name})}
 }
 function add(family,builder,id,target,tableName){
  if(!recognizedBuilders[builder])return;
  aliases.push({alias:'wheel:'+family+':'+id,target,family,builder,basis:'Exact known '+builder+' source form, '+tableName+' literal rows and catalog.'+family+' map/concat consumer; a static table-derived candidate only.'});
 }
 for(const family of FAMILIES){
  for(const [id]of rows[family].premium)add(family,'premium',id,'assets/wheels-r924/'+(family==='berhet'?'berhetiyye':'esma')+'/'+id+'.webp','catalog.'+family);
  for(const [id,,src]of rows[family].classic)add(family,'classic',id,src.slice(2),'catalog.'+family+' classic()');
  if(recognizedTables.newWheels)for(const [id]of tables.newWheels)add(family,'nativeWheel',id,'assets/wheels-r977/'+id+'.webp','newWheels');
  if(recognizedTables.wovenWheels)for(const [id]of tables.wovenWheels)add(family,'wovenWheel',id,'assets/wheels/'+id+'-r1057.webp','wovenWheels');
 }
 // Check IDs across all source tables, including builders that are unsupported.
 // An unsupported builder must not hide a duplicate in another table.
 for(const family of FAMILIES){
  const seen=new Set(),all=[...rows[family].premium,...rows[family].classic,...(tables.newWheels||[]),...(tables.wovenWheels||[])];
  for(const [id]of all){if(seen.has(id))invalid('WHEEL_DUPLICATE_ALIAS','Duplicate wheel ID across '+family+' catalog tables',{alias:'wheel:'+family+':'+id});seen.add(id)}
 }
 return finish();
}
module.exports={mapWheelCatalog};
