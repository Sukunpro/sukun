'use strict';
// Re-run the exact shipped dhikr integration contracts against one source tree.
// Every child runs from the selected tree, including legacy tests using __dirname.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||'/tmp/r1121-dhikr-source-regressions.json');
const scripts=['tests/r1062/dhikr-pause-scope.cjs','tests/r1058/stop-scope.cjs','tests/r1055/generic-priority.cjs','tests/r1065/audio-priority.cjs','tests/r1090/direct-restart.cjs','tests/r1062/direct-native-pause.cjs','tests/r1070/owner-release-start.cjs','tests/r1074/session-holds.cjs'];
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const digest=name=>hash(fs.readFileSync(path.join(root,name)));
const production=['index.html','nero.html',...fs.readdirSync(path.join(root,'assets/runtime')).filter(n=>n.endsWith('.js')).map(n=>'assets/runtime/'+n)];
const sourceHashes=Object.fromEntries(production.map(name=>[name,digest(name)]));
const testSourceHashes={};
function collect(name){if(testSourceHashes[name])return;testSourceHashes[name]=digest(name);const code=fs.readFileSync(path.join(root,name),'utf8');for(const match of code.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)){const dependency=path.resolve(root,path.dirname(name),match[1]);if(dependency.startsWith(root+path.sep)&&fs.existsSync(dependency)&&fs.statSync(dependency).isFile())collect(path.relative(root,dependency));}}
scripts.forEach(collect);
const results=[];
for(const script of scripts){const start=Date.now();const run=cp.spawnSync(process.execPath,[path.join(root,script),root],{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});let evidence=null,parseError=null;try{evidence=JSON.parse(run.stdout);}catch(error){parseError=String(error.message);}
 const checks=Array.isArray(evidence?.results)?evidence.results:Array.isArray(evidence?.tests)?evidence.tests:[];
 const total=Number(evidence?.total||(typeof evidence?.tests==='number'?evidence.tests:checks.length));
 const passed=typeof evidence?.passed==='number'?evidence.passed:checks.filter(row=>row.passed===true||row.ok===true||row.pass===true||row.status==='PASS').length;
 results.push({script,exitCode:run.status,error:run.error?String(run.error):null,parseError,seconds:(Date.now()-start)/1000,passed,total,allPassed:run.status===0&&!parseError&&total>0&&passed===total,stderr:run.stderr,evidence});
}
const changed=production.filter(name=>sourceHashes[name]!==digest(name));
const report={suite:'r1121 source-bound dhikr/ambience/frequency scope regressions',sourceRoot:root,sourceBuild:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),sourceHashes,testSourceHashes,runnerSha256:hash(fs.readFileSync(__filename)),groups:results.length,passedGroups:results.filter(x=>x.allPassed).length,passed:results.reduce((n,x)=>n+x.passed,0),total:results.reduce((n,x)=>n+x.total,0),allPassed:changed.length===0&&results.every(x=>x.allPassed),changedDuringRun:changed,results,limitations:['Controlled-source Node/VM tests with explicitly mocked clocks, DOM/media/recording leaves, and owner endpoints where noted in each child report. Not native browser or physical Android/lockscreen acceptance.']};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,groups:report.groups,passedGroups:report.passedGroups,passed:report.passed,total:report.total,allPassed:report.allPassed,changedDuringRun:changed}));if(!report.allPassed)process.exitCode=1;
