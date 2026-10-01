/* SÜKÛN r948 — Nefs education and local self-reflection. No audio or network side effects. */
(function () {
  'use strict';
  if (window.SukunNefsR948) return;
  const KEY = 'sukun.nefs.r948';
  const tabs = [['home', 'Başlangıç'], ['guide', 'Nefsi tanı'], ['test', 'Kendine bak'], ['result', 'Değerlendirme'], ['journal', 'Notlarım'], ['sources', 'Kaynaklar']];
  const frequency = ['Hiç / hemen hiç', 'Nadiren', 'Bazen', 'Sık', 'Çok sık / hemen her zaman'];
  let data, model, host, draft, initialized = false, active = 'home', mode = 'profile', knowledgeCursor = 0;
  let notice = '', saveError = '', importInput, resultCache = null, renderRevision = 0;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const own = (obj, id) => Object.prototype.hasOwnProperty.call(obj || {}, id);
  const arr = x => Array.isArray(x) ? x : [];
  const clamp = (x, a, b) => Math.min(b, Math.max(a, Number(x) || 0));
  const label = x => typeof x === 'string' ? x : x && (x.text || x.title || x.body || x.note) || '';
  function button(text, action, value, cls, extra) { return '<button type="button" class="nr-btn ' + (cls || '') + '" data-nr-action="' + esc(action) + '"' + (value != null ? ' data-nr-value="' + esc(value) + '"' : '') + (extra ? ' ' + extra : '') + '>' + esc(text) + '</button>'; }
  function paragraph(text, cls) { return '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(label(text)) + '</p>'; }
  function list(values) { return '<ul class="nr-list">' + arr(values).map(x => '<li>' + esc(label(x)) + '</li>').join('') + '</ul>'; }
  function domain(id) { return data.domains.find(d => d.id === id) || {id: id, title: id}; }
  function answerLabel(q, value) { if (value === 'na') return 'Değerlendiremiyorum'; if (value == null) return 'Henüz yanıtlanmadı'; return q.kind === 'behavior' ? frequency[value] || String(value) : (arr(q.options).find(o => o.id === value) || {}).text || String(value); }
  function counts() {
    const filled = data.questions.filter(q => own(draft.answers, q.id));
    return {answered: filled.filter(q => draft.answers[q.id] !== 'na').length, skipped: filled.filter(q => draft.answers[q.id] === 'na').length, done: filled.length, total: data.questions.length};
  }
  function readableDate(value) { try { return new Date(value).toLocaleString('tr-TR', {dateStyle:'short', timeStyle:'short'}); } catch (_) { return ''; } }
  function progress(done, total, text) { return '<div class="nr-progress"><div class="nr-line"><span>' + esc(text) + '</span><strong>' + done + ' / ' + total + '</strong></div><progress max="' + total + '" value="' + done + '" aria-label="' + esc(text) + '"></progress></div>'; }
  function sourceLinks(ids) {
    const selected = arr(ids).map(id => data.sources.find(s => s.id === id)).filter(Boolean);
    if (!selected.length) return '';
    return '<div class="nr-citations"><span>Okuma dayanağı</span>' + selected.map(s => button(s.title, 'source', s.id, 'nr-link')).join('') + '</div>';
  }
  function persist() {
    draft.updatedAt = new Date().toISOString(); resultCache = null;
    try { localStorage.setItem(KEY, JSON.stringify(draft)); saveError = ''; } catch (_) { saveError = 'Değişikliğin bu cihazda kaydedilemedi. Bu sayfa açıkken devam edebilirsin; kapanmadan önce dosya olarak yedekle.'; }
    updateStatus();
  }
  function updateStatus() {
    if (!host) return;
    const status = host.querySelector('#nr-save-status');
    if (status) { status.className = 'nr-save' + (saveError ? ' nr-warning' : ''); const text = saveError || (draft.updatedAt ? 'Bu cihazda kayıtlı · ' + readableDate(draft.updatedAt) : 'Yanıtların yalnızca bu tarayıcıda tutulur.'); if (status.textContent !== text) status.textContent = text; status.setAttribute('role', saveError ? 'alert' : 'status'); }
  }
  function init() {
    if (initialized) return true;
    host = document.getElementById('r948NefsRoot'); data = window.SUKUN_NEFS_DATA_R948; model = window.SukunNefsModelR948;
    if (!host || !data || !model) return false;
    draft = model.newDraft();
    try { const raw = localStorage.getItem(KEY); if (raw) { draft = model.sanitizeDraft(JSON.parse(raw), data); if (!draft || typeof draft !== 'object') draft = model.newDraft(); } } catch (_) { saveError = 'Önceki kayıt okunamadı. Yeni yanıtların için bu sayfayı kullanabilir; varsa dosya yedeğini içe aktarabilirsin.'; }
    draft.answers = draft.answers || {}; draft.knowledge = draft.knowledge || {}; draft.reflections = draft.reflections || {};
    host.addEventListener('click', onClick);
    host.addEventListener('change', onChange);
    host.addEventListener('input', onInput);
    initialized = true; render(); return true;
  }
  function shell() {
    return '<div class="nr-app"><header class="nr-header"><div><span class="nr-eyebrow">SÜKÛN · İÇE BAKIŞ</span><h2>Nefs bilgisi ve muhasebe</h2></div><span class="nr-seal" aria-hidden="true"><svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.4" focusable="false" aria-hidden="true"><path d="M8 8h16v16H8zM16 4l12 12-12 12L4 16z"/><circle cx="16" cy="16" r="4"/></svg></span></header><nav class="nr-tabs" aria-label="Nefs bölümleri">' + tabs.map(t => button(t[1], 'tab', t[0], active === t[0] ? 'is-active' : '', active === t[0] ? 'aria-current="page"' : '')).join('') + '</nav><div id="nr-save-status" class="nr-save" role="status"></div>' + (notice ? '<div class="nr-notice" role="status">' + esc(notice) + button('Kapat', 'notice', null, 'nr-link') + '</div>' : '') + '<main id="nr-content" tabindex="-1">' + ({home: homeView, guide: guideView, test: testView, result: resultView, journal: journalView, sources: sourcesView}[active] || homeView)() + '</main><div class="nr-footer"><span>Kendini tanımak, küçük ve dürüst bir adımla başlar.</span><div class="nr-actions">' + button('Günlük sıfat muhasebesi', 'legacy', null, 'nr-link') + button('Verilerim', 'data', null, 'nr-link') + '</div></div><details class="nr-card nr-data" id="nr-data"><summary>Kayıt ve gizlilik</summary><p>Yanıtlar ve notlar yalnızca bu tarayıcıda saklanır. Bir hesaba, sunucuya veya yapay zekâya otomatik gönderilmez. Ortak cihaz kullanan biri bu kayıtlara erişebilir; tarayıcı verileri temizlenirse kayıtlar kaybolabilir.</p><p>Dışa aktarılan dosya kişisel yanıtlarını ve notlarını içerir. Dosyayı yalnızca güvendiğin yerde tut.</p><div class="nr-actions">' + button('Dosya olarak yedekle', 'export') + button('Yedeği içe aktar', 'import') + button('Bu çalışmayı sıfırla', 'reset', null, 'nr-danger') + '</div><input type="file" id="nr-import" accept="application/json,.json" hidden></details></div>';
  }
  function render() { if (!initialized) { init(); return; } renderRevision += 1; host.innerHTML = shell(); importInput = host.querySelector('#nr-import'); updateStatus(); }
  function move(tab, focus) { active = tabs.some(t => t[0] === tab) ? tab : 'home'; if (active === 'journal') { draft.subtype = 'reflection'; persist(); } notice = ''; render(); if (focus) focusContent(); }
  function scrollToView(el) {
    if (!el) return;
    const options = {block:'start',behavior:'instant'};
    if (window.SukunViewportPolicy && typeof window.SukunViewportPolicy.scrollTo === 'function') window.SukunViewportPolicy.scrollTo(el,options,'nefs-r948-navigation');
    else el.scrollIntoView(options);
  }
  function focusContent() { const el = host.querySelector('#nr-content'); if (el) { el.focus({preventScroll:true}); scrollToView(el); } }
  function homeView() {
    const c = counts();
    return '<section class="nr-hero"><span class="nr-eyebrow">BİR HÜKÜM DEĞİL, DÜRÜST BİR BAKIŞ</span><h3>Hâlini fark et.<br>Küçük bir iyiliği büyüt.</h3><p>Nefsin dilini öğren; son 30 gündeki davranışlarına bak. Güçlü yanlarını korumak ve zorlandığın alışkanlıklara bir adım seçmek için sakin bir alan.</p><div class="nr-actions">' + button(c.done ? 'Kaldığım yerden devam et' : 'Muhasebeye başla', 'resume', null, 'nr-primary') + button('Önce nefsi tanı', 'tab', 'guide') + '</div></section><div class="nr-stats"><div><strong>12</strong><span>davranış alanı</span></div><div><strong>120</strong><span>muhasebe sorusu</span></div><div><strong>' + data.knowledge.length + ' + ' + data.reflections.length + '</strong><span>bilgi sorusu + isteğe bağlı not</span></div></div><section class="nr-card"><h3>Bu çalışma nasıl okunmalı?</h3><p>Sonuç, verdiğin yanıtların bir özetidir; nefs mertebeni, Allah katındaki değerini veya manevi makamını belirlemez. Geçerliği kanıtlanmış psikolojik bir test veya tanı aracı değildir.</p><p>Kur’ân’daki nefs ifadeleri ile daha sonra oluşan yedi mertebeli tasavvuf anlatımı ayrı ele alınır. Bilgi soruları ve özel notların davranış profiline puan katmaz. Yeterli yanıt oluştuğunda bazı mertebe anlatımlarıyla tematik yakınlık gösterilir; bu, bir makama eriştiğin anlamına gelmez.</p></section>' + (c.done ? '<section class="nr-card">' + progress(c.done, c.total, 'Gözden geçirilen sorular') + '<p class="nr-muted">' + c.answered + ' yanıt · ' + c.skipped + ' değerlendirilemeyen. Ara verip aynı cihazdan devam edebilirsin.</p><div class="nr-actions">' + button('Yanıtlarımın özetini gör', 'tab', 'result') + button('Bilgimi gözden geçir', 'knowledge') + '</div></section>' : '') + '<section class="nr-grid nr-three"><article class="nr-card"><span class="nr-step">01</span><h3>Öğren</h3><p>Temel kavramları, mertebe dilini ve kaynakların sınırlarını tanı.</p></article><article class="nr-card"><span class="nr-step">02</span><h3>Kendine sor</h3><p>Olmak istediğin kişiyi değil, son 30 gündeki somut davranışlarını düşün.</p></article><article class="nr-card"><span class="nr-step">03</span><h3>Bir adım seç</h3><p>Bir alışkanlığı izle. Yedi gün boyunca küçük, yapılabilir bir pratik dene.</p></article></section><section class="nr-card"><h3>' + (data.questions.length + data.knowledge.length + data.reflections.length) + ' soruluk çalışma</h3><p>' + data.questions.length + ' muhasebe sorusu (96 davranış + 24 durum), ' + data.knowledge.length + ' bilgi sorusu ve ' + data.reflections.length + ' isteğe bağlı tefekkür sorusu bulunur.</p><h3>Yanıt verirken</h3><p>Acele etme; bölümleri farklı zamanlarda tamamlayabilirsin. Hatırlamıyorsan veya durum sana uygulanmıyorsa “Değerlendiremiyorum” seç. Davranış açıklamaları değerlendirmede, bilgi açıklamaları yanıttan sonra görünür. Seçimin seni bir sonraki soruya geçirmez.</p><div class="nr-actions">' + button(data.knowledge.length + ' bilgi sorusu', 'knowledge') + button('Özel notlarıma git', 'tab', 'journal') + '</div></section>';
  }
  function guideView() {
    return '<div class="nr-section-heading"><span class="nr-eyebrow">BİLGİ · KAVRAM · KAYNAK</span><h3>Nefsi tanımak</h3><p>Mertebeleri kendine ya da başkasına etiket olarak yapıştırmadan oku.</p></div>' + arr(data.guides).map((g,i) => '<details class="nr-card nr-reading"' + (i === 0 ? ' open' : '') + '><summary>' + esc(g.title) + '</summary>' + arr(g.body).map(x => paragraph(x)).join('') + sourceLinks(g.sourceIds) + '</details>').join('') + '<section class="nr-card"><h3>Yedi mertebe: bir eğitim dili</h3><p>Bu sıralama, tasavvuf geleneğindeki bir terbiye haritasıdır. Her kelimenin Kur’ân’da kullanımı ile yedi basamaklı sistem aynı şey değildir. Bir kişiye kesin makam atamak bu çalışmanın amacı değildir.</p></section><div class="nr-stages">' + arr(data.stages).map((s,i) => '<details class="nr-card nr-reading"><summary><span class="nr-step">' + String(i+1).padStart(2,'0') + '</span> ' + esc(s.title) + '</summary>' + (Array.isArray(s.body) ? s.body : [s.body]).map(x => paragraph(x)).join('') + sourceLinks(s.sourceIds) + '</details>').join('') + '</div><section class="nr-card"><h3>Bu kavramlar hayatta nasıl görünür?</h3><div class="nr-grid">' + data.domains.map(d => '<article class="nr-domain-intro"><h4>' + esc(d.title) + '</h4><p>' + esc(d.description) + '</p></article>').join('') + '</div><div class="nr-actions">' + button('Kendime bakmaya başla', 'resume', null, 'nr-primary') + button('Bilgi sorularını aç', 'knowledge') + '</div></section>';
  }
  function domainNavigation(current) {
    return '<details class="nr-card nr-section-map"><summary>12 alanda ilerlemem · Bölüm seç</summary><div class="nr-domain-map">' + data.domains.map((d,i) => { const qs = data.questions.filter(q => q.domain === d.id), n = qs.filter(q => own(draft.answers,q.id)).length; return button(String(i+1).padStart(2,'0') + ' · ' + d.title + '  ' + n + '/' + qs.length, 'domain', d.id, current === d.id ? 'is-active' : ''); }).join('') + '</div><p class="nr-muted">Sayılar gözden geçirilen soruları gösterir; “Değerlendiremiyorum” yanıtları puana katılmaz.</p></details>';
  }
  function testView() { return mode === 'knowledge' ? knowledgeView() : profileView(); }
  function profileView() {
    draft.cursor = clamp(draft.cursor, 0, data.questions.length - 1);
    const q = data.questions[draft.cursor], d = domain(q.domain), c = counts(), value = draft.answers[q.id], done = own(draft.answers, q.id);
    const qDomain = data.questions.filter(x => x.domain === q.domain), qIndex = qDomain.findIndex(x => x.id === q.id);
    return '<div class="nr-section-heading"><span class="nr-eyebrow">SON 30 GÜNE BAK</span><h3>Kendine dürüstçe sor</h3><p>Tek bir kötü günü değil, genel örüntüyü düşün. Yanıtın yalnızca kendin içindir.</p></div>' + progress(c.done,c.total,'Gözden geçirilen') + '<div class="nr-line nr-small"><span>' + c.answered + ' yanıt · ' + c.skipped + ' değerlendirilemeyen</span>' + button('Ara ver', 'pause', null, 'nr-link') + '</div><label class="nr-field">Davranış alanı<select id="nr-domain-select" aria-label="Davranış alanını seç">' + data.domains.map(x => '<option value="' + esc(x.id) + '"' + (x.id === q.domain ? ' selected' : '') + '>' + esc(x.title) + '</option>').join('') + '</select></label><article class="nr-card nr-question"><div class="nr-line nr-question-meta"><span>' + esc(d.title) + '</span><span>' + (draft.cursor+1) + ' / ' + c.total + '</span></div><p class="nr-muted nr-small">Bu alanda ' + (qIndex+1) + ' / ' + qDomain.length + ' · ' + (q.kind === 'scenario' ? 'Bir durum üzerine düşün' : 'Davranış sıklığı') + '</p><fieldset><legend>' + esc(q.text) + '</legend><div class="nr-options">' + (q.kind === 'behavior' ? frequency.map((t,i) => option(q.id,t,i,value,'answer')) : arr(q.options).map(o => option(q.id,o.text,o.id,value,'answer'))).join('') + option(q.id,'Değerlendiremiyorum / bana uygulanmıyor','na',value,'answer') + '</div></fieldset><div class="nr-answer-note" role="status">' + (done ? (value === 'na' ? 'Bu soru puana katılmayacak.' : 'Yanıt seçildi. Hazır olduğunda sonraki soruya geçebilirsin.') : 'İstersen yanıtlamadan da ilerleyebilirsin.') + '</div>' + '<p class="nr-muted nr-small">Soru açıklamalarını ve okuma dayanaklarını değerlendirme bölümünde görebilirsin.</p>' + '<div class="nr-question-actions">' + button('Önceki', 'previous', null, '', draft.cursor === 0 ? 'disabled' : '') + button(draft.cursor === c.total-1 ? 'Değerlendirmeye geç' : 'Sonraki', 'next', null, 'nr-primary') + '</div>' + (done ? button('Bu yanıtı temizle', 'clear-answer', q.id, 'nr-link') : '') + '</article>' + domainNavigation(q.domain) + '<div class="nr-actions">' + button('Şu ana kadarki değerlendirme', 'tab', 'result') + button('Bilgi sorularına geç', 'knowledge') + button('Yanıtlanmayan ilk soruya git', 'unanswered') + '</div>';
  }
  function option(id, text, value, selected, action) {
    return '<button type="button" class="nr-option' + (selected === value ? ' is-selected' : '') + '" data-nr-action="' + action + '" data-nr-value="' + esc(value) + '" data-nr-id="' + esc(id) + '" aria-pressed="' + (selected === value ? 'true' : 'false') + '"><span class="nr-option-dot" aria-hidden="true"></span><span>' + esc(text) + '</span></button>';
  }
  function knowledgeView() {
    knowledgeCursor = clamp(knowledgeCursor, 0, data.knowledge.length - 1);
    const q = data.knowledge[knowledgeCursor], value = draft.knowledge[q.id], done = own(draft.knowledge,q.id), answered = data.knowledge.filter(x => own(draft.knowledge,x.id)).length;
    return '<div class="nr-section-heading"><span class="nr-eyebrow">ÖĞRENME ALANI</span><h3>Bilgini gözden geçir</h3><p>Bu ' + data.knowledge.length + ' soru davranış profiline veya mertebe temalarına puan katmaz.</p></div>' + progress(answered,data.knowledge.length,'Gözden geçirilen bilgi soruları') + '<article class="nr-card nr-question"><div class="nr-line nr-question-meta"><span>Bilgi sorusu</span><span>' + (knowledgeCursor+1) + ' / ' + data.knowledge.length + '</span></div><fieldset><legend>' + esc(q.text) + '</legend><div class="nr-options">' + arr(q.options).map(o => option(q.id,o.text,o.id,value,'knowledge-answer')).join('') + option(q.id,'Henüz bilmiyorum','na',value,'knowledge-answer') + '</div></fieldset>' + (done ? '<div class="nr-feedback" role="status"><strong>' + (value === q.answer ? 'Doğru yanıt.' : value === 'na' ? 'Birlikte öğrenelim.' : 'Bu ayrımı yeniden düşün.') + '</strong><p>Beklenen yanıt: ' + esc((q.options.find(o => o.id === q.answer) || {}).text) + '</p>' + paragraph(q.explanation) + sourceLinks(q.sourceIds) + '</div>' : '') + '<div class="nr-question-actions">' + button('Önceki', 'knowledge-previous', null, '', knowledgeCursor === 0 ? 'disabled' : '') + button(knowledgeCursor === data.knowledge.length-1 ? 'Bilgi özetini gör' : 'Sonraki', 'knowledge-next', null, 'nr-primary') + '</div></article><div class="nr-actions">' + button('Davranış sorularına dön', 'resume') + button('Kavramları oku', 'tab', 'guide') + '</div>';
  }
  function journalView() {
    return '<div class="nr-section-heading"><span class="nr-eyebrow">İSTEĞE BAĞLI · YALNIZCA SANA AİT</span><h3>Biraz dur, kendini dinle</h3><p>Bu notlar puanlanmaz veya yapay zekâyla yorumlanmaz. İstersen tek cümle yaz; istersen boş bırak. Her değişiklik bu tarayıcıda kaydedilir.</p></div>' + arr(data.reflections).map((r,i) => '<section class="nr-card nr-reflection"><label for="nr-note-' + esc(r.id) + '"><span class="nr-step">' + String(i+1).padStart(2,'0') + '</span><strong>' + esc(r.text || r.title || r.prompt) + '</strong></label>' + (r.description ? paragraph(r.description, 'nr-muted') : '') + '<textarea id="nr-note-' + esc(r.id) + '" data-nr-reflection="' + esc(r.id) + '" rows="4" maxlength="2000" placeholder="Kendime küçük bir not…">' + esc(draft.reflections[r.id] || '') + '</textarea><span class="nr-muted nr-small">İsteğe bağlı · En fazla 2000 karakter</span></section>').join('') + '<div class="nr-actions">' + button('Değerlendirmeme dön', 'tab', 'result') + button('Günlük sıfat muhasebesi', 'legacy') + '</div>';
  }
  function getResult() { if (!resultCache) resultCache = model.analyze(data,draft.answers,draft.knowledge); return resultCache || {}; }
  function resultView() {
    const c = counts(), result = getResult();
    if (!c.answered) return '<section class="nr-card nr-empty"><span class="nr-seal" aria-hidden="true"><svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.4" focusable="false" aria-hidden="true"><path d="M8 8h16v16H8zM16 4l12 12-12 12L4 16z"/><circle cx="16" cy="16" r="4"/></svg></span><h3>Henüz bir davranış örüntüsü yok</h3><p>Bir alanı yanıtlayarak başlayabilirsin. “Değerlendiremiyorum” seçenekleri sana bir puan vermez.</p>' + button('Muhasebeye başla', 'resume', null, 'nr-primary') + '</section>' + knowledgeSummary();
    return '<div class="nr-section-heading"><span class="nr-eyebrow">YANITLARININ AYNASI</span><h3>Bugünkü muhaseben</h3><p>Bu bir makam, dindarlık veya kişilik hükmü değildir. Sadece son 30 gün için bildirdiğin davranışlara dayanan, değişebilen bir görünüm.</p></div>' + resultContent(result,c);
  }
  function resultContent(result,c) {
    const rows = resultDomains(result), recommendations = result.recommendations || {};
    return '<section class="nr-card nr-result-intro">' + progress(c.answered,c.total,'Profilde kullanılan yanıtlar') + '<p>' + c.skipped + ' soru değerlendirilemedi · ' + (c.total-c.done) + ' soru henüz yanıtlanmadı.</p><p class="nr-muted">' + (result.sufficient ? 'Bu öz bildirim, geçmiş davranışlarını hatırlama biçiminden etkilenir. Günlük bağlamını ve somut örneklerini birlikte düşün.' : 'Kapsam henüz sınırlı. Alan puanı için 6 davranış ve 1 durum yanıtı gerekir. Genel tema için her alan bu koşulu sağlamalı ve en az 96 geçerli yanıt bulunmalıdır.') + '</p>' + flagView(result.flags) + '<div class="nr-actions">' + button('Eksik sorulara dön', 'unanswered') + button('Özel not ekle', 'tab', 'journal') + '</div></section><section class="nr-card"><h3>12 alanda davranış görünümü</h3><p class="nr-muted">Çubuk yükseldikçe seçtiğin yanıtlar yapıcı davranışların daha sık olduğunu gösterir. Sayılar manevi derece değildir. Yeterli yanıt olmayan alanda puan gösterilmez; ayrıntı için alanı aç.</p><div class="nr-domain-results">' + rows.map(r => domainResult(r)).join('') + '</div></section>' + themeView(result) + '<div class="nr-grid nr-result-guides">' + guidanceCard('Düzelt', 'Zorlandığın noktada tek bir onarım seç.', recommendations.repair, 'Bu başlıkta bir öneri üretecek yeterli veya belirgin yanıt yok.') + guidanceCard('Korumaya devam et', 'İyi giden hâli gösterişe çevirmeden sürdür.', recommendations.maintain, 'Belirgin bir güçlü alan için yeterli yanıt görünmüyor. Bu, iyi davranışların olmadığı anlamına gelmez.') + guidanceCard('Alışkanlığını değiştir', 'Niyetini küçük bir davranışa bağla.', recommendations.change, 'Yanıtların tamamlandıkça somut alışkanlık önerileri burada görünür.') + guidanceCard('Zayıf düştüğün durumlar', 'Bunlar kesin tespit değil, araştıracağın ihtimaller.', recommendations.triggers, 'Bir bağlam önerisi için ilgili alanları tamamla.') + '</div>' + sevenDay(result.plan) + '<section class="nr-card"><h3>' + esc(result.adab && result.adab.title || 'Sonucu okuma edebi') + '</h3>' + arr(result.adab && result.adab.paragraphs).map(x => paragraph(x)).join('') + '</section>' + knowledgeSummary() + '<section class="nr-card"><h3>Yanıtları gözden geçir</h3><p class="nr-muted">Değerlendirme, yalnızca verdiğin yanıtlardan üretilir. Açıklamaları okuduktan sonra değiştirdiğin yanıtları kendi deneyiminle yeniden tart.</p><details class="nr-reading"><summary>Tüm yanıtlarım ve soru açıklamaları</summary>' + data.questions.filter(q => own(draft.answers,q.id)).map(q => '<article class="nr-evidence"><h4>' + esc(domain(q.domain).title) + '</h4><p>' + esc(q.text) + '</p><strong>' + esc(answerLabel(q,draft.answers[q.id])) + '</strong>' + paragraph(q.explanation, 'nr-muted') + sourceLinks(q.sourceIds) + button('Yanıtı gözden geçir', 'question', q.id, 'nr-link') + '</article>').join('') + '</details></section><div class="nr-actions">' + button('Yanıtlarımı yedekle', 'export') + button('Yeniden sorulara dön', 'resume') + '</div>';
  }
  function evidenceView(ids, rationale) {
    const qs = arr(ids).map(id => data.questions.find(q => q.id === (typeof id === 'string' ? id : id.id))).filter(q => q && own(draft.answers,q.id) && draft.answers[q.id] !== 'na');
    if (!qs.length) return '';
    return '<details class="nr-recommendation-evidence"><summary>Bu öneri hangi yanıtlara dayanıyor?</summary>' + qs.map(q => '<blockquote><p>' + esc(q.text) + '</p><strong>' + esc(answerLabel(q,draft.answers[q.id])) + '</strong>' + (rationale ? paragraph(q.explanation,'nr-muted') : '') + button('Yanıtımı gözden geçir', 'question', q.id, 'nr-link') + '</blockquote>').join('') + '</details>';
  }
  function flagView(flags) {
    if (!arr(flags).length) return '';
    return '<details class="nr-reading nr-flag-review"><summary>Bağlamını yeniden düşün: ' + flags.length + ' not</summary>' + flags.map(f => '<div class="nr-practice">' + paragraph(f.text) + evidenceView(f.questionIds,false) + '</div>').join('') + '</details>';
  }
  function resultDomains(result) {
    const collection = result.domains || result.domainResults || [];
    return data.domains.map(d => {
      const r = Array.isArray(collection) ? collection.find(x => x.id === d.id || x.domain === d.id) || {} : collection[d.id] || {};
      const qs = data.questions.filter(q => q.domain === d.id), answered = qs.filter(q => own(draft.answers,q.id) && draft.answers[q.id] !== 'na').length;
      const raw = r.score != null ? r.score : r.value != null ? r.value : r.mean;
      return Object.assign({},r,{id:d.id,title:d.title,score:raw != null && Number.isFinite(Number(raw)) ? clamp(raw,0,100) : null,answered:answered,total:qs.length});
    });
  }
  function domainResult(r) {
    const evidence = data.questions.filter(q => q.domain === r.id && own(draft.answers,q.id) && draft.answers[q.id] !== 'na').slice(0,3);
    return '<details class="nr-domain-result"><summary><span class="nr-line"><strong>' + esc(r.title) + '</strong><span>' + (r.score == null ? 'Yeterli yanıt yok' : Math.round(r.score) + '/100') + '</span></span><span class="nr-meter" aria-hidden="true"><span style="width:' + (r.score == null ? 0 : r.score) + '%"></span></span><span class="nr-muted nr-small">' + r.answered + '/' + r.total + ' yanıt · ' + (r.sufficient ? esc(r.band || 'Yanıt özeti') : 'En az 6 davranış + 1 durum yanıtı gerekli') + '</span><span class="nr-detail-cue">Yanıtlarını incele <span aria-hidden="true">⌄</span></span></summary><p>' + esc(domain(r.id).description) + '</p>' + (evidence.length ? '<h4>Bu alandan somut yanıtların</h4>' + evidence.map(q => '<blockquote><p>' + esc(q.text) + '</p><strong>' + esc(answerLabel(q,draft.answers[q.id])) + '</strong>' + button('Gözden geçir', 'question', q.id, 'nr-link') + '</blockquote>').join('') : '<p>Bu alanı yanıtlayınca somut örnekler burada görünür.</p>') + button('Bu alanı aç', 'domain', r.id) + '</details>';
  }
  function guidanceCard(title,intro,entries,empty) {
    return '<section class="nr-card"><h3>' + esc(title) + '</h3><p class="nr-muted">' + esc(intro) + '</p>' + (arr(entries).length ? entries.map(r => '<div class="nr-practice"><h4>' + esc(r.title) + '</h4>' + paragraph(r.text) + evidenceView(r.evidence,true) + '</div>').join('') : paragraph(empty,'nr-muted')) + '</section>';
  }
  function themeView(result) {
    const stage = result.stage || {id:'withheld',title:'Yanıt kapsamını tamamla',explanation:'Tema yorumu için yeterli alan kapsamı gerekiyor.'};
    return '<section class="nr-card nr-theme-card"><span class="nr-eyebrow">MERTEBE DİLİYLE DÜŞÜNME</span><h3>Bir makam değil, çalışma temaları</h3><p>Gelenekteki mertebe anlatımları bazı davranış örüntülerini düşünmek için kullanılabilir. Buradaki ilişki yorumîdir; bir mertebeye eriştiğini göstermez.</p><article class="nr-theme-focus"><h4>' + esc(stage.title) + '</h4>' + paragraph(stage.explanation) + '</article>' + paragraph(stage.limitations,'nr-muted') + '<p class="nr-muted nr-small">Râdıye, mardıyye ve kâmile başlıklarına otomatik yerleştirme yapılmaz.</p>' + button('Yedi mertebeyi kaynaklarıyla oku', 'tab', 'guide', 'nr-link') + '</section>';
  }
  function sevenDay(plan) {
    return '<section class="nr-card nr-plan"><span class="nr-eyebrow">YEDİ GÜNLÜK KÜÇÜK ADIM</span><h3>Bir haftalık çalışma</h3><p class="nr-muted">Bu bir manevi seviye programı değildir. Günlük birkaç dakika ve tek bir somut davranış yeter.</p>' + (arr(plan).length ? '<ol class="nr-days">' + plan.map(day => '<li><span>Gün ' + esc(day.day) + '</span><div><h4>' + esc(day.title) + '</h4><p>' + esc(day.action) + '</p></div></li>').join('') + '</ol>' : '<p>Bir alan için yeterli yanıt oluştuğunda, o alana dayanan yedi günlük plan burada görünür.</p>') + button('Gözlemimi not et', 'tab', 'journal') + '</section>';
  }
  function knowledgeSummary() {
    const answered = data.knowledge.filter(q => own(draft.knowledge,q.id) && draft.knowledge[q.id] !== 'na'), correct = answered.filter(q => draft.knowledge[q.id] === q.answer).length, unknown = data.knowledge.filter(q => draft.knowledge[q.id] === 'na').length;
    return '<section class="nr-card"><h3>Bilgi alanı · ayrı bir öğrenme özeti</h3><p>' + (answered.length ? answered.length + ' soruya yanıt verdin; ' + correct + ' yanıt kaynak açıklamasıyla örtüşüyor.' : 'Henüz değerlendirilecek bir bilgi yanıtı yok.') + (unknown ? ' ' + unknown + ' soruda “Henüz bilmiyorum” seçtin.' : '') + ' Bu sayı davranış profiline katılmaz.</p><div class="nr-actions">' + button('Bilgi sorularını aç', 'knowledge') + button('Kavramları tekrar oku', 'tab', 'guide') + '</div></section>';
  }
  function sourcesView() {
    return '<div class="nr-section-heading"><span class="nr-eyebrow">AÇIK DAYANAKLAR · AÇIK SINIRLAR</span><h3>Kaynaklar ve yöntem</h3><p>Kaynaklar, kavram ve eğitim çerçevesi içindir. Buradaki sorular ve puanlama, kaynaklardan alınmış veya bilimsel olarak doğrulanmış bir ölçek değildir.</p></div><section class="nr-card"><h3>Nasıl değerlendirilir?</h3><p>Davranış sıklığı ve durum soruları aynı 12 alanda özetlenir. Farklı yönde yazılmış sorular uygun yönde çevrilir. “Değerlendiremiyorum” ve boş yanıtlar puana katılmaz. Her alanın yanıt sayısı görünür tutulur.</p><p>Alan puanı için en az 6 davranış ve 1 durum yanıtı gerekir. Alan ortalamasında davranışlar %80, durumlar %20 ağırlıklıdır. Genel tema için 12 alanın tümü bu koşulu sağlamalı ve en az 96 geçerli yanıt bulunmalıdır.</p><p>Genel değer, 12 alanın eşit ağırlıklı ortalamasıdır. Eğitim amacıyla seçilen tema eşikleri 35, 55 ve 75’tir; mutmainne teması için hiçbir alan 60’ın altında olmamalıdır. En az dört belirgin yanıt çifti farkında tema yorumu bekletilir. Bu eşikler bilimsel olarak doğrulanmış değildir.</p><p>Bilgi soruları ve özel notlar davranış puanını değiştirmez. Tutarlılık uyarısı bir yalan tespiti değildir; yalnızca yeniden düşünme davetidir. Mertebe eşleştirmeleri varsa, yorumî çalışma temaları olarak okunur.</p></section>' + arr(data.sources).map(s => '<article class="nr-card nr-source" id="nr-source-' + esc(s.id) + '"><span class="nr-eyebrow">KAYNAK NOTU</span><h3>' + esc(s.title) + '</h3>' + (s.author ? paragraph(s.author,'nr-muted') : '') + '<dl>' + [['Yer / bölüm',s.locator],['Erişim',s.access],['Kontrol edilen kapsam',s.verifiedScope],['Sınır',s.limits]].filter(x => x[1]).map(x => '<dt>' + esc(x[0]) + '</dt><dd>' + esc(label(x[1])) + '</dd>').join('') + '</dl>' + (/^https?:\/\//i.test(s.url || '') ? '<a class="nr-btn" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">Kaynağı aç <span aria-hidden="true">↗</span></a>' : '') + '</article>').join('');
  }
  function onInput(event) { const el = event.target.closest('[data-nr-reflection]'); if (!el) return; draft.reflections[el.dataset.nrReflection] = el.value.slice(0,2000); persist(); }
  function onChange(event) {
    if (event.target.id === 'nr-domain-select') selectDomain(event.target.value);
    if (event.target.id === 'nr-import' && event.target.files && event.target.files[0]) importFile(event.target.files[0]);
  }
  function selectDomain(id) { const index = data.questions.findIndex(q => q.domain === id); if (index < 0) return; draft.cursor = index; draft.subtype = 'behavior'; mode = 'profile'; active = 'test'; persist(); render(); focusContent(); }
  function onClick(event) {
    const el = event.target.closest('[data-nr-action]'); if (!el || !host.contains(el)) return;
    const action = el.dataset.nrAction, value = el.dataset.nrValue;
    if (action === 'tab') return move(value,true);
    if (action === 'notice') { notice = ''; return render(); }
    if (action === 'resume') { mode = 'profile'; draft.subtype = 'behavior'; persist(); return move('test',true); }
    if (action === 'pause') { draft.subtype = 'behavior'; persist(); active = 'home'; notice = saveError ? 'Taşınabilir bir yedek alarak kaybı önleyebilirsin.' : 'Kaldığın yer kaydedildi. Aynı tarayıcıdan devam edebilirsin.'; render(); return focusContent(); }
    if (action === 'domain') return selectDomain(value);
    if (action === 'answer') {
      const q = data.questions[draft.cursor]; if (el.dataset.nrId !== q.id) return;
      draft.answers[q.id] = q.kind === 'behavior' && value !== 'na' ? Number(value) : value; persist(); render();
      const target = Array.from(host.querySelectorAll('[data-nr-action="answer"]')).find(x => x.dataset.nrValue === value); if (target) target.focus({preventScroll:true}); return;
    }
    if (action === 'clear-answer') { delete draft.answers[value]; persist(); return render(); }
    if (action === 'previous' || action === 'next') {
      if (action === 'next' && draft.cursor === data.questions.length-1) return move('result',true);
      draft.cursor = clamp(draft.cursor + (action === 'next' ? 1 : -1),0,data.questions.length-1); persist(); render(); return focusContent();
    }
    if (action === 'unanswered') { const i = data.questions.findIndex(q => !own(draft.answers,q.id)); draft.cursor = i < 0 ? 0 : i; mode = 'profile'; persist(); return move('test',true); }
    if (action === 'question') { const i = data.questions.findIndex(q => q.id === value); if (i >= 0) draft.cursor = i; mode = 'profile'; persist(); return move('test',true); }
    if (action === 'knowledge') { mode = 'knowledge'; const first = data.knowledge.findIndex(q => !own(draft.knowledge,q.id)); if (first >= 0) knowledgeCursor = first; draft.subtype = 'knowledge'; persist(); return move('test',true); }
    if (action === 'knowledge-answer') { const q = data.knowledge[knowledgeCursor]; if (el.dataset.nrId !== q.id) return; draft.knowledge[q.id] = value; persist(); render(); const target = Array.from(host.querySelectorAll('[data-nr-action="knowledge-answer"]')).find(x => x.dataset.nrValue === value); if (target) target.focus({preventScroll:true}); return; }
    if (action === 'knowledge-previous' || action === 'knowledge-next') { if (action === 'knowledge-next' && knowledgeCursor === data.knowledge.length-1) { active = 'result'; notice = 'Bilgi sorularının sonuna geldin. Yanıtladığın soruların öğrenme özeti davranış puanını değiştirmez.'; render(); return focusContent(); } knowledgeCursor = clamp(knowledgeCursor+(action === 'knowledge-next' ? 1 : -1),0,data.knowledge.length-1); render(); return focusContent(); }
    if (action === 'source') { active = 'sources'; render(); const source = document.getElementById('nr-source-'+value); if (source) { source.setAttribute('tabindex','-1'); source.focus({preventScroll:true}); scrollToView(source); } return; }
    if (action === 'data') { const panel = host.querySelector('#nr-data'); panel.open = true; scrollToView(panel); return; }
    if (action === 'export') return exportFile();
    if (action === 'import') { importInput.click(); return; }
    if (action === 'reset') { if (!window.confirm('Bu nefs çalışmasının yanıtları ve özel notları silinsin mi? Günlük sıfat muhasebesi ve diğer uygulama kayıtların korunur.')) return; draft = model.newDraft(); active = 'home'; mode = 'profile'; knowledgeCursor = 0; persist(); notice = saveError ? 'Ekrandaki çalışma sıfırlandı; eski kayıt silinemedi. Kayıt uyarısını kontrol et.' : 'Bu çalışma sıfırlandı.'; return render(); }
    if (action === 'legacy') return openLegacyMuh();
  }
  function exportFile() {
    if (!window.confirm('Bu dosya verdiğin yanıtları ve özel notlarını içerecek. Yedeği indirmek istiyor musun?')) return;
    try {
      const clean = model.sanitizeDraft(draft,data);
      const blob = new Blob([JSON.stringify({app:'SÜKÛN Nefs',version:'r948',exportedAt:new Date().toISOString(),draft:clean},null,2)],{type:'application/json'});
      const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'sukun-nefs-' + new Date().toISOString().slice(0,10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); notice = 'Yedek indirmesi hazırlandı. Dosya kişisel yanıtlarını ve notlarını içerir.';
    } catch (_) { notice = 'Yedek hazırlanamadı. Tarayıcının dosya indirme iznini kontrol et.'; }
    render();
  }
  async function importFile(file) {
    if (file.size > 1024*1024) { notice = 'Bu dosya çok büyük. 1 MB altında bir SÜKÛN nefs yedeği seç.'; return render(); }
    try {
      const parsed = JSON.parse(await file.text()); const raw = parsed && parsed.draft ? parsed.draft : parsed;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.schema !== 1 || raw.version !== 'r948' || !raw.answers || typeof raw.answers !== 'object' || Array.isArray(raw.answers)) throw new Error('format');
      const clean = model.sanitizeDraft(raw,data);
      const n = Object.keys(clean.answers || {}).length, k = Object.keys(clean.knowledge || {}).length, r = Object.keys(clean.reflections || {}).filter(id => clean.reflections[id]).length;
      if (!window.confirm('Yedekte ' + n + ' davranış yanıtı, ' + k + ' bilgi yanıtı ve ' + r + ' özel not var. Mevcut nefs çalışmasının yerine yüklensin mi?')) { if (importInput) importInput.value = ''; return; }
      draft = clean; active = 'home'; mode = 'profile'; persist(); notice = saveError ? 'Yedek açıldı ancak bu tarayıcıda kaydedilemedi.' : 'Yedek içe aktarıldı. Kaldığın yerden devam edebilirsin.';
    } catch (_) { notice = 'Dosya okunamadı veya geçerli bir nefs yedeği değil. Mevcut kayıtların değiştirilmedi.'; }
    render();
  }
  function openLegacyMuh() {
    if (typeof window.SukunNefsLegacyMuhR948 === 'function') return window.SukunNefsLegacyMuhR948();
    if (typeof window.muhOpen === 'function') return window.muhOpen(true);
    const legacy = document.getElementById('r948LegacyNefs'); if (legacy) legacy.open = true;
    const buttonEl = document.getElementById('muhBtn'); if (buttonEl) buttonEl.click();
  }
  function open(tab) {
    if (!init()) return false;
    // Focus mode deliberately hides the tools container. Leaving it is an explicit user choice.
    if (document.body.classList.contains('sukun-tefekkur-mode')) {
      if (!window.confirm('Nefs muhasebesi normal görünümde açılır. Tefekkür görünümünden çıkıp nefs muhasebesini açmak ister misin?')) return false;
      const exitControl = document.getElementById('r920TefExit');
      if (exitControl) exitControl.click();
      else if (window.SUKUN_TEFEKKUR && typeof window.SUKUN_TEFEKKUR.exit === 'function') window.SUKUN_TEFEKKUR.exit();
      if (document.body.classList.contains('sukun-tefekkur-mode')) { window.alert('Önce Tefekkürden Çık düğmesiyle normal görünüme dön; ardından Nefs muhasebesini aç.'); return false; }
    }
    const nav = document.querySelector('.tab[data-t="zkr"]'); if (nav && !nav.classList.contains('act')) nav.click();
    // The canonical tools toggle only changes presentation; it does not issue a transport command.
    const more = document.getElementById('r920More'); if (more && !document.body.classList.contains('r920-details-open')) more.click();
    let parent = host.parentElement; while (parent) { if (parent.id !== 'tab-zkr' && parent.closest('#tab-zkr')) parent.classList.add('r948-nefs-path'); if (parent.tagName === 'DETAILS') { parent.open = true; parent.hidden = false; parent.classList.add('r948-nefs-revealed'); if (getComputedStyle(parent).display === 'none') parent.style.setProperty('display','block','important'); } parent = parent.parentElement; }
    move(tab || 'home',false);
    if (!host.getClientRects().length || getComputedStyle(host).visibility === 'hidden') { window.alert('Nefs bölümü bu görünümde açılamadı. Zikir sekmesindeki Kayıtlar ve diğer araçlar bölümünü açıp yeniden dene.'); return false; }
    scrollToView(host);
    // Two bounded frames let the legacy lazy disclosure layout settle. A newer render cancels this jump.
    const revision = renderRevision;
    window.requestAnimationFrame(function () { window.requestAnimationFrame(function () {
      if (revision !== renderRevision || !host.isConnected || !host.getClientRects().length) return;
      const heading = host.querySelector('.nr-header'); if (heading) scrollToView(heading);
    }); });
    return true;
  }
  window.SukunNefsR948 = {open:open,render:render,openLegacyMuh:openLegacyMuh,getDraft:function(){ return initialized ? model.sanitizeDraft(draft,data) : null; }};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
