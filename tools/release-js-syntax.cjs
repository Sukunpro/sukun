'use strict';
// The retired Cymatics renderer was the only ES-module dependency. Every
// current runtime must parse as a classic script; no module is allowlisted.
const vm=require('node:vm');
const retiredModulePaths=Object.freeze(['assets/runtime/cymatics-3d.js','assets/vendor/three-r170/three.module.min.js']);
const modulePaths=Object.freeze([]);
function checkRuntimeSyntax(path,source){
 new vm.Script(source,{filename:path});return 'classic';
}
function checkModuleGraph(paths){
 for(const p of retiredModulePaths)if(paths.includes(p))throw Error('Retired runtime module remains: '+p);
 return true;
}
module.exports={modulePaths,retiredModulePaths,checkRuntimeSyntax,checkModuleGraph};
