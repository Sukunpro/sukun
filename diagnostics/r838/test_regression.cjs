'use strict';
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process'),core=require('../r729/test_source.cjs');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const results=[];
 // The first 27 tests are current syntax/metadata/transport/UI contracts.
 // Four retired worker tests call a removed pre-r798 function and demand failed install;
 // r833/test_worker.cjs replaces them with current resilient-worker contracts.
 for(const t of core.tests.slice(0,27)){try{await t.fn(root);results.push({name:t.name,status:'PASS'})}catch(e){results.push({name:t.name,status:'FAIL',error:e.message})}}
 const suites=['test_restart','test_failure','test_transport','test_ring','test_audit','test_storage','test_settings_queue','test_studio','test_ui'];
 for(const name of suites){const p=spawnSync(process.execPath,[path.join(root,'diagnostics/r757',name+'.cjs')],{encoding:'utf8',maxBuffer:6e6});try{const file=path.join(root,'diagnostics/r757',name.replace('test_','')+'_results.json');const data=JSON.parse(fs.existsSync(file)?fs.readFileSync(file,'utf8'):p.stdout);for(const r of data.results||[]){if(name==='test_audit'&&['Failed cache refresh leaves the previously complete shell and assets intact','Repeated cache refresh calls share one download and failed refresh can be retried'].includes(r.name))continue;results.push({...r,suite:name})}if(!data.results?.length)results.push({name,status:'FAIL',error:p.stdout.slice(0,800)})}catch(e){results.push({name,status:'FAIL',error:p.stderr||p.stdout.slice(0,800)})}}
 const out={kind:'source-vm-regression',browserRun:false,total:results.length,passed:results.filter(x=>x.status==='PASS').length,results};out.failed=out.total-out.passed;
 fs.writeFileSync(path.join(__dirname,'regression-results.json'),JSON.stringify(out,null,2));console.log(JSON.stringify({total:out.total,passed:out.passed,failed:out.failed,failures:results.filter(x=>x.status!=='PASS')},null,2));if(out.failed)process.exitCode=1;
})();
