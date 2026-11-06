'use strict';
const assert=require('node:assert/strict');
const {modulePaths,checkRuntimeSyntax,checkModuleGraph}=require('../../tools/release-js-syntax.cjs');
let checks=0;function ok(fn){fn();checks++;}
ok(()=>assert.equal(checkRuntimeSyntax(modulePaths[0],"import * as X from './x.js'; export const x = 1;"),'module'));
ok(()=>assert.equal(checkRuntimeSyntax('assets/runtime/classic.js','var x = 1;'),'classic'));
ok(()=>assert.throws(()=>checkRuntimeSyntax(modulePaths[0],"export const = ;")));
ok(()=>assert.throws(()=>checkRuntimeSyntax(modulePaths[1],"import { from './x.js'")));
ok(()=>assert.throws(()=>checkRuntimeSyntax('assets/runtime/classic.js','var = ;')));
ok(()=>assert.throws(()=>checkRuntimeSyntax('assets/runtime/classic.js','export const x = 1;')));
const src="import * as THREE from '../vendor/three-r170/three.module.min.js';";
ok(()=>assert.equal(checkModuleGraph(modulePaths,src),true));
ok(()=>assert.throws(()=>checkModuleGraph([modulePaths[0]],src)));
ok(()=>assert.throws(()=>checkModuleGraph([...modulePaths,modulePaths[0]],src)));
ok(()=>assert.throws(()=>checkModuleGraph(modulePaths,"import * as THREE from 'https://example.com/three.js';")));
console.log(JSON.stringify({passed:checks,scope:'Static syntax and explicitly declared module-graph checks, not a browser or service-worker test'}));
