/* The Android host passes a channel to the trusted main frame. The system
   document picker receives only the file the user chooses to export. */
(() => {
  'use strict';
  if (location.origin !== 'https://appassets.androidplatform.net' || window !== window.top) return;
  const chunkSize = 96 * 1024;
  const knownBlobs = new Map();
  let port = null;
  let active = null;
  let noticeTimer = 0;
  // The trusted main frame receives this port only from the package's singleTask Activity.
  Object.defineProperty(window, 'SukunAndroidSingleWindow', {value: () => port !== null});

  function notify(tr, en, sticky = false) {
    if (!document.body) return;
    let notice = document.getElementById('sukunAndroidSaveNotice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'sukunAndroidSaveNotice';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      notice.style.cssText = 'position:fixed;z-index:2147483647;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);transform:translateX(-50%);background:#102c27;color:#fff4d6;border:1px solid #b5a078;border-radius:14px;padding:12px 18px;max-width:90vw;width:max-content;box-shadow:0 3px 16px #0007;font:15px/1.4 system-ui,sans-serif;pointer-events:none';
      document.body.append(notice);
    }
    notice.textContent = window.I18N?.lang === 'en' ? en : tr;
    clearTimeout(noticeTimer);
    if (!sticky) noticeTimer = setTimeout(() => notice.remove(), 4000);
  }

  function finish(job, saved = false, error = null) {
    clearTimeout(job.timer);
    if (active === job) active = null;
    job.blob = null;
    if (error) job.reject(error);
    else job.resolve(saved);
  }

  function fail(job, text) {
    if (active !== job) return;
    if (port && job.stage !== 'queued') {
      try { port.postMessage(JSON.stringify({type:'cancel'})); } catch (_) {}
    }
    finish(job, false, Error(text));
    notify('Dosya kaydedilemedi. '+text, 'The file could not be saved. '+text);
  }

  function send(type, fields = {}) {
    port.postMessage(JSON.stringify({type, ...fields}));
  }

  function begin(job) {
    if (!port || !job.blob || job.stage !== 'queued' || active !== job) return;
    clearTimeout(job.timer);
    job.stage = 'begin';
    try { send('begin', {name:job.name, mime:job.blob.type.split(';')[0] || 'application/octet-stream', bytes:job.blob.size}); }
    catch (_) { fail(job, 'Android'); }
  }

  async function sendPart(job) {
    if (job.offset >= job.blob.size) {
      job.stage = 'picker';
      send('finish');
      notify('Dosyayı kaydedeceğin konumu seç.', 'Choose where to save the file.', true);
      return;
    }
    job.stage = 'reading';
    const part = job.blob.slice(job.offset, job.offset + chunkSize);
    const bytes = new Uint8Array(await part.arrayBuffer());
    if (active !== job) return;
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    job.offset += bytes.length;
    job.stage = 'chunk';
    send('chunk', {data:btoa(binary)});
  }

  function receive(event) {
    if (!active) return;
    const job = active;
    let message;
    try { message = JSON.parse(event.data); } catch (_) { return; }
    switch (message.type) {
      case 'ready':
      case 'next':
        if (job.stage !== (message.type === 'ready' ? 'begin' : 'chunk')) return;
        sendPart(job).catch(() => fail(job, 'Dosya okunamadı.'));
        break;
      case 'done':
        if (job.stage !== 'picker') return;
        finish(job, true);
        notify('Dosya kaydedildi.', 'File saved.');
        break;
      case 'cancelled':
        finish(job);
        notify('Kaydetme iptal edildi.', 'Save cancelled.');
        break;
      case 'error':
        finish(job, false, Error(String(message.message || 'Android')));
        notify('Dosya kaydedilemedi. '+String(message.message || ''), 'File could not be saved. '+String(message.message || ''));
        break;
    }
  }

  window.addEventListener('message', event => {
    if (event.data !== 'sukun-export-v1' || event.ports.length !== 1 || event.source) return;
    if (port) {
      if (active) { event.ports[0].close(); return; }
      port.close();
    }
    port = event.ports[0];
    port.onmessage = receive;
    port.start();
    if (active) begin(active);
  });

  const makeURL = URL.createObjectURL.bind(URL);
  const revokeURL = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = object => {
    const url = makeURL(object);
    if (object instanceof Blob) knownBlobs.set(url, object);
    return url;
  };
  URL.revokeObjectURL = url => {
    knownBlobs.delete(String(url));
    revokeURL(url);
  };

  function downloadable(link) {
    return link instanceof HTMLAnchorElement && link.hasAttribute('download') && /^(blob:|data:)/.test(link.href);
  }

  function requestSave(blob, name, url) {
    if (active) {
      notify('Önce açık olan dosya kaydını tamamla.', 'Finish saving the current file first.');
      return Promise.reject(Error('Önce açık olan dosya kaydını tamamla.'));
    }
    return new Promise((resolve, reject) => {
      const job = {name:name || 'Sukun', blob, stage:'queued', offset:0, timer:0, resolve, reject};
      active = job;
      notify('Dosya kaydetmeye hazırlanıyor…', 'Preparing file to save…', true);
      job.timer = setTimeout(() => fail(job, 'Android kaydetme penceresi hazır değil.'), 30000);
      if (job.blob) begin(job);
      else fetch(url).then(r => {
        if (!r.ok) throw Error('Unreadable file');
        return r.blob();
      }).then(blob => { job.blob = blob; begin(job); }).catch(() => fail(job,'Dosya okunamadı.'));
    });
  }
  // Backup timestamps are committed by the caller only after Android has closed the output stream.
  Object.defineProperty(window, 'SukunAndroidSaveFile', {
    value: (blob, name) => blob instanceof Blob ? requestSave(blob, name) : Promise.reject(Error('Dosya okunamadı.'))
  });
  function save(link) { requestSave(knownBlobs.get(link.href), link.download, link.href).catch(() => {}); }

  document.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    const link = event.target?.closest?.('a[download]');
    if (downloadable(link)) {
      event.preventDefault();
      save(link);
    }
  }, true);
  // An anchor that the application never inserts cannot bubble to document.
  const nativeClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function() {
    if (!this.isConnected && downloadable(this)) save(this);
    else return nativeClick.call(this);
  };
  window.addEventListener('pagehide', () => {
    if (active) {
      if (port) { try { send('cancel'); } catch (_) {} }
      finish(active);
    }
    if (port) { port.close(); port = null; }
  });
})();
