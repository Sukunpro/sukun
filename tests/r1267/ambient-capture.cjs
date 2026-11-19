'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(process.argv[2] || '.');
const {fixture} = require(process.env.SUKUN_TEST_FIXTURE || path.resolve(__dirname, '../r1064/browser-fixture.cjs'));

// Route capture through Chromium's synthetic microphone, including on unattended CI.
process.env.SUKUN_TEST_CHROMIUM = process.env.CHROMIUM_PATH || require('playwright').chromium.executablePath();
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'sukun-ambience-'));
const launcher = path.join(work, 'browser');
fs.writeFileSync(launcher, '#!/bin/sh\nexec "$SUKUN_TEST_CHROMIUM" --use-fake-device-for-media-stream --use-fake-ui-for-media-stream "$@"\n', {mode:0o700});
process.env.CHROMIUM_PATH = launcher;
process.on('exit', () => fs.rmSync(work, {recursive:true, force:true}));

(async () => {
  const app = await fixture(root, {width:393, height:873, hasTouch:true, seed:{'sukun.obDone':'1'}});
  const page = app.page;
  const open = page.locator('#addCustomSoundBtn');
  const record = page.locator('#csRecBtn');
  const sheet = page.locator('#customSoundSheet');
  try {
    await page.evaluate(() => { window.obClose?.(); document.querySelector('#dcClose')?.click(); });
    await page.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
    await page.locator('.tab[data-t="amb"]').click();
    await open.evaluate(el => {
      for(let parent=el.parentElement;parent;parent=parent.parentElement)if(parent.matches('details'))parent.open=true;
    });
    await open.click();
    await sheet.waitFor();
    await page.evaluate(async () => {
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      // A same-origin frame with a restrictive Permissions Policy yields a real denial
      // even with the synthetic microphone's automatic prompt approval.
      const frame = document.createElement('iframe');
      frame.allow = "microphone 'none'";
      frame.hidden = true;
      const loaded = new Promise(resolve => frame.onload=resolve);
      frame.src = 'about:blank';
      document.body.append(frame);
      await loaded;
      const qa = window.ambientMicQa = {requests:0, denied:true, missing:false, hold:false, streams:[]};
      navigator.mediaDevices.getUserMedia = async constraints => {
        qa.requests++;
        if(qa.denied)return frame.contentWindow.navigator.mediaDevices.getUserMedia(constraints);
        if(qa.missing)throw new DOMException('Simulated unavailable input','NotFoundError');
        const stream = await original(constraints);
        qa.streams.push(stream);
        if(qa.hold)await new Promise(resolve => qa.release=resolve);
        return stream;
      };
    });

    await record.click();
    await page.waitForFunction(() => document.querySelector('#csStat').textContent.includes('NotAllowedError'));
    assert.equal(await page.evaluate(() => ambientMicQa.requests), 1, 'Denied permission is never retried');
    await page.evaluate(() => { ambientMicQa.denied=false; ambientMicQa.missing=true; });
    await record.click();
    await page.waitForFunction(() => document.querySelector('#csStat').textContent.includes('NotFoundError'));

    await page.evaluate(() => { ambientMicQa.missing=false; ambientMicQa.hold=true; });
    await record.click();
    await page.waitForFunction(() => !!ambientMicQa.release);
    await page.locator('#customSoundClose').click();
    await sheet.waitFor({state:'hidden'});
    await page.evaluate(() => { ambientMicQa.release(); ambientMicQa.hold=false; });
    await page.waitForFunction(() => ambientMicQa.streams.at(-1).getTracks().every(track => track.readyState==='ended'));

    await open.click();
    await sheet.waitFor();
    assert.equal(await page.locator('#csStat').textContent(), 'Hazır');
    await record.click();
    await page.waitForFunction(() => document.querySelector('#csRecBtn').classList.contains('rec'));
    await page.waitForTimeout(1600);
    await record.click();
    await page.locator('#csPreview').waitFor();
    const draft = await page.evaluate(() => ({
      bytes:CSblob.size, mime:CSblob.type, tracks:ambientMicQa.streams.at(-1).getTracks().map(track => track.readyState)
    }));
    assert(draft.bytes>800 && draft.mime.startsWith('audio/'));
    assert.deepEqual(draft.tracks, ['ended']);

    await page.locator('#csPlayBtn').click();
    await page.waitForFunction(() => CSprev && !CSprev.paused);
    await page.locator('#csName').fill('Deneme ortam sesi');
    await page.locator('#csSaveBtn').click();
    await sheet.waitFor({state:'hidden'});
    const saved = await page.evaluate(async () => {
      const [{key,val}] = await CAMB_DB.all();
      return {id:key, bytes:val.blob.size, name:val.name, inMixer:AMBIENT_DEFS.some(x=>x.id===key), hasSource:!!SOUND_URLS[key]};
    });
    assert.equal(saved.bytes, draft.bytes);
    assert.equal(saved.name, 'Deneme ortam sesi');
    assert(saved.inMixer && saved.hasSource);
    await page.reload({waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(id => typeof AMBIENT_DEFS!=='undefined' && AMBIENT_DEFS.some(x=>x.id===id), saved.id);
    assert.deepEqual(app.errors, []);
    console.log('Ambience recording passed permission denial, missing input, late cancellation, capture, preview and persistence.', draft);
  } finally {
    await app.close();
  }
})().catch(error => { console.error(error); process.exitCode=1; });
