'use strict';
const assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),path=require('node:path');
const result=spawnSync(process.execPath,[path.join(__dirname,'browser.cjs'),'--check-source'],{encoding:'utf8'});
assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);assert.equal(report.expectedChecks,18);assert.equal(report.browserExecuted,false);console.log(result.stdout.trim());
