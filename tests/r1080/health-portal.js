// Exact production health-integrity functions, controlled same-origin HTTP, and
// real portal bytes. This does not claim physical device sound verification.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'assets/runtime/health-r940.js'), 'utf8');
const start = source.indexOf('  async function responseBytes('), end = source.indexOf('  function sampleExplicit()', start);
assert(start > 0 && end > start);
const production = source.slice(start, end);
const build = 'r1080';
const paths = [
  'assets/berhetiyye-gate/portal-r1080.css', 'assets/berhetiyye-gate/entry-r1080.css',
  'assets/berhetiyye-gate/audio-r1080.js', 'assets/berhetiyye-gate/access-r1080.js',
  'assets/berhetiyye-gate/portal-r1080.js', 'assets/berhetiyye-gate/entry-r1080.js',
  'integration/berhet-access/example-http-provider.js', 'assets/berhetiyye-gate/invitation-tr.mp3'
];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function entry(p, bytes) { return { url: './' + p + '?v=' + build, sha256: hash(bytes) }; }
async function run(entries, bodies) {
  const calls = [];
  let active = 0, maximum = 0;
  const c = { URL, Response, AbortController, DOMException, TextDecoder, Uint8Array, crypto: crypto.webcrypto, build,
    now: Date.now, location: { href: 'https://test.invalid/sukun/nero.html', origin: 'https://test.invalid' }, navigator: { onLine: true },
    path: url => new URL(url).pathname, token: String, status: (code, status, title, evidence) => ({ code, status, evidence }), setTimeout, clearTimeout };
  c.fetch = async (url, options) => {
    calls.push(url);
    const p = new URL(url).pathname.replace('/sukun/', '');
    if (p === 'sukun-build-' + build + '.json') return new Response(JSON.stringify({ build, runtime: entries }));
    assert.equal(options.cache, 'no-store');
    assert.equal(options.credentials, 'same-origin');
    assert(bodies.has(p), 'unapproved download: ' + p);
    active++; maximum = Math.max(maximum, active);
    try {
      await new Promise(resolve => setImmediate(resolve));
      const bytes = bodies.get(p);
      return new Response(bytes, { headers: { 'Content-Length': String(bytes.length) } });
    } finally { active--; }
  };
  vm.createContext(c); vm.runInContext(production, c);
  const result = await c.integrityCheck();
  return { result, calls, maximum };
}
test('all eight exact shipped portal paths verify actual SHA-256 with invitation in the existing media budget', async () => {
  const bodies = new Map(paths.map(p => [p, fs.readFileSync(path.join(root, p))]));
  const entries = [...bodies].map(([p, bytes]) => entry(p, bytes));
  const { result, maximum } = await run(entries, bodies);
  assert.equal(result.status, 'PASS');
  assert.equal(result.evidence.files.length, 8);
  assert(result.evidence.files.every(file => file.status === 'MATCH'));
  const voiceBytes = bodies.get(paths.at(-1)).length;
  const allBytes = [...bodies.values()].reduce((n, bytes) => n + bytes.length, 0);
  assert.equal(result.evidence.mediaBytes, voiceBytes);
  assert.equal(result.evidence.bytes, allBytes - voiceBytes);
  assert.equal(result.evidence.verifiedBytes, allBytes);
  assert(result.evidence.bytes < 8388608);
  assert(maximum <= 2);
});
test('portal allowlist does not accept external origins, nested copies, sibling code or other voices', async () => {
  const bytes = Buffer.from('bounded test fixture'), valid = hash(bytes);
  const urls = [
    'https://evil.invalid/sukun/assets/berhetiyye-gate/portal-r1080.js',
    './nested/assets/berhetiyye-gate/portal-r1080.js', './assets/berhetiyye-gate/other.js',
    './assets/berhetiyye-gate/other.mp3', './assets/berhetiyye-gate/invitation-en.mp3',
    './integration/berhet-access/server-entry.mjs', './integration/berhet-access/other-provider.js'
  ];
  const { result, calls, maximum } = await run(urls.map(url => ({ url, sha256: valid })), new Map());
  assert.equal(result.status, 'FAIL');
  assert.equal(result.evidence.configurationErrors, urls.length);
  assert(result.evidence.files.every(file => file.status === 'INVALID_ENTRY'));
  assert.equal(calls.length, 1);
  assert.equal(maximum, 0);
});
test('portal code and invitation require matching valid SHA-256', async () => {
  const bodies = new Map(paths.map(p => [p, Buffer.from('test fixture ' + p)]));
  const mismatch = [...bodies].map(([p, bytes]) => ({ ...entry(p, bytes), sha256: '0'.repeat(64) }));
  const { result } = await run(mismatch, bodies);
  assert.equal(result.status, 'FAIL');
  assert.equal(result.evidence.mismatched, 8);
  assert.equal(result.evidence.configurationErrors, 0);
  const invalid = await run(paths.map(p => ({ url: './' + p, sha256: 'invalid' })), new Map());
  assert.equal(invalid.result.evidence.configurationErrors, 8);
  assert.equal(invalid.calls.length, 1);
});
test('invitation is capped at 500000 bytes without expanding Arabic-media allowances', async () => {
  const p = paths.at(-1), bytes = Buffer.alloc(500001);
  const { result } = await run([entry(p, bytes)], new Map([[p, bytes]]));
  assert.equal(result.status, 'NOT_MEASURED');
  assert.equal(result.evidence.files[0].status, 'SIZE_LIMIT');
  assert.equal(result.evidence.bytes, 0);
  assert.equal(result.evidence.mediaBytes, 0);
});
test('portal scripts retain the original 512KiB per-file cap', async () => {
  const p = paths[2], bytes = Buffer.alloc(524289);
  const { result } = await run([entry(p, bytes)], new Map([[p, bytes]]));
  assert.equal(result.status, 'NOT_MEASURED');
  assert.equal(result.evidence.files[0].status, 'SIZE_LIMIT');
  assert.equal(result.evidence.bytes, 0);
});
test('invitation and Arabic recordings share the unchanged 32MiB media ceiling', async () => {
  const media = [
    ['assets/audio/arabic-r1065/yasin.mp3', Buffer.alloc(25165824, 1)],
    [paths.at(-1), Buffer.alloc(500000, 2)],
    ['assets/audio/arabic-r1065/fatiha.mp3', Buffer.alloc(8388608, 3)]
  ];
  const { result, maximum } = await run(media.map(([p, bytes]) => entry(p, bytes)), new Map(media));
  assert.equal(result.status, 'NOT_MEASURED');
  assert.equal(result.evidence.mediaBytes, 25665824);
  assert.equal(result.evidence.bytes, 0);
  assert.equal(result.evidence.verifiedBytes, 25665824);
  assert.equal(result.evidence.files.filter(file => file.status === 'TOTAL_SIZE_LIMIT').length, 1);
  assert(maximum <= 2);
});
