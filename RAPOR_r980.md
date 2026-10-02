# SÜKÛN r980 — tempo ve kayıt akışı sağlamlaştırması

r979 tam paketi üzerine hazırlanmıştır. Uygulama, SW, manifest, güncel build ve cache kimlikleri birlikte r980 / 20261002-v13 olarak eşleştirildi. Bu paket tam web/PWA kaynağıdır; canlı GitHub yayını yapılmadı.

## Uygulanan değişiklikler

- Ortak tempo kontrollerinde en düşük değer 0,6 saniye, ilk kullanım değeri 1 saniye. Geçerli kayıtlı kullanıcı seçimi korunur; isim değişimi, rutin yükleme ve oturum kurtarma seçilmiş tempoyu değiştiremez.

- Kısa tekil kayıtlar aynı ses öğesinde en fazla 16 tekrar ve 8 MiB içeren küçük WAV bloklarıyla çalınır. Sayaç her okumanın gerçek süresini ayrı izler; blok süresini tek okuma saymaz. Bu, sık kayıt başa sarma işlemlerini azaltır.

- Sayaç duraklama, takılma, ileri/geri sarma ve ses kaynağı değişiminde yalnız gözlenen medya ilerlemesini kullanır. Eski ses kaynağının gecikmiş olayları yeni isme tekrar yazamaz. 28/99 seyirlerinin kelime sonu ve ara düzeni korunur.

- Dekoratif çizim yükü etkin tasarruf ve geçici performans durumuna göre azaltılır; tek çizim zamanlayıcısı korunur. Sesle bağlı eski Tekke işinin mevcut kullanıcı profiline göre zamanlaması korunur. Bu koruma tempo, okuma hızı, eko ve ses tercihlerini değiştirmez.

- Mikrofon kaydı, kayıt düğmesine basıldığında seçili isimle eşleştirilir. İzin/hazırlık sırasında çift dokunuş ikinci kayıt açmaz; başlatma hatalarında mikrofon ve oturum kaynakları temizlenir. Hata açıklaması Türkçe ve İngilizce sunulur.

- r979 kilitten dönüş görünümü, r978 terkip/eko ve önceki manuel ses, dokunma/kaydırma ve çark özellikleri korunur. Fiziksel telefon sonucu bu ortamda ölçülmedi.

## Tempo kuralı

En düşük seçilebilir tempo 0,6 saniyedir. Yeni kurulumun başlangıç değeri 1 saniyedir. Önceden kullanıcının seçtiği geçerli değer korunur. Düşük donanım, ekran kilidi, görünür dönüş, isim geçişi veya görsel kalite seçilmiş tempoyu kendiliğinden değiştirmez.

Tekil kayıt döngüsünde gerçek başlangıç aralığı, seçilen tempo ile kayıt süresinin okuma hızına göre düzeltilmiş süresi + 40 ms arasındaki büyük değerdir. Örneğin 1,2 saniyelik normal hızlı kayıt, 0,6 saniye seçilse de en az yaklaşık 1,24 saniyelik aralık ister. Bu kayıt tamamlanma korumasıdır; kullanıcının tempo değeri değişmez. Seyirde kelime bitimi sonrası ara mantığı korunur. Terkip tamamlanmadan yeni bütün okuma başlatılmaz.

## Doğrulama

32 regresyon süiti geçti. Önceki 27 süitin tamamı bu sürümde tekrar çalıştırıldı. Güncel kayıt akışı, tempo, kullanıcı seçimi koruması, kısa döngü sayımı ve görsel zamanlayıcı testleri aynı kaynakla çalışır. Mevcut terkip, eko, TTS ayarları, manuel ses, dokunma/kaydırma, çark ve çevrimdışı SW kapsamları korunur. Süit ve ham çıktı listesi integration/r980/evidence/r980_regression_runs.json içindedir.

261 JavaScript kaynağı ayrıştırıldı; 31 zorunlu runtime hash doğrulandı. Önceki 31 zorunlu varlık ve onaylı sekiz çarkın özgün hash/alpha/geometrisi korunur. HTML SRI, index/nero eşitliği, SW zorunlu dosya kayıtları, build/manifest/cache kimlikleri doğrulandı. ZIP CRC ile 239 uygulama dosyasının arşivde birebir bulunduğu paketleme sırasında denetlenir.

Sayaçta önemli sınır: JavaScript bir tam kayıt bloğundan daha uzun askıya alınırsa kaç tam turun geçtiği yalnız currentTime ile kanıtlanamaz. Bu durumda duvar saatinden varsayımsal tekrar üretilmez; bilinmeyen turlar eksik kalabilir.

Fiziksel eski Xiaomi, fiziksel Android sesi, uzun kilit, gerçek tarayıcı çizimi ve donanım çökmesi testleri NOT_RUN. Kod/model kontrolleri duyulur takılmanın kesin nedenini veya bütün çökme nedenlerinin giderildiğini kanıtlamaz. Raporlarda takılmasızlık, kesintisizlik veya çökmesizlik garantisi verilmez. r979 siyah ekran olayındaki kesin fiziksel neden mevcut kanıtla belirlenmemiştir.

## İncelenen ek öneriler — onay bekliyor

- Öncelik 1 — Ses kayıtlarını çözme, efekt hazırlama ve WAV üretimini ayrı iş parçacığına taşıma; çözme başlamadan ortak bellek sınırı koyma. Uzun kayıtların eski telefonlarda ana ekranı kilitleme ve bellek baskısı riskini azaltmak için önerilir.

- Öncelik 2 — Birden fazla sekme arasında tek ses oturumu sahipliği kurma. İki sekmenin aynı anda zikir çalmasını ve oturum kayıtlarını birbirinin üzerine yazmasını önlemek için önerilir.

- Öncelik 3 — Seçilen tempo ile kaydın tamamlanmasına bağlı gerçek tekrar aralığını ayrı gösterme; Health Check'e kullanıcının başlattığı kısa cihaz denemesi ekleme. Kullanıcı, 0,6 saniye seçiminin uzun kayıtta neden daha uzun aralık verdiğini sade bir açıklamayla görebilir.

- Sonraki kapsam — Seans, seyir ve kapanış kayıtlarını tek doğrulanmış kurtarma günlüğünde birleştirme; canlı 8D hareketini çizim zamanlayıcısından ses saatine taşıma. Veri geçişi ve fiziksel cihaz ölçümü gerektirdiği için ayrı onay kapsamıdır.

Bu ek öneriler bu paket kapsamında uygulanmadı. Kullanıcının onayıyla sonraki sürümde ayrı kapsam ve ölçümle ele alınabilir. Geçmiş raporlar arşivdir; güncel rapor bu dosyadır.
