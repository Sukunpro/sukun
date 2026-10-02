# SÜKÛN r982 — Studio ve oturum kurtarma sağlamlaştırması

r981 tam paketi üzerine hazırlanmıştır. Uygulama, SW, manifest, güncel build ve cache kimlikleri birlikte r982 / 20261002-v15 olarak eşleştirildi. Bu paket tam web/PWA kaynağıdır; canlı GitHub yayını yapılmadı.

## Uygulanan değişiklikler

- Studio analiz, normalizasyon, sessizlik kırpma, dalga özeti ve WAV paketleme hesapları ortak ses hazırlama sırası içinde worker üzerinde çalışır. Worker kullanılamazsa hesaplar küçük parçalara bölünür. Arayüz yalnız sınırlı dalga özeti alır; bütün PCM verisini saklamaz.

- Düzenleme öncesi kayıt boyutu, doğrulanmış süre/kanal bilgisi ve tahmini çalışma belleği denetlenir. İptal, seçim değişimi, sahiplik kaybı veya zaman aşımı sonrası geç sonuç kayıt üzerine yazamaz. Asıl kayıt işlem sınırı ya da hata durumunda korunur.

- Studio yeniden kayıtta, geri yükleme veya sıfırlamayla çakışmayı önleyen sessiz veri yetkisi kayıt izni, geri sayım, mikrofon ve kaydetme boyunca tutulur. Etkin ya da duraklatılmış zikir önce Bitir ile sonlandırılır. Geç mikrofon izni iptal edilmiş işleme ses veya dosya ekleyemez; önceki kayıt korunur.

- İlerleme tek sürümlü ve doğrulanan bir günlük kaydında toplanır: toplam/sayaç, isim, 28/99 seyir, akıllı sıra ve onaylanmış sabit tekrar konumu aynı snapshot üzerinden kurtarılır. Kurtarma zikir başlatmaz, tempo tercihini değiştirmez; toplamda -1 düzeltmeleri eski büyük toplamla geri alınmaz.

- Akıllı sırada ses hazırlığı beklerken Bitir, sıra değişimi veya sahiplik değişimi olursa geç hazırlık oturumu yeniden başlatamaz. Yalnız tamamlandığı doğrulanan sabit tekrarlar kurtarma konumuna yazılır; tamamlanan oturumun devam durumu kapatılır. Aynı veya farklı isimli satır silme/değiştirme durumunda tamamlanan tekrar konumu başka satıra taşınmaz.

- Eski sürüm veya başka sekme yerel ilerlemeyi değiştirirse günlüğün eski değerleri sessizce üzerine yazılmaz. Açık kullanıcı eylemiyle kontrol edilen güncel yerel ilerleme, ses başlamadan alınabilir. Yeni kurtarma ve Studio açıklamaları Türkçe/İngilizce sunulur. Birbiriyle uyuşmayan yarım kalmış kayıtlar birleştirilmez; son doğrulanan ilerlemeye dönüş de açık kullanıcı eylemiyle yapılır.

- Yedek geri yükleme ve veri sıfırlama yeni ilerleme günlüğünü de ele alır; eski yedekten sonra önceki checkpoint ile silinen ya da aktarılan veriler geri getirilemez. Sekme sahipliği ve sessiz veri işlemi korumaları sürdürülür.

- Minimum tempo 0,6 saniye, ilk kullanım 1 saniye olarak kalır. Geçerli kullanıcı tercihi korunur; performans veya kurtarma işlemleri tempoyu kendiliğinden değiştirmez.

## Tempo kuralı

En düşük seçilebilir tempo 0,6 saniyedir. Yeni kurulumun başlangıç değeri 1 saniyedir. Kullanıcının geçerli kayıtlı değeri korunur. Düşük donanım, ekran kilidi, görünür dönüş, isim geçişi veya görsel kalite seçilmiş tempoyu kendiliğinden değiştirmez.

Tekil kayıt döngüsünde gerçek başlangıç aralığı, seçilen tempo ile kayıt süresinin okuma hızına göre düzeltilmiş süresi + 40 ms arasındaki büyük değerdir. Örneğin normal hızda 1,2 saniyelik kayıt, 0,6 saniye seçilse de yaklaşık 1,24 saniyelik aralık ister. Kullanıcının tempo değeri değişmez. Seyirde kelime bitimi sonrası ara mantığı korunur. Terkip tamamlanmadan yeni bütün okuma başlatılmaz.

## Doğrulama

