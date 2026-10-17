/* SÜKÛN r1080 — access boundary for the Berhetiyye presentation.
 * Default: the existing, configured device privacy PIN. This is not paid
 * membership. An explicitly installed server provider is authoritative.
 * No password, receipt, token or entitlement is written to browser storage.
 */
(function () {
  'use strict';
  if (window.SukunBerhetGateAccess) return;
  var generation = 0, pending = null;
  var nativeIsOpen = window.KLT_ACIK, watchedProvider = null, statusSuspended = false;
  var lastStatusAt = -Infinity, statusJob = null, lockJob = null;
  function read(fn, fallback) { try { var value = fn(); return value == null ? fallback : value; } catch (_) { return fallback; } }
  function provider() { return window.SUKUN_BERHET_ACCESS_PROVIDER || null; }
  function activeProvider(p) { return !!p && read(function () { return p.isActive() === true; }, false); }
  function configured() { return read(function () { return window.KLT_KURULU() === true; }, false); }
  function rawOpen() { return read(function () { return nativeIsOpen() === true; }, false); }
  function legacyOpen() { var p = provider(); return rawOpen() && (!p || activeProvider(p) && !statusSuspended); }
  // All existing secret-policy consumers must also fail closed in provider mode.
  // Keep the original device-lock behavior exactly when no provider is installed.
  window.KLT_ACIK = legacyOpen;
  function language() { return read(function () { return window.I18N.lang; }, document.documentElement.lang || 'tr') === 'en' ? 'en' : 'tr'; }
  function en() { return language() === 'en'; }
  function abortError() { var error = new Error('Access operation cancelled'); error.name = 'AbortError'; return error; }
  function unavailable() { var error = new Error('Access service unavailable'); error.code = 'unavailable'; return error; }
  function check(signal) { if (signal && signal.aborted) throw abortError(); }
  function clearPending() {
    if (pending && pending.signal && pending.onAbort) pending.signal.removeEventListener('abort', pending.onAbort);
    if (pending) { pending.password = ''; pending.receipt = null; }
    pending = null;
  }
  function current(entry, signal) { return pending === entry && entry.epoch === generation && entry.provider === provider() && !(signal && signal.aborted) && !(entry.signal && entry.signal.aborted); }
  function retain(entry) {
    pending = entry;
    if (entry.signal) {
      entry.onAbort = function () { if (pending === entry) { generation++; clearPending(); } };
      entry.signal.addEventListener('abort', entry.onAbort, {once:true});
      if (entry.signal.aborted) entry.onAbort();
    }
  }
  function sanitizeFailure(result) {
    if (!result || !result.error) return {ok:false};
    return {ok:false, error:['network','unavailable','rate-limit'].indexOf(result.error) >= 0 ? result.error : 'unavailable'};
  }
  function isUnlocked() {
    var p = provider();
    return p ? activeProvider(p) && legacyOpen() : legacyOpen();
  }
  async function verify(password, options) {
    options = options || {};
    var signal = options.signal, epoch = ++generation, p = provider();
    clearPending();
    if (signal && signal.aborted) return {ok:false};
    if (typeof password !== 'string' || !password.trim() || password.length > 256) return {ok:false};
    // The legacy setup form trims a PIN before setting it; preserve that rule.
    var code = p ? password : password.trim();
    if (p) {
      if (typeof p.verify !== 'function' || typeof p.commit !== 'function' || typeof p.isActive !== 'function' || typeof p.revoke !== 'function') return {ok:false,error:'unavailable'};
      var result;
      try { result = await p.verify(code, {signal:signal}); }
      catch (error) { return {ok:false,error:error && error.code === 'unavailable' ? 'unavailable' : 'network'}; }
      code = ''; password = '';
      if (epoch !== generation || p !== provider() || signal && signal.aborted) return {ok:false};
      if (!result || result.ok !== true) return sanitizeFailure(result);
      if (!result.receipt) return {ok:false,error:'unavailable'};
      retain({epoch:epoch,provider:p,receipt:result.receipt,signal:signal});
      return {ok:true};
    }
    if (!configured()) return {ok:false,error:'unavailable',message:en() ? 'Set a device entry password first. This is a device privacy lock.' : 'Önce bu cihazın giriş şifresini ayarla. Bu, cihaz içi gizlilik kilididir.'};
    if (!read(function () { return typeof window.kltDogrula === 'function' && window.kltDogrula(code) === true; }, false)) return {ok:false};
    if (epoch !== generation || signal && signal.aborted) return {ok:false};
    retain({epoch:epoch,provider:null,password:code,signal:signal});
    code = ''; password = '';
    return {ok:true};
  }
  async function sessionOpened(options) {
    options = options || {};
    var signal = options.signal, entry = pending;
    check(signal);
    if (!entry || !current(entry, signal)) throw abortError();
    try {
    if (entry.provider) {
      var bridge = window.SukunBerhetGatePrivacy;
      if (!bridge || typeof bridge.unlock !== 'function') { clearPending(); throw unavailable(); }
      var result = await entry.provider.commit(entry.receipt, {signal:signal});
      if (!current(entry, signal)) throw abortError();
      if (!result || result.ok !== true || !activeProvider(entry.provider)) { clearPending(); throw unavailable(); }
      check(signal);
      statusSuspended = false; watchedProvider = entry.provider; statusJob = null; lastStatusAt = Date.now();
      if (bridge.unlock() === false || !legacyOpen()) { clearPending(); throw unavailable(); }
    } else {
      // A PIN may have changed between verification and the animation commit.
      if (!configured() || !read(function () { return window.kltDogrula(entry.password) === true; }, false)) { clearPending(); throw unavailable(); }
      check(signal);
      if (window.KLT_AC(entry.password) !== true || !legacyOpen()) { clearPending(); throw unavailable(); }
    }
    return {ok:true};
    } finally { if (pending === entry) clearPending(); }
  }
  async function endSession(options) {
    options = options || {};
    generation++; clearPending(); statusJob = null;
    var p = provider(), bridge = window.SukunBerhetGatePrivacy;
    // The privacy bridge parks private queue entries before emitting revocation.
    // Never call the destructive legacy lock when an installed queue lacks it.
    if (bridge && typeof bridge.lock === 'function') {
      if (await bridge.lock() === false || rawOpen()) throw unavailable();
    } else if (!window.GlobalQueue && typeof window.KLT_KILITLE === 'function') {
      window.KLT_KILITLE();
      if (rawOpen()) throw unavailable();
    } else throw unavailable();
    if (p) {
      if (typeof p.revoke !== 'function') throw unavailable();
      // A network failure cannot reopen the already locked local presentation.
      try { await p.revoke({signal:options.signal}); } catch (_) {}
    }
    return {ok:true};
  }
  async function enter(options) {
    options = options || {}; check(options.signal);
    if (!isUnlocked()) throw unavailable();
    var api = window.SukunSessionState;
    if (!api || typeof api.snapshot !== 'function' || typeof api.command !== 'function') throw unavailable();
    var snapshot = api.snapshot();
    // Reopening the palace must not reset its current name, count or journey.
    if (snapshot.activeMode === 'berhet') return {ok:true};
    check(options.signal);
    var result = await api.command('select', {mode:'berhet',journeyKind:'single'});
    check(options.signal);
    if (result === false || result && result.accepted === false) throw unavailable();
    if (!isUnlocked()) throw unavailable();
    return {ok:true};
  }
  function revealEntry() {
    // A completed entry reveals the existing wheel. Selection/transport remain
    // owned by enter() and SessionState; reopening never restarts a Berhetiyye.
    var current = function () { return isUnlocked() && !read(function () { return window.SukunBerhetGate.snapshot().open; }, false) && read(function () { return window.SukunSessionState.snapshot().activeMode === 'berhet'; }, false); };
    if (!current()) return false;
    var tab = document.querySelector('.tab[data-t="zkr"]');
    if (tab && !tab.classList.contains('act')) tab.click();
    read(function () { return window.SukunPracticeUI.restorePresentation(); }, false);
    var target = document.getElementById('r924WheelFrame') || document.getElementById('zCountVisual');
    var counter = document.getElementById('r920Counter');
    // During a live recorded repetition the counter may intentionally reject
    // manual corrections. Keep keyboard focus on an enabled destination.
    var focus = counter && !counter.disabled ? counter : document.getElementById('r920NameInfo') || target;
    return !!read(function () { return window.SukunNavigationR1066.reveal(target, {reason:'berhet-gate-entry', block:'center', focus:focus, isCurrent:function () { return current() && (!tab || tab.classList.contains('act')); }}); }, false);
  }
  function needsSetup() { return !provider() && !configured(); }
  function openSetup() { return read(function () { return window.SukunBerhetGateEntry.openSetup(); }, false); }
  function canManageDevicePassword() { return !provider(); }
  function setDevicePassword(password, options) {
    options = options || {}; check(options.signal);
    generation++; clearPending();
    if (provider() || configured() || typeof password !== 'string' || !password.trim() || password.trim().length > 256) throw unavailable();
    if (!read(function () { return window.KLT_AYARLA(password.trim()) === true; }, false) || !configured() || rawOpen()) throw unavailable();
    check(options.signal);
    return {ok:true};
  }
  async function resetDevicePassword(options) {
    options = options || {}; check(options.signal);
    if (provider()) throw unavailable();
    // Park concealed queue steps through the same bridge as explicit lock.
    // Reset only the credential after that lock has completed successfully.
    await endSession(options); check(options.signal);
    if (provider() || rawOpen() || !read(function () { return window.KLT_SIFIRLA_KILITLI() === true; }, false)) throw unavailable();
    return {ok:true};
  }
  function getCalendarText() {
    var value = read(function () { return isUnlocked() && window.SukunBerhetGateCalendar(); }, null);
    if (!value) return '';
    return (en() ? 'Today’s traditional calendar match: ' : 'Bugünün geleneksel takvim eşlemesi: ') + value.mansion + ' · ' + value.name + (en() ? '. This does not calculate the Moon’s current position.' : '. Ay’ın anlık konumu hesaplanmaz.');
  }
  function getAccessLabel() { return provider() ? (en() ? 'Server-verified access' : 'Sunucuda doğrulanan geçiş') : (en() ? 'This device’s privacy password' : 'Bu cihazın gizlilik şifresi'); }
  function getHelpText() { return provider() ? (en() ? 'Access is verified by the configured service. Locking the door ends this session without deleting your access right.' : 'Geçiş, yapılandırılmış sunucuda doğrulanır. Kapıyı kilitlemek erişim hakkını silmeden bu oturumu kapatır.') : (en() ? 'This door uses this device’s privacy password. It is a local privacy curtain, not paid membership verification or an encrypted vault. Resetting the password preserves recordings and counters.' : 'Bu kapı, cihazının gizlilik şifresini kullanır. Bu bir yerel gizlilik perdesidir; ücretli üyelik doğrulaması veya şifreli kasa değildir. Şifreyi sıfırlamak kayıtlarını ve sayaçlarını silmez.'); }
  function getContextText() {
    var snapshot = read(function () { return window.SukunSessionState.snapshot(); }, null);
    if (!snapshot || !snapshot.playing && !snapshot.paused) return en() ? 'Your dhikr selection is preserved.' : 'Zikir seçimin korunur.';
    return snapshot.playing ? (en() ? 'Your current dhikr continues while you visit the threshold.' : 'Eşiği ziyaret ederken mevcut zikrin devam eder.') : (en() ? 'Your paused dhikr is preserved.' : 'Duraklatılmış zikrin korunur.');
  }
  async function lockExpiredProvider() {
    if (lockJob || !rawOpen()) return lockJob;
    var bridge = window.SukunBerhetGatePrivacy;
    if (!bridge || typeof bridge.lock !== 'function') return;
    lockJob = Promise.resolve().then(function () { return bridge.lock(); }).catch(function () {}).finally(function () { lockJob = null; });
    return lockJob;
  }
  async function refreshProvider() {
    var p = provider();
    if (p !== watchedProvider) { watchedProvider = p; statusSuspended = false; lastStatusAt = -Infinity; statusJob = null; }
    if (!p) return;
    if (!activeProvider(p) || statusSuspended) { await lockExpiredProvider(); return; }
    if (document.hidden || statusJob || Date.now() - lastStatusAt < 60000) return;
    lastStatusAt = Date.now();
    if (typeof p.status !== 'function') { statusSuspended = true; await lockExpiredProvider(); return; }
    var job = Promise.resolve().then(function () { return p.status(); }); statusJob = job;
    var result; try { result = await job; } catch (_) { result = null; }
    if (provider() !== p || statusJob !== job) return;
    statusJob = null;
    if (!result || result.ok !== true || result.active !== true || !activeProvider(p)) { statusSuspended = true; await lockExpiredProvider(); }
  }
  window.SukunBerhetGateAccess = Object.freeze({version:'r1080',verify:verify,sessionOpened:sessionOpened,isUnlocked:isUnlocked,enter:enter,revealEntry:revealEntry,endSession:endSession,
    needsSetup:needsSetup,openSetup:openSetup,canManageDevicePassword:canManageDevicePassword,setDevicePassword:setDevicePassword,resetDevicePassword:resetDevicePassword,getCalendarText:getCalendarText,getLanguage:language,getContextText:getContextText,getAccessLabel:getAccessLabel,getHelpText:getHelpText,refresh:refreshProvider,
    snapshot:function () { return {version:'r1080',mode:provider()?'provider':'device',unlocked:isUnlocked(),configured:!needsSetup(),pending:!!pending}; }});
  if (window.addEventListener) window.addEventListener('pageshow', refreshProvider);
  if (document.addEventListener) document.addEventListener('visibilitychange', function () { if (!document.hidden) void refreshProvider(); });
  if (typeof setInterval === 'function') setInterval(function () { if (!document.hidden) void refreshProvider(); }, 1000);
  void refreshProvider();
})();
