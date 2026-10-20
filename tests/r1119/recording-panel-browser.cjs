#!/usr/bin/env node
'use strict';
// Native browser acceptance for the exact r1018 recording-panel CSS relocation.
// Uses disposable profiles, synthetic-only recordings, no microphone or playback,
// and never presses export, import, restoration, deletion or reset controls.
// Run: NODE_PATH=... CHROMIUM_PATH=/usr/bin/chromium node tests/r1119/recording-panel-browser.cjs ROOT BASELINE OUTPUT
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { fixture, hash } = require('../r1064/browser-fixture.cjs');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
if (!process.argv[3]) throw Error('An explicit frozen baseline directory is required.');
const baseline = path.resolve(process.argv[3]);
const output = path.resolve(process.argv[4] || path.join(__dirname, 'evidence/recording-panel-browser.json'));
const artifactDir = path.dirname(output);
fs.mkdirSync(artifactDir, { recursive: true });
const cssId = 'sukun-r1018-recording-panel-layout';
const cssPath = 'assets/runtime/recording-panel-r1119.css';
const read = (r, p) => fs.readFileSync(path.join(r, p));
const props = ['display', 'visibility', 'position', 'boxSizing', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'gridTemplateColumns', 'gap', 'alignItems', 'flexDirection', 'padding', 'margin', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'whiteSpace', 'wordBreak', 'overflowWrap', 'overflow', 'overflowX', 'overflowY', 'color', 'backgroundColor', 'backgroundImage', 'borderWidth', 'borderColor', 'borderRadius', 'boxShadow', 'opacity'];
const selectors = ['#ydkBox', '#ydkBox > summary', '#r187RecRescue', '#r187RecRescue .recRescueBar', '#r187RecStat', '#r187RecStat b', '#r187RecStat span', '#r187RecRescan', '#r1017RecInspection', '#r1017RecInspection .recInspectionActions', '#r1017RecInspect', '#r1017RecInspectionCancel', '#r1017RecInspectionNote', '#r1017RecInspectionStatus', '#ydkBox .zYonerge.r1018Hint', '#ydkBox .r1018HintText', '#ydkBox .r1018Hint .yonergeKulak', '#ydkBox .r1018Hint .yonergeKulak span'];
const report = {
  suite: 'r1119 recording panel native Chromium equivalence and interaction', startedAt: new Date().toISOString(),
  roots: { candidate: root, baseline },
  sourceHashes: {
    candidateIndex: hash(read(root, 'index.html')), candidateNero: hash(read(root, 'nero.html')),
    baselineIndex: hash(read(baseline, 'index.html')), baselineNero: hash(read(baseline, 'nero.html')),
    extractedCss: hash(read(root, cssPath)), fixture: hash(read(root, 'tests/r1064/browser-fixture.cjs')),
    nativeObserver: hash(read(root, 'assets/runtime/recording-inspection-r1020.js'))
  },
  plannedCoverage: {
    matrixStates: 128, widths: [320, 390, 430, 1280], shells: ['Klasik', 'Feyz'], families: ['esma', 'berhet'], languages: ['tr', 'en'], explanations: ['expanded', 'collapsed'], textConditions: ['normal', '24px text with long synthetic domain/status'],
    interactions: ['native explanation click in every matrix state', 'keyboard Tab and Enter', 'native details close/open repeated three times', 'native read-only IndexedDB inspection over two synthetic blobs', 'controlled pending/cancel/late completion UI', 'repeat native inspection'],
    forbiddenControls: ['microphone', 'playback', 'export', 'import', 'restoration', 'delete', 'reset']
  },
  limitations: [
    'The matrix is scoped to #ydkBox and the extracted CSS selectors, not full-application acceptance.',
    'Klasik/Feyz and Esma/Berhet are presentation-class/attribute permutations, not trusted unlock or family navigation acceptance.',
    'Language uses the production I18N.set API. Explanations, details, Tab and Enter use native browser input.',
    'The font stress condition injects a test-only 24px override for affected panel text and buttons. It is not browser zoom or OS accessibility text-size acceptance.',
    'The status/domain text is synthetic and identical in both origins. No user data, real microphone, recorded voice, export, restoration or destructive action is used.',
    'The native observer runs on real disposable IndexedDB seeded with two synthetic Blobs; cancellation UI additionally uses an explicitly labelled controlled pending observer.',
    'Fixture blocks service workers and external requests and controls device speech. No offline upgrade, physical Android, screen lock, OS audio focus, audible playback or real storage-quota acceptance.',
    'r1118 scene-info visibility, mixer .mkCard matching, Full/Ready, and microphone-disclosure preference acceptance are outside this recording-panel suite.'
  ], checks: [], matrix: [], screenshots: [], resources: {}, baselineDefects: []
};
const check = async (name, fn) => {
  try { const evidence = await fn(); report.checks.push({ name, status: 'passed', evidence }); }
  catch (error) { report.checks.push({ name, status: 'failed', error: error.stack }); }
  console.log(JSON.stringify({ name, status: report.checks.at(-1).status }));
};
const settle = async p => { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120); await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); };
async function nativeOpen(p) {
  // Establish visible production ancestry rather than comparing hidden rectangles.
  const ancestry = await p.locator('#ydkBox').evaluate(el => { const result = []; for (let n = el.parentElement; n; n = n.parentElement) if (n.tagName === 'DETAILS') result.unshift(n.id); return result; });
  for (const id of ancestry) {
    assert(id, 'Every details ancestor requires a stable ID for trusted input.');
    const details = p.locator(`[id="${id}"]`);
    if (!await details.evaluate(el => el.open)) await details.locator(':scope > summary').click();
  }
  if (!await p.locator('#ydkBox').evaluate(el => el.open)) await p.locator('#ydkBox > summary').click();
  await p.locator('#r1017RecInspect').waitFor({ state: 'visible' });
}
async function prepare(f) {
  const p = f.page;
  await p.emulateMedia({ reducedMotion: 'reduce' });
  if (await p.locator('#dcClose').isVisible()) await p.locator('#dcClose').click();
  await p.waitForFunction(() => !window.SukunInteractionGateR732?.active?.());
  await p.locator('.tab[data-t="zkr"]').click();
  if (await p.locator('#r938PanelToggle').getAttribute('aria-expanded') !== 'true') await p.locator('#r938PanelToggle').click();
  if (await p.locator('#r920More').getAttribute('aria-expanded') !== 'true') await p.locator('#r920More').click();
  await nativeOpen(p);
  await p.addStyleTag({ content: '#ydkBox,#ydkBox *{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await p.evaluate(() => {
    const s = document.createElement('style'); s.id = 'r1119-qa-large-text';
    s.textContent = '#ydkBox #r187RecStat,#ydkBox #r187RecStat b,#ydkBox #r187RecStat span,#ydkBox .recRescueBtn,#ydkBox .r1018HintText,#ydkBox .r1018HintText *,#ydkBox .yonergeKulak,#ydkBox .yonergeKulak span{font-size:24px!important}';
    document.head.append(s); s.sheet.disabled = true;
    window.__r1119Safety = { microphoneAttempts: 0, downloads: 0, fileChoosers: 0 };
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => { window.__r1119Safety.microphoneAttempts++; return Promise.reject(new DOMException('Microphone is outside this QA scope', 'NotAllowedError')); };
  });
  p.on('download', async download => { await p.evaluate(() => window.__r1119Safety.downloads++); await download.cancel(); });
  p.on('filechooser', async () => { await p.evaluate(() => window.__r1119Safety.fileChoosers++); });
  await settle(p);
}
async function setState(p, state) {
  await p.setViewportSize({ width: state.width, height: 980 });
  await p.evaluate(({ shell, family, lang, large }) => {
    document.body.classList.toggle('r716-shell', shell === 'Feyz');
    document.documentElement.setAttribute('data-r1074-theme', family);
    window.I18N.set(lang);
    document.getElementById('r1119-qa-large-text').sheet.disabled = !large;
    const status = document.getElementById('r187RecStat');
    status.querySelector('b').textContent = large ? (lang === 'tr' ? '2 sentetik kayıt görünüyor; uzun durum açıklaması yalnız görsel sınama içindir.' : '2 synthetic recordings are visible; this long status is for presentation testing only.') : (lang === 'tr' ? '2 sentetik kayıt görünüyor' : '2 synthetic recordings are visible');
    status.querySelector('span').textContent = large ? 'synthetic-long-domain-for-recording-panel-layout-check-without-private-data.example.test · sukunRec / clips' : 'synthetic.example.test · sukunRec / clips';
  }, state);
  await nativeOpen(p);
  const hints = p.locator('#ydkBox .r1018Hint .yonergeKulak');
  assert.equal(await hints.count(), 2, 'Both backup explanation controls must exist.');
  for (let i = 0; i < await hints.count(); i++) {
    const button = hints.nth(i);
    if ((await button.getAttribute('aria-expanded') === 'true') !== state.expanded) await button.click();
  }
  await p.mouse.move(0, 0);
  await p.locator('#ydkBox > summary').scrollIntoViewIfNeeded();
  await settle(p);
}
async function snapshot(p) {
  return p.evaluate(({ selectors, props }) => {
    const round = x => Math.round(x * 100) / 100;
    const root = document.getElementById('ydkBox'), r0 = root.getBoundingClientRect();
    const rows = selectors.map(selector => ({ selector, nodes: [...document.querySelectorAll(selector)].map(el => {
      const c = getComputedStyle(el), r = el.getBoundingClientRect();
      return { tag: el.tagName, id: el.id, hidden: el.hidden, expanded: el.getAttribute('aria-expanded'), disabled: !!el.disabled,
        style: Object.fromEntries(props.map(k => [k, c[k]])),
        // A display:none element has the native 0x0 viewport rectangle, not a position relative to the panel.
        // Retain visibility/styles/dimensions but do not subtract the independently scrolled panel origin from zero.
        rect: { x: r.width || r.height ? round(r.left - r0.left) : 0, y: r.width || r.height ? round(r.top - r0.top) : 0, width: round(r.width), height: round(r.height) },
        clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight,
        visible: !!r.width && !!r.height && c.display !== 'none' && c.visibility !== 'hidden' && !el.hidden };
    }) }));
    const issue = [], rect = e => e.getBoundingClientRect(), near = (a, b) => Math.abs(a - b) <= 1;
    const stat = document.getElementById('r187RecStat'), rescan = document.getElementById('r187RecRescan'), inspect = document.getElementById('r1017RecInspect');
    if (r0.width <= 0 || r0.height <= 0 || root.closest('[hidden]')) issue.push('Panel is hidden or has zero area.');
    if (!root.open) issue.push('Panel is not open.');
    if (rect(stat).height <= 0 || rect(inspect).height <= 0) issue.push('Affected status/inspection controls are not rendered.');
    if (rect(rescan).top < rect(stat).bottom + 9) issue.push('Status and disabled rescan do not occupy separate rows with 10px gap.');
    if (!near(rect(rescan).width, rect(stat).width)) issue.push('Status and rescan are not equally full width.');
    for (const el of [rescan, inspect, ...root.querySelectorAll('.r1018Hint .yonergeKulak')]) {
      const r = rect(el), label = el.id || el.getAttribute('aria-controls');
      if (r.height < 43.99 || r.width < 43.99) issue.push(label + ': target below 44px.');
      if (r.left < r0.left - 1 || r.right > r0.right + 1) issue.push(label + ': control exceeds panel horizontally.');
      if (el.scrollWidth > el.clientWidth + 1) issue.push(label + ': horizontal content overflow.');
    }
    for (const el of [root, stat, ...root.querySelectorAll('.r1018HintText:not([hidden])')]) if (el.scrollWidth > el.clientWidth + 1) issue.push((el.id || el.className) + ': horizontal overflow.');
    for (const el of root.querySelectorAll('.r1018Hint')) {
      const button = el.querySelector('.yonergeKulak'), content = el.querySelector('.r1018HintText');
      if (button.getAttribute('aria-expanded') !== String(!content.hidden)) issue.push(content.id + ': aria-expanded disagrees with hidden state.');
      if (!content.hidden && rect(button).top < rect(content).bottom - 1) issue.push(content.id + ': button overlaps expanded text.');
      if (getComputedStyle(button).position !== 'relative') issue.push(content.id + ': control is not in normal relative flow.');
    }
    return { rows, layoutIssues: issue, presentation: { shell: document.body.classList.contains('r716-shell') ? 'Feyz' : 'Klasik', family: document.documentElement.getAttribute('data-r1074-theme'), lang: window.I18N.lang, htmlLang: document.documentElement.lang, large: !document.getElementById('r1119-qa-large-text').sheet.disabled } };
  }, { selectors, props });
}
async function seedSynthetic(p) {
  return p.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const q = indexedDB.open('sukunRec'); q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains('clips')) q.result.createObjectStore('clips'); }; q.onsuccess = () => resolve(q.result); q.onerror = () => reject(q.error); });
    const count = await new Promise((resolve, reject) => { const q = db.transaction('clips', 'readonly').objectStore('clips').count(); q.onsuccess = () => resolve(q.result); q.onerror = () => reject(q.error); });
    if (count !== 0) throw Error('Expected an empty disposable profile, refusing to seed a nonempty recording store.');
    await new Promise((resolve, reject) => { const tx = db.transaction('clips', 'readwrite'), s = tx.objectStore('clips'); s.put(new Blob([new Uint8Array(64).fill(17)], { type: 'application/x-synthetic-qa' }), 'r1119:synthetic-a'); s.put(new Blob([new Uint8Array(96).fill(23)], { type: 'application/x-synthetic-qa' }), 'r1119:synthetic-b'); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    db.close();
    window.__r1119StorageOps = [];
    const transaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (names, mode, ...rest) { if (this.name === 'sukunRec') window.__r1119StorageOps.push({ operation: 'transaction', stores: Array.from(typeof names === 'string' ? [names] : names), mode: mode || 'readonly' }); return transaction.call(this, names, mode, ...rest); };
    for (const method of ['put', 'add', 'delete', 'clear']) {
      const original = IDBObjectStore.prototype[method];
      IDBObjectStore.prototype[method] = function (...args) { if (this.transaction.db.name === 'sukunRec') window.__r1119StorageOps.push({ operation: method, store: this.name }); return original.apply(this, args); };
    }
    return { count: 2, blobBytes: 160, keys: ['r1119:synthetic-a', 'r1119:synthetic-b'] };
  });
}
async function storeDigest(p) {
  return p.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const q = indexedDB.open('sukunRec'); q.onsuccess = () => resolve(q.result); q.onerror = () => reject(q.error); });
    const records = await new Promise((resolve, reject) => { const rows = [], tx = db.transaction('clips', 'readonly'), q = tx.objectStore('clips').openCursor(); q.onsuccess = () => { if (q.result) { rows.push({ key: q.result.key, blob: q.result.value }); q.result.continue(); } }; tx.oncomplete = () => resolve(rows); tx.onerror = () => reject(tx.error); });
    db.close(); return Promise.all(records.map(async row => ({ key: row.key, bytes: row.blob.size, sha256: [...new Uint8Array(await crypto.subtle.digest('SHA-256', await row.blob.arrayBuffer()))].map(x => x.toString(16).padStart(2, '0')).join('') })));
  });
}
async function interactionChecks(f, label) {
  const p = f.page;
  await setState(p, { width: 390, shell: 'Klasik', family: 'esma', lang: 'tr', expanded: true, large: false });
  await check(label + ': keyboard Tab focus and Enter explanation toggle', async () => {
    const summary = p.locator('#ydkBox > summary'); await summary.focus(); await p.keyboard.press('Tab');
    const focused = await p.evaluate(() => ({ id: document.activeElement.id, focusVisible: document.activeElement.matches(':focus-visible'), outline: getComputedStyle(document.activeElement).outline }));
    assert.equal(focused.id, 'r1017RecInspect'); assert(focused.focusVisible);
    const hint = p.locator('#ydkBox .r1018Hint .yonergeKulak').first(); await hint.focus();
    const before = await hint.getAttribute('aria-expanded'); await p.keyboard.press('Enter'); assert.notEqual(await hint.getAttribute('aria-expanded'), before);
    await p.keyboard.press('Enter'); assert.equal(await hint.getAttribute('aria-expanded'), before);
    return focused;
  });
  await check(label + ': repeated native details close/open leaves controls usable', async () => {
    const summary = p.locator('#ydkBox > summary');
    for (let i = 0; i < 3; i++) { await summary.click(); assert.equal(await p.locator('#ydkBox').evaluate(el => el.open), false); await summary.click(); await p.locator('#r1017RecInspect').waitFor({ state: 'visible' }); }
    const hints = p.locator('#ydkBox .r1018Hint .yonergeKulak');
    for (let i = 0; i < await hints.count(); i++) { const el = hints.nth(i), before = await el.getAttribute('aria-expanded'); await el.click(); assert.notEqual(await el.getAttribute('aria-expanded'), before); }
    assert.equal(await p.locator('#r187RecRescan').isDisabled(), true); return { repeatedCycles: 3, hintControls: await hints.count() };
  });
  let seeded, before;
  await check(label + ': native read-only inspection returns only synthetic totals without recording mutation', async () => {
    seeded = await seedSynthetic(p); before = await storeDigest(p);
    await p.evaluate(() => { window.__r1119StorageOps.length = 0; });
    await p.locator('#r1017RecInspect').click();
    await p.waitForFunction(() => window.SukunRecordingInspection.snapshot().current?.status === 'ok' && document.getElementById('r1017RecInspectionStatus').getAttribute('aria-busy') === 'false');
    const result = await p.evaluate(() => ({ snapshot: window.SukunRecordingInspection.snapshot(), ops: window.__r1119StorageOps.slice(), status: document.getElementById('r1017RecInspectionStatus').textContent }));
    assert.equal(result.snapshot.current.count, seeded.count); assert.equal(result.snapshot.current.blobBytes, seeded.blobBytes);
    assert(result.ops.some(x => x.operation === 'transaction' && x.mode === 'readonly'));
    assert(!result.ops.some(x => x.operation !== 'transaction' || x.mode !== 'readonly'));
    assert(!/r1119:synthetic-[ab]/.test(result.status)); assert.deepEqual(await storeDigest(p), before);
    assert.equal(await p.locator('#r1017RecInspectionCancel').isVisible(), false); return { ...result, recordingDigests: before };
  });
  await check(label + ': controlled busy/double-click/cancel and late-result fence survive close/open', async () => {
    await p.evaluate(() => {
      window.__r1119NativeObserver = window.SukunRecordingInspection;
      window.__r1119Pending = { calls: 0, signal: null, resolve: null };
      window.SukunRecordingInspection = { snapshot: () => window.__r1119NativeObserver.snapshot(), inspect: ({ signal }) => { window.__r1119Pending.calls++; window.__r1119Pending.signal = signal; return new Promise(resolve => { window.__r1119Pending.resolve = resolve; }); } };
    });
    try {
      const button = p.locator('#r1017RecInspect'); await button.click(); assert(await button.isDisabled());
      const box = await button.boundingBox(); await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      assert.equal(await p.evaluate(() => window.__r1119Pending.calls), 1);
      const summary = p.locator('#ydkBox > summary'); await summary.click(); await summary.click();
      const cancel = p.locator('#r1017RecInspectionCancel'); await cancel.waitFor({ state: 'visible' }); const target = await cancel.boundingBox(); assert(target.width >= 44 && target.height >= 44);
      await cancel.click(); assert.equal(await p.evaluate(() => window.__r1119Pending.signal.aborted), true);
      const cancelled = await p.locator('#r1017RecInspectionStatus').textContent(); assert.match(cancelled, /iptal/);
      await p.evaluate(() => window.__r1119Pending.resolve({ at: Date.now(), build: 'r1119', status: 'ok', count: 777, blobBytes: 777, errorCode: null })); await settle(p);
      assert.equal(await p.locator('#r1017RecInspectionStatus').textContent(), cancelled); assert.equal(await button.isDisabled(), false);
      return { calls: 1, aborted: true, cancelTarget: target, lateCompletionIgnored: true, method: 'Controlled promise for UI lifecycle only, not native IndexedDB cancellation timing.' };
    } finally { await p.evaluate(() => { window.SukunRecordingInspection = window.__r1119NativeObserver; }); }
  });
  await check(label + ': repeated native inspection preserves synthetic recording bytes', async () => {
    assert(seeded && before, 'Synthetic native inspection setup did not complete.');
    await p.locator('#r1017RecInspect').click(); await p.waitForFunction(() => document.getElementById('r1017RecInspectionStatus').getAttribute('aria-busy') === 'false');
    const result = await p.evaluate(() => window.SukunRecordingInspection.snapshot().current); assert.equal(result.status, 'ok'); assert.equal(result.count, 2); assert.equal(result.blobBytes, 160); assert.deepEqual(await storeDigest(p), before); return result;
  });
  await check(label + ': no microphone request, file picker, download or recording write from tested interactions', async () => {
    const result = await p.evaluate(() => ({ ...window.__r1119Safety, recordingOps: window.__r1119StorageOps || [] }));
    assert.equal(result.microphoneAttempts, 0); assert.equal(result.fileChoosers, 0); assert.equal(result.downloads, 0);
    assert(!result.recordingOps.some(x => x.operation !== 'transaction' || x.mode !== 'readonly'));
    return result;
  });
}
(async () => {
  let a, b;
  try {
    // Preconditions are not counted as native passes.
    assert(read(root, 'index.html').equals(read(root, 'nero.html')), 'Candidate aliases differ.');
    const original = read(baseline, 'index.html').toString().match(new RegExp('<style id="' + cssId + '">([\\s\\S]*?)</style>'));
    assert(original, 'Frozen baseline inline CSS not found.'); assert(read(root, cssPath).equals(Buffer.from(original[1])), 'Extracted CSS is not byte-for-byte identical.');
    const seed = { 'sukun.obDone': '1', 'sukun.onboardSeen': '1', 'sukun.obSeenBuild': JSON.stringify('2026-08-06-r3'), 'sukun.theme': '"feyz"' };
    report.stage = 'starting native baseline Chromium'; console.log(report.stage); a = await fixture(baseline, { seed });
    report.stage = 'starting native candidate Chromium'; console.log(report.stage); b = await fixture(root, { seed });
    report.browser = b.browser.version();
    report.stage = 'preparing visible panel ancestry'; await prepare(a); await prepare(b);
    await check('Candidate stylesheet is loaded at its preserved ID with correct path, SRI and rules', async () => {
      const result = await b.page.evaluate(id => { const e = document.getElementById(id); return { tag: e?.tagName, href: e?.getAttribute('href'), integrity: e?.getAttribute('integrity'), rules: e?.sheet?.cssRules.length }; }, cssId);
      assert.equal(result.tag, 'LINK'); assert.equal(result.href.replace(/^\.\//, ''), cssPath + '?v=r1119'); assert.equal(result.integrity, 'sha256-' + require('node:crypto').createHash('sha256').update(read(root, cssPath)).digest('base64')); assert(result.rules > 0); return result;
    });
    report.stage = 'matrix';
    matrixLoop: for (const width of [320, 390, 430, 1280]) for (const shell of ['Klasik', 'Feyz']) for (const family of ['esma', 'berhet']) for (const lang of ['tr', 'en']) for (const expanded of [true, false]) for (const large of [false, true]) {
      const state = { width, shell, family, lang, expanded, large }, name = Object.values(state).join('/');
      await Promise.all([setState(a.page, state), setState(b.page, state)]);
      const [expected, actual] = await Promise.all([snapshot(a.page), snapshot(b.page)]);
      let equivalent = true, error = null; try { for (const sample of [expected, actual]) { assert.deepEqual(sample.presentation, { shell, family, lang, htmlLang: lang, large }); assert(sample.rows.find(x => x.selector === '#ydkBox .r1018Hint .yonergeKulak').nodes.every(x => x.expanded === String(expanded))); } assert.deepEqual(actual.rows, expected.rows); } catch (e) { equivalent = false; error = e.message; }
      const defectsInherited = actual.layoutIssues.length > 0 && JSON.stringify(actual.layoutIssues) === JSON.stringify(expected.layoutIssues);
      const evidence = { name, state, equivalent, error, candidateLayoutIssues: actual.layoutIssues, baselineLayoutIssues: expected.layoutIssues, matchedNodes: actual.rows.reduce((n, x) => n + x.nodes.length, 0), actual, expected };
      report.matrix.push(evidence);
      console.log(JSON.stringify({ matrixState: name, equivalent, layoutIssues: actual.layoutIssues }));
      report.checks.push({ name: 'Computed style and relative geometry: ' + name, status: equivalent ? 'passed' : 'failed', error });
      report.checks.push({ name: '44px targets, independent rows and overflow: ' + name, status: actual.layoutIssues.length ? (defectsInherited ? 'baseline-defect' : 'failed') : 'passed', evidence: { candidate: actual.layoutIssues, baseline: expected.layoutIssues } });
      if (defectsInherited) report.baselineDefects.push({ state, issues: actual.layoutIssues });
      fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
      if (process.env.SUKUN_R1119_DIAGNOSTIC === '1') { report.diagnosticOnly = true; break matrixLoop; }
      if ([320, 1280].includes(width) && family === 'esma' && lang === 'en' && large) {
        const file = path.join(artifactDir, `recording-panel-${width}-${shell.toLowerCase()}-en-large-${expanded ? 'expanded' : 'collapsed'}.png`);
        await b.page.locator('#ydkBox').screenshot({ path: file }); report.screenshots.push(file);
      }
    }
    report.stage = 'interactions'; if (!report.diagnosticOnly || process.env.SUKUN_R1119_INTERACTIONS === '1') { await interactionChecks(a, 'r1118 baseline'); await interactionChecks(b, 'r1119 candidate'); }
    for (const [label, f] of [['baseline', a], ['candidate', b]]) await check(label + ': served source bytes, no script/resource/integrity failures', async () => {
      const e = f.evidence(); report.resources[label] = e;
      assert.deepEqual(e.pageErrors, []); assert.deepEqual(e.failedRequests, []);
      assert(!e.consoleErrors.some(x => /integrity|digest|syntaxerror|referenceerror|typeerror/i.test(x)), e.consoleErrors.join('\n'));
      for (const [name, row] of Object.entries(e.served)) assert.equal(row.sha256, hash(read(f.root, name)), name);
      return { servedFiles: Object.keys(e.served).length, pageErrors: e.pageErrors, failedRequests: e.failedRequests };
    });
    report.stage = 'complete';
  } catch (error) { report.fatal = error.stack; report.blockedAt = report.stage; }
  finally {
    if (a) { report.resources.baseline ||= a.evidence(); await a.close(); }
    if (b) { report.resources.candidate ||= b.evidence(); await b.close(); }
    report.finishedAt = new Date().toISOString(); report.scriptSha256 = hash(fs.readFileSync(__filename));
    report.passed = report.checks.filter(x => x.status === 'passed').length; report.failed = report.checks.filter(x => x.status === 'failed').length; report.baselineDefectChecks = report.checks.filter(x => x.status === 'baseline-defect').length; report.executedChecks = report.checks.length; report.completedMatrixStates = report.matrix.length;
    report.status = report.fatal ? (report.executedChecks ? 'incomplete' : 'blocked-not-run') : report.failed ? 'failed' : report.baselineDefectChecks ? 'equivalent-with-baseline-defects' : 'passed';
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, passed: report.passed, failed: report.failed, baselineDefectChecks: report.baselineDefectChecks, executedChecks: report.executedChecks, completedMatrixStates: report.completedMatrixStates, plannedMatrixStates: report.plannedCoverage.matrixStates, fatal: report.fatal, output }));
    if (report.fatal || report.failed || report.baselineDefectChecks) process.exitCode = 1;
    // Fixture startup failure can retain its local HTTP listener. Do not hang after writing the blocked evidence.
    if (report.fatal && !a) process.exit(1);
  }
})();
