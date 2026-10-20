#!/usr/bin/env node
'use strict';
// Re-run historical controlled suites against the referenced production runtime.
// Only immutable asset path strings are adapted. Four historical expectations
// that kept a disabled secondary layer audible are explicit supersessions, not
// passes; current stale-authority replacements must freshly pass as well.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const startedAt=new Date().toISOString(),candidate=process.argv.includes('--candidate'),args=process.argv.slice(2).filter(x=>x!=='--candidate');
const root=path.resolve(args[0]||path.join(__dirname,'../..')),output=args[1]?path.resolve(args[1]):null;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function runtime(stem){const referenced=html.match(new RegExp('<script\\s+[^>]*src=["\\\']\\./(assets/runtime/'+stem+'-r\\d+\\.js)(?:\\?[^"\\\']*)?["\\\']'))?.[1];assert(referenced,'Missing runtime '+stem);return {referenced,tested:candidate?'assets/runtime/'+stem+'-r1121.js':referenced};}
const controller=runtime('background-mix'),renderer=runtime('background-mix-render');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'sukun-r1121-handoff-'));
function runHistorical(relative){
 const source=fs.readFileSync(path.join(root,relative),'utf8');let adapted=source;
 const edits=[];
 for(const [old,replacement,referenced]of [['assets/runtime/background-mix-r1059.js',controller.tested,controller.referenced],['assets/runtime/background-mix-render-r1059.js',renderer.tested,renderer.referenced]]){
  const count=adapted.split(old).length-1;if(!count)continue;
  // Candidate-only audit precedes entrypoint wiring, so preserve the existing
  // HTML reference assertion while adapting its runtime loader/report paths.
  if(candidate&&old===controller.tested)continue;
  if(candidate&&referenced!==replacement){const quoted="'"+old+"'";const changed=adapted.split(quoted).length-1;adapted=adapted.split(quoted).join(JSON.stringify(replacement));if(changed)edits.push({from:old,to:replacement,occurrences:changed});}
  else {adapted=adapted.split(old).join(replacement);edits.push({from:old,to:replacement,occurrences:count});}
 }
 const file=path.join(scratch,path.basename(path.dirname(relative))+'-'+path.basename(relative));fs.writeFileSync(file,adapted);
 const child=spawnSync(process.execPath,[file,root],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
 let report;try{report=JSON.parse(child.stdout);}catch(e){throw Error(relative+' did not produce JSON: '+child.stderr+' '+child.stdout);}
 return {test:relative,testSha256:hash(source),adaptedTestSha256:hash(adapted),pathAdaptations:edits,exitCode:child.status,stderr:child.stderr,report};
}
let report;
try{
 const controllerRun=runHistorical('tests/r1059/background-mix.cjs'),lockRun=runHistorical('tests/r1061/background-lock.cjs');
 const superseded=new Map();for(const outcome of ['resolve','reject'])for(const method of ['changed','prepare'])superseded.set('Returning to accepted selection via '+method+' survives stale render '+outcome,{method,outcome});
 const lockRows=lockRun.report.results.map(row=>{
  const replacement=superseded.get(row.name);
  if(row.status==='FAIL'&&replacement&&/\+ ''\n- 'blob:lock-test-\d+'/.test(row.error||''))return {...row,originalStatus:row.status,status:'SUPERSEDED',reason:'The historical test requires a disabled secondary layer to remain audible during preparation; r1121 must stop that PCM immediately.',replacements:['Non-attenuating A to B to A via '+replacement.method+' survives stale '+replacement.outcome,'Secondary mute and restore via '+replacement.method+' survives stale '+replacement.outcome+' without replaying disabled audio']};
  return row;
 });
 const replacementOutput=path.join(scratch,'current-contract.json'),replacementPath='tests/r1121/frequency-handoff-contract.cjs';
 const child=spawnSync(process.execPath,[path.join(root,replacementPath),root,replacementOutput,...(candidate?['--candidate']:[])],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
 const replacements=JSON.parse(fs.readFileSync(replacementOutput,'utf8'));
 const rows=[...controllerRun.report.results,...lockRows];
 const failures=rows.filter(x=>x.status==='FAIL');
 const expectedSupersessions=lockRows.filter(x=>x.status==='SUPERSEDED').length;
 const replacementsVerified=lockRows.filter(x=>x.status==='SUPERSEDED').every(row=>row.replacements.every(name=>replacements.results.some(x=>x.name===name&&x.passed===true)));
 const excluded=rows.filter(x=>['SKIP','SUPERSEDED'].includes(x.status));
 const passed=rows.filter(x=>x.status==='PASS').length+replacements.passed,total=rows.length-excluded.length+replacements.total,skipped=rows.filter(x=>x.status==='SKIP').length;
 const allRequiredPassed=failures.length===0&&expectedSupersessions===4&&replacementsVerified&&replacements.allPassed===true&&child.status===0&&controllerRun.exitCode===0&&lockRun.exitCode===1;
 report={suite:'r1121 source-bound historical frequency handoff regressions',startedAt,finishedAt:new Date().toISOString(),testSha256:hash(fs.readFileSync(__filename)),candidateOverride:candidate,method:'Fresh Node VM/source runs with only explicit immutable runtime path adaptations; four contradicted historical assumptions retain SUPERSEDED non-pass status and their new replacements are executed. No browser, native audio rendering, acoustic or physical-device acceptance.',controller:{...controller,sha256:hash(fs.readFileSync(path.join(root,controller.tested)))},renderer:{...renderer,sha256:hash(fs.readFileSync(path.join(root,renderer.tested)))},passed,total,totalMeaning:'Applicable freshly executed invariants only; excluded historical expectations are not counted as passes.',historicalExecuted:rows.length,excluded,failed:failures.length+(replacements.total-replacements.passed),skipped,superseded:expectedSupersessions,allRequiredPassed,allPassed:allRequiredPassed,allPassedMeaning:'All required current contracts pass; explicitly counted historical supersessions and unavailable-baseline skip are not passes.',historicalController:controllerRun,historicalLock:{...lockRun,report:{...lockRun.report,results:lockRows}},replacementContract:replacements};
}catch(error){report={suite:'r1121 source-bound historical frequency handoff regressions',startedAt,finishedAt:new Date().toISOString(),allPassed:false,allRequiredPassed:false,fatal:error.stack};}
finally{fs.rmSync(scratch,{recursive:true,force:true});}
const json=JSON.stringify(report,null,2)+'\n';if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,json);}console.log(json);if(!report.allRequiredPassed)process.exitCode=1;
