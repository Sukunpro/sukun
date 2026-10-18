# SÜKÛN r1098 — Kayıtların başını koruyan oynatma

Normal zikir, önizleme ve havuzdan tekrar oynatılan kayıtlar da artık ses yolu hazırlanarak başlar. Önceki sürüm yalnız niyet ve Akıllı Seans okumalarını bu şekilde başlatıyordu. Yoğun sahne çizimi `playing` olayını veya `play()` sonucunu geciktirdiğinde normal kaydın medya saati ilerleyip ilk heceler sessizde kalabiliyordu. Yeni davranışta ham medya seviyesi oynatmadan önce hazırdır; grafik yolunun 18 ms açılışı ses saatinde önceden planlanır. Geç gelen bildirim açılışı yeniden sıfırlamaz.

Oynatma, kalite analizinin tahmin ettiği sessizlik sınırlarına göre kaydı ileri sarmaz veya erken bitirmez. Düşük sesli “Yâ”, “Berhe…” ve son heceler sessizlik sanılarak atlanmaz. Normalizasyon ve analiz ölçümleri korunur; oynatma için alınan kopyada kırpma kapatılır. Stüdyodaki açık Normalize / Sessizlik kırp işlemleri ayrı kalır. Önceden düzenlenerek dosyadan silinmiş ses bu değişiklikle geri üretilemez.

Kayıttaki mevcut baş/son boşluklar da çalındığından tekrarın toplam süresi önceki otomatik kırpmaya göre uzayabilir. Mevcut kaynak önceliği, eko, mekânsal ses, okumalar arası bekleme ve kayıt dosyaları değiştirilmez. Kullanıcının sıfır ses tercihi, geçerli bölüm devam konumu ve Duraklat/Bitir sahipliği korunur.

## Doğrulama

`tests/r1098/verification.json` son kaynak ve test kanıtlarını içerir. Kontrollü olay testleri önceki kodda başlangıç kesilmesini yeniden üretir. Ayrı Chromium kontrolleri gerçek medya saati ve bilerek düşük seviyede başlayan yapay WAV kullanır; kullanıcının özel kayıtları okunmaz.

Klasik / Feyz temel alınır. Fiziksel Samsung/Android ses çıkışı, mikrofon ve ekran kilidi için bu tarayıcı sonuçları cihaz kabulü değildir. Stüdyo süre/bellek sınırları r1097 ile aynıdır.
