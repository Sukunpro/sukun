/* Read-only player view of the most recent observed stop. */
(() => {
  'use strict';
  const buttonId = 'r1263StopReasonButton';
  const notificationId = 'r1263StopReasonNotifications';
  const dialogId = 'r1263StopReasonDialog';
  const byId = id => document.getElementById(id);
  const localized = pair => pair[window.I18N?.lang === 'en' ? 1 : 0];
  let opener = null;
  let dockObserver = null;
  const title = ['Ses neden durdu?', 'Why did the sound stop?'];
  const empty = ['Henüz bir ses durması kaydedilmedi.', 'No playback stop has been recorded yet.'];
  const reasons = {
    'sleep-timer': ['Uyku zamanlayıcısının süresi doldu.', 'The sleep timer expired.'],
    'user-paused': ['Oynatıcı duraklatma komutunu uyguladı.', 'The player applied a pause command.'],
    'user-stopped': ['Oynatıcı durdurma komutunu uyguladı.', 'The player applied a stop command.'],
    'media-paused': ['Medya denetimlerinden duraklatma komutu geldi.', 'The media controls requested a pause.'],
    'media-stopped': ['Medya denetimlerinden durdurma komutu geldi.', 'The media controls requested a stop.'],
    'watchdog': ['Seyir oynatıcısı beklediği yanıtı süresinde alamayınca ses denemesini durdurdu.', 'The journey player stopped the audio attempt after its response timeout expired.'],
    'media-error': ['Oynatıcı bir medya hatası bildirdi.', 'The player reported a media error.'],
    'completed': ['Oynatma sonuna ulaştı.', 'Playback reached the end.'],
    'unknown': ['Sükûn sesin durduğunu gözlemledi. Nedeni belirlenemedi.', 'Sükûn observed playback stop. The cause is unknown.']
  };
  const scopes = {
    all: ['Genel oynatma', 'Overall playback'],
    zikir: ['Zikir', 'Dhikr'],
    journey: ['Seyir', 'Journey'],
    background: ['Arka plan sesleri', 'Background audio'],
    frequency: ['Frekans', 'Frequency'],
    ambience: ['Ambiyans', 'Ambience'],
    reading: ['Okuma', 'Reading'],
    recording: ['Ses kaydı', 'Recording']
  };

  function element(tag, id) {
    const node = document.createElement(tag);
    node.id = id;
    return node;
  }

  function renderDialog() {
    const dialog = byId(dialogId);
    if (!dialog) return;
    const record = window.SukunPlaybackStopReason?.snapshot() || null;
    byId('r1263StopReasonTitle').textContent = localized(title);
    byId('r1263StopReasonClose').textContent = localized(['Kapat', 'Close']);
    byId('r1263StopReasonMessage').textContent = localized(record ? reasons[record.code] || reasons.unknown : empty);
    const meta = byId('r1263StopReasonMeta');
    meta.hidden = !record;
    if (!record) return;
    byId('r1263StopReasonScope').textContent = scopes[record.scope] ? localized(scopes[record.scope]) : '';
    const time = byId('r1263StopReasonTime');
    const date = new Date(record.at);
    time.dateTime = date.toISOString();
    time.textContent = date.toLocaleString(window.I18N?.lang === 'en' ? 'en-GB' : 'tr-TR', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  function openDialog(event) {
    opener = event.currentTarget;
    let dialog = byId(dialogId);
    if (!dialog) {
      dialog = element('dialog', dialogId);
      dialog.setAttribute('data-noi18n', '');
      dialog.setAttribute('aria-labelledby', 'r1263StopReasonTitle');
      dialog.setAttribute('aria-describedby', 'r1263StopReasonMessage');
      const heading = element('h2', 'r1263StopReasonTitle');
      const message = element('p', 'r1263StopReasonMessage');
      message.setAttribute('role', 'status');
      const meta = element('p', 'r1263StopReasonMeta');
      meta.append(element('span', 'r1263StopReasonScope'), element('time', 'r1263StopReasonTime'));
      const close = element('button', 'r1263StopReasonClose');
      close.type = 'button';
      close.autofocus = true;
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => {
        const target = opener?.getClientRects().length ? opener : document.querySelector('.tabs button[aria-selected="true"]');
        opener = null;
        target?.focus({preventScroll: true});
      });
      dialog.append(heading, message, meta, close);
      document.body.append(dialog);
    }
    renderDialog();
    if (!dialog.open) dialog.showModal();
  }

  function mountButton(container, id) {
    if (!container) return;
    let button = byId(id);
    if (!button) {
      button = element('button', id);
      button.type = 'button';
      button.setAttribute('data-noi18n', '');
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-controls', dialogId);
      const label = document.createElement('span');
      button.append(label);
      button.addEventListener('click', openDialog);
    }
    if (button.parentElement !== container) {
      if (id === buttonId) container.prepend(button);
      else container.append(button);
    }
    const name = localized(title);
    button.firstElementChild.textContent = name;
    button.setAttribute('aria-label', name);
    button.title = name;
  }

  function mount() {
    const dockBody = byId('r659DockBody');
    if (dockBody) {
      dockObserver?.disconnect();
      dockObserver = null;
      mountButton(dockBody, buttonId);
    } else if (!dockObserver && byId('r170Now')) {
      // Some startup paths create the shell after DOMContentLoaded.
      dockObserver = new MutationObserver(mount);
      dockObserver.observe(byId('r170Now'), {childList: true, subtree: true});
    }
    mountButton(document.querySelector('#tab-ntf .r554NotifyTools'), notificationId);
    if (byId(dialogId)?.open) renderDialog();
  }

  window.addEventListener('sukun:playbackstopreason', () => {
    if (byId(dialogId)?.open) renderDialog();
  });
  window.addEventListener('sukun:languagechange', mount);
  window.addEventListener('sukun:r698modechange', mount);
  window.addEventListener('pageshow', mount);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) mount(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true});
  else mount();
})();
