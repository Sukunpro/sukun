# SÜKÛN r968 — değişiklik ve doğrulama raporu

r967 tam kaynak paketinin üzerine hazırlanmıştır. Önceki terkip, vird, açılış, kilitli isim politikası ve çark gezinme değişiklikleri korunur.

## Görünüm

Alt panelin tamamı “Kontroller ve görünüm” kulakçığından açılıp kapanır. Önceki / Baştan başla / Sonraki / Tefekküre geç veya Tefekkürden çık / Bitir ve görünüm ayarları aynı bloktadır. Panel normal ve tefekkür görünümünde başlangıçta kapalıdır. Çarktaki oynat/duraklat, bitir, sayaç düzeltme ve önceki/sonraki düğmeleri kalır. Berhetiyye, 99 Esmâ ve diğer tekil zikir kategorileri aynı paneli kullanır. Tab ve Escape klavye desteği vardır; kapatılan içerikteki odak kulakçığa döner.

Hedef/Kalan iki eşit hücrede ortaya alınmıştır; değer fontu 18–22 px, uzun sayılarda 16 px olur. Atlas ve Seyir iki eşit genişlikli kontrol olarak ortalanmıştır. Berhetiyye’de Bitir yakut, tefekkür düğmeleri ametist, kulakçık billur artwork kullanır. Giydirmeyi örten eski plain-background kuralları kaldırılmıştır. Mevcut çarkların taşı/madenine göre önceki–sonraki düğmesi görselleri korunur.

## ±1 davranışı

- Tekil zikir başlamadan elle sayma mevcut yerel sayma/okuma yolunu kullanır.
- Tekil zikir veya 28/99 seyri duraklatılınca, bekleyen fiziksel okuma/başlatma/durdurma tamamlanmışsa ±1 bir sayaç düzeltmesidir. Yeni ses, niyet, otomatik tekrar veya isim geçişi başlatmaz.
- Seyir düzeltmesi seyri yöneten rep ve totalDone ile Z.count / Z.total ve kullanım muhasebesini birlikte günceller; kaydedilir. Sonraki devam düzeltilmiş sayaçtan sürer. Eski callback’ler token ve attemptSeq ile geçersiz kalır.
- Okuma sürerken, hazırlanırken, sistem bekletmesinde, hata durumunda, açılış/niyet beklerken veya tamamlanan seyirde düzeltme kapalıdır.
- −1 sıfırın altına inmez; başka isme veya önceki devre dönmez. Duraklatılmış +1 son tekrarı elle tamamlayıp yeni isme geçirmez: hedef−1 sınırında son tekrar Devam ile okunur. Hedefi 1 olan seyirde son tekrar yine sesle tamamlanır.
- Başlatılmamış seyir önizlemesinde düzeltme yapılmaz; önce seyri başlatıp duraklatmak gerekir. Düğmenin açıklaması/panel mesajı nedenini gösterir. Çark, alt panel ve eski elle sayma kontrolleri aynı kapıyı kullanır.
- Seyir göstergesi son tekrar sınırında da seyir sahibinin rep değerini okur; global devir sıfırlanması kalan değeri geriye çeviremez.

## Doğrulama

- 25 sayaç/sahiplik/yarış/sınır senaryosu PASS: integration/r968/evidence/counter_results.json.
- 14 açılış, terkip, haftalık vird, kilit politikası ve panel taşıma/geri yükleme senaryosu PASS: flow_results.json.
- 260 JS kaynak sözdizimi, 30 runtime hash, SRI ve index.html/nero.html eşitliği PASS: DOGRULAMA_r968.json.
- 20 çark × 6 boyut = 120 geometri denetimi PASS: navigation_results.json.
- 11 ses/DSP/iptal regresyonu PASS; uzun stereo bellek koruması doğrulandı: audio_unit_results.json.
- Service worker kurulum/çevrimdışı shell/hash/onarım denetimleri PASS: sw_unit_results.json.
- 184 sabit runtime/görsel bağlantısı mevcut; 184 raster görsel tam çözümlendi. Toplam 222 assets dosyası paket içindedir: asset_results.json.

Bu testler üretim fonksiyonlarının modellenmiş DOM, zaman ve medya ortamında yürütülmesidir. Gerçek tarayıcı çizimi, fiziksel Android ses/ekran kilidi ve kullanıcıdaki donmanın cihaz üzerinde yeniden üretimi yapılmadı. Telefon kabul kontrolü gerekir. Web/PWA tam dağıtım paketi hazırlanmıştır; APK/AAB veya mağaza yayını yapılmadı.
