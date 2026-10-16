/* Optional browser adapter. Load explicitly only after an actual HTTPS backend exists.
 * No token/code is placed in storage, DOM, URLs, logs, or this source file.
 */
(function (global) {
  'use strict';
  global.createBerhetHttpProvider = function createBerhetHttpProvider(options) {
    var base = new URL(options && options.baseURL);
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('An HTTPS provider URL is required.');
    var baseURL = base.href.replace(/\/$/, '');
    var active = null, generation = 0, pending = new Map();
    var transport = options.fetch || global.fetch.bind(global);
    var clock = options.now || Date.now;

    function alive(grant) { return !!grant && grant.expiresAt > clock(); }
    function fail(error) { return error ? { ok: false, error: error } : { ok: false }; }
    async function request(path, config) {
      config = config || {};
      var control = new AbortController();
      var external = config.signal;
      var abort = function () { control.abort(); };
      if (external) {
        if (external.aborted) control.abort();
        else external.addEventListener('abort', abort, { once: true });
      }
      var timeout = setTimeout(abort, 8000);
      try {
        if (control.signal.aborted) return fail('unavailable');
        var headers = { Accept: 'application/json' };
        if (config.body !== undefined) headers['Content-Type'] = 'application/json';
        if (config.token) headers.Authorization = 'Bearer ' + config.token;
        var response = await transport(baseURL + path, {
          method: config.method || 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store',
          redirect: 'error', referrerPolicy: 'no-referrer', headers: headers,
          body: config.body === undefined ? undefined : JSON.stringify(config.body), signal: control.signal
        });
        if (control.signal.aborted) return fail('unavailable');
        if (response.status === 401) return fail();
        if (response.status === 429) return fail('rate-limit');
        if (!response.ok) return fail('unavailable');
        if (response.status === 204) return { ok: true };
        var payload = await response.json();
        if (control.signal.aborted) return fail('unavailable');
        return { ok: true, payload: payload };
      } catch { return fail('network'); }
      finally {
        clearTimeout(timeout);
        if (external) external.removeEventListener('abort', abort);
      }
    }
    function revokeToken(token, signal) { return request('/v1/revoke', { method: 'POST', token: token, signal: signal }); }
    function detach(entry) {
      if (entry.signal && entry.onAbort) entry.signal.removeEventListener('abort', entry.onAbort);
    }
    function clearPending() {
      var tokens = [];
      pending.forEach(function (entry) { detach(entry); tokens.push(entry.token); });
      pending.clear();
      return tokens;
    }
    function backgroundRevoke(token) { void revokeToken(token).catch(function () {}); }
    function validGrant(data) {
      return data && typeof data.sessionToken === 'string' && /^[A-Za-z0-9_-]{43}$/.test(data.sessionToken) && data.tokenType === 'Bearer' && data.scope === 'berhetiyye'
        && Number.isSafeInteger(data.expiresAt) && data.expiresAt > clock() && data.expiresAt <= clock() + 13 * 60 * 60 * 1000;
    }
    return Object.freeze({
      verify: async function (code, config) {
        config = config || {};
        var signal = config.signal, epoch = ++generation;
        clearPending().forEach(backgroundRevoke);
        if (signal && signal.aborted) return fail();
        if (typeof code !== 'string' || !code.length || Array.from(code).length > 256) return fail();
        var result = await request('/v1/redeem', { method: 'POST', body: { code: code }, signal: signal });
        if (!result.ok) return result;
        var data = result.payload;
        if (!validGrant(data)) return fail('unavailable');
        if (epoch !== generation || signal && signal.aborted) { backgroundRevoke(data.sessionToken); return fail(); }
        var receipt = Object.freeze({ scope: data.scope, expiresAt: data.expiresAt });
        var entry = { token: data.sessionToken, expiresAt: data.expiresAt, generation: epoch, signal: signal };
        if (signal) {
          entry.onAbort = function () {
            if (pending.get(receipt) === entry) { pending.delete(receipt); backgroundRevoke(entry.token); }
          };
          signal.addEventListener('abort', entry.onAbort, { once: true });
        }
        pending.set(receipt, entry);
        if (signal && signal.aborted) { entry.onAbort(); return fail(); }
        return { ok: true, receipt: receipt };
      },
      commit: function (receipt, config) {
        var entry = pending.get(receipt);
        if (!entry || entry.generation !== generation || !alive(entry) || entry.signal && entry.signal.aborted || config && config.signal && config.signal.aborted) return fail();
        detach(entry); pending.delete(receipt);
        var oldToken = active && active.token;
        active = { token: entry.token, expiresAt: entry.expiresAt };
        if (oldToken && oldToken !== entry.token) backgroundRevoke(oldToken);
        return { ok: true, scope: 'berhetiyye', expiresAt: active.expiresAt };
      },
      isActive: function () {
        if (!alive(active)) active = null;
        return !!active;
      },
      status: async function (config) {
        config = config || {};
        if (!alive(active)) { active = null; return { ok: false, active: false }; }
        var grant = active, epoch = generation;
        var result = await request('/v1/session', { token: grant.token, signal: config.signal });
        if (epoch !== generation || grant !== active || config.signal && config.signal.aborted) return { ok: false, active: false };
        if (!result.ok) {
          if (!result.error) active = null;
          return Object.assign({ active: false }, result);
        }
        var data = result.payload;
        if (!data || data.active !== true || data.scope !== 'berhetiyye' || !Number.isSafeInteger(data.expiresAt) || data.expiresAt <= clock()) {
          active = null; return { ok: false, active: false, error: 'unavailable' };
        }
        active.expiresAt = data.expiresAt;
        return { ok: true, active: true, scope: data.scope, expiresAt: data.expiresAt };
      },
      revoke: async function (config) {
        config = config || {};
        generation++;
        var tokens = clearPending();
        if (active) tokens.push(active.token);
        active = null; // Always lock locally before any network wait or failure.
        var results = await Promise.all(Array.from(new Set(tokens)).map(function (token) { return revokeToken(token, config.signal); }));
        var error = results.find(function (result) { return !result.ok; });
        return error || { ok: true };
      }
    });
  };
  // Deliberately no automatic endpoint or provider installation. After deployment:
  // window.SUKUN_BERHET_ACCESS_PROVIDER = window.createBerhetHttpProvider({baseURL: 'https://YOUR-ACCESS-HOST'});
})(window);
