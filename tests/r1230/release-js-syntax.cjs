'use strict';
const assert=require('node:assert/strict');
const {modulePaths,retiredModulePaths,checkRuntimeSyntax,checkModuleGraph}=require('../../tools/release-js-syntax.cjs');
let checks=0;function ok(fn){fn();checks++;}
ok(()=>assert.deepEqual(modulePaths,[]));
ok(()=>assert.equal(checkRuntimeSyntax('assets/runtime/classic.js','var x = 1;'),'classic'));
ok(()=>assert.throws(()=>checkRuntimeSyntax('assets/runtime/classic.js','var = ;')));
ok(()=>assert.throws(()=>checkRuntimeSyntax('assets/runtime/classic.js','export const x = 1;')));
ok(()=>assert.throws(()=>checkRuntimeSyntax(retiredModulePaths[0],"import * as X from './x.js';")));
ok(()=>assert.throws(()=>checkRuntimeSyntax(retiredModulePaths[1],"export const x = 1;")));
ok(()=>assert.equal(checkModuleGraph(['assets/runtime/player.js']),true));
for(const file of retiredModulePaths)ok(()=>assert.throws(()=>checkModuleGraph([file])));
ok(()=>assert.throws(()=>checkModuleGraph([...retiredModulePaths,...retiredModulePaths])));
console.log(JSON.stringify({passed:checks,scope:'Static classic runtime syntax and retired module-graph rejection, not browser or service-worker acceptance'}));
