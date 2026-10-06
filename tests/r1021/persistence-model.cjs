#!/usr/bin/env node
'use strict';
/* Controlled Node VM/IndexedDB event model, NOT actual browser/phone evidence.
 * Shipped importer, REC_DB, owner runtime, single-client guard and Finish are
 * executed unchanged. Synthetic Blob bytes live in a shared transaction model
 * across destroyed/reconstructed VM tabs. No production guard is patched.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
process.env.SUKUN_AUDIO_SOURCE = root;
const { origin } = require('../helpers/tab-owner-origin.cjs');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const swSource = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const releaseBuild = html.match(/<meta name="sukun-build" content="(r\d+)"/)?.[1];
assert(releaseBuild, 'Release build marker required');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function extract(text, start, end) { const a = text.indexOf(start), b = text.indexOf(end, a); assert(a >= 0 && b > a, 'Missing source anchors: ' + start); return text.slice(a, b); }
const recordingSource = extract(html, 'const REC_DB=(function(){', '/* r976: short feedback samples');
const backupSource = extract(html, 'function skBackupLimits()', 'async function skRestoreMissingVoices(');
const catalogSource = extract(html, 'const SK_RECORDING_CATALOG=', 'function skRecordingCatalogNotice()');
const finishSource = extract(html, 'function tkFinish()', 'function tkSceneAccessChanged()');
const guardSource = read('assets/runtime/recovery-versions-r1019.js');
const importerSource = read('assets/runtime/recording-salvage-r1020.js');
const singleClientSource = extract(swSource, 'async function recoverySource(event)', 'async function recoveryMutationSource(event)');
const updateSource = extract(swSource, "  if(d.type==='SKIP_WAITING'){", "  if(d.type==='SURUM_NOTU')");
const tick = () => new Promise(resolve => setImmediate(resolve));
const failure = name => Object.assign(new Error(name), { name });

// Transaction writes remain private until oncomplete. All transactions on a
// database are serialized, with abort preserving the committed store exactly.
function storageModel() {
  const databases = new Map(), log = [], held = []; let hold = false, abortNext = false;
  const key = value => JSON.stringify(value);
  function connection(record) {
    const db = { version: record.version, closed: false, objectStoreNames: { contains: name => record.stores.has(name) },
      createObjectStore(name, options = {}) { record.stores.set(name, { keyPath: options.keyPath, values: new Map() }); },
      close() { this.closed = true; },
      transaction(names, mode = 'readonly') {
        if (this.closed) throw failure('InvalidStateError');
        names = Array.isArray(names) ? names : [names];
        for (const name of names) if (!record.stores.has(name)) throw failure('NotFoundError');
        const tx = { started: false, ended: false, pending: 0, requests: [], working: new Map(), error: null,
          abort() { if (this.ended) throw failure('InvalidStateError'); this.error = failure('AbortError'); this.ended = true; log.push({ kind: 'abort', db: record.name }); setImmediate(() => { this.onabort?.(); next(); }); },
          objectStore(name) {
            assert(names.includes(name), 'Store outside transaction');
            const shape = record.stores.get(name);
            const autoKey = value => Array.isArray(shape.keyPath) ? shape.keyPath.map(k => value[k]) : value[shape.keyPath];
            const request = fn => {
              const req = {}; tx.pending++;
              const run = () => setImmediate(() => {
                if (tx.ended) return;
                try { req.result = fn(tx.working.get(name)); req.onsuccess?.({ target: req }); }
                catch (error) { req.error = error; req.onerror?.(); tx.error = error; tx.abort(); return; }
                tx.pending--; maybeComplete();
              });
              if (tx.started) run(); else tx.requests.push(run);
              return req;
            };
            return {
              get: k => request(store => store.get(key(k))?.value),
              getKey: k => request(store => store.get(key(k))?.key),
              getAllKeys: () => request(store => [...store.values()].map(item => item.key)),
              add: (value, k = autoKey(value)) => request(store => { assert.equal(mode, 'readwrite'); if (store.has(key(k))) throw failure('ConstraintError'); store.set(key(k), { key: k, value }); return k; }),
              put: (value, k = autoKey(value)) => request(store => { assert.equal(mode, 'readwrite'); store.set(key(k), { key: k, value }); return k; }),
              delete: k => request(store => { assert.equal(mode, 'readwrite'); store.delete(key(k)); }),
              openCursor() {
                const req = {}; let values, position = 0; tx.pending++;
                const run = () => setImmediate(() => {
                  if (tx.ended) return;
                  if (!values) values = [...tx.working.get(name).values()];
                  const item = values[position++];
                  req.result = item ? { key: item.key, value: item.value, continue: run } : null;
                  try { req.onsuccess?.({ target: req }); } catch (_) { tx.abort(); return; }
                  if (!item) { tx.pending--; maybeComplete(); }
                });
                if (tx.started) run(); else tx.requests.push(run);
                return req;
              }
            };
          }
        };
        const next = () => { if (record.active === tx) record.active = null; startNext(record); };
        const commit = () => {
          if (tx.ended || tx.pending) return;
          if (abortNext && mode === 'readwrite' && record.name === 'sukunRec') { abortNext = false; tx.abort(); return; }
          if (mode === 'readwrite') for (const [name, values] of tx.working) record.stores.get(name).values = values;
          tx.ended = true; log.push({ kind: 'complete', db: record.name, mode, stores: names });
          try { tx.oncomplete?.(); } finally { next(); }
        };
        let completionQueued = false;
        function maybeComplete() {
          if (completionQueued || tx.ended || tx.pending) return;
          completionQueued = true;
          setImmediate(() => {
            completionQueued = false; if (tx.ended || tx.pending) return;
            if (hold && mode === 'readwrite' && record.name === 'sukunRec') { held.push(commit); return; }
            commit();
          });
        }
        tx.begin = () => { tx.started = true; for (const name of names) tx.working.set(name, new Map(record.stores.get(name).values)); for (const run of tx.requests) run(); maybeComplete(); };
        record.queue.push(tx); startNext(record); return tx;
      }
    }; return db;
  }
  function startNext(record) { if (!record.active && record.queue.length) { record.active = record.queue.shift(); setImmediate(() => record.active?.begin()); } }
  const indexedDB = { open(name, version) {
    const req = {}; setImmediate(() => {
      let record = databases.get(name), fresh = !record;
      if (!record) record = { name, version: version || 1, stores: new Map(), queue: [], active: null };
      req.result = connection(record); let aborted = false;
      req.transaction = { abort() { aborted = true; } };
      if (fresh) req.onupgradeneeded?.({ target: req });
      if (aborted) { req.error = failure('AbortError'); req.onerror?.(); return; }
      if (fresh) databases.set(name, record);
      req.onsuccess?.({ target: req });
    }); return req;
  } };
  return { indexedDB, databases, log, held,
    setHold(value) { hold = value; }, release() { hold = false; for (const fn of held.splice(0)) fn(); },
    abortNextWrite() { abortNext = true; },
    rows(name = 'sukunRec', store = 'clips') { return [...(databases.get(name)?.stores.get(store)?.values.values() || [])].map(item => [item.key, item.value]); }
  };
}
function channel() {
  const port1 = { onmessage: null, close() {} }, port2 = { close() {}, postMessage(data) { setImmediate(() => port1.onmessage?.({ data })); } };
  return { port1, port2 };
}
function fixture() {
  const world = origin(), disk = storageModel(); let pendingRecovery = false;
  const swContext = vm.createContext({ URL, self: {
    location: new URL('https://synthetic.invalid/sw.js'), registration: { scope: 'https://synthetic.invalid/' },
    clients: {
      get: async id => world.tabs.find(t => t.id === id && !t.closed) ? { id, type: 'window', url: 'https://synthetic.invalid/index.html' } : null,
      matchAll: async () => world.tabs.filter(t => !t.closed).map(t => ({ id: t.id, type: 'window', url: 'https://synthetic.invalid/index.html' }))
    }
  } });
  vm.runInContext(singleClientSource + ';globalThis.singleClient = recoverySingleSource;', swContext, { filename: 'sw-single-client-shipped.js' });
  const tab = () => {
    const t = world.tab(), c = t.window;
    Object.assign(c, { Blob, File, TextEncoder, Uint8Array, AbortController, Map, Set, Promise, atob, URL,
      MessageChannel: channel, indexedDB: disk.indexedDB,
      removeEventListener() {},
      close: () => { t.busy = false; t.paused = false; t.finishCalls = (t.finishCalls || 0) + 1; },
      tkSessionChanged() {},
      SukunTekkeSet: { discardCheckpoint: () => { t.checkpointDiscards = (t.checkpointDiscards || 0) + 1; } },
      SukunRecoveryData: { status: () => ({ pending: pendingRecovery, busy: false, reloadRequired: false }) }
    });
    c.crypto = { randomUUID: crypto.randomUUID, subtle: crypto.webcrypto.subtle };
    c.document.readyState = 'loading'; c.document.querySelector = () => ({ content: releaseBuild }); c.document.querySelectorAll = () => [];
    c.navigator.storage = { estimate: async () => ({ quota: 2 ** 30, usage: 0 }) };
    c.navigator.serviceWorker = { controller: { postMessage(message, [port]) {
      if (message.type === 'STATUS') { port.postMessage({ recoveryVersion: 'r1019', v: releaseBuild, complete: true }); return; }
      assert.equal(message.type, 'RECOVERY_SINGLE_CLIENT');
      Promise.resolve(swContext.singleClient({ source: { id: t.id } })).then(result => port.postMessage({ ok: true, single: true, clientId: result.id }), error => port.postMessage({ ok: false, error: error.message }));
    } } };
    vm.runInContext('let RECKEYS = new Set();\n' + backupSource + '\n' + catalogSource + '\n' + recordingSource + '\n' + finishSource + '\nwindow.testDB = REC_DB; window.testFinish = tkFinish;', c, { filename: 'shipped-recording-functions.js' });
    vm.runInContext(guardSource, c, { filename: 'recovery-versions-r1019.js' });
    vm.runInContext(importerSource, c, { filename: 'recording-salvage-r1020.js' });
    return t;
  };
  async function settle(promise) {
    let settled = false, result, error;
    Promise.resolve(promise).then(value => { settled = true; result = value; }, e => { settled = true; error = e; });
    const start = Date.now();
    while (!settled && Date.now() - start < 5000) { await world.flush(); await tick(); }
    assert(settled, 'Controlled operation did not settle within five seconds');
    if (error) throw error; return result;
  }
  async function inspect(t) {
    // Reconstructing a context supplies a fresh REC_DB closure/connection.
    const keys = await settle(t.window.testDB.keys()), out = [];
    for (const key of keys) {
      const blob = await settle(t.window.testDB.get(key));
      out.push({ key, bytes: blob.size, type: blob.type, sha256: crypto.createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex') });
    }
    return out.sort((a, b) => a.key.localeCompare(b.key));
  }
  return { world, disk, tab, settle, inspect, setPending: v => { pendingRecovery = v; },
    async destroy(t) { world.close(t, { abrupt: true }); await world.flush(); },
    import(t, text) { return settle(t.window.SukunRecordingSalvage.importJSON([new File([text], 'synthetic.json', { type: 'application/json' })])); }
  };
}
const original = Buffer.from([0, 1, 2, 3, 4, 240, 254, 255]);
const clipA = Buffer.from([11, 22, 33, 44, 55]), clipB = Buffer.from([65, 66, 67, 68, 69, 70]);
const backup = pairs => JSON.stringify({ uygulama: 'SUKUN', sur: 1, kayitlar: Object.fromEntries(pairs.map(([key, bytes]) => [key, { tur: 'audio/wav', veri: bytes.toString('base64') }])) });
const first = backup([['synthetic:keep', original]]);
const full = backup([['synthetic:keep', Buffer.from('do-not-overwrite')], ['synthetic:a', clipA], ['synthetic:b', clipB]]);
const expected = [['synthetic:keep', original], ['synthetic:a', clipA], ['synthetic:b', clipB]].map(([key, bytes]) => ({ key, bytes: bytes.length, type: 'audio/wav', sha256: crypto.createHash('sha256').update(bytes).digest('hex') })).sort((a, b) => a.key.localeCompare(b.key));
const results = [];
async function test(name, fn) { try { const detail = await fn(); results.push({ name, pass: true, detail }); } catch (error) { results.push({ name, pass: false, error: error.stack }); } }
(async () => {
  await test('Real importer and REC_DB commit missing-only synthetic JSON with exact original key retained', async () => {
    const f = fixture(), t = f.tab(); assert.equal((await f.import(t, first)).added, 1);
    const result = await f.import(t, full); assert.equal(result.added, 2); assert.equal(result.kept, 1);
    assert.deepEqual(await f.inspect(t), expected);
    assert(f.disk.log.filter(x => x.kind === 'complete' && x.db === 'sukunRec' && x.mode === 'readwrite').length >= 2);
    return { result, rows: expected };
  });
  await test('Import does not report success or expose staged records before transaction oncomplete', async () => {
    const f = fixture(), t = f.tab(); f.disk.setHold(true);
    let resolved = false;
    const operation = t.window.SukunRecordingSalvage.importJSON([new File([first], 'first.json')]).then(result => { resolved = true; return result; });
    for (let i = 0; i < 150 && !f.disk.held.length; i++) { await f.world.flush(); await tick(); }
    assert.equal(f.disk.held.length, 1); assert.equal(resolved, false); assert.equal(f.disk.rows().length, 0);
    f.disk.release(); assert.equal((await f.settle(operation)).added, 1); assert.equal(f.disk.rows().length, 1);
  });
  await test('Repeated import is idempotent and does not replace different bytes on an existing key', async () => {
    const f = fixture(), t = f.tab(); await f.import(t, first); await f.import(t, full);
    for (let i = 0; i < 3; i++) { const result = await f.import(t, full); assert.equal(result.added, 0); assert.equal(result.kept, 3); assert.deepEqual(await f.inspect(t), expected); }
  });
  await test('Shipped Finish, destroyed/recreated VM page and second recreated VM preserve count, bytes and hashes', async () => {
    const f = fixture(); let t = f.tab(); await f.import(t, first); await f.import(t, full);
    t.window.testFinish(); assert.equal(t.finishCalls, 1); assert.deepEqual(await f.inspect(t), expected);
    await f.destroy(t); t = f.tab(); assert.deepEqual(await f.inspect(t), expected);
    await f.destroy(t); t = f.tab(); assert.deepEqual(await f.inspect(t), expected);
    return { contexts: 3, count: expected.length, blobBytes: expected.reduce((n, row) => n + row.bytes, 0), limitation: 'VM reconstruction models reload/restart; no browser process was restarted' };
  });
  for (const [label, input] of [['Malformed JSON', '{'], ['Empty file', ''], ['Empty recording map', backup([])], ['Empty audio payload', JSON.stringify({ uygulama: 'SUKUN', sur: 1, kayitlar: { broken: { tur: 'audio/wav', veri: '' } } })]]) {
    await test(label + ' rejects without losing prior synthetic recordings', async () => {
      const f = fixture(), t = f.tab(); await f.import(t, first); await f.import(t, full);
      await assert.rejects(f.import(t, input)); assert.deepEqual(await f.inspect(t), expected);
    });
  }
  await test('Aborted main write preserves originals and retained verified quarantine copy', async () => {
    const f = fixture(), t = f.tab(); await f.import(t, first); const before = await f.inspect(t);
    f.disk.abortNextWrite(); await assert.rejects(f.import(t, full)); assert.deepEqual(await f.inspect(t), before);
    assert(f.disk.rows('sukunVoiceQuarantineR1020', 'clips').length >= 3);
  });
  await test('Actual owner guard rejects active local session, then import works after shipped Finish', async () => {
    const f = fixture(), t = f.tab(); t.busy = true;
    await assert.rejects(f.import(t, first), e => e.code === 'finish-first'); assert.equal(f.disk.rows().length, 0);
    t.window.testFinish(); assert.equal((await f.import(t, first)).added, 1);
  });
  await test('Actual owner guard rejects a competing tab that holds the origin lock', async () => {
    const f = fixture(), a = f.tab(), b = f.tab(); assert.equal(await f.settle(a.owner.acquire()), true);
    await assert.rejects(f.import(b, first), e => e.code === 'owner-blocked'); assert.equal(f.disk.rows().length, 0);
  });
  await test('Shipped SW single-client function rejects an idle second client, succeeds only after it closes', async () => {
    const f = fixture(), a = f.tab(), b = f.tab();
    await assert.rejects(f.import(a, first), e => e.code === 'OTHER_APP_TAB_OPEN'); assert.equal(f.disk.rows().length, 0);
    await f.destroy(b); assert.equal((await f.import(a, first)).added, 1);
  });
  await test('Pending recovery guard prevents additions without mutating prior recordings', async () => {
    const f = fixture(), t = f.tab(); await f.import(t, first); const before = await f.inspect(t); f.setPending(true);
    await assert.rejects(f.import(t, full), e => e.code === 'recovery-pending'); assert.deepEqual(await f.inspect(t), before);
  });
  await test('Shipped SW update handler gates activation on readiness and never touches model recording bytes', async () => {
    const f = fixture(), t = f.tab(); await f.import(t, first); await f.import(t, full);
    for (const ready of [false, true]) {
      let activation = 0, response, wait;
      const c = vm.createContext({ SURUM: releaseBuild, currentComplete: async () => ready, prepareShell: async () => ({ complete: ready }),
        updateDeadline: fn => fn(), self: { skipWaiting: async () => { activation++; } },
        replyUpdate: (port, value) => { response = value; }, d: { type: 'SKIP_WAITING' }, port: {}, event: { waitUntil: task => { wait = task; } } });
      vm.runInContext('(function(){\n' + updateSource + '\n})();', c, { filename: 'shipped-sw-update-handler.js' }); await wait;
      assert.equal(activation, ready ? 1 : 0); assert.equal(response.ok, ready); assert.deepEqual(await f.inspect(t), expected);
    }
    await f.destroy(t); const next = f.tab(); assert.deepEqual(await f.inspect(next), expected);
    return { limitation: 'Readiness/activation endpoints are modeled; no CacheStorage hashing, SW lifecycle or actual r1020-to-r1021 browser update is claimed' };
  });
  const report = { mode: 'Controlled source-level Node VM and transaction-complete IndexedDB model', actualBrowser: false, actualPhone: false, root, releaseBuild,
    sourceHashes: Object.fromEntries([['index.html', html], ['sw.js', swSource], ['recording-salvage-r1020.js', importerSource], ['tab-owner-r981.js', read('assets/runtime/tab-owner-r981.js')]].map(([name, text]) => [name, crypto.createHash('sha256').update(text).digest('hex')])),
    total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results };
  console.log(JSON.stringify(report, null, 2)); process.exitCode = report.failed ? 1 : 0;
})();
