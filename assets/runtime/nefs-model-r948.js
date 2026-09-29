/* Sükûn r948 — local, pure self-reflection scoring and draft validation. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SukunNefsModelR948 = api;
})(typeof window === 'object' ? window : null, function () {
  'use strict';

  var VERSION = 'r948';
  var TOTAL = 120;
  var DOMAIN_IDS = ['niyet', 'tevazu', 'ofke', 'dil', 'hak', 'merhamet', 'haz', 'haset', 'sabir', 'sukur', 'istikamet', 'basiret'];
  var SUBTYPES = ['behavior', 'scenario', 'knowledge', 'reflection'];
  var LIMITATION = 'Bu, yalnızca seçtiğin cevaplara dayanan sınırlı bir öz-bildirim okumasıdır; manevî makamını, imanını veya Allah’ın rızasını belirlemez. Eşikler pedagojik örnektir; psikometrik olarak doğrulanmış değildir.';

  function plain(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    var proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }
  function own(value, key) {
    if (!plain(value)) return undefined;
    var descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value') ? descriptor.value : undefined;
  }
  function safeId(id) {
    return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(id) && id !== '__proto__' && id !== 'constructor' && id !== 'prototype';
  }
  function list(data, key, limit) {
    var value = own(data, key);
    return Array.isArray(value) ? value.slice(0, limit).filter(plain) : [];
  }
  function text(value, fallback) { return typeof value === 'string' && value.trim() ? value.slice(0, 4000) : (fallback || ''); }
  function typeOf(question) { return own(question, 'kind'); }
  function domainOf(question) { return own(question, 'domain'); }
  function options(question) { return list(question, 'options', 12); }
  function answerValue(question, answer) {
    if (answer === 'na') return null;
    if (typeOf(question) === 'behavior') {
      if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer > 4) return null;
      return { answer: answer, normalized: (own(question, 'reverse') === true ? 4 - answer : answer) / 4 };
    }
    if (typeOf(question) === 'scenario' && typeof answer === 'string') {
      var found = options(question).find(function (option) { return own(option, 'id') === answer; });
      var value = found && own(found, 'value');
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3) {
        return { answer: answer, normalized: value / 3 };
      }
    }
    return null;
  }
  function validKnowledge(question, answer) {
    return typeof answer === 'string' && options(question).some(function (option) { return own(option, 'id') === answer; });
  }
  function getQuestions(data) {
    var seen = Object.create(null);
    return list(data, 'questions', TOTAL).filter(function (q) {
      var id = own(q, 'id');
      if (!safeId(id) || seen[id] || DOMAIN_IDS.indexOf(domainOf(q)) < 0 || ['behavior', 'scenario'].indexOf(typeOf(q)) < 0) return false;
      seen[id] = true;
      return true;
    });
  }
  function newDraft() {
    return { schema: 1, version: VERSION, answers: {}, knowledge: {}, reflections: {}, cursor: 0, subtype: 'behavior', updatedAt: null };
  }
  function sanitizeDraft(raw, data) {
    var out = newDraft();
    if (!plain(raw) || own(raw, 'schema') !== 1 || own(raw, 'version') !== VERSION) return out;
    var answers = own(raw, 'answers');
    getQuestions(data).forEach(function (q) {
      var id = own(q, 'id');
      var answer = own(answers, id);
      if (answer === 'na' || answerValue(q, answer)) out.answers[id] = answer;
    });
    var knowledge = own(raw, 'knowledge');
    list(data, 'knowledge', 28).forEach(function (q) {
      var id = own(q, 'id');
      var answer = own(knowledge, id);
      if (safeId(id) && (answer === 'na' || validKnowledge(q, answer))) out.knowledge[id] = answer;
    });
    var reflections = own(raw, 'reflections');
    list(data, 'reflections', 16).forEach(function (q) {
      var id = own(q, 'id');
      var note = own(reflections, id);
      if (safeId(id) && typeof note === 'string') out.reflections[id] = note.slice(0, 2000);
    });
    var cursor = own(raw, 'cursor');
    if (typeof cursor === 'number' && Number.isInteger(cursor) && cursor >= 0 && cursor < TOTAL) out.cursor = cursor;
    var subtype = own(raw, 'subtype');
    if (SUBTYPES.indexOf(subtype) >= 0) out.subtype = subtype;
    var updatedAt = own(raw, 'updatedAt');
    if (typeof updatedAt === 'string' && /^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(updatedAt)) {
      var time = Date.parse(updatedAt);
      if (Number.isFinite(time) && time >= Date.UTC(2000, 0, 1) && time < Date.UTC(2100, 0, 1) && new Date(time).toISOString().replace('.000Z', 'Z') === updatedAt.replace('.000Z', 'Z')) out.updatedAt = updatedAt;
    }
    return out;
  }
  function mean(values) { return values.reduce(function (sum, value) { return sum + value; }, 0) / values.length; }
  function round(value) { return Math.round(value * 10) / 10; }
  function band(score) {
    if (score === null) return 'Yeterli cevap yok';
    if (score < 35) return 'Öncelikli pratik alanı';
    if (score < 55) return 'Düzenli emek alanı';
    if (score < 75) return 'Geliştirilebilir alışkanlıklar';
    return 'Korunabilecek alışkanlıklar';
  }
  function item(domain, title, value, evidence) {
    return { domain: domain.id, title: title, text: value, evidence: evidence.map(function (entry) { return entry.id; }).slice(0, 3) };
  }
  function analyze(data, answers, knowledge) {
    var questions = getQuestions(data);
    var byId = Object.create(null);
    var answered = 0;
    var na = 0;
    questions.forEach(function (q) {
      var id = own(q, 'id');
      var answer = own(answers, id);
      if (answer === 'na') na += 1;
      var value = answerValue(q, answer);
      if (!value) return;
      answered += 1;
      byId[id] = { id: id, text: text(own(q, 'text')), answer: value.answer, normalized: value.normalized, type: typeOf(q), domain: domainOf(q) };
    });
    var definitions = list(data, 'domains', 12);
    var rawScores = Object.create(null);
    var domains = DOMAIN_IDS.map(function (id) {
      var definition = definitions.find(function (d) { return own(d, 'id') === id; }) || {};
      var domainQuestions = questions.filter(function (q) { return domainOf(q) === id; });
      var evidence = domainQuestions.map(function (q) { return byId[own(q, 'id')]; }).filter(Boolean);
      var behavior = evidence.filter(function (e) { return e.type === 'behavior'; });
      var scenario = evidence.filter(function (e) { return e.type === 'scenario'; });
      var sufficient = domainQuestions.filter(function (q) { return typeOf(q) === 'behavior'; }).length === 8 && domainQuestions.filter(function (q) { return typeOf(q) === 'scenario'; }).length === 2 && behavior.length >= 6 && scenario.length >= 1;
      var score = sufficient ? (mean(behavior.map(function (e) { return e.normalized; })) * 0.8 + mean(scenario.map(function (e) { return e.normalized; })) * 0.2) * 100 : null;
      rawScores[id] = score;
      return { id: id, title: text(own(definition, 'title'), id), score: score === null ? null : round(score), band: band(score), answered: evidence.length, total: 10, behaviorAnswered: behavior.length, scenarioAnswered: scenario.length, sufficient: sufficient, evidence: evidence };
    });
    var sufficient = questions.length === TOTAL && definitions.length === 12 && domains.every(function (domain) { return domain.sufficient; }) && answered >= 96;
    var overallRaw = sufficient ? mean(DOMAIN_IDS.map(function (id) { return rawScores[id]; })) : null;
    var flags = [];
    var seenPairs = Object.create(null);
    list(data, 'consistencyPairs', 60).forEach(function (pair) {
      var a = own(pair, 'a');
      var b = own(pair, 'b');
      if (!safeId(a) || !safeId(b) || a === b || !byId[a] || !byId[b]) return;
      var key = [a, b].sort().join('|');
      if (seenPairs[key]) return;
      seenPairs[key] = true;
      if (Math.abs(byId[a].normalized - byId[b].normalized) >= 0.75) flags.push({ code: 'context-review', text: text(own(pair, 'note'), 'Bu iki cevabı yaşandıkları bağlamı düşünerek yeniden gözden geçir.') + ' Farklı bağlamlar bu ayrılığı açıklayabilir; bu bir yalan veya tanı tespiti değildir.', questionIds: [a, b] });
    });
    var pairFlagCount = flags.length;
    if (answered >= 96 && Object.keys(byId).every(function (id) { return byId[id].normalized === 1; })) flags.push({ code: 'uniform-ideal', text: 'Cevapların tamamı aynı ideal yöne işaret ediyor. Son haftalardan somut örnekleri ve istisnaları hatırlayarak bir kez daha bakabilirsin. Bu örüntü tek başına bir yargı, üstünlük veya dürüstlük ölçüsü değildir.', questionIds: [] });
    var stage;
    if (!sufficient) {
      stage = { id: 'withheld', title: 'Yorum için kapsamı tamamla', explanation: 'Bir tema yorumu için her alanda en az 6 davranış ve 1 senaryo cevabı, toplamda en az 96 geçerli cevap gerekiyor. Boş ve “değerlendiremiyorum” cevapları puanlanmaz.', limitations: LIMITATION };
    } else if (pairFlagCount >= 4) {
      stage = { id: 'withheld', title: 'Yanıtları gözden geçir', explanation: 'En az dört cevap çiftinde bağlamı yeniden incelemeyi gerektiren farklar var. Alan puanların korunur; cevaplarını gözden geçirene kadar genel tema yorumu yapılmaz.', limitations: LIMITATION };
    } else {
      var weakest = Math.min.apply(Math, DOMAIN_IDS.map(function (id) { return rawScores[id]; }));
      var stageId = overallRaw < 35 ? 'emmare' : overallRaw < 55 ? 'levvame' : overallRaw < 75 || weakest < 60 ? 'mulhime' : 'mutmainne';
      var stages = {
        emmare: ['Emmâre ile mücadele temaları', 'Cevapların dürtüyü fark etme, duraklama ve davranışı onarma üzerinden okunan emmâre ile mücadele temalarıyla örtüşüyor. Bu bir kişilik etiketi veya değişmez hüküm değildir.'],
        levvame: ['Levvâme temaları', 'Cevapların öz-muhasebe, hatayı fark etme ve onarım arayışı üzerinden okunan levvâme temalarıyla örtüşüyor. Farkındalığı küçük ve sürdürülebilir davranışlarla destekleyebilirsin.'],
        mulhime: ['Mülhime temaları', 'Cevapların iyi yönelişi davranışta sürdürme ve ayırt etme üzerinden okunan mülhime temalarıyla örtüşüyor.' + (overallRaw >= 75 && weakest < 60 ? ' Genel ortalama yüksek olsa da bazı alanlar daha fazla özen istiyor; bu farklar genel yorumda dikkate alındı.' : ' Alanlar arasındaki farklara göre küçük bir pratik seçebilirsin.')],
        mutmainne: ['Mutmainne temaları', 'Cevapların süreklilik, ölçülülük ve sükûnet üzerinden okunan mutmainne temalarıyla örtüşüyor. Bu ifade bir makama eriştiğini veya bu hâlin kalıcı olduğunu söylemez.']
      };
      stage = { id: stageId, title: stages[stageId][0], explanation: stages[stageId][1], limitations: LIMITATION };
    }
    var scored = domains.filter(function (domain) { return domain.score !== null; }).sort(function (a, b) { return rawScores[a.id] - rawScores[b.id] || DOMAIN_IDS.indexOf(a.id) - DOMAIN_IDS.indexOf(b.id); });
    var priorities = scored.filter(function (domain) { return rawScores[domain.id] < 75; }).slice(0, 2);
    var strengths = scored.filter(function (domain) { return rawScores[domain.id] >= 75; }).slice().reverse().slice(0, 2);
    var recommendations = { repair: [], maintain: [], change: [], triggers: [] };
    function definitionFor(domain) { return definitions.find(function (d) { return own(d, 'id') === domain.id; }) || {}; }
    priorities.forEach(function (domain) {
      var definition = definitionFor(domain);
      var evidence = domain.evidence.slice().sort(function (a, b) { return a.normalized - b.normalized; }).filter(function (e) { return e.normalized < 0.75; });
      if (!evidence.length) return;
      recommendations.repair.push(item(domain, domain.title + ': küçük bir onarım', text(own(definition, 'practice'), 'Bu alanla ilgili yakın zamandan bir olayı yaz; güvenli ve mümkünse sana ait tek bir davranışı düzelt.'), evidence));
      recommendations.change.push(item(domain, domain.title + ': bir alışkanlığı değiştir', text(own(definition, 'change'), 'Bir sonraki benzer anda cevap vermeden önce üç nefeslik ara ver; seçtiğin küçük davranışı dene.'), evidence));
      recommendations.triggers.push(item(domain, domain.title + ': bağlamı fark et', text(own(definition, 'trigger'), 'Bu cevabın hangi ortam, yorgunluk veya baskı altında değiştiğini fark et; kendini suçlamadan bir örnek yaz.'), evidence));
    });
    strengths.forEach(function (domain) {
      var evidence = domain.evidence.slice().sort(function (a, b) { return b.normalized - a.normalized; }).filter(function (e) { return e.normalized >= 0.75; });
      if (!evidence.length) return;
      recommendations.maintain.push(item(domain, domain.title + ': şükürle koru', text(own(definitionFor(domain), 'maintain'), 'Bu alandaki yararlı davranışı bugün küçük bir örnekle sürdür; bunu başkalarına üstünlük sebebi yapma.'), evidence));
    });
    var focuses = priorities.length ? priorities : scored.slice(0, 2);
    var plan = [];
    if (focuses.length) {
      var first = focuses[0];
      var second = focuses[1] || first;
      var preserving = !priorities.length;
      var firstPractice = text(own(definitionFor(first), preserving ? 'maintain' : 'practice'), 'Bu alanda bugün uygulanabilir tek bir küçük davranış seç.');
      var secondPractice = text(own(definitionFor(second), preserving ? 'maintain' : 'practice'), 'Bu alanda bugün uygulanabilir tek bir küçük davranış seç.');
      plan = [
        { day: 1, title: first.title + ': bir olay', action: 'İki dakika ayır. ' + first.title + ' alanından son haftaya ait tek bir olay ve kendi seçimin hakkında iki cümle yaz.' },
        { day: 2, title: first.title + ': küçük adım', action: firstPractice + ' Bugün yalnızca bir kez dene; sonucu bir cümleyle kaydet.' },
        { day: 3, title: second.title + ': bağlam', action: 'İki dakika ayır. ' + second.title + ' alanındaki bir anı seç; o anda etkili olan şartı ve değiştirebileceğin tek davranışı yaz.' },
        { day: 4, title: second.title + ': küçük adım', action: secondPractice + ' Bugün yalnızca bir kez dene; sonucu bir cümleyle kaydet.' },
        { day: 5, title: 'Duraklama provası', action: first.title + ' veya ' + second.title + ' ile ilgili bir tetikleyici fark edersen üç yavaş nefeslik ara ver. Güvenli ise seçtiğin küçük davranışı uygula.' },
        { day: 6, title: 'Şükür ve hak', action: 'Bugün bir iyiliği fark edip şükret. Sana ait somut bir haksızlık varsa güvenli ve mümkün olan tek bir telafi adımını belirle; zarar verene ulaşmak zorunda değilsin.' },
        { day: 7, title: 'İki dakikalık muhasebe', action: first.title + ' ve ' + second.title + ' için birer somut örneğe bak. İşe yarayan tek adımı gelecek haftaya taşı; zorlandığın yerde planı küçült.' }
      ];
    }
    var knowledgeAnswered = 0;
    var knowledgeCorrect = 0;
    var knowledgeQuestions = list(data, 'knowledge', 28);
    knowledgeQuestions.forEach(function (q) {
      var answer = own(knowledge, own(q, 'id'));
      if (!validKnowledge(q, answer)) return;
      knowledgeAnswered += 1;
      if (answer === own(q, 'answer')) knowledgeCorrect += 1;
    });
    return {
      answered: answered, total: TOTAL, na: na, coverage: answered / TOTAL, sufficient: sufficient,
      overall: overallRaw === null ? null : round(overallRaw), domains: domains, stage: stage, flags: flags,
      recommendations: recommendations, plan: plan,
      adab: { title: 'Sonucu okuma edebi', paragraphs: [
        'Yüksek değerler üstünlük belgesi değildir. İyiliği şükür ve tevazu ile koru; hakkını ihlal ettiğin birinin hakkını mümkün ve güvenli biçimde onarmayı ihmal etme.',
        'Düşük değerler ümitsizlik veya kendini mahkûm etme sebebi değildir. Bir küçük adım seç; hastalık, travma, baskı ve maruz kalınan zarar bir ahlâk kusuru sayılmaz. Uğradığın haksızlığın sorumluluğu sana yüklenemez.',
        'Bu sonuç imanını, manevî makamını veya ilâhî rızayı tasdik etmez. Kendini veya başkasını bu değerlerle etiketleme; ihtiyaç duyduğunda ehil bir rehberin ya da uygun bir uzmanın desteğini al.',
        'Râdıye, mardıyye ve kâmile gibi daha ileri atlas başlıklarına hiçbir puanla yerleştirme yapılmaz. Atlas açıklamaları eğitim içindir; bu öz-bildirim ehil rehberliğin yerini tutmaz.'
      ] },
      knowledge: { answered: knowledgeAnswered, total: knowledgeQuestions.length, correct: knowledgeCorrect, explanation: 'Kavram bilgisi ayrı gösterilir; öz-muhasebe puanını veya tema yorumunu yükseltmez.' },
      method: {
        version: VERSION, validated: false, evidence: 'Sınırlı öz-bildirim; pedagojik örnek eşikler',
        behaviorWeight: 0.8, scenarioWeight: 0.2, minimumBehaviorPerDomain: 6, minimumScenarioPerDomain: 1, minimumOverallAnswers: 96,
        thresholds: { emmareBelow: 35, levvameBelow: 55, mulhimeBelow: 75, mutmainneMinimumWeakest: 60 },
        withheldForPairFlagsAt: 4, confidence: 'Sayısal güvenilirlik veya geçerlilik iddiası yoktur.',
        explanation: 'Davranış cevapları 0–4 ölçeğinde yönü düzeltilerek, senaryolar açık seçenek eşlemesiyle 0–3 ölçeğinde hesaplanır. Her yeterli alanda davranış ortalaması %80, senaryo ortalaması %20 ağırlıklıdır. Genel değer yeterli alanların eşit ağırlıklı ortalamasıdır. Boş, geçersiz ve değerlendirilemeyen cevaplar sıfır sayılmaz. Bilgi ve serbest yansıma cevapları bu hesaba girmez.'
      }
    };
  }
  return Object.freeze({ newDraft: newDraft, sanitizeDraft: sanitizeDraft, analyze: analyze });
});
