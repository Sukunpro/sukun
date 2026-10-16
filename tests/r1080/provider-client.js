const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../../integration/berhet-access/example-http-provider.js'), 'utf8');
const BASE = 'https://access.example.invalid';
const TOKEN_A = 'A'.repeat(43), TOKEN_B = 'B'.repeat(43);
const NOW = 1792160000000;
function granted(token = TOKEN_A) {
  return new Response(JSON.stringify({ sessionToken: token, tokenType: 'Bearer', scope: 'berhetiyye', expiresAt: NOW + 3600000 }), { status: 200 });
}
function fixture(transport) {
  const calls = [];
  let time = NOW;
  const forbidden = () => { throw new Error('Persistent storage or local lock must not be touched'); };
  const window = { localStorage: { getItem: forbidden, setItem: forbidden }, sessionStorage: { setItem: forbidden }, KLT_AC: forbidden, KLT_KILITLE: forbidden };
  vm.runInNewContext(source, { window, URL, AbortController, setTimeout, clearTimeout, Date });
  const provider = window.createBerhetHttpProvider({ baseURL: BASE, now: () => time, fetch: async (url, config) => {
    calls.push({ url, config });
    return transport(url, config);
  } });
  return { provider, calls, window, setTime: value => { time = value; } };
}
test('verify prepares an opaque receipt and commit alone activates it; no automatic installation', async () => {
  const f = fixture(async () => granted());
  assert.equal(f.window.SUKUN_BERHET_ACCESS_PROVIDER, undefined);
  const signal = new AbortController();
  const verification = await f.provider.verify('test-only-code', { signal: signal.signal });
  assert.equal(verification.ok, true);
  assert.equal(f.provider.isActive(), false);
  assert.ok(!JSON.stringify(verification).includes(TOKEN_A));
  assert.equal(f.provider.commit(verification.receipt, { signal: signal.signal }).ok, true);
  assert.equal(f.provider.isActive(), true);
  assert.equal(f.provider.commit(verification.receipt).ok, false);
  signal.abort(); // Dismissing a completed presentation is not a logout.
  assert.equal(f.provider.isActive(), true);
});
test('arbitrary forged, aborted, and expired receipts cannot activate a session', async () => {
  const f = fixture(async () => granted());
  assert.equal(f.provider.commit({ scope: 'berhetiyye', expiresAt: NOW + 3600000 }).ok, false);
  const abort = new AbortController();
  const prepared = await f.provider.verify('test-only-code', { signal: abort.signal });
  abort.abort();
  assert.equal(f.provider.commit(prepared.receipt).ok, false);
  assert.equal(f.provider.isActive(), false);
  const expired = await f.provider.verify('test-only-code');
  f.setTime(NOW + 3600000);
  assert.equal(f.provider.commit(expired.receipt).ok, false);
});
test('late verification after close cannot activate the portal even if fetch ignores cancellation', async () => {
  let release;
  const f = fixture(() => new Promise(resolve => { release = resolve; }));
  const abort = new AbortController();
  const pending = f.provider.verify('test-only-code', { signal: abort.signal });
  abort.abort();
  release(granted());
  assert.equal((await pending).ok, false);
  assert.equal(f.provider.isActive(), false);
});
test('new verification invalidates an earlier pending receipt and revokes its token', async () => {
  let count = 0;
  const f = fixture(async url => url.endsWith('/v1/revoke') ? new Response(null, { status: 204 }) : granted(++count === 1 ? TOKEN_A : TOKEN_B));
  const old = await f.provider.verify('first-test-code');
  const latest = await f.provider.verify('second-test-code');
  assert.equal(f.provider.commit(old.receipt).ok, false);
  assert.equal(f.provider.commit(latest.receipt).ok, true);
  assert.ok(f.calls.some(call => call.url.endsWith('/v1/revoke') && call.config.headers.Authorization === 'Bearer ' + TOKEN_A));
});
test('concurrent stale response is rejected after a newer response succeeds', async () => {
  let resolveFirst, redemptions = 0;
  const f = fixture(async url => {
    if (url.endsWith('/v1/revoke')) return new Response(null, { status: 204 });
    if (++redemptions === 1) return new Promise(resolve => { resolveFirst = resolve; });
    return granted(TOKEN_B);
  });
  const first = f.provider.verify('first-test-code');
  const second = await f.provider.verify('second-test-code');
  resolveFirst(granted(TOKEN_A));
  assert.equal((await first).ok, false);
  assert.equal(f.provider.commit(second.receipt).ok, true);
});
test('revoke clears memory synchronously even if the server is unreachable', async () => {
  let offline = false;
  const f = fixture(async () => { if (offline) throw new Error('offline'); return granted(); });
  const prepared = await f.provider.verify('test-only-code');
  f.provider.commit(prepared.receipt);
  offline = true;
  const result = f.provider.revoke();
  assert.equal(f.provider.isActive(), false);
  assert.equal((await result).error, 'network');
});
test('status validates the remote scope and refuses expired or revoked sessions', async () => {
  let status = 200;
  const f = fixture(async url => url.endsWith('/v1/redeem') ? granted() : new Response(status === 200 ? JSON.stringify({ active: true, scope: 'berhetiyye', expiresAt: NOW + 3600000 }) : '{}', { status }));
  const prepared = await f.provider.verify('test-only-code');
  f.provider.commit(prepared.receipt);
  assert.equal((await f.provider.status()).active, true);
  status = 401;
  assert.equal((await f.provider.status()).active, false);
  assert.equal(f.provider.isActive(), false);
});
test('HTTP uses only configured HTTPS endpoint with cache/storage/redirect restrictions', async () => {
  const f = fixture(async () => granted());
  await f.provider.verify('test-only-code');
  const call = f.calls[0];
  assert.equal(call.url, BASE + '/v1/redeem');
  assert.ok(!call.url.includes('test-only-code'));
  assert.equal(call.config.credentials, 'omit');
  assert.equal(call.config.cache, 'no-store');
  assert.equal(call.config.redirect, 'error');
  assert.equal(call.config.referrerPolicy, 'no-referrer');
  assert.equal(call.config.method, 'POST');
  assert.equal(JSON.parse(call.config.body).code, 'test-only-code');
  for (const baseURL of ['http://example.invalid', 'https://username:password@example.invalid', 'https://example.invalid/?code=secret', 'https://example.invalid/#token']) {
    assert.throws(() => f.window.createBerhetHttpProvider({ baseURL }));
  }
});
test('wrong code, rate limit, server fault and network fault remain distinct without granting access', async () => {
  for (const [status, expected] of [[401, undefined], [429, 'rate-limit'], [503, 'unavailable']]) {
    const f = fixture(async () => new Response('{}', { status }));
    const result = await f.provider.verify('test-only-code');
    assert.equal(result.ok, false);
    assert.equal(result.error, expected);
    assert.equal(f.provider.isActive(), false);
  }
  const offline = fixture(async () => { throw new Error('offline'); });
  assert.equal((await offline.provider.verify('test-only-code')).error, 'network');
});
test('a delayed status response cannot reactivate a locally revoked session', async () => {
  let resolveStatus;
  const f = fixture(async url => {
    if (url.endsWith('/v1/redeem')) return granted();
    if (url.endsWith('/v1/revoke')) return new Response(null, { status: 204 });
    return new Promise(resolve => { resolveStatus = resolve; });
  });
  const prepared = await f.provider.verify('test-only-code');
  f.provider.commit(prepared.receipt);
  const status = f.provider.status();
  await f.provider.revoke();
  resolveStatus(new Response(JSON.stringify({ active: true, scope: 'berhetiyye', expiresAt: NOW + 3600000 }), { status: 200 }));
  assert.equal((await status).active, false);
  assert.equal(f.provider.isActive(), false);
});
