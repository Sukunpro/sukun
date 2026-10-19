'use strict';
// A bounded maintenance inventory. This is deliberately not a reachability,
// dead-code, visual-equivalence, browser-loading or rendering proof.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {validateCssResources}=require('./css-assets.cjs');
const {mapWheelCatalog}=require('./wheel-catalog-map.cjs');
const IMAGE=/\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;
const TEXT=/\.(?:html|css|js|json|webmanifest)$/i;
const LIMIT={files:4096,sourceBytes:64*1024*1024,references:30000};
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const compare=(a,b)=>a<b?-1:a>b?1:0;
const ordered=rows=>rows.sort((a,b)=>compare(JSON.stringify(a),JSON.stringify(b)));
function literalPath(raw,base='index.html'){
 const value=String(raw).trim();
 if(!value||/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(value))return null;
 const encoded=value.split(/[?#]/,1)[0];
 if(encoded.startsWith('/')||/[%](?:2f|5c)/i.test(encoded))throw new Error('UNSAFE_PATH');
 let decoded;try{decoded=decodeURIComponent(encoded)}catch(_){throw new Error('INVALID_ENCODING')}
 if(/[\\\u0000-\u001f\u007f]/.test(decoded))throw new Error('UNSAFE_PATH');
 const target=path.posix.normalize(path.posix.join(path.posix.dirname(base),decoded));
 if(target==='..'||target.startsWith('../')||path.posix.isAbsolute(target))throw new Error('PATH_OUTSIDE_ROOT');
 return target.replace(/^\.\//,'');
}
function buildReferenceMap(root){
 root=path.resolve(root);const realRoot=fs.realpathSync(root),errors=[],unresolved=[],references=[],cache=new Map();
 const error=(code,detail)=>errors.push({code,...detail});
 function safeRead(name){
  let clean;try{clean=literalPath(name)}catch(e){throw Object.assign(e,{code:e.message})}
  if(clean!==name)throw Object.assign(new Error('Noncanonical inventory path'),{code:'NONCANONICAL_PATH'});
  const file=path.join(root,name),real=fs.realpathSync(file),relative=path.relative(realRoot,real);
  if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Object.assign(new Error('Symlink escapes root'),{code:'REALPATH_OUTSIDE_ROOT'});
  if(!fs.statSync(real).isFile())throw Object.assign(new Error('Expected regular file'),{code:'NOT_FILE'});
  if(!cache.has(name))cache.set(name,fs.readFileSync(file));return cache.get(name);
 }
 function read(name){try{return safeRead(name)}catch(e){error(e.code||'FILE_MISSING',{path:name});return null}}
 const version=read('version.txt')?.toString().trim();
 if(!/^r\d+$/.test(version||''))throw new Error('Invalid version.txt');
 const inventoryPath='sukun-site-assets-'+version+'.json';
 const raw=read(inventoryPath);if(!raw)throw new Error('Missing release inventory');
 const inventory=JSON.parse(raw);if(inventory.build!==version||!Array.isArray(inventory.files))throw new Error('Invalid release inventory');
 if(inventory.files.length>LIMIT.files)throw new Error('Inventory file limit exceeded');
 const members=new Map(),visuals=[],sources=[];let sourceBytes=0;
 for(const row of inventory.files){
  if(!row||typeof row.path!=='string'||members.has(row.path)){error('INVALID_INVENTORY_MEMBER',{path:row?.path??null});continue}
  let valid;try{valid=literalPath(row.path)===row.path}catch(_){valid=false}
  if(!valid){error('UNSAFE_INVENTORY_PATH',{path:row.path});continue}
  members.set(row.path,row);
  if(!IMAGE.test(row.path)&&!TEXT.test(row.path))continue;
  const bytes=read(row.path);if(!bytes)continue;
  const hash=sha(bytes),verified=hash===row.sha256&&bytes.length===row.bytes;
  if(!verified)error('INVENTORY_CONTENT_MISMATCH',{path:row.path});
  if(IMAGE.test(row.path))visuals.push({path:row.path,bytes:bytes.length,sha256:hash,inventoryVerified:verified});
  else{
   sourceBytes+=bytes.length;if(sourceBytes>LIMIT.sourceBytes){error('SOURCE_BYTE_LIMIT',{path:row.path});break}
   sources.push({path:row.path,bytes:bytes.length,sha256:hash,inventoryVerified:verified});
  }
 }
 const html=cache.get('index.html')?.toString('utf8')||'',alias=cache.get('nero.html');
 if(!html)error('ENTRY_NOT_IN_INVENTORY',{path:'index.html'});
 if(!alias||!cache.get('index.html')?.equals(alias))error('ENTRYPOINT_ALIAS_MISMATCH',{paths:['index.html','nero.html']});
 const byVisual=new Map(visuals.map(row=>[row.path,row]));
 const buckets=new Map();for(const row of visuals.filter(row=>row.inventoryVerified)){const key=row.sha256+':'+row.bytes;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(row.path)}
 const byteEqualityGroups=ordered([...buckets.entries()].filter(([,items])=>items.length>1&&items.every(name=>cache.get(name).equals(cache.get(items[0])))).map(([key,items])=>({sha256:key.split(':')[0],bytes:Number(key.split(':')[1]),paths:items.sort(compare),meaning:'Exact current bytes compared with Buffer.equals; no permission to remove or redirect any path.'})));
 const seen=new Set();
 function reference(source,raw,offset,kind,base){
  if(references.length>=LIMIT.references){if(!errors.some(row=>row.code==='REFERENCE_LIMIT'))error('REFERENCE_LIMIT',{});return}
  let target;try{target=literalPath(raw,base)}catch(e){unresolved.push({code:e.message,source,raw,line:1+(cache.get(source)?.toString('utf8').slice(0,offset).match(/\n/g)||[]).length,kind});return}
  if(!target||!IMAGE.test(target))return;
  const line=1+(cache.get(source)?.toString('utf8').slice(0,offset).match(/\n/g)||[]).length;
  const key=[source,raw,line,kind].join('\0');if(seen.has(key))return;seen.add(key);
  references.push({source,line,kind,raw,target,inInventory:members.has(target),inventoryVerified:byVisual.get(target)?.inventoryVerified===true});
 }
 // Complete quoted image paths only. Directory fragments, interpolation and
 // string concatenation are not silently interpreted as completed paths.
 for(const source of sources){
  // nero.html is a proven byte alias of index; count the canonical shell once.
  if(source.path==='nero.html')continue;
  const text=cache.get(source.path).toString('utf8'),base=source.path.endsWith('.css')?source.path:'index.html';
  for(const m of text.matchAll(/(["'`])([^\n\r"'`<>]{1,2048})\1/g)){
   const value=m[2];
   if(value.includes('${')){if(/(?:assets\/|\.webp|\.png|\.svg)/.test(value))unresolved.push({code:'DYNAMIC_TEMPLATE',source:source.path,offset:m.index,line:1+(text.slice(0,m.index).match(/\n/g)||[]).length,expression:value});continue}
   if(IMAGE.test(value.split(/[?#]/,1)[0])&&!/\s/.test(value))reference(source.path,value,m.index,'quoted-image-candidate',base);
   else if(/^(?:\.\/?|\.\.\/)?assets\/[\w./-]*\/$/.test(value))unresolved.push({code:'DYNAMIC_DIRECTORY_FRAGMENT',source:source.path,line:1+(text.slice(0,m.index).match(/\n/g)||[]).length,expression:value});
  }
 }
 const css=validateCssResources({root,entryHtml:html,inventoryPaths:[...members.keys()]});
 for(const row of css.references)if(IMAGE.test(row.target))references.push({source:row.source,line:row.line,kind:'audited-external-css-resource',raw:row.url,target:row.target,inInventory:members.has(row.target),inventoryVerified:byVisual.get(row.target)?.inventoryVerified===true,property:row.property,chain:row.chain});
 const runtimeAliases=[];
 function script(id){const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return html.match(new RegExp('<script\\b[^>]*\\bid=["\']'+escaped+'["\'][^>]*>([\\s\\S]*?)</script>'))?.[1]||null}
 function addAlias(aliasId,target,source,proof,related={}){
  let normalized;try{normalized=literalPath(target)}catch(e){error('UNSAFE_RUNTIME_ALIAS',{alias:aliasId,target});return}
  if(!byVisual.get(normalized)?.inventoryVerified)error('RUNTIME_ALIAS_TARGET_UNVERIFIED',{alias:aliasId,target:normalized});
  const contextualVariants=[];for(const field of ['originalAsset','thumbnail'])if(related[field])contextualVariants.push({field,path:related[field],inInventory:members.has(related[field]),inventoryVerified:byVisual.get(related[field])?.inventoryVerified===true,meaning:'Contextual variant; only the alias target is required by this extractor.'});
  runtimeAliases.push({alias:aliasId,target:normalized,source,proof,...related,...(contextualVariants.length?{contextualVariants}:{})});
 }
 // Exact known data shapes and consumer expressions only. Production JavaScript
 // is never executed, evaluated, imported, or passed to a VM by this tool.
 const atlasScript=script('sukun-r853-scene-runtime'),consumer=script('sukun-r914-runtime');
 const atlasMatch=atlasScript?.match(/nameScenes:Object\.freeze\((\[[\s\S]*?\])\.map\(Object\.freeze\)\)/);
 const hasAtlasConsumer=consumer?.includes("const atlas=window.SukunR853Scene.nameScenes,originals=window.SukunR853Scene.files;")&&consumer.includes("choice==='auto'?'./'+scene.runtimeAsset:fixed?'./'+fixed.runtimeAsset:");
 if(atlasMatch&&hasAtlasConsumer){
  try{
   const atlas=JSON.parse(atlasMatch[1]);
   const ids=new Set();for(const row of atlas){
    if(typeof row.sceneId!=='string'||typeof row.runtimeAsset!=='string'||typeof row.asset!=='string'||ids.has(row.sceneId))throw new Error('Invalid atlas row');ids.add(row.sceneId);
    addAlias('berhet-scene:'+row.sceneId,row.runtimeAsset,'index.html#sukun-r853-scene-runtime + #sukun-r914-runtime','Literal embedded JSON runtimeAsset and exact known scenePath consumer',{originalAsset:row.asset,relationship:'Original and mobile variants are distinct assets, not proven equal bytes.'});
   }
  }catch(e){error('ATLAS_PARSE_FAILED',{message:e.message})}
 }else if(atlasScript||consumer)unresolved.push({code:'ATLAS_CONSUMER_SHAPE_UNSUPPORTED',source:'index.html'});
 const fixed=consumer?.match(/const files=\{((?:[a-z]+:'[\w.-]+\.png',?)+)\};/);
 if(fixed&&consumer.includes("'./assets/scenes/mobile-r918/'+files[choice].replace(/\\.png$/,'.webp')")){
  for(const m of fixed[1].matchAll(/([a-z]+):'([\w.-]+\.png)'/g))addAlias('berhet-fixed:'+m[1],'assets/scenes/mobile-r918/'+m[2].replace(/\.png$/,'.webp'),'index.html#sukun-r914-runtime','Literal fixed-choice table and exact known PNG-to-mobile-WebP consumer',{originalAsset:'assets/berhetiyye-premium/'+m[2],thumbnail:'assets/scenes/thumb-r949/'+m[2].replace(/\.png$/,'.webp'),relationship:'Derived variants; byte equivalence is not inferred.'});
 }else if(consumer)unresolved.push({code:'FIXED_SCENE_SHAPE_UNSUPPORTED',source:'index.html#sukun-r914-runtime'});
 const wheels=cache.get('assets/runtime/wheels-r924.js')?.toString('utf8');
 let wheelCatalog=null;const resolvedObservations=[];
 if(wheels){
  wheelCatalog=mapWheelCatalog(wheels);
  for(const row of wheelCatalog.aliases)addAlias(row.alias,row.target,'assets/runtime/wheels-r924.js',row.basis,{builder:row.builder,family:row.family});
  for(const row of wheelCatalog.unresolved)unresolved.push({source:'assets/runtime/wheels-r924.js',...row});
  for(const row of wheelCatalog.errors)error(row.code,{source:'assets/runtime/wheels-r924.js',...row});
  if(wheelCatalog.coverage.staticVerified)for(const resolved of wheelCatalog.coverage.resolvedTemplates||[]){
   for(let index=unresolved.length-1;index>=0;index--){
    const row=unresolved[index];
    if(row.code==='DYNAMIC_TEMPLATE'&&row.source==='assets/runtime/wheels-r924.js'&&row.offset===resolved.offset&&row.expression===resolved.expression){
     resolvedObservations.push({...row,resolvedBy:'known-wheel-catalog',builder:resolved.builder});unresolved.splice(index,1);
    }
   }
  }
 }
 const candidateTargets=new Set(references.map(row=>row.target));for(const row of runtimeAliases)candidateTargets.add(row.target);
 const noObservedReference=visuals.filter(row=>!candidateTargets.has(row.path)).map(row=>row.path).sort(compare);
 const uniqueUnresolved=ordered([...new Map(unresolved.map(row=>[JSON.stringify(row),row])).values()]);
 const noninventoryCandidates=references.filter(row=>row.kind==='quoted-image-candidate'&&!row.inInventory).length;
 const report={schema:1,build:version,scope:'Current release inventory image bytes; bounded quoted image-path candidates; existing active external-CSS audit; exact known scene tables and premium/native/woven/classic wheel catalog data shapes.',limitations:['Quoted candidates may occur in inactive code, data or comments; they do not prove runtime use. Noninventory quoted candidates are nonblocking observations for later review, not proven active missing-file bugs.','Dynamic or generated paths, inline CSS variable resolution and computed cascade are incomplete. Unknowns remain explicit.','Byte-equality groups do not prove interchangeable URLs. Derived PNG/WebP/thumbnail variants are separate assets.','No file is classified as unused, removed, renamed, redirected or visually verified. No browser or physical Android test is performed.'],inventory:{path:inventoryPath,sha256:sha(raw),members:members.size},summary:{images:visuals.length,verifiedImages:visuals.filter(row=>row.inventoryVerified).length,sourceFiles:sources.length,sourceBytes,byteEqualityGroups:byteEqualityGroups.length,quotedAndCssReferences:references.length,noninventoryQuotedCandidates:noninventoryCandidates,runtimeAliases:runtimeAliases.length,resolvedDynamicObservations:resolvedObservations.length,imagesWithoutObservedReference:noObservedReference.length,literalAndAliasUnresolved:uniqueUnresolved.length,cssUnresolved:css.unresolved.length,unresolved:uniqueUnresolved.length+css.unresolved.length,errors:errors.length+css.errors.length},wheelCatalog:wheelCatalog?.coverage||null,tooling:Object.fromEntries(['visual-reference-map.cjs','wheel-catalog-map.cjs','css-assets.cjs'].map(name=>['tools/'+name,sha(fs.readFileSync(path.join(__dirname,name)))])),sources:sources.sort((a,b)=>compare(a.path,b.path)),images:visuals.sort((a,b)=>compare(a.path,b.path)),byteEqualityGroups,references:ordered(references),runtimeAliases:ordered(runtimeAliases),resolvedObservations:ordered(resolvedObservations),imagesWithoutObservedReference:{meaning:'No reference observed within this bounded parser; not an unused-assets list.',paths:noObservedReference},unresolved:uniqueUnresolved,cssAudit:{scope:css.scope,files:css.files,references:css.references,unresolved:css.unresolved,errors:css.errors},errors:ordered(errors)};
 return report;
}
module.exports={buildReferenceMap,literalPath};
if(require.main===module){
 try{
  const args=process.argv.slice(2),get=name=>{const i=args.indexOf(name);if(i<0)return null;if(!args[i+1]||args[i+1].startsWith('--'))throw new Error('Missing value for '+name);return args[i+1]};
  if(args.some((value,i)=>value.startsWith('--')&&!['--root','--output','--check'].includes(value)))throw new Error('Unknown argument');
  const root=path.resolve(get('--root')||process.cwd()),report=buildReferenceMap(root),encoded=JSON.stringify(report,null,2)+'\n',output=get('--output'),check=get('--check');
  if(output&&check)throw new Error('Use only one of --output and --check');
  if(output||check){const destination=path.resolve(root,output||check),relative=path.relative(root,destination);if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw new Error('Report destination must be within root');const inventory=JSON.parse(fs.readFileSync(path.join(root,report.inventory.path),'utf8'));if(inventory.files.some(row=>row.path===relative)||['version.txt',report.inventory.path].includes(relative))throw new Error('Refusing to overwrite a deployment member');let component=root;for(const part of relative.split(path.sep)){component=path.join(component,part);try{const stat=fs.lstatSync(component);if(stat.isSymbolicLink())throw new Error('Report destination must not use symlinks');if(component===destination&&stat.nlink>1)throw new Error('Report destination must not use hardlinks')}catch(e){if(e.code!=='ENOENT')throw e}}if(check){if(fs.readFileSync(destination,'utf8')!==encoded)throw new Error('Reference map is stale')}else{fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,encoded)}console.log(JSON.stringify({build:report.build,...report.summary,report:relative,checked:!!check},null,2))}else process.stdout.write(encoded);
  if(report.summary.errors)process.exitCode=1;
 }catch(e){console.error(e.message);process.exitCode=1}
}
