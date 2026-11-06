'use strict';
// Two explicitly declared ES modules are parsed as modules; all other runtime
// JavaScript remains under the existing classic-script parser. Nothing executes.
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const modulePaths=Object.freeze(['assets/runtime/cymatics-3d.js','assets/vendor/three-r170/three.module.min.js']);
function checkRuntimeSyntax(path,source){
 if(!modulePaths.includes(path)){new vm.Script(source,{filename:path});return 'classic';}
 const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:source,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error((result.stderr||'Module syntax check failed').trim());
 return 'module';
}
function checkModuleGraph(paths,source){
 for(const p of modulePaths){if(paths.filter(x=>x===p).length!==1)throw Error('Expected exactly one runtime module: '+p);}
 if(!/^\s*import\s+\*\s+as\s+THREE\s+from\s+['"]\.\.\/vendor\/three-r170\/three\.module\.min\.js['"]\s*;/m.test(source))throw Error('Unexpected Three.js module import');
 return true;
}
module.exports={modulePaths,checkRuntimeSyntax,checkModuleGraph};
