// Optional native AudioContext + Worker smoke suite. Never installs a browser.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const report={suite:'r1099 native Chromium AudioContext + Worker',started:new Date().toISOString(),status:'pending',passed:[],failed:[],sourceSha256:Object.fromEntries(['assets/runtime/audio-cpu-r981.js','assets/runtime/audio-preparation-r981.js','assets/runtime/studio-preparation-r982.js','assets/generic-recordings/manifest.json'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])),limitations:['Real headless Chromium AudioContext and Worker smoke; no physical Android/Samsung audible-output, microphone or screen-lock acceptance.']};
let server,browser;
try{
  const candidate=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright';
  const {chromium}=require(candidate),executable=[process.env.SUKUN_CHROMIUM,chromium.executablePath(),'/tmp/chromium','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(p=>fs.existsSync(p));
  if(!executable){report.status='skipped';report.reason='Playwright library exists, but no installed Chromium executable is available. No native decoder or physical Android test was performed.';}
  else{
    server=http.createServer((req,res)=>{
      if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><html lang="tr"><meta charset="utf-8"><script src="/assets/runtime/audio-cpu-r981.js"></script><script src="/assets/runtime/audio-preparation-r981.js"></script><script src="/assets/runtime/studio-preparation-r982.js"></script>');return}
      const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.statusCode=404;res.end();return}
      res.setHeader('content-type',file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':'application/octet-stream');fs.createReadStream(file).pipe(res);
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=await chromium.launch({executablePath:executable,headless:true,args:['--no-sandbox']});const page=await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>!!window.SukunStudioPreparation);
    const result=await page.evaluate(async()=>{
      const passed=[],context=new AudioContext({sampleRate:48000});let decodeCalls=0;
      window.SukunAudioDecodeAuthority={decode:(blob,opt)=>window.SukunAudioPreparation.run(blob,bytes=>{decodeCalls++;return context.decodeAudioData(bytes)},opt)};
      const wave=(seconds,rate=8000)=>{const frames=Math.round(seconds*rate),b=new ArrayBuffer(44+frames*2),v=new DataView(b),word=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};word(0,'RIFF');v.setUint32(4,b.byteLength-8,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,frames*2,true);for(let i=0;i<frames;i++)v.setInt16(44+i*2,Math.sin(i/rate*440*2*Math.PI)*8192,true);return new Blob([b],{type:'audio/wav'})};
      const check=(condition,message)=>{if(!condition)throw Error(message)};
      const short=wave(.2),a=await SukunStudioPreparation.process(short,{kind:'analyze'});check(!a.metadataOnly&&a.peak>.2&&a.peak<.3&&a.rms>.1&&a.wave.bins===512,'native short analysis');passed.push('Native AudioContext decode + worker analysis returns measured PCM statistics');
      const n=await SukunStudioPreparation.process(short,{kind:'normalize'});check(n.changed&&n.blob.type==='audio/wav','native normalize');passed.push('Native short normalization returns WAV');
      const long=await SukunStudioPreparation.process(wave(140),{kind:'analyze'});check(long.metadataOnly&&long.dur===140&&long.peak===undefined&&decodeCalls===2,'long metadata decoded');passed.push('140 s WAV read-only inspection invokes no additional native decoder');
      const manifest=await(await fetch('/assets/generic-recordings/manifest.json')).json();const record=manifest.records.find(r=>r.key==='dua:ak'),source=await(await fetch('/assets/generic-recordings/'+record.file)).blob();
      const p=await SukunStudioPreparation.process(source,{kind:'analyze'});check(p.metadataOnly&&p.durationUpperBound&&p.dur>60&&p.dur<=180&&decodeCalls===2,'packaged dua metadata');passed.push('Packaged dua:ak uses read-only metadata without native decode');
      let rejected=false;try{await SukunStudioPreparation.process(source,{kind:'normalize'})}catch(e){rejected=e.code==='PREP_DURATION_LIMIT'}check(rejected&&decodeCalls===2,'long normalize admitted');passed.push('Same cached long WebM remains ineligible for normalization');
      const snapshot=SukunAudioPreparation.snapshot();check(snapshot.workerJobs>=2&&snapshot.maxConcurrent===1&&snapshot.pending===0,'worker serialization');await context.close();return{passed,decodeCalls,snapshot};
    });
    report.status='passed';report.passed=result.passed;report.observations={executable,browserVersion:browser.version(),decodeCalls:result.decodeCalls,snapshot:result.snapshot};
  }
}catch(error){report.status='failed';report.failed.push(error.stack||String(error));process.exitCode=1;}
finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));report.completed=new Date().toISOString();fs.writeFileSync(path.join(here,'native-browser-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
