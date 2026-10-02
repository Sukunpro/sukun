# SÜKÛN r981 — kayıt ve oturum sağlamlaştırması

r980 tam paketi üzerine hazırlanmıştır. Uygulama, SW, manifest, güncel build ve cache kimlikleri birlikte r981 / 20261002-v14 olarak eşleştirildi. Bu paket tam web/PWA kaynağıdır; canlı GitHub yayını yapılmadı.

## Uygulanan değişiklikler

- Kilit için kayıt hazırlama, tekil kayıt döngüsü, hazırlanmış eko/8D ve kayıt kalite analizi tek sıradan yürütülür. PCM efekt, WAV paketleme ve kalite hesapları worker üzerinde; worker kullanılamazsa küçük parçalara bölünerek hazırlanır. İşlemden önce kayıt boyutu, doğrulanmış süre ve tahmini bellek sınırı denetlenir.

- İptal edilen, süresi dolan veya başka isme ait hale gelen hazırlığın geç sonucu yeni ses veya önbellek kaydı oluşturamaz. Kısa kayıtlara seçilen tekrar aralığı için gerekli sessizlik eklenir; kullanıcı temposu değiştirilmez.

- Aynı uygulama kökenindeki sekmeler arasında bir etkin zikir sahibi bulunur. Başlatma, dinleme, seyir, manuel sayım, kayıt izni ve ilerleme yazımları sahiplikle korunur. Duraklatılmış veya arka planda ses veren sekmenin hakkı sırf zaman geçti diye başka sekmeye verilmez. Bitir sonrası ses temizliği tamamlanınca sahiplik bırakılır.

- Yedek geri yükleme ve veri sıfırlama boştaki sekmede sesi açmadan özel veri yetkisi alır. İşlem sürerken zikir başlatma, manuel sayım ve mikrofon girişi engellenir; eski sayaç sonradan geri yüklenen veya silinen verinin üzerine yazılmaz. Etkin ya da duraklatılmış sahip önce Bitir ile oturumu sonlandırmalıdır.

- Tempo bilgisinde seçilen değer, hazırlanmış hedef aralık ve ölçülebilen etkin aralık ayrı açıklanır. Seyirde kelime sonrası ara ve bütün terkip okuması için farklı anlamlar korunur; bilinmeyen süre kesin sonuç gibi gösterilmez.

- Health Check'e kullanıcının başlattığı 12 saniyelik salt okunur cihaz gözlemi eklendi. Mevcut medya saati, sayaç ve kaynak uyumu gözlenir; test ses başlatmaz, sayacı veya ayarları değiştirmez. Görünürlük, kaynak ya da sahip değişirse gözlem iptal edilir. Duyulur ses ve ekran kilidi doğrulanmış gibi raporlanmaz.

- Yeni açıklamalar Türkçe ve İngilizce sunulur. Gözlem raporuna yalnız izin verilen sınırlı sayısal değerler ve durumlar eklenir; kayıt dosyaları, kaynak URL'leri veya zikir metinleri eklenmez. Yeni runtime ve worker dosyaları sürüm hash ve çevrimdışı hazırlık listesine alınır.

## Tempo kuralı

En düşük seçilebilir tempo 0,6 saniyedir. Yeni kurulumun başlangıç değeri 1 saniyedir. Kullanıcının geçerli kayıtlı değeri korunur. Düşük donanım, ekran kilidi, görünür dönüş, isim geçişi veya görsel kalite seçilmiş tempoyu kendiliğinden değiştirmez.

Tekil kayıt döngüsünde gerçek başlangıç aralığı, seçilen tempo ile kayıt süresinin okuma hızına göre düzeltilmiş süresi + 40 ms arasındaki büyük değerdir. Örneğin normal hızda 1,2 saniyelik kayıt, 0,6 saniye seçilse de yaklaşık 1,24 saniyelik aralık ister. Kullanıcının tempo değeri değişmez. Seyirde kelime bitimi sonrası ara mantığı korunur. Terkip tamamlanmadan yeni bütün okuma başlatılmaz.

## Doğrulama

38 regresyon süiti geçti. Önceki 32 süitin tamamı bu sürümde tekrar çalıştırıldı. Kayıt, tempo, kullanıcı seçimi, sayaç, performans, terkip, eko, TTS ayarları, manuel ses, dokunma/kaydırma, çark, kilitten görünüm dönüşü ve çevrimdışı SW kapsamları korunur. Süit ve ham çıktı listesi integration/r981/evidence/r981_regression_runs.json içindedir. Deterministik modeller ve gerçek kaynak kodu birlikte test edilir; bunlar gerçek cihazda duyulur ses veya çizim ölçümü değildir.

