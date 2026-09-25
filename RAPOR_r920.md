# SÜKÛN r920 — Oturum, sahne ve dokunma güncellemesi

25 Eylül 2026 · Temel paket: r918 · Onaylanan r919 ve r920 çalışması

## Kurulum

ZIP içeriğini mevcut uygulama klasörünün üzerine **birleştirerek** kopyalayın. Mevcut `assets` klasörünü ve kendi seslerinizi silmeyin. `index.html`, `nero.html`, `sw.js`, manifest, sürüm dosyaları ve `assets/runtime` dosyaları birlikte yüklenmelidir. Yeni sürüm hazır bildirimi çıktığında Güncelle kullanılabilir; devam eden veya duraklatılmış oturum bitmeden yeniden yükleme yapılmaz.

Bu bir güncelleme paketidir. Eski sürümlerin bütün medyasını kapsayan temiz kurulum paketi olduğu iddia edilmez: tarihsel kaynakta hâlâ pakette bulunmayan 38 eski dosya referansı vardır; bazıları artık kullanılmayan yollardır. Bu sürüm yeni eksik asset yolu eklemez. Tarayıcı kayıtları aynı alan adı ve aynı tarayıcıda korunur. Canlı siteye bu çalışma sırasında yayın yapılmadı.

## Uygulanan düzeltmeler

- Esmâ ve Berhetiyye tek ortak zikir/seyir düzenini kullanır. Her biri kendi isimlerini, çarkını ve sahnesini gösterir; ikinci bir sayaç oluşturulmadı. Ek araçlar açıldığında da eski çark kopyası gizli kalır.
- SessionState mevcut oynatma ve sayaç otoritelerinden ortak durum üretir. Frekans veya ambiyans çalması tekil zikir sayacını yanlışlıkla kilitlemez. Oynatma komutları mevcut motorlara yönlendirilir.
- Stop ve isim değişimi eski ses hazırlıklarını geçersiz kılar. Yeni seyir, önceki oturumun Stop temizliği bitene kadar bekler; bu sırada yeni Stop veya seçim gelirse bekleyen başlangıç iptal edilir.
- Kendi kayıt varsa TTS'ye geçilmez. Kendi kayıt açılamazsa oturum duraklar, sayaç korunur ve yeniden deneme sunulur. Kaynak etiketi kendi kayıt, yerel kayıt, kayıtlı okuyucu ve TTS'yi ayırır.
- Kanonik 28 isim mevcut isim → sahne eşleşmesini kullanır. 1 Berhetîhin, 10 Hûtîrin ve 11 Kalnehûdin'in onaylı sahneleri korunur. Sayaç/pause sahneyi yeniden seçmez; otomatik isim ilerlemesi sahneyi değiştirir.
- Sahne önce çözümlenir, sonra gösterilir. Başarısız WebP için özgün sahne denenir; o da açılamazsa gradyan ve Yeniden Dene görünür. Eski istek yeni sahneyi ezemez. Bir sonraki sahne için sınırlı ön yükleme yapılır; Tasarruf/veri tasarrufu bunu kapatır.
- Sahne değişiminde yaklaşık 1,2 saniyelik çözünme vardır. Tasarruf ve azaltılmış hareket tercihinde geçiş sadeleşir.
- Tefekkürde aynı çark ve ilerleme kullanılır. Üst sağdaki çıkış en az 44 × 44 px dokunma alanına sahiptir. Görünümden çıkış seansı durdurmaz veya yeniden başlatmaz. Eski çıkış özeti yeni ekranı örtmez; mevcut seans günlüğü korunur.
- Kısa isim duyurusunun düğmeler üzerindeki dokunmayı yakalaması engellendi. −1 mevcut geri alma komutuna bağlandı. Hedef ve Kalan için SVG simgeleri kullanılır.
- Seyir tekrar sayısı ve ara ayarları mevcut 28/99 motorunun gerçek kontrollerini yansıtır. Atlas kanonik 28/99 isim, ebced, açıklama, sahne ve mevcut ilerlemeyi gösterir. Tamamlanma işaretleri bu cihazda gözlenen olaylara dayanır; eski geçmiş uydurulmaz.
- Berhetiyye için Kristal Taç, Süleyman Mührü ve İnci Halkası seçenekleri korunur. İsteğe bağlı odak görünümü başlangıçta kapalıdır; görünür duraklat/çıkış kontrolleri kalır ve ilk dokunuş yutulmaz.
- Mini/Midi/Max aynı oturumun farklı ayrıntı düzeyleridir. Mini bar 68 px'dir. Ambiyansın Mini/Midi/Pro yoğunluğu kapalı kanalları veya kendi kayıt listesini erişilemez yapmaz.
- `?diag=1` ile sağlık görünümü ve JSON dışa aktarma sunulur. Ölçülmeyen cihaz/arka plan değerleri başarı diye gösterilmez.
- PWA güncellemesi tek yöneticide toplandı. HTML, manifest ve üç çalışma betiği birlikte doğrulanır; betikler SHA-256 ile kontrol edilir. Eksik veya yanlış dağıtım aktive olmaz. Açık Güncelle komutu olmadan otomatik yeniden yükleme yapılmaz.

