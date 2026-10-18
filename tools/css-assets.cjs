'use strict';
// Local release dependency validation, not a CSS cascade or rendering engine.
// Only linked external styles and their local imports are in this first scope.
const fs=require('node:fs'),path=require('node:path');
const LIMIT={files:256,bytes:16*1024*1024,valueDepth:24,valueExpansions:20000,references:10000,stdinBytes:32*1024*1024};
const resources=new Set(['background','background-image','border-image','border-image-source','mask','mask-image','-webkit-mask','-webkit-mask-image','content','cursor','filter','backdrop-filter','list-style','list-style-image','src','fill','stroke','clip-path','shape-outside','offset-path']);
const cssUnescape=value=>value.replace(/\\(?:([0-9a-f]{1,6})(?:\r\n|[\t\n\r\f ])?|([^\n\r\f])|\r\n|[\n\r\f])/gi,(_,hex,char)=>hex?String.fromCodePoint(Math.min(0x10ffff,parseInt(hex,16))||0xfffd):char||'');
const htmlUnescape=value=>value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi,entity=>{const named={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};if(named[entity.toLowerCase()])return named[entity.toLowerCase()];const hex=entity[2].toLowerCase()==='x',n=parseInt(entity.slice(hex?3:2,-1),hex?16:10);return Number.isFinite(n)&&n<=0x10ffff?String.fromCodePoint(n):'\ufffd';});
function commentEnd(text,start){const end=text.indexOf('*/',start+2);return end<0?text.length:end+2;}
function quoteEnd(text,start){const quote=text[start];let i=start+1;for(;i<text.length;i++){if(text[i]==='\\'){i++;continue;}if(text[i]===quote)return i+1;}return text.length;}
function htmlQuoteEnd(text,start){const end=text.indexOf(text[start],start+1);return end<0?text.length:end+1;}
function clean(text){let out='';for(let i=0;i<text.length;){if(text.startsWith('/*',i)){out+=' ';i=commentEnd(text,i);}else if(text[i]==='"'||text[i]==="'"){const end=quoteEnd(text,i);out+=text.slice(i,end);i=end;}else out+=text[i++];}return out.trim();}
function functionEnd(text,start){let depth=1;for(let i=start+1;i<text.length;i++){const c=text[i];if(c==='\\'){i++;continue;}if(text.startsWith('/*',i)){i=commentEnd(text,i)-1;continue;}if(c==='"'||c==="'"){i=quoteEnd(text,i)-1;continue;}if(c==='(')depth++;else if(c===')'&&--depth===0)return i;}return -1;}
function firstComma(text){let depth=0;for(let i=0;i<text.length;i++){const c=text[i];if(c==='\\'){i++;continue;}if(text.startsWith('/*',i)){i=commentEnd(text,i)-1;continue;}if(c==='"'||c==="'"){i=quoteEnd(text,i)-1;continue;}if(c==='(')depth++;else if(c===')')depth--;else if(c===','&&!depth)return i;}return -1;}
function functions(text,visit){
 for(let i=0;i<text.length;){const c=text[i];if(text.startsWith('/*',i)){i=commentEnd(text,i);continue;}if(c==='"'||c==="'"){i=quoteEnd(text,i);continue;}
  const identifier=text.slice(i).match(/^(?:[-_a-zA-Z]|\\(?:[\da-fA-F]{1,6}[\t\n\r\f ]?|[^\n\r\f]))(?:[-_a-zA-Z0-9]|\\(?:[\da-fA-F]{1,6}[\t\n\r\f ]?|[^\n\r\f]))*/);
  if(identifier){const end=i+identifier[0].length;if(text[end]==='('){const close=functionEnd(text,end);if(close<0){visit('invalid','',i);return;}visit(cssUnescape(identifier[0]).toLowerCase(),text.slice(end+1,close),i);i=close+1;continue;}i=end;continue;}i++;
 }
}
function urlArgument(value){const stripped=value.trim();if(stripped[0]==='"'||stripped[0]==="'"){const end=quoteEnd(stripped,0);if(clean(stripped.slice(end))||stripped[end-1]!==stripped[0])return null;return cssUnescape(stripped.slice(1,end-1));}
 // Unescaped whitespace/parentheses/quotes produce a CSS bad-url token, not
 // a request for a file with those literal characters in its name.
 for(let i=0;i<stripped.length;i++){if(stripped[i]==='\\'){const escape=stripped.slice(i).match(/^\\(?:[\da-f]{1,6}[\t\n\r\f ]?|[^\n\r\f])/i);if(!escape)return null;i+=escape[0].length-1;continue;}if(/[\s"'()\u0000-\u001f\u007f]/.test(stripped[i]))return null;}
 if(stripped.includes('/*'))return null;return cssUnescape(stripped);
}
function stylesheetLinks(html){
 const links=[];let i=0;
 while(i<html.length){const start=html.indexOf('<',i);if(start<0)break;if(html.startsWith('<!--',start)){const end=html.indexOf('-->',start+4);i=end<0?html.length:end+3;continue;}
  let end=start+1;for(;end<html.length;end++){if(html[end]==='"'||html[end]==="'"){end=htmlQuoteEnd(html,end)-1;continue;}if(html[end]==='>')break;}
  const tag=html.slice(start,end+1),name=tag.match(/^<\s*([\w-]+)/)?.[1]?.toLowerCase();i=end+1;
  if(['script','style','template','noscript'].includes(name)){const close=new RegExp('</\\s*'+name+'\\s*>','gi');close.lastIndex=i;const match=close.exec(html);i=match?close.lastIndex:html.length;continue;}
  if(name!=='link')continue;const attrs={};for(const m of tag.slice(tag.indexOf(name)+name.length,-1).matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))attrs[m[1].toLowerCase()]=htmlUnescape(m[2]??m[3]??m[4]??'');
  if((attrs.rel||'').toLowerCase().split(/\s+/).includes('stylesheet')&&attrs.href&&!Object.hasOwn(attrs,'disabled'))links.push({url:attrs.href,conditional:!!attrs.media&&!/^all$/i.test(attrs.media.trim()),line:1+html.slice(0,start).split('\n').length-1});
 }
 return links;
}
function parseStylesheet(css,file,importConditional){
 const declarations=[],imports=[],registered=new Set(),stack=[];let start=0,paren=0,bracket=0,importsOpen=true;
 const context=()=>({conditional:importConditional||stack.some(x=>x.conditional),selector:stack.filter(x=>!x.header.startsWith('@')).at(-1)?.header||''});
 const segment=(end)=>{const raw=css.slice(start,end),text=clean(raw);if(!text)return;const line=1+css.slice(0,start).split('\n').length-1;
  if(/^@import\b/i.test(text)){if(stack.length||!importsOpen)return;let url=null,rest='';const after=text.replace(/^@import\s*/i,'');if(after[0]==='"'||after[0]==="'"){const close=quoteEnd(after,0);url=urlArgument(after.slice(0,close));rest=after.slice(close);}else functions(after,(name,args,offset)=>{if(url===null&&name==='url'&&offset===0){url=urlArgument(args);const end=functionEnd(after,after.indexOf('('));rest=after.slice(end+1);}});if(url!==null)imports.push({url,line,conditional:!!clean(rest).replace(/^layer(?:\([^)]*\))?\s*/i,'')});return;}
  if(!stack.length&&!/^@(?:charset|layer)\b/i.test(text))importsOpen=false;
  const match=text.match(/^((?:--)?[-\w]+)\s*:\s*([\s\S]*)$/);if(match&&stack.length)declarations.push({file,line,property:match[1],value:match[2].replace(/!\s*important\s*$/i,'').trim(),...context()});
 };
 for(let i=0;i<css.length;i++){const c=css[i];if(c==='\\'){i++;continue;}if(css.startsWith('/*',i)){i=commentEnd(css,i)-1;continue;}if(c==='"'||c==="'"){i=quoteEnd(css,i)-1;continue;}if(c==='('){paren++;continue;}if(c===')'){paren--;continue;}if(c==='['){bracket++;continue;}if(c===']'){bracket--;continue;}if(paren||bracket)continue;
  if(c==='{'){const header=clean(css.slice(start,i));if(!stack.length)importsOpen=false;const registration=header.match(/^@property\s+(--[-\w]+)/i);if(registration)registered.add(registration[1]);stack.push({header,conditional:/^@(media|supports|container|scope|document|starting-style)\b/i.test(header)});start=i+1;}
  else if(c===';'){segment(i);start=i+1;}
  else if(c==='}'){segment(i);stack.pop();start=i+1;}
 }
 return{declarations,imports,registered};
}
function validateCssResources(options={}){
 const root=path.resolve(options.root||process.cwd()),realRoot=fs.realpathSync(root),read=options.read||((name)=>fs.readFileSync(path.join(root,name))),entry=options.entryPath||'index.html';
 const inventory=new Set(options.inventoryPaths||[]),report={schema:1,scope:'Active external CSS and recursive local imports; no inline/generated CSS, computed cascade, remote retrieval or rendering.',errors:[],unresolved:[],files:[],references:[],ignored:{remote:0,data:0,blob:0,fragment:0,empty:0},stats:{files:0,bytes:0,declarations:0,customProperties:0,checkedReferences:0}};
 const loaded=new Map(),declarations=[],definitions=new Map(),registered=new Set(),unresolvedKeys=new Set(),errorKeys=new Set();let bytes=0,valueExpansions=0,resourceLimit=false;
 function addError(code,detail){const value={code,...detail},key=JSON.stringify(value);if(!errorKeys.has(key)){errorKeys.add(key);report.errors.push(value);}}
 function unresolved(code,detail){const value={code,...detail},key=JSON.stringify(value);if(!unresolvedKeys.has(key)){unresolvedKeys.add(key);report.unresolved.push(value);}}
 function resolve(raw,source,detail){
  const url=String(raw??'').trim();if(!url){report.ignored.empty++;return null;}if(url[0]==='#'){report.ignored.fragment++;return null;}if(/^data:/i.test(url)){report.ignored.data++;return null;}if(/^blob:/i.test(url)){report.ignored.blob++;return null;}if(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url)){report.ignored.remote++;return null;}
  if(url.startsWith('/')){unresolved('ROOT_RELATIVE_URL',{source,url,...detail});return null;}
  let decoded;try{decoded=decodeURIComponent(url.split(/[?#]/,1)[0]);}catch(_){addError('INVALID_URL_ENCODING',{source,url,...detail});return null;}
  if(/[\\\u0000-\u001f]/.test(decoded)||/%(?:2f|5c)/i.test(url.split(/[?#]/,1)[0])){addError('UNSAFE_URL_PATH',{source,url,...detail});return null;}
  const target=path.posix.normalize(path.posix.join(path.posix.dirname(source),decoded||path.posix.basename(source)));
  if(target==='..'||target.startsWith('../')||path.posix.isAbsolute(target)){addError('PATH_OUTSIDE_ROOT',{source,url,target,...detail});return null;}
  return{source,url,target,...detail};
 }
 function inspectFile(reference,kind){
  const full=path.join(root,reference.target);let actual;
  try{actual=fs.realpathSync(full);}catch(_){addError(kind+'_MISSING',reference);return false;}
  const relative=path.relative(realRoot,actual);if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative)){addError('REALPATH_OUTSIDE_ROOT',reference);return false;}
  if(!fs.statSync(actual).isFile()){addError(kind+'_NOT_FILE',reference);return false;}
  if(!inventory.has(reference.target))addError(kind+'_NOT_IN_INVENTORY',reference);
  return true;
 }
 function load(raw,source,detail,conditional=false){
  const reference=resolve(raw,source,detail);if(!reference)return;
  if(!inspectFile(reference,'CSS_FILE'))return;
  if(loaded.has(reference.target)){const prior=loaded.get(reference.target);if(prior.conditional&&!conditional){prior.conditional=false;for(const imported of prior.parsed.imports)load(imported.url,reference.target,{line:imported.line,kind:'import'},imported.conditional);}return;}
  if(loaded.size>=LIMIT.files){addError('CSS_FILE_LIMIT',reference);return;}
  let css;try{const value=read(reference.target);css=Buffer.isBuffer(value)?value.toString('utf8'):String(value);}catch(_){addError('CSS_FILE_READ_FAILED',reference);return;}
  const length=Buffer.byteLength(css);bytes+=length;if(bytes>LIMIT.bytes){addError('CSS_BYTE_LIMIT',reference);return;}
  const parsed=parseStylesheet(css,reference.target,false);loaded.set(reference.target,{conditional,parsed});report.files.push(reference.target);for(const name of parsed.registered)registered.add(name);
  for(const imported of parsed.imports)load(imported.url,reference.target,{line:imported.line,kind:'import'},conditional||imported.conditional);
 }
 let html;try{const value=options.entryHtml===undefined?read(entry):options.entryHtml;html=Buffer.isBuffer(value)?value.toString('utf8'):String(value);}catch(_){addError('ENTRY_READ_FAILED',{source:entry});html='';}
 for(const link of stylesheetLinks(html))load(link.url,entry,{line:link.line,kind:'stylesheet'},link.conditional);
 // Reachability is finalized before variable collection. A later unconditional
 // occurrence upgrades the file and ordinary descendants without erasing an
 // imported sheet's own media/supports conditions.
 for(const record of loaded.values())for(const declaration of record.parsed.declarations)declarations.push({...declaration,conditional:declaration.conditional||record.conditional});
 for(const declaration of declarations)if(declaration.property.startsWith('--')){const name=declaration.property;if(!definitions.has(name))definitions.set(name,[]);definitions.get(name).push(declaration);}
 const relevant=(decl)=>resources.has(decl.property.toLowerCase());
 function valueUrls(value,consumer,chain=[],depth=0,expanded=new Set()){
  if(resourceLimit)return[];
  if(++valueExpansions>LIMIT.valueExpansions){resourceLimit=true;addError('CSS_VALUE_EXPANSION_LIMIT',{source:consumer.file,line:consumer.line,property:consumer.property});return[];}
  const urls=[];if(depth>LIMIT.valueDepth){unresolved('VARIABLE_DEPTH_LIMIT',{source:consumer.file,line:consumer.line,property:consumer.property,chain});return urls;}
  functions(value,(name,args)=>{
   if(name==='invalid'){unresolved('UNTERMINATED_VALUE',{source:consumer.file,line:consumer.line,property:consumer.property});return;}
   if(name==='url'){const raw=urlArgument(args);if(raw===null)unresolved('UNSUPPORTED_URL_TOKEN',{source:consumer.file,line:consumer.line,property:consumer.property});else urls.push({raw,chain});return;}
   if(name==='var'){
    const comma=firstComma(args),variable=clean(comma<0?args:args.slice(0,comma)),defs=definitions.get(variable),detail={source:consumer.file,line:consumer.line,property:consumer.property,variable,chain};
    if(chain.includes(variable)){if(relevant(consumer))unresolved('VARIABLE_CYCLE',detail);return;}
    if(registered.has(variable)){if(relevant(consumer))unresolved('REGISTERED_VARIABLE',detail);return;}
    if(!/^--[-\w]+$/.test(variable)||!defs?.length){if(relevant(consumer))unresolved('UNKNOWN_VARIABLE',detail);return;}
    const values=[...new Set(defs.map(d=>clean(d.value)))];
    if(defs.some(d=>d.conditional||d.selector!==':root')||values.length!==1){if(relevant(consumer))unresolved('AMBIGUOUS_VARIABLE',detail);return;}
    if(/^(?:initial|inherit|unset|revert|revert-layer)$/i.test(values[0])){unresolved('CSS_WIDE_VARIABLE',detail);return;}
    if(expanded.has(variable))return;expanded.add(variable);
    urls.push(...valueUrls(values[0],consumer,[...chain,variable],depth+1,expanded));return;
   }
   urls.push(...valueUrls(args,consumer,chain,depth+1,expanded));
  });return urls;
 }
 for(const declaration of declarations){if(resourceLimit)break;if(declaration.property.startsWith('--'))continue;if(!relevant(declaration))continue;for(const url of valueUrls(declaration.value,declaration)){if(report.references.length>=LIMIT.references){resourceLimit=true;addError('CSS_REFERENCE_LIMIT',{source:declaration.file,line:declaration.line,property:declaration.property});break;}const reference=resolve(url.raw,declaration.file,{line:declaration.line,property:declaration.property,chain:url.chain});if(!reference)continue;report.references.push(reference);inspectFile(reference,'CSS_ASSET');}}
 report.stats={files:report.files.length,bytes,declarations:declarations.filter(d=>!d.property.startsWith('--')).length,customProperties:definitions.size,checkedReferences:report.references.length,valueExpansions};return report;
}
function audit(root,options={}){return validateCssResources({root,entryHtml:options.html,entryPath:options.entry,inventoryPaths:options.inventory,read:options.read});}
module.exports={validateCssResources,audit};
function readStdinLimited(){const chunks=[],buffer=Buffer.alloc(64*1024);let total=0;for(;;){const count=fs.readSync(0,buffer,0,buffer.length,null);if(!count)break;total+=count;if(total>LIMIT.stdinBytes)throw Object.assign(new Error('CSS audit input exceeds 32 MiB'),{code:'CLI_INPUT_TOO_LARGE'});chunks.push(Buffer.from(buffer.subarray(0,count)));}return Buffer.concat(chunks,total).toString('utf8');}
if(require.main===module){
 try{const args=process.argv.slice(2),root=path.resolve(args.includes('--root')?args[args.indexOf('--root')+1]:process.cwd());let request={};if(args.includes('--stdin'))request=JSON.parse(readStdinLimited());else{const version=fs.readFileSync(path.join(root,'version.txt'),'utf8').trim();request.inventoryPaths=JSON.parse(fs.readFileSync(path.join(root,'sukun-site-assets-'+version+'.json'),'utf8')).files.map(file=>file.path);}
  const overrides=request.overrides||{},report=validateCssResources({...request,root,read:name=>Object.hasOwn(overrides,name)?overrides[name]:fs.readFileSync(path.join(root,name))});console.log(JSON.stringify(report,null,2));process.exitCode=report.errors.length?1:0;
 }catch(error){console.log(JSON.stringify({errors:[{code:error.code==='CLI_INPUT_TOO_LARGE'?error.code:'AUDIT_FAILED',message:error.message}],unresolved:[],files:[]},null,2));process.exitCode=1;}
}