265 JavaScript kaynağı ayrıştırıldı; 36 zorunlu runtime hash doğrulandı. Önceki 31 zorunlu runtime yolu korunur; değişen dosyaların hash değerleri güncellenir. Onaylı sekiz çarkın özgün hash/alpha/geometrisi korunur. Yeni bildirilmiş modüller ve worker dosyaları aynı build hash listesi ve SW çevrimdışı hazırlığına eklenir. HTML SRI, index/nero eşitliği, build/manifest/cache kimlikleri doğrulandı. ZIP CRC ve 244 uygulama dosyasının arşivde birebir bulunması paketleme sırasında denetlenir.

Sayaçta önemli sınır: JavaScript bir tam kayıt bloğundan daha uzun askıya alınırsa kaç tam turun geçtiği yalnız currentTime ile kanıtlanamaz. Duvar saatinden varsayımsal tekrar üretilmez; bilinmeyen turlar eksik kalabilir.

Fiziksel eski Xiaomi, fiziksel Android sesi, uzun ekran kilidi, gerçek tarayıcı çizimi ve donanım çökmesi testleri NOT_RUN. Kod/model kontrolleri duyulur takılmanın kesin nedenini veya bütün çökme nedenlerinin giderildiğini kanıtlamaz. Takılmasızlık, kesintisizlik veya çökmesizlik garantisi verilmez. r979 siyah ekran olayının kesin fiziksel nedeni mevcut kanıtla belirlenmemiştir.

## Bu sürümün sınırları

- 32 MiB sınırı kayıt hazırlama hattının tahmini çalışma belleğidir; tarayıcının bütün belleğini sınırlamaz. Bu hattın kaynak sınırı 8 MiB, doğrulanmış süre sınırı 60 saniye, kanal sınırı mono/stereodur. Sınırı aşan veya güvenilir süre/kanal bilgisi okunamayan kaydın aslı korunur; hazırlanmış efekt kullanılamadığı açıkça belirtilir.

- decodeAudioData tarayıcının yerel API'sinde çalışır. Süresi dolan yerel decode zorla iptal edilemez; geç sonuç kullanılmaz ve decode çözülene kadar sıra rezervasyonu tutulur. Worker kapsamı dört kayıt hazırlama yoludur; Studio normalizasyon/kırpma, VH ve Hybrid ambiyans decode yolları bu sürümde taşınmadı.

- Sekmeler aynı köken ve tarayıcı depolama kapsamı içinde koordinasyon IndexedDB kaydını kullanır. Web Locks varsa gerçek kilit de tutulur; koordinasyon kaydı kullanılamıyorsa işlem başlamaz ve açık hata gösterilir. Web Locks bulunmadığında atomik, zaman aşımına uğramayan IndexedDB kaydı kullanılır. Sahipsiz kalan fallback kilidini temizlemek diğer sekmelerin kapatıldığına ilişkin açık kullanıcı doğrulaması ister; bu yol fiziksel olarak başka sekmenin sustuğunu kanıtlayamaz ve daha zayıf koruma olarak raporlanır.

- 12 saniyelik gözlem mevcut uygulamanın sunduğu medya saati ve durum bilgisini inceler. Fiziksel hoparlör sesini, uzun ekran kilidini, gerçek telefon performansını veya çökmesizliği kanıtlamaz. TTS ya da süre/kimlik bilgisi bulunmayan akışta ölçülemedi sonucu geçerli bir sonuçtur.

- JavaScript bir tam yerel kayıt bloğundan daha uzun askıya alınırsa yalnız currentTime ile geçen tam blok sayısı kanıtlanamaz. Duvar saatinden varsayımsal zikir sayısı üretilmez; bilinmeyen turlar eksik kalabilir.

- Sekme devralmada tekil zikir ve 28/99 seyir ilerlemesi güncel kayıttan alınır. Akıllı oturumun önceden yüklenmiş sıra/iç konumunun başka sekmedeki en yeni checkpoint ile yeniden kurulması bu sürümün kapsamı dışındadır; tek sürümlü ilerleme günlüğü önerisine bırakıldı.

## İncelenen ek öneriler — onay bekliyor

- Studio normalizasyon ve kırpma işlemlerini de aynı worker/bellek korumasına taşımak; uzun kayıt düzenlerken arayüz yükünü azaltmak.

- Oturum kurtarmada tek sürümlü ilerleme günlüğü kullanmak; sayaç, isim, seyir ve kurtarma kaydını aynı doğrulanmış checkpoint üzerinden geri yüklemek.

Bu ek öneriler bu paket kapsamında uygulanmadı. Kullanıcının onayıyla sonraki sürümde ayrı kapsam ve ölçümle ele alınabilir.

Geçmiş raporlar arşivdir; güncel rapor bu dosyadır.
