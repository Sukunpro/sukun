'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {fixture}=require('../r1064/browser-fixture.cjs');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'r1250-readings.json');
const report={checks:[],limitations:['Controlled device speech; no physical phone or audible tajwid review.']};
(async()=>{let f;try{
 for(const width of [390,1440]){
  f=await fixture(root,{width,height:900});const p=f.page;
  await p.evaluate(()=>{SukunReadingUIR1064.mount();SukunReadingUIR1064.render()});
  for(const [key,n] of [['abese',42],['tarik',17]]){
   const result=await p.evaluate(({key})=>{
    const id='reading:'+key,r=SukunReadingSourcesR1064.get(id),box=document.getElementById('surah-'+key);
    if(!box)throw Error('Missing reading '+key);box.open=true;
    return {count:r.verses.length,rows:box.querySelectorAll('.r1064-verse').length,bundle:SukunBundledArabicR1065.descriptor(id)?.key,arabic:r.arabic,latin:r.latin,meaning:r.meaning,buttons:[...box.querySelectorAll('button')].map(b=>b.textContent),key:r.recordingKeys[0]};
   },{key});assert.equal(result.count,n);assert.equal(result.rows,n);assert.equal(result.bundle,key);assert.equal(result.key,'dua:'+key);assert(result.arabic&&result.latin&&result.meaning);assert(!result.buttons.includes('undefined'));
   report.checks.push({name:width+' '+key+' complete reader mounted',passed:true});
   await p.evaluate(async key=>{await SukunVoiceSettings.setMode('auto');window.__newPlay=SukunReadingAudioR1064.play({id:'reading:'+key,content:'arabic',source:'auto'});},key);
   await p.waitForFunction(key=>{const s=SukunReadingAudioR1064.snapshot();return s.id==='reading:'+key&&s.sourceKind==='bundled'&&s.phase==='playing'&&window.__sukJourneyNative?.a?.currentTime>.15&&!__sukJourneyNative.a.paused},key,{timeout:30000});
   assert.equal(await p.evaluate(()=>SukunReadingAudioR1064.pause()),true);await p.waitForFunction(()=>SukunReadingAudioR1064.snapshot().phase==='paused'&&__sukJourneyNative.a.paused);await p.waitForTimeout(220);
   assert.equal(await p.evaluate(()=>SukunReadingAudioR1064.resume()),true);await p.waitForFunction(()=>SukunReadingAudioR1064.snapshot().phase==='playing');
   await p.evaluate(()=>SukunReadingAudioR1064.stop());
   report.checks.push({name:width+' '+key+' native bundled play pause resume stop',passed:true});
  }
  const data=await p.evaluate(()=>['zikir:temel:4','zikir:koruma:5','zikir:koruma:6'].map(id=>{const x=SukunReadingSourcesR1064.get(id);return {id:x.id,key:x.recordingKeys[0],ar:x.arabic,meaning:x.meaning}}));
  for(const x of data){assert.equal(x.key,x.id.slice(6));assert(x.ar&&x.meaning);assert(!x.ar.includes('أَعُوذُ'))}
  report.checks.push({name:width+' Quran dhikr IDs and separate supplemental dua',passed:true});
  assert.equal(f.errors.length,0,f.errors.join('\n'));assert(!f.consoleErrors.some(x=>/integrity|syntaxerror|referenceerror|typeerror/i.test(x)),f.consoleErrors.join('\n'));
  await f.close();f=null;
 }
}catch(e){report.checks.push({name:'new reading browser acceptance',passed:false,error:e.stack,state:await f?.page.evaluate(()=>({reader:SukunReadingAudioR1064.snapshot(),native:window.__sukJourneyNative?{paused:__sukJourneyNative.a.paused,time:__sukJourneyNative.a.currentTime}:null,life:{paused:AudioLife.userPaused,terminal:AudioLife._terminalIntent},aggregate:SukunAudioSessionRegistry.aggregateSnapshot()})).catch(()=>null)});process.exitCode=1}
finally{if(f)await f.close();report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report));}})();
