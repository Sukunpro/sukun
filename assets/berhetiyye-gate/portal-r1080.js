/* SÜKÛN — Berhetiyye gate, r1080.
 * Adapter contract (no credentials or entitlements are stored by this module):
 *   verify(password, {signal}) => Promise<{ok:boolean, error?:string}>
 *     Must honour signal and perform real authentication. A transport failure
 *     must reject or return {ok:false,error:'network'|'unavailable'}.
 *   isUnlocked() => boolean       Current door-session access, not membership.
 *   sessionOpened({signal})       Optional. Commit an authenticated door session;
 *                                 must honour signal before committing.
 *   enter({signal})               Open the real Berhetiyye application section.
 *   endSession()                 Revoke only the door session; keep membership.
 *   getLanguage() => 'tr'|'en'    Optional locale override.
 *   getContextText() => string   Optional current playback description.
 *   getAccessLabel() => string   Optional label (e.g. existing device PIN).
 *   getHelpText() => string      Optional concise access-mode explanation.
 * configure({invitationAudioURL}) may supply a local recorded invitation;
 * this avoids sharing the application's speech-synthesis queue.
 * Events: sukun:berhet-gate-state (detail contains no credential or token).
 */
(function () {
  'use strict';
  if (window.SukunBerhetGate) return;

  var scriptURL = document.currentScript && document.currentScript.src;
  var assetBase = new URL('./', scriptURL || new URL('assets/berhetiyye-gate/', document.baseURI)).href;
  var assets = {};
  ['portal', 'dormant', 'guardian', 'welcome', 'lockwheel', 'palace'].forEach(function (name) {
    assets[name] = new URL(name + '.webp', assetBase).href;
  });
  var adapter = null, host = null, returnFocus = null, fallbackInert = [];
  var epoch = 0, stageTimer = null, countdownTimer = null, verifyTimer = null;
  var aborter = null, historyToken = null, pendingHistoryBack = false, queuedOpenOptions = null;
  var locallyLocked = false;
  var soundPending = false, audioEpoch = 0, lastSoundKey = '', audio = null;
  var invitationAudioURL = '', invitationAudio = null;
  var settings = readSettings();
  var audioStatus = {enabled:false, ready:false, volume:settings.volume, available:false, blocked:false};
  var state = {
    open:false, phase:'closed', authenticated:false, dormant:false, reason:'',
    deadline:0, remaining:45, sealedUntil:0, exitAfterSeal:false,
    error:'', entering:false, revoking:false, fullAnimation:true
  };
  var TEXT = {
    tr: {
      back:'‹ Zikre dön', private:'BERHETİYYE · ÖZEL GİRİŞ', courtyard:'TAŞ AVLU', threshold:'SARAYIN EŞİĞİ', quiet:'SESSİZ BİR EŞİK',
      closed:'Yeşil Kapı', knocking:'Bir davet uyanıyor', challenge:'Nurdan muhafız', verifying:'Geçiş doğrulanıyor', unlocking:'Mühür çözülüyor', opening:'Kapı aralanıyor', ready:'Saray seni bekliyor', closing:'Kapı kapanıyor', locking:'Kapı mühürleniyor', sealing:'Davet sessizliğe çekiliyor', sealed:'Eski Kapı',
      lineClosed:'Bazı kapılar yalnızca çalınmayı bekler.', lineKnocking:'Taş avluda iki tokmak sesi…', lineChallenge:'“Hoş geldin. Geçiş şifreni yazar mısın?”', lineVerifying:'Şifren doğrulanırken davetin süresi korunuyor.', lineUnlocking:'Çarklar dönüyor, sürgüler geri çekiliyor.', lineOpening:'Eşikten bir ışık süzülüyor.', lineReady:'“Gel, gel… Sarayın kapısı sana açık.”', lineClosing:'Sarayın kapısı kapanıyor, geçişin kilitleniyor.', lineLocking:'Sürgüler yerine oturuyor.', lineTimeout:'Davetin süresi doldu. Mühür kapanıyor.', lineWrong:'Şifre eşleşmedi. Mühür kapanıyor.', lineSealing:'Işıklar sönüyor, izler kayboluyor.', lineSealed:'Avluda yalnızca eski bir kapı var.',
      password:'Geçiş şifresi', passwordPlaceholder:'Geçiş şifreni gir', show:'Göster', hide:'Gizle', showLabel:'Şifreyi göster', hideLabel:'Şifreyi gizle', missing:'Geçiş şifreni yaz.', verify:'Geçişi aç', checking:'Doğrulanıyor…', time:'Davetin açık kalma süresi', seconds:'sn', extend:'Süreyi uzat · +45 sn', extended:'Davetin süresi 45 saniye uzatıldı.',
      knock:'Kapıyı çal', knockingButton:'Kapı çalınıyor…', reknock:'Kapıyı yeniden çal', wait:'Avlu sessiz…', verified:'GEÇİŞ DOĞRULANDI', enter:'Saraya gir', entering:'Saray hazırlanıyor…', lockExit:'Kapıyı kilitle ve çık', replay:'Davet sahnesini yeniden göster', skip:'Animasyonu geç', voice:'Türkçe daveti dinle', speech:'Gel, gel. Hoş geldin. Sarayın kapısı sana açık.', voiceUnavailable:'Sesli davet bu tarayıcıda kullanılamıyor.', voiceBusy:'Sesli okuma şu anda meşgul.',
      advice:'Bu kapı sana henüz açılmadı. Acele etme; niyetini tazele, sabırla yeniden çal.', adviceLabel:'Muhafızın sözü', mismatch:'Şifre eşleşmedi.', network:'Geçiş doğrulanamadı. Bağlantını kontrol edip yeniden dene; bu bir şifre hatası değil.', unavailable:'Geçiş doğrulama hizmeti şu anda kullanılamıyor. Daha sonra yeniden dene.', enterError:'Saray bölümü açılamadı. Geçişin korunuyor; yeniden deneyebilirsin.', sessionError:'Bu ekrandaki geçiş kilitlendi. Oturumu kapatma işlemi doğrulanamadı; bağlantını kontrol et.',
      fxOn:'Efektleri aç', fxOff:'Efektleri kapat', fxPending:'Ses açılıyor…', volume:'Ses düzeyi', fxUnavailable:'Ses efektleri bu tarayıcıda kullanılamıyor.', fxBlocked:'Sesi başlatmak için yeniden dokun.', fxActive:'Ney tınısı · ahşap · mekanizma · yankı', fxInactive:'Kapı sesleri · dokunarak aç.',
      doorAlt:'Altın işlemeli yeşil İstanbul kapısı; bekçiler, asa ayrıntıları ve büyük taşlı kilit çarkı', oldAlt:'Unutulmuş eski ahşap kapı; sönük taşlar, boş bekçi nişleri', guardianAlt:'Yüzü nurla örtülü sembolik melek muhafız', welcomeAlt:'Avucunu açarak içeri davet eden sembolik melek muhafız'
    },
    en: {
      back:'‹ Back to dhikr', private:'BERHETIYYE · PRIVATE ENTRY', courtyard:'STONE COURTYARD', threshold:'THE PALACE THRESHOLD', quiet:'A QUIET THRESHOLD',
      closed:'The Green Door', knocking:'An invitation awakens', challenge:'Guardian of light', verifying:'Verifying access', unlocking:'The seal releases', opening:'The door opens', ready:'The palace awaits', closing:'The door closes', locking:'The door is sealed', sealing:'The invitation fades into silence', sealed:'The Old Door',
      lineClosed:'Some doors await a gentle knock.', lineKnocking:'Two knocks in the stone courtyard…', lineChallenge:'“Welcome. Will you enter your access password?”', lineVerifying:'Your invitation time is paused while access is verified.', lineUnlocking:'The wheels turn and the bolts withdraw.', lineOpening:'A beam of light crosses the threshold.', lineReady:'“Come, come… The palace door is open to you.”', lineClosing:'The palace door closes and your entry is locked.', lineLocking:'The bolts settle into place.', lineTimeout:'The invitation has expired. The seal closes.', lineWrong:'The password did not match. The seal closes.', lineSealing:'The lights dim and the traces fade.', lineSealed:'Only an old door remains in the courtyard.',
      password:'Access password', passwordPlaceholder:'Enter your access password', show:'Show', hide:'Hide', showLabel:'Show password', hideLabel:'Hide password', missing:'Enter your access password.', verify:'Unlock entry', checking:'Verifying…', time:'Invitation time remaining', seconds:'sec', extend:'Extend time · +45 sec', extended:'The invitation was extended by 45 seconds.',
      knock:'Knock on the door', knockingButton:'Knocking…', reknock:'Knock again', wait:'The courtyard is quiet…', verified:'ACCESS VERIFIED', enter:'Enter the palace', entering:'Preparing the palace…', lockExit:'Lock the door and leave', replay:'Replay the invitation', skip:'Skip animation', voice:'Hear the Turkish invitation', speech:'Come, come. Welcome. The palace door is open to you.', voiceUnavailable:'The spoken invitation is unavailable in this browser.', voiceBusy:'Another spoken reading is currently playing.',
      advice:'This door has not opened to you yet. Do not rush; renew your intention, and knock again with patience.', adviceLabel:'The guardian’s words', mismatch:'The password did not match.', network:'Access could not be verified. Check your connection and try again; this is not a password error.', unavailable:'The access verification service is currently unavailable. Please try again later.', enterError:'The palace section could not be opened. Your access is preserved; you can try again.', sessionError:'Entry is locked on this screen. Session closure could not be confirmed; check your connection.',
      fxOn:'Enable effects', fxOff:'Mute effects', fxPending:'Starting audio…', volume:'Volume', fxUnavailable:'Audio effects are unavailable in this browser.', fxBlocked:'Tap again to start audio.', fxActive:'Ney-like tones · wood · mechanism · echo', fxInactive:'Door sounds · tap to enable.',
      doorAlt:'An ornate green Istanbul gate with guards, staff details and a large jewelled locking wheel', oldAlt:'A forgotten wooden gate with dull stones and empty guardian niches', guardianAlt:'A symbolic angel guardian with a face veiled in light', welcomeAlt:'A symbolic angel guardian welcoming you with an open palm'
    }
  };

  function language() {
    var value = '';
    try { value = adapter && adapter.getLanguage ? adapter.getLanguage() : ''; } catch (_) {}
    if (!value) value = document.documentElement.lang || 'tr';
    return String(value).toLowerCase().indexOf('en') === 0 ? 'en' : 'tr';
  }
  function t(key) { return TEXT[language()][key] || key; }
  function escapeHTML(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function q(selector) { return host && host.querySelector(selector); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function readSettings() {
    var value = {volume:.35, seen:false};
    try {
      var saved = JSON.parse(localStorage.getItem('sukun.berhetGate.presentation.v1') || '{}');
      if (Number.isFinite(saved.volume)) value.volume = Math.max(0, Math.min(1, saved.volume));
      value.seen = saved.seen === true;
    } catch (_) {}
    return value;
  }
  function saveSettings() {
    try { localStorage.setItem('sukun.berhetGate.presentation.v1', JSON.stringify({volume:settings.volume, seen:settings.seen})); } catch (_) {}
  }
  function usableGrant() {
    if (locallyLocked) return false;
    try { return !!(adapter && typeof adapter.isUnlocked === 'function' && adapter.isUnlocked()); } catch (_) { return false; }
  }
  function emitState() {
    try { document.dispatchEvent(new CustomEvent('sukun:berhet-gate-state', {detail:snapshot()})); } catch (_) {}
  }
  function snapshot() {
    return {open:state.open, phase:state.phase, authenticated:state.authenticated, dormant:state.dormant,
      reason:state.reason, remaining:state.remaining, sealedUntil:state.sealedUntil, entering:state.entering, revoking:state.revoking,
      audio:audio && audio.snapshot ? audio.snapshot() : {available:false, enabled:false},
      invitation:{available:!!invitationAudioURL, playing:!!(invitationAudio && !invitationAudio.paused), volume:invitationAudio ? invitationAudio.volume : settings.volume}};
  }
  function clearTimers() {
    clearTimeout(stageTimer); clearTimeout(verifyTimer); clearInterval(countdownTimer);
    stageTimer = verifyTimer = countdownTimer = null;
  }
  function cancelPending() {
    epoch++; audioEpoch++; clearTimers();
    if (aborter) { aborter.abort(); aborter = null; }
    if (audio) audio.stop({immediate:true});
    if (invitationAudio) { invitationAudio.pause(); invitationAudio.currentTime = 0; invitationAudio = null; }
  }
  function later(milliseconds, callback) {
    var intent = epoch;
    stageTimer = setTimeout(function () {
      stageTimer = null;
      if (state.open && intent === epoch) callback();
    }, reduced() ? 0 : milliseconds);
  }
  function ensureHost() {
    if (host) return;
    host = document.createElement('dialog');
    host.id = 'sukunBerhetGate'; host.setAttribute('aria-labelledby', 'sbgGateTitle');
    host.setAttribute('aria-modal', 'true');
    ['portal','dormant','palace'].forEach(function (name) { host.style.setProperty('--sbg-' + name, 'url("' + assets[name] + '")'); });
    document.body.appendChild(host);
    host.addEventListener('click', click);
    host.addEventListener('submit', function (event) { if (event.target.id === 'sbgPasswordForm') { event.preventDefault(); verify(); } });
    host.addEventListener('input', input);
    host.addEventListener('keydown', keydown);
    host.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
    host.addEventListener('close', function () { if (state.open && !host.open) close(); });
    try {
      if (typeof window.createSukunPortalAudio === 'function') {
        audio = window.createSukunPortalAudio({onStatus:function (status) { audioStatus = status; updateAudioControls(); }});
        audio.setVolume(settings.volume);
      }
    } catch (_) { audio = null; }
  }
  function soundText() {
    return !audioStatus.available ? t('fxUnavailable') : audioStatus.blocked ? t('fxBlocked') : audioStatus.enabled ? t('fxActive') : t('fxInactive');
  }
  function soundMarkup() {
    return '<div class="sbg-sound-strip"><button id="sbgAudioToggle" type="button" class="sbg-sound-toggle" data-act="audio" aria-pressed="' + !!audioStatus.enabled + '" ' + (!audioStatus.available || soundPending ? 'disabled' : '') + '>' + escapeHTML(soundPending ? t('fxPending') : audioStatus.enabled ? t('fxOff') : t('fxOn')) + '</button><div class="sbg-volume"><label for="sbgAudioLevel"><span>' + t('volume') + '</span><span id="sbgAudioValue">' + Math.round(audioStatus.volume * 100) + '%</span></label><input id="sbgAudioLevel" type="range" min="0" max="100" step="5" value="' + Math.round(audioStatus.volume * 100) + '" ' + (!audioStatus.available ? 'disabled' : '') + '></div><p class="sbg-sound-status" id="sbgAudioStatus" role="status" aria-live="polite">' + soundText() + '</p></div>';
  }
  function updateAudioControls() {
    var button = q('#sbgAudioToggle'), range = q('#sbgAudioLevel'), value = q('#sbgAudioValue'), status = q('#sbgAudioStatus');
    if (button) {
      button.disabled = !audioStatus.available || soundPending;
      button.setAttribute('aria-pressed', String(!!audioStatus.enabled));
      button.textContent = soundPending ? t('fxPending') : audioStatus.enabled ? t('fxOff') : t('fxOn');
    }
    if (range) range.value = String(Math.round(audioStatus.volume * 100));
    if (value) value.textContent = Math.round(audioStatus.volume * 100) + '%';
    if (status && status.textContent !== soundText()) status.textContent = soundText();
  }
  function cue() {
    if (!state.open) return '';
    if (state.reason === 'wrong' && state.phase === 'locking') return 'rejected';
    if (state.reason === 'wrong' && state.phase === 'sealed') return 'sadness';
    return {knocking:'knock', challenge:'challenge', unlocking:'unlocking', opening:'opening', ready:'welcome', closing:'closing', locking:'locking', sealing:'sealing'}[state.phase] || '';
  }
  function syncAudio() {
    var key = state.phase + ':' + state.reason;
    if (key === lastSoundKey) return;
    lastSoundKey = key;
    if (!audio) return;
    audio.stop();
    if (!document.hidden && cue()) audio.play(cue());
  }
  async function toggleAudio() {
    if (!audio || soundPending) return;
    if (audioStatus.enabled) {
      audio.setEnabled(false);
      if (invitationAudio) { invitationAudio.pause(); invitationAudio.currentTime = 0; invitationAudio = null; }
      return;
    }
    var intent = ++audioEpoch;
    soundPending = true; updateAudioControls();
    try {
      var enabled = await audio.enableFromGesture();
      if (intent !== audioEpoch || !state.open || document.hidden) { audio.stop({immediate:true}); return; }
      if (enabled) audio.play(cue() || 'preview');
    } catch (_) { audio.setEnabled(false); }
    finally { soundPending = false; updateAudioControls(); }
  }
  function mechanism() {
    return '<div class="sbg-xray" aria-hidden="true"><i class="sbg-gear sbg-gear-a"></i><i class="sbg-gear sbg-gear-b"></i><i class="sbg-gear sbg-gear-c"></i><i class="sbg-gear sbg-gear-d"></i><i class="sbg-gear sbg-gear-e"></i><i class="sbg-gear sbg-gear-f"></i><i class="sbg-rail sbg-rail-top"></i><i class="sbg-rail sbg-rail-bottom"></i><i class="sbg-bolt sbg-bolt-l"></i><i class="sbg-bolt sbg-bolt-r"></i><i class="sbg-bolt sbg-bolt-l2"></i><i class="sbg-bolt sbg-bolt-r2"></i></div><div class="sbg-lock-mount" aria-hidden="true"></div><div class="sbg-lock-wheel" aria-hidden="true"><img src="' + assets.lockwheel + '" alt=""><span class="sbg-lock-core"></span></div>';
  }
  function welcomeMarkup() {
    return '<div class="sbg-welcome-figure" role="img" aria-label="' + t('welcomeAlt') + '"><img class="sbg-welcome-base" src="' + assets.welcome + '" alt=""><img class="sbg-welcome-hand" src="' + assets.welcome + '" alt="" aria-hidden="true"></div>';
  }
  function phaseLine() {
    var key = 'line' + state.phase.charAt(0).toUpperCase() + state.phase.slice(1);
    if (state.phase === 'locking') key = state.reason === 'timeout' ? 'lineTimeout' : state.reason === 'wrong' ? 'lineWrong' : 'lineLocking';
    return t(key);
  }
  function formMarkup() {
    var label = t('password'), help = '';
    try { if (adapter && adapter.getAccessLabel) label = adapter.getAccessLabel() || label; if (adapter && adapter.getHelpText) help = adapter.getHelpText() || ''; } catch (_) {}
    return '<form id="sbgPasswordForm" class="sbg-form" novalidate><div class="sbg-time"><span>' + t('time') + '</span><time id="sbgCountdown" role="timer" aria-live="off">' + state.remaining + ' ' + t('seconds') + '</time></div><button type="button" data-act="extend" class="sbg-extend">' + t('extend') + '</button><label for="sbgPassword" style="margin-top:14px">' + escapeHTML(label) + '</label><div class="sbg-pw-wrap"><input id="sbgPassword" name="berhet-password" type="password" placeholder="' + t('passwordPlaceholder') + '" autocomplete="current-password" autocapitalize="none" spellcheck="false" aria-describedby="sbgPasswordError"><button type="button" class="sbg-show" data-act="show" aria-pressed="false" aria-label="' + t('showLabel') + '">' + t('show') + '</button></div><div class="sbg-error" id="sbgPasswordError" role="alert">' + escapeHTML(state.error) + '</div><button type="submit" class="sbg-button sbg-primary">' + t('verify') + '</button>' + (help ? '<p class="sbg-form-note">' + escapeHTML(help) + '</p>' : '') + '<p id="sbgExtended" class="sbg-form-note" role="status"></p></form>';
  }
  function markup() {
    var phase = state.phase, challenge = phase === 'challenge', ready = phase === 'ready', sealed = phase === 'sealed';
    var running = ['unlocking','opening','closing','locking','sealing'].indexOf(phase) >= 0;
    var panel = '';
    if (challenge) panel = formMarkup();
    else if (phase === 'verifying') panel = '<div class="sbg-stage-status" role="status" aria-live="polite">' + t('checking') + '</div>';
    else if (ready) {
      panel = (state.error ? '<p class="sbg-network" role="alert">' + escapeHTML(state.error) + '</p>' : '') + '<span class="sbg-lock-label">' + t('verified') + '</span><div class="sbg-actions"><button id="sbgEnter" type="button" class="sbg-button sbg-primary" data-act="enter" ' + (state.entering ? 'disabled' : '') + '>' + t(state.entering ? 'entering' : 'enter') + '</button><button type="button" class="sbg-button sbg-lock-exit" data-act="lock-exit">' + t('lockExit') + '</button></div><button type="button" class="sbg-skip" data-act="replay">' + t('replay') + '</button>' + (invitationAudioURL ? '<button type="button" class="sbg-voice" data-act="voice">' + t('voice') + '</button>' : '');
    } else if (running) {
      panel = '<div class="sbg-stage-status" role="status" aria-live="polite">' + escapeHTML(phase === 'locking' && state.reason === 'wrong' ? '“' + t('advice') + '”' : phaseLine()) + '</div>';
      if (state.authenticated && ['unlocking','opening'].indexOf(phase) >= 0) panel += '<button type="button" class="sbg-skip" data-act="skip">' + t('skip') + '</button>';
    } else if (sealed) {
      panel = (state.error ? '<p class="sbg-network" role="alert">' + escapeHTML(state.error) + '</p>' : '') + (state.reason === 'wrong' ? '<div class="sbg-advice" role="note" aria-label="' + t('adviceLabel') + '"><small>' + t('adviceLabel') + '</small><p>“' + t('advice') + '”</p><span>' + t('mismatch') + '</span></div>' : '') + '<button id="sbgKnock" type="button" class="sbg-button" data-act="knock" ' + (Date.now() < state.sealedUntil ? 'disabled' : '') + '>' + t(Date.now() < state.sealedUntil ? 'wait' : 'reknock') + '</button>';
    } else {
      panel = '<button id="sbgKnock" type="button" class="sbg-button sbg-primary" data-act="knock" ' + (phase === 'knocking' ? 'disabled' : '') + ' aria-busy="' + (phase === 'knocking') + '">' + t(phase === 'knocking' ? 'knockingButton' : 'knock') + '</button>';
    }
    var context = '';
    try { context = adapter && adapter.getContextText ? adapter.getContextText() : ''; } catch (_) {}
    return '<section class="sbg-gate" data-phase="' + phase + '" data-reason="' + state.reason + '"><div class="sbg-gate-top"><button type="button" class="sbg-back" data-act="close">' + t('back') + '</button><span>' + t(sealed ? 'courtyard' : 'private') + '</span></div>' + soundMarkup() + '<div class="sbg-title"><small>' + t(sealed ? 'quiet' : 'threshold') + '</small><h2 id="sbgGateTitle">' + t(phase) + '</h2><p>' + phaseLine() + '</p></div><div class="sbg-scene"><img class="sbg-door-art" src="' + assets.portal + '" alt="' + t(sealed ? 'oldAlt' : 'doorAlt') + '"><div class="sbg-door-window" aria-hidden="true"><div class="sbg-door-leaf sbg-door-left"></div><div class="sbg-door-leaf sbg-door-right"></div></div><div class="sbg-light" aria-hidden="true"></div>' + mechanism() + (ready ? welcomeMarkup() : challenge || phase === 'verifying' ? '<img class="sbg-guardian" src="' + assets.guardian + '" alt="' + t('guardianAlt') + '">' : '') + (phase === 'sealing' || sealed ? '<img class="sbg-dormant-art" src="' + assets.dormant + '" alt="" aria-hidden="true">' : '') + (phase === 'knocking' ? '<span class="sbg-knock-ripple" aria-hidden="true"></span><span class="sbg-knock-ripple" aria-hidden="true"></span>' : '') + '</div><div class="sbg-gate-panel">' + panel + (context ? '<small class="sbg-context">' + escapeHTML(context) + '</small>' : '') + '</div></section>';
  }
  function render(focusSelector) {
    if (!host || !state.open) return;
    host.lang = language(); host.innerHTML = markup();
    updateAudioControls(); syncAudio(); emitState();
    if (focusSelector) {
      var intent = epoch;
      requestAnimationFrame(function () {
        if (intent !== epoch || !state.open) return;
        var element = q(focusSelector);
        if (element) { element.focus({preventScroll:true}); element.scrollIntoView({block:'nearest', behavior:'auto'}); }
      });
    }
  }
  function showDialog() {
    if (typeof host.showModal === 'function') {
      try { host.showModal(); return; } catch (_) {}
    }
    host.classList.add('sbg-fallback'); host.setAttribute('open', ''); host.setAttribute('role', 'dialog');
    fallbackInert = [];
    Array.prototype.forEach.call(document.body.children, function (element) {
      if (element === host || /^(SCRIPT|STYLE|LINK)$/.test(element.tagName)) return;
      fallbackInert.push({element:element, inert:element.inert, aria:element.getAttribute('aria-hidden')});
      element.inert = true; element.setAttribute('aria-hidden', 'true');
    });
  }
  function pushHistory() {
    try {
      historyToken = 'berhet-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      var current = history.state;
      var next = current && typeof current === 'object' && !Array.isArray(current) ? Object.assign({}, current) : {sukunPreviousState:current};
      next.sukunBerhetGate = historyToken; history.pushState(next, '', location.href);
    } catch (_) { historyToken = null; }
  }
  function open(options) {
    options = options || {};
    if (pendingHistoryBack) { queuedOpenOptions = options; return; }
    if (state.open) { q('[data-act="close"]').focus(); return; }
    ensureHost(); cancelPending();
    returnFocus = options.trigger && options.trigger.isConnected ? options.trigger : document.activeElement;
    state.open = true; state.error = ''; state.entering = false; state.revoking = false; state.reason = ''; state.exitAfterSeal = false;
    state.authenticated = usableGrant(); state.deadline = 0;
    state.fullAnimation = options.fullAnimation === true || !settings.seen;
    state.phase = state.authenticated ? 'opening' : state.dormant ? 'sealed' : 'closed';
    render(); showDialog(); pushHistory();
    if (state.authenticated) startUnlock(state.fullAnimation);
    else { render(state.phase === 'sealed' && Date.now() < state.sealedUntil ? '[data-act="close"]' : '#sbgKnock'); if (state.phase === 'sealed') cooldown(); }
  }
  function close(options) {
    options = options || {};
    if (!state.open) return;
    cancelPending(); state.open = false; state.deadline = 0; state.entering = false; state.revoking = false; state.phase = 'closed';
    if (audio) audio.setEnabled(false);
    if (host.open && typeof host.close === 'function') { try { host.close(); } catch (_) { host.removeAttribute('open'); } }
    else host.removeAttribute('open');
    fallbackInert.forEach(function (item) {
      item.element.inert = item.inert;
      if (item.aria === null) item.element.removeAttribute('aria-hidden'); else item.element.setAttribute('aria-hidden', item.aria);
    });
    fallbackInert = [];
    if (!options.fromHistory && historyToken && history.state && history.state.sukunBerhetGate === historyToken) {
      pendingHistoryBack = true; history.back();
    }
    historyToken = null;
    var focus = returnFocus; returnFocus = null;
    requestAnimationFrame(function () { if (!state.open && focus && focus.isConnected && typeof focus.focus === 'function') focus.focus({preventScroll:true}); });
    emitState();
  }
  function cooldown() {
    clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      if (!state.open || state.phase !== 'sealed') { clearInterval(countdownTimer); countdownTimer = null; return; }
      if (Date.now() >= state.sealedUntil) {
        clearInterval(countdownTimer); countdownTimer = null;
        var button = q('#sbgKnock'); if (button) { button.disabled = false; button.textContent = t('reknock'); }
      }
    }, 250);
  }
  function finishSeal(reason, exitAfter) {
    cancelPending(); state.authenticated = false; state.revoking = false; state.reason = reason; state.deadline = 0;
    if (reason !== 'manual') state.error = '';
    state.dormant = true; state.exitAfterSeal = exitAfter; state.phase = 'locking';
    render('[data-act="close"]');
    later(1800, function () {
      state.phase = 'sealing'; render('[data-act="close"]');
      later(1600, function () {
        if (exitAfter) { state.sealedUntil = 0; close(); return; }
        state.phase = 'sealed'; state.sealedUntil = Date.now() + 8000;
        render('[data-act="close"]'); cooldown();
      });
    });
  }
  function seal(reason) { if (state.open && state.phase === 'challenge') finishSeal(reason, false); }
  async function lockAndExit() {
    if (!state.open || !state.authenticated || state.entering || state.revoking) return false;
    cancelPending();
    var intent = epoch, controller = new AbortController();
    aborter = controller;
    // Deny this screen's old grant immediately, even if revocation fails later.
    // The adapter must also clear its own local grant before awaiting a server.
    locallyLocked = true; state.authenticated = false; state.revoking = true;
    state.dormant = true; state.deadline = 0; state.sealedUntil = 0;
    state.reason = 'manual'; state.exitAfterSeal = true; state.phase = 'closing';
    render('[data-act="close"]');
    verifyTimer = setTimeout(function () { controller.abort(); }, 15000);
    try {
      if (!adapter || typeof adapter.endSession !== 'function') throw new Error('No endSession adapter');
      await abortable(adapter.endSession({signal:controller.signal}), controller.signal);
      if (!state.open || intent !== epoch || controller.signal.aborted) return false;
      clearTimeout(verifyTimer); verifyTimer = null; aborter = null; state.revoking = false;
      later(1100, function () { finishSeal('manual', true); });
      return true;
    } catch (_) {
      if (state.open && intent === epoch) {
        state.revoking = false; state.error = t('sessionError');
        finishSeal('manual', false);
      }
      return false;
    } finally {
      if (intent === epoch) { clearTimeout(verifyTimer); verifyTimer = null; if (aborter === controller) aborter = null; }
    }
  }
  function checkDeadline() {
    if (!state.open || state.phase !== 'challenge') return;
    state.remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    var element = q('#sbgCountdown'); if (element) element.textContent = state.remaining + ' ' + t('seconds');
    if (state.remaining === 0) seal('timeout');
  }
  function challenge(errorMessage, seconds) {
    state.phase = 'challenge'; state.error = errorMessage || ''; state.remaining = Math.max(1, seconds || 45);
    state.deadline = Date.now() + state.remaining * 1000;
    render('#sbgPassword'); clearInterval(countdownTimer); countdownTimer = setInterval(checkDeadline, 250);
  }
  function ready() {
    if (!state.open || !state.authenticated || locallyLocked) return;
    clearTimeout(stageTimer); stageTimer = null;
    state.phase = 'ready'; state.dormant = false; state.error = ''; settings.seen = true; saveSettings(); render('#sbgEnter');
  }
  function startUnlock(full) {
    cancelPending(); state.deadline = 0; state.reason = ''; state.error = '';
    state.phase = full ? 'unlocking' : 'opening'; render('[data-act="close"]');
    if (!full) { later(450, ready); return; }
    later(3200, function () { state.phase = 'opening'; render('[data-act="close"]'); later(1600, ready); });
  }
  async function verify() {
    if (!state.open || state.phase !== 'challenge') return;
    if (Date.now() >= state.deadline) { seal('timeout'); return; }
    var field = q('#sbgPassword'), password = field ? field.value : '';
    if (!password.trim()) { state.error = t('missing'); var error = q('#sbgPasswordError'); if (error) error.textContent = state.error; if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); } return; }
    var seconds = Math.max(1, Math.ceil((state.deadline - Date.now()) / 1000));
    cancelPending(); aborter = new AbortController();
    var controller = aborter, intent = epoch, timedOut = false;
    state.phase = 'verifying'; state.remaining = seconds; state.error = ''; render('[data-act="close"]');
    verifyTimer = setTimeout(function () { timedOut = true; controller.abort(); }, 15000);
    try {
      if (!adapter || typeof adapter.verify !== 'function') { var absent = new Error('Unavailable'); absent.code = 'unavailable'; throw absent; }
      var result = await abortable(adapter.verify(password, {signal:controller.signal}), controller.signal);
      password = '';
      if (!state.open || intent !== epoch || controller.signal.aborted) {
        if (timedOut && state.open && intent === epoch) challenge(t('network'), Math.max(15, seconds));
        return;
      }
      if (!result || result.ok !== true) {
        if (result && result.error) challenge(result.message || t(result.error === 'unavailable' ? 'unavailable' : 'network'), Math.max(15, seconds));
        else finishSeal('wrong', false);
        return;
      }
      if (typeof adapter.sessionOpened === 'function') await abortable(adapter.sessionOpened({signal:controller.signal}), controller.signal);
      if (!state.open || intent !== epoch || controller.signal.aborted) return;
      locallyLocked = false; state.authenticated = true; aborter = null;
      startUnlock(!settings.seen || state.fullAnimation);
    } catch (error) {
      password = '';
      if (state.open && intent === epoch && (!controller.signal.aborted || timedOut)) challenge(t(error && error.code === 'unavailable' ? 'unavailable' : 'network'), Math.max(15, seconds));
    } finally { if (intent === epoch) { clearTimeout(verifyTimer); verifyTimer = null; if (aborter === controller) aborter = null; } }
  }
  async function enter() {
    if (!state.open || state.phase !== 'ready' || !state.authenticated || state.entering) return;
    cancelPending(); aborter = new AbortController();
    var controller = aborter, intent = epoch;
    state.entering = true; state.error = ''; render('[data-act="close"]');
    try {
      if (!adapter || typeof adapter.enter !== 'function') throw new Error('No enter adapter');
      await abortable(adapter.enter({signal:controller.signal}), controller.signal);
      if (!state.open || controller.signal.aborted || intent !== epoch) return;
      state.entering = false; aborter = null; close();
    } catch (_) {
      if (state.open && !controller.signal.aborted && intent === epoch) { state.entering = false; state.error = t('enterError'); aborter = null; render('#sbgEnter'); }
    }
  }
  function invite(button) {
    if (!invitationAudioURL) return;
    if (invitationAudio) { invitationAudio.pause(); invitationAudio.currentTime = 0; }
    try {
      invitationAudio = new Audio(invitationAudioURL);
      invitationAudio.volume = settings.volume;
      var source = invitationAudio, intent = epoch;
      var playback = source.play();
      if (playback && playback.catch) playback.catch(function () {
        if (state.open && intent === epoch && button.isConnected) button.textContent = t('voiceUnavailable');
      });
    } catch (_) { button.textContent = t('voiceUnavailable'); }
  }
  function abortable(promise, signal) {
    return new Promise(function (resolve, reject) {
      function aborted() { var error = new Error('Aborted'); error.name = 'AbortError'; reject(error); }
      if (signal.aborted) { aborted(); return; }
      signal.addEventListener('abort', aborted, {once:true});
      Promise.resolve(promise).then(function (value) { signal.removeEventListener('abort', aborted); resolve(value); }, function (error) { signal.removeEventListener('abort', aborted); reject(error); });
    });
  }
  function click(event) {
    var button = event.target.closest('button[data-act]'); if (!button || !host.contains(button) || button.disabled) return;
    var action = button.dataset.act;
    if (action === 'close') close();
    else if (action === 'audio') toggleAudio();
    else if (action === 'lock-exit') lockAndExit();
    else if (action === 'enter') enter();
    else if (action === 'voice' && state.authenticated) invite(button);
    else if (action === 'skip' && state.authenticated) { cancelPending(); ready(); }
    else if (action === 'replay' && state.authenticated) startUnlock(true);
    else if (action === 'knock' && (state.phase === 'closed' || state.phase === 'sealed' && Date.now() >= state.sealedUntil)) {
      cancelPending(); state.dormant = false; state.reason = ''; state.phase = 'knocking'; render('[data-act="close"]'); later(820, function () { challenge(); });
    } else if (action === 'extend' && state.phase === 'challenge') {
      state.deadline += 45000; checkDeadline(); var note = q('#sbgExtended'); if (note) note.textContent = t('extended');
    } else if (action === 'show') {
      var field = q('#sbgPassword'); if (!field) return;
      var visible = field.type === 'password'; field.type = visible ? 'text' : 'password';
      button.textContent = t(visible ? 'hide' : 'show'); button.setAttribute('aria-pressed', String(visible)); button.setAttribute('aria-label', t(visible ? 'hideLabel' : 'showLabel'));
    }
  }
  function input(event) {
    if (event.target.id === 'sbgAudioLevel') {
      settings.volume = Number(event.target.value) / 100; if (audio) audio.setVolume(settings.volume); if (invitationAudio) invitationAudio.volume = settings.volume; saveSettings();
    } else if (event.target.id === 'sbgPassword') {
      state.error = ''; event.target.removeAttribute('aria-invalid'); var error = q('#sbgPasswordError'); if (error) error.textContent = '';
    }
  }
  function keydown(event) {
    if (!state.open) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key !== 'Tab') return;
    var nodes = Array.prototype.filter.call(host.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]'), function (node) { return node.getClientRects().length; });
    var first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); if (last) last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); if (first) first.focus(); }
  }
  window.addEventListener('popstate', function () {
    if (pendingHistoryBack) {
      pendingHistoryBack = false;
      var queued = queuedOpenOptions; queuedOpenOptions = null;
      if (queued) setTimeout(function () { open(queued); }, 0);
      return;
    }
    if (state.open) close({fromHistory:true});
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { audioEpoch++; if (audio) audio.stop({immediate:true}); if (invitationAudio) { invitationAudio.pause(); invitationAudio.currentTime = 0; } }
    else checkDeadline();
  });
  window.addEventListener('pagehide', function () { if (state.open) close({fromHistory:true}); else if (audio) audio.stop({immediate:true}); });
  window.SukunBerhetGate = {
    configure:function (options) { if (options && options.adapter) adapter = options.adapter; if (options && typeof options.invitationAudioURL === 'string') invitationAudioURL = options.invitationAudioURL; return this; },
    open:open, close:close, lockAndExit:lockAndExit, snapshot:snapshot
  };
})();
