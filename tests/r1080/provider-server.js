// Isolated provider contract/security tests; not part of the browser deployment graph.
const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto, timingSafeEqual, pbkdf2Sync } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const CODE = 'unit-test-only-random-access-code';
const ORIGIN = 'https://sukunpro.github.io';
const salt = Buffer.alloc(16, 7); // Fixture salt, never used by a deployment.
const hash = `pbkdf2-sha256$100000$${salt.toString('base64url')}$${pbkdf2Sync(CODE, salt, 100000, 32, 'sha256').toString('base64url')}`;
let modulePromise;
function load() {
  return modulePromise ||= import(pathToFileURL(path.resolve(__dirname, '../../integration/berhet-access/server-entry.mjs')).href);
}
async function fixture(overrides = {}) {
  const { createHandler } = await load();
  let currentTime = 1792160000000;
  let comparisons = 0;
  const cryptoAPI = {
    subtle: new Proxy(webcrypto.subtle, { get(target, prop) {
      if (prop === 'timingSafeEqual') return (a, b) => { comparisons++; return timingSafeEqual(a, b); };
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    } }),
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto)
  };
  const data = new Map();
  const rateKeys = [];
  const env = {
    ALLOWED_ORIGIN: ORIGIN, BERHET_ACCESS_CODE_HASH: hash,
    BERHET_RATE_KEY_SECRET: 'unit-test-only-32-character-secret', BERHET_LICENSE_ID: 'test-license',
    BERHET_RATE_LIMITER: { async limit({ key }) { rateKeys.push(key); return { success: true }; } },
    BERHET_SESSIONS: {
      async get(key, type) { const value = data.get(key); return type === 'json' && value ? JSON.parse(value) : value ?? null; },
      async put(key, value) { data.set(key, value); }, async delete(key) { data.delete(key); }
    }, ...overrides
  };
  const handle = createHandler({ cryptoAPI, now: () => currentTime });
  function request(route, { method = route === '/v1/session' ? 'GET' : 'POST', body, headers = {}, token } = {}) {
    const h = { Origin: ORIGIN, 'CF-Connecting-IP': '198.51.100.28', ...headers };
    if (token) h.Authorization = `Bearer ${token}`;
    if (body !== undefined && !Object.hasOwn(headers, 'Content-Type')) h['Content-Type'] = 'application/json';
    return handle(new Request(`https://access.example.invalid${route}`, { method, headers: h, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }), env);
  }
  return { request, env, data, rateKeys, setTime: t => { currentTime = t; }, comparisons: () => comparisons };
}
test('valid redeem creates random opaque scoped sessions, storing only a token digest', async () => {
  const f = await fixture();
  const a = await f.request('/v1/redeem', { body: { code: CODE } });
  assert.equal(a.status, 200);
  assert.equal(a.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert.equal(a.headers.get('Cache-Control'), 'no-store');
  const grant = await a.json();
  assert.match(grant.sessionToken, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(grant.scope, 'berhetiyye');
  assert.equal(f.comparisons(), 1);
  const second = await (await f.request('/v1/redeem', { body: { code: CODE } })).json();
  assert.notEqual(second.sessionToken, grant.sessionToken);
  assert.equal(f.data.size, 2);
  for (const [key, value] of f.data) {
    assert.match(key, /^session:[a-f0-9]{64}$/);
    assert.ok(!`${key}${value}`.includes(grant.sessionToken));
    assert.ok(!value.includes(CODE));
    assert.equal(JSON.parse(value).licenseId, 'test-license');
  }
  assert.ok(f.rateKeys.every(key => !key.includes('198.51.100.28')));
  const session = await f.request('/v1/session', { token: grant.sessionToken });
  assert.equal(session.status, 200);
  assert.equal((await session.json()).active, true);
});
test('wrong code returns no token and does not create a session', async () => {
  const f = await fixture();
  const result = await f.request('/v1/redeem', { body: { code: 'not-the-access-code' } });
  assert.equal(result.status, 401);
  assert.deepEqual(await result.json(), { error: 'access_denied' });
  assert.equal(f.data.size, 0);
  assert.equal(f.comparisons(), 1);
});
test('revoke invalidates one session without removing another session or the license/code', async () => {
  const f = await fixture();
  const a = await (await f.request('/v1/redeem', { body: { code: CODE } })).json();
  const b = await (await f.request('/v1/redeem', { body: { code: CODE } })).json();
  assert.equal((await f.request('/v1/revoke', { token: a.sessionToken })).status, 204);
  assert.equal((await f.request('/v1/session', { token: a.sessionToken })).status, 401);
  assert.equal((await f.request('/v1/session', { token: b.sessionToken })).status, 200);
  assert.equal((await f.request('/v1/redeem', { body: { code: CODE } })).status, 200);
  assert.equal(f.env.BERHET_LICENSE_ID, 'test-license');
  assert.equal(f.env.BERHET_ACCESS_CODE_HASH, hash);
});
test('expiry is checked server-side even if a KV entry remains', async () => {
  const f = await fixture();
  const grant = await (await f.request('/v1/redeem', { body: { code: CODE } })).json();
  f.setTime(grant.expiresAt);
  assert.equal((await f.request('/v1/session', { token: grant.sessionToken })).status, 401);
});
test('incorrect scope, changed license, and malformed bearer do not authorize', async () => {
  const f = await fixture();
  const grant = await (await f.request('/v1/redeem', { body: { code: CODE } })).json();
  const [key, value] = Array.from(f.data)[0];
  f.data.set(key, JSON.stringify({ ...JSON.parse(value), scope: 'other' }));
  assert.equal((await f.request('/v1/session', { token: grant.sessionToken })).status, 401);
  f.data.set(key, value);
  f.env.BERHET_LICENSE_ID = 'different-license';
  assert.equal((await f.request('/v1/session', { token: grant.sessionToken })).status, 401);
  assert.equal((await f.request('/v1/session', { token: 'short' })).status, 401);
  assert.equal((await f.request('/v1/session')).status, 401);
});
test('strict CORS refuses other or absent origins and never supplies wildcard permission', async () => {
  const f = await fixture();
  for (const origin of ['https://evil.example', 'https://sukunpro.github.io.evil.example', 'null', '']) {
    const result = await f.request('/v1/redeem', { body: { code: CODE }, headers: { Origin: origin } });
    assert.equal(result.status, 403);
    assert.equal(result.headers.get('Access-Control-Allow-Origin'), null);
  }
  assert.equal(f.data.size, 0);
});
test('preflight admits only exact route method and supported headers', async () => {
  const f = await fixture();
  const good = await f.request('/v1/redeem', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type, authorization' } });
  assert.equal(good.status, 204);
  assert.equal(good.headers.get('Access-Control-Allow-Credentials'), null);
  assert.equal((await f.request('/v1/redeem', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'DELETE' } })).status, 403);
  assert.equal((await f.request('/v1/redeem', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'x-unknown' } })).status, 403);
});
test('missing config or native cryptography fails closed', async () => {
  for (const key of ['BERHET_ACCESS_CODE_HASH', 'BERHET_RATE_KEY_SECRET', 'BERHET_LICENSE_ID', 'BERHET_SESSIONS', 'BERHET_RATE_LIMITER', 'ALLOWED_ORIGIN']) {
    const f = await fixture({ [key]: undefined });
    const result = await f.request('/v1/redeem', { body: { code: CODE } });
    assert.equal(result.status, 503, key);
    assert.equal(f.data.size, 0);
  }
  const f = await fixture();
  const { createHandler } = await load();
  const result = await createHandler({ cryptoAPI: webcrypto })(new Request('https://access.example.invalid/v1/redeem', { method: 'POST' }), f.env);
  assert.equal(result.status, 503);
});
test('malformed, weak, and incompatible PBKDF2 configurations fail closed', async () => {
  for (const broken of ['plaintext', hash.replace('$100000$', '$1$'), hash.replace('$100000$', '$600000$'), hash + '$extra', hash.replace(salt.toString('base64url'), 'AAA')]) {
    const f = await fixture({ BERHET_ACCESS_CODE_HASH: broken });
    assert.equal((await f.request('/v1/redeem', { body: { code: CODE } })).status, 503);
  }
});
test('rate denial or limiter error prevents verification and session creation', async () => {
  for (const limiter of [{ async limit() { return { success: false }; } }, { async limit() { throw new Error('binding unavailable'); } }, { async limit() { return {}; } }]) {
    const f = await fixture({ BERHET_RATE_LIMITER: limiter });
    const result = await f.request('/v1/redeem', { body: { code: CODE } });
    assert.ok([429, 503].includes(result.status));
    assert.equal(f.comparisons(), 0);
    assert.equal(f.data.size, 0);
  }
});
test('bounded JSON input rejects malformed, oversized and extraneous payloads', async () => {
  const f = await fixture();
  for (const body of [{}, { code: '' }, { code: 1 }, { code: 'x'.repeat(257) }, { code: CODE, extra: true }, [], 'broken-json']) {
    assert.equal((await f.request('/v1/redeem', { body })).status, 400);
  }
  assert.equal((await f.request('/v1/redeem', { body: 'x'.repeat(2049) })).status, 413);
  assert.equal((await f.request('/v1/redeem', { body: { code: CODE }, headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal(f.data.size, 0);
});
test('query credentials, unsupported methods and missing trusted edge IP are rejected', async () => {
  const f = await fixture();
  assert.equal((await f.request('/v1/redeem?code=anything', { body: { code: CODE } })).status, 400);
  assert.equal((await f.request('/v1/redeem', { method: 'GET' })).status, 405);
  assert.equal((await f.request('/v1/redeem', { body: { code: CODE }, headers: { 'CF-Connecting-IP': '' } })).status, 503);
});
test('stdin hash CLI emits only a compatible salted hash and rejects command-line secrets', () => {
  const { spawnSync } = require('node:child_process');
  const cli = path.resolve(__dirname, '../../integration/berhet-access/hash-code.mjs');
  const result = spawnSync(process.execPath, [cli], { input: CODE + '\n', encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(result.stdout.trim(), /^pbkdf2-sha256\$100000\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/);
  assert.ok(!result.stdout.includes(CODE));
  const [, , saltPart, hashPart] = result.stdout.trim().split('$');
  assert.equal(pbkdf2Sync(CODE, Buffer.from(saltPart, 'base64url'), 100000, 32, 'sha256').toString('base64url'), hashPart);
  const denied = spawnSync(process.execPath, [cli, CODE], { input: CODE, encoding: 'utf8' });
  assert.equal(denied.status, 1);
  assert.equal(denied.stdout, '');
  assert.ok(!denied.stderr.includes(CODE));
  const short = spawnSync(process.execPath, [cli], { input: '1234', encoding: 'utf8' });
  assert.equal(short.status, 1);
  assert.equal(short.stdout, '');
});
