'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const root = path.resolve(process.argv[2] || '.');
const {fixture} = require(process.env.SUKUN_TEST_FIXTURE || path.join(root,'tests/r1064/browser-fixture.cjs'));
// This disposable browser receives Chromium's synthetic microphone. An OS input is never used.
process.env.SUKUN_TEST_CHROMIUM = process.env.CHROMIUM_PATH || require('playwright').chromium.executablePath();
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'sukun-microphone-'));
const launcher = path.join(work, 'browser');
fs.writeFileSync(launcher, '#!/bin/sh\nexec "$SUKUN_TEST_CHROMIUM" --use-fake-device-for-media-stream --use-fake-ui-for-media-stream "$@"\n', {mode:0o700});
process.env.CHROMIUM_PATH = launcher;
process.on('exit',()=>fs.rmSync(work,{recursive:true,force:true}));
(async () => {
 const app = await fixture(root, {width: 393, height: 873, hasTouch: true, seed: {'sukun.obDone':'1'}});
 const page = app.page;
 const origin = new URL(app.origin).origin;
 const alerts = [];
 page.on('dialog', async d => { alerts.push(d.message()); await d.accept(); });
 const stored = () => page.evaluate(async () => {
  const b = await REC_DB.get(hzvKey(1));
  if (!b) return null;
  const data = await b.arrayBuffer();
  const sum = [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))]
    .map(x => x.toString(16).padStart(2,'0')).join('');
  return {size: b.size, sum, type:b.type};
 });
 try {
  // Match the tap target in the screenshot. Close first-start overlays in this disposable profile.
  await page.evaluate(() => { window.obClose?.(); document.querySelector('#dcClose')?.click(); });
  await page.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
  await page.locator('.tab[data-t="zkr"]').click();
  await page.evaluate(() => SukunPracticeUI.openSection('zmgOkumalar', {reveal:false}));
  const ancestors = await page.locator('#hzvBox').evaluate(el => {
   const list=[]; for(let p=el.parentElement;p;p=p.parentElement) if (p.tagName==='DETAILS') list.push(p.id);
   return list.reverse();
  });
  for (const id of ancestors) {
   const detail = page.locator('#'+id);
   if (!await detail.evaluate(el=>el.open)) await detail.locator(':scope > summary').click();
  }
  const box=page.locator('#hzvBox');
  if (!await box.evaluate(el=>el.open)) await box.locator(':scope > summary').click();
  const mic = page.locator('#hzvKisim [data-hzv-action="kayit"][data-index="1"]');
  const chooser=page.locator('#hzvKayitOnizleme');
  const intro=()=>page.evaluate(()=>({busy:HZV_REC_BUSY,recording:HZV_REC?.state,origin:location.origin,rec:typeof MediaRecorder,open:document.querySelector('#hzvBox')?.open}));
  await page.evaluate(() => {
    const gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    window.qaMic={errors:[],calls:[]};
    navigator.mediaDevices.getUserMedia = (...args) => {
      const q=window.qaMic;
      q.calls.push(JSON.parse(JSON.stringify(args[0])));
      const e=q.errors.shift();
      return e ? Promise.reject(new DOMException('Injected input failure',e)) : gum(...args);
    };
  });
  await app.context.grantPermissions(['microphone'],{origin});
  await mic.click();
  await page.waitForFunction(()=>HZV_REC?.state==='recording',null,{timeout:8000}).catch(async e=>{console.log('start failure',await intro(),alerts,app.errors);throw e;});
  await page.waitForTimeout(1400);
  await mic.click();
  await chooser.waitFor();
  assert.equal(await stored(),null,'Nothing written before explicit approval');
  await chooser.locator('[data-draft="save"]').click();
  await chooser.waitFor({state:'hidden'});
  const initial=await stored();
  assert(initial && initial.size>800,JSON.stringify(initial));
  console.log('Real getUserMedia, MediaRecorder, preview and approved IndexedDB write', initial);
  await mic.click();
  await page.waitForFunction(()=>HZV_REC?.state==='recording');
  await page.waitForTimeout(1300);
  await mic.click();
  await chooser.waitFor();
  await chooser.locator('[data-draft="cancel"]').click();
  assert.deepEqual(await stored(),initial,'Discarded replacement preserved original audio');
  // Fake-media autoaccept bypasses permission prompt overrides. Browser Permissions Policy
  // still refuses capture in this same-origin frame, producing a genuine NotAllowedError.
  await page.evaluate(async()=>{
    const frame=document.createElement('iframe');
    frame.allow="microphone 'none'";frame.hidden=true;frame.src='about:blank';
    const loaded=new Promise(resolve=>frame.onload=resolve);
    document.body.append(frame);await loaded;
    if(frame.contentDocument.featurePolicy.allowsFeature('microphone'))throw Error('Frame did not deny microphone');
    qaMic.oldGum=navigator.mediaDevices.getUserMedia;
    const denied=frame.contentWindow.navigator.mediaDevices;
    navigator.mediaDevices.getUserMedia=(constraints)=>{qaMic.calls.push(constraints);return denied.getUserMedia(constraints)};
    qaMic.deniedFrame=frame;
  });
  const prior = alerts.length;
  const callsBeforeDeny = await page.evaluate(()=>qaMic.calls.length);

  await mic.click();
  for (let i=0;i<50 && alerts.length===prior;i++) await page.waitForTimeout(100);
  assert(alerts.length>prior,'Expected denial feedback: '+JSON.stringify(await intro()));
  assert.deepEqual(await stored(),initial,'Denied recording preserved prior bytes');
  assert.equal(await page.evaluate(()=>qaMic.calls.length) - callsBeforeDeny,1,'No retry on denial');
  assert.match(alerts.at(-1),origin==='https://appassets.androidplatform.net'?/Ayarlar.*Uygulamalar.*Mikrofon.*NotAllowedError/:/sitenin mikrofon iznini.*NotAllowedError/);
  console.log('Denied native capture, canceled replacement and old recording bytes verified', alerts.at(-1));
  await page.evaluate(()=>{ navigator.mediaDevices.getUserMedia=qaMic.oldGum;qaMic.deniedFrame.remove() });
  await mic.click();
  await page.waitForFunction(()=>HZV_REC?.state==='recording');
  await page.locator('#hzvKisim [data-hzv-action="iptal"][data-index="1"]').click();
  await page.waitForFunction(()=>!HZV_REC && !HZV_REC_BUSY);
  assert.deepEqual(await stored(),initial);
  console.log('Retry after permission restored and interrupted capture passed', JSON.stringify({pageErrors:app.errors}));
  {
   for(const name of ['NotReadableError','OverconstrainedError']) {
     await page.evaluate(name=>{qaMic.errors=[name];qaMic.calls=[]},name);
     await mic.click();
     await page.waitForFunction(()=>HZV_REC?.state==='recording');
     const calls=await page.evaluate(()=>qaMic.calls);
     assert.equal(calls.length,2);
     assert.deepEqual(calls[1],{audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
     await page.waitForTimeout(1250);
     await mic.click();
     await chooser.waitFor();
     assert(await chooser.locator('audio').evaluate(el=>el.src.startsWith('blob:')));
     await chooser.locator('[data-draft="cancel"]').click();
     assert.deepEqual(await stored(),initial);
     console.log(name,'first capture rejection recovered via unprocessed microphone, preview, cancel, prior bytes intact');
   }
   for (const [names,expect] of [
      [['NotReadableError','NotReadableError'], /Mikrofon açılamadı.*NotReadableError/],
      [['NotFoundError'],/Mikrofon bulunamadı.*NotFoundError/],
      [['OverconstrainedError','OverconstrainedError'], /desteklemiyor.*OverconstrainedError/]
   ]) {
     await page.evaluate(names=>{qaMic.errors=[...names];qaMic.calls=[]},names);
     const count=alerts.length;
     await mic.click();
     for(let i=0;i<50 && alerts.length===count;i++) await page.waitForTimeout(100);
     assert(alerts.length>count);
     assert.match(alerts.at(-1),expect);
     assert.equal(await page.evaluate(()=>qaMic.calls.length),names.length);
     assert.deepEqual(await stored(),initial);
     console.log('Persistent failure correctly identified and prior bytes intact', names.join(', '));
   }
   await page.evaluate(()=>{
     const MR=window.MediaRecorder;
     qaMic.savedMR=MR;qaMic.encodeAttempts=[];
     window.MediaRecorder=class extends MR {
       constructor(stream,options){super(stream,options); this.qaMime=options?.mimeType||'default'; }
       start(timeslice){
         qaMic.encodeAttempts.push(this.qaMime);
         if (this.qaMime==='audio/webm;codecs=opus') throw new DOMException('Cannot start this codec','NotSupportedError');
         return super.start(timeslice);
       }
     };
   });
   await mic.click();
   await page.waitForFunction(()=>HZV_REC?.state==='recording');
   await page.waitForTimeout(1500);
   await mic.click();await chooser.waitFor();
   assert.deepEqual(await page.evaluate(()=>qaMic.encodeAttempts),['audio/webm;codecs=opus','audio/webm']);
   const decoded=await page.evaluate(async()=>{
     const ctx=new AudioContext();
     try{return (await ctx.decodeAudioData(await HZV_DRAFT.blob.arrayBuffer())).duration;}
     finally{await ctx.close();}
   });
   assert(decoded>0.5);
   await chooser.locator('[data-draft="cancel"]').click();
   assert.deepEqual(await stored(),initial);
   await page.evaluate(()=>{window.MediaRecorder=qaMic.savedMR;});
   console.log('Codec startup rejection fell back to decodable real audio of',decoded,'seconds');
   await page.evaluate(()=>{window.qaSavedMR=window.MediaRecorder;window.MediaRecorder=undefined;});
   const priorUnsupported=alerts.length;
   await mic.click();
   for(let i=0;i<50 && alerts.length===priorUnsupported;i++) await page.waitForTimeout(100);
   assert(alerts.length>priorUnsupported);
   assert.match(alerts.at(-1),/desteklemiyor/);
   assert.deepEqual(await stored(), initial);
   console.log('Unavailable MediaRecorder leaves previous bytes intact');
   await page.evaluate(()=>{window.MediaRecorder=window.qaSavedMR});
  }
  await page.reload({waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>typeof REC_DB!=='undefined' && !!REC_DB.get);
  assert.deepEqual(await stored(),initial,'Previous recording survives reload byte-for-byte');
  console.log('Fresh load confirmed persisted original audio',initial);
  assert.deepEqual(app.errors,[]);

 } finally {await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
