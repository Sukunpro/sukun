'use strict';
// Exact production service-worker functions with controlled CacheStorage/network.
// Reads the candidate WAV and manifests. No browser, actual cache, user store,
// network request, source write, or result-file write occurs when this test runs.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const read = relative => fs.readFileSync(path.join(root, relative));
const json = relative => JSON.parse(read(relative));
const sw = read('sw.js').toString();
const intro = read('assets/runtime/startup-intro-r1027.js').toString();
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const scope = 'https://example.test/sukun/';
const href = value => new URL(typeof value === 'string' ? value : value.url, scope).href;
const pathname = value => new URL(href(value)).pathname;
const results = [];
function check(condition, name) {
  assert.ok(condition, name);
  results.push({name, passed: true});
}

const build = sw.match(/^const SURUM\s*=\s*'(r\d+)';/m)?.[1];
const cacheName = sw.match(/^const CACHE\s*=\s*'([^']+)';/m)?.[1];
check(!!build && !!cacheName, 'candidate service-worker identity is readable');
const fetchMatch = intro.match(/window\.fetch\(\s*(['"])(\.\/assets\/audio\/[^'"?]+\.wav\?v=r\d+)\1\s*,/);
check(!!fetchMatch, 'intro explicitly fetches a release-versioned same-origin WAV');
const assetURL = fetchMatch[2];
const assetPath = new URL(assetURL, scope).pathname.slice(new URL(scope).pathname.length);
const bytes = read(assetPath);
const digest = hash(bytes);
check(bytes.length >= 44 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE', 'candidate bytes have a RIFF/WAVE header');
check(new URL(assetURL, scope).search === '?v=' + build, 'WAV fetch query matches the assembled service-worker release');
check(intro.includes("integrity:'sha256-" + Buffer.from(digest, 'hex').toString('base64') + "'"), 'page fetch SRI matches the actual WAV bytes');
check(intro.includes("actual!=='" + digest + "'"), 'page SHA-256 comparison matches the actual WAV bytes');

const runtimeDeclaration = sw.match(/^const REQUIRED_RUNTIME\s*=\s*(\[[^\n]+\]);/m);
check(!!runtimeDeclaration, 'required runtime inventory is readable');
const runtime = JSON.parse(runtimeDeclaration[1]);
const matching = runtime.filter(entry => pathname(entry.url) === pathname(assetURL));
check(matching.length === 1, 'WAV occurs exactly once in the required runtime inventory');
const entry = matching[0];
check(entry.url === assetURL && entry.sha256 === digest, 'required WAV URL and SHA-256 match the page and actual bytes');
const marker = json('sukun-build-' + build + '.json');
check(JSON.stringify(marker.runtime) === JSON.stringify(runtime), 'build marker and worker required inventories agree exactly');
check(marker.build === build && marker.siteBackupManifestUrl === './sukun-site-assets-' + build + '.json', 'build marker selects its own release inventory');
const inventory = json('sukun-site-assets-' + build + '.json');
const inventoryEntries = inventory.files.filter(file => file.path === assetPath);
check(inventory.build === build && inventoryEntries.length === 1, 'site inventory contains exactly one candidate WAV entry');
check(inventoryEntries[0].sha256 === digest && inventoryEntries[0].bytes === bytes.length, 'portable backup WAV SHA-256 and size match its actual bytes');
check(inventory.totalBytes === inventory.files.reduce((sum, file) => sum + file.bytes, 0), 'portable backup totalBytes includes the WAV');
check(marker.maxPreviousVersions === 5 && /const RECOVERY_MAX_PREVIOUS\s*=\s*5;/.test(sw), 'five-previous-version recovery retention is preserved');
check(marker.automaticDataRecovery === false && marker.exactDataRestoreEnabled === false, 'personal-data recovery remains disabled');
const releaseChecks = results.length;

// Substitute only REQUIRED_RUNTIME with the actual candidate WAV entry so the
// production algorithms can be exercised without the rest of the partial tree.
// Each fixture has independent synthetic shell/marker/meta/network/cache bytes.
const fixtureSource = sw.replace(runtimeDeclaration[0], 'const REQUIRED_RUNTIME = ' + JSON.stringify([entry]) + ';');
const shell = '<!doctype html><meta name="sukun-build" content="' + build + '">';
const fixtureMarker = {build, runtime: [entry], shell: {sha256: hash(shell)}};

function fixture(networkBytes = bytes) {
  const stores = new Map();
  const network = [];
  const writes = [];
  const deletions = [];
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async name => {deletions.push(name); return stores.delete(name);},
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const records = stores.get(name);
      return {
        match: async (key, options = {}) => {
          const url = href(key);
          let response = records.get(url);
          if (!response && options.ignoreSearch) response = [...records].find(([saved]) => pathname(saved) === pathname(url))?.[1];
          return response?.clone();
        },
        put: async (key, response) => {
          writes.push({cache: name, url: href(key)});
          records.set(href(key), response.clone());
        },
        keys: async () => [...records.keys()].map(key => new Request(key)),
        delete: async key => {deletions.push({cache: name, url: href(key)}); return records.delete(href(key));}
      };
    }
  };
  const files = new Map([
    ['./nero.html', shell],
    ['./manifest.webmanifest', JSON.stringify({short_name: 'SÜKÛN', start_url: './nero.html?v=' + build})],
    ['./sukun-build-' + build + '.json', JSON.stringify(fixtureMarker)],
    ['./sukun-latest.json', JSON.stringify({v: build})],
    [entry.url, networkBytes]
  ]);
  const context = {
    URL, Request, Response, Headers, TextEncoder, TextDecoder, AbortController,
    DOMException, crypto: crypto.webcrypto, Uint8Array, ArrayBuffer, Map, Set,
    Promise, Date, setTimeout, clearTimeout, caches,
    btoa: value => Buffer.from(value, 'binary').toString('base64'),
    self: {
      location: {href: scope + 'sw.js', origin: new URL(scope).origin},
      registration: {scope},
      clients: {matchAll: async () => [], claim: async () => {}},
      addEventListener() {}
    }
  };
  vm.createContext(context);
  vm.runInContext(fixtureSource, context, {filename: 'candidate-sw.js'});
  // Intercept the production fetch boundary. No real fetch is exposed to the
  // fixture; all successful bodies still pass through production SHA checking.
  context.fetchFresh = async request => {
    network.push(request);
    if (!files.has(request) || files.get(request) === null) throw Error('Controlled missing fixture file');
    return new Response(files.get(request), {headers: {'Content-Type': request === entry.url ? 'audio/wav' : 'application/json'}});
  };
  return {context, run: expression => vm.runInContext(expression, context), stores, caches, files, network, writes, deletions};
}

async function main() {
  const good = fixture();
  let meta = await good.run('prepareShell()');
  check(meta.complete, 'binary WAV manifest member completes staged installation');
  check(meta.runtimeRequired === 1, 'binary WAV is counted as required runtime');
  check(await good.run('currentComplete()'), 'binary WAV hash participates in current release readiness');
  const verified = await good.run('recoveryVerifyCache(CACHE, true)');
  check(verified?.verified, 'binary WAV is accepted during recovery proof enrollment');
  good.context.request = new Request(href(entry.url));
  let response = await good.run('assetResponse(request)');
  check(hash(Buffer.from(await response.arrayBuffer())) === digest, 'ordinary asset dispatch returns the exact approved binary bytes');
  const networkBefore = good.network.length;
  good.files.clear();
  response = await good.run('assetResponse(request)');
  check(response.ok && good.network.length === networkBefore, 'offline verified binary cache hit performs no network request');
  good.context.pin = verified;
  response = await good.run('recoveryAsset(request, pin)');
  check(response.ok && hash(Buffer.from(await response.arrayBuffer())) === digest, 'recovery pin serves only its verified binary bytes');
  const wrongURL = new URL(entry.url, scope);
  wrongURL.searchParams.set('v', 'r' + (Number(build.slice(1)) + 1));
  good.context.request = new Request(wrongURL.href);
  check((await good.run('recoveryAsset(request, pin)')).type === 'error', 'recovery pin rejects a different explicit version query');
  const currentCache = await good.caches.open(cacheName);
  await currentCache.put(entry.url, new Response('corrupt'));
  check(!await good.run('currentComplete()'), 'corrupt binary invalidates current readiness');
  check(!await good.run('recoveryVerifyCache(CACHE, false)'), 'corrupt binary invalidates recovery verification');
  good.context.request = new Request(href(entry.url));
  check((await good.run('recoveryAsset(request, pin)')).type === 'error', 'recovery pin refuses corrupt binary bytes');
  check((await good.run('assetResponse(request)')).type === 'error', 'offline corrupt binary fails without a stale fallback');

  const corrupt = fixture(Buffer.from('wrong WAV bytes'));
  meta = await corrupt.run('prepareShell()');
  check(!meta.complete, 'wrong downloaded binary blocks installation');
  check(meta.errors.some(error => error.includes(assetPath)), 'installation error identifies the wrong binary asset');
  check([...corrupt.stores.get(cacheName).keys()].every(key => key.includes('sukun-cache-meta-')), 'invalid installation writes no staged shell or runtime bytes');
  const missing = fixture(null);
  check(!(await missing.run('prepareShell()')).complete, 'missing binary blocks installation');

  console.log(JSON.stringify({
    build, asset: assetPath, sha256: digest, bytes: bytes.length,
    passed: results.length, total: results.length, releaseChecks,
    workerChecks: results.length - releaseChecks,
    source: 'Candidate source and manifests; exact service-worker functions with a singleton candidate WAV fixture',
    scope: 'Controlled in-memory CacheStorage/network only. No actual browser installation, audible playback, user storage, source writes or remote writes.',
    results
  }, null, 2));
}
main().catch(error => {console.error(error.stack); process.exitCode = 1;});
