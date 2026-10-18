'use strict';
// Full shipped Classic/Feyz application, native Chromium decoding, worker and
// IndexedDB. Generated disposable WAVs only; no user audio or microphone.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,hash}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const output=path.resolve(process.argv[3]||path.join(root,'tests/r1096/browser-results.json'));
const baseline=process.argv.includes('--baseline');
const report={build:fs.readFileSync(path.join(root,'version.txt'),'utf8').trim(),baseline,method:'Full original app bytes in disposable Linux Chromium; native IndexedDB, AudioContext decode and CPU worker. Generated WAV fixtures; controlled device-voice metadata and blocked service workers from the shared fixture. No microphone, physical Android, audible output or screen-lock claim.',checks:[]};
const save=()=>{report.passed=report.checks.filter(x=>x.passed).length;report.total=report.checks.length;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));};
(async()=>{
 const f=await fixture(root),p=f.page;
 const view=()=>p.evaluate(()=>({key:R170.Studio.key,duration:document.getElementById('r170Dur').textContent,peak:document.getElementById('r170Peak').textContent,size:document.getElementById('r170Size').textContent,status:document.getElementById('r170StudioStat').textContent,preparation:SukunAudioPreparation.snapshot(),count:SukunSessionState.snapshot().count,phase:SukunSessionState.snapshot().phase}));
 const check=async(name,fn)=>{try{report.checks.push({name,passed:true,evidence:await fn()});}catch(e){report.checks.push({name,passed:false,error:e.stack||String(e),view:await view().catch(()=>null)});}save();};
 const idle=()=>p.waitForFunction(()=>!R170.Studio.analysisTask&&!R170.Studio.edit&&SukunAudioPreparation.snapshot().pending===0,null,{timeout:30000});
 const choose=async key=>{await p.locator('#r170StudioSel').selectOption(key);await idle();return await view();};
 try{
  await p.waitForFunction(()=>!!window.R170?.Studio&&!!document.getElementById('r170StudioSel'));
  await p.locator('.tab[data-t="zkr"]').click();
  if(await p.locator('#r938PanelToggle').getAttribute('aria-expanded')!=='true')await p.locator('#r938PanelToggle').click();
  if(await p.locator('#r920More').getAttribute('aria-expanded')!=='true')await p.locator('#r920More').click();
  await p.evaluate(async()=>{
   const wav=(seconds,channels=1,rate=8000)=>{const n=Math.round(seconds*rate),a=new ArrayBuffer(44+n*channels*2),v=new DataView(a),word=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};word(0,'RIFF');v.setUint32(4,a.byteLength-8,true);word(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,channels,true);v.setUint32(24,rate,true);v.setUint32(28,rate*channels*2,true);v.setUint16(32,channels*2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,n*channels*2,true);for(let i=0;i<n;i++)for(let c=0;c<channels;c++)v.setInt16(44+(i*channels+c)*2,Math.round(Math.sin(i*2*Math.PI*330/rate)*20316),true);return new Blob([a],{type:'audio/wav'});};
   // A separate 48-kHz trim fixture contains half a second of silence at each
   // end. Matching the decoded rate also makes the saved byte reduction real.
   const trimBytes=await wav(3,1,48000).arrayBuffer(),trimView=new DataView(trimBytes);
   for(let i=0;i<144000;i++)if(i<24000||i>=120000)trimView.setInt16(44+i*2,0,true);
   window.__durationFixtures={'temel:0':wav(2),'temel:1':wav(61),'temel:2':new Blob([new Uint8Array(8*1024*1024+1)],{type:'audio/wav'}),'temel:3':wav(30,2),'temel:4':wav(49),'temel:5':new Blob([trimBytes],{type:'audio/wav'}),'temel:6':wav(2)};
   for(const [key,blob]of Object.entries(__durationFixtures))await REC_DB.set(key,blob);
   window.__durationDigest=async key=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await(await REC_DB.get(key)).arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join('');
   window.__durationBefore={};for(const key of Object.keys(__durationFixtures))__durationBefore[key]=await __durationDigest(key);
   for(let e=document.getElementById('r170Studio');e&&e!==document.body;e=e.parentElement)if(e.tagName==='DETAILS')e.open=true;
  });
  await p.waitForFunction(()=>document.getElementById('r170StudioSel').querySelectorAll('option').length>=5);
  await check('Two-second recording uses the native decoder and CPU worker',async()=>{const s=await choose('temel:0');assert.match(s.duration,/2[.,]0/);assert.equal(s.peak,'62%');assert.equal(s.preparation.pending,0);assert(s.preparation.workerJobs>0);assert.equal(s.preparation.fallbackJobs,0);assert.match(s.status,/Hazır|Ready/);return s;});
  await check(baseline?'Baseline reproduces stale two-second measurements after rejecting a different 61-second recording':'Over-duration selection clears previous measurements and reports the distinct duration limit',async()=>{const s=await choose('temel:1');assert.equal(s.preparation.last.code,baseline?'PREP_MEMORY_LIMIT':'PREP_DURATION_LIMIT');if(baseline)assert.match(s.duration,/2[.,]0/);else{for(const k of ['duration','peak','size'])assert.equal(s[k],'—');assert.match(s.status,/60/);}return s;});
  if(!baseline){
   await check('Oversized source reports the file limit without stale measurements or native decode',async()=>{const before=(await view()).preparation.decodeStarts,s=await choose('temel:2');assert.equal(s.preparation.last.code,'PREP_SOURCE_LIMIT');assert.equal(s.preparation.decodeStarts,before);assert.match(s.status,/8/);assert.equal(s.duration,'—');return s;});
   await check('Thirty-second stereo recording is classified as memory pressure before decoding',async()=>{const before=(await view()).preparation.decodeStarts,s=await choose('temel:3');assert.equal(s.preparation.last.code,'PREP_MEMORY_LIMIT');assert.equal(s.preparation.decodeStarts,before);assert.match(s.status,/bellek|memory/i);assert.doesNotMatch(s.status,/60/);assert.equal(s.duration,'—');return s;});
   await check('Returning to a valid recording restores current measurements',async()=>{const s=await choose('temel:0');assert.match(s.duration,/2[.,]0/);assert.match(s.status,/Hazır|Ready/);return s;});
   await check('Normalize commits real WAV bytes and displays the current peak',async()=>{await p.locator('#r170Norm').click();await idle();const s=await view();assert.equal(s.peak,'92%');assert.match(s.status,/Normalize|Normalis/);assert.notEqual(await p.evaluate(()=>__durationDigest('temel:0')),await p.evaluate(()=>__durationBefore['temel:0']));return s;});
   await check('Silence trim uses the native decoder and CPU worker, saves a shorter WAV and leaves other recordings unchanged',async()=>{
    const before=await choose('temel:5');assert.match(before.duration,/3[.,]0/);
    const untouched=await p.evaluate(async()=>{const out={};for(const key of Object.keys(__durationFixtures))if(key!=='temel:5')out[key]=await __durationDigest(key);return out;});
    await p.locator('#r170Trim').click();await idle();const s=await view(),seconds=Number.parseFloat(s.duration.replace(',','.'));
    assert(seconds>=2&&seconds<=2.3,s.duration);assert.match(s.status,/sessizlik kırpıldı|silence trimmed/i);
    assert(s.preparation.workerJobs>=before.preparation.workerJobs+2);assert.equal(s.preparation.fallbackJobs,before.preparation.fallbackJobs);
    const stored=await p.evaluate(async()=>{const blob=await REC_DB.get('temel:5'),v=new DataView(await blob.arrayBuffer()),others={};for(const key of Object.keys(__durationFixtures))if(key!=='temel:5')others[key]=await __durationDigest(key);return{before:__durationBefore['temel:5'],after:await __durationDigest('temel:5'),beforeBytes:__durationFixtures['temel:5'].size,bytes:blob.size,duration:v.getUint32(40,true)/v.getUint32(28,true),others};});
    assert.notEqual(stored.after,stored.before);assert(stored.bytes<stored.beforeBytes*.9);assert(stored.duration>=2&&stored.duration<=2.3);assert.deepEqual(stored.others,untouched);
    return{beforeDuration:before.duration,view:s,stored};
   });
   await check('A committed edit remains explicitly saved when expanded WAV exceeds the subsequent analysis budget',async()=>{let s=await choose('temel:4');assert.match(s.duration,/49[.,]0/);await p.locator('#r170Norm').click();await idle();s=await view();assert.equal(s.preparation.last.code,'PREP_MEMORY_LIMIT');assert.match(s.status,/kaydedildi/);assert.match(s.status,/analizi tamamlanamadı/);assert.doesNotMatch(s.status,/Asıl kayıt korundu|Değişiklik kaydedilmedi/);assert.equal(s.duration,'—');const stored=await p.evaluate(async()=>({before:__durationBefore['temel:4'],after:await __durationDigest('temel:4'),bytes:(await REC_DB.get('temel:4')).size}));assert.notEqual(stored.before,stored.after);assert(stored.bytes>4000000);return{view:s,stored};});
   await check('Native IndexedDB commit remains saved after immediate cancellation without analysing or overwriting a newer selection',async()=>{
    const results=[];
    for(const invalidation of ['abort','selection']){
     await p.evaluate(()=>REC_DB.set('temel:6',__durationFixtures['temel:6']));await choose('temel:6');
     await p.evaluate(mode=>{
      const originalSet=REC_DB.set,button=document.getElementById('r170Norm'),originalClick=button.onclick;
      window.__studioCommitRace={mode,hit:0,result:null,restore(){REC_DB.set=originalSet;button.onclick=originalClick;}};
      // Invalidate only after the real guarded native IDB write has fulfilled,
      // but before studioEdit can resume at its post-commit jobCheck.
      REC_DB.set=async function(key,blob,options){
       const result=await originalSet.call(this,key,blob,options),race=__studioCommitRace;
       if(key==='temel:6'&&!race.hit){
        race.hit++;race.decodeStarts=SukunAudioPreparation.snapshot().decodeStarts;
        if(mode==='abort')R170.Studio.edit.controller.abort();
        else{
         const select=document.getElementById('r170StudioSel');select.value='temel:0';select.dispatchEvent(new Event('change',{bubbles:true}));
         // This represents UI supplied by the newly selected recording. The
         // completed old edit must neither replace it nor analyse that key.
         race.selectedStatus='New selection owns this status';document.getElementById('r170StudioStat').textContent=race.selectedStatus;
        }
       }
       return result;
      };
      button.onclick=function(event){const pending=originalClick.call(this,event);Promise.resolve(pending).then(value=>{__studioCommitRace.result={value};},error=>{__studioCommitRace.result={error:String(error)};});return pending;};
     },invalidation);
     try{
      await p.locator('#r170Norm').click();await idle();await p.waitForFunction(()=>!!__studioCommitRace.result);
      const s=await view(),race=await p.evaluate(async()=>({mode:__studioCommitRace.mode,hit:__studioCommitRace.hit,result:__studioCommitRace.result,decodeStarts:__studioCommitRace.decodeStarts,selectedStatus:__studioCommitRace.selectedStatus,before:__durationBefore['temel:6'],after:await __durationDigest('temel:6')}));
      assert.equal(race.hit,1);assert.deepEqual(race.result,{value:true});assert.notEqual(race.after,race.before,'The native IDB bytes must already contain the edited WAV');
      assert.equal(s.preparation.decodeStarts,race.decodeStarts,'Post-commit cancellation must not start follow-on native analysis');
      for(const k of ['duration','peak','size'])assert.equal(s[k],'—');
      assert.doesNotMatch(s.status,/Asıl kayıt korundu|Değişiklik kaydedilmedi/);
      if(invalidation==='abort'){assert.equal(s.key,'temel:6');assert.match(s.status,/kaydedildi/);assert.match(s.status,/analizi tamamlanamadı/);}
      else{assert.equal(s.key,'temel:0');assert.equal(s.status,race.selectedStatus);}
      results.push({race,view:s});
     }finally{await p.evaluate(()=>__studioCommitRace.restore());}
    }
    return results;
   });
   await check('Empty selection clears all measurements',async()=>{const s=await choose('');for(const k of ['duration','peak','size'])assert.equal(s[k],'—');return s;});
   await check('Rejected originals retain their exact native IndexedDB bytes',async()=>{const values=await p.evaluate(async()=>{const out={};for(const key of ['temel:1','temel:2','temel:3'])out[key]={before:__durationBefore[key],after:await __durationDigest(key)};return out;});for(const x of Object.values(values))assert.equal(x.after,x.before);return values;});
   await check('Limits are visible in Turkish and English and remain separate from capture',async()=>{const a=await p.locator('#r170StudioLimits').textContent();assert.match(a,/60/);assert.match(a,/8/);await p.evaluate(()=>{I18N.set('en');});const b=await p.locator('#r170StudioLimits').textContent();assert.match(b,/60/);assert.match(b,/8/);assert.match(b,/processing|Studio/i);return{tr:a,en:b};});
  }
  await check('Complete app has no JavaScript/SRI faults and all served bytes match disk',async()=>{const e=f.evidence();assert.deepEqual(e.pageErrors,[]);assert(!e.consoleErrors.some(s=>/integrity|digest|syntaxerror|referenceerror|typeerror/i.test(s)),e.consoleErrors.join('\n'));assert.deepEqual(e.failedRequests,[]);for(const [name,row]of Object.entries(e.served))assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,name))));return{files:Object.keys(e.served).length,failedRequests:e.failedRequests};});
 }finally{report.browser=f.browser.version();await f.close();save();}
 console.log(JSON.stringify({output,build:report.build,baseline,passed:report.passed,total:report.total,failures:report.checks.filter(x=>!x.passed)},null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
