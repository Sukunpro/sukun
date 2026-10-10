'use strict';
// Controlled production-function regression, not browser or physical Android proof.
// No network, browser, user storage, source writes or publication occurs here.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/runtime/tekke-ux-r992.css'), 'utf8');
const artPath = 'assets/scenes/tekke-r1014/berhet-billur.webp';
const cssURL = '../scenes/tekke-r1014/berhet-billur.webp';
const bytes = fs.readFileSync(path.join(root, artPath));
const hash = input => crypto.createHash('sha256').update(input).digest('hex');
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const build = sw.match(/^const SURUM\s*=\s*'(r\d+)';/m)?.[1];
const cacheName = sw.match(/^const CACHE\s*=\s*'([^']+)';/m)?.[1];
check(!!build && !!cacheName, 'detect the tested release and cache dynamically');
const historicalBuild = 'r1014'; // The former CSS component query, not the release under test.
check(Number(build.slice(1)) > 1014, 'the tested release is newer than the legacy image query');
const inventory = JSON.parse(sw.match(/^const REQUIRED_RUNTIME\s*=\s*(\[[^\n]+\]);/m)[1]);
const scope = 'https://sukunpro.github.io/sukun/';
const href = value => new URL(typeof value === 'string' ? value : value.url, scope).href;
const pathname = value => new URL(href(value)).pathname;
const entry = inventory.find(item => pathname(item.url) === pathname(artPath));
check(!!entry && new URL(href(entry.url)).searchParams.get('v') === build, 'Cabir is a current-build required asset');
check(entry.sha256 === hash(bytes), 'required image hash matches its actual bytes');
check(hash(bytes) === '17cbb4b7cc419bcc7e4fd0618c012ede1104523ed956aeed380280d169af6a50', 'Cabir artwork bytes are unchanged');
check(bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP', 'Cabir remains a WebP image');
check(css.split(cssURL).length - 1 === 2, 'both expected Cabir background declarations are present');
check(!css.includes(cssURL + '?'), 'neither Cabir background declaration pins an obsolete query');
check(hash(css.replaceAll(cssURL, cssURL + '?v=r1014')) === '8fde58107301e708b36c16a8f25093dfed6144711b5ab6775199355109123113', 'all CSS, including #tk/body::after paint selectors, is byte-preserved apart from the two suffix removals');
function extract(startToken, endToken) {
  const start = sw.indexOf(startToken), end = sw.indexOf(endToken, start);
  assert.ok(start >= 0 && end > start, 'production function boundaries remain available');
  return sw.slice(start, end).trim();
}
const runtimeSource = extract('async function runtimeResponse(', '\nfunction isArt(');
const recoverySource = extract('async function recoveryAsset(', '\n// This standalone client');
const artSource = sw.match(/^function isArt\(url\)\{[^\n]+\}/m)[0];
check(hash(runtimeSource) === 'ce40d15c8758147839078834fd1dbc48a14bd21db62e88460b33e43299da86a5', 'runtimeResponse core is unchanged');
check(hash(recoverySource) === '30ad677fe91e279bfc70c574ccd4d57004561e0a39195ce24c5cf1b9e81395ed', 'recoveryAsset core is unchanged');
check(/const runtime=REQUIRED_RUNTIME\.find\(entry=>sameOriginPath\(entry\.url\)===url\.pathname\);if\(runtime\)return runtimeResponse\(request,runtime\);\s*if\(isArt\(url\)\)return artResponse\(request\);/.test(sw), 'required Cabir image is dispatched before optional artwork handling');
const response = data => new Response(data, {headers: {'Content-Type': 'image/webp'}});
function fixture() {
  const stores = new Map([[cacheName, new Map([[href(entry.url), response(bytes)]])]]);
  const shellBuilds = new Map([[cacheName, build]]);
  const calls = {network: [], reads: [], writes: []};
  const open = async name => {
    if (!stores.has(name)) stores.set(name, new Map());
    return {match: async (request, options = {}) => {
      const key = href(request); calls.reads.push({cache: name, url: key});
      const records = stores.get(name);
      if (!options.ignoreSearch) return records.get(key)?.clone();
      return [...records].find(([url]) => pathname(url) === pathname(key))?.[1]?.clone();
    }};
  };
  const context = {URL, Request, Response, SURUM: build, CACHE: cacheName,
    ART_CACHE: 'sukun-art-persistent-v1', LATEST_MARKER: './sukun-latest.json',
    self: {location: {href: scope + 'sw.js'}},
    caches: {open, keys: async () => [...stores.keys()]},
    cachedShellFrom: async name => shellBuilds.has(name) ? {build: shellBuilds.get(name)} : null,
    isAppCacheName: name => shellBuilds.has(name),
    sameOriginPath: pathname, recoveryPath: pathname, vnum: value => Number(value.slice(1)),
    sha256Response: async res => hash(Buffer.from(await res.clone().arrayBuffer())),
    fetchFresh: async url => {calls.network.push(url); throw Error('Controlled offline network');},
    put: async (...args) => {calls.writes.push(args); throw Error('Unexpected cache write');},
    validArt: res => !!res?.ok, artKey: request => {
      const url = new URL(href(request)); url.searchParams.delete('v'); return new Request(url.href);
    }};
  vm.createContext(context);
  vm.runInContext(artSource + '\n' + runtimeSource + '\n' + recoverySource, context);
  return {context, stores, shellBuilds, calls};
}
const request = query => new Request(href(artPath + query));
const sameBytes = async res => hash(Buffer.from(await res.clone().arrayBuffer())) === hash(bytes);
async function main() {
  const observations = [];
  const old = fixture();
  const failed = await old.context.runtimeResponse(request('?v=' + historicalBuild), entry);
  check(failed.type === 'error' && failed.status === 0, 'old component query fails without a verified historical cache');
  check(old.calls.network.length === 0 && old.calls.reads.length === 0, 'old-query failure bypasses both current image bytes and the network');
  observations.push({case: 'legacy component URL without historical cache', status: failed.status, type: failed.type});
  for (const query of ['?v=' + build, '']) {
    const f = fixture(), res = await f.context.runtimeResponse(request(query), entry);
    check(res.ok && await sameBytes(res), 'current or unversioned URL returns exact verified current bytes: ' + (query || '(unversioned)'));
    check(f.calls.reads.some(call => call.url === href(entry.url)), 'canonical current-build cache key is used');
    check(f.calls.network.length === 0 && f.calls.writes.length === 0, 'valid cached image requires no network or write');
    observations.push({case: query ? 'current-build URL' : 'repaired unversioned URL', status: res.status, sha256: hash(Buffer.from(await res.arrayBuffer()))});
  }
  const invalid = fixture();
  invalid.stores.get(cacheName).set(href(entry.url), response('corrupted image'));
  const refused = await invalid.context.runtimeResponse(request(''), entry);
  check(refused.type === 'error', 'unversioned URL does not bypass image hash verification');
  check(invalid.calls.network.length === 1 && invalid.calls.writes.length === 0, 'corrupt cache attempts the canonical verified fetch and fails safely offline');
  const historical = fixture(), oldName = 'verified-' + historicalBuild;
  const oldEntry = {...entry, url: './' + artPath + '?v=' + historicalBuild};
  historical.shellBuilds.set(oldName, historicalBuild);
  historical.stores.set(oldName, new Map([
    [href('./sukun-build-' + historicalBuild + '.json'), new Response(JSON.stringify({build: historicalBuild, runtime: [oldEntry]}))],
    [href(oldEntry.url), response(bytes)]
  ]));
  const historicalHit = await historical.context.runtimeResponse(request('?v=' + historicalBuild), entry);
  check(historicalHit.ok && await sameBytes(historicalHit), 'an actual verified historical cache can still satisfy its historical URL');
  const pinned = fixture(), pinBuild = 'r' + (Number(build.slice(1)) - 1);
  const pinnedEntry = {...entry, url: './' + artPath + '?v=' + pinBuild};
  const marker = JSON.stringify({build: pinBuild, runtime: [pinnedEntry]});
  const pin = {build: pinBuild, cache: 'verified-pin-' + pinBuild, markerSha256: hash(marker)};
  pinned.stores.set(pin.cache, new Map([
    [href('./sukun-build-' + pinBuild + '.json'), new Response(marker)],
    [href(pinnedEntry.url), response(bytes)]
  ]));
  for (const query of ['', '?v=' + pinBuild]) {
    const res = await pinned.context.recoveryAsset(request(query), pin);
    check(res.ok && await sameBytes(res), 'pinned recovery serves only the pin’s verified image for its own or unversioned URL');
    observations.push({case: query ? 'pinned-build URL' : 'unversioned URL under recovery pin', build: pinBuild, status: res.status});
  }
  for (const query of ['?v=' + historicalBuild, '?v=' + build]) {
    const res = await pinned.context.recoveryAsset(request(query), pin);
    check(res.type === 'error', 'recovery pin intentionally refuses a different explicit build query: ' + query);
  }
  pinned.stores.get(pin.cache).set(href(pinnedEntry.url), response('corrupt pinned bytes'));
  check((await pinned.context.recoveryAsset(request(''), pin)).type === 'error', 'pinned image hash mismatch remains blocked');
  const invalidPin = {...pin, markerSha256: '0'.repeat(64)};
  check((await pinned.context.recoveryAsset(request(''), invalidPin)).type === 'error', 'pinned marker hash mismatch remains blocked');
  check(pinned.calls.network.length === 0 && pinned.calls.writes.length === 0, 'pinned checks never fetch or modify cache contents');
  console.log(JSON.stringify({build, total: checks, passed: checks, failed: 0,
    source: 'Extracted production runtimeResponse and recoveryAsset with controlled cache fixtures',
    scope: 'No physical Android or browser-rendering claim; application service-worker logic is unchanged.',
    observations}, null, 2));
}
main().catch(error => {console.error(error.stack); process.exitCode = 1;});
