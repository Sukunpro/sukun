/* SÜKÛN r1107 — explicit, local storage metadata view. The health view owns
 * mounting/navigation; only this card's button requests a new observation. */
(() => {
  'use strict';
  if (window.SukunStorageSnapshotUIR1107) return;
  const panels = new Map(), boundDialogs = new WeakSet(), boundSlots = new WeakSet(), boundPanels = new WeakSet();
  const en = () => window.I18N?.lang === 'en';
  const text = (tr, english) => en() ? english : tr;
  const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const get = (state, key) => state.slot.querySelector('[data-storage-snapshot-' + key + ']');
  function integer(value) { return finite(value) ? value.toLocaleString(en() ? 'en-GB' : 'tr-TR', {maximumFractionDigits:0}) : text('Ölçülmedi', 'Not measured'); }
  function bytes(value) {
    if (!finite(value)) return text('Ölçülmedi', 'Not measured');
    if (value === 0) return '0 B';
    const units = ['B','KiB','MiB','GiB','TiB'], index = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
    return (value / (1024 ** index)).toLocaleString(en() ? 'en-GB' : 'tr-TR', {maximumFractionDigits:index ? 1 : 0}) + ' ' + units[index];
  }
  function stamp(value) {
    const date = new Date(value || NaN);
    return Number.isFinite(date.getTime()) ? date.toLocaleString(en() ? 'en-GB' : 'tr-TR') : text('Zaman bilinmiyor', 'Time unknown');
  }
  function sourceStatus(source) {
    if (source?.status === 'ok') return text('Ölçüldü', 'Measured');
    if (source?.status === 'missing') return text('Depo bulunamadı; sayı ölçülmedi', 'Store not found; count not measured');
    if (source?.status === 'cancelled') return text('Denetim tamamlanmadı', 'Inspection did not finish');
    return text('Depo denetimi tamamlanamadı; sayı ölçülmedi', 'Store inspection did not finish; count not measured.');
  }
  function values(source, recovery = false) {
    // Failed/partial source metadata never masquerades as an empty store.
    const measured = source?.status === 'ok';
    const count = measured ? source.count : null, size = measured ? source.blobBytes : null;
    let result = '<dl><div><dt>' + esc(recovery ? text('Kurtarma noktası', 'Recovery points') : text('Ses kaydı', 'Recordings')) + '</dt><dd>' + esc(integer(count)) + '</dd></div><div><dt>' + esc(text('Ses verisi', 'Audio data')) + '</dt><dd>' + esc(bytes(size)) + '</dd></div></dl>';
    if (recovery) result += '<p>' + esc(text('Kayıt kopyaları: ', 'Recording copies: ') + integer(measured ? source.recordings : null) + ' · ' + text('Ambiyans kopyaları: ', 'Ambience copies: ') + integer(measured ? source.ambience : null)) + '</p>';
    return result + '<p class="r1107-storage-source-status">' + esc(sourceStatus(source)) + '</p>';
  }
  function observationView(observation) {
    if (!observation) return '';
    const sources = observation.sources || {}, generic = sources.generic;
    const genericState = generic?.enabled === true ? text('Kullanımı açık', 'Use enabled') : generic?.enabled === false ? text('Kullanımı kapalı', 'Use disabled') : text('Kullanım tercihi ölçülmedi', 'Use preference not measured');
    const personal = '<section class="r1107-storage-source"><h5>' + esc(text('Kendi zikir / okuma kayıtlarım', 'My dhikr / reading recordings')) + '</h5>' + values(sources.personal) + '<p class="r1107-storage-scope">' + esc(text('Kişisel JSON yedeğinin ses kapsamındadır; mevcut yedeğin tamamlandığı doğrulanmaz.', 'Within the audio scope of personal JSON backups; this does not verify a completed backup.')) + '</p><div class="r1107-storage-ambience"><h5>' + esc(text('Kendi ambiyanslarım', 'My ambience recordings')) + '</h5>' + values(sources.ambience) + '<p class="r1107-storage-scope">' + esc(text('Ayrı depo; kişisel JSON yedeğinin kapsamındadır.', 'Separate store; within the scope of personal JSON backups.')) + '</p></div></section>';
    const archive = '<section class="r1107-storage-source"><h5>' + esc(text('Erişilebilir jenerik arşiv', 'Accessible generic archive')) + '</h5>' + values(generic) + '<p>' + esc(genericState) + '</p><p class="r1107-storage-scope">' + esc(text('Yalnız bu cihazdaki erişilebilir sesler. Kişisel JSON yedeğine dahil değildir.', 'Only accessible recordings on this device. Not included in personal JSON backups.')) + '</p></section>';
    const recovery = '<section class="r1107-storage-source"><h5>' + esc(text('Kurtarma kopyaları', 'Recovery copies')) + '</h5>' + values(sources.recovery, true) + '<p class="r1107-storage-scope">' + esc(text('Yerel kurtarma noktalarındaki ses kopyalarıdır. Aynı ses birden çok kez sayılabilir; ayarlar ve dizin yükü bu boyuta dahil değildir.', 'Audio copies in local recovery points. The same recording may be counted more than once; settings and index overhead are excluded.')) + '</p></section>';
    const quota = observation.quota || {};
    const quotaText = quota.status === 'ok' ? text('Yaklaşık kullanım: ', 'Approximate usage: ') + bytes(quota.usage) + ' / ' + bytes(quota.quota) : quota.status === 'unsupported' ? text('Tarayıcı bu tahmini sunmuyor.', 'This browser does not provide an estimate.') : text('Tarayıcı alan tahmini alınamadı.', 'The browser storage estimate was unavailable.');
    return '<p class="r1107-storage-stamp">' + esc(text('Son gözlem: ', 'Last observation: ') + stamp(observation.at) + (observation.build ? ' · ' + observation.build : '')) + '</p>' + personal + archive + recovery + '<section class="r1107-storage-quota"><h5>' + esc(text('Tarayıcı alan tahmini', 'Browser storage estimate')) + '</h5><p>' + esc(quotaText) + '</p><p>' + esc(text('Bu değer önbellek ve başka site verilerini de kapsayabilir; yukarıdaki ses boyutlarının toplamı değildir.', 'This may include caches and other site data; it is not the sum of the audio sizes above.')) + '</p></section>';
  }
  function isOpen(panel, state) {
    const dialog = panel.closest('dialog');
    return panel.isConnected && state.slot.isConnected && panel.open !== false && (!dialog || dialog.open !== false) && (state.screen === 'home' || state.screen === 'tests');
  }
  function render(panel, state) {
    state.slot.hidden = state.screen !== 'home' && state.screen !== 'tests';
    if (state.slot.hidden && state.job) cancel(panel);
    get(state, 'heading').textContent = text('Ses depoları', 'Audio stores');
    get(state, 'intro').textContent = text('Bu cihazdaki ses depolarının sayısını ve ses verisi boyutunu yerel olarak denetle.', 'Inspect recording counts and audio data sizes in the stores on this device.');
    get(state, 'run').textContent = text('Depoları denetle', 'Inspect stores');
    get(state, 'run').title = state.job ? text('Önceki denetimi durdurup yeniden başlatır.', 'Stops the previous inspection and starts again.') : '';
    const status = get(state, 'status');
    status.textContent = state.job ? text('Depolar okunuyor…', 'Reading stores…') : state.message === 'privacy' ? text('Erişim değişti. Güncel sayılar için depoları yeniden denetle.', 'Access changed. Inspect stores again for current counts.') : state.message === 'cancelled' ? text('Denetim durduruldu; tamamlanmış yeni bir ölçüm yok.', 'Inspection stopped; there is no completed new measurement.') : state.message === 'error' ? text('Denetim tamamlanamadı. Bilinmeyen değerler sıfır sayılmaz.', 'Inspection did not finish. Unknown values are not zero.') : state.result?.status === 'complete' ? text('Depolar denetlendi. Bu, yedeğin tamamlandığını doğrulamaz.', 'Stores inspected. This does not verify a completed backup.') : state.result ? text('Denetim kısmen tamamlandı; ölçülemeyen alanlar ayrı gösteriliyor.', 'Inspection partly completed; unmeasured areas are shown separately.') : text('Henüz denetlenmedi. Denetimi başlatmak için düğmeye dokun.', 'Not inspected yet. Tap the button to start.');
    status.dataset.status = state.job ? 'reading' : state.result?.status || state.message || 'unmeasured';
    const results = get(state, 'results');results.setAttribute('aria-busy', state.job ? 'true' : 'false');
    const markup = observationView(state.result);if (state.markup !== markup) {results.innerHTML = markup;state.markup = markup;}
    get(state, 'limit').textContent = text('Bu denetim yedek oluşturmaz. Ses içeriğini çözümlemez; yalnız kayıt metaverisini okur. Sonuçlar bu kartta kalır.', 'This inspection does not create a backup. It reads recording metadata without decoding audio. Results stay in this card.');
  }
  function cancel(panel, reason = 'cancelled') {
    const state = panels.get(panel);if (!state) return false;
    state.generation++;
    const pending = state.job;state.job = null;pending?.abort();
    if (reason === 'privacy') {state.result = null;state.message = 'privacy';}
    else if (pending) {state.result = null;state.message = 'cancelled';}
    render(panel, state);return !!pending;
  }
  async function inspect(panel) {
    const state = panels.get(panel);if (!state || !isOpen(panel, state)) return false;
    state.job?.abort();
    const controller = new AbortController(), generation = ++state.generation;
    state.job = controller;state.result = null;state.message = '';render(panel, state);
    try {
      const core = window.SukunStorageSnapshotR1107;
      if (typeof core?.inspect !== 'function') throw new Error('unavailable');
      const snapshot = await core.inspect({signal:controller.signal});
      if (state.generation !== generation || controller.signal.aborted || !isOpen(panel, state)) return false;
      const result = snapshot?.current;
      if (!result || result.status === 'cancelled') {state.message = 'cancelled';return false;}
      state.result = result;return true;
    } catch (_) {
      if (state.generation === generation && !controller.signal.aborted) state.message = 'error';
      return false;
    } finally {
      if (state.generation === generation) {state.job = null;render(panel, state);}
    }
  }
  function mountHealth(panel, screen = 'home') {
    if (!panel) return false;
    const slot = panel.querySelector('[data-storage-snapshot-health]');if (!slot) return false;
    let state = panels.get(panel);
    if (!state || state.slot !== slot) {
      if (state) cancel(panel);
      state = {slot,screen,job:null,result:null,message:'',generation:0,markup:null};panels.set(panel,state);
      slot.className = 'hv-box r1107-storage-health';slot.setAttribute('data-i18n-owned','storage-snapshot-r1107');
      slot.innerHTML = '<h4 data-storage-snapshot-heading></h4><p data-storage-snapshot-intro></p><button type="button" data-storage-snapshot-run></button><p data-storage-snapshot-status role="status" aria-live="polite" aria-atomic="true"></p><div data-storage-snapshot-results></div><p class="r1107-storage-limit" data-storage-snapshot-limit></p>';
      if (!boundSlots.has(slot)) {boundSlots.add(slot);slot.addEventListener('click',event => {const button = event.target.closest?.('[data-storage-snapshot-run]');if (button && slot.contains(button)) void inspect(panel);});}
      if (!boundPanels.has(panel)) {boundPanels.add(panel);panel.addEventListener('toggle',()=>{if (!panel.open) cancel(panel);});}
    }
    const dialog = panel.closest('dialog');
    if (dialog && !boundDialogs.has(dialog)) {boundDialogs.add(dialog);dialog.addEventListener('close',()=>{for (const [node] of panels) if (dialog.contains(node)) cancel(node);});}
    state.screen = screen;render(panel,state);return true;
  }
  function each(action) {for (const [panel,state] of panels) {if (!panel.isConnected) {state.generation++;state.job?.abort();state.job = null;panels.delete(panel);} else action(panel,state);}}
  for (const name of ['sukun:secretaccesschange','sukun:secretpolicyready']) window.addEventListener(name,()=>each(panel=>cancel(panel,'privacy')),{passive:true});
  window.addEventListener('sukun:languagechange',()=>each(render),{passive:true});
  for (const name of ['pagehide']) window.addEventListener(name,()=>each(panel=>cancel(panel)),{passive:true});
  document.addEventListener('visibilitychange',()=>{if (document.hidden) each(panel=>cancel(panel));},{passive:true});
  window.SukunStorageSnapshotUIR1107 = Object.freeze({version:'r1107',mountHealth,cancel});
})();
