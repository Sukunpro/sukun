'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const {fixture} = require(process.env.SUKUN_TEST_FIXTURE || path.join(root, 'tests/r1064/browser-fixture.cjs'));

const shortcuts = [
  {id: 'huKayit', key: 'hu:sonu'},
  {id: 'niyetRecBtn', key: 'niyet:core'},
  {id: 'mzbzRec', key: 'mzbz:berhetiyye'},
];

async function verifyButton(page, {id, key}) {
  const result = await page.locator('#' + id).evaluate(async (button, key) => {
    const media = navigator.mediaDevices;
    const nativeGetUserMedia = media.getUserMedia.bind(media);
    const OriginalRecorder = window.MediaRecorder;
    const tracks = [];
    const sample = 'Original recording before the simulated failure';
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    let release;
    let recorder;
    async function capture(options) {
      const stream = await nativeGetUserMedia(options);
      tracks.push(...stream.getTracks());
      return stream;
    }

    try {
      await REC_DB.set(key, new Blob([sample], {type: 'audio/webm'}));
      media.getUserMedia = async options => {
        await new Promise(resolve => { release = resolve; });
        return capture(options);
      };
      const pending = button.onclick();
      await button.onclick();
      release();
      await pending;
      const afterCancel = tracks.map(track => track.readyState);

      media.getUserMedia = capture;
      window.MediaRecorder = class extends OriginalRecorder {
        constructor(...args) { super(...args); recorder = this; }
      };
      await button.onclick();
      await sleep(1100);
      const stopped = new Promise(resolve => recorder.addEventListener('stop', resolve, {once: true}));
      recorder.dispatchEvent(new Event('error'));
      await stopped;
      const preserved = await (await REC_DB.get(key)).text() === sample;

      window.MediaRecorder = OriginalRecorder;
      await button.onclick();
      await sleep(1250);
      await button.onclick();
      let blob;
      const deadline = Date.now() + 5000;
      do {
        blob = await REC_DB.get(key);
        if (blob?.size > 800) break;
        await sleep(50);
      } while (Date.now() < deadline);
      return {afterCancel, preserved, finalTracks: tracks.map(track => track.readyState), bytes: blob?.size, mime: blob?.type};
    } finally {
      tracks.forEach(track => track.stop());
      media.getUserMedia = nativeGetUserMedia;
      window.MediaRecorder = OriginalRecorder;
    }
  }, key);
  assert.deepEqual(result.afterCancel, ['ended'], id + ' releases deferred permission');
  assert.ok(result.preserved, id + ' keeps the previous recording after an encoder error');
  assert.deepEqual(result.finalTracks, ['ended', 'ended', 'ended'], id + ' releases every stream');
  assert.ok(result.bytes > 800 && /^audio\//.test(result.mime), id + ' saves new audio');
  console.log('PASS', id, result.bytes, result.mime);
}

(async () => {
  const app = await fixture(root, {width: 393, height: 873, hasTouch: true, fakeMicrophone: true});
  try {
    await app.context.grantPermissions(['microphone'], {origin: new URL(app.origin).origin});
    for (const shortcut of shortcuts) await verifyButton(app.page, shortcut);
  } finally { await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