## Doğrulama

| Senaryo | Kanıt |
|---|---|
| Sözdizimi | 241 satır içi betik, 3 çalışma betiği ve Service Worker |
| Paket bütünlüğü | 78 kontrol geçti; r918'deki 103 asset bayt bayt aynı |
| Sahne dosyaları | 35 WebP çözümleniyor; 28 özgün sahnenin SHA-256 değerleri korunuyor |
| İsim ve arka plan | 28/28 Berhetiyye sahnesi ve 99/99 Esmâ kimliği gerçek uygulamada doğrulandı |
| Sayaç bağımsızlığı | 5 artırma tam 5 sayım; yeni sahne çözümleme yok |
| Ses önceliği | IndexedDB WAV, bozuk kayıt, yeniden deneme, gecikmiş okuma/analiz ve Terkip: 8 senaryo |
| Oynatma | Kendi kayıtla başlat/duraklat/sürdür/bitir; Tefekkürde oturum korunması |
| Seyir | 28 ve 99 motorlarında kayıtla otomatik isim ilerlemesi, pause/resume/stop |
| Dokunma | 360/390/430 px, gerçek dokunma ve `elementFromPoint` kontrolleri |
| Küçük oynatıcı | Mini/Midi/Max geçişleri; ambiyansta kendi kayıt ve kapalı kanal erişimi |
| Sağlık raporu | Gerçek JSON dosyası indirildi; ölçülmeyen değerler açıkça ayrıldı |
| PWA | Yerel SW kurulumu, çevrimdışı açılış, önceki medya önbelleği; üç betiğin çevrimdışı hash doğrulaması |
| Eksik dağıtım | Yanlış betik içeriği yeni kurulumu engelledi; eski çalışan sürüm korundu |

`qa-r920/` sonuçları ve `QA_KAPSAMI.md` ayrıntılı kanıt içerir. Kontrollü sözleşme testleri ile tam uygulama testleri ayrı raporlanmıştır.

## Sınırlar

Testler yerel Chromium ve dokunmatik ekran benzetimiyle yapılmıştır. Fiziksel Android ekran kilidi, işletim sisteminin uygulamayı askıya alması, Bluetooth kesintileri ve cihaz mikrofonu bu ortamda doğrulanamadı. Bunlar için cihaz üzerinde başarı iddiası yoktur.

Bu sürüm aşamalı sağlamlaştırmadır. Bütün motorların baştan yazılması, beş ayrı ses bus'ı/ducking, yeni partikül sistemi, gelişmiş tamamlanma ritüeli ve 25 yeni görselin yeniden üretimi bu paketin tamamlanmış kapsamı değildir. Mevcut onaylı sahneler ve görsel varlıklar kullanıldı. Görsel kalite profilleri mevcut efekt yükünü sadeleştirir; cihaz GPU/FPS ölçümü yapılmadı.
