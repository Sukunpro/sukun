// Optional Cloudflare Worker. This file is NOT loaded by the GitHub Pages app.
// Secrets and raw access codes must never be copied into browser assets.
const SESSION_MS = 12 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 2048;
const SCOPE = 'berhetiyye';
const enc = new TextEncoder();

function b64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(text) {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) throw new Error('Invalid hash configuration');
  const raw = atob(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - text.length % 4) % 4));
  const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
  if (b64url(bytes) !== text) throw new Error('Invalid hash configuration');
  return bytes;
}
function parseHash(value) {
  if (typeof value !== 'string') throw new Error('Missing hash');
  const parts = value.split('$');
  // Workerd-compatible cost; use a high-entropy random access code, not a short PIN.
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256' || parts[1] !== '100000') throw new Error('Invalid hash configuration');
  const salt = fromB64url(parts[2]);
  const hash = fromB64url(parts[3]);
  if (salt.length !== 16 || hash.length !== 32) throw new Error('Invalid hash configuration');
  return { iterations: 100000, salt, hash };
}
function config(env, cryptoAPI) {
  const origin = env.ALLOWED_ORIGIN;
  if (typeof origin !== 'string' || !origin.startsWith('https://') || new URL(origin).origin !== origin) throw new Error('Invalid origin');
  if (!env.BERHET_SESSIONS || !['get', 'put', 'delete'].every(k => typeof env.BERHET_SESSIONS[k] === 'function')) throw new Error('Missing session binding');
  if (typeof env.BERHET_RATE_LIMITER?.limit !== 'function') throw new Error('Missing rate limiter');
  if (typeof env.BERHET_RATE_KEY_SECRET !== 'string' || env.BERHET_RATE_KEY_SECRET.length < 32) throw new Error('Missing rate key secret');
  if (typeof env.BERHET_LICENSE_ID !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(env.BERHET_LICENSE_ID)) throw new Error('Missing license id');
  // Cloudflare's native comparison is required. Do not silently use a JS equality loop.
  if (typeof cryptoAPI?.subtle?.timingSafeEqual !== 'function') throw new Error('Missing native timing-safe comparison');
  return { origin, licenseId: env.BERHET_LICENSE_ID, ...parseHash(env.BERHET_ACCESS_CODE_HASH) };
}
function response(status, body, origin, extra = {}) {
  const headers = {
    'Cache-Control': 'no-store', 'Pragma': 'no-cache', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'Vary': 'Origin', ...extra
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  if (body !== null) headers['Content-Type'] = 'application/json; charset=utf-8';
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}
async function readJSON(request) {
  if ((request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase() !== 'application/json') {
    return { error: 415 };
  }
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) return { error: 413 };
  const reader = request.body?.getReader();
  if (!reader) return { error: 400 };
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) { await reader.cancel(); return { error: 413 }; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).length !== 1 || typeof body.code !== 'string') return { error: 400 };
    if (!body.code.length || Array.from(body.code).length > 256 || enc.encode(body.code).length > 1024) return { error: 400 };
    return { code: body.code };
  } catch { return { error: 400 }; }
  finally { reader.releaseLock(); }
}
function bearer(request) {
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(request.headers.get('authorization') || '');
  return match?.[1] || null;
}

// Dependencies are injectable for isolated unit tests; production uses native Worker globals.
export function createHandler({ cryptoAPI = globalThis.crypto, now = Date.now } = {}) {
  async function digest(text) {
    const bytes = new Uint8Array(await cryptoAPI.subtle.digest('SHA-256', enc.encode(text)));
    return Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('');
  }
  return async function handle(request, env) {
    let c;
    try { c = config(env, cryptoAPI); }
    catch { return response(503, { error: 'service_unavailable' }, null); }
    if (request.headers.get('origin') !== c.origin) return response(403, { error: 'origin_denied' }, null);
    const url = new URL(request.url);
    if (url.protocol !== 'https:' || url.search) return response(400, { error: 'invalid_request' }, c.origin);
    if (!['/v1/redeem', '/v1/session', '/v1/revoke'].includes(url.pathname)) return response(404, { error: 'not_found' }, c.origin);
    const expected = url.pathname === '/v1/session' ? 'GET' : 'POST';
    if (request.method === 'OPTIONS') {
      const method = request.headers.get('access-control-request-method');
      const headers = (request.headers.get('access-control-request-headers') || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
      if (method !== expected || headers.some(h => !['content-type', 'authorization'].includes(h))) return response(403, { error: 'preflight_denied' }, c.origin);
      return response(204, null, c.origin, { 'Access-Control-Allow-Methods': expected, 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '300' });
    }
    if (request.method !== expected) return response(405, { error: 'method_not_allowed' }, c.origin, { Allow: expected });
    try {
      // Only deploy behind Cloudflare: this header is a trusted edge-provided value there.
      const ip = request.headers.get('cf-connecting-ip');
      if (!ip || ip.length > 64) return response(503, { error: 'service_unavailable' }, c.origin);
      const key = await cryptoAPI.subtle.importKey('raw', enc.encode(env.BERHET_RATE_KEY_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const rateKey = b64url(new Uint8Array(await cryptoAPI.subtle.sign('HMAC', key, enc.encode(ip))));
      const rate = await env.BERHET_RATE_LIMITER.limit({ key: `${url.pathname}:${rateKey}` });
      if (!rate || typeof rate.success !== 'boolean') throw new Error('Invalid limiter result');
      if (!rate.success) return response(429, { error: 'try_later' }, c.origin, { 'Retry-After': '60' });
      if (url.pathname === '/v1/redeem') {
        const input = await readJSON(request);
        if (input.error) return response(input.error, { error: 'invalid_request' }, c.origin);
        const material = await cryptoAPI.subtle.importKey('raw', enc.encode(input.code), 'PBKDF2', false, ['deriveBits']);
        const derived = new Uint8Array(await cryptoAPI.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: c.salt, iterations: c.iterations }, material, 256));
        if (!cryptoAPI.subtle.timingSafeEqual(derived, c.hash)) return response(401, { error: 'access_denied' }, c.origin);
        const token = b64url(cryptoAPI.getRandomValues(new Uint8Array(32)));
        const expiresAt = now() + SESSION_MS;
        const record = { licenseId: c.licenseId, scope: SCOPE, expiresAt };
        await env.BERHET_SESSIONS.put(`session:${await digest(token)}`, JSON.stringify(record), { expirationTtl: SESSION_MS / 1000 });
        return response(200, { sessionToken: token, tokenType: 'Bearer', scope: SCOPE, expiresAt }, c.origin);
      }
      const token = bearer(request);
      if (!token) return response(401, { error: 'session_required' }, c.origin);
      const storageKey = `session:${await digest(token)}`;
      if (url.pathname === '/v1/revoke') {
        // Deliberately revoke only this session, never the code or membership/license.
        await env.BERHET_SESSIONS.delete(storageKey);
        return response(204, null, c.origin);
      }
      const record = await env.BERHET_SESSIONS.get(storageKey, 'json');
      if (!record || record.scope !== SCOPE || record.licenseId !== c.licenseId || !Number.isSafeInteger(record.expiresAt) || record.expiresAt <= now()) {
        return response(401, { error: 'session_expired' }, c.origin);
      }
      return response(200, { active: true, scope: SCOPE, expiresAt: record.expiresAt }, c.origin);
    } catch {
      // Do not log body, code, token, raw IP, hash, or binding exceptions.
      return response(503, { error: 'service_unavailable' }, c.origin);
    }
  };
}

export default { fetch(request, env) { return createHandler()(request, env); } };
