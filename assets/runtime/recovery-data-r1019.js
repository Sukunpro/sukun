/* r1019 — personal data restore points. Application files are separate.
 * A committed and read-verified before-image precedes every original write.
 * Each audio store changes in one transaction. A durable journal compensates
 * between databases and localStorage, including an interrupted browser reload.
 * The five listed restore points are not five previously installed app builds.
 */
(() => {
  'use strict';
  if (window.SukunRecoveryData) return;
  const DB = 'sukunRecoveryDataR1019', SCHEMA = 1, MAX_POINTS = 5;
  const STORES = [['sukunRec', 'clips'], ['sukunCustomAmb', 'sounds']];
  const LIMIT = { count: 2000, clip: 64 * 1048576, audio: 1024 * 1048576, setting: 4 * 1048576, settings: 16 * 1048576, file: 300 * 1048576 };
  const MIRRORS = new Set(['sukun.progress.journal.v1', 'sukun.session.r470', 'sukun.session.player.v2', 'sukun.lifecycle.checkpoint']);
  const EXTRA_PREFS = new Set(['sukun.tickSound', 'sukun.hybrid.mix', 'tekke.journey.checkpoint']);
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const text = (tr, en) => window.I18N?.lang === 'en' ? en : tr;
  const err = (code, tr, en) => Object.assign(new Error(text(tr, en)), { code, tr, en });
  const message = e => text(e?.tr || e?.message || 'İşlem tamamlanamadı.', e?.en || e?.message || 'Operation did not finish.');
  let operation = null, pending = true, readyError = '', needsReload = false, lastMessage = '';

  function allowedKey(k) {
    if (typeof k !== 'string' || !/^(sukun|tekke)\./.test(k) || k.length > 200) return false;
    if (/^sukun\.(?:aikey|ai\.key\.|tab\.|update\.|recovery\.|recording\.continuity\.)/.test(k) || /(?:token|credential|password|secretKey)/i.test(k) || ['sukun.kilitPin', 'sukun.kilitAcik'].includes(k)) return false;
    return MIRRORS.has(k) || EXTRA_PREFS.has(k) || (typeof SK_YEDEK_KEYS !== 'undefined' && SK_YEDEK_KEYS.has(k)) || /^sukun\.(?:berhet\.note\.\d{1,3}|yonerge\.[A-Za-z0-9_-]{1,80}|zMega\.[A-Za-z0-9_-]{1,80})$/.test(k);
  }
  function validateLS(ls) {
    if (!object(ls) || Object.keys(ls).length > 1000) throw err('settings-invalid', 'Ayar listesi geçersiz.', 'Invalid settings list.');
    let size = 0;
    for (const [k, v] of Object.entries(ls)) {
      if (!allowedKey(k) || typeof v !== 'string' || v.length > LIMIT.setting || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(v)) throw err('settings-invalid', 'Yedekte desteklenmeyen ayar var.', 'The backup contains unsupported settings.');
      if (typeof skYedekDeger !== 'function' || skYedekDeger(k, v) === null) throw err('settings-invalid', 'Bir ayar güvenli biçimde doğrulanamadı.', 'A setting could not be safely validated.');
      size += v.length * 2;
      if (size > LIMIT.settings) throw err('settings-limit', 'Ayar yedeği boyut sınırını aşıyor.', 'Settings backup exceeds the size limit.');
    }
    return size;
  }
  function captureLS() {
    const out = Object.create(null);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (allowedKey(k)) out[k] = localStorage.getItem(k);
    }
    validateLS(out); return out;
  }
  function assertion(lease, abortable = true) {
    lease.assertCurrent();
    if (abortable && operation?.cancelled) throw err('cancelled', 'İşlem iptal edildi.', 'Operation cancelled.');
  }
  async function singleClient(lease, abortable = true) {
    assertion(lease, abortable);
    if (typeof window.SukunRecoveryGuard?.assertSingleClient !== 'function') throw err('single-client-unavailable', 'Tek pencere koruması hazır değil. Güncel uygulamayı yeniden aç.', 'Single-window protection is not ready. Reload the current app.');
    await window.SukunRecoveryGuard.assertSingleClient(lease); assertion(lease, abortable);
  }
  async function maintenance(kind, work, { allowPending = false } = {}) {
    if (operation) throw err('busy', 'Başka bir veri işlemi sürüyor.', 'Another data operation is running.');
    if ((pending && !allowPending) || needsReload) throw err('recovery-pending', needsReload ? 'Veri değişti; devam etmeden önce uygulamayı yeniden aç.' : 'Önce yarım kalan geri yüklemeyi kurtar.', needsReload ? 'Data changed; reload the app before continuing.' : 'Recover the interrupted restore first.');
    if (!window.SukunTabOwner?.maintenance) throw err('lease-unavailable', 'Güvenli veri işlemi kilidi hazır değil.', 'The safe data maintenance lock is not ready.');
    operation = { kind, cancelled: false }; render();
    try {
      const result = await window.SukunTabOwner.maintenance('recovery-' + kind, lease => work(lease));
      if (result === false) throw err('finish-first', 'Önce etkin zikri, dinlemeyi veya mikrofon kaydını bitir. Başka sekmedeki işlem de tamamlanmalı.', 'Finish active dhikr, listening or microphone recording first. Any operation in another tab must also finish.');
      return result;
    } finally { operation = null; render(); }
  }
  function openRecovery() {
    return new Promise((resolve, reject) => {
      let settled = false; const rq = indexedDB.open(DB, 1);
      const timer = setTimeout(() => done(null, err('db-timeout', 'Kurtarma deposu yanıt vermedi.', 'Recovery storage did not respond.')), 10000);
      function done(db, e) { if (settled) { db?.close(); return; } settled = true; clearTimeout(timer); e ? reject(e) : resolve(db); }
      rq.onupgradeneeded = () => { if (settled) { rq.transaction.abort(); return; } const db = rq.result; db.createObjectStore('points', { keyPath: 'id' }); db.createObjectStore('meta', { keyPath: 'key' }); };
      rq.onblocked = () => done(null, err('db-blocked', 'Kurtarma deposu başka sekmede kilitli.', 'Recovery storage is blocked by another tab.'));
      rq.onerror = () => done(null, rq.error);
      rq.onsuccess = () => done(rq.result);
    });
  }
  async function recoveryTx(mode, work) {
    const db = await openRecovery();
    try {
      return await new Promise((resolve, reject) => {
        let result, settled = false; const tx = db.transaction(['points', 'meta'], mode);
        const timer = setTimeout(() => { try { tx.abort(); } catch (_) {} done(err('db-timeout', 'Kurtarma işlemi süre sınırını aştı.', 'Recovery operation timed out.')); }, 30000);
        function done(e) { if (settled) return; settled = true; clearTimeout(timer); e ? reject(e) : resolve(result); }
        tx.oncomplete = () => done(); tx.onabort = tx.onerror = () => done(tx.error || new Error('Recovery transaction aborted'));
        try { result = work(tx.objectStore('points'), tx.objectStore('meta')); } catch (e) { try { tx.abort(); } catch (_) {} done(e); }
      });
    } finally { db.close(); }
  }
  async function getMeta(key) { let rq; await recoveryTx('readonly', (p, m) => { rq = m.get(key); }); return rq.result?.value ?? null; }
  async function getPoint(id) { let rq; await recoveryTx('readonly', p => { rq = p.get(id); }); return rq.result || null; }
  async function points() { let rq; await recoveryTx('readonly', p => { rq = p.getAll(); }); return (rq.result || []).sort((a, b) => b.at - a.at); }

  function openSource(name, store, create = false) {
    return new Promise((resolve, reject) => {
      let settled = false, missing = false; const rq = indexedDB.open(name);
      const timer = setTimeout(() => finish(null, err('source-timeout', 'Ses deposu yanıt vermedi; boş yedek oluşturulmadı.', 'Audio storage did not respond; no empty backup was created.')), 10000);
      function finish(db, e) { if (settled) { db?.close(); return; } settled = true; clearTimeout(timer); e ? reject(e) : resolve(db); }
      rq.onupgradeneeded = event => {
        if (settled) { rq.transaction.abort(); return; }
        if (create && event.oldVersion === 0) rq.result.createObjectStore(store);
        else { missing = true; rq.transaction.abort(); }
      };
      rq.onblocked = () => finish(null, err('source-blocked', 'Ses deposu kilitli; işlem durduruldu.', 'Audio storage is blocked; operation stopped.'));
      rq.onerror = () => missing ? finish(null) : finish(null, rq.error);
      rq.onsuccess = () => {
        const db = rq.result;
        if (!db.objectStoreNames.contains(store) || db.version !== 1) { db.close(); finish(null, err('schema-unsupported', 'Ses deposunun bu şeması desteklenmiyor.', 'This audio storage schema is unsupported.')); return; }
        finish(db);
      };
    });
  }
  function validateAudio(name, key, value) {
    if (typeof key !== 'string' || !/^[\w:.-]{1,200}$/.test(key) || /^(?:__proto__|prototype|constructor)$/.test(key)) throw err('audio-key-invalid', 'Bir ses anahtarı desteklenmiyor.', 'An audio key is unsupported.');
    const blob = name === 'sukunRec' ? value : value?.blob;
    if (!(blob instanceof Blob) || blob.size <= 0 || blob.size > LIMIT.clip || blob.type && !/^audio\/[a-z0-9.+_-]+(?:;[^\u0000-\u001f]*)?$/i.test(blob.type)) throw err('audio-invalid', 'Bir ses boş, geçersiz veya boyut sınırını aşıyor.', 'A recording is empty, invalid or exceeds the size limit.');
    if (name === 'sukunCustomAmb') {
      if (!object(value) || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 64 || Object.keys(value).some(k => !['name', 'blob', 'mix', 'hybrid'].includes(k)) || value.mix != null && (!Number.isFinite(value.mix) || value.mix < 0 || value.mix > 1) || value.hybrid != null && typeof value.hybrid !== 'boolean') throw err('ambience-invalid', 'Bir özel ambiyans doğrulanamadı.', 'A custom ambience could not be validated.');
      if (!/^c\d{8,20}$/.test(key) && !/^h:[a-z0-9_-]{1,60}$/i.test(key)) throw err('ambience-key-invalid', 'Özel ambiyans anahtarı desteklenmiyor.', 'Custom ambience key is unsupported.');
    }
    return blob;
  }
  async function readSource(name, store, lease, abortable = true) {
    assertion(lease, abortable); const db = await openSource(name, store); assertion(lease, abortable);
    if (!db) {
      if (name === 'sukunRec' && typeof RECKEYS !== 'undefined' && RECKEYS.size) throw err('source-missing', 'Bilinen kayıtlar varken ses deposu bulunamadı; işlem durduruldu.', 'Audio storage is missing despite known recordings; operation stopped.');
      return { present: false, version: 1, entries: [] };
    }
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly'), st = tx.objectStore(store), entries = []; let ended = false, settled = false, bytes = 0;
        if (st.keyPath !== null || st.autoIncrement) { tx.abort(); reject(err('schema-unsupported', 'Ses deposu şeması desteklenmiyor.', 'Audio storage schema is unsupported.')); return; }
        const timer = setTimeout(() => abort(err('source-timeout', 'Ses deposu tamamen okunamadı.', 'Audio storage could not be fully read.')), 30000);
        function done(e) { if (settled) return; settled = true; clearTimeout(timer); window.removeEventListener('sukun:tabownerchange', changed); e ? reject(e) : resolve({ present: true, version: 1, entries }); }
        function abort(e) { try { tx.abort(); } catch (_) {} done(e); }
        function changed() { try { assertion(lease, abortable); } catch (e) { abort(e); } }
        window.addEventListener('sukun:tabownerchange', changed);
        const rq = st.openCursor();
        rq.onsuccess = () => { try { assertion(lease, abortable); const cursor = rq.result; if (!cursor) { ended = true; return; } const blob = validateAudio(name, cursor.key, cursor.value); bytes += blob.size; if (entries.length >= LIMIT.count || bytes > LIMIT.audio) throw err('audio-limit', 'Ses deposu yedek sınırını aşıyor.', 'Audio storage exceeds backup limits.'); entries.push([cursor.key, cursor.value]); cursor.continue(); } catch (e) { abort(e); } };
        tx.oncomplete = () => done(ended ? null : new Error('Incomplete audio read')); tx.onerror = tx.onabort = () => done(tx.error || new Error('Audio read aborted'));
      });
    } finally { db.close(); }
  }
  async function hashBytes(bytes) {
    if (!crypto?.subtle?.digest) throw err('hash-unavailable', 'Bütünlük doğrulaması hazır değil; işlem durduruldu.', 'Integrity verification is unavailable; operation stopped.');
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('');
  }
  async function fingerprint(point, lease = null, abortable = true) {
    validateLS(point.ls);
    if (point.schema !== SCHEMA || point.app !== 'SUKUN-Recovery' || !Number.isSafeInteger(point.at) || point.at <= 0 || point.at > Date.now() + 60000 || typeof point.build !== 'string' || !/^r\d{1,8}$/.test(point.build) || !object(point.stores) || Object.keys(point.stores).length !== 2) throw err('point-invalid', 'Kurtarma noktası geçersiz.', 'Invalid restore point.');
    const serial = { schema: SCHEMA, app: point.app, at: point.at, build: point.build, ls: Object.entries(point.ls).sort(([a], [b]) => a.localeCompare(b)), stores: {} };
    let bytes = 0;
    for (const [name] of STORES) {
      const saved = point.stores[name];
      if (!object(saved) || typeof saved.present !== 'boolean' || saved.version !== 1 || !Array.isArray(saved.entries) || saved.entries.length > LIMIT.count || !saved.present && saved.entries.length) throw err('point-invalid', 'Kurtarma noktasındaki depo bilgisi geçersiz.', 'Invalid storage information in restore point.');
      const seen = new Set(), items = [];
      for (const pair of saved.entries) {
        lease && assertion(lease, abortable);
        if (!Array.isArray(pair) || pair.length !== 2 || seen.has(pair[0])) throw err('audio-duplicate', 'Kurtarma noktasında yinelenen ses var.', 'Restore point contains duplicate audio.');
        const [key, value] = pair, blob = validateAudio(name, key, value); seen.add(key); bytes += blob.size;
        if (bytes > LIMIT.audio) throw err('audio-limit', 'Toplam ses boyutu yedek sınırını aşıyor.', 'Total audio exceeds backup limits.');
        const metadata = name === 'sukunRec' ? null : Object.fromEntries(Object.entries(value).filter(([k]) => k !== 'blob').sort(([a], [b]) => a.localeCompare(b)));
        items.push([key, { size: blob.size, type: blob.type, sum: await hashBytes(await blob.arrayBuffer()), metadata }]);
      }
      serial.stores[name] = { present: saved.present, version: 1, entries: items.sort(([a], [b]) => a.localeCompare(b)) };
    }
    lease && assertion(lease, abortable);
    return { digest: await hashBytes(new TextEncoder().encode(JSON.stringify(serial))), bytes, count: point.stores.sukunRec.entries.length, ambiance: point.stores.sukunCustomAmb.entries.length };
  }
  async function verify(point, lease = null, abortable = true) {
    if (!point || typeof point.digest !== 'string') throw err('point-missing', 'Kurtarma noktası bulunamadı.', 'Restore point was not found.');
    const result = await fingerprint(point, lease, abortable);
    if (result.digest !== point.digest) throw err('checksum-failed', 'Yedek bütünlüğü doğrulanamadı; hiçbir veri değiştirilmedi.', 'Backup integrity failed; no data was changed.');
    return point;
  }
  async function capture(lease, label = '', abortable = true) {
    assertion(lease, abortable);
    const ls = captureLS(), stores = Object.create(null);
    for (const [name, store] of STORES) stores[name] = await readSource(name, store, lease, abortable);
    if (JSON.stringify(captureLS()) !== JSON.stringify(ls)) throw err('data-changed', 'Okuma sırasında ayarlar değişti; yeniden dene.', 'Settings changed during the read; retry.');
    const point = { schema: SCHEMA, app: 'SUKUN-Recovery', id: crypto.randomUUID(), at: Date.now(), build: document.querySelector('meta[name="sukun-build"]')?.content || 'r1019', label: String(label).slice(0, 80), ls, stores };
    Object.assign(point, await fingerprint(point, lease, abortable));
    if (JSON.stringify(captureLS()) !== JSON.stringify(ls)) throw err('data-changed', 'Doğrulama sırasında ayarlar değişti; yeniden dene.', 'Settings changed during verification; retry.');
    return point;
  }
  async function quota(required) {
    if (!navigator.storage?.estimate) throw err('quota-unknown', 'Boş depolama alanı doğrulanamadı; işlem durduruldu.', 'Free storage could not be verified; operation stopped.');
    const q = await navigator.storage.estimate();
    if (!Number.isFinite(q.quota) || !Number.isFinite(q.usage) || q.quota - q.usage < required + 4 * 1048576) throw err('quota-low', 'Doğrulanmış yedek ve geri alma için depolama alanı yetersiz.', 'Insufficient storage for a verified backup and rollback.');
  }
  async function save(point, lease, abortable = true) {
    assertion(lease, abortable); await quota(point.bytes + validateLS(point.ls)); assertion(lease, abortable);
    // A cancelled/unreadable newly committed point is never advertised as a
    // verified point. The independently retained before-image stays hidden.
    const staged = { ...point, listed: false };
    await recoveryTx('readwrite', p => p.add(staged));
    assertion(lease, abortable); const stored = await getPoint(point.id); await verify(stored, lease, abortable);
    if (point.listed !== false) {
      assertion(lease, abortable); stored.listed = true;
      await recoveryTx('readwrite', p => p.put(stored));
    }
    return stored;
  }
  async function prune() {
    const [all, journal, undo] = await Promise.all([points(), getMeta('journal'), getMeta('undo')]);
    const keep = new Set(all.filter(p => p.listed !== false).slice(0, MAX_POINTS).map(p => p.id));
    if (journal?.beforeId) keep.add(journal.beforeId); if (undo?.beforeId) keep.add(undo.beforeId);
    await recoveryTx('readwrite', p => { for (const point of all) if (!keep.has(point.id)) p.delete(point.id); });
  }
  function summary(point) { return { id: point.id, at: point.at, build: point.build, label: point.label || '', recordings: point.count, ambiance: point.ambiance, bytes: point.bytes }; }
  async function list() { return (await points()).filter(p => p.listed !== false).slice(0, MAX_POINTS).map(summary); }
  async function create(label = '') {
    return maintenance('snapshot', async lease => {
      const point = await save(await capture(lease, label), lease); await prune();
      lastMessage = text('Güvenli kurtarma noktası kaydedildi ve bütünlüğü doğrulandı.', 'Safe restore point saved and integrity verified.');
      return summary(point);
    });
  }
  async function replaceSource(name, store, saved, lease, abortable) {
    assertion(lease, abortable); const db = await openSource(name, store, saved.present); assertion(lease, abortable);
    if (!db) { if (saved.entries.length) throw new Error('Missing audio store'); return; }
    try {
      await singleClient(lease, abortable);
      await new Promise((resolve, reject) => {
        let settled = false; const tx = db.transaction(store, 'readwrite'), st = tx.objectStore(store);
        const timer = setTimeout(() => abort(err('write-timeout', 'Ses yazma işlemi süre sınırını aştı.', 'Audio write timed out.')), 30000);
        function done(e) { if (settled) return; settled = true; clearTimeout(timer); window.removeEventListener('sukun:tabownerchange', changed); e ? reject(e) : resolve(); }
        function abort(e) { try { tx.abort(); } catch (_) {} done(e); }
        function changed() { try { assertion(lease, abortable); } catch (e) { abort(e); } }
        window.addEventListener('sukun:tabownerchange', changed);
        tx.oncomplete = () => done(); tx.onabort = tx.onerror = () => done(tx.error || new Error('Audio write aborted'));
        try { assertion(lease, abortable); if (st.keyPath !== null || st.autoIncrement) throw new Error('Unsupported audio schema'); st.clear(); for (const [key, value] of saved.entries) { assertion(lease, abortable); st.put(value, key); } } catch (e) { abort(e); }
      });
    } finally { db.close(); }
    assertion(lease, abortable);
  }
  function replaceLS(ls, lease, abortable) {
    assertion(lease, abortable); const keys = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (allowedKey(k)) keys.push(k); }
    for (const k of keys) { assertion(lease, abortable); if (!own(ls, k)) localStorage.removeItem(k); }
    for (const [k, v] of Object.entries(ls)) { assertion(lease, abortable); localStorage.setItem(k, v); }
    for (const k of keys) if (!own(ls, k) && localStorage.getItem(k) !== null) throw new Error('Settings removal failed');
    for (const [k, v] of Object.entries(ls)) if (localStorage.getItem(k) !== v) throw new Error('Settings write verification failed');
  }
  async function apply(point, lease, abortable = true) {
    await singleClient(lease, abortable);
    for (const [name, store] of STORES) await replaceSource(name, store, point.stores[name], lease, abortable);
    await singleClient(lease, abortable);
    replaceLS(point.ls, lease, abortable);
    const actual = await capture(lease, '', abortable); actual.at = point.at; actual.build = point.build;
    const result = await fingerprint(actual, lease, abortable);
    // An originally absent store can remain an empty initialized store. This
    // has the same personal data; no application schema/database is deleted.
    if (result.digest !== point.digest) {
      for (const [name] of STORES) if (!point.stores[name].present && actual.stores[name].entries.length === 0) actual.stores[name].present = false;
      if ((await fingerprint(actual, lease, abortable)).digest !== point.digest) throw err('write-verification-failed', 'Geri yüklenen veri yedekle aynı değil.', 'Restored data does not match the backup.');
    }
  }
  function checkPrivate(point) {
    const policy = window.SukunSecretPolicy;
    if (!policy || policy.unlocked?.()) return;
    if (Object.keys(point.ls).some(k => policy.privateLocalKey?.(k)) || point.stores.sukunRec.entries.some(([k]) => policy.secretRecKey?.(k))) throw err('unlock-required', 'Bu tam nokta gizli bölüm verilerini de içeriyor. Önce Berhetiyye bölümünü aç.', 'This complete point also contains private section data. Unlock the Berhetiyye section first.');
  }
  async function rollbackJournal(journal, lease) {
    if (!object(journal) || journal.schema !== 1 || typeof journal.beforeId !== 'string') throw err('journal-invalid', 'Kurtarma işlem günlüğü geçersiz; otomatik yazma yapılmadı.', 'Recovery transaction journal is invalid; no automatic write was made.');
    const before = await verify(await getPoint(journal.beforeId), lease, false);
    await apply(before, lease, false); lease.assertCurrent();
    await recoveryTx('readwrite', (p, m) => m.delete('journal'));
    pending = false; readyError = ''; return before;
  }
  function reloadSoon() { needsReload = true; render(); setTimeout(() => location.reload(), 80); }
  async function restorePoint(point, lease, options = {}) {
    await verify(point, lease); checkPrivate(point); assertion(lease);
    await singleClient(lease);
    const before = await capture(lease, text('Geri yükleme öncesi', 'Before restore')); before.listed = false;
    await quota(before.bytes + point.bytes + validateLS(before.ls) + validateLS(point.ls));
    await save(before, lease); assertion(lease);
    const journal = { schema: 1, beforeId: before.id, at: Date.now(), targetDigest: point.digest };
    await recoveryTx('readwrite', (p, m) => m.put({ key: 'journal', value: journal }));
    pending = true; render();
    try {
      const receipt = await getMeta('journal');
      if (receipt?.beforeId !== before.id || receipt?.targetDigest !== point.digest) throw new Error('Recovery journal verification failed');
      assertion(lease); await apply(point, lease); assertion(lease);
      await recoveryTx('readwrite', (p, m) => { m.put({ key: 'undo', value: { schema: 1, beforeId: before.id, at: Date.now() } }); m.delete('journal'); });
      pending = false; needsReload = true;
      lastMessage = text('Veriler doğrulanarak geri yüklendi. Yeniden açıldığında ses kendiliğinden başlamaz. Geri al noktası hazır.', 'Data restored and verified. Audio will not start automatically after reload. Undo point is ready.');
      await prune(); if (options.reload !== false) reloadSoon();
      return { ok: true, restored: summary(point), undoAvailable: true, reloadRequired: true };
    } catch (failure) {
      let rolledBack = false;
      try { await rollbackJournal(journal, lease); rolledBack = true; } catch (rollbackError) { pending = true; readyError = message(rollbackError); }
      lastMessage = rolledBack ? text('İşlem tamamlanamadı; önceki veriler doğrulanarak geri getirildi.', 'Operation did not finish; previous data was restored and verified.') : text('İşlem yarım kaldı. Önce kurtarmayı tamamla; eski verinin güvenli kopyası saklı.', 'Operation was interrupted. Finish recovery first; a safe copy of the previous data is retained.');
      if (rolledBack) { needsReload = true; if (options.reload !== false) reloadSoon(); }
      throw Object.assign(failure, { rolledBack, recoveryPending: !rolledBack });
    }
  }
  async function restore(id, options = {}) { return maintenance('restore', async lease => restorePoint(await getPoint(id), lease, options)); }
  async function undo(options = {}) {
    return maintenance('undo', async lease => { const u = await getMeta('undo'); if (!u?.beforeId) throw err('undo-unavailable', 'Geri alınacak bir işlem yok.', 'There is no operation to undo.'); return restorePoint(await getPoint(u.beforeId), lease, options); });
  }
  async function recoverPending(options = {}) {
    return maintenance('recover', async lease => {
      const journal = await getMeta('journal');
      if (!journal) { pending = false; readyError = ''; return { ok: true, changed: false }; }
      await rollbackJournal(journal, lease); needsReload = true;
      lastMessage = text('Yarım kalan işlemden önceki veri doğrulanarak geri getirildi.', 'The data from before the interrupted operation was restored and verified.');
      if (options.reload !== false) reloadSoon(); return { ok: true, changed: true, reloadRequired: true };
    }, { allowPending: true });
  }
  async function blobURI(blob) {
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.onabort = () => reject(new Error('Audio read aborted')); reader.readAsDataURL(blob); });
  }
  function decodeURI(uri, type) {
    if (typeof uri !== 'string' || uri.length > 90 * 1048576) throw new Error('Invalid audio data');
    const found = /^data:([^;,]*)(?:;[^,]*)?;base64,([A-Za-z0-9+/]*={0,2})$/.exec(uri);
    if (!found || !found[2] || found[2].length % 4 || found[2].length * 3 / 4 > LIMIT.clip + 2) throw new Error('Invalid audio data');
    const mime = type ?? found[1];
    if (mime && !/^audio\//i.test(mime)) throw new Error('Invalid audio MIME');
    const raw = atob(found[2]), bytes = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  async function capturePortable({ lease, signal, ...options } = {}) {
      if (!lease?.assertCurrent || !lease?.current || pending || needsReload) throw err('lease-unavailable', 'Önce güvenli veri işlemi kilidi alınmalı.', 'Acquire the safe data maintenance lock first.');
      const inherited = lease;
      lease = { assertCurrent() { inherited.assertCurrent(); if (signal?.aborted) throw err('cancelled', 'İşlem iptal edildi.', 'Operation cancelled.'); }, current: () => inherited.current() && !signal?.aborted };
      const point = await capture(lease); checkPrivate(point);
      // Reject the portable representation before creating base64 strings or
      // one large JSON string. Native local restore points use a separate 1 GiB
      // audio cap because normalized WAV can be larger than the source clip.
      let projected = JSON.stringify(point.ls).length * 3 + 8192;
      for (const [name] of STORES) for (const [key, value] of point.stores[name].entries) {
        const blob = name === 'sukunRec' ? value : value.blob;
        projected += 4 * Math.ceil(blob.size / 3) + key.length * 3 + 1024;
      }
      if (projected > LIMIT.file) throw err('file-limit', 'Tam JSON yedek dosyası 300 MB sınırını aşacak. Yerel kurtarma noktası veya mevcut parçalı ses yedeğini kullan.', 'Full JSON backup would exceed 300 MB. Use a local restore point or the existing multipart audio backup.');
      const data = { app: 'SUKUN', fmt: 2, build: point.build, t: point.at, ls: point.ls, idb: { sukunRec: Object.create(null), sukunCustomAmb: Object.create(null) }, recovery: { schema: 1, mode: 'exact-personal-data', digest: point.digest, presence: Object.fromEntries(STORES.map(([n]) => [n, point.stores[n].present])) } };
      for (const [name] of STORES) for (const [key, value] of point.stores[name].entries) {
        assertion(lease); const blob = name === 'sukunRec' ? value : value.blob, uri = await blobURI(blob); assertion(lease);
        if (name === 'sukunRec') data.idb[name][key] = { __blob: uri, type: blob.type };
        else { const metadata = Object.fromEntries(Object.entries(value).filter(([k]) => k !== 'blob')); data.idb[name][key] = { [key.startsWith('h:') ? '__hybridRecord' : '__audioRecord']: { ...metadata, blob: uri, type: blob.type } }; }
      }
      const file = new Blob([JSON.stringify(data)], { type: 'application/json' });
      if (file.size > LIMIT.file) throw err('file-limit', 'Tam yedek dosyası 300 MB sınırını aşıyor. Mevcut parçalı ses yedeğini kullan.', 'Full backup file exceeds 300 MB. Use the existing multipart audio backup.');
      if (options.download !== false) { const a = document.createElement('a'), url = URL.createObjectURL(file); a.href = url; a.download = 'SUKUN_KISISEL_TAM_YEDEK_' + point.build + '_' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000); }
      lastMessage = text('Kişisel tam yedek hazır. Uygulama dosyaları ve sürüm arşivi ayrı bölümde yönetilir.', 'Full personal backup ready. Application files and version archive are managed separately.');
      return { ok: true, file, data: options.download === false ? data : undefined, ...summary(point) };
  }
  async function exportPersonal(options = {}) {
    return maintenance('export', lease => capturePortable({ ...options, lease }));
  }
  async function importPersonal(file, options = {}) {
    return maintenance('import', async lease => {
      if (!(file instanceof Blob) || !file.size || file.size > LIMIT.file) throw err('file-invalid', 'Yedek dosyası boş veya boyut sınırını aşıyor.', 'Backup file is empty or exceeds the size limit.');
      const raw = await file.text(); assertion(lease); const data = JSON.parse(raw);
      if (!object(data) || data.app !== 'SUKUN' || ![1, 2].includes(data.fmt) || !object(data.ls) || !object(data.idb) || Object.keys(data.idb).some(n => !STORES.some(([name]) => name === n))) throw err('format-unsupported', 'Yalnız doğrulanabilir SÜKÛN tam JSON yedekleri destekleniyor.', 'Only verifiable SUKUN full JSON backups are supported.');
      const exact = data.recovery?.schema === 1 && data.recovery?.mode === 'exact-personal-data';
      if (data.recovery && !exact) throw err('format-unsupported', 'Kurtarma yedeği sürümü desteklenmiyor.', 'Recovery backup version is unsupported.');
      const point = await capture(lease, text('İçe aktarılan yedek', 'Imported backup'));
      if (exact) point.ls = Object.create(null);
      for (const [k, v] of Object.entries(data.ls)) if (allowedKey(k)) point.ls[k] = v; else if (exact) throw err('settings-invalid', 'Kurtarma yedeğinde desteklenmeyen anahtar var.', 'Recovery backup contains an unsupported key.');
      validateLS(point.ls);
      for (const [name] of STORES) {
        const input = data.idb[name];
        if (input == null) { if (exact) throw new Error('Incomplete recovery backup'); continue; }
        if (!object(input) || Object.keys(input).length > LIMIT.count) throw new Error('Invalid audio list');
        const entries = exact ? new Map() : new Map(point.stores[name].entries);
        for (const [k, value] of Object.entries(input)) {
          assertion(lease); let converted;
          if (name === 'sukunRec') converted = decodeURI(value?.__blob, value?.type);
          else { const h = k.startsWith('h:'), v = h ? value?.__hybridRecord : value?.__audioRecord; if (!object(v)) throw new Error('Invalid custom ambience'); converted = Object.fromEntries(Object.entries(v).filter(([key]) => !['blob', 'type'].includes(key))); if (!exact && h) converted.hybrid = true; converted.blob = decodeURI(v.blob, v.type); }
          validateAudio(name, k, converted); entries.set(k, converted);
        }
        point.stores[name] = { present: exact ? data.recovery.presence?.[name] : point.stores[name].present || entries.size > 0, version: 1, entries: [...entries] };
      }
      if (exact) { point.at = data.t; point.build = data.build; point.digest = data.recovery.digest; await verify(point, lease); }
      else Object.assign(point, await fingerprint(point, lease));
      checkPrivate(point); assertion(lease);
      if (options.confirm !== false && !confirm(text('Kişisel veriler geri yüklenecek. Önce mevcut verilerin doğrulanmış geri alma noktası hazırlanır. Devam?', 'Personal data will be restored. A verified undo point of current data is prepared first. Continue?'))) return { ok: false, cancelled: true };
      return restorePoint(point, lease, options);
    });
  }

  function render() {
    const root = document.getElementById('r1019DataRecovery'); if (!root) return;
    const emergency = document.getElementById('r1019RecoveryOpen');
    if (emergency) { emergency.hidden = !(pending || needsReload); emergency.textContent = text('🛟 Kurtarmayı aç', '🛟 Open recovery'); }
    root.querySelector('[data-role="title"]').textContent = text('🛟 KURTARMA MERKEZİ', '🛟 RECOVERY CENTRE');
    root.querySelector('[data-role="intro"]').textContent = text('Kişisel veri noktası: ayarlar, sayaçlar, günlükler, seanslar, kendi seslerin ve özel ambiyanslar. Son 5 doğrulanmış nokta tutulur. Uygulama sürümü ayrı seçilir.', 'Personal data point: settings, counters, journals, sessions, your recordings and custom ambience. The last 5 verified points are kept. App version is selected separately.');
    const labels = { create: ['Güvenli kurtarma noktası oluştur', 'Create safe restore point'], export: ['Kişisel tam yedeği indir', 'Download full personal backup'], import: ['JSON yedeğini geri yükle', 'Restore JSON backup'], restore: ['Seçili noktaya dön', 'Restore selected point'], undo: ['Son veri geri yüklemesini geri al', 'Undo last data restore'], recover: ['Yarım kalan işlemi kurtar', 'Recover interrupted operation'], cancel: ['İptal et ve geri al', 'Cancel and roll back'], reload: ['Uygulamayı yeniden aç', 'Reload application'] };
    for (const [key, pair] of Object.entries(labels)) { const b = root.querySelector('[data-action="' + key + '"]'); b.textContent = text(...pair); b.disabled = !!operation || (pending || needsReload) && !['recover', 'reload'].includes(key); }
    const select = root.querySelector('[data-role="points"]'); select.disabled = !!operation || pending || needsReload;
    if (!select.value) root.querySelector('[data-action="restore"]').disabled = true;
    root.querySelector('[data-action="recover"]').hidden = !pending || !!operation;
    root.querySelector('[data-action="reload"]').hidden = !needsReload;
    const cancel = root.querySelector('[data-action="cancel"]'); cancel.hidden = !operation; cancel.disabled = !operation || operation.cancelled;
    root.querySelector('[data-role="status"]').textContent = operation ? text('İşlem sürüyor; veri bütünlüğü kontrol ediliyor…', 'Operation in progress; checking data integrity…') : readyError || lastMessage || text('Henüz kurtarma işlemi yapılmadı.', 'No recovery operation has been performed.');
    root.querySelector('[data-role="warning"]').textContent = text('Bu noktalar aynı tarayıcıda saklanır. Tarayıcı verileri silinirse onlar da kaybolabilir; JSON yedeğini ayrıca indir. Eski sürüm dosyaları kişisel veriyi geri almaz.', 'These points are stored in this browser. Clearing browser data may also remove them; download the JSON backup separately. Old app files do not roll back personal data.');
    root.querySelector('[data-role="listlabel"]').textContent = text('Kişisel veri kurtarma noktası', 'Personal data restore point');
    window.dispatchEvent(new CustomEvent('sukun:recoverydata', { detail: { pending, busy: !!operation, reloadRequired: needsReload, maxPoints: MAX_POINTS } }));
  }
  async function renderList() {
    const select = document.querySelector('#r1019DataRecovery [data-role="points"]'); if (!select) return;
    const selected = select.value; select.textContent = '';
    try { const values = await list(); for (const v of values) { const o = document.createElement('option'); o.value = v.id; o.textContent = new Date(v.at).toLocaleString(window.I18N?.lang === 'en' ? 'en-GB' : 'tr-TR') + ' · ' + v.build + ' · ' + v.recordings + text(' ses', ' recordings') + ' · ' + (v.bytes / 1048576).toFixed(1) + ' MB'; select.appendChild(o); } if (!values.length) { const o = document.createElement('option'); o.value = ''; o.textContent = text('Henüz kayıtlı nokta yok', 'No saved points yet'); select.appendChild(o); } else if (values.some(v => v.id === selected)) select.value = selected; }
    catch (e) { readyError = message(e); }
    render();
  }
  async function runUI(work) { try { await work(); } catch (e) { lastMessage = message(e) + (e.rolledBack ? text(' Önceki veriler geri getirildi.', ' Previous data was restored.') : ''); } finally { render(); await renderList(); } }
  function openEmergency() {
    const panel = document.getElementById('r1019DataRecovery'), overlay = document.getElementById('r1019RecoveryEmergency');
    if (!panel || !overlay) return;
    overlay.hidden = false; overlay.appendChild(panel); panel.open = true;
    const close = overlay.querySelector('[data-emergency-close]'); close.textContent = text('Kurtarma penceresini kapat', 'Close recovery window'); close.focus();
    render(); renderList();
  }
  function mount() {
    if (document.getElementById('r1019DataRecovery')) return;
    const host = document.getElementById('ydkBox') || document.querySelector('#zmgAraclar .zMegaBody') || document.getElementById('tab-zkr'); if (!host) return;
    const panel = document.createElement('details'); panel.id = 'r1019DataRecovery'; panel.className = 'r170Hub';
    panel.innerHTML = '<summary><b data-role="title"></b></summary><div class="r170Body"><p data-role="intro"></p><div class="r1019RecoveryActions"><button type="button" class="r170Btn" data-action="create"></button><button type="button" class="r170Btn" data-action="export"></button><button type="button" class="r170Btn" data-action="import"></button></div><input type="file" data-role="file" accept="application/json,.json" hidden><label data-role="listlabel" for="r1019DataPointSelect"></label><select id="r1019DataPointSelect" data-role="points"></select><div class="r1019RecoveryActions"><button type="button" class="r170Btn" data-action="restore"></button><button type="button" class="r170Btn" data-action="undo"></button><button type="button" class="r170Btn" data-action="recover" hidden></button><button type="button" class="r170Btn" data-action="cancel" hidden></button><button type="button" class="r170Btn" data-action="reload" hidden></button></div><p role="status" aria-live="polite" data-role="status"></p><p data-role="warning"></p><div id="r1019VersionRecovery"></div><div id="r1019SiteBackupSlot"></div></div>';
    const style = document.createElement('style'); style.id = 'r1019RecoveryDataStyle'; style.textContent = '#r1019DataRecovery{min-width:0;max-width:100%;box-sizing:border-box}#r1019DataRecovery p{white-space:normal;overflow-wrap:anywhere;line-height:1.55}#r1019DataRecovery .r1019RecoveryActions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}#r1019DataRecovery button.r170Btn{min-width:0;max-width:100%;white-space:normal;overflow-wrap:anywhere;flex:1 1 190px}#r1019DataRecovery select{width:100%;max-width:100%;min-width:0;margin:8px 0;padding:10px;box-sizing:border-box}#r1019DataRecovery [data-role="warning"]{font-size:.88em;color:var(--dim,#b7c5c1)}#r1019RecoveryOpen{position:fixed!important;right:14px!important;bottom:calc(18px + env(safe-area-inset-bottom))!important;z-index:2147483000!important;max-width:80vw!important;padding:12px 16px!important;border:1px solid #d3c294!important;border-radius:14px!important;background:#172e34!important;color:#fff2da!important;font:600 15px/1.3 system-ui!important;box-shadow:0 5px 24px #0008!important}#r1019RecoveryOpen[hidden],#r1019RecoveryEmergency[hidden]{display:none!important}#r1019RecoveryEmergency{position:fixed!important;inset:0!important;z-index:2147483001!important;overflow:auto!important;padding:calc(18px + env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom))!important;background:#082229!important;color:#f5e9d5!important;box-sizing:border-box!important;touch-action:pan-y!important}#r1019RecoveryEmergency>button{padding:12px!important;margin-bottom:12px!important;background:#1c3740!important;color:#fff0d1!important;border:1px solid #c7b588!important;border-radius:12px!important}'; document.head.appendChild(style); host.appendChild(panel);
    const emergency = document.createElement('div'); emergency.id = 'r1019RecoveryEmergency'; emergency.hidden = true; emergency.setAttribute('role', 'dialog'); emergency.setAttribute('aria-modal', 'true'); emergency.setAttribute('aria-label', text('Kurtarma Merkezi', 'Recovery Centre'));
    style.textContent += '#r1019DataRecovery button.r170Btn{min-height:44px}';
    const close = document.createElement('button'); close.type = 'button'; close.setAttribute('data-emergency-close', ''); close.onclick = () => { emergency.hidden = true; host.appendChild(panel); document.getElementById('r1019RecoveryOpen')?.focus(); }; emergency.appendChild(close); document.body.appendChild(emergency);
    emergency.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close.click(); return; }
      if (event.key !== 'Tab') return;
      const candidates = [...emergency.querySelectorAll('button:not([disabled]):not([hidden]),select:not([disabled]),input:not([hidden]),summary')].filter(el => el.getClientRects().length);
      if (!candidates.length) { event.preventDefault(); close.focus(); return; }
      const first = candidates[0], last = candidates[candidates.length - 1], active = document.activeElement;
      if (event.shiftKey && (active === first || !emergency.contains(active))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (active === last || !emergency.contains(active))) { event.preventDefault(); first.focus(); }
    });
    const open = document.createElement('button'); open.type = 'button'; open.id = 'r1019RecoveryOpen'; open.onclick = openEmergency; document.body.appendChild(open);
    const file = panel.querySelector('[data-role="file"]');
    panel.querySelector('[data-role="points"]').onchange = render;
    panel.querySelector('[data-action="create"]').onclick = () => runUI(() => create());
    panel.querySelector('[data-action="export"]').onclick = () => runUI(() => exportPersonal());
    panel.querySelector('[data-action="import"]').onclick = () => file.click();
    file.onchange = () => { const selected = file.files?.[0]; file.value = ''; if (selected) runUI(() => importPersonal(selected)); };
    panel.querySelector('[data-action="restore"]').onclick = () => { const id = panel.querySelector('[data-role="points"]').value; if (!id) return; if (confirm(text('Seçili tarihteki kişisel verilere dönülecek. Sonraki sayaç, ayar ve ses değişiklikleri geri alınır. Devam?', 'Return to personal data at the selected date? Later counter, setting and recording changes will be undone.'))) runUI(() => restore(id)); };
    panel.querySelector('[data-action="undo"]').onclick = () => runUI(() => undo());
    panel.querySelector('[data-action="recover"]').onclick = () => runUI(() => recoverPending());
    panel.querySelector('[data-action="reload"]').onclick = () => location.reload();
    panel.querySelector('[data-action="cancel"]').onclick = () => { if (operation) operation.cancelled = true; render(); };
    panel.addEventListener('toggle', () => { if (panel.open) { render(); renderList(); } }); render(); renderList();
    window.dispatchEvent(new CustomEvent('sukun:recoverymounted'));
  }
  // While a crash rollback is pending, only recovery controls may mutate the
  // UI. The tab-owner maintenance lease remains the authority for DB writes.
  document.addEventListener('click', event => {
    if (!(pending || needsReload || operation) || event.target.closest?.('#r1019DataRecovery,#r1019VersionRecovery,#r1019RecoveryOpen,#r1019RecoveryEmergency')) return;
    const interactive = event.target.closest?.('button,input,select,a,[role="button"]');
    if (!interactive) return;
    event.preventDefault(); event.stopImmediatePropagation(); lastMessage = text('Önce Kurtarma Merkezi işlemini tamamla veya uygulamayı yeniden aç.', 'Finish the Recovery Centre operation or reload the app first.'); render();
  }, true);
  const api = {
    version: 'r1019', create, list, restore, undo, export: exportPersonal, import: importPersonal, recoverPending, capturePortable,
    hasPending: () => pending || needsReload, cancel: () => { if (operation) operation.cancelled = true; render(); },
    status: () => ({ version: 'r1019', pending, busy: !!operation, operation: operation?.kind || null, reloadRequired: needsReload, error: readyError, maxPoints: MAX_POINTS }), mount
  };
  window.SukunRecoveryData = Object.freeze(api);
  const boot = async () => {
    mount();
    try { const journal = await getMeta('journal'); pending = !!journal; render(); if (journal) await recoverPending(); }
    catch (e) { pending = true; readyError = message(e); render(); openEmergency(); }
    return api.status();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else void boot();
  window.addEventListener('sukun:languagechange', () => { render(); renderList(); }, { passive: true });
  window.addEventListener('sukun:tabownerchange', () => render(), { passive: true });
})();
