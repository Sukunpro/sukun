'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../..');
const serve = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : decodeURIComponent(pathname)));
    if (!file.startsWith(root + path.sep)) throw Error('outside');
    const type = {'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'}[path.extname(file)];
    if (type) res.setHeader('Content-Type', type);
    res.end(await fs.readFile(file));
  } catch { res.statusCode = 404; res.end(); }
});

(async () => {
  await new Promise(resolve => serve.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + serve.address().port;
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH, args:['--no-sandbox','--disable-dev-shm-usage']});
    const context = await browser.newContext({viewport:{width:360,height:760},timezoneId:'America/Los_Angeles',serviceWorkers:'block'});
    await context.route('**/*', route => route.request().url().startsWith(origin+'/') ? route.continue() : route.abort());
    const p = await context.newPage();
    await p.goto(origin, {waitUntil:'domcontentloaded'});
    await p.waitForFunction(() => window.SukunRecoveryData?.status().pending === false && window.SukunRecordingSalvage?.validateNativeJSON);
    const run = await p.evaluate(async () => {
      // The browser profile has a single controlled tab. Release-specific
      // service-worker and Android single-client protocols are tested separately.
      let admitted = true;
      window.SukunRecoveryGuard = {assertSingleClient: async lease => {lease.assertCurrent(); if (!admitted) throw Error('OTHER_APP_TAB_OPEN');}};
      const value = k => JSON.parse(localStorage.getItem(k));
      const logKey = 'sukun.log', row = {t:1700000000000, dur:50, detail:'Dhikr'};
      localStorage.setItem(logKey, JSON.stringify([row]));
      localStorage.setItem('sukun.kilitPin','"synthetic-hash"');
      localStorage.setItem('sukun.ai.key.openrouter','synthetic-api-key');
      const privateKeys = ['sukun.kilitPin','sukun.ai.key.openrouter','sukun.ai.consent.r1272.openrouter','sukun.aiConsent.r310','sukun.ai.nvidia.proxy.r941'];
      for(const key of privateKeys.slice(2)) localStorage.setItem(key,'SYNTHETIC');
      const full = JSON.parse(await skExportData()), settings = JSON.parse(await skExportData({audio:false}));
      const jsonFile = obj => new File([JSON.stringify(obj)], 'sukun-yedek.json', {type:'application/json'});
      const imported = (backup, key=logKey) => SukunRecoveryData.importJournal(jsonFile(backup), key);
      const incoming = {...row,t:row.t + 1};
      localStorage.setItem(logKey, JSON.stringify([incoming]));
      const first = await imported(full), retried = await imported(settings);
      const current = value(logKey);
      const legacy = {app:'SUKUN',ls:{[logKey]:JSON.stringify([{...row,detail:'older description'}])}};
      const colliding = await imported(legacy);
      const afterConflict = value(logKey);
      async function rejected(file) {try {await imported(file);return false;} catch {return true;}}
      const unsupported = await rejected({...full,fmt:999});
      const malformed = await rejected({app:'SUKUN',fmt:1,ls:{[logKey]:'[invalid'}});
      const forged = await rejected({...full,fmt:2,recovery:null});
      const t = Date.now(), build='r1271', ls = {[logKey]:JSON.stringify([row])};
      const empty = {present:false,version:1,entries:[]};
      const canonical = {schema:1,app:'SUKUN-Recovery',at:t,build,ls:Object.entries(ls),stores:{sukunRec:empty,sukunCustomAmb:empty}};
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical)))),b=>b.toString(16).padStart(2,'0')).join('');
      const native = {app:'SUKUN',fmt:2,t,build,ls,idb:{sukunRec:{},sukunCustomAmb:{}},recovery:{schema:1,mode:'exact-personal-data',digest,presence:{sukunRec:false,sukunCustomAmb:false}}};
      const verified = await imported(native);
      const tampered = await rejected({...native,ls:{[logKey]:JSON.stringify([{...row,t:row.t+33}])}});
      const held = await rejected({app:'SUKUN',fmt:1,ls:{}});
      admitted = false;
      const denied = await rejected(legacy); admitted = true;
      const write = Storage.prototype.setItem;
      let quotaRejected;
      Storage.prototype.setItem = function(k,v) {
        if (k===logKey) throw new DOMException('Synthetic full storage','QuotaExceededError');
        return write.call(this,k,v);
      };
      try { quotaRejected = await rejected({...legacy,ls:{[logKey]:JSON.stringify([{...row,t:row.t+2}])}}); }
      finally { Storage.prototype.setItem = write; }
      const same = JSON.stringify(afterConflict) === JSON.stringify(value(logKey));
      const capacity = Array.from({length:100}, (_,i) => ({...row,t:1600000000000+i}));
      localStorage.setItem(logKey,JSON.stringify(capacity));
      const overCap = await rejected(full);
      const capKept = JSON.stringify(value(logKey)) === JSON.stringify(capacity);
      localStorage.setItem(logKey,'[invalid');
      let corruptExport = false; try { await skExportData({audio:false}); } catch {corruptExport = true;}
      let emptyStore = false;
      const name = 'sukunRec', referenceOpen = window.skBackupOpenR743;
      // Simulate a recording DB that has never been created without deleting
      // the app's live IndexedDB connection.
      window.skBackupOpenR743 = async () => {throw Object.assign(new Error('missing'),{name:'RecordingDatabaseMissing'});};
      try {emptyStore = !Object.keys(await idbDumpAll(name,'clips')).length;} finally {window.skBackupOpenR743 = referenceOpen;}
      localStorage.removeItem(logKey);
      return {first,retried,current,colliding,afterConflict,unsupported,malformed,forged,tampered,verified,held,denied,quotaRejected,same,overCap,capKept,corruptExport,emptyStore,
        privateExport:[full,settings].some(x => privateKeys.some(key=>Object.hasOwn(x.ls,key))),
        keys:Object.keys(full.idb).sort()};
    });
    assert.equal(run.first.added,1); assert.equal(run.retried.added,0); assert.equal(run.colliding.kept,1);
    assert.deepEqual(run.current,run.afterConflict); assert.equal(run.current[0].detail,'Dhikr');
    for(const k of ['unsupported','malformed','forged','tampered','held','denied','quotaRejected','same','overCap','capKept','corruptExport','emptyStore']) assert.equal(run[k],true,k);
    assert.equal(run.verified.kept,1);
    assert.equal(run.privateExport,false); assert.deepEqual(run.keys,['sukunCustomAmb','sukunRec']);
    // The r820 "Tam yedek indir" button serialized each localStorage value at
    // the top level with _app, _v and _t metadata.
    const oldLog = {t:1700000000200, dur:40, detail:'Legacy journal'};
    const flat = {_app:'SÜKÛN',_v:1,_t:'2023-11-14T22:13:20.200Z','sukun.log':JSON.stringify([oldLog]),
      'sukun.kilitPin':'"from-file"','sukun.maneviGunluk':JSON.stringify([{t:oldLog.t,not:'Other section'}])};
    await p.locator('#bakJournalType').evaluate(el=>{el.value='sukun.log';});
    await p.locator('#bakJournalFile').setInputFiles({name:'sukun-yedek-20231114.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(flat))});
    await p.waitForFunction(() => !SukunRecoveryData.status().busy && JSON.parse(localStorage.getItem('sukun.log'))?.some(row=>row.detail==='Legacy journal'));
    const legacyResult = await p.evaluate(async flat => {
      const file = value => new File([JSON.stringify(value)],'backup.json');
      const load = (value,key='sukun.log') => SukunRecoveryData.importJournal(file(value),key);
      async function rejected(value,key) {try {await load(value,key);return false;} catch {return true;}}
      const invalidEnvelopes = [{...flat,_v:999},{...flat,app:'SUKUN'},{...flat,fmt:2},{...flat,ls:{}},
        {...flat,idb:{}},{...flat,recovery:null},{...flat,app:'SUKUN',ls:{},fmt:2,recovery:{}}];
      let rejectedCount=0;
      for(const value of invalidEnvelopes) if(await rejected(value)) rejectedCount++;
      const retry = await load(flat);
      const key = 'sukun.muhasebe', iso = '2024-02-29', day = new Date(2024,1,29).toDateString();
      const row = {i:0,sel:[],t:1700000000200}, other = {...row,i:1};
      const backup = days => ({...flat,[key]:JSON.stringify(days)});
      localStorage.removeItem(key);
      await load(backup({[iso]:row}),key);
      const canonical = JSON.parse(localStorage.getItem(key));
      const duplicate = await load(backup({[day]:other}),key);
      const beforeInvalid = localStorage.getItem(key);
      const invalidDay = await rejected(backup({'2025-02-30':row}),key);
      const conflictInFile = await rejected(backup({[iso]:row,[day]:other}),key);
      const retained = beforeInvalid === localStorage.getItem(key);
      localStorage.setItem(key,JSON.stringify({[iso]:row}));
      await load(backup({[day]:other}),key);
      const normalized = JSON.parse(localStorage.getItem(key));
      const ambiguous = JSON.stringify({[iso]:row,[day]:other});
      localStorage.setItem(key,ambiguous);
      const ambiguousRejected = await rejected(backup({[day]:row}),key);
      const ambiguousPreserved = localStorage.getItem(key) === ambiguous;
      localStorage.removeItem(key);
      return {rows:JSON.parse(localStorage.getItem('sukun.log')), pin:localStorage.getItem('sukun.kilitPin'),
        note:localStorage.getItem('sukun.maneviGunluk'),retry,allRejected:rejectedCount===invalidEnvelopes.length,canonical,
        duplicate,invalidDay,conflictInFile,retained,normalized,ambiguousRejected,ambiguousPreserved,expected:{[day]:row}};
    },flat);
    assert.deepEqual(legacyResult.rows,[oldLog]); assert.equal(legacyResult.pin,'"synthetic-hash"'); assert.equal(legacyResult.note,null);
    assert.equal(legacyResult.retry.kept,1); assert.equal(legacyResult.duplicate.kept,1);
    assert.deepEqual(legacyResult.canonical,legacyResult.expected); assert.deepEqual(legacyResult.normalized,legacyResult.expected);
    for(const key of ['allRejected','invalidDay','conflictInFile','retained','ambiguousRejected','ambiguousPreserved']) assert.equal(legacyResult[key],true,key);
    // Use the file input binding used by the journal restore button.
    const note = {t:1700000000000, alan:'Nefs', konu:'Not', not:'Deneme'};
    const daily = Object.fromEntries(Array.from({length:91}, (_,i) => {
      const d = new Date(2023,0,1+i,12);
      return [d.toDateString(),{t:d.getTime(),i:1,sel:[0]}];
    }));
    const sortedDays = Object.keys(daily);
    const newer = new Date(2023,3,2,12).toDateString();
    const pruned = await p.evaluate(({daily,newer}) => {
      const saved = Object.fromEntries(Object.entries(daily).reverse());
      saved[newer] = {t:new Date(newer).getTime(),i:1,sel:[]};
      return Object.keys(muhTemizle(saved));
    }, {daily,newer});
    assert.deepEqual(pruned, [...sortedDays.slice(1),newer]);
    const fixtures = [
      ['sukun.maneviGunluk',[note]],
      ['sukun.muhasebe',daily],
      ['tekke.defter',[{t:1700000000000,sn:13,zk:33,mk:[],tam:true}]]
    ];
    for(const [key, records] of fixtures){
      await p.locator('#bakJournalType').evaluate((el,key)=>{el.value=key;},key);
      await p.locator('#bakJournalFile').setInputFiles({name:'sukun-ayarlar.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify({app:'SUKUN',fmt:1,ls:{[key]:JSON.stringify(records)}}))});
      await p.waitForFunction(key => localStorage.getItem(key) && JSON.parse(localStorage.getItem(key)) && document.getElementById('bakJournalResult').textContent.match(/Eklenen kayıt: [1-9]|Added: [1-9]/),key);
      assert.deepEqual(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),records,key);
    }
    const [download] = await Promise.all([
      p.waitForEvent('download'),
      p.locator('#bakExportBtn').evaluate(button => button.click())
    ]);
    assert.match(download.suggestedFilename(), /^sukun-yedek-[0-9-]+\.json$/);
    const downloaded = JSON.parse(await fs.readFile(await download.path(),'utf8'));
    assert.equal(downloaded.app,'SUKUN');
    for(const [key, records] of fixtures) assert.deepEqual(JSON.parse(downloaded.ls[key]),records);
    // The composer supports two to eight names; a saved composition must
    // never block an unrelated journal backup.
    await p.locator('#trkBox').evaluate(panel => { panel.open = true; });
    await p.waitForFunction(() => document.querySelectorAll('#trkSec .trkAd').length >= 8);
    p.on('dialog', dialog => dialog.accept('Test terkibi'));
    for (let index = 0; index < 8; index++) {
      await p.locator('#trkSec .trkAd').nth(index).evaluate(choice => choice.click());
      if (index < 4) continue;
      await p.locator('#trkKaydet').evaluate(button => button.click());
      for (const selector of ['#bakExportBtn', '#bakSettingsExportBtn']) {
        const [file] = await Promise.all([
          p.waitForEvent('download'), p.locator(selector).evaluate(button => button.click())
        ]);
        const saved = JSON.parse(await fs.readFile(await file.path(), 'utf8')).ls;
        assert.equal(JSON.parse(saved['sukun.terkip.kayitli'])[0].sec.length, index + 1);
        assert.deepEqual(JSON.parse(saved['sukun.maneviGunluk']), [note]);
      }
    }
    const rejectsInvalid = await p.evaluate(() => [[0], [0,0], [0,99], Array.from({length:9}, (_,i) => i)].every(sec =>
      skYedekDeger('sukun.terkip.kayitli', JSON.stringify([{ad:'test',sec,t:1600000000000}])) === null));
    assert.equal(rejectsInvalid, true);
    const saveResult = await p.evaluate(async () => {
      const last = () => localStorage.getItem('sukun.lastBackup');
      const requested = localStorage.getItem('sukun.lastBackupRequested');
      const browserConfirmed = last();
      let finish, savedName, bytes;
      const button = document.getElementById('bakExportBtn');
      const native = result => {
        window.SukunAndroidSaveFile = async (blob, filename) => {
          savedName=filename; bytes=blob.size;
          if(result instanceof Error) throw result;
          return result;
        };
      };
      localStorage.setItem('sukun.lastBackup','100');
      native(false); await button.onclick(false); const cancelled=last();
      native(Error('Synthetic SAF error')); await button.onclick(false); const failed=last();
      let entered; const waiting = new Promise(resolve => { entered=resolve; });
      window.SukunAndroidSaveFile = () => new Promise(resolve => { finish=resolve; entered(); });
      const pending = button.onclick(); await waiting; const beforeFinish=last();
      finish(true); await pending;
      return {requested,browserConfirmed,cancelled,failed,beforeFinish,confirmed:Number(last()),savedName,bytes};
    });
    assert.ok(Number(saveResult.requested)>0); assert.equal(saveResult.browserConfirmed,null);
    assert.equal(saveResult.cancelled,'100'); assert.equal(saveResult.failed,'100'); assert.equal(saveResult.beforeFinish,'100');
    assert.ok(saveResult.confirmed>100); assert.match(saveResult.savedName,/^sukun-ayarlar-/); assert.ok(saveResult.bytes>0);
    console.log('Journal backup and additive import passed in Chromium, including four journal types, legacy files, retries, capacity, malformed input and blocked second tab.');
  } finally { await browser?.close(); await new Promise(resolve => serve.close(resolve)); }
})().catch(error => {console.error(error);process.exitCode = 1;});
