# SÜKÛN r916 — Sayaç ve ambiyans onarımı

## Değişiklikler

- 99 Esmâ ve 28 Berhetiyye, aynı kumanda ve yerleşimi kullanan iki ayrı seyir görünümüne bağlandı. Her birinin adı, hedefi, sayısı ve durumu kendi seyir motorundan okunur. 99 Esmâ için iç çark eklendi. Tekil Zikir seçeneği mevcut sayaca döner; aynı anda ikinci çark gösterilmez.
- 99 Esmâ düğmeleri kendi sade turkuaz yüzeyini kullanır. Berhetiyye süslemesinin Niyet ve diğer Esmâ düğmelerine sızması giderildi. Berhetiyye için gönderilen kırmızı, yeşil ve altın düğmeler korundu; duraklat düğmesi mor görseli kullanır.
- Berhetiyye: Kristal Taç, Süleyman Mührü ve İnci Halkası olmak üzere üç çark seçilebilir. Tercih kaydedilir; değişiklik sayaç ve kayıtlara dokunmaz. İki yeni alternatif SVG olarak çizildi; gönderilen piksel görseller değiştirilmedi.
- 28 ismin özgün sahne dosyası eşlemeleri yeniden bağlandı. Berhetîhin, Hûtîrin ve Kalnehûdin özel dosya yolları korunur. Sahne seçicisinde «İsme göre otomatik» ya da sabit sahne kullanılabilir.
- Ambiyans grupları mini, midi ve pro modlarında açılır; açık grubun kapalı ses kanalları da görünür. Mod değiştirmek diğer açık panelleri topluca kapatmaz/açmaz. «Kendi Seslerim» kayıt yokken de görünür; mevcut kayıt veritabanı korunur.
- r898'in oluşturduğu çarkı r899'un tekrar silmesiyle oluşan sürekli DOM döngüsü kaldırıldı. Çakışan görsel yazıcılar tek yetkiye toplandı. Ambiyans açılışındaki tekrar eden yükseklik ölçümleri kaldırıldı. Seyir paneli kanonik yerleşim yenilenirken korunur.
- r916 sürüm, manifest ve servis çalışanı önbelleği eşitlendi. Ses motoru ve kilitli bölüm erişim denetimi korunur.

## Kontroller

- Chromium, gerçek uygulama: +1/−1, 99 seyrine geçiş, Rahmân adı, iç çark, hedefi 33 yapma, başlat/duraklat/sürdür/bitir, önceki/sonraki/yeniden başlat, Tekil Zikir'e dönüş kontrol edildi. Kilitli 28 sekmesi gizli kalır. JavaScript çalışma zamanı hatası gözlenmedi.
- Ambiyans: mini/midi/pro modlarının her birinde Doğa grubu dokunarak açıldı ve 12 kanal görünür oldu. Test kaydı Kendi Seslerim'de üç modda da göründü; IndexedDB'den sayfa yenilemesi sonrası geri yüklendi. Bu test ayrı tarayıcı profilinde yapıldı; kişisel kayıtlarınıza erişilmedi.
- 99/28 kumandaları, uygulamanın tüm stilleriyle izole bileşende sınandı: her düğme yalnız kendi motoruna tek komut gönderdi. 360, 390 ve 430 pikselde bir görünür çark ve yatay taşma olmadığı doğrulandı. Berhetiyye erişim politikası yalnız bu izole testte taklit edildi; uygulama kilidi aşılmadı.
- Eski r898/r899 çakışması izole testte 600 ms içinde 74 çocuk-düğüm değişikliği oluşturdu; yeni görsel yetkide 0. Bu, telefonun toplam performans ölçümü değildir. Gerçek uygulamanın iki saniyelik boşta kontrolünde uzun görev gözlenmedi.
- 241 çalıştırılabilir JavaScript bloğu ve servis çalışanı sözdizimi kontrol edildi. index.html ve nero.html aynı; 39 önbellek varlığı mevcut. ZIP ve SHA-256 listesi doğrulandı.

## Kurulum ve sınırlar

Arşivin içeriğini mevcut siteye **birleştirerek** aktarın. Mevcut assets klasörünü silmeyin. Canlı siteye bu oturumda yayın yapılmadı.

Özgün 28 sahne dosyası ile ana Mevlevî sahnesi mevcut kaynak arşivinde bulunmuyor. Bu paket özgün görsellerin kendisini geri üretemez: eski sitede dosyalar varsa özgün sahneler kullanılır; yoksa Berhetiyye için gönderilmiş sahneler yedek olarak görünür. «İsme göre otomatik» seçimi özgün eşlemeyi etkinleştirir.

Gerçek Android kilit ekranı, uzun süreli arka plan sesi ve tam 28/99 seyir bitişi cihazda test edilmedi. Test tarayıcısında konuşma sesi bulunmadığından gerçek ses doğrulaması yapılamadı; seyir motoru bu durumda tts-failed kaydetti. Düğme ve durum geçişleri doğrulandı. Tüm cihazlardaki bütün gecikmelerin giderildiği iddia edilmez.
