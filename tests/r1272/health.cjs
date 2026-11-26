'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const make = require('../r1017/health_ui_fixture.cjs')(root);
const source = fs.readFileSync(path.join(root, 'assets/runtime/health-r940.js'), 'utf8');
const key = 'sukun.health.r940';
const checkpoint = () => JSON.stringify({schema:key.replaceAll('.', '-'), at:Date.now(), closed:true, build:'r1271', incidents:[null, {}, {code:'PRIOR_WARNING'}]});
const row = (report, code) => report.checks.find(x => x.code === code);

function fixture(setup) {
  const h = make(false);
  h.c.sessionStorage = {getItem:() => null, setItem:() => {}};
  if (setup) setup(h);
  vm.runInContext(source, h.c);
  h.api = h.c.SukunHealthR940;
  return h;
}

test('a bad same-tab checkpoint falls back to valid device metadata and still installs listeners', async () => {
  const h = fixture(({c,store}) => {
    c.sessionStorage.getItem = () => '{';
    store.set(key, checkpoint());
  });
  assert.equal(h.api.read().coverage.previousScope, 'last-device-tab-unknown');
  assert.deepEqual(Array.from(h.api.read().previous.incidentCodes), ['PRIOR_WARNING']);
  await h.c.dispatch('sukun:sessionchange', {phase:'IDLE',count:0});
  assert.equal(h.api.read().current.session.phase, 'IDLE');
});

for (const blocked of ['sessionStorage','localStorage']) {
  test('health saves the surviving copy when '+blocked+' rejects writes', () => {
    const h = fixture(({c}) => {
      c[blocked].setItem = () => { throw new DOMException('denied','SecurityError'); };
    });
    const persistence = row(h.api.read(), 'PERSISTENCE');
    assert.equal(persistence.status, 'WARN');
    assert.equal(persistence.evidence.stores.device, blocked !== 'localStorage');
    assert.equal(persistence.evidence.stores.session, blocked !== 'sessionStorage');
    assert(persistence.evidence.lastSaved > 0);
    if (blocked === 'sessionStorage') assert.equal(JSON.parse(h.store.get(key)).schema, 'sukun-health-r940');
  });
}

test('null observations stay unmeasured while an actual zero is preserved', async () => {
  const h = fixture(({c}) => {
    c.SukunTempo = {snapshot:() => ({value:null})};
    c.navigator.storage.estimate = async () => ({usage:null,quota:5000});
  });
  let report = await h.api.run();
  assert.equal(row(report, 'TEMPO_RANGE').status, 'NOT_MEASURED');
  assert.equal(row(report, 'STORAGE_QUOTA').status, 'NOT_MEASURED');
  assert.equal(row(report, 'STORAGE_QUOTA').evidence.usage, null);
  h.c.navigator.storage.estimate = async () => ({usage:0, quota:5000});
  report = await h.api.run();
  assert.equal(row(report, 'STORAGE_QUOTA').status, 'OBSERVED');
  assert.equal(row(report, 'STORAGE_QUOTA').evidence.usage, 0);
});

for (const [mode, expected, reason] of [
  ['verified','PASS',null], ['incomplete','FAIL',null], ['worker-error','NOT_MEASURED','CHECK_FAILED'],
  ['timeout','NOT_MEASURED','TIMEOUT'], ['no-channel','NOT_MEASURED','CHANNEL_UNAVAILABLE']
]) {
  test('worker status '+mode+' has a bounded accurate cache result', async () => {
    let portsClosed = 0;
    const h = fixture(({c,timers}) => {
      if (mode === 'no-channel') return;
      c.MessageChannel = class {
        constructor() {
          this.port1 = {close:() => portsClosed++};
          this.port2 = {close:() => portsClosed++, peer:this.port1};
        }
      };
      c.navigator.serviceWorker.controller.postMessage = (message, [port]) => {
        assert.equal(message.type, 'STATUS');
        const timer = [...timers.values()].find(x => x.ms >= 12000 && x.ms <= 20000);
        assert(timer, 'wait for the 12-second worker deadline and message delivery');
        if (mode === 'timeout') queueMicrotask(timer.fn);
        else queueMicrotask(() => port.peer.onmessage({data:{v:'r986', complete:mode === 'verified',checkFailed:mode === 'worker-error'}}));
      };
    });
    const report = await h.api.run({deep:true});
    assert.equal(row(report, 'SW_CACHE_COMPLETE').status, expected);
    assert.equal(row(report, 'SW_RESPONSE')?.evidence.reason ?? null, reason);
    assert.equal(row(report, 'HEALTH_COLLECTION'), undefined);
    assert.equal(portsClosed, mode === 'no-channel' ? 0 : 2);
  });
}

test('a key for another provider cannot start an explanation for the selected provider', async () => {
  let requests = 0, settings = 0;
  const h = fixture(({c}) => {
    c.SukunAIRouter = {snapshot:() => ({providers:[]}), hasAnyKey:() => true, hasSelectedKey:() => false,
      complete:async () => { requests++; return {text:'Açıklama'}; }, openSettings:() => settings++};
  });
  h.c.SukunHealthViewR943.mount(h.panel,h.api);
  for (const action of ['explain','ai-preview']) await h.click(action);
  await h.consent();
  await h.click('ai-send');
  assert.equal(requests, 0);
  assert.equal(settings, 1);
});
