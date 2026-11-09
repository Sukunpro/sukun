'use strict';
// Fixed native coverage contract. A partial or malformed report must never pass.
const expectedChecks=31;
const sourcePaths=['index.html','nero.html','assets/runtime/berhet-layout-r938.js','assets/runtime/berhet-layout-r938.css','assets/runtime/lower-stats-r1236.js','css/lower-stats-r1236.css','css/practice-flow-r1213.css','assets/runtime/interface-r920.js','assets/runtime/wheels-r924.js','assets/runtime/session-r919.js'];
const testPaths=['tests/seyir-controls/browser.cjs','tests/seyir-controls/evidence.cjs','tests/r1064/browser-fixture.cjs','tests/tefekkur-help/managed-preview.html'];
const digests=(map,keys)=>!!map&&keys.every(key=>typeof map[key]==='string'&&/^[a-f0-9]{64}$/.test(map[key]));
const expectedNames=['current source, test bytes and browser errors'];
for(const mode of ['berhet','esma']){
 expectedNames.push(mode+' no obsolete menu, eye or slider; one original action set');
 for(const width of [320,393,720,1280])expectedNames.push(mode+' responsive automatic cards/actions at '+width);
 expectedNames.push(mode+' hover explains restart without action',mode+' keyboard focus opens help; Escape dismisses only help',mode+' hiding focused restart keeps one usable show button',mode+' full restart cancel preserves selection and progress',mode+' acceptance still uses the native whole-journey reset');
 expectedNames.push(mode+' native Start Pause Continue Finish preserves nonzero progress and one owner');
 for(const lang of ['tr','en'])expectedNames.push(mode+' '+lang+' labels and native hover explanations',mode+' '+lang+' native keyboard explanations preserve reading');
}
const sriError=value=>/integrity|digest|\bSRI\b|syntaxerror|referenceerror|typeerror/i.test(String(value));
function complete(report){
 if(!report||report.expectedChecks!==expectedChecks||report.fatal||report.browserExecuted!==true||report.sourceUnchanged!==true||report.testUnchanged!==true||report.servedHashesValid!==true)return false;
 if(!digests(report.sources,sourcePaths)||!digests(report.testSources,testPaths))return false;
 if(!Array.isArray(report.results)||report.results.length!==expectedChecks||report.results.some(x=>!x||x.passed!==true))return false;
 const names=report.results.map(x=>x.name);if(new Set(names).size!==expectedChecks||expectedNames.some(name=>!names.includes(name)))return false;
 if(report.passed!==expectedChecks||report.total!==expectedChecks)return false;
 if(!Array.isArray(report.browserEvidence)||report.browserEvidence.length!==1)return false;
 return report.browserEvidence.every(e=>e&&Array.isArray(e.pageErrors)&&e.pageErrors.length===0&&Array.isArray(e.consoleErrors)&&!e.consoleErrors.some(sriError)&&e.served&&sourcePaths.filter(name=>name!=='index.html').every(name=>e.served[name]?.sha256===report.sources[name])&&e.served['tests/tefekkur-help/managed-preview.html']?.sha256===report.testSources['tests/tefekkur-help/managed-preview.html']);
}
module.exports={expectedChecks,expectedNames,sourcePaths,testPaths,sriError,complete};
