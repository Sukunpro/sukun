# SÜKÛN r954 — Kilitte sonraki isimde eko ve 8D

r953'te soğuk kilit kaydı yalnız sessizlik eklenmiş ham PCM'e dönüyordu. Efektli kaynak sadece görünürken veya aynı isim önbellekteyken hazırlanıyordu. Böylece sonraki isim kilitte efektsiz, ekran açılınca yeniden efektli çalıyordu.

## Düzeltme
- Kilit kaynağı hem görünür hem gizli durumda doğrudan PCM örneklerinden eko ve stereo hareketle hazırlanır. OfflineAudioContext.startRendering beklenmez. Decode işlemi hâlâ tarayıcının ses çözümleyicisini kullanır.
- 28/99 seyir efekt hazırlığı da aynı PCM çekirdeğini kullanır; mevcut kuyruk, önbellek, kayıt geçersizleştirme ve sahiplik kontrolleri korunur.
- Mevcut tempo hesabı ve native playbackRate/preservesPitch akışı korunur. Efektler tekil çevrimin süresini uzatmaz; çevrimi aşan yankı kuyruğu kesilir.
- Kilit sesi için önceki rastgele impulse reverb yerine 90/185/310 ms erken yankılar kullanılır. Bu nedenle yankı karakteri önceki kilit kaynağından farklı duyulabilir. 8D'nin stereo hareketi kayıt içine basılır; mono kayıttan da stereo çıktı üretilir.
- Eski hazırlık yeni ismin üzerine yazamaz. Bellek sınırı aşılırsa tanı kaydı bırakılır; mevcut güvenli ses devamı yolu korunur. Çok uzun/büyük veya çözülemeyen kayıtlarda efekt garantisi yoktur.
- Kaynak ZIP içindeki index.html 3.997.696 baytta, bir script ortasında kesiliyordu. Tam nero.html temel alınarak iki giriş eşitlendi.
- HTML, manifest, Service Worker ve son sürüm işaretleri r954'e getirildi. r953 otomatik ilerleme düzeltmesi korunmuştur. Görseller ve çalışma zamanı modülleri değiştirilmedi.

## Test kapsamı
Node VM içinde üretim fonksiyonları kullanılarak 50 kontrol geçti: 0,5/1/2 hız; eko açık/kapalı; 8D açık/kapalı; mono/stereo; gerçek üretilen WAV içinde yankı ve kanal farkı; soğuk isim değişimi; görünür/gizli WAV bayt eşitliği; seyir önbelleği; ayar/kayıt geçersizleştirme; gecikmiş hazırlığın reddi; bellek sınırı. 242 çalıştırılabilir inline script sözdizimi denetiminden geçti. Bu testte decodeAudioData yerine sentetik çözümlenmiş ses kullanıldı.

Tarayıcı testi yapılmadı: yerel Chromium bulunamadı, indirme başarısız oldu. Fiziksel Android kilidi, gerçek kayıt çözümleme, ses odağı ve işletim sistemi süreç dondurması doğrulanmadı. Cihazda kesin çözüldü iddiası yoktur.

## Yükleme ve telefon testi
ZIP içeriğini mevcut site köküne birlikte yükleyin; assets klasörünü birleştirin. Kayıtlarınızı ve uygulama verilerini temizlemeyin. Aktif okumayı durdurduktan sonra güncelleyin; uygulama/SW r954 eşleşmesini kontrol edin.

1. Kulaklıkla kendi kayıt sesini seçin; eko ve 8D'yi açın.
2. Berhetiyye otomatik sonraki isim + ebced ile Tûrânin'i başlatın. Hedef dolmadan telefonu kilitleyin.
3. En az iki isim geçişini ekranı açmadan dinleyin. Eko ve stereo hareket yeni isimlerde sürmeli; tekrar aralığı değişmemeli.
4. Kilidi açıp yeniden kapatın. Ardından 28 Berhetiyye ve 99 Esmâ seyirlerinde aynı denemeyi yapın.
5. Duraklat/devam ve bitir düğmelerini deneyin. Sorun tekrarlanırsa hemen r954 sağlık raporunu indirin.
