# r1093 arşiv hazırlığı ve kabul kanıtı

Bu sürüm, isteğe bağlı jenerik arşivin kategori seçimini, doğrulanmış geçici parçaların saklanmasını, yeniden açtıktan sonra açık Sürdür komutuyla tekrar hash denetimini ve eksiklerden sürdürmeyi uygular. Kayıt/bayt ilerlemesi gerçek tamamlanan işten üretilir. İptal veya hazırlık hatası, yayımlanmış jenerik arşivi ve kişisel kayıtları değiştirmez.

Uygulamadan önce birleştirme/yerine değiştirme ve aynı anahtarda mevcut/yeni kayıt tercihi açıkça seçilir. Önizleme sonrası arşiv kimliği ve revizyonu atomik işlem içinde yeniden karşılaştırılır. Başka sekmenin değişikliği eski önizlemeyle ezilemez. Uygulama jenerik sesi otomatik açmaz; kişisel ses deposuna yazmaz. Kilitli özel kategoriler gizlenir; inceleme sayıları yalnız görünür kapsama aittir ve birleştirme eski gizli kayıtları korur.

Geçici arşiv alanı kişisel yedek, uygulama sürümü arşivi veya geri yükleme noktası değildir. Servis çalışanının ayrı protokolü, işaretli ve kanonik arşiv manifesti/ses isteklerini CacheStorage’a almadan ağdan geçirir. Eski arşiv önbelleği ağ hatasında yedek yanıt olamaz. Diğer çalışma dosyalarının hash doğrulaması ve görsel önbelleği kendi kurallarını korur.

## Testleri çalıştırma

Komutlar depo kökünden çalıştırılır. Chromium testleri için runtime Playwright modülü ve uygun `CHROMIUM_PATH` gerekir. Rapor yolları depo dışında olmalıdır.

```sh
node tests/r1093/archive-worker.cjs .
node tests/r1093/archive-ui-browser.js . /absolute/qa/r1093/ui-controlled/native.json
node tests/r1093/archive-browser.js . /absolute/qa/r1093/archive/native.json
node tests/r1093/archive-worker-browser.js . /absolute/qa/r1093/archive-worker/native.json
python tests/r1049/run-regressions.py --source-root . --output-dir /absolute/qa/r1093/regressions
node tests/r1027/release-integrity.cjs .
```

- [Kontrollü worker sözleşmeleri](ARCHIVE_WORKER_README.md): tam üretim `sw.js`, yalıtılmış ağ/CacheStorage sınırları ve gerçek Request/Response/iptal sinyalleri. Protokol, kesin adres denetimi, ağ hatası, önbelleğe yazmama ve mevcut çalışma dosyası yolları incelenir.
- `archive-ui-browser.js`: gerçek tarayıcı DOM’unda üretim arayüz JS/CSS dosyalarını kullanan küçük HTML fixture. İndirme, arşiv ve commit arayüzleri kontrollü girdilerdir; tam uygulama HTML’i yüklenmez. Modül hash/bayt kanıtları ayrı `controlledBrowserIntegration` alanında tutulur; tam uygulama native toplamına eklenmez.
- [Tam uygulama ve gerçek worker QA kapsamı](ARCHIVE_QA_README.md): geçici Chromium profilleri, gerçek IndexedDB, özgün manifestteki belirtilen kategori ve dosyalar; kesinti, yeniden açılış, bozuk parça, önizleme, commit, gizlilik ve çevrimdışı davranış. Ağ/depolama hata enjeksiyonları raporda açıkça etiketlenir. Bir alt kategori denemesi bütün arşivin indirilmiş olduğunu göstermez.
- Genel regresyonlar üretim kaynak sözleşmelerini; sürüm bütünlüğü testi kimlikleri, SRI etiketlerini ve dağıtım hash/boyutlarını denetler. Grup, senaryo ve statik doğrulama adetleri farklı ölçülerdir.

## Kabul sınırı

Native testler yalnız HTML, modül SRI’ları, worker ve dağıtım envanteri birlikte sonlandırılıp kaynaklar dondurulduktan sonra sürüm kanıtı olur. Kaynak/test hash’leri, süreç çıkışı ve tamamlanan raporlar birlikte kaydedilir. Önceki veya başarısız adaylar kabul toplamına katılmaz.

[Sürüm kimliği](../../version.txt) ve [nihai doğrulama kaydı](verification.json) esas alınır. G3 kapsamı, dondurulmuş kaynaklarla tamamlanan kabul koşularına dayanır. Kabul toplamları ve senaryo sınırları doğrulama kaydında bulunur; canlı yayın durumu ayrıca denetlenir.

Fiziksel Android ekran kilidi, Bluetooth/arama kesintisi, mikrofon veya duyulan ses kalitesi, gerçek mobil bant genişliği ve cihaz kotası bu yerel testlerin kapsamı değildir. Geçici test kayıtları ve kontrollü cihaz sesi girdileri gerçek kullanıcı kayıtları olarak sunulmaz.
