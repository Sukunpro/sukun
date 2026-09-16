SÜKÛN r836 — Otomatik sayım koruması ve erişilebilir zikir ayarları

Taban: r835. Canlı siteye yayımlanmadı.

Sayım:
- Aynı isim otomatik sayılırken çarka dokunmak, +1, eski elle sayma düğmesi, Enter veya Boşluk ek tekrar oluşturmaz.
- Kullanıcıya “Bu isim otomatik sayılıyor. Elle saymak için önce duraklat.” uyarısı gösterilir.
- Doğrudan otomatik zikir, 28 Berhetiyye seyri, 99 Esmâ seyri ve akıllı seans ayrı durumlarıyla denetlenir. Favoriler gerçek kaynak ismine çözülür.
- Otomatik motorun kendi tekrarları korunur. Duraklatınca elle sayım kullanılabilir. Farklı isim veya yalnız ambiyans çalması gereksiz kilit oluşturmaz.
- Klavye ile ayarlara müdahale, tuşu basılı tutma ve kaydırma hareketi fazladan sayım üretmez. Hedefin son tekrarında engellenen dokunma isim atlaması başlatmaz.

Ayarlar:
- Sayaç düğmelerinin altında “Tempo · Bendir · Zikir ayarları” doğrudan erişimi bulunur; aynı kontrol grubu tefekküre taşınır.
- Panel, uygulamanın gerçek tempo, bendir/davul, usûl, ses, titreşim, okuyuş ve hedef kontrollerini açar. Kontrol kopyaları oluşturulmaz; mevcut olay bağlantıları ve değerler korunur.
- Bendir artık mini/orta görünüm filtresiyle gizlenmez. Tempo ilk sırada, bendir ve usûl hemen ardından gelir.
- Önceki düzenleyiciler kontrolleri başka yere taşıdıysa açılışta gerçek öğeler geri toplanır. Panel kapanınca aynı öğeler yerine döner, odak açan düğmeye verilir.
- Açılıp kapanması sayacı sıfırlamaz ve tefekkürden çıkış başlatmaz.

Görseller:
- Dört yeni Süleyman temalı isim mockupu yalnız onay önerisi olarak üretildi. Yeni görseller bu çalışma sürümünde arka planlara bağlanmadı; mevcut isim-sahne seçimi değiştirilmedi.
- Mevcut 121 asset r835 ile SHA-256 bakımından aynı. Yeniden sıkıştırma yapılmadı. Animasyon katmanları ve dönüş yönleri değiştirilmedi.
- Berhetiyye/Jewel dosyaları assets/berhetiyye-premium/ altında kalır.

Kurulum:
- r835 kuruluysa SUKUN_r836_GITHUB_GUNCELLEME.zip içeriğini açıp GitHub site köküne klasör yapısını koruyarak yükle.
- Mevcut sürüm farklıysa veya bilinmiyorsa SUKUN_r836_TAM_PAKET.zip kullan. Güncelleme ZIP'i boş siteye kurmak için yeterli değildir.
- ZIP dosyasını tek başına siteye yüklemek uygulamayı güncellemez; içindeki index.html, nero.html, sw.js, manifest.webmanifest ve sürüm dosyaları kökte olmalıdır.
- Yayından sonra nero.html?v=r836 aç. Uygulama içi sürüm r836 görünmeli. Kullanıcı kayıtlarını veya yerel depolamayı silmek gerekmez.

Doğrulama:
- 126 sayaç/ses regresyon testi, 20 DOM/CSS testi, 11 Service Worker testi ve 15 yeni elle sayım/ayar testi geçti: toplam 172/172.
- 57 sabit kaynak yolu, 71 önbellek yolu, statik kimliklerin tekilliği ve arşiv bütünlüğü kontrol edildi.
- Testler DOM, kaynak ve VM işlev kontrolleridir; Android Chrome çizimi, gerçek dokunma, ses donanımı ve canlı site bu sürüm için doğrulanmış değildir.

Telefonda kontrol: otomatik zikri aç → çarka/+1'e dokun (sayıya yalnız otomatik tekrar eklenmeli, uyarı görünmeli) → duraklat → bir dokunma (bir tekrar) → Tempo/Bendir ayarını aç → ritim seç → tefekküre geçip aynı paneli aç.
