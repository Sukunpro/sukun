# SÜKÛN r957 — Ses ve önbellek kararlılığı

## Düzeltilen dört doğrulanmış hata

| r956 bulgusu | r957 davranışı |
|---|---|
| SUK-956-01: 1.500 ms dolunca eko/8D ve kayıt içi aralık kayboluyor | Yeni isim, efektli kaynak hazırlanana kadar başlatılmaz. Kaynak hazır olunca aynı işlem doğru eko, stereo ve aralıkla bir kez başlar. 15 saniyelik emniyet sınırı veya hazırlık hatası açık kayıt hatasıdır; ham kayıtla devam edilmez. |
| SUK-956-02: sıfır ses seviyesi yükseliyor | Ortak sayısal seviye hesabı sıfırı geçerli değer sayar. Native seyir, adım sesi, yankı taps, kilit yeniden başlatma ve ilgili TTS alt sınırlarında pozitif zorunlu minimum kaldırıldı. |
| SUK-956-03: yardımcı sayfa/ikon gezintisi uygulama HTML'ine dönüyor | Uygulama kabuğu yalnız kapsam kökü, index.html ve nero.html gezintilerinde kullanılır. Yardımcı HTML ve dosyalar kendi yanıtlarıyla ve ziyaret edildikten sonra kendi önbellekleriyle karşılanır. |
| SUK-956-04: yeni sorgu parametresi eski görseli döndürüyor | Normal kaynaklar tam URL ile eşleştirilir. Yeni sorgu parametresi ağdan yeni içerik alır; offline durumda yalnız tam eşleşen sürüm döner. Bilinmeyen sürüm yerine eski dosya verilmez. |

## Ek koruma
Efekt hazırlığı işlem sırası, kayıt anahtarı, ayar görüntüsü ve mevcut kullanıcı komutuyla sınanır. Geç tamamlanan eski isim, yeni ismin kaynağına yazamaz. Kullanıcı hazırlık sırasında durdurursa veya ses ayarını değiştirirse eski işlem oynatmaya başlayamaz. Kayıt varsa efekt hatasında TTS'e sessiz düşüş yapılmaz; mevcut kayıt hatası ve seyir duraklatma yolu devralır. Ses resolver'ındaki açık adım seviyesi native kaynağa aktarılır.

Sıfır ile eksik/geçersiz değer ayrılır. Tek fiziksel native medya kaynağı ve mevcut sahiplik sistemi kullanılır. Her hazırlık tamamlanınca yeni kaynağın eko, 8D ve bekleme aralığı birlikte seçilir; kelimenin ortasında geç efekt takılmaz. PCM bellek ve kaynak boyutu korumaları korunmuştur.

## Doğrulama
Başlangıç r956 index.html ve sw.js Git blob özetleri gönderilen hata raporuyla birebir eşleşti. Rapordaki test betikleri r957 üretim koduna uygulandı ve ek yarış koşullarıyla genişletildi.

- 12 ses senaryosu: 11 davranış kontrolü ve 1 kasıtlı bellek koruması kontrolü geçti. 1.700 ms hazırlık testinde 1.550 ms'de native play sayısı 0, hazırlık sonunda 1; efektli kaynak true, kayıt içi aralık 1.000 ms ve stereo true oldu.
- ZVOL=0 ve açık adım volume=0 yeni native kaynağın volume değerini 0 tuttu. Ana ses sıfırlandığında üç yankı elemanı da 0 oldu.
- Hazırlık başarısızlığı, durdurma, ayar değişimi, geç eski kaynak ve emniyet sınırından sonra geç tamamlanan hazırlığın oynatma yapmaması kontrolleri geçti.
- 17 Service Worker senaryosu kaydedildi: uygulama offline açılışı, doğrulanmış çalışma dosyaları, online/offline yardımcı sayfa ve PNG, sorgu parametresi yenileme, doğru offline sürüm, mevcut sürüm manifestinin offline açılması, bozuk JS onarımı/reddi ve ilk offline kurulum sınırı doğrulandı. SW-02/SW-05 mevcut kapsam sınırlarını kaydeder.
- 259 JavaScript ayrıştırması, 24 runtime SHA-256, SRI, iki HTML girişinin eşitliği ve r957 sürüm işaretleri doğrulandı. Yinelenen statik DOM id bulunmadı.

Ayrıntılar DOGRULAMA_r957.json ve integration/r957 altında. Yeni tarayıcı görsel testi veya canlı dağıtım yapılmadı. Testlerde medya ve CacheStorage benzetimi kullanıldı; gerçek kayıt decode, Android kilit ekranı ve işletim sistemi ses odağı ölçülmedi.

## Kullanım sınırları
Efekt hazırlığı ağır veya ilk kez kullanılan kayıtta isimler arasında ek bekleme olabilir. Hazırlık başarısız olursa sayaç ilerletilmeden duraklatma/hata yolu kullanılır; “her koşulda kesintisiz ses” iddiası yoktur. Büyük PCM kayıtları koruma sınırına takılabilir.

Bu sürüm tam görsel offline paketi eklemez. Daha önce açılmayan görseller bağlantı gerektirebilir. HTML/CSS yama katmanlarının geniş çaplı temizliği ve uzun süreli Android performans ölçümü bu düzeltmeye dahil değildir.

## Yükleme ve telefon kabul testi
ZIP içeriğini mevcut köke birlikte yükleyin, assets klasörünü birleştirin. Kullanıcı verilerini veya paket dışında kalan tarihsel dosyaları silmeyin. Aktif okumayı durdurduktan sonra güncelleyin ve uygulama/SW r957 eşleşmesini kontrol edin.

1. Kendi kayıtla 28 ve 99 seyirde eko + 8D açıkken en az iki isim geçişini kilitte dinleyin. İlk hazırlıkta kısa bekleme olabilir; yeni kayıt efektsiz başlamamalı.
2. Zikir sesini başlatmadan önce 0 yapın; isim değişimi, kilitle/aç ve duraklat/devam sırasında 0 kalmalı. Sonra sesini açın.
3. Hazırlık sırasında durdurun veya başka isim seçin; eski kayıt sonradan başlamamalı.
4. CARKLAR_ONIZLEME.html ve ikon adresini açın; ana uygulama yerine kendi içerikleri gelmeli.
5. Önceden açılmış sahneyle uçak modunu deneyin. Hiç açılmamış sahnenin offline hazır olması beklenmemeli.
6. 5/30 dakika gerçek Android kilidi, medya tuşları, sayaç/sıra ve yedekten geri yükleme testlerini cihazda tamamlayın. Sorun anında r957 sağlık raporunu alın.
