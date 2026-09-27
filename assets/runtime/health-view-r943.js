/* r944 — read-only health presenter. Network requests require the AI button.
 * Only aiPayload's explicit aggregate allowlist can leave this panel. */
(() => {
  'use strict';
  if (window.SukunHealthViewR943) return;
  const states = new WeakMap();
  const STATUSES = new Set(['PASS', 'WARN', 'FAIL', 'OBSERVED', 'NOT_MEASURED']);
  const LABEL = {PASS:'Doğrulandı', WARN:'Dikkat', FAIL:'Sorun bulundu', OBSERVED:'Gözlem var', NOT_MEASURED:'Ölçülmedi', PENDING:'Kontrol bekliyor'};
  const ICON = {PASS:'✓', WARN:'!', FAIL:'!', OBSERVED:'◌', NOT_MEASURED:'—', PENDING:'◌'};
  const GROUPS = [
    {id:'files',label:'Sürüm ve dosyalar',icon:'◈',codes:['BUILD','SW_IDENTITY','SW_CACHE_COMPLETE','RUNTIME_INTEGRITY','SW_RESPONSE']},
    {id:'audio',label:'Ses ve zikir akışı',icon:'♪',codes:['SESSION_OBSERVATION','TEMPO_RANGE','AUDIO_CONSISTENCY','BACKGROUND_HANDOFF','BACKGROUND_FX','AUDIO_CONTEXTS']},
    {id:'response',label:'Tepki ve dokunma',icon:'↗',codes:['INPUT_DELIVERY','LONG_TASKS','LATENCY_ATTRIBUTION','EARLY_RUNTIME_ERRORS','HEALTH_COLLECTION']},
    {id:'storage',label:'Bellek ve depolama',icon:'▤',codes:['PERSISTENCE','STORAGE_QUOTA','HEAP']},
    {id:'ai',label:'AI bağlantıları',icon:'✦',codes:['AI_CONNECTIONS']},
    {id:'device',label:'Cihaz ve ekran kilidi',icon:'◉',codes:['DEVICE_AUDIO','TTS_CAPABILITY']}
  ];
  const OPTIONAL = new Set(['SW_RESPONSE','HEALTH_COLLECTION','LATENCY_ATTRIBUTION','BACKGROUND_HANDOFF']);
  const META = {
    BUILD:['Uygulama sürümü','Sürüm bilgisi okunabildi.','Sürüm bilgisi alınamadı; testi yeniden çalıştırın.'],
    SW_IDENTITY:['Açık sayfa ve çevrimdışı sürüm','Sayfa ile çevrimdışı çalışan sürüm karşılaştırıldı.','Sürüm farklıysa sesinizi durdurup uygulamadaki Güncelle düğmesini kullanın.'],
    SW_CACHE_COMPLETE:['Çevrimdışı temel dosyalar','Çevrimdışı kullanım için gereken dosyalar denetlendi.','Bağlantınızı kontrol edip testi yeniden çalıştırın; sürüm sorunu sürerse raporu indirin.'],
    RUNTIME_INTEGRITY:['Dosya bütünlüğü','Yüklenen temel dosyalar sürümde beklenen dosyalarla karşılaştırıldı.','Bağlantınızı kontrol edip testi yeniden çalıştırın. İndirilemeyen dosya, tek başına bozuk dosya demek değildir.'],
    SW_RESPONSE:['Çevrimdışı motorun yanıtı','Çevrimdışı motor beklenen sürede yanıt vermedi.','Uygulama yoğun olabilir. Biraz bekleyip testi yeniden çalıştırın.'],
    SESSION_OBSERVATION:['Zikir oturumu','Uygulamanın oturum bilgisi gözlendi. Bu, sesin duyulduğunu doğrulamaz.','Zikir akışını normal kullanım sırasında gözlemleyin; takılma olursa Sorun şimdi oldu düğmesine dokunun.'],
    TEMPO_RANGE:['Tempo ayarı','Tempo değeri desteklenen aralık açısından kontrol edildi.','Tempo ayarı beklenen aralık dışında. Raporu indirip destek için saklayın.'],
    AUDIO_CONSISTENCY:['Ses akışının uyumu','Ses kaynaklarının uygulama içindeki uyumu incelendi.','Birden fazla ses veya sessizlik fark ederseniz Sorun şimdi oldu düğmesine dokunun.'],
    BACKGROUND_HANDOFF:['Son arka plan ses aktarımı','Son arka plan denemesinin sonucu gözlendi.','Ekrana dönünce sesin başlaması, arka planda devam ettiğini göstermez. Raporu indirin; kayıtları veya verileri silmeyin.'],
    BACKGROUND_FX:['Yankı ve ses efektleri','Ses efektlerinin hangi yoldan çalıştığı gözlendi.','Alternatif ses yolu ekran kilidinde kısıtlanabilir. Kısa bir kilit ekranı denemesinde sesi dinleyin.'],
    AUDIO_CONTEXTS:['Tarayıcı ses motorları','Tarayıcının ses motorları gözlendi; bu bir dinleme testi değildir.','Ses duyulmuyorsa cihazın ses düzeyini ve bağlı kulaklığı kontrol edin.'],
    INPUT_DELIVERY:['Dokunma ve kaydırma','Dokunma olayları gözlendi. Kaydırırken iptal olan dokunma normal olabilir.','Bir düğme yanıt vermiyorsa yeniden dokunup hemen Sorun şimdi oldu düğmesine basın.'],
    LONG_TASKS:['Ekranın yanıt hızı','Son iki dakikadaki uzun işlemler kontrol edildi.','Dokunmalar gecikiyorsa yoğun işlem bittikten sonra yeniden deneyin. Tek ölçüm sürekli donma anlamına gelmez.'],
    LATENCY_ATTRIBUTION:['Gecikme nerede gözlendi?','Desteklenen tarayıcıda dokunma ve görüntü hazırlığı süreleri gözlenir; bu tek başına hatanın nedenini kanıtlamaz.','Takılma yaşadığınız işlemi normal şekilde kullanıp testi çalıştırın. Kaynak dosyası ve süreler teknik rapora eklenir; desteklenmeyen ölçümler başarılı sayılmaz.'],
    EARLY_RUNTIME_ERRORS:['Açılış sırasında çalışma hatası','Uygulama açılırken yakalanan çalışma hataları kontrol edildi.','Hata kaydını destek için raporla paylaşın. Bu kayıt, hatanın hâlâ sürdüğünü tek başına göstermez.'],
    HEALTH_COLLECTION:['Kontrolün tamamlanması','Bazı ölçümler tamamlanamadı.','Testi yeniden çalıştırın; eksik ölçümler başarılı sayılmaz.'],
    PERSISTENCE:['Son durumun saklanması','Son durum kaydının saklanabildiği kontrol edildi.','Tarayıcının depolama iznini ve boş alanını kontrol edin; kayıtlarınızı silmeyin.'],
    STORAGE_QUOTA:['Cihazda uygulamanın kullandığı alan','Tarayıcının bildirdiği depolama kullanımı gözlendi.','Alan daralıyorsa önce kendi kayıtlarınızı yedekleyin. Bu denetim veri silmez.'],
    HEAP:['Uygulamanın bellek kullanımı','Tarayıcının sunduğu bellek ölçümü gözlendi. Tek ölçüm bellek sızıntısını göstermez.','Uygulama yavaşsa ağır işlemin bitmesini bekleyip yeniden kontrol edin.'],
    AI_CONNECTIONS:['AI bağlantısının son durumu','Yapılandırılmış AI bağlantılarının son durumu okundu. Bu test AI isteği göndermez.','Gerçek bir açıklama isteği için aşağıdaki AI düğmesini kullanın.'],
    DEVICE_AUDIO:['Duyulan ses ve ekran kilidi','Tarayıcı, hoparlörden gerçekten ses çıktığını veya kilitli ekranda sesin sürdüğünü doğrulayamaz.','Kısa bir sesi dinleyin, ardından ekranı kilitleyip devam edip etmediğini kendiniz kontrol edin.'],
    TTS_CAPABILITY:['Cihazın metin seslendirmesi','Cihazın metin okuma özelliği gözlendi; kendi ses kayıtlarınızdan bağımsızdır.','Ses listesi alınamıyorsa cihaz bu özelliği desteklemiyor veya liste henüz yüklenmemiş olabilir.']
  };
  const HISTORY = {
    PREVIOUS_UNCLOSED_SESSION:'Önceki etkin oturumun kapanışı gözlenmedi; bu tek başına çökme kanıtı değildir.',
    VISIBLE_EVENT_LOOP_LAG:'Uygulama açıkken bir yanıt gecikmesi kaydedildi.',
    PREPARATION_OVER_30S:'Bir ses hazırlığı 30 saniyeyi aştı.', NO_COUNTER_PROGRESS_60S:'Bir sayımda bir süre ilerleme gözlenmedi; uzun bir kayıt sırasında bu normal olabilir.',
    DUAL_JOURNEY:'Aynı anda iki zikir akışı etkin görünüyordu.', SESSION_ERROR:'Bir zikir oturumu hata durumuna geçti.',
    RESOURCE_LOAD_ERROR:'Bir uygulama dosyası yüklenemedi.', JAVASCRIPT_ERROR:'Uygulamada bir çalışma hatası yakalandı.',
    UNHANDLED_PROMISE:'Bir işlem beklenmedik biçimde tamamlanamadı.', LOCK_TRANSPORT_ERROR:'Kilit ekranına ses aktarılırken bir sorun kaydedildi.',
    TEMPO_CHANGED_HIDDEN:'Uygulama ekranda değilken tempo değişti; bu kayıt nedenini tek başına göstermez.',
    QUALITY_DECODE_FAILED:'Bir sesin kalite incelemesi tamamlanamadı.',
    RUNTIME_EVENT_STORM:'Kısa sürede çok sayıda uygulama olayı gözlendi.', RUNTIME_EVENT_LOOP_LAG:'Bir yanıt gecikmesi kaydedildi.',
    RUNTIME_IDB_BLOCKED:'Uygulamanın kayıt alanına erişimi bir süre bekledi.', RUNTIME_RECORDING:'Ses kaydıyla ilgili bir uyarı alındı.',
    RUNTIME_BACKGROUND_PLAY:'Arka planda ses çalmayla ilgili bir uyarı alındı.', RUNTIME_BACKGROUND_TTS:'Arka planda metin seslendirmeyle ilgili bir uyarı alındı.'
  };
  const AI_ERRORS = {
    MISSING_KEY:'AI açıklaması için bir API anahtarı ekleyin. Yerel özetiniz hazır.',
    AUTH:'AI sağlayıcısı anahtarı kabul etmedi. AI ayarlarında anahtarı kontrol edin.',
    QUOTA:'AI kullanım kotası veya hız sınırına ulaşıldı. Biraz bekleyip yeniden deneyin; yeni anahtar gerekmeyebilir.',
    ACCESS:'AI hesabınızın seçili modele erişimi yok. Sağlayıcı hesabını kontrol edin.', BILLING:'AI sağlayıcısı hesap bakiyesi istiyor. Hesap durumunu kontrol edin.',
    NETWORK_OR_CORS:'AI bağlantısı kurulamadı. İnternet bağlantınızı ve tarayıcının erişimini kontrol edin.',
    TIMEOUT:'AI yanıtı zamanında gelmedi. Yerel sonuçlar geçerli; daha sonra yeniden deneyebilirsiniz.',
    DEADLINE:'AI için bekleme süresi doldu. Yerel sonuçlar geçerli; daha sonra yeniden deneyebilirsiniz.',
    CANCELLED:'AI açıklaması durduruldu. Yerel sonuçlar hazır.', AI_BUSY:'Başka bir AI isteği sürüyor. Tamamlanınca yeniden deneyin.',
    PROXY_REQUIRED:'Bu AI bağlantısı için aracı servis kurulumu gerekiyor. AI ayarlarını açın.',
    CONSENT_REQUIRED:'AI’ye aktarım onaylanmadı. Yerel özet kullanılabilir.',
    MODEL_UNAVAILABLE:'Seçili AI modeli kullanılamıyor. AI ayarlarını kontrol edin.',
    INVALID_REQUEST:'AI sağlayıcısı isteği kabul etmedi. AI ayarlarını kontrol edin.',
    INVALID_RESPONSE:'AI’den okunabilir bir açıklama alınamadı. Yerel özeti kullanabilirsiniz.',
    SERVER:'AI sağlayıcısında geçici bir sorun var. Biraz sonra yeniden deneyin.',
    EXHAUSTED:'Yapılandırılmış AI bağlantıları açıklama üretemedi. Yerel özet kullanılabilir.'
  };
  const arr = value => Array.isArray(value) ? value : [];
  const number = (value, max = 1e15) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? Math.round(value * 1000) / 1000 : null;
  const statusOf = value => STATUSES.has(value) ? value : 'NOT_MEASURED';
  const field = (report, code) => arr(report?.checks).find(row => row?.code === code);
  const measured = (row, key) => number(row?.evidence?.[key]);
  const knownCount = value => Math.min(arr(value).length, 10000);
  const DEVICE_ITEMS = [['foregroundSound','Ekran açıkken seçtiğim ses duyuldu'],['lockedSound','Ekranı kilitlediğimde ses devam etti'],['tempoStable','Tempo kilitte ve dönüşte değişmedi'],['effectsPreserved','Açık olan yankı / 8D etkisi sürdü'],['nameTransition','Sıradaki isme geçiş doğru gerçekleşti']];
  const DEVICE_ANSWERS = {NOT_TRIED:'Henüz denemedim',AS_EXPECTED:'Denedim, uygun',ISSUE:'Sorun yaşadım'};
  function taskStats(e) {
    const times = arr(e?.tasks).map(t => number(t?.durationMs,3600000)).filter(x => x !== null);
    return {count:number(e?.count,1e9) ?? times.length,max:number(e?.maxDurationMs,3600000) ?? (times.length ? Math.max(...times) : 0),complete:e?.windowComplete === true};
  }
  function metricText(row) {
    const e = row?.evidence || {}, code = row?.code;
    if (code === 'BACKGROUND_HANDOFF') {
      if (e.outcome === 'failed') {
        const reason = {AbortError:'Ses başlatma isteği tamamlanmadan kesildi.',NotAllowedError:'Tarayıcı arka planda bu ses başlatma isteğine izin vermedi.',NotSupportedError:'Ses kaynağı bu oynatma yolunda desteklenmedi.',NetworkError:'Ses kaynağına erişirken bağlantı sorunu bildirildi.'}[e.errorName] || 'Başlatma işlemi tamamlanamadı; ayrıntısı teknik raporda bulunur.';
        return 'Son arka plan ses aktarımı başarısız oldu. ' + reason + ' Bu kayıt son denemeyi anlatır; şu anda duyulan sesi ölçmez.';
      }
      return 'Son aktarımda tarayıcı ses başlatma isteğini kabul etti. Ekran kilidinde sesin kesintisiz duyulduğu ayrıca dinlenerek doğrulanmalıdır.';
    }
    if (code === 'AUDIO_CONSISTENCY' && e.transition === true) return 'Ses çalıyor bilgisi ile ses motorunun geçiş durumu henüz eşleşmiyor. Geçici olabilir; başarılı kontrol olarak işaretlenmedi.';
    if (code === 'HEAP') {
      const used = number(e.heapBytes), limit = number(e.heapLimit);
      return used !== null && limit > 0 ? `Yaklaşık ${Math.round(used / 1048576)} MB kullanılıyor; tarayıcı sınırının %${Math.round(used / limit * 100)} kadarı. Bu bir anlık gözlemdir.` : 'Bu tarayıcı bellek ölçümünü paylaşmadı; bellek kullanımı bilinmiyor.';
    }
    if (code === 'STORAGE_QUOTA') {
      const used = number(e.usage), quota = number(e.quota);
      return used !== null && quota > 0 ? `Tarayıcının ayırdığı alanın yaklaşık %${Math.round(used / quota * 100)} kadarı kullanılıyor (${Math.round(used / 1048576)} MB).` : 'Tarayıcı kullanılabilir alanı ölçemedi; boş alan bilinmiyor.';
    }
    if (code === 'LONG_TASKS' && e.supported === true) {
      const stats = taskStats(e), period = number(e.observedForMs,120000);
      const windowText = period > 0 && period < 120000 ? `Son ${Math.max(1,Math.round(period/1000))} saniyelik gözlemde` : 'Son iki dakikalık gözlemde';
      return stats.count ? `${windowText} ${stats.complete ? '' : 'en az '}${stats.count} uzun işlem kaydedildi; eldeki kayıtlarda en uzunu ${Math.round(stats.max)} ms. Bu süre doğrudan dokunma gecikmesi değildir.` : 'Eldeki gözlem kayıtlarında uzun işlem yok. Bu sonuç, uygulamanın her zaman akıcı olduğunu kanıtlamaz.';
    }
    if (code === 'LATENCY_ATTRIBUTION') {
      const items = arr(e.interactions), times = items.map(x=>number(x?.durationMs,3600000)).filter(x=>x!==null);
      if (times.length) return `${items.length} etkileşim örneği kaydedildi; eldeki örneklerin en uzunu ${Math.round(Math.max(...times))} ms. Bu tüm dokunmaların ölçümü veya INP sonucu değildir. Teknik raporda ilgili kontrol ve işlem aşamaları bulunur.`;
      if (arr(e.frames).length) return `${arr(e.frames).length} uzun görüntü hazırlığı örneği var. Desteklenen kaynak dosyaları teknik rapora eklendi; doğrudan dokunma gecikmesi henüz ölçülmedi.`;
      return 'Henüz etkileşim süresi örneği yok; tarayıcı desteği veya yeni bir etkileşim bekleniyor.';
    }
    if (code === 'RUNTIME_INTEGRITY' && arr(e.files).length) {
      const files = arr(e.files).slice(0,1000), matches = files.filter(x => x?.status === 'MATCH').length;
      return `${files.length} dosyadan ${matches} tanesi beklenen içerikle eşleşti.` + (matches !== files.length ? ' Kalan dosyalar eşleşmedi veya doğrulanamadı; indirme sorunu da buna yol açabilir.' : ' Bu sonuç, kontrol edilen dosyalarla sınırlıdır.');
    }
    if (code === 'TTS_CAPABILITY' && number(e.voices,100000) !== null) return e.supported === true && e.voices > 0 ? `Cihaz ${e.voices} seslendirme seçeneği bildirdi. Bunların sesli çalındığı bu testte doğrulanmadı.` : 'Cihazın seslendirme listesi alınamadı. Bu, kendi kayıtlarınızın çalamayacağı anlamına gelmez.';
    if (code === 'AI_CONNECTIONS') {
      const configured = arr(e.providers).filter(p => p?.configured === true).length;
      const last = e.lastResult?.code;
      if (last === 'OK') return 'Son AI isteği yanıt aldı. Bu, şu anki bütün bağlantıların çalıştığını doğrulamaz.';
      if (Object.hasOwn(AI_ERRORS,last || '')) return 'Son AI isteği: ' + AI_ERRORS[last];
      return configured ? `${configured} AI bağlantısı ayarlı. Bu kontrol bir AI isteği göndermedi; bağlantı henüz doğrulanmadı.` : 'Kullanılabilir bir AI bağlantısı henüz gözlenmedi. Yerel özet bağlantı gerektirmez.';
    }
    return '';
  }
  function checkView(code, row, tested) {
    const meta = META[code], e = row?.evidence || {};
    let status = statusOf(row?.status);
    // Observation is not a successful playback test. Missing browser metrics
    // never turn green, even if an older exporter supplied an optimistic status.
    if (code === 'SESSION_OBSERVATION' && status === 'PASS') status = 'OBSERVED';
    if (code === 'HEAP' && !(number(e.heapBytes) !== null && number(e.heapLimit) > 0)) status = 'NOT_MEASURED';
    if (code === 'STORAGE_QUOTA' && !(number(e.usage) !== null && number(e.quota) > 0)) status = 'NOT_MEASURED';
    if (code === 'DEVICE_AUDIO') status = 'NOT_MEASURED';
    if (code === 'AI_CONNECTIONS' && status === 'PASS') status = 'OBSERVED';
    if (code === 'LATENCY_ATTRIBUTION') status = arr(e.interactions).length || arr(e.frames).length ? 'OBSERVED' : 'NOT_MEASURED';
    if (!tested && status === 'PASS') status = 'OBSERVED';
    const specific = metricText(row);
    const detail = specific || (status === 'NOT_MEASURED' ? (code === 'DEVICE_AUDIO' ? meta[1] : 'Bu kontrol için yeterli ölçüm henüz yok.') : meta[1]);
    return {code,label:meta[0],status,detail,advice:status === 'FAIL' || status === 'WARN' || status === 'NOT_MEASURED' ? meta[2] : ''};
  }
  function areaStatus(checks) {
    if (checks.some(x => x.status === 'FAIL')) return 'FAIL';
    if (checks.some(x => x.status === 'WARN')) return 'WARN';
    if (!checks.length || checks.some(x => x.status === 'NOT_MEASURED')) return 'NOT_MEASURED';
    if (checks.some(x => x.status === 'OBSERVED')) return 'OBSERVED';
    return 'PASS';
  }
  function summarize(report) {
    const lastRunAt = number(report?.lastRun?.at), tested = lastRunAt !== null && lastRunAt > 0;
    const counts = {pass:0,warning:0,failure:0,observed:0,unknown:0};
    const countKey = {PASS:'pass',WARN:'warning',FAIL:'failure',OBSERVED:'observed',NOT_MEASURED:'unknown'};
    const areas = GROUPS.map(group => {
      const checks = group.codes.filter(code => !OPTIONAL.has(code) || field(report,code)).map(code => checkView(code,field(report,code),tested));
      checks.forEach(check => counts[countKey[check.status]]++);
      const status = areaStatus(checks), relevant = checks.find(x => x.status === status);
      let detail = relevant?.detail || 'Bu alan için yeterli ölçüm yok.';
      if (status === 'PASS') detail = 'Bu alanda yapılan kontroller doğrulandı.';
      else if (status === 'NOT_MEASURED' && group.id !== 'device' && group.id !== 'ai') detail = 'Bazı kontroller henüz ölçülemedi; ayrıntıyı açın.';
      return {...group,status,detail,checks};
    });
    const status = !tested ? 'PENDING' : counts.failure ? 'FAIL' : counts.warning ? 'WARN' : counts.unknown ? 'NOT_MEASURED' : counts.observed ? 'OBSERVED' : 'PASS';
    const title = !tested ? 'Kontrol bekliyor' : counts.failure ? 'İlgilenilmesi gereken bir sorun var' : counts.warning ? 'Dikkat gerektiren bulgu var' : counts.pass + counts.observed === 0 ? 'Sonuç için yeterli ölçüm yok' : 'Ölçülen alanlarda sorun görünmüyor';
    const focus = areas.flatMap(x => x.checks).find(x => x.status === 'FAIL') || areas.flatMap(x => x.checks).find(x => x.status === 'WARN');
    const advice = !tested ? 'Testi çalıştırın. Dosyalar ve mevcut durum kontrol edilir; sesiniz ve tempo ayarınız değiştirilmez.' + (counts.failure || counts.warning ? ' Şimdiden gözlenen bulguları aşağıda görebilirsiniz.' : '') : focus ? focus.advice : 'Ölçülemeyen alanları aşağıdan inceleyin. Duyulan ses ve ekran kilidi davranışı cihazınızda ayrıca denenmelidir.';
    const history = {count:knownCount(report?.incidents),previousCount:knownCount(report?.previous?.incidents)};
    const localSummary = `${title}. ${counts.failure} sorun, ${counts.warning} uyarı ve ${counts.unknown} ölçülmemiş kontrol var. ${advice} Gözlem bilgisi, başarılı test anlamına gelmez.`;
    return {tested,lastRunAt,status,title,advice,counts,areas,history,localSummary};
  }
  function aiPayload(report) {
    const summary = summarize(report), metrics = {};
    const put = (name,value,max) => { const n = number(value,max); if (n !== null) metrics[name] = n; };
    const evidence = code => field(report,code)?.evidence || {};
    const heap = evidence('HEAP'), storage = evidence('STORAGE_QUOTA');
    put('heapUsedBytes',heap.heapBytes); put('heapLimitBytes',heap.heapLimit);
    put('storageUsedBytes',storage.usage); put('storageQuotaBytes',storage.quota);
    if (evidence('LONG_TASKS').supported === true) { const stats=taskStats(evidence('LONG_TASKS')); put('longTaskCount',stats.count); put('longestTaskMs',stats.max,3600000); metrics.longTaskCountIsLowerBound = !stats.complete; }
    const interactions = arr(evidence('LATENCY_ATTRIBUTION').interactions).slice(-24), interactionTimes = interactions.map(x=>number(x?.durationMs,3600000)).filter(x=>x!==null);
    if (interactionTimes.length) {put('interactionSampleCount',interactionTimes.length);put('longestInteractionSampleMs',Math.max(...interactionTimes));metrics.isINP=false;}
    const files = arr(evidence('RUNTIME_INTEGRITY').files).slice(0,1000);
    if (files.length) { put('runtimeFileCount',files.length); put('runtimeMatchingFiles',files.filter(x => x?.status === 'MATCH').length); put('runtimeMismatchedFiles',files.filter(x => x?.status === 'HASH_MISMATCH').length); put('runtimeUnverifiedFiles',files.filter(x => !['MATCH','HASH_MISMATCH'].includes(x?.status)).length); }
    put('runtimeCheckedBytes',evidence('RUNTIME_INTEGRITY').bytes);
    put('voiceOptionCount',evidence('TTS_CAPABILITY').voices,100000);
    put('nativeClickCount',evidence('INPUT_DELIVERY').nativeClicks,1e9);
    put('unmatchedTouchCount',evidence('INPUT_DELIVERY').unmatchedUps,1e9);
    put('activeAudioEngineCount',arr(evidence('AUDIO_CONTEXTS').contexts).filter(x => x?.state === 'running').length,1000);
    if (Array.isArray(evidence('AI_CONNECTIONS').providers)) put('configuredAIConnectionCount',arr(evidence('AI_CONNECTIONS').providers).filter(x => x?.configured === true).length,100);
    put('testDurationMs',report?.lastRun?.durationMs,3600000);
    // No report spread, arbitrary evidence, text, identifiers, paths, URLs,
    // recordings, prayers, timestamps, timeline, stack traces, or credentials.
    return {schema:'sukun-health-ai-summary-r944',tested:summary.tested,incomplete:report?.lastRun?.incomplete === true,
      overall:summary.status,counts:{...summary.counts},
      areas:summary.areas.map(area => ({id:area.id,label:area.label,status:area.status,checks:area.checks.map(check => ({code:check.code,label:check.label,status:check.status}))})),
      history:{incidentCount:summary.history.count,previousIncidentCount:summary.history.previousCount},metrics};
  }
  const SYSTEM = 'SÜKÛN uygulamasının çalışma kontrolünü teknik bilgisi olmayan bir kişiye sade Türkçe açıkla. Bu tıbbi değerlendirme değildir. Yalnızca verilen teknik özeti kullan. En fazla 150 kelimelik üç kısa paragraf yaz: ne gözlendi; kullanımına olası etkisi ve neyin bilinmediği; en fazla üç uygulanabilir sonraki adım. Çıktıda kontrol kodlarını, PASS/WARN/OBSERVED gibi durum kodlarını, JSON veya Markdown işaretlerini yazma; sağlanan Türkçe label alanlarını kullan. PASS yalnızca ilgili ölçümü doğrular; OBSERVED gözlemdir, NOT_MEASURED ve PENDING bilinmeyendir. Bilinmeyeni başarıya çevirme ve kullanıcıya testi PASS yapmasını söyleme. Geçmiş olay mevcut arıza kanıtı değildir. Uzun işlem süresi doğrudan dokunma gecikmesi veya INP değildir. lower-bound sayı en az demektir. Test çalıştırdığını, sesi duyduğunu, ekran kilidini veya tüm AI bağlantılarını doğruladığını iddia etme. Hoparlör ve kilit testi kullanıcı tarafından dinlenmelidir; tarayıcı bunu otomatik doğrulayamaz. Kök neden, sonuç veya yeni test uydurma. Kod optimizasyonunu kullanıcıdan isteme; gecikmede sorun anını işaretleyip raporu indirmesini öner. Kayıt, veri veya önbellek silmeyi, sıfırlamayı, anahtar paylaşmayı, terminal komutu veya bağlantı önerme. Yanıtın ölçümleri değiştirmeyen bir açıklamadır.';
  function plainExplanation(value) {
    let text = String(value).trim().slice(0,6000).replace(/^\s*#{1,6}\s+/gm,'').replace(/```[^\n]*\n?|```/g,'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/`([^`]+)`/g,'$1').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1');
    for (const [code,meta] of Object.entries(META)) text = text.replace(new RegExp('\\b'+code+'\\b','g'),meta[0]);
    const labels = {PASS:'doğrulandı',WARN:'dikkat',FAIL:'sorun',OBSERVED:'yalnızca gözlem',NOT_MEASURED:'ölçülmedi',PENDING:'kontrol bekliyor'};
    return text.replace(/\b(?:PASS|WARN|FAIL|OBSERVED|NOT_MEASURED|PENDING)\b/g,x=>labels[x]);
  }
  // The explanation request itself updates AI_CONNECTIONS. That observation
  // must not invalidate its own answer; all other measured changes still do.
  function reportKey(report) {
    const payload = aiPayload(report);
    const {overall,counts,areas,...rest} = payload;
    return JSON.stringify({...rest,areas:areas.filter(area=>area.id !== 'ai')});
  }
  const make = (tag,className,text) => { const element = document.createElement(tag); if(className) element.className = className; if(text !== undefined) element.textContent = text; return element; };
  const get = (panel,name) => panel.querySelector(`[data-health-${name}]`);
  function badge(status) { const span = make('span','hv-badge',`${ICON[status]} ${LABEL[status]}`); span.dataset.status = status; return span; }
  function setText(panel,name,text) { const node = get(panel,name); if(node && node.textContent !== text) node.textContent = text; }
  function buttons(panel,state) {
    const run = panel.querySelector('[data-health-action="run"]'), ai = panel.querySelector('[data-health-action="ai"]'), stop = panel.querySelector('[data-health-action="cancel"]');
    if(run) { run.disabled = !!state.running; run.textContent = state.running ? 'Kontrol ediliyor…' : 'Testi çalıştır'; }
    if(ai) { ai.disabled = !!state.running || !!state.job; ai.textContent = state.job ? 'AI açıklaması hazırlanıyor…' : 'AI ile sonucu açıkla'; }
    if(stop) { stop.hidden = !state.job; stop.disabled = !state.job; }
    get(panel,'ai')?.setAttribute('aria-busy',state.job ? 'true' : 'false');
  }
  function cancel(panel,reason = 'AI açıklaması durduruldu. Yerel sonuçlar hazır.') {
    const state = states.get(panel); if(!state?.job) return false;
    const job = state.job; state.job = null; job.cancelled = true; clearTimeout(job.timer); job.controller.abort(); job.reject?.(Object.assign(new Error('Cancelled'),{code:'CANCELLED'}));
    setText(panel,'ai-status',reason); buttons(panel,state); return true;
  }
  function timeText(at) { if(!at) return 'Henüz test çalıştırılmadı'; try{return new Date(at).toLocaleString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(_){return 'Son kontrol kaydedildi';} }
  function render(panel,report) {
    const state = states.get(panel); if(!state) return false;
    const summary = summarize(report), payloadKey = reportKey(report);
    const runKey = number(report?.lastRun?.at);
    if(state.job && (state.job.payloadKey !== payloadKey || state.job.runKey !== runKey)) cancel(panel,'Sonuçlar değişti; önceki AI isteği durduruldu. Güncel sonuçlar için yeniden açıklama isteyin.');
    if(state.answerKey && (state.answerKey !== payloadKey || state.answerRun !== runKey)) {
      state.answerKey = ''; setText(panel,'ai-output',''); setText(panel,'ai-provider',''); setText(panel,'ai-status','Sonuçlar değişti. Önceki AI açıklaması kaldırıldı; güncel sonuçları yeniden açıklatabilirsiniz.');
    }
    state.report = report; state.payloadKey = payloadKey; state.runKey = runKey;
    setText(panel,'summary',summary.tested ? `${summary.counts.failure} sorun · ${summary.counts.warning} uyarı · ${summary.counts.unknown} ölçülmedi` : 'Kontrol bekliyor');
    const overall = get(panel,'overall'); overall.dataset.status = summary.status;
    setText(panel,'overall-icon',ICON[summary.status]); setText(panel,'title',summary.title); setText(panel,'advice',summary.advice);
    setText(panel,'stamp',summary.tested ? `Son kontrol: ${timeText(summary.lastRunAt)}` : 'Henüz test çalıştırılmadı');
    setText(panel,'local',summary.localSummary);
    const stats = get(panel,'counts'); stats.replaceChildren();
    for(const [key,label,status] of [['failure','sorun','FAIL'],['warning','uyarı','WARN'],['unknown','ölçülmedi','NOT_MEASURED']]) { const span = make('span','hv-stat'); span.dataset.status = summary.counts[key] ? status : 'OBSERVED'; span.append(make('strong','',String(summary.counts[key])),document.createTextNode(' '+label)); stats.append(span); }
    const areaHost = get(panel,'results');
    const openAreas = new Set([...areaHost.querySelectorAll('details[open]')].map(x=>x.dataset.area));
    // A passive render with identical content preserves focus and expanded rows.
    const areaKey = JSON.stringify(summary.areas);
    if(state.areaKey !== areaKey) {
      state.areaKey = areaKey; areaHost.replaceChildren();
      for(const area of summary.areas) {
        const card = make('details','hv-area'); card.dataset.area = area.id; card.dataset.status = area.status; card.open = openAreas.has(area.id);
        const head = make('summary','hv-area-head'), glyph = make('span','hv-area-icon',area.icon); glyph.setAttribute('aria-hidden','true');
        const text = make('span','hv-area-text'); text.append(make('strong','',area.label),make('span','hv-area-note',area.detail));
        head.append(glyph,text,badge(area.status)); card.append(head);
        const list = make('div','hv-checks');
        for(const check of area.checks) { const row = make('div','hv-check'); const h = make('div','hv-check-head'); h.append(make('strong','',check.label),badge(check.status)); row.append(h,make('p','',check.detail)); if(check.advice) row.append(make('p','hv-next',check.advice)); list.append(row); }
        card.append(list); areaHost.append(card);
      }
    }
    setText(panel,'history-count',`${summary.history.count} bu oturumda · ${summary.history.previousCount} önceki kayıtta`);
    const history = get(panel,'history-items'); history.replaceChildren();
    const incidents = [...arr(report?.incidents).slice(-8).reverse().map(row=>({row,old:false})),...arr(report?.previous?.incidents).slice(-4).reverse().map(row=>({row,old:true}))];
    if(!incidents.length) history.append(make('p','hv-muted','Bu raporda geçmiş sorun kaydı yok. Bu, hiç sorun yaşanmadığını kanıtlamaz.'));
    for(const {row,old} of incidents) { const item = make('div','hv-history-item'); const message = HISTORY[row?.code] || (String(row?.code || '').startsWith('RUNTIME_') ? 'Uygulama çalışırken teknik bir uyarı kaydedildi.' : 'Uygulama çalışırken bir sorun kaydı oluştu.'); item.append(make('strong','',old ? 'Önceki kayıt' : 'Bu oturumda kaydedildi'),make('p','',message)); history.append(item); }
    const device = report?.deviceCheck;
    const userIssues = DEVICE_ITEMS.filter(([key])=>device?.responses?.[key] === 'ISSUE').length;
    const otherSession = device?.sessionEpoch != null && device.sessionEpoch !== report?.current?.session?.epoch;
    setText(panel,'device-result',device?.source === 'USER_REPORTED' ? `Son bildiriminiz: ${timeText(device.at)} · ${userIssues ? userIssues+' alanda sorun bildirdiniz.' : 'Bildiriminiz kaydedildi.'} Bu kullanıcı beyanıdır; otomatik test sonucu değildir.${otherSession ? ' Bildirimden sonra oturum değişti; bu sonuç yeni oturumu doğrulamaz.' : ''}` : 'Henüz cihaz denemesi bildirilmedi. Bu bölüm otomatik test sonuçlarını değiştirmez.');
    // Technical source is intentionally inside a collapsed disclosure and text only.
    try { setText(panel,'raw',JSON.stringify(report,null,2)); } catch(_) { setText(panel,'raw','Teknik rapor görüntülenemedi. Raporu indirmeyi deneyin.'); }
    buttons(panel,state); return true;
  }
  function errorMessage(error) {
    let code = typeof error?.code === 'string' ? error.code : '';
    if(code === 'EXHAUSTED') { const attempt = arr(error?.attempts).find(x => ['AUTH','QUOTA','NETWORK_OR_CORS','TIMEOUT','BILLING','ACCESS'].includes(x?.code)); if(attempt) code = attempt.code; }
    return AI_ERRORS[code] || 'AI açıklaması alınamadı. Yerel sonuçlar hazır; daha sonra yeniden deneyebilirsiniz.';
  }
  async function explain(panel,state) {
    if(state.job || state.running) return;
    const router = window.SukunAIRouter;
    if(!router || typeof router.complete !== 'function') { setText(panel,'ai-status','AI bağlantı modülü hazır değil. Yerel özet kullanılabilir.'); return; }
    let hasKey = false; try{hasKey = router.hasAnyKey?.() === true;}catch(_){}
    if(!hasKey) { setText(panel,'ai-status',AI_ERRORS.MISSING_KEY); try{router.openSettings?.(AI_ERRORS.MISSING_KEY);}catch(_){} get(panel,'settings')?.focus?.(); return; }
    if(window.navigator?.onLine === false) { setText(panel,'ai-status','Şu anda çevrimdışısınız. Yerel özet hazır; AI açıklaması için internet bağlantısı gerekir.'); return; }
    let report; try{report = state.api.read();}catch(_){report = state.report;}
    render(panel,report);
    const job = {controller:new AbortController(),payloadKey:state.payloadKey,runKey:state.runKey,cancelled:false,timer:0,reject:null};
    state.job = job; state.answerKey = ''; setText(panel,'ai-output',''); setText(panel,'ai-provider','');
    setText(panel,'ai-status','Kısa teknik özet açıklanıyor. Bu işlem testleri yeniden çalıştırmaz.'); buttons(panel,state);
    try {
      const deadline = new Promise((_,reject) => { job.reject = reject; job.timer = setTimeout(()=>{job.controller.abort();reject(Object.assign(new Error('Timed out'),{code:'TIMEOUT'}));},42000); });
      const result = await Promise.race([router.complete({system:SYSTEM,user:JSON.stringify(aiPayload(report)),maxTokens:900,signal:job.controller.signal}),deadline]);
      if(state.job !== job || job.cancelled || panel.isConnected === false) return;
      let latest; try{latest=state.api.read();}catch(_){latest=state.report;}
      if(reportKey(latest) !== job.payloadKey || number(latest?.lastRun?.at) !== job.runKey) { setText(panel,'ai-status','Sonuçlar istek sırasında değişti. Güncel sonuçlar için yeniden açıklama isteyin.'); return; }
      if(typeof result?.text !== 'string' || !result.text.trim()) throw Object.assign(new Error('Invalid response'),{code:'INVALID_RESPONSE'});
      // read() only refreshes existing evidence. Do not run tests or issue a
      // second AI request just to show this request's new connection status.
      render(panel,latest);
      state.answerKey = job.payloadKey; state.answerRun = job.runKey;
      setText(panel,'ai-output',plainExplanation(result.text));
      const source = [result.providerLabel,result.model].filter(x => typeof x === 'string').map(x => x.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,100)).join(' · ');
      setText(panel,'ai-provider',source ? 'Açıklamayı hazırlayan: '+source : 'AI açıklaması');
      setText(panel,'ai-status','AI önerisi — ölçüm sonuçlarını değiştirmez ve yeni bir test doğrulaması değildir.');
    } catch(error) { if(state.job === job && !job.cancelled && panel.isConnected !== false) {
      let latest; try{latest=state.api.read();}catch(_){latest=state.report;}
      render(panel,latest);
      if(state.job === job && !job.cancelled) setText(panel,'ai-status',errorMessage(error));
    } }
    finally { clearTimeout(job.timer); if(state.job === job) { state.job = null; buttons(panel,state); } }
  }
  function mount(panel,api) {
    if(!panel || !api || typeof api.read !== 'function') return false;
    const existing = states.get(panel); if(existing) { existing.api = api; return true; }
    panel.classList.add('hv-r943');
    panel.innerHTML = '<summary class="hv-panel-summary"><span class="hv-kicker">SÜKÛN · SİSTEM SAĞLIĞI</span><strong>Uygulamanız nasıl çalışıyor?</strong><span data-health-summary>Kontrol bekliyor</span></summary><div class="hv-body"><section class="hv-overall" data-health-overall data-status="PENDING" aria-label="Genel sonuç"><span class="hv-overall-icon" data-health-overall-icon aria-hidden="true">◌</span><div><p class="hv-stamp" data-health-stamp>Henüz test çalıştırılmadı</p><h3 data-health-title>Kontrol bekliyor</h3><p data-health-advice></p></div></section><div class="hv-counts" data-health-counts aria-label="Kontrol sayıları"></div><div class="hv-actions"><button type="button" class="hv-primary" data-health-action="run">Testi çalıştır</button><button type="button" data-health-action="export">Raporu indir</button><button type="button" data-health-action="mark">Sorun şimdi oldu</button></div><p class="hv-feedback" data-health-feedback role="status" aria-live="polite"></p><p class="hv-caption">Kontrol sesinizi veya temponuzu değiştirmez. Dosya doğrulaması için uygulamanın kendi dosyalarını yükleyebilir.</p><div class="hv-legend" aria-label="Sonuçların anlamı"><span>✓ Doğrulandı</span><span>! Dikkat / sorun</span><span>◌ Yalnızca gözlem</span><span>— Ölçülmedi</span></div><div class="hv-areas" data-health-results></div><section class="hv-ai" data-health-ai aria-label="AI ile açıklama"><div class="hv-ai-head"><span class="hv-ai-glyph" aria-hidden="true">✦</span><div><h3>Sonucu birlikte anlamlandıralım</h3><p>Yerel özet hazır. İsterseniz AI’den ek açıklama alın.</p></div></div><div class="hv-local"><strong>Yerel değerlendirme</strong><p data-health-local></p></div><div class="hv-actions"><button type="button" class="hv-ai-button" data-health-action="ai">AI ile sonucu açıkla</button><button type="button" data-health-action="cancel" hidden>AI isteğini durdur</button><button type="button" data-health-action="settings" data-health-settings>AI ayarları</button></div><p class="hv-privacy">Bu düğme yalnızca kısa teknik özeti ayarlı AI sağlayıcılarınıza gönderir. Ses kayıtları, dua/esma adları, yazdıklarınız, olay dökümü ve API anahtarları bu özete alınmaz.</p><p class="hv-ai-status" data-health-ai-status role="status" aria-live="polite">Henüz AI açıklaması istenmedi.</p><p class="hv-provider" data-health-ai-provider></p><div class="hv-ai-output" data-health-ai-output></div></section><details class="hv-history"><summary>Geçmiş sorun kayıtları <span data-health-history-count></span></summary><div class="hv-disclosure-body"><p class="hv-muted">Bunlar daha önce kaydedilen olaylardır; şu an devam eden bir arıza anlamına gelmez. Genel sonuç, yukarıdaki mevcut kontrollerden hesaplanır.</p><div data-health-history-items></div></div></details><details class="hv-technical"><summary>Teknik rapor <span>İleri inceleme için</span></summary><div class="hv-disclosure-body"><p class="hv-muted">Bu ayrıntı yalnızca burada görüntülenir ve Raporu indir ile dışa aktarılır. AI açıklamasına tam rapor gönderilmez.</p><pre data-health-raw></pre></div></details></div>';
    // User-run device checklist is deliberately separate from measured checks.
    if (typeof api.recordDeviceCheck === 'function') {
      const guide = make('details','hv-device-guide');
      guide.append(make('summary','','Cihazımda ses ve ekran kilidini dene'));
      const body = make('div','hv-disclosure-body');
      body.append(make('p','hv-muted','Seçtiğiniz kayıtla zikri normal ekrandan başlatın. Sesi dinleyin; sonra ekranı kilitleyip tempo, açık efektler ve isim geçişini kontrol edin. Kısa denemeden sonra 30 dakikalık kullanımda da gözlemleyin. Buradaki seçenekler sesi başlatmaz veya durdurmaz.'));
      for (const [key,label] of DEVICE_ITEMS) {
        const row = make('label','hv-device-row'); row.append(make('span','',label));
        const select = make('select',''); select.setAttribute('data-health-device',key); select.setAttribute('aria-label',label);
        for (const [value,text] of Object.entries(DEVICE_ANSWERS)) {const option=make('option','',text);option.value=value;select.append(option);}
        select.value='NOT_TRIED'; row.append(select); body.append(row);
      }
      const save = make('button','','Deneme sonucumu kaydet'); save.type='button'; save.setAttribute('data-health-action','device-save');
      body.append(save);const feedback=make('p','hv-caption');feedback.setAttribute('data-health-device-result','');feedback.setAttribute('role','status');body.append(feedback);
      guide.append(body); get(panel,'ai').before(guide);
    }
    const state = {api,report:null,running:false,job:null,payloadKey:'',areaKey:'',answerKey:'',answerRun:null,runKey:null}; states.set(panel,state);
    panel.addEventListener('click',async event => {
      const button = event.target.closest?.('[data-health-action]'); if(!button || !panel.contains(button)) return;
      const action = button.dataset.healthAction;
      if(action === 'device-save') {
        const responses = {};
        for (const input of panel.querySelectorAll('[data-health-device]')) if(Object.hasOwn(DEVICE_ANSWERS,input.value)) responses[input.dataset.healthDevice]=input.value;
        try{render(panel,state.api.recordDeviceCheck(responses));}catch(_){setText(panel,'device-result','Deneme sonucu kaydedilemedi. Teknik raporu indirebilirsiniz.');}
        return;
      }
      if(action === 'cancel') { cancel(panel); return; }
      if(action === 'ai') { await explain(panel,state); return; }
      if(action === 'settings') { try{if(!window.SukunAIRouter?.openSettings?.()) setText(panel,'ai-status','AI ayarları henüz hazır değil. Yerel özet kullanılabilir.');}catch(_){setText(panel,'ai-status','AI ayarları açılamadı. Yerel özet kullanılabilir.');} return; }
      if(action === 'run') {
        if(state.running) return; cancel(panel,'Yeni kontrol başlatıldı; önceki AI isteği durduruldu.'); state.running = true; state.answerKey=''; setText(panel,'ai-output',''); setText(panel,'ai-provider',''); setText(panel,'ai-status','Kontrol bitince güncel sonuçları AI ile açıklatabilirsiniz.'); buttons(panel,state); setText(panel,'feedback','Kontrol çalışıyor…');
        try { const report = await state.api.run({deep:true}); render(panel,report || state.api.read()); setText(panel,'feedback','Kontrol tamamlandı. Sonuçlar aşağıda.'); }
        catch(_) { setText(panel,'feedback','Kontrol tamamlanamadı. Mevcut sonuçlar korunuyor; yeniden deneyebilirsiniz.'); }
        finally { state.running = false; buttons(panel,state); }
      } else if(action === 'mark') {
        try{const report = state.api.mark(); render(panel,report || state.api.read()); setText(panel,'feedback','Sorunun bu anda yaşandığı rapora işaretlendi. Raporu indirebilirsiniz.');}catch(_){setText(panel,'feedback','İşaret eklenemedi. Raporu indirmeyi deneyin.');}
      } else if(action === 'export') {
        try{await state.api.exportReport(); setText(panel,'feedback','Rapor indirme isteği hazırlandı.');}catch(_){setText(panel,'feedback','Rapor indirilemedi. Yeniden deneyin.');}
      }
    });
    try{render(panel,api.read());}catch(_){render(panel,{});} return true;
  }
  window.SukunHealthViewR943 = Object.freeze({version:'r944',mount,render,summarize,aiPayload,cancel});
})();
