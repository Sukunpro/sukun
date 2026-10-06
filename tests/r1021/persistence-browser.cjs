#!/usr/bin/env node
'use strict';
/*
 * Actual-browser integration test. Synthetic WAV bytes only, fresh isolated
 * Chromium profile, loopback-only web origin. Never loads a user's profile,
 * remote SÜKÛN site, microphone, or audio. No production guard is overridden.
 *
 * node tests/r1021/persistence-browser.cjs [--root PATH] [--update-root PATH]
 *   [--report-dir PATH] [--chromium PATH]
 *
 * --update-root must be a DIFFERENT, coherent newer release tree. The test
 * starts with --root, retains the same origin/profile/recordings, switches the
 * server to --update-root, and invokes the real update manager. It does not
 * rewrite release markers, skip integrity checks, or send SKIP_WAITING itself.
 * Without --update-root, update coverage is explicitly NOT_RUN.
 * Reports and the synthetic browser profile are retained outside the repo.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const args = process.argv.slice(2), options = {};
for (let i = 0; i < args.length; i += 2) {
  assert(['--root', '--update-root', '--report-dir', '--chromium'].includes(args[i]), 'Unknown argument: ' + args[i]);
  assert(args[i + 1], 'Missing argument value');
  options[args[i].slice(2)] = path.resolve(args[i + 1]);
}
const root = options.root || path.resolve(__dirname, '../..');
const reportDir = options['report-dir'] || fs.mkdtempSync(path.join(os.tmpdir(), 'sukun-persistence-'));
assert(!reportDir.startsWith(root + path.sep), 'Reports/profile must stay outside the tracked checkout');
fs.mkdirSync(reportDir, { recursive: true });
const profile = path.join(reportDir, 'synthetic-profile');
assert(!fs.existsSync(profile), 'Use a fresh report directory: an existing profile is never reused as initial state');
const build = folder => fs.readFileSync(path.join(folder, 'index.html'), 'utf8').match(/<meta\s+name=["']sukun-build["']\s+content=["'](r\d+)["']/)?.[1];
const report = {
  schema: 1, status: 'RUNNING', startedAt: new Date().toISOString(), root,
  initialBuild: build(root), updateBuild: options['update-root'] ? build(options['update-root']) : null,
  scope: 'Fresh local Chromium; synthetic WAV fixtures; no actual-phone or private-recording claim',
  checks: [], stages: [], pageErrors: [], console: [], failedRequests: [], blockedExternalRequests: [],
  update: { status: options['update-root'] ? 'PENDING' : 'NOT_RUN', reason: options['update-root'] ? '' : 'No coherent newer release tree supplied' }
};
if (options['update-root']) {
  assert(report.initialBuild && report.updateBuild, 'Both release trees must declare a build');
  assert(+report.updateBuild.slice(1) > +report.initialBuild.slice(1), 'Update tree must have a newer build identity');
}
function save() { fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2)); }
function checked(name, detail = {}) { report.checks.push({ name, pass: true, ...detail }); save(); }
function wav(seed) {
  const samples = 800, bytes = Buffer.alloc(44 + samples * 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(8000, 24); bytes.writeUInt32LE(16000, 28); bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34); bytes.write('data', 36); bytes.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) bytes.writeInt16LE(Math.round(Math.sin(i * seed / 100) * 900), 44 + i * 2);
  return bytes;
}
const fixture = new Map([
  ['synthetic:existing', wav(11)], ['synthetic:new-a', wav(17)], ['synthetic:new-b', wav(23)]
]);
const rows = values => [...values].map(([key, bytes]) => ({ key, bytes: bytes.length, type: 'audio/wav', sha256: crypto.createHash('sha256').update(bytes).digest('hex') })).sort((a, b) => a.key.localeCompare(b.key));
const expected = rows(fixture);
function backup(entries) {
  return JSON.stringify({ uygulama: 'SUKUN', sur: 1, kayitlar: Object.fromEntries(entries.map(([key, bytes]) => [key, { tur: 'audio/wav', veri: bytes.toString('base64') }])) });
}
// The conflicting same-key import must preserve the ORIGINAL fixture.
const importText = backup([['synthetic:existing', wav(99)], ...[...fixture].slice(1)]);
let server, context, page, origin, activeRoot = root, stage = 'launch';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
async function startServer() {
  server = http.createServer((req, res) => {
    let name;
    try { name = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); } catch (_) { res.writeHead(400).end(); return; }
    const file = path.resolve(activeRoot, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(activeRoot + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, bytes) => {
      if (error) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(bytes);
    });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  origin = 'http://127.0.0.1:' + server.address().port;
  report.origin = origin;
}
function observe(p) {
  p.on('pageerror', error => { report.pageErrors.push({ stage, name: error.name, message: error.message, stack: error.stack }); save(); });
  p.on('console', message => { if (['error', 'warning'].includes(message.type())) report.console.push({ stage, type: message.type(), text: message.text(), location: message.location() }); });
  p.on('requestfailed', req => report.failedRequests.push({ stage, url: req.url(), error: req.failure()?.errorText }));
}
async function launch() {
  context = await chromium.launchPersistentContext(profile, {
    executablePath: options.chromium || process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox'], viewport: { width: 1280, height: 900 }, permissions: []
  });
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(origin + '/') || /^(?:data|blob):/.test(url)) return route.continue();
    report.blockedExternalRequests.push({ stage, url });
    return route.abort('blockedbyclient');
  });
  page = context.pages()[0] || await context.newPage(); observe(page);
}
async function state(p = page) {
  return p.evaluate(() => ({
    title: document.title, build: document.querySelector('meta[name="sukun-build"]')?.content,
    recordingAPI: typeof REC_DB !== 'undefined', owner: window.SukunTabOwner?.snapshot?.() || null,
    salvage: window.SukunRecordingSalvage?.status?.() || null, recovery: window.SukunRecoveryData?.status?.() || null,
    update: window.SukunUpdateManager?.snapshot?.() || null,
    hasFinish: typeof window.Tekke?.finish === 'function', controller: navigator.serviceWorker?.controller?.scriptURL || null
  }));
}
async function ready(expectedBuild) {
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 60000 });
  await page.waitForTimeout(1000);
  const startup = await state(); report.stages.push({ stage, state: startup }); save();
  assert.equal(startup.build, expectedBuild, 'Loaded shell identity');
  const errors = report.pageErrors.filter(error => error.stage === stage);
  assert.equal(errors.length, 0, 'Uncaught application startup error: ' + errors.map(error => error.stack || error.message).join('\n'));
  assert(startup.recordingAPI && startup.salvage && startup.owner && startup.hasFinish, 'Full application APIs must initialize; see startup state');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 90000 });
  const result = await page.evaluate(async () => {
    const api = window.SukunUpdateManager;
    const response = await api.status();
    await window.SukunRecoveryGuard.assertSingleClient();
    return response;
  });
  assert.equal(result?.v, expectedBuild, 'Controller and HTML release identities agree');
  assert.equal(result?.complete, true, 'Service worker independently verifies complete release');
  checked(stage + ': application startup and coherent SW', { build: expectedBuild });
}
async function readFresh() {
  return page.evaluate(async () => {
    // Fresh connection and committed read transaction, independent of REC_DB's cache.
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('sukunRec');
      req.onupgradeneeded = () => { req.transaction.abort(); reject(Error('Recording database is missing')); };
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    let values;
    try {
      values = await new Promise((resolve, reject) => {
        const tx = db.transaction('clips', 'readonly'), out = []; let ended = false;
        const req = tx.objectStore('clips').openCursor();
        req.onsuccess = () => { const c = req.result; if (!c) { ended = true; return; } out.push([c.key, c.value]); c.continue(); };
        tx.oncomplete = () => ended ? resolve(out) : reject(Error('Incomplete cursor'));
        tx.onabort = tx.onerror = () => reject(tx.error || Error('Read aborted'));
      });
    } finally { db.close(); }
    const result = [];
    for (const [key, blob] of values) {
      if (!(blob instanceof Blob)) throw Error('Expected native Blob: ' + key);
      const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
      result.push({ key, bytes: blob.size, type: blob.type, sha256: [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('') });
    }
    return result.sort((a, b) => a.key.localeCompare(b.key));
  });
}
async function expectRows(name, wanted = expected) {
  const actual = await readFresh(); assert.deepEqual(actual, wanted, name);
  checked(name, { count: actual.length, blobBytes: actual.reduce((n, row) => n + row.bytes, 0), rows: actual });
}
async function importViaAPI(text) {
  return page.evaluate(async text => {
    try { return { result: await window.SukunRecordingSalvage.importJSON([new File([text], 'synthetic.json', { type: 'application/json' })]) }; }
    catch (error) { return { error: { name: error.name, message: error.message, code: error.code || '', added: error.added }, owner: window.SukunTabOwner?.snapshot(), recovery: window.SukunRecoveryData?.status() }; }
  }, text);
}
async function finish() {
  const finishPath = await page.evaluate(() => {
    // Exercise the shipped terminal action, without starting sound/microphone.
    const button = document.getElementById('r992Finish');
    if (button && !button.disabled) { button.click(); return '#r992Finish click'; }
    if (typeof window.Tekke?.finish !== 'function') throw Error('Production Finish API unavailable');
    window.Tekke.finish(); return 'Tekke.finish API';
  });
  await page.waitForTimeout(200);
  checked(stage + ': real Finish invoked', { finishPath, activeAudioScenario: false });
}
(async () => {
  try {
    await startServer(); await launch();
    stage = 'initial-startup'; await page.goto(origin + '/index.html', { waitUntil: 'load', timeout: 90000 }); await ready(report.initialBuild);
    // Establish the existing recording through the same real, guarded import API.
    // No test code writes directly to the recording database or patches a guard.
    stage = 'existing-fixture-import';
    const seeded = await importViaAPI(backup([[...fixture][0]]));
    report.fixtureImport = seeded;
    assert.equal(seeded.error, undefined, 'Initial synthetic import failed: ' + JSON.stringify(seeded));
    assert.equal(seeded.result?.added, 1);
    await expectRows('Existing synthetic fixture committed before import', rows(new Map([[...fixture][0]])));
    stage = 'missing-only-import';
    const imported = await importViaAPI(importText); report.import = imported;
    assert.equal(imported.error, undefined, 'Real import failed: ' + JSON.stringify(imported));
    assert.deepEqual(imported.result, { ok: true, added: 2, kept: 1, verified: true, quarantineKept: true });
    await expectRows('Import committed; missing keys added and same-key original preserved');
    // Repeat import should be idempotent and retain the original conflicting key.
    const again = await importViaAPI(importText); assert.equal(again.result?.added, 0); assert.equal(again.result?.kept, 3);
    await expectRows('Repeated import adds nothing and keeps all exact hashes');
    stage = 'malformed-inputs';
    for (const [label, text] of [['invalid JSON', '{'], ['empty file', ''], ['empty recordings', backup([])], ['invalid audio', JSON.stringify({ uygulama: 'SUKUN', sur: 1, kayitlar: { 'synthetic:bad': { tur: 'audio/wav', veri: '' } } })]]) {
      const rejected = await importViaAPI(text);
      assert(rejected.error && !rejected.error.added, label + ' must reject before additions');
      assert(!/finish-first|safe-restore-unavailable|NO_CONTROLLER|OTHER_APP_TAB_OPEN/.test(rejected.error.code || ''), label + ' must reach the validator, not fail at an unrelated gate');
      checked(label + ' rejected', { error: rejected.error }); await expectRows(label + ' preserves existing count, bytes and hashes');
    }
    stage = 'single-client-guard';
    const peer = await context.newPage(); observe(peer); await peer.goto(origin + '/index.html', { waitUntil: 'load', timeout: 90000 });
    await peer.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 90000 });
    const blocked = await importViaAPI(backup([['synthetic:blocked-by-peer', wav(31)]]));
    assert.equal(blocked.error?.code, 'OTHER_APP_TAB_OPEN', 'A second live application client must block import');
    checked('Second-tab safety guard blocks real import', { error: blocked.error }); await expectRows('Second-tab rejection is non-destructive');
    await peer.close();
    stage = 'finish'; await finish(); await expectRows('Finish preserves count, native Blob bytes and hashes');
    stage = 'page-reload'; await page.reload({ waitUntil: 'load', timeout: 90000 }); await ready(report.initialBuild); await expectRows('Page reload retains exact recordings');
    stage = 'browser-restart'; await context.close(); context = null; await launch();
    await page.goto(origin + '/index.html', { waitUntil: 'load', timeout: 90000 }); await ready(report.initialBuild); await expectRows('Closed and restarted Chromium retains exact recordings');
    if (options['update-root']) {
      stage = 'service-worker-update'; activeRoot = options['update-root'];
      await page.evaluate(() => { window.SukunUpdateManager.activate(); });
      await page.waitForFunction(expectedBuild => document.querySelector('meta[name="sukun-build"]')?.content === expectedBuild, report.updateBuild, { timeout: 150000 });
      await ready(report.updateBuild); await expectRows('Coherent SW update retains exact recordings');
      report.update = { status: 'PASS', from: report.initialBuild, to: report.updateBuild };
      stage = 'updated-browser-restart'; await context.close(); context = null; await launch();
      await page.goto(origin + '/index.html', { waitUntil: 'load', timeout: 90000 }); await ready(report.updateBuild); await expectRows('Updated release survives a second complete Chromium restart');
    }
    assert.equal(report.pageErrors.length, 0, 'Uncaught page errors occurred; see report');
    report.status = options['update-root'] ? 'PASS' : 'PASS_WITH_UPDATE_NOT_RUN';
    await page.screenshot({ path: path.join(reportDir, 'final.png'), fullPage: false });
  } catch (error) {
    report.status = stage === 'launch' ? 'BLOCKED_BROWSER_LAUNCH' : 'FAIL';
    report.failure = { stage, name: error.name, message: error.message, stack: error.stack };
    if (page && !page.isClosed()) {
      report.failure.state = await state().catch(e => ({ error: String(e) }));
      await page.screenshot({ path: path.join(reportDir, 'failure.png') }).catch(() => {});
    }
    process.exitCode = 1;
  } finally {
    report.finishedAt = new Date().toISOString(); save();
    await context?.close().catch(() => {});
    await new Promise(resolve => server ? server.close(resolve) : resolve());
    console.log(JSON.stringify({ status: report.status, checksPassed: report.checks.length, update: report.update, failure: report.failure, report: path.join(reportDir, 'report.json') }, null, 2));
  }
})();