46 regresyon süiti geçti. Önceki 38 süitin tamamı bu sürümde tekrar çalıştırıldı. Kayıt, tempo, kullanıcı seçimi, sayaç, performans, terkip, eko, TTS ayarları, manuel ses, dokunma/kaydırma, çark, kilitten görünüm dönüşü ve çevrimdışı SW kapsamları korunur. Süit ve ham çıktı listesi integration/r982/evidence/r982_regression_runs.json içindedir. Deterministik modeller ve gerçek kaynak kodu birlikte test edilir; bunlar gerçek cihazda duyulur ses veya çizim ölçümü değildir.

268 JavaScript kaynağı ayrıştırıldı; 38 zorunlu runtime hash doğrulandı. Önceki 36 zorunlu runtime yolu korunur; değişen dosyaların hash değerleri güncellenir. Onaylı sekiz çarkın özgün hash/alpha/geometrisi korunur. Yeni bildirilmiş modüller ve worker dosyaları aynı build hash listesi ve SW çevrimdışı hazırlığına eklenir. HTML SRI, index/nero eşitliği, build/manifest/cache kimlikleri doğrulandı. ZIP CRC ve 246 uygulama dosyasının arşivde birebir bulunması paketleme sırasında denetlenir.

Sayaçta önemli sınır: JavaScript bir tam kayıt bloğundan daha uzun askıya alınırsa kaç tam turun geçtiği yalnız currentTime ile kanıtlanamaz. Duvar saatinden varsayımsal tekrar üretilmez; bilinmeyen turlar eksik kalabilir.

Fiziksel eski Xiaomi, fiziksel Android sesi, uzun ekran kilidi, gerçek tarayıcı çizimi ve donanım çökmesi testleri NOT_RUN. Kod/model kontrolleri duyulur takılmanın kesin nedenini veya bütün çökme nedenlerinin giderildiğini kanıtlamaz. Takılmasızlık, kesintisizlik veya çökmesizlik garantisi verilmez. r979 siyah ekran olayının kesin fiziksel nedeni mevcut kanıtla belirlenmemiştir.

## Bu sürümün sınırları

- 32 MiB sınırı kabul edilen ses hazırlama işlemlerinin tahmini çalışma belleğidir; bütün tarayıcı belleğini sınırlamaz. Kaynak en çok 8 MiB, doğrulanmış süre en çok 60 saniye, kanal mono/stereo olmalıdır. Güvenilir süre/kanal bilgisi okunamayan biçimlerde Studio düzenlemesi yapılmaz; asıl ses silinmez.

- Yerel decodeAudioData tarayıcı API’sinde çalışır ve zorla iptal edilemez. Zaman aşımında geç sonuç kullanılmaz; yerel decode bitene kadar sıra rezervasyonu tutulur. Diğer VH/Hybrid ambiyans decode yolları bu Studio kapsamının dışındadır.

- İlerleme günlüğünün bütünlük kontrolü yanlışlıkla bozulmayı yakalamak içindir; güvenlik imzası değildir. Günlük boyutu sınırlıdır. Depolama hatasında uyarı gösterilir; ekran kilidi veya işletim sisteminin işlemi sonlandırması sırasında bütün son tekrarların kalıcı yazılması garanti edilemez.

- Akıllı sırada süreye bağlı, manuel ve zamanlı ses/ara adımı kurtarılırken mevcut adım güvenli başlangıcından alınır. Geçen duvar saatinden varsayımsal tekrar, okuma veya süre tamamlanması üretilmez.

- Bu günlük tekil zikir, 28/99 seyir ve akıllı R170 oturum kapsamını birleştirir. GlobalQueue ve diğer modüllerin bağımsız kayıtları bu kapsamda tek günlüğe taşınmadı.

- Sekme koruması aynı köken ve tarayıcı depolama kapsamı içindir. Web Locks olmayan cihazda atomik ve zaman aşımına uğramayan IndexedDB sahipliği kullanılır; sahipsiz fallback kilidini temizlemek açık kullanıcı doğrulaması ister. Harici ya da eski doğrudan veritabanı yazıcıları fiziksel olarak bu korumalarla denetlenemez.

- Health Check gözlemi medya saati ve uygulama durumunu inceler; fiziksel duyulur ses, uzun ekran kilidi, gerçek eski Xiaomi performansı veya çökmesizlik kanıtı değildir.

Geçmiş raporlar arşivdir; güncel rapor bu dosyadır.
